# Governance Telemetry

**System ID:** `governance-telemetry`
**Role:** Collects and aggregates enterprise-wide governance performance metrics — tracks constitutional compliance rates, approval chain completion times, attestation coverage, policy drift frequency, gate pass rates, and governance decision latency across all workflow runs and governance actions
**Storage:** `memory/enterprise-telemetry/governance-metrics.yaml`

---

## Purpose

Governance health is not visible from any single run's approval record. It emerges from the pattern: Is the constitutional clearance rate stable or declining? Are approval chains completing in time or creating bottlenecks? How often are policies drifting mid-run? Which gates are consistently failing? Governance telemetry aggregates these signals across the entire enterprise to give governance operators the portfolio-level view needed to detect compliance erosion before it becomes a crisis.

---

## Governance Metric Taxonomy

```yaml
GovernanceMetrics:
  
  # Constitutional compliance
  CONSTITUTIONAL_CLEARANCE_RATE:
    description: "Fraction of evaluations returning CONSTITUTIONAL or CONSTITUTIONAL_WITH_ADVISORIES"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.90    # Alert below 90%

  CONSTITUTIONAL_VIOLATION_COUNT:
    description: "Count of ABSOLUTE and MANDATORY constitutional violations"
    unit: count
    aggregation: COUNTER
    dimensions: [violation_type, principle_id]
    alert_on_any: true       # Any absolute violation triggers immediate alert

  CONSTITUTIONAL_OVERRIDE_COUNT:
    description: "Human-authorized constitutional overrides (should be near zero)"
    unit: count
    aggregation: COUNTER
    dimensions: [overriding_agent_id, principle_id]

  # Approval chain performance
  APPROVAL_CHAIN_COMPLETION_RATE:
    description: "Fraction of initiated approval chains that complete successfully"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440     # 24h
    dimensions: [chain_type]
    alert_threshold: 0.95

  APPROVAL_WAIT_TIME_MS:
    description: "Time from approval request to approval decision"
    unit: milliseconds
    aggregation: HISTOGRAM
    percentiles: [p50, p90, p99, max]
    dimensions: [approval_type, required_authority_level]
    p99_alert_threshold_ms: 1800000   # Alert if p99 > 30 minutes

  APPROVAL_DENIAL_RATE:
    description: "Fraction of approval requests that are denied"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    dimensions: [approval_type]

  # Attestation coverage
  ATTESTATION_COVERAGE_RATE:
    description: "Fraction of required attestations that are covered"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.98    # Coverage gaps below 98% trigger alert

  ATTESTATION_EXPIRY_RATE:
    description: "Fraction of attestations expiring before use"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 1440
    dimensions: [attestation_type]

  # Policy currency
  POLICY_DRIFT_COUNT:
    description: "Count of policy drift detections during active workflow runs"
    unit: count
    aggregation: COUNTER
    dimensions: [policy_category, drift_severity]

  POLICY_VERSION_LAG:
    description: "Average age of policy versions currently in use vs latest"
    unit: days
    aggregation: AVERAGE
    dimensions: [policy_id]

  # Gate governance
  GATE_PASS_RATE_BY_TYPE:
    description: "Gate pass rate segmented by gate category (quality, security, constitutional)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    dimensions: [gate_type, workflow_definition_id]

  GATE_THRESHOLD_BREACH_COUNT:
    description: "Count of gate failures attributed to threshold changes (policy drift impact)"
    unit: count
    aggregation: COUNTER

  # Security governance
  PERMISSION_DENIAL_RATE:
    description: "Rate of permission check denials (capability scope violations)"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
    alert_threshold: 0.05    # Alert if > 5% of permission checks denied

  INJECTION_BLOCK_RATE:
    description: "Rate of prompt injection blocks by the semantic firewall"
    unit: ratio
    aggregation: ROLLING_AVERAGE
    window_minutes: 60
```

---

## Governance Metric Collection

```
collect_governance_metrics(window_minutes=60) → GovernanceMetricSnapshot:
  
  window_start = now() - timedelta(minutes=window_minutes)
  
  # Load from governance event subscriptions
  const_events = consume_buffered_events(topic="governance.constitutional", since=window_start)
  decision_events = consume_buffered_events(topic="governance.decisions", since=window_start)
  policy_events = consume_buffered_events(topic="governance.policy.changes", since=window_start)
  security_events = consume_buffered_events(topic="runtime.security.events", since=window_start)
  gate_events = consume_buffered_events(topic="runtime.workflow.gates", since=window_start)
  
  # --- Constitutional compliance ---
  total_const_evals = len([e for e in const_events if e.event_type == "CONSTITUTIONAL_EVALUATION"])
  const_passed = len([e for e in const_events if e.event_type == "CONSTITUTIONAL_EVALUATION"
                      and e.payload.verdict in ["CONSTITUTIONAL", "CONSTITUTIONAL_WITH_ADVISORIES"]])
  
  clearance_rate = const_passed / max(total_const_evals, 1)
  
  absolute_violations = [e for e in const_events if e.event_type == "ABSOLUTE_CONSTITUTIONAL_VIOLATION"]
  mandatory_violations = [e for e in const_events if e.event_type == "MANDATORY_VIOLATION"]
  overrides = [e for e in const_events if e.event_type == "CONSTITUTIONAL_OVERRIDE"]
  
  # --- Approval chain performance ---
  approval_requests = [e for e in decision_events if e.event_type == "APPROVAL_REQUESTED"]
  approval_completions = [e for e in decision_events if e.event_type in ["APPROVAL_GRANTED", "APPROVAL_DENIED"]]
  approval_denials = [e for e in decision_events if e.event_type == "APPROVAL_DENIED"]
  
  completion_rate = len(approval_completions) / max(len(approval_requests), 1)
  denial_rate = len(approval_denials) / max(len(approval_completions), 1)
  
  wait_times = compute_approval_wait_times(approval_requests, approval_completions)
  
  # --- Attestation coverage ---
  coverage_reports = [e for e in decision_events if e.event_type == "ATTESTATION_COVERAGE_REPORT"]
  avg_coverage_rate = MEAN([r.payload.coverage_rate for r in coverage_reports]) if coverage_reports else null
  
  # --- Policy drift ---
  drift_events = [e for e in policy_events if e.event_type == "POLICY_DRIFT_DETECTED"]
  drift_by_category = count_by_field(drift_events, "policy_category")
  
  # --- Gate governance ---
  gate_by_type = compute_gate_rates_by_type(gate_events)
  
  # --- Security governance ---
  permission_events = [e for e in security_events if e.event_type == "PERMISSION_CHECK"]
  permission_denials = [e for e in permission_events if e.payload.get("result") == "DENIED"]
  permission_denial_rate = len(permission_denials) / max(len(permission_events), 1)
  
  injection_checks = [e for e in security_events if e.event_type == "INJECTION_SCAN"]
  injection_blocks = [e for e in injection_checks if e.payload.get("result") == "BLOCKED"]
  injection_block_rate = len(injection_blocks) / max(len(injection_checks), 1)
  
  snapshot = GovernanceMetricSnapshot(
    window_start = window_start,
    window_end = now(),
    constitutional = {
      clearance_rate: clearance_rate,
      total_evaluations: total_const_evals,
      absolute_violations: len(absolute_violations),
      mandatory_violations: len(mandatory_violations),
      overrides: len(overrides),
      compliance_score: clearance_rate - (len(absolute_violations) × 0.20 + len(mandatory_violations) × 0.05)
    },
    approvals = {
      completion_rate: completion_rate,
      denial_rate: denial_rate,
      wait_time_p50_ms: wait_times.p50,
      wait_time_p90_ms: wait_times.p90,
      wait_time_p99_ms: wait_times.p99
    },
    attestations = {
      avg_coverage_rate: avg_coverage_rate
    },
    policy_drift = {
      total_drifts: len(drift_events),
      by_category: drift_by_category
    },
    gates = gate_by_type,
    security = {
      permission_denial_rate: permission_denial_rate,
      injection_block_rate: injection_block_rate
    },
    generated_at = now()
  )
  
  persist_snapshot(snapshot)
  
  enterprise_event_bus.publish(
    topic = "telemetry.health.scores",
    event_type = "GOVERNANCE_METRICS_SNAPSHOT",
    payload = snapshot.to_slim_dict()
  )
  
  RETURN snapshot
```

---

## Governance Compliance Score

```
compute_governance_compliance_score(snapshot) → float:
  # Composite 0.0 – 1.0 score; used by governance-health-scorer.md
  
  weights = {
    constitutional_clearance: 0.35,
    approval_chain_completion: 0.20,
    attestation_coverage: 0.20,
    gate_pass_rate: 0.15,
    policy_drift_free: 0.10
  }
  
  scores = {
    constitutional_clearance: snapshot.constitutional.clearance_rate,
    approval_chain_completion: snapshot.approvals.completion_rate,
    attestation_coverage: snapshot.attestations.avg_coverage_rate or 1.0,
    gate_pass_rate: MEAN(snapshot.gates.values()) if snapshot.gates else 1.0,
    policy_drift_free: max(0.0, 1.0 - snapshot.policy_drift.total_drifts × 0.10)
  }
  
  # Hard penalty: any absolute violation tanks the score
  IF snapshot.constitutional.absolute_violations > 0:
    RETURN max(0.0, WEIGHTED_AVERAGE(scores, weights) - 0.40)
  
  RETURN WEIGHTED_AVERAGE(scores, weights)
```

---

## Integration

**Called by:**
- `enterprise-telemetry/telemetry-subscriptions.md` — subscription drives event collection
- `workflow-monitoring/governance-health-scorer.md` — queries governance compliance score
- `operational-command-center/governance-operations-dashboard.md` — displays metrics

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes governance metric snapshots

**Writes to:** `memory/enterprise-telemetry/governance-metrics.yaml`
