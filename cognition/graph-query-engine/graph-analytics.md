# Graph Analytics
# Centrality scoring, community detection, orphan analysis, and density metrics

## Analytics Suite

```yaml
analytics_types:
  PAGERANK:
    description: Entity importance based on incoming link structure
    use_cases: [knowledge hub identification, critical agent discovery, important wiki pages]
    output: entity_id → pagerank_score (0.0–1.0)

  BETWEENNESS_CENTRALITY:
    description: Entities that act as bridges between graph regions
    use_cases: [critical connectors, bottleneck agents, single points of failure]
    output: entity_id → betweenness_score (0.0–1.0)

  COMMUNITY_DETECTION:
    description: Louvain algorithm — groups entities by structural similarity
    use_cases: [org cluster validation, knowledge domain mapping, collaboration networks]
    output: entity_id → community_id

  ORPHAN_DETECTION:
    description: Entities with no active edges (isolated nodes)
    use_cases: [knowledge quality, cleanup candidates, unlinked artifacts]
    output: [entity_id] (list of orphans)

  DENSITY:
    description: Graph density and degree distribution
    use_cases: [graph health monitoring, ingestion quality assessment]
    output: GraphDensityMetrics
```

## PageRank

Converges within ~50 iterations for graphs of typical OS scale:

```python
PAGERANK_DAMPING    = 0.85
PAGERANK_ITERATIONS = 50
PAGERANK_EPSILON    = 1e-6   # convergence threshold

def compute_pagerank(entity_type_filter=None) -> dict[str, float]:
    nodes = (get_entities_by_type(entity_type_filter)
             if entity_type_filter else graph_store.get_all_active_vertices())
    node_ids = [n.entity_id for n in nodes]
    n = len(node_ids)
    if n == 0:
        return {}

    scores = {nid: 1.0 / n for nid in node_ids}

    for _ in range(PAGERANK_ITERATIONS):
        new_scores = {}
        delta = 0.0
        for node_id in node_ids:
            incoming = graph_store.get_in_edges(node_id)
            incoming = [e for e in incoming if e.source_id in scores]
            rank_sum = sum(
                scores[e.source_id] * e.weight /
                max(1, len(graph_store.get_out_edges(e.source_id)))
                for e in incoming
            )
            new_scores[node_id] = (1 - PAGERANK_DAMPING) / n + PAGERANK_DAMPING * rank_sum
            delta += abs(new_scores[node_id] - scores[node_id])
        scores = new_scores
        if delta < PAGERANK_EPSILON:
            break   # converged

    # Normalize to [0, 1]
    max_score = max(scores.values()) if scores else 1.0
    return {nid: s / max_score for nid, s in scores.items()}

def get_knowledge_hubs(top_n=20, entity_type=None) -> list[tuple[EntityVertex, float]]:
    scores = compute_pagerank(entity_type_filter=entity_type)
    sorted_ids = sorted(scores.keys(), key=lambda nid: scores[nid], reverse=True)[:top_n]
    return [(graph_store.get_vertex(nid), scores[nid]) for nid in sorted_ids]
```

## Betweenness Centrality

Approximated using random sampling for large graphs:

```python
def compute_betweenness_centrality(sample_size=200) -> dict[str, float]:
    all_ids = [n.entity_id for n in graph_store.get_all_active_vertices()]
    if len(all_ids) <= sample_size:
        source_ids = all_ids
    else:
        source_ids = random.sample(all_ids, sample_size)

    betweenness = defaultdict(float)

    for source_id in source_ids:
        # BFS from source to all reachable nodes, collecting shortest paths
        paths_through = defaultdict(int)   # node_id → count of paths through it
        queue = deque([(source_id, [source_id])])
        visited = {source_id}
        while queue:
            current_id, path = queue.popleft()
            for edge in graph_store.get_out_edges(current_id):
                nbr = edge.target_id
                if nbr not in visited:
                    visited.add(nbr)
                    new_path = path + [nbr]
                    queue.append((nbr, new_path))
                    # Intermediate nodes in this path gain betweenness
                    for intermediate in new_path[1:-1]:
                        paths_through[intermediate] += 1

        for node_id, count in paths_through.items():
            betweenness[node_id] += count

    # Normalize
    max_val = max(betweenness.values()) if betweenness else 1.0
    return {nid: v / max_val for nid, v in betweenness.items()}
```

## Community Detection (Louvain)

```python
def detect_communities(edge_types=None) -> dict[str, str]:
    # Louvain: iteratively assign each node to the community that maximizes modularity gain
    nodes = graph_store.get_all_active_vertices()
    node_ids = [n.entity_id for n in nodes]
    community = {nid: nid for nid in node_ids}   # each node starts as its own community

    improved = True
    while improved:
        improved = False
        for node_id in node_ids:
            best_community = community[node_id]
            best_gain = 0.0
            # Check all neighbor communities
            neighbors = get_neighbor_entity_ids(node_id, edge_types)
            neighbor_communities = {community[nbr] for nbr in neighbors}
            for candidate_community in neighbor_communities:
                gain = compute_modularity_gain(node_id, candidate_community, community)
                if gain > best_gain:
                    best_gain = gain
                    best_community = candidate_community
            if best_community != community[node_id]:
                community[node_id] = best_community
                improved = True

    return community   # entity_id → community_id

def get_community_summary() -> list[CommunitySummary]:
    community_map = detect_communities()
    communities = defaultdict(list)
    for entity_id, comm_id in community_map.items():
        communities[comm_id].append(entity_id)
    result = []
    for comm_id, members in communities.items():
        entity_types = Counter(
            graph_store.get_vertex(mid).entity_type for mid in members
        )
        result.append(CommunitySummary(
            community_id=comm_id,
            size=len(members),
            dominant_type=entity_types.most_common(1)[0][0],
            entity_type_breakdown=dict(entity_types),
        ))
    return sorted(result, key=lambda c: c.size, reverse=True)
```

## Orphan Detection

```python
def detect_orphans(entity_type=None) -> list[EntityVertex]:
    orphans = []
    nodes = (get_entities_by_type(entity_type)
             if entity_type else graph_store.get_all_active_vertices())
    for node in nodes:
        out_count = len(graph_store.get_out_edges(node.entity_id))
        in_count  = len(graph_store.get_in_edges(node.entity_id))
        if out_count == 0 and in_count == 0:
            orphans.append(node)
    return orphans

def compute_orphan_rate(entity_type=None) -> float:
    total = len(get_entities_by_type(entity_type) if entity_type
                else graph_store.get_all_active_vertices())
    orphan_count = len(detect_orphans(entity_type))
    return orphan_count / max(1, total)
```

## Density Metrics

```python
def compute_graph_density_metrics() -> GraphDensityMetrics:
    total_nodes = graph_store.vertex_count(status="ACTIVE")
    total_edges = graph_store.edge_count(active_only=True)
    out_degrees = [len(graph_store.get_out_edges(nid))
                   for nid in graph_store.get_all_active_ids()]
    return GraphDensityMetrics(
        total_nodes=total_nodes,
        total_edges=total_edges,
        graph_density=total_edges / max(1, total_nodes * (total_nodes - 1)),
        avg_out_degree=mean(out_degrees),
        max_out_degree=max(out_degrees, default=0),
        degree_distribution={
            "0":    sum(1 for d in out_degrees if d == 0),
            "1-5":  sum(1 for d in out_degrees if 1 <= d <= 5),
            "6-20": sum(1 for d in out_degrees if 6 <= d <= 20),
            "20+":  sum(1 for d in out_degrees if d > 20),
        },
        orphan_rate=compute_orphan_rate(),
    )
```

## Integration Points

- `query-interface.md`: AGGREGATE queries dispatch here
- `graph-observability/graph-health-monitor.md`: calls `compute_orphan_rate()` and `compute_graph_density_metrics()`
- `graph-observability/coverage-analyzer.md`: uses community detection to validate org cluster coverage
- `knowledge-inference/knowledge-synthesizer.md`: uses PageRank to identify high-value synthesis targets
