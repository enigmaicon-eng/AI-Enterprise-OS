# Execution Scaling

**System ID:** `execution-scaling`
**Role:** Controls the size and composition of the worker pool in response to workload demand — implements reactive autoscaling, predictive pre-scaling, scale-in with drain, and anti-thrashing protection to maintain throughput without over-provisioning
**Storage:** `memory/execution-runtime/scaling-state.yaml` + `memory/execution-runtime/scaling-events.jsonl`

---

## Purpose

The worker pool is the limiting resource of the execution runtime. Too few workers: workflows queue; latency spikes; deadlines miss. Too many workers: resource waste; context budget dilution; orchestration overhead increases. Execution scaling continuously adjusts the pool size to match demand, using both reactive signals (current queue depth) and predictive signals (twin-layer forecasts) to scale ahead of need.

---

## Scaling Dimensions

```yaml
ScalingTarget:
  executor_type: string              # Separate scaling policy per executor type
  min_workers: integer               # Hard floor — never scale below
  max_workers: integer               # Hard ceiling — never scale above
  current_workers: integer
  target_workers: integer            # Current autoscaler target
  
  # Per-worker resource profile
  worker_cost_units: float           # Relative cost of one worker of this type
  worker_startup_seconds: float      # Time from spawn to accepting tasks
  worker_shutdown_seconds: float     # Time for graceful drain on scale-in
```

---

## Reactive Autoscaling

Triggered by real-time queue and utilization signals:

```
REACTIVE SCALING LOOP (runs every 60 seconds):

FOR each executor_type:
  
  metrics = collect_metrics(executor_type)
  
  # Key signals
  queue_depth = task_queue.pending_count(executor_type)
  active_workers = worker_registry.active_count(executor_type)
  avg_worker_utilization = worker_registry.avg_utilization(executor_type)
  avg_task_duration_p50 = task_duration_history.p50(executor_type)
  arrival_rate = task_queue.arrival_rate_per_minute(executor_type)
  
  # Compute desired worker count
  # Target: queue drains within target_drain_seconds
  target_drain_seconds = 120
  tasks_per_worker_per_second = 1.0 / avg_task_duration_p50
  
  desired_for_queue = CEIL(queue_depth / (target_drain_seconds × tasks_per_worker_per_second))
  desired_for_arrival = CEIL(arrival_rate / (60 × tasks_per_worker_per_second × target_utilization))
  
  # Take the higher of queue-clearing and arrival-rate targets
  desired_workers = MAX(desired_for_queue, desired_for_arrival)
  desired_workers = CLAMP(desired_workers, min_workers, max_workers)
  
  # Apply scaling decision
  IF desired_workers > current_workers:
    scale_out(executor_type, desired_workers - current_workers)
  ELIF desired_workers < current_workers × (1 - scale_in_threshold):
    scale_in(executor_type, current_workers - desired_workers)
```

### Target Utilization by Executor Type

```
executor_target_utilization:
  ai-agent:       0.70    # Leave headroom for context spikes
  tool-runner:    0.80    # Stateless; can pack tighter
  gate-validator: 0.75
  coordinator:    0.65    # High overhead per task; keep loose
  background:     0.90    # Background tasks: pack tightly
```

---

## Predictive Pre-Scaling

Uses twin-layer forecasts to scale *before* demand arrives:

```
PREDICTIVE SCALING (runs every 15 minutes):
  
  # Load prediction from operational-forecaster
  throughput_forecast = operational_forecaster.throughput_forecast
  
  # If throughput is projected to increase significantly:
  projected_increase_pct = (
    throughput_forecast.horizon_14d.projected_p50 - current_throughput
  ) / current_throughput
  
  IF projected_increase_pct > 0.20:
    # Pre-scale by the projected increase (lead time: startup_seconds)
    pre_scale_target = current_workers × (1 + projected_increase_pct × 0.80)
    schedule_scale_out(pre_scale_target, delay=0)  # Scale now; ready by demand arrival
  
  # Load capacity exhaustion warning from org-forecaster
  IF org_forecaster.capacity_forecast.exhaustion_status == "IMMINENT":
    # System-wide capacity crunch coming — scale down to preserve headroom
    reduce_background_workers(by_pct=0.30)
```

---

## Anti-Thrashing Protection

Rapid oscillation between scale-out and scale-in wastes startup/shutdown costs and destabilizes the pool:

```
ANTI-THRASHING RULES:

Cooldown periods (minimum time between scaling actions):
  scale_out_cooldown_seconds: 120   # 2 minutes after any scale-out
  scale_in_cooldown_seconds:  300   # 5 minutes after any scale-in

Minimum scale increment:
  scale_out_minimum_step: 1         # Always add at least 1
  scale_in_minimum_step: 1          # Always remove at least 1
  scale_out_maximum_step: 5         # Never add more than 5 at once (gradual ramp)

Trend confirmation:
  # Only scale in if utilization has been below threshold for N consecutive checks
  scale_in_requires_consecutive_checks: 3
  # Only scale out immediately if queue depth exceeds emergency threshold
  emergency_scale_threshold_queue_depth: 50
```

---

## Scale-Out Protocol

```
scale_out(executor_type, count):
  
  FOR i in 1..count:
    worker = worker_factory.spawn(executor_type)
    
    # Worker goes through: SPAWNING → STARTING → READY
    # Only READY workers receive tasks
    
    worker_registry.register(worker)
    emit_event("WORKER_SPAWNED", {worker_id, executor_type, spawned_at: now()})
  
  scaling_state.last_scale_out_at = now()
  scaling_state.target_workers[executor_type] += count
  persist(scaling_state)
```

## Scale-In Protocol (with Drain)

```
scale_in(executor_type, count):
  
  # Select workers to decommission: prefer idle, then least-loaded
  candidates = worker_registry.select_for_decommission(executor_type, count)
  
  FOR each worker in candidates:
    
    # Step 1: Mark as DRAINING — no new tasks dispatched to this worker
    worker.state = DRAINING
    worker_registry.update(worker)
    
    # Step 2: Wait for in-flight tasks to complete
    await worker.all_tasks_complete(timeout = worker.drain_timeout_seconds)
    
    # Step 3: Revoke any tasks still in-flight after timeout
    IF worker.active_tasks > 0:
      worker_dispatcher.revoke_and_requeue(worker.active_task_ids)
    
    # Step 4: Terminate
    worker.terminate()
    worker_registry.deregister(worker.worker_id)
    emit_event("WORKER_TERMINATED", {worker_id, executor_type, reason: "SCALE_IN"})
  
  scaling_state.last_scale_in_at = now()
  persist(scaling_state)
```

---

## Scaling State Schema

```yaml
ScalingState:
  last_evaluated_at: datetime
  
  by_executor_type:
    [executor_type]:
      current_workers: integer
      target_workers: integer
      min_workers: integer
      max_workers: integer
      avg_utilization: float
      queue_depth: integer
      last_scale_out_at: datetime | null
      last_scale_in_at: datetime | null
      consecutive_low_utilization_checks: integer
      pending_scale_action: string | null   # "OUT" | "IN" | null
```

---

## Integration

**Called by:**
- `distributed-execution/worker-orchestration.md` — reports utilization metrics that trigger scaling evaluation
- `predictive-intelligence/operational-forecaster.md` — throughput forecast triggers predictive pre-scaling
- Cron trigger — reactive loop runs every 60 seconds

**Calls:**
- `distributed-execution/worker-orchestration.md` — spawns and terminates workers
- `distributed-execution/task-queue.md` — reads queue depth and arrival rate

**Reads from:**
- `memory/distributed-execution/worker-registry.yaml` — current worker pool state
- `memory/digital-twins/twin-state/runtime-twin-state.yaml` — system-wide saturation
- `memory/digital-twins/predictions/` — operational and capacity forecasts

**Writes to:**
- `memory/execution-runtime/scaling-state.yaml` — current scaling target state
- `memory/execution-runtime/scaling-events.jsonl` — all scaling decisions
