---
integration: Gamma
category: design
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: document output format (not storage)
data-classification: per-document classification
created: 2026-05-09
---

# Gamma Integration

> Gamma is the AI-native presentation, document, and webpage generation platform. The OS uses Gamma as the preferred tool for creating executive presentations, briefings, pitch decks, and one-pagers when AI-native design speed is prioritized over precise template control. Gamma MCP is the primary generation path; PPTX/DOCX generation is the fallback. Gamma outputs are published to SharePoint, shared via link, or exported to PPTX/PDF.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| Existing Gamma (review/update context) | Gamma share link provided | presentation-generation-agent (read_gamma) |
| Gamma as design reference | Designer shares Gamma link | ux-agent |

**Gamma ingestion:** read_gamma (Gamma MCP) → extract content per card/slide → convert to OS markdown → store in wiki. Gamma content is read-only via MCP — edits must be done in Gamma editor.

---

## 2. Publishing Workflows

| OS Artifact | Gamma Output | Publishing Agent | Destination |
|-------------|-------------|-----------------|-------------|
| Executive brief | Executive presentation | executive-communications-agent-integration | Gamma share link + PPTX export |
| Board update | Board deck | executive-communications-agent-integration | Gamma share link |
| Sprint review | Sprint summary | delivery-manager-agent | Gamma share link + SharePoint |
| Product one-pager | Product brief | senior-pm-agent | Gamma share link |
| Investor pitch | Pitch deck | executive-communications-agent-integration | Gamma share link (restricted) |
| Training material | Training deck | organizational-learning-agent | Gamma share link |
| Architecture overview | Technical presentation | architect-agent | Gamma share link |

**Generation Pipeline:**
```
OS artifact (markdown + structured content)
  → audience-transformation-agent (audience profile + theme selection)
  → get_themes (retrieve available Gamma themes)
  → generate OR generate_from_template (Gamma MCP)
  → Gamma creates presentation (AI-native card layout)
  → Share link returned → stored in wiki
  → Optional: PPTX export for offline distribution
  → audit log entry
```

**Template vs. Direct Generation:**
- Use `generate_from_template` only with confirmed template IDs from `get_gammas(type="template")`
- Use `generate` for all other cases (Gamma applies intelligent defaults)
- Non-template Gamma IDs are NOT valid inputs to `generate_from_template`

---

## 3. Sync Systems

No sync. Gamma presentations are generated artifacts. Edits made in Gamma editor do NOT sync back to OS. If content needs updating:
1. Modify OS markdown artifact
2. Regenerate new Gamma
3. Share new link

**Important:** Gamma MCP tools CANNOT edit or modify existing Gammas. All modifications must be done directly in the Gamma editor by humans.

---

## 4. Permissions

```yaml
gamma_permissions:
  mcp_server: claude.ai Gamma MCP (official)
  auth_method: Gamma API key
  secret_path: vault://integrations/gamma/api-key
  rotation: 90 days
  share_visibility:
    internal: Gamma share link with team access
    external: Gamma share link with password OR exported PPTX
  folder_organization: use get_folders to place Gammas in correct org folder
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Generate Gamma from approved artifact | None (agent autonomous) |
| Share Gamma link internally | None |
| Share Gamma link externally | Per email integration rules (H-022) |
| Investor/board Gamma | executive-communications-agent review + H-022 |
| Regulatory Gamma | compliance-governance-agent + H-022 |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: claude.ai Gamma MCP (official)
  tools_available:
    - generate                      # Create new Gamma from content (primary)
    - generate_from_template        # Create from validated template ID
    - get_gammas                    # List existing Gammas (use type="template" for templates)
    - get_folders                   # Get folder structure for organization
    - get_themes                    # Get available design themes
    - get_generation_status         # Poll for generation completion
    - read_gamma                    # Read content of existing Gamma
  tool_selection:
    new_presentation: generate (not generate_from_template unless template explicitly requested)
    from_template: get_gammas(type="template") first → validate ID → generate_from_template
    reading_existing: read_gamma (provide gamma file ID)
  theme_selection:
    executive: professional, minimal
    board: high-impact, branded
    technical: clean, diagram-friendly
    customer: vibrant, product-focused
  output_types:
    - presentation (slides/cards)
    - document (long-form)
    - webpage (shareable)
    - social_post (short-form)
  export_options:
    - Share link (default)
    - PPTX export (for offline distribution)
    - PDF export (for formal records)
  async_generation:
    tool: get_generation_status (poll after generate call)
    expected_latency: 15-60s typical
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Gamma MCP unavailable | Fall back to python-pptx (PPTX generation); log gap as GAP-INT-GMA-001 |
| Generation fails | Retry once; if fails, fall back to PPTX; alert presentation-generation-agent |
| Template ID invalid | Use get_gammas(type="template") to find valid templates; do NOT guess IDs |
| Generation timeout | Poll get_generation_status; if > 120s, fall back to PPTX |
| Share link not accessible | Verify Gamma permissions; escalate to connector-builder-agent |

---

## 8. Observability

```yaml
metrics:
  - gamma_generation_success_rate    # target: > 99%
  - gamma_generation_latency_p95     # target: < 90s
  - gamma_vs_pptx_usage_ratio        # track Gamma adoption rate
  - gamma_share_link_delivery_rate   # successful links shared
```

---

## 9. Rollback Systems

Gamma presentations are generated artifacts. No in-place rollback. If content is incorrect, regenerate from corrected OS artifact. If a Gamma was shared externally with incorrect content, generate corrected Gamma and send corrected link; notify recipients via email.

---

## 10. Audience Adaptation

| Audience | Gamma Type | Theme | Content Limit |
|----------|-----------|-------|--------------|
| Board | Presentation | High-impact, branded | 8 cards max |
| Executive | Presentation | Professional, minimal | 10 cards max |
| Investors | Presentation | Branded, data-driven | 12 cards max |
| Technical | Presentation | Clean, diagram-friendly | Unlimited |
| Customers | Presentation | Vibrant, product-focused | 15 cards max |
| Training | Document | Clean, structured | Unlimited |

audience-transformation-agent selects type + theme + content density + card count limit before calling Gamma MCP.

---

## 11. Governance

```yaml
governance:
  data_classification: per content (INTERNAL default; CONFIDENTIAL for board/investor)
  external_sharing:
    - All external Gamma links require approval per email rules (H-022)
    - CONFIDENTIAL Gammas: password-protected share links only
    - Investor Gammas: RESTRICTED until after disclosure
  prohibited:
    - Customer PII without H-025
    - Unpublished financial data without H-022
  watermarking:
    - DRAFT Gammas: "[DRAFT]" prefix in title until artifact APPROVED
  metadata:
    - Gamma title includes: [AI OS] prefix and [artifact-id] reference
    - Generation recorded in wiki/presentations/gamma-catalog.md
```

---

## 12. Auditability

```yaml
audit:
  logged_per_generation:
    - agent_id: requesting agent
    - source_artifact_id: OS artifact reference
    - generation_tool: generate | generate_from_template
    - theme_used: selected theme
    - timestamp: ISO 8601
    - gamma_id: returned Gamma file ID
    - share_link: generated link
    - output_type: presentation | document | webpage
    - data_classification: applied classification
  log_path: memory/events/gamma-audit.jsonl
  retention: 1 year (per artifact retention policy)
```

---
