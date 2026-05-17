# Recovery States

**System ID:** `recovery-states`
**Role:** Defines the recoverable state space per workflow type — what states are recoverable, from which checkpoint type, with what confidence, and what information must be reconstructed vs. trusted directly
**Storage:** `memory/workflow-state/[workflow-id].yaml` (state files) + recovery state definitions here

---

## Purpose

Not all states are equally recoverable. A workflow suspended at a clean phase boundary is almost trivially recoverable. A workflow interrupted mid-step with no runtime snapshot requires significant reconstruction. A workflow with conflicting decisions requires rollback before recovery can even begin.

Recovery states formalize this: for each combination of (workflow type, failure class, checkpoint availability), there is a defined recovery path, a confidence level, and a set of things that must be re-verified before continuing.

---

## Recovery State Taxonomy

### RS-01: Clean Phase Boundary

**Definition:** Workflow was suspended at a phase boundary. A valid phase snapshot exists.

```yaml
recovery_state: "RS-01"
label: "Clean Phase Boundary"
confidence: HIGH
effort: MINIMAL

indicators:
  - checkpoint_type: "phase_boundary"
  - checkpoint.integrity: "VALID"
  - checkpoint.gate_status_at_snapshot: "ALL_PASSED"
  - No in-progress artifacts

recovery_protocol:
  1. Load phase snapshot
  2. Verify artifact checksums (sample 3 random artifacts)
  3. Load continuation frame for next phase
  4. Resume at next_step — no reconstruction needed

trust_level: FULL
# Trust all decisions, constraints, and artifact states from snapshot
# No reconstruction required
verification_required:
  - Spot-check artifact checksums
  - Confirm next_step inputs are all GATE_PASSED
```

### RS-02: Gate-Pass Resume

**Definition:** Workflow was suspended after a gate pass but before the next step started. A gate-pass checkpoint exists.

```yaml
recovery_state: "RS-02"
label: "Gate-Pass Resume"
confidence: HIGH
effort: MINIMAL

indicators:
  - checkpoint_type: "gate_pass"
  - checkpoint.integrity: "VALID"
  - Step before suspension is COMPLETE with GATE_PASSED artifact

recovery_protocol:
  1. Load gate-pass checkpoint
  2. Verify artifact from gate-passed step
  3. Determine next step from workflow definition
  4. Resume at next_step

trust_level: HIGH
verification_required:
  - Verify gate-passed artifact checksum
  - Confirm next_step is NOT_STARTED
```

### RS-03: Mid-Step With Runtime Snapshot

**Definition:** Workflow was interrupted while a step was in progress. A runtime snapshot exists for the current step.

```yaml
recovery_state: "RS-03"
label: "Mid-Step With Runtime Snapshot"
confidence: MEDIUM
effort: LOW

indicators:
  - A step has status IN_PROGRESS
  - A runtime snapshot exists for that step
  - runtime_snapshot.integrity: "VALID"

recovery_protocol:
  1. Load runtime snapshot
  2. Verify partial artifact at runtime_snapshot.partial_artifact.path
  3. Load tool-call-log (cached results, deduplication context)
  4. Inject resume frame (see runtime-snapshots.md)
  5. Resume within step from sub_task_label

trust_level: MEDIUM
# Trust completed sections, cached tool calls
# Re-verify in-step decisions before writing to execution-memory
verification_required:
  - Partial artifact checksum match
  - Tool-call-log parseable and non-empty
reconstruction_required:
  - None (runtime snapshot contains all needed context)
```

### RS-04: Mid-Step Without Runtime Snapshot

**Definition:** Workflow was interrupted while a step was in progress. No runtime snapshot exists.

```yaml
recovery_state: "RS-04"
label: "Mid-Step Without Runtime Snapshot"
confidence: LOW
effort: MEDIUM

indicators:
  - A step has status IN_PROGRESS
  - No valid runtime snapshot exists for that step
  - A phase snapshot or gate-pass checkpoint exists from before the step

recovery_protocol:
  1. Load prior checkpoint (phase boundary or gate pass before interrupted step)
  2. Verify all artifacts from prior checkpoint
  3. Discard any partial artifact from interrupted step
  4. Re-execute the interrupted step from scratch
  5. Use prior checkpoint's decision state as context

trust_level: HIGH (for prior state) / NONE (for interrupted step)
reconstruction_required:
  - Interrupted step must be re-executed from beginning
  - Warn agent: "This step was previously started. If any external side effects occurred
    (emails sent, tickets created), verify they are idempotent before re-executing."
```

### RS-05: Stale State (Long Gap)

**Definition:** Workflow was suspended more than 24 hours ago. State may be stale even if checkpoints are valid.

```yaml
recovery_state: "RS-05"
label: "Stale State — Long Gap"
confidence: MEDIUM
effort: MEDIUM

indicators:
  - Latest checkpoint age > 24 hours
  - Workflow status SUSPENDED or BLOCKED

recovery_protocol:
  1. Load latest valid checkpoint
  2. Verify all artifact checksums
  3. Run staleness assessment:
     - Check if any external dependencies have changed
     - Check if any intelligence data has expired (see intelligence-memory/)
     - Check if any human decisions pending have been resolved
  4. Flag stale items for re-verification
  5. Resume with staleness warnings injected into agent context

staleness_checks:
  - competitive_intelligence: refresh if > 7 days old
  - market_data: refresh if > 30 days old
  - technical_specs: refresh if > 90 days old
  - human_decisions: verify pending escalations have been resolved

trust_level: MEDIUM
# Trust structural decisions and constraints
# Re-verify time-sensitive intelligence before using
```

### RS-06: Corrupt Checkpoint

**Definition:** The latest checkpoint has failed integrity checks. Must find an older valid checkpoint.

```yaml
recovery_state: "RS-06"
label: "Corrupt Checkpoint — Using Prior"
confidence: MEDIUM
effort: MEDIUM

indicators:
  - Latest checkpoint integrity: "INVALID"
  - A prior checkpoint exists with integrity: "VALID"

recovery_protocol:
  1. Identify most recent valid checkpoint (may be 1-3 phases back)
  2. Calculate work loss: steps completed after the valid checkpoint
  3. Assess recoverability of lost work:
     - Can lost steps be re-executed deterministically?
     - Are the inputs still available?
  4. IF re-executable: resume from valid checkpoint, re-execute lost steps
  5. IF not re-executable: escalate — human must decide

work_loss_estimation:
  - steps_to_redo: [step count]
  - estimated_duration: "[time estimate]"
  - re_executable: true/false

trust_level: HIGH (for valid checkpoint) / UNKNOWN (for steps after it)
reconstruction_required:
  - Re-execute all steps between valid checkpoint and interrupted point
```

### RS-07: No Valid Checkpoint

**Definition:** No valid checkpoint exists. State must be fully reconstructed from artifacts and ledger.

```yaml
recovery_state: "RS-07"
label: "No Valid Checkpoint — Full Reconstruction"
confidence: LOW
effort: HIGH

indicators:
  - checkpoint-registry returns null for all checkpoint queries
  - OR all checkpoints have integrity: "INVALID"

recovery_protocol:
  1. Inventory all artifact files (see artifact-registry.md)
  2. Mine execution-ledger.jsonl for step events
  3. Derive step completion status from gate_pass events
  4. Reconstruct decision state from decision-log.jsonl
  5. Reconstruct constraint state from gate-verdicts.jsonl
  6. Build synthetic checkpoint from reconstructed state
  7. Resume from reconstructed state

→ Defer to runtime-recovery/cold-start-recovery.md

trust_level: LOW
reconstruction_required: FULL
escalation: AUTOMATIC — notify operator before resuming
```

### RS-08: Decision Conflict

**Definition:** The execution memory contains contradictory decisions — a SOFT decision was overridden in a way that conflicts with a FINAL decision.

```yaml
recovery_state: "RS-08"
label: "Decision Conflict — Rollback Required"
confidence: LOW
effort: HIGH

indicators:
  - execution-memory contains two decisions where:
    decision A is FINAL AND decision B contradicts A AND decision B was made after A

recovery_protocol:
  1. Identify conflicting decisions
  2. Find the checkpoint before conflict was introduced
  3. Rollback to pre-conflict checkpoint
  4. Inject the FINAL decision as a hard constraint for the re-execution
  5. Resume from rollback target

→ Defer to recovery-systems/rollback-engine.md

trust_level: NONE for post-conflict state / HIGH for pre-conflict checkpoint
reconstruction_required: ROLLBACK then re-execute
```

### RS-09: Runaway Detection

**Definition:** Workflow has consumed excessive tool calls or context without making progress.

```yaml
recovery_state: "RS-09"
label: "Runaway Execution"
confidence: UNKNOWN
effort: HIGH

indicators:
  - tool_calls_consumed > 3× expected for this step
  - OR same step has been IN_PROGRESS for > 2× its expected duration
  - OR agent-invocations log shows > 5 invocations for same step with no artifact produced

recovery_protocol:
  1. IMMEDIATELY pause workflow (do not let it continue)
  2. Read execution-ledger to understand what happened
  3. Identify root cause:
     - Infinite retry loop on gate fail?
     - Agent exploring vs executing?
     - External dependency never resolving?
     - Contradictory instructions?
  4. Load last runtime snapshot (before runaway began)
  5. Inject focused continuation frame addressing root cause
  6. Resume with tighter constraints

→ Defer to runtime-recovery/recovery-orchestrator.md

trust_level: UNKNOWN — audit before resuming
```

---

## Recovery State Decision Matrix

Given a workflow and its symptoms, determine the recovery state:

```
HAS valid phase boundary checkpoint?
  AND no in-progress step? → RS-01

HAS valid gate-pass checkpoint?
  AND no in-progress step? → RS-02

HAS in-progress step?
  AND valid runtime snapshot exists? → RS-03
  AND no runtime snapshot? → RS-04

HAS valid checkpoint but age > 24h? → RS-05

ALL checkpoints invalid, prior valid exists? → RS-06

NO valid checkpoint at all? → RS-07

Decision conflict detected? → RS-08

Runaway signals detected? → RS-09
```

---

## Recovery State → Recovery System Routing

| Recovery State | Primary System | Fallback |
|---------------|----------------|---------|
| RS-01 | `runtime-recovery/warm-resume.md` | — |
| RS-02 | `runtime-recovery/warm-resume.md` | — |
| RS-03 | `runtime-recovery/interruption-recovery.md` | RS-04 |
| RS-04 | `recovery-systems/workflow-restorer.md` | — |
| RS-05 | `runtime-recovery/warm-resume.md` + staleness checks | — |
| RS-06 | `recovery-systems/state-reconstructor.md` | RS-07 |
| RS-07 | `runtime-recovery/cold-start-recovery.md` | Escalate |
| RS-08 | `recovery-systems/rollback-engine.md` | Escalate |
| RS-09 | `runtime-recovery/recovery-orchestrator.md` | Escalate |

---

## Integration

**Read by:**
- `runtime-recovery/recovery-orchestrator.md` → determines recovery path
- `recovery-systems/failure-detector.md` → maps failure classes to recovery states
- `continuation-systems/workflow-continuator.md` → determines resume confidence
- All runtime-recovery systems → their entry condition
