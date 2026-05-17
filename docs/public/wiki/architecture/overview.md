---
type: wiki
status: current
created: 2026-05-08
updated: 2026-05-14
author: architect-agent
---

# Architecture Overview

## System Purpose

The Enterprise AI OS is a multi-agent system that orchestrates AI-native product and engineering operations. It coordinates specialized agents across PM, architecture, engineering, QA, UX, analytics, and delivery organizations to produce artifact-driven outputs with minimal manual prompting.

The OS operates in two modes simultaneously:
- **Execution mode:** Routes user intent through deterministic workflows, enforcing quality gates, producing named artifacts
- **Intelligence mode:** Continuously monitors enterprise state via digital twins, runs forward simulations, and surfaces early warnings before problems occur

---

## System Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HUMAN / ORCHESTRATOR INTERFACE                    │
│              intent → routing → workflow → artifact → gate           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────────┐
│                      AGENT EXECUTION LAYER                           │
│   144 agents across 17 orgs — PM, Arch, Eng, QA, UX, Delivery, etc. │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  writes events to
┌────────────────────────────▼─────────────────────────────────────────┐
│                   PERSISTENCE & CONTINUATION LAYER                   │
│  execution-ledger · work-queue · checkpoints · artifact-registry     │
│  27 files — cold-start, warm-resume, handoff + interruption recovery │
└──────────┬─────────────────────────────────────────┬─────────────────┘
           │  ground truth for                       │  recovery from
┌──────────▼──────────────────┐        ┌─────────────▼─────────────────┐
│   DIGITAL TWIN LAYER        │        │   RESEARCH INTELLIGENCE        │
│  org · workflow · delivery  │        │  discovery · synthesis ·       │
│  runtime twins              │        │  evidence · competitive        │
│        ↓                    │        └───────────────────────────────┘
│  simulation engine          │
│        ↓                    │
│  predictive intelligence    │
│  → early warnings           │
└─────────────────────────────┘
```

---

## Agent Topology

```
                    ┌─────────────────────────┐
                    │   Master Orchestrator    │
                    │  (orchestrator/master-   │
                    │   orchestrator.md)       │
                    └──────────┬──────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐      ┌──────▼─────┐      ┌──────▼─────┐
    │  PM Org    │      │  Arch Org  │      │  Eng Org   │
    │  pm-agent  │      │ architect  │      │  engineer  │
    │ strategist │      │ security   │      │   docs     │
    │  analyst   │      └────────────┘      └────────────┘
    └────────────┘
          │                    │                    │
    ┌─────▼──────┐      ┌──────▼─────┐      ┌──────▼─────┐
    │   UX Org   │      │   QA Org   │      │ Analytics  │
    │  ux-agent  │      │  qa-agent  │      │  analytics │
    └────────────┘      └────────────┘      └────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Delivery Org      │
                    │  delivery-agent     │
                    └─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Supervisor        │
                    │  (quality gate)     │
                    └─────────────────────┘
```

For the full 144-agent topology: `wiki/architecture/agent-topology.md`

---

## Core Architectural Decisions

### 1. Artifact-Driven Communication
Agents do not communicate via free-form messages. Every inter-agent communication uses:
- Handoff envelopes (structured YAML, using `templates/handoff-template.md`)
- Named artifacts at defined file paths
- Wiki/memory as shared knowledge layer

**Why:** Prevents context rot, enables audit trails, allows workflow recovery after context resets.

### 2. Minimum Viable Context
Each agent receives only the context required for its specific step. No agent has access to the full project history by default.

**Why:** LLM output quality degrades with irrelevant context. Focused context produces focused outputs.

### 3. Deterministic Workflow Routing
The master orchestrator routes requests using explicit rules (`orchestrator/routing-rules.md`), not inferred intent. Routing tables are maintained as versioned files.

**Why:** Prevents "creative" routing decisions that skip quality gates or appropriate agents.

### 4. Layered Memory
Three tiers of organizational memory:
- **Hot (wiki/):** Frequently accessed, maintained by humans and agents
- **Warm (memory/):** Agent-accessible summaries, constraints, patterns
- **Cold (artifacts/):** Full artifact history in appropriate directories

**Why:** Context budgets require selective memory loading. Three tiers allow appropriate access patterns.

### 5. Plugin-Backed Capabilities
Specialized capabilities (PM frameworks, design intelligence, dev workflows) are provided by installed plugins, not re-implemented in agent prompts.

**Why:** Reuse mature, maintained implementations. Agent prompts stay focused on orchestration.

### 6. Predictive Over Reactive
The OS does not only alert when thresholds are breached — it monitors leading indicators and raises warnings when trajectories are wrong, days or weeks before impact. The digital twin system continuously models enterprise state and runs forward simulations to surface actionable predictions.

**Why:** By the time a threshold is breached, the window for low-cost intervention has closed. Trajectory-based warnings preserve optionality.

### 7. Autonomous Continuation
Every workflow step writes to the execution ledger and creates checkpoints before phase transitions. If a session is interrupted, the continuation system can reconstruct state from the ledger and resume without human intervention.

**Why:** Multi-step workflows spanning hours cannot depend on a single session remaining healthy. Persistence must be a first-class concern, not an afterthought.

---

## Data Flow

### Execution Flow

```
User Intent
    ↓
Master Orchestrator (intent classification + routing)
    ↓
Selected Workflow (orchestrates multi-step execution)
    ↓
Step N: Agent reads [handoff] + [wiki refs] + [memory refs]
    ↓
Step N: Agent produces [artifact] + [writes to execution-ledger]
    ↓
Gate: Supervisor validates artifact
    ↓
Checkpoint: Phase snapshot written to memory/checkpoints/
    ↓
Next Step or Workflow Complete
    ↓
Wiki + Memory updated with decisions and learnings
```

### Intelligence Flow (parallel, continuous)

```
Execution Ledger (ground truth)
    ↓  event-driven delta sync (seconds)
Four Digital Twins — synchronized mirrors of live state:
  org-twin · workflow-twin · delivery-twin · runtime-twin
    ↓  every 4 hours + on anomaly
Simulation Engine — Monte Carlo, 1000 iterations, frozen snapshots
    ↓
Predictive Intelligence — 8 prediction classes, p10/p50/p90 output
    ↓
Urgency Classification:
  IMMEDIATE → Orchestrator alert + human notification
  HIGH      → Wiki intelligence page
  MEDIUM    → Daily summary
  MONITOR   → Predictions store
```

The two flows are coupled: execution writes events that update twins, and twin predictions inform orchestrator routing decisions (e.g., rerouting work away from units approaching capacity exhaustion).

---

## Digital Twin Architecture

The digital twin system is the enterprise's predictive intelligence layer. It maintains continuously-updated computational mirrors of four core systems and uses them to run forward simulations.

### The Four Twins

| Twin | Mirrors | Sync Frequency |
|------|---------|----------------|
| `org-twin` | Org units, agents, capacity, escalations, governance | 15 min |
| `workflow-twin` | Workflows, gates, flow efficiency, failure rates | 10 min |
| `delivery-twin` | Roadmap, sprints, dependencies, releases | 30 min |
| `runtime-twin` | Context pressure, tool budget, orchestration load | 5 min |

### Simulation Systems (10 simulators)

Monte Carlo simulations against frozen twin snapshots (never the live twin):

- **Org:** staffing-simulator, governance-simulator, escalation-simulator
- **Workflow:** workflow-simulator, orchestration-simulator, coordination-simulator
- **Delivery:** roadmap-forecaster, dependency-simulator, release-risk-simulator, rollout-forecaster
- **Runtime:** runtime-load-simulator

### Predictive Intelligence (5 systems)

| System | Key Output |
|--------|-----------|
| `prediction-engine` | Master report: urgency-classified alerts every 4 hours |
| `org-forecaster` | Org health trajectory, capacity exhaustion dates |
| `operational-forecaster` | Throughput, quality, flow efficiency, WIP saturation |
| `bottleneck-predictor` | 8 bottleneck classes, onset probability, compound patterns |
| `governance-risk-predictor` | Gate compliance drift, policy adherence, SLA trajectory |

### Key Modeling Principles

- **Frozen snapshots:** Simulations run on a point-in-time copy of twin state, never the live twin
- **Probabilistic output:** Every forecast produces p10/p50/p90, never a single point estimate
- **Leading indicators:** Predictions based on metrics that precede problems (escalation rate, gate pass rate trend, context pressure trajectory)
- **Calibration tracking:** Prediction accuracy tracked per class; target ≥ 80% of actuals within p10-p90 range

Full documentation: `wiki/systems/digital-twin-system.md`

---

## Persistence & Continuation Architecture

The continuation system ensures workflows survive interruption and can resume deterministically:

### Execution Ledger
Append-only JSONL log of every event in the system — ground truth for all twin sync and state reconstruction. Never modified, never deleted.

### Checkpoint System
Three checkpoint types:
- **Phase snapshots** — Gold-standard captures at clean phase transitions (all steps complete, all gates passed)
- **Gate-pass checkpoints** — Captured after each successful gate
- **Runtime snapshots** — Lightweight mid-step captures at tool budget intervals

### Recovery States (RS-01 – RS-09)
Nine classified recovery states from RS-01 (clean phase boundary, high confidence) to RS-09 (runaway, unknown). Each routes to the appropriate recovery system.

### Recovery Systems
- `cold-start-recovery` — Full reconstruction from ledger when no checkpoint exists
- `warm-resume` — Fast resumption from recent valid checkpoint
- `handoff-recovery` — Handles agent-to-agent delegation failures
- `interruption-recovery` — Mid-step resumption with tool-call deduplication

---

## Installed Plugins and Their Roles

| Plugin | Location | Role in Architecture |
|--------|----------|---------------------|
| BMAD-METHOD | `BMAD-METHOD/` | SDLC orchestration framework; agile patterns |
| ai-pm-copilot | `agents/plugins/ai-pm-copilot/` | PM frameworks (RICE, JTBD, PMF, GTM) |
| agent-teams | `agents/plugins/agent-teams/` | Multi-agent validation and PRD stress testing |
| claude-skills | `claude-skills/` | 66 development skills across 12 domains |
| Agent-Skills-for-Context-Engineering | same | Context engineering principles; MVC patterns |
| superpowers | `superpowers/` | Subagent-driven development methodology |
| get-shit-done | `get-shit-done/` | Issue-driven orchestration; context rot prevention |
| claude-mem | `claude-mem/` | Persistent memory + compression system |
| ui-ux-pro-max-skill | `ui-ux-pro-max-skill/` | Design intelligence; 161 palettes, 67 styles |
| claude-dev-workflow | `claude-dev-workflow/` | Tiered dev workflow (XS/M/L) |
| claude-scaffold-project | `claude-scaffold-project/` | Project bootstrapping |

---

## Directory Structure

```
AI-Enterprise-OS/
├── orchestrator/              ← Orchestration layer (6 files)
├── agents/                    ← 144 agent definitions across 17 orgs
├── workflows/                 ← 7 workflow definitions
├── templates/                 ← 12 reusable artifact templates
├── handoffs/                  ← Handoff protocol + instances
├── wiki/                      ← Organizational knowledge base
│   ├── systems/               ← System documentation (digital twins, etc.)
│   ├── architecture/          ← Architecture docs
│   ├── processes/             ← Process documentation
│   ├── runbooks/              ← Operational runbooks
│   ├── intelligence/          ← Auto-generated intelligence packages
│   └── knowledge/             ← Institutional knowledge
├── memory/                    ← Persistent AI memory layer
│   ├── digital-twins/         ← Twin state, simulations, forecasts, predictions
│   ├── checkpoints/           ← Workflow phase + gate checkpoints
│   ├── execution-store/       ← 12 JSONL append-only stores
│   ├── execution-memory/      ← Per-workflow settled decisions
│   ├── session-bridge/        ← Cross-session bridge packages
│   ├── rollback-archive/      ← Rolled-back artifacts (permanent)
│   └── recovery/              ← Recovery coordinator state
├── digital-twins/             ← Twin definitions (7 files)
├── enterprise-modeling/       ← Mathematical models (5 files)
├── simulation-systems/        ← Simulators (9 files)
├── forecasting/               ← Delivery + release forecasters (5 files)
├── predictive-intelligence/   ← Prediction systems (5 files)
├── continuation-systems/      ← Workflow continuation (6 files)
├── workflow-checkpoints/      ← Checkpoint system (5 files)
├── runtime-recovery/          ← Recovery systems (4 files)
├── execution-persistence/     ← Persistence layer (5 files)
├── research-intelligence/     ← Research + synthesis systems (32 files)
├── integrations/              ← 33 enterprise connectors
├── architecture/              ← Architecture docs + ADRs
├── docs/governance/           ← Governance rules and policies
├── constitution/              ← Supreme governing layer (5 files)
├── observability/             ← Metrics, dashboards, alerts
├── ontology/                  ← Shared vocabulary system
├── evaluations/               ← AI evaluation framework
├── state-models/              ← Workflow + artifact state machines
└── [installed plugins]/       ← BMAD-METHOD, claude-skills, etc.
```

---

## Operational Modes

The system operates in three modes simultaneously:

1. **Reactive:** User provides intent → orchestrator routes → agents execute → artifacts produced → gates enforced
2. **Proactive:** Digital twins monitor leading indicators → predictions generated → warnings surface before thresholds breach
3. **Autonomous:** Scheduled agents execute without user prompting (twin sync every 4 hours, wiki maintenance, metrics review, research pipelines)

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-08 | Initial OS: 10 agents, 7 workflows, 12 templates |
| 2.0.0 | 2026-05-09 | Observability, ontology, evaluations, constitution, ADR-001 |
| 3.0.0 | 2026-05-10 | Integration fabric (33 connectors), 144 agents / 17 orgs |
| 4.0.0 | 2026-05-14 | Autonomous continuation: checkpoints, recovery, ledger, work queue |
| 5.0.0 | 2026-05-14 | Enterprise digital twin system: 32 files, 4 twins, 10 simulators, 5 forecasters |

---

## See Also

- `orchestrator/master-orchestrator.md` — Orchestrator agent definition
- `orchestrator/agent-registry.md` — All agents and their capabilities
- `orchestrator/routing-rules.md` — Routing decision table
- `docs/governance/principles.md` — Governance principles
- `wiki/systems/digital-twin-system.md` — Digital twin system deep-dive
- `wiki/systems/simulation-guide.md` — How to request simulations
- `wiki/systems/prediction-response-guide.md` — How to act on prediction alerts
- `wiki/architecture/agent-topology.md` — Full 144-agent topology
- `SYSTEM.md` — Complete system map with all file listings
