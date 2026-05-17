# Continuation Engine

**System ID:** `continuation-engine`
**Role:** Master coordinator for all autonomous continuation operations — the brain that decides what to resume, how, and from which point
**Extends:** `orchestrator/execution-engine.md` + `state-models/workflow-states.md`

---

## Purpose

The Continuation Engine solves the fundamental problem of multi-session, long-running AI workflows: **context windows end, but work must not**.

When a session ends with work in progress, the Continuation Engine ensures:
1. Every in-flight workflow has a recovery point it can resume from
2. New sessions find exactly what state was left behind
3. Agents can pick up mid-task with deterministic fidelity
4. No decision, artifact, or completed step is ever repeated

This is the top-level coordinator — it delegates to specialized subsystems but owns the continuation lifecycle.

---

## Continuation Architecture

```
SESSION ENDS (context window limit or user interruption)
         │
         ▼
PHASE 01: State Capture
  ├─ Checkpoint Engine       → write phase snapshot
  ├─ Execution Ledger        → append terminal event
  ├─ Execution Registry      → mark workflow as SUSPENDED
  └─ Work Queue              → persist incomplete work items
         │
         ▼
         [SESSION ENDS — artifacts + state files survive]
         │
         ▼
NEW SESSION BEGINS
         │
         ▼
PHASE 02: Discovery
  ├─ Execution Registry      → find all SUSPENDED workflows
  ├─ Checkpoint Registry     → find latest valid checkpoint per workflow
  └─ Failure Detector        → identify any FAILED workflows needing recovery
         │
         ▼
PHASE 03: Triage
  ├─ SUSPENDED: warm resume  → warm-resume.md (checkpoint <5 min old)
  ├─ SUSPENDED: cold resume  → cold-start-recovery.md (checkpoint >5 min)
  ├─ BLOCKED: unblock check  → workflow-restorer.md
  ├─ FAILED: root cause      → recovery-orchestrator.md
  └─ ESCALATED: human needed → surface to operator
         │
         ▼
PHASE 04: Resumption
  ├─ Context Restorer        → reconstruct agent context
  ├─ Workflow Continuator    → resume at correct step
  ├─ Deterministic Executor  → re-execute with same inputs
  └─ Session Bridger         → bridge to new context window
         │
         ▼
[WORKFLOW CONTINUES AS IF NEVER INTERRUPTED]
```

---

## Continuation Protocol

### Protocol 01: Phase-Boundary Continuation

The safest resumption point — the workflow completed a full step (phase) before stopping.

**State at rest:** Phase N is COMPLETE, Phase N+1 is NOT_STARTED.
**Resume action:** Load handoff envelope from completed phase, invoke next step agent.
**Confidence:** Very high — complete phase artifacts exist, gate was passed.

```yaml
resume_type: phase_boundary
checkpoint: phase-snapshot-[workflow-id]-step-N.yaml
action:
  1. Read handoff envelope from step N's completion record
  2. Verify artifact at expected path exists
  3. Invoke step N+1 agent with handoff context
```

### Protocol 02: Mid-Step Continuation

The workflow was interrupted inside a step — artifact may be partially complete or missing.

**State at rest:** Step N is IN_PROGRESS, artifact may not exist.
**Resume action:** Determine what was completed within the step; restart from last sub-task.

**Sub-task detection:**
- If artifact exists at expected path: check if it passed gate → if yes, advance to next step
- If artifact exists but gate not checked: run gate check, then advance or iterate
- If no artifact: re-execute full step from beginning (idempotent re-execution)

```yaml
resume_type: mid_step
checkpoint: runtime-snapshot-[workflow-id]-step-N-t[timestamp].yaml
action:
  1. Load runtime snapshot to determine sub-task progress
  2. Check if partial artifact exists at expected path
  3. Route to: restart_full_step | resume_partial | complete_and_advance
```

### Protocol 03: Cold-Start Continuation

Context was completely lost — no recent checkpoint, or checkpoint is unreadable.

**State at rest:** Unknown — must reconstruct from artifacts on disk.
**Resume action:** State reconstruction from artifact evidence.

```yaml
resume_type: cold_start
action:
  1. Enumerate all artifact files in expected workflow paths
  2. Determine which steps produced which artifacts (artifact registry)
  3. Reconstruct workflow state from artifact existence + modification timestamps
  4. Find the last completed step (artifact exists + gate evidence)
  5. Resume from step N+1
```

### Protocol 04: Parallel Track Continuation

A parallel workflow execution had some tracks complete and some interrupted.

**State at rest:** Some parallel tracks COMPLETE, others SUSPENDED or FAILED.
**Resume action:** Resume only incomplete tracks; join when all complete.

```yaml
resume_type: parallel_track
action:
  1. Enumerate all tracks in parallel group
  2. Identify: COMPLETE tracks (do not re-execute)
  3. Identify: SUSPENDED tracks (resume each)
  4. Identify: FAILED tracks (recover or escalate)
  5. Apply join_at condition when all tracks reach COMPLETE
```

---

## Continuation Triggers

The engine activates automatically when:

| Trigger | Detection Method | Response |
|---------|-----------------|----------|
| Session start | Execution Registry query | Scan for SUSPENDED/FAILED workflows |
| Context budget warning | Context Manager signal | Force checkpoint before limit |
| Explicit user request | "resume" / "continue" / "where were we?" | Load last active workflow state |
| Handoff received | Handoff envelope received with workflow-id | Resume at stated step |
| Timer (background) | Cron-style session check | Alert if workflow idle > 24h |

---

## Continuation Registry Entry

Every workflow under continuation tracking has a registry entry:

```yaml
continuation-entry:
  workflow_id: "[YYYY-MM-DD]-[workflow-name]-[slug]"
  workflow_type: "[feature-development | discovery | architecture-review | ...]"
  status: "SUSPENDED | BLOCKED | FAILED | ESCALATED | COMPLETE"
  
  last_known_good:
    step: "[step-id]"
    timestamp: "[ISO-8601]"
    artifact: "[path]"
    checkpoint: "[checkpoint-id]"
  
  current_step:
    step: "[step-id]"
    status: "[NOT_STARTED | IN_PROGRESS | GATE_REVIEW]"
    agent: "[agent-id]"
    started: "[ISO-8601]"
    runtime_snapshot: "[snapshot-id]"
  
  continuation_type: "phase_boundary | mid_step | cold_start | parallel_track"
  resume_confidence: "[HIGH | MEDIUM | LOW]"
  
  blockers:
    - description: "[blocker]"
      owner: "[agent or human]"
      since: "[timestamp]"
  
  escalation:
    required: false
    reason: null
    human_decision_needed: null
```

---

## Idempotency Guarantee

The continuation engine guarantees idempotent re-execution:

**Rule 01:** If a step produced an artifact that passed its gate → never re-execute it.
**Rule 02:** If a step produced an artifact that did NOT pass its gate → re-execute the step, not redo the artifact.
**Rule 03:** If a step produced no artifact → re-execute the full step.
**Rule 04:** Parallel tracks that completed → never re-execute regardless of other track state.

Idempotency check:
```
FOR EACH step in workflow:
  IF artifact exists at expected path
    AND gate_passed = TRUE in checkpoint or execution ledger:
    status = CONFIRMED_COMPLETE (do not re-execute)
  ELIF artifact exists at path
    AND gate status unknown:
    RUN GATE CHECK → if pass: mark COMPLETE; if fail: re-execute step
  ELSE:
    status = NEEDS_EXECUTION
```

---

## Integration

**Extends:**
- `orchestrator/execution-engine.md` — adds continuation protocol on top of execution protocol
- `state-models/workflow-states.md` — operates within the canonical state machine

**Uses:**
- `workflow-checkpoints/checkpoint-engine.md` → creates/reads checkpoints
- `execution-persistence/execution-registry.md` → tracks all active workflows
- `recovery-systems/recovery-orchestrator.md` → handles FAILED state
- `continuation-systems/context-restorer.md` → rebuilds agent context
- `continuation-systems/workflow-continuator.md` → performs actual step resumption

**Read at session start by:** `orchestrator/master-orchestrator.md`
