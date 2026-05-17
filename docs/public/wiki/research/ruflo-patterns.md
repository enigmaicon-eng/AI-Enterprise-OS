---
layer: wiki
section: research
type: synthesis
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
synthesis-id: SYN-001
source: external-research/ruflo/
---

# Ruflo Patterns — Enterprise AI OS Adaptations

Patterns extracted from ruflo (claude-flow v3.6.10) and adapted for the Enterprise AI OS.

**Principle:** These are patterns we learned from ruflo, described in our own vocabulary. This is NOT a description of ruflo. If you need to understand ruflo, read `external-research/ruflo/`.

---

## Pattern R-001: Four-Stage Knowledge Synthesis Pipeline

**Origin:** ruflo's `ReasoningBank` (RETRIEVE → JUDGE → DISTILL → CONSOLIDATE)

**Enterprise AI OS Adaptation:**
The knowledge synthesis pipeline in the Enterprise AI OS follows the same four stages:

| Stage | What Happens | Output |
|---|---|---|
| RETRIEVE | Gather all relevant source material | Candidate set |
| JUDGE | Score each source for synthesis-worthiness | Include/Exclude decisions |
| DISTILL | Extract reusable kernel from each included source | Distilled excerpts |
| CONSOLIDATE | Merge into coherent knowledge artifact | Memory entry or capsule |

**Where implemented:** `wiki/knowledge/synthesis-workflow.md`, `ontology/knowledge-vocabulary.md`

**When to use:** Any knowledge synthesis task: sprint capsules, extraction synthesis, incident post-mortems.

---

## Pattern R-002: Elastic Weight Consolidation as Irreversibility Check

**Origin:** ruflo's EWC++ (prevents catastrophic forgetting in neural networks)

**Enterprise AI OS Adaptation:**
Before any ACTIVE knowledge entry is archived or deprecated, an EWC check is performed:
1. Extract all unique facts, constraints, and patterns from the entry being archived
2. For each unique item, verify it exists in at least one other ACTIVE entry
3. If any unique item is not captured elsewhere → archival is BLOCKED until knowledge is transferred

The EWC check prevents catastrophic forgetting in the organizational memory system.

**Where implemented:** `knowledge-governance/knowledge-lifecycle-system.md`, `memory-governance/long-context-preservation.md`

**When to use:** Before archiving any ACTIVE memory entry, especially CRITICAL tier.

---

## Pattern R-003: Raft Leader for Domain Truth Arbitration

**Origin:** ruflo's Raft consensus protocol for distributed state

**Enterprise AI OS Adaptation:**
Each knowledge domain has a designated "Raft leader" — the agent with authoritative state for that domain during a session:

| Domain | Raft Leader |
|---|---|
| Organizational State | master-orchestrator-agent |
| Engineering Memory | principal-architect-agent |
| Product Memory | senior-pm-agent |
| Knowledge Governance | knowledge-systems-architect-agent |
| Security Memory | security-architect-agent |

When two agents produce conflicting claims in the same domain, the Raft leader's version is authoritative. This prevents "split brain" where two agents hold incompatible views of domain truth.

**Where implemented:** `knowledge-governance/cross-agent-consistency-protocol.md`, `memory-routing/context-routing-engine.md`

**When to use:** Multi-agent workflows where multiple agents work in the same domain.

---

## Pattern R-004: CRDT Merge Rules for Concurrent Memory Updates

**Origin:** ruflo's CRDT (Conflict-Free Replicated Data Type) for distributed state

**Enterprise AI OS Adaptation:**
When two agents update the same memory entry concurrently, merge rules prevent data loss:

| Data Type | Merge Rule |
|---|---|
| Lists (agent-lists, risk-lists) | Set union (add all, never remove without explicit delete) |
| Counters (agent count, gap count) | Maximum value wins (monotonic) |
| Scalar facts (version, status) | Timestamp wins (most recent update) |
| Binding constraints | Both survive (never merge-delete a constraint without EWC check) |

**Where implemented:** `knowledge-governance/contradiction-resolution-system.md`, `knowledge-governance/runtime-state-synchronization.md`

**When to use:** Parallel agent execution (fan-out steps), multi-agent collaboration tasks.

---

## Pattern R-005: Anti-Drift Swarm Coordination

**Origin:** ruflo's anti-drift swarm protocol (hierarchical topology + specialized roles + raft consensus)

**Enterprise AI OS Adaptation (4 controls):**

1. **Raft leader context injection:** Every context package includes the Raft leader ID for the agent's domain. The agent knows who holds authoritative domain state.

2. **Specialized role enforcement:** Context packages are tailored to the agent's defined role. A product PM agent does not receive engineering domain memory by default.

3. **Hierarchical authority injection:** Every context package includes the authority chain from the dispatched agent up to the constitutional level.

4. **Binding constraint injection:** Active ADR binding constraints relevant to the agent's task are always included — never compressed away (P0 priority).

**Where implemented:** `memory-routing/context-routing-engine.md` (Anti-Drift Context Controls section), `knowledge-governance/cross-agent-consistency-protocol.md`

**When to use:** Every agent dispatch (these controls are built into the context routing engine).

---

## Pattern R-006: Three-Tier Model Dispatch

**Origin:** ruflo's WASM/booster → Haiku → Sonnet/Opus routing

**Enterprise AI OS Adaptation:**

| Tier | Model | Task Complexity Score | Use Case |
|---|---|---|---|
| T0 | Template/direct | 0 (pattern match) | Templated outputs, no LLM needed |
| T1 | Claude Haiku | 1-30 | Simple tasks, formatting, routing |
| T2-Sonnet | Claude Sonnet | 31-75 | Complex reasoning, multi-step |
| T2-Opus | Claude Opus | 76-100 | Highest reasoning: architecture, strategy |

**Task Complexity Score Formula:**
```
+ 5 per required input artifact (max 30)
+ 25 if reasoning-depth = HIGH
+ 25 if cross-domain coordination required
+ 25 if security-sensitive (RESTRICTED+ namespace)
```

**Where implemented:** `memory-routing/context-routing-engine.md` (3-Tier Dispatch Tier Selection)

**When to use:** Every agent dispatch — the orchestrator selects tier based on task complexity.

---

## Pattern R-007: Named Agent + SendMessage Inter-Agent Communication

**Origin:** ruflo's named agent + SendMessage protocol

**Enterprise AI OS Adaptation:**
Inter-agent communication follows a formal protocol:
1. Agents are dispatched by name (agent-id), never anonymously
2. Sub-agent calls are structured dispatch requests (not informal calls)
3. Agent outputs are formal artifacts, not conversational responses
4. Escalation follows the authority chain (never skips tiers)

**Where implemented:** `agents/MASTER-REGISTRY.md` (agent IDs), `orchestrator/routing-rules.md`

**When to use:** All inter-agent coordination.

---

## Pattern R-008: Memory Consolidation Cron

**Origin:** ruflo's `consolidate` worker (periodic memory consolidation)

**Enterprise AI OS Adaptation:**
Weekly cron runs `knowledge-systems-engineer-agent` for memory maintenance:
1. Staleness scan: flag all ACTIVE entries past their TTL
2. Index rebuild: update master-cognition-index and semantic clusters
3. Contradiction scan: check for unresolved contradictions
4. Integrity check: verify all integrity rules in cognition-indexes/README.md

**Where implemented:** `knowledge-governance/knowledge-lifecycle-system.md`, `cognition-indexes/README.md`

**When to use:** Automated weekly maintenance.

---

## Patterns Considered But Not Adapted

| ruflo Pattern | Reason Not Adapted |
|---|---|
| WASM booster (local execution) | Requires runtime substrate (GAP: CRITICAL-001) |
| AgentDB live SQLite store | Adapted as scaling trigger only; markdown is current substrate |
| Gossip protocol (distributed state) | Single-tenant OS; gossip not needed |
| Byzantine fault tolerance | Trust within OS is assumed; BFT is for adversarial networks |