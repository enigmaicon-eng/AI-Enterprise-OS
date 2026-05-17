# Compliance Reporting Engine

## Purpose
Produces all compliance reports — from real-time operational dashboards to formal regulatory submissions and board-level governance reports. The compliance reporting engine aggregates data from across the compliance architecture into structured, audience-appropriate outputs, ensuring every stakeholder receives the information they need at the frequency they need it, in a format that supports decision-making and accountability.

---

## Report Taxonomy

```yaml
report_taxonomy:
  OPERATIONAL_REPORTS:
    audience: compliance leads, control owners, operations teams
    frequency: daily / weekly
    purpose: real-time situational awareness; operational course correction
    examples: [daily_control_effectiveness_summary, weekly_finding_status_report, evidence_collection_status]
  
  MANAGEMENT_REPORTS:
    audience: Tier-3+ leadership; domain executives
    frequency: monthly / quarterly
    purpose: compliance posture trend; resource prioritization; risk decision-making
    examples: [quarterly_compliance_posture_report, monthly_risk_summary, exception_portfolio_review]
  
  GOVERNANCE_REPORTS:
    audience: Tier-4+ leadership; board committees; general counsel
    frequency: quarterly / annual
    purpose: strategic compliance oversight; governance accountability; regulatory readiness
    examples: [annual_compliance_program_report, board_compliance_briefing, regulatory_readiness_assessment]
  
  REGULATORY_REPORTS:
    audience: regulatory authorities; external auditors; certification bodies
    frequency: per regulatory schedule; on-demand for examinations
    purpose: demonstrate compliance; satisfy legal obligations; support certifications
    examples: [data_protection_impact_assessments, SOC2_management_assertion, regulatory_examination_response]
  
  AUDIT_REPORTS:
    audience: audit stakeholders; management; board audit committee
    frequency: per audit cycle (see audit-management-system.md)
    purpose: formal compliance opinion; finding communication; remediation accountability
    examples: [internal_audit_report, external_audit_opinion, targeted_investigation_report]
```

---

## Report Schema

```yaml
report_record:
  report_id: "RPT-{type}-{year}-{seq}"
  report_type: string                   # from report_taxonomy above
  report_name: string
  
  audience:
    primary_recipients: [agent_id | human_id]
    distribution_list: [agent_id | human_id | external_entity]
    classification: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED
    external_review_required: boolean   # requires legal or compliance lead review before external delivery
  
  period_covered:
    from: ISO-8601
    to: ISO-8601
    report_as_of: ISO-8601              # data freshness point
  
  content_modules: [module_id]          # which report modules are included (see Report Modules below)
  
  generation:
    generated_at: ISO-8601
    generated_by: agent_id | system
    approved_by: agent_id | human_id | null
    approved_at: ISO-8601 | null
    
  integrity:
    report_hash: SHA-256                # hash of final report content
    data_sources: [system_name]         # which systems contributed data
    data_freshness: ISO-8601            # oldest data point in report
  
  status: DRAFT | REVIEW | APPROVED | PUBLISHED | SUPERSEDED
  retained_until: ISO-8601             # per record retention schedule
```

---

## Report Modules

```yaml
report_modules:
  MOD-POSTURE-001:
    name: Compliance Posture Summary
    content:
      - overall_compliance_score: weighted average across all active obligations
      - compliance_rate_by_domain: % controls EFFECTIVE per domain
      - posture_trend: vs. prior period (improving | stable | declining)
      - obligations_fully_covered: count and %
      - obligations_with_gaps: count and detail
    data_source: control-effectiveness-monitor.md + enterprise-risk-register.md
    freshness_requirement: data not older than 24 hours
  
  MOD-FINDING-002:
    name: Finding Portfolio
    content:
      - open_findings_by_severity: CRITICAL/HIGH/MEDIUM/LOW counts
      - new_findings_this_period: list with control and domain
      - closed_findings_this_period: list with verification status
      - overdue_findings: list with owner and days_overdue
      - repeat_findings: list highlighting systemic issues
    data_source: finding-management.md
    freshness_requirement: data not older than 4 hours for operational; 24 hours for management
  
  MOD-RISK-003:
    name: Risk Register Summary
    content:
      - risk_count_by_rating: CRITICAL/HIGH/MEDIUM/LOW
      - risks_at_risk_KRI: list where KRI threshold exceeded
      - risks_with_no_treatment: count and names
      - top_5_risks: highest scoring with treatment status
      - risk_trend: vs. prior period
    data_source: enterprise-risk-register.md
  
  MOD-EXCEPTION-004:
    name: Exception Portfolio
    content:
      - active_exceptions_by_type: count per exception_type
      - exceptions_expiring_in_30d: list requiring renewal attention
      - high_risk_exceptions: CRITICAL and HIGH net_risk exceptions
      - exception_aging: average active duration by type
      - exceptions_past_max_renewals: escalation required
    data_source: exception-management.md
  
  MOD-AUDIT-005:
    name: Audit Status
    content:
      - audits_in_progress: name, phase, projected completion
      - audits_completed_this_period: opinion and finding count
      - findings_from_prior_audits_open: count and SLA status
      - next_scheduled_audits: name and start date
    data_source: audit-management-system.md
  
  MOD-EVIDENCE-006:
    name: Evidence Collection Status
    content:
      - evidence_collection_rate: % controls with current evidence (not older than collection frequency)
      - overdue_evidence: list of controls with stale or missing evidence
      - evidence_rejection_rate: rejections / submissions (target < 5%)
      - manual_evidence_sla_compliance: % of manual evidence submitted on time
    data_source: evidence-collection-engine.md
  
  MOD-REGULATORY-007:
    name: Regulatory Landscape
    content:
      - regulations_in_scope: count and list
      - upcoming_enforcement_dates: sorted chronologically
      - obligation_gap_count: obligations with no covering control
      - recent_regulatory_changes: changes in last 90 days
    data_source: regulatory-registry.md + regulatory-change-management.md
  
  MOD-MATURITY-008:
    name: Compliance Maturity Assessment
    content:
      - maturity_by_domain: current LEVEL_1 through LEVEL_5 per domain
      - maturity_trend: vs. prior assessment
      - target_level_gap: current vs. target (LEVEL_4)
      - improvement_priorities: domains furthest from target
    data_source: compliance-taxonomy.md + self_assessment results
  
  MOD-INCIDENT-009:
    name: Compliance Incident Summary
    content:
      - incidents_this_period: count by severity
      - open_incidents: name, severity, owner, age
      - incidents_notified_to_regulators: count and details
      - incident_trend: vs. prior period
    data_source: compliance-incident-management.md
  
  MOD-THIRDPARTY-010:
    name: Third-Party Risk Summary
    content:
      - vendors_by_risk_tier: CRITICAL/HIGH/MEDIUM/LOW counts
      - vendors_overdue_for_assessment: list
      - vendors_with_open_findings: count
      - recent_vendor_incidents: last 90 days
    data_source: third-party-risk-management.md
```

---

## Standard Report Definitions

```yaml
standard_reports:
  DAILY_OPERATIONS_BRIEFING:
    modules: [MOD-POSTURE-001, MOD-FINDING-002, MOD-EVIDENCE-006]
    audience: compliance operations team
    delivery: 07:00 UTC daily
    classification: INTERNAL
    format: structured summary (machine-readable JSON + human-readable markdown)
    approval: auto-published (no approval required)
  
  WEEKLY_COMPLIANCE_STATUS:
    modules: [MOD-POSTURE-001, MOD-FINDING-002, MOD-RISK-003, MOD-EXCEPTION-004, MOD-EVIDENCE-006]
    audience: domain compliance leads + compliance governance lead
    delivery: Monday 08:00 UTC
    classification: CONFIDENTIAL
    format: structured report with executive summary
    approval: compliance governance lead (auto if no CRITICAL findings; manual if any)
  
  MONTHLY_RISK_AND_COMPLIANCE_REPORT:
    modules: [MOD-POSTURE-001, MOD-FINDING-002, MOD-RISK-003, MOD-EXCEPTION-004, MOD-AUDIT-005, MOD-REGULATORY-007]
    audience: Tier-3+ leadership
    delivery: 5th business day of month
    classification: CONFIDENTIAL
    format: executive report with trend analysis
    approval: compliance governance lead
  
  QUARTERLY_COMPLIANCE_POSTURE_REPORT:
    modules: [all modules]
    audience: Tier-4+ leadership + board compliance committee
    delivery: 15th calendar day following quarter-end
    classification: RESTRICTED
    format: formal governance report with conclusions and recommendations
    approval: Tier-4+ sign-off required before distribution
    regulatory_use: used as basis for certifications and regulatory filings
  
  ANNUAL_COMPLIANCE_PROGRAM_REPORT:
    modules: [all modules] + year-over-year trend analysis + maturity progression
    audience: board; general counsel; regulatory authorities (selective)
    delivery: 45 days after fiscal year-end
    classification: RESTRICTED
    format: comprehensive annual report
    approval: board audit committee acceptance required
    external_review: legal counsel review before any external distribution
```

---

## Compliance Score Computation

```yaml
compliance_score:
  definition: |
    Overall compliance score = weighted average of control effectiveness rates
    across all active obligations, weighted by obligation risk level.
  
  formula:
    compliance_score = Σ(obligation_weight × obligation_coverage_rate) / Σ(obligation_weight)
    
    obligation_weight:
      CRITICAL_obligation: 4
      HIGH_obligation: 3
      MEDIUM_obligation: 2
      LOW_obligation: 1
    
    obligation_coverage_rate:
      all_covering_controls_EFFECTIVE: 1.00
      one_or_more_PARTIALLY_EFFECTIVE, none_INEFFECTIVE: 0.70
      one_or_more_INEFFECTIVE: 0.30
      no_covering_controls: 0.00
  
  score_bands:
    >= 0.90: COMPLIANT (green)
    0.75 – 0.89: SUBSTANTIALLY_COMPLIANT (amber)
    0.60 – 0.74: PARTIALLY_COMPLIANT (orange)
    < 0.60: NON_COMPLIANT (red)
  
  score_override_conditions:
    if_any_CRITICAL_finding_open: maximum score = SUBSTANTIALLY_COMPLIANT (0.89)
    if_BYPASSED_control: maximum score = PARTIALLY_COMPLIANT (0.74)
    if_prohibited_AI_practice_active: score immediately = NON_COMPLIANT (override all)
```

---

## Report Distribution and Delivery

```yaml
distribution:
  delivery_channels:
    INTERNAL_DASHBOARD: real-time delivery to compliance-operations-dashboard.md
    INTER_AGENT_MESSAGE: delivered via ARTIFACT_HANDOFF message for agent consumers
    SECURE_DOCUMENT_STORE: CONFIDENTIAL and RESTRICTED reports stored with access control
    REGULATORY_SUBMISSION: external delivery reviewed by legal counsel; delivery logged
  
  access_control:
    PUBLIC: no access restriction
    INTERNAL: authenticated enterprise principals
    CONFIDENTIAL: compliance team + named report recipients
    RESTRICTED: named recipients only; access audit trail required
  
  acknowledgment_tracking:
    CRITICAL_reports: recipients must acknowledge receipt within 24 hours
    QUARTERLY_GOVERNANCE_reports: board sign-off tracked
    unacknowledged_reports: reminder at 48h; escalation at 72h
  
  report_retention:
    operational_reports: 3 years
    management_and_governance_reports: 7 years
    regulatory_submissions: 10 years (per regulatory requirement)
    board_approved_annual_reports: permanent
```

---

## Integration Points

| System | Role |
|---|---|
| `audit-and-evidence/finding-management.md` | Finding data for MOD-FINDING-002 |
| `risk-and-controls/enterprise-risk-register.md` | Risk data for MOD-RISK-003 |
| `risk-and-controls/exception-management.md` | Exception data for MOD-EXCEPTION-004 |
| `audit-and-evidence/audit-management-system.md` | Audit status for MOD-AUDIT-005 |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence data for MOD-EVIDENCE-006 |
| `compliance-framework/regulatory-registry.md` | Regulatory landscape for MOD-REGULATORY-007 |
| `governance-operations/compliance-operations-dashboard.md` | Operational reports delivered here |
| `governance-operations/governance-executive-reporting.md` | Governance reports consumed here |
| `audit-and-evidence/audit-trail-governance.md` | All report generation events logged |
