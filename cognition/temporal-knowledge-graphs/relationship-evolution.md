# Relationship Evolution

## Purpose
Tracks and analyzes how relationships between entities change over time in the enterprise knowledge graph. Relationships are not static: agents gain and lose trust, delegations are granted and revoked, task assignments shift, policies supersede each other, and organizational structures reorganize. Relationship evolution provides the primitives to detect, classify, represent, and query these changes — giving the enterprise graph not just a snapshot of the present but a navigable history of how connections have evolved.

---

## Relationship Lifecycle

```
Relationship Lifecycle:

  [PROSPECTIVE]         → relationship scheduled but not yet effective
        │ valid_from arrives
        ▼
  [ACTIVE]              → relationship currently valid; both valid and believed
        │
        ├─ UPDATE event  → properties change; new edge version created; old version closed
        │
        ├─ SUPERSEDE event → higher-authority relationship of same type takes over
        │
        ├─ REVOKE event  → explicit cancellation of relationship
        │
        └─ EXPIRE event  → valid_until arrives; relationship ends naturally
        ▼
  [HISTORICAL]          → relationship ended; preserved in temporal record
        │
        └─ RETROACTIVE_CORRECTION → historical fact corrected; new version replaces old
```

---

## Evolution Event Types

```yaml
evolution_events:
  RELATIONSHIP_CREATED:
    description: a new relationship comes into existence
    trigger: APPEND_EDGE with no prior active edge of same type between same nodes
    graph_action: new edge; valid_from = event timestamp; valid_until = null
    evolution_record: {event_type: CREATED, edge_id, valid_from, created_by_episode}

  RELATIONSHIP_UPDATED:
    description: properties of an existing relationship change (weight, confidence, scope)
    trigger: APPEND_EDGE where prior active edge exists and new edge extends/updates it
    graph_action: close old edge (valid_until = now); open new edge (valid_from = now) with updated properties
    evolution_record: {event_type: UPDATED, old_edge_id, new_edge_id, changed_properties, valid_from}

  RELATIONSHIP_SUPERSEDED:
    description: a higher-priority or more-specific relationship of the same type replaces an existing one
    trigger: new edge of same type with SUPERSEDES provenance
    graph_action: close superseded edge; open superseding edge
    evolution_record: {event_type: SUPERSEDED, superseded_edge_id, superseding_edge_id, reason}

  RELATIONSHIP_REVOKED:
    description: explicit cancellation before natural expiry
    trigger: INVALIDATE_EDGE with REVOCATION reason
    graph_action: set valid_until on active edge = revocation timestamp
    evolution_record: {event_type: REVOKED, edge_id, revoked_at, revoked_by, reason}

  RELATIONSHIP_EXPIRED:
    description: natural end of a time-bounded relationship
    trigger: valid_until timestamp reached (enforced by temporal sweep job)
    graph_action: edge transitions from ACTIVE to HISTORICAL automatically
    evolution_record: {event_type: EXPIRED, edge_id, valid_until}

  RELATIONSHIP_RETROACTIVELY_CORRECTED:
    description: historical fact about a relationship is corrected
    trigger: new episode stating a past relationship was wrong or different
    graph_action: close incorrect edge (transaction_until = now); open corrected edge (same valid_from as original OR corrected valid_from)
    evolution_record: {event_type: RETROACTIVELY_CORRECTED, original_edge_id, corrected_edge_id, correction_reason, retroactive_valid_from}
    governance: all retroactive corrections flagged for lineage audit

  RELATIONSHIP_REACTIVATED:
    description: a previously closed relationship becomes valid again
    trigger: new episode re-establishing a relationship that previously ended
    graph_action: new edge (separate from historical edge; not re-opening old edge)
    evolution_record: {event_type: REACTIVATED, prior_edge_id, new_edge_id, gap_duration}
```

---

## Relationship Evolution Record

```yaml
relationship_evolution_record:
  evolution_id: "RELEVO-{edge_type}-{random_8char}"
  
  subject:
    source_node_id: node_id
    target_node_id: node_id
    edge_type: string
  
  events: [evolution_event]   # ordered chronologically
  
  evolution_metrics:
    total_activations: int            # how many times this relationship was active
    total_duration_days: float        # cumulative days the relationship was active
    average_duration_days: float      # average activation duration
    longest_activation: {from: ISO-8601, until: ISO-8601, duration_days: float}
    gap_count: int                    # how many times the relationship was interrupted
    retroactive_corrections: int      # corrections applied to this relationship history
    stability_score: float            # 1 - (update_count / expected_stable_duration); 1.0 = never changed
  
  weight_evolution:
    weight_at_creation: float
    current_weight: float
    weight_trend: INCREASING | STABLE | DECREASING | VOLATILE
    weight_history: [{timestamp: ISO-8601, weight: float, change_reason: string}]
  
  current_state:
    edge_id: edge_id | null          # null if currently inactive
    is_active: boolean
    valid_from: ISO-8601 | null
    valid_until: ISO-8601 | null
  
  metadata:
    first_created_at: ISO-8601
    last_modified_at: ISO-8601
    total_versions: int
```

---

## Evolution Patterns and Detection

```yaml
evolution_patterns:
  OSCILLATING_RELATIONSHIP:
    definition: relationship activates and deactivates repeatedly (≥ 3 cycles)
    signal: reactivation_count >= 2 within rolling 90-day window
    interpretation: unstable relationship; possible organizational friction
    action: flag for analysis; may indicate process problem or unclear ownership

  RAPIDLY_DEGRADING_TRUST:
    definition: COLLABORATES_WITH or DELEGATES_TO edge weight declining > 0.20 in 30 days
    signal: weight_history.weight_trend = DECREASING AND delta > 0.20
    interpretation: relationship health deteriorating; may need intervention
    action: emit RELATIONSHIP_HEALTH_ALERT event; notify governance dashboard

  DELEGATION_CREEP:
    definition: DELEGATES_TO chain growing in depth without corresponding revocations
    signal: max_delegation_depth for an agent increasing over rolling 30-day window
    interpretation: unchecked authority expansion; potential governance risk
    action: flag for delegation governance review; verify vs. policy POL-ORCH-001

  STALE_DEPENDENCY:
    definition: DEPENDS_ON edge between two nodes where dependency has been resolved but edge not closed
    signal: dependency target task/workflow COMPLETED but DEPENDS_ON edge still ACTIVE
    interpretation: stale graph state; dependency cleanup not triggered
    action: auto-close with EXPIRED evolution event; emit stale_edge_warning

  RELATIONSHIP_SUBSTITUTION:
    definition: one AGENT replaces another in the same role/dependency position
    pattern: A→C replaces A→B where B and C fill the same functional slot
    detection: SUPERSEDES provenance + same edge_type + same source node
    use_case: agent substitution tracking; capability continuity analysis

  AUTHORITY_CONSOLIDATION:
    definition: multiple REPORTS_TO or DELEGATES_TO relationships merging into fewer chains
    signal: in_degree of certain AGENT nodes increasing while others losing outgoing edges
    interpretation: organizational consolidation; centralization trend
    use_case: org topology evolution analysis
```

---

## Relationship Evolution Queries

```gql
# Full history of a delegation relationship
MATCH ALL_VERSIONS (a:AGENT {agent_id: "agt-001"})-[r:DELEGATES_TO]->(b:AGENT {agent_id: "agt-002"})
ORDER BY r.valid_from
RETURN r.edge_id, r.valid_from, r.valid_until, r.weight, r.confidence

# Find relationships that changed more than 3 times in the last 90 days
MATCH (a)-[r:DELEGATES_TO]->(b)
WHERE evolution_event_count(r, "2026-02-14", "2026-05-15") > 3
RETURN a, b, evolution_event_count(r, "2026-02-14", "2026-05-15") AS change_count
ORDER BY change_count DESC

# Find all retroactive corrections
MATCH (a)-[r:ANY]->(b)
WHERE r.transaction_from > r.valid_from + INTERVAL 7 DAYS
RETURN a, r, b, r.valid_from, r.transaction_from
ORDER BY (r.transaction_from - r.valid_from) DESC

# Relationship stability ranking
MATCH (a:AGENT)-[r:DELEGATES_TO]->(b:AGENT)
WHERE r.is_active = true
RETURN a, b, stability_score(r) AS stability ORDER BY stability ASC
LIMIT 20   # find most unstable delegations

# Gap analysis — relationships that were interrupted then resumed
MATCH (a)-[r:COLLABORATES_WITH]->(b)
WHERE reactivation_count(a, b, "COLLABORATES_WITH") >= 1
RETURN a, b, reactivation_count(a, b, "COLLABORATES_WITH") AS interruptions,
       total_gap_duration_days(a, b, "COLLABORATES_WITH") AS total_gap_days
```

---

## Temporal Sweep Job

```yaml
temporal_sweep:
  purpose: enforce natural relationship expiry and detect stale active edges
  frequency: every 5 minutes
  
  operations:
    expire_natural:
      scan: all active edges where valid_until IS NOT NULL AND valid_until <= NOW()
      action: transition to HISTORICAL; emit RELATIONSHIP_EXPIRED evolution event
      latency_guarantee: relationship expires within 5 minutes of valid_until

    detect_stale:
      scan: DEPENDS_ON edges where target task status = COMPLETED but edge still ACTIVE
      action: emit stale_edge_warning; queue for human review or auto-close
      
    detect_prospective_activation:
      scan: PROSPECTIVE edges where valid_from <= NOW()
      action: transition to ACTIVE; emit RELATIONSHIP_CREATED evolution event
```

---

## Integration Points

| System | Role |
|---|---|
| `temporal-knowledge-graphs/temporal-graph-model.md` | Bi-temporal fields drive evolution classification |
| `graph-cognition/graph-cognition-engine.md` | Episode ingestion triggers evolution event creation |
| `temporal-knowledge-graphs/organizational-memory-evolution.md` | Org memory captures relationship evolution patterns |
| `enterprise-topology/org-relationship-graph.md` | DELEGATES_TO / REPORTS_TO evolution tracked here |
| `graph-observability/relationship-evolution-tracking.md` | Visualization of evolution events over time |
| `graph-reasoning/organizational-intelligence.md` | Evolution patterns feed organizational intelligence reasoning |
