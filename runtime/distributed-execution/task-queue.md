# Task Queue

**System ID:** `task-queue`
**Role:** Durable, priority-ordered task queue — accepts tasks from the DAG engine, delivers them to available workers, enforces priority ordering, applies fairness across concurrent workflows, provides back-pressure signals, and guarantees at-least-once delivery
**Storage:** `memory/distributed-execution/task-queue-state.yaml` + `memory/distributed-execution/queue-events.jsonl`

---

## Purpose

The task queue is the buffer between what workflows need to do and what workers have capacity to do. Without it, a surge in workflow activations would either overwhelm the worker pool or block the DAG engine. The queue absorbs the surge, preserves task ordering by priority, prevents any single workflow from monopolizing worker capacity, and provides the back-pressure signal that the scheduler uses for admission control.

---

## Queue Architecture

```
LOGICAL QUEUE STRUCTURE:

Per-executor-type priority queues (separate queue per executor type):

  ai-agent queue:
    CRITICAL band  ──── [task, task, task]  ←── dispatcher reads first
    HIGH band      ──── [task, task, ...]
    NORMAL band    ──── [task, task, ...]
    LOW band       ──── [task, ...]
    BACKGROUND     ──── [task, ...]         ←── dispatcher reads last
  
  tool-runner queue:  [same structure]
  gate-validator queue: [same structure]
  ...

Within each band: ordered by (workflow_deadline ASC, enqueued_at ASC)
  → Earliest deadline first, then FIFO for same deadline
```

---

## Task Model

```yaml
QueuedTask:
  task_id: string
  node_id: string
  workflow_id: string
  run_id: string
  
  executor_type: string
  required_capabilities: [string]
  
  priority_band: "CRITICAL | HIGH | NORMAL | LOW | BACKGROUND"
  priority_score: float              # Fine-grained ordering within band
  enqueued_at: datetime
  deadline: datetime | null          # Workflow deadline (for EDF ordering)
  
  # Delivery tracking
  state: "PENDING | CLAIMED | DELIVERED | ACKNOWLEDGED | EXPIRED"
  claimed_by_worker: string | null
  claimed_at: datetime | null
  delivered_at: datetime | null
  ack_deadline: datetime | null      # Worker must ack by this time or task is re-queued
  
  # Delay (for retry backoff)
  visible_after: datetime            # Task not dispatched until this time (null = immediately)
  
  # Attempt tracking
  attempt_number: integer
  max_attempts: integer
  
  input: any
  idempotency_key: string
```

---

## Enqueue Protocol

```
enqueue(task):
  
  # Deduplication: reject duplicate enqueue of same idempotency_key in PENDING state
  existing = queue.find_by_idempotency_key(task.idempotency_key, state=PENDING)
  IF existing:
    RETURN {status: "DUPLICATE", existing_task_id: existing.task_id}
  
  task.state = PENDING
  task.enqueued_at = now()
  task.priority_score = compute_priority_score(task)
  
  queue.insert(task, band=task.priority_band)
  
  append_event("TASK_ENQUEUED", task.task_id)
  
  # Signal waiting dispatcher if any
  dispatcher_signal.notify(task.executor_type)
  
  RETURN {status: "ACCEPTED", task_id: task.task_id}

enqueue_delayed(task, delay_seconds):
  task.visible_after = now() + delay_seconds
  enqueue(task)  # Will not be dispatched until visible_after
```

---

## Claim / Deliver Protocol

```
claim_next(executor_type, worker_capabilities, worker_id) → QueuedTask | null:
  
  # Scan priority bands top-to-bottom
  FOR band in [CRITICAL, HIGH, NORMAL, LOW, BACKGROUND]:
    
    candidates = queue.get_visible_pending(executor_type, band)
    # "visible" = visible_after <= now()
    
    FOR task in candidates (ordered by priority_score DESC):
      
      # Capability match
      IF NOT worker_capabilities ⊇ task.required_capabilities: CONTINUE
      
      # Fairness check: has this workflow consumed too much capacity recently?
      IF fairness_limiter.is_rate_limited(task.workflow_id): CONTINUE
      
      # Claim the task (atomic compare-and-swap)
      claimed = queue.atomic_claim(task.task_id, worker_id)
      IF claimed:
        task.state = CLAIMED
        task.claimed_by_worker = worker_id
        task.claimed_at = now()
        task.ack_deadline = now() + ack_timeout_seconds
        append_event("TASK_CLAIMED", task.task_id, worker_id=worker_id)
        RETURN task
  
  RETURN null  # No eligible task available
```

---

## Acknowledgement and Requeue

```
# Worker must acknowledge delivery within ack_deadline
acknowledge(task_id, worker_id, status, result):
  task = queue.get(task_id)
  
  ASSERT task.claimed_by_worker == worker_id
  ASSERT task.state == CLAIMED
  ASSERT now() <= task.ack_deadline
  
  IF status == SUCCESS:
    task.state = ACKNOWLEDGED
    queue.remove(task_id)
    append_event("TASK_ACKNOWLEDGED", task_id)
    dag_engine.on_task_result(task_id, result)
  
  ELIF status == FAILURE:
    task.state = ACKNOWLEDGED
    queue.remove(task_id)
    retry_engine.on_task_failure(task, result.error)

# ACK DEADLINE WATCHDOG (runs every 5 seconds):
FOR each task WHERE state == CLAIMED AND now() > task.ack_deadline:
  # Worker may have crashed or is unresponsive
  task.state = PENDING
  task.claimed_by_worker = null
  task.claimed_at = null
  task.ack_deadline = null
  task.visible_after = now() + requeue_delay_seconds  # Brief delay before re-claim
  append_event("TASK_REQUEUED", task_id, reason="ACK_TIMEOUT")
```

---

## Fairness Limiter

Prevents a high-volume workflow from monopolizing all worker capacity:

```
WORKFLOW FAIRNESS:
  
  # Track tasks in-flight per workflow
  in_flight_by_workflow = count_claimed(group_by=workflow_id)
  
  # Fair share: no single workflow should hold > 30% of active slots
  total_active_slots = worker_registry.total_max_concurrent_tasks()
  fair_share_per_workflow = total_active_slots × 0.30
  
  # Exception: CRITICAL priority workflows are exempt from fairness limiting
  IF task.priority_band == CRITICAL: SKIP fairness check
  
  is_rate_limited(workflow_id):
    RETURN in_flight_by_workflow[workflow_id] >= fair_share_per_workflow
```

---

## Back-Pressure Signals

```
back_pressure_status(executor_type) → BackPressureSignal:
  
  queue = get_queue(executor_type)
  worker_count = worker_registry.active_count(executor_type)
  
  pending = queue.pending_count()
  avg_task_duration_seconds = task_duration_history.p50(executor_type)
  tasks_per_worker_per_minute = 60 / avg_task_duration_seconds
  drain_rate_per_minute = worker_count × tasks_per_worker_per_minute
  
  IF drain_rate_per_minute == 0:
    queue_drain_minutes = INFINITY
  ELSE:
    queue_drain_minutes = pending / drain_rate_per_minute
  
  RETURN BackPressureSignal(
    executor_type = executor_type,
    pending_tasks = pending,
    estimated_drain_minutes = queue_drain_minutes,
    pressure_level = classify_pressure(queue_drain_minutes)
    # NONE (<5min), ELEVATED (5-15min), HIGH (15-30min), CRITICAL (>30min)
  )
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — enqueues tasks when nodes become READY
- `workflow-engine/retry-engine.md` — enqueues delayed retry tasks
- `workflow-engine/worker-dispatcher.md` — claims tasks on behalf of workers

**Calls:**
- `workflow-engine/dag-engine.md` — delivers task results after acknowledgement
- `workflow-engine/scheduler.md` — back-pressure signal for admission control

**Writes to:**
- `memory/distributed-execution/task-queue-state.yaml` — current queue state
- `memory/distributed-execution/queue-events.jsonl` — all queue events
