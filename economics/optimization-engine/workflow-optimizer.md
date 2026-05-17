# Workflow Optimizer

## Role
Learns optimal workflow execution patterns from historical traces and applies incremental improvements to routing, step ordering, parallelization, and gate configuration.

## Learning Model

### Input Features (per workflow execution)
```
- workflow_definition_id
- step_sequence: [step_id, duration_ms, wait_time_ms, agent_id, outcome]
- gate_results: [gate_id, verdict, evaluation_time_ms]
- total_duration_ms
- queue_wait_time_ms
- context_tokens_used
- retry_count
- outcome: SUCCESS | PARTIAL | FAILED
```

### Learned Optimizations

**1. Step Parallelization Discovery**
```
PATTERN: two steps consistently execute sequentially with no artifact dependency
ACTION:  propose parallel execution → estimated savings = min(step_a_duration, step_b_duration)
GUARD:   validate no hidden dependency via artifact-registry scan
CONFIDENCE_THRESHOLD: 0.80 (seen in >= 20 executions without dependency)
```

**2. Gate Threshold Tuning**
```
PATTERN: gate passes at rate > 0.98 over 30-day window
ACTION:  propose relaxing gate preconditions (not removing gate)
PATTERN: gate fails consistently for specific workflow sub-type
ACTION:  propose adding pre-gate validation step to catch issue earlier
```

**3. Agent Pre-warming**
```
PATTERN: step N always follows step M within 2min
ACTION:  pre-warm agent for step N during step M execution
SAVINGS: agent startup latency (typically 200–800ms)
```

**4. Context Pruning**
```
PATTERN: agent uses < 30% of context tokens passed to it
ACTION:  propose context trimming rules for that workflow type
SAVINGS: token cost reduction + faster processing
```

## Optimization Record Schema
```yaml
optimization_id: OPT-WF-{workflow_id}-{seq}
workflow_definition_id: string
optimization_type: PARALLELIZATION | GATE_TUNING | PRE_WARMING | CONTEXT_PRUNING
description: string
estimated_savings_ms: number
estimated_cost_reduction_pct: number
confidence: 0.0-1.0
evidence_count: number    # executions this was observed in
proposed_at: ISO8601
status: PROPOSED | APPROVED | ACTIVE | ROLLED_BACK | REJECTED
impact_measured:
  actual_savings_ms: number
  measured_at: ISO8601
```

## Persistence
`memory/optimization-engine/workflow-optimizations.yaml`
