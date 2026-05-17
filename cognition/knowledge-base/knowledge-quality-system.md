# Knowledge Quality System

## Purpose
Defines how knowledge unit quality is measured, scored, monitored, and improved. Quality is the primary signal for whether a knowledge unit should be trusted, promoted, and applied. Low-quality knowledge degrades decisions; this system prevents it from accumulating.

---

## Quality Model

Four dimensions compose the knowledge quality score:

```yaml
quality_dimensions:
  completeness:
    weight: 0.25
    description: How fully the knowledge unit covers what it claims to cover
    measures:
      - required fields populated
      - body word count relative to knowledge_type norms
      - examples present (types with high applicability_score need >= 1 example)
      - counter_examples present for prescriptive knowledge types
      - structured_data fields populated for machine-readable types
  
  accuracy:
    weight: 0.35
    description: How correct the knowledge unit is; ground truth match
    measures:
      - evidence_strength (ANECDOTAL=0.3, OBSERVED=0.6, VALIDATED=0.8, PROVEN=1.0 base)
      - outcome data (positive_outcomes / (positive_outcomes + negative_outcomes))
      - validation_signals (peer review approval, steward confirmation)
      - contradiction_absence (CONTESTED state penalizes accuracy)
  
  clarity:
    weight: 0.20
    description: How readable and unambiguous the knowledge unit is
    measures:
      - summary present and >= 2 sentences
      - body uses structured markdown with headers and lists
      - technical jargon defined or linked
      - examples concrete and actionable
      - no ambiguous pronouns or undefined references
  
  applicability:
    weight: 0.20
    description: How broadly and reliably the knowledge unit applies
    measures:
      - application_count > 0 (has been applied, not just retrieved)
      - usefulness_score derived from positive/negative outcome ratio
      - tags correctly scoped (general vs. edge-case vs. specific-to)
      - counter_examples reduce false application
      - applicability_conditions defined (who, when, where to apply)
```

---

## Quality Scoring Algorithm

```yaml
quality_scoring:
  overall_quality: weighted_average(completeness, accuracy, clarity, applicability)
  
  completeness_algorithm:
    base_score: 0.0
    
    required_field_check:
      all_required_fields_present: +0.40
      partial_required_fields: proportional
    
    body_length_bonus:
      PROCESS_KNOWLEDGE:  >= 200 words: +0.20
      PATTERN_KNOWLEDGE:  >= 300 words: +0.20
      INCIDENT_KNOWLEDGE: >= 400 words: +0.20
      DOMAIN_KNOWLEDGE:   >= 300 words: +0.20
      others:             >= 150 words: +0.15
    
    examples_bonus:
      has_at_least_one_example: +0.20
      has_counter_examples: +0.10
    
    structured_data_bonus:
      structured_data populated: +0.10
    
    max_score: 1.0 (capped)
  
  accuracy_algorithm:
    base_score: evidence_strength_map[evidence_strength]
      ANECDOTAL: 0.30
      OBSERVED:  0.60
      VALIDATED: 0.80
      PROVEN:    1.00
    
    outcome_adjustment:
      if application_count >= 5:
        outcome_ratio = positive_outcomes / (positive_outcomes + negative_outcomes)
        accuracy = 0.60 * base_score + 0.40 * outcome_ratio
      else:
        accuracy = base_score  # insufficient data; use evidence_strength
    
    penalties:
      CONTESTED_state: × 0.60 multiplier
      has_invalidated_relationship: × 0.50 multiplier
      confidence < 0.50: capped at 0.60
  
  clarity_algorithm:
    base_score: 0.50
    summary_quality:
      present and >= 2 sentences: +0.20
      >= 3 sentences: +0.05
    body_structure:
      uses_headers: +0.10
      uses_lists_or_tables: +0.10
    example_quality:
      examples_with_descriptions: +0.10 (up to +0.20 for >= 2)
    readability_estimate:
      AI-scored at review time; stored as metadata
      high_readability: +0.05
  
  applicability_algorithm:
    base_score: 0.50
    usage_signals:
      if application_count >= 3:
        usefulness_score already computed
        applicability = 0.40 * base_score + 0.60 * usefulness_score
      else:
        applicability = base_score
    tag_penalty:
      has_edge-case_tag: × 0.80 (expected lower applicability)
      has_specific-to_tag: × 0.85
    counter_examples_bonus:
      has_counter_examples: +0.10 (helps avoid mis-application)
```

---

## Quality Thresholds

```yaml
quality_thresholds:
  publish_gate:
    minimum_overall: 0.50
    minimum_accuracy: 0.40
    minimum_completeness: 0.40
    behavior: blocks REVIEW → ACTIVE transition
  
  quality_tiers:
    EXEMPLARY:  overall_quality >= 0.90
    HIGH:       overall_quality >= 0.75
    ACCEPTABLE: overall_quality >= 0.50
    MARGINAL:   overall_quality >= 0.35
    POOR:       overall_quality < 0.35
  
  operational_behaviors:
    EXEMPLARY:
      - Featured in recommendation engine
      - Eligible for synthesis as authoritative source
      - Reduced review frequency (may shift QUARTERLY → ANNUALLY)
    HIGH:
      - Standard inclusion in all retrieval results
      - No restrictions
    ACCEPTABLE:
      - Included in results; no special flags
    MARGINAL:
      - Flagged in retrieval results as "limited evidence"
      - Triggers steward notification
      - NOT eligible for synthesis as authoritative source
    POOR:
      - Retrieval shows quality warning
      - Blocked from being cited in other units as authoritative evidence
      - Auto-queued for owner improvement review within 14 days
      - If not improved in 60 days: escalate to knowledge-governance-lead
```

---

## Quality Review Process

```yaml
quality_review_process:
  automated_quality_rescore:
    triggers:
      - unit updated (any version bump)
      - new application feedback received
      - outcome data added
      - new CONTRADICTS or INVALIDATES relationship added
    timing: within 5 minutes of trigger
  
  manual_quality_review:
    triggers:
      - scheduled review period reached
      - quality_tier dropped (e.g., HIGH → ACCEPTABLE)
      - dispute filed
      - owner requests
    assigned_to: quality_reviewer (domain steward or delegated agent)
  
  quality_review_checklist:
    - [ ] Summary accurately represents body content?
    - [ ] Body content still accurate? (verify with sources)
    - [ ] Examples still valid and representative?
    - [ ] Counter-examples still appropriate?
    - [ ] Structured data still accurate and complete?
    - [ ] Tags still accurate?
    - [ ] Confidence level appropriately calibrated?
    - [ ] Evidence_strength still correct?
    - [ ] Any new contradicting knowledge to link?
    - [ ] Overall quality assessment matches scoring?
  
  quality_reviewer_record:
    reviewed_at: ISO-8601
    reviewed_by: agent-id
    quality_assessment: {completeness, accuracy, clarity, applicability}  # human estimates
    notes: string
    action_taken: NO_CHANGE | MINOR_EDIT | IMPROVEMENT_REQUESTED | ESCALATE_DISPUTE
```

---

## Quality Improvement Workflows

```yaml
quality_improvement:
  poor_quality_workflow:
    trigger: overall_quality < 0.35
    step_1: notify_owner with specific dimension scores and improvement guidance
    step_2: if_not_improved_in_14d: notify steward
    step_3: if_not_improved_in_30d: knowledge-governance-lead review
    step_4: if_not_improved_in_60d: candidate for DEPRECATION or ARCHIVED
  
  improvement_guidance_generator:
    low_completeness:
      - "Add concrete examples with artifact references"
      - "Populate structured_data fields for machine readability"
      - "Expand body content to cover preconditions and postconditions"
    low_accuracy:
      - "Upgrade evidence_strength by validating against additional cases"
      - "Add outcome tracking to application instances"
      - "Resolve any active CONTESTED status"
    low_clarity:
      - "Add a structured summary with 2–5 clear sentences"
      - "Break body into sections with headers"
      - "Replace vague terms with specific references"
    low_applicability:
      - "Add counter-examples showing when NOT to apply"
      - "Define applicability_conditions in structured_data"
      - "Collect application feedback from agents using this knowledge"
  
  quality_improvement_history:
    tracks: all quality score changes over time
    stored_in: version_archive alongside content versions
    use_case: trend analysis, reviewer calibration
```

---

## Organizational Quality Health

```yaml
quality_health_metrics:
  portfolio_health:
    exemplary_rate: count(EXEMPLARY) / count(ACTIVE)          # target: > 0.20
    poor_quality_rate: count(POOR) / count(ACTIVE)            # target: < 0.05
    avg_overall_quality: mean(overall_quality) for ACTIVE units # target: > 0.70
    quality_by_domain: breakdown per domain
    quality_by_knowledge_type: breakdown per type
  
  review_health:
    pending_quality_reviews: count                            # target: < 10% of ACTIVE
    overdue_quality_reviews: count                            # target: 0
    poor_units_without_improvement_plan: count               # target: 0
  
  accuracy_health:
    contested_rate: count(CONTESTED) / count(ACTIVE)          # target: < 0.02
    negative_outcome_rate: sum(negative_outcomes) / sum(application_count)  # target: < 0.10
    evidence_strength_distribution:
      PROVEN:    target > 0.15
      VALIDATED: target > 0.40
      OBSERVED:  target > 0.30
      ANECDOTAL: target < 0.15
  
  reporting:
    cadence: daily to knowledge-operations-dashboard
    weekly_digest: quality_health_metrics to knowledge-governance-lead
    trend_alerts:
      avg_quality_drops_below: 0.65 → alert to governance-lead
      poor_quality_rate_above: 0.10 → alert to governance-lead
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-model.md` | Quality field definitions |
| `knowledge-base/knowledge-lifecycle.md` | Quality gates at lifecycle transitions |
| `knowledge-base/knowledge-repository.md` | Quality score storage and indexing |
| `knowledge-governance/knowledge-accuracy-monitor.md` | Extended accuracy monitoring |
| `knowledge-governance/knowledge-operations-dashboard.md` | Quality health dashboard |
| `knowledge-retrieval/semantic-search-engine.md` | Quality as retrieval ranking signal |
| `knowledge-capture/workflow-knowledge-extraction.md` | Initial quality scoring at capture |
