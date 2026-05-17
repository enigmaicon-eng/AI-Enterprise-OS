---
layer: cognition-indexes
type: semantic-cluster
cluster: integration
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
---

# Integration Semantic Cluster

Entries conceptually related to external integrations, connectors, APIs, data flows, capability gaps, and integration governance.

**Retrieval trigger:** Any routing key containing: integration, connector, API, external-system, data-pipeline, data-flow, webhook, event-bus.

---

## Cluster Members

### Integration Registry (Always Load)
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — All 33 integrations, auth matrix, data flows [CRITICAL]
- `integrations/CAPABILITY-GAP-TRACKER.md` — 7 gaps (2 CRITICAL) with workarounds [CRITICAL]

### Gap Context (Load When Designing New Features)
- `architecture/strategic-gap-analysis.md` — 47 gaps including integration gaps [HIGH]
- `memory/known-risks.md` — Integration-related risks [HIGH]

### Integration Governance
- `docs/governance/principles.md` — Integration governance principles [HIGH]
- `knowledge-governance/artifact-authority-system.md` — Integration spec ownership [NORMAL]

### Event and Webhook Context
- `ontology/event-vocabulary.md` — integration.external.received event type [HIGH]
- `integrations/CAPABILITY-GAP-TRACKER.md` — GAP-INT-005 (event bus), GAP-INT-006 (webhook) [CRITICAL]

### Graph Relationships
- `graph-models/dependency-graph.md` — Integration dependency matrix [HIGH]
- `graph-models/schema-registry.md` — INTEGRATION node type properties [NORMAL]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| Integration registry | Capability gap tracker |
| Any specific integration | Auth matrix section, circuit breaker patterns |
| Event bus | GAP-INT-005 workaround: polling patterns |
| Webhook | GAP-INT-006 workaround: scheduled pull |
| New integration design | Governance principles, artifact authority |

---

## Critical Gap Summary (Always Surface)

When integration cluster is active, always surface these CRITICAL gaps:

| Gap ID | Description | Workaround |
|---|---|---|
| GAP-INT-005 | No event bus | Scheduled polling (15-min cycles) |
| GAP-INT-006 | No webhook receiver | Manual trigger or polling |
| GAP-INT-007 | No Vault secrets | Environment variable management (HIGH) |

---

## Agents with Integration as Primary Domain

- `integration-architect-agent` (T2) — if defined
- `data-engineer-agent` (T2)
- `backend-engineer-agent` (T2, for integration consumption)
- `technical-pm-agent` (T2, for integration-driven product features)

---

## Current Integration Coverage (33 of 33)

All integrations are catalogued in `integrations/MASTER-INTEGRATION-REGISTRY.md`. Key categories:
- **Communication:** Slack, Email, Teams
- **Data/Analytics:** BigQuery, Looker, dbt
- **Engineering:** GitHub, Jira, Linear, Sentry, Datadog
- **AI/ML:** OpenAI, Anthropic, Vertex AI
- **Enterprise:** SAP (read-only), Salesforce, ServiceNow
- **Infra:** AWS, GCP, Azure, Terraform, Vault (GAP)
- **Finance:** Stripe, QuickBooks