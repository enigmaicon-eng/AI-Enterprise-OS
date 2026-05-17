# Operational Forecaster

**System ID:** `operational-forecaster`
**Role:** Forecasts operational performance trajectories — predicting throughput trends, quality degradation, flow efficiency changes, and delivery pipeline health over 1-4 week horizons
**Output:** Operational health forecast, throughput projections, quality trend assessment, delivery confidence trend

---

## Purpose

The operational forecaster monitors the engine of the enterprise — how work flows through the system. Where the org forecaster asks "is the team healthy?", the operational forecaster asks "is the work moving?" It tracks throughput, quality, cycle time, and delivery confidence as interconnected signals, projecting where operational performance is headed.

---

## Forecast Domains

| Domain | Horizon | Primary Twin | Key Prediction |
|--------|---------|-------------|----------------|
| Throughput trajectory | 1/2/4 weeks | workflow-twin, delivery-twin | Items/sprint at horizon |
| Quality trend | 1/2 weeks | workflow-twin | Gate pass rate, defect rate |
| Flow efficiency | 1/2/4 weeks | workflow-twin | cycle_time / lead_time ratio |
| Delivery confidence | 1/2 weeks | delivery-twin | Sprint completion probability |
| WIP saturation | Days to weeks | workflow-twin | Backlog depth, queue saturation |
| Lead time trend | 1/2/4 weeks | workflow-twin | Cycle time at horizon |

---

## Throughput Forecast

### Throughput Trend Extraction

```
LOAD from workflow-twin:
  throughput_history = workflow_twin.velocity_signals.throughput_trend_30d  # Daily items completed
  current_throughput  = workflow_twin.portfolio.completed_last_30d / 30     # Per day
  
LOAD from delivery-twin:
  velocity_history = delivery_twin.sprint_state.velocity_history             # Points/sprint
  velocity_p50     = delivery_twin.sprint_state.velocity_stats.p50
  velocity_trend   = delivery_twin.sprint_state.velocity_stats.trend_direction

# Short-term (7-day) and medium-term (30-day) trends
slope_7d  = linear_regression(throughput_history.last(7)).slope
slope_30d = linear_regression(throughput_history.last(30)).slope

# Trend consistency signal
trend_signal:
  IF slope_7d < 0 AND slope_30d < 0:   "DECLINING"       # Both down
  IF slope_7d > 0 AND slope_30d > 0:   "GROWING"         # Both up
  IF slope_7d < 0 AND slope_30d > 0:   "STALLING"        # Recent deceleration
  IF slope_7d > 0 AND slope_30d < 0:   "RECOVERING"      # Recent improvement
  ELSE:                                  "MIXED"
```

### Throughput Projection

```
FOR each horizon in [7, 14, 28]:
  
  # Weight recent trend more heavily than long-term
  weighted_slope = (slope_7d × 0.60) + (slope_30d × 0.40)
  projected_p50 = current_throughput + (weighted_slope × horizon)
  
  # Uncertainty: widens with horizon + trend inconsistency
  base_uncertainty = STDEV(daily_throughput_changes in throughput_history)
  horizon_factor   = SQRT(horizon / 7)
  consistency_penalty = 1.0 IF trend_signal in ["DECLINING","GROWING"] ELSE 1.3
  
  sigma = base_uncertainty × horizon_factor × consistency_penalty
  
  projected_p10 = MAX(0, projected_p50 - 1.65 × sigma)
  projected_p90 = projected_p50 + 1.65 × sigma
  
  # Constraint: throughput cannot exceed capacity ceiling
  capacity_ceiling = org_twin.org_health.org_capacity_theoretical × 0.90
  projected_p90 = MIN(projected_p90, capacity_ceiling)
```

---

## Quality Trend Forecast

### Gate Pass Rate Trajectory

```
LOAD from workflow-twin:
  gate_pass_rate_history  = workflow_twin.gate_performance.pass_rate_history_30d
  current_gate_pass_rate  = workflow_twin.gate_performance.overall_pass_rate
  gate_cycles_history     = workflow_twin.gate_performance.avg_cycles_history_30d
  current_avg_cycles      = workflow_twin.gate_performance.avg_gate_cycles

# Pass rate trend
slope_pass_rate = linear_regression(gate_pass_rate_history.last(14)).slope  # Per day

# Gate cycle trend (increasing cycles = quality degrading despite pass rate holding)
slope_gate_cycles = linear_regression(gate_cycles_history.last(14)).slope

# Quality degradation signal
quality_signal:
  IF slope_pass_rate < -0.005/day:    "DEGRADING_FAST"    # > 0.5%/day decline
  IF slope_pass_rate < -0.002/day:    "DEGRADING"         # > 0.2%/day decline
  IF slope_pass_rate > 0.002/day:     "IMPROVING"
  ELIF slope_gate_cycles > 0.05/day:  "CYCLING_UP"        # Pass rate flat, but more retries
  ELSE:                                "STABLE"

FOR each horizon in [7, 14]:
  projected_pass_rate_p50 = CLAMP(current_gate_pass_rate + slope_pass_rate × horizon, 0, 1)
  projected_avg_cycles_p50 = MAX(1.0, current_avg_cycles + slope_gate_cycles × horizon)
  
  # Quality breach probability: pass rate dropping below 0.80
  quality_breach_threshold = 0.80
  z = (quality_breach_threshold - projected_pass_rate_p50) / (0.03 × SQRT(horizon/7))
  quality_breach_probability[horizon] = CDF_NORMAL(z)
```

### Defect Rate Forecast

```
LOAD from workflow-twin:
  failure_rate_history = workflow_twin.failure_analysis.failure_rate_history_30d
  current_failure_rate = workflow_twin.failure_analysis.overall_failure_rate
  failure_types = workflow_twin.failure_analysis.by_type  # F1-F9 distribution

slope_failure_rate = linear_regression(failure_rate_history.last(14)).slope

FOR each horizon in [7, 14]:
  projected_failure_rate = MAX(0, current_failure_rate + slope_failure_rate × horizon)
  
  # Identify leading failure type
  leading_failure_type = MAX(failure_types, key=lambda t: t.rate × t.trend)
```

---

## Flow Efficiency Forecast

Flow efficiency = how much of lead time is productive work (vs. waiting).

```
LOAD from workflow-twin:
  flow_efficiency_history = workflow_twin.flow_efficiency.efficiency_history_30d
  current_flow_efficiency = workflow_twin.flow_efficiency.flow_efficiency_ratio
  wait_time_pct           = workflow_twin.flow_efficiency.wait_time_pct
  lead_time_trend         = workflow_twin.flow_efficiency.lead_time_7d_trend

# Flow efficiency trend
slope_flow = linear_regression(flow_efficiency_history.last(14)).slope  # Per day

# Wait time drivers
wait_time_decomposition:
  queue_wait_pct:       # Items waiting for processing slot
  escalation_wait_pct:  # Items blocked on escalation resolution
  dependency_wait_pct:  # Items blocked on upstream dependency
  review_wait_pct:      # Items waiting for gate review

FOR each horizon in [7, 14, 28]:
  projected_flow_efficiency = CLAMP(current_flow_efficiency + slope_flow × horizon, 0, 1)
  
  # Flow efficiency thresholds
  IF projected_flow_efficiency < 0.40:  flow_health = "CRITICAL"
  IF projected_flow_efficiency < 0.60:  flow_health = "AT_RISK"
  IF projected_flow_efficiency < 0.80:  flow_health = "ACCEPTABLE"
  ELSE:                                  flow_health = "EXCELLENT"
  
  # Projected lead time (via Little's Law inversion)
  # If flow efficiency drops, lead time grows proportionally
  # lead_time = cycle_time / flow_efficiency
  current_lead_time    = workflow_twin.flow_efficiency.avg_lead_time_days
  projected_lead_time  = workflow_twin.flow_efficiency.avg_cycle_time_days / projected_flow_efficiency
```

---

## Delivery Confidence Trend

Rolling view of sprint completion probability over time:

```
LOAD from delivery-twin:
  sprint_health_history = delivery_twin.sprint_state.sprint_health_score_history  # Last 6 sprints
  completion_prob_history = delivery_forecaster.completion_probability_history     # Last 6 sprints
  carry_over_rate_history = delivery_twin.sprint_state.carry_over_rate_history    # Last 6 sprints

# Delivery confidence composite
delivery_confidence_score:
  # Weighted combination of recent delivery signals
  completion_prob_avg = AVG(completion_prob_history.last(3))
  carry_over_rate_avg = AVG(carry_over_rate_history.last(3))
  
  delivery_confidence = (
    completion_prob_avg × 0.50 +
    (1 - carry_over_rate_avg) × 0.30 +
    (sprint_health_score / 100) × 0.20
  ) × 100

# Trend
delivery_confidence_trend:
  recent_3_avg  = AVG(delivery_confidence_history.last(3))
  previous_3_avg = AVG(delivery_confidence_history.previous(3))
  trend = recent_3_avg - previous_3_avg
  
  IF trend > 5:    "IMPROVING"
  IF trend > -5:   "STABLE"
  IF trend > -10:  "DECLINING"
  ELSE:            "DETERIORATING"
```

---

## WIP Saturation Forecast

When does the work pipeline become saturated?

```
LOAD from workflow-twin:
  current_wip = workflow_twin.portfolio.in_progress_count
  current_throughput_per_day = workflow_twin.portfolio.completed_last_30d / 30
  arrival_rate = workflow_twin.portfolio.new_items_per_day_30d_avg
  
LOAD from delivery-twin:
  backlog_depth = delivery_twin.sprint_state.backlog_item_count

# WIP growth: if arrivals > completions, backlog grows
wip_growth_rate_per_day = arrival_rate - current_throughput_per_day

# WIP limit threshold (from workflow-model: recommended = capacity × 1.5)
wip_limit_recommended = org_twin.capacity_theoretical × 1.5

IF wip_growth_rate_per_day > 0:
  days_to_wip_limit = (wip_limit_recommended - current_wip) / wip_growth_rate_per_day
  
  # Little's Law: as WIP → limit, lead time grows non-linearly
  utilization_at_wip_limit = arrival_rate / current_throughput_per_day  # ρ
  # Near ρ=1, M/G/1 wait time = ρ/(1-ρ) × service_time → diverges
  
  IF utilization_at_wip_limit >= 0.90:
    lead_time_multiplier_at_limit = (utilization_at_wip_limit / (1 - utilization_at_wip_limit)) × current_throughput_per_day
  ELSE:
    lead_time_multiplier_at_limit = 1.0 / (1 - utilization_at_wip_limit)
  
  wip_saturation_status = "APPROACHING" if days_to_wip_limit <= 30 else "DISTANT"
ELSE:
  wip_saturation_status = "STABLE"
  days_to_wip_limit = NULL
```

---

## Operational Forecast Output

```yaml
OperationalForecast:
  forecast_id: string
  forecasted_at: datetime
  twin_data_freshness:
    workflow_twin_age_minutes: integer
    delivery_twin_age_minutes: integer
  
  # Throughput
  throughput_forecast:
    current_throughput_per_day: float
    trend_signal: "GROWING | DECLINING | STALLING | RECOVERING | MIXED"
    trend_per_day: float
    
    horizons:
      - horizon_days: 7
        projected_p10: float
        projected_p50: float
        projected_p90: float
      - horizon_days: 14
        [same fields]
      - horizon_days: 28
        [same fields]
  
  # Quality
  quality_forecast:
    current_gate_pass_rate: float
    quality_signal: "DEGRADING_FAST | DEGRADING | STABLE | CYCLING_UP | IMPROVING"
    pass_rate_trend_per_day: float
    
    horizons:
      - horizon_days: 7
        projected_pass_rate_p50: float
        quality_breach_probability: float  # P(pass_rate < 0.80)
      - horizon_days: 14
        [same fields]
    
    current_avg_gate_cycles: float
    gate_cycle_trend: "INCREASING | STABLE | DECREASING"
    leading_failure_type: string          # F1-F9 code driving deterioration
  
  # Flow efficiency
  flow_efficiency_forecast:
    current_flow_efficiency: float
    flow_efficiency_trend_per_day: float
    
    horizons:
      - horizon_days: 7
        projected_flow_efficiency: float
        projected_lead_time_days: float
        flow_health: "EXCELLENT | ACCEPTABLE | AT_RISK | CRITICAL"
      - horizon_days: 14
        [same fields]
      - horizon_days: 28
        [same fields]
    
    primary_wait_driver: "queue_wait | escalation_wait | dependency_wait | review_wait"
    wait_time_pct: float
  
  # Delivery confidence
  delivery_confidence:
    current_score: float                  # 0-100
    trend: "IMPROVING | STABLE | DECLINING | DETERIORATING"
    current_completion_probability: float
    current_carry_over_rate: float
    sprint_health_score: integer
  
  # WIP saturation
  wip_saturation:
    current_wip: integer
    wip_growth_rate_per_day: float
    wip_saturation_status: "STABLE | APPROACHING | SATURATED"
    days_to_wip_limit: integer | null
    lead_time_multiplier_at_limit: float
  
  # Prioritized warnings
  warnings:
    - domain: string
      urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR"
      message: string
      recommended_action: string
  
  # Overall operational health
  operational_health: "HEALTHY | STRESSED | AT_RISK | DEGRADED"
  primary_recommendation: string
  confidence: "HIGH | MEDIUM | LOW | DEGRADED"
```

---

## Integration

**Called by:** `predictive-intelligence/prediction-engine.md` (every 4 hours)
**Reads from:**
- `digital-twins/workflow-twin.md` (workflow performance state)
- `digital-twins/delivery-twin.md` (sprint + delivery state)
- `digital-twins/org-twin.md` (capacity context)
- `forecasting/delivery-forecaster.md` (current sprint forecast)
- `enterprise-modeling/workflow-model.md` (flow efficiency formulas)

**Writes to:**
- `memory/digital-twins/predictions/operational-forecast-[id].yaml`

**Output consumed by:**
- `predictive-intelligence/prediction-engine.md` → aggregated into prediction report
- `predictive-intelligence/bottleneck-predictor.md` → WIP and flow signals inform bottleneck detection
- Orchestrator for operational health monitoring
