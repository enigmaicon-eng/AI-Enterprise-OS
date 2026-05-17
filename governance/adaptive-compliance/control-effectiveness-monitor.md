# Control Effectiveness Monitor
**ID:** ACE-CEM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Continuously measures whether compliance controls are actually working — not just whether they are deployed. The Control Effectiveness Monitor scores every active control across four dimensions, detects degradation before it becomes a compliance gap, recommends compensating controls when primary controls weaken, and feeds effectiveness data back into policy adaptation and risk scoring. A control that is deployed but ineffective is worse than no control: it creates false confidence.

---

## Control Catalog Schema

```yaml
compliance_control:
  control_id: CTL-{NNN}
  name: string
  type: PREVENTIVE | DETECTIVE | CORRECTIVE | COMPENSATING
  
  domain: DATA_PRIVACY | AI_GOVERNANCE | FINANCIAL | SECTOR_SPECIFIC | OPERATIONAL
  jurisdictions: [JUR-{XX}, ...]
  regulations_addressed: [string]
  
  policy_ids: [POL-{NNN}, ...]        # policies this control enforces
  
  implementation:
    mechanism: AUTOMATED | SEMI_AUTOMATED | MANUAL
    agent_responsible: string
    execution_frequency: REAL_TIME | HOURLY | DAILY | WEEKLY | ON_DEMAND
    
  effectiveness:
    current_score: float (0.00–1.00)
    score_trend: IMPROVING | STABLE | DEGRADING
    last_evaluated: ISO8601
    next_review: ISO8601
    
  thresholds:
    EFFECTIVE: >= 0.80
    MARGINAL: 0.60–0.79
    DEGRADED: 0.40–0.59
    FAILED: < 0.40
    
  compensating_controls: [CTL-{NNN}]  # activated if this control degrades
```

---

## Effectiveness Scoring

```
score_control_effectiveness(control_id, evaluation_window_days=30):

  control = load_control(control_id)
  events = get_control_events(control_id, last_days=evaluation_window_days)
  
  # Dimension 1: Coverage (0.00–1.00)
  # % of in-scope events where control was applied
  coverage = events.applied_count / events.in_scope_count
  
  # Dimension 2: Detection Rate (0.00–1.00)
  # % of actual violations that the control detected (recall)
  violations_in_scope = get_confirmed_violations(control.domain, control.jurisdictions, evaluation_window_days)
  detected_by_control = violations_in_scope.filter(detected_by=control_id)
  detection_rate = detected_by_control.count / max(violations_in_scope.count, 1)
  
  # Dimension 3: False Positive Rate (inverted: lower FP → higher score)
  # FP: control flagged something that was not a violation
  fp_events = events.filter(outcome=FALSE_POSITIVE)
  fp_rate = fp_events.count / max(events.flagged_count, 1)
  fp_score = max(0, 1.0 - (fp_rate * 5))  # 20% FP rate → 0.0 score
  
  # Dimension 4: Remediation Success Rate (0.00–1.00)
  # % of control-triggered remediations that succeeded
  triggered_remediations = get_remediations_by_control(control_id, evaluation_window_days)
  success_rate = triggered_remediations.filter(status=COMPLETED).count / max(triggered_remediations.count, 1)
  
  # Composite score (weighted)
  composite = (
    coverage        * 0.30 +
    detection_rate  * 0.35 +
    fp_score        * 0.15 +
    success_rate    * 0.20
  )
  
  # Update control record
  update_control_score(control_id, composite, trend=compute_trend(control_id))
  
  Return: ControlEffectivenessResult {
    control_id, composite, coverage, detection_rate, fp_score, success_rate,
    status: classify_status(composite), trend, evaluation_window_days
  }
```

---

## Degradation Detection

```yaml
degradation_detection:

  trend_analysis:
    window: 7 consecutive days of daily scores
    DEGRADING: current score < (90-day average - 0.10)
    IMPROVING: current score > (90-day average + 0.05)
    STABLE: neither
    
  alert_thresholds:
    score_drops_below_0_80: MARGINAL — T3 notification within 4 hours
    score_drops_below_0_60: DEGRADED — T3 alert within 1 hour; compensating control activated
    score_drops_below_0_40: FAILED — T4 alert within 15 minutes; emergency compensating; policy review
    score_zero: CRITICAL — T4 immediate; all affected policy checks elevated to REQUIRE_REVIEW
    
  degradation_causes:
    COVERAGE_GAP: new agent classes or data flows not covered by control
    DETECTION_MISS: violations occurring that control does not detect (model drift, new patterns)
    FP_EXPLOSION: too many false positives causing legitimate actions to be blocked
    REMEDIATION_FAILURE: downstream remediation system not completing successfully
    
  degradation_response:
    COVERAGE_GAP: extend control scope; alert Architecture Org
    DETECTION_MISS: retrain detection model or strengthen rule set; activate compensating
    FP_EXPLOSION: recalibrate thresholds; human review of recent FP cases
    REMEDIATION_FAILURE: escalate to automated-remediation-engine; investigate failure root cause
```

---

## Compensating Control Activation

```
activate_compensating_control(failed_control_id):

  failed = load_control(failed_control_id)
  compensating_ids = failed.compensating_controls
  
  if not compensating_ids:
    # No pre-registered compensating control
    apply REQUIRE_REVIEW to all decisions governed by failed control
    alert T4: "No compensating control for CTL-{NNN}; manual review required"
    Return
    
  for comp_id in compensating_ids:
    comp = load_control(comp_id)
    if comp.effectiveness.current_score >= 0.70:
      activate_control(comp_id, scope=failed.scope)
      log COMPENSATING_CONTROL_ACTIVATED {failed_control_id, comp_id, activated_at}
      break  # activate first healthy compensating control
  else:
    # All compensating controls also degraded
    apply most_restrictive_mode(failed.domain, failed.jurisdictions)
    alert T4 + Legal Org immediately
```

---

## Review Cadence

```yaml
review_cadence:
  REAL_TIME: effectiveness metrics updated continuously for automated controls
  DAILY: trend calculation + degradation alert evaluation for all controls
  WEEKLY: control health report to Governance Org; identify controls entering MARGINAL
  MONTHLY: deep review of DEGRADED/FAILED controls; compensating control audit; coverage gap analysis
  QUARTERLY: full control catalog review; effectiveness benchmark against industry standards; T3 sign-off
  ANNUAL: control architecture review; retire obsolete controls; add controls for new regulations; T4 sign-off
  
  control_lifecycle:
    NEW_CONTROL_PROBATION: 90 days monitored before standard thresholds apply
    RETIRED_CONTROL_ARCHIVE: retained 7 years (regulatory evidence)
    COMPENSATING_CONTROL_REVIEW: monthly (should not remain compensating indefinitely)
```

---

## Integration

```
Feeds into:
  compliance-engine.md — control effectiveness gates compliance check confidence
  policy-adaptation-engine.md — effectiveness drop triggers policy strengthening
  compliance-risk-scorer.md — low effectiveness → higher risk score for affected domain
  compliance-dashboard.md — control effectiveness matrix visualized here

Receives from:
  automated-remediation-engine.md — remediation outcomes feed success rate dimension
  violation-pattern-analyzer.md — undetected violations expose detection rate gaps
  compliance-decision-engine.md — decision outcomes (FP events) feed false positive dimension
```

---

## Governance

**No control below 0.40 can be the sole control for a regulated domain:** A FAILED control must be accompanied by compensating control or REQUIRE_REVIEW elevation  
**Control gaps are T4 items:** Any domain with no effective control (all controls FAILED + no compensating) is a T4 escalation  
**Effectiveness data is evidence:** Control effectiveness records are regulatory audit evidence; retained 7 years minimum  
**No self-scoring:** Controls do not score themselves; scoring engine is independent of control execution path  
**Audit:** All effectiveness scores and degradation events to `memory/adaptive-compliance/control-effectiveness.jsonl`
