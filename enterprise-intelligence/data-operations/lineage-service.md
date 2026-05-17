# Lineage Service

## Role
Provides the operational interface to the lineage graph maintained by data-lineage-tracker.md. Handles lineage record ingestion from all pipeline runs, serves lineage queries, performs impact analyses, and maintains graph integrity and completeness metrics.

## Service Operations

```
INGEST:
  POST /lineage/records        ← pipeline engine submits record on step completion
  POST /lineage/batch          ← batch ingestion for historical backfill (T3+)

QUERY:
  GET /lineage/{entity_id}/upstream?depth=N     ← ancestors up to N hops
  GET /lineage/{entity_id}/downstream?depth=N   ← descendants up to N hops
  GET /lineage/{entity_id}/path?to={entity_id}  ← transformation paths between entities
  GET /lineage/{entity_id}/impact               ← downstream impact set

AUDIT:
  GET /lineage/{entity_id}/history              ← full transformation history
  GET /lineage/{entity_id}/provenance?at={ISO}  ← state of lineage at a point in time
  GET /lineage/compliance/high-risk             ← lineage completeness for HIGH_RISK AI entities
```

## Lineage Graph Integrity

```
INTEGRITY CHECKS (daily automated):
  1. Hash chain validation: each record's prev_hash must match hash of preceding record
  2. Entity reference integrity: all entity_ids in lineage must exist in catalog
  3. Orphan detection: entities in lineage graph not in catalog (schema drift)
  4. Gap detection: pipeline runs with no lineage record (unexpected missing records)
  5. Circular reference detection: DFS traversal; any cycle = CRITICAL alert

INTEGRITY FAILURES:
  HASH_CHAIN_BREAK:    CRITICAL; T4 alert; affected lineage range quarantined for investigation
  ENTITY_NOT_IN_CATALOG: WARNING; sync triggered
  ORPHAN_DETECTED:     WARNING; auto-delete orphan record after 7 days if unresolved
  GAP_DETECTED:        HIGH; alert pipeline owner; mark affected downstream entities LINEAGE_INCOMPLETE
  CIRCULAR_REFERENCE:  CRITICAL; T3 alert; pipeline blocked until resolved
```

## Lineage Completeness Metrics

```
COMPLETENESS:
  completeness_score = entities_with_complete_lineage / total_active_entities

COMPLETE LINEAGE DEFINED AS:
  - At least one lineage record per pipeline run touching the entity
  - All upstream entities traceable to source (or INGEST record)
  - No LINEAGE_INCOMPLETE flags in active lineage chain

TARGET:
  Overall: >= 0.95
  HIGH_RISK AI entities: 1.00 (mandatory; any gap = COMPLIANCE_FINDING)

WEEKLY COMPLETENESS REPORT:
  - completeness_score (with trend)
  - Entities with incomplete lineage: list
  - HIGH_RISK entities with gaps: highlighted; remediation deadline 48hr
```

## Lineage-Driven Impact Analysis

```
IMPACT_ANALYSIS USE CASES:
  1. SCHEMA_CHANGE:        "If I change schema of entity X, what breaks downstream?"
  2. QUALITY_DEGRADATION:  "Entity X quality dropped; what downstream entities are at risk?"
  3. INCIDENT_ANALYSIS:    "Bad data in entity X; trace all derived entities that may be corrupted"
  4. REGULATORY_INQUIRY:   "Show all entities derived from personal data source Y"
  5. COST_ATTRIBUTION:     "Which upstream entities contribute most to cost of entity Z?"

OUTPUT FORMAT:
  impact_set:
    - entity_id: string
      hops_from_source: number
      relationship: string        # "derived via pipeline X step Y"
      impact_type: SCHEMA_BREAKING | QUALITY_AFFECTED | POTENTIALLY_CORRUPTED
      consumer_teams: [team_id]   # teams to notify
      estimated_record_count: number
```

## Erasure Support

```
GDPR ERASURE WORKFLOW (via data-lifecycle-manager.md → lineage-service):
  1. Receive: subject_id, pii_fields, erasure_scope
  2. Query: all entities containing subject_id PII (catalog + lineage)
  3. Build: erasure graph in topological order (source → derived)
  4. For each entity:
     a. Verify entity supports record-level deletion
     b. Identify records matching subject_id
     c. Generate deletion instruction: entity_id, record_ids, field_mask
  5. Return: erasure plan (human reviews before execution if > 100 entities)
  6. Execute: in topological order (delete source, then derived)
  7. Record: erasure-proof entry per entity (entity_id, subject_id_hash, erased_at, record_count)
  8. Verify: spot-check 5% of erasure completeness
```

## Persistence
`memory/data-operations/lineage-completeness-metrics.yaml`
`memory/data-operations/integrity-check-results.yaml`
`memory/data-operations/impact-analysis-log.jsonl`
`memory/data-operations/erasure-audit.jsonl`
