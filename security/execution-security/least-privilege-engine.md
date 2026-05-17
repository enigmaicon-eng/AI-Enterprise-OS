# Least Privilege Engine

**System ID:** `least-privilege-engine`
**Role:** Computes and enforces the minimum set of permissions required for each agent to complete its declared task — evaluates declared workflow node requirements, prunes any permissions beyond strict necessity, and produces a minimal permission set that is bound to the specific execution context
**Storage:** `memory/execution-security/permission-grants.jsonl`

---

## Purpose

An agent with broad, persistent permissions is a security incident waiting to happen. If it hallucinates a write to the wrong path, or is injected with a malicious instruction, or malfunctions — the blast radius is proportional to its permissions. The least privilege engine inverts the default: instead of starting from "what can this agent do?" and restricting it, it starts from "what must this agent do?" and grants only that. Every permission is task-derived, task-scoped, and automatically revoked when the task ends.

---

## Permission Model

```yaml
Permission:
  permission_id: string
  permission_type: "READ | WRITE | EXECUTE | SEND | DELETE | PUBLISH | APPROVE | QUERY"
  
  resource:
    resource_type: "FILE_PATH | DIRECTORY | DATABASE | API_ENDPOINT | MCP_SERVER | TOOL | AGENT | WORKFLOW"
    resource_id: string               # Specific resource identifier
    resource_pattern: string | null   # Glob/regex for pattern-based grants
  
  constraints:
    max_invocations: integer | null   # How many times this permission can be used
    data_classification_max: string   # Highest classification data accessible
    read_only_fields: [string] | null # For DB/structured resources
    write_allowed_fields: [string] | null
    size_limit_bytes: integer | null  # Max data read/written per invocation
  
  scope:
    run_id: string | null             # Null = not workflow-bound (rare)
    node_id: string | null            # Null = applies to full run
    valid_from: datetime
    valid_until: datetime             # Always time-bounded
  
  granted_by: string                  # System that granted this permission
  grant_reason: string                # Derivation trace: which requirement generated this
  revoked: boolean
  revoked_at: datetime | null
  revoked_reason: string | null

PermissionGrant:
  grant_id: string
  agent_id: string
  run_id: string
  node_id: string | null
  
  permissions: [Permission]
  
  # Computed properties
  effective_capability_surface: string   # Human-readable summary
  permission_count: integer
  highest_risk_permission: string
  
  grant_hash: string                   # SHA-256 for integrity verification
  created_at: datetime
  expires_at: datetime
```

---

## Permission Derivation

```
compute_minimum_permissions(agent_id, node_decl, execution_context) → PermissionGrant:
  
  permissions = []
  
  # Step 1: Parse node declaration for requirements
  requirements = extract_requirements_from_declaration(node_decl)
  
  # Step 2: For each requirement, derive minimum permission
  FOR req in requirements:
    derived = derive_minimum_permission(req, execution_context)
    permissions.append(derived)
  
  # Step 3: Verify no redundant or overlapping permissions
  permissions = deduplicate_permissions(permissions)
  
  # Step 4: Apply global constraints
  permissions = apply_global_constraints(permissions, agent_id)
  
  # Step 5: Compute grant validity window
  valid_from = now()
  valid_until = min(
    execution_context.node_timeout_at,
    now() + timedelta(seconds=MAX_PERMISSION_LIFETIME_SECONDS)
  )
  
  # Apply validity window to all permissions
  FOR p in permissions:
    p.scope.valid_from = valid_from
    p.scope.valid_until = valid_until
  
  grant = PermissionGrant(
    grant_id = generate_uuid(),
    agent_id = agent_id,
    run_id = execution_context.run_id,
    node_id = execution_context.node_id,
    permissions = permissions,
    grant_hash = sha256(serialize(permissions))
  )
  
  persist_grant(grant)
  RETURN grant

extract_requirements_from_declaration(node_decl) → [Requirement]:
  requirements = []
  
  # Tool declarations → tool execution permissions
  FOR tool in node_decl.allowed_tools:
    requirements.append(Requirement(type="TOOL_USE", resource=tool, access="EXECUTE"))
  
  # Input mappings → read permissions on source nodes' outputs
  FOR (source_key, _) in node_decl.input_mapping.items():
    IF source_key.startswith("input."):
      requirements.append(Requirement(type="WORKFLOW_INPUT_READ", resource=source_key))
    ELIF "." in source_key:
      producer_id = source_key.split(".")[0]
      requirements.append(Requirement(type="RESULT_STORE_READ", resource=f"result:{producer_id}"))
  
  # Output declarations → write permissions on result store
  FOR output_field in node_decl.declared_outputs:
    requirements.append(Requirement(type="RESULT_STORE_WRITE",
      resource=f"result:{node_decl.node_id}.{output_field}"))
  
  # MCP server access → server-level permission with tool scope
  FOR mcp_access in node_decl.mcp_servers:
    requirements.append(Requirement(type="MCP_SERVER_ACCESS",
      resource=mcp_access.server_id,
      tool_scope=mcp_access.allowed_tools))
  
  RETURN requirements

derive_minimum_permission(requirement, execution_context) → Permission:
  
  MATCH requirement.type:
    
    CASE "TOOL_USE":
      RETURN Permission(
        permission_type = "EXECUTE",
        resource = ResourceSpec(resource_type="TOOL", resource_id=requirement.resource),
        constraints = {max_invocations: requirement.expected_invocations or DEFAULT_MAX_INVOCATIONS}
      )
    
    CASE "RESULT_STORE_READ":
      RETURN Permission(
        permission_type = "READ",
        resource = ResourceSpec(resource_type="DATABASE",
          resource_id = f"result-store/{execution_context.run_id}/{requirement.resource}"),
        constraints = {data_classification_max: execution_context.workflow_data_classification}
      )
    
    CASE "RESULT_STORE_WRITE":
      RETURN Permission(
        permission_type = "WRITE",
        resource = ResourceSpec(resource_type="DATABASE",
          resource_id = f"result-store/{execution_context.run_id}/{requirement.resource}"),
        constraints = {
          write_allowed_fields: requirement.declared_fields,
          size_limit_bytes: requirement.max_output_size_bytes
        }
      )
    
    CASE "MCP_SERVER_ACCESS":
      RETURN Permission(
        permission_type = "EXECUTE",
        resource = ResourceSpec(resource_type="MCP_SERVER", resource_id=requirement.resource),
        constraints = {
          allowed_tools: requirement.tool_scope,
          max_invocations: requirement.expected_calls or DEFAULT_MAX_MCP_CALLS
        }
      )
```

---

## Permission Enforcement

```
check_permission(agent_id, action, resource, enforcement_context) → PermissionCheckResult:
  
  run_id = enforcement_context.run_id
  node_id = enforcement_context.node_id
  
  # Load active grants for this agent/run/node
  active_grants = load_active_grants(agent_id, run_id, node_id)
  
  IF NOT active_grants:
    RETURN PermissionCheckResult(
      allowed = False,
      reason = "No active permission grant found for this agent/run/node context"
    )
  
  # Find a matching permission in any active grant
  FOR grant in active_grants:
    FOR permission in grant.permissions:
      
      IF permission.revoked:
        CONTINUE
      
      IF permission.scope.valid_until < now():
        CONTINUE  # Expired
      
      IF permission.permission_type != action:
        CONTINUE
      
      IF NOT resource_matches(resource, permission.resource):
        CONTINUE
      
      # Check invocation limit
      IF permission.constraints.max_invocations:
        current_count = get_invocation_count(permission.permission_id, run_id)
        IF current_count >= permission.constraints.max_invocations:
          RETURN PermissionCheckResult(
            allowed = False,
            reason = f"Permission invocation limit ({permission.constraints.max_invocations}) reached"
          )
      
      # Permission matches and is valid
      record_invocation(permission.permission_id, run_id)
      RETURN PermissionCheckResult(
        allowed = True,
        permission_id = permission.permission_id,
        grant_id = grant.grant_id
      )
  
  RETURN PermissionCheckResult(
    allowed = False,
    reason = f"No permission found for action '{action}' on resource '{resource}'"
  )
```

---

## Global Constraints

```yaml
GlobalConstraints:
  
  # No single agent/node can ever hold these across any workflow
  absolutely_forbidden:
    - permission_type: DELETE
      resource_type: DATABASE
      unless: node_type == "saga-compensation"
    - permission_type: PUBLISH
      resource_type: API_ENDPOINT
      data_classification: "CONFIDENTIAL"
      unless: explicit_approval_obtained
  
  # Always applied as maximums regardless of declaration
  hard_limits:
    max_mcp_calls_per_node: 50
    max_file_reads_per_node: 100
    max_write_size_bytes: 10_485_760    # 10 MB
    max_permission_lifetime_seconds: 3600
    max_concurrent_external_calls: 5
  
  # Elevated trust required for these
  requires_elevated_trust:
    - permission_type: EXECUTE
      resource_type: TOOL
      tool_id: "Bash"
    - permission_type: SEND
      resource_type: API_ENDPOINT
      data_classification: "INTERNAL"
```

---

## Integration

**Called by:**
- `execution-security/ephemeral-permission-manager.md` — uses derived grants to issue ephemeral tokens
- `workflow-engine/worker-dispatcher.md` — computes permission grant before dispatching node to worker

**Calls:**
- `workflow-engine/workflow-registry.md` — reads node declarations
- `audit-replay/immutable-audit-log.md` — records all grants and permission checks

**Reads from:** `memory/execution-security/permission-grants.jsonl`
**Writes to:** `memory/execution-security/permission-grants.jsonl`
