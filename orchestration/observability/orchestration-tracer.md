# Orchestration Tracer

**System ID:** `orchestration-tracer`
**Role:** Assembles full distributed traces across the orchestration layer — from the initial routing decision through agent invocations, tool calls, sub-agent delegations, and downstream system calls; builds a complete call tree for any orchestration sequence and identifies which hops in the chain are contributing most to end-to-end latency
**Storage:** `memory/orchestration-observability/orchestration-traces.yaml`

---

## Purpose

The execution tracer (execution-observability/execution-tracer.md) tracks spans within a single workflow run. The orchestration tracer tracks the full call graph that happens above the workflow: how did the master orchestrator route this intent? Which agents were invoked? Who spawned sub-agents? Which tool calls happened? How long did each hop take? When an orchestration decision produces a slow or incorrect result, the orchestration tracer shows exactly which hop in the chain is responsible.

---

## Orchestration Span Types

```yaml
OrchestrationSpanTypes:
  
  ROUTING_DECISION:
    description: "Master orchestrator intent classification and agent selection"
    captures: [intent_raw, intent_classified, candidate_agents, selected_agent, selection_reason, routing_latency_ms]
    parent_span: null                      # Root span for all orchestrations
  
  AGENT_INVOCATION:
    description: "Invocation of a specific agent (orchestrator or specialist)"
    captures: [agent_id, trust_tier, authority_level, input_hash, output_hash, duration_ms]
    parent_span: ROUTING_DECISION | DELEGATION
  
  TOOL_CALL:
    description: "Agent executing a tool (Read, Write, Bash, WebSearch, Agent, etc.)"
    captures: [tool_name, tool_category, intent_class, input_summary, output_summary, duration_ms, approved_by]
    parent_span: AGENT_INVOCATION
  
  DELEGATION:
    description: "Agent delegating to a sub-agent (spawning an Agent tool call)"
    captures: [parent_agent_id, child_agent_id, delegation_reason, depth, context_passed_tokens]
    parent_span: AGENT_INVOCATION
  
  FIREWALL_INSPECTION:
    description: "Semantic firewall inspection of agent input or output"
    captures: [decision, threats_detected, duration_ms]
    parent_span: AGENT_INVOCATION
  
  GOVERNANCE_CALL:
    description: "Call to a governance system (constitutional check, approval request, attestation)"
    captures: [governance_system, decision_type, decision_outcome, latency_ms]
    parent_span: AGENT_INVOCATION | ROUTING_DECISION
  
  HANDOFF:
    description: "Agent-to-agent artifact or context handoff"
    captures: [from_agent_id, to_agent_id, artifact_count, handoff_protocol, duration_ms]
    parent_span: DELEGATION | AGENT_INVOCATION
```

---

## Orchestration Trace Schema

```yaml
OrchestrationTrace:
  trace_id: string
  
  # Root routing event
  root_span_id: string
  intent_summary: string
  routing_decision: RoutingDecisionSpan
  
  # Full span tree
  spans: [OrchestrationSpan]
  
  # Timing
  started_at: datetime
  ended_at: datetime | null
  total_duration_ms: float | null
  
  # Analysis
  critical_path: [string]          # Span IDs on the critical path
  longest_hop_ms: float
  longest_hop_span_id: string
  total_hops: integer
  delegation_depth: integer        # Max depth of delegation chain
  governance_overhead_ms: float    # Time spent in governance calls
  firewall_overhead_ms: float
  
  # Outcome
  final_outcome: "COMPLETED | FAILED | BLOCKED | IN_PROGRESS"
  confidence_score: float | null

OrchestrationSpan:
  span_id: string
  parent_span_id: string | null
  span_type: string               # One of OrchestrationSpanTypes
  
  # Timing
  started_at: datetime
  ended_at: datetime | null
  duration_ms: float | null
  
  # Actor
  agent_id: string | null
  system_id: string | null
  
  # Data
  attributes: object              # Type-specific fields from OrchestrationSpanTypes
  
  # Status
  status: "OK | ERROR | BLOCKED | TIMEOUT"
  error_message: string | null
  
  # Children
  child_span_ids: [string]
```

---

## Trace Assembly

```
start_orchestration_trace(intent, routing_decision) → OrchestrationTrace:
  
  trace_id = generate_uuid()
  root_span_id = generate_uuid()
  
  root_span = OrchestrationSpan(
    span_id = root_span_id,
    parent_span_id = null,
    span_type = "ROUTING_DECISION",
    started_at = now(),
    agent_id = "master-orchestrator",
    attributes = {
      intent_raw = intent.raw_text[:200],
      intent_classified = routing_decision.classified_intent,
      candidate_agents = routing_decision.candidates,
      selected_agent = routing_decision.selected_agent,
      selection_reason = routing_decision.selection_reason
    },
    status = "OK",
    child_span_ids = []
  )
  
  trace = OrchestrationTrace(
    trace_id = trace_id,
    root_span_id = root_span_id,
    intent_summary = build_intent_summary(intent),
    routing_decision = root_span,
    spans = [root_span],
    started_at = now(),
    total_hops = 0,
    delegation_depth = 0,
    governance_overhead_ms = 0.0,
    firewall_overhead_ms = 0.0,
    final_outcome = "IN_PROGRESS"
  )
  
  persist_trace(trace)
  RETURN trace

record_agent_invocation(trace_id, parent_span_id, agent_id, agent_manifest) → str:
  
  span = OrchestrationSpan(
    span_id = generate_uuid(),
    parent_span_id = parent_span_id,
    span_type = "AGENT_INVOCATION",
    started_at = now(),
    agent_id = agent_id,
    attributes = {
      trust_tier = agent_manifest.trust_tier,
      authority_level = agent_manifest.governance.authority_level
    },
    status = "OK",
    child_span_ids = []
  )
  
  add_span_to_trace(trace_id, span, parent_span_id)
  RETURN span.span_id

record_tool_call(trace_id, parent_span_id, tool_name, intent_class, approved_by=null) → str:
  
  span = OrchestrationSpan(
    span_id = generate_uuid(),
    parent_span_id = parent_span_id,
    span_type = "TOOL_CALL",
    started_at = now(),
    attributes = {
      tool_name = tool_name,
      tool_category = TOOL_CATEGORIES.get(tool_name),
      intent_class = intent_class,
      approved_by = approved_by
    },
    status = "OK",
    child_span_ids = []
  )
  
  add_span_to_trace(trace_id, span, parent_span_id)
  RETURN span.span_id

record_delegation(trace_id, parent_span_id, parent_agent_id, child_agent_id, depth) → str:
  
  span = OrchestrationSpan(
    span_id = generate_uuid(),
    parent_span_id = parent_span_id,
    span_type = "DELEGATION",
    started_at = now(),
    agent_id = parent_agent_id,
    attributes = {
      parent_agent_id = parent_agent_id,
      child_agent_id = child_agent_id,
      depth = depth
    },
    status = "OK",
    child_span_ids = []
  )
  
  trace = load_trace(trace_id)
  trace.delegation_depth = max(trace.delegation_depth, depth)
  
  add_span_to_trace(trace_id, span, parent_span_id)
  RETURN span.span_id

finalize_trace(trace_id, outcome) → OrchestrationTrace:
  
  trace = load_trace(trace_id)
  trace.ended_at = now()
  trace.total_duration_ms = (trace.ended_at - trace.started_at).total_seconds() × 1000
  trace.final_outcome = outcome
  trace.total_hops = len([s for s in trace.spans if s.span_type == "AGENT_INVOCATION"])
  
  # Compute critical path (longest path from root to leaf)
  trace.critical_path = compute_critical_path(trace.spans)
  
  # Find longest hop
  completed_spans = [s for s in trace.spans if s.duration_ms is not null]
  IF completed_spans:
    longest = max(completed_spans, key=lambda s: s.duration_ms)
    trace.longest_hop_ms = longest.duration_ms
    trace.longest_hop_span_id = longest.span_id
  
  # Compute governance overhead
  gov_spans = [s for s in trace.spans if s.span_type == "GOVERNANCE_CALL" and s.duration_ms]
  trace.governance_overhead_ms = sum(s.duration_ms for s in gov_spans)
  
  firewall_spans = [s for s in trace.spans if s.span_type == "FIREWALL_INSPECTION" and s.duration_ms]
  trace.firewall_overhead_ms = sum(s.duration_ms for s in firewall_spans)
  
  persist_trace(trace)
  
  enterprise_event_bus.publish(
    topic = "telemetry.metrics",
    event_type = "ORCHESTRATION_TRACE_COMPLETE",
    payload = {
      trace_id = trace.trace_id,
      total_ms = trace.total_duration_ms,
      hops = trace.total_hops,
      depth = trace.delegation_depth,
      governance_overhead_ms = trace.governance_overhead_ms
    }
  )
  
  RETURN trace

compute_critical_path(spans) → [str]:
  # Longest path from root to any leaf by duration
  span_by_id = {s.span_id: s for s in spans}
  
  def path_duration(span_id, memo={}):
    IF span_id in memo: RETURN memo[span_id]
    span = span_by_id.get(span_id)
    IF span is null: RETURN 0, []
    own_duration = span.duration_ms or 0
    IF NOT span.child_span_ids:
      memo[span_id] = (own_duration, [span_id])
      RETURN memo[span_id]
    child_results = [path_duration(cid) for cid in span.child_span_ids]
    best_child = max(child_results, key=lambda r: r[0])
    result = (own_duration + best_child[0], [span_id] + best_child[1])
    memo[span_id] = result
    RETURN result
  
  IF NOT spans: RETURN []
  root = next((s for s in spans if s.parent_span_id is null), null)
  IF root is null: RETURN []
  
  _, path = path_duration(root.span_id)
  RETURN path
```

---

## Integration

**Called by:**
- Master orchestrator — starts and records spans during orchestration
- All agent invocations that need trace recording
- `orchestration-observability/coordination-monitor.md` — trace analysis inputs

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes trace completion events

**Writes to:** `memory/orchestration-observability/orchestration-traces.yaml`
