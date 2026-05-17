# Observation Layer

**Component:** RSI-CORE-002 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** CRITICAL

## Role
Continuous multi-system signal collector for the recursive self-improvement engine. Pulls performance, health, efficiency, and behavioral signals from every OS subsystem and normalizes them into a unified signal stream with provenance, confidence, and timestamp.

---

## Signal Taxonomy

```
CLASS             SUBCLASS              EXAMPLES
──────────────────────────────────────────────────────────────────────────────────────────────
PERFORMANCE       latency               step_latency_p99, gate_decision_time_ms
                  throughput            workflows_per_hour, proposals_per_sprint
                  error_rate            gate_failure_rate, rollback_rate
QUALITY           output_quality        evaluation_score, constitutional_alignment
                  correctness           forecast_accuracy, decision_regret_rate
                  completeness          artifact_completeness_score
EFFICIENCY        resource              token_cost_per_workflow, cpu_per_step
                  waste                 idle_agent_rate, queue_depth_sustained
                  flow                  flow_efficiency, wait_time_ratio
HEALTH            team                  team_health_score, velocity_trend
                  system                service_slo_compliance, error_budget_remaining
                  agent                 agent_reliability_score, burnout_risk
GOVERNANCE        compliance            constitutional_clearance_rate, gate_pass_rate
                  approval              approval_sla_compliance, override_rate
                  audit                 evidence_coverage, policy_adherence
BEHAVIORAL        pattern               recurring_failure_patterns, success_patterns
                  anomaly               distribution_shift, sudden_regime_change
                  learning              skill_acquisition_rate, forecast_drift
```

---

## Signal Sources

```
SOURCE SYSTEM                          SIGNAL COUNT  PULL METHOD      CADENCE
──────────────────────────────────────────────────────────────────────────────────────────────
workflow-engine/                       47 signals    event bus pull   15-min batch
execution-runtime/                     38 signals    telemetry API    15-min batch
enterprise-telemetry/                  61 signals    direct subscribe  real-time
orchestration-observability/           29 signals    event bus pull   15-min batch
knowledge-base/                        18 signals    API pull         hourly
agent-performance/                     34 signals    API pull         hourly
team-intelligence/                     22 signals    API pull         hourly
compliance-framework/                  27 signals    API pull         4-hour
data-fabric/                           19 signals    API pull         hourly
governance-queues/                     15 signals    event bus pull   real-time
trust/                                 12 signals    API pull         15-min batch
evaluation/                            9 signals     API pull         hourly

TOTAL MONITORED SIGNALS: ~331 distinct metrics
```

---

## Signal Record Schema

```yaml
signal_record:
  signal_id: SIG-{source}-{metric}-{timestamp}
  source_system: string (e.g., "workflow-engine/workflow-telemetry.md")
  signal_class: PERFORMANCE | QUALITY | EFFICIENCY | HEALTH | GOVERNANCE | BEHAVIORAL
  signal_subclass: string
  metric_name: string (canonical snake_case)
  value: number
  unit: string (ms, %, count, ratio)
  timestamp: ISO8601
  window: INSTANT | 15MIN | 1HR | 24HR | 7D | 30D
  confidence: 0.0–1.0
  sample_count: integer
  baseline: number | null
  deviation_from_baseline: ratio | null  # 1.0 = at baseline; 1.5 = 50% above
  tags:
    team: string | null
    workflow_type: string | null
    agent_tier: T1–T5 | null
```

---

## Baseline Management

```
BASELINE COMPUTATION:
  Window: trailing 30-day median (robust to outliers)
  Minimum samples: 50 data points before baseline established
  Baseline update: rolling; never resets unless RESET_BASELINE event

DEVIATION THRESHOLDS:
  NOTABLE:   deviation ratio >= 1.15 (15% above/below baseline)
  ELEVATED:  deviation ratio >= 1.30
  HIGH:      deviation ratio >= 1.50
  CRITICAL:  deviation ratio >= 2.00 (double the baseline)
  COLLAPSED: deviation ratio <= 0.50 (half the baseline — catastrophic drop)

DIRECTION MATTERS:
  For "higher is better" metrics (throughput, health score): CRITICAL on COLLAPSED
  For "lower is better" metrics (latency, error rate): CRITICAL when >= 2.00
```

---

## Observation Filters

```
FILTER LAYER 1: NOISE REDUCTION
  Singleton spikes (isolated 1-point outliers): excluded from signal stream
  Scheduled maintenance windows: signals suppressed; flagged as MAINTENANCE
  Known deployment periods (T±2hr): signals quarantined; not used for baselines

FILTER LAYER 2: CONFIDENCE GATES
  sample_count < 10: confidence = 0.30 (insufficient data; analysis notes low confidence)
  sample_count 10–49: confidence = 0.60
  sample_count >= 50 + deviation from baseline confirmed across >= 3 windows: confidence = 0.90+

FILTER LAYER 3: SIGNAL CORRELATION
  Correlated signals (r > 0.90 over trailing 30d) → deduplicate to primary signal
  Causally upstream signal identified → downstream may be explained, not independent
  Causal graph maintained in analysis-engine.md
```

---

## Real-Time Alert Signals

```
IMMEDIATE FORWARD TO ANALYSIS ENGINE (bypasses 15-min batch):
  Constitutional alignment score < 0.99
  Gate failure rate spike > 3× baseline in 1hr
  Rollback event triggered
  Error budget exhaustion rate > 5%/hour
  Agent reliability score < 0.60
  Team health → CRITICAL tier
  Approval SLA breach rate > 20% in 4hr

These signals trigger analysis-engine.md to run an emergency analysis cycle
rather than waiting for the next scheduled batch.
```

---

## Observation Health

```
OBSERVATION COVERAGE TARGET: >= 0.92 (92% of source systems reporting)

DEGRADED COVERAGE:
  < 0.85: Alert to self-improvement-engine.md → investigation
  < 0.70: Analysis engine marks conclusions as LOW_CONFIDENCE
  < 0.50: Analysis engine suspends new improvement proposals (insufficient data)

SIGNAL FRESHNESS:
  All real-time signals: < 5 minutes old before analysis
  Batch signals: < 30 minutes old before analysis
  Stale signal (> 2× expected cadence with no update): flagged as STALE; excluded

SELF-MONITORING:
  Observation layer monitors its own collection rate and reports to self-improvement-engine
  If observation coverage drops, that is itself an improvement opportunity
```
