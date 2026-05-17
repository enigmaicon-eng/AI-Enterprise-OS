# Work Insights Dashboard

## Role
Operational intelligence hub for work cognition signals — patterns, bottlenecks, flow efficiency, and planning risk — presented in a unified dashboard for T2+ workflow leads and T3+ delivery managers.

## Dashboard Layout

```
╔════════════════════════════════════════════════════════════════════╗
║  WORK INSIGHTS DASHBOARD                                            ║
║  Updated: {timestamp}   Team: {team_id} | Org   Period: {window}   ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 1: FLOW HEALTH                                               ║
║  Flow efficiency: {N}%   Target: 40%   Trend: {▲▼→}               ║
║  WIP: {N} items   Limit: {N}   Flow debt: {N}%   Blocked: {N}      ║
║  Cycle time p50: {N}hr   p95: {N}hr   Predictability: {N}%         ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 2: ACTIVE BOTTLENECKS                                        ║
║  Open: {N}   Critical: {N}   Structural: {N}   Resolving: {N}      ║
║  Oldest: {bottleneck_id} — {description} ({age}hr)                 ║
║  Throughput impact: -{N}% estimated from active bottlenecks         ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 3: WORK PATTERNS                                             ║
║  Active patterns: {N}   Failure precursors: {N}   New this week: N ║
║  Top actionable: {pattern_name} — {recommended_action}             ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 4: SPRINT INTELLIGENCE                                       ║
║  Current sprint confidence: {N}%   Risk: {LOW|MEDIUM|HIGH|CRITICAL} ║
║  Committed: {N}pts   Available: {N}pts   Carryover risk: {N}pts    ║
║  High-risk dependencies: {N}   Critical path slack: {N}d           ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 5: VELOCITY HEALTH                                           ║
║  This sprint: {N}pts   Rolling avg: {N}pts   Trend: {pattern}      ║
║  Carry-over rate: {N}%   Interrupt rate: {N}%   Planned%: {N}%     ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 6: CAPACITY STATUS                                           ║
║  Net capacity: {N}pts ({N}%)   Utilization: {N}%                   ║
║  Ramp members: {N}   PTO deductions: {N}pts   Overhead: {N}pts     ║
╠════════════════════════════════════════════════════════════════════╣
║  PANEL 7: TOP RECOMMENDATIONS                                       ║
║  1. [{priority}] {recommendation}  Expected impact: {impact}        ║
║  2. [{priority}] {recommendation}  Expected impact: {impact}        ║
║  3. [{priority}] {recommendation}  Expected impact: {impact}        ║
╚════════════════════════════════════════════════════════════════════╝
```

## Dashboard Modes

```
TEAM MODE (default for T2):
  Shows: single team's flow, bottlenecks, patterns, sprint, velocity, capacity
  Data: team_id scoped; no cross-team visibility

ORG MODE (T3+):
  Shows: aggregated across all teams; org-level patterns; cross-team dependencies
  Data: team averages + outlier identification
  Extra panel: coordination health overview

INITIATIVE MODE (T3+, on-demand):
  Shows: all teams contributing to a specific initiative
  Data: initiative dependency graph + critical path + delivery confidence
```

## Automated Recommendations Engine

```
RECOMMENDATION SOURCES:
  Flow efficiency < 0.35:        recommend WIP reduction
  Bottleneck STRUCTURAL open > 3d: recommend escalation
  Sprint confidence < 0.75:     recommend scope reduction + specific items to defer
  Velocity DECLINE 3+ sprints:  recommend root cause investigation
  Interrupt rate > 0.30:         recommend interrupt triage process
  Capacity utilization > 0.90:   recommend commit reduction + headcount discussion
  Dependency high_risk > 3:      recommend pre-sprint dependency resolution sessions

RECOMMENDATION PRIORITY:
  P1: sprint-threatening; surface in sprint planning
  P2: quality/health-impacting; surface in weekly review
  P3: optimization; surface in retrospective
```

## Refresh Rates

```
PANEL                     REFRESH
──────────────────────────────────
Flow Health               5 min
Active Bottlenecks        2 min
Work Patterns             1 hr
Sprint Intelligence       15 min
Velocity Health           per sprint update
Capacity Status           1 hr
Top Recommendations       15 min
```

## Persistence
`memory/work-cognition/dashboard-state.yaml`
`memory/work-cognition/recommendation-history.jsonl`
