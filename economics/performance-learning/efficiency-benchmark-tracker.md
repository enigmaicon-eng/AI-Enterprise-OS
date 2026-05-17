# Efficiency Benchmark Tracker

## Role
Tracks OS efficiency improvement over time across all optimization dimensions. Maintains rolling baselines, measures optimization impact, and generates the authoritative efficiency trend report used by the improvement dashboard.

## Tracked Dimensions

```
DIMENSION                   METRIC                              TARGET
────────────────────────────────────────────────────────────────────────────────
WORKFLOW_LATENCY            p95 end-to-end duration (ms)        -20% from baseline
ROUTING_ACCURACY            correct agent selected (%)          >= 0.95
GATE_PASS_RATE              first-pass rate (%)                 >= 0.85
CONTEXT_EFFICIENCY          tokens used / tokens allocated      <= 0.70
RETRY_RATE                  retries per execution               <= 0.05
ESCALATION_RATE             escalations per execution           <= 0.08
COST_PER_WORKFLOW           average token cost                  -15% from baseline
BOTTLENECK_RECURRENCE       recurring bottleneck rate           <= 0.10
AGENT_UTILIZATION           avg utilization across agents       0.60-0.80
GOVERNANCE_LATENCY          p95 approval time (min)             <= 30min
```

## Baseline Management

```
INITIAL_BASELINE: computed from first 7 days of production data
ROLLING_BASELINE: 30-day rolling average, updated daily
BENCHMARK_CADENCE:
  - Daily snapshot: all 10 dimensions
  - Weekly trend report: delta from 7-day-ago snapshot
  - Monthly improvement report: delta from 30-day-ago snapshot
  - Quarterly review: delta from 90-day-ago snapshot
```

## Improvement Attribution

When a metric improves, attribute improvement to optimization source:
```yaml
improvement_record:
  dimension: string
  improvement_pct: number
  measurement_period: ISO8601/ISO8601
  attributable_optimizations: [optimization_id]
  confidence_of_attribution: number    # 0.0-1.0 (causal vs. correlated)
  notes: string
```

## Regression Alert
```
IF any dimension degrades > 5% vs 7-day baseline:
  severity: WARNING
  notify: self-optimization-controller
  auto_investigate: find optimizations activated in last 48hr that touch this dimension

IF any dimension degrades > 15% vs 7-day baseline:
  severity: CRITICAL
  notify: self-optimization-controller + operations console
  pause_new_optimizations: true
  investigate_immediately: true
```

## Benchmark Report Schema
```yaml
benchmark_report:
  generated_at: ISO8601
  period: 7d | 30d | 90d
  overall_efficiency_index: number      # composite 0.0-1.0
  dimension_scores: {dimension: score}
  most_improved: [string]
  most_degraded: [string]
  pending_improvements_estimated_impact_pct: number
  optimizations_applied_this_period: number
  rollbacks_this_period: number
```

## Persistence
`memory/performance-learning/efficiency-benchmarks.yaml`
`memory/performance-learning/benchmark-snapshots.jsonl`
