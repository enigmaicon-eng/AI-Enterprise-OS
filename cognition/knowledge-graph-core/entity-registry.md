# Entity Registry
# Canonical entity type definitions for the enterprise knowledge graph

## Entity Type Catalog

```yaml
entity_types:
  AGENT:
    prefix: AGT
    description: AI agent with defined capabilities, trust tier, and organizational membership
    required_properties: [org_id, trust_tier, specializations, status]
    optional_properties: [wiki_page, collaboration_peers, capability_tools]
    confidence_floor: 0.90   # agents are explicitly defined — high floor

  ORGANIZATION:
    prefix: ORG
    description: Organizational unit containing agents and owning workflows
    required_properties: [org_type, parent_org_id, agent_capacity, lead_agent_id]
    optional_properties: [domain_expertise, sla_targets]
    confidence_floor: 0.95

  WORKFLOW:
    prefix: WFL
    description: Defined workflow with inputs, outputs, gates, and agent requirements
    required_properties: [workflow_type, required_capabilities, produces_artifact_types]
    optional_properties: [consumes_artifact_types, approval_gates, slo_target_ms]
    confidence_floor: 0.90

  ARTIFACT:
    prefix: ART
    description: Structured output produced or consumed by a workflow or agent
    required_properties: [artifact_type, schema_version, classification]
    optional_properties: [run_id, producing_agent_id, consuming_workflow_ids]
    confidence_floor: 0.85   # artifacts are runtime — somewhat variable

  DECISION:
    prefix: DEC
    description: Formal architectural or governance decision (ADR or constitutional)
    required_properties: [decision_type, status, context_summary, outcome]
    optional_properties: [supersedes_id, affected_workflows, authority_tier]
    confidence_floor: 0.95

  POLICY:
    prefix: POL
    description: Governance policy binding workflows, agents, or artifact classes
    required_properties: [policy_type, scope, enforcement_level]
    optional_properties: [constitutional_article, expiry_at, exemptions]
    confidence_floor: 0.95

  CAPABILITY:
    prefix: CAP
    description: Skill or functional competency an agent may possess
    required_properties: [capability_domain, sub_capabilities]
    optional_properties: [required_tools, required_trust_tier]
    confidence_floor: 0.85

  TOOL:
    prefix: TL
    description: MCP tool or system capability accessible to agents
    required_properties: [tool_type, trust_tier_required, scope]
    optional_properties: [rate_limit, mcp_server_id, sandboxed]
    confidence_floor: 0.90

  WIKI_PAGE:
    prefix: WKP
    description: Knowledge article in the organizational wiki
    required_properties: [wiki_path, section, content_hash]
    optional_properties: [referenced_entities, last_reviewed_by, staleness_risk]
    confidence_floor: 0.80   # wiki content is human-maintained — lower floor

  CONTRACT:
    prefix: CTR
    description: Collaboration contract between two agent pairs or org pairs
    required_properties: [from_agent_type, to_agent_type, input_schema, output_schema]
    optional_properties: [sla_ms, escalation_path, version]
    confidence_floor: 0.90

  TRUST_ZONE:
    prefix: TZ
    description: Trust boundary zone (external / standard / elevated / restricted / executive)
    required_properties: [zone_level, allowed_agent_tiers, rate_limits]
    optional_properties: [policy_binding_ids]
    confidence_floor: 1.00   # fully explicit

  RUN:
    prefix: RUN
    description: Execution instance of a workflow (runtime entity, short-lived)
    required_properties: [workflow_id, started_at, status, triggering_agent_id]
    optional_properties: [completed_at, slo_compliant, artifacts_produced]
    confidence_floor: 0.95

  APPROVAL:
    prefix: APR
    description: Governance approval record for an artifact or workflow gate
    required_properties: [approver_id, subject_id, subject_type, authority_tier, outcome]
    optional_properties: [conditions, valid_until, chain_position]
    confidence_floor: 1.00   # cryptographically attested

  INTEGRATION:
    prefix: INT
    description: External system integration connector
    required_properties: [connector_type, system_name, auth_method, trust_tier]
    optional_properties: [rate_limit, data_classification, webhook_topics]
    confidence_floor: 0.90
```

## Entity Vertex Schema

```yaml
EntityVertex:
  entity_id: string          # {PREFIX}-{uuid4}  e.g. AGT-4f8a21c3-...
  entity_type: EntityType
  canonical_label: string    # human-readable primary name
  aliases: [string]          # alternate labels that resolve to this entity
  properties: {}             # type-specific property map
  metadata:
    confidence_score: float  # 0.0–1.0
    knowledge_type: enum     # EXPLICIT | DERIVED | INFERRED | DEPRECATED
    ingestion_source: string # wiki-extractor | agent-extractor | event-stream | manual
    created_at: ISO8601
    updated_at: ISO8601
    provenance_chain: [string]  # ordered list of source entity_ids or event_ids
  lifecycle:
    status: enum             # ACTIVE | DEPRECATED | MERGED | QUARANTINED
    merged_into: string|null # entity_id of canonical after merge
    deprecated_reason: string|null
    quarantine_reason: string|null
```

## Confidence Score Tiers

| Tier | Score | Source Type |
|------|-------|-------------|
| AUTHORITATIVE | 1.00 | Cryptographically attested (approvals, constitutional rules) |
| EXPLICIT | 0.90–0.99 | Directly stated in agent/workflow definition files |
| WIKI_EXTRACTED | 0.80–0.89 | Parsed from organizational wiki |
| EVENT_DERIVED | 0.70–0.79 | Derived from runtime event stream |
| INFERRED | 0.50–0.69 | Rule-based inference from graph structure |
| SPECULATIVE | < 0.50 | Multi-hop inference or low-signal synthesis |

## Core Operations

```python
def register_entity(entity_type, canonical_label, properties, source, confidence) -> EntityVertex:
    entity_id = f"{TYPE_PREFIXES[entity_type]}-{uuid4()}"
    existing = resolve_entity(canonical_label, entity_type)
    if existing:
        return merge_entity(existing, properties, confidence, source)
    vertex = EntityVertex(
        entity_id=entity_id,
        entity_type=entity_type,
        canonical_label=normalize_label(canonical_label),
        properties=validate_properties(entity_type, properties),
        metadata=EntityMetadata(
            confidence_score=max(confidence, TYPE_CONFIDENCE_FLOORS[entity_type]),
            knowledge_type=classify_knowledge_type(confidence, source),
            ingestion_source=source,
            created_at=now(),
            updated_at=now(),
        )
    )
    graph_store.upsert_vertex(vertex)
    resolution_index.register(canonical_label, entity_id, entity_type)
    return vertex

def resolve_entity(label, entity_type=None) -> EntityVertex | None:
    # Check canonical index first (O(1))
    canonical_id = resolution_index.lookup(normalize_label(label), entity_type)
    if canonical_id:
        return graph_store.get_vertex(canonical_id)
    # Fuzzy fallback (Levenshtein ≤ 2)
    return resolution_index.fuzzy_lookup(label, entity_type, max_distance=2)

def deprecate_entity(entity_id, reason, superseded_by=None):
    vertex = graph_store.get_vertex(entity_id)
    vertex.lifecycle.status = "DEPRECATED"
    vertex.lifecycle.deprecated_reason = reason
    if superseded_by:
        create_relationship(entity_id, superseded_by, "SUPERSEDED_BY", confidence=1.0)
    graph_store.upsert_vertex(vertex)
    publish_enterprise_event("org.agent.lifecycle", {
        "event_subtype": "ENTITY_DEPRECATED",
        "entity_id": entity_id,
        "reason": reason
    })

def quarantine_entity(entity_id, reason):
    vertex = graph_store.get_vertex(entity_id)
    vertex.lifecycle.status = "QUARANTINED"
    vertex.lifecycle.quarantine_reason = reason
    # Suspend all inferred edges involving this entity
    inference_engine.suspend_derivations_for(entity_id)
    graph_store.upsert_vertex(vertex)
```

## Integration Points

- `graph-ingestion/`: all extractors call `register_entity()` as their write operation
- `knowledge-inference/inference-engine.md`: reads entity confidence scores during rule evaluation
- `graph-observability/integrity-validator.md`: validates required_properties compliance
- `graph-observability/staleness-detector.md`: reads entity.metadata.updated_at for freshness checks
- `graph-query-engine/semantic-search.md`: queries resolution_index for entity lookup
