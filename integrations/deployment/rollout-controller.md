# Rollout Controller

## Role
Manages phased production rollout after successful canary analysis. Controls traffic routing percentage, monitors each rollout phase, enforces dwell times, and gates progression based on metric stability.

## Rollout Strategies

```
STRATEGY            TRAFFIC PROGRESSION                     USE CASE
────────────────────────────────────────────────────────────────────────────────
STANDARD_PHASED     5% → 25% → 50% → 100%                  Default for all deployments
SLOW_BURN           5% → 10% → 20% → 50% → 100%            High-risk or complex changes
FAST_TRACK          25% → 100%                              Patch-only, low-risk changes
IMMEDIATE           100%                                     Emergency hotfix only (T4 approval required)
BLUE_GREEN          0/100 flip                               Complete version replacement (pre-validated)
TIER_BASED          T1 orgs first → T2 → T3 → T4/T5         Tier-aware rollout
```

## Standard Phased Rollout Protocol

```
PHASE 1: 5% (canary complete → 5% of remaining)
  dwell_time: 15min minimum
  success_criteria: error_rate stable, p95_latency <= 1.1× baseline
  
PHASE 2: 25%
  dwell_time: 30min minimum
  success_criteria: same + quality_score >= baseline - 0.02
  
PHASE 3: 50%
  dwell_time: 30min minimum
  success_criteria: same + resource_efficiency within 5% of baseline
  
PHASE 4: 100%
  dwell_time: 60min monitoring after full rollout
  POST_ROLLOUT_SOAK: 24hr continued monitoring with regression alerts active
```

## Phase Progression Decision

```
AT END OF EACH DWELL PERIOD:
  evaluate: current_metrics vs. success_criteria
  
  IF all criteria met:
    auto-advance to next phase (no human required for STANDARD class)
    
  IF any criterion failed:
    IF error_rate > 2× baseline:  IMMEDIATE auto-rollback
    IF other metric failed:       pause + alert + human decision (1hr SLA)
    IF human decides proceed:     continue (audit logged)
    IF human decides rollback:    rollback to pre-deployment version

CIRCUIT BREAKER: if 3 consecutive phase stalls for same deployment → recommend abort
```

## Rollout State Tracking

```yaml
rollout_state:
  deployment_id: string
  strategy: string
  current_phase: number
  current_traffic_pct: number
  
  phase_history:
    - phase: number
      traffic_pct: number
      started_at: ISO8601
      completed_at: ISO8601
      metrics_at_completion: {}
      decision: ADVANCED | STALLED | ROLLED_BACK
  
  auto_rollback_armed: boolean
  rollback_version: semver
  
  overall_status: IN_PROGRESS | COMPLETED | ROLLED_BACK | PAUSED_FOR_REVIEW
```

## Traffic Routing Mechanism

```
ROUTING_RULE: injected into orchestrator routing layer
  IF request.hash % 100 < canary_pct: route to new_version
  ELSE: route to stable_version

STICKY_SESSIONS: optional (for stateful workflows)
  IF sticky: same workflow_id always routes to same version during transition
```

## Post-Rollout Validation (24hr soak)

```
MONITORS:
  - error_rate vs. 7-day pre-deployment baseline
  - p95_latency vs. 7-day baseline
  - quality_score vs. 7-day baseline
  
AUTO-ROLLBACK TRIGGERS (24hr soak):
  - error_rate > 1.5× pre-deployment baseline sustained 10min
  - quality_score < 0.90 × pre-deployment baseline sustained 1hr

SOAK COMPLETE: deployment marked FULLY_VALIDATED; rollback window reduced to 30 days
```

## Persistence
`memory/deployment-intelligence/rollout-state.yaml`
`memory/deployment-intelligence/rollout-history.jsonl`
