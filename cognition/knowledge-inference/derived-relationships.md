# Derived Relationships
# Materialized view management for computed edges — persistence vs on-demand computation decisions

## Persistence Policy

Not all derived relationships are stored in the graph. Some are computed at query time
to avoid graph bloat. This file defines which relationships are persisted and which
are computed on-demand.

```yaml
persistence_policy:

  PERSISTED:
    # High query frequency — worth the storage and maintenance cost
    - TRANSITIVELY_DELEGATES_TO   # rule R001 — queried by routing engine constantly
    - HAS_ESCALATION_PATH         # rule R005 — used by escalation-monitoring.md
    - IMPLICITLY_HAS_CAPABILITY   # rule R002 — used by R010 capability gap check
    - CIRCULAR_DELEGATION_DETECTED # rule R011 — critical alert; always persisted
    - HAS_CAPABILITY_GAP          # rule R010 — surfaced in governance dashboard
    - IS_ORPHANED                 # rule R012 — surfaced in knowledge gap report
    - IS_ISOLATED                 # rule R015 — surfaced in org health report
    - COVERED_BY_POLICY           # rule R003 — queried during compliance checks

  COMPUTED_ON_DEMAND:
    # Lower query frequency or short-lived — computed when queried
    - STALE_DEPENDENCY_RISK       # rule R007 — computed by staleness-detector at query time
    - REACHABLE_FROM              # rule R006 — computed during impact analysis
    - KNOWLEDGE_OF                # rule R004 — computed in wiki health reports
    - MAY_BE_STALE                # rule R014 — computed during wiki crawl
    - TRUST_BOUNDARY_CROSSED      # rule R008 — computed during trust signal processing
    - POLICY_CONFLICT_DETECTED    # rule R013 — logged to contradictions.jsonl, not in graph
    - IS_UNATESTED                # rule R009 — computed in attestation coverage reports
```

## Materialized View Lifecycle

```python
class MaterializedViewManager:
    def refresh_view(self, edge_type: str):
        if edge_type not in PERSISTED_DERIVED_TYPES:
            return   # not a persisted type

        rule_id = EDGE_TYPE_TO_RULE[edge_type]
        rule = INFERENCE_RULES[rule_id]

        # Get all existing materialized edges of this type
        existing = {
            (e.source_id, e.target_id): e
            for e in graph_store.get_edges_by_type(edge_type)
        }

        # Re-derive all instances
        fresh = {}
        for candidate in find_rule_candidates(rule):
            for derived_edge in rule.derive(candidate, INFERENCE_MAX_DEPTH):
                key = (derived_edge.source_id, derived_edge.target_id)
                fresh[key] = derived_edge

        # Add new
        for key, edge in fresh.items():
            if key not in existing:
                edge.source_type = "INFERRED"
                graph_mutation_pipeline.write_edge(edge)

        # Remove stale (edges that no longer derive from current graph state)
        for key, edge in existing.items():
            if key not in fresh:
                graph_store.delete_edge(edge.edge_id)
                query_cache.invalidate_for_entities([edge.source_id, edge.target_id])

        # Update confidence on retained edges
        for key, edge in existing.items():
            if key in fresh:
                new_conf = fresh[key].confidence
                if abs(edge.confidence - new_conf) > 0.05:
                    edge.confidence = new_conf
                    edge.updated_at = now()
                    graph_mutation_pipeline.write_edge(edge)

    def refresh_all_views(self):
        for edge_type in PERSISTED_DERIVED_TYPES:
            self.refresh_view(edge_type)
```

## On-Demand Computation

On-demand derived relationships are computed and returned in query results but not
persisted to the graph store:

```python
def compute_on_demand(edge_type: str, source_id: str) -> list[GraphEdge]:
    if edge_type not in COMPUTED_ON_DEMAND_TYPES:
        raise ValueError(f"{edge_type} is persisted, not on-demand")

    rule_id = EDGE_TYPE_TO_RULE.get(edge_type)
    if not rule_id:
        return []

    rule = INFERENCE_RULES[rule_id]
    source = graph_store.get_vertex(source_id)
    if not source:
        return []

    derived = rule.derive(source, INFERENCE_MAX_DEPTH)
    # Tag as computed (not stored)
    for edge in derived:
        edge.source_type = "DERIVED"
        edge.edge_id = f"COMPUTED-{uuid4()}"   # ephemeral ID
    return derived

def resolve_derived_for_query(source_id: str, edge_types: list[str]) -> list[GraphEdge]:
    results = []
    for edge_type in edge_types:
        if edge_type in PERSISTED_DERIVED_TYPES:
            results.extend(graph_store.get_out_edges(source_id, [edge_type]))
        elif edge_type in COMPUTED_ON_DEMAND_TYPES:
            results.extend(compute_on_demand(edge_type, source_id))
    return results
```

## Refresh Triggers

Materialized views are refreshed on the following triggers:

```python
REFRESH_TRIGGERS = {
    "DELEGATES_TO_CHANGED":       ["TRANSITIVELY_DELEGATES_TO", "CIRCULAR_DELEGATION_DETECTED"],
    "ESCALATES_TO_CHANGED":       ["HAS_ESCALATION_PATH"],
    "SPECIALIZES_IN_CHANGED":     ["IMPLICITLY_HAS_CAPABILITY"],
    "REQUIRES_CAPABILITY_CHANGED": ["HAS_CAPABILITY_GAP"],
    "PRODUCES_CHANGED":           ["IS_ORPHANED", "COVERED_BY_POLICY"],
    "CONSUMES_CHANGED":           ["IS_ORPHANED"],
    "COLLABORATES_WITH_CHANGED":  ["IS_ISOLATED"],
    "GOVERNED_BY_CHANGED":        ["COVERED_BY_POLICY"],
    "INFERENCE_CYCLE_COMPLETE":   "__all__",   # full refresh after scheduled cycle
}

def handle_refresh_trigger(trigger: str):
    view_types = REFRESH_TRIGGERS.get(trigger, [])
    if view_types == "__all__":
        materialized_view_manager.refresh_all_views()
    else:
        for view_type in view_types:
            materialized_view_manager.refresh_view(view_type)
```

## Integration Points

- `inference-engine.md`: calls `refresh_view()` after each rule fires
- `graph-query-engine/traversal-engine.md`: uses `resolve_derived_for_query()` when edge_types include derived types
- `graph-observability/coverage-analyzer.md`: verifies materialized view freshness as part of graph health
