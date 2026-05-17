# Routing Optimizer

## Role
Continuously improves agent selection and task routing decisions by learning from historical routing outcomes, capability fit scores, and post-execution quality signals.

## Routing Quality Signal Pipeline

```
EXECUTION COMPLETE
    ↓
capture: (task_type, routed_to_agent, quality_score, duration, outcome)
    ↓
update: agent_fit_model[task_type][agent_id]
    ↓
IF sample_count >= 10: re-rank routing candidates
    ↓
IF re-ranking changes top candidate: emit routing_update_proposal
```

## Agent Fit Model

### Fit Score Formula
```
fit_score(agent, task_type) =
  (quality_weight × avg_quality_score_last_30d) +
  (speed_weight   × normalized_speed_score) +
  (success_weight × success_rate_last_30d)

WEIGHTS: quality=0.50, speed=0.25, success=0.25
MIN_SAMPLES_TO_USE_LEARNED_SCORE: 5
FALLBACK: use declared_capability_score from agent-registry
```

### Capability Gap Detection
```
FOR each task_type with >= 20 routing decisions:
  IF max(fit_score) < 0.70:
    EMIT capability_gap_alert → agents/MASTER-REGISTRY.md (new agent needed)
  IF all agents fail for same task_type pattern:
    EMIT task_pattern_unsupported → architecture team
```

## Routing Rule Updates

### Dynamic Rule Adjustment
```yaml
rule_update_record:
  rule_id: string
  task_type_pattern: string
  previous_primary_agent: string
  new_primary_agent: string
  evidence:
    quality_delta: +0.12
    sample_count: 47
    confidence: 0.84
  change_type: PREFERENCE_SHIFT | CAPABILITY_DISCOVERY | DEGRADATION_RESPONSE
  approved_by: auto | human
  effective_from: ISO8601
```

### Load Balancing Optimization
```
DETECT: agent_utilization > 0.85 for > 10min
ACTION: temporarily re-weight routing toward under-utilized capable agents
REVERT: when primary agent utilization drops below 0.70
```

## Routing Experiment Framework

When competing agents have similar fit scores (within 0.05), run A/B routing:
```
EXPERIMENT:
  allocation: 80% primary / 20% challenger
  duration: 48hr or 100 decisions (whichever first)
  success_metric: composite(quality, speed, success_rate)
  auto_adopt: IF challenger wins by > 0.05 AND p < 0.05
```

## Persistence
`memory/optimization-engine/routing-model.yaml` — learned fit scores + active experiments
