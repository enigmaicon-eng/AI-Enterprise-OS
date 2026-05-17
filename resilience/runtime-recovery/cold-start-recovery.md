# Cold Start Recovery

**System ID:** `cold-start-recovery`
**Role:** Recovers a workflow from complete context loss — no valid checkpoint, no session bridge, no execution memory — by reconstructing state entirely from artifacts, ledger, and store files
**Handles:** RS-07 (No Valid Checkpoint), F8 (State File Corrupt), full context reset scenarios

---

## Purpose

Cold start recovery is the recovery system of last resort. It assumes nothing about the current session's knowledge — no loaded checkpoints, no in-memory state, no session bridge. It reconstructs everything from the durable record of what actually happened, in this order of trust:

1. Execution ledger (highest trust — append-only, immutable)
2. Artifact files + checksums (high trust — file contents speak for themselves)
3. Execution store JSONL files (medium trust — derived records, may be stale)
4. State files (low trust — can be overwritten incorrectly)

Cold start recovery is slow and methodical. It is correct, not fast.

---

## When Cold Start Recovery Is Invoked

- No valid checkpoint exists in checkpoint-registry
- All checkpoints have integrity: "INVALID"
- State file is missing or unparseable (F8)
- Execution memory is missing for this workflow
- Recovery orchestrator has exhausted all warm recovery options
- Explicit operator invocation ("rebuild from scratch")

---

## Cold Start Recovery Protocol

### PHASE 01: Declare Cold Start

```
LOG to execution-ledger.jsonl:
{
  "event_type": "cold_start_initiated",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "reason": "[why cold start was triggered]",
  "available_evidence": {
    "ledger_events": [N],
    "artifact_files": [N],
    "store_files_readable": true/false
  }
}

NOTIFY operator: "Cold start recovery initiated for workflow [id].
This is a slow reconstruction from first principles. 
Estimated time: [estimate]. Do not interrupt."
```

### PHASE 02: Inventory All Physical Artifacts

Walk every known artifact location for this workflow:

```
SEARCH:
  artifacts/[workflow-id]/          ← primary artifact directory
  memory/rollback-archive/[id]/     ← rolled-back artifacts
  wiki/intelligence/packages/[id]/  ← intelligence artifacts
  memory/workflow-state/[id].yaml   ← state file (if readable)

FOR EACH file found:
  1. Record: file path, size, last modified timestamp
  2. Compute SHA-256 checksum
  3. Attempt to parse: is this a valid artifact? What template/schema?
  4. Attempt to extract: what step produced this? (look for step_id in content)
  5. Add to: physical_artifact_inventory[]
```

Physical artifact inventory format:

```yaml
physical_artifact_inventory:
  - path: "[path]"
    found_at: "[ISO-8601]"
    size_bytes: 0
    checksum: "sha256:[hash]"
    last_modified: "[ISO-8601]"
    parseable: true
    inferred_step_id: "[step-id or null]"
    inferred_artifact_type: "[type or null]"
    registered_in_artifact_registry: true/false
    registered_checksum_match: true/false
```

### PHASE 03: Mine Execution Ledger

The execution ledger is the most authoritative source. Mine it exhaustively:

```
READ: memory/execution-ledger.jsonl
FILTER: workflow_id = [id]
SORT: timestamp ASC

EXTRACT:
  step_events = [step_started, step_completed events]
  gate_events = [gate_pass, gate_fail events]
  decision_events = [decision_logged events]
  artifact_events = [artifact registered from execution-store if available]
  checkpoint_events = [checkpoint_written events]
  rollback_events = [rollback_executed events]
  suspension_events = [workflow_suspended events]
```

From these events, derive:

```yaml
ledger_derived_state:
  steps_definitely_started: ["[step-ids]"]
  steps_definitely_completed: ["[step-ids]"]  # have step_completed event
  steps_gate_passed: ["[step-ids]"]           # have gate_pass event
  steps_gate_failed: ["[step-ids]"]           # latest event is gate_fail
  steps_in_progress: ["[step-ids]"]           # started but no completed event
  
  latest_event_timestamp: "[ISO-8601]"
  last_known_step: "[step-id]"
  last_known_phase: "[phase]"
  
  decisions_from_ledger:
    - decision_id: "[id]"
      decision: "[text]"
      finality: "FINAL | SOFT"
      made_at_step: "[step-id]"
```

### PHASE 04: Mine Execution Store Files

```
READ (in priority order):
  memory/execution-store/step-states.jsonl     → step completion history
  memory/execution-store/gate-verdicts.jsonl   → gate verdict history
  memory/execution-store/decision-log.jsonl    → complete decision log
  memory/execution-store/agent-invocations.jsonl → who executed what
  memory/execution-store/artifact-registry.jsonl → registered artifacts

CROSS-REFERENCE with ledger_derived_state:
  For each step derived from ledger:
    VERIFY: step-states.jsonl confirms same status
    VERIFY: gate-verdicts.jsonl confirms same gate result
  
  DISCREPANCY HANDLING:
    Ledger says COMPLETE, store says IN_PROGRESS → trust ledger
    Ledger says gate_pass, store says gate_fail → trust ledger
    Store has record not in ledger → treat as UNVERIFIED (lower confidence)
```

### PHASE 05: Cross-Reference Artifacts

Match physical artifacts against ledger and store records:

```
FOR EACH step in steps_gate_passed (from ledger):
  LOOK UP: expected artifact path from workflow definition
  CHECK: Does file exist at that path?
  IF yes:
    COMPUTE: checksum of actual file
    COMPARE: to checksum in artifact-registry (if registered)
    IF match: CONFIRMED_VALID
    IF mismatch: CHECKSUM_MISMATCH — flag for investigation
  IF no:
    CHECK: alternate paths (rollback-archive, any moved files)
    IF found elsewhere: FOUND_ALTERNATE_LOCATION
    IF not found: MISSING — step may need re-execution

RESULT: per-step artifact confidence assessment
```

### PHASE 06: Reconstruct Decision State

```
SOURCES (in trust order):
  1. decision-log.jsonl from execution store
  2. decision_logged events from execution ledger
  3. Inferred from artifact content (e.g., ADRs contain decisions)

BUILD: execution memory YAML with:
  - settled_decisions from sources 1+2
  - active_constraints from gate-verdicts (what was required to pass)
  - rejected_approaches from any artifact content or decision_logged events
  - scope: from workflow definition + any scope-change decision events
  
CONFIDENCE: tag each decision with:
  - source: "decision_log | ledger | inferred"
  - confidence: HIGH (decision_log + ledger agree) | MEDIUM (one source) | LOW (inferred)
```

### PHASE 07: Synthesize Ground Truth

Combine all evidence into a ground truth state:

```yaml
cold_start_reconstruction:
  workflow_id: "[id]"
  reconstructed_at: "[ISO-8601]"
  reconstruction_confidence: "HIGH | MEDIUM | LOW"
  
  confirmed_steps:
    - step_id: "[id]"
      status: "COMPLETE"
      confidence: "HIGH"
      artifact_path: "[path]"
      artifact_verified: true
  
  uncertain_steps:
    - step_id: "[id]"
      status: "POSSIBLY_COMPLETE"
      confidence: "MEDIUM"
      artifact_path: "[path]"
      artifact_found: true
      artifact_verified: false
      note: "Checksum mismatch — may have been modified after gate pass"
  
  steps_to_redo:
    - step_id: "[id]"
      reason: "artifact_missing | unverified_state | gate_not_confirmed"
      inputs_available: true
  
  current_step: "[first step that needs work]"
  resume_phase: "[phase name]"
  
  decision_state:
    reconstructed_from: "[sources]"
    confidence: "MEDIUM"
    decisions: [...]
    
  reconstruction_gaps:
    - gap: "[what could not be reconstructed]"
      impact: "[how this affects resumption]"
      mitigation: "[what agent should do]"
```

### PHASE 08: Write Reconstructed State

```
1. Write reconstructed state to memory/workflow-state/[workflow-id].yaml
2. Write reconstructed execution-memory to memory/execution-memory/[id]-memory.yaml
3. Build synthetic checkpoint from reconstructed state:
   → Write to memory/checkpoints/[id]/cold-start-[timestamp]/
   → Mark checkpoint as trigger: "cold_start", integrity: "DEGRADED"
4. Register synthetic checkpoint in checkpoint-registry
5. Update execution-registry with reconstructed state
6. Update work-queue: clear any stale IN_PROGRESS items, re-enqueue steps_to_redo
```

### PHASE 09: Resumption Briefing

Generate a briefing for the resuming agent:

```
COLD START RECOVERY COMPLETE
═════════════════════════════════════════════════════════════
Workflow: [workflow-id]
Reconstruction confidence: [HIGH | MEDIUM | LOW]

CONFIRMED COMPLETE (do not redo):
  ✓ Step [N]: [step-name] — artifact verified at [path]
  ✓ Step [N]: [step-name] — artifact verified at [path]

UNCERTAIN — will verify before using:
  ? Step [N]: [step-name] — artifact found but not fully verified
  → Will spot-check before treating as valid

MUST REDO (work was lost):
  ✗ Step [N]: [step-name] — reason: [missing artifact | unconfirmed gate]
  → Will re-execute from scratch

RESUMING AT: Step [N] — [step-name]

RECONSTRUCTION GAPS (know before resuming):
  • [gap description and mitigation]

KEY DECISIONS RECONSTRUCTED:
  • [decision] — [FINAL] — confidence: HIGH
  • [decision] — [SOFT] — confidence: MEDIUM

IMPORTANT: This recovery was done without a clean checkpoint.
Some decisions may have been reconstructed from artifact content.
If any decision seems wrong, surface it for human review before acting on it.
═════════════════════════════════════════════════════════════
```

---

## Confidence Levels and What They Mean

| Confidence | Meaning | Action |
|-----------|---------|--------|
| HIGH | Step is confirmed complete from ledger + artifact + checksum | Resume normally |
| MEDIUM | Step appears complete but missing one verification | Resume with verification step |
| LOW | Step status inferred, artifact unverified | Re-execute step |
| UNKNOWN | Cannot determine step status | Treat as NOT_STARTED |

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (RS-07 only)
**Reads from:**
- `memory/execution-ledger.jsonl` (primary source of truth)
- `memory/execution-store/` (all JSONL files)
- All artifact file paths
- Workflow definition (to know expected artifact paths)

**Writes to:**
- `memory/workflow-state/[workflow-id].yaml` → reconstructed state
- `memory/execution-memory/[id]-memory.yaml` → reconstructed decisions
- `memory/checkpoints/[id]/cold-start-[ts]/` → synthetic checkpoint
- `memory/execution-store/checkpoint-index.jsonl` → registers synthetic checkpoint
- `memory/execution-ledger.jsonl` → cold start events

**Triggers on completion:**
- `continuation-systems/workflow-continuator.md` → resume from reconstruction point
