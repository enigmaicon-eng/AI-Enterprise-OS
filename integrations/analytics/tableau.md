---
integration: Tableau
category: analytics
status: active
mcp-available: partial
connector-agent: analytics-agent
source-of-truth: business intelligence dashboards, self-service analytics, data visualization
data-classification: INTERNAL
created: 2026-05-10
---

# Tableau Integration

> Tableau is the primary business intelligence and data visualization platform. The OS publishes analytics artifacts, sprint dashboards, and executive scorecards to Tableau workbooks, and reads dashboard utilization data and extract refresh status from the Tableau REST API. Tableau is the authoritative platform for self-service analytics consumed by non-technical stakeholders. All executive-facing Tableau dashboards require audience-transformation-agent review before publication.

---

## 1. Ingestion Workflows

**What flows from Tableau → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Dashboard view counts | REST API poll | analytics-agent | Weekly |
| Extract refresh status (success/fail) | REST API poll | analytics-agent | Every 30 min |
| Failed extract alert | Webhook (if configured) | analytics-agent | Real-time |
| Workbook publish confirmation | REST API response | analytics-agent | On publish |
| Data source connection health | REST API query | enterprise-systems-agent | Daily |
| User adoption metrics | REST API (views/users) | analytics-agent | Weekly |

**Ingestion Protocol:**
```yaml
tableau_ingestion:
  trigger: scheduled REST API poll + webhook (if Tableau Server webhooks configured)
  auth: Personal Access Token (PAT) via POST /auth/signin
  api_version: REST API 3.20 (Tableau Server 2023.3+)
  site_content_url: ai-os (Tableau site)
  operations:
    list_workbooks: GET /sites/{siteId}/workbooks
    get_extract_status: GET /sites/{siteId}/tasks/extractRefreshes
    get_view_stats: GET /sites/{siteId}/views/{viewId}/statistics
  transformations:
    - map extract refresh status → OS data pipeline health signal
    - extract view count → OS dashboard adoption metric
    - classify workbook by project → OS analytics category
  destination: event-bus topic `integration.tableau.analytics`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → Tableau:**

| OS Artifact | Tableau Destination | Publishing Agent | Trigger |
|-------------|--------------------|-----------------|---------| 
| Sprint velocity dashboard | AI-OS Outputs / Sprint Dashboards | analytics-agent | Per sprint close |
| Executive scorecard workbook | Executive / AI-OS Scorecards | analytics-agent | Weekly |
| DORA metrics dashboard | Analytics / Delivery Metrics | analytics-agent | Daily update |
| Incident analytics workbook | Analytics / Incident Reports | incident-manager-agent | Post-PIR |
| Product analytics summary | Analytics / Product | analytics-agent | Monthly |
| Financial metrics workbook | Executive / Finance | analytics-agent | Quarterly |

**Publishing Protocol:**
```yaml
tableau_publish:
  auth: PAT (Personal Access Token) sign-in → X-Tableau-Auth token for subsequent calls
  method: Tableau REST API v3.20
  operations:
    publish_workbook: POST /sites/{siteId}/workbooks (multipart/form-data, TWBX or TWBX)
    update_datasource: PUT /sites/{siteId}/datasources/{id}
    refresh_extract: POST /sites/{siteId}/datasources/{id}/refreshes
    delete_workbook: DELETE /sites/{siteId}/workbooks/{id}
  project_structure:
    Analytics: DORA metrics, incident reports, product analytics
    AI-OS Outputs: sprint dashboards, velocity, agent metrics
    Delivery: sprint summaries, capacity dashboards
    Executive: scorecards, financial metrics, board materials
    Sandbox: development/experimental workbooks
    Archive: retired workbooks (read-only)
  data_classification_enforcement:
    Executive project: H-016 required before publish
    Analytics/Delivery: autonomous (agent self-approves)
  secret_path: vault://integrations/tableau/pat-credentials
  rotation: 90 days (PAT expiry enforced by Tableau Server)
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Tableau | Tableau-to-OS | Conflict Resolution |
|-------|--------------|--------------|---------------------|
| Workbook content | OS publishes TWBX | Not synced back | OS generates; Tableau renders |
| Data source | OS updates data source | Tableau extract refresh state → OS | Tableau wins (extract state) |
| Dashboard views | Not written by OS | View counts → OS adoption metrics | Tableau wins (usage analytics) |
| User permissions | OS sets on publish | Not synced back | OS controls at publish time |

**Sync frequency:** On-demand publishing triggered by sprint completion, PIR, or executive request. Daily extract refresh status poll. Weekly usage/adoption poll.

**Source-of-truth designator:** OS is the source of truth for analytics content and data pipelines. Tableau is the source of truth for rendered dashboards and user adoption metrics.

---

## 4. Permissions

```yaml
tableau_permissions:
  auth_method: Personal Access Token (PAT) — service account
  service_account: ai-os-tableau-sa
  tableau_role: Site Administrator Explorer (to publish/manage workbooks)
  project_permissions:
    Analytics: Publisher (read + publish)
    AI-OS Outputs: Publisher
    Delivery: Publisher
    Executive: Publisher (H-016 gated)
    Sandbox: Publisher
    Archive: Viewer (read-only)
  blocked_operations:
    - delete workbooks from Executive project without H-021
    - create new Tableau sites without H-009
    - grant external user access without H-014
    - export workbook data to external endpoint without H-023
  data_classification_mapping:
    Analytics: INTERNAL
    AI-OS Outputs: INTERNAL
    Delivery: INTERNAL
    Executive: CONFIDENTIAL
    Sandbox: INTERNAL
  secret_path: vault://integrations/tableau/service-account-pat
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Tableau Permission | Operations |
|-------|-------------------|------------|
| analytics-agent | Publisher (all projects) | Publish workbooks, refresh extracts, read usage |
| incident-manager-agent | Publisher (Analytics project) | Publish incident analytics |
| delivery-manager-agent | Publisher (Delivery project) | Publish sprint/capacity dashboards |
| dashboard-generation-agent | Publisher (all projects) | Create and manage all dashboards |
| executive-communications-agent | Reader (Executive) | Read executive dashboards for comms |
| All others | Viewer (Analytics, Delivery) | Read-only access to shared dashboards |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read workbooks / views | None (agent autonomous) | — |
| Publish to Analytics/Delivery/AI-OS Outputs | None (agent autonomous) | — |
| Publish to Executive project | Human operator review | H-016 |
| Refresh extract (scheduled) | None (agent autonomous) | — |
| Share dashboard externally | Human operator | H-014 |
| Delete workbook | Human operator | H-021 |
| Archive project | Human operator | H-024 |
| Create new project/site | Human operator | H-009 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Tableau REST API (HTTPS JSON/XML)
  mcp_server: none (direct HTTP client)
  tools_available:
    - tableau_publish_workbook
    - tableau_list_workbooks
    - tableau_get_extract_status
    - tableau_refresh_extract
    - tableau_delete_workbook
    - tableau_get_view_statistics
    - tableau_list_datasources
    - tableau_update_datasource
  connection_pool: 3 connections max
  timeout: 30s (publish: 120s for large workbooks)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: queue publications locally; alert analytics-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Auth token expired | 401 response | Re-authenticate with PAT; get new token | Automated re-auth; alert if PAT expired |
| Publish failure (large file) | 413 or timeout | Reduce workbook size; retry | analytics-agent optimizes workbook |
| Extract refresh failed | API poll: status = Failed | Alert analytics-agent with error detail | Human investigation of data source |
| Tableau Server outage | Health check failure | Queue publish operations | Flush queue on recovery; alert analytics-agent |
| Project not found | 404 response | Alert analytics-agent; check project structure | Human creates project or fix config |
| Rate limit | 429 response | Queue + wait 60s; exponential backoff | Resume after rate window |

**Degraded mode:** If Tableau unavailable > 15 min, all publish operations queued in `memory/events/tableau-publish-queue.jsonl`. Extract refresh alerts buffered. Dashboard-generation-agent notified. Queue flushed on recovery.

---

## 8. Observability

```yaml
observability:
  metrics:
    - tableau_publish_success_rate:       target: "> 99%"
    - tableau_publish_p95_latency:        target: "< 30s"
    - tableau_extract_refresh_success:    target: "> 98%"
    - tableau_api_success_rate:           target: "> 99%"
    - tableau_circuit_breaker_trips:      target: "0 per week"
    - tableau_dashboard_adoption:         target: "growing (weekly view count)"
  alerts:
    - condition: "extract_refresh_failure_rate > 2%"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
    - condition: "publish_success_rate < 98%"
      severity: HIGH
      notify: [analytics-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
  health_check:
    endpoint: GET /api/2.3/serverinfo
    frequency: every 5 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Published wrong workbook | Delete + republish correct version | analytics-agent | Anytime |
| Published to wrong project | Move workbook via API; notify stakeholders | analytics-agent | Anytime |
| Corrupt data source | Restore previous extract from backup | analytics-agent + human | Within 24h |
| Executive dashboard error (H-016) | Delete + republish with H-016 re-approval | analytics-agent + human | Immediate |

**Rollback guarantee:** Tableau Server maintains workbook revision history. OS keeps publish log with workbook content hash. Rollback by republishing previous version from OS artifact store.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Executives | Scorecard workbook | KPI summary view first; drill-down in appendix; branded colors |
| Engineering managers | DORA dashboard | Deployment frequency, lead time, change failure rate trend |
| Product managers | Product analytics | Feature adoption, user journey metrics, conversion |
| QA team | Quality dashboard | Test pass rate trend, coverage, flaky test count |
| Finance | Financial metrics | Cost per deployment, infrastructure cost trend |

audience-transformation-agent reviews all Executive project workbooks for appropriate framing and audience-fit before H-016 submission.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL (Analytics) / CONFIDENTIAL (Executive)
  pii_handling: >
    Tableau workbooks may aggregate data containing user counts, employee IDs.
    No raw PII displayed in OS-published dashboards.
    User-level data aggregated before visualization.
    External sharing subject to H-014 approval.
  retention_policy:
    workbook_audit_log: 1 year
    publish_queue: 7 days
    tableau_usage_stats: 90 days
  access_review: quarterly (PAT holders, project permissions)
  data_residency: Tableau Server location (on-prem or Tableau Cloud region — confirm H-003)
  compliance_requirements:
    - SOC_2_Type_II: dashboard audit log as evidence of analytics governance
    - ISO_27001: access control for sensitive dashboards
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every workbook publish (workbook_name, project, agent, H-NNN ref, content_hash, timestamp)
    - Every workbook delete (workbook_name, agent, reason, H-NNN ref)
    - Every extract refresh trigger (datasource_id, agent, result)
    - Every external share grant (workbook_id, recipient, H-014 ref)
    - Every circuit breaker state change
    - Every publish queue activation
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/tableau-audit.jsonl
  retention: 1 year
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: publish | delete | refresh | share | read
    workbook_id: Tableau workbook LUID
    project: target project name
    gate_reference: H-016 | H-014 | none
    result: success | failure | queued
    correlation_id: OS workflow execution ID
```
