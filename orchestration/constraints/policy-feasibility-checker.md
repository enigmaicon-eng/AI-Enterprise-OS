# Policy Feasibility Checker

## Purpose
The pre-execution gate that combines policy authorization (from the policy engine) and constraint feasibility (from the constraint solver) into a single, deterministic PROCEED | BLOCK | REQUIRE_APPROVAL | DEFERRED verdict before any consequential action executes. The feasibility checker is the last line of defense before execution — it ensures that no action proceeds without satisfying both the policy layer and the constraint layer simultaneously. It also serves as the integration point that translates complex multi-system policy-feasibility state into actionable orchestration decisions.

---

## Feasibility Check Flow

```
Proposed Action
        ↓
[Pre-flight Validation]          → is the request well-formed? is it loggable?
        ↓
[1. Policy Evaluation]           → policy-engine.md: is this authorized?
        |
        ├── DENY (hard) ──────────────────────────────────────────→ [BLOCK]
        ├── DENY (soft) ──────────────── [Check for exception path] → [BLOCK or REQUIRE_APPROVAL]
        ├── REQUIRE_APPROVAL ──────────→ [approval-constraint-engine.md] → [REQUIRE_APPROVAL]
        └── ALLOW / ALLOW_WITH_CONDITIONS ──↓
                ↓
[2. Constraint Solving]          → constraint-solver.md: is this feasible?
        |
        ├── INFEASIBLE (hard) ──────────────────────────────────────→ [BLOCK]
        ├── INFEASIBLE (soft) ──────────── [Can be resolved?] ──────→ [DEFERRED or BLOCK]
        ├── FEASIBLE_WITH_CONDITIONS ──────────────────────────────→ [PROCEED_WITH_CONDITIONS]
        └── FEASIBLE ──────────────────────────────────────────────→ [PROCEED]
                ↓
[3. Risk Routing Check]          → risk-aware-router.md: is the routing appropriate?
        |
        ├── Route blocked by risk constraints ───────────────────────→ [BLOCK]
        └── Route approved (possibly with enhanced monitoring) ──────→ finalize routing
                ↓
[4. Execution Token Issue]       → issue cryptographically signed execution token
        ↓
[5. Audit Record]                → write complete feasibility decision to audit trail
        ↓
[Final Verdict]
PROCEED | PROCEED_WITH_CONDITIONS | REQUIRE_APPROVAL | DEFERRED | BLOCK
```

---

## Verdict Schema

```yaml
feasibility_verdict:
  verdict_id: "FCHK-{timestamp_ms}-{random_6char}"
  proposed_action_hash: SHA-256     # hash of the proposed action (for tamper detection)
  
  verdict: PROCEED | PROCEED_WITH_CONDITIONS | REQUIRE_APPROVAL | DEFERRED | BLOCK
  
  if PROCEED:
    execution_token:
      token_id: "EXETOK-{verdict_id}"
      valid_until: ISO-8601          # must execute within this window; typically 5 minutes
      actor_id: string
      action_hash: SHA-256           # action must match this hash exactly at execution time
      token_signature: Ed25519       # signed by feasibility checker
    policy_decision_id: string
    conditions_to_honor: [condition] # from ALLOW_WITH_CONDITIONS decisions
    monitoring_directive: from risk-aware-router (STANDARD | ENHANCED | INTENSIVE)
  
  if PROCEED_WITH_CONDITIONS:
    execution_token: (same as PROCEED)
    conditions: [condition]          # all conditions from policy + constraints combined
    condition_monitoring_frequency: duration
    violation_consequence: SUSPEND | REVOKE | ESCALATE
  
  if REQUIRE_APPROVAL:
    approval_id: string              # approval_request created in approval-constraint-engine
    proceed_after_approval: boolean  # will execution proceed automatically when approval obtained?
    maximum_wait: duration           # how long to wait for approval
  
  if DEFERRED:
    reason: string                   # why deferred (dependency not met, timing constraint, etc.)
    retry_after: ISO-8601 | null     # when to retry feasibility check
    retry_condition: string          # what must change for retry to succeed
    auto_retry: boolean              # will system auto-retry when condition is met?
  
  if BLOCK:
    blocking_reason: string          # human-readable reason for block
    blocking_source: POLICY | CONSTRAINT | RISK_ROUTING | BOTH
    hard_block: boolean              # true = no path to execution (constitutional, hard constraint)
    policy_deny_id: string | null    # the POLDEC that issued DENY
    violated_constraints: [constraint_id] | null
    alternatives: [alternative_suggestion] | null  # from constraint-solver
    appeal_path: string | null       # how to appeal (if any)
  
  evaluation_metadata:
    policy_evaluation_time_ms: int
    constraint_solve_time_ms: int
    risk_routing_time_ms: int
    total_time_ms: int
    policy_engine_version: string
    constraint_catalog_version: string
    policies_evaluated: int
    constraints_evaluated: int
  
  integrity:
    verdict_hash: SHA-256
    prior_verdict_hash: SHA-256      # hash chain with prior verdict record
    checker_signature: Ed25519
  
  audit:
    logged_at: ISO-8601
    audit_event_id: string           # in audit-trail-governance.md
```

---

## Execution Token Protocol

```yaml
execution_token_protocol:
  purpose: |
    The execution token is a cryptographically signed proof that the feasibility checker
    approved a specific action. The runtime MUST verify the token before executing any
    policy-gated action. This prevents:
    (a) actions executing without passing through the feasibility checker
    (b) approved actions being tampered with between approval and execution
    (c) approved tokens being reused for different actions
    (d) time-expired tokens being used
  
  token_fields:
    token_id: globally unique
    actor_id: the authorized actor
    action_hash: SHA-256 of the exact proposed action (including all parameters)
    valid_until: timestamp after which token is invalid
    conditions: conditions that must remain satisfied during execution
    monitoring_directive: monitoring level the runtime must apply
    signature: Ed25519 signature over all fields above by feasibility checker
  
  token_verification_at_execution:
    step_1: verify signature (detect tampering)
    step_2: verify token_id not already consumed (detect replay)
    step_3: verify valid_until is in the future (detect expiry)
    step_4: verify action being executed matches action_hash (detect scope change)
    step_5: verify conditions are still satisfied (detect state change since approval)
    
    if any step fails:
      action: BLOCK execution; log as EXECUTION_TOKEN_INVALID audit event
      alert: notify compliance governance lead (potential security incident)
      never: proceed without valid token for policy-gated actions
  
  token_consumption:
    on_execution_start: mark token as consumed (one-time use)
    consumed_tokens: retained in registry for 7 years (audit trail)
    unconsumed_tokens: expire at valid_until; logged as EXECUTION_TOKEN_EXPIRED
```

---

## Multi-Step Workflow Feasibility

```yaml
workflow_feasibility:
  pre_execution_plan_check:
    purpose: check feasibility of an entire workflow plan before starting any step
    process:
      1. extract all planned actions from orchestration_plan
      2. for each action in plan order: run feasibility_check in DRY_RUN mode
      3. aggregate all BLOCK and REQUIRE_APPROVAL verdicts
      4. return plan-level feasibility report
    
    plan_feasibility_report:
      overall_verdict: FULLY_FEASIBLE | PARTIALLY_FEASIBLE | INFEASIBLE
      blocking_steps: [{step_id, action, blocking_reason}]
      approval_required_steps: [{step_id, action, approval_requirements}]
      deferred_steps: [{step_id, action, defer_until}]
      estimated_first_approval_needed: ISO-8601 | null
    
    action: present plan_feasibility_report to workflow initiator before execution starts
    use_when: ENHANCED or CRITICAL approval-level orchestration plans
  
  rolling_feasibility:
    purpose: re-check feasibility of upcoming steps as workflow progresses
    trigger: before each step begins execution (not just at plan start)
    rationale: system state changes between plan creation and step execution; earlier checks may be stale
    staleness_threshold: feasibility check for a step older than 5 minutes must be re-run
  
  infeasibility_mid_workflow:
    if_step_becomes_infeasible_after_prior_steps_complete:
      action: pause workflow at current step; notify workflow owner
      options: [resolve infeasibility, modify plan, cancel workflow, request exception]
      compensation: if prior steps had side effects, initiate compensating actions per durable-execution.md
```

---

## Feasibility Checking for Batch Operations

```yaml
batch_feasibility:
  definition: multiple independent actions submitted together for concurrent execution
  
  check_protocol:
    parallel_evaluation: all actions checked in parallel (not serially)
    aggregate_result: return per-action verdict; also aggregate batch verdict
    batch_verdict:
      ALL_PROCEED: all actions are PROCEED → execute all
      PARTIAL_PROCEED: some PROCEED, some BLOCK/REQUIRE_APPROVAL → execute feasible subset; block rest
      ALL_BLOCKED: no actions can proceed → batch fails
  
  atomic_batch_option:
    definition: if any action in the batch is blocked, block all (all-or-nothing)
    use_when: batch actions have interdependencies (partial execution would leave inconsistent state)
    flag: atomic_batch: true in feasibility_check_request
    behavior: if atomic_batch=true AND any BLOCK → block entire batch; log reason
```

---

## Performance and Availability

```yaml
performance:
  latency_targets:
    simple_action (no approval, standard constraints): p99 < 120ms (policy + constraints + routing)
    complex_action (REQUIRE_APPROVAL possible, all modules): p99 < 300ms
    plan-level_check (full workflow, 10 steps): p99 < 2000ms
  
  availability:
    requirement: 99.99% (same as policy-engine.md; unavailability = system halt)
    fallback: SAFE_MODE = block all policy-gated actions; queue for retry when available
    degraded_mode: if constraint-solver unavailable → policy-only check (more permissive); alert sent
    degraded_mode_note: "Never block based on policy alone when constraints are unavailable — constraints may be what allows the action. Operate conservatively: require manual approval for HIGH+ blast radius actions."
  
  rate_limiting:
    max_concurrent_checks: 500
    per_workflow_rate: max 100 checks per second per workflow
    backpressure: if rate exceeded → queue with priority by blast_radius (CRITICAL first)
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Step 1: policy authorization |
| `orchestration-constraints/constraint-solver.md` | Step 2: constraint feasibility |
| `orchestration-constraints/risk-aware-router.md` | Step 3: risk-based routing check |
| `orchestration-constraints/approval-constraint-engine.md` | REQUIRE_APPROVAL verdicts routed here |
| `governance-policies/immutable-policy-audit.md` | All verdicts logged immutably |
| `execution-runtime/durable-execution.md` | Execution tokens verified here before each step |
| `orchestration-patterns/orchestration-strategy-engine.md` | Plan-level feasibility check before plan execution |
