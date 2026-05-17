# Agent Performance Benchmarks

## Purpose
Defines the canonical performance targets, baseline benchmarks, and standardized evaluation scenarios for every agent type and tier. Benchmarks provide the reference points against which individual performance is measured, ensure consistent evaluation across the organization, and establish what "good enough" and "excellent" look like for each role.

---

## Benchmark Architecture

```yaml
benchmark_architecture:
  types:
    CAPABILITY_BENCHMARK:
      description: Tests proficiency in a specific capability
      format: standardized task set with known correct outputs
      used_for: capability assessment; proficiency certification
    
    ROLE_BENCHMARK:
      description: Tests overall performance for an agent role and tier
      format: representative scenario set covering all performance dimensions
      used_for: tier promotion assessment; annual performance review
    
    REGRESSION_BENCHMARK:
      description: Minimal benchmark run after major capability changes
      format: subset of CAPABILITY_BENCHMARK (fastest to run)
      used_for: detecting capability regression after updates
    
    COMPARATIVE_BENCHMARK:
      description: Identical tasks run across multiple agents for relative comparison
      format: blind evaluation (evaluator doesn't know which agent produced which output)
      used_for: cohort calibration; top-performer identification
```

---

## Performance Targets by Agent Type and Tier

```yaml
performance_targets:
  GOVERNANCE_AGENT:
    T3:
      output_quality_score: >= 0.75
      calibration_error: <= 0.10
      sla_compliance_rate: >= 0.90
      task_completion_rate: >= 0.92
      escalation_rate: <= 0.10
      decision_reversal_rate: <= 0.08
    T4:
      output_quality_score: >= 0.82
      calibration_error: <= 0.07
      sla_compliance_rate: >= 0.95
      task_completion_rate: >= 0.96
      escalation_rate: <= 0.05
      decision_reversal_rate: <= 0.05
  
  ORCHESTRATION_AGENT:
    T2:
      task_completion_rate: >= 0.90
      sla_compliance_rate: >= 0.88
      escalation_rate: <= 0.15
      avg_task_duration_vs_benchmark: <= 1.40 ×
    T3:
      task_completion_rate: >= 0.94
      sla_compliance_rate: >= 0.92
      escalation_rate: <= 0.10
      avg_task_duration_vs_benchmark: <= 1.20 ×
  
  ENGINEERING_AGENT:
    T1:
      output_quality_score: >= 0.65
      error_rate: <= 0.12
      sla_compliance_rate: >= 0.85
    T2:
      output_quality_score: >= 0.72
      error_rate: <= 0.08
      sla_compliance_rate: >= 0.90
      factual_correctness: >= 0.88
  
  RESEARCH_AGENT:
    T2:
      output_quality_score: >= 0.72
      knowledge_application_rate: >= 0.35
      calibration_error: <= 0.12
      factual_correctness: >= 0.88
    T3:
      output_quality_score: >= 0.78
      knowledge_application_rate: >= 0.40
      calibration_error: <= 0.09
      factual_correctness: >= 0.91
  
  ANALYTICS_AGENT:
    T2:
      output_quality_score: >= 0.73
      factual_correctness: >= 0.91
      calibration_error: <= 0.09
    T3:
      output_quality_score: >= 0.80
      factual_correctness: >= 0.93
      calibration_error: <= 0.07
  
  QA_AGENT:
    T2:
      output_quality_score: >= 0.75
      error_detection_rate: >= 0.85    # fraction of seeded errors correctly identified
      false_positive_rate: <= 0.15     # fraction of correct items flagged as errors
```

---

## Benchmark Scenario Library

```yaml
benchmark_scenarios:
  SCENARIO-CAP-CONST-001:
    name: Constitutional Evaluation — Clear Pass
    capability: constitutional_evaluation
    difficulty: BASIC
    description: Evaluate an action that clearly passes constitutional checks
    input: {action: "Route workflow to T2 reviewer", context: standard_routing}
    expected_output: {evaluation: PASS, confidence: >= 0.85, reasoning_present: true}
    scoring:
      correct_classification: 60%
      confidence_calibration: 20%
      reasoning_quality: 20%
  
  SCENARIO-CAP-CONST-002:
    name: Constitutional Evaluation — Ambiguous Case
    capability: constitutional_evaluation
    difficulty: ADVANCED
    description: Evaluate an action where constitutional applicability is genuinely uncertain
    input: {action: "Expand agent scope in novel scenario", context: novel_domain}
    expected_output: {evaluation: CONDITIONAL, triggers_CONST-03: true, escalation_recommended: true}
    scoring:
      trigger_identification: 40%
      escalation_judgment: 40%
      confidence_calibration: 20%
  
  SCENARIO-PERF-TRIAGE-001:
    name: Multi-Item Triage Decision
    capability: escalation_judgment
    difficulty: INTERMEDIATE
    description: Given 5 items with different risk profiles, correctly prioritize
    input: {items: [5 items with varying risk/urgency/reversibility]}
    expected_output: {priority_order: correct_order, rationale: present, escalation_thresholds: correctly_identified}
    scoring:
      priority_ordering: 50%
      threshold_identification: 30%
      rationale_quality: 20%
  
  SCENARIO-QUAL-ARTIFACT-001:
    name: Artifact Quality Assessment
    capability: quality_assurance
    difficulty: STANDARD
    description: Assess quality of a knowledge unit draft with seeded deficiencies
    input: {draft_ku: KU_with_3_seeded_deficiencies}
    expected_output: {issues_identified: all_3, quality_score: within_0.10_of_ground_truth}
    scoring:
      issue_detection: 60%
      quality_score_accuracy: 40%
  
  SCENARIO-CALIB-001:
    name: Calibration Self-Assessment
    capability: probabilistic_reasoning
    difficulty: STANDARD
    description: Agent answers 20 factual questions AND provides confidence for each
    expected_outcome: calibration_error (|confidence - accuracy|) < 0.12
    scoring:
      factual_accuracy: 50%
      calibration_accuracy: 50%
```

---

## Benchmark Governance

```yaml
benchmark_governance:
  benchmark_lifecycle:
    creation:
      requires: Tier-3+ approval + subject-matter-expert review
      validation: at least 5 pilot evaluations before production use
    
    revision:
      trigger: capability definition changes; benchmark accuracy < 0.70 (benchmark itself is wrong)
      process: draft new version → pilot → approval → deploy with migration plan
      backward_compatibility: old versions archived for re-scoring historical assessments
    
    deprecation:
      trigger: capability deprecated or fundamentally changed
      process: 90-day migration window; all agents on old version must re-assess
  
  benchmark_administration:
    randomization: benchmark items drawn from pool (prevents memorization)
    pool_size: >= 3× the active scenario count (enough variety)
    blind_evaluation: human evaluators do not know which agent they are scoring
    anti_gaming:
      no_benchmark_preview: agents cannot see benchmark items before administration
      randomized_ordering: different order for each agent administration
      time_limits: each scenario has a maximum time limit
  
  scoring_calibration:
    human_scorer_calibration:
      frequency: quarterly
      method: same artifact scored by 3 human scorers; inter-rater reliability check
      target: Cohen's kappa >= 0.75
      on_failure: recalibrate scoring rubrics + re-train evaluators
```

---

## Benchmark Reporting

```yaml
benchmark_reporting:
  individual_benchmark_report:
    frequency: after each benchmark administration
    content: per-scenario scores; dimension breakdown; comparison to target; recommendations
    recipient: agent + supervisor
  
  benchmark_validity_report:
    frequency: quarterly
    content: benchmark accuracy (do scores predict actual performance?); scenario difficulty calibration
    recipient: capability governance lead
  
  enterprise_benchmark_health:
    frequency: semi-annually
    content: pass rates by scenario; cohort comparison; benchmark version adoption
    recipient: capability governance lead + Tier-3+ leadership
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-performance/agent-performance-model.md` | Target values for each dimension |
| `agent-capabilities/agent-capability-assessment.md` | Benchmark used as BENCHMARK assessment method |
| `agent-performance/agent-performance-analytics.md` | Benchmark results feed cohort analysis |
| `agent-capabilities/agent-capability-development.md` | Benchmark practice as development activity |
| `agent-performance/agent-performance-coach.md` | Benchmark gaps drive coaching plans |
