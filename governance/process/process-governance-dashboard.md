# Process Governance Dashboard

## Purpose
Provides a unified operational view of all process governance activity — compliance status, audit health, lineage coverage, workflow compliance scores, and active violations. This is the governance team's primary situational awareness interface.

---

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  ENTERPRISE PROCESS GOVERNANCE DASHBOARD                          [2026-05-15]  ║
║  Refresh: 60s  |  Period: Last 30 days  |  Operator: governance-lead            ║
╠═══════════════════════════╦══════════════════════════╦═══════════════════════════╣
║  COMPLIANCE SCORE         ║  AUDIT HEALTH            ║  WORKFLOW STATUS          ║
║  ─────────────────────    ║  ─────────────────────   ║  ─────────────────────    ║
║  Overall:    0.87 ✓       ║  Chain Integrity: INTACT ║  Active Instances:  142   ║
║  Governance: 0.91 ✓       ║  Coverage:        99.2%  ║  Paused (Human):     23   ║
║  Const.:     0.95 ✓       ║  Last Verified:   06:00  ║  Escalated:           4   ║
║  Process:    0.88 ✓       ║  Gap Events:         2   ║  Failed (24h):        7   ║
║  SLA:        0.82 ⚠       ║  Tamper Alerts:      0   ║  SLA At-Risk:        11   ║
║  Audit:      0.96 ✓       ║  Correction Records: 1   ║  Avg Duration (h):  3.2   ║
╠═══════════════════════════╩══════════════════════════╩═══════════════════════════╣
║  ACTIVE VIOLATIONS                                                               ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  [CRITICAL] COMP-GOV-003 | PROC-RFC-0041 | Expired approval used | 2h ago      ║
║  [HIGH]     COMP-SLA-003 | INC-20260514-007 | P1 response SLA missed | 1d ago  ║
║  [HIGH]     COMP-AUD-002 | PROC-ENG-0097 | 3 audit gaps detected | 3h ago      ║
║  [MEDIUM]   COMP-SLA-002 | PROC-DEL-0023 | Breach escalation not created       ║
║  [LOW]      COMP-SLA-001 | PROC-PM-0031 | SLA target not configured            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  CONSTITUTIONAL COMPLIANCE                  ║  APPROVAL QUEUE                   ║
║  ─────────────────────────────────────      ║  ─────────────────────────────    ║
║  Checks (30d):          247                 ║  Pending (Tier 1–2):     18       ║
║  PASS:                  241 (97.6%)         ║  Pending (Tier 3–4):      6       ║
║  CONDITIONAL:             5 (2.0%)          ║  Oldest Pending:       8.3h       ║
║  FAIL:                    1 (0.4%) ⚠       ║  At SLA Risk (>80%):     4        ║
║  Open Incidents (const):  1                 ║  Expired (24h):           0       ║
║  Avg Resolution Time:  18.4h                ║  Avg Decision Time:    2.1h       ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  COMPLIANCE TREND (30d)                                                          ║
║                                                                                  ║
║  1.0 ┤                                                                          ║
║  0.9 ┤  ····················  ╭─────────────────────────────  0.87             ║
║  0.8 ┤                   ╰───╯                                                  ║
║  0.7 ┤                                                                          ║
║  0.6 ┤                                                                          ║
║      └──────────────────────────────────────────────────────────────────────   ║
║        30d ago                    15d ago                          today         ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  RECENT GOVERNANCE ACTIONS                                                       ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  [15m ago] Approval GRANTED | PROC-GOV-0019 | Tier-3 | RFC-2026-041            ║
║  [42m ago] Constitutional CHECK PASS | PROC-GOV-0018 | confidence 0.96          ║
║  [1.2h ago] SLA ESCALATION | PROC-DEL-0089 | Tier escalated 2→3                ║
║  [2.1h ago] Override APPLIED | PROC-ARCH-0034 | Tier-4 | approved by 2 Tier-4s ║
║  [3.4h ago] Compliance FINDING | COMP-AUD-002 | PROC-ENG-0097 | audit gaps     ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Panel Definitions

### Panel 1 — Compliance Score
```yaml
data_source: workflow-compliance-system.md compliance_score
refresh: 60s
alerts:
  dimension_score < 0.80: YELLOW
  dimension_score < 0.70: RED
  hard_penalty_active: ORANGE banner
```

### Panel 2 — Audit Health
```yaml
data_source: workflow-auditability-system.md
metrics:
  chain_integrity: result of daily verify_chain job
  coverage: (nodes_with_audit_events / total_nodes_executed) × 100
  last_verified: timestamp of last chain verification
  gap_events: count of NODE_* events without corresponding audit records
  tamper_alerts: count of signature verification failures
  correction_records: count of active audit corrections
alerts:
  chain_integrity != INTACT: CRITICAL
  coverage < 99.0%: YELLOW
  tamper_alerts > 0: CRITICAL
```

### Panel 3 — Workflow Status
```yaml
data_source: orchestration-dag-system.md instance store
metrics:
  active_instances: count(status in [RUNNING, PAUSED])
  paused_human: count(status == PAUSED AND paused_reason == HUMAN_TASK)
  escalated: count(status == ESCALATED)
  failed_24h: count(status == FAILED AND failed_at > now()-PT24H)
  sla_at_risk: count(sla_status == AT_RISK)
  avg_duration_h: avg(duration_ms / 3600000) where status == COMPLETED
alerts:
  escalated > 10: YELLOW
  failed_24h > 20: RED
```

### Panel 4 — Active Violations
```yaml
data_source: workflow-compliance-system.md compliance_findings
filter: status == OPEN
sort: severity DESC, detected_at ASC
display:
  CRITICAL: red row
  HIGH: orange row
  MEDIUM: yellow row
  LOW: white row
alerts:
  any CRITICAL open > 4h: RED banner
  any CRITICAL open > 1h: ORANGE banner
```

### Panel 5 — Constitutional Compliance
```yaml
data_source:
  checks: audit events where type in [CONSTITUTIONAL_CHECK_PASSED, CONSTITUTIONAL_VIOLATION_DETECTED]
  incidents: incident-case-management.md where type == CONSTITUTIONAL
alerts:
  FAIL count > 0 in last 24h: RED
  CONDITIONAL count > 10 in last 7d: YELLOW
  open_incidents > 0: RED banner
```

### Panel 6 — Approval Queue
```yaml
data_source: operational-command-center/escalation-monitoring.md + approval queue
metrics:
  pending by tier
  oldest pending
  at_sla_risk: count(elapsed > sla * 0.80)
  expired_24h: count(status == EXPIRED AND expired_at > now()-PT24H)
  avg_decision_time_h: avg(decision_time_ms / 3600000)
alerts:
  oldest_pending > 24h: YELLOW
  at_sla_risk > 5: YELLOW
  expired > 0: ORANGE
```

---

## Compliance Score Panel — Expanded

```
COMPLIANCE SCORE BREAKDOWN
══════════════════════════════════════════════════════════

Dimension         Score  Weight  Contrib  Status
─────────────────────────────────────────────────────────
Constitutional    0.950  0.30    0.285    ✓ COMPLIANT
Governance        0.910  0.25    0.228    ✓ COMPLIANT
Process           0.880  0.15    0.132    ✓ COMPLIANT
Audit             0.960  0.10    0.096    ✓ COMPLIANT
Data              0.890  0.10    0.089    ✓ COMPLIANT
SLA               0.820  0.10    0.082    ⚠ ATTENTION
─────────────────────────────────────────────────────────
Raw Score:                       0.912
Active Penalties:                0.000
Hard Caps Applied:               none
─────────────────────────────────────────────────────────
FINAL SCORE:      0.87   STATUS: NEEDS_ATTENTION (SLA dim)

Compared to 7d ago: +0.02 (improving)
Compared to 30d ago: -0.01 (stable)
```

---

## Governance Actions Console

Operators can take governance actions directly from the dashboard:

```yaml
quick_actions:
  VIEW_FINDING:
    description: Open full finding detail with evidence
    tier_required: 2
  
  ACKNOWLEDGE_FINDING:
    description: Acknowledge a finding without resolving (pauses aging alerts)
    tier_required: 2
    requires_rationale: true
  
  ASSIGN_REMEDIATION:
    description: Assign remediation task to specific agent
    tier_required: 3
  
  WAIVE_FINDING:
    description: Waive a finding (expires in 30 days)
    tier_required: 4
    requires_dual_approval: true
  
  FORCE_AUDIT_VERIFY:
    description: Trigger immediate audit chain verification
    tier_required: 3
    rate_limit: 1 per hour
  
  ESCALATE_VIOLATION:
    description: Manually escalate a finding severity
    tier_required: 3
  
  EXPORT_COMPLIANCE_CERTIFICATE:
    description: Generate signed compliance certificate for current state
    tier_required: 4
    audit_on_access: true
```

---

## Alert Routing

```yaml
alert_routing:
  CRITICAL:
    immediate: [governance-lead, executive-sponsor]
    channels: [in-app, email, pagerduty]
    repeat_interval: PT15M until acknowledged
  
  HIGH:
    immediate: [governance-lead, org-leads]
    channels: [in-app, email]
    repeat_interval: PT1H until acknowledged
  
  MEDIUM:
    batched: every 4 hours
    channels: [in-app, email digest]
  
  LOW:
    daily_digest: true
    channels: [in-app only]
```

---

## Integration Points

| System | Role |
|---|---|
| `workflow-compliance-system.md` | Primary data source for compliance scores and findings |
| `workflow-auditability-system.md` | Audit health metrics |
| `execution-lineage-tracker.md` | Lineage coverage metrics |
| `orchestration-replay-engine.md` | Launch replay sessions from finding context |
| `orchestration-observability/` | Drill into specific workflow instance traces |
| `operational-command-center/governance-latency-monitor.md` | Approval queue SLA data |
| `enterprise-telemetry/governance-telemetry.md` | Historical metric trends |
