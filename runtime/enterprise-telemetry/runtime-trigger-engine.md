# Runtime Trigger Engine

**System ID:** `runtime-trigger-engine`
**Role:** Evaluates enterprise-level trigger conditions against the live event stream and fires configured actions — activates workflows, dispatches alerts, triggers interventions, and initiates health reassessments in response to aggregated enterprise signals; operates above the execution-level trigger engine (runtime-clusters/event-triggers.md) which watches individual workflow events
**Storage:** `memory/enterprise-telemetry/trigger-state.yaml`

---

## Purpose

Reactive enterprise operation requires more than watching individual workflow events. When governance health drops below a threshold, an intervention workflow should auto-activate. When organizational stress spikes in two org units simultaneously, the executive team should be notified. When an integration data pipeline fails and three downstream workflows are stalled, a recovery workflow should fire. The runtime trigger engine watches the aggregated enterprise event stream and fires precisely when these cross-domain conditions are met.

---

## Trigger Types

```yaml
TriggerType:
  
  HEALTH_THRESHOLD:
    description: "Fires when a health score crosses a configured threshold"
    evaluates: telemetry.health.scores
    example: "operational_health < 0.60 for 3 consecutive readings"
  
  ALERT_PATTERN:
    description: "Fires when a specific alert pattern is detected in the event stream"
    evaluates: alerts.critical, alerts.high
    example: "3 GATE_FAILED events from the same workflow_definition within 1 hour"
  
  ESCALATION_SURGE:
    description: "Fires when escalation volume exceeds baseline within a window"
    evaluates: org.escalation.events
    example: "escalation_count > baseline × 2.0 in 30-minute window"
  
  GOVERNANCE_ANOMALY:
    description: "Fires when governance telemetry shows unusual compliance patterns"
    evaluates: governance.decisions, governance.constitutional
    example: "constitutional_clearance_rate < 0.85 in 1-hour window"
  
  INTEGRATION_FAILURE:
    description: "Fires when an integration system reports failures affecting workflows"
    evaluates: integration.notifications, integration.data.signals
    example: "data_pipeline_failure with downstream_workflow_count > 2"
  
  COMPOSITE:
    description: "Fires when multiple independent conditions are all true simultaneously"
    evaluates: multiple topics
    example: "org_stress == HIGH AND governance_health < 0.70 AND active_escalations > 5"
  
  SCHEDULE:
    description: "Fires on a time-based schedule (health reassessment, report generation)"
    evaluates: system clock
    example: "every 15 minutes during business hours"
```

---

## Trigger Definitions

```yaml
EnterpriseTriggersRegistry:
  
  operational-health-degradation:
    trigger_type: HEALTH_THRESHOLD
    condition:
      metric: operational_health_score
      operator: "<"
      threshold: 0.65
      sustained_readings: 3          # Must be below threshold for 3 consecutive 5-min readings
    action:
      type: ACTIVATE_WORKFLOW
      workflow_id: operational-recovery-workflow
      priority: HIGH
      payload_fields: [health_score, health_dimensions, degraded_since]
    cooldown_minutes: 30             # Don't re-fire within 30 minutes
    enabled: true
  
  governance-compliance-drop:
    trigger_type: HEALTH_THRESHOLD
    condition:
      metric: governance_health_score
      operator: "<"
      threshold: 0.70
      sustained_readings: 2
    action:
      type: NOTIFY_AND_ACTIVATE
      notify: [governance-operations-dashboard, enterprise-operations-console]
      workflow_id: governance-health-review-workflow
      priority: HIGH
    cooldown_minutes: 60
    enabled: true
  
  escalation-surge:
    trigger_type: ESCALATION_SURGE
    condition:
      window_minutes: 30
      surge_multiplier: 2.5          # 2.5× baseline triggers
      min_absolute: 5                # At least 5 new escalations
    action:
      type: NOTIFY
      notify: [enterprise-operations-console, escalation-monitoring]
      alert_priority: HIGH
    cooldown_minutes: 15
    enabled: true
  
  constitutional-violation-detected:
    trigger_type: ALERT_PATTERN
    condition:
      topic: governance.constitutional
      event_type: ABSOLUTE_CONSTITUTIONAL_VIOLATION
      count_in_window: 1             # Any single absolute violation fires immediately
      window_minutes: 1440           # Rolling 24h for pattern tracking
    action:
      type: IMMEDIATE_ALERT
      alert_priority: CRITICAL
      notify: [enterprise-operations-console, governance-operations-dashboard]
      freeze_related_workflows: true
    cooldown_minutes: 0              # Never cooldown — every violation is critical
    enabled: true
  
  multi-org-stress:
    trigger_type: COMPOSITE
    conditions:
      - metric: organizational_stress_level
        operator: ">="
        value: HIGH
        source: org.capacity.signals
      - metric: active_escalation_count
        operator: ">"
        value: 5
        source: org.escalation.events
        window_minutes: 60
    conjunction: AND
    action:
      type: NOTIFY_AND_ACTIVATE
      notify: [enterprise-operations-console]
      workflow_id: org-stress-response-workflow
      priority: CRITICAL
    cooldown_minutes: 45
    enabled: true
  
  integration-cascade-failure:
    trigger_type: INTEGRATION_FAILURE
    condition:
      event_type: DATA_PIPELINE_FAILED
      downstream_workflow_count_threshold: 3
    action:
      type: ACTIVATE_WORKFLOW
      workflow_id: integration-recovery-workflow
      priority: HIGH
    cooldown_minutes: 20
    enabled: true
  
  hourly-health-reassessment:
    trigger_type: SCHEDULE
    condition:
      cron: "0 * * * *"             # Every hour
    action:
      type: TRIGGER_REASSESSMENT
      targets: [operational-health-scorer, governance-health-scorer, orchestration-health-scorer]
    cooldown_minutes: 0
    enabled: true
  
  business-hours-status-report:
    trigger_type: SCHEDULE
    condition:
      cron: "0 9,13,17 * * 1-5"    # 9am, 1pm, 5pm Monday-Friday
    action:
      type: ACTIVATE_WORKFLOW
      workflow_id: enterprise-status-report-workflow
      priority: NORMAL
    cooldown_minutes: 0
    enabled: true
```

---

## Trigger Evaluation Engine

```
evaluate_triggers(event_batch) → [TriggerFiring]:
  
  firings = []
  
  FOR trigger in get_enabled_triggers():
    
    # Skip if in cooldown
    IF is_in_cooldown(trigger.trigger_id):
      CONTINUE
    
    result = evaluate_trigger(trigger, event_batch)
    
    IF result.condition_met:
      firing = TriggerFiring(
        trigger_id = trigger.trigger_id,
        fired_at = now(),
        condition_evidence = result.evidence,
        action = trigger.action
      )
      
      execute_trigger_action(firing)
      record_cooldown(trigger.trigger_id, trigger.cooldown_minutes)
      
      enterprise_event_bus.publish(
        topic = "alerts.high" if trigger.action.alert_priority == "HIGH" else "telemetry.metrics",
        event_type = "TRIGGER_FIRED",
        payload = {trigger_id: trigger.trigger_id, action_type: trigger.action.type}
      )
      
      firings.append(firing)
  
  RETURN firings

evaluate_trigger(trigger, event_batch) → TriggerEvaluationResult:
  
  IF trigger.trigger_type == "HEALTH_THRESHOLD":
    relevant = [e for e in event_batch if e.topic == "telemetry.health.scores"]
    readings = [e.payload.get(trigger.condition.metric) for e in relevant if e.payload.get(trigger.condition.metric) is not null]
    
    IF len(readings) >= trigger.condition.sustained_readings:
      last_n = readings[-trigger.condition.sustained_readings:]
      condition_met = all(compare(r, trigger.condition.operator, trigger.condition.threshold) for r in last_n)
      RETURN TriggerEvaluationResult(condition_met=condition_met, evidence={readings: last_n})
  
  IF trigger.trigger_type == "COMPOSITE":
    sub_results = [evaluate_sub_condition(c, event_batch) for c in trigger.conditions]
    IF trigger.conjunction == "AND":
      RETURN TriggerEvaluationResult(condition_met=all(r.met for r in sub_results))
    ELSE:
      RETURN TriggerEvaluationResult(condition_met=any(r.met for r in sub_results))
  
  IF trigger.trigger_type == "SCHEDULE":
    RETURN TriggerEvaluationResult(condition_met=cron_matches(trigger.condition.cron, now()))
  
  # Other trigger types follow similar pattern...
  RETURN TriggerEvaluationResult(condition_met=False)

execute_trigger_action(firing):
  action = firing.action
  
  IF action.type == "ACTIVATE_WORKFLOW":
    workflow_scheduler.schedule_immediate(
      workflow_id = action.workflow_id,
      priority = action.priority,
      trigger_payload = firing.condition_evidence
    )
  
  ELIF action.type == "NOTIFY":
    FOR target in action.notify:
      enterprise_event_bus.publish(
        topic = "alerts.high" if action.alert_priority == "HIGH" else "alerts.critical",
        event_type = "TRIGGER_NOTIFICATION",
        payload = {trigger_id: firing.trigger_id, target: target, evidence: firing.condition_evidence}
      )
  
  ELIF action.type == "TRIGGER_REASSESSMENT":
    FOR target in action.targets:
      send_signal(target, signal_type="REASSESS_NOW")
  
  ELIF action.type == "IMMEDIATE_ALERT":
    IF action.freeze_related_workflows:
      freeze_workflows_related_to(firing.condition_evidence)
    enterprise_event_bus.publish(
      topic = "alerts.critical",
      event_type = "CRITICAL_TRIGGER_FIRED",
      payload = {trigger_id: firing.trigger_id, evidence: firing.condition_evidence},
      priority = "CRITICAL"
    )
```

---

## Integration

**Called by:**
- `enterprise-telemetry/event-propagation-engine.md` — receives event batches for trigger evaluation (via subscription)
- System clock — for SCHEDULE trigger types

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes trigger notifications
- `workflow-engine/workflow-scheduler.md` — activates triggered workflows
- `operational-command-center/escalation-monitoring.md` — notifies on escalation surge

**Writes to:** `memory/enterprise-telemetry/trigger-state.yaml`
