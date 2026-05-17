# Runtime Dashboards

**System ID:** `runtime-dashboards`
**Role:** Real-time operational dashboards showing live execution runtime metrics — worker pool utilization, queue depths, throughput rates, error rates, active run distribution, SLO compliance status, and executor health across all worker pools and execution tiers; auto-refreshes at 15-second intervals
**Storage:** `memory/operational-command-center/dashboard-state.yaml`

---

## Dashboard Panels

### Panel 1: Execution Overview (15s refresh)

```
EXECUTION OVERVIEW
─────────────────────────────────────────────────────────────
Active Runs:    142  [▓▓▓▓▓▓▓░░░ 71%]  Queued: 38
Throughput:     4.2 runs/min (↑ 0.3 vs 15m avg)
Error Rate:     2.1% (↓ 0.4pp)         P99 Latency: 847ms
SLO Compliant:  91.4% (target: 99.0%)  7 runs at risk
─────────────────────────────────────────────────────────────
WORKER POOL UTILIZATION
  standard-pool    ████████░░  82%   (48/58 workers)
  enhanced-pool    ██████░░░░  61%   (11/18 workers)
  strict-pool      ████░░░░░░  44%   ( 4/9 workers)
  sandbox-pool     ██░░░░░░░░  20%   ( 1/5 workers)
─────────────────────────────────────────────────────────────
```

### Panel 2: Queue Health (15s refresh)

```
QUEUE HEALTH
─────────────────────────────────────────────────────────────
CRITICAL  ██░░░░░░░░   3 tasks  (avg wait: 12s)
HIGH      ████████░░  18 tasks  (avg wait: 34s)
NORMAL    ██████░░░░  12 tasks  (avg wait: 78s)
LOW       █░░░░░░░░░   5 tasks  (avg wait: 312s)
─────────────────────────────────────────────────────────────
Oldest queued task: 14m 22s (NORMAL priority — worker-dev-42)
Back-pressure level: NORMAL
Estimated drain time: 9.4 minutes at current throughput
─────────────────────────────────────────────────────────────
```

### Panel 3: SLO Compliance by Definition (5-min refresh)

```
SLO STATUS BY WORKFLOW DEFINITION
────────────────────────────────────────────────────────────────
feature-development     Compliance: 88.2%  Burn: 5.1×  🔴 AT RISK
discovery               Compliance: 97.1%  Burn: 0.9×  ✅ OK
architecture-review     Compliance: 94.3%  Burn: 1.8×  🟡 ELEVATED
sprint-planning         Compliance: 99.1%  Burn: 0.3×  ✅ OK
release-workflow        Compliance: 91.5%  Burn: 3.2×  🟡 ELEVATED
incident-response       Compliance: 83.3%  Burn: 8.0×  🔴 CRITICAL
────────────────────────────────────────────────────────────────
Enterprise SLO: 91.4%  (7-day avg: 94.2%  trend: ↓)
Error budget remaining: 62% (alert at 20%)
────────────────────────────────────────────────────────────────
```

---

## Dashboard State Schema

```yaml
DashboardState:
  last_refreshed: datetime
  refresh_interval_seconds: 15
  
  # Execution overview
  execution:
    active_runs: integer
    queued_runs: integer
    throughput_per_min: float
    error_rate: float
    p99_latency_ms: float
    slo_compliance_rate: float
    at_risk_slo_count: integer
  
  # Worker pools
  worker_pools:
    pool_id:
      total_workers: integer
      active_workers: integer
      utilization_rate: float
      health_status: "HEALTHY | DEGRADED | CRITICAL"
      avg_task_duration_ms: float
  
  # Queue state
  queues:
    by_priority:
      CRITICAL: {depth: integer, avg_wait_ms: float}
      HIGH: {depth: integer, avg_wait_ms: float}
      NORMAL: {depth: integer, avg_wait_ms: float}
      LOW: {depth: integer, avg_wait_ms: float}
    back_pressure_level: "NORMAL | ELEVATED | HIGH | CRITICAL"
    oldest_queued_task_age_seconds: float
    estimated_drain_seconds: float
  
  # SLO by definition
  slo_by_definition:
    definition_id:
      compliance_rate: float
      burn_rate: float
      status: "OK | ELEVATED | AT_RISK | CRITICAL"
      error_budget_remaining: float
  
  # Enterprise aggregate
  enterprise:
    slo_compliance_rate: float
    error_budget_remaining: float
    error_budget_trend: "IMPROVING | STABLE | DEGRADING"
```

---

## Dashboard Data Collection

```
refresh_dashboard() → DashboardState:
  
  # Parallel queries to minimize refresh latency
  [exec_data, pool_data, queue_data, slo_data] = parallel_load([
    load_execution_overview(),
    load_worker_pool_status(),
    load_queue_health(),
    load_slo_status()
  ])
  
  state = DashboardState(
    last_refreshed = now(),
    execution = exec_data,
    worker_pools = pool_data,
    queues = queue_data,
    slo_by_definition = slo_data,
    enterprise = compute_enterprise_aggregates(exec_data, slo_data)
  )
  
  persist_dashboard_state(state)
  
  # Trigger alerts for threshold breaches
  FOR pool_id, pool in state.worker_pools.items():
    IF pool.utilization_rate > 0.90:
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "WORKER_POOL_SATURATION",
        payload = {pool_id: pool_id, utilization: pool.utilization_rate},
        priority = "HIGH"
      )
  
  FOR defn_id, slo in state.slo_by_definition.items():
    IF slo.burn_rate > 5.0:
      enterprise_event_bus.publish(
        topic = "alerts.critical",
        event_type = "SLO_BURN_RATE_CRITICAL",
        payload = {definition_id: defn_id, burn_rate: slo.burn_rate},
        priority = "CRITICAL"
      )
    ELIF slo.burn_rate > 2.0:
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "SLO_BURN_RATE_ELEVATED",
        payload = {definition_id: defn_id, burn_rate: slo.burn_rate},
        priority = "HIGH"
      )
  
  IF state.queues.back_pressure_level in ["HIGH", "CRITICAL"]:
    enterprise_event_bus.publish(
      topic = "alerts.high" if state.queues.back_pressure_level == "HIGH" else "alerts.critical",
      event_type = "QUEUE_BACK_PRESSURE",
      payload = {level: state.queues.back_pressure_level, queue_depth: sum(q.depth for q in state.queues.by_priority.values())},
      priority = "HIGH"
    )
  
  RETURN state

load_execution_overview() → dict:
  
  active_runs = dag_runtime.count_active_runs()
  queued = task_queue.get_total_pending()
  
  metrics = workflow_telemetry.get_latest_snapshot()
  
  RETURN {
    active_runs: active_runs,
    queued_runs: queued,
    throughput_per_min: metrics.completions_per_min,
    error_rate: metrics.error_rate,
    p99_latency_ms: metrics.latency_distributions.get("enterprise", {}).get("p99"),
    slo_compliance_rate: MEAN(metrics.slo_compliance_by_definition.values()) if metrics.slo_compliance_by_definition else null,
    at_risk_slo_count: count_at_risk_runs()
  }

load_worker_pool_status() → dict:
  
  pools = worker_orchestration.get_all_pool_status()
  
  RETURN {
    pool_id: {
      total_workers: pool.total_workers,
      active_workers: pool.active_workers,
      utilization_rate: pool.active_workers / max(pool.total_workers, 1),
      health_status: classify_pool_health(pool),
      avg_task_duration_ms: pool.avg_task_duration_ms
    }
    for pool_id, pool in pools.items()
  }
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — runtime panel data
- Human operators — standalone dashboard view

**Calls:**
- `enterprise-telemetry/workflow-telemetry.md` — metric snapshots
- `distributed-execution/worker-orchestration.md` — pool status
- `distributed-execution/task-queue.md` — queue depths
- `orchestration-dags/dag-runtime.md` — active run counts
- `enterprise-telemetry/enterprise-event-bus.md` — publishes threshold breach alerts

**Writes to:** `memory/operational-command-center/dashboard-state.yaml`
