# Data Catalog

## Role
Searchable inventory of all data entities, datasets, and streams in the OS. Provides discovery, schema browsing, quality status, lineage previews, and access request workflows. Single source of truth for what data exists and where to find it.

## Catalog Entry Schema

```yaml
catalog_entry:
  entity_id: string
  display_name: string
  description: string
  entity_type: ENTITY_TYPE
  classification: data_class
  
  location:
    system: string               # connector_id or internal system name
    path: string                 # table, topic, API endpoint, file path
    format: JSON | YAML | PARQUET | CSV | PROTOBUF | AVRO | RAW
  
  schema_ref:
    schema_id: string
    version: semver
    field_count: number
    preview_fields: [field_name]  # first 5 non-PII fields
  
  quality:
    score: number                # 0.0–1.0
    freshness: FRESH | AGING | STALE | UNKNOWN
    last_quality_check: ISO8601
  
  usage:
    consumer_count: number       # active consumers/pipelines
    query_count_30d: number
    popular_joins: [entity_id]   # most frequent join targets
  
  access:
    tier_required: T1..T5
    request_workflow: string     # workflow to request access
    auto_approved_tiers: [T1..T5]
  
  tags: [string]
  steward_id: string
  last_updated: ISO8601
```

## Search Interface

```
GET /data/catalog

QUERY PARAMS:
  q:              full-text search (name, description, tags)
  entity_type:    filter by ENTITY_TYPE
  classification: filter by data_class
  system:         filter by source system
  tag:            filter by tag
  quality_min:    minimum quality score
  pii:            true|false — filter by PII presence
  team:           filter by owner team
  freshness:      FRESH | AGING | STALE

SORT:
  relevance:     semantic match score (default)
  popular:       query_count_30d DESC
  quality:       quality score DESC
  recent:        last_updated DESC
  freshness:     freshness status (FRESH first)
```

## Catalog Sections

```
OPERATIONAL DATA
  ├── workflow-runs          ← Active and historical workflow execution records
  ├── agent-state            ← Current agent availability, load, performance
  ├── approval-queue         ← Pending human approval items
  └── event-bus-state        ← Active topic subscriptions + message lag

ANALYTICAL DATA
  ├── quality-metrics        ← Gate pass rates, output quality scores
  ├── performance-metrics    ← Latency, throughput, error rates
  ├── cost-metrics           ← Token usage, cost allocation by team
  └── governance-metrics     ← Compliance scores, policy adherence

KNOWLEDGE ASSETS
  ├── wiki-pages             ← Organizational wiki content
  ├── decision-records       ← ADRs + decision logs
  ├── runbooks               ← Operational playbooks
  └── agent-profiles         ← Agent capability declarations

CONNECTOR DATA (external)
  ├── jira-issues            ← Via JIRA connector
  ├── github-repos           ← Via GitHub connector
  ├── slack-messages         ← Via Slack connector (CONFIDENTIAL)
  └── {connector_id}-*       ← Pattern for all connector data
```

## Catalog Freshness Maintenance

```
AUTOMATED:
  - Schema drift detection: compare live schema to registered schema every 6hr
  - Quality score refresh: recalculate from latest quality monitor run (hourly)
  - Consumer count refresh: count active pipeline subscriptions (15min)
  - Stale detection: flag if last_updated > freshness_sla_min

HUMAN REVIEW:
  - Description accuracy: steward reviews annually
  - Classification accuracy: CISO reviews CONFIDENTIAL+ annually
  - Orphaned entries: entries with 0 consumers for 90d → deprecation notice to steward
```

## Persistence
`memory/data-fabric/catalog-index.yaml`
`memory/data-fabric/catalog-search-index.yaml`
`memory/data-fabric/catalog-access-log.jsonl`
