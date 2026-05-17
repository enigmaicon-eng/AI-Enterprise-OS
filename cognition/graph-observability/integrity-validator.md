# Integrity Validator
# Schema compliance, referential integrity, cardinality, and confidence bounds validation

## Validation Schedule

- **Continuous (write-time)**: `validate_vertex()` and `validate_edge()` called in GraphMutationPipeline
- **Full scan**: every 6 hours, validates all entities and edges in graph

## Integrity Check Suite

```python
class IntegrityCheckSuite:
    def run_full_scan(self) -> IntegrityScanResult:
        started_at = now()
        violations = []

        violations.extend(self.check_schema_compliance())
        violations.extend(self.check_referential_integrity())
        violations.extend(self.check_cardinality_constraints())
        violations.extend(self.check_confidence_bounds())
        violations.extend(self.check_lifecycle_consistency())
        violations.extend(self.check_temporal_consistency())

        result = IntegrityScanResult(
            scan_id=f"INT-{uuid4()}",
            started_at=started_at,
            duration_ms=now_ms() - to_ms(started_at),
            total_entities_checked=graph_store.vertex_count(),
            total_edges_checked=graph_store.edge_count(),
            violation_count=len(violations),
            violations=violations,
            integrity_score=self.compute_integrity_score(violations),
        )
        self._publish_results(result)
        return result
```

## Schema Compliance

```python
def check_schema_compliance(self) -> list[IntegrityViolation]:
    violations = []
    for entity in graph_store.get_all_vertices():
        result = validate_vertex(entity)
        if not result.valid:
            violations.append(IntegrityViolation(
                violation_type="SCHEMA_COMPLIANCE",
                entity_id=entity.entity_id,
                description="; ".join(result.errors),
                severity="HIGH",
            ))
    for edge in graph_store.get_all_edges():
        result = validate_edge(edge)
        if not result.valid:
            violations.append(IntegrityViolation(
                violation_type="SCHEMA_COMPLIANCE",
                edge_id=edge.edge_id,
                description="; ".join(result.errors),
                severity="HIGH",
            ))
    return violations
```

## Referential Integrity

No edge should reference a non-existent entity:

```python
def check_referential_integrity(self) -> list[IntegrityViolation]:
    violations = []
    all_entity_ids = set(graph_store.get_all_entity_ids())

    for edge in graph_store.get_all_edges():
        if edge.source_id not in all_entity_ids:
            violations.append(IntegrityViolation(
                violation_type="DANGLING_EDGE",
                edge_id=edge.edge_id,
                description=f"source_id {edge.source_id} does not exist",
                severity="CRITICAL",   # dangling edges are critical integrity violations
            ))
        if edge.target_id not in all_entity_ids:
            violations.append(IntegrityViolation(
                violation_type="DANGLING_EDGE",
                edge_id=edge.edge_id,
                description=f"target_id {edge.target_id} does not exist",
                severity="CRITICAL",
            ))

    return violations

def count_dangling_edges(self) -> int:
    all_entity_ids = set(graph_store.get_all_entity_ids())
    return sum(
        1 for edge in graph_store.get_all_edges()
        if edge.source_id not in all_entity_ids or edge.target_id not in all_entity_ids
    )
```

## Cardinality Constraints

```python
def check_cardinality_constraints(self) -> list[IntegrityViolation]:
    violations = []
    for edge_type, rule in CARDINALITY_RULES.items():
        max_targets = rule.get("max_targets")
        min_targets = rule.get("min_targets")

        if max_targets:
            for source_id in graph_store.get_all_source_ids(edge_type):
                edges = graph_store.get_out_edges(source_id, [edge_type])
                if len(edges) > max_targets:
                    violations.append(IntegrityViolation(
                        violation_type="CARDINALITY_EXCEEDED",
                        entity_id=source_id,
                        description=f"{edge_type}: {len(edges)} targets (max: {max_targets})",
                        severity="HIGH",
                    ))

        if min_targets is not None:
            # Only check ACTIVE entities — deprecated don't need to satisfy minimums
            for entity in get_entities_by_type(
                SOURCE_TYPE_FOR_EDGE_TYPE[edge_type], status="ACTIVE"
            ):
                edges = graph_store.get_out_edges(entity.entity_id, [edge_type])
                if len(edges) < min_targets:
                    violations.append(IntegrityViolation(
                        violation_type="CARDINALITY_BELOW_MINIMUM",
                        entity_id=entity.entity_id,
                        description=f"{edge_type}: {len(edges)} targets (min: {min_targets})",
                        severity="MEDIUM",
                    ))

    return violations
```

## Confidence Bounds

```python
def check_confidence_bounds(self) -> list[IntegrityViolation]:
    violations = []
    for entity in graph_store.get_all_vertices():
        score = entity.metadata.confidence_score
        if not (0.0 <= score <= 1.0):
            violations.append(IntegrityViolation(
                violation_type="CONFIDENCE_OUT_OF_BOUNDS",
                entity_id=entity.entity_id,
                description=f"confidence_score={score} outside [0.0, 1.0]",
                severity="HIGH",
            ))
    for edge in graph_store.get_all_edges():
        for field, value in [("confidence", edge.confidence), ("weight", edge.weight)]:
            if not (0.0 <= value <= 1.0):
                violations.append(IntegrityViolation(
                    violation_type="CONFIDENCE_OUT_OF_BOUNDS",
                    edge_id=edge.edge_id,
                    description=f"{field}={value} outside [0.0, 1.0]",
                    severity="HIGH",
                ))
    return violations
```

## Temporal Consistency

```python
def check_temporal_consistency(self) -> list[IntegrityViolation]:
    violations = []
    for entity in graph_store.get_all_vertices():
        created = parse_iso(entity.metadata.created_at)
        updated = parse_iso(entity.metadata.updated_at)
        if updated < created:
            violations.append(IntegrityViolation(
                violation_type="TEMPORAL_INCONSISTENCY",
                entity_id=entity.entity_id,
                description=f"updated_at {updated} is before created_at {created}",
                severity="MEDIUM",
            ))
    return violations
```

## Lifecycle Consistency

```python
def check_lifecycle_consistency(self) -> list[IntegrityViolation]:
    violations = []
    for entity in graph_store.get_all_vertices():
        if entity.lifecycle.status == "MERGED" and not entity.lifecycle.merged_into:
            violations.append(IntegrityViolation(
                violation_type="LIFECYCLE_INCONSISTENCY",
                entity_id=entity.entity_id,
                description="MERGED entity has no merged_into pointer",
                severity="HIGH",
            ))
        if entity.lifecycle.status == "ACTIVE" and entity.lifecycle.merged_into:
            violations.append(IntegrityViolation(
                violation_type="LIFECYCLE_INCONSISTENCY",
                entity_id=entity.entity_id,
                description="ACTIVE entity has unexpected merged_into pointer",
                severity="MEDIUM",
            ))
    return violations
```

## Integrity Score

```python
def compute_integrity_score(self, violations: list[IntegrityViolation]) -> float:
    total = graph_store.vertex_count() + graph_store.edge_count()
    if total == 0:
        return 1.0
    critical_count = sum(1 for v in violations if v.severity == "CRITICAL")
    high_count     = sum(1 for v in violations if v.severity == "HIGH")
    medium_count   = sum(1 for v in violations if v.severity == "MEDIUM")
    # Weighted penalty: critical = 3x, high = 1x, medium = 0.33x
    weighted_violations = critical_count * 3 + high_count + medium_count * 0.33
    return max(0.0, 1.0 - weighted_violations / total)
```

## Integration Points

- `graph-health-monitor.md`: provides INTEGRITY dimension score
- `graph-schema.md`: GraphMutationPipeline calls `validate_vertex()` / `validate_edge()` on every write
- `contradiction-detector.md`: `run_full_contradiction_scan()` called as part of 6h integrity scan
- `graph-metrics-publisher.md`: violation counts published to telemetry.metrics
