# DAG Engine

**System ID:** `dag-engine`
**Role:** Core directed acyclic graph execution engine — accepts compiled workflow DAGs, executes nodes in dependency order, manages parallelism, tracks node state, and drives workflow progression from PENDING to COMPLETE or FAILED
**Storage:** `memory/workflow-engine/active-dags/[workflow-id].yaml` + `memory/workflow-engine/dag-events.jsonl`

---

## Purpose

The DAG engine is the execution heart of the workflow layer. Every workflow is a graph of nodes (steps) connected by directed edges (dependencies). The engine traverses this graph in topological order, executing ready nodes in parallel where possible, enforcing data dependencies, and maintaining durable execution state through each transition.

The engine makes one guarantee: **a node executes if and only if all its upstream dependencies have successfully completed.**

---

## DAG Node Model

```yaml
DAGNode:
  node_id: string                  # Unique within workflow
  node_type: "step | gate | fork | join | signal_wait | timer | subworkflow"
  workflow_id: string
  
  # Dependencies
  depends_on: [string]             # node_ids that must COMPLETE before this runs
  depends_on_mode: "ALL | ANY"     # ALL: wait for all; ANY: first one triggers
  
  # Execution config
  executor: string                 # which worker type handles this node
  input_mapping: map[string, string]  # output_key → this_node_input_key
  timeout_seconds: integer
  
  # State
  state: "PENDING | READY | DISPATCHED | RUNNING | SUCCEEDED | FAILED | SKIPPED | CANCELLED"
  attempts: integer
  last_attempt_at: datetime | null
  result: any | null
  error: string | null
  
  # Timing
  ready_at: datetime | null        # When all deps completed
  started_at: datetime | null
  completed_at: datetime | null
```

```yaml
DAGEdge:
  from_node: string
  to_node: string
  edge_type: "data | control | conditional"
  condition: string | null         # For conditional edges: expression on from_node.result
  data_key: string | null          # For data edges: which output field flows forward
```

---

## Execution Protocol

### PHASE 01: Ready Set Computation

```
ON workflow start OR any node state change to SUCCEEDED/FAILED:

  ready_nodes = []

  FOR each node WHERE node.state == PENDING:
    
    # Evaluate dependency satisfaction
    IF node.depends_on_mode == "ALL":
      deps_satisfied = ALL(dep.state == "SUCCEEDED" for dep in node.depends_on)
    ELIF node.depends_on_mode == "ANY":
      deps_satisfied = ANY(dep.state == "SUCCEEDED" for dep in node.depends_on)
    
    # Evaluate conditional edges
    conditional_edges_pass = ALL(
      eval(edge.condition, upstream_node.result) == True
      for edge in incoming_edges WHERE edge.edge_type == "conditional"
    )
    
    IF deps_satisfied AND conditional_edges_pass:
      node.state = READY
      ready_nodes.append(node)
    
    # Skip if conditional path excludes this node
    IF upstream_conditional_failed_for_this_node:
      node.state = SKIPPED
```

### PHASE 02: Node Dispatch

```
FOR each node in ready_nodes:

  # Build input payload by resolving data mappings
  input_payload = {}
  FOR each (output_key, input_key) in node.input_mapping:
    upstream_node = node_that_produced(output_key)
    input_payload[input_key] = upstream_node.result[output_key]
  
  # Dispatch to worker pool via task-queue
  task = Task(
    task_id = generate_uuid(),
    node_id = node.node_id,
    workflow_id = node.workflow_id,
    executor = node.executor,
    input = input_payload,
    timeout_seconds = node.timeout_seconds,
    max_attempts = retry_policy(node).max_attempts
  )
  
  task_queue.enqueue(task, priority = workflow.priority)
  node.state = DISPATCHED
  node.last_attempt_at = now()
  
  # Write event
  append_event(dag-events.jsonl, {
    type: "NODE_DISPATCHED",
    node_id: node.node_id,
    workflow_id: node.workflow_id,
    task_id: task.task_id,
    timestamp: now()
  })
```

### PHASE 03: Result Integration

```
ON task_result received (from worker via result queue):

  node = lookup(task.node_id)
  
  IF task_result.status == SUCCESS:
    node.state = SUCCEEDED
    node.result = task_result.output
    node.completed_at = now()
    
    # Trigger re-evaluation of ready set
    evaluate_ready_set(workflow_id)
    
    # Check workflow completion
    IF all_nodes_terminal(workflow_id):
      complete_workflow(workflow_id)
  
  ELIF task_result.status == FAILURE:
    node.attempts += 1
    retry_policy = get_retry_policy(node)
    
    IF node.attempts < retry_policy.max_attempts:
      # Re-enqueue with backoff
      delay = retry_engine.compute_delay(node.attempts, retry_policy)
      task_queue.enqueue_delayed(task, delay_seconds=delay)
      node.state = READY  # Will be re-dispatched after delay
    ELSE:
      node.state = FAILED
      node.error = task_result.error
      handle_node_failure(node, workflow_id)
```

### PHASE 04: Failure Handling

```
handle_node_failure(failed_node, workflow_id):
  
  workflow = load(workflow_id)
  
  IF failed_node.failure_policy == "FAIL_FAST":
    # Cancel all READY + DISPATCHED + RUNNING nodes
    cancel_downstream(failed_node)
    cancel_concurrent_nodes()
    workflow.state = FAILED
    workflow.failure_cause = failed_node.node_id
  
  ELIF failed_node.failure_policy == "CONTINUE":
    # Mark downstream as SKIPPED, continue parallel branches
    skip_downstream(failed_node)
    IF all_non_skipped_nodes_complete:
      workflow.state = PARTIAL_SUCCESS
  
  ELIF failed_node.failure_policy == "COMPENSATE":
    # Trigger compensating-actions engine
    compensating_actions.trigger(workflow_id, failed_node)
    workflow.state = COMPENSATING
```

---

## Fork / Join Semantics

```
FORK node:
  Produces N parallel branches
  fork.result = {branch_ids: [B1, B2, ...BN]}
  All branches dispatched simultaneously
  No dependency between branches

JOIN node:
  depends_on = [all branch terminal nodes]
  depends_on_mode = "ALL" (default) or "ANY" (first-wins join)
  join.input = collect(result for each branch)
  join.result = merged output
```

---

## Subworkflow Execution

```
SUBWORKFLOW node:
  Spawns a child workflow as an independent DAG execution
  parent_workflow.node.state = RUNNING (until child completes)
  
  child_workflow = spawn(
    definition_id = node.subworkflow_definition,
    parent_workflow_id = workflow_id,
    parent_node_id = node.node_id,
    input = node.input_payload
  )
  
  ON child_workflow.state → COMPLETE:
    subworkflow_node.result = child_workflow.output
    subworkflow_node.state = SUCCEEDED
  
  ON child_workflow.state → FAILED:
    subworkflow_node.state = FAILED
    # Propagates to parent failure handling
```

---

## DAG State Persistence

Every state transition is durably written before the transition is acted upon (write-ahead):

```
persist_node_state(node):
  1. Write transition to dag-events.jsonl (append)
  2. Update active-dags/[workflow-id].yaml (node state section)
  3. On crash/restart: replay dag-events.jsonl to reconstruct state
```

---

## Integration

**Called by:** `workflow-engine/workflow-scheduler.md` (on workflow activation)
**Calls:**
- `workflow-engine/retry-engine.md` — delay computation on node failure
- `workflow-engine/worker-dispatcher.md` — dispatches ready nodes to workers
- `execution-runtime/compensating-actions.md` — on COMPENSATE failure policy
- `orchestration-dags/dag-runtime.md` — node state machine and graph traversal

**Reads from:**
- `orchestration-dags/dag-compiler.md` — compiled DAG definition
- `memory/workflow-engine/active-dags/[workflow-id].yaml` — current DAG state
- `workflow-engine/workflow-registry.md` — workflow retry policies

**Writes to:**
- `memory/workflow-engine/active-dags/[workflow-id].yaml` — node state transitions
- `memory/workflow-engine/dag-events.jsonl` — append-only event log
- `memory/execution-ledger.jsonl` — execution events (for twin sync)
