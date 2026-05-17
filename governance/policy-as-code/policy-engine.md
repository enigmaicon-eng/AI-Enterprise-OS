# Policy Engine

## Purpose
The core evaluation runtime for all enterprise policies. Every consequential action in the operating system — task assignments, delegation grants, data access, AI decisions, resource allocations, escalations — passes through the policy engine for evaluation before execution. The engine is the single point of policy truth: deterministic, auditable, and fast enough to gate real-time orchestration decisions without becoming a bottleneck.

---

## Engine Architecture

```
Policy Evaluation Request
        ↓
[Request Normalization]      → parse input; extract subject, action, resource, context
        ↓
[Policy Discovery]           → locate all policies applicable to this request
        ↓
[Context Enrichment]         → augment request with live context (trust scores, risk levels, agent state)
        ↓
[Policy Compilation Cache]   → retrieve compiled policy tree (hot path) or compile fresh (cold path)
        ↓
[Evaluation Engine]          → evaluate each applicable policy; compute intermediate results
        ↓
[Effect Combination]         → combine ALLOW/DENY/REQUIRE_APPROVAL effects per combination strategy
        ↓
[Decision]                   → final decision: ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL
        ↓
[Decision Record]            → write immutable decision record to policy audit trail
        ↓
[Response]                   → return decision + explanation + applicable_policy_ids to caller
```

---

## Evaluation Request Schema

```yaml
policy_evaluation_request:
  request_id: "POLREQ-{timestamp_ms}-{random_6char}"
  
  subject:
    actor_id: agent_id | human_id | system_id
    actor_type: AGENT | HUMAN | SYSTEM
    actor_tier: int (1-5) | null
    actor_trust_scores: {domain: score}          # from trust-propagation-engine.md
    actor_capabilities: [capability_id]           # current verified capabilities
    actor_roles: [role_id]
  
  action:
    action_type: string                           # from action-type-registry in audit-trail-governance.md
    action_category: READ | WRITE | EXECUTE | DELEGATE | APPROVE | ESCALATE | CONFIGURE | DECOMMISSION
    intended_effect: string                       # what will happen if allowed?
    reversibility: REVERSIBLE | PARTIALLY_REVERSIBLE | IRREVERSIBLE
    blast_radius: LOW | MEDIUM | HIGH | CRITICAL  # impact scope if executed
  
  resource:
    resource_type: string                         # TASK | AGENT | DATA | SYSTEM | POLICY | APPROVAL | ...
    resource_id: string
    resource_classification: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED | TOP_SECRET
    resource_owner: agent_id | human_id | null
    resource_domain: string                       # compliance domain of the resource
  
  context:
    timestamp: ISO-8601
    session_id: string
    workflow_id: string | null
    delegation_chain: [agent_id | human_id]       # current delegation chain
    active_exceptions: [exception_id]             # active exceptions that may affect policy
    current_risk_level: LOW | MEDIUM | HIGH | CRITICAL  # enterprise-wide risk level
    environment: PRODUCTION | STAGING | DEVELOPMENT | TEST
    triggering_obligation_ids: [obligation_id]    # what regulatory obligations does this relate to?
  
  evaluation_options:
    explain: boolean                              # include explanation of decision in response
    dry_run: boolean                              # evaluate but do not write decision record
    policy_ids_override: [policy_id] | null       # force evaluation against specific policies (for testing only)
    max_evaluation_time_ms: int                   # abort if evaluation exceeds this
```

---

## Evaluation Decision Schema

```yaml
policy_decision:
  decision_id: "POLDEC-{request_id}"
  request_id: string
  
  verdict:
    decision: ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL
    
    if ALLOW:
      allowed: true
      effective_permissions: [permission]         # specific permissions granted
      validity_window: {valid_until: ISO-8601} | null
    
    if DENY:
      allowed: false
      deny_reason: string                         # human-readable reason
      deny_rule_id: string                        # the specific rule that denied
      is_hard_deny: boolean                       # true = cannot be overridden by any exception or approval
      appeal_path: string | null                  # if appealable, how
    
    if ALLOW_WITH_CONDITIONS:
      allowed: true
      conditions: [condition]                     # what must be true during/after execution
      condition_monitoring: string                # how conditions are verified
      violation_consequence: string               # what happens if condition is violated
    
    if REQUIRE_APPROVAL:
      allowed: false (pending approval)
      required_approvers: [agent_id | human_id]  # who must approve
      approval_quorum: int                        # how many approvers needed
      approval_timeout: duration                  # after which request expires
      pre_approval_permitted_actions: [string]    # what the requester can do while awaiting approval
  
  evaluation_details:
    policies_evaluated: [policy_id]               # all policies checked
    policies_matched: [policy_id]                 # policies with matching conditions
    policies_determining: [policy_id]             # policies that drove the decision
    evaluation_duration_ms: int
    explanation: string | null                    # if explain=true in request
  
  integrity:
    decision_hash: SHA-256                        # hash of all decision fields
    prior_decision_hash: SHA-256                  # hash chain with prior decision record
    engine_signature: Ed25519                     # signed by policy engine
  
  metadata:
    decided_at: ISO-8601
    engine_version: string
    policies_version: string                      # version of policy set at time of decision
    dry_run: boolean
```

---

## Effect Combination Strategy

```yaml
effect_combination:
  strategy: DENY_OVERRIDES
  # If ANY applicable policy produces DENY, the result is DENY regardless of ALLOW policies.
  # This is the industry-standard default for enterprise policy systems.
  
  combination_rules:
    HARD_DENY_always_wins:
      description: HARD_DENY from any policy (constitutional, prohibited practices, etc.) cannot be overridden
      even_overrides: approved exceptions, Tier-5 authority, emergency authority
      examples: [prohibited_AI_practices, constitutional_violations, critical_human_oversight_removal]
    
    SOFT_DENY_can_be_escalated:
      description: SOFT_DENY can be converted to REQUIRE_APPROVAL or ALLOW_WITH_CONDITIONS by a higher-authority policy
      escalation_path: higher-tier approval can unlock SOFT_DENY actions
    
    REQUIRE_APPROVAL_merges:
      description: if multiple policies each require approval, the union of required approvers is computed
      quorum: max of all required quorums (most restrictive wins)
    
    ALLOW_WITH_CONDITIONS_merges:
      description: all conditions from all matching policies are AND-combined
      violation: any condition violation triggers enforcement from the most restrictive matching policy
    
    CONFLICT_resolution:
      priority_order: [CONSTITUTIONAL, REGULATORY_COMPLIANCE, SECURITY, AI_GOVERNANCE, OPERATIONAL, DEFAULT]
      within_same_priority: deny_overrides_allow
      logging: all conflicts logged with resolution rationale
```

---

## Performance Requirements

```yaml
performance:
  latency_targets:
    HOT_PATH (cached, no enrichment required): p50 < 5ms; p99 < 20ms
    STANDARD (cached policy, live context enrichment): p50 < 25ms; p99 < 100ms
    COLD_PATH (policy compilation required): p50 < 150ms; p99 < 500ms
    BATCH_evaluation (multiple requests, same context): p99 < 200ms total for 10 requests
  
  caching:
    compiled_policy_cache: LRU; max 500 compiled policies; TTL 300s (invalidated on policy update)
    context_enrichment_cache: per-session trust scores cached for 60s
    decision_cache: ALLOW decisions for identical {subject, action, resource} cached 30s
    decision_cache_exclusions: [DENY decisions (never cached), REQUIRE_APPROVAL (never cached), IRREVERSIBLE actions (never cached)]
  
  availability:
    target: 99.99% (policy engine failure = enterprise operations halt)
    fallback: SAFE_MODE — deny all non-cached decisions and queue for re-evaluation
    circuit_breaker: if evaluation error rate > 1% in 60s → switch to SAFE_MODE; page on-call
    degradation_policy: DENY_BY_DEFAULT (never ALLOW_BY_DEFAULT during degraded operation)
  
  scalability:
    horizontal: policy engine instances are stateless; scale horizontally
    policy_storage: separate from engine (policy-registry.md); read replicated
    decision_audit_log: async write (non-blocking); bounded buffer with overflow protection
```

---

## Explain Mode

```yaml
explain_mode:
  purpose: |
    Explain mode returns a human-readable explanation of how the decision was reached.
    Used for: debugging policy behavior, audit responses, human-review gate justifications,
    governance reporting, and policy development.
  
  explanation_format:
    decision: string (ALLOW | DENY | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL)
    decision_reason: string (1-2 sentence plain language reason)
    determining_policies: [{policy_id, policy_name, rule_id, rule_name, effect, matched_because}]
    suppressed_allows: [{policy_id, policy_name, effect: ALLOW, suppressed_by: policy_id}]
    context_factors_used: [{factor_name, factor_value, effect_on_decision}]
    appeal_information: string | null
  
  example_explanation:
    decision: DENY
    decision_reason: "This action requires CRITICAL blast radius authority. The actor (agent-analytics-003, Tier 2) does not hold the required Tier-4+ authority for irreversible actions with CRITICAL blast radius."
    determining_policies:
      - policy_id: POL-SEC-007
        rule_id: RULE-SEC-007-03
        rule_name: blast_radius_authority_ceiling
        effect: DENY
        matched_because: "action.blast_radius = CRITICAL AND actor.tier < 4"
    appeal_information: "This action may proceed with Tier-4+ approval via the approval-constraint-engine."
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-registry.md` | Source of all active policies |
| `policy-as-code/policy-compiler.md` | Compiled policy trees for hot-path evaluation |
| `orchestration-constraints/constraint-solver.md` | Constraint feasibility pre-check feeds engine |
| `orchestration-constraints/approval-constraint-engine.md` | REQUIRE_APPROVAL decisions routed here |
| `governance-policies/immutable-policy-audit.md` | All decisions written to immutable audit |
| `governance-policies/policy-lineage-tracker.md` | Policy provenance for each evaluating policy |
| `delegation-and-trust/trust-propagation-engine.md` | Trust scores enriched into evaluation context |
| `audit-and-evidence/audit-trail-governance.md` | Policy decisions logged as audit events |
| `constitution/enterprise-constitution.md` | Constitutional rules loaded as HARD_DENY policies |
