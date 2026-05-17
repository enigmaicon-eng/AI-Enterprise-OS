# Graph Query Language

## Purpose
Defines the Graph Query Language (GQL) used to express traversals, pattern matches, temporal filters, community lookups, and aggregation operations against the enterprise knowledge graph. GQL is a declarative language compiled to an optimized execution plan by the graph cognition engine. It supports natural language query translation (NL→GQL) for agent-facing interfaces and structured GQL expressions for system-to-system integration.

---

## Query Structure

```
GQL Query Structure:
  [MATCH clause]     → specify node and edge patterns to find
  [WHERE clause]     → filter matched patterns by property values, temporal windows, classification
  [WITH clause]      → intermediate result binding (for multi-step queries)
  [RETURN clause]    → specify what to return (nodes, edges, paths, aggregations)
  [ORDER BY clause]  → sort results
  [LIMIT clause]     → cap result count
  [AT TIME clause]   → temporal context for point-in-time queries
```

---

## MATCH Clause

```gql
# Node pattern: find nodes of a type
MATCH (n:AGENT)
MATCH (n:AGENT {tier: 3})
MATCH (n:AGENT {status: "ACTIVE", tier >= 2})

# Edge pattern: find relationships between nodes
MATCH (a:AGENT)-[:DELEGATES_TO]->(b:AGENT)
MATCH (a:AGENT)-[:DELEGATES_TO {confidence >= 0.8}]->(b:AGENT)

# Path pattern: find multi-hop paths
MATCH (a:AGENT)-[:DELEGATES_TO*1..4]->(b:AGENT)   # 1 to 4 hops
MATCH (a)-[*]->(b:TASK {status: "BLOCKED"})         # any edge type, any depth

# Bidirectional pattern
MATCH (a:AGENT)-[:COLLABORATES_WITH]-(b:AGENT)      # either direction

# Named path
MATCH path = (a:AGENT)-[:DELEGATES_TO*]->(b:AGENT)

# Variable-length with constraints on intermediate nodes
MATCH (start:AGENT)-[:DEPENDS_ON*1..6 {criticality: "HIGH"}]->(end:TASK)
```

---

## WHERE Clause

```gql
# Property filters
WHERE n.tier >= 3
WHERE n.trust_score > 0.70 AND n.status = "ACTIVE"
WHERE n.name CONTAINS "governance"
WHERE n.name IN ["agent-alpha", "agent-beta"]
WHERE n.agent_id IS NOT NULL

# Edge property filters
WHERE r.weight > 0.5
WHERE r.confidence >= 0.8

# Temporal filters
WHERE r.valid_from <= "2026-05-15T00:00:00Z" AND (r.valid_until IS NULL OR r.valid_until > "2026-05-15T00:00:00Z")
# Shorthand using AT TIME:
AT TIME "2026-05-15T12:00:00Z"   # applies temporal filter to all edges in query

# Classification filter
WHERE n.classification IN ["INTERNAL", "CONFIDENTIAL"]

# Subquery filter
WHERE EXISTS {
  MATCH (n)-[:AT_RISK_FROM]->(risk:EVENT)
  WHERE risk.severity = "CRITICAL"
}

# NOT EXISTS
WHERE NOT EXISTS {
  MATCH (n)-[:MEMBER_OF]->(:COMMUNITY {community_type: "GOVERNANCE"})
}
```

---

## AT TIME Clause

```gql
# Point-in-time query — see graph as it existed at a specific moment
MATCH (a:AGENT)-[r:DELEGATES_TO]->(b:AGENT)
AT TIME "2026-03-01T00:00:00Z"
RETURN a.agent_id, b.agent_id, r.scope

# Current state (default if AT TIME omitted)
MATCH (a:AGENT)-[r:DELEGATES_TO]->(b:AGENT)
RETURN a, r, b

# Time range — edges valid at any point in the range
MATCH (a:AGENT)-[r:DELEGATES_TO]->(b:AGENT)
BETWEEN "2026-01-01T00:00:00Z" AND "2026-03-31T23:59:59Z"
RETURN a, r, b, r.valid_from, r.valid_until

# Transaction time — when did we record this?
MATCH (a:AGENT)-[r:DELEGATES_TO]->(b:AGENT)
AS_OF_TRANSACTION "2026-03-15T00:00:00Z"
RETURN a, r, b
```

---

## WITH Clause (Multi-Step Queries)

```gql
# Collect intermediate results and continue
MATCH (a:AGENT {tier >= 3})-[:DELEGATES_TO]->(b:AGENT)
WITH a, b, count(b) AS delegation_count
WHERE delegation_count > 3
MATCH (b)-[:ASSIGNED_TO]->(t:TASK)
RETURN a.agent_id, delegation_count, count(t) AS active_tasks
```

---

## RETURN Clause

```gql
# Return nodes
RETURN n
RETURN n.agent_id, n.tier, n.trust_score

# Return edges
RETURN r
RETURN r.edge_type, r.weight, r.valid_from

# Return paths
RETURN path
RETURN length(path), nodes(path), relationships(path)

# Return aggregations
RETURN count(n), avg(n.trust_score), max(n.tier), min(r.weight)
RETURN collect(n.agent_id) AS agent_list
RETURN sum(r.weight) AS total_weight

# Return community context
RETURN n, n.community_ids, community_summary(n)

# Return with relevance score (for hybrid search results)
RETURN n, score(n) AS relevance ORDER BY relevance DESC
```

---

## SEMANTIC SEARCH Extension

```gql
# Vector similarity search — find nodes semantically similar to a query
SEMANTIC MATCH (n)
WHERE semantic_similarity(n, "agents responsible for data governance") > 0.75
RETURN n ORDER BY semantic_similarity(n, "agents responsible for data governance") DESC
LIMIT 10

# Combined semantic + structural
SEMANTIC MATCH (n:AGENT)
WHERE semantic_similarity(n, "compliance expertise") > 0.70
MATCH (n)-[:GOVERNS]->(p:POLICY)
RETURN n, p ORDER BY semantic_similarity(n, "compliance expertise") DESC

# Community-level semantic search (search community summaries)
SEMANTIC MATCH COMMUNITY (c)
WHERE semantic_similarity(c, "AI governance and oversight") > 0.80
MATCH (n)-[:MEMBER_OF]->(c)
RETURN n, c.summary
```

---

## Path Functions

```gql
# Path weight (product of edge weights along path)
path_weight(path) → float

# Shortest path
MATCH path = shortestPath((a:AGENT)-[*]->(b:TASK))
WHERE a.agent_id = "agt-001" AND b.task_id = "task-099"
RETURN path, length(path)

# All shortest paths
MATCH paths = allShortestPaths((a)-[*]->(b))
RETURN paths

# Highest-weight path
MATCH path = maxWeightPath((a:AGENT)-[:DEPENDS_ON*]->(b:TASK))
RETURN path, path_weight(path)

# Path temporal validity (earliest valid_from, latest valid_until across all edges)
path_valid_from(path) → ISO-8601
path_valid_until(path) → ISO-8601 | null

# Nodes and relationships on path
nodes(path) → [node]
relationships(path) → [edge]
length(path) → int
```

---

## Aggregation Functions

```gql
count(n)                          → int
avg(n.property)                   → float
sum(r.weight)                     → float
max(n.tier), min(n.tier)         → any
collect(n.agent_id)               → [any]
percentile(n.trust_score, 0.99)   → float
stdev(n.trust_score)              → float

# Graph-specific aggregations
degree(n)                         → int (total neighbor count)
out_degree(n)                     → int
in_degree(n)                      → int
betweenness_centrality(n)         → float (computed from cached centrality scores)
closeness_centrality(n)           → float
community_cohesion(c)             → float
```

---

## Query Execution Plans

```yaml
query_plan:
  optimizer: cost-based; estimates cardinality for each operation
  
  scan_strategies:
    full_node_scan: last resort; only when no index applicable
    type_index_scan: use node_type index (preferred for typed queries)
    property_index_scan: use BM25 or range index on specific property
    adjacency_lookup: O(1) from adjacency_index by node_id
    vector_ANN_search: for SEMANTIC MATCH operations

  join_strategies:
    hash_join: for large intermediate result sets
    nested_loop_join: for small result sets or when index is available on inner side
    expand_join: for traversal (expand adjacency from anchor nodes hop-by-hop)

  temporal_optimization:
    AT_TIME queries: use temporal_index (partitioned by day) — avoid full edge scan
    CURRENT queries: filter edges WHERE valid_until IS NULL (indexed separately)

  plan_cache:
    key: hash(query_text + parameter_types)
    capacity: 500 plans; TTL: 600s
    invalidation: on schema change
```

---

## Natural Language to GQL Translation

```yaml
nl_to_gql:
  purpose: allow agents to query the graph in natural language
  method:
    1. embed query text
    2. classify query intent: LOOKUP | TRAVERSAL | AGGREGATION | TEMPORAL | SEMANTIC
    3. extract entities mentioned → map to node_ids via BM25+vector hybrid
    4. generate GQL using intent + entities + context
    5. validate GQL against schema
    6. execute or return GQL for agent inspection

  examples:
    NL: "Who does agent-alpha delegate to?"
    GQL: MATCH (a:AGENT {agent_id: "agent-alpha"})-[:DELEGATES_TO]->(b:AGENT) RETURN b

    NL: "What policies governed task-007 in March 2026?"
    GQL: MATCH (p:POLICY)-[:GOVERNS]->(t:TASK {task_id: "task-007"}) AT TIME "2026-03-15T00:00:00Z" RETURN p

    NL: "Which agents have an open CRITICAL finding?"
    GQL: MATCH (a:AGENT)-[:AT_RISK_FROM]->(e:EVENT {event_type: "FINDING", severity: "CRITICAL"}) WHERE e.active = true RETURN a

    NL: "Find agents similar to 'governance expertise' who are tier 3+"
    GQL: SEMANTIC MATCH (a:AGENT) WHERE semantic_similarity(a, "governance expertise") > 0.70 AND a.tier >= 3 RETURN a ORDER BY semantic_similarity(a, "governance expertise") DESC
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | GQL parsed and executed by engine |
| `graph-cognition/graph-index-manager.md` | Query planner selects indexes |
| `graph-memory/graph-retrieval-engine.md` | Memory retrieval expressed as GQL |
| `graph-routing/semantic-path-finder.md` | Path queries use GQL path functions |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Reasoning chains expressed as multi-hop GQL |
| `temporal-knowledge-graphs/historical-truth-system.md` | AT TIME / BETWEEN clauses |
