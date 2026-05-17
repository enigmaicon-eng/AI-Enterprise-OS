# Runtime Telemetry Hub

## Role
Aggregates all execution runtime signals — DAG execution state, worker health, queue depth, context budgets, tool call rates, and error rates — into a unified telemetry stream for real-time operational awareness.

## Runtime Signal Catalog

```
SIGNAL                      SOURCE                              TARGET
──────────────────────────────────────────────────────────────────────────────────
active_executions           execution-runtime/runtime-engine    <= capacity_limit
worker_utilization_avg      distributed-execution/worker-orch   0.60-0.80
queue_depth_p95             distributed-execution/task-queue    < 50 items
context_budget_usage_avg    resource-intelligence/token-budget-manager  < 0.70
tool_call_rate_per_min      execution-security/least-privilege-engine   < rate_limit
retry_rate                  workflow-engine/retry-engine        < 0.05
error_rate                  execution-observability/workflow-telemetry  < 0.02
p95_step_latency_ms         execution-observability/execution-tracer   per workflow SLO
dead_letter_queue_depth     workflow-engine/retry-engine        0 (immediate if > 0)
circuit_breaker_open_count  runtime-topology/service-mesh-topology  0
```

## Runtime Health Bands

```
execution_health = (
  worker_utilization_score × 0.25    # 0.60-0.80 = 1.0; outside = degrading
  + queue_health_score     × 0.25    # depth relative to capacity
  + error_rate_score       × 0.25    # 1.0 at 0%, 0.0 at >= 5%
  + context_budget_score   × 0.15    # 1.0 at <= 70% used
  + retry_rate_score       × 0.10    # 1.0 at 0%, 0.0 at >= 10%
)
```

## Real-Time Runtime Alerts

```
CONDITION                                   SEVERITY    ACTION
────────────────────────────────────────────────────────────────────────────────────
worker_utilization_avg > 0.90 for 5min      HIGH        pre-scale + alert
queue_depth > 100 items for 2min            HIGH        throttle intake + alert
error_rate > 0.05 for 2min                  CRITICAL    immediate investigation
dead_letter_queue_depth > 0                 HIGH        alert T3 + investigate
circuit_breaker OPEN on any link            HIGH        alert + route around
context_budget exhausted for workflow       CRITICAL    pause + save state
tool_call_rate_limit approaching > 85%      WARN        slow intake
```

## Runtime Event Stream
Published to event bus topic: `enterprise.runtime.telemetry`

Subscribed by:
- operational-command-center/runtime-dashboards
- self-optimization-controller (performance signals)
- resource-intelligence/predictive-resource-planner (demand signals)
- bottleneck-learning-engine (bottleneck signals)

## Heatmap Outputs
Feeds `execution-observability/runtime-heatmaps.md`:
- Worker utilization heatmap (by agent pool, by time)
- Queue depth heatmap (by workflow type, by hour)
- Error density heatmap (by step, by time)

## Persistence
`memory/execution-observability/runtime-telemetry.yaml`
`memory/execution-observability/runtime-alerts.jsonl`
