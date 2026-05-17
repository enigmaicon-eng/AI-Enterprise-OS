# Rollback Engine

**System ID:** `rollback-engine`
**Role:** Executes controlled rollback of workflow execution to a prior stable state — scopes the rollback to the minimum necessary set of nodes, coordinates artifact invalidation, triggers compensation for committed side effects, and restores the DAG to a resumable state
**Storage:** `memory/execution-runtime/rollback-log.jsonl` + `memory/execution-runtime/rollback-state/[run-id]-rollback.yaml`

---

## Purpose

Rollback is not the same as cancellation and not the same as compensation. Cancellation stops execution forward. Compensation undoes completed work. Rollback does both — in a controlled sequence — and then leaves the workflow in a state from which it can be resumed. The rollback engine handles the mechanics: determining scope, sequencing operations, invalidating artifacts, and recording the rollback event as an auditable fact.

---

## Rollback Scope Model

```
ROLLBACK SCOPE determines how far back to roll:

SCOPE_NODE:       Roll back a single failed node and its direct outputs
                  Use when: isolated node failure with no downstream commits

SCOPE_PHASE:      Roll back all nodes in the current execution phase
                  Use when: phase-level gate failure; entire phase is suspect

SCOPE_CHECKPOINT: Roll back to the last valid checkpoint
                  Use when: cascading failure; checkpoint is the last known good state

SCOPE_FULL:       Roll back the entire workflow run to PENDING
                  Use when: fundamental data corruption or definition version mismatch

SCOPE SELECTION ALGORITHM:
  
  failed_nodes = dag.nodes WHERE state == FAILED
  committed_downstream = dag.nodes that SUCCEEDED after any failed_node
  
  IF len(committed_downstream) == 0:
    → SCOPE_NODE (no downstream contamination)
  
  ELIF committed_downstream ⊆ current_phase.nodes:
    → SCOPE_PHASE
  
  ELIF last_checkpoint IS NOT NULL AND last_checkpoint.integrity == VALID:
    → SCOPE_CHECKPOINT
  
  ELSE:
    → SCOPE_FULL
```

---

## Rollback Protocol

```
execute_rollback(run_id, scope, reason):
  
  rollback = RollbackExecution(
    rollback_id = generate_uuid(),
    run_id = run_id,
    scope = scope,
    reason = reason,
    initiated_at = now()
  )
  persist(rollback)
  emit_event("ROLLBACK_INITIATED", rollback_id)
  
  # PHASE 01: Quiesce running nodes
  dag_engine.signal_suspend(run_id)
  await dag_engine.all_nodes_quiesced(run_id, timeout=60)
  
  # PHASE 02: Determine rollback set
  rollback_set = compute_rollback_set(run_id, scope)
  rollback.nodes_to_rollback = rollback_set
  persist(rollback)
  
  # PHASE 03: Invalidate artifacts produced by rollback set
  FOR each node_id in rollback_set:
    artifacts = artifact_registry.get_outputs(run_id, node_id)
    FOR each artifact in artifacts:
      artifact_registry.transition(artifact.artifact_id, PRODUCED → ROLLED_BACK)
      rollback.invalidated_artifacts.append(artifact.artifact_id)
  persist(rollback)
  
  # PHASE 04: Compensate committed side effects
  committed_with_side_effects = [
    n for n in rollback_set
    if n.state == SUCCEEDED AND n.has_external_side_effects
  ]
  IF committed_with_side_effects:
    compensating_actions.trigger(run_id, committed_with_side_effects)
    await compensation_complete(run_id, timeout=300)
  
  # PHASE 05: Reset DAG node states
  FOR each node_id in rollback_set:
    dag_engine.reset_node(node_id, to_state=PENDING)
  
  # PHASE 06: Restore checkpoint (for SCOPE_CHECKPOINT or SCOPE_FULL)
  IF scope in [SCOPE_CHECKPOINT, SCOPE_FULL]:
    target_checkpoint = select_target_checkpoint(scope, run_id)
    checkpoint_engine.restore(run_id, target_checkpoint.checkpoint_id)
  
  # PHASE 07: Mark rollback complete
  rollback.state = SUCCEEDED
  rollback.completed_at = now()
  persist(rollback)
  emit_event("ROLLBACK_COMPLETED", rollback_id)
  
  RETURN rollback
```

---

## Rollback Set Computation

```
compute_rollback_set(run_id, scope):
  dag = dag_engine.load(run_id)
  
  IF scope == SCOPE_NODE:
    # Only the failed node and its direct outputs (if they ran)
    failed = [n for n in dag.nodes WHERE n.state == FAILED]
    direct_downstream = [n for n in dag.nodes WHERE n.depends_on ∩ failed != ∅]
    RETURN failed ∪ {d for d in direct_downstream WHERE d.state != PENDING}
  
  IF scope == SCOPE_PHASE:
    current_phase_nodes = dag.get_phase_nodes(dag.current_phase)
    RETURN {n for n in current_phase_nodes WHERE n.state != PENDING}
  
  IF scope == SCOPE_CHECKPOINT:
    checkpoint = select_target_checkpoint(scope, run_id)
    # All nodes that ran AFTER the checkpoint was created
    RETURN {n for n in dag.nodes WHERE n.started_at > checkpoint.created_at}
  
  IF scope == SCOPE_FULL:
    RETURN {n for n in dag.nodes WHERE n.state != PENDING}
```

---

## Cascade Rollback

When a rollback of a parent workflow requires rolling back spawned subworkflows:

```
cascade_rollback(parent_run_id, rollback_scope):
  
  child_runs = runtime_engine.get_child_runs(parent_run_id)
  
  FOR each child_run in REVERSE(child_runs):  # Reverse spawn order
    IF child_run.state in [RUNNING, COMPLETED]:
      execute_rollback(child_run.run_id, scope=SCOPE_FULL, reason="PARENT_ROLLBACK")
      await rollback_complete(child_run.run_id, timeout=300)
  
  # After all children rolled back, roll back parent
  execute_rollback(parent_run_id, scope=rollback_scope, reason=reason)
```

---

## Rollback State Schema

```yaml
RollbackExecution:
  rollback_id: string
  run_id: string
  scope: "SCOPE_NODE | SCOPE_PHASE | SCOPE_CHECKPOINT | SCOPE_FULL"
  reason: string
  initiated_by: string             # "auto:failure-handler" | "manual:[user]"
  
  state: "INITIATING | QUIESCING | INVALIDATING | COMPENSATING | RESETTING | SUCCEEDED | FAILED"
  initiated_at: datetime
  completed_at: datetime | null
  
  nodes_to_rollback: [string]
  invalidated_artifacts: [string]
  compensation_triggered: boolean
  target_checkpoint_id: string | null
  
  errors: [string]                 # Non-fatal errors encountered during rollback
  requires_human_review: boolean
```

---

## Rollback vs Compensation Decision

```
IF rollback:
  All uncommitted work is abandoned (nodes reset to PENDING)
  All committed work is compensated (compensating-actions engine)
  Workflow returns to a prior state from which it can resume

IF compensation without rollback:
  Only committed work is undone (no node state reset)
  Workflow terminates in COMPENSATED state (does not resume)
  Use when: the entire workflow must be aborted, not just retried
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — on failure with rollback-eligible scope
- `execution-runtime/runtime-engine.md` — on SCOPE_FULL rollback request
- `runtime-recovery/recovery-orchestrator.md` — as part of recovery plan execution

**Calls:**
- `execution-runtime/compensating-actions.md` — compensates committed side effects
- `workflow-checkpoints/checkpoint-engine.md` — restores to target checkpoint
- `execution-persistence/artifact-registry.md` — transitions artifacts to ROLLED_BACK
- `workflow-engine/dag-engine.md` — resets node states

**Writes to:**
- `memory/execution-runtime/rollback-log.jsonl` — all rollback events
- `memory/execution-runtime/rollback-state/[run-id]-rollback.yaml` — rollback execution state
- `memory/execution-ledger.jsonl` — rollback events (for twin sync)
