# Graph Index Manager

## Purpose
Maintains the index infrastructure that makes the enterprise knowledge graph queryable at production latency. The index manager owns all derived index structures — vector, BM25, adjacency, temporal, community, and centrality — keeping them consistent with the primary graph store through event-driven update pipelines. It provides the query planner with cardinality estimates and index selection advice, and manages index rebuilds, rebalancing, and integrity verification.

---

## Index Architecture

```
Primary Graph Store
        │
        ├─[Write Event]──────────────────────────────────────┐
        │                                                    ▼
        │                                     [Index Update Pipeline]
        │                                            │
        │                         ┌──────────────────┼──────────────────┐
        │                         ▼                  ▼                  ▼
        │                [Adjacency Index]   [Temporal Index]   [Vector Index]
        │                         │                  │                  │
        │                [BM25 Index]      [Centrality Cache]  [Community Index]
        │
        └─[Read Event]──────────────────────────────────────┐
                                                            ▼
                                              [Index Manager: Query Planning]
                                                    │
                                      selects optimal index(es) for query
                                      returns estimated cardinality
                                      handles index miss → primary fallback
```

---

## Index Definitions

```yaml
indexes:
  adjacency_index:
    description: maps each node_id to its neighbor nodes and connecting edges
    structure:
      forward: {node_id → [{edge_id, target_node_id, edge_type, weight}]}   # out-edges
      reverse: {node_id → [{edge_id, source_node_id, edge_type, weight}]}   # in-edges
    storage: key-value store (hash map)
    update_trigger: every APPEND_EDGE or INVALIDATE_EDGE operation
    update_latency: async; p99 < 100ms after primary write
    use_cases:
      - 1-hop neighborhood expansion
      - edge existence check
      - degree computation
    performance: O(1) lookup by node_id; O(degree) to enumerate neighbors

  temporal_index:
    description: time-partitioned index for efficient point-in-time edge queries
    structure:
      partition_by: date of edge valid_from (daily partitions)
      within_partition: sorted by valid_from; includes valid_until for range queries
      active_edge_index: separate index of edges where valid_until IS NULL
    storage: time-series key-value store
    update_trigger: every APPEND_EDGE (add to partition) and INVALIDATE_EDGE (update valid_until)
    use_cases:
      - AT TIME queries: find all edges valid at timestamp T
      - BETWEEN queries: find edges valid in a time range
      - Current-state queries: filter on active_edge_index
    performance: partition lookup O(log partitions); within-partition scan O(edges_in_day)

  vector_index:
    description: approximate nearest neighbor (ANN) index over node embeddings
    algorithm: HNSW (hierarchical navigable small world)
    dimensions: 1536
    indexed_artifacts:
      - node embeddings (all active nodes)
      - community summary embeddings
    update_trigger: async; new nodes indexed within 5 seconds of primary write
    update_strategy: incremental insertion (HNSW supports online insertion)
    rebuild_trigger: when deletion_rate > 10% (rebuild is more efficient than incremental deletion)
    use_cases:
      - SEMANTIC MATCH queries
      - entity resolution (find existing node matching new entity name)
      - similar-entity discovery
    performance: p99 < 20ms for top-k (k=20) ANN search

  BM25_index:
    description: inverted full-text index for keyword and exact-match search
    indexed_fields:
      - node.name (boosted ×3)
      - node.aliases (boosted ×2)
      - node.properties.description (boosted ×1)
      - node.properties.content (boosted ×1)
    tokenization: whitespace + punctuation; lowercase normalization; stemming disabled (preserve IDs)
    update_trigger: async; new nodes indexed within 2 seconds
    use_cases:
      - exact name lookup
      - partial name search
      - keyword search within node properties
    performance: p99 < 10ms for BM25 query

  community_index:
    description: maps community_ids to member nodes and reverse
    structure:
      community_to_members: {community_id → [node_id]}
      node_to_communities: {node_id → [community_id]}
    update_trigger: on community recompute events
    use_cases:
      - retrieve all members of a community
      - find communities a node belongs to
      - community-level semantic search (search community summaries via vector_index)
    performance: O(1) lookup; O(members) enumeration

  centrality_cache:
    description: precomputed centrality scores for all nodes
    metrics_cached: [degree_centrality, betweenness_centrality, closeness_centrality, pagerank]
    update_frequency: daily full recompute; incremental update on significant topology changes
    storage: key-value {node_id → {metric: score}}
    use_cases:
      - identify most connected/influential nodes
      - rank nodes by centrality for query results
      - community center node selection
    staleness_tolerance: 24 hours acceptable (centrality is trend metric, not real-time)

  property_indexes:
    description: range and equality indexes on high-selectivity node properties
    indexed_properties:
      - AGENT.tier (range)
      - AGENT.trust_score (range)
      - AGENT.status (equality)
      - TASK.status (equality)
      - TASK.priority (equality)
      - EVENT.severity (equality)
      - METRIC.metric_type (equality)
    update_trigger: synchronous on node upsert (property indexes are lightweight)
    performance: O(log n) range lookup; O(1) equality lookup
```

---

## Query Planning

```yaml
query_planner:
  input: parsed GQL query (AST)
  output: execution plan with selected indexes and estimated cardinality

  selection_rules:
    rule_1_exact_id_lookup:
      trigger: WHERE clause contains node_id = or edge_id =
      plan: direct primary store lookup (no index needed)
      estimated_cardinality: 1

    rule_2_type_plus_property:
      trigger: MATCH (n:TYPE) WHERE n.property = value
      plan: property_index[TYPE.property] → filter; estimated cardinality from index stats
      example: MATCH (a:AGENT) WHERE a.tier = 3

    rule_3_adjacency_traversal:
      trigger: MATCH (a)-[r:EDGE_TYPE]->(b) with known anchor node
      plan: adjacency_index[anchor_node_id] → expand → filter by edge_type
      estimated_cardinality: degree(anchor_node) × selectivity(edge_type)

    rule_4_temporal_query:
      trigger: AT TIME clause or BETWEEN clause
      plan: temporal_index[date_partition] → filter by valid_from/valid_until
      fallback: if partition not in index, scan primary store for that date range

    rule_5_semantic_query:
      trigger: SEMANTIC MATCH clause
      plan: embed query text → vector_index.ANN_search → filter by node_type + WHERE
      estimated_cardinality: min(k_neighbors, WHERE_filter_selectivity)

    rule_6_keyword_query:
      trigger: WHERE n.name CONTAINS or WHERE n.name = (no anchor node)
      plan: BM25_index.search(query_text) → filter by WHERE
      estimated_cardinality: BM25 document frequency estimate

    rule_7_hybrid:
      trigger: complex query with both semantic and structural components
      plan: parallel(vector_index + BM25_index + adjacency_traversal) → RRF merge → filter
      estimated_cardinality: based on highest-selectivity component

    rule_8_full_scan_fallback:
      trigger: no applicable index
      action: log WARNING "full scan required for query {query_id}"; proceed with scan
      recommendation: add property_index if this query is frequent

  plan_cache:
    key: hash(query_AST_structure + parameter_types)  # not values, only types
    capacity: 500 plans
    TTL: 600s
    invalidation: schema change events
```

---

## Index Update Pipeline

```yaml
index_update_pipeline:
  trigger: every write to primary graph store emits a graph_write_event

  graph_write_event:
    event_type: NODE_CREATED | NODE_UPDATED | EDGE_APPENDED | EDGE_INVALIDATED | COMMUNITY_UPDATED
    affected_node_ids: [node_id]
    affected_edge_ids: [edge_id]
    write_timestamp: ISO-8601

  update_handlers:
    NODE_CREATED:
      - BM25_index: add document
      - vector_index: insert embedding (async; deduplicated queue)
      - property_indexes: add to applicable indexes
      - adjacency_index: no-op (no edges yet)
      - community_index: candidate for community recompute (queued)

    NODE_UPDATED:
      - BM25_index: update document (delete + re-add)
      - vector_index: update embedding (delete + re-insert)
      - property_indexes: update affected indexes
      - centrality_cache: invalidate for affected node

    EDGE_APPENDED:
      - adjacency_index: add to forward (source) and reverse (target) lists
      - temporal_index: add to appropriate date partition + active_edge_index
      - community_index: queue community recompute for affected node neighborhood

    EDGE_INVALIDATED:
      - adjacency_index: remove from active adjacency lists
      - temporal_index: update valid_until in partition; remove from active_edge_index
      - community_index: queue community recompute

    COMMUNITY_UPDATED:
      - community_index: replace old community data
      - vector_index: upsert community summary embedding
      - centrality_cache: update center_node centrality score

  update_latency_targets:
    adjacency_index: p99 < 100ms
    temporal_index: p99 < 50ms
    vector_index: within 5s (batched)
    BM25_index: within 2s (batched)
    property_indexes: synchronous (< 10ms)

  failure_handling:
    failed_update: write to update_retry_queue (dead letter queue)
    retry_policy: exponential backoff; 3 attempts; max delay 60s
    unrecoverable_failure: alert; trigger partial index rebuild for affected partition
```

---

## Index Integrity Verification

```yaml
integrity_verification:
  frequency:
    adjacency_index: daily consistency check (verify adjacency matches primary graph edges)
    temporal_index: daily (verify active_edge_index matches edges with valid_until IS NULL)
    vector_index: weekly (verify all active nodes have corresponding embeddings)
    BM25_index: weekly (verify indexed document count matches active node count)

  consistency_check_method:
    1. count records in index
    2. count records in primary graph store (authoritative)
    3. report gap if discrepancy > 0.01% (1 in 10,000)
    4. for gaps detected: queue targeted index repair

  index_repair:
    full_rebuild:
      trigger: index corruption detected; gap > 1%; schema migration
      method: stream all records from primary graph store; rebuild index from scratch
      duration_estimate: 10M nodes/edges → ~30 minutes
      impact: reads fall back to primary store during rebuild (latency degraded)

    partial_rebuild:
      trigger: specific partition or node_type affected
      method: rebuild only the affected segment
      duration: proportional to segment size

  integrity_report:
    frequency: daily
    consumers: [graph_observability, compliance_governance_lead]
    fields: [index_name, record_count, primary_count, gap_count, gap_rate, last_verified_at]
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Index updates triggered by engine write events |
| `graph-cognition/graph-storage-model.md` | Primary store is source of truth for index repair |
| `graph-cognition/graph-query-language.md` | Query planner uses index manager for plan selection |
| `graph-memory/graph-retrieval-engine.md` | Retrieval engine routes queries through index manager |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Adjacency index used for fast hop expansion |
| `graph-observability/topology-visualization.md` | Centrality cache powers topology visualization |
| `enterprise-topology/runtime-topology-tracker.md` | Topology updates trigger adjacency and community index updates |
