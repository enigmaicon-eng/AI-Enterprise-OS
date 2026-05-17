# Operational Efficiency Analyzer

**Component:** RSI-HE-002 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Measures the efficiency of all OS operations — computing cost-per-outcome ratios, flow efficiency, resource utilization patterns, and value delivery rates. Identifies where the OS spends the most resources relative to the value produced, and generates proposals to improve the efficiency frontier.

---

## Efficiency Model

```
OPERATIONAL EFFICIENCY = Value_Delivered / Resources_Consumed

EFFICIENCY FRONTIER: The set of configurations that maximize value_delivered
for a given resource level. Sub-frontier configurations are improvable.

EFFICIENCY DIMENSIONS:
  Delivery efficiency       Value shipped / team capacity consumed
  Execution efficiency      Workflow outcomes / token cost
  Quality efficiency        Quality score / rework cycles
  Governance efficiency     Decisions made / approval time spent
  Learning efficiency       Capabilities gained / training investment
  Infrastructure efficiency Throughput achieved / compute consumed
```

---

## Cost-per-Outcome Analysis

### Delivery Cost
```
METRIC: Cost per shipped initiative
  delivery_cost = (team_capacity_consumed + infrastructure_cost) / initiatives_completed
  Benchmark: rolling 4-quarter average; improve by >= 5% annually

INPUTS:
  team_capacity_consumed: story points × capacity_rate (person-hours per SP)
  infrastructure_cost: compute + storage + third-party API costs during delivery
  initiatives_completed: count of COMPLETED initiatives per quarter

WASTE INDICATORS:
  High rework ratio (> 20% of capacity on re-work): quality deficit upstream
  Excessive handoffs (> 4 per initiative): structural inefficiency
  Long queue times (> 30% of cycle time in queues): bottleneck present
  Over-spec artifacts (audit shows artifacts significantly exceed minimum requirements): gold-plating
```

### Execution Cost
```
METRIC: Token cost per workflow execution
  execution_cost = total_tokens_consumed / workflow_executions_completed
  Segmented by: workflow_type, tier, complexity class

WASTE INDICATORS:
  context_waste_ratio > 0.25: too much irrelevant context loaded
  retry_cost_ratio > 0.15: excessive retries consuming budget
  planning_overhead_ratio > 0.20: more tokens in planning than execution
  redundant_computation: same analysis run multiple times without result caching

PROPOSALS TRIGGERED:
  context_waste > 0.30: trim context templates → workflow-optimizer.md
  retry_cost > 0.20: fix upstream quality issue → quality_efficiency
  planning_overhead > 0.25: streamline planning protocol → workflow-optimizer.md
```

### Quality Efficiency
```
METRIC: Quality score per rework cycle invested
  quality_efficiency = final_evaluation_score / (1 + rework_cycles)
  Target: >= 0.80 quality achieved in <= 1 rework cycle

REWORK COST:
  rework_cycle = gate_failure + correction + re-evaluation
  rework_cost_ratio = rework_cycles / total_workflow_steps
  Target: rework_cost_ratio < 0.15

HIGH REWORK SIGNALS:
  Consistent gate failure on same step type: step quality problem (not agent problem)
  Same agent type failing same gate repeatedly: routing misalignment
  Rework cycles increasing over time: quality drift; need intervention
```

### Governance Efficiency
```
METRIC: Decisions per approval-hour invested
  governance_efficiency = decisions_made / total_reviewer_hours_consumed
  Target: baseline + 10% annual improvement

GOVERNANCE WASTE:
  approval_saturation: approval queue > 0.80 utilization at any tier (bottleneck)
  redundant_approvals: multiple approvers reviewing same item independently (no batch)
  unnecessary_escalations: items escalated but resolved at same level (miscalibrated trigger)
  over-documented reviews: review artifacts significantly longer than decision warrants

EFFICIENCY PROPOSALS:
  Batch similar approvals for same reviewer: saves context-switching overhead
  Pre-approval templates: for deterministic patterns, auto-generate approval record
  Parallel approval paths: if two independent approvers required, run concurrently
```

---

## Flow Efficiency Analysis

```
FLOW EFFICIENCY = Active_Work_Time / Total_Cycle_Time
  (Active_Work = time an item is being worked on; not waiting, not in queue)
  Target: >= 0.40 (40% of cycle time = active work)

FLOW EFFICIENCY BY STAGE:
  Analysis stage: min 10% of cycle time
  Development stage: target 40% of cycle time
  Review/gate stage: target 20% of cycle time
  Queue/wait time: should not exceed 30% of cycle time

BOTTLENECK IDENTIFICATION FROM FLOW:
  If review_stage_time > 30%: approval bottleneck → governance-optimizer.md
  If queue_wait_time > 35%: scheduling or capacity bottleneck → runtime-optimizer.md
  If development_time < 30%: scope is too large per item; break down work items

FLOW EFFICIENCY TREND:
  Compute monthly; target improvement of +2% per quarter until >= 0.40
  If declining: immediate investigation; bottleneck-detector.md
```

---

## Resource Utilization Efficiency

```
UTILIZATION ANALYSIS (per resource type):

  AGENT UTILIZATION:
    Target: 0.60–0.80 utilization
    Under-utilized (< 0.40): over-provisioned; recommend pool reduction
    Over-utilized (> 0.90): under-provisioned; recommend scale-out or load balance

  COMPUTE UTILIZATION:
    Peak vs. average: high peak/average ratio = bursty workload; pre-scaling opportunity
    Idle compute cost: compute provisioned but idle > 40% of time → scale-in

  HUMAN REVIEWER UTILIZATION:
    Target: 0.50–0.70 utilization (governance is not production; need headroom)
    Over-utilized (> 0.80): approval queue saturated → add approvers or delegate
    Under-utilized (< 0.30): fewer approval requirements; may indicate quality issues upstream
```

---

## Efficiency Benchmark Registry

```
MAINTAINED IN: memory/recursive-self-improvement/efficiency-benchmarks.yaml
PURPOSE: Track efficiency trends over time; detect regression; celebrate improvement

BENCHMARK RECORD (per dimension per quarter):
  dimension: string
  quarter: YYYY-QN
  efficiency_score: float
  cost_per_unit: float
  delta_from_prior_quarter: float
  best_in_class: float (best observed value for this dimension)
  gap_to_best: float

BENCHMARK REVIEW: Quarterly by self-improvement-engine.md
REGRESSION ALERT: Efficiency score drops >= 10% quarter-over-quarter
IMPROVEMENT RECOGNITION: Improvement >= 15% → share learnings to improvement-memory.md
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Flow efficiency (org avg)               >= 0.40
Rework cost ratio                       < 0.15
Context waste ratio                     < 0.25
Approval saturation (max tier)          < 0.80
Efficiency improvement per quarter     >= +5% on at least 2 dimensions
Efficiency benchmarks current           = 100% (all dimensions measured this quarter)
```
