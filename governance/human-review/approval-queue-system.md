# Approval Queue System

## Purpose
Manages all human approval requests across the enterprise — receiving, prioritizing, routing, tracking, and completing approval tasks. This is the primary interface between automated workflow execution and human decision authority. Every governance-gated action flows through this system.

---

## Queue Architecture

```
Approval Request Sources
├── workflow-modeling/orchestration-dag-system.md  (User Task nodes)
├── decision-models/governance-aware-branching.md  (authority gates)
├── governance-queues/governance-triggered-reviews.md
└── governance-queues/low-confidence-routing.md

        ↓ submit_approval_request()

[Approval Queue Ingestion]
    ├── [Schema Validator]
    ├── [Priority Scorer]       → assigns priority score 0–1000
    ├── [Tier Router]           → assigns to correct tier queue
    └── [Duplicate Detector]   → deduplicates correlated requests

        ↓

[Tier Queues]
    ├── TIER-1 queue  → any Tier-1+ approver
    ├── TIER-2 queue  → any Tier-2+ approver
    ├── TIER-3 queue  → any Tier-3+ approver
    ├── TIER-4 queue  → designated Tier-4 principals
    └── TIER-5 queue  → executive-only

        ↓

[Assignment Engine]            → approval-operations/approval-workflow-engine.md
[SLA Monitor]                  → operational-review/review-sla-monitor.md
[Notification Service]         → notifies assigned approvers
```

---

## Approval Request Schema

```yaml
approval_request:
  request_id: "APQ-uuid"
  
  # What needs approval
  subject:
    type: WORKFLOW_STEP | ARTIFACT | DECISION | POLICY_EXCEPTION | OVERRIDE | CASE_ACTION
    id: string                    # entity being approved
    title: string                 # human-readable summary
    description: string           # what is being requested
    artifact_refs: [artifact-id]  # supporting documents
    risk_level: LOW | MEDIUM | HIGH | CRITICAL
    reversible: true/false
  
  # Why it needs approval
  trigger:
    source: WORKFLOW | GOVERNANCE_BRANCH | CONFIDENCE_THRESHOLD | POLICY_EXCEPTION | MANUAL
    workflow_instance_id: string | null
    node_id: string | null
    trigger_reason: string        # human-readable explanation of why review is required
  
  # Who can approve
  routing:
    tier_required: 1–5
    role_required: string | null  # null = any approver at required tier
    specific_approvers: [agent-id] | null   # null = pool routing
    exclude_approvers: [agent-id]           # e.g., exclude submitter
  
  # When it needs approval
  sla:
    submitted_at: ISO-8601
    deadline: ISO-8601
    priority_score: 0–1000        # higher = more urgent
    priority_basis: [reason-strings]
  
  # Context for the approver
  context_package:
    ai_analysis: string | null    # AI pre-analysis if available
    confidence_score: float | null
    similar_past_decisions: [{request_id, decision, outcome}]
    relevant_policies: [policy-ref]
    constitutional_pre_check: PASS | CONDITIONAL | FAIL | NOT_RUN
    risk_assessment: string
  
  # State
  status: PENDING | ASSIGNED | UNDER_REVIEW | APPROVED | REJECTED | NEEDS_INFO | ESCALATED | EXPIRED
  assigned_to: agent-id | null
  assigned_at: ISO-8601 | null
  
  decision:
    decided_by: agent-id | null
    decided_at: ISO-8601 | null
    outcome: APPROVED | REJECTED | NEEDS_INFO | DELEGATED
    rationale: string | null
    conditions: [condition-string]
    signature: "Ed25519 | null"
```

---

## Priority Scoring

Priority score (0–1000) determines queue position within a tier:

```yaml
priority_factors:
  base_by_risk:
    CRITICAL: 600
    HIGH: 400
    MEDIUM: 200
    LOW: 50
  
  modifiers:
    workflow_sla_remaining:
      # Percentage of workflow SLA remaining
      < 10%:   +300
      10–25%:  +200
      25–50%:  +100
      > 50%:   +0
    
    blocking_downstream_count:
      # Number of workflow steps blocked by this approval
      >= 10: +150
      5–9:   +100
      2–4:   +50
      1:     +25
      0:     +0
    
    escalation_history:
      already_escalated_once: +75
      already_escalated_twice: +150
    
    constitutional_risk:
      constitutional_check == CONDITIONAL: +100
      constitutional_check == FAIL: +400   # auto-escalates anyway
    
    submitter_tier:
      tier >= 4: +50   # senior principals' requests move faster
    
    age_penalty:
      # Increase priority as request ages toward SLA
      formula: "((now - submitted_at) / sla_duration) * 100"

  score = base_by_risk + sum(applicable_modifiers)
  score = min(score, 1000)
```

---

## Queue Management

### Queue State
```yaml
queue_state:
  "TIER-N":
    total_pending: integer
    total_assigned: integer
    oldest_pending_age_ms: integer
    avg_wait_time_ms: integer
    available_approvers: integer
    sla_at_risk_count: integer
    throughput_per_hour: float
```

### Assignment Policies

```yaml
assignment_policies:
  ROUND_ROBIN:
    description: Rotate evenly across available approvers
    use_when: even workload distribution needed
  
  LEAST_LOADED:
    description: Assign to approver with fewest open requests
    use_when: variable request complexity
  
  EXPERTISE_MATCH:
    description: Match request domain to approver domain expertise
    use_when: specialized review (security, constitutional, financial)
    matching_field: subject.type + context_package.relevant_policies
  
  STICKY:
    description: Same entity always reviewed by same approver
    use_when: continuity matters (long-running cases, multi-step reviews)
    sticky_key: subject.id
  
  PRIORITY_WEIGHTED:
    description: Assign highest-priority items to most experienced approvers
    use_when: critical-tier queue
    experience_proxy: approver.tier + approver.decision_count
```

### Queue Overflow
```yaml
overflow_handling:
  trigger: available_approvers == 0 AND pending_count > 0
  
  step_1:
    action: notify_tier_lead_of_queue_backlog
    threshold: pending_count > 10
  
  step_2:
    action: expand_approver_pool_by_one_tier_above
    condition: oldest_pending > sla * 0.5
    note: Tier-N items can be approved by Tier-(N+1) principals
  
  step_3:
    action: create_resource_contention_escalation_case
    condition: oldest_pending > sla * 0.75
  
  step_4:
    action: emergency_approver_pool_activation
    condition: oldest_pending > sla * 0.90
    required_authorization: Tier-4
```

---

## Approval Context Package Assembly

When a request enters the queue, the system assembles a context package for the approver:

```
assemble_context_package(request):
  
  # 1. AI pre-analysis (if available)
  ai_analysis = invoke_agent(
    capability: "approval_context_analysis",
    inputs: {subject: request.subject, history: similar_past_decisions}
  )
  
  # 2. Similar past decisions
  similar = query_decision_audit_trail(
    subject_type: request.subject.type,
    risk_level: request.subject.risk_level,
    limit: 5,
    sort_by: similarity_score
  )
  
  # 3. Constitutional pre-check (runs asynchronously, result available when approver opens)
  if request.routing.tier_required >= 2:
    constitutional_result = PROC-GOV-005.evaluate(request.subject)
  
  # 4. Relevant policies
  policies = policy-routing-engine.get_applicable_policies(request)
  
  # 5. Risk assessment
  risk = DM-HEALTH-001 + governance-aware-branching.governance_state_oracle()
  
  return assembled_package
```

---

## Notification Templates

```yaml
notifications:
  NEW_ASSIGNMENT:
    channel: in-app + email
    urgency_mapping:
      priority >= 800: immediate
      priority >= 500: within 15 minutes
      priority >= 200: within 1 hour
      default: within 4 hours
    content: |
      You have a new approval request requiring your attention.
      Subject: {request.subject.title}
      Risk: {request.subject.risk_level}
      Deadline: {request.sla.deadline}
      AI Analysis: {context_package.ai_analysis}
  
  SLA_WARNING_80_PCT:
    channel: in-app + email
    urgency: immediate
  
  SLA_WARNING_95_PCT:
    channel: in-app + email + pagerduty
    urgency: immediate
    cc: approver_manager_role
  
  SLA_BREACH:
    channel: all channels
    urgency: critical
    action: auto-escalate
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-dag-system.md` | Submits User Task nodes as approval requests; receives decisions |
| `governance-queues/governance-triggered-reviews.md` | Submits governance-triggered reviews |
| `approval-operations/approval-workflow-engine.md` | Manages end-to-end approval workflow |
| `operational-review/review-sla-monitor.md` | Monitors SLA compliance per request |
| `process-governance/decision-audit-trail.md` | All approval decisions logged |
| `process-governance/workflow-auditability-system.md` | APPROVAL_REQUESTED + APPROVAL_GRANTED/REJECTED events |
