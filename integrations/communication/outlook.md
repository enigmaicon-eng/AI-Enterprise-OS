---
integration: Microsoft Outlook / Exchange
category: communication
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: enterprise email (Microsoft ecosystem)
data-classification: INTERNAL / CONFIDENTIAL
created: 2026-05-09
---

# Microsoft Outlook Integration

> Outlook is the enterprise email platform for Microsoft-ecosystem organizations. Mirrors Gmail integration patterns with Outlook/Exchange-specific adaptations: Microsoft Graph API, Azure AD auth, calendar integration, and Exchange Online compliance features. Used when organization uses Office 365/Microsoft 365 as primary productivity suite.

---

## 1. Ingestion Workflows

Same as Gmail — monitored mailboxes only:

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Escalation to monitored inbox | Email to ai-os@company.com | escalation-response-agent |
| Approval reply | Email reply with [APPROVE/REJECT] keyword | human-approval-governance-agent |
| Compliance mailbox | Regulatory response emails | compliance-governance-agent |
| Calendar event (meeting context) | Graph API calendar read | delivery-manager-agent (sprint ceremonies) |

---

## 2. Publishing Workflows

Same trigger events as Gmail with Outlook-specific output format:

| OS Artifact | Outlook Destination | Publishing Agent | Additional Feature |
|-------------|-------------------|-----------------|-------------------|
| Executive brief | External stakeholder email | executive-communications-agent-integration | Outlook read receipt tracking |
| Approval request | Human operator DM | human-approval-governance-agent | Calendar invite for time-boxed approvals |
| Sprint ceremony invites | Calendar invites | delivery-manager-agent | Outlook calendar via Graph API |
| Compliance submission | Regulator email | compliance-documentation-agent | Sensitivity label applied |
| Incident notification | Affected parties | incident-manager-agent | High importance flag |

---

## 3. Sync Systems

No sync. Email is event-based. Calendar invites sync bidirectionally with Graph API.

---

## 4. Permissions

```yaml
outlook_permissions:
  auth_method: Azure AD OAuth 2.0 (Microsoft Graph API)
  app_registration: AI OS Email Bot (Azure AD)
  graph_api_permissions:
    - Mail.Send               # Send emails
    - Mail.ReadWrite          # Read + label monitored inbox
    - Calendars.ReadWrite     # Create/read calendar events (delivery-manager-agent)
    - User.Read.All           # Resolve recipient info
  delegated_vs_application:
    send_emails: Delegated (on behalf of ai-os-mailer@company.com)
    read_monitored_inbox: Application (service-to-service)
  sensitivity_labels: Apply Microsoft Purview sensitivity labels to emails
  secret_path: vault://integrations/outlook/azure-app-credentials
  rotation: 90 days
```

---

## 5-9. (Same approval boundaries, runtime, failure handling, observability, and rollback as Gmail with Microsoft Graph API substituted; Exchange Online compliance features supplement OS audit)

---

## 6. Runtime Integration — Outlook-specific

```yaml
runtime:
  mcp_server: outlook-mcp-server (Microsoft Graph MCP via connector-builder-agent)
  tools_available:
    - outlook_send_email
    - outlook_create_draft
    - outlook_send_calendar_invite
    - outlook_get_calendar_events
    - outlook_list_messages        # Monitored inbox only
    - outlook_apply_sensitivity_label
  sensitivity_labels:
    - General: internal OS communications
    - Confidential: executive and compliance comms
    - Highly Confidential: regulatory submissions
  read_receipt: enabled for external emails (informational only; not enforced)
```

---

## 10. Audience Adaptation

Same as Gmail. Additional Outlook feature: Sensitivity labels applied per audience:
- Internal: General label
- Executive external: Confidential label  
- Regulatory: Highly Confidential label + encryption

---

## 11-12. (Same governance and auditability as Gmail with Microsoft Purview Audit and Exchange Online audit log supplementing OS audit)

---
