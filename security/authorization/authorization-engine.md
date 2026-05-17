# Authorization Engine
**ID:** IAM-AZE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Evaluates every access request against the enterprise policy model — combining role-based access control (RBAC) for structural entitlements, attribute-based access control (ABAC) for contextual constraints, and constitutional screening for AI-boundary-adjacent operations — to produce a real-time PERMIT, DENY, or STEP_UP decision for every action attempted by any identity. The Authorization Engine is the enforcement point that converts authenticated identity into authorized action; it operates at every transaction boundary in the enterprise.

---

## Authorization Model

```yaml
authorization_model:
  paradigm: HYBRID RBAC + ABAC
  
  RBAC_layer:
    purpose: structural entitlements — what role can do by default
    evaluation: roles assigned to identity → permissions those roles grant
    performance: evaluated from cached role-permission matrix (< 5ms)
    
  ABAC_layer:
    purpose: contextual constraints — whether the structural entitlement applies in this context
    evaluation: policy conditions evaluated against request context attributes
    attributes_evaluated:
      subject: [risk_tier, autonomy_level, jurisdiction, trust_score, behavioral_contract_scope]
      resource: [data_class, sensitivity_level, owning_jurisdiction, asset_criticality]
      action: [action_type, action_scope, reversibility, blast_radius]
      environment: [time_of_day, requesting_ip, session_age, current_security_posture_score]
    performance: < 20ms p95 for full ABAC evaluation
    
  CONSTITUTIONAL_SCREEN:
    purpose: override layer — certain actions are prohibited regardless of RBAC/ABAC outcome
    evaluation: prospective-constitutional-screening.md checks action against constitutional constraints
    result: CONSTITUTIONAL_BLOCK overrides any PERMIT from RBAC/ABAC
    performance: < 10ms (pre-computed; cached constitutional constraint index)
    
  decision_hierarchy:
    1. CONSTITUTIONAL_BLOCK → DENY (non-overridable)
    2. EXPLICIT_DENY in any policy → DENY
    3. RBAC PERMIT + ABAC conditions satisfied → PERMIT (or STEP_UP if step-up required)
    4. No applicable policy → DENY (default-deny; whitelist model)
```

---

## Authorization Decision Pipeline

```
authorize(session_token, resource_id, action, context):

  # Step 1: Validate session
  session = validate_session_token(session_token)
  if not session.valid: Return DENY (reason=INVALID_SESSION)
  
  # Step 2: Constitutional screen (always first)
  constitutional_result = constitutional_screen(session.identity_id, resource_id, action, context)
  if constitutional_result.blocked:
    log_authorization_decision(DENY, reason=CONSTITUTIONAL_BLOCK, constitutional_result)
    alert_constitutional_quorum_if_threshold(constitutional_result.proximity_score)
    Return DENY (reason=CONSTITUTIONAL_BLOCK, details=constitutional_result)
    
  # Step 3: Load identity's effective permissions
  effective_permissions = load_effective_permissions(session):
    # = union(permissions from roles) ∪ direct_permissions - explicit_denies
    # Loaded from permission cache (TTL: 60s) or computed fresh
    
  # Step 4: RBAC check
  rbac_result = check_rbac(effective_permissions, resource_id, action)
  if not rbac_result.permitted:
    log_authorization_decision(DENY, reason=NO_RBAC_ENTITLEMENT)
    Return DENY (reason=INSUFFICIENT_PERMISSIONS)
    
  # Step 5: ABAC evaluation
  abac_result = evaluate_abac_policies(
    subject=session_to_subject(session),
    resource=load_resource_attributes(resource_id),
    action=action,
    environment=build_environment_context(context)
  )
  if abac_result.decision == DENY:
    log_authorization_decision(DENY, reason=ABAC_POLICY, policy=abac_result.matched_policy)
    Return DENY (reason=ABAC_POLICY_VIOLATION, details=abac_result)
    
  if abac_result.decision == STEP_UP:
    Return STEP_UP (reason=abac_result.step_up_reason, required_method=abac_result.step_up_method)
    
  # Step 6: Separation of Duties check
  sod_result = check_sod_constraints(session.identity_id, resource_id, action)
  if sod_result.violation:
    log_authorization_decision(DENY, reason=SOD_VIOLATION, sod_result)
    Return DENY (reason=SOD_VIOLATION, details=sod_result)
    
  # Step 7: Scope constraint check (behavioral contract scope)
  scope_result = check_behavioral_contract_scope(session.identity_id, action, resource_id)
  if scope_result.out_of_scope:
    log_authorization_decision(DENY, reason=OUT_OF_CONTRACT_SCOPE, scope_result)
    alert_if_pattern(session.identity_id, action)
    Return DENY (reason=BEHAVIORAL_CONTRACT_SCOPE)
    
  # Step 8: PERMIT
  decision = build_permit_decision(session, resource_id, action, abac_result)
  log_authorization_decision(PERMIT, decision)
  Return PERMIT (decision=decision)
```

---

## ABAC Policy Schema

```yaml
abac_policy:
  policy_id: ABP-{NNN}
  name: string
  priority: integer                      # higher number = evaluated first; conflicts resolved by priority
  
  target:
    identity_types: [string]             # which identity types this policy applies to
    resource_types: [string]             # which resource types
    actions: [string]                    # which actions
    
  condition:
    expression: CEL                      # Common Expression Language policy condition
    # Example: "subject.risk_tier == 'CRITICAL' && resource.data_class == 'PERSONAL_DATA' && environment.jurisdiction_pair_permitted == true"
    
  effect: PERMIT | DENY | STEP_UP
  
  step_up_config:
    required_method: string              # if effect == STEP_UP
    step_up_reason: string
    
  metadata:
    regulatory_basis: string             # e.g., "GDPR Art.5(1)(b) purpose limitation"
    created_by: IDN-{NNN}
    reviewed_at: ISO8601
    approved_by: IDN-{NNN}              # T3+ approval for DENY policies; T4 for constitutional-adjacent
    
  status: ACTIVE | DRAFT | DEPRECATED
```

---

## Authorization Decision Cache

```yaml
decision_cache:
  purpose: reduce latency for repeated authorization decisions on identical context
  
  cache_key: sha256(identity_id + resource_id + action + context_fingerprint)
  TTL: 60 seconds (STANDARD operations); 0 seconds (PRIVILEGED operations; no caching)
  
  bypass_conditions:
    - resource.sensitivity_level == RESTRICTED
    - session.privilege_level == SUPER_PRIVILEGED
    - action involves constitutional-adjacent resources
    - security_posture_score changed since last cache entry
    - identity's roles changed since last cache entry
    - active security incident affecting identity or resource
    
  cache_invalidation:
    on_role_change: flush all cache entries for identity_id
    on_policy_change: flush all cache entries matching policy target
    on_security_event: flush all cache entries for affected identities
    
  performance_targets:
    cache_hit: < 2ms
    cache_miss: < 25ms p95 (full ABAC evaluation)
    cache_hit_rate_target: > 60% for STANDARD operations
```

---

## Separation of Duties (SoD) Constraints

```yaml
sod_constraints:

  SOD-001:
    name: "No Self-Approval"
    rule: identity cannot approve their own actions, requests, or artifacts
    applies_to: all high-consequence approval actions
    
  SOD-002:
    name: "Provisioning and Approval Separation"
    rule: identity that requests access provisioning cannot be the approving authority
    applies_to: identity-lifecycle-manager joiner workflow
    
  SOD-003:
    name: "Audit and Operations Separation"
    rule: identities with AUDIT_READ permissions cannot also hold DATA_MODIFY permissions on the same resource class
    applies_to: all financial, compliance, and security audit systems
    
  SOD-004:
    name: "Constitutional Governor Independence"
    rule: constitutional governor agent cannot hold operational execution permissions
    applies_to: constitutional-governor-quorum agent identities
    enforcement: role catalog enforces this; constitutional governor roles explicitly exclude operational permissions
    
  SOD-005:
    name: "Incident Response and Operations Separation"
    rule: IR lead on an active incident cannot approve operational changes to systems under investigation
    applies_to: active incident contexts; duration: incident open + 48hr
    
  SOD-006:
    name: "Security and Business Operations Separation"
    rule: identities holding security administration roles (SOC, detection engineering) cannot hold business process modification roles
    applies_to: all security org identities
    exception_process: T4 approval + SoD exception record (EXC-SOD-{NNN})
    
  sod_exception_process:
    request: identity owner + T3 submit SOD exception request
    approval: T4 + Legal Org (for regulatory-relevant SOD rules)
    duration: maximum 90 days; renewable once
    monitoring: enhanced monitoring during exception period
```

---

## Authorization Metrics

```yaml
authorization_metrics:
  decision_latency: p50 < 5ms; p95 < 25ms; p99 < 50ms
  throughput: > 50,000 decisions/second
  deny_rate: tracked per identity_type and resource_type; anomalous denial spikes alert T3
  constitutional_block_rate: tracked separately; reported to constitutional quorum weekly
  sod_violation_rate: target 0; any violation triggers immediate T3 review
  cache_hit_rate: > 60% target for STANDARD operations
```

---

## Integration

```
Feeds into:
  policy-decision-point.md — PDP calls authorization engine as its evaluation backend
  security-event-correlator.md — PERMISSION_DENIED events feed correlation engine
  identity-analytics.md — authorization decisions feed risk analytics
  security-metrics-dashboard.md — authorization metrics feed SOC dashboard

Receives from:
  authentication-engine.md — validated session token consumed here
  role-management.md — role-permission matrix loaded for RBAC evaluation
  permission-catalog.md — canonical permission definitions
  governance/prospective-constitutional-screening.md — constitutional screen called in step 2
  behavioral-contract-system.md — contract scope checked in step 7
```

---

## Governance

**Default-deny model:** Any action without an explicit PERMIT policy is denied; there is no implicit permission  
**Constitutional block is non-overridable:** No authority level (T1 through T5) can override a CONSTITUTIONAL_BLOCK at the authorization layer; the constitutional screen is always evaluated first  
**SoD violations are hard blocks:** The authorization engine does not issue PERMIT on a SoD violation regardless of role entitlements; the only path is a formal SoD exception  
**PRIVILEGED operations are never cached:** Every PRIVILEGED and SUPER_PRIVILEGED operation is evaluated fresh against current policy; no stale cache can grant excessive privilege  
**Audit:** All authorization decisions (PERMIT and DENY) to `memory/identity-management/authorization-audit.jsonl`; 7-year retention; DENY events retained 10 years
