# Runtime Optimizer

**Component:** RSI-OPT-003 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** CRITICAL

## Role
Optimizes the execution runtime layer — scheduling efficiency, worker utilization, queue management, resource allocation, context budgets, and durable execution overhead. Ensures the OS runs at peak execution efficiency with minimum resource waste and maximum throughput.

---

## Runtime Optimization Dimensions

```
DIMENSION                  TARGET                     SIGNAL
──────────────────────────────────────────────────────────────────────────────────────────────
Worker utilization         0.60–0.80 (no idle; no saturated)  worker_utilization_avg
Queue depth                < 50 items p99               queue_depth_p99
Scheduling latency         < 100ms p99                  scheduler_latency_p99_ms
Context budget efficiency  < 10% waste per execution    context_waste_ratio
Checkpoint overhead        < 5% of execution time       checkpoint_overhead_ratio
Event bus lag              < 500ms consumer lag          event_bus_consumer_lag_ms
DAG compilation time       < 2s for standard workflows  dag_compile_time_ms_p99
Recovery time              < 10min MTTR from failure    recovery_time_min
Error rate (execution)     < 0.02 per workflow run      execution_error_rate
```

---

## Optimization Techniques

### 1. Worker Pool Optimization
```
UTILIZATION ANALYSIS:
  worker_utilization: (active_work_time / total_available_time) per worker pool
  under-utilized: < 0.40 sustained for > 2 hours → over-provisioned
  saturated: > 0.90 sustained for > 1 hour → under-provisioned; queue building

OPTIMIZATION SIGNALS:
  avg utilization < 0.50 for 7d: reduce worker pool size (scale-in)
  avg utilization > 0.85 for 7d: increase worker pool size (scale-out)
  utilization spiky (high std dev): predictive pre-scaling pattern needed

WORKER POOL SPECIALIZATION:
  If worker pool handles tasks across multiple domains:
    - Do certain domains run faster on specific worker types?
    - Analyze: task_type × worker_pool × completion_time
    - Proposal: create specialized pools for high-volume task types
    - Expected: 15–30% latency reduction for specialized tasks

WORK STEALING EFFICIENCY:
  steal_rate: how often do idle workers steal from busy workers?
  steal_success_rate: what % of steal attempts succeed?
  steal_overhead: time spent attempting steal vs. work actually completed
  Proposal: tune steal threshold (imbalance_threshold in work-stealing.md)
```

### 2. Scheduling Optimization
```
SCHEDULING LATENCY ANALYSIS:
  scheduler_latency by workflow priority class
  queue_wait_time: how long before work is assigned to a worker?
  priority_inversion: are lower-priority items completing before higher?

SCHEDULING TUNING:
  Priority inversion detected: audit EDF (Earliest Deadline First) weights
  High P3/P4 wait times: P3/P4 starvation check; ensure minimum service rate
  Burst handling: when traffic spikes, scheduler should pre-allocate workers

ADMISSION CONTROL:
  Currently: fixed admission rate
  Improvement: dynamic admission based on current queue depth + worker availability
  Proposal: add backpressure signal to intake layer; reject non-critical work when queue > threshold
```

### 3. Context Budget Optimization
```
CONTEXT WASTE ANALYSIS:
  context_loaded: tokens loaded per step
  context_referenced: tokens actually accessed/used by agent
  waste_ratio: (loaded - referenced) / loaded

WASTE REDUCTION PROPOSALS:
  waste_ratio > 0.30 for a step type: trim context template for that step
  Same context loaded in N steps but only used in 1: load-on-demand
  Background context (wiki pages) rarely accessed: conditional loading only

TOKEN BUDGET ALLOCATION:
  Current: fixed budgets per tier (T1:50K → T5:unlimited)
  Optimization: dynamic allocation based on task complexity classification
  Simple task routed to T3 agent: reduce budget; don't waste T3 budget on T1 task
  Expected: 10–20% reduction in total token cost with same quality output
```

### 4. Checkpoint Overhead Optimization
```
CHECKPOINT ANALYSIS:
  checkpoint_frequency: how often are checkpoints created?
  checkpoint_size: how much state is serialized per checkpoint?
  checkpoint_time: how long does checkpoint creation take?
  recovery_use_rate: what % of checkpoints are ever used in recovery?

EFFICIENCY TUNING:
  checkpoint_frequency too high (> 1/min for low-risk steps): reduce frequency
  recovery_use_rate < 0.01: many checkpoints never used → increase interval
  checkpoint_size large: identify and strip redundant state from checkpoint payload

RECOVERY TIME OPTIMIZATION:
  MTTR > 10min: identify slowest recovery phase (state reconstruction vs. context restore)
  State reconstruction slow: parallelize artifact re-loading
  Context restore slow: cache hot contexts in warm memory layer
```

### 5. DAG Compilation Optimization
```
COMPILE TIME ANALYSIS:
  dag_compile_time by workflow complexity (# nodes × # edges)
  cache_hit_rate: what % of DAG compilations use the cached result?

COMPILATION SPEED:
  compile_time > 5s for standard workflow: investigate optimizer pass ordering
  cache_hit_rate < 0.50: cache invalidation too aggressive; extend TTL
  Cold-start compilation for recurring workflows: pre-compile on schedule registration
  Proposal: workflow warmup — pre-compile DAGs for workflows scheduled > 3x/day
```

---

## Resource Efficiency Targets

```
RESOURCE                   CURRENT BASELINE          TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Token cost/workflow        [from observation layer]   -20% via context optimization
Worker idle time           [from observation layer]   < 25% of provisioned capacity
Checkpoint overhead        [from observation layer]   < 3% of execution time
Queue p99 depth            [from observation layer]   < 30 items (vs target 50)
Event bus consumer lag     [from observation layer]   < 200ms (vs target 500ms)
```

---

## Runtime Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Worker utilization in healthy range     >= 0.90 of time
Execution error rate                    < 0.02
Scheduling latency p99                  < 100ms
Context waste ratio                     < 0.20
MTTR (execution failures)               < 10 minutes
Runtime optimizations applied/quarter  >= 3
```
