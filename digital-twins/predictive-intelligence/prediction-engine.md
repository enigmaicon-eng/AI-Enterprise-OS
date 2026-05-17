# Prediction Engine

**System ID:** `prediction-engine`
**Role:** Master coordinator for all predictive intelligence — aggregates twin data and simulation results, generates actionable predictions, tracks prediction accuracy, and surfaces early warnings before problems become crises
**Storage:** `memory/digital-twins/predictions/` + `memory/digital-twins/prediction-accuracy.yaml`

---

## Purpose

The prediction engine is the enterprise's early warning system. It runs continuously, monitoring all four twins, consuming simulation results, and generating predictions about what will happen — before it happens. Unlike reactive monitoring (which alerts after a threshold is breached), the prediction engine models leading indicators and raises flags when the trajectory is wrong, not just when the destination is.

**Core promise:** Surface the right warning, to the right person, early enough to act.

---

## Prediction Types

| Prediction Class | Horizon | Source Twins | Trigger |
|-----------------|---------|-------------|---------|
| Org health forecast | 2/4/12 weeks | org-twin | Every 4 hours |
| Capacity exhaustion | Days to weeks | org-twin, runtime-twin | Continuous |
| Delivery date forecast | Per item | delivery-twin | Daily |
| Release readiness | Days to release | delivery-twin, workflow-twin | Daily |
| Bottleneck onset | Hours to days | all twins | Continuous |
| Governance risk | 1/2/4 weeks | org-twin, workflow-twin | Every 8 hours |
| Runtime saturation | Hours to days | runtime-twin | Continuous |
| Quality degradation | Days | workflow-twin | Every 4 hours |

---

## Prediction Generation Protocol

### PHASE 01: Twin Health Check

```
VERIFY: All required twins are STABLE
IF any twin is STALE:
  → Trigger sync for that twin
  → Wait up to 5 minutes
  → Proceed with DEGRADED confidence if still stale
```

### PHASE 02: Load Twin Snapshots

```
READ: Current state from each required twin
EXTRACT: Current values for all leading indicator metrics
COMPUTE: Trends (7-day, 30-day) for each metric
```

### PHASE 03: Trigger Targeted Simulations

For predictions with uncertainty > threshold, run targeted simulations:

```
IF org_capacity_utilization_trend is increasing AND rate > 0.02/week:
  → Run: staffing capacity simulation (extend trend 30/60/90 days)
  → Generate: capacity exhaustion forecast

IF delivery_confidence_score < 70:
  → Run: roadmap-forecaster Monte Carlo
  → Generate: item-level delivery date updates

IF runtime_saturation_composite > 0.70:
  → Run: runtime-load-simulator
  → Generate: saturation onset forecast
```

### PHASE 04: Generate Predictions

```
FOR each active prediction class:
  1. Extract current metric values from twin(s)
  2. Compute trend: linear_regression(last_14_days_of_metric)
  3. Project trend forward to horizon
  4. Apply simulation results (if available) to refine projection
  5. Compute confidence based on data quality and trend consistency
  6. Check against thresholds and prior predictions
  7. Generate prediction record
```

### PHASE 05: Prioritize and Surface

```
FOR each generated prediction:
  CLASSIFY urgency:
    IF threshold_breach_probability > 0.80 AND time_to_impact < 48h: → IMMEDIATE
    IF threshold_breach_probability > 0.60 AND time_to_impact < 7d:  → HIGH
    IF threshold_breach_probability > 0.40 AND time_to_impact < 30d: → MEDIUM
    ELSE: → MONITOR

ROUTE predictions:
  IMMEDIATE: Alert orchestrator + surface in wiki + notify human if CRITICAL
  HIGH: Write to wiki intelligence, include in next session context
  MEDIUM: Write to predictions store, include in daily summary
  MONITOR: Write to predictions store, no immediate action
```

---

## Leading Indicator Library

Metrics that predict future problems before they manifest:

```yaml
leading_indicators:
  
  # Org health leading indicators
  - indicator: "escalation_rate_7d_trend"
    predicts: "org_health_degradation"
    lead_time_days: 14
    threshold_for_warning: "trend > +0.005/day"  # Escalation rate growing 0.5%/day
    
  - indicator: "gate_pass_rate_7d_trend"
    predicts: "quality_degradation"
    lead_time_days: 7
    threshold_for_warning: "trend < -0.01/day"  # Pass rate falling 1%/day
    
  - indicator: "capacity_utilization_trend"
    predicts: "capacity_exhaustion"
    lead_time_days: 21
    threshold_for_warning: "utilization > 0.80 AND trend > +0.005/day"
    
  # Delivery leading indicators
  - indicator: "burndown_deviation_trend"
    predicts: "sprint_carry_over"
    lead_time_days: 5
    threshold_for_warning: "deviation > planned × 0.15"
    
  - indicator: "dependency_at_risk_count_trend"
    predicts: "release_delay"
    lead_time_days: 14
    threshold_for_warning: "count > 0 AND critical_path_items > 0"
    
  - indicator: "velocity_trend"
    predicts: "roadmap_slip"
    lead_time_days: 28
    threshold_for_warning: "velocity declining > 5%/sprint for 3+ sprints"
    
  # Runtime leading indicators
  - indicator: "context_pressure_index_trend"
    predicts: "context_saturation_onset"
    lead_time_days: 3
    threshold_for_warning: "pressure > 0.60 AND trend > +0.05/day"
    
  - indicator: "recovery_overhead_trend"
    predicts: "runtime_saturation"
    lead_time_days: 7
    threshold_for_warning: "recovery_pct > 0.20 AND trend increasing"
    
  - indicator: "tool_budget_exhaustion_rate_trend"
    predicts: "step_stall_cluster"
    lead_time_days: 2
    threshold_for_warning: "exhaustion_rate > 0.15 AND increasing"
```

---

## Prediction Record Schema

```yaml
Prediction:
  prediction_id: string
  prediction_class: string           # org_health | capacity | delivery | etc.
  generated_at: datetime
  
  # What is being predicted
  subject: string                    # "org-twin.org_health_score"
  subject_description: string        # Human-readable
  
  # Current state
  current_value: float
  current_trend: float               # Rate of change per day
  
  # Projection
  horizons:
    - horizon_days: 14
      projected_value_p50: float
      projected_value_p10: float     # Pessimistic
      projected_value_p90: float     # Optimistic
      threshold_breach_probability: float
    - horizon_days: 30
      [same fields]
    - horizon_days: 90
      [same fields]
  
  # Warning assessment
  urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR"
  warning_triggered: boolean
  warning_reason: string             # Why this is a warning
  
  # Supporting evidence
  evidence:
    - metric: string
      value: float
      trend: string
      significance: "HIGH | MEDIUM | LOW"
  
  # Recommended action
  recommended_action: string
  action_owner: string               # Which org/agent should act
  action_deadline: datetime | null
  
  # Confidence
  confidence: "HIGH | MEDIUM | LOW | DEGRADED"
  confidence_rationale: string
  
  # Accuracy tracking
  verified_at: datetime | null       # When we'll know if this was right
  actual_value_at_horizon: float | null
  accuracy_score: float | null       # Set after verification
```

---

## Prediction Accuracy Tracking

```
ACCURACY TRACKING:

FOR each prediction with verified_at reached:
  actual = twin.current_value at verified_at
  predicted_p50 = prediction.horizons[matched_horizon].projected_value_p50
  
  absolute_error = ABS(actual - predicted_p50)
  relative_error = absolute_error / ABS(actual)
  
  # Was actual within the p10-p90 range? (calibration check)
  within_range = (p10 <= actual <= p90)
  
OVERALL ACCURACY METRICS:
  mae_by_class = {}                  # Mean absolute error by prediction class
  calibration_by_class = {}          # Fraction of actuals within p10-p90
  
  # Target calibration: 80% of actuals within p10-p90 range
  # MAE target: < 10% relative error for 30-day forecasts

ACCURACY FEEDBACK:
  IF calibration < 0.60 for any class:
    → Systematic bias — recalibrate model for that class
  IF MAE > 20% for any class:
    → Model is poor for that dimension — investigate assumptions
```

---

## Prediction Report Format

Generated every 4 hours, stored in `memory/digital-twins/predictions/`:

```
ENTERPRISE PREDICTION REPORT
══════════════════════════════════════════════════════════
Generated: [timestamp]
Twin Data Freshness: ORG [N min ago] | WF [N min ago] | DEL [N min ago] | RT [N min ago]

IMMEDIATE ALERTS (action required now):
  ⚠ [prediction_class]: [warning description]
    Impact: [what happens if no action]
    Action: [specific recommendation]
    Owner: [who acts]
    Deadline: [when]

HIGH PRIORITY (act within 7 days):
  ↑ [prediction_class]: [forecast summary]
    Probability: [N%] in [N] days
    
MEDIUM PRIORITY (monitor):
  → [prediction_class]: [trend description]

DELIVERY FORECAST:
  [item/release]: [on-time probability] | p50: [date]
  
SYSTEM HEALTH SUMMARY:
  Org Health: [score] ([trend])
  Delivery Confidence: [score] ([trend])
  Runtime Saturation: [pct] ([trend])
══════════════════════════════════════════════════════════
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md` (every 4 hours + on anomaly)
**Calls:**
- `predictive-intelligence/org-forecaster.md`
- `predictive-intelligence/operational-forecaster.md`
- `predictive-intelligence/bottleneck-predictor.md`
- `predictive-intelligence/governance-risk-predictor.md`
- `forecasting/roadmap-forecaster.md` (for delivery predictions)
- `simulation-systems/simulation-engine.md` (targeted simulations)

**Writes to:**
- `memory/digital-twins/predictions/[prediction-id].yaml`
- `memory/digital-twins/prediction-accuracy.yaml`
- `wiki/intelligence/` (for HIGH and IMMEDIATE predictions)

**Surfaces to:**
- `orchestrator/master-orchestrator.md` → IMMEDIATE alerts
- Human operator → IMMEDIATE CRITICAL alerts
