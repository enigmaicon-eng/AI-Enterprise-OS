# Adaptive Case Management

## Purpose
Governs cases where the work path cannot be fully predefined at design time. Unlike structured workflows, adaptive cases are goal-oriented — the process is discovered and assembled dynamically as new information emerges. This system manages that dynamic composition while maintaining governance and auditability.

---

## Adaptive vs. Structured Comparison

| Dimension | Structured Workflow | Adaptive Case |
|---|---|---|
| Path | Predefined in BPMN | Discovered at runtime |
| Duration | Bounded | Open-ended |
| Outcomes | Enumerable | Emergent |
| Governance | Checkpoint-based | Continuous monitoring |
| Knowledge | Process knowledge | Domain knowledge |
| Best for | Repeatable processes | Novel, complex situations |

---

## Case Architecture

```yaml
adaptive_case:
  case_id: "case-uuid"
  case_type: ADAPTIVE
  title: "descriptive title"
  goal: "what done looks like — CEL expression or human statement"
  priority: CRITICAL | HIGH | NORMAL | LOW
  
  # Context accumulates as case progresses
  context:
    initial: {}         # provided at case creation
    accumulated: {}     # added by participants and tasks
    knowledge_refs: []  # external knowledge sources consulted
  
  # Dynamic task plan — rebuilt after each milestone
  task_plan:
    current_tasks: [task-definitions]
    planned_tasks: [task-definitions]   # anticipated but not yet activated
    completed_tasks: [task-records]
    cancelled_tasks: [task-records]
  
  # Participants (can be added/removed during case)
  participants:
    humans: [{agent-id, role, added_at, added_by}]
    ai_agents: [{agent-id, capability, added_at, added_by}]
  
  # Milestones replace fixed checkpoints
  milestones:
    - id: "milestone-id"
      name: "milestone name"
      completion_condition: "CEL expression"
      achieved_at: "ISO-8601 | null"
      triggered_tasks: ["task-id"]   # tasks to activate when milestone reached
  
  # Case history
  event_log: []    # append-only list of all case events
  
  status: OPEN | IN_PROGRESS | WAITING | ESCALATED | RESOLVED | CLOSED
  opened_at: "ISO-8601"
  resolved_at: "ISO-8601 | null"
  resolution: "human description of outcome"
  governance_tier: 0–5
```

---

## Dynamic Task Composition

### Task Planning Engine

After each milestone or significant event, the planning engine re-evaluates what tasks should be added:

```
plan_next_tasks(case):
  context = case.context.accumulated
  completed = case.task_plan.completed_tasks
  
  # Evaluate planning rules in priority order
  for rule in planning_rules sorted by priority:
    if rule.condition(context, completed):
      new_tasks = rule.generate_tasks(context)
      if new_tasks not already in planned_tasks:
        add_to_planned(new_tasks)
  
  # Remove tasks made obsolete by completed tasks
  for planned_task in planned_tasks:
    if any completed_task.supersedes(planned_task):
      cancel_planned(planned_task)
  
  return updated_task_plan
```

### Planning Rule Schema
```yaml
planning_rule:
  rule_id: "PLAN-RULE-NNN"
  name: "descriptive name"
  priority: integer (lower = higher priority)
  condition: "CEL expression against {context, completed_tasks}"
  generates:
    - task_type: service | human | decision
      title: "task title template"
      description: "task description template"
      executor_capability: "capability-string | null"
      approver_role: "role | null"
      estimated_duration: "ISO-8601 duration"
      depends_on_context_fields: [field-names]
```

---

## Milestone System

Milestones are declarative conditions, not sequential checkpoints:

```yaml
example_milestones:
  - id: "m-initial-assessment"
    name: Initial Assessment Complete
    completion_condition: |
      case.context.accumulated.problem_scope != null
      && case.context.accumulated.stakeholders.length > 0
      && case.context.accumulated.initial_hypothesis != null
    triggered_tasks:
      - id: "research-task"
        type: service
        executor_capability: research_synthesis

  - id: "m-solution-validated"
    name: Solution Validated
    completion_condition: |
      case.context.accumulated.solution_proposal != null
      && case.context.accumulated.validation_score >= 0.75
    triggered_tasks:
      - id: "implementation-plan-task"
        type: human
        approver_role: "architecture-lead"
```

---

## Case Event Log

Append-only; every mutation creates an entry:

```yaml
case_event:
  event_id: "evt-uuid"
  case_id: "case-uuid"
  event_type: |
    CASE_OPENED | TASK_ADDED | TASK_STARTED | TASK_COMPLETED | TASK_CANCELLED
    | MILESTONE_REACHED | PARTICIPANT_ADDED | PARTICIPANT_REMOVED
    | CONTEXT_UPDATED | CASE_ESCALATED | CASE_RESOLVED | CASE_CLOSED
    | PLAN_RECOMPUTED | GOVERNANCE_CHECK | NOTE_ADDED
  timestamp: "ISO-8601"
  actor_id: "agent-id"
  payload: {}            # event-specific data
  context_snapshot_hash: "sha256"   # hash of context at time of event
```

---

## Governance Monitoring

Adaptive cases have continuous governance (vs. checkpoint-based for structured workflows):

```yaml
governance_monitors:
  constitutional_monitor:
    frequency: on_every_context_update
    evaluator: PROC-GOV-005
    on_violation: immediate_escalation
  
  scope_drift_monitor:
    frequency: on_each_task_plan_recompute
    check: new tasks remain within original goal scope
    on_drift_detected: notify_case_owner + require_explicit_scope_expansion_approval
  
  participant_access_monitor:
    frequency: on_participant_add
    check: participant trust tier >= case.governance_tier
    on_violation: reject_participant_addition
  
  stale_case_monitor:
    frequency: daily
    check: case has had activity in last 7 days
    on_stale: escalate to case owner
```

---

## Integration Points

| System | Role |
|---|---|
| `workflow-modeling/orchestration-dag-system.md` | Executes concrete sub-tasks within the case |
| `decision-models/runtime-decision-engine.md` | Powers planning rule condition evaluation |
| `case-management/human-ai-collaborative-cases.md` | Human-AI collaboration patterns applied to case tasks |
| `case-management/escalation-case-system.md` | Escalation when case exceeds governance tolerance |
| `process-governance/execution-lineage-tracker.md` | Full event log lineage |
| `enterprise-telemetry/organizational-health-telemetry.md` | Case load contributes to org stress signals |
