# Agent Performance Tracker

## Purpose
Collects, normalizes, and stores performance signals from all agent activities in real time. Every task execution, decision, artifact, escalation, and feedback event is a signal. The tracker is the data collection layer that makes performance analytics, coaching, and capability assessment possible.

---

## Tracking Architecture

```
Agent Activity Events (enterprise event bus)
├── task.started, task.completed, task.failed
├── artifact.created, artifact.quality_scored
├── decision.made, decision.outcome_assessed
├── escalation.triggered, escalation.resolved
├── confidence.reported, calibration.checked
├── skill.executed, skill.error
├── feedback.received, feedback.applied
└── knowledge.retrieved, knowledge.applied
        ↓
[Signal Ingestion]        → normalize, validate, enrich
        ↓
[Signal Aggregation]      → compute rolling metrics per agent per dimension
        ↓
[Performance Store]       → time-series storage per agent
        ↓
[Metric Derivation]       → compute performance model scores
        ↓
[Alert Engine]            → detect anomalies and threshold breaches
```

---

## Signal Schema

```yaml
performance_signal:
  signal_id: "PS-uuid"
  agent_id: string
  signal_type: [see signal types]
  occurred_at: ISO-8601
  
  context:
    task_id: string | null
    workflow_id: string | null
    capability_id: string | null
    skill_id: string | null
    domain: string | null
    task_complexity: TRIVIAL | SIMPLE | STANDARD | COMPLEX | EXPERT
  
  measurement:
    value: float | boolean | enum
    unit: string               # "score", "seconds", "boolean", "count"
    confidence: 0.0–1.0        # how reliable is this measurement?
  
  metadata:
    source: string             # which system generated this signal
    version: string            # schema version for migration compatibility
    tags: [string]
```

---

## Signal Types

```yaml
signal_types:
  # QUALITY SIGNALS
  ARTIFACT_QUALITY_SCORED:
    trigger: artifact quality review completed
    value: quality_score (0.0–1.0)
    dimensions: QUALITY
    latency: within 30 seconds of quality review event
  
  DECISION_OUTCOME_ASSESSED:
    trigger: decision outcome recorded (positive/negative)
    value: {outcome: POSITIVE | NEGATIVE | NEUTRAL, reversal: boolean}
    dimensions: QUALITY, CALIBRATION
    latency: within 5 minutes of outcome event
  
  FACTUAL_FEEDBACK_RECEIVED:
    trigger: knowledge.feedback with feedback_type = INCORRECT or CORRECT
    value: {correct: boolean, claimed_confidence: float}
    dimensions: QUALITY, CALIBRATION
  
  # RELIABILITY SIGNALS
  TASK_COMPLETED:
    trigger: task.completed event
    value: {success: boolean, sla_met: boolean, duration_seconds: int}
    dimensions: RELIABILITY, EFFICIENCY
  
  TASK_FAILED:
    trigger: task.failed event
    value: {failure_type: RECOVERABLE | UNRECOVERABLE, cause: string}
    dimensions: RELIABILITY
  
  ERROR_OCCURRED:
    trigger: skill.error event
    value: {error_type: string, severity: string, recovery_successful: boolean}
    dimensions: RELIABILITY
  
  # CALIBRATION SIGNALS
  CONFIDENCE_REPORTED:
    trigger: any agent output includes confidence score
    value: {claimed_confidence: float, evidence_basis: string}
    dimensions: CALIBRATION
    matched_with: DECISION_OUTCOME_ASSESSED (for calibration error computation)
  
  CALIBRATION_CHECK_RESULT:
    trigger: agent-confidence-calibration.md runs calibration check
    value: {calibration_error: float, bias_direction: OVERCONFIDENT | UNDERCONFIDENT | NEUTRAL}
    dimensions: CALIBRATION
  
  # EFFICIENCY SIGNALS
  ESCALATION_TRIGGERED:
    trigger: agent escalates task
    value: {escalation_type: string, resolution_tier: int}
    dimensions: EFFICIENCY
  
  ESCALATION_RESOLUTION_OUTCOME:
    trigger: escalation resolved
    value: {was_necessary: boolean, resolved_at_tier: int}
    dimensions: EFFICIENCY
  
  TASK_DURATION:
    trigger: task.completed (duration extracted)
    value: duration_seconds (float)
    dimensions: EFFICIENCY
  
  # LEARNING SIGNALS
  FEEDBACK_APPLIED:
    trigger: behavioral-adaptation confirms feedback was applied
    value: {feedback_id: string, behavior_changed: boolean, domain: string}
    dimensions: LEARNING
  
  KNOWLEDGE_APPLIED:
    trigger: knowledge.feedback with feedback_type = APPLIED
    value: {ku_id: string, domain: string}
    dimensions: LEARNING
  
  CAPABILITY_LEVEL_CHANGED:
    trigger: capability assessment results in proficiency change
    value: {capability_id: string, old_level: string, new_level: string, direction: UP | DOWN}
    dimensions: LEARNING
```

---

## Rolling Metric Computation

```yaml
metric_computation:
  update_frequency:
    real_time: signal received → running averages updated within 60 seconds
    hourly_rollup: aggregate metrics recomputed for all agents
    daily_snapshot: full performance score computed and stored
  
  rolling_windows:
    short_term: 7 days (detect rapid changes; for alert detection)
    medium_term: 30 days (primary metric window for coaching)
    long_term: 90 days (trend analysis; capability assessment)
    all_time: cumulative counts (task count, artifact count, etc.)
  
  metric_catalog_per_agent:
    # QUALITY
    output_quality_score_7d: rolling mean of ARTIFACT_QUALITY_SCORED values
    decision_accuracy_30d: (total decisions - reversals - negatives) / total decisions
    factual_correctness_30d: correct_feedback_count / (correct + incorrect feedback)
    
    # RELIABILITY
    task_completion_rate_30d: completed / (completed + failed)
    sla_compliance_rate_30d: sla_met / tasks_with_sla
    error_rate_30d: task_with_error / total_tasks
    failure_rate_30d: unrecoverable_failures / total_tasks
    
    # CALIBRATION
    calibration_error_30d: mean(|claimed_confidence - empirical_accuracy|)
    overconfidence_rate_30d: (confident_incorrect) / (all_confident)
    confidence_variance_30d: std_dev(claimed_confidence) over period
    
    # EFFICIENCY
    avg_task_duration_30d: (by task_complexity bucket for fair comparison)
    escalation_rate_30d: escalations / total_tasks
    unnecessary_escalation_rate_30d: unnecessary_escalations / total_escalations
    
    # LEARNING
    skill_growth_30d: capability_level_upgrades in period
    feedback_integration_rate_30d: feedback_applied_positively / feedback_received
    knowledge_application_rate_30d: knowledge_applied / knowledge_retrieved
```

---

## Alert Detection

```yaml
alert_detection:
  runs_every: 5 minutes
  
  alerts:
    PERFORMANCE_DECLINING:
      condition: overall_score_7d < overall_score_30d - 0.15
      severity: MEDIUM
      recipient: agent supervisor
    
    CALIBRATION_BREACH:
      condition: calibration_error_7d > 0.25
      severity: HIGH (see performance model hard caps)
      action: notify supervisor; flag for confidence calibration review
    
    SAFETY_RELATED_FAILURE:
      condition: any task.failed where task.type = CONSTITUTIONAL_EVALUATION
      severity: CRITICAL
      action: immediate notification to Tier-4+; capabilities under review
    
    SLA_COLLAPSE:
      condition: sla_compliance_rate_7d < 0.70 (well below any tier target)
      severity: HIGH
      action: notify supervisor; check for external causes (queue overload, dependency failures)
    
    ZERO_LEARNING_SIGNAL:
      condition: no CAPABILITY_LEVEL_CHANGED or FEEDBACK_APPLIED in 90 days for active agent
      severity: LOW
      action: flag for coaching review; development plan may be needed
    
    SCORE_BELOW_THRESHOLD:
      condition: overall_score_30d < 0.45 (CONCERNING tier)
      severity: HIGH
      action: auto-create coaching plan referral; notify supervisor
```

---

## Performance Data Store

```yaml
data_store:
  schema:
    time_series: per agent × per metric × per timestamp
    snapshot: daily performance scores (all dimensions) per agent
    signal_log: all raw signals (immutable, for audit and re-computation)
  
  retention:
    raw_signals: 1 year
    daily_snapshots: 3 years
    anonymized_cohort_aggregates: indefinite (for benchmarking)
  
  access:
    agent_own_data: read-only access to their own performance data
    supervisor: read access to direct reports' data
    capability_governance_lead: read access to all agents' data
    anonymized_exports: for benchmarking; no agent_id included
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-performance/agent-performance-model.md` | Dimension definitions and scoring |
| `agent-performance/agent-performance-analytics.md` | Consumes stored metrics for analysis |
| `agent-performance/agent-performance-coach.md` | Performance alerts trigger coaching |
| `enterprise-telemetry/enterprise-event-bus.md` | Source of all performance signals |
| `agent-intelligence/agent-confidence-calibration.md` | CALIBRATION_CHECK_RESULT signals |
| `agent-learning/agent-feedback-integration.md` | FEEDBACK_APPLIED signal source |
