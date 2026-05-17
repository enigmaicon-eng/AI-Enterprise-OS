# Delegation Model

## Purpose
Defines how authority, tasks, and decision-making power flow between agents in the enterprise. Delegation is the mechanism by which higher-tier agents assign work to lower-tier agents while retaining appropriate oversight. A disciplined delegation model prevents both under-delegation (bottlenecks at senior agents) and over-delegation (loss of governance control).

---

## Delegation Principles

```yaml
delegation_principles:
  AUTHORITY_BOUNDED_BY_GRANTOR:
    statement: An agent can only delegate authority it actually holds; never more.
    implication: A T2 agent cannot delegate T3 authority, even by claiming the work requires it.
  
  DELEGATION_DOES_NOT_TRANSFER_ACCOUNTABILITY:
    statement: The delegating agent remains accountable for the outcome of delegated work.
    implication: Delegation is not a mechanism to escape responsibility.
  
  EXPLICIT_NOT_IMPLICIT:
    statement: Delegated authority must be explicitly specified in the delegation record; nothing is implied.
    implication: An agent cannot infer additional authority from context. If it's not stated, it's not granted.
  
  MINIMUM_NECESSARY_SCOPE:
    statement: Delegate only the authority necessary to complete the specific task; no excess.
    implication: Never delegate "manage this domain" when "produce this specific artifact" suffices.
  
  REVOCABILITY:
    statement: Any delegation can be revoked by the grantor at any time.
    implication: Revocation is immediate; the delegatee must stop work on the delegated task.
  
  AUDIT_TRAIL:
    statement: Every delegation event — creation, exercise, revocation — is recorded.
    implication: The full delegation chain for any decision is always reconstructible.
```

---

## Delegation Types

```yaml
delegation_types:
  TASK_DELEGATION:
    description: Assign a specific task to another agent
    authority_transferred: authority to complete this specific task and produce its deliverable
    decision_authority: agent can make task-level decisions within task scope
    cannot: change task scope, delegate to further sub-agents beyond what grantor authorized
    typical: orchestrator → worker (most common delegation)
  
  DOMAIN_DELEGATION:
    description: Assign authority over a bounded domain within a larger task
    authority_transferred: can make decisions within domain; can recruit sub-agents for domain work
    cannot: cross domain boundaries; change domain scope without grantor approval
    typical: apex coordinator → domain coordinator in FEDERATED_HIERARCHY
    requires: Tier-3+ grantor OR explicit Tier-3 authorization for T2 grantors
  
  REPRESENTATION_DELEGATION:
    description: Agent acts as representative of grantor in a specific context
    authority_transferred: can communicate and decide on grantor's behalf in defined context
    cannot: exceed grantor's own authority; create binding commitments beyond context
    typical: agent representing human stakeholder in a workflow
    requires: explicit human authorization; recorded in delegation-and-trust
  
  EMERGENCY_DELEGATION:
    description: Rapid delegation during an incident or emergency
    authority_transferred: broader than normal; includes authority to recruit agents and escalate
    duration: time-bounded (maximum 4 hours; must be renewed)
    requires: Tier-4+ authorization or explicit emergency declaration
    additional_oversight: all emergency delegation decisions flagged for post-incident review
```

---

## Delegation Record Schema

```yaml
delegation_record:
  delegation_id: "DEL-{task_id}-{seq}"
  delegation_type: TASK | DOMAIN | REPRESENTATION | EMERGENCY
  
  # Parties
  grantor:
    agent_id: string
    tier: int
    authority_basis: string          # what gives grantor the right to make this delegation
  
  delegatee:
    agent_id: string
    tier: int
    acknowledged: boolean            # delegatee must explicitly accept
    acknowledged_at: ISO-8601 | null
  
  # Scope
  scope:
    task_id: string                  # what task/work this delegation covers
    deliverable: string              # what the delegatee must produce
    authority_ceiling: {             # explicit upper bounds on delegatee authority
      max_spend_agent_hours: float | null
      max_sub_delegation_depth: int  # 0 = no sub-delegation; 1 = can delegate once; etc.
      domain_restriction: string | null  # if set, delegatee cannot act outside this domain
      capability_restriction: [string] | null  # if set, only these capabilities authorized
    }
    decision_authority: [string]     # explicit list of decision types delegatee can make
    explicit_exclusions: [string]    # decision types delegatee CANNOT make (escalate instead)
  
  # Time and Status
  effective_from: ISO-8601
  expires_at: ISO-8601 | null        # null only for ongoing domain roles; emergency must have expiry
  status: PENDING | ACTIVE | COMPLETED | REVOKED | EXPIRED
  
  # Governance
  requires_grantor_review: boolean   # must deliverable be reviewed by grantor before delivery?
  escalation_path: [agent_id | human_id]
  created_at: ISO-8601
  created_by: agent_id | human_id
  revoked_at: ISO-8601 | null
  revoked_by: agent_id | human_id | null
  revocation_reason: string | null
```

---

## Delegation Depth and Chains

```yaml
delegation_chains:
  depth_rules:
    maximum_chain_depth: 4
    (human → T4 → T3 → T2 → T1 is the deepest legitimate chain)
    beyond_depth_4: requires explicit governance approval (rare; enterprise-wide impact tasks)
  
  sub_delegation:
    rule: delegatee can only sub-delegate if grantor explicitly set max_sub_delegation_depth > 0
    rule: each sub-delegation reduces remaining depth by 1
    rule: sub-delegatee's authority cannot exceed delegatee's received authority
    anti_pattern: "delegation laundering" — using sub-delegation chains to bypass authority limits
      detection: any sub-delegation where sub-delegatee ends up with capabilities > grantor had
      consequence: full chain invalidated; governance violation
  
  chain_reconstruction:
    any task or decision can be traced back to its originating human authority
    chain: human_sponsor → apex_coordinator → domain_coordinator → worker
    each link: a delegation_record with full scope specification
    audit: the complete chain is the provenance of the task's authority
```

---

## Delegation Lifecycle

```yaml
delegation_lifecycle:
  CREATION:
    grantor creates delegation_record with scope and authority specification
    system validates: grantor has authority to grant what's being granted
    system validates: delegatee meets minimum tier requirements
    delegatee notified and must acknowledge within 2 minutes (or delegation is cancelled)
  
  ACTIVATION:
    status set to ACTIVE upon delegatee acknowledgment
    delegatee can begin executing within delegated scope
    delegation visible in both grantor and delegatee's active delegation lists
  
  EXERCISE:
    all decisions made under this delegation are tagged with delegation_id
    decisions exceeding scope → delegation engine flags for escalation (see authority-transfer-protocol)
    grantor can view all delegation exercise events in real time
  
  COMPLETION:
    delegatee delivers deliverable within delegation scope
    if requires_grantor_review: grantor reviews before marking COMPLETED
    status set to COMPLETED; delegation_id archived in task lineage
  
  REVOCATION:
    grantor can revoke at any time; reason is required
    immediate effect: delegatee notified; status set to REVOKED
    in-progress work: delegatee has 5 minutes to reach a safe stopping point
    work-in-progress handoff: delegatee must produce a handoff note for grantor
    no appeal: revocation is not reversible by delegatee
  
  EXPIRY:
    if expires_at passes without COMPLETED status → status set to EXPIRED
    expired delegations: treated as REVOKED; all same protocols apply
    expired EMERGENCY_DELEGATION: additional Tier-4 review required
```

---

## Delegation Governance

```yaml
delegation_governance:
  policies:
    POLICY-DEL-001:
      name: no_authority_inflation
      rule: delegated authority cannot exceed grantor's own authority at time of delegation
      enforcement: authority validation check at delegation creation; chain audit monthly
    
    POLICY-DEL-002:
      name: no_self_delegation
      rule: an agent cannot delegate to itself (task reassignment must go through grantor)
    
    POLICY-DEL-003:
      name: delegation_requires_acknowledgment
      rule: delegations are not active until delegatee explicitly acknowledges
      enforcement: 2-minute acknowledgment timeout → cancellation
    
    POLICY-DEL-004:
      name: governance_decisions_require_human_in_chain
      rule: any delegation chain involving GOVERNANCE capabilities must have a human as grantor or immediate reviewer
      enforcement: delegation creation check; flagged if no human in chain for GOVERNANCE work
    
    POLICY-DEL-005:
      name: emergency_delegation_is_time_bounded
      rule: EMERGENCY_DELEGATION always has an explicit expiry (max 4 hours)
      enforcement: system enforces expiry; renewal requires new delegation record
    
    POLICY-DEL-006:
      name: complete_scope_specification
      rule: delegation_records must have explicit decision_authority and explicit_exclusions
      enforcement: schema validation at creation; incomplete records rejected
  
  audit:
    frequency: monthly
    checks:
      - all active delegations have valid scope (not expired, not over-depth)
      - no delegation_id used on tasks outside its defined scope
      - all EMERGENCY delegations have expired or been renewed with authorization
      - chain depth compliance across all active delegation chains
    report: monthly delegation audit → capability governance lead
```

---

## Integration Points

| System | Role |
|---|---|
| `delegation-and-trust/trust-propagation-engine.md` | Trust scores inform delegation decisions |
| `delegation-and-trust/authority-transfer-protocol.md` | Formal authority transfer per this model |
| `delegation-and-trust/inter-agent-contracts.md` | Delegation is one type of inter-agent contract |
| `delegation-and-trust/delegation-governance.md` | Policy and audit framework for delegation |
| `orchestration-patterns/hierarchical-orchestration.md` | Delegation flows define hierarchical authority |
| `orchestration-patterns/dynamic-team-formation.md` | Team charter includes delegation specifications |
| `agent-capabilities/agent-capability-governance.md` | Capability authorization governs what can be delegated |
