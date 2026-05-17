# Staleness Detector
# Tracks entity freshness, detects stale knowledge, and triggers re-ingestion

## Freshness TTL by Entity Type

```yaml
freshness_ttl:
  AGENT:        86400    # 24 hours — agent definitions change occasionally
  ORGANIZATION: 172800   # 48 hours — org structure is relatively stable
  WORKFLOW:     172800   # 48 hours
  ARTIFACT:     3600     # 1 hour — runtime artifacts age quickly
  RUN:          7200     # 2 hours — completed runs are stale soon after completion
  DECISION:     2592000  # 30 days — ADRs are long-lived
  POLICY:       604800   # 7 days
  WIKI_PAGE:    604800   # 7 days — wiki should be reviewed weekly
  CAPABILITY:   604800   # 7 days
  TOOL:         86400    # 24 hours — tool availability can change
  INTEGRATION:  86400    # 24 hours
  CONTRACT:     604800   # 7 days
  TRUST_ZONE:   604800   # 7 days
  APPROVAL:     86400    # 24 hours — approvals have short relevance window
```

## Staleness Detection

```python
def is_stale(entity_or_edge) -> bool:
    entity_type = getattr(entity_or_edge, "entity_type", None)
    if entity_type is None:
        return False   # edges don't have TTLs (only their source entities do)

    ttl_seconds = FRESHNESS_TTL.get(entity_type)
    if ttl_seconds is None:
        return False   # no TTL defined for this type

    age_seconds = (now() - parse_iso(entity_or_edge.metadata.updated_at)).total_seconds()
    return age_seconds > ttl_seconds

def get_staleness_age_ratio(entity: EntityVertex) -> float:
    ttl = FRESHNESS_TTL.get(entity.entity_type)
    if not ttl:
        return 0.0
    age = (now() - parse_iso(entity.metadata.updated_at)).total_seconds()
    return age / ttl   # 1.0 = exactly at TTL; > 1.0 = overdue

def classify_staleness(ratio: float) -> str:
    if ratio < 0.50:  return "FRESH"
    if ratio < 0.80:  return "AGING"
    if ratio < 1.00:  return "NEAR_STALE"
    if ratio < 2.00:  return "STALE"
    return "VERY_STALE"
```

## Freshness Score Computation

```python
def compute_freshness_score() -> float:
    all_entities = graph_store.get_all_active_vertices()
    if not all_entities:
        return 1.0

    freshness_values = []
    for entity in all_entities:
        ttl = FRESHNESS_TTL.get(entity.entity_type)
        if not ttl:
            freshness_values.append(1.0)   # no TTL = always fresh
            continue
        ratio = get_staleness_age_ratio(entity)
        # Freshness = 1 - min(1, ratio) — capped at 0 for very stale entities
        freshness = max(0.0, 1.0 - min(1.0, ratio))
        freshness_values.append(freshness)

    # Weight high-priority entity types more
    HIGH_PRIORITY_TYPES = {"AGENT", "WORKFLOW", "POLICY", "TOOL"}
    weighted_sum = 0.0
    total_weight = 0.0
    for entity, freshness in zip(all_entities, freshness_values):
        weight = 2.0 if entity.entity_type in HIGH_PRIORITY_TYPES else 1.0
        weighted_sum += freshness * weight
        total_weight += weight

    return weighted_sum / max(1, total_weight)
```

## Cascade Staleness

An entity is transitively stale if it depends on a stale entity via inference:

```python
def compute_cascade_staleness(entity: EntityVertex, max_depth=3) -> CascadeStalenessResult:
    stale_dependencies = []
    visited = set()

    def check_dependencies(entity_id: str, depth: int):
        if depth > max_depth or entity_id in visited:
            return
        visited.add(entity_id)
        dep_edges = graph_store.get_out_edges(entity_id, ["CONSUMES", "REFERENCES", "DERIVED_FROM"])
        for edge in dep_edges:
            dep = graph_store.get_vertex(edge.target_id)
            if is_stale(dep):
                stale_dependencies.append(StaleDependency(
                    entity_id=dep.entity_id,
                    entity_label=dep.canonical_label,
                    dependency_depth=depth,
                    staleness_ratio=get_staleness_age_ratio(dep),
                ))
            check_dependencies(edge.target_id, depth + 1)

    check_dependencies(entity.entity_id, 1)
    return CascadeStalenessResult(
        entity_id=entity.entity_id,
        directly_stale=is_stale(entity),
        stale_dependencies=stale_dependencies,
        transitively_at_risk=len(stale_dependencies) > 0,
    )
```

## Re-Ingestion Triggering

Stale entities trigger re-ingestion of their source documents:

```python
def queue_stale_re_ingestion():
    stale_entities = [
        e for e in graph_store.get_all_active_vertices()
        if is_stale(e) and classify_staleness(get_staleness_age_ratio(e)) in ("STALE", "VERY_STALE")
    ]

    for entity in stale_entities:
        source_file = entity.properties.get("source_file")
        if source_file:
            ingestion_pipeline.enqueue_job(
                source_file=source_file,
                extractor=ENTITY_TYPE_TO_EXTRACTOR[entity.entity_type],
                priority="LOW",   # stale re-ingestion is background work
                force=True,       # bypass content hash idempotency check
            )
        elif entity.entity_type == "ARTIFACT":
            artifact_extractor.scan_artifact_store()

def run_staleness_detection() -> StatenessReport:
    total = len(graph_store.get_all_active_vertices())
    stale_counts_by_type = Counter()
    for entity in graph_store.get_all_active_vertices():
        if is_stale(entity):
            stale_counts_by_type[entity.entity_type] += 1

    total_stale = sum(stale_counts_by_type.values())
    freshness_score = compute_freshness_score()
    queue_stale_re_ingestion()

    return StatenessReport(
        total_entities=total,
        total_stale=total_stale,
        stale_rate=total_stale / max(1, total),
        stale_by_type=dict(stale_counts_by_type),
        freshness_score=freshness_score,
        computed_at=now(),
    )
```

## Integration Points

- `graph-health-monitor.md`: provides FRESHNESS dimension score via `compute_freshness_score()`
- `knowledge-inference/inference-rules.md`: R007 and R014 call `is_stale()` during derivation
- `ingestion-pipeline.md`: receives re-ingestion jobs queued by `queue_stale_re_ingestion()`
- `graph-observability/knowledge-gap-detector.md`: stale entities contribute to INCOMPLETE_ENTITY gaps
