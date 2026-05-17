# Checkpoint Registry

**System ID:** `checkpoint-registry`
**Role:** Searchable index of all checkpoints across all workflows — the lookup layer that allows recovery systems to find the right checkpoint without scanning all checkpoint files
**Storage:** `memory/execution-store/checkpoint-index.jsonl` (primary) + `memory/checkpoint-registry.yaml` (fast lookup index)

---

## Purpose

The checkpoint engine creates checkpoints. The checkpoint registry makes them findable. Recovery systems need to answer questions like "what is the most recent valid phase snapshot for workflow X?" or "find the checkpoint immediately before step Y in workflow Z." Scanning all checkpoint directories to answer these questions would be slow and error-prone. The registry provides an indexed, queryable view.

---

## Registry Record Schema

One record per checkpoint in `memory/execution-store/checkpoint-index.jsonl`:

```json
{
  "record_type": "checkpoint_index",
  "checkpoint_id": "chk-[uuid]",
  "workflow_id": "[workflow-id]",
  "workflow_type": "[type]",
  "created_at": "[ISO-8601]",
  "session_id": "[session-id]",
  
  "checkpoint_type": "phase_boundary | gate_pass | session_limit | runtime | manual | pre_rollback | interval",
  
  "location": {
    "directory": "memory/checkpoints/[workflow-id]/[checkpoint-id]/",
    "primary_file": "checkpoint.yaml",
    "has_phase_snapshot": true,
    "has_runtime_snapshot": false,
    "has_artifact_manifest": true
  },
  
  "scope": {
    "current_step": "[step-id]",
    "current_step_status": "COMPLETE | IN_PROGRESS",
    "next_step": "[step-id or null]",
    "phase_number": 2,
    "phase_name": "[phase name]",
    "steps_complete": ["[step-ids]"],
    "gate_status_at_snapshot": "ALL_PASSED | SOME_PENDING | SOME_FAILED"
  },
  
  "integrity": {
    "status": "VALID | DEGRADED | INVALID | UNVERIFIED",
    "verified_at": "[ISO-8601 or null]",
    "artifact_count": 5,
    "artifacts_verified": 5,
    "artifacts_missing": 0
  },
  
  "rollback_usability": {
    "usable_as_rollback_target": true,
    "confidence": "HIGH | MEDIUM | LOW",
    "reason": "[why this is or is not a good rollback target]"
  },
  
  "superseded_by": null,
  "archived": false,
  "archived_at": null
}
```

---

## Fast Lookup Index

`memory/checkpoint-registry.yaml` — rebuilt from JSONL on cold start, updated synchronously on writes:

```yaml
checkpoint_registry:
  last_updated: "[ISO-8601]"
  total_checkpoints: 0
  
  # Per-workflow summary
  workflows:
    "[workflow-id]":
      checkpoint_count: 0
      
      # Precomputed "best" checkpoints for common queries
      latest_valid: "chk-[uuid]"
      latest_phase_boundary: "chk-[uuid]"
      latest_gate_pass: "chk-[uuid]"
      latest_runtime: "chk-[uuid]"
      
      # Ordered list of checkpoints (newest first)
      checkpoints:
        - checkpoint_id: "chk-[uuid]"
          created_at: "[ISO-8601]"
          type: "phase_boundary"
          step: "[step-id]"
          phase: 2
          integrity: "VALID"
          rollback_usable: true
```

---

## Registry Operations

### Register Checkpoint

Called by checkpoint-engine.md immediately after writing checkpoint files:

```
INPUT: checkpoint metadata from checkpoint-engine

WRITE to checkpoint-index.jsonl: append full registry record
UPDATE checkpoint-registry.yaml:
  1. Add to workflows.[workflow-id].checkpoints (prepend — newest first)
  2. Update precomputed "latest_valid", "latest_phase_boundary", etc.
  3. Prune old checkpoints beyond retention policy

LOG to execution-ledger.jsonl: event checkpoint_registered
```

### Find Latest Valid Checkpoint

Most common query — used by every recovery system:

```
INPUT: workflow_id

READ: checkpoint-registry.yaml → workflows.[workflow-id].latest_valid

IF not null:
  VERIFY: Does checkpoint still exist at registry.location.directory?
  IF yes: Return checkpoint metadata
  IF no: Rebuild latest_valid from checkpoint-index.jsonl

IF null (no valid checkpoint):
  Return null → caller falls back to cold-start-recovery
```

### Find Latest Phase Boundary

Used by rollback-engine.md as primary rollback target:

```
INPUT: workflow_id

READ: checkpoint-registry.yaml → workflows.[workflow-id].latest_phase_boundary
VERIFY: checkpoint_type == "phase_boundary" AND integrity == "VALID"
RETURN: checkpoint metadata or null
```

### Find Checkpoint Before Step

Used by rollback-engine.md for targeted rollback:

```
INPUT: workflow_id, target_step_id

SCAN: checkpoint-index.jsonl WHERE workflow_id = [id]
FILTER: scope.next_step <= target_step_id
  (checkpoint must be AT OR BEFORE the target step)
SORT: created_at DESC
RETURN: first result WHERE integrity != "INVALID"
```

### Find All Checkpoints for Workflow

Used by state-reconstructor.md for full recovery:

```
INPUT: workflow_id

SCAN: checkpoint-index.jsonl WHERE workflow_id = [id]
SORT: created_at ASC (chronological — for reconstruction)
RETURN: all records
```

### Validate All Checkpoints

Run at session start for active workflows:

```
FOR EACH workflow WHERE status IN ("RUNNING", "SUSPENDED", "BLOCKED"):
  FOR EACH checkpoint WHERE integrity == "UNVERIFIED":
    1. Read checkpoint directory (INTEGRITY.sha256)
    2. Recompute hash
    3. IF match: update integrity = "VALID", verified_at = now
    4. IF mismatch: update integrity = "INVALID"
    5. Update rollback_usability based on new integrity
  
  Update checkpoint-registry.yaml precomputed fields
```

---

## Checkpoint Search Patterns

### Recovery: What to resume from?

```
PRIORITY ORDER:
1. Latest runtime snapshot (if step was in progress)
2. Latest phase boundary (clean state)
3. Latest gate-pass checkpoint
4. Latest any valid checkpoint
5. → cold-start-recovery (if none found)
```

### Rollback: What to roll back to?

```
PRIORITY ORDER:
1. Latest phase boundary checkpoint (cleanest state)
2. Latest gate-pass checkpoint (known-good artifact state)
3. Latest valid checkpoint with gate_status_at_snapshot = "ALL_PASSED"
4. → cold-start-recovery (if none of above found)
```

### Diagnostics: What changed between checkpoints?

```
QUERY: Find two checkpoints (before event, after event)
COMPARE: scope.steps_complete (what was added)
COMPARE: integrity records (did anything degrade)
COMPARE: artifact manifests (what artifacts appeared or disappeared)
```

---

## Registry Integrity

The registry is a derived index — it can always be rebuilt from the source of truth:

```
REBUILD PROTOCOL (run if checkpoint-registry.yaml is missing or corrupt):
  1. Scan all directories under memory/checkpoints/
  2. For each checkpoint directory, read checkpoint.yaml
  3. Rebuild checkpoint-index.jsonl records
  4. Rebuild checkpoint-registry.yaml from JSONL
  5. Run Validate All Checkpoints
```

**Checkpoint-index.jsonl is append-only.** Registry record updates are expressed as new records with the same checkpoint_id (latest record wins for each checkpoint_id).

---

## Retention Enforcement

Run at session start to prune expired checkpoints:

```
FOR EACH checkpoint in checkpoint-index.jsonl:
  IF checkpoint.archived == true: skip
  IF checkpoint.checkpoint_type == "interval" AND age > 4 hours: archive
  IF checkpoint.checkpoint_type == "session_limit" AND age > 24 hours: archive
  IF checkpoint.checkpoint_type == "runtime" AND step is COMPLETE: archive
  IF checkpoint.checkpoint_type == "gate_pass" AND age > 7 days: archive
  IF checkpoint.checkpoint_type == "phase_boundary" AND age > 30 days: archive

ARCHIVE PROTOCOL:
  1. Move checkpoint directory to memory/checkpoint-archive/[workflow-id]/[checkpoint-id]/
  2. Update registry record: archived = true, archived_at = now
  3. Update checkpoint-registry.yaml: remove from workflow's active list
  4. Log to execution-ledger.jsonl
```

**Never delete checkpoints.** Archive only. The archive is queryable for forensics.

---

## Integration

**Written to by:**
- `workflow-checkpoints/checkpoint-engine.md` → registers new checkpoints
- `recovery-systems/rollback-engine.md` → updates integrity after rollback
- Retention enforcement (session start) → archives expired checkpoints

**Read by:**
- `recovery-systems/rollback-engine.md` → finds rollback target
- `recovery-systems/state-reconstructor.md` → finds all checkpoints for workflow
- `runtime-recovery/warm-resume.md` → finds latest valid checkpoint
- `runtime-recovery/cold-start-recovery.md` → finds oldest valid checkpoint
- `continuation-systems/workflow-continuator.md` → checks for recent checkpoint before resuming
- `recovery-systems/orchestration-resumption.md` → validates orchestrator state currency
