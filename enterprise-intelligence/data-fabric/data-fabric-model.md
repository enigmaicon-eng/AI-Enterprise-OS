# Data Fabric Model

## Role
Defines the canonical data model for the Enterprise AI OS data fabric. Establishes data entity types, schemas, classification rules, ownership, and the metadata standard that all data sources, pipelines, and consumers must conform to.

## Data Entity Types

```
ENTITY_TYPE        DESCRIPTION                                    OWNERSHIP_LEVEL
───────────────────────────────────────────────────────────────────────────────────
OPERATIONAL        Live system state (workflow runs, agent state)  System-managed
ANALYTICAL         Aggregated + historical (metrics, KPIs)         Analytics team
REFERENCE          Lookup tables (teams, agents, config)           Platform team
KNOWLEDGE          Curated facts + decisions                       Knowledge team
EVENT              Immutable event records                          Source system
DOCUMENT           Unstructured artifacts (PRDs, ADRs, reports)    Author team
EXTERNAL           Data from connectors (Jira, GitHub, etc.)       Integration team
DERIVED            Computed/synthesized outputs                    Pipeline owner
```

## Canonical Data Schema

```yaml
data_entity:
  entity_id: string              # Globally unique: {source}.{type}.{name}.{version}
  entity_type: ENTITY_TYPE
  name: string
  description: string
  
  schema:
    version: semver
    fields: [field_def]
    primary_key: [field_name]
    indexes: [field_name]
  
  classification:
    data_class: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED | TOP_SECRET
    pii_present: boolean
    pii_fields: [field_name]       # if pii_present
    regulated: boolean
    regulation_tags: [EU_AI_ACT, GDPR, SOC2, HIPAA]
  
  quality:
    freshness_sla_min: number      # max age before STALE
    completeness_threshold: number # min non-null rate
    accuracy_threshold: number     # min validation pass rate
    current_quality_score: number  # 0.0–1.0
  
  lineage:
    source_entities: [entity_id]
    derived_entities: [entity_id]
    pipeline_id: string
  
  ownership:
    team_id: string
    steward_id: string
    tier_required: T1..T5
  
  lifecycle:
    created_at: ISO8601
    last_updated: ISO8601
    retention_days: number
    archival_policy: DELETE | ARCHIVE | RETAIN_FOREVER
```

## Data Classification Rules

```
CLASSIFICATION    PII       PRODUCTION ACCESS    CONNECTOR EXPORT  RETENTION
──────────────────────────────────────────────────────────────────────────────
PUBLIC            NO        Any tier             Allowed           Policy-based
INTERNAL          Possible  T1+                  Masked by default 3yr min
CONFIDENTIAL      Likely    T2+ with logging     T3 approval       5yr min
RESTRICTED        Yes       T3+ with HITL gate   T4 approval       7yr min
TOP_SECRET        Always    T4+ + air-gapped      BLOCKED           10yr min
```

## Schema Registry

All schemas are versioned and registered before use:

```
SCHEMA REGISTRATION:
  1. Author submits schema definition
  2. Schema validator: check field types, primary key uniqueness, classification accuracy
  3. Compatibility check: BACKWARD | FORWARD | FULL (default: BACKWARD)
  4. IF compatible: register with version bump
  5. IF breaking: require MAJOR version + migration plan

BACKWARD COMPATIBLE:  add optional fields; widen types
FORWARD COMPATIBLE:   remove optional fields; narrow types
BREAKING:             rename fields, change types, remove required fields → MAJOR version required
```

## Field Definition Standard

```yaml
field_def:
  name: string
  type: STRING | INTEGER | FLOAT | BOOLEAN | TIMESTAMP | JSON | BYTES
  required: boolean
  pii: boolean
  pii_category: NAME | EMAIL | PHONE | ADDRESS | ID | FINANCIAL | HEALTH | null
  description: string
  validation:
    - rule: REGEX | RANGE | ENUM | CUSTOM
      spec: string
```

## Persistence
`memory/data-fabric/schema-registry.yaml`
`memory/data-fabric/entity-catalog.yaml`
`memory/data-fabric/classification-overrides.jsonl`
