---
layer: cognition-indexes
type: semantic-cluster
cluster: engineering
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
---

# Engineering Semantic Cluster

Entries conceptually related to software engineering, architecture, technical decisions, implementation, and quality.

**Retrieval trigger:** Any routing key containing: feature-development, principal-architecture, quality-verification, data-pipeline, technical-product, security-design.

---

## Cluster Members

### Architecture
- `architecture/strategic-gap-analysis.md` — 47 gaps, 9 CRITICAL [CRITICAL]
- `architecture/enterprise-maturity-model.md` — 12 maturity dimensions [HIGH]
- `architecture/organizational-evolution-roadmap.md` — 4-phase roadmap [HIGH]
- `graph-models/enterprise-cognition-graph.md` — Full system graph [HIGH]
- `graph-models/dependency-graph.md` — Critical path and dependencies [HIGH]
- `handoffs/session-2026-05-09/important-decisions.md` — D-001 through D-014 [HIGH]

### Technical Memory
- `memory/domains/engineering/` — Engineering domain memory [CRITICAL]
- `wiki/engineering/` — Engineering wiki [HIGH]

### Integration
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — All 33 integrations [HIGH]
- `integrations/CAPABILITY-GAP-TRACKER.md` — 7 gaps with workarounds [HIGH]

### Quality
- `memory/organizational/quality-standards.md` — Quality standards (PENDING) [HIGH]
- `docs/governance/quality-gate-policy.md` — Gate policy [HIGH]
- `observability/metrics.md` — DORA and quality metrics [HIGH]

### Security (Engineering Perspective)
- `memory/domains/security/` — Security constraints (RESTRICTED) [HIGH]
- `docs/governance/security-policy.md` — Security requirements [HIGH]

### Schemas and Ontology
- `graph-models/schema-registry.md` — Node and edge type definitions [NORMAL]
- `ontology/workflow-vocabulary.md` — Workflow terms [NORMAL]
- `ontology/runtime-vocabulary.md` — Runtime terms [NORMAL]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| Engineering memory | Quality standards, governance principles |
| Architecture gap | Strategic gap analysis + dependency graph |
| Integration | Capability gap tracker |
| ADR | Architectural decisions handoff |
| Security constraint | OWASP requirements in security domain |

---

## Agents with Engineering as Primary Domain

- `principal-architect-agent` (T2)
- `chief-architect-agent` (T4)
- `backend-engineer-agent` (T2)
- `frontend-engineer-agent` (T2)
- `junior-engineer-agent` (T1)
- `security-architect-agent` (T2)
- `qa-lead-agent` (T2)
- `test-engineer-agent` (T1)
- `data-engineer-agent` (T2)
- `vp-engineering-agent` (T4)