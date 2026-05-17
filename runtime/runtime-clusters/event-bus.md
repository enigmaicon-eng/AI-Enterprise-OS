# Event Bus

**System ID:** `event-bus`
**Role:** Enterprise event bus — provides durable, partitioned, ordered event streaming across the OS; supports publish/subscribe with configurable delivery guarantees (at-least-once, exactly-once), topic-based routing, consumer groups, and event replay for new subscribers
**Storage:** `memory/runtime-clusters/event-store/[topic]/[partition-N].jsonl` + `memory/runtime-clusters/consumer-offsets.yaml`

---

## Purpose

The event bus is the nervous system of the reactive execution fabric. Every significant system event — workflow state transitions, gate verdicts, escalation resolutions, prediction alerts, signal deliveries — is published to the event bus. Any system can subscribe to relevant topics and react without tight coupling to the publisher. This enables reactive orchestration, event-driven triggering, and decoupled system evolution.

---

## Topic Model

```yaml
Topic:
  topic_name: string               # e.g., "workflow.events", "gate.verdicts", "predictions.alerts"
  partitions: integer              # Number of partitions for parallel consumption
  retention_hours: integer         # How long events are retained for replay
  delivery_guarantee: "AT_LEAST_ONCE | EXACTLY_ONCE"
  ordering_guarantee: "PARTITION_ORDERED | GLOBAL_ORDERED | UNORDERED"
  
  schema:
    event_type: string             # JSON Schema for event payload validation
    schema_version: integer

# Standard Enterprise Topics
topics:
  "workflow.events":
    partitions: 8
    retention_hours: 168           # 7 days
    ordering_guarantee: PARTITION_ORDERED  # Ordered per workflow_id partition key
  
  "gate.verdicts":
    partitions: 4
    retention_hours: 720           # 30 days (audit)
    ordering_guarantee: PARTITION_ORDERED
  
  "predictions.alerts":
    partitions: 2
    retention_hours: 48
    ordering_guarantee: GLOBAL_ORDERED
  
  "runtime.signals":
    partitions: 4
    retention_hours: 24
    ordering_guarantee: PARTITION_ORDERED
  
  "escalations":
    partitions: 4
    retention_hours: 720
    ordering_guarantee: PARTITION_ORDERED
  
  "agent.invocations":
    partitions: 8
    retention_hours: 168
    ordering_guarantee: UNORDERED
```

---

## Event Schema

```yaml
Event:
  event_id: string                 # uuid; globally unique
  topic: string
  partition_key: string            # Used to route to consistent partition
  partition: integer               # Assigned partition (0..N-1)
  offset: integer                  # Position within partition (monotonically increasing)
  
  timestamp: datetime
  event_type: string               # e.g., "WORKFLOW_STARTED", "GATE_PASSED"
  schema_version: integer
  
  source_system: string            # Which system published this event
  source_run_id: string | null     # Workflow run that generated the event
  
  payload: any                     # Event-specific data (schema-validated)
  
  headers:
    causation_id: string | null    # event_id of the event that caused this one
    correlation_id: string         # Trace correlation (same across related events)
    idempotency_key: string | null # For exactly-once delivery
```

---

## Publish Protocol

```
publish(topic, event_type, payload, partition_key, idempotency_key=null):
  
  topic_config = get_topic_config(topic)
  
  # Validate payload against topic schema
  validate_schema(payload, topic_config.schema)
  
  # Assign partition using consistent hashing on partition_key
  partition = hash(partition_key) % topic_config.partitions
  
  # Exactly-once: check for duplicate idempotency key in recent window
  IF topic_config.delivery_guarantee == EXACTLY_ONCE AND idempotency_key:
    IF idempotency_store.exists(idempotency_key, topic):
      RETURN {status: "DUPLICATE", original_event_id: idempotency_store.get(idempotency_key)}
  
  # Assign offset (atomic increment per partition)
  offset = partition_offset_counters[topic][partition].increment_and_get()
  
  event = Event(
    event_id = generate_uuid(),
    topic = topic,
    partition_key = partition_key,
    partition = partition,
    offset = offset,
    timestamp = now(),
    event_type = event_type,
    payload = payload,
    ...
  )
  
  # Persist to partition log (write-ahead)
  append(f"event-store/{topic}/partition-{partition}.jsonl", event)
  
  IF idempotency_key:
    idempotency_store.record(idempotency_key, event.event_id)
  
  # Notify waiting consumers
  consumer_signal.notify(topic, partition)
  
  RETURN {status: "PUBLISHED", event_id: event.event_id, offset: offset}
```

---

## Subscribe / Consume Protocol

```
subscribe(topic, consumer_group_id, handler_fn, from_offset="LATEST"):
  
  # Consumer group: multiple consumers sharing a subscription
  # Each partition delivered to exactly one consumer in the group
  group = consumer_group_registry.get_or_create(topic, consumer_group_id)
  
  # Assign partitions to this consumer (round-robin within group)
  my_partitions = group.assign_partitions(this_consumer_id)
  
  FOR each partition in my_partitions:
    start_offset = get_committed_offset(consumer_group_id, topic, partition)
    IF from_offset == "EARLIEST": start_offset = 0
    
    start_polling_loop(topic, partition, start_offset, handler_fn, consumer_group_id)

POLLING LOOP:
  WHILE running:
    events = read_events(topic, partition, from_offset=committed_offset, max_batch=100)
    
    FOR each event in events:
      handler_fn(event)
      
      # Commit offset after successful processing
      commit_offset(consumer_group_id, topic, partition, event.offset)
      committed_offset = event.offset + 1
    
    IF no events: sleep(poll_interval_ms)
```

---

## Replay and Time Travel

```
replay(topic, consumer_group_id, from_offset=0):
  # Reset committed offset for group → replays all events from offset
  reset_committed_offset(consumer_group_id, topic, partition=all, offset=from_offset)

replay_since(topic, consumer_group_id, since_timestamp):
  # Find offset corresponding to timestamp
  offset = binary_search_offset_by_timestamp(topic, partition, since_timestamp)
  replay(topic, consumer_group_id, from_offset=offset)
```

---

## Consumer Offset Schema

```yaml
ConsumerOffsets:
  last_updated: datetime
  
  consumer_groups:
    [consumer_group_id]:
      topic: string
      partitions:
        [partition_number]:
          committed_offset: integer
          last_commit_at: datetime
          consumer_id: string        # Which consumer instance owns this partition
          lag: integer               # Latest_offset - committed_offset
```

---

## Integration

**Called by:** All OS systems that emit events — dag-engine, dag-runtime, execution-runtime, prediction-engine, etc.
**Calls:** Nothing (downstream consumers pull from the bus)

**Writes to:**
- `memory/runtime-clusters/event-store/[topic]/partition-[N].jsonl` — event log per partition
- `memory/runtime-clusters/consumer-offsets.yaml` — committed consumer positions

**Output consumed by:**
- `runtime-clusters/event-triggers.md` — watches topics for trigger conditions
- `runtime-clusters/reactive-orchestration.md` — drives reactive workflow activation
- `digital-twins/twin-sync.md` — consumes workflow.events to update twins
- `execution-observability/execution-tracer.md` — consumes all topics for trace assembly
