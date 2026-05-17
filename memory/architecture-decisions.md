---
type: decision-log
domain: architecture
importance: high
created: 2026-05-08
project: organizational
expires: never
---

# Architecture Decision Log

Quick-lookup index of all architecture decisions. Each entry summarizes the decision and its binding constraints. For full rationale, read the linked ADR.

**Rule:** Any new engineering work that conflicts with an `active` entry below must either work within the constraint or propose an ADR amendment before proceeding. Silent overrides are a governance violation.

---

## How to Add an Entry

When an ADR is accepted:
1. Add a row here with `status: active`
2. Copy the one-line constraint into the "Binding Constraint" column
3. The architect-agent is responsible for keeping this log current

**Status values:** `active` | `superseded` | `experimental` | `under-review`

---

## System Architecture

| ID | Date | Decision | Binding Constraint | Status | ADR |
|----|------|---------|-------------------|--------|-----|
| ARCH-001 | 2026-05-08 | Artifact-driven inter-agent communication via handoff envelopes | Agents communicate via structured YAML handoffs at canonical paths — no direct invocation or free-form messages | active | _(pending ADR)_ |
| ARCH-002 | 2026-05-08 | Layered memory: hot (wiki) / warm (memory) / cold (artifacts) | Memory architecture follows three tiers; do not flatten into a single store | active | _(pending ADR)_ |
| ARCH-003 | 2026-05-08 | Minimum Viable Context — each agent loads only what it needs | Context packages scoped by agent type and token budget; no full-codebase dumps | active | `memory/patterns/minimum-viable-context.md` |
| ARCH-004 | 2026-05-08 | Deterministic routing via explicit lookup tables | Intent → agent/workflow resolved by `orchestrator/routing-rules.md`, not inferred | active | _(pending ADR)_ |
| ARCH-005 | 2026-05-08 | Supervisor agent is the adversarial quality backstop | All cross-org outputs reviewed by supervisor-agent before delivery; not optional for L-tier | active | `orchestrator/supervisor.md` |

---

## API Design

| ID | Date | Decision | Binding Constraint | Status | ADR |
|----|------|---------|-------------------|--------|-----|
| API-001 | 2026-05-08 | URI path versioning (`/v1/`, `/v2/`) | Breaking changes always produce a new major version; old version supported ≥ 12 months | active | _(pending ADR)_ |
| API-002 | 2026-05-08 | Standard response envelope (data / meta / pagination) | All API responses use the envelope schema in `templates/api-spec-template.md` §2.4 | active | _(pending ADR)_ |
| API-003 | 2026-05-08 | Cursor-based pagination (not offset) | Offset pagination is unsafe for real-time data; all list endpoints use cursors | active | _(pending ADR)_ |
| API-004 | 2026-05-08 | All resource IDs are UUID v4 | No sequential integer IDs exposed externally — enumeration risk | active | `docs/governance/security-policy.md` |

---

## Data Architecture

| ID | Date | Decision | Binding Constraint | Status | ADR |
|----|------|---------|-------------------|--------|-----|
| DATA-001 | 2026-05-08 | All timestamps in ISO 8601 UTC | No local timezone timestamps in any data store or API response | active | _(pending ADR)_ |
| DATA-002 | 2026-05-08 | PII classified and encrypted at rest (AES-256) | Any field touching PII requires security-agent sign-off before schema migration | active | `docs/governance/security-policy.md` |

---

## Infrastructure & Operations

| ID | Date | Decision | Binding Constraint | Status | ADR |
|----|------|---------|-------------------|--------|-----|
| OPS-001 | 2026-05-08 | All structured logs include `request_id` | No log entry without a correlation ID; enables distributed tracing | active | _(pending ADR)_ |
| OPS-002 | 2026-05-08 | Feature flags required for all L-tier feature rollouts | No direct-to-100% deployment for Tier-L features | active | `memory/patterns/dev-tier-classification.md` |
| OPS-003 | 2026-05-08 | Exponential backoff with jitter for all retry logic | Base: 1s. Max: 60s. Max retries: 5. No fixed-interval retries | active | `templates/api-spec-template.md §③` |

---

## AI / Model Features

| ID | Date | Decision | Binding Constraint | Status | ADR |
|----|------|---------|-------------------|--------|-----|
| AI-001 | 2026-05-08 | Evaluation framework before first model code | Eval dimensions, golden test set, and quality thresholds defined before prompt engineering begins | active | `workflows/ai-feature-workflow.md` |
| AI-002 | 2026-05-08 | Staged rollout for all AI features: Phase 0 → 1% → 25% → 100% | No AI feature goes directly to full traffic | active | `workflows/ai-feature-workflow.md` |
| AI-003 | 2026-05-08 | Safety filter monitoring: auto-rollback if safety violation > 0.01% in 1-hour window | Hard safety threshold; cannot be waived without exec sign-off | active | `workflows/ai-feature-workflow.md` |
| AI-004 | 2026-05-08 | LLM-as-judge requires ≥ 80% calibration against human judgments | Uncalibrated automatic evaluation is not accepted as a quality gate | active | `workflows/ai-feature-workflow.md` |

---

## Superseded Architecture Decisions

| ID | Original Decision | Superseded By | Date |
|----|-----------------|--------------|------|
| — | _(none yet)_ | — | — |
