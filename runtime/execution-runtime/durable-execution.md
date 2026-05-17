# Durable Execution

**System ID:** `durable-execution`
**Role:** Guarantees that workflow execution survives any failure — process crashes, network partitions, worker deaths — by implementing event-sourced execution with deterministic replay; every step either completes exactly once or is perfectly compensated
**Storage:** `memory/execution-runtime/event-journal/[run-id].jsonl` + `memory/execution-runtime/execution-snapshots/[run-id]-snap-[N].yaml`

---

## Purpose

Durable execution answers a single question: if everything that can go wrong does go wrong, does the workflow still complete correctly? Standard execution does not provide this guarantee. Durable execution does — by treating the execution log as the source of truth and every worker action as a replayable event.

The model: **a workflow is the deterministic function of its event history.** Given the same event history, replaying the function always produces the same next action. This means recovery from any failure is replay from the last durable event.

---

## Event Journal

Every execution is recorded as an append-only event journal:

```yaml
ExecutionEvent:
  event_id: string                   # Sequential within run (monotonically increasing)
  run_id: string
  sequence: integer                  # Global order; used for replay
  timestamp: datetime
  event_type: string                 # See event taxonomy below
  node_id: string | null
  payload: any                       # Event-specific data
  checksum: string                   # sha256 of (sequence + event_type + payload)
```

### Event Taxonomy

```
WORKFLOW_STARTED        payload: {input, definition_version}
NODE_SCHEDULED          payload: {node_id, executor, input}
NODE_DISPATCHED         payload: {node_id, worker_id, task_id}
NODE_STARTED            payload: {node_id, worker_id, started_at}
ACTIVITY_COMPLETED      payload: {node_id, output, duration_ms}
ACTIVITY_FAILED         payload: {node_id, error, attempt}
TIMER_SCHEDULED         payload: {timer_id, fire_at}
TIMER_FIRED             payload: {timer_id}
SIGNAL_RECEIVED         payload: {signal_name, signal_data}
CHILD_WORKFLOW_STARTED  payload: {child_run_id, definition_id}
CHILD_WORKFLOW_COMPLETED payload: {child_run_id, output}
WORKFLOW_COMPLETED      payload: {output}
WORKFLOW_FAILED         payload: {error, failed_node_id}
COMPENSATION_STARTED    payload: {failed_node_id}
COMPENSATION_COMPLETED  payload: {}
```

---

## Deterministic Replay Protocol

```
REPLAY(run_id):
  
  # Load event journal from durable storage
  events = load_journal(run_id)
  
  # Reconstruct workflow state by replaying events in sequence
  state = WorkflowState()
  
  FOR each event in events (ordered by sequence):
    state = apply_event(state, event)
    # apply_event is a pure function: same event → same state transition
  
  # State is now identical to the moment of the last recorded event
  # Resume execution from that point:
  resume_from_state(run_id, state)

apply_event(state, event):
  MATCH event.event_type:
    "WORKFLOW_STARTED"       → state.initialize(event.payload)
    "NODE_SCHEDULED"         → state.mark_ready(event.payload.node_id)
    "NODE_DISPATCHED"        → state.mark_dispatched(event.payload.node_id)
    "ACTIVITY_COMPLETED"     → state.mark_succeeded(event.payload.node_id, event.payload.output)
    "ACTIVITY_FAILED"        → state.record_failure(event.payload.node_id, event.payload.error)
    "TIMER_FIRED"            → state.complete_timer(event.payload.timer_id)
    "SIGNAL_RECEIVED"        → state.deliver_signal(event.payload.signal_name, event.payload.signal_data)
    ...
  RETURN state
```

---

## Exactly-Once Execution Guarantee

The core challenge: if a worker crashes *after* completing a task but *before* reporting success, naively retrying re-executes the task — potentially causing duplicate side effects.

```
EXACTLY-ONCE PROTOCOL:

1. Worker receives task
2. Worker executes task (side effects may occur here)
3. Worker records ACTIVITY_COMPLETED to journal (durable write, acknowledged)
4. Only after journal write: worker reports success to DAG engine

IF worker crashes at step 2 (before journal write):
  → Task is re-executed on retry (step 2 is idempotent by design, OR
    worker uses idempotency key to detect re-execution and skip)

IF worker crashes at step 3 (journal write in-flight):
  → Journal uses write-ahead log; partial write is rolled back
  → Task is re-executed on retry

IF worker crashes at step 4 (after journal write, before report):
  → On replay, ACTIVITY_COMPLETED event is present
  → DAG engine sees node as already SUCCEEDED — does NOT re-dispatch
  → Exactly-once achieved

IDEMPOTENCY KEY:
  task.idempotency_key = sha256(workflow_id + node_id + attempt_number)
  Workers record idempotency keys in their local store
  On re-execution: IF idempotency_key already recorded → return stored result
```

---

## Snapshot-Based Fast Recovery

Replaying a full event journal from the beginning is correct but slow for long-running workflows. Snapshots accelerate recovery:

```
SNAPSHOT PROTOCOL:

CREATE snapshot every N events (default N=50) OR at phase boundaries:
  snapshot = {
    run_id: string,
    sequence: integer,          # Last event included in snapshot
    snapshot_id: string,
    state: WorkflowState,       # Full serialized state at this sequence
    created_at: datetime
  }
  persist(snapshot)

RECOVERY with snapshot:
  1. Find latest valid snapshot for run_id
  2. Load snapshot → instantiate state at snapshot.sequence
  3. Replay only events with sequence > snapshot.sequence
  → Recovery cost: O(events_since_last_snapshot) instead of O(total_events)

SNAPSHOT INTEGRITY:
  snapshot.state_checksum = sha256(serialize(state))
  ON load: recompute checksum and verify before using snapshot
  IF corrupt: fall back to full journal replay
```

---

## Side Effect Isolation

Not all operations should be replayed — only deterministic ones. Side-effectful operations (API calls, external writes) are wrapped in activities:

```
ACTIVITY vs DETERMINISTIC DISTINCTION:

Deterministic (replay-safe, no activity wrapper needed):
  - Reading workflow input
  - Computing derived values from prior node outputs
  - Evaluating conditional logic
  - Scheduling timers and signals

Non-deterministic / side-effectful (MUST be wrapped as activities):
  - All agent invocations
  - All tool calls (file reads, API calls, web searches)
  - Random number generation (use seeded PRNG via workflow seed)
  - Current timestamp reads (use workflow-managed logical clock)
  - External state reads (external systems may have changed)

Activity wrapper behavior:
  1. On first execution: run the activity; record result to journal
  2. On replay: skip execution; return the recorded result from journal
```

---

## Durable Timers

```
schedule_timer(duration_seconds, callback_node_id):
  timer_event = {
    timer_id: generate_uuid(),
    fire_at: now() + duration_seconds,
    workflow_id: run_id,
    callback_node_id: callback_node_id
  }
  
  # Write to journal FIRST (durable)
  append_event("TIMER_SCHEDULED", timer_event)
  
  # Register with timer service
  timer_service.register(timer_event)
  
  # If process crashes before timer fires:
  # On recovery via replay, TIMER_SCHEDULED event is present
  # Timer service re-registers the timer from the event
  # Timer fires at fire_at even after recovery

ON TIMER_FIRED:
  append_event("TIMER_FIRED", {timer_id})
  dag_engine.complete_timer_node(callback_node_id)
```

---

## Integration

**Called by:**
- `execution-runtime/runtime-engine.md` — wraps all workflow execution in durable semantics
- `workflow-engine/dag-engine.md` — activity dispatch goes through durable wrapper

**Calls:**
- `execution-runtime/state-persistence.md` — persists journal and snapshots
- `workflow-checkpoints/checkpoint-engine.md` — integrates checkpoint events into journal
- `runtime-clusters/runtime-signals.md` — durable signal delivery via journal

**Reads from:**
- `memory/execution-runtime/event-journal/[run-id].jsonl` — event history for replay
- `memory/execution-runtime/execution-snapshots/[run-id]-snap-[N].yaml` — snapshots

**Writes to:**
- `memory/execution-runtime/event-journal/[run-id].jsonl` — all execution events (append-only)
- `memory/execution-runtime/execution-snapshots/` — periodic snapshots
