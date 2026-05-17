# Canonical Event Schema
**ID:** INTER-CES-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines the single canonical schema that ALL events published to the Enterprise AI OS event bus must conform to. Eliminates the event schema fragmentation where different subsystems publish events in incompatible formats — making cross-system event correlation, audit, and monitoring brittle. Every event, regardless of source, follows this envelope.

---

## Universal Event Envelope

```yaml
event:
  # Identity (required for all events)
  event_id: string                       # UUID v4; globally unique
  event_type: string                     # dot-notation: domain.entity.action
                                         # e.g., "workflow.step.completed"
  schema_version: "2.0"                  # canonical schema version
  
  # Provenance (required)
  source:
    system: string                       # which OS subsystem produced this event
    agent_id: string | null              # which agent (if applicable)
    workflow_id: string | null           # which workflow (if applicable)
    region_id: string                    # which region (multi-region support)
    
  # Timing (required)
  timing:
    occurred_at: ISO8601                 # when the underlying action happened
    published_at: ISO8601                # when event was published to bus
    processing_latency_ms: number | null # time from action to publish
    
  # Content (required)
  payload:
    entity_type: string                  # what kind of thing did this event happen to
    entity_id: string                    # identifier of the specific entity
    action: string                       # what happened (past tense verb)
    
    before_state: {any} | null           # state before the action (for state-change events)
    after_state: {any} | null            # state after the action
    
    data: {any}                          # event-specific payload fields
    
  # Classification (required)
  classification:
    domain: string                       # top-level domain from event bus taxonomy
    priority: P0 | P1 | P2 | P3 | P4   # event urgency
    constitutional_relevant: boolean     # does this event touch any C001–C012 principle?
    pii_present: boolean                 # does payload contain personal data?
    
  # Integrity (required for constitutional_relevant events)
  integrity:
    signature: string | null             # Ed25519 signature for constitutional events
    signing_agent: string | null
    
  # Correlation (optional; enables event chaining)
  correlation:
    correlation_id: string | null        # shared ID across related events
    causation_id: string | null          # event_id of the event that caused this one
    trace_id: string | null              # distributed trace ID
```

---

## Event Type Registry

All event types must be registered before publication:

```yaml
event_type_registration:
  event_type: string                     # e.g., "workflow.step.completed"
  domain: string
  schema_extensions: [{field: string, type: string, required: boolean}]
  
  description: string
  published_by: [string]                 # which systems publish this type
  consumed_by: [string]                  # which systems consume this type
  
  priority_default: P0 | P1 | P2 | P3 | P4
  constitutional_relevant_default: boolean
  pii_possible: boolean
  
  retention_days: number                 # how long event history is retained
  registered_at: ISO8601
  registered_by: string                  # T3 Architecture approval required
```

Current event type registry: `architecture/event-type-registry.yaml`.

---

## Standard Event Types (Sample)

```
workflow.step.started         — a workflow step began execution
workflow.step.completed       — a workflow step completed successfully
workflow.step.failed          — a workflow step failed
workflow.escalated            — workflow escalated to human review

agent.invocation.started      — agent invocation began
agent.invocation.completed    — agent invocation completed
agent.invocation.failed       — agent invocation failed
agent.trust.changed           — agent trust score changed (±)

governance.decision.requested — approval request created
governance.decision.made      — approval granted or denied
governance.escalation.triggered — escalation event

security.alert.raised         — security alert generated
security.token.replayed       — token replay attempt detected
security.constitutional.blocked — constitutional block triggered

knowledge.unit.created        — new knowledge unit created
knowledge.unit.updated        — knowledge unit modified
knowledge.unit.archived       — knowledge unit archived

autonomy.decision.made        — Level 3+ autonomous decision recorded
autonomy.escalation.triggered — autonomous agent escalated to human

digital.twin.updated          — digital twin state refreshed
market.signal.processed       — market signal ingested and classified
```

---

## Schema Validation

The event bus validates every event against this schema at publication:

```
validation_steps:
  1. Schema completeness: all required fields present
  2. Type validation: all fields match declared types
  3. event_type in registry: type must be pre-registered
  4. Constitutional events: signature required and must verify
  5. PII marking: if pii_present=true, pii_classification must be present
  6. Priority consistency: P0 events must have defined escalation targets
  
Validation failure:
  REJECT: event not published; publisher receives validation error
  QUARANTINE: for events where validation is uncertain (PII ambiguity)
  
Malformed events:
  Logged to memory/runtime/malformed-events.jsonl
  If > 10 malformed events from same source in 1 hour: T3 alert (source may have a bug)
```

---

## Migration from Legacy Event Schemas

For existing OS subsystems publishing non-canonical events:

```
Migration approach:
  Option A: Update publisher to emit canonical schema (preferred)
  Option B: Deploy schema adapter (normalizes legacy events at bus ingress)
  
Option B is a temporary bridge only — max 90-day lifespan per adapter
All adapters must be listed in architecture/event-type-registry.yaml
After 90 days: publisher must switch to canonical schema or be deprecated

Migration status tracked: architecture/event-migration-tracker.yaml
```

---

## Governance

**Schema changes:** T3 Architecture approval; MAJOR changes require T4
**New event type registration:** T3 Architecture approval (3-day SLA)
**Validation enforcement:** Always on; cannot be disabled for any event type
**Constitutional event signatures:** Required; signing key managed by Security Org
**Registry:** `architecture/event-type-registry.yaml`
**Schema version history:** Maintained; breaking changes require migration period
