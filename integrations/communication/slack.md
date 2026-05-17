---
integration: Slack
category: communication
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: team communications (ephemeral, not archived by OS)
data-classification: INTERNAL
created: 2026-05-09
---

# Slack Integration

> Slack is the primary real-time communication channel between the OS and human team members. The OS publishes notifications, alerts, summaries, and reports to Slack. Slack is NOT an ingestion source for structured data — only human messages that explicitly trigger OS actions are processed. All OS outputs are adapted for conversational format.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| `!incident [description]` command | Slash command or bot mention | incident-manager-agent | On demand |
| `!risk [description]` command | Slash command | risk-management-agent | On demand |
| Explicit bot mention with intent | @ai-os-bot [intent] | executive-orchestrator-agent | On demand |
| Alert acknowledgment | Interactive button click (ack button) | incident-manager-agent | On demand |
| Sprint feedback via bot | @ai-os-bot sprint feedback [text] | delivery-manager-agent | On demand |
| Escalation response | Human replies in incident thread | incident-manager-agent | On demand |

**Ingestion limitations:** Slack is NOT polled for general messages. Only explicit commands or bot mentions trigger OS actions. No passive message ingestion (privacy protection).

---

## 2. Publishing Workflows

| OS Event | Slack Channel/Recipient | Publishing Agent | Format |
|----------|------------------------|-----------------|--------|
| P0/P1 Incident alert | #incidents + on-call group | incident-manager-agent | Alert message + action buttons |
| Sprint started | #engineering | delivery-manager-agent | Sprint summary card |
| Sprint completed + velocity | #engineering | delivery-manager-agent | Velocity report |
| G1 PRD approved | #product | vp-product-agent | Approval notification |
| G7 Release approved | #releases | release-governance-agent | Release summary |
| Release deployed | #releases | rollout-governance-agent | Deployment status + rollout % |
| Security alert (High+) | #security | security-engineer-agent | Alert with severity |
| AI safety incident | #ai-safety | caio-agent | Safety alert |
| Risk escalation | #risk-management | risk-management-agent | Risk card |
| Daily/weekly digest | #ai-os-digest | organizational-learning-agent | Summary briefing |
| Cross-agent notifications | Direct message or channel | executive-orchestrator-agent | Contextual message |
| Gate approvals needed | DM to approver | human-approval-governance-agent | Approval request card |
| Hallucination detected | #ai-quality | hallucination-detection-agent | Quality alert |

---

## 3. Sync Systems

**Slack is NOT a sync target.** Messages are ephemeral. OS does not maintain bidirectional state sync with Slack. Slack is a notification channel only.

Exception: Interactive approvals — when human clicks "Approve" in a Slack message, the response updates OS state via callback.

```yaml
interactive_approval_sync:
  mechanism: Slack interactive payload → OS webhook endpoint
  endpoint: POST /integrations/slack/interactive
  validation: Slack signing secret verification
  state_update: human-approval-governance-agent processes response
  deduplication: action_id + message_ts checked for idempotency
```

---

## 4. Permissions

```yaml
slack_permissions:
  auth_method: OAuth 2.0 (Slack app with Bot Token)
  bot_token_scopes:
    - chat:write              # Post messages
    - chat:write.customize    # Custom username/icon per message type
    - channels:read           # List channels for routing
    - channels:join           # Join channels for posting
    - groups:read             # Private channel access
    - im:write                # Direct messages (for approval requests)
    - users:read              # User lookup for DM routing
    - commands                # Slash commands
    - app_mentions:read       # Bot mention handling
    - files:write             # Upload reports as files
    - reactions:write         # Add emoji reactions to messages
  secret_path: vault://integrations/slack/bot-token
  rotation: 180 days
```

**Channel-agent authorization matrix:**
| Channel | Writing Agents | Purpose |
|---------|---------------|---------|
| #incidents | incident-manager-agent, caio-agent | Incident coordination |
| #engineering | delivery-manager-agent, qa-agent, devops | Engineering status |
| #product | vp-product-agent, senior-pm-agent | Product updates |
| #security | security-engineer-agent, security-architect-agent | Security alerts |
| #ai-safety | caio-agent, ai-safety-governance-agent | AI safety events |
| #releases | release-governance-agent, rollout-governance-agent | Release tracking |
| #ai-os-digest | organizational-learning-agent | Daily OS digest |
| #risk-management | risk-management-agent | Risk alerts |
| DMs | human-approval-governance-agent | Approval requests |

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Post to any registered channel | None (agent autonomous per channel authorization) |
| Create new channel | Human operator (H-009) |
| Post to executive channels | executive-communications-agent review |
| DM to users | Limited to approval requests via human-approval-governance-agent |
| File upload to channel | Same as channel posting |
| @channel or @here mention | vp-engineering-agent or incident-manager-agent only (high-noise action) |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: slack-mcp-server
  tools_available:
    - slack_post_message
    - slack_update_message
    - slack_post_ephemeral
    - slack_upload_file
    - slack_add_reaction
    - slack_get_channel_info
    - slack_lookup_user
    - slack_open_modal
  message_format: Block Kit (rich formatting with sections, buttons, context blocks)
  rate_limit:
    web_api: 1 request/second per method
    incoming_webhooks: unlimited (for simple notifications)
  preferred_method: Bot API (not incoming webhooks - more features)
  circuit_breaker: 5 failures/60s → open 120s
```

**Message format standards:**
```json
{
  "blocks": [
    {"type": "header", "text": {"type": "plain_text", "text": "[Alert Type]: [Summary]"}},
    {"type": "section", "fields": [
      {"type": "mrkdwn", "text": "*Severity:* [P0-P3]"},
      {"type": "mrkdwn", "text": "*Agent:* [agent-id]"},
      {"type": "mrkdwn", "text": "*Time:* [ISO 8601]"}
    ]},
    {"type": "section", "text": {"type": "mrkdwn", "text": "[Detail text]"}},
    {"type": "actions", "elements": [
      {"type": "button", "text": {"type": "plain_text", "text": "Acknowledge"}, "action_id": "ack_alert"},
      {"type": "button", "text": {"type": "plain_text", "text": "View Details"}, "url": "[wiki-link]"}
    ]}
  ]
}
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Slack API unavailable | Queue messages; retry; fall back to email (Gmail/Outlook) for critical alerts |
| Channel not found | Alert enterprise-systems-agent; skip posting; log |
| Rate limit hit | Queue + rate limiter; spread messages over next window |
| Message too long | Truncate + add "View full report" link to wiki |
| Interactive callback timeout | Re-send approval request after 1h |
| Bot not in channel | Auto-join attempt; if fails, alert enterprise-systems-agent |

**Critical alert fallback:** P0/P1 incidents → Slack + PagerDuty (parallel) so single-channel failure cannot block incident response.

---

## 8. Observability

```yaml
metrics:
  - slack_message_delivery_rate     # target: > 99.5%
  - slack_api_latency_p95           # target: < 1s
  - slack_approval_response_time    # target: < 4h for H-NNN approvals
  - slack_interactive_callback_rate # target: > 90%

alerts:
  - delivery_rate < 99% → HIGH → enterprise-systems-agent
  - approval_pending > 4h → HIGH → human-approval-governance-agent escalation
```

---

## 9. Rollback Systems

Slack messages cannot be retracted without Slack admin permissions. Correction strategy:
1. Post corrective message in same thread immediately
2. Delete message (if within 30 min and bot has admin scope)
3. Pin correction message if original was pinned

**Pre-send validation:** All OS messages pass content review before posting. Critical alert messages require field validation (no empty severity, no placeholder text).

---

## 10. Audience Adaptation

All Slack messages adapted by audience-transformation-agent before posting:

| Channel Audience | Message Style | Length |
|-----------------|---------------|--------|
| Engineers (#engineering) | Technical, precise, includes metrics | Up to 500 words |
| Executives (exec channels) | Outcome-focused, no jargon | < 150 words |
| Incidents (#incidents) | Action-oriented, time-sensitive, clear severity | < 200 words + buttons |
| Product (#product) | Business language, feature impact | < 300 words |
| All (digest) | Summary format, multiple bullets | < 500 words |

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  no_pii_in_messages: enforced (names OK; no SSN, payment, health data)
  retention:
    slack_native: per Slack workspace plan (often 90 days free; unlimited Enterprise)
    os_audit_log: 1 year (OS-side log of what was published)
  prohibited_content:
    - Customer PII (use anonymized references only)
    - Unpublished financial data before disclosure
    - Security credentials or tokens (auto-redacted by connector)
  message_classification: All messages tagged with agent_id and classification level
```

---

## 12. Auditability

```yaml
audit:
  logged_per_message:
    - agent_id: sending agent
    - channel: destination
    - message_type: alert/notification/approval/digest
    - timestamp: ISO 8601
    - content_hash: SHA-256 of message text
    - delivery_status: success/failure
    - correlation_id: OS workflow execution ID
  log_path: memory/events/slack-audit.jsonl
  retention: 1 year
  slack_native: Slack Audit Logs API (Enterprise Grid) for compliance-grade audit trail
```

---
