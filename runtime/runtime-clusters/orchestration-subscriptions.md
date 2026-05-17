# Orchestration Subscriptions

**System ID:** `orchestration-subscriptions`
**Role:** Manages durable, named subscriptions to the event bus for orchestration components — provides lifecycle-managed consumer groups, topic routing, payload filtering, delivery guarantees, and subscription health monitoring; acts as the subscription management plane between consumers and the event bus
**Storage:** `memory/runtime-clusters/subscriptions.yaml`

---

## Purpose

Multiple systems need to consume events from the event bus: the reactive orchestration layer, the execution tracer, the digital twin sync, the bottleneck analyzer, and many more. Directly coupling each system to event_bus.subscribe() calls creates management problems — subscriptions have no names, no health monitoring, no controlled lifecycle. The orchestration subscriptions system provides a subscription registry: named, versioned, monitored subscriptions with controlled lifecycle and retry semantics. It is the managed consumer plane over the raw event bus.

---

## Subscription Schema

```yaml
Subscription:
  subscription_id: string              # uuid; stable identifier
  name: string                         # Human-readable name
  description: string
  
  owner_system_id: string              # Which system owns this subscription
  consumer_group_id: string            # Event bus consumer group ID
  
  # What to consume
  routing:
    topics: [string]                   # Topics to subscribe to (can be multiple)
    event_type_filter: [string] | null # Null = all event types
    payload_filter: string | null      # CEL expression for payload filtering
    partition_assignment: "AUTO | MANUAL"
    manual_partitions: [integer] | null
  
  # Delivery configuration
  delivery:
    from_offset: "LATEST | EARLIEST | SPECIFIC"
    specific_offset: integer | null
    max_batch_size: integer            # Max events per handler invocation
    poll_interval_ms: integer
    ack_timeout_seconds: integer       # Time before unack'd event is re-queued
    
    delivery_guarantee: "AT_LEAST_ONCE | EXACTLY_ONCE"
  
  # Handler target
  handler:
    handler_type: "INTERNAL_FUNCTION | WEBHOOK | AGENT_INVOKE"
    internal_function: string | null   # Function name within owning system
    webhook_url: string | null
    agent_id: string | null
  
  # Retry on handler failure
  retry:
    max_retries: integer
    retry_delay_seconds: integer
    backoff_multiplier: float
    dead_letter_topic: string | null
  
  # Lifecycle
  status: "ACTIVE | PAUSED | DRAINING | STOPPED | ERROR"
  created_at: datetime
  last_active_at: datetime | null
  
  # Monitoring
  metrics:
    messages_received: integer
    messages_processed: integer
    messages_failed: integer
    messages_dead_lettered: integer
    avg_processing_latency_ms: float
    consumer_lag: integer              # Latest offset - committed offset
    error_rate_1h: float
```

---

## Subscription Lifecycle

```
CREATE SUBSCRIPTION:

create_subscription(config) → subscription_id:
  
  # Validate topics exist
  FOR each topic in config.routing.topics:
    IF NOT event_bus.topic_exists(topic):
      RAISE UnknownTopic(topic)
  
  # Validate handler
  validate_handler(config.handler)
  
  subscription = Subscription(
    subscription_id = generate_uuid(),
    status = "ACTIVE",
    created_at = now(),
    consumer_group_id = config.consumer_group_id OR generate_consumer_group_id(config.name)
  )
  
  persist(subscription)
  
  # Register with event bus
  FOR each topic in config.routing.topics:
    event_bus.subscribe(
      topic = topic,
      consumer_group_id = subscription.consumer_group_id,
      handler_fn = make_subscription_handler(subscription),
      from_offset = config.delivery.from_offset
    )
  
  RETURN subscription.subscription_id

PAUSE SUBSCRIPTION:
  subscription.status = "PAUSED"
  # Consumer group offset maintained — resumes from last committed position
  event_bus.pause_consumer_group(subscription.consumer_group_id)

RESUME SUBSCRIPTION:
  subscription.status = "ACTIVE"
  event_bus.resume_consumer_group(subscription.consumer_group_id)

DRAIN AND STOP:
  subscription.status = "DRAINING"
  # Process all in-flight events before stopping
  wait_for_consumer_lag_zero(subscription.consumer_group_id, timeout=300)
  subscription.status = "STOPPED"
  event_bus.unsubscribe(subscription.consumer_group_id)
```

---

## Subscription Handler Dispatch

```
make_subscription_handler(subscription) → handler_fn:
  
  RETURN fn(event):
    
    # Apply payload filter if configured
    IF subscription.routing.payload_filter:
      IF NOT cel_eval(subscription.routing.payload_filter, build_context(event)):
        # Filter miss: ack and skip (still advances offset)
        RETURN ACK
    
    # Dispatch to handler with retry
    FOR attempt in range(1, subscription.retry.max_retries + 2):
      TRY:
        invoke_handler(subscription, event)
        
        # Update metrics on success
        subscription.metrics.messages_processed += 1
        subscription.metrics.last_active_at = now()
        RETURN ACK
      
      EXCEPT HandlerError as err:
        IF attempt <= subscription.retry.max_retries:
          delay = subscription.retry.retry_delay_seconds × (subscription.retry.backoff_multiplier ^ (attempt-1))
          sleep(delay)
        ELSE:
          # Max retries exhausted
          subscription.metrics.messages_failed += 1
          
          IF subscription.retry.dead_letter_topic:
            event_bus.publish(
              topic = subscription.retry.dead_letter_topic,
              event_type = "DEAD_LETTER",
              payload = {original_event: event, error: str(err), subscription_id: subscription.subscription_id}
            )
            subscription.metrics.messages_dead_lettered += 1
          
          subscription.status = "ERROR"
          alert_subscription_error(subscription, err)
          RETURN NACK

invoke_handler(subscription, event):
  MATCH subscription.handler.handler_type:
    CASE "INTERNAL_FUNCTION":
      call_function(subscription.handler.internal_function, event)
    CASE "WEBHOOK":
      http_post(subscription.handler.webhook_url, payload=event, timeout=30)
    CASE "AGENT_INVOKE":
      agent_router.invoke(subscription.handler.agent_id, context={"event": event})
```

---

## Standard System Subscriptions

```yaml
standard_subscriptions:
  
  - name: "execution-tracer-all"
    owner_system_id: execution-tracer
    consumer_group_id: "execution-tracer"
    routing:
      topics: ["workflow.events", "gate.verdicts", "agent.invocations", "escalations"]
      event_type_filter: null           # All types
    delivery:
      from_offset: LATEST
      max_batch_size: 200
      delivery_guarantee: AT_LEAST_ONCE
    handler:
      handler_type: INTERNAL_FUNCTION
      internal_function: "execution_tracer.ingest_event"
    retry:
      max_retries: 3
      retry_delay_seconds: 5
      dead_letter_topic: "tracer.dlq"
  
  - name: "twin-sync-workflow-events"
    owner_system_id: twin-sync
    consumer_group_id: "twin-sync"
    routing:
      topics: ["workflow.events", "gate.verdicts", "escalations"]
    delivery:
      from_offset: LATEST
      delivery_guarantee: EXACTLY_ONCE
    handler:
      handler_type: INTERNAL_FUNCTION
      internal_function: "twin_sync.on_event"
    retry:
      max_retries: 5
      retry_delay_seconds: 10
  
  - name: "reactive-orchestration-universal"
    owner_system_id: reactive-orchestration
    consumer_group_id: "reactive-orchestration"
    routing:
      topics: ["workflow.events", "gate.verdicts", "predictions.alerts", "runtime.signals", "escalations", "agent.invocations"]
    delivery:
      from_offset: LATEST
      max_batch_size: 100
      delivery_guarantee: AT_LEAST_ONCE
    handler:
      handler_type: INTERNAL_FUNCTION
      internal_function: "reactive_orchestration.on_event_received"
    retry:
      max_retries: 2
      retry_delay_seconds: 2
  
  - name: "bottleneck-analyzer-runtime"
    owner_system_id: bottleneck-analyzer
    consumer_group_id: "bottleneck-analyzer"
    routing:
      topics: ["workflow.events", "agent.invocations", "runtime.signals"]
      event_type_filter: ["WORKFLOW_COMPLETED", "WORKFLOW_FAILED", "INVOCATION_COMPLETED", "BACKPRESSURE_SIGNAL"]
    delivery:
      from_offset: LATEST
      max_batch_size: 500
    handler:
      handler_type: INTERNAL_FUNCTION
      internal_function: "bottleneck_analyzer.ingest_sample"
    retry:
      max_retries: 1
```

---

## Consumer Lag Monitoring

```
monitor_subscription_health():
  
  FOR each subscription WHERE subscription.status == "ACTIVE":
    
    # Compute lag per partition
    FOR each topic in subscription.routing.topics:
      FOR each partition in assigned_partitions(subscription, topic):
        latest_offset = event_bus.get_latest_offset(topic, partition)
        committed_offset = event_bus.get_committed_offset(subscription.consumer_group_id, topic, partition)
        lag = latest_offset - committed_offset
        
        subscription.metrics.consumer_lag += lag
        
        # Alert if lag exceeds threshold
        IF lag > LAG_ALERT_THRESHOLD:
          publish_signal(
            signal_type = "SUBSCRIPTION_LAG_ALERT",
            payload = {
              subscription_id: subscription.subscription_id,
              topic: topic,
              partition: partition,
              lag: lag,
              lag_threshold: LAG_ALERT_THRESHOLD
            }
          )
    
    # Error rate alert
    IF subscription.metrics.error_rate_1h > 0.10:
      subscription.status = "ERROR"
      publish_signal("SUBSCRIPTION_HIGH_ERROR_RATE", {subscription_id: subscription.subscription_id})
```

---

## Integration

**Called by:**
- All OS systems that need managed event consumption — twin-sync, execution-tracer, reactive-orchestration, bottleneck-analyzer
- `runtime-clusters/event-bus.md` — delegates subscription lifecycle operations

**Calls:**
- `runtime-clusters/event-bus.md` — subscribe, pause, resume, unsubscribe consumer groups

**Reads from:** `memory/runtime-clusters/subscriptions.yaml`
**Writes to:** `memory/runtime-clusters/subscriptions.yaml`

**Output consumed by:**
- All registered subscriber systems (via handler dispatch)
- `execution-observability/orchestration-monitor.md` — monitors subscription health metrics
