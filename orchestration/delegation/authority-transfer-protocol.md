# Authority Transfer Protocol

## Purpose
Defines the precise mechanism by which authority moves between agents — what authority transfer means, how it is formalized, how it is bounded, and how it is revoked. Authority transfer is distinct from delegation: delegation assigns work; authority transfer grants decision-making power that can be exercised autonomously. Disciplined authority transfer is the difference between a governed multi-agent system and an unconstrained autonomous system.

---

## Authority Transfer Model

```yaml
authority_model:
  authority_types:
    TASK_EXECUTION_AUTHORITY:
      description: authority to execute a specific task using authorized capabilities
      scope: bounded to one task instance
      autonomous_action: yes, within task scope
      requires: valid delegation record
    
    DECISION_AUTHORITY:
      description: authority to make a specific class of decisions autonomously
      scope: bounded by decision type, domain, and time period
      autonomous_action: yes, for decisions within class
      requires: explicit grant from tier+1 agent or human
    
    COORDINATION_AUTHORITY:
      description: authority to coordinate other agents, assign work, and integrate outputs
      scope: bounded by team or domain specification
      autonomous_action: yes, for coordination actions
      requires: orchestration pattern assignment + explicit authority record
    
    REPRESENTATION_AUTHORITY:
      description: authority to act on behalf of another agent or human in a specific context
      scope: bounded by context definition and duration
      autonomous_action: yes, within context
      requires: explicit human authorization for human representation; peer authorization for agent
    
    EMERGENCY_AUTHORITY:
      description: expanded authority during declared incidents; includes authority outside normal scope
      scope: bounded by emergency declaration and 4-hour time limit
      autonomous_action: yes, but all actions flagged for post-emergency review
      requires: Tier-4+ declaration + automatic expiry
```

---

## Authority Transfer Record

```yaml
authority_transfer_record:
  transfer_id: "AUTH-{grantor_id}-{seq}-{timestamp}"
  transfer_type: TASK_EXECUTION | DECISION | COORDINATION | REPRESENTATION | EMERGENCY
  
  parties:
    grantor:
      id: agent_id | human_id
      authority_basis: string    # the authority backing this transfer (e.g., "Tier-4 organizational authority"; "delegation DEL-xxx")
      tier: int
    
    recipient:
      id: agent_id
      tier: int
      acknowledged: boolean
      acknowledged_at: ISO-8601 | null
  
  authority_specification:
    decision_types_granted: [string]          # explicit list of decision types recipient can make
    decision_types_excluded: [string]         # explicit list recipient CANNOT make (must escalate)
    domain_restriction: string | null         # if set, authority only in this domain
    capability_restriction: [capability_id] | null  # if set, only via these capabilities
    autonomy_ceiling:
      max_impact_scope: string               # e.g., "single agent", "team", "org unit", "enterprise"
      max_reversibility: EASILY_REVERSIBLE | HARD_TO_REVERSE | IRREVERSIBLE
      # recipient cannot take actions exceeding these limits without escalation
    
    escalation_triggers: [string]            # conditions that must trigger escalation regardless
    # Any trigger condition arising = recipient must escalate; cannot act autonomously
  
  temporal:
    effective_from: ISO-8601
    expires_at: ISO-8601                     # ALL authority transfers have expiry (emergency: 4h max; others: task-scoped)
    duration_basis: TASK_COMPLETION | FIXED_TIME | EVENT_TRIGGERED
  
  oversight:
    requires_post_action_report: boolean     # must recipient report decisions made under this authority?
    report_to: agent_id | human_id | null
    report_within: duration | null           # e.g., "PT1H" (1 hour after exercise)
    grantor_can_observe_realtime: boolean    # can grantor monitor exercise in real time?
  
  status: PENDING | ACTIVE | EXERCISED | EXPIRED | REVOKED
  governance_log: [authority_exercise_events]
```

---

## Authority Transfer Protocol Steps

```yaml
transfer_protocol:
  step_1_authority_check:
    validation: grantor holds the authority being transferred
    validation: transfer does not exceed grantor's own authority ceiling
    validation: recipient tier is appropriate for authority type
    failure: AUTHORITY_INFLATION_DETECTED → reject + alert governance
  
  step_2_scope_verification:
    validation: authority specification is complete (no ambiguity in decision_types_granted)
    validation: escalation_triggers are defined
    validation: expiry is set and <= grantor's own authority expiry
    failure: INCOMPLETE_SPECIFICATION → reject with required fields list
  
  step_3_recipient_notification:
    action: notify recipient of pending authority transfer
    content: full authority_specification, escalation_triggers, expiry
    acknowledgment_window: 2 minutes
    non_response: transfer cancelled; grantor notified
  
  step_4_recipient_verification:
    action: recipient confirms:
      - understanding of scope (decision types granted and excluded)
      - acceptance of escalation triggers
      - acknowledgment of post-action reporting requirement if applicable
    action: recipient confirms capability to exercise authority (not in OVERLOADED state)
  
  step_5_activation:
    status: ACTIVE
    log: authority transfer recorded in enterprise audit trail
    indexes_updated: recipient appears in authority_holders index for this transfer type
    grantor_confirmed: grantor receives confirmation receipt
  
  step_6_exercise_monitoring:
    during ACTIVE period:
      all decisions tagged with transfer_id
      decisions at autonomy_ceiling boundaries → auto-logged with extra detail
      any ESCALATION_TRIGGER encountered → immediate human notification
      grantor_realtime_observation: if enabled, grantor sees decisions as they're made
  
  step_7_expiry_or_completion:
    TASK_COMPLETION: status → EXERCISED; post-action report generated if required
    FIXED_TIME expiry: status → EXPIRED; pending decisions must be escalated
    REVOCATION: immediate; see revocation protocol below
```

---

## Authority Boundaries and Enforcement

```yaml
authority_boundaries:
  hard_limits:
    recipients_cannot:
      - exercise authority beyond their own tier capability (even if granted by error)
      - transfer received authority to other agents unless explicitly permitted
      - override constitutional constraints or safety constraints (regardless of authority level)
      - take irreversible actions beyond their autonomy_ceiling without explicit escalation
      - suppress or delay escalation_triggers
  
  boundary_enforcement:
    pre_action_check: before any autonomous action, recipient verifies action is within authority spec
    boundary_crossing_attempt:
      if_accidental: recipient automatically escalates; logs crossing attempt
      if_intentional: GOVERNANCE_VIOLATION; all current authority revoked; investigation triggered
  
  escalation_triggers_are_non_bypassable:
    any_defined_escalation_trigger_condition: must be escalated, always
    self_assessment_is_insufficient: "I believe I can handle this" does not override an escalation trigger
    POLICY: bypassing a defined escalation trigger = governance violation; highest severity
```

---

## Revocation Protocol

```yaml
revocation_protocol:
  who_can_revoke:
    grantor: can revoke at any time (no justification required; reasons encouraged)
    grantor_supervisor: can revoke if grantor is unavailable
    governance_lead: can revoke any authority transfer for cause
    Tier-4+: can revoke any authority transfer (emergency)
  
  revocation_steps:
    step_1_immediate_notification: recipient notified within 2 seconds
    step_2_action_cessation: recipient must stop all autonomous actions within the revoked authority
    step_3_safe_stop: recipient has 5 minutes to reach a safe stopping point
    step_4_state_handoff: recipient produces handoff record of:
      - decisions made under authority (with outcomes if known)
      - pending decisions not yet made (grantor assumes responsibility)
      - any in-progress actions that need completion or rollback
    step_5_authority_transfer_closed: status → REVOKED; all authority_exercise events archived
  
  post_revocation_obligations:
    grantor: must decide on pending decisions recipient was handling
    governance: review revocation reason; if governance concern, trigger investigation
    
  irrevocable_decisions:
    decisions already made under valid authority cannot be "unrevoked"
    revocation stops future exercise, not past exercise
    if past decision was wrong: standard correction/escalation path applies
```

---

## Authority Transfer in Orchestration Contexts

```yaml
orchestration_contexts:
  COMMAND_AND_CONTROL (PAT-ORCH-001):
    coordinator receives: COORDINATION_AUTHORITY over all subordinates
    workers receive: TASK_EXECUTION_AUTHORITY for their assigned tasks
    coordinator cannot: exceed scope of original task charter
  
  FEDERATED_HIERARCHY (PAT-ORCH-003):
    apex receives: COORDINATION_AUTHORITY from human sponsor
    domain coordinators receive: COORDINATION_AUTHORITY from apex (bounded to their domain)
    domain authority cannot exceed: apex authority (transitive bounded transfer)
  
  CONSENSUS_PROTOCOL (PEER-001):
    no authority transfer: peers operate with their own inherent authority
    final decision: only if consensus reached; dissent preserved
    no_consensus: escalation to higher authority (not resolved by a peer assuming authority)
  
  EMERGENCY_DELEGATION:
    incident commander receives: EMERGENCY_AUTHORITY (4h max)
    includes: authority to assign tasks to any available agent without standard discovery process
    excludes: constitutional constraints, safety constraints (never transferred)
    post_incident: full authority exercise log reviewed within 24 hours
```

---

## Audit and Compliance

```yaml
audit:
  per_transfer:
    - transfer_id, grantor, recipient, authority_type, scope, temporal
    - all authority_exercise events (decision made, outcome, timestamp)
    - expiry or revocation record
  
  retention:
    TASK_EXECUTION_AUTHORITY: 1 year
    DECISION_AUTHORITY: 3 years
    COORDINATION_AUTHORITY: 3 years
    REPRESENTATION_AUTHORITY: 3 years
    EMERGENCY_AUTHORITY: 7 years
  
  monthly_audit:
    - all EMERGENCY_AUTHORITY transfers reviewed for appropriateness
    - any authority inflation attempts in the month
    - escalation trigger bypass attempts
    - authorities that expired without completion (investigation of why)
  
  compliance_alerts:
    AUTHORITY_INFLATION_ATTEMPT: immediate Tier-4+ alert
    ESCALATION_TRIGGER_BYPASS: immediate Tier-3+ alert + governance investigation
    EMERGENCY_AUTHORITY_OVERDUE_REVIEW: alert if post-emergency review not completed within 24h
```

---

## Integration Points

| System | Role |
|---|---|
| `delegation-and-trust/delegation-model.md` | Delegation is the request that initiates authority transfer |
| `delegation-and-trust/trust-propagation-engine.md` | Trust score gates on authority transfer eligibility |
| `delegation-and-trust/delegation-governance.md` | Policy framework governing authority transfer |
| `orchestration-patterns/hierarchical-orchestration.md` | Hierarchy defines the authority flow this protocol formalizes |
| `governance-queues/confidence-threshold-system.md` | Authority transfer affects confidence routing thresholds |
| `docs/governance/principles.md` | Authority transfer operates within the five governance principles |
