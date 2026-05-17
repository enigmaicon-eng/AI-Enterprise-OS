# Impact Forecaster

**Component:** RSI-CORE-005 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Forecasts the expected impact, risk, and return on investment for each improvement proposal before authorization. Measures actual outcomes post-implementation and feeds calibration data back to the forecasting model, making predictions more accurate over time (recursive calibration).

---

## Forecast Dimensions

```
DIMENSION           DEFINITION                                    WEIGHT
──────────────────────────────────────────────────────────────────────────────────────────────
Performance gain    Improvement in target metric (%)              30%
Scope of impact     How many systems/teams/workflows affected      20%
Confidence          Evidence strength + historical accuracy        20%
Risk of regression  Probability that other metrics worsen          15%
Time to impact      How quickly improvement materializes           10%
Reversibility       How cleanly rollback restores prior state       5%
```

---

## Forecasting Model

```
FORECAST_SCORE = Σ(dimension × weight)

PERFORMANCE GAIN ESTIMATION:
  Method 1: Historical similarity (improvement-memory.md lookup)
    - Find prior improvements in same domain + type
    - Use median actual outcome of similar completed improvements
    - Adjust by current context factors (scale, complexity)
  Method 2: Regression model (if < 5 similar priors)
    - Input features: bottleneck_severity, affected_signal_deviation, solution_type
    - Output: predicted_improvement_pct with confidence interval
  Combined: weighted average (historical 0.60, regression 0.40 if both available)

RISK OF REGRESSION ESTIMATION:
  Base risk by change_scope:
    FILE: 0.05 | SUBSYSTEM: 0.15 | CROSS_SYSTEM: 0.30 | CONSTITUTIONAL: N/A (HARD_DENIED)
  Modifiers:
    + 0.10 if target system had recent incidents (last 30d)
    + 0.15 if change touches on-call / production path
    - 0.05 if similar change has 0 regressions in memory
    + 0.10 if less than 7d since last change to same subsystem

TIME TO IMPACT:
  TRIVIAL changes: 1–3 days
  SMALL changes: 3–7 days
  MEDIUM changes: 7–14 days
  LARGE changes: 14–30 days
  STRUCTURAL changes: 30–90 days (org changes take time to materialize)
```

---

## ROI Model

```
ROI = (expected_gain × scope_multiplier × confidence) / (effort_cost × risk_adjustment)

EXPECTED_GAIN: performance_gain / 100 × affected_metric_baseline_value
SCOPE_MULTIPLIER: 1.0 (FILE) → 3.5 (CROSS_SYSTEM)
CONFIDENCE: 0.0–1.0
EFFORT_COST: TRIVIAL=1 | SMALL=3 | MEDIUM=10 | LARGE=30 (relative units)
RISK_ADJUSTMENT: 1.0 + risk_of_regression (e.g., 0.15 risk → 1.15 adjustment)

ROI THRESHOLDS:
  >= 5.0: STRONG — prioritize; proceed with standard authorization
  2.0–4.9: GOOD — include in standard planning queue
  1.0–1.9: MARGINAL — batch with other improvements; de-prioritize
  < 1.0: NEGATIVE — reject or defer; not worth the change risk

MINIMUM ROI FOR AUTO-AUTHORIZATION: >= 3.0
```

---

## Forecast Record Schema

```yaml
forecast_record:
  proposal_id: IMP-{YYYY-MM-DD}-{NNN}
  forecast_date: ISO8601
  performance_gain:
    point_estimate: percentage
    confidence_interval_90: [low, high]
    estimation_method: HISTORICAL | REGRESSION | COMBINED
    similar_priors_count: integer
  roi_score: float
  risk_of_regression: float (0.0–1.0)
  time_to_impact_days: integer
  reversibility_score: float (0.0–1.0)
  forecast_confidence: float (0.0–1.0)
  recommendation: STRONG | GOOD | MARGINAL | NEGATIVE
  caveats: list of strings
```

---

## Outcome Measurement

```
T+7 QUICK CHECK:
  Measure: primary target metric vs. baseline
  Flag: if metric has not moved in expected direction → review

T+30 FULL OUTCOME:
  Measure: all signals in affected domain
  Compare: actual vs. forecast (all dimensions)
  Compute: forecast_accuracy_ratio = actual_gain / forecast_gain
    1.0 = perfect | > 1.2 = underestimated | < 0.8 = overestimated

T+90 LONG-TERM:
  Measure: sustained improvement; no regression detected
  Classify: MAINTAINED | DEGRADED | REVERTED | EXCEEDED
  Archive to improvement-memory.md with full outcome record
```

---

## Forecast Calibration (Recursive)

```
CALIBRATION PROCESS (monthly):
  Collect: all proposals with T+30 outcomes (minimum sample: 10)
  Compute: forecast_accuracy_ratio distribution
  Identify: systematic bias
    - Consistently overestimating: reduce gain estimates by domain
    - Consistently underestimating: increase gain estimates by domain
    - Domain-specific bias: apply domain-specific correction factor
  Update: correction_factor_registry (memory/recursive-self-improvement/forecast-calibration.yaml)
  Apply: correction factors to all future forecasts for that domain

CALIBRATION TARGET:
  Forecast accuracy ratio: 0.80–1.20 (within ±20% of actual)
  Systematic bias: < 10% directional error after calibration
  Coverage: 90% of actual outcomes within the 90% confidence interval
```

---

## Forecast Health Metrics

```
METRIC                              TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Forecast accuracy ratio (30d)       0.80–1.20
Systematic bias                     < 0.10 directional
90% CI coverage                     >= 0.90
ROI threshold prediction accuracy   >= 0.80 (correctly classifies STRONG/GOOD/MARGINAL/NEG)
Forecast availability (per proposal) = 100%
Calibration cycle completion        = 100% monthly
```
