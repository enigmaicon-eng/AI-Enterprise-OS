# Recovery Orchestrator

**System ID:** `recovery-orchestrator`
**Role:** Master coordinator for all recovery operations — triages failure class, selects the appropriate recovery system, sequences recovery steps, and ensures no recovery attempt makes things worse
**Called by:** All systems that detect a recovery-worthy condition

---

## Purpose

Recovery is not a single thing. A stalled workflow needs warm-resume. A corrupt checkpoint needs state reconstruction. A decision conflict needs rollback. A runaway agent needs immediate halt and focused restart. Each condition has a different recovery system — and some conditions require coordinating multiple recovery systems in sequence.

The recovery orchestrator is the single entry point. Every recovery-worthy event routes here. The orchestrator diagnoses, selects, sequences, and monitors the recovery response.

---

## Entry Conditions

The recovery orchestrator is invoked when any of the following is detected:

| Source | Condition | Recovery Class |
|--------|-----------|----------------|
| `failure-detector.md` | F1: Missing artifact | RS-04 or RS-07 |
| `failure-detector.md` | F2: Stalled workflow | RS-03 or RS-04 |
| `failure-detector.md` | F3: Gate fail unrecovered | Escalation |
| `failure-detector.md` | F4: Partial parallel tracks | RS-03/04 per track |
| `failure-detector.md` | F5: Checkpoint corrupt | RS-06 or RS-07 |
| `failure-detector.md` | F6: Decision conflict | RS-08 → Rollback |
| `failure-detector.md` | F7: Runaway execution | RS-09 → Immediate halt |
| `failure-detector.md` | F8: State file corrupt | RS-07 |
| `failure-detector.md` | F9: Orphan artifact | Investigation |
| Session start | Interrupted IN_PROGRESS step | RS-03 or RS-04 |
| Orchestrator | Manually initiated recovery | Any |

---

## Recovery Orchestration Protocol

### PHASE 01: Intake and Triage

```
INPUT: {
  workflow_id,
  failure_class: "F1–F9 | session_interrupt | manual",
  failure_report,  // from failure-detector.md
  detected_at
}

TRIAGE:
  1. Load workflow state (memory/workflow-state/[workflow-id].yaml)
  2. Load checkpoint registry (checkpoint-registry.md) — latest valid checkpoint
  3. Load execution ledger — last 20 events for this workflow
  4. Determine recovery state: RS-01 through RS-09 (see recovery-states.md)
  5. Assess risk: Can recovery be done safely? Or could it make things worse?
```

**Risk Assessment:**

| Condition | Risk Level | Action |
|-----------|-----------|--------|
| Phase boundary checkpoint exists, integrity VALID | LOW | Proceed automatically |
| Gate-pass checkpoint exists, integrity VALID | LOW | Proceed automatically |
| No valid checkpoint, but artifacts exist | MEDIUM | Proceed with reconstruction |
| Decision conflict detected | HIGH | Do NOT proceed — rollback first |
| Runaway: tool calls 3× expected | HIGH | Halt immediately — audit before resume |
| Multiple F-class failures on same workflow | CRITICAL | Escalate to human |
| Third rollback attempt on same workflow | CRITICAL | Halt — human investigation required |

### PHASE 02: Recovery Plan

For risk level LOW or MEDIUM, generate a recovery plan before executing:

```yaml
recovery_plan:
  workflow_id: "[id]"
  recovery_state: "RS-[N]"
  confidence: "HIGH | MEDIUM | LOW"
  
  steps:
    - step: 1
      action: "Load checkpoint chk-[uuid] (phase boundary)"
      system: "warm-resume"
      expected_outcome: "Workflow state restored to step [N]"
    
    - step: 2
      action: "Verify artifact checksums for all GATE_PASSED steps"
      system: "artifact-registry"
      expected_outcome: "All artifacts verified valid"
    
    - step: 3
      action: "Resume at step [N+1]"
      system: "workflow-continuator"
      expected_outcome: "Workflow execution continues"
  
  estimated_work_loss: "[estimate]"
  steps_to_redo: []
  risk: "LOW"
  human_approval_required: false
```

For risk level HIGH or CRITICAL: generate plan AND require human approval before executing.

### PHASE 03: Recovery Execution

Execute the recovery plan step by step, logging each action:

```
FOR EACH step in recovery_plan.steps:
  1. Log: "Recovery Step [N]: [action]"
  2. Invoke the specified recovery system
  3. Verify expected_outcome
  4. IF outcome achieved: continue to next step
  5. IF outcome not achieved:
     → Log failure
     → Escalate: bump risk level up one tier
     → Re-generate recovery plan from current state
     → If max retries exceeded: escalate to human
```

### PHASE 04: Verification

After recovery completes, verify the recovered state is clean:

```
VERIFICATION CHECKLIST:
  □ Workflow status reflects actual execution state
  □ All artifacts referenced in state file exist and have valid checksums
  □ No contradictory decisions in execution-memory
  □ Execution registry is consistent with checkpoint
  □ Work queue reflects correct next items
  □ Execution ledger has recovery event logged

IF all checks pass:
  → Mark recovery COMPLETE
  → Hand off to workflow-continuator for resumption

IF any check fails:
  → Recovery incomplete — do not resume
  → Escalate with full recovery attempt log
```

### PHASE 05: Resumption Handoff

After successful recovery:

```
HAND OFF to: continuation-systems/workflow-continuator.md
WITH:
  - workflow_id
  - recovery_state (RS-NN)
  - resume_step
  - confidence_level
  - recovery_notes: "[what was recovered, what was lost, what was re-executed]"
  - checkpoint_id (the checkpoint that was used)
```

---

## Recovery State Routing Table

| Recovery State | Primary System | Pre-condition | Post-action |
|----------------|---------------|---------------|-------------|
| RS-01 | `warm-resume.md` | None | Resume at next_step |
| RS-02 | `warm-resume.md` | None | Resume at next_step |
| RS-03 | `interruption-recovery.md` | Runtime snapshot exists | Resume mid-step |
| RS-04 | `workflow-restorer.md` | Phase checkpoint exists | Re-execute interrupted step |
| RS-05 | `warm-resume.md` + staleness checks | Staleness report generated | Resume with fresh intelligence |
| RS-06 | `state-reconstructor.md` | Prior valid checkpoint exists | Re-execute lost steps |
| RS-07 | `cold-start-recovery.md` | None | Full reconstruction |
| RS-08 | `rollback-engine.md` | Pre-conflict checkpoint identified | Resume from rollback target |
| RS-09 | Immediate halt → audit → `warm-resume.md` | Root cause identified | Resume with tighter frame |

---

## Recovery Logging

Every recovery operation is logged to the execution ledger:

```json
{
  "event_type": "recovery_initiated",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "failure_class": "F[N]",
  "recovery_state": "RS-[N]",
  "recovery_system": "[system]",
  "confidence": "HIGH | MEDIUM | LOW",
  "human_approval_required": false
}

{
  "event_type": "recovery_completed",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "recovery_state": "RS-[N]",
  "resume_step": "[step-id]",
  "steps_lost": ["[step-ids]"],
  "steps_to_redo": ["[step-ids]"],
  "work_loss_minutes": 0,
  "success": true
}
```

---

## Escalation Protocol

Conditions that escalate to human:

1. **Third rollback attempt on same workflow** — structural problem, needs investigation
2. **Risk level CRITICAL** — impact too high for automated recovery
3. **Recovery fails twice** — automated recovery not working
4. **F3: Gate fail unrecovered after 3 retries** — agent cannot self-correct
5. **Multiple F-class failures simultaneously** — systemic failure
6. **Runaway with unknown root cause** — do not resume without understanding why

Escalation format:

```
RECOVERY ESCALATION
═══════════════════
Workflow: [workflow-id]
Failure: [failure class and description]
Recovery attempts: [N]
Recovery states tried: [RS-NN, RS-NN]

Current state: [description of what is actually happening]

WHY automated recovery cannot proceed:
  [specific reason]

What you need to decide:
  Option A: [action] → outcome: [expected result]
  Option B: [action] → outcome: [expected result]
  Option C: Abandon workflow → work loss: [estimate]

Evidence:
  Last valid checkpoint: [checkpoint-id] at [timestamp]
  Execution ledger excerpt: [last 10 relevant events]
```

---

## Recovery Coordinator State File

Written at recovery initiation, updated throughout:

`memory/recovery/[workflow-id]-recovery-[timestamp].yaml`

```yaml
recovery_id: "rec-[uuid]"
workflow_id: "[id]"
initiated_at: "[ISO-8601]"
initiated_by: "[system or human]"
failure_class: "[F-N]"
recovery_state: "RS-[N]"
status: "IN_PROGRESS | COMPLETE | ESCALATED | FAILED"

attempts:
  - attempt_number: 1
    system: "[recovery system]"
    started_at: "[ISO-8601]"
    completed_at: "[ISO-8601 or null]"
    outcome: "SUCCESS | FAILURE"
    notes: "[what happened]"

final_resume_step: "[step-id or null]"
work_loss_minutes: 0
escalated: false
escalated_at: null
```

---

## Integration

**Called by:**
- `recovery-systems/failure-detector.md` → primary caller
- `continuation-systems/workflow-continuator.md` → when resumption fails
- Session start protocol → for interrupted IN_PROGRESS workflows

**Calls:**
- `runtime-recovery/warm-resume.md` → RS-01, RS-02, RS-05
- `runtime-recovery/interruption-recovery.md` → RS-03
- `recovery-systems/workflow-restorer.md` → RS-04
- `runtime-recovery/cold-start-recovery.md` → RS-07
- `recovery-systems/rollback-engine.md` → RS-08
- `recovery-systems/state-reconstructor.md` → RS-06, RS-07

**On completion:**
- `continuation-systems/workflow-continuator.md` → resumption handoff
- `orchestrator/master-orchestrator.md` → orchestrator awareness update
