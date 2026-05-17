# Coverage Analyzer
# Measures knowledge graph coverage across OS domains and identifies specific missing entities

## Coverage Targets by Domain

```yaml
coverage_targets:
  AGENT:
    target: 1.00        # every agent file should be in the graph
    source_pattern: "agents/**/*.md"
    expected_entity_type: AGENT
    relationship_density_target: 0.70   # 70% of possible org/capability edges should exist

  WORKFLOW:
    target: 1.00        # every workflow file should be in the graph
    source_pattern: "workflows/*.md"
    expected_entity_type: WORKFLOW
    relationship_density_target: 0.60

  DECISION:
    target: 0.95        # ADRs — near-complete (some WIP docs may be excluded)
    source_pattern: "docs/decisions/*.md"
    expected_entity_type: DECISION
    relationship_density_target: 0.50

  WIKI_PAGE:
    target: 0.85        # wiki — high coverage but some draft pages OK to miss
    source_pattern: "wiki/**/*.md"
    expected_entity_type: WIKI_PAGE
    relationship_density_target: 0.40

  ARTIFACT:
    target: 0.70        # artifacts are runtime — not all will be tracked
    source_pattern: null   # runtime entities; count from event stream instead
    expected_entity_type: ARTIFACT
    relationship_density_target: 0.55

  POLICY:
    target: 1.00        # all governance policies must be in graph
    source_pattern: "docs/governance/*.md"
    expected_entity_type: POLICY
    relationship_density_target: 0.80

  INTEGRATION:
    target: 0.90
    source_pattern: "integration-fabric/connectors/*.md"
    expected_entity_type: INTEGRATION
    relationship_density_target: 0.50
```

## Coverage Computation

```python
def compute_domain_coverage(domain: str) -> DomainCoverageResult:
    config = COVERAGE_TARGETS[domain]

    if config["source_pattern"]:
        # File-based coverage
        files_on_disk = len(glob_files(config["source_pattern"]))
        entities_in_graph = len(get_entities_by_type(config["expected_entity_type"],
                                                       status="ACTIVE"))
        entity_coverage = entities_in_graph / max(1, files_on_disk)
    else:
        # Event-stream-based coverage (artifacts)
        expected = ingestion_state_store.get_event_stream_entity_count(domain)
        entities_in_graph = len(get_entities_by_type(config["expected_entity_type"]))
        entity_coverage = entities_in_graph / max(1, expected)

    # Relationship density
    rel_density = compute_relationship_density(config["expected_entity_type"])

    # Gap identification
    gaps = identify_domain_gaps(domain, config)

    return DomainCoverageResult(
        domain=domain,
        entity_coverage=entity_coverage,
        relationship_density=rel_density,
        target_coverage=config["target"],
        target_relationship_density=config["relationship_density_target"],
        meets_target=entity_coverage >= config["target"],
        meets_density_target=rel_density >= config["relationship_density_target"],
        gaps=gaps,
        computed_at=now(),
    )

def compute_relationship_density(entity_type: str) -> float:
    entities = get_entities_by_type(entity_type, status="ACTIVE")
    if not entities:
        return 0.0
    total_actual_edges = sum(
        len(graph_store.get_out_edges(e.entity_id)) for e in entities
    )
    # Expected edges: based on domain-typical minimum relationship count
    min_expected_per_entity = MINIMUM_EXPECTED_RELATIONSHIPS.get(entity_type, 1)
    expected_edges = len(entities) * min_expected_per_entity
    return min(1.0, total_actual_edges / max(1, expected_edges))

MINIMUM_EXPECTED_RELATIONSHIPS = {
    "AGENT":     3,   # BELONGS_TO + SPECIALIZES_IN + ESCALATES_TO
    "WORKFLOW":  2,   # REQUIRES_CAPABILITY + PRODUCES
    "DECISION":  1,   # at minimum one SUPPORTS relationship
    "WIKI_PAGE": 1,   # at minimum one REFERENCES
    "ARTIFACT":  1,   # at minimum one PRODUCES
    "POLICY":    1,   # at minimum one GOVERNED_BY from some entity
}
```

## Gap Identification

```python
def identify_domain_gaps(domain: str, config: dict) -> list[CoverageGap]:
    gaps = []

    if config["source_pattern"]:
        # Find files on disk that have no matching entity in graph
        files_on_disk = glob_files(config["source_pattern"])
        for file_path in files_on_disk:
            label = file_path_to_entity_label(file_path, config["expected_entity_type"])
            entity = entity_resolution.resolve_entity(label, config["expected_entity_type"])
            if not entity:
                gaps.append(CoverageGap(
                    gap_type="MISSING_ENTITY",
                    domain=domain,
                    source_file=file_path,
                    description=f"No {config['expected_entity_type']} entity for {label}",
                    severity="HIGH" if domain in ("AGENT", "WORKFLOW", "POLICY") else "MEDIUM",
                ))

    # Find entities with fewer relationships than minimum
    entities = get_entities_by_type(config["expected_entity_type"])
    min_expected = MINIMUM_EXPECTED_RELATIONSHIPS.get(config["expected_entity_type"], 1)
    for entity in entities:
        edge_count = len(graph_store.get_out_edges(entity.entity_id))
        if edge_count < min_expected:
            gaps.append(CoverageGap(
                gap_type="MISSING_RELATIONSHIP",
                domain=domain,
                entity_id=entity.entity_id,
                description=f"{entity.canonical_label} has only {edge_count} relationships "
                             f"(minimum expected: {min_expected})",
                severity="MEDIUM",
            ))

    return gaps

def identify_all_gaps() -> list[CoverageGap]:
    all_gaps = []
    for domain in COVERAGE_TARGETS:
        result = compute_domain_coverage(domain)
        all_gaps.extend(result.gaps)
    # Sort by severity
    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    return sorted(all_gaps, key=lambda g: severity_order.get(g.severity, 3))
```

## Overall Coverage Score

```python
def compute_overall_coverage() -> float:
    results = [compute_domain_coverage(domain) for domain in COVERAGE_TARGETS]
    # Weighted average — governance and core entities weight more
    DOMAIN_WEIGHTS = {
        "AGENT": 0.25, "WORKFLOW": 0.20, "POLICY": 0.20,
        "DECISION": 0.15, "WIKI_PAGE": 0.10, "ARTIFACT": 0.05, "INTEGRATION": 0.05
    }
    return sum(
        r.entity_coverage * DOMAIN_WEIGHTS.get(r.domain, 0.10)
        for r in results
    )

def get_coverage_trend() -> str:
    current  = graph_health_state_store.current_coverage_score
    previous = graph_health_state_store.previous_coverage_score
    if previous is None:
        return "UNKNOWN"
    delta = current - previous
    if delta > 0.02:   return "IMPROVING"
    if delta < -0.02:  return "DEGRADING"
    return "STABLE"
```

## Coverage Alerts

```python
def check_coverage_alerts():
    for domain, config in COVERAGE_TARGETS.items():
        result = compute_domain_coverage(domain)
        if result.entity_coverage < config["target"] * 0.80:   # 20% below target
            publish_enterprise_event("alerts.high", {
                "event_type": "GRAPH_COVERAGE_BELOW_TARGET",
                "domain": domain,
                "coverage": result.entity_coverage,
                "target": config["target"],
            })
```

## Integration Points

- `graph-health-monitor.md`: provides COVERAGE dimension score
- `ingestion-pipeline.md`: gap identification triggers re-ingestion jobs for missing entities
- `knowledge-gap-detector.md`: receives gap list for enrichment with additional gap types
- `graph-metrics-publisher.md`: coverage scores published to telemetry.metrics per domain
