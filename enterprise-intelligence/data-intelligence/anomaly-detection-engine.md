# Anomaly Detection Engine

## Role
Continuously monitors all data streams, pipeline outputs, quality metrics, and organizational signals for anomalies. Combines statistical methods with AI pattern recognition to detect data quality regressions, operational issues, compliance risks, and behavioral anomalies before they cause downstream harm.

## Anomaly Types

```
TYPE                    DETECTION METHOD              PRIORITY
──────────────────────────────────────────────────────────────────────────
DATA_QUALITY            Statistical baseline + rules  HIGH
VOLUME_SPIKE            Z-score on event/record count HIGH
SCHEMA_DRIFT            Schema diff vs. registered    CRITICAL
LATENCY_REGRESSION      Baseline + trend analysis     MEDIUM
COST_SPIKE              Budget vs. rolling avg        MEDIUM
BEHAVIORAL              AI pattern recognition        HIGH
COMPLIANCE_SIGNAL       Rule-based trigger            CRITICAL
PERFORMANCE_DEGRADATION Baseline comparison           MEDIUM
```

## Detection Algorithms

```
STATISTICAL METHODS:
  Z_SCORE:          (value - rolling_mean) / rolling_std; alert if |z| > threshold
  IQR:              values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]; robust to outliers
  ISOLATION_FOREST: unsupervised; effective for high-dimensional anomalies
  EWMA:             exponentially weighted moving average; fast response to recent drift
  CUSUM:            cumulative sum; detects gradual drift not visible in point-in-time

THRESHOLDS BY SENSITIVITY:
  LOW:     |z| > 4.0   (few alerts; high precision)
  MEDIUM:  |z| > 3.0   (balanced; default)
  HIGH:    |z| > 2.0   (early warning; higher false positive rate)

AI METHODS:
  PATTERN RECOGNITION: claude-haiku-4-5-20251001 evaluates context + history
  USE CASES: behavioral anomalies in agent outputs, unusual access patterns, semantic drift
  CONFIDENCE THRESHOLD: 0.75 to surface; 0.90 to auto-alert
```

## Anomaly Record Schema

```yaml
anomaly_record:
  anomaly_id: string
  detected_at: ISO8601
  type: ANOMALY_TYPE
  
  entity:
    entity_id: string            # data entity, metric, or pipeline
    context: string              # additional context
  
  signal:
    metric: string               # metric name
    observed_value: number
    baseline_value: number
    deviation_score: number      # z-score or isolation score
    method: string               # detection algorithm used
  
  severity: INFO | WARNING | HIGH | CRITICAL
  
  ai_assessment:
    enabled: boolean
    confidence: number
    probable_cause: string
    recommended_action: string
  
  status: OPEN | INVESTIGATING | RESOLVED | FALSE_POSITIVE
  
  resolution:
    resolved_at: ISO8601
    resolution_type: FIXED | FALSE_POSITIVE | ACCEPTED_CHANGE | ESCALATED
    root_cause: string
```

## Alert Routing

```
SEVERITY      ROUTING                          SLA
────────────────────────────────────────────────────────────────
INFO          Log only; dashboard display      N/A
WARNING       Notify entity steward            Review within 4hr
HIGH          Notify steward + T2 owner        Acknowledge within 1hr; resolve 4hr
CRITICAL      Notify T3 + event bus alert      Acknowledge within 15min; resolve 1hr
```

## Baseline Management

```
BASELINE COMPUTATION:
  Initial: 7-day rolling window (computed on first 7 days of data)
  Update: sliding window; recalculated every hour
  Baseline version: kept for 90 days (enables retrospective analysis)

BASELINE EXCLUSIONS:
  Known maintenance windows → excluded from baseline
  Approved batch jobs → expected volume spikes excluded
  Holiday/off-peak periods → segmented baseline

BASELINE RESET TRIGGER:
  Major pipeline change → T3 resets baseline
  New product launch → T3 flags expected spike; baseline paused for 24hr
```

## False Positive Learning

```
FEEDBACK LOOP:
  When anomaly resolved as FALSE_POSITIVE:
    → record: entity_id, method, threshold, context
    → adjust sensitivity: lower sensitivity for this entity + context
    → retrain AI method with corrected label
  
  FALSE_POSITIVE RATE TARGETS:
    CRITICAL anomalies: < 5% false positives
    HIGH anomalies:     < 15% false positives
    WARNING anomalies:  < 30% false positives (acceptable for early warning)
  
  IF actual rate > 2× target: governance review; threshold recalibration required
```

## Persistence
`memory/data-intelligence/anomaly-records.yaml`
`memory/data-intelligence/anomaly-history.jsonl`
`memory/data-intelligence/baseline-models.yaml`
`memory/data-intelligence/false-positive-log.jsonl`
