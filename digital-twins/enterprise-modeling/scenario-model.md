# Scenario Model

**System ID:** `scenario-model`
**Role:** Defines the schema for simulation scenarios and perturbations — the structured way to express "what if" questions so any simulation system can execute them consistently
**Used by:** All simulation systems in `simulation-systems/`, all forecasting systems

---

## Purpose

Every simulation starts with a scenario: a structured description of what has changed, what is being tested, and what outcomes we care about. The scenario model ensures any simulation request can be interpreted and executed deterministically by any simulation system.

---

## Scenario Schema

```yaml
Scenario:
  scenario_id: string                # "scen-[uuid]"
  created_by: string                 # agent-id or human
  created_at: datetime
  scenario_name: string              # Short descriptive name
  description: string                # One paragraph: what is being tested and why
  
  # What kind of scenario this is
  scenario_class: "staffing | governance | roadmap | delivery | runtime | risk | what_if | stress_test"
  
  # Which twins this scenario requires
  required_twins: [string]           # subset of [org-twin, workflow-twin, delivery-twin, runtime-twin]
  
  # The baseline: snapshot of twin state to start from
  baseline:
    baseline_type: "current | historical | hypothetical"
    snapshot_timestamp: datetime | null   # For historical baselines
    baseline_description: string
  
  # The perturbations: what changes from baseline
  perturbations: [Perturbation]
  
  # What to measure (success/failure criteria)
  objectives: [SimulationObjective]
  
  # Simulation execution config
  execution_config: SimulationConfig
  
  # Status
  status: "DRAFT | QUEUED | RUNNING | COMPLETE | FAILED"
  result_id: string | null
```

---

## Perturbation Schema

A perturbation is a single change applied to a twin state:

```yaml
Perturbation:
  perturbation_id: string
  perturbation_type: string          # See perturbation catalog below
  
  # What twin dimension this affects
  target_twin: string                # org-twin | workflow-twin | delivery-twin | runtime-twin
  target_dimension: string          # Specific field or model domain
  
  # The change
  change_type: "set | delta | multiply | inject | remove | add"
  change_value: any                  # Depends on perturbation_type
  
  # When this perturbation takes effect
  onset: "immediate | scheduled"
  onset_time_days: integer           # Days from simulation start (0 = immediate)
  duration: "permanent | temporary"
  duration_days: integer | null      # For temporary perturbations
  
  # Uncertainty (perturbation itself is uncertain)
  probability: float                 # 0.0-1.0 — probability this perturbation actually occurs
  uncertainty:
    change_value_std_dev: float | null  # Uncertainty in the magnitude
    onset_time_std_dev_days: float | null
  
  description: string               # Human-readable explanation
```

---

## Perturbation Catalog

### Organizational Perturbations

```yaml
# Add N agents of a specific role to a unit
staffing_add_agents:
  target_twin: org-twin
  parameters:
    unit_id: string
    agent_role: string
    count: integer
    ramp_up_weeks: integer           # Default 4

# Remove an agent or reduce team capacity
staffing_reduce_capacity:
  target_twin: org-twin
  parameters:
    scope: "agent | team | org"
    target_id: string
    reduction_factor: float          # 0.5 = lose 50% of capacity
    reason: "attrition | leave | reorg | hiring_freeze"

# Restructure: move agents between teams
org_restructure:
  target_twin: org-twin
  parameters:
    moves: [{ agent_id: string, from_unit: string, to_unit: string }]
    reorg_overhead_weeks: integer    # Productivity dip during reorg

# Change governance policy
governance_change:
  target_twin: org-twin
  parameters:
    policy_dimension: "gate_strictness | approval_threshold | escalation_routing"
    change_type: "increase | decrease | remove | add"
    magnitude: float
    applies_to: "all | [specific workflow types]"
```

### Workflow Perturbations

```yaml
# Increase workflow volume
volume_increase:
  target_twin: workflow-twin
  parameters:
    volume_multiplier: float         # 1.5 = 50% more workflows
    workflow_type_mix: map | null    # If null, same mix as current

# Degrade gate quality (tighter criteria)
gate_strictness_increase:
  target_twin: workflow-twin
  parameters:
    gate_type: "checklist | schema | agent_review | human_review | all"
    pass_rate_delta: float           # Negative = fewer pass (e.g., -0.10)

# Inject step failures
step_failure_injection:
  target_twin: workflow-twin
  parameters:
    step_type: string                # Which step type to inject failures into
    failure_rate: float              # Fraction of steps that fail
    failure_class: string            # F1-F9 failure class to inject

# Reduce parallel execution capacity
parallel_cap:
  target_twin: workflow-twin
  parameters:
    max_parallel_steps: integer
    applies_to: string               # "all" or specific agent types
```

### Delivery Perturbations

```yaml
# Slip a key dependency
dependency_delay:
  target_twin: delivery-twin
  parameters:
    item_id: string                  # Item that delays
    delay_days: integer
    cascade: boolean                 # Whether delay cascades to dependents

# Add scope to a sprint
scope_addition:
  target_twin: delivery-twin
  parameters:
    sprint_id: string
    additional_points: integer
    item_descriptions: [string]

# Cut scope from a release
scope_cut:
  target_twin: delivery-twin
  parameters:
    release_id: string
    items_to_cut: [string]           # item_ids to remove from release

# Change velocity
velocity_change:
  target_twin: delivery-twin
  parameters:
    team: string
    velocity_factor: float           # 0.8 = 20% slower
    reason: "hiring | attrition | reorg | tech_debt | complexity"

# Resource constraint
resource_constraint:
  target_twin: delivery-twin
  parameters:
    team: string
    capacity_reduction_pct: float    # 0.30 = 30% less capacity
    duration_sprints: integer
```

### Runtime Perturbations

```yaml
# Scale concurrent workflow load
concurrent_load_increase:
  target_twin: runtime-twin
  parameters:
    additional_workflows: integer
    workflow_types: [string] | null

# Increase context pressure (larger, more complex workflows)
context_pressure_increase:
  target_twin: runtime-twin
  parameters:
    token_usage_factor: float        # 1.3 = 30% more tokens per session

# Degrade tool performance
tool_latency_degradation:
  target_twin: runtime-twin
  parameters:
    tool_category: string
    latency_factor: float            # 3.0 = 3× slower
    failure_rate_injection: float    # 0.05 = 5% tool call failure rate

# Increase recovery frequency
recovery_rate_increase:
  target_twin: runtime-twin
  parameters:
    rate_multiplier: float           # 2.0 = 2× more recoveries
    recovery_class_mix: map | null   # Which recovery types increase
```

---

## SimulationObjective Schema

What the simulation should measure and report:

```yaml
SimulationObjective:
  objective_id: string
  metric_name: string                # What metric to track
  metric_location: string            # Twin + field path: "org-twin.derived_metrics.org_health_score"
  
  # Threshold for flagging
  threshold_type: "min | max | range"
  threshold_value: float | [float, float]  # For range: [min, max]
  threshold_severity: "INFO | WARNING | CRITICAL"
  
  # Reporting
  report_distribution: boolean       # Include p10/p50/p90 in output
  report_trend: boolean              # Include trajectory over simulation time
  
  description: string               # Why this metric matters for this scenario
```

---

## SimulationConfig Schema

```yaml
SimulationConfig:
  simulation_type: "monte_carlo | scenario_analysis | sensitivity_analysis | stress_test"
  
  # Monte Carlo specific
  monte_carlo:
    iterations: integer              # Default 1000, max 10000
    seed: integer | null            # For reproducible results
    sampling_method: "random | quasi_random | latin_hypercube"
    # latin_hypercube: better coverage of parameter space with fewer iterations
  
  # Time horizon
  time_horizon_days: integer         # How far forward to simulate
  time_step_days: float              # Granularity of simulation steps
  
  # Output
  confidence_levels: [float]         # e.g., [0.10, 0.25, 0.50, 0.75, 0.90]
  output_format: "full | summary | executive | delta_only"
  # delta_only: only report metrics that changed significantly from baseline
  
  # Sensitivity analysis
  sensitivity:
    enabled: boolean
    vary_parameters: [string]        # Which perturbation parameters to vary
    variation_range: float           # ± this fraction from nominal value
    steps: integer                   # Number of values to test per parameter
```

---

## Scenario Library (Predefined Scenarios)

Common scenarios available as templates:

| Scenario Name | Class | Description | Twins Required |
|--------------|-------|-------------|----------------|
| `hiring_freeze_90d` | staffing | 90-day hiring freeze — what slips? | org, delivery |
| `key_agent_departure` | staffing | Critical agent leaves — coverage gaps | org, workflow |
| `double_throughput_target` | workflow | Double workflow volume — does system scale? | org, workflow, runtime |
| `gate_quality_increase_20pct` | governance | All gates 20% stricter — cycle time impact | workflow, delivery |
| `release_acceleration_2weeks` | roadmap | Move release 2 weeks earlier — what risks? | delivery |
| `dependency_cascade_failure` | roadmap | Key dependency slips 3 weeks — domino effect | delivery |
| `context_saturation_test` | runtime | Simulate near-maximum concurrent sessions | runtime, workflow |
| `governance_relaxation` | governance | Remove one gate type — quality vs. speed | workflow, org |
| `reorg_two_teams` | staffing | Merge two teams — transition overhead | org, workflow, delivery |
| `sprint_scope_creep_trend` | delivery | 15% scope creep per sprint trend continues | delivery |

---

## Integration

**Written by:**
- Human or orchestrator creating simulation requests
- `predictive-intelligence/prediction-engine.md` — auto-generates scenarios for predictions

**Read by:**
- `simulation-systems/simulation-engine.md` → executes scenarios
- All simulation subsystems → parse perturbations for their twin
- `forecasting/roadmap-forecaster.md` → uses delivery scenarios
- `forecasting/release-risk-simulator.md` → uses risk scenarios
