# Reversible Execution System
**ID:** SBOX-RES-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Enables agents to execute consequential actions against live systems while preserving the ability to fully undo every write. The reversible execution system wraps each forward action with a pre-registered compensation operation, captures state snapshots before mutation, and chains undo operations into a rollback DAG. Used for Level 4 agents and any action class that touches production configuration, customer state, or financial records.

**Core guarantee:** Every committed write can be undone within the compensation TTL window, provided the system remains in a consistent state.

---

## Reversibility Model

```
Forward Action (F) ←→ Compensation Action (C)

For every committed operation F_i, a compensation C_i is:
  - Pre-registered before F_i executes
  - Stored in the undo-registry with execution TTL
  - Linked in the rollback DAG as C_i = reverse(F_i)

Full rollback = execute [C_n, C_{n-1}, ..., C_1] in reverse order
```

---

## Pre-Registration Protocol

```
pre_register_compensation(action_descriptor) → compensation_id:

  1. Validate action is in compensation-library.md
     If NOT in library: BLOCK execution; require T4 to add compensation first
     
  2. Capture pre-action state snapshot:
     snapshot = capture_state(action_descriptor.target_resources)
     snapshot_id = store_snapshot(snapshot, TTL=compensation_ttl)
     
  3. Construct compensation operation:
     compensation = {
       compensation_id: COMP-{NNN},
       forward_action_id: null,              # set when forward executes
       operation_type: derive_inverse(action_descriptor.operation),
       target_resource: action_descriptor.target_resource,
       pre_action_snapshot_id: snapshot_id,
       compensation_payload: build_undo_payload(snapshot, action_descriptor),
       valid_until: now() + compensation_ttl,
       status: REGISTERED
     }
     
  4. Register in undo-registry.md
  5. Register in rollback DAG for this execution
  6. Return compensation_id
```

---

## State Snapshot Management

```yaml
state_snapshot:
  snapshot_id: SNAP-{NNN}
  
  target_resources:
    - resource_type: DATABASE_TABLE | FILE | API_RESOURCE | CONFIG_VALUE | EVENT_STREAM
      resource_id: string
      scope: {table, row_id} | {path} | {endpoint, id} | {key} | {topic, offset}
      
  captured_state:
    serialization: json_canonical
    content_hash: sha256
    size_bytes: number
    captured_at: ISO8601
    
  validity:
    expires_at: ISO8601
    compensation_ttl: 3600s default  # 1 hour; REVERSIBLE sandbox TTL is 60min
    
  status: VALID | USED | EXPIRED | CORRUPTED
```

---

## Reversible Execution Flow

```
execute_reversible(action_descriptor, execution_context):

  Phase 1: Pre-Registration (before any forward action)
    for each action_step in execution_plan:
      compensation_id = pre_register_compensation(action_step)
      rollback_dag.add_node(action_step, compensation_id)
    rollback_dag.finalize()
    
  Phase 2: Forward Execution
    for each action_step in execution_plan (topological order):
      try:
        result = execute_action(action_step)
        mark_compensation_active(action_step.compensation_id)
        execution_journal.append(action_step, result)
      except ActionError as e:
        rollback_required = true
        break
        
  Phase 3: Commit or Rollback
    if NOT rollback_required:
      validation = validate_results(execution_results)
      if validation == PASS:
        commit_journal()
        mark_compensations_status: COMMITTED_SAFE
      if validation == FAIL:
        execute_rollback(rollback_dag)
    else:
      execute_rollback(rollback_dag)
      
  Phase 4: Post-Execution
    if committed:
      compensations remain ACTIVE until TTL
      after TTL: move to EXPIRED (undo no longer available)
    if rolled_back:
      mark all compensations USED
      log ROLLBACK_COMPLETE to execution-journal
```

---

## Compensation TTL Management

```yaml
compensation_ttl_policy:
  default: 3600s                           # 1 hour post-commit
  
  per_action_class:
    CONFIGURATION_CHANGE: 86400s           # 24 hours (config changes need longer window)
    FINANCIAL_RECORD_WRITE: 604800s        # 7 days (financial compliance window)
    CUSTOMER_STATE_MUTATION: 86400s        # 24 hours
    WORKFLOW_STATE_CHANGE: 1800s           # 30 minutes
    AGENT_TRUST_ADJUSTMENT: 3600s          # 1 hour
    POLICY_UPDATE: 86400s                  # 24 hours
    
  extension:
    authority: T3 (up to 2× base TTL), T4 (any extension)
    reason: required at extension time
    
  after_expiry:
    compensation_status: EXPIRED
    undo_no_longer_available: true
    governance_note: "Action is now effectively irreversible; document for audit"
```

---

## Undo Execution

```
execute_undo(compensation_id, authorized_by):

  1. Fetch compensation from undo-registry
     if status == EXPIRED: FAIL — "Compensation window has closed"
     if status == USED: FAIL — "Already rolled back"
     if valid_until < now(): mark EXPIRED; FAIL
     
  2. Authorization check:
     SCOPED actions: T2 can authorize undo
     REVERSIBLE committed actions: T3 required
     Financial record undos: T4 required
     
  3. Load pre-action snapshot (verify hash integrity)
     if snapshot status == CORRUPTED: FAIL — escalate T4
     
  4. Execute compensation operation:
     result = execute_compensation(compensation.operation_type,
                                   compensation.compensation_payload,
                                   pre_snapshot)
     
  5. Verify post-undo state matches pre-action snapshot
     hash_match = hash(current_state) == compensation.pre_action_snapshot.content_hash
     if NOT hash_match: PARTIAL_UNDO — human review required; T3 immediate
     
  6. Mark compensation USED
  7. Log UNDO_EXECUTED to execution-journal and rollback-audit-trail
  
  Return: undo_result, post_undo_verification_report
```

---

## Irreversibility Gate

```
check_irreversibility(action_descriptor):

  REVERSIBLE if:
    - Action type is in compensation-library.md
    - Pre-action state can be captured (not write-only streaming)
    - Compensation can be registered before execution
    - TTL window is adequate for the risk tier
    
  IRREVERSIBLE (BLOCK) if:
    - Action type has no registered compensation
    - Action produces external communication (email sent, webhook delivered)
    - Action commits a financial transaction externally (payment processed)
    - Action deletes with no recovery path
    
  IRREVERSIBLE handling:
    → BLOCK execution
    → Require DRY_RUN first to preview
    → Require T4 explicit authorization to proceed
    → Log IRREVERSIBLE_ACTION_BLOCKED to audit trail
    → Human review required before unblocking
```

---

## Integration

```
Feeds into:
  undo-registry.md — all pre-registered compensations
  rollback-dag-engine.md — builds DAG from compensation chain
  rollback-coordinator.md — coordinates multi-step undo
  execution-journal.md — all forward + compensation operations logged
  state-snapshot-manager.md — manages pre-action state captures

Receives from:
  sandbox-engine.md — provisioning and mode selection
  compensation-library.md — available inverse operations
  behavioral-contract-system.md — authorized action classes
  privilege-containment-engine.md — permission scope for live writes
```

---

## Governance

**Compensation pre-registration:** Mandatory before any forward REVERSIBLE action; cannot be skipped  
**Undo authority:** T3 for committed actions; T4 for financial/constitutional-adjacent  
**Snapshot integrity:** SHA-256 verified before and after undo; CORRUPTED snapshot = T4 immediate  
**Audit:** All reversible executions and undos logged to `memory/reversible-actions/reversible-exec-log.jsonl`  
**TTL enforcement:** Expired compensations permanently closed; never extended retroactively below T4 authority
