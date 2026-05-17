# Runtime Snapshots

**System ID:** `runtime-snapshots`
**Role:** Defines mid-execution snapshots — lightweight checkpoints created while a step is in progress, enabling recovery from interruptions without restarting the full step
**Storage:** `memory/checkpoints/[workflow-id]/runtime-[step-id]-[seq]/` (per snapshot)

---

## Purpose

Phase snapshots are created between phases — at clean boundaries. Runtime snapshots are created *within* a step, capturing the agent's progress mid-execution. They solve a specific problem: long steps that take 20-60 minutes risk losing significant work if interrupted at minute 45.

Runtime snapshots are lighter and less complete than phase snapshots. They capture:
- Where within the step execution the agent was
- What partial outputs exist
- What decisions have been made so far
- What tool calls have been executed (preventing duplicate tool calls on resume)

They are not meant to be used as rollback targets (too partial). They exist solely to enable mid-step warm resume.

---

## When Runtime Snapshots Are Created

| Trigger | When |
|---------|------|
| Tool budget consumed (25%) | After every 25% of the step's allocated tool budget |
| Significant sub-task complete | Agent signals completion of a major sub-task within the step |
| Time interval | Every 15 minutes of step execution |
| Evidence batch complete | After processing each batch of evidence (research steps) |
| Context budget warning | When context hits 50% (earlier than session-limit checkpoint) |

Agents signal sub-task completion by appending a sub-task marker to their working artifact.

---

## Runtime Snapshot Content

Runtime snapshots are intentionally minimal — just enough to resume, not a full picture.

### core-state.yaml

```yaml
snapshot_id: "rs-[uuid]"
workflow_id: "[workflow-id]"
step_id: "[step-id]"
sequence_number: 1       # increments per snapshot within this step invocation
created_at: "[ISO-8601]"
trigger: "tool_budget | sub_task | interval | evidence_batch | context_warning"
session_id: "[session-id]"

# Where within the step
sub_task_label: "[description of where agent was]"
sub_task_index: 2        # which sub-task (if step has enumerable sub-tasks)
sub_tasks_total: 5
completion_percentage: 40   # estimated % of step work done

# Tool budget state
tool_budget_allocated: 30
tool_calls_consumed: 8
tool_calls_remaining: 22

# Context state
context_tokens_used: 45000
context_tokens_remaining: 95000
context_compression_applied: false
```

### tool-call-log.yaml

Prevents duplicate tool calls on resume. Every tool call made so far in this step:

```yaml
executed_tool_calls:
  - call_id: "tc-[uuid]"
    tool: "[tool name]"
    input_hash: "sha256:[hash of input parameters]"
    executed_at: "[ISO-8601]"
    result_summary: "[brief description of result]"
    result_stored_at: "[path or null — for large results]"
```

On resume, before making any tool call:
```
CHECK: Does tool-call-log.yaml contain a call with same tool + input_hash?
IF yes: retrieve cached result, do not re-execute
IF no: execute tool call normally, append to log
```

### partial-artifact.yaml

State of the artifact being produced:

```yaml
artifact_id: "art-[uuid]"
artifact_path: "[path to partial artifact]"
artifact_checksum_partial: "sha256:[hash at snapshot time]"
sections_complete: ["[section 1]", "[section 2]"]
sections_remaining: ["[section 3]", "[section 4]", "[section 5]"]
```

### partial-decisions.yaml

Decisions made so far within this step (not yet written to execution-memory):

```yaml
in_step_decisions:
  - decision: "[what was decided]"
    rationale: "[why]"
    made_at: "[ISO-8601]"
    finality: "FINAL | SOFT"

in_step_rejections:
  - approach: "[rejected approach]"
    reason: "[why]"

in_step_context:
  - topic: "[topic]"
    content: "[established context]"
    confidence: "HIGH | MEDIUM | LOW"
```

---

## Runtime Snapshot Creation Protocol

### STEP 01: Capture Tool State

```
READ: current tool call log from working memory
WRITE: all executed tool calls to tool-call-log.yaml
```

### STEP 02: Capture Partial Artifact

```
IF partial artifact file exists:
  1. Compute SHA-256 checksum at current state
  2. Record artifact path and checksum in partial-artifact.yaml
  3. Record which sections are complete vs remaining
```

### STEP 03: Capture In-Step Decisions

```
READ: any decisions made during this step (from agent's working context)
WRITE: to partial-decisions.yaml
NOTE: These are NOT yet written to execution-memory — that happens only on step completion
```

### STEP 04: Write Core State

```
Collect: all measurements from agent context
WRITE: core-state.yaml with:
  - Current sub_task_label
  - Tool budget consumption
  - Context token usage
  - Completion percentage estimate
```

### STEP 05: Write and Register

```
Directory: memory/checkpoints/[workflow-id]/runtime-[step-id]-[seq]/
Files:
  core-state.yaml
  tool-call-log.yaml
  partial-artifact.yaml
  partial-decisions.yaml
  INTEGRITY.sha256

Register in checkpoint-index.jsonl (trigger: "runtime")
Log to execution-ledger.jsonl (event: runtime_snapshot_written)
```

---

## Resume from Runtime Snapshot

When a mid-step interruption is detected:

### STEP 01: Load Latest Runtime Snapshot

```
QUERY: checkpoint-registry → latest runtime snapshot for this step
VALIDATE: INTEGRITY.sha256 check
IF invalid: fall back to prior runtime snapshot, then phase snapshot
```

### STEP 02: Reconstruct Tool Budget

```
tool_calls_remaining = tool_budget_allocated - tool_calls_consumed
Context: "You have [N] tool calls remaining in this step"
```

### STEP 03: Inject Resume Context

```
RESUME FRAME: Mid-Step Recovery
═══════════════════════════════════════════════════════════
You are resuming step [step-id] which was interrupted at:
  Sub-task: [sub_task_label]
  Progress: ~[completion_percentage]% complete
  Tool calls used: [tool_calls_consumed] of [tool_budget_allocated]

Completed sub-tasks (do not repeat):
  ✓ [section 1]
  ✓ [section 2]

Remaining sub-tasks (continue from here):
  → [section 3]  ← START HERE
  → [section 4]
  → [section 5]

Tool calls already made (do not repeat — results cached):
  • [tool] with [input summary] → [result summary]
  • [tool] with [input summary] → [result summary]

Partial artifact at: [path]
  Completed sections: [section 1], [section 2]
  Resume from section: [section 3]

In-step decisions already made:
  • [decision 1] (FINAL — do not revisit)
  • [decision 2] (SOFT)
═══════════════════════════════════════════════════════════
```

### STEP 04: Verify Partial Artifact Integrity

```
Compute SHA-256 of file at artifact_path
Compare to partial-artifact.yaml.artifact_checksum_partial
IF mismatch: artifact was modified after snapshot — use safe version or restart section
IF match: artifact is intact — resume from where snapshot left off
```

### STEP 05: Continue Execution

Agent continues from the resume frame, using cached tool results for previously executed calls.

---

## Runtime Snapshot Retention

Runtime snapshots are ephemeral — they exist only to support mid-step recovery:

| Event | Retention Action |
|-------|------------------|
| Step completes successfully | Delete all runtime snapshots for that step |
| Step fails (gate fail) | Retain most recent runtime snapshot for 24 hours |
| Rollback targets this step | Retain all runtime snapshots until rollback completes |
| Step is retried from beginning | Delete runtime snapshots (fresh execution) |
| Step completes with rollback archive | Archive most recent runtime snapshot alongside |

---

## Runtime Snapshot Integrity

Runtime snapshots are "best effort" — a corrupt runtime snapshot falls back gracefully:

```
Fallback order on runtime snapshot failure:
  1. Prior runtime snapshot (sequence_number - 1)
  2. Phase snapshot for current phase
  3. Most recent gate-passed checkpoint
  4. → cold-start-recovery.md
```

---

## Integration

**Created by:**
- Executing agents (via checkpoint-engine.md) → at each trigger event
- `continuation-systems/session-bridger.md` → forces runtime snapshot at session boundary
- `continuation-systems/deterministic-executor.md` → monitors and triggers

**Read by:**
- `runtime-recovery/interruption-recovery.md` → primary consumer
- `runtime-recovery/warm-resume.md` → checks for recent runtime snapshot before phase snapshot
- `continuation-systems/workflow-continuator.md` → uses tool-call-log for idempotency
- `recovery-systems/workflow-restorer.md` → mid-step suspension restoration
