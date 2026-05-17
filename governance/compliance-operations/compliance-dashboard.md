# Compliance Dashboard
**ID:** COP-CDH-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Provides real-time and historical visibility into the enterprise compliance posture at every organizational level — from T3 operational governance to T4 executive oversight to board-level reporting. The Compliance Dashboard is the single pane of glass for compliance: it surfaces active violations, control status, risk scores, regulatory deadlines, pending reviews, in-flight adaptations, and predictive warnings in a layered interface where each audience sees the right depth of information.

---

## Dashboard Layers

```yaml
dashboard_layers:

  OPERATIONAL_LAYER (T3 Governance Org):
    refresh_rate: 30 seconds
    panels:
      - live_compliance_rate (rolling 24h; entity and domain breakdown)
      - open_violations_queue (severity, age, assignee, SLA remaining)
      - require_review_queue (pending human decisions; SLA countdown)
      - control_effectiveness_matrix (heat map: domain × jurisdiction × score)
      - risk_score_distribution (histogram; last 1h)
      - active_exceptions (count; expiring within 30 days highlighted)
      - in_flight_adaptations (AWF-{NNN} progress; stage; SLA status)
    actions:
      - approve/reject REQUIRE_REVIEW items inline
      - assign violations to remediation owners
      - escalate to T4 with one click
      
  GOVERNANCE_LAYER (T4 Entity + Federation Council):
    refresh_rate: 5 minutes
    panels:
      - entity_compliance_health_scores (per entity; trend; vs. target)
      - critical_high_violations (count; time-to-resolve; breach of SLA flagged)
      - regulatory_calendar (next 90 days; deadline status)
      - prediction_alerts (>= 50% probability, 14-day horizon)
      - open_exceptions_register (all active; requiring renewal within 30d)
      - control_gaps (domains with no effective control)
      - audit_status (in-progress audits; open findings by severity)
      - regulatory_intelligence_alerts (new HIGH/CRITICAL RIUs, last 7d)
    actions:
      - approve exception requests
      - authorize T4-level remediation
      - trigger emergency adaptation workflow
      
  EXECUTIVE_LAYER (Board; external stakeholders with granted access):
    refresh_rate: daily (not real-time)
    panels:
      - global_compliance_health_score (0–100; RAG status: GREEN ≥ 90, AMBER 75–89, RED < 75)
      - material_violations_summary (CRITICAL/HIGH only; resolution status)
      - regulatory_landscape_summary (significant regulatory changes, last 90d)
      - certification_status (ISO 27001, SOC 2, ISO 42001: CURRENT | EXPIRED | IN_PROGRESS)
      - forward_looking_risk (90-day prediction summary; top 3 risks)
      - compliance_investment_summary (cost of compliance operations; value of averted penalties)
    format: read-only; narrative + charts; no raw data
```

---

## Key Metrics Visualizations

```yaml
key_visualizations:

  COMPLIANCE_HEALTH_SCORE:
    formula: weighted average of compliance_rate(×0.35) + control_effectiveness_avg(×0.30) +
             mttd_score(×0.15) + mttr_score(×0.10) + exception_rate_score(×0.10)
    range: 0–100
    thresholds: GREEN >= 90 | AMBER 75–89 | RED < 75
    drill_down: entity → domain → agent class → individual agent
    
  CONTROL_EFFECTIVENESS_HEAT_MAP:
    axes: compliance domain (rows) × jurisdiction (columns)
    value: average control effectiveness score per cell
    color: GREEN >= 0.80 | AMBER 0.60–0.79 | RED < 0.60
    click_to_drill: opens control list for that domain×jurisdiction cell
    
  VIOLATION_TREND_CHART:
    x_axis: time (last 30 days, daily bars)
    y_axis: violation count (stacked by severity: CRITICAL, HIGH, MEDIUM, LOW)
    overlay: compliance_rate line (right axis)
    annotation: regulatory changes (RIU events) marked on x-axis
    
  RISK_SCORE_HEAT_MAP:
    axes: agent class (rows) × compliance domain (columns)
    value: average risk score for agent class × domain
    time_selector: last 1h | 24h | 7d | 30d
    
  REGULATORY_CALENDAR_VIEW:
    display: 90-day timeline
    entries: upcoming deadlines (color by urgency); active AWFs (progress bars)
    traffic_light: ON_TRACK (green) | AT_RISK (amber) | BREACHED (red)
    
  PREDICTION_RADAR:
    display: top 10 violation predictions (probability; horizon; recommended action)
    sorted_by: probability × severity
    confidence_shown: always (low-confidence predictions visually distinguished)
    
  REMEDIATION_SLA_TRACKER:
    display: table of open violations with SLA countdown
    color: > 50% SLA remaining (green) | 25–50% (amber) | < 25% (red) | breached (purple)
    filter_by: severity | jurisdiction | domain | assignee
```

---

## Alert Surfacing

```yaml
dashboard_alerts:
  CRITICAL_VIOLATION:
    display: full-screen banner (operational + governance layers)
    auto_dismiss: false (requires human acknowledgment)
    escalation: also sent via push notification to T4
    
  SLA_BREACH_IMMINENT (< 15% SLA remaining):
    display: flashing orange badge on violation queue
    notification: T3 push notification
    
  PREDICTION_HIGH_CONFIDENCE (>= 75% probability):
    display: highlighted card in prediction radar
    notification: daily digest (not real-time push)
    
  CONTROL_FAILED (effectiveness < 0.40):
    display: red cell in control heat map + banner in operational layer
    notification: T3 push notification
    
  REGULATORY_DEADLINE_AT_RISK:
    display: red entry in regulatory calendar + governance layer banner
    notification: T4 push notification
    
  NEW_HIGH_IMPACT_RIU:
    display: notification badge in regulatory intelligence section
    notification: T4 + Legal Org email digest
```

---

## Data Sources

```yaml
data_sources:
  PRIMARY:
    - memory/adaptive-compliance/compliance-decisions.jsonl         (real-time)
    - memory/adaptive-compliance/violations.jsonl                   (real-time)
    - memory/adaptive-compliance/control-effectiveness.jsonl        (every 5 min)
    - memory/adaptive-compliance/state-transitions.jsonl            (real-time)
    - memory/compliance-intelligence/risk-scores.jsonl              (real-time)
    - memory/compliance-intelligence/predictions.jsonl              (every 6 hours)
    - memory/compliance-intelligence/violation-patterns.jsonl       (weekly)
    - memory/regulatory-adaptation/change-records.jsonl             (as detected)
    - memory/regulatory-adaptation/adaptation-audit.jsonl           (as events occur)
    - memory/regulatory-adaptation/calendar-audit.jsonl             (daily)
    - memory/compliance-operations/remediation-log.jsonl            (real-time)
    - memory/compliance-operations/audit-log.jsonl                  (as events occur)
    
  LATENCY:
    operational_layer: <= 30 seconds end-to-end
    governance_layer: <= 5 minutes
    executive_layer: daily batch
```

---

## Access Control

```yaml
access_control:
  OPERATIONAL_LAYER:
    authorized: T3 Governance Org agents; T3 Legal Org agents
    authentication: behavioral contract verification
    data_scope: entity-scoped (EU T3 sees EU entity data only)
    
  GOVERNANCE_LAYER:
    authorized: T4 Entity + Federation Council T4 representatives
    authentication: T4 authorization + behavioral contract
    data_scope: T4 sees own entity + federation aggregate (anonymized)
    
  EXECUTIVE_LAYER:
    authorized: Board members; external auditors (during active engagement)
    authentication: time-limited credentials issued by Legal Org
    data_scope: aggregate only; no individual agent or record data
    
  CN_ENTITY_ISOLATION:
    CN T4 sees CN entity data only; never EU/US/etc. entity data on CN dashboard
    EU T3 never sees CN operational data (sovereignty isolation applies to dashboard too)
```

---

## Integration

```
Feeds into:
  (executive-level reports generated from dashboard data by compliance-analytics-engine)

Receives from:
  ALL adaptive-compliance/ components — real-time event streams
  ALL compliance-intelligence/ components — intelligence and prediction outputs
  ALL regulatory-adaptation/ components — adaptation progress
  compliance-audit-coordinator.md — audit status and findings
  automated-remediation-engine.md — remediation queue and SLA status
```

---

## Governance

**Dashboard is read-only for executives:** Executive layer has no action capability; all decisions are T3/T4 layer  
**Sovereignty-aware rendering:** Dashboard enforces data residency — each entity's operational dashboard runs within that entity's SEZ; cross-entity aggregation uses anonymized federation data only  
**Alert acknowledgment is logged:** Every critical alert acknowledgment is logged with timestamp and acknowledger identity  
**Dashboard availability target:** 99.9% uptime; dashboard failure does not affect compliance engine operation (they are independent)  
**Audit:** Dashboard access and alert acknowledgments to `memory/compliance-operations/dashboard-access-log.jsonl`
