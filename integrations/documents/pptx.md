---
integration: PPTX (Microsoft PowerPoint)
category: documents
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: document output format (not storage)
data-classification: per-document classification
created: 2026-05-09
---

# PPTX Integration

> PPTX is an output format for OS-generated presentations. The OS never stores PPTX as source of truth — all content originates in OS markdown artifacts and structured data. PPTX is generated on-demand for audiences that require PowerPoint format (board presentations, executive briefings, customer demos, regulatory submissions). Generated PPTX files are published to SharePoint, OneDrive, or emailed. Gamma MCP is the preferred AI-native generation path; python-pptx is the fallback for template-based generation.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| External PPTX submitted for review | Manual upload to monitored location | knowledge-systems-agent (extracts slide text + structure) |
| Customer demo deck | Uploaded to SharePoint intake folder | business-analyst-agent |
| Competitor deck (intel) | Uploaded to competitive-intel folder | competitive-intelligence-agent |

**PPTX ingestion:** Read PPTX content → extract text per slide → convert to OS markdown (slide-by-slide sections) → store in wiki. Images and charts are noted as `[image]`/`[chart]` references; text is preserved.

---

## 2. Publishing Workflows

| OS Artifact | PPTX Output | Publishing Agent | Destination |
|-------------|-------------|-----------------|-------------|
| Executive brief | ExecutiveBrief.pptx | executive-communications-agent-integration | OneDrive / Email attachment |
| Board update | BoardUpdate.pptx | executive-communications-agent-integration | SharePoint Board space |
| Sprint review deck | SprintReview.pptx | delivery-manager-agent | SharePoint Engineering |
| Architecture proposal | ArchProposal.pptx | architect-agent | SharePoint Architecture |
| Customer demo | CustomerDemo.pptx | business-analyst-agent | SharePoint Sales / Email |
| Compliance overview | ComplianceOverview.pptx | compliance-documentation-agent | SharePoint Compliance |
| Investor update | InvestorUpdate.pptx | executive-communications-agent-integration | Secure OneDrive (restricted) |
| QBR deck | QBR.pptx | organizational-learning-agent | SharePoint Leadership |

**Generation Pipeline (Gamma MCP — preferred):**
```
OS artifact (markdown + structured data)
  → audience-transformation-agent (audience profile + slide count limit)
  → gamma-mcp-server (generate_presentation with theme + content)
  → Export to PPTX (Gamma export API)
  → MS Graph API upload to SharePoint/OneDrive
  → audit log entry
```

**Generation Pipeline (python-pptx — fallback):**
```
OS artifact (markdown)
  → audience-transformation-agent (audience profile applied)
  → PPTX template selection (per artifact type)
  → python-pptx generation (slide-by-slide construction)
  → Embed charts (matplotlib → image → slide)
  → MS Graph API upload or email attachment
  → audit log entry
```

---

## 3. Sync Systems

PPTX files are generated from OS artifacts — they are NOT sync targets. If a PPTX is modified externally, the modification does NOT flow back to the OS. The OS artifact (markdown) remains the source of truth.

Re-generation policy: Any modification request to a PPTX → modify OS artifact → regenerate PPTX → republish.

---

## 4. Permissions

```yaml
pptx_permissions:
  generation_tool_primary: Gamma MCP (gamma-mcp-server)
  generation_tool_fallback: python-pptx (local)
  template_storage: vault://integrations/pptx/templates/
  upload_auth: SharePoint OAuth + OneDrive OAuth (see sharepoint.md, office365.md)
  email_attach_auth: Gmail/Outlook OAuth (see email integrations)
  gamma_auth: Gamma API key (vault://integrations/gamma/api-key)
  template_modification: design-systems-agent only (requires approval)
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Generate PPTX from approved artifact | None (agent autonomous) |
| Publish PPTX to internal SharePoint | None |
| Publish PPTX externally (email/OneDrive share) | Per email integration approval rules (H-022) |
| Board/investor presentation | executive-communications-agent review + H-022 |
| PPTX template modification | design-systems-agent + human operator review |
| Regulatory presentation | compliance-governance-agent + H-022 |

---

## 6. Runtime Integration

```yaml
runtime:
  generation_method_primary: Gamma MCP (AI-native slide generation)
  generation_method_fallback: python-pptx (template-based)
  mcp_tools_used:
    - gamma_generate                  # Generate presentation from content
    - gamma_generate_from_template    # Template-based generation
    - gamma_get_themes                # Retrieve available themes
    - sharepoint_upload_file          # Upload generated PPTX
    - gmail_attach_and_send           # Email with PPTX attachment
    - outlook_send_email              # Outlook email with attachment
  templates:
    - templates/pptx/executive-10-slide.pptx    # Max 10 slides — board/executive
    - templates/pptx/technical-deck.pptx        # Unlimited slides — technical
    - templates/pptx/customer-demo.pptx         # 15 slides — customer facing
    - templates/pptx/compliance-briefing.pptx   # Formal style, numbered slides
    - templates/pptx/investor-update.pptx       # Financial style, data-heavy
  slide_count_limits:
    executive: 10
    board: 8
    customer: 15
    technical: unlimited
    compliance: unlimited
  watermarking: DRAFT watermark applied until artifact reaches APPROVED state
  chart_embedding: matplotlib-generated PNG charts embedded per slide
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Gamma MCP unavailable | Fall back to python-pptx template generation |
| python-pptx generation error | Log error; return markdown artifact as fallback; alert publishing agent |
| Template not found | Use default executive template; alert design-systems-agent |
| Chart generation fails | Insert placeholder slide; note missing chart; alert requesting agent |
| Upload to SharePoint fails | Queue for retry; follow SharePoint failure handling |
| PPTX corrupted (detected post-gen) | Regenerate; if repeated, alert connector-builder-agent |

---

## 8. Observability

```yaml
metrics:
  - pptx_generation_success_rate     # target: > 99%
  - pptx_generation_latency_p95      # target: < 60s (Gamma); < 120s (python-pptx)
  - gamma_mcp_usage_rate             # target: > 80% of generations use Gamma
  - pptx_template_version_currency   # all templates within 90 days of last review
```

---

## 9. Rollback Systems

PPTX files are derived artifacts — rollback means regenerating from the previous OS artifact version. No PPTX-specific rollback needed. If published externally, follow email/SharePoint rollback protocols.

---

## 10. Audience Adaptation

| Audience | PPTX Template | Slide Limit | Styles Applied |
|----------|--------------|-------------|---------------|
| Board | executive-10-slide.pptx | 8 slides | Large visuals, outcome metrics, minimal text |
| Executive | executive-10-slide.pptx | 10 slides | Summary tables, key decisions, no jargon |
| Investors | investor-update.pptx | 12 slides | Financial charts, growth metrics, formal |
| Technical | technical-deck.pptx | Unlimited | Architecture diagrams, code blocks, detailed |
| Customers | customer-demo.pptx | 15 slides | Product screenshots, benefit-focused, branded |
| Regulatory | compliance-briefing.pptx | Unlimited | Numbered, formal citations, evidence appendix |

audience-transformation-agent selects template + applies slide count limit + adapts language register before generation.

---

## 11. Governance

```yaml
governance:
  sensitivity_labels: Applied per data classification (Microsoft Purview labels on PPTX)
  version_tracking: OS artifact version embedded in PPTX properties
  watermarking:
    DRAFT: applied until artifact = APPROVED state
    CONFIDENTIAL: restricted-classification presentations
    DO NOT DISTRIBUTE: pre-disclosure investor/regulatory materials
  metadata_fields:
    - Created by: AI OS [agent-id]
    - OS Artifact ID: [artifact-id]
    - Data Classification: [level]
    - Slide Count: [n]
    - Generation Method: Gamma | python-pptx
    - Review Date: [date]
  prohibited:
    - Unpublished financial forecasts without H-022
    - Customer PII in slides without H-025
```

---

## 12. Auditability

```yaml
audit:
  logged_per_generation:
    - agent_id: requesting agent
    - source_artifact_id: OS artifact reference
    - template_used: template name + version OR gamma theme
    - generation_method: Gamma | python-pptx
    - timestamp: ISO 8601
    - destination: upload target or email reference
    - slide_count: number of slides generated
    - data_classification: applied classification
  log_path: memory/events/pptx-audit.jsonl
  retention: per artifact retention policy (minimum 1 year; board/investor decks 7 years)
```

---
