# Violation Pattern Analyzer
**ID:** CIN-VPA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Mines the violation record history to surface systemic patterns that point to structural compliance weaknesses rather than isolated agent errors. When the same type of violation recurs across multiple agents, in particular workflows, or at specific times, the root cause is almost never the individual agent — it is a policy gap, a training deficit, a workflow design flaw, or a control failure. The Violation Pattern Analyzer finds these systemic causes and feeds them back into policy adaptation, agent training, and workflow redesign.

---

## Pattern Taxonomy

```yaml
pattern_types:

  TEMPORAL_PATTERN:
    description: Violations cluster at specific times (end of sprint, quarter-end, deployment windows)
    signals: violation_timestamp distribution; compare to workload_volume_by_time
    example: "GDPR data retention violations spike every Friday when batch jobs run"
    root_cause_hypothesis: automated job running outside policy-aware context
    
  AGENT_CLUSTER_PATTERN:
    description: Violations concentrate in a specific agent class or cohort
    signals: violation_rate by agent_class > 2× baseline
    example: "Engineering Org agents violate data minimization at 4× rate of PM Org agents"
    root_cause_hypothesis: training gap; behavioral contract misconfiguration; tool design
    
  WORKFLOW_STAGE_PATTERN:
    description: Violations cluster at a specific stage in a workflow
    signals: violation_rate by workflow_step > 2× step_baseline
    example: "90% of cross-border transfer violations occur at workflow step WF-005-EU:step_7"
    root_cause_hypothesis: missing compliance gate in workflow definition
    
  DATA_CLASS_SPECIFIC_PATTERN:
    description: Violations cluster around specific data classes
    signals: violation_rate per data_class vs. access_frequency per data_class
    example: "Special category health data accesses violate consent policy at 6× rate"
    root_cause_hypothesis: policy not surfaced at data access point; data class misclassification
    
  JURISDICTION_PAIR_PATTERN:
    description: Violations cluster at specific jurisdiction pair interactions
    signals: cross_border_violation_rate by (source_jurisdiction, target_jurisdiction) pair
    example: "EU→US transfers violate TIA refresh requirement in 30% of cases"
    root_cause_hypothesis: TIA expiry not tracked; reminder system failure
    
  RECURRENCE_PATTERN:
    description: Same agent violates same policy repeatedly after remediation
    signals: violation_recurrence_rate > 0.20 within 30 days of prior violation
    example: "Agent AGT-042 has violated GDPR Art.5 data minimization 3 times in 60 days"
    root_cause_hypothesis: remediation was superficial; behavioral contract not updated
    
  CASCADE_PATTERN:
    description: One violation reliably precedes another violation of a different type
    signals: conditional probability P(violation_B | violation_A within 7 days) > 0.40
    example: "Data access log tampering always precedes cross-border transfer violation"
    root_cause_hypothesis: agent attempting to evade detection; T4 security review required
```

---

## Pattern Mining Engine

```
mine_violation_patterns(lookback_days=90):

  violations = load_violations(last_days=lookback_days, status=[RESOLVED, OPEN, EXCEPTION_GRANTED])
  
  patterns_detected = []
  
  # Mine each pattern type
  for pattern_type in PATTERN_TAXONOMY:
  
    if pattern_type == TEMPORAL_PATTERN:
      hourly_counts = group_by_hour(violations)
      peaks = detect_statistical_peaks(hourly_counts, threshold=2.5_sigma)
      if peaks: patterns_detected.append(build_pattern(TEMPORAL, peaks))
      
    elif pattern_type == AGENT_CLUSTER_PATTERN:
      rates_by_class = compute_violation_rates(violations, group_by=agent_class)
      outliers = find_outliers(rates_by_class, multiplier=2.0)
      if outliers: patterns_detected.append(build_pattern(AGENT_CLUSTER, outliers))
      
    elif pattern_type == WORKFLOW_STAGE_PATTERN:
      rates_by_step = compute_violation_rates(violations, group_by=workflow_step)
      outliers = find_outliers(rates_by_step, multiplier=2.0)
      if outliers: patterns_detected.append(build_pattern(WORKFLOW_STAGE, outliers))
      
    elif pattern_type == CASCADE_PATTERN:
      pairs = find_sequential_violations(violations, within_days=7)
      significant_pairs = [(a, b) for (a, b, p) in pairs if p > 0.40]
      if significant_pairs:
        patterns_detected.append(build_pattern(CASCADE, significant_pairs))
        if any_security_implications(significant_pairs):
          alert(T4 + Security_Org, "CASCADE pattern with security implications detected")
          
    # [similar logic for other pattern types]
    
  # Deduplicate (same pattern detected in overlapping windows)
  patterns_detected = deduplicate_patterns(patterns_detected)
  
  Return: patterns_detected
```

---

## Pattern Record Schema

```yaml
violation_pattern:
  pattern_id: PAT-{NNN}
  detected_at: ISO8601
  pattern_type: string
  
  evidence:
    violation_ids: [VIO-{NNN}]         # sample of violations contributing to pattern
    violation_count: integer
    lookback_window_days: integer
    statistical_significance: float   # p-value or sigma level
    
  characterization:
    description: string (max 500 chars)
    affected_jurisdictions: [JUR-{XX}]
    affected_domains: [string]
    affected_agent_classes: [string]
    affected_workflows: [string]
    
  root_cause:
    hypothesis: string
    confidence: HIGH | MEDIUM | LOW
    confirmed: boolean
    confirmed_by: string | null
    
  recommendations:
    - type: POLICY_CHANGE | CONTROL_ADD | WORKFLOW_REDESIGN | AGENT_TRAINING | BEHAVIORAL_CONTRACT_UPDATE | T4_REVIEW
      target: string
      priority: IMMEDIATE | THIS_SPRINT | NEXT_CYCLE
      detail: string
      
  lifecycle:
    status: OPEN | IN_REMEDIATION | RESOLVED | MONITORING
    routed_to: [string]               # which systems received this pattern
    resolved_at: ISO8601 | null
```

---

## Pattern Routing

```yaml
pattern_routing:

  POLICY_GAP_PATTERNS:
    router: policy-adaptation-engine.md
    action: draft policy strengthening for affected domain + jurisdiction
    priority: per pattern severity
    
  WORKFLOW_DESIGN_PATTERNS:
    router: Engineering Org (workflow maintainer)
    action: insert compliance gate at identified workflow step
    priority: URGENT if > 10 violations at that step in 30 days
    
  AGENT_TRAINING_PATTERNS:
    router: Agent Intelligence (behavioral-adaptation)
    action: targeted behavioral contract update for affected agent class
    priority: per recurrence rate
    
  RECURRENCE_PATTERNS:
    router: automated-remediation-engine.md + compliance-state-machine.md
    action: escalate to T3 review; extended monitoring; behavioral contract audit
    priority: IMMEDIATE if recurrence within 7 days
    
  CASCADE_PATTERNS_WITH_SECURITY_IMPLICATIONS:
    router: T4 + Security Org
    action: immediate security investigation; runtime quarantine evaluation
    priority: IMMEDIATE
    
  CONTROL_GAP_PATTERNS:
    router: control-effectiveness-monitor.md
    action: flag control for emergency review; consider adding new control
    priority: per violation severity
```

---

## Pattern Feedback Loop

```
record_pattern_outcome(pattern_id, outcome):

  # Called when a routed recommendation is acted upon and an outcome is observed
  pattern = load_pattern(pattern_id)
  
  pattern.lifecycle.status = RESOLVED if outcome.violation_rate_reduced else MONITORING
  
  # Feed back to prediction models
  compliance_predictor.add_training_example(
    features=pattern.characterization,
    label=outcome.violation_rate_after_vs_before,
    context="pattern_driven_intervention"
  )
  
  # Feed back to policy effectiveness
  if outcome.policy_change_made:
    policy_adaptation_engine.record_effectiveness(
      policy_id=outcome.policy_id,
      before_violation_rate=pattern.baseline_violation_rate,
      after_violation_rate=outcome.violation_rate_after
    )
```

---

## Integration

```
Feeds into:
  policy-adaptation-engine.md — POLICY_GAP patterns trigger new policy drafts
  compliance-predictor.md — patterns are features for violation forecasting
  compliance-learning-system.md — patterns and outcomes feed learning knowledge base
  compliance-dashboard.md — top patterns surfaced in compliance risk section

Receives from:
  compliance-schema.md — violation records (VIO-{NNN}) are the primary input
  compliance-decision-engine.md — BLOCK/VIOLATION decisions create violation records
  automated-remediation-engine.md — remediation outcomes enable pattern resolution
```

---

## Governance

**Pattern confirmation is human-gate:** Root cause hypotheses above LOW confidence require human review before recommendations are acted upon  
**Cascade patterns with security implications:** Always T4 immediately; no automated routing to lower authority  
**Pattern retention:** All patterns retained permanently as organizational learning; resolved patterns archived, not deleted  
**Mining cadence:** Full mining run weekly; streaming detection for CASCADE and RECURRENCE patterns runs continuously  
**Audit:** All patterns to `memory/compliance-intelligence/violation-patterns.jsonl`
