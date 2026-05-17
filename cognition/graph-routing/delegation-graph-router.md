# Delegation Graph Router

## Purpose
Routes delegation decisions, authority verification requests, and sub-delegation grants through the enterprise knowledge graph — finding valid delegation paths, verifying authority chains, computing delegated scope at each hop, and enforcing the governance constraints that prevent unchecked authority proliferation. The delegation graph router is the operational enforcer of the enterprise's delegation governance model: it does not just find paths, it validates that each path satisfies the maximum hop constraint, the human-in-chain requirement, the scope preservation rule, and the tier ordering invariant — before any delegation is executed.

---

## Delegation Routing Architecture

```
Delegation Request (who wants to delegate what to whom?)
        ↓
[1. Delegation Scope Analysis]   → what authority scope is being delegated?
        ↓
[2. Delegator Authority Check]   → does the delegator actually have this authority?
        ↓
[3. Delegatee Qualification]     → is the delegatee eligible to receive this scope?
        ↓
[4. Chain Depth Check]           → does adding this delegation exceed max 4 hops?
        ↓
[5. Human-in-Chain Verification] → does a human remain in the resulting chain?
        ↓
[6. Scope Preservation Check]    → is delegated scope ≤ delegator's own scope?
        ↓
[7. Policy Gate]                 → policy-feasibility-checker for this delegation
        ↓
[8. Delegation Write]            → write DELEGATES_TO edge with signed delegation record
        ↓
[9. Chain Index Update]          → update delegation chain index for fast downstream queries
```

---

## Delegation Request Schema

```yaml
delegation_request:
  request_id: "DELG-{timestamp_ms}-{random_6char}"
  delegation_type: TASK_DELEGATION | AUTHORITY_DELEGATION | SCOPE_DELEGATION | EMERGENCY_DELEGATION

  delegator:
    agent_id: agent_id
    current_tier: int
    current_trust_score: float
    current_delegation_depth: int    # how deep is delegator already in a chain?

  delegatee:
    agent_id: agent_id
    tier: int
    trust_score: float
    relevant_capabilities: [capability_id]
    domain_specializations: [string]

  delegation_scope:
    task_types_permitted: [string] | "ALL"    # what task types the delegatee can execute
    domains_permitted: [string] | "ALL"
    blast_radius_ceiling: CRITICAL | HIGH | MEDIUM | LOW   # max blast radius delegatee can handle
    max_subdelegation_depth: int              # how deep can delegatee further delegate (0 = cannot)
    resource_budget: {context_tokens: int, tool_calls: int} | null
    valid_from: ISO-8601
    valid_until: ISO-8601 | null              # null = indefinite (requires Tier-3+ authority)

  delegation_context:
    triggering_task_id: task_id | null
    triggering_workflow_id: workflow_id | null
    delegation_reason: string
    urgency: ROUTINE | EXPEDITED | EMERGENCY

  requestor: agent_id | human_id
  session_id: string
```

---

## Delegation Validation Gates

```yaml
validation_gates:
  gate_1_delegator_authority:
    check: delegator has the authority they are trying to delegate
    method: query delegator's current active delegations and direct authorities
    failure_response: DENY — cannot delegate authority one does not possess
    example: delegator with tier=2 cannot delegate tier-3 authority even with valid delegation chain

  gate_2_scope_preservation:
    check: delegated scope ⊆ delegator's own scope (scope can only shrink, never grow)
    method: for each dimension of delegation_scope, verify delegator's scope ≥ delegated scope
    failure_response: DENY — scope inflation is a security violation
    examples:
      delegator has blast_radius_ceiling=HIGH → cannot delegate blast_radius_ceiling=CRITICAL
      delegator cannot delegate domains they don't themselves have access to

  gate_3_chain_depth:
    check: chain depth from originating human to delegatee ≤ 4
    method: trace DELEGATES_TO chain from delegatee back to originating human (or forward from human to delegatee)
    formula: delegatee_depth = delegator_depth + 1; must be ≤ 4
    failure_response: HARD_DENY (POL-ORCH-001) — no exception possible
    note: depth counted from originating human (human = depth 0; first AI delegate = depth 1)

  gate_4_human_in_chain:
    check: there must be a human node in the delegation chain for GOVERNANCE domain tasks
    method: traverse delegator's chain to verify human is reachable
    applies_to: any delegation that could be used for GOVERNANCE domain tasks
    failure_response: HARD_DENY (POL-ORCH-002) — non-negotiable
    compliance: directly enforces constitutional governance principle

  gate_5_tier_ordering:
    check: delegatee tier ≤ delegator tier (delegating UP the authority chain is prohibited)
    rationale: an AI agent cannot delegate to a higher-tier agent than themselves
    failure_response: DENY
    exception: humans can delegate to AI agents of any tier within their authority

  gate_6_trust_threshold:
    check: delegatee trust_score ≥ minimum_trust_for_scope
    thresholds:
      CRITICAL blast_radius: trust >= 0.75
      HIGH blast_radius: trust >= 0.65
      GOVERNANCE domain: trust >= 0.70
      default: trust >= 0.55
    failure_response: DENY — agent not trusted enough for this scope

  gate_7_policy_feasibility:
    check: run policy-feasibility-checker.md for the delegation action itself
    method: policy evaluation with action_type=DELEGATE, actor=delegator, delegatee scope
    failure_response: per policy verdict (DENY, REQUIRE_APPROVAL, HARD_DENY)

  validation_order: [1, 2, 3, 4, 5, 6, 7]   # must pass all; fast-fail order
  gate_3_and_4_are_hard_deny: cannot be overridden by any exception or emergency bypass
```

---

## Delegation Chain Index

```yaml
delegation_chain_index:
  purpose: fast lookup of complete delegation chains without traversing the graph each time
  structure:
    by_agent: {agent_id → {chain_depth, originating_human_id, chain_nodes: [node_id], chain_valid_until: ISO-8601}}
    by_human: {human_id → [all chains originating from this human]}
    by_depth: {depth → [all agents at this delegation depth]}

  update_trigger: every DELEGATES_TO edge created or invalidated
  update_latency: p99 < 100ms
  
  chain_queries:
    get_chain_for_agent: O(1) lookup (most common query)
    verify_human_in_chain: O(1) lookup via originating_human_id field
    get_all_chains_for_human: O(delegations_from_human) lookup
    get_max_depth_in_system: O(1) via aggregated index
```

---

## Emergency Delegation Protocol

```yaml
emergency_delegation:
  triggers:
    AGENT_FAILURE: primary agent offline; critical task must be reassigned urgently
    CAPACITY_EMERGENCY: primary agent overloaded; task deadline at risk
    GOVERNANCE_EMERGENCY: governance decision needed; normal chain unavailable

  special_rules:
    time_limit: emergency delegations valid for max 4 hours without Tier-4+ confirmation
    extended_limit: max 24 hours with Tier-4+ confirmation; cannot be extended further
    scope_limit: emergency delegation scope cannot exceed original assignment scope
    audit: every emergency delegation generates HIGH finding for review (legitimate emergency = closed; abuse = CRITICAL)
    human_notification: Tier-4+ notified within 30 minutes of any emergency delegation
    chain_depth_still_enforced: HARD_DENY for chain > 4 hops, even in emergencies

  emergency_delegation_record:
    delegation_type: EMERGENCY_DELEGATION
    emergency_reason: string
    emergency_authority: Tier-4+ agent_id or human_id
    valid_until: ISO-8601 (max 4 hours initially)
    review_required_by: ISO-8601 (24 hours after creation)
    finding_generated: finding_id
    Ed25519_signed_by: emergency_authority
```

---

## Delegation Routing Queries

```gql
# Full delegation chain for an agent (fast lookup)
MATCH path = (agent:AGENT {agent_id: "agt-worker-001"})-[:DELEGATES_TO*1..4]->(h:HUMAN)
WHERE ALL(r IN relationships(path) WHERE r.is_active = true)
RETURN path, length(path) AS chain_depth, path_weight(path) AS chain_strength
ORDER BY chain_strength DESC LIMIT 1

# All agents delegated to by a specific human
MATCH (h:HUMAN {human_id: "human-cgo"})-[:DELEGATES_TO*1..4]->(a:AGENT)
RETURN a, length(shortest_path((h)-[:DELEGATES_TO*]->(a))) AS depth
ORDER BY depth ASC

# Agents at maximum delegation depth (most constrained)
MATCH (a:AGENT) WHERE a.delegation_chain_depth = 4
RETURN a ORDER BY a.tier DESC

# Detect sub-delegations that breach scope
MATCH (a:AGENT)-[r1:DELEGATES_TO]->(b:AGENT)-[r2:DELEGATES_TO]->(c:AGENT)
WHERE r2.blast_radius_ceiling > r1.blast_radius_ceiling  # scope inflation
RETURN a, b, c, r1.blast_radius_ceiling, r2.blast_radius_ceiling

# Human authority coverage — which humans ultimately authorize which agents?
MATCH (h:HUMAN)-[:DELEGATES_TO*1..4]->(a:AGENT)
WHERE a.status = "ACTIVE"
RETURN h.human_id, count(a) AS agents_in_chain, collect(a.agent_id) AS agent_ids
ORDER BY agents_in_chain DESC
```

---

## Delegation Governance Invariants

```yaml
invariants:
  INVARIANT_1_MAX_DEPTH:
    statement: no DELEGATES_TO chain may exceed 4 hops from human to agent
    enforcement: HARD_DENY at gate_3; chain index checked in O(1)
    violation_response: CRITICAL alert; delegating agent suspended pending review

  INVARIANT_2_HUMAN_IN_GOVERNANCE_CHAIN:
    statement: any delegation chain used for GOVERNANCE domain must include a human node
    enforcement: HARD_DENY at gate_4; chain index checked in O(1)
    violation_response: CRITICAL alert; task blocked; escalated to Tier-4+

  INVARIANT_3_SCOPE_MONOTONE:
    statement: delegated scope can only be equal to or smaller than delegator's scope
    enforcement: DENY at gate_2; scope compared field-by-field
    violation_response: scope inflation attempt logged as SECURITY finding

  INVARIANT_4_TIER_ORDER:
    statement: delegatee tier ≤ delegator tier (for AI agents; humans exempt)
    enforcement: DENY at gate_5
    violation_response: DENY with clear error; log attempt

  any_violation_triggers: immediate policy audit; governance dashboard alert; Tier-4+ notification for HARD_DENY violations
```

---

## Integration Points

| System | Role |
|---|---|
| `enterprise-topology/org-relationship-graph.md` | DELEGATES_TO edges maintained in org graph |
| `delegation-and-trust/delegation-model.md` | Delegation semantics and contract definitions |
| `graph-routing/multi-hop-router.md` | Delegation chains are a primary multi-hop routing case |
| `runtime-policies/orchestration-runtime-policies.md` | POL-ORCH-001 (max hops) and POL-ORCH-002 (human in chain) enforced |
| `orchestration-constraints/policy-feasibility-checker.md` | Policy gate for all delegation decisions |
| `governance-policies/immutable-policy-audit.md` | All delegation events audited immutably |
| `temporal-knowledge-graphs/relationship-evolution.md` | Delegation lifecycle tracked as evolution events |
