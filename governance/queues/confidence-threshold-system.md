# Confidence Threshold System

## Purpose
Defines the confidence thresholds that determine when AI agent outputs require human review. Every AI-generated decision, recommendation, artifact, or routing choice carries a confidence score. This system governs what happens at each confidence level — from fully autonomous to mandatory human review.

---

## Confidence Score Model

Confidence scores are produced by AI agents for all outputs. A confidence score represents the agent's self-assessed certainty that its output is correct, appropriate, and within its competence.

```yaml
confidence_score:
  value: 0.0–1.0
  dimensions:
    factual_accuracy: 0.0–1.0    # how certain the agent is the facts are correct
    policy_compliance: 0.0–1.0   # how certain the output follows applicable policies
    scope_appropriateness: 0.0–1.0  # how certain the task is within agent's competence
    completeness: 0.0–1.0        # how certain the output is complete
    constitutional_safety: 0.0–1.0  # how certain no constitutional issues exist
  
  aggregation:
    method: weighted_minimum     # minimum weighted across dimensions
    weights:
      factual_accuracy: 0.25
      policy_compliance: 0.30    # highest weight
      scope_appropriateness: 0.20
      completeness: 0.15
      constitutional_safety: 0.10
    
    hard_floor:
      # If constitutional_safety < 0.70, overall confidence capped at 0.50
      # This forces human review of anything with constitutional uncertainty
      condition: constitutional_safety < 0.70
      action: cap_overall_at(0.50)
```

---

## Threshold Zones

```yaml
threshold_zones:
  AUTONOMOUS:
    range: [0.90, 1.0]
    description: Agent proceeds without human review
    conditions:
      - task is within agent's proven competence domain
      - output type is STANDARD or below (not GOVERNANCE, not CONSTITUTIONAL)
      - no active policy exceptions apply
    monitoring: sampled at 10% for quality assurance
    override: human can always request review even in autonomous zone
  
  ASSISTED_AUTONOMOUS:
    range: [0.80, 0.90)
    description: Agent proceeds; AI analysis surfaced to relevant human asynchronously
    conditions:
      - human notified but does not need to act unless they want to
      - 24-hour review window: human can call back if concerned
      - not applicable to GOVERNANCE or CONSTITUTIONAL outputs
    monitoring: sampled at 25%
  
  SOFT_REVIEW:
    range: [0.70, 0.80)
    description: Human review recommended; AI proceeds in parallel (optimistic execution)
    behavior:
      - work is done speculatively by AI
      - human review initiated concurrently
      - if human approves: work committed
      - if human rejects: work rolled back via compensation
    sla: human must decide within defined window or work auto-reverted
    tier_required: 1
  
  REQUIRED_REVIEW:
    range: [0.60, 0.70)
    description: Human review mandatory before AI proceeds
    behavior:
      - AI halts at decision/output point
      - human review request submitted to approval queue
      - execution resumes only after human decision
    tier_required: 2
  
  EXPERT_REVIEW:
    range: [0.40, 0.60)
    description: Low-confidence output requires expert review
    behavior:
      - route to domain expert (expertise_match assignment)
      - AI analysis flagged as "LOW CONFIDENCE — verify carefully"
      - AI output quarantined until reviewed
    tier_required: 3
    additional: parallel constitutional pre-check triggered
  
  REJECT_AND_FLAG:
    range: [0.0, 0.40)
    description: Confidence too low to use the output
    behavior:
      - output rejected automatically
      - exception item created in exception-review-queue.md
      - CONFIDENCE_THRESHOLD_BREACH exception category
      - human reviews whether to accept with expert review OR discard
    tier_required: 3
    agent_notification: agent informed output was rejected for low confidence
```

---

## Domain-Specific Thresholds

Different domains require stricter thresholds:

```yaml
domain_overrides:
  # Stricter thresholds for sensitive domains
  constitutional_evaluation:
    AUTONOMOUS: >= 0.97          # very high bar for autonomous constitutional assessment
    ASSISTED_AUTONOMOUS: >= 0.90
    SOFT_REVIEW: >= 0.85
    REQUIRED_REVIEW: >= 0.75
    EXPERT_REVIEW: >= 0.60
    REJECT_AND_FLAG: < 0.60
  
  financial_decision:
    AUTONOMOUS: >= 0.95
    ASSISTED_AUTONOMOUS: >= 0.88
    SOFT_REVIEW: >= 0.80
    REQUIRED_REVIEW: >= 0.70
    EXPERT_REVIEW: >= 0.50
    REJECT_AND_FLAG: < 0.50
  
  security_assessment:
    AUTONOMOUS: >= 0.93
    ASSISTED_AUTONOMOUS: >= 0.85
    REQUIRED_REVIEW: >= 0.70   # no SOFT_REVIEW for security
    EXPERT_REVIEW: >= 0.50
    REJECT_AND_FLAG: < 0.50
  
  general_workflow:
    # Default thresholds as defined in main threshold_zones
    use_defaults: true
  
  creative_content:
    AUTONOMOUS: >= 0.75          # lower bar — creativity has inherent uncertainty
    REQUIRED_REVIEW: >= 0.50
    REJECT_AND_FLAG: < 0.30
```

---

## Threshold Calibration

Thresholds are calibrated continuously based on outcome data:

```yaml
calibration_system:
  inputs:
    - human_override_rate_per_zone: if humans override > 20% in AUTONOMOUS zone, threshold too low
    - false_positive_rate: exception items dismissed as false positive → threshold may be too strict
    - outcome_quality_by_zone: quality of decisions made in each zone
    - agent_capability_drift: agent performance changes over time
  
  calibration_algorithm:
    run_frequency: weekly
    minimum_sample_size: 50 decisions per zone per domain
    
    adjustment_rules:
      human_override_rate > 0.20 in AUTONOMOUS zone:
        action: raise AUTONOMOUS lower bound by 0.02
      
      false_positive_rate > 0.30 in REQUIRED_REVIEW zone:
        action: lower REQUIRED_REVIEW lower bound by 0.02 (fewer false flags)
      
      outcome_quality_below_target in SOFT_REVIEW zone:
        action: raise SOFT_REVIEW to REQUIRED_REVIEW (don't allow optimistic execution)
  
  approval_required: Tier-3 must approve threshold changes
  change_log: all calibration changes recorded with before/after and evidence
  notification: affected agents notified of threshold changes
```

---

## Agent Confidence Reporting Requirements

All AI agents producing outputs must report confidence:

```yaml
confidence_reporting:
  required_for:
    - all DECISION outputs
    - all RECOMMENDATION outputs
    - all ARTIFACT generation
    - all ROUTING decisions
    - all ANALYSIS outputs
  
  format:
    minimum: {overall: float}
    preferred: {overall: float, dimensions: {dim: float}, reasoning: string}
    
  prohibited:
    - reporting 1.0 for any output (perfect confidence is epistemically invalid)
    - reporting same confidence for all outputs (sign of non-functional confidence reporting)
    - not reporting confidence (treated as confidence = 0.0 → REJECT_AND_FLAG)
  
  quality_checks:
    variance_check: agent must show variance in confidence across different outputs
    calibration_check: agent's stated confidence must correlate with actual outcome quality
    on_miscalibration: confidence scores penalized in routing until recalibrated
```

---

## Integration Points

| System | Role |
|---|---|
| `governance-queues/low-confidence-routing.md` | Executes routing for SOFT_REVIEW through REJECT_AND_FLAG |
| `human-review/approval-queue-system.md` | Receives routing decisions from this system |
| `human-review/exception-review-queue.md` | Receives REJECT_AND_FLAG items |
| `operational-review/governance-throughput-metrics.md` | Tracks throughput by zone |
| `approval-operations/approval-analytics.md` | Analyzes confidence-threshold decision patterns |
