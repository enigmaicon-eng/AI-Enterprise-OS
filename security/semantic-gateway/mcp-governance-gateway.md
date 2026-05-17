# MCP Governance Gateway

**System ID:** `mcp-governance-gateway`
**Role:** Governs all Model Context Protocol (MCP) server interactions — enforces capability registration, validates tool schemas before use, gates access to MCP servers by agent and workflow context, monitors for MCP server anomalies, and provides the policy enforcement point for all external tool integrations
**Storage:** `memory/semantic-gateway/mcp-registry.yaml` + `memory/semantic-gateway/mcp-audit.jsonl`

---

## Purpose

MCP servers extend agent capabilities into the external world — file systems, databases, communication platforms, web browsers, code execution environments. Each MCP server is an attack surface: a compromised or misconfigured MCP server could exfiltrate data, execute unauthorized commands, or inject malicious content into agent context. The MCP governance gateway is the policy enforcement point that every MCP call must traverse — validating server legitimacy, enforcing capability contracts, and recording every interaction.

---

## MCP Server Registration

```yaml
MCPServerRegistration:
  server_id: string                    # Stable identifier (e.g., "mcp-filesystem")
  server_name: string                  # Human-readable name
  server_version: string
  
  # Trust classification
  trust_tier: "SYSTEM | ENTERPRISE | EXTERNAL | UNTRUSTED"
  
  # Capability declaration
  capabilities:
    tools: [ToolCapabilityDecl]        # All tools this server exposes
    resources: [ResourceCapabilityDecl]
  
  # Access control
  access_control:
    allowed_agent_ids: [string] | null    # Null = any registered agent
    allowed_executor_types: [string] | null
    allowed_workflow_definition_ids: [string] | null
    requires_workflow_context: boolean    # False = can be called outside workflow
  
  # Security profile
  security:
    data_classification_max: "PUBLIC | INTERNAL | CONFIDENTIAL | SECRET"
    network_access: boolean
    filesystem_access: boolean
    process_execution: boolean
    external_service_calls: boolean
  
  # Schema validation
  schema_version: integer
  tool_schemas: {tool_name: JSONSchema}  # Expected schemas for each tool
  
  # Health and monitoring
  health_endpoint: string | null
  last_health_check: datetime | null
  health_status: "HEALTHY | DEGRADED | UNREACHABLE | SUSPENDED"

ToolCapabilityDecl:
  tool_name: string
  risk_level: "LOW | MEDIUM | HIGH | CRITICAL"
  requires_approval: boolean           # true = human approval required before use
  idempotent: boolean
  reversible: boolean
  data_access: "NONE | READ | WRITE | READ_WRITE"
  network_access: boolean
  description: string

TrustTier:
  SYSTEM:    # Core OS tools; highest trust; pre-approved
    approval_required: false
    audit_level: "STANDARD"
  ENTERPRISE:  # Registered enterprise integrations (GitHub, Slack, Jira)
    approval_required: false
    audit_level: "DETAILED"
  EXTERNAL:  # Third-party services; per-use approval for HIGH/CRITICAL tools
    approval_required: "for HIGH and CRITICAL risk tools"
    audit_level: "DETAILED"
  UNTRUSTED:  # Unknown/unregistered servers
    approval_required: true           # All tools require approval
    audit_level: "FULL"
    sandbox_required: true
```

---

## Gateway Enforcement Protocol

```
enforce_mcp_call(mcp_call, enforcement_context) → MCPCallDecision:
  
  server_id = mcp_call.server_id
  tool_name = mcp_call.tool_name
  arguments = mcp_call.arguments
  
  agent_id = enforcement_context.agent_id
  run_id = enforcement_context.run_id
  
  # Step 1: Server registration check
  registration = mcp_registry.get(server_id)
  IF registration is null:
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"MCP server '{server_id}' is not registered — unregistered servers are blocked"
    )
  
  IF registration.health_status in ["SUSPENDED", "UNREACHABLE"]:
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"MCP server '{server_id}' is in {registration.health_status} state"
    )
  
  # Step 2: Agent access control
  IF registration.access_control.allowed_agent_ids is not null:
    IF agent_id NOT IN registration.access_control.allowed_agent_ids:
      RETURN MCPCallDecision(
        decision = "BLOCK",
        reason = f"Agent '{agent_id}' not authorized to use MCP server '{server_id}'"
      )
  
  IF registration.access_control.requires_workflow_context AND NOT run_id:
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"MCP server '{server_id}' requires active workflow context"
    )
  
  # Step 3: Tool existence and schema validation
  IF tool_name NOT IN registration.tool_schemas:
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"Tool '{tool_name}' not registered for server '{server_id}'"
    )
  
  schema_errors = validate_against_schema(arguments, registration.tool_schemas[tool_name])
  IF schema_errors:
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"Tool argument schema validation failed: {schema_errors}"
    )
  
  # Step 4: Tool risk level and approval gate
  tool_decl = get_tool_decl(registration, tool_name)
  
  IF tool_requires_approval(tool_decl, registration.trust_tier):
    approval = check_approval(mcp_call, enforcement_context)
    IF NOT approval.approved:
      IF approval.pending:
        RETURN MCPCallDecision(decision="PENDING_APPROVAL", approval_request_id=approval.request_id)
      RETURN MCPCallDecision(
        decision = "BLOCK",
        reason = f"Tool '{tool_name}' requires approval; no valid approval found"
      )
  
  # Step 5: Semantic intent verification
  intent_verdict = tool_intent_verifier.verify_tool_call(
    tool_call = {tool_name: tool_name, arguments: arguments},
    verification_context = enforcement_context
  )
  IF intent_verdict.verdict in ["DENY", "BLOCK"]:
    RETURN MCPCallDecision(decision=intent_verdict.verdict, violations=intent_verdict.violations)
  
  # Step 6: Data classification check
  # Ensure the workflow doesn't send data above max classification to this server
  workflow_data_classification = get_workflow_data_classification(run_id)
  IF data_classification_exceeds(workflow_data_classification, registration.security.data_classification_max):
    RETURN MCPCallDecision(
      decision = "BLOCK",
      reason = f"Workflow data classification ({workflow_data_classification}) exceeds server's max ({registration.security.data_classification_max})"
    )
  
  # Step 7: Rate limiting
  IF exceeds_rate_limit(server_id, agent_id, run_id):
    RETURN MCPCallDecision(
      decision = "THROTTLE",
      retry_after_seconds = get_retry_after(server_id, agent_id)
    )
  
  # All checks passed
  call_id = generate_uuid()
  audit_mcp_call(call_id, mcp_call, enforcement_context, "ALLOWED")
  
  RETURN MCPCallDecision(
    decision = "ALLOW",
    call_id = call_id,
    audit_record_id = call_id
  )

tool_requires_approval(tool_decl, trust_tier):
  IF tool_decl.requires_approval:
    RETURN True
  IF trust_tier == "UNTRUSTED":
    RETURN True
  IF trust_tier == "EXTERNAL" AND tool_decl.risk_level in ["HIGH", "CRITICAL"]:
    RETURN True
  RETURN False
```

---

## MCP Server Health Monitoring

```
monitor_mcp_servers():
  
  FOR each server in mcp_registry.list_active_servers():
    
    # Health check
    IF server.health_endpoint:
      TRY:
        response = http_get(server.health_endpoint, timeout=5)
        IF response.status == 200:
          server.health_status = "HEALTHY"
        ELSE:
          server.health_status = "DEGRADED"
      EXCEPT Timeout:
        server.health_status = "UNREACHABLE"
    
    # Anomaly detection: unusual call volume, error rates, tool distribution
    call_stats = get_call_stats(server.server_id, window_minutes=15)
    
    IF call_stats.error_rate > 0.20:
      server.health_status = "DEGRADED"
      emit_alert("MCP_HIGH_ERROR_RATE", server.server_id, call_stats.error_rate)
    
    IF call_stats.volume > server.expected_volume_per_15min × 5:
      emit_alert("MCP_UNUSUAL_CALL_VOLUME", server.server_id, call_stats.volume)
      # Consider auto-suspend if volume is extreme (potential runaway agent)
      IF call_stats.volume > server.expected_volume_per_15min × 20:
        suspend_server(server.server_id, reason="Extreme call volume anomaly — possible runaway agent")
```

---

## MCP Server Audit Schema

```yaml
MCPAuditRecord:
  call_id: string
  server_id: string
  tool_name: string
  arguments_hash: string               # SHA-256 — never store plaintext args
  
  context:
    agent_id: string
    run_id: string | null
    node_id: string | null
  
  decision: "ALLOW | BLOCK | THROTTLE | PENDING_APPROVAL"
  decision_reason: string | null
  
  # For ALLOW decisions: response metadata
  response_size_bytes: integer | null
  response_latency_ms: float | null
  
  timestamp: datetime
  audit_hash: string                   # Chained to previous record hash
```

---

## MCP Registry — Pre-Registered Servers

```yaml
pre_registered_servers:
  
  - server_id: "mcp-filesystem"
    trust_tier: SYSTEM
    capabilities.security:
      filesystem_access: true
      network_access: false
    access_control.requires_workflow_context: true
  
  - server_id: "mcp-github"
    trust_tier: ENTERPRISE
    capabilities.security:
      data_classification_max: CONFIDENTIAL
      network_access: true
  
  - server_id: "mcp-slack"
    trust_tier: ENTERPRISE
    capabilities.security:
      data_classification_max: INTERNAL
      network_access: true
  
  - server_id: "mcp-playwright"
    trust_tier: EXTERNAL
    capabilities.security:
      network_access: true
      data_classification_max: PUBLIC
    # All HIGH/CRITICAL tools require approval
```

---

## Integration

**Called by:** Every agent making any MCP tool call — enforced at the execution layer before tool dispatch

**Calls:**
- `semantic-gateway/tool-intent-verifier.md` — semantic intent check
- `governance-attestation/cryptographic-approval-engine.md` — verifies approval signatures for HIGH/CRITICAL tools
- `audit-replay/immutable-audit-log.md` — writes every MCP call record

**Reads from:** `memory/semantic-gateway/mcp-registry.yaml`
**Writes to:** `memory/semantic-gateway/mcp-audit.jsonl`
