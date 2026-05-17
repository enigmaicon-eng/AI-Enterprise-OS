# Workflow Simulator

**System ID:** `workflow-simulator`
**Role:** Simulates workflow execution under modified conditions — volume changes, quality perturbations, resource constraints, and failure injection — producing throughput, quality, and flow efficiency forecasts
**Handles:** Scenarios with class: "workflow_simulation | volume_stress | quality_impact"

---

## Purpose

The workflow simulator models how the end-to-end workflow execution system responds to changes in volume, quality requirements, resource availability, and failure rates. It uses the workflow-twin state as baseline and runs dynamics over a defined time horizon to show throughput trajectories, queue buildup patterns, and quality degradation curves.

---

## Simulation Scenarios

### Scenario 01: Volume Increase

What happens when more workflows enter the system simultaneously?

```
INPUT:
  volume_multiplier: float          # 1.5 = 50% more workflows
  ramp_type: "immediate | gradual"  # immediate spike vs. gradual growth
  ramp_days: integer                # for gradual: over how many days
  workflow_mix: map | null          # null = same mix as current

MODEL:
  # Arrival rate increases
  new_arrival_rate = baseline_arrival_rate × volume_multiplier
  
  # Queue dynamics (M/G/1 queue model)
  utilization = new_arrival_rate / service_rate
  
  IF utilization < 0.85:
    # Queue stable — steady-state effects
    avg_queue_length = utilization² / (1 - utilization)
    avg_wait_hours = avg_queue_length / service_rate × 24
    new_lead_time = baseline_lead_time + avg_wait_hours
    throughput = new_arrival_rate  # All workflows complete
  
  IF utilization >= 0.85 and < 1.0:
    # Queue stressed — non-linear effects
    congestion_factor = 1 + (utilization - 0.85) × 6  # Steep increase in wait
    new_lead_time = baseline_lead_time × congestion_factor
    throughput = service_rate  # Throughput plateaus at service capacity
  
  IF utilization >= 1.0:
    # Queue unstable — backlog grows indefinitely
    backlog_growth_rate = (new_arrival_rate - service_rate) × per_day
    throughput = service_rate  # Cannot process more than service capacity
    → Flag: QUEUE_SATURATION
```

### Scenario 02: Gate Strictness Change

What happens when gate pass rates change (up or down)?

```
INPUT:
  gate_type: string
  pass_rate_delta: float            # Negative = stricter

MODEL:
  new_pass_rate = baseline_pass_rate + pass_rate_delta
  new_avg_cycles = 1 / new_pass_rate
  
  # Per-gate overhead change
  delta_overhead_per_gate = (new_avg_cycles - baseline_avg_cycles) × baseline_cycle_duration
  
  # Total workflow impact (may affect multiple gates)
  gates_affected_per_workflow = count_gates_of_type(gate_type)
  total_cycle_time_increase = delta_overhead_per_gate × gates_affected_per_workflow
  
  # Throughput impact (more time per workflow = fewer workflows complete per unit time)
  new_throughput = baseline_throughput × (baseline_cycle_time / new_cycle_time)
  
  # Quality improvement (more gate cycles = more refinement)
  quality_improvement = (new_avg_cycles - baseline_avg_cycles) × 0.05  # 5% per extra cycle
```

### Scenario 03: Step Failure Injection

What happens if a specific step type starts failing at a given rate?

```
INPUT:
  step_type: string                 # Which step fails
  failure_rate: float               # Fraction of steps that hit a failure class
  failure_class: "F1 | F2 | F3 | F4 | F5 | F6 | F7 | F8 | F9"
  
MODEL:
  # Steps that fail require recovery
  recovery_overhead_hours = baseline_recovery_time[failure_class]
  
  affected_steps_per_workflow = avg_steps_of_type(step_type)
  
  expected_failures_per_workflow = affected_steps_per_workflow × failure_rate
  recovery_overhead_per_workflow = expected_failures_per_workflow × recovery_overhead_hours
  
  new_cycle_time = baseline_cycle_time + recovery_overhead_per_workflow
  
  # Cascading effects
  IF failure_class in [F6, F7, F8]:  # Decision conflict, runaway, state corrupt
    # These failures can cascade to block parallel tracks
    cascade_probability = 0.30 if failure_class == F6 else 0.15
    additional_workflow_delay = cascade_probability × cascade_delay_hours
    new_cycle_time += additional_workflow_delay
  
  # Gate fail rate increases (failures → more gate retries)
  new_gate_fail_rate = baseline_gate_fail_rate + failure_rate × failure_gate_correlation[failure_class]
```

### Scenario 04: Parallel Execution Cap

What happens if parallel step execution is limited?

```
INPUT:
  max_parallel_steps: integer       # Maximum concurrent steps across all workflows

MODEL:
  # Effective service rate is capped
  effective_parallelism = MIN(actual_parallel_steps, max_parallel_steps)
  
  IF effective_parallelism < actual_parallel_steps:
    # Some parallel steps must serialize
    serialization_factor = actual_parallel_steps / effective_parallelism
    
    # For steps that could have been parallel but now serialize:
    serialized_steps_per_workflow = steps_that_could_parallelize × (1 - effective_parallelism/actual_parallel_steps)
    additional_sequential_time = serialized_steps_per_workflow × avg_step_duration_hours
    
    new_cycle_time = baseline_cycle_time + additional_sequential_time
    new_throughput = baseline_throughput × (baseline_cycle_time / new_cycle_time)
```

---

## Flow Model: Little's Law Integration

Little's Law: `L = λ × W`
- L = avg items in system (WIP)
- λ = throughput rate
- W = avg time in system (lead time)

```
# If we know any two, we can compute the third:
# If volume increases (λ↑) and throughput stays constant (L stays constant):
  new_lead_time = L / new_lambda
  # → Lead time decreases? No — only if capacity also increases.
  
# If volume increases (λ↑) and capacity doesn't change (service rate constant):
  new_WIP = new_lambda / service_rate  (approaches 1 as saturation approaches)
  new_lead_time = new_WIP / service_rate
  # → Both WIP and lead time increase
  
# This is why volume increases cause non-linear lead time growth near capacity
```

---

## Workflow Simulation Output

```yaml
WorkflowSimulationResult:
  # Throughput trajectory
  throughput_trajectory:
    baseline_completions_per_day: float
    day_30_completions_p50: float
    day_90_completions_p50: float
    peak_throughput_p50: float
    min_throughput_p50: float
    throughput_change_pct: float
  
  # Queue and WIP
  queue_dynamics:
    baseline_queue_depth: integer
    day_30_queue_depth_p50: integer
    day_90_queue_depth_p50: integer
    queue_saturation_probability: float
    queue_saturation_onset_days: integer | null
  
  # Lead time and cycle time
  flow_metrics:
    baseline_lead_time_days: float
    new_lead_time_days_p50: float
    lead_time_change_pct: float
    baseline_flow_efficiency: float
    new_flow_efficiency_p50: float
    flow_efficiency_change_pct: float
  
  # Quality metrics
  quality_impact:
    gate_pass_rate_change: float
    avg_gate_cycles_change: float
    quality_score_change: float
    failure_rate_change: float
  
  # WIP health
  wip_assessment:
    recommended_wip_limit: integer
    new_wip_count_p50: integer
    wip_over_limit_probability: float
  
  # Net assessment
  workflow_system_stress: "LOW | MEDIUM | HIGH | CRITICAL"
  throughput_adequacy: "OVERCAPACITY | ADEQUATE | STRESSED | SATURATED"
  recommendation: string
```

---

## Integration

**Called by:** `simulation-systems/simulation-engine.md` (directly), `simulation-systems/org-simulator.md`
**Reads from:**
- `digital-twins/workflow-twin.md` (snapshot)
- `enterprise-modeling/workflow-model.md` (flow models, formulas)

**Returns:** `WorkflowSimulationResult`
