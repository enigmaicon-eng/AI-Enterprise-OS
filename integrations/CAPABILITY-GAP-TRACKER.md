---
type: capability-gap-tracker
version: 1.0.0
created: 2026-05-10
owner: tool-gap-detection-agent
review-cadence: weekly
authority: enterprise-systems-agent
---

# Capability Gap Tracker

> Every missing capability that blocks OS agents or workflows is tracked here. New gaps are opened by `tool-gap-detection-agent`. Gaps are reviewed weekly by `enterprise-systems-agent` and `capability-expansion-agent`. This tracker is the primary input to the quarterly capability expansion roadmap.

---

## Gap Summary

| Severity | Count | Gap IDs |
|----------|-------|---------|
| CRITICAL | 2 | GAP-INT-005, GAP-INT-006 |
| HIGH | 3 | GAP-INT-001, GAP-INT-002, GAP-INT-007 |
| MEDIUM | 2 | GAP-INT-003, GAP-INT-004 |
| LOW | 0 | — |
| **TOTAL OPEN** | **7** | |

**Immediate action required on CRITICAL gaps.** GAP-INT-005 and GAP-INT-006 mean the OS cannot receive real-time events from any external system. All "webhook-based" connector behavior described in connector files is aspirational until GAP-INT-006 is resolved. GAP-INT-007 means no connector can authenticate without manual credential injection per session.

---

## Open Gaps

---

### GAP-INT-001: Neo4j Native Connector

- **Severity:** HIGH
- **Detected:** 2026-05-09
- **Detected by:** tool-gap-detection-agent (knowledge-systems-agent fallback pattern observed)
- **Blocked agents:** knowledge-systems-agent, architect-agent
- **Blocked workflows:** impact-analysis-workflow, knowledge-graph-query-workflow, architecture-dependency-mapping
- **Description:** The OS has no native connector to Neo4j. The `knowledge-systems-agent` is designed to maintain and query a graph of entities, relationships, and dependencies across the entire OS knowledge base. Without a graph database, it cannot execute graph traversals, shortest-path queries, or relationship-pattern searches. The `architect-agent` depends on graph queries for impact analysis (e.g., "which systems are affected if we change the data schema in Snowflake?"). Both agents are currently operating at severely degraded capability.
- **Workaround:** Manual markdown graph representation in `memory/knowledge-graph/` — flat markdown files simulate graph nodes and edges. Graph traversal is done via text search and manual reasoning. Quality is poor: transitive relationships are missed, relationship queries are O(n) text scans, and the graph is not updated automatically on OS state changes.
- **Resolution path:** `connector-builder-agent` to build Neo4j connector using the Bolt protocol. Requires: connector specification from `connector-architecture-agent`, Neo4j instance provisioned (cloud or on-prem), credentials in Vault (blocked by GAP-INT-007). Connector file stub exists at `integrations/data/neo4j.md`.
- **Target:** Q3 2026
- **Status:** OPEN
- **Owner:** connector-builder-agent

---

### GAP-INT-002: Vector DB MCP Server

- **Severity:** HIGH
- **Detected:** 2026-05-09
- **Detected by:** tool-gap-detection-agent (semantic search degradation observed in knowledge-systems-agent outputs)
- **Blocked agents:** knowledge-systems-agent, workflow-routing-agent
- **Blocked workflows:** semantic-search-workflow, similarity-based-routing-workflow, context-retrieval-workflow, RAG-augmented-generation-workflow
- **Description:** The OS has no vector database connector and no MCP server for any vector DB provider (Pinecone, Weaviate, Qdrant, pgvector, Chroma). The `knowledge-systems-agent` requires semantic search to retrieve contextually relevant documents from the OS knowledge base — keyword search misses semantically related but lexically different content. The `workflow-routing-agent` uses similarity matching to route novel requests to the closest matching workflow template. Both agents are currently operating on keyword grep, which produces recall rates estimated at 40-60% of what vector search would achieve. This directly degrades the quality of every agent decision that relies on knowledge retrieval.
- **Workaround:** Keyword grep of markdown files using file search tools. Severely degrades semantic recall — agents miss relevant context that uses different terminology. No similarity routing: workflow-routing-agent falls back to rule-based routing, which fails on novel request patterns.
- **Resolution path:** Two parallel paths: (1) `ai-engineer-agent` to evaluate and deploy a vector DB instance (recommended: pgvector on PostgreSQL for simplicity, or Qdrant for performance); (2) `mcp-integration-agent` to check if any vector DB vendor has released an MCP server and propose adoption. Connector spec to be written by `connector-architecture-agent`. Requires Vault for credentials (blocked by GAP-INT-007).
- **Target:** Q3 2026
- **Status:** OPEN
- **Owner:** ai-engineer-agent

---

### GAP-INT-003: SAP Native Connector

- **Severity:** MEDIUM
- **Detected:** 2026-05-10
- **Detected by:** enterprise-systems-agent (financial data ingestion gap identified during registry audit)
- **Blocked agents:** fintech-pm-agent, executive-communications-agent
- **Blocked workflows:** financial-reporting-workflow, budget-variance-workflow, quarterly-business-review-workflow
- **Description:** The OS has no connector to SAP ERP. The `fintech-pm-agent` requires access to financial ledger data, budget actuals, and P&L data from SAP to support financial planning workflows. The `executive-communications-agent` cannot generate complete quarterly business reviews without financial data, since revenue, cost, and margin data live exclusively in SAP. Currently, financial data cannot be ingested automatically — it must be manually exported by the finance team and handed to OS agents in each session.
- **Workaround:** Manual CSV export from the finance team, provided to the OS agent in-session. This introduces a dependency on human availability, limits the freshness of financial data (typically 24-48 hours stale), and creates an untracked data flow that bypasses governance.
- **Resolution path:** `connector-builder-agent` to build SAP connector using SAP OData API or RFC/BAPI interfaces. SAP integration is complex (requires SAP Basis team coordination, service account provisioning, and RFC destination setup). `fintech-pm-agent` to own the business requirements and stakeholder coordination with the SAP Basis team. Requires Vault for credentials (blocked by GAP-INT-007). Connector file stub exists at `integrations/erp/sap.md`.
- **Target:** Q4 2026
- **Status:** OPEN
- **Owner:** fintech-pm-agent

---

### GAP-INT-004: Looker Dashboard Write API

- **Severity:** MEDIUM
- **Detected:** 2026-05-10
- **Detected by:** dashboard-generation-agent (attempting full dashboard creation via Looker API)
- **Blocked agents:** dashboard-generation-agent
- **Blocked workflows:** analytics-dashboard-publishing-workflow
- **Description:** The Looker API supports creating individual Looks (saved queries with visualizations) but does not expose a stable API for programmatically creating full Dashboards (multi-panel layouts with filters, tiles, and cross-filter configurations). The `dashboard-generation-agent` can create individual Looks and retrieve existing dashboard metadata via the Looker API, but cannot automate the creation of complete Looker Dashboards without a user manually assembling tiles in the Looker UI. This limits the agent to a "partial automation" mode where it creates the constituent Looks and then must hand off to a human for dashboard assembly.
- **Workaround:** `dashboard-generation-agent` creates individual Looks via Looker API and documents the manual dashboard assembly steps in a handoff note to the user. User assembles the final dashboard in the Looker UI. Estimated manual effort: 30-60 minutes per dashboard.
- **Resolution path:** Monitor Looker API changelog for dashboard write API release (Looker has indicated this is on their roadmap). As a parallel path, `dashboard-generation-agent` to evaluate Looker's LookML approach — defining dashboards in code (LookML dashboard files) that can be deployed via the Looker API's `lookml_dashboard` endpoint. This is a viable full-automation path if the LookML approach is acceptable to the analytics team. `dashboard-generation-agent` to prototype and validate.
- **Target:** Q3 2026
- **Status:** OPEN
- **Owner:** dashboard-generation-agent

---

### GAP-INT-005: Real-Time Event Bus

- **Severity:** CRITICAL
- **Detected:** 2026-05-09
- **Detected by:** enterprise-systems-agent (architectural gap identified during integration fabric design)
- **Blocked agents:** ALL agents that depend on real-time data ingestion
- **Blocked workflows:** ALL real-time ingestion workflows across all 33 connectors, including: sprint-event-workflow, incident-response-workflow, deploy-event-workflow, alert-routing-workflow, code-review-event-workflow
- **Description:** This is the most critical architectural gap in the integration fabric. The OS has no message bus or event streaming infrastructure. Without an event bus, integrations cannot publish or subscribe to events — agents must poll external systems on a fixed cadence rather than reacting to events as they occur. This means: (1) the OS cannot react to a Jira issue being created until the next poll cycle; (2) the OS cannot trigger a workflow when a GitHub PR is merged; (3) the OS cannot respond to a PagerDuty incident alert within seconds. The gap forces the OS into a fundamentally reactive, polling-based architecture that introduces latency (5-15 minutes per cycle), wastes API rate limit budget on redundant polls, and prevents the OS from being a real-time operational system. Every connector that claims real-time behavior in its connector file is aspirational until this gap is closed.
- **Workaround:** Manual polling at fixed intervals (5-minute minimum to stay within rate limits) combined with human-initiated workflow triggers. Real-time events are effectively lost — an incident that fires at 14:01 is not visible to the OS until 14:05-14:10. Human-initiated triggers require a human to actively start the OS workflow in response to an external event.
- **Resolution path:** Deploy a message bus. Three options ranked by implementation cost: (1) **Redis Streams** — lowest cost, suitable for moderate event volumes, can run as a sidecar; (2) **AWS EventBridge** — zero infrastructure management, native AWS integration, pay-per-event; (3) **Apache Kafka** — highest throughput and durability, appropriate for large-scale production, highest operational overhead. `workflow-runtime-agent` to evaluate and recommend. Once deployed, all 33 connectors can publish events to the bus and OS agents subscribe to relevant topics. GAP-INT-006 (webhook receiver) must be resolved in parallel — the event bus only solves the internal routing problem; webhook receipt is the external ingestion problem.
- **Target:** Q2 2026
- **Status:** OPEN
- **Owner:** workflow-runtime-agent

---

### GAP-INT-006: Webhook Endpoint Receiver

- **Severity:** CRITICAL
- **Detected:** 2026-05-09
- **Detected by:** enterprise-systems-agent (architectural gap identified during integration fabric design)
- **Blocked agents:** ALL agents dependent on external system events: enterprise-systems-agent, workflow-routing-agent, incident-response-agent
- **Blocked workflows:** ALL webhook-based ingestion from external systems — Jira issue webhooks, GitHub push events, PagerDuty incident webhooks, Datadog alert webhooks, ServiceNow change events, ArgoCD deploy events
- **Description:** The OS has no persistent service capable of receiving HTTP webhook callbacks from external systems. External systems like Jira, GitHub, PagerDuty, and Datadog are configured to push events to a registered endpoint URL when things happen (issue created, PR merged, incident triggered, alert fired). Without a persistent endpoint, there is nowhere for these systems to push events — the OS is invisible to the entire external event ecosystem. All real-time event ingestion described in connector files is currently impossible. The OS cannot be notified when a sprint is updated, when a deployment fails, when an incident is created, or when any other external event occurs. It operates entirely on stale, polled data. This gap is the primary reason the OS cannot function as a real-time operational system.
- **Workaround:** None. Real-time events from external systems are lost. The OS operates on stale data from the last polling cycle. Human operators must manually trigger OS workflows in response to external events they observe.
- **Resolution path:** Deploy a minimal webhook receiver service. Development path: (1) **ngrok** for immediate development/testing — exposes a local endpoint to the internet, sufficient for prototyping all connector webhook integrations; (2) **Serverless function** (AWS Lambda + API Gateway, or Google Cloud Functions) for production — zero infrastructure management, auto-scaling, low cost at low event volumes; (3) **Dedicated microservice** for high-volume production. The receiver must: authenticate each incoming webhook (HMAC signature verification), parse the event payload, route to the correct connector handler, publish to the event bus (GAP-INT-005), and return a 200 response within 3 seconds. This is a blocking dependency for all 33 connectors achieving their documented real-time capabilities.
- **Target:** Q2 2026
- **Status:** OPEN
- **Owner:** enterprise-systems-agent

---

### GAP-INT-007: Vault Secrets Manager

- **Severity:** HIGH
- **Detected:** 2026-05-10
- **Detected by:** security-architect-agent (credential management audit)
- **Blocked agents:** ALL connector agents — no connector can authenticate against its target system without Vault
- **Blocked workflows:** ALL connector-dependent workflows (effectively all OS workflows that touch external systems)
- **Description:** Every connector file in the OS references credentials stored at `vault://enterprise-os/...` paths. No Vault instance exists. This means that while the connector architecture is correctly designed (credentials referenced from Vault, never hardcoded), no connector can actually authenticate against its target system in an automated, persistent, and secure way. Currently, credentials must be manually injected into the Claude session by the human operator at session start — an insecure, unscalable, and ungoverned practice. There is no credential rotation, no access audit trail for credential reads, and no revocation capability. If a credential is compromised, there is no automated response. The entire authentication layer of the integration fabric is theoretical until Vault is deployed.
- **Workaround:** Manual credential provision per Claude session by the human operator. Credentials are provided in-context (e.g., pasted API keys) and are not persisted between sessions. This approach: (1) is not scalable — operators must re-inject credentials in every session; (2) is not auditable — there is no record of which credentials were used in which sessions; (3) is not rotatable — there is no mechanism to rotate credentials across connectors automatically; (4) creates a security risk if session transcripts are stored.
- **Resolution path:** Deploy HashiCorp Vault (OSS or HCP) or AWS Secrets Manager. Recommended path: (1) **AWS Secrets Manager** if running on AWS — managed service, no infrastructure overhead, native IAM integration, automatic rotation for supported services; (2) **HashiCorp Vault OSS** for on-prem or multi-cloud environments. Once deployed: update all connector files to use the actual Vault API paths, implement the connector credential-fetch pattern (each connector fetches its credential at execution time from Vault via the appropriate auth method), configure automatic rotation for all credentials per the rotation schedule in the auth matrix, and enable Vault audit logging for all credential reads.
- **Target:** Q2 2026
- **Status:** OPEN
- **Owner:** security-architect-agent

---

## Resolved Gaps

*No gaps have been resolved yet. This section will track resolved gaps with resolution date and verification method.*

---

## Gap Detection Protocol

When `tool-gap-detection-agent` detects a new gap, it follows this protocol:

1. **Detection trigger** — one of: (a) agent explicitly requests a tool not in the tool catalog; (b) agent falls back to a documented workaround that indicates missing capability; (c) workflow step fails with "capability unavailable"; (d) enterprise-systems-agent identifies a gap during monthly review
2. **Severity classification** — CRITICAL: blocks multiple agents or all workflows in a category; HIGH: blocks a named agent from its primary function; MEDIUM: partial capability exists but key function is missing; LOW: convenience gap, workaround is acceptable
3. **Gap file creation** — add entry to this tracker in the format above
4. **Registry update** — add gap reference to `integrations/MASTER-INTEGRATION-REGISTRY.md` capability gap table
5. **Owner assignment** — assign to the agent best positioned to resolve (typically: connector-builder-agent for connector gaps, ai-engineer-agent for AI infrastructure gaps, security-architect-agent for security gaps)
6. **Stakeholder notification** — enterprise-systems-agent notifies orchestrator; capability-expansion-agent updates roadmap

---

*Last updated: 2026-05-10 | Owner: tool-gap-detection-agent | Review cadence: weekly*
*Next review: 2026-05-17 | Authority: enterprise-systems-agent*
