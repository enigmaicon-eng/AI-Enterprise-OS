# Workflow Topology Graph

## Purpose
Represents every active and historical workflow as a first-class graph structure — a directed acyclic graph of tasks, decision points, parallel branches, merge points, approval gates, and loop constructs. The workflow topology graph gives the orchestration system a structural understanding of every in-flight workflow: where it is in its execution, which branches are active, what the critical path looks like, and how the current state relates to the planned topology. This structural awareness enables dynamic replanning, failure recovery, and intelligent routing decisions that a flat task list cannot support.

---

## Workflow Graph Structures

```
Workflow Graph Primitives:

  SEQUENTIAL:          A ──▶ B ──▶ C
  
  PARALLEL_FORK:            ┌──▶ B ──▶┐
                       A ──▶│         │──▶ D
                            └──▶ C ──▶┘
  
  CONDITIONAL_BRANCH:       ┌──[condition=true]──▶ B ──▶┐
                       A ──▶│                           │──▶ D
                            └──[condition=false]──▶ C ──▶┘
  
  APPROVAL_GATE:       A ──▶ [APPROVAL REQUIRED] ──▶ B
                                    │
                            [REJECTED] ──▶ FAIL
  
  LOOP:                ┌──────────────────┐
                       ▼                  │
                  A ──▶ B ──[condition]───┘ ──▶ C
  
  SUB_WORKFLOW:        A ──▶ [SUB_WORKFLOW: W-002] ──▶ B
  
  MILESTONE:           ... ──▶ [MILESTONE: validation] ──▶ ...
```

---

## Workflow Graph Node Types

```yaml
workflow_graph_nodes:
  TASK_NODE:
    description: individual unit of work
    fields: [task_id, task_type, task_name, status, assigned_agent_id, estimated_duration_minutes, actual_duration_minutes, retry_count, max_retries]
    entry_conditions: [ALL_PREDECESSORS_COMPLETE | ANY_PREDECESSOR_COMPLETE | EXPLICIT_TRIGGER]
    exit_conditions: [SUCCESS_OUTPUT | FAILURE_OUTPUT | TIMEOUT]

  DECISION_NODE:
    description: conditional branch point based on evaluated condition
    fields: [decision_id, condition_expression, evaluation_result: TRUE | FALSE | UNKNOWN, evaluated_at]
    entry_conditions: [ALL_PREDECESSORS_COMPLETE]
    exit_edges: [TRUE_BRANCH_EDGE, FALSE_BRANCH_EDGE, UNKNOWN_HANDLER_EDGE]

  FORK_NODE:
    description: splits execution into parallel branches
    fields: [fork_id, parallel_branches: int, branch_ids]
    entry_conditions: [PREDECESSOR_COMPLETE]
    exit_edges: [N branch edges, one per parallel path]

  JOIN_NODE:
    description: waits for parallel branches to merge
    fields: [join_id, join_type: ALL_OF | ANY_OF | MAJORITY_OF, branches_expected: int, branches_completed: int]
    entry_conditions: per join_type
    exit_edges: [single continuation edge]

  APPROVAL_GATE_NODE:
    description: pauses workflow pending approval
    fields: [gate_id, approval_type, required_tier, quorum_required, approval_sla_hours, status: PENDING | APPROVED | REJECTED | EXPIRED, approval_request_id]
    entry_conditions: [PREDECESSOR_COMPLETE]
    exit_edges: [APPROVED_EDGE → continue, REJECTED_EDGE → handle]

  MILESTONE_NODE:
    description: named checkpoint in workflow; may trigger notifications or checkpoints
    fields: [milestone_id, milestone_name, reached_at: ISO-8601 | null, governance_checkpoint: boolean]
    entry_conditions: [ALL_PREDECESSORS_COMPLETE]
    exit_edges: [single continuation edge]

  SUB_WORKFLOW_NODE:
    description: embeds another workflow as a single logical node
    fields: [sub_workflow_id, child_workflow_id, completion_policy: WAIT | FIRE_AND_FORGET]
    entry_conditions: [PREDECESSOR_COMPLETE]
    exit_edges: [CHILD_COMPLETED_EDGE | CHILD_FAILED_EDGE]

  START_NODE:
    description: workflow entry point
    fields: [trigger_event, trigger_conditions, initiated_by: agent_id | human_id, initiated_at]
    exit_edges: [first task(s) in workflow]

  END_NODE:
    description: workflow terminal point (success or failure)
    fields: [end_type: SUCCESS | FAILURE | CANCELLED | ROLLED_BACK, completion_evidence: [artifact_id]]
    entry_conditions: [final task(s) complete]
```

---

## Workflow Topology Record

```yaml
workflow_topology_record:
  topology_id: "WTOPO-{workflow_id}"
  workflow_id: string
  workflow_type: string
  version: semver                        # topology version (changes on dynamic replanning)
  
  graph:
    nodes: [workflow_graph_node]         # all nodes in this workflow's DAG
    edges: [workflow_topology_edge]      # all directed edges connecting nodes
    
  structural_analysis:
    is_acyclic: boolean                  # must be true; cycles rejected
    critical_path: [node_id]
    critical_path_duration_minutes: float
    parallel_branches: int               # max concurrent branches
    max_depth: int                       # longest path from START to END
    bottleneck_nodes: [node_id]         # nodes with highest in-degree
    approval_gates_count: int
    sub_workflows_count: int
  
  execution_state:
    current_position: [node_id]         # all nodes currently active/executing
    completed_nodes: [node_id]
    failed_nodes: [node_id]
    blocked_nodes: [node_id]
    completion_percentage: float
    critical_path_completion: float     # % of critical path tasks completed
    estimated_remaining_minutes: float
    sla_deadline: ISO-8601 | null
    sla_status: ON_TRACK | AT_RISK | BREACHED
  
  replanning_history: [{
    replanning_id: string
    replanning_reason: FAILURE_RECOVERY | RESOURCE_CHANGE | SCOPE_CHANGE | DYNAMIC_OPTIMIZATION
    changed_nodes: [node_id]
    added_nodes: [node_id]
    removed_nodes: [node_id]
    replanned_at: ISO-8601
    replanned_by: agent_id
  }]

workflow_topology_edge:
  edge_id: string
  source_node_id: node_id
  target_node_id: node_id
  edge_type: SEQUENTIAL | BRANCH_TRUE | BRANCH_FALSE | FORK | JOIN | APPROVAL_PASS | APPROVAL_FAIL | RETRY | FAILURE_HANDLER
  condition_expression: string | null    # for conditional edges
  is_on_critical_path: boolean
```

---

## Dynamic Topology Operations

```yaml
dynamic_topology:
  purpose: allow workflow topology to be modified during execution in response to failures, discoveries, or optimization

  allowed_operations:
    INSERT_TASK:
      when: new task needed due to discovered requirement
      constraint: inserted task must not create a cycle; must be compatible with current execution state
      authority: Tier-3+ orchestrator; approval required if CRITICAL workflow

    REMOVE_TASK:
      when: task no longer needed (condition no longer applicable)
      constraint: only if task status = QUEUED (not yet started); no downstream tasks depend on it
      authority: Tier-2+ orchestrator

    REROUTE_BRANCH:
      when: condition evaluation changes the expected branch
      constraint: only if not already past the decision node
      authority: automated (system-initiated on condition change)

    SUBSTITUTE_AGENT:
      when: assigned agent goes offline or is unavailable
      constraint: substitute must have required capability; substitution logged in topology
      authority: automated for MEDIUM/LOW priority; Tier-2+ for CRITICAL/HIGH

    ADD_APPROVAL_GATE:
      when: risk profile changes during execution (e.g., blast radius reassessed higher)
      constraint: adds APPROVAL_GATE_NODE before next unstarted TASK_NODE on critical path
      authority: policy-feasibility-checker (automatic) or Tier-3+ explicit

    EXTEND_DEADLINE:
      when: SLA breach imminent; request for extension
      constraint: documented reason required; Tier-3+ for CRITICAL workflows
      authority: Tier-2+ for HIGH; Tier-3+ for CRITICAL

  replanning_protocol:
    step_1: compute proposed new topology
    step_2: verify new topology is acyclic
    step_3: compute critical path + SLA impact of change
    step_4: check policy feasibility (do any new tasks require approval?)
    step_5: write new topology version; preserve old version in history
    step_6: emit WORKFLOW_REPLANNED event
```

---

## Topology Analysis Queries

```gql
# Find workflows where critical path is blocked
MATCH (w:WORKFLOW_DEP_NODE {status: "RUNNING"})-[:WORKFLOW_CONTAINS]->(t:TASK_NODE)
WHERE t.is_on_critical_path = true AND t.status = "BLOCKED"
RETURN w, t, t.blocking_reason ORDER BY w.sla_deadline ASC

# Identify approval gates with SLA risk
MATCH (a:APPROVAL_GATE_NODE {status: "PENDING"})
WHERE a.sla_status IN ["AT_RISK", "BREACHED"]
RETURN a ORDER BY a.deadline ASC

# Workflow topology comparison — planned vs actual
MATCH (w:WORKFLOW_DEP_NODE {workflow_id: "wf-099"})-[:WORKFLOW_CONTAINS]->(t:TASK_NODE)
RETURN t.task_id, t.estimated_duration_minutes, t.actual_duration_minutes,
       (t.actual_duration_minutes - t.estimated_duration_minutes) AS variance
ORDER BY variance DESC

# Find parallel workflows competing for same resource
MATCH (t1:TASK_NODE)-[:CONSUMES_RESOURCE]->(r:RESOURCE_DEP_NODE)
MATCH (t2:TASK_NODE)-[:CONSUMES_RESOURCE]->(r)
MATCH (w1:WORKFLOW_DEP_NODE)-[:WORKFLOW_CONTAINS]->(t1)
MATCH (w2:WORKFLOW_DEP_NODE)-[:WORKFLOW_CONTAINS]->(t2)
WHERE w1.workflow_id <> w2.workflow_id AND t1.status = "QUEUED" AND t2.status = "QUEUED"
RETURN w1, w2, r, t1, t2
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-dags/dag-execution-engine.md` | DAG engine reads and writes workflow topology |
| `enterprise-topology/dependency-graph.md` | Task dependencies embedded in workflow topology |
| `enterprise-topology/runtime-topology-tracker.md` | Execution state updates from runtime tracker |
| `temporal-knowledge-graphs/runtime-state-graph.md` | WORKFLOW_STATE and TASK_STATE sourced from runtime graph |
| `orchestration-constraints/policy-feasibility-checker.md` | Topology changes re-checked for feasibility |
| `graph-observability/orchestration-graph-telemetry.md` | Topology events feed telemetry |
| `graph-reasoning/dependency-reasoning.md` | Dependency reasoning uses workflow topology |
