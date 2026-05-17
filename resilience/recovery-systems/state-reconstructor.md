# State Reconstructor

**System ID:** `state-reconstructor`
**Role:** Rebuilds workflow state from first principles when state files are corrupted, missing, or inconsistent with actual artifact evidence
**Handles:** F1 (Missing Artifact), F6 (Decision Conflict), F8 (State File Corruption), and any state where the file cannot be trusted

---

## Purpose

State files can lie. They can be corrupt, stale, or simply wrong because a session ended before they could be updated. The State Reconstructor treats state files as an optimization — useful when available — but derives ground truth from what actually exists on disk: artifacts, execution ledger entries, and checkpoint snapshots.

**Core principle:** Artifact existence + execution ledger entries + checkpoint content = ground truth. State files are derived, not authoritative.

---

## Reconstruction Philosophy

The reconstructor builds workflow state using the **Artifact-Evidence Method**:

```
WHAT DID THE WORKFLOW ACTUALLY DO?
  → Look at what artifacts exist on disk
  → Look at what gate events appear in the execution ledger
  → Look at what decisions appear in checkpoint snapshots
  → Derive the true state from this evidence
  → Write a clean, accurate state file
  → Resume from the reconstructed state
```

This is fundamentally different from reading the state file and trusting it. The reconstructor verifies every claim in the state file against physical evidence.

---

## Reconstruction Algorithm

### Phase 01: Inventory Artifacts

```
FOR each step in workflow (read from workflow definition file):
  
  EXPECTED_PATH = step.output.path (from workflow definition)
  
  IF file exists at EXPECTED_PATH:
    artifact_evidence[step.id] = {
      exists: true,
      modified: file.modification_timestamp,
      size: file.size_bytes,
      readable: try_parse(file)
    }
  ELSE:
    artifact_evidence[step.id] = {exists: false}
  
  # Also search for alternate locations (path drift)
  SEARCH nearby directories for filename matching step.output artifact name
  IF found at alternate path:
    artifact_evidence[step.id].alternate_path = found_path
    artifact_evidence[step.id].path_drift = true
```

### Phase 02: Mine Execution Ledger

```
FOR each ledger entry in execution-persistence/execution-ledger.md:
  
  IF entry.workflow_id == this.workflow_id:
    ledger_evidence[entry.step_id].append(entry)

# Derive step status from ledger
FOR each step:
  IF ledger_evidence[step] contains gate_pass event:
    step_status_from_ledger[step] = COMPLETE
  ELIF ledger_evidence[step] contains gate_fail event:
    step_status_from_ledger[step] = GATE_FAIL_UNRECOVERED
  ELIF ledger_evidence[step] contains step_start event:
    step_status_from_ledger[step] = IN_PROGRESS (or SUSPENDED if no end event)
  ELSE:
    step_status_from_ledger[step] = NOT_STARTED
```

### Phase 03: Mine Checkpoint Snapshots

```
FOR each checkpoint in workflow-checkpoints/checkpoint-registry.md
  WHERE checkpoint.workflow_id == this.workflow_id:
  
  checkpoint_evidence.append({
    checkpoint_id: checkpoint.id,
    step: checkpoint.step,
    timestamp: checkpoint.timestamp,
    decisions: checkpoint.settled_decisions,
    status: checkpoint.workflow_status_at_snapshot
  })

# Sort by timestamp → most recent valid checkpoint = primary reference
primary_checkpoint = MAX(checkpoint_evidence, key=timestamp)
```

### Phase 04: Synthesize Ground Truth

```
FOR each step in workflow:
  
  # Build reconciled truth
  artifact_exists = artifact_evidence[step].exists
  gate_passed = step_status_from_ledger[step] == COMPLETE
  in_checkpoint = step.id <= primary_checkpoint.step
  
  # Decision tree for true status
  IF artifact_exists AND gate_passed:
    TRUE_STATUS = COMPLETE
  
  ELIF artifact_exists AND NOT gate_passed AND in_checkpoint:
    TRUE_STATUS = COMPLETE  # checkpoint says complete; trust checkpoint over missing ledger
  
  ELIF artifact_exists AND NOT gate_passed AND NOT in_checkpoint:
    TRUE_STATUS = NEEDS_GATE_CHECK  # artifact exists but gate status unknown
  
  ELIF NOT artifact_exists AND in_checkpoint:
    TRUE_STATUS = COMPLETE  # checkpoint predates artifact; artifact was likely deleted
    FLAGS: F1-MISSING-ARTIFACT  # flag for investigation
  
  ELIF NOT artifact_exists AND NOT in_checkpoint AND gate_passed_in_ledger:
    TRUE_STATUS = COMPLETE_ARTIFACT_DELETED  # clear evidence step completed but file gone
    FLAGS: F1-MISSING-ARTIFACT
  
  ELSE:
    TRUE_STATUS = NOT_STARTED or IN_PROGRESS (based on ledger evidence)
```

### Phase 05: Handle Missing Artifacts (F1 Recovery)

For steps with TRUE_STATUS = COMPLETE_ARTIFACT_DELETED:

**Option A: Re-execute step (Preferred if reproducible)**
```
IF step is deterministic (same inputs → same outputs):
  Re-execute step with original inputs from prior step's handoff
  Produces same artifact (reproducible execution)
  Verify with gate check
  Mark COMPLETE
```

**Option B: Reconstruct from downstream artifacts**
```
IF artifact is referenced/embedded in a downstream artifact:
  Extract relevant content from downstream artifact
  Reconstruct the missing artifact file
  Verify with gate check
  Mark COMPLETE
```

**Option C: Accept as completed (if downstream steps are COMPLETE)**
```
IF all downstream steps are COMPLETE and passed their gates:
  The missing artifact's content was consumed and is embedded in downstream
  Mark step as COMPLETE-ARTIFACT-CONSUMED
  Do not attempt to recreate (downstream artifacts are authoritative)
```

### Phase 06: Decision Conflict Resolution (F6 Recovery)

When two decisions in the evidence conflict:

```
DECISION A: [decision] — Source: checkpoint at Step N (timestamp T1)
DECISION B: [decision] — Source: agent output at Step M > N (timestamp T2)

CONFLICT RULE:
  IF Decision A is FINAL:
    Decision A wins (FINAL = cannot be overridden without explicit escalation)
    Decision B is REJECTED
    Step M must be re-executed without Decision B
  
  IF Decision A is SOFT:
    Decision B may stand (later step may have had new information)
    Record conflict for human review
    Flag: [SOFT DECISION OVERRIDDEN — review if intentional]
  
  IF NEITHER is in checkpoint (both from ledger or agent output):
    Route to supervisor-agent for conflict resolution
    Block advancement until resolved
```

### Phase 07: Write Reconstructed State

```yaml
# Reconstructed state file — memory/workflow-state/[id].yaml
---
workflow: [workflow-type]
instance-id: [id]
reconstruction:
  method: artifact-evidence
  timestamp: [ISO-8601]
  confidence: [HIGH | MEDIUM | LOW]
  flags: [list of F-class flags encountered]
---

# [Rest of state file using synthesized ground truth]
```

---

## Reconstruction Confidence Assessment

| Evidence Quality | Confidence |
|-----------------|-----------|
| All artifacts present + all ledger entries + clean checkpoint | HIGH |
| All artifacts present + partial ledger + checkpoint | HIGH |
| All artifacts present + no ledger + checkpoint | MEDIUM |
| Some artifacts missing (re-executed) + ledger | MEDIUM |
| Artifacts reconstructed from downstream | MEDIUM |
| No artifacts + ledger only | LOW |
| No artifacts + no ledger + old checkpoint | LOW (cold start) |

If confidence is LOW: route to `runtime-recovery/cold-start-recovery.md`.

---

## Output

After reconstruction:
1. Write clean state file to `memory/workflow-state/[id].yaml`
2. Update execution registry with reconstructed status
3. Write reconstruction report to execution ledger
4. Return reconstructed state to workflow-restorer or recovery-orchestrator

```json
{
  "event_type": "state_reconstructed",
  "workflow_id": "[id]",
  "timestamp": "[ISO-8601]",
  "method": "artifact-evidence",
  "confidence": "MEDIUM",
  "steps_reconstructed": [N],
  "f1_flags": [N],
  "f6_flags": [N],
  "f8_flags": [N],
  "resume_point": "[step-id]",
  "warnings": ["[any anomalies found during reconstruction]"]
}
```

---

## Integration

**Called by:**
- `runtime-recovery/recovery-orchestrator.md` → for F1, F6, F8 failures
- `runtime-recovery/cold-start-recovery.md` → when full reconstruction needed
- `recovery-systems/workflow-restorer.md` → when state file cannot be trusted

**Reads from:**
- Artifact file system → all expected artifact paths
- `execution-persistence/execution-ledger.md` → gate events, step events
- `workflow-checkpoints/checkpoint-registry.md` → checkpoint snapshots
- `workflow-checkpoints/phase-snapshots.md` → phase-level snapshots
- `execution-persistence/execution-memory.md` → settled decisions

**Writes to:**
- `memory/workflow-state/[id].yaml` → reconstructed state
- `execution-persistence/execution-registry.md` → status update
- `execution-persistence/execution-ledger.md` → reconstruction event
