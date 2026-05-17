# Event Propagation Engine

**System ID:** `event-propagation-engine`
**Role:** Processes and propagates enterprise events across all consuming systems — applies fan-out routing, enriches events with enterprise context, transforms event payloads for target consumer schemas, manages event chains, and ensures reliable multi-consumer delivery with back-pressure handling
**Storage:** `memory/enterprise-telemetry/propagation-state.yaml`

---

## Purpose

Publishing an event to the enterprise event bus is only the first step. The propagation engine ensures that event reaches every system that needs it, in the form that system expects, with the context it needs to act. It operates as the enterprise nervous system's signal relay layer: receiving raw signals, enriching them with organizational context, transforming them for consumers, and fanning them out to all registered subscribers while tracking delivery status.

---

## Event Enrichment

```
enrich_event(raw_event) → EnrichedEvent:
  
  enriched = EnrichedEvent(**raw_event)
  
  # 1. Organizational context
  IF raw_event.source.agent_id:
    manifest = capability_scope_controller.load_manifest(raw_event.source.agent_id)
    enriched.context.agent_trust_tier = manifest.trust_tier
    enriched.context.agent_authority_level = manifest.governance.authority_level
    enriched.context.agent_zone = trust_boundary_registry.get_zone(raw_event.source.agent_id)
  
  # 2. Run context
  IF raw_event.source.run_id:
    run_summary = dag_runtime.get_execution_summary(raw_event.source.run_id)
    enriched.context.workflow_definition_id = run_summary.definition_id
    enriched.context.workflow_started_at = run_summary.started_at
    enriched.context.workflow_priority = run_summary.priority
    enriched.context.slo_target_seconds = run_summary.slo_target_seconds
    enriched.context.elapsed_seconds = (now() - run_summary.started_at).total_seconds()
  
  # 3. Governance context
  IF raw_event.event_category in ["GOVERNANCE", "RUNTIME"]:
    binding = policy_binding_engine.load_current_binding(raw_event.source.run_id)
    IF binding:
      enriched.context.policy_binding_id = binding.binding_id
      enriched.context.constitution_version = get_constitution_version(binding)
  
  # 4. Temporal context
  enriched.context.published_at = raw_event.published_at
  enriched.context.propagation_started_at = now()
  enriched.context.time_of_day = classify_time_of_day(now())   # BUSINESS_HOURS | OFF_HOURS | WEEKEND
  
  RETURN enriched
```

---

## Fan-Out Protocol

```
propagate(raw_event) → PropagationResult:
  
  # Step 1: Enrich
  enriched = enrich_event(raw_event)
  
  # Step 2: Apply cross-topic routing
  derived_events = enterprise_event_bus.apply_routing_rules(raw_event)
  
  # Step 3: Fan-out to subscribers
  subscribers = telemetry_subscriptions.get_subscribers(raw_event.topic, raw_event.tags)
  
  delivery_results = []
  
  FOR subscriber in subscribers:
    
    # Transform payload for subscriber's schema
    transformed = transform_for_consumer(enriched, subscriber)
    
    # Check back-pressure
    IF subscriber.queue_depth > subscriber.max_queue_depth × 0.90:
      IF subscriber.back_pressure_policy == "DROP_LOW_PRIORITY" AND raw_event.priority == "LOW":
        delivery_results.append(DeliveryResult(
          subscriber_id = subscriber.subscriber_id,
          status = "DROPPED_BACK_PRESSURE",
          reason = "Subscriber queue at 90% capacity; low-priority event dropped"
        ))
        CONTINUE
      
      ELIF subscriber.back_pressure_policy == "WAIT":
        wait_for_capacity(subscriber, timeout_ms=5000)
    
    # Deliver
    result = deliver_to_subscriber(subscriber, transformed)
    delivery_results.append(result)
  
  # Step 4: Propagate derived events
  FOR derived in derived_events:
    derived_enriched = enrich_event(derived)
    schedule_propagation(derived_enriched)   # Async — avoid recursive stack growth
  
  # Step 5: Record propagation
  record = PropagationRecord(
    event_id = raw_event.event_id,
    subscribers_targeted = len(subscribers),
    delivered = sum(1 for r in delivery_results if r.status == "DELIVERED"),
    dropped = sum(1 for r in delivery_results if r.status.startswith("DROPPED")),
    failed = sum(1 for r in delivery_results if r.status == "FAILED"),
    derived_events_generated = len(derived_events),
    propagated_at = now()
  )
  persist_propagation_record(record)
  
  RETURN PropagationResult(record=record, delivery_results=delivery_results)
```

---

## Event Transformation

```
transform_for_consumer(enriched_event, subscriber) → TransformedEvent:
  
  IF subscriber.schema_format == "NATIVE":
    RETURN enriched_event    # No transformation
  
  IF subscriber.schema_format == "SLIM":
    # Strip enrichment context — only core fields
    RETURN SlimEvent(
      event_id = enriched_event.event_id,
      event_type = enriched_event.event_type,
      payload = enriched_event.payload,
      published_at = enriched_event.published_at,
      priority = enriched_event.priority
    )
  
  IF subscriber.schema_format == "DASHBOARD":
    # Transform for UI display — flatten nested fields, add display labels
    RETURN DashboardEvent(
      id = enriched_event.event_id,
      type = enriched_event.event_type,
      category = enriched_event.event_category,
      display_label = get_display_label(enriched_event.event_type),
      summary = build_human_summary(enriched_event),
      severity = map_priority_to_severity(enriched_event.priority),
      timestamp = enriched_event.published_at,
      run_id = enriched_event.source.run_id,
      agent = enriched_event.context.get("agent_trust_tier")
    )
  
  IF subscriber.schema_format == "METRICS":
    # Transform for time-series ingestion
    RETURN MetricEvent(
      metric_name = event_type_to_metric_name(enriched_event.event_type),
      value = extract_metric_value(enriched_event),
      labels = {
        topic: enriched_event.topic,
        agent_tier: enriched_event.context.get("agent_trust_tier"),
        workflow_id: enriched_event.source.run_id
      },
      timestamp = enriched_event.published_at
    )
```

---

## Event Chain Management

```
# Events can trigger chains of subsequent events (causal chains)
# The propagation engine tracks these to prevent infinite loops and enable debugging

EventChain:
  chain_id: string
  root_event_id: string
  events: [ChainNode]
  depth: integer
  max_depth: integer               # Hard cap: 10 — prevents infinite event loops
  status: "ACTIVE | COMPLETE | ABORTED"

track_event_chain(event, parent_event_id) → EventChain:
  
  IF parent_event_id:
    chain = load_chain_by_root(parent_event_id) or load_chain_containing(parent_event_id)
    IF chain.depth >= chain.max_depth:
      log_warning("Event chain depth limit reached; aborting chain", chain_id=chain.chain_id)
      enterprise_event_bus.publish(
        event_type = "EVENT_CHAIN_ABORTED",
        payload = {chain_id: chain.chain_id, depth: chain.depth},
        priority = "HIGH"
      )
      RETURN chain   # Stop propagation
    chain.events.append(ChainNode(event_id=event.event_id, depth=chain.depth+1))
    chain.depth += 1
  ELSE:
    chain = EventChain(
      chain_id = generate_uuid(),
      root_event_id = event.event_id,
      events = [ChainNode(event_id=event.event_id, depth=0)],
      depth = 0,
      max_depth = 10,
      status = "ACTIVE"
    )
  
  persist_chain(chain)
  RETURN chain
```

---

## Back-Pressure and Overflow

```
# Enterprise-level back-pressure thresholds

BACK_PRESSURE_THRESHOLDS:
  
  NORMAL:     queue_depth_ratio: 0.0 - 0.70    # Free flow
  ELEVATED:   queue_depth_ratio: 0.70 - 0.85   # Monitor; log warning
  HIGH:       queue_depth_ratio: 0.85 - 0.95   # Drop LOW priority; slow publish rate
  CRITICAL:   queue_depth_ratio: 0.95 - 1.00   # Drop LOW+NORMAL; alert operator; force shed

apply_back_pressure_policy(level, event) → "DELIVER | DROP | WAIT":
  
  IF level == "CRITICAL":
    IF event.priority in ["CRITICAL", "HIGH"]:
      RETURN "DELIVER"    # Always deliver critical signals
    enterprise_event_bus.publish("alerts.high", EventType="BACK_PRESSURE_CRITICAL", ...)
    RETURN "DROP"
  
  IF level == "HIGH":
    IF event.priority == "LOW":
      RETURN "DROP"
  
  RETURN "DELIVER"
```

---

## Integration

**Called by:**
- `enterprise-telemetry/enterprise-event-bus.md` — drives fan-out after publish
- All telemetry producers that need reliable multi-consumer delivery

**Calls:**
- `enterprise-telemetry/telemetry-subscriptions.md` — resolves subscriber list
- `execution-security/capability-scope-controller.md` — agent context enrichment
- `trust-boundaries/trust-boundary-registry.md` — zone context enrichment
- `governance-attestation/policy-binding-engine.md` — governance context enrichment

**Writes to:** `memory/enterprise-telemetry/propagation-state.yaml`
