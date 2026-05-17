# Orchestration Control Plane

**System ID:** `orchestration-control-plane`
**Role:** Provides the operator control interface for live orchestration management — enables authorized operators to adjust agent routing, reroute queued work, change execution priorities, pause and resume agent orgs, update routing rules live, and inject capacity signals; creates a full audit trail of all control actions
**Storage:** `memory/operational-command-center/control-plane-state.yaml`

---

## Purpose

Observing orchestration is necessary. Controlling it when it fails is essential. The orchestration control plane is the operator's hands on the orchestration system: the interface through which routing tables are adjusted live, overloaded orgs get relief, misrouted work gets corrected, and emergency stops are applied without restarting the entire system. Every action through the control plane is audited — not just logged, but cryptographically recorded.

---

## Control Plane Capabilities

```yaml
ControlCapabilities:
  
  ROUTING_OVERRIDE:
    description: "Override the routing table for a specific workflow or task type"
    requires_authority_level: 3
    audit_required: true
    reversible: true
    effects: [REROUTES_PENDING_TASKS, UPDATES_ROUTING_TABLE_FOR_DURATION]
  
  AGENT_ORG_PAUSE:
    description: "Pause all new task assignments to a specific org unit"
    requires_authority_level: 4
    audit_required: true
    reversible: true
    effects: [QUEUES_NEW_TASKS, IN_FLIGHT_TASKS_CONTINUE]
  
  AGENT_ORG_RESUME:
    description: "Resume task assignment to a paused org unit"
    requires_authority_level: 3
    audit_required: true
    reversible: false    # Resume is its own action
  
  PRIORITY_ADJUSTMENT:
    description: "Adjust execution priority for queued or active workflows"
    requires_authority_level: 3
    audit_required: true
    reversible: true
  
  CAPACITY_INJECTION:
    description: "Signal that additional capacity is available in an org"
    requires_authority_level: 3
    audit_required: true
    reversible: false
  
  WORK_REASSIGNMENT:
    description: "Move pending tasks from one agent/org to another"
    requires_authority_level: 4
    audit_required: true
    reversible: true
  
  ROUTING_TABLE_UPDATE:
    description: "Update the live routing table for an intent pattern"
    requires_authority_level: 4
    audit_required: true
    reversible: true
    warning: "Affects all future routings matching the pattern until reverted"
  
  EMERGENCY_STOP:
    description: "Halt all new orchestration assignments across the enterprise"
    requires_authority_level: 5
    audit_required: true
    reversible: true
    requires_confirmation: true
    warning: "Affects all in-flight orchestration. Use only during crisis."
```

---

## Control Action Execution

```
execute_control_action(action_type, parameters, operator) → ControlActionResult:
  
  # Verify operator authority
  operator_manifest = capability_scope_controller.load_manifest(operator.operator_id)
  required_authority = CONTROL_CAPABILITIES[action_type].requires_authority_level
  
  IF operator_manifest.governance.authority_level < required_authority:
    RETURN ControlActionResult(
      success = False,
      reason = f"Operator authority level {operator_manifest.governance.authority_level} insufficient for {action_type} (requires level {required_authority})"
    )
  
  # Require confirmation for emergency actions
  IF CONTROL_CAPABILITIES[action_type].requires_confirmation AND NOT parameters.confirmed:
    RETURN ControlActionResult(
      success = False,
      reason = "Action requires explicit confirmation. Resubmit with confirmed=true after reviewing impact.",
      requires_confirmation = True,
      estimated_impact = estimate_control_impact(action_type, parameters)
    )
  
  # Execute action
  result = dispatch_control_action(action_type, parameters)
  
  # Record in audit trail
  control_record = ControlActionRecord(
    record_id = generate_uuid(),
    action_type = action_type,
    parameters = parameters,
    operator_id = operator.operator_id,
    operator_authority_level = operator_manifest.governance.authority_level,
    executed_at = now(),
    result = result,
    reversible = CONTROL_CAPABILITIES[action_type].reversible,
    reversal_token = generate_reversal_token(action_type, parameters) if result.success else null
  )
  
  persist_control_record(control_record)
  
  immutable_audit_log.record(ControlActionAuditEvent(control_record))
  
  enterprise_event_bus.publish(
    topic = "governance.decisions",
    event_type = "CONTROL_ACTION_EXECUTED",
    payload = {action_type: action_type, operator_id: operator.operator_id, result: result.success},
    priority = "HIGH"
  )
  
  RETURN result

dispatch_control_action(action_type, parameters) → ControlActionResult:
  
  IF action_type == "ROUTING_OVERRIDE":
    routing_table.apply_temporary_override(
      intent_pattern = parameters.intent_pattern,
      target_agent_id = parameters.target_agent_id,
      duration_minutes = parameters.duration_minutes
    )
    RETURN ControlActionResult(success=True, affected_count=count_pending_matching(parameters.intent_pattern))
  
  IF action_type == "AGENT_ORG_PAUSE":
    worker_dispatcher.pause_org_assignments(parameters.org_id)
    queued = move_pending_to_hold_queue(parameters.org_id)
    RETURN ControlActionResult(success=True, tasks_held=queued)
  
  IF action_type == "PRIORITY_ADJUSTMENT":
    affected = 0
    FOR run_id in parameters.run_ids:
      dag_runtime.update_run_priority(run_id, parameters.new_priority)
      affected += 1
    RETURN ControlActionResult(success=True, affected_count=affected)
  
  IF action_type == "WORK_REASSIGNMENT":
    task_queue.reassign_tasks(
      from_agent_id = parameters.from_agent_id,
      to_agent_id = parameters.to_agent_id,
      task_filter = parameters.task_filter
    )
    RETURN ControlActionResult(success=True)
  
  IF action_type == "ROUTING_TABLE_UPDATE":
    routing_table.update_rule(
      intent_key = parameters.intent_key,
      new_target = parameters.new_target,
      effective_until = parameters.effective_until
    )
    RETURN ControlActionResult(success=True)
  
  IF action_type == "EMERGENCY_STOP":
    worker_dispatcher.halt_all_new_assignments()
    workflow_scheduler.pause_all_new_starts()
    
    enterprise_event_bus.publish(
      topic = "alerts.critical",
      event_type = "EMERGENCY_STOP_ACTIVATED",
      payload = {operator_id: operator.operator_id, reason: parameters.reason},
      priority = "CRITICAL"
    )
    
    RETURN ControlActionResult(success=True, emergency_token=generate_emergency_token())
```

---

## Reversal Protocol

```
reverse_control_action(control_record_id, operator) → ReversalResult:
  
  record = load_control_record(control_record_id)
  
  IF NOT record.reversible:
    RETURN ReversalResult(success=False, reason=f"Action type '{record.action_type}' is not reversible")
  
  IF record.reversal_token is null:
    RETURN ReversalResult(success=False, reason="No reversal token available (action may have failed)")
  
  IF (now() - record.executed_at).total_seconds() > 3600 × 4:  # 4-hour reversal window
    RETURN ReversalResult(success=False, reason="Reversal window expired (4 hours from execution)")
  
  reversal = dispatch_reversal(record)
  
  reversal_record = ControlActionRecord(
    action_type = f"REVERSAL_{record.action_type}",
    parent_action_id = control_record_id,
    operator_id = operator.operator_id,
    executed_at = now(),
    result = reversal
  )
  persist_control_record(reversal_record)
  immutable_audit_log.record(ControlActionAuditEvent(reversal_record))
  
  RETURN reversal
```

---

## Live Routing Status View

```
get_routing_status() → RoutingStatusSnapshot:
  
  RETURN RoutingStatusSnapshot(
    active_overrides = routing_table.get_active_overrides(),
    paused_orgs = worker_dispatcher.get_paused_orgs(),
    routing_table_version = routing_table.current_version,
    routing_table_last_updated = routing_table.last_updated,
    emergency_stop_active = worker_dispatcher.emergency_stop_active,
    pending_tasks_by_org = task_queue.get_pending_counts_by_org(),
    recent_control_actions = get_control_records(last_n=10)
  )
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — quick action delegation
- Human operators — primary control interface

**Calls:**
- `execution-security/capability-scope-controller.md` — operator authority verification
- `workflow-engine/worker-dispatcher.md` — routing and assignment control
- `distributed-execution/task-queue.md` — task reassignment
- `audit-replay/immutable-audit-log.md` — control action audit recording
- `enterprise-telemetry/enterprise-event-bus.md` — publishes control events

**Writes to:** `memory/operational-command-center/control-plane-state.yaml`
