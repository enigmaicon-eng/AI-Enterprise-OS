# Worker Dispatcher

**System ID:** `worker-dispatcher`
**Role:** Routes ready DAG nodes to the most appropriate available worker — matches node executor requirements to worker capabilities, applies load balancing, enforces affinity rules, and handles dispatch timeouts with re-dispatch
**Storage:** `memory/workflow-engine/dispatch-log.jsonl`

---

## Purpose

Dispatch is the bridge between the DAG engine (which knows what to run) and the worker pool (which knows who can run it). A naive dispatcher that routes randomly produces hot spots, ignores locality, and wastes capability-matching work. The worker dispatcher solves: *which specific worker should run this specific task, right now, given current load?*

---

## Capability Matching

Every task declares an executor type; every worker advertises its capabilities:

```yaml
ExecutorRequirement:
  executor_type: string            # e.g., "ai-agent", "tool-runner", "gate-validator"
  required_capabilities: [string]  # e.g., ["code-execution", "web-search"]
  required_resources:
    min_context_budget: integer    # Minimum tool calls available
    min_memory_mb: integer
  affinity:
    preferred_worker_tags: [string]  # Soft preference
    required_worker_tags: [string]   # Hard requirement
  anti_affinity:
    avoid_workers: [string]          # Worker IDs to avoid (e.g., already running a sibling)
```

```
CAPABILITY MATCH ALGORITHM:

eligible_workers = worker_registry.get_available()

FOR each worker in eligible_workers:
  
  # Hard filters (any failure = ineligible)
  IF worker.executor_type != task.executor_type: SKIP
  IF NOT worker.capabilities ⊇ task.required_capabilities: SKIP
  IF worker.available_context_budget < task.min_context_budget: SKIP
  IF task.required_worker_tags ⊄ worker.tags: SKIP
  IF worker.id in task.avoid_workers: SKIP
  
  # Scoring (soft factors)
  score = 0
  score += capability_match_bonus(worker, task)   # Specialization fit
  score += locality_score(worker, task)            # Same-cluster bonus
  score += tag_preference_score(worker, task)      # Preferred tags
  score -= worker.current_load × 100              # Penalize loaded workers
  score -= worker.queue_depth × 10               # Penalize backlogged workers
  
  eligible_scored.append((worker, score))

eligible_scored.sort(by=score, descending=True)
selected_worker = eligible_scored[0]
```

---

## Load Balancing Strategies

The dispatcher selects a balancing strategy per executor type:

```
LEAST_LOADED:
  # Select worker with lowest current_task_count / max_concurrent_tasks ratio
  selected = MIN(eligible_workers, key = lambda w: w.load_ratio)
  # Best general-purpose strategy; prevents hot spots

WEIGHTED_ROUND_ROBIN:
  # Each worker has a weight proportional to its capacity
  # Distributes proportionally to capacity, not equally
  weights = [w.max_concurrent_tasks for w in eligible_workers]
  selected = weighted_random_choice(eligible_workers, weights)

LOCALITY_FIRST:
  # Prefer workers that already have the workflow's context loaded
  # Reduces context reload overhead for multi-step workflows on same worker
  co_located = [w for w in eligible_workers
                if w.active_workflow_id == task.workflow_id]
  selected = LEAST_LOADED(co_located) if co_located else LEAST_LOADED(eligible_workers)

RANDOM:
  # For stateless, homogeneous workers where load is irrelevant
  selected = random_choice(eligible_workers)
```

---

## Dispatch Protocol

```
dispatch(task, dag_engine_callback):
  
  # Step 1: Find eligible workers
  eligible = capability_match(task)
  
  IF len(eligible) == 0:
    # No capable worker available right now
    IF task.executor_type not in registered_executor_types:
      → FATAL: unknown executor type; fail node immediately
    ELSE:
      → WAIT: re-attempt dispatch in 10 seconds (worker may free up)
      → If no worker available for > task.dispatch_timeout_seconds:
           trigger retry_engine.on_dispatch_timeout(task)
  
  # Step 2: Select worker
  strategy = get_balancing_strategy(task.executor_type)
  worker = strategy.select(eligible, task)
  
  # Step 3: Reserve slot on worker (optimistic, with rollback)
  reservation = worker.reserve_slot(task.task_id)
  IF NOT reservation.ok:
    # Worker became unavailable between selection and reservation
    → Re-run dispatch() with worker removed from eligible set
  
  # Step 4: Send task to worker
  send_task(worker, task)
  
  # Step 5: Record dispatch
  append(dispatch-log.jsonl, {
    task_id: task.task_id,
    node_id: task.node_id,
    workflow_id: task.workflow_id,
    worker_id: worker.id,
    dispatched_at: now(),
    attempt: task.attempt_number
  })
  
  # Step 6: Set dispatch watchdog
  watchdog.schedule(
    task_id = task.task_id,
    fire_at = now() + task.timeout_seconds,
    on_fire = handle_dispatch_timeout
  )
```

---

## Dispatch Watchdog

```
handle_dispatch_timeout(task_id):
  
  task = load(task_id)
  worker = task.dispatched_to_worker
  
  # Check if worker is still alive
  IF NOT worker.is_alive():
    # Worker died; task never ran
    task.outcome = WORKER_DIED
    retry_engine.schedule_retry(task, error_code="WORKER_DIED")
  
  ELIF worker.task_state(task_id) == RUNNING:
    # Task is genuinely running but taking too long
    worker.signal_timeout(task_id)
    # Worker should respond with TIMEOUT error within grace period
    wait(grace_period_seconds=30)
    retry_engine.schedule_retry(task, error_code="TIMEOUT")
  
  ELIF worker.task_state(task_id) == UNKNOWN:
    # Worker alive but doesn't know about task — dispatch was lost
    retry_engine.schedule_retry(task, error_code="DISPATCH_LOST")
```

---

## Affinity Groups

For workflows requiring multiple steps to execute on the same worker (session continuity):

```yaml
AffinityGroup:
  group_id: string
  workflow_id: string
  pinned_worker_id: string           # All tasks in group route here
  created_at: datetime
  expires_at: datetime               # Released when workflow completes
  tasks_in_group: [string]
```

```
IF task.affinity.require_same_worker AND workflow has existing affinity_group:
  selected_worker = affinity_group.pinned_worker_id
  IF selected_worker is unavailable:
    → WAIT (do not break affinity; integrity > speed)
```

---

## Integration

**Called by:** `workflow-engine/dag-engine.md` — on node transition to READY
**Calls:**
- `distributed-execution/worker-orchestration.md` — queries worker registry and load
- `workflow-engine/retry-engine.md` — on dispatch timeout

**Reads from:**
- `distributed-execution/worker-orchestration.md` — live worker capability and load state
- `memory/distributed-execution/worker-registry.yaml` — registered workers

**Writes to:**
- `memory/workflow-engine/dispatch-log.jsonl` — all dispatch decisions and outcomes
