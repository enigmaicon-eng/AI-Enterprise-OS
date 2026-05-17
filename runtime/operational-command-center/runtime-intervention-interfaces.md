# Runtime Intervention Interfaces

**System ID:** `runtime-intervention-interfaces`
**Role:** Provides the structured interfaces through which operators interact with the live runtime to resolve incidents, approve pending decisions, unblock stalled workflows, inject signals, and execute emergency procedures — all interventions are authority-checked, audited, and communicated back to the enterprise event bus
**Storage:** `memory/operational-command-center/intervention-log.jsonl`

---

## Purpose

Observation without action is insufficient. When the runtime is in distress, an operator needs a clear, safe, audited path to act. The runtime intervention interfaces define that path: structured operations with authority checks, impact previews, confirmation requirements for destructive actions, and a complete audit trail. They prevent both inaction (too complex to intervene) and reckless action (no guardrails on what can be done).

---

## Intervention Catalog

```yaml
InterventionTypes:
  
  # Workflow interventions
  WORKFLOW_PAUSE:
    description: "Suspend a workflow run; in-flight nodes complete, no new nodes start"
    required_authority: 3
    reversible: true
    preview_required: false
    impact: LOW
  
  WORKFLOW_RESUME:
    description: "Resume a paused workflow run"
    required_authority: 3
    reversible: false
    impact: LOW
  
  WORKFLOW_CANCEL:
    description: "Cancel a workflow run; triggers compensating actions for completed nodes"
    required_authority: 4
    reversible: false
    preview_required: true     # Show which nodes will be compensated
    impact: HIGH
  
  WORKFLOW_PRIORITY_BOOST:
    description: "Increase a workflow's priority to expedite execution"
    required_authority: 3
    reversible: true
    impact: LOW
  
  NODE_RETRY_FORCE:
    description: "Force-retry a failed node bypassing backoff delay"
    required_authority: 3
    reversible: false
    impact: MEDIUM
  
  # Approval interventions
  APPROVAL_GRANT_OVERRIDE:
    description: "Grant an approval on behalf of a designated approver (with justification)"
    required_authority: 5
    reversible: false
    preview_required: true
    audit_enhanced: true       # Extra detail in audit record
    impact: HIGH
  
  APPROVAL_REASSIGN:
    description: "Reassign a pending approval to a different qualified approver"
    required_authority: 4
    reversible: true
    impact: MEDIUM
  
  APPROVAL_DEADLINE_EXTEND:
    description: "Extend the deadline for a pending approval request"
    required_authority: 4
    reversible: false
    impact: LOW
  
  # Signal interventions
  SIGNAL_INJECT:
    description: "Inject a signal directly into a waiting workflow node"
    required_authority: 3
    reversible: false
    preview_required: true
    impact: MEDIUM
  
  SIGNAL_BROADCAST:
    description: "Broadcast a signal to multiple workflows matching a filter"
    required_authority: 4
    reversible: false
    preview_required: true     # Show matching workflows before broadcast
    confirmation_required: true
    impact: HIGH
  
  # System-level interventions
  WORKER_DRAIN:
    description: "Drain a specific worker node (complete current tasks, accept no new ones)"
    required_authority: 3
    reversible: true
    impact: MEDIUM
  
  CIRCUIT_BREAKER_TRIP:
    description: "Trip a circuit breaker on a specific integration or agent to stop calls"
    required_authority: 4
    reversible: true
    impact: HIGH
  
  EMERGENCY_FREEZE:
    description: "Freeze all workflow starts enterprise-wide; in-flight workflows continue"
    required_authority: 5
    reversible: true
    confirmation_required: true
    impact: CRITICAL
```

---

## Intervention Execution Framework

```
execute_intervention(intervention_type, parameters, operator) → InterventionResult:
  
  # Step 1: Authority check
  operator_manifest = capability_scope_controller.load_manifest(operator.operator_id)
  required_authority = INTERVENTION_TYPES[intervention_type].required_authority
  
  IF operator_manifest.governance.authority_level < required_authority:
    RETURN InterventionResult(
      success = False,
      blocked_reason = "INSUFFICIENT_AUTHORITY",
      required_authority = required_authority,
      operator_authority = operator_manifest.governance.authority_level
    )
  
  # Step 2: Preview (if required)
  spec = INTERVENTION_TYPES[intervention_type]
  IF spec.preview_required AND NOT parameters.preview_acknowledged:
    preview = generate_intervention_preview(intervention_type, parameters)
    RETURN InterventionResult(
      success = False,
      blocked_reason = "PREVIEW_REQUIRED",
      preview = preview,
      message = "Resubmit with preview_acknowledged=true to execute"
    )
  
  # Step 3: Confirmation (if required)
  IF spec.confirmation_required AND NOT parameters.confirmed:
    impact_estimate = estimate_intervention_impact(intervention_type, parameters)
    RETURN InterventionResult(
      success = False,
      blocked_reason = "CONFIRMATION_REQUIRED",
      impact_estimate = impact_estimate,
      message = "Resubmit with confirmed=true after reviewing impact"
    )
  
  # Step 4: Constitutional check for high-impact interventions
  IF spec.impact in ["HIGH", "CRITICAL"]:
    const_check = constitutional_ai_governor.evaluate_constitutional_compliance(
      content = {intervention_type: intervention_type, parameters: parameters},
      context = {agent_id: operator.operator_id}
    )
    IF const_check.verdict == "UNCONSTITUTIONAL_ABSOLUTE":
      RETURN InterventionResult(
        success = False,
        blocked_reason = "CONSTITUTIONAL_VIOLATION",
        principle = const_check.violated_principles[0]
      )
  
  # Step 5: Execute
  result = dispatch_intervention(intervention_type, parameters)
  
  # Step 6: Audit record
  audit_entry = InterventionRecord(
    intervention_id = generate_uuid(),
    intervention_type = intervention_type,
    parameters = parameters,
    operator_id = operator.operator_id,
    operator_authority = operator_manifest.governance.authority_level,
    executed_at = now(),
    result = result.success,
    failure_reason = result.failure_reason if not result.success else null,
    enhanced_audit = spec.audit_enhanced
  )
  
  append_to_intervention_log(audit_entry)
  immutable_audit_log.record(InterventionAuditEvent(audit_entry))
  
  enterprise_event_bus.publish(
    topic = "governance.decisions",
    event_type = "RUNTIME_INTERVENTION_EXECUTED",
    payload = {
      intervention_type: intervention_type,
      operator_id: operator.operator_id,
      success: result.success,
      impact: spec.impact
    },
    priority = "HIGH"
  )
  
  RETURN result

dispatch_intervention(intervention_type, parameters) → InterventionResult:
  
  IF intervention_type == "WORKFLOW_PAUSE":
    runtime_signals.send_signal(parameters.run_id, "SUSPEND", reason=parameters.reason)
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "WORKFLOW_CANCEL":
    runtime_signals.send_signal(parameters.run_id, "CANCEL", reason=parameters.reason)
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "WORKFLOW_PRIORITY_BOOST":
    dag_runtime.update_run_priority(parameters.run_id, parameters.new_priority)
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "NODE_RETRY_FORCE":
    dag_runtime.reset_node_for_retry(parameters.run_id, parameters.node_id)
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "APPROVAL_GRANT_OVERRIDE":
    override_record = cryptographic_approval_engine.issue_approval(
      request_id = parameters.approval_request_id,
      approver_decision = {
        approver_id: operator.operator_id,
        decision: "APPROVED",
        override_justification: parameters.justification
      }
    )
    RETURN InterventionResult(success=True, approval_id=override_record.approval_id)
  
  IF intervention_type == "APPROVAL_DEADLINE_EXTEND":
    cryptographic_approval_engine.extend_approval_deadline(
      parameters.approval_request_id,
      extend_by_minutes = parameters.extend_minutes
    )
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "SIGNAL_INJECT":
    runtime_signals.send_signal(
      parameters.run_id, "INJECT_INPUT",
      node_id = parameters.node_id,
      payload = parameters.signal_payload
    )
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "CIRCUIT_BREAKER_TRIP":
    circuit_breaker.trip(parameters.target_id, reason=parameters.reason)
    RETURN InterventionResult(success=True)
  
  IF intervention_type == "EMERGENCY_FREEZE":
    workflow_scheduler.freeze_all_starts(reason=parameters.reason)
    enterprise_event_bus.publish(
      topic = "alerts.critical",
      event_type = "EMERGENCY_FREEZE_ACTIVATED",
      payload = {operator_id: operator.operator_id, reason: parameters.reason},
      priority = "CRITICAL"
    )
    RETURN InterventionResult(success=True, freeze_token=generate_freeze_token())

generate_intervention_preview(intervention_type, parameters) → InterventionPreview:
  
  IF intervention_type == "WORKFLOW_CANCEL":
    completed_nodes = dag_runtime.get_completed_nodes(parameters.run_id)
    compensation_plan = compensating_actions.get_compensation_plan(parameters.run_id)
    RETURN InterventionPreview(
      summary = f"Will cancel {parameters.run_id}",
      affected_nodes = len(completed_nodes),
      compensation_actions = compensation_plan.actions,
      estimated_compensation_seconds = compensation_plan.estimated_duration_seconds
    )
  
  IF intervention_type == "SIGNAL_BROADCAST":
    matching_runs = dag_runtime.query_runs(parameters.filter)
    RETURN InterventionPreview(
      summary = f"Signal {parameters.signal_type} will be sent to {len(matching_runs)} workflows",
      matching_runs = [r.run_id for r in matching_runs[:20]],  # First 20
      total_matching = len(matching_runs)
    )
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — quick action execution
- `operational-command-center/workflow-command-center.md` — workflow-specific interventions
- Human operators — direct intervention interface

**Calls:**
- `execution-security/capability-scope-controller.md` — authority verification
- `trust-boundaries/constitutional-ai-governor.md` — constitutional check on high-impact interventions
- `runtime-clusters/runtime-signals.md` — signal injection
- `governance-attestation/cryptographic-approval-engine.md` — approval override
- `audit-replay/immutable-audit-log.md` — intervention audit

**Writes to:** `memory/operational-command-center/intervention-log.jsonl`
