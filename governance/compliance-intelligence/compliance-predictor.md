# Compliance Predictor
**ID:** CIN-CPR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org + Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Predicts compliance failures before they occur, giving the organization time to intervene. The Compliance Predictor uses historical violation data, risk score trajectories, control effectiveness trends, regulatory calendar signals, and agent behavioral patterns to forecast: which agents are likely to violate which regulations, which controls are about to fail, and which regulatory deadlines will be missed without intervention. Predictions trigger proactive interventions, not just reactive responses.

---

## Prediction Models

```yaml
prediction_models:

  VIOLATION_FORECASTER:
    description: Predicts likelihood of compliance violation in next N days per agent + domain
    algorithm: Gradient Boosted Trees (XGBoost) with calibration isotonic regression
    features:
      - risk_score_trend (last 30 days)
      - violation_history (last 90 days, recency-weighted)
      - compliance_state_trajectory (transitions in last 30 days)
      - workload_volume (actions per day, trend)
      - new_capability_activation (new workflow or data class in last 7 days)
      - regulatory_intelligence_signals (RIU count for agent's jurisdictions, last 30 days)
      - control_effectiveness_trend (last 14 days for applicable controls)
    output: probability of at least one violation per agent per domain per horizon
    horizons: 7 | 14 | 30 | 90 days
    calibration_target: ECE < 0.05 (Expected Calibration Error)
    retraining: weekly (incremental); monthly (full retraining)
    
  CONTROL_DECAY_PREDICTOR:
    description: Predicts when a control's effectiveness score will fall below 0.70
    algorithm: Time-series regression (Prophet with changepoint detection)
    features:
      - effectiveness_score_time_series (daily, last 180 days)
      - workload_trend (actions governed by control, last 30 days)
      - recent_policy_changes_affecting_control
      - compensating_control_activation_history
    output: predicted_breach_date (effectiveness < 0.70); confidence_interval
    prediction_horizon: 90 days
    alert_threshold: predicted breach within 30 days with confidence > 0.70
    retraining: monthly
    
  REGULATORY_DEADLINE_PREDICTOR:
    description: Predicts risk of missing compliance deadlines from regulatory calendar
    algorithm: Rule-based + ML hybrid (ML handles effort estimation; rules handle hard deadlines)
    features:
      - days_to_deadline
      - estimated_implementation_effort (from impact-assessment-engine)
      - current_implementation_velocity (policy changes per week)
      - complexity_score (number of policies/controls to update)
    output: probability of deadline miss; recommended start date for implementation
    alert_trigger: probability_of_miss > 0.30 with deadline < 60 days
    
  BEHAVIORAL_DRIFT_DETECTOR:
    description: Detects agents whose behavior is drifting toward compliance boundaries
    algorithm: Isolation Forest + LSTM autoencoder for anomaly detection
    features:
      - action_type_distribution (rolling 7 days vs. 90-day baseline)
      - data_class_access_pattern
      - cross_border_operation_frequency
      - constitutional_proximity_scores (rolling average, last 14 days)
    output: drift_score (0.00–1.00); drift_direction (toward which boundary)
    alert_threshold: drift_score > 0.70 sustained for 3 consecutive days
    retraining: weekly
```

---

## Prediction Output Schema

```yaml
compliance_prediction:
  prediction_id: PRD-{NNN}
  model_id: string
  generated_at: ISO8601
  
  subject:
    subject_type: AGENT | CONTROL | REGULATORY_DEADLINE | AGENT_CLASS
    subject_id: string
    
  prediction:
    horizon_days: integer
    predicted_event: string             # e.g., "violation_GDPR_data_retention", "control_CTL-042_decay"
    probability: float (0.00–1.00)
    confidence_interval: {low: float, high: float}
    predicted_by: ISO8601               # when the event is predicted to occur
    
  drivers:
    top_features: [{feature_name, feature_value, contribution_score}]  # top 3 SHAP contributors
    narrative: string (max 200 chars)  # human-readable explanation
    
  recommended_action:
    action_type: POLICY_REVIEW | CONTROL_REINFORCE | AGENT_REMEDIATION | REGULATORY_PREP | NONE
    urgency: IMMEDIATE | THIS_WEEK | THIS_MONTH
    action_detail: string
    
  actioned:
    triggered_intervention: boolean
    intervention_id: string | null
    outcome: AVERTED | OCCURRED_ANYWAY | PENDING | null
```

---

## Early Warning System

```
evaluate_early_warnings():
  # Runs every 6 hours

  # Check violation forecaster
  for agent in all_active_agents:
    for domain in applicable_domains(agent):
      prediction = VIOLATION_FORECASTER.predict(agent, domain, horizon=14)
      
      if prediction.probability >= 0.75:
        alert(T3, f"High violation probability for {agent} in {domain}: {prediction.probability:.0%}")
        queue_proactive_review(agent, domain, prediction)
        
      elif prediction.probability >= 0.50:
        escalate_monitoring(agent, domain)
        log_warning(PRD-{NNN})
        
  # Check control decay predictor
  for control in all_active_controls:
    prediction = CONTROL_DECAY_PREDICTOR.predict(control)
    
    if prediction.predicted_breach_date and days_until(prediction.predicted_breach_date) <= 30:
      if prediction.confidence_interval.low >= 0.60:
        alert(T3, f"Control {control} predicted to degrade by {prediction.predicted_breach_date}")
        trigger(policy-adaptation-engine, action=PREPARE_COMPENSATING_CONTROL)
        
  # Check regulatory deadlines
  upcoming = regulatory-calendar.get_deadlines(within_days=60)
  for deadline in upcoming:
    prediction = REGULATORY_DEADLINE_PREDICTOR.predict(deadline)
    if prediction.probability_of_miss >= 0.30:
      alert(Governance_Org, f"Deadline risk: {deadline.regulation} on {deadline.date}")
      
  # Check behavioral drift
  for agent in all_active_agents:
    drift = BEHAVIORAL_DRIFT_DETECTOR.score(agent)
    if drift.score >= 0.70:
      alert(T3, f"Behavioral drift detected for {agent}: {drift.drift_direction}")
      trigger(compliance-state-machine, event=DRIFT_DETECTED, subject=agent)
```

---

## Model Performance Monitoring

```yaml
model_monitoring:
  metrics_tracked:
    VIOLATION_FORECASTER:
      - precision_at_30_days: target > 0.70
      - recall_at_30_days: target > 0.65
      - ECE: target < 0.05
      - brier_score: target < 0.15
      
    CONTROL_DECAY_PREDICTOR:
      - MAE_days: target < 10 (mean absolute error in days to breach)
      - coverage_at_30_days: % of breaches predicted > 30 days in advance; target > 60%
      
    BEHAVIORAL_DRIFT_DETECTOR:
      - false_positive_rate: target < 0.10
      - detection_lead_time: target > 5 days before violation
      
  degradation_response:
    if_metric_below_threshold_for_7_days:
      - alert Governance Org + Analytics Org
      - revert to last validated model version
      - schedule emergency retraining
      
  retraining_data:
    source: compliance_record JSONL store (violation_records only for supervised models)
    minimum_training_records: 500 violation events before ML model is used (rule-based fallback otherwise)
    label_lag: 14 days (give time for violations to be confirmed before labeling)
```

---

## Integration

```
Feeds into:
  compliance-state-machine.md — drift detection triggers MONITORING state
  policy-adaptation-engine.md — deadline miss predictions trigger proactive policy review
  compliance-dashboard.md — prediction scores and early warnings surfaced here
  automated-remediation-engine.md — high-probability violations trigger preemptive action

Receives from:
  compliance-risk-scorer.md — risk score history used as features
  control-effectiveness-monitor.md — effectiveness trends used as features
  violation-pattern-analyzer.md — pattern classifications used as features
  regulatory-calendar.md — deadlines used by deadline predictor
  regulatory-intelligence-system.md — RIU signals used as features
```

---

## Governance

**Predictions are advisory:** Predictions inform decisions but do not autonomously block actions; intervention requires a compliance-decision-engine decision  
**Calibration mandatory:** Every prediction model must maintain ECE < 0.10; uncalibrated models are disabled  
**Prediction transparency:** Every prediction includes SHAP top-3 feature contributions; narrative explanation required  
**False positive management:** If a predicted violation is averted but prediction was incorrect (agent was never at risk), this feeds back as a negative training example  
**Audit:** All predictions to `memory/compliance-intelligence/predictions.jsonl`; outcomes linked to predictions for model evaluation
