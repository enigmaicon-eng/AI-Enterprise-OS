# Roadmap Forecaster

**System ID:** `roadmap-forecaster`
**Role:** Produces probability-weighted delivery date forecasts for all roadmap items using Monte Carlo simulation over historical velocity, dependency chains, and capacity constraints
**Output:** Delivery probability distributions with p10/p50/p90 dates for each roadmap item

---

## Purpose

Roadmap forecasting is fundamentally a probabilistic problem, not a deterministic one. A team's velocity varies. Dependencies slip. Scope creeps. The roadmap forecaster embraces this uncertainty and produces forecasts that reflect it honestly — with confidence intervals that tell decision-makers not just "when will it ship" but "how confident are we in that estimate."

**Core output:** For each roadmap item: P(complete by planned date), p10/p50/p90 completion dates, and the specific risks driving uncertainty.

---

## Forecasting Methodology

The roadmap forecaster uses **historical sampling Monte Carlo** — the most accurate method for team-specific forecasting because it samples from actual team behavior rather than theoretical distributions.

```
APPROACH: Historical Sampling Monte Carlo

INPUT:
  - Historical sprint velocity data (last 6-12 sprints)
  - Current roadmap items with effort estimates
  - Current dependency graph
  - Capacity adjustments (known holidays, planned leave)
  - Work in progress at forecast time

ALGORITHM:
  FOR iteration i in 1..N_iterations:
    
    # 1. Sample velocity for each future sprint
    FOR each future_sprint:
      sampled_velocity = random_sample(historical_velocities)
      # Optionally: apply trend adjustment (if velocity trending up/down)
      adjusted_velocity = sampled_velocity × trend_factor × capacity_factor(sprint)
    
    # 2. Simulate sprint execution
    FOR each future_sprint:
      available_points = adjusted_velocity
      complete_items = []
      
      FOR each item in sprint_backlog (by priority):
        IF item.depends_on all complete AND available_points >= item.remaining_effort:
          complete_items.append(item)
          item.completion_sprint = current_sprint
          available_points -= item.remaining_effort
        ELSE IF item has unresolved dependencies:
          item.blocked = True
          # Carry over to next sprint
    
    # 3. Compute completion dates
    FOR each item:
      completion_date = sprint_end_date(item.completion_sprint)
      item.simulated_completion[i] = completion_date
  
  # 4. Compute distribution
  FOR each item:
    completion_dates = [item.simulated_completion[i] for i in 1..N]
    item.forecast = {
      p10: percentile(completion_dates, 10),   # Pessimistic
      p50: percentile(completion_dates, 50),   # Expected (use this for planning)
      p90: percentile(completion_dates, 90),   # Optimistic
      on_time_probability: fraction(completion_dates <= planned_completion)
    }
```

---

## Velocity Model

### Historical Velocity Sampling

```yaml
VelocityDataset:
  team: string
  sprints: [SprintRecord]            # Last 6-12 completed sprints
  
  # Statistical summary
  velocities: [float]               # List of actual velocities
  mean: float
  std_dev: float
  cv: float                         # Coefficient of variation = std_dev/mean
  min_observed: float               # p10 sprint (pessimistic)
  max_observed: float               # p90 sprint (optimistic)
  
  # Trend
  trend_direction: "IMPROVING | STABLE | DECLINING"
  trend_slope: float                 # Points per sprint change
  
  # Anomalies (sprints to exclude from baseline)
  anomaly_sprints: [string]          # e.g., holiday sprints, major incidents
```

### Capacity Adjustments

```
FOR each future sprint in forecast horizon:
  capacity_factor = 1.0
  
  # Known reductions
  IF sprint has planned holidays:
    capacity_factor *= (working_days - holiday_days) / working_days
  
  IF sprint has planned absences:
    capacity_factor *= (1 - total_capacity_reduction_from_absences)
  
  IF sprint is immediately post-reorg:
    capacity_factor *= 0.80  # Productivity dip during transition
  
  # Known increases
  IF new hire joins this sprint:
    capacity_factor += new_hire_contribution_pct  # Ramping contribution
  
  adjusted_capacity_factor[sprint] = capacity_factor
```

---

## Dependency-Adjusted Forecasting

Standard velocity forecasting ignores dependencies. The roadmap forecaster explicitly models them:

```
DEPENDENCY ALGORITHM:
  
  FOR each item:
    earliest_possible_start = max(planned_start, max(dep.forecast.p50 FOR dep in item.depends_on))
    
    # If dependency is likely to slip:
    IF any dep in item.depends_on has dep.on_time_probability < 0.70:
      dependency_delay_distribution = compute_dependency_delay(dep)
      item.start_delay_distribution = combine(all deps' delay distributions)
    
    # Adjusted completion = start_delay + effort/velocity
    adjusted_completion = earliest_possible_start + (item.remaining_effort / velocity_p50)
```

---

## Forecast Output

```yaml
RoadmapForecast:
  forecast_id: string
  generated_at: datetime
  forecast_horizon_days: integer
  iterations: integer
  confidence_level: "HIGH | MEDIUM | LOW"
  
  # Per-item forecasts
  item_forecasts:
    - item_id: string
      item_title: string
      owner_team: string
      
      # Current state
      planned_completion: datetime
      current_percent_complete: float
      remaining_effort_points: integer
      
      # Forecast
      p10_completion: datetime         # Pessimistic (90% probability complete by this date)
      p50_completion: datetime         # Expected (50% probability)
      p90_completion: datetime         # Optimistic (10% probability complete by this date)
      
      on_time_probability: float       # P(complete by planned_completion)
      expected_slip_days: integer      # E[slip | slip occurs]
      
      # Risk factors
      at_risk: boolean
      risk_factors:
        velocity_risk: float           # P(velocity below what's needed)
        dependency_risk: float         # P(dependency slips affect this item)
        scope_risk: float              # P(scope grows beyond estimate)
        capacity_risk: float           # P(team capacity insufficient)
      
      dominant_risk: string           # Which risk factor contributes most
      risk_narrative: string          # One sentence: why this item is at risk
  
  # Release-level forecasts
  release_forecasts:
    - release_id: string
      core_items_complete_probability: float   # P(all core items complete by target date)
      nice_to_have_items_complete_probability: float
      
      on_time_probability: float
      scope_completeness_at_target_date_p50: float  # % of scope likely complete by target
      
      recommended_action: "GO | WATCH | DESCOPE | DELAY"
  
  # Portfolio health
  portfolio_summary:
    items_on_track: integer
    items_at_risk: integer
    items_likely_to_slip: integer
    portfolio_health_score: integer    # 0-100
    
    # Next 30/60/90 day delivery commitments
    commitments_next_30_days:
      committed_items: [string]
      all_on_track: boolean
      at_risk_items: [string]
```

---

## Forecast Accuracy Tracking

The forecaster tracks its own accuracy to improve over time:

```
FOR each completed item:
  actual_completion: datetime
  
  FOR each prior forecast:
    forecast_age_days = actual_completion - forecast_generated_at
    forecast_p50 = forecast.p50_completion
    
    forecast_error_days = actual_completion - forecast_p50
    
    # Was actual within p10-p90 range?
    calibration_correct = (p10 <= actual <= p90)
    
  forecast_accuracy_30d = mean(ABS(actual - p50) for forecasts made 30 days ago)
  calibration_rate = fraction(calibration_correct)
  # Target: calibration_rate ≈ 0.80 (actual should fall in p10-p90 80% of the time)
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`, `predictive-intelligence/prediction-engine.md`
**Reads from:**
- `digital-twins/delivery-twin.md` (current roadmap state, velocity history)
- `enterprise-modeling/delivery-model.md` (velocity model, dependency model)

**Writes to:**
- `memory/digital-twins/forecasts/roadmap-forecast-[id].yaml`
- `wiki/intelligence/` as Intelligence Package

**Output consumed by:**
- `forecasting/release-risk-simulator.md` → uses delivery probability for risk scoring
- `predictive-intelligence/operational-forecaster.md` → feeds delivery trend prediction
