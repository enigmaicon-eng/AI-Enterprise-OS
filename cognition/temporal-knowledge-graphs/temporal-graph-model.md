# Temporal Graph Model

## Purpose
Defines the bi-temporal modeling framework for the enterprise knowledge graph — the formal system by which every edge carries both a valid time (when the relationship was true in the world) and a transaction time (when the system recorded it). Bi-temporal modeling allows the graph to answer two fundamentally different questions: "What is true now?" and "What did we believe was true at time T?" — questions that diverge whenever facts are discovered retroactively, corrected, or superseded. This is the foundation for all historical replay, regulatory compliance verification, and organizational memory evolution.

---

## Bi-Temporal Model

```
                       TRANSACTION TIME (system recording time)
                    ───────────────────────────────────────────▶
                    
                    t₁        t₂        t₃        t₄
                    │         │         │         │
              V  ───┼─────────┼─────────┼─────────┼──▶
              A     │  E₁₁    │  E₁₂    │         │
              L     │(fact A  │(fact A  │         │
              I     │ recorded│ corrected│        │
              D     │ at t₁)  │ at t₂)  │         │
              ─     │         │         │         │
              T  ───┼─────────┼─────────┼─────────┼──▶
              I     │         │  E₂₂    │  E₂₃    │
              M     │         │(fact B  │(fact B  │
              E     │         │ recorded│ ended   │
              │     │         │ at t₂)  │ at t₃)  │
              ▼

  Each cell (valid_time × transaction_time) contains a specific edge version.
  At any query point, the bi-temporal model returns the edge that was:
    - valid in the world at the requested valid_time
    - recorded by the system by the requested transaction_time
```

---

## Temporal Dimensions

```yaml
temporal_dimensions:
  valid_time:
    definition: when the relationship or fact was true in the real world
    alias: world_time, business_time
    fields_on_edge: [valid_from, valid_until]
    semantics:
      valid_from: the moment the relationship came into existence in the world
      valid_until: the moment the relationship ceased to be true (null = still true now)
    example: "Agent Alpha was assigned to Task-007 from 2026-04-01 to 2026-04-30"
    who_sets_it: the system ingesting the episode (derived from event timestamps or explicit statement)
    can_be_retroactive: YES — if we learn a fact was true starting last month, valid_from = last month

  transaction_time:
    definition: when the system recorded or became aware of the relationship
    alias: system_time, recording_time
    fields_on_edge: [transaction_from, transaction_until]
    semantics:
      transaction_from: the moment the edge was written to the graph store (system clock)
      transaction_until: when the system stopped believing this record (usually when invalidated by new episode)
    example: "We recorded Agent Alpha's assignment at 2026-04-05 (even though it started 2026-04-01)"
    who_sets_it: the graph storage system; never set by external systems
    can_be_retroactive: NO — transaction_from is always the actual write time (system clock)
    immutable: YES — once written, transaction_from is never changed
```

---

## Temporal Edge Schema

```yaml
temporal_edge:
  # All edges carry both temporal dimensions
  
  valid_time:
    valid_from: ISO-8601           # world time: when fact became true
    valid_until: ISO-8601 | null   # world time: when fact stopped being true (null = open)

  transaction_time:
    transaction_from: ISO-8601     # system time: when we recorded this edge
    transaction_until: ISO-8601 | null  # system time: when we stopped believing this version

  computed_fields:
    is_currently_valid: valid_from <= NOW() AND (valid_until IS NULL OR valid_until > NOW())
    is_currently_believed: transaction_from <= NOW() AND (transaction_until IS NULL OR transaction_until > NOW())
    is_active: is_currently_valid AND is_currently_believed

  temporal_state:
    CURRENT: is_active = true — the relationship is valid now and we believe it
    HISTORICAL_VALID: valid_until < NOW() — relationship was valid, now ended
    SUPERSEDED: transaction_until < NOW() — we no longer believe this version
    RETROACTIVELY_ADDED: valid_from < transaction_from — we learned about it after the fact
    PROSPECTIVE: valid_from > NOW() — scheduled to become valid in the future
```

---

## Temporal Query Semantics

```yaml
temporal_query_types:
  CURRENT_STATE:
    description: what is true right now (according to current system state)
    filter: valid_from <= NOW() AND (valid_until IS NULL OR valid_until > NOW())
            AND transaction_from <= NOW() AND transaction_until IS NULL
    default: this is the default when no AT TIME clause is specified

  VALID_TIME_QUERY:
    description: what was true in the world at a specific past moment
    filter: valid_from <= target_time AND (valid_until IS NULL OR valid_until > target_time)
            AND transaction_from <= NOW() AND transaction_until IS NULL
    use_case: "What was Agent Alpha's delegation chain on 2026-03-01?"
    gql: MATCH ... AT TIME "2026-03-01T00:00:00Z"

  TRANSACTION_TIME_QUERY:
    description: what did the system believe at a past system time (regardless of world time)
    filter: valid_from <= NOW() AND transaction_from <= target_system_time
            AND (transaction_until IS NULL OR transaction_until > target_system_time)
    use_case: "What did the system record as of 2026-03-01, even about past events?"
    gql: MATCH ... AS_OF_TRANSACTION "2026-03-01T00:00:00Z"

  BI_TEMPORAL_QUERY:
    description: what did the system believe was true in the world at a specific pair of times
    filter: valid_from <= target_valid_time AND (valid_until IS NULL OR valid_until > target_valid_time)
            AND transaction_from <= target_tx_time AND (transaction_until IS NULL OR transaction_until > target_tx_time)
    use_case: regulatory replay — reconstruct exact system state at time T
    gql: MATCH ... AT TIME "2026-03-01" AS_OF_TRANSACTION "2026-03-15"

  VALID_TIME_RANGE:
    description: all edges that were valid at any point in a world-time range
    filter: valid_from < range_end AND (valid_until IS NULL OR valid_until > range_start)
    gql: MATCH ... BETWEEN "2026-01-01" AND "2026-03-31"

  EVOLUTION_QUERY:
    description: how did a specific relationship or entity change over time?
    method: retrieve all edge versions (including superseded) sorted by valid_from
    gql: MATCH ALL_VERSIONS (a)-[:EDGE_TYPE]->(b) ORDER BY valid_from
```

---

## Temporal Validity Windows

```yaml
validity_window_types:
  OPEN_ENDED:
    valid_until: null
    meaning: currently true; no known end date
    example: "Agent Alpha is a member of the Governance team" (still true)

  CLOSED:
    valid_until: ISO-8601 (not null)
    meaning: relationship had a definite end
    example: "Agent Beta was assigned to Task-007 from Apr 1 to Apr 30"

  POINT_IN_TIME:
    valid_from = valid_until
    meaning: fact was true at exactly one moment (rare; usually for events)
    example: "Approval decision was made at 14:32:05"

  PROSPECTIVE:
    valid_from > NOW()
    meaning: scheduled relationship not yet effective
    example: "Policy POL-NEW-001 becomes effective on 2026-06-01"
    use: schedule policy activations, resource reservations

  RETROACTIVE:
    transaction_from > valid_from
    meaning: we learned about this relationship after the fact
    example: recorded on May 15 that the delegation started on May 1
    governance: retroactive edges trigger lineage audit entry

validity_window_rules:
  no_time_paradox: valid_from must be <= valid_until (if valid_until is not null)
  transaction_invariant: transaction_from is always set to system write time; cannot be set in past
  overlap_detection: for REPLACES semantics, two edges of the same type between same nodes
                     should not have overlapping valid_time windows (conflict resolution closes prior)
```

---

## Temporal Conflict Resolution

```yaml
temporal_conflict_resolution:
  conflict_types:
    SUPERSEDING_FACT:
      condition: new edge of same type between same nodes with valid_from > existing edge's valid_from
      action: close existing edge (set valid_until = new edge's valid_from - 1ms)
      example: new role assignment supersedes prior role assignment

    EXTENDING_FACT:
      condition: new edge is identical to existing edge but extends valid_until
      action: update existing edge's valid_until (or remove valid_until constraint for open-ended)
      example: role assignment extended by another month

    CORRECTING_FACT:
      condition: new episode explicitly states a prior fact was wrong
      action: close incorrect edge; open corrected edge with same or adjusted valid_from
      classification: RETROACTIVE correction (transaction_from > corrected valid_from)

    CONTRADICTING_FACT:
      condition: two edges of incompatible types (e.g., APPROVED and REJECTED for same decision)
      action: flag as TEMPORAL_CONTRADICTION; do not auto-resolve; generate finding
      escalation: compliance governance lead notified for CRITICAL contradictions

  resolution_algorithm:
    step_1: extract all active edges of same type between same source/target pair
    step_2: compare new edge's valid_from against existing edges' valid windows
    step_3: classify conflict type
    step_4: apply resolution action (close, extend, or flag)
    step_5: write resolution rationale to edge provenance field
    step_6: emit TEMPORAL_CONFLICT_RESOLVED or TEMPORAL_CONTRADICTION_DETECTED event
```

---

## Temporal Snapshot Protocol

```yaml
temporal_snapshots:
  purpose: |
    Provide stable, reconstructable point-in-time snapshots of graph state.
    Used for: policy replay, regulatory examination, compliance audits,
    organizational memory queries.

  snapshot_types:
    LIVE_SNAPSHOT:
      description: current graph state; materialized on demand
      latency: p99 < 50ms for small subgraphs; p99 < 500ms for full graph

    PERIODIC_SNAPSHOT:
      description: daily full graph snapshot stored in snapshot archive
      frequency: daily at midnight UTC
      storage: compressed graph export (node + edge records with all temporal fields)
      retention: 10 years for CONSTITUTIONAL/REGULATORY; 5 years for OPERATIONAL
      use: baseline for point-in-time reconstruction when temporal_index doesn't cover period

    AUDIT_SNAPSHOT:
      description: snapshot captured before and after significant governance events
      triggers: [POLICY_ACTIVATION, POLICY_DEPRECATION, EMERGENCY_BYPASS, BOARD_DECISION]
      storage: stored in immutable-policy-audit with reference to snapshot archive
      latency: < 5 seconds after trigger event
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Engine enforces temporal model on all writes |
| `graph-cognition/graph-storage-model.md` | Temporal fields stored in edge storage records |
| `graph-cognition/graph-index-manager.md` | Temporal index partitioned by valid_from date |
| `temporal-knowledge-graphs/historical-truth-system.md` | Point-in-time queries built on this model |
| `temporal-knowledge-graphs/relationship-evolution.md` | Evolution tracking uses bi-temporal edge versions |
| `temporal-knowledge-graphs/organizational-memory-evolution.md` | Org memory queries use valid_time semantics |
| `governance-policies/policy-replay-engine.md` | Replay reconstructs graph at specific bi-temporal coordinates |
