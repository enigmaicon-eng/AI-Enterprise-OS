# Graph Memory Model

## Purpose
Defines the unified memory model for the enterprise knowledge graph — how the system stores, structures, retrieves, and manages memory as a first-class graph primitive rather than as flat key-value pairs or conversation logs. Graph memory is entity-centric and relationship-aware: facts are stored as nodes and edges, not as text chunks, allowing the retrieval system to follow relationships, traverse context, and surface memory that is structurally connected to the current task — not just semantically similar to a query string.

---

## Memory Model Principles

```yaml
principles:
  ENTITY_CENTRIC:
    definition: memory is organized around entities (agents, tasks, policies, people) not around conversations
    consequence: retrieving memory about "Agent Alpha" gives everything the system knows about that entity,
                 including all its relationships — not just mentions of its name
    contrast_with: chunk-based retrieval (finds text segments mentioning "Alpha" but misses relational context)

  RELATIONSHIP_AWARE:
    definition: memory edges are first-class; retrieving a node also surfaces its neighborhood
    consequence: asking "who does Agent Alpha work with?" traverses COLLABORATES_WITH and DELEGATES_TO edges
                 rather than searching for co-mention in conversation text

  TEMPORALLY_GROUNDED:
    definition: all memory has valid_from / valid_until; stale memory is not silently served
    consequence: memory returned always includes temporal validity; agents know how current the information is

  CONFIDENCE_WEIGHTED:
    definition: every memory node/edge carries an explicit confidence score
    consequence: uncertain memory is surfaced with its uncertainty; high-confidence memory is prioritized

  ACCUMULATING:
    definition: new information strengthens, corrects, or extends memory; it does not replace by default
    consequence: richer context over time; older facts preserved (with decay) unless explicitly superseded

  CONTEXTUALLY_DELIVERED:
    definition: memory retrieval is context-sensitive — the same query returns different relevant memory
                 depending on the requesting agent's current task, domain, and session context
```

---

## Memory Graph Layers

```yaml
memory_layers:
  WORKING_MEMORY:
    description: in-session, ephemeral memory for the current task or conversation
    scope: single agent session
    persistence: session duration (not stored to graph; held in session context)
    capacity: limited by context window; overflow triggers compression
    graph_interaction: written to graph at session end (significant facts only)
    purpose: intermediate reasoning state; temporary variable bindings

  EPISODIC_MEMORY:
    description: records of specific events, interactions, and experiences
    scope: cross-session; agent-level initially; consolidated to org level
    persistence: hot 90 days; warm 1 year; archival per retention schedule
    graph_nodes: KNOWLEDGE (subtype=DECISION | OBSERVATION) + EVENT nodes
    graph_edges: CAUSED_BY, PRODUCED, REFERENCES, SUPPORTS
    retrieval: context-sensitive; recency-weighted; decays by half_life

  SEMANTIC_MEMORY:
    description: general knowledge, facts, patterns, and learned regularities
    scope: organizational; shared across agents
    persistence: long-term; low decay rate
    graph_nodes: KNOWLEDGE (subtype=FACT | PATTERN | RULE) + COMMUNITY nodes
    graph_edges: SUPPORTS, DERIVED_FROM, CONTRADICTS, ENFORCES
    retrieval: semantic similarity; community search; pattern matching

  PROCEDURAL_MEMORY:
    description: knowledge of how to do things — workflows, patterns, decision procedures
    scope: organizational
    persistence: very long-term; decays only when superseded
    graph_nodes: KNOWLEDGE (subtype=PATTERN) + WORKFLOW nodes
    graph_edges: PRECEDES, DEPENDS_ON, PRODUCES, DERIVED_FROM
    retrieval: task-type matching; workflow similarity

  RELATIONAL_MEMORY:
    description: memory of who knows what, who works with whom, who to trust, who to escalate to
    scope: organizational; updated continuously
    persistence: moderate decay (relationships evolve)
    graph_nodes: AGENT nodes + COMMUNITY nodes
    graph_edges: COLLABORATES_WITH, DELEGATES_TO, REPORTS_TO, MEMBER_OF, OWNS
    retrieval: entity-centric; relationship traversal

  CONSTITUTIONAL_MEMORY:
    description: non-decaying memory of inviolable constraints, principles, and prohibitions
    scope: organizational; universal
    persistence: permanent (never decays; never archived)
    graph_nodes: POLICY (subtype=CONSTITUTIONAL) + OBLIGATION + CONSTRAINT nodes
    graph_edges: GOVERNS, ENFORCES
    retrieval: always active; queried on every governance decision
```

---

## Memory Node Schema

```yaml
memory_node:
  node_id: "MEM-{subtype_prefix}-{random_8char}"
  node_type: KNOWLEDGE | EVENT | COMMUNITY
  memory_layer: EPISODIC | SEMANTIC | PROCEDURAL | RELATIONAL | CONSTITUTIONAL

  content:
    summary: string                        # 1-3 sentence summary
    full_content: string | null            # full detail (may be large)
    content_embedding: float[1536]         # for semantic retrieval
    structured_facts: map<string, any>     # machine-readable extracted facts

  temporal:
    valid_from: ISO-8601                   # when this fact became true
    valid_until: ISO-8601 | null
    created_at: ISO-8601
    last_accessed_at: ISO-8601
    last_reinforced_at: ISO-8601 | null    # when last confirmed by new episode

  quality:
    confidence: float (0.0–1.0)
    relevance_score: float (0.0–1.0)      # current relevance (decays over time)
    access_count: int                      # how many times retrieved
    reinforcement_count: int               # how many times confirmed by new evidence

  decay:
    half_life_days: float
    decay_rate: float                      # ln(2) / half_life_days
    next_review_at: ISO-8601
    archival_candidate: boolean            # relevance_score < 0.20

  provenance:
    source_episode_ids: [episode_id]
    extraction_method: EXPLICIT | INFERRED | CONSOLIDATED
    created_by: agent_id | system_id
    validated_by: [agent_id | human_id]
    classification: string

  associations:
    domain: string                         # primary domain (GOVERNANCE, DATA, SECURITY, etc.)
    tags: [string]
    context_fingerprint: SHA-256          # hash of context at time of creation (for context-match retrieval)
```

---

## Memory Write Protocol

```yaml
memory_write:
  write_triggers:
    EXPLICIT_SAVE: agent explicitly flags a fact for memory
    TASK_COMPLETION_EXTRACTION: automatic extraction on task completion
    EPISODE_INGESTION: ingestion pipeline deposits to graph
    CONSOLIDATION_JOB: periodic pattern consolidation (see organizational-memory-evolution.md)

  write_decision_gate:
    question: is this fact novel, consequential, and retrievable enough to warrant graph storage?
    signals_favor_write:
      - fact involves a named entity relevant to multiple future tasks
      - fact represents a decision with lasting consequences
      - fact is a failure pattern or risk signal
      - fact has confidence > 0.60
    signals_against_write:
      - fact is highly session-specific (ephemeral)
      - fact is already represented (similarity > 0.92 to existing node)
      - fact has very short temporal validity (< 1 hour)
    default: write when uncertain (storage is cheaper than a lost insight)

  write_operations:
    UPSERT_MEMORY_NODE: create or merge into existing node
    APPEND_MEMORY_EDGE: add edge from this node to related entities
    REINFORCE_EXISTING: if duplicate detected, increment reinforcement_count; update confidence
    INVALIDATE_STALE: close stale edge if new fact supersedes it

  classification_enforcement:
    all memory writes require classification label
    minimum_tier_to_write: 1 (any agent can write)
    minimum_tier_to_write_CONSTITUTIONAL: 3 (Tier-3+ only)
    cross_classification_read_enforcement: at retrieval time
```

---

## Memory Capacity and Governance

```yaml
memory_governance:
  capacity_management:
    hot_graph_node_limit: 500,000 active nodes (per environment)
    monthly_growth_budget: 50,000 new nodes (flagged for review if exceeded)
    overflow_action: accelerate decay for low-confidence nodes; archive to cold tier

  quality_gates:
    minimum_confidence_to_persist: 0.40 (below this: working memory only)
    minimum_confidence_for_org_memory: 0.60
    validation_requirement: CONSTITUTIONAL memory requires Tier-3+ explicit validation

  access_governance:
    all_retrieval_logged: every memory read emits MEMORY_ACCESSED event
    access_patterns_analyzed: anomalous access patterns (bulk reads, unusual agents) flagged
    cross_classification_enforcement: applied at every retrieval

  review_cycle:
    periodic_review_of_low_relevance_nodes: weekly sweep
    quarterly_memory_audit: full review of memory quality, coverage, and decay rates
    annual_constitutional_memory_review: verify all constitutional nodes still accurate
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Memory writes go through episode ingestion |
| `graph-memory/graph-retrieval-engine.md` | Retrieval layer queries this model |
| `graph-memory/relationship-memory.md` | Relational memory layer details |
| `graph-memory/entity-relationship-system.md` | Entity resolution for memory node merging |
| `temporal-knowledge-graphs/organizational-memory-evolution.md` | Org memory evolution coordinates decay |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Reasoning traverses memory graph |
| `agent-intelligence/agent-memory.md` | Agent-level memory deposits to this model |
