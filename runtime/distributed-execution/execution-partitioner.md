# Execution Partitioner

**System ID:** `execution-partitioner`
**Role:** Assigns workflow executions and tasks to worker partitions — using consistent hashing for stable assignments, range partitioning for ordered workloads, and tenant-aware partitioning for isolation; ensures related work lands on the same worker (locality) while distributing load evenly
**Storage:** `memory/distributed-execution/partition-map.yaml`

---

## Purpose

As the worker pool scales beyond a handful of nodes, random assignment produces hot spots and destroys locality. The execution partitioner assigns workflow runs to worker partitions deterministically — so related tasks from the same workflow land on the same worker (preserving context), while the assignment ring automatically rebalances when workers join or leave.

---

## Consistent Hashing Ring

```
RING CONSTRUCTION:

  Virtual nodes: each physical worker maps to V virtual ring positions
    virtual_position = hash(worker_id + ":" + replica_index) for replica in 0..V-1
    V = 150 (standard); higher V = more even distribution
  
  Ring = sorted list of (position, worker_id) pairs
  Ring covers the full hash space [0, 2^32)

ASSIGNMENT:
  assign(key) → worker_id:
    h = hash(key)
    
    # Walk ring clockwise from h; first virtual node encountered = assigned worker
    idx = bisect_right(ring.positions, h)
    IF idx >= len(ring): idx = 0  # Wrap around
    
    RETURN ring[idx].worker_id

ASSIGNMENT KEYS by workload type:
  Workflow locality:  key = workflow_id        → all tasks in same workflow → same worker
  Agent locality:     key = agent_type + team  → same agent type always same worker pool shard
  Tenant isolation:   key = tenant_id          → tenant's work partitioned separately
  Round-robin:        key = task_id            → stateless tasks; spread evenly
```

---

## Ring Rebalancing on Worker Changes

```
WORKER JOINS (scale-out):
  new_worker adds V virtual nodes to ring
  
  Affected keys: those that now hash to new_worker instead of old_worker
  Migration: 
    - In-flight tasks on old_worker complete where they are
    - New tasks for affected keys routed to new_worker
    - Only ~(1/N) of tasks migrate (consistent hashing property)
  
  migration_ratio = 1 / (worker_count + 1)  # Theoretical minimum

WORKER LEAVES (scale-in or failure):
  removed_worker's virtual nodes removed from ring
  
  Affected keys: those that were assigned to removed_worker
  Migration:
    - In-flight tasks: retry_engine.schedule_retry() (worker-lost path)
    - New tasks: automatically re-assigned to next worker on ring
    - ~(1/N) of tasks migrate
```

---

## Partitioning Strategies

### Consistent Hashing (default)
Best for: workflow locality, stateful agents, session continuity.

```
assign_workflow(workflow_id) → partition_id:
  RETURN hash_ring.assign(workflow_id)
```

### Range Partitioning
Best for: ordered workloads, time-series processing, deadline-ordered queues.

```
RANGE MAP:
  partition 0: keys [0x00000000, 0x3FFFFFFF)  → worker_group_0
  partition 1: keys [0x40000000, 0x7FFFFFFF)  → worker_group_1
  partition 2: keys [0x80000000, 0xBFFFFFFF)  → worker_group_2
  partition 3: keys [0xC0000000, 0xFFFFFFFF)  → worker_group_3

assign_range(key) → partition_id:
  FOR each range in range_map:
    IF range.start <= hash(key) < range.end:
      RETURN range.partition_id
```

### Tenant-Aware Partitioning
Best for: multi-tenant deployments requiring isolation guarantees.

```
TENANT PARTITION GROUPS:
  Each tenant assigned to a dedicated partition group:
  tenant_partition_group(tenant_id) → [worker_ids]
  
  # Tenant's tasks only routed within their partition group
  # Prevents noisy-neighbor throughput interference
  
  # Partition group assignment:
  group = hash(tenant_id) % num_tenant_groups
  worker_group = tenant_groups[group]
```

---

## Partition Map Schema

```yaml
PartitionMap:
  version: integer
  strategy: "CONSISTENT_HASH | RANGE | TENANT_AWARE | ROUND_ROBIN"
  last_updated: datetime
  
  consistent_hash:
    virtual_nodes_per_worker: integer
    ring:
      - position: integer
        worker_id: string
        replica_index: integer
  
  range_partitions:
    - partition_id: integer
      range_start: integer           # Inclusive
      range_end: integer             # Exclusive
      worker_group: [string]         # worker_ids in this partition
  
  tenant_groups:
    - group_id: integer
      tenant_ids: [string]
      worker_ids: [string]
  
  assignment_cache:                  # Hot cache of recent assignments
    [workflow_id]: string            # → worker_id
    ttl_seconds: 300
```

---

## Rebalancing Trigger Policy

```
REBALANCE TRIGGERS:

  Worker joins:     Immediately update ring; redistribute future tasks
  Worker leaves:    Immediately update ring; in-flight tasks handled by retry path
  Imbalance alert:  IF imbalance_score > 0.30 (STDEV/MEAN of task counts):
                      Recalculate virtual node distribution
  Manual:           Force rebalance via coordinator signal

REBALANCE SAFETY:
  Never rebalance while emergency_rollback_in_progress
  Never rebalance two worker changes within 30 seconds of each other (debounce)
  Always rebalance after both adds and removes settle (batch changes)
```

---

## Integration

**Called by:**
- `workflow-engine/worker-dispatcher.md` — looks up partition assignment before dispatching
- `distributed-execution/worker-orchestration.md` — triggers rebalance on worker join/leave
- `execution-runtime/execution-scaling.md` — triggers rebalance after scale-out/in

**Reads from:** `memory/distributed-execution/worker-registry.yaml` — active workers for ring construction

**Writes to:** `memory/distributed-execution/partition-map.yaml` — current ring and assignment map
