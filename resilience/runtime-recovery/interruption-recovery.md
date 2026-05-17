# Interruption Recovery

**System ID:** `interruption-recovery`
**Role:** Recovers from mid-step interruptions — when an agent was actively executing a step and was cut off (session end, context limit, timeout) before producing the final artifact
**Handles:** RS-03 (Mid-Step With Runtime Snapshot), F2 (Stalled), mid-session context limit hits

---

## Purpose

The most common recovery scenario: an agent was doing work and the session ended. Maybe the agent was 80% through a synthesis step. Maybe the session hit the context limit at minute 23 of a 30-minute evidence gathering step. The work is not lost — it exists partially in a runtime snapshot and a partial artifact file. Interruption recovery picks up from exactly where the agent stopped.

The key property of interruption recovery: **the agent resumes at the sub-task level, not the step level.** It does not restart the step; it continues from the last documented progress point within the step.

---

## Entry Conditions

Interruption recovery applies when:

1. A step has status `IN_PROGRESS` (agent was actively working)
2. A valid runtime snapshot exists for that step
3. The runtime snapshot's partial artifact exists and is readable
4. The interruption occurred less than 4 hours ago (for longer gaps → RS-05 staleness checks apply too)

If no runtime snapshot exists → route to RS-04 (workflow-restorer will re-execute from scratch).

---

## Interruption Recovery Protocol

### STEP 01: Identify Interrupted Step

```
READ: execution-registry → find steps with status IN_PROGRESS
FOR EACH in-progress step:
  CHECK: Is this a legitimate in-progress (started this session) or a stale record?
  
  Stale detection:
    IF step.started_at < session_start_timestamp:
      → This step was in-progress in a PRIOR session — it was interrupted
      → Route to interruption recovery
    IF step.started_at >= session_start_timestamp:
      → This step is legitimately in-progress now — do not interrupt
```

### STEP 02: Load Runtime Snapshot

```
QUERY: checkpoint-registry → latest runtime snapshot for [step-id]
  checkpoint_type = "runtime"
  workflow_id = [id]

IF no runtime snapshot found:
  → Route to RS-04 (re-execute step from scratch)
  → Do NOT attempt interruption recovery without a runtime snapshot

VALIDATE runtime snapshot:
  1. Verify INTEGRITY.sha256
  2. Parse core-state.yaml — verify all required fields
  3. Verify partial artifact exists at path in partial-artifact.yaml
  4. Parse tool-call-log.yaml — verify it is readable

IF validation fails:
  → Try prior runtime snapshot (sequence_number - 1)
  → IF no valid runtime snapshot found: route to RS-04
```

### STEP 03: Verify Partial Artifact Integrity

```
READ: partial-artifact.yaml → get artifact_path and artifact_checksum_partial

COMPUTE: SHA-256 of file at artifact_path

IF checksums match:
  → Partial artifact is intact — safe to resume from it
  → Note: artifact is PARTIAL — gate check will fail if treated as complete

IF checksums mismatch:
  → Artifact was modified after snapshot (corrupted or continued by a different process)
  → OPTION A (if mismatch is small — < 5% size difference):
       Load the file, inspect which sections are complete, adjust resume point
  → OPTION B (if large mismatch or unrecognizable):
       Discard partial artifact, route to RS-04 for clean re-execution
```

### STEP 04: Load Tool Call Cache

```
READ: tool-call-log.yaml → load all executed tool calls

BUILD: deduplication registry for this step
  Format: {(tool_name, input_hash) → result_summary}

This cache will be used to prevent duplicate tool calls during resume.
Any tool that was already called with the same inputs will return the cached result.
```

### STEP 05: Assess Remaining Work

From core-state.yaml and partial-artifact.yaml:

```
WHAT IS DONE:
  Sub-tasks complete: [sections_complete from partial-artifact.yaml]
  Tool calls exhausted: [tool_calls_consumed of tool_budget_allocated]
  Time elapsed: [created_at to now]
  
WHAT REMAINS:
  Sub-tasks remaining: [sections_remaining from partial-artifact.yaml]
  Tool calls remaining: [tool_calls_remaining from core-state.yaml]
  Estimated completion: [sub_tasks_remaining × avg_time_per_subtask]

BUDGET CHECK:
  IF tool_calls_remaining < required_for_remaining_work:
    → Flag: "Tool budget may be insufficient to complete remaining work"
    → Options: request budget extension OR adjust scope of remaining sections
```

### STEP 06: Reconstruct In-Step Decisions

```
READ: partial-decisions.yaml → in_step_decisions, in_step_rejections, in_step_context

These are decisions made DURING the interrupted step that were not yet written to execution-memory.
They must be injected into the resuming agent's context — otherwise it will make them again
(or contradict them).

FORMAT for injection:
  "Decisions made earlier in this step (already settled — do not revisit):
    • [decision 1] (FINAL)
    • [decision 2] (SOFT)
  
  Context established earlier in this step:
    • [context fact 1]
    • [context fact 2]
  
  Rejected during this step (do not re-propose):
    • [rejected approach 1] — reason: [why]"
```

### STEP 07: Build Resume Frame

```
MID-STEP RESUME — [workflow-id] / [step-id]
═══════════════════════════════════════════════════════════
You are resuming a step that was interrupted at [created_at].
This is NOT a new execution — you are continuing from where you stopped.

STEP: [step-name]
INTERRUPTED AT: [sub_task_label]
PROGRESS: ~[completion_percentage]% complete

COMPLETED SECTIONS (already in artifact — do not redo):
  ✓ [section 1] — complete
  ✓ [section 2] — complete

REMAINING SECTIONS (continue from here):
  → [section 3]  ← START HERE
  → [section 4]
  → [section 5]

YOUR PARTIAL ARTIFACT: [artifact_path]
  Current state: [sections_complete] sections written
  You must complete: [sections_remaining] additional sections
  Append to the existing file — do not overwrite completed sections.

TOOL BUDGET:
  Used: [tool_calls_consumed] of [tool_budget_allocated]
  Remaining: [tool_calls_remaining]
  NOTE: The following tool calls were already made — use cached results, do not repeat:
  [For each cached call: tool_name + input summary + result summary]

IN-STEP DECISIONS (already made — honor these):
  [from Step 06]

WORKFLOW CONTEXT (decisions from prior steps):
  [From execution-memory: FINAL decisions + active MUST constraints]

GATE CRITERIA (what this step must produce to pass):
  [Gate criteria from step definition]
═══════════════════════════════════════════════════════════
```

### STEP 08: Resume Execution

```
1. Inject resume frame as agent context
2. Point agent at partial artifact file for append (not overwrite)
3. Inject tool call deduplication registry
4. Resume agent execution

MONITORING during resume:
  - Write new runtime snapshot every 15 minutes
  - Monitor tool budget consumption
  - Watch for artifact file growth (confirms agent is writing)
```

### STEP 09: Post-Resume Handling

When agent completes the step:

```
1. Verify artifact is complete (all required sections present)
2. Compute final checksum
3. Update artifact-registry: status = PRODUCED
4. Submit to gate
5. Write final step decisions to execution-memory (from partial-decisions + new decisions)
6. Delete runtime snapshots for this step (they are now superseded)
7. Create gate-pass checkpoint if gate passes

LOG:
{
  "event_type": "interruption_recovered",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "runtime_snapshot_id": "[id]",
  "sections_resumed_from": "[sub_task_label]",
  "completion_percentage_at_resume": [N],
  "tool_calls_saved": [N],  // tool calls not re-executed due to cache
  "success": true
}
```

---

## Tool Call Deduplication

The most important feature of interruption recovery: preventing duplicate expensive tool calls.

```
BEFORE any tool call during resumed execution:
  1. Compute: input_hash = SHA-256(tool_name + JSON(tool_parameters))
  2. LOOKUP: tool-call-log.yaml for entry with same (tool_name, input_hash)
  
  IF found:
    → Return cached result summary
    → Do NOT execute the tool call
    → Log: "Deduplication: skipped [tool_name] — result from prior execution"
  
  IF not found:
    → Execute tool call normally
    → Append to tool-call-log.yaml:
      {call_id, tool, input_hash, executed_at, result_summary, result_stored_at}
```

Tool call deduplication saves significant tool budget for steps that gather the same evidence across multiple attempts.

---

## Handling Context Limit as Interruption Cause

When the interruption was caused by hitting the context limit (not session end):

```
ADDITIONAL STEP after STEP 05: Context Budget Planning

CURRENT CONTEXT STATE:
  context_tokens_at_interruption: [from core-state.yaml]
  new_session_context_budget: [from agent type]
  
REDUCE scope to fit in budget:
  IF remaining_sub_tasks × avg_tokens_per_subtask > available_budget:
    → Apply section compression: summarize rather than full-content each section
    → OR split remaining work into multiple steps (requires orchestrator approval)
    → OR prioritize: identify which remaining sections are MUST vs NICE-TO-HAVE

INJECT into resume frame:
  "Context budget warning: you have [N] tokens available.
   Complete sections [3, 4] fully. Summarize section [5] to key findings only.
   Do not expand beyond this scope."
```

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (RS-03)
**Reads from:**
- `workflow-checkpoints/runtime-snapshots.md` → runtime snapshot format
- `workflow-checkpoints/checkpoint-registry.md` → find runtime snapshot
- `execution-persistence/artifact-registry.md` → artifact state
- `execution-persistence/execution-memory.md` → prior step decisions

**Writes to:**
- `memory/execution-ledger.jsonl` → interruption recovery events
- `workflow-checkpoints/runtime-snapshots.md` → new runtime snapshots during resume
- `execution-persistence/artifact-registry.md` → updates artifact status on completion

**Triggers on completion:**
- `continuation-systems/deterministic-executor.md` → normal execution continues
- `workflow-checkpoints/checkpoint-engine.md` → gate-pass checkpoint after completion
