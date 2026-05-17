# Capacity Intelligence Engine

## Role
Tracks, models, and forecasts team capacity across sprints and quarters. Accounts for planned PTO, training, onboarding, incident load, and governance overhead to produce realistic capacity estimates that prevent over-commitment and under-utilization.

## Capacity Model

```
GROSS_CAPACITY:     team_size × sprint_days × hours_per_day
                    (default: hours_per_day = 6 for knowledge work)

DEDUCTIONS:
  planned_pto:      declared PTO in sprint (hours)
  onboarding_load:  new team members × ramp_factor × sprint_days
  training:         declared training events (hours)
  governance_overhead: avg governance hours from last 4 sprints
  incident_reserve: avg incident hours from last 8 sprints × 1.20 (buffer)

NET_CAPACITY = GROSS_CAPACITY - Σ(deductions)

AVAILABLE_FOR_PLANNED_WORK:
  planned_work_capacity = NET_CAPACITY × (1 - interrupt_rate_rolling)
  interrupt_rate_rolling: rolling 4-sprint average of actual interrupt_rate
```

## Capacity Tracking

```
TRACKING GRANULARITY:
  Per person: PTO declarations, training schedules, on-call rotation
  Per sprint: aggregate gross, deductions, net, utilized

UTILIZATION:
  actual_utilized:     hours spent on completed work (from workflow execution times)
  utilization_rate:    actual_utilized / NET_CAPACITY
  TARGET:              0.75–0.90 (below 0.75 = under-utilized; above 0.90 = unsustainable)

CAPACITY ALERT RULES:
  net_capacity < 0.60 × gross_capacity: LOW_CAPACITY sprint → warn against ambitious commitments
  utilization_rate > 0.92 for 2+ sprints: OVERLOAD → coaching + recruit discussion
  utilization_rate < 0.60 for 2+ sprints: UNDER_LOAD → team allocation review
```

## Capacity Forecasting

```
SPRINT FORECAST:
  inputs: team roster, declared PTO calendar, known training, historical interrupt rate
  output: predicted_net_capacity ± uncertainty_band
  horizon: 3 sprints ahead (confidence degrades with horizon)

QUARTERLY FORECAST:
  aggregate by quarter; factor in known headcount changes
  scenario: headcount_stable | +1_hc | -1_hc | +20%_incident_load
  used by: delivery planning, hiring recommendations

CAPACITY_VS_BACKLOG:
  backlog_burn_rate = net_capacity × planned_work_capacity_pct / avg_work_item_points
  sprints_to_empty_backlog = backlog_size_points / burn_rate
  IF sprints_to_empty < 3: alert PM — backlog replenishment needed
  IF sprints_to_empty > 10: alert PM — backlog grooming or scope reconsideration
```

## Ramp Model for New Team Members

```
RAMP STAGES:
  Week 1–4:   20% productivity (onboarding, learning systems)
  Week 5–8:   50% productivity (guided work with reviews)
  Week 9–16:  75% productivity (independent with oversight)
  Week 17+:   100% productivity (full team member)

RAMP ADJUSTMENT:
  sprint_capacity_adjustment = Σ(new_member.ramp_factor × FTE_equivalent)
  Logged per new member; auto-adjusted as ramp stages progress
```

## Capacity Intelligence Report

```
GENERATED: sprint planning + on-demand + quarterly
SECTIONS:
  1. Sprint capacity breakdown (gross → deductions → net → planned_work_capacity)
  2. Utilization trend (last 6 sprints)
  3. Ramp contributions (if new members)
  4. Capacity forecast: next 3 sprints
  5. Backlog burn projection
  6. Recommendations (if overload/underload/ramp risk detected)
```

## Persistence
`memory/team-intelligence/capacity-records.yaml`
`memory/team-intelligence/capacity-forecasts.yaml`
`memory/team-intelligence/pto-calendar.yaml`
