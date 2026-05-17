---
type: agent-org-readme
organization: artifact-execution-org
agent-count: 9
owner: artifact-publishing-agent
---

# Artifact Execution Organization

> The publication layer of the Enterprise AI OS. This organization transforms OS-internal artifacts into externally consumable formats and delivers them to the right audience in the right system.

---

## What This Organization Does

The Artifact Execution Organization is the bridge between the OS and its external stakeholders. OS agents generate artifacts (sprint reviews, architecture decisions, incident postmortems, board packs, runbooks) that are dense, structured, and written for machine consumption. This organization takes those artifacts, transforms them for the appropriate human audience, formats them for the appropriate destination system, and publishes them. Every artifact that leaves the OS passes through this organization.

---

## The 9 Agents

| Agent | Role | Produces |
|-------|------|---------|
| **artifact-publishing-agent** | Orchestrator — entry point for all publication | Publication pipeline, delivery confirmation |
| **audience-transformation-agent** | Content adaptation for EXEC / TECH / CUSTOMER / LEGAL | Audience-appropriate artifact versions |
| **executive-communications-agent** | Board packs, exec summaries, stakeholder updates | Gmail/Outlook emails, Gamma decks, Confluence board packs |
| **technical-documentation-agent** | API docs, runbooks, ADRs, architecture docs | Confluence pages, GitHub wiki/README |
| **compliance-documentation-agent** | SOC 2 evidence, audit trails, GDPR packages | SharePoint packages, PDF archives |
| **presentation-generation-agent** | Slide decks | Gamma presentations, PPTX files |
| **spreadsheet-generation-agent** | Data exports, financial models, capacity plans | XLSX files, Google Sheets |
| **diagram-generation-agent** | Architecture diagrams, system maps, org charts | Figma/FigJam diagrams, Mermaid markdown |
| **dashboard-generation-agent** | Live operational and analytics dashboards | Tableau, PowerBI, Looker, Datadog dashboards |

---

## How to Use This Organization

**Publishing any artifact**
Always start with `artifact-publishing-agent`. Provide: the artifact content, the target audience (EXEC/TECH/CUSTOMER/LEGAL), the target destination (Confluence, Gmail, Figma, etc.), and whether a human approval gate (H-NNN) is required. The agent orchestrates the rest of the pipeline automatically.

**Adapting content for an audience**
`audience-transformation-agent` is called automatically by `artifact-publishing-agent`, but can also be called directly when you need to produce multiple audience versions of the same artifact. EXEC: narrative, metrics-first, no jargon, 1-2 pages. TECH: detailed, code-inclusive, decision rationale. CUSTOMER: value-focused, legally reviewed, no internals. LEGAL: evidence-based, citation-rich, chain-of-custody complete.

**Generating a presentation**
Route to `presentation-generation-agent` with a content brief and target audience. For most use cases it uses the Gamma MCP for AI-native generation. For Office environments requiring editable PowerPoint files, it generates PPTX instead. The agent sources supporting data from relevant connectors before generating.

**Generating a diagram**
Route to `diagram-generation-agent`. For enterprise-grade visual deliverables it uses Figma MCP (`generate_diagram` for FigJam). For documentation-embedded diagrams it uses Mermaid syntax. Provide: diagram type (architecture/data-flow/org-chart/sequence), scope, and the systems or entities to include.

**Publishing compliance evidence**
Route to `compliance-documentation-agent` with the audit type (SOC 2, GDPR, internal security review). The agent aggregates evidence from governance logs, decision records, and integration audit trails, then packages it for publication to SharePoint and PDF. All compliance documents include a generation hash and timestamp.

**Human approval gates**
`artifact-publishing-agent` enforces the H-NNN gate for any artifact being published to an external party (outside the organization). It will not execute publication until the gate is cleared. Internal publications (Confluence, Jira, Slack) are logged but do not require a gate.

---

## Key Files

| File | Purpose |
|------|---------|
| `agents/artifact-execution-org.md` | Full agent definitions for all 9 agents |
| `integrations/INTEGRATION-FABRIC-README.md` | Full fabric architecture including publication flows |
| `memory/artifact-publication-log.md` | Log of all published artifacts with delivery confirmation |
| `integrations/MASTER-INTEGRATION-REGISTRY.md` | Publication destinations and their connector status |

---

## MCP Servers Used by This Organization

| MCP Server | Used By | Capability |
|-----------|---------|-----------|
| Figma MCP | diagram-generation-agent | FigJam diagram generation, design context |
| Gamma MCP | presentation-generation-agent | AI presentation generation |
| Gmail MCP | executive-communications-agent | Outbound executive email |
| Google Calendar MCP | executive-communications-agent | Scheduling, availability |
| Google Drive MCP | spreadsheet-generation-agent | Google Sheets export |

*Last updated: 2026-05-10 | Main file: agents/artifact-execution-org.md*
