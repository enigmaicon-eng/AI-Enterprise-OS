# Policy Synthesis Engine
**ID:** RAD-PSE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Legal Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Transforms regulatory change records and impact assessments into draft compliance policies that can be immediately reviewed, approved, and deployed. The Policy Synthesis Engine bridges the gap between "we know the regulation changed" and "we have a specific policy rule set to implement." It uses a combination of regulatory text analysis, template matching, and a curated policy pattern library to produce well-structured, testable policy drafts — reducing the legal review burden by providing a strong first draft rather than a blank canvas.

---

## Synthesis Modes

```yaml
synthesis_modes:

  UPDATE_EXISTING:
    trigger: BINDING_AMENDMENT to a regulation covered by an existing policy
    process: diff the regulatory change against current policy rule set; generate targeted amendments
    output: POL-{NNN} revision with changed rules clearly marked
    human_review: Legal Org reviews diff only (not full policy)
    
  CREATE_NEW:
    trigger: BINDING_NEW_REQUIREMENT with no existing policy coverage
    process: match regulation to policy template library; instantiate + customize for jurisdiction
    output: new POL-{NNN} DRAFT with full rule set
    human_review: Legal Org reviews full policy draft
    
  DEPRECATE:
    trigger: regulation repealed; jurisdiction exited; control replaced
    process: identify dependent rules; propose deprecation + migration to replacement policy
    output: deprecation proposal with migration plan
    human_review: Governance Org approval
    
  SYNTHESIZE_FROM_ENFORCEMENT:
    trigger: ENFORCEMENT_SIGNAL with practice implications for OS
    process: extract inferred regulatory expectation from enforcement action; compare to existing policy
    output: policy gap analysis + targeted rule additions (if gap confirmed)
    human_review: Legal Org (enforcement-derived rules always reviewed by Legal)
```

---

## Policy Template Library

```yaml
policy_template_library:

  TEMPLATE_DATA_RETENTION:
    id: TPL-RET-001
    applicable_to: [DATA_PRIVACY domains]
    jurisdiction_variants: [JUR-EU, JUR-CN, JUR-US, JUR-IN, JUR-GB, JUR-SG]
    parameters: [retention_limit_days, data_classes_in_scope, legal_basis, review_cadence]
    rule_patterns:
      - condition: "record.age_days > params.retention_limit AND record.legal_hold == false"
        action: BLOCK (prevent access) + NOTIFY (deletion workflow)
        
  TEMPLATE_CONSENT_VALIDATION:
    id: TPL-CON-001
    applicable_to: [DATA_PRIVACY; consent-based processing]
    parameters: [consent_purpose, data_classes, refresh_period_days, withdrawal_mechanism]
    rule_patterns:
      - condition: "action.data_purpose NOT IN subject.active_consents"
        action: BLOCK
      - condition: "subject.consent.age_days > params.refresh_period_days"
        action: REQUIRE_REVIEW + NOTIFY (consent refresh needed)
        
  TEMPLATE_AI_PROHIBITED_USE:
    id: TPL-AIU-001
    applicable_to: [AI_GOVERNANCE; prohibited practice enforcement]
    parameters: [prohibited_use_list, jurisdiction, severity]
    rule_patterns:
      - condition: "action.intent_classification IN params.prohibited_use_list"
        action: BLOCK (unconditional; no review path)
        
  TEMPLATE_DATA_MINIMIZATION:
    id: TPL-MIN-001
    applicable_to: [DATA_PRIVACY; data minimization]
    parameters: [purpose, allowed_fields, data_class]
    rule_patterns:
      - condition: "action.accessed_fields NOT SUBSET_OF params.allowed_fields[action.purpose]"
        action: BLOCK
        
  TEMPLATE_CROSS_BORDER_TRANSFER:
    id: TPL-CBT-001
    applicable_to: [DATA_PRIVACY; cross-border operations]
    parameters: [source_jurisdiction, target_jurisdiction, allowed_mechanisms, tia_refresh_days]
    rule_patterns:
      - condition: "transfer.mechanism NOT IN params.allowed_mechanisms"
        action: BLOCK
      - condition: "transfer.tia_age_days > params.tia_refresh_days"
        action: REQUIRE_REVIEW + NOTIFY (TIA refresh required)
        
  TEMPLATE_SUBJECT_RIGHTS_SLA:
    id: TPL-SRS-001
    applicable_to: [DATA_PRIVACY; data subject rights]
    parameters: [right_type, sla_days, jurisdiction]
    rule_patterns:
      - condition: "rights_request.age_days > params.sla_days AND rights_request.status != COMPLETED"
        action: ESCALATE (SLA breach imminent) + NOTIFY (DPO/Compliance Officer)
        
  TEMPLATE_ALGORITHM_REGISTRATION:
    id: TPL-ALG-001
    applicable_to: [AI_GOVERNANCE; JUR-CN algorithm registration]
    parameters: [algorithm_types_requiring_registration]
    rule_patterns:
      - condition: "agent.algorithm_type IN params.algorithm_types AND agent.cac_registration_status != CURRENT"
        action: BLOCK deployment
```

---

## Synthesis Algorithm

```
synthesize_policy(change_id, assessment_id):

  change = load_change(change_id)
  assessment = load_assessment(assessment_id)
  
  # Step 1: Determine synthesis mode
  mode = determine_synthesis_mode(change, assessment)
  
  # Step 2: Select template (for CREATE_NEW and UPDATE_EXISTING)
  if mode in [CREATE_NEW, UPDATE_EXISTING]:
    template = select_template(
      domain=change.domains,
      jurisdiction=change.jurisdiction,
      regulation=change.regulatory_reference.regulation,
      template_library=POLICY_TEMPLATE_LIBRARY
    )
    
    if not template:
      # No matching template — generate blank structure; flag for full Legal drafting
      draft = create_blank_policy_draft(change, assessment)
      draft.synthesis_mode = MANUAL_DRAFT_REQUIRED
      alert(Legal_Org, "No template available for this change; full manual drafting required")
      Return: draft
      
  # Step 3: Extract regulatory parameters from change + RIU
  parameters = extract_regulatory_parameters(change.riu_id, template)
  # Parameters extracted via structured extraction from regulatory text
  # LLM-assisted extraction with confidence scores; low-confidence fields flagged for human review
  
  # Step 4: Instantiate policy from template
  draft_rules = instantiate_template(template, parameters, change.jurisdiction)
  
  # Step 5: Validate rule syntax and constitutional screen
  syntax_valid = validate_rule_syntax(draft_rules)  # CEL expression validation
  constitutional_result = constitutional_governor_quorum.screen_policy(draft_rules)
  
  if not syntax_valid:
    alert(Legal_Org + Governance_Org, "Synthesis produced invalid rule syntax; manual correction needed")
    
  if constitutional_result == FAIL:
    BLOCK synthesis; alert T4; log POLICY_SYNTHESIS_CONSTITUTIONAL_FAIL
    Return: BLOCKED
    
  # Step 6: Conflict detection against active policies
  conflicts = policy_adaptation_engine.detect_policy_conflict(draft_rules, active_policies)
  
  # Step 7: Build draft policy object
  draft_policy = {
    policy_id: POL-{NEW},
    version: "0.1.0-draft",
    status: DRAFT,
    scope: {jurisdictions: [change.jurisdiction], domains: change.domains},
    regulatory_basis: {regulations: [change.regulatory_reference], effective_date: change.effective_date},
    rule_set: draft_rules,
    synthesis_metadata: {
      template_id: template.id,
      parameters: parameters,
      low_confidence_fields: [field for field, conf in parameters if conf < 0.80],
      conflicts: conflicts
    }
  }
  
  Return: draft_policy
```

---

## Human Review Interface

```yaml
human_review_interface:
  review_types:
    
  LEGAL_REVIEW:
    trigger: all CREATE_NEW and SYNTHESIZE_FROM_ENFORCEMENT policies
    reviewer: Legal Org
    interface:
      - side-by-side: regulatory text | synthesized rule set
      - fields_to_confirm: all low_confidence_fields highlighted
      - conflicts_flagged: all detected conflicts listed with resolution options
      - approve_modify_reject: per rule (not just per policy)
    SLA: per change urgency (4hr CRITICAL; 48hr HIGH; 7d standard)
    
  GOVERNANCE_REVIEW:
    trigger: UPDATE_EXISTING; DEPRECATE; LOW urgency changes
    reviewer: Governance Org
    interface:
      - diff view: old rule set vs. proposed changes
      - impact summary from IAS-{NNN}
    SLA: 7 days
    
  MANDATORY_FIELDS_BEFORE_CANDIDATE:
    - regulatory_basis confirmed by Legal Org
    - all low_confidence_fields resolved
    - conflicts resolved or accepted with documented rationale
    - constitutional screen passed
```

---

## Integration

```
Feeds into:
  policy-adaptation-engine.md — synthesized drafts enter policy lifecycle as DRAFT status
  adaptation-workflow-orchestrator.md — synthesis is step 3 of adaptation workflow

Receives from:
  regulatory-change-detector.md — change records drive synthesis
  impact-assessment-engine.md — assessment scope determines which templates to apply
  regulatory-intelligence-system.md — raw regulatory text used for parameter extraction
  governance/constitutional-governor-quorum.md — pre-synthesis constitutional screen
```

---

## Governance

**No policy bypasses human review:** Every synthesized policy, regardless of automation confidence, requires human Legal or Governance review before CANDIDATE promotion  
**Template library is governed:** Adding/modifying templates requires Architecture Org + Governance Org approval; template changes are versioned  
**Constitutional screen is pre-synthesis:** Constitutional screen runs on synthesized rules before human review — prevents wasted legal review on constitutionally prohibited drafts  
**Parameter extraction transparency:** All extracted parameters are retained with confidence scores; human reviewers see exactly what the engine inferred and from where  
**Audit:** All synthesis runs to `memory/regulatory-adaptation/policy-synthesis-log.jsonl`; including constitutional screen results
