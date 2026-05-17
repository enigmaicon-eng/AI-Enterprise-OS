---
integration: Microsoft Teams
category: communication
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: enterprise messaging (Microsoft ecosystem)
data-classification: INTERNAL
created: 2026-05-09
---

# Microsoft Teams Integration

> Teams is the enterprise messaging platform for Microsoft-ecosystem organizations. Mirrors Slack integration patterns with Teams-specific adaptations: Adaptive Cards (vs Slack Block Kit), Microsoft Graph API, Azure AD auth, and Teams bot framework. Used when organization uses Office 365 as primary productivity suite.

---

## 1. Ingestion Workflows

Same trigger model as Slack — explicit bot commands only:

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| `!incident` command | Teams bot command | incident-manager-agent |
| Bot mention with intent | @AI-OS [intent] | executive-orchestrator-agent |
| Approval response (Adaptive Card action) | Card submit action | human-approval-governance-agent |
| Alert acknowledgment | Card button click | incident-manager-agent |

---

## 2. Publishing Workflows

| OS Event | Teams Channel | Publishing Agent | Format |
|----------|--------------|-----------------|--------|
| P0/P1 Incident | General + IT Operations | incident-manager-agent | Adaptive Card with severity |
| Sprint summary | Engineering team channel | delivery-manager-agent | Adaptive Card summary |
| Release deployed | Releases channel | release-governance-agent | Deployment notification |
| Security alert | Security channel | security-engineer-agent | High-priority card |
| Approval requests | DM to approver | human-approval-governance-agent | Approval Adaptive Card |
| Weekly digest | General channel | organizational-learning-agent | Digest card |
| Risk escalations | Risk Management channel | risk-management-agent | Risk card |

---

## 3. Sync Systems

Same as Slack — notification channel only. Interactive Adaptive Card submissions sync approval state back to OS.

---

## 4. Permissions

```yaml
teams_permissions:
  auth_method: Azure AD OAuth 2.0 (Microsoft Graph API)
  app_registration: AI OS Bot (Azure AD App Registration)
  graph_api_permissions:
    - ChannelMessage.Send       # Post messages
    - Chat.ReadWrite            # DM capabilities
    - TeamsActivity.Send        # Activity notifications
    - User.Read.All             # User lookup for DMs
    - TeamMember.Read.All       # Channel membership
  bot_framework: Microsoft Bot Framework SDK
  secret_path: vault://integrations/teams/azure-app-credentials
  rotation: 90 days
  tenant_id: stored in config (not hardcoded)
```

---

## 5. Approval Boundaries

Same as Slack with Teams-specific note:
- Teams Adaptive Cards have built-in submit actions — responses captured via Bot Framework webhook
- All approval Adaptive Cards expire after 48h (Teams limitation)

---

## 6. Runtime Integration

```yaml
runtime:
  connector_type: Microsoft Graph API + Bot Framework
  mcp_wrapper: teams-mcp-server (custom built by connector-builder-agent)
  tools_available:
    - teams_send_message
    - teams_send_adaptive_card
    - teams_send_dm
    - teams_update_message
    - teams_get_channel
    - teams_get_user
  message_format: Adaptive Cards v1.5 (JSON)
  rate_limit: 50 requests/second (Graph API)
  circuit_breaker: standard pattern
```

**Adaptive Card format (OS standard):**
```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {"type": "TextBlock", "size": "Large", "weight": "Bolder", "text": "[Alert Title]"},
    {"type": "FactSet", "facts": [
      {"title": "Severity", "value": "[P0-P3]"},
      {"title": "Agent", "value": "[agent-id]"},
      {"title": "Time", "value": "[ISO 8601]"}
    ]},
    {"type": "TextBlock", "text": "[Detail text]", "wrap": true}
  ],
  "actions": [
    {"type": "Action.Submit", "title": "Acknowledge", "data": {"action": "ack", "alert_id": "[id]"}},
    {"type": "Action.OpenUrl", "title": "View Details", "url": "[wiki-link]"}
  ]
}
```

---

## 7-12. (Same patterns as Slack integration with Microsoft Graph API substituted for Slack API; Azure AD audit logs supplement OS audit trail)

---
