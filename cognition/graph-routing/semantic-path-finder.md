# Semantic Path Finder

## Purpose
Discovers meaningful paths through the enterprise knowledge graph between a source and target — where "meaningful" is defined by semantic coherence with the query intent, not just shortest hop count. Semantic path finding answers questions like: "What is the authority path from Agent Alpha to Policy POL-AI-001?", "How does this compliance obligation connect to the tasks that must implement it?", and "What chain of relationships links this incident to its underlying cause?" It is the analytical core behind multi-hop routing, impact tracing, and causal explanation — where the path itself, not just the endpoint, is the valuable output.

---

## Path Finding Strategies

```yaml
strategies:
  SHORTEST_PATH:
    algorithm: Dijkstra or BFS (unweighted)
    use_when: find the minimum hop connection between two known nodes
    output: single shortest path
    complexity: O(V + E)

  HIGHEST_WEIGHT_PATH:
    algorithm: modified Dijkstra maximizing edge weight product
    use_when: find the strongest/most trusted relationship chain
    output: single highest-weight path
    application: "find the delegation chain with highest trust scores"

  SEMANTIC_BEST_PATH:
    algorithm: best-first search guided by semantic similarity to query
    use_when: find the path most relevant to a query intent (not just structurally shortest)
    scoring: path_score = query_similarity × semantic_coherence × path_weight
    output: top-k paths ranked by semantic path score
    application: "find the authority chain most relevant to this data governance decision"

  ALL_SIMPLE_PATHS:
    algorithm: DFS with cycle avoidance
    use_when: enumerate all non-cyclic paths between two nodes (for impact analysis)
    max_paths: 50 (cap to avoid combinatorial explosion)
    max_hops: 8

  K_SHORTEST_PATHS:
    algorithm: Yen's k-shortest paths
    use_when: find top-k alternative routes (for routing redundancy, backup paths)
    output: k distinct paths with their scores
    application: backup routing; redundancy analysis

  SEMANTIC_SUBGRAPH_PATH:
    algorithm: semantic traversal (from semantic-graph-traversal.md) between anchor nodes
    use_when: find path through semantically coherent intermediate nodes
    output: paths where intermediate nodes are semantically related to query
```

---

## Path Request Schema

```yaml
path_request:
  request_id: "PATH-{timestamp_ms}-{random_6char}"
  
  source:
    node_id: node_id | null
    node_type: string | null
    node_query: string | null          # if node_id unknown: resolve via entity lookup first
  
  target:
    node_id: node_id | null
    node_type: string | null
    node_query: string | null
  
  path_constraints:
    strategy: SHORTEST_PATH | HIGHEST_WEIGHT_PATH | SEMANTIC_BEST_PATH | ALL_SIMPLE_PATHS | K_SHORTEST_PATHS
    k: int | null                      # for K_SHORTEST_PATHS; default 5
    max_hops: int (default 6)
    allowed_edge_types: [edge_type] | null   # null = all types
    forbidden_edge_types: [edge_type] | null
    allowed_node_types: [node_type] | null
    min_edge_weight: float | null
    min_edge_confidence: float | null
    temporal_context: ISO-8601 | null  # point-in-time; null = current
    require_all_edges_active: boolean (default true)

  semantic_context:
    query_text: string | null          # for SEMANTIC_BEST_PATH; guides relevance scoring
    query_embedding: float[1536] | null
    
  requestor: agent_id
  purpose: ROUTING | IMPACT_ANALYSIS | AUTHORITY_VERIFICATION | CAUSAL_TRACING | EXPLANATION
```

---

## Path Scoring

```yaml
path_scoring:
  structural_score:
    formula: Π(edge.weight for edge in path)
    semantics: overall relationship strength (product; any weak link reduces total)
    range: [0.0, 1.0]

  semantic_coherence_score:
    formula: mean(cosine(node_i.embedding, node_{i+1}.embedding) for consecutive node pairs)
    semantics: how semantically consistent the path is (does it stay "on topic"?)
    range: [0.0, 1.0]

  query_alignment_score:
    formula: mean(cosine(query_embedding, node.embedding) for all nodes in path)
    semantics: how aligned each node on the path is with the query intent
    only_computed_when: query_embedding provided
    range: [0.0, 1.0]

  hop_penalty:
    formula: 0.05 × hop_count
    semantics: longer paths are penalized (prefer shorter when scores equal)

  composite_path_score:
    with_query:    0.40 × structural + 0.25 × semantic_coherence + 0.30 × query_alignment - hop_penalty
    without_query: 0.60 × structural + 0.40 × semantic_coherence - hop_penalty
    range: [0.0, 1.0]
    
  temporal_validity_score:
    formula: min(edge.confidence for edge in path) × (1.0 if all edges active else 0.50)
    semantics: a path through expired or low-confidence edges is less reliable
    applied_as: multiplier on composite_path_score
```

---

## Path Examples and Applications

```yaml
path_applications:
  AUTHORITY_PATH:
    query: "What is the authority chain from agent-worker-001 to policy POL-DATA-003?"
    source: AGENT {agent_id: "agent-worker-001"}
    target: POLICY {policy_id: "POL-DATA-003"}
    allowed_edge_types: [DELEGATES_TO, REPORTS_TO, GOVERNS]
    strategy: HIGHEST_WEIGHT_PATH
    interpretation: the path shows who delegated authority to whom, ending at the governing policy
    output_use: authority verification; delegation chain audit

  OBLIGATION_TO_TASK_PATH:
    query: "How does GDPR Art.5 Purpose Limitation connect to this data processing task?"
    source: OBLIGATION {obligation_id: "OBL-GDPR-ART5"}
    target: TASK {task_id: "task-data-proc-042"}
    allowed_edge_types: [ENFORCES, GOVERNS, DEPENDS_ON, GATED_BY_POLICY]
    strategy: SEMANTIC_BEST_PATH
    query_text: "GDPR purpose limitation data processing enforcement"
    interpretation: shows the chain from regulation → policy → constraint → task

  INCIDENT_TO_ROOT_CAUSE:
    query: "Trace root causes of incident INC-2026-042"
    source: EVENT {event_id: "INC-2026-042"}
    target: null   # no single target; find root cause nodes (nodes with no incoming CAUSED_BY)
    allowed_edge_types: [CAUSED_BY, IMPACTS, AT_RISK_FROM]
    strategy: ALL_SIMPLE_PATHS
    interpretation: paths ending at leaf CAUSED_BY nodes reveal root causes

  DELEGATION_TRUST_PATH:
    query: "Find the most trusted delegation path from orchestrator to target agent"
    source: AGENT {agent_id: "agt-orchestrator"}
    target: AGENT {agent_id: "agt-target"}
    allowed_edge_types: [DELEGATES_TO]
    strategy: HIGHEST_WEIGHT_PATH
    interpretation: highest product of delegation weights = most trustworthy chain

  COMPLIANCE_COVERAGE_PATH:
    query: "How is EU AI Act Article 12 covered by our policies and controls?"
    source: OBLIGATION {obligation_id: "OBL-EUAIACT-012"}
    strategy: ALL_SIMPLE_PATHS (from obligation outward)
    allowed_edge_types: [ENFORCES, DERIVED_FROM, REFERENCES, GOVERNS]
    max_hops: 3
    interpretation: paths show which policies enforce which obligations; gaps are paths that don't reach operational controls
```

---

## Path Output Schema

```yaml
path_result:
  request_id: string
  
  paths: [{
    path_id: "PATH-{random_8char}"
    nodes: [{node_id, node_type, name, embedding_summary}]
    edges: [{edge_id, edge_type, weight, confidence, valid_from, valid_until}]
    
    scores:
      composite: float
      structural: float
      semantic_coherence: float
      query_alignment: float | null
      temporal_validity: float
    
    explanation: string    # "Agent Alpha → [DELEGATES_TO (w=0.85)] → Agent Beta → [GOVERNS (w=1.0)] → Policy POL-AI-003"
    hop_count: int
    is_currently_valid: boolean    # all edges active right now?
    temporal_validity_window:
      from: ISO-8601               # most recent valid_from
      until: ISO-8601 | null       # earliest valid_until
  }]
  
  metadata:
    source_node_id: node_id
    target_node_id: node_id | null
    paths_found: int
    paths_evaluated: int
    strategy_used: string
    latency_ms: int
    no_path_found: boolean
    no_path_reason: string | null   # "no edge types allow connection between source and target"
```

---

## Path Caching

```yaml
path_cache:
  cache_key: hash(source_node_id + target_node_id + strategy + edge_type_filter + temporal_context)
  capacity: 5,000 path results
  TTL: 30s for CURRENT queries (topology changes frequently)
       3600s for historical (AT TIME) queries (stable)
  invalidation: on any topology change affecting source or target node's neighborhood
  never_cache: ALL_SIMPLE_PATHS results (too many paths; caching is wasteful)
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-memory/semantic-graph-traversal.md` | Semantic traversal algorithm used in SEMANTIC_BEST_PATH |
| `graph-cognition/graph-query-language.md` | GQL path functions used for SHORTEST_PATH queries |
| `graph-cognition/graph-index-manager.md` | Adjacency index enables fast neighbor expansion |
| `graph-routing/multi-hop-router.md` | Multi-hop routing uses path finder for route computation |
| `graph-reasoning/causal-reasoning-engine.md` | Causal tracing uses ALL_SIMPLE_PATHS to roots |
| `graph-reasoning/impact-propagation-engine.md` | Impact tracing uses paths from changed node |
| `enterprise-topology/org-relationship-graph.md` | Authority paths traverse org relationship edges |
