# Phase Snapshots

**System ID:** `phase-snapshots`
**Role:** Defines the format, content, and protocol for phase-boundary snapshots — the highest-fidelity checkpoints created at clean phase transitions between major workflow stages
**Storage:** `memory/checkpoints/[workflow-id]/phase-[N]-[step-id]/` (per phase)

---

## Purpose

Phase snapshots are the gold standard of checkpoints. They are created at the cleanest possible moment: immediately after a major phase completes and all its artifacts have passed their gates. At this moment, the workflow is in a fully consistent state — no partial artifacts, no in-flight gates, no ambiguous decisions.

A phase-boundary snapshot is the preferred rollback target because:
1. All artifacts are verified (gate-passed, checksummed)
2. All decisions made in the phase are settled
3. The next step to execute is unambiguous
4. The snapshot is self-contained — resumption requires no inference

---

## What Constitutes a Phase Boundary

A phase boundary occurs when:
- A step completes AND the next step belongs to a different named phase
- A parallel track set completes AND a join step is about to begin
- A gate passes AND it is the final gate in a workflow phase

**Typical phase boundaries by workflow type:**

| Workflow Type | Phases | Phase Boundaries |
|--------------|--------|------------------|
| Feature Development | Discovery → Architecture → Engineering → QA → Release | 4 boundaries |
| Research Investigation | Decomposition → Evidence → Synthesis → Report | 3 boundaries |
| Architecture Review | Analysis → Options → Decision → ADR | 3 boundaries |
| Sprint Planning | Backlog → Prioritization → Assignment → Kickoff | 3 boundaries |

Phases are defined in the workflow definition file. If a workflow does not explicitly define phases, phase boundaries are inferred at every 3rd gate pass.

---

## Phase Snapshot Content

A phase snapshot captures MORE than a regular checkpoint:

### 01: Phase Summary

```yaml
phase_summary:
  phase_name: "[phase name]"
  phase_number: 1
  started_at: "[ISO-8601]"
  completed_at: "[ISO-8601]"
  duration_seconds: 0
  steps_completed: ["[step-id-1]", "[step-id-2]"]
  
  # What this phase produced
  phase_outputs:
    - artifact_id: "art-[uuid]"
      artifact_name: "[name]"
      path: "[path]"
      checksum: "sha256:[hash]"
      gate_verdict: "PASS"
  
  # What was decided in this phase
  phase_decisions:
    - decision_id: "dec-[uuid]"
      decision: "[what was decided]"
      finality: "FINAL | SOFT"
  
  # What was rejected in this phase
  phase_rejections:
    - approach: "[rejected approach]"
      reason: "[why]"
  
  # Phase quality assessment
  gate_pass_rate: 1.0     # ratio of gate passes to total gate checks
  retry_count: 0          # total retries within phase
  escalation_count: 0     # escalations raised within phase
```

### 02: Full Decision State

Unlike regular checkpoints (which include a summary), phase snapshots include the **complete** decision state:

```yaml
full_decision_state:
  settled_decisions:
    - [complete decision records — not truncated]
  active_constraints:
    - [complete constraint records]
  rejected_approaches:
    - [complete rejection records]
  scope:
    in_scope: []
    out_of_scope: []
  open_questions:
    - [only unanswered questions]
```

### 03: Complete Artifact State

```yaml
artifact_state:
  total_artifacts: 0
  gate_passed: 0
  gate_failed: 0
  
  artifacts:
    - artifact_id: "art-[uuid]"
      step_id: "[step-id]"
      name: "[name]"
      path: "[path]"
      status: "GATE_PASSED"
      checksum: "sha256:[hash]"
      size_bytes: 0
      created_at: "[ISO-8601]"
      gate_passed_at: "[ISO-8601]"
      
      # Inline content summary (first 500 chars)
      # Enables resumption even if file is temporarily inaccessible
      content_summary: "[truncated content or key fields]"
```

### 04: Continuation Frame

The phase snapshot includes a pre-built continuation frame for the next phase:

```yaml
continuation_frame:
  resume_at_step: "[first step of next phase]"
  resume_at_phase: "[next phase name]"
  
  next_phase_prerequisites:
    - "[artifact or decision that next phase requires]"
    - "[all are confirmed present and valid]"
  
  handoff_context: |
    PHASE [N] COMPLETE — RESUMING AT PHASE [N+1]
    ══════════════════════════════════════════════════════════
    Completed: [phase N name] — all [N] steps passed gates
    
    Phase [N] produced:
    • [artifact 1] — [path]
    • [artifact 2] — [path]
    
    Key decisions from Phase [N]:
    • [decision 1] (FINAL)
    • [decision 2] (SOFT)
    
    Rejected in Phase [N] — DO NOT re-propose:
    • [rejected approach]
    
    Next: [first step of phase N+1]
    ══════════════════════════════════════════════════════════
  
  # Pre-computed input hash for determinism check
  next_step_input_hash: "sha256:[hash of all inputs for next step]"
```

---

## Phase Snapshot Creation Protocol

### STEP 01: Detect Phase Boundary

The deterministic executor detects phase boundaries:

```
WHEN: gate_pass event fires AND step.phase != next_step.phase
→ Trigger phase snapshot creation before advancing to next step
```

### STEP 02: Wait for Quiescence

Before creating the snapshot, verify the phase is fully settled:

```
CHECK: All steps in current phase have status == COMPLETE
CHECK: All artifacts from current phase have status == GATE_PASSED
CHECK: No open escalations from current phase
CHECK: All parallel tracks in current phase have joined

IF any check fails:
  → Wait (poll at 30-second intervals, max 5 minutes)
  → IF still not settled after 5 minutes: create DEGRADED snapshot with notes
```

### STEP 03: Build Snapshot

Collect all content defined in the Phase Snapshot Content sections above.

### STEP 04: Write Snapshot

```
Directory: memory/checkpoints/[workflow-id]/phase-[N]-[step-id]/
Files:
  phase-snapshot.yaml         ← phase summary (§01)
  full-decision-state.yaml    ← complete decisions (§02)
  artifact-manifest.yaml      ← artifact checksums (§03)
  continuation-frame.yaml     ← next phase frame (§04)
  INTEGRITY.sha256            ← hash of all above files
```

### STEP 05: Register and Advance

```
1. Register in checkpoint-index.jsonl (trigger: "phase_boundary")
2. Log to execution-ledger.jsonl (event: phase_snapshot_written)
3. Update execution-registry: phase_N = COMPLETE, phase_N+1 = STARTING
4. Signal deterministic-executor: advance to next phase
```

---

## Phase Snapshot Validation

Stricter than regular checkpoint validation:

```
01. Verify INTEGRITY.sha256
02. Verify ALL steps in phase.steps_completed have gate_verdict = "PASS" in artifact-manifest
03. Verify artifact checksums for ALL phase outputs
04. Verify no open questions in full-decision-state have priority == "HIGH"
05. Verify continuation-frame references a valid next step

IF validation fails:
  → Do not mark phase COMPLETE
  → Re-run phase validation, attempt to repair
  → If irreparable: create DEGRADED snapshot and escalate
```

---

## Phase Snapshot Retention

Phase snapshots are retained longer than other checkpoint types:

| Snapshot | Retention |
|----------|-----------|
| Most recent phase snapshot | Until workflow completes + 90 days |
| Prior phase snapshots | Until workflow completes + 30 days |
| Phase snapshots of FAILED workflows | 180 days |

Phase snapshots are preferred targets for rollback. The rollback engine always checks for a valid phase snapshot before considering other checkpoint types.

---

## Integration

**Created by:**
- `workflow-checkpoints/checkpoint-engine.md` → at phase boundary trigger
- `continuation-systems/deterministic-executor.md` → triggers engine at phase boundary

**Read by:**
- `workflow-checkpoints/checkpoint-registry.md` → phase snapshot index
- `recovery-systems/rollback-engine.md` → preferred rollback target
- `runtime-recovery/warm-resume.md` → phase snapshot load
- `continuation-systems/workflow-continuator.md` → continuation frame extraction
- `continuation-systems/context-restorer.md` → restores full decision state from phase snapshot
