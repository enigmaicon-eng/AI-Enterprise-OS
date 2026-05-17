# Simulation Guide

**Status:** Active  
**Last Updated:** 2026-05-14  
**Owner:** AI-Native Org

How to request, configure, and interpret simulations against the enterprise digital twin system.

---

## When to Run a Simulation

Run a simulation when you need to answer a "what if" question before committing to a decision:

| Situation | Simulation to Run |
|-----------|------------------|
| Considering a hiring freeze | `hiring_freeze_90d` scenario |
| A key agent is leaving | `key_agent_departure` scenario |
| Leadership wants to double throughput | `double_throughput_target` scenario |
| Planning to tighten quality gates | `gate_quality_increase_20pct` scenario |
| Considering compressing a release | `release_acceleration_2weeks` scenario |
| A dependency just slipped | `dependency_cascade_critical` scenario |
| Escalation rate is spiking | `escalation_surge_50pct` scenario |
| Context saturation warning fired | `context_saturation_onset` scenario |
| Org restructure being planned | `reorg_two_teams` scenario |
| New mandatory policy being added | `governance_policy_addition` scenario |

The prediction engine also triggers targeted simulations automatically when uncertainty exceeds thresholds — but manual simulation requests are appropriate for planning decisions.

---

## How to Request a Simulation

### Option A: Use a Predefined Scenario

The fastest path. Ten scenarios are pre-configured in `enterprise-modeling/scenario-model.md`.

```yaml
# Submit to simulation-engine.md
simulation_request:
  scenario_id: "hiring_freeze_90d"    # From scenario library
  requester: "delivery-agent"
  priority: HIGH                       # CRITICAL | HIGH | NORMAL | LOW
  purpose: "Planning for Q3 headcount freeze — need capacity impact"
  custom_overrides:
    freeze_duration_days: 60           # Override default if needed
```

### Option B: Define a Custom Scenario

For situations not covered by predefined scenarios:

```yaml
simulation_request:
  scenario_name: "Two engineers move to new product team"
  requester: "delivery-agent"
  priority: HIGH
  
  perturbations:
    - type: "remove_agent"
      target: "engineering-org"
      parameters:
        agents_removed: 2
        removal_date: "2026-06-01"
        knowledge_transfer_quality: 0.70
    - type: "add_workflow_volume"
      target: "workflow-twin"
      parameters:
        volume_multiplier: 1.0        # Volume stays the same — but fewer people
  
  objectives:
    - metric: "org_health_score"
      horizon_days: 30
    - metric: "sprint_completion_probability"
      horizon_days: 30
    - metric: "throughput"
      horizon_days: 60
  
  monte_carlo:
    iterations: 1000                  # Standard; use 500 for fast preview
```

### Option C: Ask the Orchestrator

For most users, the simplest path:

> "Run a simulation: what happens to delivery velocity if we freeze hiring for 60 days?"

The orchestrator will route this to the simulation engine, selecting the appropriate scenario and twins.

---

## Simulation Configuration Options

### Perturbation Types

**Organizational perturbations:**

| Type | Effect | Key Parameters |
|------|--------|---------------|
| `add_agent` | Adds agents to a unit, applies ramp-up curve | `unit`, `count`, `seniority` |
| `remove_agent` | Removes agents, models knowledge transfer | `unit`, `count`, `knowledge_transfer_quality` |
| `increase_workflow_volume` | Scales incoming work volume | `volume_multiplier`, `onset_type` |
| `reorg` | Merges/splits units, applies productivity dip | `source_units`, `target_unit`, `cultural_fit_factor` |

**Workflow perturbations:**

| Type | Effect | Key Parameters |
|------|--------|---------------|
| `volume_increase` | More work enters the system | `volume_multiplier`, `onset_days` |
| `gate_strictness_increase` | More rigorous quality gates | `strictness_factor`, `target_gates` |
| `step_failure_injection` | Introduces step failures at a rate | `failure_rate`, `failure_class` |
| `parallel_cap` | Limits concurrent work | `max_parallel` |

**Delivery perturbations:**

| Type | Effect | Key Parameters |
|------|--------|---------------|
| `add_scope` | Adds items to roadmap | `items_count`, `avg_effort_days` |
| `velocity_change` | Changes team velocity | `velocity_multiplier`, `onset` |
| `dependency_delay` | Slips a specific dependency | `item_id`, `delay_days`, `probability` |
| `resource_constraint` | Limits delivery capacity | `constraint_factor` |
| `scope_cut` | Removes items from release | `items_to_cut` |

**Runtime perturbations:**

| Type | Effect | Key Parameters |
|------|--------|---------------|
| `session_volume_increase` | More concurrent sessions | `session_multiplier` |
| `context_pressure_increase` | Sessions use more context | `pressure_factor` |
| `tool_budget_reduction` | Reduces available tool calls | `budget_multiplier` |
| `recovery_overhead_spike` | More failure recovery | `overhead_multiplier` |

### Uncertainty and Onset

Every perturbation can be configured with:
- `probability` — Chance this perturbation actually occurs (for scenarios that may or may not happen)
- `uncertainty` — How precisely we know the perturbation magnitude (0.0 = certain, 1.0 = highly uncertain)
- `onset` — `immediate | gradual | delayed`
- `onset_days` — How long the perturbation takes to fully materialize

---

## Reading Simulation Results

Simulation results are written to `memory/digital-twins/simulation-results/[simulation-id].yaml`. The result includes:

### Outcome Distributions

For each simulation objective, you get three values:

```
Org Health Score at 30 days:
  p10 (pessimistic): 61
  p50 (expected):    72
  p90 (optimistic):  81
```

Read as: "There's an 80% chance the org health score will be between 61 and 81 at 30 days. The most likely outcome is 72."

The **p10-p90 range** measures uncertainty. If it's narrow (e.g., 70-75), the simulation is confident. If it's wide (e.g., 45-85), there's high uncertainty and the actual outcome could vary significantly.

### Findings

The engine automatically identifies notable results:

| Finding Type | Meaning |
|-------------|---------|
| `THRESHOLD_BREACH` | A metric is projected to cross a critical threshold |
| `UNEXPECTED_OUTCOME` | An outcome is more than 2 standard deviations from baseline |
| `SENSITIVITY_INSIGHT` | One perturbation has disproportionate impact |
| `NONLINEARITY` | The impact curve bends sharply at a specific point |
| `INTERACTION_EFFECT` | Two perturbations together are much worse than either alone |

### Bottleneck Analysis

If the simulation detects a bottleneck forming, it reports:
- **Which resource/system** is the bottleneck
- **Onset probability distribution** (p10/p50/p90 onset days)
- **Impact** if the bottleneck is not addressed

### Recommendations

Simulations generate ranked recommendations:
1. **Recommended action** — Specific intervention
2. **Quantified impact** — Before/after values for key metrics
3. **Confidence** — How confident the model is in this recommendation

### Sensitivity Analysis

For complex scenarios, the simulation reports which inputs had the most impact on outputs. This tells you where to focus: "Reducing `knowledge_transfer_quality` from 0.70 to 0.50 had 3× more impact on org health than any other parameter."

---

## Common Simulation Patterns

### Before a Hiring Decision

Run both directions:

1. `hiring_freeze_90d` — What's the cost of *not* hiring?
2. A custom `add_agent` scenario — What's the benefit of hiring?

Compare org_health_score, throughput, and sprint_completion_probability at 30/60/90 days across both.

### Before a Release Decision

The release-risk-simulator runs automatically before each release. For a manual sanity check:

1. Check `memory/digital-twins/forecasts/release-risk-*.yaml` for the latest release risk assessment
2. If readiness_score < 80, investigate the low-scoring dimensions
3. If any hard blocker is listed, do not proceed to release

### Before a Major Process Change

Use `gate_quality_increase_20pct` as a template. The governance-simulator models the quality-velocity tradeoff curve and shows the minimum gate pass rate needed for a positive ROI on the policy change.

### When a Sprint Is At Risk

The delivery-forecaster runs daily. Check:
- `memory/digital-twins/forecasts/delivery-forecast-*.yaml`
- Look at `scope_recommendation` — if `REDUCE_SCOPE`, `items_to_defer` lists specific items to cut
- Check `carry_over_cascade_risk` — if HIGH, next sprint is also at risk if this one misses

---

## Simulation Confidence Levels

| Confidence | Meaning | When It Occurs |
|-----------|---------|---------------|
| HIGH | Model is reliable; trust the output | Twin data fresh, trend consistent, sufficient history |
| MEDIUM | Output is directionally correct; ranges are wider | One twin slightly stale, some parameter uncertainty |
| LOW | Use as rough guidance only | Stale twin data, high perturbation uncertainty |
| DEGRADED | Twin unavailable; simulation ran with incomplete state | Twin marked STALE and could not be refreshed |

When confidence is LOW or DEGRADED, expand your decision margin — act on the p10 outcome rather than p50, and verify the twin sync status before relying heavily on results.

---

*Back to: [`systems/digital-twin-system.md`](digital-twin-system.md)*
