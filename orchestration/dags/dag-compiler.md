# DAG Compiler

**System ID:** `dag-compiler`
**Role:** Transforms workflow definitions from the registry into executable DAG data structures — parses step declarations, resolves dependencies, applies inheritance, expands dynamic steps (loops, conditionals), and produces a validated, immutable DAG ready for the execution engine
**Storage:** `memory/orchestration-dags/compiled-dags/[definition-id]-v[N]-compiled.yaml`

---

## Purpose

Workflow definitions are authored in a declarative format optimized for human readability. The DAG engine needs an executable data structure optimized for traversal: pre-computed adjacency lists, topological order, critical path, and resolved input mappings. The compiler bridges these two representations — validating, expanding, and optimizing once at compile time so the runtime never pays that cost.

Compiled DAGs are cached and reused across all instances of the same workflow version.

---

## Compilation Pipeline

```
compile(definition_id, version) → CompiledDAG:
  
  definition = workflow_registry.get_version(definition_id, version)
  
  # Stage 1: Parse and normalize
  nodes = parse_nodes(definition.nodes)
  edges = parse_edges(definition.edges)
  
  # Stage 2: Expand dynamic constructs
  nodes, edges = expand_loops(nodes, edges, definition)
  nodes, edges = expand_conditionals(nodes, edges, definition)
  nodes, edges = expand_subworkflows(nodes, edges, definition)
  
  # Stage 3: Validate
  dag_validator.validate(nodes, edges)  # Raises on error
  
  # Stage 4: Build graph structures
  adjacency = build_adjacency_lists(nodes, edges)
  reverse_adjacency = build_reverse_adjacency(nodes, edges)
  topological_order = dependency_resolver.topological_sort(nodes, edges)
  
  # Stage 5: Critical path analysis
  critical_path = dependency_resolver.compute_critical_path(nodes, edges)
  
  # Stage 6: Resolve input mappings
  resolved_mappings = resolve_input_mappings(nodes, edges, definition)
  
  # Stage 7: Assign execution phases
  phases = assign_phases(topological_order, adjacency)
  
  compiled = CompiledDAG(
    definition_id, version,
    nodes, edges, adjacency, reverse_adjacency,
    topological_order, critical_path,
    resolved_mappings, phases
  )
  
  persist(compiled)
  RETURN compiled
```

---

## Dynamic Construct Expansion

### Loop Expansion

```yaml
# Source definition (compact)
- node_id: "review-each-component"
  node_type: "for_each"
  iterate_over: "{{input.components}}"
  body_step: "component-review-template"

# Expanded form (compiler produces at runtime when input.components is known)
# If input.components = ["auth", "api", "db"] → 3 nodes:
- node_id: "review-each-component[0]"
  executor: "qa-agent"
  input: {component: "auth"}
  depends_on: []

- node_id: "review-each-component[1]"
  executor: "qa-agent"
  input: {component: "api"}
  depends_on: []

- node_id: "review-each-component[2]"
  executor: "qa-agent"
  input: {component: "db"}
  depends_on: []

- node_id: "review-each-component-join"
  node_type: "join"
  depends_on: ["review-each-component[0]", "review-each-component[1]", "review-each-component[2]"]
```

```
expand_loops(nodes, edges, definition):
  
  expanded_nodes = []
  expanded_edges = []
  
  FOR each loop_node WHERE node_type == "for_each":
    
    IF loop_node.iterate_over is_static:
      items = evaluate_static(loop_node.iterate_over, definition.input_schema)
    ELSE:
      items = DEFER  # Expanded at runtime when upstream produces the list
    
    IF items != DEFER:
      FOR i, item in enumerate(items):
        child = clone_template(loop_node.body_step, suffix=f"[{i}]", input={item_key: item})
        expanded_nodes.append(child)
      
      join_node = create_join(loop_node.node_id + "-join", depends_on=[c.node_id for c in children])
      expanded_nodes.append(join_node)
    
    # Replace loop_node with expanded nodes in graph
  
  RETURN expanded_nodes, expanded_edges
```

### Conditional Expansion

```yaml
# Source definition
- node_id: "route-by-complexity"
  node_type: "conditional"
  condition: "{{upstream.complexity_score}} > 0.7"
  if_true: "full-architecture-review"
  if_false: "lightweight-review"

# Compiler produces conditional edges:
edges:
  - from: "route-by-complexity"
    to: "full-architecture-review"
    edge_type: "conditional"
    condition: "complexity_score > 0.7"
  - from: "route-by-complexity"
    to: "lightweight-review"
    edge_type: "conditional"
    condition: "complexity_score <= 0.7"
```

---

## Phase Assignment

Groups nodes into execution phases for checkpoint and reporting purposes:

```
assign_phases(topological_order, adjacency):
  
  # Phase = maximum distance from any source node (nodes with no dependencies)
  phases = {}
  
  FOR each node in topological_order:
    IF node.depends_on is empty:
      phases[node.node_id] = 0  # Phase 0: source nodes
    ELSE:
      phases[node.node_id] = MAX(phases[dep] for dep in node.depends_on) + 1
  
  # Group nodes by phase
  phase_groups = defaultdict(list)
  FOR node_id, phase in phases.items():
    phase_groups[phase].append(node_id)
  
  # Name phases using workflow definition's phase labels (if provided)
  # or default to "Phase N"
  RETURN phase_groups
```

---

## Compiled DAG Schema

```yaml
CompiledDAG:
  definition_id: string
  version: integer
  compiled_at: datetime
  compiler_version: string
  
  nodes:
    [node_id]:
      node_id: string
      node_type: string
      executor: string
      depends_on: [string]
      depends_on_mode: string
      resolved_input_mapping: map    # Fully resolved (no template vars)
      timeout_seconds: integer
      retry_policy_id: string
      failure_policy: string
      phase: integer
      on_critical_path: boolean
  
  adjacency:                          # Forward edges: node → [children]
    [node_id]: [string]
  
  reverse_adjacency:                  # Backward edges: node → [parents]
    [node_id]: [string]
  
  topological_order: [string]         # Nodes in valid execution order
  
  critical_path:
    node_ids: [string]
    estimated_duration_seconds: float
  
  phases:
    [phase_number]: [string]          # node_ids in this phase
  
  source_nodes: [string]              # Nodes with no dependencies
  sink_nodes: [string]                # Nodes with no dependents (terminal nodes)
  
  dynamic_nodes: [string]             # Nodes expanded at runtime (not compile time)
```

---

## Compilation Cache

```
get_or_compile(definition_id, version) → CompiledDAG:
  
  cache_key = f"{definition_id}-v{version}"
  
  IF cache_key in compiled_dag_cache:
    RETURN compiled_dag_cache[cache_key]
  
  IF file_exists(f"memory/orchestration-dags/compiled-dags/{cache_key}-compiled.yaml"):
    compiled = load(f".../{cache_key}-compiled.yaml")
    compiled_dag_cache[cache_key] = compiled
    RETURN compiled
  
  compiled = compile(definition_id, version)
  compiled_dag_cache[cache_key] = compiled
  RETURN compiled
```

---

## Integration

**Called by:**
- `workflow-engine/workflow-scheduler.md` — on workflow initialization
- `execution-runtime/runtime-engine.md` — on workflow spawn

**Calls:**
- `orchestration-dags/dependency-resolver.md` — topological sort and critical path
- `orchestration-dags/dag-validator.md` — validation after expansion
- `workflow-engine/workflow-registry.md` — reads workflow definition

**Writes to:** `memory/orchestration-dags/compiled-dags/[definition-id]-v[N]-compiled.yaml`
