# Simulation Results Model

**System ID:** `simulation-results-model`
**Role:** Canonical schemas for simulation output — how results are structured, stored, compared, and surfaced so findings are actionable and reproducible
**Storage:** `memory/digital-twins/simulation-results/[result-id].yaml`

---

## Purpose

Simulation results must be more than numbers. They must be interpretable by agents and humans alike, comparable across simulation runs, linked back to their source scenarios, and structured to drive action. This model defines how all results are stored and presented.

---

## Full Result Schema

`memory/digital-twins/simulation-results/[result-id].yaml`:

```yaml
SimulationResult:
  result_id: string                  # "simr-[uuid]"
  scenario_id: string                # Links to Scenario in scenario-model.md
  
  # Execution metadata
  executed_at: datetime
  execution_duration_seconds: float
  iterations_executed: integer
  convergence_reached: boolean       # Did the Monte Carlo converge?
  convergence_metric: float          # Variance of outcome at convergence (lower = better)
  
  # Baseline (what the twins looked like before perturbation)
  baseline_snapshot:
    org_health_score: float | null
    workflow_gate_pass_rate: float | null
    delivery_confidence_score: float | null
    runtime_saturation_pct: float | null
    # Additional baseline metrics as relevant
  
  # Outcome distribution (the core results)
  outcomes: OutcomeDistribution
  
  # Findings
  key_findings: [Finding]
  bottlenecks_identified: [Bottleneck]
  risks_identified: [Risk]
  
  # Recommendations
  recommendations: [Recommendation]
  
  # Sensitivity analysis results (if requested)
  sensitivity: SensitivityResult | null
  
  # Data lineage
  twins_used: [string]
  twin_snapshot_timestamps: { [twin_id]: datetime }
  perturbations_applied: [string]    # perturbation_ids
  
  # Quality flags
  data_quality_warnings: [string]
  confidence_level: "HIGH | MEDIUM | LOW | DEGRADED"
  confidence_rationale: string
```

---

## Outcome Distribution Schema

The probabilistic outcomes of the simulation:

```yaml
OutcomeDistribution:
  # Key outcomes across all objectives
  outcomes_by_objective:
    "[objective_id]":
      metric_name: string
      unit: string
      
      # Percentile distribution
      p10: float                     # Pessimistic (10th percentile)
      p25: float
      p50: float                     # Expected (median)
      p75: float
      p90: float                     # Optimistic (90th percentile)
      
      # Distribution shape
      mean: float
      std_dev: float
      skewness: float                # Positive = right-skewed (optimistic outliers)
      
      # vs. baseline
      baseline_value: float
      change_from_baseline: float    # Absolute change (p50 - baseline)
      change_from_baseline_pct: float
      direction: "IMPROVEMENT | NEUTRAL | DEGRADATION"
      
      # Threshold assessment
      threshold_breach_probability: float  # P(exceeds warning threshold)
      critical_threshold_probability: float  # P(exceeds critical threshold)
  
  # Overall outcome classification
  overall_outcome: "POSITIVE | NEUTRAL | NEGATIVE | MIXED"
  overall_outcome_confidence: "HIGH | MEDIUM | LOW"
  
  # Time-series outcomes (how metrics evolve over the simulation time horizon)
  time_series:
    "[metric_name]":
      timestamps: [integer]          # Days from simulation start
      p10_series: [float]
      p50_series: [float]
      p90_series: [float]
```

---

## Finding Schema

A non-obvious insight extracted from simulation results:

```yaml
Finding:
  finding_id: string
  finding_type: "THRESHOLD_BREACH | UNEXPECTED_OUTCOME | SENSITIVITY_INSIGHT | NONLINEARITY | INTERACTION_EFFECT"
  
  title: string                      # ≤ 10 words
  description: string                # 2-3 sentences explaining what was found
  
  evidence:
    metric_affected: string
    baseline_value: float
    simulated_value_p50: float
    change_magnitude: float
    change_significance: "HIGH | MEDIUM | LOW"
    threshold_breached: string | null
  
  context: string                    # Why this matters — what it implies
  
  surprise_level: "EXPECTED | SOMEWHAT_SURPRISING | VERY_SURPRISING"
  # EXPECTED: simulation confirms what we expected
  # SOMEWHAT_SURPRISING: result is directionally expected but magnitude differs
  # VERY_SURPRISING: result contradicts prior belief or shows non-obvious interaction
  
  confidence: "HIGH | MEDIUM | LOW"
  time_to_impact_days: integer | null  # When this finding manifests
```

---

## Bottleneck Schema

System constraints identified during simulation:

```yaml
Bottleneck:
  bottleneck_id: string
  resource: string                   # What is constrained
  location: string                   # Where in the system (org unit, step type, etc.)
  
  bottleneck_type: "CAPACITY | QUALITY | GOVERNANCE | DEPENDENCY | COORDINATION | RUNTIME"
  
  onset:
    onset_probability: float         # Probability this bottleneck emerges
    onset_day_p50: integer           # Expected day of onset (simulation time)
    onset_day_p10: integer           # Pessimistic onset
    onset_day_p90: integer           # Optimistic onset (later = better)
  
  severity: "CRITICAL | HIGH | MEDIUM | LOW"
  
  impact:
    primary_metric_affected: string
    impact_magnitude_p50: float
    impact_description: string       # "Reduces throughput by ~X%", "Increases lead time by Y days"
  
  upstream_causes: [string]          # What triggers this bottleneck
  downstream_effects: [string]       # What cascades from this bottleneck
  
  resolution:
    resolution_actions: [string]     # What can prevent or relieve this bottleneck
    resolution_lead_time_days: integer  # How long resolution takes
    resolution_confidence: "HIGH | MEDIUM | LOW"
```

---

## Risk Schema

Probability-weighted risks identified in simulation:

```yaml
Risk:
  risk_id: string
  risk_name: string
  risk_type: "SCHEDULE | QUALITY | CAPACITY | GOVERNANCE | OPERATIONAL | STRATEGIC"
  
  probability: float                 # 0.0-1.0
  severity_if_occurs: "CRITICAL | HIGH | MEDIUM | LOW"
  expected_impact: float             # probability × severity_numeric
  
  trigger_conditions: [string]       # What must happen for this risk to materialize
  early_warning_signals: [string]    # What to watch that precedes this risk
  
  time_window:
    earliest_onset_days: integer
    most_likely_onset_days: integer
    latest_onset_days: integer
  
  mitigation:
    preventable: boolean
    mitigation_actions: [string]
    mitigation_cost_days: integer    # Effort to implement mitigation
    mitigation_effectiveness: float  # Expected risk reduction (0.0-1.0)
    residual_risk_after_mitigation: float
```

---

## Recommendation Schema

Actionable recommendations derived from simulation findings:

```yaml
Recommendation:
  recommendation_id: string
  priority: integer                  # 1 = most important
  urgency: "IMMEDIATE | 30_DAYS | 90_DAYS | MONITOR_ONLY"
  
  action: string                     # Specific action to take (imperative sentence)
  rationale: string                  # Why this action addresses the finding
  expected_impact: string            # What improves if action is taken
  
  # Quantified impact (from simulation)
  impact_simulation:
    metric: string
    baseline_value: float
    expected_value_after_action_p50: float
    improvement_confidence: "HIGH | MEDIUM | LOW"
  
  # Implementation
  owner: string                      # Which team/role should implement
  effort_estimate: "HOURS | DAYS | WEEKS | MONTHS"
  dependencies: [string]             # What must happen first
  risks_if_ignored: [string]         # What happens if this recommendation is not followed
  
  linked_findings: [string]          # finding_ids that support this recommendation
  linked_risks: [string]             # risk_ids this recommendation mitigates
```

---

## Sensitivity Result Schema

How much each parameter affects the outcome:

```yaml
SensitivityResult:
  method: "one_at_a_time | sobol | morris"
  
  parameter_sensitivities:
    "[parameter_name]":
      parameter_description: string
      nominal_value: float
      
      # How outcomes change as parameter varies ±variation_range
      sensitivity_index: float       # 0.0-1.0 — higher = more sensitive
      sensitivity_rank: integer      # 1 = most sensitive
      
      outcome_at_low: float          # Outcome when parameter is at lower bound
      outcome_at_nominal: float      # Outcome at base value
      outcome_at_high: float         # Outcome when parameter is at upper bound
      
      # Non-linearity
      is_nonlinear: boolean          # Does the relationship curve significantly?
      critical_threshold: float | null  # Value at which behavior changes dramatically
  
  # Most important finding: which 2-3 parameters matter most
  top_sensitive_parameters: [string]
  sensitivity_insight: string        # One sentence: what this analysis revealed
```

---

## Result Comparison

When comparing two simulation results (e.g., before vs. after an intervention):

```yaml
ResultComparison:
  comparison_id: string
  result_a_id: string               # Baseline result
  result_b_id: string               # Intervention result
  compared_at: datetime
  
  net_changes:
    "[metric_name]":
      a_value_p50: float
      b_value_p50: float
      absolute_change: float
      relative_change_pct: float
      direction: "IMPROVEMENT | NEUTRAL | DEGRADATION"
      statistical_significance: "HIGH | MEDIUM | LOW | NOT_SIGNIFICANT"
  
  net_assessment: string            # Overall: is intervention A good idea?
  tradeoffs: [string]               # What improved vs. what degraded
  recommendation: string            # One sentence: take this action or not?
```

---

## Storage and Indexing

Results are stored at `memory/digital-twins/simulation-results/[result-id].yaml`.

Index maintained at `memory/digital-twins/simulation-index.yaml`:

```yaml
simulation_index:
  - result_id: string
    scenario_id: string
    scenario_name: string
    scenario_class: string
    executed_at: datetime
    overall_outcome: string
    confidence_level: string
    key_finding_summary: string      # ≤ 20 words
    twins_used: [string]
    recommendations_count: integer
```

---

## Integration

**Written by:**
- `simulation-systems/simulation-engine.md` → all simulation results
- All simulation subsystems → contribute their domain-specific outcomes

**Read by:**
- `predictive-intelligence/prediction-engine.md` → consumes simulation results for predictions
- `forecasting/roadmap-forecaster.md` → delivery probability results
- `forecasting/release-risk-simulator.md` → risk assessment results
- All reporting consumers → human-facing summaries
- `wiki/intelligence/` → stored as intelligence packages
