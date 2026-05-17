# Workflow Restorer

**System ID:** `workflow-restorer`
**Role:** Restores suspended and interrupted workflows to a valid, executable state — the operational recovery layer for SUSPENDED, BLOCKED, and GATE_FAIL states
**Handles:** F2 (Stalled), F3 (Gate Failure Unrecovered), F4 (Partial Parallel)

---

## Purpose

The Workflow Restorer takes a workflow in a broken or suspended state and returns it to a valid, executable state. It does not re-execute completed work, does not discard recoverable state, and does not escalate prematurely. Its mandate: restore the workflow to the last known good state and set up the next step for clean execution.

---

## Restoration Cases

### Case 01: SUSPENDED at Phase Boundary

**State:** Workflow suspended immediately after a step's gate passed. Step N is COMPLETE, step N+1 is NOT_STARTED.

**This is the ideal suspension point** — no recovery needed, just resumption.

**Action:**
1. Load handoff envelope from step N's completion record
2. Verify step N artifact at expected path
3. Verify step N gate_pass recorded in execution ledger
4. Invoke step N+1 agent with handoff envelope context
5. No state modification needed — state is already clean

**Confidence:** VERY HIGH

---

### Case 02: SUSPENDED Mid-Step (Partial Artifact)

**State:** Workflow suspended while step N's agent was executing. Partial artifact may exist at expected path.

**Action:**
```
STEP 01: Check for partial artifact
  → IF exists: open and assess completeness (is it < 50% complete? > 50%?)
  
  IF < 50% complete:
    Action: Discard partial, restart step N from beginning
    Reason: Restarting is safer than building on a partial that may be incoherent
  
  IF > 50% complete:
    Action: Inject partial artifact into agent context as "partial draft"
    Frame: "Continue from this draft — do not restart from scratch"
    Reason: Significant work is recoverable; continuation is faster and safer

STEP 02: Restore context for step N
  → Load inputs from step N-1 handoff
  → Load settled decisions from checkpoint
  → Inject continuation frame
  
STEP 03: Re-invoke agent
  → Agent continues from partial OR restarts (per Step 01 decision)
  
STEP 04: On completion: run gate, advance normally
```

---

### Case 03: SUSPENDED Mid-Step (No Artifact)

**State:** Workflow suspended while step N's agent was mid-thinking or mid-gathering, with nothing written to disk yet.

**Action:**
1. Load step N definition from workflow file
2. Load inputs from step N-1 handoff
3. Load settled decisions from checkpoint
4. Inject continuation frame indicating step N was started but not completed
5. Re-invoke step N agent from the beginning
6. Agent executes step N fresh (idempotent re-execution)

---

### Case 04: BLOCKED (Identified Blocker)

**State:** Step N could not proceed because a required input was missing or a dependency was unresolved. Blocker was recorded.

**Action:**
```
STEP 01: Load blocker description from state file

STEP 02: Check if blocker is resolved
  IF blocker.owner == HUMAN:
    → Check escalation queue for resolution
    → If human has responded: load response, proceed
    → If human has NOT responded: do not attempt to unblock artificially
      → Surface to operator: "[blocker description] — awaiting human input"
  
  IF blocker.owner == agent:
    → Check if the blocking artifact/dependency now exists
    → If yes: transition BLOCKED → RUNNING, proceed to step N
    → If no: investigate why the dependency wasn't produced
      → Find the step that should have produced it
      → Check that step's state → restore it if needed (recursive)

STEP 03: Resolve and advance
  → Update state file: BLOCKED → RUNNING
  → Log unblock event in execution ledger
  → Proceed to step N with now-available input
```

---

### Case 05: GATE_FAIL (Unrecovered)

**State:** Step N produced an artifact, gate was run, gate failed. Step was not retried or escalated.

**Action:**
```
STEP 01: Load gate failure record from execution ledger
  → Extract: which criteria failed, specific failure description

STEP 02: Load failed artifact
  → Read artifact at expected path
  → Assess: is the artifact substantively wrong, or just incomplete?
  
  IF mostly correct but missing criteria:
    Action: Inject artifact + gate failure criteria into agent context
    Frame: "Revise this artifact — specific failures: [criteria that failed]"
    Agent task: targeted revision, not full re-write
  
  IF fundamentally incorrect:
    Action: Discard artifact, restart step N
    Frame: Full step context, no reference to failed artifact
    Agent task: produce artifact from scratch

STEP 03: Load retry count
  IF retry_count < max_retries (2):
    → Invoke agent with appropriate frame (revise vs. restart)
    → Increment retry_count in state file
  
  IF retry_count >= max_retries:
    → Escalate to supervisor-agent (per execution-engine.md retry policy)
    → Do not retry further without supervisor involvement

STEP 04: On completion
  → Run gate check on new/revised artifact
  → If passes: mark step COMPLETE, advance
  → If fails again: increment retry_count, check max retries
```

**Gate failure context injection:**
```
REVISION REQUEST
════════════════
Prior attempt produced: [artifact path]
Gate result: FAILED

Criteria that failed:
  ✗ [Criterion 1 that failed — specific description]
  ✗ [Criterion 2 that failed — specific description]

Criteria that passed (do not regress):
  ✓ [Criterion A that passed]
  ✓ [Criterion B that passed]

TASK: Revise the artifact to pass the failing criteria.
Do not change content that already passes.
```

---

### Case 06: Partial Parallel Tracks

**State:** Parallel group has mixed track states — some COMPLETE, some not.

**Action:**
```
FOR each track in parallel_group:
  IF track.status == COMPLETE:
    → Verify artifact exists and gate passed
    → Mark as DO_NOT_TOUCH
  
  IF track.status == SUSPENDED:
    → Apply Case 01 or 02 restoration (phase boundary or mid-step)
    → Resume track independently
  
  IF track.status == FAILED:
    → Route to recovery-orchestrator.md for this specific track
  
  IF track.status == BLOCKED:
    → Apply Case 04 blocker resolution
    → Resume track when unblocked

WHEN all tracks reach COMPLETE:
  → Trigger join_at step
  → Advance workflow to post-parallel sequential steps
```

---

## Restoration State Transitions

After restoration, update state to reflect the clean state:

```
BEFORE restoration:                   AFTER restoration:
SUSPENDED                        →    RUNNING
BLOCKED (resolved blocker)       →    RUNNING
GATE_FAIL (ready for retry)     →    RUNNING (step back to IN_PROGRESS)
FAILED (recoverable)            →    RUNNING (from last clean checkpoint)
```

Write transition to execution ledger:
```json
{
  "event_type": "workflow_restored",
  "workflow_id": "[id]",
  "restoration_case": "[Case N]",
  "from_status": "SUSPENDED",
  "to_status": "RUNNING",
  "restore_point": "[step-id]",
  "timestamp": "[ISO-8601]",
  "restorer": "workflow-restorer"
}
```

---

## Restoration Confidence

After restoration, record confidence level:

| Case | Confidence | Reason |
|------|-----------|--------|
| Phase boundary | VERY HIGH | Clean state, no ambiguity |
| Mid-step (>50% artifact) | HIGH | Substantial recovery, some re-execution |
| Mid-step (<50% artifact) | MEDIUM | Re-execution required, prior work lost |
| No artifact | MEDIUM | Full re-execution; reproducible if deterministic |
| Gate failure retry | MEDIUM | Revision may not fix root issue |
| Parallel partial | VARIES | Depends on which tracks need recovery |
| Cold-start reconstruction | LOW | State may be approximate |

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md`
**Failure classes handled:** F2, F3, F4
**Delegates to:**
- `continuation-systems/workflow-continuator.md` → to resume restored workflow
- `recovery-systems/state-reconstructor.md` → when state file needs repair
- `recovery-systems/rollback-engine.md` → when restoration requires rollback first

**Writes to:**
- `memory/workflow-state/[id].yaml` → updated state
- `execution-persistence/execution-ledger.md` → restoration events
- `execution-persistence/execution-registry.md` → status update
