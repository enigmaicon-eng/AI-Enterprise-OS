# Agent Extractor
# Parses agent definition files to extract AGENT entities with capabilities, tools, and org relationships

## Agent Entity Extraction

```python
def extract_agent(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_agent_markdown(content)
    agent = entity_resolution.deduplicate_entity(
        entity_type="AGENT",
        canonical_label=parsed.name,
        properties={
            "org_id":           parsed.org_id,
            "trust_tier":       parsed.trust_tier,
            "specializations":  parsed.specializations,
            "status":           parsed.status,   # ACTIVE | SUSPENDED | INACTIVE
            "wiki_page":        parsed.wiki_page,
            "source_file":      file_path,
        },
        source="agent-extractor",
        confidence=0.92,
    )
    rel_count = AgentRelationshipBuilder(agent, parsed).build_all()
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)

class AgentRelationshipBuilder:
    def __init__(self, agent: EntityVertex, parsed: ParsedAgent):
        self.agent = agent
        self.parsed = parsed
        self.count = 0

    def build_all(self) -> int:
        self._link_organization()
        self._link_specializations()
        self._link_tools()
        self._link_collaboration_peers()
        self._link_escalation_target()
        self._link_reports_to()
        self._link_contracts()
        return self.count

    def _link_organization(self):
        org = entity_resolution.resolve_entity(self.parsed.org_id, "ORGANIZATION")
        if not org:
            # Create org entity placeholder if not yet ingested
            org = entity_resolution.deduplicate_entity(
                entity_type="ORGANIZATION",
                canonical_label=self.parsed.org_id,
                properties={"org_type": "UNKNOWN"},
                source="agent-extractor",
                confidence=0.70,   # placeholder — will be overwritten by org file ingestion
            )
        create_relationship(self.agent.entity_id, org.entity_id, "BELONGS_TO",
                            confidence=0.95, source_type="EXPLICIT")
        self.count += 1

    def _link_specializations(self):
        for spec in self.parsed.specializations:
            cap = entity_resolution.deduplicate_entity(
                entity_type="CAPABILITY",
                canonical_label=spec,
                properties={"capability_domain": infer_domain(spec)},
                source="agent-extractor",
                confidence=0.80,
            )
            create_relationship(self.agent.entity_id, cap.entity_id, "SPECIALIZES_IN",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_tools(self):
        for tool_name in self.parsed.tools:
            tool = entity_resolution.deduplicate_entity(
                entity_type="TOOL",
                canonical_label=tool_name,
                properties={
                    "tool_type":          infer_tool_type(tool_name),
                    "trust_tier_required": self.parsed.trust_tier,
                    "scope":              "AGENT_DEFINED",
                },
                source="agent-extractor",
                confidence=0.85,
            )
            create_relationship(self.agent.entity_id, tool.entity_id, "HAS_TOOL",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_collaboration_peers(self):
        for peer_label in self.parsed.collaboration_peers:
            peer = entity_resolution.resolve_entity(peer_label, "AGENT")
            if peer:
                # COLLABORATES_WITH is bidirectional — create both directions
                create_relationship(self.agent.entity_id, peer.entity_id, "COLLABORATES_WITH",
                                    confidence=0.85, source_type="EXPLICIT")
                create_relationship(peer.entity_id, self.agent.entity_id, "COLLABORATES_WITH",
                                    confidence=0.85, source_type="EXPLICIT")
                self.count += 2
            else:
                # Register as forward reference — will be resolved on next ingestion cycle
                forward_reference_registry.register(peer_label, "AGENT",
                                                    self.agent.entity_id, "COLLABORATES_WITH")

    def _link_escalation_target(self):
        if not self.parsed.escalation_target:
            return
        target = entity_resolution.resolve_entity(self.parsed.escalation_target, "AGENT")
        if target:
            create_relationship(self.agent.entity_id, target.entity_id, "ESCALATES_TO",
                                confidence=0.95, source_type="EXPLICIT")
            self.count += 1

    def _link_reports_to(self):
        if not self.parsed.reports_to:
            return
        lead = entity_resolution.resolve_entity(self.parsed.reports_to, "AGENT")
        if lead:
            create_relationship(self.agent.entity_id, lead.entity_id, "REPORTS_TO",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_contracts(self):
        for contract_label in self.parsed.governed_contracts:
            contract = entity_resolution.resolve_entity(contract_label, "CONTRACT")
            if contract:
                create_relationship(self.agent.entity_id, contract.entity_id,
                                    "GOVERNED_BY_CONTRACT",
                                    confidence=0.90, source_type="EXPLICIT")
                self.count += 1
```

## Forward Reference Resolution

Agents may reference peers not yet ingested. Forward references are resolved after all
agents have been extracted:

```python
def resolve_forward_references():
    for ref in forward_reference_registry.get_pending():
        target = entity_resolution.resolve_entity(ref.target_label, ref.target_type)
        if target:
            create_relationship(ref.source_id, target.entity_id, ref.edge_type,
                                confidence=0.85, source_type="EXPLICIT")
            forward_reference_registry.mark_resolved(ref)
        else:
            # Still unresolved — log as knowledge gap
            knowledge_gap_detector.log_missing_entity(
                entity_type=ref.target_type, label=ref.target_label,
                referenced_by=ref.source_id
            )

def extract_all_agents() -> ExtractionResult:
    total = ExtractionResult()
    for f in glob_files("agents/**/*.md"):
        total.merge(extract_agent(f))
    # Resolve forward references after all agents are ingested
    resolve_forward_references()
    return total
```

## Integration Points

- `ingestion-pipeline.md`: first phase in INGESTION_PHASES — runs before workflow extraction
- `knowledge-inference/inference-rules.md`: R001 (TRANSITIVE_DELEGATION) starts from DELEGATES_TO edges created here
- `knowledge-inference/inference-rules.md`: R011 (CIRCULAR_DELEGATION) detects cycles in ESCALATES_TO and DELEGATES_TO graphs
- `graph-observability/coverage-analyzer.md`: counts agent files on disk vs AGENT entities in graph
- `enterprise-telemetry/enterprise-event-bus.md`: org.agent.lifecycle events trigger delta re-extraction
