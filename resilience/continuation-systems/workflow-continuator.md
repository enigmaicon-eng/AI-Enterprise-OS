# Workflow Continuator

**System ID:** `workflow-continuator`
**Role:** Executes the actual step-level resumption — advances a suspended workflow to the correct point and invokes the appropriate agent
**Input:** Continuation Registry Entry + latest checkpoint
**Output:** Workflow resumed at correct step with full context

---

## Purpose

The Workflow Continuator is the operational arm of the continuation engine. While the continuation engine *decides* what to resume, the continuator *performs* the resumption. It reconstructs step context, validates preconditions, and invokes the appropriate agent at the correct step with the minimum viable context required to continue — no more, no less.

---

## Resumption Process

### Step 01: Load Workflow State

```yaml
# Read from memory/workflow-state/<workflow-id>.yaml
state:
  workflow_id: [id]
  status: SUSPENDED
  current_step: [N]
  steps: [full step list with statuses]
  artifacts: [produced artifact paths]
  open_blockers: [blockers if any]
  last_checkpoint: [checkpoint-id]
```

Validate: Does this state file reflect reality?
- Read each artifact listed as COMPLETE → does it actually exist at that path?
- If artifact missing for COMPLETE step → step status is unreliable → use artifact-based state reconstruction

### Step 02: Determine Resume Point

```
RESUME POINT DECISION:
  
  IF step N is COMPLETE (artifact at path, gate passed in ledger):
    → Resume at step N+1 (phase-boundary continuation)
  
  ELIF step N is IN_PROGRESS + artifact exists:
    → Check gate status
    → If gate unknown: run gate check
    → If gate pass: resume at N+1
    → If gate fail: re-execute step N from beginning
  
  ELIF step N is IN_PROGRESS + NO artifact:
    → Check runtime snapshot for sub-task progress
    → If snapshot shows substantial sub-task completion: resume from snapshot
    → If snapshot missing or old: re-execute step N from beginning
  
  ELIF step N is GATE_REVIEW (submitted, awaiting):
    → Re-submit gate check with existing artifact
    → DO NOT re-execute step — artifact already exists
```

### Step 03: Precondition Verification

Before invoking the agent for the resume step:

**Check each precondition:**
```
FOR each required input of resume step:
  - Does the artifact exist at the specified path?
  - Is the artifact in the correct format (schema check)?
  - Was the producing step marked COMPLETE?

IF any precondition fails:
  → Find the step that should have produced this input
  → Check its state → if COMPLETE: artifact was deleted/moved → escalate
  → If NOT_COMPLETE: run that step first, then return
```

### Step 04: Assemble Resume Context

Use `continuation-systems/context-restorer.md` to rebuild the agent's context:

```yaml
resume_context:
  # Layer 1: Agent Identity (from agents/<agent>.md)
  agent_identity: [agent definition]
  
  # Layer 2: Continuation Framing (ALWAYS FIRST — prevents confusion)
  continuation_frame: |
    RESUMING WORKFLOW: [workflow-id]
    RESUMING AT: Step [N] — [step name]
    PRIOR STEPS COMPLETED: [list]
    THIS SESSION GOAL: Complete step [N] and advance to step [N+1]
    DO NOT re-execute: [list of completed steps]
    DO NOT re-decide: [list of settled decisions from checkpoint]
  
  # Layer 3: Step-Specific Inputs
  step_inputs:
    required_artifacts: [paths]
    handoff_from_prior: [handoff envelope]
  
  # Layer 4: Settled Decisions (constraints that cannot be re-opened)
  settled_decisions:
    - decision: "[decision]"
      made_by: "[agent/step]"
      rationale: "[rationale]"
      do_not_revisit: true
  
  # Layer 5: Open Questions (what needs to be addressed)
  open_questions:
    - "[from prior step handoff]"
  
  # Layer 6: Governance Constraints
  constraints: [applicable gates, quality criteria]
```

### Step 05: Invoke Agent

Invoke the resume step's agent with the assembled context.

**Invocation format:**
```yaml
agent_invocation:
  agent: [step N agent]
  task_id: "[workflow-id]-step-[N]-resume-[attempt]"
  mode: RESUME  # not FRESH — agent knows this is a continuation
  context: [assembled resume context]
  expected_output:
    artifact_path: [expected path]
    gate: [gate definition]
  on_complete:
    advance_to: [step N+1]
    write_checkpoint: true
    update_registry: true
```

### Step 06: Post-Step Handling

After the agent completes the resumed step:

1. Run gate check on produced artifact
2. If gate passes:
   - Mark step N COMPLETE in state file
   - Write phase-boundary checkpoint
   - Update execution registry
   - Advance to step N+1 (or mark workflow COMPLETE if last step)
3. If gate fails:
   - Write gate failure to execution ledger
   - Determine: retry with same agent OR escalate
   - Re-enter continuation loop at step N

---

## Continuation Framing Injection

Every resumed agent invocation begins with a continuation frame — the most important context injection for preventing re-execution of settled work.

**Continuation Frame Template:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW CONTINUATION — [workflow-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THIS IS A RESUMED WORKFLOW — not a fresh start.

Completed steps (DO NOT re-execute):
  ✓ Step 01: [name] — artifact at [path]
  ✓ Step 02: [name] — artifact at [path]
  ✓ Step 03: [name] — artifact at [path]

Settled decisions (DO NOT re-open):
  • [Decision 1] (established in step [N])
  • [Decision 2] (established in step [N])

YOUR TASK IN THIS SESSION:
  Complete Step [N]: [step name]
  Produce: [artifact name] at [path]
  Gate: [gate description]
  Advance to: Step [N+1] when gate passes

Context is pre-loaded. Begin working on Step [N].
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This frame prevents the most common continuation failure: the agent re-reading prior steps and attempting to re-decide settled questions.

---

## Parallel Track Continuator

For parallel step groups:

```
PARALLEL TRACK STATE:
  Track A: COMPLETE (✓ do not touch)
  Track B: SUSPENDED at sub-task 3 of 5
  Track C: FAILED (→ recovery-systems/recovery-orchestrator.md)

CONTINUATOR ACTION:
  1. Verify Track A completion (artifact exists, gate passed)
  2. Resume Track B from sub-task 3 (runtime snapshot)
  3. Route Track C to recovery orchestrator
  4. Set join_barrier: all tracks must reach COMPLETE before step [N+1]
  5. When Track B completes + Track C recovers: advance to step [N+1]
```

---

## Continuation Confidence Levels

| Confidence | Conditions | Action |
|------------|-----------|--------|
| HIGH | Phase-boundary, all artifacts verified, checkpoint fresh | Resume directly |
| MEDIUM | Mid-step, partial artifact, checkpoint <1h old | Resume with verification |
| LOW | No checkpoint, artifact state unknown | Reconstruct state first |
| CRITICAL | No artifacts, no checkpoint, complete information loss | Cold-start recovery |

---

## Integration

**Called by:** `continuation-systems/continuation-engine.md`
**Uses:**
- `continuation-systems/context-restorer.md` → assembles resume context
- `workflow-checkpoints/checkpoint-engine.md` → reads/writes checkpoints
- `execution-persistence/execution-ledger.md` → logs resumption events
- `execution-persistence/execution-registry.md` → updates workflow status

**Delegates to:**
- `recovery-systems/state-reconstructor.md` → when state must be rebuilt
- `recovery-systems/rollback-engine.md` → when last checkpoint is corrupted
