# Agent Assignment Optimizer

## Role
Optimizes agent-to-task assignment by learning from historical assignment outcomes. Maintains per-agent, per-task-type performance profiles and feeds improved routing recommendations to the routing-optimizer.

## Assignment Performance Profile

```yaml
profile_record:
  agent_id: string
  task_type: string
  sample_count: number
  last_updated: ISO8601
  
  quality:
    avg_score: number           # 0.0-1.0
    p10_score: number
    p90_score: number
    trend_30d: IMPROVING | STABLE | DECLINING
  
  speed:
    avg_duration_ms: number
    p95_duration_ms: number
    trend_30d: IMPROVING | STABLE | DECLINING
  
  reliability:
    success_rate: number
    retry_rate: number
    escalation_rate: number
  
  composite_fit_score: number   # weighted composite, used by routing-optimizer
  confidence: LOW | MEDIUM | HIGH  # based on sample_count
```

### Confidence Bands
```
sample_count < 5:   confidence = LOW    (use declared capability, ignore learned score)
sample_count 5-20:  confidence = MEDIUM (blend: 40% learned + 60% declared)
sample_count > 20:  confidence = HIGH   (use learned score fully)
```

## Specialty Discovery

When an agent consistently outperforms its declared capability level:
```
IF avg_quality_score > declared_capability_score + 0.15 AND sample_count >= 20:
  EMIT undeclared_specialty_discovery:
    agent_id: string
    task_type: string
    declared_level: string
    observed_level: string
    recommendation: "Update agent registry capability declaration"
```

## Assignment Experiment Protocol

For unproven agents (sample_count < 5 for task_type):
```
SHADOW_ASSIGNMENT:
  1. Route task to proven primary agent (normal execution)
  2. Also route to experimental agent in read-only mode
  3. Compare outputs on quality dimensions without affecting production
  4. After 5 shadow runs: promote to real assignments if quality >= 0.80
  5. Shadow mode never blocks production; fails silently if experimental agent unavailable
```

## Underperformance Response
```
IF composite_fit_score < 0.60 AND sample_count >= 10:
  1. flag agent for coaching: agent-performance-coach.md
  2. reduce routing share by 50% for this task_type
  3. review after 20 additional assignments
  4. IF no improvement: remove from routing pool for task_type
```

## Persistence
`memory/performance-learning/assignment-profiles.yaml`
`memory/performance-learning/specialty-discoveries.yaml`
