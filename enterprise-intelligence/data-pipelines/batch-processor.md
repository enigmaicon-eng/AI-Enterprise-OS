# Batch Processor

## Role
High-throughput batch data processing for the OS. Handles large-scale data transformation, historical analysis, periodic aggregations, and data warehouse loads. Complements the stream processor for use cases where completeness and consistency matter more than latency.

## Batch Job Types

```
JOB TYPE          USE CASE                              TYPICAL SCHEDULE
──────────────────────────────────────────────────────────────────────────
FULL_REFRESH      Reload entire entity from source       Weekly / on-demand
INCREMENTAL       Process only new/changed records       Hourly / daily
AGGREGATE         Build analytics summaries              Daily / weekly
RECONCILE         Cross-system consistency check         Daily
ARCHIVE           Move aged data to long-term storage    Monthly
PURGE             Delete expired records                 Daily
BACKFILL          Reprocess historical data after fix    On-demand (T3+)
```

## Batch Job Schema

```yaml
batch_job:
  job_id: string
  version: semver
  type: JOB_TYPE
  
  source:
    entity_ids: [entity_id]
    connector_id: string (if external)
    query_template: string       # parameterized SQL/query
    incremental_key: string      # field to detect new/changed records
    watermark: ISO8601           # last processed timestamp
  
  target:
    entity_ids: [entity_id]
    write_mode: OVERWRITE | APPEND | UPSERT
  
  processing:
    chunk_size: number           # records per processing chunk
    parallelism: number          # concurrent chunk workers (default: 4)
    transformation_pipeline: pipeline_id
  
  schedule: cron
  
  sla:
    max_duration_min: number
    data_freshness_target_min: number  # how fresh output must be
  
  governance:
    owner_team: string
    tier_required: T1..T5
    requires_approval: boolean   # T3 required for BACKFILL + PURGE
```

## Execution Protocol

```
PRE-EXECUTION (VALIDATION PHASE):
  1. Verify source entities available and meet min_quality_tier
  2. Check target entity write permissions
  3. Estimate record count and resource needs
  4. IF PURGE or BACKFILL: require T3 approval before proceeding
  5. Reserve compute budget (token + CPU estimate)

EXECUTION PHASE:
  1. Checkpoint: record watermark + job start state
  2. Fetch chunk (chunk_size records from watermark forward)
  3. Transform via transformation_pipeline
  4. Quality-validate chunk output
  5. Write to target
  6. Advance watermark; write checkpoint
  7. Repeat until no more records or max_duration_min reached
  8. On completion: write lineage record; update catalog freshness

FAILURE RECOVERY:
  Resume from last checkpoint (watermark-based)
  Max 3 auto-retries per chunk
  Poison pill detection: same chunk fails 3× → quarantine chunk + alert steward + continue
```

## Resource Management

```
BATCH WINDOWS (scheduled jobs prefer off-peak):
  PEAK:     08:00–20:00 local time → max 2 concurrent batch jobs
  OFF_PEAK: 20:00–08:00            → max 8 concurrent batch jobs
  URGENT:   manual trigger by T3+  → bypasses window limits; alerts ops

RESOURCE LIMITS PER JOB:
  max_memory_mb:      2048
  max_cpu_pct:        40
  max_tokens_per_run: 500K        # batch jobs are token-heavy
  max_duration_min:   480         # 8 hours hard cap
```

## Large-Scale Operations

```
BACKFILL PROTOCOL (T3 approval required):
  1. T3 submits backfill request: entity_id, from_date, to_date, reason
  2. Estimate: record count × avg_transform_time = estimated_duration
  3. T3 approves estimated cost and duration
  4. Backfill runs in off-peak window with reduced parallelism (max 2 workers)
  5. Existing data preserved until backfill verified; then swap
  6. Lineage records for original and backfill both retained

PURGE PROTOCOL (T3 approval + DPO notification if PII):
  1. Identify records past retention_days
  2. Check downstream dependencies (lineage impact analysis)
  3. Generate deletion manifest: entity_id, record_ids, classification, reason
  4. T3 (+ DPO if PII) approves manifest
  5. Execute deletion in chunks; write deletion-proof records
  6. Verify deletion completeness; update catalog
```

## Persistence
`memory/data-pipelines/batch-job-registry.yaml`
`memory/data-pipelines/batch-run-history.jsonl`
`memory/data-pipelines/batch-checkpoints.yaml`
`memory/data-pipelines/purge-records.jsonl`
