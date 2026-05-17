# Execution Ledger

**System ID:** `execution-ledger`
**Role:** Append-only, chronological log of every significant execution event across all workflows — the audit trail and ground truth for state reconstruction
**Storage:** `memory/execution-ledger.jsonl`
**Format:** JSONL (one JSON record per line)

---

## Purpose

The Execution Ledger is the canonical record of what happened. While state files represent what the system *believes* is true right now, the ledger records what *actually happened* and when. In any conflict between state file and ledger, the ledger wins.

This is the direct analog of Dexter's `scratchpad.ts` — the append-only JSONL record of all tool results and agent activity — extended to the full enterprise workflow execution context.

---

## Ledger Event Types

### EVENT: workflow_started
```json
{
  "event_type": "workflow_started",
  "workflow_id": "[id]",
  "workflow_type": "[type]",
  "timestamp": "[ISO-8601]",
  "session_id": "[session]",
  "initiated_by": "[human | agent-id]",
  "priority": "[priority]"
}
```

### EVENT: step_started
```json
{
  "event_type": "step_started",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "step_name": "[name]",
  "timestamp": "[ISO-8601]",
  "agent": "[agent-id]",
  "invocation_type": "FRESH | RESUME | RETRY",
  "input_hash": "sha256:[hash]"
}
```

### EVENT: step_completed
```json
{
  "event_type": "step_completed",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "artifact_path": "[path]",
  "artifact_checksum": "sha256:[hash]",
  "duration_seconds": [N]
}
```

### EVENT: gate_pass
```json
{
  "event_type": "gate_pass",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "gate_type": "[type]",
  "artifact_path": "[path]",
  "artifact_checksum": "sha256:[hash]",
  "retry_number": 0,
  "reviewer": "[agent or human]"
}
```

### EVENT: gate_fail
```json
{
  "event_type": "gate_fail",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "gate_type": "[type]",
  "artifact_path": "[path]",
  "failure_criteria": ["[criterion 1 that failed]", "[criterion 2]"],
  "retry_number": 0,
  "reviewer": "[agent or human]"
}
```

### EVENT: decision_logged
```json
{
  "event_type": "decision_logged",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "decision": "[what was decided]",
  "rationale": "[why — one sentence]",
  "finality": "FINAL | SOFT",
  "made_by": "[agent-id]"
}
```

### EVENT: workflow_suspended
```json
{
  "event_type": "workflow_suspended",
  "workflow_id": "[id]",
  "step_id": "[step-id in progress]",
  "timestamp": "[ISO-8601]",
  "sub_task_at": "[description of where within step]",
  "reason": "session_end | context_limit | manual | dependency_wait",
  "checkpoint_written": "[checkpoint-id or null]"
}
```

### EVENT: workflow_resumed
```json
{
  "event_type": "workflow_resumed",
  "workflow_id": "[id]",
  "resume_step": "[step-id]",
  "timestamp": "[ISO-8601]",
  "session_id": "[session]",
  "resume_type": "phase_boundary | mid_step | cold_start",
  "checkpoint_loaded": "[checkpoint-id]"
}
```

### EVENT: workflow_completed
```json
{
  "event_type": "workflow_completed",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "total_steps": [N],
  "total_sessions": [N],
  "total_duration_hours": [N],
  "all_artifacts": ["[path1]", "[path2]"]
}
```

### EVENT: workflow_failed
```json
{
  "event_type": "workflow_failed",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "failure_class": "F[N]",
  "failure_reason": "[description]",
  "recovery_attempted": false,
  "recovery_route": "[system]"
}
```

### EVENT: rollback_executed
```json
{
  "event_type": "rollback_executed",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "rollback_target_step": "[step-id]",
  "steps_rolled_back": ["[ids]"],
  "reason": "[why rollback was needed]"
}
```

### EVENT: escalation_opened
```json
{
  "event_type": "escalation_opened",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "escalation_type": "gate_fail | human_decision | conflict | resource",
  "escalated_to": "[agent or HUMAN]",
  "context_summary": "[brief description]",
  "blocking_step": "[step-id]"
}
```

### EVENT: escalation_resolved
```json
{
  "event_type": "escalation_resolved",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "escalation_id": "[id]",
  "resolution": "[what was decided]",
  "resolved_by": "[agent or human]"
}
```

### EVENT: context_restoration
```json
{
  "event_type": "context_restoration",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "resume_step": "[step-id]",
  "checkpoint_loaded": "[checkpoint-id]",
  "decisions_loaded": [N],
  "tokens_estimated": [N]
}
```

---

## Ledger Invariants

1. **Append-only:** Never modify or delete existing lines
2. **Chronological:** Records are always appended in timestamp order
3. **Atomic:** Each append is atomic (temp file → rename)
4. **No blanks:** Every significant event must be logged — no silent state changes
5. **Self-describing:** Each record must be understandable without external context

---

## Ledger Query Patterns

### All events for a workflow
```
FILTER: workflow_id = "[id]"
SORT: timestamp ASC
RETURN: complete chronological history
```

### Last gate result for a step
```
FILTER: workflow_id = "[id]" AND step_id = "[step-id]"
AND event_type IN ("gate_pass", "gate_fail")
SORT: timestamp DESC LIMIT 1
```

### Derive step completion status
```
FILTER: workflow_id = "[id]"
AND event_type = "gate_pass"
GROUP BY step_id
RETURN: set of completed step IDs
```

### Find last checkpoint for resumption
```
FILTER: workflow_id = "[id]"
AND event_type = "workflow_suspended"
SORT: timestamp DESC LIMIT 1
RETURN: checkpoint_id from that record
```

---

## Ledger as Ground Truth (Recovery Priority)

When recovering, trust sources in this order:

1. **Execution Ledger** (highest authority — immutable log)
2. **Checkpoint files** (high authority — structured snapshots)
3. **Artifact checksums** (high authority — file content hash)
4. **State files** (medium authority — may be stale or corrupt)
5. **Execution Registry** (medium authority — derived from state files)
6. **Session Bridge** (lower authority — may be compressed/incomplete)

The ledger is authoritative because it is append-only. A state file can be overwritten incorrectly; the ledger cannot.

---

## Ledger Size Management

When `execution-ledger.jsonl` exceeds 50MB:
1. Split by workflow completion:
   - Move COMPLETE workflow records to `memory/execution-ledger-archive/[YYYY-MM].jsonl`
   - Keep active workflow records in primary ledger
2. Never truncate — archive, never delete
3. Archive is queryable (same format, same schema)

---

## Integration

**Written to by:**
- Every agent invocation (via `deterministic-executor.md`)
- `continuation-systems/workflow-continuator.md`
- `recovery-systems/*.md` (all recovery events)
- `workflow-checkpoints/checkpoint-engine.md`
- `orchestrator/execution-engine.md`

**Read by:**
- `recovery-systems/state-reconstructor.md` → derives ground truth
- `recovery-systems/failure-detector.md` → detects anomalies
- `continuation-systems/deterministic-executor.md` → idempotency checks
- All recovery systems → historical evidence
