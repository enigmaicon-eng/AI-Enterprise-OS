# Predictive Resource Planner

## Role
Forecasts resource demand for upcoming workflows and sprint work, enabling proactive capacity reservation, pre-warming, and budget allocation before execution begins rather than reacting to saturation in real-time.

## Forecast Inputs

```
SIGNAL                          SOURCE                      WEIGHT
sprint_backlog_tokens           sprints/active-sprint.yaml  HIGH
scheduled_workflows             memory/workflow-engine/     HIGH
historical_workflow_mix         execution history 30d       MEDIUM
calendar_patterns               org event calendar          MEDIUM
pipeline_intake_rate            work-queue current depth    HIGH
known_external_triggers         integrations/               LOW
```

## Demand Forecasting Model

### Short-Horizon (next 1 hour)
```
METHOD: time-series extrapolation of current execution rates
  token_demand_1h = rolling_avg_tokens_per_hour × predicted_workflow_count_1h
  agent_demand_1h = task_type_mix × routing_model → agent load per agent

UPDATE: every 5 minutes
ACCURACY_TARGET: within 20% of actual
```

### Medium-Horizon (next 24 hours)
```
METHOD: sprint backlog decomposition + historical workflow cost profiles
  FOR each backlog_item:
    estimated_tokens = avg_tokens[workflow_type] × complexity_factor
  sum by time_slot → hourly demand curve

UPDATE: hourly
ACCURACY_TARGET: within 35% of actual
```

### Long-Horizon (next sprint)
```
METHOD: sprint velocity × avg_cost_per_story_point × complexity_distribution
UPDATE: at sprint planning
ACCURACY_TARGET: within 50% of actual (budget planning signal)
```

## Capacity Reservation Protocol

```
WHEN demand_forecast_1h > current_available_capacity × 0.80:
  1. RESERVE: pre-allocate agent pool capacity for forecasted task_types
  2. PRE_WARM: notify agents of upcoming work type (reduce startup latency)
  3. DEFER: low-priority background work to off-peak window
  4. ALERT: if even with reservation, capacity will be insufficient → escalate

RESERVATION_LEAD_TIME:
  agent_pre_warming:    5min before expected demand peak
  context_pre_loading:  2min before workflow start
  approval_queue_alert: 30min before governance-heavy period
```

## Budget Pre-Allocation

```yaml
sprint_budget_allocation:
  sprint_id: string
  total_token_budget: number
  allocation_by_priority:
    P0_critical: 0.40    # reserved, cannot be reallocated
    P1_high:     0.30
    P2_medium:   0.20
    P3_low:      0.10    # first to be deferred if over budget
  contingency_reserve: 0.15    # held back for unplanned work
  forecast_confidence: LOW | MEDIUM | HIGH
```

## Forecast Accuracy Tracking
```
AFTER each forecasted period:
  record: (forecasted_tokens, actual_tokens, forecasted_agents, actual_agents)
  compute: accuracy = 1 - |forecast - actual| / actual
  update: EWMA of accuracy per horizon (α=0.3)
  IF accuracy_30d_avg < 0.60: trigger forecast_model_recalibration
```

## Persistence
`memory/resource-intelligence/demand-forecasts.yaml`
`memory/resource-intelligence/forecast-accuracy.yaml`
