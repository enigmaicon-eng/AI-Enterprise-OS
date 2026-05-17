# Data Quality Engine

## Role
Continuously measures, enforces, and improves the quality of all data entities in the OS. Applies automated quality checks, tracks quality trends, blocks low-quality data from entering critical pipelines, and routes quality issues for remediation.

## Quality Dimensions

```
DIMENSION         WEIGHT    DESCRIPTION
───────────────────────────────────────────────────────────────────────────
COMPLETENESS      0.30      Non-null rate for required fields
ACCURACY          0.25      Validation rule pass rate
FRESHNESS         0.20      Age vs. freshness_sla_min threshold
CONSISTENCY       0.15      Cross-field and cross-entity consistency rules
UNIQUENESS        0.10      Duplicate record rate (inverse)

quality_score = completeness×0.30 + accuracy×0.25 + freshness×0.20 + consistency×0.15 + uniqueness×0.10
```

## Quality Tiers

```
TIER        SCORE RANGE    PIPELINE ACCESS              ACTION
──────────────────────────────────────────────────────────────────────────
GOLD        >= 0.95        All pipelines + HIGH_RISK AI  None required
SILVER      0.80–0.94      Standard pipelines            Monitor
BRONZE      0.65–0.79      Non-critical pipelines only   Remediation advised
POOR        0.50–0.64      No new pipeline subscriptions  Remediation required
CRITICAL    < 0.50         Blocked from all pipelines    Immediate escalation → T3
```

## Quality Check Definitions

```yaml
quality_check:
  check_id: string
  entity_id: string
  dimension: COMPLETENESS | ACCURACY | FRESHNESS | CONSISTENCY | UNIQUENESS
  check_type: THRESHOLD | RULE | ANOMALY | REFERENTIAL
  
  definition:
    # THRESHOLD: field_name, metric (null_rate|distinct_rate|range), threshold, operator (<|>|=)
    # RULE: field_name, rule_type (REGEX|RANGE|ENUM|CUSTOM), spec
    # ANOMALY: field_name, method (Z_SCORE|IQR|ISOLATION_FOREST), sensitivity (LOW|MEDIUM|HIGH)
    # REFERENTIAL: field_name, reference_entity_id, reference_field
  
  schedule:
    type: CONTINUOUS | HOURLY | DAILY | ON_INGEST
    last_run: ISO8601
    next_run: ISO8601
  
  result:
    pass: boolean
    score: number
    failing_record_count: number
    sample_failing_records: []    # max 5, PII masked
```

## Quality Gate Enforcement

```
PIPELINE QUALITY GATES:
  Before any pipeline step that writes to a CONFIDENTIAL+ entity:
    → run quality checks on input entities
    → IF any input quality_score < pipeline's min_input_quality:
        → BLOCK step; log to quality-gate-events.jsonl
        → notify pipeline owner
        → suggest: run remediation or use last GOLD snapshot

  HIGH_RISK AI PIPELINES:
    → all input entities must be GOLD tier
    → any SILVER input: require T3 approval to proceed
    → BRONZE or below: always blocked

  STANDARD PIPELINES:
    → BRONZE input: warning logged; pipeline continues
    → POOR input: pipeline paused; owner notified
    → CRITICAL input: pipeline blocked
```

## Automated Remediation

```
REMEDIATION STRATEGIES (applied in order):
  1. FILL_NULL:        fill nulls with field default or most-recent valid value
  2. DEDUPLICATE:      remove exact duplicates; flag fuzzy duplicates for review
  3. NORMALIZE:        apply type coercion and format standardization
  4. REJECT_INVALID:   quarantine records failing hard validation rules
  5. REFRESH:          re-ingest from source (if freshness issue)
  6. ESCALATE:         if automated remediation insufficient → T3 data steward

QUARANTINE:
  Failing records moved to quarantine store (classified same as source)
  Quarantine TTL: 30 days (then archived or purged per retention policy)
  Quarantine report: daily to data steward
```

## Quality Trend Monitoring

```
TRACKED:
  - 7-day rolling quality score per entity
  - 30-day trend direction (IMPROVING | STABLE | DEGRADING)
  - quality_drop_alert: score falls > 0.10 in 24hr → CRITICAL alert to steward
  - tier_demotion_alert: entity drops from GOLD/SILVER to BRONZE+ → T2 alert
  - chronic_poor: entity in POOR/CRITICAL for 7+ consecutive days → T3 escalation
```

## Persistence
`memory/data-fabric/quality-scores.yaml`
`memory/data-fabric/quality-check-results.yaml`
`memory/data-fabric/quality-gate-events.jsonl`
`memory/data-fabric/quarantine-records.yaml`
`memory/data-fabric/quality-trend-history.jsonl`
