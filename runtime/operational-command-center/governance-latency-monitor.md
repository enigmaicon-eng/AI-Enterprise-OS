# Governance Latency Monitor

**System ID:** `governance-latency-monitor`
**Role:** Monitors latency across all governance decision pathways — tracks approval wait times, gate evaluation durations, attestation issuance lag, and constitutional clearance throughput; identifies governance bottlenecks before they block workflow execution and alerts on SLA breaches in the governance pipeline
**Storage:** `memory/operational-command-center/governance-latency-state.yaml`

---

## Purpose

Governance overhead is not optional — but governance latency is manageable. A constitutional evaluation that takes 200ms is invisible. One that takes 45 minutes because T4 approvers are unresponsive blocks a workflow's entire execution. The governance latency monitor watches the full pipeline: from the moment a governance decision is requested to the moment it is fulfilled, tracking every stage, surfacing the bottlenecks, and alerting when approval queues are aging toward SLA breach.

---

## Governance Latency SLAs

```yaml
GovernanceSLAs:
  
  CONSTITUTIONAL_EVALUATION:
    p50_target_ms: 200
    p99_target_ms: 2000        # Constitutional governor should respond fast
    breach_alert_ms: 5000
  
  GATE_VERDICT_STANDARD:
    p50_target_ms: 500
    p99_target_ms: 5000
    breach_alert_ms: 10000
  
  GATE_VERDICT_HIGH_RISK:
    p50_target_ms: 2000
    p99_target_ms: 30000
    breach_alert_ms: 60000
  
  APPROVAL_T3_PEER:
    p50_target_ms: 300000      # 5 minutes (automated peer review)
    p99_target_ms: 900000      # 15 minutes
    breach_alert_ms: 1800000   # 30 minutes
  
  APPROVAL_T4_GOVERNANCE:
    p50_target_ms: 900000      # 15 minutes (human T4)
    p99_target_ms: 3600000     # 1 hour
    breach_alert_ms: 5400000   # 90 minutes
  
  APPROVAL_T5_EXECUTIVE:
    p50_target_ms: 1800000     # 30 minutes (executive human)
    p99_target_ms: 7200000     # 2 hours
    breach_alert_ms: 14400000  # 4 hours
  
  ATTESTATION_ISSUANCE:
    p50_target_ms: 100
    p99_target_ms: 1000
    breach_alert_ms: 5000
  
  POLICY_BINDING:
    p50_target_ms: 500
    p99_target_ms: 3000
    breach_alert_ms: 10000
```

---

## Latency Monitoring Engine

```
MonitoredDecision:
  request_id: string
  decision_type: string        # Maps to GovernanceSLAs keys
  subject_id: string
  run_id: string | null
  
  # Timing
  requested_at: datetime
  decided_at: datetime | null
  
  # Current state
  status: "PENDING | DECIDED | TIMED_OUT"
  age_ms: float                # (now() - requested_at).total_seconds() × 1000
  sla_target_ms: float         # From GovernanceSLAs
  sla_remaining_ms: float      # sla_breach_alert_ms - age_ms (negative = breached)
  
  # Owner
  assigned_to: string | null
  owner_tier: integer | null

monitor_governance_latency() → GovernanceLatencyReport:
  
  # Load all pending governance decisions
  pending_approvals = load_pending_approvals()
  pending_evaluations = load_pending_constitutional_evaluations()
  pending_attestations = load_pending_attestation_issuances()
  
  monitored = []
  alerts = []
  
  FOR approval in pending_approvals:
    decision_type = map_approval_to_decision_type(approval.approval_type, approval.required_authority_level)
    sla = GOVERNANCE_SLAS[decision_type]
    age_ms = (now() - approval.requested_at).total_seconds() × 1000
    sla_remaining = sla.breach_alert_ms - age_ms
    
    monitored.append(MonitoredDecision(
      request_id = approval.request_id,
      decision_type = decision_type,
      subject_id = approval.subject.subject_id,
      run_id = approval.subject.run_id,
      requested_at = approval.requested_at,
      status = "PENDING",
      age_ms = age_ms,
      sla_target_ms = sla.p99_target_ms,
      sla_remaining_ms = sla_remaining,
      assigned_to = approval.required_approver,
      owner_tier = approval.required_authority_level
    ))
    
    # Check for SLA breach
    IF sla_remaining <= 0:
      alerts.append(GovernanceLatencyAlert(
        decision_type = decision_type,
        request_id = approval.request_id,
        age_ms = age_ms,
        breach_threshold_ms = sla.breach_alert_ms,
        severity = "CRITICAL" if age_ms > sla.breach_alert_ms × 2 else "HIGH",
        waiting_on = approval.required_approver
      ))
      
      enterprise_event_bus.publish(
        topic = "alerts.high",
        event_type = "GOVERNANCE_LATENCY_SLA_BREACH",
        payload = {
          decision_type: decision_type,
          request_id: approval.request_id,
          age_ms: age_ms,
          run_id: approval.subject.run_id
        },
        priority = "HIGH"
      )
    
    ELIF sla_remaining <= sla.breach_alert_ms × 0.20:   # Within 20% of breach
      notify_approver_urgently(approval.required_approver, approval)
  
  # Compute latency distributions for recent decisions
  recent_decisions = load_recent_decided(window_hours=24)
  latency_by_type = compute_latency_distributions(recent_decisions)
  
  RETURN GovernanceLatencyReport(
    pending_count = len(monitored),
    breach_count = len(alerts),
    oldest_pending_ms = max(d.age_ms for d in monitored) if monitored else 0,
    monitored_decisions = monitored,
    active_alerts = alerts,
    latency_by_type = latency_by_type,
    sla_compliance_by_type = compute_sla_compliance(recent_decisions),
    generated_at = now()
  )

compute_latency_distributions(decided_decisions) → {str: LatencyDistribution}:
  
  by_type = {}
  FOR decision in decided_decisions:
    duration_ms = (decision.decided_at - decision.requested_at).total_seconds() × 1000
    by_type.setdefault(decision.decision_type, []).append(duration_ms)
  
  RETURN {
    decision_type: LatencyDistribution(
      p50 = percentile(durations, 50),
      p90 = percentile(durations, 90),
      p99 = percentile(durations, 99),
      max = max(durations),
      count = len(durations),
      sla_target_p99 = GOVERNANCE_SLAS[decision_type].p99_target_ms,
      sla_compliant = percentile(durations, 99) <= GOVERNANCE_SLAS[decision_type].p99_target_ms
    )
    for decision_type, durations in by_type.items()
  }
```

---

## Governance Queue Dashboard

```
get_governance_queue_view() → GovernanceQueueView:
  
  pending = load_pending_approvals()
  
  # Group by approver
  by_approver = {}
  FOR approval in pending:
    approver = approval.required_approver
    age_ms = (now() - approval.requested_at).total_seconds() × 1000
    by_approver.setdefault(approver, {"count": 0, "max_age_ms": 0, "items": []})
    by_approver[approver]["count"] += 1
    by_approver[approver]["max_age_ms"] = max(by_approver[approver]["max_age_ms"], age_ms)
    by_approver[approver]["items"].append(approval)
  
  # Identify bottleneck approvers
  bottleneck_approvers = [
    approver for approver, data in by_approver.items()
    if data["count"] > 5 or data["max_age_ms"] > 1800000   # > 5 items or oldest > 30 min
  ]
  
  RETURN GovernanceQueueView(
    total_pending = len(pending),
    by_approver = by_approver,
    bottleneck_approvers = bottleneck_approvers,
    pending_by_authority_level = count_by_field(pending, "required_authority_level"),
    at_risk_of_breach = [a for a in pending if is_approaching_breach(a)]
  )
```

---

## Integration

**Called by:**
- `operational-command-center/governance-operations-dashboard.md` — governance latency panel
- `operational-command-center/enterprise-operations-console.md` — alert forwarding
- `enterprise-telemetry/runtime-trigger-engine.md` — governance anomaly triggers

**Calls:**
- `governance-attestation/cryptographic-approval-engine.md` — pending approval queue
- `enterprise-telemetry/enterprise-event-bus.md` — SLA breach alerts
- Approver notification systems — urgent reminders

**Writes to:** `memory/operational-command-center/governance-latency-state.yaml`
