# Organizational Acceptance Modeling
**ID:** SST-OAM-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** HR Org + Governance Org | **Updated:** 2026-05-16

---

## Purpose

Models, measures, and forecasts organizational acceptance of AI systems across employee segments — tracking not just whether employees use AI tools but whether they genuinely accept them as legitimate, helpful, and fair. Acceptance is distinct from compliance: employees may comply with AI-mandated processes while remaining fundamentally opposed to them. This module differentiates surface compliance from genuine acceptance and identifies pockets of low acceptance before they become organizational resistance.

---

## Acceptance Model

```yaml
acceptance_dimensions:

  PERCEIVED_USEFULNESS:
    definition: employee belief that AI systems genuinely improve their ability
                to do meaningful work well
    measurement: usefulness survey (scale 1–5); productivity self-assessment;
                 voluntary AI tool adoption rate
    weight: 0.30
    
  PERCEIVED_FAIRNESS:
    definition: employee perception that AI decisions are applied consistently
                and without bias — that the system is not rigged against them
    measurement: fairness perception survey; disparity analysis by demographic
    weight: 0.25
    
  PERCEIVED_CONTROL:
    definition: employee sense that they retain meaningful control over their
                work outcomes despite AI influence
    measurement: control perception survey; override utilization rate; decision
                 influence perception
    weight: 0.20
    
  PSYCHOLOGICAL_SAFETY_IN_AI_CONTEXT:
    definition: employee comfort raising concerns about AI systems without
                fear of being labeled a "technology resister"
    measurement: AI-specific safety items in monthly pulse survey;
                 AI concern report utilization rate
    weight: 0.15
    
  INSTITUTIONAL_ALIGNMENT:
    definition: employee belief that the organization's deployment of AI
                is consistent with stated values and serves employee interests
    measurement: alignment survey; gap between stated AI purpose and lived experience
    weight: 0.10
```

---

## Acceptance Score Model

```
compute_organizational_acceptance_score():

  # Dimension scores
  usefulness     = get_perceived_usefulness_score()
  fairness       = get_perceived_fairness_score()
  control        = get_perceived_control_score()
  safety         = get_psychological_safety_ai_score()
  alignment      = get_institutional_alignment_score()

  # Weighted composite
  acceptance_score = (
    usefulness  * 0.30 +
    fairness    * 0.25 +
    control     * 0.20 +
    safety      * 0.15 +
    alignment   * 0.10
  )

  # Segment breakdown — surface hidden pockets of low acceptance
  segment_scores = {
    segment_id: compute_acceptance_for_segment(segment_id)
    for segment_id in get_active_segments()
  }

  # Compliance vs. acceptance gap (surface compliance without genuine acceptance)
  compliance_rate  = get_ai_compliance_rate()
  genuine_acceptance = acceptance_score
  acceptance_gap   = compliance_rate - genuine_acceptance
  # Large positive gap: employees comply but don't accept — risk accumulating

  Return: AcceptanceModel {
    overall: acceptance_score,
    components: { usefulness, fairness, control, safety, alignment },
    segments: segment_scores,
    compliance_gap: acceptance_gap,
    low_acceptance_segments: [s for s, score in segment_scores.items() if score < 0.55],
    computed_at: now()
  }
```

---

## Acceptance Segment Analysis

```
analyze_acceptance_segments():
  # Identifies which employee groups have significantly different acceptance profiles

  segments = get_acceptance_segments()
  analysis = AcceptanceSegmentAnalysis { segments: [] }

  for segment in segments:
    score = compute_acceptance_for_segment(segment.id)
    profile = AcceptanceSegmentProfile {
      segment_id:       segment.id,
      segment_name:     segment.name,
      segment_size:     segment.employee_count,
      acceptance_score: score,
      dominant_concern: identify_dominant_concern(segment.id),
      # Which dimension is lowest: usefulness / fairness / control / safety / alignment
      risk_level:       HIGH if score < 0.55 else MEDIUM if score < 0.70 else LOW,
      action_required:  score < 0.55
    }
    analysis.segments.append(profile)

  # Identify systemic patterns
  low_acceptance_segments = [s for s in analysis.segments if s.risk_level == HIGH]

  if len(low_acceptance_segments) / len(segments) > 0.30:
    # More than 30% of segments showing low acceptance — systemic, not isolated
    analysis.pattern_type = SYSTEMIC
    alert_T4("Systemic low acceptance pattern across organizational segments", analysis)
  elif low_acceptance_segments:
    analysis.pattern_type = CONCENTRATED
    alert_T3("Concentrated low acceptance in specific segments", low_acceptance_segments)

  Return: analysis
```

---

## Resistance Early Warning

```yaml
resistance_early_warning_indicators:

  RW-001:
    name: "Compliance-Acceptance Gap Widening"
    description: AI compliance rate is high but acceptance score is low and declining
    detection: compliance_rate - acceptance_score > 0.25 and acceptance trending down
    interpretation: surface compliance masking growing resentment
    severity: HIGH
    
  RW-002:
    name: "Override Rate Surge"
    description: employees invoking override authority at sharply higher rates
    detection: override_rate(window=30d) > override_rate(window=90d) * 1.50
    interpretation: employees actively resisting AI determinations
    severity: HIGH
    
  RW-003:
    name: "Concern Report Silence"
    description: no AI concern reports despite low acceptance scores
    detection: ai_concern_reports(window=30d) < expected AND acceptance_score < 0.60
    interpretation: psychological safety too low to report — chilling effect
    severity: CRITICAL
    
  RW-004:
    name: "Acceptance Segment Polarization"
    description: acceptance scores diverging sharply across organizational segments
    detection: variance(segment_acceptance_scores) > 0.20
    interpretation: different groups experiencing AI governance fundamentally differently
    severity: HIGH
    
  RW-005:
    name: "New System Acceptance Collapse"
    description: acceptance for newly deployed AI systems below 0.50 within first 90 days
    detection: acceptance_score(ai_system, window=90d) < 0.50
    interpretation: deployment process failed to build genuine buy-in
    severity: HIGH
```

---

## Detection Rules

```yaml
acceptance_modeling_rules:

  OAM-001:
    name: "Organizational Acceptance Score Low"
    condition: |
      acceptance_score < 0.55
    severity: HIGH
    auto_action: alert_T3; segment_deep_dive; acceptance_intervention_plan

  OAM-002:
    name: "Acceptance Segment Disparity Critical"
    condition: |
      max(segment_scores) - min(segment_scores) > 0.35
    severity: HIGH
    auto_action: alert_T3; focused_segment_outreach; fairness_review

  OAM-003:
    name: "Compliance-Acceptance Gap"
    condition: |
      (ai_compliance_rate - acceptance_score) > 0.25
    severity: HIGH
    auto_action: alert_T3; surface_compliance_investigation; qualitative_deep_dive

  OAM-004:
    name: "Concern Report Chilling Effect"
    condition: |
      ai_concern_reports(window=30d) < (0.30 * expected_report_rate)
      AND acceptance_score < 0.60
    severity: CRITICAL
    auto_action: alert_T4; psychological_safety_intervention; anonymous_channel_audit

  OAM-005:
    name: "New System Acceptance Below Threshold"
    condition: |
      new_ai_system.acceptance_score(window=90d) < 0.50
    severity: HIGH
    auto_action: alert_T3; deployment_review; remediation_required_before_expansion
```

---

## Integration

```
Feeds into:
  social-stability/social-stability-engine.md — acceptance scores feed stability model
  social-stability/ai-adoption-resilience.md — acceptance predicts adoption resilience
  legitimacy-systems/organizational-trust-mechanisms.md — acceptance affects trust model

Receives from:
  consent-governance/employee-consent-frameworks.md — consent experience shapes acceptance
  legitimacy-systems/explainable-authority-systems.md — explanation quality affects perceived fairness
  democratic-governance/participatory-governance-systems.md — participation shapes institutional alignment
```

---

## Governance

**Acceptance measurement is mandatory:** Monthly acceptance surveys are non-optional; individual responses are anonymous and protected; results are published to governance register without curation  
**Low acceptance blocks system expansion:** An AI system with acceptance score < 0.50 in any significant segment may not be expanded to new use cases until acceptance is remediated  
**Acceptance is not the same as satisfaction:** Employees may be satisfied with outcomes but not accept AI as a legitimate decision-maker; the model measures acceptance, not satisfaction  
**Audit:** All acceptance scores, segment analyses, and early warning activations to `memory/social-stability/acceptance-audit.jsonl`; 10-year retention
