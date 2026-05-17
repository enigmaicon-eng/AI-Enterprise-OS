# Capability Scope Controller

**System ID:** `capability-scope-controller`
**Role:** Defines, publishes, and enforces capability manifests for every agent — describes the exact set of tools, data access patterns, MCP servers, and behavioral permissions an agent may use; enforces scope at runtime by validating each action against the agent's registered manifest and the current execution context
**Storage:** `memory/execution-security/capability-manifests.yaml`

---

## Purpose

An agent's capability scope is its behavioral contract: a precise, auditable declaration of what it can do, not just what it is supposed to do. Without a formal capability manifest, an agent's actual behavior is unbounded by anything other than the model's inclinations. With a manifest, every tool call, every data access, every MCP server interaction has a declared answer: is this within scope or not? Scope violations are caught at enforcement time — before execution, not after.

---

## Capability Manifest Schema

```yaml
CapabilityManifest:
  manifest_id: string
  agent_id: string
  manifest_version: integer
  
  # What this agent is for
  purpose: string
  trust_tier: "T1 | T2 | T3 | T4 | T5"   # From agent authority hierarchy
  
  # Tool capabilities
  tools:
    allowed_tools: [string]                # Explicit allowlist of tool names
    forbidden_tools: [string]              # Explicit blocklist (supplement to allowlist)
    tool_constraints:
      [tool_name]:
        max_invocations_per_node: integer
        max_invocations_per_run: integer
        argument_constraints: object       # Tool-specific argument restrictions
  
  # MCP server access
  mcp_servers:
    allowed_servers: [string]
    per_server:
      [server_id]:
        allowed_tools: [string]
        max_calls_per_run: integer
  
  # Data access
  data_access:
    max_classification: "PUBLIC | INTERNAL | CONFIDENTIAL | SECRET"
    allowed_data_sources: [string]
    forbidden_data_patterns: [string]     # Regex patterns for data the agent must not access
    can_write_external: boolean
    can_read_cross_run: boolean           # Can access results from other workflow runs
  
  # Execution capabilities
  execution:
    can_spawn_subagents: boolean
    max_subagent_depth: integer
    can_spawn_workflows: boolean
    allowed_executor_types: [string]
    max_context_budget_pct: float         # Max % of context window this agent may use
    max_tool_chain_depth: integer         # Max sequential tool calls per turn
  
  # Behavioral constraints
  behavioral:
    intent_class: string                  # Default intent class for this agent
    requires_approval_for: [string]       # Actions requiring human approval
    cannot_approve_own_work: boolean
    max_autonomous_decisions: integer     # Decisions made without human input per run
    must_cite_sources: boolean
    must_produce_rationale: boolean
  
  # Network and communication
  network:
    can_make_external_calls: boolean
    allowed_external_domains: [string]
    can_send_messages: boolean
    allowed_message_recipients: [string]
  
  # Governance
  governance:
    must_pass_gates: [string]            # Gate IDs this agent's output must pass
    authority_level: integer             # 1-5; what decisions this agent can make alone
    requires_peer_review_above: integer  # Risk level requiring peer review
  
  # Manifest integrity
  created_at: datetime
  signed_by: string
  manifest_hash: string                  # SHA-256 for tamper detection
  manifest_signature: string             # Ed25519 signature from execution-signing
```

---

## Standard Agent Manifests

```yaml
standard_manifests:
  
  # T1 — Executor agents: narrow, task-specific, lowest authority
  read_only_analyst:
    trust_tier: T1
    tools.allowed_tools: ["Read", "Glob", "Grep", "WebSearch"]
    tools.forbidden_tools: ["Write", "Edit", "Bash", "Agent"]
    data_access.max_classification: INTERNAL
    data_access.can_write_external: false
    execution.can_spawn_subagents: false
    behavioral.max_autonomous_decisions: 0
    governance.authority_level: 1
  
  # T2 — Standard working agents
  standard_engineer:
    trust_tier: T2
    tools.allowed_tools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "WebSearch", "WebFetch"]
    tools.tool_constraints:
      Bash:
        max_invocations_per_node: 10
        argument_constraints:
          forbidden_patterns: ["rm -rf", "curl.*|.*sh", "wget.*|"]
    data_access.max_classification: CONFIDENTIAL
    execution.can_spawn_subagents: true
    execution.max_subagent_depth: 2
    behavioral.max_autonomous_decisions: 10
    governance.authority_level: 2
  
  # T3 — Orchestration agents
  workflow_orchestrator:
    trust_tier: T3
    tools.allowed_tools: ["Read", "Write", "Edit", "Glob", "Grep", "Agent", "Bash", "WebSearch"]
    execution.can_spawn_subagents: true
    execution.max_subagent_depth: 4
    execution.can_spawn_workflows: true
    behavioral.max_autonomous_decisions: 25
    governance.authority_level: 3
    governance.must_pass_gates: ["quality-gate", "governance-gate"]
  
  # T4 — Governance agents
  governance_agent:
    trust_tier: T4
    behavioral.cannot_approve_own_work: true
    behavioral.requires_approval_for: ["POLICY_CHANGE", "GATE_MODIFICATION"]
    governance.authority_level: 4
    network.can_make_external_calls: false  # Governance agents are isolated
  
  # T5 — Executive agents
  executive_agent:
    trust_tier: T5
    behavioral.max_autonomous_decisions: 100
    governance.authority_level: 5
    behavioral.requires_approval_for: ["IRREVERSIBLE_ACTIONS", "EXTERNAL_COMMITMENTS"]
```

---

## Scope Enforcement

```
enforce_scope(agent_id, action_request, enforcement_context) → ScopeDecision:
  
  manifest = load_manifest(agent_id)
  IF manifest is null:
    RETURN ScopeDecision(
      decision = "BLOCK",
      reason = f"No capability manifest found for agent '{agent_id}' — unregistered agents are blocked"
    )
  
  violations = []
  
  MATCH action_request.action_type:
    
    CASE "TOOL_CALL":
      tool_name = action_request.tool_name
      
      IF manifest.tools.forbidden_tools AND tool_name IN manifest.tools.forbidden_tools:
        violations.append(ScopeViolation(
          violation_type = "FORBIDDEN_TOOL",
          severity = "BLOCK",
          message = f"Tool '{tool_name}' is explicitly forbidden in this agent's capability manifest"
        ))
      
      IF manifest.tools.allowed_tools AND tool_name NOT IN manifest.tools.allowed_tools:
        violations.append(ScopeViolation(
          violation_type = "UNDECLARED_TOOL",
          severity = "BLOCK",
          message = f"Tool '{tool_name}' not in agent's allowed_tools list"
        ))
      
      # Check tool-specific constraints
      IF tool_name IN manifest.tools.tool_constraints:
        constraints = manifest.tools.tool_constraints[tool_name]
        node_invocations = count_tool_invocations(agent_id, tool_name, enforcement_context.node_id, enforcement_context.run_id)
        
        IF constraints.max_invocations_per_node AND node_invocations >= constraints.max_invocations_per_node:
          violations.append(ScopeViolation(
            violation_type = "TOOL_INVOCATION_LIMIT",
            severity = "BLOCK",
            message = f"Tool '{tool_name}' invocation limit ({constraints.max_invocations_per_node}) reached for this node"
          ))
    
    CASE "DATA_ACCESS":
      data_source = action_request.data_source
      data_classification = get_data_classification(data_source)
      
      IF data_classification_exceeds(data_classification, manifest.data_access.max_classification):
        violations.append(ScopeViolation(
          violation_type = "DATA_CLASSIFICATION_EXCEEDED",
          severity = "BLOCK",
          message = f"Data '{data_source}' classification {data_classification} exceeds agent max {manifest.data_access.max_classification}"
        ))
      
      IF manifest.data_access.forbidden_data_patterns:
        FOR pattern in manifest.data_access.forbidden_data_patterns:
          IF regex_match(pattern, data_source):
            violations.append(ScopeViolation(
              violation_type = "FORBIDDEN_DATA_ACCESS",
              severity = "BLOCK",
              message = f"Data source '{data_source}' matches forbidden pattern '{pattern}'"
            ))
    
    CASE "SUBAGENT_SPAWN":
      IF NOT manifest.execution.can_spawn_subagents:
        violations.append(ScopeViolation(
          violation_type = "SUBAGENT_SPAWN_FORBIDDEN",
          severity = "BLOCK",
          message = "This agent's capability scope does not permit subagent spawning"
        ))
      
      current_depth = enforcement_context.subagent_depth
      IF current_depth >= manifest.execution.max_subagent_depth:
        violations.append(ScopeViolation(
          violation_type = "SUBAGENT_DEPTH_EXCEEDED",
          severity = "BLOCK",
          message = f"Subagent depth {current_depth} reached maximum {manifest.execution.max_subagent_depth}"
        ))
    
    CASE "EXTERNAL_MESSAGE":
      IF NOT manifest.network.can_send_messages:
        violations.append(ScopeViolation(
          violation_type = "MESSAGING_FORBIDDEN",
          severity = "BLOCK"
        ))
      
      recipient = action_request.recipient
      IF manifest.network.allowed_message_recipients:
        IF NOT any(recipient.matches(allowed) for allowed in manifest.network.allowed_message_recipients):
          violations.append(ScopeViolation(
            violation_type = "UNAUTHORIZED_RECIPIENT",
            severity = "BLOCK",
            message = f"Recipient '{recipient}' not in allowed recipients list"
          ))
  
  # Check ephemeral token
  IF enforcement_context.token:
    token_valid = ephemeral_permission_manager.verify_token(
      enforcement_context.token,
      action_request.action_type,
      action_request.resource
    )
    IF NOT token_valid.valid:
      violations.append(ScopeViolation(
        violation_type = "TOKEN_INVALID",
        severity = "BLOCK",
        message = f"Ephemeral permission token invalid: {token_valid.reason}"
      ))
  
  IF violations:
    decision = ScopeDecision(decision="BLOCK", violations=violations)
  ELSE:
    decision = ScopeDecision(decision="ALLOW")
  
  log_scope_decision(agent_id, action_request, decision)
  RETURN decision
```

---

## Manifest Registration

```
register_manifest(agent_id, manifest_config) → manifest_id:
  
  # Validate manifest structure
  validate_manifest_schema(manifest_config)
  
  # Check for consistency (no tool in both allowed and forbidden)
  IF overlap := set(manifest_config.tools.allowed_tools) & set(manifest_config.tools.forbidden_tools):
    RAISE ManifestConflict(f"Tools in both allowed and forbidden: {overlap}")
  
  # Sign the manifest
  manifest_hash = sha256(canonical_serialize(manifest_config))
  manifest_signature = execution_signing.sign_artifact(
    manifest_config, signing_context={artifact_type: "CAPABILITY_MANIFEST"}
  )
  
  manifest = CapabilityManifest(
    manifest_id = generate_uuid(),
    agent_id = agent_id,
    manifest_version = get_next_version(agent_id),
    manifest_hash = manifest_hash,
    manifest_signature = manifest_signature,
    created_at = now(),
    **manifest_config
  )
  
  persist_manifest(manifest)
  RETURN manifest.manifest_id
```

---

## Integration

**Called by:** Every agent action — enforced as the outermost wrapper before any tool, data access, or communication proceeds

**Calls:**
- `execution-security/ephemeral-permission-manager.md` — verifies active token on each enforcement
- `execution-security/execution-signing.md` — signs manifests on registration
- `semantic-gateway/tool-intent-verifier.md` — delegates tool intent verification
- `audit-replay/immutable-audit-log.md` — records all scope decisions

**Reads from:** `memory/execution-security/capability-manifests.yaml`
**Writes to:** `memory/execution-security/capability-manifests.yaml`
