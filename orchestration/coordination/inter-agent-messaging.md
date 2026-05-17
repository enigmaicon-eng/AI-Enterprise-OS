# Inter-Agent Messaging

## Purpose
Defines the communication protocol for all direct message exchanges between agents. Every inter-agent message is structured, typed, logged, and routed through a governed message bus — not sent as unstructured text. Structured messaging enables auditability, replay, schema validation, and prevents side-channel communication that bypasses governance controls.

---

## Messaging Architecture

```
Sender Agent
     ↓ compose message (typed, structured)
[Message Bus]
├── [Schema Validation]      → message conforms to its type schema?
├── [Authorization Check]    → sender authorized to send this message type to this recipient?
├── [Routing]                → determine delivery path (direct | queued | broadcast)
├── [Delivery]               → deliver to recipient endpoint
├── [Acknowledgment]         → collect receipt confirmation
└── [Audit Log]              → record all messages regardless of type
     ↓
Recipient Agent
```

---

## Message Types

```yaml
message_types:
  # Work messages
  TASK_ASSIGNMENT:
    direction: orchestrator → worker
    purpose: assign a work unit to an agent
    requires_ack: true
    ack_sla: 30 seconds
    schema: {unit_id, specification, timeline, deliverable_schema, contract_id, escalation_path}
  
  TASK_COMPLETION:
    direction: worker → orchestrator
    purpose: signal completion of assigned work unit
    requires_ack: true
    ack_sla: 30 seconds
    schema: {unit_id, artifact_id, quality_score, confidence_score, notes}
  
  TASK_STATUS_UPDATE:
    direction: worker → orchestrator
    purpose: periodic heartbeat or status change notification
    requires_ack: false
    schema: {unit_id, status, progress_estimate, eta_update, blockers}
  
  CLARIFICATION_REQUEST:
    direction: worker → orchestrator | consumer
    purpose: request clarification on task scope or requirements
    requires_ack: true
    ack_sla: 15 minutes (within business context)
    schema: {unit_id, question, context, urgency: ROUTINE | HIGH | CRITICAL}
  
  CLARIFICATION_RESPONSE:
    direction: orchestrator → worker
    purpose: answer a clarification request
    requires_ack: false
    schema: {clarification_request_id, response, updated_spec_if_any}
  
  # Coordination messages
  ARTIFACT_HANDOFF:
    direction: producer → consumer (direct or via orchestrator)
    purpose: deliver an artifact from one agent to another
    requires_ack: true
    ack_sla: 60 seconds
    schema: {artifact_id, artifact_type, schema_ref, confidence_score, sender_notes}
  
  DEPENDENCY_READY:
    direction: completing agent → dependent agents
    purpose: notify downstream agents that their dependency is available
    requires_ack: false
    schema: {unit_id, artifact_id, available_at}
  
  ESCALATION:
    direction: any → supervisor | human
    purpose: escalate a task, decision, or situation beyond current authority
    requires_ack: true
    ack_sla: 5 minutes (HIGH); 1 minute (CRITICAL)
    schema: {escalation_type, context, task_id, severity, attempted_resolution, requested_action}
    audit_level: ENHANCED (always)
  
  # Governance messages
  DELEGATION_NOTICE:
    direction: grantor → delegatee
    purpose: notify agent of a new delegation grant
    requires_ack: true
    ack_sla: 2 minutes
    schema: {delegation_id, scope, authority_specification, expiry}
  
  REVOCATION_NOTICE:
    direction: grantor → delegatee
    purpose: immediately revoke a delegation
    requires_ack: true
    ack_sla: 10 seconds (must be near-instant)
    schema: {delegation_id, effective_immediately: boolean, handoff_required: boolean}
  
  TRUST_WARNING:
    direction: any → governance system
    purpose: flag a concern about another agent's reliability or behavior
    requires_ack: true
    ack_sla: 1 hour
    schema: {warned_agent_id, domain, concern_type, evidence, reporter_id}
    note: anonymous warnings not accepted; all warnings attributed
  
  # System messages
  HEALTH_HEARTBEAT:
    direction: agent → health monitor
    purpose: signal that agent is alive and report current state
    requires_ack: false
    frequency: every 30 seconds
    schema: {status, current_task_count, load_factor, health_indicators}
  
  KNOWLEDGE_CONTRIBUTION:
    direction: agent → knowledge system
    purpose: submit a knowledge unit from agent's semantic memory
    requires_ack: true
    ack_sla: 5 minutes
    schema: {ku_draft, source_agent_id, confidence, applicable_contexts}
  
  FEEDBACK:
    direction: consumer → producer | performance system
    purpose: provide explicit feedback on a delivered artifact
    requires_ack: false
    schema: {artifact_id, feedback_type, rating, narrative, credibility_basis}
```

---

## Message Schema (Envelope)

```yaml
message_envelope:
  message_id: "MSG-{sender_id}-{seq}-{timestamp}"
  message_type: string (from message_types)
  version: string (message type schema version)
  
  routing:
    sender_id: agent_id
    recipient_id: agent_id | "broadcast:{scope}" | "system:{subsystem}"
    reply_to: message_id | null          # if this is a reply, references original
    correlation_id: string | null        # groups related messages (e.g., all for a task)
  
  delivery:
    sent_at: ISO-8601
    priority: CRITICAL | HIGH | NORMAL | LOW
    ttl: duration                        # time-to-live; after which, treat as delivery failure
    delivery_mode: SYNC | ASYNC          # SYNC waits for ack before sender continues
  
  governance:
    requires_ack: boolean
    ack_sla: duration | null
    audit_level: STANDARD | ENHANCED
    encryption_required: boolean         # true for governance messages
  
  payload: {type-specific content}
  
  integrity:
    sender_signature: Ed25519 signature over (message_id + payload_hash + sent_at)
    payload_hash: SHA-256 hash of serialized payload
```

---

## Message Bus Operations

```yaml
message_bus:
  routing_modes:
    DIRECT: sender knows recipient_id; one-to-one delivery
    FANOUT: broadcast to a defined group (e.g., all team members)
    TOPIC: messages routed to subscribers of a topic (e.g., ESCALATION topic → all supervisors)
    SYSTEM: messages routed to internal subsystems (health monitor, performance tracker)
  
  delivery_guarantees:
    TASK_ASSIGNMENT: exactly-once (critical; duplicate assignments prevented)
    ESCALATION: at-least-once + idempotent recipient (duplicate escalations merged)
    HEALTH_HEARTBEAT: best-effort (missed heartbeats detected by health monitor)
    all_governance_messages: exactly-once (DELEGATION_NOTICE, REVOCATION_NOTICE)
  
  queue_management:
    per_agent_inbox: bounded queue (max 100 pending messages)
    overflow_handling: CRITICAL messages bypass queue; NORMAL messages queued; LOW messages dropped if queue full (logged)
    dead_letter_queue: messages undeliverable after 3 attempts → dead_letter; operator alert
  
  ack_management:
    SYNC messages: sender blocks until ack received or ack_sla exceeded
    ASYNC messages: sender continues; ack tracked asynchronously
    ack_sla_breach: after SLA without ack → delivery_failure event; trigger retry or escalation
    max_retries: 3 (with exponential backoff: 5s, 15s, 45s)
```

---

## Message Authorization

```yaml
message_authorization:
  rules:
    TASK_ASSIGNMENT: only agents with COORDINATION_AUTHORITY for this task
    ESCALATION: any agent (escalation is always permitted; no authorization barrier)
    TRUST_WARNING: any registered agent (but attributed; false warnings have consequences)
    DELEGATION_NOTICE: only the grantor of the delegation
    REVOCATION_NOTICE: grantor or governance lead
    FEEDBACK: any agent who received an artifact from the producer
    KNOWLEDGE_CONTRIBUTION: any registered agent
    HEALTH_HEARTBEAT: self only (agent sends its own heartbeat)
  
  cross_tier_messaging:
    worker → supervisor: ALWAYS permitted for CLARIFICATION_REQUEST and ESCALATION
    worker → other workers: permitted only within same team and for DEPENDENCY_READY
    worker → governance: TRUST_WARNING and ESCALATION only
    unauthorized_message_attempt: logged; sender notified; message not delivered
```

---

## Messaging Audit

```yaml
messaging_audit:
  what_is_logged:
    all_messages: message_id, type, sender, recipient, sent_at, payload_hash, delivery_status
    governance_messages: full payload (ENHANCED audit level)
    delivery_failures: full details including retry attempts
    authorization_failures: full details (potential governance concern)
  
  what_is_not_logged:
    HEALTH_HEARTBEAT payload: only delivery status logged (high volume; low governance value)
    
  retention:
    STANDARD messages: 1 year
    ENHANCED governance messages: 3 years
    authorization_failure_logs: 7 years
  
  anti_side_channel_enforcement:
    all inter-agent communication must pass through this message bus
    direct API calls between agents (bypassing bus) = governance violation
    detection: network-level enforcement in governed environments; audit anomaly detection
    agents cannot communicate outside their defined communication topology for the current task
```

---

## Message Patterns for Orchestration

```yaml
common_message_patterns:
  task_assignment_flow:
    1. orchestrator → TASK_ASSIGNMENT → worker
    2. worker → ACK → orchestrator
    3. worker → TASK_STATUS_UPDATE (every 60s) → orchestrator
    4. worker → TASK_COMPLETION → orchestrator
    5. orchestrator → ACK (completion accepted) → worker
  
  escalation_flow:
    1. agent → ESCALATION → supervisor
    2. supervisor → ACK (received, investigating) → agent
    3. supervisor → CLARIFICATION_RESPONSE or REVOCATION_NOTICE → agent (resolution)
    OR
    3. supervisor → ESCALATION (re-escalate) → Tier+1 supervisor or human
  
  artifact_handoff_flow:
    1. producer → ARTIFACT_HANDOFF → consumer
    2. consumer validates artifact
    3a. consumer → ACK (accepted) → producer; producer marks unit COMPLETED
    3b. consumer → FEEDBACK (rejected) → producer; producer revises
  
  consensus_protocol_messaging:
    1. coordinator → TASK_ASSIGNMENT (round 1) → all participants (fanout)
    2. participants → TASK_COMPLETION (individual positions) → coordinator
    3. coordinator → ARTIFACT_HANDOFF (all positions) → all participants (fanout)
    4. repeat for round 2, 3, 4 as needed
    5. coordinator → TASK_COMPLETION (consensus result) → requesting orchestrator
```

---

## Integration Points

| System | Role |
|---|---|
| `coordination-operations/work-distribution-engine.md` | TASK_ASSIGNMENT and TASK_COMPLETION messages |
| `coordination-operations/conflict-resolution-engine.md` | ESCALATION messages routed here |
| `coordination-operations/orchestration-failure-recovery.md` | Delivery failures trigger recovery |
| `agent-registry/agent-health-monitor.md` | HEALTH_HEARTBEAT messages consumed here |
| `delegation-and-trust/delegation-model.md` | DELEGATION_NOTICE and REVOCATION_NOTICE |
| `delegation-and-trust/trust-propagation-engine.md` | TRUST_WARNING messages consumed here |
| `agent-performance/agent-performance-tracker.md` | FEEDBACK messages feed performance tracking |
| `knowledge-base/knowledge-capture/` | KNOWLEDGE_CONTRIBUTION messages routed to capture pipeline |
