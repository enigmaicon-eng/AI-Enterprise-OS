# Workflow Extractor
# Parses workflow definitions, orchestrator files, and integration connectors into graph entities

## Supported Source Files

- `workflows/*.md` — workflow definitions
- `orchestrator/*.md` — orchestrator routing and delegation logic
- `integration-fabric/connectors/*.md` — external integration connectors

## Workflow Entity Extraction

```python
def extract_workflow(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_workflow_markdown(content)
    workflow = entity_resolution.deduplicate_entity(
        entity_type="WORKFLOW",
        canonical_label=parsed.name,
        properties={
            "workflow_type":             parsed.workflow_type,
            "required_capabilities":     parsed.required_capabilities,
            "produces_artifact_types":   parsed.produces,
            "consumes_artifact_types":   parsed.consumes,
            "slo_target_ms":             parsed.slo_target_ms,
            "governance_gates":          parsed.approval_gates,
            "source_file":               file_path,
        },
        source="workflow-extractor",
        confidence=0.90,
    )
    rel_count = WorkflowRelationshipBuilder(workflow, parsed).build_all()
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)

class WorkflowRelationshipBuilder:
    def __init__(self, workflow: EntityVertex, parsed: ParsedWorkflow):
        self.workflow = workflow
        self.parsed = parsed
        self.count = 0

    def build_all(self) -> int:
        self._link_required_capabilities()
        self._link_artifact_types()
        self._link_assigned_agents()
        self._link_governance_policies()
        self._link_sub_workflows()
        return self.count

    def _link_required_capabilities(self):
        for cap_label in self.parsed.required_capabilities:
            cap = entity_resolution.deduplicate_entity(
                entity_type="CAPABILITY",
                canonical_label=cap_label,
                properties={"capability_domain": infer_domain(cap_label)},
                source="workflow-extractor",
                confidence=0.80,
            )
            create_relationship(self.workflow.entity_id, cap.entity_id, "REQUIRES_CAPABILITY",
                                confidence=0.90, source_type="EXPLICIT")
            self.count += 1

    def _link_artifact_types(self):
        for art_type in self.parsed.produces:
            artifact_schema = entity_resolution.deduplicate_entity(
                entity_type="ARTIFACT",
                canonical_label=f"schema:{art_type}",
                properties={"artifact_type": art_type, "classification": "SCHEMA"},
                source="workflow-extractor",
                confidence=0.75,
            )
            create_relationship(self.workflow.entity_id, artifact_schema.entity_id, "PRODUCES",
                                confidence=0.85, source_type="EXPLICIT")
            self.count += 1
        for art_type in self.parsed.consumes:
            artifact_schema = entity_resolution.resolve_entity(f"schema:{art_type}", "ARTIFACT")
            if artifact_schema:
                create_relationship(self.workflow.entity_id, artifact_schema.entity_id, "CONSUMES",
                                    confidence=0.85, source_type="EXPLICIT")
                self.count += 1

    def _link_assigned_agents(self):
        for agent_label in self.parsed.assigned_agents:
            agent = entity_resolution.resolve_entity(agent_label, "AGENT")
            if agent:
                create_relationship(self.workflow.entity_id, agent.entity_id, "DELEGATES_TO",
                                    confidence=0.88, source_type="EXPLICIT",
                                    properties={"delegation_scope": "workflow_execution"})
                self.count += 1

    def _link_governance_policies(self):
        for gate in self.parsed.approval_gates:
            policy_label = gate.get("policy") or gate.get("gate_type")
            if policy_label:
                policy = entity_resolution.resolve_entity(policy_label, "POLICY")
                if policy:
                    create_relationship(self.workflow.entity_id, policy.entity_id, "GOVERNED_BY",
                                        confidence=0.90, source_type="EXPLICIT")
                    self.count += 1

    def _link_sub_workflows(self):
        for sub_wfl_label in self.parsed.sub_workflows:
            sub_wfl = entity_resolution.resolve_entity(sub_wfl_label, "WORKFLOW")
            if sub_wfl:
                create_relationship(self.workflow.entity_id, sub_wfl.entity_id, "DELEGATES_TO",
                                    confidence=0.85, source_type="EXPLICIT",
                                    properties={"delegation_scope": "sub_workflow"})
                self.count += 1
```

## Integration Connector Extraction

```python
def extract_integration_connector(file_path: str) -> ExtractionResult:
    content = read_file(file_path)
    content_hash = sha256(content.encode()).hexdigest()
    if ingestion_pipeline.should_skip_ingestion(file_path, content_hash):
        return ExtractionResult(status="SKIPPED")

    parsed = parse_connector_markdown(content)
    integration = entity_resolution.deduplicate_entity(
        entity_type="INTEGRATION",
        canonical_label=parsed.connector_name,
        properties={
            "connector_type":     parsed.connector_type,
            "system_name":        parsed.system_name,
            "auth_method":        parsed.auth_method,
            "trust_tier":         parsed.trust_tier,
            "rate_limit":         parsed.rate_limit,
            "data_classification": parsed.data_classification,
            "webhook_topics":     parsed.webhook_topics,
            "source_file":        file_path,
        },
        source="workflow-extractor",
        confidence=0.90,
    )
    # Link integration to workflows that use it
    rel_count = 0
    for workflow_label in parsed.used_by_workflows:
        workflow = entity_resolution.resolve_entity(workflow_label, "WORKFLOW")
        if workflow:
            create_relationship(workflow.entity_id, integration.entity_id, "CONSUMES",
                                confidence=0.85, source_type="EXPLICIT",
                                properties={"integration": True})
            rel_count += 1
    ingestion_pipeline.record_ingestion_complete(file_path, content_hash)
    return ExtractionResult(entities_upserted=1, relationships_upserted=rel_count)
```

## Batch Workflow Extraction

```python
def extract_all_workflows() -> ExtractionResult:
    total = ExtractionResult()
    for f in glob_files("workflows/*.md"):
        total.merge(extract_workflow(f))
    for f in glob_files("orchestrator/*.md"):
        total.merge(extract_workflow(f))   # orchestrators are workflow-like entities
    for f in glob_files("integration-fabric/connectors/*.md"):
        total.merge(extract_integration_connector(f))
    return total
```

## Integration Points

- `ingestion-pipeline.md`: INGESTION_PHASES["ORG_ENTITIES"] calls workflow extraction after agents
- `knowledge-inference/inference-rules.md`: R010 (CAPABILITY_GAP) evaluates REQUIRES_CAPABILITY vs available AGENT→CAPABILITY paths
- `graph-observability/coverage-analyzer.md`: counts workflow files on disk vs WORKFLOW entities in graph
