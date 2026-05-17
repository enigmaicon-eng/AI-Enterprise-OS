# Workflow Auditability System

## Purpose
Makes every workflow execution fully auditable — who did what, when, why, with what authority, and with what outcome. Every node entry, exit, branching decision, data mutation, and governance action produces an audit event. The audit trail is tamper-proof, queryable, and retained per regulatory requirements.

---

## Audit Event Architecture

```
Workflow Runtime (orchestration-dag-system.md)
    ↓ emits audit events on every meaningful action
[Audit Event Bus] ← topic: AUDIT_EVENTS (enterprise-telemetry/)
    ↓
[Audit Event Processor]
    ├── [Schema Validator] — validates event structure
    ├── [Hash Chainer] — computes record_hash and links chain
    ├── [Signature Service] — signs with audit system Ed25519 key
    └── [Audit Store] → append-only storage
```

---

## Audit Event Schema

```yaml
audit_event:
  # Core identity
  event_id: "AUD-EVT-uuid"
  workflow_instance_id: string
  dag_id: string
  process_id: string
  
  # What happened
  event_type: [see event type catalog below]
  node_id: string | null
  node_type: string | null
  
  # Who did it
  actor:
    agent_id: string
    agent_type: HUMAN | AI | SYSTEM | AUTOMATED
    tier: 0–5
    org: string
    delegated_by: string | null   # if acting on behalf of another
  
  # When
  occurred_at: ISO-8601
  recorded_at: ISO-8601   # may differ due to async recording
  sequence_number: integer   # monotonically increasing per instance
  
  # What was acted on
  subject:
    type: WORKFLOW_INSTANCE | NODE | ARTIFACT | DECISION | APPROVAL | CASE
    id: string
    state_before: string | null
    state_after: string | null
  
  # Context
  context:
    governance_tier: 0–5
    correlation_id: string
    parent_instance_id: string | null
    trace_id: string   # links to orchestration-tracer.md span
  
  # Payload (level depends on audit_level setting)
  payload:
    summary: string    # always present
    inputs_hash: "sha256:..."   # always present
    outputs_hash: "sha256:..."  # always present
    inputs: {} | null           # present for ENHANCED level
    outputs: {} | null          # present for ENHANCED level
    rationale: string | null    # present when human made decision
  
  # Integrity
  previous_event_hash: "sha256:..."
  event_hash: "sha256 of entire record"
  signature: "Ed25519 signature"
```

---

## Audit Event Type Catalog

### Workflow Lifecycle Events
```yaml
WORKFLOW_INSTANCE_CREATED:
  description: New workflow instance created
  required_fields: [initiator, process_id, dag_id, inputs_schema]
  audit_level: STANDARD

WORKFLOW_STARTED:
  description: Instance transitioned from PENDING to RUNNING
  audit_level: STANDARD

WORKFLOW_COMPLETED:
  description: Instance reached terminal COMPLETED state
  required_fields: [outputs_summary, duration_ms, sla_met]
  audit_level: STANDARD

WORKFLOW_FAILED:
  description: Instance reached terminal FAILED state
  required_fields: [error_code, failed_node_id, recovery_attempted]
  audit_level: ENHANCED

WORKFLOW_COMPENSATED:
  description: Saga compensation completed
  required_fields: [compensated_nodes, compensation_duration_ms]
  audit_level: ENHANCED

WORKFLOW_SUSPENDED:
  description: Operator suspended running instance
  required_fields: [suspended_by, reason, governance_approval_id]
  audit_level: ENHANCED

WORKFLOW_TERMINATED:
  description: Instance force-terminated
  required_fields: [terminated_by, reason, governance_approval_id, state_snapshot_id]
  audit_level: ENHANCED
```

### Node Execution Events
```yaml
NODE_STARTED:
  description: Node began execution
  audit_level: STANDARD (SERVICE) | ENHANCED (HUMAN | GOVERNANCE)

NODE_COMPLETED:
  description: Node completed successfully
  audit_level: STANDARD

NODE_FAILED:
  description: Node execution failed
  required_fields: [error_code, attempt_number, retry_scheduled]
  audit_level: ENHANCED

NODE_RETRIED:
  description: Node execution retried after failure
  required_fields: [attempt_number, previous_error, backoff_ms]
  audit_level: STANDARD

NODE_SKIPPED:
  description: Node skipped due to branching
  required_fields: [skip_reason, branch_condition_result]
  audit_level: STANDARD

NODE_TIMED_OUT:
  description: Node exceeded timeout
  required_fields: [timeout_ms, actual_duration_ms]
  audit_level: ENHANCED
```

### Governance Events
```yaml
APPROVAL_REQUESTED:
  description: Human approval submitted to queue
  required_fields: [approver_role, tier_required, sla_deadline, artifact_summary]
  audit_level: ENHANCED

APPROVAL_GRANTED:
  description: Approval decision: APPROVED
  required_fields: [approver_id, rationale, tier, signature]
  audit_level: ENHANCED

APPROVAL_REJECTED:
  description: Approval decision: REJECTED
  required_fields: [approver_id, rationale, tier, signature]
  audit_level: ENHANCED

APPROVAL_ESCALATED:
  description: Approval SLA breached → escalated to higher tier
  required_fields: [original_approver, escalated_to_role, sla_breach_ms]
  audit_level: ENHANCED

CONSTITUTIONAL_CHECK_INITIATED:
  description: Constitutional evaluation started
  audit_level: ENHANCED

CONSTITUTIONAL_CHECK_PASSED:
  description: Constitutional evaluation returned PASS
  required_fields: [evaluator_id, confidence, evaluation_id]
  audit_level: ENHANCED

CONSTITUTIONAL_VIOLATION_DETECTED:
  description: Constitutional evaluation returned FAIL
  required_fields: [violated_principles, severity, incident_id_created]
  audit_level: ENHANCED
  retention: permanent
  immediate_notify: true

GOVERNANCE_OVERRIDE_APPLIED:
  description: Tier-4+ override applied to governance gate
  required_fields: [override_id, applied_by, approved_by, rationale, scope]
  audit_level: ENHANCED
  retention: permanent
```

### Data Events
```yaml
CONTEXT_MUTATED:
  description: Workflow context variables modified
  required_fields: [mutated_fields, mutated_by]
  payload_policy: diff_only   # log only changed fields
  audit_level: STANDARD

ARTIFACT_CREATED:
  description: Workflow created a new artifact
  required_fields: [artifact_id, artifact_type, artifact_hash]
  audit_level: STANDARD

ARTIFACT_MODIFIED:
  description: Workflow modified an existing artifact
  required_fields: [artifact_id, modification_summary, previous_hash, new_hash]
  audit_level: ENHANCED
```

---

## Audit Level Policies

```yaml
audit_levels:
  NONE:
    captures: nothing   # only for internal plumbing nodes
    allowed_for: [system-internal-only nodes]
  
  STANDARD:
    captures: [event_type, actor, timing, state transitions, hashes]
    excludes: [full inputs/outputs payloads]
    storage: warm (90d) → cold (per retention schedule)
  
  ENHANCED:
    captures: everything including full inputs/outputs
    storage: hot (90d) → warm (2y) → cold (per retention schedule)
    search_indexed: true   # full-text search available
```

---

## Audit Trail Verification

```
verify_instance_audit_trail(workflow_instance_id):
  events = load_all_events(workflow_instance_id) sorted by sequence_number
  
  for i in range(1, len(events)):
    # Verify hash chain
    expected_prev = sha256(events[i-1])
    if expected_prev != events[i].previous_event_hash:
      raise ChainIntegrityViolation(at=events[i].event_id)
    
    # Verify signature
    if not verify_signature(events[i], audit_system_public_key):
      raise SignatureInvalid(at=events[i].event_id)
    
    # Verify sequence continuity
    if events[i].sequence_number != events[i-1].sequence_number + 1:
      raise SequenceGap(at=events[i].event_id)
  
  return AUDIT_TRAIL_INTACT
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-dag-system.md` | Primary event emitter |
| `decision-models/decision-audit-trail.md` | Decision-specific audit category |
| `process-governance/execution-lineage-tracker.md` | Lineage derived from audit events |
| `process-governance/orchestration-replay-engine.md` | Replay uses audit events as inputs |
| `enterprise-telemetry/governance-telemetry.md` | Governance metrics derived from audit events |
| `operational-command-center/runtime-intervention-interfaces.md` | Interventions always emit ENHANCED audit events |
