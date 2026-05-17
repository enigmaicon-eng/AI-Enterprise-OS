# WF-003: Quarterly Planning

**Version:** 1.0.0 | **Owner:** Product + Engineering Org | **Tier:** T3 | **Class:** ELEVATED | **SLA:** 14 days

## Purpose
Translate annual OKRs into a concrete sprint-by-sprint delivery plan for the quarter: committed initiatives, team assignments, dependency agreements, sprint zero setup, and a risk-adjusted capacity forecast — ready to execute on Day 1 of the quarter.

## Inputs

```
REQUIRED:
  quarter:              string — e.g., "Q2-2027"
  annual_plan_id:       artifact_id — WF-002 output
  team_roster:          [team_id]
  prior_quarter_retro:  artifact_id — retrospective from Q{N-1}

OPTIONAL:
  scope_changes:        [string] — any changes since annual plan
  carryover_items:      [work_item_id] — items not completed in Q{N-1}
  new_market_signals:   [string]
```

## Outputs / Artifacts

```
PRIMARY:
  QUARTERLY_PLAN:       wiki/delivery/quarterly-plans/Q{N}-{year}.md
  SPRINT_SCHEDULE:      sprint start/end dates, sprint goals per sprint
  TEAM_COMMITMENTS:     per team: OKRs, initiative assignments, capacity
  DEPENDENCY_AGREEMENTS: signed cross-team dependency SLAs

SECONDARY:
  RISK_REGISTER_Q:      quarter-specific risks
  CARRYOVER_DECISIONS:  what carried over, why, what was dropped
```

## Lifecycle States

```
INITIATED → VALIDATING → CARRYOVER_ANALYSIS → CAPACITY_REFRESH
  → OKR_DECOMPOSITION → SPRINT_SEQUENCING → DEPENDENCY_NEGOTIATION
  → RISK_CALIBRATION → TEAM_COMMITMENT_REVIEW → EXEC_CHECKPOINT
  → SPRINT_ZERO_SETUP → COMPLETED
  → FAILED | CANCELLED
```

## Execution Graph

```
S-001  AUTH_CHECK             [GATE: G-AUTH T3+]             Root
S-002  PRIOR_Q_RETRO_PULL     [AGENT: analytics-agent]       depends_on: S-001
         Pull: velocity, team health, carry-over rate, OKR completion from Q{N-1}
S-003  CAPACITY_REFRESH       [AGENT: delivery-agent]        depends_on: S-001
         Re-run: capacity-intelligence-engine for Q{N}
         Factor in: known PTO, hiring plan, ramp members
S-004  CARRYOVER_ANALYSIS     [AGENT: pm-agent]              depends_on: S-002, S-003
         Decision per carry-over item: CONTINUE | REPRIORITIZE | DROP
         Output: carryover decisions with rationale
S-005  OKR_DECOMPOSITION      [AGENT: pm-agent]              depends_on: S-004
         Break each team OKR into Q-level deliverables
         Each deliverable: owner, size estimate, target sprint
S-006  DEPENDENCY_SCAN        [AGENT: delivery-agent]        depends_on: S-005
         Build: Q{N} dependency graph from initiative decomposition
         Identify: critical path; at-risk dependencies; provider capacity checks
S-007  SPRINT_SEQUENCING      [AGENT: delivery-agent]        depends_on: S-005, S-006
         Assign deliverables to sprints; respect dependency ordering
         Output: sprint-by-sprint plan per team; sprint goals defined
S-008  DEPENDENCY_NEGOTIATION [HUMAN: T2 team leads]         depends_on: S-006
         Each cross-team dependency: provider team confirms delivery sprint
         SLA: 3 business days | Trigger WF-016 for unresolved dependencies
S-009  RISK_CALIBRATION       [AGENT: governance-agent]      depends_on: S-007, S-008
         Run: predictive-work-planner sprint risk assessment for each sprint
         Flag: sprints with confidence < 0.75
S-010  CAPACITY_BALANCE_CHECK [GATE: G-QUALITY]              depends_on: S-007, S-009
         Check: no team > 90% utilization per sprint; all Q OKRs have sprint assignments
         Pass: balanced  |  On fail: delivery-agent rebalances
S-011  TEAM_COMMITMENT_REVIEW [HUMAN: T3 org leads]          depends_on: S-010
         Each T3 lead signs off on their org's sprint plan
         SLA: 3 business days  |  Deadlock → T4 resolution
S-012  EXEC_CHECKPOINT        [GATE: G-EXEC T4]              depends_on: S-011
         T4 CPO/CTO reviews: OKR coverage, capacity balance, risk level
         SLA: 24hr  |  Required for any quarter with new strategic initiatives
S-013  SPRINT_ZERO_SETUP      [AGENT: delivery-agent]        depends_on: S-012
         Create: sprint records, Jira sprints, backlog triage sessions scheduled
         Notify all teams of Q kickoff date and sprint zero agenda
S-014  ARTIFACT_PERSIST       [INTEGRATION]                  depends_on: S-013
S-015  MEMORY_UPDATE          [SYSTEM]                       depends_on: S-014
S-016  COMPLETION_EVENT       [SYSTEM]                       depends_on: S-015
         Emit WF-003.completed; notify all T2+ leads; trigger Q kickoff
```

## Approval Gates

```
G-AUTH:    initiator >= T3; annual plan exists and is APPROVED
G-QUALITY: all teams have sprint assignments; capacity balanced; dependencies confirmed
G-EXEC:    T4 CPO/CTO; required for quarters with strategic initiative changes
```

## Escalation Logic

```
TRIGGER                               ACTION                        SLA
──────────────────────────────────────────────────────────────────────────
Dependency negotiation deadlock       Trigger WF-016; T3 mediates   48hr
Capacity gap > 20% for any team       T3 workforce decision          24hr
Risk score CRITICAL (conf < 0.60)     Scope reduction meeting T3+    24hr
Team commitment SLA breach (3d)       T4 escalation                  2hr
```

## Governance Checkpoints

```
C-001: T4 exec checkpoint
C-003: Quarterly plan artifact before sprint 1 begins
C-004: Carry-over decisions recorded
EU AI Act: Q initiatives with AI components reviewed for compliance deadlines
COMPLIANCE CAL: any compliance deadlines in Q{N} must have owning sprint assigned
```

## Observability

```
HEALTH METRICS:
  planning_cycle_days:          target <= 14
  dependency_agreement_rate:    target >= 0.95 (almost all deps confirmed)
  sprint_commitment_confidence: avg target >= 0.80
  okr_sprint_coverage_pct:      target = 100%
```

## Telemetry Events

```
enterprise.workflows.WF-003.initiated       {quarter, team_count}
enterprise.workflows.WF-003.dependency_sla  {team_pair, agreed, sprint}
enterprise.workflows.WF-003.gate.G-QUALITY  {result, coverage_pct, balance_score}
enterprise.workflows.WF-003.completed       {quarter, sprint_count, risk_level}
```

## Rollback System

```
ROLLBACK WINDOW: 5 days (before Sprint 1 begins)
ROLLBACK TRIGGER: major scope change; executive strategic pivot

ROLLBACK STEPS:
  R-014: cancel sprint zero setups in Jira
  R-013: notify all T2 leads; schedule emergency re-planning (5-day fast-track)
  Artifacts: mark SUPERSEDED; carry-over decisions reset
```

## Enterprise System Integrations

```
JIRA:        S-013 → create all Q{N} sprints; assign epics to sprints
CONFLUENCE:  S-014 → publish quarterly plan to Delivery space
SLACK:       S-016 → announce Q{N} plan in #quarterly-planning; tag leads
CALENDAR:    S-013 → create sprint ceremony calendar invites for all teams
```

## Wiki Updates

```
wiki/delivery/quarterly-plans/Q{N}-{year}.md  ← full quarterly plan
wiki/delivery/sprint-schedule.md              ← updated sprint calendar
wiki/decisions/{quarter}-planning.md          ← carryover + scope decisions
```

## Memory Updates

```
memory/work-cognition/sprint-risk-assessments.yaml  ← per-sprint risk scores
memory/team-intelligence/capacity-forecasts.yaml    ← Q{N} capacity commitments
memory/org-intelligence/dependency-registry.yaml    ← Q{N} dependency agreements
```
