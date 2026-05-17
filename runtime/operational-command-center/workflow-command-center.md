# Workflow Command Center

**System ID:** `workflow-command-center`
**Role:** Operator interface for deep inspection and control of individual workflow runs — provides live DAG visualization, node-by-node status, gate verdict history, approval chain state, signal injection, and targeted interventions on any active or recently completed workflow
**Storage:** `memory/operational-command-center/workflow-command-state.yaml`

---

## Purpose

When a workflow is at risk, stalled, or behaving unexpectedly, an operator needs more than a health score. They need to see the DAG, find the bottleneck node, understand why the gate failed, check what approvals are pending, and take action — all from a single interface without context-switching across five systems. The workflow command center is that interface: a complete, drillable, action-enabled view of any individual workflow run.

---

## Workflow Detail View

```
get_workflow_detail(run_id) → WorkflowDetailView:
  
  # Assemble comprehensive run state
  execution_status = dag_runtime.get_execution_status(run_id)
  trace = execution_tracer.get_trace(run_id)
  slo_status = compute_run_slo_status(run_id)
  approval_chain = load_approval_chain(run_id)
  policy_binding = policy_binding_engine.load_binding(run_id)
  confidence_score = workflow_confidence_scorer.get_run_score(run_id)
  
  # Node-by-node detail
  node_details = []
  FOR node in execution_status.nodes.values():
    node_trace = trace.get_node_span(node.node_id)
    gate_verdicts = load_gate_verdicts(run_id, node.node_id)
    
    node_details.append(NodeDetail(
      node_id = node.node_id,
      node_type = node.node_type,
      state = node.state,
      started_at = node.started_at,
      ended_at = node.ended_at,
      duration_ms = node.duration_ms,
      attempt_count = node.attempt_count,
      assigned_agent_id = node.assigned_agent_id,
      gate_verdicts = gate_verdicts,
      span_breakdown = node_trace.get_timing_breakdown() if node_trace else null,
      available_actions = get_node_actions(node)
    ))
  
  # Critical path
  critical_path = trace.get_critical_path() if trace else null
  
  RETURN WorkflowDetailView(
    run_id = run_id,
    definition_id = execution_status.definition_id,
    status = execution_status.status,
    priority = execution_status.priority,
    started_at = execution_status.started_at,
    
    slo = {
      target_seconds: slo_status.target_seconds,
      elapsed_seconds: slo_status.elapsed_seconds,
      projected_seconds: slo_status.projected_completion_seconds,
      compliant: slo_status.currently_on_track,
      slack_seconds: slo_status.slack_seconds
    },
    
    confidence = {
      composite_score: confidence_score.composite,
      dimensions: confidence_score.dimensions,
      disqualifiers_active: confidence_score.disqualifiers
    },
    
    dag = {
      total_nodes: len(execution_status.nodes),
      completed: len([n for n in execution_status.nodes.values() if n.state == "SUCCEEDED"]),
      in_progress: len([n for n in execution_status.nodes.values() if n.state == "RUNNING"]),
      pending: len([n for n in execution_status.nodes.values() if n.state == "PENDING"]),
      failed: len([n for n in execution_status.nodes.values() if n.state == "FAILED"]),
      critical_path: critical_path,
      nodes: node_details
    },
    
    governance = {
      policy_binding_id: policy_binding.binding_id if policy_binding else null,
      approval_chain: approval_chain,
      pending_approvals: [a for a in approval_chain if a.status == "PENDING"] if approval_chain else []
    }
  )
```

---

## Workflow Intervention Commands

```
# All workflow commands produce audited records

pause_workflow(run_id, reason, operator_id) → CommandResult:
  runtime_signals.send_signal(run_id, signal_type="SUSPEND", reason=reason)
  record_command("PAUSE", run_id, operator_id, reason)
  RETURN CommandResult(success=True, signal_sent="SUSPEND")

resume_workflow(run_id, operator_id) → CommandResult:
  runtime_signals.send_signal(run_id, signal_type="RESUME")
  record_command("RESUME", run_id, operator_id)
  RETURN CommandResult(success=True, signal_sent="RESUME")

cancel_workflow(run_id, reason, operator_id) → CommandResult:
  # Cancellation requires T4+ authority
  operator_manifest = capability_scope_controller.load_manifest(operator_id)
  IF operator_manifest.governance.authority_level < 4:
    RETURN CommandResult(success=False, reason="Workflow cancellation requires T4+ authority")
  
  runtime_signals.send_signal(run_id, signal_type="CANCEL", reason=reason)
  record_command("CANCEL", run_id, operator_id, reason)
  RETURN CommandResult(success=True, signal_sent="CANCEL")

boost_priority(run_id, new_priority, operator_id) → CommandResult:
  dag_runtime.update_run_priority(run_id, new_priority)
  task_queue.reorder_by_priority(run_id, new_priority)
  record_command("BOOST_PRIORITY", run_id, operator_id, {"new_priority": new_priority})
  RETURN CommandResult(success=True)

retry_failed_node(run_id, node_id, operator_id) → CommandResult:
  node = dag_runtime.get_node_state(run_id, node_id)
  IF node.state != "FAILED":
    RETURN CommandResult(success=False, reason=f"Node {node_id} is in state {node.state}, not FAILED")
  
  dag_runtime.reset_node_for_retry(run_id, node_id)
  record_command("RETRY_NODE", run_id, operator_id, {"node_id": node_id})
  RETURN CommandResult(success=True)

inject_input(run_id, node_id, input_data, operator_id) → CommandResult:
  # Inject input data to a waiting node (e.g., human-approval node)
  runtime_signals.send_signal(
    run_id,
    signal_type = "INJECT_INPUT",
    node_id = node_id,
    payload = input_data
  )
  record_command("INJECT_INPUT", run_id, operator_id, {"node_id": node_id})
  RETURN CommandResult(success=True)

record_command(command_type, run_id, operator_id, metadata=null):
  record = CommandRecord(
    record_id = generate_uuid(),
    command_type = command_type,
    run_id = run_id,
    operator_id = operator_id,
    metadata = metadata,
    executed_at = now()
  )
  persist_command_record(record)
  immutable_audit_log.record(WorkflowCommandAuditEvent(record))
  
  enterprise_event_bus.publish(
    topic = "governance.decisions",
    event_type = "WORKFLOW_COMMAND_EXECUTED",
    payload = {command_type: command_type, run_id: run_id, operator_id: operator_id},
    priority = "HIGH"
  )
```

---

## Workflow Search and Filter

```
search_workflows(filters) → [WorkflowSummary]:
  
  # Supported filters:
  # status: RUNNING | PAUSED | FAILED | COMPLETED | QUEUED
  # definition_id: string
  # priority: CRITICAL | HIGH | NORMAL | LOW
  # at_risk_slo: boolean
  # stalled: boolean
  # agent_id: string (workflows involving this agent)
  # started_after: datetime
  # started_before: datetime
  
  matching_run_ids = dag_runtime.query_runs(filters)
  
  summaries = []
  FOR run_id in matching_run_ids:
    summary = get_workflow_summary(run_id)
    summaries.append(summary)
  
  RETURN sorted(summaries, key=lambda s: s.started_at, reverse=True)

get_workflow_summary(run_id) → WorkflowSummary:
  
  status = dag_runtime.get_execution_status(run_id)
  slo = compute_run_slo_status(run_id)
  
  RETURN WorkflowSummary(
    run_id = run_id,
    definition_id = status.definition_id,
    status = status.status,
    priority = status.priority,
    started_at = status.started_at,
    elapsed_seconds = (now() - status.started_at).total_seconds(),
    slo_on_track = slo.currently_on_track,
    slack_seconds = slo.slack_seconds,
    node_progress = f"{status.completed_nodes}/{status.total_nodes}",
    is_stalled = detect_stall(status)
  )
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — drill-through from alerts
- Human operators — primary workflow investigation interface

**Calls:**
- `orchestration-dags/dag-runtime.md` — live execution state
- `execution-observability/execution-tracer.md` — trace data
- `runtime-clusters/runtime-signals.md` — signal injection
- `governance-attestation/policy-binding-engine.md` — governance context
- `audit-replay/immutable-audit-log.md` — command audit recording

**Writes to:** `memory/operational-command-center/workflow-command-state.yaml`
