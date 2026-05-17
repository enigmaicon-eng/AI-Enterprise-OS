# Churn Prediction System
**ID:** CI-CHRN-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Predicts customer churn probability at the segment and individual account level using survival analysis and behavioral signals. Enables proactive intervention before churn occurs — the goal is zero surprise churns for accounts above $50K ARR. Feeds churn_probability_90d into the customer twin.

---

## Prediction Model

### Feature Set

```yaml
churn_prediction_features:
  behavioral: (weight: 0.40)
    - dau_trend_30d: slope of daily active users over 30 days
    - feature_adoption_breadth: count of features used > once in 30 days
    - workflow_completion_rate_30d: % of started workflows completed
    - login_frequency_trend: sessions per user per week, 30d trend
    - support_ticket_rate_trend: tickets/user/month, 90d trend
    - integration_health: % of connected integrations active
    
  satisfaction: (weight: 0.25)
    - nps_score_current: latest NPS score (-100 to 100)
    - nps_trend_90d: NPS change over 90 days
    - csat_avg_90d: average CSAT over last 90 days
    - negative_sentiment_ratio: % of feedback signals with sentiment < -0.3
    
  account_health: (weight: 0.20)
    - days_since_last_expansion: days since last upsell/add-on
    - contract_renewal_proximity: days until renewal
    - outstanding_support_issues: count of open P1/P2 tickets
    - executive_sponsor_engaged: boolean (sponsor contacted in last 90 days)
    
  product_fit: (weight: 0.15)
    - primary_use_case_match: how well product covers declared use cases (0–1)
    - competitor_evaluation_signal: detected evaluation of competitor (boolean)
    - jtbd_coverage_score: % of customer JTBDs covered by product features
```

### Modeling Approach

**Primary:** Cox Proportional Hazards (survival analysis) — models time-to-churn, not just probability.
**Ensemble:** Combined with gradient boosting (XGBoost) for non-linear feature interactions.
**Ensemble weight:** Cox 0.60 + XGBoost 0.40 (Cox prioritized for interpretability).

```
Output per account:
  churn_probability_90d: 0.00–1.00
  survival_median_days: expected days until 50% churn probability
  top_churn_drivers: top 3 features contributing to risk
  intervention_recommendation: [string]  # generated from churn_drivers
```

### Calibration

- Target: calibration error (ECE) < 0.05 (predicted probability matches actual churn rate)
- Monthly calibration check: compare 90-day predictions vs. actual churn outcomes
- Brier score tracked monthly; target < 0.08
- Model retrained quarterly with last 12 months of labeled data

---

## Prediction Schedule

```
Real-time triggers (immediate re-score):
  - DAU drops > 40% week-over-week
  - Support ticket rate doubles in 7 days
  - NPS drop > 30 points
  - Competitor evaluation signal detected
  - Executive sponsor departure detected

Weekly (batch re-score):
  - Full re-score of all tracked accounts
  - Update churn_probability_90d in customer twin
  - Generate tier changes (HEALTHY/WATCH/AT_RISK/CRITICAL)

Monthly:
  - Model calibration check
  - Feature importance review
  - False positive/negative analysis
```

---

## Intervention Playbook Integration

Churn tier determines intervention playbook:

```
WATCH (0.10–0.24):
  - CS check-in email (automated, personalized)
  - Feature adoption nudge (in-product)
  - No human intervention unless account > $200K ARR

AT_RISK (0.25–0.49):
  - CS manager call within 5 business days
  - Executive Business Review (EBR) scheduled
  - Product team notified of top churn drivers
  - Success plan created with CS team

CRITICAL (≥ 0.50):
  - T3 immediate: PM + CS VP + Account Executive notified
  - 48-hour intervention plan required
  - Executive sponsor engagement (from our side)
  - Escalation path to T4 if account > $500K ARR
  - Intervention documented in customer twin
```

---

## Accuracy Reporting

```yaml
churn_model_accuracy:
  evaluation_period: YYYY-MM               # monthly
  accounts_predicted: number
  actual_churn_events: number
  
  precision: 0.00–1.00                     # of predicted churns, % that actually churned
  recall: 0.00–1.00                        # of actual churns, % we predicted
  f1_score: 0.00–1.00
  brier_score: 0.00–1.00                   # target: < 0.08
  ece: 0.00–1.00                           # target: < 0.05
  
  intervention_outcomes:
    at_risk_saved_pct: 0.00–1.00           # AT_RISK accounts that didn't churn after intervention
    critical_saved_pct: 0.00–1.00
    
  surprises:
    unexpected_churns: number              # churned without AT_RISK or CRITICAL flag
    false_critical: number                 # flagged CRITICAL; renewed without issue
```

---

## Governance

**Model access:** Analytics Org (full), PM Org (read predictions), CS Org (read own accounts)
**Individual predictions:** Available only to CS team for their accounts; not used for automated decisions
**Retraining authorization:** T3 Analytics + PM approval for model changes
**Predictions log:** `memory/customer-intelligence/churn-predictions.jsonl` (append-only)
**EU AI Act:** This system is NOT used for automated individual decisions with legal effect — human CS team acts on predictions
