# Runtime Isolation Manager

**System ID:** `runtime-isolation-manager`
**Role:** Manages execution isolation boundaries between agents and workflow runs — prevents cross-run data leakage, enforces context namespace separation, controls resource sharing policies, manages isolation escalation for high-risk workflows, and provides the isolation enforcement layer between the scheduler and actual execution
**Storage:** `memory/execution-security/isolation-state.yaml`

---

## Purpose

Without isolation, a workflow run processing confidential data shares memory, context, and tool access with workflows processing public data. An agent's context from one run can bleed into another. A poorly-scoped tool can read across isolation boundaries. Isolation is not just about security — it is about correctness: a workflow's results should be deterministic given its inputs, not influenced by the execution state of concurrent workflows. The runtime isolation manager enforces this through namespace separation, context scoping, and resource partitioning.

---

## Isolation Levels

```yaml
IsolationLevel:
  
  STANDARD:
    description: "Default isolation for all workflow runs"
    guarantees:
      - Context namespace separation (separate key prefix per run_id)
      - Result store isolation (per-run-id result store)
      - No cross-run tool call sharing
      - Separate logging namespace per run
    resource_sharing:
      worker_pool: SHARED           # Workers shared across runs
      context_budget: ALLOCATED     # Budget reserved per run
      tool_instances: SHARED        # Tool connections pooled
  
  ENHANCED:
    description: "For CONFIDENTIAL classified workflows"
    guarantees:
      - All STANDARD guarantees
      - No worker reuse between CONFIDENTIAL and INTERNAL/PUBLIC runs
      - Dedicated log partition
      - Memory cleared between tasks on shared workers
    resource_sharing:
      worker_pool: CLASSIFICATION_SEGREGATED  # CONFIDENTIAL workers only
      tool_instances: ISOLATED
  
  STRICT:
    description: "For SECRET classified or high-risk workflows"
    guarantees:
      - All ENHANCED guarantees
      - Dedicated worker pool for this run (no sharing)
      - Dedicated MCP server connections (no pooling)
      - Encrypted inter-component communication
      - Input/output quarantine zones
    resource_sharing:
      worker_pool: DEDICATED_PER_RUN
      tool_instances: DEDICATED_PER_RUN
  
  SANDBOX:
    description: "For adversarial testing, red-teaming, untrusted content processing"
    guarantees:
      - All STRICT guarantees
      - Network access blocked by default
      - Filesystem access blocked (read-only exception list only)
      - No outbound communication without explicit override
      - All outputs quarantined pending review
    resource_sharing:
      worker_pool: QUARANTINED
      network: BLOCKED

IsolationProfile:
  run_id: string
  isolation_level: string
  classification: string
  
  # Namespacing
  context_namespace_prefix: string     # e.g., "run:{run_id}:"
  result_store_prefix: string
  log_partition: string
  
  # Resource allocation
  worker_pool_id: string               # Which worker pool this run draws from
  context_budget_tokens: integer
  
  # Network policy
  egress_allowed: boolean
  allowed_egress_domains: [string]
  
  # Status
  created_at: datetime
  terminated_at: datetime | null
```

---

## Isolation Profile Computation

```
compute_isolation_profile(run_id, workflow_definition) → IsolationProfile:
  
  # Determine required isolation level
  risk_level = workflow_definition.risk_level
  classification = workflow_definition.data_classification
  
  IF classification == "SECRET" OR risk_level == "CRITICAL":
    isolation_level = "STRICT"
  ELIF classification == "CONFIDENTIAL" OR risk_level == "HIGH":
    isolation_level = "ENHANCED"
  ELIF is_sandbox_workflow(workflow_definition):
    isolation_level = "SANDBOX"
  ELSE:
    isolation_level = "STANDARD"
  
  level_config = ISOLATION_LEVELS[isolation_level]
  
  # Assign worker pool
  worker_pool_id = assign_worker_pool(isolation_level, classification)
  
  # Compute context namespace (deterministic from run_id)
  context_prefix = f"run:{run_id}:"
  
  # Compute network policy
  egress_allowed = (isolation_level not in ["SANDBOX"])
  allowed_domains = compute_allowed_domains(workflow_definition, isolation_level)
  
  profile = IsolationProfile(
    run_id = run_id,
    isolation_level = isolation_level,
    classification = classification,
    context_namespace_prefix = context_prefix,
    result_store_prefix = f"results/{run_id}/",
    log_partition = f"logs/{run_id}",
    worker_pool_id = worker_pool_id,
    context_budget_tokens = workflow_definition.context_budget_tokens,
    egress_allowed = egress_allowed,
    allowed_egress_domains = allowed_domains,
    created_at = now()
  )
  
  persist_profile(profile)
  RETURN profile
```

---

## Namespace Enforcement

```
enforce_namespace(access_request, enforcement_context) → NamespaceDecision:
  
  run_id = enforcement_context.run_id
  profile = load_isolation_profile(run_id)
  
  resource = access_request.resource
  
  # Check that the resource is within this run's namespace
  MATCH access_request.resource_type:
    
    CASE "RESULT_STORE":
      IF NOT resource.startswith(profile.result_store_prefix):
        
        # Cross-run access: is this permitted?
        other_run_id = extract_run_id_from_path(resource)
        IF other_run_id:
          IF NOT is_cross_run_access_permitted(run_id, other_run_id, profile):
            RETURN NamespaceDecision(
              allowed = False,
              reason = f"Cross-run result store access from {run_id} to {other_run_id} is not permitted at isolation level '{profile.isolation_level}'"
            )
    
    CASE "MEMORY_KEY":
      IF NOT resource.startswith(profile.context_namespace_prefix):
        # Attempt to read/write another run's memory namespace
        RETURN NamespaceDecision(
          allowed = False,
          reason = f"Memory key '{resource}' is outside this run's namespace prefix '{profile.context_namespace_prefix}'"
        )
    
    CASE "WORKER":
      worker_pool = get_worker_pool_for_worker(access_request.worker_id)
      IF worker_pool != profile.worker_pool_id:
        RETURN NamespaceDecision(
          allowed = False,
          reason = f"Worker '{access_request.worker_id}' belongs to pool '{worker_pool}'; this run uses pool '{profile.worker_pool_id}'"
        )
    
    CASE "NETWORK_EGRESS":
      IF NOT profile.egress_allowed:
        RETURN NamespaceDecision(
          allowed = False,
          reason = f"Network egress blocked at isolation level '{profile.isolation_level}'"
        )
      
      target_domain = extract_domain(access_request.url)
      IF profile.allowed_egress_domains and target_domain NOT IN profile.allowed_egress_domains:
        RETURN NamespaceDecision(
          allowed = False,
          reason = f"Egress to domain '{target_domain}' not in allowed egress list"
        )
  
  RETURN NamespaceDecision(allowed=True)
```

---

## Context Contamination Prevention

```
# Ensure no agent context from run A leaks into run B

clear_worker_context_between_runs(worker_id, completed_run_id, next_run_id):
  
  completed_profile = load_isolation_profile(completed_run_id)
  next_profile = load_isolation_profile(next_run_id)
  
  # If isolation levels or classifications differ — require full context clear
  IF completed_profile.isolation_level != next_profile.isolation_level:
    require_context_wipe = True
  ELIF completed_profile.classification != next_profile.classification:
    require_context_wipe = True
  ELSE:
    require_context_wipe = False
  
  IF require_context_wipe:
    # Signal worker to clear all in-memory context
    worker_orchestration.send_clear_context_signal(worker_id, reason="ISOLATION_BOUNDARY_CHANGE")
    
    # Wait for acknowledgment before dispatching next task
    wait_for_worker_context_clear_ack(worker_id, timeout_seconds=30)
  ELSE:
    # Standard: clear only the run-scoped namespace prefix
    worker_orchestration.send_namespace_clear_signal(
      worker_id,
      namespace_prefix = completed_profile.context_namespace_prefix
    )

# Audit cross-run data flows
audit_cross_run_reference(from_run_id, to_run_id, resource):
  IF NOT is_cross_run_access_permitted(from_run_id, to_run_id):
    emit_security_alert(
      alert_type = "UNAUTHORIZED_CROSS_RUN_REFERENCE",
      from_run_id = from_run_id,
      to_run_id = to_run_id,
      resource = resource
    )
```

---

## Worker Pool Segregation

```yaml
WorkerPoolRegistry:
  
  pools:
    
    standard-pool:
      classification_allowed: ["PUBLIC", "INTERNAL"]
      isolation_levels: ["STANDARD"]
      worker_ids: [...]
    
    enhanced-pool:
      classification_allowed: ["CONFIDENTIAL"]
      isolation_levels: ["ENHANCED", "STANDARD"]
      worker_ids: [...]
      memory_clear_between_tasks: true
    
    strict-pool:
      classification_allowed: ["SECRET", "CONFIDENTIAL"]
      isolation_levels: ["STRICT"]
      worker_ids: [...]
      dedicated_per_run: true
    
    sandbox-pool:
      classification_allowed: ["PUBLIC"]   # Sandbox processes untrusted content only
      isolation_levels: ["SANDBOX"]
      network_blocked: true
      filesystem_restricted: true
      worker_ids: [...]
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — at run initialization, computes isolation profile
- `distributed-execution/worker-orchestration.md` — enforces worker pool assignment
- `execution-security/capability-scope-controller.md` — checks namespace on data access

**Calls:**
- `distributed-execution/worker-orchestration.md` — sends context clear signals
- `audit-replay/immutable-audit-log.md` — records isolation decisions and violations

**Reads from:** `memory/execution-security/isolation-state.yaml`
**Writes to:** `memory/execution-security/isolation-state.yaml`
