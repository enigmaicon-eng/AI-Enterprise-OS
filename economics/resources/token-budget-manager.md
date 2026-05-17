# Token Budget Manager

## Role
Manages the token economy of the OS: allocates context budgets per workflow, agent, and tier; tracks consumption in real-time; enforces hard limits; and feeds cost data to the optimization engine.

## Budget Allocation Model

### Tier Budgets (per execution session)
```
TIER    CONTEXT_BUDGET_TOKENS   TOOL_CALLS_MAX   DELEGATION_DEPTH_MAX
T1      50,000                  20               1
T2      100,000                 50               2
T3      200,000                 100              3
T4      500,000                 200              4
T5      1,000,000               unlimited        5
```

### Per-Workflow Budgets
```yaml
workflow_budget:
  workflow_type: string
  total_token_allocation: number
  per_step_allocations: {step_id: token_limit}
  context_inheritance_pct: number   # how much parent context passes to child
  budget_reserve_pct: 0.10          # 10% held back for error handling
  overflow_policy: HARD_STOP | COMPRESS | ESCALATE
```

## Real-Time Consumption Tracking

```
ON EACH TOKEN EMISSION:
  1. debit from: workflow_budget.remaining + agent_budget.remaining + tier_budget.remaining
  2. IF any budget hits 80% consumed:
     WARN: emit budget_pressure_alert
     ACTION: trigger context-compression-protocol (memory-governance)
  3. IF any budget hits 95% consumed:
     HARD LIMIT approaching: pause new sub-tasks
     ESCALATE: to orchestrator for budget extension decision
  4. IF budget exhausted:
     STOP: no new token emissions permitted for this scope
     PRESERVE: save current state to continuation-systems for resumption
```

## Budget Extension Protocol
```
REQUEST: workflow_id, current_consumption, estimated_remaining_need, justification
APPROVAL_REQUIRED: any extension > 2x original allocation → T3+ human approval
AUTO_APPROVE: up to 1.5x original allocation IF workflow quality_score > 0.80
```

## Cost Attribution
```yaml
cost_record:
  execution_id: string
  workflow_type: string
  team: string
  feature: string
  tokens_input: number
  tokens_output: number
  estimated_cost_usd: number    # based on model pricing
  efficiency_score: number      # tokens_useful / tokens_total (estimated)
  date: ISO8601
```

## Budget Optimization Signals
```
HIGH_VALUE_WORKFLOWS: flag workflows where output quality justifies token spend
LOW_EFFICIENCY_WORKFLOWS: flag workflows where token spend exceeds quality output
CONTEXT_LEAK_DETECTION: flag agents that consistently pass oversized context
```

## Persistence
`memory/resource-intelligence/budget-state.yaml`    — live budget ledger
`memory/resource-intelligence/cost-tracker.jsonl`   — append-only cost log
