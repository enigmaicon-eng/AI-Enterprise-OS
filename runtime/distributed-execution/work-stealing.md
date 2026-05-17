# Work Stealing

**System ID:** `work-stealing`
**Role:** Implements work-stealing load balancing across the distributed worker pool — idle workers steal tasks from the local queues of overloaded workers, maximizing throughput and minimizing idle time without centralized coordination overhead
**Storage:** `memory/distributed-execution/work-stealing-stats.yaml`

---

## Purpose

A centralized task queue is a bottleneck under high throughput — all claim operations contend on a single data structure. Work stealing solves this by giving each worker a local double-ended queue (deque), allowing idle workers to steal from the back of busy workers' local queues without touching a central lock. The result: near-linear throughput scaling with worker count, with minimal coordination overhead.

---

## Deque-Based Architecture

```
WORKER LOCAL DEQUE:

  Each worker maintains a local deque of assigned tasks:
  
  FRONT ←──────────────────────────────→ BACK
  [task_5] [task_4] [task_3] [task_2] [task_1]
  
  Worker pushes new tasks to FRONT (LIFO for cache locality)
  Worker pops own tasks from FRONT (processes newest first)
  
  Stealing workers pop from BACK (oldest tasks — least likely to conflict with owner)

WHY STEAL FROM BACK:
  - Newer tasks (front) are more likely to have hot context in owner's memory
  - Older tasks (back) have had more time to be "safe to move"
  - Avoids ABA problems: owner and thief rarely contend on same end
```

---

## Steal Algorithm

```
STEAL_LOOP (runs on each worker when its local deque is empty):
  
  # Find the most loaded worker to steal from
  candidates = worker_registry.get_workers_by_queue_depth(
    executor_type = this_worker.executor_type,
    min_queue_depth = steal_threshold  # Only steal if victim has > N tasks
  )
  
  IF len(candidates) == 0:
    → No work to steal; enter brief wait (exponential backoff, max 2s)
    RETURN
  
  # Select victim: worker with most tasks (maximizes steal utility)
  victim = MAX(candidates, key = lambda w: w.local_queue_depth)
  
  # Attempt steal (CAS on victim's back pointer)
  stolen_task = victim.local_deque.atomic_pop_back()
  
  IF stolen_task is None:
    # Race: another worker stole it first, or victim popped it
    → Retry with next candidate
  ELSE:
    # Execute stolen task locally
    this_worker.execute(stolen_task)
    record_steal(victim_id=victim.worker_id, task_id=stolen_task.task_id)
```

---

## Steal Eligibility Rules

Not all tasks are stealable:

```
is_stealable(task, victim_worker, stealing_worker):
  
  # Hard rules
  IF task.affinity.require_same_worker:
    RETURN False  # Session-pinned tasks never stolen
  
  IF task.executor_type != stealing_worker.executor_type:
    RETURN False  # Type mismatch
  
  IF NOT stealing_worker.capabilities ⊇ task.required_capabilities:
    RETURN False  # Capability gap
  
  # Soft rules (heuristics)
  IF task.affinity.preferred_worker == victim_worker.worker_id:
    # Prefer to keep on preferred worker, but allow stealing if very idle
    only_steal_if = stealing_worker.is_fully_idle AND victim_worker.load_ratio > 0.80
    RETURN only_steal_if
  
  RETURN True
```

---

## Steal Threshold Tuning

```
STEAL_THRESHOLD calibration:

  Too low (threshold=1):
    Workers steal after victim has just 1 task queued
    → High steal rate; lots of coordination overhead; poor locality

  Too high (threshold=10):
    Workers wait until victim has 10 tasks before stealing
    → Imbalanced utilization; some workers idle while others overloaded

  ADAPTIVE THRESHOLD:
    steal_threshold = MAX(2, CEIL(avg_task_duration_seconds / avg_steal_latency_seconds))
    
    Rationale: only steal if the victim has enough work to justify the steal cost.
    If steal latency = 10ms and task duration = 50ms → threshold = 5
    If steal latency = 10ms and task duration = 500ms → threshold = 2 (steal aggressively)
  
  Recalibrated every 5 minutes using rolling averages.
```

---

## Work Stealing Statistics

Tracked for observability and calibration:

```yaml
WorkStealingStats:
  window_start: datetime
  window_end: datetime
  
  total_steal_attempts: integer
  successful_steals: integer
  failed_steals: integer           # CAS miss — task gone by the time we tried
  steal_success_rate: float        # successful / total_attempts
  
  # Per-worker stats
  workers:
    - worker_id: string
      tasks_stolen_from: integer   # This worker was the victim
      tasks_stolen_by: integer     # This worker did the stealing
      steal_net: integer           # stolen_by - stolen_from (positive = net consumer)
  
  # Balance metrics
  imbalance_score: float           # STDEV(worker_queue_depths) / MEAN; lower = more balanced
  avg_task_wait_ms_with_stealing: float
  est_avg_task_wait_ms_without_stealing: float  # Counterfactual estimate
```

---

## Integration with Central Queue

Work stealing operates on top of, not instead of, the central task queue:

```
HYBRID MODEL:

1. DAG engine enqueues to central task-queue (priority-ordered)
2. task-queue distributes to worker local deques (batches of N tasks per claim)
3. Workers process from local deque (LIFO, no central contention)
4. Idle workers steal from busy workers' local deques
5. If local deques all empty → workers pull from central queue again

BATCH SIZE for central→local transfer:
  optimal_batch = CEIL(avg_tasks_per_worker × 0.5)
  # Each claim pulls ~half a worker's expected load at once
  # Reduces claim frequency while keeping deques small enough to steal
```

---

## Integration

**Called by:** `distributed-execution/worker-orchestration.md` — invoked by idle workers seeking work
**Calls:**
- `distributed-execution/task-queue.md` — falls back to central queue when all local deques empty
- `execution-observability/execution-tracer.md` — records steal events in trace spans

**Reads from:** `memory/distributed-execution/worker-registry.yaml` — worker queue depths for victim selection
**Writes to:** `memory/distributed-execution/work-stealing-stats.yaml` — steal statistics for calibration
