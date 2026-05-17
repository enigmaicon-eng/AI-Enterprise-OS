# Finding Management

## Purpose
Governs the full lifecycle of compliance findings — from initial identification through remediation verification and closure. A finding is a documented, evidence-backed instance where a control has failed, an obligation is unsatisfied, or a compliance gap has been identified. Finding management transforms deficiencies from informal observations into tracked, accountable work items with owners, deadlines, and verified resolution.

---

## Finding Schema

```yaml
finding_record:
  finding_id: "FND-{source}-{seq}"
  # source: CTL (control test), AUD (audit), REG (regulatory), INC (incident), SELF (self-assessment)
  
  classification:
    severity: CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL
    finding_type: CONTROL_FAILURE | DESIGN_GAP | OBLIGATION_GAP | EVIDENCE_GAP | POLICY_VIOLATION | REPEAT_FINDING
    domain: DATA_PRIVACY | INFORMATION_SECURITY | AI_GOVERNANCE | OPERATIONAL | FINANCIAL | ETHICS_AND_CONDUCT | CONTRACTUAL | ESG
  
  description:
    title: string                        # short, unambiguous title
    condition: string                    # what was found? (specific and factual)
    criteria: string                     # what should exist? (the control, policy, or obligation requirement)
    cause: string                        # why does this gap exist? (root cause if known; else "under investigation")
    effect: string                       # what is the actual or potential impact?
    population_affected: string          # what entities, systems, or data are affected?
  
  evidence:
    evidence_refs: [evidence_id]        # all evidence supporting this finding
    cannot_be_inquiry_alone: boolean    # enforces RULE-ET-001; always true for CRITICAL/HIGH
    test_id: string | null              # if generated from a test
    audit_id: string | null            # if generated from an audit
  
  control_linkage:
    failed_control_ids: [control_id]    # controls that failed
    obligation_ids: [obligation_id]     # obligations put at risk by this finding
    risk_ids: [risk_id]                 # risks elevated by this finding
    exception_id: string | null        # if this finding arises from an expired/violated exception
  
  remediation:
    owner: agent_id | human_id         # person/agent accountable for remediation
    remediation_plan: string           # specific, actionable steps
    target_date: ISO-8601              # required; computed from severity SLA below
    interim_mitigation: string | null  # steps taken immediately to reduce risk while full remediation proceeds
    remediation_type: ROOT_CAUSE_FIX | COMPENSATING_CONTROL | EXCEPTION_FILED | RISK_ACCEPTED
  
  management_response:
    responded_at: ISO-8601 | null
    response: string | null            # management's acknowledgment and plan
    disputed: boolean                  # is management disputing the finding?
    dispute_reason: string | null
    dispute_resolution: string | null  # resolution after challenge process
  
  lifecycle:
    identified_at: ISO-8601
    identified_by: agent_id | human_id
    acknowledged_at: ISO-8601 | null
    remediation_started_at: ISO-8601 | null
    remediation_complete_at: ISO-8601 | null
    verified_at: ISO-8601 | null
    verified_by: agent_id | human_id | null   # must be independent of finding owner
    closed_at: ISO-8601 | null
    status: OPEN | ACKNOWLEDGED | IN_REMEDIATION | REMEDIATED_PENDING_VERIFICATION | CLOSED | DISPUTED | ESCALATED | OVERDUE
  
  repeat_finding_tracking:
    is_repeat: boolean                 # has this finding appeared in prior cycles?
    prior_finding_ids: [finding_id]    # prior cycle findings this repeats
    repeat_count: int                  # 0 = first occurrence; increment with each recurrence
  
  metadata:
    created_at: ISO-8601
    last_updated: ISO-8601
    classification: CONFIDENTIAL
    retained_until: ISO-8601           # 7 years from closure
```

---

## Severity SLAs and Escalation Rules

```yaml
severity_slas:
  CRITICAL:
    remediation_plan_deadline: 24 hours from identification
    interim_mitigation_deadline: 4 hours from identification
    full_remediation_target: 30 days maximum (may be less based on risk)
    notification: Tier-4+ within 1 hour; board notification if remediation > 7 days
    overdue_action: immediate Tier-4+ alert; board notification; governance incident declared
    verification_requirement: independent verification by compliance governance lead minimum
  
  HIGH:
    remediation_plan_deadline: 3 business days
    full_remediation_target: 60 days
    notification: Tier-3+ within 24 hours
    overdue_action: escalate to Tier-3+; weekly status reporting required
    verification_requirement: independent verification required
  
  MEDIUM:
    remediation_plan_deadline: 10 business days
    full_remediation_target: 90 days
    notification: domain compliance lead within 3 business days
    overdue_action: escalate to compliance governance lead; monthly status required
    verification_requirement: independent reviewer assigned
  
  LOW:
    remediation_plan_deadline: 20 business days
    full_remediation_target: 180 days
    notification: domain compliance lead; include in next quarterly report
    overdue_action: escalate to domain compliance lead; note in quarterly report
    verification_requirement: reviewer may be from same team but not same role
  
  INFORMATIONAL:
    remediation_plan_deadline: none required
    full_remediation_target: best-effort; no SLA
    notification: include in audit report; no immediate notification
    verification_requirement: none (informational only; no formal verification required)
```

---

## Finding Generation Rules

```yaml
finding_generation:
  automatic_generators:
    CONTROL_TEST_ENGINE:
      trigger: test result = INEFFECTIVE
      severity_mapping:
        CRITICAL_obligation_coverage: CRITICAL finding
        HIGH_obligation_coverage: HIGH finding
        MEDIUM_obligation_coverage: MEDIUM finding
        LOW_obligation_coverage: LOW finding
      also_generates: if test is OVERDUE by 30+ days → MEDIUM finding; 60+ days → HIGH finding
    
    CONTROL_EFFECTIVENESS_MONITOR:
      trigger: effectiveness state = DEGRADED → MEDIUM finding; FAILED → HIGH or CRITICAL; BYPASSED → CRITICAL always
      severity_escalation: BYPASSED always generates CRITICAL regardless of obligation level
    
    EXCEPTION_MANAGEMENT:
      trigger: exception expires without renewal → HIGH finding
      trigger: exception violated (compensating control fails while exception active) → severity = net_risk_level of exception
    
    AUDIT_MANAGEMENT_SYSTEM:
      trigger: audit fieldwork identifies deficiency
      severity: determined by lead auditor; must cite evidence_refs (cannot be inquiry alone for CRITICAL/HIGH)
    
    REGULATORY_CHANGE_MANAGEMENT:
      trigger: new obligation identified with no covering control → gap finding
      severity: matches obligation risk level
  
  manual_generation:
    who_can_generate: any compliance lead; auditors; control owners (for self-identified issues)
    required_fields: [title, condition, criteria, cause, effect, evidence_refs, failed_control_ids]
    cannot_create_without_evidence: CRITICAL and HIGH findings require at least one non-inquiry evidence item
  
  repeat_finding_detection:
    mechanism: on finding creation, search prior 24-month window for matching control_id and finding_type
    if_match_found: set is_repeat=true; populate prior_finding_ids; increment repeat_count
    repeat_escalation:
      repeat_once: severity upgraded by one level (MEDIUM → HIGH)
      repeat_twice_or_more: severity upgraded to HIGH minimum; notify compliance governance lead; root cause analysis required
```

---

## Finding Lifecycle Management

```yaml
finding_lifecycle:
  IDENTIFICATION:
    action: finding_record created with OPEN status
    notification: per severity SLA above
    finding_owner_assignment: automatic for control-generated findings (control owner); manual assignment for audit findings
  
  ACKNOWLEDGMENT:
    SLA: 24 hours for CRITICAL/HIGH; 3 business days for MEDIUM/LOW
    action: finding_owner acknowledges; confirms or disputes finding
    if_disputed: status → DISPUTED; compliance governance lead reviews within 5 business days
    dispute_outcome: SUSTAINED (finding stands) | DOWNGRADED (severity reduced with documented reason) | WITHDRAWN (finding removed with documented reason)
  
  REMEDIATION_PLANNING:
    owner: finding_owner
    plan_contents: [specific steps, resource assignments, dependencies, milestone dates, interim mitigation]
    plan_approval: approved by compliance governance lead for CRITICAL/HIGH; domain lead for MEDIUM/LOW
    plan_locked: once approved, plan changes require re-approval at same tier
  
  REMEDIATION_EXECUTION:
    status → IN_REMEDIATION when first remediation step completed
    progress_updates:
      CRITICAL: daily updates
      HIGH: weekly updates
      MEDIUM: bi-weekly updates
      LOW: monthly updates
    overdue_trigger: if target_date passes without REMEDIATED_PENDING_VERIFICATION → status = OVERDUE; escalation per severity SLA
  
  VERIFICATION:
    trigger: finding_owner reports remediation complete; status → REMEDIATED_PENDING_VERIFICATION
    verifier: must be independent of finding_owner (enforced)
    verification_method:
      CRITICAL/HIGH: re-test the control (operating effectiveness test); re-examine evidence
      MEDIUM: inspect remediation artifacts; run targeted test if feasible
      LOW: inspect documented remediation; attestation acceptable with corroboration
    verification_outcome:
      VERIFIED: finding closed; status → CLOSED
      NOT_VERIFIED: finding remains OPEN; remediation_plan updated; new target_date set
    verification_SLA: 10 business days for CRITICAL/HIGH; 15 business days for MEDIUM/LOW
  
  CLOSURE:
    on_closure: all linked control_ids re-evaluated for effectiveness state
    closure_evidence: verification record retained 7 years
    risk_register_update: if finding closure improves residual risk → risk_assessment_engine updates score
    learning: finding summary published to knowledge management for pattern recognition
```

---

## Remediation Tracking

```yaml
remediation_tracking:
  portfolio_view:
    open_findings_by_severity: count per severity
    overdue_findings: count; names of overdue findings owners
    findings_by_domain: distribution across compliance domains
    repeat_finding_rate: repeat_count / total_findings (target < 10%)
    mean_time_to_remediate: by severity (trend metric)
  
  owner_view:
    per_owner: [open findings, overdue findings, next milestone]
    escalation_trigger: if owner has >= 2 OVERDUE findings → notify manager + compliance governance lead
  
  trend_analysis:
    new_vs_closed_rate: are we closing findings faster than we generate them?
    severity_drift: is average severity increasing or decreasing over time?
    domain_concentration: which domain generates the most findings? (focus area for next audit)
    root_cause_patterns: recurring causes across findings (systemic vs. isolated)
  
  quarterly_summary:
    report_to: compliance governance lead + Tier-3+
    contents: [opened, closed, overdue, repeat findings, domain distribution, trend metrics]
```

---

## Finding Dispute Process

```yaml
dispute_process:
  who_can_dispute: finding_owner (within 10 business days of finding issuance)
  grounds_for_dispute: [factual_error_in_condition, wrong_criteria_applied, evidence_misinterpreted, severity_miscalibrated]
  invalid_grounds: [finding_is_inconvenient, remediation_is_difficult, business_priority_conflicts]
  
  dispute_resolution:
    step_1: compliance governance lead reviews dispute within 5 business days
    step_2: review evidence with fresh eyes; may interview finding_owner and finding_generator
    step_3: outcome (SUSTAINED | DOWNGRADED | WITHDRAWN) with written rationale
    
    note: CRITICAL findings cannot be withdrawn based solely on management assertion; require independent evidence review
    note: dispute does not pause SLA clock for remediation (findings continue aging during dispute)
```

---

## Integration Points

| System | Role |
|---|---|
| `risk-and-controls/control-testing-engine.md` | INEFFECTIVE test results generate findings |
| `risk-and-controls/control-effectiveness-monitor.md` | DEGRADED/FAILED/BYPASSED states generate findings |
| `risk-and-controls/exception-management.md` | Expired or violated exceptions generate findings |
| `audit-and-evidence/audit-management-system.md` | Audit fieldwork generates findings; all findings entered here |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence referenced in finding records |
| `audit-and-evidence/compliance-reporting-engine.md` | Findings included in all compliance reports |
| `risk-and-controls/enterprise-risk-register.md` | Open CRITICAL/HIGH findings update residual risk ratings |
| `governance-operations/compliance-operations-dashboard.md` | Finding portfolio displayed in real time |
