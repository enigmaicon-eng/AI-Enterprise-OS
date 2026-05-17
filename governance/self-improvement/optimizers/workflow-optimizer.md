# Workflow Optimizer

**Component:** RSI-OPT-001 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Continuously improves the execution efficiency, quality, and reliability of all enterprise workflows (WF-001–WF-023). Analyzes workflow telemetry, identifies optimization opportunities in DAG structure, gate calibration, parallelization, routing, and step execution, and generates proposals for the self-improvement engine.

---

## Workflow Optimization Dimensions

```
DIMENSION               TARGET METRIC               CURRENT BASELINE LOOKUP
──────────────────────────────────────────────────────────────────────────────────────────────
End-to-end latency      SLA compliance rate >= 0.95  workflow_sla_compliance per WF-ID
Gate efficiency         Gate decision time < 500ms   gate_decision_time_ms_p99
Parallelization         Parallel step ratio >= 0.40  parallel_step_ratio per workflow
Routing accuracy        Agent fit score >= 0.80      agent_fit_score_avg
Step failure rate       < 0.03 per workflow class    step_failure_rate per WF-ID
Rollback frequency      < 0.05 of executions         rollback_rate per WF-ID
Context efficiency      Token cost within budget     token_cost_per_workflow
```

---

## Optimization Techniques

### 1. DAG Structure Optimization
```
ANALYSIS:
  Load workflow execution DAGs from WF-001–WF-023
  For each step pair (A, B) where B depends_on A:
    - Is there actual data dependency? (B uses A's output?)
    - If no data dependency: can be parallelized
    - If data dependency: is it direct or via artifact?

PARALLELIZATION OPPORTUNITIES:
  Identify: steps that could run concurrently but are serialized
  Validate: confirm no hidden dependencies (shared state, same artifact, ordering requirement)
  Proposal: update workflow DAG to add parallel lanes
  Impact: reduces critical path length; improves end-to-end time

STEP ELIMINATION:
  Identify: steps with skip_rate > 0.70 (step defined but skipped most of the time)
  Validate: is the step correctly conditioned? or is it dead code?
  Proposal: remove dead step or correct conditioning logic
```

### 2. Gate Calibration Optimization
```
ANALYSIS:
  For each gate (G-AUTH, G-QUALITY, G-ARCH, etc.):
    gate_pass_rate: what % of workflows pass this gate first-time?
    gate_decision_time: how long does the gate take to evaluate?
    gate_override_rate: how often is a gate decision overridden post-decision?

CALIBRATION SIGNALS:
  pass_rate < 0.50: gate threshold too strict OR inputs are poor quality (diagnose first)
  pass_rate > 0.98: gate threshold possibly too loose; may be missing quality issues
  decision_time > 2×SLA: gate evaluation logic is too slow; simplify or cache
  override_rate > 0.20: gate criteria misaligned with human judgment (recalibrate)

PROPOSAL TYPES:
  Threshold adjustment: tighten or loosen specific gate criteria
  Pre-gate enrichment: add preparation step before gate to improve pass rate
  Gate caching: cache gate results for identical inputs (deterministic gates only)
  Gate fusion: merge two closely related gates into one evaluation pass
```

### 3. Routing Optimization
```
ANALYSIS:
  For each workflow step that routes to an agent:
    agent_fit_score: was the routed agent the best match?
    agent_outcome_quality: did the selected agent produce high-quality output?
    alternative_agents: were better agents available?

ROUTING OPPORTUNITY SIGNAL:
  fit_score < 0.70 AND alternative_agent_score > 0.85: routing suboptimal
  outcome_quality < 0.75 for same step type repeatedly: routing error
  Agent A routed to step type X consistently produces quality < B: reroute X to B

PROPOSAL:
  Update routing-table to prefer agent B for step type X
  Add routing rule: "for workflow Y step N, prefer tier T3 specialist over T2 generalist"
  AB-test routing change before full deployment
```

### 4. Context Efficiency Optimization
```
ANALYSIS:
  token_cost_per_workflow by workflow type
  context_utilization: what % of loaded context is actually referenced by agent?
  redundant_context: context blocks loaded across multiple steps but used only once

OPPORTUNITY:
  Context loaded but utilization < 30%: trim context template for that step
  Same context block loaded in every step: load once at workflow start; reference thereafter
  Stale context (> 2 conversations old): refresh or drop

IMPACT: Token cost reduction; faster context loading; lower cost per execution
```

---

## Workflow-Specific Improvement Registry

```
TRACKED PER WORKFLOW (WF-001–WF-023):
  improvement_history: list of completed improvements
  current_opportunities: open opportunities awaiting proposal
  performance_trend: 30-day rolling SLA compliance trend
  next_review: scheduled next analysis cycle
  optimization_maturity: INITIAL → IMPROVING → STABLE → OPTIMAL
    INITIAL: < 3 improvements applied
    IMPROVING: 3–10 improvements; visible trend
    STABLE: > 10 improvements; metrics at or near target
    OPTIMAL: at target; monitoring only; proposals only on regression
```

---

## Implementation Protocol

```
BEFORE APPLYING WORKFLOW CHANGE:
  1. Stage in test environment with synthetic workload
  2. Run comparison: 50 executions new DAG vs. 50 executions current DAG
  3. Confirm improvement in target metric (p < 0.05 or practical significance >= 5%)
  4. Verify rollback: restore prior DAG; confirm system recovers
  5. Apply to production during maintenance window (02:00–04:00 UTC)
  6. Monitor: 24hr observation period before marking COMPLETED

ROLLBACK TRIGGER:
  Target metric worsens by >= 10% vs. baseline after 24hr: automatic rollback
  Any gate_pass_rate drops by >= 0.15: automatic rollback
  Any rollback_rate increases by >= 0.05: automatic rollback
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Workflows at SLA compliance >= 0.95      >= 0.85 of 23 workflows
Average gate decision time               < 500ms p99
Parallelization ratio (avg across WFs)  >= 0.35
Workflow improvements applied/quarter   >= 4
Improvement rollback rate               < 0.05
Optimization maturity STABLE or OPTIMAL >= 0.60 of workflows
```
