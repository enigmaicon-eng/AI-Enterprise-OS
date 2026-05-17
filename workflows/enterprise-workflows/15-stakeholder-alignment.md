# WF-015: Stakeholder Alignment

**Version:** 1.0.0 | **Owner:** PM Org | **Tier:** T3 | **Class:** ELEVATED | **SLA:** 7 days

## Purpose
Achieve documented, binding alignment across stakeholders on decisions, priorities, and direction — producing a signed alignment record, surfaced conflicts, and clear accountability for next steps. Prevents scope creep, silent objections, and undocumented direction changes.

## Inputs

```
REQUIRED:
  decision_topic:     string — what alignment is being sought on
  decision_type:      PRIORITY | SCOPE | DIRECTION | RESOURCE | TRADE_OFF | ESCALATION
  stakeholders:       [stakeholder_id] — all parties whose alignment is required
  requestor_id:       string — T3+ PM or lead

OPTIONAL:
  deadline:           ISO8601 — when decision is needed
  blocking_work:      [work_item_id] — items blocked on this alignment
  prior_context:      document_id — relevant prior decisions or context
  async_only:         boolean — skip synchronous meeting (default: false)
```

## Outputs / Artifacts

```
PRIMARY:
  ALIGNMENT_RECORD:   wiki/decisions/{decision_id}.md — signed decision record
  STAKEHOLDER_MAP:    who agreed, who objected, who abstained + reasons
  ACTION_ITEMS:       concrete next steps with owners from the decision

SECONDARY:
  ESCALATION_RECORD:  if alignment not achieved — escalation path taken
  CONFLICT_LOG:       documented objections and how they were resolved
```

## Lifecycle States

```
INITIATED → CONTEXT_PREP → STAKEHOLDER_NOTIFY → ASYNC_REVIEW
  → [conflict detected] CONFLICT_RESOLUTION → SYNC_MEETING
  → [no conflict] ASYNC_DECISION → ALIGNMENT_CHECK
  → [aligned] DECISION_RECORD → ARTIFACT_PERSIST → COMPLETED
  → [not aligned] ESCALATION → EXEC_DECISION → DECISION_RECORD
  → FAILED (stakeholder unresponsive after escalation)
```

## Execution Graph

```
S-001  AUTH_CHECK              [GATE: G-AUTH T3+]              Root
S-002  CONTEXT_SYNTHESIS       [AGENT: pm-agent]               depends_on: S-001
         Compile: all relevant context, prior decisions, constraints
         Generate: decision brief (1 page max) — options, trade-offs, recommendation
         Identify: each stakeholder's likely concerns and priorities
S-003  STAKEHOLDER_ANALYSIS    [AGENT: pm-agent]               depends_on: S-002
         Classify each stakeholder:
           DECISION_MAKER: must align; blocks progress
           INFLUENCER: input required; strong opinion expected
           INFORMED: must be notified; no blocking authority
         Map: likely positions per option based on past decisions + org context
S-004  ASYNC_DISTRIBUTION      [INTEGRATION]                   depends_on: S-003
         Send: decision brief + options to all stakeholders via Slack + email
         Request: written response within 48hr
         Track: who has responded; who has not
S-005  RESPONSE_COLLECTION     [AGENT: pm-agent]               depends_on: S-004
         SLA: 48hr for async responses
         Collect: positions (SUPPORT | OPPOSE | ABSTAIN | NEEDS_MORE_INFO)
         Synthesize: areas of agreement and disagreement
S-006  CONFLICT_DETECTION      [AGENT: pm-agent]               depends_on: S-005
         Conflict defined: any DECISION_MAKER with OPPOSE
         Near-conflict: ≥2 INFLUENCER with OPPOSE
         No conflict: proceed to S-009 (async decision)
         Conflict detected: proceed to S-007
S-007  CONFLICT_RESOLUTION     [HUMAN: requestor + stakeholders] depends_on: S-006
         Synchronous meeting: 60min max
         Agenda: present conflict; explore options; seek compromise
         Facilitator: requestor or neutral T3+
         Outcome: revised proposal OR escalation decision
         SLA: scheduled within 24hr of conflict detection
S-008  SYNC_MEETING_OUTCOME    [AGENT: pm-agent]               depends_on: S-007
         Document: meeting notes, revised position, any concessions
         Updated alignment check: is conflict resolved?
         If still unresolved: → S-011 (escalation)
S-009  ALIGNMENT_VERIFICATION  [AGENT: pm-agent]               depends_on: S-005 or S-008
         Check: all DECISION_MAKERs have SUPPORT or ABSTAIN
         Abstain: acceptable if documented reason provided
         Quorum: ≥ 80% of DECISION_MAKERs aligned
S-010  DECISION_RECORD         [AGENT: pm-agent]               depends_on: S-009
         Document: decision made, rationale, options considered, who aligned
         Record: any dissenting views (important for future reference)
         Format: wiki/decisions/{decision_id}.md
S-011  ESCALATION              [GATE: G-EXEC]                  depends_on: S-008 or S-009 FAIL
         Escalate to T4+ decision maker
         Provide: conflict summary, options, each stakeholder's position
         SLA: 24hr for T4 decision
S-012  EXEC_DECISION           [HUMAN: T4+]                    depends_on: S-011
         T4+ makes binding decision; documents rationale
         Dissenters: acknowledged in record; must respect decision
S-013  ACTION_ITEM_ASSIGNMENT  [AGENT: pm-agent]               depends_on: S-010 or S-012
         Extract: concrete next steps from decision
         Assign: owner, deadline per action item
         Unblock: blocking_work items
S-014  STAKEHOLDER_NOTIFY      [INTEGRATION]                   depends_on: S-013
         Notify: all stakeholders of final decision + action items
         Channel: Slack + email + Jira ticket updates
S-015  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-013–S-014
S-016  MEMORY_UPDATE           [SYSTEM]                        depends_on: S-015
S-017  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-016
```

## Approval Gates

```
G-AUTH:    requestor >= T3; stakeholder list defined; decision topic scoped
G-EXEC:    T4+ required when DECISION_MAKERs cannot reach alignment
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
Stakeholder non-response (48hr)          Reminder + T3 escalation    24hr
DECISION_MAKER blocks (no resolution)   G-EXEC escalation            24hr
Blocking work impacted > 5 engineers    Fast-track: T4 review        4hr
Deadline < 24hr; unresolved conflict    Immediate T4 escalation      2hr
Silent objection detected post-decision  Reopen alignment; document  48hr
```

## Governance Checkpoints

```
C-001: human decision maker required; AI synthesizes but does not decide
C-004: all alignment decisions permanently recorded with rationale
DISSENT: objections must be documented; dissenters notified
BINDING: signed alignment records cannot be quietly overridden; require new WF-015
ASYNC_BIAS: async-only path prohibited for HIGH_RISK decisions requiring quorum
```

## Observability

```
HEALTH METRICS:
  avg_alignment_cycle_days:     target <= 5
  escalation_rate:              target < 0.20 (high = upstream conflict)
  async_resolution_rate:        target >= 0.70 (most decisions resolved async)
  stakeholder_response_rate:    target >= 0.90 within SLA
  decision_reversal_rate:       target < 0.05 (reversals = failed alignment)
```

## Telemetry Events

```
enterprise.workflows.WF-015.initiated    {decision_type, stakeholder_count, blocking_count}
enterprise.workflows.WF-015.conflict     {opposing_stakeholders, conflict_type}
enterprise.workflows.WF-015.escalated    {reason, escalation_tier}
enterprise.workflows.WF-015.aligned      {method: ASYNC|SYNC|ESCALATION, alignment_pct}
enterprise.workflows.WF-015.completed    {decision_id, action_item_count, cycle_days}
```

## Rollback System

```
ROLLBACK: decisions are not rolled back; superseded by new WF-015 run
REVERSAL: if decision proves incorrect — new alignment workflow required; document why
SILENT_OVERRIDE: detected by governance checks; forces new alignment cycle
```

## Enterprise System Integrations

```
SLACK:   S-004 → decision brief to stakeholder channels; S-014 → final decision notification
EMAIL:   S-004 → formal alignment request; S-014 → decision record
JIRA:    S-013 → create/update blocked work items; link decision record
WIKI:    S-010 → publish decision record; S-016 → update decisions index
```

## Wiki Updates

```
wiki/decisions/{decision_id}.md           ← full alignment record
wiki/decisions/decision-log.md            ← append decision to log
wiki/planning/active-blockers.md          ← remove resolved blockers
```

## Memory Updates

```
memory/governance/decision-registry.yaml  ← register decision with outcome
memory/work-cognition/active-bottlenecks.yaml ← close alignment bottlenecks
memory/org-intelligence/coupling-matrix.yaml  ← update stakeholder coupling
```
