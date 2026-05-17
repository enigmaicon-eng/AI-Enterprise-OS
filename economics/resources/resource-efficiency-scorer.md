# Resource Efficiency Scorer

## Role
Computes efficiency scores for workflows, agents, and the OS overall by comparing resource consumption against outputs delivered. Identifies waste, surfaces efficiency leaders for pattern replication, and feeds signals to the optimization engine.

## Efficiency Score Model

### Workflow Efficiency Score
```
efficiency_score = (
  output_quality_score     × 0.40
  + token_efficiency_score × 0.30    # tokens useful / tokens consumed (estimated)
  + time_efficiency_score  × 0.20    # vs p50 baseline for workflow type
  + retry_penalty          × 0.10    # (1 - retry_rate) × weight
)

TOKEN_EFFICIENCY_ESTIMATION:
  useful_token_proxy = output_length × avg_information_density_factor
  efficiency = min(1.0, useful_token_proxy / tokens_consumed)
  NOTE: proxy, not exact — quality_score is the primary efficiency signal

THRESHOLDS:
  EXCELLENT: >= 0.85
  GOOD:      0.70-0.84
  ACCEPTABLE: 0.55-0.69
  POOR:      < 0.55 → flag for investigation
```

### Agent Efficiency Score
```
agent_efficiency = (
  avg_task_efficiency_score_30d  × 0.50
  + context_utilization_score    × 0.25    # output quality per token
  + latency_score                × 0.25    # actual vs. p50 baseline
)
```

### OS-Wide Efficiency Index
```
os_efficiency_index = weighted_avg(
  all workflow_efficiency_scores,
  weights: proportional to workflow token cost
)
TARGET: >= 0.75
ALERT_IF_BELOW: 0.65 (7-day trailing avg)
```

## Waste Detection Categories

```
CATEGORY                    SIGNAL                               WASTE_ESTIMATE
OVER_CONTEXTING             context_used < 30% of allocated     70% of allocated tokens = waste
REDUNDANT_RETRIEVAL         same knowledge retrieved 3+ times   each repeat = waste
PREMATURE_ESCALATION        escalation resolved at same tier     escalation overhead = waste
RETRY_OVERHEAD              retry_count > 1                      1st retry = 50% overhead
IDLE_AGENT_TIME             agent_wait > agent_work              wait_time = waste
DUPLICATE_EXECUTION         same workflow run twice in 1hr       2nd run = waste
```

## Efficiency Leaderboard (weekly)
```
TOP_WORKFLOWS:     top 5 by efficiency_score (candidate patterns for replication)
TOP_AGENTS:        top 5 by agent_efficiency_score (candidate for increased routing share)
IMPROVEMENT_PICKS: bottom 5 with highest improvement potential (ROI-ranked)
```

## Integration
- Feeds `optimization-engine/self-optimization-controller.md` → efficiency signals
- Feeds `resource-intelligence/cost-optimization-advisor.md` → waste patterns
- Feeds `improvement-governance/improvement-proposal-engine.md` → improvement ROI

## Persistence
`memory/resource-intelligence/efficiency-scores.yaml`
`memory/resource-intelligence/waste-detection-log.jsonl`
