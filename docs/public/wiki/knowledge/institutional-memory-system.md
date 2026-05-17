---
layer: wiki
section: knowledge
type: reference
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
---

# Institutional Memory System

How the Enterprise AI OS preserves organizational knowledge across session boundaries, agent turnovers, and time.

**Core insight:** In a Claude-powered AI OS, every context window ends. Institutional memory is what prevents the organization from re-learning the same lessons indefinitely.

---

## The Memory Problem

Claude sessions have no native persistence. When a context window ends:
- All agent reasoning is lost
- All in-flight decisions are lost
- All discovered constraints are lost
- All synthesized learnings are lost

Without institutional memory:
- Every session restarts from scratch
- Decisions made in prior sessions are forgotten
- Knowledge accumulated over months evaporates
- The organization never truly learns

With institutional memory:
- Sessions start from a precise reconstruction of prior state
- Decisions are binding and referenced automatically
- Knowledge accumulates across hundreds of sessions
- The organization becomes more intelligent over time

---

## Memory Architecture

The institutional memory system is a five-layer architecture:

```
LAYER 5: WORKING MEMORY (scratchpad)
  - Agent scratchpad during current step (not persisted)
  - Cleared at step completion

LAYER 4: SESSION MEMORY (hot tier)
  - Current session checkpoint
  - Active workflow run-contexts
  - Session-scope cache (context packages)
  - Cleared at session close (except checkpoint)

LAYER 3: OPERATIONAL MEMORY (warm tier)
  - memory/domains/{domain}/ — all ACTIVE domain entries
  - wiki/ — all active wiki pages
  - memory/MEMORY_INDEX.md — operational index
  - Persists indefinitely; managed by lifecycle system

LAYER 2: HISTORICAL MEMORY (cold tier)
  - memory/sprint-capsules/ — Sprint Learning Capsules
  - memory/archive/ — ARCHIVED entries
  - memory/architecture-summaries/ — Architecture State Summaries
  - Retrieved on demand; not auto-loaded in context

LAYER 1: CONSTITUTIONAL MEMORY (permanent)
  - constitution/enterprise-constitution.md
  - docs/governance/principles.md
  - agents/MASTER-REGISTRY.md
  - Never expires, never archived
```

---

## Memory Tiers in Practice

### When context-routing-engine assembles a context package:

1. **Always include (Layer 1):** Constitutional constraints, governance principles
2. **Include by domain (Layer 3):** Warm-tier entries for agent's domain
3. **Include on demand (Layer 2):** Cold-tier capsules if specifically referenced
4. **Never auto-include (Layer 4 + 5):** Session cache and scratchpad are not part of the assembled context — they exist in the running context window only

### When budget is constrained (Compression):
- Layer 5 is discarded (already not persisted)
- Layer 4 is compressed (session state → essential checkpoints only)
- Layer 3 is compressed (domain entries → binding constraints only)
- Layer 2 is rarely included (capsule summaries only)
- Layer 1 is NEVER dropped (P0 priority)

---

## What Belongs in Institutional Memory

### DOES belong:
- Decisions that constrain future choices
- Discovered constraints (technical, legal, organizational)
- Validated patterns (what works)
- Anti-patterns (what doesn't work)
- Metrics and targets
- Risks and mitigations
- Knowledge that would take significant effort to re-discover

### DOES NOT belong:
- Task-specific reasoning that doesn't transfer
- Intermediate steps in a completed workflow
- Ephemeral context (who's in a meeting, today's todo list)
- Data that's available from primary sources (don't duplicate live data)
- Speculation or unvalidated hypotheses (mark as PROPOSED, not ACTIVE)

---

## Session Boundary Preservation

The session boundary is the critical preservation point. At every session close:

**What is written to disk:**
```
handoffs/session-{YYYY-MM-DD}/
├── session-handoff.md        ← Summary of completed work
├── next-steps.md             ← Priority queue for next session
├── session-checkpoint.md     ← Full machine-readable state
├── important-decisions.md    ← Decisions that constrain future sessions
├── workflow-status.md        ← All workflow instance states
└── known-risks.md            ← New risks discovered this session
```

**What is explicitly NOT written:**
- Raw LLM reasoning (not institutional knowledge)
- Scratchpad content (ephemeral by design)
- Session context cache (reconstructed from memory on next session)

---

## Memory Integrity Guarantees

The institutional memory system provides three integrity guarantees:

### 1. No Knowledge Loss Without EWC Check
Before any active knowledge entry is archived or deleted, the Elastic Weight Consolidation check confirms all unique knowledge has been captured elsewhere. This prevents knowledge from disappearing without a trace.

### 2. No Stale State Without Detection
The weekly staleness cron detects all entries that have exceeded their validation TTL. Nothing silently goes out of date — the system surfaces it.

### 3. No Contradiction Without Resolution
The cross-agent consistency protocol runs post-output checks on all major artifacts. Contradictions are detected and routed to the contradiction-resolution-system within the same session.

---

## Memory Metrics

| Metric | Current | Target |
|---|---|---|
| Active memory entries | (to be counted) | Growing |
| STALE entry percentage | (to be measured) | <10% |
| Session checkpoint coverage | 100% (handoff protocol) | 100% |
| Sprint capsule coverage | (to be measured) | 100% of sprints |
| EWC check coverage | (to be measured) | 100% pre-archival |
| Index coverage (warm tier entries indexed) | (to be measured) | 100% |

---

## Related Pages

- `wiki/knowledge/synthesis-workflow.md` — How knowledge is synthesized
- `wiki/knowledge/karpathy-wiki-governance.md` — Wiki governance
- `memory-governance/federated-memory-architecture.md` — Technical memory architecture
- `memory-governance/continuity-checkpoint-system.md` — Checkpoint system
- `memory-governance/long-context-preservation.md` — Long-context preservation
