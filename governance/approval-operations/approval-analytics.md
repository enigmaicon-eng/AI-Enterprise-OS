# Approval Analytics

## Purpose
Provides deep analytical insight into approval patterns, decision quality, reviewer performance, and governance effectiveness. Analytics inform process improvement, identify systemic issues, and help governance leads maintain a healthy and efficient approval ecosystem.

---

## Analytics Domains

```yaml
analytics_domains:
  decision_patterns:      # what decisions are being made and how
  reviewer_performance:   # how individual and pool reviewers are performing
  submission_patterns:    # what's being submitted for approval and by whom
  outcome_quality:        # whether decisions are leading to good outcomes
  ai_assistance_impact:   # how AI assistance affects decision quality and speed
  governance_effectiveness: # how well the governance system is achieving its goals
```

---

## Decision Pattern Analytics

```yaml
decision_patterns:
  approval_rates:
    overall: approved / (approved + rejected)
    by_tier: breakdown by approver tier
    by_org: breakdown by subject org
    by_risk_level: breakdown by risk classification
    by_subject_type: breakdown by approval type
    trend: week-over-week, month-over-month
    
    interpretation_signals:
      very_high_approval_rate (> 95%):
        possible_causes: [governance too permissive, items pre-vetted too well, rubber-stamping]
        investigation: sample rejected rationales; interview reviewers
      very_low_approval_rate (< 50%):
        possible_causes: [governance too restrictive, poor submission quality, unclear standards]
        investigation: analyze rejection patterns; submitter guidance needed
  
  condition_attachment_rate:
    metric: % approvals with conditions attached
    by_tier, by_subject_type
    trend: increasing = governance becoming more nuanced
    follow_up: % conditions later fulfilled
  
  decision_consistency:
    metric: variance in outcomes for similar submissions
    high_variance: inconsistent governance; unclear standards
    measurement: cluster similar items; compute approval rate variance within clusters
    alert_threshold: approval rate variance > 30% for similar item cluster
  
  time_of_day_patterns:
    decisions_by_hour: heatmap
    quality_by_hour: does decision quality drop at end of workday?
    after_hours_decisions: special audit for off-hours approvals
  
  escalation_patterns:
    escalation_rate: % items escalated from each tier
    escalation_reason_distribution: [SLA_BREACH, AUTHORITY_EXCEEDED, CONFLICT_OF_INTEREST, ...]
    escalation_resolution_rate: % escalations that resolve at the next tier
```

---

## Reviewer Performance Analytics

```yaml
reviewer_performance:
  individual_metrics:
    per_reviewer:
      decisions_made: count (last 30d/90d)
      avg_decision_time_ms: per item type
      sla_compliance_rate: % decisions within SLA
      approval_rate: vs peer average (flag significant deviations)
      rationale_quality_score: AI-assessed quality of rationales
      ai_concordance_rate: % decisions matching AI recommendation
      override_rate: % of decisions where reviewer overrode AI (healthy range: 10–30%)
      outcome_quality_score: based on post-decision outcome tracking
  
  reviewer_quality_signals:
    rubber_stamping:
      signal: ai_concordance_rate > 95% AND avg_decision_time < PT5M
      interpretation: reviewer may not be independently evaluating
      action: quality audit + 1:1 with governance lead
    
    excessive_disagreement:
      signal: ai_concordance_rate < 40% consistently
      interpretation: either reviewer has superior domain expertise OR is systematically biased
      investigation: compare reviewer outcomes vs AI outcomes (who was right more?)
    
    rationale_quality_degradation:
      signal: rationale_quality_score dropping week-over-week
      interpretation: reviewer fatigue or disengagement
      action: load reduction + quality coaching
    
    high_reversal_rate:
      signal: > 10% of reviewer's decisions later overturned
      interpretation: poor judgment or insufficient information at time of decision
      action: enhanced AI assistance + peer review for this reviewer
  
  pool_performance:
    tier_throughput_comparison: decisions per reviewer per day by tier
    specialization_effectiveness: do specialist reviewers have better outcomes?
    coverage_gaps: time windows with insufficient reviewers
```

---

## Submission Pattern Analytics

```yaml
submission_patterns:
  volume_analysis:
    submissions_per_day: time series
    submissions_by_org: breakdown
    submissions_by_submitter: individual patterns
    submissions_by_type: what kinds of approvals are most common
  
  submission_quality:
    first_pass_approval_rate_by_submitter:
      high_rate: submitter understands governance requirements
      low_rate: submitter may need guidance or training
    
    rejection_reasons_by_submitter:
      pattern: if same submitter gets same rejection reason repeatedly
      action: targeted guidance for that submitter
    
    completeness_score_at_submission:
      metric: % of required fields filled at submission
      low_completeness: correlated with longer review times and more NEEDS_INFO
  
  submitter_learning_curve:
    new_submitters: first 90 days; higher support + tracking
    experienced_submitters: after 90 days; fast-track if high quality track record
    quality_trajectory: improving, stable, or declining
```

---

## Outcome Quality Analytics

```yaml
outcome_quality:
  decision_reversal_tracking:
    what_tracked: decisions later overturned, modified, or regretted
    data_sources:
      - explicit reversal: new approval request to undo prior decision
      - incident_correlation: was this decision a factor in a later incident?
      - condition_failure: condition set in approval was not achievable
    
    reversal_rate: % of decisions reversed within 30d/90d/1y
    target: < 5% reversal rate
    high_reversal_rate: indicates decision quality problem
  
  condition_fulfillment_rate:
    metric: % of conditions from APPROVED_WITH_CONDITIONS that were fulfilled
    target: > 90% fulfillment
    unfulfilled_patterns: which condition types are consistently unfulfilled
    action_on_unfulfilled: retrospective review; may need to reject rather than condition
  
  post_approval_incident_correlation:
    question: do approved actions correlate with downstream incidents?
    methodology: compare incidents in 30d window; trace back to approvals
    finding: approvals in incident causal chain → retroactive review quality
    finding: low correlation = approvals are protective (rejecting harmful things)
  
  override_outcome_tracking:
    metric: % of override-enabled actions that had negative outcomes
    target: < 10% negative outcomes for overridden decisions
    high_negative_rate: override authority thresholds may be too low
```

---

## AI Assistance Impact Analytics

```yaml
ai_assistance_impact:
  speed_impact:
    avg_review_time: items with AI assistance vs without
    expected: 20–30% faster with AI assistance
    no_improvement: AI analysis may not be useful; review quality
  
  accuracy_impact:
    reversal_rate: items reviewed with AI assistance vs without
    hypothesis: AI assistance should reduce reversal rate
    measurement: track reversal rates by whether AI analysis was available
  
  recommendation_accuracy:
    AI_correct_rate: % times AI recommendation matched optimal human decision
    by_subject_type: AI better at some types than others
    by_confidence_score: does stated confidence correlate with accuracy?
    calibration_curve: plot stated confidence vs actual accuracy
  
  reviewer_learning_effect:
    hypothesis: reviewers who use AI analysis become better reviewers over time
    measurement: decision quality trend for high-AI-usage reviewers vs low
    finding: if true, expand AI assistance; if false, investigate why
```

---

## Governance Effectiveness Metrics

```yaml
governance_effectiveness:
  protection_rate:
    definition: % of harmful actions blocked before execution
    measurement: |
      retrospective analysis: of actions that went to approval,
      what % that were rejected would have caused harm if approved?
    requires: outcome tracking + incident correlation
    target: > 80% of rejected items would have been harmful
  
  false_rejection_rate:
    definition: % of rejected actions that were actually fine
    measurement: |
      retrospective analysis: of rejected items that were re-submitted
      and approved, what fraction were eventually successful?
    target: < 15%
    high_false_rejection: governance too conservative; process cost
  
  governance_overhead:
    definition: time and effort added by governance process
    measurement: |
      for approved items: total time in queue / workflow execution time
    healthy_range: 10–30% overhead for significant decisions
    too_high: governance is a bottleneck
    too_low: may indicate rubber-stamping (insufficient review)
  
  constitutional_effectiveness:
    constitutional_violations_blocked: count
    constitutional_violations_missed_and_later_discovered: count
    miss_rate: missed / (blocked + missed)
    target: miss_rate < 2%
```

---

## Analytics Reporting Schedule

```yaml
reports:
  DAILY_DIGEST:
    content: [volume, SLA compliance, approval rate, alert summary]
    recipients: governance-lead, delivery-lead
    format: email summary
  
  WEEKLY_PERFORMANCE_REPORT:
    content: [reviewer performance, decision patterns, quality metrics, AI assistance impact]
    recipients: governance-lead, org-leads, delivery-lead
    format: dashboard + email
  
  MONTHLY_ANALYTICS_REVIEW:
    content: [all metrics with trend analysis, anomaly investigation, recommendations]
    recipients: governance-lead, executive-sponsor, all org-leads
    format: formal report (PDF)
    includes: recommended changes to thresholds, policies, reviewer pools
  
  QUARTERLY_GOVERNANCE_HEALTH:
    content: [outcome quality, protection rate, false rejection rate, governance overhead]
    recipients: board, executive-sponsor, governance-lead
    format: executive summary + detailed appendix
```
