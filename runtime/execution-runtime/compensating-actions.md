# Compensating Actions

**System ID:** `compensating-actions`
**Role:** Implements the Saga pattern for long-running distributed transactions — when a workflow fails after partially completing, executes a defined sequence of compensating steps to undo committed work and restore system consistency
**Storage:** `memory/execution-runtime/sagas/[run-id]-saga.yaml`

---

## Purpose

In a distributed system, there is no global transaction. When a ten-step workflow completes steps 1–7 and step 8 fails, you cannot simply rollback — steps 1–7 have already committed to external systems, agent memories, and persisted artifacts. Compensation is the only path to consistency: run purpose-built inverse operations that undo what was done.

The Saga pattern formalizes this: every forward step has a corresponding compensating step, and the compensation plan defines the undo sequence if anything goes wrong after that step committed.

---

## Saga Model

```yaml
SagaDefinition:
  saga_id: string                    # Tied to workflow definition_id
  steps:
    - step_id: string                # Forward step node_id
      compensation_node_id: string   # Node to run to undo this step
      compensation_timeout_seconds: integer
      compensation_retry_policy_id: string
      must_succeed: boolean          # If True, compensation failure → CRITICAL alert
      idempotency_key_template: string  # Template for compensation idempotency key

SagaExecution:
  saga_execution_id: string
  run_id: string                     # The workflow run this saga is for
  
  state: "NOT_STARTED | COMPENSATING | SUCCEEDED | FAILED"
  
  # Which steps succeeded (and need compensation if saga triggers)
  committed_steps: [string]          # node_ids that SUCCEEDED before failure
  failed_step: string                # The step that triggered compensation
  
  compensation_log:
    - step_id: string
      compensation_node_id: string
      state: "PENDING | RUNNING | SUCCEEDED | FAILED | SKIPPED"
      started_at: datetime | null
      completed_at: datetime | null
      error: string | null
      attempts: integer
```

---

## Compensation Trigger

```
ON workflow node failure WHERE workflow.failure_policy == "COMPENSATE":
  
  saga = SagaExecution(
    run_id = workflow.run_id,
    failed_step = failed_node.node_id,
    committed_steps = [n.node_id for n in workflow.nodes WHERE n.state == SUCCEEDED]
  )
  
  # Build compensation queue (reverse order of committed steps)
  compensation_queue = [
    saga_definition.compensation_step(step_id)
    for step_id in REVERSE(saga.committed_steps)
    if saga_definition.has_compensation(step_id)
  ]
  
  persist(saga)
  execute_compensation(saga, compensation_queue)
```

---

## Compensation Execution Protocol

```
execute_compensation(saga, compensation_queue):
  
  FOR each compensation_step in compensation_queue:
    
    # Check if this step needs compensation (may have been skipped originally)
    IF compensation_step.step_id NOT IN saga.committed_steps:
      compensation_step.state = SKIPPED
      CONTINUE
    
    # Build compensation input from forward step's recorded output
    forward_output = dag_engine.get_node_output(saga.run_id, compensation_step.step_id)
    compensation_input = {
      "forward_output": forward_output,
      "original_input": dag_engine.get_node_input(saga.run_id, compensation_step.step_id),
      "idempotency_key": render(compensation_step.idempotency_key_template, saga)
    }
    
    # Dispatch compensation node
    compensation_step.state = RUNNING
    persist(saga)
    
    result = worker_dispatcher.dispatch_compensation(
      node_id = compensation_step.compensation_node_id,
      input = compensation_input,
      retry_policy = retry_engine.get_policy(compensation_step.compensation_retry_policy_id),
      timeout = compensation_step.compensation_timeout_seconds
    )
    
    IF result.status == SUCCESS:
      compensation_step.state = SUCCEEDED
    
    ELIF result.status == FAILURE:
      compensation_step.state = FAILED
      compensation_step.error = result.error
      
      IF compensation_step.must_succeed:
        # Compensation itself failed — this is a CRITICAL inconsistency
        emit_event("COMPENSATION_FAILED_CRITICAL", {
          saga_id: saga.saga_execution_id,
          failed_compensation: compensation_step.compensation_node_id,
          human_action_required: True
        })
        saga.state = FAILED
        persist(saga)
        alert_human_operator(saga)
        RETURN  # Stop compensation — human must intervene
      ELSE:
        # Log and continue — accept partial compensation
        log_compensation_failure(compensation_step)
    
    persist(saga)
  
  # All compensations complete (or accepted as partial)
  saga.state = SUCCEEDED
  workflow.state = COMPENSATED
  persist(saga, workflow)
  emit_event("SAGA_COMPLETED", saga.saga_execution_id)
```

---

## Compensation Design Patterns

### Semantic Undo
The most common pattern — the compensating action is a logical inverse:

```
Forward:      create_artifact(artifact_id, content)
Compensating: delete_artifact(artifact_id)

Forward:      update_agent_state(agent_id, new_state)
Compensating: restore_agent_state(agent_id, previous_state)  # previous_state captured before forward
```

### Counterbalancing Transaction
When an exact undo is impossible (external system doesn't support delete), issue an equal-and-opposite action:

```
Forward:      publish_event(topic, payload)
Compensating: publish_event(topic, {type: "RETRACTION", original_payload: payload})
```

### Pivot Transaction
Mark the transaction as invalid in a registry rather than reversing it:

```
Forward:      register_decision(decision_id, outcome)
Compensating: mark_decision_superseded(decision_id, reason="WORKFLOW_COMPENSATED")
```

---

## Idempotency in Compensation

Compensation steps can be re-executed if they fail partway through. Every compensating step must be idempotent:

```
IDEMPOTENCY KEY for compensation:
  key = sha256(saga_execution_id + compensation_step.step_id + "compensation")
  
ON re-execution:
  IF idempotency_store.exists(key):
    RETURN idempotency_store.get_result(key)  # Cached result from first execution
  ELSE:
    result = execute_compensation_logic()
    idempotency_store.store(key, result)
    RETURN result
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — on node failure with COMPENSATE policy
- `execution-runtime/rollback-engine.md` — as the compensation mechanism for rollback

**Calls:**
- `workflow-engine/worker-dispatcher.md` — dispatches compensation steps to workers
- `workflow-engine/retry-engine.md` — applies retry policy to compensation steps
- `execution-runtime/durable-execution.md` — compensation events recorded in journal

**Reads from:**
- `workflow-engine/workflow-registry.md` — saga definition (compensation plan)
- `workflow-engine/dag-engine.md` — forward step inputs/outputs for compensation context

**Writes to:**
- `memory/execution-runtime/sagas/[run-id]-saga.yaml` — saga execution state
- `memory/execution-ledger.jsonl` — compensation events
