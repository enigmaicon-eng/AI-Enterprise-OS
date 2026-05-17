# Multi-Hop Router

## Purpose
Enables routing across multiple intermediate nodes when no direct relationship exists between a requester and the target capability, authority, or knowledge. Multi-hop routing reflects organizational reality: in a complex enterprise, the right agent for a task is rarely one direct connection away — it may require traversing team memberships, delegation chains, peer networks, and domain communities across multiple hops. The multi-hop router finds these paths, validates their authority chain integrity, and executes routing decisions that the single-hop traversal router cannot discover.

---

## Multi-Hop Routing Scenarios

```yaml
scenarios:
  AUTHORITY_ESCALATION:
    description: request needs Tier-N authority; requestor is Tier-N-2; must route through intermediate tiers
    example: Tier-1 agent needs Tier-3 approval; must go through Tier-2 intermediary who has Tier-3 access
    hops_expected: 2–3
    edge_types: [REPORTS_TO, DELEGATES_TO, ESCALATES_TO]

  EXPERTISE_DISCOVERY:
    description: no direct connection to needed expertise; must traverse collaboration and community edges
    example: requestor's team lacks ML expertise; must find it through cross-team collaboration network
    hops_expected: 2–4
    edge_types: [COLLABORATES_WITH, MEMBER_OF, PEER_OF]

  CROSS_ORG_ROUTING:
    description: task spans multiple organizations; must route across org boundaries
    example: engineering task requires compliance sign-off; must route through engineering lead → compliance org
    hops_expected: 2–5
    edge_types: [REPORTS_TO, MEMBER_OF, COLLABORATES_WITH, ESCALATES_TO]

  DELEGATION_CHAIN_ROUTING:
    description: route task to be executed by a delegate-of-a-delegate
    example: orchestrator delegates to specialist-lead who sub-delegates to specialist
    hops_expected: 2–4
    edge_types: [DELEGATES_TO]
    constraint: max 4 hops (POL-ORCH-001)

  KNOWLEDGE_RELAY:
    description: information must pass through intermediate nodes that can relay/transform it
    example: raw audit event must reach compliance lead via events bus → audit-system → compliance-ops
    hops_expected: 2–6
    edge_types: [SENDS_DATA_TO, CALLS, REPORTS_TO]

  APPROVAL_CHAIN:
    description: approval required from a party several hops away; find the approval path
    example: task requires board approval; must route through lead → committee → board
    hops_expected: 2–4
    edge_types: [ESCALATES_TO, REPORTS_TO, MEMBER_OF]
```

---

## Multi-Hop Route Discovery

```yaml
route_discovery:
  algorithm: CONSTRAINED_BFS with path quality scoring
  
  inputs:
    source_node_id: node_id
    target_criteria: {node_type, min_tier, required_capabilities, required_domain}
    max_hops: int (default 4)
    allowed_edge_types: [edge_type]
    min_path_weight: float (default 0.50)  # minimum product of edge weights
    routing_purpose: AUTHORITY | EXPERTISE | APPROVAL | DELEGATION | RELAY

  bfs_with_pruning:
    initialization:
      queue = [(source_node, [], [], 1.0, 0)]  # (node, path_nodes, path_edges, cumulative_weight, hop_count)
      visited_paths = {}   # prevent revisiting same node in same path
    
    expansion:
      for each (current_node, path, edges, weight, hops) in queue:
        if hops >= max_hops: skip
        if weight < min_path_weight: prune (further hops will only reduce weight)
        
        for each neighbor via allowed_edge_types:
          if neighbor in path: skip (no cycles)
          new_weight = weight × edge.weight × edge.confidence
          if new_weight < min_path_weight: prune
          
          new_path = path + [neighbor]
          new_edges = edges + [edge]
          
          if neighbor matches target_criteria:
            yield completed_route(new_path, new_edges, new_weight, hops+1)
          else:
            enqueue (neighbor, new_path, new_edges, new_weight, hops+1)
    
    stopping_conditions:
      max_routes_found: 20 (return after finding this many valid routes)
      max_nodes_visited: 500 (hard stop to bound computation)
      all_candidates_pruned: queue exhausted

  route_scoring:
    path_weight: cumulative product of edge weights × confidences
    hop_penalty: 0.08 × hop_count
    availability_score: fraction of intermediate nodes that are ACTIVE and below load threshold
    governance_compliance: min(governance_compliance_score) for all agent nodes on path
    composite: path_weight × availability_score × governance_compliance - hop_penalty
```

---

## Intermediate Node Validation

```yaml
intermediate_validation:
  purpose: |
    Each intermediate node in a multi-hop route must be willing and able to relay
    the routing. An intermediate that is overloaded, offline, or lacks the authority
    to pass the request invalidates the route.

  per_intermediate_checks:
    availability: status = ACTIVE AND load_factor < 0.90
    authority_relay: for DELEGATION routing — intermediate must have delegate authority
                     for the scope being relayed
    trust_relay: for APPROVAL routing — intermediate must have sufficient tier to forward
                 the approval request (cannot forward to a tier higher than their own clearance)
    classification_clearance: intermediate's clearance >= message classification
    conflict_check: intermediate must not have a conflict of interest with the task

  validation_outcome:
    ALL_VALID: route is viable
    INTERMEDIATE_UNAVAILABLE: specific intermediate node unavailable; route rejected
    AUTHORITY_GAP: intermediate cannot relay required authority; route rejected
    suggest_alternative: if route rejected, mark intermediate as blocked and find next best route

  relay_protocol:
    REQUEST_FORWARDING: source sends routing_request to hop-1 intermediate with target and hop count
    INTERMEDIATE_DECISION: intermediate can accept (forward) or reject (block) relay request
    FORWARDING_AUDIT: each relay generates a MULTI_HOP_RELAY event in audit trail
    FINAL_DELIVERY: last-hop intermediate delivers to target; confirms delivery to source
```

---

## Multi-Hop Routing Record

```yaml
multi_hop_route_record:
  route_id: "MHROUTE-{timestamp_ms}-{random_6char}"
  routing_purpose: string
  
  source:
    source_node_id: node_id
    source_type: string
  
  target:
    target_node_id: node_id | null    # null if target was specified by criteria, not ID
    target_criteria: map<string, any>
    target_resolved_node_id: node_id
  
  selected_route:
    path_nodes: [node_id]
    path_edges: [edge_id]
    hop_count: int
    composite_score: float
    path_weight: float
    estimated_relay_latency_ms: float
    all_intermediates_validated: boolean
  
  alternative_routes: [{
    path_nodes: [node_id]
    hop_count: int
    composite_score: float
    available: boolean
  }]
  
  routing_decision:
    selected_at: ISO-8601
    selected_by: agent_id | system_id
    decision_reason: string
    fallback_trigger: IMMEDIATE_FALLBACK | AFTER_TIMEOUT | MANUAL
  
  execution:
    relay_events: [{relay_agent_id, relayed_at, relay_status: ACCEPTED | REJECTED | FORWARDED}]
    delivery_confirmed: boolean
    delivery_confirmed_at: ISO-8601 | null
    total_latency_ms: int | null
```

---

## Multi-Hop Governance

```yaml
multi_hop_governance:
  max_hop_enforcement:
    DELEGATION routing: max 4 hops (POL-ORCH-001); HARD_DENY if exceeded
    AUTHORITY routing: max 5 hops (escalation chains can be deeper)
    KNOWLEDGE relay: max 6 hops (information can travel further)
    APPROVAL routing: max 4 hops (approval chains must remain auditable)

  authority_chain_preservation:
    rule: each hop in a DELEGATION route must be within the delegated scope
    violation: if any hop delegates beyond delegator's authority → HARD_DENY + CRITICAL finding
    verification: verify at route planning time AND at each relay acceptance

  audit_trail:
    every_relay: logged as MULTI_HOP_RELAY event (relay_agent_id, timestamp, scope passed)
    full_chain: audit record links all relay events for the same routing_request
    immutability: relay events written to immutable-policy-audit.md

  intermediate_accountability:
    rule: intermediates that forward requests bear relay accountability
    consequence: if target takes an unauthorized action, the relay chain is audited
    incentive: intermediates validate authority before forwarding (not just pass-through)
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-routing/graph-traversal-router.md` | Multi-hop routing extends the traversal router for complex routes |
| `graph-routing/semantic-path-finder.md` | Path finder computes candidate multi-hop routes |
| `graph-routing/delegation-graph-router.md` | Delegation chains are a key multi-hop routing case |
| `enterprise-topology/org-relationship-graph.md` | Org topology provides routing substrate |
| `delegation-and-trust/delegation-model.md` | Delegation scope validation at each hop |
| `governance-policies/immutable-policy-audit.md` | Relay events written to immutable audit |
| `runtime-policies/orchestration-runtime-policies.md` | POL-ORCH-001 max hop enforcement |
