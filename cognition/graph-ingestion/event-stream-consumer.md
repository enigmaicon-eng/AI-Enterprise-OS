# Event Stream Consumer
# Real-time graph updates from the enterprise event bus — delta updates without full re-ingestion

## Subscription Configuration

```python
GRAPH_UPDATE_SUBSCRIPTIONS = [
    Subscription(
        subscription_id="graph-agent-lifecycle",
        topic_filters=["org.agent.lifecycle"],
        schema_format="NATIVE",
        batch_size=1,    # process immediately — agent changes are high priority
        poll_interval_ms=1000,
        handler=handle_agent_lifecycle_event,
    ),
    Subscription(
        subscription_id="graph-workflow-lifecycle",
        topic_filters=["runtime.workflow.lifecycle"],
        schema_format="NATIVE",
        batch_size=10,
        poll_interval_ms=5000,
        handler=handle_workflow_lifecycle_event,
    ),
    Subscription(
        subscription_id="graph-governance-events",
        topic_filters=["governance.decisions", "governance.policy.changes"],
        schema_format="NATIVE",
        batch_size=1,    # governance changes are high priority
        poll_interval_ms=2000,
        handler=handle_governance_event,
    ),
    Subscription(
        subscription_id="graph-artifact-events",
        topic_filters=["runtime.workflow.lifecycle"],
        topic_event_filter="event_type == 'ARTIFACT_PRODUCED'",
        schema_format="NATIVE",
        batch_size=20,
        poll_interval_ms=10000,
        handler=handle_artifact_event,
    ),
    Subscription(
        subscription_id="graph-trust-events",
        topic_filters=["runtime.trust.signals"],
        schema_format="NATIVE",
        batch_size=5,
        poll_interval_ms=5000,
        handler=handle_trust_signal_event,
    ),
]
```

## Deduplication Window

Events processed within a 60-second window are deduplicated by event_id to prevent
double-processing during back-pressure redelivery:

```python
DEDUP_WINDOW_SECONDS = 60
processed_event_ids = TTLCache(maxsize=10000, ttl=DEDUP_WINDOW_SECONDS)

def is_duplicate_event(event_id: str) -> bool:
    if event_id in processed_event_ids:
        return True
    processed_event_ids[event_id] = True
    return False
```

## Event Handlers

### Agent Lifecycle Events

```python
def handle_agent_lifecycle_event(event: EnterpriseEvent):
    if is_duplicate_event(event.event_id):
        return
    subtype = event.payload.get("event_subtype")
    agent_id = event.payload.get("agent_id")

    if subtype == "AGENT_REGISTERED":
        # Trigger full re-extraction of agent file
        source_file = event.payload.get("source_file") or resolve_agent_file(agent_id)
        if source_file:
            ingestion_pipeline.enqueue_job(source_file, extractor="agent-extractor",
                                           priority="HIGH")

    elif subtype == "AGENT_SUSPENDED":
        agent = entity_resolution.resolve_entity(agent_id, "AGENT")
        if agent:
            agent.properties["status"] = "SUSPENDED"
            agent.metadata.updated_at = now()
            graph_mutation_pipeline.write_vertex(agent)
            # Trigger R010 re-evaluation: suspended agent may create capability gaps
            inference_engine.trigger_rule("R010")

    elif subtype == "AGENT_REACTIVATED":
        agent = entity_resolution.resolve_entity(agent_id, "AGENT")
        if agent:
            agent.properties["status"] = "ACTIVE"
            agent.metadata.updated_at = now()
            graph_mutation_pipeline.write_vertex(agent)
            inference_engine.trigger_rule("R010")

    elif subtype == "TRUST_TIER_CHANGED":
        agent = entity_resolution.resolve_entity(agent_id, "AGENT")
        if agent:
            agent.properties["trust_tier"] = event.payload["new_trust_tier"]
            agent.metadata.updated_at = now()
            graph_mutation_pipeline.write_vertex(agent)
            inference_engine.trigger_rule("R008")   # R008: trust propagation
```

### Workflow Lifecycle Events

```python
def handle_workflow_lifecycle_event(event: EnterpriseEvent):
    if is_duplicate_event(event.event_id):
        return
    subtype = event.payload.get("event_subtype") or event.event_type

    if subtype == "RUN_STARTED":
        run = entity_resolution.deduplicate_entity(
            entity_type="RUN",
            canonical_label=f"RUN:{event.payload['run_id']}",
            properties={
                "workflow_id":        event.payload["workflow_definition_id"],
                "started_at":         event.timestamp,
                "status":             "IN_PROGRESS",
                "triggering_agent_id": event.payload.get("triggering_agent_id"),
            },
            source="event-stream",
            confidence=0.95,
        )
        workflow = entity_resolution.resolve_entity(event.payload["workflow_definition_id"], "WORKFLOW")
        if workflow:
            create_relationship(workflow.entity_id, run.entity_id, "PRODUCES",
                                confidence=0.90, source_type="EXPLICIT",
                                properties={"relationship_subtype": "run_instance"})

    elif subtype == "RUN_COMPLETE":
        run = entity_resolution.resolve_entity(f"RUN:{event.payload['run_id']}", "RUN")
        if run:
            run.properties["status"] = "COMPLETE"
            run.properties["completed_at"] = event.timestamp
            run.properties["slo_compliant"] = event.payload.get("slo_compliant")
            graph_mutation_pipeline.write_vertex(run)
```

### Governance Events

```python
def handle_governance_event(event: EnterpriseEvent):
    if is_duplicate_event(event.event_id):
        return
    if event.topic == "governance.decisions":
        # Trigger decision re-extraction
        decision_file = event.payload.get("source_file")
        if decision_file:
            ingestion_pipeline.enqueue_job(decision_file, extractor="decision-extractor",
                                           priority="HIGH")
    elif event.topic == "governance.policy.changes":
        policy_file = event.payload.get("source_file")
        if policy_file:
            ingestion_pipeline.enqueue_job(policy_file, extractor="decision-extractor",
                                           priority="HIGH")
        # Policy changes may invalidate cached queries
        query_cache.invalidate_by_entity_type("POLICY")
```

### Trust Signal Events

```python
def handle_trust_signal_event(event: EnterpriseEvent):
    if is_duplicate_event(event.event_id):
        return
    agent_id = event.payload.get("agent_id")
    signal_type = event.payload.get("signal_type")
    agent = entity_resolution.resolve_entity(agent_id, "AGENT")
    if not agent:
        return
    if signal_type == "TRUST_SCORE_DEGRADED":
        agent.properties["trust_health"] = "DEGRADED"
        agent.metadata.updated_at = now()
        graph_mutation_pipeline.write_vertex(agent)
    elif signal_type == "TRUST_SCORE_RESTORED":
        agent.properties["trust_health"] = "HEALTHY"
        agent.metadata.updated_at = now()
        graph_mutation_pipeline.write_vertex(agent)
```

## Integration Points

- `enterprise-telemetry/telemetry-subscriptions.md`: registers subscriptions on startup
- `artifact-extractor.md`: delegates ARTIFACT_PRODUCED events to artifact extractor
- `knowledge-inference/inference-engine.md`: triggers rule re-evaluation after status changes
- `graph-query-engine/query-cache.md`: invalidates cache on governance changes
