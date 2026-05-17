---
integration: Jira
category: project-management
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: issue-tracking, sprint-boards
data-classification: INTERNAL
created: 2026-05-09
---

# Jira Integration

> Jira is the source of truth for issue tracking, sprint boards, and project management. The OS reads sprint state from Jira and writes workflow outputs (new issues, epics, sprint updates) back to Jira. Bidirectional sync ensures OS sprint state matches Jira boards.

---

## 1. Ingestion Workflows

**What flows from Jira → OS:**

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| Sprint board state | Sprint start/end | delivery-manager-agent | Per sprint |
| Issue status changes | Webhook event | workflow-runtime-agent | Real-time |
| Epic completion | Epic closed | senior-pm-agent | Event-driven |
| Bug reports | Issue type = Bug, Priority = High/Critical | qa-agent | Real-time |
| Blocker issues | Issue status = Blocked | delivery-manager-agent | Real-time |
| Release version tags | Version released | release-governance-agent | Event-driven |
| Team velocity data | Sprint completed | delivery-manager-agent | Per sprint |

**Ingestion Protocol:**
```yaml
jira_ingestion:
  trigger: webhook (Jira → OS webhook endpoint)
  auth: Jira webhook secret validation
  payload_format: Jira Cloud REST API v3 event payload
  transformations:
    - map Jira issue fields → OS artifact schema
    - classify issue type → OS artifact type
    - extract sprint metadata → OS sprint state
  destination: event-bus topic `integration.jira.event`
  error_handling: dead-letter queue + retry x3 + alert enterprise-systems-agent
```

---

## 2. Publishing Workflows

**What flows from OS → Jira:**

| OS Artifact | Jira Destination | Publishing Agent | Trigger |
|-------------|-----------------|-----------------|---------|
| Feature from PRD | Epic + Story | delivery-manager-agent | G1 gate approval |
| Sprint plan | Jira sprint board | delivery-manager-agent | Sprint planning |
| Bug found in QA | Bug issue | qa-agent | G4 defect detection |
| Incident action item | Task assigned to team | incident-manager-agent | PIR completion |
| Architecture task from ADR | Technical task | distinguished-engineer-agent | ADR ratification |
| Risk mitigation task | Task | risk-management-agent | Risk register update |
| Dependency tracking | Linked issues | dependency-coordination-agent | Dependency identified |

**Publishing Protocol:**
```yaml
jira_publish:
  method: Jira REST API v3 POST/PUT
  auth: OAuth 2.0 with 3LO (3-legged OAuth)
  operations:
    create_issue: POST /rest/api/3/issue
    update_issue: PUT /rest/api/3/issue/{issueIdOrKey}
    add_comment: POST /rest/api/3/issue/{issueIdOrKey}/comment
    transition: POST /rest/api/3/issue/{issueIdOrKey}/transitions
    link_issues: POST /rest/api/3/issueLink
  rate_limit: 100 requests/min (Jira Cloud standard)
  idempotency: check for existing issue with OS reference key before create
```

---

## 3. Sync Systems

**Bidirectional sync rules:**

| State | OS-to-Jira | Jira-to-OS | Resolution on Conflict |
|-------|-----------|-----------|------------------------|
| Issue status | OS workflow state → Jira status | Jira status → OS workflow state | Jira wins (human-updated) |
| Sprint assignment | OS sprint plan → Jira sprint | Jira sprint → OS sprint state | Jira wins |
| Story points | OS estimate → Jira story points | Jira story points → OS velocity tracker | Jira wins |
| Issue assignee | OS assignment → Jira assignee | Jira assignee → OS responsibility map | Jira wins |

**Sync frequency:** Real-time (webhook) for status changes; hourly poll for sprint state; per-sprint bulk sync at sprint boundary.

**Source-of-truth designator:** Jira is authoritative for all issue state. OS derives its sprint model from Jira, not the reverse.

---

## 4. Permissions

```yaml
jira_permissions:
  oauth_scopes:
    - read:jira-work          # Read issue data
    - write:jira-work         # Create/update issues
    - read:jira-user          # Read user profiles for assignment
    - manage:jira-project     # Create sprints (delivery-manager-agent only)
  service_account: ai-os-jira-bot@company.atlassian.net
  minimum_project_role: Developer (for read/write)
  admin_operations: Project Admin role required (sprint creation, board config)
  secret_path: vault://integrations/jira/oauth-credentials
  rotation: 90 days
```

**Agent authorization matrix:**
| Agent | Jira Permission Level | Operations |
|-------|----------------------|------------|
| delivery-manager-agent | Developer + Sprint | Create/update issues, manage sprints |
| qa-agent | Developer | Create bugs, update status |
| senior-pm-agent | Developer | Create epics/stories, read |
| incident-manager-agent | Developer | Create tasks, add comments |
| risk-management-agent | Developer | Create tasks, add labels |
| All others | Read-only | Read issues, search |

---

## 5. Approval Boundaries

| Operation | Approval Required | H-NNN Reference |
|-----------|------------------|----------------|
| Create issue | None (agent autonomous) | — |
| Update issue status | None (agent autonomous) | — |
| Delete issue | human-approval-governance-agent | H-021 |
| Archive project | Human operator | H-024 |
| Change project permissions | Human operator | H-009 |
| Bulk update > 50 issues | human-approval-governance-agent review | H-018 |

---

## 6. Runtime Integration

```yaml
runtime:
  connection_type: MCP server (Jira MCP via mcp-integration-agent)
  mcp_server: jira-mcp-server
  tools_available:
    - jira_create_issue
    - jira_update_issue
    - jira_search_issues (JQL)
    - jira_add_comment
    - jira_get_sprint
    - jira_transition_issue
    - jira_get_board
  connection_pool: 5 connections max
  timeout: 10s per API call
  retry_policy: exponential backoff, max 3 retries, jitter
  circuit_breaker:
    threshold: 5 failures in 60s
    open_duration: 120s
    half_open_probe: 1 request
```

---

## 7. Failure Handling

| Failure Type | Detection | Response | Recovery |
|--------------|-----------|----------|---------|
| Jira API timeout | Response > 10s | Retry x3 with backoff | Queue for retry; alert if > 3 failures |
| Authentication failure | 401 response | Pause + alert mcp-integration-agent | Credential rotation check |
| Rate limit exceeded | 429 response | Exponential backoff; queue requests | Resume after rate window resets |
| Circuit breaker open | 5 failures/60s | Route to fallback; alert runtime-coordination-agent | Probe every 120s |
| Webhook delivery failure | Jira retry exhausted | Poll Jira API for missed events | Hourly reconciliation job |
| Data conflict on sync | Conflict detected | Log conflict; Jira wins; alert delivery-manager-agent | Manual resolution if repeated |

**Degraded mode:** If Jira unavailable > 15 min, OS sprint state operates from last known snapshot. Issues queue for sync when Jira recovers. Agents notified of degraded mode.

---

## 8. Observability

```yaml
observability:
  metrics:
    - jira_api_success_rate        # target: > 99.5%
    - jira_api_p95_latency         # target: < 2s
    - jira_webhook_delivery_rate   # target: > 99%
    - jira_sync_lag                # target: < 5 min
    - jira_circuit_breaker_trips   # target: 0 per week
  alerts:
    - condition: success_rate < 99%
      severity: HIGH
      notify: enterprise-systems-agent, runtime-coordination-agent
    - condition: circuit_breaker = OPEN
      severity: CRITICAL
      notify: incident-manager-agent, vp-engineering-agent
    - condition: sync_lag > 30 min
      severity: MEDIUM
      notify: delivery-manager-agent
  health_check:
    endpoint: GET /rest/api/3/serverInfo
    frequency: every 5 minutes
    timeout: 5s
```

---

## 9. Rollback Systems

| Operation | Rollback Method | Rollback Owner | Time Limit |
|-----------|----------------|----------------|-----------|
| Created issue | DELETE /rest/api/3/issue/{key} | delivery-manager-agent | 24h |
| Updated issue fields | Restore from OS pre-write snapshot | delivery-manager-agent | 24h |
| Status transition | Reverse transition via API | qa-agent / delivery-manager-agent | 1h |
| Sprint assignment | Remove from sprint via API | delivery-manager-agent | During sprint |
| Bulk update | Per-issue rollback from audit log | enterprise-systems-agent | 24h |

**Rollback guarantee:** All write operations to Jira are logged to the integration audit log with pre-write and post-write state. Rollback possible within 24h for any single operation.

---

## 10. Audience Adaptation

| Audience | Jira Artifact | Format Adaptation |
|----------|--------------|-------------------|
| Developers | Stories, bugs, tasks | Full technical detail, acceptance criteria, technical notes |
| PMs | Epics, stories, sprint board | Business language, success metrics, status |
| Executives | Epic summary, sprint velocity | KPI-focused, delivery timeline, business impact |
| Support | Bug tickets | Reproduction steps, workaround, customer impact |
| QA | Bug reports, test tasks | Test case reference, severity, affected version |

**Executive view:** delivery-manager-agent produces sprint summary from Jira data → formatted by audience-transformation-agent → EXEC profile applied.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL
  pii_handling: No PII in Jira (names only - employee directory data OK)
  retention_policy: 7 years (align with audit requirements)
  access_review: quarterly (who has what Jira access)
  data_residency: Jira Cloud (Atlassian-hosted) — confirm region with H-003 data residency check
  compliance_requirements:
    - SOC 2 Type II: Jira access logs required
    - ISO 27001: Access control review
  shadow_it_prevention: all Jira projects must be registered; unauthorized projects flagged
```

---

## 12. Auditability

```yaml
audit:
  what_is_logged:
    - Every Jira API write call (operation, payload, agent, timestamp)
    - Every webhook event received (event type, payload hash, processing result)
    - Every sync conflict and resolution
    - Every circuit breaker event
    - Every authentication event
  log_destination: integration audit log (hash-chained)
  log_path: memory/events/jira-audit.jsonl
  retention: 1 year minimum
  format:
    event_id: UUID
    timestamp: ISO 8601
    agent_id: requesting agent
    operation: API operation
    resource: Jira issue key or project key
    payload_hash: SHA-256 of payload
    result: success/failure/partial
    correlation_id: OS workflow execution ID
```

---
