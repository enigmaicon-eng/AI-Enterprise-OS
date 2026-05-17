# Constraint Model

## Purpose
Defines the taxonomy, schema, and semantics of all constraints that govern what the orchestration system can and cannot do. Constraints are distinct from policies: policies express rules about authorization (is the actor allowed to do this?), while constraints express feasibility bounds (is the system state compatible with this action?). The constraint model is the foundation for constraint-aware orchestration — ensuring that every execution plan is not just policy-authorized but physically and organizationally feasible given the current state of the system.

---

## Constraint Taxonomy

```yaml
constraint_taxonomy:
  AUTHORITY_CONSTRAINTS:
    definition: bounds on what decisions an actor can make given their tier, trust, and delegation chain
    examples:
      - actor_tier_ceiling: actor may not authorize actions above their tier ceiling
      - delegation_depth_limit: delegation chain may not exceed 4 hops
      - trust_score_minimum: actor trust score must meet threshold for domain
      - concurrent_authority_limit: number of active delegations held simultaneously
    enforced_by: policy-engine.md (via orchestration-runtime-policies.md)
    scope: applies at every delegation and assignment decision
  
  CAPACITY_CONSTRAINTS:
    definition: bounds on resource consumption — workers, context, tools, memory
    examples:
      - max_workers_per_workflow: maximum concurrent workers in a single workflow
      - context_token_budget: max context tokens per agent per task
      - tool_call_rate_limit: max tool calls per unit time
      - memory_allocation_ceiling: max working memory per agent
    enforced_by: resource-allocation-policies.md + constraint-solver.md
    scope: applies at resource allocation decisions and pre-execution feasibility check
  
  TIMING_CONSTRAINTS:
    definition: temporal bounds on when actions can execute and how long they may run
    examples:
      - maintenance_window_restriction: production changes only within maintenance windows
      - deadline_constraint: task must complete by a specified timestamp
      - duration_limit: task may not run longer than N hours
      - SLA_schedule: output must be delivered within SLA after trigger
    enforced_by: constraint-solver.md + workflow-engine/workflow-scheduler.md
    scope: applies at task scheduling and execution window decisions
  
  DEPENDENCY_CONSTRAINTS:
    definition: ordering requirements between tasks, artifacts, and approvals
    examples:
      - artifact_dependency: Task B cannot start until Artifact A from Task A exists
      - approval_prerequisite: task cannot proceed until approval is obtained
      - sequential_gate: quality gate must pass before next workflow phase begins
      - human_review_before_action: human review must be confirmed before AI decision executes
    enforced_by: constraint-solver.md + orchestration-dags/dependency-resolver.md
    scope: applies at DAG compilation and execution frontier advancement
  
  COMPLIANCE_CONSTRAINTS:
    definition: constraints derived from active regulatory obligations and control requirements
    examples:
      - evidence_collection_required: certain actions must generate evidence automatically
      - audit_trail_mandatory: action cannot execute in an unaudited context
      - exception_active: action is permitted only while exception EXC-X is active
      - regulatory_deadline: action must complete before regulatory deadline
    enforced_by: constraint-solver.md + compliance-framework controls
    scope: applies at pre-execution feasibility check and continuous monitoring
  
  GOVERNANCE_CONSTRAINTS:
    definition: constraints on governance processes themselves — approval chains, quorums, independence
    examples:
      - reviewer_independence: evidence reviewer must not be the evidence submitter
      - approval_quorum: approval requires N of M authorized approvers
      - conflict_of_interest: approver cannot approve decisions they have a stake in
      - constitutional_lock: certain decisions are unconditionally locked (HARD_DENY)
    enforced_by: approval-constraint-engine.md + orchestration-runtime-policies.md
    scope: applies at approval and governance action decisions
  
  ISOLATION_CONSTRAINTS:
    definition: separation and compartmentalization requirements between agents, workflows, or data
    examples:
      - workflow_isolation: two workflows may not share a worker pool segment
      - data_compartmentalization: agent in domain A may not read data classified for domain B
      - audit_isolation: audit trail writer cannot also read its own entries without authorization
      - sandbox_boundary: sandboxed agents cannot interact with non-sandboxed agents directly
    enforced_by: security-runtime-policies.md + execution-security/runtime-isolation-manager.md
    scope: applies at agent spawning and cross-workflow interaction decisions
```

---

## Constraint Record Schema

```yaml
constraint_record:
  constraint_id: "CON-{type_prefix}-{seq}"
  # type_prefix: AUTH | CAP | TIME | DEP | COMP | GOV | ISO
  
  constraint_type: AUTHORITY | CAPACITY | TIMING | DEPENDENCY | COMPLIANCE | GOVERNANCE | ISOLATION
  
  definition:
    name: string
    description: string
    hard_constraint: boolean          # hard = violation blocks execution; soft = generates warning only
    constraint_expression: string     # the evaluable expression (in condition expression language)
    violation_severity: CRITICAL | HIGH | MEDIUM | LOW
    violation_action: BLOCK | WARN | LOG | ESCALATE
  
  scope:
    applies_to_workflow_types: [string] | ALL
    applies_to_domains: [string] | ALL
    applies_to_agent_tiers: [int] | ALL
    applies_to_environments: [PRODUCTION | STAGING | DEVELOPMENT | TEST] | ALL
    exceptions_allowed: boolean
    exception_authority: int | null   # minimum tier to grant exception
  
  source:
    derived_from_policy: policy_id | null
    derived_from_obligation: obligation_id | null
    derived_from_constitution: boolean
    manual_constraint: boolean        # constraints set explicitly by Tier-4+ for specific situations
  
  lifecycle:
    active_from: ISO-8601
    active_until: ISO-8601 | null
    last_evaluated: ISO-8601 | null
    evaluation_count: int
    violation_count: int
    status: ACTIVE | SUSPENDED | EXPIRED
  
  metadata:
    created_at: ISO-8601
    created_by: agent_id | human_id
    approved_by: agent_id | human_id
    review_date: ISO-8601
```

---

## Constraint Precedence Rules

```yaml
constraint_precedence:
  # When multiple constraints conflict (e.g., a timing constraint says "execute now"
  # but a compliance constraint says "collect evidence first"), precedence determines
  # which constraint takes priority.
  
  precedence_order:
    1: CONSTITUTIONAL constraints (unconditional; cannot be overridden)
    2: GOVERNANCE constraints (approval chains, quorum requirements)
    3: COMPLIANCE constraints (regulatory obligations)
    4: ISOLATION constraints (security boundaries)
    5: AUTHORITY constraints (tier and trust requirements)
    6: DEPENDENCY constraints (ordering requirements)
    7: TIMING constraints (scheduling bounds)
    8: CAPACITY constraints (resource bounds)
  
  conflict_resolution:
    higher_precedence_wins: always
    equal_precedence_conflict: more_restrictive_wins (conservative default)
    soft_vs_hard_at_same_level: hard always wins over soft
  
  override_rules:
    constitutional_constraints: never overrideable by any authority
    governance_constraints: overrideable by Tier-4+ with board notification (for 90-day exceptions)
    compliance_constraints: overrideable by exception-management.md process (per authorization matrix)
    other_constraints: overrideable by minimum authority level specified in constraint_record.exception_authority
  
  emergency_constraint_suspension:
    authority: Tier-4+ only; cannot be delegated
    scope: specific constraint_id only; not entire constraint category
    duration: maximum 4 hours without board notification; 24 hours maximum
    documentation: emergency constraint suspension logged as CRITICAL audit event
    post_suspension_review: mandatory within 48 hours
```

---

## Standard Constraint Library

```yaml
standard_constraints:
  CON-AUTH-001:
    name: delegation_chain_max_depth
    type: AUTHORITY
    hard_constraint: true
    constraint_expression: "length(context.delegation_chain) <= 4"
    violation_severity: CRITICAL
    source: derived_from_policy: POL-ORCH-001
  
  CON-AUTH-002:
    name: human_in_governance_chain
    type: AUTHORITY
    hard_constraint: true
    constraint_expression: "has_human_in_chain(context.delegation_chain) OR resource.resource_domain != 'GOVERNANCE'"
    violation_severity: CRITICAL
    source: derived_from_policy: POL-ORCH-002
  
  CON-CAP-001:
    name: tier1_context_token_ceiling
    type: CAPACITY
    hard_constraint: true
    constraint_expression: "subject.actor_tier > 1 OR requested_context_tokens <= 50000"
    violation_severity: HIGH
  
  CON-TIME-001:
    name: production_maintenance_window
    type: TIMING
    hard_constraint: false               # soft; REQUIRE_APPROVAL route available
    constraint_expression: "context.environment != 'PRODUCTION' OR action.action_category NOT IN ['WRITE', 'CONFIGURE'] OR is_within_maintenance_window()"
    violation_severity: MEDIUM
  
  CON-DEP-001:
    name: human_review_before_high_risk_ai_decision
    type: DEPENDENCY
    hard_constraint: true
    constraint_expression: "ai_system_risk_class(resource.resource_id) != 'HIGH_RISK' OR human_review_gate_active(resource.resource_id)"
    violation_severity: CRITICAL
    source: derived_from_obligation: OBL-EUAIACT-014
  
  CON-COMP-001:
    name: evidence_collection_before_control_assertion
    type: COMPLIANCE
    hard_constraint: false               # soft; warning if evidence missing
    constraint_expression: "has_current_evidence(action.resource_id, control_id)"
    violation_severity: HIGH
  
  CON-GOV-001:
    name: reviewer_independence
    type: GOVERNANCE
    hard_constraint: true
    constraint_expression: "subject.actor_id != resource.resource_id.submitter_id"
    violation_severity: HIGH
    source: derived_from_obligation: OBL-ISO27001-AUDIT
  
  CON-ISO-001:
    name: cross_domain_data_compartmentalization
    type: ISOLATION
    hard_constraint: true
    constraint_expression: "actor_domain_clearance(subject.actor_id) INCLUDES resource.resource_domain OR resource.resource_classification IN ['PUBLIC', 'INTERNAL']"
    violation_severity: CRITICAL
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-constraints/constraint-solver.md` | Evaluates constraints against current system state |
| `orchestration-constraints/policy-feasibility-checker.md` | Constraint library consumed in feasibility analysis |
| `policy-as-code/policy-engine.md` | Policy decisions translated to constraints |
| `risk-and-controls/enterprise-risk-register.md` | Risk-derived constraints (CON-COMP-*) |
| `compliance-framework/compliance-model.md` | Obligation-derived constraints (CON-COMP-*) |
| `governance-policies/governance-traceability.md` | Constraint evaluations traced to obligations |
