---
organization: Artifact Execution Organization
org-type: execution
agent-count: 9
status: active
created: 2026-05-10
version: 1.0.0
---

# Artifact Execution Organization

> The Artifact Execution Organization is the publishing and communication layer of the AI OS. It transforms internally-generated content into audience-ready artifacts — emails, reports, presentations, spreadsheets, diagrams, and dashboards — and publishes them to the appropriate enterprise systems. Every external communication flows through this organization. The organization enforces audience transformation, approval gating, and complete audit trails for all published artifacts.

---

## Organization Mission

Transform OS-internal content into polished, audience-appropriate artifacts and deliver them to the correct enterprise systems with proper authorization. Maintain artifact registry, lifecycle state, and quality standards. Ensure every external-facing artifact meets governance requirements before publication.

---

## Agent Roster

| Agent | Role | Primary Output |
|-------|------|---------------|
| artifact-publishing-agent | Orchestrator for all artifact publication | Multi-format routing and delivery |
| audience-transformation-agent | Audience profiling and content adaptation | Audience-appropriate content |
| executive-communications-agent | Executive and board communications | Emails, briefings, board packs |
| technical-documentation-agent | Technical documentation management | ADRs, runbooks, specs |
| compliance-documentation-agent | Compliance evidence and audit reports | Compliance packages, audit reports |
| presentation-generation-agent | Slide deck creation | PPTX, Gamma presentations |
| spreadsheet-generation-agent | Structured data artifacts | XLSX, CSV reports |
| diagram-generation-agent | Visual architecture and process diagrams | Figma, draw.io, Mermaid |
| dashboard-generation-agent | Analytics dashboards | Tableau, Power BI, Looker |

---

## Artifact Taxonomy

```yaml
artifact_types:
  communication:
    - executive_email: external/internal email from executive-communications-agent
    - customer_notification: external email requiring H-014
    - board_pack: quarterly board communication requiring H-016
    - incident_notification: customer-facing incident update requiring H-014
  documentation:
    - adr: Architecture Decision Record
    - runbook: operational procedure
    - compliance_report: evidence package for audit
    - pir: Post-Incident Report
    - sprint_summary: sprint documentation
  presentation:
    - board_presentation: PPTX/Gamma for board audience
    - team_presentation: PPTX/Gamma for internal audience
    - executive_briefing: condensed visual brief
  data:
    - metrics_report: XLSX with structured data
    - analytics_export: CSV/XLSX export from analytics
    - financial_summary: structured financial data
  visual:
    - architecture_diagram: system/component diagram
    - process_diagram: workflow or sequence diagram
    - org_chart: organizational structure diagram
  analytics:
    - tableau_workbook: Tableau TWBX
    - powerbi_report: Power BI PBIX
    - looker_look: Looker saved query
```

## Artifact Lifecycle States

```yaml
lifecycle_states:
  DRAFT:       artifact created, not yet reviewed
  PENDING:     awaiting approval gate (H-NNN)
  APPROVED:    approval received, ready to publish
  PUBLISHED:   delivered to destination system
  DELIVERED:   confirmed received by recipient (for emails)
  FAILED:      publication failed (queued for retry)
  SUPERSEDED:  replaced by newer version
  ARCHIVED:    retained per retention policy, no longer active
```

---

## 1. artifact-publishing-agent

### Responsibilities
- Orchestrate all artifact publication across the OS
- Route artifacts to the correct publishing channel (email, SharePoint, Tableau, etc.)
- Manage artifact registry and lifecycle state transitions
- Handle publication failure queues and retry logic
- Enforce pre-publication quality gates (format validation, audience review)
- Coordinate with audience-transformation-agent before any external publication
- Maintain artifact integrity via SHA-256 hashing

### Inputs
```yaml
inputs:
  - artifact_submission:
      from: any agent
      fields: [artifact_type, content, destination, audience, urgency, gate_reference]
  - publication_retry:
      from: enterprise-systems-agent (queue flush on connector recovery)
      fields: [artifact_id, original_destination, failure_reason]
  - artifact_status_query:
      from: any agent or human operator
      fields: [artifact_id, query_type: [status, history, content_hash]]
```

### Outputs
```yaml
outputs:
  - publication_confirmation:
      format: artifact record with published_at timestamp
      destination: requesting agent + memory/artifacts/registry/
  - artifact_registry_entry:
      format: structured artifact metadata
      destination: memory/artifacts/registry/{artifact_id}.json
  - publication_failure_alert:
      format: failure notification with retry schedule
      destination: requesting agent + enterprise-systems-agent
  - artifact_audit_entry:
      format: audit log entry
      destination: memory/events/artifact-audit.jsonl
```

### Routing Rules
```yaml
routing_rules:
  executive_email: executive-communications-agent → H-016 gate → Gmail/Outlook MCP
  customer_email: incident-manager-agent or customer-success-agent → H-014 gate → Gmail/Outlook MCP
  internal_email: any agent → Gmail/Outlook MCP (no gate)
  sharepoint_doc: technical-documentation-agent or compliance → SharePoint connector
  tableau_workbook: analytics-agent or dashboard-generation-agent → Tableau connector
  powerbi_report: analytics-agent → Power BI connector
  onedrive_doc: executive-communications-agent → OneDrive via Office 365 connector
  gdrive_doc: delivery-manager-agent → Google Drive MCP
  presentation: presentation-generation-agent → Gamma MCP or PPTX library
```

### Quality Gates (Pre-Publication)
```yaml
quality_gates:
  ART-001: artifact_type must be in approved taxonomy
  ART-002: destination must be registered connector or MCP server
  ART-003: data_classification must be specified
  ART-004: external artifacts (H-014/H-016) must pass audience-transformation-agent review
  ART-005: content integrity hash computed before publication
  ART-006: self-approval prohibited (publishing agent cannot approve own artifact)
  ART-007: CONFIDENTIAL artifacts must have audit trail before publication
  ART-008: RESTRICTED artifacts blocked from external publication without H-019/H-022
```

### Persistent State
```yaml
state:
  artifact_registry: memory/artifacts/registry/ (one JSON file per artifact)
  publication_queue: memory/events/artifact-publish-queue.jsonl
  audit_log: memory/events/artifact-audit.jsonl
  integrity_index: memory/artifacts/indexes/integrity.json
```

---

## 2. audience-transformation-agent

### Responsibilities
- Apply audience-specific formatting, tone, and content rules to all artifacts
- Maintain audience profile library (EXECUTIVE, CUSTOMER, LEGAL, TECHNICAL, FINANCE, BOARD)
- Review all external artifacts before H-014 or H-016 submission
- Strip internal jargon from customer-facing communications
- Apply compliance-appropriate language for legal/audit artifacts
- Adapt metrics and data to audience comprehension level
- Validate that no RESTRICTED data appears in wrong-audience artifacts

### Audience Profiles
```yaml
audience_profiles:
  EXECUTIVE:
    tone: formal, outcome-focused, concise
    format: 3 bullets max for updates; BLUF (Bottom Line Up Front)
    length: < 200 words for email; < 10 slides for presentation
    prohibited: internal jargon, raw metrics, architecture detail
    required: business impact, risk flag, recommended action
  BOARD:
    tone: strategic, formal, data-backed
    format: formal salutation, agenda reference, numbered sections
    length: < 5 pages for pack cover; appendix for detail
    prohibited: operational detail, internal code names, raw incidents
    required: strategic KPIs, quarterly trend, risk summary, ASK (if any)
  CUSTOMER:
    tone: empathetic, action-oriented, no blame
    format: workaround first, ETA, next update time
    length: < 150 words for incident notification
    prohibited: internal system names, root cause before fix, blame
    required: impact statement, workaround, resolution ETA, apology
  LEGAL:
    tone: precise, formal, citation-complete
    format: control ID references, structured evidence, chain-of-custody
    length: as long as required for completeness
    prohibited: informal language, imprecise dates, unverified claims
    required: regulatory citations, evidence references, signatory blocks
  TECHNICAL:
    tone: direct, precise, detail-rich
    format: code blocks, system names, exact metrics
    length: sufficient to reproduce / understand
    prohibited: oversimplification, glossed-over caveats
    required: runbook links, log references, exact error messages
  FINANCE:
    tone: formal, number-precise, variance-focused
    format: GL codes if available; budget vs. actual; units explicit
    prohibited: estimated ranges without confidence interval, missing units
    required: comparison period, currency, rounding specification
```

### Inputs
```yaml
inputs:
  - transformation_request:
      from: artifact-publishing-agent (pre-publication review)
      fields: [artifact_id, content, target_audience, destination]
  - audience_profile_query:
      from: any agent
      fields: [audience_type, content_type]
```

### Outputs
```yaml
outputs:
  - transformed_artifact:
      format: audience-adapted content
      destination: artifact-publishing-agent (for publication)
  - transformation_record:
      format: audit record (original hash, transformed hash, audience, agent)
      destination: memory/events/artifact-audit.jsonl
  - rejection_with_feedback:
      format: content feedback + required changes
      destination: requesting agent (for revision)
```

---

## 3. executive-communications-agent

### Responsibilities
- Author and send executive-level internal and external communications
- Manage board pack creation and delivery (quarterly, H-016 gated)
- Coordinate with audience-transformation-agent for all external sends
- Maintain executive communication log and tone consistency
- Handle recall workflows for incorrectly sent communications
- Generate stakeholder update emails at sprint cadence

### Key Operations
```yaml
operations:
  internal_executive_email:
    gate: none
    connector: Gmail MCP or Outlook connector
    audience_profile: EXECUTIVE
    template: templates/executive-internal-email.md
  external_stakeholder_email:
    gate: H-016
    connector: Gmail MCP or Outlook connector
    audience_profile: EXECUTIVE (or BOARD if board-level)
    template: templates/executive-external-email.md
  board_pack_delivery:
    gate: H-016
    connector: Gmail MCP + Google Drive MCP (or Outlook + OneDrive)
    audience_profile: BOARD
    cadence: quarterly
    template: templates/board-pack-cover.md
  sprint_stakeholder_update:
    gate: none (internal) / H-016 (external investors)
    trigger: sprint end
    format: 3-bullet BLUF email
```

### Persistent State
```yaml
state:
  communication_log: memory/communications/executive-log.jsonl
  board_pack_history: memory/communications/board-packs/
  recall_log: memory/communications/recall-log.jsonl
```

---

## 4. technical-documentation-agent

### Responsibilities
- Author and manage Architecture Decision Records (ADRs)
- Maintain runbooks, operation procedures, and system specs
- Publish ratified ADRs to SharePoint (`/sites/architecture/libraries/Decisions`)
- Generate DOCX reports from OS wiki content
- Maintain LookML governance with Spectacles validation
- Update wiki pages with technical decisions

### Document Types
```yaml
document_types:
  adr:
    format: templates/adr-template.md
    lifecycle: DRAFT → PROPOSED → RATIFIED → SUPERSEDED
    destination: architecture/decisions/ADR-NNN.md
    publish_on_ratify: SharePoint /sites/architecture/libraries/Decisions
  runbook:
    format: templates/runbook-template.md
    lifecycle: DRAFT → REVIEWED → ACTIVE → RETIRED
    destination: wiki/runbooks/{system}.md
  connector_spec:
    format: templates/connector-spec.md (12-section)
    lifecycle: DRAFT → REVIEWED → ACTIVE
    destination: integrations/{category}/{system}.md
  technical_report:
    format: DOCX (via docx connector)
    lifecycle: DRAFT → PUBLISHED
    destination: SharePoint or OneDrive (per request)
```

### Persistent State
```yaml
state:
  adr_index: architecture/decisions/INDEX.md
  runbook_index: wiki/runbooks/INDEX.md
  doc_audit_log: memory/events/technical-docs-audit.jsonl
```

---

## 5. compliance-documentation-agent

### Responsibilities
- Generate compliance evidence packages for SOC 2, ISO 27001, GDPR, SOX
- Publish evidence to SharePoint (`/sites/compliance/libraries/Evidence`)
- Manage legal correspondence ingestion and routing
- Handle DSAR (Data Subject Access Requests) under H-020
- Maintain compliance calendar and control deadlines
- Generate external auditor reports (H-019 + H-022 gated)
- Track legal hold status for documents

### Key Workflows
```yaml
workflows:
  soc2_evidence_package:
    trigger: audit cycle
    steps: [collect_audit_logs, format_evidence, hash_chain_verify, H-019_gate, publish_sharepoint]
    gate: H-019 (compliance submission to external auditor)
  dsar_workflow:
    trigger: DSAR request (H-020 gate)
    steps: [identify_data, locate_across_systems, compile_report, human_review, deliver_to_subject]
    gate: H-020
  gdpr_erasure:
    trigger: erasure request
    steps: [identify_pii_locations, execute_deletion, verify_deletion, document_completion]
    gate: H-021 (for delete operations)
  legal_correspondence:
    trigger: incoming legal email (Gmail label: Legal / Outlook label: Legal)
    steps: [ingest, classify, alert_compliance_team, log_in_legal_hold_register]
```

### Persistent State
```yaml
state:
  compliance_calendar: memory/compliance/calendar.json
  legal_hold_register: memory/compliance/legal-holds.jsonl
  evidence_log: memory/events/compliance-evidence.jsonl
  dsar_log: memory/compliance/dsar-log.jsonl
```

---

## 6. presentation-generation-agent

### Responsibilities
- Generate slide deck presentations for all audience types
- Use Gamma MCP for AI-native presentation generation
- Generate PPTX for Microsoft-ecosystem delivery (Office 365 / SharePoint)
- Apply audience-appropriate templates and styling
- Source content from OS wiki, sprint data, and analytics
- Publish completed presentations to SharePoint or Google Drive

### Generation Options
```yaml
generation_options:
  gamma_mcp:
    tool: mcp__claude_ai_Gamma__generate
    use_case: executive briefings, board presentations, team retrospectives
    output: Gamma web presentation (share link)
    audience: EXECUTIVE, BOARD, TEAM
  gamma_from_template:
    tool: mcp__claude_ai_Gamma__generate_from_template
    use_case: standardized report formats
    output: Gamma presentation from approved template
  pptx_generation:
    method: python-pptx library or PPTX connector
    use_case: Microsoft-ecosystem delivery, compliance presentations
    output: PPTX file → SharePoint or OneDrive
```

### Presentation Templates
- `templates/board-presentation.md` — quarterly board deck structure
- `templates/sprint-retrospective-deck.md` — sprint review presentation
- `templates/executive-briefing.md` — condensed executive brief
- `templates/incident-review.md` — PIR presentation for leadership

---

## 7. spreadsheet-generation-agent

### Responsibilities
- Generate structured data reports as XLSX files
- Produce CSV exports for data interchange
- Apply appropriate data formatting (currency, dates, percentages)
- Embed charts and pivot tables in Excel workbooks
- Validate data before export (no RESTRICTED data in wrong-classification exports)
- Publish to Google Drive, OneDrive, or SharePoint based on audience

### Generation Protocol
```yaml
generation_protocol:
  library: openpyxl or xlsx connector
  format_rules:
    currency: locale-appropriate symbol, 2 decimal places
    dates: ISO 8601 (YYYY-MM-DD) in data; display format per locale
    percentages: N% format, not decimal
    large_numbers: thousands separator
  data_validation:
    restricted_check: no RESTRICTED fields in INTERNAL-classified output
    pii_check: no raw PII (names, emails, SSN) without explicit H-023 approval
  destinations:
    internal_team: Google Drive (shared folder)
    finance_team: OneDrive (finance folder)
    external_auditor: SharePoint (H-019 gated)
    email_attachment: attached to executive or compliance email (max 25MB)
```

---

## 8. diagram-generation-agent

### Responsibilities
- Generate architecture, process, and organizational diagrams
- Use Figma MCP for design-quality visual outputs
- Generate Mermaid diagram code for markdown embedding
- Create sequence diagrams for workflow documentation
- Generate network and infrastructure topology diagrams
- Source diagram data from wiki, ADRs, and connector specs

### Generation Options
```yaml
generation_options:
  figma_mcp:
    tool: mcp__claude_ai_Figma__generate_diagram
    use_case: architecture diagrams, org charts, design deliverables
    output: Figma file (FigJam or design file)
  mermaid:
    format: mermaid code block embedded in markdown
    use_case: sequence diagrams, flowcharts, ER diagrams in wiki/ADRs
    output: inline markdown
  drawio:
    format: XML (draw.io compatible)
    use_case: complex network/infrastructure topology
    output: .drawio file → SharePoint or Google Drive
```

### Diagram Types
```yaml
diagram_types:
  architecture:
    format: Figma or Mermaid (component/container/context)
    template: C4 model levels 1-3
  sequence:
    format: Mermaid sequence diagram
    use_case: workflow documentation, API interaction diagrams
  org_chart:
    format: Figma or draw.io
    use_case: team structure, reporting lines
  data_flow:
    format: Mermaid flowchart
    use_case: integration data flow, event routing
  state_machine:
    format: Mermaid stateDiagram-v2
    use_case: artifact lifecycle, workflow state transitions
```

---

## 9. dashboard-generation-agent

### Responsibilities
- Create and maintain analytics dashboards across Tableau, Power BI, and Looker
- Design dashboard layouts appropriate to audience (technical vs. executive)
- Source data from Snowflake, Databricks, and Datadog metrics
- Apply row-level security and data classification rules
- Maintain dashboard version history and rollback capability
- Coordinate with analytics-agent for data pipeline validation

### Dashboard Design Standards
```yaml
design_standards:
  executive_dashboard:
    layout: single-page KPI view; traffic light status; trend arrows
    max_kpis: 6 primary KPIs on main view
    drill_down: available in secondary page
    refresh: daily
  operational_dashboard:
    layout: multi-panel; time-series dominant; alert zones highlighted
    refresh: 5 minutes (real-time where available)
    annotations: incident markers, deployment markers
  delivery_dashboard:
    layout: sprint burndown; velocity trend; DORA metrics
    refresh: daily (with sprint cadence markers)
  compliance_dashboard:
    layout: control status table; risk heat map; evidence completion %
    access: compliance-documentation-agent + auditors only
    refresh: weekly
```

### Publishing Targets
```yaml
publishing_targets:
  tableau:
    connector: integrations/analytics/tableau.md
    gate: H-016 for Executive project
    tools: [tableau_publish_workbook, tableau_refresh_extract]
  powerbi:
    connector: integrations/analytics/powerbi.md
    gate: H-016 for Executive workspace
    tools: [powerbi_import_pbix, powerbi_refresh_dataset]
  looker:
    connector: integrations/analytics/looker.md
    gap: GAP-INT-004 (dashboard creation via API blocked)
    workaround: configure schedules and alerts via API; dashboard via UI
```

---

## Organization Workflows

### Workflow 1: Artifact Submission and Publication
```yaml
trigger: Any agent submits artifact to artifact-publishing-agent
steps:
  1. artifact-publishing-agent: validate artifact type and destination
  2. artifact-publishing-agent: compute content integrity hash
  3. IF external_destination:
      audience-transformation-agent: apply audience profile
      IF H-016 required: queue for human operator approval
      IF H-014 required: queue for human operator approval
  4. artifact-publishing-agent: route to connector/MCP server
  5. connector/MCP: deliver artifact
  6. artifact-publishing-agent: record publication in registry + audit log
  7. artifact-publishing-agent: notify requesting agent
output: Published artifact with audit trail
```

### Workflow 2: Board Pack Generation
```yaml
trigger: quarterly schedule or executive-communications-agent request
steps:
  1. executive-communications-agent: gather sprint, financial, and risk data
  2. presentation-generation-agent: generate Gamma or PPTX presentation
  3. spreadsheet-generation-agent: generate supporting data appendix
  4. diagram-generation-agent: generate supporting architecture visuals
  5. audience-transformation-agent: apply BOARD profile to all content
  6. artifact-publishing-agent: H-016 gate (human operator approval)
  7. artifact-publishing-agent: publish to SharePoint + deliver via email
output: Board pack published to SharePoint + emailed to board
```

### Workflow 3: Compliance Evidence Package
```yaml
trigger: audit cycle or compliance-documentation-agent trigger
steps:
  1. compliance-documentation-agent: collect audit logs from all connectors
  2. compliance-documentation-agent: hash-chain verify audit log integrity
  3. compliance-documentation-agent: apply LEGAL audience profile
  4. spreadsheet-generation-agent: generate structured evidence workbook
  5. artifact-publishing-agent: H-019 + H-022 gate
  6. artifact-publishing-agent: publish to SharePoint compliance library
  7. compliance-documentation-agent: email to external auditor (H-019 gated)
output: Evidence package on SharePoint + notified auditor
```

### Workflow 4: Sprint Communication Package
```yaml
trigger: sprint end (delivery-manager-agent signal)
steps:
  1. analytics-agent: generate sprint velocity and DORA data
  2. dashboard-generation-agent: update Tableau/Power BI sprint dashboard
  3. executive-communications-agent: draft stakeholder email (EXECUTIVE profile)
  4. presentation-generation-agent: generate sprint review deck (Gamma)
  5. delivery-manager-agent: publish sprint summary doc to Google Drive
  6. IF external stakeholders: H-016 gate for email
  7. artifact-publishing-agent: publish all artifacts
output: Sprint dashboard updated + stakeholder email sent + drive doc published
```

---

## Artifact Registry Schema

```yaml
artifact_registry_entry:
  artifact_id: UUID v4
  artifact_type: {enum from artifact_types}
  title: string
  created_at: ISO 8601
  created_by: agent_id
  content_hash: SHA-256 of content at publish time
  status: {lifecycle_state}
  destination:
    system: connector_name | mcp_server
    location: URL, path, or resource_id
  audience: {audience_profile}
  classification: INTERNAL | CONFIDENTIAL | RESTRICTED
  gate_reference: H-NNN | none
  approval_record:
    approver: human_operator_id | agent_id
    approved_at: ISO 8601
    decision: approved | rejected
  version: integer (increments on supersede)
  superseded_by: artifact_id | null
  retention_until: ISO 8601 | indefinite
```

---

## Governance

```yaml
governance:
  external_publication_gate:
    H-014: customer-facing communications
    H-016: executive/board/investor communications
    H-019: compliance submissions to regulators/auditors
    H-022: external audit artifact delivery
  self_approval_prohibition: ART-006 — no agent may approve its own artifact
  integrity_verification: ART-007 — all artifacts hashed before and after publication
  pii_check: all artifacts scanned for PII before external publication
  retention_enforcement: retention-agent enforces artifact lifecycle per retention policy
  audit_trail: every artifact publication logged to memory/events/artifact-audit.jsonl
```

---

## Dependencies

| Depends On | Reason |
|-----------|--------|
| connector-mcp-org | All publishing channels (connectors + MCP servers) |
| governance-org agents | H-014, H-016, H-019, H-022 approval gates |
| analytics-agent | Source data for dashboards and reports |
| delivery-manager-agent | Sprint cadence triggers |
| security-architect-agent | Audience content security review (RESTRICTED data check) |
| compliance-documentation-agent | Legal and compliance artifact governance |
