---
integration: Gmail
category: communication
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: external email communications
data-classification: INTERNAL / CONFIDENTIAL (email content)
created: 2026-05-09
---

# Gmail Integration

> Gmail is used for external email communications — executive briefs to external stakeholders, customer-facing incident notifications, compliance submissions, and regulatory correspondence. The OS publishes formatted email artifacts. Ingestion is limited to explicitly forwarded emails or OAuth-authorized mailbox reads for specific business processes.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Escalation email to ai-os mailbox | Email to monitored inbox | escalation-response-agent | Real-time |
| Regulatory response email | Email to compliance mailbox | compliance-governance-agent | Real-time |
| Customer feedback email | Email to feedback mailbox | customer-intelligence-agent | Daily digest |
| Approval reply from executive | Email reply to approval request | human-approval-governance-agent | Real-time |

**Ingestion restriction:** OS does NOT read general Gmail inboxes. Only designated monitored mailboxes are ingested. All ingestion requires explicit consent and is limited to specific mailbox addresses.

---

## 2. Publishing Workflows

| OS Artifact | Email Recipient | Publishing Agent | Trigger |
|-------------|----------------|-----------------|---------|
| Executive brief (external) | Board members, investors | executive-communications-agent-integration | Board cycle |
| Incident notification (external) | Affected customers, partners | incident-manager-agent | P0/P1 + H-014 |
| Compliance submission | Regulator | compliance-documentation-agent | Regulatory deadline + H-022 |
| Approval request | Human operator | human-approval-governance-agent | H-NNN triggered |
| Customer escalation response | Customer contact | escalation-response-agent | Escalation resolved |
| Release announcement | Customer distribution list | release-readiness-agent | Major release + H-022 |
| Weekly executive digest | Leadership team | organizational-learning-agent | Weekly |
| Audit package cover letter | External auditor | audit-readiness-agent | Audit engagement + H-026 |

---

## 3. Sync Systems

Email is NOT a sync target. Each email is a one-time publication event. Inbound replies create new ingestion events (not state sync).

Email thread tracking: OS stores message-id and thread-id for all sent emails to enable reply correlation.

---

## 4. Permissions

```yaml
gmail_permissions:
  auth_method: Google OAuth 2.0
  oauth_scopes:
    send_only_agents:
      - gmail.send              # Send emails (most OS agents)
    full_mailbox_agents:
      - gmail.readonly          # Read monitored mailbox (escalation, compliance agents)
      - gmail.labels            # Label processed emails
      - gmail.modify            # Mark as read, apply labels
  service_account: NOT used (Gmail requires delegated user credentials, not service accounts)
  delegated_user: ai-os-mailer@company.com (dedicated mailbox)
  secret_path: vault://integrations/gmail/oauth-token
  rotation: refresh token refreshed automatically; base token rotated 180 days
```

**CRITICAL permission constraint:** Gmail OAuth for send-only is sufficient for publication workflows. Mailbox read requires additional OAuth scope and is granted only to specific agents (escalation-response-agent, compliance-governance-agent) with human operator authorization.

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Send internal executive digest | executive-communications-agent review |
| Send external customer email | H-022 (external communication) |
| Send compliance submission | H-022 + compliance-governance-agent |
| Send incident disclosure | H-014 + human operator |
| Send to regulatory body | H-022 + human operator |
| Read recipient's mailbox | H-025 + human operator (almost never appropriate) |
| Send to distribution list > 100 recipients | Human operator review |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: gmail-mcp-server (Claude claude.ai Gmail MCP)
  tools_available:
    - gmail_send_email
    - gmail_draft_email       # Create draft for human review before send
    - gmail_list_messages     # Read monitored inbox (restricted agents only)
    - gmail_get_message       # Read specific email (restricted agents only)
    - gmail_modify_labels     # Label processed emails
    - gmail_search_messages   # Search in monitored inbox
  rate_limit: Gmail API quotas (250 quota units/user/second)
  email_format: HTML (primary) + plain text fallback (multipart MIME)
  draft_first_policy: All external emails created as draft → human reviews → sends
```

**Draft-first policy for external emails:**
All OS-generated emails to EXTERNAL recipients are created as Gmail drafts first. Human operator reviews and manually sends. Exceptions: automated compliance submissions with pre-approved templates (still logged for audit).

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Gmail API unavailable | Queue email; retry; if > 1h for critical → escalate to human for manual send |
| Authentication failure | Alert mcp-integration-agent; pause email publishing; rotate credentials |
| Delivery failure (bounce) | Alert publishing agent; log bounce; notify human for resolution |
| Rate limit exceeded | Queue + rate limiter; spread over next hour |
| Email too large | Compress attachments; split if needed; link to wiki for large reports |

---

## 8. Observability

```yaml
metrics:
  - gmail_send_success_rate    # target: > 99.5%
  - gmail_delivery_rate        # target: > 98% (monitoring bounce rate)
  - gmail_draft_review_time    # target: < 24h for external emails
  - gmail_api_latency_p95      # target: < 2s

alerts:
  - delivery_failure > 5 in 1h → HIGH → enterprise-systems-agent
  - draft_unreviewed > 24h → MEDIUM → executive-communications-agent-integration
  - authentication_failure → CRITICAL → mcp-integration-agent
```

---

## 9. Rollback Systems

Sent emails cannot be unsent. Recovery strategy:
1. **Gmail Undo Send** (30 second window, if Gmail configured): Not available for API-sent emails
2. **Follow-up email:** Send correction/retraction email to same recipients
3. **If sensitive data sent in error:** Follow data breach protocol → H-014 → human operator

**Pre-send checklist (automated):**
- Recipient domain check (internal vs. external)
- Data classification of attachment
- Template compliance check (no placeholder text)
- Human approval reference present (for H-NNN emails)

---

## 10. Audience Adaptation

| Recipient | Email Style | Length | Format |
|-----------|-------------|--------|--------|
| Board/Investors | Strategic, outcome-focused | < 500 words | HTML branded |
| Customers | Plain language, empathetic | < 300 words | HTML simple |
| Regulators | Formal, evidence-cited | As required | PDF attachment + cover email |
| Internal (digest) | Bullet points, scannable | < 1000 words | HTML digest |
| Human operator (approval) | Structured, decision-enabling | < 200 words | HTML with approve/reject links |

audience-transformation-agent applies EXEC or COMPLIANCE or CUSTOMER profile per recipient.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL → external emails become CONFIDENTIAL
  pii_handling:
    - Recipient addresses: encrypted in logs (SHA-256 hash stored)
    - Email content: not stored in OS beyond publication record (privacy)
    - Attachments: stored reference only (not file content)
  legal_hold: Legal hold emails archived to Google Vault (configured separately)
  data_residency: Google Workspace EU/US region (confirm with H-003)
  prohibited_content:
    - Unredacted PII sent externally without H-025
    - Financial forecasts without H-022
    - Security vulnerabilities without H-014
```

---

## 12. Auditability

```yaml
audit:
  logged_per_email:
    - sender: delegated account + requesting agent
    - recipients: hashed for privacy; raw stored for compliance
    - subject: stored
    - timestamp: ISO 8601
    - attachment_refs: filenames + hashes
    - approval_reference: H-NNN approval ID if applicable
    - draft_id: if draft-first flow used
    - delivery_status: API response
  log_path: memory/events/gmail-audit.jsonl
  retention: 7 years (email records for compliance)
  google_workspace_audit: Google Admin SDK Reports API for compliance-grade audit
```

---
