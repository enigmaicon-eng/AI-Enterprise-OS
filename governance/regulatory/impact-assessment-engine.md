# Impact Assessment Engine
**ID:** RAD-IAE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Produces structured impact assessments for every regulatory change that enters the adaptation pipeline. The Impact Assessment Engine answers the questions that must be answered before any adaptation work begins: exactly which policies, controls, agents, workflows, and data operations are affected; what must change and how much; what the transition risk is; and whether a Transfer Impact Assessment (TIA) is required. Impact assessments are the mandatory gate before implementation begins — no adaptation work proceeds without a completed assessment.

---

## Impact Assessment Schema

```yaml
impact_assessment:
  assessment_id: IAS-{NNN}
  change_id: CHG-{NNN}
  assessed_at: ISO8601
  assessed_by: string                  # agent_id or "automated"
  
  change_summary:
    regulation: string
    jurisdiction: JUR-{XX}
    what_changed: string
    effective_date: ISO8601
    compliance_deadline: ISO8601
    
  scope:
    entities_affected: [ENTITY-{XX}]
    jurisdictions_affected: [JUR-{XX}]
    domains_affected: [string]
    
  policy_impact:
    policies_to_update: [{policy_id, change_description, complexity}]
    policies_to_create: [{domain, jurisdiction, rationale}]
    policies_to_deprecate: [{policy_id, reason}]
    policy_change_count: integer
    
  control_impact:
    controls_to_update: [{control_id, change_description}]
    controls_to_add: [{domain, type, rationale}]
    controls_to_retire: [{control_id, reason}]
    control_change_count: integer
    
  agent_impact:
    agents_affected_count: integer
    agent_classes_affected: [string]
    behavioral_contract_updates_required: boolean
    training_required: boolean
    
  workflow_impact:
    workflows_to_update: [{workflow_id, step_affected, change_description}]
    gate_additions_required: [{workflow_id, step_id, gate_type}]
    workflow_change_count: integer
    
  data_impact:
    data_classifications_affected: [string]
    retention_schedule_changes: boolean
    subject_rights_sla_changes: boolean
    
  transfer_mechanism_impact:
    tia_required: boolean
    tia_scope: string | null
    mechanisms_to_update: [{mechanism_id, update_description}]
    transfers_to_suspend: [{transfer_id, reason}]
    
  effort_estimation:
    complexity: TRIVIAL | SIMPLE | MODERATE | COMPLEX | ARCHITECTURAL
    estimated_days:
      policy_updates: integer
      control_updates: integer
      workflow_updates: integer
      testing_validation: integer
      legal_review: integer
      total: integer
    confidence: HIGH | MEDIUM | LOW
    
  transition_risk:
    compliance_gap_during_transition: boolean
    gap_description: string | null
    gap_duration_days_estimated: integer | null
    compensating_controls_available: boolean
    exception_required_during_transition: boolean
    
  status: DRAFT | REVIEWED | APPROVED | SUPERSEDED
  approved_by: string | null
  approved_at: ISO8601 | null
```

---

## Assessment Algorithm

```
assess_regulatory_change(change_id):

  change = load_change(change_id)
  
  # --- POLICY IMPACT ---
  directly_affected_policies = policy_catalog.find_by_regulation(change.regulatory_reference)
  indirectly_affected_policies = policy_catalog.find_by_data_class(change.affected_data_classes)
  all_affected_policies = deduplicate(directly_affected_policies + indirectly_affected_policies)
  
  policy_impact = analyze_policy_changes(all_affected_policies, change)
  
  # --- CONTROL IMPACT ---
  affected_controls = control_catalog.find_by_policies(all_affected_policies)
  control_impact = analyze_control_changes(affected_controls, change)
  
  # --- AGENT IMPACT ---
  affected_agents = agent_registry.find_by_jurisdictions(change.jurisdictions)
  affected_agent_classes = unique([a.class for a in affected_agents])
  behavioral_contracts_need_update = any_behavioral_contracts_reference(all_affected_policies)
  
  # --- WORKFLOW IMPACT ---
  affected_workflows = workflow_registry.find_by_controls(affected_controls)
  workflow_impact = analyze_workflow_changes(affected_workflows, change)
  
  # --- TRANSFER MECHANISM IMPACT ---
  tia_required = change.change_class == TRANSFER_MECHANISM_CHANGE or
                 any_new_cross_border_restrictions(change)
  transfer_impact = analyze_transfer_impact(change, tia_required)
  
  # --- EFFORT ESTIMATION ---
  effort = estimate_effort(policy_impact, control_impact, workflow_impact, transfer_impact)
  
  # --- TRANSITION RISK ---
  transition_risk = assess_transition_risk(
    change.urgency, effort.total_days, change.compliance_deadline,
    compensating_controls_available(affected_controls)
  )
  
  # --- BUILD ASSESSMENT ---
  assessment = ImpactAssessment {
    change_id, all fields computed above
  }
  
  # --- ROUTE FOR REVIEW ---
  if change.urgency == CRITICAL:
    require_review_by(Legal_Org + Architecture_Org, SLA=4_hours)
  elif change.urgency == HIGH:
    require_review_by(Governance_Org + Legal_Org, SLA=48_hours)
  else:
    require_review_by(Governance_Org, SLA=7_days)
    
  Return: assessment
```

---

## Transfer Impact Assessment (TIA)

```
conduct_tia(change_id, affected_mechanisms):

  # Required when: SCCs are being updated; adequacy is challenged; new jurisdiction added;
  #                significant enforcement action in target jurisdiction
                 
  tia = TransferImpactAssessment {
    tia_id: TIA-{NNN},
    change_id: change_id,
    
    target_jurisdictions: [jurisdiction for m in affected_mechanisms],
    
    surveillance_risk:
      # Per EU SCCs Annex III methodology
      legal_framework_assessment: assess_legal_framework(target_jurisdictions)
      # E.g., presence of mass surveillance law, adequacy of judicial redress
      surveillance_risk_score: float (0.00–1.00)
      
    supplementary_measures:
      required_if_risk_score > 0.60: true
      available_measures: [encryption, pseudonymization, purpose_limitation, minimization]
      measures_selected: []
      
    conclusion:
      transfer_can_proceed: boolean
      conditions: [string]
      review_date: ISO8601  # typically 1 year
      
    authority_required: T4 + Legal_Org
    signed_by: string
    signed_at: ISO8601
  }
  
  # TIA required before transfer mechanism is re-activated post-change
  lock_transfer_mechanism_until_tia_complete(affected_mechanisms)
  
  Return: tia
```

---

## Complexity Scoring

```yaml
complexity_scoring:
  TRIVIAL:
    definition: < 3 policy field updates; no control changes; no workflow gates added
    effort_range_days: 1–3
    review_required: Governance Org
    example: Update policy retention limit from 24 months to 18 months (single policy, single field)
    
  SIMPLE:
    definition: 3–10 policy changes; 1–3 control updates; no new controls
    effort_range_days: 3–10
    review_required: Governance Org + T3
    
  MODERATE:
    definition: 10–30 policy changes; 3–10 control updates; 1–5 new controls; < 5 workflow gate additions
    effort_range_days: 10–30
    review_required: Governance Org + Legal Org + Architecture Org
    
  COMPLEX:
    definition: > 30 policy changes; > 10 control updates; > 5 new controls; > 5 workflow changes
    effort_range_days: 30–90
    review_required: T4 + Legal Org + Architecture Org
    
  ARCHITECTURAL:
    definition: Requires topology change or new sovereign entity; or changes constitutional boundary
    effort_range_days: 90–180+
    review_required: T5 + board + external legal counsel
    example: New jurisdiction requiring new SEZ and PARTITION
```

---

## Integration

```
Feeds into:
  adaptation-workflow-orchestrator.md — approved assessments trigger adaptation workflows
  regulatory-calendar.md — deadline and effort data used for calendar planning
  policy-adaptation-engine.md — policy change list used to create policy drafts
  compliance-predictor.md — effort estimates used for deadline miss prediction

Receives from:
  regulatory-change-detector.md — change records are the primary input
  Legal Org — TIA inputs and regulatory framework assessments
  control-effectiveness-monitor.md — control availability during transition
```

---

## Governance

**Assessment is a gate:** Adaptation workflow cannot be created until impact assessment status is APPROVED; no "start-while-assessing"  
**TIA blocks transfer reactivation:** If TIA is required, the affected transfer mechanism remains suspended until TIA is complete and approved  
**ARCHITECTURAL changes require T5:** Any ARCHITECTURAL complexity assessment escalates automatically to T5 + board review; these cannot be approved by T4  
**Assessment retention:** All assessments retained permanently; they constitute regulatory evidence of due diligence  
**Audit:** All assessments to `memory/regulatory-adaptation/impact-assessments.jsonl`; TIAs to `memory/regulatory-adaptation/tias.jsonl`
