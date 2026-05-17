# Orchestration DAG System

## Purpose
The runtime execution engine for all workflow processes. Receives compiled DAG artifacts from the BPMN Orchestration Bridge and executes them with deterministic, auditable semantics. Every workflow execution in the enterprise runs through this system.

---

## DAG Data Model

```yaml
dag_definition:
  dag_id: "dag-PROC-GOV-001-2.1.0"
  source_process_id: "PROC-GOV-001"
  source_version: "2.1.0"
  entry_node: "node-id"
  nodes:
    - node_id: "unique-id"
      node_type: "dag.task.service | dag.task.human | dag.branch.exclusive | ..."
      label: "human-readable name"
      executor: "agent-capability | queue | engine-ref"
      timeout_ms: integer
      retry_policy: none | linear | exponential
      compensation_handler: "node-id | null"
      governance:
        tier_required: 0–5
        constitutional_gate: boolean
        audit_level: NONE | STANDARD | ENHANCED
      input_schema: JSON Schema
      output_schema: JSON Schema
  edges:
    - edge_id: "unique-id"
      source_node: "node-id"
      target_node: "node-id"
      edge_type: sequence | conditional | compensation | event
      condition: "CEL expression | null"
      label: "condition label"
  terminal_nodes: ["node-id"]
  compensation_chains: [{trigger: "node-id", steps: ["node-id"]}]
  schema_hash: "sha256:..."
```

---

## Execution Instance Model

```yaml
dag_instance:
  instance_id: "inst-uuid"
  dag_id: "dag-PROC-GOV-001-2.1.0"
  status: PENDING | RUNNING | PAUSED | COMPLETED | FAILED | COMPENSATING | COMPENSATED
  started_at: "ISO-8601"
  completed_at: "ISO-8601 | null"
  context:
    inputs: {}
    outputs: {}
    variables: {}         # mutable execution state
  node_states:
    "node-id":
      status: PENDING | RUNNING | COMPLETED | FAILED | SKIPPED | COMPENSATED
      started_at: "ISO-8601 | null"
      completed_at: "ISO-8601 | null"
      attempts: integer
      output: {}
      error: "ERR_CODE | null"
  active_branches: ["node-id"]   # currently executing parallel branches
  checkpoints: ["checkpoint-id"]
  telemetry_span_id: "span-id"
  governance_approvals: [{node_id, approver_id, decision, timestamp}]
```

---

## Execution Algorithm

```
execute(dag_instance):
  ready_queue = [entry_node]
  
  while ready_queue not empty:
    node = ready_queue.pop()
    
    # Guard: skip already completed nodes (idempotent re-queuing)
    if node_states[node].status == COMPLETED: continue
    
    # Execute based on node type
    match node.node_type:
      
      case dag.task.service:
        result = execute_service_task(node, context)
        handle_result(node, result)
      
      case dag.task.human:
        submit_to_approval_queue(node, context)
        pause_branch()   # resumes when approval received
      
      case dag.task.decision:
        result = runtime-decision-engine.evaluate(node.decision_model_id, context)
        handle_result(node, result)
      
      case dag.branch.exclusive:
        evaluate_conditions_in_order(node.outbound_edges, context)
        activate_first_matching_edge()
        activate_default_if_none_match()
      
      case dag.branch.parallel:
        for each outbound_edge:
          activate_branch(edge.target_node)
        register_join_barrier(node.corresponding_join)
      
      case dag.join.parallel:
        if all_inbound_branches_complete():
          merge_branch_contexts()
          activate_outbound()
        else:
          block_and_wait()
      
      case dag.handler.error:
        if node.error_code matches current_error:
          activate_error_handler_path()
        else:
          propagate_error_upward()
      
      case dag.sink:
        complete_instance(context.outputs)
  
  emit_completion_event(instance_id)
```

---

## Context Propagation

```yaml
context_rules:
  sequential_flow:
    - output of node N becomes available to all downstream nodes
    - variable namespace: "$.nodes.{node-id}.output"
    - shorthand: "$.{variable-name}" for process-level variables
  
  parallel_branches:
    - each branch receives a copy of the context at split point
    - branch writes are isolated until join
    - at join: deep merge with conflict resolution
    
  conflict_resolution:
    strategy: last_write_wins_with_log   # logs conflict for audit
    exception: governance variables (tier_required, constitutional_verdict) — highest wins
  
  immutable_fields:
    - instance_id
    - dag_id
    - started_at
    - governance_approvals
    - telemetry_span_id
```

---

## Cycle Detection

DAGs are statically acyclic (enforced by BPMN validation). However, call activities can create runtime call stacks:

```yaml
call_stack_limits:
  max_depth: 10         # matches event chain max_depth
  max_instances_per_dag: 100   # prevents fan-out storms
  circular_call_detection:
    check: instance call stack for repeated dag_id
    on_detect: ERR_CIRCULAR_SUBPROCESS → immediate failure (no retry)
```

---

## Topological Sort

Used to determine safe execution order when resuming from checkpoint:

```
topological_sort(dag):
  in_degree = {node: count(inbound_edges) for node in nodes}
  zero_queue = [n for n where in_degree[n] == 0]
  order = []
  
  while zero_queue:
    n = zero_queue.pop()
    order.append(n)
    for each successor of n:
      in_degree[successor] -= 1
      if in_degree[successor] == 0:
        zero_queue.append(successor)
  
  if len(order) != len(nodes):
    raise CycleDetected   # should not reach here post-validation
  
  return order
```

---

## Checkpoint Integration

Integrates with `workflow-checkpoints/` for durable execution:

```yaml
checkpoint_triggers:
  - before every User Task (human pause point)
  - after every Service Task with side effects
  - at every AND-join (state merge point)
  - every 5 minutes for long-running instances

checkpoint_content:
  instance_id: string
  node_states: snapshot
  context: snapshot
  active_branches: snapshot
  governance_approvals: snapshot
  checkpoint_hash: "sha256 of content"
```

---

## Error Propagation

```
on_node_failure(node, error):
  # Try boundary error handler first
  handler = find_boundary_handler(node, error.code)
  if handler:
    activate(handler)
    return
  
  # Try subprocess boundary (if inside subprocess)
  if node.in_subprocess:
    propagate_to_subprocess_boundary(error)
    return
  
  # Check if inside Transaction (saga compensation)
  if node.in_transaction:
    trigger_compensation_chain(node.transaction_id)
    return
  
  # Retry if policy allows
  if node.retry_policy and node.attempts < max_attempts:
    schedule_retry(node)
    return
  
  # Terminal failure
  fail_instance(error)
  notify enterprise-event-bus: WORKFLOW_FAILED
```

---

## Integration Points

| System | Role |
|---|---|
| `bpmn/bpmn-orchestration-bridge.md` | Source of compiled DAG artifacts |
| `workflow-checkpoints/` | Checkpoint persistence layer |
| `decision-models/runtime-decision-engine.md` | Executes Business Rule Tasks |
| `case-management/long-running-case-engine.md` | Manages paused human task branches |
| `process-governance/workflow-auditability-system.md` | Receives all node entry/exit events |
| `enterprise-telemetry/enterprise-event-bus.md` | Publishes workflow lifecycle events |
| `orchestration-observability/orchestration-tracer.md` | Span tracking per node execution |
