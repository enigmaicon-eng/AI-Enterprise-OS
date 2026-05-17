---
integration: Google Workspace
category: workspace
status: active
mcp-available: yes
connector-agent: artifact-publishing-agent
source-of-truth: email communications (Gmail), calendar state (Google Calendar), document collaboration (Google Drive)
data-classification: CONFIDENTIAL
created: 2026-05-10
---

# Google Workspace Integration

> Google Workspace is the primary productivity and communication platform. Three MCP servers are available in active Claude sessions: Gmail MCP (email), Google Calendar MCP (scheduling), and Google Drive MCP (documents). The OS uses Google Workspace to publish executive communications, sprint invites, and shared documents, and to ingest customer emails, meeting artifacts, and shared documents from external parties. All external communications via Gmail require H-014 or H-016 approval gates.

---

## 1. Ingestion Workflows

**What flows from Google Workspace → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Incoming customer emails (labeled: AI-OS-Intake) | Gmail push notification | customer-success-agent | Real-time |
| Stakeholder meeting invites (accepted) | Google Calendar webhook | delivery-manager-agent | Event-driven |
| Shared documents (vendor proposals, RFPs) | Google Drive change notification | relevant domain agent | Event-driven |
| OOO calendar events (team members) | Calendar API poll | delivery-manager-agent | Daily (sprint planning) |
| Customer feedback forms (Drive) | Drive change event | customer-success-agent | Event-driven |
| External audit requests (Gmail) | Gmail label: Audit-Request | compliance-documentation-agent | Event-driven |
| Board meeting materials (Drive) | Drive change notification | executive-communications-agent | Event-driven |

**Ingestion Protocol:**
```yaml
google_workspace_ingestion:
  trigger:
    gmail: Gmail push notifications via Google Cloud Pub/Sub
    calendar: Google Calendar push notifications (webhook)
    drive: Google Drive change notifications (webhook)
  auth: Google OAuth 2.0 (service account + domain-wide delegation for Gmail/Calendar)
  mcp_servers_available:
    - mcp__claude_ai_Gmail      # authenticate, send, read labels
    - mcp__claude_ai_Google_Calendar  # read/write events
    - mcp__claude_ai_Google_Drive     # read/write/upload files
  transformations:
    - Gmail: extract sender, subject, body, attachments → OS inbox item schema
    - Calendar: extract event metadata, attendees, location → OS calendar entry
    - Drive: extract file metadata, sharing permissions, content preview → OS document reference
  destination: event-bus topic `integration.google-workspace.event`
  error_handling: retry x3, dead-letter queue, alert enterprise-systems-agent
  privacy_note: email body content logged only by hash; raw content not written to OS memory
```

---

## 2. Publishing Workflows

**What flows from OS → Google Workspace:**

| OS Artifact | Destination | Publishing Agent | Trigger | Gate |
|-------------|------------|-----------------|---------|------|
| Sprint review invite | Google Calendar event | delivery-manager-agent | Sprint planning completion | None (internal) |
| Sprint summary document | Google Drive (shared sprint folder) | delivery-manager-agent | Sprint end | None (internal) |
| Executive communication (internal) | Gmail draft → send | executive-communications-agent | On demand | None (internal) |
| Executive communication (external) | Gmail → external recipient | executive-communications-agent | On demand | H-016 |
| Customer incident notification | Gmail → customer | incident-manager-agent | P0/P1 customer impact | H-014 |
| Customer report/summary | Gmail → customer | customer-success-agent | QBR cadence | H-014 |
| Release announcement | Gmail → subscriber list | release-governance-agent | Release milestone | H-014 |
| Board pack (Drive link) | Gmail → board members | executive-communications-agent | Quarterly | H-016 |
| Vendor proposal response | Gmail → vendor | risk-management-agent | Procurement workflow | H-013 |

**Publishing Protocol:**
```yaml
google_workspace_publish:
  auth: Google OAuth 2.0 (service account with domain-wide delegation)
  gmail_send:
    method: Gmail API POST /users/me/messages/send
    format: RFC 2822 MIME message (base64url encoded)
    rate_limit: 100 recipients/day (free), 1500/day (Workspace)
    attachments: max 25MB per email
  calendar_create:
    method: Google Calendar API POST /calendars/{calendarId}/events
    format: Calendar event resource (RFC 3339 timestamps)
  drive_upload:
    method: Google Drive API POST /upload/drive/v3/files
    format: multipart/form-data (metadata + content)
    max_size: 5TB per file (Drive quota permitting)
  secret_path: vault://integrations/google-workspace/oauth-service-account
  rotation: 180 days (Google service account keys)
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Google | Google-to-OS | Conflict Resolution |
|-------|-------------|-------------|---------------------|
| Sprint calendar events | OS creates/updates events | Attendee responses → OS calendar state | Google Calendar wins (RSVP state) |
| Sprint summary docs | OS writes to Drive | Comments from collaborators → OS (not auto-synced) | OS owns doc; collaborators annotate in Drive |
| Email threads | OS sends; tracks sent state | Replies → ingested if labeled | Gmail wins (reply tracking) |
| OOO status | Not written by OS | Google Calendar OOO → OS capacity model | Google Calendar is authoritative for availability |
| Drive permissions | OS sets on publish | Not synced back | OS controls permissions at publish time |

**Sync frequency:** Real-time via push notifications for Gmail/Drive; daily poll for Calendar OOO status; event-driven for document changes.

**Source-of-truth designator:** Gmail is authoritative for email communication history. Google Calendar is authoritative for scheduled meetings and availability. Google Drive is authoritative for shared collaboration documents. OS wiki is authoritative for internal knowledge (Drive is the sharing layer, not the source).

---

## 4. Permissions

```yaml
google_workspace_permissions:
  auth_method: Google OAuth 2.0 (service account + domain-wide delegation)
  service_account: ai-os@company.iam.gserviceaccount.com
  gmail_scopes:
    - https://www.googleapis.com/auth/gmail.send         # Send email
    - https://www.googleapis.com/auth/gmail.readonly     # Read email
    - https://www.googleapis.com/auth/gmail.labels       # Create/apply labels
  calendar_scopes:
    - https://www.googleapis.com/auth/calendar.events    # Read/write events
    - https://www.googleapis.com/auth/calendar.readonly  # Read calendar
  drive_scopes:
    - https://www.googleapis.com/auth/drive.file         # Files created by app
    - https://www.googleapis.com/auth/drive.readonly     # Read all Drive files
  blocked_scopes:
    - https://www.googleapis.com/auth/gmail.compose      # Draft without send (use .send directly)
    - https://www.googleapis.com/auth/drive              # Full Drive access (use .file scope)
  secret_path: vault://integrations/google-workspace/service-account-key
  rotation: 180 days
  domain_delegation: required for user-impersonation in Gmail and Calendar
```

**Agent authorization matrix:**

| Agent | Google Workspace Permission | Operations |
|-------|---------------------------|------------|
| executive-communications-agent | Gmail send | Send executive/external emails (H-016 gated) |
| delivery-manager-agent | Calendar read/write, Drive write | Sprint invites, sprint docs |
| customer-success-agent | Gmail read + send (H-014 gated) | Customer email ingestion and response |
| incident-manager-agent | Gmail send (H-014 gated) | Customer incident notifications |
| compliance-documentation-agent | Drive read | Read compliance templates from Drive |
| release-governance-agent | Gmail send (H-014 gated) | Release announcements |
| All others | Drive read-only | Read shared documents |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|-----------------|----------------|
| Send internal Gmail (to @company.com) | None (agent autonomous) | — |
| Create internal Calendar event | None (agent autonomous) | — |
| Upload to internal Google Drive | None (agent autonomous) | — |
| Send Gmail to external customer | Human operator review | H-014 |
| Send Gmail to executive/investor | Human operator review | H-016 |
| Share Drive document externally | Human operator | H-014 |
| Send bulk email (> 50 recipients) | human-approval-governance-agent | H-018 |
| Access another user's Gmail via delegation | compliance-documentation-agent | H-020 (DSAR only) |
| Delete Drive document | Human operator | H-021 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: Google API Client Library (HTTPS REST)
  mcp_servers:
    gmail: mcp__claude_ai_Gmail (authenticate, complete_authentication, send, read)
    calendar: mcp__claude_ai_Google_Calendar (authenticate, complete_authentication, events)
    drive: mcp__claude_ai_Google_Drive (authenticate, complete_authentication, files)
  tools_available:
    - gmail_authenticate
    - gmail_send_email
    - gmail_read_messages
    - gmail_apply_label
    - calendar_create_event
    - calendar_list_events
    - drive_upload_file
    - drive_read_file
    - drive_list_files
    - drive_share_file
  connection_pool: 5 connections per service
  timeout: 30s (Drive uploads may use resumable upload for large files)
  retry_policy: exponential backoff (2s, 4s, 8s), max 3 retries, honor Retry-After headers
  circuit_breaker:
    threshold: 5 failures in 120s
    open_duration: 180s
    half_open_probe: 1 request per 60s
    fallback: queue outbound communications; alert artifact-publishing-agent
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| OAuth token expired | 401 response | Refresh access token using service account key | Automated refresh; alert if key expired |
| Gmail send failure | 5xx response | Retry x3; queue if persistent | Alert artifact-publishing-agent; draft saved |
| Rate limit (Gmail) | 429 / quotaExceeded | Delay 60s; exponential backoff | Queue remaining; spread over time |
| Drive upload failure | 5xx or timeout | Resume using resumable upload session ID | Resume from last byte on resumable upload |
| Calendar create failure | 4xx (invalid attendee) | Log error; create without invalid attendee; note | Alert delivery-manager-agent |
| Google Workspace outage | Health check failure | Queue all outbound comms | Flush queue on recovery; alert stakeholders |

**Degraded mode:** If Google Workspace unavailable > 10 min, outbound emails queued in `memory/events/gmail-send-queue.jsonl`. Drive uploads queued in `memory/events/drive-upload-queue.jsonl`. Calendar events queued in `memory/events/calendar-queue.jsonl`. Queues flushed on recovery in FIFO order. Compliance-sensitive emails flagged for human review before flush.

---

## 8. Observability

```yaml
observability:
  metrics:
    - gmail_send_success_rate:       target: "> 99.5%"
    - gmail_send_p95_latency:        target: "< 5s"
    - drive_upload_success_rate:     target: "> 99%"
    - calendar_api_success_rate:     target: "> 99.5%"
    - external_email_gate_compliance: target: "100% (every external email has H-014 or H-016 record)"
    - queue_depth_total:             target: "0 (alert if > 0 for > 5 min)"
  alerts:
    - condition: "gmail_send_success_rate < 99%"
      severity: HIGH
      notify: [artifact-publishing-agent, enterprise-systems-agent]
    - condition: "external_email_gate_compliance < 100%"
      severity: CRITICAL
      notify: [governance-org agents, compliance-documentation-agent]
      reason: every external email must be gated
    - condition: "circuit_breaker = OPEN"
      severity: HIGH
      notify: [artifact-publishing-agent]
  health_check:
    endpoint: GET https://www.googleapis.com/gmail/v1/users/me/profile
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Sent email (recall) | Gmail recall (Workspace) or follow-up correction email | executive-communications-agent | Within 30s (recall) or immediate correction |
| Calendar event created | DELETE /calendars/{id}/events/{eventId} | delivery-manager-agent | Anytime before event |
| Drive file uploaded (wrong version) | Upload corrected version; previous version in Drive history | artifact-publishing-agent | Anytime |
| Drive file shared externally | PATCH /files/{id}/permissions (revoke) | enterprise-systems-agent | Immediate |
| Bulk email sent (H-018 error) | Correction email sent to same list; escalate to H-018 authority | compliance-documentation-agent | Immediate |

**Rollback guarantee:** Drive maintains full version history. Calendar events are deletable. Email cannot be un-sent after delivery — correction/retraction emails are the rollback mechanism. All H-014 and H-016 events logged with pre-send audit record enabling reconstruction of what was sent.

---

## 10. Audience Adaptation

| Audience | Artifact | Format Adaptation |
|----------|----------|-------------------|
| Executive (internal) | Sprint velocity email | 3 bullet points: what shipped, what's next, risk flag |
| Executive (board) | Board update email | Formal tone, outcome-focused, numbered agenda, PDF attachment |
| Customer | Incident notification | Empathetic tone, no internal jargon, workaround, ETA |
| Customer | Release announcement | Benefit-led, feature highlights, no architecture detail |
| Engineer | Sprint invite | Technical detail, agenda, pre-read links |
| Vendor | Proposal response | Formal, precise, decision rationale, next steps |

audience-transformation-agent is invoked before every Gmail send to apply the correct audience profile. EXECUTIVE profile applies to all H-016-gated emails. CUSTOMER profile applies to all H-014-gated emails.

---

## 11. Governance

```yaml
governance:
  data_classification: CONFIDENTIAL
  pii_handling: >
    Gmail contains PII (sender names, email addresses, email content).
    Email content is processed in-session only; not written to OS memory (only metadata).
    External recipient email addresses stored only in send audit log (hashed).
    No email content forwarded to third-party systems without H-014 approval.
  retention_policy:
    send_audit_log: 3 years
    drive_files: per file type (compliance files = 7 years, sprint docs = 2 years)
    calendar_events: 1 year post-event
  access_review: quarterly (service account access, OAuth consent scope)
  data_residency: Google Workspace tenant region (must align with constitution ratification)
  compliance_requirements:
    - GDPR: email communication records, right to erasure applies to external contact PII
    - SOC_2_Type_II: access logs for Gmail service account
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every Gmail send (recipient domain, subject hash, agent, gate reference, timestamp)
    - Every external Gmail send (full audit: H-014/H-016 approval record, recipient, content hash)
    - Every Drive upload (file ID, path, size, agent, timestamp)
    - Every Drive permission grant (file ID, recipient, permission level, H-NNN gate)
    - Every Calendar event create/delete (event ID, attendees, agent, timestamp)
    - Every circuit breaker event and queue activation
  log_destination: integration audit log (hash-chained, append-only)
  log_path: memory/events/google-workspace-audit.jsonl
  retention: 1 year minimum (3 years for external communications)
  format:
    event_id: UUID v4
    timestamp: ISO 8601 UTC
    agent_id: requesting agent
    service: gmail | calendar | drive
    operation: API method + endpoint
    resource: message_id | event_id | file_id
    recipient_domain_hash: SHA-256 of recipient domain (not full address — PII protection)
    gate_reference: H-014 | H-016 | none
    result: success | failure | queued
    correlation_id: OS workflow execution ID
```
