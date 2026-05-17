---
integration: Figma
category: design
status: active
mcp-available: yes
connector-agent: mcp-integration-agent
source-of-truth: design source-of-truth (UI/UX specifications)
data-classification: INTERNAL
created: 2026-05-09
---

# Figma Integration

> Figma is the source-of-truth for UI/UX design specifications, design systems, component libraries, and user flow diagrams. The OS ingests Figma designs to inform implementation, extracts component specifications for engineering, and publishes design artifacts back to Figma (FigJam boards for process diagrams, architecture flows). The official Figma MCP server is used for all Figma interactions.

---

## 1. Ingestion Workflows

| Data Type | Trigger | Consuming Agent |
|-----------|---------|----------------|
| UI design spec | Designer shares Figma URL | ux-agent (get_design_context + get_screenshot) |
| Component spec | PR review referencing Figma | frontend-engineer-agent |
| Design system tokens | Design system update event | design-systems-agent |
| User flow / wireframe | UX review request | ux-researcher-agent |
| Architecture diagram (FigJam) | Architecture review | architect-agent (get_figjam) |

**Design-to-code pipeline:**
```
Designer shares Figma URL
  → ux-agent calls get_design_context (fileKey + nodeId)
  → Extract: component code hints, design tokens, layout specs, annotations
  → audience-transformation-agent adapts to engineering format
  → Implementation spec published to wiki/designs/[component].md
  → frontend-engineer-agent consumes spec for implementation
  → Code Connect mappings established (Figma component → codebase component)
```

**Token ingestion:**
```
Figma design system update
  → get_variable_defs (retrieve all design tokens)
  → Compare against current token registry in memory/
  → Diff detected → generate token migration PR
  → devops-engineer-agent applies token update
```

---

## 2. Publishing Workflows

| OS Artifact | Figma Output | Publishing Agent | Destination |
|-------------|-------------|-----------------|-------------|
| Architecture diagram | FigJam board | architect-agent | FigJam (generate_diagram) |
| Process flow | FigJam diagram | workflow-runtime-agent | FigJam |
| Sprint flow | FigJam board | delivery-manager-agent | FigJam |
| OS system map | FigJam diagram | organization-evolution-agent | FigJam |

**FigJam generation pipeline:**
```
OS markdown (process / architecture description)
  → generate_diagram (Figma MCP — FigJam board creation)
  → Board URL returned → stored in wiki/designs/diagrams/
  → audit log entry
```

---

## 3. Sync Systems

```yaml
sync:
  direction: Figma → OS (design specs) is primary
  os_to_figma: FigJam diagram generation only (one-way publish)
  design_tokens:
    sync_trigger: Figma design system update webhook OR manual trigger
    sync_direction: Figma → OS token registry
    conflict_resolution: Figma wins (Figma is token source of truth)
  code_connect:
    direction: bidirectional (Figma ↔ codebase component mapping)
    maintained_by: design-systems-agent
    tool: send_code_connect_mappings / get_code_connect_map
```

---

## 4. Permissions

```yaml
figma_permissions:
  mcp_server: claude.ai Figma MCP (official)
  auth_method: Figma personal access token (PAT) or OAuth
  secret_path: vault://integrations/figma/access-token
  rotation: 90 days
  file_access:
    read: all OS-authorized Figma files
    write: FigJam boards only (diagram generation + code connect mappings)
  restricted_files:
    - Client/customer design files: read-only after explicit authorization
    - Unreleased product designs: CONFIDENTIAL classification applied
```

---

## 5. Approval Boundaries

| Operation | Approval Required |
|-----------|-----------------|
| Read Figma design spec | None (ux-agent, frontend-engineer-agent autonomous) |
| Read design system tokens | None |
| Generate FigJam diagram | None (agent autonomous) |
| Modify design system rules | design-systems-agent + H-003 equivalent (design system change) |
| Upload assets to Figma | design-systems-agent only |
| Access client/partner Figma files | Human operator authorization |

---

## 6. Runtime Integration

```yaml
runtime:
  mcp_server: claude.ai Figma MCP (official — highest priority for all Figma interactions)
  tools_available:
    - get_design_context      # Primary: read design + code hints + screenshot
    - get_screenshot          # Visual reference for design
    - get_metadata            # File metadata, last modified, components
    - get_figjam              # Read FigJam board content
    - get_variable_defs       # Read design tokens / variables
    - get_libraries           # Read connected libraries
    - search_design_system    # Search component library
    - generate_diagram        # Create FigJam diagram from description
    - get_code_connect_map    # Read Figma ↔ code mappings
    - get_code_connect_suggestions  # Suggest code components for Figma components
    - send_code_connect_mappings    # Push code connect mappings to Figma
    - upload_assets           # Upload assets (design-systems-agent only)
    - create_design_system_rules    # Codify design system rules
    - whoami                  # Verify authentication
  url_parsing:
    design: figma.com/design/:fileKey/:name?node-id=:nodeId (nodeId: "-" → ":")
    figjam: figma.com/board/:fileKey/:name → use get_figjam
    slides: figma.com/slides/:fileKey/:name
  preferred_tool: get_design_context (returns code + screenshot + hints in one call)
```

---

## 7. Failure Handling

| Failure | Response |
|---------|----------|
| Figma MCP unavailable | Alert ux-agent; use cached design spec from wiki if available |
| File not accessible | Request authorization; alert design-systems-agent |
| Design token sync fails | Log diff; alert design-systems-agent; use last known token registry |
| FigJam generation fails | Log error; export diagram as markdown ASCII fallback |
| Code Connect mapping fails | Log; alert design-systems-agent; mappings remain as-is |
| Rate limit | Queue requests; spread over next window (Figma API rate limits) |

---

## 8. Observability

```yaml
metrics:
  - figma_design_ingestion_rate       # designs successfully read and converted to specs
  - figma_token_sync_freshness        # target: tokens < 7 days stale
  - figjam_diagram_generation_rate    # target: > 99%
  - code_connect_coverage             # % of Figma components with code mappings
```

---

## 9. Rollback Systems

Figma designs have native version history — rollback via Figma's built-in version restore. OS design specs (wiki) rolled back to previous wiki version. FigJam diagrams: regenerate from OS artifact description if board is corrupted.

---

## 10. Audience Adaptation

| Audience | Figma Tool Used | Output Format |
|----------|----------------|--------------|
| Frontend engineers | get_design_context | Implementation spec (React+Tailwind hints) |
| Backend engineers | get_figjam | Architecture diagram text description |
| Product managers | get_screenshot | Visual reference only |
| Design system team | get_variable_defs + search_design_system | Token registry + component inventory |
| Executives | generate_diagram | High-level process/architecture FigJam boards |

---

## 11. Governance

```yaml
governance:
  data_classification: INTERNAL (design IP)
  client_designs: CONFIDENTIAL (require explicit authorization)
  unreleased_features:
    - Figma files for unreleased features: CONFIDENTIAL
    - Access restricted to ux-agent, product-manager agents, frontend-engineer-agent
  design_system_changes:
    - All design system rule changes logged to wiki/design-system/changelog.md
    - Breaking token changes require H-003-equivalent design system approval
  code_connect:
    - Mappings are source-controlled in codebase
    - Changes to mappings trigger frontend-engineer-agent review
```

---

## 12. Auditability

```yaml
audit:
  logged_per_access:
    - agent_id: accessing agent
    - figma_file_key: file accessed
    - node_id: specific node (if applicable)
    - tool_used: MCP tool name
    - timestamp: ISO 8601
    - purpose: design ingestion | token sync | diagram generation
  logged_per_write:
    - agent_id: writing agent
    - tool_used: generate_diagram | send_code_connect_mappings | upload_assets
    - destination: FigJam board URL or file
    - timestamp: ISO 8601
  log_path: memory/events/figma-audit.jsonl
  retention: 1 year
```

---
