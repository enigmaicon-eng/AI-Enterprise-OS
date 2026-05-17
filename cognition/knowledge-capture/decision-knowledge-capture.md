# Decision Knowledge Capture

## Purpose
Captures the rationale, criteria, context, and outcomes of significant decisions made by humans and AI agents throughout the enterprise. Decisions are the highest-value knowledge artifacts — they encode judgment that would otherwise be lost. This system ensures every significant decision becomes organizational memory.

---

## What Constitutes a Capturable Decision

```yaml
decision_capture_triggers:
  tier_1_automatic:
    description: Always captured; no threshold
    includes:
      - All Tier-3+ governance approvals
      - All constitutional evaluations
      - All policy exception grants or denials
      - All override authorizations
      - All RFC decisions
      - All architectural decisions (ADRs)
      - All incident severity classifications
  
  tier_2_threshold_based:
    description: Captured if above materiality threshold
    includes:
      - Agent routing decisions with blast_radius > 10
      - Budget or resource allocation decisions > defined threshold
      - Vendor or integration selection decisions
      - Risk acceptance decisions
      - Scope change decisions on active projects
    threshold: organization-specific; default: impact_score > 0.60
  
  tier_3_voluntary:
    description: Human or agent may optionally flag for capture
    includes:
      - Novel situations without precedent
      - Decisions with significant ambiguity resolved
      - Decisions that reversed a prior pattern
      - Decisions expected to recur (should become policy)
  
  excluded:
    - Routine automation decisions (no human judgment involved)
    - Decisions with blast_radius = 0 (local, reversible, trivial)
    - Duplicate of a pattern already well-documented
```

---

## Decision Capture Schema

```yaml
decision_capture_record:
  # Identity
  capture_id: "DC-uuid"
  decision_title: string               # concise statement of what was decided
  decision_type: APPROVAL | POLICY | ROUTING | ARCHITECTURAL | RISK | SCOPE | STRATEGIC | INCIDENT
  
  # Context
  decision_context:
    workflow_instance_id: string | null
    case_id: string | null
    trigger_event: string               # what prompted this decision
    stakeholders: [agent-id]            # who was involved
    deadline_pressure: none | soft | hard
    prior_decisions_referenced: [capture_id]
    constraints_active: [string]        # policies, rules, capacity limits in effect
  
  # The Decision
  decision:
    outcome: string                     # the actual decision made
    outcome_structured: {}              # machine-readable form
    deciding_authority: agent-id
    authority_tier: int                 # 1–5
    decided_at: ISO-8601
    decision_method: UNILATERAL | DELEGATED | CONSENSUS | MAJORITY | AI_RECOMMENDED_HUMAN_CONFIRMED
  
  # Rationale
  rationale:
    primary_reason: string
    supporting_reasons: [string]
    alternatives_considered: [{option, rejected_reason}]
    risk_accepted: string | null
    trade_offs: string | null
    evidence_cited: [unit_id | ref_id]  # knowledge units or other references used
  
  # AI Analysis (if AI-assisted)
  ai_analysis:
    model_recommendation: string | null
    model_confidence: 0.0–1.0 | null
    recommendation_accepted: boolean | null
    divergence_from_recommendation: string | null
  
  # Outcome Tracking
  outcomes:
    immediate_outcome: string | null
    measured_at: ISO-8601 | null
    outcome_assessment: POSITIVE | NEGATIVE | NEUTRAL | UNKNOWN
    outcome_notes: string | null
    follow_up_required: boolean
    follow_up_by: ISO-8601 | null
```

---

## Capture Methods

```yaml
capture_methods:
  method_1_automatic_from_approval_workflow:
    trigger: approval_workflow_engine.decision_signed event
    data_source: approval workflow record + context package
    completeness: MEDIUM (rationale may be sparse)
    auto_ku_type: DECISION_KNOWLEDGE
    confidence_initial: 0.70
  
  method_2_automatic_from_constitutional_evaluation:
    trigger: constitutional evaluation completed
    data_source: constitutional review record + evaluator notes
    completeness: HIGH (structured review format)
    auto_ku_type: POLICY_KNOWLEDGE (if novel interpretation)
    confidence_initial: 0.85
  
  method_3_inline_decision_annotation:
    trigger: agent or human annotates a decision inline during workflow
    mechanism: structured annotation form embedded in review interface
    data_source: annotation form submission
    completeness: VARIABLE (depends on annotator quality)
    auto_ku_type: determined by decision_type field
    confidence_initial: 0.75
  
  method_4_post_hoc_interview:
    trigger: knowledge-steward initiates for high-impact decisions
    mechanism: structured elicitation session (see expert-knowledge-elicitation.md)
    data_source: elicitation session transcript + synthesis
    completeness: HIGH
    auto_ku_type: DECISION_KNOWLEDGE or CONTEXT_KNOWLEDGE
    confidence_initial: 0.80
  
  method_5_adr_capture:
    trigger: architectural decision record (ADR) filed
    mechanism: ADR template → KU converter
    data_source: ADR document
    completeness: HIGH (ADR format is rich)
    auto_ku_type: DECISION_KNOWLEDGE with TECHNICAL secondary domain
    confidence_initial: 0.85
```

---

## Decision Pattern Detection

Across captured decisions, identify patterns for pattern knowledge units:

```yaml
decision_pattern_detection:
  run_frequency: weekly
  
  algorithms:
    recurring_decision_type:
      method: cluster captured decisions by decision_type + context similarity
      threshold: >= 5 similar decisions in 30 days
      output: PATTERN_KNOWLEDGE draft with common pattern structure
    
    consistent_criterion_usage:
      method: extract criteria from rationale fields across decisions
      threshold: same criterion cited in >= 60% of similar decisions
      output: DECISION_KNOWLEDGE draft specifying the criterion
    
    outcome_pattern:
      method: group decisions by outcome_assessment
      threshold: same decision_type + negative outcome >= 3 times
      output: INCIDENT_KNOWLEDGE draft flagging problematic pattern
    
    alternative_selection_pattern:
      method: analyze alternatives_considered across decisions
      threshold: same alternative rejected >= 5 times with similar reasoning
      output: DECISION_KNOWLEDGE draft documenting why this alternative is typically rejected
  
  pattern_validation:
    all_patterns: queued for human review before publishing
    assigned_to: domain steward for the decision_type domain
```

---

## Decision Knowledge Quality Controls

```yaml
decision_quality_controls:
  rationale_completeness_check:
    requires:
      - primary_reason: non-empty, >= 20 words
      - at_least_1_alternative_considered: enforced for Tier-3+ decisions
      - evidence_cited: at_least_1 reference for POLICY decisions
    
    on_rationale_too_sparse:
      action: REQUEST_AUGMENTATION from deciding_authority
      sla: 5 business days
      on_no_response: mark_as ANECDOTAL evidence; flag for governance review
  
  outcome_tracking:
    requires_follow_up_within:
      APPROVAL: 30 days (check if approved item was implemented correctly)
      ARCHITECTURAL: 90 days (check if decision proved correct in practice)
      RISK_ACCEPTANCE: 30 days (check if risk materialized)
    
    outcome_collector: knowledge-accuracy-monitor (automated polling)
    on_negative_outcome: trigger review of associated DECISION_KNOWLEDGE unit
  
  precedent_eligibility:
    a_decision_becomes_a_precedent_when:
      - outcome_assessment: POSITIVE
      - decision_type: APPROVAL or POLICY
      - deciding_authority_tier: >= 3
      - similar_future_decisions_likely: true (manual flag by reviewer)
    
    precedent_registration:
      registers_in: policy-exception-routing.md precedent registry
      applicability_conditions: CEL expression generated from decision context
```

---

## Integration Points

| System | Role |
|---|---|
| `approval-operations/approval-workflow-engine.md` | Primary capture trigger |
| `approval-operations/collaborative-decision-system.md` | AI analysis fields |
| `decision-models/decision-audit-trail.md` | Raw decision records (source) |
| `knowledge-base/knowledge-model.md` | Target KU schema |
| `knowledge-base/knowledge-repository.md` | Capture record storage |
| `governance-queues/policy-exception-routing.md` | Precedent registry |
| `knowledge-capture/pattern-recognition-engine.md` | Pattern detection from captures |
