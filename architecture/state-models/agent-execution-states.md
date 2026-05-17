---
layer: state-models
type: agent-execution-states
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Agent Execution State Machine

Defines all states an agent instance can be in during execution, valid transitions, and the behaviors and constraints at each state.

---

## State Diagram

```
                    ┌─────────────────────────────────────────┐
                    │                IDLE                     │
                    │ (not dispatched, awaiting assignment)   │
                    └────────────────┬────────────────────────┘
                                     │ DISPATCH
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │            CONTEXT_LOADING              │
                    │ (context-routing-engine assembling pkg) │
                    └────────────────┬────────────────────────┘
                                     │ CONTEXT_READY
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │               ACTIVE                    │◄────┐
                    │ (executing task, producing artifact)    │     │
                    └──┬──────────┬──────────┬───────────────┘     │
                       │          │          │                      │
              GATE_    │  ESCALATE│  BLOCKED │ LOOP_        RESUME  │
              REACHED  │          │          │ DETECTED             │
                       ▼          ▼          ▼        ▼             │
               ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
               │  WAITING  │ │ESCALATED │ │ BLOCKED  │ │ PAUSED   ││
               │  _GATE   │ │          │ │          │ │(loop det)││
               └──┬───────┘ └──────────┘ └──┬───────┘ └──────────┘│
                  │ GATE_                    │ UNBLOCKED            │
                  │ APPROVED                 └──────────────────────┘
                  │
                  ▼
         ┌─────────────────────────────────────────┐
         │             COMPLETED                   │
         │ (artifact produced, checkpoint written) │
         └────────────────┬────────────────────────┘
                          │ 
                    ┌─────┴──────┐
                    ▼            ▼
              ┌──────────┐ ┌──────────┐
              │ ARCHIVED │ │ FAILED   │
              └──────────┘ └──────────┘
```

---

## State Definitions

### IDLE
- **Description:** Agent is defined in MASTER-REGISTRY.md but not currently dispatched.
- **Entry:** System start, dispatch completed, dispatch failed with recovery
- **Exit:** DISPATCH event
- **Allowed actions:** None (no LLM call in flight)
- **Artifacts:** None in progress

### CONTEXT_LOADING
- **Description:** context-routing-engine is assembling the context package for this dispatch.
- **Entry:** DISPATCH event from orchestrator
- **Exit:** CONTEXT_READY → ACTIVE; CONTEXT_FAILURE → FAILED
- **SLA:** ≤500ms (from context-routing-engine health target)
- **Timeout:** 2000ms; if exceeded → FAILED with `context_assembly_timeout`

### ACTIVE
- **Description:** Agent has received context package and is executing the assigned task.
- **Entry:** CONTEXT_READY
- **Exit:** Multiple (see transitions below)
- **Allowed actions:**
  - Produce working artifact (output to scratchpad or artifact path)
  - Call sub-agents (spawns new DISPATCH events)
  - Emit system events
  - Write to memory (home domain only)
  - Read cross-domain memory (per federation grants)
- **Step limit:** 25 steps/session (from dexter)
- **Loop detection:** if same step visited >3 times → PAUSED

### WAITING_GATE
- **Description:** Agent has reached a human-required gate and is paused awaiting approval.
- **Entry:** Artifact produced that requires human gate (per governance principles)
- **Exit:** GATE_APPROVED → COMPLETED; GATE_REJECTED → ACTIVE (revise)
- **Human notification:** Required — cannot self-approve a human gate
- **Max wait:** No timeout (human gates are blocking by design)

### ESCALATED
- **Description:** Agent has encountered a decision beyond its authority and escalated to a higher tier.
- **Entry:** Agent determines it lacks authority for a required decision
- **Exit:** ESCALATION_RESOLVED → ACTIVE; ESCALATION_REJECTED → FAILED
- **Escalation target:** One tier up from agent's tier (per authority chain in context package)

### BLOCKED
- **Description:** Agent cannot proceed because a required input or dependency is unavailable.
- **Entry:** Dependency check fails (artifact missing, integration down, gap)
- **Exit:** UNBLOCKED (dependency available) → ACTIVE; TIMEOUT → FAILED
- **Blocking conditions:** Recorded in run-context `blocking-conditions` array
- **Timeout:** 4 hours for integration dependency; 24 hours for human dependency

### PAUSED
- **Description:** Agent execution paused due to loop detection or step limit reached.
- **Entry:** Loop detected (same step >3 times) or step limit (25) reached
- **Exit:** RESUME (after orchestrator review) → ACTIVE; ABORT → FAILED
- **Required action:** Orchestrator must review and determine continuation strategy

### COMPLETED
- **Description:** Agent has successfully produced the required artifact and written the checkpoint.
- **Entry:** Artifact validation passes, checkpoint written
- **Exit:** Move to ARCHIVED state after retention period
- **Required actions on completion:**
  1. Write step checkpoint to `memory/workflow-state/{instance-id}/checkpoints/`
  2. Update run-context with completed step
  3. Emit `workflow.step.completed` event
  4. Check for consistency anchor violations (post-output check)

### ARCHIVED
- **Description:** Completed dispatch record retained for audit and lineage purposes.
- **Retention:** 90 days (then deleted)
- **Readable by:** organizational-learning-agent for knowledge synthesis

### FAILED
- **Description:** Agent dispatch terminated with an error.
- **Entry:** Context assembly timeout, unrecoverable error, step limit exhausted, loop detection abort
- **Required actions:**
  1. Write failure record to `memory/workflow-state/{instance-id}/failures/`
  2. Emit `agent.dispatch.escalated` event (failure escalated to orchestrator)
  3. Do NOT write partial artifacts as completed

---

## Valid State Transitions

| From | To | Event | Condition |
|---|---|---|---|
| IDLE | CONTEXT_LOADING | DISPATCH | Orchestrator selects agent |
| CONTEXT_LOADING | ACTIVE | CONTEXT_READY | Context package assembled |
| CONTEXT_LOADING | FAILED | CONTEXT_FAILURE | Assembly timeout or permission denial |
| ACTIVE | WAITING_GATE | GATE_REACHED | Artifact requires human approval |
| ACTIVE | ESCALATED | ESCALATE | Decision beyond agent authority |
| ACTIVE | BLOCKED | DEPENDENCY_MISSING | Required input unavailable |
| ACTIVE | PAUSED | LOOP_DETECTED | Same step >3 times or >25 steps |
| ACTIVE | COMPLETED | ARTIFACT_VALIDATED | Output passes validation |
| ACTIVE | FAILED | UNRECOVERABLE_ERROR | Fatal error, no recovery path |
| WAITING_GATE | ACTIVE | GATE_REJECTED | Human rejects, agent must revise |
| WAITING_GATE | COMPLETED | GATE_APPROVED | Human approves |
| ESCALATED | ACTIVE | ESCALATION_RESOLVED | Higher authority provides decision |
| ESCALATED | FAILED | ESCALATION_REJECTED | Cannot proceed |
| BLOCKED | ACTIVE | UNBLOCKED | Dependency available |
| BLOCKED | FAILED | BLOCK_TIMEOUT | Max wait exceeded |
| PAUSED | ACTIVE | RESUME | Orchestrator clears for continuation |
| PAUSED | FAILED | ABORT | Orchestrator decides not to continue |
| COMPLETED | ARCHIVED | RETENTION_TTL | After 90-day retention |

---

## State Observability

Every state transition emits a structured event (see `ontology/event-vocabulary.md`):

| Transition | Event Type |
|---|---|
| → ACTIVE | `agent.dispatch.activated` |
| → COMPLETED | `agent.dispatch.completed` |
| → WAITING_GATE | `workflow.gate.reached` |
| → ESCALATED | `agent.dispatch.escalated` |
| → FAILED | `agent.dispatch.escalated` (failure variant) |
| → PAUSED (loop) | `workflow.loop.detected` |

---

## State Persistence

Agent execution state is NOT persisted independently — it is tracked via:
1. The run-context `in-progress-step` and `completed-steps` arrays
2. The workflow state directory: `memory/workflow-state/{instance-id}/`
3. Checkpoint files written at each step completion

On session recovery, agent execution state is reconstructed from the session checkpoint.