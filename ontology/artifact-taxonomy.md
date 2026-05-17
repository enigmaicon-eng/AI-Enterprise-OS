---
layer: ontology
type: artifact-taxonomy
version: 1.0.0
created: 2026-05-09
owner: architect-agent
---

# Artifact Taxonomy

All artifact types recognized by the Enterprise AI OS, their classification, canonical paths, required templates, ownership, and lifecycle.

---

## Classification Scheme

Artifacts are classified along three axes:

**1. Domain:** What organizational function produced it
**2. Type:** What kind of output it represents
**3. Lifecycle State:** Draft → Review → Approved → Active → Archived → Superseded

---

## Product Domain Artifacts

| Artifact | Code | Domain | Template | Canonical Path | Owner | Gate |
|---------|------|--------|---------|---------------|-------|------|
| Product Requirements Document | PRD | PM | prd-template.md | `prds/<date>-<slug>.md` | pm-agent | G1 |
| Opportunity Assessment | OPP | PM | — | `prds/discovery/<date>-opportunity.md` | pm-agent | — |
| Positioning Brief | POS | Strategy | — | `prds/discovery/<date>-positioning.md` | strategist-agent | — |
| Market Analysis | MKT | Strategy | — | `wiki/research/<date>-<market>.md` | market-analyst-agent | — |
| Sprint Plan | SP | PM/Delivery | sprint-template.md | `sprints/sprint-NNN/sprint-plan.md` | delivery-agent | — |
| Sprint Review | SR | PM/Delivery | — | `sprints/sprint-NNN/sprint-review.md` | delivery-agent | — |
| Retrospective | RET | PM/Delivery | retro-template.md | `sprints/sprint-NNN/retro.md` | delivery-agent | — |

---

## Architecture Domain Artifacts

| Artifact | Code | Domain | Template | Canonical Path | Owner | Gate |
|---------|------|--------|---------|---------------|-------|------|
| Architecture Decision Record | ADR | Architecture | adr-template.md | `architecture/decisions/ADR-NNN-<slug>.md` | architect-agent | G2 |
| Request for Comments | RFC | Architecture | rfc-template.md | `rfcs/<date>-<slug>.md` | architect-agent | — |
| Architecture Review | ARCH-REV | Architecture | architecture-review-template.md | `architecture/reviews/<date>-<slug>.md` | architect-agent | G2 |
| Threat Model | TM | Security | threat-model-template.md | `security/threat-models/<date>-<slug>.md` | security-agent | G3 |
| API Specification | API | Engineering | api-spec-template.md | `docs/api/<version>/<api-name>.md` | engineer-agent | G2 |

---

## Engineering Domain Artifacts

| Artifact | Code | Domain | Template | Canonical Path | Owner | Gate |
|---------|------|--------|---------|---------------|-------|------|
| Implementation Plan | IMPL | Engineering | implementation-plan-template.md | `implementations/<date>-<slug>.md` | engineer-agent | — |
| QA Plan | QAP | QA | qa-plan-template.md | `qa/<date>-<slug>-qa-plan.md` | qa-agent | G5 |
| Test Plan | TP | QA | test-plan-template.md | `qa/<date>-<slug>-test-plan.md` | qa-agent | G5 |
| Bug Report | BUG | QA | bug-report-template.md | `bugs/BUG-NNN-<slug>.md` | qa-agent | — |
| Release Plan | REL | Delivery | release-template.md | `releases/<date>-<version>-release-plan.md` | delivery-agent | G7 |
| Rollout Plan | ROP | Delivery | rollout-plan-template.md | `releases/<date>-<version>-rollout-plan.md` | delivery-agent | G7 |

---

## Operations Domain Artifacts

| Artifact | Code | Domain | Template | Canonical Path | Owner | Gate |
|---------|------|--------|---------|---------------|-------|------|
| Runbook | RUN | Operations | runbook-template.md | `wiki/runbooks/<operation>-runbook.md` | delivery-agent | — |
| Incident Report | INC | Operations | incident-template.md | `incidents/INC-NNN-<slug>.md` | delivery-agent | G8 |
| Handoff Envelope | HO | Cross-org | handoff-template.md | `handoffs/<session>/<step>-handoff.md` | source agent | — |

---

## Knowledge Domain Artifacts

| Artifact | Code | Domain | Template | Canonical Path | Owner | Gate |
|---------|------|--------|---------|---------------|-------|------|
| Wiki Page | WIKI | Knowledge | — | `wiki/<section>/<topic>.md` | docs-agent | — |
| Metrics Report | MET | Analytics | metrics-template.md | `analytics/reports/<date>-<scope>-metrics.md` | analytics-agent | — |
| Session Handoff | SHO | Operations | — | `handoffs/session-<date>/session-handoff.md` | orchestrator | — |

---

## Artifact Lifecycle States

```
DRAFT ──→ REVIEW ──→ APPROVED ──→ ACTIVE
                          │            │
                          ↓            ↓
                       REJECTED    SUPERSEDED ──→ ARCHIVED
```

| State | Meaning | Who Sets |
|-------|---------|---------|
| DRAFT | In progress, not yet submitted for review | Creating agent |
| REVIEW | Submitted to a gate or reviewer | Creating agent |
| APPROVED | Passed its gate; authoritative | Supervisor or human |
| ACTIVE | In operational use | Automatically on APPROVED |
| REJECTED | Failed gate review; must be revised | Supervisor or human |
| SUPERSEDED | Replaced by a newer version | Architect-agent (for ADRs) |
| ARCHIVED | No longer active; kept for history | Docs-agent |

---

## Artifact Naming Conventions

| Component | Format | Example |
|----------|--------|---------|
| Date prefix | YYYY-MM-DD | 2026-05-09 |
| Sequential ID | NNN (zero-padded 3 digits) | 001, 042 |
| Slug | kebab-case, descriptive | user-auth-redesign |
| Full filename | `<date>-<slug>.md` OR `<code>-NNN-<slug>.md` | ADR-001-auth-architecture.md |

---

## Artifact Integrity Rules

1. Every artifact must exist at its canonical path — not in ad-hoc locations.
2. Every artifact must use the correct template for its type.
3. Draft artifacts must not be referenced in handoffs as though they are approved.
4. Superseded artifacts must link to their replacement.
5. No artifact may contain secrets, credentials, or PII (unless classified Restricted with appropriate controls per `docs/governance/security-policy.md`).
