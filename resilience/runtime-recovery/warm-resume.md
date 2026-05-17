# Warm Resume

**System ID:** `warm-resume`
**Role:** Fast resumption from a recent, valid checkpoint — the happy path of recovery, optimized for speed and minimal work loss
**Handles:** RS-01 (Clean Phase Boundary), RS-02 (Gate-Pass Resume), RS-05 (Stale State — Long Gap)

---

## Purpose

Warm resume is the opposite of cold start. Where cold start reconstructs from first principles, warm resume trusts a recent valid checkpoint and gets the workflow back in motion with minimal overhead.

"Warm" refers to the cache-warm metaphor: the checkpoint contains all needed state, so the agent can resume quickly without searching for evidence or reconstructing context. The checkpoint is the context.

The goal of warm resume: **from suspension to resumed execution in under 2 minutes of preparation time.**

---

## Entry Conditions

Warm resume is applicable when:

1. A valid checkpoint exists (integrity: "VALID" or "DEGRADED")
2. The checkpoint is recent enough to trust (age < 24 hours for most data types)
3. No decision conflicts are present in the checkpoint's decision state
4. No in-progress artifacts from an interrupted step (or an acceptable runtime snapshot covers them)

If any of these conditions is not met → route to cold-start-recovery or rollback-engine.

---

## Warm Resume Protocol

### STEP 01: Select Checkpoint

```
PRIORITY ORDER:
  1. Latest phase boundary checkpoint (integrity: VALID)
  2. Latest gate-pass checkpoint (integrity: VALID)
  3. Latest any-type checkpoint (integrity: VALID)
  4. Latest checkpoint with integrity: DEGRADED + explicit operator approval

SELECTION COMMAND:
  checkpoint = checkpoint-registry.find_latest_valid(workflow_id)
  
  IF checkpoint.trigger == "phase_boundary":
    → ideal — use phase snapshot protocol
  ELSE:
    → standard warm resume
```

### STEP 02: Validate Checkpoint

```
RUN: checkpoint-engine.validate(checkpoint_id)
  - Verify INTEGRITY.sha256
  - Spot-check artifact checksums (sample 3 random artifacts, verify all GATE_PASSED)
  - Verify decisions.yaml parseable
  - Verify checkpoint references a valid next_step in workflow definition

IF validation fails:
  → Try checkpoint immediately prior (step back one)
  → IF second also fails: route to cold-start-recovery

IF validation passes with warnings (DEGRADED):
  → Note warnings, inject into agent context
  → Proceed with caution flag
```

### STEP 03: Load State from Checkpoint

```
READ: checkpoint.yaml → restore:
  workflow_status, current_step, step_statuses, gate_verdicts,
  parallel_track states, retry_counts, escalation_ids

READ: decisions.yaml → restore:
  All settled decisions, active constraints, rejected approaches, open questions

READ: artifact-manifest.yaml → verify:
  Spot-check top 3 most-recently-produced artifacts
```

### STEP 04: Check for Interrupted Step

```
IF checkpoint.current_step_status == "IN_PROGRESS":
  → There was a step in progress when checkpoint was created
  
  CHECK: Does a runtime snapshot exist for that step?
  IF yes → route to interruption-recovery.md
  IF no  → step will be re-executed from the prior gate-pass checkpoint
```

### STEP 05: Staleness Assessment (RS-05 only)

For long-gap resumptions (checkpoint age > 24 hours):

```
STALENESS CHECKS:
  
  Competitive intelligence data:
    IF any competitive_signals in execution-memory have age > 7 days:
      → Flag: "Competitive data may be stale — consider refreshing before step [N]"
  
  Market data:
    IF any market intelligence has age > 30 days:
      → Flag: "Market data may be stale — validate before synthesis step"
  
  Technical specifications:
    IF any technical context has age > 90 days:
      → Flag: "Technical specs may have changed — verify before architecture step"
  
  Pending escalations:
    IF any escalation was pending at checkpoint time:
      → CHECK: Has human response been provided?
      → IF yes: load response, apply to workflow state
      → IF no: re-surface escalation as URGENT (blocking)
  
  External dependencies:
    IF workflow depends on external system outputs (API responses, tickets, etc.):
      → Verify these are still valid
```

### STEP 06: Build Resume Context

Assemble the context package for the resuming agent:

```
LAYER 1: Agent identity (from agent definition)
LAYER 2: Continuation frame (from checkpoint or phase snapshot)
LAYER 3: Step inputs
  - For RS-01/02 (before next step started): all inputs for next_step
  - For RS-05 (stale): inputs + staleness warnings
LAYER 4: Decision memory
  - All FINAL settled decisions from checkpoint decisions.yaml
  - SOFT decisions (summarized)
LAYER 5: Upstream artifacts
  - Paths to all GATE_PASSED artifacts
  - Most recent 2 artifacts inline (first 1000 chars each)
LAYER 6: Governance
  - Active constraints
  - Any staleness warnings from Step 05

TOTAL BUDGET TARGET: < 8000 tokens for resume context
```

### STEP 07: Resume Frame Construction

```
WARM RESUME — [workflow-id]
═══════════════════════════════════════════════════════════
Resuming from checkpoint: [checkpoint-id]
  Type: [phase_boundary | gate_pass]
  Created: [N] minutes ago
  Integrity: [VALID | DEGRADED (with notes)]

WORKFLOW STATE AT CHECKPOINT:
  Steps complete: [N of M]
  Last completed: [step-name] — artifact: [path]
  Resuming at: [next_step_name]
  Phase: [current phase]

CONFIRMED ARTIFACTS (all GATE_PASSED):
  • [step-name]: [artifact path] ✓
  • [step-name]: [artifact path] ✓

SETTLED DECISIONS (do not revisit):
  • [decision 1] (FINAL)
  • [decision 2] (SOFT)

DO NOT PROPOSE AGAIN:
  • [rejected approach] — reason: [brief reason]

[IF STALE — RS-05:]
STALENESS WARNINGS:
  ⚠ [data type] data may be stale — validate before using
  ⚠ [escalation] pending human response — re-surfacing now

YOUR TASK:
  Execute: [next_step_name]
  Input: [artifact at path]
  Output: [expected artifact name] at [expected path]
  Gate: [gate type and criteria]
═══════════════════════════════════════════════════════════
```

### STEP 08: Update Registry and Ledger

```
LOG to execution-ledger.jsonl:
{
  "event_type": "workflow_resumed",
  "workflow_id": "[id]",
  "resume_step": "[step-id]",
  "timestamp": "[ISO-8601]",
  "session_id": "[session]",
  "resume_type": "warm_resume",
  "checkpoint_loaded": "[checkpoint-id]",
  "recovery_state": "RS-01 | RS-02 | RS-05"
}

UPDATE execution-registry: status = RUNNING, current_step = next_step
UPDATE work-queue: mark previous step COMPLETE, next step IN_PROGRESS
```

---

## Warm Resume Variants

### Phase Boundary Warm Resume (RS-01)

The simplest case. Use phase snapshot if available:

```
ADDITIONAL STEPS after STEP 03:
  3a. IF phase snapshot exists for this checkpoint:
        Load continuation-frame.yaml from phase snapshot
        Verify next_step_input_hash matches current inputs
        Use pre-built handoff_context as resume frame (skip STEP 07 construction)
```

### Gate-Pass Warm Resume (RS-02)

Slightly more work — no pre-built continuation frame:

```
ADDITIONAL STEPS after STEP 03:
  3a. Identify next_step from workflow definition
  3b. Identify all inputs for next_step (from step definition + artifacts)
  3c. Build continuation frame (STEP 07 standard protocol)
```

### Long-Gap Warm Resume (RS-05)

Add staleness processing:

```
ADDITIONAL STEPS: STEP 05 (staleness checks) is mandatory, not optional
ADDITIONAL CONTEXT: Staleness warnings injected in LAYER 6
ADDITIONAL ACTION: Re-surface any pending escalations
```

---

## Warm Resume Failure Modes

| Failure | Action |
|---------|--------|
| Checkpoint integrity check fails | Try prior checkpoint |
| Artifact checksum mismatch | Flag artifact as suspect, continue with warning |
| Next step not found in workflow definition | Route to cold-start (workflow definition mismatch) |
| Staleness check reveals critical expired data | Pause workflow, surface to operator |
| Decision conflict detected in checkpoint | Route to rollback-engine |

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (RS-01, RS-02, RS-05)
**Reads from:**
- `workflow-checkpoints/checkpoint-registry.md` → checkpoint selection
- `workflow-checkpoints/checkpoint-engine.md` → checkpoint validation
- `workflow-checkpoints/phase-snapshots.md` → phase snapshot content
- `execution-persistence/artifact-registry.md` → artifact verification
- `execution-persistence/execution-memory.md` → decision state

**Writes to:**
- `memory/execution-ledger.jsonl` → resumption event
- `continuation-systems/execution-registry.md` → status update
- `execution-persistence/work-queue.md` → queue updates

**Triggers on completion:**
- `continuation-systems/workflow-continuator.md` → with resume context
