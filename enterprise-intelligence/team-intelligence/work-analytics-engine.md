# Work Analytics Engine

## Role
Computes detailed work analytics for each team — cycle times, throughput, work mix, interruption rates, and completion patterns. Feeds the team performance model and surfaces granular insights that help teams understand exactly where time and capacity go.

## Work Item Taxonomy

```
CATEGORY          SUBCATEGORY           EXAMPLES
──────────────────────────────────────────────────────────────────────────
PLANNED           FEATURE               PRD → spec → implementation
PLANNED           ARCHITECTURE          RFC, ADR, design review
PLANNED           MAINTENANCE           Tech debt, refactors, upgrades
UNPLANNED         INCIDENT              Production incidents, hotfixes
UNPLANNED         SUPPORT               Ad-hoc requests, escalations
UNPLANNED         REWORK                Gate failures requiring correction
OVERHEAD          GOVERNANCE            Approvals, reviews, audits
OVERHEAD          MEETINGS_EQUIV        Sprint planning, retrospectives
OVERHEAD          ONBOARDING            New team member ramp-up work
```

## Analytics Computations

### Throughput Analytics
```
THROUGHPUT_RATE:    completed_work_items / sprint_days (normalized for team size)
THROUGHPUT_MIX:     {category: count/total} — what % of output is feature vs. unplanned
PLANNED_RATIO:      PLANNED / (PLANNED + UNPLANNED) — target: >= 0.70
UNPLANNED_SURGE:    if UNPLANNED > 30% of sprint: flag; investigate cause

TREND:
  week-over-week throughput delta
  sprint-over-sprint throughput delta
  13-week rolling throughput (smoothed signal)
```

### Cycle Time Analytics
```
CYCLE_TIME_BREAKDOWN:
  time_in_queue:      created → started
  time_in_progress:   started → review_ready
  time_in_review:     review_ready → approved
  time_in_deployment: approved → deployed
  total_cycle_time:   created → deployed

FLOW_EFFICIENCY:
  active_time = time_in_progress + time_in_review
  wait_time   = time_in_queue + time_in_deployment
  flow_efficiency = active_time / total_cycle_time
  TARGET: flow_efficiency >= 0.40

PERCENTILES:
  p50, p75, p90, p95 computed per work_category and overall
  SLA breach detection: work items exceeding p95 of their category
```

### Work Age Analytics
```
WORK_IN_PROGRESS (WIP):
  current WIP count per team
  WIP_LIMIT recommendation: 2× team_size (Little's Law derived)
  over_WIP_alert: WIP > 3× team_size → throughput prediction degrades

AGING_WORK:
  items in queue > 5 days: AGING
  items in queue > 14 days: STALE
  items in queue > 30 days: BLOCKED (auto-alert to T2 team lead)
```

### Interruption Analytics
```
INTERRUPTION_RATE:     UNPLANNED items / total items
INTERRUPTION_COST:     avg additional cycle time per sprint when UNPLANNED > 30%
INTERRUPT_SOURCES:     top 3 sources of unplanned work (by team, by type, by requester)
INTERRUPT_PATTERN:     day-of-week / time-of-sprint distribution
ACTION: if interrupt_rate > 0.30 for 2 consecutive sprints → coaching recommendation
```

## Work Analytics Record

```yaml
work_analytics_record:
  team_id: string
  period: {from: ISO8601, to: ISO8601}
  
  throughput:
    total_completed: number
    by_category: {FEATURE: N, ARCHITECTURE: N, ...}
    planned_ratio: number
    throughput_rate: number
    throughput_trend: IMPROVING | STABLE | DEGRADING
  
  cycle_time:
    p50_hours: number
    p75_hours: number
    p95_hours: number
    flow_efficiency: number
    breakdown: {queue: N, progress: N, review: N, deploy: N}
  
  wip:
    current_count: number
    wip_limit_recommendation: number
    aging_items: number
    stale_items: number
    blocked_items: number
  
  interruptions:
    interruption_rate: number
    top_interrupt_sources: [{source, count}]
```

## Persistence
`memory/team-intelligence/work-analytics-current.yaml`
`memory/team-intelligence/work-analytics-history.jsonl`
`memory/team-intelligence/work-item-index.yaml`
