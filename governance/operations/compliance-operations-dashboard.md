# Compliance Operations Dashboard

## Purpose
The real-time command center for enterprise compliance operations. Aggregates compliance posture, control health, finding status, risk indicators, and regulatory readiness into a unified operational view. The dashboard is the primary situational awareness tool for compliance leads, enabling immediate detection of emerging issues and confident oversight of the compliance program.

---

## Dashboard Architecture

```
Data Feeds (live)
├── control-effectiveness-monitor.md    → effectiveness states (5-min refresh)
├── finding-management.md               → open findings + overdue status (15-min refresh)
├── enterprise-risk-register.md         → KRI status + risk scores (hourly refresh)
├── exception-management.md             → active exceptions + approaching expiry (hourly refresh)
├── evidence-collection-engine.md       → evidence coverage + collection status (15-min refresh)
├── audit-management-system.md          → active audits + findings (daily refresh)
├── audit-trail-governance.md           → chain integrity status (5-min refresh)
└── compliance-reporting-engine.md      → compliance score (hourly refresh)

        ↓ aggregation and computation

[Dashboard Rendering Engine]
├── [Panel Computation]      → derive all panel metrics from live data feeds
├── [Alert Evaluation]       → compare metrics to thresholds; generate dashboard alerts
├── [Trend Computation]      → vs. prior 7/30/90 day periods
└── [View Rendering]         → role-specific view filtering
```

---

## Live Console View

```
╔══════════════════════════════════════════════════════════════════════════════════════════════╗
║ ENTERPRISE COMPLIANCE OPERATIONS — LIVE DASHBOARD                                           ║
║ As of: 2026-05-15 09:47:22 UTC    Data freshness: 09:45 UTC    Chain integrity: VERIFIED    ║
╠══════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 1: OVERALL COMPLIANCE SCORE                                                   │   ║
║  │ Current Score: 0.73  [PARTIALLY_COMPLIANT ●ORANGE]    Trend: ▼ -0.04 vs. 30d avg   │   ║
║  │                                                                                     │   ║
║  │ By Domain:                                                                          │   ║
║  │  DATA_PRIVACY         0.85  ●AMBER  [SUBSTANTIALLY_COMPLIANT]                      │   ║
║  │  INFORMATION_SECURITY 0.88  ●AMBER  [SUBSTANTIALLY_COMPLIANT]                      │   ║
║  │  AI_GOVERNANCE        0.55  ●RED    [NON_COMPLIANT]   ← EU AI Act preparation gap  │   ║
║  │  OPERATIONAL          0.91  ●GREEN  [COMPLIANT]                                    │   ║
║  │  FINANCIAL            0.94  ●GREEN  [COMPLIANT]                                    │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 2: CONTROL EFFECTIVENESS FLEET                                                │   ║
║  │                                                                                     │   ║
║  │ EFFECTIVE:          24 controls  (80.0%)   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░              │   ║
║  │ MONITORING_ALERT:    2 controls  (6.7%)    alert active / investigating             │   ║
║  │ DEGRADED:            2 controls  (6.7%)    ⚠ findings generated                    │   ║
║  │ FAILED:              2 controls  (6.7%)    ✗ immediate attention required           │   ║
║  │ BYPASSED:            0 controls  (0.0%)    ✓ no bypass events                      │   ║
║  │                                                                                     │   ║
║  │ Controls by Domain:  PRIV: 5/5 EFF   SEC: 5/6 EFF   AI: 1/6 EFF   OPS: 3/3 EFF   │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 3: ACTIVE FINDINGS                                                            │   ║
║  │                                                                                     │   ║
║  │ CRITICAL:  2  (1 OVERDUE)     HIGH:  4  (0 OVERDUE)                                │   ║
║  │ MEDIUM:    8  (2 OVERDUE)     LOW:   6  (1 OVERDUE)   INFO: 3                      │   ║
║  │                                                                                     │   ║
║  │ OVERDUE FINDINGS:                                                                   │   ║
║  │  FND-CTL-042  CRITICAL  CTL-AI-002  Conformity assessment incomplete    +12d OVR   │   ║
║  │  FND-CTL-038  MEDIUM    CTL-AI-005  Post-deployment monitoring gap       +3d OVR   │   ║
║  │  FND-CTL-031  MEDIUM    CTL-SEC-004 Patch SLA breach (HIGH vulns)        +1d OVR   │   ║
║  │  FND-CTL-027  LOW       CTL-OPS-002 BC test documentation incomplete     +8d OVR   │   ║
║  │                                                                                     │   ║
║  │ NEW THIS WEEK: 3  |  CLOSED THIS WEEK: 1  |  REPEAT FINDINGS: 2                    │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 4: KEY RISK INDICATORS                                                        │   ║
║  │                                                                                     │   ║
║  │ KRI                                          THRESHOLD  CURRENT   STATUS            │   ║
║  │ ai_conformity_assessment_coverage            >= 1.00    0.65      ●AT_RISK          │   ║
║  │ unpatched_critical_vulnerabilities           = 0        3         ●AT_RISK          │   ║
║  │ data_classification_coverage                 >= 0.99    0.997     ●WATCH            │   ║
║  │ dsr_fulfillment_within_sla_rate              >= 1.00    1.00      ●NORMAL           │   ║
║  │ human_review_bypass_rate_critical_decisions  = 0.00     0.00      ●NORMAL           │   ║
║  │ audit_log_chain_integrity                    = verified verified  ●NORMAL           │   ║
║  │ active_exceptions_high_risk                  <= 2       1         ●NORMAL           │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 5: REGULATORY READINESS                                                       │   ║
║  │                                                                                     │   ║
║  │ EU AI Act enforcement:  2026-08-02  [79 days]  Readiness: ●AT_RISK                 │   ║
║  │ SOC2 Type II renewal:   2026-09-15  [123 days] Readiness: ●ON_TRACK                │   ║
║  │ ISO27001 surveillance:  2026-11-01  [170 days] Readiness: ●ON_TRACK                │   ║
║  │ GDPR DPA examination:   2026-07-01  [47 days]  Readiness: ●WATCH                   │   ║
║  │                                                                                     │   ║
║  │ Pre-exam preparation ACTIVE: GDPR DPA examination (started 2026-04-02)             │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 6: EVIDENCE COLLECTION STATUS                                                 │   ║
║  │                                                                                     │   ║
║  │ Evidence coverage:  27/30 controls current  (90.0%)   Target: 100%                 │   ║
║  │ Stale evidence:     3 controls (evidence > collection_frequency old)               │   ║
║  │ Pending review:     4 manual evidence items (oldest: 3 business days)              │   ║
║  │ Collection failures: 1 in last 24h (retry in progress)                             │   ║
║  │ Evidence rejection rate: 3.2%  (target: < 5%)  ●NORMAL                            │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────────────────┐   ║
║  │ PANEL 7: ACTIVE EXCEPTIONS AND INCIDENTS                                            │   ║
║  │                                                                                     │   ║
║  │ Active Exceptions:  4 total  (0 CRITICAL, 1 HIGH, 3 MEDIUM)                        │   ║
║  │ Expiring in 30d:    1  EXC-CTL-SEC-002-01  expires 2026-06-10  HIGH net_risk       │   ║
║  │                                                                                     │   ║
║  │ Active Compliance Incidents:  1  (1 HIGH, 0 CRITICAL)                              │   ║
║  │  INC-COMP-2026-031  HIGH  Data localization gap detected  Owner: Privacy Team      │   ║
║  └─────────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════════════════════╣
║ DASHBOARD ALERTS                                                                             ║
║  ● CRITICAL: FND-CTL-042 is 12 days overdue — EU AI Act conformity assessment               ║
║  ● HIGH: AI_GOVERNANCE domain compliance score 0.55 — below SUBSTANTIALLY_COMPLIANT         ║
║  ● HIGH: 2 KRIs AT_RISK simultaneously — cross-domain risk correlation investigation needed ║
║  ● WATCH: EU AI Act enforcement in 79 days — pre-exam preparation completion target: 30d    ║
╚══════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Panel Computation Rules

```yaml
panel_computation:
  PANEL_1_compliance_score:
    computation: compliance-reporting-engine.md MOD-POSTURE-001 formula
    refresh: hourly
    override_conditions:
      any_CRITICAL_finding_open: cap at SUBSTANTIALLY_COMPLIANT (0.89)
      any_BYPASSED_control: cap at PARTIALLY_COMPLIANT (0.74)
  
  PANEL_2_control_effectiveness:
    computation: count of controls per state from control-effectiveness-monitor.md
    refresh: 5 minutes
    alert_trigger: any FAILED or BYPASSED → immediate dashboard alert
  
  PANEL_3_findings:
    computation: query finding-management.md for all OPEN findings; compute overdue
    refresh: 15 minutes
    overdue_definition: current_date > target_date AND status != CLOSED
  
  PANEL_4_KRIs:
    computation: query enterprise-risk-register.md KRI measurements
    refresh: hourly (CRITICAL KRIs: 15-minute refresh)
    status:
      NORMAL: current within threshold
      WATCH: current within 90% of threshold (approaching)
      AT_RISK: current at or beyond threshold
  
  PANEL_5_regulatory:
    computation: query regulatory-registry.md for enforcement dates; compute readiness %
    refresh: daily
    readiness_status:
      ON_TRACK: pre-exam gap remediation on schedule; all controls in scope EFFECTIVE
      WATCH: 1-2 controls in scope not EFFECTIVE; remediation in progress
      AT_RISK: 3+ controls in scope not EFFECTIVE; OR CRITICAL finding in scope
      CRITICAL: less than 30 days and AT_RISK status
  
  PANEL_6_evidence:
    computation: query evidence-collection-engine.md for coverage and status
    refresh: 15 minutes
  
  PANEL_7_exceptions_incidents:
    computation: query exception-management.md and compliance-incident-management.md
    refresh: hourly
```

---

## Dashboard Alert Escalation

```yaml
dashboard_alerts:
  CRITICAL_alerts:
    trigger: [FAILED control, BYPASSED control, CRITICAL finding overdue, KRI AT_RISK for CRITICAL risk, audit trail chain breach]
    display: persistent banner; cannot be dismissed without acknowledgment
    notification: ESCALATION message to compliance governance lead + Tier-3+
    SLA: acknowledged within 1 hour
  
  HIGH_alerts:
    trigger: [2+ controls DEGRADED in same domain, HIGH finding overdue, CRITICAL exception nearing expiry]
    display: prominent alert panel
    notification: ESCALATION message to compliance governance lead
    SLA: acknowledged within 4 hours
  
  WATCH_alerts:
    trigger: [compliance score trending down >5% in 7 days, KRI in WATCH state, evidence coverage < 95%]
    display: amber alert indicator
    notification: daily digest to compliance lead
  
  alert_acknowledgment:
    who: compliance governance lead or delegated domain lead
    what: acknowledge_alert action logs acknowledgment in audit trail
    note: acknowledging does not resolve the underlying issue; separate from remediation
```

---

## Views and Access

```yaml
dashboard_views:
  COMPLIANCE_OPERATIONS_VIEW:
    audience: compliance operations team
    panels: all 7 panels + full alert panel
    detail_level: full operational detail including control IDs and finding IDs
    refresh: live (5-15 minute data)
  
  DOMAIN_LEAD_VIEW:
    audience: domain compliance leads
    panels: posture (domain-filtered), findings (domain-filtered), KRIs (domain-relevant), evidence (domain-filtered)
    detail_level: domain-specific detail
    cross_domain: only own domain visible; cross-domain aggregates visible at summary level
  
  MANAGEMENT_VIEW:
    audience: Tier-3+ leadership
    panels: posture summary, findings by severity count, top 5 KRIs, regulatory readiness
    detail_level: aggregated; no individual finding IDs (summary counts only)
    refresh: hourly
  
  EXECUTIVE_VIEW:
    audience: Tier-4+; board observers
    panels: compliance score (single metric), CRITICAL findings count, regulatory readiness (3 nearest), overall_posture_color
    detail_level: highly aggregated; RAG status only
    refresh: daily
```

---

## Integration Points

| System | Role |
|---|---|
| `risk-and-controls/control-effectiveness-monitor.md` | Live effectiveness states for Panel 2 |
| `audit-and-evidence/finding-management.md` | Open and overdue findings for Panel 3 |
| `risk-and-controls/enterprise-risk-register.md` | KRI measurements for Panel 4 |
| `compliance-framework/regulatory-registry.md` | Enforcement dates for Panel 5 |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence coverage for Panel 6 |
| `risk-and-controls/exception-management.md` | Active exceptions for Panel 7 |
| `governance-operations/compliance-incident-management.md` | Active incidents for Panel 7 |
| `audit-and-evidence/compliance-reporting-engine.md` | Compliance score computation |
| `audit-and-evidence/audit-trail-governance.md` | Chain integrity status |
