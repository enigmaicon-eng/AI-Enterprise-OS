# DAG Runtime

**System ID:** `dag-runtime`
**Role:** Implements the live DAG execution state machine — manages node state transitions, tracks the execution frontier (set of currently executable nodes), handles fan-out and fan-in synchronization, maintains the running execution graph, and provides the query interface for runtime DAG introspection
**Storage:** `memory/orchestration-dags/runtime-graphs/[run-id]-graph.yaml`

---

## Purpose

The DAG compiler produces a static structure. The DAG runtime animates it. For each workflow run, the runtime maintains a mutable copy of the graph tracking each node's live state, the set of nodes currently eligible to execute, and the results flowing between nodes. The runtime is the source of truth for "what is happening right now" in any given workflow.

---

## Runtime Graph Model

```yaml
RuntimeGraph:
  run_id: string
  definition_id: string
  version: integer
  
  state: "INITIALIZING | RUNNING | SUSPENDING | SUSPENDED | COMPLETING | COMPLETED | FAILED | CANCELLED"
  
  nodes:
    [node_id]:
      node_id: string
      state: "PENDING | READY | DISPATCHED | RUNNING | SUCCEEDED | FAILED | SKIPPED | CANCELLED"
      phase: integer
      
      # Execution tracking
      attempts: integer
      current_task_id: string | null
      worker_id: string | null
      
      # Timing
      ready_at: datetime | null
      dispatched_at: datetime | null
      started_at: datetime | null
      completed_at: datetime | null
      
      # Data
      input_snapshot: any | null         # Input at time of dispatch
      result: any | null                 # Output from successful execution
      error: string | null
      
      # Scheduling metadata (from optimizer)
      scheduling_priority_boost: float
      scheduling_hint: string
  
  # Execution frontier — nodes currently in READY or DISPATCHED state
  execution_frontier: [string]
  
  # Current phase
  current_phase: integer
  
  # Result store — outputs accessible to downstream nodes
  result_store:
    [node_id]: any                        # node_id → completed node's output
  
  metrics:
    nodes_total: integer
    nodes_completed: integer
    nodes_failed: integer
    nodes_skipped: integer
    nodes_pending: integer
    completion_pct: float
    elapsed_seconds: float
    estimated_remaining_seconds: float
```

---

## Node State Machine

```
State transitions and their triggers:

PENDING     ─── all dependencies SUCCEEDED ─────────────────────► READY
PENDING     ─── conditional edge not satisfied ──────────────────► SKIPPED
READY       ─── dispatcher claims node ──────────────────────────► DISPATCHED
DISPATCHED  ─── worker begins execution ─────────────────────────► RUNNING
RUNNING     ─── worker reports success ──────────────────────────► SUCCEEDED
RUNNING     ─── worker reports failure (retryable) ──────────────► READY  (re-dispatched)
RUNNING     ─── worker reports failure (exhausted) ──────────────► FAILED
RUNNING     ─── timeout exceeded ────────────────────────────────► FAILED
RUNNING     ─── cancel signal received ──────────────────────────► CANCELLED
SUCCEEDED   ─── [terminal]
FAILED      ─── [terminal — unless rollback resets to PENDING]
SKIPPED     ─── [terminal]
CANCELLED   ─── [terminal]
```

---

## Execution Frontier Management

```
# The execution frontier is the set of READY + DISPATCHED nodes.
# It represents "where the DAG currently is" — the wavefront of execution.

update_frontier(run_id):
  graph = load_runtime_graph(run_id)
  
  new_frontier = []
  
  FOR each node WHERE node.state == PENDING:
    deps = graph.nodes[node.node_id].depends_on
    
    all_deps_done = all(graph.nodes[d].state == SUCCEEDED for d in deps)
    any_dep_done  = any(graph.nodes[d].state == SUCCEEDED for d in deps)
    
    dep_mode = graph.nodes[node.node_id].depends_on_mode
    
    IF (dep_mode == "ALL" AND all_deps_done) OR (dep_mode == "ANY" AND any_dep_done):
      
      # Check conditional edges
      conditional_ok = evaluate_conditionals(node, graph)
      
      IF conditional_ok:
        transition(node, PENDING → READY)
        new_frontier.append(node.node_id)
      ELSE:
        transition(node, PENDING → SKIPPED)
  
  # Add already-READY and DISPATCHED nodes
  new_frontier += [n for n in graph.nodes WHERE n.state in [READY, DISPATCHED]]
  
  graph.execution_frontier = new_frontier
  persist(graph)
  
  # Notify dispatcher of newly-ready nodes
  IF newly_ready:
    dag_engine.on_nodes_ready(run_id, newly_ready)
```

---

## Fan-Out / Fan-In Synchronization

```
FAN-OUT:
  A single node produces a fork → N child branches begin simultaneously.
  
  on_node_succeeded(fork_node):
    branch_ids = fork_node.result.branch_ids
    FOR each branch_id:
      initialize_branch(run_id, branch_id)
    update_frontier(run_id)  # Will mark first node of each branch as READY

FAN-IN:
  A join node waits for all (or any) branches to complete.
  
  on_node_succeeded(branch_terminal_node):
    join_node = find_join_for_branch(branch_terminal_node)
    
    IF join_node.depends_on_mode == "ALL":
      all_branches_done = all(
        graph.nodes[b].state == SUCCEEDED
        for b in join_node.depends_on
      )
      IF all_branches_done:
        transition(join_node, PENDING → READY)
        collect_branch_results(join_node)
    
    ELIF join_node.depends_on_mode == "ANY":
      # First branch to complete triggers the join
      IF join_node.state == PENDING:
        transition(join_node, PENDING → READY)
        join_node.result = branch_terminal_node.result
        cancel_remaining_branches(join_node)

collect_branch_results(join_node):
  join_node.input = {
    branch_id: graph.result_store[branch_terminal_node_id]
    for each branch
  }
```

---

## Runtime Introspection API

```
get_execution_status(run_id) → ExecutionStatus:
  graph = load_runtime_graph(run_id)
  RETURN {
    state: graph.state,
    completion_pct: graph.metrics.completion_pct,
    current_phase: graph.current_phase,
    frontier: graph.execution_frontier,
    active_nodes: [n for n WHERE n.state == RUNNING],
    blocked_nodes: [n for n WHERE n.state == PENDING AND has_failed_dependency(n)]
  }

get_node_status(run_id, node_id) → NodeStatus:
  RETURN graph.nodes[node_id]

get_result(run_id, node_id) → any:
  graph = load_runtime_graph(run_id)
  IF graph.nodes[node_id].state != SUCCEEDED:
    RAISE NodeNotCompleted(node_id)
  RETURN graph.result_store[node_id]

estimate_remaining_time(run_id) → seconds:
  graph = load_runtime_graph(run_id)
  # Project remaining critical path duration given current state
  remaining_critical_nodes = [n for n in compiled_dag.critical_path WHERE n.state in [PENDING, READY, DISPATCHED, RUNNING]]
  RETURN SUM(get_estimated_duration(n) for n in remaining_critical_nodes)
```

---

## Integration

**Called by:** `workflow-engine/dag-engine.md` — all node state transitions routed through dag-runtime
**Calls:**
- `workflow-engine/dag-engine.md` — on frontier update, notifies of newly-ready nodes
- `execution-observability/execution-tracer.md` — emits span events on state transitions

**Reads from:**
- `orchestration-dags/dag-compiler.md` — compiled DAG structure
- `memory/orchestration-dags/runtime-graphs/[run-id]-graph.yaml` — live graph state

**Writes to:** `memory/orchestration-dags/runtime-graphs/[run-id]-graph.yaml` — live node state
