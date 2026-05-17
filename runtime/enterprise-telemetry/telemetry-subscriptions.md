# Telemetry Subscriptions

**System ID:** `telemetry-subscriptions`
**Role:** Manages the subscription plane for the enterprise event bus — maintains the registry of all active subscriptions, resolves subscribers for incoming events, enforces subscription policies, tracks delivery health per subscriber, and provides subscription lifecycle management for dashboards, monitors, and integration systems
**Storage:** `memory/enterprise-telemetry/subscriptions.yaml`

---

## Purpose

The enterprise event bus has 15 topics. Dozens of systems — dashboards, health scorers, monitors, integrations — need to receive specific subsets of events. The telemetry subscription system is the managed layer that connects publishers to consumers: tracking which system subscribes to which topics with which filters, managing the delivery queue per subscriber, monitoring consumer health (lag, error rates), and automatically suspending unhealthy consumers before they become backpressure bottlenecks.

---

## Subscription Schema

```yaml
Subscription:
  subscription_id: string
  subscriber_id: string            # System ID of the consuming system
  subscriber_type: "DASHBOARD | MONITOR | HEALTH_SCORER | TOPOLOGY | INTEGRATION | ALERT_ROUTER"
  
  # What to subscribe to
  topic_filters:
    - topic: string                # Enterprise event bus topic
      event_type_filter: [string] | null    # null = all event types on this topic
      priority_filter: [string] | null      # null = all priorities
      tag_filter: [string] | null           # null = no tag filtering
      cel_filter: string | null             # CEL expression for advanced filtering
  
  # Delivery configuration
  delivery:
    schema_format: "NATIVE | SLIM | DASHBOARD | METRICS"
    at_least_once: boolean         # true = redelivery on ack failure
    batch_size: integer            # Events delivered per poll
    poll_interval_seconds: integer
    max_queue_depth: integer       # Events buffered before back-pressure
    back_pressure_policy: "DROP_LOW_PRIORITY | WAIT | ALERT_AND_DROP"
  
  # Lifecycle
  status: "ACTIVE | PAUSED | DEGRADED | SUSPENDED"
  registered_at: datetime
  last_delivered_at: datetime | null
  last_health_check_at: datetime
  
  # Delivery tracking
  delivery_stats:
    events_delivered: integer
    events_dropped: integer
    delivery_errors: integer
    current_lag: integer           # Events pending delivery
    avg_delivery_ms: float
```

---

## Standard Subscriptions

```yaml
# Built-in subscriptions for core enterprise nervous system components

standard_subscriptions:
  
  enterprise-operations-console:
    subscriber_type: DASHBOARD
    topic_filters:
      - topic: alerts.critical
        priority_filter: [CRITICAL]
      - topic: alerts.high
      - topic: governance.constitutional
        event_type_filter: [ABSOLUTE_CONSTITUTIONAL_VIOLATION, MANDATORY_VIOLATION, CONSTITUTIONAL_OVERRIDE]
      - topic: org.escalation.events
      - topic: telemetry.health.scores
    delivery:
      schema_format: DASHBOARD
      batch_size: 50
      poll_interval_seconds: 5
      max_queue_depth: 1000
      back_pressure_policy: DROP_LOW_PRIORITY
  
  runtime-dashboards:
    subscriber_type: DASHBOARD
    topic_filters:
      - topic: runtime.workflow.lifecycle
      - topic: runtime.workflow.gates
      - topic: telemetry.metrics
      - topic: runtime.trust.signals
    delivery:
      schema_format: DASHBOARD
      batch_size: 200
      poll_interval_seconds: 10
      max_queue_depth: 5000
      back_pressure_policy: DROP_LOW_PRIORITY
  
  governance-telemetry:
    subscriber_type: MONITOR
    topic_filters:
      - topic: governance.decisions
      - topic: governance.policy.changes
      - topic: governance.constitutional
      - topic: runtime.workflow.gates
      - topic: runtime.security.events
    delivery:
      schema_format: NATIVE
      at_least_once: true
      batch_size: 100
      poll_interval_seconds: 15
      max_queue_depth: 2000
  
  orchestration-telemetry:
    subscriber_type: MONITOR
    topic_filters:
      - topic: runtime.trust.signals
      - topic: runtime.workflow.lifecycle
      - topic: org.agent.lifecycle
      - topic: org.capacity.signals
    delivery:
      schema_format: NATIVE
      batch_size: 150
      poll_interval_seconds: 15
      max_queue_depth: 3000
  
  organizational-stress-detector:
    subscriber_type: HEALTH_SCORER
    topic_filters:
      - topic: org.capacity.signals
      - topic: org.escalation.events
      - topic: runtime.security.events
        cel_filter: "payload.severity in ['HIGH', 'CRITICAL']"
      - topic: telemetry.health.scores
    delivery:
      schema_format: SLIM
      batch_size: 50
      poll_interval_seconds: 30
      max_queue_depth: 500
  
  runtime-topology-maps:
    subscriber_type: TOPOLOGY
    topic_filters:
      - topic: org.agent.lifecycle
      - topic: runtime.workflow.lifecycle
      - topic: runtime.trust.signals
      - topic: org.capacity.signals
    delivery:
      schema_format: SLIM
      batch_size: 100
      poll_interval_seconds: 20
      max_queue_depth: 2000
  
  immutable-audit-log:
    subscriber_type: MONITOR
    topic_filters:
      - topic: governance.decisions
      - topic: governance.constitutional
      - topic: runtime.security.events
      - topic: governance.policy.changes
    delivery:
      schema_format: NATIVE
      at_least_once: true
      batch_size: 500            # High throughput for audit chain
      poll_interval_seconds: 5
      max_queue_depth: 10000
      back_pressure_policy: ALERT_AND_DROP   # Audit log must never silently fail
  
  runtime-trigger-engine:
    subscriber_type: MONITOR
    topic_filters:
      - topic: org.capacity.signals
      - topic: runtime.workflow.lifecycle
      - topic: runtime.workflow.gates
      - topic: integration.notifications
      - topic: integration.data.signals
      - topic: telemetry.health.scores
    delivery:
      schema_format: SLIM
      batch_size: 100
      poll_interval_seconds: 10
      max_queue_depth: 1000
```

---

## Subscription Resolution

```
get_subscribers(topic, event_tags) → [Subscription]:
  
  # Fast index lookup — subscriptions indexed by topic
  candidates = subscription_index.get(topic, [])
  
  matching = []
  
  FOR sub in candidates:
    IF sub.status not in ["ACTIVE"]:
      CONTINUE
    
    # Find matching topic filter
    topic_filter = next((f for f in sub.topic_filters if f.topic == topic), null)
    IF NOT topic_filter:
      CONTINUE
    
    # Apply event_type filter
    IF topic_filter.event_type_filter and event.event_type not in topic_filter.event_type_filter:
      CONTINUE
    
    # Apply priority filter
    IF topic_filter.priority_filter and event.priority not in topic_filter.priority_filter:
      CONTINUE
    
    # Apply tag filter
    IF topic_filter.tag_filter:
      IF NOT any(tag in event_tags for tag in topic_filter.tag_filter):
        CONTINUE
    
    # Apply CEL filter
    IF topic_filter.cel_filter:
      IF NOT evaluate_cel(topic_filter.cel_filter, event):
        CONTINUE
    
    matching.append(sub)
  
  RETURN matching
```

---

## Consumer Health Monitoring

```
monitor_subscriber_health() → [SubscriberHealthAlert]:
  
  alerts = []
  
  FOR sub in get_all_active_subscriptions():
    
    # Lag check
    IF sub.delivery_stats.current_lag > sub.delivery.max_queue_depth × 0.80:
      alerts.append(SubscriberHealthAlert(
        subscriber_id = sub.subscriber_id,
        alert_type = "HIGH_LAG",
        severity = "HIGH",
        current_lag = sub.delivery_stats.current_lag,
        threshold = sub.delivery.max_queue_depth × 0.80
      ))
    
    # Last delivery check
    IF sub.last_delivered_at AND (now() - sub.last_delivered_at).total_seconds() > sub.delivery.poll_interval_seconds × 5:
      alerts.append(SubscriberHealthAlert(
        subscriber_id = sub.subscriber_id,
        alert_type = "STALLED",
        severity = "MEDIUM",
        stalled_for_seconds = (now() - sub.last_delivered_at).total_seconds()
      ))
    
    # Error rate check
    total = sub.delivery_stats.events_delivered + sub.delivery_stats.delivery_errors
    IF total > 100:
      error_rate = sub.delivery_stats.delivery_errors / total
      IF error_rate > 0.10:
        alerts.append(SubscriberHealthAlert(
          subscriber_id = sub.subscriber_id,
          alert_type = "HIGH_ERROR_RATE",
          severity = "HIGH",
          error_rate = error_rate,
          threshold = 0.10
        ))
        
        # Auto-suspend on persistent errors
        IF error_rate > 0.30:
          suspend_subscription(sub.subscription_id, reason=f"Error rate {error_rate:.0%} exceeds auto-suspend threshold")
  
  RETURN alerts

suspend_subscription(subscription_id, reason):
  sub = load_subscription(subscription_id)
  sub.status = "SUSPENDED"
  persist_subscription(sub)
  
  enterprise_event_bus.publish(
    topic = "alerts.high",
    event_type = "SUBSCRIPTION_SUSPENDED",
    payload = {subscription_id: subscription_id, subscriber_id: sub.subscriber_id, reason: reason}
  )
```

---

## Integration

**Called by:**
- `enterprise-telemetry/event-propagation-engine.md` — resolves subscriber list for each event
- All consuming systems — register/pause/resume/update subscriptions

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — publishes suspension alerts

**Writes to:** `memory/enterprise-telemetry/subscriptions.yaml`
