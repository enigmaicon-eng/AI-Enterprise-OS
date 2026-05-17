---
layer: cognition-indexes
type: semantic-cluster
cluster: ai-native
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
last-reviewed: 2026-05-10
---

# AI-Native Semantic Cluster

Entries conceptually related to AI-native system design, agent architecture, context engineering, LLM orchestration, knowledge systems, and AI safety.

**Retrieval trigger:** Any routing key containing: ai-feature-requirements, ai-safety-review, knowledge-management, agent-design, context-engineering, orchestration.

---

## Cluster Members

### Agent Architecture
- `agents/MASTER-REGISTRY.md` — All 144 agents, routing keys, tier structure [CRITICAL]
- `orchestrator/master-orchestrator.md` — Orchestration logic [CRITICAL]
- `orchestrator/routing-rules.md` — Routing rules [CRITICAL]
- `memory-routing/context-routing-engine.md` — Context routing engine [CRITICAL]

### Context Engineering
- `memory-routing/context-prioritization.md` — Context priority tiers P0-P4 [CRITICAL]
- `memory-governance/context-compression-protocol.md` — Context compression [CRITICAL]
- `memory-routing/organizational-context-federation.md` — Cross-domain context federation [HIGH]

### Knowledge Systems
- `knowledge-governance/README.md` — Knowledge governance [HIGH]
- `cognition-indexes/README.md` — Index architecture [HIGH]
- `cognition-indexes/master-cognition-index.md` — Keyword index [HIGH]
- `graph-models/enterprise-cognition-graph.md` — Cognition graph [HIGH]

### Memory Architecture
- `memory-governance/README.md` — Memory governance overview [HIGH]
- `memory-governance/federated-memory-architecture.md` — Federated memory [HIGH]
- `memory-governance/continuity-checkpoint-system.md` — Checkpoint system [HIGH]
- `memory-governance/long-context-preservation.md` — 3-tier access, EWC [HIGH]

### State and Lifecycle Models
- `state-models/agent-execution-states.md` — Agent state machine [HIGH]
- `state-models/session-states.md` — Session lifecycle [HIGH]
- `lifecycle-models/agent-lifecycle.md` — Agent lifecycle [HIGH]

### AI Safety
- `constitution/enterprise-constitution.md` — AI safety constitutional constraints [CRITICAL]
- `docs/governance/principles.md` — Governance principles restricting agent behavior [CRITICAL]
- `memory-routing/context-prioritization.md` — ai-safety-review routing key → P0 override [HIGH]

### External Research (Research Intelligence)
- `external-research/ruflo/` — Swarm coordination, routing, EWC, CRDT primitives [HIGH]
- `external-research/TradingAgents/` — Multi-agent patterns, checkpoint/resume [HIGH]
- `external-research/dexter/` — Autonomous continuation, context compression, loop detection [HIGH]
- `wiki/research/ruflo-patterns.md` — Extracted ruflo patterns (PENDING) [HIGH]
- `wiki/research/tradingagents-patterns.md` — Extracted TradingAgents patterns (PENDING) [HIGH]
- `wiki/research/dexter-patterns.md` — Extracted dexter patterns (PENDING) [HIGH]

### Ontology
- `ontology/runtime-vocabulary.md` — Runtime terms (Raft, CRDT, dispatch tier) [HIGH]
- `ontology/knowledge-vocabulary.md` — Knowledge terms (synthesis, EWC, federation) [HIGH]
- `ontology/workflow-vocabulary.md` — Workflow terms (run-context, loop detection) [HIGH]
- `ontology/event-vocabulary.md` — Event taxonomy [HIGH]

---

## Co-Retrieval Rules

| If retrieving... | Also retrieve... |
|---|---|
| Agent registry | Routing rules, orchestrator |
| Context routing | Prioritization, compression, federation |
| AI feature design | Safety constraints, governance principles |
| Knowledge management | Cognition indexes, synthesis index |
| Agent lifecycle | State models, execution state machine |
| External research | Synthesis index (what has already been extracted) |

---

## AI-Native Architecture Principles (From Extracted Research)

The following primitives from external research are now embedded in the OS:

| Primitive | Source | Implementation |
|---|---|---|
| ReasoningBank (RETRIEVE/JUDGE/DISTILL/CONSOLIDATE) | ruflo | knowledge-synthesis pipeline |
| 3-tier model dispatch | ruflo | T0/T1/Sonnet/Opus dispatch tiers |
| Raft consensus | ruflo | Domain truth arbitration via Raft leaders |
| CRDT concurrent updates | ruflo | knowledge-governance contradiction resolution |
| Anti-drift swarm coordination | ruflo | 4-control anti-drift protocol |
| LangGraph checkpoint/resume | TradingAgents | 3-level checkpoint hierarchy |
| Run-context serialization | dexter | Full run-context YAML spec |
| 5-stage context compression | dexter | microcompact compression pipeline |
| Loop detection (>3 visits) | dexter | Step-level safety control |
| Cron autonomous workflows | dexter | Scheduled maintenance system |

---

## Agents with AI-Native as Primary Domain

- `master-orchestrator-agent` (T3)
- `knowledge-systems-architect-agent` (T3)
- `knowledge-systems-engineer-agent` (T2)
- `organizational-learning-agent` (T3)
- `agent-coordination-agent` (T3)
- `context-routing-engine-agent` (T3)
- `ai-pm-agent` (T2, if defined)