# Dependency Graph

## Purpose
Maintains the complete dependency topology of the enterprise OS — which tasks depend on which tasks, which agents depend on which capabilities, which workflows depend on which resources, and which systems depend on which integrations. The dependency graph is the substrate for critical path analysis, failure impact prediction, scheduling optimization, and blast radius assessment. When anything changes — a task fails, a resource becomes scarce, an agent goes offline — the dependency graph enables the system to instantly compute what is affected, who needs to know, and what can continue.

---

## Dependency Graph Architecture

```
Dependency Sources:
  Workflow definitions (task dependencies)
  Resource allocation requests
  Agent capability requirements
  System integration manifests
  Policy constraint declarations
        ↓
[Dependency Ingestion]     → parse and normalize dependency declarations
        ↓
[Dependency Graph]         → live dependency topology (nodes + DEPENDS_ON / PRECEDES edges)
        ↓
[Derived Computations]
  ├── Critical Path Analysis
  ├── Blast Radius Computation
  ├── Cycle Detection
  └── Bottleneck Identification
        ↓
[Dependency Index]         → fast lookup for scheduling, impact analysis, routing
```

---

## Dependency Node Types

```yaml
dependency_nodes:
  TASK_DEP_NODE:
    represents: individual task in a workflow
    key_fields: [task_id, task_type, status, estimated_duration_minutes, actual_duration_minutes, priority, blast_radius]
    dependency_semantics: cannot start until all DEPENDS_ON and PRECEDES predecessors are COMPLETED

  WORKFLOW_DEP_NODE:
    represents: entire workflow as a dependency unit
    key_fields: [workflow_id, status, completion_percentage, critical_path_tasks]
    dependency_semantics: external systems may depend on workflow completion

  CAPABILITY_DEP_NODE:
    represents: an agent capability that tasks require
    key_fields: [capability_id, capability_type, available_agent_count, saturation_level]
    dependency_semantics: tasks requiring this capability are blocked if no agent with it is available

  RESOURCE_DEP_NODE:
    represents: a resource pool that tasks compete for
    key_fields: [resource_id, resource_type, total_capacity, available_capacity, reservation_count]
    dependency_semantics: tasks requiring this resource are blocked if capacity is unavailable

  SERVICE_DEP_NODE:
    represents: an external service or integration endpoint
    key_fields: [service_id, service_type, availability, latency_p99, error_rate]
    dependency_semantics: tasks calling this service are blocked if service is unavailable

  POLICY_DEP_NODE:
    represents: a policy or approval requirement that must be satisfied
    key_fields: [policy_id, approval_required, approver_availability, avg_approval_time_hours]
    dependency_semantics: tasks subject to this policy may be blocked pending approval
```

---

## Dependency Edge Types

```yaml
dependency_edges:
  HARD_DEPENDS_ON:
    semantics: strict prerequisite — A cannot start until B is COMPLETED (not just started)
    source: TASK | WORKFLOW
    target: TASK | WORKFLOW | CAPABILITY | RESOURCE
    properties: [dependency_type: DATA | RESOURCE | SEQUENCE | APPROVAL]
    criticality: HARD (violation = blocked task)
    on_failure: A is BLOCKED; cannot proceed

  SOFT_DEPENDS_ON:
    semantics: preferred ordering — A should start after B, but can start if B is RUNNING
    source: TASK
    target: TASK
    properties: [soft_dependency_reason]
    criticality: SOFT (violation = suboptimal but not blocked)
    on_failure: A proceeds with warning; may receive incomplete input

  PRECEDES:
    semantics: strict ordering constraint — A must COMPLETE before B can START
    source: TASK | EVENT
    target: TASK | EVENT
    properties: [ordering_type: SEQUENTIAL | GATED | TRIGGERED]
    criticality: HARD
    note: PRECEDES is directed ordering; HARD_DEPENDS_ON implies resource/data flow

  REQUIRES_CAPABILITY:
    semantics: task requires an agent with a specific capability to execute
    source: TASK
    target: CAPABILITY_DEP_NODE
    properties: [min_proficiency, preferred_tier]
    criticality: HARD

  CONSUMES_RESOURCE:
    semantics: task will allocate and consume a defined quantity of this resource
    source: TASK | WORKFLOW
    target: RESOURCE_DEP_NODE
    properties: [amount, duration_estimate_minutes, priority_class]
    criticality: HARD (task blocked if resource unavailable)

  CALLS_SERVICE:
    semantics: task depends on an external service being available
    source: TASK | WORKFLOW
    target: SERVICE_DEP_NODE
    properties: [call_type, timeout_seconds, retry_policy]
    criticality: SOFT (can be retried) or HARD (if no retry possible)

  GATED_BY_POLICY:
    semantics: task requires policy approval before execution
    source: TASK | WORKFLOW
    target: POLICY_DEP_NODE
    properties: [approval_type, required_tier, estimated_approval_hours]
    criticality: HARD (task blocked at AWAITING_APPROVAL until approval)

  PRODUCES_INPUT_FOR:
    semantics: A produces an artifact that B requires as input (data dependency)
    source: TASK | WORKFLOW
    target: TASK | WORKFLOW
    properties: [artifact_type, transfer_protocol]
    criticality: HARD (implied by HARD_DEPENDS_ON + data flow direction)
```

---

## Critical Path Analysis

```yaml
critical_path_analysis:
  definition: |
    The critical path is the longest sequence of dependent tasks through a workflow — 
    it determines the minimum possible completion time. Any delay on the critical path 
    delays the entire workflow. Tasks NOT on the critical path have float — slack time
    before they would delay the workflow.

  algorithm: CRITICAL_PATH_METHOD (CPM)
    step_1_forward_pass:
      traverse DAG in topological order (from start to end)
      for each node: earliest_start = max(predecessor_earliest_finish times)
      for each node: earliest_finish = earliest_start + estimated_duration

    step_2_backward_pass:
      traverse DAG in reverse topological order (end to start)
      for each node: latest_finish = min(successor_latest_start times)
      for each node: latest_start = latest_finish - estimated_duration

    step_3_float_computation:
      float = latest_start - earliest_start
      critical_path_tasks: tasks where float = 0 (no slack)

    step_4_critical_path_identification:
      critical_path: ordered sequence of critical_path_tasks from start to end
      critical_path_duration: sum of estimated_duration for tasks on critical path

  cpm_output:
    workflow_id: string
    critical_path: [task_id]
    critical_path_duration_minutes: float
    estimated_completion: ISO-8601
    critical_path_buffer: float        # total float available across non-critical tasks
    risk_tasks: [task_id]              # tasks with float < 15% of critical path duration

  dynamic_critical_path:
    update_trigger: any task duration update, task failure, or new dependency
    recompute_latency: p99 < 50ms for workflows < 100 tasks
    critical_path_shift: if a task on critical path finishes early or late, recompute
```

---

## Blast Radius Computation

```yaml
blast_radius:
  definition: |
    Given a failure or change at a specific node, the blast radius is the set of
    downstream nodes that are blocked, degraded, or affected — and the severity
    of impact on each.

  computation:
    algorithm: REVERSE_BFS from the failing node
    traverse: INBOUND edges of HARD_DEPENDS_ON, PRECEDES, REQUIRES_CAPABILITY, CALLS_SERVICE
    for each reachable node:
      direct_impact: node directly depends on the failing node
      transitive_impact: node depends on a node that depends on the failing node
      impact_attenuation: soft_depends reduce impact severity at each hop

  blast_radius_record:
    origin_node_id: node_id
    origin_event: FAILURE | DEGRADATION | REMOVAL | POLICY_BLOCK
    
    directly_affected: [{
      node_id, node_type, impact_type: BLOCKED | DEGRADED | DELAYED, severity: CRITICAL | HIGH | MEDIUM | LOW
    }]
    
    transitively_affected: [{
      node_id, node_type, hop_distance, impact_type, severity
    }]
    
    aggregate_impact:
      total_tasks_blocked: int
      critical_tasks_blocked: int
      workflows_at_risk: int
      estimated_delay_minutes: float
      governance_tasks_affected: int    # flag if GOVERNANCE domain tasks in blast radius

  blast_radius_triggers:
    AGENT_OFFLINE: compute blast radius for all tasks assigned to that agent
    RESOURCE_SATURATED: compute blast radius for resource node
    SERVICE_UNAVAILABLE: compute blast radius for service dependency node
    POLICY_ACTIVATED: compute blast radius for any tasks gated_by_policy that policy
    TASK_FAILED: compute blast radius for downstream tasks
```

---

## Cycle Detection

```yaml
cycle_detection:
  purpose: detect circular dependencies that would cause deadlock
  algorithm: DFS-based cycle detection (Kahn's algorithm for topological sort)
  trigger: every time a new HARD_DEPENDS_ON or PRECEDES edge is added
  latency: p99 < 10ms for workflows < 500 tasks

  cycle_types:
    DIRECT_CYCLE: A → B → A (two-node cycle)
    INDIRECT_CYCLE: A → B → C → A (multi-hop cycle)
    NEAR_CYCLE: A → B → C (no cycle but any future edge from C to A would create one)

  response:
    DIRECT_CYCLE: REJECT edge; error to requesting system; log finding
    INDIRECT_CYCLE: REJECT edge; error; generate DEPENDENCY_CYCLE finding
    never_write_cycle: a cycle in dependency graph = guaranteed deadlock; reject without exception
```

---

## Dependency Queries

```gql
# Critical path for a workflow
MATCH (w:WORKFLOW_DEP_NODE {workflow_id: "wf-099"})-[:WORKFLOW_CONTAINS]->(t:TASK_DEP_NODE)
WHERE t.is_on_critical_path = true
RETURN t ORDER BY t.earliest_start ASC

# Blast radius of agent going offline
MATCH (a:AGENT_DEP_NODE {agent_id: "agt-001"})<-[:HARD_DEPENDS_ON|REQUIRES_CAPABILITY*1..6]-(t:TASK_DEP_NODE)
RETURN t, length(shortest_path(t, a)) AS hop_distance, t.priority
ORDER BY t.priority DESC, hop_distance ASC

# Find all tasks with no slack (critical) in active workflows
MATCH (t:TASK_DEP_NODE {status: "QUEUED", float: 0})
RETURN t ORDER BY t.deadline ASC

# Bottleneck analysis — most-depended-on nodes
MATCH (n)-[:HARD_DEPENDS_ON]->(dep)
RETURN dep, count(n) AS dependent_count ORDER BY dependent_count DESC LIMIT 10

# Resource contention — tasks competing for a saturated resource
MATCH (t:TASK_DEP_NODE)-[:CONSUMES_RESOURCE]->(r:RESOURCE_DEP_NODE {is_saturated: true})
WHERE t.status = "QUEUED"
RETURN t, r ORDER BY t.priority DESC
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Dependency graph stored in knowledge graph |
| `orchestration-dags/dag-execution-engine.md` | DAG engine reads dependency graph for scheduling |
| `orchestration-dags/dependency-aware-executor.md` | Executor enforces dependency ordering |
| `enterprise-topology/runtime-topology-tracker.md` | Live dependency state updated by topology tracker |
| `graph-reasoning/dependency-reasoning.md` | Reasoning over dependency chains |
| `graph-reasoning/impact-propagation-engine.md` | Blast radius uses dependency graph |
| `temporal-knowledge-graphs/runtime-state-graph.md` | Task states flow into dependency node states |
