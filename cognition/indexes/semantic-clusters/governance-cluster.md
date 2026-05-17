---
layer: cognition-indexes
type: semantic-cluster
cluster: governance
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
---

# Governance Semantic Cluster

Entries in this cluster are conceptually related to organizational governance, authority, policy, and compliance. When any one entry is retrieved for a governance-related task, the others should be considered for co-retrieval.

**Retrieval trigger:** Any routing key containing: governance, compliance, constitutional, authority, policy, ADR, principle.

---

## Cluster Members

### Core Authority Documents
- `constitution/enterprise-constitution.md` — Constitutional authority (DRAFT) [T1]
- `docs/governance/principles.md` — Five immutable governance principles [T1]
- `knowledge-governance/source-of-truth-hierarchy.md` — 7-tier authority hierarchy [T2]

### Policy and Standards
- `docs/governance/security-policy.md` — Security access control policy [T2]
- `docs/governance/quality-gate-policy.md` — Quality gate requirements [T2]
- `memory/organizational/quality-standards.md` — Quality standards (PENDING CREATION) [T2]

### Governance Process
- `knowledge-governance/contradiction-resolution-system.md` — Contradiction resolution protocol [T2]
- `knowledge-governance/artifact-authority-system.md` — Who owns what artifacts [T2]
- `knowledge-governance/organizational-truth-reconciliation.md` — Truth reconciliation protocol [T2]
- `knowledge-governance/knowledge-lifecycle-system.md` — Knowledge state governance [T2]

### Compliance
- `memory/domains/legal/` — Legal and compliance memory (CLASSIFIED) [T2]
- `integrations/CAPABILITY-GAP-TRACKER.md` — Capability gap governance [T3]

### Governance Metrics
- `architecture/enterprise-maturity-model.md` — Governance maturity dimension [T3]
- `observability/metrics.md` — Governance metrics (ADR compliance, gate pass rates) [T3]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| constitution | principles.md, source-of-truth-hierarchy |
| ADR | artifact-authority-system, source-of-truth-hierarchy |
| Quality gate | quality-gate-policy, quality-standards |
| Compliance | legal memory, constitution |
| Contradiction | contradiction-resolution-system, organizational-truth-reconciliation |

---

## Agents with Governance as Primary Domain

- `enterprise-constitution-guardian-agent` (T5)
- `compliance-governance-agent` (T2)
- `vp-engineering-agent` (T4, governance authority)
- `chief-architect-agent` (T4, architectural governance)