---
type: agent-org-readme
organization: connector-mcp-org
agent-count: 7
owner: enterprise-systems-agent
---

# Connector + MCP Organization

> The platform team for the Integration Fabric. This organization owns all 33 enterprise system connectors, the MCP server catalog, the source-of-truth registry, and the capability expansion roadmap.

---

## What This Organization Does

The Connector + MCP Organization is the internal platform team that every other OS agent organization depends on. It does not build product features — it builds and maintains the infrastructure that allows OS agents to read from and write to external enterprise systems. Without this organization, OS agents are isolated; with it, they can ingest data from Jira, GitHub, Datadog, Salesforce, and 29 other systems, and publish artifacts to Confluence, Slack, Figma, Gamma, and everywhere else.

---

## The 7 Agents

| Agent | Role | Start Here When... |
|-------|------|-------------------|
| **connector-architecture-agent** | Connector design patterns and standards | Adding a new connector or reviewing an existing one for standards compliance |
| **mcp-integration-agent** | MCP server inventory and tool routing | Checking which MCP servers are available, or routing a request through MCP vs. a connector |
| **enterprise-systems-agent** | Master registry authority and monthly review | Resolving a data conflict between two systems, auditing for shadow integrations, running the monthly review |
| **connector-builder-agent** | Builds new connectors from specifications | A new system needs a connector and the specification has been approved |
| **tool-capability-agent** | Exhaustive tool catalog | Determining whether a capability exists before attempting an operation |
| **tool-gap-detection-agent** | Detects and logs missing capabilities | A capability appears to be missing; open a GAP-INT-NNN entry |
| **capability-expansion-agent** | Strategic capability roadmap | Quarterly roadmap reprioritization, evaluating new MCP server adoption |

---

## How to Use This Organization

**Adding a new connector**
Start with `connector-architecture-agent`. Provide the target system name and the capabilities needed (read, write, or both). The agent produces a connector specification. Then `connector-builder-agent` builds the connector from the spec. Finally, `enterprise-systems-agent` registers it in the master registry after security review passes.

**Checking MCP tool availability**
Query `mcp-integration-agent` with the capability needed. It will return whether an MCP server covers that capability in the current session, or whether a connector fallback must be used. Always prefer MCP over connector fallbacks — MCP tools have lower latency and higher fidelity.

**Resolving a data conflict**
Route to `enterprise-systems-agent` with the conflicting data values and their source systems. The agent applies the source-of-truth hierarchy from the master registry and returns the authoritative value.

**Reporting a missing capability**
Route to `tool-gap-detection-agent`. Provide: what capability was needed, which agent needed it, which workflow was blocked, and what workaround (if any) is in use. The agent opens a GAP-INT-NNN entry, classifies severity, and assigns an owner.

**Viewing the capability roadmap**
Query `capability-expansion-agent` for the current roadmap and gap prioritization. The roadmap is updated quarterly and after every CRITICAL gap is detected.

---

## Key Files

| File | Purpose |
|------|---------|
| `agents/connector-mcp-org.md` | Full agent definitions for all 7 agents |
| `integrations/MASTER-INTEGRATION-REGISTRY.md` | The authoritative registry of all 33 connectors |
| `integrations/INTEGRATION-FABRIC-README.md` | Master entry point for the entire fabric |
| `integrations/CAPABILITY-GAP-TRACKER.md` | All open capability gaps with severity, owner, and resolution path |

---

## Current Status

7 open capability gaps — 2 CRITICAL (event bus, webhook receiver), 3 HIGH (Neo4j, Vector DB, Vault), 2 MEDIUM (SAP, Looker write API). See `integrations/CAPABILITY-GAP-TRACKER.md` for full status.

*Last updated: 2026-05-10 | Main file: agents/connector-mcp-org.md*
