# Knowledge Gap Detector
# Identifies missing entities, incomplete properties, unlinked artifacts, and required relationships

## Gap Type Classification

```yaml
gap_types:
  MISSING_ENTITY:
    description: An entity is expected (file exists on disk) but not present in the graph
    severity: HIGH
    sources: [coverage-analyzer.md, wiki-extractor.md explicit link failures]

  MISSING_RELATIONSHIP:
    description: An entity exists but a required or typical relationship edge is absent
    severity: MEDIUM
    sources: [agent-extractor.md forward references, ingestion-pipeline.md post-ingestion checks]

  INCOMPLETE_ENTITY:
    description: An entity exists but required properties are null or empty
    severity: MEDIUM
    sources: [integrity-validator.md schema compliance checks]

  UNLINKED_ARTIFACT:
    description: An artifact has no PRODUCES or CONSUMES relationship
    severity: MEDIUM
    sources: [inference-rules.md R012, artifact-extractor.md]

  UNDOCUMENTED_ENTITY:
    description: A high-value entity has no associated WIKI_PAGE with DOCUMENTS relationship
    severity: LOW
    sources: [graph-analytics.md PageRank + DOCUMENTS edge check]

  STALE_REFERENCE:
    description: A wiki page references an entity that has since been deprecated or merged
    severity: LOW
    sources: [staleness-detector.md + wiki cross-reference validation]

  ORPHANED_DECISION:
    description: A decision (ADR) has no SUPPORTS relationship to any workflow or policy
    severity: LOW
    sources: [decision-extractor.md post-extraction checks]
```

## Gap Detection

```python
class KnowledgeGapDetector:
    def detect_all_gaps(self) -> GapReport:
        gaps = []
        gaps.extend(self.detect_missing_entities())
        gaps.extend(self.detect_missing_relationships())
        gaps.extend(self.detect_incomplete_entities())
        gaps.extend(self.detect_unlinked_artifacts())
        gaps.extend(self.detect_undocumented_entities())
        gaps.extend(self.detect_stale_references())
        gaps.extend(self.detect_orphaned_decisions())

        # Severity-based sort
        severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        gaps.sort(key=lambda g: severity_order.get(g.severity, 3))

        report = GapReport(
            total_gaps=len(gaps),
            by_severity=Counter(g.severity for g in gaps),
            by_type=Counter(g.gap_type for g in gaps),
            gaps=gaps,
            generated_at=now(),
        )
        self._publish_gap_metrics(report)
        return report

    def detect_missing_entities(self) -> list[KnowledgeGap]:
        # Delegates to coverage_analyzer gap identification
        return coverage_analyzer.identify_all_gaps()

    def detect_missing_relationships(self) -> list[KnowledgeGap]:
        gaps = []
        # Agents without BELONGS_TO
        for agent in get_entities_by_type("AGENT"):
            if not graph_store.get_out_edges(agent.entity_id, ["BELONGS_TO"]):
                gaps.append(KnowledgeGap(
                    gap_type="MISSING_RELATIONSHIP",
                    entity_id=agent.entity_id,
                    description=f"Agent {agent.canonical_label} has no BELONGS_TO relationship",
                    severity="MEDIUM",
                    recommended_action="Re-run agent-extractor or verify org_id in agent definition",
                ))
        # Workflows without REQUIRES_CAPABILITY
        for wfl in get_entities_by_type("WORKFLOW"):
            if not graph_store.get_out_edges(wfl.entity_id, ["REQUIRES_CAPABILITY"]):
                gaps.append(KnowledgeGap(
                    gap_type="MISSING_RELATIONSHIP",
                    entity_id=wfl.entity_id,
                    description=f"Workflow {wfl.canonical_label} has no REQUIRES_CAPABILITY",
                    severity="LOW",
                ))
        # Check forward reference registry for unresolved references
        for ref in forward_reference_registry.get_unresolved():
            gaps.append(KnowledgeGap(
                gap_type="MISSING_RELATIONSHIP",
                entity_id=ref.source_id,
                description=f"Unresolved forward reference: {ref.target_label} ({ref.target_type})",
                severity="MEDIUM",
                referenced_label=ref.target_label,
            ))
        return gaps

    def detect_incomplete_entities(self) -> list[KnowledgeGap]:
        gaps = []
        for entity in graph_store.get_all_active_vertices():
            required = ENTITY_TYPE_REQUIRED_PROPERTIES.get(entity.entity_type, [])
            missing_props = [p for p in required if not entity.properties.get(p)]
            if missing_props:
                gaps.append(KnowledgeGap(
                    gap_type="INCOMPLETE_ENTITY",
                    entity_id=entity.entity_id,
                    description=f"{entity.canonical_label} missing properties: {missing_props}",
                    severity="MEDIUM",
                ))
        return gaps

    def detect_unlinked_artifacts(self) -> list[KnowledgeGap]:
        # Inference rule R012 materializes IS_ORPHANED — query for those
        orphaned_edges = graph_store.get_edges_by_type("IS_ORPHANED")
        return [
            KnowledgeGap(
                gap_type="UNLINKED_ARTIFACT",
                entity_id=e.source_id,
                description=f"Artifact {graph_store.get_vertex(e.source_id).canonical_label} "
                             f"has no PRODUCES or CONSUMES edge",
                severity="MEDIUM",
            )
            for e in orphaned_edges
        ]

    def detect_undocumented_entities(self, min_pagerank=0.60) -> list[KnowledgeGap]:
        pagerank = graph_analytics.compute_pagerank()
        gaps = []
        for entity_id, score in pagerank.items():
            if score < min_pagerank:
                continue
            entity = graph_store.get_vertex(entity_id)
            if not entity or entity.entity_type in ("WIKI_PAGE", "RUN", "APPROVAL"):
                continue
            doc_edges = graph_store.get_in_edges(entity_id, ["DOCUMENTS"])
            if not doc_edges:
                gaps.append(KnowledgeGap(
                    gap_type="UNDOCUMENTED_ENTITY",
                    entity_id=entity_id,
                    description=f"High-value entity {entity.canonical_label} "
                                 f"(PageRank={score:.2f}) has no wiki documentation",
                    severity="LOW",
                ))
        return gaps

    def detect_stale_references(self) -> list[KnowledgeGap]:
        gaps = []
        for ref_edge in graph_store.get_edges_by_type("REFERENCES"):
            target = graph_store.get_vertex(ref_edge.target_id)
            if target and target.lifecycle.status in ("DEPRECATED", "MERGED"):
                source = graph_store.get_vertex(ref_edge.source_id)
                gaps.append(KnowledgeGap(
                    gap_type="STALE_REFERENCE",
                    entity_id=ref_edge.source_id,
                    description=f"{source.canonical_label} references {target.canonical_label} "
                                 f"which is {target.lifecycle.status}",
                    severity="LOW",
                ))
        return gaps

    def detect_orphaned_decisions(self) -> list[KnowledgeGap]:
        gaps = []
        for decision in get_entities_by_type("DECISION", status="ACTIVE"):
            if decision.properties.get("status") not in ("ACCEPTED",):
                continue   # only check ACCEPTED decisions
            supports_edges = graph_store.get_out_edges(decision.entity_id, ["SUPPORTS"])
            if not supports_edges:
                gaps.append(KnowledgeGap(
                    gap_type="ORPHANED_DECISION",
                    entity_id=decision.entity_id,
                    description=f"ACCEPTED {decision.canonical_label} has no SUPPORTS edges",
                    severity="LOW",
                ))
        return gaps
```

## Gap Ingestion Hooks

```python
def log_missing_reference(self, source_page: str, referenced_label: str):
    self._gap_buffer.append(KnowledgeGap(
        gap_type="MISSING_ENTITY",
        description=f"Wiki page {source_page} references '{referenced_label}' but no entity found",
        severity="LOW",
        referenced_label=referenced_label,
    ))

def log_missing_entity(self, entity_type: str, label: str, referenced_by: str):
    self._gap_buffer.append(KnowledgeGap(
        gap_type="MISSING_ENTITY",
        description=f"{entity_type} '{label}' referenced by {referenced_by} but not in graph",
        severity="MEDIUM",
        referenced_label=label,
    ))
```

## Publishing Gap Metrics

```python
def _publish_gap_metrics(self, report: GapReport):
    publish_enterprise_event("telemetry.metrics", {
        "event_type": "KNOWLEDGE_GAP_REPORT",
        "total_gaps": report.total_gaps,
        "high_severity": report.by_severity.get("HIGH", 0),
        "medium_severity": report.by_severity.get("MEDIUM", 0),
        "low_severity": report.by_severity.get("LOW", 0),
    })
    # Feed organizational stress detector: high knowledge gap count = KNOWLEDGE_GAP_ACCUMULATION
    if report.by_severity.get("HIGH", 0) >= 5:
        publish_enterprise_event("telemetry.health.scores", {
            "event_type": "KNOWLEDGE_GAP_ACCUMULATION",
            "high_gap_count": report.by_severity["HIGH"],
        })
```

## Integration Points

- `coverage-analyzer.md`: provides MISSING_ENTITY gaps via `identify_all_gaps()`
- `inference-rules.md`: R010 (capability gap) and R012 (orphan artifact) results surface here
- `wiki-extractor.md`: explicit link failures fed via `log_missing_reference()`
- `organizational-stress-detector.md`: KNOWLEDGE_GAP_ACCUMULATION indicator triggered when HIGH gaps >= 5
- `knowledge-synthesizer.md`: gap report informs synthesis target prioritization
