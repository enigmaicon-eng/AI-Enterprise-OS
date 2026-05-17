# Compensating Transaction Engine
**ID:** REV-CTE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Implements the Saga pattern for all multi-step agent workflows that touch live enterprise systems. The compensating transaction engine manages the pairing of every forward action with a pre-registered compensation operation, orchestrates compensation execution on failure, and maintains execution integrity across distributed operations. Where traditional database transactions use ACID rollback, the CTE uses saga-style compensating transactions that reverse side effects already committed to live systems.

---

## Saga Execution Model

```
Forward Saga:  T1 → T2 → T3 → T4 → T5
                                        (all succeed → commit)

Failure at T3: execute C2 → C1
Failure at T4: execute C3 → C2 → C1
Failure at T5: execute C4 → C3 → C2 → C1

Rules:
  - Each Ti has exactly one Ci pre-registered before Ti executes
  - Compensations execute in reverse topological order
  - Ci must be idempotent (safe to execute multiple times)
  - If Ci fails, escalate to human review; never silently skip
```

---

## Transaction Schema

```yaml
saga_transaction:
  saga_id: SAGA-{NNN}
  sandbox_id: SBOX-{NNN}
  workflow_id: string
  agent_id: string
  
  steps:
    - step_id: STEP-{N}
      action_descriptor: string
      forward_operation:
        type: DB_WRITE | FILE_WRITE | API_CALL | CONFIG_SET | STATE_MUTATION
        target: string
        payload: {}
      compensation_operation:
        compensation_id: COMP-{NNN}
        type: string                      # inverse operation type
        target: string
        payload: {}                       # built from pre-action snapshot
      snapshot_id: SNAP-{NNN}
      status: PENDING | EXECUTING | COMPLETED | COMPENSATING | COMPENSATED | FAILED
      
  execution_sequence: [STEP-1, STEP-2, ...]   # topological order
  compensation_sequence: [STEP-N, ..., STEP-1] # reversed on failure
  
  saga_status: PENDING | EXECUTING | COMMITTED | COMPENSATING | COMPENSATED | FAILED
  started_at: ISO8601
  completed_at: ISO8601 | null
  failure_step: STEP-{N} | null
  compensation_trigger: STEP_FAILURE | VALIDATION_FAIL | HUMAN_ABORT | TTL_EXPIRY
```

---

## Engine Operations

```
begin_saga(workflow_id, agent_id, execution_plan) → saga_id:
  1. Assign SAGA-{NNN}
  2. For each step in execution_plan:
     a. Call reversibility-framework to classify action
     b. Capture pre-action state snapshot
     c. Pre-register compensation in undo-registry
     d. Build saga step record
  3. Finalize saga (all steps registered — no forward execution yet)
  4. Register in execution-journal
  5. Return saga_id

execute_saga(saga_id):
  for each step in saga.execution_sequence:
    mark step.status = EXECUTING
    try:
      result = execute_forward_operation(step.forward_operation)
      mark step.status = COMPLETED
      execution_journal.append_step(saga_id, step.step_id, result)
    except OperationError as e:
      mark step.status = FAILED
      saga.failure_step = step.step_id
      compensate_saga(saga_id)
      return SAGA_COMPENSATED

commit_saga(saga_id, validation_result):
  if validation_result == PASS:
    mark saga_status = COMMITTED
    mark all steps COMPLETED
    return SAGA_COMMITTED
  else:
    compensate_saga(saga_id)

compensate_saga(saga_id):
  saga = load_saga(saga_id)
  mark saga.saga_status = COMPENSATING
  
  completed_steps = [s for s in saga.steps if s.status == COMPLETED]
  compensation_order = reversed(topological_sort(completed_steps))
  
  for step in compensation_order:
    mark step.status = COMPENSATING
    
    # Validate compensation preconditions before executing
    precondition_result = validate_compensation_preconditions(step.compensation_id)
    if precondition_result != PASS:
      escalate_compensation_failure(step, precondition_result)
      # Continue compensating other steps; do not abort partial compensation
      continue
      
    try:
      execute_compensation(step.compensation_operation)
      mark step.status = COMPENSATED
      execution_journal.append_compensation(saga_id, step.step_id)
    except CompensationError as e:
      escalate_compensation_failure(step, e)
      mark step.status = FAILED
      
  if all steps COMPENSATED:
    mark saga_status = COMPENSATED
    log SAGA_FULLY_COMPENSATED
  else:
    mark saga_status = FAILED
    log SAGA_PARTIAL_COMPENSATION → T3 immediate
    require_human_resolution()
```

---

## Idempotency Enforcement

All compensations must be idempotent. The engine enforces this:

```
ensure_idempotent(compensation_operation, compensation_id):

  Idempotency key: {compensation_id}-{execution_attempt}
  
  Before executing compensation:
    check: has this compensation_id been executed successfully before?
    if YES and status == COMPENSATED:
      log DUPLICATE_COMPENSATION_SKIPPED
      return ALREADY_COMPENSATED (safe; not an error)
    if YES and status == EXECUTING:
      wait 5s; retry check (possible concurrent execution)
    if NO:
      proceed with execution; record attempt
      
  After executing:
    store result keyed by compensation_id
    future duplicate calls return stored result
```

---

## Partial Failure Handling

```yaml
partial_failure_policy:

  compensation_step_fails:
    action: log COMPENSATION_STEP_FAILED
    escalate: T3 immediate
    human_resolution: required
    remaining_compensations: continue (compensate remaining steps even if one fails)
    
  all_compensations_fail:
    action: log SAGA_FULLY_FAILED
    escalate: T4 immediate
    human_resolution: manual state reconciliation required
    blast_radius: document affected resources + residual state in blast-radius-analyzer
    
  snapshot_corrupted:
    action: BLOCK compensation execution
    escalate: T4 immediate
    human_resolution: manual inspection + state reconciliation
    
  target_resource_missing:
    action: log COMPENSATION_TARGET_MISSING
    treat_as: COMPENSATED (resource no longer exists → goal achieved)
    escalate: T2 notification (informational)
```

---

## Compensation Execution SLA

```yaml
compensation_sla:
  begin_compensation_within: 30s of failure detection
  per_step_compensation_timeout: 60s
  total_compensation_timeout: 300s (5 minutes)
  
  on_timeout:
    mark step: COMPENSATION_TIMEOUT
    escalate: T3 immediate
    continue with remaining steps
    
  sla_miss_alert:
    channel: governance-ops-immediate
    include: saga_id, failed_steps, remaining_resources_affected
```

---

## Concurrent Saga Management

```yaml
concurrency_policy:
  max_concurrent_sagas_per_agent: 5
  max_concurrent_sagas_system_wide: 200
  
  resource_conflict_detection:
    check: do two concurrent sagas touch the same resource?
    if conflict: SERIALIZE sagas (second waits for first to commit or compensate)
    serialization_lock_ttl: 120s
    lock_acquisition_timeout: 30s → LOCK_TIMEOUT error
    
  deadlock_prevention:
    resource acquisition order: alphabetical by resource_id
    never hold lock on resource A while waiting for resource B > 10 seconds
```

---

## Integration

```
Feeds into:
  rollback-dag-engine.md — CTE provides the compensation chain; DAG engine structures rollback topology
  execution-journal.md — all saga steps and compensations logged here
  undo-registry.md — compensations registered here before any forward step executes
  rollback-coordinator.md — coordinates multi-saga rollback scenarios

Receives from:
  reversibility-framework.md — classification and compensation construction rules
  compensation-library.md — available inverse operations
  state-snapshot-manager.md — pre-action snapshots
  sandbox-engine.md — initiated by sandbox lifecycle on REVERSIBLE mode
```

---

## Governance

**Pre-registration:** All compensations registered before any forward action executes — no exceptions  
**Compensation failure:** Always escalate; never silently discard; T3 minimum for any failed compensation  
**Audit:** All saga executions, steps, and compensations logged to `memory/reversible-actions/saga-log.jsonl`  
**Retention:** SAGA records retained 2 years; partial failure records retained permanently
