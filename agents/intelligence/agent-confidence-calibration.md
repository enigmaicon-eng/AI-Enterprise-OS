# Agent Confidence Calibration

## Purpose
Ensures that agents' expressed confidence accurately reflects their actual accuracy. A well-calibrated agent who claims 0.80 confidence is right approximately 80% of the time. Miscalibration — either overconfidence or underconfidence — degrades every system that relies on confidence as a signal: the AI confidence threshold system, human review routing, and autonomous action decisions. This system continuously measures, corrects, and governs agent calibration.

---

## Calibration Model

```yaml
calibration_model:
  definition: |
    An agent is calibrated if, across many predictions:
    - When claiming confidence p, the agent is correct approximately p fraction of the time
    - This holds across different domains, task types, and confidence levels
  
  calibration_metrics:
    calibration_error:
      definition: mean(|claimed_confidence - empirical_accuracy|) across a sample
      target: < 0.10 for standard agents; < 0.07 for GOVERNANCE agents
      computation_window: minimum 50 predictions for statistical validity
    
    Expected Calibration Error (ECE):
      definition: weighted average of calibration error per confidence bucket
      buckets: [0.0–0.1, 0.1–0.2, ..., 0.9–1.0]
      formula: ECE = Σ_bucket [ (n_bucket/n_total) × |accuracy_bucket - confidence_bucket| ]
      target: ECE < 0.08
    
    bias_direction:
      OVERCONFIDENT: mean(claimed_confidence) > mean(empirical_accuracy) by > 0.05
      UNDERCONFIDENT: mean(claimed_confidence) < mean(empirical_accuracy) by > 0.05
      NEUTRAL: within ±0.05 of empirical accuracy
    
    sharpness:
      definition: variance of confidence scores (how decisive is the agent?)
      too_low: std_dev < 0.05 (agent always says ~0.75; not discriminating)
      target: std_dev >= 0.12 (genuine uncertainty variation across tasks)
    
    resolution:
      definition: whether different confidence values predict different accuracy levels
      good_resolution: high confidence predictions ARE more accurate than low confidence ones
      bad_resolution: same accuracy regardless of stated confidence (confidence is meaningless)
```

---

## Calibration Measurement

```yaml
calibration_measurement:
  data_collection:
    record_per_prediction:
      prediction_id: string
      agent_id: string
      claimed_confidence: float
      domain: string
      task_type: string
      occurred_at: ISO-8601
      outcome_observed: boolean | null  # filled in when outcome known
      outcome_at: ISO-8601 | null
    
    outcome_attribution:
      automated: when task.completed with quality_score or outcome_assessment signal
      manual: human reviewer marks claim as correct/incorrect
      delay: some outcomes take days-weeks to observe (decisions, artifacts reviewed later)
  
  calibration_computation:
    run_frequency: daily (using last 90 days of predictions with known outcomes)
    minimum_samples: 50 (below this, calibration_error not computed; flagged as INSUFFICIENT_DATA)
    stratification: compute per domain AND per task_type (calibration may vary by context)
    
    domain_specific_calibration:
      governance_domain: 0.07 target (stricter; decisions have high stakes)
      technical_domain: 0.10 target
      research_domain: 0.12 target (more inherent uncertainty)
  
  calibration_lifecycle:
    NEW_AGENT: insufficient data phase; default to conservative routing (treat as REQUIRED_REVIEW)
    CALIBRATING: 50–200 predictions collected; calibration_error computed but may be noisy
    CALIBRATED: 200+ predictions; stable calibration_error; confidence thresholds trusted
    MISCALIBRATED: calibration_error > threshold; corrective calibration initiated
```

---

## Calibration Correction

```yaml
calibration_correction:
  STATISTICAL_BIAS_CORRECTION:
    trigger: consistent overconfidence or underconfidence bias detected (> 30 days)
    method: apply additive correction to raw confidence output
    
    bias_correction_formula:
      if OVERCONFIDENT: corrected_confidence = raw_confidence - correction_offset
      if UNDERCONFIDENT: corrected_confidence = raw_confidence + correction_offset
      correction_offset = bias_magnitude × damping_factor (0.50)
    
    application: correction applied TRANSPARENTLY (shown to agent and in audit trail)
    review: correction revised monthly as new calibration data accumulates
    removal: correction removed when calibration_error < 0.08 for 60 days without correction
  
  PLATT_SCALING:
    description: Learned sigmoid transformation for more precise calibration correction
    method: logistic regression on (raw_confidence → observed_accuracy) dataset
    training: fitted quarterly using last 6 months of predictions
    use_when: bias correction insufficient; domain-specific miscalibration
    requires: >= 200 predictions in the domain for reliable fitting
  
  BEHAVIORAL_COACHING:
    description: Agent coached on WHY they are miscalibrated (not just corrected numerically)
    trigger: calibration_error > 0.15 for 14+ days
    coaching_content:
      OVERCONFIDENT: "Your confidence in X domain exceeds your accuracy. Examples: [3 cases]"
      UNDERCONFIDENT: "You are more accurate than you indicate. Consider higher confidence when..."
    follow_up: re-assess calibration 30 days after coaching; measure impact
  
  DOMAIN_RESTRICTION:
    trigger: calibration_error > 0.25 in a specific domain
    action: agent routed to REQUIRED_REVIEW for all tasks in that domain (override confidence thresholds)
    duration: until calibration_error < 0.15 for 21 consecutive days
    governed_by: supervisor notification + governance-queues.confidence-threshold-system.md update
```

---

## Calibration Governance

```yaml
calibration_governance:
  thresholds:
    GREEN: calibration_error <= 0.08 → agent's confidence trusted for autonomous routing
    YELLOW: calibration_error 0.09–0.14 → confidence trusted but monitored
    ORANGE: calibration_error 0.15–0.24 → correction applied; coaching initiated
    RED: calibration_error >= 0.25 → domain restriction; NOT trusted for confidence-gated decisions
  
  miscalibration_as_compliance_issue:
    rationale: |
      Miscalibrated agents produce unreliable confidence scores that corrupt the
      AI confidence threshold system, causing governance to route incorrectly.
      Miscalibration is therefore a compliance breach, not just a performance issue.
    consequence:
      calibration_error > 0.20 for 30 days: compliance breach alert (see knowledge-compliance-system.md analog)
      calibration_error > 0.30: CRITICAL; agent's confidence scores quarantined until corrected
  
  systematic_miscalibration_detection:
    if_same_agent_type_shows_calibration_issues: cohort-level investigation
    if_same_domain_shows_calibration_issues_across_agents: domain knowledge gap investigation
    if_new_KU_correlates_with_miscalibration: suspect KU quality issue
  
  calibration_audit:
    frequency: monthly (for GREEN agents); weekly (ORANGE/RED)
    content: ECE per domain per agent; trend; correction_offset history; bias_direction
    recipient: capability governance lead; supervisor for individual agents
```

---

## Calibration and the Confidence Threshold System

```yaml
integration_with_confidence_thresholds:
  default_routing:
    well_calibrated_agent (GREEN): raw confidence used directly for routing
    moderately_miscalibrated (YELLOW): correction_offset applied before routing
    poorly_calibrated (ORANGE): correction_offset applied; additional conservative margin (+0.05)
    severely_miscalibrated (RED): domain restricted; confidence score ignored for routing
  
  zone_implications:
    well_calibrated + confidence >= 0.90: AUTONOMOUS zone → agent proceeds without review
    well_calibrated + confidence < 0.70: SOFT_REVIEW or REQUIRED_REVIEW → human in loop
    miscalibrated agent: effective threshold shifted upward (harder to enter AUTONOMOUS zone)
  
  threshold_floor:
    regardless_of_calibration_score:
      constitutional_evaluation: ALWAYS requires >= 0.97 confidence for autonomous (see confidence-threshold-system.md)
      policy_interpretation: >= 0.90 for autonomous (domain restriction if miscalibrated)
```

---

## Integration Points

| System | Role |
|---|---|
| `governance-queues/confidence-threshold-system.md` | Calibrated confidence → routing zone |
| `governance-queues/low-confidence-routing.md` | Miscalibrated agents → higher-tier routing |
| `agent-performance/agent-performance-model.md` | CALIBRATION performance dimension |
| `agent-learning/agent-behavioral-adaptation.md` | Calibration correction is a specific adaptation |
| `agent-intelligence/agent-memory-system.md` | Episodic memory tracks past confidence vs. outcomes |
| `agent-performance/agent-performance-coach.md` | Calibration breaches trigger coaching plans |
