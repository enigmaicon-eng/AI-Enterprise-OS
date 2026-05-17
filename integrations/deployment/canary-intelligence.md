# Canary Intelligence

## Role
Smart canary analysis system that monitors new deployments during the canary phase, evaluates metric stability, detects regressions early, and automatically promotes or rolls back based on statistical confidence rather than fixed thresholds.

## Canary Configuration

```yaml
canary_config:
  traffic_split_pct: 5              # initial canary traffic percentage
  min_duration_min: 30              # minimum canary observation window
  max_duration_min: 240             # maximum before forced decision
  min_samples: 50                   # minimum requests before evaluation
  
  auto_promote_threshold: 0.95      # confidence to auto-promote
  auto_rollback_threshold: 0.20     # confidence to auto-rollback (below = rollback)
  human_review_zone: [0.20, 0.95]   # gray zone → human decision required
  
  metric_weights:
    error_rate: 0.40
    p95_latency: 0.25
    quality_score: 0.25
    resource_efficiency: 0.10
```

## Canary Evaluation Algorithm

### Metric Comparison (Bayesian)
```
FOR each monitored metric:
  baseline_distribution = N(μ_pre, σ_pre)  # from pre-deployment window
  canary_distribution   = N(μ_canary, σ_canary)  # from canary window

  improvement_probability = P(canary is at least as good as baseline)
  
  GOOD:     improvement_probability >= 0.90
  NEUTRAL:  improvement_probability 0.70-0.89
  BAD:      improvement_probability 0.50-0.69
  CRITICAL: improvement_probability < 0.50  → immediate rollback signal
```

### Composite Canary Score
```
canary_score = Σ(metric_weight × improvement_probability)

PROMOTE (auto):   canary_score >= 0.95 AND no CRITICAL individual metric
ROLLBACK (auto):  canary_score < 0.20 OR any CRITICAL individual metric
HUMAN_REVIEW:     canary_score 0.20-0.94
```

### Anomaly Detection (runs in parallel)
```
SPIKE_DETECTOR: sudden jump in error_rate > 3× baseline in 5min → immediate rollback signal
DRIFT_DETECTOR: gradual error_rate increase > 10% over canary window → flag for review
OUTLIER_DETECTOR: single metric 5σ from baseline → flag regardless of composite score
```

## Traffic Ramp Logic

```
IF canary_score stable >= 0.85 after min_duration:
  ramp 5% → 15% → hold 15min → check → 30% → hold 15min → check → 50%
  (full rollout handled by rollout-controller.md after canary completes)

IF canary_score shows improvement trend but not yet at 0.95:
  extend canary window by 30min (max 2 extensions)
```

## Automatic Rollback Protocol

```
TRIGGER: auto_rollback condition met
STEPS:
  1. switch ALL traffic back to rollback_version (atomic, < 10s)
  2. emit: deployment.canary_failed event → deployment-orchestrator
  3. record: exact metrics at time of rollback decision
  4. generate: canary_failure_report (metrics, anomalies, recommendation)
  5. notify: deployment owner + T3 operations

POST-ROLLBACK:
  deployment status → CANARY_FAILED (not deleted; remains for investigation)
  component pinned to rollback_version until root cause addressed
```

## Canary Intelligence Report
```yaml
canary_report:
  deployment_id: string
  canary_start: ISO8601
  canary_end: ISO8601
  total_canary_requests: number
  
  metric_results:
    error_rate: {baseline, canary, improvement_probability, verdict}
    p95_latency_ms: {baseline, canary, improvement_probability, verdict}
    quality_score: {baseline, canary, improvement_probability, verdict}
    resource_efficiency: {baseline, canary, improvement_probability, verdict}
  
  composite_score: number
  anomalies_detected: [string]
  
  decision: PROMOTED | ROLLED_BACK | HUMAN_REVIEW_REQUIRED
  decision_confidence: number
  decision_rationale: string
```

## Persistence
`memory/deployment-intelligence/canary-analyses.yaml`
`memory/deployment-intelligence/canary-history.jsonl`
