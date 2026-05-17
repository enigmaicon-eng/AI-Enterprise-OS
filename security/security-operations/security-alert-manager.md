# Security Alert Manager
**ID:** SOC-SAM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Manages the full lifecycle of security alerts — from creation through triage, investigation, escalation, and closure — ensuring that every alert receives appropriate attention within its SLA and that the right analyst sees the right alert at the right time. The Security Alert Manager is the queue management and routing layer of the SOC: it prevents alert fatigue by intelligent deduplication and prioritization, and prevents gaps by enforcing SLAs with automatic escalation.

---

## Alert Lifecycle

```
CREATED → TRIAGED → INVESTIGATING → [ESCALATED →] CONTAINED → CLOSED
     ↓                                                            |
  AUTO_CLOSED (T0 suppression)                              REOPENED (if recurrence)
```

```yaml
alert_states:

  CREATED:
    entry: event correlator or detection system generates alert
    automatic: enrichment (IOC context; actor context; asset context)
    routing: auto-assign to T1 analyst (CRITICAL/HIGH) or queue (MEDIUM/LOW)
    
  TRIAGED:
    entry: analyst acknowledges and classifies alert
    analyst_actions: confirm severity; set investigation priority; apply initial playbook
    SLA_clock: starts at CREATED; T1 analyst must reach TRIAGED within SLA
    
  INVESTIGATING:
    entry: analyst actively working the alert
    actions: timeline reconstruction; IOC scope; asset impact; lateral movement check
    tools: threat intel context; vulnerability correlation; behavioral analysis
    
  ESCALATED:
    entry: alert requires T2/T3 expertise or authority
    conditions: confirmed intrusion; novel pattern; AI-specific threat; multi-entity scope
    SLA: T2 engagement within 30min (CRITICAL); 2hr (HIGH) of escalation
    
  CONTAINED:
    entry: threat is confirmed and containment action taken
    actions: isolation; blocking; evidence preservation; notification
    validation: containment verified (no further malicious activity from same source)
    
  CLOSED:
    entry: alert fully resolved; root cause identified; remediation complete
    required: closure_classification + root_cause + lessons_learned
    retention: alert record retained 7 years
    
  AUTO_CLOSED:
    entry: T0 tier confirms alert is known-benign or duplicate
    no_analyst_action: true
    audit: logged; sampled for analyst review (5% of auto-closed reviewed weekly)
```

---

## Alert Record Schema

```yaml
alert_record:
  alert_id: ALT-{NNN}
  created_at: ISO8601
  severity: CRITICAL | HIGH | MEDIUM | LOW | INFO
  priority_score: integer (0–200)   # computed by SOC priority scoring
  
  alert_type: string                # e.g., IOC_MATCH, BEHAVIORAL_ANOMALY, CORRELATION_TRIGGER,
                                    # AI_THREAT, COMPLIANCE_VIOLATION, CONSTITUTIONAL_PROXIMITY
  
  source:
    detection_system: string        # e.g., behavioral-anomaly-detector, security-event-correlator
    correlation_id: COR-EVT-{NNN} | null
    raw_event_ids: [string]
    
  enrichment:
    ioc_matches: [IOC-{NNN}]
    actor_match: TA-{NNN} | null
    vuln_match: VULN-{NNN} | null
    asset_criticality: CRITICAL | HIGH | STANDARD | LOW
    affected_jurisdictions: [JUR-{XX}]
    ai_specific: boolean
    
  assignment:
    tier: T0 | T1 | T2 | T3
    assigned_to: string | null      # agent_id of assigned analyst
    assigned_at: ISO8601 | null
    
  sla:
    response_deadline: ISO8601
    resolution_deadline: ISO8601
    sla_status: ON_TIME | AT_RISK | BREACHED
    
  investigation:
    timeline: [{timestamp, analyst_id, action, notes}]
    scope_determination: string | null
    lateral_movement_confirmed: boolean | null
    
  resolution:
    outcome: TRUE_POSITIVE | FALSE_POSITIVE | BENIGN_POSITIVE | DUPLICATE
    root_cause: string | null
    containment_actions: [string]
    incident_created: INC-{NNN} | null
    
  closure:
    closed_at: ISO8601 | null
    closed_by: string | null
    lessons_learned: string | null
    
  integrity:
    entry_hash: sha256
```

---

## Priority Scoring

```
score_alert_priority(alert):

  base = {CRITICAL: 100, HIGH: 70, MEDIUM: 40, LOW: 20, INFO: 5}[alert.severity]
  
  modifiers = 0
  
  # Asset criticality
  if alert.enrichment.asset_criticality == CRITICAL: modifiers += 20
  elif alert.enrichment.asset_criticality == HIGH: modifiers += 10
  
  # IOC confidence
  if any(ioc.confidence >= 0.90 for ioc in alert.enrichment.ioc_matches): modifiers += 15
  elif any(ioc.confidence >= 0.70 for ioc in alert.enrichment.ioc_matches): modifiers += 5
  
  # Actor attribution
  if alert.enrichment.actor_match:
    actor = actor_registry.get(alert.enrichment.actor_match)
    if actor.classification.sophistication in [EXPERT, INNOVATOR]: modifiers += 20
    elif actor.classification.sophistication == ADVANCED: modifiers += 10
    
  # AI-specific attack bonus
  if alert.enrichment.ai_specific: modifiers += 25
  
  # Constitutional proximity (from constitutional events)
  if alert.alert_type in [CONSTITUTIONAL_PROXIMITY, AI_THREAT]: modifiers += 30
  
  # Recency of similar alert (pattern escalation)
  if similar_alert_in_last_24h(alert): modifiers += 5
  
  priority_score = min(200, base + modifiers)
  Return: priority_score
```

---

## Alert Routing

```yaml
alert_routing:
  PRIORITY >= 140 (CRITICAL tier):
    routing: T1 immediate assignment + T2 notification
    auto_playbook: yes (if applicable)
    T4_notification: if alert_type in [CONSTITUTIONAL_PROXIMITY, CROSS_JURISDICTION_LEAK, RANSOMWARE]
    
  PRIORITY 80–139 (HIGH tier):
    routing: T1 next-available assignment
    auto_playbook: yes (if applicable)
    T4_notification: no (T3 notification at SLA 75% if unresolved)
    
  PRIORITY 40–79 (MEDIUM tier):
    routing: T1 queue; assigned within 4 hours
    auto_playbook: limited (standard IOC playbooks only)
    
  PRIORITY < 40 (LOW/INFO tier):
    routing: queue; assigned within 24 hours; may be batched
    auto_playbook: no
    
  AI_SPECIFIC alerts (any priority):
    routing: T2 minimum (regardless of base priority)
    reason: AI-targeting threats require specialist assessment
    
  CROSS_ENTITY alerts:
    routing: T2; notify affected entity SOC leads
    sovereign_awareness: alert record created in each affected entity's audit trail
```

---

## Deduplication

```yaml
deduplication:
  window: 300 seconds (5 minutes)
  dedup_key: sha256(alert_type + primary_entity_id + source_detection_system)
  
  on_duplicate:
    UPDATE: increment duplicate_count on existing alert; add new event_id to raw_event_ids
    DO_NOT: create new alert record; restart SLA clock
    
  exception_no_dedup:
    CONSTITUTIONAL_EVENTS: each constitutional event creates its own alert (never deduped)
    DIFFERENT_SEVERITY: if duplicate has higher severity than existing, create new alert + link
    ESCALATED_ALERTS: escalated alerts are never deduped against new events
```

---

## Alert Quality Metrics

```yaml
alert_quality_metrics:
  false_positive_rate: % of alerts closed as FALSE_POSITIVE; target < 10%
  mean_time_to_acknowledge: time from CREATED to TRIAGED; target < 5 min (CRITICAL)
  mean_time_to_resolve: time from CREATED to CLOSED; target per SLA
  sla_compliance_rate: % of alerts resolved within SLA; target > 95%
  escalation_rate: % of T1 alerts escalated to T2; target 15–25% (too high = T1 undertrained; too low = T1 not escalating enough)
  auto_close_accuracy: % of AUTO_CLOSED alerts that don't recur; target > 98%
  
  review_cadence: weekly alert quality report to T3 SOC lead
  tuning_trigger: if FP rate > 15% for any detection source, trigger detection rule review
```

---

## Integration

```
Feeds into:
  incident-response-orchestrator.md — CRITICAL alerts with confirmed scope create incidents
  security-metrics-dashboard.md — alert metrics feed dashboard
  post-incident-analysis.md — closed alert data feeds lessons learned

Receives from:
  security-event-correlator.md — correlation triggers create alerts
  behavioral-anomaly-detector.md — anomaly alerts enter here
  ai-specific-threat-detector.md — AI threat alerts enter here
  threat-intelligence-platform.md — IOC match alerts enter here
```

---

## Governance

**Constitutional alerts are never auto-closed by T0:** Any alert involving constitutional events requires T2 minimum human review; T0 cannot suppress them  
**SLA breach is T4 notification for CRITICAL:** Any CRITICAL alert breaching its SLA triggers automatic T4 notification  
**Alert tampering:** Alert records are hash-chained; any modification to a closed alert triggers security incident  
**Cross-entity alert sharing:** Alerts implicating multiple entities are shared with each entity's SOC via cross-entity collaboration protocol (sovereignty-aware)  
**Audit:** All alert lifecycle events to `memory/security-operations/alert-audit.jsonl`; 7-year retention
