# Historical Truth System

## Purpose
Provides the query interface and reconstruction protocol for answering questions about what was true at any point in the past. The historical truth system distinguishes between three different historical questions that require different answers: "What was true then?", "What did we know then?", and "What should we have known then?" — each requiring different temporal coordinates and different subsets of the bi-temporal graph. This system is the foundation for regulatory compliance replay, governance audit, incident reconstruction, and organizational learning.

---

## The Three Historical Questions

```
Question 1: "What was true in the world at time T?"
  → Valid-time query
  → Filter: valid_from <= T AND (valid_until IS NULL OR valid_until > T)
  → Transaction time: current (we use our best current knowledge of what was happening then)
  → Use case: "What was the delegation chain on March 1, 2026?"

Question 2: "What did the system believe at time T?"
  → Transaction-time query
  → Filter: transaction_from <= T AND (transaction_until IS NULL OR transaction_until > T)
  → Valid time: as-of T (includes only facts recorded by T)
  → Use case: "What did we know about this agent's status when we made the decision at T?"

Question 3: "What was the exact system state used to make decision D?"
  → Bi-temporal query using the decision's exact valid_time + transaction_time coordinates
  → Reconstructs precise subgraph state the policy engine evaluated
  → Use case: compliance replay; audit verification; incident root cause
```

---

## Historical Truth Query Schema

```yaml
historical_truth_query:
  query_id: "HISTQ-{timestamp_ms}-{random_6char}"

  query_type:
    VALID_TIME:
      description: what was true in the world at target_valid_time
      temporal_filter:
        valid_from: <= target_valid_time
        valid_until: IS NULL OR > target_valid_time
        transaction_from: <= NOW()          # use all currently-known information
        transaction_until: IS NULL
      parameters: {target_valid_time: ISO-8601}

    TRANSACTION_TIME:
      description: what did the system believe at target_transaction_time
      temporal_filter:
        transaction_from: <= target_transaction_time
        transaction_until: IS NULL OR > target_transaction_time
        valid_from: <= target_transaction_time  # only facts valid as-of recording
      parameters: {target_transaction_time: ISO-8601}

    BI_TEMPORAL:
      description: exact system state at specific valid_time + transaction_time pair
      temporal_filter:
        valid_from: <= target_valid_time
        valid_until: IS NULL OR > target_valid_time
        transaction_from: <= target_transaction_time
        transaction_until: IS NULL OR > target_transaction_time
      parameters: {target_valid_time: ISO-8601, target_transaction_time: ISO-8601}

    DECISION_REPLAY:
      description: reconstruct the exact subgraph used for a specific policy decision
      method: retrieve decision record from immutable-policy-audit; extract evaluation_context_hash;
              use decision.valid_time + decision.transaction_time for bi-temporal query;
              scope query to entities in evaluation_context
      parameters: {policy_decision_id: string}

    EVOLUTION_RANGE:
      description: all states of a relationship or entity across a time range
      temporal_filter: valid_from < range_end AND (valid_until IS NULL OR valid_until > range_start)
      returns: all edge versions (including superseded), ordered by valid_from
      parameters: {range_start: ISO-8601, range_end: ISO-8601}

  scope:
    anchor_entities: [entity_id] | null    # scope query to subgraph around these entities
    max_hops: int (default 3)
    node_types: [node_type] | null
    edge_types: [edge_type] | null
    classification_ceiling: string | null

  requestor: agent_id | human_id
  purpose: AUDIT | COMPLIANCE_REPLAY | INCIDENT_INVESTIGATION | REGULATORY_EXAMINATION | ANALYTICS
```

---

## Historical Truth Response

```yaml
historical_truth_response:
  query_id: string
  query_type: string

  temporal_coordinates:
    valid_time_used: ISO-8601 | null
    transaction_time_used: ISO-8601 | null
    current_time_at_query: ISO-8601    # when this historical query was run

  subgraph:
    nodes: [graph_node]                # nodes as they existed at the queried time
    edges: [graph_edge]                # edges valid at the queried time
    edge_versions_included: int        # total edge records considered (including superseded)
    retroactive_edges_excluded: int    # edges recorded after target_transaction_time (for tx-time queries)

  truth_classification:
    for_valid_time_query:
      facts_current_at_time: int       # edges where valid_from <= T <= valid_until
      facts_retroactively_added: int   # edges with transaction_from > valid_from (learned after the fact)
      facts_later_corrected: int       # edges that were subsequently superseded or corrected
    for_transaction_time_query:
      facts_known_at_time: int
      facts_later_discovered: int      # facts valid at T but recorded after T (not known at T)
      facts_later_corrected: int

  certainty_assessment:
    overall_certainty: CERTAIN | HIGH | MEDIUM | LOW
    uncertainty_sources: [string]      # e.g., "3 edges were retroactively corrected after query time"
    completeness_estimate: float       # estimated fraction of true facts captured
```

---

## Point-in-Time Reconstruction Protocol

```yaml
reconstruction_protocol:
  purpose: |
    For regulatory examination, compliance replay, and incident investigation —
    reconstruct the exact state of the enterprise knowledge graph at a specific moment.
    This is a formal, auditable procedure, not just a query.

  reconstruction_steps:
    step_1_identify_coordinates:
      action: establish target valid_time and transaction_time
      source: policy_decision_record (for DECISION_REPLAY) or examiner specification
      record: coordinates written to reconstruction_record before proceeding

    step_2_verify_temporal_index:
      action: verify temporal_index covers the target date
      if_covered: proceed with index-based reconstruction
      if_not_covered: fall back to periodic_snapshot (daily snapshots in graph-storage-model.md)
      if_snapshot_not_available: reconstruct by replaying all episodes up to target time

    step_3_assemble_subgraph:
      action: execute bi-temporal GQL query over target scope
      scope: all entities relevant to the subject of reconstruction
      include: [nodes, edges, edge_temporal_fields, edge_provenance]

    step_4_verify_completeness:
      action: check if any episodes in scope were ingested after target_transaction_time
      (these represent facts known now but not known at the target time)
      flag: retroactively_added_facts count
      completeness_note: appended to reconstruction_record

    step_5_integrity_verification:
      action: verify edge_hash chain for all edges included in reconstruction
      purpose: confirm graph records have not been altered since they were written
      failure: halt reconstruction; report integrity failure; notify security team

    step_6_generate_reconstruction_record:
      reconstruction_record:
        reconstruction_id: "RECONSTR-{random_8char}"
        queried_by: agent_id | human_id
        queried_at: ISO-8601
        purpose: string
        target_valid_time: ISO-8601
        target_transaction_time: ISO-8601
        node_count: int
        edge_count: int
        retroactively_added_facts: int
        integrity_verified: boolean
        completeness_estimate: float
        reconstruction_hash: SHA-256   # hash of entire reconstructed subgraph
```

---

## Contradiction and Correction Tracking

```yaml
contradiction_tracking:
  purpose: |
    When historical facts are corrected, the system must be able to explain
    what was believed before, what was corrected, when the correction was made,
    and why. This is essential for regulatory examinations where auditors need
    to understand the history of the system's beliefs.

  correction_record:
    correction_id: "CORRN-{random_8char}"
    original_edge_id: edge_id
    corrected_edge_id: edge_id
    original_valid_from: ISO-8601
    original_valid_until: ISO-8601 | null
    corrected_valid_from: ISO-8601       # possibly different from original
    corrected_valid_until: ISO-8601 | null
    correction_transaction_from: ISO-8601
    correction_reason: string
    correction_authority: agent_id | human_id
    correction_episode_id: episode_id

  contradiction_record:
    contradiction_id: "CONTRD-{random_8char}"
    edge_a_id: edge_id
    edge_b_id: edge_id
    contradiction_type: LOGICAL_OPPOSITE | MUTUALLY_EXCLUSIVE | COVERAGE_GAP
    detected_at: ISO-8601
    resolution_status: UNRESOLVED | RESOLVED | ACCEPTED_AS_AMBIGUOUS
    resolution_edge_id: edge_id | null   # the edge that resolved the contradiction
    resolution_rationale: string | null

  correction_audit:
    frequency: daily report of all corrections in prior 24h
    high_correction_rate_alert: > 5 corrections per entity per week = flag for investigation
    regulatory_note: corrections are preserved, not deleted; auditors see both original and correction
```

---

## Regulatory Examination Support

```yaml
regulatory_examination_support:
  pre_examination_protocol:
    step_1: identify examination period (valid_time range + transaction_time range)
    step_2: verify temporal_index covers full examination period
    step_3: run full integrity verification on all edges in period (VERIFY_chain_segment)
    step_4: generate completeness report (any gaps in coverage?)
    step_5: compile all retroactive corrections and contradictions in period
    step_6: brief examination team on any known uncertainty sources

  examination_deliverables:
    point_in_time_reconstructions: any date requested by examiner; produced within 30 minutes
    evolution_timelines: relationship evolution for any entity pair in examination scope
    decision_replays: reconstruct exact graph state for each decision under examination
    correction_audit: full log of historical corrections in period
    integrity_certificates: hash verification proof for all records in scope

  confidentiality:
    access_level: RESTRICTED — only compliance_governance_lead, auditors, regulatory examiners
    query_logging: every historical truth query logged to audit-trail-governance.md
    data_minimization: scope queries to minimum necessary for examination
```

---

## Integration Points

| System | Role |
|---|---|
| `temporal-knowledge-graphs/temporal-graph-model.md` | Bi-temporal model is the foundation |
| `graph-cognition/graph-storage-model.md` | Temporal index and periodic snapshots provide historical data |
| `graph-cognition/graph-query-language.md` | AT TIME / AS_OF_TRANSACTION / BETWEEN clauses |
| `governance-policies/policy-replay-engine.md` | Decision replay uses DECISION_REPLAY query type |
| `governance-policies/immutable-policy-audit.md` | Audit records provide evaluation_context_hash for reconstruction |
| `temporal-knowledge-graphs/organizational-memory-evolution.md` | Historical truth underlies org memory queries |
| `graph-reasoning/causal-reasoning-engine.md` | Causal queries use historical truth to establish what was known when |
