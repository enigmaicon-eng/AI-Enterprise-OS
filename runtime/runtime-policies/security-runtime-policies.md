# Security Runtime Policies

## Purpose
Enforces the zero-trust security model at runtime through policy — ensuring every agent action is evaluated against the principle of least privilege, every access decision is traceable, and security controls defined in the zero-trust architecture (v7.0.0) are automatically enforced rather than assumed. These policies operationalize the cryptographic and semantic security controls as evaluable rules that fire before each action executes.

---

## Policy Catalog — Security Domain

```yaml
security_runtime_policies:
  POL-SEC-001:
    policy_name: least_privilege_capability_enforcement
    description: "Agents may only take actions that fall within their verified, currently active capability set."
    obligation_ids: [OBL-ISO27001-012, OBL-SOC2-CC6.3]
    control_ids: [CTL-SEC-001]
    priority: 15
    
    rules:
      RULE-SEC-001-01:
        name: capability_scope_required
        description: "Every action must be covered by at least one capability held by the actor."
        condition:
          all_of:
            - {function: "action_covered_by_capability", args: ["action.action_type", "subject.actor_capabilities"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: false
          reason_template: "Action {action.action_type} is not covered by any capability held by actor {subject.actor_id}. Capabilities held: {subject.actor_capabilities}."
      
      RULE-SEC-001-02:
        name: capability_must_be_active_not_suspended
        description: "Suspended or expired capabilities do not authorize actions."
        condition:
          all_of:
            - {function: "required_capability_status", args: ["action.action_type", "subject.actor_id"], op: eq, value: "SUSPENDED"}
        effect:
          type: DENY
          reason_template: "Required capability for this action is currently suspended for actor {subject.actor_id}."
  
  POL-SEC-002:
    policy_name: ephemeral_permission_enforcement
    description: "All permissions are bound to specific execution contexts (run_id, valid_until). Permissions claimed outside their bound context are denied."
    obligation_ids: [OBL-ISO27001-012]
    control_ids: [CTL-SEC-001]
    priority: 10
    
    rules:
      RULE-SEC-002-01:
        name: permission_must_be_context_bound
        description: "Any permission claim must carry a valid run_id binding that matches the current execution context."
        condition:
          all_of:
            - {function: "permission_run_id_matches_context", args: ["subject.actor_id", "context.workflow_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Permission run_id does not match execution context. Possible permission replay or cross-context injection. Actor: {subject.actor_id}."
      
      RULE-SEC-002-02:
        name: expired_permission_denied
        description: "Permissions past their valid_until timestamp are denied regardless of other factors."
        condition:
          all_of:
            - {function: "permission_is_expired", args: ["subject.actor_id", "action.action_type"], op: eq, value: true}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Permission for action {action.action_type} has expired. Re-authorization required."
  
  POL-SEC-003:
    policy_name: data_classification_ceiling
    description: "Agents may not access data classified above their clearance ceiling."
    obligation_ids: [OBL-ISO27001-013, OBL-SOC2-CC6.1]
    control_ids: [CTL-SEC-001, CTL-PRIV-001]
    priority: 15
    
    rules:
      RULE-SEC-003-01:
        name: top_secret_tier5_only
        description: "TOP_SECRET classified resources may only be accessed by Tier-5 actors with explicit authorization."
        condition:
          all_of:
            - {field: "resource.resource_classification", op: eq, value: "TOP_SECRET"}
            - {field: "subject.actor_tier", op: lt, value: 5}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "TOP_SECRET resources require Tier-5 authority. Actor tier: {subject.actor_tier}."
      
      RULE-SEC-003-02:
        name: restricted_tier3_minimum
        description: "RESTRICTED resources require Tier-3+ or explicit delegation from Tier-3+."
        condition:
          all_of:
            - {field: "resource.resource_classification", op: eq, value: "RESTRICTED"}
            - {field: "subject.actor_tier", op: lt, value: 3}
            - {function: "has_explicit_restricted_delegation", args: ["subject.actor_id", "resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "RESTRICTED resources require Tier-3+ authority or explicit delegation. Actor tier: {subject.actor_tier}."
      
      RULE-SEC-003-03:
        name: confidential_tier2_minimum
        description: "CONFIDENTIAL resources require Tier-2+ or team-level delegation."
        condition:
          all_of:
            - {field: "resource.resource_classification", op: eq, value: "CONFIDENTIAL"}
            - {field: "subject.actor_tier", op: lt, value: 2}
            - {function: "has_team_access", args: ["subject.actor_id", "resource.resource_id"], op: eq, value: false}
        effect:
          type: DENY
          reason_template: "CONFIDENTIAL resources require Tier-2+ or team access grant."
  
  POL-SEC-004:
    policy_name: configuration_change_authorization
    description: "System and security configuration changes require elevated authorization proportional to blast radius."
    obligation_ids: [OBL-ISO27001-012, OBL-SOC2-CC6.8]
    control_ids: [CTL-OPS-001, CTL-SEC-001]
    priority: 20
    
    rules:
      RULE-SEC-004-01:
        name: security_config_change_requires_tier3
        description: "Changes to security configurations (encryption, access control, authentication) require Tier-3+ approval."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONFIGURATION_CHANGED"}
            - {field: "resource.resource_type", op: eq, value: "SECURITY_CONFIGURATION"}
            - {field: "subject.actor_tier", op: lt, value: 3}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3, domain: "INFORMATION_SECURITY"}]
          quorum: 1
          timeout: "1h"
          bypass_allowed: false
      
      RULE-SEC-004-02:
        name: audit_trail_config_tier4_only
        description: "Changes to audit trail configuration or retention policies require Tier-4+ approval. This protects the integrity of the accountability system."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "CONFIGURATION_CHANGED"}
            - {field: "resource.resource_type", op: eq, value: "AUDIT_TRAIL_CONFIGURATION"}
            - {field: "subject.actor_tier", op: lt, value: 4}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Audit trail configuration changes require Tier-4+ authority. This control protects audit trail integrity and cannot be bypassed."
  
  POL-SEC-005:
    policy_name: production_access_time_restriction
    description: "Non-emergency production system access is restricted to authorized maintenance windows."
    obligation_ids: [OBL-SOC2-CC6.6]
    control_ids: [CTL-SEC-001]
    priority: 30
    
    rules:
      RULE-SEC-005-01:
        name: production_access_outside_window_requires_approval
        description: "Production system access outside of authorized maintenance windows requires Tier-3+ approval."
        condition:
          all_of:
            - {field: "context.environment", op: eq, value: "PRODUCTION"}
            - {field: "action.action_category", op: in, value: ["WRITE", "CONFIGURE", "DECOMMISSION"]}
            - {function: "is_within_maintenance_window", op: eq, value: false}
            - {field: "subject.actor_tier", op: lt, value: 4}
        effect:
          type: REQUIRE_APPROVAL
          approvers: [{tier_minimum: 3}]
          quorum: 1
          timeout: "30m"
          reason_template: "Production modifications outside maintenance window require Tier-3+ approval."
  
  POL-SEC-006:
    policy_name: injection_and_manipulation_prevention
    description: "Actions that constitute or contain prompt injection, privilege escalation, or trust manipulation are denied."
    obligation_ids: [OBL-GOV-CONST-001]
    control_ids: [CTL-SEC-001]
    priority: 5
    
    rules:
      RULE-SEC-006-01:
        name: prompt_injection_detected_hard_deny
        description: "If the semantic firewall has flagged this request as containing prompt injection, deny unconditionally."
        condition:
          all_of:
            - {function: "has_injection_flag", args: ["context.session_id"], op: eq, value: true}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Request flagged as potential prompt injection by semantic firewall. Request denied unconditionally. Security incident logged."
      
      RULE-SEC-006-02:
        name: trust_manipulation_hard_deny
        description: "Actions that would artificially manipulate trust scores are denied as a governance violation."
        condition:
          all_of:
            - {field: "action.action_type", op: eq, value: "TRUST_SCORE_MANUAL_OVERRIDE"}
            - {function: "has_legitimate_trust_override_authority", args: ["subject.actor_id"], op: eq, value: false}
        effect:
          type: DENY
          hard_deny: true
          reason_template: "Trust score manipulation without legitimate authority is a governance violation. Actor: {subject.actor_id}."
```

---

## Security Policy Evaluation Ordering

```yaml
evaluation_order:
  # Security policies must be evaluated in this specific order to ensure
  # injection detection (POL-SEC-006) fires before any capability check
  # (otherwise an injected request could appear to have valid capabilities)
  
  1: POL-SEC-006 (injection_and_manipulation_prevention)
  2: POL-SEC-002 (ephemeral_permission_enforcement)
  3: POL-SEC-003 (data_classification_ceiling)
  4: POL-SEC-001 (least_privilege_capability_enforcement)
  5: POL-SEC-004 (configuration_change_authorization)
  6: POL-SEC-005 (production_access_time_restriction)
  
  note: "CONSTITUTIONAL policies (including constitutional AI constraints) always precede all security policies."
```

---

## Integration Points

| System | Role |
|---|---|
| `execution-security/least-privilege-engine.md` | Capability scope checked by POL-SEC-001 |
| `execution-security/ephemeral-permission-manager.md` | Permission binding verified by POL-SEC-002 |
| `execution-security/capability-scope-controller.md` | Classification ceiling enforced by POL-SEC-003 |
| `semantic-gateway/prompt-injection-detector.md` | Injection flags consumed by POL-SEC-006 |
| `audit-and-evidence/audit-trail-governance.md` | Audit trail config protected by POL-SEC-004 |
| `compliance-framework/control-catalog.md` | Controls CTL-SEC-001 through CTL-SEC-006 operationalized here |
