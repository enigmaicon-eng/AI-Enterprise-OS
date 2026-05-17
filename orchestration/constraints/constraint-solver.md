# Constraint Solver

## Purpose
Evaluates the complete set of active constraints against the current system state to determine whether a proposed orchestration action is feasible before it is submitted to the policy engine for authorization. The constraint solver answers a different question than the policy engine: not "is this authorized?" but "can this actually work given current system state?" An action may be authorized by policy but infeasible due to capacity exhaustion, timing conflicts, dependency violations, or resource contention. The solver catches infeasibility early — before execution begins — preventing wasted work and governance violations that would be expensive to unwind.

---

## Solver Architecture

```
Feasibility Check Request
        ↓
[1. Constraint Discovery]        → identify all constraints applicable to this action
        ↓
[2. State Snapshot]              → capture live system state relevant to each constraint
        ↓
[3. Constraint Classification]   → hard vs. soft; precedence ordering
        ↓
[4. Hard Constraint Evaluation]  → evaluate all hard constraints; any violation = INFEASIBLE
        ↓
[5. Soft Constraint Evaluation]  → evaluate soft constraints; violations = FEASIBLE_WITH_WARNINGS
        ↓
[6. Dependency Resolution]       → verify all dependency constraints are satisfiable
        ↓
[7. Feasibility Decision]        → FEASIBLE | FEASIBLE_WITH_CONDITIONS | INFEASIBLE | UNKNOWN
        ↓
[8. Alternative Suggestion]      → if INFEASIBLE, suggest alternative approaches where possible
        ↓
[9. Decision Record]             → log feasibility decision with constraint evaluation detail
```

---

## Feasibility Check Request

```yaml
feasibility_check_request:
  check_id: "FEAS-{timestamp_ms}-{random_6char}"
  
  proposed_action:
    action_type: string
    action_category: string
    actor_id: agent_id | human_id
    actor_tier: int
    resource_id: string
    resource_type: string
    resource_domain: string
    intended_effect: string
    reversibility: string
    blast_radius: string
    estimated_duration: duration | null
    required_resources: {workers: int, context_tokens: int, memory_mb: int}
  
  current_context:
    timestamp: ISO-8601
    workflow_id: string | null
    delegation_chain: [agent_id | human_id]
    active_approvals: [approval_id]
    active_exceptions: [exception_id]
    environment: string
  
  evaluation_options:
    include_soft_constraints: boolean   # default true; can skip for ultra-low-latency paths
    suggest_alternatives: boolean       # if infeasible, generate alternative suggestions
    max_solver_time_ms: int             # abort if solver exceeds this; return UNKNOWN
```

---

## Feasibility Decision

```yaml
feasibility_decision:
  check_id: string
  
  decision: FEASIBLE | FEASIBLE_WITH_CONDITIONS | INFEASIBLE | UNKNOWN
  
  if FEASIBLE:
    proceed: true
    soft_constraint_warnings: [warning]   # non-blocking issues to be aware of
    recommended_precautions: [string]     # optional additional steps
  
  if FEASIBLE_WITH_CONDITIONS:
    proceed: true
    required_conditions: [condition]      # conditions that must be met for feasibility to hold
    condition_monitoring_required: boolean
    validity_window: duration             # feasibility expires if not acted on within this window
  
  if INFEASIBLE:
    proceed: false
    violated_hard_constraints: [{constraint_id, constraint_name, violation_detail, severity}]
    primary_blocker: constraint_id        # the most significant constraint violation
    is_permanently_infeasible: boolean    # true = no change in state will make it feasible (e.g., constitutional lock)
    alternatives: [alternative_suggestion]
  
  if UNKNOWN:
    proceed: false
    reason: SOLVER_TIMEOUT | STATE_UNAVAILABLE | CONSTRAINT_EVALUATION_ERROR
    safe_default: INFEASIBLE              # always conservative on uncertainty
  
  evaluation_detail:
    constraints_evaluated: [{constraint_id, result: SATISFIED | VIOLATED | WARNING | NOT_EVALUATED, evaluation_time_ms}]
    state_snapshot_age_ms: int           # how old is the system state used in evaluation
    total_solver_time_ms: int
```

---

## Constraint Evaluation Modules

```yaml
evaluation_modules:
  AUTHORITY_MODULE:
    evaluates: [CON-AUTH-*]
    state_required:
      - actor tier and trust scores (from agent-registry)
      - delegation chain (from context)
      - active delegations (from delegation-model.md)
    evaluation_approach: direct comparison against constraint expressions
    latency: p99 < 5ms (in-memory state)
  
  CAPACITY_MODULE:
    evaluates: [CON-CAP-*]
    state_required:
      - current worker pool utilization (from worker-orchestration.md)
      - workflow context consumption (from execution-runtime)
      - agent tool call rates (from sliding window counters)
      - memory allocation registry (from execution-scaling.md)
    evaluation_approach: compare requested resources against available capacity
    latency: p99 < 10ms (live system state; may require cache refresh)
    
    capacity_reservation_protocol:
      # When capacity is available at check time, pre-reserve it to prevent race conditions
      # between check and execution. Reservation released if action doesn't proceed within 30s.
      reservation_id: "CAPRES-{check_id}"
      reservation_ttl: 30 seconds
      reservation_release: automatic on action start or expiry
  
  TIMING_MODULE:
    evaluates: [CON-TIME-*]
    state_required:
      - current timestamp (UTC)
      - maintenance window schedules (from configuration)
      - workflow deadlines (from DAG metadata)
      - task duration estimates (from agent-performance-tracker)
    evaluation_approach:
      deadline_feasibility: current_time + estimated_duration <= deadline
      window_compliance: is_within_maintenance_window(current_time, environment)
    latency: p99 < 5ms (mostly timestamp arithmetic)
  
  DEPENDENCY_MODULE:
    evaluates: [CON-DEP-*]
    state_required:
      - artifact registry state (from execution-persistence/artifact-registry)
      - approval status (from approval-constraint-engine)
      - gate check results (from quality gates)
      - human review gate status (from AI governance systems)
    evaluation_approach:
      artifact_check: artifact_exists AND artifact_status == APPROVED
      approval_check: required_approval_granted(action, context)
      gate_check: gate_passed(gate_id, workflow_id)
    latency: p99 < 20ms (may require artifact registry lookup)
    
    dependency_satisfiability:
      # Check not just whether dependencies are currently satisfied,
      # but whether they CAN be satisfied (are the prerequisite tasks planned?)
      checks: [is_prerequisite_task_in_plan, is_prerequisite_agent_available, is_approval_path_reachable]
  
  COMPLIANCE_MODULE:
    evaluates: [CON-COMP-*]
    state_required:
      - evidence currency (from evidence-collection-engine)
      - active exceptions (from exception-management)
      - regulatory deadlines (from regulatory-registry)
      - control effectiveness states (from control-effectiveness-monitor)
    evaluation_approach:
      evidence_check: has_current_evidence(control_id, evidence_age_threshold)
      exception_check: exception_active AND exception_covers_this_action
      deadline_check: proposed_completion_before_regulatory_deadline
    latency: p99 < 30ms (may require compliance system state fetch)
  
  GOVERNANCE_MODULE:
    evaluates: [CON-GOV-*]
    state_required:
      - reviewer independence status (from agent-registry)
      - approval quorum composition (from approval-constraint-engine)
      - conflict of interest registry (from governance records)
    evaluation_approach:
      independence: proposer_id != reviewer_id AND no_conflict_of_interest
      quorum: available_approvers >= required_quorum
    latency: p99 < 15ms
  
  ISOLATION_MODULE:
    evaluates: [CON-ISO-*]
    state_required:
      - agent domain clearances (from agent-registry capability_profile)
      - active sandboxes (from runtime-isolation-manager)
      - data classification (from resource metadata)
    evaluation_approach: direct clearance vs. classification comparison
    latency: p99 < 5ms (clearance data cached in agent registry)
```

---

## Alternative Suggestion Engine

```yaml
alternative_suggestions:
  purpose: |
    When an action is INFEASIBLE, the solver does not simply block — it suggests
    alternative paths that could achieve a similar goal while satisfying constraints.
    This transforms the solver from a pure blocker into a governance-aware advisor.
  
  suggestion_types:
    AUTHORITY_VIOLATION:
      - request_delegation_from_higher_tier: "Action requires Tier-{N}. Agent-{X} at Tier-{N} could delegate authority."
      - file_approval_request: "Submit approval request to Tier-{N} approvers via approval-constraint-engine."
    
    CAPACITY_VIOLATION:
      - wait_for_capacity: "Current capacity: {X}%. Estimated wait for sufficient capacity: {duration}."
      - reduce_scope: "Reduce blast_radius or resource requirements to fit within available capacity."
      - use_burst_pool: "Burst pool available. Submit burst pool request to Tier-3+."
    
    TIMING_VIOLATION:
      - schedule_for_maintenance_window: "Next maintenance window: {ISO-8601}. Action can be scheduled then."
      - request_emergency_window: "Emergency production access requires Tier-3+ approval."
    
    DEPENDENCY_VIOLATION:
      - wait_for_artifact: "Prerequisite artifact {artifact_id} from task {task_id} not yet complete. Estimated: {ETA}."
      - get_approval_first: "Required approval from {approver_spec} not yet obtained. Submit approval request."
    
    COMPLIANCE_VIOLATION:
      - collect_evidence_first: "Evidence required for control {control_id} is missing or stale. Collect evidence before proceeding."
      - file_exception: "Request exception EXC-{N} to temporarily waive this constraint via exception-management."
  
  suggestion_quality_gate:
    must_be_actionable: suggestion must include a specific next step, not just describe the problem
    must_be_compliant: suggested alternative must itself be feasible (no suggestions that are themselves blocked)
    no_bypass_suggestions: never suggest ways to bypass HARD constraints or constitutional requirements
```

---

## Solver Performance

```yaml
performance:
  latency_targets:
    simple_check (authority + capacity only): p99 < 20ms
    standard_check (all modules): p99 < 80ms
    full_check_with_alternatives: p99 < 200ms
  
  concurrency:
    evaluation_modules_run_in_parallel: all modules evaluate simultaneously; results merged
    capacity_reservation_atomic: capacity reservation uses compare-and-swap to prevent race conditions
  
  state_freshness:
    capacity_state: max 5s old (fast-changing; stale data could produce wrong FEASIBLE decision)
    agent_authority_state: max 30s old (slowly changing)
    compliance_state: max 60s old (compliance constraints change infrequently)
    cache_miss_behavior: fetch live state; add to latency; never use state older than max_age
  
  degraded_mode:
    if_module_unavailable: module returns UNKNOWN result; solver treats UNKNOWN as VIOLATION for hard constraints
    if_state_unavailable: return UNKNOWN for that constraint; block if hard constraint
    never_allow_on_uncertainty: uncertain feasibility = INFEASIBLE (conservative default)
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-constraints/constraint-model.md` | Constraint library evaluated by this solver |
| `orchestration-constraints/policy-feasibility-checker.md` | Feasibility checker orchestrates solver calls |
| `orchestration-constraints/approval-constraint-engine.md` | Approval status checked in DEPENDENCY_MODULE |
| `policy-as-code/policy-engine.md` | Solver runs before policy engine (feasibility then authorization) |
| `coordination-operations/work-distribution-engine.md` | Task assignment feasibility checked before assignment |
| `orchestration-patterns/orchestration-strategy-engine.md` | Orchestration plan feasibility verified before execution |
