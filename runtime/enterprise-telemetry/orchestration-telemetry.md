# Orchestration Telemetry

**System ID:** `orchestration-telemetry`
**Role:** Collects and aggregates enterprise-wide orchestration performance metrics — tracks agent routing accuracy, delegation chain depths, trust score distributions, authority utilization, handoff quality, and coordination efficiency across all orchestration activity
**Storage:** `memory/enterprise-telemetry/orchestration-metrics.yaml`

---

## Purpose

Orchestration health is not visible from single-agent logs. It emerges from patterns across the entire agent network: Are trust scores clustered at the bottom of their tier or uniformly distributed? Are delegation chains deepening over time, indicating routing inefficiency? Are handoff failures concentrated in specific agent pairs? Orchestration telemetry aggregates these patterns enterprise-wide, giving the operations center the signal to identify routing bottlenecks, authority mismatches, and coordination failures before they cascade.

---

## Orchestration Metric Taxonomy

```yaml
OrchestrationMetrics:
  
  # Agent routing performance
  ROUTING_ACCURACY:
    description: "Fraction of agent routings that match the task's required capability profile"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.90

  ROUTING_LATENCY_MS:
    description: "Time from routing request to agent assignment"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99]

  ROUTING_FALLBACK_RATE:
    description: "Fraction of routings that required fallback to secondary agents"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.15    # > 15% fallback rate indicates routing issues

  # Trust and authority
  TRUST_SCORE_DISTRIBUTION:
    description: "Distribution of workflow confidence scores at execution time"
    unit: histogram
    aggregation: HISTOGRAM
    percentiles: [p10, p25, p50, p75, p90]
    dimensions: [workflow_definition_id, trust_tier]

  TRUST_DISQUALIFIER_RATE:
    description: "Fraction of workflows where confidence disqualifiers activated (hard-capped to 0.20)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    alert_threshold: 0.05

  AUTHORITY_UTILIZATION:
    description: "How often authority levels are fully exercised (T5 approvals, T4 policy decisions)"
    unit: count
    aggregation: COUNTER
    dimensions: [authority_level, action_type]

  AUTHORITY_MISMATCH_RATE:
    description: "Fraction of approval attempts rejected for insufficient authority"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.05

  # Delegation
  DELEGATION_CHAIN_DEPTH:
    description: "Average and max delegation depth across active orchestrations"
    unit: count
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99, max]
    max_alert_threshold: 5    # Chains deeper than 5 indicate routing inefficiency

  DELEGATION_SUCCESS_RATE:
    description: "Fraction of delegations that complete successfully"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.95

  CIRCULAR_DELEGATION_COUNT:
    description: "Count of circular delegation attempts detected and blocked"
    unit: count
    aggregation: COUNTER
    alert_on_any: true

  # Handoff quality
  HANDOFF_SUCCESS_RATE:
    description: "Fraction of agent-to-agent handoffs completed without artifact loss"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.98

  HANDOFF_LATENCY_MS:
    description: "Time for artifact transfer between agents"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p95, p99]

  HANDOFF_RETRY_RATE:
    description: "Fraction of handoffs requiring retry"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60

  # Coordination efficiency
  COORDINATION_OVERHEAD_RATIO:
    description: "Fraction of total workflow time spent on coordination vs actual work"
    unit: ratio
    aggregation: AVERAGE
    dimensions: [workflow_definition_id]
    alert_threshold: 0.30    # > 30% overhead indicates coordination inefficiency

  INTER_AGENT_COMMUNICATION_LATENCY_MS:
    description: "Latency of communications between orchestrator and subagents"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p95, p99]
    dimensions: [orchestrator_tier, subagent_tier]
```

---

## Metric Collection

```
collect_orchestration_metrics(window_minutes=60) → OrchestrationMetricSnapshot:
  
  window_start = now() - timedelta(minutes=window_minutes)
  
  trust_events = consume_buffered_events(topic="runtime.trust.signals", since=window_start)
  lifecycle_events = consume_buffered_events(topic="runtime.workflow.lifecycle", since=window_start)
  agent_events = consume_buffered_events(topic="org.agent.lifecycle", since=window_start)
  
  # --- Routing metrics ---
  routing_events = [e for e in lifecycle_events if e.event_type in ["AGENT_ROUTED", "ROUTING_FALLBACK", "ROUTING_FAILED"]]
  
  total_routings = len([e for e in routing_events if e.event_type == "AGENT_ROUTED"])
  fallbacks = len([e for e in routing_events if e.event_type == "ROUTING_FALLBACK"])
  routing_failures = len([e for e in routing_events if e.event_type == "ROUTING_FAILED"])
  
  routing_fallback_rate = fallbacks / max(total_routings, 1)
  routing_accuracy = (total_routings - routing_failures) / max(total_routings, 1)
  
  routing_latencies = [e.payload.routing_latency_ms for e in routing_events if e.payload.get("routing_latency_ms")]
  
  # --- Trust and confidence ---
  confidence_events = [e for e in trust_events if e.event_type == "CONFIDENCE_SCORED"]
  confidence_scores = [e.payload.composite_score for e in confidence_events]
  
  disqualifier_events = [e for e in trust_events if e.event_type == "CONFIDENCE_DISQUALIFIED"]
  disqualifier_rate = len(disqualifier_events) / max(len(confidence_events), 1)
  
  # --- Authority metrics ---
  approval_events = [e for e in consume_buffered_events(topic="governance.decisions", since=window_start)
                     if e.event_type in ["APPROVAL_GRANTED", "APPROVAL_DENIED", "INSUFFICIENT_AUTHORITY"]]
  
  authority_mismatches = [e for e in approval_events if e.event_type == "INSUFFICIENT_AUTHORITY"]
  authority_mismatch_rate = len(authority_mismatches) / max(len(approval_events), 1)
  
  # --- Delegation metrics ---
  delegation_events = [e for e in lifecycle_events if e.event_type in ["DELEGATION_STARTED", "DELEGATION_COMPLETE", "DELEGATION_FAILED", "CIRCULAR_DELEGATION_BLOCKED"]]
  
  delegation_depths = [e.payload.chain_depth for e in delegation_events if e.payload.get("chain_depth")]
  delegation_successes = len([e for e in delegation_events if e.event_type == "DELEGATION_COMPLETE"])
  delegation_total = len([e for e in delegation_events if e.event_type == "DELEGATION_STARTED"])
  delegation_success_rate = delegation_successes / max(delegation_total, 1)
  circular_count = len([e for e in delegation_events if e.event_type == "CIRCULAR_DELEGATION_BLOCKED"])
  
  # --- Handoff quality ---
  handoff_events = [e for e in lifecycle_events if e.event_type in ["HANDOFF_STARTED", "HANDOFF_COMPLETE", "HANDOFF_FAILED", "HANDOFF_RETRY"]]
  handoff_completions = len([e for e in handoff_events if e.event_type == "HANDOFF_COMPLETE"])
  handoff_total = len([e for e in handoff_events if e.event_type == "HANDOFF_STARTED"])
  handoff_success_rate = handoff_completions / max(handoff_total, 1)
  
  snapshot = OrchestrationMetricSnapshot(
    window_start = window_start,
    window_end = now(),
    routing = {
      total: total_routings,
      fallback_rate: routing_fallback_rate,
      accuracy: routing_accuracy,
      latency: compute_percentiles(routing_latencies, [50, 90, 99]) if routing_latencies else null
    },
    trust = {
      confidence_score_distribution: compute_percentiles(confidence_scores, [10, 25, 50, 75, 90]) if confidence_scores else null,
      disqualifier_rate: disqualifier_rate
    },
    authority = {
      mismatch_rate: authority_mismatch_rate,
      mismatch_count: len(authority_mismatches)
    },
    delegation = {
      success_rate: delegation_success_rate,
      depth_distribution: compute_percentiles(delegation_depths, [50, 90, 99]) if delegation_depths else null,
      circular_count: circular_count
    },
    handoff = {
      success_rate: handoff_success_rate,
      total: handoff_total
    },
    generated_at = now()
  )
  
  persist_snapshot(snapshot)
  
  enterprise_event_bus.publish(
    topic = "telemetry.metrics",
    event_type = "ORCHESTRATION_METRICS_SNAPSHOT",
    payload = snapshot.to_slim_dict()
  )
  
  RETURN snapshot
```

---

## Integration

**Called by:**
- Subscription to `runtime.trust.signals`, `runtime.workflow.lifecycle`, `org.agent.lifecycle`
- `workflow-monitoring/orchestration-health-scorer.md` — inputs to health scoring
- `operational-command-center/orchestration-control-plane.md` — displays orchestration metrics

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes orchestration snapshots

**Writes to:** `memory/enterprise-telemetry/orchestration-metrics.yaml`
