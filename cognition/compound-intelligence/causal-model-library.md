# Causal Model Library
**ID:** CI-CML-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Maintains a structured library of validated causal models — directed acyclic graphs (DAGs) that represent confirmed cause-effect relationships within the enterprise domain. Unlike correlation analysis (which detects co-movement), causal models encode the mechanism by which one variable produces change in another. The compound intelligence engine uses these models to validate causal hypotheses rather than treating all correlations as causal.

---

## Causal Model Schema

```yaml
causal_model:
  model_id: CM-{NNN}
  name: string
  domain: string                        # which intelligence domain this model lives in
  
  variables:
    - var_id: string
      name: string
      type: CONTINUOUS | ORDINAL | BINARY | CATEGORICAL
      domain: string                    # e.g., "customer", "financial", "operational"
      unit: string | null
      
  edges:                                # directed causal edges (cause → effect)
    - cause_var_id: string
      effect_var_id: string
      mechanism: string                  # description of how cause produces effect
      lag_days: number                   # typical delay between cause and observed effect
      strength: 0.00–1.00               # how strong is the causal link
      direction: POSITIVE | NEGATIVE | NON_LINEAR
      moderators: [string]              # variables that strengthen/weaken this edge
      
  confounders: [string]                 # variables that affect multiple nodes (must control for)
  
  validation:
    method: RCT | QUASI_EXPERIMENT | INTERRUPTED_TIME_SERIES | GRANGER | DIFF_IN_DIFF | EXPERT_CONSENSUS
    evidence_strength: WEAK | MODERATE | STRONG
    validated_by: string
    validated_at: ISO8601
    n_observations: number | null
    
  status: VALIDATED | PROVISIONAL | DISPUTED | RETIRED
  last_reviewed: ISO8601
```

---

## Core Causal Models

### CM-001: Customer Churn Causal Chain

```
Feature Adoption Decline → Engagement Score Decline [lag: 14d, strength: 0.75]
Engagement Score Decline → NPS Decline [lag: 30d, strength: 0.60]
NPS Decline → Churn Probability Increase [lag: 60d, strength: 0.65]
Support Ticket Rate Increase → Engagement Score Decline [lag: 7d, strength: 0.50]
Competitor Launch → Competitor Evaluation Signal [lag: 30d, strength: 0.40]
Competitor Evaluation Signal → Churn Probability Increase [lag: 45d, strength: 0.55]

Confounders: account_size, product_tier, customer_maturity_level
Validation: Granger causality on 24-month cohort data; n=1,240 accounts
Evidence strength: STRONG
```

### CM-002: Engineering Velocity Causal Chain

```
Technical Debt Accumulation → Cycle Time Increase [lag: 30d, strength: 0.65]
Cycle Time Increase → Sprint Velocity Decline [lag: 14d, strength: 0.80]
Sprint Velocity Decline → Feature Delivery Delay [lag: 7d, strength: 0.85]
Feature Delivery Delay → Customer Satisfaction Decline [lag: 60d, strength: 0.45]
Team Size Increase → Short-term Velocity Decline [lag: 14d, strength: 0.40]  # Mythical Man-Month effect

Confounders: sprint_complexity, dependency_count, team_tenure
Validation: Interrupted time series across 8 quarterly velocity measurements
Evidence strength: MODERATE
```

### CM-003: Competitive Position Causal Chain

```
Competitor Feature Launch → Customer Evaluation Signal [lag: 30d, strength: 0.35]
Customer Evaluation Signal → Win Rate Decline [lag: 45d, strength: 0.55]
Win Rate Decline → New ARR Decline [lag: 30d, strength: 0.80]
Our Feature Release → Win Rate Improvement [lag: 60d, strength: 0.40]
Our Feature Release → Customer Evaluation Signal Reduction [lag: 45d, strength: 0.35]

Confounders: segment, sales_cycle_length, pricing_delta
Validation: Expert consensus + quasi-experiment (pre/post feature launch)
Evidence strength: MODERATE
```

### CM-004: Governance Throughput Causal Chain

```
Approval Queue Depth Increase → Decision Latency Increase [lag: 0d, strength: 0.90]
Decision Latency Increase → Workflow Cycle Time Increase [lag: 0d, strength: 0.75]
Workflow Cycle Time Increase → Team Frustration Increase [lag: 14d, strength: 0.50]
Team Frustration Increase → Governance Bypass Attempts [lag: 7d, strength: 0.35]
Pre-Authorization Pool Expansion → Approval Queue Depth Decrease [lag: 7d, strength: 0.80]

Confounders: decision_complexity_mix, escalation_rate, human_reviewer_capacity
Validation: Interrupted time series on governance metrics; n=890 decisions
Evidence strength: STRONG
```

---

## Causal Hypothesis Validation

When the compound intelligence engine generates a novel causal hypothesis, it is validated against the library:

```
validate_causal_hypothesis(hypothesis: {cause, effect, mechanism, lag}):

  Step 1: Check existing models
    - Does an edge from cause → effect already exist in any model?
    - If YES: is hypothesis consistent with known model? → CONSISTENT | CONTRADICTS_MODEL
    
  Step 2: Check confounder list
    - Is there a known confounder that could explain apparent cause-effect relationship?
    - If confounder identified: hypothesis flagged as POTENTIAL_SPURIOUS_CORRELATION
    
  Step 3: Check lag consistency
    - Is proposed lag consistent with known mechanism timing?
    - If lag << known mechanism lag: flag as IMPLAUSIBLY_FAST
    
  Step 4: Classify
    - VALIDATED: consistent with strong-evidence model, plausible mechanism
    - PROVISIONAL: plausible, no contradicting evidence, needs observation
    - SUSPECT: potential confounders identified; needs controlled analysis
    - REJECTED: contradicts strong-evidence model
    
  Step 5: If PROVISIONAL: create research ticket for investigation
           If VALIDATED: may be acted upon by compound intelligence engine
           If SUSPECT/REJECTED: do not act; flag for human review
```

---

## Model Maintenance

```
Quarterly review:
  1. Re-validate all VALIDATED models with fresh data (n ≥ 50 new observations)
  2. Check for model drift: has causal strength changed significantly?
  3. Models with evidence strength declining: PROVISIONAL → review
  4. Retire models that no longer fit recent data (status → RETIRED; never deleted)
  
New model addition:
  T3 Analytics + Architecture approval
  Minimum: MODERATE evidence strength to enter as VALIDATED
  PROVISIONAL models: entered with clear evidence plan to upgrade or retire
```

---

## Governance

**Model library:** `compound-intelligence/causal-model-library/` (structured YAML files)
**New model approval:** T3 Analytics + Architecture
**Model validation standards:** Documented methodology required; no expert-consensus-only for STRONG rating
**Audit:** All causal hypothesis validations logged to `memory/compound-intelligence/causal-validation-log.jsonl`
**Caution:** Causal models are validated within a context — they may not generalize beyond observed conditions
