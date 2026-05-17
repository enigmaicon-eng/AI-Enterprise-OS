# Cost Allocation Engine

## Role
Attributes all OS resource consumption (tokens, tool calls, compute time) to cost centers — workflows, teams, features, and projects. Enables cost visibility, chargeback, and budget forecasting.

## Cost Hierarchy

```
ORGANIZATION
  └── TEAM
        └── PROJECT
              └── FEATURE
                    └── WORKFLOW_EXECUTION
                          └── STEP (per agent invocation)
```

## Attribution Model

### Direct Attribution (primary)
```
EXECUTION → WORKFLOW_TYPE → FEATURE → PROJECT → TEAM
  cost = tokens_input × input_rate + tokens_output × output_rate
  allocation_key = (team_id, project_id, feature_id, workflow_type)
```

### Shared Cost Attribution (infrastructure overhead)
```
SHARED_OVERHEAD_CATEGORIES:
  - governance_approvals       → attributed proportionally to workflow initiating team
  - memory_operations          → attributed proportionally to consuming workflow
  - monitoring_telemetry       → attributed equally across all active teams
  - orchestration_overhead     → attributed proportionally to execution count

OVERHEAD_RATE: 15% uplift on direct costs
```

## Cost Center Budget Tracking

```yaml
cost_center_record:
  id: string                   # {team_id}-{project_id}
  monthly_budget_usd: number
  monthly_consumed_usd: number
  daily_burn_rate_usd: number
  forecast_month_end_usd: number
  status: ON_TRACK | AT_RISK | OVER_BUDGET
  
  alerts:
    warn_at_pct: 0.75
    critical_at_pct: 0.90
    auto_throttle_at_pct: 0.95    # reduce new workflow intake
```

## Cost Reporting

### Daily Summary (auto-generated at 00:00 UTC)
```
Top 5 workflows by cost
Top 5 teams by cost
Anomalies: > 50% spike vs 7-day avg
Efficiency leaders: best output/cost ratio
Efficiency laggards: worst output/cost ratio
```

### Monthly Cost Report (generated on 1st of month)
```
Full cost breakdown by team/project/feature
Month-over-month comparison
Top optimization opportunities with estimated savings
Budget vs. actual by cost center
```

## Optimization Opportunities Detected
```
IF workflow_cost_pct_of_total > 0.20:
  flag as high-cost workflow → route to cost-optimization-advisor

IF cost_per_output_quality_unit increasing trend (> 10% week-over-week):
  flag as efficiency decline → route to self-optimization-controller

IF team_cost growing > 25% month-over-month:
  alert team + delivery lead
```

## Persistence
`memory/resource-intelligence/cost-allocation.yaml`   — current period allocations
`memory/resource-intelligence/cost-history.jsonl`     — append-only historical log
