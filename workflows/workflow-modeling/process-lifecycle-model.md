# Process Lifecycle Model

## Purpose
Defines the complete lifecycle of a workflow process — from authoring through retirement. Every BPMN process and its runtime instances follow these lifecycle states. Lifecycle transitions are governed events that emit to the enterprise event bus.

---

## Process Definition Lifecycle

```
DRAFT ——[validate+compile]——→ VALIDATED
VALIDATED ——[governance-approve]——→ ACTIVE
ACTIVE ——[owner-suspend]——→ SUSPENDED
SUSPENDED ——[owner-resume]——→ ACTIVE
ACTIVE ——[owner-deprecate]——→ DEPRECATED (90-day window)
DEPRECATED ——[90 days elapsed]——→ ARCHIVED
VALIDATED ——[validation-fail]——→ DRAFT
ACTIVE ——[emergency-halt]——→ SUSPENDED (governance-initiated)
```

### State Definitions

| State | Instantiable | Editable | Description |
|---|---|---|---|
| `DRAFT` | No | Yes | Under authoring; fails validation or not yet validated |
| `VALIDATED` | No | No | Passed validation; awaiting governance approval to activate |
| `ACTIVE` | Yes | No — version-controlled | Live; new instances can be created |
| `SUSPENDED` | No | No | Temporarily halted; in-flight instances continue to completion |
| `DEPRECATED` | No | No | Scheduled for retirement; existing instances must complete |
| `ARCHIVED` | No | No | Fully retired; read-only historical record |

### Transition Events (published to `PROCESS_LIFECYCLE` topic)

```yaml
events:
  PROCESS_VALIDATED:
    payload: {process_id, version, validated_by, validation_report_id}
  PROCESS_ACTIVATED:
    payload: {process_id, version, activated_by, governance_approval_id}
  PROCESS_SUSPENDED:
    payload: {process_id, version, suspended_by, reason, resume_condition}
  PROCESS_DEPRECATED:
    payload: {process_id, version, deprecated_by, replacement_id, sunset_date}
  PROCESS_ARCHIVED:
    payload: {process_id, version, archived_at, instance_count_completed}
  PROCESS_EMERGENCY_HALTED:
    payload: {process_id, version, halted_by, reason, governance_incident_id}
```

---

## Instance Lifecycle

```
PENDING ——[executor picks up]——→ RUNNING
RUNNING ——[all paths complete]——→ COMPLETED
RUNNING ——[human task reached]——→ PAUSED
PAUSED ——[approval received]——→ RUNNING
PAUSED ——[sla breach]——→ ESCALATING
ESCALATING ——[escalation resolved]——→ RUNNING
ESCALATING ——[escalation failed]——→ FAILED
RUNNING ——[unrecoverable error]——→ FAILED
FAILED ——[compensation triggered]——→ COMPENSATING
COMPENSATING ——[compensation complete]——→ COMPENSATED
RUNNING ——[operator intervention: pause]——→ SUSPENDED
SUSPENDED ——[operator intervention: resume]——→ RUNNING
RUNNING ——[operator intervention: terminate]——→ TERMINATED
```

### Instance State Attributes

```yaml
instance_state:
  instance_id: string
  process_id: string
  process_version: string
  status: PENDING | RUNNING | PAUSED | ESCALATING | COMPLETED | FAILED | COMPENSATING | COMPENSATED | SUSPENDED | TERMINATED
  priority: CRITICAL | HIGH | NORMAL | LOW
  created_at: ISO-8601
  started_at: ISO-8601 | null
  paused_at: ISO-8601 | null
  completed_at: ISO-8601 | null
  sla_deadline: ISO-8601 | null
  sla_status: ON_TRACK | AT_RISK | BREACHED
  owner_org: string
  initiator_id: agent-id
  correlation_id: string   # links related instances
  parent_instance_id: string | null   # for sub-processes
  governance_tier: 0–5
  checkpoint_count: integer
  last_checkpoint_at: ISO-8601 | null
```

---

## Version Management

### Version Numbering
Format: `MAJOR.MINOR.PATCH`
- `MAJOR` — breaking change to input/output schema or fundamental flow change
- `MINOR` — new optional capabilities, new subprocess paths, new error handling
- `PATCH` — documentation, naming, non-behavioral changes

### Version Coexistence Policy
```yaml
coexistence:
  max_concurrent_versions: 3
  policy: |
    When new MAJOR version activated:
      - Previous version transitions to DEPRECATED
      - New instances created on new version only
      - In-flight instances on old version complete on old version
      - 90-day window for drain
    
    When new MINOR version activated:
      - New instances use new version
      - In-flight instances may continue on old minor version OR migrate (configurable per process)
    
    PATCH versions: in-place update; no instance migration needed
```

---

## Activation Governance

Transitioning a process from `VALIDATED` → `ACTIVE` requires governance approval:

```yaml
activation_requirements:
  tier_1_process:   # tier_required <= 1
    approvers_needed: 1
    approver_roles: [process-owner, delivery-lead]
    review_sla_ms: 86400000   # 24h
  
  tier_2_3_process:   # tier_required 2–3
    approvers_needed: 2
    approver_roles: [process-owner, architecture-lead, governance-lead]
    constitutional_review: required
    review_sla_ms: 172800000  # 48h
  
  tier_4_5_process:   # tier_required >= 4
    approvers_needed: 3
    approver_roles: [executive-sponsor, governance-lead, architecture-lead]
    constitutional_review: required
    board_notification: required
    review_sla_ms: 604800000  # 7 days
```

---

## Emergency Halt Protocol

Invoked when a running process causes harm or violates constitutional principles:

```
1. Governance agent or Tier-4+ human initiates EMERGENCY_HALT
2. Process transitions to SUSPENDED immediately
3. All PENDING instances cancelled
4. RUNNING instances paused at next safe checkpoint
5. PAUSED instances remain paused (no new approvals processed)
6. Incident case PROC-INCIDENT-001 automatically created
7. Governance notification sent to all Tier-4+ principals
8. Resumption requires: incident resolution + governance re-approval
```

---

## Instance Retention Policy

```yaml
retention:
  COMPLETED: 365 days   # 1 year full detail
  FAILED: 730 days      # 2 years for forensics
  COMPENSATED: 730 days
  TERMINATED: 365 days
  
  after_retention_period:
    summary_record: permanent   # {instance_id, process_id, status, dates, outcome}
    detail_record: deleted
    audit_log: permanent (moved to cold storage)
  
  exceptions:
    GOVERNANCE processes: 7 years (regulatory)
    INCIDENT processes: 7 years (regulatory)
    constitutional_check: true processes: permanent
```
