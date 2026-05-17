# Workflow Compliance System

## Purpose
Continuously monitors all workflow activity for compliance with enterprise policies, governance rules, constitutional principles, and regulatory requirements. This system is the automated compliance watchdog — it detects violations proactively, generates compliance reports, and triggers remediation.

---

## Compliance Dimensions

| Dimension | What It Monitors | Source of Truth |
|---|---|---|
| **Governance Compliance** | Approval tiers met, SLAs honored, proper delegation | decision-models/governance-aware-branching.md |
| **Constitutional Compliance** | No constitutional principles violated | constitution/ |
| **Process Compliance** | Workflows follow their defined BPMN paths | bpmn/bpmn-standards.md |
| **Data Compliance** | Artifacts handled per retention and access policies | process-governance/ |
| **SLA Compliance** | All SLAs tracked; breaches detected and escalated | workflow-monitoring/ |
| **Audit Compliance** | Audit trail is complete, uninterrupted, and tamper-proof | workflow-auditability-system.md |
| **Agent Compliance** | Agents act within their authorized scope and tier | trust-boundaries/ |

---

## Compliance Check Architecture

```
Compliance Engine
├── [Real-Time Monitor] — stream processing of audit events
│   ├── Stream: AUDIT_EVENTS topic
│   ├── Window: sliding 5-minute window
│   └── Detects: immediate violations (constitutional, authority)
│
├── [Periodic Checker] — batch compliance scans
│   ├── Frequency: hourly (SLA), daily (process), weekly (audit chain)
│   └── Detects: accumulated pattern violations, slow SLA drift
│
├── [Compliance Rule Engine]
│   ├── Rules: compliance-rule-catalog (below)
│   ├── Evaluator: CEL expressions + decision models
│   └── Output: compliance findings
│
└── [Remediation Dispatcher]
    ├── MINOR violations → alert + log
    ├── MODERATE violations → alert + create remediation task
    └── CRITICAL violations → escalation case + suspend activity + notify governance
```

---

## Compliance Rule Catalog

### Category: Governance Compliance

```yaml
COMP-GOV-001:
  name: Approval Tier Requirement Met
  description: Every approval node was executed by a principal with sufficient tier
  check: |
    for each APPROVAL_GRANTED event:
      approver.tier >= workflow.node[event.node_id].governance.tier_required
  severity: CRITICAL
  remediation: invalidate approval, re-open for correct tier

COMP-GOV-002:
  name: Quorum Requirements Met
  description: Multi-approver nodes received required number of approvals
  check: |
    for each parallel approval join:
      count(APPROVAL_GRANTED) >= node.required_approver_count
  severity: HIGH
  remediation: notify governance; may need additional approvals if not yet complete

COMP-GOV-003:
  name: No Expired Approvals Used
  description: No workflow proceeded based on an expired approval
  check: |
    for each APPROVAL_GRANTED:
      approval.decided_at < approval.deadline
  severity: CRITICAL
  remediation: void the workflow segment; require fresh approval

COMP-GOV-004:
  name: Override Authorization Complete
  description: All governance overrides had >= 2 Tier-4+ approvals
  check: |
    for each GOVERNANCE_OVERRIDE_APPLIED:
      len(override.approved_by) >= 2
      AND all(approver.tier >= 4 for approver in override.approved_by)
  severity: CRITICAL
  remediation: void the override; escalation case for unauthorized override
```

### Category: Constitutional Compliance

```yaml
COMP-CONST-001:
  name: Constitutional Checks Not Bypassed
  description: Every node marked constitutional_check=true ran PROC-GOV-005
  check: |
    for each node where constitutional_check == true:
      exists CONSTITUTIONAL_CHECK_PASSED event for that node
  severity: CRITICAL
  remediation: immediate suspension + P1 incident

COMP-CONST-002:
  name: No Unresolved Constitutional Violations
  description: Every CONSTITUTIONAL_VIOLATION_DETECTED has a corresponding incident and resolution
  check: |
    for each CONSTITUTIONAL_VIOLATION_DETECTED:
      exists incident with resolved_at != null
  severity: CRITICAL
  remediation: create incident if missing; halt related workflows

COMP-CONST-003:
  name: Constitutional Override Properly Authorized
  description: No constitutional principle was overridden without board-level authorization
  check: |
    for each override targeting constitutional_check node:
      override.approved_by includes executive_sponsor
      AND override.constitutional_acknowledgment == true
  severity: CRITICAL
  remediation: void override; escalate to board
```

### Category: SLA Compliance

```yaml
COMP-SLA-001:
  name: SLA Targets Tracked
  description: All active workflow instances have SLA targets configured
  check: |
    for each RUNNING instance:
      instance.sla_deadline != null
  severity: LOW
  remediation: set missing SLA targets

COMP-SLA-002:
  name: SLA Breach Escalation Triggered
  description: All SLA breaches within last 24h had escalation cases created
  check: |
    for each instance where sla_met == false:
      exists escalation_case with origin.workflow_instance_id == instance.id
  severity: MEDIUM
  remediation: create missing escalation cases retroactively

COMP-SLA-003:
  name: P1 Incidents Responded Within SLA
  description: P1 incidents acknowledged within 15 minutes
  check: |
    for each P1 incident:
      (first_response_at - detected_at) <= PT15M
  severity: HIGH
  remediation: postmortem for missed response; escalate leadership
```

### Category: Audit Compliance

```yaml
COMP-AUD-001:
  name: Audit Chain Integrity
  description: Audit trail hash chain is unbroken for all instances
  check: verify_chain(audit_records_for_period)
  frequency: daily
  severity: CRITICAL
  remediation: forensic investigation; treat as potential security incident

COMP-AUD-002:
  name: No Audit Gaps
  description: All workflow nodes have corresponding audit events
  check: |
    for each DAG node in completed instances:
      exists audit event for that node
  severity: HIGH
  remediation: investigate cause; supplement with reconstructed records if authorized

COMP-AUD-003:
  name: Required Audit Levels Applied
  description: Nodes requiring ENHANCED audit have full payload captured
  check: |
    for each GOVERNANCE, CONSTITUTIONAL, CRITICAL node:
      audit event has full inputs and outputs, not just hashes
  severity: MEDIUM
  remediation: flag for retroactive documentation where possible
```

---

## Compliance Finding Schema

```yaml
compliance_finding:
  finding_id: "COMP-FIND-uuid"
  rule_id: "COMP-XXX-NNN"
  rule_name: string
  
  severity: CRITICAL | HIGH | MEDIUM | LOW
  status: OPEN | ACKNOWLEDGED | REMEDIATED | WAIVED | FALSE_POSITIVE
  
  detected_at: ISO-8601
  detected_by: REAL_TIME_MONITOR | PERIODIC_CHECKER | MANUAL_AUDIT
  
  subject:
    workflow_instance_id: string | null
    node_id: string | null
    agent_id: string | null
    artifact_id: string | null
  
  evidence:
    audit_event_ids: [string]
    description: string
    expected_value: string
    actual_value: string
  
  remediation:
    required: true/false
    action: string
    assigned_to: agent-id | null
    due_date: ISO-8601 | null
    completed_at: ISO-8601 | null
    resolution_notes: string | null
  
  waiver:   # only if status == WAIVED
    waived_by: agent-id
    waived_at: ISO-8601
    tier: 4   # minimum Tier-4 to waive
    rationale: string
    expiry: ISO-8601   # waivers expire; must be re-granted
```

---

## Compliance Score Computation

```yaml
compliance_score:
  period: last_30_days
  
  by_dimension:
    governance: (passing_checks / total_checks) × weight(0.25)
    constitutional: (passing_checks / total_checks) × weight(0.30)  # highest weight
    process: (passing_checks / total_checks) × weight(0.15)
    data: (passing_checks / total_checks) × weight(0.10)
    sla: (passing_checks / total_checks) × weight(0.10)
    audit: (passing_checks / total_checks) × weight(0.10)
  
  hard_penalties:
    any CRITICAL finding open > 24h: deduct 0.20
    unresolved constitutional violation: cap at 0.50
    audit chain integrity failure: cap at 0.30
  
  overall: sum(dimension_scores) with hard_penalties applied
  
  thresholds:
    COMPLIANT: >= 0.90
    NEEDS_ATTENTION: 0.70–0.89
    NON_COMPLIANT: 0.50–0.69
    CRITICAL_NON_COMPLIANCE: < 0.50
```

---

## Compliance Reports

```yaml
reports:
  DAILY_COMPLIANCE_DIGEST:
    content: [new findings, resolved findings, open findings by severity, score trend]
    recipients: [governance-lead, org-leads]
  
  WEEKLY_COMPLIANCE_SUMMARY:
    content: [score by dimension, top violations, escalation trends, remediation rates]
    recipients: [governance-lead, executive-sponsor, all-org-leads]
  
  MONTHLY_COMPLIANCE_BOARD_REPORT:
    content: [score trend 90d, constitutional compliance deep-dive, regulatory readiness]
    recipients: [board, executive-sponsor, governance-lead]
    format: PDF signed by governance-lead
  
  ON_DEMAND_COMPLIANCE_CERTIFICATE:
    content: [point-in-time compliance status for specific process or time range]
    use: regulatory submissions, partner audits
    requires: Tier-4 approval to generate
```
