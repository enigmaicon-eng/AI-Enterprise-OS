# Bottleneck Analyzer

**System ID:** `bottleneck-analyzer`
**Role:** Identifies execution bottlenecks in real-time and historically — combines critical path analysis from traces, queuing theory modeling, executor saturation metrics, and compound pattern detection to classify, score, and explain bottlenecks; produces actionable diagnosis reports with root cause and recommended interventions
**Storage:** `memory/execution-observability/bottleneck-reports/[report-id].yaml`

---

## Purpose

A bottleneck is any constraint that limits the throughput or latency of the execution system. It may be a specific workflow node that consistently takes 10× longer than its peers, a saturated executor pool that queues work for 20 minutes before dispatch, a gate check that rejects 40% of submissions requiring rework cycles, or a dependency cycle that forces sequential execution of work that could be parallel. The bottleneck analyzer synthesizes observations from traces, telemetry, and queue models into a diagnostic output that tells operators not just that something is slow, but what specifically is slow, why, how bad it is, and what to do about it.

---

## Bottleneck Classification

```yaml
BottleneckClass:
  
  CAPACITY:
    description: "Worker pool insufficient for demand"
    detection_signals:
      - worker_pool_utilization > 0.85 sustained
      - queue_depth rising over time
      - queue_wait_p95 >> dispatch_latency_p95
    root_causes: ["Under-provisioned worker pool", "Traffic spike", "Worker failures reducing capacity"]
  
  CRITICAL_PATH_NODE:
    description: "A specific node dominates workflow duration"
    detection_signals:
      - node appears on critical path in > 80% of runs
      - node p95 execution >> workflow p95 / critical_path_length
    root_causes: ["Slow executor", "Large input payload", "External dependency latency"]
  
  GATE:
    description: "Gate check failures causing rework cycles"
    detection_signals:
      - gate_fail_rate > 0.25
      - high gate_wait_total_ms in traces
      - retry count correlated with gate failures
    root_causes: ["Quality issues upstream", "Gate criteria too strict", "Missing pre-gate checks"]
  
  QUEUE_STARVATION:
    description: "Low-priority work never gets processed"
    detection_signals:
      - BACKGROUND / LOW queue depth growing
      - CRITICAL / HIGH queues draining but lower bands not
    root_causes: ["Priority imbalance", "Fairness limiter misconfigured", "Insufficient workers for lower bands"]
  
  DEPENDENCY:
    description: "Sequential dependency chains where parallelism was possible"
    detection_signals:
      - critical_path much longer than longest individual node
      - many nodes with zero float in traces
      - parallel degree << theoretical maximum
    root_causes: ["Unnecessarily tight dependency edges", "Missing fan-out patterns", "Suboptimal DAG structure"]
  
  CONTEXT_BUDGET:
    description: "Agent nodes hitting context limits, causing truncation or failure"
    detection_signals:
      - context_budget_utilization > 0.90 for ai-agent executor type
      - node failures with "CONTEXT_LIMIT_EXCEEDED" error
    root_causes: ["Oversized input payloads", "Insufficient budget allocated", "Context accumulation across nodes"]
  
  CASCADING_FAILURE:
    description: "Worker failures causing retry storms"
    detection_signals:
      - node_retry_rate spike correlated with worker_error_rate spike
      - failed tasks re-queuing faster than workers can process
    root_causes: ["Shared failure mode in worker pool", "Bad external dependency", "Memory/resource exhaustion"]
  
  SUBWORKFLOW_LATENCY:
    description: "Subworkflows taking longer than parent workflow's budget"
    detection_signals:
      - subworkflow span duration >> parent's remaining slack
      - subworkflow critical path not aligned with parent's SLO
    root_causes: ["Slow child workflow", "Child workflow resource contention", "Misconfigured subworkflow timeout"]
```

---

## Bottleneck Detection — Real-Time

```
detect_realtime_bottlenecks() → [BottleneckSignal]:
  
  signals = []
  
  # 1. Capacity bottleneck
  FOR each executor_type:
    util = workflow_telemetry.get_current_value("worker_pool_utilization", {executor_type})
    queue_depth = task_queue.get_queue_depth(executor_type)
    queue_wait_p95 = workflow_telemetry.get_histogram_percentile("node_queue_wait_ms", 0.95, {executor_type})
    
    IF util > 0.85 AND queue_depth > CAPACITY_QUEUE_DEPTH_THRESHOLD:
      signals.append(BottleneckSignal(
        bottleneck_class = "CAPACITY",
        executor_type = executor_type,
        severity = severity_from_utilization(util),
        evidence = {utilization: util, queue_depth: queue_depth, queue_wait_p95: queue_wait_p95}
      ))
  
  # 2. Gate bottleneck
  FOR each gate_id:
    fail_rate = workflow_telemetry.get_current_value("gate_fail_rate", {gate_id})
    gate_wait_p95 = workflow_telemetry.get_current_value("gate_check_duration_p95_ms", {gate_id})
    
    IF fail_rate > 0.25:
      signals.append(BottleneckSignal(
        bottleneck_class = "GATE",
        gate_id = gate_id,
        severity = "CRITICAL" if fail_rate > 0.50 else "WARNING",
        evidence = {fail_rate: fail_rate, gate_wait_p95: gate_wait_p95}
      ))
  
  # 3. Context budget pressure
  context_util = workflow_telemetry.get_current_value("context_budget_utilization", {executor_type: "ai-agent"})
  IF context_util > 0.90:
    signals.append(BottleneckSignal(
      bottleneck_class = "CONTEXT_BUDGET",
      severity = "WARNING",
      evidence = {utilization: context_util}
    ))
  
  RETURN signals
```

---

## Bottleneck Analysis — Per Workflow Run (Trace-Based)

```
analyze_run_bottlenecks(run_id) → BottleneckReport:
  
  trace = execution_tracer.get_trace(run_id)
  compiled_dag = dag_compiler.get_compiled(trace.definition_id)
  
  # Critical path from trace
  critical_path = execution_tracer.extract_critical_path(trace)
  
  report = BottleneckReport(run_id=run_id, analyzed_at=now())
  
  # 1. Critical path node analysis
  critical_node_times = [
    (span_id, trace.spans[span_id].timing.execution_ms)
    for span_id in critical_path.span_ids
    if trace.spans[span_id].timing.execution_ms
  ]
  
  IF critical_node_times:
    slowest_node = MAX(critical_node_times, key=lambda x: x[1])
    total_critical_ms = SUM(t for _, t in critical_node_times)
    
    IF slowest_node[1] / total_critical_ms > 0.40:  # One node >40% of critical path
      report.bottlenecks.append(Bottleneck(
        bottleneck_class = "CRITICAL_PATH_NODE",
        span_id = slowest_node[0],
        node_id = trace.spans[slowest_node[0]].node_id,
        contribution_pct = slowest_node[1] / total_critical_ms,
        severity = "WARNING" if slowest_node[1] / total_critical_ms < 0.60 else "CRITICAL"
      ))
  
  # 2. Queue wait analysis
  total_queue_wait = SUM(s.timing.queue_wait_ms for s in trace.spans.values() if s.timing.queue_wait_ms)
  total_execution = SUM(s.timing.execution_ms for s in trace.spans.values() if s.timing.execution_ms)
  
  wait_ratio = total_queue_wait / (total_queue_wait + total_execution + 0.001)
  
  IF wait_ratio > 0.30:  # >30% of workflow time spent waiting in queue
    report.bottlenecks.append(Bottleneck(
      bottleneck_class = "CAPACITY",
      wait_ratio = wait_ratio,
      total_queue_wait_ms = total_queue_wait,
      severity = "CRITICAL" if wait_ratio > 0.50 else "WARNING"
    ))
  
  # 3. Gate failure analysis
  gate_spans = [s for s in trace.spans.values() if s.span_type == "GATE"]
  gate_failures = [s for s in gate_spans if s.status == "FAILED"]
  
  IF gate_failures:
    gate_wait_ms = SUM(s.timing.execution_ms for s in gate_spans if s.timing.execution_ms)
    report.bottlenecks.append(Bottleneck(
      bottleneck_class = "GATE",
      failed_gate_count = len(gate_failures),
      total_gate_wait_ms = gate_wait_ms,
      severity = "WARNING"
    ))
  
  # 4. Parallelism analysis
  theoretical_parallel = dag_optimizer.get_max_parallel_degree(trace.definition_id)
  actual_max_concurrent = compute_actual_max_concurrent(trace)
  parallelism_utilization = actual_max_concurrent / max(theoretical_parallel, 1)
  
  IF parallelism_utilization < 0.50:
    report.bottlenecks.append(Bottleneck(
      bottleneck_class = "DEPENDENCY",
      theoretical_parallel = theoretical_parallel,
      actual_parallel = actual_max_concurrent,
      parallelism_utilization = parallelism_utilization,
      severity = "INFO"
    ))
  
  # Compute overall bottleneck score
  report.bottleneck_score = compute_bottleneck_score(report.bottlenecks)
  report.recommendations = generate_recommendations(report.bottlenecks)
  
  RETURN report
```

---

## Historical Bottleneck Pattern Analysis

```
analyze_historical_patterns(definition_id, window_days=7) → HistoricalBottleneckReport:
  
  # Load traces for all runs of this definition in window
  traces = execution_tracer.search_traces(
    {definition_id: definition_id, started_after: now() - window_days}
  )
  
  IF len(traces) < 5:
    RETURN HistoricalBottleneckReport(insufficient_data=True)
  
  # Node execution time statistics across runs
  node_stats = defaultdict(list)
  FOR each trace in traces:
    FOR each span in trace.spans.values():
      IF span.span_type == "NODE" AND span.timing.execution_ms:
        node_stats[span.node_id].append(span.timing.execution_ms)
  
  # Identify consistently slow nodes (p95 > 2σ above mean)
  slow_nodes = []
  all_node_p95s = [compute_percentile(times, 0.95) for times in node_stats.values()]
  global_p95 = compute_percentile(all_node_p95s, 0.95)
  
  FOR node_id, times in node_stats.items():
    node_p95 = compute_percentile(times, 0.95)
    IF node_p95 > 2 × global_p95:
      slow_nodes.append({node_id: node_id, p95_ms: node_p95, sample_count: len(times)})
  
  # Frequency of each bottleneck class across runs
  bottleneck_frequency = defaultdict(int)
  FOR each trace in traces:
    run_report = analyze_run_bottlenecks(trace.trace_id)
    FOR b in run_report.bottlenecks:
      bottleneck_frequency[b.bottleneck_class] += 1
  
  RETURN HistoricalBottleneckReport(
    definition_id = definition_id,
    run_count = len(traces),
    window_days = window_days,
    consistently_slow_nodes = slow_nodes,
    bottleneck_frequency = bottleneck_frequency,
    dominant_bottleneck = MAX(bottleneck_frequency, key=bottleneck_frequency.get)
  )
```

---

## Recommendation Engine

```yaml
BottleneckRecommendation:
  bottleneck_class: string
  severity: string
  title: string
  description: string
  interventions:
    - intervention_type: "SCALE_OUT | OPTIMIZE_DAG | RETRAIN_GATE | INCREASE_BUDGET | ADJUST_RETRY | RESTRUCTURE_DEPENDENCIES"
      action: string
      expected_impact: string
      effort: "LOW | MEDIUM | HIGH"

generate_recommendations(bottlenecks) → [BottleneckRecommendation]:
  recommendations = []
  
  FOR each bottleneck in bottlenecks:
    MATCH bottleneck.bottleneck_class:
      CASE "CAPACITY":
        recommendations.append(BottleneckRecommendation(
          title = "Scale out worker pool",
          interventions = [
            {type: SCALE_OUT, action: "Add workers to the {executor_type} pool", effort: LOW},
            {type: OPTIMIZE_DAG, action: "Review if parallelism can be reduced via node fusion", effort: MEDIUM}
          ]
        ))
      CASE "GATE":
        recommendations.append(BottleneckRecommendation(
          title = "Improve pre-gate quality checks",
          interventions = [
            {type: RETRAIN_GATE, action: "Add pre-flight quality checks before gate submission", effort: MEDIUM},
            {type: ADJUST_RETRY, action: "Review gate criteria for over-strictness", effort: HIGH}
          ]
        ))
      CASE "CRITICAL_PATH_NODE":
        recommendations.append(BottleneckRecommendation(
          title = "Optimize or parallelize dominant node",
          interventions = [
            {type: OPTIMIZE_DAG, action: "Split node into parallel sub-tasks if decomposable", effort: HIGH},
            {type: SCALE_OUT, action: "Add dedicated workers for this executor type", effort: LOW}
          ]
        ))
  
  RETURN recommendations
```

---

## Bottleneck Report Schema

```yaml
BottleneckReport:
  report_id: string
  run_id: string | null
  definition_id: string | null
  analyzed_at: datetime
  analysis_type: "REAL_TIME | PER_RUN | HISTORICAL"
  
  bottlenecks:
    - bottleneck_class: string
      severity: "INFO | WARNING | CRITICAL"
      evidence: object
      affected_nodes: [string] | null
  
  bottleneck_score: float              # 0.0 (no bottleneck) to 1.0 (severe)
  
  recommendations: [BottleneckRecommendation]
  
  summary: string                      # Human-readable 1-2 sentence summary
```

---

## Integration

**Called by:**
- `execution-observability/orchestration-monitor.md` — requests real-time bottleneck detection during monitor refresh
- `digital-twins/bottleneck-predictor.md` (via `predictive-intelligence/bottleneck-predictor.md`) — uses historical bottleneck data for prediction calibration
- On-demand via operations API

**Calls:**
- `execution-observability/execution-tracer.md` — loads traces for per-run and historical analysis
- `execution-observability/workflow-telemetry.md` — reads current metric values
- `orchestration-dags/dag-compiler.md` — reads compiled DAG structure for parallelism analysis
- `orchestration-dags/dag-optimizer.md` — reads theoretical parallel degree
- `distributed-execution/task-queue.md` — reads queue depths

**Reads from:**
- `memory/execution-observability/traces/` — trace data
- `memory/execution-observability/metrics/` — telemetry data

**Writes to:** `memory/execution-observability/bottleneck-reports/[report-id].yaml`
