# Meta-Improvement Engine

**Component:** RSI-REC-001 | **Owner:** Meta-Org | **Tier:** T4 | **Class:** CRITICAL

## Role
The recursive layer of the self-improvement system: improves the improvement system itself. Monitors the performance of every component in the RSI stack, identifies weaknesses in the improvement cycle, and generates proposals to improve the improvement process — making the OS better at getting better over time.

## The Recursion Contract

```
THE META-IMPROVEMENT ENGINE CAN IMPROVE:
  ✓ Analysis accuracy (better signal processing, better anomaly detection)
  ✓ Proposal quality (better solution generation, better option selection)
  ✓ Forecast accuracy (better impact prediction models)
  ✓ Orchestration of the improvement cycle (better sequencing, batching)
  ✓ Signal collection coverage (add new signal sources)
  ✓ Bottleneck detection algorithms (better detection methods)
  ✓ Health scoring models (better dimension weights, better indicators)

THE META-IMPROVEMENT ENGINE CANNOT IMPROVE:
  ✗ Safety controller (cannot weaken safety checks on itself)
  ✗ Authorization matrix (cannot lower its own authorization requirements)
  ✗ Constitutional bindings (cannot modify its own constitutional constraints)
  ✗ Audit trail requirements (cannot reduce its own record-keeping)
  ✗ Human oversight gates (cannot remove human checkpoints from improvement cycle)

Any proposal touching the forbidden list is HARD_DENIED at safety check.
Attempts are logged as constitutional violations and escalated to T5.
```

---

## Meta-Improvement Dimensions

### 1. Analysis Quality Improvement
```
MONITORS:
  anomaly_detection_precision: true positives / (true positives + false positives)
  root_cause_identification_accuracy: correct root cause % (vs. post-fix validation)
  opportunity_ranking_correlation: actual impact rank vs. predicted rank

IF BELOW TARGET (precision < 0.80, root cause < 0.75, ranking < 0.70):
  Trigger meta-analysis: what types of opportunities are being missed or mislabeled?
  Generate: analysis algorithm improvement proposal
  Options: new detection method, updated threshold, additional causal graph edges

IMPROVEMENT TYPES:
  New anomaly pattern: add detection rule for newly discovered failure mode
  Causal graph update: add/remove causal edges based on validated evidence
  Signal weighting: adjust signal importance weights based on prediction accuracy
  Detection threshold: tune z-score or CUSUM parameters based on false positive rate
```

### 2. Proposal Quality Improvement
```
MONITORS:
  safety_check_pass_rate: % of proposals passing safety on first attempt (target >= 0.85)
  authorization_approval_rate: % of proposals authorized (high rejection = poor quality)
  proposal_adoption_quality: % producing expected improvement (vs. forecast)

IF BELOW TARGET:
  safety_check_pass_rate < 0.70: proposals are requesting unsafe changes too frequently
    → Meta-proposal: add constraint check to planner BEFORE safety validation
  authorization_approval_rate < 0.70: proposals not aligned with human judgment
    → Meta-proposal: improve planner's understanding of human preferences
  adoption_quality < 0.60: proposals aren't working as expected
    → Meta-proposal: improve solution template library; reduce overconfident forecasts
```

### 3. Forecast Calibration Improvement
```
MONITORS:
  forecast_accuracy_ratio distribution: is it centered on 1.0?
  systematic_bias_by_domain: are certain domains consistently over/under estimated?
  confidence_interval_coverage: are 90% CIs actually covering 90% of outcomes?

RECURSIVE CALIBRATION:
  Monthly: compute domain-specific bias correction factors
  Apply: correction to future forecasts for that domain
  Validate: over 90 days, does correction improve coverage to target?
  If correction helps: keep; if not: investigate why forecasting is inaccurate

IMPROVEMENT PROPOSALS:
  Add training features: new context variables that predict improvement outcomes better
  Model architecture change: switch from regression to Bayesian model for a domain
  Ensemble forecasting: combine multiple models with learned ensemble weights
```

### 4. Cycle Efficiency Improvement
```
MONITORS:
  cycle_completion_time: how long does full improvement cycle take?
  phase_latency by phase: which phase is the bottleneck?
  proposal_throughput: proposals completed / proposals generated

CYCLE BOTTLENECKS:
  Analysis phase > 4hr: signal processing too slow; parallelize across domains
  Planning phase > 2hr per proposal: planner over-analyzing; introduce time-box
  Validation phase > 30min: safety check latency issue; cache common checks
  Authorization queue > 20 items: authorization bottleneck → governance-optimizer.md

EFFICIENCY IMPROVEMENTS:
  Parallelization: run domain analyzers concurrently rather than sequentially
  Incremental analysis: only re-analyze subsystems with signal changes
  Pre-validation: run preliminary safety check during planning, not after
  Batch authorization: group similar proposals for single approval decision
```

### 5. Signal Coverage Improvement
```
MONITORS:
  signal_coverage: % of OS subsystems providing signals
  signal_quality: confidence, freshness, completeness per signal source
  blind_spots: subsystems with no signals that could benefit from observation

COVERAGE EXPANSION PROPOSALS:
  New signal source: add observation to previously unmonitored subsystem
  Signal quality improvement: increase sampling frequency for noisy-but-important signals
  Signal normalization: improve unit/scale consistency across signal sources
  Integration health signals: add signals from external integrations (Jira, Slack, etc.)
```

---

## Meta-Improvement Proposal Protocol

```
META-IMPROVEMENT PROPOSALS follow same lifecycle as regular proposals PLUS:
  - Extra review: T4 must approve any change to core analysis algorithms
  - Staged rollout: 30-day shadow mode (old + new algorithm run in parallel; compare outputs)
  - Validation gate: new algorithm must outperform old on held-out historical data
  - Rollback requirement: trivial rollback to prior algorithm version

SHADOW MODE COMPARISON:
  Run both old and new algorithms on live signal stream for 30 days
  Compare: anomaly detection counts; proposal quality scores; forecast accuracy
  Decision threshold: new algorithm must be >= 10% better on primary metric AND not worse on any
  Gradual activation: new algorithm gets 10% → 30% → 100% of traffic over 30 days
```

---

## Recursive Depth Limit

```
RECURSION LIMIT: 3 levels deep
  Level 1: self-improvement-engine improves OS workflows/orchestration/runtime/governance
  Level 2: meta-improvement-engine improves the self-improvement-engine
  Level 3: meta-improvement-engine can propose improvements to its own algorithms (Level 2)
           but Level 3 proposals require T5 authorization

BEYOND LEVEL 3: Not permitted. No proposal may propose to improve the meta-improvement
of meta-improvement. This prevents unbounded recursive self-modification.

RATIONALE: Beyond 3 levels, improvements become too abstract to validate and too
risky to authorize without full system understanding that exceeds current governance capacity.
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Improvement cycle performance gain QoQ  >= +5% on primary metric each quarter
Meta-proposals approved/quarter         >= 2
Analysis algorithm accuracy trend       Improving; >= +3% per quarter until target
Forecast accuracy improvement QoQ       >= +5% per quarter until 0.85+
Meta-improvement rollback rate          < 0.05
Constitutional violations in meta-cycle = 0
```
