# Rollback Engine

**System ID:** `rollback-engine`
**Role:** Returns a workflow to the last known stable state when the current state is unrecoverable — controlled rollback with minimum work loss
**Handles:** F5 (Checkpoint Corrupt), F6 (Decision Conflict requiring rollback), unrecoverable state after other recovery attempts

---

## Purpose

Sometimes the correct recovery action is to go backwards, not forwards. When a workflow has accumulated contradictory decisions, or when the current state is too corrupted to restore from, the Rollback Engine finds the last verifiably stable state and returns the workflow to that point.

**Core principle:** A controlled rollback to a stable state is always better than forward-execution from a corrupt state. Better to redo one step than to ship bad output built on bad state.

---

## Rollback Decision Criteria

Only roll back when:

| Condition | Rollback? |
|-----------|----------|
| Checkpoint corrupt, no prior checkpoint | YES — must go to last artifact-verified state |
| Decision conflict (FINAL overridden) | YES — must roll back to pre-conflict state |
| Artifact corrupt or unreadable | YES — roll back to step before artifact was produced |
| Gate verdict inconsistency (same artifact, different verdicts) | YES — roll back to last clean gate pass |
| Multiple F-class failures accumulate | YES — stabilize before attempting recovery |
| Single stall or gate failure | NO — use workflow-restorer instead |
| Partial artifact | NO — workflow-restorer handles this |
| Missing artifact (re-executable step) | NO — state-reconstructor handles this |

**The rollback engine is the last resort** — use only when simpler recovery fails.

---

## Rollback Target Selection

### Method 01: Latest Clean Checkpoint

```
SEARCH checkpoint-registry.md for workflow
ORDER BY timestamp DESC
FOR each checkpoint (newest first):
  IF checkpoint.integrity == VALID
  AND checkpoint.gate_status_at_snapshot == ALL_PASSED:
    → This is the rollback target
    → BREAK
```

**Preferred method.** Most of the time, there is a clean checkpoint within 1-3 steps of the corrupted state.

### Method 02: Last Gate-Passed Artifact

If no clean checkpoint is found:

```
FOR each step N from current step, counting backwards:
  IF artifact exists at step N's expected path
  AND execution_ledger contains gate_pass event for step N:
    → Step N is the last verified complete step
    → Rollback target = step N (workflow resumes at step N+1)
    → BREAK
```

### Method 03: Cold Start Point

If neither checkpoint nor gate event found:

```
→ Rollback target = step 0 (beginning)
→ Defer to cold-start-recovery.md
→ Reconstruct state from artifacts that exist
→ If no artifacts: full restart
```

---

## Rollback Execution Protocol

### STEP 01: Identify Rollback Target

Select rollback target using Method 01, 02, or 03 above.

```
Rollback target:
  step: [step-id]
  basis: [checkpoint | gate_event | cold_start]
  timestamp: [timestamp of last verified state]
  artifact: [path, if applicable]
  confidence: [HIGH | MEDIUM | LOW]
```

### STEP 02: Assess Work Loss

Before executing rollback, calculate and log work loss:

```
WORK LOSS ASSESSMENT
════════════════════
Rolling back to: Step [N] (timestamp [T])

Steps completed AFTER rollback target that will be lost:
  - Step [N+1]: [artifact path] — will be DISCARDED
  - Step [N+2]: [artifact path] — will be DISCARDED

Work-hours estimated lost: [estimate]

Steps that CAN be recovered (reproducible):
  - Step [N+1]: Yes (deterministic, same inputs available)
  - Step [N+2]: Partially (human annotation will need re-entry)

Commit to rollback? [This is logged for audit trail]
```

### STEP 03: Isolate Rolled-Back Artifacts

Do NOT delete artifacts from steps that will be rolled back. Instead:

1. Move them to `memory/rollback-archive/[workflow-id]/[timestamp]/`
2. Remove from execution registry artifact list
3. Add `[ROLLED-BACK]` prefix to filenames in archive
4. These are preserved for investigation; not used in resumed execution

```
mv artifacts/step-N+1-output.md → memory/rollback-archive/[id]/step-N+1-output.md
mv artifacts/step-N+2-output.md → memory/rollback-archive/[id]/step-N+2-output.md
```

### STEP 04: Restore State to Rollback Target

**For checkpoint-based rollback:**
```
Load checkpoint: [checkpoint-id]
Restore:
  - workflow status from checkpoint
  - settled decisions from checkpoint (clear decisions made after)
  - artifact paths from checkpoint (clear paths registered after)
  - current_step = checkpoint.step
Write clean state file from checkpoint data
```

**For gate-event-based rollback:**
```
Load execution ledger entries up to gate_pass at step N
Reconstruct:
  - workflow status: step N COMPLETE, step N+1 NOT_STARTED
  - settled decisions: all decisions from ledger entries up to step N
  - artifact paths: only paths registered at or before step N
  - current_step = step N+1
Write clean state file from ledger data
```

### STEP 05: Clear Contaminated State

After establishing rollback target state:

1. Remove all decisions made after rollback target from settled_decision_registry
2. Remove all checkpoint references newer than rollback target
3. Clear any pending routing decisions that depended on rolled-back steps
4. Update execution registry: reset status to RUNNING at rollback target

### STEP 06: Log Rollback

```json
{
  "event_type": "rollback_executed",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "rollback_target": {
    "step": "[step-id]",
    "basis": "[checkpoint | gate_event | cold_start]",
    "checkpoint_id": "[id or null]"
  },
  "steps_rolled_back": ["[step-id-N+1]", "[step-id-N+2]"],
  "artifacts_archived": ["[paths]"],
  "decisions_cleared": [N],
  "work_loss_estimated": "[estimate]",
  "rollback_reason": "[root cause]",
  "initiated_by": "rollback-engine",
  "requested_by": "[calling system]"
}
```

### STEP 07: Trigger Recovery

After rollback completes:

1. Hand off to `continuation-systems/workflow-continuator.md`
2. Resume at step N+1 (the first step after rollback target)
3. Address the root cause of the rollback before re-executing:
   - Decision conflict: inject the correct settled decision as HARD CONSTRAINT
   - Checkpoint corrupt: fix the checkpoint writer before producing next checkpoint
   - Unrecoverable state: add validation check at the failing step's gate

---

## Rollback Depth Limits

Prevent infinite rollback loops:

| Scenario | Max Rollback Depth |
|----------|--------------------|
| Single rollback attempt | Up to 3 steps back |
| Second rollback on same workflow | Up to 5 steps back |
| Third rollback on same workflow | Escalate — something structural is wrong |

After 3 rollback attempts on the same workflow:
→ Halt rollback
→ Escalate to human with full rollback history
→ Report: "This workflow has rolled back 3 times. Manual investigation required."

---

## Selective Rollback

Sometimes only part of a parallel workflow needs rollback:

```
Parallel tracks:
  Track A: COMPLETE — clean state — DO NOT rollback
  Track B: CORRUPT — needs rollback to step N of track B

Selective rollback:
  → Roll back Track B to its last clean checkpoint
  → Leave Track A completely untouched
  → Update join_at condition: Track A still counts as complete
  → Resume Track B from rollback target
```

---

## Rollback Archive

All rolled-back artifacts are preserved — never deleted:

```
memory/rollback-archive/
  [workflow-id]/
    [YYYY-MM-DD-HHMMSS]/
      rollback-report.md       ← why this rollback happened
      step-[N+1]-[artifact].md ← archived artifacts
      step-[N+2]-[artifact].md
      decisions-cleared.yaml   ← decisions that were removed
```

This archive enables:
- Post-mortem investigation of what went wrong
- Recovery of accidentally rolled-back good work (if rollback was a mistake)
- Pattern analysis to prevent similar failures

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (after simpler recovery fails)
**Reads from:**
- `workflow-checkpoints/checkpoint-registry.md`
- `execution-persistence/execution-ledger.md`
- `execution-persistence/execution-memory.md`
- All artifact paths

**Writes to:**
- `memory/workflow-state/[id].yaml` → rolled-back clean state
- `memory/rollback-archive/` → archived rolled-back artifacts
- `execution-persistence/execution-ledger.md` → rollback event
- `execution-persistence/execution-registry.md` → status update

**Triggers on completion:**
- `continuation-systems/workflow-continuator.md` → resume from rollback target
