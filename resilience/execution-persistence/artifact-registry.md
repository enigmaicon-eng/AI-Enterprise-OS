# Artifact Registry

**System ID:** `artifact-registry`
**Role:** Canonical registry of every artifact produced by every workflow — tracks existence, state, checksums, lineage, and consumption so that any agent can discover what has been produced and whether it is valid
**Storage:** `memory/execution-store/artifact-registry.jsonl` (primary) + `memory/artifact-index.yaml` (fast lookup index)

---

## Purpose

Artifacts are the handoff currency of the system. A step's output is an artifact. A gate's subject is an artifact. A continuation's starting point is an artifact. The artifact registry ensures no artifact is lost, double-produced, or consumed from a corrupt state.

The registry answers four questions:
1. **Does this artifact exist?** (existence check before re-executing a step)
2. **Is this artifact valid?** (checksum + gate status before consuming)
3. **Where did this artifact come from?** (lineage for debugging and rollback)
4. **What depends on this artifact?** (impact analysis for rollback scope)

---

## Artifact Record Schema

Every artifact is registered with the following schema:

```json
{
  "artifact_id": "art-[uuid]",
  "workflow_id": "[workflow-id]",
  "step_id": "[step-id]",
  "session_id": "[session-id]",
  "name": "[human-readable artifact name]",
  "path": "[absolute or relative path]",
  "alternate_paths": [],
  
  "artifact_type": "document | data | config | report | checkpoint | index | log",
  "template": "[template-name or null]",
  "schema_version": "[version]",
  
  "status": "PRODUCING | PRODUCED | GATE_PENDING | GATE_PASSED | GATE_FAILED | CONSUMED | ARCHIVED | ROLLED_BACK",
  
  "created_at": "[ISO-8601]",
  "modified_at": "[ISO-8601]",
  "gate_passed_at": "[ISO-8601 or null]",
  "consumed_at": "[ISO-8601 or null]",
  
  "size_bytes": 0,
  "checksum": "sha256:[hash]",
  "checksum_verified_at": "[ISO-8601]",
  
  "produced_by": "[agent-id]",
  "gate_reviewed_by": "[agent-id or human or null]",
  "consumed_by": "[step-id or null]",
  
  "lineage": {
    "upstream_artifacts": ["[art-id-1]", "[art-id-2]"],
    "upstream_steps": ["[step-id-1]"],
    "derived_from": "[art-id or null — for artifacts derived from prior artifacts]"
  },
  
  "dependents": {
    "consumed_by_steps": ["[step-id]"],
    "cited_by_artifacts": ["[art-id]"]
  },
  
  "gate_history": [
    {
      "verdict": "PASS | FAIL",
      "reviewer": "[agent or human]",
      "timestamp": "[ISO-8601]",
      "retry_number": 0,
      "failure_criteria": []
    }
  ],
  
  "rollback_info": {
    "rolled_back": false,
    "rolled_back_at": null,
    "archive_path": null
  },
  
  "notes": "[optional context]"
}
```

---

## Artifact Status Lifecycle

```
PRODUCING → PRODUCED → GATE_PENDING → GATE_PASSED → CONSUMED
                                    ↓
                               GATE_FAILED → [retry] → GATE_PENDING
                                          → [rollback] → ROLLED_BACK
```

| Status | Meaning | Next States |
|--------|---------|-------------|
| `PRODUCING` | Agent is currently writing this artifact | `PRODUCED`, `ROLLED_BACK` |
| `PRODUCED` | Artifact file exists, not yet gate-checked | `GATE_PENDING`, `GATE_FAILED` |
| `GATE_PENDING` | Submitted for gate review | `GATE_PASSED`, `GATE_FAILED` |
| `GATE_PASSED` | Gate approved — artifact is valid | `CONSUMED`, `ARCHIVED`, `ROLLED_BACK` |
| `GATE_FAILED` | Gate rejected — artifact is invalid | `GATE_PENDING` (retry), `ROLLED_BACK` |
| `CONSUMED` | A downstream step has consumed this artifact | terminal |
| `ARCHIVED` | Workflow complete — artifact moved to archive | terminal |
| `ROLLED_BACK` | Artifact was discarded in a rollback | terminal |

**Gate status gates consumption.** No downstream step may consume an artifact that has not reached `GATE_PASSED`. Any attempt to consume from `PRODUCED` or `GATE_PENDING` is a protocol violation and should be flagged.

---

## Fast Lookup Index

The full registry is JSONL (append-only, queryable by scan). For hot-path lookups, a YAML index is maintained at `memory/artifact-index.yaml`:

```yaml
# Fast lookup index — updated synchronously with registry writes
artifact_index:
  # Key: workflow_id + step_id
  "[workflow-id]:[step-id]":
    artifact_id: "art-[uuid]"
    path: "[path]"
    status: "GATE_PASSED"
    checksum: "sha256:[hash]"
    exists: true

# Reverse index: which workflows depend on each artifact
dependency_index:
  "art-[uuid]":
    consumed_by_steps: ["[step-id]"]
    workflow_ids: ["[workflow-id]"]
```

The index is rebuilt from the JSONL store on cold start. In normal operation, it is updated in-sync with every registry write.

---

## Registry Operations

### Register New Artifact

Called when a step begins producing an artifact:

```
INPUT: workflow_id, step_id, artifact_name, expected_path, agent_id, upstream_artifacts

WRITE:
  1. Generate artifact_id
  2. Set status = "PRODUCING"
  3. Append record to artifact-registry.jsonl
  4. Write entry to artifact-index.yaml
  5. Log to execution-ledger.jsonl (event: artifact_registered)

RETURN: artifact_id
```

### Mark Artifact Produced

Called when the agent completes writing the artifact file:

```
INPUT: artifact_id, actual_path, size_bytes

WRITE:
  1. Compute SHA-256 checksum of file at actual_path
  2. Append updated record with status = "PRODUCED", checksum, size_bytes
  3. Update artifact-index.yaml
  4. Log to execution-ledger.jsonl (event: artifact_produced)
```

### Record Gate Verdict

Called when a gate check completes:

```
INPUT: artifact_id, verdict (PASS|FAIL), reviewer, criteria_results, retry_number

WRITE:
  1. Append gate_verdict to gate_history
  2. Update status = "GATE_PASSED" or "GATE_FAILED"
  3. Update artifact-index.yaml
  4. Append to execution-store/gate-verdicts.jsonl
  5. Log to execution-ledger.jsonl (event: gate_pass or gate_fail)
```

### Existence Check

Fast check before re-executing a step:

```
INPUT: workflow_id, step_id

LOOKUP: artifact-index.yaml → "[workflow-id]:[step-id]"

IF entry exists AND entry.exists == true:
  IF entry.status == "GATE_PASSED":
    → Verify checksum (read file, compute hash, compare to entry.checksum)
    → IF checksums match: RETURN {exists: true, valid: true, artifact_id, path}
    → IF checksums mismatch: RETURN {exists: true, valid: false, reason: "checksum_mismatch"}
  ELSE:
    → RETURN {exists: true, valid: false, status: entry.status}
ELSE:
  → RETURN {exists: false}
```

### Mark Consumed

Called when a downstream step begins consuming an artifact:

```
INPUT: artifact_id, consuming_step_id

GUARD: artifact.status MUST be "GATE_PASSED" — reject if not

WRITE:
  1. Append record with status = "CONSUMED", consumed_by, consumed_at
  2. Update artifact-index.yaml
  3. Add consuming_step_id to dependents.consumed_by_steps
```

### Rollback Registration

Called by rollback-engine.md when rolling back artifacts:

```
INPUT: artifact_ids[], archive_path

FOR EACH artifact_id:
  1. Append record with status = "ROLLED_BACK"
  2. Set rollback_info.rolled_back = true, archive_path
  3. Update artifact-index.yaml (remove from active lookup)
  4. Log to execution-ledger.jsonl (event: artifact_rolled_back)
```

---

## Integrity Checks

Run at session start and before any rollback operation:

**Check 01: File Existence**
For every artifact with status `GATE_PASSED` or `CONSUMED`:
```
VERIFY: File exists at artifact.path
IF missing: Flag as ORPHAN — investigate before resuming
```

**Check 02: Checksum Validation**
For every artifact with status `GATE_PASSED` where `consumed_at` is null:
```
COMPUTE: SHA-256 of file at artifact.path
COMPARE: to artifact.checksum
IF mismatch: Flag as CORRUPTED — do not consume — escalate
```

**Check 03: Status Consistency**
```
No artifact may have status CONSUMED without consumed_by set
No artifact may have status GATE_PASSED without gate_passed_at set
No artifact may have status PRODUCING for more than 4 hours (stale PRODUCING = F1)
```

**Check 04: Lineage Consistency**
For each artifact's upstream_artifacts:
```
VERIFY: Each upstream artifact exists in registry
IF missing upstream: Log orphan lineage — recoverable but flag
```

---

## Artifact Search

### Find All Artifacts for a Workflow
```
SCAN: artifact-registry.jsonl WHERE workflow_id = [id]
RETURN: All records sorted by created_at ASC
```

### Find All Gate-Passed Artifacts
```
SCAN: artifact-registry.jsonl WHERE workflow_id = [id] AND status = "GATE_PASSED"
RETURN: Complete map of verified artifacts (by step_id)
```

### Find Dependents of an Artifact
```
LOOKUP: dependency_index["art-[uuid]"]
RETURN: consuming_steps and workflow_ids that depend on this artifact
```

### Find Artifacts Produced After Timestamp
```
SCAN: artifact-registry.jsonl WHERE created_at > [timestamp]
USE CASE: Rollback scope identification — what was produced after the rollback target?
```

---

## Artifact Archival

When a workflow reaches COMPLETE status:
1. All `GATE_PASSED` artifacts for that workflow → status = `ARCHIVED`
2. Move artifact files to `memory/archive/workflows/[workflow-id]/`
3. Preserve registry records (never delete — audit trail)
4. Update artifact-index.yaml to remove from active lookup

Archived artifacts are retained for 90 days (COMPLETE) or 180 days (FAILED) before permanent archival to cold storage.

---

## Integration

**Written to by:**
- `continuation-systems/deterministic-executor.md` → registers, updates status
- `recovery-systems/rollback-engine.md` → marks artifacts ROLLED_BACK
- `workflow-checkpoints/checkpoint-engine.md` → registers checkpoint artifacts
- All agents (via executor) → status transitions

**Read by:**
- `continuation-systems/workflow-continuator.md` → existence checks before resuming
- `recovery-systems/state-reconstructor.md` → derives workflow state from artifacts
- `recovery-systems/rollback-engine.md` → finds rollback target, scopes impact
- `runtime-recovery/cold-start-recovery.md` → inventories existing artifacts
