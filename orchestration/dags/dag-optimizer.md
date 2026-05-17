# DAG Optimizer

**System ID:** `dag-optimizer`
**Role:** Optimizes compiled DAGs for execution efficiency — extracts maximum parallelism, reorders independent nodes for resource affinity, identifies critical path nodes for priority elevation, applies node fusion where safe, and produces an optimized execution plan
**Storage:** None (stateless; produces optimized plan embedded in compiled DAG)

---

## Purpose

A correct DAG execution order is not necessarily an efficient one. Two nodes with no dependency between them could run sequentially by accident of ordering. A critical path node could be deprioritized behind low-value parallel work. The optimizer applies a set of transformations to the compiled DAG that preserve correctness while maximizing throughput and minimizing latency.

---

## Optimization Passes

The optimizer applies passes in sequence; each pass may enable later passes:

```
optimize(compiled_dag) → OptimizedDAG:
  
  plan = compiled_dag.copy()
  
  plan = pass_extract_parallelism(plan)
  plan = pass_critical_path_priority(plan)
  plan = pass_resource_affinity_reorder(plan)
  plan = pass_node_fusion(plan)
  plan = pass_eager_gate_scheduling(plan)
  
  RETURN plan
```

---

## Pass 1 — Extract Maximum Parallelism

```
pass_extract_parallelism(plan):
  
  # Identify all maximal independent sets — groups of nodes that:
  # (a) have no dependency between each other
  # (b) all their dependencies are in earlier phases
  
  execution_waves = []
  remaining = set(plan.nodes.keys())
  completed = set()
  
  WHILE remaining:
    # Current wave: all nodes whose dependencies are all in 'completed'
    wave = [
      n for n in remaining
      WHERE all(dep in completed for dep in plan.nodes[n].depends_on)
    ]
    
    execution_waves.append(wave)
    completed.update(n.node_id for n in wave)
    remaining -= set(n.node_id for n in wave)
  
  plan.execution_waves = execution_waves
  
  # Max theoretical parallelism = max wave size
  plan.max_parallel_degree = MAX(len(wave) for wave in execution_waves)
  
  # Effective parallelism (accounting for worker constraints)
  plan.effective_parallel_degree = MIN(
    plan.max_parallel_degree,
    worker_pool.max_concurrent_by_type(plan.primary_executor_type)
  )
  
  RETURN plan
```

---

## Pass 2 — Critical Path Priority Elevation

```
pass_critical_path_priority(plan):
  
  critical_path_nodes = set(plan.critical_path.node_ids)
  
  FOR each node in plan.nodes.values():
    IF node.node_id in critical_path_nodes:
      # Elevate priority of critical path nodes within their executor queue
      node.scheduling_priority_boost = 2.0  # 2× priority multiplier for dispatcher
      node.scheduling_hint = "CRITICAL_PATH"
    
    ELIF node.node_id in plan.near_critical_nodes:
      node.scheduling_priority_boost = 1.5
      node.scheduling_hint = "NEAR_CRITICAL"
    
    ELSE:
      node.scheduling_priority_boost = 1.0
      node.scheduling_hint = "STANDARD"
  
  RETURN plan
```

---

## Pass 3 — Resource Affinity Reordering

Within the same execution wave (independent nodes), reorder to maximize worker reuse:

```
pass_resource_affinity_reorder(plan):
  
  FOR each wave in plan.execution_waves:
    
    # Group by executor_type within wave
    by_executor = defaultdict(list)
    FOR each node_id in wave:
      by_executor[plan.nodes[node_id].executor_type].append(node_id)
    
    # Reorder: keep same-executor-type nodes adjacent
    # Workers processing a batch of same-type tasks amortize startup cost
    reordered_wave = []
    FOR executor_type, nodes in by_executor.items():
      # Sort by required_capabilities for maximum capability-group locality
      nodes.sort(key = lambda n: str(sorted(plan.nodes[n].required_capabilities)))
      reordered_wave.extend(nodes)
    
    wave[:] = reordered_wave
  
  RETURN plan
```

---

## Pass 4 — Node Fusion

Merge adjacent nodes with same executor type and no intermediate dependencies into a single batched node when the executor supports batch execution:

```
pass_node_fusion(plan):
  
  fused_nodes = []
  
  FOR each wave in plan.execution_waves:
    
    # Find fusable groups: consecutive nodes in wave with same executor type
    # that support batch mode and have no dependency between them
    groups = group_adjacent_by_executor(wave)
    
    FOR each group in groups WHERE len(group) > 1:
      primary_executor = plan.nodes[group[0]].executor_type
      
      IF executor_supports_batch(primary_executor) AND len(group) >= fusion_threshold:
        # Fuse into single batch node
        fused_node = FusedNode(
          node_id = f"fused-{group[0]}-to-{group[-1]}",
          executor_type = primary_executor,
          batch_inputs = [plan.nodes[n].resolved_input_mapping for n in group],
          constituent_nodes = group,
          depends_on = union(plan.nodes[n].depends_on for n in group)
        )
        
        # Replace group with fused_node in wave
        fused_nodes.append((group, fused_node))
  
  FOR (group, fused_node) in fused_nodes:
    plan.replace_nodes(group, fused_node)
  
  RETURN plan
```

---

## Pass 5 — Eager Gate Scheduling

Schedule gates as early as possible (as soon as their dependencies are met) rather than deferring:

```
pass_eager_gate_scheduling(plan):
  
  FOR each gate_node WHERE node.node_type == "gate":
    
    # Gates are often scheduled after all parallel branches complete.
    # Eager scheduling: if a gate only needs N of M parallel branches,
    # schedule it to run as soon as those N are complete.
    
    IF gate_node.depends_on_mode == "ANY":
      # Gate fires on first dependency completion — already eager by definition
      PASS
    
    ELIF gate_node.depends_on_mode == "ALL":
      # Find the critical-path dependency for this gate
      # All other dependencies are off-critical-path and will complete first
      gate_node.scheduling_hint = "EAGER_GATE"
      gate_node.scheduling_priority_boost *= 1.3  # Mild boost to ensure quick gate check
  
  RETURN plan
```

---

## Optimized Plan Output

```yaml
OptimizedDAG:
  [all CompiledDAG fields]
  
  # Optimizer additions
  execution_waves: [[string]]              # Ordered waves; nodes in each wave run in parallel
  max_parallel_degree: integer
  effective_parallel_degree: integer
  
  # Per-node optimization metadata
  nodes:
    [node_id]:
      scheduling_priority_boost: float
      scheduling_hint: "CRITICAL_PATH | NEAR_CRITICAL | STANDARD | EAGER_GATE"
      fused_with: [string] | null          # If this node was fused
  
  fused_nodes:
    - fused_node_id: string
      constituent_nodes: [string]
      batch_size: integer
  
  optimizer_stats:
    parallelism_gain_pct: float            # Extra parallelism extracted vs naive order
    critical_path_nodes_elevated: integer
    nodes_fused: integer
    estimated_speedup_vs_sequential: float
```

---

## Integration

**Called by:** `orchestration-dags/dag-compiler.md` — as final compilation stage
**Calls:**
- `orchestration-dags/dependency-resolver.md` — reads critical path and float data
- `distributed-execution/worker-orchestration.md` — queries executor type batch support

**Output consumed by:** `workflow-engine/dag-engine.md` — uses execution waves and priority hints during dispatch
