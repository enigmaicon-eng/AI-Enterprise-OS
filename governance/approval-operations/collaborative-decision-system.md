# Collaborative Decision System

## Purpose
Powers the human-AI collaboration layer within approval workflows. When a human reviewer opens a review item, this system provides intelligent decision support — analysis, recommendations, risk highlighting, similar precedent retrieval, and real-time policy checking — while preserving human authority and accountability for all final decisions.

---

## Collaboration Architecture

```
Review Item Opens
    ↓
[Context Assembly (parallel)]
    ├── AI Pre-Analysis Agent
    ├── Precedent Retrieval Engine
    ├── Policy Compliance Checker
    ├── Constitutional Pre-Check (async)
    ├── Risk Analyzer
    └── Stakeholder Impact Assessor
    ↓
[Context Delivery] → Review Interface (review-interface-standards.md)
    ↓
[Human Reviews with AI Assistance]
    ↓
[Decision Submission]
    ├── Quality Gate (rationale quality check)
    ├── AI Validation (does decision seem inconsistent with analysis?)
    └── Decision Recording
    ↓
[Learning Loop]
    ├── Outcome tracking
    ├── Model feedback
    └── Trust calibration update
```

---

## AI Pre-Analysis

Runs before reviewer opens the item; cached so first screen load is immediate:

```yaml
ai_pre_analysis:
  inputs:
    subject: approval_request.subject
    context_package: assembled context
    history: similar past decisions
    current_policies: applicable policies
    governance_state: real-time governance oracle snapshot
  
  outputs:
    situation_summary:
      format: 2–4 sentences
      requirement: plain language; no jargon; specific to this item
    
    key_findings:
      format: bullet list (3–7 items)
      requirement: findings must be supported by specific evidence
      each_item: {finding, evidence_ref, confidence}
    
    risk_assessment:
      identified_risks: [{risk, severity, mitigating_factors}]
      overall_risk_level: LOW | MEDIUM | HIGH | CRITICAL
      primary_risk_reason: string
    
    recommendation:
      action: APPROVE | APPROVE_WITH_CONDITIONS | REJECT | REQUEST_INFO | ESCALATE
      recommended_conditions: [string] (if APPROVE_WITH_CONDITIONS)
      recommended_info_requests: [string] (if REQUEST_INFO)
      recommendation_confidence: float
      recommendation_reasoning: string (why this recommendation)
    
    flags:
      constitutional_concerns: [concern-description] | []
      policy_gaps: [gap-description] | []
      unusual_aspects: [what's different about this case] | []
    
    generation_metadata:
      generated_at: ISO-8601
      generating_agent_id: string
      generation_time_ms: integer
      model_used: string
      confidence: float
```

---

## Precedent Retrieval Engine

Finds decisions that are meaningfully similar to support consistent governance:

```yaml
precedent_retrieval:
  similarity_dimensions:
    subject_type_match: exact match = 1.0, related = 0.5
    risk_level_match: same = 1.0, adjacent = 0.5
    policy_overlap: fraction of same policies applicable
    org_context_match: same org = 1.0, same domain = 0.5
    outcome_type: approved | rejected | conditional
  
  retrieval_algorithm:
    initial_filter: subject.type + risk_level must match
    ranking: weighted similarity score
    limit: 5 most similar
    recency_weight: decisions from last 90d weighted 2× vs older
  
  precedent_display:
    per_precedent:
      title: string
      decided_at: relative time ("3 months ago")
      decided_by_tier: Tier-N (not individual name)
      outcome: APPROVED | REJECTED | CONDITIONAL
      outcome_notes: 1 sentence from rationale
      outcome_quality: follow-up data if available ("was later successful/problematic")
      similarity_score: float
    
    consistency_signal:
      all_same_outcome: "5 similar cases all resulted in [outcome]"
      mixed_outcomes: "Similar cases split [X approved, Y rejected] — review rationales"
      no_precedent: "No closely similar cases found — this may be novel"
```

---

## Real-Time Policy Compliance Check

```yaml
policy_compliance_check:
  runs_on:
    trigger: approval item submitted
    refresh: if significant context change during review
  
  checks:
    applicable_policies: policy-routing-engine.get_applicable(subject)
    policy_evaluation:
      for each policy:
        evaluate: does subject comply, conflict, or require exception?
        result: COMPLIANT | PARTIAL | NON_COMPLIANT | EXCEPTION_REQUIRED | UNCLEAR
    
    aggregated_result:
      all_compliant: GREEN indicator
      any_partial: YELLOW indicator + specific partial items shown
      any_non_compliant: RED indicator + specific violations shown
      any_unclear: GREY indicator + guidance for reviewer
  
  policy_citation:
    specific_policy_clauses: highlighted in review interface
    interpretation_notes: any known interpretations of ambiguous clauses
    active_waivers: if any waivers apply to this item
```

---

## Inconsistency Detection

If reviewer's decision appears inconsistent with AI analysis, flag before submission:

```yaml
inconsistency_detection:
  triggers:
    - AI recommends APPROVE with high confidence (>0.85) but reviewer selects REJECT
    - AI recommends REJECT with high confidence but reviewer selects APPROVE
    - Rationale contradicts AI-identified key finding
    - Decision inconsistent with 4+ precedents suggesting different outcome
  
  response:
    display: "Your decision differs from AI analysis and/or similar precedents. This is fine — your judgment is authoritative. Consider noting in your rationale why this case differs."
    not_blocking: reviewer can always proceed
    requires_acknowledgment: true for high-confidence AI discordance
    
    specific_display:
      show: AI recommendation + confidence
      show: most relevant precedent suggesting different outcome
      ask: "What distinguishes this case?" (optional free text)
  
  logging:
    human_ai_discordance_logged: true
    outcome_tracked: for learning loop
    high_discordance_rate_per_reviewer: flag for review quality audit
```

---

## Learning Loop

Every approved and rejected item feeds model improvement:

```yaml
learning_loop:
  data_captured:
    - decision_outcome
    - ai_recommendation_vs_human_decision
    - reviewer_rationale
    - any_discordance_acknowledgment
    - post_decision_outcome (was the decision correct? tracked after 30/90 days)
  
  feedback_signals:
    accurate_ai_recommendation:
      condition: AI rec matches human decision AND decision had good outcome
      action: reinforce AI analysis patterns for this subject type
    
    inaccurate_ai_recommendation:
      condition: AI rec contradicted human decision AND human was right
      action: flag patterns in AI analysis for tuning
      notify: AI analysis agent team for model review
    
    poor_human_decision:
      condition: human decision had negative outcome (tracked)
      action: review what context AI had; could better framing have helped?
  
  privacy:
    individual_reviewer_data: aggregated only; no individual profiling for improvement
    attribution: outcomes attributed to decision type + context, not to reviewers
  
  improvement_cadence:
    feedback_aggregation: weekly
    model_updates: monthly (requires Tier-3 approval for significant changes)
    threshold_recalibration: quarterly
```

---

## AI Assistance Quality Controls

```yaml
quality_controls:
  hallucination_prevention:
    all_findings_must_cite_evidence: true
    evidence_refs: point to specific documents, policies, or data in context package
    uncited_claims: flagged with "UNVERIFIED" indicator
  
  confidence_calibration:
    ai_must_report_uncertainty: required
    calibration_tracked: stated confidence vs actual accuracy
    miscalibrated_models: flagged for retraining
  
  bias_monitoring:
    org_bias: does AI systematically recommend differently for certain orgs?
    submitter_bias: does AI analysis differ by submitter trust tier?
    type_bias: does AI perform differently on certain subject types?
    monitoring_frequency: monthly bias audit
  
  reviewer_over_reliance:
    detection: if reviewer never deviates from AI recommendation (100% concordance over 30d)
    action: flag for review quality audit; may indicate rubber-stamping
    intervention: prompt reviewer with "What's your independent assessment?"
```
