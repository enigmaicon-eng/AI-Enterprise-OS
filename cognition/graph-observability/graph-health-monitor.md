# Graph Health Monitor
# Entity/edge metrics, orphan detection, integrity checks, and composite health scoring

## Health Dimensions

```yaml
graph_health_dimensions:
  COVERAGE:
    description: How well the graph captures the OS entity population
    weight: 0.25
    degraded_below: 0.80
    critical_below: 0.60
    source: coverage-analyzer.md

  FRESHNESS:
    description: How recently entities and edges have been updated
    weight: 0.25
    degraded_below: 0.75
    critical_below: 0.50
    source: staleness-detector.md

  INTEGRITY:
    description: Schema compliance, referential integrity, cardinality constraints
    weight: 0.30   # highest weight — integrity violations are most severe
    degraded_below: 0.95
    critical_below: 0.85
    source: integrity-validator.md

  CONNECTIVITY:
    description: Low orphan rate, adequate graph density, no isolated orgs
    weight: 0.10
    degraded_below: 0.80
    critical_below: 0.60
    source: graph-analytics.md (orphan_rate)

  INFERENCE_QUALITY:
    description: Inference cycle success rate, contradiction rate, derived edge coverage
    weight: 0.10
    degraded_below: 0.75
    critical_below: 0.55
    source: inference-engine.md (cycle results)
```

## Health Scoring

```python
def compute_graph_health() -> GraphHealthReport:
    # Collect dimension scores in parallel
    coverage_score   = coverage_analyzer.compute_overall_coverage()
    freshness_score  = staleness_detector.compute_freshness_score()
    integrity_score  = integrity_validator.compute_integrity_score()
    connectivity_score = compute_connectivity_score()
    inference_score  = compute_inference_quality_score()

    dimensions = {
        "COVERAGE":         coverage_score,
        "FRESHNESS":        freshness_score,
        "INTEGRITY":        integrity_score,
        "CONNECTIVITY":     connectivity_score,
        "INFERENCE_QUALITY": inference_score,
    }

    # Weighted composite
    composite = sum(
        score * HEALTH_DIMENSION_WEIGHTS[dim]
        for dim, score in dimensions.items()
    )

    # Hard cap: any CRITICAL dimension caps composite at 0.65
    critical_dims = [d for d, s in dimensions.items()
                     if s < HEALTH_DIMENSIONS[d]["critical_below"]]
    if critical_dims:
        composite = min(composite, 0.65)

    # Alerts for CRITICAL dimensions
    for dim in critical_dims:
        publish_enterprise_event("alerts.high", {
            "event_type": "GRAPH_HEALTH_DIMENSION_CRITICAL",
            "dimension": dim, "score": dimensions[dim],
        })

    status = classify_health_status(composite)
    report = GraphHealthReport(
        composite_score=composite,
        status=status,
        dimensions=dimensions,
        critical_dimensions=critical_dims,
        degraded_dimensions=[d for d, s in dimensions.items()
                              if HEALTH_DIMENSIONS[d]["critical_below"] <= s <
                                 HEALTH_DIMENSIONS[d]["degraded_below"]],
        computed_at=now(),
    )
    return report

def classify_health_status(score: float) -> str:
    if score >= 0.85:  return "HEALTHY"
    if score >= 0.70:  return "DEGRADED"
    if score >= 0.50:  return "IMPAIRED"
    return "CRITICAL"
```

## Connectivity Score

```python
def compute_connectivity_score() -> float:
    orphan_rate    = graph_analytics.compute_orphan_rate()
    isolated_orgs  = len(graph_store.get_edges_by_type("IS_ISOLATED"))
    total_orgs     = len(get_entities_by_type("ORGANIZATION"))
    density        = graph_analytics.compute_graph_density_metrics().graph_density

    orphan_penalty   = min(0.50, orphan_rate * 2.0)   # max 0.50 penalty
    isolation_penalty = isolated_orgs / max(1, total_orgs) * 0.30
    density_bonus    = min(0.10, density * 100)       # reward for higher density

    return max(0.0, 1.0 - orphan_penalty - isolation_penalty + density_bonus)
```

## Inference Quality Score

```python
def compute_inference_quality_score() -> float:
    last_cycle = inference_state_store.get_last_cycle()
    if not last_cycle:
        return 0.50   # no data — neutral score

    # Freshness of last cycle (penalize if > 30 minutes old)
    age_minutes = (now() - last_cycle.started_at).total_seconds() / 60
    freshness_penalty = min(0.30, max(0, (age_minutes - 30) / 100))

    # Contradiction rate (penalize high contradiction counts)
    contradiction_rate = last_cycle.contradictions_found / max(1, last_cycle.candidates_evaluated)
    contradiction_penalty = min(0.40, contradiction_rate * 10)

    # Rule coverage (reward for rules that fired)
    rule_coverage = len(last_cycle.rules_fired) / len(INFERENCE_RULES)

    return max(0.0, rule_coverage - freshness_penalty - contradiction_penalty)
```

## Alert Rules

```python
def check_graph_alerts(report: GraphHealthReport):
    stats = graph_analytics.compute_graph_density_metrics()

    # Dangling edges (referential integrity violation) → CRITICAL alert
    dangling = integrity_validator.count_dangling_edges()
    if dangling > 0:
        publish_enterprise_event("alerts.critical", {
            "event_type": "GRAPH_DANGLING_EDGES",
            "count": dangling,
            "description": f"{dangling} edges reference non-existent entities",
        })

    # High orphan rate → HIGH alert
    if stats.orphan_rate > 0.10:
        publish_enterprise_event("alerts.high", {
            "event_type": "GRAPH_HIGH_ORPHAN_RATE",
            "orphan_rate": stats.orphan_rate,
            "orphan_count": int(stats.orphan_rate * stats.total_nodes),
        })

    # Overall health critical → HIGH alert
    if report.composite_score < 0.50:
        publish_enterprise_event("alerts.high", {
            "event_type": "GRAPH_HEALTH_CRITICAL",
            "composite_score": report.composite_score,
            "critical_dimensions": report.critical_dimensions,
        })
```

## Scheduled Health Check

```python
def run_health_check() -> GraphHealthReport:
    report = compute_graph_health()
    check_graph_alerts(report)
    graph_metrics_publisher.publish_health_snapshot(report)
    graph_health_state_store.update(report)
    return report
```

## Integration Points

- `coverage-analyzer.md`: provides coverage_score dimension
- `staleness-detector.md`: provides freshness_score dimension
- `integrity-validator.md`: provides integrity_score dimension and dangling edge count
- `graph-metrics-publisher.md`: receives health report for telemetry publishing
- `operational-command-center/runtime-dashboards.md`: displays graph health panel
