# Relationship Schema
# All edge types in the enterprise knowledge graph with cardinality and semantic weight

## Edge Schema

```yaml
GraphEdge:
  edge_id: string            # REL-{uuid4}
  edge_type: RelationshipType
  source_id: string          # entity_id
  target_id: string          # entity_id
  properties: {}             # relationship-specific properties
  weight: float              # 0.0–1.0 (semantic strength; 1.0 = strongest)
  confidence: float          # 0.0–1.0
  source_type: enum          # EXPLICIT | DERIVED | INFERRED
  valid_from: ISO8601 | null
  valid_until: ISO8601 | null  # null = indefinitely valid
  created_at: ISO8601
  updated_at: ISO8601
  provenance: string         # ingestion source or rule ID that created this edge
```

## Relationship Type Catalog

### Organizational Domain

```yaml
BELONGS_TO:
  source_types: [AGENT]
  target_types: [ORGANIZATION]
  cardinality: MANY_TO_ONE
  weight_default: 1.0
  description: Agent is a member of an organization
  required: true

REPORTS_TO:
  source_types: [AGENT]
  target_types: [AGENT]
  cardinality: MANY_TO_ONE
  weight_default: 0.9
  description: Agent reports to a lead agent (org hierarchy)

LEADS:
  source_types: [AGENT]
  target_types: [ORGANIZATION]
  cardinality: ONE_TO_ONE
  weight_default: 1.0
  description: Agent is the lead/orchestrator of an organization

PARENT_OF:
  source_types: [ORGANIZATION]
  target_types: [ORGANIZATION]
  cardinality: ONE_TO_MANY
  weight_default: 1.0
  description: Organization contains a sub-organization
```

### Capability Domain

```yaml
SPECIALIZES_IN:
  source_types: [AGENT]
  target_types: [CAPABILITY]
  cardinality: MANY_TO_MANY
  weight_default: 0.85
  description: Agent has expertise in a capability domain

HAS_TOOL:
  source_types: [AGENT]
  target_types: [TOOL]
  cardinality: MANY_TO_MANY
  weight_default: 0.9
  description: Agent can invoke this tool

REQUIRES_CAPABILITY:
  source_types: [WORKFLOW]
  target_types: [CAPABILITY]
  cardinality: MANY_TO_MANY
  weight_default: 1.0
  description: Workflow requires an agent with this capability to execute

SUBSUMES:
  source_types: [CAPABILITY]
  target_types: [CAPABILITY]
  cardinality: ONE_TO_MANY
  weight_default: 0.8
  description: Parent capability includes sub-capability (skill hierarchy)

REQUIRES_TOOL:
  source_types: [CAPABILITY]
  target_types: [TOOL]
  cardinality: MANY_TO_MANY
  weight_default: 0.85
  description: Exercising this capability requires specific tools
```

### Delegation Domain

```yaml
DELEGATES_TO:
  source_types: [AGENT, WORKFLOW]
  target_types: [AGENT]
  cardinality: MANY_TO_MANY
  weight_default: 0.9
  description: Agent or workflow delegates tasks to target agent
  properties:
    delegation_scope: string   # task types delegated
    max_depth: integer

ESCALATES_TO:
  source_types: [AGENT]
  target_types: [AGENT]
  cardinality: MANY_TO_ONE
  weight_default: 0.95
  description: Agent escalates unresolved issues to target

COLLABORATES_WITH:
  source_types: [AGENT, ORGANIZATION]
  target_types: [AGENT, ORGANIZATION]
  cardinality: MANY_TO_MANY
  weight_default: 0.75
  description: Peer collaboration relationship (bidirectional in practice)

GOVERNED_BY_CONTRACT:
  source_types: [AGENT]
  target_types: [CONTRACT]
  cardinality: MANY_TO_MANY
  weight_default: 1.0
  description: Agent pair interaction governed by a collaboration contract
```

### Artifact Domain

```yaml
PRODUCES:
  source_types: [WORKFLOW, AGENT, RUN]
  target_types: [ARTIFACT]
  cardinality: ONE_TO_MANY
  weight_default: 1.0
  description: Workflow/agent/run produces this artifact type

CONSUMES:
  source_types: [WORKFLOW, AGENT]
  target_types: [ARTIFACT]
  cardinality: MANY_TO_MANY
  weight_default: 0.9
  description: Workflow/agent consumes this artifact as input

ATTESTED_BY:
  source_types: [ARTIFACT]
  target_types: [APPROVAL]
  cardinality: ONE_TO_MANY
  weight_default: 1.0
  description: Artifact has a governance approval record

DERIVED_FROM:
  source_types: [ARTIFACT]
  target_types: [ARTIFACT]
  cardinality: MANY_TO_MANY
  weight_default: 0.85
  description: Artifact was derived from or transforms another artifact
```

### Governance Domain

```yaml
GOVERNED_BY:
  source_types: [WORKFLOW, AGENT, ARTIFACT]
  target_types: [POLICY]
  cardinality: MANY_TO_MANY
  weight_default: 1.0
  description: Entity is subject to this governance policy

ENFORCES:
  source_types: [POLICY]
  target_types: [POLICY]
  cardinality: MANY_TO_MANY
  weight_default: 0.9
  description: Higher-level policy enforces or implies lower-level policy

SUPERSEDES:
  source_types: [DECISION, POLICY]
  target_types: [DECISION, POLICY]
  cardinality: ONE_TO_ONE
  weight_default: 1.0
  description: Newer decision/policy replaces an older one

AUTHORIZED_BY:
  source_types: [RUN, WORKFLOW]
  target_types: [APPROVAL]
  cardinality: MANY_TO_ONE
  weight_default: 1.0
  description: Execution was authorized by this approval record

BINDS_TO:
  source_types: [TRUST_ZONE]
  target_types: [POLICY]
  cardinality: MANY_TO_MANY
  weight_default: 1.0
  description: Trust zone is governed by this policy
```

### Knowledge Domain

```yaml
REFERENCES:
  source_types: [WIKI_PAGE, DECISION]
  target_types: [AGENT, WORKFLOW, ARTIFACT, POLICY, CAPABILITY, TOOL]
  cardinality: MANY_TO_MANY
  weight_default: 0.70
  description: Wiki page or decision references another entity

LINKS_TO:
  source_types: [WIKI_PAGE]
  target_types: [WIKI_PAGE]
  cardinality: MANY_TO_MANY
  weight_default: 0.60
  description: Wiki page links to another wiki page

DOCUMENTS:
  source_types: [WIKI_PAGE]
  target_types: [WORKFLOW, AGENT, POLICY, CAPABILITY]
  cardinality: ONE_TO_MANY
  weight_default: 0.80
  description: Wiki page is the primary documentation for this entity

SUPPORTS:
  source_types: [DECISION]
  target_types: [WORKFLOW, POLICY]
  cardinality: MANY_TO_MANY
  weight_default: 0.85
  description: Decision provides rationale or authorization for entity
```

### Derived / Inferred Relationships (computed, not manually asserted)

```yaml
TRANSITIVELY_DELEGATES_TO:
  source_type: INFERRED
  source_types: [AGENT]
  target_types: [AGENT]
  rule: R001
  confidence_factor: 0.85
  description: Multi-hop delegation reachability

IMPLICITLY_HAS_CAPABILITY:
  source_type: INFERRED
  source_types: [AGENT]
  target_types: [CAPABILITY]
  rule: R002
  confidence_factor: 0.80
  description: Agent inherits sub-capabilities from parent capabilities

HAS_ESCALATION_PATH:
  source_type: DERIVED
  source_types: [AGENT]
  target_types: [AGENT]
  rule: R005
  confidence_factor: 0.90
  description: Full escalation chain from agent to terminal authority

AT_RISK_DUE_TO:
  source_type: INFERRED
  source_types: [ARTIFACT, WORKFLOW]
  target_types: [ARTIFACT, WIKI_PAGE]
  rule: R007
  confidence_factor: 0.75
  description: Entity is at risk because a dependency is stale or degraded

HAS_CAPABILITY_GAP:
  source_type: INFERRED
  source_types: [WORKFLOW]
  target_types: [CAPABILITY]
  rule: R010
  confidence_factor: 0.90
  description: No active agent can satisfy this workflow's capability requirement
```

## Cardinality Enforcement

```python
CARDINALITY_RULES = {
    "BELONGS_TO":   {"max_targets": 1,    "min_targets": 1},   # agent must have exactly one org
    "LEADS":        {"max_targets": 1,    "min_targets": 0},
    "SUPERSEDES":   {"max_targets": 1,    "min_targets": 0},   # one thing supersedes one thing
    "REPORTS_TO":   {"max_targets": 1,    "min_targets": 0},
}

def validate_cardinality(source_id, edge_type, target_id):
    rule = CARDINALITY_RULES.get(edge_type)
    if not rule:
        return True   # unconstrained
    existing = graph_store.get_edges(source_id, edge_type)
    if rule["max_targets"] and len(existing) >= rule["max_targets"]:
        raise CardinalityViolation(
            f"{edge_type} on {source_id} already at max_targets={rule['max_targets']}"
        )
    return True

def create_relationship(source_id, target_id, edge_type, weight=None, confidence=1.0,
                        source_type="EXPLICIT", properties=None, valid_until=None):
    validate_cardinality(source_id, edge_type, target_id)
    schema = RELATIONSHIP_SCHEMA[edge_type]
    edge = GraphEdge(
        edge_id=f"REL-{uuid4()}",
        edge_type=edge_type,
        source_id=source_id,
        target_id=target_id,
        weight=weight or schema["weight_default"],
        confidence=confidence,
        source_type=source_type,
        valid_until=valid_until,
        created_at=now(),
        updated_at=now(),
        provenance=current_ingestion_source(),
        properties=properties or {},
    )
    graph_store.upsert_edge(edge)
    query_cache.invalidate_for_entities([source_id, target_id])
    return edge
```

## Integration Points

- `graph-ingestion/`: all extractors call `create_relationship()` after entity registration
- `knowledge-inference/inference-rules.md`: derived/inferred types are created by inference engine
- `graph-query-engine/traversal-engine.md`: edge weights used in Dijkstra path ranking
- `graph-observability/integrity-validator.md`: validates source_type enum, cardinality, valid entity references
