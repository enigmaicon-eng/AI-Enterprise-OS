---
integration: Looker
category: analytics
status: active
mcp-available: partial
connector-agent: analytics-agent
source-of-truth: governed metrics, LookML data models, embedded analytics
data-classification: INTERNAL
gap-reference: GAP-INT-004
created: 2026-05-10
---

# Looker Integration

> Looker is the governed data analytics platform built on LookML semantic layer. The OS reads Looks, explores, and dashboard data from Looker for decision context, and publishes schedule results and alerts via the Looker API. NOTE: GAP-INT-004 — Looker API write capability for dashboard creation is vendor-restricted in the current license tier; dashboard definitions must be managed through Looker UI. OS reads and data delivery are fully functional. LookML governance is enforced via Spectacles CI validation on every LookML change.

---

## 1. Ingestion Workflows

**What flows from Looker → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Scheduled Look results (CSV/JSON) | Looker scheduled delivery webhook | analytics-agent | Per schedule |
| Alert triggered (metric threshold) | Looker alert webhook | analytics-agent | Real-time |
| Explore query result | On-demand API query | analytics-agent | Per request |
| Dashboard filter state | On-demand API query | analytics-agent | Per request |
| LookML model health | Spectacles CI report | technical-documentation-agent | Per LookML change |
| Look run results | POST /looks/{id}/run/json | analytics-agent | On-demand |

**Ingestion Protocol:**
```yaml
looker_ingestion:
  trigger: Looker scheduled delivery + webhook + on-demand API query
  auth: Looker API3 key (client_id + client_secret → POST /login → access_token)
  api_base: https://looker.internal:19999/api/4.0
  operations:
    run_look: GET /looks/{id}/run/json
    run_inline_query: POST /queries/run/json
    get_dashboard: GET /dashboards/{id}
    get_all_looks: GET /looks
    get_scheduled_plans: GET /scheduled_plans
    create_scheduled_plan: POST /scheduled_plans (API3 key: admin scope)
  transformations:
    - map Looker JSON result → OS analytics schema
    - extract metric values → OS metrics store
    - classify Look type by folder → OS analytics category
    - alert threshold mapping → OS severity classification
  destination: event-bus topic `integration.looker.analytics`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → Looker:**

| OS Artifact | Looker Destination | Publishing Agent | Trigger | GAP Note |
|-------------|-------------------|-----------------|---------|----------|
| Scheduled Look delivery config | POST /scheduled_plans | analytics-agent | Analytics setup | Active |
| Alert definition | POST /alerts | analytics-agent | Metric threshold config | Active |
| Signed embed URL | POST /embed/sso_url | analytics-agent | Dashboard embed request | Active |
| Dashboard content | Looker UI (not API) | Human (LookML developer) | Dashboard design | GAP-INT-004 |
| LookML model update | Git push → Looker pulls | technical-documentation-agent | LookML change | Active (git-based) |

**Publishing Protocol:**
```yaml
looker_publish:
  auth: Looker API3 key (client_id + client_secret)
  token_endpoint: POST /login (returns access_token, token_type, expires_in)
  method: Looker REST API 4.0
  operations:
    create_schedule: POST /api/4.0/scheduled_plans
    update_schedule: PATCH /api/4.0/scheduled_plans/{id}
    delete_schedule: DELETE /api/4.0/scheduled_plans/{id}
    create_alert: POST /api/4.0/alerts
    generate_sso_embed: POST /api/4.0/embed/sso_url
  lookml_governance:
    validation: Spectacles CI (https://spectacles.dev)
    trigger: on every LookML pull request
    checks: [dimension, measure, assert, content]
    block_merge_on_failure: yes
  signed_embed:
    secret: Looker embed secret (vault://integrations/looker/embed-secret)
    expiry: 600 seconds
    user_attributes: department, region, role (for row-level governance)
  secret_path: vault://integrations/looker/api3-credentials
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Looker | Looker-to-OS | Conflict Resolution |
|-------|-------------|-------------|---------------------|
| Scheduled plans | OS creates/updates schedules | Schedule results → OS | OS owns schedule config; Looker executes |
| Alert definitions | OS creates alerts | Alert trigger → OS event | OS owns thresholds; Looker evaluates |
| LookML models | Git push → Looker pulls | Looker validation → OS CI result | Git is source; Looker renders |
| Dashboard content | GAP-INT-004 (UI-only) | Dashboard data → OS via API query | Looker wins (dashboard authority) |

**Sync frequency:** On-demand API queries; schedule-driven deliveries; real-time alert webhooks; daily LookML health check.

**Source-of-truth designator:** Looker is the authoritative source for governed metric definitions (LookML layer). OS is the source for schedule configurations and alert thresholds. LookML is the single source of truth for metric semantics — all data consumers use Looker as the metrics layer to ensure consistency.

---

## 4. Permissions

```yaml
looker_permissions:
  auth_method: Looker API3 Key (client_id + client_secret)
  service_account: ai-os-looker-sa
  looker_roles:
    ai_os_reader:
      permissions: [access_data, see_looks, see_dashboards, see_user_dashboards, explore]
      model_sets: [ai_os_model, delivery_model, analytics_model]
    ai_os_scheduler:
      permissions: [schedule_external_look_emails, send_to_integration]
      model_sets: [all]
    ai_os_embed:
      permissions: [embed, access_data, see_dashboards]
  blocked_operations:
    - create_dashboard (API blocked — GAP-INT-004, UI-only)
    - manage_models without LookML developer role
    - admin operations (user management, connection admin)
    - explore raw tables outside LookML model definitions
  secret_path: vault://integrations/looker/api3-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | Looker Permission | Operations |
|-------|-----------------|------------|
| analytics-agent | Reader + Scheduler + Embed | Run Looks, create schedules, generate embed URLs |
| technical-documentation-agent | Reader | Read LookML health, model structure |
| dashboard-generation-agent | Reader + Embed | Query dashboards, generate embeds |
| delivery-manager-agent | Reader | Query delivery metrics Looks |
| All others | Reader (limited model access) | On-demand Look queries |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Run Look / query explore | None (agent autonomous) | — |
| Create scheduled delivery | None (agent autonomous) | — |
| Generate signed embed URL (internal) | None (agent autonomous) | — |
| Generate signed embed URL (external) | Human operator | H-014 |
| Create/modify Looker alert | None (agent autonomous) | — |
| LookML model change | Spectacles CI pass + human review | H-001 (prod LookML) |
| Delete scheduled plan | analytics-agent self-approves | — |
| Share Looker dashboard externally | Human operator | H-014 |
| Create dashboard (GAP-INT-004) | Human (Looker UI) | N/A |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Looker REST API 4.0 (HTTPS)
  mcp_server: none (direct HTTP client)
  gap_note: GAP-INT-004 — dashboard write API restricted by vendor license tier
  tools_available:
    - looker_run_look
    - looker_run_query
    - looker_get_dashboard
    - looker_create_schedule
    - looker_generate_embed_url
    - looker_create_alert
    - looker_list_looks
    - looker_get_look_results
  connection_pool: 3 connections max
  timeout: 30s (long-running queries: 120s)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: direct Snowflake/BigQuery query (bypass Looker); alert analytics-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Auth token expired | 401 response | Re-authenticate with API3 key | Automated re-auth |
| Look query timeout | Response > 120s | Retry with narrower date range | Alert analytics-agent |
| Schedule delivery failed | Looker delivery failure webhook | Alert analytics-agent with error | Human investigation or re-trigger |
| Looker outage | Health check failure | Fall back to direct DB query | Flush schedule queue on recovery |
| LookML validation failure | Spectacles CI failure | Block LookML merge | Human reviews LookML errors |
| Rate limit | 429 response | Queue requests; wait 60s | Resume after rate window |

**Degraded mode:** If Looker unavailable > 10 min, scheduled deliveries queued in `memory/events/looker-schedule-queue.jsonl`. Critical metrics queries fall back to direct Snowflake queries (bypassing LookML layer — use with caution for consistency). Alert analytics-agent and technical-documentation-agent.

---

## 8. Observability

```yaml
observability:
  metrics:
    - looker_query_success_rate:           target: "> 99%"
    - looker_query_p95_latency:            target: "< 10s"
    - looker_schedule_delivery_success:    target: "> 98%"
    - looker_alert_delivery_rate:          target: "> 99.9%"
    - looker_api_success_rate:             target: "> 99%"
    - looker_circuit_breaker_trips:        target: "0 per week"
    - lookml_validation_pass_rate:         target: "100% (block merge on failure)"
  alerts:
    - condition: "schedule_delivery_failure > 2 in 24h"
      severity: HIGH
      notify: [analytics-agent]
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [analytics-agent, enterprise-systems-agent]
    - condition: "lookml_validation_failure"
      severity: HIGH
      notify: [technical-documentation-agent]
      action: block_lookml_merge
  health_check:
    endpoint: GET /api/4.0/versions
    frequency: every 5 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Bad LookML change | Git revert + re-deploy to Looker | technical-documentation-agent + human | Immediate |
| Incorrect schedule created | DELETE /scheduled_plans/{id} + recreate | analytics-agent | Anytime |
| Alert misconfigured | DELETE + recreate correct alert | analytics-agent | Anytime |
| Signed embed URL (expired) | Re-generate new signed URL (expiry: 600s) | analytics-agent | Anytime |

**Rollback guarantee:** LookML is git-versioned — full rollback always available. Schedule and alert configurations logged to `memory/events/looker-audit.jsonl`. Dashboard content rollback requires human action via Looker UI (GAP-INT-004).

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Data analysts | Raw Explore results | Full data table with all dimensions/measures |
| Engineering managers | Delivery Looks | Filtered to delivery metrics; DORA dimensions |
| Executives | Embedded dashboard (signed SSO) | Pre-filtered executive view; no raw data exposure |
| Finance | Financial Looks | Cost dimensions; aggregated totals; budget variance |
| Product managers | Product Looks | Feature dimensions; user cohort filters |

audience-transformation-agent generates appropriate signed embed parameters (user_attributes, model_sets) to enforce audience-appropriate data access in embedded Looker views.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  gap_int_004: >
    Looker dashboard write via API is restricted in current license tier.
    Dashboard creation and modification must be performed via Looker UI.
    Remediation: upgrade to Looker Business license or use LookML dashboard files.
    Status: MEDIUM priority (tracked in CAPABILITY-GAP-TRACKER.md).
  pii_handling: >
    Looker may expose aggregated user/employee data via Looks.
    LookML row-level governance enforced via user attributes.
    No raw PII accessible via OS-generated queries.
    External access to Looker data requires H-014 approval.
  retention_policy:
    schedule_audit_log: 1 year
    query_audit_log: 90 days
    lookml_change_history: indefinite (git)
  access_review: quarterly (API3 key holders, role assignments)
  data_residency: Looker instance region (confirm H-003)
  compliance_requirements:
    - SOC_2_Type_II: query audit log, LookML change governance
    - ISO_27001: access control, LookML model governance via Spectacles
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every API query / Look run (look_id or query hash, agent, result_count, latency)
    - Every scheduled plan create/update/delete (plan_id, agent, delivery target)
    - Every embed URL generation (look_id or dashboard_id, user_attributes, expiry)
    - Every alert create/delete (alert_id, threshold, agent)
    - Every LookML deployment (commit SHA, model_set, Spectacles result)
    - Every circuit breaker state change
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/looker-audit.jsonl
  retention: 1 year
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: run_look | run_query | create_schedule | generate_embed | create_alert
    resource_id: look_id | dashboard_id | schedule_id
    result: success | failure | queued
    correlation_id: OS workflow execution ID
```
