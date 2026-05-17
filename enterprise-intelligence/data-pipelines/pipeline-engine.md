# Pipeline Engine

## Role
Core execution engine for all data pipelines in the OS. Manages pipeline definitions, DAG execution, step scheduling, retry logic, dependency resolution, and execution lifecycle. All data movement through the OS flows through the pipeline engine.

## Pipeline Definition Schema

```yaml
pipeline:
  pipeline_id: string            # Unique: {team}.{name}.v{major}
  version: semver
  name: string
  description: string
  
  type: BATCH | STREAM | MICRO_BATCH | HYBRID
  trigger:
    type: SCHEDULED | EVENT | MANUAL | UPSTREAM_COMPLETE
    schedule: cron (if SCHEDULED)
    event_filter: {topic, filter_expression} (if EVENT)
  
  inputs:
    - entity_id: string
      required: boolean
      min_quality_tier: GOLD | SILVER | BRONZE
  
  outputs:
    - entity_id: string
      write_mode: APPEND | OVERWRITE | UPSERT | MERGE
  
  steps: [pipeline_step]         # DAG of steps
  
  governance:
    owner_team: string
    tier_required: T1..T5
    pii_involved: boolean
    classification_ceiling: data_class
    requires_approval: boolean
  
  sla:
    max_duration_min: number
    alert_at_pct: 0.80           # alert when 80% of SLA elapsed
```

## Pipeline Step Schema

```yaml
pipeline_step:
  step_id: string
  name: string
  type: INGEST | TRANSFORM | VALIDATE | ENRICH | AGGREGATE | PUBLISH | NOTIFY
  
  depends_on: [step_id]          # empty = root step
  
  executor:
    type: AGENT | FUNCTION | CONNECTOR | QUERY
    agent_id: string (if AGENT)
    function_ref: string (if FUNCTION)
    connector_id: string (if CONNECTOR)
    query_template: string (if QUERY)
  
  inputs: [entity_id | step_output_ref]
  outputs: [entity_id]
  
  retry:
    max_attempts: 3
    backoff: EXPONENTIAL          # 30s, 60s, 120s
    on_max_retries: FAIL | SKIP | ALERT_AND_CONTINUE
  
  timeout_min: number
  
  quality_gate:
    enabled: boolean
    min_output_quality: number    # blocks next steps if output below this
```

## Execution Lifecycle

```
STATE MACHINE:
  SCHEDULED → TRIGGERED → VALIDATING → RUNNING → [SUCCEEDED | FAILED | TIMED_OUT | CANCELLED]

TRANSITIONS:
  SCHEDULED → TRIGGERED:    trigger condition met
  TRIGGERED → VALIDATING:   input availability + quality + permissions checked
  VALIDATING → RUNNING:     all inputs READY and quality gates passed
  VALIDATING → FAILED:      input UNAVAILABLE or quality CRITICAL or permission DENIED
  RUNNING → SUCCEEDED:      all steps complete, outputs written, quality gate passed
  RUNNING → FAILED:         unrecoverable step failure
  RUNNING → TIMED_OUT:      max_duration_min exceeded
```

## DAG Execution Strategy

```
EXECUTION:
  1. Topological sort of steps by depends_on
  2. Root steps start immediately (no dependencies)
  3. Dependent steps start when ALL depends_on steps = SUCCEEDED
  4. Steps at same level execute in parallel (up to concurrency_limit = 8 per pipeline)
  5. On any step FAILED:
     a. downstream steps cancelled
     b. pipeline → FAILED state
     c. completed steps' outputs preserved (enable partial resume)
  6. On all steps SUCCEEDED:
     a. output quality gate evaluated
     b. lineage records written
     c. downstream pipelines notified (if subscribed)

PARTIAL RESUME (after fix):
  completed steps: skipped
  failed step: restarted from last checkpoint
  downstream: re-executed from resumed step forward
```

## Pipeline Registry

```
GET /pipelines                   → list all pipelines (filtered by team, type, status)
GET /pipelines/{id}              → pipeline definition + last run status
GET /pipelines/{id}/runs         → execution history
GET /pipelines/{id}/runs/{run}   → step-level execution detail
POST /pipelines/{id}/trigger     → manual trigger (T2+)
POST /pipelines/{id}/cancel      → cancel running pipeline (T3+)
```

## Persistence
`memory/data-pipelines/pipeline-registry.yaml`
`memory/data-pipelines/pipeline-runs.yaml`
`memory/data-pipelines/run-history.jsonl`
`memory/data-pipelines/step-execution-log.jsonl`
