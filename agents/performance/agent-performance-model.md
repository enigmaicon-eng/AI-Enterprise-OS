# Agent Performance Model

## Purpose
Defines what "good performance" means for enterprise agents across dimensions, roles, and contexts. Performance is multi-dimensional — an agent can excel at task throughput while having poor calibration, or produce high-quality outputs while failing SLAs. This model captures all relevant dimensions and composes them into a coherent, actionable performance picture.

---

## Performance Framework

```yaml
performance_framework:
  philosophy:
    - measure outcomes, not just activity
    - context-adjusted comparison (a Tier-1 agent is not compared to a Tier-4 agent)
    - leading indicators enable intervention before failure
    - performance serves improvement, not punishment
  
  measurement_levels:
    TASK_LEVEL: per-task performance on individual assignments
    CAPABILITY_LEVEL: performance within a specific capability area
    ROLE_LEVEL: overall performance for an agent's role and tier
    PORTFOLIO_LEVEL: performance across all agents (org-level intelligence health)
```

---

## Performance Dimensions

```yaml
performance_dimensions:
  QUALITY:
    description: How well does the agent produce correct, complete, clear outputs?
    weight: 0.30
    
    sub_metrics:
      output_quality_score:
        definition: avg quality score of artifacts produced by this agent
        measured_by: quality-system rubrics; peer/human review
        target_by_tier: {T1: 0.65, T2: 0.70, T3: 0.75, T4: 0.80, T5: 0.85}
      
      decision_accuracy:
        definition: fraction of decisions later validated as correct
        measured_by: outcome tracking; reversal rate
        target: reversal_rate < 0.10
      
      factual_correctness:
        definition: fraction of factual claims that are accurate
        measured_by: knowledge accuracy monitor; accuracy feedback
        target: >= 0.90
  
  RELIABILITY:
    description: Does the agent consistently complete work as expected?
    weight: 0.25
    
    sub_metrics:
      task_completion_rate:
        definition: tasks completed / tasks accepted
        excludes: tasks cancelled for external reasons
        target: >= 0.92
      
      sla_compliance_rate:
        definition: tasks completed within SLA / tasks with SLA
        target_by_tier: {T1: 0.85, T2: 0.88, T3: 0.90, T4: 0.95, T5: 0.98}
      
      error_rate:
        definition: tasks with recoverable errors / total tasks
        target: < 0.08
      
      failure_rate:
        definition: tasks with unrecoverable failures / total tasks
        target: < 0.02
  
  CALIBRATION:
    description: Does the agent know what they don't know? Is confidence accurate?
    weight: 0.20
    
    sub_metrics:
      calibration_error:
        definition: |
          mean(|claimed_confidence - empirical_accuracy|) across tasks
          well-calibrated agent: claims 0.80 confidence → is right 80% of the time
        target: calibration_error < 0.10
      
      overconfidence_rate:
        definition: fraction of times claimed_confidence > 0.90 but outcome was incorrect
        target: < 0.05
      
      confidence_variance:
        definition: std_dev of confidence scores across tasks (low variance = "always 0.80" is suspicious)
        target: std_dev >= 0.10 (agents should have genuine uncertainty variation)
  
  EFFICIENCY:
    description: Does the agent use resources (time, compute, escalations) well?
    weight: 0.15
    
    sub_metrics:
      avg_task_duration:
        definition: mean time to complete tasks (context-adjusted by task complexity)
        target: within 1.5× benchmark for task type
      
      escalation_rate:
        definition: tasks escalated / total tasks
        target_by_tier: {T1: <= 0.20, T2: <= 0.15, T3: <= 0.10, T4: <= 0.05}
        note: escalation is not always bad; under-escalation is worse than over-escalation
      
      unnecessary_escalation_rate:
        definition: escalations that were resolved trivially at higher tier / total escalations
        target: < 0.20
      
      resource_efficiency:
        definition: task value delivered / resource cost (tokens, compute, time)
        target: trending improvement quarter-over-quarter
  
  LEARNING:
    description: Is the agent improving over time?
    weight: 0.10
    
    sub_metrics:
      skill_growth_rate:
        definition: number of capabilities with proficiency level improvement in last 90 days
        target: >= 1 improvement per quarter (growth expected)
      
      feedback_integration_rate:
        definition: fraction of coaching feedback that demonstrably changed behavior in next opportunity
        measured_by: behavioral_adaptation tracking
        target: >= 0.60
      
      knowledge_application_rate:
        definition: fraction of retrieved knowledge units that agent applies
        target: >= 0.30
```

---

## Performance Score Computation

```yaml
performance_score:
  overall_score:
    formula: weighted_average(QUALITY × 0.30, RELIABILITY × 0.25, CALIBRATION × 0.20,
                              EFFICIENCY × 0.15, LEARNING × 0.10)
    range: 0.0–1.0
  
  dimension_normalization:
    each_sub_metric: normalized to 0.0–1.0 using target and floor values
    floor: 0.0 (worst observable)
    target: 1.0 (when at or above target, score = 1.0)
    formula: min(1.0, metric_value / target_value)
  
  context_adjustment:
    task_complexity_adjustment: harder tasks get score normalized upward (agent is not penalized for taking harder work)
    novelty_bonus: successfully completing a novel task type adds 0.05 to LEARNING dimension
    
  composite_performance_tier:
    EXCEPTIONAL: overall_score >= 0.90
    STRONG:      overall_score >= 0.75
    ADEQUATE:    overall_score >= 0.60
    DEVELOPING:  overall_score >= 0.45
    CONCERNING:  overall_score < 0.45 → triggers coaching plan
  
  hard_caps:
    calibration_error > 0.25: overall_score capped at 0.60 (miscalibration is a fundamental reliability risk)
    failure_rate > 0.10: overall_score capped at 0.55
    safety_incident: overall_score capped at 0.40 + mandatory investigation
```

---

## Benchmarks by Agent Type

```yaml
benchmarks:
  GOVERNANCE_AGENT:
    expected_strengths: [QUALITY, CALIBRATION, RELIABILITY]
    output_quality_target: 0.80
    calibration_error_target: < 0.08 (stricter — governance decisions must be well-calibrated)
    escalation_rate_target: <= 0.10
  
  ORCHESTRATION_AGENT:
    expected_strengths: [RELIABILITY, EFFICIENCY]
    sla_compliance_target: 0.92
    escalation_rate_target: <= 0.12
    resource_efficiency: high priority
  
  ENGINEERING_AGENT:
    expected_strengths: [QUALITY, RELIABILITY]
    output_quality_target: 0.75
    error_rate_target: < 0.06
  
  RESEARCH_AGENT:
    expected_strengths: [QUALITY, LEARNING]
    output_quality_target: 0.78
    knowledge_application_rate_target: >= 0.40
    calibration_error_target: < 0.12 (research involves more uncertainty)
  
  ANALYTICS_AGENT:
    expected_strengths: [QUALITY, CALIBRATION]
    factual_correctness_target: >= 0.92
    calibration_error_target: < 0.08
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-performance/agent-performance-tracker.md` | Real-time performance signal collection |
| `agent-performance/agent-performance-analytics.md` | Trend analysis and cohort comparison |
| `agent-performance/agent-performance-benchmarks.md` | Target values by agent type/tier |
| `agent-performance/agent-performance-coach.md` | Performance model drives coaching interventions |
| `agent-intelligence/agent-confidence-calibration.md` | CALIBRATION dimension data |
| `agent-capabilities/agent-capability-assessment.md` | QUALITY and RELIABILITY feed capability updates |
