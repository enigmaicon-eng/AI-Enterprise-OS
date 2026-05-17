# Audit Management System

## Purpose
Governs the planning, execution, and reporting of all compliance audits — internal audits conducted by the enterprise compliance function, external audits by independent auditors, and regulatory examinations by government or standards bodies. The audit management system ensures every audit is systematic, evidence-based, well-documented, and drives improvement through finding management and remediation tracking.

---

## Audit Types

```yaml
audit_types:
  INTERNAL_COMPLIANCE_AUDIT:
    definition: Audit conducted by enterprise compliance function to assess internal compliance posture
    frequency: annually (comprehensive); quarterly (targeted domain audits)
    conducted_by: compliance governance lead + domain compliance leads
    independence: auditors must not own or operate controls being audited
    output: [internal_audit_report, finding_list, remediation_plan]
    authority: Tier-3 oversight; findings escalated to Tier-4+ if CRITICAL
  
  EXTERNAL_AUDIT:
    definition: Independent audit by accredited third-party auditor
    frequency: annually for SOC2 Type II; per engagement schedule for other certifications
    conducted_by: accredited external audit firm
    enterprise_role: audit client; provide evidence; respond to findings
    output: [audit_opinion, management_letter, attestation_report]
    authority: auditor findings are formal; must be tracked to resolution
  
  REGULATORY_EXAMINATION:
    definition: Examination conducted by regulatory authority (e.g., Data Protection Authority, banking regulator)
    trigger: scheduled examination; complaint-driven; random selection
    enterprise_role: regulatory subject; cooperation is mandatory
    output: examination report; formal orders; potential penalties
    authority: HIGHEST — regulatory orders are legally binding
    pre_exam_preparation: triggered 90 days before any known examination
  
  SELF_ASSESSMENT:
    definition: Structured self-review by control owners and compliance leads
    frequency: quarterly (between formal audits)
    method: control-testing-engine results + evidence review + compliance rate measurement
    output: quarterly compliance posture report
    limitation: cannot substitute for external or regulatory examination
  
  TARGETED_INVESTIGATION:
    definition: Focused investigation triggered by a specific incident, finding, or regulatory inquiry
    trigger: CRITICAL finding; compliance incident; regulatory inquiry; whistleblower report
    scope: targeted (specific domain, control set, or time period)
    independence: auditors must be independent of the investigated area
    output: investigation report with findings and root cause analysis
    escalation: always to Tier-4+; potential board notification
```

---

## Audit Plan Schema

```yaml
audit_plan:
  audit_id: "AUD-{year}-{seq}"
  audit_type: string
  audit_name: string
  
  scope:
    domains: [string]               # compliance domains in scope
    controls_in_scope: [control_id]
    obligations_in_scope: [obligation_id]
    excluded_from_scope: [string]   # with documented reason for exclusion
    audit_period: {from: ISO-8601, to: ISO-8601}
    geographic_scope: [jurisdiction]
  
  team:
    lead_auditor: agent_id | human_id
    audit_team: [agent_id | human_id]
    independence_confirmed: boolean
    independence_assessment: string  # documentation of independence verification
    external_auditor: string | null  # firm name for external audits
  
  timeline:
    planning_complete: ISO-8601
    fieldwork_start: ISO-8601
    fieldwork_end: ISO-8601
    draft_report_issued: ISO-8601
    management_response_due: ISO-8601
    final_report_issued: ISO-8601
    total_planned_days: int
  
  risk_based_focus:
    highest_risk_areas: [string]    # areas identified by risk register for additional scrutiny
    prior_findings_follow_up: [finding_id]  # findings from prior cycle that must be re-tested
    regulatory_focus_areas: [string]  # areas regulatory authorities are currently emphasizing
  
  methodology:
    testing_approach: SUBSTANTIVE | CONTROLS_BASED | COMBINED
    sampling_method: string
    documentation_standard: string  # what audit documentation standards apply?
  
  status: PLANNING | FIELDWORK | REPORTING | COMPLETE | CANCELLED
```

---

## Audit Execution Protocol

```yaml
audit_execution:
  phase_1_planning:
    step_1_scope_definition: define audit scope and objectives based on risk register + prior findings
    step_2_team_assembly: identify and confirm audit team; document independence
    step_3_risk_assessment: identify highest-risk areas within scope; focus testing
    step_4_test_program_development: develop test steps for each in-scope control
    step_5_document_request: prepare evidence request list; notify control owners
    step_6_kickoff_meeting: brief stakeholders on scope, timeline, and expectations
    output: approved audit_plan
  
  phase_2_fieldwork:
    step_1_evidence_collection: collect evidence per document request and test program
    step_2_control_testing: execute test procedures per control-testing-engine.md protocols
    step_3_walkthroughs: process walkthroughs with control owners
    step_4_issue_identification: identify and document potential findings in real time
    step_5_management_communication: regular status updates to audit stakeholders
    step_6_preliminary_findings: communicate preliminary findings to control owners before draft report
    
    fieldwork_quality_controls:
      working_paper_review: all working papers reviewed by lead auditor
      evidence_adequacy_check: evidence meets standards from control-testing-engine.md
      finding_validation: all findings must have evidence_refs; cannot be based on inquiry alone
  
  phase_3_reporting:
    step_1_draft_report: prepare draft audit report per TEMPLATE-AUD-001
    step_2_management_review: 10 business day management response window
    step_3_management_responses: document management responses per finding
    step_4_final_report: finalize report incorporating or noting management responses
    step_5_distribution: distribute per distribution_list (see report schema below)
    step_6_finding_entry: all findings entered into finding-management.md
  
  phase_4_follow_up:
    timing: 30/60/90 days after report issuance (per finding SLA)
    action: verify remediation evidence for each finding
    escalation: findings past SLA without remediation → escalate to Tier-3+
```

---

## Audit Report Schema

```yaml
audit_report:
  report_id: "AUD-RPT-{audit_id}"
  audit_id: string (references audit_plan)
  report_type: DRAFT | FINAL
  
  executive_summary:
    overall_compliance_opinion: COMPLIANT | SUBSTANTIALLY_COMPLIANT | NON_COMPLIANT
    key_strengths: [string]
    key_findings_count: {CRITICAL: int, HIGH: int, MEDIUM: int, LOW: int}
    most_significant_finding: finding_id | null
    period_covered: {from: ISO-8601, to: ISO-8601}
    scope_summary: string
  
  detailed_findings:
    findings: [finding_id]  # all findings generated by this audit
    prior_cycle_findings_resolved: [finding_id]
    prior_cycle_findings_repeated: [finding_id]  # findings from last cycle that recurred
    new_risks_identified: [risk_id]
  
  control_effectiveness_summary:
    by_domain: [{domain, controls_tested, effective_pct, partially_effective_pct, ineffective_pct}]
    controls_with_design_gaps: [control_id]
    controls_with_operating_failures: [control_id]
  
  obligation_coverage_summary:
    obligations_assessed: int
    fully_covered: int
    partially_covered: int
    gaps_identified: int
    gap_details: [obligation_id + gap_description]
  
  management_responses:
    responses: [{finding_id, management_response, remediation_plan, target_date, owner}]
    unresponded_findings: [finding_id]  # findings management has not responded to
  
  auditor_conclusion:
    opinion_basis: string
    limitations: [string]  # any limitations on scope or evidence
    independence_declaration: string
  
  distribution:
    internal: [Tier-4+ leadership, compliance governance lead, domain owners for in-scope domains]
    external: [external auditor (if internal audit shared for reliance), regulatory (if required)]
  
  metadata:
    issued_by: audit_team lead
    issued_at: ISO-8601
    approved_by: Tier-4+ for internal audits; external auditor for external audits
    retention: 7 years
    classification: CONFIDENTIAL
```

---

## Pre-Examination Preparation Protocol

```yaml
pre_examination_preparation:
  trigger: 90 days before known regulatory examination
  
  step_1_readiness_assessment:
    action: run full self-assessment of all controls in examination scope
    output: readiness_gap_report (where are we not ready?)
  
  step_2_gap_remediation:
    action: immediate remediation of any CRITICAL or HIGH gaps found in readiness assessment
    priority: CRITICAL gaps → remediation within 30 days; HIGH → within 60 days
  
  step_3_evidence_readiness:
    action: pre-collect and organize all evidence that examiner will likely request
    format: organized by control, obligation, and time period
    review: legal counsel review of evidence package
  
  step_4_team_preparation:
    action: brief all relevant personnel on examination scope and their roles
    preparation: dry-run interviews with control owners
    protocol: document who speaks to examiners and on what topics
  
  step_5_regulatory_relationship:
    action: if applicable, notify regulatory body of examination readiness
    action: confirm examination logistics, scope, and timeline
  
  step_6_examination_response_protocol:
    define: who receives examiner requests; SLA for responding (target: 24 hours)
    define: escalation path for sensitive or unexpected requests
    define: legal privilege considerations; what requires counsel review before disclosure
  
  examination_day_protocol:
    logistics: examination room, document access, personnel availability
    requests: all examiner requests logged in real time
    responses: all responses reviewed before delivery; legal counsel on standby
    daily_debrief: audit team debriefs each examination day
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | Controls tested per audit scope |
| `risk-and-controls/enterprise-risk-register.md` | Risk-based scope determination |
| `risk-and-controls/control-testing-engine.md` | Test protocols used in fieldwork |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence gathered for audits |
| `audit-and-evidence/finding-management.md` | All audit findings entered here |
| `audit-and-evidence/compliance-reporting-engine.md` | Audit reports formatted and distributed |
| `governance-operations/regulatory-change-management.md` | Regulatory examination notices processed |
