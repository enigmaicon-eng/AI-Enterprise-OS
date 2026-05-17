# Governance Health Scorer

**System ID:** `governance-health-scorer`
**Role:** Computes a composite governance health score for the enterprise AI OS — synthesizes constitutional compliance rates, approval chain completion, attestation coverage, policy currency, gate governance quality, and security governance signals into a single 0.0–1.0 score with dimensional breakdown; feeds the governance operations dashboard and the enterprise trigger engine
**Storage:** `memory/workflow-monitoring/governance-health-scores.yaml`

---

## Purpose

Governance health degrades subtly before it fails visibly. Attestation coverage slips from 99% to 96% over two weeks. Approval wait times creep from 15 minutes to 45 minutes. Constitutional clearance rates dip from 99.5% to 97%. Each individual signal is within tolerance; together they indicate a governance posture that is eroding. The governance health scorer synthesizes these signals into a single score that surfaces this composite degradation before individual metrics reach their alert thresholds.

---

## Health Dimensions

```yaml
GovernanceHealthDimensions:
  
  constitutional_compliance:
    weight: 0.30
    inputs: [constitutional_clearance_rate, absolute_violation_count, mandatory_violation_count, override_count]
    score_formula: "clearance_rate - absolute_penalty - mandatory_penalty - override_penalty"
    absolute_penalty: "absolute_violation_count × 0.30"    # Each absolute violation = -0.30
    mandatory_penalty: "mandatory_violation_count × 0.08"
    override_penalty: "override_count × 0.05"
    floor: 0.0                                              # Cannot go negative from penalties
    degraded_below: 0.90
    critical_below: 0.75
    description: "Constitutional AI principle adherence across all evaluated actions"
  
  approval_chain_health:
    weight: 0.20
    inputs: [approval_chain_completion_rate, approval_wait_time_p99_ms, authority_mismatch_rate]
    score_formula: "completion_rate × (1 - latency_penalty) × (1 - mismatch_penalty)"
    latency_penalty_formula: "min(0.40, max(0, (p99_wait_ms - p99_sla_ms) / p99_sla_ms × 0.20))"
    mismatch_penalty: "min(0.30, authority_mismatch_rate × 5)"
    degraded_below: 0.80
    critical_below: 0.65
    description: "Approval chain completion quality and latency vs SLA"
  
  attestation_coverage:
    weight: 0.20
    inputs: [attestation_coverage_rate, active_coverage_gaps]
    score_formula: "coverage_rate - gap_penalty"
    gap_penalty: "min(0.30, active_coverage_gaps × 0.05)"  # Each gap -0.05
    degraded_below: 0.92
    critical_below: 0.80
    description: "Fraction of required actions that have valid attestations"
  
  policy_currency:
    weight: 0.15
    inputs: [policy_drift_events_24h, avg_policy_version_lag_days]
    score_formula: "1 - drift_penalty - lag_penalty"
    drift_penalty: "min(0.40, policy_drift_events_24h × 0.10)"
    lag_penalty: "min(0.20, avg_policy_version_lag_days × 0.05)"
    degraded_below: 0.75
    critical_below: 0.60
    description: "How current and drift-free policies are during active workflow execution"
  
  gate_governance:
    weight: 0.10
    inputs: [gate_pass_rate, gate_cycles_avg]
    score_formula: "gate_pass_rate × (1 - rework_penalty)"
    rework_penalty: "min(0.25, (gate_cycles_avg - 1.0) × 0.12)"
    degraded_below: 0.75
    critical_below: 0.60
    description: "Quality gate performance from a governance perspective"
  
  security_governance:
    weight: 0.05
    inputs: [permission_denial_rate, injection_block_rate, scope_violation_rate]
    score_formula: "1 - violation_pressure"
    violation_pressure: "min(0.50, (permission_denial_rate + scope_violation_rate) × 3)"
    degraded_below: 0.80
    critical_below: 0.60
    description: "Security governance signal — denial and violation rates"
```

---

## Scoring Engine

```
compute_governance_health() → GovernanceHealthScore:
  
  # Load governance telemetry
  gov_metrics = governance_telemetry.get_latest_snapshot()
  attestation_state = load_attestation_coverage_state()
  policy_state = load_policy_drift_state()
  
  # Score each dimension
  const_score = compute_constitutional_score(gov_metrics)
  approval_score = compute_approval_chain_score(gov_metrics)
  attestation_score = compute_attestation_score(attestation_state)
  policy_score = compute_policy_currency_score(policy_state)
  gate_score = compute_gate_governance_score(gov_metrics)
  security_score = compute_security_governance_score(gov_metrics)
  
  scores = {
    constitutional_compliance: const_score,
    approval_chain_health: approval_score,
    attestation_coverage: attestation_score,
    policy_currency: policy_score,
    gate_governance: gate_score,
    security_governance: security_score
  }
  
  weights = {
    constitutional_compliance: 0.30,
    approval_chain_health: 0.20,
    attestation_coverage: 0.20,
    policy_currency: 0.15,
    gate_governance: 0.10,
    security_governance: 0.05
  }
  
  composite = sum(scores[dim] × weights[dim] for dim in weights)
  
  # Hard floor: any absolute constitutional violation caps at 0.50
  IF gov_metrics.constitutional.absolute_violations > 0:
    composite = min(composite, 0.50)
    # And publish immediate critical alert
    enterprise_event_bus.publish(
      topic = "alerts.critical",
      event_type = "GOVERNANCE_HEALTH_CRITICALLY_CAPPED",
      payload = {reason: "absolute_constitutional_violation", score: composite},
      priority = "CRITICAL"
    )
  
  health_score = GovernanceHealthScore(
    score_id = generate_uuid(),
    composite = round(composite, 3),
    dimensions = scores,
    critical_dimensions = [dim for dim, score in scores.items()
                           if score < GOVERNANCE_HEALTH_DIMENSIONS[dim].critical_below],
    degraded_dimensions = [dim for dim, score in scores.items()
                           if score < GOVERNANCE_HEALTH_DIMENSIONS[dim].degraded_below],
    status = classify_governance_status(composite),
    absolute_violations_active = gov_metrics.constitutional.absolute_violations > 0,
    computed_at = now()
  )
  
  persist_governance_health_score(health_score)
  
  enterprise_event_bus.publish(
    topic = "telemetry.health.scores",
    event_type = "GOVERNANCE_HEALTH_SCORE",
    payload = {
      score: composite,
      status: health_score.status,
      absolute_violations: gov_metrics.constitutional.absolute_violations
    }
  )
  
  RETURN health_score

compute_constitutional_score(gov_metrics) → float:
  
  clearance_rate = gov_metrics.constitutional.clearance_rate
  absolute_violations = gov_metrics.constitutional.absolute_violations
  mandatory_violations = gov_metrics.constitutional.mandatory_violations
  overrides = gov_metrics.constitutional.overrides
  
  score = clearance_rate
  score -= absolute_violations × 0.30
  score -= mandatory_violations × 0.08
  score -= overrides × 0.05
  
  RETURN max(0.0, min(1.0, score))

classify_governance_status(composite) → str:
  IF composite >= 0.92: RETURN "COMPLIANT"
  IF composite >= 0.80: RETURN "NOMINAL"
  IF composite >= 0.65: RETURN "DEGRADED"
  IF composite >= 0.50: RETURN "AT_RISK"
  RETURN "NON_COMPLIANT"
```

---

## Governance Risk Report

```
generate_governance_risk_report() → GovernanceRiskReport:
  
  current_score = get_current_governance_health_score()
  history = load_score_history("governance_health", hours=168)   # 7 days
  
  risk_factors = []
  
  # Check each dimension for risk
  FOR dim, score in current_score.dimensions.items():
    spec = GOVERNANCE_HEALTH_DIMENSIONS[dim]
    IF score < spec.degraded_below:
      risk_factors.append(GovernanceRiskFactor(
        dimension = dim,
        current_score = score,
        threshold = spec.degraded_below,
        severity = "CRITICAL" if score < spec.critical_below else "HIGH",
        description = spec.description,
        recommendation = generate_remediation_recommendation(dim, score)
      ))
  
  RETURN GovernanceRiskReport(
    generated_at = now(),
    composite_score = current_score.composite,
    governance_status = current_score.status,
    risk_factors = sorted(risk_factors, key=lambda r: r.current_score),
    trend_7d = compute_trend([s.composite for s in history]),
    worst_score_7d = min(s.composite for s in history) if history else null,
    recommendations = [r.recommendation for r in risk_factors]
  )
```

---

## Integration

**Called by:**
- `enterprise-telemetry/runtime-trigger-engine.md` — governance health threshold triggers
- `operational-command-center/governance-operations-dashboard.md` — compliance score display

**Calls:**
- `enterprise-telemetry/governance-telemetry.md` — governance metrics
- `governance-attestation/attestation-registry.md` — coverage state
- `enterprise-telemetry/enterprise-event-bus.md` — publishes governance health scores

**Writes to:** `memory/workflow-monitoring/governance-health-scores.yaml`
