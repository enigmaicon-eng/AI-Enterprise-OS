# Runtime Signals

**System ID:** `runtime-signals`
**Role:** Provides the low-latency, in-process signaling layer for workflow interruption, cancellation, suspension, and cross-workflow coordination — signals bypass the event bus for immediacy and target specific running workflow instances or nodes directly
**Storage:** `memory/runtime-clusters/signal-log.jsonl`

---

## Purpose

The event bus is for durable, decoupled, partitioned event streaming. Runtime signals are for immediate, targeted, stateful commands directed at a specific running workflow or node. When an operator wants to cancel a running workflow right now, that needs to reach the execution runtime within milliseconds — not wait for a polling loop to pick up an event from a Kafka-like partition. Runtime signals are the escape hatch from asynchronous choreography into direct imperative control.

---

## Signal Types

```yaml
SignalType: "CANCEL | SUSPEND | RESUME | ABORT_NODE | INJECT_INPUT | PRIORITY_BOOST | HEARTBEAT_ACK | DEADLINE_EXTENSION | CUSTOM"

SignalDefinition:
  CANCEL:
    description: "Cancel the entire workflow run gracefully"
    scope: WORKFLOW_RUN
    terminal: true                     # Run ends after signal processed
    payload:
      reason: string
      cancel_mode: "GRACEFUL | IMMEDIATE"
      
  SUSPEND:
    description: "Suspend execution at next safe checkpoint"
    scope: WORKFLOW_RUN
    terminal: false
    payload:
      reason: string
      suspend_mode: "AFTER_CURRENT_NODES | IMMEDIATE"
      
  RESUME:
    description: "Resume a suspended workflow"
    scope: WORKFLOW_RUN
    terminal: false
    payload:
      resumed_by: string
      additional_input: any | null
  
  ABORT_NODE:
    description: "Abort a specific node's execution"
    scope: NODE
    terminal: false                    # Node fails; workflow continues per failure policy
    payload:
      node_id: string
      reason: string
      abort_mode: "GRACEFUL | IMMEDIATE"
  
  INJECT_INPUT:
    description: "Inject data into a waiting node (human input, external approval result)"
    scope: NODE
    terminal: false
    payload:
      node_id: string
      input_data: any
      injected_by: string
  
  PRIORITY_BOOST:
    description: "Elevate scheduling priority of a run or node"
    scope: "WORKFLOW_RUN | NODE"
    terminal: false
    payload:
      boost_factor: float              # Multiplier applied to base priority
      duration_seconds: integer | null # Null = permanent for this run
  
  DEADLINE_EXTENSION:
    description: "Extend the deadline for a workflow run"
    scope: WORKFLOW_RUN
    terminal: false
    payload:
      new_deadline: datetime
      extension_reason: string
      approved_by: string
  
  CUSTOM:
    description: "User-defined signal for workflow-specific coordination"
    scope: "WORKFLOW_RUN | NODE"
    terminal: false
    payload: any                       # Workflow-defined schema
```

---

## Signal Schema

```yaml
RuntimeSignal:
  signal_id: string                    # uuid
  signal_type: string
  
  # Target
  target:
    run_id: string
    node_id: string | null             # Null for workflow-scope signals
  
  # Metadata
  issued_at: datetime
  issued_by: string                    # System or user that issued the signal
  correlation_id: string
  
  payload: any
  
  # Delivery tracking
  delivery:
    status: "PENDING | DELIVERED | ACKNOWLEDGED | REJECTED | EXPIRED"
    delivered_at: datetime | null
    acknowledged_at: datetime | null
    rejection_reason: string | null
    expiry_at: datetime                # Signals auto-expire; undelivered = NOOP
    retry_count: integer
```

---

## Signal Dispatch

```
send_signal(run_id, signal_type, payload, node_id=null, issued_by="system") → signal_id:
  
  # Validate target run exists and is in a state that can receive signals
  run = execution_runtime.get_run(run_id)
  IF run is null:
    RAISE UnknownRun(run_id)
  
  # Signal applicability checks
  MATCH signal_type:
    CASE "CANCEL":
      IF run.state in ["COMPLETED", "FAILED", "CANCELLED"]:
        RAISE SignalRejected(f"Cannot cancel run in terminal state {run.state}")
    CASE "RESUME":
      IF run.state != "SUSPENDED":
        RAISE SignalRejected(f"Cannot resume run in state {run.state}")
    CASE "INJECT_INPUT":
      node = dag_runtime.get_node_status(run_id, payload.node_id)
      IF node.state != "RUNNING" OR node.executor_type != "human-approval":
        RAISE SignalRejected(f"Node {payload.node_id} is not waiting for human input")
  
  signal = RuntimeSignal(
    signal_id = generate_uuid(),
    signal_type = signal_type,
    target = SignalTarget(run_id=run_id, node_id=node_id),
    issued_at = now(),
    issued_by = issued_by,
    payload = payload,
    delivery = SignalDelivery(
      status = "PENDING",
      expiry_at = now() + timedelta(seconds=300)  # 5-min default expiry
    )
  )
  
  # Append to signal log (durable)
  append_signal_log(signal)
  
  # Deliver immediately to in-memory signal inbox of the target run
  signal_inbox[run_id].put(signal)
  
  # Also publish to event bus for observability
  event_bus.publish(
    topic = "runtime.signals",
    event_type = "SIGNAL_ISSUED",
    partition_key = run_id,
    payload = {signal_id: signal.signal_id, signal_type: signal_type, run_id: run_id}
  )
  
  RETURN signal.signal_id
```

---

## Signal Inbox — Consumer Side

The execution runtime polls the signal inbox on every execution cycle:

```
# In dag-engine execution loop:
process_signals(run_id):
  
  signals = signal_inbox[run_id].drain()  # Non-blocking: take all pending
  
  FOR each signal in signals:
    
    # Check expiry
    IF signal.delivery.expiry_at < now():
      mark_signal_expired(signal)
      CONTINUE
    
    MATCH signal.signal_type:
      
      CASE "CANCEL":
        IF signal.payload.cancel_mode == "GRACEFUL":
          # Allow currently RUNNING nodes to complete; skip PENDING nodes
          dag_runtime.set_run_state(run_id, "CANCELLING")
          schedule_cancel_after_current_nodes(run_id, signal)
        ELSE:  # IMMEDIATE
          dag_runtime.set_run_state(run_id, "CANCELLED")
          cancel_all_running_nodes(run_id)
      
      CASE "SUSPEND":
        IF signal.payload.suspend_mode == "AFTER_CURRENT_NODES":
          dag_runtime.set_run_state(run_id, "SUSPENDING")
          # Suspension completes when all RUNNING nodes finish
        ELSE:  # IMMEDIATE
          dag_runtime.set_run_state(run_id, "SUSPENDED")
          pause_all_running_nodes(run_id)
      
      CASE "RESUME":
        dag_runtime.set_run_state(run_id, "RUNNING")
        dag_runtime.update_frontier(run_id)
        IF signal.payload.additional_input:
          merge_input(run_id, signal.payload.additional_input)
      
      CASE "ABORT_NODE":
        node_id = signal.payload.node_id
        worker_dispatcher.abort_task(run_id=run_id, node_id=node_id)
        dag_runtime.transition_node(run_id, node_id, target_state="FAILED",
                                    error="Aborted by signal: " + signal.payload.reason)
      
      CASE "INJECT_INPUT":
        node_id = signal.payload.node_id
        dag_runtime.inject_node_input(run_id, node_id, signal.payload.input_data)
        dag_runtime.transition_node(run_id, node_id, target_state="SUCCEEDED",
                                    result=signal.payload.input_data)
      
      CASE "PRIORITY_BOOST":
        apply_priority_boost(run_id, signal.payload.boost_factor, signal.payload.node_id)
      
      CASE "DEADLINE_EXTENSION":
        execution_runtime.update_deadline(run_id, signal.payload.new_deadline)
      
      CASE "CUSTOM":
        workflow_custom_signal_handler(run_id, signal)
    
    mark_signal_delivered(signal)
    mark_signal_acknowledged(signal)
```

---

## Signal Waiting — Long-Poll for Node Input

Some nodes (human-approval, external-callback) suspend and wait for a specific signal:

```
wait_for_signal(run_id, node_id, expected_signal_types, timeout_seconds) → RuntimeSignal:
  
  # Register waiter
  waiter_key = f"{run_id}:{node_id}"
  signal_waiters[waiter_key] = WaitingNode(
    run_id = run_id,
    node_id = node_id,
    expected_types = expected_signal_types,
    deadline = now() + timedelta(seconds=timeout_seconds)
  )
  
  # Blocking wait (node is RUNNING but not consuming CPU — suspended coroutine)
  WHILE now() < signal_waiters[waiter_key].deadline:
    signal = signal_inbox[run_id].get_matching(expected_signal_types, node_id, timeout=1)
    
    IF signal:
      del signal_waiters[waiter_key]
      RETURN signal
  
  # Timeout: node fails with SIGNAL_TIMEOUT
  del signal_waiters[waiter_key]
  RAISE SignalTimeout(f"Node {node_id} timed out waiting for {expected_signal_types}")
```

---

## Signal Log Replay

On crash recovery, signals that were PENDING and not yet delivered are replayed:

```
recover_pending_signals(run_id):
  
  pending_signals = read_signal_log(run_id, status_filter=["PENDING", "DELIVERED"])
  
  FOR each signal in pending_signals:
    IF signal.delivery.expiry_at < now():
      log("SIGNAL_EXPIRED_ON_RECOVERY", signal_id=signal.signal_id)
      CONTINUE
    
    # Re-deliver to inbox (idempotent — signal_id prevents double-processing)
    IF NOT already_acknowledged(signal.signal_id):
      signal_inbox[run_id].put(signal)
```

---

## Integration

**Called by:**
- Operators / users — via workflow management API to cancel/suspend/resume runs
- `runtime-clusters/reactive-orchestration.md` — sends RESUME signals on gate resolution
- `workflow-engine/dag-engine.md` — sends ABORT_NODE signals on timeout
- `execution-runtime/rollback-engine.md` — sends CANCEL signals before rollback
- `execution-observability/orchestration-monitor.md` — sends PRIORITY_BOOST signals for lagging critical runs

**Calls:**
- `workflow-engine/dag-engine.md` — sends signals into the execution loop
- `distributed-execution/worker-orchestration.md` — abort_task for ABORT_NODE and CANCEL signals
- `runtime-clusters/event-bus.md` — publishes SIGNAL_ISSUED events for observability

**Reads from:** `memory/runtime-clusters/signal-log.jsonl`
**Writes to:** `memory/runtime-clusters/signal-log.jsonl`
