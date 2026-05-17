---
integration: Office 365
category: workspace
status: active
mcp-available: yes
connector-agent: artifact-publishing-agent
source-of-truth: enterprise email (Outlook), enterprise calendar, Microsoft ecosystem productivity
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# Office 365 Integration

> Office 365 is the Microsoft-ecosystem productivity platform. The OS uses Outlook for enterprise email communications (internal and external), Exchange Calendar for scheduling, and OneDrive/SharePoint for document storage (SharePoint is a separate connector at `integrations/content/sharepoint.md`; Teams is a separate connector at `integrations/communication/teams.md`). This connector focuses on Outlook email and Exchange Calendar. All external Outlook communications require H-014 or H-016 approval gates identical to the Google Workspace policy.

---

## 1. Ingestion Workflows

**What flows from Office 365 → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Incoming flagged emails (rule: AI-OS-Intake) | Outlook webhook (Graph subscription) | relevant domain agent | Real-time |
| Calendar availability (team OOO, meeting blocks) | Exchange Calendar API poll | delivery-manager-agent | Daily |
| Meeting invites accepted (key stakeholders) | Graph change notification | delivery-manager-agent | Event-driven |
| Vendor emails (label: Vendor) | Graph subscription | risk-management-agent | Event-driven |
| Legal correspondence (label: Legal) | Graph subscription | compliance-documentation-agent | Event-driven |
| Executive email replies (flagged threads) | Graph subscription | executive-communications-agent | Event-driven |
| Teams channel messages (flagged): | Handled by Teams connector | workflow-routing-agent | Real-time |

**Ingestion Protocol:**
```yaml
office365_ingestion:
  trigger: Microsoft Graph change notifications (webhook subscriptions)
  auth: Azure AD OAuth 2.0 (service principal, client credentials)
  graph_subscription_path: POST /subscriptions
  resource: /users/{id}/mailFolders/{AI-OS-Intake}/messages
  payload_format: Microsoft Graph webhook notification + message fetch
  transformations:
    - fetch message via GET /users/{id}/messages/{id}?$select=subject,from,body,attachments
    - classify by sender domain, subject keywords, folder label
    - route to consuming agent by classification
    - strip email body (store hash only; do not persist raw content to OS memory)
  destination: event-bus topic `integration.office365.email`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
  subscription_renewal: Graph subscriptions renewed every 4230 min (Graph API max)
```

---

## 2. Publishing Workflows

**What flows from OS → Office 365:**

| OS Artifact | Destination | Publishing Agent | Trigger | Gate |
|-------------|------------|-----------------|---------|------|
| Executive report (internal) | Outlook email → internal recipients | executive-communications-agent | On demand | None |
| Stakeholder update (external) | Outlook email → external | executive-communications-agent | Sprint end | H-016 |
| Sprint planning invite | Exchange Calendar event | delivery-manager-agent | Sprint planning | None |
| Customer incident notification | Outlook email → customer | incident-manager-agent | P0/P1 customer impact | H-014 |
| Release announcement | Outlook email → distribution list | release-governance-agent | Release milestone | H-014 |
| Board pack (link) | Outlook email → board | executive-communications-agent | Quarterly | H-016 |
| Compliance report (external auditor) | Outlook email + PDF attachment | compliance-documentation-agent | Audit cycle | H-019 + H-022 |
| DOCX report | OneDrive upload | technical-documentation-agent | Report generation | None (internal) |
| Incident PIR summary | Outlook email → engineering leadership | incident-manager-agent | PIR completion | None (internal) |

**Publishing Protocol:**
```yaml
office365_publish:
  auth: Azure AD OAuth 2.0, client credentials + on-behalf-of (for user-context sends)
  graph_mail_send:
    endpoint: POST https://graph.microsoft.com/v1.0/users/{userId}/sendMail
    format: JSON message body (text/html or text/plain)
    max_size: 25MB (with attachments, via MIME)
    large_attachments: upload to OneDrive, share link in email
  graph_calendar:
    create_event: POST /users/{userId}/events
    update_event: PATCH /users/{userId}/events/{eventId}
    delete_event: DELETE /users/{userId}/events/{eventId}
  rate_limit: 10,000 API requests/10 min per app per tenant
  idempotency: clientRequestId header (UUID) prevents duplicate sends
  secret_path: vault://integrations/office365/service-principal
  rotation: 90 days
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-O365 | O365-to-OS | Conflict Resolution |
|-------|-----------|-----------|---------------------|
| Calendar events | OS creates sprint/planning events | Attendee responses → OS capacity model | Exchange wins (RSVP state) |
| Email threads | OS sends; tracks sent-state in audit log | Replies ingested if in AI-OS-Intake folder | Outlook is authoritative for email state |
| OOO calendar status | Not written by OS | Exchange OOO → OS sprint capacity | Exchange is authoritative for availability |
| OneDrive documents | OS uploads reports | Not synced back | One-directional (upload only) |
| Contacts | Not managed by OS | Not ingested (PII — contacts not written to OS memory) | N/A |

**Sync frequency:** Real-time for flagged email ingestion via Graph subscriptions; daily poll for Exchange Calendar OOO; event-driven for calendar RSVP tracking.

**Source-of-truth designator:** Outlook/Exchange is authoritative for email communication state, calendar availability, and meeting scheduling. OS is authoritative for the content of artifacts published via Outlook.

---

## 4. Permissions

```yaml
office365_permissions:
  auth_method: Azure AD OAuth 2.0, Service Principal (client credentials)
  service_principal: ai-os-o365-sp@tenant.onmicrosoft.com
  graph_api_scopes:
    - Mail.ReadWrite         # Read labeled folders
    - Mail.Send              # Send email
    - Calendars.ReadWrite    # Create/update events
    - User.Read              # Read service account profile
  blocked_scopes:
    - Mail.ReadWrite.All     # All user mailboxes (not needed — use specific user delegation)
    - Contacts.ReadWrite     # PII — contacts not managed by OS
    - Files.ReadWrite.All    # Use SharePoint connector instead
  admin_consent_required: yes (Mail.Send for service principal requires admin consent in Azure AD)
  secret_path: vault://integrations/office365/service-principal-credentials
  rotation: 90 days
```

**Agent authorization matrix:**

| Agent | O365 Permission | Operations |
|-------|----------------|------------|
| executive-communications-agent | Mail.Send (H-016 gated for external) | Send executive emails |
| delivery-manager-agent | Calendars.ReadWrite | Create sprint events, read availability |
| incident-manager-agent | Mail.Send (H-014 gated) | Customer incident notifications |
| compliance-documentation-agent | Mail.Send (H-019 gated), Mail.Read | Send audit reports, read legal emails |
| release-governance-agent | Mail.Send (H-014 gated) | Release announcements |
| All others | Calendars.Read, Mail.Read (labeled folder only) | Read availability, labeled inbox |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Send Outlook email (internal @company.com) | None (agent autonomous) | — |
| Create internal calendar event | None (agent autonomous) | — |
| Send Outlook email (external customer) | Human operator | H-014 |
| Send Outlook email (executive/board/investor) | Human operator | H-016 |
| Send Outlook email (external auditor/regulator) | Human operator | H-019 + H-022 |
| Send bulk email (> 50 external recipients) | human-approval-governance-agent | H-018 |
| Access another user's mailbox (delegation) | Human operator + IT admin | H-020 (DSAR only) |
| Delete email from Outlook | Human operator | H-021 |
| Archive mailbox | Human operator | H-024 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Microsoft Graph API v1.0 (HTTPS REST)
  mcp_server: microsoft-365-mcp (covers Outlook, Calendar, OneDrive, Teams, SharePoint)
  tools_available:
    - outlook_send_email
    - outlook_read_messages
    - outlook_create_calendar_event
    - outlook_list_calendar_events
    - outlook_delete_calendar_event
    - outlook_get_availability (free/busy)
    - onedrive_upload_file
    - onedrive_read_file
  connection_pool: 5 connections max
  timeout: 30s per API call
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries, honor Retry-After header
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: queue outbound emails; route calendar creation to alternate method
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Graph API token expired | 401 response | Refresh via client credentials flow | Automated token refresh |
| Mail send failure | 4xx/5xx response | Retry x3; save to draft if persistent | Alert artifact-publishing-agent; draft preserved |
| Throttling (429) | 429 + Retry-After | Honor Retry-After interval | Resume after backoff window |
| Large attachment rejection | 413 response | Upload to OneDrive; share link in email | Auto-fallback to link-share |
| Calendar conflict | 409 response | Log conflict; notify delivery-manager-agent | Manual resolution |
| Graph API outage | Health check failure | Queue all outbound sends | Flush queue on recovery in FIFO order |

**Degraded mode:** If Office 365 / Graph API unavailable > 10 min, outbound emails queued in `memory/events/outlook-send-queue.jsonl`. Calendar operations queued in `memory/events/calendar-queue.jsonl`. Queues flushed on recovery. Compliance-sensitive emails (H-019, H-022) held for human review before flush if > 1h delay occurred.

---

## 8. Observability

```yaml
observability:
  metrics:
    - outlook_send_success_rate:         target: "> 99.5%"
    - outlook_send_p95_latency:          target: "< 5s"
    - calendar_api_success_rate:         target: "> 99.5%"
    - external_email_gate_compliance:    target: "100%"
    - graph_subscription_uptime:         target: "> 99.9%"
    - circuit_breaker_trips:             target: "0 per week"
  alerts:
    - condition: "outlook_send_success_rate < 99%"
      severity: HIGH
      notify: [artifact-publishing-agent, enterprise-systems-agent]
    - condition: "external_email_gate_compliance < 100%"
      severity: CRITICAL
      notify: [governance-org agents, compliance-documentation-agent]
    - condition: "graph_subscription expired or inactive"
      severity: HIGH
      notify: [enterprise-systems-agent]
      action: renew_graph_subscription
  health_check:
    endpoint: GET https://graph.microsoft.com/v1.0/me
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Sent email | Outlook recall (Exchange) or correction email | executive-communications-agent | Within 5 min (recall window) |
| Calendar event created | DELETE /users/{id}/events/{eventId} | delivery-manager-agent | Anytime before event |
| OneDrive file uploaded | Upload corrected version; previous in version history | artifact-publishing-agent | Anytime |
| Bulk email sent | Correction email to same list + H-018 authority notification | compliance-documentation-agent | Immediate |

**Rollback guarantee:** Exchange email recall works within the Microsoft tenant for internal recipients. For external recipients, a correction email is the rollback mechanism. All sent emails logged with full audit trail enabling accountability. Calendar events and OneDrive files are reversible within standard platform limits.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Internal executives | Sprint update email | 3 bullets: shipped, next, risk — plain text preferred |
| Board members | Board pack email | Formal salutation, clear agenda reference, PDF attached |
| External customers | Incident notification | Empathetic tone, workaround-first, no internal terminology |
| External auditors | Compliance report | Formal language, structured attachment, reference to control IDs |
| Engineering team | Sprint invite | Agenda items, pre-read links, technical context |
| Vendors | Procurement response | Formal, decision-clear, timeline explicit |

audience-transformation-agent is invoked before every external Outlook send. EXECUTIVE profile for H-016 emails. CUSTOMER profile for H-014 emails. LEGAL profile for H-019/H-022 emails.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    Outlook contains PII (email addresses, names, communication content).
    Email body content not persisted to OS memory (hash + metadata only).
    External recipient email addresses stored only in send audit log.
    Legal and HR email content accessible only to compliance-documentation-agent under H-020.
  retention_policy:
    send_audit_log: 3 years
    calendar_events: 1 year post-event
    onedrive_files: per file type (compliance = 7 years, operational = 2 years)
  access_review: quarterly (service principal permissions, Mail.Send admin consent review)
  data_residency: Microsoft 365 tenant region (confirm with constitution ratification H-003)
  compliance_requirements:
    - SOC_2_Type_II: email access logs, service principal audit
    - GDPR: email communication records, right to erasure (external contacts)
    - ISO_27001: access control for mail sending capability
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every Outlook send (recipient domain hash, subject hash, agent, gate reference, timestamp)
    - Every external Outlook send (full audit: H-NNN approval record, message_id, recipient domain)
    - Every calendar event create/update/delete (event ID, attendee count, agent)
    - Every OneDrive upload (file ID, size, agent, timestamp)
    - Every Graph subscription renewal (subscription ID, expiry, result)
    - Every circuit breaker event and queue activation
    - Every auth token refresh (success/failure)
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/office365-audit.jsonl
  retention: 1 year minimum (3 years for external communications)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent
    service: outlook | calendar | onedrive
    operation: Graph API method + resource path
    resource: message_id | event_id | file_id
    recipient_domain_hash: SHA-256 of recipient domain (PII protection)
    gate_reference: H-014 | H-016 | H-019 | none
    result: success | failure | queued
    correlation_id: OS workflow execution ID
```
