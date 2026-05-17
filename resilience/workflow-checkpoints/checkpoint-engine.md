# Checkpoint Engine

**System ID:** `checkpoint-engine`
**Role:** Creates, validates, and manages workflow checkpoints — durable state snapshots that enable resumption from any point without re-executing completed work
**Storage:** `memory/checkpoints/[workflow-id]/` (checkpoint files) + `memory/execution-store/checkpoint-index.jsonl` (registry)

---

## Purpose

A checkpoint is a verifiable snapshot of a workflow's complete execution state at a specific moment. It answers the question: "If everything disappeared right now, what is the minimum information needed to resume from this exact point?"

Checkpoints differ from state files in three ways:
1. **Immutable:** A checkpoint is never modified after creation — new state = new checkpoint
2. **Self-contained:** A checkpoint includes everything needed to resume, not pointers to live state
3. **Verified:** A checkpoint includes checksums of all referenced artifacts so integrity can be confirmed before trusting the snapshot

---

## Checkpoint Trigger Events

A checkpoint is written automatically when:

| Trigger | When | Priority |
|---------|------|----------|
| Phase boundary | Any step transitions from COMPLETE to the next step starting | HIGH |
| Gate pass | Any artifact receives a gate PASS verdict | HIGH |
| Session approaching limit | Context budget exceeds 70% | CRITICAL |
| Manual trigger | Orchestrator or operator explicitly requests | HIGH |
| Long step interval | Step has been running > 30 minutes without a checkpoint | MEDIUM |
| Pre-rollback | Immediately before any rollback operation | CRITICAL |

**Checkpoint frequency target:** At minimum one checkpoint per gate pass. For multi-hour workflows, aim for one checkpoint per 20-30 minutes of elapsed execution.

---

## Checkpoint Structure

Each checkpoint is stored as a directory:

```
memory/checkpoints/[workflow-id]/
  [checkpoint-id]/
    checkpoint.yaml      ← checkpoint metadata and state snapshot
    artifact-manifest.yaml ← checksums of all artifacts at this point
    decisions.yaml       ← all settled decisions at this point
    constraints.yaml     ← all active constraints at this point
    INTEGRITY.sha256     ← SHA-256 of all files in this checkpoint directory
```

### checkpoint.yaml Schema

```yaml
checkpoint_id: "chk-[uuid]"
workflow_id: "[workflow-id]"
workflow_type: "[type]"

# When and why
created_at: "[ISO-8601]"
trigger: "phase_boundary | gate_pass | session_limit | manual | interval | pre_rollback"
session_id: "[session-id]"
created_by: "[checkpoint-engine | deterministic-executor | manual]"

# Where the workflow is
current_step: "[step-id]"
current_step_status: "NOT_STARTED | IN_PROGRESS | COMPLETE"
next_step: "[step-id or null]"
phase: "[phase name or number]"

# Complete step status at checkpoint time
step_statuses:
  "[step-id]": "NOT_STARTED | IN_PROGRESS | COMPLETE | FAILED | SKIPPED"

# Workflow-level status
workflow_status: "RUNNING | SUSPENDED | BLOCKED | ESCALATED"
priority: "[priority]"
started_at: "[ISO-8601]"
elapsed_seconds: 0

# Gate verdicts at this point
gate_verdicts:
  "[step-id]": "PASS | FAIL | PENDING | NOT_REACHED"

# Artifact state at this point (full checksums in artifact-manifest.yaml)
artifact_count: 0
all_gate_passed: true

# Parallel track state (if applicable)
parallel_tracks:
  - track_id: "[id]"
    track_status: "RUNNING | COMPLETE | BLOCKED"
    current_step: "[step-id]"
    steps_complete: ["[step-ids]"]

# Retry and recovery state
retry_counts:
  "[step-id]": 0
escalation_ids: []
rollback_count: 0

# Context state at checkpoint time
context_tokens_estimated: 0
session_bridge_id: "[session-bridge-id or null]"

# Integrity
integrity: "VALID | INVALID | UNVERIFIED"
integrity_verified_at: "[ISO-8601 or null]"
integrity_hash: "sha256:[hash of checkpoint directory]"
```

### artifact-manifest.yaml Schema

```yaml
manifest_at: "[ISO-8601]"
checkpoint_id: "chk-[uuid]"

artifacts:
  - artifact_id: "art-[uuid]"
    step_id: "[step-id]"
    name: "[artifact name]"
    path: "[path]"
    status: "GATE_PASSED | GATE_PENDING | PRODUCED"
    checksum: "sha256:[hash]"
    size_bytes: 0
    verified: true
```

---

## Checkpoint Creation Protocol

### STEP 01: Assess Trigger

```
IF trigger == "session_limit":
  PRIORITY = CRITICAL — proceed immediately
ELSE IF trigger == "pre_rollback":
  PRIORITY = CRITICAL — proceed immediately
ELSE:
  Verify no checkpoint was created in the last 5 minutes for this workflow
  (Prevents duplicate checkpoints from rapid gate passes)
```

### STEP 02: Snapshot Workflow State

```
READ: memory/workflow-state/[workflow-id].yaml
READ: execution-registry for this workflow (step statuses, gate verdicts)
READ: execution-memory for this workflow (decisions, constraints)
COMPUTE: current step status, parallel track status (if applicable)
```

### STEP 03: Build Artifact Manifest

```
FOR EACH step that is COMPLETE or IN_PROGRESS:
  1. Look up artifact in artifact-registry
  2. IF artifact exists:
     a. Read file at artifact.path
     b. Compute SHA-256 checksum
     c. Compare to registered checksum (mismatch = flag but continue)
     d. Add to manifest with verified status
  3. IF artifact missing but should exist (GATE_PASSED step):
     → Flag as missing in manifest
     → Set manifest integrity to DEGRADED
```

### STEP 04: Extract Decision State

```
READ: memory/execution-memory/[workflow-id]-memory.yaml

WRITE to decisions.yaml:
  - All FINAL settled decisions
  - All SOFT settled decisions
  - All active constraints (MUST/MUST_NOT)
  - All rejected approaches
  
EXCLUDE (for brevity):
  - Answered open questions (retain only unanswered)
  - Expired context items
```

### STEP 05: Write Checkpoint Files

```
1. Create directory: memory/checkpoints/[workflow-id]/[checkpoint-id]/
2. Write checkpoint.yaml (from Step 02)
3. Write artifact-manifest.yaml (from Step 03)
4. Write decisions.yaml (from Step 04)
5. Write constraints.yaml (active constraints subset from decisions.yaml)
6. Compute SHA-256 of all four files concatenated → write INTEGRITY.sha256
```

### STEP 06: Register Checkpoint

```
APPEND to memory/execution-store/checkpoint-index.jsonl:
{
  "record_type": "checkpoint",
  "checkpoint_id": "chk-[uuid]",
  "workflow_id": "[id]",
  "created_at": "[ISO-8601]",
  "trigger": "[trigger]",
  "current_step": "[step-id]",
  "integrity": "VALID",
  "path": "memory/checkpoints/[workflow-id]/[checkpoint-id]/"
}

UPDATE memory/artifact-index.yaml → add checkpoint entry
LOG to execution-ledger.jsonl → event: checkpoint_written
```

---

## Checkpoint Validation Protocol

Run before using any checkpoint for recovery or rollback:

```
STEP 01: Read INTEGRITY.sha256
STEP 02: Re-compute SHA-256 of all checkpoint files
STEP 03: IF hash mismatch → mark checkpoint INVALID, try older checkpoint
STEP 04: Parse checkpoint.yaml — verify all required fields present
STEP 05: For each artifact in artifact-manifest.yaml:
  - Verify file exists at artifact.path
  - Re-compute SHA-256 checksum
  - Compare to manifest checksum
  IF mismatches > 20% of artifacts: mark checkpoint DEGRADED
  IF mismatches > 50% of artifacts: mark checkpoint INVALID
STEP 06: Verify decisions.yaml is parseable and internally consistent
STEP 07: Return validation result:
  VALID: All checks passed — checkpoint is trustworthy
  DEGRADED: Some artifacts corrupt but core state intact — usable with warnings
  INVALID: Core checkpoint data corrupt — do not use
```

---

## Checkpoint Retention Policy

| Trigger Type | Retention |
|-------------|-----------|
| Pre-rollback | Forever (in rollback-archive) |
| Phase boundary (most recent 3) | Until workflow completes + 30 days |
| Phase boundary (older) | 7 days |
| Gate pass (most recent 5) | 7 days |
| Session limit | 24 hours |
| Manual | Until explicitly deleted |
| Interval | 4 hours |

**Maximum checkpoints per workflow:** 20 active (oldest are pruned after retention expires). Phase-boundary checkpoints always survive — interval/session checkpoints are first to be pruned.

---

## Checkpoint Index Queries

### Find Latest Valid Checkpoint
```
SCAN: checkpoint-index.jsonl WHERE workflow_id = [id] AND integrity != "INVALID"
SORT: created_at DESC
RETURN: first result (latest valid checkpoint)
```

### Find Latest Phase-Boundary Checkpoint
```
SCAN: checkpoint-index.jsonl WHERE workflow_id = [id]
AND trigger = "phase_boundary" AND integrity != "INVALID"
SORT: created_at DESC LIMIT 1
```

### Find Checkpoint at or Before Step
```
SCAN: checkpoint-index.jsonl WHERE workflow_id = [id]
AND current_step <= [target-step-id]
SORT: created_at DESC LIMIT 1
```

---

## Integration

**Called by:**
- `continuation-systems/deterministic-executor.md` → after each gate pass
- `continuation-systems/session-bridger.md` → at session boundary
- `recovery-systems/rollback-engine.md` → pre-rollback checkpoint

**Reads from:**
- `memory/workflow-state/[workflow-id].yaml`
- `continuation-systems/execution-registry.md`
- `execution-persistence/execution-memory.md`
- `execution-persistence/artifact-registry.md`

**Writes to:**
- `memory/checkpoints/[workflow-id]/[checkpoint-id]/` → checkpoint files
- `memory/execution-store/checkpoint-index.jsonl` → checkpoint registry
- `execution-persistence/execution-ledger.md` → checkpoint events

**Read by:**
- `workflow-checkpoints/checkpoint-registry.md` → checkpoint lookup
- `recovery-systems/rollback-engine.md` → rollback target selection
- `runtime-recovery/warm-resume.md` → load recent checkpoint
- `runtime-recovery/cold-start-recovery.md` → load oldest valid checkpoint
