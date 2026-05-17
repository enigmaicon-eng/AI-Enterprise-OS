# Analysis Engine

**Component:** RSI-CORE-003 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** CRITICAL

## Role
Transforms raw signal streams from the observation layer into structured improvement opportunities. Applies pattern recognition, causal inference, bottleneck detection, waste identification, and anomaly classification to produce a ranked opportunity set for the improvement planner.

---

## Analysis Pipeline

```
STAGE 1: SIGNAL INGESTION
  Input: signal_record stream from observation-layer.md
  Process: normalize units; apply filters; build 7d/30d/90d windows per metric
  Output: normalized_signal_matrix (time-series per metric × window)

STAGE 2: ANOMALY DETECTION
  Methods:
    Z-score: (value - mean) / std_dev; |z| > 3 → anomaly
    CUSUM: cumulative sum control charts for sustained regime shifts
    IQR: interquartile range fence for distribution outliers
    ARIMA residuals: unexpected deviation from time-series model
  Output: anomaly_set with type, severity, confidence, affected signals

STAGE 3: PATTERN RECOGNITION
  Methods:
    Temporal patterns: Fourier analysis → weekly/monthly cycles vs. degradation trends
    Cross-metric correlation: Pearson + Spearman with lag analysis (0–72hr)
    Sequential patterns: PrefixSpan on workflow execution logs
    Clustering: DBSCAN on behavior vectors → regime change detection
  Output: pattern_library update + new pattern alerts

STAGE 4: CAUSAL INFERENCE
  Methods:
    Granger causality: does signal A predict signal B?
    Difference-in-differences: pre/post change comparisons
    Structural causal model: DAG-based path tracing
  Output: causal_graph (directed; used to avoid treating symptoms as root causes)

STAGE 5: OPPORTUNITY CLASSIFICATION
  For each confirmed anomaly/pattern:
    Classify domain: WORKFLOW | ORCHESTRATION | RUNTIME | GOVERNANCE | ORG | CAPABILITY | META
    Classify type: BOTTLENECK | WASTE | QUALITY_GAP | CAPABILITY_GAP | STRUCTURAL | DRIFT
    Estimate impact: magnitude + scope + reversibility
    Check recurrence: has this appeared before? (→ improvement-memory.md)
  Output: opportunity_set (unranked)

STAGE 6: OPPORTUNITY RANKING
  Score = (impact_magnitude × 0.35) + (frequency × 0.20) + (confidence × 0.25) + (reversibility × 0.10) + (scope_breadth × 0.10)
  Penalties:
    -0.20 if similar proposal was attempted and failed in last 90 days
    -0.30 if opportunity requires T5 authorization (higher bar for routing)
    +0.15 if opportunity is cross-domain (leverage multiple systems)
  Output: ranked_opportunity_set (score-sorted; top-20 forwarded to improvement-planner.md)
```

---

## Opportunity Types

```
TYPE                DEFINITION                                EXAMPLE
──────────────────────────────────────────────────────────────────────────────────────────────
BOTTLENECK          Single point slowing system throughput     Gate approval queue > 48hr avg
WASTE               Resources consumed without output value    Idle agents > 30% of active time
QUALITY_GAP         Output quality below target consistently   Evaluation scores < 0.75 for 14d
CAPABILITY_GAP      Missing capability causing workarounds     No PDF extraction = manual copies
STRUCTURAL          System structure mismatched to workload    Monolithic org for parallel work
CONFIGURATION_DRIFT Policy/config diverged from intent         Timeout too aggressive for new load
RECURRENCE          Same problem re-emerging after prior fix   3rd occurrence of same bottleneck
LATENT_RISK         Early warning signal before visible impact  Error rate trending up 5%/week
EFFICIENCY_GAP      More resource used than benchmarked norm   Token cost 40% above peer baseline
```

---

## Causal Graph

```
MAINTAINED IN: memory/recursive-self-improvement/causal-graph.yaml
PURPOSE: Prevent treating symptoms as root causes; prevent double-counting

GRAPH CONSTRUCTION:
  Nodes: OS metrics and subsystems
  Edges: Granger-causal relationships (lag in hours)
  Weight: causal strength 0.0–1.0 (correlation strength × Granger p-value significance)

USAGE IN ANALYSIS:
  When anomaly detected in metric X:
    1. Find ancestors of X in causal graph
    2. Check if ancestors are also anomalous
    3. If yes: root cause = deepest anomalous ancestor; symptoms = descendants
    4. Opportunity targets ROOT CAUSE, not symptom

CAUSAL GRAPH REFRESH: Weekly (re-run Granger on trailing 90d data)
```

---

## Recurrence Detection

```
RECURRENCE DEFINITION:
  An opportunity is a recurrence if:
    - Same domain + type combination as a prior closed opportunity
    - Prior improvement was marked COMPLETED (not ROLLED_BACK)
    - Recurrence within 90 days of prior completion

RECURRENCE CLASSIFICATION:
  1st recurrence: RECURRENCE_1 → flag; include in proposal with prior fix context
  2nd recurrence: RECURRENCE_2 → flag; prior fix is clearly insufficient
  3rd+ recurrence: CHRONIC → escalate; structural or architectural investigation required;
                            route to org-adaptation-engine.md

RECURRENCE FEEDS: improvement-memory.md to track pattern across improvement cycles
```

---

## Emergency Analysis Protocol

```
TRIGGER: Real-time alert signal from observation-layer.md (bypasses batch schedule)

EMERGENCY ANALYSIS STEPS:
  1. Collect all signals from affected system (last 4hr)
  2. Run anomaly detection immediately (skip pattern/causal analysis for speed)
  3. Classify opportunity (domain, type, severity)
  4. Generate emergency proposal with reduced evidence window (4hr minimum)
  5. Mark proposal as EMERGENCY; route to safety check + T3 authorization fast-path (< 2hr)
  6. Return to full analysis after emergency addressed

EMERGENCY PROPOSAL FLAG:
  emergency: true
  evidence_window: 4h (vs. standard 7d)
  confidence: marked as PRELIMINARY; full analysis follows within 24hr
```

---

## Analysis Quality Metrics

```
METRIC                              TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Anomaly detection precision          >= 0.80 (< 20% false positives reaching planner)
Root cause identification accuracy   >= 0.75 (vs. post-implementation validation)
Opportunity ranking correlation      >= 0.70 (ranking predicts actual impact order)
Causal graph coverage                >= 0.85 (% of metric pairs with known causal status)
Recurrence detection rate            = 1.00 (no missed recurrences)
Emergency analysis latency           < 15 minutes from trigger to proposal
```
