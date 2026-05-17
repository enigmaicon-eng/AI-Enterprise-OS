# Organizational Health Telemetry

**System ID:** `organizational-health-telemetry`
**Role:** Collects and aggregates organizational health signals across all agent teams and org units — tracks agent utilization, escalation rates, decision velocity, knowledge currency, collaboration quality, and capacity stress indicators; feeds the organizational health scoring and stress detection systems
**Storage:** `memory/enterprise-telemetry/org-health-metrics.yaml`

---

## Purpose

Agent organizations have health just as human organizations do. An org can be overloaded (agents queued up, escalations spiking), stagnant (knowledge gaps growing, decisions slow), or in good shape (high throughput, fast decisions, low escalation). Organizational health telemetry aggregates the operational signals that reveal this state across every agent org in the enterprise — surfacing the leading indicators of degradation before output quality drops.

---

## Organizational Health Metric Taxonomy

```yaml
OrgHealthMetrics:
  
  # Capacity and utilization
  AGENT_UTILIZATION_RATE:
    description: "Fraction of time agents are actively executing tasks (vs idle/waiting)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [org_id, trust_tier]
    alert_high_threshold: 0.90    # Over-utilization
    alert_low_threshold: 0.20     # Under-utilization (possible routing failures)

  QUEUE_DEPTH_BY_ORG:
    description: "Number of pending tasks per org unit"
    unit: count
    aggregation: GAUGE
    dimensions: [org_id]
    alert_threshold: 20           # Queue depth > 20 indicates saturation

  TASK_WAIT_TIME_MS:
    description: "Time tasks spend waiting for agent assignment within an org"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99]
    dimensions: [org_id]

  # Escalation health
  ESCALATION_RATE:
    description: "Escalations per 100 tasks handled (normalized escalation pressure)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [org_id, escalation_type]
    alert_threshold: 0.15         # > 15 escalations per 100 tasks

  ESCALATION_RESOLUTION_TIME_MS:
    description: "Time from escalation initiation to resolution"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99]
    dimensions: [org_id, escalation_type]

  ESCALATION_REOPEN_RATE:
    description: "Fraction of resolved escalations reopened (indicates poor resolution quality)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    alert_threshold: 0.10

  # Decision velocity
  DECISION_CYCLE_TIME_MS:
    description: "Average time to reach a decision from when it was raised"
    unit: milliseconds
    aggregation: AVERAGE
    dimensions: [org_id, decision_type]

  DECISION_REVERSAL_RATE:
    description: "Fraction of decisions reversed within 24h (indicates poor initial decisions)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    dimensions: [org_id]
    alert_threshold: 0.10

  DECISION_BLOCKED_RATE:
    description: "Fraction of decision requests blocked waiting for upstream input"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [org_id]
    alert_threshold: 0.20

  # Knowledge health
  WIKI_STALENESS_SCORE:
    description: "Weighted average staleness of org's wiki pages (0=fresh, 1=fully stale)"
    unit: ratio
    aggregation: GAUGE
    dimensions: [org_id]
    update_frequency_hours: 24
    alert_threshold: 0.50

  KNOWLEDGE_GAP_COUNT:
    description: "Count of open knowledge gaps (topics referenced but not documented)"
    unit: count
    aggregation: GAUGE
    dimensions: [org_id]

  PATTERN_REUSE_RATE:
    description: "Fraction of work that reuses existing patterns vs inventing from scratch"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    dimensions: [org_id]

  # Collaboration quality
  HANDOFF_FAILURE_RATE_BY_ORG:
    description: "Fraction of inter-org handoffs that fail or require retry"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [from_org_id, to_org_id]
    alert_threshold: 0.05

  COLLABORATION_CONTRACT_VIOLATIONS:
    description: "Count of inter-org collaboration contract violations"
    unit: count
    aggregation: COUNTER
    dimensions: [from_org_id, to_org_id, contract_tier]

  CROSS_ORG_LATENCY_MS:
    description: "Latency of cross-org work requests"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99]
    dimensions: [from_org_id, to_org_id]
```

---

## Metric Collection

```
collect_org_health_metrics(window_minutes=60) → OrgHealthMetricSnapshot:
  
  window_start = now() - timedelta(minutes=window_minutes)
  
  capacity_events = consume_buffered_events(topic="org.capacity.signals", since=window_start)
  escalation_events = consume_buffered_events(topic="org.escalation.events", since=window_start)
  lifecycle_events = consume_buffered_events(topic="runtime.workflow.lifecycle", since=window_start)
  
  # --- Capacity and utilization ---
  utilization_signals = [e for e in capacity_events if e.event_type == "AGENT_UTILIZATION_REPORT"]
  
  utilization_by_org = {}
  FOR signal in utilization_signals:
    org_id = signal.source.get("org_id")
    IF org_id:
      utilization_by_org.setdefault(org_id, []).append(signal.payload.utilization_rate)
  
  avg_utilization = {
    org_id: MEAN(rates)
    for org_id, rates in utilization_by_org.items()
  }
  
  queue_depth_by_org = {
    e.payload.org_id: e.payload.queue_depth
    for e in capacity_events
    if e.event_type == "QUEUE_DEPTH_REPORT"
  }
  
  # --- Escalation health ---
  new_escalations = [e for e in escalation_events if e.event_type == "ESCALATION_INITIATED"]
  resolved_escalations = [e for e in escalation_events if e.event_type == "ESCALATION_RESOLVED"]
  reopened_escalations = [e for e in escalation_events if e.event_type == "ESCALATION_REOPENED"]
  
  escalation_by_org = count_by_field(new_escalations, "org_id")
  
  # Normalize by task volume
  task_events = [e for e in lifecycle_events if e.event_type in ["NODE_STARTED"]]
  tasks_by_org = count_by_field(task_events, "org_id")
  
  escalation_rate_by_org = {
    org_id: escalation_by_org.get(org_id, 0) / max(tasks_by_org.get(org_id, 1) / 100, 1)
    for org_id in set(list(escalation_by_org.keys()) + list(tasks_by_org.keys()))
  }
  
  resolution_times = [
    (r.payload.resolved_at - r.payload.escalated_at).total_seconds() × 1000
    for r in resolved_escalations
    if r.payload.get("resolved_at") and r.payload.get("escalated_at")
  ]
  
  # --- Decision velocity ---
  decision_events = [e for e in consume_buffered_events(topic="governance.decisions", since=window_start)
                     if e.event_type in ["DECISION_RAISED", "DECISION_MADE", "DECISION_REVERSED", "DECISION_BLOCKED"]]
  
  decision_cycle_times = compute_decision_cycle_times(decision_events)
  
  # --- Knowledge health ---
  wiki_staleness = compute_wiki_staleness_by_org()   # Scans wiki modification timestamps
  knowledge_gaps = count_open_knowledge_gaps()
  
  snapshot = OrgHealthMetricSnapshot(
    window_start = window_start,
    window_end = now(),
    utilization = {
      by_org: avg_utilization,
      enterprise_avg: MEAN(avg_utilization.values()) if avg_utilization else null
    },
    queues = {
      by_org: queue_depth_by_org,
      max_depth: max(queue_depth_by_org.values()) if queue_depth_by_org else 0
    },
    escalations = {
      rate_by_org: escalation_rate_by_org,
      enterprise_rate: MEAN(escalation_rate_by_org.values()) if escalation_rate_by_org else null,
      resolution_time_p90_ms: percentile(resolution_times, 90) if resolution_times else null,
      reopen_rate: len(reopened_escalations) / max(len(resolved_escalations), 1)
    },
    decisions = {
      cycle_time_by_org: decision_cycle_times,
      decision_reversal_count: len([e for e in decision_events if e.event_type == "DECISION_REVERSED"])
    },
    knowledge = {
      staleness_by_org: wiki_staleness,
      enterprise_avg_staleness: MEAN(wiki_staleness.values()) if wiki_staleness else null,
      open_knowledge_gaps: knowledge_gaps
    },
    generated_at = now()
  )
  
  persist_snapshot(snapshot)
  
  enterprise_event_bus.publish(
    topic = "telemetry.health.scores",
    event_type = "ORG_HEALTH_METRICS_SNAPSHOT",
    payload = snapshot.to_slim_dict()
  )
  
  # Publish capacity signals for stress detection
  FOR org_id, rate in escalation_rate_by_org.items():
    IF rate > 0.20:
      enterprise_event_bus.publish(
        topic = "org.capacity.signals",
        event_type = "ORG_STRESS_SIGNAL",
        payload = {org_id: org_id, stress_indicator: "ESCALATION_SURGE", rate: rate},
        priority = "HIGH"
      )
  
  RETURN snapshot
```

---

## Integration

**Called by:**
- Subscription to `org.capacity.signals`, `org.escalation.events`
- `workflow-monitoring/organizational-stress-detector.md` — inputs to stress detection
- `operational-command-center/enterprise-operations-console.md` — org health panel

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes org health snapshots and stress signals

**Writes to:** `memory/enterprise-telemetry/org-health-metrics.yaml`
