# Regulatory Change Management

## Purpose
Governs the enterprise's process for detecting, assessing, and responding to changes in the regulatory environment. Regulations change — new laws are enacted, existing regulations are amended, enforcement interpretations shift, and regulatory guidance is issued. Without a systematic process, regulatory changes silently create compliance gaps. This system ensures every regulatory change is captured, analyzed for impact, and translated into updated obligations, controls, and policies before the effective date.

---

## Change Detection

```yaml
change_detection:
  monitoring_sources:
    OFFICIAL_REGULATORY_SOURCES:
      description: Primary — direct monitoring of regulatory authority publications
      examples:
        - EU Official Journal (GDPR, EU AI Act, NIS2 directives)
        - national data protection authority publications
        - SEC and FINRA regulatory notices
        - ISO and standards body publications
      monitoring: automated subscription to official channels; daily scan
      reliability: AUTHORITATIVE
    
    LEGAL_COUNSEL_ALERTS:
      description: External legal counsel tracking regulatory developments
      SLA: 72 hours from publication to alert submission
      format: structured alert with regulatory_id, effective_date, summary, and preliminary impact assessment
      reliability: HIGH (expert-curated)
    
    REGULATORY_INTELLIGENCE_SERVICES:
      description: Third-party regulatory intelligence subscriptions
      purpose: broader horizon scanning; emerging regulations not yet in official monitoring
      reliability: MEDIUM (pre-publication intelligence; may not be accurate)
      use_when: horizon scanning only; confirm via official sources before acting
    
    INDUSTRY_BODY_ALERTS:
      description: Industry associations and trade groups regulatory newsletters
      purpose: peer benchmarking on regulatory interpretation
      reliability: MEDIUM (interpretation varies; legal counsel confirmation required)
    
    AGENT_GENERATED_SIGNALS:
      description: Compliance agents monitoring for regulatory references in their domain work
      trigger: any agent that processes regulatory text should flag material changes
      SLA: flag within 24 hours of encountering new regulatory reference
  
  monitoring_schedule:
    daily: official regulatory journal scans (automated)
    weekly: legal counsel regulatory briefing
    monthly: comprehensive horizon scan across all in-scope jurisdictions
    quarterly: regulatory landscape review with full obligation crosswalk update
```

---

## Regulatory Change Record Schema

```yaml
regulatory_change_record:
  change_id: "REGCHG-{regulation_id}-{seq}"
  
  change_classification:
    change_type: NEW_REGULATION | AMENDMENT | ENFORCEMENT_GUIDANCE | INTERPRETATION_UPDATE | DEADLINE_CHANGE | PENALTY_UPDATE | EXEMPTION_CHANGE
    source_regulation: string          # regulation_id from regulatory-registry.md
    affected_jurisdictions: [string]
    effective_date: ISO-8601           # when does this change take effect?
    enforcement_start_date: ISO-8601 | null  # when will authorities begin enforcement?
    grace_period_days: int | null
  
  content:
    summary: string                    # what changed? (plain language)
    specific_provisions_changed: [string]    # which articles, sections, or provisions
    full_text_reference: URI           # link to official publication
    change_category: OBLIGATION_EXPANDED | OBLIGATION_NARROWED | NEW_OBLIGATION | OBLIGATION_REMOVED | PROCESS_CHANGE | PENALTY_CHANGE | INTERPRETATION
  
  impact_assessment:
    assessed_by: agent_id | human_id
    assessed_at: ISO-8601
    
    obligation_impact:
      new_obligations: [obligation_schema]   # new obligations this change creates
      modified_obligations: [{obligation_id, change_description}]
      removed_obligations: [obligation_id]
    
    control_impact:
      controls_requiring_update: [{control_id, update_required}]
      new_controls_required: [control_id]   # controls to be created
      controls_to_retire: [control_id]
    
    policy_impact:
      policies_requiring_update: [{policy_id, update_required}]
    
    evidence_impact:
      evidence_requirements_changed: boolean
      change_description: string | null
    
    enterprise_risk_impact:
      risk_ids_affected: [risk_id]
      severity_change: INCREASED | DECREASED | UNCHANGED
      penalty_regime_change: string | null   # if penalty structure changed
    
    overall_impact_rating: CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL
    business_impact_description: string
  
  remediation:
    response_plan: string              # how will the enterprise respond to this change?
    response_owner: agent_id | human_id
    target_compliance_date: ISO-8601   # must be before effective_date
    milestones: [{milestone, owner, due_date}]
    
  status: DETECTED | UNDER_ASSESSMENT | RESPONSE_PLANNED | IN_REMEDIATION | REMEDIATED | MONITORING
  
  governance:
    created_at: ISO-8601
    notified_to: [agent_id | human_id]   # who was notified of this change?
    escalated_to: [agent_id | human_id] | null
    audit_trail: [event]
```

---

## Impact Assessment Protocol

```yaml
impact_assessment_protocol:
  step_1_initial_triage:
    action: classify change_type and estimate impact_rating
    SLA: within 24 hours of detection
    output: impact_rating (HIGH estimate → escalate immediately)
    who: regulatory change management agent
  
  step_2_obligation_analysis:
    action: map change to existing obligation catalog; identify new/modified/removed obligations
    method: crosswalk change text against obligation_ids in regulatory-registry.md
    SLA: within 5 business days (CRITICAL/HIGH impact: within 2 business days)
    who: domain compliance lead + legal counsel (for HIGH/CRITICAL)
  
  step_3_control_gap_analysis:
    action: for each new or modified obligation, identify covering controls
    method: check control-catalog.md for controls covering affected obligations
    gaps: obligations with no covering control → NEW_FINDING (GAP type); HIGH severity minimum
    SLA: within 5 business days of obligation analysis completion
    who: domain compliance lead + control owner
  
  step_4_policy_gap_analysis:
    action: identify policies that must be updated to reflect the regulatory change
    SLA: within 5 business days of obligation analysis
    who: policy owner (per policy-management-system.md) + domain compliance lead
  
  step_5_risk_reassessment:
    action: if impact_rating HIGH or CRITICAL, update enterprise-risk-register.md
    action: if penalty regime changed, update risk assessment impact scores
    SLA: within 10 business days of impact assessment completion
    who: risk assessment engine + compliance governance lead
  
  step_6_response_plan:
    action: define remediation plan with owners, milestones, and target compliance date
    requirement: target compliance date MUST be before regulatory effective date
    escalation: if target date cannot be met → exception-management.md process; CRITICAL risk
    approval: compliance governance lead; Tier-3+ if impact_rating CRITICAL
    SLA: response plan approved within 10 business days of impact assessment
```

---

## Response SLAs by Impact Rating

```yaml
response_slas:
  CRITICAL_impact:
    initial_notification: Tier-4+ within 24 hours of detection
    obligation_analysis: 2 business days
    response_plan_approval: 5 business days
    gap_remediation_start: immediate (no waiting for full assessment)
    notes:
      - CRITICAL changes include new enforcement mechanisms, prohibited practices, or penalties > €10M
      - legal counsel engaged immediately for CRITICAL changes
  
  HIGH_impact:
    initial_notification: compliance governance lead within 48 hours; Tier-3+ within 5 business days
    obligation_analysis: 5 business days
    response_plan_approval: 10 business days
  
  MEDIUM_impact:
    initial_notification: domain compliance lead within 5 business days
    obligation_analysis: 10 business days
    response_plan_approval: 20 business days
  
  LOW_impact:
    initial_notification: include in weekly regulatory digest
    obligation_analysis: 20 business days (next regular review cycle acceptable)
    response_plan_approval: 30 business days
  
  INFORMATIONAL:
    action: log in regulatory change registry; include in next quarterly regulatory review
    no_mandatory_response: advisory only; monitor for escalation
```

---

## Regulatory Horizon Scanning

```yaml
horizon_scanning:
  purpose: identify regulatory changes before they take effect; avoid reactive compliance
  
  horizon_categories:
    IMMINENT: effective within 180 days (requires immediate attention)
    EMERGING: effective within 12 months (planning phase)
    DEVELOPING: effective within 36 months (strategic monitoring)
    SPECULATIVE: proposed; not yet enacted (awareness only)
  
  priority_jurisdictions:
    TIER_1_always_monitored: [EU, US_Federal, UK, Canada]
    TIER_2_monitored_for_active_operations: [jurisdictions where enterprise has operations or customers]
    TIER_3_horizon_only: [major regulatory developments globally that may influence TIER_1]
  
  quarterly_horizon_report:
    contents:
      - all IMMINENT changes with remediation status
      - all EMERGING changes with preliminary impact assessment
      - top 3 DEVELOPING changes to watch
      - regulatory trend analysis (is regulatory burden increasing in key domains?)
    audience: compliance governance lead + Tier-3+ leadership
    delivered: 15th calendar day following quarter-end
  
  horizon_failure_indicator: |
    If the enterprise is surprised by a regulatory change (i.e., an enforcement action or
    examination finding reveals a gap caused by a change that was not detected), this is a
    systemic failure of horizon scanning. Any such event triggers an immediate review of
    monitoring sources and detection protocols.
```

---

## Regulatory Change Analytics

```yaml
change_analytics:
  portfolio_view:
    changes_detected_ytd: count
    by_impact_rating: distribution
    by_regulation: which regulations are changing most frequently
    by_status: UNDER_ASSESSMENT / IN_REMEDIATION / REMEDIATED
    changes_past_target_date: count (enterprises still remediating after effective date)
  
  response_metrics:
    average_time_detection_to_response_plan: by impact_rating (trend metric)
    on_time_compliance_rate: % of changes remediated before effective_date (target: 100%)
    gap_finding_generation_rate: changes that created gap findings (indicator of reactive posture)
  
  alerts:
    change_approaching_effective_date_not_remediated: alert 60 days before; CRITICAL alert 30 days before
    high_impact_change_not_assessed: alert if CRITICAL or HIGH change remains UNDER_ASSESSMENT > 5 days
    response_plan_milestone_overdue: alert to owner + compliance governance lead
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/regulatory-registry.md` | Source of truth for regulations; updated as changes assessed |
| `compliance-framework/control-catalog.md` | Controls updated as new obligations identified |
| `compliance-framework/policy-management-system.md` | Policies updated per regulatory change |
| `risk-and-controls/enterprise-risk-register.md` | Risks updated when regulatory landscape changes |
| `audit-and-evidence/finding-management.md` | Obligation gaps from regulatory changes generate findings |
| `audit-and-evidence/audit-management-system.md` | Regulatory examination notices processed here |
| `governance-operations/governance-executive-reporting.md` | Horizon scanning included in board reports |
| `governance-operations/compliance-operations-dashboard.md` | Panel 5 regulatory readiness fed by this system |
