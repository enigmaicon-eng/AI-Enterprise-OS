# Inference Engine
# Forward-chaining rule evaluation, confidence propagation, and derived relationship materialization

## Inference Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Inference Engine                        │
│                                                         │
│  Trigger                 Schedule                       │
│  (mutation event)        (every 15 min)                 │
│         │                      │                        │
│         └──────────┬───────────┘                        │
│                    ▼                                     │
│         ┌──────────────────────┐                        │
│         │   Rule Evaluator     │                        │
│         │  (R001 → R015)       │                        │
│         └──────────┬───────────┘                        │
│                    ▼                                     │
│         ┌──────────────────────┐                        │
│         │ Confidence Propagator│                        │
│         └──────────┬───────────┘                        │
│                    ▼                                     │
│         ┌──────────────────────┐                        │
│         │  Contradiction Check │                        │
│         └──────────┬───────────┘                        │
│                    ▼                                     │
│         ┌──────────────────────┐                        │
│         │  Graph Write (INFER) │                        │
│         └──────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

## Inference Cycle

```python
INFERENCE_MAX_DEPTH = 5   # max hops of transitive reasoning per rule
INFERENCE_INTERVAL_S = 900  # 15 minutes scheduled cycle

def run_inference_cycle(trigger: str = "SCHEDULED") -> InferenceCycleResult:
    cycle_id = f"INF-{uuid4()}"
    started_at = now()
    total_derived = 0
    total_updated = 0
    contradictions_found = 0
    rules_fired = []

    # Evaluate rules in dependency order
    for rule_id in RULE_EVALUATION_ORDER:
        rule = INFERENCE_RULES[rule_id]
        result = evaluate_rule(rule)
        total_derived += result.new_edges_created
        total_updated += result.existing_edges_updated
        if result.contradictions:
            contradictions_found += len(result.contradictions)
            for c in result.contradictions:
                contradiction_detector.record(c)
        if result.new_edges_created > 0 or result.existing_edges_updated > 0:
            rules_fired.append(rule_id)

    # Decay stale inferred edges
    decay_stale_inferences()

    cycle_result = InferenceCycleResult(
        cycle_id=cycle_id,
        trigger=trigger,
        started_at=started_at,
        duration_ms=now_ms() - to_ms(started_at),
        rules_fired=rules_fired,
        edges_derived=total_derived,
        edges_updated=total_updated,
        contradictions_found=contradictions_found,
    )
    inference_state_store.record_cycle(cycle_result)
    publish_enterprise_event("telemetry.metrics", {
        "event_type": "INFERENCE_CYCLE_COMPLETE",
        "cycle_id": cycle_id,
        "edges_derived": total_derived,
        "contradictions_found": contradictions_found,
    })
    return cycle_result

RULE_EVALUATION_ORDER = [
    "R001",   # transitive delegation (needs DELEGATES_TO edges from ingestion)
    "R002",   # capability inheritance (needs SPECIALIZES_IN + SUBSUMES)
    "R003",   # policy applicability (needs GOVERNED_BY + PRODUCES)
    "R004",   # knowledge dependency (needs REFERENCES + BELONGS_TO)
    "R005",   # escalation path (needs ESCALATES_TO)
    "R006",   # collaboration reachability (needs COLLABORATES_WITH)
    "R007",   # stale dependency (needs AT_RISK entities from R003)
    "R008",   # trust propagation (needs DELEGATES_TO + trust_tier)
    "R009",   # approval coverage (needs ATTESTED_BY + governance gates)
    "R010",   # capability gap (needs REQUIRES_CAPABILITY + R002 results)
    "R011",   # circular delegation (needs R001 results)
    "R012",   # orphan artifact (needs PRODUCES/CONSUMES edges)
    "R013",   # policy conflict (needs GOVERNED_BY + policy scope)
    "R014",   # wiki staleness (needs REFERENCES + entity updated_at)
    "R015",   # org isolation (needs COLLABORATES_WITH)
]
```

## Rule Evaluation

```python
def evaluate_rule(rule: InferenceRule) -> RuleEvaluationResult:
    candidates = find_rule_candidates(rule)
    new_edges = 0
    updated_edges = 0
    contradictions = []

    for candidate in candidates:
        derived_edges = rule.derive(candidate, max_depth=INFERENCE_MAX_DEPTH)
        for derived_edge in derived_edges:
            # Check confidence threshold
            if derived_edge.confidence < 0.40:
                continue   # too low confidence — discard
            # Check for contradiction before writing
            existing = graph_store.get_edge_between(
                derived_edge.source_id, derived_edge.target_id,
                derived_edge.edge_type
            )
            if existing:
                if abs(existing.confidence - derived_edge.confidence) > 0.20:
                    contradictions.append(ContradictionCandidate(
                        existing_edge=existing, new_edge=derived_edge
                    ))
                else:
                    # Update confidence (take max)
                    existing.confidence = max(existing.confidence, derived_edge.confidence)
                    existing.updated_at = now()
                    graph_mutation_pipeline.write_edge(existing)
                    updated_edges += 1
            else:
                derived_edge.source_type = "INFERRED"
                derived_edge.provenance = rule.rule_id
                graph_mutation_pipeline.write_edge(derived_edge)
                new_edges += 1

    return RuleEvaluationResult(
        rule_id=rule.rule_id,
        candidates_evaluated=len(candidates),
        new_edges_created=new_edges,
        existing_edges_updated=updated_edges,
        contradictions=contradictions,
    )
```

## Confidence Decay

Inferred edges that are not re-confirmed by a new inference cycle have their
confidence decayed to reflect aging:

```python
DECAY_RATE_PER_CYCLE = 0.02
MIN_CONFIDENCE_BEFORE_REMOVAL = 0.30

def decay_stale_inferences():
    inferred_edges = graph_store.get_edges_by_source_type("INFERRED")
    for edge in inferred_edges:
        cycles_since_update = compute_cycles_elapsed(edge.updated_at)
        if cycles_since_update <= 1:
            continue   # just updated this cycle — no decay
        new_confidence = edge.confidence - (cycles_since_update * DECAY_RATE_PER_CYCLE)
        if new_confidence < MIN_CONFIDENCE_BEFORE_REMOVAL:
            # Confidence too low — remove the inferred edge
            graph_store.delete_edge(edge.edge_id)
            query_cache.invalidate_for_entities([edge.source_id, edge.target_id])
        else:
            edge.confidence = new_confidence
            edge.updated_at = now()
            graph_mutation_pipeline.write_edge(edge)
```

## Mutation-Triggered Re-Evaluation

When a specific entity or edge changes, only rules that depend on it are re-fired:

```python
RULE_DEPENDENCIES = {
    "R001": ["DELEGATES_TO"],
    "R002": ["SPECIALIZES_IN", "SUBSUMES"],
    "R005": ["ESCALATES_TO"],
    "R008": ["DELEGATES_TO"],
    "R010": ["REQUIRES_CAPABILITY", "SPECIALIZES_IN"],
    "R011": ["DELEGATES_TO", "TRANSITIVELY_DELEGATES_TO"],
    "R012": ["PRODUCES", "CONSUMES"],
    "R014": ["REFERENCES"],
    "R015": ["COLLABORATES_WITH"],
}

def notify_mutation(entity_or_edge_id: str, mutation_type: str):
    changed_edge_type = get_edge_type_if_edge(entity_or_edge_id)
    if not changed_edge_type:
        return
    rules_to_trigger = [
        rule_id for rule_id, deps in RULE_DEPENDENCIES.items()
        if changed_edge_type in deps
    ]
    for rule_id in rules_to_trigger:
        trigger_rule(rule_id)

def trigger_rule(rule_id: str):
    rule = INFERENCE_RULES[rule_id]
    evaluate_rule(rule)
```

## Integration Points

- `inference-rules.md`: defines the 15 canonical rule implementations
- `derived-relationships.md`: manages which derived edges are persisted vs computed on-demand
- `contradiction-detector.md`: receives ContradictionCandidate records from evaluate_rule
- `graph-schema.md`: GraphMutationPipeline calls `notify_mutation()` on every write
- `knowledge-synthesizer.md`: called after each inference cycle for cross-domain synthesis
