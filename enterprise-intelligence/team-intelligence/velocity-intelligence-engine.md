# Velocity Intelligence Engine

## Role
Analyzes sprint-over-sprint velocity patterns to detect trends, forecast future capacity, identify systemic velocity drains, and provide sprint commitment guidance. Distinguishes between natural velocity variance and structural issues that require intervention.

## Velocity Metrics

```
RAW_VELOCITY:      story_points (or normalized work items) completed per sprint
ADJUSTED_VELOCITY: raw_velocity adjusted for team size changes + known capacity impacts
ROLLING_VELOCITY:  3-sprint rolling average (primary planning signal)
SUSTAINABLE_VELOCITY: p25 of last 8 sprints (conservative; used for commitment planning)
STRETCH_VELOCITY:  p75 of last 8 sprints (optimistic; used for upside scenario)

VELOCITY_VARIANCE:
  CV (coefficient of variation) = std_dev / mean
  LOW variance:    CV < 0.15 — predictable team
  MEDIUM variance: 0.15–0.30 — normal
  HIGH variance:   > 0.30 — unpredictable; investigate root cause
```

## Velocity Pattern Detection

```
PATTERNS DETECTED:
  VELOCITY_GROWTH:     5+ consecutive sprints with upward trend (>5% per sprint)
  VELOCITY_DECLINE:    3+ consecutive sprints declining (>5% per sprint)
  VELOCITY_PLATEAU:    8+ sprints within ±10% band (stable; may indicate ceiling)
  SPRINT_COLLAPSE:     single sprint < 50% of rolling average (one-off event)
  CHRONIC_MISS:        3+ consecutive sprints below committed velocity
  HOLIDAY_PATTERN:     recurring velocity drop at predicted holiday periods
  RAMP_PATTERN:        new team member joining → temporary velocity dip then recovery

PATTERN CLASSIFICATION:
  STRUCTURAL: root cause is process, tooling, or team composition → coaching
  EXTERNAL:   root cause is incidents, support load, or blockers → process change
  LIFECYCLE:  expected pattern (holiday, onboarding) → baseline adjustment
```

## Velocity Forecasting

```
FORECAST MODEL: Weighted moving average with anomaly exclusion
  weights: [0.10, 0.15, 0.20, 0.25, 0.30] (most recent = highest weight)
  anomaly exclusion: exclude sprints with known_external_events (incidents, holidays)

FORECAST OUTPUTS:
  next_sprint_point_estimate:     expected velocity
  next_sprint_confidence_interval: [lower_80pct, upper_80pct]
  sprint_N+3_estimate:            3-sprint forward projection
  
SCENARIO PLANNING:
  BASE:       rolling_velocity (most likely)
  PESSIMISTIC: sustainable_velocity (planning conservative commitments)
  OPTIMISTIC: stretch_velocity (best case; not recommended for commitments)
```

## Sprint Commitment Guidance

```
COMMITMENT_RECOMMENDATION:
  recommended_commitment = sustainable_velocity × capacity_adjustment_factor
  
  capacity_adjustment_factor:
    full_sprint:          1.00
    known_PTO > 20%:      0.80
    sprint_includes_holiday: 0.75
    new_team_member:      0.90
    high_interrupt_risk:  0.85 (based on historical interrupt rate)

OVER-COMMITMENT DETECTION:
  IF committed_points > rolling_velocity × 1.20:
    WARN: "Commitment {N}% above rolling average; risk of carry-over"
  IF committed_points > rolling_velocity × 1.40:
    BLOCK: require T2 team lead acknowledgment before sprint start

CARRY-OVER TRACKING:
  carry_over_rate = points_carried_over / points_committed
  TARGET: < 0.10 (10%)
  ALERT: carry_over_rate > 0.25 for 2 consecutive sprints
```

## Velocity Intelligence Report

```
GENERATED: end of each sprint + on-demand
SECTIONS:
  1. Velocity this sprint (actual vs. committed vs. rolling avg)
  2. Velocity trend chart (last 8 sprints)
  3. Pattern detected (if any) + explanation
  4. Carry-over rate + trend
  5. Next sprint commitment recommendation
  6. Top velocity drain (if DECLINE or HIGH variance detected)
```

## Persistence
`memory/team-intelligence/velocity-records.yaml`
`memory/team-intelligence/velocity-patterns.yaml`
`memory/team-intelligence/velocity-forecasts.yaml`
`memory/team-intelligence/sprint-commitments.yaml`
