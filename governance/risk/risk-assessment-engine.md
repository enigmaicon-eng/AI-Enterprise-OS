# Risk Assessment Engine

## Purpose
Provides the analytical methods and scoring protocols for quantifying, comparing, and prioritizing compliance risks. The risk assessment engine standardizes how risks are measured across domains so that a GDPR risk can be compared meaningfully to an AI Act risk or an operational risk — enabling resource allocation and executive decision-making based on objective risk scores rather than subjective domain-specific judgment.

---

## Assessment Methodology

```yaml
assessment_methodology:
  primary_method: QUALITATIVE_QUANTIFIED
    description: Qualitative likelihood and impact ratings (1-5 scales) combined into quantitative risk scores
    rationale: Pure qualitative systems produce inconsistency; pure quantitative models require historical data that compliance risks often lack
  
  secondary_method: SCENARIO_ANALYSIS
    description: Structured "what-if" scenarios exploring how risks materialize and compound
    use_when: CRITICAL risks; novel risk types with limited historical data
  
  validation_method: EXPERT_PANEL_REVIEW
    description: Domain experts review and challenge quantified assessments
    use_when: All CRITICAL and HIGH initial assessments; annual reassessment of all risks
  
  calibration:
    objective: ensure assessors in different domains are using the same scale
    method: quarterly calibration exercise using reference risk scenarios
    calibration_scenarios:
      - "What score would you give a data breach exposing 10,000 EU users' financial data?"
      - "What score for a critical vulnerability with a public exploit and no current patch?"
      - "What score for an AI system deployed without required EU AI Act documentation?"
    reference_answers: maintained by compliance governance lead; used to detect assessor drift
```

---

## Inherent Risk Scoring

```yaml
inherent_risk_scoring:
  definition: Risk score assuming no controls exist (what is the raw exposure?)
  
  likelihood_assessment:
    dimensions:
      threat_capability: Does a credible threat actor have the means to exploit this risk?
      threat_motivation: Do threat actors have incentive to exploit this?
      vulnerability_exposure: How exposed is the enterprise to this risk?
      historical_occurrence: Has this occurred at comparable organizations?
    
    scoring_guidance:
      1_RARE:
        threat_capability: LOW or threat is largely theoretical
        historical: no known occurrence at comparable organizations in 5 years
        environmental_factors: strong mitigating environmental factors
      
      3_POSSIBLE:
        threat_capability: MEDIUM; threat is technically feasible
        historical: documented occurrences at comparable organizations
        environmental_factors: no unusual mitigating or amplifying factors
      
      5_ALMOST_CERTAIN:
        threat_capability: HIGH; threat is actively being exploited
        historical: frequent occurrence at comparable organizations in last 12 months
        environmental_factors: amplifying factors present (regulatory scrutiny, active attacks, etc.)
  
  impact_assessment:
    impact_dimensions: [FINANCIAL, REGULATORY, REPUTATIONAL, OPERATIONAL]
    
    multi_dimension_aggregation:
      method: maximum of all dimension scores (worst-case single dimension drives the rating)
      rationale: a catastrophic regulatory impact is catastrophic even if operational impact is minor
    
    financial_impact_calibration:
      1: < $10,000 direct cost + $0 indirect
      2: $10K–$100K direct; < $500K total
      3: $100K–$1M direct; < $5M total (regulatory fines or legal costs included)
      4: $1M–$10M direct; significant indirect (including regulatory fines)
      5: > $10M direct; or existential financial risk (maximum regulatory penalties at scale)
    
    regulatory_impact_calibration:
      1: No regulatory action expected; self-correctable
      2: Regulatory inquiry likely; warning or informal guidance
      3: Formal enforcement action; moderate fine; operational restriction possible
      4: Major enforcement action; substantial fine; operating license review possible
      5: Maximum penalties; criminal exposure; operating license revocation risk
    
    ai_specific_impact_amplifiers:
      if risk involves_eu_ai_act_prohibited_practice: impact = 5 (maximum; no adjustment down)
      if risk involves_high_risk_ai_without_conformity: impact += 1 (up to 5)
      if risk involves_ai_system_decision_affecting_people: impact += 1 (up to 5)
```

---

## Residual Risk Computation

```yaml
residual_risk_computation:
  inputs: [inherent_risk_score, control_ids mapped to this risk, control_effectiveness per control]
  
  control_effectiveness_discount_factors:
    EFFECTIVE: 0.70 discount (control reduces inherent risk by 70%)
    PARTIALLY_EFFECTIVE: 0.40 discount
    INEFFECTIVE: 0.00 discount (no risk reduction credited)
    COMPENSATING: 0.30 discount (compensating controls get reduced credit)
    NOT_TESTED: 0.20 discount (some credit for existence, but untested reliability)
  
  multiple_control_aggregation:
    method: diminishing returns model
    formula: |
      residual_risk = inherent_risk × Π(1 - discount_i)
      where discount_i is each control's effectiveness discount
      
      Example: inherent=16; CTL-A (EFFECTIVE, 0.70), CTL-B (PARTIALLY_EFFECTIVE, 0.40)
      residual = 16 × (1 - 0.70) × (1 - 0.40) = 16 × 0.30 × 0.60 = 2.88
    
    rationale: overlapping controls don't give full additive benefit; diminishing returns prevent over-crediting
  
  risk_level_mapping:
    residual_score >= 15: CRITICAL (immediate action required regardless of treatment approach)
    residual_score 8-14: HIGH (significant action required)
    residual_score 4-7: MEDIUM (planned remediation required)
    residual_score 1-3: LOW (routine management acceptable)
  
  risk_appetite_breach:
    if residual_risk_level > domain_risk_appetite: treatment plan mandatory
    if residual CRITICAL and risk_tolerance = ACCEPT: Tier-4+ approval required + board notification
```

---

## Scenario Analysis Protocol

```yaml
scenario_analysis:
  use_cases:
    - CRITICAL risk initial assessment (supplement qualitative scoring)
    - regulatory change impact (new regulation → scenario of non-compliance)
    - compound risk analysis (how does failure in one control affect others?)
    - stress testing (what if two HIGH risks materialize simultaneously?)
  
  scenario_schema:
    scenario_id: string
    scenario_name: string
    trigger_condition: string          # what causes this scenario to occur?
    risk_ids_involved: [risk_id]
    
    scenario_narrative:
      step_1: initial trigger event
      step_2: propagation (how does this spread or compound?)
      step_3: detection point (when would this be discovered?)
      step_4: impact crystallization (what harm is done by detection time?)
      step_5: regulatory response (what regulatory action would follow?)
    
    quantified_outcomes:
      financial_exposure: {min, expected, max}
      regulatory_penalty_exposure: {min, expected, max}
      recovery_time_estimate: duration
      probability_of_this_scenario: float
    
    mitigating_factors: [what would reduce the likelihood or severity?]
    amplifying_factors: [what would make this worse?]
  
  example_scenarios:
    SCENARIO-AI-001: eu_ai_act_enforcement_action
      trigger: EU AI Act enforcement authority investigates enterprise AI deployment
      risk_ids: [RSK-AIGOV-001, RSK-AIGOV-002]
      key_question: Would the enterprise be found compliant if examined today?
      financial_exposure: {min: €500K, expected: €3M, max: €35M}
    
    SCENARIO-PRIV-001: gdpr_data_breach_notification
      trigger: Personal data breach affecting 50,000+ EU data subjects
      risk_ids: [RSK-PRIV-001, RSK-SEC-001]
      key_question: Can the enterprise notify within 72 hours with accurate breach scope?
      financial_exposure: {min: €100K, expected: €1.5M, max: €20M}
```

---

## Risk Heat Map

```yaml
risk_heat_map:
  dimensions:
    x_axis: likelihood (1-5)
    y_axis: impact (1-5)
    color_coding:
      CRITICAL (score 15-25): RED
      HIGH (score 8-14): ORANGE
      MEDIUM (score 4-7): YELLOW
      LOW (score 1-3): GREEN
  
  current_heat_map_snapshot:
    CRITICAL_zone:
      - RSK-AIGOV-001 (EU AI Act non-compliance): likelihood=4, impact=5 → score=20
      - RSK-SEC-002 (supply chain attack): likelihood=3, impact=5 → score=15
    
    HIGH_zone:
      - RSK-PRIV-001 (personal data breach): likelihood=3, impact=4 → score=12
      - RSK-AIGOV-002 (AI model bias): likelihood=3, impact=4 → score=12
      - RSK-PRIV-003 (transfer mechanism invalidation): likelihood=2, impact=4 → score=8
      - RSK-SEC-001 (unauthorized access): likelihood=3, impact=4 → score=12
      - RSK-OPS-001 (BC failure): likelihood=2, impact=4 → score=8
    
    MEDIUM_zone:
      - RSK-PRIV-002 (DSR SLA breach): likelihood=2, impact=3 → score=6
      - RSK-OPS-002 (key personnel dependency): likelihood=2, impact=3 → score=6
  
  heat_map_updates:
    frequency: monthly (reflecting changes in likelihood, impact, or control effectiveness)
    format: available as data extract for governance-executive-reporting.md
```

---

## Assessment Governance

```yaml
assessment_governance:
  assessor_requirements:
    initial_assessment: domain compliance lead + compliance governance lead review
    CRITICAL_risk: additional expert panel review required
    annual_reassessment: same requirements as initial assessment
  
  assessment_independence:
    risk_owner cannot be the sole assessor of their own risk
    all CRITICAL and HIGH assessments require second-opinion sign-off
  
  assessment_quality_checks:
    plausibility: does the score make intuitive sense relative to the domain and business context?
    consistency: similar risks should have similar scores (calibration enforcement)
    completeness: all four impact dimensions considered?
    control_credit_validity: controls credited are confirmed EFFECTIVE or PARTIALLY_EFFECTIVE?
  
  challenge_process:
    who_can_challenge: any compliance lead, risk owner, or Tier-3+
    challenge_window: 14 days from initial assessment publication
    resolution: compliance governance lead adjudicates; documents rationale
    re_challenge: once per risk per annual cycle maximum
```

---

## Integration Points

| System | Role |
|---|---|
| `risk-and-controls/enterprise-risk-register.md` | Risk records that this engine scores |
| `compliance-framework/control-catalog.md` | Control effectiveness used for residual computation |
| `risk-and-controls/control-effectiveness-monitor.md` | Real-time effectiveness feeds residual risk updates |
| `audit-and-evidence/finding-management.md` | High-severity findings trigger risk reassessment |
| `governance-operations/compliance-operations-dashboard.md` | Heat map and risk summary displayed |
| `governance-operations/governance-executive-reporting.md` | Risk assessment outputs in executive reports |
