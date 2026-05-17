# Graph Storage Model

## Purpose
Defines the persistent storage architecture for the enterprise knowledge graph — how nodes, edges, episodes, and communities are stored, versioned, retrieved, and garbage-collected. The storage model enforces append-only semantics for edges (graph history is never deleted), provides bi-temporal indexing for point-in-time queries, and guarantees consistency between the primary graph store and derived indexes. Storage integrity is verified cryptographically; every write is hash-chained.

---

## Storage Architecture

```
Write Path:
  Graph Mutation Request
        ↓
[Write Validation]       → schema check; classification enforcement; duplicate detection
        ↓
[Integrity Computation]  → compute node/edge hash; link to prior record in chain
        ↓
[Primary Write]          → write to primary graph store (append-only)
        ↓
[Secondary Index Write]  → update adjacency, temporal, vector, BM25 indexes (async)
        ↓
[Replication]            → replicate to read replicas
        ↓
[Confirmation]           → return write_id and graph_position

Read Path:
  Read Request (node_id | edge_id | query)
        ↓
[Cache Check]            → check multi-level cache
        ↓
[Index Selection]        → select optimal index based on query type
        ↓
[Storage Read]           → read from primary (strong consistency) or replica (eventual)
        ↓
[Temporal Filter]        → apply valid_from / valid_until filter if temporal context specified
        ↓
[Result Assembly]        → reconstruct node/edge objects from stored records
```

---

## Storage Layers

```yaml
storage_layers:
  primary_graph_store:
    type: native graph database (property graph model)
    consistency: strong (all writes go here first)
    ACID: yes — each write is atomic; partial writes rolled back
    append_only_edges: true — edges are never updated; only new edges are written
    node_updates: upsert — properties merged; embedding updated; history preserved in changelog

  adjacency_index:
    type: key-value store keyed by node_id
    structure: {node_id: {out_edges: [edge_id], in_edges: [edge_id], neighbor_node_ids: [node_id]}}
    consistency: eventually consistent with primary (async update; lag < 100ms)
    purpose: O(1) neighborhood lookup without traversing full graph store

  temporal_index:
    type: time-partitioned inverted index
    structure: partitions by day (valid_from date); each partition lists active edges
    purpose: efficient point-in-time queries — "what edges were valid at timestamp T?"
    retention: 10 years (constitutional/regulatory edges); 7 years (security); 5 years (operational)

  vector_index:
    type: approximate nearest neighbor (ANN) index
    dimensions: 1536
    algorithm: HNSW (hierarchical navigable small world)
    indexed_artifacts: node embeddings + community summary embeddings
    consistency: async; new nodes appear in vector index within 5 seconds of write
    purpose: semantic similarity search

  BM25_index:
    type: inverted full-text index
    indexed_fields: [node.name, node.aliases, node.properties.description, node.properties.content]
    purpose: keyword and exact-match search; complements vector search

  episode_store:
    type: append-only document store
    indexed_by: [episode_id, source_id, episode_type, valid_from, session_id]
    purpose: preserve raw ingestion record; enable replay and re-extraction
    retention: same as temporal_index retention by episode_type category
```

---

## Node Storage Record

```yaml
node_storage_record:
  # Stored in primary graph store
  node_id: string
  node_type: string
  name: string
  aliases: [string]
  properties: map<string, any>
  embedding: float[1536]
  community_ids: [community_id]
  centrality_score: float
  active: boolean
  classification: string

  created_at: ISO-8601
  created_by_episode: episode_id
  updated_at: ISO-8601
  updated_by_episode: episode_id

  property_changelog:
    - changed_at: ISO-8601
      changed_by_episode: episode_id
      property_key: string
      old_value: any
      new_value: any
    # full property history preserved

  integrity:
    node_hash: SHA-256           # hash of (node_id + node_type + name + properties + updated_at)
    prior_node_hash: SHA-256     # hash of previous version (chain)
    chain_sequence: int          # monotonically increasing across all graph writes
    signed_by: system_id
```

---

## Edge Storage Record

```yaml
edge_storage_record:
  # Append-only — edges are NEVER modified after write
  edge_id: string
  edge_type: string
  source_node_id: node_id
  target_node_id: node_id
  directed: boolean
  weight: float
  confidence: float
  properties: map<string, any>

  temporal:
    valid_from: ISO-8601
    valid_until: ISO-8601 | null     # null = open; system writes valid_until when invalidated
    transaction_from: ISO-8601
    transaction_until: ISO-8601 | null

  provenance:
    source_episode_id: episode_id
    extraction_method: string
    invalidated_by_episode: episode_id | null   # written by invalidation pipeline
    invalidation_reason: string | null

  integrity:
    edge_hash: SHA-256     # hash of (edge_id + edge_type + source + target + valid_from + properties)
    prior_edge_hash: SHA-256
    chain_sequence: int
    issuer_signature: Ed25519
    ingestion_countersignature: Ed25519
```

---

## Write Operations

```yaml
write_operations:
  UPSERT_NODE:
    input: node data (with node_id or name+type for resolution)
    behavior:
      new_node: create; assign node_id; compute embedding; write to all indexes
      existing_node: merge properties; update embedding; append to property_changelog; update node_hash
    atomicity: single atomic write to primary; async index propagation

  APPEND_EDGE:
    input: edge data (source, target, type, properties, temporal)
    behavior: always create new edge record; never update existing edge
    constraints:
      - source_node_id must exist
      - target_node_id must exist
      - edge_type must be registered in schema
    invalidation_check: scan for contradicting active edges before write
    atomicity: edge write + any invalidation writes in same transaction

  INVALIDATE_EDGE:
    input: edge_id, invalidation_episode_id, reason
    behavior: write valid_until = current_timestamp to the edge record
    note: this is implemented as a property update on the edge record — the edge itself is not deleted
    atomicity: single atomic write

  UPSERT_COMMUNITY:
    input: community data (center_node, member_nodes, summary)
    behavior: create or replace community record; update member nodes' community_ids
    trigger: called by community recompute job

  ARCHIVE_EPISODE:
    input: episode_id
    behavior: move episode from hot store to cold archive after retention_hot_days (default 90)
    graph_records: unaffected (episode_id references preserved; episode content moved)
```

---

## Consistency and Integrity

```yaml
consistency:
  write_guarantee: after a successful write, all subsequent reads on the primary see the write
  replica_lag: read replicas are within 100ms of primary
  read_preference:
    STRONG_CONSISTENCY: read from primary (use for governance decisions, policy evaluation)
    EVENTUAL_CONSISTENCY: read from replica (use for analytics, reporting, dashboards)

  hash_chain_integrity:
    verification_frequency: continuous (each write verified before commit)
    full_chain_walk: daily
    breach_response: halt writes; alert; same response as immutable-policy-audit.md chain breach

  duplicate_detection:
    node_deduplication: name + node_type + key_properties → deterministic node_id (avoids duplicates on re-ingest)
    edge_deduplication: source + target + edge_type + valid_from → deduplicate within 1-second window

  classification_enforcement:
    write_gate: requestor's clearance must >= node/edge classification
    read_gate: enforced at storage layer before returning any record
    cross_classification_edges: if source and target have different classifications, edge inherits higher
```

---

## Retention and Lifecycle

```yaml
retention:
  hot_tier:
    duration: 90 days
    storage: primary graph store (high-performance)
    operations: full read/write/traversal

  warm_tier:
    duration: 1 year (from creation)
    storage: compressed graph store (slightly degraded performance)
    operations: full read; traversal; no direct write (append-only to hot tier first)

  cold_tier:
    duration: per retention schedule (5–10 years)
    storage: archival (read-only; reconstructable)
    operations: point-in-time query only; no traversal (reconstruct subgraph on demand)

  retention_schedule:
    CONSTITUTIONAL_and_REGULATORY_edges: 10 years
    SECURITY_and_AI_GOVERNANCE_edges: 7 years
    OPERATIONAL_edges: 5 years
    ANALYTICS_edges: 2 years
    EPHEMERAL_edges (TTL defined at creation): TTL-governed

  disposal:
    authority: Tier-4+ for CONSTITUTIONAL/REGULATORY; Tier-3+ for OPERATIONAL
    prohibition: edges under legal hold or with active external anchors cannot be disposed
    process: disposal logged in graph audit chain before removal
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | All writes go through engine |
| `graph-cognition/graph-index-manager.md` | Index updates triggered by storage writes |
| `temporal-knowledge-graphs/temporal-graph-model.md` | Bi-temporal schema enforced here |
| `temporal-knowledge-graphs/historical-truth-system.md` | Point-in-time reads use temporal_index |
| `governance-policies/immutable-policy-audit.md` | Graph writes audited; hash chain mirrors audit pattern |
| `policy-as-code/policy-engine.md` | Classification enforcement at write gate |
