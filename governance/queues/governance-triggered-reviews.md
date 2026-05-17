# Governance-Triggered Reviews

## Purpose
Defines all the conditions under which governance systems automatically trigger human review — not because an AI agent reported low confidence, but because an objective governance rule determined human oversight is required. These are non-negotiable review triggers: no agent authority, no policy exception, no optimization can bypass them.

---

## Trigger Catalog

### Constitutional Triggers

```yaml
CONST-01:
  name: Constitutional Conditional Verdict
  trigger: constitutional evaluation returns CONDITIONAL
  description: Action is permitted only with specific human-acknowledged conditions
  auto_action:
    halt_workflow: true
    create_review: REQUIRED_REVIEW tier-3
    include_in_review: {conditions_list, constitutional_evaluator_notes, precedent_cases}
  sla_ms: 14400000   # 4 hours
  cannot_bypass: true

CONST-02:
  name: Repeated Constitutional Near-Miss
  trigger: same agent has 3+ CONDITIONAL verdicts within 7 days
  description: Pattern suggests agent is operating too close to constitutional limits
  auto_action:
    create_review: EXPERT_REVIEW tier-4
    review_type: AGENT_CONDUCT_REVIEW
    include_in_review: {all conditional verdicts, agent behavior pattern, trust score trend}
  sla_ms: 86400000   # 24 hours
  agent_notification: true   # agent informed that pattern review is underway

CONST-03:
  name: Novel Constitutional Domain
  trigger: constitutional evaluation encounters a principle area with no precedent
  description: Novel situations require human establishment of precedent
  auto_action:
    halt_workflow: true
    create_review: EXPERT_REVIEW tier-4 + governance-lead
    review_type: CONSTITUTIONAL_PRECEDENT_SETTING
    include_in_review: {novel_situation_description, applicable_principles, proposed_interpretation}
  sla_ms: 86400000
  creates_precedent: true
```

### Authority & Tier Triggers

```yaml
AUTH-01:
  name: Tier Boundary Approach
  trigger: workflow action is at exactly the boundary of current principal's tier authority
  description: Edge-of-authority actions require explicit authorization, not implicit approval
  auto_action:
    create_review: REQUIRED_REVIEW at current_tier + 1
    include_in_review: {authority_analysis, why_at_boundary, risk_if_authorized}
  sla_ms: 28800000   # 8 hours

AUTH-02:
  name: Delegation Depth Exceeded
  trigger: agent delegation chain depth > 2
  description: Long delegation chains obscure accountability; human reset required
  auto_action:
    pause_delegation_chain: true
    create_review: REQUIRED_REVIEW tier-3
    include_in_review: {full_delegation_chain, task_description, accountability_gap}
  sla_ms: 14400000

AUTH-03:
  name: Cross-Organizational Action
  trigger: agent from org-A taking action that modifies state in org-B without org-B consent record
  auto_action:
    halt_action: true
    create_review: REQUIRED_REVIEW tier-2 from both orgs
    notify: [org-A-lead, org-B-lead]
  sla_ms: 14400000

AUTH-04:
  name: Elevated Trust Tier Action
  trigger: action requires trust tier > agent's current tier (caught before execution)
  auto_action:
    block_action: true
    create_review: ESCALATION tier = required_tier
    include_in_review: {action_description, required_tier, current_tier, gap_analysis}
  sla_ms: determined by gap magnitude
```

### Governance Process Triggers

```yaml
GOV-01:
  name: Approval SLA at 80%
  trigger: approval item has consumed 80% of its SLA without decision
  auto_action:
    escalate_review_item: true
    notify: [assigned_reviewer, reviewer_manager]
    priority_boost: +200 points
  sla_ms: remaining_sla * 0.20

GOV-02:
  name: Governance Throughput Degradation
  trigger: approval queue throughput drops > 30% below 7-day average for > 1 hour
  auto_action:
    create_review: OPERATIONAL_REVIEW tier-3
    review_type: GOVERNANCE_CAPACITY_REVIEW
    include_in_review: {throughput_data, queue_depths, reviewer_availability}
  sla_ms: 7200000   # 2 hours

GOV-03:
  name: Consecutive Rejection Pattern
  trigger: same artifact or request type rejected 3+ times within 30 days
  description: Repeated rejections may indicate systemic issue, not individual problem
  auto_action:
    create_review: EXCEPTION_REVIEW tier-3
    review_type: PATTERN_REVIEW
    include_in_review: {rejection_history, rejection_reasons, submitter_patterns}
  sla_ms: 86400000
  notify: governance-lead

GOV-04:
  name: Override Accumulation
  trigger: same agent or same scope has > 2 active overrides simultaneously
  description: Multiple simultaneous overrides suggest systemic constraint problem
  auto_action:
    flag_for_review: all active overrides by this agent/scope
    create_review: GOVERNANCE_REVIEW tier-4
    include_in_review: {all_overrides, business_justifications, systemic_analysis}
  sla_ms: 86400000

GOV-05:
  name: Compliance Score Threshold Breach
  trigger: org or process compliance score drops below 0.80 (NEEDS_ATTENTION threshold)
  auto_action:
    create_review: OPERATIONAL_REVIEW tier-3
    include_in_review: {compliance_score_breakdown, contributing_violations, trend}
  sla_ms: 86400000
```

### Risk and Safety Triggers

```yaml
RISK-01:
  name: Impact Blast Radius Threshold
  trigger: proposed action has blast radius > 10 affected workflows (from dependency-impact-analyzer.md)
  auto_action:
    halt_action: true
    create_review: REQUIRED_REVIEW tier-3
    include_in_review: {blast_radius_analysis, affected_workflows, rollback_plan}
  sla_ms: 14400000

RISK-02:
  name: Irreversible High-Risk Action
  trigger: action is both reversible=false AND risk_level=HIGH or CRITICAL
  auto_action:
    halt_action: true
    create_review: REQUIRED_REVIEW tier-3 minimum
    require_dual_approval: if risk_level == CRITICAL
    include_in_review: {irreversibility_analysis, risk_assessment, what_cannot_be_undone}
  sla_ms: 14400000
  constitutional_check: always

RISK-03:
  name: New Agent First High-Stakes Action
  trigger: agent performing first action of type with risk_level >= HIGH
  description: New agents on high-stakes tasks need human validation of first execution
  auto_action:
    create_review: SOFT_REVIEW tier-2
    include_in_review: {agent_profile, action_description, capability_match_score}
  sla_ms: 86400000
  after_first_approved: subsequent same-type actions may proceed autonomously

RISK-04:
  name: After-Hours High-Risk Action
  trigger: action risk_level >= HIGH AND outside business hours AND no on-call approval on file
  auto_action:
    halt_action: true
    queue: ESCALATION with CRITICAL urgency
    wake_on_call: true
    include_in_review: {time_pressure, what_happens_if_deferred, risk_if_delayed}
```

### Behavioral Triggers

```yaml
BEH-01:
  name: Agent Behavior Anomaly
  trigger: agent behavior score deviates > 2 standard deviations from own baseline
  auto_action:
    create_review: EXCEPTION_REVIEW ANOMALY_DETECTED category
    soft_suspend: agent accepting no new tasks during review
    include_in_review: {anomaly_details, baseline_comparison, potential_causes}
  sla_ms: 14400000

BEH-02:
  name: Trust Score Degradation
  trigger: agent trust score drops > 0.10 within 7 days
  auto_action:
    create_review: EXPERT_REVIEW tier-3
    review_type: AGENT_TRUST_REVIEW
    lower_confidence_threshold: by 0.10 during review (stricter routing)
    include_in_review: {trust_score_history, actions_during_degradation_period, override_count}
  sla_ms: 86400000

BEH-03:
  name: Scope Boundary Test
  trigger: agent requests capability or access outside its authorized scope
  auto_action:
    deny_request: immediately
    create_review: EXCEPTION_REVIEW POLICY_EXCEPTION category
    log_scope_test: permanent record regardless of outcome
    include_in_review: {requested_capability, authorized_scope, delta_analysis}
  sla_ms: 28800000
```

---

## Trigger Configuration

```yaml
trigger_configuration:
  global_enable: true
  
  per_trigger:
    CONST-01: enabled: true, threshold_override: null
    CONST-02: enabled: true, rolling_window_days: 7
    AUTH-01: enabled: true
    RISK-02: enabled: true, risk_level_threshold: HIGH   # configurable: can raise to CRITICAL if too noisy
    BEH-01: enabled: true, sensitivity: 2.0  # standard deviations
  
  change_governance:
    disable_trigger: Tier-4 required + dual approval
    change_threshold: Tier-3 required
    change_log: all configuration changes permanently recorded
    
  prohibited_changes:
    - disable CONST-01 (constitutional conditional — non-negotiable)
    - disable CONST-03 (novel constitutional domain — non-negotiable)
    - disable RISK-02 for irreversible+critical actions (non-negotiable)
```

---

## Trigger Metrics

```yaml
metrics:
  trigger_rate_by_type:          # volume per trigger per day/week
  false_positive_rate:           # triggers that resulted in DISMISSED outcome
  action_taken_rate:             # triggers that led to actual intervention
  trigger_to_review_latency_ms:  # time from trigger to review item creation
  trigger_saturation:            # if same trigger fires > N times/day, may need threshold tuning
```
