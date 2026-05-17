# Bottleneck Learning Engine

## Role
Learns systematic bottleneck patterns from historical execution data, builds predictive models for bottleneck onset, and generates preemptive mitigation recommendations before bottlenecks impact production workflows.

## Bottleneck Classification

```
CLASS           DEFINITION                                      PREDICTION_HORIZON
────────────────────────────────────────────────────────────────────────────────────
AGENT_SATURATION    single agent > 85% utilization             10min ahead
QUEUE_DEPTH         task queue depth > 50 items                5min ahead
CONTEXT_EXHAUSTION  context budget > 80% consumed             immediate
DEPENDENCY_WAIT     blocking on upstream artifact              15min ahead
GOVERNANCE_QUEUE    approval queue depth > 20 items           30min ahead
TOOL_RATE_LIMIT     external tool approaching rate limit       5min ahead
KNOWLEDGE_GAP       agent repeatedly queries missing knowledge  post-hoc
COORDINATION_DELAY  cross-agent handoff latency > 2x baseline  10min ahead
```

## Learning Algorithm

### Pattern Recognition (runs hourly)
```
FOR each bottleneck event in last 30 days:
  1. extract: (preconditions, lead_time, severity, resolution_method, resolution_time)
  2. cluster similar events by precondition signature
  3. FOR clusters with size >= 5:
     - build onset_predictor: precondition → P(bottleneck within horizon)
     - record best_resolution from historical data
     - compute avg_resolution_time_min
```

### Predictive Signal Composition
```
bottleneck_risk_score = Σ(
  queue_depth_signal    × 0.30,
  utilization_signal    × 0.25,
  historical_rate       × 0.25,
  time_of_day_factor    × 0.10,
  workload_spike_signal × 0.10
)

ALERT_THRESHOLD: 0.65
PRE_EMPTIVE_ACTION_THRESHOLD: 0.80
```

## Mitigation Playbook (auto-generated from learned resolutions)

```yaml
playbook_entry:
  bottleneck_class: string
  trigger_conditions: [string]
  recommended_actions:
    - action: REDISTRIBUTE_LOAD
      estimated_relief_time_min: number
      applicable_when: [string]
    - action: PRE_WARM_AGENTS
      estimated_relief_time_min: number
    - action: THROTTLE_INTAKE
      estimated_relief_time_min: number
    - action: ESCALATE_TO_HUMAN
      applicable_when: predicted_severity == CRITICAL
  historical_success_rate: number
  avg_resolution_time_min: number
```

## Persistence
`memory/performance-learning/bottleneck-models.yaml`
`memory/performance-learning/bottleneck-history.jsonl`
