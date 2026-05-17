# Execution Lineage Tracker

## Purpose
Maintains a complete provenance graph of every workflow execution — what artifacts were created, what decisions were made, what agent performed what action, and how data flowed between workflow steps. Lineage enables root cause analysis, impact assessment, and compliance tracing.

---

## Lineage Model

Execution lineage is a directed acyclic graph (DAG) of provenance nodes:

```
[Input Artifact A] ──→ [Node: validate-rfc] ──→ [Validation Report B]
                                ↓
                       [Node: route-reviewers] ──→ [Routing Decision C]
                                ↓
              ┌────────────────────────────────┐
              ↓                                ↓
[Node: peer-review]                  [Node: arch-review]
     ↓                                        ↓
[Review R1]                          [Review R2]
              ↓                                ↓
              └────────────────────────────────┘
                                ↓
                     [Node: compute-quorum] ──→ [Quorum Decision D]
                                ↓
                     [Node: publish-outcome] ──→ [Outcome Artifact E]
```

---

## Lineage Node Types

```yaml
node_types:
  WORKFLOW_START:
    description: Entry point of a workflow instance
    attributes: [process_id, dag_id, initiated_by, started_at]
  
  TASK_EXECUTION:
    description: A single node execution within the DAG
    attributes: [node_id, node_type, executor_id, started_at, completed_at, duration_ms]
  
  HUMAN_ACTION:
    description: A human participant's action (approval, review, input)
    attributes: [actor_id, actor_tier, action_type, decision, rationale, decided_at]
  
  ARTIFACT_CREATION:
    description: A new artifact produced by a task
    attributes: [artifact_id, artifact_type, content_hash, creator_task_id]
  
  ARTIFACT_CONSUMPTION:
    description: An artifact used as input to a task
    attributes: [artifact_id, artifact_version, consumer_task_id]
  
  DECISION:
    description: A runtime decision (decision model evaluation or governance branch)
    attributes: [model_id, inputs_hash, outputs, evaluation_id]
  
  EXTERNAL_CALL:
    description: Call to an external system or integration
    attributes: [integration_id, endpoint, request_hash, response_hash, latency_ms]
  
  SUBPROCESS_INVOCATION:
    description: Invocation of a child workflow (Call Activity)
    attributes: [child_process_id, child_instance_id]
  
  WORKFLOW_END:
    description: Terminal state of a workflow instance
    attributes: [terminal_status, outputs_hash, duration_ms, sla_met]
```

---

## Lineage Edge Types

```yaml
edge_types:
  PRODUCED:         # node produced artifact
  CONSUMED:         # node consumed artifact
  TRIGGERED:        # node triggered another node (sequence flow)
  DECIDED:          # decision produced this outcome
  DELEGATED_TO:     # human action delegated from one agent to another
  SPAWNED:          # parent workflow spawned child subprocess
  DERIVED_FROM:     # artifact derived from (transformation of) another artifact
```

---

## Lineage Record Schema

```yaml
lineage_record:
  record_id: "LIN-uuid"
  workflow_instance_id: string
  process_id: string
  
  # Graph structure
  nodes:
    - node_id: "LIN-NODE-uuid"
      node_type: [from node_types]
      label: string
      timestamp: ISO-8601
      attributes: {}
      
  edges:
    - edge_id: "LIN-EDGE-uuid"
      from_node: "LIN-NODE-uuid"
      to_node: "LIN-NODE-uuid"
      edge_type: [from edge_types]
      metadata: {}
  
  # Derived indexes
  artifact_index:
    "{artifact_id}":
      created_by: "LIN-NODE-uuid"
      consumed_by: ["LIN-NODE-uuid"]
      derived_artifacts: ["artifact_id"]
  
  actor_index:
    "{agent_id}":
      tasks_executed: ["LIN-NODE-uuid"]
      decisions_made: ["LIN-NODE-uuid"]
      artifacts_created: ["artifact_id"]
  
  # Integrity
  lineage_hash: "sha256 of canonical graph representation"
  created_at: ISO-8601
  last_extended_at: ISO-8601   # lineage grows as workflow progresses
```

---

## Provenance Queries

### Query 1: Artifact Provenance
"Where did this artifact come from?"

```
trace_artifact_provenance(artifact_id, max_depth=20):
  origin_node = artifact_index[artifact_id].created_by
  
  provenance_chain = []
  queue = [origin_node]
  visited = {}
  
  while queue:
    node = queue.pop()
    if node in visited: continue
    visited[node] = true
    
    provenance_chain.append({
      node: node,
      created_at: node.timestamp,
      actor: node.attributes.executor_id,
      inputs: get_consumed_artifacts(node)
    })
    
    # Follow input artifacts backward
    for input_artifact in get_consumed_artifacts(node):
      parent_node = artifact_index[input_artifact].created_by
      if parent_node and depth < max_depth:
        queue.append(parent_node)
  
  return provenance_chain
```

### Query 2: Impact Analysis
"If I change this artifact, what is affected?"

```
compute_impact(artifact_id):
  impact = {direct: [], transitive: []}
  
  direct_consumers = artifact_index[artifact_id].consumed_by
  impact.direct = [get_workflow_instance(n) for n in direct_consumers]
  
  # Transitive: artifacts derived from this artifact
  derived = artifact_index[artifact_id].derived_artifacts
  for derived_artifact in derived:
    downstream = compute_impact(derived_artifact)
    impact.transitive.extend(downstream.direct + downstream.transitive)
  
  return impact
```

### Query 3: Actor Lineage
"What did this agent do and what did they produce?"

```
query_actor_lineage(agent_id, from_date, to_date):
  return {
    tasks_executed: actor_index[agent_id].tasks_executed filtered by date,
    decisions_made: actor_index[agent_id].decisions_made filtered by date,
    artifacts_created: actor_index[agent_id].artifacts_created,
    workflows_participated_in: derive_from_tasks(tasks_executed)
  }
```

### Query 4: Compliance Chain
"Prove that this output followed correct governance"

```
build_compliance_chain(workflow_instance_id):
  lineage = load_lineage(workflow_instance_id)
  audit_trail = workflow-auditability-system.load(workflow_instance_id)
  
  compliance_chain = {
    instance: workflow_instance_id,
    process: lineage.process_id,
    governance_checkpoints: [],
    approval_chain: [],
    constitutional_checks: []
  }
  
  for node in lineage.nodes where node.type == HUMAN_ACTION:
    approval_audit = audit_trail.find(node_id=node.id, type=APPROVAL_GRANTED)
    compliance_chain.approval_chain.append({
      node: node,
      approval: approval_audit,
      tier_met: approval_audit.actor.tier >= node.attributes.tier_required
    })
  
  for node in lineage.nodes where node.type == DECISION and node.attributes.model_id starts with DM-GOV:
    constitutional_audit = audit_trail.find(node_id=node.id)
    compliance_chain.constitutional_checks.append(constitutional_audit)
  
  return compliance_chain
```

---

## Cross-Instance Lineage

Tracks lineage across subprocess boundaries:

```yaml
cross_instance_linkage:
  parent_instance_id: string
  child_instance_id: string
  spawn_node_id: string     # Call Activity node in parent
  spawn_at: ISO-8601
  child_completed_at: ISO-8601 | null
  
  # Inputs passed from parent to child
  input_artifact_ids: [artifact_id]
  
  # Outputs returned from child to parent
  output_artifact_ids: [artifact_id]
```

---

## Lineage Storage

```yaml
storage:
  primary: lineage graph database (adjacency list)
  indexes:
    - artifact_id → [node_ids]
    - agent_id → [node_ids]
    - workflow_instance_id → full lineage record
    - process_id → [instance_ids]
  
  query_targets:
    simple_lookups: < 50ms
    provenance_trace (depth ≤ 5): < 200ms
    full_impact_analysis: < 2 seconds
    compliance_chain: < 5 seconds
  
  retention: same as workflow audit records by classification
```
