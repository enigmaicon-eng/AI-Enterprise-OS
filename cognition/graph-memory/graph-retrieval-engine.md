# Graph Retrieval Engine

## Purpose
Executes memory and knowledge retrieval requests against the enterprise knowledge graph, combining vector similarity, keyword search, and structural graph traversal into a unified retrieval experience. The retrieval engine is context-aware: it uses the requesting agent's current task, domain, and session history to bias retrieval toward the most situationally relevant knowledge — not just the most semantically similar. It also enforces classification access control at retrieval time and provides confidence-weighted, temporally-annotated results so agents can reason about the quality and currency of what they receive.

---

## Retrieval Architecture

```
Retrieval Request (query + context)
        ↓
[1. Context Extraction]      → extract agent_id, task_type, domain, session_fingerprint
        ↓
[2. Query Planning]          → select retrieval strategy (VECTOR | BM25 | TRAVERSAL | HYBRID)
        ↓
[3. Anchor Identification]   → identify seed entities from query or session context
        ↓
[4. Parallel Retrieval]      → execute selected strategy in parallel lanes
        │
        ├── Vector Lane: embed query → ANN search → top-k candidates
        ├── BM25 Lane: keyword search → ranked candidates
        └── Traversal Lane: anchor → expand neighborhood → ranked candidates
        ↓
[5. Result Fusion]           → RRF merge + context re-ranking
        ↓
[6. Temporal Filtering]      → apply temporal validity; flag stale results
        ↓
[7. Classification Gating]   → remove results above requestor's clearance
        ↓
[8. Confidence Weighting]    → apply decay and confidence to final scores
        ↓
[9. Result Synthesis]        → assemble final result set with citations
```

---

## Retrieval Request Schema

```yaml
retrieval_request:
  request_id: "RETR-{timestamp_ms}-{random_6char}"

  query:
    query_text: string                      # natural language or structured GQL
    query_type: MEMORY_LOOKUP | CONTEXT_RETRIEVAL | ENTITY_LOOKUP | RELATIONSHIP_QUERY | PATTERN_SEARCH
    anchor_entities: [entity_id] | null     # known entities to anchor traversal

  context:
    requestor_agent_id: agent_id
    requestor_tier: int
    requestor_clearance: string
    current_task_id: task_id | null
    current_task_type: string | null
    current_domain: string | null
    session_id: string
    session_context_entities: [entity_id]   # entities active in current session (bias toward these)

  retrieval_parameters:
    strategy: VECTOR | BM25 | TRAVERSAL | HYBRID | AUTO
    max_hops: int (default 2 for TRAVERSAL; 3 for HYBRID)
    max_results: int (default 20)
    min_confidence: float (default 0.40)
    min_relevance_score: float (default 0.30)
    temporal_context: ISO-8601 | null       # point-in-time; null = current
    memory_layers: [EPISODIC | SEMANTIC | PROCEDURAL | RELATIONAL | CONSTITUTIONAL] | null (all)
    include_decayed: boolean (default false)  # include nodes with relevance < 0.40

  retrieval_options:
    include_community_context: boolean (default true)
    include_relationship_context: boolean (default true)
    include_temporal_metadata: boolean (default true)
    expand_to_neighborhood: boolean (default true)  # include 1-hop neighbors of top results
```

---

## Retrieval Strategies

```yaml
strategies:
  VECTOR:
    description: semantic similarity search over node embeddings
    implementation:
      1. embed query_text using same model as node embeddings
      2. ANN search (HNSW) over vector_index
      3. return top-k by cosine similarity
      4. filter by node_type, classification, temporal validity
    strengths: finds conceptually related nodes even without exact name match
    weaknesses: misses precise entity lookups; ignores graph structure
    use_when: "find knowledge about X concept" | "find agents with expertise in Y"
    latency: p99 < 20ms

  BM25:
    description: keyword-based full-text retrieval
    implementation:
      1. tokenize query_text
      2. BM25 lookup in text index
      3. return ranked results
    strengths: precise entity lookup; finds exact names and IDs
    weaknesses: misses synonyms and conceptual matches
    use_when: "find node named X" | "find all nodes mentioning policy Y"
    latency: p99 < 10ms

  TRAVERSAL:
    description: graph-structural expansion from anchor nodes
    implementation:
      1. identify anchor_entities (from query context or entity extraction)
      2. expand neighborhood up to max_hops using adjacency_index
      3. score expanded nodes by edge weight + centrality + relevance_score
      4. return ranked neighborhood
    strengths: finds structurally connected knowledge; respects graph topology
    weaknesses: requires known anchor; can diverge in dense graphs
    use_when: "what does Agent Alpha depend on?" | "what policies govern this task?"
    latency: p99 < 30ms (2 hops)

  HYBRID:
    description: parallel vector + BM25 + traversal with RRF fusion
    implementation:
      1. run all three lanes in parallel
      2. RRF merge: score_rrf(d) = Σ 1/(k + rank_i(d)) for each lane i (k=60)
      3. context re-ranking: boost nodes appearing in session_context_entities
      4. apply final filters
    lane_weights: {vector: 0.40, BM25: 0.30, traversal: 0.30}
    context_boost: +0.15 to RRF score for nodes in session_context_entities
    recency_boost: +0.10 for nodes with valid_from in last 7 days
    strengths: best coverage; handles both precise and fuzzy queries
    use_when: default for complex retrieval; when uncertain which strategy applies
    latency: p99 < 100ms

  AUTO:
    description: engine selects strategy based on query classification
    rules:
      query_has_entity_id → BM25 (exact lookup)
      query_has_anchor_entities → TRAVERSAL (or HYBRID if semantic content also present)
      query_is_conceptual → VECTOR
      query_is_complex → HYBRID
    default_fallback: HYBRID
```

---

## Context Re-Ranking

```yaml
context_reranking:
  purpose: |
    Identical queries from different agents in different situations should return
    different results — the most relevant answer depends on who is asking and why.

  reranking_factors:
    domain_alignment:
      description: boost nodes whose domain matches the requestor's current domain
      boost: +0.15 to relevance score if node.domain = requestor.current_domain

    task_type_alignment:
      description: boost nodes relevant to the current task type
      method: compare node.context_fingerprint to current task context fingerprint
      boost: +0.10 to relevance score if context fingerprint similarity > 0.70

    session_entity_proximity:
      description: boost nodes connected to entities active in current session
      method: check if node is within 2 hops of any session_context_entity
      boost: +0.15 for direct connection; +0.08 for 2-hop connection

    requestor_tier_relevance:
      description: prioritize results appropriate for requestor's tier
      rule: nodes requiring higher tier than requestor → exclude (classification gate)
      rule: nodes authored by same-tier agents → slight boost (peer-relevant knowledge)
      boost: +0.05 if authored_by_tier = requestor_tier

    recency_boost:
      description: more recent facts are more likely to be relevant for operational queries
      boost: +0.10 for facts in last 7 days; +0.05 for 7–30 days; neutral beyond 30 days
      exception: CONSTITUTIONAL and REGULATORY facts not recency-boosted (age is irrelevant)

    confidence_weighting:
      description: higher-confidence facts are more likely to be correct
      multiplier: final_score × confidence^0.5  (square root to avoid over-penalizing moderate confidence)

  reranking_disabled_for:
    CONSTITUTIONAL queries: always return all constitutional memory regardless of ranking
    EXACT_ENTITY_LOOKUP: no reranking (exact match takes priority)
```

---

## Result Schema

```yaml
retrieval_result:
  request_id: string
  status: SUCCESS | PARTIAL | EMPTY | ERROR

  results: [{
    node_id: string
    node_type: string
    name: string
    summary: string
    full_content: string | null

    scores:
      final_relevance: float            # final score after fusion and reranking
      vector_score: float | null
      BM25_score: float | null
      traversal_score: float | null
      confidence: float
      relevance_score: float            # current node relevance (after decay)

    temporal:
      valid_from: ISO-8601
      valid_until: ISO-8601 | null
      age_days: float
      is_current: boolean              # is this fact currently valid?
      staleness_warning: string | null # "This fact is 127 days old and has not been reconfirmed"

    neighborhood:                       # if expand_to_neighborhood = true
      direct_relationships: [{
        edge_type: string
        target_node_id: node_id
        target_name: string
        weight: float
        is_current: boolean
      }]
      community_membership: [{community_id, community_name, community_summary}]

    provenance:
      source_episode_ids: [episode_id]
      extraction_method: string
      created_at: ISO-8601
      last_reinforced_at: ISO-8601 | null

    access_logged: boolean              # true; all retrievals are logged
  }]

  metadata:
    total_candidates_evaluated: int
    retrieval_strategy_used: string
    temporal_context_applied: ISO-8601 | null
    results_excluded_by_classification: int
    results_excluded_by_decay: int
    latency_ms: int
    cache_hit: boolean
```

---

## Retrieval Quality Signals

```yaml
retrieval_feedback:
  purpose: improve future retrieval quality based on whether results were useful

  feedback_signals:
    RESULT_USED: agent explicitly used this result in reasoning (strong positive signal)
    RESULT_REFERENCED: agent cited this result in output (positive signal)
    RESULT_IGNORED: result not used (weak negative signal; may just be irrelevant)
    RESULT_CORRECTED: agent corrected or contradicted this result (strong negative signal)
    RESULT_REINFORCED: agent found this result confirmed by their own investigation (positive signal)

  feedback_actions:
    positive signals:
      - increment access_count on node
      - update last_accessed_at
      - apply small relevance boost (+0.02)
      - strengthen relationship between query context fingerprint and this node

    negative signals:
      - RESULT_CORRECTED: reduce confidence; trigger review if confidence drops below 0.40
      - RESULT_IGNORED repeatedly: reduce retrieval score (but not base node confidence)

  feedback_loop_latency: feedback applied within 60 seconds of signal receipt
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-memory/graph-memory-model.md` | Memory model defines what is retrievable |
| `graph-cognition/graph-index-manager.md` | All retrieval operations use managed indexes |
| `graph-cognition/graph-query-language.md` | GQL execution for traversal lane |
| `graph-memory/semantic-graph-traversal.md` | Semantic traversal strategy for HYBRID lane |
| `graph-routing/graph-memory-router.md` | Router selects which retrieval pattern to use |
| `temporal-knowledge-graphs/historical-truth-system.md` | Point-in-time retrieval uses temporal queries |
| `graph-reasoning/multi-hop-reasoning-engine.md` | Retrieval provides context for reasoning chains |
