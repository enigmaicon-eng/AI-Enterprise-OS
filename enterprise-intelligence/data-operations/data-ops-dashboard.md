# Data Ops Dashboard

## Role
Operational control center for the entire data fabric. Consolidates pipeline status, quality health, lifecycle state, catalog currency, and compliance posture into a single dashboard for data stewards, pipeline owners, and platform operators. Primary tool for day-to-day data operations.

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════╗
║  DATA OPS DASHBOARD                                                   ║
║  Updated: {timestamp}   Operator: {tier}   Catalog health: {score}   ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 1: PIPELINE STATUS                                             ║
║  Running: {N}  Queued: {N}  Failed 24hr: {N}  Avg duration: {N}min  ║
║  SLA on-time rate: {N}%   Active streams: {N}   Lag p95: {N}ms       ║
║  CRITICAL pipelines failing: {N}   Backfill jobs active: {N}         ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 2: DATA QUALITY                                                ║
║  GOLD: {N} ({N}%)  SILVER: {N} ({N}%)  BRONZE: {N}  POOR: {N}       ║
║  Quality drops 24hr: {N}   Active remediation: {N}   SLA breach: {N} ║
║  HIGH_RISK entities below GOLD: {N} [CRITICAL if > 0]                ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 3: CATALOG CURRENCY                                            ║
║  Total entities: {N}   Schema drift alerts: {N}   Stale: {N}         ║
║  Stewardship: {N}%    Pending classification reviews: {N}            ║
║  Orphaned entries: {N}   Deprecation reviews due: {N}                ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 4: LIFECYCLE                                                   ║
║  Active: {N}   Aging: {N}   Archived: {N}   Purged 30d: {N}         ║
║  Archival queue: {N}   Purge queue: {N}   Legal holds: {N}           ║
║  Retention SLA breaches: {N}   Erasure requests open: {N}            ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 5: LINEAGE HEALTH                                              ║
║  Lineage completeness: {N}%   Integrity failures 24hr: {N}           ║
║  HIGH_RISK lineage gaps: {N} [CRITICAL if > 0]                       ║
║  Impact analyses run 7d: {N}   Erasure workflows open: {N}           ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 6: COMPLIANCE POSTURE                                          ║
║  Policy violations 30d: {N}   GDPR erasure requests: {N}open/{N}done ║
║  Art.30 last updated: {date}   EU AI Act HIGH_RISK coverage: {N}%    ║
║  Data contracts: {N}OK / {N}breached                                 ║
╠══════════════════════════════════════════════════════════════════════╣
║  PANEL 7: TOP OPEN ISSUES                                             ║
║  1. [{severity}] {entity_id}: {issue}         Owner: {steward}       ║
║  2. [{severity}] {entity_id}: {issue}         Owner: {steward}       ║
║  3. [{severity}] {entity_id}: {issue}         Owner: {steward}       ║
╚══════════════════════════════════════════════════════════════════════╝
```

## Ops Health Score

```
ops_health_score = pipeline_health×0.30 + quality_health×0.30 + lifecycle_health×0.20 + compliance_health×0.20

THRESHOLDS:
  HEALTHY:   >= 0.85   → green; normal operations
  DEGRADED:  0.70–0.84 → yellow; monitor; address aging issues
  IMPAIRED:  0.55–0.69 → orange; T3 review; new ELEVATED pipelines blocked
  CRITICAL:  < 0.55    → red; T4 alert; all non-CRITICAL pipelines throttled 50%
```

## Automated Actions from Dashboard

```
ALERT THRESHOLDS → AUTO-ACTIONS:
  HIGH_RISK entity quality drop: immediate T3 + pipeline block
  CRITICAL pipeline failed: T2 alert + retry triggered
  Schema drift BREAKING: T3 alert + affected pipelines paused
  Lineage completeness < 0.90: T3 alert; gap-filling job queued
  Legal hold placed: auto-pause all archival + purge for held entities
  Contract breach: notify consumer team + steward; SLA clock starts
```

## Daily Ops Report

```
GENERATED: daily at 06:00 UTC
AUDIENCE: all data stewards + T2+ pipeline owners
SECTIONS:
  1. Previous day pipeline summary (runs, failures, SLA)
  2. Quality changes (new demotions, promotions, breaches)
  3. New catalog entries + schema changes
  4. Open issues needing attention (age + owner)
  5. Upcoming: archival/purge scheduled next 7 days
  6. Compliance: new erasure requests + pending GDPR items
```

## Drill-Down Views

```
1. PIPELINE DRILL:     step-level trace + checkpoint history + resource usage
2. ENTITY DRILL:       quality history chart + schema versions + lineage preview
3. STEWARD WORKQUEUE:  all open issues for a specific steward + SLAs
4. COMPLIANCE DETAIL:  Art.30 excerpt + open findings + erasure audit
5. LIFECYCLE QUEUE:    upcoming archival/purge schedule + approval status
```

## Persistence
`memory/data-operations/ops-dashboard-state.yaml`
`memory/data-operations/daily-ops-reports.jsonl`
`memory/data-operations/ops-health-history.jsonl`
