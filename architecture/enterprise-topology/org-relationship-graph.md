# Org Relationship Graph

## Purpose
Maintains the live, evolving graph of organizational relationships across all agents, humans, teams, and governing bodies in the enterprise. The org relationship graph is the structural foundation for authority derivation, delegation chain verification, expertise location, team formation, and escalation routing. It answers the essential governance question at every level: "Who is responsible for this, who has authority over it, and who has the expertise to handle it?" Every relationship in this graph carries temporal validity, trust weight, and provenance — ensuring organizational structure is as queryable, auditable, and evolvable as any other enterprise data.

---

## Org Graph Node Types

```yaml
org_nodes:
  AGENT_NODE:
    fields:
      agent_id: string
      tier: int [1, 5]
      agent_type: ORCHESTRATOR | SPECIALIST | WORKER | GOVERNANCE | HUMAN_PROXY
      status: ACTIVE | IDLE | DEGRADED | OFFLINE | SUSPENDED
      organization_id: string
      capabilities: [capability_id]
      trust_score: float
      governance_compliance_score: float
      domain_specializations: [string]
      reporting_chain_depth: int           # how deep in the org chart

  HUMAN_NODE:
    fields:
      human_id: string
      role: string
      tier_equivalent: int                 # governance tier for approval purposes
      domain_expertise: [string]
      organization_id: string
      delegation_limit: int                # max delegation depth this human can authorize

  TEAM_NODE:
    fields:
      team_id: string
      team_name: string
      team_type: FUNCTIONAL | PROJECT | GOVERNANCE | DOMAIN | CROSS_FUNCTIONAL
      domain: string
      owner_id: agent_id | human_id
      member_count: int
      formation_type: STATIC | DYNAMIC

  ORGANIZATION_NODE:
    fields:
      org_id: string
      org_name: string
      org_type: PM | ENGINEERING | QA | GOVERNANCE | COMPLIANCE | ANALYTICS | SECURITY
      parent_org_id: string | null
      lead_id: agent_id | human_id
      agent_count: int
      human_count: int

  GOVERNING_BODY_NODE:
    fields:
      body_id: string
      body_type: BOARD | COMMITTEE | PANEL | REVIEW_BOARD
      members: [human_id]
      quorum_required: int
      authority_scope: [string]
      authority_tier: int
```

---

## Org Relationship Edge Types

```yaml
org_edges:
  REPORTS_TO:
    semantics: direct hierarchical reporting relationship
    source: AGENT | HUMAN
    target: AGENT | HUMAN | TEAM | ORGANIZATION
    properties: [reporting_type, effective_from]
    temporal: true
    governance_weight: 1.0   # hardest structural relationship

  DELEGATES_TO:
    semantics: authority delegated from A to B for a defined scope
    source: AGENT | HUMAN
    target: AGENT
    properties: [delegation_id, scope, max_subdelegation_depth, delegation_chain_depth]
    temporal: true
    governance_weight: weight field (1.0 = full scope; 0.5 = partial)

  MEMBER_OF:
    semantics: agent or human is a member of a team or organization
    source: AGENT | HUMAN
    target: TEAM | ORGANIZATION | GOVERNING_BODY
    properties: [membership_type: CORE | EXTENDED | ADVISORY, joined_at]
    temporal: true

  LEADS:
    semantics: agent or human leads/owns a team or organization
    source: AGENT | HUMAN
    target: TEAM | ORGANIZATION | GOVERNING_BODY
    properties: [leadership_type: OWNER | STEWARD | CHAIR, effective_from]
    temporal: true

  COLLABORATES_WITH:
    semantics: regular working relationship with interaction history
    source: AGENT | HUMAN
    target: AGENT | HUMAN
    properties: [weight, trust_score, interaction_count, avg_collaboration_quality]
    temporal: true

  ESCALATES_TO:
    semantics: defined escalation path for specific domains or severity levels
    source: AGENT | TEAM
    target: AGENT | HUMAN | GOVERNING_BODY
    properties: [escalation_domain, min_severity, response_sla_hours]
    temporal: false   # escalation paths are semi-permanent

  PEER_OF:
    semantics: same tier, same organization — peer relationship
    source: AGENT
    target: AGENT
    properties: [peer_type: SAME_TEAM | CROSS_TEAM | CROSS_ORG]
    temporal: false

  ADVISES:
    semantics: advisory relationship (non-authoritative guidance)
    source: AGENT | HUMAN
    target: AGENT | HUMAN | TEAM
    properties: [domain, advisory_frequency]
    temporal: true
```

---

## Authority Chain Model

```yaml
authority_chain:
  definition: |
    The ordered sequence of delegation edges connecting a human principal
    to any AI agent currently acting on their behalf. The authority chain
    is the governance proof that an AI agent's actions are ultimately
    traceable to human authorization.

  chain_properties:
    max_depth: 4 hops (enforced by POL-ORCH-001)
    must_originate_from_human: true (chain must start with a HUMAN_NODE)
    must_have_human_in_governance_domain: true (POL-ORCH-002 HARD_DENY)
    each_hop_weight: delegated weight <= delegator's current weight
    chain_valid_until: minimum(valid_until of all edges in chain)

  chain_verification:
    method: traverse DELEGATES_TO edges from agent to human origin
    checks:
      1. chain depth <= 4
      2. chain originates at HUMAN_NODE
      3. all edges currently valid (valid_until IS NULL OR > NOW())
      4. all edge signatures verified (Ed25519)
      5. GOVERNANCE domain: human node present in chain
    result: VALID | INVALID_DEPTH | MISSING_HUMAN | BROKEN_CHAIN | EXPIRED_EDGE

  authority_chain_query:
    gql: |
      MATCH path = (agent:AGENT {agent_id: $agent_id})-[:DELEGATES_TO*1..4]->(origin)
      WHERE origin.node_type = "HUMAN"
      RETURN path, length(path) AS chain_depth, path_weight(path) AS chain_strength
      ORDER BY chain_strength DESC
```

---

## Org Graph Queries

```gql
# Full org chart from a specific organization
MATCH (o:ORGANIZATION {org_id: "org-governance"})<-[:MEMBER_OF]-(a:AGENT)
MATCH (a)-[:REPORTS_TO]->(lead)
RETURN a, lead ORDER BY a.tier DESC

# Delegation chains for a specific agent
MATCH path = (agent:AGENT {agent_id: "agt-worker-001"})-[:DELEGATES_TO*1..4]->(h:HUMAN)
RETURN path, length(path) AS depth ORDER BY depth ASC

# All peer agents of a given agent
MATCH (a:AGENT {agent_id: "agt-001"})-[:PEER_OF]->(b:AGENT)
RETURN b ORDER BY b.trust_score DESC

# Find the shortest escalation path from an agent to a governing body
MATCH path = shortestPath(
  (a:AGENT {agent_id: "agt-worker-001"})-[:ESCALATES_TO|REPORTS_TO*]->(g:GOVERNING_BODY)
)
RETURN path, length(path) AS escalation_hops

# Governance domain agents with human in chain
MATCH path = (a:AGENT)-[:DELEGATES_TO*1..4]->(h:HUMAN)
WHERE a.domain_specializations CONTAINS "GOVERNANCE"
RETURN a, path

# Dynamic team recommendation for a governance task
MATCH (a:AGENT)
WHERE a.tier >= 2 AND "GOVERNANCE" IN a.domain_specializations
MATCH (a)-[r:COLLABORATES_WITH]->(b:AGENT)
WHERE r.trust_score > 0.75 AND b.tier >= 2
RETURN a, collect(b) AS trusted_collaborators
```

---

## Org Graph Maintenance

```yaml
org_graph_maintenance:
  automatic_updates:
    agent_registration: AGENT_NODE created on agent deployment
    agent_decommission: AGENT_NODE status = OFFLINE; all active DELEGATES_TO edges closed
    delegation_grant: DELEGATES_TO edge appended
    delegation_revoke: DELEGATES_TO edge invalidated (valid_until = now)
    team_formation: TEAM_NODE created; MEMBER_OF edges appended
    team_dissolution: TEAM_NODE status = DISSOLVED; all MEMBER_OF edges closed

  consistency_checks:
    daily:
      - verify all DELEGATES_TO chains respect max depth of 4
      - verify all GOVERNANCE domain agents have human in chain
      - verify no AGENT_NODE with ACTIVE status has zero REPORTS_TO edges (orphan agent)
      - verify REPORTS_TO edges have valid targets (no dangling edges)
    weekly:
      - community recompute for all ORGANIZATIONAL communities
      - authority chain verification for all active agents
      - escalation path integrity check

  governance_alerts:
    ORPHAN_AGENT: AGENT with no REPORTS_TO or MEMBER_OF edges → alert Tier-3+
    BROKEN_AUTHORITY_CHAIN: agent acting without valid human in chain → CRITICAL alert
    DELEGATION_DEPTH_BREACH: chain > 4 hops detected → HARD_DENY + alert
    GOVERNANCE_DOMAIN_NO_HUMAN: GOVERNANCE task with no human in chain → HARD_DENY
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-schema.md` | Org node and edge types defined in schema |
| `delegation-and-trust/delegation-model.md` | Delegation model provides delegation semantics |
| `temporal-knowledge-graphs/relationship-evolution.md` | Org relationship changes tracked as evolution events |
| `orchestration-dags/graph-native-delegation.md` | Delegation routing traverses this graph |
| `graph-routing/delegation-graph-router.md` | Authority chain traversal for routing |
| `graph-reasoning/organizational-intelligence.md` | Org intelligence derived from this graph |
| `runtime-policies/orchestration-runtime-policies.md` | POL-ORCH-001/002 enforced using chain queries |
