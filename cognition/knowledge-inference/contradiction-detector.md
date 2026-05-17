# Contradiction Detector
# Detects conflicting knowledge assertions, resolves automatically when possible, escalates otherwise

## Contradiction Types

```yaml
contradiction_types:
  FACT_CONFLICT:
    description: Same property of the same entity has different values from different sources
    example: "Agent trust_tier is 3 per agents/pm-org.md but 4 per wiki/onboarding/agent-ops.md"
    auto_resolvable: true   # if confidence delta > 0.20, higher confidence wins

  RELATIONSHIP_CONFLICT:
    description: Two relationships that cannot both be true simultaneously
    example: "Agent A BELONGS_TO Org-X and BELONGS_TO Org-Y (but cardinality is MANY_TO_ONE)"
    auto_resolvable: true   # cardinality violation resolved by favoring explicit source

  POLICY_CONFLICT:
    description: Two policies govern the same scope with conflicting enforcement rules
    example: "Policy P1 requires approval for artifact type X; Policy P2 exempts type X"
    auto_resolvable: false  # requires governance decision

  TRUST_CONFLICT:
    description: Trust tier or zone assignment is inconsistent across sources
    example: "Semantic firewall assigns agent to zone-restricted; agent definition says zone-standard"
    auto_resolvable: false  # requires security review

  TEMPORAL_CONFLICT:
    description: Valid time ranges of two facts overlap in incompatible ways
    example: "Approval A1 valid_until 2026-04-01 but decision refers to it as active on 2026-04-15"
    auto_resolvable: true   # earlier valid_until takes precedence
```

## Contradiction Detection Protocol

Contradictions are detected at two points:
1. **During ingestion** — `merge_properties()` in entity-resolution.md logs candidates
2. **Periodic batch scan** — full graph scan every 6 hours checks cardinality and structural conflicts

```python
class ContradictionDetector:
    def log_candidate(self, entity_id: str, property: str,
                      value_a, confidence_a: float,
                      value_b, confidence_b: float,
                      sources: list[str]):
        if value_a == value_b:
            return   # same value, no contradiction
        candidate = ContradictionCandidate(
            candidate_id=f"CONT-{uuid4()}",
            entity_id=entity_id,
            contradiction_type="FACT_CONFLICT",
            property=property,
            value_a=value_a, confidence_a=confidence_a,
            value_b=value_b, confidence_b=confidence_b,
            sources=sources,
            detected_at=now(),
        )
        if self._try_auto_resolve(candidate):
            return
        self._escalate(candidate)

    def record(self, contradiction: ContradictionCandidate):
        resolved = self._try_auto_resolve(contradiction)
        if not resolved:
            self._escalate(contradiction)
```

## Auto-Resolution Protocol

```python
def _try_auto_resolve(self, candidate: ContradictionCandidate) -> bool:
    if candidate.contradiction_type == "FACT_CONFLICT":
        delta = abs(candidate.confidence_a - candidate.confidence_b)
        if delta >= 0.20:
            # Higher-confidence fact wins
            winning_value     = candidate.value_a if candidate.confidence_a > candidate.confidence_b else candidate.value_b
            winning_confidence = max(candidate.confidence_a, candidate.confidence_b)
            losing_source     = candidate.sources[0 if candidate.confidence_b > candidate.confidence_a else 1]
            entity = graph_store.get_vertex(candidate.entity_id)
            entity.properties[candidate.property] = winning_value
            entity.metadata.confidence_score = winning_confidence
            entity.metadata.updated_at = now()
            graph_mutation_pipeline.write_vertex(entity)
            self._log_resolution(candidate, resolution="AUTO_CONFIDENCE_ARBITRATION",
                                  winning_value=winning_value, losing_source=losing_source)
            return True

    elif candidate.contradiction_type == "RELATIONSHIP_CONFLICT":
        rule = CARDINALITY_RULES.get(candidate.edge_type)
        if rule and rule.get("max_targets") == 1:
            # Keep the explicit source, remove the derived/event source
            explicit_edge = candidate.value_a if candidate.source_type_a == "EXPLICIT" else candidate.value_b
            other_edge    = candidate.value_b if explicit_edge == candidate.value_a else candidate.value_a
            graph_store.delete_edge(other_edge.edge_id)
            self._log_resolution(candidate, resolution="AUTO_CARDINALITY_ARBITRATION",
                                  kept_edge=explicit_edge.edge_id)
            return True

    elif candidate.contradiction_type == "TEMPORAL_CONFLICT":
        # Earlier valid_until takes precedence
        if candidate.confidence_a >= 0.90 and candidate.confidence_b >= 0.90:
            self._log_resolution(candidate, resolution="AUTO_TEMPORAL_ARBITRATION")
            return True

    return False   # cannot auto-resolve
```

## Escalation Protocol

Unresolvable contradictions are quarantined and escalated:

```python
def _escalate(self, candidate: ContradictionCandidate):
    # Quarantine the lower-confidence fact
    lower_conf_entity = candidate.value_b if candidate.confidence_a >= candidate.confidence_b else candidate.value_a
    if hasattr(lower_conf_entity, "entity_id"):
        entity_registry.quarantine_entity(
            lower_conf_entity.entity_id,
            reason=f"Contradiction detected: {candidate.contradiction_type} with {candidate.entity_id}"
        )

    # Append to contradictions log
    append_jsonl("memory/knowledge-inference/contradictions.jsonl", {
        "candidate_id":      candidate.candidate_id,
        "detected_at":       candidate.detected_at,
        "contradiction_type": candidate.contradiction_type,
        "entity_id":         candidate.entity_id,
        "status":            "PENDING_RESOLUTION",
        "sources":           candidate.sources,
        "description":       format_contradiction_description(candidate),
    })

    # Publish alert for governance review
    publish_enterprise_event("governance.decisions", {
        "event_type": "CONTRADICTION_REQUIRES_RESOLUTION",
        "candidate_id": candidate.candidate_id,
        "contradiction_type": candidate.contradiction_type,
        "entity_id": candidate.entity_id,
        "description": format_contradiction_description(candidate),
    })

def _log_resolution(self, candidate: ContradictionCandidate, resolution: str, **kwargs):
    append_jsonl("memory/knowledge-inference/contradictions.jsonl", {
        "candidate_id":   candidate.candidate_id,
        "resolved_at":    now(),
        "resolution_type": resolution,
        "status":         "AUTO_RESOLVED",
        **kwargs,
    })
```

## Periodic Batch Scan

```python
def run_full_contradiction_scan() -> ContradictionScanResult:
    violations = []

    # Check cardinality constraints
    for edge_type, rule in CARDINALITY_RULES.items():
        if rule.get("max_targets"):
            for source_id in graph_store.get_all_source_ids(edge_type):
                edges = graph_store.get_out_edges(source_id, [edge_type])
                if len(edges) > rule["max_targets"]:
                    violations.append(ContradictionCandidate(
                        contradiction_type="RELATIONSHIP_CONFLICT",
                        edge_type=edge_type,
                        source_id=source_id,
                        offending_edges=edges,
                    ))

    # Check policy conflicts (same scope, conflicting enforcement)
    policies = get_entities_by_type("POLICY")
    for i, p1 in enumerate(policies):
        for p2 in policies[i+1:]:
            if (p1.properties.get("scope") == p2.properties.get("scope") and
                policies_conflict(p1, p2)):
                violations.append(ContradictionCandidate(
                    contradiction_type="POLICY_CONFLICT",
                    entity_id=p1.entity_id,
                    conflicting_entity_id=p2.entity_id,
                ))

    for v in violations:
        record(v)

    return ContradictionScanResult(total_violations=len(violations),
                                    scanned_at=now())
```

## Integration Points

- `entity-resolution.md`: calls `log_candidate()` during `merge_properties()` when values differ
- `inference-engine.md`: sends ContradictionCandidate records from rule R011 and R013
- `governance-attestation/`: policy conflict contradictions routed to governance approval queue
- `graph-observability/integrity-validator.md`: calls `run_full_contradiction_scan()` in 6h validation cycle
