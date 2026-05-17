# Worker Orchestration

**System ID:** `worker-orchestration`
**Role:** Manages the full lifecycle of distributed workers — registration, heartbeat monitoring, capability advertisement, health scoring, graceful shutdown, and failure detection; the authoritative registry of what workers exist and what they can do
**Storage:** `memory/distributed-execution/worker-registry.yaml` + `memory/distributed-execution/worker-events.jsonl`

---

## Purpose

Workers are the execution units of the runtime. Without a system managing their lifecycle, workers crash silently, capabilities become stale, and the dispatcher routes tasks to dead workers. Worker orchestration provides the control plane: every worker is registered, monitored, and deregistered in a controlled manner, with live capability and health data available to the dispatcher in under 100ms.

---

## Worker Model

```yaml
Worker:
  worker_id: string                  # uuid; assigned at registration
  executor_type: string              # Capability class: "ai-agent | tool-runner | gate-validator | ..."
  
  # Capabilities
  capabilities: [string]             # Fine-grained capability set this worker has
  tags: [string]                     # Routing tags (e.g., "gpu", "high-memory", "region:us-east")
  
  # Capacity
  max_concurrent_tasks: integer      # Hard limit on simultaneous tasks
  current_task_count: integer
  context_budget_total: integer      # Total tool calls available
  context_budget_remaining: integer
  memory_mb_total: integer
  memory_mb_available: integer
  
  # State
  state: "STARTING | READY | LOADED | OVERLOADED | DRAINING | TERMINATED | LOST"
  
  # Health
  last_heartbeat_at: datetime
  heartbeat_interval_seconds: integer
  consecutive_missed_heartbeats: integer
  health_score: float                # 0.0–1.0; composite health signal
  
  # Affinity
  active_workflow_id: string | null  # Workflow this worker is currently serving (for locality)
  affinity_group_id: string | null
  
  # Metrics (rolling window)
  tasks_completed_last_5min: integer
  tasks_failed_last_5min: integer
  avg_task_duration_ms_p50: float
  avg_task_duration_ms_p95: float
```

---

## Registration Protocol

```
register(worker_registration_request):
  
  # Validate capabilities are known executor types
  validate_executor_type(request.executor_type)
  
  worker = Worker(
    worker_id = generate_uuid(),
    executor_type = request.executor_type,
    capabilities = request.capabilities,
    state = STARTING,
    ...
  )
  
  worker_registry.add(worker)
  emit_event("WORKER_REGISTERED", {worker_id, executor_type})
  
  # Worker must pass readiness probe within startup timeout
  schedule_readiness_check(worker.worker_id, timeout=60)
  
  RETURN {worker_id, registration_confirmed: True}

readiness_check(worker_id):
  worker = worker_registry.get(worker_id)
  
  probe_result = send_probe(worker)  # Health check HTTP/RPC probe
  
  IF probe_result.healthy:
    worker.state = READY
    worker_registry.update(worker)
    emit_event("WORKER_READY", {worker_id})
  ELSE:
    worker.state = TERMINATED
    worker_registry.remove(worker_id)
    emit_event("WORKER_STARTUP_FAILED", {worker_id})
```

---

## Heartbeat Monitoring

```
HEARTBEAT LOOP (runs continuously):

WORKERS send heartbeat every worker.heartbeat_interval_seconds:
  heartbeat = {
    worker_id: string,
    timestamp: datetime,
    current_task_count: integer,
    context_budget_remaining: integer,
    memory_mb_available: integer,
    active_task_ids: [string]
  }

ORCHESTRATOR receives heartbeat:
  worker = worker_registry.get(heartbeat.worker_id)
  worker.last_heartbeat_at = heartbeat.timestamp
  worker.consecutive_missed_heartbeats = 0
  worker.current_task_count = heartbeat.current_task_count
  worker.context_budget_remaining = heartbeat.context_budget_remaining
  
  # Update health score
  worker.health_score = compute_health_score(worker)
  worker_registry.update(worker)

FAILURE DETECTOR (runs every 10 seconds):
  FOR each worker WHERE state in [READY, LOADED, OVERLOADED]:
    
    expected_heartbeat_at = worker.last_heartbeat_at + worker.heartbeat_interval_seconds
    
    IF now() > expected_heartbeat_at + heartbeat_grace_period_seconds:
      worker.consecutive_missed_heartbeats += 1
      
      IF worker.consecutive_missed_heartbeats >= 3:
        declare_worker_lost(worker)
```

---

## Worker Health Scoring

```
compute_health_score(worker):
  score = 1.0
  
  # Capacity factors
  load_ratio = worker.current_task_count / worker.max_concurrent_tasks
  IF load_ratio > 0.90: score -= 0.30      # Overloaded
  ELIF load_ratio > 0.75: score -= 0.15    # Loaded
  
  context_pct_used = 1 - (worker.context_budget_remaining / worker.context_budget_total)
  IF context_pct_used > 0.80: score -= 0.20
  
  memory_pct_used = 1 - (worker.memory_mb_available / worker.memory_mb_total)
  IF memory_pct_used > 0.85: score -= 0.20
  
  # Reliability factors
  recent_failure_rate = worker.tasks_failed_last_5min / MAX(1, worker.tasks_completed_last_5min)
  score -= recent_failure_rate × 0.30
  
  # Heartbeat recency (staleness penalty)
  heartbeat_age = now() - worker.last_heartbeat_at
  IF heartbeat_age > worker.heartbeat_interval_seconds × 1.5:
    score -= 0.20
  
  RETURN MAX(0.0, score)
```

---

## Worker Lost Protocol

```
declare_worker_lost(worker):
  
  emit_event("WORKER_LOST", {worker_id, active_task_ids: worker.active_task_ids})
  
  # All in-flight tasks on this worker must be re-dispatched
  FOR each task_id in worker.active_task_ids:
    task = task_registry.get(task_id)
    task.outcome = WORKER_DIED
    retry_engine.schedule_retry(task, error_code="WORKER_DIED", delay=0)
  
  worker.state = LOST
  worker_registry.update(worker)
  
  # Trigger scale-out to replace lost worker
  execution_scaling.scale_out(worker.executor_type, count=1)
  
  # Remove from active registry after grace period (allows in-flight heartbeats to arrive)
  schedule_removal(worker.worker_id, delay=60)
```

---

## Graceful Shutdown

```
graceful_shutdown(worker_id, drain_timeout_seconds=120):
  
  worker = worker_registry.get(worker_id)
  worker.state = DRAINING
  worker_registry.update(worker)
  
  # No new tasks dispatched to DRAINING worker
  
  # Wait for current tasks to finish
  start_wait = now()
  WHILE worker.current_task_count > 0 AND (now() - start_wait) < drain_timeout_seconds:
    sleep(5)
    worker = worker_registry.get(worker_id)  # Refresh from heartbeat
  
  # Force-revoke remaining tasks
  IF worker.current_task_count > 0:
    FOR each task_id in worker.active_task_ids:
      retry_engine.schedule_retry(task_id, error_code="WORKER_SHUTDOWN", delay=0)
  
  worker.state = TERMINATED
  worker_registry.remove(worker_id)
  emit_event("WORKER_TERMINATED", {worker_id, reason: "GRACEFUL_SHUTDOWN"})
```

---

## Integration

**Called by:**
- `execution-runtime/execution-scaling.md` — spawns and terminates workers
- `workflow-engine/worker-dispatcher.md` — queries worker state and capabilities
- Workers themselves — send heartbeats, register, deregister

**Calls:**
- `workflow-engine/retry-engine.md` — on worker lost; reschedules orphaned tasks
- `execution-runtime/execution-scaling.md` — triggers replacement scale-out on worker loss

**Reads from:** `memory/distributed-execution/worker-registry.yaml`

**Writes to:**
- `memory/distributed-execution/worker-registry.yaml` — live worker state
- `memory/distributed-execution/worker-events.jsonl` — all worker lifecycle events
