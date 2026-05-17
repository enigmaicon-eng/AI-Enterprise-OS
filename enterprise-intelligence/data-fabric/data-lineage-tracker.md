# Data Lineage Tracker

## Role
Records and queries the full provenance of every data entity — what it was derived from, what transformations it underwent, and what downstream entities depend on it. Enables impact analysis, audit compliance, and root-cause investigation for data quality issues.

## Lineage Record Schema

```yaml
lineage_record:
  record_id: string              # UUID
  timestamp: ISO8601
  
  transformation:
    pipeline_id: string
    step_id: string
    transformation_type: INGEST | TRANSFORM | AGGREGATE | JOIN | FILTER | SYNTHESIZE | DERIVE
    
  inputs:
    - entity_id: string
      version: string
      classification: data_class
      record_count: number
      snapshot_at: ISO8601
  
  outputs:
    - entity_id: string
      version: string
      classification: data_class
      record_count: number
  
  provenance:
    agent_id: string             # agent that ran this step (if AI-driven)
    workflow_run_id: string
    parameters_hash: string      # SHA-256 of transformation parameters
    code_version: semver         # version of pipeline code
  
  quality_outcome:
    input_quality_scores: {entity_id: number}
    output_quality_score: number
    anomalies_detected: number
  
  audit:
    hash: string                 # SHA-256 of this record
    prev_hash: string            # forms hash chain per entity
    signed_by: string            # agent_id or system
```

## Lineage Graph

```
GRAPH STRUCTURE:
  nodes: data entities (entity_id → catalog entry)
  edges: transformation events (lineage_record)
  direction: source → derived

GRAPH QUERIES:
  upstream(entity_id, depth=N):    all ancestors up to N hops
  downstream(entity_id, depth=N):  all descendants up to N hops
  full_path(source_id, target_id): all transformation paths between two entities
  impact_set(entity_id):           all entities that would be affected if this entity changes

DEPTH LIMITS:
  default: 10 hops
  max: 50 hops
  circular detection: DFS with visited set; circular = LINEAGE_ERROR logged
```

## Impact Analysis Protocol

```
TRIGGER: entity schema changes, quality degradation, data incidents

IMPACT_ANALYSIS(entity_id):
  1. Get downstream(entity_id, depth=50)
  2. For each downstream entity:
     - identify consumer pipelines
     - identify teams/workflows consuming
     - classify impact: SCHEMA_BREAKING | QUALITY_DEGRADED | STALE
  3. Generate impact report:
     - N downstream entities affected
     - N teams notified
     - critical path: longest downstream chain
  4. Notify stewards of affected entities (CONFIDENTIAL+: also notify DPO/CISO)
  5. Log to lineage-impact-events.jsonl
```

## Audit Compliance

```
GDPR RIGHT TO ERASURE:
  Given: subject_id (PII data subject)
  Process: find all entities containing subject_id PII
           trace downstream to all derived entities
           generate erasure scope report
           execute erasure in reverse-topological order
           record erasure proof (entity_id, field, erased_at, verified_by)
  Note: derived aggregates may be irreversible → flag for human review

EU AI ACT ART. 9 (HIGH_RISK AI):
  All input data for HIGH_RISK AI decisions must have complete lineage
  Lineage records: 10-year retention
  Monthly lineage completeness check for HIGH_RISK pipelines
  Missing lineage for HIGH_RISK = COMPLIANCE_FINDING
```

## Persistence
`memory/data-fabric/lineage-graph.yaml`
`memory/data-fabric/lineage-records.jsonl`
`memory/data-fabric/lineage-impact-events.jsonl`
`memory/data-fabric/erasure-records.jsonl`
