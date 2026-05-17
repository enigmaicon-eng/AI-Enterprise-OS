# Workflow Dependency Maps

**System ID:** `workflow-dependency-maps`
**Role:** Generates and maintains live dependency maps showing how active workflow runs relate to each other — shared resources, cascading SLO dependencies, agent conflicts, data dependencies between runs, and the impact graph of a failure in any single workflow on all downstream workflows
**Storage:** `memory/runtime-topology/dependency-state.yaml`

---

## Purpose

Workflows do not execute in isolation. When run-A produces an artifact consumed by run-B, and run-B's output is needed by run-C before run-D can gate, the dependency map reveals that run-A is the true root of an entire execution chain. When run-A stalls, that stall propagates invisibly through B, C, and D without the operator knowing why. Workflow dependency maps make these chains explicit and live — enabling operators to understand blast radius before deciding whether to intervene.

---

## Dependency Types

```yaml
WorkflowDependencyTypes:
  
  ARTIFACT_DEPENDENCY:
    description: "Run B consumes an artifact produced by run A"
    detection: "artifact-registry lineage metadata"
    bidirectional: false
    cascade_risk: HIGH
  
  AGENT_CONFLICT:
    description: "Runs A and B require the same limited-capacity agent/pool simultaneously"
    detection: "worker reservation overlap"
    bidirectional: true
    cascade_risk: MEDIUM
  
  SLO_CHAIN:
    description: "Run A's completion is on the critical path of run B's SLO"
    detection: "workflow composition and SLO dependency declarations"
    bidirectional: false
    cascade_risk: HIGH
  
  DATA_PIPELINE:
    description: "Run B requires fresh data produced by run A's upstream pipeline"
    detection: "integration.data.signals topic and dependency declarations"
    bidirectional: false
    cascade_risk: HIGH
  
  GATE_DEPENDENCY:
    description: "Run B cannot proceed past a gate until run A passes the same gate (shared gate verdict)"
    detection: "gate registry shared-verdict declarations"
    bidirectional: false
    cascade_risk: MEDIUM
  
  APPROVAL_POOL:
    description: "Both runs are waiting for the same T4/T5 approver who has limited bandwidth"
    detection: "pending approval queue with same required_approver"
    bidirectional: true
    cascade_risk: MEDIUM
```

---

## Dependency Map Schema

```yaml
WorkflowDependencyMap:
  map_id: string
  generated_at: datetime
  
  # Active workflow nodes
  workflow_nodes: [WorkflowNode]
  
  # Dependencies between workflows
  dependencies: [WorkflowDependency]
  
  # Identified critical paths and clusters
  critical_chains: [DependencyChain]
  conflict_clusters: [ConflictCluster]
  
  # Impact analysis
  highest_impact_workflow: string    # run_id with most downstream dependents
  longest_dependency_chain: integer  # Max depth of dependency tree

WorkflowNode:
  run_id: string
  definition_id: string
  status: string
  priority: string
  started_at: datetime
  slo_on_track: boolean
  
  # Dependency counts
  upstream_count: integer     # Workflows this depends on
  downstream_count: integer   # Workflows that depend on this

WorkflowDependency:
  dependency_id: string
  upstream_run_id: string    # Provider
  downstream_run_id: string  # Consumer
  dependency_type: string
  
  # Risk assessment
  cascade_risk: "LOW | MEDIUM | HIGH"
  upstream_healthy: boolean
  delay_propagation_multiplier: float    # If upstream is 1h late, downstream is ~Xh late
  
  # Status
  satisfied: boolean         # Dependency condition is currently met
  blocking: boolean          # This dependency is currently blocking downstream
  blocking_since: datetime | null

DependencyChain:
  chain_id: string
  run_ids: [string]          # Ordered chain from root to leaf
  chain_depth: integer
  bottleneck_run_id: string  # Slowest run in the chain
  estimated_end_to_end_delay_seconds: float
  all_on_track: boolean

ConflictCluster:
  cluster_id: string
  conflict_type: string
  competing_run_ids: [string]
  shared_resource: string    # What they're competing for
  resolution_strategy: "PRIORITY_ORDER | QUEUE | SPLIT"
```

---

## Dependency Detection Engine

```
build_dependency_map() → WorkflowDependencyMap:
  
  active_runs = dag_runtime.get_all_active_runs()
  dependencies = []
  
  # --- Artifact dependencies ---
  FOR run in active_runs:
    run_inputs = artifact_registry.get_run_input_lineage(run.run_id)
    FOR artifact in run_inputs:
      IF artifact.producer_run_id and artifact.producer_run_id != run.run_id:
        producer_run = find_run(active_runs, artifact.producer_run_id)
        IF producer_run:
          dependencies.append(WorkflowDependency(
            dependency_id = generate_uuid(),
            upstream_run_id = artifact.producer_run_id,
            downstream_run_id = run.run_id,
            dependency_type = "ARTIFACT_DEPENDENCY",
            cascade_risk = "HIGH",
            upstream_healthy = producer_run.status not in ["FAILED", "STALLED"],
            satisfied = artifact.status == "PUBLISHED",
            blocking = artifact.status != "PUBLISHED" and run.waiting_on_artifact(artifact.artifact_id),
            delay_propagation_multiplier = 1.2   # Downstream typically runs 20% longer after upstream delay
          ))
  
  # --- Agent conflict detection ---
  worker_assignments = load_worker_assignments()  # run_id → [worker_id]
  pool_assignments = {}  # pool_id → [run_id]
  
  FOR run_id, workers in worker_assignments.items():
    FOR worker in workers:
      pool_id = get_worker_pool(worker)
      pool_assignments.setdefault(pool_id, []).append(run_id)
  
  FOR pool_id, competing_runs in pool_assignments.items():
    pool = load_pool(pool_id)
    IF len(competing_runs) > pool.total_workers × 0.80:   # > 80% of pool capacity taken
      FOR i, run_a in enumerate(competing_runs):
        FOR run_b in competing_runs[i+1:]:
          dependencies.append(WorkflowDependency(
            dependency_id = generate_uuid(),
            upstream_run_id = run_a,
            downstream_run_id = run_b,
            dependency_type = "AGENT_CONFLICT",
            cascade_risk = "MEDIUM",
            upstream_healthy = True,
            satisfied = False,
            blocking = True,
            delay_propagation_multiplier = 1.0
          ))
  
  # --- Approval pool conflicts ---
  pending_approvals = load_pending_approvals()
  by_approver = {}
  FOR approval in pending_approvals:
    by_approver.setdefault(approval.required_approver, []).append(approval.subject.run_id)
  
  FOR approver, run_ids in by_approver.items():
    IF len(run_ids) > 1:
      FOR i, run_a in enumerate(run_ids):
        FOR run_b in run_ids[i+1:]:
          dependencies.append(WorkflowDependency(
            dependency_id = generate_uuid(),
            upstream_run_id = run_a,
            downstream_run_id = run_b,
            dependency_type = "APPROVAL_POOL",
            cascade_risk = "MEDIUM",
            upstream_healthy = True,
            satisfied = False,
            blocking = True,
            delay_propagation_multiplier = 0.8
          ))
  
  # --- Build workflow nodes with dependency counts ---
  dep_upstream = count_by_field(dependencies, "downstream_run_id")
  dep_downstream = count_by_field(dependencies, "upstream_run_id")
  
  workflow_nodes = []
  FOR run in active_runs:
    slo_status = compute_run_slo_status(run.run_id)
    workflow_nodes.append(WorkflowNode(
      run_id = run.run_id,
      definition_id = run.definition_id,
      status = run.status,
      priority = run.priority,
      started_at = run.started_at,
      slo_on_track = slo_status.currently_on_track,
      upstream_count = dep_upstream.get(run.run_id, 0),
      downstream_count = dep_downstream.get(run.run_id, 0)
    ))
  
  # --- Compute critical chains ---
  critical_chains = extract_critical_chains(dependencies, workflow_nodes)
  
  # --- Impact analysis ---
  impact_scores = {node.run_id: node.downstream_count for node in workflow_nodes}
  highest_impact = MAX(impact_scores, key=impact_scores.get) if impact_scores else null
  
  dep_map = WorkflowDependencyMap(
    map_id = generate_uuid(),
    generated_at = now(),
    workflow_nodes = workflow_nodes,
    dependencies = dependencies,
    critical_chains = critical_chains,
    conflict_clusters = extract_conflict_clusters(dependencies),
    highest_impact_workflow = highest_impact,
    longest_dependency_chain = max(c.chain_depth for c in critical_chains) if critical_chains else 0
  )
  
  persist_dependency_map(dep_map)
  RETURN dep_map

assess_failure_blast_radius(run_id) → BlastRadiusAssessment:
  
  dep_map = load_current_dependency_map()
  
  # BFS from failed run_id following downstream edges
  affected = {run_id}
  frontier = {run_id}
  depth = 0
  
  WHILE frontier:
    next_frontier = set()
    FOR dep in dep_map.dependencies:
      IF dep.upstream_run_id in frontier AND dep.downstream_run_id not in affected:
        IF dep.cascade_risk != "LOW":
          next_frontier.add(dep.downstream_run_id)
          affected.add(dep.downstream_run_id)
    frontier = next_frontier
    depth += 1
    IF depth > 10: BREAK    # Guard against cycles
  
  RETURN BlastRadiusAssessment(
    root_run_id = run_id,
    directly_affected = len(affected) - 1,
    total_affected_runs = len(affected),
    affected_run_ids = list(affected - {run_id}),
    propagation_depth = depth,
    severity = "CRITICAL" if len(affected) > 10 else "HIGH" if len(affected) > 4 else "MEDIUM"
  )
```

---

## Integration

**Called by:**
- `orchestration-observability/dependency-impact-analyzer.md` — blast radius inputs
- `operational-command-center/workflow-command-center.md` — shows dependencies of a specific run
- `runtime-topology/runtime-topology-maps.md` — dependency edges for topology graph

**Calls:**
- `orchestration-dags/dag-runtime.md` — active run enumeration
- `execution-persistence/artifact-registry.md` — artifact lineage
- `governance-attestation/cryptographic-approval-engine.md` — pending approval queue

**Writes to:** `memory/runtime-topology/dependency-state.yaml`
