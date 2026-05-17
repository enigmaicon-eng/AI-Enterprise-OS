# Reactive Orchestration

**System ID:** `reactive-orchestration`
**Role:** Drives event-reactive workflow activation — listens to the event bus, evaluates trigger conditions, activates workflows in response to events, and implements choreography-based decoupled coordination between systems
**Storage:** `memory/runtime-clusters/reactive-state.yaml`

---

## Purpose

The reactive orchestration layer inverts the control flow of traditional scheduled execution: instead of workflows checking for conditions, conditions reach out and activate workflows. When a gate verdict arrives, the reactive layer determines if any waiting workflow should resume. When a prediction alert fires, the reactive layer decides if an incident response workflow should launch. This is the difference between polling and push — the former is slow and expensive; the latter is immediate and efficient.

---

## Choreography vs Orchestration

The system supports both coordination styles:

```
ORCHESTRATION (centralized):
  A central orchestrator (dag-engine) explicitly commands each step.
  
  dag-engine → dispatch(node_A) → worker
  dag-engine → await(result) → dag-engine
  dag-engine → dispatch(node_B, input=result_A) → worker
  
  Pros: Clear control, easy to trace
  Cons: Central bottleneck, tight coupling

CHOREOGRAPHY (decentralized):
  Systems react to events without a central controller telling them what to do.
  
  system_A publishes → "STEP_A_COMPLETED"
  system_B subscribes → evaluates condition → acts
  system_C subscribes → evaluates condition → acts
  
  Pros: Decoupled, resilient, scalable
  Cons: Harder to trace, emergent behavior

HYBRID (this system):
  Within a workflow: orchestration (dag-engine controls)
  Between workflows: choreography (reactive-orchestration drives)
  Cross-system reactions: choreography (event triggers activate new runs)
```

---

## Reactive Activation Model

```yaml
ReactiveRule:
  rule_id: string
  name: string
  
  # What to watch
  trigger:
    topic: string                    # Event bus topic to watch
    event_type: string | null        # Filter by event_type (null = any)
    filter_expression: string | null # CEL expression over event payload
  
  # What to do when triggered
  action:
    action_type: "START_WORKFLOW | RESUME_WORKFLOW | SIGNAL_WORKFLOW | PUBLISH_EVENT | INVOKE_AGENT"
    
    # For START_WORKFLOW
    workflow_definition_id: string | null
    input_mapping: object | null         # Maps event fields to workflow input
    
    # For RESUME_WORKFLOW / SIGNAL_WORKFLOW
    run_id_expression: string | null     # CEL expression to resolve run_id from event
    signal_type: string | null
    
    # For PUBLISH_EVENT
    target_topic: string | null
    output_event_type: string | null
    output_payload_mapping: object | null
    
    # For INVOKE_AGENT
    agent_id: string | null
    context_mapping: object | null
  
  # Concurrency control
  concurrency:
    max_concurrent_activations: integer  # 0 = unlimited
    overlap_policy: "ALLOW | SKIP | QUEUE | TERMINATE_PRIOR"
  
  # Deduplication
  deduplication_window_seconds: integer  # 0 = no dedup
  deduplication_key_expression: string | null  # CEL expr; default = event_id
  
  enabled: boolean
  priority: integer                        # Higher = evaluated first on same topic
```

---

## Reactive Processing Loop

```
start_reactive_processor():
  
  # Subscribe to ALL topics (reactive-orchestration is a universal consumer)
  FOR each topic in event_bus.get_all_topics():
    event_bus.subscribe(
      topic = topic,
      consumer_group_id = "reactive-orchestration",
      handler_fn = on_event_received,
      from_offset = "LATEST"
    )

on_event_received(event):
  
  # Load all rules matching this topic and event_type
  candidate_rules = rule_registry.get_rules(
    topic = event.topic,
    event_type = event.event_type
  )
  
  # Sort by priority descending
  candidate_rules.sort(key = lambda r: -r.priority)
  
  FOR each rule in candidate_rules:
    IF NOT rule.enabled:
      CONTINUE
    
    # Evaluate filter expression (if any)
    IF rule.trigger.filter_expression:
      context = build_cel_context(event)
      IF NOT cel_eval(rule.trigger.filter_expression, context):
        CONTINUE
    
    # Deduplication check
    IF rule.deduplication_window_seconds > 0:
      dedup_key = resolve_dedup_key(rule, event)
      IF dedup_store.seen_recently(dedup_key, rule.deduplication_window_seconds):
        log("REACTIVE_DEDUP_SKIP", rule_id=rule.rule_id, event_id=event.event_id)
        CONTINUE
      dedup_store.record(dedup_key, ttl=rule.deduplication_window_seconds)
    
    # Concurrency check
    IF NOT check_concurrency(rule):
      handle_overlap(rule, event)
      CONTINUE
    
    # Execute action
    execute_reactive_action(rule, event)

execute_reactive_action(rule, event):
  
  action = rule.action
  
  MATCH action.action_type:
    
    CASE "START_WORKFLOW":
      input = resolve_mapping(action.input_mapping, event.payload)
      result = workflow_registry.get_definition(action.workflow_definition_id)
      IF result.valid:
        run_id = dag_engine.start_workflow(
          definition_id = action.workflow_definition_id,
          input = input,
          causation_event_id = event.event_id,
          correlation_id = event.headers.correlation_id
        )
        record_activation(rule.rule_id, event.event_id, run_id)
    
    CASE "RESUME_WORKFLOW":
      run_id = cel_eval(action.run_id_expression, build_cel_context(event))
      dag_engine.send_signal(run_id, signal_type="RESUME", payload=event.payload)
    
    CASE "SIGNAL_WORKFLOW":
      run_id = cel_eval(action.run_id_expression, build_cel_context(event))
      dag_engine.send_signal(run_id, signal_type=action.signal_type, payload=event.payload)
    
    CASE "PUBLISH_EVENT":
      output_payload = resolve_mapping(action.output_payload_mapping, event.payload)
      event_bus.publish(
        topic = action.target_topic,
        event_type = action.output_event_type,
        payload = output_payload,
        partition_key = event.partition_key,
        headers = {causation_id: event.event_id, correlation_id: event.headers.correlation_id}
      )
    
    CASE "INVOKE_AGENT":
      context = resolve_mapping(action.context_mapping, event.payload)
      agent_router.invoke(agent_id=action.agent_id, context=context)
```

---

## Built-In Reactive Rules

```yaml
built_in_rules:
  
  - rule_id: "gate-verdict-resume"
    name: "Resume waiting workflows on gate verdict"
    trigger:
      topic: "gate.verdicts"
      event_type: "GATE_VERDICT_ISSUED"
    action:
      action_type: RESUME_WORKFLOW
      run_id_expression: "event.payload.workflow_run_id"
      signal_type: "GATE_RESOLVED"
    deduplication_window_seconds: 60
    priority: 100
  
  - rule_id: "prediction-alert-incident"
    name: "Start incident workflow on IMMEDIATE prediction"
    trigger:
      topic: "predictions.alerts"
      event_type: "PREDICTION_ALERT"
      filter_expression: "event.payload.urgency == 'IMMEDIATE'"
    action:
      action_type: START_WORKFLOW
      workflow_definition_id: "incident-response-v1"
      input_mapping:
        prediction_id: "event.payload.prediction_id"
        bottleneck_class: "event.payload.bottleneck_class"
        probability: "event.payload.probability"
    concurrency:
      max_concurrent_activations: 5
      overlap_policy: ALLOW
    priority: 90
  
  - rule_id: "workflow-failed-notify"
    name: "Publish escalation event on workflow failure"
    trigger:
      topic: "workflow.events"
      event_type: "WORKFLOW_FAILED"
    action:
      action_type: PUBLISH_EVENT
      target_topic: "escalations"
      output_event_type: "WORKFLOW_FAILURE_ESCALATION"
      output_payload_mapping:
        run_id: "event.payload.run_id"
        definition_id: "event.payload.definition_id"
        failure_reason: "event.payload.failure_reason"
        failed_node: "event.payload.failed_node_id"
    priority: 80
  
  - rule_id: "scaling-signal-react"
    name: "Trigger scale-out on sustained HIGH backpressure"
    trigger:
      topic: "runtime.signals"
      event_type: "BACKPRESSURE_SIGNAL"
      filter_expression: "event.payload.level == 'HIGH' OR event.payload.level == 'CRITICAL'"
    action:
      action_type: SIGNAL_WORKFLOW
      run_id_expression: "'execution-scaling-monitor'"
      signal_type: "SCALE_OUT_REQUESTED"
    deduplication_window_seconds: 120
    priority: 70
```

---

## Overlap Handling

```
handle_overlap(rule, event):
  
  policy = rule.concurrency.overlap_policy
  
  MATCH policy:
    
    CASE "SKIP":
      # New activation dropped; current run continues
      log("REACTIVE_OVERLAP_SKIP", rule_id=rule.rule_id)
    
    CASE "QUEUE":
      # Buffer event; process when a slot opens
      overlap_queue[rule.rule_id].enqueue(event)
      log("REACTIVE_OVERLAP_QUEUED", rule_id=rule.rule_id, queue_depth=len(overlap_queue[rule.rule_id]))
    
    CASE "TERMINATE_PRIOR":
      # Cancel prior run, start fresh
      active_runs = get_active_runs_for_rule(rule.rule_id)
      FOR run in active_runs:
        dag_engine.cancel(run.run_id, reason="REACTIVE_OVERLAP_TERMINATE_PRIOR")
      execute_reactive_action(rule, event)  # Now within concurrency limit
```

---

## Reactive State Schema

```yaml
ReactiveState:
  last_updated: datetime
  
  rule_registry:
    [rule_id]:
      rule_id: string
      enabled: boolean
      last_fired_at: datetime | null
      fire_count: integer
      last_event_id: string | null
  
  active_activations:
    [activation_id]:
      rule_id: string
      causation_event_id: string
      started_at: datetime
      run_id: string | null
      status: "ACTIVE | COMPLETED | FAILED"
  
  dedup_store:
    [dedup_key]:
      recorded_at: datetime
      expires_at: datetime
```

---

## Integration

**Called by:** Nothing (self-driven via event bus subscription)
**Calls:**
- `runtime-clusters/event-bus.md` — subscribes to all topics, publishes output events
- `workflow-engine/dag-engine.md` — start_workflow, send_signal, cancel
- `workflow-engine/workflow-registry.md` — validates definition exists before activation

**Reads from:** `memory/runtime-clusters/reactive-state.yaml`
**Writes to:** `memory/runtime-clusters/reactive-state.yaml`

**Output consumed by:**
- `workflow-engine/dag-engine.md` — receives workflow start/signal/cancel calls
- `runtime-clusters/event-triggers.md` — evaluates conditions that reactive-orchestration acts on
