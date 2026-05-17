# Cross-Domain Synthesis

## Purpose
Discovers and formalizes knowledge that spans multiple organizational domains. The most impactful organizational insights often live at the intersections — between governance and operations, between incident patterns and process design, between technical architecture and organizational structure. This system is designed specifically to find those intersections.

---

## Why Cross-Domain Synthesis Matters

Single-domain knowledge is necessary but not sufficient. Examples of cross-domain insights:
- Governance queue depth in the week before a release predicts incident probability with high correlation
- Workflows that cross 3+ org boundaries have 5× higher SLA breach rates — not captured by either PROCESS or ORGANIZATIONAL domain alone
- Agent confidence calibration failures cluster by agent type AND by domain — a TECHNICAL + ORCHESTRATION intersection insight

These insights require integrating knowledge across domain boundaries that individual KU authors rarely traverse.

---

## Cross-Domain Discovery

```yaml
cross_domain_discovery:
  automated_discovery:
    method_1_correlation_mining:
      description: Find statistical correlations between metrics and events across domains
      sources: telemetry data, SLA data, incident data, workflow metrics
      algorithm: cross-correlation analysis; Granger causality tests
      threshold: correlation > 0.60 with p < 0.05
      output: correlation candidate for human validation
    
    method_2_graph_bridge_detection:
      description: Find KUs that are heavily linked across domain boundaries
      algorithm: detect bridge nodes in knowledge graph (high betweenness centrality across domains)
      output: cross-domain bridge KU candidates for synthesis
    
    method_3_query_pattern_analysis:
      description: Agents who query domain A also frequently query domain B in same session
      algorithm: association rule mining on query sessions
      threshold: lift > 2.0 AND support >= 20 sessions
      output: domain co-occurrence patterns suggesting cross-domain relationship
    
    method_4_incident_cross_contamination:
      description: Incidents in domain A that were caused by failures in domain B
      algorithm: trace incident root_cause across domain boundaries
      output: RELATIONSHIP_KNOWLEDGE candidates about cross-domain dependencies
  
  manual_initiation:
    who: knowledge steward, Tier-3+, research intelligence agents
    how: synthesis request specifying two or more source domains and research question
    process: see synthesis engine synthesis job schema
```

---

## Cross-Domain Synthesis Templates

```yaml
templates:
  DOMAIN_CORRELATION_TEMPLATE:
    use_when: statistical correlation found between domains
    output_structure:
      title: "{Domain A} × {Domain B} Correlation: {Phenomenon}"
      sections:
        observation: describe the empirical correlation
        data_basis: sample size, time range, confidence interval
        mechanism_hypothesis: proposed causal or relational mechanism
        implications: what decisions or designs does this inform?
        evidence_gaps: what would strengthen or refute this correlation?
      knowledge_type: RELATIONSHIP_KNOWLEDGE
      evidence_strength: OBSERVED (correlation; causation not proven)
      tags: [cross-org, predictive, well-validated | provisional]
  
  SYSTEMIC_FAILURE_TEMPLATE:
    use_when: incident root cause crosses domain boundaries
    output_structure:
      title: "Cross-Domain Failure Mode: {A} → {B}"
      sections:
        failure_path: step-by-step how failure propagates from Domain A to Domain B
        triggering_conditions: what must be true in A for B to be affected
        detection_opportunity: where in the cross-domain path can this be detected early?
        prevention_in_A: what changes in A prevent propagation to B?
        isolation_in_B: how can B be isolated from A's failures?
      knowledge_type: PATTERN_KNOWLEDGE
      evidence_strength: VALIDATED (if observed in real incidents)
      domain: INCIDENT (primary), [Domain A, Domain B] (secondary)
  
  LEVERAGE_POINT_TEMPLATE:
    use_when: a KU from one domain has unexploited applicability in another
    output_structure:
      title: "Cross-Domain Leverage: {Pattern} applies to {New Domain}"
      sections:
        source_pattern: reference to original KU in source domain
        new_domain_context: how the pattern manifests in the target domain
        adaptation_required: what modifications needed for target domain application
        validation_needed: evidence required before declaring this validated
      knowledge_type: PATTERN_KNOWLEDGE
      evidence_strength: ANECDOTAL (until validated in new domain)
  
  INTEGRATION_ARCHITECTURE_TEMPLATE:
    use_when: understanding of how two domains must coordinate for a shared outcome
    output_structure:
      title: "{Domain A} + {Domain B} Integration: {Shared Goal}"
      sections:
        shared_objective: what both domains are contributing to
        domain_A_responsibilities: what A must do
        domain_B_responsibilities: what B must do
        coordination_points: where A and B must synchronize
        failure_modes: what breaks when coordination fails
      knowledge_type: RELATIONSHIP_KNOWLEDGE or PROCESS_KNOWLEDGE
```

---

## Cross-Domain Knowledge Graph

```yaml
cross_domain_graph:
  structure:
    nodes: domain → high-quality KUs representative of domain
    edges: cross-domain relationships (with relationship_type and evidence basis)
  
  key_relationships:
    GOVERNANCE ↔ PROCESS:
      high_cardinality: many-to-many
      key_patterns: governance decisions shape process design; process failures trigger governance review
    
    INCIDENT ↔ TECHNICAL:
      high_cardinality: most incidents have technical root cause
      key_patterns: technical debt → incident frequency; architecture patterns → blast radius
    
    ORCHESTRATION ↔ GOVERNANCE:
      key_patterns: orchestration complexity → governance bottleneck; delegation depth → oversight gaps
    
    ORGANIZATIONAL ↔ PROCESS:
      key_patterns: team boundaries → workflow handoff failure points; role ambiguity → decision delays
    
    INTELLIGENCE ↔ DECISION:
      key_patterns: research findings → updated decision criteria; market intelligence → risk threshold updates
  
  graph_queries:
    find_cross_domain_paths:
      input: domain_A, domain_B, max_hop: 3
      output: all paths connecting the two domains through shared KU relationships
    
    find_domain_bridges:
      input: none
      output: KUs that are heavily referenced across >= 3 domains (high centrality)
    
    impact_propagation:
      input: ku_id (proposed change)
      output: which other domains' knowledge might be affected by this change
```

---

## Cross-Domain Synthesis Pipeline

```yaml
pipeline:
  run_schedule: monthly full scan; weekly incremental
  
  phases:
    phase_1_discovery: 2 hours
      run all 4 discovery algorithms
      output: list of cross-domain candidates with confidence scores
    
    phase_2_filtering: 30 minutes
      remove candidates below confidence threshold (0.55)
      remove candidates already covered by existing RELATIONSHIP_KNOWLEDGE units
      output: prioritized candidate list
    
    phase_3_synthesis: 4 hours
      for each high-priority candidate: run synthesis engine with appropriate template
      output: KU drafts with DERIVED_FROM provenance
    
    phase_4_review: human-gated
      all cross-domain syntheses require human review (Tier-3+ preferred)
      assigned to knowledge steward with expertise in both domains
      SLA: 10 business days
  
  volume_controls:
    max_new_cross_domain_kus_per_month: 20
    priority_order: SYSTEMIC_FAILURE > LEVERAGE_POINT > DOMAIN_CORRELATION > INTEGRATION_ARCHITECTURE
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-synthesis/knowledge-synthesis-engine.md` | Core synthesis execution |
| `knowledge-base/knowledge-taxonomy.md` | Domain definitions; cross-domain classification rules |
| `knowledge-base/knowledge-repository.md` | Graph store for cross-domain traversal |
| `enterprise-telemetry/enterprise-event-bus.md` | Cross-domain telemetry signals |
| `operational-review/escalation-bottleneck-analyzer.md` | Cross-domain bottleneck patterns |
| `knowledge-governance/knowledge-operations-dashboard.md` | Cross-domain coverage metrics |
