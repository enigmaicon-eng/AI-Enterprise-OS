# Performance Feedback Loop

## Role
Captures post-execution performance signals from all OS subsystems, normalizes and validates them, and routes them to the appropriate learning models. The central nervous connection between execution reality and optimization intelligence.

## Signal Taxonomy

```
SIGNAL_CLASS        SOURCE                          WEIGHT
────────────────────────────────────────────────────────────
EXECUTION_OUTCOME   workflow execution events       1.00
QUALITY_SCORE       supervisor agent evaluations    0.90
HUMAN_OVERRIDE      human correction of AI output   0.95
GATE_VERDICT        quality gate pass/fail           0.85
ESCALATION          escalation events               0.80
USER_FEEDBACK       explicit user rating            1.00
AUDIT_FINDING       compliance audit results        0.90
AGENT_SELF_REPORT   agent confidence reports        0.40
```

## Signal Capture Protocol

### On Workflow Completion
```
EMIT signal:
  type: EXECUTION_OUTCOME
  workflow_id: string
  workflow_type: string
  duration_ms: number
  queue_wait_ms: number
  retry_count: number
  agent_assignments: [{step_id, agent_id, duration_ms, quality_score}]
  gate_results: [{gate_id, verdict, duration_ms}]
  outcome: SUCCESS | PARTIAL | FAILED
  context_tokens_used: number
  cost_tokens: number
```

### On Human Override
```
EMIT signal:
  type: HUMAN_OVERRIDE
  workflow_id: string
  step_id: string
  original_agent_id: string
  override_type: REASSIGN | REJECT_OUTPUT | MODIFY_OUTPUT | ESCALATE
  override_reason: string (if provided)
  overrider_tier: T1-T5
```

## Signal Routing

```
EXECUTION_OUTCOME → workflow-optimizer + agent-assignment-optimizer + resource-intelligence
QUALITY_SCORE     → routing-optimizer + agent-assignment-optimizer
HUMAN_OVERRIDE    → routing-optimizer (high-weight signal)
GATE_VERDICT      → policy-optimizer + workflow-optimizer
ESCALATION        → bottleneck-learning-engine + routing-optimizer
USER_FEEDBACK     → routing-optimizer + agent-assignment-optimizer (highest weight)
AUDIT_FINDING     → policy-optimizer
AGENT_SELF_REPORT → agent-assignment-optimizer (low weight, sanity check only)
```

## Signal Validation
```
REJECT if:
  - signal_age > 5min (stale signal)
  - workflow_id not in execution-registry (orphan signal)
  - duplicate signal_id (exactly-once dedup)
  - source_agent not authorized to emit this signal_class
```

## Feedback Loop Health Metrics
```yaml
signals_received_per_hour: number       # target: > 10
signals_rejected_rate: number           # target: < 5%
signal_lag_p95_ms: number              # target: < 500ms
coverage_pct_of_executions: number     # target: > 95%
```

## Persistence
`memory/performance-learning/feedback-signals.jsonl` (append-only, 30-day retention)
`memory/performance-learning/feedback-loop-health.yaml`
