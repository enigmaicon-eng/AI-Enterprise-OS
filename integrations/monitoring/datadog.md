---
integration: Datadog
category: monitoring
status: active
mcp-available: partial
connector-agent: enterprise-systems-agent
source-of-truth: operational metrics, infrastructure health, APM traces, DORA metrics
data-classification: INTERNAL
created: 2026-05-10
---

# Datadog Integration

> Datadog is the primary observability platform. The OS reads operational metrics, infrastructure health, APM traces, and DORA delivery metrics from Datadog, and publishes AI OS agent performance metrics, workflow execution metrics, and integration health metrics back to Datadog dashboards. Datadog is the authoritative source for infrastructure and operational data. The OS uses Datadog as the collection point for all operational intelligence.

---

## 1. Ingestion Workflows

**What flows from Datadog → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| DORA metrics (deployment frequency, lead time, CFR, MTTR) | Daily batch query | analytics-agent | Daily |
| Infrastructure health (host UP/DOWN, CPU/memory) | Webhook monitor alert | runtime-coordination-agent | Real-time |
| APM p95/p99 latency summary | On-demand API query | engineer-agent | On-demand |
| Monitor alert triggered | Webhook: monitor alert | incident-manager-agent | Real-time |
| Cost anomaly detected | Webhook: cost monitor | vp-engineering-agent | Real-time |
| Log anomaly pattern | Webhook: log monitor | security-architect-agent | Real-time |
| SLO breach warning | Webhook: SLO alert | delivery-manager-agent | Real-time |
| Synthetic test failure | Webhook: synthetic alert | qa-agent | Real-time |

**Ingestion Protocol:**
```yaml
datadog_ingestion:
  trigger: webhook (Datadog monitor alerts → OS endpoint) + scheduled API poll
  auth:
    webhook: HMAC-SHA256 signature validation (Datadog webhook secret)
    api_poll: DD-API-KEY + DD-APPLICATION-KEY headers
  payload_format: Datadog webhook v2 event payload
  transformations:
    - map Datadog monitor status → OS alert severity
    - extract metric name + value → OS metrics store
    - classify alert type → OS routing (infra→runtime, security→security-architect)
    - DORA metric computation: deployment_frequency = deploys/day from deployment events
  destination: event-bus topic `integration.datadog.alert`
  error_handling: dead-letter queue + retry x3 + alert enterprise-systems-agent
  deduplication: monitor_id + alert_timestamp hash
```

---

## 2. Publishing Workflows

**What flows from OS → Datadog:**

| OS Artifact | Datadog Destination | Publishing Agent | Trigger |
|-------------|--------------------|-----------------|---------| 
| Agent execution metrics | Custom metric: `ai_os.agent.execution_time_ms` | observability layer | Per agent invocation |
| Workflow success/failure rate | Custom metric: `ai_os.workflow.success_rate` | observability layer | Per workflow completion |
| Integration health status | Custom metric: `ai_os.integration.health` | enterprise-systems-agent | Every 5 min |
| Sprint delivery metrics | Custom dashboard update | analytics-agent | Per sprint |
| Governance gate metrics | Custom metric: `ai_os.governance.gate_pass_rate` | governance-org agents | Per gate event |
| AI eval score | Custom metric: `ai_os.eval.score` | agent-evaluation-agent | Per eval run |
| Deployment event | Datadog deployment tracking event | release-governance-agent | Per deployment |

**Publishing Protocol:**
```yaml
datadog_publish:
  method: Datadog REST API v1/v2 + StatsD (for high-frequency metrics)
  auth: DD-API-KEY + DD-APPLICATION-KEY in request headers
  endpoints:
    submit_metrics: POST https://api.datadoghq.com/api/v2/series
    create_event: POST https://api.datadoghq.com/api/v1/events
    update_dashboard: PUT https://api.datadoghq.com/api/v1/dashboard/{id}
    create_monitor: POST https://api.datadoghq.com/api/v1/monitor
  rate_limit: 500 metrics/request, 300,000 data points/hour
  idempotency: metric series are idempotent by timestamp; events use aggregation_key
  secret_path: vault://integrations/datadog/api-keys
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Datadog | Datadog-to-OS | Conflict Resolution |
|-------|--------------|---------------|---------------------|
| Monitor state | OS creates monitors via API | Datadog alert → OS incident | Datadog wins (monitor truth) |
| Dashboard config | OS publishes dashboard spec | Dashboard usage stats → OS | OS owns specs; Datadog owns runtime state |
| Metric values | OS publishes AI OS metrics | Infra metrics → OS | Each system owns its own metrics |
| SLO definitions | OS writes SLO specs | SLO burn rate → OS | OS owns definitions; Datadog owns burn rate |
| Tags/labels | OS applies standard tags on publish | Tag-based routing → OS | OS tag schema is authoritative |

**Sync frequency:** Real-time webhooks for monitor alerts; 1-minute push for high-frequency AI OS metrics; daily batch for DORA computations.

**Source-of-truth designator:** Datadog is authoritative for infrastructure and operational metrics. OS is authoritative for AI agent performance and workflow metrics (pushed to Datadog for unified visibility).

---

## 4. Permissions

```yaml
datadog_permissions:
  auth_method: API Key (read/write) + Application Key (write operations)
  service_account: ai-os-datadog-sa
  api_key_scopes: metrics:write, events:write, logs:read (read only)
  app_key_scopes:
    - monitors:read
    - monitors:write
    - dashboards:read
    - dashboards:write
    - synthetics:read
    - slos:read
    - slos:write
  blocked_scopes:
    - monitors:mute  # Requires H-012
    - logs:delete
    - metrics:delete
  secret_path: vault://integrations/datadog/api-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Datadog Permission | Operations |
|-------|-------------------|------------|
| enterprise-systems-agent | Full read + metric write | Publish metrics, read monitors, manage dashboards |
| analytics-agent | Read + metric write | Read DORA metrics, publish product metrics |
| incident-manager-agent | Read monitors | Read active alerts, incident context |
| security-architect-agent | Read logs | Read security log anomalies |
| dashboard-generation-agent | Dashboard read/write | Create/update dashboards |
| All others | Read-only (metrics) | Query metrics for context |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read metrics/dashboards | None (agent autonomous) | — |
| Publish custom metric | None (agent autonomous) | — |
| Create monitor | None (internal, agent autonomous) | — |
| Modify existing production monitor | human-approval-governance-agent | H-018 |
| Silence/mute monitor | human-approval-governance-agent | H-012 |
| Delete monitor | Human operator | H-021 |
| Share dashboard externally | H-014 (external) or H-016 (executive) | — |
| Bulk metric delete | Human operator | H-021 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: REST API (HTTPS) + custom MCP wrapper
  mcp_server: datadog-mcp-wrapper (custom connector)
  tools_available:
    - datadog_query_metrics
    - datadog_get_dashboard
    - datadog_list_monitors
    - datadog_get_monitor_status
    - datadog_create_event
    - datadog_post_metric
    - datadog_get_logs
    - datadog_get_slo_status
    - datadog_query_apm
  connection_pool: 5 connections max
  timeout: 15s per API call
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries, jitter ±1s
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: local metric buffer; flush when reconnects
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| API rate limit | 429 response | Queue requests, wait rate window (1 min) | Resume after backoff |
| API timeout | Response > 15s | Retry x3 with backoff | Alert enterprise-systems-agent if persistent |
| Auth failure | 403 response | Halt publishes + alert mcp-integration-agent | Credential rotation + H-009 |
| Metric ingestion rejection | 400 response | Log rejected payload, fix format, retry | Alert observability layer |
| Dashboard sync failure | Diff detected | Re-apply dashboard spec | Dashboard-generation-agent re-publishes |
| Datadog outage | Health check failure | Buffer metrics locally (60 min buffer) | Flush buffer on reconnection |

**Degraded mode:** If Datadog unavailable > 10 min, OS metrics are buffered in `memory/events/datadog-metric-buffer.jsonl` (rolling 60-minute buffer, ~50MB cap). Alert enterprise-systems-agent. Dashboard snapshots served from last cached state. Incident alerting fails over to PagerDuty (via PagerDuty connector) and Push Notification.

---

## 8. Observability

```yaml
observability:
  metrics:
    - datadog_api_success_rate:          target: "> 99%"
    - datadog_metric_publish_p95_latency: target: "< 3s"
    - datadog_webhook_delivery_rate:     target: "> 99.5%"
    - datadog_metric_buffer_size:        target: "< 10MB (alert at 40MB)"
    - datadog_circuit_breaker_trips:     target: "0 per week"
    - datadog_dashboard_sync_lag:        target: "< 15 min"
  alerts:
    - condition: "api_success_rate < 98%"
      severity: HIGH
      notify: [enterprise-systems-agent]
    - condition: "circuit_breaker = OPEN"
      severity: CRITICAL
      notify: [incident-manager-agent, enterprise-systems-agent]
    - condition: "metric_buffer_size > 40MB"
      severity: HIGH
      notify: [enterprise-systems-agent]
      action: alert_data_loss_risk
  health_check:
    endpoint: GET https://api.datadoghq.com/api/v1/validate
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Published metric (wrong value) | Publish corrected value at same timestamp | observability layer | 1 hour (metric immutability varies) |
| Created monitor (misconfigured) | PUT /monitor/{id} (restore config from audit log) | enterprise-systems-agent | Anytime |
| Updated dashboard (broke layout) | PUT /dashboard/{id} (restore from spec in observability/dashboards.md) | dashboard-generation-agent | Anytime |
| Created event (incorrect) | Events are append-only — publish correction event | enterprise-systems-agent | N/A |

**Rollback guarantee:** Dashboard and monitor configurations are version-controlled in `observability/dashboards.md`. Any dashboard can be restored from spec within 5 minutes. Metric data cannot be deleted but can be corrected via new data points.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Engineers | Raw metric graphs | Full technical detail: all metrics, percentiles, log correlation |
| Engineering managers | DORA dashboard | Delivery metrics focus: deployment frequency, lead time, change failure rate |
| Executives | Delivery scorecard | KPI summary: sprint velocity, system uptime, incident count, SLO status |
| QA team | Synthetic test results | Test coverage, failure rates, affected flows |
| Finance | Cost anomaly report | Spend delta, projected overage, cost-per-deployment |

audience-transformation-agent generates EXEC-profile summaries from Datadog data on sprint cadence. Raw dashboards are TECHNICAL — not shared with non-technical stakeholders without transformation.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  pii_handling: >
    Datadog may contain IP addresses and user-agent strings in logs (pseudonymous PII).
    Agent names and workflow IDs are not PII.
    Log data must not be sent outside the organization without H-023 approval.
  retention_policy:
    metrics: 15 months (Datadog default)
    logs: 15 days (cost-optimize; archive critical security logs to S3 for 1 year)
    traces: 15 days
    audit_trail: 1 year minimum
  access_review: quarterly (Datadog team membership and API key holders)
  data_residency: Datadog US region (confirm with constitution ratification H-003 check)
  compliance_requirements:
    - SOC_2_Type_II: operational metrics and alerting records as evidence
    - ISO_27001: access logs, monitor configuration records
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every API write operation (metric publish, monitor create/update, dashboard update)
    - Every webhook event received (monitor_id, alert_type, processing result)
    - Every circuit breaker state change
    - Every metric buffer activation (degraded mode)
    - Every authentication event (API key use, rotation)
    - Every monitor mute/silence (H-012 gate events)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/datadog-audit.jsonl
  retention: 1 year minimum
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: HTTP method + endpoint path
    resource: metric_name | monitor_id | dashboard_id
    payload_hash: SHA-256 of request payload
    result: success | failure | partial
    correlation_id: OS workflow execution ID
```
