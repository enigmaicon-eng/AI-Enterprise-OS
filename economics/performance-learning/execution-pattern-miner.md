# Execution Pattern Miner

## Role
Mines recurring patterns from the execution trace history to surface reusable optimization intelligence, detect systemic inefficiencies, and feed the learning models of the optimization engine.

## Pattern Categories

### 1. Latency Patterns
```
SEQUENTIAL_BOTTLENECK:
  signal: one step accounts for > 40% of total workflow duration
  frequency: >= 5 occurrences in 7 days
  output: step_id, avg_duration_ms, pct_of_total, workflow_types_affected

WAIT_ACCUMULATION:
  signal: queue_wait_time > execution_time for any step
  frequency: >= 3 occurrences
  output: step_id, avg_wait_ms, avg_exec_ms, resource_contention_type

GATE_BOTTLENECK:
  signal: gate evaluation time > 30s p95
  frequency: sustained over 24hr window
  output: gate_id, p95_eval_time_ms, contributing_checks
```

### 2. Failure Patterns
```
RETRY_STORM:
  signal: retry_count > 3 for same step in >= 10% of executions
  output: step_id, failure_mode, root_cause_hypothesis, suggested_fix

CASCADING_FAILURE:
  signal: failure in step A correlates (r > 0.7) with failure in step B
  output: step_pair, correlation_coefficient, common_conditions

TIMEOUT_CLUSTER:
  signal: timeouts concentrated in specific time window or agent
  output: time_window | agent_id, timeout_rate, environmental_signal
```

### 3. Resource Patterns
```
CONTEXT_BLOAT:
  signal: context_tokens_used growing trend (> 10% increase week-over-week per workflow type)
  output: workflow_type, growth_rate, top_context_contributors

AGENT_SATURATION:
  signal: single agent handles > 60% of a task_type AND p95_wait > 5min
  output: agent_id, task_type, saturation_pct, time_period

UNDERUTILIZED_CAPABILITY:
  signal: agent with high fit_score for task_type receives < 5% routing share
  output: agent_id, task_type, current_share, fit_score
```

## Mining Schedule
```
REAL_TIME: retry_storm, cascading_failure (alert immediately if detected)
EVERY_15MIN: latency patterns, agent_saturation
HOURLY: resource patterns, context_bloat
DAILY: full pattern refresh + weekly trend analysis
```

## Output Format
```yaml
pattern_record:
  pattern_id: PAT-{category}-{seq}
  category: LATENCY | FAILURE | RESOURCE
  type: string
  first_detected: ISO8601
  last_seen: ISO8601
  occurrence_count: number
  severity: LOW | MEDIUM | HIGH | CRITICAL
  affected_workflows: [string]
  affected_agents: [string]
  recommended_action: string
  forwarded_to: [string]     # which optimizer subsystems received this
```

## Persistence
`memory/performance-learning/detected-patterns.yaml`
`memory/performance-learning/pattern-history.jsonl`
