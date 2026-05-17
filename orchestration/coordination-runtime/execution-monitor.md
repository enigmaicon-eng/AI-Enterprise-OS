---
layer: coordination-runtime
type: execution-monitor
version: 1.0.0
created: 2026-05-10
owner: master-orchestrator-agent
authority: enterprise-architecture-council
---

# Execution Monitor

Real-time monitoring of all running agent dispatches during a session. Detects failures, stalls, loops, budget exhaustion, and consensus deadlocks. Triggers the appropriate recovery protocol for each failure type.

---

## What the Execution Monitor Tracks

The execution monitor maintains a live view of all active dispatches:

```yaml
# Maintained in-memory during session (checkpointed every 5 min)
execution-state:
  session-id: "{session-id}"
  last-updated: "{ISO-8601}"
  
  active-dispatches:
    - dispatch-id: "{UUID}"
      agent: "{agent-id}"
      step-id: "{step-id}"
      workflow-instance-id: "{id}"
      started-at: "{ISO-8601}"
      time-budget-seconds: {N}
      time-elapsed-seconds: {N}
      last-heartbeat: "{ISO-8601}"
      visit-count: {N}  # loop detection
      status: "RUNNING|STALLED|LOOP_DETECTED|COMPLETED|FAILED"
      
  active-consensus:
    - consensus-id: "{UUID}"
      protocol: "{type}"
      votes-received: {N}
      votes-required: {N}
      deadline: "{ISO-8601}"
      status: "COLLECTING|DEADLOCKED|RESOLVED"
      
  active-approvals:
    - approval-id: "{UUID}"
      artifact: "{path}"
      approver: "{agent-id or human}"
      requested-at: "{ISO-8601}"
      sla-deadline: "{ISO-8601}"
      
  context-budget:
    session-tokens-used: {N}
    session-tokens-budget: {N}
    usage-pct: {N}%
```

---

## Detection Protocols

### 1. Stall Detection

**Condition:** A dispatch has no new checkpoint written for longer than its time budget × 1.5.

```python
def check_for_stalls(active_dispatches):
    now = current_time()
    for dispatch in active_dispatches:
        stall_threshold = dispatch.time_budget_seconds * 1.5
        time_since_heartbeat = (now - dispatch.last_heartbeat).seconds
        
        if time_since_heartbeat > stall_threshold:
            trigger_stall_recovery(dispatch)
```

**Stall recovery sequence:**
1. Mark dispatch as STALLED
2. Emit `coordination.step.stalled` event
3. Wait 5 additional minutes (buffer for slow LLM responses)
4. If still stalled:
   a. Attempt re-dispatch to backup agent (if backup available)
   b. If no backup: pause workflow, notify orchestrator
   c. Orchestrator decides: extend timeout or abort step

### 2. Loop Detection

**Condition:** The same step-id has been visited more than 3 times in the current session (from dexter pattern D-003).

```python
def check_for_loops(active_dispatches):
    for dispatch in active_dispatches:
        visit_count = run_context.step_visit_counts.get(dispatch.step_id, 0)
        if visit_count > 3:
            trigger_loop_recovery(dispatch)
```

**Loop recovery sequence:**
1. Pause the stalling dispatch (PAUSED state — not FAILED)
2. Set `loop_detected: true` in run-context
3. Emit `workflow.loop.detected` event with step history
4. Escalate to master-orchestrator-agent
5. Orchestrator options:
   - **Break the loop:** Modify step spec or provide missing context that caused the loop
   - **Skip the step:** If non-critical, mark as SKIPPED and advance
   - **Abort the workflow:** If the loop indicates a fundamental design problem

### 3. Consensus Deadlock Detection

**Condition:** Consensus deadline has passed without a qualifying outcome.

```python
def check_for_consensus_deadlock(active_consensus):
    now = current_time()
    for consensus in active_consensus:
        if now > consensus.deadline and consensus.status == "COLLECTING":
            handle_consensus_deadlock(consensus)
```

**Deadlock recovery sequence:**
1. Mark consensus as DEADLOCKED
2. Apply deadlock recovery protocol (from consensus-engine.md):
   - RAFT_LEADER deadlock → escalate to WEIGHTED_VOTE
   - WEIGHTED_VOTE deadlock → escalate to ARBITER
   - ARBITER deadlock → escalate to T4 authority
   - T4 deadlock → escalate to human operator
3. Log CONS-NNN record with DEADLOCKED status

### 4. Human Gate SLA Breach

**Condition:** A pending human approval has exceeded its SLA deadline.

```python
def check_approval_sla(active_approvals):
    now = current_time()
    for approval in active_approvals:
        if now > approval.sla_deadline:
            trigger_sla_breach(approval)
```

**SLA breach response sequence:**
1. Emit `governance.approval.sla-breached` event
2. Escalate reminder to the approving agent/human
3. If breach > 2× SLA: escalate to T4 for awareness
4. If breach > 4× SLA: orchestrator may pause the blocked workflow (cannot proceed without approval)

**SLA defaults:**
- Agent peer review: 30 minutes
- T3 authority review: 4 hours
- Human approval (standard): 24 hours
- Human approval (CRITICAL): 4 hours
- Human approval (INCIDENT): 1 hour

### 5. Context Budget Exhaustion

**Condition:** Session context budget exceeds 90% of session limit.

```python
def check_context_budget(execution_state):
    if execution_state.context_budget.usage_pct > 90:
        trigger_emergency_compression()
    elif execution_state.context_budget.usage_pct > 80:
        trigger_standard_compression()
    elif execution_state.context_budget.usage_pct > 60:
        log_budget_warning()
```

**Budget exhaustion recovery:**
1. At 80%: Apply Stage 1-2 compression (deduplication + relevance filter)
2. At 90%: Apply Stage 1-4 compression (all stages except hard truncation)
3. At 95%: Write emergency session checkpoint before continuing
4. At 98%: Pause all active dispatches, write emergency session checkpoint, close session
5. P0 elements are never compressed regardless of budget level

---

## Recovery State Machine

```
RUNNING → STALLED → STALL_RECOVERY → RUNNING (if recovered)
                                    → FAILED (if unrecoverable)

RUNNING → LOOP_DETECTED → PAUSED → RUNNING (if loop broken)
                                  → SKIPPED (if non-critical)
                                  → FAILED (if loop is fundamental)

CONSENSUS → DEADLOCKED → ESCALATED → RESOLVED
                                    → HUMAN_GATE (if all agent tiers exhausted)
```

---

## Execution Monitor Health Report

The execution monitor produces a health report after every session, written to `handoffs/session-{date}/execution-health.md`:

```yaml
execution-health:
  session-id: "{id}"
  total-dispatches: {N}
  successful-dispatches: {N}
  failed-dispatches: {N}
  stall-events: {N}
  stall-recoveries: {N}
  loop-detections: {N}
  consensus-deadlocks: {N}
  sla-breaches: {N}
  context-compressions: {N}
  peak-context-usage-pct: {N}
  
  alerts:
    - "{any anomalies requiring orchestrator attention}"
```