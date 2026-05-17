# Org Forecaster

**System ID:** `org-forecaster`
**Role:** Generates 2-week, 4-week, and 12-week organizational health forecasts — predicting capacity exhaustion, structural coverage gaps, escalation system strain, and org-level risk accumulation before they manifest
**Output:** Org health forecast with confidence intervals, capacity exhaustion dates, structural risk assessment

---

## Purpose

The org forecaster answers the question executives dread: "Are we heading toward an org health crisis?" It translates current org-twin state into forward-looking projections — showing not just where the org is today, but where it will be in 2 weeks, 4 weeks, and 3 months if current trends continue.

---

## Forecast Domains

| Domain | Horizon | Primary Signal | Key Prediction |
|--------|---------|---------------|----------------|
| Org health trajectory | 2/4/12 weeks | org_health_score trend | Score at horizon, breach probability |
| Capacity exhaustion | Days to weeks | utilization trend | Date when utilization > 0.90 |
| Coverage gap emergence | 1/2/4 weeks | unit agent counts + workflow volume | When units go understaffed |
| Escalation system strain | 1/2 weeks | escalation_rate, resolution_time trends | When SLA compliance degrades |
| Structural risk | 2/4 weeks | SPOF count, coverage gaps | Structural fragility index |

---

## Org Health Trajectory Forecast

### Current Score and Trend Extraction

```
LOAD from org-twin:
  current_health_score = org_twin.org_health.org_health_score
  health_history = org_twin.org_health.score_history  # Last 30 days, daily

# Compute trend via linear regression on last 14 days
slope_14d = linear_regression(health_history.last(14)).slope  # Points/day
slope_7d  = linear_regression(health_history.last(7)).slope   # More recent

# Trend reliability (are recent and 14-day trends consistent?)
IF sign(slope_7d) == sign(slope_14d) AND ABS(slope_7d - slope_14d) / ABS(slope_14d) < 0.30:
  trend_confidence = "HIGH"
ELIF sign(slope_7d) == sign(slope_14d):
  trend_confidence = "MEDIUM"
ELSE:
  trend_confidence = "LOW"  # Trend is reversing or noisy
```

### Projection Model

```
FOR each horizon in [14, 28, 84]:  # days
  
  # Linear projection (baseline)
  projected_p50 = current_health_score + (slope_14d × horizon)
  
  # Uncertainty bands (widen with horizon)
  uncertainty_multiplier = SQRT(horizon / 14)  # Uncertainty scales with sqrt(time)
  score_volatility = STDEV(daily_changes in health_history)  # Historical daily variation
  
  band_width_1sigma = score_volatility × uncertainty_multiplier × SQRT(horizon)
  
  projected_p10 = projected_p50 - (1.65 × band_width_1sigma)  # 90th percentile pessimistic
  projected_p90 = projected_p50 + (1.65 × band_width_1sigma)  # 90th percentile optimistic
  
  # Clamp to valid range
  projected_p50 = CLAMP(projected_p50, 0, 100)
  projected_p10 = CLAMP(projected_p10, 0, 100)
  projected_p90 = CLAMP(projected_p90, 0, 100)
  
  # Threshold breach probability
  critical_threshold = 60  # Org health < 60 = critical
  warning_threshold  = 70  # Org health < 70 = warning
  
  # Approximate: use normal distribution
  z_critical = (critical_threshold - projected_p50) / band_width_1sigma
  z_warning  = (warning_threshold  - projected_p50) / band_width_1sigma
  
  breach_probability_critical = CDF_NORMAL(z_critical)  # P(score drops below critical)
  breach_probability_warning  = CDF_NORMAL(z_warning)
```

### Subscore Decomposition

Forecast each health subscore independently to identify which dimension drives risk:

```yaml
subscore_forecasts:
  
  capacity_health:
    # Primary driver: utilization trend
    current_value: float
    trend_per_day: float      # From utilization change rate
    driver_metric: "capacity_utilization_trend"
    
  quality_health:
    # Primary driver: gate pass rate trend
    current_value: float
    trend_per_day: float
    driver_metric: "gate_pass_rate_7d_trend"
    
  velocity_health:
    # Primary driver: throughput trend
    current_value: float
    trend_per_day: float
    driver_metric: "throughput_trend"
    
  governance_health:
    # Primary driver: escalation rate trend
    current_value: float
    trend_per_day: float
    driver_metric: "escalation_rate_trend"
```

---

## Capacity Exhaustion Forecast

When will the organization run out of capacity?

```
LOAD:
  current_utilization = org_twin.org_health.org_capacity_utilization
  utilization_history = org_twin.utilization_history_30d  # Daily readings

# Trend
slope = linear_regression(utilization_history.last(14)).slope  # Per day

# Exhaustion = when utilization reaches saturation threshold (0.90 = WARNING, 0.95 = CRITICAL)
IF slope > 0:  # Utilization is increasing
  
  days_to_warning_level  = (0.90 - current_utilization) / slope
  days_to_critical_level = (0.95 - current_utilization) / slope
  
  # Confidence based on trend consistency
  trend_r_squared = linear_regression(utilization_history.last(14)).r_squared
  
  IF days_to_warning_level <= 0:
    exhaustion_status = "ALREADY_WARNING"
    immediate_action_required = True
  ELIF days_to_warning_level <= 7:
    exhaustion_status = "IMMINENT"
    urgency = "HIGH"
  ELIF days_to_warning_level <= 30:
    exhaustion_status = "APPROACHING"
    urgency = "MEDIUM"
  ELSE:
    exhaustion_status = "DISTANT"
    urgency = "MONITOR"

ELSE:  # Utilization stable or decreasing
  exhaustion_status = "NOT_TRENDING"
  urgency = "MONITOR"

# Per-unit breakdown
unit_exhaustion_forecasts:
  FOR each unit in org_twin.organizational_units:
    IF unit.utilization_trend > 0:
      unit_days_to_90pct = (0.90 - unit.utilization_pct) / unit.utilization_trend
```

---

## Coverage Gap Emergence Forecast

Will any unit become understaffed relative to incoming workflow volume?

```
LOAD:
  units = org_twin.organizational_units
  throughput_trend = org_twin.derived_metrics.throughput_trend_7d

FOR each unit in units:
  current_agents = unit.active_agents
  current_load = unit.utilization_pct × unit.capacity_theoretical
  
  # Project workflow volume growth to unit
  unit_volume_growth_rate = throughput_trend × unit.volume_share  # Unit's share of total
  
  # At what volume does this unit need one more agent?
  effective_capacity_per_agent = unit.effective_capacity_factor × 1.0  # Normalized units
  capacity_gap_threshold = current_agents × effective_capacity_per_agent × 0.90
  
  days_to_need_extra_agent:
    IF unit_volume_growth_rate > 0:
      volume_gap = capacity_gap_threshold - current_load
      days_to_gap = volume_gap / unit_volume_growth_rate
    ELSE:
      days_to_gap = NULL  # Not trending toward gap

# Coverage gap risk classification
coverage_gap_risk:
  CRITICAL: current_agents < min_coverage_requirement[unit.type]
  HIGH:     days_to_gap <= 14
  MEDIUM:   days_to_gap <= 42
  MONITOR:  days_to_gap > 42 or not trending
```

---

## Escalation System Strain Forecast

Will the escalation system become overloaded?

```
LOAD from org-twin:
  escalation_arrival_rate_lambda = org_twin.escalation_state.current_arrival_rate  # Per hour
  escalation_arrival_trend = org_twin.escalation_state.arrival_rate_trend          # Per day
  resolver_capacity_mu = org_twin.escalation_state.resolution_rate                # Per hour
  active_resolvers = org_twin.escalation_state.active_resolvers
  queue_depth = org_twin.escalation_state.queue_depth

# M/G/c queuing model
c = active_resolvers
mu_per_server = resolver_capacity_mu / c  # Per server per hour

FOR each horizon in [7, 14]:
  
  projected_lambda = escalation_arrival_rate_lambda + (escalation_arrival_trend × horizon × 24)
  rho = projected_lambda / (c × mu_per_server)
  
  IF rho >= 1.0:
    queue_status = "UNSTABLE"  # Queue grows without bound
    sla_compliance_projected = 0.0
    queue_depth_projected = "UNBOUNDED"
  ELSE:
    # M/M/c approximation for projected wait time
    # (uses Erlang C formula approximation)
    erlang_c_approx = (rho ^ c / (c! × (1 - rho))) / (SUM(rho^k/k! for k in 0..c-1) + rho^c/(c!×(1-rho)))
    avg_wait_hours = erlang_c_approx / (c × mu_per_server × (1 - rho))
    
    # SLA compliance: fraction of escalations resolved within SLA target
    sla_target_hours_by_class = {CRITICAL: 2, HIGH: 8, MEDIUM: 24, LOW: 72}
    
    FOR each class in [CRITICAL, HIGH, MEDIUM, LOW]:
      p_within_sla = 1 - exp(-mu_per_server × sla_target_hours_by_class[class] / avg_wait_hours)
      sla_compliance_forecast[class][horizon] = p_within_sla

# Alert trigger: SLA compliance for CRITICAL dropping below 80%
IF sla_compliance_forecast.CRITICAL.at_7d < 0.80:
  → ALERT: "Escalation SLA compliance at risk in 7 days"
```

---

## Structural Risk Assessment

Measures the organizational fragility — how vulnerable to disruption:

```yaml
structural_risk_model:
  
  spof_risk:
    # Single-point-of-failure agents: agents whose departure would cripple a unit
    spof_count: integer          # Agents where unit.active_agents == 1
    spof_units: [string]         # Which units have exactly one agent
    spof_score: float            # spof_count / total_units (higher = more fragile)
    
  capability_concentration:
    # Skills/capabilities held by few agents
    concentration_score: float   # Herfindahl index of capability distribution
    # concentration_score = SUM((unit_capability_share)^2) for each capability
    # 0 = perfectly distributed, 1 = one unit has everything
    
  cross_dependency_fragility:
    # How many workflows depend on cross-org coordination
    cross_org_dependency_rate: float  # Dependencies requiring different-org resolution
    external_dependency_rate: float   # Dependencies requiring external coordination
    # Both carry 2.5×-5.0× resolution time multipliers from coordination-simulator
    
  reorg_recovery_state:
    # If a recent reorg occurred, org is in transition and more fragile
    in_reorg_transition: boolean
    days_since_reorg: integer | null
    productivity_recovery_pct: float  # Via S-curve: 3x² - 2x³

structural_fragility_index:
  # Composite score 0-100 (higher = more fragile/at risk)
  fragility_score = (
    spof_score × 0.40 +
    capability_concentration × 0.30 +
    cross_dependency_fragility_score × 0.20 +
    reorg_recovery_penalty × 0.10
  ) × 100
  
  IF fragility_score > 70: structural_risk = "CRITICAL"
  IF fragility_score > 50: structural_risk = "HIGH"
  IF fragility_score > 30: structural_risk = "MEDIUM"
  ELSE:                    structural_risk = "LOW"
```

---

## Org Forecast Output

```yaml
OrgForecast:
  forecast_id: string
  forecasted_at: datetime
  twin_snapshot_age_minutes: integer
  
  # Org health trajectory
  health_trajectory:
    current_score: float
    trend_per_day: float
    trend_confidence: "HIGH | MEDIUM | LOW"
    
    horizons:
      - horizon_days: 14
        projected_p10: float
        projected_p50: float
        projected_p90: float
        breach_probability_critical: float   # P(score < 60)
        breach_probability_warning: float    # P(score < 70)
      - horizon_days: 28
        [same fields]
      - horizon_days: 84
        [same fields]
    
    subscore_forecasts:
      capacity_health: { trend_per_day, primary_driver }
      quality_health: { trend_per_day, primary_driver }
      velocity_health: { trend_per_day, primary_driver }
      governance_health: { trend_per_day, primary_driver }
  
  # Capacity exhaustion
  capacity_forecast:
    current_utilization: float
    utilization_trend_per_day: float
    exhaustion_status: "ALREADY_WARNING | IMMINENT | APPROACHING | DISTANT | NOT_TRENDING"
    days_to_warning_level: integer | null
    days_to_critical_level: integer | null
    units_at_risk: [string]
  
  # Coverage gaps
  coverage_gap_forecast:
    units_with_current_gaps: [string]
    units_approaching_gaps:
      - unit_name: string
        days_until_understaffed: integer
        risk_level: "HIGH | MEDIUM | MONITOR"
  
  # Escalation system
  escalation_strain_forecast:
    current_rho: float
    rho_at_7d: float
    rho_at_14d: float
    sla_compliance_forecast:
      CRITICAL: { at_7d: float, at_14d: float }
      HIGH: { at_7d: float, at_14d: float }
    strain_status: "HEALTHY | ELEVATED | AT_RISK | UNSTABLE"
  
  # Structural risk
  structural_risk:
    structural_fragility_index: float
    risk_level: "LOW | MEDIUM | HIGH | CRITICAL"
    spof_count: integer
    spof_units: [string]
    top_structural_risks: [string]
  
  # Prioritized warnings
  warnings:
    - domain: string
      urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR"
      message: string
      recommended_action: string
      action_owner: string
  
  # Overall assessment
  overall_urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR"
  primary_recommendation: string
  confidence: "HIGH | MEDIUM | LOW | DEGRADED"
```

---

## Integration

**Called by:** `predictive-intelligence/prediction-engine.md` (every 4 hours)
**Reads from:**
- `digital-twins/org-twin.md` (org state snapshot)
- `enterprise-modeling/org-model.md` (model formulas and thresholds)
- `simulation-systems/org-simulator.md` (for simulation-based projection when uncertainty is high)
- `simulation-systems/staffing-simulator.md` (for capacity exhaustion scenario simulation)
- `simulation-systems/escalation-simulator.md` (for escalation strain forecasting)

**Writes to:**
- `memory/digital-twins/predictions/org-forecast-[id].yaml`

**Output consumed by:**
- `predictive-intelligence/prediction-engine.md` → aggregated into prediction report
- Orchestrator → org health alerts
