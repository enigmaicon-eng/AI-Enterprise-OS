# Compliance Risk Scorer
**ID:** CIN-CRS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Produces a real-time, multi-dimensional compliance risk score for every agent action, workflow step, and data operation. The Compliance Risk Scorer is the quantitative backbone of the compliance decision engine — it translates qualitative compliance signals (regulatory exposure, data sensitivity, control maturity, violation history) into a normalized composite score that gates access and determines the level of human review required. Scores are refreshed continuously as inputs change; they are never stale by design.

---

## Risk Dimensions

```yaml
risk_dimensions:

  REGULATORY_EXPOSURE (weight: 0.25):
    description: How many regulations apply, how strict they are, and how recent they are
    inputs:
      - jurisdiction_count: number of applicable jurisdictions
      - regulation_severity: max severity class of applicable regulations
      - recent_regulatory_change: whether RIU with CRITICAL/HIGH impact was processed in last 30 days
    scoring:
      single_jurisdiction_no_change: 0.10–0.30
      multi_jurisdiction_no_change: 0.30–0.55
      any_jurisdiction_recent_critical_change: 0.70–0.90
      
  DATA_SENSITIVITY (weight: 0.25):
    description: Sensitivity class of data involved in the action
    inputs:
      - data_class: PUBLIC | STANDARD | RESTRICTED | SOVEREIGN_CRITICAL
      - special_categories: [biometric, health, children, financial, political_opinion]
      - data_volume: record count (log-scaled)
    scoring:
      PUBLIC: 0.00
      STANDARD: 0.10–0.25
      RESTRICTED (no special category): 0.40–0.60
      RESTRICTED (special category): 0.65–0.80
      SOVEREIGN_CRITICAL: 0.90–1.00
      
  CONTROL_MATURITY (weight: 0.20):
    description: Effectiveness of controls governing this action's domain
    inputs:
      - relevant_control_scores: [effectiveness score per applicable control]
      - compensating_controls_active: boolean
    scoring:
      all_controls_effective (>= 0.80): 0.00–0.15
      one_or_more_marginal (0.60–0.79): 0.20–0.40
      one_or_more_degraded (< 0.60): 0.50–0.70
      primary_control_failed + compensating: 0.60–0.75
      primary_control_failed + no_compensating: 0.85–1.00
      
  AGENT_COMPLIANCE_HISTORY (weight: 0.15):
    description: Agent's recent compliance record
    inputs:
      - violations_last_90d: count
      - current_compliance_state: {COMPLIANT, MONITORING, AT_RISK, VIOLATION_DETECTED, ...}
      - trust_score: from cross-agent-trust-accumulation.md
    scoring:
      COMPLIANT + 0 violations + high trust: 0.00–0.10
      MONITORING + <= 1 violation: 0.10–0.30
      AT_RISK + 2–3 violations: 0.40–0.60
      VIOLATION_DETECTED: 0.70–0.85
      SUSPENDED: 1.00 (always CRITICAL regardless of other dimensions)
      
  CROSS_BORDER_COMPLEXITY (weight: 0.15):
    description: Risk from cross-jurisdiction data movement or multi-sovereign operation
    inputs:
      - cross_border: boolean
      - jurisdiction_pair_risk: risk class of the specific jurisdiction pair
      - transfer_mechanism_validity: active and current mechanism exists
      - mechanism_age_days: days since last TIA or mechanism review
    scoring:
      same_jurisdiction: 0.00
      cross_border + adequacy + fresh_TIA: 0.10–0.20
      cross_border + SCC + TIA < 1yr: 0.20–0.40
      cross_border + SCC + TIA > 1yr: 0.50–0.70
      cross_border + no_mechanism: 1.00 (always CRITICAL)
      CN_involved_any_direction: += 0.15 (additive)
```

---

## Composite Score Calculation

```
score_compliance_risk(action, policy_results, agent_state, data_context, jurisdiction_context):

  # Compute each dimension
  dim_regulatory = score_regulatory_exposure(jurisdiction_context, recent_regulatory_intel())
  dim_data = score_data_sensitivity(data_context)
  dim_control = score_control_maturity(applicable_controls(action, jurisdiction_context))
  dim_history = score_agent_history(agent_state.agent_id, agent_state.compliance_state)
  dim_cross_border = score_cross_border(jurisdiction_context)
  
  # Override: SUSPENDED agent is always CRITICAL
  if agent_state.compliance_state == SUSPENDED:
    Return: RiskScore(composite=1.00, tier=CRITICAL, override="AGENT_SUSPENDED")
    
  # Override: no transfer mechanism + cross-border is always CRITICAL
  if jurisdiction_context.cross_border and not jurisdiction_context.transfer_mechanism:
    Return: RiskScore(composite=1.00, tier=CRITICAL, override="NO_TRANSFER_MECHANISM")
    
  # Weighted composite
  composite = (
    dim_regulatory  * 0.25 +
    dim_data        * 0.25 +
    dim_control     * 0.20 +
    dim_history     * 0.15 +
    dim_cross_border * 0.15
  )
  
  # Policy violation modifier: confirmed policy violations from policy_results
  violation_count = len([r for r in policy_results if r.outcome == FAIL])
  violation_severity_max = max((r.severity for r in policy_results if r.outcome == FAIL), default=NONE)
  
  if violation_severity_max == CRITICAL: composite = max(composite, 0.90)
  elif violation_severity_max == HIGH: composite = max(composite, 0.70)
  elif violation_severity_max == MEDIUM: composite = max(composite, 0.50)
  
  # Clamp
  composite = min(1.00, max(0.00, composite))
  
  tier = classify_tier(composite)
  
  Return: RiskScore {
    composite, tier,
    dimensions: {regulatory: dim_regulatory, data: dim_data, control: dim_control,
                 history: dim_history, cross_border: dim_cross_border},
    overrides: [],
    computed_at: now()
  }
  
  
classify_tier(composite):
  if composite >= 0.80: return CRITICAL
  if composite >= 0.60: return HIGH
  if composite >= 0.40: return MEDIUM
  if composite >= 0.20: return LOW
  return MINIMAL
```

---

## Risk Appetite Configuration

```yaml
risk_appetite:
  # Per-jurisdiction risk appetite (lower = stricter)
  JUR-EU:
    max_acceptable_score: 0.55
    REQUIRE_REVIEW_threshold: 0.45
    AUTO_REMEDIATE_threshold: 0.70
    
  JUR-CN:
    max_acceptable_score: 0.45
    REQUIRE_REVIEW_threshold: 0.35
    AUTO_REMEDIATE_threshold: 0.60
    
  JUR-US:
    max_acceptable_score: 0.60
    REQUIRE_REVIEW_threshold: 0.50
    AUTO_REMEDIATE_threshold: 0.75
    
  DEFAULT:
    max_acceptable_score: 0.55
    REQUIRE_REVIEW_threshold: 0.45
    AUTO_REMEDIATE_threshold: 0.70
    
  # Domain-level overrides (stricter than jurisdiction defaults)
  AI_GOVERNANCE:
    max_acceptable_score: 0.40       # AI governance always stricter
  FINANCIAL:
    max_acceptable_score: 0.50
    
  # Risk appetite changes require T4 approval and 30-day notice
  change_authority: T4
  change_notice_days: 30
```

---

## Risk Trend Analysis

```yaml
risk_trend:
  tracked_per:
    - entity (rolling 90-day risk score average)
    - domain (rolling 30-day average per compliance domain)
    - agent_class (rolling 30-day average per agent class)
    
  trend_signals:
    IMPROVING: current_score < (30d_avg - 0.05) for 7 consecutive days
    DETERIORATING: current_score > (30d_avg + 0.05) for 3 consecutive days
    VOLATILE: standard_deviation > 0.15 over 30 days
    
  deterioration_response:
    T3_alert: risk trend DETERIORATING for 7 consecutive days
    T4_review: risk trend DETERIORATING for 14 consecutive days
    policy_review_trigger: risk trend DETERIORATING in same domain for 30 days
    
  benchmarking:
    internal: compare entity scores against entity-average
    cross_entity: federation-wide risk benchmark (anonymized; no entity identification)
    threshold_review: quarterly — risk appetite may be recalibrated based on trend data
```

---

## Integration

```
Feeds into:
  compliance-decision-engine.md — risk score gates decision type
  compliance-state-machine.md — risk score tier changes trigger state transitions
  compliance-dashboard.md — risk scores feed heat map and trend charts
  compliance-predictor.md — historical risk scores used for ML training

Receives from:
  compliance-state-machine.md — agent compliance state feeds history dimension
  control-effectiveness-monitor.md — control scores feed control_maturity dimension
  regulatory-intelligence-system.md — recent RIUs feed regulatory_exposure dimension
  cross-border-governance.md — transfer mechanism validity feeds cross_border dimension
  cross-agent-trust-accumulation.md — agent trust score feeds history dimension
```

---

## Governance

**Dimension weights are governed:** Weights (0.25/0.25/0.20/0.15/0.15) require T4 + Architecture Org to change; any change triggers 30-day shadow validation  
**Override transparency:** Every override (SUSPENDED agent, no mechanism) is logged with explicit override reason; overrides are not silently applied  
**Risk appetite authority:** Per-jurisdiction risk appetite thresholds set by T4 + Legal Org; published to all entity governance boards  
**Score immutability:** Computed scores are immutable once logged; scores are never retrospectively recalculated  
**Audit:** All risk scores to `memory/compliance-intelligence/risk-scores.jsonl`; linked to compliance record by ACE-{NNN} ID
