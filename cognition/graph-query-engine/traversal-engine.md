# Traversal Engine
# BFS, DFS, and bidirectional traversal with cycle detection and depth limits

## Traversal Configuration

```python
class TraversalConfig:
    start_id: str
    edge_types: list[str] | None    # None = all edge types
    target_type: str | None         # None = any entity type
    min_depth: int = 1
    max_depth: int = 5              # hard default; query interface enforces MAX_QUERY_DEPTH=10
    direction: str = "out"          # "out" | "in" | "both"
    target_filter: dict | None      # property filter on target nodes
    strategy: str = "BFS"           # "BFS" | "DFS" | "BIDIRECTIONAL"
    min_confidence: float = 0.50    # skip edges below this confidence
    include_paths: bool = False     # return full path objects or just terminal nodes
```

## Breadth-First Search

Used for shortest-path exploration and bounded neighbor discovery:

```python
def bfs_traverse(config: TraversalConfig) -> TraversalResult:
    visited = set()
    queue = deque([(config.start_id, 0, [config.start_id])])  # (node_id, depth, path)
    results = []

    while queue:
        node_id, depth, path = queue.popleft()
        if node_id in visited:
            continue
        visited.add(node_id)

        # Check if this node satisfies the target criteria
        if depth >= config.min_depth:
            node = graph_store.get_vertex(node_id)
            if is_target_match(node, config):
                if config.include_paths:
                    results.append(TraversalHit(node=node, path=path, depth=depth))
                else:
                    results.append(TraversalHit(node=node, depth=depth))

        if depth >= config.max_depth:
            continue

        # Expand neighbors
        edges = get_traversal_edges(node_id, config)
        for edge in edges:
            next_id = edge.target_id if config.direction in ("out", "both") else edge.source_id
            if next_id not in visited:
                queue.append((next_id, depth + 1, path + [next_id]))
                # For "both" direction, also follow in-edges
                if config.direction == "both" and edge.source_id != node_id:
                    reverse_id = edge.source_id
                    if reverse_id not in visited:
                        queue.append((reverse_id, depth + 1, path + [reverse_id]))

    return TraversalResult(hits=results, strategy="BFS", nodes_visited=len(visited))
```

## Depth-First Search

Used for deep exploration and cycle detection:

```python
def dfs_traverse(config: TraversalConfig) -> TraversalResult:
    # DFS coloring: WHITE (unvisited), GRAY (in stack), BLACK (completed)
    color = {}  # node_id → "WHITE" | "GRAY" | "BLACK"
    cycles_detected = []
    results = []

    def dfs_visit(node_id: str, depth: int, path: list):
        if depth > config.max_depth:
            return
        color[node_id] = "GRAY"

        if depth >= config.min_depth:
            node = graph_store.get_vertex(node_id)
            if is_target_match(node, config):
                results.append(TraversalHit(node=node, path=list(path), depth=depth))

        edges = get_traversal_edges(node_id, config)
        for edge in edges:
            next_id = edge.target_id if config.direction == "out" else edge.source_id
            if color.get(next_id) == "GRAY":
                # Back edge detected — cycle
                cycle_path = path[path.index(next_id):] + [next_id]
                cycles_detected.append(cycle_path)
                continue
            if color.get(next_id) != "BLACK":
                dfs_visit(next_id, depth + 1, path + [next_id])

        color[node_id] = "BLACK"

    dfs_visit(config.start_id, 0, [config.start_id])
    return TraversalResult(hits=results, strategy="DFS",
                           nodes_visited=len(color),
                           cycles_detected=cycles_detected)
```

## Bidirectional BFS

Meets in the middle — efficient for known source and target:

```python
def bidirectional_bfs(source_id: str, target_id: str,
                      edge_types=None, max_depth=5) -> GraphPath | None:
    if source_id == target_id:
        node = graph_store.get_vertex(source_id)
        return GraphPath(nodes=[node], edges=[], total_weight=0, hop_count=0)

    forward_visited  = {source_id: [source_id]}   # node_id → path from source
    backward_visited = {target_id: [target_id]}    # node_id → path from target
    forward_queue    = deque([source_id])
    backward_queue   = deque([target_id])

    for _ in range(max_depth // 2 + 1):
        # Expand forward frontier one level
        next_forward = set()
        while forward_queue:
            node_id = forward_queue.popleft()
            for edge in graph_store.get_out_edges(node_id, edge_types):
                nbr = edge.target_id
                if nbr not in forward_visited:
                    forward_visited[nbr] = forward_visited[node_id] + [nbr]
                    next_forward.add(nbr)
                    if nbr in backward_visited:
                        return build_path(forward_visited[nbr], backward_visited[nbr])
        forward_queue = deque(next_forward)

        # Expand backward frontier one level
        next_backward = set()
        while backward_queue:
            node_id = backward_queue.popleft()
            for edge in graph_store.get_in_edges(node_id, edge_types):
                nbr = edge.source_id
                if nbr not in backward_visited:
                    backward_visited[nbr] = backward_visited[node_id] + [nbr]
                    next_backward.add(nbr)
                    if nbr in forward_visited:
                        return build_path(forward_visited[nbr], backward_visited[nbr])
        backward_queue = deque(next_backward)

    return None   # no path found within max_depth

def build_path(forward_path: list, backward_path: list) -> GraphPath:
    full_node_ids = forward_path + list(reversed(backward_path[:-1]))
    nodes = graph_store.batch_get(full_node_ids)
    edges = []
    for i in range(len(full_node_ids) - 1):
        edge = graph_store.get_edge_between(full_node_ids[i], full_node_ids[i+1])
        if edge:
            edges.append(edge)
    total_weight = sum(e.weight for e in edges)
    return GraphPath(nodes=nodes, edges=edges, total_weight=total_weight,
                     hop_count=len(edges))
```

## Edge Filtering

```python
def get_traversal_edges(node_id: str, config: TraversalConfig) -> list[GraphEdge]:
    if config.direction == "out":
        edges = graph_store.get_out_edges(node_id)
    elif config.direction == "in":
        edges = graph_store.get_in_edges(node_id)
    else:   # both
        edges = graph_store.get_out_edges(node_id) + graph_store.get_in_edges(node_id)

    # Filter by edge type
    if config.edge_types:
        edges = [e for e in edges if e.edge_type in config.edge_types]

    # Filter by confidence
    edges = [e for e in edges if e.confidence >= config.min_confidence]

    # Filter out expired edges
    edges = [e for e in edges if knowledge_types.is_fact_valid(e)]

    return edges

def is_target_match(node: EntityVertex, config: TraversalConfig) -> bool:
    if config.target_type and node.entity_type != config.target_type:
        return False
    if config.target_filter:
        for key, value in config.target_filter.items():
            if get_nested(node.properties, key) != value:
                return False
    return node.lifecycle.status == "ACTIVE"
```

## Integration Points

- `query-interface.md`: `_execute_match()` delegates to `bfs_traverse()` or `dfs_traverse()` based on config
- `path-finder.md`: uses `bidirectional_bfs()` as the default path-finding strategy
- `knowledge-inference/inference-engine.md`: uses DFS traversal for rule R001 (transitive delegation) and R011 (circular detection)
- `graph-observability/graph-analytics.md`: uses BFS for reachability and community detection
