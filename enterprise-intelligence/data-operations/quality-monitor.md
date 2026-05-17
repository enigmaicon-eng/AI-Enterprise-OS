# Quality Monitor

## Role
Continuously runs quality checks against all registered data entities on their defined schedules. Aggregates quality scores, tracks trends, manages the quality check execution queue, and surfaces actionable quality issues to stewards and pipeline operators.

## Monitoring Architecture

```
MONITORING TIERS (by entity criticality):
  TIER 1 — PRODUCTION CRITICAL:   continuous (every 5 min)
  TIER 2 — HIGH IMPORTANCE:       hourly
  TIER 3 — STANDARD:              every 6 hours
  TIER 4 — LOW PRIORITY:          daily
  ON_INGEST:                      triggered each time new data arrives

ASSIGNMENT RULES:
  GOLD tier target entity:  TIER 1
  Pipeline input entity:    TIER 1 or TIER 2 (based on pipeline class)
  HIGH_RISK AI input:       TIER 1 always
  INTERNAL entity:          TIER 3 default
  ARCHIVED entity:          TIER 4 (freshness always STALE; other dimensions checked)
```

## Quality Check Execution

```
EXECUTION ENGINE:
  Queue: priority queue ordered by (monitoring tier, next_run_time)
  Workers: 4 concurrent quality check workers
  Worker SLA: complete check within monitoring tier interval × 0.8

CHECK EXECUTION SEQUENCE:
  1. Fetch entity current snapshot (or live query for OPERATIONAL)
  2. Run all registered checks for entity (parallelized per dimension)
  3. Compute dimension scores
  4. Compute composite quality_score = weighted sum (per data-quality-engine.md)
  5. Compare to previous score: compute delta
  6. Write result to quality-check-results.yaml
  7. IF score changed significantly (± 0.05): trigger recalculation of downstream entities
  8. IF tier demotion (e.g., SILVER → BRONZE): alert steward immediately
  9. IF quality_score < POOR threshold (0.50): alert T3 + block new pipelines
```

## Quality Score Aggregation

```
ENTITY LEVEL:
  composite = completeness×0.30 + accuracy×0.25 + freshness×0.20 + consistency×0.15 + uniqueness×0.10

PIPELINE LEVEL:
  pipeline_quality = weighted avg quality of all input entities (by usage frequency)

TEAM LEVEL:
  team_data_quality = avg quality of all entities owned by team
  team_rank: rank all teams by team_data_quality (leaderboard on dashboard)

PLATFORM LEVEL:
  platform_quality = avg quality across all ACTIVE entities weighted by consumer_count

TRENDING:
  7d rolling average per entity
  30d trend direction: IMPROVING / STABLE / DEGRADING
```

## Remediation Workflow

```
QUALITY ISSUE DETECTED → REMEDIATION ROUTING:

  COMPLETENESS < threshold:
    → auto-trigger FILL_NULL transformation
    → if fill_null insufficient: alert steward for manual review

  ACCURACY < threshold:
    → quarantine failing records
    → alert steward with sample of failures
    → suggest: re-ingest from source OR reject invalid records

  FRESHNESS STALE:
    → check: is source pipeline running? is schedule correct?
    → if pipeline healthy: re-trigger pipeline
    → if pipeline failing: escalate to T2 pipeline owner

  CONSISTENCY < threshold:
    → identify failing consistency rules
    → alert steward: "N records violate {rule_name}"
    → suggest: normalize transformation + re-validate

  UNIQUENESS < threshold (high duplicate rate):
    → auto-trigger DEDUPLICATE transformation
    → if duplicates > 20% of records: alert steward; hold pipeline writes

ESCALATION:
  Steward unresponsive for 4hr (quality still POOR): T2 escalation
  Steward unresponsive for 8hr (quality still CRITICAL): T3 escalation
```

## Quality SLA Tracking

```
QUALITY SLA:
  GOLD entities must return to GOLD within 2hr of any quality event
  SILVER entities must return to SILVER within 6hr
  BRONZE entities: no automatic SLA; steward manages

SLA BREACH:
  GOLD entity in BRONZE+ for > 2hr: CRITICAL alert to T3 + pipeline owner
  HIGH_RISK AI entity in non-GOLD: immediate T3 alert + pipeline block
```

## Persistence
`memory/data-operations/quality-check-queue.yaml`
`memory/data-operations/quality-execution-log.jsonl`
`memory/data-operations/quality-sla-breaches.jsonl`
`memory/data-operations/remediation-history.yaml`
