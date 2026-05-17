# Handoff Recovery

**System ID:** `handoff-recovery`
**Role:** Recovers from failures in agent-to-agent handoffs — when a delegating agent passes work to a receiving agent but the receiving agent fails to start, produces no output, or loses the handoff context
**Handles:** F1 (Missing artifact from delegated step), F2 (Stalled in delegated step), delegation timeouts

---

## Purpose

Multi-agent workflows have handoff points: the orchestrator delegates a step to a specialist agent, or one agent passes its output to the next. These handoffs can fail silently. The delegating agent believes the work is being done; the receiving agent never started, stalled immediately, or lost the context it was given.

Handoff recovery detects and heals these failures. It does not restart the entire workflow — only the specific delegation that failed.

---

## Handoff Failure Types

| Type | Code | Description | Detection |
|------|------|-------------|-----------|
| Silent non-start | HF-01 | Agent was delegated a task but never started | No `step_started` event within timeout window |
| Context loss | HF-02 | Agent started but immediately lost handoff context | Agent produced output unrelated to delegated task |
| Stall on start | HF-03 | Agent started, produced no output, and is now idle | `step_started` event exists, no artifacts, no activity |
| Output mismatch | HF-04 | Agent produced output, but it doesn't match expected schema | Artifact exists but fails gate immediately with schema errors |
| Partial handoff | HF-05 | Orchestrator sent handoff but message was incomplete | Agent started with evident context gaps |
| Duplicate handoff | HF-06 | Orchestrator delegated same task twice | Two `step_started` events for same step in same session |

---

## Handoff Recovery Detection

### Detecting HF-01: Silent Non-Start

```
TRIGGER: [delegation_timeout] = enqueued_at + max(30 min, step.expected_duration × 1.5)

CHECK at trigger time:
  SCAN execution-ledger for step_started event WHERE:
    step_id = [delegated step] AND timestamp > delegation_timestamp
  
  IF no step_started event found:
    → HF-01 confirmed
    → Retrieve original handoff package from delegation-log.jsonl
    → Re-delegate (see Recovery Protocol below)
```

### Detecting HF-03: Stall on Start

```
TRIGGER: step_started exists but:
  - No artifact produced after [step.expected_duration × 2]
  - No runtime snapshot created after 15 minutes
  - No activity in execution-ledger for this step_id for 20+ minutes

CHECK:
  Is the expected artifact file being written? (check file system, size growing)
  
  IF no file activity:
    → HF-03 confirmed
    → Load last runtime snapshot (if any)
    → Re-invoke agent with recovery frame
```

### Detecting HF-04: Output Mismatch

```
TRIGGER: Artifact produced, gate immediately fails with:
  "schema validation failed" OR "unexpected format" OR "missing required sections"

CHECK:
  Compare artifact content against expected step output template
  IF significant structural mismatch:
    → HF-04 confirmed — agent may have received wrong context
    → Check agent's invocation record for context completeness
    → Re-invoke with complete, verified context
```

---

## Handoff Recovery Protocol

### PHASE 01: Retrieve Original Handoff Package

Before re-delegating, reconstruct exactly what the original handoff should have contained:

```
READ: memory/execution-store/delegation-log.jsonl
FILTER: workflow_id = [id] AND step_id = [failed step]
EXTRACT: original invocation_context, input_artifact_paths, instructions

VERIFY original inputs:
  FOR EACH input_artifact_path:
    CHECK: file exists AND checksum matches registered checksum
    IF checksum mismatch: flag as SUSPECT, do not use corrupt input
```

### PHASE 02: Diagnose Handoff Failure

Determine why the handoff failed:

```
DIAGNOSIS CHECKLIST:
  □ Was the handoff package complete? (all required artifacts present)
  □ Were input artifacts valid? (checksums verified)
  □ Was the agent definition correct? (agent-id maps to a valid agent)
  □ Were context tokens within budget? (was context compressed too aggressively?)
  □ Is this a known failure pattern? (check prior invocations of same step)

ROOT CAUSE CLASSIFICATION:
  - "incomplete_handoff_package" → rebuild package from scratch
  - "corrupt_input_artifact"    → trigger recovery for upstream step
  - "context_compression_loss" → use decompressed context on retry
  - "agent_unavailable"         → escalate (agent system issue)
  - "unknown"                   → log and retry once; escalate if second failure
```

### PHASE 03: Build Recovery Handoff Package

Construct a verified, complete handoff package for the re-delegation:

```yaml
recovery_handoff_package:
  workflow_id: "[id]"
  step_id: "[failed step]"
  retry_attempt: 2
  
  # Full context (do NOT compress — compression may have caused original failure)
  agent_context:
    agent_identity: "[from agent definition]"
    task: "[exact step instructions from workflow definition]"
    
  # All inputs, verified
  inputs:
    - artifact_path: "[path]"
      artifact_checksum: "sha256:[hash]"
      artifact_verified: true
      include_inline: true   # include full content in context, not just path
  
  # Explicit output specification
  expected_output:
    artifact_name: "[name]"
    artifact_path: "[expected path]"
    template: "[template name]"
    gate_criteria:
      - "[criterion 1]"
      - "[criterion 2]"
  
  # Recovery context injection
  recovery_note: |
    NOTE: This is a recovery handoff (attempt [N]).
    A prior attempt failed with: [root cause]
    This handoff includes complete context — do not assume any prior context.
```

### PHASE 04: Re-Delegate with Monitoring

```
1. Re-invoke agent with recovery_handoff_package
2. Set monitoring:
   - Start timer for this delegation
   - Watch for step_started event (max wait: 10 minutes)
   - Watch for runtime snapshot (max wait: 15 minutes)
   - Watch for artifact production (max wait: step.expected_duration × 1.2)
3. IF step_started within 10 minutes: monitor normally
4. IF no step_started after 10 minutes: escalate (HF-01 on retry = systemic)
```

### PHASE 05: Verify Recovery Completion

```
WHEN artifact is produced:
  1. Verify artifact matches expected schema (template check)
  2. Submit to gate for review
  3. IF gate passes: recovery successful — log and continue
  4. IF gate fails again with schema issues: HF-04 on retry → escalate

LOG to execution-ledger.jsonl:
{
  "event_type": "handoff_recovered",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "failure_type": "HF-[N]",
  "root_cause": "[classification]",
  "attempts": 2,
  "success": true
}
```

---

## Handoff Context Integrity Check

Before any delegation (not just recovery), verify the handoff package is complete:

```
HANDOFF INTEGRITY CHECKLIST:
  □ All input artifacts exist and checksums verified
  □ Agent ID resolves to a valid agent definition
  □ Step instructions are present and non-empty
  □ Expected output artifact path is specified
  □ Gate criteria are specified
  □ Context token estimate < agent's budget
  □ No conflicting decisions in execution-memory
  □ No duplicate delegation in delegation-log for same step_id in this session

IF any check fails: DO NOT delegate — fix the handoff package first
```

---

## Duplicate Handoff Prevention (HF-06)

Before delegating any step, check delegation-log:

```
QUERY: delegation-log.jsonl WHERE workflow_id = [id] AND step_id = [step-id]
  AND status IN ("delegated", "in_progress")

IF record exists:
  → STOP: Do not re-delegate
  → Log: "Duplicate delegation prevented for step [step-id]"
  → Check status of existing delegation instead
  → IF existing delegation stalled: treat as HF-03, use handoff-recovery
```

---

## Handoff Log Format

All delegations are logged at `memory/execution-store/delegation-log.jsonl`:

```json
{
  "record_type": "delegation",
  "delegation_id": "del-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "delegated_to": "[agent-id]",
  "delegated_by": "[orchestrator or agent-id]",
  "session_id": "[session]",
  "handoff_package_hash": "sha256:[hash of handoff package]",
  "input_artifact_checksums": ["sha256:[hash]"],
  "expected_artifact_path": "[path]",
  "timeout_at": "[ISO-8601]",
  "status": "delegated | started | complete | timed_out | failed",
  "recovery_attempt": 0
}
```

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (HF failures)
**Also triggered by:**
- `continuation-systems/execution-registry.md` → delegation timeout detection
- `continuation-systems/deterministic-executor.md` → pre-delegation integrity check

**Reads from:**
- `memory/execution-store/delegation-log.jsonl` → delegation history
- `memory/execution-ledger.jsonl` → step events
- `execution-persistence/artifact-registry.md` → input artifact verification
- Agent definitions → agent-id validation

**Writes to:**
- `memory/execution-store/delegation-log.jsonl` → recovery attempts
- `memory/execution-ledger.jsonl` → handoff events
- `execution-persistence/work-queue.md` → re-queues failed delegations

**Triggers on completion:**
- `continuation-systems/workflow-continuator.md` → advance workflow after recovery
