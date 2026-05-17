# Outcome Probability Modeler
**ID:** SI-SCEN-004 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Builds and maintains calibrated probability distributions over strategic outcomes. Integrates with the digital twin system for quantitative simulation, applies Bayesian updating as new evidence arrives, and provides confidence-interval bounded forecasts for all active scenarios and strategic options.

---

## Modeling Approach

The modeler uses a layered approach, applying whichever methods the available data supports:

| Method | Data Requirements | Confidence Band |
|--------|------------------|----------------|
| Base Rate Reference | Historical precedent data | Medium (0.45–0.70) |
| Analogical Reasoning | Comparable prior cases ≥ 3 | Medium-High (0.55–0.75) |
| Structural Model | Defined causal DAG | High if calibrated (0.65–0.85) |
| Monte Carlo | Defined uncertainty distributions | High (0.70–0.90) |
| Expert Ensemble | Multiple T3+ agent assessments | High (0.70–0.90) |
| Digital Twin Simulation | Live twin states + perturbation model | Very High (0.75–0.92) |

When multiple methods are available, models are ensembled via weighted average (weights calibrated monthly from historical forecast accuracy).

---

## Probability Distribution Schema

```yaml
outcome_distribution:
  dist_id: OPD-{YYYY}-{seq}
  for_entity: SCP-* | OPT-* | WG-*
  outcome_dimension: REVENUE | MARKET_SHARE | TIMELINE | COST | CAPABILITY | RISK_LEVEL
  
  method: BASE_RATE | ANALOGICAL | STRUCTURAL | MONTE_CARLO | ENSEMBLE | DIGITAL_TWIN
  
  # Distribution representation
  distribution_type: POINT | INTERVAL | FULL
  
  point_estimate: number | null
  
  interval:
    p10: number                          # pessimistic
    p50: number                          # central estimate
    p90: number                          # optimistic
    unit: string
    
  full_distribution:
    type: NORMAL | LOGNORMAL | TRIANGULAR | BETA | EMPIRICAL
    params: {mu: n, sigma: n} | {min: n, mode: n, max: n} | {alpha: n, beta: n}
    
  # World-conditional (from scenario planning)
  world_conditionals:
    - world_id: WLD-A
      conditional_p50: number
      conditional_p10: number
      conditional_p90: number
      world_probability: 0.00–1.00
      
  # Calibration
  confidence: 0.00–1.00
  calibration_basis: string             # how this was derived
  ensemble_weights: {method: weight}    # if ENSEMBLE type
  
  # Tracking
  created_at: ISO8601
  evidence_since: [UIU-*]              # UIUs that triggered Bayesian updates
  last_updated: ISO8601
  next_review: ISO8601
```

---

## Bayesian Update Protocol

When new evidence arrives (new UIU or signal), the modeler applies Bayesian updating:

```
Prior distribution: current OPD-*
Likelihood function: P(evidence | world) for each world
Posterior = Prior × Likelihood / normalization

Update triggers:
  - new UIU with confidence > 0.60 referencing same scenario/option
  - new radar signal P0/P1 in same domain
  - decision outcome from strategic-decision-archive.md (calibration feedback)
  - digital twin state change > 2σ from baseline

Update rules:
  - Maximum single-update shift: 0.25 on any world probability
  - Rapid sequence updates (> 3 in 24 hours) trigger human review flag
  - CRITICAL_DOWNSIDE probability increases > 0.15 trigger P0 alert
```

---

## Scenario Coherence Validation

Before finalizing probability distributions, the modeler checks:
1. All world probabilities sum to 1.00 (±0.01)
2. No world has both very high probability (>0.70) and CRITICAL_DOWNSIDE — these need human review
3. Confidence interval width is appropriate for the method (too-narrow intervals are overconfident)
4. Leading indicators for each world are observable and measurable

Coherence failures block publication until resolved.

---

## Calibration Tracking

**Ground truth logging:** All forecasts are archived with resolution dates. Actual outcomes are compared to forecasts.

**Calibration metrics (monthly):**
- Brier score per outcome dimension
- Calibration curve: are 80% confidence intervals actually 80% accurate?
- Method accuracy by domain (which method works best for which domain?)

**Recalibration triggers:**
- Brier score > 0.25 for any domain over 90 days → method weight adjustment
- Systematic overconfidence (confidence intervals too narrow) → widen by domain-specific factor
- Systematic bias detected → apply bias correction term

**Target:** Expected Calibration Error (ECE) < 0.08 per domain per quarter.
