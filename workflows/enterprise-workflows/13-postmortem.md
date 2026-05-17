# WF-013: Postmortem

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T2 | **Class:** ELEVATED | **SLA:** 5 days

## Purpose
Produce a blameless, high-quality postmortem that identifies the true root cause of an incident, generates actionable follow-up items with owners and deadlines, extracts organizational learning, and drives systemic improvement to prevent recurrence.

## Inputs

```
REQUIRED:
  incident_id:        string — WF-012 closed incident
  severity:           SEV1 | SEV2 | SEV3
  incident_commander: string — who led the incident response

OPTIONAL:
  customer_impact_statement: string — customer-facing impact description
  preliminary_rca:    string — initial root cause hypothesis
```

## Outputs / Artifacts

```
PRIMARY:
  POSTMORTEM_DOC:     wiki/postmortems/{incident_id}.md
  ACTION_ITEMS:       Jira tickets with owners, estimates, and deadlines
  ROOT_CAUSE_RECORD:  structured RCA for organizational learning

SECONDARY:
  PROCESS_IMPROVEMENT: triggered WF-021 if systemic process issue identified
  WIKI_UPDATE:         runbook or architecture doc updates triggered
```

## Lifecycle States

```
INITIATED → TIMELINE_REVIEW → CONTRIBUTING_FACTORS_ANALYSIS
  → ROOT_CAUSE_ANALYSIS → IMPACT_ASSESSMENT → ACTION_ITEM_GENERATION
  → BLAMELESS_REVIEW → DOCUMENT_FINALIZATION → REVIEW_GATE
  → PUBLISHED → ACTION_ITEM_TRACKING → COMPLETED
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T2+]              Root
S-002  INCIDENT_DATA_PULL      [AGENT: analytics-agent]        depends_on: S-001
         Pull from WF-012: full timeline, all actions, metrics during incident
         Pull: similar past incidents (similarity search on root_cause categories)
S-003  TIMELINE_SYNTHESIS      [AGENT: pm-agent]               depends_on: S-002
         Reconstruct: detection → acknowledge → investigation → mitigation → resolution
         Format: minute-by-minute log with sources cited
         Flag: any gaps in timeline (missing log entries)
S-004  CONTRIBUTING_FACTORS    [AGENT: pm-agent + eng-agent]   depends_on: S-003
         Method: 5 Whys + Contributing factors (not single root cause myth)
         Categories: People, Process, Technology, Environment
         BLAMELESS: facts only; no individual attribution in negative context
S-005  ROOT_CAUSE_ANALYSIS     [AGENT: pm-agent]               depends_on: S-004
         Identify: proximate cause (what broke) + systemic cause (why it could break)
         Classify: DETECTION_GAP | PREVENTION_GAP | RECOVERY_GAP | ALL
         Check: is this a recurrence? (search incident history for same root_cause_category)
S-006  IMPACT_QUANTIFICATION   [AGENT: analytics-agent]        depends_on: S-002
         Calculate: duration, affected users, revenue impact estimate, MTTR
         SLA breach: which SLA commitments were missed
S-007  ACTION_ITEM_GENERATION  [AGENT: pm-agent]               depends_on: S-004, S-005
         Generate: action items categorized by impact tier
           PREVENTION: changes to prevent this class of failure
           DETECTION: improve monitoring/alerting
           RECOVERY: improve runbooks/automation for faster MTTR
         Each action item: owner_team, estimated_effort, priority, deadline
         Priority: CRITICAL (< 2 weeks), HIGH (< 4 weeks), MEDIUM (< 8 weeks)
S-008  WORKFLOW_IMPROVEMENT    [CONDITIONAL]                   depends_on: S-005
         If systemic process failure: trigger WF-021 (Workflow Optimization)
         If runbook gap found: assign wiki update as action item
S-009  BLAMELESS_REVIEW        [HUMAN: incident commander]     depends_on: S-003–S-007
         Commander reviews for: accuracy, completeness, blameless framing
         SLA: 24hr  |  Commander may add context or correct facts
S-010  POSTMORTEM_MEETING      [HUMAN: team members]           depends_on: S-009
         Optional but recommended for SEV1/2
         30-60min; all participants review document together
         Outcome: any corrections → update document
S-011  QUALITY_GATE            [GATE: G-QUALITY]               depends_on: S-009
         Check: all required sections present (timeline, RCA, impact, actions)
         Check: all action items have owners, deadlines, and priorities
         Check: no blame language (AI sentiment scan)
         Pass: 0.85+
S-012  DOCUMENT_PUBLISH        [INTEGRATION]                   depends_on: S-011
         Publish to wiki; notify all stakeholders; index in incident registry
S-013  ACTION_ITEM_CREATE      [INTEGRATION]                   depends_on: S-012
         Create Jira tickets for all action items; assign owners; set due dates
S-014  LEARNING_EXTRACT        [AGENT: knowledge-agent]        depends_on: S-012
         Extract: reusable learnings for knowledge management system
         Update: runbooks with any new recovery procedures identified
S-015  RECURRENCE_CHECK        [AGENT: analytics-agent]        depends_on: S-005
         If same root_cause as prior incident: flag for process escalation
         Recurrence detected: T3 alert; process improvement urgent
S-016  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-012–S-015
S-017  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-016
S-018  ACTION_TRACKING_START   [SYSTEM]                        depends_on: S-013
         Schedule: follow-up at action_item deadline date
         Alert if action items not completed by deadline
S-019  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-017
```

## Approval Gates

```
G-AUTH:    initiator >= T2; incident must be CLOSED (WF-012 completed)
G-QUALITY: all sections complete; blameless framing; all action items have owners+deadlines
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Postmortem not initiated within 24hr     T3 alert to commander       4hr response
Recurrence of same root cause            T3 priority escalation      24hr
Action item CRITICAL not assigned within 48hr  T3 escalation        2hr response
Action item deadline missed              Escalate to T3; SLA reset   48hr
Quality gate fails (blame language)      Return to commander         4hr fix
```

## Governance Checkpoints

```
C-001: human commander review; blameless principle enforced
C-003: postmortem artifact required within 5 days of SEV1/2 resolution
C-004: root cause and all decisions permanently recorded
BLAMELESS: AI scans for blame language before publish; block if found
RECURRENCE: same root cause 3× → mandatory T4 review + systemic fix
ACTION_COMPLETION: tracked; incomplete CRITICAL actions escalated
```

## Observability

```
HEALTH METRICS:
  postmortem_completion_rate:   target >= 0.95 (all SEV1/2 have postmortems within 5d)
  avg_cycle_time_days:          target <= 5
  action_item_on_time_rate:     CRITICAL: target >= 0.90; HIGH: >= 0.80
  recurrence_rate_90d:          target < 0.10 (same root cause not recurring)
  avg_action_items_per_incident: diagnostic (too few = superficial; too many = noisy)
```

## Telemetry Events

```
enterprise.workflows.WF-013.initiated    {incident_id, severity, commander}
enterprise.workflows.WF-013.rca_complete {root_cause_category, is_recurrence}
enterprise.workflows.WF-013.actions_created {count_critical, count_high, count_medium}
enterprise.workflows.WF-013.published    {postmortem_id, wiki_path}
enterprise.workflows.WF-013.completed    {action_item_count, cycle_time_days}
```

## Wiki Updates

```
wiki/postmortems/{incident_id}.md         ← full postmortem document
wiki/postmortems/postmortem-index.md      ← append to index
wiki/runbooks/{affected_system}.md        ← update with new recovery steps (if found)
wiki/knowledge/failure-patterns.md        ← append reusable learnings
```

## Memory Updates

```
memory/incidents/incident-registry.yaml   ← link postmortem to incident
memory/knowledge-management/learnings.yaml ← index new learning
memory/work-cognition/pattern-library.yaml ← if new failure pattern identified
```
