# Policy Language

## Purpose
Defines the enterprise policy definition language (PDL) — the structured syntax used to express all enterprise policies as code. Policies written in PDL are human-readable, machine-evaluable, version-controlled, testable, and auditable. PDL bridges the gap between legal/regulatory obligations and executable enforcement logic, ensuring that compliance requirements are not merely documented but actually enforced at runtime.

---

## Policy Language Design Principles

```yaml
design_principles:
  DECLARATIVE: policies express what should be true, not how to check it — the engine handles evaluation
  COMPOSABLE: policies reference other policies, conditions, and rule sets; no copy-paste duplication
  TESTABLE: every policy can be unit-tested against a set of test cases (see policy-testing-framework.md)
  VERSIONABLE: policies are versioned artifacts; changes are tracked in policy-registry.md
  EXPLAINABLE: every rule must have a human-readable description usable in explain mode
  OBLIGATION_TRACED: every policy must reference the obligation(s) or principle(s) it enforces
  EFFECT_EXPLICIT: every rule declares its effect (ALLOW/DENY/REQUIRE_APPROVAL/CONDITION); no implicit defaults
```

---

## Policy File Structure

```yaml
# ─────────────────────────────────────────────────────────────
# POLICY FILE STRUCTURE — all policies must follow this schema
# ─────────────────────────────────────────────────────────────

policy:
  policy_id: "POL-{domain}-{seq}"               # globally unique
  policy_name: string                            # short, descriptive name
  version: semver                                # e.g., "1.3.0"
  status: DRAFT | ACTIVE | DEPRECATED | ARCHIVED
  
  classification:
    domain: string                               # from compliance-taxonomy.md domains
    category: CONSTITUTIONAL | REGULATORY_COMPLIANCE | SECURITY | AI_GOVERNANCE | OPERATIONAL | DEFAULT
    priority: int                                # 1 (highest) to 100 (lowest); determines conflict resolution
    is_hard_deny_capable: boolean               # can this policy issue HARD_DENY? (constitutional only)
  
  traceability:
    obligation_ids: [obligation_id]              # obligations this policy enforces
    control_ids: [control_id]                    # controls this policy implements
    regulation_ids: [regulation_id]              # regulations this policy satisfies
    parent_policy_ids: [policy_id]               # if this policy specializes or extends another
    supersedes: [policy_id]                      # policies this version replaces
  
  governance:
    authored_by: agent_id | human_id
    authored_at: ISO-8601
    approved_by: agent_id | human_id
    approved_at: ISO-8601
    review_date: ISO-8601                        # when this policy must be reviewed
    owner: agent_id | human_id                   # accountable for this policy
  
  scope:
    applies_to_subjects: [subject_filter]        # who does this policy apply to?
    applies_to_resources: [resource_filter]      # what resources does it govern?
    applies_to_actions: [action_filter]          # which actions does it govern?
    applies_to_environments: [PRODUCTION | STAGING | DEVELOPMENT | TEST]
    excludes: [exclusion]                        # explicitly excluded subjects/resources/actions
  
  rules: [rule]                                  # list of policy rules (see Rule Schema below)
  
  metadata:
    tags: [string]
    description: string                          # full policy description for documentation
    policy_hash: SHA-256                         # hash of all fields above; updated on every change
```

---

## Rule Schema

```yaml
rule:
  rule_id: "RULE-{policy_id}-{seq}"             # e.g., RULE-POL-SEC-007-03
  rule_name: string
  description: string                            # plain-language explanation (used in explain mode)
  priority: int                                  # within the policy; lower = evaluated first
  
  condition:
    # Conditions use a structured expression language (see Condition Expressions below)
    # ALL conditions must be true for the rule to match
    all_of: [condition_expression]               # AND logic
    any_of: [condition_expression]               # OR logic (at least one must be true)
    none_of: [condition_expression]              # NOT logic
  
  effect:
    type: ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL | AUDIT_ONLY
    
    if DENY:
      hard_deny: boolean                         # true = cannot be overridden
      reason_template: string                    # template for human-readable denial reason
    
    if ALLOW_WITH_CONDITIONS:
      conditions: [runtime_condition]            # conditions that must hold during execution
      monitoring_interval: duration              # how often conditions are verified
      violation_action: REVOKE | ALERT | ESCALATE
    
    if REQUIRE_APPROVAL:
      approvers: [approver_spec]                 # who must approve
      quorum: int                                # minimum approvals required
      timeout: duration                          # request expiry if not approved
      bypass_allowed: boolean                    # can emergency authority bypass this?
    
    if AUDIT_ONLY:
      log_level: INFO | WARN | ALERT
      alert_recipients: [agent_id | human_id]
      note: "AUDIT_ONLY does not allow or deny; it only records. Use when observing without blocking."
  
  enforcement_context:
    enforce_in_environments: [PRODUCTION | STAGING]   # where this rule is active
    test_mode_behavior: LOG_ONLY | ENFORCE_FULLY | SKIP
    applicable_from: ISO-8601                    # rule activation date
    applicable_until: ISO-8601 | null            # null = no expiry
```

---

## Condition Expression Language

```yaml
condition_expressions:
  # Conditions are structured expressions referencing fields from the evaluation_request.
  # All field paths use dot notation. Values are type-matched.
  
  comparison_operators:
    eq: equals                # subject.actor_tier eq 3
    neq: not equals           # resource.classification neq "PUBLIC"
    gt: greater than          # subject.trust_scores.AI_GOVERNANCE gt 0.70
    lt: less than
    gte: greater than or equal
    lte: less than or equal
    in: set membership        # action.action_category in [DELEGATE, APPROVE]
    not_in: not in set
    contains: list contains   # subject.actor_capabilities contains "CAP-GOV-001"
    matches: regex match      # resource.resource_id matches "CTL-AI-.*"
    is_null: field is null
    is_not_null: field is not null
  
  reference_fields:
    # Subject fields
    "subject.actor_id"
    "subject.actor_type"
    "subject.actor_tier"
    "subject.actor_trust_scores.{domain}"        # e.g., subject.actor_trust_scores.AI_GOVERNANCE
    "subject.actor_capabilities"                 # list
    "subject.actor_roles"                        # list
    
    # Action fields
    "action.action_type"
    "action.action_category"
    "action.reversibility"
    "action.blast_radius"
    
    # Resource fields
    "resource.resource_type"
    "resource.resource_id"
    "resource.resource_classification"
    "resource.resource_domain"
    
    # Context fields
    "context.current_risk_level"
    "context.environment"
    "context.delegation_chain"                   # list; supports length() and contains()
    "context.delegation_chain.length"
    "context.active_exceptions"                  # list of active exception IDs
    "context.triggering_obligation_ids"
    "context.timestamp.hour"                     # UTC hour (0-23)
    "context.timestamp.day_of_week"              # MON/TUE/WED/THU/FRI/SAT/SUN
  
  function_calls:
    "length(list)"                               # length of a list field
    "contains_any(list, values)"                 # any value from values is in list
    "contains_all(list, values)"                 # all values from values are in list
    "lookup_risk_score(resource_id)"             # live risk score from enterprise-risk-register
    "lookup_trust_score(actor_id, domain)"       # live trust score from trust-propagation-engine
    "is_under_legal_hold(resource_id)"           # checks legal hold registry
    "has_active_exception(control_id)"           # checks exception-management registry
    "time_since_last_approval(actor_id)"         # hours since actor's last governance approval
  
  expression_examples:
    # Simple comparison
    - field: "action.blast_radius"
      op: eq
      value: "CRITICAL"
    
    # Trust score threshold
    - field: "subject.actor_trust_scores.AI_GOVERNANCE"
      op: gte
      value: 0.75
    
    # Delegation chain depth
    - field: "context.delegation_chain"
      op: "length_lte"
      value: 4
    
    # Environment scoping
    - field: "context.environment"
      op: in
      value: ["PRODUCTION", "STAGING"]
    
    # Function call condition
    - function: "lookup_risk_score"
      args: ["resource.resource_id"]
      op: gte
      value: 15
      # i.e., resource is currently rated CRITICAL risk
```

---

## Policy Examples

```yaml
# ─────────────────────────────────────────────────────────────
# EXAMPLE 1: Authority tier enforcement for irreversible actions
# ─────────────────────────────────────────────────────────────
policy:
  policy_id: POL-SEC-007
  policy_name: irreversible_action_authority_ceiling
  version: "2.1.0"
  status: ACTIVE
  classification:
    domain: INFORMATION_SECURITY
    category: SECURITY
    priority: 20
  traceability:
    obligation_ids: [OBL-ISO27001-012]
    control_ids: [CTL-SEC-001]
  rules:
    - rule_id: RULE-POL-SEC-007-01
      rule_name: critical_blast_radius_requires_tier4
      description: "Irreversible actions with CRITICAL blast radius require Tier-4+ authority."
      condition:
        all_of:
          - {field: "action.reversibility", op: eq, value: "IRREVERSIBLE"}
          - {field: "action.blast_radius", op: eq, value: "CRITICAL"}
          - {field: "subject.actor_tier", op: lt, value: 4}
      effect:
        type: DENY
        hard_deny: false
        reason_template: "CRITICAL blast radius irreversible actions require Tier-4+ authority. Actor tier: {subject.actor_tier}."
    
    - rule_id: RULE-POL-SEC-007-02
      rule_name: high_blast_radius_requires_tier3
      description: "Irreversible HIGH blast radius actions require Tier-3+ authority."
      condition:
        all_of:
          - {field: "action.reversibility", op: eq, value: "IRREVERSIBLE"}
          - {field: "action.blast_radius", op: eq, value: "HIGH"}
          - {field: "subject.actor_tier", op: lt, value: 3}
      effect:
        type: REQUIRE_APPROVAL
        approvers: [{tier_minimum: 3}]
        quorum: 1
        timeout: "4h"
        bypass_allowed: false

# ─────────────────────────────────────────────────────────────
# EXAMPLE 2: AI governance human oversight enforcement
# ─────────────────────────────────────────────────────────────
policy:
  policy_id: POL-AI-003
  policy_name: high_risk_ai_human_oversight_required
  version: "1.0.0"
  status: ACTIVE
  classification:
    domain: AI_GOVERNANCE
    category: REGULATORY_COMPLIANCE
    priority: 5
    is_hard_deny_capable: true
  traceability:
    obligation_ids: [OBL-EUAIACT-014, OBL-EUAIACT-029]
    control_ids: [CTL-AI-004]
    regulation_ids: [REG-EUAIACT-2024]
  rules:
    - rule_id: RULE-POL-AI-003-01
      rule_name: high_risk_ai_decision_requires_human_review
      description: "High-risk AI system decisions must have an available human review gate before execution."
      condition:
        all_of:
          - {field: "resource.resource_domain", op: eq, value: "AI_GOVERNANCE"}
          - {field: "action.action_type", op: eq, value: "AI_SYSTEM_DECISION"}
          - {function: "lookup_risk_score", args: ["resource.resource_id"], op: gte, value: 12}
          # resource risk >= 12 = HIGH risk AI system
      effect:
        type: ALLOW_WITH_CONDITIONS
        conditions:
          - condition_id: COND-HUMAN-REVIEW-AVAILABLE
            description: "Human review gate must be available and monitoring this decision"
            check: "human_review_gate_active(resource.resource_id)"
        violation_action: REVOKE

# ─────────────────────────────────────────────────────────────
# EXAMPLE 3: Constitutional hard deny — prohibited AI practices
# ─────────────────────────────────────────────────────────────
policy:
  policy_id: POL-CONST-001
  policy_name: prohibited_ai_practices_absolute_ban
  version: "1.0.0"
  status: ACTIVE
  classification:
    domain: AI_GOVERNANCE
    category: CONSTITUTIONAL
    priority: 1
    is_hard_deny_capable: true
  rules:
    - rule_id: RULE-POL-CONST-001-01
      rule_name: eu_ai_act_prohibited_practices_hard_deny
      description: "EU AI Act Article 5 prohibited practices are unconditionally forbidden. No exception, approval, or emergency authority can override this."
      condition:
        any_of:
          - {field: "action.action_type", op: in, value: ["SUBLIMINAL_MANIPULATION", "SOCIAL_SCORING", "REALTIME_BIOMETRIC_PUBLIC_SPACE", "EMOTION_RECOGNITION_WORKPLACE", "PREDICTIVE_POLICING_INDIVIDUAL"]}
      effect:
        type: DENY
        hard_deny: true
        reason_template: "This action is a prohibited AI practice under EU AI Act Article 5. This denial cannot be overridden by any authority level, exception, or approval."
```

---

## Policy Versioning and Change Protocol

```yaml
versioning:
  version_format: MAJOR.MINOR.PATCH
    MAJOR: breaking change to rule logic or effect type
    MINOR: new rules added; existing rules made more permissive
    PATCH: documentation, metadata, description changes only
  
  change_protocol:
    PATCH_changes: author + policy owner approval; effective immediately
    MINOR_changes: author + policy owner + domain compliance lead; effective after 24h (new version staged)
    MAJOR_changes: full policy governance approval (see policy-registry.md governance); effective after 7-day review
    CONSTITUTIONAL_policies: board-level approval required; 30-day review period minimum
  
  staged_deployment:
    staging_period: new policy version runs in parallel with old version (AUDIT_ONLY effect) before activation
    comparison: decision divergence between old and new versions logged for review
    rollback: any version can be rolled back to prior version within 7 days of activation
    no_retroactive_changes: policy changes are never applied retroactively to past decisions
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Evaluates policies written in this language |
| `policy-as-code/policy-compiler.md` | Compiles PDL to optimized evaluation trees |
| `policy-as-code/policy-testing-framework.md` | Tests policies written in this language |
| `policy-as-code/policy-registry.md` | Stores and versions policies written in PDL |
| `governance-policies/policy-lineage-tracker.md` | Tracks provenance of each policy version |
| `compliance-framework/compliance-model.md` | Obligation/control IDs referenced in traceability |
| `constitution/enterprise-constitution.md` | Constitutional principles translated to CONSTITUTIONAL policies |
