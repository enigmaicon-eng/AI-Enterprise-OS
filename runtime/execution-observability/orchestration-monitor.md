# Orchestration Monitor

**System ID:** `orchestration-monitor`
**Role:** Provides live monitoring of the workflow execution cluster — maintains real-time dashboards of active runs, worker pool health, queue depths, SLO status, and alert states; evaluates alerting rules against telemetry and emits alert events; enables operator intervention via signal dispatch
**Storage:** `memory/execution-observability/monitor-state.yaml`

---

## Purpose

The orchestration monitor is the control room for the execution cluster. It aggregates live state from all execution subsystems into a unified operational picture: how many workflows are running, are any in danger of missing their SLO, which workers are healthy, is the queue backing up, are there any active alerts? It also evaluates alerting rules continuously and dispatches runtime signals for automated remediation where possible — turning passive observation into active response.

---

## Monitor State Model

```yaml
MonitorState:
  last_refreshed: datetime
  
  # Execution cluster overview
  cluster:
    total_active_runs: integer
    runs_by_state:
      RUNNING: integer
      SUSPENDED: integer
      SUSPENDING: integer
      COMPLETING: integer
    runs_by_definition: {definition_id: integer}
    
    at_risk_runs: [AtRiskRun]          # Runs likely to miss SLO
    stalled_runs: [string]             # run_ids with no progress for >threshold
  
  # Worker pool summary
  worker_pools:
    [executor_type]:
      total_workers: integer
      active_workers: integer
      idle_workers: integer
      lost_workers: integer
      utilization_pct: float
      avg_health_score: float
  
  # Queue summary
  queues:
    [executor_type]:
      total_depth: integer
      by_priority_band: {band: depth}
      estimated_drain_seconds: float
      backpressure_level: "NONE | ELEVATED | HIGH | CRITICAL"
  
  # SLO summary
  slo_status:
    [slo_id]:
      in_compliance: boolean
      current_pct: float
      target_pct: float
      error_budget_pct_remaining: float
  
  # Active alerts
  active_alerts: [Alert]
  
  # Subscription health
  subscriptions:
    [subscription_id]:
      status: string
      consumer_lag: integer
      error_rate_1h: float

AtRiskRun:
  run_id: string
  definition_id: string
  started_at: datetime
  deadline: datetime
  projected_completion_at: datetime    # Based on remaining critical path estimate
  slack_seconds: float                 # deadline - projected_completion_at
  risk_level: "MARGINAL | AT_RISK | BREACHED"
```

---

## Dashboard Refresh Loop

```
monitor_refresh_loop():
  WHILE running:
    refresh_monitor_state()
    evaluate_alert_rules()
    persist_monitor_state()
    sleep(MONITOR_REFRESH_INTERVAL_SECONDS)  # Default: 30s

refresh_monitor_state():
  
  state = MonitorState(last_refreshed=now())
  
  # 1. Active runs
  active_runs = execution_runtime.list_active_runs()
  state.cluster.total_active_runs = len(active_runs)
  state.cluster.runs_by_state = count_by_state(active_runs)
  state.cluster.runs_by_definition = count_by_definition(active_runs)
  
  # 2. SLO risk assessment for each active run
  FOR each run in active_runs:
    deadline = execution_runtime.get_run(run.run_id).deadline
    IF deadline:
      remaining_seconds = dag_runtime.estimate_remaining_time(run.run_id)
      projected_completion = now() + timedelta(seconds=remaining_seconds)
      slack = (deadline - projected_completion).total_seconds()
      
      IF slack < 0:
        state.cluster.at_risk_runs.append(AtRiskRun(
          run_id=run.run_id, deadline=deadline,
          projected_completion_at=projected_completion,
          slack_seconds=slack,
          risk_level="BREACHED"
        ))
      ELIF slack < SLO_AT_RISK_THRESHOLD_SECONDS:
        state.cluster.at_risk_runs.append(AtRiskRun(..., risk_level="AT_RISK"))
  
  # 3. Stalled run detection
  FOR each run in active_runs WHERE run.state == "RUNNING":
    last_progress = get_last_node_state_change_time(run.run_id)
    IF now() - last_progress > STALL_DETECTION_THRESHOLD_SECONDS:
      state.cluster.stalled_runs.append(run.run_id)
  
  # 4. Worker pool status
  FOR each executor_type in worker_orchestration.get_executor_types():
    pool = worker_orchestration.get_pool_status(executor_type)
    state.worker_pools[executor_type] = {
      total_workers: pool.total,
      active_workers: pool.active,
      idle_workers: pool.idle,
      lost_workers: pool.lost,
      utilization_pct: pool.active / max(pool.total, 1),
      avg_health_score: pool.avg_health_score
    }
  
  # 5. Queue depths
  FOR each executor_type in task_queue.get_executor_types():
    depth = task_queue.get_queue_summary(executor_type)
    drain_rate = worker_orchestration.get_effective_throughput(executor_type)
    state.queues[executor_type] = {
      total_depth: depth.total,
      by_priority_band: depth.by_band,
      estimated_drain_seconds: depth.total / max(drain_rate, 0.001),
      backpressure_level: task_queue.get_backpressure_level(executor_type)
    }
  
  # 6. SLO statuses
  FOR each slo in workflow_telemetry.get_all_slo_statuses():
    state.slo_status[slo.slo_id] = slo
  
  # 7. Subscription health
  FOR each sub in orchestration_subscriptions.list_subscriptions():
    state.subscriptions[sub.subscription_id] = {
      status: sub.status,
      consumer_lag: sub.metrics.consumer_lag,
      error_rate_1h: sub.metrics.error_rate_1h
    }
  
  RETURN state
```

---

## Alert Rules

```yaml
AlertRule:
  rule_id: string
  name: string
  condition: string                    # Expression evaluated against MonitorState
  severity: "INFO | WARNING | CRITICAL"
  message_template: string
  
  # Auto-remediation (optional)
  remediation:
    action: "PRIORITY_BOOST | SCALE_OUT_SIGNAL | PAUSE_SUBSCRIPTION | NOTIFY_ONLY"
    signal_type: string | null
    signal_payload: object | null
  
  cooldown_seconds: integer
  enabled: boolean

Alert:
  alert_id: string
  rule_id: string
  severity: string
  message: string
  fired_at: datetime
  resolved_at: datetime | null
  status: "FIRING | RESOLVED | SUPPRESSED"
  context: object                      # Relevant state snapshot when alert fired
```

```
built_in_alert_rules:
  
  - rule_id: "executor-saturation"
    name: "Executor pool near saturation"
    condition: "any(pool.utilization_pct > 0.90 for pool in state.worker_pools.values())"
    severity: WARNING
    message_template: "Executor {executor_type} at {utilization_pct:.0%} utilization"
    remediation:
      action: SCALE_OUT_SIGNAL
      signal_type: "SCALE_OUT_REQUESTED"
    cooldown_seconds: 300
  
  - rule_id: "queue-critical-backpressure"
    name: "Task queue at critical backpressure"
    condition: "any(q.backpressure_level == 'CRITICAL' for q in state.queues.values())"
    severity: CRITICAL
    message_template: "Critical backpressure on {executor_type} queue: {total_depth} tasks pending"
    remediation:
      action: SCALE_OUT_SIGNAL
    cooldown_seconds: 120
  
  - rule_id: "slo-breach"
    name: "SLO compliance breached"
    condition: "any(not slo.in_compliance for slo in state.slo_status.values())"
    severity: CRITICAL
    message_template: "SLO {slo_id} breached: {current_pct:.1%} vs target {target_pct:.1%}"
    remediation:
      action: NOTIFY_ONLY
    cooldown_seconds: 3600
  
  - rule_id: "stalled-runs"
    name: "Workflow runs with no progress"
    condition: "len(state.cluster.stalled_runs) > 0"
    severity: WARNING
    message_template: "{count} workflow run(s) stalled for >{threshold}s without progress"
    remediation:
      action: NOTIFY_ONLY
    cooldown_seconds: 600
  
  - rule_id: "subscription-high-lag"
    name: "Consumer subscription falling behind"
    condition: "any(sub.consumer_lag > 10000 for sub in state.subscriptions.values())"
    severity: WARNING
    message_template: "Subscription {subscription_id} lag: {consumer_lag} events behind"
    remediation:
      action: NOTIFY_ONLY
    cooldown_seconds: 300
  
  - rule_id: "at-risk-slo-run"
    name: "Active run projected to miss SLO"
    condition: "any(r.risk_level in ['AT_RISK', 'BREACHED'] for r in state.cluster.at_risk_runs)"
    severity: WARNING
    message_template: "Run {run_id} at risk: {slack_seconds:.0f}s slack remaining"
    remediation:
      action: PRIORITY_BOOST
      signal_payload: {boost_factor: 2.0, run_id: "${run_id}"}
    cooldown_seconds: 300
```

```
evaluate_alert_rules():
  state = current_monitor_state
  
  FOR each rule in alert_rules WHERE rule.enabled:
    IF in_cooldown(rule):
      CONTINUE
    
    condition_met = eval_condition(rule.condition, state)
    existing_alert = get_active_alert(rule.rule_id)
    
    IF condition_met AND NOT existing_alert:
      alert = fire_alert(rule, state)
      
      # Publish alert event
      event_bus.publish(
        topic = "runtime.signals",
        event_type = "MONITOR_ALERT_FIRED",
        payload = {alert_id: alert.alert_id, rule_id: rule.rule_id, severity: rule.severity}
      )
      
      # Auto-remediation
      IF rule.remediation.action != "NOTIFY_ONLY":
        execute_remediation(rule, alert, state)
    
    ELIF NOT condition_met AND existing_alert:
      resolve_alert(existing_alert)

execute_remediation(rule, alert, state):
  MATCH rule.remediation.action:
    CASE "PRIORITY_BOOST":
      FOR each at_risk_run in state.cluster.at_risk_runs:
        runtime_signals.send_signal(
          run_id = at_risk_run.run_id,
          signal_type = "PRIORITY_BOOST",
          payload = {boost_factor: 2.0}
        )
    CASE "SCALE_OUT_SIGNAL":
      event_bus.publish("runtime.signals", "SCALE_OUT_REQUESTED", payload={alert_id: alert.alert_id})
    CASE "PAUSE_SUBSCRIPTION":
      orchestration_subscriptions.pause(rule.remediation.signal_payload.subscription_id)
```

---

## Operations API

```
# Operator interventions available through monitor

list_active_runs() → [RunSummary]
get_run_detail(run_id) → RunDetail       # Full runtime graph + trace link
cancel_run(run_id, reason) → void        # Sends CANCEL signal
suspend_run(run_id) → void               # Sends SUSPEND signal
resume_run(run_id) → void                # Sends RESUME signal
boost_run_priority(run_id, factor) → void
get_active_alerts() → [Alert]
suppress_alert(alert_id, duration_seconds) → void
get_heatmap(heatmap_type, window_hours) → Heatmap   # Delegates to runtime-heatmaps
get_slo_dashboard() → [SLOStatus]
```

---

## Integration

**Called by:** Operators, operations agents, automated remediation rules

**Calls:**
- `execution-runtime/runtime-engine.md` — queries active run list and run state
- `orchestration-dags/dag-runtime.md` — queries node states and estimates remaining time
- `distributed-execution/worker-orchestration.md` — queries pool status
- `distributed-execution/task-queue.md` — queries queue depths and backpressure
- `execution-observability/workflow-telemetry.md` — reads SLO and metric status
- `execution-observability/runtime-heatmaps.md` — generates heatmaps on request
- `runtime-clusters/runtime-signals.md` — dispatches remediation signals
- `runtime-clusters/event-bus.md` — publishes alert events

**Reads from:** `memory/execution-observability/monitor-state.yaml`
**Writes to:** `memory/execution-observability/monitor-state.yaml`
