---
layer: wiki
section: knowledge
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
status: active
---

# Knowledge Wiki — Organizational Intelligence System

The knowledge section of the organizational wiki. This section documents how the Enterprise AI OS manages, grows, and preserves organizational intelligence.

---

## Why a Knowledge Wiki Section

The Enterprise AI OS accumulates knowledge through agent operations. Without a structured synthesis protocol, this knowledge fragments: scattered across workflow artifacts, never distilled into reusable intelligence.

The knowledge wiki section serves as the **meta-layer** — it documents the knowledge system itself, ensuring agents understand how knowledge works, how to contribute to it, and how to benefit from it.

---

## Directory Structure

```
wiki/knowledge/
├── README.md                       ← This file (entry point)
├── karpathy-wiki-governance.md     ← Wiki governance rules and protocols
├── synthesis-workflow.md           ← How knowledge synthesis works
├── institutional-memory-system.md  ← How institutional memory is structured
├── contradiction-detection.md      ← How contradictions are detected and resolved
└── recursive-synthesis.md          ← Recursive synthesis for deep knowledge accumulation
```

---

## Core Principle: Every Agent Contributes to the Wiki

From `CLAUDE.md` and `docs/governance/principles.md`:
> All agents should: read relevant wiki pages, synthesize new knowledge, update organizational intelligence, preserve reusable learnings.

This is not optional. When an agent completes a task that generates reusable knowledge, updating the wiki is part of task completion.

---

## Knowledge System Architecture

```
EXTERNAL INPUTS          SYNTHESIS             ORGANIZATIONAL INTELLIGENCE
  External research  ──► RETRIEVE        ──►   wiki/ (navigable knowledge)
  Agent task outputs ──► JUDGE           ──►   memory/domains/ (domain entries)
  Incident analysis  ──► DISTILL         ──►   memory/sprint-capsules/ (compressed)
  Architecture ADRs  ──► CONSOLIDATE     ──►   cognition-indexes/ (retrieval)
                                         ──►   graph-models/ (relationships)
```

The synthesis pipeline (from ontology/knowledge-vocabulary.md, adapted from ruflo ReasoningBank) transforms raw experience into reusable organizational intelligence.

---

## Knowledge Types in This Wiki

| Knowledge Type | Location | Synthesis Frequency |
|---|---|---|
| Governance protocols | wiki/knowledge/ | When governance evolves |
| Engineering patterns | wiki/engineering/ | Per sprint |
| Product learnings | wiki/product/ | Per feature |
| Architecture decisions | docs/adrs/ | Per ADR |
| Incident post-mortems | wiki/incidents/ | Per incident |
| Research summaries | wiki/research/ | Per external research cycle |
| Sprint capsules | memory/sprint-capsules/ | Per sprint |

---

## Quick Reference: Knowledge Operations

| Operation | Where | Agent |
|---|---|---|
| Add new knowledge | memory/domains/{domain}/ | Domain agent |
| Synthesize knowledge | knowledge-synthesis-index.md + wiki | organizational-learning-agent |
| Resolve contradiction | knowledge-governance/contradiction-resolution-system.md | knowledge-systems-architect-agent |
| Archive stale knowledge | memory/archive/ | knowledge-systems-engineer-agent |
| Query knowledge | master-cognition-index.md → file reads | context-routing-engine-agent |
| Update index | cognition-indexes/ | knowledge-systems-engineer-agent |