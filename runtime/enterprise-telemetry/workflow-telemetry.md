# Workflow Telemetry

**System ID:** `workflow-telemetry`
**Role:** Collects, aggregates, and indexes enterprise-wide workflow performance telemetry — tracks portfolio-level throughput, latency distributions, SLO burn rates, gate pass rates, and error patterns across all active and completed workflow runs; provides the raw metrics that feed dashboards, health scorers, and trigger evaluations
**Storage:** `memory/enterprise-telemetry/workflow-metrics.yaml`

---

## Purpose

Individual workflow telemetry (execution-observability/workflow-telemetry.md) tracks a single run's SLOs and spans. Enterprise workflow telemetry aggregates across the entire portfolio: what is the p99 latency across all feature-development workflows today? What is the gate pass rate trending over the last 7 days? Which workflow definitions are SLO-burning fastest? This layer provides the org-wide performance signal that no single-run view can give.

---

## Metric Taxonomy

```yaml
WorkflowMetrics:
  
  # Portfolio volume
  WORKFLOWS_ACTIVE:
    description: "Count of currently executing workflow runs"
    unit: count
    aggregation: GAUGE
    dimensions: [definition_id, priority, trust_tier]
  
  WORKFLOWS_STARTED:
    description: "Workflow starts per time window"
    unit: count/minute
    aggregation: RATE
    dimensions: [definition_id, priority, trigger_type]
  
  WORKFLOWS_COMPLETED:
    description: "Successful completions per time window"
    unit: count/minute
    aggregation: RATE
    dimensions: [definition_id, priority]
  
  WORKFLOWS_FAILED:
    description: "Failed runs per time window"
    unit: count/minute
    aggregation: RATE
    dimensions: [definition_id, failure_class]
  
  # Latency
  WORKFLOW_DURATION_MS:
    description: "End-to-end workflow duration"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p75, p90, p95, p99, max]
    dimensions: [definition_id, priority]
  
  QUEUE_WAIT_MS:
    description: "Time spent waiting for worker assignment"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p95, p99]
    dimensions: [definition_id]
  
  # Quality
  GATE_PASS_RATE:
    description: "Fraction of gate evaluations that pass (rolling window)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [gate_id, definition_id]
  
  GATE_CYCLES:
    description: "Average number of gate attempts before pass (rework measure)"
    unit: count
    aggregation: AVERAGE
    dimensions: [gate_id, definition_id]
  
  # SLO tracking
  SLO_COMPLIANCE_RATE:
    description: "Fraction of runs completing within SLO target duration"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440    # 24h
    dimensions: [definition_id]
  
  ERROR_BUDGET_REMAINING:
    description: "Fraction of error budget not yet consumed (0.0 = exhausted)"
    unit: ratio
    aggregation: GAUGE
    dimensions: [definition_id]
    alert_threshold: 0.20   # Alert when 80% budget consumed
  
  SLO_BURN_RATE:
    description: "Error budget consumption rate (1.0 = burning at exactly SLO-defined rate)"
    unit: ratio
    aggregation: GAUGE
    dimensions: [definition_id]
    alert_threshold: 5.0    # Alert when burning 5× faster than target
  
  # Retry and recovery
  RETRY_RATE:
    description: "Fraction of nodes that required at least one retry"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [definition_id, node_type]
  
  DEAD_LETTER_RATE:
    description: "Fraction of tasks reaching dead-letter queue (exhausted retries)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    dimensions: [definition_id]
```

---

## Aggregation Engine

```
aggregate_workflow_metrics(window_minutes=60) → WorkflowMetricSnapshot:
  
  now_ts = now()
  window_start = now_ts - timedelta(minutes=window_minutes)
  
  # Load events from enterprise event bus subscription
  events = consume_buffered_events(
    topics = ["runtime.workflow.lifecycle", "runtime.workflow.gates"],
    since = window_start
  )
  
  lifecycle_events = [e for e in events if e.topic == "runtime.workflow.lifecycle"]
  gate_events = [e for e in events if e.topic == "runtime.workflow.gates"]
  
  # --- Volume metrics ---
  active_runs = get_active_run_count()   # Live query against dag-runtime
  
  starts = count_by_field([e for e in lifecycle_events if e.event_type == "WORKFLOW_STARTED"], "definition_id")
  completions = count_by_field([e for e in lifecycle_events if e.event_type == "WORKFLOW_COMPLETED"], "definition_id")
  failures = count_by_field([e for e in lifecycle_events if e.event_type == "WORKFLOW_FAILED"], "definition_id")
  
  # --- Latency distribution ---
  completed_events = [e for e in lifecycle_events if e.event_type == "WORKFLOW_COMPLETED"]
  durations_by_definition = {}
  
  FOR e in completed_events:
    defn_id = e.payload.definition_id
    duration_ms = e.payload.duration_ms
    durations_by_definition.setdefault(defn_id, []).append(duration_ms)
  
  latency_distributions = {}
  FOR defn_id, durations in durations_by_definition.items():
    latency_distributions[defn_id] = compute_percentiles(durations, [50, 75, 90, 95, 99])
  
  # --- Gate quality ---
  passed_gates = [e for e in gate_events if e.event_type == "GATE_PASSED"]
  failed_gates = [e for e in gate_events if e.event_type == "GATE_FAILED"]
  total_gates = len(passed_gates) + len(failed_gates)
  
  gate_pass_rate = len(passed_gates) / max(total_gates, 1)
  
  gate_cycles_by_id = compute_gate_cycles(gate_events)
  
  # --- SLO tracking ---
  slo_results = compute_slo_compliance(completed_events)
  burn_rates = compute_burn_rates(slo_results)
  
  snapshot = WorkflowMetricSnapshot(
    snapshot_id = generate_uuid(),
    window_start = window_start,
    window_end = now_ts,
    active_runs = active_runs,
    starts = starts,
    completions = completions,
    failures = failures,
    latency_distributions = latency_distributions,
    gate_pass_rate = gate_pass_rate,
    gate_pass_rate_by_gate = compute_gate_rates_by_id(gate_events),
    gate_cycles = gate_cycles_by_id,
    slo_compliance_by_definition = slo_results,
    slo_burn_rates = burn_rates,
    generated_at = now_ts
  )
  
  persist_snapshot(snapshot)
  
  # Publish aggregated metrics to enterprise event bus
  enterprise_event_bus.publish(
    topic = "telemetry.metrics",
    event_type = "WORKFLOW_METRICS_SNAPSHOT",
    payload = snapshot.to_slim_dict()
  )
  
  RETURN snapshot

compute_slo_compliance(completed_events) → {definition_id: float}:
  
  by_definition = {}
  
  FOR e in completed_events:
    defn_id = e.payload.definition_id
    slo_target_ms = get_slo_target(defn_id)
    
    IF slo_target_ms:
      compliant = e.payload.duration_ms <= slo_target_ms
      by_definition.setdefault(defn_id, {"compliant": 0, "total": 0})
      by_definition[defn_id]["total"] += 1
      IF compliant:
        by_definition[defn_id]["compliant"] += 1
  
  RETURN {
    defn_id: data["compliant"] / max(data["total"], 1)
    for defn_id, data in by_definition.items()
  }

compute_burn_rates(slo_results) → {definition_id: float}:
  # Burn rate = actual error rate / target error rate
  # target error rate = 1 - SLO target (e.g., for 99% SLO, target error rate = 0.01)
  
  burn_rates = {}
  
  FOR defn_id, compliance_rate in slo_results.items():
    slo_target = get_slo_compliance_target(defn_id)   # e.g., 0.99
    target_error_rate = 1.0 - slo_target
    actual_error_rate = 1.0 - compliance_rate
    
    IF target_error_rate > 0:
      burn_rates[defn_id] = actual_error_rate / target_error_rate
    ELSE:
      burn_rates[defn_id] = 0.0
  
  RETURN burn_rates
```

---

## Metric Retention

```yaml
RetentionPolicy:
  raw_events: 7_days
  1min_snapshots: 3_days
  5min_aggregates: 14_days
  1hour_rollups: 90_days
  1day_rollups: 365_days
```

---

## Integration

**Called by:**
- `enterprise-telemetry/telemetry-subscriptions.md` — subscription receives lifecycle and gate events
- `operational-command-center/runtime-dashboards.md` — queries latest snapshot
- `workflow-monitoring/operational-health-scorer.md` — inputs to health scoring

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes metric snapshots
- `orchestration-dags/dag-runtime.md` — queries active run counts

**Writes to:** `memory/enterprise-telemetry/workflow-metrics.yaml`
