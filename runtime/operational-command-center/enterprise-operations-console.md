# Enterprise Operations Console

**System ID:** `enterprise-operations-console`
**Role:** Primary command and control interface for enterprise AI OS operations — aggregates signals from all telemetry systems into a unified operator view; provides real-time system status, active alert management, one-click intervention access, and executive-level operational awareness across all 17 organizations and all active workflows
**Storage:** `memory/operational-command-center/console-state.yaml`

---

## Purpose

An operator sitting down to the enterprise AI OS needs to answer one question immediately: "What needs my attention right now?" The enterprise operations console answers it. Not by showing everything — by showing what matters: active critical alerts, system health at a glance, workflows at risk, governance anomalies in flight, and the set of interventions available without hunting through subsystems. It is the nervous system's command bridge.

---

## Console Layout

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ENTERPRISE AI OS — OPERATIONS CONSOLE                  [2026-05-14 14:32]  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  SYSTEM HEALTH                    ║  ACTIVE ALERTS (3 critical, 7 high)     ║
║  ─────────────────────────────    ║  ─────────────────────────────────────  ║
║  Operational  ████████░░  0.82    ║  🔴 CONSTITUTIONAL_VIOLATION             ║
║  Governance   ████████░░  0.79    ║     C-007: gate bypass attempt           ║
║  Orchestration███████░░░  0.71    ║     [View] [Freeze Workflow] [Escalate]  ║
║  Org Health   █████████░  0.88    ║                                          ║
║                                   ║  🔴 SLO_BURN_RATE_CRITICAL               ║
║  ACTIVE WORKFLOWS                 ║     feature-dev: 8.2× target burn        ║
║  ─────────────────────────────    ║     [View Workflow] [Boost Priority]      ║
║  Running:     142                 ║                                          ║
║  Queued:      38                  ║  🟡 GOVERNANCE_LATENCY_SLA               ║
║  At Risk SLO: 7                   ║     approval queue p99: 47 min           ║
║  Stalled:     2                   ║     [View Queue] [Notify Approvers]      ║
║  Paused:      5                   ║                                          ║
║                                   ║  RECENT INTERVENTIONS                    ║
║  GOVERNANCE STATUS                ║  ─────────────────────────────────────  ║
║  ─────────────────────────────    ║  14:28  PRIORITY_BOOST → run-4821        ║
║  Pending Approvals: 12            ║  14:15  WORKFLOW_PAUSED → run-3917       ║
║  Pending Attestations: 4          ║  13:52  ESCALATION_RESOLVED → ESC-0091  ║
║  Policy Drift Events: 1           ║                                          ║
╠═══════════════════════════════════╩══════════════════════════════════════════╣
║  QUICK ACTIONS: [Workflow Cmd] [Orch Control] [Gov Dashboard] [Intervention] ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Console State Schema

```yaml
ConsoleState:
  last_refreshed: datetime
  refresh_interval_seconds: 15
  
  # Aggregated health scores
  health_overview:
    operational_score: float       # From operational-health-scorer
    governance_score: float        # From governance-health-scorer
    orchestration_score: float     # From orchestration-health-scorer
    org_health_score: float        # From organizational-health-telemetry
    trend_operational: "IMPROVING | STABLE | DEGRADING"
    trend_governance: "IMPROVING | STABLE | DEGRADING"
  
  # Active workflow summary
  workflow_summary:
    total_active: integer
    queued: integer
    at_risk_slo: integer
    stalled: integer
    paused: integer
    critical_priority: integer
  
  # Alert queue
  active_alerts:
    critical: [ConsoleAlert]
    high: [ConsoleAlert]
    medium: [ConsoleAlert]       # Shown on demand; not surfaced by default
  
  # Governance snapshot
  governance_snapshot:
    pending_approvals: integer
    pending_attestations: integer
    policy_drift_events: integer
    constitutional_evaluations_last_hour: integer
    compliance_score: float
  
  # Recent operator actions
  recent_interventions: [InterventionRecord]  # Last 20

ConsoleAlert:
  alert_id: string
  severity: "CRITICAL | HIGH | MEDIUM"
  event_type: string
  display_title: string
  display_detail: string
  triggered_at: datetime
  acknowledged: boolean
  acknowledged_by: string | null
  available_actions: [ConsoleAction]

ConsoleAction:
  action_id: string
  label: string
  description: string
  action_type: "VIEW | SIGNAL | APPROVE | FREEZE | BOOST_PRIORITY | ESCALATE | NOTIFY"
  target_system: string
  target_id: string
```

---

## Console Refresh Engine

```
refresh_console() → ConsoleState:
  
  # Parallel data load from all telemetry subsystems
  [health, workflows, alerts, governance, interventions] = parallel_load([
    load_health_overview(),
    load_workflow_summary(),
    load_active_alerts(),
    load_governance_snapshot(),
    load_recent_interventions()
  ])
  
  state = ConsoleState(
    last_refreshed = now(),
    refresh_interval_seconds = 15,
    health_overview = health,
    workflow_summary = workflows,
    active_alerts = classify_alerts(alerts),
    governance_snapshot = governance,
    recent_interventions = interventions
  )
  
  persist_console_state(state)
  RETURN state

load_health_overview() → HealthOverview:
  
  latest_scores = telemetry_subscriptions.get_latest(
    topic = "telemetry.health.scores",
    event_types = ["OPERATIONAL_HEALTH_SCORE", "GOVERNANCE_METRICS_SNAPSHOT",
                   "ORCHESTRATION_METRICS_SNAPSHOT", "ORG_HEALTH_METRICS_SNAPSHOT"]
  )
  
  # Compute trend from last 3 readings
  operational_trend = compute_trend(
    get_score_history("operational_health_score", last_n=3)
  )
  governance_trend = compute_trend(
    get_score_history("governance_compliance_score", last_n=3)
  )
  
  RETURN HealthOverview(
    operational_score = latest_scores.get("OPERATIONAL_HEALTH_SCORE", {}).get("score"),
    governance_score = latest_scores.get("GOVERNANCE_METRICS_SNAPSHOT", {}).get("compliance_score"),
    orchestration_score = latest_scores.get("ORCHESTRATION_METRICS_SNAPSHOT", {}).get("overall_score"),
    org_health_score = latest_scores.get("ORG_HEALTH_METRICS_SNAPSHOT", {}).get("overall_score"),
    trend_operational = operational_trend,
    trend_governance = governance_trend
  )

load_active_alerts() → [ConsoleAlert]:
  
  raw_alerts = enterprise_event_bus.consume("alerts.critical") + enterprise_event_bus.consume("alerts.high")
  
  console_alerts = []
  
  FOR alert in raw_alerts:
    actions = build_alert_actions(alert)
    
    console_alerts.append(ConsoleAlert(
      alert_id = alert.event_id,
      severity = map_priority_to_severity(alert.priority),
      event_type = alert.event_type,
      display_title = get_display_title(alert.event_type),
      display_detail = build_display_detail(alert),
      triggered_at = alert.published_at,
      acknowledged = is_acknowledged(alert.event_id),
      available_actions = actions
    ))
  
  RETURN sorted(console_alerts, key=lambda a: a.triggered_at, reverse=True)

build_alert_actions(alert) → [ConsoleAction]:
  
  actions = [
    ConsoleAction(label="View", action_type="VIEW", target_system=resolve_source_system(alert))
  ]
  
  IF alert.event_type == "CONSTITUTIONAL_VIOLATION":
    actions += [
      ConsoleAction(label="Freeze Workflow", action_type="FREEZE", target_id=alert.source.run_id),
      ConsoleAction(label="Escalate", action_type="ESCALATE")
    ]
  
  IF alert.event_type == "SLO_BURN_RATE_CRITICAL":
    actions += [
      ConsoleAction(label="Boost Priority", action_type="BOOST_PRIORITY", target_id=alert.source.run_id),
      ConsoleAction(label="View Workflow", action_type="VIEW", target_system="workflow-command-center", target_id=alert.source.run_id)
    ]
  
  IF alert.event_type == "GOVERNANCE_LATENCY_SLA":
    actions += [
      ConsoleAction(label="View Queue", action_type="VIEW", target_system="governance-operations-dashboard"),
      ConsoleAction(label="Notify Approvers", action_type="NOTIFY")
    ]
  
  RETURN actions
```

---

## Alert Acknowledgment and Suppression

```
acknowledge_alert(alert_id, operator_id) → AcknowledgmentResult:
  
  mark_acknowledged(alert_id, operator_id, acknowledged_at=now())
  
  record_intervention(InterventionRecord(
    action_type = "ALERT_ACKNOWLEDGED",
    alert_id = alert_id,
    operator_id = operator_id,
    at = now()
  ))
  
  RETURN AcknowledgmentResult(success=True)

suppress_alert_type(event_type, duration_minutes, reason, operator_id) → SuppressionResult:
  # Temporarily silence an alert type (for maintenance windows)
  IF duration_minutes > 240:    # Max 4-hour suppression from console
    RETURN SuppressionResult(
      success = False,
      reason = f"Suppression duration {duration_minutes}min exceeds console limit of 240min. Use governance-operations-dashboard for longer suppressions."
    )
  
  add_suppression_rule(event_type, until=now()+timedelta(minutes=duration_minutes), reason=reason)
  
  enterprise_event_bus.publish(
    topic = "governance.decisions",
    event_type = "ALERT_SUPPRESSION_ADDED",
    payload = {event_type: event_type, duration_minutes: duration_minutes, operator_id: operator_id, reason: reason}
  )
  
  RETURN SuppressionResult(success=True)
```

---

## Integration

**Called by:**
- Human operators — primary operational interface
- `enterprise-telemetry/runtime-trigger-engine.md` — receives critical notifications

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — consumes alerts and publishes intervention records
- `operational-command-center/runtime-intervention-interfaces.md` — delegates intervention execution
- `operational-command-center/workflow-command-center.md` — drills into specific workflows
- `operational-command-center/governance-operations-dashboard.md` — governance detail view

**Writes to:** `memory/operational-command-center/console-state.yaml`
