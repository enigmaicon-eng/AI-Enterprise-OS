# Workflow State Model

**System ID:** `workflow-model`
**Role:** Canonical schemas and computation formulas for all workflow execution state data — shared definitions for throughput, quality, flow efficiency, and failure modeling
**Used by:** `digital-twins/workflow-twin.md`, `simulation-systems/workflow-simulator.md`, `forecasting/delivery-forecaster.md`

---

## Core Entity Schemas

### WorkflowExecution

```yaml
WorkflowExecution:
  workflow_id: string
  workflow_type: string              # feature_development | discovery | architecture_review | etc.
  
  # Lifecycle
  status: "RUNNING | SUSPENDED | BLOCKED | ESCALATED | COMPLETE | FAILED | CANCELLED"
  priority: "CRITICAL | HIGH | MEDIUM | LOW"
  started_at: datetime
  completed_at: datetime | null
  
  # Progress
  steps_total: integer
  steps_complete: integer
  steps_in_progress: integer
  steps_blocked: integer
  current_phase: string
  current_step_id: string
  
  # Timing
  elapsed_hours: float
  active_hours: float                # Time actually executing (excluding wait)
  wait_hours: float                  # Time blocked, suspended, escalated
  lead_time_hours: float             # Total from start to now (or completion)
  cycle_time_hours: float            # active_hours — actual execution time
  flow_efficiency: float             # cycle_time / lead_time
  
  # Quality
  gate_verdicts: { [step_id]: "PASS | FAIL | PENDING" }
  gate_pass_rate: float              # steps_gate_passed / steps_attempted
  gate_retry_count: integer          # total retry attempts across all gates
  escalation_count: integer
  rollback_count: integer
  
  # Failure tracking
  failure_class: string | null       # F1-F9 if failed
  recovery_attempts: integer
```

### StepMetrics

Per-step performance profile (computed from historical executions):

```yaml
StepMetrics:
  step_id: string
  workflow_type: string
  step_name: string
  gate_type: "checklist | schema | agent_review | human_review"
  
  # Duration distribution
  duration_minutes:
    avg: float
    p50: float
    p90: float                       # 90th percentile — identifies tail cases
    std_dev: float
    min_observed: float
    max_observed: float
  
  # Quality
  gate_pass_rate: float              # First-attempt pass rate
  first_pass_rate: float             # Same — synonymous
  avg_gate_cycles: float             # Average retry count
  max_gate_cycles_observed: integer
  
  # Failure patterns
  failure_rate: float
  dominant_failure_class: string | null
  top_failure_criteria: [string]
  
  # Agent performance on this step
  best_performing_agent: string | null
  agent_performance_variance: float  # How much performance varies across agents
```

### FlowMetrics

Aggregate flow metrics for a workflow type:

```yaml
FlowMetrics:
  workflow_type: string
  window_days: integer               # Metrics computed over this window
  sample_count: integer              # Number of workflow executions in sample
  
  # Lead time
  lead_time_days:
    avg: float
    p50: float
    p90: float
    std_dev: float
  
  # Cycle time
  cycle_time_hours:
    avg: float
    p50: float
    p90: float
  
  # Wait time (lead - cycle)
  wait_time_hours:
    avg: float
    pct_of_lead_time: float          # What fraction of time is wait
  
  # Flow efficiency
  flow_efficiency_ratio:
    avg: float                       # cycle / lead — higher = better
    trend: "IMPROVING | STABLE | DECLINING"
  
  # Throughput
  completions_per_day: float
  completions_per_week: float
  throughput_trend: "INCREASING | STABLE | DECREASING"
  
  # Gate performance
  overall_gate_pass_rate: float
  gates_per_workflow_avg: float
  total_gate_cycles_avg: float       # Total retries across all gates, avg per workflow
```

---

## Simulation Parameters

Parameters the workflow-simulator uses to run Monte Carlo:

```yaml
SimulationParams_Workflow:
  base_metrics: FlowMetrics         # Historical baseline to perturb
  
  # Input perturbations
  volume_multiplier: float           # 1.0 = no change, 2.0 = double volume
  gate_pass_rate_delta: float        # -0.10 = 10% fewer gates pass on first try
  step_duration_factor: float        # 1.2 = steps take 20% longer
  agent_capacity_factor: float       # 0.8 = 20% less capacity available
  failure_rate_injection: float      # 0.05 = 5% of steps fail with F-class failures
  
  # Simulation config
  iterations: integer                # Monte Carlo runs (default 1000)
  time_horizon_days: integer         # Forecast window
  confidence_levels: [float]         # e.g., [0.10, 0.50, 0.90]
```

---

## Key Formulas

### Flow Efficiency

```
flow_efficiency = cycle_time_hours / lead_time_hours

# Interpretation:
#   > 0.80: Excellent — most time is active execution
#   0.60-0.80: Good — some wait time but manageable
#   0.40-0.60: Poor — significant wait time
#   < 0.40: Critical — workflow spends most time waiting
```

### Throughput Rate

```
throughput_rate = completed_workflows / observation_window_hours

# Little's Law relationship:
# avg_wip = throughput_rate × avg_lead_time_hours
# → If WIP increases without throughput increasing, lead time increases proportionally
```

### Gate Efficiency

```
gate_efficiency = first_pass_rate / avg_gate_cycles

# A step with 0.90 first_pass_rate and 1.05 avg_cycles is more efficient
# than a step with 0.70 first_pass_rate and 1.5 avg_cycles
```

### Failure Impact Score

```
failure_impact = failure_rate × avg_recovery_time_hours × cascade_probability

# cascade_probability = probability that this failure triggers related failures
# Typical values:
#   F1 (missing artifact): 0.1 — usually self-contained
#   F6 (decision conflict): 0.7 — often triggers rollback cascade
#   F7 (runaway): 0.9 — almost always causes downstream issues
```

---

## Capacity-Throughput Model

For simulation: how does capacity change affect throughput?

```
# Simple model (assumes queue is not the bottleneck):
new_throughput = baseline_throughput × (new_capacity / baseline_capacity)

# Congestion model (when near-capacity):
IF utilization_pct > 0.85:
  # Queuing theory: throughput degrades faster than capacity at high utilization
  effective_throughput_factor = (1 - utilization_pct) / (1 - 0.85) × 0.15 + 0.85
  # Simplified: effective capacity is reduced by congestion overhead
```

---

## WIP Limit Model

Work-In-Progress (WIP) limits for healthy flow:

```
recommended_wip_limit = team_capacity_units × 1.5

# Setting WIP above this causes:
#   - Lead time increase (Little's Law)
#   - Context switching overhead
#   - Quality degradation (less focus per workflow)
#   - Higher gate fail rates (more parallel = less attention per gate)

# Optimal WIP range: [0.8, 1.2] × recommended_wip_limit
```

---

## Gate Performance Model

How gate strictness changes affect quality and throughput:

```
# Gate strictness increase scenario:
# IF gate_pass_rate decreases by Δ:
  new_avg_gate_cycles = 1 / new_gate_pass_rate
  cycle_time_increase = (new_avg_gate_cycles - old_avg_gate_cycles) × avg_retry_duration_hours
  
  # Quality effect (more cycles = more refinement before passing):
  quality_improvement_factor = 1 + (new_avg_gate_cycles - old_avg_gate_cycles) × 0.05
  # Assumption: each additional review cycle improves artifact quality ~5%
```

---

## Integration

**Used by:**
- `digital-twins/workflow-twin.md` → state storage schemas
- `simulation-systems/workflow-simulator.md` → simulation formulas
- `simulation-systems/orchestration-simulator.md` → load models
- `forecasting/delivery-forecaster.md` → throughput forecasting
- `predictive-intelligence/operational-forecaster.md` → trend projections
- `predictive-intelligence/bottleneck-predictor.md` → bottleneck models
