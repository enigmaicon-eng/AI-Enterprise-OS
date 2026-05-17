# Security Operations Center
**ID:** SOC-SOC-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

The Security Operations Center (SOC) is the 24/7 operational hub for detecting, investigating, and responding to security threats across the Enterprise AI OS. It coordinates the flow from raw security event → enriched alert → investigated incident → contained threat → post-incident learning. The SOC is AI-augmented: routine alert triage, IOC enrichment, and initial playbook execution are automated, freeing human analysts to focus on novel threats, complex investigations, and adversarial AI scenarios that require judgment.

---

## SOC Architecture

```
SECURITY OPERATIONS CENTER — AI-AUGMENTED ARCHITECTURE

TIER 0 — AUTOMATED TRIAGE (no human; AI-executed)
  Input: all security events (raw)
  Function: normalize → correlate → score → auto-close known-good → auto-block known-bad
  Throughput: 100,000+ events/hour
  Output: prioritized alert queue for T1 | auto-closed non-threats | auto-blocked IOC matches
  SLA: < 30 seconds from event to triage decision
  
TIER 1 — ALERT ANALYSIS (AI-assisted human analysts)
  Input: prioritized alerts from T0; all HIGH/CRITICAL alerts
  Function: alert investigation; IOC enrichment; initial scope determination; playbook execution
  Staffing: 24/7 coverage; rotation-based
  SLA: < 15 min for CRITICAL; < 1 hour for HIGH; < 4 hours for MEDIUM
  Escalation: to T2 for confirmed intrusions; novel patterns; AI-specific threats
  
TIER 2 — INCIDENT RESPONSE (specialist analysts)
  Input: escalated incidents from T1; major security events
  Function: deep investigation; forensic analysis; containment; remediation coordination
  Staffing: business hours primary; on-call for off-hours CRITICAL
  SLA: engaged within 30 min for CRITICAL; 2hr for HIGH
  Escalation: to T3 SOC lead for high-complexity incidents; to T4 for enterprise-wide threats
  
TIER 3 — SOC LEADERSHIP + THREAT HUNTING
  Input: strategic threat picture; T2 escalations; threat intelligence products
  Function: threat hunting; detection engineering oversight; SOC performance; T4 briefing
  Staffing: business hours + on-call
  Authority: T3
```

---

## Event Processing Pipeline

```
process_security_event(raw_event):

  # Stage 1: Normalize (< 5ms)
  normalized = normalize_event(raw_event)
  # Common event format: timestamp, source, event_type, entity_id, action, outcome, context

  # Stage 2: Enrich (< 100ms; parallel)
  [PARALLEL]:
  enriched = {
    ioc_match: ioc_store.match(normalized),           # IOC blocklist check
    actor_match: actor_registry.match(normalized),    # TTP pattern match
    vuln_match: vuln_intel.correlate(normalized),     # vulnerability correlation
    asset_context: asset_inventory.lookup(normalized) # internal asset context
  }
  
  # Stage 3: T0 decision (< 30 seconds total)
  if enriched.ioc_match and enriched.ioc_match.confidence >= 0.90:
    if enriched.ioc_match.severity == CRITICAL:
      auto_block(normalized, enriched.ioc_match)
      create_alert(CRITICAL, auto_actioned=True)
    else:
      create_alert(enriched.ioc_match.severity, enriched=enriched)
      
  elif is_known_benign(normalized):
    suppress(normalized, reason="known_benign")
    
  elif is_duplicate(normalized, window=300s):
    deduplicate(normalized)
    
  else:
    # Baseline anomaly scoring
    anomaly_score = behavioral_anomaly_detector.score(normalized)
    alert_severity = map_anomaly_to_severity(anomaly_score, normalized.event_type)
    create_alert(alert_severity, enriched=enriched, anomaly_score=anomaly_score)
    
  log_event_processed(normalized.event_id)
```

---

## Alert Management

```yaml
alert_management:
  alert_id: ALT-{NNN}
  severity: CRITICAL | HIGH | MEDIUM | LOW | INFO
  
  priority_scoring:
    base: alert_severity (CRITICAL=100, HIGH=70, MEDIUM=40, LOW=20)
    asset_criticality_modifier: +20 if critical asset; +10 if important; ±0 if standard
    ioc_confidence_modifier: +15 if IOC confidence >= 0.90; +5 if >= 0.70
    actor_attribution_modifier: +20 if attributed to EXPERT/INNOVATOR actor; +10 if ADVANCED
    ai_targeting_modifier: +25 if alert involves AI-specific attack vector
    recency_modifier: +5 if similar alert seen in last 24h (escalating pattern)
    
  sla:
    CRITICAL: < 15 minutes first response; < 1 hour containment decision
    HIGH: < 1 hour first response; < 4 hours investigation complete
    MEDIUM: < 4 hours first response; < 24 hours resolved or escalated
    LOW: < 24 hours first response; < 7 days resolved
    
  auto_escalation:
    sla_50_percent: automated reminder to assigned analyst
    sla_75_percent: escalate to T2 if still at T1
    sla_100_percent: auto-escalate to T3 lead; T4 notification for CRITICAL
```

---

## SOC Playbook Integration

```yaml
playbook_integration:
  automatic_playbook_execution:
    PHISHING_EMAIL_DETECTED: PB-SOC-001 (header analysis; URL detonation; account quarantine)
    MALWARE_DETECTED_ENDPOINT: PB-SOC-002 (isolate; collect artifacts; remediate)
    CREDENTIAL_COMPROMISE: PB-SOC-003 (revoke tokens; reset; audit access log)
    IOC_MATCHED_CRITICAL: PB-SOC-004 (block; scope; notify)
    AI_PROMPT_INJECTION_DETECTED: PB-SOC-005 (AI-specific; quarantine agent; preserve session)
    CROSS_BORDER_ANOMALY: PB-SOC-006 (sovereignty-aware; Legal Org notification)
    RANSOMWARE_INDICATORS: PB-SOC-007 (isolate; backup validation; IR escalation)
    INSIDER_THREAT_BEHAVIORAL: PB-SOC-008 (evidence preservation; HR notification gate)
    
  human_required_before_execution:
    - PB-SOC-008 (insider threat; HR and Legal Org notification required)
    - any playbook affecting constitutional domains
    - any playbook affecting CN entity (CN compliance officer required)
```

---

## SOC Metrics (see security-metrics-dashboard.md for full detail)

```yaml
soc_metrics:
  operational:
    - events_per_hour: total events processed
    - alert_volume_by_severity: alert counts by tier
    - mean_time_to_detect (MTTD): event_occurrence → alert_created
    - mean_time_to_respond (MTTR): alert_created → containment_action
    - mean_time_to_resolve (MTTRR): alert_created → incident_closed
    - false_positive_rate: % of alerts confirmed benign after investigation
    - auto_close_rate: % of events closed by T0 without analyst action
    - playbook_execution_success_rate: % of automated playbook runs completing without error
    
  targets:
    MTTD_CRITICAL: < 5 minutes
    MTTD_HIGH: < 30 minutes
    MTTR_CRITICAL: < 1 hour
    MTTR_HIGH: < 4 hours
    false_positive_rate: < 10% (target < 5%)
    auto_close_rate: > 70% (reduces analyst burden)
```

---

## Threat Hunting

```yaml
threat_hunting:
  description: Proactive search for threats that evade automated detection
  
  cadence:
    weekly: hypothesis-driven hunts based on threat intelligence products
    monthly: comprehensive environment sweep per MITRE ATT&CK coverage
    on_threat_bulletin: targeted hunt for IOCs and TTPs in new bulletin
    
  hunt_types:
    IOC_SWEEP: hunt for known malicious indicators not yet generating alerts
    TTP_BEHAVIORAL: search for behavioral patterns matching threat actor TTPs
    ANOMALY_HUNT: investigate statistical anomalies without alert correlation
    AI_SPECIFIC: hunt for prompt injection, model abuse, adversarial input patterns
    
  output:
    new_detections: feed to detection-engineering.md for rule creation
    threat_intelligence: feed to threat-intelligence-fusion.md
    incidents: escalate to incident-response-orchestrator if live threat found
    negative_findings: documented as evidence of coverage; retained
    
  hunt_records:
    hunt_id: HNT-{NNN}
    hypothesis: string
    techniques_covered: [string]          # MITRE ATT&CK IDs
    data_sources_queried: [string]
    findings: string
    new_rules_created: [rule_id]
    new_incidents_opened: [INC-{NNN}]
```

---

## Integration

```
Feeds into:
  security-alert-manager.md — alert lifecycle managed here
  soc-playbook-engine.md — playbook execution coordinated here
  incident-response-orchestrator.md — confirmed incidents escalated here
  security-metrics-dashboard.md — SOC metrics surfaced here

Receives from:
  threat-detection/ — all detection events flow into SOC event pipeline
  threat-intelligence-platform.md — IOC context and threat bulletins
  security-event-correlator.md — correlated events → prioritized alerts
  adaptive-compliance/compliance-engine.md — compliance violations surface as security alerts
```

---

## Governance

**24/7 coverage is mandatory:** SOC Tier 1 maintains 24/7 coverage; gaps require T4 approval and compensating coverage  
**AI-specific threat handling:** All AI-targeting alerts (prompt injection, model poisoning, jailbreak) are automatically elevated to T2 minimum; constitutional proximity to restricted domains always T2+  
**Sovereignty-aware operations:** SOC analysts operate within their entity's jurisdiction; cross-entity incident investigation requires cross-entity collaboration protocol  
**Audit:** All SOC event processing, alert decisions, and escalations to `memory/security-operations/soc-audit.jsonl`; 7-year retention
