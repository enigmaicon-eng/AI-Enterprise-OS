# WF-012: Incident Management

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T2 | **Class:** CRITICAL | **SLA:** <15min acknowledge; severity-based resolution

## Purpose
Detect, triage, coordinate, and resolve production incidents with deterministic escalation, clear command structure, customer communication, and a complete audit trail — minimizing MTTR while maintaining a calm, structured response.

## Inputs

```
REQUIRED:
  trigger_type:       AUTOMATED_ALERT | CUSTOMER_REPORT | ROLLOUT_REGRESSION |
                      MANUAL_DECLARATION | DEPENDENT_TEAM_REPORT
  description:        string — what is broken or degraded
  initial_severity:   SEV1 | SEV2 | SEV3 | SEV4
  affected_systems:   [system_id] — services/components affected

OPTIONAL:
  customer_impact:    boolean
  initiator_id:       string — who declared
  linked_deployment:  release_id — if deployment-triggered
```

## Severity Definitions

```
SEV1: Total service outage OR data loss OR security breach
      SLA: Acknowledge 5min; Mitigate 30min; Resolve 2hr
      Commander: T4+; War room: mandatory

SEV2: Major feature degraded OR significant customer impact
      SLA: Acknowledge 15min; Mitigate 1hr; Resolve 4hr
      Commander: T3+

SEV3: Minor feature degraded OR performance regression > 20%
      SLA: Acknowledge 30min; Resolve 24hr
      Commander: T2+

SEV4: Minimal impact; informational
      SLA: Acknowledge 4hr; Resolve 72hr
      Commander: T2 on-call
```

## Outputs / Artifacts

```
PRIMARY:
  INCIDENT_RECORD:     wiki/incidents/{incident_id}.md
  TIMELINE:            minute-by-minute event log
  MITIGATION_RECORD:   what was done to stop the bleeding
  RESOLUTION_RECORD:   root cause and permanent fix

SECONDARY:
  CUSTOMER_COMMS:      external status page + direct comms (SEV1/2)
  POSTMORTEM_BRIEF:    triggers WF-013; filled during incident close
```

## Lifecycle States

```
DETECTED → ACKNOWLEDGED → TRIAGED → [severity confirmed]
  → SEV1: WAR_ROOM_OPENED → INVESTIGATING → MITIGATED → RESOLVING
  → SEV2/3: INVESTIGATING → MITIGATED → RESOLVING
  → SEV4: MONITORING → RESOLVING
  → [all] RESOLVED → POST_INCIDENT_REVIEW
  → POSTMORTEM_TRIGGERED (SEV1/SEV2) via WF-013
  → CLOSED
```

## Execution Graph

```
S-001  AUTO_ACKNOWLEDGE        [SYSTEM]                        Root (≤ 15s from trigger)
         Auto-create incident ticket; assign severity; page on-call
         SEV1/2: immediately page incident commander
S-002  COMMANDER_ASSIGNMENT    [SYSTEM]                        depends_on: S-001
         SEV1: assign T4 on-call commander; T5 notification
         SEV2: assign T3 on-call commander
         SEV3/4: assign T2 on-call engineer
S-003  WAR_ROOM_SETUP          [SYSTEM]                        depends_on: S-002
         SEV1 only: open dedicated Slack channel #inc-{id}; Zoom bridge
         Invite: commander, on-call engineers, PM lead, customer success (if cust_impact)
S-004  INITIAL_TRIAGE          [AGENT: monitoring-agent]       depends_on: S-002
         Pull: recent deployments, error logs, alert history, dependency status
         Blast radius: what else might be affected
         Output: triage report (facts only; no speculation)
S-005  SEVERITY_CONFIRMATION   [HUMAN: commander]              depends_on: S-004
         Commander confirms or upgrades/downgrades severity
         SEV1 → SEV2: commander downgrades with justification
         SEV2 → SEV1: immediate T4+ escalation
S-006  CUSTOMER_STATUS_UPDATE  [INTEGRATION]                   depends_on: S-005
         SEV1: status page: "Investigating" (within 10min of SEV1 confirmation)
         SEV2: status page update within 30min
         SEV3/4: internal only unless customer reports
S-007  INVESTIGATION           [AGENT: eng-agent + commander]  depends_on: S-005
         Hypotheses generated and tested; logs/metrics analyzed
         Every finding logged to timeline (no informal Slack-only updates)
         AI: pull relevant past incidents (similarity search on incident history)
S-008  MITIGATION              [HUMAN: on-call engineer]       depends_on: S-007
         Options: rollback (→ WF-011 rollback), hotfix, traffic reroute, feature flag
         Mitigation applied; effect verified in monitoring
         ROLLBACK: immediate; per WF-011 rollback protocol
S-009  MITIGATION_CONFIRMED    [AGENT: monitoring-agent]       depends_on: S-008
         Verify: error_rate returning to baseline; customer impact resolving
         Duration: 15min observation post-mitigation
S-010  CUSTOMER_UPDATE_2       [INTEGRATION]                   depends_on: S-009
         SEV1/2: status page update "Monitoring fix"
S-011  RESOLUTION_VERIFICATION [AGENT: monitoring-agent]       depends_on: S-009
         All affected metrics back to normal; no recurrence in 30min
S-012  CUSTOMER_RESOLUTION     [INTEGRATION]                   depends_on: S-011
         SEV1/2: status page "Resolved"; customer communication sent
S-013  INCIDENT_CLOSE          [HUMAN: commander]              depends_on: S-011
         Commander signs off; timeline complete; impacted customer list finalized
S-014  POSTMORTEM_BRIEF        [AGENT: pm-agent]               depends_on: S-013
         SEV1/SEV2: generate postmortem brief; trigger WF-013
         SEV3: abbreviated timeline review; optional WF-013
S-015  MTTR_CALCULATION        [SYSTEM]                        depends_on: S-013
         MTTR = resolved_at - detected_at
         DORA change_failure_rate: update if deployment-triggered
S-016  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-013–S-015
S-017  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-016
S-018  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-017
```

## Approval Gates

```
G-AUTH:    any T2+ can declare; automated alerts auto-declare
SEV_CONFIRM: commander must confirm severity within SLA
MITIGATION: commander authorizes mitigation action
CLOSE: commander sign-off required with complete timeline
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
SEV1 not acknowledged in 5min            Auto-page backup on-call    5min
SEV2 not acknowledged in 15min           Auto-page T3 commander      15min
Mitigation SLA breach (SEV1: 30min)      T4 escalation; T5 notified 5min
Customer churn signal during SEV1        T5 CEO notification         Immediate
Data loss confirmed                      T4+T5+legal+DPO immediately Immediate
Security breach confirmed                T4 CISO + legal + T5 CEO   Immediate
SEV1 unresolved > 2hr                    T5 executive war room       Immediate
```

## Governance Checkpoints

```
C-001: commander (human) must authorize all mitigation actions
C-004: every action logged to timeline (AI generates; human commands)
DATA_LOSS: immediate T4/T5/DPO/legal notification; regulatory breach protocol
SECURITY_BREACH: zero tolerance; immediate isolation; CISO notified
CUSTOMER_COMMS: SEV1/2 status page required within SLA; no radio silence
POSTMORTEM: SEV1 requires postmortem; SEV2 strongly recommended
```

## Observability

```
REAL-TIME DURING INCIDENT:
  error_rate:           vs. pre-incident baseline
  affected_user_count:  estimate from access logs
  mitigation_progress:  error rate trend direction

INCIDENT METRICS (DORA):
  MTTR:                 target SEV1 < 2hr; SEV2 < 4hr; SEV3 < 24hr
  incident_count_30d:   track by severity
  recurrence_rate:      same root cause recurring → process failure
  customer_impact_pct:  % incidents with customer impact (target < 0.30)
```

## Telemetry Events

```
enterprise.workflows.WF-012.detected       {severity, trigger_type, systems}
enterprise.workflows.WF-012.acknowledged   {commander, ack_time_min}
enterprise.workflows.WF-012.sev_changed    {from, to, commander, reason}
enterprise.workflows.WF-012.mitigated      {action, mitigation_time_min}
enterprise.workflows.WF-012.resolved       {mttr_min, root_cause_category}
enterprise.workflows.WF-012.postmortem_triggered {incident_id, severity}
```

## Rollback System

```
ROLLBACK WITHIN INCIDENT: handled by WF-011 rollback protocol (< 10s)
INCIDENT ITSELF: cannot be rolled back; timeline is permanent record
ARTIFACTS: incident record is append-only; never modified after close
```

## Enterprise System Integrations

```
PAGERDUTY:   S-001 → page on-call; S-013 → resolve alert
STATUS_PAGE: S-006 → update; S-012 → resolve
SLACK:       S-003 → create war room channel; S-018 → post summary to #incidents
JIRA:        S-001 → create incident ticket; S-015 → link to triggering deployment
EMAIL:       S-012 → customer notification (SEV1/2 with customer impact)
```

## Wiki Updates

```
wiki/incidents/{incident_id}.md            ← full incident record + timeline
wiki/incidents/incident-index.md           ← append to incident log
wiki/runbooks/{affected_system}-recovery.md ← update if new recovery method found
```

## Memory Updates

```
memory/incidents/incident-registry.yaml    ← incident + severity + MTTR
memory/incidents/incident-history.jsonl    ← append record
memory/data-intelligence/anomaly-records.yaml ← close anomaly if incident resolves it
```
