# Graph Memory Router

## Purpose
Routes memory retrieval requests to the optimal retrieval strategy and memory layer based on request characteristics, agent context, and query intent. The graph memory router is the intelligent dispatcher between the multiple memory retrieval modes available in the enterprise graph — deciding whether a request needs vector similarity, structural traversal, BM25 lookup, temporal reconstruction, community search, or a hybrid of several. It prevents retrieval misrouting (applying semantic search to a request that needs exact ID lookup, or structural traversal to a request that needs semantic similarity) while providing a unified interface for all memory access patterns.

---

## Memory Routing Architecture

```
Memory Retrieval Request
        ↓
[1. Request Classification]   → classify query intent and memory access pattern
        ↓
[2. Layer Selection]          → select which memory layer(s) to query
        ↓
[3. Strategy Selection]       → select retrieval strategy (VECTOR | BM25 | TRAVERSAL | HYBRID | TEMPORAL)
        ↓
[4. Anchor Extraction]        → extract seed entities from request context
        ↓
[5. Strategy Execution]       → dispatch to graph-retrieval-engine with selected strategy
        ↓
[6. Result Routing]           → route results through appropriate post-processing
        ↓
[7. Context Assembly]         → assemble memory context for requesting agent
```

---

## Memory Access Patterns

```yaml
access_patterns:
  ENTITY_LOOKUP:
    description: retrieve everything known about a specific named entity
    signals: ["tell me about", "what do we know about", entity_id explicitly mentioned]
    routing:
      primary_strategy: BM25 (exact name/ID lookup) + 1-hop traversal (neighborhood)
      temporal: current state (no AT TIME unless explicitly requested)
      layer: ALL (all memory layers for this entity)
    example: "What do we know about Agent Alpha?"

  RELATIONSHIP_QUERY:
    description: retrieve relationship state between two entities
    signals: ["how does A relate to B", "what is the relationship between", "who does X delegate to"]
    routing:
      primary_strategy: TRAVERSAL from both anchor nodes; find connecting edges
      edge_type_filter: derived from relationship keyword
      temporal: current (unless historical phrasing detected)
    example: "What is the delegation relationship between Agent Alpha and Agent Beta?"

  CONTEXTUAL_RETRIEVAL:
    description: retrieve relevant knowledge for the current task context
    signals: [no specific entity; task_type + domain provided; "what should I know about"]
    routing:
      primary_strategy: HYBRID (vector + traversal from session context entities)
      context_boost: session_context_entities used as traversal anchors
      layer: SEMANTIC + PROCEDURAL + EPISODIC
    example: "What do I need to know before processing this GDPR data transfer request?"

  PATTERN_SEARCH:
    description: find similar past situations or patterns
    signals: ["has this happened before", "similar cases", "precedents for", "patterns around"]
    routing:
      primary_strategy: VECTOR similarity over KNOWLEDGE nodes in SEMANTIC + EPISODIC layers
      layer: SEMANTIC + EPISODIC (patterns and episodic history)
      filter: knowledge_type IN [PATTERN, DECISION, INCIDENT]
    example: "Are there precedents for this type of compliance exception?"

  TEMPORAL_QUERY:
    description: retrieve state at a specific past time
    signals: ["as of [date]", "what was the situation when", "at the time of", "in [month/year]"]
    routing:
      primary_strategy: TEMPORAL reconstruction (historical-truth-system.md)
      temporal_context: extracted date/time from query
      strategy_fallback: HYBRID if temporal_context ambiguous
    example: "What was Agent Alpha's delegation authority in March 2026?"

  CONSTITUTIONAL_QUERY:
    description: retrieve always-active constitutional constraints and principles
    signals: ["what are we prohibited from doing", "hard limits", "constitutional constraints", "what can never be overridden"]
    routing:
      primary_strategy: TRAVERSAL of CONSTITUTIONAL memory layer (always current)
      layer: CONSTITUTIONAL only
      no_decay_filter: true (constitutional memory never decayed)
    example: "What AI practices are absolutely prohibited?"

  EXPERTISE_QUERY:
    description: find who has expertise or experience in a domain
    signals: ["who knows about", "who has experience with", "who should I ask about", "expert in"]
    routing:
      primary_strategy: COMMUNITY search (find domain community) + member traversal
      secondary: VECTOR over AGENT node embeddings
      layer: RELATIONAL
    example: "Who in the organization has deep expertise in EU AI Act compliance?"

  FAILURE_PATTERN_QUERY:
    description: retrieve failure history and risk patterns
    signals: ["what could go wrong", "past failures", "risks of", "failure patterns in"]
    routing:
      primary_strategy: VECTOR over EVENT nodes (subtype=INCIDENT) + CAUSED_BY traversal
      layer: EPISODIC (failure memory never ages out)
      min_confidence: 0.50 (lower threshold to surface more failure patterns)
    example: "What are the known failure patterns for GDPR data transfer workflows?"
```

---

## Memory Layer Selection

```yaml
layer_selection:
  per_access_pattern:
    ENTITY_LOOKUP: ALL layers (comprehensive entity knowledge)
    RELATIONSHIP_QUERY: RELATIONAL + EPISODIC (relationship state + interaction history)
    CONTEXTUAL_RETRIEVAL: SEMANTIC + PROCEDURAL + EPISODIC
    PATTERN_SEARCH: SEMANTIC + EPISODIC
    TEMPORAL_QUERY: ALL layers (reconstructed at target time)
    CONSTITUTIONAL_QUERY: CONSTITUTIONAL only
    EXPERTISE_QUERY: RELATIONAL + SEMANTIC (expertise knowledge)
    FAILURE_PATTERN_QUERY: EPISODIC (failure events are episodic)

  layer_query_translation:
    EPISODIC: filter node.memory_layer = "EPISODIC"
    SEMANTIC: filter node.memory_layer = "SEMANTIC"
    PROCEDURAL: filter node.memory_layer = "PROCEDURAL"
    RELATIONAL: filter node.memory_layer = "RELATIONAL"
    CONSTITUTIONAL: filter node.memory_layer = "CONSTITUTIONAL"
    ALL: no layer filter applied
```

---

## Routing Decision Record

```yaml
routing_decision:
  request_id: string
  access_pattern_detected: string
  confidence_in_classification: float (0.0–1.0)
  
  routing_selected:
    primary_strategy: string
    memory_layers: [string]
    anchor_entities: [entity_id]
    temporal_context: ISO-8601 | null
    context_boost_entities: [entity_id]
    edge_type_filters: [edge_type] | null
    max_hops: int
    result_limit: int
    
  routing_rationale: string   # one-line explanation of routing choice
  
  fallback_routing: {         # if primary returns < 3 results
    strategy: string
    layers: [string]
    trigger_threshold: 3
  }
  
  latency_budget_ms: int      # based on urgency (REALTIME=50, HIGH=100, NORMAL=200)
```

---

## Memory Context Assembly

```yaml
context_assembly:
  purpose: after retrieval, assemble a coherent memory context for the requesting agent

  assembly_steps:
    step_1_deduplication: remove duplicate nodes (same content, different retrieval path)
    step_2_temporal_sort: order results by recency (most recent first) then by relevance_score
    step_3_layer_organization: group results by memory layer for structured presentation
    step_4_confidence_annotation: annotate each result with confidence + staleness warnings
    step_5_relationship_context: for each result, include its most relevant edges (1-hop neighborhood)
    step_6_community_context: identify if multiple results belong to same community (surface community summary)

  assembled_context:
    primary_results: top-k nodes most relevant to query (k = result_limit)
    supporting_edges: key relationships between primary_results and their neighbors
    community_summaries: summaries of communities represented in primary_results
    temporal_annotations: for each result: how current is this? any staleness warning?
    constitutional_overlay: always appended — relevant constitutional constraints, regardless of query
    confidence_summary: overall confidence in this memory retrieval ("3 of 8 results have confidence < 0.60")
    
  constitutional_overlay_rule:
    trigger: always — no memory context is returned without checking for relevant constitutional constraints
    method: SEMANTIC MATCH over CONSTITUTIONAL memory layer for relevance to query topic
    threshold: similarity > 0.55 to include
    note: constitutional memory is never filtered out by classification (it is universally accessible)
```

---

## Routing Performance Targets

| Access Pattern | Strategy | p99 Latency |
|---|---|---|
| ENTITY_LOOKUP | BM25 + 1-hop | 15ms |
| RELATIONSHIP_QUERY | TRAVERSAL | 25ms |
| CONTEXTUAL_RETRIEVAL | HYBRID | 100ms |
| PATTERN_SEARCH | VECTOR | 25ms |
| TEMPORAL_QUERY | TEMPORAL | 200ms |
| CONSTITUTIONAL_QUERY | TRAVERSAL | 10ms |
| EXPERTISE_QUERY | COMMUNITY + VECTOR | 50ms |
| FAILURE_PATTERN_QUERY | VECTOR + TRAVERSAL | 75ms |

---

## Integration Points

| System | Role |
|---|---|
| `graph-memory/graph-retrieval-engine.md` | Retrieval engine executes the selected strategy |
| `graph-memory/graph-memory-model.md` | Memory layer definitions guide layer selection |
| `graph-memory/semantic-graph-traversal.md` | Semantic traversal used for CONTEXTUAL and EXPERTISE patterns |
| `temporal-knowledge-graphs/historical-truth-system.md` | TEMPORAL access pattern uses historical truth system |
| `graph-memory/relationship-memory.md` | RELATIONSHIP_QUERY routes to relationship memory |
| `graph-cognition/graph-index-manager.md` | Index selection per strategy |
