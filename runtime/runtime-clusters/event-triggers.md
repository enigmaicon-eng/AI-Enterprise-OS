# Event Triggers

**System ID:** `event-triggers`
**Role:** Manages declarative trigger conditions that translate raw event bus events into structured activation signals — evaluates composite conditions, temporal windows, threshold crossings, and pattern sequences; produces normalized trigger signals consumed by reactive-orchestration
**Storage:** `memory/runtime-clusters/trigger-state.yaml`

---

## Purpose

Not every event should trigger an action. A single task failure is noise. Three failures in ten minutes from the same executor type is a signal. A gate pass rate dropping below 60% is a concern. The event trigger system sits between the raw event bus and reactive orchestration — it transforms raw event streams into meaningful trigger signals using condition logic, windowing, counting, and sequencing that would be too complex to express in simple filter expressions.

---

## Trigger Types

```yaml
TriggerDefinition:
  trigger_id: string
  name: string
  description: string
  
  trigger_type: "SIMPLE | THRESHOLD | WINDOWED_COUNT | SEQUENCE | COMPOSITE"
  
  # SIMPLE: fires on any matching event
  simple:
    topic: string
    event_type: string | null
    filter_expression: string | null    # CEL
  
  # THRESHOLD: fires when a value crosses a threshold
  threshold:
    metric_expression: string           # CEL expression evaluated against event payload
    threshold_value: float
    comparison: "GT | GTE | LT | LTE | EQ | NEQ"
    hysteresis_pct: float               # Must recover by this % before re-firing
  
  # WINDOWED_COUNT: fires when N events occur in a time window
  windowed_count:
    topic: string
    event_type: string | null
    filter_expression: string | null
    count_threshold: integer
    window_seconds: integer
    group_by_key_expression: string | null  # Count per key (e.g., executor_type)
  
  # SEQUENCE: fires when events occur in defined order within window
  sequence:
    steps:
      - step_id: string
        topic: string
        event_type: string
        filter_expression: string | null
        must_complete_within_seconds: integer | null
    window_seconds: integer             # Total window for full sequence
    partial_match_timeout_seconds: integer
  
  # COMPOSITE: fires when multiple sub-triggers are all active
  composite:
    sub_trigger_ids: [string]
    operator: "AND | OR"
    window_seconds: integer             # Sub-triggers must all fire within this window
  
  output:
    signal_type: string                 # Normalized signal name
    payload_mapping: object             # Maps trigger context to signal payload
  
  cooldown_seconds: integer             # Minimum interval between fires
  enabled: boolean
```

---

## Simple Trigger Evaluation

```
evaluate_simple(trigger, event):
  
  IF trigger.simple.topic != event.topic:
    RETURN NoMatch
  
  IF trigger.simple.event_type AND trigger.simple.event_type != event.event_type:
    RETURN NoMatch
  
  IF trigger.simple.filter_expression:
    IF NOT cel_eval(trigger.simple.filter_expression, build_context(event)):
      RETURN NoMatch
  
  RETURN TriggerMatch(
    trigger_id = trigger.trigger_id,
    matched_event_id = event.event_id,
    signal = build_signal(trigger, event)
  )
```

---

## Windowed Count Trigger

```
evaluate_windowed_count(trigger, event):
  
  # Does this event match the trigger's filter?
  IF NOT matches_filter(trigger.windowed_count, event):
    RETURN NoMatch
  
  # Resolve group key (e.g., executor_type from event payload)
  group_key = null
  IF trigger.windowed_count.group_by_key_expression:
    group_key = cel_eval(trigger.windowed_count.group_by_key_expression, build_context(event))
  
  # Update sliding window counter
  window = get_or_create_window(trigger.trigger_id, group_key, trigger.windowed_count.window_seconds)
  window.add_event(event.event_id, event.timestamp)
  window.evict_expired()  # Remove events outside the window
  
  current_count = window.count()
  
  # Record in trigger state
  update_trigger_state(trigger.trigger_id, group_key, current_count)
  
  IF current_count >= trigger.windowed_count.count_threshold:
    IF NOT in_cooldown(trigger, group_key):
      record_fire(trigger, group_key)
      RETURN TriggerMatch(
        trigger_id = trigger.trigger_id,
        signal = build_signal(trigger, {count: current_count, group_key: group_key, events: window.event_ids})
      )
  
  RETURN NoMatch
```

---

## Sequence Trigger

```
PartialSequenceState:
  trigger_id: string
  correlation_key: string          # Groups events that belong to same sequence instance
  completed_steps: [step_id]
  pending_step_index: integer
  started_at: datetime
  step_events: {step_id: event_id}

evaluate_sequence(trigger, event):
  
  # Check if event matches the next pending step
  sequences = get_active_sequences(trigger.trigger_id)
  
  FOR each partial in sequences:
    next_step = trigger.sequence.steps[partial.pending_step_index]
    
    # Check step expiry
    IF partial.started_at + trigger.sequence.window_seconds < now():
      expire_sequence(partial)
      CONTINUE
    
    IF matches_step(next_step, event):
      partial.completed_steps.append(next_step.step_id)
      partial.step_events[next_step.step_id] = event.event_id
      partial.pending_step_index += 1
      
      IF partial.pending_step_index == len(trigger.sequence.steps):
        # Sequence complete
        complete_sequence(partial)
        RETURN TriggerMatch(
          trigger_id = trigger.trigger_id,
          signal = build_signal(trigger, {sequence_events: partial.step_events})
        )
  
  # Check if event matches FIRST step → start new sequence instance
  first_step = trigger.sequence.steps[0]
  IF matches_step(first_step, event):
    new_partial = PartialSequenceState(
      trigger_id = trigger.trigger_id,
      correlation_key = generate_correlation_key(trigger, event),
      completed_steps = [first_step.step_id],
      pending_step_index = 1,
      started_at = now(),
      step_events = {first_step.step_id: event.event_id}
    )
    save_sequence(new_partial)
  
  RETURN NoMatch

# Garbage collect: expire partial sequences past window
cleanup_stale_sequences():
  FOR each partial in all_active_sequences:
    IF partial.started_at + trigger.sequence.window_seconds < now():
      expire_sequence(partial)
```

---

## Built-In Trigger Definitions

```yaml
built_in_triggers:
  
  - trigger_id: "worker-failure-burst"
    name: "Worker failure burst detector"
    trigger_type: WINDOWED_COUNT
    windowed_count:
      topic: "agent.invocations"
      event_type: "INVOCATION_FAILED"
      count_threshold: 5
      window_seconds: 300              # 5 in 5 minutes
      group_by_key_expression: "event.payload.executor_type"
    output:
      signal_type: "WORKER_FAILURE_BURST"
      payload_mapping:
        executor_type: "context.group_key"
        failure_count: "context.count"
    cooldown_seconds: 300
  
  - trigger_id: "gate-pass-rate-drop"
    name: "Gate pass rate dropped below threshold"
    trigger_type: THRESHOLD
    threshold:
      metric_expression: "event.payload.pass_rate_7d"
      threshold_value: 0.60
      comparison: LT
      hysteresis_pct: 0.10             # Must recover to 66% before re-firing
    output:
      signal_type: "GATE_PASS_RATE_LOW"
      payload_mapping:
        gate_id: "event.payload.gate_id"
        pass_rate: "event.payload.pass_rate_7d"
    cooldown_seconds: 3600
  
  - trigger_id: "execution-saturation-sequence"
    name: "Detect saturation → failure cascade sequence"
    trigger_type: SEQUENCE
    sequence:
      steps:
        - step_id: "high-queue-depth"
          topic: "runtime.signals"
          event_type: "BACKPRESSURE_SIGNAL"
          filter_expression: "event.payload.level == 'HIGH'"
        - step_id: "worker-failures-follow"
          topic: "agent.invocations"
          event_type: "INVOCATION_FAILED"
          must_complete_within_seconds: 300
        - step_id: "workflow-delays-follow"
          topic: "workflow.events"
          event_type: "WORKFLOW_DEADLINE_AT_RISK"
          must_complete_within_seconds: 600
      window_seconds: 900
      partial_match_timeout_seconds: 900
    output:
      signal_type: "SATURATION_CASCADE_DETECTED"
    cooldown_seconds: 1800
  
  - trigger_id: "twin-divergence-composite"
    name: "Multiple twins show divergence simultaneously"
    trigger_type: COMPOSITE
    composite:
      sub_trigger_ids:
        - "org-twin-stale"
        - "runtime-twin-anomaly"
      operator: AND
      window_seconds: 600
    output:
      signal_type: "TWIN_SYSTEM_HEALTH_CONCERN"
    cooldown_seconds: 3600
```

---

## Trigger Output Signal Schema

```yaml
TriggerSignal:
  signal_id: string                    # uuid
  trigger_id: string
  signal_type: string
  
  fired_at: datetime
  causation_event_ids: [string]        # Events that caused this signal
  correlation_id: string
  
  payload: any                         # Trigger-specific data
  
  # Context for downstream rules
  trigger_context:
    trigger_type: string
    match_count: integer | null        # For windowed_count
    window_seconds: integer | null
    group_key: string | null
    sequence_duration_seconds: float | null
```

---

## Trigger State Schema

```yaml
TriggerState:
  last_updated: datetime
  
  triggers:
    [trigger_id]:
      enabled: boolean
      fire_count: integer
      last_fired_at: datetime | null
      cooldown_until: datetime | null
      
      # For windowed_count: sliding window state per group_key
      windows:
        [group_key]:
          event_ids: [string]
          event_timestamps: [datetime]
          current_count: integer
      
      # For threshold: hysteresis tracking
      threshold_state:
        last_value: float | null
        is_breached: boolean
        breach_since: datetime | null
      
      # For sequence: partial matches
      partial_sequences:
        [correlation_key]:
          completed_steps: [string]
          pending_step_index: integer
          started_at: datetime
          step_events: object
```

---

## Integration

**Called by:** `runtime-clusters/event-bus.md` — subscribes to all topics; also called by reactive-orchestration as a pre-evaluation layer
**Calls:**
- `runtime-clusters/event-bus.md` — consumes events via subscription
- `runtime-clusters/reactive-orchestration.md` — delivers TriggerSignals for action dispatch
- `runtime-clusters/runtime-signals.md` — emits runtime.signals events for cross-system signals

**Reads from:** `memory/runtime-clusters/trigger-state.yaml`
**Writes to:** `memory/runtime-clusters/trigger-state.yaml`
