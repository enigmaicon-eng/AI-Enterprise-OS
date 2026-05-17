# Enterprise Event Bus

**System ID:** `enterprise-event-bus`
**Role:** Real-time enterprise-wide event backbone — routes cross-organizational, cross-system, and cross-workflow events to all consuming systems; serves as the nervous system's primary signal carrier, distinct from the execution-level event bus (runtime-clusters/event-bus.md) which handles workflow-internal coordination
**Storage:** `memory/enterprise-telemetry/event-bus-state.yaml`

---

## Purpose

The execution runtime event bus coordinates individual workflow runs. The enterprise event bus coordinates the entire enterprise: organizational events, governance decisions, strategic signals, integration notifications, and aggregated telemetry. Where the execution bus is scoped to a single workflow, the enterprise bus is scoped to the entire operating system — routing signals across agents, orgs, dashboards, monitors, and external integrations in real time.

---

## Enterprise Event Topics

```yaml
EnterpriseTopics:
  
  # Organizational events
  org.agent.lifecycle:
    description: "Agent registration, deregistration, suspension, capability changes"
    retention_hours: 720          # 30 days
    consumer_groups: [agent-registry, capability-scope-controller, org-twin]
  
  org.capacity.signals:
    description: "Agent load changes, team capacity shifts, escalation pressure"
    retention_hours: 168          # 7 days
    consumer_groups: [org-twin, organizational-stress-detector, orchestration-monitor]
  
  org.escalation.events:
    description: "Escalation initiated, escalation resolved, SLA breach"
    retention_hours: 720
    consumer_groups: [escalation-monitoring, governance-operations-dashboard, delivery-twin]
  
  # Governance events
  governance.decisions:
    description: "Constitutional evaluations, approvals, attestations, policy bindings"
    retention_hours: 8760         # 1 year — compliance requirement
    consumer_groups: [governance-telemetry, governance-latency-monitor, attestation-registry]
  
  governance.policy.changes:
    description: "Policy version changes, drift detections, binding updates"
    retention_hours: 8760
    consumer_groups: [policy-binding-engine, governance-health-scorer, audit-query-engine]
  
  governance.constitutional:
    description: "Constitutional evaluations, overrides, principle activations"
    retention_hours: 8760
    consumer_groups: [governance-telemetry, immutable-audit-log, enterprise-operations-console]
  
  # Runtime signals
  runtime.workflow.lifecycle:
    description: "Workflow started, completed, failed, cancelled, paused"
    retention_hours: 168
    consumer_groups: [workflow-telemetry, workflow-twin, operational-health-scorer]
  
  runtime.workflow.gates:
    description: "Gate evaluations, verdicts, threshold changes"
    retention_hours: 720
    consumer_groups: [governance-telemetry, workflow-command-center, bottleneck-analyzer]
  
  runtime.trust.signals:
    description: "Confidence scores, trust boundary crossings, reliability assessments"
    retention_hours: 168
    consumer_groups: [orchestration-telemetry, orchestration-health-scorer, runtime-dashboards]
  
  runtime.security.events:
    description: "Injection blocks, permission denials, scope violations, sandbox violations"
    retention_hours: 8760
    consumer_groups: [governance-telemetry, enterprise-operations-console, immutable-audit-log]
  
  # Telemetry aggregates
  telemetry.metrics:
    description: "Aggregated metric batches from all telemetry subsystems (1-min intervals)"
    retention_hours: 24
    consumer_groups: [runtime-dashboards, orchestration-heatmaps, live-topology-viewer]
  
  telemetry.health.scores:
    description: "Health scores from all health-scoring subsystems (5-min intervals)"
    retention_hours: 168
    consumer_groups: [enterprise-operations-console, org-twin, governance-operations-dashboard]
  
  # Integration events
  integration.notifications:
    description: "External system events: Jira tickets, Slack messages, PagerDuty alerts"
    retention_hours: 72
    consumer_groups: [orchestration-subscriptions, runtime-trigger-engine]
  
  integration.data.signals:
    description: "Data platform events: pipeline completions, anomalies, freshness alerts"
    retention_hours: 72
    consumer_groups: [runtime-trigger-engine, enterprise-operations-console]
  
  # Alert bus
  alerts.critical:
    description: "Critical alerts requiring immediate operator attention"
    retention_hours: 168
    priority: HIGHEST
    consumer_groups: [enterprise-operations-console, pagerduty-connector, slack-connector]
  
  alerts.high:
    description: "High-priority alerts for near-term action"
    retention_hours: 72
    priority: HIGH
    consumer_groups: [enterprise-operations-console, escalation-monitoring]
```

---

## Event Schema

```yaml
EnterpriseEvent:
  event_id: string               # UUID
  topic: string                  # One of EnterpriseTopics keys
  
  # Event identity
  event_type: string             # Fine-grained type within topic (e.g., "WORKFLOW_STARTED")
  event_category: "ORG | GOVERNANCE | RUNTIME | TELEMETRY | INTEGRATION | ALERT"
  
  # Source
  source:
    system_id: string            # Originating system
    agent_id: string | null      # Originating agent (if agent-generated)
    run_id: string | null        # Associated workflow run (if applicable)
    node_id: string | null
  
  # Payload
  payload: object                # Event-specific data
  payload_schema_version: string
  
  # Routing metadata
  priority: "CRITICAL | HIGH | NORMAL | LOW"
  tags: [string]                 # For subscription filter matching
  correlation_id: string | null  # Links causally related events
  parent_event_id: string | null # For event chains
  
  # Integrity
  published_at: datetime
  sequence_number: integer       # Monotonically increasing per topic
  event_hash: string             # SHA-256 of (event_id + topic + payload + published_at)
```

---

## Publish Protocol

```
publish_enterprise_event(event_type, payload, source, priority="NORMAL") → EnterpriseEvent:
  
  topic = resolve_topic(event_type)
  
  event = EnterpriseEvent(
    event_id = generate_uuid(),
    topic = topic,
    event_type = event_type,
    event_category = classify_category(topic),
    source = source,
    payload = payload,
    payload_schema_version = get_schema_version(event_type),
    priority = priority,
    tags = extract_tags(payload, source),
    correlation_id = source.run_id,
    published_at = now(),
    sequence_number = next_sequence(topic)
  )
  
  event.event_hash = sha256(canonical_serialize({
    event_id: event.event_id,
    topic: event.topic,
    payload: event.payload,
    published_at: event.published_at.isoformat()
  }))
  
  # Route to topic partition
  partition = hash(event.correlation_id or event.event_id) % PARTITION_COUNT
  append_to_partition(topic, partition, event)
  
  # Alert escalation for CRITICAL priority
  IF priority == "CRITICAL":
    alert_router.immediate_dispatch(event)
  
  RETURN event

consume(topic, consumer_group, max_events=100) → [EnterpriseEvent]:
  
  offset = get_consumer_offset(consumer_group, topic)
  events = read_from_offset(topic, offset, limit=max_events)
  
  RETURN events

commit_offset(consumer_group, topic, last_processed_sequence):
  update_consumer_offset(consumer_group, topic, last_processed_sequence)
```

---

## Cross-System Event Routing

```
# Event routing rules — maps event_type patterns to additional topic fan-outs

ROUTING_RULES = [
  
  # Constitutional violations → immediately to alerts.critical
  {
    source_topic: "governance.constitutional",
    filter: "event_type == 'ABSOLUTE_CONSTITUTIONAL_VIOLATION'",
    route_to: "alerts.critical",
    transform: enrich_with_severity("CRITICAL")
  },
  
  # Organizational stress → escalation
  {
    source_topic: "org.capacity.signals",
    filter: "payload.stress_level in ['HIGH', 'CRITICAL']",
    route_to: "alerts.high",
    transform: add_escalation_context()
  },
  
  # Gate failures → governance telemetry + workflow telemetry
  {
    source_topic: "runtime.workflow.gates",
    filter: "event_type == 'GATE_FAILED'",
    route_to: ["governance.decisions", "telemetry.metrics"],
    transform: null
  },
  
  # Security events → always audit
  {
    source_topic: "runtime.security.events",
    filter: null,   # All security events
    route_to: "governance.decisions",
    transform: wrap_as_governance_decision()
  }
]

apply_routing_rules(event) → [EnterpriseEvent]:
  
  additional_events = []
  
  FOR rule in ROUTING_RULES:
    IF event.topic == rule.source_topic:
      IF rule.filter is null OR evaluate_cel(rule.filter, event):
        FOR target_topic in listify(rule.route_to):
          routed = clone_event(event, topic=target_topic)
          IF rule.transform:
            routed = rule.transform(routed)
          additional_events.append(routed)
  
  RETURN additional_events
```

---

## Integration

**Called by:**
- All enterprise systems that generate organizational, governance, or runtime events
- `enterprise-telemetry/event-propagation-engine.md` — fan-out processing
- `enterprise-telemetry/runtime-trigger-engine.md` — trigger evaluation

**Calls:**
- `enterprise-telemetry/event-propagation-engine.md` — applies routing rules and fan-out
- `operational-command-center/enterprise-operations-console.md` — critical alert delivery
- External integrations via connector layer — for integration.notifications inbound

**Writes to:** `memory/enterprise-telemetry/event-bus-state.yaml`
