# Event Bus Partition Manager
**ID:** RT-EBP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Manages partitioning of the Enterprise AI OS event bus to scale throughput under 144-agent concurrency. The 15-topic enterprise event bus was designed for logical separation but not for horizontal throughput scaling. This manager introduces per-topic partitioning (16 partitions for hot topics, 4 for standard, 1 for low-volume), consumer group assignment, and partition rebalancing to eliminate event bus as a throughput bottleneck.

---

## Partition Configuration

```yaml
topic_partition_config:
  # Hot topics (high volume, latency-sensitive)
  workflow.events:        partitions: 16, consumer_groups: [orchestrator, monitoring, audit]
  agent.invocations:      partitions: 16, consumer_groups: [orchestrator, telemetry, audit]
  execution.steps:        partitions: 16, consumer_groups: [orchestrator, telemetry]
  
  # Standard topics (moderate volume)
  governance.decisions:   partitions: 4,  consumer_groups: [approval-engine, audit, dashboard]
  security.alerts:        partitions: 4,  consumer_groups: [security-monitor, escalation, audit]
  knowledge.updates:      partitions: 4,  consumer_groups: [replica-manager, search-index]
  strategic.signals:      partitions: 4,  consumer_groups: [strategic-intelligence, dashboard]
  data.quality.events:    partitions: 4,  consumer_groups: [data-monitor, governance]
  
  # Low-volume topics (single partition sufficient)
  constitutional.events:  partitions: 1,  consumer_groups: [governor-quorum, audit, emergency]
  model.lifecycle:        partitions: 1,  consumer_groups: [model-lifecycle-manager, audit]
  dr.events:              partitions: 1,  consumer_groups: [dr-coordinator, audit]
  chaos.events:           partitions: 1,  consumer_groups: [chaos-monitor, audit]
  compliance.events:      partitions: 4,  consumer_groups: [compliance-engine, audit]
  okr.updates:            partitions: 2,  consumer_groups: [okr-intelligence, dashboard]
  enterprise.health:      partitions: 4,  consumer_groups: [health-monitor, dashboard, audit]
```

Total: 15 topics, 91 partitions.

---

## Partitioning Strategy

### Partition Key Selection

Partition keys determine which partition an event routes to. Key selection is critical for ordered processing and load balance:

| Topic | Partition Key | Rationale |
|-------|--------------|-----------|
| workflow.events | workflow_id | All events for a workflow go to same partition (ordering) |
| agent.invocations | agent_id | Agent events ordered per agent |
| execution.steps | workflow_id + step_id | Step ordering within workflow |
| governance.decisions | decision_id | Decision events ordered |
| security.alerts | alert_category | Related alerts co-located |
| knowledge.updates | domain | Domain updates co-located for replica manager |
| constitutional.events | (none — round robin) | Constitutional events always single partition |

### Load Balance Monitoring

```
Per partition, track every 60 seconds:
  - Events per minute
  - Consumer lag (events in partition not yet consumed)
  - Consumer processing time p95

Rebalancing trigger:
  - If any partition has > 3× the events/min of the median partition: hot partition
  - Hot partition: trigger partition key analysis; propose re-keying to T3
  - Consumer lag > 1,000 events: alert + scale consumer group
  - Consumer lag > 10,000 events: T3 immediate + emergency scaling
```

---

## Consumer Group Management

```yaml
consumer_group_record:
  group_id: string
  topic: string
  partitions_assigned: [number]
  
  health:
    status: HEALTHY | LAGGING | CRITICAL
    total_consumer_lag: number            # events pending consumption
    processing_rate_per_minute: number
    p95_processing_ms: number
    
  scaling:
    current_consumers: number
    min_consumers: 1
    max_consumers: 8
    auto_scale_threshold_lag: 1000       # add consumer if lag exceeds this
    scale_cooldown_seconds: 120          # minimum between scale actions
```

### Auto-scaling Rules

```
Scale out (add consumer):
  - Consumer lag > auto_scale_threshold_lag for > 60 seconds
  - New consumer assigned to lagging partitions preferentially
  - Max: max_consumers per group

Scale in (remove consumer):
  - Consumer lag < (auto_scale_threshold_lag × 0.1) for > 300 seconds
  - Min: min_consumers must remain active
  - Graceful shutdown: consumer finishes in-flight messages before removal

constitutional.events topic:
  - Never auto-scaled; always exactly 1 consumer per consumer group
  - Constitutional events are low-volume and require strict ordering
```

---

## Partition Failure Handling

```
Single partition failure (not all replicas lost):
  - Events rerouted to surviving replicas of that partition
  - Consumer lag increases; auto-scaling triggered
  - T3 alert within 30 seconds

Partition replica loss (majority of replicas for one partition):
  - Partition becomes unavailable
  - Producer events for affected partition key are queued in memory (max 60 seconds)
  - If not recovered in 60s: overflow to adjacent partition (best effort, ordering may break)
  - T3 immediate alert

Full topic failure:
  - Topic producer/consumer suspended
  - Dependent workflows paused (graceful; checkpointed)
  - T4 alert
  - DR protocol: restore topic from event log backup (RPO: last completed segment)
  
constitutional.events topic failure:
  - All governance decisions paused immediately
  - T5 emergency notification
  - No fallback routing (constitutional events cannot be lost)
```

---

## Throughput Targets

| Metric | Baseline (no partitions) | v30 Target | Scale-Out Max |
|--------|-------------------------|-----------|---------------|
| Total events/minute | ~5,000 | ~40,000 | ~120,000 |
| workflow.events p95 latency | ~500ms | ~30ms | ~15ms |
| Consumer lag (hot topics) | ~2,000 | <100 | <50 |
| Partition rebalance time | N/A | <60s | <30s |

---

## Governance

**Partition count changes:** T3 Architecture Org approval (hot topic changes require T4)
**Consumer group additions:** T3 approval
**Re-keying proposals:** T3 review + impact analysis before implementation
**Audit:** Partition configuration changes logged to `memory/runtime/event-bus-config-log.jsonl`
**Monitoring:** Partition health feeds `enterprise.health.scores` event bus topic
