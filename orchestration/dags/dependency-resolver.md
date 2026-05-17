# Dependency Resolver

**System ID:** `dependency-resolver`
**Role:** Computes execution order and structural properties of workflow DAGs — implements Kahn's algorithm for topological sorting, cycle detection via DFS, critical path via CPM (forward/backward pass), and float computation for scheduling slack
**Storage:** None (stateless computation; results embedded in compiled DAG)

---

## Purpose

Every workflow DAG has a fundamental ordering constraint: node B cannot execute before node A if B depends on A. The dependency resolver makes this constraint explicit and computable — producing the topological order that guarantees correct execution, detecting cycles that would make execution impossible, and computing the critical path that determines the workflow's minimum possible duration.

---

## Topological Sort — Kahn's Algorithm

```
topological_sort(nodes, edges) → [node_id] | CycleError:
  
  # Build in-degree map
  in_degree = {node.node_id: 0 for node in nodes}
  adjacency = defaultdict(list)
  
  FOR each edge in edges:
    in_degree[edge.to_node] += 1
    adjacency[edge.from_node].append(edge.to_node)
  
  # Initialize queue with all source nodes (in_degree == 0)
  queue = [n for n in nodes WHERE in_degree[n] == 0]
  queue.sort(key = lambda n: n.node_id)  # Deterministic ordering for reproducibility
  
  topological_order = []
  
  WHILE queue is not empty:
    node = queue.pop(0)  # Take from front (BFS order)
    topological_order.append(node.node_id)
    
    FOR each neighbor in adjacency[node.node_id]:
      in_degree[neighbor] -= 1
      IF in_degree[neighbor] == 0:
        queue.append(neighbor)
        queue.sort(key = lambda n: n.node_id)  # Maintain deterministic order
  
  IF len(topological_order) != len(nodes):
    # Not all nodes processed → cycle exists
    cycle = find_cycle(nodes, edges)
    RAISE CycleError(f"Cycle detected: {' → '.join(cycle)}")
  
  RETURN topological_order
```

---

## Cycle Detection — DFS with Stack Tracking

```
find_cycle(nodes, edges):
  # DFS-based cycle detection; returns the cycle path for diagnostics
  
  adjacency = build_adjacency(edges)
  visited = set()
  in_stack = set()
  parent = {}
  
  def dfs(node_id):
    visited.add(node_id)
    in_stack.add(node_id)
    
    FOR each neighbor in adjacency[node_id]:
      IF neighbor not in visited:
        parent[neighbor] = node_id
        IF dfs(neighbor):  # Recursive DFS
          RETURN True      # Cycle found downstream
      
      ELIF neighbor in in_stack:
        # Cycle found: reconstruct cycle path
        cycle_path = [neighbor]
        current = node_id
        WHILE current != neighbor:
          cycle_path.append(current)
          current = parent[current]
        cycle_path.append(neighbor)
        cycle_path.reverse()
        RETURN cycle_path
    
    in_stack.remove(node_id)
    RETURN False
  
  FOR each node in nodes:
    IF node.node_id not in visited:
      result = dfs(node.node_id)
      IF result:
        RETURN result
  
  RETURN []  # No cycle
```

---

## Critical Path — CPM Forward/Backward Pass

```
compute_critical_path(nodes, edges, topological_order) → CriticalPath:
  
  # Node duration estimates (use p50 from performance history, or configured estimate)
  duration = {n.node_id: get_estimated_duration(n) for n in nodes}
  
  # FORWARD PASS: Earliest Start (ES) and Earliest Finish (EF)
  ES = {}  # Earliest start time for each node
  EF = {}  # Earliest finish time for each node
  
  FOR each node_id in topological_order:
    predecessors = [e.from_node for e in edges WHERE e.to_node == node_id]
    
    IF predecessors is empty:
      ES[node_id] = 0                              # Source nodes start at time 0
    ELSE:
      ES[node_id] = MAX(EF[p] for p in predecessors)  # Can start after all predecessors finish
    
    EF[node_id] = ES[node_id] + duration[node_id]
  
  # Project duration = EF of the latest-finishing sink node
  project_duration = MAX(EF[n] for n in sink_nodes)
  
  # BACKWARD PASS: Latest Start (LS) and Latest Finish (LF)
  LF = {}  # Latest finish time without delaying project
  LS = {}  # Latest start time without delaying project
  
  FOR each node_id in REVERSE(topological_order):
    successors = [e.to_node for e in edges WHERE e.from_node == node_id]
    
    IF successors is empty:
      LF[node_id] = project_duration              # Sink nodes can finish at project end
    ELSE:
      LF[node_id] = MIN(LS[s] for s in successors)  # Must finish before any successor starts
    
    LS[node_id] = LF[node_id] - duration[node_id]
  
  # FLOAT (SLACK) = how much a node can slip without delaying the project
  float_time = {}
  FOR each node_id:
    float_time[node_id] = LF[node_id] - EF[node_id]  # = LS - ES
  
  # CRITICAL PATH = nodes where float == 0 (no slack)
  critical_nodes = [n for n in nodes WHERE float_time[n.node_id] == 0]
  critical_path = [n for n in topological_order WHERE n in critical_nodes]
  
  RETURN CriticalPath(
    node_ids = critical_path,
    total_duration_seconds = project_duration,
    node_float = float_time,
    near_critical = [n for n where 0 < float_time[n] <= 0.15 × project_duration]
  )
```

---

## Data Dependency Resolution

Validates that all input_mapping references are satisfiable:

```
resolve_input_mappings(nodes, edges, definition):
  
  resolved = {}
  
  FOR each node in nodes:
    resolved[node.node_id] = {}
    
    FOR each (source_key, target_key) in node.input_mapping.items():
      
      # Parse source_key: "node_id.output_field" or "input.field"
      IF source_key.startswith("input."):
        # References workflow-level input
        field = source_key[len("input."):]
        validate_field_in_schema(field, definition.input_schema)
        resolved[node.node_id][target_key] = ("workflow_input", field)
      
      ELIF "." in source_key:
        producer_node_id, output_field = source_key.split(".", 1)
        
        # Verify producer is an upstream dependency
        IF producer_node_id NOT IN get_all_ancestors(node.node_id, reverse_adjacency):
          RAISE DataDependencyError(
            f"Node {node.node_id} references output of {producer_node_id} "
            f"but {producer_node_id} is not an ancestor"
          )
        
        resolved[node.node_id][target_key] = ("node_output", producer_node_id, output_field)
  
  RETURN resolved
```

---

## Integration

**Called by:** `orchestration-dags/dag-compiler.md` — during DAG compilation
**Calls:** None (stateless computation)
**Output consumed by:**
- `orchestration-dags/dag-compiler.md` — embeds results in compiled DAG
- `orchestration-dags/dag-optimizer.md` — uses critical path and float for optimization
- `workflow-engine/dag-engine.md` — uses topological order for execution sequencing
- `execution-observability/bottleneck-analyzer.md` — uses critical path for runtime bottleneck detection
