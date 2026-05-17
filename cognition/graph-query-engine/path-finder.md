# Path Finder
# Shortest path, all paths, weighted paths, and K-shortest paths for the knowledge graph

## Path Types

```yaml
path_modes:
  SHORTEST:
    algorithm: Bidirectional BFS (unweighted) or Dijkstra (weighted)
    use_cases: [escalation path, capability reach, approval chain]
    max_depth: 10

  ALL:
    algorithm: DFS with path enumeration
    use_cases: [impact analysis, dependency mapping, alternative routes]
    max_depth: 7       # lower limit — all paths can explode combinatorially
    max_results: 50

  WEIGHTED:
    algorithm: Dijkstra (weight = 1 - edge.weight, lower = more preferred)
    use_cases: [trust-weighted delegation, high-confidence knowledge paths]
    max_depth: 10

  K_SHORTEST:
    algorithm: Yen's K-Shortest Paths
    use_cases: [backup escalation paths, alternative capability routes]
    k: 5               # top 5 paths by total weight
    max_depth: 8
```

## Dijkstra Shortest Path (Weighted)

```python
def dijkstra_shortest_path(source_id: str, target_id: str,
                            edge_types=None, max_depth=10) -> GraphPath | None:
    # Cost = 1 - edge.weight (lower cost = higher-weight edges preferred)
    dist = defaultdict(lambda: float("inf"))
    dist[source_id] = 0.0
    prev = {}     # node_id → (prev_node_id, edge)
    pq = [(0.0, source_id, 0)]   # (cost, node_id, depth)
    visited = set()

    while pq:
        cost, node_id, depth = heappop(pq)
        if node_id in visited:
            continue
        visited.add(node_id)

        if node_id == target_id:
            return reconstruct_weighted_path(source_id, target_id, prev)

        if depth >= max_depth:
            continue

        for edge in graph_store.get_out_edges(node_id, edge_types):
            nbr = edge.target_id
            if nbr in visited:
                continue
            edge_cost = 1.0 - edge.weight   # invert: higher weight = lower cost
            new_cost = cost + edge_cost
            if new_cost < dist[nbr]:
                dist[nbr] = new_cost
                prev[nbr] = (node_id, edge)
                heappush(pq, (new_cost, nbr, depth + 1))

    return None   # no path found

def reconstruct_weighted_path(source_id: str, target_id: str,
                               prev: dict) -> GraphPath:
    node_ids = []
    edges = []
    current = target_id
    while current != source_id:
        prev_node_id, edge = prev[current]
        node_ids.insert(0, current)
        edges.insert(0, edge)
        current = prev_node_id
    node_ids.insert(0, source_id)
    nodes = graph_store.batch_get(node_ids)
    total_weight = sum(e.weight for e in edges)
    return GraphPath(nodes=nodes, edges=edges, total_weight=total_weight,
                     hop_count=len(edges))
```

## All Paths Enumeration

```python
def find_all_paths(source_id: str, target_id: str,
                   edge_types=None, max_depth=7,
                   max_results=50) -> list[GraphPath]:
    paths = []
    visited_on_path = set()

    def dfs(current_id: str, path_nodes: list, path_edges: list, depth: int):
        if len(paths) >= max_results:
            return
        if current_id == target_id and depth > 0:
            nodes = graph_store.batch_get(path_nodes)
            total_weight = sum(e.weight for e in path_edges)
            paths.append(GraphPath(nodes=nodes, edges=list(path_edges),
                                   total_weight=total_weight, hop_count=depth))
            return
        if depth >= max_depth:
            return
        visited_on_path.add(current_id)
        for edge in graph_store.get_out_edges(current_id, edge_types):
            nbr = edge.target_id
            if nbr not in visited_on_path:
                dfs(nbr, path_nodes + [nbr], path_edges + [edge], depth + 1)
        visited_on_path.discard(current_id)

    dfs(source_id, [source_id], [], 0)
    # Sort by total_weight descending (highest-weight paths first)
    return sorted(paths, key=lambda p: p.total_weight, reverse=True)
```

## Yen's K-Shortest Paths

```python
def k_shortest_paths(source_id: str, target_id: str,
                     k: int = 5, edge_types=None, max_depth=8) -> list[GraphPath]:
    best_paths = []
    candidates = []   # heap of (cost, path)

    # First shortest path via Dijkstra
    first = dijkstra_shortest_path(source_id, target_id, edge_types, max_depth)
    if not first:
        return []
    best_paths.append(first)

    for _ in range(k - 1):
        last_path = best_paths[-1]
        # Generate spur paths from each node in the last best path
        for i in range(len(last_path.nodes) - 1):
            spur_node_id = last_path.nodes[i].entity_id
            root_path = last_path.nodes[:i+1]

            # Temporarily remove edges used by existing best paths with same root
            removed_edges = []
            for p in best_paths:
                if p.nodes[:i+1] == root_path:
                    edge_to_remove = p.edges[i]
                    graph_store.temporarily_remove_edge(edge_to_remove.edge_id)
                    removed_edges.append(edge_to_remove)

            spur_path = dijkstra_shortest_path(spur_node_id, target_id, edge_types, max_depth)
            if spur_path:
                # Reconstruct total path = root_path + spur_path
                total_path = concatenate_paths(root_path, spur_path)
                heappush(candidates, (total_path.total_weight, total_path))

            # Restore removed edges
            for edge in removed_edges:
                graph_store.restore_edge(edge.edge_id)

        if not candidates:
            break
        _, next_best = heappop(candidates)
        best_paths.append(next_best)

    return best_paths
```

## Specialized Path Queries

```python
def find_escalation_path(agent_id: str) -> GraphPath | None:
    return dijkstra_shortest_path(
        source_id=agent_id, target_id=TERMINAL_AUTHORITY_AGENT_ID,
        edge_types=["ESCALATES_TO"], max_depth=5
    )

def find_approval_chain(artifact_id: str) -> list[EntityVertex]:
    approvals = graph_store.get_out_edges(artifact_id, ["ATTESTED_BY"])
    return [graph_store.get_vertex(e.target_id) for e in approvals]

def find_capability_path(workflow_id: str, capability: str) -> GraphPath | None:
    cap = entity_resolution.resolve_entity(capability, "CAPABILITY")
    if not cap:
        return None
    return bidirectional_bfs(
        source_id=workflow_id, target_id=cap.entity_id,
        edge_types=["REQUIRES_CAPABILITY", "SPECIALIZES_IN", "IMPLICITLY_HAS_CAPABILITY"],
        max_depth=4
    )
```

## Integration Points

- `query-interface.md`: PATH queries dispatch here based on MODE
- `traversal-engine.md`: `bidirectional_bfs()` imported from traversal-engine for SHORTEST mode
- `knowledge-inference/inference-rules.md`: R001 uses `k_shortest_paths` for transitive delegation derivation
- `graph-observability/knowledge-gap-detector.md`: uses `find_capability_path` to detect R010 gaps
- `orchestration-observability/dependency-impact-analyzer.md`: uses `find_all_paths` for blast radius analysis
