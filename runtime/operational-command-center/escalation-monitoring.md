# Escalation Monitoring

**System ID:** `escalation-monitoring`
**Role:** Live monitoring of all active escalations across the enterprise — tracks escalations in flight, SLA countdown timers, resolution status, escalation owner assignments, re-escalation triggers, and historical escalation patterns; provides the operator view needed to ensure escalations resolve before SLA expiry
**Storage:** `memory/operational-command-center/escalation-state.yaml`

---

## Purpose

An escalation without a watcher is an escalation that expires. The escalation monitoring system tracks every active escalation from the moment it is raised to the moment it is resolved, maintaining countdown timers against escalation SLAs, surfacing risk of breach, notifying owners as deadlines approach, and automatically re-escalating when the window expires without resolution. It turns escalations from events into managed commitments.

---

## Escalation Schema

```yaml
Escalation:
  escalation_id: string
  
  # What was escalated
  subject:
    subject_type: "WORKFLOW | NODE | GOVERNANCE_DECISION | APPROVAL | QUALITY_GATE | ORG_CAPACITY"
    subject_id: string
    run_id: string | null
    description: string
  
  # Why it was escalated
  escalation_type: "SLA_AT_RISK | GATE_FAILURE | CONSTITUTIONAL_CONCERN | APPROVAL_BLOCKED | CAPACITY_CRITICAL | MANUAL"
  escalation_reason: string
  severity: "CRITICAL | HIGH | MEDIUM"
  
  # Who is responsible
  escalated_from: string       # Agent or system that escalated
  escalated_to: string         # Owner assigned to resolve
  escalation_owner_tier: integer
  
  # SLA tracking
  escalated_at: datetime
  sla_deadline: datetime       # When it must be resolved
  sla_seconds: integer         # Resolution SLA by severity and type
  
  # Status
  status: "PENDING | IN_REVIEW | RESOLVED | EXPIRED | RE_ESCALATED"
  resolution_notes: string | null
  resolved_at: datetime | null
  resolved_by: string | null
  
  # Chain tracking (re-escalations)
  parent_escalation_id: string | null
  escalation_level: integer    # 0 = initial, 1 = first re-escalation, etc.
  max_escalation_level: integer # Hard cap
```

---

## Escalation SLA Matrix

```yaml
EscalationSLAMatrix:
  
  CRITICAL:
    initial_sla_minutes: 15
    re_escalation_after_minutes: 10    # Re-escalate if not resolved in 10 min
    notify_at_minutes_remaining: [10, 5, 2]
    max_escalation_level: 3            # After level 3: executive human notification
  
  HIGH:
    initial_sla_minutes: 60
    re_escalation_after_minutes: 45
    notify_at_minutes_remaining: [30, 15, 5]
    max_escalation_level: 2
  
  MEDIUM:
    initial_sla_minutes: 240           # 4 hours
    re_escalation_after_minutes: 180
    notify_at_minutes_remaining: [60, 30]
    max_escalation_level: 1
```

---

## Escalation Management Engine

```
register_escalation(subject, escalation_type, severity, escalated_from) → Escalation:
  
  sla_config = ESCALATION_SLA_MATRIX[severity]
  owner = resolve_escalation_owner(escalation_type, severity)
  
  escalation = Escalation(
    escalation_id = generate_uuid(),
    subject = subject,
    escalation_type = escalation_type,
    severity = severity,
    escalated_from = escalated_from,
    escalated_to = owner.owner_id,
    escalation_owner_tier = owner.authority_level,
    escalated_at = now(),
    sla_deadline = now() + timedelta(minutes=sla_config.initial_sla_minutes),
    sla_seconds = sla_config.initial_sla_minutes × 60,
    status = "PENDING",
    escalation_level = 0,
    max_escalation_level = sla_config.max_escalation_level
  )
  
  persist_escalation(escalation)
  
  # Notify owner
  notify_escalation_owner(owner, escalation)
  
  enterprise_event_bus.publish(
    topic = "org.escalation.events",
    event_type = "ESCALATION_INITIATED",
    payload = {
      escalation_id: escalation.escalation_id,
      severity: severity,
      org_id: resolve_org(escalated_from)
    },
    priority = "HIGH" if severity == "CRITICAL" else "NORMAL"
  )
  
  RETURN escalation

monitor_escalation_slas() → [EscalationAlert]:
  
  active = load_active_escalations()
  alerts = []
  
  FOR escalation in active:
    remaining_seconds = (escalation.sla_deadline - now()).total_seconds()
    sla_config = ESCALATION_SLA_MATRIX[escalation.severity]
    
    # Notify at configured warning thresholds
    FOR notify_at in sla_config.notify_at_minutes_remaining:
      threshold_seconds = notify_at × 60
      IF remaining_seconds <= threshold_seconds AND NOT already_notified(escalation.escalation_id, notify_at):
        notify_escalation_owner_reminder(escalation, minutes_remaining=notify_at)
        mark_notification_sent(escalation.escalation_id, notify_at)
        
        alerts.append(EscalationAlert(
          escalation_id = escalation.escalation_id,
          alert_type = "SLA_WARNING",
          minutes_remaining = notify_at,
          severity = escalation.severity
        ))
    
    # Re-escalate if expired
    IF remaining_seconds <= 0 AND escalation.status not in ["RESOLVED", "EXPIRED", "RE_ESCALATED"]:
      IF escalation.escalation_level < escalation.max_escalation_level:
        re_escalate(escalation)
        alerts.append(EscalationAlert(
          escalation_id = escalation.escalation_id,
          alert_type = "RE_ESCALATED",
          new_level = escalation.escalation_level + 1
        ))
      ELSE:
        # Maximum level reached — force executive notification
        escalation.status = "EXPIRED"
        persist_escalation(escalation)
        enterprise_event_bus.publish(
          topic = "alerts.critical",
          event_type = "ESCALATION_EXPIRED_MAX_LEVEL",
          payload = {escalation_id: escalation.escalation_id, severity: escalation.severity},
          priority = "CRITICAL"
        )
  
  RETURN alerts

re_escalate(escalation):
  sla_config = ESCALATION_SLA_MATRIX[escalation.severity]
  
  new_owner = resolve_next_escalation_owner(
    current_owner_tier = escalation.escalation_owner_tier,
    escalation_type = escalation.escalation_type
  )
  
  child_escalation = Escalation(
    escalation_id = generate_uuid(),
    subject = escalation.subject,
    escalation_type = escalation.escalation_type,
    severity = escalation.severity,
    escalated_from = escalation.escalated_to,   # Previous owner
    escalated_to = new_owner.owner_id,
    escalation_owner_tier = new_owner.authority_level,
    escalated_at = now(),
    sla_deadline = now() + timedelta(minutes=sla_config.re_escalation_after_minutes),
    sla_seconds = sla_config.re_escalation_after_minutes × 60,
    status = "PENDING",
    parent_escalation_id = escalation.escalation_id,
    escalation_level = escalation.escalation_level + 1,
    max_escalation_level = escalation.max_escalation_level
  )
  
  escalation.status = "RE_ESCALATED"
  persist_escalation(escalation)
  persist_escalation(child_escalation)
  
  notify_escalation_owner(new_owner, child_escalation)

resolve_escalation(escalation_id, resolved_by, resolution_notes) → ResolutionResult:
  
  escalation = load_escalation(escalation_id)
  escalation.status = "RESOLVED"
  escalation.resolved_at = now()
  escalation.resolved_by = resolved_by
  escalation.resolution_notes = resolution_notes
  persist_escalation(escalation)
  
  resolution_time_ms = (escalation.resolved_at - escalation.escalated_at).total_seconds() × 1000
  
  enterprise_event_bus.publish(
    topic = "org.escalation.events",
    event_type = "ESCALATION_RESOLVED",
    payload = {
      escalation_id: escalation_id,
      resolution_time_ms: resolution_time_ms,
      within_sla: resolution_time_ms <= escalation.sla_seconds × 1000,
      org_id: resolve_org(escalation.escalated_from)
    }
  )
  
  RETURN ResolutionResult(success=True, resolution_time_ms=resolution_time_ms)
```

---

## Active Escalation Dashboard View

```
get_active_escalation_view() → EscalationView:
  
  active = load_active_escalations()
  
  RETURN EscalationView(
    total_active = len(active),
    by_severity = {
      CRITICAL: [e for e in active if e.severity == "CRITICAL"],
      HIGH: [e for e in active if e.severity == "HIGH"],
      MEDIUM: [e for e in active if e.severity == "MEDIUM"]
    },
    sla_at_risk = [e for e in active if (e.sla_deadline - now()).total_seconds() < 300],  # < 5 min
    oldest_escalation = MIN(active, key=lambda e: e.escalated_at) if active else null,
    avg_age_minutes = MEAN([(now() - e.escalated_at).total_seconds() / 60 for e in active]) if active else 0
  )
```

---

## Integration

**Called by:**
- `enterprise-telemetry/runtime-trigger-engine.md` — registers escalation surge alerts
- `operational-command-center/enterprise-operations-console.md` — escalation panel
- All governance and runtime systems — register escalations

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — escalation lifecycle events
- `audit-replay/immutable-audit-log.md` — escalation records

**Writes to:** `memory/operational-command-center/escalation-state.yaml`
