---
type: index
created: 2026-05-08
updated: 2026-05-08
---

# Playbooks

Step-by-step operational guides for recurring processes. Playbooks are distinct from:
- `workflows/` — machine-executable specs with YAML schemas and gate logic
- `wiki/processes/` — conceptual guides explaining when and why to use a workflow
- `templates/` — fill-in-the-blank document starters

**A playbook answers: "What exactly do I do, in what order, right now?"**

---

## Playbook Catalog

| Playbook | Cadence | Owner | Duration | Trigger |
|---------|---------|-------|---------|---------|
| [Daily Operating](daily-operating-playbook.md) | Every working day | delivery-agent | 60–90 min distributed | Day start |
| [Sprint](sprint-playbook.md) | Every 2 weeks | delivery-agent | 2 weeks | Sprint start |
| [Release](release-playbook.md) | Per release | delivery-agent | 2–5 days + 48h hypercare | QA PASS verdict |
| [Incident](incident-playbook.md) | On demand | incident-commander | P1 ≤1h · P2 ≤4h · P3 ≤24h | `!incident` |
| [Architecture Review](architecture-review-playbook.md) | Per L-tier feature | architect-agent | 2–5 days | PRD approved + design exists |
| [PM Review](PM-review-playbook.md) | Weekly + sprint-end | pm-agent | 45–90 min | Monday (metrics) · Wed (roadmap) · Sprint-end |

---

## Playbook Selection Guide

```
Production system degraded or broken?
  → incident-playbook.md

Starting a new sprint?
  → sprint-playbook.md

QA just passed — ready to ship?
  → release-playbook.md

Design for L-tier feature ready for review?
  → architecture-review-playbook.md

Monday or Wednesday or end of sprint?
  → PM-review-playbook.md

Every other working day?
  → daily-operating-playbook.md
```

---

## Relationship to Workflows

Playbooks and workflows are complementary — playbooks are the human/agent operational guide; workflows contain the machine-executable schema.

| Playbook | Calls into Workflow |
|---------|-------------------|
| daily-operating | `workflows/incident-workflow.md` (if anomaly detected) |
| sprint | `workflows/engineering-workflow.md`, `workflows/qa-workflow.md` |
| release | `workflows/qa-workflow.md`, `workflows/incident-workflow.md` (if rollback needed) |
| incident | `workflows/incident-workflow.md` |
| architecture-review | `workflows/architecture-workflow.md` |
| PM-review | `workflows/product-discovery.md` (if new discovery triggered) |

---

## Playbook Governance

- Playbooks are reviewed quarterly — or after any incident where following the playbook produced a bad outcome
- Proposed changes go through an RFC if they affect cross-team behavior
- Exceptions to a playbook step must be logged with a reason — not silently skipped
