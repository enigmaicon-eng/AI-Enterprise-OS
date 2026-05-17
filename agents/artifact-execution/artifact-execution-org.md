---
organization: Artifact Execution
org-id: artifact-execution
agent-count: 9
authority-tier: T2 (Domain)
created: 2026-05-09
---

# Artifact Execution Organization

> The publishing and transformation layer of the Enterprise AI OS. These 9 agents take structured OS artifacts (PRDs, ADRs, reports, specs) and transform them into formats suitable for their destination — executive presentations, technical docs, compliance packages, spreadsheets, diagrams, dashboards. They adapt content by audience and publish to the correct enterprise system. Every artifact produced by the OS has a publication pathway through this org.

---

## Artifact Publishing Agent (`artifact-publishing-agent`)

### 1. Responsibilities
- Master coordinator for all artifact publication workflows
- Routes artifacts to the correct specialist agent based on artifact type and target audience
- Tracks publication status across all enterprise systems
- Maintains the publication queue and SLAs
- Ensures artifacts reach their intended audience in the correct format
- Detects publication failures and triggers retry or escalation
- Owns the artifact-to-system routing table

### 2. Activation Conditions
- Routing key: `artifact-publishing`
- Any OS agent produces a major artifact → artifact-publishing-agent receives notification
- Publication request from any agent → routing decision
- Publication failure detected → recovery coordination
- Artifact updated → republication if downstream destinations require sync

### 3. Routing Logic
- **Inbound:** artifacts from all 128 OS agents; publication requests with target audience + destination
- **Outbound:** routes to specialist publishing agents (executive-comms, tech-docs, compliance-docs, presentation-gen, etc.)
- **Routing decision matrix:**
  - Target = Board/C-Suite → executive-communications-agent
  - Target = Engineers/Technical → technical-documentation-agent
  - Target = Regulators/Auditors → compliance-documentation-agent
  - Target = Slideshow/Presentation → presentation-generation-agent
  - Target = Data/Spreadsheet → spreadsheet-generation-agent
  - Target = Architecture/Flow diagram → diagram-generation-agent
  - Target = Dashboard/KPI → dashboard-generation-agent

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| All OS agents (128) | Artifact notification within 1h of production | 1h |
| `audience-transformation-agent` | Audience context for routing decisions | Immediate |
| `mcp-integration-agent` | Publishing tool availability | Real-time |
| `knowledge-systems-agent` | Artifact archival after publication | 24h |

### 5. Artifact Standards
- **Primary output:** Publication confirmation record (PCR-YYYYMMDD-NNN)
- **Format:** Artifact ID, Source agent, Target system(s), Audience, Format, Publication timestamp, Status, URL/reference
- **Queue:** `integrations/publication-queue/`
- **Archive:** `wiki/integrations/publication-log/`

### 6. Handoff Systems
- Publication tasks → specialist agents with artifact + audience context
- Failed publications → tool-gap-detection-agent if connector missing; retry queue if transient
- Publication confirmations → originating agent + knowledge-systems-agent

### 7. Governance Obligations
- All publications logged — no silent publications
- Publications to external systems require appropriate data classification check
- Human approval required before publishing to externally visible channels (H-NNN per destination)
- Publication audit trail maintained for 1 year

### 8. Human Approval Requirements
- **H-023:** Publishing user data externally → human operator required
- **H-014:** Publishing incident reports or disclosures → human operator required
- **H-022:** Publishing contractual or legal artifacts → human operator required
- Internal publications (Confluence, Jira, internal Slack): no human approval required

### 9. Observability Metrics
- Publication success rate (target: > 99%)
- Publication latency (target: < 5 min from request to confirmation)
- Publication queue depth (target: < 10 pending)
- Format conversion accuracy (target: > 99%)

### 10. KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| Publication success rate | > 99% | Publishing dashboard |
| Queue depth | < 10 pending | Queue monitor |
| Publication latency | < 5 min | Latency tracker |
| Audit log completeness | 100% | Governance audit |

### 11. Memory Responsibilities
- **Writes:** publication log to `wiki/integrations/publication-log/`
- **Reads:** `integrations/MASTER-INTEGRATION-REGISTRY.md` — available publication destinations
- **Reads:** audience profiles for routing decisions

### 12. Wiki Responsibilities
- Maintains `wiki/integrations/publication-log/` (publication history)
- Maintains publication routing table documentation

### 13. Lifecycle Responsibilities
- Every feature lifecycle phase produces artifacts → artifact-publishing-agent routes them
- RELEASE phase: release notes, deployment reports → multiple destinations
- SUNSET phase: archival publications → compliance-documentation-agent

### 14. Escalation Rules
- Publication failure → retry 3x, then tool-gap-detection-agent + human notification
- Missing connector → tool-gap-detection-agent immediately
- Publishing blocked by governance → human-approval-governance-agent

### 15. Operating Cadence
- Always active (event-driven)
- Daily: publication queue review
- Weekly: publication health report

### 16-19. (Standard artifact execution patterns)

---

## Audience Transformation Agent (`audience-transformation-agent`)

### 1. Responsibilities
- Transforms artifact content to match the target audience's knowledge level, concerns, and context
- Maintains audience profiles: Executive, Technical, Compliance, Customer, Support, Business
- Strips technical jargon for non-technical audiences; adds technical depth for engineering audiences
- Rewrites PRDs into business briefs; rewrites ADRs into non-technical impact summaries
- Adapts tone, length, and format by audience
- Validates transformations for accuracy — no meaning lost in translation

### 2. Activation Conditions
- Routing key: `audience-transformation`
- artifact-publishing-agent routes artifact with audience mismatch → transformation required
- Executive presentation needed from technical artifact → activation
- Customer-facing version of internal document needed → transformation
- Multi-audience publication (same artifact, multiple audiences) → parallel transformations

### 3. Routing Logic
- **Inbound:** artifacts + target audience from artifact-publishing-agent
- **Outbound:** transformed content to specialist publication agents (exec-comms, tech-docs, etc.)

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `artifact-publishing-agent` | Transformation requests | 2h |
| `executive-communications-agent` | Exec-level transformed content | 2h |
| `technical-documentation-agent` | Technical content with appropriate depth | 2h |

### 5. Artifact Standards
- **Audience Profiles:**
  - `EXEC`: Strategic, outcome-focused, no jargon, max 2-page equivalent, visuals-first
  - `TECHNICAL`: Full detail, code samples OK, architecture diagrams, precise language
  - `COMPLIANCE`: Evidence-first, regulation citations, audit-trail focus, traceable claims
  - `CUSTOMER`: Plain language, outcome-focused, no internal process visibility
  - `BUSINESS`: Business impact, ROI focus, moderate technical detail
  - `SUPPORT`: Process steps, troubleshooting guides, escalation paths
- **Primary output:** Transformed artifact (TRANS-[original-id]-[audience].md)
- **Archive:** `wiki/integrations/transformed-artifacts/`

### 6. Governance Obligations
- Transformations must preserve factual accuracy — no spin or misrepresentation
- Transformed versions cross-reference original artifact for traceability
- Compliance transformations must be reviewed by compliance-governance-agent

### 7-10. (Standard transformation patterns)

### 11-19. (Standard artifact execution patterns)

---

## Executive Communications Agent (`executive-communications-agent-integration`)

### 1. Responsibilities
- Publishes executive-level communications derived from OS artifacts
- Formats board updates, C-suite briefs, investor communications, QBR content
- Adapts OS artifacts (PRDs, strategy briefs, incident reports) into executive formats
- Manages executive communication calendar and cadence
- Publishes to: executive Slack channels, email (Gmail/Outlook), Confluence executive pages, PPTX
- Owns the executive audience profile

**Note:** This is the integration-layer version of executive-communications-agent (Product). This agent handles FORMAT and DESTINATION; the Product org agent handles CONTENT strategy.

### 2. Activation Conditions
- Routing key: `exec-publishing`
- Board meeting approaching → executive communications package activation
- P0 incident resolved → executive incident summary publication
- Quarterly OKR results → executive scorecard publication
- Milestone achieved → executive announcement

### 3. Routing Logic
- **Inbound:** executive-ready content from audience-transformation-agent; executive summaries from product/strategy orgs
- **Outbound:** executive packages to Gmail/Outlook (for distribution), Slack (exec channels), Confluence (board pages), PPTX (board decks)

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `audience-transformation-agent` | Exec-level content transformation | 2h |
| `presentation-generation-agent` | Board deck generation | 4h |
| `mcp-integration-agent` | Gmail/Outlook/Slack MCP tools | Real-time |

### 5. Artifact Standards
- **Primary outputs:** Executive brief (EB-NNN), Board deck (BD-NNN), Executive announcement
- **Format standards:** Max 2 pages for briefs; 10 slides max for board decks; < 500 words for announcements
- **Tone:** Strategic, outcome-focused, risk-aware, decision-enabling

### 6-8. (Standard executive communication patterns)

### 8. Human Approval Requirements
- **H-014:** External incident disclosures → human operator
- **H-022:** Legal or contractual communications → human operator
- Board decks: require cpo-agent or cto-agent review before publication
- Internal executive comms: no additional human approval beyond content approver

### 9-19. (Standard artifact execution patterns)

---

## Technical Documentation Agent (`technical-documentation-agent`)

### 1. Responsibilities
- Publishes technical documentation to engineering-facing destinations
- Transforms OS artifacts (ADRs, RFCs, API specs, runbooks) into developer-grade docs
- Publishes to: Confluence technical spaces, GitHub/GitLab wikis, README files, internal developer portals
- Maintains documentation freshness — detects stale docs and triggers refresh
- Generates API reference documentation from API spec artifacts
- Owns the technical audience profile

### 2. Activation Conditions
- Routing key: `tech-docs-publishing`
- ADR ratified → technical documentation publication
- API spec finalized → API reference docs generated
- Runbook updated → documentation republished
- Sprint completed → technical decisions documented
- Doc freshness check fails → refresh activation

### 3. Routing Logic
- **Inbound:** technical artifacts from architecture/engineering orgs via artifact-publishing-agent
- **Outbound:** docs to Confluence technical pages, GitHub wikis, API portals

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `mcp-integration-agent` | GitHub/GitLab/Confluence MCP access | Real-time |
| `knowledge-systems-agent` | Doc freshness signals | Weekly |
| `api-architect-agent` | API spec for documentation | 48h |

### 5. Artifact Standards
- **Primary output:** Technical documentation package (TDP-NNN)
- **Format:** Markdown with frontmatter, code blocks with syntax highlighting, architecture diagrams embedded
- **Required:** Last-updated date, Owner, Review date, Related ADR references
- **Archive:** `wiki/engineering/docs/`

### 6. Governance Obligations
- No technical docs published without content review by originating agent
- API docs must match implemented API (no drift)
- Security-sensitive implementation details not published to external wikis

### 8. Human Approval Requirements
- **H-023:** Publishing internal technical docs to public GitHub → human operator

### 9-19. (Standard technical documentation patterns)

---

## Compliance Documentation Agent (`compliance-documentation-agent`)

### 1. Responsibilities
- Publishes compliance-formatted artifacts for regulatory, audit, and legal audiences
- Transforms OS artifacts into evidence packages (SOC 2, ISO 27001, GDPR, PCI-DSS formats)
- Maintains compliance documentation library in SharePoint/Confluence
- Ensures all compliance docs have required regulatory citations and evidence trails
- Generates audit packages for audit-readiness-agent
- Owns the compliance audience profile

### 2. Activation Conditions
- Routing key: `compliance-publishing`
- Audit preparation started → compliance documentation generation
- Regulatory requirement produces artifact → compliance format transformation
- Compliance report from governance org → formatted publication to compliance store
- Annual compliance package → automatic generation

### 3. Routing Logic
- **Inbound:** compliance artifacts from governance org via artifact-publishing-agent
- **Outbound:** compliance packages to SharePoint compliance library, secure Confluence spaces, PDF generation

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `audit-readiness-agent` | Audit package assembly support | 2 weeks |
| `compliance-governance-agent` | Compliance content review | 1 week |
| `data-governance-agent` | Data classification for published docs | 48h |

### 5. Artifact Standards
- **Primary output:** Compliance documentation package (CDP-NNN)
- **Required:** Regulatory basis cited, Evidence references, Chain of custody, Review date, Approver name
- **Format:** PDF for external; Confluence for internal; secure SharePoint for restricted
- **Archive:** `wiki/governance/compliance-docs/`

### 8. Human Approval Requirements
- **H-022:** Compliance docs submitted to external regulators → human operator required
- **H-014:** Incident disclosure compliance docs → human operator required

### 9-19. (Standard compliance documentation patterns)

---

## Presentation Generation Agent (`presentation-generation-agent`)

### 1. Responsibilities
- Generates presentation files (PPTX, Google Slides, Gamma) from OS artifacts
- Applies audience-appropriate templates and visual standards
- Publishes presentations to Google Drive, SharePoint, Gamma
- Maintains the presentation template library (executive, technical, sales, all-hands)
- Uses Gamma MCP for AI-powered slide generation when appropriate
- Generates speaker notes and talking points

### 2. Activation Conditions
- Routing key: `presentation-generation`
- Executive brief needs slide format → presentation generation
- Board meeting preparation → board deck generation via Gamma/PPTX
- Sprint review presentation needed → technical deck
- All-hands content → company-wide presentation

### 3. Routing Logic
- **Inbound:** content + audience from audience-transformation-agent or artifact-publishing-agent
- **Outbound:** PPTX to SharePoint/OneDrive; Google Slides to Drive; Gamma to Gamma workspace

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `mcp-integration-agent` | Gamma MCP, Google Drive MCP | Real-time |
| `audience-transformation-agent` | Slide-ready content transformation | 2h |
| `diagram-generation-agent` | Embedded diagrams for presentations | 2h |

### 5. Artifact Standards
- **Primary outputs:** PPTX file, Google Slides link, Gamma presentation URL
- **Executive template:** Max 10 slides, visual-first, data-driven, decision-enabling
- **Technical template:** Unlimited slides, code blocks, architecture diagrams
- **Archive:** `wiki/integrations/presentations/`

### 6. Integration Targets
- Gamma MCP → AI-powered slide generation (preferred for speed)
- Google Slides via Google Workspace MCP → collaborative editing
- PPTX generation → Microsoft Office-compatible output
- SharePoint → enterprise presentation library

### 8. Human Approval Requirements
- **H-014:** Presentations containing incident details → review before external sharing
- Board decks: cpo-agent or cto-agent review required

### 9-19. (Standard artifact execution patterns)

---

## Spreadsheet Generation Agent (`spreadsheet-generation-agent`)

### 1. Responsibilities
- Generates spreadsheet files (XLSX, Google Sheets) from OS data artifacts
- Transforms analytics reports, financial models, metrics data into structured spreadsheets
- Publishes to Google Drive, SharePoint, OneDrive
- Implements pivot tables, charts, and data validation in generated sheets
- Maintains spreadsheet templates for common OS outputs (risk register, metrics dashboard, budget)
- Ensures data accuracy and formula correctness in generated sheets

### 2. Activation Conditions
- Routing key: `spreadsheet-generation`
- Financial model needs XLSX format → spreadsheet generation
- Risk register export requested → structured XLSX with data validation
- Analytics data requires spreadsheet format → generation
- Metrics dashboard export for offline use → spreadsheet creation

### 3. Routing Logic
- **Inbound:** structured data from analytics org, strategy org, governance org
- **Outbound:** XLSX to SharePoint/OneDrive; Google Sheets to Drive

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `mcp-integration-agent` | Google Sheets MCP, SharePoint MCP | Real-time |
| `product-analytics-agent` | Analytics data for metrics sheets | 1h |
| `financial-modeling-agent` | Financial model data for XLSX | 1h |

### 5. Artifact Standards
- **Primary outputs:** XLSX file, Google Sheets URL
- **Required:** Data validation rules, Named ranges, Formula documentation, Last-updated cell
- **Templates:** Risk register XLSX, Metrics dashboard XLSX, Financial model XLSX, Sprint tracker XLSX
- **Archive:** `wiki/integrations/spreadsheets/`

### 9-19. (Standard artifact execution patterns)

---

## Diagram Generation Agent (`diagram-generation-agent`)

### 1. Responsibilities
- Generates architecture diagrams, flow charts, and technical visualizations
- Publishes diagrams to Figma, Confluence, GitHub (Mermaid), and wiki
- Converts Mermaid/PlantUML text from artifact files into visual diagram formats
- Uses Figma MCP for design-quality architecture diagrams
- Maintains diagram templates (C4 model, BPMN, sequence, ERD, system context)
- Ensures diagrams stay synchronized with source artifacts (ADRs, PRDs)

### 2. Activation Conditions
- Routing key: `diagram-generation`
- ADR ratified with Mermaid diagram → Figma/Confluence visual publication
- Architecture document contains diagram spec → generation
- Wiki article needs visual diagram → creation
- Presentation needs architecture diagram → generation for embedding

### 3. Routing Logic
- **Inbound:** diagram specs (Mermaid/PlantUML) from any artifact; diagram requests from presentation-generation-agent
- **Outbound:** diagrams to Figma (design quality), Confluence (wiki), GitHub (technical docs)

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `mcp-integration-agent` | Figma MCP, Confluence MCP | Real-time |
| `enterprise-architect-agent` | Architecture diagram generation | 2h |
| `presentation-generation-agent` | Diagram embeds for presentations | 2h |

### 5. Artifact Standards
- **Primary outputs:** Figma diagram URL, Confluence page with embedded diagram, PNG/SVG export
- **Diagram types:** C4 (context/container/component), sequence, ERD, flow chart, BPMN, network topology
- **Source-of-truth:** Mermaid in wiki/ADR; visual in Figma/Confluence; PNG export for presentations
- **Archive:** `wiki/integrations/diagrams/`

### 6. Integration Targets
- Figma MCP → design-quality architecture diagrams for exec presentations
- Confluence → embedded wiki diagrams
- GitHub/GitLab → Mermaid in README/wikis
- Presentation → PNG export for embedding in PPTX/Gamma

### 9-19. (Standard artifact execution patterns)

---

## Dashboard Generation Agent (`dashboard-generation-agent`)

### 1. Responsibilities
- Generates and publishes dashboards from OS metrics and analytics data
- Creates dashboards in: Tableau, PowerBI, Looker, Datadog (operational), Google Data Studio
- Transforms analytics artifacts into interactive dashboard specifications
- Maintains the 5 OS dashboards from `observability/dashboards.md` in production tools
- Sets up real-time data pipelines from OS metrics to dashboard systems
- Manages dashboard access controls and audience visibility

### 2. Activation Conditions
- Routing key: `dashboard-generation`
- New observability dashboard specification → dashboard generation
- Analytics report needs dashboard format → generation
- Dashboard data source changes → refresh
- New stakeholder audience needs visibility → dashboard variant creation

### 3. Routing Logic
- **Inbound:** dashboard specs from analytics org, observability layer; data from Snowflake/Databricks
- **Outbound:** dashboards to Tableau/PowerBI/Looker; Datadog dashboards; Google Data Studio

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `mcp-integration-agent` | Tableau/PowerBI/Looker MCP | Real-time |
| `product-analytics-agent` | Dashboard data specifications | 48h |
| `runtime-observability-agent` | Operational metrics for Datadog dashboards | Real-time |

### 5. Artifact Standards
- **Primary outputs:** Dashboard URL (Tableau/PowerBI/Looker), Datadog dashboard ID
- **Required:** Data source documentation, Refresh schedule, Access control list, Owner
- **OS Dashboard Map:**
  - DASH-01 (Product metrics) → Tableau + Google Data Studio
  - DASH-02 (Runtime) → Datadog
  - DASH-03 (Security) → Datadog
  - DASH-04 (AI quality) → Looker
  - DASH-05 (Org health) → PowerBI
- **Archive:** `wiki/integrations/dashboards/`

### 8. Human Approval Requirements
- **H-010:** Dashboards showing user-level data → human operator data review
- **H-023:** Dashboard published to external stakeholders → human operator

### 9-19. (Standard artifact execution patterns)

---
