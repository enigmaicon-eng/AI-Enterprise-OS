---
layer: ontology
type: event-vocabulary
version: 1.0.0
created: 2026-05-10
owner: event-systems-architect-agent
status: active
---

# Event Vocabulary

Authoritative definitions for all event, signal, and trigger terms used across the Enterprise AI OS. Events are the primary mechanism for decoupled, real-time coordination between agents and external systems.

---

## Event Classification

### Event Namespace
Events are namespaced using the pattern: `{source-domain}.{entity-type}.{action}`. This ensures uniqueness and enables subscription filtering.

| Source Domain | Entity Types | Actions |
|---|---|---|
| `workflow` | `step`, `instance`, `gate` | `started`, `completed`, `failed`, `paused`, `resumed` |
| `agent` | `instance`, `dispatch` | `activated`, `completed`, `timed_out`, `escalated` |
| `artifact` | `prd`, `adr`, `runbook`, `incident`, etc. | `created`, `updated`, `approved`, `deprecated` |
| `integration` | `jira`, `github`, `pagerduty`, etc. | `issue.created`, `pr.merged`, `incident.triggered`, etc. |
| `memory` | `entry`, `namespace`, `index` | `created`, `updated`, `deprecated`, `consolidated` |
| `governance` | `gate`, `approval`, `exception` | `passed`, `failed`, `bypassed`, `escalated` |
| `incident` | `p1`, `p2`, `p3`, `p4` | `triggered`, `acknowledged`, `mitigated`, `resolved` |
| `knowledge` | `wiki`, `ontology`, `graph` | `updated`, `contradiction_detected`, `synthesis_completed` |
| `system` | `session`, `checkpoint`, `runtime` | `started`, `ended`, `restored`, `failed` |

---

## Core Event Properties

Every event in the OS has these mandatory properties:

```yaml
event:
  id: "{UUID}"                          # Unique event identifier
  type: "{namespace}.{entity}.{action}" # Event type (see namespace table)
  timestamp: "{ISO-8601}"               # UTC timestamp of event occurrence
  source:                               # What produced this event
    agent_id: "{agent-id}"
    workflow_instance: "{instance-id}"   # null if not workflow-related
    session_id: "{session-id}"
  subject:                              # What the event is about
    entity_type: "{type}"
    entity_id: "{id}"
    entity_path: "{file-path}"          # For artifact events
  payload: {}                           # Event-specific data (see per-type schemas)
  correlation_id: "{UUID}"              # Links related events (same workflow instance)
  causation_id: "{event-id}"            # The event that caused this event (null if root)
  severity: "INFO|WARN|ERROR|CRITICAL"
  routing_key: "{key}"                  # For subscription matching
```

---

## Workflow Events

### workflow.instance.started
Fired when a new workflow instance begins execution.
- Payload: `{ workflow_id, initiative_id, triggered_by: "human|cron|event", trigger_event_id }`
- Subscribers: `runtime-observability-agent`, `delivery-manager-agent`

### workflow.instance.completed
Fired when all steps in a workflow instance complete successfully.
- Payload: `{ workflow_id, instance_id, duration_minutes, artifacts_produced: [] }`
- Subscribers: `organizational-learning-agent`, `metrics-governance-agent`

### workflow.instance.failed
Fired when a workflow instance fails at a step and cannot auto-recover.
- Payload: `{ failed_step: N, failure_reason, retry_count, requires_human: true|false }`
- Subscribers: `delivery-manager-agent`, `incident-manager-agent` (if failure is P1/P2)

### workflow.step.completed
Fired when a single step completes. This event triggers checkpoint persistence.
- Payload: `{ step_n, agent_id, output_artifact_path, duration_seconds, quality_score }`
- Subscribers: `state-machine-systems-agent` (triggers checkpoint write)

### workflow.gate.failed
Fired when a quality gate fails.
- Payload: `{ gate_id, workflow_instance, failure_reason, bypass_available: true|false }`
- Subscribers: `supervisor-agent`, `human-approval-governance-agent`

---

## Agent Events

### agent.dispatch.activated
Fired when an agent instance begins executing its assigned task.
- Payload: `{ agent_id, task_description, context_package_size_tokens, dispatch_tier }`

### agent.dispatch.completed
Fired when an agent instance completes its task.
- Payload: `{ agent_id, output_artifact_path, confidence_score, self_validation_iterations }`

### agent.dispatch.escalated
Fired when an agent cannot complete a task autonomously and escalates to supervisor or human.
- Payload: `{ reason, blocking_question_id, suggested_resolution }`

---

## Knowledge Events

### knowledge.wiki.updated
Fired when any wiki page is updated.
- Payload: `{ page_path, change_summary, updated_by, previous_version_hash }`
- Subscribers: `knowledge-systems-agent` (triggers cross-link check), `contradiction-detection-agent`

### knowledge.contradiction.detected
Fired when two knowledge artifacts make mutually exclusive claims.
- Payload: `{ artifact_a, artifact_b, conflicting_claim, detection_method, severity }`
- Subscribers: `knowledge-systems-architect-agent` (triggers resolution workflow)

### knowledge.synthesis.completed
Fired when a synthesis workflow produces a new synthesized artifact.
- Payload: `{ source_documents: [], output_artifact, unique_knowledge_preserved: true|false }`

### knowledge.graph.edge.created
Fired when a new relationship is established in the knowledge graph.
- Payload: `{ source_node, target_node, edge_type, established_by }`

---

## Integration Events

### integration.external.received
Fired when data is received from an external system.
- Payload: `{ system_id, data_type, record_count, ingestion_timestamp }`

### integration.gap.detected
Fired by `tool-gap-detection-agent` when a capability gap is identified.
- Payload: `{ gap_id, missing_capability, blocked_agents: [], severity, workaround_available }`

### integration.health.degraded
Fired when an integration connector health check fails.
- Payload: `{ connector_id, system, failure_type, degraded_mode_activated }`

---

## Incident Events

### incident.triggered
Fired when an incident is declared. Source: `!incident` command or automated alert.
- Payload: `{ severity: "P1|P2|P3|P4", description, triggered_by, systems_affected: [] }`
- Subscribers: `incident-manager-agent`, `delivery-manager-agent`, ALL on-call agents for P1

### incident.resolved
Fired when incident mitigation is confirmed.
- Payload: `{ duration_minutes, mttr_target_met: true|false, post_mortem_required }`

---

## Governance Events

### governance.gate.exception.granted
Fired when a human operator authorizes bypassing a quality gate.
- Payload: `{ gate_id, granted_by, reason, accepted_risk, follow_up_required }`
- This event is audited. Every gate exception produces this event and is stored permanently.

### governance.approval.requested
Fired when an agent reaches a human-required decision point.
- Payload: `{ decision_id, requesting_agent, context_summary, options: [], default_recommendation }`

### governance.approval.granted
Fired when a human provides authorization for a human-required decision.
- Payload: `{ decision_id, decision_made, granted_by, timestamp }`

---

## System Events

### system.session.started
Fired at the beginning of each operating session.
- Payload: `{ session_id, operator_id, active_workflow_instances: [], memory_loaded: [] }`

### system.session.ended
Fired at the end of each operating session.
- Payload: `{ session_id, checkpoints_written: N, artifacts_produced: N, open_questions: N }`

### system.checkpoint.written
Fired when a workflow checkpoint is persisted to disk.
- Payload: `{ instance_id, step_n, checkpoint_path, bytes_written }`

### system.context.compressed
Fired when the context-routing-engine applies compression to a context package.
- Payload: `{ original_tokens, compressed_tokens, compression_ratio, method }`

---

## Memory Events

### memory.entry.created
Fired when a new warm-tier memory entry is written.
- Payload: `{ file_path, domain, importance, type, created_by }`
- Subscribers: `knowledge-systems-agent` (triggers index update)

### memory.consolidation.completed
Fired when the scheduled memory consolidation cron workflow completes.
- Payload: `{ entries_merged: N, entries_archived: N, entries_validated: N, index_updated: true }`

### memory.staleness.detected
Fired when a memory entry exceeds its validation interval.
- Payload: `{ entry_path, last_validated, days_overdue, owner }`
- Subscribers: `knowledge-systems-agent` (creates validation task)
