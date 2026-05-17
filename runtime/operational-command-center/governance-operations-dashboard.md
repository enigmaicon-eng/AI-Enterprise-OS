# Governance Operations Dashboard

**System ID:** `governance-operations-dashboard`
**Role:** Dedicated governance operator interface — displays live governance pipeline status including pending approvals with age and authority breakdown, constitutional evaluation rates, attestation coverage gaps, policy binding health, active governance latency alerts, and provides direct links to approve, escalate, or investigate governance items
**Storage:** `memory/operational-command-center/governance-dashboard-state.yaml`

---

## Purpose

Governance operators have a different concern than runtime operators: not "is the workflow fast?" but "is the workflow governed?" The governance operations dashboard is the dedicated view for governance-specific operations — tracking the approval queue, constitutional health, attestation coverage, and policy state across all active workflows. It surfaces the governance pipeline as a first-class operational object, not an afterthought.

---

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════════╗
║  GOVERNANCE OPERATIONS DASHBOARD                     [2026-05-14 14:45] ║
╠══════════════════════════════════════════════════════════════════════════╣
║  COMPLIANCE SCORES                                                       ║
║  Constitutional: 0.94 ✅   Approval Chain: 0.89 🟡   Attestation: 0.97 ✅ ║
║  Policy Currency: 0.91 ✅   Gate Governance: 0.88 🟡                      ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  APPROVAL QUEUE (12 pending)                                             ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  T5 Executive  ■ 2 pending  oldest: 48m ⚠️  [View All] [Notify]           ║
║  T4 Governance ■ 5 pending  oldest: 22m     [View All] [Notify]           ║
║  T3 Peer       ■ 5 pending  oldest: 8m      [View All]                    ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  CONSTITUTIONAL HEALTH (last 1h)                                         ║
║  Evaluations: 847   Constitutional: 843 (99.5%)   Violations: 4 MAND     ║
║  Overrides: 0   Absolute violations: 0   Advisories: 12                  ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  ATTESTATION COVERAGE                                                    ║
║  Coverage: 98.3% (2 gaps detected)   [View Gaps]                         ║
║  run-8823/node-14 missing EXECUTION_APPROVAL  (detected 6m ago)          ║
║  run-8791/node-09 missing CONSTITUTIONAL_CLEARANCE (detected 14m ago)    ║
║  ─────────────────────────────────────────────────────────────────────── ║
║  POLICY DRIFT                                                            ║
║  Last 24h: 1 drift detected   gate-risk-threshold v12→v13 (MEDIUM)       ║
║  Last binding: 3 minutes ago   Constitution version: v7                   ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Dashboard State Schema

```yaml
GovernanceDashboardState:
  last_refreshed: datetime
  refresh_interval_seconds: 30
  
  # Compliance scores (from governance-health-scorer)
  compliance_scores:
    constitutional: float
    approval_chain: float
    attestation: float
    policy_currency: float
    gate_governance: float
    composite: float
  
  # Approval queue
  approval_queue:
    total_pending: integer
    by_authority_level:
      T5: {count: integer, oldest_age_ms: float, at_risk_count: integer}
      T4: {count: integer, oldest_age_ms: float, at_risk_count: integer}
      T3: {count: integer, oldest_age_ms: float, at_risk_count: integer}
    pending_items: [PendingApprovalSummary]
  
  # Constitutional health
  constitutional_health:
    evaluations_last_hour: integer
    compliance_rate: float
    absolute_violations_24h: integer
    mandatory_violations_24h: integer
    overrides_24h: integer
    advisories_last_hour: integer
  
  # Attestation state
  attestation_state:
    coverage_rate: float
    total_required_today: integer
    covered_today: integer
    detected_gaps: [AttestationGapSummary]
  
  # Policy state
  policy_state:
    drift_events_24h: integer
    recent_drifts: [PolicyDriftSummary]
    last_binding_at: datetime
    constitution_version: integer
    binding_count_today: integer
```

---

## Dashboard Data Assembly

```
refresh_governance_dashboard() → GovernanceDashboardState:
  
  [compliance, queue, constitutional, attestation, policy] = parallel_load([
    governance_health_scorer.get_current_scores(),
    load_approval_queue(),
    load_constitutional_health(),
    load_attestation_state(),
    load_policy_state()
  ])
  
  state = GovernanceDashboardState(
    last_refreshed = now(),
    compliance_scores = compliance,
    approval_queue = queue,
    constitutional_health = constitutional,
    attestation_state = attestation,
    policy_state = policy
  )
  
  persist_dashboard_state(state)
  
  # Check for items needing immediate attention
  check_governance_alerts(state)
  
  RETURN state

load_approval_queue() → ApprovalQueueState:
  
  pending = cryptographic_approval_engine.get_all_pending_requests()
  
  by_tier = {T3: [], T4: [], T5: []}
  
  FOR req in pending:
    tier_key = f"T{req.required_authority_level}" if req.required_authority_level <= 5 else "T5"
    age_ms = (now() - req.requested_at).total_seconds() × 1000
    by_tier[tier_key].append({
      request_id: req.request_id,
      age_ms: age_ms,
      subject_id: req.subject.subject_id,
      approval_type: req.approval_type,
      run_id: req.subject.run_id,
      at_risk: governance_latency_monitor.is_approaching_breach(req)
    })
  
  RETURN ApprovalQueueState(
    total_pending = len(pending),
    by_authority_level = {
      tier: {
        count: len(items),
        oldest_age_ms: max(i["age_ms"] for i in items) if items else 0,
        at_risk_count: sum(1 for i in items if i["at_risk"]),
        items: sorted(items, key=lambda i: i["age_ms"], reverse=True)
      }
      for tier, items in by_tier.items()
    }
  )

load_constitutional_health() → ConstitutionalHealthState:
  
  window_start = now() - timedelta(hours=1)
  const_events = consume_buffered_events(topic="governance.constitutional", since=window_start)
  
  evaluations = [e for e in const_events if e.event_type == "CONSTITUTIONAL_EVALUATION"]
  compliant = [e for e in evaluations if e.payload.verdict in ["CONSTITUTIONAL", "CONSTITUTIONAL_WITH_ADVISORIES"]]
  absolute = [e for e in const_events if e.event_type == "ABSOLUTE_CONSTITUTIONAL_VIOLATION"]
  mandatory = [e for e in const_events if e.event_type == "MANDATORY_VIOLATION"]
  advisories = [e for e in const_events if e.event_type == "CONSTITUTIONAL_ADVISORY"]
  overrides = [e for e in const_events if e.event_type == "CONSTITUTIONAL_OVERRIDE"]
  
  RETURN ConstitutionalHealthState(
    evaluations_last_hour = len(evaluations),
    compliance_rate = len(compliant) / max(len(evaluations), 1),
    absolute_violations_24h = len(absolute),
    mandatory_violations_24h = len(mandatory),
    overrides_24h = len(overrides),
    advisories_last_hour = len(advisories)
  )

check_governance_alerts(state):
  
  IF state.approval_queue.by_authority_level["T5"]["oldest_age_ms"] > 3600000:   # > 1 hour
    enterprise_event_bus.publish(
      topic = "alerts.high",
      event_type = "T5_APPROVAL_AGING",
      payload = {age_ms: state.approval_queue.by_authority_level["T5"]["oldest_age_ms"]},
      priority = "HIGH"
    )
  
  IF state.constitutional_health.absolute_violations_24h > 0:
    enterprise_event_bus.publish(
      topic = "alerts.critical",
      event_type = "ABSOLUTE_CONSTITUTIONAL_VIOLATION_ACTIVE",
      payload = {count: state.constitutional_health.absolute_violations_24h},
      priority = "CRITICAL"
    )
  
  IF state.attestation_state.coverage_rate < 0.95:
    enterprise_event_bus.publish(
      topic = "alerts.high",
      event_type = "ATTESTATION_COVERAGE_DEGRADED",
      payload = {coverage_rate: state.attestation_state.coverage_rate, gaps: len(state.attestation_state.detected_gaps)},
      priority = "HIGH"
    )
```

---

## Quick Governance Actions

```
# Actions available directly from the governance operations dashboard

notify_pending_approvers(authority_level, message, operator_id) → NotifyResult:
  # Sends reminder to all approvers with pending items at specified tier
  pending_items = load_pending_by_tier(authority_level)
  approvers = list(set(item.required_approver for item in pending_items))
  
  FOR approver in approvers:
    send_notification(approver, message, urgency="HIGH")
  
  record_governance_action("APPROVER_NOTIFIED", {tier: authority_level, count: len(approvers)}, operator_id)
  RETURN NotifyResult(notified_count=len(approvers))

view_attestation_gap_detail(run_id, node_id) → AttestationGapDetail:
  # Drills into a specific attestation gap to understand what's missing and why
  coverage = attestation_registry.check_attestation_coverage(run_id)
  gap = next((g for g in coverage.gaps if g.node_id == node_id), null)
  
  IF NOT gap:
    RETURN AttestationGapDetail(found=False)
  
  node_decl = workflow_registry.get_node_declaration(run_id, node_id)
  
  RETURN AttestationGapDetail(
    run_id = run_id,
    node_id = node_id,
    missing_type = gap.required.attestation_type,
    node_type = node_decl.node_type,
    requires_approval = node_decl.requires_approval,
    gap_detected_at = gap.detected_at,
    possible_causes = diagnose_attestation_gap(gap, node_decl)
  )
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — governance panel
- Governance operators — primary governance monitoring interface

**Calls:**
- `enterprise-telemetry/governance-telemetry.md` — governance metrics
- `operational-command-center/governance-latency-monitor.md` — latency and queue data
- `governance-attestation/attestation-registry.md` — coverage gaps
- `governance-attestation/cryptographic-approval-engine.md` — pending approvals
- `workflow-monitoring/governance-health-scorer.md` — compliance scores

**Writes to:** `memory/operational-command-center/governance-dashboard-state.yaml`
