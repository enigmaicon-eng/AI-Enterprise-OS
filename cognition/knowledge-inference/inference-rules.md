# Inference Rules
# 15 canonical forward-chaining rules (R001–R015) with trigger patterns and confidence factors

## Rule Schema

```python
class InferenceRule:
    rule_id: str                  # R001–R015
    name: str
    group: str                    # DELEGATION | CAPABILITY | POLICY | KNOWLEDGE | STRUCTURAL | GOVERNANCE
    trigger_edge_types: list[str] # edge types that trigger this rule on mutation
    derived_edge_type: str        # the edge type this rule produces
    confidence_factor: float      # multiplied by input edge confidences
    max_depth: int                # max traversal hops during derivation
    description: str
```

## Delegation Group

### R001 — Transitive Delegation

```python
RULE_R001 = InferenceRule(
    rule_id="R001",
    name="TRANSITIVE_DELEGATION",
    group="DELEGATION",
    trigger_edge_types=["DELEGATES_TO"],
    derived_edge_type="TRANSITIVELY_DELEGATES_TO",
    confidence_factor=0.85,
    max_depth=5,   # limit chain length to prevent explosion
    description="If A delegates to B and B delegates to C, A transitively delegates to C",
)

def derive_R001(candidate: EntityVertex, max_depth=5) -> list[GraphEdge]:
    derived = []
    # Find all agents reachable from candidate via DELEGATES_TO (depth 2+)
    paths = find_all_paths(candidate.entity_id, target_id=None,
                           edge_types=["DELEGATES_TO"], max_depth=max_depth)
    for path in paths:
        if path.hop_count < 2:
            continue   # direct delegation already exists as DELEGATES_TO
        terminal = path.nodes[-1]
        if terminal.entity_id == candidate.entity_id:
            continue   # circular — handled by R011
        confidence = confidence_factor * min(e.confidence for e in path.edges)
        derived.append(GraphEdge(
            edge_type="TRANSITIVELY_DELEGATES_TO",
            source_id=candidate.entity_id, target_id=terminal.entity_id,
            confidence=confidence, weight=0.75,
            properties={"chain_length": path.hop_count, "via": [n.entity_id for n in path.nodes[1:-1]]},
        ))
    return derived
```

### R008 — Trust Degradation on Cross-Tier Delegation

```python
RULE_R008 = InferenceRule(
    rule_id="R008", name="TRUST_DELEGATION_DEGRADED", group="DELEGATION",
    trigger_edge_types=["DELEGATES_TO"],
    derived_edge_type="TRUST_BOUNDARY_CROSSED",
    confidence_factor=0.95, max_depth=1,
    description="If A (tier N) delegates to B (tier M < N), trust boundary is crossed",
)

def derive_R008(source: EntityVertex, max_depth=1) -> list[GraphEdge]:
    derived = []
    for edge in graph_store.get_out_edges(source.entity_id, ["DELEGATES_TO"]):
        target = graph_store.get_vertex(edge.target_id)
        source_tier = source.properties.get("trust_tier", 3)
        target_tier = target.properties.get("trust_tier", 3)
        if target_tier < source_tier:
            derived.append(GraphEdge(
                edge_type="TRUST_BOUNDARY_CROSSED",
                source_id=source.entity_id, target_id=target.entity_id,
                confidence=0.95, weight=0.9,
                properties={"from_tier": source_tier, "to_tier": target_tier,
                             "tier_drop": source_tier - target_tier},
            ))
    return derived
```

### R011 — Circular Delegation Detection

```python
RULE_R011 = InferenceRule(
    rule_id="R011", name="CIRCULAR_DELEGATION", group="DELEGATION",
    trigger_edge_types=["DELEGATES_TO", "TRANSITIVELY_DELEGATES_TO"],
    derived_edge_type="CIRCULAR_DELEGATION_DETECTED",
    confidence_factor=1.00, max_depth=10,
    description="If A transitively delegates to A, a delegation cycle exists",
)

def derive_R011(candidate: EntityVertex, max_depth=10) -> list[GraphEdge]:
    result = dfs_traverse(TraversalConfig(
        start_id=candidate.entity_id, edge_types=["DELEGATES_TO"],
        max_depth=max_depth, strategy="DFS"
    ))
    derived = []
    for cycle_path in result.cycles_detected:
        if cycle_path[0] == candidate.entity_id:
            derived.append(GraphEdge(
                edge_type="CIRCULAR_DELEGATION_DETECTED",
                source_id=candidate.entity_id, target_id=candidate.entity_id,
                confidence=1.00, weight=1.0,
                properties={"cycle_path": cycle_path},
            ))
            publish_enterprise_event("alerts.critical", {
                "event_type": "CIRCULAR_DELEGATION_DETECTED",
                "agent_id": candidate.entity_id,
                "cycle_path": cycle_path,
            })
    return derived
```

## Capability Group

### R002 — Capability Inheritance

```python
RULE_R002 = InferenceRule(
    rule_id="R002", name="CAPABILITY_INHERITANCE", group="CAPABILITY",
    trigger_edge_types=["SPECIALIZES_IN", "SUBSUMES"],
    derived_edge_type="IMPLICITLY_HAS_CAPABILITY",
    confidence_factor=0.80, max_depth=3,
    description="If Agent specializes_in Capability A, and A subsumes B, Agent implicitly has B",
)
```

### R010 — Capability Gap Detection

```python
RULE_R010 = InferenceRule(
    rule_id="R010", name="CAPABILITY_GAP", group="CAPABILITY",
    trigger_edge_types=["REQUIRES_CAPABILITY", "SPECIALIZES_IN"],
    derived_edge_type="HAS_CAPABILITY_GAP",
    confidence_factor=0.90, max_depth=3,
    description="If Workflow requires Capability C and no ACTIVE Agent has C, gap exists",
)

def derive_R010(workflow: EntityVertex, max_depth=3) -> list[GraphEdge]:
    derived = []
    for req_edge in graph_store.get_out_edges(workflow.entity_id, ["REQUIRES_CAPABILITY"]):
        cap = graph_store.get_vertex(req_edge.target_id)
        # Find any active agent with SPECIALIZES_IN or IMPLICITLY_HAS_CAPABILITY for this cap
        capable_agents = graph_store.get_in_edges(cap.entity_id,
                                                    ["SPECIALIZES_IN", "IMPLICITLY_HAS_CAPABILITY"])
        active_capable = [e for e in capable_agents
                          if graph_store.get_vertex(e.source_id).properties.get("status") == "ACTIVE"]
        if not active_capable:
            derived.append(GraphEdge(
                edge_type="HAS_CAPABILITY_GAP",
                source_id=workflow.entity_id, target_id=cap.entity_id,
                confidence=0.90, weight=0.9,
                properties={"gap_type": "NO_CAPABLE_AGENT"},
            ))
            publish_enterprise_event("alerts.high", {
                "event_type": "CAPABILITY_GAP_DETECTED",
                "workflow_id": workflow.entity_id,
                "missing_capability": cap.canonical_label,
            })
    return derived
```

## Policy Group

### R003 — Policy Applicability

```python
RULE_R003 = InferenceRule(
    rule_id="R003", name="POLICY_APPLICABILITY", group="POLICY",
    trigger_edge_types=["GOVERNED_BY", "PRODUCES"],
    derived_edge_type="COVERED_BY_POLICY",
    confidence_factor=0.88, max_depth=2,
    description="If Workflow W is governed by Policy P and W produces Artifact A, then A is covered by P",
)
```

### R013 — Policy Conflict Detection

```python
RULE_R013 = InferenceRule(
    rule_id="R013", name="POLICY_CONFLICT", group="POLICY",
    trigger_edge_types=["GOVERNED_BY"],
    derived_edge_type="POLICY_CONFLICT_DETECTED",
    confidence_factor=0.90, max_depth=1,
    description="If two policies govern the same entity scope and have conflicting enforcement rules",
)
```

## Knowledge Group

### R004 — Knowledge Dependency

```python
RULE_R004 = InferenceRule(
    rule_id="R004", name="KNOWLEDGE_DEPENDENCY", group="KNOWLEDGE",
    trigger_edge_types=["REFERENCES", "BELONGS_TO"],
    derived_edge_type="KNOWLEDGE_OF",
    confidence_factor=0.75, max_depth=2,
    description="If WikiPage W references Entity E, and E belongs to Org O, then W is knowledge of O",
)
```

### R007 — Stale Dependency Risk

```python
RULE_R007 = InferenceRule(
    rule_id="R007", name="STALE_DEPENDENCY_RISK", group="KNOWLEDGE",
    trigger_edge_types=["CONSUMES", "REFERENCES"],
    derived_edge_type="AT_RISK_DUE_TO",
    confidence_factor=0.75, max_depth=2,
    description="If A depends on B and B is stale, A is at risk",
)

def derive_R007(entity: EntityVertex, max_depth=2) -> list[GraphEdge]:
    derived = []
    for dep_edge in graph_store.get_out_edges(entity.entity_id, ["CONSUMES", "REFERENCES"]):
        dependency = graph_store.get_vertex(dep_edge.target_id)
        if staleness_detector.is_stale(dependency):
            derived.append(GraphEdge(
                edge_type="AT_RISK_DUE_TO",
                source_id=entity.entity_id, target_id=dependency.entity_id,
                confidence=0.75, weight=0.8,
                properties={"risk_type": "STALE_DEPENDENCY",
                             "dependency_stale_since": dependency.metadata.updated_at},
            ))
    return derived
```

### R014 — Wiki Staleness Detection

```python
RULE_R014 = InferenceRule(
    rule_id="R014", name="WIKI_STALENESS", group="KNOWLEDGE",
    trigger_edge_types=["REFERENCES"],
    derived_edge_type="MAY_BE_STALE",
    confidence_factor=0.80, max_depth=1,
    description="If WikiPage references Entity and Entity was updated after the WikiPage, page may be stale",
)
```

## Structural Group

### R005 — Escalation Path Derivation

```python
RULE_R005 = InferenceRule(
    rule_id="R005", name="ESCALATION_PATH", group="STRUCTURAL",
    trigger_edge_types=["ESCALATES_TO"],
    derived_edge_type="HAS_ESCALATION_PATH",
    confidence_factor=0.90, max_depth=5,
    description="Materialized full escalation chain from agent to terminal authority",
)
```

### R006 — Collaboration Reachability

```python
RULE_R006 = InferenceRule(
    rule_id="R006", name="COLLABORATION_REACHABILITY", group="STRUCTURAL",
    trigger_edge_types=["COLLABORATES_WITH"],
    derived_edge_type="REACHABLE_FROM",
    confidence_factor=0.70, max_depth=3,
    description="If A collaborates with B and B with C, A is indirectly reachable from C",
)
```

### R012 — Orphan Artifact Detection

```python
RULE_R012 = InferenceRule(
    rule_id="R012", name="ORPHAN_ARTIFACT", group="STRUCTURAL",
    trigger_edge_types=["PRODUCES", "CONSUMES"],
    derived_edge_type="IS_ORPHANED",
    confidence_factor=0.95, max_depth=1,
    description="Artifact with no PRODUCES or CONSUMES relationship is an orphan",
)
```

### R015 — Organizational Isolation

```python
RULE_R015 = InferenceRule(
    rule_id="R015", name="ORG_ISOLATION", group="STRUCTURAL",
    trigger_edge_types=["COLLABORATES_WITH"],
    derived_edge_type="IS_ISOLATED",
    confidence_factor=0.90, max_depth=1,
    description="Organization with no COLLABORATES_WITH edges is structurally isolated",
)
```

## Governance Group

### R009 — Approval Coverage

```python
RULE_R009 = InferenceRule(
    rule_id="R009", name="APPROVAL_COVERAGE", group="GOVERNANCE",
    trigger_edge_types=["ATTESTED_BY", "GOVERNED_BY"],
    derived_edge_type="IS_UNATESTED",
    confidence_factor=0.90, max_depth=2,
    description="Artifact required to have approval but missing ATTESTED_BY edge is unatested",
)
```

## Integration Points

- `inference-engine.md`: iterates RULE_EVALUATION_ORDER, calls each derive_* function
- `contradiction-detector.md`: R013 (POLICY_CONFLICT) and R011 (CIRCULAR_DELEGATION) feed contradiction log
- `graph-observability/knowledge-gap-detector.md`: R010 (CAPABILITY_GAP) and R012 (ORPHAN_ARTIFACT) results feed gap report
- `enterprise-telemetry/runtime-trigger-engine.md`: R011 fires alerts.critical for circular delegation
