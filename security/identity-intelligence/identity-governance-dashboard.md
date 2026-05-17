# Identity Governance Dashboard
**ID:** IAM-IGD-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides real-time and historical visibility into enterprise identity and access health — surfacing identity risk posture, certification campaign status, privilege distribution, ZSP compliance, threat detection metrics, and regulatory compliance indicators — at every organizational level from T3 IAM administrators to T4 executive security briefings and board-level reporting. The Identity Governance Dashboard is the control room of IAM: it makes the invisible visible, turning thousands of access decisions and identity events into a coherent picture of enterprise identity security.

---

## Dashboard Layers

```yaml
dashboard_layers:

  IAM_OPERATIONAL (T3 IAM administrators; T2 on-call):
    refresh_rate: 30 seconds
    panels:
      - identity_health_summary (total active; suspended; decommissioning in progress)
      - active_jit_sessions (count by privilege tier; approaching expiry)
      - authentication_events_per_minute (success/failure trend; anomaly spike detection)
      - active_certification_campaigns (progress %; overdue certifiers; days to deadline)
      - identity_threat_alerts (live queue; severity-sorted; SLA countdown)
      - zsp_compliance_status (current violations; stale grants; exception count)
      - emergency_access_active (any active emergency sessions; tier; identity; duration)
      - credential_expiry_watch (credentials expiring in 7 days; rotation status)
    actions:
      - force session termination
      - trigger emergency credential rotation
      - escalate certification to T3 review
      - approve/deny JIT requests (T3 authority)
      
  IAM_GOVERNANCE (T3 IAM lead; T4 CISO):
    refresh_rate: 5 minutes
    panels:
      - identity_risk_posture_score (0–100; RAG; 30-day trend)
      - privilege_distribution (identities per tier; trend; peer benchmark)
      - identity_risk_top_10 (highest-risk identities; risk factors; recommended actions)
      - certification_compliance_rate (% completed on time; rubber-stamp incidents; revocation rate)
      - zsp_maturity_score (0–1.0; component breakdown; trend)
      - sod_violation_status (open violations; remediation status; ages)
      - identity_threat_summary (threats detected this week; resolved; false positive rate)
      - over_privilege_heatmap (entitlement utilization by org unit; dormant permission volume)
      - orphan_identity_status (HARD_ORPHAN count; SOFT_ORPHAN count; resolution trend)
      
  EXECUTIVE_BRIEFING (T4 CISO; board security committee):
    refresh_rate: daily
    panels:
      - iam_security_posture (qualitative summary; RAG; vs. last quarter)
      - privileged_identity_count (PRIVILEGED+; trend; industry benchmark)
      - access_governance_compliance (certification completion; revocation rate; rubber-stamp rate)
      - identity_related_incidents (incidents involving identity compromise; MTTR)
      - zsp_adoption (% of PRIVILEGED operations via JIT; standing privilege violations)
      - regulatory_iam_compliance (ISO 27001 A.9; SOX ITGC; GDPR; HIPAA access control)
      - iam_risk_trend (rolling 12-month identity risk posture score)
```

---

## IAM Security Posture Score

```
compute_iam_posture_score():

  # Component scores (0–100 each)
  
  identity_hygiene_score:
    # orphan_identities: -5 per HARD_ORPHAN; -2 per SOFT_ORPHAN
    # stale_identities: -3 per identity inactive > 90 days
    # uncertified_identities: -5 per overdue PRIVILEGED+; -1 per overdue STANDARD
    # base: 100 - deductions; floor 0
    
  authentication_strength_score:
    # mfa_coverage: % of HUMAN_OPERATOR identities with MFA enrolled; weight 40%
    # behavioral_check_coverage: % of AGENT_IDENTITY authentications with behavioral check; weight 30%
    # failed_auth_rate: target < 5%; each % above = -5 points; weight 30%
    
  authorization_posture_score:
    # sod_violations: 0 = 100; each violation = -15; floor 0
    # privilege_utilization: average utilization rate for PRIVILEGED+ entitlements; higher = better; weight 40%
    # certification_compliance: % certified within SLA × 100; weight 30%
    # over_privilege_ratio: % of PRIVILEGED+ identities with utilization < 50%; weight 30%
    
  privileged_access_score:
    # zsp_maturity: ZSP maturity score × 100; weight 50%
    # jit_coverage: % of PRIVILEGED+ sessions via JIT; weight 30%
    # emergency_access_frequency: monthly rate; > 5/month = 0; 0/month = 100; weight 20%
    
  threat_detection_score:
    # identity_threat_fp_rate: false positive rate for identity threat alerts; target < 10%; weight 30%
    # threat_resolution_time: MTTR for identity threat alerts; target < 30min; weight 40%
    # unresolved_identity_threats: count of open HIGH/CRITICAL alerts; -10 each; weight 30%
    
  # Weighted composite
  posture_score = (
    identity_hygiene_score     * 0.20 +
    authentication_strength    * 0.20 +
    authorization_posture      * 0.25 +
    privileged_access_score    * 0.20 +
    threat_detection_score     * 0.15
  )
  
  rag_status = GREEN if posture_score >= 80 else AMBER if posture_score >= 65 else RED
  Return: posture_score, rag_status, component_scores
```

---

## Regulatory Compliance Panel

```yaml
regulatory_compliance:

  ISO_27001_A9_ACCESS_CONTROL:
    tracked_controls:
      A9.1.1: access_control_policy_exists and reviewed_annually
      A9.2.1: user_registration_and_deregistration_process (lifecycle completeness)
      A9.2.2: user_access_provisioning (JIT + approval workflow compliance)
      A9.2.3: management_of_privileged_access (ZSP + PAM compliance)
      A9.2.4: management_of_secret_authentication (credential vault + rotation compliance)
      A9.2.5: review_of_user_access_rights (certification campaign completion rate)
      A9.2.6: removal_or_adjustment_of_access (leaver workflow SLA)
    target: all controls GREEN; quarterly evidence package generated
    
  SOX_ITGC_ACCESS:
    tracked:
      user_access_provisioning: joiner/mover/leaver workflow audit trail completeness
      privileged_access_management: ZSP compliance; JIT coverage
      separation_of_duties: SoD violation count and remediation SLA
      user_access_recertification: certification campaign completion rate
    target: > 99% compliance; quarterly SOX attestation report
    
  GDPR_ART25_DATA_MINIMIZATION:
    tracked:
      purpose_limitation: entitlement scope matches stated processing purpose
      data_minimization: entitlement utilization rate (unused = over-provisioned = minimization risk)
      access_restriction: personal data access entitlements limited to necessary agents
    target: all personal data access entitlements certified within 6 months; utilization > 60%
    
  HIPAA_MINIMUM_NECESSARY:
    tracked:
      workforce_access_controls: PHI access entitlements certified quarterly
      minimum_necessary_principle: PHI access scope documented and justified
      workforce_training: % of HUMAN_OPERATOR identities with access to PHI trained
    target: quarterly certification completion 100%; all PHI access documented
    
  compliance_report_cadence:
    monthly: operational compliance metrics to T3 IAM
    quarterly: executive compliance report to T4 CISO + compliance officer
    annually: external audit evidence package generated by audit-coordinator
```

---

## Key IAM Metrics Reference

```yaml
key_metrics:

  identity_metrics:
    total_active_identities: count
    identities_by_type: {AGENT: n, SERVICE_ACCOUNT: n, HUMAN_OPERATOR: n, ...}
    identities_by_privilege_tier: {SUPER_PRIVILEGED: n, PRIVILEGED: n, ELEVATED: n, STANDARD: n}
    orphan_identity_count: {HARD_ORPHAN: n, SOFT_ORPHAN: n}
    stale_identity_count: integer       # inactive > 90 days
    
  authentication_metrics:
    auth_success_rate: float            # target > 99%
    auth_failure_rate: float            # target < 1%
    mfa_adoption_rate: float            # HUMAN_OPERATOR; target 100%
    step_up_frequency: count/day        # elevated = stricter context enforcement
    
  authorization_metrics:
    total_decisions_per_day: integer
    deny_rate: float                    # target < 5% (high deny = misconfiguration or attack)
    constitutional_block_rate: float    # weekly count; trending toward 0 target
    cache_hit_rate: float               # target > 60%
    
  certification_metrics:
    campaigns_active: integer
    completion_rate: float              # target > 98%
    on_time_rate: float                 # target > 80%
    revocation_rate: float              # healthy: 5–15%
    rubber_stamp_rate: float            # target < 2%
    
  privileged_access_metrics:
    active_jit_sessions: integer
    jit_coverage_rate: float            # % of PRIVILEGED operations via JIT; target > 95%
    avg_privileged_session_duration: minutes
    emergency_access_frequency: count/month  # target < 2
    zsp_violations_this_week: integer        # target 0
    
  threat_metrics:
    identity_threats_detected: count/week
    false_positive_rate: float              # target < 10%
    mttr_identity_threat: minutes           # target < 30
    account_takeovers_prevented: count/month
```

---

## Integration

```
Feeds into:
  security-metrics-dashboard.md — IAM posture score contributes to enterprise security posture
  adaptive-compliance/compliance-dashboard.md — regulatory compliance panel shared here
  (board security committee briefings generated from executive layer)

Receives from:
  identity-registry.md — identity counts and status
  identity-analytics.md — risk scores and entitlement analytics
  access-certification-engine.md — campaign status and metrics
  privileged-access-manager.md — JIT session metrics
  zero-standing-privilege.md — ZSP compliance metrics
  identity-threat-detection.md — threat detection metrics
  authentication-engine.md — authentication metrics
  authorization-engine.md / policy-decision-point.md — authorization decision metrics
```

---

## Governance

**Dashboard sovereignty:** Each entity's IAM dashboard runs within that entity's SEZ; cross-entity IAM aggregation uses anonymized federation metrics  
**IAM posture score triggers escalation:** Score < 65 (AMBER) → weekly T4 review; score < 50 (RED) → immediate T4 escalation; T4 notifies board security committee  
**Regulatory panel is compliance-grade:** Regulatory compliance metrics in the dashboard are calculated with the same methodology used for external audit evidence; not decorative  
**Audit:** Dashboard access and all exported reports to `memory/identity-management/dashboard-access.jsonl`; 7-year retention
