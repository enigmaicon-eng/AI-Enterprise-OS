# Execution Tracer

**System ID:** `execution-tracer`
**Role:** Implements distributed tracing across all workflow executions — creates span trees from event bus events, propagates trace context across node boundaries, correlates spans into complete execution traces, and provides the trace query interface for debugging, performance analysis, and SLA verification
**Storage:** `memory/execution-observability/traces/[trace-id].jsonl` + `memory/execution-observability/trace-index.yaml`

---

## Purpose

A workflow executing across dozens of nodes, multiple workers, sub-workflows, and external tool calls is opaque without tracing. When a workflow takes 47 minutes instead of 12, you need to know which node was the bottleneck, how long each gate check waited, and what retry sequences occurred. The execution tracer builds a complete causal tree of every workflow run — span by span — by consuming all events from the event bus and assembling them into queryable traces without instrumenting the producers directly.

---

## Trace and Span Model

```yaml
Trace:
  trace_id: string                     # = run_id for top-level workflows
  correlation_id: string               # Shared across all events in a causal chain
  
  root_span_id: string
  definition_id: string
  definition_version: integer
  
  started_at: datetime
  completed_at: datetime | null
  duration_ms: float | null
  
  status: "IN_PROGRESS | COMPLETED | FAILED | CANCELLED"
  
  # Span tree (parent → children)
  spans: {span_id: Span}
  root_span_id: string
  
  # Indexed for fast lookup
  node_span_index: {node_id: span_id}
  
  # Aggregate metrics
  metrics:
    total_spans: integer
    critical_path_ms: float
    total_wait_ms: float               # Time spans spent PENDING (waiting for deps)
    total_execute_ms: float            # Time spans spent RUNNING
    retry_count: integer
    gate_count: integer
    gate_wait_total_ms: float

Span:
  span_id: string                      # uuid
  trace_id: string
  parent_span_id: string | null        # Null for root span
  
  span_type: "WORKFLOW | NODE | GATE | AGENT_INVOCATION | SUBWORKFLOW | RETRY | COMPENSATION"
  
  # Identity
  name: string                         # e.g., "run:analyze-sprint-results / node:extract-metrics"
  node_id: string | null
  run_id: string
  worker_id: string | null
  executor_type: string | null
  
  # Timing
  started_at: datetime
  ended_at: datetime | null
  duration_ms: float | null
  
  # State transitions (ordered)
  events:
    - event_type: string               # e.g., "READY", "DISPATCHED", "RUNNING", "SUCCEEDED"
      timestamp: datetime
      detail: any | null
  
  # Timing breakdown
  timing:
    queued_at: datetime | null         # When node became READY
    dispatched_at: datetime | null     # When sent to worker
    started_at: datetime | null        # When worker began execution
    ended_at: datetime | null          # When worker reported result
    queue_wait_ms: float | null        # dispatched_at - queued_at
    dispatch_latency_ms: float | null  # started_at - dispatched_at
    execution_ms: float | null         # ended_at - started_at
  
  status: "PENDING | RUNNING | SUCCEEDED | FAILED | SKIPPED | CANCELLED"
  error: string | null
  
  # Baggage (propagated through child spans)
  baggage:
    workflow_priority: string
    risk_level: string
    correlation_id: string
  
  # Tags for filtering
  tags: {string: string}
  
  # Child span IDs (built incrementally)
  child_span_ids: [string]
```

---

## Event Ingestion — Span Assembly

```
# Runs as a subscriber to all event bus topics

ingest_event(event):
  
  trace_id = resolve_trace_id(event)
  span_id = resolve_span_id(event)
  
  trace = load_or_create_trace(trace_id, event)
  
  MATCH event.event_type:
    
    CASE "WORKFLOW_STARTED":
      span = create_span(
        span_id = generate_span_id(event.source_run_id),
        trace_id = trace_id,
        parent_span_id = event.payload.parent_run_id and span_for_run(event.payload.parent_run_id),
        span_type = "WORKFLOW",
        name = f"workflow:{event.payload.definition_id}",
        run_id = event.source_run_id,
        started_at = event.timestamp
      )
      trace.root_span_id = span.span_id
      add_span_event(span, "STARTED", event.timestamp)
    
    CASE "NODE_READY":
      span = get_or_create_node_span(trace, event.payload.node_id, event.source_run_id)
      span.timing.queued_at = event.timestamp
      add_span_event(span, "READY", event.timestamp)
    
    CASE "NODE_DISPATCHED":
      span = get_node_span(trace, event.payload.node_id)
      span.timing.dispatched_at = event.timestamp
      span.worker_id = event.payload.worker_id
      add_span_event(span, "DISPATCHED", event.timestamp, {worker_id: event.payload.worker_id})
      compute_queue_wait(span)
    
    CASE "NODE_STARTED":
      span = get_node_span(trace, event.payload.node_id)
      span.timing.started_at = event.timestamp
      span.status = "RUNNING"
      add_span_event(span, "RUNNING", event.timestamp)
      compute_dispatch_latency(span)
    
    CASE "NODE_SUCCEEDED":
      span = get_node_span(trace, event.payload.node_id)
      span.timing.ended_at = event.timestamp
      span.status = "SUCCEEDED"
      add_span_event(span, "SUCCEEDED", event.timestamp)
      compute_execution_ms(span)
    
    CASE "NODE_FAILED":
      span = get_node_span(trace, event.payload.node_id)
      span.timing.ended_at = event.timestamp
      span.status = "FAILED"
      span.error = event.payload.error
      add_span_event(span, "FAILED", event.timestamp, {error: event.payload.error})
    
    CASE "NODE_RETRIED":
      parent_span = get_node_span(trace, event.payload.node_id)
      retry_span = create_span(
        span_type = "RETRY",
        parent_span_id = parent_span.span_id,
        name = f"retry:{event.payload.node_id}:attempt-{event.payload.attempt}",
        started_at = event.timestamp
      )
      trace.metrics.retry_count += 1
    
    CASE "NODE_SKIPPED":
      span = get_node_span(trace, event.payload.node_id)
      span.status = "SKIPPED"
      add_span_event(span, "SKIPPED", event.timestamp)
    
    CASE "WORKFLOW_COMPLETED" | "WORKFLOW_FAILED" | "WORKFLOW_CANCELLED":
      root_span = trace.spans[trace.root_span_id]
      root_span.ended_at = event.timestamp
      root_span.status = map_status(event.event_type)
      trace.status = map_trace_status(event.event_type)
      trace.completed_at = event.timestamp
      compute_trace_metrics(trace)
    
    CASE "GATE_CHECK_STARTED":
      gate_span = create_span(
        span_type = "GATE",
        parent_span_id = get_node_span(trace, event.payload.node_id).span_id,
        name = f"gate:{event.payload.gate_id}",
        started_at = event.timestamp
      )
      trace.metrics.gate_count += 1
    
    CASE "SUBWORKFLOW_SPAWNED":
      # Create a child trace linked to this span
      create_child_trace(parent_trace=trace, child_run_id=event.payload.child_run_id)
  
  persist_trace(trace)
```

---

## Critical Path Extraction

```
extract_critical_path(trace) → CriticalPathResult:
  
  # Build timing graph from spans
  # Edge weight = execution_ms of the FROM span
  
  timing_graph = {}
  FOR each span in trace.spans.values():
    IF span.span_type == "NODE" AND span.status == "SUCCEEDED":
      successors = [get_node_span(trace, child_id) for child_id in get_child_node_ids(span)]
      timing_graph[span.span_id] = {
        duration_ms: span.timing.execution_ms + span.timing.queue_wait_ms,
        successors: [s.span_id for s in successors]
      }
  
  # Longest path from root to any leaf = critical path
  critical_path_spans = longest_path(timing_graph, trace.root_span_id)
  
  RETURN CriticalPathResult(
    span_ids = critical_path_spans,
    total_duration_ms = SUM(timing_graph[s].duration_ms for s in critical_path_spans),
    bottleneck_span = MAX(critical_path_spans, key=lambda s: timing_graph[s].duration_ms)
  )
```

---

## Trace Query API

```
get_trace(trace_id) → Trace:
  RETURN load_trace(trace_id)

get_span(trace_id, span_id) → Span:
  RETURN load_trace(trace_id).spans[span_id]

search_traces(filters) → [TraceHeader]:
  # Filters: definition_id, status, started_after, started_before, min_duration_ms, worker_id
  RETURN query_trace_index(filters)

get_slow_spans(trace_id, percentile=0.95) → [Span]:
  trace = load_trace(trace_id)
  all_durations = [s.timing.execution_ms for s in trace.spans.values() WHERE s.timing.execution_ms]
  threshold = percentile_value(all_durations, percentile)
  RETURN [s for s in trace.spans.values() WHERE s.timing.execution_ms >= threshold]

compare_traces(trace_id_a, trace_id_b) → TraceComparison:
  # Compare two runs of the same workflow — node-by-node timing delta
  a = load_trace(trace_id_a)
  b = load_trace(trace_id_b)
  
  node_delta = {}
  FOR node_id in set(a.node_span_index.keys()) | set(b.node_span_index.keys()):
    span_a = get_node_span_by_id(a, node_id)
    span_b = get_node_span_by_id(b, node_id)
    node_delta[node_id] = {
      execution_ms_delta: (span_b.timing.execution_ms or 0) - (span_a.timing.execution_ms or 0),
      queue_wait_ms_delta: (span_b.timing.queue_wait_ms or 0) - (span_a.timing.queue_wait_ms or 0)
    }
  
  RETURN TraceComparison(
    trace_a_duration_ms = a.metrics.critical_path_ms,
    trace_b_duration_ms = b.metrics.critical_path_ms,
    duration_delta_ms = b.metrics.critical_path_ms - a.metrics.critical_path_ms,
    node_deltas = node_delta
  )
```

---

## Integration

**Called by:** Nobody — self-driven via event bus subscription (`orchestration-subscriptions.md` registers the subscription)

**Subscribes to:** `workflow.events`, `gate.verdicts`, `agent.invocations`, `escalations` via `orchestration-subscriptions.md`

**Calls:** Nothing (pure consumer; writes traces)

**Reads from:** `memory/execution-observability/traces/[trace-id].jsonl`

**Writes to:**
- `memory/execution-observability/traces/[trace-id].jsonl` — complete span event log per trace
- `memory/execution-observability/trace-index.yaml` — searchable trace index

**Output consumed by:**
- `execution-observability/bottleneck-analyzer.md` — queries traces for execution timing data
- `execution-observability/runtime-heatmaps.md` — queries span timing for heatmap generation
- `execution-observability/orchestration-monitor.md` — displays active traces
