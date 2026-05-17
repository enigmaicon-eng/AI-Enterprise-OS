---
type: important-decisions
session-date: 2026-05-08 to 2026-05-09
scope: decisions made during OS initialization that all future agents must honor
---

# Important Decisions

Every significant design decision made during the OS initialization sessions. These are binding — future agents work within them, not around them. To supersede any of these, open an RFC.

---

## Architectural Design Decisions

### D-001: File-Based, Not Database-Based Memory

**Decision:** The memory system is file-based markdown (warm tier) indexed by `MEMORY_INDEX.md`.

**Rationale:** File-based memory is transparent (human-readable), versionable via git, zero-infrastructure (no vector database to provision), and naturally follows the Karpathy wiki model. A vector DB would add operational overhead without proportional benefit at current scale.

**Binding constraint:** Do not introduce a database or vector store for agent memory without an RFC. The threshold for migration is: MEMORY_INDEX.md > 50 entries AND retrieval accuracy degrades noticeably.

**Location:** `memory/README.md`

---

### D-002: Cursor-Based Pagination (Not Offset)

**Decision:** All list API endpoints use cursor-based pagination.

**Rationale:** Offset pagination is unsafe for real-time data — records added or removed between pages cause duplicates and gaps. Cursor-based pagination is stable regardless of data mutations.

**Binding constraint:** No offset pagination in any API. If a consumer requires offset for a legacy integration, document the exception in the API spec with a migration plan.

**Location:** `templates/api-spec-template.md §2.6`, `memory/architecture-decisions.md` API-003

---

### D-003: URI Path Versioning for APIs

**Decision:** All APIs use URI path versioning (`/v1/`, `/v2/`).

**Rationale:** Path versioning is explicit, cacheable, and unambiguous. Header-based and query-parameter versioning are harder to route, log, and debug.

**Binding constraint:** Breaking changes always produce a new major version. Old version supported ≥ 12 months after new version GA.

**Location:** `templates/api-spec-template.md §2.1`, `memory/architecture-decisions.md` API-001

---

### D-004: Standard Response Envelope

**Decision:** All API responses use the standard envelope `{ data, meta, pagination }` for success and `{ error: { code, message, detail, request_id } }` for errors.

**Rationale:** Consistent envelopes allow all API consumers to use the same parsing logic. Machine-readable error codes enable automated retry and monitoring logic.

**Binding constraint:** No API endpoint may return a naked resource or naked error string. Every response is wrapped.

**Location:** `templates/api-spec-template.md §2.4`

---

### D-005: ADR Sequential Numbering With No Gaps

**Decision:** Architecture Decision Records are numbered sequentially (ADR-001, ADR-002...) with no gaps and no reuse.

**Rationale:** Gaps in numbering suggest decisions that were made but not recorded — exactly what the ADR system exists to prevent. Reuse would overwrite historical decisions.

**Binding constraint:** Before creating any ADR, check the highest existing number and increment by 1. Do not skip numbers. Do not reuse a number from a superseded ADR.

**Location:** `architecture/decisions/README.md`, `memory/architecture-decisions.md`

---

### D-006: Feature Flags Required for All L-Tier Rollouts

**Decision:** Tier-L features always deploy behind a feature flag (default: off) and follow the 4-phase canary rollout.

**Rationale:** Direct-to-100% deployments for large features eliminate the ability to roll back without a full redeploy. Feature flags provide instant rollback.

**Binding constraint:** L-tier features cannot go to 100% traffic on deploy day. Phase 0 → Phase 1 → Phase 2 → Phase 3 is the minimum progression.

**Location:** `memory/patterns/dev-tier-classification.md`, `templates/rollout-plan-template.md`

---

### D-007: Artifact-First Inter-Agent Communication

**Decision:** All inter-agent communication is via structured handoff envelopes at canonical paths. No free-form messages, no direct invocations.

**Rationale:** Free-form messages are lost when context is compressed. Canonical artifacts persist across sessions. Structured handoffs prevent re-litigation of settled decisions.

**Binding constraint:** Any agent-to-agent transition produces a handoff file using `templates/handoff-template.md`. No verbal or inline-chat handoffs.

**Location:** `memory/patterns/artifact-driven-communication.md`, `handoffs/handoff-protocol.md`

---

## Process Design Decisions

### D-008: "Human Error" Is Never a Root Cause

**Decision:** Post-mortems must not list "human error" as a root cause. Human error is always a symptom with a systemic cause.

**Rationale:** Accepting human error as a root cause stops the investigation at a person instead of the system that made the error possible. It produces no actionable improvement.

**Binding constraint:** supervisor-agent rejects any post-mortem that lists a person as the root cause. The five-whys chain must reach a systemic finding (missing test, alert gap, unclear runbook, architectural fragility).

**Location:** `docs/governance/principles.md`, `workflows/incident-workflow.md`, `playbooks/incident-playbook.md`

---

### D-009: Evaluation Framework Before First Model Code

**Decision:** For any AI/LLM feature, the evaluation framework (dimensions, golden test set, quality thresholds) must be designed and documented before the first prompt is written.

**Rationale:** Retroactive evaluations are optimistic — they are unconsciously calibrated to what the model already does. Prospective evaluations define success before any investment is made.

**Binding constraint:** ai-feature-workflow.md Step 04 (Eval Framework Design) gates Step 05 (Prompt Architecture). This gate cannot be waived.

**Location:** `workflows/ai-feature-workflow.md`, `memory/architecture-decisions.md` AI-001

---

### D-010: Quality Gates Are Non-Negotiable Under Deadline Pressure

**Decision:** Gates G1–G8 cannot be bypassed due to deadline pressure. An exception requires documented human operator approval, not just a PM request.

**Rationale:** Every gate that was bypassed under deadline pressure in the past produced an incident within 2 sprints. The gates are the lesson.

**Binding constraint:** `!override` command bypasses gates only with human operator authorization, logged in `handoffs/` with the approver, date, reason, and accepted risk. Delivery-agent enforces this.

**Location:** `docs/governance/quality-gates.md`, `docs/governance/principles.md`

---

### D-011: No Security Review Exceptions for PII or New Attack Surface

**Decision:** Security gate G6 has two absolute no-exception scenarios: any feature handling PII, and any feature introducing a new attack surface.

**Rationale:** PII mishandling is a compliance and legal risk. Unreviewed attack surfaces are the most common root cause of breaches.

**Binding constraint:** G6 cannot be marked complete without security-agent sign-off. PM cannot override this gate. Human operator cannot override this gate except with written CISO-equivalent sign-off.

**Location:** `docs/governance/quality-gates.md §G6`

---

### D-012: LLM-as-Judge Requires ≥ 80% Human Calibration

**Decision:** Any automated quality evaluation using an LLM as judge must be calibrated against human judgments on the same examples, achieving ≥ 80% agreement before it is used as a gate.

**Rationale:** An uncalibrated LLM judge may systematically reward or penalize behaviors that humans would judge differently. At < 80% calibration, the gate is measuring something other than human-defined quality.

**Binding constraint:** Do not use LLM-as-judge outputs as hard pass/fail gates until calibration report exists. Before calibration: use as signals, not verdicts.

**Location:** `workflows/ai-feature-workflow.md`, `memory/architecture-decisions.md` AI-004

---

## Governance Decisions

### D-013: Five Immutable Governance Principles

These five principles were established as the foundational rules of the OS. They cannot be changed by any individual agent or workflow — they require an RFC to modify.

1. **Artifact-First**: Every decision, output, and handoff is a named artifact at a canonical path
2. **Deterministic Over Improvised**: Agent behavior is defined in lookup tables, not inferred
3. **Minimum Viable Context**: Each agent receives only what it needs; context budgets are enforced
4. **Preserve Decisions**: No decision is made twice; all decisions are recorded and indexed
5. **Governance Over Chaos**: Consistency, quality gates, and process discipline over speed shortcuts

**Location:** `docs/governance/principles.md`

---

### D-014: Memory Architecture — Three Tiers

**Decision:** Organizational memory is layered: Hot (wiki/ — frequently accessed, human-readable), Warm (memory/ — curated facts loaded per session), Cold (artifacts/ and other directories — full historical record).

**Rationale:** Loading all memory into every context window would exceed token budgets. Tiered memory allows agents to load only what's relevant.

**Binding constraint:** memory/ files are curated — they contain non-obvious, persistent, actionable facts. Code patterns, git history, and current file contents belong in the hot or cold tier, not memory/.

**Location:** `memory/README.md`, `orchestrator/context-manager.md`

---

## Decisions That Were Explicitly NOT Made

These are questions that arose during design and were deliberately deferred:

| Question | Why Deferred | When to Decide |
|---------|-------------|---------------|
| Primary tech stack | No product initiative exists yet | When first initiative is scoped (Q-001) |
| Cloud provider | No infrastructure work yet | When first deployment is planned (Q-003) |
| Database technology | No data model yet | During ADR-001 after Q-001 answered |
| Authentication mechanism | No users yet | During security review of first user-facing feature |
| Analytics tooling | No instrumentation needed yet | When first feature enters QA |
| Monitoring platform | No deployed services | When first service is deployed |
