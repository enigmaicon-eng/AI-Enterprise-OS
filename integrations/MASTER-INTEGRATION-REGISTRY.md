---
type: master-integration-registry
version: 2.0.0
created: 2026-05-09
updated: 2026-05-10
authority: enterprise-systems-agent
review-cadence: monthly
integration-count: 33
agent-organizations: 2 (connector-mcp-org, artifact-execution-org)
agent-count: 16 (7 connector agents + 9 artifact agents)
fabric-readme: integrations/INTEGRATION-FABRIC-README.md
gap-tracker: integrations/CAPABILITY-GAP-TRACKER.md
---

# Enterprise Integration Fabric — Master Registry

> The authoritative catalog of all enterprise system integrations. The enterprise-systems-agent reads this on every session start. Every connector, every MCP server, every data flow is registered here.

---

## Registry Summary

| Category | System | MCP Available | Status | Source-of-Truth Role | Connector File |
|----------|--------|--------------|--------|---------------------|----------------|
| Project Management | Jira | Yes | Active | Issue + sprint tracking | `project-management/jira.md` |
| Project Management | Confluence | Yes | Active | Documentation + wiki | `project-management/confluence.md` |
| Version Control | GitHub | Yes | Active | Code + PRs + CI | `version-control/github.md` |
| Version Control | GitLab | Partial | Active | Code + CI/CD | `version-control/gitlab.md` |
| Communication | Slack | Yes | Active | Team messaging | `communication/slack.md` |
| Communication | Teams | Yes | Active | Enterprise messaging | `communication/teams.md` |
| Communication | Gmail | Yes | Active | External email | `communication/gmail.md` |
| Communication | Outlook | Yes | Active | Enterprise email | `communication/outlook.md` |
| Documents | DOCX | Yes | Active | Word documents | `documents/docx.md` |
| Documents | PPTX | Yes | Active | Presentations | `documents/pptx.md` |
| Documents | XLSX | Yes | Active | Spreadsheets | `documents/xlsx.md` |
| Documents | PDF | Yes | Active | Archival documents | `documents/pdf.md` |
| Design | Figma | Yes | Active | Design source-of-truth | `design/figma.md` |
| Design | Gamma | Yes | Active | AI presentations | `design/gamma.md` |
| ITSM | ServiceNow | Partial | Active | IT service management | `itsm/servicenow.md` |
| Data | Snowflake | Partial | Active | Data warehouse | `data/snowflake.md` |
| Data | Databricks | Partial | Active | ML + data engineering | `data/databricks.md` |
| CRM | Salesforce | Partial | Active | Customer data | `crm/salesforce.md` |
| Monitoring | PagerDuty | Yes | Active | Incident alerting | `monitoring/pagerduty.md` |
| Monitoring | Datadog | Yes | Active | Observability | `monitoring/datadog.md` |
| Content | SharePoint | Yes | Active | Document management | `content/sharepoint.md` |
| Workspace | Google Workspace | Yes | Active | Productivity suite | `workspace/google-workspace.md` |
| Workspace | Office 365 | Yes | Active | Enterprise productivity | `workspace/office365.md` |
| Graph DB | Neo4j | No | Planned | Knowledge graph | `data/neo4j.md` |
| Vector DB | Vector DBs | No | Planned | AI semantic search | `data/vector-dbs.md` |
| Infrastructure | Kubernetes | Partial | Active | Container orchestration | `infrastructure/kubernetes.md` |
| CI/CD | Jenkins | Partial | Active | Build automation | `cicd/jenkins.md` |
| CI/CD | ArgoCD | Partial | Active | GitOps deployment | `cicd/argocd.md` |
| Analytics | Tableau | Partial | Active | Data visualization | `analytics/tableau.md` |
| Analytics | PowerBI | Partial | Active | Business intelligence | `analytics/powerbi.md` |
| Analytics | Looker | Partial | Active | Data exploration | `analytics/looker.md` |
| ERP | SAP | No | Active (read-only) | ERP + finance | `erp/sap.md` |
| ERP | Workday | Partial | Active | HR + headcount | `erp/workday.md` |

**MCP Available:** Yes = Claude MCP server exists; Partial = custom connector with MCP wrapper; No = native connector required

> Full integration map with MCP status and source-of-truth roles: see `integrations/INTEGRATION-FABRIC-README.md` Section 5.

---

## Agent Organizations

Two specialized agent organizations manage the Integration Fabric at runtime. See `integrations/INTEGRATION-FABRIC-README.md` for full descriptions of all 16 agents.

### Connector + MCP Organization (7 agents)
**Agent file:** `agents/connector-mcp-org.md` | **README:** `agents/connectors/README.md`

| Agent | Primary Responsibility |
|-------|----------------------|
| connector-architecture-agent | Connector design patterns, standards, and review |
| mcp-integration-agent | MCP server inventory, tool routing, session manifest |
| enterprise-systems-agent | Master registry authority, source-of-truth arbitration, monthly review |
| connector-builder-agent | Builds new connectors on gap detection or approval |
| tool-capability-agent | Exhaustive tool catalog across all MCP servers and connectors |
| tool-gap-detection-agent | Detects missing capabilities; opens GAP-INT-NNN entries |
| capability-expansion-agent | Strategic capability roadmap, MCP server adoption recommendations |

### Artifact Execution Organization (9 agents)
**Agent file:** `agents/artifact-execution-org.md` | **README:** `agents/artifacts/README.md`

| Agent | Primary Responsibility |
|-------|----------------------|
| artifact-publishing-agent | Orchestrates all outbound artifact publication; single entry point |
| audience-transformation-agent | Adapts content for EXEC / TECH / CUSTOMER / LEGAL audiences |
| executive-communications-agent | Board packs, stakeholder updates, exec summaries via Gmail/Gamma |
| technical-documentation-agent | API docs, runbooks, architecture docs via Confluence/GitHub |
| compliance-documentation-agent | SOC 2 evidence, audit trails, GDPR packages via SharePoint/PDF |
| presentation-generation-agent | Slide decks via Gamma MCP or PPTX |
| spreadsheet-generation-agent | XLSX and Google Sheets data exports |
| diagram-generation-agent | Architecture diagrams via Figma MCP and Mermaid |
| dashboard-generation-agent | Live dashboards in Tableau, PowerBI, Looker, Datadog |

---

## Integration Data Flow Architecture

```
ENTERPRISE AI OS
│
├── INGESTION (data flowing IN)
│   ├── Jira → workflow state, sprint data, issue tracking
│   ├── GitHub/GitLab → code events, PR status, CI results
│   ├── Datadog → operational metrics, alerts
│   ├── PagerDuty → incident signals
│   ├── Salesforce → customer data, CRM events
│   ├── Snowflake/Databricks → analytics data, ML features
│   ├── ServiceNow → ITSM tickets, change requests
│   └── Workday → org data, headcount
│
├── PUBLICATION (artifacts flowing OUT)
│   ├── Confluence → all OS documentation, wikis, runbooks
│   ├── Jira → issues, epics, sprint items from workflows
│   ├── GitHub → code, PRs, README, release notes
│   ├── Slack/Teams → notifications, alerts, summaries
│   ├── Gmail/Outlook → executive communications, reports
│   ├── Figma → architecture diagrams, design assets
│   ├── Gamma → AI-generated presentations
│   ├── SharePoint → compliance docs, governance packages
│   ├── Tableau/PowerBI/Looker → dashboards, analytics
│   └── PDF → audit packages, compliance reports
│
└── SYNCHRONIZATION (bidirectional)
    ├── Jira ↔ Sprint tracking (OS sprint state ↔ Jira boards)
    ├── GitHub ↔ Code reviews (PR status ↔ OS workflow state)
    ├── Confluence ↔ Wiki (OS wiki ↔ Confluence spaces)
    ├── Datadog ↔ Alerts (OS alerts ↔ Datadog monitors)
    └── PagerDuty ↔ Incidents (OS incidents ↔ PagerDuty)
```

---

## Source-of-Truth Hierarchy

When data exists in multiple systems, this hierarchy determines the authoritative source:

| Data Type | Source of Truth | Replicated To |
|-----------|----------------|---------------|
| Issue/Task tracking | Jira | OS sprint state |
| Code | GitHub/GitLab | OS artifact store |
| Wiki/Documentation | OS wiki (Confluence mirror) | Confluence, SharePoint |
| Design assets | Figma | OS diagram store |
| Customer data | Salesforce | OS customer org |
| Infrastructure state | Kubernetes | OS runtime state |
| Incidents | OS incident tracker | PagerDuty, ServiceNow |
| Metrics | Datadog (ops) / OS analytics (product) | Tableau, PowerBI |
| HR data | Workday | OS org model |

---

## Integration Authentication Matrix

| System | Auth Method | Secret Storage | Rotation Frequency |
|--------|------------|----------------|-------------------|
| Jira | OAuth 2.0 / API Token | Vault | 90 days |
| Confluence | OAuth 2.0 / API Token | Vault | 90 days |
| GitHub | GitHub App / PAT | Vault | 90 days |
| GitLab | OAuth 2.0 / Deploy Token | Vault | 90 days |
| Slack | OAuth 2.0 / Bot Token | Vault | 180 days |
| Teams | Azure AD OAuth | Vault | 90 days |
| Gmail | Google OAuth 2.0 | Vault | 180 days |
| Outlook | Microsoft OAuth 2.0 | Vault | 90 days |
| Figma | OAuth 2.0 / PAT | Vault | 180 days |
| Gamma | OAuth 2.0 | Vault | 180 days |
| Salesforce | OAuth 2.0 / Connected App | Vault | 90 days |
| ServiceNow | OAuth 2.0 / Service Account | Vault | 90 days |
| Snowflake | Key-pair / OAuth | Vault | 90 days |
| Databricks | PAT / Service Principal | Vault | 90 days |
| PagerDuty | API Key / OAuth | Vault | 90 days |
| Datadog | API Key + App Key | Vault | 90 days |
| SharePoint | Azure AD OAuth | Vault | 90 days |
| Kubernetes | Service Account / kubeconfig | Vault | 90 days |
| Jenkins | API Token | Vault | 90 days |
| ArgoCD | Service Account Token | Vault | 90 days |
| Tableau | PAT / Service Account | Vault | 90 days |
| PowerBI | Azure AD Service Principal | Vault | 90 days |
| Looker | API3 Key | Vault | 90 days |
| SAP | Service Account | Vault | 90 days |
| Workday | ISSG/Service Account | Vault | 90 days |
| Neo4j | Bolt + Auth Token | Vault | 90 days |
| Vector DBs | API Key (varies by vendor) | Vault | 90 days |

**Rule:** All credentials stored in Vault. No credentials in environment variables, code, or config files.

---

## Integration Governance Rules

1. **No connector bypasses security review** — all connectors pass security-architect-agent review
2. **Data classification enforced** — every data flow tagged with §7 classification tier
3. **No shadow integrations** — all integrations must be registered here; unregistered integrations blocked
4. **Rate limit compliance** — all connectors implement rate limiting per vendor limits
5. **Audit trail mandatory** — all reads and writes logged to integration audit log
6. **Rollback required** — all write operations must have rollback capability
7. **Health monitoring mandatory** — all connectors have health check endpoint monitored every 5 min
8. **Human approval for external publishing** — outbound data to external parties requires H-NNN gate

---

## Capability Gap Tracker

> Full gap documentation with workarounds, resolution paths, and detection history: `integrations/CAPABILITY-GAP-TRACKER.md`

| Gap ID | Missing Capability | Severity | Blocked Agents | Owner | Target |
|--------|--------------------|----------|---------------|-------|--------|
| GAP-INT-001 | Neo4j native connector | HIGH | knowledge-systems-agent, architect-agent | connector-builder-agent | Q3 2026 |
| GAP-INT-002 | Vector DB MCP server | HIGH | knowledge-systems-agent, workflow-routing-agent | ai-engineer-agent | Q3 2026 |
| GAP-INT-003 | SAP native connector | MEDIUM | fintech-pm-agent, executive-communications-agent | fintech-pm-agent | Q4 2026 |
| GAP-INT-004 | Looker dashboard write API | MEDIUM | dashboard-generation-agent | dashboard-generation-agent | Q3 2026 |
| GAP-INT-005 | Real-time event bus | CRITICAL | ALL real-time ingestion workflows | workflow-runtime-agent | Q2 2026 |
| GAP-INT-006 | Webhook endpoint receiver | CRITICAL | ALL external event ingestion | enterprise-systems-agent | Q2 2026 |
| GAP-INT-007 | Vault secrets manager | HIGH | ALL connectors (authentication blocked) | security-architect-agent | Q2 2026 |

**Current fabric status:** GAP-INT-005 and GAP-INT-006 mean the OS operates in pull-only mode — no real-time event ingestion from any external system. GAP-INT-007 means connector authentication requires manual credential injection per session. Q2 2026 is the target for resolving all three CRITICAL/blocking gaps.

---
