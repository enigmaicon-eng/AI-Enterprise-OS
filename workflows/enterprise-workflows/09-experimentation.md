# WF-009: Experimentation

**Version:** 1.0.0 | **Owner:** Product + Engineering Org | **Tier:** T2 | **Class:** ELEVATED | **SLA:** 14 days

## Purpose
Design, run, analyze, and decide on A/B tests and controlled experiments — from hypothesis through statistical analysis to a binding launch or no-launch decision with full documentation of what was tested and why.

## Inputs

```
REQUIRED:
  hypothesis:         string — "We believe [change] will [metric effect] for [audience]"
  success_metric:     string — primary KPI; measurable
  guardrail_metrics:  [string] — metrics that must not degrade
  experiment_type:    AB_TEST | MULTIVARIATE | HOLDOUT | BANDIT | ROLLOUT_GATE
  feature_id:         string — feature being tested
  traffic_allocation: number — % of eligible users in experiment

OPTIONAL:
  mde:                number — minimum detectable effect (power calculation input)
  duration_days:      number — experiment runtime; if omitted: auto-calculated from MDE
  target_segment:     string — user segment for experiment
```

## Outputs / Artifacts

```
PRIMARY:
  EXPERIMENT_SPEC:    wiki/experiments/{experiment_id}.md
  STATISTICAL_REPORT: results with significance, effect size, CIs
  LAUNCH_DECISION:    LAUNCH | NO_LAUNCH | ITERATE | INCONCLUSIVE

SECONDARY:
  SAMPLE_SIZE_CALC:   power analysis output
  SEGMENT_ANALYSIS:   results broken down by key user segments
  GUARDRAIL_REPORT:   status of all guardrail metrics during experiment
```

## Lifecycle States

```
INITIATED → VALIDATING → HYPOTHESIS_REVIEW → POWER_ANALYSIS
  → EXPERIMENT_DESIGN → INSTRUMENTATION_CHECK → EXEC_APPROVAL
  → RUNNING → [early signal] EARLY_STOPPING_REVIEW
  → ANALYSIS → DECISION_REVIEW → DECISION_RECORDED
  → [LAUNCH] → WF-011 Rollout | [NO_LAUNCH] → COMPLETED
  → FAILED | CANCELLED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T2+]              Root
S-002  HYPOTHESIS_QUALITY      [GATE: G-QUALITY]               depends_on: S-001
         Check: hypothesis is falsifiable; success_metric is measurable
         Check: guardrail_metrics defined; no HARMful test design
S-003  POWER_ANALYSIS          [AGENT: analytics-agent]        depends_on: S-002
         Input: mde, baseline conversion, alpha=0.05, power=0.80
         Output: required_sample_size, experiment_duration_days
         Warn if: duration > 30 days (diminishing returns)
S-004  CONFLICT_CHECK          [SYSTEM]                        depends_on: S-001
         Check: target_segment not already in concurrent experiment
         Check: feature not already being tested (experiment registry)
S-005  EXPERIMENT_DESIGN       [AGENT: pm-agent + eng-agent]   depends_on: S-003, S-004
         Define: control/treatment assignment logic; randomization unit (user/session/org)
         Define: analysis plan (pre-registered); metric collection plan
S-006  INSTRUMENTATION_CHECK   [AGENT: qa-agent]               depends_on: S-005
         Verify: all metrics are instrumented and firing correctly
         Run: pre-experiment A/A test (24hr) to validate equal groups
         Block if: AA test shows significant difference (instrumentation bug)
S-007  EXEC_APPROVAL           [GATE: G-EXEC T3]               depends_on: S-005
         T3 PM lead approves experiment design and allocation
         SLA: 24hr  |  Required: any experiment > 20% traffic allocation
S-008  EXPERIMENT_LAUNCH       [SYSTEM]                        depends_on: S-006, S-007
         Activate experiment; start data collection
         Emit: WF-009.started event; log to experiment registry
S-009  RUNNING_MONITORING      [AGENT: monitoring-agent]       depends_on: S-008
         Monitor every 6hr: data quality, sample ratio mismatch, guardrail metrics
         GUARDRAIL BREACH: immediate stop; T3 alert; analysis required
         SAMPLE RATIO MISMATCH: immediate stop; investigate instrumentation
S-010  EARLY_STOPPING_REVIEW   [DECISION + HUMAN: T3]          depends_on: S-009
         Only if: results are overwhelmingly positive/negative before planned end
         Bayesian early stopping: probability of superiority >= 0.99 or <= 0.01
         Human (T3) must authorize early stop to prevent P-hacking
S-011  EXPERIMENT_END          [SYSTEM]                        depends_on: S-008
         Triggered by: duration_days elapsed OR early stop OR guardrail breach
S-012  STATISTICAL_ANALYSIS    [AGENT: analytics-agent]        depends_on: S-011
         Primary: frequentist (t-test / chi-sq) with alpha=0.05 AND Bayesian posterior
         Secondary: segment breakdown; heterogeneous treatment effects
         Output: effect_size, p_value, confidence_interval, posterior_prob
S-013  GUARDRAIL_ANALYSIS      [AGENT: analytics-agent]        depends_on: S-012
         Verify all guardrail metrics SAFE (p > 0.05 for degradation)
         GUARDRAIL FAILED: no-launch recommendation regardless of primary metric
S-014  ANALYSIS_QUALITY_GATE   [GATE: G-QUALITY]               depends_on: S-012, S-013
         p < 0.05 AND effect > mde AND guardrails safe: SIGNIFICANT
         All other cases: INCONCLUSIVE or NEGATIVE
S-015  DECISION_REVIEW         [HUMAN: T3 PM + T2 Eng lead]    depends_on: S-014
         Review: statistical results, business context, edge cases, launch risk
         Output: LAUNCH | NO_LAUNCH | ITERATE | INCONCLUSIVE
         SLA: 3 business days
S-016  DECISION_RECORD         [AGENT: pm-agent]               depends_on: S-015
         Write: experiment ID, hypothesis, result, decision, rationale, learnings
S-017  LAUNCH_TRIGGER          [CONDITIONAL]                   depends_on: S-015
         IF LAUNCH → trigger WF-011 (Rollout Governance) with canary_pct = full
         IF ITERATE → trigger WF-001 for updated feature hypothesis
         IF NO_LAUNCH → archive; learnings captured in wiki
S-018  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-016
S-019  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-018
S-020  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-019
```

## Approval Gates

```
G-AUTH:    initiator >= T2; hypothesis falsifiable; metrics instrumented
G-QUALITY: AA test passed; statistical analysis complete; guardrails assessed
G-EXEC:    T3 PM lead; required for > 20% traffic allocation
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Guardrail metric breach                  Immediate stop; T3 alert    Immediate
Sample ratio mismatch detected           Immediate stop; T3 review   2hr
Early stopping request                   T3 authorization required   4hr
Decision review SLA breach (3d)          T4 escalation              2hr
Concurrent experiment conflict           T3 experiment queue mgmt    24hr
```

## Governance Checkpoints

```
C-001: decision review requires human (T3+) final call
C-003: experiment spec + analysis report artifacts before decision
C-004: all experiment decisions recorded with full statistical context
C-006: segment analysis must not expose PII; cohorts defined by non-PII attributes
PRE-REGISTRATION: analysis plan written before data collection (prevents HARMful P-hacking)
GUARDRAIL: non-negotiable; any guardrail breach = no-launch regardless of primary metric
```

## Observability

```
HEALTH METRICS:
  experiment_success_rate:    pct experiments with LAUNCH outcome (track; too high = too easy bar)
  avg_duration_days:          target <= 14
  guardrail_breach_rate:      target < 0.10 (high rate = poor experiment design)
  inconclusive_rate:          target < 0.30 (high = sample size too small or noisy metrics)
  decision_sla_rate:          target >= 0.90 (decisions within 3d of analysis)
```

## Telemetry Events

```
enterprise.workflows.WF-009.initiated        {experiment_id, type, traffic_pct}
enterprise.workflows.WF-009.aa_test_result   {result, p_value}
enterprise.workflows.WF-009.started          {start_date, sample_size_target}
enterprise.workflows.WF-009.guardrail_breach {metric_name, degradation_pct}
enterprise.workflows.WF-009.analysis_result  {p_value, effect_size, decision}
enterprise.workflows.WF-009.completed        {decision, will_launch}
```

## Rollback System

```
ROLLBACK WINDOW: N/A for experiments (they are isolated by design)
EXPERIMENT SHUTDOWN: any active experiment can be stopped immediately by T3+
TREATMENT ROLLBACK: traffic immediately routed to control; < 5min
POST-LAUNCH ROLLBACK: if LAUNCH decision and WF-011 activated → per WF-011 rollback
```

## Enterprise System Integrations

```
FEATURE_FLAGS: S-008 → activate experiment via feature flag system
ANALYTICS:    S-008 → register experiment in analytics; S-012 → pull experiment data
JIRA:         S-015 → create launch ticket if LAUNCH decision
SLACK:        S-020 → notify #experiments channel with result summary
```

## Wiki Updates

```
wiki/experiments/{experiment_id}.md         ← full experiment record (spec + results + decision)
wiki/product/experiment-learnings.md        ← append learning for organizational memory
wiki/decisions/exp-{id}-decision.md         ← decision record
```

## Memory Updates

```
memory/product/experiment-registry.yaml     ← experiment entry with outcome
memory/analytics/learnings-index.yaml       ← searchable experiment learnings
```
