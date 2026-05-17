---
type: architecture
status: current
created: 2026-05-08
updated: 2026-05-14
author: architect-agent
---

# Agent Topology

Documents how agents interact, what communication channels they use, how context flows between them, and how the digital twin intelligence layer connects to the agent network.

---

## Two Interaction Models

The OS operates two distinct interaction models in parallel:

**Model A — Demand-driven execution** (user or orchestrator triggers an agent)
```
User/Orchestrator → Agent → Artifact → Gate → Next Agent
```

**Model B — Schedule-driven intelligence** (twin engine runs autonomously on a clock)
```
Execution Ledger → Twin Sync → Digital Twins → Simulation Engine → Prediction Engine → Orchestrator alerts
```

Model A produces work. Model B monitors the health of the system doing that work and warns when trajectories are wrong. Both write to `memory/` and `wiki/` as their shared knowledge layer.

---

## Full System Topology

```
╔══════════════════════════════════════════════════════════════════════╗
║                       HUMAN INTERFACE                               ║
╚══════════════════════╤═══════════════════════════════════════════════╝
                       │  intent
                       ▼
╔══════════════════════════════════════════════════════════════════════╗
║                  MASTER ORCHESTRATOR                                ║
║            routing · scheduling · alert routing                     ║
╚══════╤═══════════════╤═══════════════════════════╤══════════════════╝
       │ task dispatch  │ receives IMMEDIATE alerts  │ reads predictions
       ▼                ▼                            ▼
╔══════════════╗  ╔═══════════════════════════════════════════════════╗
║  EXECUTION   ║  ║           INTELLIGENCE LAYER                     ║
║  AGENTS      ║  ║                                                   ║
║              ║  ║  twin-engine (every 4h + on anomaly)              ║
║  PM          ║  ║       ├── org-twin       (15 min sync)            ║
║  Arch        ║  ║       ├── workflow-twin  (10 min sync)            ║
║  Eng         ║  ║       ├── delivery-twin  (30 min sync)            ║
║  QA          ║  ║       └── runtime-twin   ( 5 min sync)            ║
║  UX          ║  ║                │                                   ║
║  Analytics   ║  ║       simulation-engine                           ║
║  Delivery    ║  ║       (10 simulators — frozen snapshots)          ║
║  Governance  ║  ║                │                                   ║
║  + 136 more  ║  ║       prediction-engine                           ║
╚══════╤═══════╝  ║       ├── org-forecaster                          ║
       │           ║       ├── operational-forecaster                  ║
       │writes     ║       ├── bottleneck-predictor                    ║
       ▼           ║       └── governance-risk-predictor               ║
╔══════════════╗  ╚═══════════════════╤═════════════════════════════════╝
║  PERSISTENCE ║◄─────────────────────┘  reads from (for twin sync)
║  LAYER       ║
║              ║  writes predictions to
║  execution-  ║──────────────────────────────────►  memory/digital-twins/
║  ledger      ║                                       predictions/
║  work-queue  ║──────────────────────────────────►  wiki/intelligence/
║  checkpoints ║                                       (HIGH + IMMEDIATE)
║  artifact-   ║
║  registry    ║
╚══════════════╝
```

---

## Demand-Driven Agent Interaction

Agents interact **only through artifacts and handoff envelopes**. There are no direct agent-to-agent API calls.

```
Agent A                          Agent B
   │                                │
   │──→ writes artifact to disk     │
   │──→ creates handoff envelope    │
   │──→ writes event to ledger      │
                                    │
   Orchestrator reads handoff       │
   Orchestrator invokes Agent B     │
                                    │──→ reads handoff envelope
                                    │──→ loads artifact
                                    │──→ loads wiki/memory refs
                                    │──→ optionally reads prediction state
                                    │──→ produces output
```

---

## Agent Communication Matrix

### Execution Agents (demand-driven)

Who can hand off to whom directly:

```
pm-agent         → architect-agent, ux-agent, analytics-agent, delivery-agent
strategist-agent → pm-agent
market-analyst   → strategist-agent, pm-agent
architect-agent  → engineer-agent, security-agent
security-agent   → architect-agent, engineer-agent, delivery-agent
ux-agent         → engineer-agent, qa-agent
engineer-agent   → qa-agent, docs-agent
qa-agent         → delivery-agent (pass), engineer-agent (fail)
docs-agent       → delivery-agent
analytics-agent  → pm-agent, engineer-agent
delivery-agent   → pm-agent (post-release)
supervisor       → any agent (review feedback)
```

Any path not listed above routes through the Master Orchestrator.

### Intelligence Layer (schedule-driven)

The intelligence layer does not receive handoffs — it runs on its own cycle and writes to shared memory:

```
twin-engine (scheduler)
    │ reads from
    ├──→ execution-ledger (ground truth for all twin sync)
    ├──→ work-queue.yaml (delivery state)
    ├──→ execution-registry.yaml (org state)
    │
    │ coordinates
    ├──→ twin-sync (event-driven delta + scheduled batch)
    ├──→ simulation-engine (targeted simulations when uncertainty > threshold)
    └──→ prediction-engine
              │ calls
              ├──→ org-forecaster
              ├──→ operational-forecaster
              ├──→ bottleneck-predictor
              └──→ governance-risk-predictor
              │
              │ writes
              ├──→ memory/digital-twins/predictions/  (all urgencies)
              ├──→ wiki/intelligence/                 (HIGH + IMMEDIATE)
              └──→ master-orchestrator alert          (IMMEDIATE only)
```

### Cross-Layer Communication

The two layers communicate in both directions:

| Direction | Channel | What Flows |
|-----------|---------|-----------|
| Execution → Intelligence | execution-ledger | Every step completion, gate verdict, workflow event |
| Intelligence → Execution | orchestrator alert | IMMEDIATE prediction alerts |
| Intelligence → Execution | wiki/intelligence | HIGH predictions (picked up next session) |
| Intelligence → Execution | memory/digital-twins/ | Prediction state (agents consult before routing decisions) |

---

## Shared Knowledge Layer

All agents share read/write access to:

```
wiki/                         ← Persistent organizational knowledge
  └── intelligence/           ← HIGH/IMMEDIATE predictions (written by prediction-engine)
memory/                       ← Persistent AI memory
  ├── digital-twins/          ← Twin state, simulations, forecasts, predictions
  │     ├── twin-state/       ← Live twin state YAML files (written by twin-sync)
  │     ├── predictions/      ← Prediction records (written by prediction-engine)
  │     ├── forecasts/        ← Forecast records (written by forecasters)
  │     └── simulation-results/ ← Simulation output (written by simulation-engine)
  ├── patterns/               ← Validated patterns (any agent can add)
  ├── execution-memory/       ← Settled decisions per workflow
  └── checkpoints/            ← Phase + gate checkpoints
templates/                    ← Artifact templates (read-only for most agents)
```

Write discipline:
- **`wiki/architecture/`** → architect-agent is primary owner
- **`wiki/research/`** → pm-agent is primary owner
- **`wiki/intelligence/`** → prediction-engine is sole writer; agents read only
- **`memory/digital-twins/`** → twin-engine and prediction-engine are sole writers; agents read only
- **`memory/patterns/`** → any agent can add; supervisor validates
- **`wiki/decisions/`** → any agent that participated in a decision
- **`docs/governance/`** → supervisor only

---

## Context Inheritance

When the orchestrator invokes an execution agent, the context package contains:

```
Layer 1: Agent identity (from agents/<agent>.md)
Layer 2: Task specification (from handoff envelope)
Layer 3: Relevant wiki pages (loaded by orchestrator, summarized)
Layer 4: Relevant memory entries (loaded by orchestrator, filtered)
Layer 5: Upstream artifacts (paths; loaded on demand)
Layer 6: Applicable constraints (from governance + memory)
```

**Digital twin enrichment (Layer 4 extension):** For routing and planning decisions, the orchestrator additionally injects relevant prediction state:

```
Layer 4b [optional]: Active predictions relevant to this task
  - IMMEDIATE alerts: always injected
  - HIGH predictions for involved org units: injected when routing to those units
  - Current delivery confidence score: injected for sprint/release decisions
  - Current runtime saturation level: injected for any agent invocation when ELEVATED+
```

No agent receives the full conversation history. Each agent starts fresh from its context package.

---

## Plugin Integration Points

| Agent | Plugin | Integration Point |
|-------|--------|------------------|
| pm-agent | `agents/plugins/ai-pm-copilot` | PM frameworks (RICE, JTBD, PMF) applied in PRD writing |
| pm-agent | `agents/plugins/agent-teams` | PRD stress-testing via debate pattern |
| architect-agent | `BMAD-METHOD` | SDLC stage definitions, agile ceremonies |
| architect-agent | `superpowers` | Brainstorm → design → plan cycle for architecture |
| engineer-agent | `claude-dev-workflow` | Tier classification before any work |
| engineer-agent | `superpowers` | Subagent-driven development for M/L tier |
| ux-agent | `ui-ux-pro-max-skill` | Design intelligence, style selection, color palettes |
| all agents | `Agent-Skills-for-Context-Engineering` | Context budget management |
| all agents | `claude-mem` | Memory read/write operations |

---

## Execution Patterns

### Sequential (default)
Most workflows execute steps sequentially, each gate blocking the next step.

### Parallel
Steps with no mutual dependency execute in parallel groups (see `orchestrator/execution-engine.md`).

Current parallel groups:
- Architecture design + UX design (both start from approved PRD, no dependency on each other)
- QA testing + Documentation (can overlap with late-stage implementation)

### Fan-out / Fan-in
For validation workflows (e.g., PRD stress test via `agent-teams`):
- Fan-out: same artifact sent to multiple agents for independent review
- Fan-in: supervisor synthesizes findings before issuing verdict

### Supervisor Loop
```
Agent produces output
    ↓
Supervisor reviews
    ↓
PASS → next step
CONDITIONAL → agent fixes specific items → supervisor re-reviews
FAIL → agent re-does entire step → supervisor re-reviews
(max 2 cycles; then escalate to human)
```

### Autonomous Schedule (intelligence layer)
The twin engine runs independently of user sessions on a fixed schedule:

```
Every 4 hours (wall clock):
    twin-engine wakes
        ├── twin-sync: refresh all four twins from ledger
        ├── anomaly detection: check for 7 anomaly patterns
        ├── simulation-engine: run targeted simulations if uncertainty > threshold
        ├── prediction-engine: generate predictions across 8 classes
        │       ├── org-forecaster
        │       ├── operational-forecaster
        │       ├── bottleneck-predictor
        │       └── governance-risk-predictor
        └── surface: route by urgency (IMMEDIATE/HIGH/MEDIUM/MONITOR)

On anomaly detection (any time):
    twin-engine wakes immediately → runs abbreviated prediction cycle
    IMMEDIATE predictions surface without waiting for next 4-hour cycle
```

This pattern is fully autonomous — no user intent required, no orchestrator routing. The output (prediction alerts) flows back into the orchestrator as an inbound signal.

### Recovery Resumption
When a session is interrupted mid-workflow, the continuation system classifies the recovery state (RS-01 through RS-09) and routes to the appropriate recovery agent:

```
Session interrupt detected
    ↓
recovery-orchestrator: classify recovery state (RS-01 to RS-09)
    ├── RS-01/RS-02: warm-resume (fast, high confidence)
    ├── RS-03/RS-04: interruption-recovery (mid-step resume)
    ├── RS-05/RS-06: warm-resume with staleness checks
    ├── RS-07:       cold-start-recovery (full ledger reconstruction)
    ├── RS-08:       decision conflict resolution before resume
    └── RS-09:       human escalation (runaway state)
```

---

## How Agents Use the Digital Twin

Execution agents don't directly query the twin system — they receive relevant prediction state as part of their context package (Layer 4b). However, certain agents have deeper integration:

| Agent | Twin Integration |
|-------|-----------------|
| `master-orchestrator` | Receives IMMEDIATE alerts; reads current saturation level before routing; checks delivery confidence for sprint decisions |
| `delivery-agent` | Reads delivery-twin sprint health before sprint planning; reads carry-over risk before scope decisions |
| `architect-agent` | Reads dependency-simulator output when reviewing cross-team work |
| `governance-agent` | Reads governance-risk-predictor output; responds to gate compliance alerts |
| `qa-agent` | Reads quality degradation predictions; adjusts review depth when quality trending down |
| `research-intelligence/orchestrator` | Reads org-twin for organizational context in competitive/market research |

No agent writes to `memory/digital-twins/` — that directory is the exclusive domain of the twin engine and prediction engine.

---

## Agent Authority Hierarchy

For decisions that require escalation:

```
T5  Human operator
     └── required for: CRITICAL governance violations, RS-09 runaway,
                       third rollback, budget decisions > threshold

T4  Executive agents (CPO, CTO, CAIO, VPs, Councils)
     └── required for: go/no-go on release, major reorg decisions,
                       policy changes

T3  Supervisor + Governance org + AI-Native org + Meta-org
     └── required for: gate verdicts, recovery escalations,
                       prediction recalibration decisions

T2  Domain orgs (PM, Arch, Eng, QA, UX, Delivery, Analytics, etc.)
     └── required for: workflow execution, artifact production,
                       routine handoffs

T1  Execution orgs (Engineering, Runtime)
     └── required for: implementation, tool execution
```

The digital twin intelligence layer operates at T3 — it escalates IMMEDIATE alerts to T4/T5 but does not itself take T4/T5 actions.

---

## See Also

- `orchestrator/master-orchestrator.md` — Master orchestrator definition
- `orchestrator/agent-registry.md` — All 144 agents registered
- `orchestrator/routing-rules.md` — Full routing decision table
- `wiki/systems/digital-twin-system.md` — Digital twin system overview
- `wiki/systems/prediction-response-guide.md` — How to act on prediction alerts
- `digital-twins/twin-engine.md` — Twin engine definition
- `predictive-intelligence/prediction-engine.md` — Prediction engine definition
- `continuation-systems/continuation-engine.md` — Continuation engine definition
