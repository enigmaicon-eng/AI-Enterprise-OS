# Org Intelligence Dashboard

## Role
Executive-level visibility hub combining org performance, team health distribution, coordination health, and strategic execution progress. Designed for T3+ leaders to identify org-wide patterns, escalate systemic risks, and track improvement trajectories.

## Dashboard Layout

```
╔═════════════════════════════════════════════════════════════════════╗
║  ORGANIZATIONAL INTELLIGENCE DASHBOARD                               ║
║  Updated: {timestamp}   Period: {sprint/month}   Org tier: {TIER}   ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 1: ORG PERFORMANCE                                            ║
║  Org score: {N}/1.0   Tier: {TIER}   Change: {▲▼→}                 ║
║  Delivery: {N}   Quality: {N}   Governance: {N}   Strategic V: {N} ║
║  DORA band: {ELITE/HIGH/MEDIUM/LOW}   Deploy freq: {N}/wk           ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 2: TEAM HEALTH DISTRIBUTION                                   ║
║  THRIVING: {N} ({N}%)   STABLE: {N} ({N}%)   STRAINED: {N} ({N}%)  ║
║  DISTRESSED: {N}        CRITICAL: {N}         Total teams: {N}      ║
║  Trend: {N}% STABLE+ this sprint vs. {N}% last sprint               ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 3: DORA METRICS                                               ║
║  Deploy freq: {N}/wk [{band}]   Lead time: {N}hr [{band}]           ║
║  Change fail rate: {N}% [{band}]   MTTR: {N}hr [{band}]             ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 4: COORDINATION HEALTH                                        ║
║  Overall: {N}/1.0   Handoff success: {N}%   Dep on-time: {N}%      ║
║  Over-coupled pairs: {N}   Isolated teams: {N}   Blockers: {N}      ║
║  Critical path slack: {N}d   High-risk deps: {N}                    ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 5: STRATEGIC EXECUTION                                        ║
║  Active initiatives: {N}   On track: {N}%   At risk: {N}           ║
║  OKR completion rate: {N}%   Sprints to initiative end: {N}         ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 6: TOP RISKS                                                  ║
║  1. [{severity}] {risk_description}                                  ║
║  2. [{severity}] {risk_description}                                  ║
║  3. [{severity}] {risk_description}                                  ║
╠═════════════════════════════════════════════════════════════════════╣
║  PANEL 7: IMPROVEMENT SIGNALS                                        ║
║  Teams improved tier this sprint: {N}                                ║
║  Patterns resolved: {N}   New patterns detected: {N}                ║
║  Agent adoption growth: {N}% vs. last month                         ║
╚═════════════════════════════════════════════════════════════════════╝
```

## Alert Thresholds

```
CRITICAL ORG ALERTS (T4 notification + event bus enterprise.org.alert.critical):
  org_performance_score < 0.40
  teams_distressed_or_critical >= 3
  critical_path_slack <= 0
  DORA band = LOW for 2 consecutive months
  governance_compliance < 0.80

HIGH ORG ALERTS (T3 notification):
  org_performance_score < 0.55
  teams_distressed_or_critical >= 2
  critical_path_slack <= 3 days
  over_coupled_pairs >= 3
  teams_with_zero_learning_investment >= 3
```

## Privacy Controls

```
ROLE-BASED VISIBILITY:
  T1/T2:  Org aggregate scores only; no team-level breakdown
  T3:     Team-level performance tier + health tier (no raw scores)
          Can see own-team details + any teams they directly manage
  T4:     Full team-level details; health reports for all teams
  T5:     Full dashboard; individual team drill-downs; historical trends

PRIVACY RULE:
  Team health data (DISTRESSED/CRITICAL) never shown in org aggregate view
  T3 sees "N teams in DISTRESSED" but not which teams (unless they manage them)
  T4+ sees team names for DISTRESSED/CRITICAL
```

## Reports

```
SPRINT ORG SUMMARY (auto-generated, end of sprint):
  Audience: T3+
  Content: performance delta, team tier shifts, top coordination events, DORA

MONTHLY ORG INTELLIGENCE REPORT:
  Audience: T4+ + board summary prep
  Content: all sprint summaries + narrative synthesis + risk register + recommendations

QUARTERLY ORG REVIEW:
  Audience: T5 + board
  Content: YoY trends + DORA industry benchmarks + strategic alignment assessment + headcount modeling
```

## Persistence
`memory/org-intelligence/dashboard-state.yaml`
`memory/org-intelligence/alert-log.jsonl`
`memory/org-intelligence/org-reports.jsonl`
