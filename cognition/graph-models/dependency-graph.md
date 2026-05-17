---
layer: graph-models
type: dependency-graph
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
status: active
---

# Dependency Graph

The technical and organizational dependency model of the Enterprise AI OS. Encodes what depends on what, enabling impact analysis, change planning, and risk assessment.

---

## Dependency Categories

### Category 1: Structural Dependencies
Dependencies where a component cannot exist or function without another.

### Category 2: Operational Dependencies
Dependencies where a component operates at degraded capability without another (but does not fail completely).

### Category 3: Knowledge Dependencies
Dependencies where an agent cannot make correct decisions without a specific knowledge artifact.

### Category 4: Temporal Dependencies
Dependencies where execution order matters — B cannot start before A completes.

---

## Critical Structural Dependencies (HARD — system fails without these)

| Dependent | Depends On | Type | Current Status |
|---|---|---|---|
| ALL connector authentication | Vault secrets manager (GAP-INT-007) | STRUCTURAL | DEGRADED — manual creds |
| ALL real-time event ingestion | Event bus (GAP-INT-005) | STRUCTURAL | DEGRADED — pull-only mode |
| ALL webhook-based triggers | Webhook endpoint (GAP-INT-006) | STRUCTURAL | DEGRADED — triggers lost |
| knowledge-systems-agent (graph) | Neo4j connector (GAP-INT-001) | STRUCTURAL | DEGRADED — markdown sim |
| knowledge-systems-agent (semantic) | Vector DB (GAP-INT-002) | STRUCTURAL | DEGRADED — keyword only |
| ALL L-tier engineering | Any accepted ADR | STRUCTURAL | BLOCKED — no ADRs yet |
| ALL product work | Resolved Q-001 through Q-005 | STRUCTURAL | BLOCKED — open questions |
| Constitution enforcement | Human ratification | STRUCTURAL | BLOCKED — draft status |

### Critical Operational Dependencies (SOFT — degraded without these)

| Dependent | Depends On | Without It |
|---|---|---|
| dashboard-generation-agent | Looker write API (GAP-INT-004) | Partial automation only |
| fintech-pm-agent (financial) | SAP native connector (GAP-INT-003) | Manual CSV export |
| Contradiction detection | hallucination-detection-agent | Manual scan only |
| Semantic search | vector-db | Keyword grep (~50% recall) |
| Graph queries | Neo4j | Manual traversal (~60% utility) |
| Cross-session context | Session checkpoints | Context reconstruction from scratch |

---

## Workflow Dependency Chain

Temporal dependencies between workflows — which must complete before another can start:

```
Product Discovery Workflow
    │ produces: approved PRD
    │ temporal dependency for:
    ▼
Architecture Workflow
    │ produces: accepted ADR
    │ temporal dependency for:
    ▼
Engineering Workflow (L-tier)
    │ produces: PR ready for QA
    │ temporal dependency for:
    ▼
QA Workflow
    │ produces: QA PASS verdict
    │ temporal dependency for:
    ▼
Release Workflow

AI Feature Workflow:
    ├── Parallel with Engineering Workflow (replaces steps 3-9)
    └── Requires: approved PRD + eval framework (from ai-evaluation-qa-agent)
```

No workflow may start without its predecessor completing the required gate.

---

## Integration Dependency Matrix

Which agents depend on which integrations:

| Integration | Agents That Depend On It | Dependency Type |
|---|---|---|
| Jira | delivery-manager-agent, program-manager-agent | Sprint state input |
| GitHub | all engineering agents, devops-engineer-agent | Code output |
| Confluence | knowledge-systems-engineer-agent, technical-documentation-agent | Wiki publication |
| Slack | all agents (notifications) | Communication output |
| Figma | design-systems-agent, diagram-generation-agent | Design input/output |
| Gamma | presentation-generation-agent, executive-communications-agent | Presentation output |
| Datadog | runtime-observability-agent, operational-analytics-agent | Metrics input |
| PagerDuty | incident-manager-agent, delivery-manager-agent | Incident alerting |
| Snowflake | forecasting-agent, operational-analytics-agent | Data warehouse input |
| Salesforce | customer-intelligence-agent, customer-success-agent | CRM data input |
| SAP | fintech-pm-agent, executive-communications-agent | Financial data input |
| ServiceNow | enterprise-operations-agent, audit-readiness-agent | ITSM data |
| Workday | enterprise-operations-agent, organizational-health-analytics-agent | HR data |
| Kubernetes | platform-engineer-agent, devops-engineer-agent, runtime-observability-agent | Infra state |
| Neo4j | knowledge-systems-agent, principal-architect-agent | Knowledge graph |
| Vector DB | knowledge-systems-agent, workflow-routing-agent | Semantic search |

---

## Knowledge Artifact Dependencies

Which agent definitions depend on which knowledge artifacts:

| Agent | Knowledge Dependencies | Impact if Missing |
|---|---|---|
| executive-orchestrator-agent | MASTER-REGISTRY.md, ROUTING-TABLE.md | Cannot route any intent |
| workflow-routing-agent | routing-rules.md, ROUTING-TABLE.md | Falls back to ad-hoc routing |
| knowledge-systems-agent | MEMORY_INDEX.md, cognition-indexes/ | Cannot assemble context packages |
| context-routing-engine | context budgets, ontology | Cannot scope context correctly |
| hallucination-detection-agent | consistency-anchor, T3+ sources | Cannot detect contradictions |
| principal-architect-agent | ADR registry, architecture/decisions/ | Cannot enforce ADR constraints |
| all domain agents | ontology/core-concepts.md | Term usage inconsistency |

---

## Circular Dependency Audit

Circular dependencies are prohibited — they create deadlocks. Known circular risk areas:

| Risk | Status | Resolution |
|---|---|---|
| knowledge-systems-agent needs index to load index | RESOLVED — index bootstrapped from file scan, not from itself |
| orchestrator needs agents loaded to route agent loading | RESOLVED — mandatory context loaded before agent routing begins |
| contradiction-detection needs context to detect contradictions | RESOLVED — detection uses consistency-anchor (pre-loaded), not assembled context |

No active circular dependencies are known. Any new architectural change must be audited for circularity before implementation.

---

## Dependency Change Protocol

When adding or changing a dependency:

1. **Add to this file:** Document the new dependency (dependent, depends-on, type)
2. **Impact analysis:** Run the impact analysis protocol from enterprise-cognition-graph.md
3. **Risk assessment:** What breaks if the new dependency is unavailable?
4. **Fallback design:** Define the degraded-mode behavior when the dependency is missing
5. **ADR (if L-tier change):** Document the decision to add this dependency
6. **Graph update:** Add DEPENDS_ON edge to graph-models/edges/depends-on-edges.md
