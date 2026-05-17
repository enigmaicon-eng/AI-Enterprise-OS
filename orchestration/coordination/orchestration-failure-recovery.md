# Orchestration Failure Recovery

## Purpose
Defines how the orchestration system detects, classifies, and recovers from failures — agent dropouts, task timeouts, cascade failures, plan invalidation, and orchestrator loss. Recovery is not an afterthought; it is a first-class concern designed into every orchestration pattern. The goal is maximum task continuity with minimum human intervention, within the bounds of governance.

---

## Failure Classification

```yaml
failure_classes:
  F1_AGENT_DROPOUT:
    definition: An assigned agent goes OFFLINE mid-task (heartbeat failure, crash)
    detection: health monitor → 3 consecutive missed heartbeats → OFFLINE status
    impact: work units assigned to that agent are orphaned
    severity: proportional to agent's role (worker vs. coordinator vs. team lead)
    recovery_approach: work unit reassignment + state reconstruction
  
  F2_TASK_TIMEOUT:
    definition: A work unit exceeds its deadline without completion signal
    detection: work-distribution-engine STALL detection; deadline monitor
    impact: dependent work units blocked; task timeline at risk
    severity: LOW if non-critical-path; HIGH if critical-path; CRITICAL if final stage
    recovery_approach: probe → reassign or escalate
  
  F3_QUALITY_GATE_FAILURE:
    definition: A completed work unit fails quality validation (schema or quality floor)
    detection: work-distribution-engine completion handling
    impact: consuming stage cannot proceed; revision required or task fails
    severity: proportional to stage position (later stages are more costly)
    recovery_approach: revision window → reassign → escalate
  
  F4_COORDINATOR_LOSS:
    definition: A domain coordinator or apex coordinator becomes unavailable mid-task
    detection: health monitor + agent registry
    impact: entire sub-tree of work under that coordinator is unmanaged
    severity: HIGH (domain coordinator); CRITICAL (apex coordinator)
    recovery_approach: coordinator replacement + state transfer
  
  F5_DEPENDENCY_DEADLOCK:
    definition: Two or more work units are waiting on each other (circular dependency)
    detection: dependency graph cycle detection at runtime
    impact: entire cycle is blocked; no progress possible
    severity: HIGH (affects all tasks in the cycle)
    recovery_approach: deadlock breaking (abort least-critical task in cycle)
  
  F6_RESOURCE_EXHAUSTION:
    definition: Required agents for a task type are all unavailable (capacity failure)
    detection: agent discovery returning zero candidates
    impact: task cannot proceed in current orchestration pattern
    severity: proportional to task urgency and exclusivity of required capability
    recovery_approach: queue task + alert; renegotiate scope; or escalate
  
  F7_CASCADE_FAILURE:
    definition: Multiple agents fail in rapid succession (infrastructure issue or design flaw)
    detection: > 10% of fleet OFFLINE within 5 minutes; OR > 3 failures in same domain within 10 minutes
    impact: enterprise-wide or domain-wide task disruption
    severity: CRITICAL
    recovery_approach: circuit breaker + emergency triage + human escalation
  
  F8_ORCHESTRATION_PLAN_INVALIDATION:
    definition: The orchestration plan becomes infeasible (scope changed, key agent deregistered, etc.)
    detection: plan validation re-run triggered by registry or scope change events
    impact: current plan cannot complete; re-planning required
    severity: proportional to plan completion percentage at time of invalidation
    recovery_approach: partial salvage + re-plan or abort
  
  F9_AUTHORITY_CHAIN_BREAK:
    definition: A delegation or authority transfer in the active chain is revoked or expired mid-task
    detection: delegation governance event + work distribution engine cross-reference
    impact: agents in affected chain lose authorization to continue
    severity: HIGH (governance implications if work continues without authority)
    recovery_approach: halt + re-establish authority + resume OR escalate
```

---

## Recovery Protocols

```yaml
recovery_protocols:
  F1_AGENT_DROPOUT_recovery:
    step_1_detect: health monitor marks agent OFFLINE; work distribution engine notified
    step_2_identify_orphans: query assignment ledger for all DISPATCHED/ACKNOWLEDGED/IN_PROGRESS units for this agent
    step_3_assess_state:
      for each orphan:
        was_output_produced?: check artifact store (agent may have completed just before dropout)
        if_output_exists: mark COMPLETED; proceed
        if_no_output: proceed to reassignment
    step_4_reassign:
      priority: use pre-designated backup_agent_id if available
      fallback: re-query agent-discovery-engine for qualified, available agent
      brief_new_agent: provide full work unit context + any partial state known
    step_5_notify: orchestrator notified of dropout + reassignment; timeline impact assessment
    step_6_timeline_adjustment: if dropout affects critical path → escalate to human sponsor
    target_recovery_time: < 10 minutes from dropout detection to new agent briefed
  
  F2_TASK_TIMEOUT_recovery:
    step_1_probe: direct liveness probe to agent
    step_2_agent_alive_and_working: extend deadline by 20% of original; flag as AT_RISK; notify orchestrator
    step_2_agent_alive_not_working: request blocker explanation; if blocker unresolvable → reassign
    step_2_agent_offline: F1_AGENT_DROPOUT protocol triggered
    step_3_second_timeout: if extended deadline also missed → mandatory reassignment + performance note
    target_recovery_time: < 5 minutes from timeout detection to decision
  
  F3_QUALITY_GATE_FAILURE_recovery:
    step_1_specific_feedback: identify which quality criteria failed; send to agent as CLARIFICATION_RESPONSE
    step_2_revision_window: agent given 20% of original time budget to revise
    step_3_re_validate: same quality checks applied
    step_4a_if_pass: COMPLETED; log initial failure as quality note for performance tracker
    step_4b_if_fail_again: reassign to different agent (quality issue may be agent-specific)
    step_4c_if_schema_mismatch_after_two_attempts: escalate (may indicate schema error, not agent error)
    step_5_root_cause: if multiple agents fail same quality gate → investigate schema or standard, not agents
  
  F4_COORDINATOR_LOSS_recovery:
    DOMAIN_COORDINATOR_loss:
      step_1: apex coordinator identifies affected domain work units
      step_2: if replacement_domain_coordinator available (pre-designated): activate immediately
      step_3: if not pre-designated: discovery query for qualified domain coordinator
      step_4: new coordinator briefed: current state, completed units, in-progress units, remaining work
      step_5: in-progress units under failed coordinator: heartbeat check → status verification
      step_6: new coordinator resumes domain management
      target_recovery_time: < 15 minutes
    
    APEX_COORDINATOR_loss:
      step_1: CRITICAL alert to human sponsor immediately
      step_2: all domain coordinators enter PAUSED state (no new assignments until apex restored)
      step_3: if backup_apex designated: activate with full task state briefing
      step_4: if no backup: human sponsor must designate replacement or take direct coordination
      step_5: task resumes under new apex
      target_recovery_time: < 30 minutes (human decision required)
  
  F5_DEPENDENCY_DEADLOCK_recovery:
    step_1_detect: dependency graph cycle detection (runtime graph traversal)
    step_2_identify_cycle: minimal cycle that is deadlocked
    step_3_break_cycle:
      criterion: abort the work unit in the cycle with lowest priority and lowest blast_radius
      action: abort selected unit; release its held resources; notify dependent agents
    step_4_resume: remaining units in cycle can now proceed
    step_5_root_cause: if this cycle was in the original plan → planning error; notify strategy engine
    prevention: orchestration-strategy-engine validates no cycles at plan creation
  
  F6_RESOURCE_EXHAUSTION_recovery:
    step_1_queue: task enters waiting queue with AWAITING_CAPACITY status
    step_2_alert: notify orchestrator and Tier-3+ of capacity gap; include capability detail
    step_3_options: orchestrator selects from:
      WAIT: queue task; accept timeline extension
      SCOPE_REDUCTION: reduce task to capabilities available (human approval required)
      EMERGENCY_DELEGATION: temporarily expand an existing agent's capability authorization (Tier-4+ required)
      EXTERNAL_ESCALATION: request external agents or human execution
    step_4_monitor: if wait > 2 hours without capacity → mandatory human escalation
    strategic_signal: repeated F6 for same capability → enterprise capability gap investigation
  
  F7_CASCADE_FAILURE_recovery:
    step_1_circuit_breaker: immediately stop accepting new task assignments enterprise-wide (or in affected domain)
    step_2_triage: enumerate all in-flight tasks; classify by criticality
    step_3_preserve_critical: CRITICAL tasks assigned to any remaining healthy agents
    step_4_human_escalation: Tier-4+ notified immediately; enterprise command center alerted
    step_5_infrastructure_check: determine if failure is agent-level or infrastructure-level
    step_6_systematic_recovery: restore domain capacity systematically; re-enable task intake gradually
    step_7_post_incident: mandatory postmortem within 24 hours
    circuit_breaker_reset: only Tier-4+ can reset circuit breaker after cascade
  
  F8_PLAN_INVALIDATION_recovery:
    step_1_scope: determine what is salvageable (completed + in-progress work units)
    step_2_salvage: completed work units: output retained; in-progress: reach safe stopping point
    step_3_replan: orchestration-strategy-engine runs new plan with updated constraints
    step_4_resume_or_abort:
      if_partial_salvage_useful: new plan starts from salvage state
      if_not_salvageable: abort with full state documentation for human decision
    step_5_human_notification: always notify human sponsor; include timeline and scope impact
  
  F9_AUTHORITY_CHAIN_BREAK_recovery:
    step_1_halt: agents in affected chain halt autonomous action immediately (governance constraint)
    step_2_notify: delegation governance lead notified
    step_3_determine_cause:
      EXPIRED: new delegation record required (follow delegation-model.md protocol)
      REVOKED: intentional; task scope may have changed; human decision required
    step_4_re_authorize: if task should continue → new authority chain established
    step_5_validate_past_actions: review all actions taken under the now-broken chain
      VALID (within scope): no action needed
      INVALID (exceeded scope): document; escalate for review
```

---

## Recovery Governance

```yaml
recovery_governance:
  automated_recovery_permitted:
    F1_AGENT_DROPOUT: yes (backup available) | requires_notification (no backup)
    F2_TASK_TIMEOUT: yes (extension phase) | requires_orchestrator_decision (second timeout)
    F3_QUALITY_GATE: yes (revision window) | requires_orchestrator_decision (reassignment)
    F5_DEPENDENCY_DEADLOCK: yes (for equal priority ties) | requires_human (CRITICAL priority tasks)
  
  requires_human_notification:
    F4_COORDINATOR_LOSS: always (apex coordinator loss: immediate; domain coordinator: within 15 min)
    F6_RESOURCE_EXHAUSTION: if wait > 30 minutes
    F7_CASCADE_FAILURE: always immediate
    F8_PLAN_INVALIDATION: always
    F9_AUTHORITY_CHAIN_BREAK: always
  
  recovery_audit:
    all recovery actions logged with: failure_class, detection_time, actions_taken, recovery_time
    retention: 3 years (all recovery events); 7 years (cascade failures)
    monthly_review: recovery events analyzed for prevention opportunities
    alert_threshold: if same failure class > 3× in 7 days → pattern investigation
```

---

## Recovery Metrics

```yaml
recovery_metrics:
  mean_time_to_recovery: average across all failure classes (target: < 15 minutes overall)
  recovery_success_rate: fraction of failures resolved without human intervention (target: > 0.80)
  task_continuation_rate: fraction of tasks that complete despite mid-task failure (target: > 0.90)
  cascade_incident_count: count of F7 events (target: 0; any occurrence triggers review)
  authority_chain_break_count: count of F9 events (target: 0; any occurrence triggers investigation)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-registry/agent-health-monitor.md` | F1 and F4 detection; agent state changes |
| `coordination-operations/work-distribution-engine.md` | F2 and F3 detection; reassignment execution |
| `coordination-operations/conflict-resolution-engine.md` | F5 deadlock breaking; F6 arbitration |
| `delegation-and-trust/delegation-model.md` | F9 authority chain break governance |
| `orchestration-patterns/orchestration-strategy-engine.md` | F8 re-planning |
| `enterprise-nervous-system/enterprise-command-center.md` | F7 cascade failure → command center alert |
| `agent-performance/agent-performance-tracker.md` | Failure events contribute to performance signals |
