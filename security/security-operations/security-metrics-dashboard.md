# Security Metrics Dashboard
**ID:** SOC-SMD-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides real-time and historical visibility into the enterprise security posture — threat detection performance, SOC operational efficiency, vulnerability exposure, threat intelligence coverage, and incident trends — at every organizational level from T3 SOC analysts to T4 executive security briefings. The Security Metrics Dashboard is the operational visibility layer of the security program, making the difference between a program that merely responds and one that improves.

---

## Dashboard Layers

```yaml
dashboard_layers:

  SOC_OPERATIONAL (T3 SOC analysts; T2 on-call):
    refresh_rate: 30 seconds
    panels:
      - live_alert_queue (severity-sorted; SLA countdown; analyst assignment)
      - event_volume_per_minute (trend; spike detection)
      - active_playbook_executions (step progress; human gates pending)
      - ioc_match_rate (last 1hr; top matched IOC types)
      - detection_system_health (all detectors; green/amber/red)
      - threat_hunt_board (active hunts; status)
      - active_incidents (count by severity; T2 assignments)
    actions: assign alerts; approve playbook gates; escalate incidents
    
  SECURITY_LEADERSHIP (T3 SOC lead; T4 CISO):
    refresh_rate: 5 minutes
    panels:
      - security_posture_score (0–100; RAG; trend 30 days)
      - MTTD_MTTR_trends (last 30 days; vs. targets)
      - open_vulnerabilities_by_priority (P0/P1/P2 counts; SLA status)
      - threat_landscape_summary (active campaigns; enterprise relevance)
      - incident_summary (open/closed/critical; MTTRR)
      - detection_coverage_heatmap (MITRE ATT&CK matrix; covered vs. gap)
      - false_positive_rate_trend (per detection source; target < 10%)
      - ai_specific_threat_metrics (prompt injection attempts; jailbreak blocks; model abuse)
      
  EXECUTIVE_BRIEFING (T4; Board security committee):
    refresh_rate: daily
    panels:
      - enterprise_risk_posture (qualitative + quantitative; peer benchmark)
      - critical_incidents_summary (CRITICAL/HIGH; resolution; regulatory impact)
      - regulatory_security_compliance (GDPR Art.32; SOX; HIPAA security rule; NIS2)
      - vulnerability_exposure (P0/P1 count; patch compliance rate)
      - threat_intelligence_coverage (jurisdiction and sector coverage)
      - security_investment_ROI (incidents prevented; breach cost avoided)
```

---

## Core Security Metrics

```yaml
core_metrics:

  # DETECTION PERFORMANCE
  MTTD_CRITICAL:
    definition: mean time from threat occurrence to SOC alert creation for CRITICAL events
    formula: avg(alert.created_at - threat_event.occurred_at) for CRITICAL severity alerts
    target: < 5 minutes
    data_source: security-alert-manager
    
  MTTD_HIGH:
    target: < 30 minutes
    
  MTTR_CRITICAL:
    definition: mean time from alert creation to containment action taken
    formula: avg(containment.executed_at - alert.created_at) for CRITICAL alerts
    target: < 1 hour
    
  MTTRR:
    definition: mean time from alert creation to full incident resolution (closed)
    target: < 4 hours (CRITICAL); < 24 hours (HIGH)
    
  FALSE_POSITIVE_RATE:
    definition: % of alerts closed as FALSE_POSITIVE
    formula: FALSE_POSITIVE_closed / total_closed * 100
    target: < 10% overall; < 5% per individual detection rule
    action_threshold: if any rule > 20% FP for 7 days → mandatory rule review
    
  DETECTION_COVERAGE:
    definition: % of MITRE ATT&CK techniques for which at least one detection rule exists
    formula: techniques_with_rules / total_applicable_techniques * 100
    target: > 80% for techniques relevant to enterprise threat profile
    display: ATT&CK matrix heat map (covered in green; gap in red)
    
  # SOC EFFICIENCY
  ALERT_VOLUME_PER_ANALYST_PER_SHIFT:
    target: < 50 (above this = analyst fatigue risk)
    alert_at: > 80 per shift for 3 consecutive days
    
  AUTO_CLOSE_RATE:
    definition: % of events closed by T0 without analyst touch
    target: > 70%
    
  SLA_COMPLIANCE_RATE:
    definition: % of alerts resolved within their SLA
    target: > 95%
    
  PLAYBOOK_AUTOMATION_RATE:
    definition: % of applicable alerts where playbook executed without human gate failure
    target: > 90%
    
  # VULNERABILITY MANAGEMENT
  P0_OPEN_COUNT:
    definition: number of P0 vulnerabilities currently unpatched
    target: 0 (P0 must always be in active remediation)
    alert_trigger: P0_open_count > 0 at 24-hour mark
    
  P1_SLA_COMPLIANCE:
    definition: % of P1 vulnerabilities patched within 7-day SLA
    target: > 95%
    
  MEAN_DAYS_TO_PATCH_CRITICAL:
    target: < 2 days (P0) | < 7 days (P1)
    
  PATCH_COMPLIANCE_RATE:
    definition: % of assets with all P0/P1 patches applied
    target: > 99% for P0; > 95% for P1
    
  # THREAT INTELLIGENCE
  IOC_COVERAGE:
    definition: % of enterprise network endpoints covered by IOC blocklist checking
    target: > 99%
    
  FEED_FRESHNESS:
    definition: % of active feeds with data refreshed within 2× their expected frequency
    target: > 95%
    
  TI_ACTION_RATE:
    definition: % of threat bulletins that resulted in proactive defense action before incident
    target: > 70% (intelligence should drive proactive action)
    
  # AI-SPECIFIC SECURITY METRICS
  PROMPT_INJECTION_BLOCK_RATE:
    definition: % of prompt injection attempts blocked at first attempt (no escalation)
    target: > 95%
    
  JAILBREAK_ATTEMPT_TREND:
    definition: jailbreak attempt count per week; trend direction
    alert: if trend is INCREASING over 4 consecutive weeks
    
  CONSTITUTIONAL_PROXIMITY_INCIDENTS:
    definition: count of alerts where agent reached constitutional proximity > 0.85
    target: trending toward 0
    
  AI_MODEL_INTEGRITY_CHECKS_PASSING:
    definition: % of daily model integrity checks passing
    target: 100% (any failure = P0 security event)
```

---

## Security Posture Score

```
compute_security_posture_score():

  # Component scores (0–100 each)
  detection_score = score_detection_performance()
    # MTTD performance vs targets: 40%
    # Detection coverage: 30%
    # False positive rate: 30%
    
  soc_efficiency_score = score_soc_efficiency()
    # SLA compliance: 50%
    # Analyst alert volume: 25%
    # Playbook automation rate: 25%
    
  vulnerability_score = score_vulnerability_posture()
    # P0 open count (0 = 100; any open = drops proportionally): 40%
    # P1 SLA compliance: 30%
    # Patch compliance rate: 30%
    
  threat_intel_score = score_threat_intel_coverage()
    # Feed freshness: 30%
    # IOC coverage: 40%
    # TI action rate: 30%
    
  ai_security_score = score_ai_security()
    # Prompt injection block rate: 40%
    # Model integrity checks: 30%
    # Constitutional proximity incidents trend: 30%
    
  # Weighted composite
  posture_score = (
    detection_score     * 0.30 +
    soc_efficiency_score * 0.20 +
    vulnerability_score  * 0.25 +
    threat_intel_score   * 0.15 +
    ai_security_score    * 0.10
  )
  
  rag_status = GREEN if posture_score >= 80 else AMBER if posture_score >= 65 else RED
  
  Return: posture_score, rag_status
```

---

## Regulatory Security Compliance Metrics

```yaml
regulatory_security_compliance:
  GDPR_ART32:
    description: Appropriate technical/organizational security measures
    tracked: encryption_coverage, access_control_effectiveness, breach_detection_time
    target: all measures demonstrably implemented; MTTD < 24hr for personal data breaches
    
  NIS2:
    description: Network and Information Systems security obligations
    tracked: incident_notification_SLA (< 24hr initial; < 72hr detailed), security_measures_audit
    jurisdiction: JUR-EU
    
  SOX_ITGC:
    description: IT General Controls for financial reporting integrity
    tracked: access_control_effectiveness, change_management_compliance, audit_log_integrity
    jurisdiction: JUR-US
    
  HIPAA_SECURITY_RULE:
    description: Healthcare PHI security controls
    tracked: PHI_access_audit_coverage, encryption_of_PHI_at_rest_and_transit, workforce_training
    jurisdiction: JUR-US
    
  ISO_27001:
    description: Information security management system controls
    tracked: control_effectiveness_average, audit_finding_remediation_rate, risk_assessment_currency
    
  cadence: monthly compliance metrics report; quarterly executive security report
```

---

## Integration

```
Feeds into:
  (executive board security briefings generated from this data)
  adaptive-compliance/compliance-dashboard.md — security posture score surfaced here
  
Receives from:
  security-operations-center.md — SOC operational data
  security-alert-manager.md — alert metrics
  vulnerability-intelligence.md — vulnerability posture metrics
  threat-intelligence-platform.md — TI coverage metrics
  behavioral-anomaly-detector.md — anomaly detection metrics
  ai-specific-threat-detector.md — AI-specific security metrics
  incident-response-orchestrator.md — incident resolution metrics
```

---

## Governance

**Security posture score drives escalation:** Score < 65 (AMBER) triggers weekly T4 security review; score < 50 (RED) triggers immediate T4 escalation and board notification  
**Dashboard sovereignty:** Each entity's SOC dashboard runs within that entity's SEZ; cross-entity security metrics aggregated in federation layer (no raw entity data)  
**AI security metrics are constitutional-adjacent:** Constitutional proximity incident count is shared with constitutional-governor-quorum weekly  
**Audit:** Dashboard access and alert acknowledgments to `memory/security-operations/dashboard-access.jsonl`
