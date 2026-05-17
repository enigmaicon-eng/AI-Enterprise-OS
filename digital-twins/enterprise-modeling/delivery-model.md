# Delivery State Model

**System ID:** `delivery-model`
**Role:** Canonical schemas and computation formulas for delivery pipeline state — roadmap items, sprint execution, dependency graphs, and release readiness modeling
**Used by:** `digital-twins/delivery-twin.md`, `forecasting/roadmap-forecaster.md`, `forecasting/dependency-simulator.md`, `forecasting/release-risk-simulator.md`

---

## Core Entity Schemas

### RoadmapItem

```yaml
RoadmapItem:
  item_id: string
  title: string
  description: string
  owner_team: string                 # org-id responsible for delivery
  item_type: "feature | initiative | milestone | epic | tech_debt"
  
  # Size and effort
  estimated_effort_points: integer
  size_classification: "XS | S | M | L | XL | XXL"
  # XS: 1-2pts, S: 3-5pts, M: 8-13pts, L: 20-40pts, XL: 40-80pts, XXL: >80pts
  
  # Dependencies
  depends_on: [string]               # item_ids that must complete before this can start
  enables: [string]                  # item_ids that cannot start until this completes
  dependency_type: "strict | soft"   # strict = hard blocker; soft = preferred ordering
  
  # Planning
  target_release: string | null
  sprint_assignment: string | null
  planned_start: datetime | null
  planned_completion: datetime | null
  
  # Actuals
  actual_start: datetime | null
  actual_completion: datetime | null
  status: "NOT_STARTED | IN_PROGRESS | COMPLETE | BLOCKED | CANCELLED | DEFERRED"
  
  # Progress (for IN_PROGRESS)
  percent_complete: float            # 0.0 to 1.0
  workflow_ids: [string]             # OS workflow IDs executing this item
  gate_status: { [gate_name]: "PASSED | PENDING | FAILED | NOT_REACHED" }
  
  # Risk
  risk_flags: [string]
  at_risk: boolean
  slip_probability: float            # Probability of missing planned_completion
  expected_slip_days: float          # Expected slip if at risk (0 if not at risk)
```

### SprintRecord

```yaml
SprintRecord:
  sprint_id: string
  sprint_number: integer
  team: string                       # org-id
  
  # Calendar
  start_date: datetime
  end_date: datetime
  duration_days: integer
  working_days: integer              # Excludes weekends, holidays
  
  # Planned scope
  planned_items: [string]            # item_ids committed to this sprint
  planned_points: integer
  
  # Actuals
  completed_items: [string]
  completed_points: integer
  carried_over_items: [string]
  carried_over_points: integer
  
  # Unplanned work
  unplanned_items_added: [string]
  unplanned_points_added: integer
  
  # Derived
  velocity: float                    # completed_points / working_days
  carry_over_rate: float             # carried_over_points / planned_points
  scope_creep_rate: float            # unplanned_points / planned_points
  sprint_success: boolean            # completed_points >= planned_points × 0.90
  
  # Notes
  retrospective_id: string | null
  notes: string
```

### DependencyEdge

```yaml
DependencyEdge:
  from_item_id: string               # Prerequisite
  to_item_id: string                 # Item that depends on prerequisite
  dependency_type: "strict | soft"
  
  # Risk assessment
  at_risk: boolean
  delay_probability: float           # Probability that from_item delays to_item
  expected_delay_days: float
  delay_source: "schedule_slip | scope_creep | resource_constraint | external"
```

### Release

```yaml
Release:
  release_id: string
  release_name: string               # e.g., "v2.4.0"
  target_date: datetime
  release_type: "major | minor | patch | hotfix"
  
  # Scope
  items: [string]                    # item_ids in this release
  core_items: [string]               # Must-have items (release blocked if these miss)
  nice_to_have_items: [string]       # Can defer if needed
  
  # Quality gates
  gates_required:
    - gate_name: string
    - gate_status: "PASSED | PENDING | FAILED | NOT_REACHED | WAIVED"
    - gate_owner: string
    - gate_deadline: datetime | null
  
  # Readiness
  readiness_score: integer           # 0-100
  on_time_probability: float
  full_scope_probability: float      # Probability of shipping all core_items
  go_no_go_recommendation: "GO | CONDITIONAL_GO | NO_GO | INSUFFICIENT_DATA"
  risk_factors: [string]
```

---

## Velocity Model

How sprint velocity is computed and used for forecasting:

### Velocity Computation

```
sprint_velocity = completed_points / working_days

# Note: Use completed_points, not planned_points
# Planned points inflate velocity when carry-over occurs
```

### Adjusted Velocity (for forecasting)

```
# Adjustments applied before forecasting:
adj_velocity = base_velocity
              × capacity_adjustment_factor    # for planned absences/holidays
              × scope_complexity_factor       # for items larger/smaller than historical avg
              × team_maturity_factor          # new teams ramp up over 3-6 sprints

# capacity_adjustment_factor:
#   = working_days_in_forecast_sprint / avg_working_days_in_historical_sprints

# scope_complexity_factor:
#   = avg_item_size_in_forecast / avg_item_size_in_historical
#   (larger items typically have lower velocity due to coordination overhead)
```

### Velocity Distribution

For Monte Carlo forecasting, velocity is not a point estimate — it's a distribution:

```yaml
VelocityDistribution:
  historical_velocities: [float]     # Last N sprints' velocities
  
  # Statistical parameters
  mean_velocity: float
  std_dev_velocity: float
  min_velocity: float                # p10 — pessimistic
  max_velocity: float                # p90 — optimistic
  
  # Distribution type
  distribution: "normal | log_normal | historical_sampling"
  # normal: use mean + std_dev for sampling
  # log_normal: better for right-skewed velocity (rare high-velocity sprints)
  # historical_sampling: directly sample from historical_velocities (most accurate)
  
  # Trend adjustment
  trend: "IMPROVING | STABLE | DECLINING"
  trend_factor: float                # 0.95-1.05 per sprint — multiplier for trend
```

---

## Dependency Graph Model

### Critical Path

```
CRITICAL PATH ALGORITHM:
  1. Build DAG from all dependency edges
  2. Assign duration estimate to each item (effort_points / team_velocity)
  3. Forward pass: compute earliest start/end for each item
  4. Backward pass: compute latest start/end for each item
  5. Slack = latest_start - earliest_start
  6. Critical path = all items where slack == 0

CRITICAL PATH PROPERTIES:
  - Any delay on a critical path item delays the entire release
  - Items not on critical path have slack (can slip without affecting release date)
  - Multiple critical paths can exist (equally constrained sequences)
```

### Dependency Risk Scoring

```
dependency_risk_score =
  SUM(
    delay_probability × expected_delay_days × on_critical_path_weight
    FOR EACH dependency_edge WHERE at_risk == true
  )

WHERE:
  on_critical_path_weight = 2.0 if on critical path, else 1.0
```

---

## Release Readiness Model

### Readiness Score (0-100)

```
readiness_score = (
  scope_complete_score   × 0.40 +
  quality_gate_score     × 0.30 +
  dependency_clear_score × 0.20 +
  team_confidence_score  × 0.10
)

WHERE:
  scope_complete_score = (core_items_complete / total_core_items) × 100
  
  quality_gate_score = (gates_passed / total_required_gates) × 100
  
  dependency_clear_score = 100 × (1 - fraction_of_core_items_with_blocked_deps)
  
  team_confidence_score = derived from team's recent velocity vs. plan adherence
```

### Go/No-Go Recommendation

```
IF readiness_score >= 90 AND on_time_probability >= 0.80:
  → "GO"

IF readiness_score >= 75 AND on_time_probability >= 0.60:
  → "CONDITIONAL_GO" with conditions listed

IF readiness_score >= 60 AND on_time_probability >= 0.40:
  → "NO_GO" — recommend postponing or descoping

IF readiness_score < 60 OR on_time_probability < 0.40:
  → "NO_GO" — significant risks need resolution

IF data insufficient (< 3 sprints of history, < 50% scope defined):
  → "INSUFFICIENT_DATA"
```

---

## Monte Carlo Forecast Parameters

```yaml
MonteCarloParams_Delivery:
  # Velocity sampling
  velocity_distribution: VelocityDistribution
  
  # Scope uncertainty
  scope_uncertainty_pct: float       # Fraction of items with undefined effort (±uncertainty)
  
  # Dependency uncertainty
  dependency_delay_probability: float  # Default probability any dep delays if at_risk
  dependency_delay_days_distribution:
    mean: float
    std_dev: float
  
  # External uncertainty
  holiday_calendar: [datetime]       # Planned non-working days
  planned_absences: [{ team: string, dates: [datetime], capacity_reduction: float }]
  
  # Simulation
  iterations: integer                # Default 10000 for delivery forecasting
  confidence_levels: [0.10, 0.25, 0.50, 0.75, 0.90]
```

---

## Integration

**Used by:**
- `digital-twins/delivery-twin.md` → state schema definitions
- `forecasting/roadmap-forecaster.md` → Monte Carlo delivery forecasting
- `forecasting/dependency-simulator.md` → critical path and dependency risk
- `forecasting/release-risk-simulator.md` → readiness scoring
- `forecasting/delivery-forecaster.md` → sprint-level forecasting
- `predictive-intelligence/operational-forecaster.md` → delivery trend prediction
