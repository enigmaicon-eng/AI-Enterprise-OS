# Ingestion Pipeline
# Orchestrated multi-source ingestion with scheduling, idempotency, and error isolation

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ingestion Pipeline                        │
│                                                             │
│  Scheduled Pull             Event-Driven Push               │
│  ┌──────────────┐           ┌──────────────┐               │
│  │ File Scanner  │           │ Event Stream  │               │
│  │ (every 15min) │           │ Consumer      │               │
│  └──────┬───────┘           └──────┬───────┘               │
│         │                          │                         │
│         ▼                          ▼                         │
│  ┌─────────────────────────────────────────┐               │
│  │           Ingestion Queue               │               │
│  │  [{source_type, path/event, priority}]  │               │
│  └──────────────────┬──────────────────────┘               │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────┐              │
│  │         Extractor Dispatcher             │              │
│  │  routes to: agent | wiki | decision |    │              │
│  │            workflow | artifact | event    │              │
│  └──────────────────┬───────────────────────┘              │
│                     │                                        │
│                     ▼                                        │
│  ┌──────────────────────────────────────────┐              │
│  │       Graph Mutation Pipeline            │              │
│  │  deduplicate → validate → write          │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

## Ingestion Job Schema

```yaml
IngestionJob:
  job_id: string              # JOB-{uuid4}
  source_type: enum           # FILE | EVENT | MANUAL
  source_ref: string          # file path or event_id
  extractor: string           # which extractor handles this job
  priority: enum              # CRITICAL | HIGH | NORMAL | LOW
  content_hash: string        # SHA-256 of source content (idempotency key)
  status: enum                # PENDING | IN_PROGRESS | COMPLETE | FAILED | SKIPPED
  enqueued_at: ISO8601
  started_at: ISO8601 | null
  completed_at: ISO8601 | null
  entities_upserted: integer
  relationships_upserted: integer
  error: string | null
  retry_count: integer
  max_retries: integer        # default 3
```

## Idempotency Protocol

Every ingestion job is keyed by the SHA-256 hash of the source content. If the hash
matches the last-ingested hash for that source_ref, the job is SKIPPED:

```python
INGESTION_HASH_REGISTRY = {}   # source_ref → last_content_hash

def compute_file_hash(path: str) -> str:
    return sha256(read_file_bytes(path)).hexdigest()

def should_skip_ingestion(source_ref: str, content_hash: str) -> bool:
    last_hash = INGESTION_HASH_REGISTRY.get(source_ref)
    if last_hash and last_hash == content_hash:
        return True    # content unchanged since last ingestion
    return False

def record_ingestion_complete(source_ref: str, content_hash: str):
    INGESTION_HASH_REGISTRY[source_ref] = content_hash
    # Persist to memory/graph-ingestion/ingestion-state.yaml
    ingestion_state_store.update_last_ingested(source_ref, content_hash, now())
```

## File Scanner (Scheduled Pull)

Runs every 15 minutes. Scans all source patterns from `ontology-mapping.md`:

```python
def scan_and_enqueue():
    for mapping_name, mapping in ONTOLOGY_MAPPINGS.items():
        pattern = mapping["source_pattern"]
        files = glob_files(pattern, modified_since=last_scan_timestamp())
        for file_path in files:
            content_hash = compute_file_hash(file_path)
            if should_skip_ingestion(file_path, content_hash):
                continue
            job = IngestionJob(
                job_id=f"JOB-{uuid4()}",
                source_type="FILE",
                source_ref=file_path,
                extractor=mapping["extractor"],
                priority=classify_priority(file_path),
                content_hash=content_hash,
                status="PENDING",
                enqueued_at=now(),
                max_retries=3,
            )
            ingestion_queue.enqueue(job)

def classify_priority(file_path: str) -> str:
    if "constitution/" in file_path:   return "CRITICAL"
    if "governance/" in file_path:     return "HIGH"
    if "agents/" in file_path:         return "HIGH"
    if "workflows/" in file_path:      return "NORMAL"
    return "NORMAL"
```

## Extractor Dispatcher

```python
EXTRACTOR_REGISTRY = {
    "agent-extractor":    agent_extractor.extract,
    "wiki-extractor":     wiki_extractor.extract,
    "decision-extractor": decision_extractor.extract,
    "workflow-extractor": workflow_extractor.extract,
    "event-consumer":     event_stream_consumer.process,
}

def dispatch_job(job: IngestionJob) -> IngestionResult:
    extractor_fn = EXTRACTOR_REGISTRY.get(job.extractor)
    if not extractor_fn:
        return IngestionResult(job_id=job.job_id, status="FAILED",
                               error=f"Unknown extractor: {job.extractor}")
    try:
        result = extractor_fn(job.source_ref)
        record_ingestion_complete(job.source_ref, job.content_hash)
        return IngestionResult(
            job_id=job.job_id, status="COMPLETE",
            entities_upserted=result.entities_upserted,
            relationships_upserted=result.relationships_upserted,
        )
    except ExtractionError as e:
        if job.retry_count < job.max_retries:
            job.retry_count += 1
            job.status = "PENDING"
            ingestion_queue.enqueue(job, delay_s=60 * job.retry_count)
            return IngestionResult(job_id=job.job_id, status="RETRYING", error=str(e))
        return IngestionResult(job_id=job.job_id, status="FAILED", error=str(e))
```

## Ingestion Ordering

Core entities must exist before relationships referencing them. Ingestion runs in phases:

```python
INGESTION_PHASES = [
    Phase(name="CORE_ENTITIES",    extractors=["agent-extractor"], priority="HIGH"),
    Phase(name="ORG_ENTITIES",     extractors=["workflow-extractor"], priority="HIGH"),
    Phase(name="KNOWLEDGE",        extractors=["wiki-extractor", "decision-extractor"]),
    Phase(name="RUNTIME",          extractors=["event-consumer"], priority="NORMAL"),
    Phase(name="INFERENCE",        extractors=["inference-engine"], priority="LOW"),
]

def run_full_ingestion():
    for phase in INGESTION_PHASES:
        phase_jobs = [j for j in ingestion_queue.get_pending()
                      if j.extractor in phase.extractors]
        # Run phase jobs in parallel (error in one doesn't block others)
        results = parallel_execute([lambda j=job: dispatch_job(j) for job in phase_jobs])
        failed = [r for r in results if r.status == "FAILED"]
        if failed and phase.name == "CORE_ENTITIES":
            # Core entity failures block subsequent phases
            publish_enterprise_event("alerts.critical", {
                "event_type": "INGESTION_CORE_PHASE_FAILURE",
                "failed_jobs": [r.job_id for r in failed],
            })
```

## Integration Points

- `ontology-mapping.md`: ONTOLOGY_MAPPINGS drives scan patterns and extractor routing
- `entity-resolution.md`: all extractors call `deduplicate_entity()` through this pipeline
- `knowledge-inference/inference-engine.md`: INFERENCE phase triggers after extraction phases
- `graph-observability/coverage-analyzer.md`: reads ingestion-state.yaml to compute coverage
- `enterprise-telemetry/enterprise-event-bus.md`: event-consumer job type receives events here
