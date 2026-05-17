# Stream Processor

## Role
Real-time data stream processing for the OS. Consumes from the enterprise event bus and external streaming sources, applies continuous transformations, windowed aggregations, and pattern detection, and publishes results downstream in near-real-time (target: < 5s end-to-end latency).

## Stream Source Types

```
SOURCE TYPE       DESCRIPTION                           LATENCY TARGET
──────────────────────────────────────────────────────────────────────────
EVENT_BUS         Internal OS enterprise event bus      < 1s
CONNECTOR_STREAM  External system webhooks/streams      < 3s
BATCH_CHANGE      Change-data-capture from batch stores < 5s
SENSOR            Health metrics, telemetry feeds       < 2s
```

## Stream Processing Operations

```
OPERATION        DESCRIPTION
────────────────────────────────────────────────────────────────────────────
FILTER           Discard events not matching predicate (no state required)
TRANSFORM        Map event fields to output schema (no state required)
ENRICH           Join event with reference data (in-memory lookup table)
AGGREGATE        Windowed aggregations (tumbling, sliding, session windows)
PATTERN_DETECT   CEP: Complex Event Processing for multi-event patterns
DEDUPLICATE      Remove duplicate events in dedup_window (default 60s)
SPLIT            Route events to multiple downstream processors
MERGE            Combine multiple input streams into one output
```

## Window Types

```yaml
window_config:
  type: TUMBLING | SLIDING | SESSION | GLOBAL
  
  # TUMBLING: fixed, non-overlapping intervals
  tumbling:
    size_seconds: number         # e.g., 60 = 1-minute windows
  
  # SLIDING: overlapping windows
  sliding:
    size_seconds: number
    advance_seconds: number      # how often new window starts
  
  # SESSION: event-gap-based windows
  session:
    gap_seconds: number          # window closes after this idle gap
  
  # GLOBAL: all events since start (use only for bounded streams)
  
  allowed_lateness_seconds: 30   # accept late events within this window
  late_event_handling: INCLUDE | DISCARD | SIDE_OUTPUT
```

## Complex Event Processing (CEP)

```yaml
cep_pattern:
  pattern_id: string
  name: string
  description: string
  
  sequence:
    - event_type: string
      filter: predicate_expression
      quantifier: EXACTLY_ONE | ONE_OR_MORE | ZERO_OR_MORE
      within_seconds: number     # time constraint from previous event
  
  detection_window_seconds: number
  
  on_match:
    emit_event: boolean
    event_type: string           # output event type
    alert_level: INFO | WARNING | CRITICAL
    notify_topic: string
```

## Backpressure and Flow Control

```
CONSUMER LAG MONITORING:
  target_lag_seconds: 5
  warn_lag_seconds:   30
  critical_lag_seconds: 120     → scale up consumers or throttle source

THROUGHPUT LIMITS (per processor):
  max_events_per_second: 10000  (configurable per stream)
  burst_multiplier: 3×          → allowed for up to 30s

OVERFLOW HANDLING:
  IF queue_depth > high_watermark (80%):
    → emit BACKPRESSURE event to source
    → source reduces emission rate by 50%
  IF queue_depth > max_capacity:
    → CRITICAL alert; activate dead-letter processing
```

## Stream Health Metrics

```
TRACKED PER STREAM:
  events_per_second:   current throughput
  consumer_lag_ms:     end-to-end latency
  error_rate:          processing failures / total events
  duplicate_rate:      deduplicated events / total events
  late_event_rate:     late events within allowed_lateness / total events
  drop_rate:           discarded events / total events (SLA: < 0.001)

HEALTH SCORES:
  stream_health = (1 - error_rate) × (1 - drop_rate) × freshness_factor
  freshness_factor = 1.0 if lag < 5s; decreases linearly to 0 at lag = 120s
```

## Persistence
`memory/data-pipelines/stream-processor-state.yaml`
`memory/data-pipelines/stream-health-metrics.yaml`
`memory/data-pipelines/cep-pattern-registry.yaml`
`memory/data-pipelines/dead-letter-queue.yaml`
