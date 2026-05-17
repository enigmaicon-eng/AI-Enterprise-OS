---
integration: SharePoint
category: content
status: active
mcp-available: yes
connector-agent: artifact-publishing-agent
source-of-truth: compliance documents, governance packages, enterprise document archive
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# SharePoint Integration

> SharePoint is the enterprise document management and compliance archive system. The OS publishes compliance evidence packages, governance decision records, architecture documents, and executive materials to SharePoint libraries. SharePoint is the authoritative archive for ratified governance and compliance artifacts — once published, these documents are immutable records. The OS reads policy and governance templates from SharePoint to ensure agent behaviors align with approved organizational policies.

---

## 1. Ingestion Workflows

**What flows from SharePoint → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Compliance policies (approved) | SharePoint list change event | compliance-documentation-agent | On update |
| Governance templates | SharePoint document version update | docs-agent | On update |
| Approved vendor contracts | Contract library update event | risk-management-agent | Event-driven |
| Security policies (ratified) | Policy approval workflow complete | security-architect-agent | Event-driven |
| HR policies (updated) | HR library change event | delivery-manager-agent | On update |
| Legal hold notices | Legal hold library item created | compliance-documentation-agent | Real-time |
| Audit committee decisions | Board minutes library | executive-communications-agent | Monthly |

**Ingestion Protocol:**
```yaml
sharepoint_ingestion:
  trigger: Microsoft Graph change notifications (webhook subscription)
  auth: Azure AD OAuth 2.0 (service principal) + subscription validation token
  payload_format: Microsoft Graph webhook notification + Graph API document fetch
  transformations:
    - fetch document content via Graph API /sites/{id}/drive/items/{id}/content
    - classify document type → OS artifact type mapping
    - extract metadata (version, author, approval status)
    - route to consuming agent based on SharePoint library
  destination: event-bus topic `integration.sharepoint.document`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
  subscription_renewal: webhook subscriptions renewed every 72h (Graph API limit)
```

---

## 2. Publishing Workflows

**What flows from OS → SharePoint:**

| OS Artifact | SharePoint Destination | Publishing Agent | Trigger |
|-------------|----------------------|-----------------|---------|
| Compliance evidence package | /sites/compliance/libraries/Evidence | compliance-documentation-agent | Audit cycle, H-019 required |
| SOC 2 control evidence | /sites/compliance/libraries/SOC2 | compliance-documentation-agent | Monthly |
| ADR (ratified) | /sites/architecture/libraries/Decisions | technical-documentation-agent | ADR ratification |
| Release notes (final) | /sites/engineering/libraries/Releases | release-governance-agent | Per release |
| Security audit report | /sites/security/libraries/Audits | security-architect-agent | Post-audit |
| Board pack | /sites/executive/libraries/BoardPacks | executive-communications-agent | Quarterly, H-016 required |
| Governance decision records | /sites/governance/libraries/Decisions | governance-org agents | Per decision |
| Incident PIR (closed) | /sites/operations/libraries/Incidents | incident-manager-agent | Post-PIR |
| Sprint retrospective | /sites/delivery/libraries/Sprints | delivery-manager-agent | Per sprint |

**Publishing Protocol:**
```yaml
sharepoint_publish:
  method: Microsoft Graph API v1.0
  auth: Azure AD OAuth 2.0 client credentials flow (service principal)
  operations:
    upload_file: PUT /sites/{site-id}/drive/root:/{path}/{filename}:/content
    create_folder: POST /sites/{site-id}/drive/root/children
    update_metadata: PATCH /sites/{site-id}/drive/items/{item-id}
    set_permissions: POST /sites/{site-id}/drive/items/{item-id}/permissions
  rate_limit: 10,000 requests/10 min per app per tenant
  idempotency: check if file exists at path; version if exists rather than overwrite
  content_type: multipart/form-data for files > 4MB; PUT for files ≤ 4MB
  secret_path: vault://integrations/sharepoint/service-principal
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-SharePoint | SharePoint-to-OS | Conflict Resolution |
|-------|-----------------|------------------|---------------------|
| Compliance docs | OS publishes, SharePoint archives | SharePoint policy → OS reads | SharePoint wins once ratified (immutable) |
| Governance records | OS publishes decision records | SharePoint approval workflow → OS | SharePoint approval = final state |
| Architecture docs | OS publishes ADRs | Not synced back | OS is source; SharePoint is archive |
| Policy documents | Not written by OS | SharePoint → OS reads policies | SharePoint is authoritative policy source |
| Board materials | OS publishes (H-016) | Not synced back | One-directional publication |

**Sync frequency:** Event-driven for ingestion (webhook); on-artifact-completion for publishing. No periodic polling for governance docs (immutable once ratified).

**Source-of-truth designator:** SharePoint is authoritative for approved policies and ratified governance records. OS wiki is authoritative for working/draft documentation. On ratification, OS artifacts are promoted to SharePoint and become immutable records.

---

## 4. Permissions

```yaml
sharepoint_permissions:
  auth_method: Azure AD OAuth 2.0, Client Credentials (Service Principal)
  service_principal: ai-os-sharepoint-sp
  graph_api_scopes:
    - Sites.ReadWrite.All     # Read and write site content
    - Files.ReadWrite.All     # Read and write files
    - User.Read               # Read service account info
  blocked_scopes:
    - Sites.FullControl.All   # Admin operations require human
    - Sites.Manage.All        # Site management requires H-009
  site_collection_permissions:
    compliance_site: Read (ingestion) + Write (evidence publish, H-019 gated)
    architecture_site: Write (ADR publication)
    executive_site: Write (H-016 gated only)
    governance_site: Write (governance decisions)
    engineering_site: Write (release notes, sprint records)
  secret_path: vault://integrations/sharepoint/oauth-service-principal
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | SharePoint Permission | Operations |
|-------|----------------------|------------|
| compliance-documentation-agent | Compliance site Write | Publish evidence packages (H-019 gated) |
| technical-documentation-agent | Architecture site Write | Publish ADRs, runbooks |
| executive-communications-agent | Executive site Write | Publish board packs (H-016 gated) |
| release-governance-agent | Engineering site Write | Publish release notes |
| security-architect-agent | Security site Write | Publish audit reports |
| docs-agent | All sites Read | Read policies and governance templates |
| All others | Read-only (non-restricted sites) | Read published artifacts |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Publish to engineering/delivery site | None (agent autonomous) | — |
| Publish compliance evidence | compliance-documentation-agent self-approves | H-019 (submission to regulator) |
| Publish to executive site | Human operator review | H-016 |
| Publish security audit to external auditor | Human operator | H-019 + H-022 |
| Hard delete document | Human operator | H-021 |
| Archive document library | Human operator | H-024 |
| Change site permissions | Human operator + IT admin | H-009 |
| Grant external user access to SharePoint | Human operator | H-014 + H-009 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Microsoft Graph API (HTTPS)
  mcp_server: microsoft-365-mcp (covers SharePoint, Outlook, Teams)
  tools_available:
    - sharepoint_upload_file
    - sharepoint_read_file
    - sharepoint_list_library
    - sharepoint_create_folder
    - sharepoint_update_metadata
    - sharepoint_get_site_info
    - sharepoint_search_content
  connection_pool: 5 connections max
  timeout: 30s (large file uploads may use chunked upload with longer timeout)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries, jitter ±500ms
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 120s
    half_open_probe: 1 request per 60s
    fallback: queue artifacts locally; alert artifact-publishing-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Graph API timeout | Response > 30s | Retry with chunked upload fallback | Alert if > 2 consecutive failures |
| Auth token expired | 401 response | Refresh token via client credentials | Token refresh automated; alert if refresh fails |
| Rate limit exceeded | 429 response + Retry-After header | Honor Retry-After, then resume | Queue publications during throttle window |
| File size limit exceeded | 400 response (> 250MB) | Split into multi-part upload | Chunked upload via Graph large file API |
| Site not found | 404 response | Alert artifact-publishing-agent; check site URL | Manual verification + H-009 if site restructured |
| SharePoint outage | Health check failure | Queue all publications locally | Auto-flush queue when SharePoint recovers |

**Degraded mode:** If SharePoint unavailable > 15 min, all artifact publications queued in `memory/events/sharepoint-publish-queue.jsonl`. Compliance artifact publications generate local copies at `memory/artifacts/compliance-pending/`. Alert compliance-documentation-agent and artifact-publishing-agent. On recovery, queue replayed in FIFO order.

---

## 8. Observability

```yaml
observability:
  metrics:
    - sharepoint_api_success_rate:     target: "> 99%"
    - sharepoint_upload_p95_latency:   target: "< 10s (small files < 4MB)"
    - sharepoint_webhook_uptime:       target: "> 99.9% (subscription active)"
    - sharepoint_queue_depth:          target: "0 (alert if > 5 queued)"
    - sharepoint_circuit_breaker_trips: target: "0 per week"
  alerts:
    - condition: "api_success_rate < 98%"
      severity: HIGH
      notify: [artifact-publishing-agent, enterprise-systems-agent]
    - condition: "circuit_breaker = OPEN"
      severity: CRITICAL
      notify: [artifact-publishing-agent, compliance-documentation-agent]
    - condition: "compliance_publish_queue_depth > 0 AND age > 4h"
      severity: HIGH
      notify: [compliance-documentation-agent]
      reason: compliance evidence has time-sensitivity
  health_check:
    endpoint: GET https://graph.microsoft.com/v1.0/sites/{root-site-id}
    frequency: every 5 minutes
    timeout: 10s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Uploaded file (wrong version) | PUT new version; old version preserved in version history | artifact-publishing-agent | Anytime (SharePoint versioning) |
| Published compliance evidence (recall) | Mark document as SUPERSEDED; notify H-019 authority | compliance-documentation-agent | H-019 gate (cannot recall submitted evidence without human) |
| Board pack published in error | Mark DRAFT; notify H-016 authority immediately | executive-communications-agent | Immediate |
| Deleted file (soft delete) | Restore from SharePoint recycle bin | enterprise-systems-agent | 93 days (SharePoint recycle bin) |
| Permission granted in error | PATCH /permissions/{id} (revoke) | enterprise-systems-agent | Immediate |

**Rollback guarantee:** SharePoint maintains full version history for all documents. All OS writes include version tags. Any published document can be versioned or superseded within the SharePoint versioning window. Hard deletes require H-021 and are subject to legal hold checks.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Legal/Compliance | Evidence packages | Regulatory language, structured evidence, chain-of-custody metadata |
| Executives | Board packs | Executive summary first, appendix for detail, branded formatting |
| IT Administrators | Runbooks | Step-by-step procedural format, screenshots, command blocks |
| Auditors | Audit trails | Timestamped, hash-verified, structured per audit standard |
| Engineering | ADRs, release notes | Full technical detail, decision context, implementation notes |

audience-transformation-agent applies LEGAL profile to all compliance artifacts before SharePoint publication. EXECUTIVE profile applied to board packs. TECHNICAL profile for engineering and IT artifacts.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    SharePoint may contain PII in HR and legal documents.
    PII documents stored only in dedicated HR and Legal site collections.
    PII document access restricted to compliance-documentation-agent for audit purposes only.
    No PII extracted to OS memory; document references only (SharePoint item ID).
  retention_policy:
    compliance_evidence: 7 years (audit requirement)
    governance_decisions: permanent (never deleted)
    board_packs: 10 years
    release_notes: 3 years
    sprint_records: 2 years
  access_review: quarterly (SharePoint group membership and service principal access)
  data_residency: Microsoft 365 tenant region (must align with constitution ratification H-003)
  legal_hold: documents under legal hold cannot be deleted regardless of H-021 — blocked by SharePoint litigation hold
  compliance_requirements:
    - SOC_2_Type_II: document access logs required as evidence
    - ISO_27001: information classification, access control
    - GDPR: data subject records (HR/Legal sites) — DSAR process applies
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every file upload (site, library, path, version, size, agent, timestamp)
    - Every file read access (document ID, agent, purpose, timestamp)
    - Every permission change (who, what, scope, H-NNN gate reference)
    - Every webhook event received (notification type, site, item, processing result)
    - Every circuit breaker event (state change, reason, duration)
    - Every publish queue activation (degraded mode start/end, queue depth)
    - Every H-019 and H-016 gate event (artifact, approver, decision, timestamp)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/sharepoint-audit.jsonl
  retention: 1 year minimum (7 years for compliance-related events)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent
    operation: Graph API method + endpoint
    resource: SharePoint site + library + item path
    payload_hash: SHA-256 of file content (for uploads)
    result: success | failure | queued
    correlation_id: OS workflow execution ID
    classification: INTERNAL | CONFIDENTIAL | RESTRICTED
```
