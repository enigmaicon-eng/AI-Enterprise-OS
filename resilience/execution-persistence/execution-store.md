# Execution Store

**System ID:** `execution-store`
**Role:** Persistent key-value store for all execution state — the durable backing store that outlasts any context window or session
**Storage:** `memory/execution-store/` directory (JSONL files by domain)

---

## Purpose

The Execution Store is the lowest-level persistence layer. All other systems — the execution registry, checkpoint engine, execution ledger — write to this store. It provides durability guarantees: everything written here survives session ends, context resets, and system restarts.

It is not a cache. It is not optimized for speed. It is optimized for correctness and recoverability.

---

## Store Organization

```
memory/execution-store/
  workflow-states.jsonl        ← canonical workflow state records
  step-states.jsonl            ← per-step state records
  artifact-registry.jsonl      ← artifact existence and metadata
  decision-log.jsonl           ← all decisions, chronologically
  gate-verdicts.jsonl          ← all gate check results
  agent-invocations.jsonl      ← record of every agent invocation
  checkpoint-index.jsonl       ← index of all checkpoint files
  session-manifest.jsonl       ← all sessions that contributed to each workflow
  delegation-log.jsonl         ← all delegation records
  escalation-log.jsonl         ← all escalation records
  rollback-log.jsonl           ← all rollback events
```

---

## Store Schema

### workflow-states.jsonl
One record per workflow state transition:

```json
{
  "record_type": "workflow_state",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "from_status": "RUNNING",
  "to_status": "SUSPENDED",
  "session_id": "[session]",
  "triggered_by": "[agent or system]",
  "notes": "[optional context]"
}
```

### step-states.jsonl
One record per step state transition:

```json
{
  "record_type": "step_state",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "from_status": "IN_PROGRESS",
  "to_status": "COMPLETE",
  "agent": "[agent-id]",
  "artifact_path": "[path]",
  "gate_verdict": "PASS",
  "duration_seconds": [N]
}
```

### artifact-registry.jsonl
One record per artifact creation or update:

```json
{
  "record_type": "artifact",
  "artifact_id": "art-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "name": "[artifact name]",
  "path": "[file path]",
  "schema": "[template-name]",
  "created_at": "[ISO-8601]",
  "modified_at": "[ISO-8601]",
  "gate_status": "PASSED",
  "size_bytes": [N],
  "checksum": "sha256:[hash]",
  "produced_by": "[agent-id]"
}
```

### decision-log.jsonl
Every decision made by any agent in any workflow:

```json
{
  "record_type": "decision",
  "decision_id": "dec-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "decision": "[what was decided]",
  "rationale": "[why — one sentence]",
  "alternatives_rejected": ["[alt A]", "[alt B]"],
  "made_by": "[agent-id]",
  "finality": "FINAL | SOFT",
  "expires": "[date or null]",
  "reversed_by": null
}
```

### gate-verdicts.jsonl
Every gate check result:

```json
{
  "record_type": "gate_verdict",
  "verdict_id": "gv-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "gate_type": "checklist | schema | agent-review | human-review",
  "artifact_path": "[path]",
  "artifact_checksum": "sha256:[hash]",
  "verdict": "PASS | FAIL",
  "criteria_results": [
    {"criterion": "[text]", "result": "PASS | FAIL", "notes": "[optional]"}
  ],
  "reviewer": "[agent or human]",
  "retry_number": 0
}
```

### agent-invocations.jsonl
Every agent invocation record:

```json
{
  "record_type": "agent_invocation",
  "invocation_id": "inv-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "agent_id": "[agent-id]",
  "invocation_type": "FRESH | RESUME | RETRY",
  "input_hash": "sha256:[hash]",
  "context_tokens_estimated": [N],
  "completed_at": "[ISO-8601]",
  "output_artifact": "[path]",
  "success": true,
  "session_id": "[session]"
}
```

---

## Store Operations

### Append Record
All writes are append-only. Never modify or delete records.

```
WRITE: Append JSON line to appropriate JSONL file
GUARANTEE: Write is atomic (write to temp file, rename)
```

### Read by Workflow ID
```
READ: Scan JSONL file for records WHERE workflow_id = [id]
RETURN: All matching records in timestamp order
```

### Read by Step ID
```
READ: Scan JSONL file for records WHERE step_id = [id]
RETURN: Full history for that step
```

### Read Latest State
```
READ: Scan workflow-states.jsonl WHERE workflow_id = [id]
RETURN: Record with latest timestamp = current canonical state
```

### Derive Workflow State
```
From step-states.jsonl:
  Get all step records for workflow_id
  Group by step_id
  For each step: latest record = current step state
  Synthesize workflow state from all step states
```

---

## Durability Guarantees

1. **Append-only:** No record is ever modified or deleted
2. **Atomic writes:** Every write goes to a temp file first, then renamed (prevents partial writes)
3. **Redundancy:** Critical records (gate verdicts, decisions) are written to both their primary file AND `execution-persistence/execution-ledger.md`
4. **Checksums:** Artifact registry includes SHA-256 checksums of every artifact (enables corruption detection)
5. **Timestamps:** All records include ISO-8601 timestamps (enables chronological reconstruction)

---

## Store Maintenance

### Monthly Archive
Move records older than 90 days to `memory/execution-store/archive/[YYYY-MM]/`
Completed workflow records: move at completion + 30 days
Failed workflow records: keep in primary store for 180 days (investigation window)

### Compaction
When any JSONL file exceeds 10MB:
1. Read all records
2. Deduplicate: keep only the latest state record per workflow_id (for state files)
3. Archive original to `archive/`
4. Write compacted version

Decision log and gate verdicts are NEVER compacted (full audit trail).

---

## Integration

**Written to by:**
- `execution-persistence/execution-ledger.md` → all execution events
- `workflow-checkpoints/checkpoint-engine.md` → checkpoint index entries
- `continuation-systems/workflow-continuator.md` → step progression records
- `recovery-systems/*.md` → recovery events

**Read by:**
- `recovery-systems/state-reconstructor.md` → derives ground truth
- `continuation-systems/execution-registry.md` → populates registry
- `workflow-checkpoints/checkpoint-registry.md` → locates checkpoints
- All recovery systems → historical state evidence
