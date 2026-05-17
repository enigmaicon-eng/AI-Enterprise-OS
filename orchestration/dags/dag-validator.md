# DAG Validator

**System ID:** `dag-validator`
**Role:** Validates workflow DAG definitions for structural correctness, semantic consistency, and execution feasibility — catches cycles, dangling references, impossible input mappings, unknown executor types, and policy violations before any execution attempt
**Storage:** None (stateless; returns validation result)

---

## Purpose

A workflow with a cycle will never complete. A node referencing an unregistered executor will never dispatch. An input mapping pointing to a non-existent upstream output will fail at runtime — but the failure can be caught at registration time. The DAG validator enforces the contract: if a workflow passes validation, it is structurally executable. Runtime failures are about the world; validation failures are about the definition.

---

## Validation Layers

Validation runs in three layers, ordered by cost and scope:

```
LAYER 1: STRUCTURAL (cheap, always run)
  - Node ID uniqueness
  - Edge endpoint existence (no dangling references)
  - Cycle detection
  - Source node existence (at least one node with no dependencies)
  - Sink node existence (at least one node with no dependents)

LAYER 2: SEMANTIC (moderate, run at registration)
  - All executor types registered in worker registry
  - All input_mapping sources reachable from declaring node
  - All subworkflow definition_ids exist in workflow registry
  - Conditional edge expressions are syntactically valid
  - Compensation plan references valid node_ids

LAYER 3: POLICY (governance, run at registration)
  - Maximum node count does not exceed system limit
  - No executor type combination violates isolation policy
  - Timeout values within allowed bounds
  - Retry policies reference registered policy IDs
  - Sensitive data handling requirements satisfied for executor type
```

---

## Structural Validation

```
validate_structural(nodes, edges) → ValidationResult:
  errors = []
  warnings = []
  
  node_ids = {n.node_id for n in nodes}
  
  # Rule 1: Node ID uniqueness
  IF len(node_ids) != len(nodes):
    duplicates = find_duplicates([n.node_id for n in nodes])
    errors.append(ValidationError("DUPLICATE_NODE_IDS", f"Duplicate node IDs: {duplicates}"))
  
  # Rule 2: Edge endpoints exist
  FOR each edge in edges:
    IF edge.from_node NOT IN node_ids:
      errors.append(ValidationError("DANGLING_EDGE_SOURCE", f"Edge source {edge.from_node} not found"))
    IF edge.to_node NOT IN node_ids:
      errors.append(ValidationError("DANGLING_EDGE_TARGET", f"Edge target {edge.to_node} not found"))
  
  # Rule 3: No self-loops
  FOR each edge WHERE edge.from_node == edge.to_node:
    errors.append(ValidationError("SELF_LOOP", f"Node {edge.from_node} depends on itself"))
  
  # Rule 4: Cycle detection
  cycle = dependency_resolver.find_cycle(nodes, edges)
  IF cycle:
    errors.append(ValidationError("CYCLE_DETECTED", f"Cycle: {' → '.join(cycle)}"))
  
  # Rule 5: At least one source node
  has_dependencies = {e.to_node for e in edges}
  source_nodes = [n for n WHERE n.node_id NOT IN has_dependencies]
  IF NOT source_nodes:
    errors.append(ValidationError("NO_SOURCE_NODES", "All nodes have dependencies — cycle or disconnected graph"))
  
  # Rule 6: Graph connectivity (warn if disconnected subgraphs)
  components = find_connected_components(nodes, edges)
  IF len(components) > 1:
    warnings.append(ValidationWarning("DISCONNECTED_SUBGRAPH", f"{len(components)} disconnected subgraphs — intentional?"))
  
  RETURN ValidationResult(errors, warnings)
```

---

## Semantic Validation

```
validate_semantic(nodes, edges, definition) → ValidationResult:
  errors = []
  warnings = []
  
  registered_executors = worker_registry.get_registered_executor_types()
  registered_policies   = retry_policy_registry.get_registered_ids()
  registered_workflows  = workflow_registry.list_active_definition_ids()
  
  FOR each node in nodes:
    
    # Rule: executor type registered
    IF node.executor NOT IN registered_executors:
      errors.append(ValidationError("UNKNOWN_EXECUTOR", f"Node {node.node_id}: executor '{node.executor}' not registered"))
    
    # Rule: subworkflow definition exists
    IF node.node_type == "subworkflow":
      IF node.subworkflow_definition_id NOT IN registered_workflows:
        errors.append(ValidationError("UNKNOWN_SUBWORKFLOW", f"Node {node.node_id}: definition '{node.subworkflow_definition_id}' not found"))
    
    # Rule: retry policy exists (if specified)
    IF node.retry_policy_id IS NOT NULL AND node.retry_policy_id NOT IN registered_policies:
      errors.append(ValidationError("UNKNOWN_RETRY_POLICY", f"Node {node.node_id}: policy '{node.retry_policy_id}' not registered"))
    
    # Rule: input mapping sources reachable
    ancestors = get_all_ancestors(node.node_id, reverse_adjacency(nodes, edges))
    FOR each (source_key, _) in node.input_mapping.items():
      IF source_key.startswith("input."):
        PASS  # Workflow input is always reachable
      ELIF "." in source_key:
        producer_id = source_key.split(".")[0]
        IF producer_id NOT IN ancestors AND producer_id NOT IN node_ids:
          errors.append(ValidationError("UNREACHABLE_INPUT", f"Node {node.node_id}: input source '{producer_id}' not an ancestor"))
  
  # Rule: conditional edge expressions are valid syntax
  FOR each edge WHERE edge.edge_type == "conditional":
    IF NOT is_valid_expression(edge.condition):
      errors.append(ValidationError("INVALID_CONDITION", f"Edge {edge.from_node}→{edge.to_node}: invalid condition '{edge.condition}'"))
  
  RETURN ValidationResult(errors, warnings)
```

---

## Policy Validation

```
validate_policy(nodes, edges, definition) → ValidationResult:
  errors = []
  warnings = []
  
  # Rule: Maximum node count
  IF len(nodes) > SYSTEM_MAX_NODES_PER_WORKFLOW:
    errors.append(ValidationError("EXCEEDS_MAX_NODES", f"{len(nodes)} nodes; limit is {SYSTEM_MAX_NODES_PER_WORKFLOW}"))
  
  # Rule: Maximum depth
  critical_path = dependency_resolver.compute_critical_path(nodes, edges)
  IF len(critical_path.node_ids) > SYSTEM_MAX_DEPTH:
    warnings.append(ValidationWarning("DEEP_CRITICAL_PATH", f"Critical path depth {len(critical_path.node_ids)} may impact performance"))
  
  # Rule: Human-approval nodes for high-risk workflows
  IF definition.risk_level in ["HIGH", "CRITICAL"]:
    human_approval_nodes = [n for n WHERE n.executor == "human-approval"]
    IF NOT human_approval_nodes:
      warnings.append(ValidationWarning("MISSING_HUMAN_GATE", "High-risk workflow has no human approval gate"))
  
  # Rule: Timeout sanity
  FOR each node WHERE node.timeout_seconds > definition.execution.max_duration_seconds:
    errors.append(ValidationError("NODE_TIMEOUT_EXCEEDS_WORKFLOW", f"Node {node.node_id} timeout exceeds workflow max duration"))
  
  RETURN ValidationResult(errors, warnings)
```

---

## Dry Run Validation

Simulates execution without dispatching real tasks — catches runtime failures in the definition:

```
dry_run_validate(definition_id, sample_input) → DryRunResult:
  
  compiled = dag_compiler.compile(definition_id, version=latest)
  
  # Initialize runtime graph
  graph = dag_runtime.initialize(run_id="dry-run", compiled_dag=compiled)
  
  # Simulate execution: walk topological order, produce synthetic outputs
  FOR each node in compiled.topological_order:
    synthetic_output = generate_synthetic_output(node.executor, node)
    dag_runtime.simulate_node_success(node.node_id, synthetic_output)
    
    # Check that downstream input mappings resolve against synthetic output
    for downstream in compiled.adjacency[node.node_id]:
      validate_input_resolves(downstream, node.node_id, synthetic_output)
  
  RETURN DryRunResult(
    success = (no validation errors),
    simulated_duration_estimate = estimate_total_duration(compiled),
    critical_path = compiled.critical_path,
    warnings = validation_warnings
  )
```

---

## Validation Result Schema

```yaml
ValidationResult:
  valid: boolean
  definition_id: string
  version: integer
  
  errors:
    - code: string                   # "CYCLE_DETECTED | DANGLING_EDGE_SOURCE | ..."
      severity: "ERROR | WARNING"
      message: string
      location: string | null        # node_id or edge description where error found
  
  warnings: [same structure]
  
  stats:
    node_count: integer
    edge_count: integer
    source_node_count: integer
    sink_node_count: integer
    max_parallelism: integer
    critical_path_length: integer
    estimated_min_duration_seconds: float
```

---

## Integration

**Called by:**
- `workflow-engine/workflow-registry.md` — validates on registration (all three layers)
- `orchestration-dags/dag-compiler.md` — validates after dynamic expansion (structural + semantic)

**Calls:**
- `orchestration-dags/dependency-resolver.md` — cycle detection and critical path
- `distributed-execution/worker-orchestration.md` — queries registered executor types

**Output consumed by:** `workflow-engine/workflow-registry.md` — rejects registration if errors present
