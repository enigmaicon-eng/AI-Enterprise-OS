# Failure Detector

**System ID:** `failure-detector`
**Role:** Systematically detects workflow failures, stalls, partial completions, and corrupted states — provides a classified failure report for the recovery orchestrator to act on
**Runs:** At every session start + on-demand

---

## Purpose

You cannot recover from a failure you have not detected. The Failure Detector is the diagnostic system that runs at session start, scans all known workflow states, and produces a classified failure report. Each failure class has a defined recovery path, routing the failure to the appropriate recovery subsystem.

---

## Detection Scan Protocol

Run this scan at every session start, before attempting any resumption:

```
FAILURE DETECTION SCAN
══════════════════════
01. Read execution registry
02. Read all workflow state files
03. Verify artifact existence (per registry claims)
04. Check checkpoint integrity
05. Check execution ledger continuity
06. Classify each anomaly
07. Produce failure report
══════════════════════
```

---

## Failure Classes

### Class F1: Missing Artifact

**Definition:** A step is marked COMPLETE in the state file or registry, but the expected artifact does not exist at the stated path.

**Detection:**
```
FOR each step in workflow WHERE status = COMPLETE:
  IF NOT EXISTS(artifact.path):
    CLASSIFY: F1-MISSING-ARTIFACT
    SEVERITY: HIGH
```

**Common causes:**
- File was manually deleted
- File was moved/renamed outside the workflow
- Artifact path in state file was written incorrectly
- Cross-platform path issue (Windows vs. Unix separator)

**Recovery route:** `recovery-systems/state-reconstructor.md` → search for artifact by content or modified path

---

### Class F2: Stalled Execution

**Definition:** A step is marked IN_PROGRESS but `last_activity` timestamp is > [stall threshold] old with no recent execution ledger entries.

**Detection:**
```
FOR each step WHERE status = IN_PROGRESS:
  IF (NOW - last_activity) > STALL_THRESHOLD:
    CLASSIFY: F2-STALLED
    SEVERITY: depends on stall duration:
      < 1h: LOW (session may have just ended)
      1h-24h: MEDIUM (likely abandoned mid-session)
      > 24h: HIGH (definitely abandoned)
```

**Stall thresholds:**
- Shallow tasks (checklist, schema gate): 30 minutes
- Standard tasks (agent invocation with tools): 2 hours
- Deep tasks (research, architecture): 24 hours

**Common causes:**
- Session ended while agent was executing
- Agent encountered an error that wasn't logged
- Context window exhausted mid-step

**Recovery route:** `runtime-recovery/interruption-recovery.md`

---

### Class F3: Gate Failure (Unrecovered)

**Definition:** A gate failure was recorded in the execution ledger but the step was never re-executed or escalated.

**Detection:**
```
FOR each gate_failure event in execution ledger:
  IF step.status != COMPLETE
  AND step.status != ESCALATED
  AND retry_count < max_retries:
    CLASSIFY: F3-GATE-FAILURE-UNRECOVERED
    SEVERITY: MEDIUM
```

**Common causes:**
- Gate failed, session ended before retry
- Retry was attempted but also failed (check retry count)
- Gate criteria changed after the artifact was produced

**Recovery route:** `recovery-systems/workflow-restorer.md` → retry with gate failure context

---

### Class F4: Partial Parallel Track

**Definition:** A parallel group has some tracks COMPLETE and some SUSPENDED, FAILED, or missing — and the join condition has not been met.

**Detection:**
```
FOR each parallel_group WHERE join_condition NOT MET:
  FOR each track IN parallel_group:
    IF track.status != COMPLETE:
      CLASSIFY: F4-PARTIAL-PARALLEL
      SEVERITY: depends on failed track count and priority
```

**Common causes:**
- One track's session ended while others completed
- One track failed with an unrecovered error
- Parallel tracks had a race condition on shared resources

**Recovery route:** `continuation-systems/workflow-continuator.md` → resume incomplete tracks only

---

### Class F5: Checkpoint Corruption

**Definition:** A checkpoint file exists but fails integrity check (hash mismatch, missing required fields, or version incompatibility).

**Detection:**
```
FOR each checkpoint referenced in registry:
  IF checkpoint.hash != COMPUTED_HASH(checkpoint.content):
    CLASSIFY: F5-CHECKPOINT-CORRUPT
    SEVERITY: MEDIUM (HIGH if no prior clean checkpoint)
  IF checkpoint.required_fields NOT ALL PRESENT:
    CLASSIFY: F5-CHECKPOINT-CORRUPT
    SEVERITY: MEDIUM
```

**Common causes:**
- Write interrupted mid-file (power loss, process kill)
- Disk error during write
- Manual editing of checkpoint file

**Recovery route:** `recovery-systems/rollback-engine.md` → find and load prior clean checkpoint

---

### Class F6: Decision Conflict

**Definition:** Decisions recorded in the execution ledger conflict with each other or with settled decisions in a checkpoint.

**Detection:**
```
FOR each FINAL decision D1 in settled_decision_registry:
  FOR each decision D2 produced after D1 in same workflow:
    IF D2 CONTRADICTS D1:
      CLASSIFY: F6-DECISION-CONFLICT
      SEVERITY: HIGH
```

**Common causes:**
- Agent in a later step re-decided a settled question
- Two parallel tracks made conflicting decisions
- Context contamination caused incorrect decision context

**Recovery route:** `recovery-systems/state-reconstructor.md` → identify authoritative decision, roll back conflicting one

---

### Class F7: Runaway Execution

**Definition:** A workflow has consumed significantly more iterations or tool calls than expected.

**Detection:**
```
FOR each active workflow:
  IF iterations_executed > expected_iterations × 3:
    CLASSIFY: F7-RUNAWAY
    SEVERITY: HIGH
  IF tool_calls_consumed > budget × 1.5:
    CLASSIFY: F7-RUNAWAY
    SEVERITY: HIGH
```

**Common causes:**
- Stuck in a retry loop
- Agent is not making progress (exploring instead of executing)
- External dependency is never resolving

**Recovery route:** `recovery-systems/orchestration-resumption.md` → investigate and intervene

---

### Class F8: State File Corruption

**Definition:** A workflow state file cannot be parsed or contains invalid state transitions.

**Detection:**
```
FOR each state file in memory/workflow-state/:
  TRY parse as YAML → IF FAILS: CLASSIFY F8
  VALIDATE state machine transitions → IF INVALID: CLASSIFY F8
```

**Recovery route:** `recovery-systems/state-reconstructor.md` → rebuild state file from artifacts + ledger

---

### Class F9: Orphan Artifact

**Definition:** An artifact exists in an expected workflow path but no workflow in the registry claims it.

**Detection:**
```
FOR each artifact found in workflow output directories:
  IF artifact NOT IN any workflow's artifact_list:
    CLASSIFY: F9-ORPHAN-ARTIFACT
    SEVERITY: LOW (may be from a completed and archived workflow)
```

**Recovery route:** Investigate — may be from an archived workflow or a manually created artifact. Check git history if available.

---

## Failure Report Format

```yaml
failure_detection_report:
  scan_id: "fdr-[YYYY-MM-DD]-[N]"
  timestamp: "[ISO-8601]"
  workflows_scanned: [N]
  
  failures_found: [N]
  
  by_class:
    F1_missing_artifact: [N]
    F2_stalled_execution: [N]
    F3_gate_failure_unrecovered: [N]
    F4_partial_parallel: [N]
    F5_checkpoint_corrupt: [N]
    F6_decision_conflict: [N]
    F7_runaway: [N]
    F8_state_file_corrupt: [N]
    F9_orphan_artifact: [N]
  
  by_severity:
    critical: [N]
    high: [N]
    medium: [N]
    low: [N]
  
  failures:
    - failure_id: "fail-[uuid]"
      class: "F[N]"
      severity: "[severity]"
      workflow_id: "[id]"
      step_id: "[step-id]"
      description: "[specific failure description]"
      evidence: "[what was found]"
      recovery_route: "[which recovery system to use]"
      auto_recoverable: [true | false]
      requires_human: [true | false]
  
  recommended_actions:
    immediate:
      - action: "[action]"
        failure_id: "[fail-id]"
        recovery_system: "[system]"
    
    deferred:
      - action: "[action]"
        failure_id: "[fail-id]"
        timeline: "[when to address]"
    
    human_required:
      - action: "[what human must decide]"
        failure_id: "[fail-id]"
        urgency: "[urgency]"
```

---

## Recovery Priority Order

When multiple failures exist:

1. **Critical / F6 Decision Conflict** → resolve before any resumption (decisions must be clean)
2. **High / F1 Missing Artifact** → if blocking a critical workflow
3. **High / F7 Runaway** → stop runaway before it consumes more budget
4. **High / F5 Checkpoint Corrupt + no prior clean checkpoint** → must reconstruct before resumption
5. **Medium / F3 Gate Failure Unrecovered** → retry with failure context
6. **Medium / F4 Partial Parallel** → resume incomplete tracks
7. **Low / F2 Stalled** → warm resume
8. **Low / F9 Orphan Artifact** → investigate when other failures resolved

---

## Integration

**Called by:** `runtime-recovery/recovery-orchestrator.md` (at session start)
**Reads from:**
- `execution-persistence/execution-registry.md`
- `memory/workflow-state/` (all state files)
- `workflow-checkpoints/checkpoint-registry.md`
- `execution-persistence/execution-ledger.md`
- All artifact paths listed in registry

**Output fed to:**
- `runtime-recovery/recovery-orchestrator.md` → failure report for triage
- All recovery subsystems → specific failures routed by class
