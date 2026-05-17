# Knowledge Types
# Classification of knowledge by epistemic status, confidence scoring, provenance, and temporal validity

## Knowledge Type Taxonomy

```yaml
knowledge_types:
  EXPLICIT:
    description: Directly stated in a canonical source file (agent definition, workflow spec, policy doc)
    confidence_range: [0.85, 1.00]
    examples:
      - Agent trust tier stated in agents/pm-org/product-manager.md
      - Workflow artifact types listed in workflows/research-workflow.md
      - Policy enforcement level declared in docs/governance/policies.md
    decay_rate: none   # explicit knowledge is stable until the source file changes
    invalidation: source file modification triggers re-ingestion

  DERIVED:
    description: Computed deterministically from explicit knowledge via well-defined rules
    confidence_range: [0.70, 0.95]
    formula: confidence = min(source_confidences) × derivation_confidence_factor
    examples:
      - Escalation path computed from chain of ESCALATES_TO relationships
      - Approval coverage status computed from REQUIRES_APPROVAL and ATTESTED_BY edges
      - Workflow capability gap computed from REQUIRES_CAPABILITY minus available agents
    decay_rate: refreshed whenever upstream explicit knowledge changes
    invalidation: upstream mutation notification from GraphMutationPipeline

  INFERRED:
    description: Produced by probabilistic reasoning rules over the graph structure
    confidence_range: [0.50, 0.84]
    formula: confidence = product(rule_confidence_factors) × min(input_edge_confidences)
    examples:
      - Transitive delegation reachability (R001)
      - Capability inheritance via sub-capability chain (R002)
      - Stale dependency risk propagation (R007)
    decay_rate: decays at 0.02 per inference cycle if not re-confirmed by new evidence
    invalidation: re-inference cycle or explicit deprecation

  DEPRECATED:
    description: Knowledge that was once valid but has been superseded, retracted, or expired
    confidence_range: [0.00, 0.49]
    examples:
      - Superseded ADRs (status: SUPERSEDED)
      - Expired policy bindings (valid_until in the past)
      - Merged entity records pointing to canonical successor
    decay_rate: confidence set to 0.0 at deprecation
    invalidation: lifecycle.status = DEPRECATED; never used in active queries by default
```

## Provenance Tracking

Every fact in the knowledge graph has a provenance chain that traces back to its origin:

```python
class ProvenanceChain:
    entries: [ProvenanceEntry]

class ProvenanceEntry:
    source_type: enum    # FILE | EVENT | INFERENCE_RULE | MANUAL | MERGE
    source_ref: string   # file path, event_id, rule_id, or "manual:{user_id}"
    extracted_at: ISO8601
    extractor: string    # which extractor/rule produced this fact
    confidence_at_extraction: float

def build_provenance_chain(source_type: str, source_ref: str,
                           extractor: str, confidence: float) -> ProvenanceChain:
    return ProvenanceChain(entries=[ProvenanceEntry(
        source_type=source_type,
        source_ref=source_ref,
        extracted_at=now(),
        extractor=extractor,
        confidence_at_extraction=confidence,
    )])

def extend_provenance(chain: ProvenanceChain, new_entry: ProvenanceEntry) -> ProvenanceChain:
    # Append new entry (chain grows with each re-extraction or derivation step)
    return ProvenanceChain(entries=chain.entries + [new_entry])

def get_ultimate_source(chain: ProvenanceChain) -> ProvenanceEntry:
    # First entry in chain is the original source
    return chain.entries[0]

def get_confidence_history(chain: ProvenanceChain) -> [float]:
    return [e.confidence_at_extraction for e in chain.entries]
```

## Confidence Propagation Rules

```python
def propagate_confidence_derived(input_facts: [GraphEdge]) -> float:
    # Derived confidence: floor at min of inputs, discounted by derivation
    DERIVATION_DISCOUNT = 0.95
    return min(f.confidence for f in input_facts) * DERIVATION_DISCOUNT

def propagate_confidence_inferred(rule_confidence_factor: float,
                                  input_edges: [GraphEdge]) -> float:
    # Inferred confidence: product of rule factor and edge confidences
    edge_min = min(e.confidence for e in input_edges) if input_edges else 1.0
    return rule_confidence_factor * edge_min

def propagate_confidence_merged(confidences: [float]) -> float:
    # Merged entity confidence: max of contributing sources (best evidence wins)
    return max(confidences)

def decay_confidence(current: float, cycles_without_reconfirmation: int,
                     knowledge_type: str) -> float:
    if knowledge_type != "INFERRED":
        return current   # only inferred knowledge decays
    DECAY_RATE_PER_CYCLE = 0.02
    decayed = current - (cycles_without_reconfirmation * DECAY_RATE_PER_CYCLE)
    return max(decayed, 0.0)
```

## Temporal Validity

Some knowledge is time-bounded and automatically becomes DEPRECATED when expired:

```python
def is_fact_valid(entity_or_edge) -> bool:
    if entity_or_edge.lifecycle.status == "DEPRECATED":
        return False
    if entity_or_edge.lifecycle.status == "QUARANTINED":
        return False
    valid_until = getattr(entity_or_edge, "valid_until", None)
    if valid_until and parse_iso(valid_until) < now():
        # Expired — auto-deprecate
        expire_fact(entity_or_edge)
        return False
    return True

def expire_fact(entity_or_edge):
    if hasattr(entity_or_edge, "entity_id"):
        entity_or_edge.lifecycle.status = "DEPRECATED"
        entity_or_edge.lifecycle.deprecated_reason = "Temporal validity expired"
        graph_mutation_pipeline.write_vertex(entity_or_edge)
    else:
        entity_or_edge.source_type = "DERIVED"
        entity_or_edge.confidence = 0.0
        graph_mutation_pipeline.write_edge(entity_or_edge)
```

## Query Filtering by Knowledge Type

By default, all queries exclude DEPRECATED and QUARANTINED knowledge:

```python
DEFAULT_QUERY_FILTER = QueryFilter(
    exclude_statuses=["DEPRECATED", "QUARANTINED", "MERGED"],
    min_confidence=0.50,           # exclude speculative inferences
    exclude_knowledge_types=[],    # EXPLICIT, DERIVED, INFERRED all included
)

AUTHORITATIVE_ONLY_FILTER = QueryFilter(
    exclude_statuses=["DEPRECATED", "QUARANTINED", "MERGED"],
    min_confidence=0.85,
    include_knowledge_types=["EXPLICIT"],
)

INCLUDE_INFERRED_FILTER = QueryFilter(
    exclude_statuses=["DEPRECATED", "QUARANTINED", "MERGED"],
    min_confidence=0.50,           # include inferred
    include_knowledge_types=["EXPLICIT", "DERIVED", "INFERRED"],
)
```

## Integration Points

- `entity-registry.md`: assigns knowledge_type based on confidence and source at registration
- `knowledge-inference/inference-engine.md`: produces INFERRED facts with confidence propagation
- `graph-ingestion/ingestion-pipeline.md`: uses EXPLICIT type for file-sourced facts, EVENT_DERIVED for bus events
- `graph-query-engine/query-interface.md`: applies DEFAULT_QUERY_FILTER unless caller specifies override
- `graph-observability/staleness-detector.md`: uses decay_confidence to flag stale inferred knowledge
