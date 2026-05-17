---
integration: XLSX (Microsoft Excel)
category: documents
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: document output format (not storage); exception: financial models (see §3)
data-classification: per-document classification
created: 2026-05-09
---

# XLSX Integration

> XLSX is used for structured data output: financial models, risk registers, metrics dashboards, OKR tracking, test matrices, and data exports. Unlike DOCX/PPTX, XLSX has a special exception: approved financial model workbooks maintained by finance-agent are source-of-truth documents (not derived artifacts). All other XLSX files are generated on-demand from OS structured data. openpyxl is the primary generation library.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Financial model submitted | Upload to SharePoint Finance folder | financial-modeling-agent |
| Risk register export | Upload to SharePoint Governance folder | risk-management-agent |
| Customer data export | Upload to SharePoint Intake folder | business-analyst-agent |
| Test matrix | Upload to SharePoint QA folder | qa-agent |
| Vendor pricing sheet | Upload to SharePoint Procurement folder | business-analyst-agent |

**XLSX ingestion:** Read XLSX → extract structured data per sheet → convert to OS markdown tables or JSON → store in wiki or memory. Formulas are noted as `[formula]` references. Structured data (tables, named ranges) are preserved as JSON datasets in memory/.

---

## 2. Publishing Workflows

| OS Artifact | XLSX Output | Publishing Agent | Destination |
|-------------|-------------|-----------------|-------------|
| Financial model | FinancialModel-[period].xlsx | financial-modeling-agent | SharePoint Finance (restricted) |
| OKR tracker | OKR-[quarter].xlsx | organizational-learning-agent | SharePoint Leadership |
| Risk register | RiskRegister.xlsx | risk-management-agent | SharePoint Governance |
| Sprint metrics | SprintMetrics-[sprint].xlsx | delivery-manager-agent | SharePoint Engineering |
| Test results matrix | TestMatrix-[release].xlsx | qa-agent | SharePoint QA |
| Audit data export | AuditData-[audit-id].xlsx | audit-readiness-agent | Secure SharePoint |
| Compliance data | ComplianceData-[period].xlsx | compliance-documentation-agent | SharePoint Compliance |
| Product metrics export | ProductMetrics-[period].xlsx | analytics-agent | SharePoint Analytics |

**Generation Pipeline:**
```
OS structured data (JSON/markdown tables)
  → data validation (schema check)
  → openpyxl workbook construction
  → Sheet layout per template (named ranges, column widths, headers)
  → Formulas applied (SUM, AVERAGE, conditional formatting)
  → Charts embedded (bar/line/pie via openpyxl chart module)
  → Password protection applied (if CONFIDENTIAL+)
  → MS Graph API upload to SharePoint
  → audit log entry
```

---

## 3. Sync Systems

**Special exception — Financial Models:**
Financial model workbooks maintained by finance-agent are bidirectionally tracked:
- OS pushes updated assumptions → financial model regenerated
- Human updates to financial model cells → extracted and synced to OS financial-data store
- Conflict rule: Human manual edits win; OS flags for review before next auto-generation

**All other XLSX:** Generated-only; external edits do NOT sync back. OS structured data remains master.

---

## 4. Permissions

```yaml
xlsx_permissions:
  generation_tool: openpyxl (primary) + xlsxwriter (charts)
  template_storage: vault://integrations/xlsx/templates/
  upload_auth: SharePoint OAuth (see sharepoint.md)
  financial_model_auth: finance-agent + H-003 for financial-classification workbooks
  password_protection: applied to CONFIDENTIAL+ workbooks (password in Vault)
  template_modification: design-systems-agent + finance-agent (for financial templates)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Generate XLSX from approved OS data | None (agent autonomous) |
| Publish XLSX to internal SharePoint | None |
| Financial model generation/publish | finance-agent review |
| Financial model publish externally | H-022 + human operator |
| Audit data export | audit-readiness-agent + H-026 |
| XLSX template modification (financial) | finance-agent + human operator review |
| Bulk data export > 10,000 rows | human operator review (data volume alert) |

---

## 6. Runtime Integration

```yaml
runtime:
  generation_method: openpyxl (primary) + xlsxwriter (advanced charts)
  mcp_tools_used:
    - sharepoint_upload_file          # Upload generated XLSX
    - gmail_attach_and_send           # Email with XLSX attachment
  templates:
    - templates/xlsx/financial-model.xlsx        # Financial: assumptions, P&L, cashflow, balance
    - templates/xlsx/risk-register.xlsx          # Risk: ID, description, likelihood, impact, mitigation
    - templates/xlsx/okr-tracker.xlsx            # OKR: objectives, KRs, progress, owners
    - templates/xlsx/sprint-metrics.xlsx         # Sprint: velocity, burndown, defects, DORA
    - templates/xlsx/test-matrix.xlsx            # QA: test cases, pass/fail, coverage
    - templates/xlsx/audit-data.xlsx             # Audit: findings, evidence, remediation
  excel_features_used:
    - named_ranges: true
    - conditional_formatting: true
    - data_validation: true
    - pivot_tables: false  # Generated via openpyxl; requires manual refresh
    - charts: true  # bar, line, pie, scatter
  sheet_protection: enabled for formula sheets; data-entry sheets unlocked
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| openpyxl generation error | Log error; export CSV as fallback; alert publishing agent |
| Template not found | Use default blank template; alert design-systems-agent |
| Data schema mismatch | Halt generation; return error to requesting agent; log schema diff |
| Upload to SharePoint fails | Queue for retry; follow SharePoint failure handling |
| XLSX corrupted (detected post-gen) | Regenerate; if repeated, alert connector-builder-agent |
| Formula error in workbook | Flag cell with error note; alert requesting agent |

---

## 8. Observability

```yaml
metrics:
  - xlsx_generation_success_rate     # target: > 99.5%
  - xlsx_generation_latency_p95      # target: < 30s
  - xlsx_template_version_currency   # all templates within 90 days of last review
  - financial_model_sync_drift       # target: < 1% data drift between OS and workbook
```

---

## 9. Rollback Systems

XLSX files are derived artifacts — rollback means regenerating from previous OS structured data version. Financial model exception: SharePoint version history used for workbook rollback. If published externally, follow email/SharePoint rollback protocols.

---

## 10. Audience Adaptation

| Audience | XLSX Template | Features |
|----------|--------------|----------|
| Finance/CFO | financial-model.xlsx | P&L, cashflow, balance sheet, scenario tabs |
| Executives | okr-tracker.xlsx | High-level KRs, summary tab, traffic lights |
| Engineering | sprint-metrics.xlsx | DORA metrics, velocity, burndown charts |
| QA | test-matrix.xlsx | Pass/fail counts, coverage %, defect density |
| Audit/Compliance | audit-data.xlsx | Formal evidence references, remediation tracking |
| Risk | risk-register.xlsx | Heatmap conditional formatting, mitigation status |

audience-transformation-agent selects template + configures visible sheets + hides internal formula sheets per audience.

---

## 11. Governance

```yaml
governance:
  sensitivity_labels: Applied per data classification (Microsoft Purview)
  version_tracking: OS data version embedded in workbook properties
  password_protection: CONFIDENTIAL+ workbooks password-protected; password in Vault
  financial_data:
    - RESTRICTED classification for financial forecasts before public disclosure
    - Access log required for all financial model downloads
  prohibited:
    - Customer PII in data exports without H-025 + anonymization
    - Unpublished financial forecasts without H-022
  metadata_fields:
    - Created by: AI OS [agent-id]
    - OS Data Version: [version]
    - Data Classification: [level]
    - Row Count: [n]
    - Review Date: [date]
```

---

## 12. Auditability

```yaml
audit:
  logged_per_generation:
    - agent_id: requesting agent
    - source_data_id: OS data reference
    - template_used: template name + version
    - timestamp: ISO 8601
    - destination: upload target or email reference
    - row_count: number of data rows
    - sheet_count: number of sheets
    - data_classification: applied classification
    - password_protected: boolean
  log_path: memory/events/xlsx-audit.jsonl
  retention: per artifact retention policy (minimum 1 year; financial docs 7 years)
```

---
