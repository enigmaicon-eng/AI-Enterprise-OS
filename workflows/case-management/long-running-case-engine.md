# Long-Running Case Engine

## Purpose
Manages cases that span days, weeks, or months — far beyond the lifetime of any individual agent session or execution context. This engine provides durable state management, context restoration, participant continuity, and scheduled check-ins for cases with indefinite lifespans.

---

## Long-Running Case Definition

A case is classified as "long-running" when:
- Expected duration > 24 hours, OR
- Requires human participants who work asynchronously, OR
- Spans multiple organizational units with independent schedules, OR
- Outcome depends on external events with unpredictable timing

---

## Durability Architecture

```
Case State Storage
├── case-state-store/         # primary state (database-backed)
│   ├── {case_id}.state.json  # current full state snapshot
│   └── {case_id}.meta.json   # immutable case metadata
├── case-event-log/           # append-only event journal
│   └── {case_id}.events.jsonl
└── case-checkpoints/         # periodic durability snapshots
    └── {case_id}-{timestamp}.checkpoint.json
```

---

## State Persistence Schema

```yaml
durable_case_state:
  # Immutable (written at creation, never changed)
  meta:
    case_id: string
    case_type: string
    created_at: ISO-8601
    created_by: agent-id
    initial_context: {}
    governance_tier: 0–5
  
  # Mutable (checkpointed on every meaningful change)
  state:
    version: integer              # monotonically increasing; used for optimistic locking
    updated_at: ISO-8601
    status: OPEN | IN_PROGRESS | WAITING | ESCALATED | RESOLVED | CLOSED
    
    # Context grows over time
    context:
      accumulated: {}             # all context added during case life
      last_modified_at: ISO-8601
      last_modified_by: agent-id
    
    # Participants with their current engagement status
    participants:
      - agent_id: string
        role: string
        engagement_status: ACTIVE | INACTIVE | PENDING | REMOVED
        last_active: ISO-8601
        pending_tasks: [task-id]
    
    # Work queue
    open_tasks: [task-snapshot]
    completed_tasks: [task-result-snapshot]
    
    # Scheduled events
    scheduled_actions:
      - action_id: string
        action_type: CHECK_IN | REMINDER | ESCALATION | EXPIRY
        scheduled_at: ISO-8601
        payload: {}
    
    # Decision history (never deleted)
    decisions: [decision-record]
    
    # Artifact registry
    artifacts: [artifact-ref]
  
  # State version history (last 50 versions retained)
  history:
    - version: integer
      snapshot_at: ISO-8601
      changed_by: agent-id
      change_summary: string
      state_hash: sha256
```

---

## Checkpoint Protocol

```
checkpoint_case(case_id):
  state = load_current_state(case_id)
  checkpoint = {
    case_id: case_id,
    version: state.version,
    checkpointed_at: now(),
    state_snapshot: deep_copy(state),
    event_log_offset: current_event_count(case_id),
    hash: sha256(canonical_json(state))
  }
  write_checkpoint(case_id, checkpoint)
  
  # Checkpoint triggers
trigger_conditions:
  - on_participant_action      # any human or AI action
  - on_task_state_change
  - on_milestone_reached
  - periodic: every 1 hour (for inactive cases)
  - on_escalation_event
  - before_scheduled_action_execution
```

---

## Context Restoration

When a long-dormant case is reopened by an agent with no prior context:

```
restore_context(case_id, agent_id):
  state = load_current_state(case_id)
  events = load_recent_events(case_id, limit=100)
  
  briefing = {
    case_summary: synthesize_summary(state),
    current_status: state.status,
    open_questions: extract_open_questions(state.context),
    pending_tasks: state.open_tasks filtered by agent_id,
    recent_activity: events.last(20),
    key_decisions: state.decisions,
    next_scheduled_action: state.scheduled_actions.next(),
    artifacts: state.artifacts.with_descriptions()
  }
  
  # AI-generated briefing for human participants
  if agent_id in human_participants:
    briefing.ai_summary = generate_briefing_prose(briefing)
  
  return briefing
```

---

## Scheduled Action System

Long-running cases use scheduled actions to maintain momentum:

```yaml
scheduled_action_types:
  CHECK_IN:
    description: Prompt participants who have pending tasks
    trigger: participant.last_active > 3 days AND pending_tasks > 0
    action: send_reminder_with_context_briefing
    max_per_participant: 3 before escalation
  
  MILESTONE_REVIEW:
    description: Assess progress against expected milestones
    trigger: expected_milestone_date approaching (80% of time budget consumed)
    action: generate_progress_report + notify case owner
  
  SCOPE_REVIEW:
    description: Review whether case scope has drifted
    trigger: every 7 days for cases > 14 days old
    action: compute_scope_drift_score + notify if drift > 0.20
  
  ESCALATION:
    description: Escalate stalled case
    trigger: no activity for 5 days + reminder sent 3x
    action: create_escalation_case + notify next tier owner
  
  EXPIRY:
    description: Close abandoned case
    trigger: case open > 90 days + status WAITING + no activity > 14 days
    action: auto_close_with_reason + archive_state
```

---

## Participant Continuity

Handles participants entering and leaving long-running cases:

```yaml
participant_lifecycle:
  on_participant_join:
    - restore_context(case_id, participant_id)
    - assign_pending_tasks_matching_role(participant_id)
    - notify_other_participants
    - log_PARTICIPANT_ADDED event
  
  on_participant_leave:
    - reassign_open_tasks(participant_id) to role-matched replacement
    - archive_participant_contributions
    - notify_other_participants
    - log_PARTICIPANT_REMOVED event
  
  on_participant_inactive_7_days:
    - send_CHECK_IN reminder
    - flag tasks as AT_RISK
  
  on_participant_inactive_14_days:
    - escalate tasks to participant's manager role
    - create_ESCALATION scheduled action
```

---

## Long-Running Case Governance

```yaml
governance:
  duration_thresholds:
    > 7 days:
      action: weekly governance summary to case owner
    > 30 days:
      action: Tier-3 governance review required to continue
    > 90 days:
      action: Executive-level review required; case may not continue without Tier-4 approval
  
  budget_monitoring:
    tracked_costs: [agent compute time, human participant hours, artifact storage]
    threshold_alerts: [25%, 50%, 75%, 90% of approved budget]
    on_budget_exceeded: pause case + require governance re-approval
  
  constitutional_compliance:
    check_frequency: weekly
    evaluator: PROC-GOV-005
    on_violation: immediate_escalation + case suspension
```
