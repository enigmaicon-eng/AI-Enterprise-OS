# Control Effectiveness Monitor

## Purpose
Continuously monitors the operational effectiveness of all enterprise controls between formal test cycles. While the control testing engine conducts scheduled tests, the effectiveness monitor watches for signals of control degradation in real time — catching failures before they become findings and ensuring the risk register reflects the current state of controls, not just their last formal test.

---

## Monitoring Architecture

```
Signal Sources
├── Automated Control Outputs      → logs, reports, system telemetry from controls
├── Performance Signals            → agent-performance-tracker signals relevant to controls
├── Audit Logs                     → enterprise audit trail (zero-trust architecture)
├── Incident Reports               → incidents that implicate control failure
├── Policy Violation Alerts        → policy-management-system violations
├── External Signals               → regulatory notices, threat intelligence, vendor alerts
└── KRI Measurements               → key risk indicator thresholds (from risk register)

        ↓ continuous processing

[Effectiveness Monitor]
├── [Signal Ingestion]            → normalize signals from all sources
├── [Control Attribution]         → which control does each signal relate to?
├── [Threshold Evaluation]        → is this signal above the degradation threshold?
├── [Effectiveness State Update]  → update real-time effectiveness state
├── [Alert Generation]            → notify when effectiveness degrades
└── [Risk Register Sync]          → propagate effectiveness changes to residual risk scores
```

---

## Monitoring Signal Types

```yaml
monitoring_signals:
  DIRECT_CONTROL_OUTPUT:
    description: Signal generated directly by the control itself
    examples:
      - access_denial_log (CTL-SEC-001 firing correctly)
      - encryption_validation_report (CTL-SEC-002 confirming encryption active)
      - data_retention_execution_log (CTL-PRIV-002 deleting expired data)
    reliability: VERY_HIGH (control is self-reporting)
    alert_trigger: control output missing when expected, OR output indicates control failure
  
  EXCEPTION_RATE_SIGNAL:
    description: Rate at which the control is generating exceptions or failures
    examples:
      - access_denied_to_authorized_user (access control may be misconfigured)
      - encryption_failure_on_write (encryption control failing for some records)
      - dsr_requests_missed_sla (PRIV-003 not fulfilling requests on time)
    threshold: domain-specific; see thresholds below
    alert_trigger: rate exceeds threshold over a rolling window
  
  COVERAGE_SIGNAL:
    description: Whether the control is applying to its intended scope
    examples:
      - percentage_of_data_records_with_classification_label (PRIV-001)
      - percentage_of_API_endpoints_with_TLS (SEC-003)
      - percentage_of_AI_systems_with_risk_classification (AI-001)
    threshold: per control; typically >= 99% for CRITICAL controls; >= 95% for HIGH
    alert_trigger: coverage drops below threshold
  
  TIMELINESS_SIGNAL:
    description: Whether time-sensitive controls are executing within required windows
    examples:
      - time_to_notify_data_breach (must be < 72 hours for GDPR)
      - time_to_fulfill_DSR (must be < 30 days for GDPR)
      - vulnerability_patch_age (per remediation SLA)
    alert_trigger: SLA approaching (70% of time elapsed) or SLA breached
  
  INTEGRITY_SIGNAL:
    description: Signals that the control infrastructure itself may be compromised
    examples:
      - audit_log_hash_chain_failure (CTL-SEC-006 may be compromised)
      - unexpected_configuration_change (access control configuration tampered with)
      - control_bypass_attempt (someone trying to circumvent a control)
    reliability_impact: CRITICAL — if integrity signal fires, control is immediately suspect
    alert_trigger: any integrity signal → CRITICAL alert; immediate investigation
  
  AGENT_PERFORMANCE_SIGNAL:
    description: Agent performance degradation affecting controls implemented by agents
    source: agent-performance-tracker.md
    examples:
      - AI governance review agent calibration_error > 0.20 → CTL-AI-004 effectiveness at risk
      - Constitutional evaluation agent OFFLINE → CTL-AI-004 at risk
    alert_trigger: agent powering a control falls below performance threshold
```

---

## Effectiveness State Machine

```yaml
effectiveness_states:
  EFFECTIVE:
    description: Control is operating as designed; all signals within acceptable ranges
    evidence: recent test result EFFECTIVE + no degradation signals since last test
    residual_risk_credit: full credit (per risk-assessment-engine.md discount factors)
    monitoring: standard signal monitoring
  
  MONITORING_ALERT:
    description: One or more signals outside acceptable range; may indicate developing issue
    trigger: single signal breach or multiple low-severity signals
    action: notify control owner immediately; investigation within 24 hours
    residual_risk_credit: 80% of full credit (partial concern)
    monitoring: enhanced (check hourly)
    auto_clear: returns to EFFECTIVE if signals within range for 48 consecutive hours without investigation finding issues
  
  DEGRADED:
    description: Multiple signals indicate control not operating at full effectiveness
    trigger: persistent MONITORING_ALERT (> 48h) OR HIGH-severity single signal
    action: notify control owner + compliance governance lead; remediation plan within 7 days
    residual_risk_credit: PARTIALLY_EFFECTIVE credit (40% of full)
    finding_generated: MEDIUM finding
    monitoring: intensive (check every 15 minutes for automated; daily for manual)
  
  FAILED:
    description: Control is not operating; obligation is unsatisfied
    trigger: multiple HIGH signals + evidence of actual control failure
    action: immediate alert to compliance governance lead; Tier-3+ notification; finding CRITICAL or HIGH
    residual_risk_credit: NO credit (residual risk = inherent risk for affected obligations)
    finding_generated: HIGH or CRITICAL finding
    monitoring: continuous; recovery plan required
  
  BYPASSED:
    description: Evidence of deliberate circumvention of the control
    trigger: bypass attempt confirmed; control output showing systematic exception for specific entity
    action: IMMEDIATE Tier-4+ alert + security investigation; governance incident declared
    residual_risk_credit: NONE; treat as control NOT EXISTING
    finding_generated: CRITICAL finding always
```

---

## Monitoring Thresholds

```yaml
monitoring_thresholds:
  DATA_CLASSIFICATION_COVERAGE (CTL-PRIV-001):
    MONITORING_ALERT: < 99% of records have classification labels
    DEGRADED: < 95%
    FAILED: < 90%
  
  ENCRYPTION_COVERAGE (CTL-SEC-002, CTL-SEC-003):
    MONITORING_ALERT: any record found unencrypted that should be
    DEGRADED: > 0.1% of records unencrypted
    FAILED: > 1% of records unencrypted
    note: for encryption, even one failure is significant
  
  VULNERABILITY_PATCH_COMPLIANCE (CTL-SEC-004):
    MONITORING_ALERT: any CRITICAL vulnerability > 18 hours without remediation plan
    DEGRADED: any CRITICAL vulnerability > 24 hours; or HIGH vulnerability > 10 days
    FAILED: any CRITICAL vulnerability > 48 hours; or multiple HIGH > SLA
  
  AI_SYSTEM_OVERSIGHT (CTL-AI-004):
    MONITORING_ALERT: human_review_bypass_rate > 0% for CRITICAL decisions
    DEGRADED: human_review_override_exercised_without_documentation
    FAILED: high_risk_AI_decision_made_without_human_review_available
  
  AUDIT_LOG_INTEGRITY (CTL-SEC-006):
    MONITORING_ALERT: any gap > 5 minutes in log stream
    DEGRADED: any gap > 30 minutes; or hash chain warning
    FAILED: hash chain failure confirmed; or log gap > 2 hours
    note: any FAILED state here triggers security investigation regardless of other context
  
  DSR_FULFILLMENT_SLA (CTL-PRIV-003):
    MONITORING_ALERT: any DSR request at 70% of SLA without resolution
    DEGRADED: any DSR request at 90% of SLA without resolution
    FAILED: any DSR request past SLA
```

---

## Continuous Monitoring Schedule

```yaml
monitoring_schedule:
  automated_controls:
    signal_check_frequency: every 5 minutes (for CONTINUOUS controls)
    effectiveness_state_update: every 15 minutes
    daily_summary: 06:00 UTC (all automated control effectiveness states)
  
  manual_controls:
    signal_check_frequency: daily (based on evidence submission and attestation checks)
    effectiveness_state_update: daily
    overdue_check: hourly (is the next test due? is evidence overdue?)
  
  kri_monitoring:
    frequency: per KRI definition (daily for most; hourly for critical ones)
    threshold_evaluation: on each measurement
  
  cross_control_analysis:
    frequency: weekly
    action: look for patterns where multiple controls degrading simultaneously (may indicate systemic issue)
    escalation: if > 3 controls in same domain DEGRADED simultaneously → domain-level investigation
```

---

## Alerts and Escalation

```yaml
alert_management:
  MONITORING_ALERT:
    recipients: control_owner
    channel: inter-agent-messaging TASK_ASSIGNMENT (investigation task)
    SLA: acknowledge within 2 hours; investigation update within 24 hours
  
  DEGRADED:
    recipients: control_owner + compliance_governance_lead
    channel: ESCALATION message
    SLA: remediation plan within 7 days; status update every 48 hours
  
  FAILED:
    recipients: control_owner + compliance_governance_lead + Tier-3+
    channel: ESCALATION message (HIGH severity)
    SLA: immediate acknowledgment; remediation plan within 24 hours
  
  BYPASSED:
    recipients: control_owner + compliance_governance_lead + Tier-4+ + security
    channel: ESCALATION message (CRITICAL severity)
    SLA: immediate response; governance incident process initiated
  
  alert_fatigue_prevention:
    MONITORING_ALERT: suppressed if same control was at MONITORING_ALERT within last 24h and investigation is active
    no_suppression: FAILED and BYPASSED alerts never suppressed
    weekly_digest: all MONITORING_ALERT events summarized in weekly digest to governance lead
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | Controls being monitored; evidence requirements |
| `risk-and-controls/control-testing-engine.md` | Formal test results set baseline effectiveness state |
| `risk-and-controls/enterprise-risk-register.md` | Effectiveness state changes update residual risk |
| `audit-and-evidence/evidence-collection-engine.md` | Evidence collection feeds signal ingestion |
| `audit-and-evidence/finding-management.md` | DEGRADED and FAILED states generate findings |
| `agent-performance/agent-performance-tracker.md` | Agent performance signals for agent-powered controls |
| `governance-operations/compliance-operations-dashboard.md` | Effectiveness states displayed in real time |
