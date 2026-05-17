---
type: decision-log
domain: cross
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Decision Log

Master index of all significant decisions made in this organization. Agents read this to avoid re-litigating settled questions and to understand the constraints they inherit.

**How to use:** Before proposing a change in any domain, check this log. If a relevant decision exists, work within it or explicitly propose to supersede it via the RFC process — do not silently ignore it.

---

## How to Add an Entry

1. Add a row to the appropriate section below
2. Set status to `active`
3. Link to the source artifact (ADR, RFC, PRD, or decision doc)
4. Do not delete old entries — set status to `superseded` and add a `superseded-by` link

**Status values:** `active` | `superseded` | `under-review` | `experimental`

---

## Architecture Decisions

Full entries: `memory/architecture-decisions.md`

| ID | Decision | Status | Source |
|----|---------|--------|--------|
| — | _(see architecture-decisions.md)_ | — | — |

---

## Product Decisions

Full entries: `memory/product-decisions.md`

| ID | Decision | Status | Source |
|----|---------|--------|--------|
| — | _(see product-decisions.md)_ | — | — |

---

## Organizational / Process Decisions

| ID | Date | Decision | Rationale | Status | Source |
|----|------|---------|-----------|--------|--------|
| ORG-001 | 2026-05-08 | Artifact-first communication — no free-form agent handoffs | Prevents context drift and re-litigation; enables audit trail | active | `docs/governance/principles.md` |
| ORG-002 | 2026-05-08 | Deterministic workflow routing via explicit lookup tables | Improvised routing produces inconsistent outputs | active | `orchestrator/routing-rules.md` |
| ORG-003 | 2026-05-08 | All Tier-L engineering requires an accepted ADR before coding | Prevents architecture drift; discovered mid-build is expensive | active | `memory/patterns/dev-tier-classification.md` |
| ORG-004 | 2026-05-08 | "Human error" is never a root cause in post-mortems | Human error has a systemic cause; accepting it blocks improvement | active | `docs/governance/principles.md` |
| ORG-005 | 2026-05-08 | Quality gates G1–G8 are non-negotiable; deadline pressure does not override | Past incidents caused by bypassing gates under deadline pressure | active | `docs/governance/quality-gates.md` |
| ORG-006 | 2026-05-08 | Evaluation framework designed before first line of AI/model code | Retroactive evals produce optimistic results and miss safety failures | active | `workflows/ai-feature-workflow.md` |
| ORG-007 | 2026-05-08 | Wiki updated at close of every workflow; decisions preserved in memory | Organizational knowledge must outlast any single agent session | active | `docs/governance/principles.md` |

---

## Security Decisions

| ID | Date | Decision | Status | Source |
|----|------|---------|--------|--------|
| SEC-001 | 2026-05-08 | No production deploy without passing security review (G6 — no exceptions) | active | `docs/governance/quality-gates.md` |
| SEC-002 | 2026-05-08 | All data classified per four-tier model before any processing | active | `docs/governance/security-policy.md` |
| SEC-003 | 2026-05-08 | No secrets in any artifact, handoff, or memory file | active | `memory/organizational/governance-constraints.md` |

---

## Superseded Decisions

| ID | Original Decision | Superseded By | Date |
|----|-----------------|--------------|------|
| — | _(none yet)_ | — | — |
