---
type: adr
status: active
version: 1.0.0
created: 2026-05-09
owner: architect-agent
gate: G2
adr-id: ADR-001
domain: cross-org
tier: L
---

# ADR-001: Enterprise AI OS — Foundational Architecture

## Context

The Enterprise AI OS was initialized on 2026-05-08. No foundational architectural decision has been formally documented. This ADR captures the five architectural decisions that define how the OS is structured, how agents communicate, how knowledge is persisted, and how the system maintains quality. Without this ADR, the architectural intent can drift across sessions.

This ADR covers the OS coordination layer itself — not any product built on top of it.

---

## Decisions

### Decision 1: File-based artifact communication over direct agent API calls

**Decision:** Agents communicate exclusively through files at canonical paths. No agent may call another agent's "API" or depend on real-time response from another agent.

**Alternatives considered:**
- Real-time agent-to-agent API calls (rejected: creates tight coupling, requires infrastructure, breaks session model)
- Message queue (rejected: over-engineered for current scale; revisit at scale)
- Shared in-memory state (rejected: incompatible with session-based execution model)

**Rationale:** File-based artifacts are the only form of state that persists across Claude sessions. Artifact-driven communication is therefore the only coordination model compatible with the session-based execution environment. It also creates a natural audit trail and forces agents to produce named, reviewable outputs.

**Consequences:**
- Agents must write artifacts before handing off
- All artifacts must have canonical paths
- Session resumption is possible because state is on disk
- Communication latency is one human prompt cycle, not milliseconds
- Not suitable for real-time or event-driven use cases

**Review trigger:** When a runtime execution environment is introduced that supports persistent processes.

---

### Decision 2: 3-tier memory architecture (wiki / memory / artifacts)

**Decision:** Organizational knowledge is organized into three tiers by access pattern:
- **Hot (wiki/):** Actively maintained, human-readable, used in every session
- **Warm (memory/):** Agent-accessible persistent context; non-obvious facts and patterns
- **Cold (artifacts):** Individual work outputs; read when directly relevant

**Alternatives considered:**
- Single flat knowledge base (rejected: no way to prioritize what agents load given context budgets)
- Vector database (deferred: appropriate at scale; see Q-006)
- Per-agent memory silos (rejected: prevents organizational knowledge sharing)

**Rationale:** Context budgets are limited. Agents cannot load everything. The tier model ensures critical organizational knowledge (governance, constraints) is always loaded, while feature-specific artifacts are loaded only when needed.

**Consequences:**
- Memory freshness is a risk (RISK-005); review dates required
- Wiki maintenance is a mandatory workflow step, not optional
- When memory index exceeds 50 entries, vector store migration should be evaluated (Q-006)

---

### Decision 3: Deterministic routing via lookup table

**Decision:** The master orchestrator routes intents to agents and workflows using an explicit routing table, not inference. The routing table is the authoritative source of what workflow handles what intent.

**Alternatives considered:**
- LLM-based intent classification and routing (rejected: non-deterministic, hard to audit, produces different routing for same intent)
- Human-specified routing every time (rejected: defeats the purpose of an OS)

**Rationale:** An operating system must be predictable. Non-deterministic routing means the same work gets handled differently in different sessions, making the system unreliable. A lookup table can be inspected, updated, and audited.

**Consequences:**
- New intent types require routing table updates (small maintenance overhead)
- Routing logic is transparent and auditable
- Novel intents fall through to the orchestrator's default handler

---

### Decision 4: Per-agent context budgets

**Decision:** Each agent type has a defined token budget for its context package. The context manager enforces this. Agents do not receive everything — they receive minimum viable context for their specific step.

**Defined budgets:**
- Orchestrator: 2K (routing only)
- PM agent: 8K
- Architect agent: 10K
- Engineer agent: 10K
- QA agent: 6K
- Security agent: 8K
- UX agent: 6K
- Analytics agent: 6K
- Delivery agent: 4K
- Docs agent: 4K
- Supervisor agent: 6K

**Rationale:** Over-contextualization degrades output quality. Agents lose focus when given too much context. Under-contextualization causes errors. The budgets represent calibration targets, not hard technical limits.

**Consequences:**
- Context compression protocol required (defined in `memory/patterns/minimum-viable-context.md`)
- Budgets must be empirically validated against real work (see open-work: P3 item 16)
- Very large features may require context chunking

---

### Decision 5: Supervisor agent as quality backstop

**Decision:** A supervisor agent reviews all cross-org handoffs and approves quality gates G1, G2, G4, G5, G8. No agent self-approves cross-org artifacts.

**Alternatives considered:**
- Human review of all gates (rejected: too slow; human time is scarce)
- Peer agent review (rejected: circular dependency; creating agent reviewing its own output)
- No gate review (rejected: quality degrades without structured review)

**Rationale:** Quality gates are only effective if there is genuine review. The supervisor agent is designed specifically for review and operates independently of the creating agent. Human review is reserved for gates where human judgment is irreplaceable (G7, critical exceptions).

**Consequences:**
- Supervisor can itself fail (second-order quality risk; no agent backstops the supervisor)
- Human must backstop supervisor failures — escalation protocol required
- Supervisor must be included in every workflow context package for gate steps

---

## Conditions for Revisiting This ADR

This ADR should be revisited and potentially superseded when:
1. A persistent runtime environment is introduced (changes Decision 1)
2. Memory index exceeds 50 entries (triggers Q-006 evaluation — changes Decision 2)
3. Routing complexity exceeds 50 rules (may justify inference-based routing — changes Decision 3)
4. Context budget calibration data suggests different allocations (updates Decision 4)
5. Supervisor quality fails repeatedly (requires human backstop mechanism — changes Decision 5)

---

## Status

**Status:** ACTIVE
**Approved:** 2026-05-09
**Approved by:** supervisor-agent (post-hoc documentation of founding architectural decisions)
**Next review:** After first real product initiative completes (empirical validation opportunity)
