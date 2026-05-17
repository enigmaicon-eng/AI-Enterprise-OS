# Identity Analytics
**ID:** IAM-IAN-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides continuous, ML-driven analytics on identity behavior, entitlement usage, access risk, and privilege patterns — transforming raw authorization decisions and session data into actionable intelligence about which identities are over-privileged, which are behaving anomalously, and where access governance requires immediate attention. Identity Analytics is the intelligence layer of the IAM stack: it turns data into risk signals that drive proactive access governance and early threat detection.

---

## Identity Risk Scoring

```
compute_identity_risk_score(identity_id):

  # Component scores (0.0–1.0)
  
  entitlement_risk = score_entitlement_risk(identity_id):
    # privilege_level weight: STANDARD 0.1; ELEVATED 0.3; PRIVILEGED 0.7; SUPER_PRIVILEGED 0.9
    # entitlement_utilization: 1 - (used_permissions / granted_permissions) → higher gap = higher risk
    # peer_outlier: how far above peer group median → Mahalanobis distance / normalization
    # sod_violations: count × 0.5 (per violation; capped at 1.0)
    
  behavioral_risk = score_behavioral_risk(identity_id):
    # behavioral_anomaly_score: from behavioral-anomaly-detector (MODEL-BAD-001)
    # failed_authorization_rate: % of authorization attempts denied in last 7 days
    # off_hours_activity: ratio of actions outside normal operating hours
    # new_resource_access: rate of accessing resource types not previously accessed
    
  lifecycle_risk = score_lifecycle_risk(identity_id):
    # days_since_last_certification: 0 = recent; 1.0 = > 2× certification cadence
    # pending_review_count: uncertified entitlements pending review
    # orphan_risk: owner_org health score (dissolved org = 1.0; healthy = 0.0)
    # credential_age: fraction of credential TTL elapsed (0 = fresh; 1.0 = at expiry)
    
  access_pattern_risk = score_access_pattern_risk(identity_id):
    # privilege_escalation_attempts: JIT requests for higher privilege than granted
    # emergency_access_frequency: > 1/month raises risk
    # scope_violation_count: from privileged-session-monitor (recent 30 days)
    # cross_jurisdiction_frequency: cross-border access frequency vs. baseline
    
  # Weighted composite
  composite_score = (
    entitlement_risk     * 0.35 +
    behavioral_risk      * 0.30 +
    lifecycle_risk       * 0.20 +
    access_pattern_risk  * 0.15
  )
  
  # Overrides
  if sod_violations > 0: composite_score = max(composite_score, 0.70)
  if scope_violations > 0: composite_score = max(composite_score, 0.60)
  if pending_certification_overdue: composite_score = max(composite_score, 0.50)
  
  Return: composite_score, component_scores, top_risk_factors
```

---

## Analytics Models

```yaml
analytics_models:

  MODEL-IAN-001:
    name: "Entitlement Utilization Tracker"
    method: comparison of granted permissions vs. used permissions (from PDP decision logs)
    window: 90-day rolling
    output:
      per_identity: utilization_rate per permission; dormant permission list
      per_role: role utilization rate; unused role candidates for deprecation
    alert: utilization_rate < 0.50 for PRIVILEGED+ permission → T3 review
    
  MODEL-IAN-002:
    name: "Peer Group Deviation Detector"
    method: Mahalanobis distance from peer group centroid in entitlement-space
    peer_group_definition: same org_unit + same function + same jurisdiction
    output: deviation_score per identity; outlier list (> 2σ above peer median)
    alert: deviation_score > 2σ → flag for certification; T3 report
    
  MODEL-IAN-003:
    name: "Privilege Creep Detector"
    method: time series of effective privilege level per identity; Mann-Kendall trend test
    output: trend direction (INCREASING | STABLE | DECREASING); velocity of increase
    alert: INCREASING trend in PRIVILEGED+ entitlements for > 30 days without justification → T3 immediate
    
  MODEL-IAN-004:
    name: "Authorization Denial Pattern Analyzer"
    method: clustering of DENY events by identity, resource class, and action type
    output: denial_pattern per identity; anomalous denial spikes; boundary-probing indicators
    use_case: high denial rate in specific resource class = probing behavior; insider threat signal
    alert: denial_rate > 3× baseline for any identity in any resource class → T3 + insider-threat-detector
    
  MODEL-IAN-005:
    name: "Cross-Jurisdiction Access Profiler"
    method: profile of cross-border access patterns per identity
    output: expected vs. observed cross-jurisdiction access frequency; jurisdiction pair patterns
    alert: unexpected jurisdiction access (not in identity's known pattern) → T3 + compliance-engine
    
  MODEL-IAN-006:
    name: "Temporal Access Pattern Analyzer"
    method: time-of-day and day-of-week access pattern profiling; LSTM sequence model
    output: temporal_baseline per identity; off-hours anomaly score
    alert: privileged access outside established hours by PRIVILEGED+ identity → T3 immediate
```

---

## Entitlement Intelligence Reports

```yaml
entitlement_reports:

  DORMANT_ENTITLEMENT_REPORT:
    cadence: monthly
    contents: all permissions unused > 90 days; sorted by privilege level (highest first)
    recommended_action: revoke dormant PRIVILEGED+ entitlements; certify or revoke STANDARD
    audience: T3 IAM lead; distributed to team leads for their domains
    
  OVER_PRIVILEGE_REPORT:
    cadence: monthly
    contents: identities with entitlement utilization < 50%; identities > 2σ above peer group
    recommended_action: certification review; right-size entitlements to observed usage
    audience: T3 IAM lead + T4 CISO
    
  PRIVILEGE_DISTRIBUTION_REPORT:
    cadence: quarterly
    contents: total count of identities per privilege tier; trend over time; industry benchmark
    metric: PRIVILEGED+ identities as % of total (target: < 10% enterprise-wide)
    audience: T4 CISO + board security committee
    
  IDENTITY_RISK_TOP_10:
    cadence: weekly
    contents: top 10 highest identity risk scores; driving factors; recommended actions
    audience: T3 IAM lead + T3 SOC lead
    
  CERTIFICATION_INTELLIGENCE_PACKAGE:
    cadence: generated per certifier per certification campaign
    contents: per-certifier identity list with risk scores, utilization, peer comparison, risk factors
    purpose: give certifiers the data they need to make informed decisions (reduce rubber-stamping)
```

---

## Analytics Data Sources

```yaml
data_sources:
  identity_registry: identity attributes, roles, lifecycle state
  pdp_decision_log: all authorization decisions (PERMIT/DENY/CONSTITUTIONAL_BLOCK)
  privileged_session_monitor: session durations, action types, scope violations
  behavioral_anomaly_detector: behavioral risk scores
  access_governance: certification history, revocation history
  role_management: role assignments, SoD violations
  identity_lifecycle_manager: lifecycle events (provisioning, decommission, suspension)
  emergency_access_system: emergency access frequency
  threat_detection/insider_threat_detector: insider threat risk signals
  
data_retention_for_analytics:
  authorization_decision_sample: 90-day hot; 2-year warm (sampled); 7-year cold
  session_data: 90-day hot; 7-year cold
  identity_risk_scores: 30-day rolling; annual snapshots retained 7 years
```

---

## Integration

```
Feeds into:
  access-governance.md — risk scores and utilization data feed certifier packages
  identity-threat-detection.md — identity risk scores feed threat detection engine
  identity-governance-dashboard.md — analytics metrics displayed here
  insider-threat-detector.md — access pattern anomalies and denial patterns contribute to insider threat scoring

Receives from:
  authorization-engine.md / policy-decision-point.md — authorization decision log (primary data source)
  privileged-session-monitor.md — session data
  identity-lifecycle-manager.md — lifecycle event data
  behavioral-anomaly-detector.md — behavioral risk signals
```

---

## Governance

**Analytics models do not make access decisions:** Identity Analytics produces risk scores and recommendations; access decisions (grant, revoke, certify) require human judgment via standard governance processes  
**Peer group composition is transparent:** Identities and their certifiers can see which peer group they're compared to; peer groups are defined by role, not by manager (avoiding manager-selection bias)  
**Risk score methodology is documented:** The identity risk scoring formula is documented and reviewed annually; changes require T3 IAM approval to prevent gaming  
**Audit:** All analytics model outputs and report distributions to `memory/identity-management/analytics-audit.jsonl`; 7-year retention
