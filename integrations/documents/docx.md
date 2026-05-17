---
integration: DOCX (Microsoft Word)
category: documents
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: document output format (not storage)
data-classification: per-document classification
created: 2026-05-09
---

# DOCX Integration

> DOCX is an output format for OS-generated documents. The OS never stores DOCX as source of truth — all content originates in OS markdown artifacts. DOCX is generated on-demand from OS artifacts for audiences that require Word format (legal teams, executives, clients, regulators). Generated DOCX files are published to SharePoint or emailed.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| External DOCX submitted for review | Manual upload to monitored location | knowledge-systems-agent (extracts content) |
| Legal document in DOCX | Uploaded to SharePoint legal folder | compliance-documentation-agent |
| Customer-provided requirements doc | Uploaded to SharePoint intake folder | business-analyst-agent |

**DOCX ingestion:** Read DOCX content → extract text → convert to OS markdown → store in wiki. Formatting is stripped; content is preserved.

---

## 2. Publishing Workflows

| OS Artifact | DOCX Output | Publishing Agent | Destination |
|-------------|-------------|-----------------|-------------|
| PRD | PRD.docx | technical-documentation-agent | SharePoint Product space |
| Contract/Agreement | Contract.docx | compliance-documentation-agent | SharePoint Legal (restricted) |
| Executive brief | Brief.docx | executive-communications-agent-integration | Email attachment / OneDrive |
| Compliance report | ComplianceReport.docx | compliance-documentation-agent | SharePoint Compliance |
| Audit package docs | AuditDocs.docx | audit-readiness-agent | Secure SharePoint |
| Risk register | RiskRegister.docx | risk-management-agent | SharePoint Governance |
| SOP documents | SOP-[name].docx | sop-management-agent | SharePoint Operations |

**Generation Pipeline:**
```
OS artifact (markdown) 
  → audience-transformation-agent (audience profile applied)
  → DOCX template selection (per artifact type)
  → pandoc conversion (markdown → DOCX with template)
  → MS Graph API upload to SharePoint / attach to email
  → audit log entry
```

---

## 3. Sync Systems

DOCX files are generated from OS artifacts — they are NOT sync targets. If a DOCX is modified externally, the modification does NOT flow back to the OS. The OS artifact (markdown) remains the source of truth.

Re-generation policy: Any modification request to a DOCX → modify OS artifact → regenerate DOCX → republish.

---

## 4. Permissions

```yaml
docx_permissions:
  generation_tool: pandoc (local) + python-docx (for template customization)
  template_storage: vault://integrations/docx/templates/
  upload_auth: SharePoint OAuth (see sharepoint.md)
  email_attach_auth: Gmail/Outlook OAuth (see email integrations)
  template_modification: design-systems-agent only (DOCX template changes require approval)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Generate DOCX from approved artifact | None (agent autonomous) |
| Publish DOCX to SharePoint | None (per SharePoint integration rules) |
| Publish DOCX externally (email) | Per email integration approval rules |
| DOCX template modification | design-systems-agent + human operator review (H-003 equivalent) |
| Legal document DOCX | compliance-governance-agent review + H-022 |

---

## 6. Runtime Integration

```yaml
runtime:
  generation_method: pandoc (markdown → DOCX with reference.docx template)
  python_docx: for programmatic template customization when needed
  mcp_tools_used:
    - sharepoint_upload_file      # Upload generated DOCX
    - gmail_attach_and_send       # Email with DOCX attachment
  templates:
    - templates/docx/prd-template.docx
    - templates/docx/executive-brief.docx
    - templates/docx/compliance-report.docx
    - templates/docx/risk-register.docx
    - templates/docx/sop-template.docx
  watermarking: DRAFT watermark applied until artifact reaches APPROVED state
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| pandoc conversion error | Log error; return markdown artifact as fallback; alert publishing agent |
| Template not found | Use default template; alert design-systems-agent |
| Upload to SharePoint fails | Queue for retry; follow SharePoint failure handling |
| DOCX corrupted (detected post-gen) | Regenerate; if repeated, alert connector-builder-agent |

---

## 8. Observability

```yaml
metrics:
  - docx_generation_success_rate    # target: > 99.5%
  - docx_generation_latency_p95     # target: < 30s
  - docx_template_version_currency  # all templates within 90 days of last review
```

---

## 9. Rollback Systems

DOCX files are derived artifacts — rollback means regenerating from the previous OS artifact version. No DOCX-specific rollback needed. If published externally, follow email/SharePoint rollback protocols.

---

## 10. Audience Adaptation

| Audience | DOCX Template | Styles Applied |
|----------|--------------|---------------|
| Executive | executive-brief.docx | Large font, summary tables, minimal text |
| Legal/Compliance | compliance-report.docx | Formal style, paragraph numbering, page refs |
| Technical | prd-template.docx | Code blocks, table-of-contents, technical captions |
| Regulatory | regulatory-submission.docx | Official letterhead, formal citations |

audience-transformation-agent selects template + applies profile before generation.

---

## 11. Governance

```yaml
governance:
  sensitivity_labels: Applied per data classification (DOCX supports Microsoft Purview labels)
  version_tracking: OS artifact version embedded in DOCX properties (Custom XML Part)
  watermarking:
    DRAFT: applied until artifact = APPROVED state
    CONFIDENTIAL: applied to restricted-classification documents
    DO NOT DISTRIBUTE: applied to regulatory pre-submission docs
  metadata_fields:
    - Created by: AI OS [agent-id]
    - OS Artifact ID: [artifact-id]
    - Data Classification: [level]
    - Review Date: [date]
```

---

## 12. Auditability

```yaml
audit:
  logged_per_generation:
    - agent_id: requesting agent
    - source_artifact_id: OS artifact reference
    - template_used: template name + version
    - timestamp: ISO 8601
    - destination: upload target or email reference
    - data_classification: applied classification
  log_path: memory/events/docx-audit.jsonl
  retention: per artifact retention policy (minimum 1 year; compliance docs 7 years)
```

---
