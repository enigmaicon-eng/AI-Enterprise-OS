# Compliance State Machine
**ID:** ACE-CSM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Governance Org | **Updated:** 2026-05-16

---

## Purpose

Tracks the compliance posture of every entity, agent, workflow, and data operation in the OS as a formal state machine. Rather than treating compliance as a binary pass/fail at audit time, the Compliance State Machine maintains continuous state for each compliance subject, records all state transitions with evidence, and makes the current posture queryable in real time. Compliance state is the single source of truth consumed by dashboards, risk scoring, and remediation systems.

---

## State Definitions

```
STATES:

  COMPLIANT
    Meaning: All applicable controls passing; no open violations; risk score < 0.40
    Entry: Initial state on provisioning; or transition from REMEDIATING (success)
    Allowed actions: Full operation within behavioral contract + autonomy ceiling
    
  MONITORING
    Meaning: Compliant but one or more controls in MARGINAL effectiveness range
    Entry: Control score 0.60–0.79 for 7 consecutive days
    Allowed actions: Full operation; enhanced telemetry; daily compliance check
    
  AT_RISK
    Meaning: Risk score 0.60–0.79; or DEGRADED control; or approaching regulatory deadline
    Entry: Risk score threshold; control DEGRADED; regulatory deadline within 30 days
    Allowed actions: Continue operating; human review required for HIGH-impact actions
    
  VIOLATION_DETECTED
    Meaning: Active compliance violation confirmed
    Entry: compliance-decision-engine emits VIOLATION; pattern-analyzer confirms
    Allowed actions: LIMITED — only actions required for remediation
    Response SLA: CRITICAL 1hr | HIGH 4hr | MEDIUM 24hr | LOW 72hr
    
  REMEDIATING
    Meaning: Violation acknowledged; automated or manual remediation in progress
    Entry: Remediation initiated (automated-remediation-engine or human)
    Allowed actions: Restricted to pre-approved remediation actions only
    Max duration: 2× violation SLA (after which escalate to SUSPENDED or T4)
    
  EXCEPTION_GRANTED
    Meaning: Known compliance gap acknowledged; risk accepted with compensating controls
    Entry: T4 exception approval with time limit
    Required: Exception ID; compensating controls list; expiry date; board notification for CRITICAL
    Max duration: 90 days; renewable with T4 reapproval
    Allowed actions: Full operation within exception scope; enhanced monitoring
    
  SUSPENDED
    Meaning: Critical violation unresolved; operations restricted pending resolution
    Entry: VIOLATION_DETECTED with no remediation progress after SLA; or T4 suspension order
    Allowed actions: NONE except constitutional and emergency access
    Exit: Only via T4 + Legal sign-off
```

---

## State Machine

```
State Transition Table:

FROM             EVENT                            TO                  AUTHORITY
─────────────────────────────────────────────────────────────────────────────────
COMPLIANT        control_degraded                 MONITORING          automatic
COMPLIANT        risk_score >= 0.60               AT_RISK             automatic
COMPLIANT        violation_detected               VIOLATION_DETECTED  automatic
COMPLIANT        exception_granted                EXCEPTION_GRANTED   T4

MONITORING       control_recovered                COMPLIANT           automatic
MONITORING       control_further_degraded         AT_RISK             automatic
MONITORING       violation_detected               VIOLATION_DETECTED  automatic

AT_RISK          risk_score < 0.60                MONITORING          automatic
AT_RISK          all_controls_recovered           COMPLIANT           automatic
AT_RISK          violation_detected               VIOLATION_DETECTED  automatic
AT_RISK          exception_approved               EXCEPTION_GRANTED   T4

VIOLATION_DETECTED  remediation_initiated         REMEDIATING         automatic / human
VIOLATION_DETECTED  sla_breached (no remediation) SUSPENDED           automatic → T4 alert

REMEDIATING      remediation_succeeded            COMPLIANT           automatic (with T3 verify)
REMEDIATING      remediation_partially_succeeded  AT_RISK             T3 decision
REMEDIATING      remediation_failed               SUSPENDED           automatic → T4 alert
REMEDIATING      remediation_sla_breached         SUSPENDED           automatic → T4 alert

EXCEPTION_GRANTED  exception_expired              AT_RISK             automatic
EXCEPTION_GRANTED  exception_renewed              EXCEPTION_GRANTED   T4
EXCEPTION_GRANTED  violation_detected             VIOLATION_DETECTED  automatic (exception does not block violations)

SUSPENDED        t4_remediation_sign_off          COMPLIANT           T4 + Legal
SUSPENDED        t4_restricted_operation          AT_RISK             T4 + Legal
```

---

## Compliance Subject Hierarchy

```yaml
compliance_subjects:

  ENTITY_LEVEL:
    subject_id: ENTITY-{XX}             # e.g., ENTITY-EU
    aggregation: worst state of all agent + workflow subjects within entity
    state_influences_federation: true
    
  AGENT_LEVEL:
    subject_id: AGT-{NNN}
    tracked_dimensions: [per-jurisdiction compliance state per domain]
    example: agent AGT-042 may be COMPLIANT for DATA_PRIVACY-EU but AT_RISK for AI_GOVERNANCE-EU
    
  WORKFLOW_LEVEL:
    subject_id: WF-{NNN}-RUN-{NNN}
    tracked_at: workflow execution run granularity
    state: per run; aggregate: per workflow template
    
  DATA_OPERATION_LEVEL:
    subject_id: DO-{NNN}               # tracked for RESTRICTED+ data operations
    tracked_at: individual data access or transfer
    retention: 7 years (regulatory evidence)
```

---

## State Query API

```
query_compliance_state(subject_id, jurisdiction, domain):

  Returns: ComplianceStateSnapshot {
    subject_id: string
    jurisdiction: JUR-{XX}
    domain: string
    current_state: State
    state_since: ISO8601
    open_violations: [violation_id]
    active_exceptions: [exception_id]
    controls_status: {CTL-{NNN}: score}
    risk_score: float
    next_review: ISO8601
  }
  
  Bulk query: query_all_entity_states() → compliance_matrix
    Returns: {entity_id → {jurisdiction → {domain → state}}}
    Used by: compliance-dashboard.md
    
  State history: query_state_history(subject_id, jurisdiction, domain, from_date, to_date)
    Returns: [StateTransitionRecord]
    Retention: permanent (regulatory audit evidence)
```

---

## State Persistence

```yaml
state_persistence:
  store: JSONL per entity (entity-specific compliance state store)
  format: append-only; each record is a state transition event
  
  state_transition_record:
    record_id: CSM-{NNN}
    subject_id: string
    jurisdiction: string
    domain: string
    from_state: string
    to_state: string
    trigger_event: string
    trigger_evidence: {violation_id | control_id | risk_score | exception_id}
    transitioned_at: ISO8601
    transitioned_by: string (agent_id or "automatic")
    entry_hash: sha256
    prev_record_hash: sha256
    
  recovery:
    state_rebuilt_from: full replay of transition log
    recovery_time: < 5 minutes for any single entity
    integrity_check: weekly hash chain verification
```

---

## Integration

```
Feeds into:
  compliance-engine.md — current state gates compliance check behavior
  compliance-risk-scorer.md — current state feeds risk dimension
  compliance-dashboard.md — state matrix is primary dashboard data source
  automated-remediation-engine.md — VIOLATION_DETECTED triggers remediation

Receives from:
  control-effectiveness-monitor.md — control degradation triggers state transitions
  compliance-decision-engine.md — violation decisions trigger state transitions
  automated-remediation-engine.md — remediation outcomes trigger state transitions
  policy-adaptation-engine.md — exception grants recorded as state transitions
```

---

## Governance

**State is evidence:** Every state transition is a compliance record; hash-chained; immutable; retained permanently for regulatory entities  
**Suspension authority:** Only T4 + Legal can clear a SUSPENDED state; no autonomous path out of SUSPENDED  
**Exception cap:** No entity may hold more than 3 simultaneous EXCEPTION_GRANTED states across any single jurisdiction; 4th requires board notification  
**Constitutional domain:** Compliance state for AI_GOVERNANCE (constitutional controls) tracks separately; a constitutional violation is always SUSPENDED immediately regardless of other state  
**Audit:** All state transitions to `memory/adaptive-compliance/state-transitions.jsonl`; per-entity copies maintained
