# Knowledge Base Replica Manager
**ID:** RT-KBR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Manages read replicas of the knowledge base to eliminate read-path contention under high agent concurrency. At peak, 144 agents performing simultaneous knowledge retrieval against a single knowledge base creates a bottleneck. This system shards knowledge by domain, maintains domain-local read replicas for each agent org, and routes reads to the nearest replica. Write operations remain centralized and replicated.

---

## Replica Architecture

```
                    ┌─────────────────────┐
                    │  Primary Knowledge  │
                    │  Base (write path)  │
                    │  knowledge-base/    │
                    └──────────┬──────────┘
                               │ replication (< 5s lag)
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐     ┌──────▼──────┐    ┌──────▼──────┐
    │  Replica 1  │     │  Replica 2  │     │  Replica 3  │
    │  PM + UX    │     │  Eng + QA   │     │  Security + │
    │  Analytics  │     │  Arch + Dev │     │  Compliance │
    │  Orgs       │     │  Orgs       │     │  + Exec     │
    └─────────────┘     └─────────────┘     └─────────────┘
```

---

## Domain Sharding

Knowledge units (KU-*) are sharded by domain tag:

| Replica | Domains | Primary Orgs |
|---------|---------|-------------|
| REPLICA-1 | product, ux, analytics, market, customer | PM Org, UX Org, Analytics Org |
| REPLICA-2 | engineering, architecture, quality, devops, data | Engineering Org, QA Org, Architecture Org |
| REPLICA-3 | security, compliance, governance, legal, finance, strategy | Security Org, Compliance Org, Executive Org |

Cross-domain queries (e.g., requesting both `product` and `engineering` domains) route to primary. Cross-domain queries represent < 10% of read traffic in practice.

---

## Replication Protocol

```yaml
replication_config:
  mode: ASYNC_WITH_LAG_BOUND
  max_replication_lag_seconds: 5
  
  replication_stream:
    source: primary knowledge-base write-ahead log
    format: knowledge_unit_delta (only changed fields)
    compression: gzip
    
  replica_health:
    check_interval_seconds: 30
    max_lag_before_alert_seconds: 10
    max_lag_before_stale_flag_seconds: 30   # set data_freshness_ok: false
    
  write_propagation:
    new_KU: all replicas within 5s
    KU_update: domain-primary replica within 2s; others within 5s
    KU_delete (hard): all replicas within 2s (safety: never serve deleted KU)
    KU_delete (soft): mark as archived; replicas follow within 5s
```

---

## Read Routing Logic

```
query(domain_tags, filters) → replica_selection:

  1. Identify which replica(s) serve ALL requested domain_tags
  2. If single replica: route to that replica
  3. If multi-domain spanning replicas: route to primary
  4. Check replica health:
     - If replica lag > 30s: route to primary (stale flag)
     - If replica down: route to primary (degraded mode)
  5. Apply agent_org affinity: prefer replica serving agent's org (cache locality)
  6. Return results from selected replica

Cache layer (per replica):
  - LRU cache, 1,000 most-recently-accessed KUs per replica
  - TTL: 60 seconds (knowledge updates replicate within 5s; cache TTL gives buffer)
  - Cache invalidation: write-ahead log entry triggers cache eviction on target replica
```

---

## Write Path (Primary Only)

All writes go to primary regardless of domain:

```
write_flow:
  1. Agent submits KU write via knowledge management API
  2. Primary validates (schema, authorization, no constitutional violations)
  3. Write applied to primary
  4. Write-ahead log entry created
  5. Replication stream delivers to replicas (async, < 5s)
  6. Write confirmed to agent after primary commit (not waiting for replicas)

Write conflicts:
  - Last-write-wins per KU (timestamp-based)
  - If same KU modified within < 30s by two agents: conflict logged; human review
  - Constitutional and governance KUs: write serialized (no concurrent modifications)
```

---

## Replica Health Monitoring

```yaml
replica_health_report:
  replica_id: string
  status: HEALTHY | LAGGING | STALE | DOWN
  
  replication_lag_seconds: number
  last_successful_sync: ISO8601
  
  cache_stats:
    hit_rate: 0.00–1.00
    eviction_rate_per_hour: number
    size_entries: number
    
  read_throughput:
    reads_per_minute: number
    p95_latency_ms: number
    error_rate: 0.00–1.00
    
  data_freshness_ok: boolean
```

Targets: lag < 5s, p95 latency < 50ms, error rate < 0.001, cache hit rate > 0.70.

---

## Capacity and Throughput

| Configuration | Peak Read Throughput | P95 Read Latency |
|--------------|---------------------|-----------------|
| Primary only (baseline) | ~500 reads/min | ~200ms |
| 3 replicas (current design) | ~1,500 reads/min | ~50ms |
| 5 replicas (scale-out path) | ~2,500 reads/min | ~30ms |

Adding replicas requires T3 architecture approval and supply chain registration of replica infrastructure.

---

## Governance

**Replica count changes:** T3 Architecture Org approval
**Domain reassignment:** T3 approval + migration plan (KU re-routing)
**Replication lag SLA:** < 5s (alert at 10s, stale-flag at 30s)
**Audit:** All write operations logged to `memory/knowledge-base/write-log.jsonl`
**Data consistency:** Eventual (max 5s); strong consistency available on primary route
