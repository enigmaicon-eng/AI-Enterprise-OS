# Workflow Registry

**System ID:** `workflow-registry`
**Role:** Stores, versions, and serves workflow definitions — the single source of truth for all workflow DAG schemas, retry policies, step configurations, and execution parameters; enforces schema validation before registration
**Storage:** `memory/workflow-engine/workflow-registry.yaml` + `memory/workflow-engine/workflow-versions/[definition-id]-v[N].yaml`

---

## Purpose

The workflow registry is the catalog of everything the execution runtime knows how to run. Every executable workflow must be registered before it can be scheduled. Registration validates the definition, assigns a version, and makes the workflow available to the scheduler, DAG compiler, and dispatcher. Versioning ensures that in-flight workflows complete against the definition they started with, even after a newer version is deployed.

---

## Workflow Definition Schema

```yaml
WorkflowDefinition:
  definition_id: string              # Stable identifier across versions
  version: integer                   # Monotonically increasing
  status: "DRAFT | ACTIVE | DEPRECATED | ARCHIVED"
  
  metadata:
    name: string
    description: string
    owner: string                    # Agent or org responsible
    tags: [string]
    created_at: datetime
    updated_at: datetime
  
  # Execution configuration
  execution:
    max_duration_seconds: integer    # Wall-clock timeout for entire workflow
    priority: "CRITICAL | HIGH | NORMAL | LOW | BACKGROUND"
    max_concurrent_runs: integer     # 0 = unlimited
    retry_policy_id: string          # Default policy for all nodes unless overridden
    failure_policy: "FAIL_FAST | CONTINUE | COMPENSATE"
    deadline_policy: "IGNORE | NOTIFY | ESCALATE"
  
  # Input/output schema (JSON Schema)
  input_schema: object
  output_schema: object
  
  # DAG definition
  nodes:
    - node_id: string
      node_type: string
      executor: string
      depends_on: [string]
      depends_on_mode: "ALL | ANY"
      step_config: object            # Executor-specific configuration
      retry_policy_id: string | null # Overrides workflow default
      timeout_seconds: integer
      failure_policy: string | null  # Overrides workflow default
      input_mapping: map
  
  edges:
    - from_node: string
      to_node: string
      edge_type: string
      condition: string | null
  
  # Compensation plan (for COMPENSATE failure policy)
  compensation_plan:
    - for_node: string               # If this node fails after this point
      compensate_nodes: [string]     # Run these compensation steps in reverse order
  
  # Trigger configuration
  default_trigger:
    trigger_type: string
    cron_expression: string | null
    event_topic: string | null
```

---

## Registration Protocol

```
register(definition):
  
  # Step 1: Schema validation
  validate_json_schema(definition, WorkflowDefinition.schema)
  
  # Step 2: DAG validation
  dag_validator.validate(definition.nodes, definition.edges)
  # → Checks: no cycles, all depends_on references exist, all executor types registered,
  #           all input_mappings reference valid upstream outputs
  
  # Step 3: Compensation plan validation (if COMPENSATE failure policy)
  IF definition.execution.failure_policy == "COMPENSATE":
    validate_compensation_plan(definition.compensation_plan, definition.nodes)
  
  # Step 4: Version assignment
  existing = registry.get(definition.definition_id)
  IF existing:
    definition.version = existing.latest_version + 1
    existing_version.status = "DEPRECATED"  # Old version still usable by in-flight runs
  ELSE:
    definition.version = 1
  
  # Step 5: Persist
  write(
    path = "workflow-versions/[definition-id]-v[N].yaml",
    content = definition
  )
  update_registry_index(definition)
  
  RETURN {definition_id, version, status: "ACTIVE"}
```

---

## Version Pinning

In-flight workflows are pinned to the definition version they started with:

```
ON workflow activation:
  workflow_run.definition_version = registry.get_active_version(definition_id)
  
  # This version is pinned for the lifetime of this run.
  # Even if v3 is deployed while v2 is running, the running workflow uses v2.

ON DAG compilation:
  dag_compiler.compile(
    definition = registry.get_version(definition_id, workflow_run.definition_version)
  )
```

---

## Registry Index Schema

```yaml
WorkflowRegistryIndex:
  last_updated: datetime
  total_definitions: integer
  
  definitions:
    - definition_id: string
      latest_version: integer
      active_version: integer        # Version new runs should use (may differ if partial rollout)
      status: "ACTIVE | DEPRECATED | ARCHIVED"
      name: string
      owner: string
      tags: [string]
      retry_policy_id: string
      executor_types_used: [string]  # For pre-flight capability check
      avg_duration_p50_seconds: float | null   # Learned from run history
      avg_duration_p90_seconds: float | null
      success_rate_30d: float | null
      run_count_30d: integer | null
```

---

## Lookup Operations

```
get_active_version(definition_id) → WorkflowDefinition
  # Returns the version flagged as active for new runs

get_version(definition_id, version) → WorkflowDefinition
  # Returns specific version (for pinned in-flight runs)

get_retry_policy(definition_id, node_id) → RetryPolicy
  # Returns node-level policy if set, else workflow-level, else system default

list(filter: {tags, owner, executor_type, status}) → [WorkflowDefinition]
  # Filtered listing of registered definitions

get_performance_profile(definition_id) → {avg_duration_p50, p90, success_rate}
  # Used by scheduler for deadline estimation
```

---

## Integration

**Called by:**
- `workflow-engine/workflow-scheduler.md` — looks up definition on trigger fire
- `orchestration-dags/dag-compiler.md` — reads definition to compile DAG
- `workflow-engine/dag-engine.md` — reads retry policies per node
- `workflow-engine/worker-dispatcher.md` — reads executor type requirements

**Writes to:**
- `memory/workflow-engine/workflow-registry.yaml` — index
- `memory/workflow-engine/workflow-versions/[definition-id]-v[N].yaml` — versioned definitions

**Calls:** `orchestration-dags/dag-validator.md` — validates DAG structure on registration
