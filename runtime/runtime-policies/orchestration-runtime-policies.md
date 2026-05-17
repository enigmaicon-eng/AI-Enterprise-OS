# Orchestration Runtime Policies

## Purpose
The complete set of policies governing multi-agent orchestration operations at runtime — task assignment, delegation, escalation, peer coordination, and orchestration pattern selection. These policies are evaluated by the policy engine for every consequential orchestration decision, ensuring that the multi-agent system operates within its authority boundaries, maintains delegation chain integrity, and enforces governance requirements automatically rather than relying on individual agent compliance.

---

## Policy Catalog — Orchestration Domain

```yaml
orchestration_policies:
  POL-ORCH-001:
    policy_name: delegation_chain_depth_limit
    obligation_ids: [OBL-GOV-ORCH-001]
    control_ids: [CTL-OPS-001]
    priority: 15
    
    rules:
      RULE-ORCH-001-01:
        name: max_delegation_depth_four
        description: "Delegation chain may not exceed 4 hops from originating human authority."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TASK_DELEGATED"}
            - {field: "context.delegation_chain", op: "length_gt", value: 4}
        effect:
          type: DENY
          hard_deny: false
          reason_template: "Delegation chain depth {context.delegation_chain.length} exceeds maximum of 4. Trace: {context.delegation_chain}."
      
      RULE-ORCH-001-02:
        name: delegation_chain_must_be_traceable
        description: "All delegation chains must be traceable to a human principal in the chain."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TASK_DELEGATED"}
            - {function: "has_human_in_chain", args: ["context.delegation_chain"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Delegation chain contains no human principal. All agent delegation chains must trace to a human. POLICY-DG-003."
  
  POL-ORCH-002:
    policy_name: governance_delegation_requires_human
    obligation_ids: [OBL-GOV-ORCH-002]
    priority: 5
    
    rules:
      RULE-ORCH-002-01:
        name: governance_domain_requires_human_in_chain
        description: "GOVERNANCE-domain tasks may never be delegated in an all-agent chain. A human principal must be in the delegation chain."
        condition:
          all_of:
            - {field: "resource.resource_domain", op: eq, value: "GOVERNANCE"}
            - {field: "action.action_type", op: eq, value: "TASK_DELEGATED"}
            - {function: "has_human_in_chain", args: ["context.delegation_chain"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "GOVERNANCE domain tasks require a human in the delegation chain. This is POLICY-DG-003 — non-bypassable."
  
  POL-ORCH-003:
    policy_name: tier_authority_for_orchestration_patterns
    obligation_ids: [OBL-GOV-ORCH-003]
    priority: 20
    
    rules:
      RULE-ORCH-003-01:
        name: dynamic_team_formation_requires_tier2
        description: "DYNAMIC_TEAM_FORMATION orchestration requires at least Tier-2 authority in the initiating agent."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "ORCHESTRATION_PLAN_INITIATED"}
            - {field: "resource.resource_type", op: eq, value: "ORCHESTRATION_PATTERN"}
            - {field: "resource.resource_id", op: eq, value: "PAT-ORCH-008"}
            - {field: "subject.actor_tier", op: lt, value: 2}
        effect:
          type: DENY
          reason_template: "DYNAMIC_TEAM_FORMATION requires Tier-2+ authority. Actor tier: {subject.actor_tier}."
      
      RULE-ORCH-003-02:
        name: enhanced_approval_orchestration_requires_tier3
        description: "Orchestration plans rated ENHANCED or CRITICAL approval level require Tier-3+ authority."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "ORCHESTRATION_PLAN_INITIATED"}
            - {field: "resource.resource_classification", op: in, value: ["ENHANCED", "CRITICAL"]}
            - {field: "subject.actor_tier", op: lt, value: 3}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3}]
          quorum: 1
          timeout: "30m"
  
  POL-ORCH-004:
    policy_name: task_assignment_trust_threshold
    obligation_ids: [OBL-GOV-ORCH-004]
    priority: 25
    
    rules:
      RULE-ORCH-004-01:
        name: governance_task_requires_minimum_trust
        description: "GOVERNANCE domain tasks may only be assigned to agents with trust score >= 0.65 in the GOVERNANCE domain."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TASK_ASSIGNED"}
            - {field: "resource.resource_domain", op: eq, value: "GOVERNANCE"}
            - {function: "lookup_trust_score", args: ["subject.actor_id", "GOVERNANCE"], op: lt, value: 0.65}
        effect:
          type: DENY
          reason_template: "Agent trust score for GOVERNANCE domain ({lookup_trust_score(subject.actor_id, GOVERNANCE)}) is below required 0.65 threshold for GOVERNANCE task assignment."
      
      RULE-ORCH-004-02:
        name: low_trust_agent_restricted_blast_radius
        description: "Agents with trust score < 0.50 may not be assigned tasks with HIGH or CRITICAL blast radius."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TASK_ASSIGNED"}
            - {field: "action.blast_radius", op: in, value: ["HIGH", "CRITICAL"]}
            - {function: "lookup_trust_score", args: ["subject.actor_id", "resource.resource_domain"], op: lt, value: 0.50}
        effect:
          type: DENY
          reason_template: "Agent trust score below 0.50 prohibits assignment of HIGH/CRITICAL blast radius tasks."
  
  POL-ORCH-005:
    policy_name: escalation_cannot_be_suppressed
    obligation_ids: [OBL-GOV-ORCH-005]
    priority: 10
    
    rules:
      RULE-ORCH-005-01:
        name: escalation_trigger_cannot_be_bypassed
        description: "Non-bypassable escalation triggers (from authority-transfer-protocol.md) cannot be suppressed or routed around by any agent."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "ESCALATION_SUPPRESSED"}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Escalation suppression is prohibited. Non-bypassable escalation triggers must reach their designated recipient. Any attempt to suppress is a governance violation."
  
  POL-ORCH-006:
    policy_name: peer_coordination_conflict_resolution
    obligation_ids: [OBL-GOV-ORCH-006]
    priority: 30
    
    rules:
      RULE-ORCH-006-01:
        name: arbiter_must_be_higher_tier_than_disputants
        description: "Conflict arbiter in peer coordination must be higher tier than the agents in dispute."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONFLICT_ARBITER_ASSIGNED"}
            - {function: "arbiter_tier_gte_max_disputant_tier", args: ["subject.actor_id", "resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "Conflict arbiter tier must be higher than all disputant tiers."
  
  POL-ORCH-007:
    policy_name: work_reassignment_requires_original_authorization
    obligation_ids: [OBL-GOV-ORCH-007]
    priority: 25
    
    rules:
      RULE-ORCH-007-01:
        name: reassigned_work_preserves_authority_requirements
        description: "When a task is reassigned (e.g., due to agent failure), the reassignment must be to an agent with at least the same authority level as the original assignee."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TASK_REASSIGNED"}
            - {function: "reassignee_tier_lt_original_tier", args: ["subject.actor_id", "resource.resource_id"], op: eq, value: true}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3}]
          quorum: 1
          timeout: "15m"
          reason_template: "Reassignment to lower-tier agent requires Tier-3+ approval to verify no authority gap."
```

---

## Orchestration Policy Evaluation Points

```yaml
evaluation_points:
  BEFORE_task_assignment: [POL-ORCH-001, POL-ORCH-002, POL-ORCH-004]
  BEFORE_delegation: [POL-ORCH-001, POL-ORCH-002, POL-ORCH-004]
  BEFORE_orchestration_plan_initiation: [POL-ORCH-003]
  ON_escalation_routing: [POL-ORCH-005]
  BEFORE_conflict_arbiter_assignment: [POL-ORCH-006]
  BEFORE_task_reassignment: [POL-ORCH-007]
  
  evaluation_mode:
    all_evaluation_points: SYNCHRONOUS (block until decision; never async for orchestration policies)
    timeout: 100ms maximum for orchestration policy evaluation
    timeout_action: DENY (never allow on timeout; safe default)
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Evaluates these policies at each orchestration decision point |
| `coordination-operations/work-distribution-engine.md` | Task assignment checks POL-ORCH-004 |
| `delegation-and-trust/delegation-model.md` | Delegation checks POL-ORCH-001, POL-ORCH-002 |
| `coordination-operations/conflict-resolution-engine.md` | Conflict resolution checks POL-ORCH-006 |
| `orchestration-patterns/orchestration-strategy-engine.md` | Pattern selection checks POL-ORCH-003 |
| `coordination-operations/orchestration-failure-recovery.md` | Task reassignment checks POL-ORCH-007 |
