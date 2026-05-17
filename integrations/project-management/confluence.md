---
integration: Confluence
category: project-management
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: documentation (mirror of OS wiki)
data-classification: INTERNAL
created: 2026-05-09
---

# Confluence Integration

> Confluence is the external mirror of the OS wiki. The OS wiki (`wiki/`) is the internal source of truth; Confluence receives published copies for human consumption. Publishing is one-way (OS → Confluence) for most content; ingestion brings in externally-authored content (stakeholder feedback, external wikis) back into the OS.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent | Frequency |
|-----------|---------|----------------|-----------|
| External stakeholder docs | Manual import request | knowledge-systems-agent | On-demand |
| Feedback comments on Confluence pages | Comment webhook | organizational-learning-agent | Real-time |
| External team wikis (non-OS teams) | Scheduled pull | knowledge-systems-agent | Weekly |
| Confluence page edit (OS-mirrored page) | Webhook | knowledge-systems-agent | Real-time (to detect drift) |

---

## 2. Publishing Workflows

| OS Artifact | Confluence Destination | Publishing Agent | Trigger |
|-------------|----------------------|-----------------|---------|
| Wiki articles (`wiki/`) | Matching Confluence space | knowledge-systems-agent | Wiki update in OS |
| ADRs | Architecture space > Decision Records | technical-documentation-agent | ADR ratified |
| Sprint plans | Engineering space > Sprints | delivery-manager-agent | Sprint started |
| Incident reports | Engineering space > Incidents | incident-manager-agent | PIR complete |
| Runbooks | Operations space > Runbooks | knowledge-systems-agent | Runbook updated |
| Compliance docs | Governance space (restricted) | compliance-documentation-agent | Compliance artifact produced |
| Release notes | Product space > Releases | release-readiness-agent | Release shipped |
| PRDs | Product space > Features | technical-documentation-agent | PRD approved G1 |
| Risk register | Governance space | risk-management-agent | Monthly |
| Agent org definitions | Engineering space > AI OS | knowledge-systems-agent | Agent definition updated |

**Publishing Protocol:**
```yaml
confluence_publish:
  method: Confluence REST API v2
  operations:
    create_page: POST /wiki/api/v2/pages
    update_page: PUT /wiki/api/v2/pages/{id}
    get_page: GET /wiki/api/v2/pages/{id}
    add_comment: POST /wiki/api/v2/footer-comments
  content_format: Confluence Storage Format (XHTML) or Markdown (auto-converted)
  version_tracking: increment page version on every update (Confluence native versioning)
  idempotency: search for existing page by title before create
```

---

## 3. Sync Systems

**Sync model:** OS wiki is MASTER; Confluence is REPLICA.

| Sync Direction | Trigger | Frequency |
|----------------|---------|-----------|
| OS wiki → Confluence | Wiki article updated | Within 1h of update |
| Confluence → OS | External edit detected (drift) | Real-time webhook → human review flag |
| Full reconciliation | Monthly | Monthly scheduled job |

**Conflict handling:** If Confluence page edited externally, detect drift → alert knowledge-systems-agent → human decides whether to accept external edit or overwrite with OS version. Default: OS version wins unless human overrides.

---

## 4. Permissions

```yaml
confluence_permissions:
  oauth_scopes:
    - read:confluence-content.all
    - write:confluence-content
    - read:confluence-space.summary
    - read:confluence-user
  space_permissions:
    product_space: ai-os-agent (Editor)
    engineering_space: ai-os-agent (Editor)
    governance_space: ai-os-agent (Contributor - restricted write)
    executive_space: ai-os-agent (Contributor - view only for most agents)
  secret_path: vault://integrations/confluence/oauth-credentials
  rotation: 90 days
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Create/update page in any space | None (agent autonomous for registered spaces) |
| Delete page | human-approval-governance-agent (H-021) |
| Change space permissions | Human operator (H-009) |
| Publish to restricted governance space | compliance-governance-agent review |
| Publish executive-space content | executive-communications-agent review |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: confluence-mcp-server
  tools_available:
    - confluence_create_page
    - confluence_update_page
    - confluence_get_page
    - confluence_search_content (CQL)
    - confluence_add_comment
    - confluence_get_space
  rate_limit: 1000 requests/hr (Confluence Cloud)
  circuit_breaker: 5 failures/60s → open 120s
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| API unavailable | Queue updates; retry when available; alert enterprise-systems-agent |
| Content format error | Log error; return to publishing agent for reformatting |
| Page conflict (concurrent edit) | OS version overwrites; log conflict to audit |
| Space not found | Alert knowledge-systems-agent; create space if authorized |

**Degraded mode:** OS wiki continues to operate independently. Confluence sync queued until service restores.

---

## 8. Observability

```yaml
metrics:
  - confluence_publish_success_rate  # target: > 99%
  - confluence_sync_lag              # target: < 1h
  - confluence_drift_detected_count  # informational
  - confluence_api_latency           # target: < 3s

alerts:
  - sync_lag > 4h → HIGH → knowledge-systems-agent
  - publish_failures > 5 in 1h → HIGH → enterprise-systems-agent
```

---

## 9. Rollback Systems

| Operation | Rollback Method |
|-----------|----------------|
| Page update | Restore previous version via Confluence page history API |
| Page creation | Archive page (soft delete) → human deletes |
| Bulk publish | Per-page version rollback via API |

**Confluence version history preserves all edits** — rollback is native. OS stores pre-publish content snapshot for cross-reference.

---

## 10. Audience Adaptation

| Space | Audience Profile | Transformation Applied |
|-------|-----------------|----------------------|
| Product space | Business (PMs, stakeholders) | Plain language, business outcomes |
| Engineering space | Technical (engineers, architects) | Full technical detail |
| Governance space | Compliance (auditors, legal) | Evidence-first, citations |
| Executive space | Exec | Strategic summary, no jargon |

audience-transformation-agent applies profile before publishing.

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL (default); RESTRICTED for governance space
  retention: Per Confluence admin settings; compliance docs 7 years
  access_review: quarterly
  content_policy:
    - No PII in publicly-accessible Confluence spaces
    - Legal-hold pages cannot be deleted without H-021 + H-024
    - All published content must originate from OS artifact (no unsourced content)
```

---

## 12. Auditability

Every Confluence API operation logged with: agent_id, page_id, operation, timestamp, content_hash, OS artifact reference. Confluence native audit log supplements OS audit log. Cross-reference possible via OS workflow execution ID embedded in page properties.

---
