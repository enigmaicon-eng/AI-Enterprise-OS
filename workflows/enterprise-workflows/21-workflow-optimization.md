# WF-021: Workflow Optimization

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T3 | **Class:** STANDARD | **SLA:** 14 days

## Purpose
Identify, analyze, and improve underperforming workflows through data-driven diagnosis, root cause analysis, and targeted interventions — reducing cycle time, eliminating waste, improving quality gate pass rates, and building systemic learning back into the workflow definitions.

## Inputs

```
REQUIRED:
  workflow_id:        string — WF-NNN target workflow
  trigger_type:       PERFORMANCE_DEGRADATION | RECURRING_FAILURE | POSTMORTEM_ACTION |
                      PERIODIC_REVIEW | COMPLIANCE_GAP | MANUAL_REQUEST
  optimization_goal:  CYCLE_TIME | QUALITY | RELIABILITY | COST | COMPLIANCE

OPTIONAL:
  baseline_period:    string — date range for baseline metrics (default: last 90 days)
  target_improvement: string — quantitative target (e.g., "reduce cycle time 30%")
  constraint:         string — what cannot be changed (e.g., "G-EXEC gate must stay")
```

## Outputs / Artifacts

```
PRIMARY:
  OPTIMIZATION_REPORT:  wiki/improvements/WF-{id}-optimization-{date}.md
  ROOT_CAUSE_ANALYSIS:  structured analysis of performance bottlenecks
  IMPROVEMENT_PLAN:     prioritized changes with effort estimates and expected impact

SECONDARY:
  UPDATED_WORKFLOW:     revised workflow definition (if approved changes applied)
  METRIC_BASELINE:      pre-optimization baseline for post-optimization comparison
```

## Lifecycle States

```
INITIATED → METRIC_COLLECTION → BOTTLENECK_ANALYSIS → ROOT_CAUSE_ANALYSIS
  → IMPROVEMENT_DESIGN → SIMULATION → APPROVAL_GATE
  → [APPROVED] IMPLEMENTATION → VALIDATION → MONITORING
  → [improved] COMPLETED
  → [no improvement] ADDITIONAL_ITERATION → IMPROVEMENT_DESIGN
  → [requires major change] ESCALATION → EXEC_DECISION
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  WORKFLOW_TELEMETRY_PULL [AGENT: analytics-agent]        depends_on: S-001
         Pull from telemetry system: all events for workflow_id over baseline_period
         Compute: cycle time distribution (p50, p90, p99)
         Compute: step-level dwell time (where time is spent)
         Compute: gate pass/fail rates per gate
         Compute: escalation rate, rework rate, abandonment rate
S-003  BOTTLENECK_IDENTIFICATION [AGENT: analytics-agent]      depends_on: S-002
         Apply: theory of constraints (find the constraint step)
         Identify: top 3 steps consuming most elapsed time
         Identify: highest rework/failure steps
         Identify: steps with highest escalation rates
         Flow efficiency: active_time / elapsed_time per step
S-004  COMPARATIVE_ANALYSIS    [AGENT: analytics-agent]        depends_on: S-003
         Compare: current metrics vs. workflow SLA targets
         Compare: vs. similar workflows in the system
         Compare: current quarter vs. prior quarter (trend direction)
         Identify: which teams or use cases show worse performance
S-005  ROOT_CAUSE_ANALYSIS     [AGENT: pm-agent + analytics-agent] depends_on: S-003, S-004
         For each bottleneck: 5 Whys analysis
         Categories: PROCESS | TOOL | HUMAN | DEPENDENCY | DATA | GOVERNANCE
         Distinguish: symptoms vs. root causes
         Priority: impact × frequency matrix
S-006  IMPROVEMENT_IDEATION    [AGENT: pm-agent]               depends_on: S-005
         Generate: improvement options per root cause
         Option types:
           AUTOMATION: automate manual steps where human judgment not required
           PARALLELIZATION: run sequential steps in parallel where safe
           GATE_OPTIMIZATION: refine gate criteria to reduce false fails
           TEMPLATE_IMPROVEMENT: better inputs reduce rework
           ESCALATION_TUNING: calibrate escalation thresholds
           STEP_ELIMINATION: remove steps that add no value
         For each option: effort (S/M/L), expected impact, risk
S-007  IMPROVEMENT_SIMULATION  [AGENT: analytics-agent]        depends_on: S-006
         Model: apply improvements to historical data
         Predict: new cycle time distribution, gate pass rate
         Risk: what could go wrong with each improvement?
         Conservative estimate: reduce predicted improvement by 30% for realism
S-008  IMPROVEMENT_PLAN        [AGENT: pm-agent]               depends_on: S-007
         Select: highest ROI improvements within constraint
         Sequence: quick wins first (< 1 week), then structural changes
         Owner: assign each improvement to a team
         Timeline: milestone plan with measurable checkpoints
S-009  APPROVAL_GATE           [GATE: G-QUALITY T3+]           depends_on: S-008
         For governance changes: T4 approval required
         For constitutional changes (C-001–C-012): T5 approval; cannot be weakened
         For standard process changes: T3 approval
         Review: improvement plan + simulation results
S-010  IMPLEMENTATION          [HUMAN: assigned owners]        depends_on: S-009
         Execute improvement plan per schedule
         Document: exact changes made to workflow definition
         Version: increment workflow version (semver PATCH for fixes; MINOR for process changes)
S-011  WORKFLOW_UPDATE         [AGENT: pm-agent]               depends_on: S-010
         Update: workflow definition document with changes
         Update: _workflow-registry.md with new version
         Notify: all teams who use this workflow of changes
S-012  VALIDATION              [AGENT: analytics-agent]        depends_on: S-011
         Monitor: next 20 workflow executions post-improvement
         Compare: actual vs. predicted improvement
         Flag: any unexpected side effects
S-013  30_DAY_OUTCOME          [AGENT: analytics-agent]        depends_on: S-012
         Measure: actual improvement vs. baseline
         Report: achieved improvement vs. target_improvement
         Decision: success (close) or additional iteration needed
S-014  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-013
S-015  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-014
S-016  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-015
```

## Approval Gates

```
G-AUTH:    T3+ initiator; target workflow identified with clear trigger
G-QUALITY: T3 approval for standard improvements; T4 for governance changes; T5 for constitutional
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Workflow cycle time > 2× SLA target      Fast-track optimization; T4  48hr start
Constitutional change needed             BLOCK standard path; T5 review Escalate
Workflow abandonment rate > 0.20         T3 urgent review              24hr
Improvement implementation broken WF    ROLLBACK; incident (WF-012)   Immediate
Recurrence: same bottleneck 3× reviews  T4 systemic review required   1 week
```

## Governance Checkpoints

```
C-001: human approval required for all workflow governance changes
C-004: all changes versioned and permanently recorded with rationale
CONSTITUTIONAL: C-001 through C-012 governance checkpoints cannot be weakened or removed
VERSIONING: all workflow changes increment version; no silent modifications
NOTIFICATION: teams using changed workflows notified before changes take effect
MEASUREMENT: post-change validation required; improvements not confirmed = revision needed
```

## Observability

```
HEALTH METRICS:
  optimization_cycle_time_days:  target <= 14
  improvement_achieved_rate:     target >= 0.75 (improvements that hit target)
  workflow_health_trend:         % of workflows with improving metrics quarter-over-quarter
  time_to_first_improvement:     target <= 7 days (quick wins)
  recurrence_rate:               same root cause recurring = 0 target

WORKFLOW HEALTH PORTFOLIO:
  pct_workflows_meeting_sla:     target >= 0.85
  pct_with_gate_pass_rate_ok:    target >= 0.80 gate pass rates
```

## Telemetry Events

```
enterprise.workflows.WF-021.initiated    {target_workflow, trigger_type, optimization_goal}
enterprise.workflows.WF-021.bottlenecks  {top_bottleneck, cycle_time_p90, gate_fail_rate}
enterprise.workflows.WF-021.plan_approved {improvements_count, effort_total, expected_gain}
enterprise.workflows.WF-021.implemented  {changes_made, workflow_version_new}
enterprise.workflows.WF-021.validated    {actual_improvement_pct, target_met: bool}
enterprise.workflows.WF-021.completed    {workflow_id, cycle_time_improvement_pct}
```

## Rollback System

```
ROLLBACK: workflow changes versioned; can revert to prior version if improvement worsens outcomes
REVERT_TRIGGER: post-change metrics worse than baseline at 7-day check → auto-alert; T3 decision
REVERT_PROCEDURE: restore prior workflow definition; notify users; document reason
```

## Enterprise System Integrations

```
TELEMETRY:  S-002 → pull workflow telemetry data
JIRA:       S-010 → create improvement implementation tickets
SLACK:      S-011 → notify #workflows of changes; S-016 → post optimization summary
WIKI:       S-011 → update workflow definition docs
```

## Wiki Updates

```
wiki/improvements/WF-{id}-optimization-{date}.md ← optimization report
wiki/improvements/improvement-log.md             ← append to log
enterprise-workflows/{id}-{name}.md              ← update workflow definition
enterprise-workflows/_workflow-registry.md       ← update version
```

## Memory Updates

```
memory/work-cognition/active-bottlenecks.yaml    ← close resolved bottlenecks
memory/work-cognition/pattern-library.yaml       ← add new failure patterns found
memory/knowledge-management/learnings.yaml       ← add optimization learnings
```
