# WF-016: Dependency Coordination

**Version:** 1.0.0 | **Owner:** Delivery Org | **Tier:** T3 | **Class:** ELEVATED | **SLA:** 5 days

## Purpose
Identify, register, negotiate, and track cross-team dependencies — ensuring blockers are surfaced early, commitments are binding, critical paths are visible, and cascading delays are prevented through structured coordination rather than ad-hoc Slack negotiation.

## Inputs

```
REQUIRED:
  requesting_team:    string — team with the dependency need
  providing_team:     string — team being depended upon
  dependency_type:    API | PLATFORM | DATA | INFRA | DECISION | DESIGN | COMPLIANCE
  needed_by:          ISO8601 — when the dependency must be resolved
  work_item_id:       string — requesting work item in Jira

OPTIONAL:
  priority:           CRITICAL | HIGH | MEDIUM | LOW
  negotiation_context: string — flexibility available (dates, scope, alternatives)
  escalation_contact: stakeholder_id — T3+ who can unblock
```

## Outputs / Artifacts

```
PRIMARY:
  DEPENDENCY_RECORD:  wiki/dependencies/{dep_id}.md
  COMMITMENT_RECORD:  binding commitment from providing_team with date
  CRITICAL_PATH_MAP:  updated dependency graph showing critical path impact

SECONDARY:
  ESCALATION_RECORD:  if commitment not met — escalation chain followed
  ALTERNATIVE_PATH:   if dependency cannot be met — alternative approach documented
```

## Lifecycle States

```
INITIATED → DEPENDENCY_REGISTERED → PROVIDING_TEAM_NOTIFIED
  → NEGOTIATION → [committed] COMMITMENT_RECORDED → TRACKING
  → [fulfilled] DEPENDENCY_RESOLVED → COMPLETED
  → [at_risk] AT_RISK_ALERT → ESCALATION
  → [not_met] SLA_BREACH → ESCALATION → EXEC_INTERVENTION
  → [unresolvable] ALTERNATIVE_PATH → COMPLETED
  → FAILED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  DEPENDENCY_REGISTRATION [AGENT: delivery-agent]         depends_on: S-001
         Register: dependency in dependency registry
         Classify: type, priority, risk level
         Calculate: critical path impact (is this on critical path?)
         CPM: update org dependency graph
S-003  IMPACT_ASSESSMENT       [AGENT: analytics-agent]        depends_on: S-002
         Downstream analysis: who else is blocked on this dependency?
         Risk: calculate cascade delay risk if dependency is late
         Identify: alternatives or workarounds if available
S-004  PROVIDING_TEAM_NOTIFY   [INTEGRATION]                   depends_on: S-002
         Notify: providing_team lead via Slack + Jira + email
         Request: acknowledgment within 24hr; commitment date within 48hr
         Include: business impact of dependency being late
S-005  NEGOTIATION             [HUMAN: team leads T3+]         depends_on: S-004
         Synchronous or async: team leads discuss scope, date, capacity
         Options: full delivery | partial delivery | alternative API | date shift
         SLA: 48hr to reach agreement
S-006  COMMITMENT_RECORD       [AGENT: delivery-agent]         depends_on: S-005
         Document: what exactly will be delivered, when, by whom
         Binding commitment: providing team lead signs off
         Alert: if committed date is past needed_by — trigger risk flag
S-007  CRITICAL_PATH_UPDATE    [AGENT: analytics-agent]        depends_on: S-006
         Update: dependency graph with commitment
         Recalculate: critical path; flag if overall delivery at risk
         If critical path impact: notify T3+ program lead
S-008  DEPENDENCY_TRACKING     [AGENT: delivery-agent]         depends_on: S-006
         Monitor: weekly status checks against commitment
         At-risk signals: providing team velocity drop; blocking issues in their backlog
         Alert: requesting team if at-risk detected 7+ days before deadline
S-009  AT_RISK_INTERVENTION    [HUMAN: T3 leads]               depends_on: S-008 if AT_RISK
         Leads meet to assess: can commitment be met?
         Options: accelerate, de-scope, shift dependency date, escalate
         SLA: 24hr to make decision
S-010  ESCALATION              [GATE: G-EXEC]                  depends_on: S-009 FAIL
         Escalate to T4+ program executive
         Provide: dependency details, risk, options, recommended path
         T4 makes binding resolution: accelerate resources or scope change
S-011  FULFILLMENT_VERIFICATION [AGENT: delivery-agent]        depends_on: S-008
         Verify: dependency actually delivered and works as committed
         Acceptance: requesting team confirms dependency is usable
         If deficient: reopen negotiation
S-012  DEPENDENCY_CLOSE        [SYSTEM]                        depends_on: S-011
         Close dependency record; unblock downstream work
         MTTR equivalent: time from registration to resolution
S-013  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-011–S-012
S-014  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-013
S-015  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-014
```

## Approval Gates

```
G-AUTH:    requesting_team >= T2; providing_team notified
G-EXEC:    T4+ required when dependency SLA breach threatens program delivery
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Providing team non-response (24hr)       T3 lead reminder + page     4hr
No commitment within 48hr               T3 escalation both teams     12hr
Dependency at risk (> 7d before need)   T3 intervention meeting      24hr
Critical path dependency breached        T4 escalation; program alert Immediate
Cascade delay risk > 3 teams            T4 executive brief            4hr
Commitment broken after sign-off        T4 escalation + incident flag 2hr
```

## Governance Checkpoints

```
C-001: human team leads must make and sign commitments; AI tracks but does not commit
C-004: all dependency commitments and outcomes permanently recorded
BINDING: signed commitments cannot be silently dropped; require formal revision process
CRITICAL_PATH: critical path dependencies get elevated monitoring; T3 weekly review
CASCADE: if dependency failure affects > 3 teams — mandatory T4 review
```

## Observability

```
HEALTH METRICS:
  dependency_on_time_rate:      target >= 0.85
  avg_resolution_days:          target <= 10
  critical_path_at_risk_count:  target = 0
  cascade_risk_events:          target < 2/quarter
  commitment_break_rate:        target < 0.05
  early_detection_rate:         risks surfaced > 7d before deadline >= 0.80
```

## Telemetry Events

```
enterprise.workflows.WF-016.initiated    {dep_type, priority, critical_path}
enterprise.workflows.WF-016.committed    {committed_date, on_time: bool}
enterprise.workflows.WF-016.at_risk      {days_to_deadline, cascade_teams_affected}
enterprise.workflows.WF-016.escalated    {reason, tier}
enterprise.workflows.WF-016.resolved     {resolution_days, method, fulfilled: bool}
enterprise.workflows.WF-016.completed    {dep_id, on_time, cascade_impact}
```

## Rollback System

```
ROLLBACK: dependencies are tracked commitments; not reversible system changes
COMMITMENT_BROKEN: document failure; analyze root cause; update reliability scores
ALTERNATIVE_PATH: if dependency permanently unresolvable — document alternative; update architecture
```

## Enterprise System Integrations

```
JIRA:    S-002 → create dependency ticket; link to requesting work item; S-012 → close
SLACK:   S-004 → notify providing team; S-008 → at-risk alerts to both teams
EMAIL:   S-006 → commitment confirmation to both leads
GRC:     S-013 → update cross-team risk register
```

## Wiki Updates

```
wiki/dependencies/{dep_id}.md             ← dependency record + commitment + resolution
wiki/dependencies/dependency-map.md       ← update active dependency map
wiki/delivery/program-risks.md            ← update if critical path impacted
```

## Memory Updates

```
memory/org-intelligence/dependency-registry.yaml  ← register/close dependency
memory/org-intelligence/coupling-matrix.yaml      ← update team coupling scores
memory/work-cognition/active-bottlenecks.yaml     ← register cross-team bottleneck
```
