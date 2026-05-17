# Coordination Runtime

**Layer:** Autonomous Enterprise Coordination Infrastructure  
**Version:** 1.0.0  
**Status:** Active — Phase 1 Runtime Foundation  
**Depends on:** Enterprise Constitution, Agent Registry, Integration Fabric

---

## Purpose

The Coordination Runtime is the execution substrate for all autonomous multi-agent coordination in the Enterprise AI OS. It provides the low-level primitives that delegation, consensus, risk-aware routing, organizational synchronization, and adaptive orchestration build upon.

This layer translates the OS's markdown-defined agent topology into an operational coordination mesh — enabling agents to delegate, negotiate, synchronize state, and route decisions without manual orchestration.

---

## Architecture

```
COORDINATION RUNTIME STACK
──────────────────────────────────────────────────────
┌────────────────────────────────────────────────────┐
│  ADAPTIVE ORCHESTRATION     (adaptive-orchestration/)
│  Topology mgmt, autonomous coordination            │
├────────────────────────────────────────────────────┤
│  ORGANIZATIONAL SYNC        (organizational-synchronization/)
│  Cross-org coordination, CRDT state sync           │
├────────────────────────────────────────────────────┤
│  RISK-AWARE ROUTING         (risk-aware-routing/)
│  Governance-gated delegation, escalation           │
├────────────────────────────────────────────────────┤
│  CONSENSUS FRAMEWORKS       (consensus-frameworks/)
│  Multi-perspective debate, BFT, quorum             │
├────────────────────────────────────────────────────┤
│  DELEGATION SYSTEMS         (delegation-systems/)
│  Specialist routing, workload distribution         │
├────────────────────────────────────────────────────┤
│  COORDINATION RUNTIME       ← this layer
│  Engine, state machine, event bus, health          │
├────────────────────────────────────────────────────┤
│  ENTERPRISE OS FOUNDATION   (agents/, workflows/)
│  144 agents, 17 orgs, 8 quality gates             │
└────────────────────────────────────────────────────┘
```

---

## Components

| File | Responsibility |
|------|----------------|
| `coordination-engine.md` | Agent-to-agent messaging, pattern execution (pipeline / fan-out / supervisor) |
| `state-machine.md` | Coordination state lifecycle, debate state typing, vector clock ordering |
| `event-bus.md` | Topic-based event routing, gossip propagation, anti-entropy |
| `health-monitor.md` | Topology health tracking, circuit breakers, rollback triggers |
| `model-tier-router.md` | 3-tier model selection: WASM / Haiku / Sonnet+Opus |
| `memory-coordinator.md` | Coordination namespace, hot/warm/cold state management |

---

## Core Primitives — Source Attribution

### From ruflo (claude-flow v3.6.10)

| Primitive | Description |
|-----------|-------------|
| Named-agent SendMessage | `SendMessage({to: "name", summary, message})` point-to-point comms |
| Pipeline pattern | A → B → C via sequential SendMessage |
| Fan-out / Fan-in | Lead spawns parallel workers, collects completions |
| Supervisor / Worker | Lead assigns via SendMessage, workers report back |
| CRDT sync | G-Counter, OR-Set, LWW-Register, RGA, DeltaStateCRDT |
| Gossip propagation | push / pull / push-pull with Merkle anti-entropy |
| Raft consensus | Leader election, log replication, heartbeats |
| Adaptive topology | 20% improvement threshold triggers switch; snapshot rollback |
| 3-tier model routing | WASM <1ms / Haiku ~500ms / Sonnet+Opus 2-5s |
| Memory key schema | `swarm$role$status` in coordination namespace |
| BFT consensus | pBFT three-phase: pre-prepare → prepare → commit |
| Quorum strategies | Network-Based / Performance-Based / Fault-Tolerance / Hybrid |
| Vector clocks | Causal ordering for all inter-agent state |

### From TradingAgents (multi-agent financial research system)

| Primitive | Description |
|-----------|-------------|
| Debate state machine | InvestDebateState / RiskDebateState TypedDicts |
| Count-based termination | `count >= N × max_rounds → advance to judge` |
| Round-robin rotation | latest_speaker tracking for fair turn-taking |
| Judge / Synthesizer | Debate histories → structured decision with 5-tier rating |
| Past-context injection | Cross-session decision continuity via past_context field |
| Propagator pattern | `create_initial_state(entity, date, past_context)` + `get_graph_args(recursion_limit)` |
| Structured output fallback | bind_structured + invoke_structured_or_freetext |
| Multi-perspective analysis | Bull/Bear or Aggressive/Conservative/Neutral simultaneously |

---

## Key Invariants

1. **No silent state mutation** — all state changes go through the coordination state machine
2. **Causal ordering enforced** — vector clocks on all inter-agent messages
3. **Governance gates respected** — routing never bypasses quality gates G1-G8
4. **Recursion bounded** — all graph traversals capped at `max_recur_limit` (default: 100)
5. **Constitution-aware** — 13 constitutionally prohibited actions are hard-blocked at engine entry
6. **Health-first rollback** — topology degrades gracefully under failure, never crashes silently

---

## Integration Points

| OS Layer | Integration |
|----------|-------------|
| `agents/MASTER-REGISTRY.md` | Agent capability index for delegation routing |
| `agents/ROUTING-TABLE.md` | 100+ routing key → agent mappings |
| `orchestrator/master-orchestrator.md` | Intent classification feeds coordination engine |
| `constitution/enterprise-constitution.md` | Hard limits §6.3 and §7.1 enforced at engine entry |
| `docs/governance/quality-gates.md` | G1-G8 pre-checks before any routing decision |
| `memory/` | Coordination namespace state persistence |
| `observability/metrics.md` | G1-G3 governance metrics from coordination events |
| `state-models/workflow-states.md` | Coordination transitions mapped to workflow states |

---

## Minimum Viable Invocation

```yaml
coordination_engine:
  intent: "feature_development"
  pattern: pipeline
  agents: [PM-001, ARCH-001, ENG-001]
  initial_state:
    entity: "user authentication feature"
    context: "sprint 1, greenfield project"
    past_context: ""        # injected from memory on subsequent runs
  config:
    recursion_limit: 100
    model_tier: auto        # routed per agent capability profile
  gates:
    pre_route:   [G1, G2]
    pre_execute: [G4]
    post_complete: [G5, G8]
```
