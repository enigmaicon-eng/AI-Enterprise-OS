# Graph Schema
# Storage model, index definitions, and validation rules for the enterprise knowledge graph

## Storage Model

The knowledge graph uses an adjacency-list model with a vertex store and edge store. All
graph mutations are atomic per entity — partial writes are rejected.

```yaml
GraphStore:
  vertex_store:
    # Primary: entity_id → EntityVertex (hash map, O(1) read)
    primary_index: entity_id
    # Secondary indexes for fast filtering
    secondary_indexes:
      - by_entity_type    # entity_type → [entity_id]
      - by_org_id         # properties.org_id → [entity_id]
      - by_trust_tier     # properties.trust_tier → [entity_id]
      - by_status         # lifecycle.status → [entity_id]
      - by_confidence     # bucketed 0.1 bands → [entity_id]
      - by_updated_at     # sorted for freshness queries
    full_text_index: canonical_label + aliases   # for semantic-search.md

  edge_store:
    # Primary: edge_id → GraphEdge
    primary_index: edge_id
    # Adjacency lists (bidirectional for undirected traversal)
    out_edges: source_id → [(edge_type, edge_id, target_id)]
    in_edges:  target_id → [(edge_type, edge_id, source_id)]
    # Secondary indexes
    secondary_indexes:
      - by_edge_type       # edge_type → [edge_id]
      - by_source_type     # EXPLICIT | DERIVED | INFERRED → [edge_id]
      - by_confidence      # bucketed → [edge_id]
      - active_only        # valid_until IS NULL OR valid_until > now()
```

## Schema Validation Rules

```python
REQUIRED_VERTEX_FIELDS = [
    "entity_id", "entity_type", "canonical_label",
    "metadata.confidence_score", "metadata.knowledge_type",
    "metadata.ingestion_source", "metadata.created_at",
    "lifecycle.status"
]

REQUIRED_EDGE_FIELDS = [
    "edge_id", "edge_type", "source_id", "target_id",
    "weight", "confidence", "source_type", "created_at"
]

VALID_KNOWLEDGE_TYPES = {"EXPLICIT", "DERIVED", "INFERRED", "DEPRECATED"}
VALID_SOURCE_TYPES    = {"EXPLICIT", "DERIVED", "INFERRED"}
VALID_STATUSES        = {"ACTIVE", "DEPRECATED", "MERGED", "QUARANTINED"}

def validate_vertex(vertex: EntityVertex) -> ValidationResult:
    errors = []
    for field in REQUIRED_VERTEX_FIELDS:
        if not get_nested(vertex, field):
            errors.append(f"Missing required field: {field}")
    if not (0.0 <= vertex.metadata.confidence_score <= 1.0):
        errors.append("confidence_score out of bounds [0.0, 1.0]")
    if vertex.metadata.knowledge_type not in VALID_KNOWLEDGE_TYPES:
        errors.append(f"Invalid knowledge_type: {vertex.metadata.knowledge_type}")
    if vertex.lifecycle.status not in VALID_STATUSES:
        errors.append(f"Invalid lifecycle status: {vertex.lifecycle.status}")
    required = ENTITY_TYPE_REQUIRED_PROPERTIES[vertex.entity_type]
    for prop in required:
        if prop not in vertex.properties:
            errors.append(f"Missing required property for {vertex.entity_type}: {prop}")
    return ValidationResult(valid=len(errors) == 0, errors=errors)

def validate_edge(edge: GraphEdge) -> ValidationResult:
    errors = []
    for field in REQUIRED_EDGE_FIELDS:
        if not get_nested(edge, field):
            errors.append(f"Missing required field: {field}")
    if not (0.0 <= edge.weight <= 1.0):
        errors.append("weight out of bounds [0.0, 1.0]")
    if not (0.0 <= edge.confidence <= 1.0):
        errors.append("confidence out of bounds [0.0, 1.0]")
    if edge.source_type not in VALID_SOURCE_TYPES:
        errors.append(f"Invalid source_type: {edge.source_type}")
    if not graph_store.entity_exists(edge.source_id):
        errors.append(f"source_id not found: {edge.source_id}")
    if not graph_store.entity_exists(edge.target_id):
        errors.append(f"target_id not found: {edge.target_id}")
    schema = RELATIONSHIP_SCHEMA.get(edge.edge_type)
    if schema:
        src_type = graph_store.get_entity_type(edge.source_id)
        tgt_type = graph_store.get_entity_type(edge.target_id)
        if src_type not in schema["source_types"]:
            errors.append(f"edge_type {edge.edge_type} invalid for source type {src_type}")
        if tgt_type not in schema["target_types"]:
            errors.append(f"edge_type {edge.edge_type} invalid for target type {tgt_type}")
    return ValidationResult(valid=len(errors) == 0, errors=errors)
```

## Graph Mutation Protocol

All mutations go through a write pipeline that enforces validation and cache invalidation:

```python
class GraphMutationPipeline:
    def write_vertex(self, vertex: EntityVertex):
        result = validate_vertex(vertex)
        if not result.valid:
            raise SchemaValidationError(result.errors)
        graph_store.upsert_vertex(vertex)
        query_cache.invalidate_entity(vertex.entity_id)
        inference_engine.notify_mutation(vertex.entity_id, "VERTEX_UPSERT")

    def write_edge(self, edge: GraphEdge):
        result = validate_edge(edge)
        if not result.valid:
            raise SchemaValidationError(result.errors)
        validate_cardinality(edge.source_id, edge.edge_type, edge.target_id)
        graph_store.upsert_edge(edge)
        query_cache.invalidate_for_entities([edge.source_id, edge.target_id])
        inference_engine.notify_mutation(edge.edge_id, "EDGE_UPSERT")

    def delete_vertex(self, entity_id: str, soft=True):
        # Hard delete only for QUARANTINED entities with no active edges
        if not soft:
            active_edges = graph_store.get_all_edges(entity_id)
            if active_edges:
                raise GraphIntegrityError("Cannot hard-delete entity with active edges")
        vertex = graph_store.get_vertex(entity_id)
        vertex.lifecycle.status = "DEPRECATED"
        self.write_vertex(vertex)
```

## Property Index Queries

```python
def get_entities_by_type(entity_type: str, status="ACTIVE") -> [EntityVertex]:
    ids = secondary_index.by_entity_type.get(entity_type, [])
    return [v for v in graph_store.batch_get(ids) if v.lifecycle.status == status]

def get_entities_by_org(org_id: str, entity_type=None) -> [EntityVertex]:
    ids = secondary_index.by_org_id.get(org_id, [])
    vertices = graph_store.batch_get(ids)
    if entity_type:
        return [v for v in vertices if v.entity_type == entity_type]
    return vertices

def get_entities_stale_since(cutoff_timestamp: ISO8601) -> [EntityVertex]:
    return secondary_index.by_updated_at.range_scan(max=cutoff_timestamp, status="ACTIVE")

def get_neighbor_entities(entity_id: str, edge_types=None, direction="out") -> [EntityVertex]:
    edges = graph_store.get_edges(entity_id, direction=direction)
    if edge_types:
        edges = [e for e in edges if e.edge_type in edge_types]
    target_ids = [e.target_id if direction == "out" else e.source_id for e in edges]
    return graph_store.batch_get(target_ids)
```

## Graph Statistics

```python
def compute_graph_stats() -> GraphStats:
    return GraphStats(
        total_vertices=graph_store.vertex_count(),
        vertices_by_type={t: len(secondary_index.by_entity_type.get(t, []))
                          for t in ENTITY_TYPES},
        active_vertices=len(secondary_index.by_status.get("ACTIVE", [])),
        total_edges=graph_store.edge_count(),
        edges_by_type={t: len(secondary_index.by_edge_type.get(t, []))
                       for t in RELATIONSHIP_TYPES},
        graph_density=graph_store.edge_count() / max(1, graph_store.vertex_count() ** 2),
        avg_out_degree=graph_store.edge_count() / max(1, graph_store.vertex_count()),
        computed_at=now(),
    )
```

## Integration Points

- `entity-registry.md`: write path for all entity creation goes through GraphMutationPipeline
- `relationship-schema.md`: validates source/target type compatibility on edge write
- `graph-observability/integrity-validator.md`: uses validate_vertex / validate_edge directly
- `graph-query-engine/query-cache.md`: cache invalidation triggered on every mutation
- `knowledge-inference/inference-engine.md`: receives mutation notifications to schedule re-inference
