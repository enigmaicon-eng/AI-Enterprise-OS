# Escalation Queue System

## Purpose
Manages the escalation layer of human review — requests that have exceeded their original handling context and require higher authority, broader visibility, or specialized expertise. Distinct from the approval queue: escalation queues handle situations where normal approval processes have failed, stalled, or been insufficient.

---

## Escalation Sources

```
Escalation Triggers
├── SLA breach on approval queue request
├── Approval rejected → requires higher-tier re-review
├── Needs-info loop stalled (> N rounds without resolution)
├── Constitutional concern flagged during review
├── Approver conflict of interest detected
├── Policy exception beyond approver authority
├── Incident severity escalation (P3→P2, P2→P1)
├── Case management escalation (stall, scope drift, budget breach)
└── Manual escalation by any Tier-2+ principal
```

---

## Escalation Queue Schema

```yaml
escalation_item:
  escalation_id: "ESQ-uuid"
  
  # Origin
  origin_type: APPROVAL_SLA_BREACH | APPROVAL_REJECTED_RESUBMIT | NEEDS_INFO_STALL
              | CONSTITUTIONAL_CONCERN | CONFLICT_OF_INTEREST | POLICY_EXCEPTION_AUTHORITY
              | INCIDENT_SEVERITY_CHANGE | CASE_ESCALATION | MANUAL
  origin_id: string         # original approval_request_id or case_id
  
  # Context chain — full history of what led to escalation
  escalation_chain:
    - tier: integer
      handled_by: agent-id | null
      outcome: APPROVED | REJECTED | STALLED | ESCALATED | NO_APPROVER
      duration_ms: integer
      notes: string
  
  # Current routing
  current_tier: 1–5
  assigned_to: agent-id | null
  assigned_role: string
  
  # Urgency
  urgency: CRITICAL | HIGH | MEDIUM | LOW
  submitted_at: ISO-8601
  sla_deadline: ISO-8601          # per escalation SLA matrix
  sla_remaining_pct: float
  
  # Evidence package (auto-assembled)
  evidence:
    original_request: approval_request schema
    history: [escalation_chain entries]
    sla_data: {target_ms, elapsed_ms, breach_pct}
    stall_analysis: string | null    # why it stalled
    conflict_analysis: string | null # why conflict detected
  
  # Resolution
  status: OPEN | ASSIGNED | UNDER_REVIEW | RESOLVED | FURTHER_ESCALATED | CLOSED
  resolution:
    resolved_by: agent-id | null
    resolved_at: ISO-8601 | null
    outcome: APPROVED | REJECTED | DELEGATED | POLICY_UPDATED | FURTHER_ESCALATED
    resolution_notes: string
```

---

## Escalation Tier Matrix

```yaml
tier_matrix:
  TIER-1 items escalate to:
    on_sla_breach: TIER-2 queue
    on_constitutional_concern: TIER-3 queue + governance-lead notification
  
  TIER-2 items escalate to:
    on_sla_breach: TIER-3 queue
    on_conflict_of_interest: TIER-3 queue + org-lead notification
    on_constitutional_concern: TIER-4 queue + governance-lead notification
  
  TIER-3 items escalate to:
    on_sla_breach: TIER-4 queue + governance-lead notification
    on_constitutional_concern: TIER-5 queue + immediate executive notification
  
  TIER-4 items escalate to:
    on_sla_breach: executive board notification + CRITICAL incident
  
  TIER-5 items:
    cannot_further_escalate: true
    on_sla_breach: ALL executive notification + governance incident
```

---

## Conflict of Interest Detection

Automatically flags conflict of interest before assignment:

```yaml
conflict_detection:
  rules:
    SUBMITTER_APPROVER:
      check: approver.id == request.submitted_by
      severity: BLOCK   # cannot approve own request
    
    FINANCIAL_INTEREST:
      check: approver is named beneficiary or affected by request outcome
      severity: BLOCK
      detection: requires human declaration OR org-chart relationship check
    
    PRIOR_INVOLVEMENT:
      check: approver was involved in creating the artifact under review
      severity: WARNING   # flag for disclosure, not automatic block
      detection: execution-lineage-tracker.actor_index[approver_id].artifacts_created
    
    ORG_AFFILIATION:
      check: request directly affects approver's org and approver is org lead
      severity: WARNING   # flag; require second approver from outside org
    
    RECUSAL_ON_FILE:
      check: approver has filed a recusal for this subject domain
      severity: BLOCK
  
  on_BLOCK:
    action: remove from eligible approver pool + note reason in audit trail
  
  on_WARNING:
    action: flag in context package + require approver disclosure before deciding
```

---

## Stall Detection

Detects when escalation items are themselves stalling:

```yaml
stall_indicators:
  NO_APPROVER_AVAILABLE:
    condition: assigned_to == null AND age > PT2H
    action: expand pool + notify tier lead
  
  APPROVER_NON_RESPONSIVE:
    condition: assigned_to != null AND no activity for > (sla * 0.30)
    action: send reminder + cc manager
  
  NEEDS_INFO_LOOP:
    condition: NEEDS_INFO status > 2 rounds with no new information
    action: convene structured review (chair = governance lead)
  
  PARTIAL_QUORUM:
    condition: quorum-required item has < required_approvals after sla * 0.60
    action: notify remaining approvers directly + priority boost to 900
  
  CONSTITUTIONAL_DEADLOCK:
    condition: constitutional concern cannot be resolved at current tier
    action: immediate escalation to Tier-4 + create governance incident
```

---

## Escalation SLA Schedule

```yaml
sla_schedule:
  CRITICAL:
    acknowledge: PT15M
    first_action: PT30M
    resolution: PT4H
    further_escalation_trigger: PT2H without progress
  
  HIGH:
    acknowledge: PT1H
    first_action: PT2H
    resolution: PT24H
    further_escalation_trigger: PT12H without progress
  
  MEDIUM:
    acknowledge: PT4H
    first_action: PT8H
    resolution: PT72H
    further_escalation_trigger: PT36H without progress
  
  LOW:
    acknowledge: PT24H
    first_action: PT48H
    resolution: PT168H   # 7 days
    further_escalation_trigger: PT84H without progress
```

---

## Escalation Handoff Package

When an item escalates to the next tier, a structured handoff package is generated:

```
generate_handoff_package(escalation_item, target_tier):
  return {
    executive_summary: AI-generated 3-sentence summary of situation,
    what_was_tried: chronological list of handling attempts,
    why_it_failed: root cause analysis of each stall/rejection,
    what_is_needed: specific question the higher tier must answer,
    risk_if_unresolved: impact analysis if no decision is reached,
    recommended_options: [{option, pros, cons, recommended: bool}],
    time_pressure: sla_remaining_ms + downstream_impact_if_delayed,
    artifacts: [all relevant documents pre-loaded]
  }
```

---

## Integration Points

| System | Role |
|---|---|
| `human-review/approval-queue-system.md` | Source of SLA-breached requests |
| `case-management/escalation-case-system.md` | Escalation cases feed into this queue |
| `operational-review/escalation-bottleneck-analyzer.md` | Analyzes systemic escalation patterns |
| `approval-operations/approval-workflow-engine.md` | Orchestrates resolution workflow |
| `operational-review/review-sla-monitor.md` | Tracks escalation SLA compliance |
