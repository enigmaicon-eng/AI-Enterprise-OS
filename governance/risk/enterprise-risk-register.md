# Enterprise Risk Register

## Purpose
The authoritative repository of all compliance and governance risks facing the enterprise. The risk register tracks every identified risk from initial identification through assessment, treatment, monitoring, and closure. It provides the risk intelligence that drives control investment, compliance prioritization, and executive decision-making.

---

## Risk Register Architecture

```
Risk Sources
├── Obligation Gap Analysis      → obligation not covered by any control
├── Control Failure Events       → control found INEFFECTIVE or PARTIALLY_EFFECTIVE
├── Audit Findings               → HIGH+ findings generate or update risk entries
├── Incident Post-Mortems        → incidents reveal previously unknown risks
├── Regulatory Change            → new regulations create new risk exposure
├── Threat Intelligence          → emerging threats assessed for applicability
└── Self-Assessment              → periodic risk identification workshops

        ↓ all sources feed

[Enterprise Risk Register]
├── Risk Identification and Entry
├── Risk Assessment (likelihood × impact)
├── Risk Treatment Planning
├── Control Effectiveness Monitoring
├── Risk KRI Tracking
└── Risk Reporting and Escalation
```

---

## Active Risk Catalog

```yaml
active_risks:
  AI_GOVERNANCE_RISKS:
    RSK-AIGOV-001:
      name: eu_ai_act_non_compliance_high_risk_systems
      description: Enterprise AI systems operating in EU market may qualify as HIGH_RISK under EU AI Act without complete conformity assessment
      domain: AI_GOVERNANCE
      category: REGULATORY
      likelihood: 4  # LIKELY — enforcement begins 2026; systems currently not fully assessed
      impact: 5  # CATASTROPHIC — max fine €35M or 7% global turnover; operating restrictions
      inherent_risk_score: 20  # CRITICAL
      control_ids: [CTL-AI-001, CTL-AI-002, CTL-AI-004, CTL-AI-005]
      residual_risk_level: HIGH  # controls partially in place; conformity assessment incomplete
      risk_tolerance: MITIGATE
      treatment_deadline: "2026-08-01"  # EU AI Act full enforcement date
      treatment_owner: AI_Governance_Lead
      kris:
        - {indicator: "ai_systems_with_completed_conformity_assessment_pct", threshold: 1.00, current: 0.65, status: AT_RISK}
        - {indicator: "high_risk_ai_systems_without_human_oversight_count", threshold: 0, current: 2, status: BREACHED}
    
    RSK-AIGOV-002:
      name: ai_model_bias_leading_to_discriminatory_outcomes
      description: AI models used in decisions affecting people may produce biased outputs that violate anti-discrimination obligations and AI ethics requirements
      domain: AI_GOVERNANCE
      category: REGULATORY | REPUTATIONAL
      likelihood: 3
      impact: 4
      inherent_risk_score: 12  # HIGH
      control_ids: [CTL-AI-006, CTL-AI-005]
      residual_risk_level: MEDIUM
      risk_tolerance: MITIGATE
      kris:
        - {indicator: "bias_assessment_coverage_pct", threshold: 1.00, current: 0.80, status: AT_RISK}
        - {indicator: "bias_incidents_reported_90d", threshold: 0, current: 0, status: WITHIN_APPETITE}
    
    RSK-AIGOV-003:
      name: prohibited_ai_practices_inadvertent_use
      description: Enterprise AI systems may inadvertently implement practices prohibited by EU AI Act (social scoring, real-time biometric surveillance, manipulative techniques)
      domain: AI_GOVERNANCE
      category: REGULATORY
      likelihood: 2
      impact: 5
      inherent_risk_score: 10  # HIGH
      control_ids: [CTL-AI-001]
      residual_risk_level: LOW
      risk_tolerance: MITIGATE
  
  DATA_PRIVACY_RISKS:
    RSK-PRIV-001:
      name: personal_data_breach
      description: Unauthorized access, disclosure, or loss of personal data triggering GDPR breach notification obligations and regulatory penalties
      domain: DATA_PRIVACY
      category: SECURITY | REGULATORY
      likelihood: 3
      impact: 4
      inherent_risk_score: 12  # HIGH
      control_ids: [CTL-SEC-001, CTL-SEC-002, CTL-SEC-003, CTL-SEC-006, CTL-PRIV-005]
      residual_risk_level: MEDIUM
      risk_tolerance: MITIGATE
      kris:
        - {indicator: "data_breach_incidents_90d", threshold: 0, current: 0, status: WITHIN_APPETITE}
        - {indicator: "unpatched_critical_vulnerabilities_count", threshold: 0, current: 3, status: AT_RISK}
    
    RSK-PRIV-002:
      name: data_subject_rights_sla_breach
      description: Failure to fulfill data subject requests (access, deletion) within regulatory timeframes (GDPR: 30 days; CCPA: 45 days)
      domain: DATA_PRIVACY
      category: REGULATORY | OPERATIONAL
      likelihood: 2
      impact: 3
      inherent_risk_score: 6  # MEDIUM
      control_ids: [CTL-PRIV-003]
      residual_risk_level: LOW
      risk_tolerance: MITIGATE
    
    RSK-PRIV-003:
      name: cross_border_data_transfer_mechanism_invalidation
      description: Legal mechanism for transferring personal data outside EU may be invalidated (Schrems III scenario) creating immediate compliance gap
      domain: DATA_PRIVACY
      category: REGULATORY
      likelihood: 2
      impact: 4
      inherent_risk_score: 8  # HIGH
      risk_tolerance: MITIGATE
      treatment_plan: "Identify alternative transfer mechanisms; map all cross-border data flows; evaluate data localization feasibility"
  
  INFORMATION_SECURITY_RISKS:
    RSK-SEC-001:
      name: unauthorized_access_to_sensitive_systems
      description: Unauthorized internal or external actor gains access to systems containing confidential or personal data
      domain: INFORMATION_SECURITY
      category: SECURITY
      likelihood: 3
      impact: 4
      inherent_risk_score: 12  # HIGH
      control_ids: [CTL-SEC-001, CTL-SEC-003, CTL-SEC-006]
      residual_risk_level: MEDIUM
      risk_tolerance: MITIGATE
    
    RSK-SEC-002:
      name: supply_chain_attack
      description: Malicious code or compromise introduced through a third-party software dependency or vendor
      domain: INFORMATION_SECURITY
      category: SECURITY | OPERATIONAL
      likelihood: 3
      impact: 5
      inherent_risk_score: 15  # CRITICAL
      control_ids: [CTL-OPS-003, CTL-SEC-004]
      residual_risk_level: HIGH
      risk_tolerance: MITIGATE
      treatment_plan: "Software composition analysis; vendor security assessments; SBOM maintenance"
  
  OPERATIONAL_RISKS:
    RSK-OPS-001:
      name: business_continuity_failure
      description: Major operational disruption with no effective recovery capability; inability to restore services within required RTO/RPO
      domain: OPERATIONAL
      category: OPERATIONAL
      likelihood: 2
      impact: 4
      inherent_risk_score: 8  # HIGH
      control_ids: [CTL-OPS-002]
      residual_risk_level: MEDIUM
      risk_tolerance: MITIGATE
    
    RSK-OPS-002:
      name: key_personnel_dependency
      description: Critical compliance knowledge or capability concentrated in few individuals; departure creates compliance gap
      domain: OPERATIONAL
      category: OPERATIONAL | REGULATORY
      likelihood: 2
      impact: 3
      inherent_risk_score: 6  # MEDIUM
      risk_tolerance: MITIGATE
      treatment_plan: "Cross-train backup personnel; document institutional knowledge; succession planning"
```

---

## Risk Assessment Protocol

```yaml
risk_assessment_protocol:
  initial_assessment:
    trigger: new risk identified from any source
    assessor: domain compliance lead + risk owner
    method:
      step_1: define risk precisely (what event, what consequence)
      step_2: assess inherent likelihood (1-5 scale; without any controls)
      step_3: assess inherent impact (1-5 scale; across financial/regulatory/reputational/operational dimensions)
      step_4: compute inherent_risk_score = likelihood × impact
      step_5: identify existing controls that mitigate this risk
      step_6: assess control effectiveness for this risk
      step_7: compute residual_risk_score (inherent reduced by control effectiveness)
      step_8: determine risk_tolerance (ACCEPT/MITIGATE/TRANSFER/AVOID)
    output: completed risk record; submitted for compliance governance lead review
  
  periodic_reassessment:
    frequency:
      CRITICAL risks: monthly
      HIGH risks: quarterly
      MEDIUM risks: semi-annually
      LOW risks: annually
    trigger_for_unscheduled_reassessment:
      - related control found INEFFECTIVE
      - relevant regulatory change
      - related security incident
      - material change in business context
  
  risk_treatment_options:
    MITIGATE: implement or strengthen controls to reduce residual risk below risk appetite
    ACCEPT: document acceptance rationale; owner approval; Tier-3+ for HIGH; Tier-4+ for CRITICAL
    TRANSFER: insurance or contractual transfer of risk to third party
    AVOID: cease the activity creating the risk
  
  risk_acceptance_governance:
    LOW risks: domain lead can accept
    MEDIUM risks: compliance governance lead approval required
    HIGH risks: Tier-3+ approval required; documented rationale
    CRITICAL risks: Tier-4+ approval + board notification required
```

---

## Key Risk Indicators (KRI) Management

```yaml
kri_management:
  kri_properties:
    name: string
    threshold: the value at which the KRI indicates unacceptable risk
    current_value: measured current value
    trend: IMPROVING | STABLE | DETERIORATING
    status: WITHIN_APPETITE | AT_RISK | BREACHED
    measurement_frequency: how often the KRI is measured
    data_source: where the KRI measurement comes from
  
  kri_response:
    AT_RISK: notify risk owner; review treatment plan; consider control enhancement
    BREACHED: immediate risk owner notification; escalate to compliance governance lead; treatment plan update within 5 days
  
  enterprise_kri_dashboard:
    displays: all KRIs by risk, colored by status
    trend_view: 90-day trend for each KRI
    update_frequency: daily for automated KRIs; weekly for manual KRIs
```

---

## Risk Register Governance

```yaml
risk_register_governance:
  register_owner: Compliance Governance Lead
  
  completeness_requirement:
    all HIGH+ risks identified in audits or incidents must have a risk register entry within 5 days
    no risk can be ACCEPTED without proper authorization
    all CRITICAL risks must have active treatment plans with named owners and deadlines
  
  quarterly_risk_review:
    action: comprehensive review of all active risks
    attendees: all domain compliance leads, Tier-4+ representative, compliance governance lead
    outputs: [updated risk ratings, closed risks, new risks, treatment status update, board risk summary]
  
  annual_enterprise_risk_assessment:
    action: bottom-up risk identification across all domains
    method: structured risk workshops per domain
    output: updated risk register; annual risk report for board
  
  retention:
    active_risks: live records maintained
    closed_risks: retained for 7 years (audit purposes)
    risk_assessment_history: all prior assessments retained per risk (shows evolution)
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/compliance-model.md` | Risk entity schema |
| `compliance-framework/regulatory-registry.md` | Regulatory obligations drive risk identification |
| `compliance-framework/control-catalog.md` | Controls mapped to risks for residual risk computation |
| `risk-and-controls/risk-assessment-engine.md` | Quantitative risk scoring engine |
| `risk-and-controls/control-effectiveness-monitor.md` | Control failures update risk residual scores |
| `audit-and-evidence/finding-management.md` | HIGH+ findings trigger risk register updates |
| `governance-operations/compliance-operations-dashboard.md` | Risk register summary on dashboard |
