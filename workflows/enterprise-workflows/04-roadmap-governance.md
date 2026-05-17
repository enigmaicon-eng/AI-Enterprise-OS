# WF-004: Roadmap Governance

**Version:** 1.0.0 | **Owner:** Product Org | **Tier:** T3 | **Class:** ELEVATED | **SLA:** 7 days

## Purpose
Evaluate, approve, or reject proposed changes to the committed product roadmap — including scope additions, priority reordering, feature removals, or milestone changes — ensuring all changes have executive visibility, assessed impact, and leave a decision trail.

## Inputs

```
REQUIRED:
  change_type:          ADD | REMOVE | REPRIORITIZE | SCOPE_CHANGE | MILESTONE_SHIFT
  change_description:   string — what is changing and why
  requestor_id:         string — T2+ team member or stakeholder
  affected_initiatives: [initiative_id] — which items on roadmap are affected

OPTIONAL:
  customer_pressure:    boolean — customer or SLA driving this change
  regulatory_driver:    boolean — compliance deadline driving this
  urgency:              IMMEDIATE | HIGH | STANDARD
```

## Outputs / Artifacts

```
PRIMARY:
  ROADMAP_CHANGE_RECORD: wiki/product/roadmap-changes/{change_id}.md
  UPDATED_ROADMAP:       wiki/product/roadmap.md (updated version)
  IMPACT_ASSESSMENT:     capacity, dependency, and OKR impact analysis

SECONDARY:
  STAKEHOLDER_NOTICE:    notification to affected stakeholders
  DEPENDENCY_DELTA:      changes to cross-team dependency agreements
```

## Lifecycle States

```
INITIATED → VALIDATING → IMPACT_ANALYSIS → DEPENDENCY_IMPACT
  → STAKEHOLDER_NOTICE → REVIEW
  → [P1 / regulatory] EXEC_APPROVAL
  → ROADMAP_UPDATE → COMPLETED
  → REJECTED (with reason) | DEFERRED | CANCELLED
```

## Execution Graph

```
S-001  AUTH_CHECK             [GATE: G-AUTH T2+]             Root
S-002  CHANGE_CLASSIFICATION  [AGENT: pm-agent]              depends_on: S-001
         Classify: severity (MINOR | MAJOR | CRITICAL)
         MINOR: remove/reprioritize within quarter, no capacity impact
         MAJOR: cross-quarter impact, new capacity required, dependency change
         CRITICAL: OKR-level change, exec approval mandatory
S-003  IMPACT_ANALYSIS        [AGENT: pm-agent + analytics]  depends_on: S-002
         Assess: OKR impact, capacity delta, sprint disruption, downstream effects
S-004  DEPENDENCY_IMPACT      [AGENT: delivery-agent]        depends_on: S-002
         Identify: which cross-team dependency agreements are affected
         Trigger: WF-016 if agreement changes required
S-005  STAKEHOLDER_MAP        [AGENT: pm-agent]              depends_on: S-003
         List: all stakeholders impacted; notification tier per stakeholder
S-006  REVIEW                 [HUMAN: T3 PM lead]            depends_on: S-003–S-005
         T3 PM lead reviews impact; may APPROVE | REJECT | ESCALATE
         SLA: 24hr for URGENT; 72hr for STANDARD
S-007  EXEC_APPROVAL          [GATE: G-EXEC T4]              depends_on: S-006
         REQUIRED IF: change_severity = CRITICAL OR OKR impacted OR urgency = IMMEDIATE
         Approver: T4 CPO  |  SLA: 4hr (IMMEDIATE) | 24hr (standard)
S-008  ROADMAP_UPDATE         [AGENT: pm-agent]              depends_on: S-006 or S-007
         Update roadmap document; rev version; log change_id in change history
S-009  STAKEHOLDER_NOTIFY     [INTEGRATION]                  depends_on: S-008
         Notify all mapped stakeholders; include: what changed, why, impact, new dates
S-010  DEPENDENCY_UPDATE      [INTEGRATION]                  depends_on: S-008
         Update affected dependency agreements in dependency-registry
S-011  ARTIFACT_PERSIST       [INTEGRATION]                  depends_on: S-008–S-010
S-012  MEMORY_UPDATE          [SYSTEM]                       depends_on: S-011
S-013  COMPLETION_EVENT       [SYSTEM]                       depends_on: S-012
```

## Approval Gates

```
G-AUTH:    requestor >= T2; change not already under review (dedup)
G-EXEC:    T4 CPO; required for CRITICAL severity, OKR impact, or IMMEDIATE urgency
```

## Escalation Logic

```
TRIGGER                                ACTION                      SLA
──────────────────────────────────────────────────────────────────────────
CRITICAL change without exec approval  Auto-escalate to T4 CPO     1hr
Stakeholder disputes change            T3 mediation session        24hr
Customer-driven IMMEDIATE change       T4 CPO + account team       2hr
Regulatory driver: compliance at risk  T4 DPO + T4 CTO review      4hr
```

## Governance Checkpoints

```
C-001: exec approval for OKR-level changes
C-004: every roadmap change recorded with decision rationale
OKR Integrity: changes that remove OKR deliverables require exec acknowledgment
CONTRACT: if change affects external SLA/contract, legal review triggered
```

## Observability

```
HEALTH METRICS:
  avg_change_cycle_time_days:   target <= 7
  changes_by_type:              monitor ADD rate (excess = planning quality issue)
  exec_escalation_rate:         target < 0.30 (most changes resolved at T3)
  rejected_change_pct:          diagnostic (high = poor initial scoping)
```

## Telemetry Events

```
enterprise.workflows.WF-004.initiated    {change_type, urgency, requestor}
enterprise.workflows.WF-004.classified   {severity, okr_impact, dependency_impact}
enterprise.workflows.WF-004.approved     {approver_tier, cycle_time_hr}
enterprise.workflows.WF-004.rejected     {reason, rejector_tier}
enterprise.workflows.WF-004.completed    {change_id, roadmap_version}
```

## Rollback System

```
ROLLBACK WINDOW: 5 days (before sprint planning picks up changed roadmap)
ROLLBACK TRIGGER: exec reversal; customer contract renegotiated

ROLLBACK STEPS:
  R-008: revert roadmap to prior version (wiki revision history)
  R-010: restore prior dependency agreements
  R-009: send reversal notice to all stakeholders
```

## Enterprise System Integrations

```
JIRA:       S-008 → reorder epics; update milestone dates; update sprint assignments
CONFLUENCE: S-008 → update Roadmap page with changelog entry
SLACK:      S-009 → notify affected team leads in #roadmap-updates
CRM:        S-009 → if customer-committed feature affected → notify account manager
```

## Wiki Updates

```
wiki/product/roadmap.md                         ← updated roadmap (versioned)
wiki/product/roadmap-changes/{change_id}.md     ← full change record
wiki/decisions/roadmap-{change_id}.md           ← decision with rationale
```

## Memory Updates

```
memory/product/initiative-registry.yaml             ← updated with change
memory/org-intelligence/dependency-registry.yaml    ← dependency agreements updated
```
