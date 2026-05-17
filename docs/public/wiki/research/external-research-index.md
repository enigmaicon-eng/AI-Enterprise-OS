---
layer: wiki
section: research
type: reference
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
---

# External Research Index

Catalog of all external repositories and research sources ingested into the Enterprise AI OS, with synthesis status and extracted value.

---

## Research Ingestion Protocol

When external research is ingested:
1. Read the repository/paper for orchestration and cognition primitives
2. Extract only patterns that are transferable to the Enterprise AI OS context
3. Do NOT summarize the source — synthesize what was learned
4. Log the synthesis in `cognition-indexes/knowledge-synthesis-index.md` (SYN-NNN)
5. Add entry to this index with synthesis status
6. Create detailed pattern page in `wiki/research/{source}-patterns.md`

**Rule:** External research is evidence, not documentation. The wiki documents what we learned from it, not what it says.

---

## Ingested Research Catalog

### REP-001: ruflo (claude-flow v3.6.10)
```yaml
repository: external-research/ruflo/
type: AI orchestration framework
ingested: 2026-05-10
synthesis-id: SYN-001
synthesis-status: COMPLETE
pattern-page: wiki/research/ruflo-patterns.md
```

**What it is:** A production-grade Claude-powered orchestration framework featuring swarm coordination, multi-tier dispatch, and distributed cognition patterns.

**Why it was ingested:** Contains mature implementations of patterns the Enterprise AI OS needs: routing, memory management, context engineering, swarm anti-drift.

**Key primitives extracted:**
- ReasoningBank (RETRIEVE/JUDGE/DISTILL/CONSOLIDATE) → knowledge synthesis pipeline
- EWC++ → Irreversibility Check (before archiving knowledge)
- Raft consensus → Domain truth arbitration
- CRDT → Concurrent memory update protocol
- Anti-drift swarm coordination → 4-control anti-drift protocol
- 3-tier model dispatch → T0/T1/Sonnet/Opus dispatch tiers
- Named agent + SendMessage → Inter-agent communication protocol
- AgentDB (sql.js) → SQLite scaling trigger for cognition indexes
- `consolidate` worker → Memory consolidation cron pattern

**Impact on OS:** High — multiple foundational protocols adapted directly from ruflo.

---

### REP-002: TradingAgents (v0.2.4)
```yaml
repository: external-research/TradingAgents/
type: Multi-agent LLM financial trading framework
ingested: 2026-05-10
synthesis-id: SYN-002
synthesis-status: COMPLETE
pattern-page: wiki/research/tradingagents-patterns.md
```

**What it is:** A multi-agent system where specialized agents (analyst, trader, risk manager) coordinate to make financial trading decisions. Uses LangGraph for state management.

**Why it was ingested:** Contains a mature step-level checkpoint/resume implementation and structured output patterns directly applicable to long-running enterprise workflows.

**Key primitives extracted:**
- LangGraph checkpoint/resume → 3-level checkpoint hierarchy (step/session/sprint)
- Structured output agents → Schema-enforced artifacts with gate validation
- Multi-agent debate framework → Agent coordination for contested decisions
- Confidence threshold → Decision confidence gates before artifact acceptance

**Impact on OS:** Medium-High — checkpoint system design directly informed by LangGraph model.

---

### REP-003: dexter
```yaml
repository: external-research/dexter/
type: Autonomous financial research agent (TypeScript/Bun)
ingested: 2026-05-10
synthesis-id: SYN-003
synthesis-status: COMPLETE
pattern-page: wiki/research/dexter-patterns.md
```

**What it is:** An autonomous research agent that decomposes complex financial research queries into structured steps, executes them autonomously, and self-validates output. Built on TypeScript with Bun runtime.

**Why it was ingested:** Contains the most sophisticated context management and autonomous continuation primitives of the three repositories. Directly addresses the Enterprise AI OS's session boundary problem.

**Key primitives extracted:**
- Run-context object → Serializable session boundary state (full YAML spec)
- Task decomposition loop → Complex query → structured steps → execution → self-validation
- Loop detection (step visited >3 times) → Safety control for autonomous execution
- Scratchpad pattern → Agent working memory (not persisted)
- Microcompact/context compression → 5-stage tiered compression algorithm
- Token counter/context budget → Hard token budget per dispatch tier
- Cron scheduling → Time-based autonomous workflow execution
- Step limits (25 steps/session) → Safety boundary for autonomous execution

**Impact on OS:** High — context compression and session continuity systems directly adapted from dexter.

---

## Research Pipeline Status

| Repository | Status | Pattern Page | Synthesis Record |
|---|---|---|---|
| ruflo | Complete | wiki/research/ruflo-patterns.md | SYN-001 |
| TradingAgents | Complete | wiki/research/tradingagents-patterns.md | SYN-002 |
| dexter | Complete | wiki/research/dexter-patterns.md | SYN-003 |

---

## Planned Research Ingestion

| Source | Status | Justification |
|---|---|---|
| LangGraph documentation | Pending | More detailed checkpoint/state management patterns |
| CrewAI | Pending | Role-based agent coordination patterns |
| AutoGen | Pending | Multi-agent conversation patterns |
| LlamaIndex | Pending | RAG and knowledge graph patterns for cognition indexes |

---

## Research Quality Standards

Research is only ingested if it meets these criteria:

1. **Production-grade:** Not a toy example — must have been tested in a real or near-real context
2. **Transferable patterns:** Contains orchestration or cognition primitives, not just prompts
3. **Non-redundant:** Adds patterns not already covered by ingested research
4. **License-compatible:** Patterns are concepts, not copied code — no license issues

Research that is summarized but has no transferable primitives is NOT added to this index.