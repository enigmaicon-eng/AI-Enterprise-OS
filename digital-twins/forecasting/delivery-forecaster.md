# Delivery Forecaster

**System ID:** `delivery-forecaster`
**Role:** Sprint-level delivery forecasting — predicts sprint completion rates, carry-over risk, burndown trajectories, and scope-fit recommendations in real time
**Output:** Sprint confidence score, delivery probability, recommended scope adjustments

---

## Purpose

The delivery forecaster operates at the finest granularity: the sprint. Where the roadmap forecaster looks months ahead, the delivery forecaster answers "will we finish what we committed to THIS sprint?" — and if not, recommends scope adjustments before it's too late to act.

---

## Sprint Forecasting Model

### Burndown Trajectory

```
INPUTS:
  planned_points: integer           # Committed scope
  remaining_points: float           # Updated daily
  working_days_remaining: integer   # Days left in sprint
  current_velocity: float           # Actual points/day THIS sprint (so far)
  historical_velocity: VelocityDistribution  # From past sprints
  
IDEAL BURNDOWN:
  daily_rate_needed = remaining_points / working_days_remaining
  
  # Compare needed rate to actual rate:
  velocity_ratio = current_velocity / daily_rate_needed
  
  IF velocity_ratio >= 1.0: "On track or ahead"
  IF velocity_ratio >= 0.80: "Slightly behind — monitor"
  IF velocity_ratio >= 0.60: "At risk — action needed"
  IF velocity_ratio < 0.60: "Critical — scope cut likely needed"

FORECAST BURNDOWN (probabilistic):
  FOR each iteration:
    FOR each remaining_day:
      daily_velocity = sample(historical_velocities) × capacity_factor(day)
      remaining_points -= daily_velocity
      IF remaining_points <= 0:
        completion_day = current_day + days_counted
        BREAK
  
  completion_probability = fraction(completion_day <= sprint_end_day)
```

### Scope-to-Fit Analysis

When the sprint is at risk, recommend scope adjustments:

```
SCOPE TO FIT ALGORITHM:

expected_completion_points = velocity_p50 × working_days_remaining

IF expected_completion_points < remaining_points:
  scope_gap = remaining_points - expected_completion_points
  
  # Find items that can be deferred (lowest priority, no critical dependencies)
  deferrable_items = [item for item in sprint_backlog
                      if item.priority != "CRITICAL"
                      and not item.has_dependents_this_sprint]
  
  # Sort by deferral cost (prefer deferring smaller, lower-priority items)
  deferrable_items.sort(key = lambda i: i.priority_score * i.effort_points)
  
  # Find minimum set of deferrals to close the gap
  items_to_defer = []
  points_freed = 0
  
  FOR item in deferrable_items:
    IF points_freed < scope_gap:
      items_to_defer.append(item)
      points_freed += item.effort_points
  
  IF points_freed >= scope_gap:
    RECOMMEND: defer(items_to_defer)
    new_completion_probability = reforecast(remaining_points - points_freed, ...)
  ELSE:
    WARN: "Scope gap too large to close by deferral — sprint may significantly miss"
```

---

## Carry-Over Risk Model

```
# Carry-over = planned work not completed in sprint → moves to next sprint
# High carry-over damages next sprint and creates compounding delays

carry_over_risk_score:
  
  # Historical carry-over rate
  historical_carry_over_rate = avg(sprint.carry_over_rate for sprint in last_6_sprints)
  
  # Current sprint signals
  current_carry_over_probability = P(remaining_points > expected_completion_points)
  
  # Impact on next sprint
  IF carry_over_occurs:
    next_sprint_starting_load = carry_over_points + next_sprint_planned_points
    next_sprint_utilization = next_sprint_starting_load / historical_velocity
    
    IF next_sprint_utilization > 1.0:
      carry_over_cascade_risk = "HIGH"  # Next sprint will also miss
    ELSE:
      carry_over_cascade_risk = "LOW"   # Next sprint can absorb carry-over

carry_over_risk_classification:
  IF carry_over_probability < 0.20: "LOW"
  IF carry_over_probability < 0.40: "MEDIUM"
  IF carry_over_probability < 0.65: "HIGH"
  ELSE: "CRITICAL"
```

---

## Unplanned Work Model

Unplanned work added mid-sprint reduces the probability of completing planned work:

```
# Track unplanned work additions
unplanned_points_rate = total_unplanned_points_last_30_days / working_days_last_30_days
expected_unplanned_this_sprint = unplanned_points_rate × working_days_remaining

# Adjust completion forecast for expected unplanned work
adjusted_remaining = remaining_points + expected_unplanned_this_sprint
adjusted_completion_probability = reforecast(adjusted_remaining, velocity_p50, working_days)

# Alert if unplanned rate is high
IF unplanned_points > planned_points × 0.20:
  → "Sprint scope creep: unplanned work exceeded 20% of committed scope"
```

---

## Sprint Health Metrics

Real-time health signals updated daily:

```yaml
SprintHealthSnapshot:
  sprint_id: string
  as_of_date: datetime
  days_into_sprint: integer
  working_days_remaining: integer
  
  # Burndown
  planned_points: integer
  completed_points: integer
  remaining_points: float
  ideal_remaining: float           # Where remaining should be if perfectly on track
  burndown_deviation_points: float  # remaining - ideal_remaining (positive = behind)
  
  # Velocity
  current_sprint_velocity: float   # Points/day THIS sprint so far
  historical_velocity_p50: float   # Expected velocity from history
  velocity_vs_historical: float    # Ratio: current / historical
  
  # Completion forecast
  completion_probability: float
  p50_completion_points: integer   # How many points likely to complete
  expected_carry_over_points: integer
  
  # Scope recommendation
  scope_recommendation: "ON_TRACK | REDUCE_SCOPE | EXTEND_SPRINT | ESCALATE"
  items_to_defer: [string]         # If REDUCE_SCOPE, which items to defer
  
  # Flags
  unplanned_work_flag: boolean     # Unplanned > 15% of planned
  dependency_block_flag: boolean   # Items blocked on external deps
  team_capacity_flag: boolean      # Actual capacity significantly below planned
  
  # Sprint health score
  sprint_health: integer           # 0-100
  sprint_health_trend: "IMPROVING | STABLE | DECLINING"
```

---

## Daily Sprint Update

Run every day the sprint is active:

```
DAILY UPDATE PROTOCOL:
  
  1. Update completed_points from execution-registry (workflow completions)
  2. Update remaining_points from work-queue (pending sprint items)
  3. Recompute current_sprint_velocity
  4. Run burndown trajectory simulation (1000 iterations, fast)
  5. Check for unplanned work additions (compare to yesterday's snapshot)
  6. Check for new dependency blocks
  7. Update sprint health score
  8. IF scope_recommendation changed: alert orchestrator
  9. Write SprintHealthSnapshot to twin state
```

---

## Delivery Forecast Output

```yaml
DeliveryForecast:
  forecast_id: string
  sprint_id: string
  team: string
  forecasted_at: datetime
  
  # Sprint completion
  completion_probability: float    # P(finishing all planned work)
  p10_completion_pct: float       # Pessimistic: fraction completed
  p50_completion_pct: float       # Expected
  p90_completion_pct: float       # Optimistic
  
  # Carry-over
  carry_over_probability: float
  expected_carry_over_points: integer
  carry_over_cascade_risk: "LOW | MEDIUM | HIGH"
  
  # Scope recommendation
  recommended_action: "ON_TRACK | MONITOR | DESCOPE | ESCALATE"
  items_to_defer: [string]         # Recommended deferrals (if descope)
  deferral_impact: string          # "Frees N points, raises completion probability to X%"
  
  # Blockers
  active_blockers:
    - item_id: string
      blocked_by: string
      blocking_since: datetime
      escalation_needed: boolean
  
  # Unplanned work
  unplanned_points_added: integer
  unplanned_pct_of_planned: float
  
  # Trend
  velocity_trend: "ACCELERATING | STABLE | DECELERATING"
  sprint_health_score: integer     # 0-100
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`, daily update cycle
**Reads from:**
- `digital-twins/delivery-twin.md` (sprint state, velocity history)
- `memory/execution-registry.yaml` (workflow completions)
- `memory/work-queue.yaml` (pending sprint items)
- `enterprise-modeling/delivery-model.md` (velocity model)

**Writes to:**
- `memory/digital-twins/forecasts/delivery-forecast-[id].yaml`
- Updates `delivery-twin` sprint state

**Output consumed by:**
- `predictive-intelligence/operational-forecaster.md`
- `predictive-intelligence/bottleneck-predictor.md`
- Orchestrator for sprint management decisions
