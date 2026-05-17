# Graph Cognition Engine

## Purpose
Central runtime coordinating all graph operations: episode ingestion, entity and relationship extraction, temporal binding, conflict resolution, graph storage, index maintenance, and query execution. The graph cognition engine maintains a continuously evolving enterprise knowledge graph — a living representation of every entity, relationship, decision, and state change across the OS. All other graph subsystems operate through this engine as the authoritative graph runtime.

---

## Engine Architecture

```
Knowledge Input (events, decisions, actions, conversations, observations)
        ↓
[1. Episode Ingestion]        → normalize raw input into typed graph episodes
        ↓
[2. Entity Extraction]        → identify named entities + assign node types
        ↓
[3. Relationship Extraction]  → extract typed, directed relationships between entities
        ↓
[4. Temporal Binding]         → attach valid_from / valid_until to all new edges
        ↓
[5. Conflict Resolution]      → detect edges contradicting new facts; mark stale
        ↓
[6. Graph Write]              → persist nodes + edges to graph store (append-only)
        ↓
[7. Index Update]             → update vector, BM25, adjacency, and temporal indexes
        ↓
[8. Community Recompute]      → recompute affected semantic communities
        ↓
[9. Event Emission]           → emit GRAPH_UPDATED event to enterprise event bus

Query Path:
  Query Request
        ↓
[Query Planning]    → select retrieval strategy; identify anchor entities
        ↓
[Hybrid Search]     → parallel: vector search + BM25 + graph traversal
        ↓
[Subgraph Assembly] → merge search results into coherent subgraph
        ↓
[Result Synthesis]  → rank, filter, format; attach temporal context
```

---

## Cognition Request Schema

```yaml
cognition_request:
  request_id: "GCOG-{timestamp_ms}-{random_6char}"
  operation: INGEST | QUERY | TRAVERSE | REASON | EVOLVE | SNAPSHOT

  ingest_payload:
    episode_type: CONVERSATION | DECISION | TASK_COMPLETION | EVENT | OBSERVATION | POLICY_CHANGE | RELATIONSHIP_UPDATE
    source_id: string                      # agent_id, workflow_id, audit_event_id, human_id
    content: string                        # raw content for extraction pipeline
    structured_facts: [fact] | null        # pre-structured facts (bypasses extraction)
    valid_from: ISO-8601                   # when these facts became true in the world
    valid_until: ISO-8601 | null           # null = currently valid (open-ended)
    confidence: float (0.0–1.0)
    classification: CONFIDENTIAL | RESTRICTED | INTERNAL | PUBLIC
    extraction_options:
      extract_entities: boolean (default true)
      extract_relationships: boolean (default true)
      resolve_coreferences: boolean (default true)
      merge_with_existing: boolean (default true)

  query_payload:
    query_text: string                     # natural language or GQL expression
    anchor_entities: [entity_id] | null    # seed traversal from these nodes
    max_hops: int (default 3)
    temporal_context: ISO-8601 | null      # point-in-time query; null = current
    retrieval_strategy: VECTOR | BM25 | GRAPH_TRAVERSAL | HYBRID
    filters:
      node_types: [node_type] | null
      edge_types: [edge_type] | null
      min_confidence: float | null
      min_edge_weight: float | null
      classification_ceiling: string | null
    result_limit: int (default 20)
    include_communities: boolean (default false)

  requestor: agent_id | human_id
  session_id: string
  priority: CRITICAL | HIGH | MEDIUM | LOW
  timeout_ms: int (default 200)
```

---

## Cognition Response Schema

```yaml
cognition_response:
  request_id: string
  operation: string
  status: SUCCESS | PARTIAL | TIMEOUT | ERROR

  ingest_result:
    episode_id: "EPIS-{timestamp_ms}-{random_6char}"
    entities_extracted: int
    entities_merged: int                   # entities resolved to existing nodes
    relationships_extracted: int
    edges_created: int
    edges_invalidated: int                 # stale edges superseded by new facts
    communities_recomputed: int
    processing_latency_ms: int

  query_result:
    nodes: [graph_node]
    edges: [graph_edge]
    paths: [graph_path] | null
    communities: [community_summary] | null
    relevance_scores: map<node_id, float>
    retrieval_strategy_used: string
    temporal_snapshot_used: ISO-8601
    total_candidates_before_filter: int

  reasoning_result:
    reasoning_chain: [reasoning_step]
    conclusion: string
    confidence: float
    supporting_evidence: {node_ids: [node_id], edge_ids: [edge_id]}
    alternative_conclusions: [{conclusion: string, confidence: float}] | null

  metadata:
    graph_size: {node_count: int, edge_count: int, community_count: int}
    traversal_depth_reached: int | null
    cache_hit: boolean
    latency_ms: int
```

---

## Core Graph Primitives

```yaml
graph_node:
  node_id: "NODE-{type_prefix}-{random_8char}"
  node_type: ENTITY | AGENT | TASK | WORKFLOW | RESOURCE | KNOWLEDGE | EVENT | POLICY | CONSTRAINT | COMMUNITY | METRIC | OBLIGATION
  name: string
  aliases: [string]
  properties: map<string, any>
  embedding: float[1536]               # semantic embedding for vector similarity
  community_ids: [community_id]        # communities this node belongs to
  centrality_score: float             # graph centrality; updated periodically
  created_at: ISO-8601
  updated_at: ISO-8601
  created_by_episode: episode_id
  classification: string
  active: boolean                      # false = soft-deleted / superseded

graph_edge:
  edge_id: "EDGE-{type_prefix}-{random_8char}"
  edge_type: string                    # typed relationship (see graph-schema.md)
  source_node_id: node_id
  target_node_id: node_id
  directed: boolean (default true)
  weight: float (0.0–1.0)            # relationship strength or relevance
  confidence: float (0.0–1.0)        # extraction confidence

  temporal:
    valid_from: ISO-8601              # when this relationship became true
    valid_until: ISO-8601 | null      # null = currently valid
    transaction_from: ISO-8601        # system recording time
    transaction_until: ISO-8601 | null

  provenance:
    source_episode_id: episode_id
    extraction_method: EXPLICIT | INFERRED | DERIVED | SYSTEM_COMPUTED
    invalidated_by_episode: episode_id | null
    invalidation_reason: string | null

  properties: map<string, any>
  integrity:
    edge_hash: SHA-256
    signed_by: system_id

graph_path:
  path_id: "PATH-{random_8char}"
  nodes: [node_id]                    # ordered from source to target
  edges: [edge_id]
  total_weight: float                 # aggregated path weight
  hop_count: int
  temporal_validity:
    from: ISO-8601                    # most recent valid_from across all edges
    until: ISO-8601 | null            # earliest valid_until across all edges

community:
  community_id: "COMM-{random_8char}"
  center_node_id: node_id            # highest-centrality node
  member_node_ids: [node_id]
  community_type: SEMANTIC | STRUCTURAL | TEMPORAL | ORGANIZATIONAL | DOMAIN
  summary: string                    # generated summary of what this community represents
  summary_embedding: float[1536]
  cohesion_score: float              # internal edge density
  last_recomputed: ISO-8601
  stable: boolean                    # false = pending recomputation
```

---

## Episode Processing Pipeline

```yaml
episode_pipeline:
  step_1_normalization:
    input: raw episode content
    output: normalized text + metadata
    operations: [deduplication, encoding normalization, language detection]

  step_2_entity_extraction:
    method: NER + entity resolution against existing graph nodes
    entity_types_extracted: [AGENT, TASK, WORKFLOW, RESOURCE, POLICY, OBLIGATION, METRIC, EVENT, LOCATION, TIME]
    coreference_resolution: resolve pronouns and aliases to canonical entities
    output: [{entity_text, entity_type, canonical_node_id | new, confidence}]

  step_3_relationship_extraction:
    method: relation extraction between entity pairs
    edge_type_classification: classify into registered edge type taxonomy
    directionality_inference: determine source → target direction
    output: [{source_entity, edge_type, target_entity, confidence, properties}]

  step_4_temporal_binding:
    rule: every extracted relationship gets valid_from = episode timestamp
    valid_until: null (open) unless explicit end-time extracted from content
    transaction_from: current system time (immutable recording timestamp)

  step_5_conflict_detection:
    method: for each new edge, check for contradicting active edges
    contradiction_patterns:
      REPLACES: new fact supersedes old (e.g., new role assignment replaces prior)
      UPDATES: new fact updates a property (close old edge, open new)
      CONTRADICTS: direct logical contradiction (flag for human review if high-stakes)
    resolution: invalidate stale edges; set valid_until = new edge valid_from - 1ms

  step_6_graph_write:
    node_write: upsert existing nodes (merge new properties; update embedding)
    edge_write: append new edges (never modify existing edges — append-only)
    invalidation_write: update valid_until on stale edges

  step_7_index_update:
    vector_index: upsert node/edge embeddings
    BM25_index: index node names, aliases, and property text
    adjacency_index: update source→target and target→source adjacency lists
    temporal_index: update time-partitioned edge indexes
```

---

## Retrieval Strategies

```yaml
retrieval_strategies:
  VECTOR:
    method: embed query text; ANN search over node and edge embeddings
    use_when: semantic similarity lookup; "find entities related to X concept"
    latency: p99 < 20ms

  BM25:
    method: keyword search over node names, aliases, and indexed properties
    use_when: exact name lookup; known entity retrieval
    latency: p99 < 10ms

  GRAPH_TRAVERSAL:
    method: breadth-first or best-first expansion from anchor entities
    use_when: relationship chain queries; "what does X connect to via Y?"
    latency: p99 < 30ms (3 hops)

  HYBRID:
    method: parallel vector + BM25 + traversal; RRF (Reciprocal Rank Fusion) merge
    use_when: default for complex queries requiring both semantic and structural context
    fusion: reciprocal_rank_fusion with weights (vector=0.4, BM25=0.3, traversal=0.3)
    latency: p99 < 100ms
```

---

## Cache Architecture

```yaml
caches:
  node_cache:
    type: LRU
    capacity: 10,000 nodes
    TTL: 60s
    invalidation: on node update event

  edge_cache:
    type: LRU
    capacity: 50,000 edges
    TTL: 60s
    invalidation: on edge write or invalidation

  community_cache:
    type: LRU
    capacity: 500 communities
    TTL: 300s
    invalidation: on community recompute event

  query_result_cache:
    type: LRU; key = hash(query_text + temporal_context + filters)
    capacity: 1,000 results
    TTL: 30s
    never_cache: queries with temporal_context = null AND result contains active edges
                 (live queries must always see current graph state)
```

---

## Performance Targets

| Operation | p50 | p99 |
|---|---|---|
| Episode ingest (full pipeline) | 150ms | 500ms |
| Entity extraction | 50ms | 200ms |
| Edge invalidation check | 5ms | 50ms |
| Vector search | 8ms | 20ms |
| BM25 search | 3ms | 10ms |
| 1-hop traversal | 1ms | 5ms |
| 3-hop traversal | 10ms | 30ms |
| 6-hop traversal | 50ms | 150ms |
| Hybrid query | 30ms | 100ms |
| Community recompute (local) | 50ms | 200ms |

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-schema.md` | Node and edge type taxonomy |
| `graph-cognition/graph-storage-model.md` | Persistent graph storage backend |
| `graph-cognition/graph-index-manager.md` | Index maintenance and query routing |
| `temporal-knowledge-graphs/temporal-graph-model.md` | Bi-temporal edge semantics |
| `graph-memory/graph-retrieval-engine.md` | Query execution layer |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Reasoning over retrieved subgraphs |
| `enterprise-topology/runtime-topology-tracker.md` | Live topology ingest |
| `audit-and-evidence/audit-trail-governance.md` | All graph mutations audited |
| `policy-as-code/policy-engine.md` | Classification enforcement on node/edge writes |
