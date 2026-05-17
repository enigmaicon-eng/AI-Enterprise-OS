# Cost Optimization Advisor

## Role
Generates actionable cost reduction recommendations by analyzing waste patterns, efficiency scores, and resource utilization data. Produces prioritized recommendations ranked by estimated savings with implementation guidance.

## Recommendation Categories

### 1. Context Reduction
```
TRIGGER: workflow context_efficiency_score < 0.60
ANALYSIS:
  - identify top context contributors (which documents/knowledge passes in)
  - identify context that agents consistently ignore (low utilization)
RECOMMENDATION:
  "Trim context for workflow type [X] by removing [Y] (estimated -[N] tokens/run)"
ESTIMATED_SAVINGS: tokens_trimmed × runs_per_day × token_cost_per_unit
```

### 2. Routing Optimization
```
TRIGGER: task_type routed to expensive (high-tier) agent when lower-tier can handle
ANALYSIS:
  - compare quality_score of T3 vs T2 routing for task_type
  - IF quality_delta < 0.05: lower tier adequate
RECOMMENDATION:
  "Route [task_type] to T2 agents; quality equivalent, cost -[N]% per execution"
```

### 3. Workflow Batching
```
TRIGGER: high frequency of small, same-type workflows executed independently
ANALYSIS:
  - detect: >= 5 same-type workflows starting within 10min window
  - estimate: batching savings (shared context loading, single governance check)
RECOMMENDATION:
  "Batch [workflow_type] executions into groups of [N]; estimated -30% per batch"
```

### 4. Caching Opportunities
```
TRIGGER: same knowledge retrieval or computation repeated > 3x in 1hr
ANALYSIS:
  - identify cacheable computation results (deterministic + inputs stable)
  - estimate cache hit rate based on historical frequency
RECOMMENDATION:
  "Cache results of [operation] for [TTL]min; estimated -[N] tokens/day"
```

### 5. Schedule Shifting
```
TRIGGER: expensive non-urgent work executing during peak demand windows
ANALYSIS:
  - identify deferrable workflows (P2/P3 priority)
  - identify off-peak windows (historically low utilization)
RECOMMENDATION:
  "Defer [workflow_type] to [off-peak window]; reduces peak contention, no quality impact"
```

## Recommendation Prioritization
```
ROI_score = estimated_monthly_savings_usd / implementation_effort_score
            where effort_score: 1=config change, 2=workflow change, 3=agent change

PRESENT_TOP: 5 recommendations by ROI_score
INCLUDE: confidence_level, implementation_steps, estimated_savings, payback_period
```

## Recommendation Record
```yaml
recommendation_id: CADV-{seq}
category: CONTEXT_REDUCTION | ROUTING | BATCHING | CACHING | SCHEDULE_SHIFT
title: string
description: string
estimated_monthly_savings_usd: number
estimated_monthly_token_reduction: number
implementation_effort: LOW | MEDIUM | HIGH
roi_score: number
confidence: number
auto_implementable: boolean    # some recommendations self-implement via workflow-optimizer
status: OPEN | ACCEPTED | IMPLEMENTING | DONE | REJECTED
```

## Persistence
`memory/resource-intelligence/optimization-recommendations.yaml`
