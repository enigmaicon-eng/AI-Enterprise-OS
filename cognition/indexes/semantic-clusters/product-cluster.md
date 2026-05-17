---
layer: cognition-indexes
type: semantic-cluster
cluster: product
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
---

# Product Semantic Cluster

Entries conceptually related to product management, requirements, roadmaps, user stories, PRDs, and product decisions.

**Retrieval trigger:** Any routing key containing: feature-requirements, technical-product, financial-product, strategic-product, ai-feature-requirements.

---

## Cluster Members

### Blocking Context (Always Load for Product Tasks)
- `memory/open-questions.md` — Q-001 through Q-005 blocking all product work [CRITICAL]

### Product Domain Memory
- `memory/domains/product/` — Product domain memory [CRITICAL]
- `wiki/product/` — Product wiki (roadmaps, initiatives, decisions) [HIGH]

### Roadmap and Strategy
- `architecture/organizational-evolution-roadmap.md` — 4-phase strategic roadmap [HIGH]
- `handoffs/session-2026-05-09/important-decisions.md` — Product-relevant decisions (D-001 through D-014) [HIGH]

### Product Templates
- `templates/prd-template.md` — PRD template [HIGH]
- `templates/user-story-template.md` — User story template [NORMAL]
- `templates/initiative-brief-template.md` — Initiative brief [NORMAL]

### Integration Context (Cross-Domain)
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — What capabilities are available for product features [NORMAL]
- `integrations/CAPABILITY-GAP-TRACKER.md` — What is NOT available (constraints on product scope) [HIGH]

### Governance Constraints on Product
- `docs/governance/principles.md` — Governance constraints that apply to product decisions [HIGH]
- `constitution/enterprise-constitution.md` — Constitutional constraints [HIGH]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| Product domain memory | open-questions.md (always — blocking context) |
| PRD template | Product domain memory, integration capabilities |
| Roadmap | Strategic gap analysis, decisions |
| Financial product | Finance domain memory (CONFIDENTIAL), legal constraints |
| AI feature | AI domain memory, integration capabilities |

---

## Agents with Product as Primary Domain

- `senior-pm-agent` (T2)
- `technical-pm-agent` (T2)
- `fintech-pm-agent` (T2)
- `vp-product-agent` (T4)
- `ai-pm-agent` (T2, if defined)

---

## Known Product Blockers

The following questions in `memory/open-questions.md` block all substantive product work and must be surfaced in every product context package:

- **Q-001:** What is the target customer segment?
- **Q-002:** What is the primary product thesis?
- **Q-003:** What is the MVP definition?
- **Q-004:** What is the go-to-market strategy?
- **Q-005:** What is the success metric framework?