---
integration: ArgoCD
category: cicd
status: active
mcp-available: partial
connector-agent: enterprise-systems-agent
source-of-truth: GitOps deployment state, application sync status, drift detection
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# ArgoCD Integration

> ArgoCD is the GitOps continuous deployment controller. The OS reads application sync state, drift alerts, and deployment history from ArgoCD, and publishes sync commands and rollback directives via the ArgoCD API. ArgoCD is the authoritative system for cluster desired-state vs. actual-state reconciliation. Auto-sync is DISABLED for production namespaces — all production sync operations require H-001 approval. Staging sync is autonomous via GitOps (ArgoCD auto-sync enabled).

---

## 1. Ingestion Workflows

**What flows from ArgoCD → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Application sync status | ArgoCD webhook (app sync event) | release-governance-agent | Real-time |
| Drift detected (OutOfSync) | ArgoCD webhook (sync status change) | incident-manager-agent | Real-time |
| Sync failed | ArgoCD webhook (sync error) | incident-manager-agent | Real-time |
| Application health degraded | ArgoCD webhook (health status) | runtime-coordination-agent | Real-time |
| Deployment history (all apps) | ArgoCD REST API poll | analytics-agent | Daily |
| Application resource tree | On-demand API query | release-governance-agent | Per deployment |
| Rollback history | On-demand API query | release-governance-agent | Per rollback decision |

**Ingestion Protocol:**
```yaml
argocd_ingestion:
  trigger: ArgoCD webhook (app events) + scheduled REST API poll
  auth:
    webhook: Bearer token in Authorization header (ArgoCD webhook token)
    api: ArgoCD API token (JWT) or local admin credentials
  api_base: https://argocd.internal/api/v1
  webhook_events:
    - app.sync.running
    - app.sync.succeeded
    - app.sync.failed
    - app.health.degraded
    - app.deployed
  transformations:
    - map ArgoCD sync status → OS deployment state (Synced/OutOfSync/Unknown)
    - map ArgoCD health status → OS health signal (Healthy/Degraded/Missing)
    - extract affected resources → OS impact map
    - classify drift type (manifest change / image tag / config) → OS alert
  destination: event-bus topic `integration.argocd.sync`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
  deduplication: app_name + revision hash
```

---

## 2. Publishing Workflows

**What flows from OS → ArgoCD:**

| OS Artifact | ArgoCD Destination | Publishing Agent | Trigger | Gate |
|-------------|-------------------|-----------------|---------|------|
| Sync command (production) | POST /applications/{name}/sync | release-governance-agent | Release milestone | H-001 |
| Sync command (staging) | ArgoCD auto-sync (no API call) | ArgoCD (autonomous) | Git push | None |
| Rollback directive (production) | POST /applications/{name}/rollback | incident-manager-agent | P0/P1 incident | H-001 |
| Rollback directive (staging) | POST /applications/{name}/rollback | release-governance-agent | QA failure | H-025 |
| Application definition (new app) | POST /applications | release-governance-agent | New service onboarding | H-015 |
| Sync window configuration | PATCH /applications/{name} | delivery-manager-agent | Sprint planning | H-001 (prod) |

**Publishing Protocol:**
```yaml
argocd_publish:
  auth: ArgoCD API token (JWT, generated via /session endpoint)
  method: ArgoCD REST API v1
  operations:
    sync_app: POST /api/v1/applications/{name}/sync
    rollback: POST /api/v1/applications/{name}/rollback
    create_app: POST /api/v1/applications
    get_app: GET /api/v1/applications/{name}
    get_resources: GET /api/v1/applications/{name}/resource-tree
    delete_app: DELETE /api/v1/applications/{name}
  sync_options:
    prune: false (never auto-prune in production without explicit flag)
    dry_run: true (always dry-run before live sync in production)
    apply_only: false
    force: false (force requires H-001 + explicit operator override)
  idempotency: sync is idempotent (running sync on Synced app is a no-op)
  secret_path: vault://integrations/argocd/api-token
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-ArgoCD | ArgoCD-to-OS | Conflict Resolution |
|-------|-------------|-------------|---------------------|
| Desired state | OS pushes to git → ArgoCD picks up | ArgoCD current state → OS sync status | ArgoCD git ref is source (GitOps model) |
| Sync status | OS triggers sync (prod) | ArgoCD sync result → OS deployment record | ArgoCD wins (execution authority) |
| Drift state | Not written by OS | ArgoCD OutOfSync alert → OS incident | ArgoCD wins (drift detection authority) |
| Rollback | OS requests rollback → ArgoCD executes | Rollback result → OS incident update | ArgoCD wins (execution) |
| Health status | Not written by OS | ArgoCD health probe → OS health signal | ArgoCD wins (health checks) |

**Sync frequency:** Real-time webhooks for sync/health events; daily batch for deployment history; 5-minute poll for drift check (if webhooks miss events).

**Source-of-truth designator:** Git repository is the ultimate source of truth (GitOps model). ArgoCD is authoritative for actual cluster sync state and health. OS manages release decisions and approval gates, but execution authority belongs to ArgoCD.

---

## 4. Permissions

```yaml
argocd_permissions:
  auth_method: ArgoCD API Token (JWT) — OIDC service principal
  service_account: ai-os-argocd-sa
  argocd_roles:
    ai_os_reader:
      - applications/get
      - applications/list
      - repositories/get
      - clusters/get
    ai_os_deployer:
      - applications/get
      - applications/list
      - applications/sync
      - applications/action (rollback)
    ai_os_admin:
      - applications/create
      - applications/delete
      - applications/update
  prod_namespace_policy: >
    auto-sync disabled for production namespaces.
    Sync requires api_token with deployer role AND H-001 approval record.
  blocked_operations:
    - applications/delete without H-021
    - repositories/create without H-015
    - clusters/add without H-009 + H-015
    - applications/sync with force: true without explicit human override
  secret_path: vault://integrations/argocd/api-token
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | ArgoCD Permission | Operations |
|-------|-----------------|------------|
| release-governance-agent | Deployer | Trigger prod sync (H-001); read all apps |
| incident-manager-agent | Deployer | Trigger prod rollback (H-001 expedited) |
| runtime-coordination-agent | Reader | Read app health, drift status |
| analytics-agent | Reader | Deployment history for DORA metrics |
| delivery-manager-agent | Reader | Deployment cadence for sprint planning |
| All others | None | No ArgoCD access |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Read sync status / health | None (agent autonomous) | — |
| Watch drift alerts | None (agent autonomous) | — |
| Sync staging application | None (ArgoCD auto-sync) | — |
| Sync production application | Human operator | H-001 |
| Rollback production application | Human operator (expedited for P0) | H-001 |
| Rollback staging application | release-governance-agent self-approves | H-025 |
| Create new ArgoCD application | Human operator | H-015 |
| Delete ArgoCD application | Human operator | H-021 |
| Add new cluster to ArgoCD | Human operator + security review | H-009 + H-015 |
| Enable auto-sync for production | Human operator + architecture review | H-009 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: ArgoCD REST API (HTTPS) + SSE streaming (sync events)
  mcp_server: none (direct HTTP client)
  tools_available:
    - argocd_get_app_status (sync + health state)
    - argocd_list_apps (all applications)
    - argocd_sync_app (H-001 gated for prod)
    - argocd_rollback_app (H-001 gated for prod)
    - argocd_get_resource_tree (deployed resource inventory)
    - argocd_get_rollout_history (revision history)
    - argocd_diff (desired vs actual diff)
  sse_streaming:
    endpoint: GET /api/v1/stream/applications
    use_case: real-time sync event consumption
    reconnect: automatic on disconnect (exponential backoff)
  connection_pool: 5 connections max
  timeout: 15s per API call (SSE: persistent)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: direct kubectl query for app status; alert enterprise-systems-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| ArgoCD API unreachable | Connection timeout | Alert enterprise-systems-agent; suspend sync commands | Manual investigation; ArgoCD container restart |
| Sync timeout (app stuck) | Sync running > 15 min | Alert incident-manager-agent with resource tree | Human investigation; possible force-sync or rollback |
| Auth token expired | 401 response | Re-authenticate via /session endpoint | Auto token refresh; alert if credential expired |
| Drift detected (no action) | OutOfSync webhook | Alert release-governance-agent with diff | Human-approved sync or investigation |
| Sync failed (OPA policy) | Sync error webhook | Alert release-governance-agent with policy violation | Human reviews policy; fix manifest |
| ArgoCD outage | Health check failure | Halt all sync commands; alert enterprise-systems-agent | Manual K8s operations if P0; wait for ArgoCD recovery |

**Degraded mode:** If ArgoCD unavailable > 10 min, all sync commands suspended. Drift alerts buffered in `memory/events/argocd-drift-queue.jsonl`. Staging auto-sync continues (ArgoCD handles autonomously). Production remains at last synced state until ArgoCD recovers. P0 incidents escalate to manual kubectl operations (H-001 required).

---

## 8. Observability

```yaml
observability:
  metrics:
    - argocd_sync_success_rate:          target: "> 99% (all apps)"
    - argocd_sync_p95_duration:          target: "< 5 min"
    - argocd_drift_detection_lag:        target: "< 30s"
    - argocd_api_success_rate:           target: "> 99.5%"
    - argocd_circuit_breaker_trips:      target: "0 per week"
    - argocd_apps_out_of_sync:           target: "0 (production); alert if > 0 > 5 min"
    - argocd_apps_degraded:              target: "0 (alert immediately)"
  alerts:
    - condition: "production app OutOfSync > 5 min"
      severity: HIGH
      notify: [release-governance-agent, incident-manager-agent]
    - condition: "application health = Degraded"
      severity: CRITICAL
      notify: [incident-manager-agent, runtime-coordination-agent]
    - condition: "sync_success_rate < 98%"
      severity: HIGH
      notify: [release-governance-agent, enterprise-systems-agent]
    - condition: "circuit_breaker = OPEN"
      severity: CRITICAL
      notify: [incident-manager-agent, enterprise-systems-agent]
  health_check:
    endpoint: GET /healthz
    frequency: every 2 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Bad production sync | POST /applications/{name}/rollback (H-001) | incident-manager-agent + human | Immediate (P0 SLA: < 15 min) |
| Bad staging sync | POST /applications/{name}/rollback (H-025) | release-governance-agent | Self-approves |
| Incorrect app definition | Restore previous app spec from git; sync | release-governance-agent + human | H-001 for prod |
| Accidental auto-sync | Disable auto-sync + rollback | human operator | Immediate |

**Rollback guarantee:** ArgoCD maintains full revision history for all applications. Every sync records the git revision hash. Rollback to any previous revision is supported via the rollback API. All sync operations logged to `memory/events/argocd-audit.jsonl` with revision hash, enabling complete audit trail from deployment to rollback.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| On-call engineer | Drift alert | Affected app, resource diff, git commit causing drift, runbook link |
| Engineering manager | Deployment summary | App name, sync status, revision, deployment duration |
| Release manager | Release readiness | All app sync status, last deployed revision, health summary |
| Executive | Deployment scorecard | Deployment count, success rate, rollback count, MTTR |
| Compliance | Deployment audit trail | Chronological sync history with H-001 approval records |

audience-transformation-agent applies EXEC profile for deployment scorecards and COMPLIANCE profile for audit trail exports.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    ArgoCD stores git repository details and deployment configuration.
    No personal PII stored in ArgoCD beyond operator names in H-001 approval records.
    Audit logs contain operator identities — treated as CONFIDENTIAL.
  retention_policy:
    deployment_audit_log: 3 years
    argocd_drift_queue: 7 days
    revision_history: indefinite (ArgoCD default + git history)
  access_review: quarterly (ArgoCD RBAC roles, API token holders)
  data_residency: ArgoCD cluster region (same as K8s cluster — confirm H-003)
  compliance_requirements:
    - SOC_2_Type_II: deployment audit trail, H-001 approval records as evidence
    - ISO_27001: change management records, RBAC access review
  production_sync_policy: >
    Auto-sync MUST be disabled for production namespaces.
    Every production sync requires H-001 human approval.
    Force-sync in production requires explicit operator confirmation + H-001.
    Drift remediation in production is NEVER autonomous.
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every sync command (app_name, revision, dry_run result, live result, agent, H-NNN ref)
    - Every rollback (app_name, from_revision, to_revision, agent, H-NNN ref, result)
    - Every drift alert received (app_name, resource_diff_hash, detection_timestamp)
    - Every sync webhook event (event_type, app_name, revision, health_status)
    - Every circuit breaker state change
    - Every H-001 gate invocation (approval record, approver, decision, timestamp)
    - Every application created or deleted
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/argocd-audit.jsonl
  retention: 3 years (deployment records), 1 year (read/watch events)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent identifier
    operation: sync | rollback | create_app | delete_app | watch_event
    app_name: ArgoCD application name
    revision: git commit SHA
    namespace: target K8s namespace
    gate_reference: H-001 | H-025 | H-015 | none
    result: success | failure | dry-run-only | queued
    correlation_id: OS workflow execution ID
```
