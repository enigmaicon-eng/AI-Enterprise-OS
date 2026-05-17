# Catalog Manager

## Role
Operational service that maintains the data catalog in real time. Handles entity registration, schema updates, metadata synchronization with live systems, stewardship assignment, and catalog health monitoring. Ensures the catalog is always an accurate, complete, and current inventory of OS data assets.

## Entity Registration

```
REGISTRATION FLOW:
  Source: pipeline engine (new output entity), connector onboarding, manual (T2+)

  1. Validate schema against schema registry
  2. Auto-classify: scan fields for PII indicators; assign data_class
     - PII detected: flag for steward review within 24hr
     - RESTRICTED+ auto-classification: DPO notified for review
  3. Check: duplicate entity (same source + path)
     - Duplicate: merge strategy or flag for steward
  4. Assign tier_required: derived from data_class (PUBLIC=T1, INTERNAL=T1, CONFIDENTIAL=T2, RESTRICTED=T3, TOP_SECRET=T4)
  5. Create catalog entry; generate entity_id
  6. Notify steward team (if CONFIDENTIAL+)
  7. Emit entity.registered event to event bus

AUTO-REGISTERED ENTITIES (no manual action):
  - All pipeline output entities (pipeline engine emits on first write)
  - All connector-synced entities (connector onboarding registers schema)
  - All synthesis outputs (data-synthesis-engine registers on first output)
```

## Metadata Synchronization

```
SYNC SOURCES:
  CONNECTOR_SYNC:   connector reports schema + record count every 6hr
  PIPELINE_SYNC:    pipeline engine updates freshness on every run completion
  QUALITY_SYNC:     quality monitor pushes score updates after each check
  LINEAGE_SYNC:     lineage service pushes consumer_count + popular_joins daily

SCHEMA DRIFT DETECTION:
  Compare live schema (from connector/pipeline) to registered schema
  If fields added: auto-update if INTERNAL or OPERATIONAL; notify steward otherwise
  If fields removed or type changed: SCHEMA_DRIFT alert; steward must confirm; block pipelines until resolved

STALE CATALOG DETECTION:
  Entity not updated by any sync in 7 days: AGING_WARNING to steward
  Entity not updated in 30 days: mark POTENTIALLY_STALE in catalog
  Entity not updated in 90 days: suggest deprecation to steward
```

## Stewardship Management

```
STEWARDSHIP ASSIGNMENT:
  Initial: assigned to registering team's designated data steward
  Transfer: T3 initiates; current steward confirms; new steward accepts
  Orphaned (team dissolved): T4 reassigns to platform team

STEWARD RESPONSIBILITIES (tracked by catalog manager):
  - Classification review within 24hr of registration (CONFIDENTIAL+)
  - Quality issue acknowledgment within 4hr (HIGH+ severity)
  - Annual description accuracy review
  - Schema change approval (BREAKING changes)

STEWARD PERFORMANCE:
  response_rate: acknowledged_issues / total_issues
  review_rate: completed_reviews / due_reviews
  catalog_health_contribution: entity quality avg for owned entities
  Monthly steward report: own catalog health + open tasks
```

## Catalog Health Metrics

```
HEALTH DIMENSIONS:
  completeness:    % entities with description + steward + classification + quality score
  accuracy:        % entities with schema matching live system (no schema drift alerts)
  freshness:       % entities in ACTIVE or AGING stage (not STALE/ARCHIVED)
  stewardship:     % entities with active steward + response_rate >= 0.80

catalog_health_score = completeness×0.30 + accuracy×0.30 + freshness×0.25 + stewardship×0.15

HEALTH THRESHOLDS:
  HEALTHY:  >= 0.85
  DEGRADED: 0.70–0.84
  IMPAIRED: < 0.70 → T3 alert; catalog integrity review required

CATALOG SIZE:
  Auto-archive catalog entries for PURGED entities after 2 years (metadata only retained)
  Orphaned entries (no pipeline consumers for 90d): steward notified; deprecation review
```

## Catalog API

```
GET    /catalog                     ← search + filter (per data-catalog.md)
GET    /catalog/{entity_id}         ← full catalog entry
POST   /catalog                     ← register new entity (T2+)
PUT    /catalog/{entity_id}         ← update metadata (steward or T3+)
PATCH  /catalog/{entity_id}/schema  ← schema update (steward; breaking = T3)
DELETE /catalog/{entity_id}         ← deprecate entry (T3; entity must be PURGED)
GET    /catalog/{entity_id}/history ← full metadata change history
GET    /catalog/health              ← catalog health report
```

## Persistence
`memory/data-operations/catalog-state.yaml`
`memory/data-operations/catalog-change-history.jsonl`
`memory/data-operations/stewardship-records.yaml`
`memory/data-operations/schema-drift-alerts.yaml`
