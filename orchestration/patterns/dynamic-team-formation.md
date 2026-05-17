# Dynamic Team Formation

## Purpose
Governs how multi-agent teams are assembled on-demand for tasks whose requirements don't map to predefined workflows. Dynamic team formation analyzes task requirements, identifies the capability profile needed, discovers candidate agents, assembles a team with the right composition, and governs team operation through completion. Teams form, work, and disband without persistent organizational structure.

---

## Team Formation Architecture

```
Task Requirement
        ↓
[1. Requirements Analysis]    → decompose task into capability requirements
[2. Role Definition]          → define team roles (lead + specialists)
[3. Team Lead Selection]      → find agent qualified to coordinate this team
[4. Member Discovery]         → find agents for each specialist role
[5. Composition Validation]   → verify team can cover all requirements
[6. Team Contracting]         → establish inter-agent agreements
[7. Team Briefing]            → all members receive unified task context
        ↓
[Team Operation]              → governed by team norms and this protocol
        ↓
[Team Disbanding]             → completion, audit, member release
```

---

## Requirements Analysis

```yaml
requirements_analysis:
  inputs: task_description, domain, complexity, time_budget, governance_level
  
  analysis_steps:
    capability_extraction:
      action: identify all capabilities needed to complete the task
      output: capability_requirements_list [{capability_id, minimum_proficiency, authorized_required, is_critical}]
      critical_flag: capability is CRITICAL if task cannot complete without it
    
    skill_extraction:
      action: identify specific skills required
      output: skill_requirements_list [skill_id]
    
    role_definition:
      action: group capabilities into coherent roles (avoid single-person bottlenecks)
      heuristic: roles should be independently executable domains of work
      output: role_definitions [{role_name, required_capabilities, required_skills, is_lead_candidate}]
    
    team_size_estimation:
      formula: roles_count + (task_complexity_multiplier × domain_breadth)
      complexity_multiplier: BASIC=1.0, STANDARD=1.2, COMPLEX=1.5, EXPERT=2.0
      min_team_size: 2; max_team_size: 12 (larger → use FEDERATED_HIERARCHY instead)
    
    timeline_allocation:
      action: estimate effort per role; assign time budgets
      constraint: all roles must complete within overall task time budget
```

---

## Team Lead Selection

```yaml
team_lead_selection:
  requirements:
    capability: multi_agent_orchestration at CAPABLE or above
    tier: >= 2
    availability: AVAILABLE with load_factor < 0.60 (team lead cannot be near capacity)
    calibration_state: not RED
  
  discovery_query:
    mode: PRECISE
    required_capabilities: [multi_agent_orchestration, task_decomposition]
    include_task_domain_capability: true (team lead should understand the domain)
    ranking_preference: PERFORMANCE (best lead, not just available)
  
  team_lead_responsibilities:
    - coordinate all team member work
    - manage inter-member dependencies
    - conduct mid-task status checks
    - integrate member outputs into unified deliverable
    - escalate issues beyond team authority
    - facilitate conflict resolution within team
    - produce final team audit report
  
  team_lead_authority:
    - can redirect any team member's work within original scope
    - can reassign tasks between members if a member becomes unavailable
    - CANNOT change team scope without requester approval
    - CANNOT recruit new agents beyond original team size without requester approval
    - CANNOT suppress member escalations
```

---

## Team Member Discovery and Selection

```yaml
member_discovery:
  process:
    for_each role in role_definitions:
      query: agent-discovery-engine.md (TEAM_FORMATION mode)
      requirements: role.required_capabilities + role.required_skills
      constraints:
        exclude: already_selected_team_members
        exclude: team_lead
        max_load_factor: 0.70 (members need headroom for this assignment)
      
      selection:
        primary: rank-1 candidate (highest fit_score)
        backup: rank-2 and rank-3 retained as alternates
        minimum_fit_score: 0.50 (if no candidates above 0.50, role is unfillable → escalate)
  
  composition_validation:
    check_1_coverage: all required capabilities covered by at least one team member?
    check_2_critical_coverage: all CRITICAL capabilities covered?
    check_3_no_critical_single_point:
      if any CRITICAL capability covered by only 1 member → assign backup agent
    check_4_tier_compliance:
      task governance level → minimum tier for at least one team member
    
    if_validation_fails:
      CRITICAL_CAPABILITY_UNFILLABLE: escalate to human; task cannot proceed
      COVERAGE_GAP (non-critical): proceed with gap noted; team lead manages risk
      TIER_COMPLIANCE_FAILURE: escalate for authorization
  
  team_roster_schema:
    team_id: "TEAM-{task_id}-{timestamp}"
    formed_at: ISO-8601
    task_id: string
    team_lead: agent_id
    members: [
      {
        agent_id: string
        role_name: string
        assigned_capabilities: [capability_id]
        assigned_skills: [skill_id]
        backup_agent_id: string | null
      }
    ]
    capability_coverage_map: {capability_id → agent_id}
    governance_level: STANDARD | ENHANCED
    time_budget: ISO-8601 deadline
```

---

## Team Contracting

```yaml
team_contracting:
  purpose: establish explicit expectations before work begins; prevent coordination failures
  
  team_charter:
    task_objective: string (what success looks like)
    individual_deliverables: [{role_name, deliverable_schema, deadline}]
    dependencies: [{role_from, role_to, dependency_description, expected_at}]
    escalation_path: [team_lead → requester → human_supervisor]
    communication_norms:
      dependency_update_lag_max: 5 minutes (if your output will be late, notify dependent)
      blocker_notification: immediately on discovery
      status_check_cadence: every 30 minutes or at milestone
    governance_constraints:
      scope_change: requires team_lead + requester approval
      new_agent_recruitment: requires requester approval
      inter-agent communication: on-task only; logged
  
  member_acknowledgment:
    each member confirms:
      - understanding of assigned deliverable and schema
      - capability and availability to complete within time budget
      - acceptance of communication norms and escalation path
      - commitment to flag blockers immediately (no silent failures)
    acknowledgment_timeout: 2 minutes (if no acknowledgment → member replaced with backup)
```

---

## Team Operation

```yaml
team_operation:
  work_execution:
    members execute assigned roles in parallel (where no dependency exists)
    dependent roles begin when dependency deliverables received and validated
    all inter-member artifact handoffs are schema-validated
  
  mid_task_management:
    team_lead responsibilities during execution:
      - dependency tracking (is each dependency on schedule?)
      - blocker resolution (triage and route or escalate)
      - load rebalancing (if a member is ahead, can they assist a behind member?)
      - critical path monitoring (which tasks are on the critical path to completion?)
  
  member_replacement_protocol:
    triggers: member OFFLINE, member OVERLOADED (load_factor > 0.90), member sustained blocker
    step_1: team_lead checks if task can be redistributed to existing members
    step_2: if not, activate backup agent (pre-selected in team formation)
    step_3: if no backup available, query discovery engine for new candidate
    step_4: new member briefed with full task context + current state
    replacement_SLA: < 10 minutes from trigger to new member active
  
  scope_change_handling:
    requester_requests_scope_change:
      action: team_lead assesses impact (new capabilities needed? timeline impact?)
      if_additive_minor: team_lead may absorb within existing team
      if_significant: requester must authorize; team_lead may pause non-affected work pending authorization
    agent_discovers_scope_gap:
      action: member notifies team_lead immediately
      team_lead escalates to requester for resolution
```

---

## Team Disbanding

```yaml
disbanding_protocol:
  triggers:
    SUCCESSFUL_COMPLETION: all deliverables produced and integrated
    TIME_EXCEEDED: task exceeded deadline (requester decision to disband)
    SCOPE_INFEASIBLE: task discovered to be impossible with available agents
    REQUESTER_CANCELLATION: requester cancels task
  
  disbanding_steps:
    step_1_output_delivery:
      action: team_lead delivers integrated output to requester
      includes: main deliverable, confidence_score, limitations, member contribution summary
    
    step_2_incomplete_work_handoff:
      if CANCELLED or TIME_EXCEEDED:
        document: what was completed, what was not, what would be needed to complete
        handoff_package: passed to requester for potential future team
    
    step_3_member_release:
      action: all member task slots freed in registry (current_task_count decremented)
      action: member availability_status updated
      timing: within 60 seconds of disbanding trigger
    
    step_4_team_audit:
      team_lead produces TEAM_AUDIT_RECORD:
        - team_id, task_id, duration, outcome
        - each member: assigned deliverable, delivered? quality? blockers?
        - what worked well (for pattern library)
        - what should be different next time (for pattern library)
      audit_retention: 1 year (standard); 3 years (if task was governance-related)
    
    step_5_knowledge_capture:
      action: trigger workflow-knowledge-extraction.md on team task record
      any novel coordination patterns → contribution to orchestration-pattern-catalog.md
```

---

## Team Performance Metrics

```yaml
team_metrics:
  formation_time: time from request to team briefed (target: < 5 minutes for STANDARD tasks)
  coverage_rate: fraction of tasks where all required capabilities were covered (target: > 0.95)
  completion_rate: fraction of teams completing within time budget (target: > 0.85)
  member_replacement_rate: how often mid-task replacement was needed (alert if > 0.15)
  requester_satisfaction_score: explicit feedback from requester on outcome quality
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-discovery-engine.md` | TEAM_FORMATION discovery mode |
| `orchestration-patterns/orchestration-pattern-catalog.md` | PAT-ORCH-008 specification |
| `delegation-and-trust/inter-agent-contracts.md` | Team charter is a multi-party contract |
| `delegation-and-trust/delegation-model.md` | Team lead authority delegation |
| `coordination-operations/work-distribution-engine.md` | Work assignment within teams |
| `coordination-operations/orchestration-failure-recovery.md` | Member replacement and team recovery |
