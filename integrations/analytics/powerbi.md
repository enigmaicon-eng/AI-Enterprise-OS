---
integration: Power BI
category: analytics
status: active
mcp-available: partial
connector-agent: analytics-agent
source-of-truth: Microsoft ecosystem BI dashboards, executive reports, embedded analytics
data-classification: INTERNAL
created: 2026-05-10
---

# Power BI Integration

> Power BI is the Microsoft-ecosystem business intelligence platform. The OS publishes analytics reports and dashboards to Power BI workspaces via the Power BI REST API, refreshes datasets, and embeds dashboards in executive communications. Power BI integrates natively with Office 365 and Teams, making it the preferred BI platform for Microsoft-ecosystem organizations. All executive-facing Power BI reports require H-016 review before publication.

---

## 1. Ingestion Workflows

**What flows from Power BI → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Dataset refresh status | REST API poll | analytics-agent | Every 30 min |
| Report view counts | REST API (usage metrics) | analytics-agent | Weekly |
| Dataset refresh failure alert | Webhook (Power Automate) or API poll | analytics-agent | Real-time |
| Embedded report token expiry | Token issuance timestamp tracking | analytics-agent | Per embed |
| Workspace capacity usage | REST API query | enterprise-systems-agent | Daily |
| Report publish confirmation | REST API response | analytics-agent | On publish |

**Ingestion Protocol:**
```yaml
powerbi_ingestion:
  trigger: scheduled REST API poll + Power Automate webhook (if configured)
  auth: Azure AD OAuth 2.0 (service principal) via MSAL
  api_base: https://api.powerbi.com/v1.0/myorg
  tenant_id: Azure AD tenant ID
  operations:
    get_refresh_history: GET /groups/{workspaceId}/datasets/{datasetId}/refreshes
    get_report_usage: GET /groups/{workspaceId}/reports/{reportId}/usageMetrics
    get_capacity: GET /capacities
  transformations:
    - map refresh status (Completed/Failed) → OS pipeline health signal
    - extract view count → OS dashboard adoption metric
    - classify report by workspace → OS analytics category
  destination: event-bus topic `integration.powerbi.analytics`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → Power BI:**

| OS Artifact | Power BI Destination | Publishing Agent | Trigger | Gate |
|-------------|---------------------|-----------------|---------|------|
| Sprint analytics report | AI-OS / Sprint Reports workspace | analytics-agent | Per sprint close | None |
| Executive scorecard | Executive workspace | analytics-agent | Weekly | H-016 |
| DORA metrics report | AI-OS / Delivery workspace | analytics-agent | Daily refresh | None |
| Financial metrics report | Executive / Finance workspace | analytics-agent | Quarterly | H-016 |
| Incident analytics report | AI-OS / Operations workspace | incident-manager-agent | Post-PIR | None |
| Dataset (push dataset) | Streaming dataset | analytics-agent | Real-time metrics push | None |

**Publishing Protocol:**
```yaml
powerbi_publish:
  auth: Azure AD OAuth 2.0 (service principal, client credentials) via MSAL
  client_library: MSAL (Microsoft Authentication Library)
  method: Power BI REST API v1.0
  operations:
    import_pbix: POST /groups/{workspaceId}/imports?datasetDisplayName={name} (multipart)
    push_dataset: POST /groups/{workspaceId}/datasets (streaming)
    push_rows: POST /groups/{workspaceId}/datasets/{id}/tables/{table}/rows
    refresh_dataset: POST /groups/{workspaceId}/datasets/{id}/refreshes
    delete_report: DELETE /groups/{workspaceId}/reports/{id}
    generate_embed_token: POST /groups/{workspaceId}/reports/{id}/GenerateToken
  workspace_structure:
    AI-OS: sprint, delivery, agent performance reports
    Executive: scorecards, financial, board materials
    Operations: incident analytics, SLO tracking
    Sandbox: development reports
  rls_configuration:
    user_attributes: department, role, region
    row_level_security: applied per report based on classification
  secret_path: vault://integrations/powerbi/service-principal-credentials
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-PowerBI | PowerBI-to-OS | Conflict Resolution |
|-------|--------------|--------------|---------------------|
| Report content | OS imports PBIX | Not synced back | OS generates; Power BI renders |
| Dataset rows (push) | OS pushes rows to streaming dataset | Not synced back | OS is source of data |
| Refresh status | OS triggers refresh | Refresh result → OS pipeline health | Power BI wins (refresh execution) |
| Report usage | Not written by OS | View counts → OS adoption metrics | Power BI wins |

**Sync frequency:** On-demand PBIX import on sprint/report completion. Real-time push for streaming datasets. Daily dataset refresh trigger. Weekly usage metrics poll.

**Source-of-truth designator:** OS is the source of truth for report content and data pipelines. Power BI is the source of truth for rendered reports and usage analytics.

---

## 4. Permissions

```yaml
powerbi_permissions:
  auth_method: Azure AD Service Principal (client credentials)
  service_principal: ai-os-powerbi-sp@tenant.onmicrosoft.com
  app_registration_permissions:
    - Dataset.ReadWrite.All
    - Report.ReadWrite.All
    - Workspace.ReadWrite.All
    - Capacity.Read.All
  blocked_permissions:
    - Tenant.ReadWrite.All (admin operations)
    - Dashboard.ReadWrite.All (dashboards managed manually)
  workspace_access:
    AI-OS workspace: Contributor (read + publish)
    Executive workspace: Contributor (H-016 gated)
    Operations workspace: Contributor
    Sandbox: Contributor
  rls_enforcement: all reports with CONFIDENTIAL data require RLS configuration
  secret_path: vault://integrations/powerbi/service-principal-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Power BI Permission | Operations |
|-------|---------------------|------------|
| analytics-agent | Contributor (all workspaces) | Import reports, push data, refresh datasets |
| incident-manager-agent | Contributor (Operations) | Publish incident analytics |
| delivery-manager-agent | Reader (AI-OS) | Read delivery dashboards |
| dashboard-generation-agent | Contributor (all) | Create and manage all reports |
| executive-communications-agent | Reader (Executive) | Read executive reports for comms |
| All others | Reader (AI-OS, Operations) | Read-only |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read reports / datasets | None (agent autonomous) | — |
| Publish to AI-OS / Operations workspace | None (agent autonomous) | — |
| Publish to Executive workspace | Human operator | H-016 |
| Generate embed token (internal) | None (agent autonomous) | — |
| Generate embed token (external) | Human operator | H-014 |
| Delete report | Human operator | H-021 |
| Create new workspace | Human operator | H-009 |
| Share report externally | Human operator | H-014 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Power BI REST API (HTTPS) via MSAL auth
  mcp_server: none (direct MSAL + HTTP client)
  tools_available:
    - powerbi_import_pbix
    - powerbi_push_dataset_rows
    - powerbi_refresh_dataset
    - powerbi_get_refresh_status
    - powerbi_list_reports
    - powerbi_delete_report
    - powerbi_generate_embed_token
    - powerbi_get_usage_metrics
  connection_pool: 3 connections max
  timeout: 60s (PBIX import: 120s)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: queue imports; alert analytics-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Auth token expired | 401 response | Re-authenticate via MSAL | Automated token refresh via MSAL |
| PBIX import failure | 4xx/5xx on import | Retry x3; check file format | analytics-agent validates PBIX before retry |
| Dataset refresh failure | Status = Failed in refresh history | Alert analytics-agent with error details | Investigate data source connection |
| Streaming dataset quota | 429 / quota exceeded | Batch push rows; reduce frequency | Reduce push frequency or upgrade capacity |
| Power BI service outage | Health check failure | Queue all operations | Flush queue on recovery |
| RLS configuration error | Report returns unauthorized | Alert analytics-agent | Human reviews RLS configuration |

**Degraded mode:** If Power BI unavailable > 15 min, all PBIX imports queued in `memory/events/powerbi-publish-queue.jsonl`. Dataset push rows buffered in `memory/events/powerbi-stream-buffer.jsonl`. Queue flushed on recovery.

---

## 8. Observability

```yaml
observability:
  metrics:
    - powerbi_import_success_rate:        target: "> 99%"
    - powerbi_dataset_refresh_success:    target: "> 98%"
    - powerbi_api_success_rate:           target: "> 99%"
    - powerbi_embed_token_generation:     target: "> 99.9%"
    - powerbi_circuit_breaker_trips:      target: "0 per week"
  alerts:
    - condition: "dataset_refresh_failure_count > 2 in 24h"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
    - condition: "import_success_rate < 98%"
      severity: HIGH
      notify: [analytics-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
  health_check:
    endpoint: GET https://api.powerbi.com/v1.0/myorg/groups
    frequency: every 5 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Published wrong report | Delete + reimport correct PBIX | analytics-agent | Anytime |
| Wrong data pushed to streaming dataset | Clear table rows; push correct data | analytics-agent | Anytime |
| Executive report error (H-016) | Delete + reimport with H-016 re-approval | analytics-agent + human | Immediate |
| Refresh schedule misconfigured | Update refresh schedule via API | analytics-agent | Anytime |

**Rollback guarantee:** OS maintains PBIX content hash log. Previous report versions retrievable from OS artifact store. All publish events logged to `memory/events/powerbi-audit.jsonl` enabling reconstruction.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Executives | Scorecard report | Single-page KPI view; traffic-light status; trend arrows |
| Engineering managers | DORA report | Delivery metrics; deployment frequency; lead time |
| Finance | Financial metrics | Cost variance; forecast vs actual; per-service cost |
| Operations | Incident report | MTTR trend; P0/P1 count; resolution time distribution |
| Product managers | Product analytics | Feature adoption; user journey; conversion funnel |

audience-transformation-agent reviews all Executive workspace imports for appropriate KPI framing before H-016 approval submission.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL (AI-OS/Operations) / CONFIDENTIAL (Executive)
  pii_handling: >
    Power BI reports may include aggregated employee or user data.
    Raw PII not displayed — aggregation required before visualization.
    RLS configured on all reports containing per-user or per-department data.
    External access subject to H-014 approval.
  retention_policy:
    report_audit_log: 1 year
    publish_queue: 7 days
    stream_buffer: 24 hours (auto-purge)
  access_review: quarterly (service principal permissions, workspace membership)
  data_residency: Azure tenant region (same as Office 365 — confirm H-003)
  compliance_requirements:
    - SOC_2_Type_II: report audit log, dataset refresh records
    - ISO_27001: access control for sensitive workspaces
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every PBIX import (report_name, workspace, agent, H-NNN ref, content_hash, timestamp)
    - Every dataset refresh trigger (dataset_id, agent, result)
    - Every embed token generation (report_id, requester, scope)
    - Every report delete (report_id, agent, reason, H-NNN ref)
    - Every external share (report_id, recipient domain hash, H-014 ref)
    - Every circuit breaker state change
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/powerbi-audit.jsonl
  retention: 1 year
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: import | refresh | delete | share | embed_token
    report_id: Power BI report GUID
    workspace_id: Power BI workspace GUID
    gate_reference: H-016 | H-014 | none
    result: success | failure | queued
    correlation_id: OS workflow execution ID
```
