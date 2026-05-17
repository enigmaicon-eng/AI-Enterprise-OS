# Rollout Forecaster

**System ID:** `rollout-forecaster`
**Role:** Forecasts phased rollout timelines, adoption curves, and rollback risk for feature releases — enabling confident decisions about rollout pace, feature flag controls, and rollback thresholds
**Output:** Phased rollout timeline, adoption probability curve, rollback trigger conditions

---

## Purpose

Shipping is not the end — it's the beginning of rollout. A feature released to 100% of users immediately is a fundamentally different risk profile from one rolled out in 5% increments over 4 weeks. The rollout forecaster models adoption curves, risk accumulation during rollout, and rollback thresholds so rollout plans can be evidence-based rather than instinctive.

---

## Rollout Plan Model

```yaml
RolloutPlan:
  release_id: string
  feature_title: string
  
  rollout_strategy: "immediate | phased | canary | dark_launch | feature_flag"
  
  phases:
    - phase_number: integer
      phase_name: string             # e.g., "Internal", "Beta", "10%", "50%", "100%"
      target_audience_pct: float     # Cumulative % of users at end of phase
      target_audience_description: string
      
      start_condition: string        # When this phase begins
      success_criteria: [string]     # What must be true to advance to next phase
      rollback_criteria: [string]    # What triggers rollback
      
      min_observation_hours: integer # Minimum time in phase before advancing
      max_observation_hours: integer # Maximum time — force decision either way
      
      risk_level: "LOW | MEDIUM | HIGH | CRITICAL"
      
  rollout_velocity_target: string    # "aggressive | moderate | conservative"
```

---

## Adoption Curve Model

How features typically achieve adoption:

```
ADOPTION MODELS:

# Model A: S-Curve (typical for features requiring behavior change)
adoption(t) = max_adoption / (1 + exp(-k × (t - t_midpoint)))
WHERE:
  k = adoption_rate (steepness of S-curve)
  t_midpoint = days until 50% of max_adoption is reached
  max_adoption = ultimate adoption ceiling (may be < 100% due to opt-outs)

# Model B: Immediate (typical for features users discover immediately)
adoption(t) = max_adoption × (1 - exp(-lambda × t))
WHERE lambda = adoption rate (larger = faster to max)

# Model C: Step function (forced adoption at rollout gate)
adoption(t) = rollout_pct at current phase  # Controlled by rollout plan, not organic

# Select model based on feature_type:
feature_type_to_model:
  "new_capability": "s_curve"       # Users discover and adopt gradually
  "replacement": "immediate"        # Users encounter the change immediately
  "opt_in": "s_curve"              # Organic adoption
  "rollout_controlled": "step"      # Adoption = rollout %, fully controlled
```

---

## Risk Accumulation Model

During rollout, risk accumulates as more users are exposed:

```
FOR each rollout phase:
  exposed_users = total_users × phase.target_audience_pct
  
  # Known defect risk: if there are latent bugs, more exposure = more incidents
  incident_probability_per_user_per_day = baseline_incident_rate × (1 + feature_complexity_factor)
  expected_incidents_in_phase = exposed_users × incident_probability × observation_days
  
  # Unknown defect risk: things that only emerge at scale
  tail_risk_factor = 1 + LOG10(exposed_users / initial_exposure)
  
  # Rollback cost: higher at later phases (more users affected, harder to unwind)
  rollback_cost_factor = (phase.target_audience_pct / initial_rollout_pct) × 2
  
  # Phase risk score
  phase_risk_score = incident_probability × tail_risk_factor × rollback_cost_factor
```

---

## Rollback Trigger Model

When should rollout be paused or reversed?

```
ROLLBACK TRIGGERS (statistical process control):

# Error rate spike
baseline_error_rate = pre_rollout error rate
observation_window = last N hours in current phase

current_error_rate = incidents_in_window / (exposed_users × hours)

IF current_error_rate > baseline_error_rate × 3:
  → P95 control limit breached — immediate investigation
IF current_error_rate > baseline_error_rate × 2:
  → Warning threshold — monitor closely, prepare rollback

# Statistical significance test (before rolling back, confirm the spike is real)
# Use sequential probability ratio test (SPRT) to detect genuine degradation
# without waiting for a full observation window

ROLLBACK TRIGGER MODEL:
  p0 = baseline_error_rate (null hypothesis: feature is fine)
  p1 = acceptable_degradation_rate (alternative hypothesis: feature is bad)
  
  # SPRT log-likelihood ratio
  lr[n] = SUM(log(P(observation_i | p1) / P(observation_i | p0)) for i in 1..n)
  
  IF lr[n] > log(beta/(1-alpha)):   → Conclude: feature is degraded → ROLLBACK
  IF lr[n] < log((1-beta)/alpha):   → Conclude: feature is fine → CONTINUE
  ELSE:                             → Continue observing
```

---

## Phased Rollout Simulation

Monte Carlo simulation of phased rollout outcomes:

```
FOR each iteration:
  
  # Sample: Does each phase succeed or trigger rollback?
  FOR each phase:
    # Sample incident rate for this phase
    actual_incident_rate = sample(LogNormal(expected_rate, variance))
    
    # Does an incident occur in observation window?
    incident_occurs = (actual_incident_rate × phase_users × observation_days) > 0
    
    # Does incident trigger rollback threshold?
    triggers_rollback = (actual_incident_rate / baseline_rate) > rollback_threshold_multiplier
    
    IF triggers_rollback:
      rollout_outcome[iter] = {
        completed_successfully: False,
        rollback_at_phase: phase.phase_number,
        rollback_users_affected: exposed_users,
        rollback_at_pct: phase.target_audience_pct
      }
      BREAK
    
    # Advance to next phase after observation window
    days_in_phase = observation_window_days
    
  IF all phases complete:
    rollout_outcome[iter] = {
      completed_successfully: True,
      total_duration_days: SUM(phase.duration for phase in phases)
    }

# Results
success_probability = fraction(completed_successfully == True)
avg_completion_days_p50 = median(total_duration_days for successful outcomes)
rollback_probability = 1 - success_probability
rollback_at_phase_distribution = distribution of rollback phase numbers
```

---

## Rollout Forecast Output

```yaml
RolloutForecast:
  forecast_id: string
  release_id: string
  forecasted_at: datetime
  
  # Success probability
  successful_rollout_probability: float
  rollback_probability: float
  
  # Timeline forecast
  timeline_forecast:
    p10_completion_days: integer     # Pessimistic (fast phases but high risk)
    p50_completion_days: integer     # Expected
    p90_completion_days: integer     # Optimistic (cautious observation)
    
    # Per-phase timing
    phase_forecasts:
      - phase_number: integer
        phase_name: string
        expected_start_day: integer
        expected_duration_days: integer
        advance_probability: float   # P(phase succeeds and we advance)
  
  # Adoption forecast
  adoption_forecast:
    model_used: string
    day_7_adoption_pct_p50: float
    day_30_adoption_pct_p50: float
    day_90_adoption_pct_p50: float
    max_adoption_pct: float
    time_to_50pct_adoption_days: integer
  
  # Risk assessment by phase
  phase_risks:
    - phase_number: integer
      phase_name: string
      rollback_trigger_probability: float
      expected_incidents_if_deployed: float
      risk_level: "LOW | MEDIUM | HIGH | CRITICAL"
  
  # Rollback scenario
  rollback_assessment:
    rollback_probability: float
    most_likely_rollback_phase: integer
    rollback_impact_estimate: string  # "~X% of users affected for ~Y hours"
    rollback_readiness: "READY | NEEDS_PREPARATION | NOT_READY"
  
  # Recommendations
  recommended_rollout_velocity: "AGGRESSIVE | MODERATE | CONSERVATIVE | PAUSE"
  rollback_thresholds: [string]      # Specific metrics and values to watch
  primary_recommendation: string
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`, `predictive-intelligence/prediction-engine.md`
**Reads from:**
- `digital-twins/delivery-twin.md` (release pipeline, history)
- `digital-twins/workflow-twin.md` (quality metrics, recent failures)
- `forecasting/release-risk-simulator.md` (release risk score, hard blockers)

**Writes to:**
- `memory/digital-twins/forecasts/rollout-forecast-[id].yaml`

**Output consumed by:**
- Orchestrator and release agent for rollout decision-making
- `predictive-intelligence/governance-risk-predictor.md`
