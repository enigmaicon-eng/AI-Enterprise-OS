# Simulation Engine

**System ID:** `simulation-engine`
**Role:** Core execution engine for all enterprise simulations — runs Monte Carlo, scenario analysis, and stress tests against frozen twin state snapshots, producing probability distributions of outcomes
**Storage:** `memory/digital-twins/simulation-results/`

---

## Purpose

The simulation engine is the computational heart of the digital twin system. It takes a frozen snapshot of one or more twins, applies perturbations defined in a scenario, and runs thousands of iterations to produce a statistical distribution of outcomes. It tells decision-makers not just "what will happen" but "how likely is each outcome" and "what are we most sensitive to."

**Core guarantee:** Simulation runs against a frozen twin snapshot, never against live state. This ensures simulations are reproducible and don't interfere with the live system.

---

## Simulation Types

| Type | When to Use | Iterations | Output |
|------|-------------|------------|--------|
| `monte_carlo` | Any scenario with uncertainty | 1000-10000 | Full probability distributions |
| `scenario_analysis` | Compare 3-5 discrete scenarios | 1 per scenario | Side-by-side comparison |
| `sensitivity_analysis` | Understand which variables matter most | N×K (N vars × K values) | Sensitivity indices |
| `stress_test` | Find breaking points | Sweep parameter space | Threshold identification |
| `what_if` | Simple counterfactual | 1 | Point estimate with confidence |

---

## Simulation Execution Protocol

### PHASE 01: Pre-Simulation Validation

```
INPUT: SimulationRequest (see twin-engine.md for schema)

VALIDATE:
  1. All required twins exist in twin-registry
  2. All required twins have status == "STABLE"
  3. Scenario schema is valid (see enterprise-modeling/scenario-model.md)
  4. Perturbations are valid for their target twins
  5. Objectives are measurable in the specified twins

IF any validation fails:
  → Return error with specific reason
  → Do not proceed

LOG: simulation_started event
```

### PHASE 02: Create Frozen Snapshots

```
FOR EACH required twin:
  1. Load current twin state from memory/digital-twins/twin-state/[twin-id].yaml
  2. Deep copy state (do NOT modify live twin)
  3. Tag snapshot with simulation_id and timestamp
  4. Store at: memory/digital-twins/simulation-snapshots/[sim-id]/[twin-id]-snapshot.yaml
  
RETURN: snapshot_set (all frozen twin states for this simulation)
```

### PHASE 03: Monte Carlo Execution

For `monte_carlo` type:

```
INITIALIZE:
  results_accumulator = {}  # collects per-iteration outcomes
  rng = Random(seed or current_timestamp)

FOR i in 1..iterations:
  
  # 3a. Sample perturbation magnitudes
  perturbation_samples = {}
  FOR EACH perturbation in scenario.perturbations:
    IF perturbation.uncertainty.change_value_std_dev:
      sampled_value = sample_normal(
        perturbation.change_value, 
        perturbation.uncertainty.change_value_std_dev
      )
    ELSE:
      sampled_value = perturbation.change_value
    
    IF perturbation.probability < 1.0:
      # Stochastic perturbation — may or may not occur
      sampled_value = sampled_value IF random() < perturbation.probability ELSE 0
    
    perturbation_samples[perturbation.perturbation_id] = sampled_value
  
  # 3b. Apply perturbations to snapshot copy
  perturbed_state = deep_copy(snapshot_set)
  FOR EACH perturbation:
    apply_perturbation(perturbed_state[perturbation.target_twin], perturbation, perturbation_samples)
  
  # 3c. Run time evolution (advance state through time horizon)
  trajectory = evolve_state(perturbed_state, time_horizon_days, time_step_days)
  
  # 3d. Extract objective values from final and intermediate states
  iteration_outcomes = {}
  FOR EACH objective in scenario.objectives:
    outcome = extract_metric(trajectory, objective)
    iteration_outcomes[objective.objective_id] = outcome
  
  # 3e. Accumulate
  results_accumulator[i] = iteration_outcomes

# AFTER all iterations:
distributions = compute_distributions(results_accumulator, confidence_levels)
```

### PHASE 04: State Evolution Model

How twin state evolves through simulation time:

```
EVOLVE(state, days, step_days):
  t = 0
  trajectory = {0: state}
  
  WHILE t < days:
    t += step_days
    prev_state = trajectory[t - step_days]
    next_state = deep_copy(prev_state)
    
    # Apply dynamics from each active twin
    IF "org-twin" in state:
      org_dynamics(next_state, prev_state, step_days)
    
    IF "workflow-twin" in state:
      workflow_dynamics(next_state, prev_state, step_days)
    
    IF "delivery-twin" in state:
      delivery_dynamics(next_state, prev_state, step_days)
    
    IF "runtime-twin" in state:
      runtime_dynamics(next_state, prev_state, step_days)
    
    trajectory[t] = next_state
  
  RETURN trajectory
```

#### Org Dynamics

```
org_dynamics(next, prev, dt):
  # Workload accumulates
  new_workflows_per_day = prev.workflow_twin.completions_per_day × volume_multiplier
  new_workflows = new_workflows_per_day × dt
  
  # Capacity changes (ramp-up of new hires, ramp-down of attrition)
  next.org_twin.capacity = apply_ramp(prev.org_twin.capacity, t)
  
  # Utilization responds to load
  next.org_twin.utilization_pct = (prev.workflow_twin.active_workflows + new_workflows) / next.org_twin.capacity
  
  # Health score responds to utilization
  next.org_twin.health_score = compute_health_score(next.org_twin)
  
  # Escalation rate responds to utilization (near-capacity = more escalations)
  IF next.org_twin.utilization_pct > 0.85:
    next.org_twin.escalation_rate = prev.org_twin.escalation_rate × 1.1  # escalation increases
```

#### Workflow Dynamics

```
workflow_dynamics(next, prev, dt):
  # Throughput = f(capacity, gate_pass_rate, retry_overhead)
  effective_throughput = prev.org_twin.available_capacity × prev.gate_pass_rate
  
  # Queue dynamics
  queue_inflow = new_workflows_per_day × dt
  queue_outflow = effective_throughput × dt
  next.work_queue_depth = prev.work_queue_depth + queue_inflow - queue_outflow
  
  # Lead time responds to queue depth (queuing theory)
  IF next.work_queue_depth > 0:
    queuing_delay = next.work_queue_depth / effective_throughput
    next.avg_lead_time_hours = prev.cycle_time_hours + queuing_delay × 24
  
  # Gate pass rate degrades under overload (quality pressure)
  IF prev.org_twin.utilization_pct > 0.90:
    overload_quality_penalty = (prev.org_twin.utilization_pct - 0.90) × 0.3
    next.gate_pass_rate = prev.gate_pass_rate × (1 - overload_quality_penalty)
```

#### Delivery Dynamics

```
delivery_dynamics(next, prev, dt):
  # Sprint execution: points completed per day
  effective_velocity = prev.delivery_twin.velocity_stats.avg_velocity_3_sprints
  effective_velocity *= capacity_factor(t)  # Adjusted for ramps, holidays
  
  points_completed = effective_velocity × dt
  
  # Update roadmap item progress
  FOR EACH in_progress_item:
    item.percent_complete += (points_completed / item.estimated_effort_points) × item.allocation_pct
    
    IF item.percent_complete >= 1.0:
      item.actual_completion = current_sim_time
      item.status = "COMPLETE"
  
  # Dependency cascade
  FOR EACH newly_completed_item:
    FOR EACH item_that_depended_on it:
      IF all_deps_complete(item):
        item.status = "IN_PROGRESS"
        item.actual_start = current_sim_time
```

#### Runtime Dynamics

```
runtime_dynamics(next, prev, dt):
  # Session count tracks workflow count
  next.active_sessions = prev.workflow_twin.active_workflows × sessions_per_workflow_ratio
  
  # Context pressure: more sessions = more compression events
  IF next.active_sessions > baseline_sessions:
    pressure_factor = next.active_sessions / baseline_sessions
    next.context_pressure_index = MIN(1.0, prev.context_pressure_index × pressure_factor)
  
  # Tool budget: higher throughput = higher tool call rate
  next.tool_calls_per_hour = prev.tool_calls_per_hour × (next.active_sessions / prev.active_sessions)
  
  # Recovery rate: overloaded system produces more failures → more recoveries
  IF prev.org_twin.utilization_pct > 0.90:
    next.recovery_overhead_pct = prev.recovery_overhead_pct × 1.2
```

### PHASE 05: Compute Distributions

```
FOR EACH objective:
  values = [results_accumulator[i][objective_id] for i in 1..iterations]
  
  distribution = {
    p10: percentile(values, 10),
    p25: percentile(values, 25),
    p50: percentile(values, 50),
    p75: percentile(values, 75),
    p90: percentile(values, 90),
    mean: mean(values),
    std_dev: std_dev(values),
    skewness: skewness(values),
    threshold_breach_probability: fraction_exceeding_threshold(values, objective.threshold_value)
  }
```

### PHASE 06: Extract Findings

```
findings = []

# Finding 1: Threshold breaches
FOR EACH objective:
  IF distribution.threshold_breach_probability > 0.50:
    ADD finding: "HIGH probability of [metric] exceeding [threshold]"
  IF distribution.threshold_breach_probability > 0.20:
    ADD finding: "MEDIUM probability of threshold breach"

# Finding 2: Nonlinearities
FOR EACH metric pair with correlation:
  IF correlation changes sign or magnitude dramatically across range:
    ADD finding: "Nonlinear interaction between [A] and [B]"

# Finding 3: Surprises (distribution p50 deviates > 20% from naive estimate)
FOR EACH outcome:
  naive_estimate = baseline_value + expected_perturbation_effect
  IF ABS(p50 - naive_estimate) / naive_estimate > 0.20:
    ADD finding (surprise_level: "VERY_SURPRISING")
```

### PHASE 07: Generate Recommendations

```
recommendations = []

FOR EACH critical finding or high-probability risk:
  recommendation = {
    action: derive_action_from_finding(finding),
    expected_impact: compute_counterfactual_impact(finding),
    urgency: classify_urgency(finding.time_to_impact_days),
    confidence: finding.confidence
  }
  recommendations.append(recommendation)

SORT recommendations by: impact × confidence DESC
LIMIT to top 5 recommendations
```

### PHASE 08: Write and Return Result

```
result = SimulationResult (see enterprise-modeling/simulation-results-model.md)
WRITE: memory/digital-twins/simulation-results/[result-id].yaml
UPDATE: memory/digital-twins/simulation-index.yaml

LOG: simulation_completed event
RETURN: result to caller
```

---

## Perturbation Application

How each perturbation type modifies twin state:

```
apply_perturbation(twin_state, perturbation, sampled_value):
  
  SWITCH perturbation.change_type:
    "set":     twin_state[path] = sampled_value
    "delta":   twin_state[path] += sampled_value
    "multiply": twin_state[path] *= sampled_value
    "inject":  inject_event(twin_state, perturbation.perturbation_type, sampled_value)
    "add":     twin_state[list_path].append(sampled_value)
    "remove":  twin_state[list_path].remove(target_id)
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`
**Calls:**
- `simulation-systems/org-simulator.md` → org-specific dynamics
- `simulation-systems/workflow-simulator.md` → workflow dynamics
- `simulation-systems/staffing-simulator.md` → staffing perturbations
- `simulation-systems/governance-simulator.md` → governance perturbations
- `simulation-systems/runtime-load-simulator.md` → runtime dynamics

**Writes to:**
- `memory/digital-twins/simulation-results/[result-id].yaml`
- `memory/digital-twins/simulation-snapshots/[sim-id]/`
- `memory/digital-twins/simulation-index.yaml`
