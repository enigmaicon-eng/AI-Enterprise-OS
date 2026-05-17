# Runtime Heatmaps

**System ID:** `runtime-heatmaps`
**Role:** Generates multi-dimensional execution heatmaps for hot path identification, bottleneck visualization, temporal pattern detection, and executor utilization maps — produces both real-time snapshot heatmaps and historical pattern heatmaps from trace and telemetry data
**Storage:** `memory/execution-observability/heatmaps/[heatmap-type]-[timestamp].yaml`

---

## Purpose

Metrics give you numbers. Traces give you individual run timelines. Heatmaps give you patterns across hundreds of runs simultaneously — showing which nodes consistently take the longest, which time-of-day windows see execution spikes, which executor types are saturated while others are idle, and which workflow definitions follow different performance regimes. A heatmap compresses many runs into a single perceptual overview that reveals structure invisible in individual traces or aggregate statistics.

---

## Heatmap Types

```yaml
HeatmapType:
  
  NODE_EXECUTION_TIME:
    description: "Per-node execution time distribution across all runs"
    dimensions:
      x_axis: node_id                  # Or executor_type for cross-workflow view
      y_axis: time_bucket              # Distribution percentile or time window
    value: execution_ms (p50, p95, p99)
  
  EXECUTOR_UTILIZATION:
    description: "Worker pool utilization over time, by executor type"
    dimensions:
      x_axis: time_bucket              # e.g., 15-minute windows over last 24h
      y_axis: executor_type
    value: utilization_pct (0.0 - 1.0)
    color_scale: green (0%) → yellow (70%) → red (90%+)
  
  QUEUE_DEPTH_TEMPORAL:
    description: "Queue depth per executor type over time"
    dimensions:
      x_axis: time_bucket
      y_axis: executor_type
    value: queue_depth
  
  WORKFLOW_LATENCY_MAP:
    description: "Workflow duration heatmap: runs × time"
    dimensions:
      x_axis: run_start_time_bucket    # When the run started
      y_axis: definition_id
    value: duration_ms
  
  NODE_FAILURE_DENSITY:
    description: "Which nodes fail most often, and when"
    dimensions:
      x_axis: time_bucket
      y_axis: node_id (or executor_type)
    value: failure_rate
  
  CRITICAL_PATH_COVERAGE:
    description: "Which nodes appear on critical paths most frequently"
    dimensions:
      x_axis: workflow definition topological position
      y_axis: node_id
    value: pct_of_runs_on_critical_path
  
  GATE_WAIT_DISTRIBUTION:
    description: "How long workflows wait at each gate"
    dimensions:
      x_axis: gate_id
      y_axis: wait_time_bucket
    value: frequency_count
```

---

## Heatmap Data Schema

```yaml
Heatmap:
  heatmap_id: string
  heatmap_type: string
  
  generated_at: datetime
  covers_window:
    start_time: datetime
    end_time: datetime
  
  # Dimensional metadata
  x_axis:
    label: string
    values: [string]                   # Ordered list of x-axis labels
    value_type: "time_bucket | node_id | executor_type | definition_id"
  
  y_axis:
    label: string
    values: [string]
    value_type: string
  
  # Cell data: x_index → y_index → cell
  cells: [[HeatmapCell]]              # Row-major: cells[y][x]
  
  # Color scale normalization
  value_range:
    min: float
    max: float
    p50: float
    p95: float
  
  # Annotations (hotspots identified automatically)
  annotations: [HeatmapAnnotation]
  
  # Summary statistics
  summary:
    hot_cells: [{x: string, y: string, value: float, severity: string}]
    cold_cells: [{x: string, y: string, value: float}]
    trend: "IMPROVING | STABLE | DEGRADING"

HeatmapCell:
  x_label: string
  y_label: string
  value: float
  sample_count: integer              # How many observations fed this cell
  confidence: "HIGH | MEDIUM | LOW"  # Based on sample_count
  normalized_value: float            # 0.0 - 1.0 relative to value_range
  color_hex: string                  # Pre-computed display color

HeatmapAnnotation:
  annotation_type: "HOTSPOT | COLDSPOT | ANOMALY | TREND_CHANGE"
  x_label: string
  y_label: string | null
  message: string
  severity: "INFO | WARNING | CRITICAL"
```

---

## Heatmap Generation — Node Execution Time

```
generate_node_execution_time_heatmap(definition_id, window_hours=24) → Heatmap:
  
  # Load traces for this workflow within the window
  traces = execution_tracer.search_traces(
    filters = {definition_id: definition_id, started_after: now() - window_hours}
  )
  
  # Collect per-node execution times
  node_times = defaultdict(list)  # node_id → [execution_ms]
  
  FOR each trace in traces:
    FOR each span in trace.spans.values():
      IF span.span_type == "NODE" AND span.timing.execution_ms:
        node_times[span.node_id].append(span.timing.execution_ms)
  
  # Sort nodes by topological order (from compiled DAG)
  compiled_dag = dag_compiler.get_compiled(definition_id)
  ordered_nodes = compiled_dag.topological_order
  
  # Build heatmap: rows = percentile buckets, columns = nodes
  percentile_buckets = ["p50", "p75", "p90", "p95", "p99", "max"]
  cells = []
  
  FOR y_idx, percentile in enumerate(percentile_buckets):
    row = []
    FOR x_idx, node_id in enumerate(ordered_nodes):
      times = node_times.get(node_id, [])
      IF times:
        value = compute_percentile(times, percentile)
        sample_count = len(times)
      ELSE:
        value = 0
        sample_count = 0
      
      row.append(HeatmapCell(
        x_label = node_id,
        y_label = percentile,
        value = value,
        sample_count = sample_count,
        confidence = "HIGH" if sample_count >= 30 else "MEDIUM" if sample_count >= 10 else "LOW"
      ))
    cells.append(row)
  
  # Compute value range for normalization
  all_values = [c.value for row in cells for c in row if c.value > 0]
  value_range = compute_range(all_values)
  
  # Normalize and color
  FOR each cell:
    cell.normalized_value = (cell.value - value_range.min) / (value_range.max - value_range.min + 0.001)
    cell.color_hex = interpolate_color(cell.normalized_value, cold="#4CAF50", mid="#FFC107", hot="#F44336")
  
  # Annotate hotspots
  annotations = detect_hotspots(cells, value_range)
  
  RETURN Heatmap(heatmap_type="NODE_EXECUTION_TIME", cells=cells, annotations=annotations)
```

---

## Heatmap Generation — Executor Utilization

```
generate_executor_utilization_heatmap(window_hours=24, bucket_minutes=15) → Heatmap:
  
  # Load utilization metrics from workflow-telemetry
  executor_types = worker_orchestration.get_executor_types()
  time_buckets = generate_time_buckets(window_hours, bucket_minutes)
  
  cells = []
  
  FOR y_idx, executor_type in enumerate(executor_types):
    row = []
    FOR x_idx, (bucket_start, bucket_end) in enumerate(time_buckets):
      
      util_values = workflow_telemetry.query_metric(
        "worker_pool_utilization",
        labels = {executor_type: executor_type},
        start_time = bucket_start,
        end_time = bucket_end
      )
      
      avg_util = MEAN(p.value.gauge for p in util_values) if util_values else 0
      
      row.append(HeatmapCell(
        x_label = format_time_bucket(bucket_start),
        y_label = executor_type,
        value = avg_util,
        normalized_value = avg_util,  # Already 0.0-1.0
        color_hex = utilization_color(avg_util)  # green→yellow→red
      ))
    cells.append(row)
  
  # Detect saturation periods (sustained >0.85 utilization)
  annotations = detect_saturation_periods(cells, threshold=0.85, sustained_buckets=4)
  
  RETURN Heatmap(heatmap_type="EXECUTOR_UTILIZATION", cells=cells, annotations=annotations)

utilization_color(util):
  IF util < 0.50: RETURN "#4CAF50"    # Green
  IF util < 0.70: RETURN "#8BC34A"    # Light green
  IF util < 0.80: RETURN "#FFC107"    # Amber
  IF util < 0.90: RETURN "#FF9800"    # Orange
  RETURN "#F44336"                     # Red
```

---

## Hotspot Detection

```
detect_hotspots(cells, value_range) → [HeatmapAnnotation]:
  annotations = []
  
  p95_threshold = value_range.p95
  
  FOR each cell in flatten(cells):
    IF cell.value >= p95_threshold AND cell.confidence in ["HIGH", "MEDIUM"]:
      annotations.append(HeatmapAnnotation(
        annotation_type = "HOTSPOT",
        x_label = cell.x_label,
        y_label = cell.y_label,
        message = f"{cell.x_label} at {cell.y_label}: {cell.value:.0f}ms (p95 threshold: {p95_threshold:.0f}ms)",
        severity = "CRITICAL" if cell.normalized_value > 0.95 else "WARNING"
      ))
  
  RETURN annotations

detect_saturation_periods(cells, threshold, sustained_buckets) → [HeatmapAnnotation]:
  annotations = []
  
  FOR y_idx, row in enumerate(cells):
    consecutive = 0
    FOR x_idx, cell in enumerate(row):
      IF cell.value >= threshold:
        consecutive += 1
        IF consecutive >= sustained_buckets:
          annotations.append(HeatmapAnnotation(
            annotation_type = "HOTSPOT",
            x_label = cell.x_label,
            y_label = cell.y_label,
            message = f"{cell.y_label}: sustained saturation {consecutive} × {bucket_minutes}min periods",
            severity = "CRITICAL"
          ))
      ELSE:
        consecutive = 0
  
  RETURN annotations
```

---

## Integration

**Called by:** `execution-observability/orchestration-monitor.md` — requests heatmap generation for dashboard display; also invoked on-demand via operations API

**Calls:**
- `execution-observability/execution-tracer.md` — loads traces for node timing data
- `execution-observability/workflow-telemetry.md` — queries metric time-series data
- `orchestration-dags/dag-compiler.md` — reads topological order for node sorting
- `distributed-execution/worker-orchestration.md` — queries executor type list

**Reads from:**
- `memory/execution-observability/traces/` — trace span data
- `memory/execution-observability/metrics/` — telemetry time-series

**Writes to:** `memory/execution-observability/heatmaps/[heatmap-type]-[timestamp].yaml`
