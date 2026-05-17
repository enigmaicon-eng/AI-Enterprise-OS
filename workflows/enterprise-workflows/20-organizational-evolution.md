# WF-020: Organizational Evolution

**Version:** 1.0.0 | **Owner:** People + Executive Org | **Tier:** T4 | **Class:** SENSITIVE | **SLA:** 60 days

## Purpose
Plan and execute deliberate, evidence-based organizational changes — restructuring, team formation, scope realignment, and capability scaling — with full impact analysis, people-first principles, transparent communication, and measurable outcomes. Prevents reactive org churn and ensures every structural change has documented rationale and success criteria.

## Inputs

```
REQUIRED:
  change_type:        RESTRUCTURE | TEAM_FORMATION | SCOPE_REALIGNMENT |
                      CAPABILITY_SCALING | MERGE | SPLIT | ORG_DESIGN_REFRESH
  driver:             GROWTH | STRATEGY_SHIFT | PERFORMANCE | COST | M_AND_A | COMPLIANCE
  proposed_change:    string — clear description of the structural change
  requestor_id:       string — T4+ executive sponsor

OPTIONAL:
  affected_headcount: number — people affected by the change
  target_state:       document_id — proposed org chart or team structure
  success_metrics:    [string] — measurable outcomes for the change
  timeline:           string — change execution window
```

## Outputs / Artifacts

```
PRIMARY:
  ORG_CHANGE_RECORD:  wiki/org/changes/{change_id}.md
  IMPACT_ANALYSIS:    people impact, skill gap, dependency impact, risk assessment
  COMMUNICATION_PLAN: what to communicate, to whom, when, in what order
  TRANSITION_PLAN:    step-by-step execution with owners and checkpoints

SECONDARY:
  ORG_DESIGN_DIAGRAM: before/after org structure
  SUCCESS_METRICS_BASELINE: pre-change baseline for post-change measurement
```

## Lifecycle States

```
INITIATED → IMPACT_ANALYSIS → DATA_COLLECTION → DESIGN_REVIEW
  → [T4 SPONSOR GATE] DESIGN_APPROVED → EXEC_REVIEW
  → [T5 APPROVAL] COMMUNICATION_PREP → STAKEHOLDER_BRIEF
  → MANAGER_BRIEF → INDIVIDUAL_NOTIFY → TRANSITION_EXECUTION
  → MONITORING → [success] COMPLETED
  → [issues] COURSE_CORRECT → MONITORING
  → FAILED (change causing org damage)
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T4+]              Root
S-002  CHANGE_CONTEXT_BUILD    [AGENT: analytics-agent]        depends_on: S-001
         Pull: current org structure, team health scores, performance data
         Pull: skill graph data, bus factor risks, coupling matrix
         Pull: OKRs affected by proposed change
S-003  IMPACT_ANALYSIS         [AGENT: analytics-agent + pm-agent] depends_on: S-002
         People impact:
           Who moves teams? Who changes managers? Who changes scope?
           Retention risk: flag anyone with HIGH churn risk who is affected
           Skills: will the new structure have skill gaps?
         Technical impact:
           Dependency map: what team dependencies will change?
           Knowledge concentration: does change create new bus_factor=1 risks?
         Delivery impact:
           In-flight projects affected: list with risk assessment
           Velocity prediction: expect 15-25% velocity dip for 6-8 weeks post-change
S-004  DESIGN_VALIDATION       [AGENT: analytics-agent]        depends_on: S-003
         Check: does proposed structure reduce or increase coupling?
         Check: are team cognitive loads balanced?
         Check: does structure match domain boundaries (Conway's Law)?
         Simulate: org performance model under proposed structure
         Recommendation: approve / modify / reject with evidence
S-005  EXECUTIVE_DESIGN_REVIEW [HUMAN: T4+ sponsor + HRBP T3]  depends_on: S-004
         Review: impact analysis; design validation findings
         Review: affected individuals (names; impact level)
         Decision: approve design, request modifications, or withdraw
         SENSITIVE: all discussion under NDA; no leaks before communication plan
S-006  EXEC_APPROVAL           [GATE: G-EXEC T5]               depends_on: S-005
         REQUIRED FOR: restructure affecting > 10 people OR any involuntary changes
         T5 CEO or CPO approves change
         Confirms: business rationale; legal review complete (if involuntary)
S-007  LEGAL_HR_REVIEW         [HUMAN: Legal + HRBP]           depends_on: S-006
         Review: any employment law considerations (WARN Act if US > 100 involuntary)
         Review: contract implications, non-compete considerations
         Confirm: change complies with local labor laws (EU works councils if applicable)
         SLA: 5 business days
S-008  COMMUNICATION_PLAN      [HUMAN: T4 sponsor + HRBP + Comms] depends_on: S-007
         Design: communication sequence — who hears what and when
         Sequence: executives first → managers → individuals (same day for individuals)
         Draft: talking points for each audience
         Prepare: FAQ document for common questions
         Timeline: all individuals notified within same business day
S-009  SUCCESS_METRICS_BASELINE [AGENT: analytics-agent]       depends_on: S-007
         Capture: pre-change baselines for all success_metrics
         Capture: team health scores, velocity, coupling metrics, retention
         Store: for post-change comparison at 30/60/90 days
S-010  MANAGER_BRIEF           [HUMAN: HR + T4 sponsor]        depends_on: S-008
         Brief managers before their direct reports are notified
         Timing: 24-48hr before individual notifications
         Provide: manager toolkit (talking points, FAQ, escalation contacts)
         Confirm: manager readiness to deliver message
S-011  INDIVIDUAL_NOTIFICATIONS [HUMAN: managers + HRBP]       depends_on: S-010
         All affected individuals notified same business day
         Content: what is changing, why, what it means for them, timeline
         Logistics: 1:1 conversations; HRBP available for questions
         Document: all notifications completed (timestamp per person)
S-012  TRANSITION_EXECUTION    [HUMAN: T3 leads + HRBP]        depends_on: S-011
         Execute: team migrations in Jira, Slack, access systems
         Execute: manager reporting line changes in HRIS
         Handoff: active work items transferred with proper context
         Knowledge transfer: document cross-team knowledge (bus factor mitigation)
S-013  TRANSITION_VERIFICATION [AGENT: delivery-agent]         depends_on: S-012
         Verify: all system changes executed (Jira, Slack, access, HRIS)
         Verify: no critical dependencies left orphaned
         Verify: in-flight work has clear ownership
S-014  MONITORING_PERIOD       [AGENT: analytics-agent]        depends_on: S-013
         Monitor: team health, velocity, sentiment signals for 60 days
         Checkpoints: 30-day and 60-day post-change reviews
         Alert: if team health drops to STRAINED within 30 days
S-015  30_DAY_REVIEW           [HUMAN: T4 sponsor + HRBP]      depends_on: S-014
         Assess: actual vs predicted impact on velocity and health
         Review: retention — any unexpected departures?
         Course correct: if metrics worse than expected
S-016  60_DAY_CLOSE            [HUMAN: T4 sponsor]             depends_on: S-015
         Assess: success metrics vs baseline
         Document: what worked; what was harder than expected; what to repeat
         Decision: declare success or initiate course-correction
S-017  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-016
S-018  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-017
S-019  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-018
```

## Approval Gates

```
G-AUTH:    T4+ executive sponsor; clear change rationale
G-EXEC:    T5 required for restructures affecting > 10 people or any involuntary changes
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Change leaked before communication plan  T4 + Comms emergency plan   Immediate
Involuntary change without legal review  BLOCK; HR + Legal escalation Immediate
WARN Act threshold approaching           Legal + T5 alert             24hr
Team health drops to DISTRESSED (30d)   T4 review; course correct    48hr
Key talent departure risk HIGH post-change T4 retention intervention  24hr
Bus_factor=1 created by change           Technical risk flag; T3 fix  1 week
```

## Governance Checkpoints

```
C-001: T4+ sponsor + HRBP must own all individual communications
C-004: all decisions and rationale permanently recorded
CONFIDENTIALITY: design phase information restricted to need-to-know T4+
LEGAL: any involuntary changes require legal review; no exceptions
SAME_DAY_NOTIFY: all affected individuals notified same day; no staggered individual leaks
MEASUREMENT: post-change success metrics required; not optional
REVERSIBILITY: org changes are reversible; if 60-day metrics fail → initiate new WF-020
```

## Observability

```
HEALTH METRICS:
  avg_execution_days:           target <= 60
  velocity_recovery_weeks:      target <= 8 post-change
  retention_post_change_90d:    target >= 0.90 among affected
  team_health_30d:              target >= STABLE
  success_metric_achievement:   target >= 0.80 at 60 days
  communication_completion:     target = 100% same-day notification
```

## Telemetry Events

```
enterprise.workflows.WF-020.initiated    {change_type, driver, affected_headcount}
enterprise.workflows.WF-020.impact_analysis {retention_risks, bus_factor_risks, delivery_risk}
enterprise.workflows.WF-020.approved     {approval_tier, conditions}
enterprise.workflows.WF-020.communicated {notified_count, same_day: bool}
enterprise.workflows.WF-020.30d_review   {health_trend, velocity_delta, departures}
enterprise.workflows.WF-020.completed    {change_id, success_metric_pct, cycle_days}
```

## Rollback System

```
ROLLBACK: org changes can be reversed if 60-day metrics indicate failure
REVERSAL: requires new WF-020 run; document reasons; re-brief affected individuals
PARTIAL: scope can be adjusted mid-execution if clear evidence of harm
```

## Enterprise System Integrations

```
HRIS:        S-012 → update reporting lines; S-013 → verify changes
JIRA:        S-012 → update team assignments for all open tickets
SLACK:       S-012 → update channel memberships; create/archive team channels
ACCESS_MGMT: S-012 → update system access per new team assignments
EMAIL:       S-011 → manager notification; individual confirmation emails
```

## Wiki Updates

```
wiki/org/changes/{change_id}.md           ← full change record + rationale
wiki/org/org-design-history.md            ← append change to org history
wiki/org/current-structure.md             ← update with post-change structure
```

## Memory Updates

```
memory/org-intelligence/org-performance-records.yaml ← update org structure
memory/org-intelligence/coupling-matrix.yaml         ← update post-change
memory/people-intelligence/skill-graph.yaml          ← update team assignments
memory/people-intelligence/concentration-risks.yaml  ← update bus factor
memory/team-intelligence/team-health-scores.yaml     ← capture pre-change baseline
```
