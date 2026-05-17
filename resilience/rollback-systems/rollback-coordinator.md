# Rollback Coordinator
**ID:** RBK-COO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Central coordinator for all rollback operations across the Enterprise AI OS. When a sandbox, saga, or individual action must be reversed, the rollback coordinator is the single entry point: it receives the rollback trigger, authorizes the operation, commissions a rollback DAG, monitors execution, manages partial failures, and ensures every rollback attempt is fully documented. No rollback may proceed without passing through this system.

---

## Rollback Trigger Sources

```yaml
rollback_triggers:
  AUTOMATIC:
    - sandbox validation result: FAIL
    - saga step failure (step.status == FAILED)
    - TTL expiry of REVERSIBLE sandbox before commit
    - blast radius score exceeds declared bound during execution
    - constitutional violation detected mid-execution
    
  HUMAN_INITIATED:
    - T2 abort: own agent's in-progress action (own scope only)
    - T3 abort: any workflow; any agent; any in-progress or recently committed action within TTL
    - T4 abort: any action; override any TTL constraint
    
  GOVERNANCE:
    - pre-execution-simulator detected CRITICAL risk after execution began
    - cross-org scope expansion detected by privilege-containment-engine
    - runtime-quarantine-system flagged the execution as infected
```

---

## Rollback Coordination Protocol

```
coordinate_rollback(rollback_request) → rollback_id:

  Step 1 — Receive and validate trigger:
    log ROLLBACK_INITIATED to execution-journal
    validate: rollback_request.sandbox_id or saga_id exists
    validate: requesting authority meets trigger source requirements
    
  Step 2 — Determine rollback scope:
    if saga_id provided: scope = all completed steps in saga
    if sandbox_id provided: scope = all committed side effects in sandbox
    if action_id provided: scope = single action compensation
    
  Step 3 — Authorization:
    check undo_authority for each compensation in scope
    if any compensation requires higher authority than requester has:
      escalate to required authority level; block until authorized
      
  Step 4 — Check TTL validity:
    for each compensation in scope:
      if now() >= compensation.valid_until:
        mark EXPIRED; flag for human resolution (TTL closed)
      else: proceed
    if ALL expired: ROLLBACK_IMPOSSIBLE; T4 immediate; manual reconciliation
    if SOME expired: PARTIAL_ROLLBACK_POSSIBLE; present to authorized human for decision
    
  Step 5 — Build rollback DAG:
    dag_id = rollback_dag_engine.build_rollback_dag(scope)
    if completeness < 1.0 and strategy == COMPLETE_OR_ESCALATE:
      present coverage gaps to authorized human; get go/no-go decision
      
  Step 6 — Execute rollback:
    result = rollback_dag_engine.execute_rollback_dag(dag_id, authorized_by)
    
  Step 7 — Validate completeness:
    completeness_report = rollback_dag_engine.validate_rollback_completeness(dag_id)
    
  Step 8 — Report and record:
    log ROLLBACK_COMPLETED (or PARTIAL, or FAILED) to execution-journal
    update sandbox/saga status
    generate rollback_report
    if PARTIAL or FAILED: escalate per authority; flag for human follow-up
    
  Return: rollback_id, rollback_result, completeness_report
```

---

## Rollback Request Schema

```yaml
rollback_request:
  request_id: RBK-{NNN}
  trigger_source: AUTOMATIC | HUMAN_INITIATED | GOVERNANCE
  trigger_reason: string
  
  scope:
    sandbox_id: SBOX-{NNN} | null
    saga_id: SAGA-{NNN} | null
    action_ids: [ACT-{NNN}] | null       # single-action rollback
    
  requested_by: string                   # agent_id or human_id
  authority_level: T2 | T3 | T4
  rollback_strategy: COMPLETE_OR_ESCALATE | ABORT_ON_FAILURE | BEST_EFFORT
  
  priority: ROUTINE | HIGH | CRITICAL    # CRITICAL = preempt other rollbacks
  requested_at: ISO8601
```

---

## Rollback Report Schema

```yaml
rollback_report:
  rollback_id: RBK-{NNN}
  request_id: RBK-{NNN}
  dag_id: RDAG-{NNN}
  
  scope_summary:
    total_actions_in_scope: number
    compensations_attempted: number
    compensations_succeeded: number
    compensations_failed: number
    compensations_expired: number
    
  completeness:
    coverage_pct: float
    state_verification: MATCH | PARTIAL_MATCH | MISMATCH | NOT_VERIFIED
    residual_effects: [string]
    human_action_required: [string]
    
  timing:
    initiated_at: ISO8601
    completed_at: ISO8601
    duration_ms: number
    
  outcome: FULL_SUCCESS | PARTIAL | FAILED | IMPOSSIBLE
  follow_up_actions: [string]
  escalations_raised: [string]
```

---

## Concurrent Rollback Management

```yaml
concurrent_rollback_policy:
  max_concurrent_rollbacks: 10
  priority_queue: CRITICAL → HIGH → ROUTINE (FIFO within priority)
  
  resource_conflict:
    if two rollbacks target same resource:
      serialize: higher priority first
      or: if same priority, earlier requested_at first
      
  preemption:
    CRITICAL rollback can preempt ROUTINE rollback on shared resource
    notify preempted rollback coordinator; resume after CRITICAL completes
    
  deadlock_prevention:
    resource acquisition order: alphabetical by resource_id
    timeout: 30s per resource acquisition; LOCK_TIMEOUT → escalate T3
```

---

## Human Escalation Flow

For any rollback requiring human decision:

```
escalate_rollback_decision(rollback_id, decision_type, options):

  decision_types:
    TTL_PARTIALLY_EXPIRED:
      present: which compensations are still valid vs. expired
      options: [PROCEED_PARTIAL, ABORT_ROLLBACK, ESCALATE_T4_FOR_TTL_OVERRIDE]
      
    COVERAGE_GAP:
      present: uncompensatable actions and their current state
      options: [PROCEED_BEST_EFFORT, ABORT_ROLLBACK, MANUAL_RECONCILIATION]
      
    COMPENSATION_FAILED:
      present: which step failed and current resource state
      options: [RETRY_COMPENSATION, SKIP_AND_CONTINUE, ABORT_AND_ESCALATE_T4]
      
    AUTHORITY_INSUFFICIENT:
      present: which compensations require higher authority
      options: [ESCALATE_TO_REQUIRED_LEVEL, SCOPE_ROLLBACK_TO_AUTHORIZED_ONLY]
      
  Human response required within:
    ROUTINE: 4 hours
    HIGH: 1 hour
    CRITICAL: 15 minutes (page oncall if no response within 5 minutes)
```

---

## Rollback Metrics

```yaml
rollback_metrics:
  tracked:
    - rollback_rate: rollbacks / total_executions (target < 2%)
    - full_success_rate: FULL_SUCCESS / total_rollbacks (target > 95%)
    - partial_rate: PARTIAL / total_rollbacks (alert if > 3%)
    - failed_rate: FAILED / total_rollbacks (alert if > 1%)
    - mean_rollback_duration_ms (target < 30000ms / 30s for SCOPED)
    - compensation_ttl_expiry_rate (alert if > 0.5%)
    
  alerting:
    rollback_rate_spike: > 5% in any rolling hour → T3 immediate
    repeated_partial_failure_same_resource: 3 in 24h → T3 architecture review
```

---

## Integration

```
Feeds into:
  rollback-dag-engine.md — commissions DAG construction and execution
  rollback-audit-trail.md — all coordination events recorded
  execution-journal.md — rollback lifecycle logged
  blast-radius-control dashboard — rollback metrics feed live view

Receives from:
  sandbox-engine.md — automatic rollback trigger on FAIL validation
  compensating-transaction-engine.md — saga-level rollback requests
  runtime-quarantine-system.md — quarantine-triggered rollbacks
  failure-isolation-system.md — isolation-triggered rollback on cascade detection
  privilege-containment-engine.md — scope violation triggers rollback
```

---

## Governance

**Single entry point:** All rollbacks go through this coordinator; no direct bypass to DAG engine  
**Authorization gate:** No rollback executes without validated authority; automatic triggers still logged with system authority attribution  
**Partial rollback disclosure:** Residual effects always surfaced to the authorized human; no silent partial rollback  
**Audit:** All rollback requests, decisions, and outcomes to `memory/rollback-systems/rollback-coordinator-log.jsonl`  
**Retention:** All rollback records retained 3 years; FAILED and PARTIAL records retained permanently
