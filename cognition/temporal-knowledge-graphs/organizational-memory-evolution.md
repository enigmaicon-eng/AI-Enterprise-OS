# Organizational Memory Evolution

## Purpose
Models how the enterprise's collective knowledge, capabilities, relationships, and institutional memory grow and change over time. Unlike individual agent memory (which is session-scoped), organizational memory is persistent, cross-agent, and accumulates across the entire system's history. This system defines how knowledge is deposited into organizational memory, how it decays or becomes stale, how conflicts between memories are resolved, and how the graph surfaces the right organizational knowledge at the right moment for the right agent — enabling genuine institutional learning.

---

## Organizational Memory Architecture

```
Knowledge Sources:
  Agent Decisions     ─┐
  Task Completions    ─┤
  Incident Reviews    ─┤→ [Memory Ingestion Pipeline] → [Organizational Memory Graph]
  Human Feedback      ─┤                                        │
  Retrospectives      ─┤                               ┌────────┴────────┐
  Policy Decisions    ─┘                               │                 │
                                                 [Active Memory]  [Archival Memory]
                                                  (< 90 days)      (> 90 days)
                                                       │
                                              [Memory Retrieval Layer]
                                                       │
                                              [Contextual Delivery]  → Agent / Human
                                                       │
                                              [Memory Quality Loop]  → decay, validation, consolidation
```

---

## Organizational Memory Types

```yaml
memory_types:
  DECISION_MEMORY:
    description: records of consequential decisions, the context that led to them, and their outcomes
    retention_value: high (decision rationale prevents re-litigating settled questions)
    decay_rate: slow (decisions remain relevant unless superseded by new policy or context change)
    access_pattern: surface when similar decision situation detected
    graph_representation: KNOWLEDGE node (subtype=DECISION) + edges to involved agents, policies, outcomes

  CAPABILITY_MEMORY:
    description: what agents can do, what they have done successfully, where they have failed
    retention_value: high (critical for task routing)
    decay_rate: moderate (capability relevance degrades as agents evolve)
    access_pattern: surface during agent selection and task assignment
    graph_representation: AGENT node capabilities + PRODUCES/CONSUMES edges + performance metric nodes

  PATTERN_MEMORY:
    description: reusable patterns extracted from successful and failed workflows
    retention_value: very high (patterns are generalized learnings)
    decay_rate: slow (patterns remain valid longer than specific decisions)
    access_pattern: surface during workflow design and orchestration planning
    graph_representation: KNOWLEDGE node (subtype=PATTERN) + DERIVED_FROM edges to source workflows

  RELATIONSHIP_MEMORY:
    description: history of agent-to-agent, agent-to-human, and agent-to-system interactions
    retention_value: medium (trust and collaboration history informs future assignment)
    decay_rate: moderate (old interactions matter less as relationships evolve)
    access_pattern: surface during team formation and conflict resolution
    graph_representation: COLLABORATES_WITH edges + evolution history + weight trajectory

  FAILURE_MEMORY:
    description: records of failures, near-misses, and the conditions that led to them
    retention_value: critical (failure prevention is more valuable than success repetition)
    decay_rate: very slow (failure patterns remain warning-relevant for years)
    access_pattern: surface proactively when similar risk conditions detected
    graph_representation: EVENT node (subtype=INCIDENT) + CAUSED_BY + AT_RISK_FROM edges

  REGULATORY_MEMORY:
    description: accumulated understanding of regulatory obligations, interpretations, and precedents
    retention_value: critical
    decay_rate: very slow (regulatory precedents remain relevant across versions)
    access_pattern: surface during compliance decisions and policy evaluation
    graph_representation: OBLIGATION nodes + ENFORCES edges + KNOWLEDGE nodes (subtype=REGULATORY_INTERPRETATION)

  EXPERTISE_MEMORY:
    description: which agents or humans have deep expertise in which domains
    retention_value: high
    decay_rate: slow (expertise is accumulated; rarely lost quickly)
    access_pattern: surface during expert identification and escalation routing
    graph_representation: AGENT capabilities + MEMBER_OF domain communities + PRODUCES high-confidence outputs
```

---

## Memory Ingestion Pipeline

```yaml
memory_ingestion:
  triggers:
    TASK_COMPLETED: extract capability evidence, pattern candidates, performance data
    INCIDENT_RESOLVED: extract failure pattern, root cause, resolution approach
    DECISION_RECORDED: extract decision context, rationale, outcome
    RETROSPECTIVE_SUBMITTED: extract structured learnings from human-authored review
    POLICY_ACTIVATED: extract regulatory interpretation, obligation coverage
    APPROVAL_GRANTED: extract approver expertise signal, governance precedent

  extraction_steps:
    step_1_signal_detection:
      input: raw episode (task completion event, incident record, etc.)
      output: memory_type classification + initial knowledge nodes
      method: structured extraction (field mapping) + LLM extraction (unstructured content)

    step_2_entity_linkage:
      action: link extracted knowledge to existing graph entities
      method: entity resolution (name + context → node_id)
      output: edges linking new KNOWLEDGE node to AGENT, TASK, WORKFLOW, POLICY nodes

    step_3_duplicate_detection:
      action: check if similar knowledge already exists in organizational memory
      method: vector similarity on knowledge embeddings (threshold > 0.92)
      if_duplicate: merge into existing knowledge node (update properties; strengthen edges)
      if_novel: create new knowledge node

    step_4_confidence_assignment:
      action: assign confidence score based on evidence quality
      signals:
        outcome_verified: +0.20 (outcome matches prediction)
        multi_agent_confirmation: +0.15 (multiple agents agree)
        human_validated: +0.25 (human expert confirmed)
        single_episode_source: base 0.60
        retrospective_source: base 0.75
        audit_verified: base 0.90

    step_5_decay_scheduling:
      action: assign decay parameters based on memory_type and confidence
      output: knowledge node decay_rate + next_review_at timestamp

    step_6_community_update:
      action: trigger community recompute for affected knowledge clusters
      purpose: surface community-level patterns from accumulated individual memories
```

---

## Memory Decay Model

```yaml
memory_decay:
  purpose: |
    Not all knowledge remains equally relevant over time. Decay prevents the
    organizational memory graph from accumulating stale knowledge that misleads
    future decisions. Decay is not deletion — decayed knowledge is preserved
    but deprioritized in retrieval and flagged for review.

  decay_parameters:
    decay_rate: float (0.0 = no decay; 1.0 = instant decay)
    half_life_days: effective time for knowledge relevance to halve

  decay_rates_by_type:
    DECISION_MEMORY: half_life = 365 days (decisions stay relevant ~1 year without challenge)
    CAPABILITY_MEMORY: half_life = 90 days (agent capabilities change with updates)
    PATTERN_MEMORY: half_life = 730 days (patterns degrade slowly)
    RELATIONSHIP_MEMORY: half_life = 60 days (relationships evolve faster)
    FAILURE_MEMORY: half_life = 1095 days (failure patterns stay warning-relevant ~3 years)
    REGULATORY_MEMORY: half_life = 1825 days (regulatory interpretation very stable)
    EXPERTISE_MEMORY: half_life = 180 days

  decay_formula:
    relevance_at_t = initial_confidence × e^(-decay_rate × days_since_creation)
    where decay_rate = ln(2) / half_life_days

  decay_modifiers:
    +0.30 confidence: knowledge confirmed by subsequent episode (resets clock)
    -0.20 confidence: knowledge contradicted by new episode (accelerates decay)
    +0.10 confidence: knowledge referenced frequently in retrievals (reinforcement)
    automatic_review: relevance < 0.40 → flagged for human review
    archival_threshold: relevance < 0.20 → moved to cold archival; not surfaced in default retrieval
    never_decay: FAILURE_MEMORY with severity = CRITICAL (always surfaced regardless of age)

  decay_enforcement:
    sweep_frequency: nightly
    action: update relevance_score on all KNOWLEDGE nodes; flag below-threshold nodes
    review_queue: send low-relevance nodes to knowledge governance review queue
```

---

## Organizational Memory Evolution Queries

```gql
# What has the organization learned about GDPR data transfers in the last year?
SEMANTIC MATCH (k:KNOWLEDGE {knowledge_type: "REGULATORY_MEMORY"})
WHERE semantic_similarity(k, "GDPR cross-border data transfers") > 0.80
  AND k.created_at >= "2025-05-15T00:00:00Z"
RETURN k ORDER BY k.confidence DESC LIMIT 10

# Which agents have accumulated the most governance expertise?
MATCH (a:AGENT)-[:PRODUCES]->(k:KNOWLEDGE)
WHERE k.knowledge_type = "DECISION_MEMORY" AND k.domain = "GOVERNANCE"
RETURN a, count(k) AS governance_decisions, avg(k.confidence) AS avg_confidence
ORDER BY governance_decisions DESC

# What failure patterns exist for data governance tasks?
MATCH (e:EVENT {event_type: "INCIDENT"})-[:CAUSED_BY]->(t:TASK)
MATCH (t)-[:MEMBER_OF]->(c:COMMUNITY {domain: "DATA_GOVERNANCE"})
RETURN e, t, count(*) AS incident_count ORDER BY incident_count DESC

# How has the organization's understanding of a policy evolved?
MATCH ALL_VERSIONS (k:KNOWLEDGE)-[:REFERENCES]->(p:POLICY {policy_id: "POL-DATA-001"})
ORDER BY k.created_at
RETURN k.content, k.confidence, k.created_at, k.knowledge_type

# Find knowledge that is decaying and needs review
MATCH (k:KNOWLEDGE)
WHERE k.relevance_score < 0.40 AND k.relevance_score > 0.20
RETURN k ORDER BY k.relevance_score ASC LIMIT 50
```

---

## Memory Consolidation

```yaml
memory_consolidation:
  purpose: periodically merge, abstract, and strengthen organizational memory to prevent fragmentation

  consolidation_types:
    PATTERN_ABSTRACTION:
      trigger: >= 3 DECISION_MEMORY nodes with similarity > 0.85 within same domain
      action: extract common pattern; create PATTERN node; link source decisions via DERIVED_FROM
      result: generalized pattern accessible via community search

    EXPERTISE_REINFORCEMENT:
      trigger: agent produces >= 5 high-confidence outputs in a domain within 30 days
      action: update agent's expertise properties; strengthen domain community membership

    FAILURE_GENERALIZATION:
      trigger: >= 2 incident events with same root_cause in 90-day window
      action: extract generalized failure pattern; attach to AT_RISK_FROM edges for similar tasks

    REGULATORY_PRECEDENT_CRYSTALLIZATION:
      trigger: >= 3 decisions citing same regulatory interpretation with consistent outcome
      action: create formal REGULATORY_PRECEDENT knowledge node; high confidence (0.90+)
      governance: compliance lead reviews before precedent is fully crystallized

  consolidation_schedule:
    PATTERN_ABSTRACTION: weekly
    EXPERTISE_REINFORCEMENT: daily
    FAILURE_GENERALIZATION: weekly
    REGULATORY_PRECEDENT_CRYSTALLIZATION: monthly
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Memory ingestion pipeline uses episode ingest |
| `temporal-knowledge-graphs/relationship-evolution.md` | RELATIONSHIP_MEMORY uses evolution event data |
| `temporal-knowledge-graphs/historical-truth-system.md` | Historical queries reconstruct past memory state |
| `graph-memory/graph-retrieval-engine.md` | Memory retrieval surfaces relevant organizational knowledge |
| `graph-reasoning/organizational-intelligence.md` | Reasoning over accumulated org memory |
| `agent-intelligence/learning-model.md` | Agent learning deposits into org memory |
| `knowledge-management/knowledge-lifecycle.md` | Knowledge governance coordinates with memory decay |
