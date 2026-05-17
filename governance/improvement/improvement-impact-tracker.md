# Improvement Impact Tracker

## Role
Measures the actual impact of applied optimizations versus their estimates, builds a causal model of which improvements drive real gains, and generates the ground-truth record of the OS's self-improvement over time.

## Impact Measurement Protocol

### Pre/Post Comparison Window
```
BEFORE_WINDOW:  7 days prior to optimization activation
AFTER_WINDOW:   7 days following optimization activation (or until rollback)
METRIC_SAMPLE:  hourly snapshots from efficiency-benchmark-tracker
```

### Causal Attribution Method
```
SIMPLE_ATTRIBUTION:
  IF only one optimization active during measurement window:
    delta = after_avg - before_avg → attributed directly

MULTI_OPTIMIZATION_ATTRIBUTION:
  IF multiple optimizations active simultaneously:
    use: before/after for each optimization's PRIMARY metric only
    flag: POSSIBLY_CONFOUNDED in impact record
    note: actual attribution uncertain; record contribution not causation

COUNTERFACTUAL_ESTIMATION (best effort):
  IF comparable workflow type with no optimization applied in same period:
    control_delta = control_after - control_before
    attributed_delta = treatment_delta - control_delta
    confidence: HIGHER
```

## Impact Record Schema
```yaml
impact_record:
  optimization_id: string
  proposal_id: string
  domain: string
  
  estimated_impact:
    primary_metric: string
    estimated_improvement_pct: number
    estimated_monthly_savings_usd: number
  
  measured_impact:
    primary_metric: string
    actual_improvement_pct: number
    actual_monthly_savings_usd: number
    measurement_confidence: LOW | MEDIUM | HIGH
    confounded: boolean
    measurement_period: ISO8601/ISO8601
  
  accuracy:
    estimate_vs_actual_ratio: number    # 1.0 = perfect
    directionally_correct: boolean      # did it improve at all?
  
  status: MONITORING | CONFIRMED | CONFIRMED_UNDERPERFORMED | ROLLED_BACK
  final_verdict: KEEP | ROLL_BACK | TUNE
  notes: string
```

## Estimation Accuracy Calibration

Track how well the optimization engine estimates impact over time:
```yaml
calibration_stats:
  total_optimizations_measured: number
  directionally_correct_rate: number      # target: > 0.85
  avg_estimate_vs_actual_ratio: number    # target: 0.80-1.20
  overestimate_rate: number               # predicted > 2x actual
  underestimate_rate: number              # actual > 2x predicted
  
  by_domain: {domain: calibration_stats}
```

IF overestimate_rate > 0.30: flag optimization engine for recalibration

## Impact Summary Report (monthly)
```
Total optimizations applied: N
Confirmed improvements: N (X%)
Rolled back: N (X%)
Net efficiency gain: X%
Net cost savings: $X
Most impactful optimization: {title, domain, savings}
Calibration accuracy: X% directionally correct
```

## Persistence
`memory/improvement-governance/impact-records.yaml`
`memory/improvement-governance/calibration-stats.yaml`
`memory/improvement-governance/impact-history.jsonl`  (append-only)
