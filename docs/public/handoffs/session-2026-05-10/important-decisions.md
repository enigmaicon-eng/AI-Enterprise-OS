---
session-date: 2026-05-10
---

# Important Decisions — Session 2026-05-10

Decisions made this session that bind future work. All D-NNN decisions from `handoffs/session-2026-05-09/important-decisions.md` remain in force.

---

## D-015: Synthesis Pipeline Standard — RETRIEVE/JUDGE/DISTILL/CONSOLIDATE

**Decision:** All knowledge synthesis in the Enterprise AI OS uses the four-stage pipeline: RETRIEVE → JUDGE → DISTILL → CONSOLIDATE.

**Rationale:** Adapted from ruflo's ReasoningBank — the most battle-tested approach to structured knowledge synthesis available in the external research corpus.

**Binding constraint:** No knowledge synthesis bypasses the JUDGE stage. Random compression without relevance evaluation is not valid synthesis.

**Implementation:** `wiki/knowledge/synthesis-workflow.md`

---

## D-016: EWC Check is Mandatory Before Archival

**Decision:** Before any ACTIVE knowledge entry with importance ≥ HIGH is archived, an EWC (Elastic Weight Consolidation) check must confirm all unique knowledge is captured elsewhere.

**Rationale:** Prevents catastrophic forgetting — the pattern where archiving an entry causes knowledge loss that is not discovered until much later when the knowledge is needed.

**Binding constraint:** No CRITICAL or HIGH entry may be archived without a passing EWC check. EWC check failure blocks archival.

**Implementation:** `knowledge-governance/knowledge-lifecycle-system.md`, `state-models/knowledge-states.md`

---

## D-017: Raft Leader Per Knowledge Domain

**Decision:** Each knowledge domain has one designated Raft leader during a session. In case of concurrent write conflict, the Raft leader's version is authoritative.

**Rationale:** Prevents "split brain" across parallel agents. Without a Raft leader, two agents can produce incompatible domain facts with no resolution mechanism.

**Binding constraint:** Every domain in the routing table must have a designated Raft leader in `knowledge-governance/cross-agent-consistency-protocol.md`.

**Implementation:** `knowledge-governance/cross-agent-consistency-protocol.md` (Raft leader table)

---

## D-018: 3-Tier Dispatch Is the Standard Model Routing Protocol

**Decision:** All agent dispatches use the three-tier model routing: T0 (template), T1 (Haiku), T2-Sonnet, T2-Opus. Tier is determined by task complexity score (0-100).

**Rationale:** Cost and speed optimization — simple tasks should not consume Opus-level inference. Adapted from ruflo's proven routing model.

**Binding constraint:** No agent dispatch may use a higher-tier model than its task complexity score requires. Score formula is defined in `memory-routing/context-routing-engine.md`.

---

## D-019: Step Checkpoint is Mandatory After Every Workflow Step

**Decision:** After every workflow step completes, a step checkpoint must be written to `memory/workflow-state/{instance-id}/checkpoints/step-{N}.md`.

**Rationale:** Enables exact resume after session boundary. Without step checkpoints, a session failure loses all progress within the session.

**Binding constraint:** A workflow step is not considered "complete" until its checkpoint has been written. The orchestrator must not advance to the next step until the checkpoint write succeeds.

**Implementation:** `memory-governance/continuity-checkpoint-system.md`

---

## D-020: Context Priority Tiers P0-P4 Are the Budget Enforcement Standard

**Decision:** The five-tier context priority system (P0: inviolable through P4: drop first) is the standard for all context package assembly.

**Binding constraint:** P0 elements (binding constraints, human gates, security constraints, constitutional rules) can NEVER be dropped or compressed. A P0 drop is a system failure event that blocks dispatch.

**Implementation:** `memory-routing/context-prioritization.md`

---

## D-021: CRDT Merge Rules for Concurrent Memory Updates

**Decision:** When concurrent agents write to the same memory domain, CRDT merge rules apply: set union for lists, max for counters, most-recent timestamp for scalars.

**Rationale:** Prevents data loss in parallel execution without requiring synchronous locking for every write.

**Binding constraint:** No merge operation may use "last write wins" for lists — list merges are always union operations.

**Implementation:** `knowledge-governance/contradiction-resolution-system.md`, `memory-routing/runtime-context-synchronization.md`

---

## D-022: Loop Detection Threshold — 3 Visits = Pause

**Decision:** If any workflow step is visited more than 3 times in a session, loop detection triggers and execution is PAUSED (not aborted). The orchestrator reviews before continuing.

**Rationale:** Protects against infinite autonomous loops that consume context budget without progress. Pause (not abort) preserves the ability to continue after human or orchestrator intervention.

**Binding constraint:** No step-visit counter override — the 3-visit threshold is not configurable per-workflow.

**Implementation:** `state-models/agent-execution-states.md`, `memory-governance/continuity-checkpoint-system.md`

---

## D-023: Wiki Page Ownership Is Mandatory

**Decision:** Every wiki page must have a named agent owner in its frontmatter. Pages without owners are integrity violations detected by weekly maintenance.

**Rationale:** Orphaned wiki pages decay because no agent feels responsible for them. Named ownership creates accountability.

**Binding constraint:** The `knowledge-systems-engineer-agent` weekly cron must flag any wiki page missing the `owner:` frontmatter field as an integrity violation.

**Implementation:** `wiki/knowledge/karpathy-wiki-governance.md`
