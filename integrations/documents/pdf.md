---
integration: PDF
category: documents
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: document output format (not storage)
data-classification: per-document classification
created: 2026-05-09
---

# PDF Integration

> PDF is the immutable, finalized output format for OS-generated documents requiring permanence, digital signature, or regulatory submission. PDF is generated from OS markdown artifacts or from finalized DOCX/PPTX. Once generated, a PDF is considered a sealed artifact — it is NOT editable and NOT re-synced. Used for compliance submissions, legal agreements, audit packages, regulatory filings, signed contracts, and external-facing formal documents. WeasyPrint (markdown → PDF) and LibreOffice/pandoc (DOCX → PDF) are the primary generation methods.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| External PDF submitted for review | Manual upload to monitored location | knowledge-systems-agent (OCR + text extract) |
| Legal agreement PDF | Uploaded to SharePoint Legal folder | compliance-documentation-agent |
| Regulatory submission PDF | Uploaded to Compliance mailbox | compliance-governance-agent |
| Vendor contract PDF | Uploaded to SharePoint Procurement | business-analyst-agent |
| Audit evidence PDF | Uploaded to SharePoint Audit folder | audit-readiness-agent |

**PDF ingestion:** Read PDF → OCR (if scanned) via pytesseract / pdfminer → extract text → convert to OS markdown → store in wiki. Tables and structured data are best-effort converted; complex layouts flagged for human review.

---

## 2. Publishing Workflows

| OS Artifact | PDF Output | Publishing Agent | Destination |
|-------------|------------|-----------------|-------------|
| Compliance report | ComplianceReport-[period].pdf | compliance-documentation-agent | SharePoint Compliance + Email to regulator |
| Audit package | AuditPackage-[audit-id].pdf | audit-readiness-agent | Secure SharePoint + External auditor email |
| Legal agreement | Agreement-[id].pdf | compliance-documentation-agent | SharePoint Legal (restricted) |
| Risk assessment | RiskAssessment-[id].pdf | risk-management-agent | SharePoint Governance |
| SOP document | SOP-[name].pdf | sop-management-agent | SharePoint Operations |
| Executive brief (sealed) | ExecutiveBrief-[date].pdf | executive-communications-agent-integration | Email / OneDrive |
| Regulatory filing | RegulatoryFiling-[ref].pdf | compliance-documentation-agent | Regulator portal + email |
| Signed agreement | SignedAgreement-[id].pdf | compliance-documentation-agent | SharePoint Legal |

**Generation Pipeline (markdown → PDF):**
```
OS artifact (markdown)
  → audience-transformation-agent (audience profile applied)
  → WeasyPrint (markdown → HTML → PDF with CSS styling)
  → Digital signature application (if required)
  → PDF/A conversion (for archival-grade compliance docs)
  → Watermark application (DRAFT / CONFIDENTIAL)
  → Upload to SharePoint or email attachment
  → audit log entry
```

**Generation Pipeline (DOCX → PDF):**
```
Generated DOCX artifact
  → LibreOffice headless (DOCX → PDF) OR pandoc
  → Digital signature application (if required)
  → MS Graph API upload
  → audit log entry
```

---

## 3. Sync Systems

PDF is a sealed format — NO sync. PDFs are never updated in place. Any change requires:
1. Modify OS markdown artifact
2. Regenerate PDF with new version number
3. Republish as new PDF
4. Archive old PDF with `SUPERSEDED` metadata tag

Signed PDFs: Once a digital signature is applied, the PDF is cryptographically immutable. New version requires new signature.

---

## 4. Permissions

```yaml
pdf_permissions:
  generation_tool_primary: WeasyPrint (markdown → HTML → PDF)
  generation_tool_docx_conversion: LibreOffice headless / pandoc
  digital_signature: PyHanko (PDF digital signatures)
  signature_certificate: vault://integrations/pdf/signing-certificate
  template_storage: vault://integrations/pdf/css-templates/
  upload_auth: SharePoint OAuth (see sharepoint.md)
  email_attach_auth: Gmail/Outlook OAuth (see email integrations)
  ocr_tool: pdfminer + pytesseract (for scanned PDF ingestion)
  pdfa_conversion: enabled for archival documents (PDF/A-2b standard)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Generate PDF from approved artifact | None (agent autonomous) |
| Publish PDF to internal SharePoint | None |
| Publish PDF externally (email) | Per email integration approval rules (H-022) |
| Apply digital signature | compliance-governance-agent + H-022 |
| Regulatory filing PDF | compliance-governance-agent + H-022 + human operator |
| Legal agreement PDF | compliance-documentation-agent + H-022 |
| Audit package PDF | audit-readiness-agent + H-026 |
| PDF template (CSS) modification | design-systems-agent + human operator review |

---

## 6. Runtime Integration

```yaml
runtime:
  generation_method_primary: WeasyPrint (markdown → PDF)
  generation_method_secondary: LibreOffice headless (DOCX → PDF)
  digital_signature: PyHanko with qualified certificate
  mcp_tools_used:
    - sharepoint_upload_file          # Upload generated PDF
    - gmail_attach_and_send           # Email with PDF attachment
    - outlook_send_email              # Outlook email with PDF attachment
  css_templates:
    - templates/pdf/executive.css         # Clean, branded, large headings
    - templates/pdf/compliance.css        # Formal, paragraph numbered, footer refs
    - templates/pdf/legal.css             # Legal style, line numbers, clause structure
    - templates/pdf/technical.css         # Code blocks, TOC, technical captions
    - templates/pdf/regulatory.css        # Official letterhead, formal citations, PDF/A
  pdf_features:
    watermarking: true               # DRAFT / CONFIDENTIAL / DO NOT DISTRIBUTE
    digital_signature: conditional   # Required for legal, regulatory PDFs
    pdfa_conversion: conditional     # Required for archival documents
    encryption: conditional          # RESTRICTED+ classification
    page_numbering: true
    table_of_contents: conditional   # Enabled for docs > 10 pages
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| WeasyPrint generation error | Fall back to LibreOffice DOCX → PDF conversion |
| LibreOffice conversion error | Log error; return markdown as fallback; alert publishing agent |
| Digital signature application fails | Halt publication; alert compliance-governance-agent; do NOT publish unsigned |
| PDF/A conversion fails | Log; publish standard PDF; flag for manual PDF/A conversion review |
| OCR failure (scanned PDF ingestion) | Flag as low-confidence extract; route to human for review |
| Upload to SharePoint fails | Queue for retry; follow SharePoint failure handling |
| PDF corrupted (detected post-gen) | Regenerate; if repeated, alert connector-builder-agent |

---

## 8. Observability

```yaml
metrics:
  - pdf_generation_success_rate      # target: > 99.5%
  - pdf_generation_latency_p95       # target: < 45s
  - pdf_signature_success_rate       # target: 100% (zero unsigned legal/regulatory PDFs published)
  - pdf_ocr_confidence_rate          # target: > 95% confidence on ingested PDFs
  - pdfa_conversion_rate             # target: 100% for archival-grade docs
```

---

## 9. Rollback Systems

PDFs are sealed artifacts — rollback = regeneration from previous OS artifact version + republication as new version. Superseded PDFs archived with `SUPERSEDED` metadata. Signed PDFs cannot be invalidated in-place; new version with new signature is required. If published externally, follow email/SharePoint rollback protocols.

---

## 10. Audience Adaptation

| Audience | PDF Template | Features |
|----------|-------------|----------|
| Executive | executive.css | Clean layout, branded header, summary sections |
| Legal/Compliance | legal.css | Line numbers, clause structure, formal style |
| Regulatory | regulatory.css | Official letterhead, formal citations, PDF/A format |
| Technical | technical.css | Code blocks, TOC, technical captions, appendices |
| Audit | compliance.css | Paragraph numbering, evidence references, page refs |

audience-transformation-agent selects CSS template + enables PDF features (signature, PDF/A, encryption) per audience and classification before generation.

---

## 11. Governance

```yaml
governance:
  immutability: PDFs treated as immutable once generated; changes require new version
  version_control:
    - Version number embedded in filename: [document]-v[major].[minor].pdf
    - Previous versions archived with SUPERSEDED tag
  sensitivity_labels: Applied per data classification
  watermarking:
    DRAFT: applied until artifact = APPROVED state
    CONFIDENTIAL: restricted-classification docs
    DO NOT DISTRIBUTE: regulatory pre-submission docs
  digital_signature:
    required_for: legal agreements, regulatory filings, audit packages
    certificate: qualified electronic signature (vault://integrations/pdf/signing-certificate)
  encryption:
    RESTRICTED+: AES-256 encryption applied; password in Vault
  metadata_fields:
    - Created by: AI OS [agent-id]
    - OS Artifact ID: [artifact-id]
    - Data Classification: [level]
    - Version: [version]
    - Signed: true/false
    - PDF/A: true/false
    - Review Date: [date]
```

---

## 12. Auditability

```yaml
audit:
  logged_per_generation:
    - agent_id: requesting agent
    - source_artifact_id: OS artifact reference
    - css_template_used: template name + version
    - generation_method: WeasyPrint | LibreOffice
    - timestamp: ISO 8601
    - destination: upload target or email reference
    - page_count: number of pages
    - data_classification: applied classification
    - signed: boolean
    - pdfa: boolean
    - encrypted: boolean
    - document_hash: SHA-256 of generated PDF (integrity verification)
  log_path: memory/events/pdf-audit.jsonl
  retention: per artifact retention policy (minimum 7 years for legal/regulatory PDFs)
  integrity_check: Document hash logged at generation; re-verified on access
```

---
