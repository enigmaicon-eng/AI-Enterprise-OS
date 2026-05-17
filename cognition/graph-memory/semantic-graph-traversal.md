# Semantic Graph Traversal

## Purpose
Extends structural graph traversal with semantic guidance — using embedding similarity to steer traversal toward contextually relevant nodes rather than blindly expanding all neighbors. Pure structural traversal explodes exponentially in dense graphs; pure vector search ignores relationships. Semantic graph traversal combines both: it starts from anchor nodes, selects which neighbors to expand based on their semantic alignment with the query, and follows relationship paths that are semantically coherent with the retrieval intent. The result is context-sensitive, relationship-aware retrieval that surfaces knowledge the structural and vector systems would miss individually.

---

## Semantic Traversal Principles

```yaml
principles:
  GUIDED_EXPANSION:
    definition: at each hop, select which neighbors to expand based on semantic similarity to query
    consequence: traversal follows semantically meaningful paths rather than expanding all reachable nodes
    analogy: a human expert navigating a knowledge graph follows conceptual threads, not all links

  COHERENT_PATHS:
    definition: paths whose nodes are semantically coherent with each other are preferred over incoherent paths
    consequence: the traversal stays "on topic" even across multiple hops
    implementation: score each candidate path by mean pairwise embedding similarity of path nodes

  RELATIONSHIP_TYPED_FILTERING:
    definition: different query intents should follow different relationship types
    consequence: "who has authority over X" follows GOVERNS/DELEGATES_TO; "what caused X" follows CAUSED_BY
    implementation: query intent classification → preferred edge_type filter for traversal

  SEMANTIC_STOPPING:
    definition: stop expanding a branch when semantic relevance drops below threshold
    consequence: traversal depth is adaptive — deep into relevant subgraphs, shallow into irrelevant ones
    implementation: compute relevance_score at each hop; prune if < threshold

  COMMUNITY_JUMPING:
    definition: when traversal reaches a community boundary, evaluate whether to cross into adjacent community
    consequence: allows traversal to bridge between related knowledge clusters
    implementation: compare community summary embeddings; cross if similarity > community_jump_threshold
```

---

## Semantic Traversal Algorithm

```yaml
semantic_traversal:
  input:
    query_text: string
    query_embedding: float[1536]
    anchor_nodes: [node_id]
    max_hops: int (default 3)
    max_nodes_expanded: int (default 200)
    min_relevance_threshold: float (default 0.40)
    preferred_edge_types: [edge_type] | null    # from query intent classification
    community_jump_threshold: float (default 0.65)

  algorithm:
    BEST_FIRST_SEMANTIC_BFS:
      data_structure: priority queue ordered by relevance_score (descending)
      
      initialization:
        1. compute anchor_node relevance = cosine(query_embedding, node.embedding)
        2. add all anchor nodes to priority queue
        3. visited = {} (prevent re-expansion)
      
      main_loop:
        while priority_queue not empty AND nodes_expanded < max_nodes_expanded:
          current_node = dequeue (highest relevance_score)
          visited.add(current_node.node_id)
          
          if current_node.hop_count >= max_hops: skip (depth limit)
          if current_node.relevance_score < min_relevance_threshold: break (all remaining nodes worse)
          
          yield current_node (include in result set)
          
          neighbors = get_filtered_neighbors(current_node, preferred_edge_types)
          for each neighbor:
            if neighbor not in visited:
              neighbor.relevance_score = score_neighbor(query_embedding, current_node, neighbor, edge)
              neighbor.hop_count = current_node.hop_count + 1
              neighbor.path_from_anchor = current_node.path + [neighbor.node_id]
              enqueue(neighbor, priority = neighbor.relevance_score)
      
      output: visited nodes ordered by relevance_score (descending)

  neighbor_filtering:
    get_filtered_neighbors(current_node, preferred_edge_types):
      adjacency = adjacency_index[current_node.node_id]
      if preferred_edge_types:
        return adjacency filtered by edge.edge_type IN preferred_edge_types
      else:
        return adjacency  # all neighbors

  scoring_function:
    score_neighbor(query_embedding, source_node, target_node, edge):
      # Component 1: semantic similarity to query
      query_similarity = cosine(query_embedding, target_node.embedding)
      
      # Component 2: contextual path coherence (does this node fit the path so far?)
      path_coherence = cosine(source_node.embedding, target_node.embedding)
      
      # Component 3: edge quality (higher weight/confidence edges preferred)
      edge_quality = edge.weight × edge.confidence
      
      # Component 4: node quality (confidence, relevance_score)
      node_quality = target_node.confidence × target_node.relevance_score
      
      # Composite score
      score = (
        query_similarity × 0.45 +
        path_coherence × 0.25 +
        edge_quality × 0.20 +
        node_quality × 0.10
      )
      
      # Penalize for hop distance (further hops are less certain)
      hop_penalty = 0.05 × target_node.hop_count
      
      return max(0.0, score - hop_penalty)
```

---

## Query Intent Classification

```yaml
intent_classification:
  purpose: map natural language query intent to preferred edge types and traversal strategies
  
  intents:
    AUTHORITY_CHAIN:
      signals: ["who governs", "who has authority over", "who approved", "who can override"]
      preferred_edge_types: [GOVERNS, DELEGATES_TO, REPORTS_TO, APPROVES]
      traversal_direction: INBOUND to the subject (find who governs/delegates to it)
      max_hops: 5 (authority chains can be deep)

    DEPENDENCY_CHAIN:
      signals: ["what does X depend on", "what blocks X", "prerequisites for"]
      preferred_edge_types: [DEPENDS_ON, PRECEDES, BLOCKED_BY]
      traversal_direction: OUTBOUND from subject (follow what it needs)
      max_hops: 8 (dependency chains can be deep)

    IMPACT_CHAIN:
      signals: ["what is affected by X", "impact of X", "what changes if X changes"]
      preferred_edge_types: [IMPACTS, CAUSED_BY, DEPENDS_ON]
      traversal_direction: INBOUND (find what depends on subject)
      max_hops: 4

    CAUSAL_CHAIN:
      signals: ["why did X happen", "what caused X", "root cause of"]
      preferred_edge_types: [CAUSED_BY, SUPPORTS, CONTRADICTS]
      traversal_direction: OUTBOUND from effect (trace back to causes)
      max_hops: 6

    EXPERTISE_NETWORK:
      signals: ["who knows about X", "who has experience with", "who should I ask about"]
      preferred_edge_types: [MEMBER_OF, COLLABORATES_WITH, PRODUCES, OWNS]
      traversal_direction: COMMUNITY_FIRST (find community, then members)
      max_hops: 3

    COMPLIANCE_CHAIN:
      signals: ["what regulations apply", "what policies govern", "compliance requirements for"]
      preferred_edge_types: [GOVERNS, ENFORCES, REFERENCES]
      traversal_direction: OUTBOUND (from subject to governing policies to obligations)
      max_hops: 4

    COLLABORATION_NETWORK:
      signals: ["who works with X", "team around X", "collaborators of"]
      preferred_edge_types: [COLLABORATES_WITH, MEMBER_OF, DELEGATES_TO]
      traversal_direction: BIDIRECTIONAL
      max_hops: 2
```

---

## Community-Aware Traversal

```yaml
community_traversal:
  purpose: leverage community structure to jump between related knowledge clusters

  within_community_traversal:
    method: standard semantic traversal within current community
    advantage: dense edges; high semantic coherence; fast saturation

  community_jump_evaluation:
    trigger: current node is a community CENTER node OR traversal has exhausted local expansion
    method:
      1. retrieve all adjacent communities (communities linked to current community via inter-community edges)
      2. compute similarity: cosine(query_embedding, adjacent_community.summary_embedding)
      3. if max_similarity > community_jump_threshold: cross into highest-scoring adjacent community
      4. start traversal from center_node of new community
    jump_limit: max 3 community jumps per query (prevent unbounded spreading)

  community_search_shortcut:
    trigger: query has no anchor entities; pure semantic search
    method:
      1. semantic search over community summary embeddings (fast)
      2. select top-3 communities
      3. start traversal from center_node of each selected community simultaneously
      4. merge results
    advantage: O(community_count) instead of O(node_count) for entry point selection
```

---

## Semantic Path Scoring

```yaml
path_scoring:
  purpose: rank multi-hop paths by overall quality for explanation and citation

  path_score_components:
    semantic_coherence:
      description: how semantically consistent are the nodes along the path?
      formula: mean pairwise cosine similarity of consecutive node embeddings
      weight: 0.35

    query_relevance:
      description: how relevant is the endpoint to the query?
      formula: cosine(query_embedding, endpoint_node.embedding)
      weight: 0.35

    path_weight:
      description: product of edge weights along path
      formula: Π(edge.weight for edge in path)
      weight: 0.20

    path_confidence:
      description: minimum confidence along the path (weakest link)
      formula: min(edge.confidence for edge in path)
      weight: 0.10

  composite_path_score: weighted sum of above components
  path_ranking: paths sorted by composite_path_score DESC
  path_limit: return top-5 paths for multi-path queries (to avoid explanation overload)
```

---

## Traversal Result Schema

```yaml
traversal_result:
  query_id: string
  anchor_nodes: [node_id]
  
  nodes_expanded: [{ 
    node_id, name, node_type, hop_count, relevance_score
  }]
  
  top_paths: [{
    path_id: string
    nodes: [node_id]
    edges: [edge_id]
    path_score: float
    semantic_coherence: float
    hop_count: int
    explanation: string   # "Agent Alpha → [DELEGATES_TO] → Agent Beta → [GOVERNS] → Policy POL-SEC-001"
  }]
  
  community_jumps: [{from_community: community_id, to_community: community_id, jump_score: float}]
  
  statistics:
    nodes_evaluated: int
    nodes_pruned_by_threshold: int
    community_jumps_taken: int
    traversal_latency_ms: int
    max_hop_reached: int
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-memory/graph-retrieval-engine.md` | Semantic traversal is the traversal lane in HYBRID retrieval |
| `graph-cognition/graph-index-manager.md` | Adjacency index used for neighbor expansion |
| `graph-cognition/graph-query-language.md` | Traversal results expressible as GQL paths |
| `graph-routing/semantic-path-finder.md` | Path finding builds on semantic traversal |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Reasoning chains follow semantically scored paths |
| `graph-reasoning/organizational-intelligence.md` | Community traversal powers org intelligence queries |
