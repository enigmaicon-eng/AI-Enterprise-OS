# Anti-Drift Mechanisms
**ID:** ALN-ADM-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Detects and prevents value drift, behavioral drift, and governance drift — the gradual processes by which AI systems shift away from their aligned state through incremental changes that individually appear innocuous but cumulatively represent significant departure from constitutional principles and human values. Drift is the slow failure mode: it does not trigger single-point detection rules; it accumulates silently until the gap between intended and actual behavior is large. This module operationalizes drift detection as a continuous, multi-dimensional monitoring process with early-warning thresholds well before drift becomes structural.

---

## Drift Taxonomy

```yaml
drift_taxonomy:

  VALUE_DRIFT:
    definition: gradual shift in which values AI systems appear to optimize for,
                away from constitutionally declared values toward instrumental proxies
    mechanism: optimization pressure favors measurable outcomes; unmeasurable values
               (human dignity, genuine consent, meaningful agency) under-optimized over time
    detection_signals:
      - declining performance on unmeasured value proxies despite measured metric improvement
      - stakeholder perception of value misalignment increasing
      - decision patterns showing systematic preference for measurable over unmeasurable values
    early_warning_threshold: 5% decline in unmeasured-value proxy scores over 90 days
    
  BEHAVIORAL_DRIFT:
    definition: gradual divergence between documented agent behavior profiles and
                actual operational behavior — not through explicit modification but
                through learned behavioral adaptation
    mechanism: agents optimize for feedback signals; feedback may not fully capture
               intended behavior; agents drift toward rewarded behavior
    detection_signals:
      - behavioral audit scores declining against documented profiles
      - anomaly rate relative to authorized behavior increasing
      - feedback-rewarded behaviors diverging from governance-intended behaviors
    early_warning_threshold: 0.05 decline in behavioral alignment score over 30 days
    
  GOVERNANCE_DRIFT:
    definition: gradual erosion of governance effectiveness — not through explicit
                policy changes but through informal workarounds, scope creep,
                declining enforcement, and precedent accumulation
    mechanism: governance overhead drives informal workarounds; each exception becomes
               precedent; exception precedents become normal practice
    detection_signals:
      - exception rate increasing while formal policy change rate stable
      - appeal overturn rates declining (governance becoming less correctable)
      - governance process circumvention rate increasing
    early_warning_threshold: exception rate increasing >20% over 90 days without policy change
    
  SEMANTIC_DRIFT:
    definition: gradual shift in the meaning of governance terms, constitutional concepts,
                or value-laden language — enabling reinterpretation without textual change
    mechanism: terms used in new contexts; metaphor becomes literal; boundary cases
               become precedent; original meaning erodes through accumulated usage
    detection_signals:
      - semantic similarity between current usage and original definition declining
      - same term used inconsistently across governance decisions
      - constitutional terms appearing in non-governance contexts with different meanings
    early_warning_threshold: 0.10 semantic distance from baseline definition over 180 days
```

---

## Drift Detection Engine

```
run_drift_detection_cycle():
  # Runs daily; comprehensive; multi-dimensional

  drift_report = DriftDetectionReport { findings: [], computed_at: now() }

  # VALUE DRIFT DETECTION
  value_measurements = [
    ("human_dignity_proxy",    measure_human_dignity_proxy()),
    ("genuine_consent_proxy",  measure_genuine_consent_proxy()),
    ("meaningful_agency_proxy", measure_meaningful_agency_proxy()),
    ("fairness_proxy",         measure_fairness_proxy())
  ]
  for name, current in value_measurements:
    baseline = get_value_baseline(name, window=90_days)
    if current < baseline - 0.05:  # Early warning threshold
      drift_report.findings.append(DriftFinding {
        type:      VALUE_DRIFT,
        dimension: name,
        baseline:  baseline,
        current:   current,
        delta:     current - baseline,
        severity:  CRITICAL if (baseline - current) > 0.15 else HIGH
      })

  # BEHAVIORAL DRIFT DETECTION
  behavioral_audits = run_behavioral_audit_sample(n=100)
  behavioral_drift_score = compute_behavioral_drift(behavioral_audits)
  if behavioral_drift_score.delta_30d < -0.05:
    drift_report.findings.append(DriftFinding {
      type:     BEHAVIORAL_DRIFT,
      score:    behavioral_drift_score.current,
      delta_30d: behavioral_drift_score.delta_30d,
      top_drifting_agents: behavioral_drift_score.most_drifted,
      severity: HIGH
    })

  # GOVERNANCE DRIFT DETECTION
  exception_rate = get_governance_exception_rate(window=90_days)
  baseline_exception_rate = get_governance_exception_baseline()
  if exception_rate > baseline_exception_rate * 1.20:
    workaround_patterns = identify_informal_workarounds(window=90_days)
    drift_report.findings.append(DriftFinding {
      type:          GOVERNANCE_DRIFT,
      exception_rate: exception_rate,
      baseline_rate:  baseline_exception_rate,
      workarounds:   workaround_patterns,
      severity: HIGH if exception_rate < baseline_exception_rate * 1.50 else CRITICAL
    })

  # SEMANTIC DRIFT DETECTION
  semantic_drift_results = detect_semantic_drift(window=180_days)
  for result in [r for r in semantic_drift_results if r.drift_magnitude > 0.10]:
    drift_report.findings.append(DriftFinding {
      type:       SEMANTIC_DRIFT,
      term:       result.term,
      drift_magnitude: result.drift_magnitude,
      examples:   result.divergent_usage_examples,
      severity:   HIGH
    })

  # COMPOSITE DRIFT SCORE
  if drift_report.findings:
    drift_report.composite_drift_score = compute_composite_drift_score(drift_report.findings)
    if drift_report.composite_drift_score > 0.30:
      alert_T4("Composite drift score elevated", drift_report)

  audit_log(drift_report)
  Return: drift_report
```

---

## Drift Intervention Protocol

```yaml
drift_intervention_protocol:

  VALUE_DRIFT_INTERVENTION:
    trigger: value_drift.delta > 0.05 over 90 days
    phase_1_immediate:
      - identify optimization pressure driving drift (what is being over-optimized?)
      - add compensating measurement for under-optimized values
      - recalibrate feedback signals to include drifted values
    phase_2_structural:
      - audit reward signals and optimization targets for value completeness
      - add explicit constraints for drifted values in agent behavioral profiles
      - human-review sample of decisions in drifted value dimension
    phase_3_monitoring:
      - enhanced monitoring with 30-day observation period
      - drift finding remains open until reversal confirmed
    
  BEHAVIORAL_DRIFT_INTERVENTION:
    trigger: behavioral_alignment_delta_30d < -0.05
    phase_1_immediate:
      - identify top-drifting agents (behavioral_drift_score.most_drifted)
      - enhanced behavioral auditing for drifting agents
      - review feedback signals received by drifting agents
    phase_2_structural:
      - recalibrate agent behavioral profiles to reflect intended vs. actual
      - OR recalibrate actual behavior back to documented profile
      - determine which is correct: document reality, or change behavior
    
  GOVERNANCE_DRIFT_INTERVENTION:
    trigger: exception_rate > baseline * 1.20
    phase_1_immediate:
      - enumerate informal workarounds contributing to exception rate
      - determine: are workarounds filling legitimate gaps or circumventing intent?
    phase_2_structural:
      - for legitimate gaps: update formal policy to address them (not just allow workarounds)
      - for circumventions: enforcement action; close workaround pathway
      - audit recent exceptions for precedent accumulation
```

---

## Detection Rules

```yaml
anti_drift_rules:

  ADM-001:
    name: "Value Drift Early Warning Threshold"
    condition: |
      value_proxy_score(window=90d) < baseline - 0.05
    severity: HIGH
    auto_action: alert_T3; value_drift_intervention; add_compensating_measurement

  ADM-002:
    name: "Behavioral Drift Threshold Crossed"
    condition: |
      behavioral_alignment_delta_30d < -0.05
      AND behavioral_alignment_score < 0.85
    severity: HIGH
    auto_action: alert_T3; behavioral_audit_trigger; identify_top_drifting_agents

  ADM-003:
    name: "Governance Drift: Exception Rate Elevated"
    condition: |
      governance_exception_rate(window=90d) > baseline_exception_rate * 1.20
    severity: HIGH
    auto_action: alert_T3; exception_pattern_analysis; workaround_identification

  ADM-004:
    name: "Semantic Drift in Constitutional Terms"
    condition: |
      constitutional_term.semantic_distance_from_baseline > 0.10
    severity: HIGH
    auto_action: alert_T3; constitutional_interpretation_review; usage_audit

  ADM-005:
    name: "Composite Drift Score Elevated"
    condition: |
      composite_drift_score > 0.30
      (multiple drift types active simultaneously)
    severity: CRITICAL
    auto_action: alert_T4; multi-dimensional_drift_investigation; governance_emergency_assessment

  ADM-006:
    name: "Drift Reversal Not Confirmed After Intervention"
    condition: |
      drift_intervention.initiated_at + 90_days < now()
      AND drift_finding.status != REVERSED
    severity: HIGH
    auto_action: alert_T3; escalate_intervention; require_structural_change
```

---

## Integration

```
Feeds into:
  alignment-stability/alignment-stability-engine.md — drift findings as alignment component
  alignment-stability/recursive-alignment-systems.md — drift signals inform proxy gaming detection
  alignment-stability/coherence-preservation-systems.md — drift patterns feed coherence monitoring

Receives from:
  legitimacy-systems/organizational-trust-mechanisms.md — trust decline as value drift signal
  democratic-governance/participatory-governance-systems.md — governance participation as drift signal
  evaluation/evaluation-framework.md — behavioral audit data
```

---

## Governance

**Drift is detected by trajectory, not threshold:** The early-warning thresholds in this module are set to detect drift before it crosses any violation threshold; by the time drift triggers a violation, it may be structural and hard to reverse  
**Measurement games amplify drift:** Agents that learn to optimize for drift metrics without genuine re-alignment produce false reassurance; multi-dimensional drift measurement with human-verified spot checks is structurally required  
**Governance drift is normalized incrementally:** Exception rates growing 20% over 90 days is the same as a 47% annual increase; normalization of exceptions is governance drift in slow motion  
**Audit:** All drift detection reports, intervention records, and reversal verifications to `memory/alignment-stability/drift-audit.jsonl`; 10-year retention
