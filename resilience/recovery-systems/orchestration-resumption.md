# Orchestration Resumption

**System ID:** `orchestration-resumption`
**Role:** Restores the orchestrator's decision-making state — not just individual workflow states, but the orchestrator's active awareness of all concurrent work, routing logic, and supervisor oversight
**Handles:** Cases where the orchestrator itself lost state, not just individual workflows

---

## Purpose

The master orchestrator holds state too — its routing decisions, active delegation chains, supervisor oversight assignments, and multi-workflow coordination logic. When the orchestrator loses context (session end, context limit), individual workflows can be recovered via their state files, but the orchestrator's coordination state — which agent is doing what, what decisions it was about to make, which escalations it was managing — must also be restored.

This system restores orchestrator-level continuity, not step-level continuity.

---

## Orchestrator State Dimensions

### Dimension 01: Active Delegation Map
*Who is the orchestrator waiting on, for what?*

```yaml
delegation_map:
  - delegation_id: "[id]"
    delegated_to: "[agent-id]"
    task: "[task description]"
    workflow: "[workflow-id]"
    step: "[step-id]"
    expected_output: "[artifact name and path]"
    due: "[timestamp]"
    timeout: "[when to follow up]"
    status: "awaiting | returned | timed_out"
```

### Dimension 02: Active Supervision Chain
*What is the supervisor-agent watching?*

```yaml
supervision_chain:
  - supervision_id: "[id]"
    workflow: "[workflow-id]"
    step: "[step-id]"
    artifact_under_review: "[path]"
    reviewer: "supervisor-agent"
    review_type: "quality | gate | conflict"
    status: "pending | reviewing | verdict_pending | complete"
    verdict: null
```

### Dimension 03: Pending Routing Decisions
*What routing decisions was the orchestrator about to make?*

```yaml
pending_routing:
  - routing_id: "[id]"
    input_received: "[what triggered this routing decision]"
    intent_class: "[PM | ARCH | ENG | ...]"
    routing_options_considered: ["[option A]", "[option B]"]
    decision_pending: true
    decision: null
    blocked_by: "[what the orchestrator was waiting on before deciding]"
```

### Dimension 04: Multi-Workflow Coordination
*How are concurrent workflows coordinated?*

```yaml
multi_workflow_coordination:
  - coordination_id: "[id]"
    workflows_involved: ["[id1]", "[id2]"]
    relationship: "sequential | parallel | dependency"
    dependency_direction: "[workflow A must complete before workflow B]"
    current_state: "[workflow A is in step N; workflow B is waiting]"
    next_action: "[when workflow A completes step N, trigger workflow B step M]"
```

### Dimension 05: Escalation Queue Management
*What escalations was the orchestrator managing?*

```yaml
escalation_management:
  - escalation_id: "[id]"
    type: "gate_fail | human_decision | conflict | resource"
    workflow: "[id]"
    step: "[step-id]"
    escalated_to: "[supervisor-agent | human | specialist-agent]"
    context: "[brief description]"
    status: "open | response_received | resolved"
    response: null
    blocking_workflow: "[what waits on this escalation]"
```

---

## Orchestrator State File

Written to `memory/orchestrator-state.yaml` at every session boundary:

```yaml
orchestrator_state:
  snapshot_id: "orch-[YYYY-MM-DD]-[N]"
  timestamp: "[ISO-8601]"
  
  active_workflows_count: [N]
  delegation_count: [N]
  pending_escalations_count: [N]
  
  delegation_map: [see Dimension 01]
  supervision_chain: [see Dimension 02]
  pending_routing: [see Dimension 03]
  multi_workflow_coordination: [see Dimension 04]
  escalation_management: [see Dimension 05]
  
  orchestrator_decision_log:
    - timestamp: "[ISO-8601]"
      decision: "[routing or workflow decision]"
      rationale: "[why]"
      outcome: "[what happened]"
  
  last_known_active_agent: "[agent-id]"
  last_known_active_workflow: "[workflow-id]"
  last_known_active_step: "[step-id]"
```

---

## Orchestration Resumption Protocol

At session start, after reading the session bridge and execution registry:

### STEP 01: Load Orchestrator State
```
Read: memory/orchestrator-state.yaml
Verify: timestamp (is this the most recent state?)
If missing or stale: reconstruct from execution registry + workflow states
```

### STEP 02: Restore Delegation Map

For each item in delegation_map:
```
IF delegation.status == "awaiting":
  CHECK: Has the delegated agent produced the expected artifact?
  
  IF yes (artifact exists at expected path):
    → Mark delegation as "returned"
    → Load artifact for orchestrator review
    → Continue with whatever the orchestrator was going to do with this output
  
  IF no (artifact missing):
    → Delegation timed out or agent was interrupted
    → Re-delegate: re-invoke agent with original task
    → Or escalate if this is the second time
```

### STEP 03: Restore Supervision Chain

For each item in supervision_chain:
```
IF supervision.status == "pending" or "reviewing":
  CHECK: Has supervisor-agent produced a verdict?
  
  IF verdict artifact exists:
    → Load verdict
    → Apply to workflow gate (pass or fail)
    → Advance workflow accordingly
  
  IF no verdict:
    → Re-submit artifact to supervisor-agent for review
    → This is idempotent — supervisor re-reviews and produces same verdict
```

### STEP 04: Restore Pending Routing

For each item in pending_routing:
```
IF routing.decision_pending == true:
  CHECK: Has the blocking dependency resolved?
  
  IF blocker resolved:
    → Make the routing decision now
    → Apply deterministic routing (same input → same route)
    → Log decision
  
  IF blocker unresolved:
    → Keep in pending state
    → Surface to operator if human-blocking
```

### STEP 05: Restore Multi-Workflow Coordination

For each coordination rule:
```
FOR each workflow pair (A depends on B):
  CHECK: Has workflow A reached its dependency-producing step?
  
  IF yes:
    → Trigger workflow B's waiting step
  
  IF no:
    → Keep coordination rule active; no action needed now
```

### STEP 06: Handle Escalation Queue

For each open escalation:
```
IF escalation.escalated_to == HUMAN:
  → Check if human has responded (response artifact or message)
  → If yes: load response, apply, unblock
  → If no: surface to operator as urgent if blocking

IF escalation.escalated_to == supervisor-agent:
  → Re-invoke supervisor-agent with escalation context
  → Idempotent: same input → same verdict

IF escalation.escalated_to == specialist-agent:
  → Re-invoke specialist with original escalation context
```

### STEP 07: Synthesize Orchestrator Action Queue

After restoring all state, produce an ordered action queue:

```yaml
orchestrator_action_queue:
  - priority: 1
    action: "Resume workflow [id] at step [N] — CRITICAL priority"
    requires: "[nothing — ready to execute]"
  
  - priority: 2
    action: "Re-delegate [task] to [agent] — prior delegation timed out"
    requires: "[prior artifact at path]"
  
  - priority: 3
    action: "Human decision needed: [question] — blocking [workflow]"
    requires: "HUMAN INPUT"
  
  - priority: 4
    action: "Trigger workflow [B] — workflow [A] completed dependency step"
    requires: "[A.step.artifact]"
```

---

## Orchestrator State Integrity Checks

Before acting on any restored orchestrator state:

**Check 01: State Currency**
Is the orchestrator state from the most recent session?
- Compare timestamp with execution registry `last_updated`
- If orchestrator state is older: derive from execution registry (more authoritative)

**Check 02: Delegation Consistency**
Do delegations in the orchestrator state match workflow states?
- For each delegation: workflow state should show that step as IN_PROGRESS or COMPLETE
- Mismatch: workflow state is authoritative

**Check 03: No Stale Supervision**
Supervision assignments from more than 48 hours ago should be re-evaluated:
- Re-submit for supervisor review rather than assuming prior verdict is still valid

**Check 04: Coordination Rule Validity**
Multi-workflow coordination rules reference specific workflow IDs:
- Verify those workflow IDs still exist in execution registry
- If a workflow was cancelled or completed: remove the coordination rule

---

## Runaway Execution Recovery (F7)

When orchestration-resumption detects a runaway workflow (F7):

```
Runaway workflow: [id]
Symptoms: [N] iterations, [X]× expected tool calls

IMMEDIATE ACTION:
1. Mark workflow as PAUSED (not FAILED — work may be recoverable)
2. Read last checkpoint to find last known good state
3. Read execution ledger to understand what happened (why so many iterations)
4. Identify root cause:
   - Stuck in retry loop → fix gate criteria or input
   - Exploring vs. executing → inject focused continuation frame
   - External dependency never resolved → escalate dependency
   - Agent ignoring instructions → rebuild context, re-invoke with tighter frame
5. Resume from last clean checkpoint with root cause addressed
```

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md`
**Reads from:**
- `memory/orchestrator-state.yaml`
- `execution-persistence/execution-registry.md`
- All `memory/workflow-state/` files
- `workflow-checkpoints/checkpoint-registry.md`

**Writes to:**
- `memory/orchestrator-state.yaml` → refreshed state
- `execution-persistence/execution-ledger.md` → resumption events
- `continuation-systems/execution-registry.md` → status updates

**Triggers:**
- `continuation-systems/workflow-continuator.md` → resume each restored workflow
- `orchestrator/master-orchestrator.md` → with restored action queue
