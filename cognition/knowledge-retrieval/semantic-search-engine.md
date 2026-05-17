# Semantic Search Engine

## Purpose
Provides accurate, context-aware retrieval of knowledge units using multiple search modalities. Goes beyond keyword matching to understand the intent behind retrieval queries and surface the most relevant knowledge regardless of how it is phrased. The primary interface through which agents and humans access organizational knowledge.

---

## Search Architecture

```
Query Input
    ↓
[1. Query Understanding]    → parse intent, extract entities, classify query type
[2. Query Expansion]        → synonyms, related terms, ontology expansion
[3. Multi-Index Search]     → parallel search across all relevant indexes
[4. Result Fusion]          → merge and re-rank results from all indexes
[5. Access Filter]          → remove results the requesting principal cannot see
[6. Quality Filter]         → apply quality thresholds; flag marginal results
[7. Context Injection]      → enrich results with related units and usage signals
[8. Result Delivery]        → paginated, ranked, faceted result set
```

---

## Search Modalities

```yaml
search_modalities:
  KEYWORD_SEARCH:
    index: title_index (BM25) + content_index (BM25)
    best_for: exact term lookup, known title, specific concept names
    latency_target: < 50ms
    weight_in_fusion: 0.30
  
  SEMANTIC_SEARCH:
    index: embedding_index (HNSW vector similarity)
    method: embed query → cosine similarity against KU embeddings
    best_for: conceptual queries, paraphrased questions, "what is X" questions
    latency_target: < 200ms
    weight_in_fusion: 0.45
  
  TAXONOMY_SEARCH:
    index: taxonomy_index (faceted)
    best_for: domain browsing, structured filtering, governance-tier queries
    latency_target: < 30ms
    weight_in_fusion: 0.15
  
  PROVENANCE_SEARCH:
    index: provenance_index (inverted)
    best_for: "what knowledge came from incident X?" "what did workflow Y generate?"
    latency_target: < 100ms
    weight_in_fusion: 0.10
  
  GRAPH_TRAVERSAL:
    index: graph_store
    best_for: "find all units related to X" "what does X supersede?"
    latency_target: < 500ms (single-hop)
    weight_in_fusion: supplemental (used for context enrichment, not primary results)
```

---

## Query Understanding

```yaml
query_understanding:
  query_type_classification:
    FACTUAL: "What is the confidence threshold for autonomous AI decisions?"
    PROCEDURAL: "How do I escalate a governance dispute?"
    DIAGNOSTIC: "Why is the approval queue backing up?"
    RELATIONAL: "What knowledge is related to incident INC-2026-047?"
    COMPARATIVE: "What are the trade-offs of adaptive vs. long-running cases?"
    BROWSING: "Show me all incident knowledge in the GOVERNANCE domain"
  
  entity_extraction:
    extracts: [domain, agent_id, workflow_id, incident_id, policy_id, concept_name]
    uses: enterprise ontology for entity resolution
    example: "the T3 approval bottleneck pattern" → {concept: "bottleneck", entity_type: "approval", tier: 3}
  
  intent_mapping:
    FACTUAL → weight semantic_search high; keyword_search medium
    PROCEDURAL → weight semantic_search high; taxonomy (PROCESS domain) high
    DIAGNOSTIC → weight semantic_search + provenance_search
    RELATIONAL → weight graph_traversal highest
    COMPARATIVE → weight semantic_search; return multiple results
    BROWSING → weight taxonomy_search highest
  
  query_expansion:
    synonym_expansion: enterprise synonym dictionary
    ontology_expansion: add related OntologyClass members as search terms
    abbreviation_resolution: "T3" → "Tier-3", "KU" → "knowledge unit"
    context_injection: caller's domain + active workflow → boost domain-matching results
```

---

## Result Fusion and Ranking

```yaml
result_fusion:
  method: Reciprocal Rank Fusion (RRF) with modality-specific weights
  
  rrf_formula: |
    score(d, q) = Σ_m [ weight_m × (1 / (k + rank_m(d))) ]
    where k = 60 (standard RRF constant)
          m = each search modality
          rank_m = rank of document d in modality m's result list
  
  post_fusion_ranking_signals:
    quality_boost:
      EXEMPLARY quality units: × 1.20
      HIGH quality units: × 1.10
      MARGINAL quality: × 0.80
      POOR quality: × 0.50 (shown with quality warning)
    
    freshness_boost:
      published within 30 days: × 1.05
      published within 90 days: × 1.02
      not updated in 2+ years: × 0.95
    
    usage_boost:
      high retrieval_count + high usefulness_score: × 1.10
      zero application_count (never applied): × 0.95
    
    caller_context_boost:
      domain_match (caller domain matches KU domain): × 1.15
      prior_interaction (caller retrieved this KU before and found useful): × 1.10
    
    deprecation_penalty:
      DEPRECATED status: × 0.20 (shown last, with DEPRECATED label)
      CONTESTED status: × 0.85 (shown with CONTESTED warning)
```

---

## Search Query Schema

```yaml
search_query:
  query_text: string                     # natural language query
  query_type: AUTO | FACTUAL | PROCEDURAL | DIAGNOSTIC | RELATIONAL | BROWSING
  
  filters:
    domain: [string] | null              # restrict to specific domains
    subdomain: [string] | null
    knowledge_type: [string] | null
    status: [ACTIVE | REVIEW | DEPRECATED] # default: ACTIVE only
    access_level: auto                   # derived from caller's authorization
    tags: {include: [string], exclude: [string]}
    published_after: ISO-8601 | null
    published_before: ISO-8601 | null
    min_quality: 0.0–1.0 | null         # override default quality floor
    min_confidence: 0.0–1.0 | null
  
  pagination:
    page: int (default: 1)
    page_size: int (default: 10, max: 50)
  
  options:
    include_deprecated: boolean (default: false)
    include_related: boolean (default: true; adds related KU refs to results)
    include_facets: boolean (default: true)
    explain_ranking: boolean (default: false; for debugging)
  
  caller_context:
    caller_id: agent-id
    caller_domain: string
    active_workflow_id: string | null
    active_case_id: string | null
```

---

## Search Result Schema

```yaml
search_result:
  query_id: "SQ-uuid"
  query_text: string
  total_matches: int
  page: int
  page_size: int
  
  results: [
    {
      unit_id: string
      slug: string
      title: string
      summary: string              # 2–5 sentence excerpt
      domain: string
      subdomain: string
      knowledge_type: string
      status: string
      quality.overall_quality: float
      relevance_score: float       # 0.0–1.0 (normalized RRF score)
      ranking_explanation: {} | null  # if explain_ranking=true
      
      highlights:
        matching_fields: [field_name]
        keyword_highlights: [string]   # snippets with matched terms bolded
      
      flags: [DEPRECATED | CONTESTED | MARGINAL_QUALITY | STALE]
      
      related_units: [
        {unit_id, title, relationship_type}
      ] | []
    }
  ]
  
  facets:
    domain: {[domain_name]: count}
    knowledge_type: {[type]: count}
    quality_tier: {EXEMPLARY: N, HIGH: N, ACCEPTABLE: N}
    status: {ACTIVE: N, DEPRECATED: N}
  
  search_metadata:
    modalities_used: [string]
    latency_ms: int
    query_expansion_applied: boolean
    access_filtered_count: int     # units removed due to access control
```

---

## Search Performance

```yaml
performance_targets:
  simple_keyword: p50 < 50ms, p95 < 150ms, p99 < 300ms
  semantic_search: p50 < 200ms, p95 < 500ms, p99 < 1s
  complex_multi_modal: p50 < 400ms, p95 < 1s, p99 < 2s
  
  caching:
    query_cache: 5-minute TTL for identical queries
    embedding_cache: 1-hour TTL for query embeddings
    access_cache: 5-minute TTL for authorization decisions
  
  degraded_mode:
    if_embedding_index_unavailable: fall back to keyword + taxonomy only
    if_graph_unavailable: skip graph traversal; return context_missing flag
    latency_slo_breach: log + alert; do not fail the query
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-repository.md` | Index sources; access control |
| `knowledge-retrieval/knowledge-query-api.md` | Public API surface |
| `knowledge-retrieval/contextual-knowledge-delivery.md` | Context-enriched delivery |
| `knowledge-retrieval/knowledge-recommendation-engine.md` | Proactive recommendation |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Retrieval quality feedback |
| `enterprise-telemetry/enterprise-event-bus.md` | Retrieval event emission for analytics |
