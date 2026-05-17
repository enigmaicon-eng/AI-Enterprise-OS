# Recurring Failure Detection
**ID:** AC-OL-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org + QA Org | **Updated:** 2026-05-17

---

## Purpose

Proactively identifies failure patterns that recur across executions before they become entrenched organizational anti-patterns. A failure that occurs once is an incident; a failure that recurs without organizational response is a systemic gap.

---

## Recurrence Detection Model

```
RECURRENCE SIGNALS:

  TEMPORAL RECURRENCE:
    Same failure class (FC-NN) appearing in same calendar period (monthly, quarterly)
    Signal: seasonality in system load, resource constraints, or external dependencies

  WORKFLOW-TYPE RECURRENCE:
    Same failure class consistently appearing in the same workflow type
    Signal: structural workflow design issue

  AGENT-DOMAIN RECURRENCE:
    Same failure class triggered by same agent-domain combination
    Signal: domain coverage gap or agent calibration issue

  DEPENDENCY RECURRENCE:
    Same dependency causing failures across multiple workflow types
    Signal: upstream system reliability issue; integration design gap

  GOVERNANCE-INTERACTION RECURRENCE:
    Same governance gate blocking progress across multiple projects
    Signal: gate calibration issue OR systematic preparation failure upstream of gate
    Note: "gate is too strict" is NOT a valid conclusion; 
          "teams are not preparing adequately for this gate" is the correct frame
```

---

## Detection Protocol

```
RUN: weekly (automated) + monthly (deep) + on-demand (T3 trigger)

WEEKLY AUTOMATED SCAN:
  Query failure records from last 14 days
  Compare to prior 14-day baseline
  Flag: any failure class appearing ≥ 3 times (absolute) or ≥ 2× baseline rate
  Output: recurrence_alert (AMBER or RED)

MONTHLY DEEP SCAN:
  Query 90-day failure history
  Run full clustering analysis (not just frequency; structural similarity too)
  Identify: systemic failure themes
  Generate: monthly_recurrence_report
  Route: T3 review

ON-DEMAND:
  Triggered by: RED recurrence_alert, project close, executive request
  Scope: specific failure class, specific agent, specific workflow type
  Depth: DEEP analysis including cross-project correlation
```

---

## Recurrence Severity Classification

```yaml
recurrence_classes:

  EMERGING:
    definition: Pattern appearing 2-3 times; may be coincidence
    response: monitor; no action yet
    alert: none

  ESTABLISHED:
    definition: Pattern appearing 4-5 times; likely systematic
    response: create learning_record; propose heuristic review
    alert: AMBER to T3

  PERSISTENT:
    definition: Pattern appearing 6+ times despite prior interventions
    response: formal T3 review; mandatory action plan; progress tracked
    alert: RED to T3

  ENTRENCHED:
    definition: Pattern persisting for 3+ months despite interventions
    response: T4 escalation; architectural review; possible workflow redesign
    alert: RED to T4
```

---

## Failure Pattern Memory

```
Detected recurring failures are stored in:
  memory/failures/ (existing store)
  adaptive-cognition/store/learning-events.jsonl (with learning_type = FAILURE_CLASS)

Failure pattern entries include:
  - First detected date
  - Recurrence history (list of re-occurrence events)
  - Interventions attempted + outcomes
  - Current status (EMERGING → ENTRENCHED)
  - Owner (who is accountable for resolution)
  - Target elimination date

These entries are permanent (never deleted; patterns can be RESOLVED but not erased).
```

---

## Intervention Tracking

```
For every ESTABLISHED or worse failure pattern:

  INTERVENTION RECORD:
    intervention_id: INT-YYYYMMDD-NNN
    pattern_id: reference to failure pattern
    intervention_type: HEURISTIC_CHANGE | WORKFLOW_UPDATE | AGENT_CALIBRATION | 
                       KNOWLEDGE_BASE_UPDATE | GOVERNANCE_REVIEW | ARCHITECTURAL_CHANGE
    proposed_by: agent/human
    approved_by: T3+ human
    activated_at: date
    monitoring_period: 30 days
    outcome: RESOLVED | PARTIAL | NO_IMPROVEMENT | WORSENED
    
  Post-intervention review at 30 days:
    Did the pattern recurrence rate decline?
    If NO_IMPROVEMENT: escalate to next severity class
    If WORSENED: immediate rollback + T4 escalation
```

---

## Governance

- Recurring failure detection is observational; it proposes interventions, does not mandate them
- Pattern detection results that implicate governance gates are shared with Governance Org
- Failure patterns affecting security are shared with Security Org regardless of scope
- ENTRENCHED patterns trigger mandatory T4 executive review
