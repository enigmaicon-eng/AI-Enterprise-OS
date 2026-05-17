# Escalation Case System

## Purpose
Manages escalation cases — situations that have exceeded the resolution capacity of their origin context and must be elevated to higher authority, more specialized resources, or broader organizational visibility. Escalation is not failure: it is the correct response to situations that outgrow their handling context.

---

## Escalation Taxonomy

| Type | Origin | Escalation Trigger | Default Route |
|---|---|---|---|
| `SLA_BREACH` | Any workflow or case | SLA > 100% elapsed | Next tier above origin |
| `AUTHORITY_EXCEEDED` | Any decision | Required tier > available tier | Tier-N owner |
| `CONSTITUTIONAL_VIOLATION` | Any context | Constitutional check FAIL | Governance lead + Tier-4 |
| `COLLABORATION_BREAKDOWN` | Collaborative cases | 3+ unresolved disagreements | Governance lead |
| `RESOURCE_CONTENTION` | Orchestration | Agent/resource unavailable > threshold | Delivery lead |
| `SCOPE_EXPANSION` | Adaptive cases | Case scope significantly beyond mandate | Process owner + Tier-3 |
| `GOVERNANCE_TIMEOUT` | Governance processes | Approval SLA breached | Executive tier |
| `INCIDENT_OVERFLOW` | Incident cases | Incident exceeds org resolution capacity | Incident commander |
| `BUDGET_EXCEEDED` | Any case | Cost > approved budget | Finance + sponsor |
| `EXTERNAL_DEPENDENCY` | Integration cases | External system failure blocking progress | Integration lead |

---

## Escalation Case Schema

```yaml
escalation_case:
  escalation_id: "esc-uuid"
  escalation_type: [type from taxonomy above]
  severity: CRITICAL | HIGH | MEDIUM | LOW
  
  # Origin
  origin:
    case_id: "string | null"
    workflow_instance_id: "string | null"
    process_id: "string | null"
    org: "string"
    context_summary: "human-readable description of what happened"
  
  # Evidence package (auto-assembled)
  evidence:
    timeline: [event-log entries from origin]
    sla_data: {target, actual, breach_percentage}
    governance_approvals: [approval-records]
    decision_history: [decision-records]
    artifacts: [artifact-refs]
    constitutional_violations: [violation-records] | null
  
  # Routing
  routing:
    escalation_tier: 1–5
    assigned_to_role: "role string"
    assigned_to_agent_id: "agent-id | null"
    escalated_by: "agent-id"
    escalated_at: ISO-8601
    sla:
      tier_1: PT1H      # 1 hour
      tier_2: PT4H      # 4 hours
      tier_3: PT24H     # 24 hours
      tier_4: PT72H     # 72 hours
      tier_5: PT168H    # 7 days
    deadline: ISO-8601
  
  # Resolution
  status: OPEN | ACKNOWLEDGED | IN_RESOLUTION | RESOLVED | CLOSED | FURTHER_ESCALATED
  resolution:
    resolved_by: "agent-id | null"
    resolved_at: ISO-8601 | null
    resolution_type: RESOLVED | DISMISSED | DELEGATED | POLICY_CHANGED | FURTHER_ESCALATED
    resolution_summary: string
    actions_taken: [action-record]
    preventive_measures: [measure-description]
  
  # Escalation chain (if this escalation itself escalated)
  parent_escalation_id: "esc-id | null"
  child_escalation_id: "esc-id | null"
```

---

## Escalation Routing Rules

```yaml
routing_matrix:
  SLA_BREACH:
    severity_from_breach_pct:
      < 125%:   LOW    → role: original_task_owner_manager
      125–150%: MEDIUM → role: org_delivery_lead
      150–200%: HIGH   → role: executive_delivery_sponsor
      > 200%:   CRITICAL → role: executive_sponsor + governance_lead
  
  CONSTITUTIONAL_VIOLATION:
    always: CRITICAL
    immediate_notify: [governance_lead, Tier4_principal, executive_sponsor]
    suspend_origin: true
    constitutional_incident: auto_create_PROC-INCIDENT-001
  
  AUTHORITY_EXCEEDED:
    route_to_tier: required_tier
    if required_tier > max_available_tier:
      route_to: executive_sponsor
      flag_for_policy_review: true
  
  GOVERNANCE_TIMEOUT:
    severity: HIGH
    route_to: governance_lead
    cc: executive_sponsor
    trigger_policy_review: true if recurrence_count > 2
  
  INCIDENT_OVERFLOW:
    severity: map from incident.severity (P1→CRITICAL, P2→HIGH, P3→MEDIUM)
    route_to: incident_commander
    if no_incident_commander:
      route_to: delivery_lead + governance_lead
```

---

## Escalation SLA Matrix

| Severity | Acknowledge By | First Response By | Resolution Target |
|---|---|---|---|
| CRITICAL | 15 minutes | 30 minutes | 4 hours |
| HIGH | 1 hour | 2 hours | 24 hours |
| MEDIUM | 4 hours | 8 hours | 72 hours |
| LOW | 24 hours | 48 hours | 7 days |

SLA breach on the escalation case itself triggers further escalation (tier + 1), maximum level 5.

---

## Re-Escalation Protocol

```
on_escalation_sla_breach(escalation_case):
  if escalation_case.routing.escalation_tier >= 5:
    # Cannot escalate further — force notify executive board
    force_notify_all_tier5()
    create_governance_incident()
    return
  
  child_escalation = create_escalation_case(
    escalation_type: escalation_case.escalation_type,
    severity: escalate_severity(escalation_case.severity),
    origin: escalation_case as context,
    routing: {
      escalation_tier: escalation_case.routing.escalation_tier + 1,
      assigned_to_role: tier_n_role(tier + 1)
    },
    parent_escalation_id: escalation_case.escalation_id
  )
  
  escalation_case.status = FURTHER_ESCALATED
  escalation_case.child_escalation_id = child_escalation.escalation_id
```

---

## Evidence Assembly

Auto-assembled when escalation case is created:

```
assemble_evidence(origin):
  evidence = {}
  
  if origin.case_id:
    evidence.timeline = load_case_event_log(origin.case_id, last=100)
    evidence.participants = load_case_participants(origin.case_id)
    evidence.decisions = load_case_decisions(origin.case_id)
  
  if origin.workflow_instance_id:
    evidence.dag_trace = load_dag_execution_trace(origin.workflow_instance_id)
    evidence.node_states = load_all_node_states(origin.workflow_instance_id)
    evidence.governance_approvals = load_approvals(origin.workflow_instance_id)
  
  evidence.sla_data = compute_sla_status(origin)
  evidence.constitutional_violations = load_violations_if_any(origin)
  
  return evidence
```

---

## Post-Resolution Requirements

After every escalation case closes:

```yaml
post_resolution:
  required_actions:
    - resolution_summary: written by resolver (> 100 characters)
    - root_cause: identified (human or AI)
    - preventive_measures: at least 1 specified
    - contributing_factors: documented
  
  automatic_actions:
    - update_sla_targets: if SLA was structurally unachievable
    - create_wiki_entry: if novel escalation type or novel resolution
    - update_planning_rules: if adaptive case planning contributed
    - trigger_postmortem: if severity was CRITICAL
  
  governance_report:
    recipients: [governance_lead, org_delivery_lead, escalation_resolvers]
    frequency: on_close + monthly_aggregate
```
