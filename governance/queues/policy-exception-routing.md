# Policy Exception Routing

## Purpose
Manages routing of requests that fall outside normal policy boundaries. Policy exceptions arise when a legitimate business need conflicts with established policy, when policy coverage has a gap, or when a situation is novel enough that existing policy cannot definitively resolve it. This system ensures exceptions are handled consistently, visibly, and with appropriate authority.

---

## Exception Classification

```yaml
exception_types:
  POLICY_GAP:
    description: No policy exists covering this situation
    examples:
      - novel agent capability not addressed in any policy
      - cross-org collaboration pattern not previously defined
      - new integration type without established access policy
    default_authority: Tier-2 (can establish temporary precedent)
    escalation_if_precedent_setting: Tier-3
  
  POLICY_CONFLICT:
    description: Two or more applicable policies give conflicting guidance
    examples:
      - security policy says deny; business continuity policy says allow
      - data retention policy conflicts with privacy deletion requirement
    default_authority: Tier-3 (policy owner resolution)
    escalation_if_unresolvable: Tier-4 + policy owners
  
  POLICY_OVERRIDE:
    description: Known policy violation requested with business justification
    examples:
      - request to bypass standard approval for time-critical situation
      - emergency access grant outside normal authorization matrix
    default_authority: Tier-4 (explicit override authority)
    constitutional_check: always required
  
  POLICY_WAIVER:
    description: Temporary suspension of a specific policy requirement
    examples:
      - waive SLA requirement during incident response
      - waive audit logging for a short maintenance window
    default_authority: Tier-3 (with time limit)
    max_duration: 72 hours
    renewal: requires fresh approval
  
  POLICY_INTERPRETATION:
    description: Policy exists but its application to this specific case is unclear
    examples:
      - ambiguous scope in policy definition
      - new context not anticipated when policy was written
    default_authority: Tier-2 (interpretive decision)
    precedent_creation: interpretation becomes binding precedent for similar cases
```

---

## Exception Request Schema

```yaml
policy_exception_request:
  exception_id: "PEX-uuid"
  exception_type: [from exception_types]
  
  # What is being requested
  request:
    title: string
    description: string              # what action needs the exception
    business_justification: string   # why it's needed
    urgency: CRITICAL | HIGH | MEDIUM | LOW
    time_constraint: ISO-8601 | null # if time-sensitive
    alternative_considered: string   # what else was tried first
  
  # What policy is involved
  policy_context:
    violated_policies: [policy-id]
    conflicting_policies: [policy-id]  # for POLICY_CONFLICT type
    gap_description: string | null     # for POLICY_GAP type
    interpretation_question: string | null  # for POLICY_INTERPRETATION type
  
  # Scope of exception
  scope:
    applies_to: SINGLE_INSTANCE | SPECIFIC_AGENT | ORG | ALL
    entity_id: string | null      # specific entity if scoped
    duration: PERMANENT | UNTIL_DATE | SINGLE_USE
    expiry: ISO-8601 | null
  
  # Risk
  risk_assessment:
    risk_level: LOW | MEDIUM | HIGH | CRITICAL
    risks: [risk-description]
    mitigations: [mitigation-description]
    residual_risk: string
  
  # Submitter
  submitted_by: agent-id
  submitted_at: ISO-8601
  
  # Routing
  routing:
    required_authority: Tier-2 | Tier-3 | Tier-4
    policy_owners_notified: [agent-id]
    constitutional_check_required: true/false
  
  # Decision
  status: PENDING | UNDER_REVIEW | APPROVED | APPROVED_WITH_CONDITIONS | REJECTED | ESCALATED
  decision:
    decided_by: agent-id | null
    decided_at: ISO-8601 | null
    outcome: string
    conditions: [condition]
    rationale: string
    precedent_created: true/false
    precedent_record_id: string | null
```

---

## Routing Rules by Exception Type

```yaml
routing_matrix:
  POLICY_GAP:
    tier_required: 2
    notify: policy-owner + org-lead
    sla_ms: 86400000   # 24 hours
    constitutional_check: if any constitutional principle could be affected
    post_decision: create policy gap ticket for policy team
  
  POLICY_CONFLICT:
    tier_required: 3
    notify: all conflicting policy owners
    convene: policy_owners_meeting if unresolvable
    sla_ms: 172800000  # 48 hours
    constitutional_check: always
    post_decision: update conflicting policies to remove ambiguity
  
  POLICY_OVERRIDE:
    tier_required: 4
    notify: governance-lead + executive-sponsor
    requires: dual approval (two Tier-4+)
    constitutional_check: mandatory
    sla_ms: 28800000   # 8 hours (urgent by definition)
    audit_level: ENHANCED + permanent retention
    post_decision: flag for policy review if override recurs > 2x
  
  POLICY_WAIVER:
    tier_required: 3
    notify: policy-owner + governance-lead
    max_duration: PT72H
    requires: expiry date at time of approval
    renewal: new request required
    sla_ms: 86400000
    monitoring: automatic expiry enforcement (no manual step needed)
  
  POLICY_INTERPRETATION:
    tier_required: 2
    notify: policy-owner
    creates_precedent: true
    sla_ms: 172800000
    precedent_scope: interpretation applies to all similar future cases
    precedent_record: stored in wiki/policy-interpretations/
```

---

## Precedent Registry

Approved policy exceptions that create precedent are registered:

```yaml
precedent_record:
  precedent_id: "PREC-NNN"
  created_from: exception_id
  exception_type: [type]
  
  precedent_statement:
    applies_when: "CEL expression or description of matching conditions"
    resolution: string               # how this situation is resolved
    authority_confirmed_at: Tier-N
    created_at: ISO-8601
    created_by: agent-id
  
  applicability:
    scope: string
    domain: [domain-string]
    exclusions: [exclusion-description]
  
  review_schedule:
    review_frequency: QUARTERLY | ANNUALLY | NEVER (for clear-cut cases)
    next_review: ISO-8601 | null
    owner: policy-owner-role
  
  usage_tracking:
    times_cited: integer
    last_cited_at: ISO-8601 | null
    cited_in: [exception_id]
```

---

## Automatic Exception Detection

The policy engine automatically detects potential exceptions before they become problems:

```yaml
proactive_detection:
  triggers:
    - agent attempts action → policy engine evaluates → returns EXCEPTION_REQUIRED
    - workflow reaches decision node → governance-aware-branching detects policy conflict
    - artifact creation → policy checker finds gap or conflict
  
  detection_response:
    halt_action: true
    create_exception_request: auto-populated with detected policy context
    notify_submitter: "Your action requires a policy exception. Review and submit."
    estimated_resolution_time: computed from historical exception resolution data
    
  smart_suggestions:
    check_precedent_registry: "A similar exception was approved on [date] — you may reference it."
    suggest_alternative: "This action is possible without an exception if you [alternative approach]."
    flag_constitutional_risk: "This exception type has constitutional implications — constitutional review will be required."
```

---

## Exception Analytics

```yaml
metrics:
  exception_volume:
    by_type, by_org, by_policy, by_day/week/month
    trend: increasing exception rate for a policy → policy may need updating
  
  approval_rates:
    by_type, by_tier, by_org
    consistent_approval: policy gap that gets approved every time → add to policy
    consistent_rejection: common invalid requests → improve detection + rejection UX
  
  time_to_resolution:
    by_type, by_urgency, by_tier
    sla_compliance: % resolved within SLA
  
  precedent_usage:
    most_cited_precedents: top 10
    orphaned_precedents: created but never cited (may be too narrow)
    contested_precedents: cases where precedent was challenged
  
  policy_health_signals:
    high_gap_rate_for_domain: → policy coverage gap
    high_conflict_rate_between_policies: → policy reconciliation needed
    high_override_rate: → policy may be too restrictive
```
