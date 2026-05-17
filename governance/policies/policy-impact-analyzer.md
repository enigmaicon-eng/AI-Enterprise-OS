# Policy Impact Analyzer

## Purpose
Quantifies the consequences of policy changes before they are activated — analyzing how a new or modified policy would affect current operations, which workflows and agents would be affected, how many decisions would produce different outcomes, and what compliance risks arise from the change. Policy changes without impact analysis are dangerous: a well-intentioned tightening of a security policy could inadvertently block critical compliance workflows; an overly broad exception could create uncontrolled exposure. The impact analyzer makes policy changes deliberate and evidence-based.

---

## Impact Analysis Architecture

```
Policy Change Proposal (new version of existing policy OR new policy)
        ↓
[1. Scope Analysis]              → what does this policy apply to? what changed from prior version?
        ↓
[2. Decision Divergence Analysis]  → sample historical decisions; replay under new policy; measure divergence
        ↓
[3. Workflow Impact Assessment]    → which active workflows would be affected?
        ↓
[4. Coverage Impact Assessment]    → does this change create obligation coverage gaps or overlaps?
        ↓
[5. Conflict Detection]            → does this policy conflict with other active policies?
        ↓
[6. Risk Impact Assessment]        → does this change increase or decrease operational or compliance risk?
        ↓
[7. Approval Requirement Analysis] → does this change affect which approvals are needed?
        ↓
[8. Impact Report Generation]      → structured report with findings and recommendations
        ↓
[9. Governance Record]             → impact analysis stored alongside policy in registry
```

---

## Impact Analysis Request

```yaml
impact_analysis_request:
  analysis_id: "IMPANA-{policy_id}-{version}-{timestamp}"
  
  subject:
    policy_id: string
    proposed_version: PDL document      # the new policy to analyze
    baseline_version: semver | null     # existing version to compare against (null = new policy)
    analysis_reason: ACTIVATION_GATE | CHANGE_REVIEW | REGULATORY_CHANGE | PERIODIC_REVIEW | INCIDENT_RESPONSE
  
  analysis_scope:
    decision_sample:
      period: {from: ISO-8601, to: ISO-8601}  # historical period for divergence analysis
      max_decisions: int                        # cap for very active policies (default 10,000)
      stratified_sampling: boolean              # ensure all action types are represented
    
    workflow_impact:
      check_active_workflows: boolean           # check currently running workflows
      check_planned_workflows: boolean          # check workflows in planning stage
      domain_filter: [string] | null            # limit to specific compliance domains
    
    coverage_analysis: boolean
    conflict_detection: boolean
    risk_assessment: boolean
    approval_impact_analysis: boolean
  
  requestor: agent_id | human_id
  requested_at: ISO-8601
  urgency: ROUTINE | EXPEDITED | EMERGENCY
```

---

## Decision Divergence Analysis

```yaml
decision_divergence_analysis:
  method:
    step_1: retrieve sample of historical decisions from policy-audit (immutable-policy-audit.md)
    step_2: for each sampled decision:
             reconstruct original evaluation context (from policy-replay-engine.md)
             evaluate under proposed new policy version
             compare to original decision
    step_3: compute divergence statistics
    step_4: classify divergence types
  
  divergence_classification:
    NEW_DENY:
      definition: original decision was ALLOW; new policy would DENY
      risk_level: HIGH — existing operations would be blocked if policy activated
      example: "Security policy tightening would block 234 currently-permitted configuration changes"
      action_required: review each blocked case; determine if blocking is intended
    
    NEW_ALLOW:
      definition: original decision was DENY; new policy would ALLOW
      risk_level: HIGH — currently blocked operations would become permitted
      example: "Policy relaxation would permit 156 previously-denied cross-domain data transfers"
      action_required: verify each newly-permitted case is intentionally permitted
    
    NEW_REQUIRE_APPROVAL:
      definition: original decision was ALLOW; new policy would REQUIRE_APPROVAL
      risk_level: MEDIUM — operations would be slowed but not blocked
      example: "Policy change would route 892 tasks per week through Tier-3+ approval"
      action_required: verify approval load is manageable; identify approver capacity
    
    REMOVED_REQUIRE_APPROVAL:
      definition: original decision required approval; new policy allows without approval
      risk_level: MEDIUM — governance overhead reduced but oversight reduced
      action_required: verify oversight reduction is intentional and justified
    
    HARD_DENY_INTRODUCED:
      definition: original decision was soft DENY; new policy introduces HARD_DENY
      risk_level: CRITICAL — previously-appealable blocks become unconditional
      action_required: explicit sign-off from Tier-4+ required; cannot be activated without review
    
    HARD_DENY_REMOVED:
      definition: original decision was HARD_DENY; new policy makes it overrideable
      risk_level: CRITICAL — constitutional or regulatory protection may be weakened
      action_required: explicit board-level review required; legal counsel confirmation
  
  divergence_statistics:
    total_decisions_sampled: int
    new_deny_count: int
    new_allow_count: int
    new_require_approval_count: int
    removed_require_approval_count: int
    exact_match_count: int
    divergence_rate: float (non-exact-match / total)
    high_risk_divergence_count: int (NEW_DENY + NEW_ALLOW + HARD_DENY_*)
    
    decision_rate_impact:
      estimated_weekly_decisions_affected: int  # extrapolated from sample
      estimated_new_approval_requests_per_week: int
      estimated_blocked_operations_per_week: int
```

---

## Workflow Impact Assessment

```yaml
workflow_impact_assessment:
  active_workflow_analysis:
    source: execution-registry (active workflows from continuation-systems)
    method:
      1. for each active workflow: identify planned steps that match new policy's scope
      2. run feasibility check for each planned step under new policy
      3. identify steps that would be newly BLOCKED, newly REQUIRE_APPROVAL, or newly ALLOWED
    output:
      blocked_workflows: [workflow_id, blocking_step, blocking_reason]
      approval_required_workflows: [workflow_id, step_id, approval_requirements]
      unaffected_workflows: count
  
  workflow_continuity_risk:
    CRITICAL_workflow_blocked:
      definition: a CRITICAL-priority or governance-critical workflow would be blocked
      severity: CRITICAL impact; must be resolved before policy activation
      resolution: modify policy to exempt critical workflow; OR redesign workflow; OR accept block with plan
    
    APPROVAL_SATURATION:
      definition: new policy would require approval for so many decisions that approver capacity is overwhelmed
      calculation: estimated_new_approval_requests_per_week / approver_capacity_per_week > 0.80
      severity: HIGH — approval system becomes a bottleneck
      resolution: widen policy scope (fewer decisions require approval); increase approver pool
  
  mitigation_options:
    GRANDFATHER_ACTIVE_WORKFLOWS:
      description: allow active workflows to complete under old policy; new policy applies to new workflows only
      limitation: active workflows can last weeks; delay before new policy takes full effect
    
    PHASED_ACTIVATION:
      description: activate new policy for subset of domains or action types initially
      purpose: validate behavior in limited scope before full rollout
    
    GRACE_PERIOD_ALLOW:
      description: for 48 hours after activation, log NEW_DENY decisions but allow them
      purpose: observe impact before hard enforcement
      limitation: only safe for SOFT constraints; never appropriate for HARD_DENY or CONSTITUTIONAL policies
```

---

## Coverage and Conflict Analysis

```yaml
coverage_analysis:
  obligation_coverage_check:
    purpose: does the proposed policy change create obligation coverage gaps?
    method:
      1. retrieve all obligations covered by the current policy version
      2. determine which obligations are covered by the proposed new version
      3. identify obligations that were covered by old version but NOT by new version (gaps)
      4. identify obligations that are newly covered by new version (additions)
    
    coverage_gap_severity:
      CRITICAL_obligation_gap: BLOCK policy activation; must be addressed before activation
      HIGH_obligation_gap: warn; require explicit sign-off
      MEDIUM_obligation_gap: document; include in compliance risk register
  
  conflict_detection:
    purpose: does the proposed policy conflict with other active policies?
    method:
      1. retrieve all active policies with overlapping scope (same subject, action, or resource types)
      2. identify condition expressions that could apply simultaneously to the same request
      3. determine if their effects could conflict (one ALLOWS what another DENIES for same conditions)
      4. classify conflicts by severity
    
    conflict_types:
      DIRECT_CONFLICT:
        definition: two active policies produce opposite effects (one ALLOW, one DENY) for identical conditions
        resolution: explicit conflict cannot coexist; higher-priority policy wins; document explicitly
        action: review policy priority ordering; modify one policy to eliminate conflict
      
      REDUNDANT_COVERAGE:
        definition: two policies produce identical effects for identical conditions
        action: document; consider simplification; not a blocking issue
      
      SCOPE_OVERLAP:
        definition: policies have overlapping scope but different (compatible) effects
        action: document; verify DENY_OVERRIDES combination produces intended result
```

---

## Impact Report

```yaml
impact_report:
  report_id: "IMPRPT-{analysis_id}"
  
  executive_summary:
    overall_risk: CRITICAL | HIGH | MEDIUM | LOW | MINIMAL
    activation_recommendation: APPROVE | APPROVE_WITH_CONDITIONS | REVISE_BEFORE_ACTIVATION | BLOCK
    one_paragraph_summary: string
    blocking_issues_count: int
    high_risk_issues_count: int
  
  divergence_summary:
    decisions_sampled: int
    divergence_rate: float
    high_risk_divergences: int
    estimated_weekly_decisions_affected: int
    most_significant_divergence: {type, count, example}
  
  workflow_impact_summary:
    active_workflows_affected: int
    critical_workflows_blocked: int
    new_approvals_per_week_estimated: int
    approval_saturation_risk: boolean
  
  coverage_summary:
    obligation_gaps_created: int
    obligation_gaps_detail: [{obligation_id, gap_severity}]
    obligations_newly_covered: int
  
  conflict_summary:
    direct_conflicts: int
    conflict_details: [{policy_id, conflict_type, resolution}]
  
  risk_summary:
    net_risk_impact: INCREASES | DECREASES | NEUTRAL
    risk_rationale: string
    new_risks_introduced: [string]
    risks_mitigated: [string]
  
  recommendations: [string]         # specific, actionable recommendations before activation
  conditions_for_approval: [string] # conditions under which reviewer should approve this change
  
  governance:
    analysis_completed_at: ISO-8601
    analysis_by: string              # impact-analyzer system
    reviewed_by: agent_id | human_id | null
    reviewer_conclusion: string | null
    stored_in_policy_registry: boolean
```

---

## Activation Gate

```yaml
activation_gate:
  gate_for_all_policy_changes:
    required: impact analysis must be completed before any new policy version can be staged
    exception: PATCH-only changes (documentation, metadata) bypass impact analysis
    
    blocking_conditions:
      - critical_workflow_blocked AND no_mitigation_plan
      - HARD_DENY_REMOVED without board-level review
      - CRITICAL_obligation_gap without alternative coverage
      - direct_conflict with CONSTITUTIONAL policy
  
  gate_by_policy_category:
    CONSTITUTIONAL: blocking conditions + 30-day review period + board notification
    REGULATORY_COMPLIANCE: blocking conditions + 10-day review + legal counsel
    SECURITY / AI_GOVERNANCE: blocking conditions + 7-day review
    OPERATIONAL: blocking conditions only
    DEFAULT: blocking conditions only; can activate within 24h if none found
  
  gate_output:
    CLEARED: no blocking conditions; policy may proceed to staging
    CONDITIONAL: blocking conditions resolved with documented mitigations; may proceed to staging
    BLOCKED: blocking conditions unresolved; policy cannot proceed to staging
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-registry.md` | Impact analysis stored alongside policy; blocks staging if BLOCKED |
| `policy-as-code/policy-engine.md` | Isolated engine instance evaluates proposed policy for divergence |
| `governance-policies/policy-replay-engine.md` | Historical decision replay for divergence analysis |
| `governance-policies/immutable-policy-audit.md` | Historical decisions sampled for divergence |
| `governance-policies/policy-lineage-tracker.md` | Obligation coverage verified via lineage |
| `compliance-framework/regulatory-registry.md` | Obligation metadata for coverage gap analysis |
| `orchestration-patterns/orchestration-strategy-engine.md` | Active workflow plans assessed for impact |
