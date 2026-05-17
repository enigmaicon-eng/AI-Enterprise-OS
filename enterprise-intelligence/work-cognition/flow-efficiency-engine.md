# Flow Efficiency Engine

## Role
Measures and optimizes how smoothly work flows through the OS — from the moment a work item enters the system until it is delivered. Applies flow metrics (flow efficiency, flow distribution, flow velocity, flow load) to surface systemic impediments and guide continuous improvement.

## Flow Metrics

```
METRIC                  FORMULA                                     TARGET
──────────────────────────────────────────────────────────────────────────────
FLOW_EFFICIENCY         active_time / total_elapsed_time            >= 0.40
FLOW_VELOCITY           completed_items / time_period               Increasing trend
FLOW_LOAD               WIP / throughput_rate                       Decreasing trend
FLOW_DISTRIBUTION       % items in each stage at any snapshot       Balanced
FLOW_DEBT               aging + blocked items / total WIP           < 0.15
FLOW_PREDICTABILITY     % items completed within 2× p50 cycle time  >= 0.85
```

## Flow State Tracking

```
FLOW STAGES (tracked for every work item):
  BACKLOG:      Created; not yet started
  INTAKE:       In planning/triage; being sized/prioritized
  IN_PROGRESS:  Active work; agent or human working it
  REVIEW:       Awaiting or in quality/gate review
  BLOCKED:      Waiting on external dependency
  WAITING:      Waiting on approval or handoff acceptance
  DONE:         Completed and delivered

STAGE TRANSITION TRACKING:
  entry_timestamp per stage per item
  dwell_time: exit_timestamp - entry_timestamp
  
ACTIVE_TIME CLASSIFICATION:
  Active: IN_PROGRESS + REVIEW
  Wait: INTAKE + BLOCKED + WAITING
  flow_efficiency = Σ(active_dwell_time) / Σ(total_dwell_time)
```

## Flow Debt Analysis

```
FLOW DEBT:
  Items that are BLOCKED or AGING represent "debt" in the flow system
  flow_debt_score = (blocked_items × 2 + aging_items × 1) / total_WIP
  
  HIGH FLOW DEBT (> 0.30): throughput prediction: severe degradation
  MODERATE FLOW DEBT (0.15–0.30): throughput prediction: 20–40% below potential
  LOW FLOW DEBT (< 0.15): healthy flow; throughput near theoretical maximum

DEBT SOURCES (tracked per debt item):
  DEPENDENCY_WAIT:    blocked on cross-team dependency
  APPROVAL_WAIT:      in governance approval queue
  CONTEXT_WAIT:       waiting for human clarification/input
  RESOURCE_WAIT:      agent unavailable or queue full
  REWORK_DEBT:        item in rework cycle (failed gate; being corrected)
```

## Flow Efficiency Improvement Recommendations

```
IF flow_efficiency < 0.30 AND primary_wait = APPROVAL_WAIT:
  → "Approval queue bottleneck detected; see governance-bottleneck-resolver"
  
IF flow_efficiency < 0.30 AND primary_wait = DEPENDENCY_WAIT:
  → "Cross-team dependency blocking {N} items; see dependency-intelligence-engine"
  
IF flow_efficiency < 0.40 AND high REWORK_DEBT:
  → "Rework rate {N}% inflating flow time; address root cause in quality"
  
IF flow_velocity DECLINING AND flow_load INCREASING:
  → "Classic WIP overload; recommend WIP limit reduction from {N} to {N}"
```

## Flow Report

```
GENERATED: daily + per sprint + on-demand
SECTIONS:
  1. Flow efficiency score (current vs. target vs. 4-sprint trend)
  2. Flow distribution chart (% in each stage right now)
  3. Flow debt breakdown by source
  4. Cycle time distribution (histogram p25/p50/p75/p95)
  5. Top 3 impediments to better flow
  6. Flow efficiency improvement recommendations
  
AUDIENCE: T2 team leads (team-level); T3 (org-level aggregate)
```

## Flow Intelligence Integrations

```
FEEDS:
  → team-performance-model: flow_efficiency dimension
  → bottleneck-intelligence: flow debt = evidence for structural bottleneck
  → self-optimization: flow metrics guide workflow optimization proposals
  → sprint planning: flow velocity → throughput forecasts
  → predictive-analytics: flow_load + debt → incident_precursor model input
```

## Persistence
`memory/work-cognition/flow-metrics-current.yaml`
`memory/work-cognition/flow-metrics-history.jsonl`
`memory/work-cognition/flow-debt-log.jsonl`
