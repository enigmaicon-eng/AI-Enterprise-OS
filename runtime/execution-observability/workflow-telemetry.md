# Workflow Telemetry

**System ID:** `workflow-telemetry`
**Role:** Collects, aggregates, and serves workflow execution metrics — throughput, latency distributions, error rates, queue depths, worker utilization, gate pass rates, and SLI/SLO tracking; provides time-series metrics storage and the query interface for dashboards and alerting
**Storage:** `memory/execution-observability/metrics/[metric-name]-[YYYY-MM-DD].jsonl`

---

## Purpose

Traces tell you what happened in one run. Telemetry tells you what's happening across all runs. Is average workflow latency rising? Is the 95th percentile gate wait time increasing? Are worker pool utilization rates near saturation? Is the throughput SLO of 50 workflows/hour being met? Telemetry answers these questions at scale — aggregating millions of individual events into time-series metrics with defined retention, rollup, and alert semantics.

---

## Metric Taxonomy

```yaml
MetricClass:
  
  THROUGHPUT:
    - workflows_started_per_hour            # By definition_id
    - workflows_completed_per_hour
    - workflows_failed_per_hour
    - nodes_executed_per_minute             # By executor_type
    - tasks_dispatched_per_minute
  
  LATENCY:
    - workflow_duration_p50_ms              # By definition_id
    - workflow_duration_p95_ms
    - workflow_duration_p99_ms
    - node_queue_wait_p50_ms               # By executor_type
    - node_queue_wait_p95_ms
    - node_execution_p50_ms                # By executor_type
    - node_execution_p95_ms
    - gate_check_duration_p50_ms           # By gate_id
    - dispatch_latency_p95_ms
  
  ERROR_RATES:
    - workflow_failure_rate                 # failures / (completions + failures)
    - node_failure_rate                     # By executor_type
    - node_retry_rate                       # retries / total node executions
    - gate_fail_rate                        # gate failures / gate checks
    - worker_error_rate                     # By worker_id
  
  RESOURCE:
    - worker_pool_utilization               # active_workers / total_workers, by executor_type
    - task_queue_depth                      # By executor_type and priority band
    - context_budget_utilization            # avg context used / budget, by executor_type
    - work_steal_rate                       # steals per minute
  
  QUALITY:
    - gate_pass_rate_7d                     # Rolling 7-day gate pass rate, by gate_id
    - gate_pass_rate_30d
    - retry_success_rate                    # retries that eventually succeed / total retries
    - compensation_trigger_rate             # sagas requiring compensation / total sagas
  
  SLI:
    - workflow_slo_compliance_rate          # % of runs completing within SLO deadline
    - p95_latency_vs_slo                    # p95_latency / slo_target_ms
    - availability_pct                      # uptime of execution cluster
```

---

## Metric Data Point Schema

```yaml
MetricDataPoint:
  metric_name: string
  timestamp: datetime                  # Rounded to collection_interval_seconds
  
  # Dimensional labels for filtering/grouping
  labels:
    definition_id: string | null
    executor_type: string | null
    worker_id: string | null
    gate_id: string | null
    priority_band: string | null
  
  # Value representation (by metric type)
  value:
    count: integer | null              # For throughput/rate metrics
    sum: float | null                  # For latency sum
    histogram:                         # For latency distributions
      buckets:                         # Cumulative counts per bucket
        - upper_bound_ms: float
          count: integer
      p50: float | null
      p75: float | null
      p90: float | null
      p95: float | null
      p99: float | null
    gauge: float | null                # For point-in-time values (queue depth, utilization)
```

---

## Collection Pipeline

```
# Event-driven collection: ingest events, update running aggregates

on_workflow_event(event):
  
  MATCH event.event_type:
    
    CASE "WORKFLOW_STARTED":
      increment_counter("workflows_started_per_hour",
                        labels={definition_id: event.payload.definition_id})
    
    CASE "WORKFLOW_COMPLETED":
      increment_counter("workflows_completed_per_hour",
                        labels={definition_id: event.payload.definition_id})
      
      duration_ms = (event.timestamp - event.payload.started_at).total_ms
      record_histogram("workflow_duration_ms",
                       value=duration_ms,
                       labels={definition_id: event.payload.definition_id})
      
      # SLO tracking
      slo = get_slo_target(event.payload.definition_id)
      IF slo:
        compliant = duration_ms <= slo.target_duration_ms
        record_slo_observation("workflow_slo_compliance_rate",
                               compliant=compliant,
                               labels={definition_id: event.payload.definition_id})
    
    CASE "WORKFLOW_FAILED":
      increment_counter("workflows_failed_per_hour",
                        labels={definition_id: event.payload.definition_id})
      update_error_rate("workflow_failure_rate",
                        labels={definition_id: event.payload.definition_id})
    
    CASE "NODE_DISPATCHED":
      record_gauge("node_queue_wait_ms",
                   value=(event.timestamp - event.payload.queued_at).total_ms,
                   labels={executor_type: event.payload.executor_type})
    
    CASE "NODE_SUCCEEDED":
      increment_counter("nodes_executed_per_minute",
                        labels={executor_type: event.payload.executor_type})
      record_histogram("node_execution_ms",
                       value=event.payload.execution_ms,
                       labels={executor_type: event.payload.executor_type})
    
    CASE "NODE_FAILED":
      update_error_rate("node_failure_rate",
                        labels={executor_type: event.payload.executor_type})
    
    CASE "NODE_RETRIED":
      increment_counter("node_retry_count",
                        labels={executor_type: event.payload.executor_type})

# Periodic gauge collection (every 60s):
collect_gauges():
  
  FOR each executor_type in worker_orchestration.get_executor_types():
    pool = worker_orchestration.get_pool_status(executor_type)
    record_gauge("worker_pool_utilization",
                 value=pool.active / pool.total if pool.total > 0 else 0,
                 labels={executor_type: executor_type})
  
  FOR each executor_type in task_queue.get_executor_types():
    FOR each priority_band in ["CRITICAL", "HIGH", "NORMAL", "LOW", "BACKGROUND"]:
      depth = task_queue.get_queue_depth(executor_type, priority_band)
      record_gauge("task_queue_depth",
                   value=depth,
                   labels={executor_type: executor_type, priority_band: priority_band})
  
  # Compute gate pass rates (rolling windows)
  FOR each gate_id in gate_registry.list_gates():
    stats = compute_gate_pass_rate(gate_id, window_days=7)
    record_gauge("gate_pass_rate_7d",
                 value=stats.pass_rate,
                 labels={gate_id: gate_id})
```

---

## SLI / SLO Definitions

```yaml
SLODefinition:
  slo_id: string
  name: string
  workflow_definition_id: string | null    # Null = applies to all workflows
  
  sli:
    metric: string                         # Which metric is the SLI
    good_condition: string                 # What counts as "good"
  
  objective:
    target_pct: float                      # e.g., 0.99 = 99% of requests must be good
    window_days: integer                   # Rolling window
  
  error_budget:
    total_allowed_bad_requests: integer    # Computed from target_pct × volume
    burned: integer                        # How many bad requests used so far
    burn_rate: float                       # Current rate vs budget
    projected_exhaustion_at: datetime | null

# Standard SLOs
standard_slos:
  
  - slo_id: "workflow-latency-slo"
    name: "Workflow p95 latency"
    sli:
      metric: workflow_duration_p95_ms
      good_condition: "value <= slo_target_ms"
    objective:
      target_pct: 0.95
      window_days: 30
  
  - slo_id: "gate-availability-slo"
    name: "Gate check availability"
    sli:
      metric: gate_error_rate
      good_condition: "value < 0.01"
    objective:
      target_pct: 0.999
      window_days: 30
  
  - slo_id: "execution-success-slo"
    name: "Workflow success rate"
    sli:
      metric: workflow_failure_rate
      good_condition: "value < 0.05"
    objective:
      target_pct: 0.95
      window_days: 7
```

---

## Metric Query API

```
query_metric(metric_name, labels={}, start_time, end_time, resolution_minutes=5) → [MetricDataPoint]:
  # Returns time-series data for the specified metric and time range
  RETURN read_metric_series(metric_name, labels, start_time, end_time, resolution_minutes)

get_current_value(metric_name, labels={}) → float:
  # Returns the most recent value for point-in-time gauges
  RETURN latest_metric_value(metric_name, labels)

get_histogram_percentile(metric_name, percentile, labels={}, window_minutes=60) → float:
  # Compute percentile from histogram buckets over the last window
  points = query_metric(metric_name, labels, now()-window_minutes, now())
  RETURN compute_percentile_from_histogram_buckets(points, percentile)

get_slo_status(slo_id) → SLOStatus:
  slo = load_slo(slo_id)
  current_compliance = compute_compliance(slo, window=slo.objective.window_days)
  RETURN SLOStatus(
    slo_id = slo_id,
    target_pct = slo.objective.target_pct,
    current_pct = current_compliance,
    in_compliance = current_compliance >= slo.objective.target_pct,
    error_budget = compute_error_budget(slo)
  )

get_all_slo_statuses() → [SLOStatus]:
  RETURN [get_slo_status(slo.slo_id) for slo in load_all_slos()]
```

---

## Rollup and Retention

```
# Metric rollup: higher-resolution data rolls into lower-resolution summaries

rollup_policy:
  raw_1min:   retain_days: 3
  5min_agg:   retain_days: 14    # Roll up after 3 days
  1hour_agg:  retain_days: 90    # Roll up after 14 days
  1day_agg:   retain_days: 365   # Roll up after 90 days

perform_rollup(metric_name, from_resolution, to_resolution):
  # Aggregate N raw points into one rolled-up point
  # Histograms: merge buckets; counts: sum; gauges: last-value
  raw_points = load_raw_points(metric_name, from_resolution)
  rolled = aggregate_points(raw_points, to_resolution)
  write_rolled_points(metric_name, to_resolution, rolled)
  IF older_than_retention(from_resolution):
    delete_raw_points(metric_name, from_resolution, older_than=retention_cutoff)
```

---

## Integration

**Called by:** Nothing (self-driven via event bus subscription + periodic gauge collection)

**Subscribes to:** All topics via `orchestration-subscriptions.md`

**Calls:**
- `distributed-execution/worker-orchestration.md` — queries pool status for gauge collection
- `distributed-execution/task-queue.md` — queries queue depth for gauge collection

**Reads from:** `memory/execution-observability/metrics/` — time-series metric files

**Writes to:** `memory/execution-observability/metrics/[metric-name]-[YYYY-MM-DD].jsonl`

**Output consumed by:**
- `execution-observability/orchestration-monitor.md` — reads metrics for dashboard display
- `execution-observability/runtime-heatmaps.md` — reads metrics for heatmap data
- `execution-observability/bottleneck-analyzer.md` — reads latency/queue metrics for analysis
- `digital-twins/runtime-twin.md` — reads utilization metrics for twin state updates
