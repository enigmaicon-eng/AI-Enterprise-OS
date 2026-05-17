# Enterprise Digital Twin System

**Status:** Active  
**Version:** 1.0.0  
**Last Updated:** 2026-05-14  
**Owner:** AI-Native Org / Twin Engine

---

## What It Is

The Enterprise Digital Twin System maintains continuously-updated computational mirrors of the four core enterprise systems — organization, workflow, delivery, and runtime — and uses those mirrors to run forward simulations and generate early warnings before problems occur.

Unlike monitoring (which tells you something is wrong now), the digital twin system tells you something is trending wrong, days or weeks before impact.

**Core promise:** Surface the right warning, to the right person, early enough to act.

---

## Why It Exists

Enterprise systems fail predictably. A team that hits 85% utilization with a rising trend will hit 100% in days. A sprint where velocity is decelerating for the third consecutive week will miss. An escalation queue where arrival rate is growing faster than resolution capacity will collapse. The twin system makes these trajectories visible before they arrive.

**Before digital twins:** Reactive. Alerts fire when thresholds breach.  
**After digital twins:** Proactive. Warnings surface when trajectories are wrong.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       TWIN ENGINE                               │
│              (coordinates all activity every 4 hours)          │
└────────────┬────────────┬───────────────┬───────────────────────┘
             │            │               │
    ┌────────▼──┐  ┌──────▼──────┐  ┌────▼──────────┐
    │  LIVE     │  │ SIMULATION  │  │  PREDICTIVE   │
    │  TWINS    │  │  ENGINE     │  │  INTELLIGENCE │
    └────────┬──┘  └──────┬──────┘  └────┬──────────┘
             │            │               │
    ┌────────▼────────────▼───────────────▼──────────┐
    │              PERSISTENCE LAYER                  │
    │         memory/digital-twins/                   │
    └─────────────────────────────────────────────────┘
```

### Layer 1 — Live Twins

Four continuously-synchronized mirrors of live enterprise state:

| Twin | What It Mirrors | Sync Frequency | Primary Source |
|------|----------------|----------------|----------------|
| `org-twin` | Org units, agents, capacity, escalations, governance | Every 15 min | execution-registry, org-model |
| `workflow-twin` | Workflows, gates, flow efficiency, failure rates | Every 10 min | execution-ledger, gate-verdicts |
| `delivery-twin` | Roadmap items, sprints, dependencies, releases | Every 30 min | work-queue, sprint-state |
| `runtime-twin` | Context pressure, tool budget, orchestration load | Every 5 min | session-manifests, tool-logs |

### Layer 2 — Simulation Engine

Runs Monte Carlo simulations against frozen twin snapshots. Never modifies live twins.

Ten specialized simulators:
- **Org simulators:** staffing, governance, escalation
- **Workflow simulators:** volume, orchestration, coordination
- **Delivery simulators:** roadmap, dependency, release-risk, rollout
- **Runtime simulators:** runtime-load

Each simulation produces p10/p50/p90 outcome distributions across 1,000 iterations.

### Layer 3 — Predictive Intelligence

Five systems that consume twin state and simulation output to generate actionable forecasts:

| System | Horizon | Key Predictions |
|--------|---------|----------------|
| `prediction-engine` | Master | Aggregates all predictions, assigns urgency, routes alerts |
| `org-forecaster` | 2/4/12 weeks | Org health trajectory, capacity exhaustion dates, coverage gaps |
| `operational-forecaster` | 1/2/4 weeks | Throughput, quality, flow efficiency, WIP saturation |
| `bottleneck-predictor` | Continuous | 8 bottleneck classes, onset probability, compound patterns |
| `governance-risk-predictor` | 1/2/4 weeks | Gate compliance drift, policy adherence, SLA trajectory |

### Layer 4 — Persistence

All twin state, simulation results, forecasts, and predictions written to `memory/digital-twins/`:

```
memory/digital-twins/
├── engine-state.yaml           ← Twin engine status
├── prediction-accuracy.yaml    ← Calibration tracking per prediction class
├── simulation-index.yaml       ← Fast lookup for all simulation runs
├── twin-state/                 ← Live state files for each twin
├── simulation-results/         ← Per-run simulation result YAMLs
├── forecasts/                  ← Per-forecast result YAMLs
└── predictions/                ← Per-prediction result YAMLs
```

---

## How the Engine Cycle Works

The twin engine runs every 4 hours (and on anomaly detection):

```
1. SYNC     — Refresh all four twins from ground-truth sources
2. DETECT   — Check for anomalies in twin state (7 anomaly types)
3. SIMULATE — Run targeted simulations for any twin where uncertainty > threshold
4. PREDICT  — Generate predictions across all 8 prediction classes
5. SURFACE  — Route IMMEDIATE alerts to orchestrator, HIGH to wiki, MEDIUM to daily summary
6. REPORT   — Write prediction report to memory/digital-twins/predictions/
```

---

## Prediction Urgency Levels

| Urgency | Condition | Routing |
|---------|-----------|---------|
| **IMMEDIATE** | Breach probability > 80% AND time to impact < 48h | Alert orchestrator + notify human if CRITICAL |
| **HIGH** | Breach probability > 60% AND time to impact < 7 days | Write to wiki intelligence + include in next session |
| **MEDIUM** | Breach probability > 40% AND time to impact < 30 days | Write to predictions store + daily summary |
| **MONITOR** | Below thresholds | Write to predictions store, no action |

---

## Prediction Classes

Eight prediction classes run continuously:

| Class | Horizon | Trigger |
|-------|---------|---------|
| Org health forecast | 2/4/12 weeks | Every 4 hours |
| Capacity exhaustion | Days to weeks | Continuous |
| Delivery date forecast | Per item | Daily |
| Release readiness | Days to release | Daily |
| Bottleneck onset | Hours to days | Continuous |
| Governance risk | 1/2/4 weeks | Every 8 hours |
| Runtime saturation | Hours to days | Continuous |
| Quality degradation | Days | Every 4 hours |

---

## Key Concepts

### Frozen Snapshot Principle
Simulations always run against a frozen copy of twin state taken at simulation start. The live twins are never modified during a simulation run. This ensures reproducibility — the same scenario with the same snapshot produces the same result.

### Monte Carlo Output
Every simulation and forecast produces three values, never one:
- **p10** — Pessimistic outcome (10th percentile)
- **p50** — Expected outcome (50th percentile, the "most likely")
- **p90** — Optimistic outcome (90th percentile)

The spread between p10 and p90 measures uncertainty. Wide spread = high uncertainty = lower confidence.

### Historical Sampling
For delivery forecasting, the roadmap forecaster samples directly from the team's actual velocity history rather than fitting a theoretical distribution. This is more accurate for team-specific behavior — it captures the real shape of the team's variability.

### Leading Indicators
The prediction engine monitors metrics that *predict* future problems rather than measuring current state. Key examples:

| Indicator | Predicts | Lead Time |
|-----------|----------|-----------|
| escalation_rate_7d_trend rising | Org health degradation | 14 days |
| gate_pass_rate declining | Quality degradation | 7 days |
| capacity_utilization > 0.80 + rising | Capacity exhaustion | 21 days |
| dependency_at_risk_count growing | Release delay | 14 days |
| context_pressure_index > 0.60 + rising | Context saturation | 3 days |

### Saturation Dynamics
Near saturation, systems behave non-linearly. A queuing system at 90% utilization has 4.5× the wait time of one at 50% utilization. At 99% utilization, wait time is 50× baseline. The twin system models this non-linearity so warnings surface before the cliff, not after.

---

## Twin Synchronization

Two sync modes run in parallel:

**Event-driven delta sync** — triggered immediately when the execution ledger records a relevant event (workflow state change, gate verdict, step completion). Updates only the affected metrics. Latency: seconds.

**Scheduled batch sync** — full metric recomputation on a fixed schedule per twin. Catches anything the event-driven sync might miss. Latency: minutes.

**Conflict resolution priority:** execution-ledger > execution-store JSONL > execution-registry.yaml > workflow-state YAML

**Drift detection:** If twin state diverges from ground truth by > 5%, correction is automatic. Divergence > 20% triggers DEGRADED status and escalation.

---

## Enterprise Modeling Layer

Three mathematical models underpin the twin system:

**Org Model (`enterprise-modeling/org-model.md`)**  
- Capacity formulas by unit type (functional: 0.80 effective factor, specialist: 0.85, executive: 0.70)
- Health score: capacity×0.30 + quality×0.30 + velocity×0.20 + governance×0.20
- New hire ramp S-curve: productivity(x) = 3x² − 2x³
- Escalation SLA: CRITICAL 2h, HIGH 8h, MEDIUM 24h, LOW 72h

**Workflow Model (`enterprise-modeling/workflow-model.md`)**  
- Little's Law: L = λ × W (WIP = arrival_rate × lead_time)
- Flow efficiency: cycle_time / lead_time (> 0.80 excellent, < 0.40 critical)
- Gate efficiency: first_pass_rate / avg_gate_cycles

**Delivery Model (`enterprise-modeling/delivery-model.md`)**  
- Critical Path Method (CPM): forward/backward pass, float = latest_finish − earliest_finish
- Release readiness: scope 30% + quality 30% + dependency 20% + capacity 10% + technical 10%
- Go/No-Go: ≥ 90 = GO, ≥ 80 = CONDITIONAL_GO, < 80 = NO_GO

---

## Scenario Library

Ten predefined simulation scenarios in `enterprise-modeling/scenario-model.md`:

| Scenario | What It Tests |
|----------|--------------|
| `hiring_freeze_90d` | Impact of 90-day hiring freeze on capacity |
| `key_agent_departure` | Critical agent leaving mid-sprint |
| `double_throughput_target` | What happens if volume target doubles |
| `gate_quality_increase_20pct` | Effect of stricter quality gates on velocity |
| `release_acceleration_2weeks` | Compressing release timeline by 2 weeks |
| `dependency_cascade_critical` | Critical dependency slips by 2 weeks |
| `escalation_surge_50pct` | Escalation rate increases 50% |
| `context_saturation_onset` | System approaches context limit |
| `reorg_two_teams` | Merging two teams into one |
| `governance_policy_addition` | Adding a new mandatory review policy |

---

## Integration with Other OS Systems

| System | Integration |
|--------|------------|
| Execution ledger | Primary source of truth — twin-sync reads all events |
| Orchestrator | Receives IMMEDIATE alerts; uses bottleneck predictions for routing decisions |
| Research intelligence | Org and competitive intelligence enriches org-twin context |
| Delivery workflows | Sprint health and release readiness flow into delivery-twin |
| Continuation system | Recovery overhead flows into runtime-twin; twin state informs cold-start recovery |

---

## Files Quick Reference

| Need | File |
|------|------|
| Understand a twin | `digital-twins/[name]-twin.md` |
| Request a simulation | `simulation-systems/simulation-engine.md` |
| Read delivery forecast | `forecasting/delivery-forecaster.md` |
| Understand a prediction | `predictive-intelligence/prediction-engine.md` |
| Check org health forecast | `predictive-intelligence/org-forecaster.md` |
| Check bottleneck warnings | `predictive-intelligence/bottleneck-predictor.md` |
| Check governance risk | `predictive-intelligence/governance-risk-predictor.md` |
| Access twin state | `memory/digital-twins/twin-state/[twin]-state.yaml` |
| Read latest predictions | `memory/digital-twins/predictions/` |
| Prediction accuracy | `memory/digital-twins/prediction-accuracy.yaml` |

---

*For operational guidance, see: [`systems/digital-twin-operations.md`](digital-twin-operations.md)*  
*For simulation how-to, see: [`systems/simulation-guide.md`](simulation-guide.md)*  
*For responding to prediction alerts, see: [`systems/prediction-response-guide.md`](prediction-response-guide.md)*
