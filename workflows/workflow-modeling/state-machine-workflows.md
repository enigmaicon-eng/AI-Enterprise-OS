# State-Machine Workflows

## Purpose
Defines the state-machine layer that underlies all workflow execution. While BPMN describes the process flow, state machines govern the behavior of individual entities within those processes — agents, artifacts, approvals, cases, and organizational resources. State machines enforce legal state transitions and prevent invalid state mutations.

---

## State Machine Model

```yaml
state_machine:
  machine_id: "sm-unique-id"
  name: "human-readable name"
  entity_type: "workflow | case | artifact | agent | approval | incident"
  initial_state: "state-name"
  states:
    state_name:
      label: "display name"
      terminal: true/false
      on_enter: [action-refs]
      on_exit: [action-refs]
      invariants: [CEL expressions that must hold while in state]
  transitions:
    - from: "state-name"
      to: "state-name"
      trigger: "event-name | timer:ISO8601 | condition:CEL"
      guard: "CEL expression | null"
      actions: [action-refs]
      governance:
        tier_required: 0–5
        constitutional_check: true/false
      audit: true/false
```

---

## Core Enterprise State Machines

### SM-001 — Artifact State Machine

```yaml
machine_id: SM-001
name: Enterprise Artifact Lifecycle
entity_type: artifact
initial_state: DRAFT

states:
  DRAFT:
    label: Draft
    terminal: false
    invariants: ["artifact.author_id != null"]
  REVIEW:
    label: Under Review
    terminal: false
    invariants: ["artifact.reviewers.length > 0"]
  APPROVED:
    label: Approved
    terminal: false
    invariants: ["artifact.approval_id != null", "artifact.approved_by != null"]
  REJECTED:
    label: Rejected
    terminal: false
    on_enter: ["notify_author"]
  PUBLISHED:
    label: Published
    terminal: false
    invariants: ["artifact.published_at != null"]
  DEPRECATED:
    label: Deprecated
    terminal: false
    invariants: ["artifact.replaced_by != null OR artifact.deprecation_reason != null"]
  ARCHIVED:
    label: Archived
    terminal: true

transitions:
  - from: DRAFT → REVIEW
    trigger: submit
    guard: "artifact.completeness_score >= 0.80"
    actions: [notify_reviewers, create_review_task]
    audit: true

  - from: REVIEW → APPROVED
    trigger: approval_granted
    guard: "approval.quorum_met == true AND approval.tier >= artifact.required_tier"
    governance: {tier_required: artifact.required_tier}
    audit: true

  - from: REVIEW → REJECTED
    trigger: approval_rejected
    actions: [notify_author, log_rejection_reason]
    audit: true

  - from: REJECTED → DRAFT
    trigger: revise
    guard: "rejection.revision_window_open == true"
    actions: [reset_review_state]
    audit: false

  - from: APPROVED → PUBLISHED
    trigger: publish
    governance: {tier_required: 2}
    actions: [emit_ARTIFACT_PUBLISHED]
    audit: true

  - from: PUBLISHED → DEPRECATED
    trigger: deprecate
    governance: {tier_required: 3}
    actions: [emit_ARTIFACT_DEPRECATED, notify_consumers]
    audit: true

  - from: DEPRECATED → ARCHIVED
    trigger: archive
    guard: "deprecated.consumer_count == 0 AND deprecated.age_days >= 90"
    audit: true
```

---

### SM-002 — Agent Task State Machine

```yaml
machine_id: SM-002
name: Agent Task Execution
entity_type: agent_task
initial_state: QUEUED

states:
  QUEUED:
    label: Queued
    terminal: false
  ASSIGNED:
    label: Assigned to Agent
    terminal: false
    invariants: ["task.assigned_agent_id != null"]
  RUNNING:
    label: Executing
    terminal: false
    invariants: ["task.started_at != null"]
  AWAITING_DEPENDENCY:
    label: Waiting on Dependency
    terminal: false
  PAUSED:
    label: Paused by Operator
    terminal: false
  COMPLETED:
    label: Completed Successfully
    terminal: true
  FAILED:
    label: Failed
    terminal: true
  CANCELLED:
    label: Cancelled
    terminal: true
  TIMEOUT:
    label: Timed Out
    terminal: true

transitions:
  - from: QUEUED → ASSIGNED
    trigger: agent_accepts
    guard: "agent.capability_match == true AND agent.trust_tier >= task.tier_required"
    actions: [record_assignment, start_timeout_timer]

  - from: ASSIGNED → RUNNING
    trigger: agent_starts
    actions: [emit_span_start, record_started_at]

  - from: RUNNING → AWAITING_DEPENDENCY
    trigger: dependency_unresolved
    actions: [subscribe_to_dependency_event]

  - from: AWAITING_DEPENDENCY → RUNNING
    trigger: dependency_resolved
    actions: [resume_execution]

  - from: RUNNING → COMPLETED
    trigger: agent_reports_success
    actions: [record_output, emit_span_end, advance_dag]

  - from: RUNNING → FAILED
    trigger: agent_reports_failure
    guard: "task.attempts >= task.max_attempts"
    actions: [record_error, emit_span_end, trigger_error_handler]

  - from: RUNNING → TIMEOUT
    trigger: timer:task.timeout_ms
    actions: [interrupt_agent, record_timeout, trigger_error_handler]

  - from: [QUEUED, ASSIGNED, RUNNING, PAUSED] → CANCELLED
    trigger: operator_cancel
    governance: {tier_required: 2}
    actions: [interrupt_agent, record_cancellation, emit_audit_event]
    audit: true
```

---

### SM-003 — Approval Request State Machine

```yaml
machine_id: SM-003
name: Approval Request Lifecycle
entity_type: approval_request
initial_state: PENDING

states:
  PENDING:
    label: Awaiting Approver Action
    terminal: false
    invariants: ["approval.approver_id != null", "approval.deadline != null"]
  UNDER_REVIEW:
    label: Being Reviewed
    terminal: false
  APPROVED:
    label: Approved
    terminal: true
  REJECTED:
    label: Rejected
    terminal: true
  NEEDS_INFO:
    label: Awaiting Clarification
    terminal: false
  EXPIRED:
    label: SLA Expired
    terminal: true
  ESCALATED:
    label: Escalated to Higher Tier
    terminal: false

transitions:
  - from: PENDING → UNDER_REVIEW
    trigger: approver_opens
    actions: [record_review_started_at]

  - from: [PENDING, UNDER_REVIEW] → APPROVED
    trigger: approver_approves
    actions: [record_decision, notify_requester, advance_workflow]
    audit: true

  - from: [PENDING, UNDER_REVIEW] → REJECTED
    trigger: approver_rejects
    actions: [record_decision, record_rationale, notify_requester]
    audit: true

  - from: [PENDING, UNDER_REVIEW] → NEEDS_INFO
    trigger: approver_requests_info
    actions: [notify_requester, pause_sla_clock]

  - from: NEEDS_INFO → UNDER_REVIEW
    trigger: requester_provides_info
    actions: [resume_sla_clock, notify_approver]

  - from: [PENDING, UNDER_REVIEW] → ESCALATED
    trigger: sla_at_80_percent
    actions: [create_escalation, notify_tier_plus_one]

  - from: ESCALATED → APPROVED
    trigger: escalated_approver_approves
    governance: {tier_required: parent.tier + 1}
    audit: true

  - from: [PENDING, UNDER_REVIEW, ESCALATED] → EXPIRED
    trigger: timer:approval.deadline
    actions: [notify_all_parties, trigger_governance_incident]
    audit: true
```

---

## Guard Expression Language

Guards use CEL (Common Expression Language):

```
# Simple comparison
approval.tier >= task.tier_required

# Compound
agent.capability_match == true && agent.trust_score >= 0.70

# Collection check
artifact.reviewers.exists(r, r.tier >= 3)

# Temporal
timestamp.now() < task.deadline

# Context access
$.context.governance.constitutional_verdict == 'PASS'
```

---

## Action Registry

Actions referenced in state machines are defined here:

| Action | Description | Side Effects |
|---|---|---|
| `notify_author` | Notify artifact author of state change | Enterprise event bus |
| `notify_reviewers` | Notify review queue | Enterprise event bus |
| `emit_span_start` | Start orchestration trace span | Telemetry |
| `emit_span_end` | End orchestration trace span | Telemetry |
| `advance_dag` | Signal DAG engine to continue | orchestration-dag-system.md |
| `trigger_error_handler` | Invoke DAG error propagation | orchestration-dag-system.md |
| `create_escalation` | Create escalation case | case-management/escalation-case-system.md |
| `record_decision` | Persist approval decision | process-governance/execution-lineage-tracker.md |
| `emit_audit_event` | Append to audit log | process-governance/workflow-auditability-system.md |
| `interrupt_agent` | Send interrupt signal to running agent | runtime-clusters/ |
| `subscribe_to_dependency_event` | Register event bus subscription | enterprise-telemetry/ |

---

## State Machine Registry

All state machines MUST be registered:

```yaml
registry:
  SM-001: Artifact Lifecycle
  SM-002: Agent Task Execution
  SM-003: Approval Request Lifecycle
  SM-004: Case Lifecycle          # case-management/adaptive-case-management.md
  SM-005: Incident Lifecycle      # case-management/incident-case-management.md
  SM-006: Process Instance        # process-lifecycle-model.md
  SM-007: Governance Decision     # decision-models/governance-aware-branching.md
```
