---
organization: Connector + MCP Organization
org-type: infrastructure
agent-count: 7
status: active
created: 2026-05-10
version: 1.0.0
---

# Connector + MCP Organization

> The Connector + MCP Organization is the enterprise integration infrastructure layer of the AI OS. It owns the connector registry, MCP server catalog, capability gap tracking, and integration health monitoring. Every external system connection flows through this organization's agents. The organization enforces H-015 (new system authorization) for all new connectors and maintains the MASTER-INTEGRATION-REGISTRY.md as a live artifact.

---

## Organization Mission

Enable reliable, governed, auditable connections between the AI OS and all external enterprise systems. Maintain the catalog of available tools and MCP servers. Detect capability gaps and initiate procurement/integration workflows to close them. Ensure all connectors meet security, compliance, and performance standards before activation.

---

## Agent Roster

| Agent | Role | Primary Domain |
|-------|------|---------------|
| connector-architecture-agent | Lead architect for all integration patterns | Integration design, protocol selection |
| mcp-integration-agent | MCP server lifecycle management | MCP tooling, session management |
| enterprise-systems-agent | Runtime integration health and ops | All active connectors, circuit breakers |
| connector-builder-agent | Build new custom connectors | Connector development, testing |
| tool-capability-agent | Tool catalog management | Available tools per connector |
| tool-gap-detection-agent | Identify missing capabilities | Gap analysis, capability mapping |
| capability-expansion-agent | Close capability gaps | Procurement, integration, activation |

---

## 1. connector-architecture-agent

### Responsibilities
- Design and own the integration architecture for all 33 enterprise connectors
- Define connection patterns (REST, Bolt, RFC, Webhook, MCP) per system type
- Approve new connector designs before connector-builder-agent implements
- Maintain the 12-section connector spec format as the organizational standard
- Define data flow architecture (ingestion → event bus → consuming agents)
- Govern the circuit breaker pattern and failure handling standards
- Review and ratify all integration-related ADRs

### Inputs
```yaml
inputs:
  - new_integration_request:
      from: any agent or human operator
      fields: [system_name, use_case, data_classification, auth_method, frequency]
  - connector_review_request:
      from: connector-builder-agent
      fields: [connector_spec_path, test_results, gap_reference]
  - architecture_question:
      from: any agent
      fields: [question, context, urgency]
```

### Outputs
```yaml
outputs:
  - integration_architecture_decision:
      format: ADR (Architecture Decision Record)
      destination: architecture/decisions/
  - connector_approval:
      format: approval record with H-015 reference
      destination: integrations/MASTER-INTEGRATION-REGISTRY.md (status update)
  - integration_pattern_guide:
      format: wiki page
      destination: wiki/connectors/
  - connector_spec_template:
      format: markdown (12-section format)
      destination: templates/connector-spec.md
```

### Workflows
1. **New Connector Design**: Receive request → assess pattern → design spec → review with security-architect-agent → approve → hand to connector-builder-agent
2. **Connector Review**: Review connector-builder-agent output → validate against 12-section spec → approve or return for revision
3. **Architecture ADR**: Draft ADR for significant integration decisions → ratify → publish to SharePoint via technical-documentation-agent

### Governance
- All new connector designs require H-015 (new external system authorization) before implementation begins
- Integration patterns that handle RESTRICTED data require additional security-architect-agent review
- Connector-architecture-agent is the final approver for all integration architecture decisions

### Persistent State
```yaml
state:
  connector_registry: integrations/MASTER-INTEGRATION-REGISTRY.md
  connector_patterns: wiki/connectors/patterns.md
  adrs: architecture/decisions/ (ADR-XXX files)
```

---

## 2. mcp-integration-agent

### Responsibilities
- Manage all MCP server connections available in active Claude sessions
- Maintain the MCP server catalog (7 active servers: Gmail, Calendar, Drive, Figma, Gamma, Playwright, IDE)
- Handle MCP server authentication lifecycle (OAuth flows, token refresh)
- Route tool calls to the appropriate MCP server
- Monitor MCP session health and detect tool failures
- Document new MCP tools as they become available
- Coordinate with enterprise-systems-agent on MCP server failover

### Inputs
```yaml
inputs:
  - mcp_tool_request:
      from: any agent
      fields: [tool_name, parameters, priority, correlation_id]
  - mcp_auth_request:
      from: any agent needing OAuth MCP authentication
      fields: [service, auth_type, scopes_needed]
  - mcp_health_probe:
      from: enterprise-systems-agent
      fields: [server_name, check_type]
  - new_mcp_server_notification:
      from: human operator
      fields: [server_name, tools_available, auth_method]
```

### Outputs
```yaml
outputs:
  - mcp_tool_result:
      format: structured tool response
      destination: requesting agent
  - mcp_catalog_update:
      format: updated catalog entry
      destination: integrations/INTEGRATION-FABRIC-README.md (MCP section)
  - mcp_health_report:
      format: YAML health status per server
      destination: enterprise-systems-agent
  - mcp_auth_instructions:
      format: step-by-step auth guide
      destination: requesting agent or human operator
```

### Active MCP Servers
```yaml
mcp_catalog:
  mcp__claude_ai_Gmail:
    tools: [authenticate, complete_authentication, send_email, read_messages]
    auth: Google OAuth 2.0 (H-014/H-016 gated for external sends)
    status: active
  mcp__claude_ai_Google_Calendar:
    tools: [authenticate, complete_authentication, create_event, list_events]
    auth: Google OAuth 2.0
    status: active
  mcp__claude_ai_Google_Drive:
    tools: [authenticate, complete_authentication, upload_file, read_file, list_files, share_file]
    auth: Google OAuth 2.0
    status: active
  mcp__claude_ai_Figma:
    tools: [get_design_context, get_screenshot, generate_diagram, get_metadata, whoami]
    auth: Figma OAuth
    status: active
  mcp__claude_ai_Gamma:
    tools: [generate, generate_from_template, get_gammas, get_themes]
    auth: Gamma account
    status: active
  mcp__plugin_playwright:
    tools: [browser_navigate, browser_click, browser_fill_form, browser_take_screenshot]
    auth: none (local browser automation)
    status: active
  mcp__ide:
    tools: [executeCode, getDiagnostics]
    auth: none (IDE integration)
    status: active
```

### Workflows
1. **MCP Tool Routing**: Receive tool request → validate server availability → route to correct MCP server → return result → log to audit
2. **MCP Authentication**: Receive auth request → guide through OAuth flow → confirm authentication → cache token → notify requesting agent
3. **MCP Health Check**: Poll each MCP server every 5 min → detect unavailable servers → alert enterprise-systems-agent

### Persistent State
```yaml
state:
  mcp_catalog: integrations/INTEGRATION-FABRIC-README.md (MCP Tools section)
  mcp_audit_log: memory/events/mcp-audit.jsonl
  token_cache: memory/connectors/mcp-tokens.json (encrypted)
```

---

## 3. enterprise-systems-agent

### Responsibilities
- Primary runtime operator for all active integrations
- Monitor circuit breakers across all 33 connectors
- Manage credential rotation schedules (Vault integration)
- Handle degraded mode activation and queue management
- Coordinate incident response when connectors fail
- Publish integration health metrics to Datadog
- Own the connector health dashboard
- Execute connector health checks (every 5 min per connector)

### Inputs
```yaml
inputs:
  - connector_failure_alert:
      from: any connector circuit breaker
      fields: [connector_name, failure_type, error_message, timestamp]
  - health_probe_trigger:
      from: scheduled cron or any agent
      fields: [connector_name, check_type]
  - credential_rotation_reminder:
      from: Vault rotation schedule
      fields: [secret_path, rotation_due_date, connector_name]
  - integration_metric_publish:
      from: observability layer
      fields: [metric_name, value, tags]
```

### Outputs
```yaml
outputs:
  - circuit_breaker_alert:
      format: incident notification
      destination: incident-manager-agent (P1), human operator (P0)
  - connector_health_report:
      format: YAML health summary (all connectors)
      destination: Datadog (ai_os.integration.health metric)
  - credential_rotation_action:
      format: Vault rotation command
      destination: vault://integrations/{system}/credentials
  - degraded_mode_activation:
      format: system state change notification
      destination: relevant consuming agents + human operator
```

### Connector Health Matrix
```yaml
health_check_schedule:
  frequency: every 5 minutes
  connectors:
    - jira, confluence, github, gitlab, slack, teams
    - gmail, outlook, sharepoint, google-workspace, office365
    - datadog, pagerduty, kubernetes, jenkins, argocd
    - snowflake, databricks, salesforce, servicenow
    - tableau, powerbi, looker
    - sap, workday
    - figma, gamma, neo4j (planned), vector-dbs (planned)
  alert_on_failure: enterprise-systems-agent self-alert + incident-manager-agent
```

### Persistent State
```yaml
state:
  connector_registry: integrations/MASTER-INTEGRATION-REGISTRY.md
  circuit_breaker_state: memory/connectors/circuit-breakers.json
  credential_rotation_log: memory/events/credential-rotation.jsonl
  health_check_log: memory/events/integration-health.jsonl
  degraded_mode_queue: memory/events/{system}-queue.jsonl (per connector)
```

---

## 4. connector-builder-agent

### Responsibilities
- Implement new connector specifications designed by connector-architecture-agent
- Write the 12-section connector spec markdown files
- Build authentication helpers and connection wrappers
- Write and run smoke tests for new connectors
- Maintain connector code in `integrations/lib/` (if code generation needed)
- Document activation prerequisites in the connector spec
- Hand off completed connectors for connector-architecture-agent review

### Inputs
```yaml
inputs:
  - connector_build_request:
      from: connector-architecture-agent (approved spec)
      fields: [system_name, spec_outline, auth_method, data_classification, gap_reference]
  - connector_update_request:
      from: enterprise-systems-agent or human operator
      fields: [connector_path, change_description, reason]
  - activation_request:
      from: human operator (H-015 approval received)
      fields: [connector_name, activation_checklist, credentials_ready]
```

### Outputs
```yaml
outputs:
  - connector_spec_file:
      format: 12-section markdown connector spec
      destination: integrations/{category}/{system}.md
  - connector_test_report:
      format: smoke test results YAML
      destination: connector-architecture-agent (review)
  - activation_confirmation:
      format: activation record
      destination: integrations/MASTER-INTEGRATION-REGISTRY.md (status: active)
  - connector_update_log:
      format: change entry
      destination: memory/events/connector-changes.jsonl
```

### Build Protocol
```yaml
build_protocol:
  step_1: receive approved spec from connector-architecture-agent
  step_2: write 12-section markdown file following gold standard format
  step_3: write smoke test (verify each of 12 sections has required content)
  step_4: test against sandbox/dev endpoint if available
  step_5: submit to connector-architecture-agent for review
  step_6: on approval, update MASTER-INTEGRATION-REGISTRY.md
  step_7: on H-015 approval, update status from planned to active
```

### Quality Gates
- Every connector spec must include all 12 sections
- Auth method must reference Vault secret path
- Circuit breaker config required in runtime section
- Degraded mode queue path specified
- Audit log path specified at `memory/events/{system}-audit.jsonl`
- Data classification explicitly stated

---

## 5. tool-capability-agent

### Responsibilities
- Maintain the master catalog of all tools available per connector
- Map connector tools to OS agent needs (which agent uses which tool)
- Verify tool parameter schemas against connector API documentation
- Publish the tool catalog to `integrations/INTEGRATION-FABRIC-README.md`
- Identify tools that are documented but not yet implemented (planned)
- Monitor tool version changes when connector APIs update

### Inputs
```yaml
inputs:
  - tool_catalog_query:
      from: any agent
      fields: [capability_needed, connector_preference, auth_constraint]
  - connector_api_update:
      from: enterprise-systems-agent or connector-builder-agent
      fields: [connector_name, api_version_change, tools_affected]
  - tool_verification_request:
      from: mcp-integration-agent
      fields: [tool_name, parameters, expected_output]
```

### Outputs
```yaml
outputs:
  - tool_catalog_entry:
      format: YAML tool definition
      destination: integrations/INTEGRATION-FABRIC-README.md (Tools section)
  - tool_routing_recommendation:
      format: tool_name + connector + parameters
      destination: requesting agent
  - tool_deprecation_notice:
      format: notification with replacement tool
      destination: all agents using deprecated tool
```

### Tool Catalog Structure
```yaml
tool_catalog_schema:
  tool_name: string (snake_case)
  connector: string (connector system name)
  mcp_server: string | null
  method: HTTP_METHOD + endpoint | RFC_function | Cypher
  auth_required: yes | no | conditional
  gate_required: H-NNN | none
  input_schema:
    required: [field_name: type]
    optional: [field_name: type]
  output_schema:
    success: [field_name: type]
    error: [error_code: string]
  rate_limit: requests/min or requests/day
  timeout: seconds
  idempotent: yes | no
  status: active | planned | deprecated
```

---

## 6. tool-gap-detection-agent

### Responsibilities
- Continuously monitor the delta between OS agent capability needs and available tools
- Maintain the CAPABILITY-GAP-TRACKER.md with all identified gaps
- Classify gaps by severity (CRITICAL/HIGH/MEDIUM/LOW) and type (connector missing, tool missing, auth missing)
- Trigger capability-expansion-agent when CRITICAL gaps are detected
- Report gap status in weekly analytics digest
- Track gap resolution over time

### Inputs
```yaml
inputs:
  - capability_request_failed:
      from: any agent whose tool call was rejected or failed
      fields: [agent_name, tool_needed, connector, failure_reason]
  - connector_spec_reviewed:
      from: connector-architecture-agent
      fields: [connector_name, gaps_identified]
  - gap_resolution_report:
      from: capability-expansion-agent
      fields: [gap_id, resolution_status, activation_date]
  - weekly_gap_audit_trigger:
      from: delivery-manager-agent (sprint cadence)
      fields: [audit_scope, date]
```

### Outputs
```yaml
outputs:
  - gap_registration:
      format: GAP-INT-NNN entry
      destination: integrations/CAPABILITY-GAP-TRACKER.md
  - gap_severity_alert:
      format: alert notification (CRITICAL gaps only)
      destination: capability-expansion-agent, enterprise-systems-agent, human operator
  - gap_resolution_update:
      format: updated GAP entry (status: resolved)
      destination: integrations/CAPABILITY-GAP-TRACKER.md
  - weekly_gap_report:
      format: summary table (open gaps by severity)
      destination: analytics-agent (for delivery digest)
```

### Gap Classification
```yaml
gap_classification:
  CRITICAL:
    definition: OS cannot complete a required workflow without this capability
    response: immediate escalation to capability-expansion-agent
    sla: begin resolution within 48h
  HIGH:
    definition: OS performs a suboptimal workaround affecting quality or performance
    response: add to next sprint backlog
    sla: resolve within 2 sprints
  MEDIUM:
    definition: Better capability exists but current workaround is acceptable
    response: backlog item, prioritize quarterly
    sla: resolve within quarter
  LOW:
    definition: Nice-to-have; no workflow impact
    response: backlog item, resolve opportunistically
    sla: no SLA
```

### Active Gaps
```yaml
active_gaps:
  GAP-INT-001: {system: neo4j, severity: HIGH, status: planned}
  GAP-INT-002: {system: vector-dbs, severity: HIGH, status: planned}
  GAP-INT-003: {system: sap, severity: MEDIUM, status: active-partial}
  GAP-INT-004: {system: looker-dashboard-write, severity: MEDIUM, status: vendor-blocked}
  GAP-INT-005: {system: gitlab, severity: MEDIUM, status: active-partial}
  GAP-INT-006: {system: databricks-write-path, severity: HIGH, status: active-partial}
  GAP-INT-007: {system: servicenow, severity: MEDIUM, status: active-partial}
```

---

## 7. capability-expansion-agent

### Responsibilities
- Drive resolution of identified capability gaps from tool-gap-detection-agent
- Evaluate build vs. buy vs. configure options for each gap
- Initiate H-015 (new system authorization) workflow for new connectors
- Coordinate connector-builder-agent to implement approved solutions
- Track gap resolution from identification to activation
- Manage vendor relationships for commercial integrations (Looker, SAP BTP, etc.)
- Publish gap resolution reports to executive-communications-agent for quarterly reporting

### Inputs
```yaml
inputs:
  - gap_escalation:
      from: tool-gap-detection-agent
      fields: [gap_id, severity, affected_workflows, workaround_status]
  - h015_approval:
      from: human operator
      fields: [gap_id, approved_solution, budget_approved, timeline]
  - vendor_proposal:
      from: risk-management-agent (vendor evaluation)
      fields: [gap_id, vendor_name, solution_description, cost, timeline]
  - resolution_verification:
      from: connector-architecture-agent
      fields: [gap_id, connector_activated, smoke_test_passed]
```

### Outputs
```yaml
outputs:
  - gap_resolution_plan:
      format: solution brief (build/buy/configure + timeline + H-015 request)
      destination: human operator (for H-015 decision)
  - h015_request:
      format: new system authorization request
      destination: governance-org (human-approval-governance-agent)
  - gap_status_update:
      format: updated GAP entry
      destination: integrations/CAPABILITY-GAP-TRACKER.md
  - quarterly_gap_resolution_report:
      format: executive summary (gaps opened, closed, in-progress)
      destination: executive-communications-agent
```

### Resolution Workflow
1. **Receive Gap Escalation**: Classify urgency → select resolution approach (build/buy/configure)
2. **Build Option**: Engage connector-builder-agent → connector-architecture-agent review → H-015 request
3. **Buy Option**: Engage risk-management-agent for vendor evaluation → procurement workflow
4. **Configure Option**: Modify existing connector or enable existing capability → connector-builder-agent update
5. **H-015 Gate**: Submit H-015 request → await human approval → proceed on approval
6. **Activation**: Coordinate connector-builder-agent → enterprise-systems-agent smoke test → mark gap resolved

### Persistent State
```yaml
state:
  gap_tracker: integrations/CAPABILITY-GAP-TRACKER.md
  resolution_log: memory/events/gap-resolution.jsonl
  h015_requests: memory/governance/h015-requests.jsonl
```

---

## Organization Workflows

### Workflow 1: New Connector Registration
```yaml
trigger: Human operator requests new integration (H-015 prerequisite)
steps:
  1. connector-architecture-agent: assess integration need, design spec
  2. security-architect-agent: review data classification, auth pattern
  3. connector-builder-agent: implement 12-section connector spec
  4. connector-architecture-agent: review and approve spec
  5. H-015 gate: human operator authorizes new system
  6. enterprise-systems-agent: configure health checks and circuit breakers
  7. connector-builder-agent: run smoke tests
  8. enterprise-systems-agent: activate connector (status: active)
  9. tool-capability-agent: update tool catalog
  10. mcp-integration-agent: register if MCP server available
output: Active connector in MASTER-INTEGRATION-REGISTRY.md
```

### Workflow 2: Connector Health Monitoring
```yaml
trigger: every 5 minutes (scheduled)
steps:
  1. enterprise-systems-agent: execute health check for all active connectors
  2. enterprise-systems-agent: update circuit breaker state
  3. IF failure_count >= threshold:
      enterprise-systems-agent: open circuit breaker
      enterprise-systems-agent: activate degraded mode queue
      enterprise-systems-agent: alert incident-manager-agent
  4. enterprise-systems-agent: publish health metrics to Datadog
output: health-check-log entry + Datadog metric
```

### Workflow 3: Capability Gap Resolution
```yaml
trigger: tool-gap-detection-agent escalates CRITICAL or HIGH gap
steps:
  1. capability-expansion-agent: assess build/buy/configure options
  2. capability-expansion-agent: prepare H-015 request (if new system needed)
  3. human-approval-governance-agent: H-015 review and approval
  4. connector-builder-agent: implement solution
  5. connector-architecture-agent: review
  6. enterprise-systems-agent: activate and monitor
  7. tool-gap-detection-agent: mark gap resolved in CAPABILITY-GAP-TRACKER.md
output: Gap closed; connector activated; CAPABILITY-GAP-TRACKER.md updated
```

### Workflow 4: MCP Session Management
```yaml
trigger: Agent requests MCP tool or MCP session initialization
steps:
  1. mcp-integration-agent: check MCP server catalog for tool
  2. mcp-integration-agent: verify authentication status
  3. IF auth_expired: guide OAuth refresh flow
  4. mcp-integration-agent: route tool call to correct MCP server
  5. mcp-integration-agent: return result to requesting agent
  6. mcp-integration-agent: log to mcp-audit.jsonl
output: Tool result delivered to requesting agent
```

---

## Connector Registry Summary

| Status | Count | Systems |
|--------|-------|---------|
| Active | 25 | jira, confluence, github, gitlab, slack, teams, gmail, outlook, docx, pptx, xlsx, pdf, figma, gamma, servicenow, snowflake, databricks, salesforce, pagerduty, datadog, sharepoint, google-workspace, office365, kubernetes, jenkins, argocd, tableau, powerbi, looker, sap, workday |
| Planned | 2 | neo4j (GAP-INT-001), vector-dbs (GAP-INT-002) |
| Active-Partial | 5 | sap (GAP-INT-003), looker (GAP-INT-004), gitlab (GAP-INT-005), databricks (GAP-INT-006), servicenow (GAP-INT-007) |

---

## Governance

```yaml
governance:
  connector_approval_gate: H-015 (all new external system authorizations)
  data_classification_review: security-architect-agent (all CONFIDENTIAL+ connectors)
  credential_management: Vault (all secrets; 90-day rotation default)
  audit_trail: every connector operation logged to memory/events/{system}-audit.jsonl
  quarterly_review: enterprise-systems-agent reviews all connector health + credential rotation status
  prohibited_patterns:
    - hardcoded credentials in connector specs
    - connectors without circuit breakers
    - connectors without degraded mode fallback
    - RESTRICTED data connectors without H-009 + security review
```

---

## Dependencies

| Depends On | Reason |
|-----------|--------|
| security-architect-agent | Auth pattern review for all CONFIDENTIAL+ connectors |
| compliance-documentation-agent | Data handling review for PII connectors |
| governance-org agents | H-015 approval workflow |
| incident-manager-agent | Connector failure escalation |
| analytics-agent | Integration health metrics publishing |
| artifact-publishing-agent | Publishing connector specs to SharePoint |
