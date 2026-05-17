# Graph Traversal Router

## Purpose
Routes tasks, decisions, and information to the right agents, humans, and systems by traversing the enterprise knowledge graph rather than consulting flat routing tables. Graph traversal routing is structurally aware: it follows relationship edges, respects authority chains, considers trust scores, accounts for current load and availability, and discovers routes the system was not pre-programmed with — because routes emerge from the graph topology itself. This makes routing adaptive: when an agent goes offline, when a new agent joins, or when trust patterns change, the graph traversal router discovers the updated optimal routes without manual reconfiguration.

---

## Routing Architecture

```
Routing Request (task + context + constraints)
        ↓
[1. Requirement Extraction]   → extract required capabilities, tier, domain, trust threshold
        ↓
[2. Candidate Identification] → traverse org graph to find candidate nodes
        ↓
[3. Capability Filtering]     → retain candidates with required capabilities
        ↓
[4. Availability Filtering]   → retain candidates with sufficient capacity
        ↓
[5. Authority Verification]   → verify candidate has authority for this task
        ↓
[6. Trust Scoring]            → score candidates by trust + collaboration history + load
        ↓
[7. Policy Gate]              → run policy feasibility check for top candidates
        ↓
[8. Route Selection]          → select primary + backup routes
        ↓
[9. Route Record]             → log routing decision; emit ROUTE_SELECTED event
```

---

## Routing Request Schema

```yaml
routing_request:
  request_id: "ROUTE-{timestamp_ms}-{random_6char}"
  
  task:
    task_id: task_id | null
    task_type: string
    domain: string
    required_capabilities: [capability_id]
    min_tier: int
    blast_radius: CRITICAL | HIGH | MEDIUM | LOW
    priority: CRITICAL | HIGH | MEDIUM | LOW
    classification: string
    requires_governance_oversight: boolean
    preferred_agent_id: agent_id | null   # soft preference; honored if available

  routing_constraints:
    max_load_factor: float (default 0.80)   # agents above this load excluded
    min_trust_score: float (default 0.55)
    min_governance_compliance: float (default 0.70)
    required_domain_specialization: string | null
    exclude_agent_ids: [agent_id]          # agents to avoid (conflicts, open findings, etc.)
    geography_restriction: string | null   # for data residency requirements
    same_team_preferred: boolean (default false)
    forbid_same_agent_as: agent_id | null  # independence requirement (approvals)

  routing_context:
    requestor_agent_id: agent_id
    workflow_id: workflow_id | null
    session_id: string
    urgency: REALTIME | HIGH | NORMAL | BACKGROUND
    deadline: ISO-8601 | null
    allow_queue: boolean                   # can task be queued if no agent immediately available?
    alternatives_requested: int (default 3)
```

---

## Candidate Discovery via Graph Traversal

```yaml
candidate_discovery:
  traversal_strategy: MULTI_HOP_BFS from requestor_agent's organizational position
  
  discovery_steps:
    step_1_local_team:
      query: MATCH (requestor:AGENT)-[:MEMBER_OF]->(team:TEAM)<-[:MEMBER_OF]-(candidate:AGENT)
             WHERE candidate.tier >= min_tier AND candidate.status = "ACTIVE"
      priority: HIGHEST (local team members are fastest to coordinate with)
      
    step_2_peer_org:
      query: MATCH (requestor:AGENT)-[:MEMBER_OF]->(org:ORGANIZATION)<-[:MEMBER_OF]-(candidate:AGENT)
             WHERE candidate.tier >= min_tier AND candidate.status = "ACTIVE"
      priority: HIGH

    step_3_trusted_collaborators:
      query: MATCH (requestor:AGENT)-[r:COLLABORATES_WITH]->(candidate:AGENT)
             WHERE r.trust_score >= min_trust_score AND candidate.status = "ACTIVE"
             AND candidate.tier >= min_tier
      priority: HIGH (proven relationship)

    step_4_domain_community:
      query: MATCH (candidate:AGENT)-[:MEMBER_OF]->(c:COMMUNITY {domain: required_domain})
             WHERE candidate.tier >= min_tier AND candidate.status = "ACTIVE"
      priority: MEDIUM (domain expertise match)

    step_5_delegation_reach:
      query: MATCH path = (requestor:AGENT)-[:DELEGATES_TO*1..2]->(delegate:AGENT)
             WHERE delegate.tier >= min_tier AND delegate.status = "ACTIVE"
      priority: MEDIUM (already in delegation chain)

    step_6_global_registry:
      query: MATCH (candidate:AGENT)
             WHERE candidate.tier >= min_tier AND candidate.status = "ACTIVE"
             AND $required_capabilities ALL IN candidate.capabilities
      priority: LOW (fallback when local traversal finds no candidates)
      
  candidate_deduplication: collect unique candidates across all steps; preserve best discovery_priority
  max_candidates_per_step: 20
  max_total_candidates: 50 (sufficient for scoring; avoids over-computation)
```

---

## Candidate Scoring

```yaml
candidate_scoring:
  score_components:
    capability_match:
      formula: |count(required_capabilities ∩ candidate.capabilities)| / |required_capabilities|
      weight: 0.25
      note: partial match allowed; penalized relative to full match

    trust_score:
      value: candidate.trust_score
      weight: 0.20

    relationship_strength:
      value: COLLABORATES_WITH edge weight between requestor and candidate (0.0 if no edge)
      weight: 0.15
      note: boosts agents with proven working relationship

    availability:
      value: 1.0 - candidate.load_factor
      weight: 0.15
      note: busy agents penalized; agents at > 0.90 load disqualified

    governance_compliance:
      value: candidate.governance_compliance_score
      weight: 0.15

    domain_specialization:
      value: 1.0 if required_domain in candidate.domain_specializations ELSE 0.50
      weight: 0.10

  penalty_adjustments:
    open_CRITICAL_finding: -0.30
    calibration_error_above_threshold: -0.20
    recent_escalation_in_domain: -0.10
    load_factor_above_0.85: -0.20 (in addition to availability score)
    tier_less_than_min: DISQUALIFIED (not just penalized)

  disqualification_rules:
    CRITICAL_blast_radius_task: DISQUALIFIED if agent has open CRITICAL finding
    GOVERNANCE_domain: DISQUALIFIED if agent has no human in delegation chain
    required_capability_missing: DISQUALIFIED
    status_not_ACTIVE: DISQUALIFIED (DEGRADED agents may be available but penalized 0.20)
    load_factor_above_0.95: DISQUALIFIED

  composite_score: weighted sum of score_components minus penalty_adjustments
  minimum_scores:
    CRITICAL blast_radius: 0.70
    HIGH blast_radius: 0.55
    MEDIUM blast_radius: 0.45
    LOW blast_radius: 0.40
  
  no_qualified_candidate:
    if all candidates below minimum_score:
      if allow_queue: queue task; emit TASK_QUEUED_PENDING_AGENT
      else: return ROUTING_FAILED with reasons
```

---

## Route Selection and Output

```yaml
route_selection:
  primary_route:
    selection: highest composite_score candidate that passes policy gate
    policy_gate: run policy-feasibility-checker.md for top-3 candidates; use first PROCEED/PROCEED_WITH_CONDITIONS result

  backup_routes:
    count: min(alternatives_requested, qualified_candidate_count - 1)
    selection: next highest-scoring candidates (after primary) that pass policy gate
    purpose: automatic failover if primary agent becomes unavailable before task starts

  route_record:
    route_id: "REC-ROUTE-{timestamp_ms}-{random_6char}"
    request_id: string
    task_id: task_id | null
    routing_decision:
      primary_agent_id: agent_id
      primary_agent_score: float
      backup_agent_ids: [agent_id]
      routing_reason: string
      candidates_evaluated: int
      candidates_disqualified: int
      routing_strategy_used: string
    routing_constraints_applied: {max_load_factor, min_trust_score, ...}
    policy_verdict: PROCEED | PROCEED_WITH_CONDITIONS | REQUIRE_APPROVAL
    conditions_applied: [condition] | null
    timestamp: ISO-8601
    latency_ms: int
```

---

## Adaptive Routing

```yaml
adaptive_routing:
  purpose: routing decisions improve over time based on outcomes

  outcome_feedback:
    SUCCESS: primary agent successfully completed task
      → reinforce COLLABORATES_WITH edge between requestor and agent (+0.02)
      → note successful domain+tier combination in routing memory

    FAILURE: primary agent failed task
      → update routing memory with failure signal for this agent+task_type combination
      → trigger automatic failover to backup agent if available

    REJECTION: primary agent rejected or could not start task
      → immediate failover to backup
      → log rejection reason; update availability model

    TIMEOUT: agent did not respond within deadline
      → mark agent as DEGRADED in runtime state graph
      → immediate failover to backup

  routing_memory:
    storage: graph edge on COLLABORATES_WITH (extended with task_type performance metrics)
    keys: (agent_id, task_type, domain)
    values: {success_count, failure_count, avg_duration_minutes, last_outcome}
    decay: 90-day half-life (recent outcomes matter more)
    use_in_scoring: success_rate_for_task_type → small boost/penalty to composite score

  dynamic_load_balancing:
    trigger: all CRITICAL/HIGH blast_radius agents above 0.80 load
    action: route to Tier-2 agents if task can be handled at that tier; notify Tier-3+
    no_shedding: GOVERNANCE domain tasks never routed below min_tier regardless of load
```

---

## Integration Points

| System | Role |
|---|---|
| `enterprise-topology/org-relationship-graph.md` | Candidate discovery traverses org topology |
| `temporal-knowledge-graphs/runtime-state-graph.md` | Agent availability and load from runtime state |
| `graph-memory/relationship-memory.md` | Relationship memory informs scoring |
| `orchestration-constraints/risk-aware-router.md` | Risk-based routing coordinates with traversal router |
| `orchestration-constraints/policy-feasibility-checker.md` | Policy gate for selected candidates |
| `graph-routing/delegation-graph-router.md` | Delegation routing for authority-specific requests |
| `graph-routing/multi-hop-router.md` | Multi-hop routing when no direct route available |
