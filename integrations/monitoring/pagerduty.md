---
integration: PagerDuty
category: monitoring
status: active
mcp-available: yes
connector-agent: enterprise-systems-agent
source-of-truth: incident alerting, on-call schedules, escalation policies
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# PagerDuty Integration

> PagerDuty is the primary incident alerting and on-call management system. The OS reads active incidents and on-call schedules from PagerDuty and publishes incident lifecycle events back to it. Real-time webhook delivery ensures incident-manager-agent is notified within seconds of any P0/P1 condition. PagerDuty is the authoritative record for who is on-call and what the current incident state is.

---

## 1. Ingestion Workflows

**What flows from PagerDuty → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Active P0/P1 incidents | Webhook: incident.triggered | incident-manager-agent | Real-time |
| Incident acknowledged | Webhook: incident.acknowledged | incident-manager-agent | Real-time |
| Incident resolved | Webhook: incident.resolved | incident-manager-agent + analytics-agent | Real-time |
| SLA breach warning | Webhook: incident.priority_updated | incident-manager-agent | Real-time |
| On-call schedule | REST API poll | delivery-manager-agent | Weekly |
| Escalation events (L1→L2) | Webhook: incident.escalated | vp-engineering-agent | Real-time |
| Alert suppression state | REST API poll | runtime-coordination-agent | Every 5 min |
| Resolved incident history | REST API GET /incidents | analytics-agent | Weekly batch |

**Ingestion Protocol:**
```yaml
pagerduty_ingestion:
  trigger: webhook (PagerDuty → OS webhook endpoint)
  auth: X-PagerDuty-Signature HMAC-SHA256 validation
  payload_format: PagerDuty v3 webhook payload
  transformations:
    - map PagerDuty incident fields → OS incident schema
    - classify priority (P1→P2 → OS severity tier)
    - extract affected service → OS affected-system map
    - extract assigned responder → OS on-call registry
  destination: event-bus topic `integration.pagerduty.incident`
  error_handling: dead-letter queue + retry x3 with exponential backoff + alert enterprise-systems-agent
  deduplication: incident_id hash check before processing
```

---

## 2. Publishing Workflows

**What flows from OS → PagerDuty:**

| OS Artifact | PagerDuty Destination | Publishing Agent | Trigger |
|-------------|----------------------|-----------------|---------|
| OS-detected P0/P1 condition | PagerDuty Event (Events API v2) | incident-manager-agent | Automated detection |
| Incident acknowledgment | PUT /incidents/{id} (status: acknowledged) | incident-manager-agent | Incident workflow step |
| Incident resolution | PUT /incidents/{id} (status: resolved) | incident-manager-agent | PIR completion gate |
| Maintenance window | POST /maintenance_windows | delivery-manager-agent | Planned release window |
| Incident note/update | POST /incidents/{id}/notes | incident-manager-agent | Stakeholder update |
| On-call override request | POST /schedules/{id}/overrides | H-007 required | Shift swap |

**Publishing Protocol:**
```yaml
pagerduty_publish:
  method: PagerDuty REST API v2 + Events API v2
  auth: API Key (header: Authorization: Token token=<key>)
  event_routing_key: vault://integrations/pagerduty/routing-key
  operations:
    trigger_incident: POST https://events.pagerduty.com/v2/enqueue
    update_incident: PUT https://api.pagerduty.com/incidents/{id}
    add_note: POST https://api.pagerduty.com/incidents/{id}/notes
    create_maintenance: POST https://api.pagerduty.com/maintenance_windows
    get_oncall: GET https://api.pagerduty.com/oncalls
  rate_limit: 960 requests/min (REST API); Events API: unlimited
  idempotency: dedup_key = OS workflow execution ID in Events API payload
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-PagerDuty | PagerDuty-to-OS | Conflict Resolution |
|-------|----------------|-----------------|---------------------|
| Incident status | OS resolves → PagerDuty resolved | PagerDuty resolved → OS closes incident | PagerDuty wins (human may resolve manually) |
| Incident severity | OS severity → PagerDuty priority | PagerDuty priority escalation → OS re-classify | PagerDuty wins |
| Acknowledgment | OS ack → PagerDuty ack | PagerDuty ack → OS marks responder assigned | PagerDuty wins |
| On-call assignments | Not written by OS | PagerDuty roster → OS on-call registry | PagerDuty always wins |
| Maintenance windows | OS publishes window → PagerDuty | PagerDuty window → suppress OS alerts | Bidirectional (H-007 required for OS writes) |

**Sync frequency:** Real-time via webhooks for incident state; 5-minute poll for alert suppression state; weekly poll for on-call schedule.

**Source-of-truth designator:** PagerDuty is authoritative for incident acknowledgment state and on-call roster. OS is authoritative for incident root-cause analysis and resolution criteria.

---

## 4. Permissions

```yaml
pagerduty_permissions:
  auth_method: API Key (REST API) + Integration Key/Routing Key (Events API)
  api_key_type: User API Key (full access) for REST; Integration Key for Events
  service_account: ai-os-pd-integration@company
  rest_api_scopes:
    - incidents:read
    - incidents:write
    - schedules:read
    - oncalls:read
    - maintenance_windows:read
    - maintenance_windows:write
  blocked_scopes:
    - schedules:write  # On-call schedule changes require H-007
    - escalation_policies:write
    - services:write
  secret_path: vault://integrations/pagerduty/api-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | PagerDuty Permission | Operations |
|-------|---------------------|------------|
| incident-manager-agent | Full read + incident write | Trigger, acknowledge, resolve, add notes |
| delivery-manager-agent | Read + maintenance write | Create maintenance windows, read on-call |
| vp-engineering-agent | Read-only | View incidents, escalations |
| analytics-agent | Read-only | Fetch incident history, MTTR data |
| All others | None | Not permitted |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Trigger incident (OS-detected P0) | None (agent autonomous) | — |
| Trigger incident (OS-detected P1) | None (agent autonomous) | — |
| Acknowledge incident | None (agent autonomous) | — |
| Resolve incident | None (agent autonomous) | — |
| Suppress/silence alert | human-approval-governance-agent | H-012 |
| Create maintenance window | delivery-manager-agent self-approves | H-007 (if > 4h window) |
| Modify on-call schedule | Human operator (HR impact) | H-007 |
| Create new escalation policy | Human operator | H-009 |
| Add new PagerDuty service | connector-architecture-agent review + human | H-015 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: REST API (HTTPS) + Events API v2 (HTTPS)
  mcp_server: push-notification-mcp (for outbound alert delivery)
  tools_available:
    - pagerduty_trigger_incident
    - pagerduty_acknowledge_incident
    - pagerduty_resolve_incident
    - pagerduty_add_note
    - pagerduty_get_incident
    - pagerduty_list_incidents
    - pagerduty_get_oncall
    - pagerduty_create_maintenance_window
  connection_pool: 3 connections max
  timeout: 8s per API call (Events API: 5s)
  retry_policy: exponential backoff (1s, 2s, 4s), max 3 retries, jitter ±500ms
  circuit_breaker:
    threshold: 3 failures in 60s
    open_duration: 60s
    half_open_probe: 1 request per 60s
    fallback: Push Notification MCP direct alert to human operator
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Events API timeout | Response > 5s | Retry x3 with backoff | Queue event; alert if > 3 failures/5min |
| REST API auth failure | 401/403 response | Halt + alert mcp-integration-agent | Credential rotation; H-009 review |
| Rate limit exceeded | 429 response | Queue + wait rate window | Resume after window resets |
| Circuit breaker open | 3 failures/60s | Route to Push Notification fallback | Probe every 60s |
| Webhook delivery failure | Missed event detected via poll | Poll GET /incidents every 5 min | Reconcile missed events |
| PagerDuty outage | Health check failure | P1 incident created in OS incident log | Manual escalation via Push Notification |

**Degraded mode:** If PagerDuty unavailable > 5 min, OS logs all incidents locally to `memory/events/incident-queue.jsonl` and sends direct Push Notification alerts to the human operator. On-call schedule served from last known snapshot (< 7 days old). All queued events replayed when PagerDuty reconnects.

---

## 8. Observability

```yaml
observability:
  metrics:
    - pagerduty_api_success_rate:        target: "> 99.5%"
    - pagerduty_api_p95_latency:         target: "< 2s"
    - pagerduty_webhook_delivery_rate:   target: "> 99.9%"
    - pagerduty_incident_sync_lag:       target: "< 30s"
    - pagerduty_circuit_breaker_trips:   target: "0 per week"
    - pagerduty_events_api_success_rate: target: "> 99.9%"
  alerts:
    - condition: "api_success_rate < 99%"
      severity: HIGH
      notify: [enterprise-systems-agent, runtime-coordination-agent]
    - condition: "circuit_breaker = OPEN"
      severity: CRITICAL
      notify: [incident-manager-agent, vp-engineering-agent]
    - condition: "webhook_delivery_rate < 99%"
      severity: HIGH
      notify: [enterprise-systems-agent]
    - condition: "pagerduty_health_check = FAIL"
      severity: CRITICAL
      notify: [incident-manager-agent]
      action: activate_degraded_mode
  health_check:
    endpoint: GET https://api.pagerduty.com/abilities
    frequency: every 5 minutes
    timeout: 5s
    auth: API Key header
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Triggered incident (false positive) | PUT /incidents/{id} (status: resolved) | incident-manager-agent | Immediate |
| Added incident note | Cannot delete via API — add correction note | incident-manager-agent | N/A (append-only) |
| Created maintenance window | DELETE /maintenance_windows/{id} | delivery-manager-agent | Before window starts |
| Incident priority change | PUT /incidents/{id} (restore priority) | incident-manager-agent | During incident |

**Rollback guarantee:** Incident trigger and maintenance window operations are reversible. Incident notes are append-only (PagerDuty API constraint) — corrective notes appended instead. All write operations logged to `memory/events/pagerduty-audit.jsonl` with pre-write state snapshot.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| On-call engineer | Incident alert | Technical: affected service, error, log link, runbook link |
| Engineering manager | Incident summary | Impact scope, responder status, ETA to resolution |
| Executive (VP+) | Incident escalation | Business impact, customer exposure, SLA risk, action needed |
| Customer success | Incident customer impact | Customer-facing language, workaround, ETA, no internal detail |
| Post-incident review | PIR document | Full timeline, root cause, metrics (MTTR, scope), action items |

audience-transformation-agent applies EXEC profile to all incident escalations routed to VP+ audience. Raw PagerDuty payloads are TECHNICAL profile — not sent to non-technical stakeholders.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    PagerDuty contains responder names and contact info (PII).
    Names logged only as employee IDs in OS audit log.
    On-call schedules treated as CONFIDENTIAL — not shared outside incident workflow.
  retention_policy: >
    Incident records: 3 years (audit requirement).
    Webhook event log: 1 year.
    On-call schedule snapshots: 90 days.
  access_review: quarterly (who has PagerDuty API access)
  data_residency: PagerDuty SaaS (US region default) — confirm with H-003 data residency check
  compliance_requirements:
    - SOC_2_Type_II: incident response log required as evidence
    - ISO_27001: access control review, incident management evidence
  shadow_it_prevention: unauthorized PagerDuty integrations blocked; all services must be registered
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every Events API call (operation, payload hash, dedup_key, result, agent)
    - Every REST API write (incident update, maintenance window, note)
    - Every webhook event received (event_type, incident_id, processing_result)
    - Every circuit breaker state change (CLOSED→OPEN→HALF_OPEN)
    - Every authentication event (success/failure, key rotation)
    - Every degraded mode activation and deactivation
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/pagerduty-audit.jsonl
  retention: 1 year minimum (3 years for incident records)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: API method + endpoint
    resource: incident_id or maintenance_window_id
    payload_hash: SHA-256 of request payload
    result: success | failure | partial
    correlation_id: OS workflow execution ID
    severity: P0 | P1 | P2 | P3
```
