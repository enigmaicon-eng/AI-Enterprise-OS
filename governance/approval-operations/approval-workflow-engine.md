# Approval Workflow Engine

## Purpose
Orchestrates end-to-end approval workflows — managing the lifecycle of every approval request from submission through decision and downstream action. While the approval queue holds items, this engine runs the process that transforms requests into decisions and decisions into organizational actions.

---

## Workflow Engine Architecture

```
Approval Request
    ↓
[1. Intake & Validation]
    ├── Schema validation
    ├── Duplicate detection
    ├── Context package assembly
    └── Priority scoring
    ↓
[2. Routing Decision]
    ├── Tier determination
    ├── Special routing (constitutional, regulatory, exception)
    └── Queue assignment
    ↓
[3. Assignment]
    ├── review-assignment-engine.md
    ├── Conflict of interest check
    └── Reviewer notification
    ↓
[4. Review Lifecycle]
    ├── Status tracking (PENDING → ASSIGNED → UNDER_REVIEW → ...)
    ├── SLA monitoring
    ├── AI assistance delivery
    └── Info request management
    ↓
[5. Decision Processing]
    ├── Decision recording
    ├── Ed25519 signature verification
    ├── Condition processing
    └── Audit logging
    ↓
[6. Post-Decision Actions]
    ├── Workflow continuation (or halt)
    ├── Hold release
    ├── Stakeholder notifications
    ├── Precedent registration (if applicable)
    └── Outcome tracking
```

---

## Approval Workflow State Machine

```yaml
states:
  SUBMITTED:
    description: Request received; processing in intake pipeline
    duration_target: < 2 seconds
  
  QUEUED:
    description: In tier queue, awaiting assignment
    sla_clock: running
  
  ASSIGNED:
    description: Reviewer assigned; notification sent
    transitions:
      → UNDER_REVIEW: reviewer opens interface
      → REASSIGNED: assignment engine reassigns (conflict, overload, recusal)
      → ESCALATED: SLA breach before reviewer opens
  
  UNDER_REVIEW:
    description: Reviewer actively reviewing
    sla_clock: running (unless paused for NEEDS_INFO)
  
  NEEDS_INFO:
    description: Reviewer requested additional information
    sla_clock: PAUSED
    max_duration: PT72H before auto-resume
  
  APPROVED:
    terminal: true (positive)
    triggers: downstream workflow continuation
  
  APPROVED_WITH_CONDITIONS:
    terminal: true (conditional positive)
    triggers: downstream continuation with conditions attached to context
  
  REJECTED:
    terminal: true (negative)
    triggers: workflow halt + rejection notification
  
  ESCALATED:
    description: Moved to higher-tier queue
    sla_clock: reset to new tier's SLA
  
  EXPIRED:
    terminal: true (negative — SLA breach)
    triggers: compliance finding + escalation case
  
  DELEGATED:
    description: Current reviewer delegated to specific other reviewer
    transitions: → ASSIGNED (for delegate)
  
  CANCELLED:
    terminal: true
    triggers: when the underlying workflow is cancelled
```

---

## Multi-Approver Workflow

For items requiring multiple approvers (quorum):

```yaml
multi_approver_workflow:
  quorum_types:
    ALL_REQUIRED:
      description: All specified approvers must APPROVE
      failure_condition: any REJECT
      use_when: consensus required (policy changes, constitutional matters)
    
    MAJORITY:
      description: > 50% must APPROVE
      use_when: committee decisions
    
    THRESHOLD:
      description: configurable % must APPROVE (e.g., 2 of 3, 3 of 5)
      use_when: most governance approvals
      default: 0.67 (2 of 3)
    
    FIRST_APPROVER:
      description: First approver to decide wins; others auto-cancelled
      use_when: routing-type decisions where any qualified approver suffices
  
  parallel_assignment:
    all_approvers_assigned_simultaneously: true
    each_sees_others_status: true (but not others' rationale until all decided)
    rationale_reveal_policy: after_all_decisions   # prevents anchoring
  
  partial_decision_handling:
    if_first_approver_rejects_in_MAJORITY:
      action: notify_others + continue (rejection is one vote)
    if_THRESHOLD_impossible:
      condition: remaining_needed > remaining_approvers
      action: early termination → REJECTED
  
  timeout_per_approver:
    individual_approver_sla: defined per request
    if_individual_sla_breached: escalate that approver's decision to their manager tier
```

---

## Conditional Approval Processing

When an approver selects APPROVE_WITH_CONDITIONS:

```yaml
condition_processing:
  capture:
    conditions: list of strings
    condition_types: [MUST_IMPLEMENT, MUST_NOTIFY, TIME_LIMITED, REQUIRES_REVIEW]
    conditions_signed_by: approver Ed25519 key
  
  injection:
    workflow_context_field: "governance.approval_conditions"
    downstream_access: all subsequent workflow nodes can read conditions
    enforcement:
      MUST_IMPLEMENT: creates follow-up task assigned to submitter
      MUST_NOTIFY: immediate notification sent to specified parties
      TIME_LIMITED: creates expiry scheduled action
      REQUIRES_REVIEW: creates scheduled review task at specified future date
  
  condition_tracking:
    all_conditions_tracked: true
    completion_status: PENDING | IN_PROGRESS | COMPLETED | WAIVED
    waiver_authority: Tier >= condition_setting_tier
    completion_audit: recorded when each condition fulfilled
```

---

## Needs-Info Management

```yaml
needs_info_workflow:
  initiation:
    reviewer_specifies:
      - specific_questions: [string] (required, cannot be vague)
      - information_sources: [suggested where to find info]
      - urgency: how soon they need it
      - will_decide_without_if: conditions under which reviewer will proceed without info
  
  submitter_experience:
    notified: immediately with specific questions
    response_interface: structured response form (not freeform) to ensure completeness
    ability_to_attach: supporting documents
    ability_to_escalate: if information unavailable (flag as INFORMATION_UNAVAILABLE)
  
  reviewer_notification_on_response:
    immediate: in-app notification
    sla_clock_resumed: automatically
    response_appears: inline in review interface with original question context
  
  loop_management:
    round_tracking: count per item
    on_round_3: auto-escalate + flag as NEEDS_INFO_LOOP_DETECTED
    max_rounds: 3 (then force-decision or escalation)
```

---

## Decision Recording

```yaml
decision_recording:
  required_fields:
    - outcome: APPROVED | REJECTED | APPROVED_WITH_CONDITIONS | DELEGATED | ESCALATED
    - rationale: string (length enforcement by tier)
    - decided_at: system-stamped (not user-provided)
    - decided_by: system-identified (not user-reported)
  
  signature:
    required_for: Tier >= 2
    algorithm: Ed25519
    signed_payload: sha256(decision_id + artifact_id + outcome + rationale + decided_at)
    verification: before decision is accepted
  
  immutability:
    after_recording: decision record is immutable
    correction_mechanism: addendum record (original preserved)
    correction_authority: Tier >= decided_by.tier + 1
  
  audit_events_emitted:
    - APPROVAL_GRANTED (for APPROVED/APPROVED_WITH_CONDITIONS)
    - APPROVAL_REJECTED (for REJECTED)
    - APPROVAL_DELEGATED (for DELEGATED)
    - APPROVAL_ESCALATED (for ESCALATED)
    - APPROVAL_EXPIRED (for EXPIRED)
```

---

## Post-Decision Orchestration

```yaml
post_decision_actions:
  APPROVED:
    sequence:
      1: record_decision_in_audit_trail
      2: release_holds(approval_request.holds_applied)
      3: advance_workflow_dag(workflow_instance_id, node_id)
      4: notify_submitter(outcome=APPROVED, conditions=[])
      5: notify_stakeholders(if any registered for this event)
      6: update_trust_scores(submitter, reviewer, outcome)
    max_latency: PT5S total
  
  REJECTED:
    sequence:
      1: record_decision_in_audit_trail
      2: halt_workflow_dag(workflow_instance_id, node_id, reason=REJECTED)
      3: notify_submitter(outcome=REJECTED, rationale, revision_window)
      4: maintain_holds(if hold should persist)
      5: check_revision_window(open revision path if reviewer granted it)
    max_latency: PT5S total
  
  APPROVED_WITH_CONDITIONS:
    sequence:
      1: record_decision_in_audit_trail
      2: inject_conditions_into_context
      3: create_condition_tracking_tasks
      4: release_holds
      5: advance_workflow_dag_with_conditions
      6: notify_submitter + stakeholders
    max_latency: PT10S total
```

---

## Integration Points

| System | Role |
|---|---|
| `human-review/approval-queue-system.md` | Source of approval requests |
| `human-review/review-assignment-engine.md` | Assigns reviewers |
| `human-review/review-interface-standards.md` | Defines reviewer experience |
| `operational-review/review-sla-monitor.md` | SLA tracking per item |
| `approval-operations/collaborative-decision-system.md` | AI-assisted decision support |
| `process-governance/workflow-auditability-system.md` | All decision events logged |
| `workflow-modeling/orchestration-dag-system.md` | Resumes or halts workflow |
