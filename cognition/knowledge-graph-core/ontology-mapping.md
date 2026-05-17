# Ontology Mapping
# Maps OS file-system ontology to graph schema; handles schema evolution and concept alignment

## OS Source → Graph Entity Mapping

```yaml
ontology_mappings:

  agents_directory:
    source_pattern: "agents/**/*.md"
    extractor: agent-extractor
    primary_entity: AGENT
    field_mappings:
      "# {name}":                    canonical_label
      "org_id:":                     properties.org_id
      "trust_tier:":                 properties.trust_tier
      "specializations:":            properties.specializations
      "tools:":                      properties.capability_tools
      "collaboration_peers:":        relationship.COLLABORATES_WITH (→ AGENT)
      "escalation_target:":          relationship.ESCALATES_TO (→ AGENT)
      "reports_to:":                 relationship.REPORTS_TO (→ AGENT)
    confidence_baseline: 0.92

  workflows_directory:
    source_pattern: "workflows/*.md"
    extractor: workflow-extractor
    primary_entity: WORKFLOW
    field_mappings:
      "# {name}":                    canonical_label
      "required_capabilities:":      relationship.REQUIRES_CAPABILITY (→ CAPABILITY)
      "produces_artifacts:":         relationship.PRODUCES (→ ARTIFACT schema)
      "consumes_artifacts:":         relationship.CONSUMES (→ ARTIFACT schema)
      "approval_gates:":             relationship.GOVERNED_BY (→ POLICY)
      "assigned_agents:":            relationship.DELEGATES_TO (→ AGENT)
      "slo_target_ms:":              properties.slo_target_ms
    confidence_baseline: 0.90

  wiki_directory:
    source_pattern: "wiki/**/*.md"
    extractor: wiki-extractor
    primary_entity: WIKI_PAGE
    field_mappings:
      file_path:                     properties.wiki_path + canonical_label
      "## " / "### " headers:        referenced entity candidates (NER extraction)
      "[[entity_label]]" links:      relationship.REFERENCES (→ any entity type)
      cross_page_markdown_links:     relationship.LINKS_TO (→ WIKI_PAGE)
    confidence_baseline: 0.78

  decisions_directory:
    source_pattern: "docs/decisions/*.md"
    extractor: decision-extractor
    primary_entity: DECISION
    field_mappings:
      "# ADR-{number}: {title}":     canonical_label
      "Status: {status}":            properties.status
      "Context:":                    properties.context_summary (first 500 chars)
      "Decision:":                   properties.outcome
      "Supersedes: ADR-{number}":    relationship.SUPERSEDES (→ DECISION)
      "Affects: {entities}":         relationship.SUPPORTS (→ WORKFLOW | POLICY)
    confidence_baseline: 0.95

  constitution_directory:
    source_pattern: "constitution/*.md"
    extractor: decision-extractor
    primary_entity: POLICY
    field_mappings:
      "# Article {n}: {title}":      canonical_label
      "enforcement_level:":          properties.enforcement_level
      "scope:":                      properties.scope
      "article_number:":             properties.constitutional_article
    confidence_baseline: 1.00   # constitutional — fully authoritative

  governance_docs:
    source_pattern: "docs/governance/*.md"
    extractor: decision-extractor
    primary_entity: POLICY
    field_mappings:
      "# {title} Policy":            canonical_label
      "policy_type:":                properties.policy_type
      "scope:":                      properties.scope
      "enforcement_level:":          properties.enforcement_level
    confidence_baseline: 0.95

  integration_connectors:
    source_pattern: "integration-fabric/connectors/*.md"
    extractor: workflow-extractor   # reuses workflow extractor with integration mode
    primary_entity: INTEGRATION
    field_mappings:
      "connector_name:":             canonical_label
      "connector_type:":             properties.connector_type
      "system_name:":                properties.system_name
      "auth_method:":                properties.auth_method
      "trust_tier:":                 properties.trust_tier
    confidence_baseline: 0.90
```

## Concept Alignment Table

Cross-system concept alignment between OS internal terminology and graph schema properties:

```yaml
concept_alignments:
  # OS term → graph property path
  "trust_tier":         "EntityVertex.properties.trust_tier"         # 1–5 integer
  "trust_zone":         "EntityVertex.entity_type=TRUST_ZONE"
  "org_id":             "EntityVertex.properties.org_id"
  "specialization":     "relationship.SPECIALIZES_IN → CAPABILITY"
  "capability_tool":    "relationship.HAS_TOOL → TOOL"
  "artifact_type":      "EntityVertex.entity_type=ARTIFACT, properties.artifact_type"
  "governance_gate":    "relationship.GOVERNED_BY → POLICY"
  "approval_record":    "EntityVertex.entity_type=APPROVAL"
  "escalation_path":    "relationship.ESCALATES_TO (chain) → derived HAS_ESCALATION_PATH"
  "collaboration_peer": "relationship.COLLABORATES_WITH"
  "wiki_page":          "EntityVertex.entity_type=WIKI_PAGE, properties.wiki_path"
  "collaboration_contract": "EntityVertex.entity_type=CONTRACT"
  "constitutional_rule":    "EntityVertex.entity_type=POLICY, properties.enforcement_level=ABSOLUTE"
```

## Schema Version Management

The ontology schema is versioned. Schema migrations are applied when source file formats change:

```python
ONTOLOGY_VERSION = "1.0.0"

SCHEMA_MIGRATIONS = {
    "1.0.0 → 1.1.0": [
        MigrationStep("rename_property", entity_type="AGENT",
                      old_key="capabilities", new_key="specializations"),
    ],
    # future migrations appended here
}

def apply_schema_migration(from_version: str, to_version: str):
    migration_key = f"{from_version} → {to_version}"
    steps = SCHEMA_MIGRATIONS.get(migration_key, [])
    if not steps:
        raise SchemaVersionError(f"No migration path from {from_version} to {to_version}")
    for step in steps:
        execute_migration_step(step)
    update_ontology_version_record(to_version)

def check_schema_drift() -> [SchemaDriftWarning]:
    warnings = []
    for mapping in ONTOLOGY_MAPPINGS.values():
        pattern = mapping["source_pattern"]
        files = glob(pattern)
        for f in files[:5]:   # sample 5 files per pattern
            sample_fields = extract_field_keys(f)
            expected_fields = set(mapping["field_mappings"].keys())
            missing = expected_fields - sample_fields
            if missing:
                warnings.append(SchemaDriftWarning(
                    file=f, pattern=pattern, missing_fields=list(missing)
                ))
    return warnings
```

## Runtime Concept Mapping

The event stream consumer maps runtime event payloads to graph entities using this alignment:

```python
EVENT_TO_ENTITY_MAPPING = {
    "org.agent.lifecycle.AGENT_REGISTERED":   ("AGENT",    "agent_id"),
    "org.agent.lifecycle.AGENT_SUSPENDED":    ("AGENT",    "agent_id"),
    "runtime.workflow.lifecycle.RUN_STARTED": ("RUN",      "run_id"),
    "runtime.workflow.lifecycle.RUN_COMPLETE":("RUN",      "run_id"),
    "runtime.workflow.gates.GATE_PASSED":     ("APPROVAL", "gate_id"),
    "governance.decisions.DECISION_RECORDED": ("DECISION", "decision_id"),
    "governance.policy.changes.POLICY_UPDATED": ("POLICY", "policy_id"),
}

def map_event_to_entity(event: EnterpriseEvent) -> tuple[str, str] | None:
    key = f"{event.topic}.{event.event_type}"
    mapping = EVENT_TO_ENTITY_MAPPING.get(key)
    if not mapping:
        return None
    entity_type, id_field = mapping
    entity_id = event.payload.get(id_field)
    return (entity_type, entity_id)
```

## Integration Points

- `graph-ingestion/ingestion-pipeline.md`: reads ONTOLOGY_MAPPINGS to route files to correct extractors
- `graph-ingestion/event-stream-consumer.md`: uses EVENT_TO_ENTITY_MAPPING for runtime routing
- `graph-observability/coverage-analyzer.md`: compares glob(source_pattern) count vs ingested entities per type
- `graph-query-engine/semantic-search.md`: uses concept_alignments for field-level search translation
