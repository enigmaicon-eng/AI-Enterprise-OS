# Rollback DAG Engine
**ID:** RBK-DAG-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Constructs and executes directed acyclic graphs of compensation operations for multi-step agent workflows. When a saga or sandbox execution must be reversed, the rollback DAG engine builds the dependency-aware compensation graph, validates the graph for completeness, and executes compensations in the correct topological order to restore system state without introducing new inconsistencies. The DAG structure ensures that a compensation never executes before its dependencies have been reversed.

---

## Rollback DAG Model

```
Forward Execution DAG:

  T1 ──► T2 ──► T4 ──► T6
              │
         T3 ──► T5

Where Ti reads the output of its parent → must compensate children before parents.

Rollback DAG (reverse edges, swap operations):

  C6 ──► C4 ──► C2 ──► C1
               │
          C5 ──► C3

Execution order: C6 first (no dependencies), then C4 and C5 in parallel (both depend only on C6), then C2 and C3, then C1.
```

---

## DAG Construction

```
build_rollback_dag(saga_id | sandbox_id) → rollback_dag:

  1. Load execution graph:
     nodes = all completed forward actions from execution-journal
     edges = data dependency relationships (T_j reads output of T_i → T_j depends on T_i)
     
  2. Validate graph is acyclic:
     if cycle detected: CRITICAL error; manual resolution required; T4 immediate
     
  3. Reverse edges:
     for each edge (T_i → T_j): add reversed edge (C_j → C_i)
     node T_i becomes compensation node C_i
     
  4. Load compensation operations:
     for each node C_i:
       fetch compensation_id from undo-registry (linked to T_i)
       if compensation not found: ROLLBACK_INCOMPLETE_COVERAGE → escalate T3
       if compensation EXPIRED: mark C_i as UNCOMPENSATABLE → escalate T4
       
  5. Compute execution levels (topological layers for parallel execution):
     Level 0 (no outgoing edges in rollback DAG): execute first, can parallelize
     Level 1 (depends only on Level 0): execute after Level 0 completes
     ...
     
  6. Return: rollback_dag {nodes, edges, levels, completeness_score}
```

---

## DAG Schema

```yaml
rollback_dag:
  dag_id: RDAG-{NNN}
  saga_id: SAGA-{NNN} | null
  sandbox_id: SBOX-{NNN}
  trigger_reason: STEP_FAILURE | VALIDATION_FAIL | HUMAN_ABORT | TTL_EXPIRY | GOVERNANCE_BLOCK
  
  nodes:
    - node_id: RDAG-NODE-{N}
      compensation_id: COMP-{NNN}
      forward_action_id: ACT-{NNN}
      forward_operation_descriptor: string
      compensation_operation_type: string
      target_resource: string
      reversibility_class: string
      status: PENDING | EXECUTING | COMPLETED | FAILED | SKIPPED | UNCOMPENSATABLE
      execution_level: number              # topological layer
      
  edges:
    - from: RDAG-NODE-{N}               # compensation_j must execute before compensation_i
      to: RDAG-NODE-{M}
      reason: string                     # why this ordering is required
      
  execution_levels: [[RDAG-NODE-N, ...], ...]  # grouped by parallel execution layer
  
  completeness:
    total_forward_actions: number
    compensations_registered: number
    compensation_coverage_pct: float
    uncompensatable_nodes: [RDAG-NODE-{N}]
    
  status: CONSTRUCTED | EXECUTING | COMPLETED | PARTIAL | FAILED
  constructed_at: ISO8601
  execution_started_at: ISO8601 | null
  execution_completed_at: ISO8601 | null
```

---

## DAG Execution

```
execute_rollback_dag(dag_id, authorized_by) → rollback_result:

  dag = load_dag(dag_id)
  mark dag.status = EXECUTING
  
  for each level in dag.execution_levels:  # level 0 first (no dependencies)
  
    parallel_compensations = [node for node in level if node.status == PENDING]
    
    execute_parallel(parallel_compensations, timeout=60s_per_node):
      for each node in parallel:
        try:
          precondition_result = validate_compensation_preconditions(node.compensation_id)
          if precondition_result != PASS:
            mark node.status = FAILED
            log PRECONDITION_FAILED
            escalate per reversibility_class
            
          else:
            result = execute_undo(node.compensation_id, authorized_by)
            if result == SUCCESS:
              mark node.status = COMPLETED
            elif result == PARTIAL:
              mark node.status = FAILED
              escalate T3
            else:
              mark node.status = FAILED
              escalate_compensation_failure(node, result)
              
        except timeout:
          mark node.status = FAILED
          log COMPENSATION_TIMEOUT
          escalate T3
          
    # After each level: check if next level can proceed
    failed_nodes = [n for n in level if n.status == FAILED]
    if failed_nodes and rollback_strategy == ABORT_ON_FAILURE:
      halt_remaining_rollback()
      mark dag.status = PARTIAL
      return PARTIAL_ROLLBACK
      
  # All levels completed
  if all nodes COMPLETED:
    mark dag.status = COMPLETED
    log ROLLBACK_COMPLETE
    return FULL_ROLLBACK_SUCCESS
  else:
    mark dag.status = PARTIAL
    log ROLLBACK_PARTIAL → T3 immediate
    return PARTIAL_ROLLBACK
```

---

## Rollback Strategies

```yaml
rollback_strategies:

  COMPLETE_OR_ESCALATE (default):
    description: Attempt all compensations; escalate any failures to human; continue remaining nodes
    use_when: standard workflow rollback
    behavior: never abort early; always attempt all nodes; report failures
    
  ABORT_ON_FAILURE:
    description: Stop entire rollback if any compensation fails
    use_when: tightly coupled state where partial rollback is worse than no rollback
    behavior: halt at first failure; human must decide next step
    authority_to_select: T3
    
  BEST_EFFORT:
    description: Complete what is possible; skip uncompensatable nodes; log residuals
    use_when: time-critical recovery where partial is acceptable
    behavior: skip UNCOMPENSATABLE nodes; continue all others
    authority_to_select: T3
    residual_state_documented: mandatory
```

---

## Rollback Completeness Validation

After rollback completes, the engine validates system state:

```
validate_rollback_completeness(dag_id) → completeness_report:

  for each completed node:
    pre_action_snapshot = load_snapshot(node.compensation_id.snapshot_id)
    current_state = read_current_state(node.target_resource)
    
    if sha256(current_state) == pre_action_snapshot.content_hash:
      node.verification = MATCH
    else:
      node.verification = MISMATCH
      escalate: T3 (resource in unexpected state post-rollback)
      
  completeness_report = {
    total_nodes: number,
    matched: number,
    mismatched: number,  ← human action required
    skipped: number,
    coverage: matched / total_nodes
  }
  
  if coverage >= 1.0: ROLLBACK_COMPLETE
  if coverage >= 0.80: ROLLBACK_SUBSTANTIAL — document residuals; T3 review
  if coverage < 0.80: ROLLBACK_FAILED — T4 immediate; manual state reconciliation
```

---

## Parallel Safety

Multiple compensations at the same level may execute in parallel. Safety rules:

```yaml
parallel_safety_rules:
  - Two compensations MUST NOT execute in parallel if:
      they write to the same resource (lock-based serialization required)
  
  - Serialization via modification-serializer.md:
      acquire EXCLUSIVE lock on target_resource before compensation
      release after compensation completes
      
  - If lock unavailable: wait up to 30s; then serialize sequentially
  - Maximum parallel compensation threads: 10 per DAG
```

---

## Integration

```
Feeds into:
  rollback-coordinator.md — DAG engine feeds coordinator with execution plan
  rollback-audit-trail.md — all DAG events logged
  execution-journal.md — rollback operations journaled

Receives from:
  compensating-transaction-engine.md — compensation chains input to DAG construction
  undo-registry.md — compensation operations fetched by node
  state-snapshot-manager.md — snapshots for completeness validation
  sandbox-engine.md — triggered on FAIL validation outcome
```

---

## Governance

**DAG completeness check:** 100% compensation coverage required before execution begins; partial coverage → T3 review before proceeding  
**Parallel safety:** Concurrent writes to same resource always serialized; never allowed to race  
**Rollback audit:** All DAG construction, execution, and validation events to `memory/rollback-systems/dag-audit.jsonl`  
**Retention:** RDAG records retained 2 years; PARTIAL and FAILED DAGs retained permanently
