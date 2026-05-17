# Orchestration Replay Engine

## Purpose
Enables deterministic replay of past workflow executions for debugging, auditing, and forensics. Given a historical workflow instance, the replay engine re-executes it step by step using the original inputs, captured agent outputs, and the exact process version — producing an identical execution trace that can be inspected at any point in time.

---

## Replay Modes

### Mode 1 — Full Deterministic Replay
Re-execute the entire workflow using historically captured data. No live agent calls; all responses sourced from the audit record.

```
Use when: Understanding what happened in a past execution
Guarantee: Identical outputs to original if deterministic (no randomness, no time-sensitive conditions)
```

### Mode 2 — Partial Replay with Live Agents (Counterfactual)
Replay up to a specific node, then substitute a different input or agent response, and continue with live execution.

```
Use when: "What would have happened if X had been Y?"
Guarantee: Up to the substitution point, identical to original; after, live execution
Governance: Tier-3 approval required (changes may affect live artifacts)
```

### Mode 3 — Replay to Specific Point (Time-Travel Debug)
Load execution state at any historical checkpoint and inspect it without re-executing.

```
Use when: Debugging what state looked like at a specific moment
No re-execution; read-only inspection of checkpointed state
```

### Mode 4 — Governance Replay
Replay a workflow specifically to verify all governance steps were followed correctly.

```
Use when: Compliance audits, regulatory reviews, incident investigations
Output: Compliance verification report, not re-executed outputs
```

---

## Replay Record Schema

A replay session:

```yaml
replay_session:
  session_id: "REPLAY-uuid"
  mode: FULL | PARTIAL | TIME_TRAVEL | GOVERNANCE
  
  target:
    workflow_instance_id: string
    process_id: string
    process_version: string
    
  # For PARTIAL mode
  counterfactual:
    substitute_at_node: "node-id | null"
    substitution:
      type: INPUT_OVERRIDE | AGENT_RESPONSE_OVERRIDE | CONDITION_OVERRIDE
      original_value: {}
      substituted_value: {}
    substitution_rationale: string
    approved_by: agent-id | null   # Tier-3 required
  
  # For TIME_TRAVEL mode
  inspect_at:
    checkpoint_id: string | null
    node_id: string | null
    sequence_number: integer | null
  
  # Session metadata
  initiated_by: agent-id
  initiated_at: ISO-8601
  governance_approval_id: string | null   # required for PARTIAL
  
  # Replay results
  status: PENDING | RUNNING | COMPLETED | FAILED | ABORTED
  started_at: ISO-8601 | null
  completed_at: ISO-8601 | null
  
  replay_trace: []   # execution trace from replay
  original_trace: [] # execution trace from original (for comparison)
  divergence_points: []   # where replay differs from original
  
  report: {}   # generated report (for GOVERNANCE mode)
```

---

## Replay Execution Algorithm

### Full Replay

```
replay_full(session):
  original = load_workflow_instance(session.target.workflow_instance_id)
  audit_events = load_audit_events(session.target.workflow_instance_id)
  
  # Create isolated replay execution context
  replay_context = {
    dag_id: original.dag_id,
    instance_id: session.session_id,   # new instance ID for isolation
    is_replay: true,
    replay_of: session.target.workflow_instance_id,
    context: original.context.inputs   # start with original inputs only
  }
  
  # Execute with captured response injector
  response_injector = build_response_injector(audit_events)
  
  dag_engine.execute(
    dag_id=original.dag_id,
    context=replay_context,
    task_executor=response_injector.get_executor(),  # returns captured outputs
    record_trace=true
  )
  
  # Compare traces
  session.divergence_points = compare_traces(
    original_trace=original.execution_trace,
    replay_trace=replay_context.trace
  )
```

### Response Injector

Intercepts task execution calls and returns historically captured outputs:

```
response_injector.get_executor():
  return function(node_id, inputs):
    historical_output = audit_events
      .filter(type=NODE_COMPLETED, node_id=node_id)
      .first()
      .payload.outputs
    
    if not historical_output:
      raise ReplayGap(node_id=node_id)   # no captured output for this node
    
    return historical_output
```

### Governance Replay

```
replay_governance(session):
  original = load_workflow_instance(session.target.workflow_instance_id)
  audit_events = load_audit_events(session.target.workflow_instance_id)
  lineage = load_lineage(session.target.workflow_instance_id)
  
  report = GovernanceVerificationReport(session)
  
  # Check 1: All required governance nodes were executed
  required_governance_nodes = dag.get_nodes_where(governance.tier_required > 0)
  for node in required_governance_nodes:
    executed = audit_events.find(node_id=node.id, type=NODE_COMPLETED)
    if not executed:
      report.flag_missing_governance_node(node)
  
  # Check 2: All approvals met tier requirements
  approval_events = audit_events.filter(type=APPROVAL_GRANTED)
  for approval in approval_events:
    node = dag.get_node(approval.node_id)
    if approval.actor.tier < node.governance.tier_required:
      report.flag_insufficient_tier(approval, node)
  
  # Check 3: Constitutional checks were not bypassed
  constitutional_nodes = dag.get_nodes_where(constitutional_check=true)
  for node in constitutional_nodes:
    check_event = audit_events.find(node_id=node.id, type=CONSTITUTIONAL_CHECK_PASSED)
    if not check_event:
      report.flag_constitutional_check_missing(node)
  
  # Check 4: All overrides were properly authorized
  override_events = audit_events.filter(type=GOVERNANCE_OVERRIDE_APPLIED)
  for override in override_events:
    if len(override.payload.approved_by) < 2:
      report.flag_unauthorized_override(override)
    if any(approver.tier < 4 for approver in override.payload.approved_by):
      report.flag_insufficient_override_tier(override)
  
  # Check 5: SLA compliance
  for node in dag.nodes where node.governance.sla is set:
    duration = compute_node_duration(audit_events, node)
    if duration > node.governance.sla:
      report.flag_sla_breach(node, duration)
  
  report.finalize()
  return report
```

---

## Divergence Detection

When replay outputs differ from original:

```yaml
divergence_types:
  DETERMINISM_VIOLATION:
    description: Same inputs produced different outputs (non-deterministic agent behavior)
    severity: HIGH
    action: Flag for agent review
  
  MISSING_AUDIT_DATA:
    description: Replay cannot proceed because audit record has gaps
    severity: CRITICAL
    action: Flag potential audit tampering; trigger chain integrity verification
  
  VERSION_MISMATCH:
    description: Process definition changed since original execution
    severity: MEDIUM
    action: Document as expected divergence due to version update
  
  CONTEXT_MUTATION:
    description: A node mutated context in a way that downstream nodes differ
    severity: HIGH
    action: Trace mutation source; document for forensics
```

---

## Access Controls

```yaml
access:
  Mode FULL:
    min_tier: 3
    governance_approval: not required (read-only)
    
  Mode PARTIAL (counterfactual):
    min_tier: 3
    governance_approval: Tier-3 required
    reason: may affect live system state
    
  Mode TIME_TRAVEL:
    min_tier: 2
    governance_approval: not required (read-only state inspection)
    
  Mode GOVERNANCE:
    min_tier: 4
    governance_approval: Tier-4 required
    reason: compliance audit access to full execution records
    
  all_modes:
    access_itself_audited: true   # who ran what replay is logged
```
