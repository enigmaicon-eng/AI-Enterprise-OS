# Runtime Engine

**System ID:** `runtime-engine`
**Role:** Core execution runtime — manages the lifecycle of every workflow execution instance from spawn to termination, enforces execution contracts (timeouts, resource budgets, isolation), coordinates between the DAG engine, worker pool, and persistence layer, and is the authoritative record of what is currently running
**Storage:** `memory/execution-runtime/active-runs.yaml` + `memory/execution-runtime/runtime-events.jsonl`

---

## Purpose

The runtime engine is the session manager for workflow execution. Where the DAG engine manages *graph traversal*, the runtime engine manages *execution instances* — the living, running objects that consume resources, hold state, and can be paused, resumed, or terminated. Every workflow run has exactly one runtime engine record: the ground truth for its current state.

---

## Execution Instance Model

```yaml
ExecutionInstance:
  run_id: string                     # Globally unique (uuid)
  definition_id: string
  definition_version: integer
  workflow_id: string                # Logical identifier (same across retries)
  
  # Lineage
  parent_run_id: string | null       # Set for subworkflows
  root_run_id: string                # Top-level ancestor
  depth: integer                     # 0 for root; 1 for subworkflow; etc.
  
  # State
  state: "SPAWNING | RUNNING | SUSPENDED | RESUMING | COMPLETING | COMPLETED | FAILED | CANCELLED | COMPENSATING | COMPENSATED"
  state_entered_at: datetime
  
  # Resource budget
  resource_budget:
    max_steps: integer               # Maximum node executions allowed
    max_duration_seconds: integer    # Wall-clock timeout
    max_concurrent_nodes: integer    # Parallelism cap
    steps_consumed: integer
    budget_remaining_pct: float
  
  # Timing
  spawned_at: datetime
  started_at: datetime | null
  completed_at: datetime | null
  deadline: datetime | null
  
  # Execution context
  input: any                         # Initial workflow input
  output: any | null                 # Final workflow output (set on COMPLETED)
  error: string | null
  
  # Checkpointing
  last_checkpoint_id: string | null
  checkpoint_sequence: integer
  
  # Metadata
  triggered_by: string               # trigger_id or "manual:[user]"
  priority: string
  tags: map[string, string]
```

---

## Execution Lifecycle

### SPAWN

```
spawn(definition_id, input, options):
  
  run_id = generate_uuid()
  
  instance = ExecutionInstance(
    run_id = run_id,
    definition_id = definition_id,
    definition_version = workflow_registry.get_active_version(definition_id),
    state = SPAWNING,
    input = input,
    resource_budget = compute_budget(definition_id, options),
    ...
  )
  
  # Persist before any execution begins (write-ahead)
  persist(instance)
  emit_event("WORKFLOW_SPAWNED", run_id)
  
  # Hand off to DAG engine
  dag_engine.initialize(run_id, definition_id, instance.definition_version, input)
  
  instance.state = RUNNING
  instance.started_at = now()
  persist(instance)
```

### SUSPEND / RESUME

```
suspend(run_id, reason):
  instance = load(run_id)
  
  # Signal all running nodes to pause at safe point
  dag_engine.signal_suspend(run_id)
  
  # Wait for in-flight nodes to reach suspension point (max 30s)
  await dag_engine.all_nodes_quiesced(run_id, timeout=30)
  
  # Create suspension checkpoint
  checkpoint_engine.create(run_id, trigger_type="suspension")
  
  instance.state = SUSPENDED
  persist(instance)
  emit_event("WORKFLOW_SUSPENDED", run_id, reason=reason)

resume(run_id):
  instance = load(run_id)
  ASSERT instance.state == SUSPENDED
  
  instance.state = RESUMING
  
  # Restore DAG state from checkpoint
  dag_engine.restore_from_checkpoint(instance.last_checkpoint_id)
  
  instance.state = RUNNING
  persist(instance)
  emit_event("WORKFLOW_RESUMED", run_id)
```

### TERMINATE

```
terminate(run_id, reason, cancel_mode: "GRACEFUL | IMMEDIATE"):
  instance = load(run_id)
  
  IF cancel_mode == GRACEFUL:
    # Signal nodes to finish current operation then stop
    dag_engine.signal_cancel(run_id)
    await dag_engine.all_nodes_terminal(run_id, timeout=120)
  
  ELIF cancel_mode == IMMEDIATE:
    # Force-kill all running nodes
    dag_engine.force_cancel(run_id)
    worker_dispatcher.revoke_all_tasks(run_id)
  
  instance.state = CANCELLED
  instance.completed_at = now()
  persist(instance)
  emit_event("WORKFLOW_CANCELLED", run_id, reason=reason)
```

---

## Resource Budget Enforcement

```
ON each node dispatch:
  instance = load(run_id)
  instance.resource_budget.steps_consumed += 1
  
  IF instance.resource_budget.steps_consumed >= instance.resource_budget.max_steps:
    → BUDGET_EXHAUSTED: terminate(run_id, reason="STEP_BUDGET_EXHAUSTED", cancel_mode=GRACEFUL)

DEADLINE WATCHDOG:
  # Runs continuously for all RUNNING instances
  FOR each instance WHERE instance.deadline IS NOT NULL:
    IF now() > instance.deadline:
      → terminate(run_id, reason="DEADLINE_EXCEEDED", cancel_mode=GRACEFUL)
    ELIF now() > instance.deadline - (deadline_warning_lead_seconds):
      → emit_event("DEADLINE_WARNING", run_id, time_remaining=instance.deadline - now())
```

---

## Execution Modes

```
STANDARD:
  Normal execution with full persistence, checkpointing, and retries.
  Default for all production workflows.

DRY_RUN:
  Executes workflow logic but marks all tasks as simulated.
  Workers receive DRY_RUN flag and return synthetic outputs.
  No side effects; no writes to external systems.
  Used for: workflow validation, capacity estimation, training.

REPLAY:
  Re-runs a completed or failed workflow from a specific checkpoint.
  Previously SUCCEEDED nodes are replayed from stored outputs (no re-execution).
  Only FAILED or PENDING nodes are re-executed.
  Used for: debugging, compensation, audit reproduction.

SHADOW:
  Runs in parallel with an active workflow but suppresses output.
  Both versions execute; only primary version's outputs are applied.
  Used for: A/B testing new workflow versions before promotion.
```

---

## Concurrency Control

```
MAX_CONCURRENT_RUNS ENFORCEMENT:
  ON spawn attempt:
    running = count_running_instances(definition_id)
    IF running >= definition.execution.max_concurrent_runs:
      → QUEUE (if priority >= NORMAL) or REJECT (if priority == BACKGROUND)

RESOURCE ISOLATION:
  Each run has its own:
  - Tool budget allocation (does not share with other runs)
  - Context window allocation
  - Worker affinity group (if session-continuity required)
```

---

## Integration

**Called by:**
- `workflow-engine/workflow-scheduler.md` — spawns new execution instances on trigger
- `runtime-clusters/runtime-signals.md` — receives suspend/resume/cancel signals
- `execution-runtime/durable-execution.md` — coordination on replay/resume

**Calls:**
- `workflow-engine/dag-engine.md` — initializes, suspends, resumes DAG execution
- `workflow-engine/worker-dispatcher.md` — revokes tasks on termination
- `execution-runtime/state-persistence.md` — persists instance state
- `workflow-checkpoints/checkpoint-engine.md` — creates suspension checkpoints

**Writes to:**
- `memory/execution-runtime/active-runs.yaml` — live instance state
- `memory/execution-runtime/runtime-events.jsonl` — all lifecycle events
- `memory/execution-ledger.jsonl` — canonical event record (for twin sync)
