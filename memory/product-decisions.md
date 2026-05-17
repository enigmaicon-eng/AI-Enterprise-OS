---
type: decision-log
domain: PM
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Product Decision Log

Log of significant product decisions. Agents read this to understand the strategic context and constraints behind current roadmap direction. Every entry represents a call that consumed deliberation time and should not be re-opened without new evidence.

**Rule:** Do not re-litigate `active` decisions without citing new evidence (quantitative data, user research, changed market conditions). Raising a settled question with no new evidence wastes cycles and erodes trust in the decision process.

---

## How to Add an Entry

When a significant product call is made:
1. Add a row to the relevant section
2. Record the deciding evidence — not just the decision
3. Record what was explicitly rejected so future agents know it was considered
4. Link to the source artifact (PRD, discovery doc, RFC, or stakeholder meeting notes)

**Status values:** `active` | `superseded` | `under-review` | `reversed`

---

## Prioritization Decisions

_What got built and why. What got deprioritized and why._

| ID | Date | Decision | Evidence Basis | Rejected Alternatives | Status | Source |
|----|------|---------|---------------|----------------------|--------|--------|
| PROD-001 | 2026-05-08 | Build the full Enterprise AI OS in a single initialization sprint | No incremental option — partial OS creates architectural debt and coordination confusion | Incremental rollout over quarters | active | System initialization session |

---

## Scope Decisions

_What is and isn't in scope for active initiatives._

| ID | Date | Feature/Initiative | In Scope | Out of Scope | Rationale | Status | Source |
|----|------|-------------------|----------|-------------|-----------|--------|--------|
| — | — | _(no active features yet)_ | — | — | — | — | — |

---

## Build vs. Buy vs. Borrow Decisions

| ID | Date | Decision | Chosen | Options Evaluated | Rationale | Status | Source |
|----|------|---------|--------|------------------|-----------|--------|--------|
| BVB-001 | 2026-05-08 | Workflow orchestration | Build (custom YAML-based) | Build / Use existing workflow engine | Existing tools add operational overhead; custom keeps it agent-native and inspectable | active | System design session |
| BVB-002 | 2026-05-08 | Memory system | Build (file-based, Karpathy model) | Build / Vector DB / External memory service | File-based is transparent, versionable via git, and requires no infrastructure | active | System design session |

---

## Feature Flag / Rollout Decisions

| ID | Date | Feature | Rollout Strategy | Rationale | Status | Source |
|----|------|---------|-----------------|-----------|--------|--------|
| — | — | _(no active rollouts)_ | — | — | — | — |

---

## Positioning & Strategy Decisions

| ID | Date | Decision | Rationale | Status | Source |
|----|------|---------|-----------|--------|--------|
| STR-001 | 2026-05-08 | Target: FAANG-grade PM + engineering operations as the quality bar | Lower bar produces systems that work in demos but fail in production; the gap between "functional" and "FAANG-grade" is exactly governance, memory, and artifact discipline | active | System initialization session |

---

## Reversed / Superseded Decisions

_Record reversals here. Never delete — reversals are organizational learning._

| ID | Original Decision | Reason Reversed | New Decision | Date |
|----|-----------------|----------------|--------------|------|
| — | _(none yet)_ | — | — | — |
