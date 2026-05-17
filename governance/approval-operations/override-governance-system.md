# Override Governance System

## Purpose
Governs all instances where authorized principals override normal governance controls — approval gates, policy restrictions, confidence thresholds, and SLA requirements. Overrides are legitimate tools for exceptional circumstances, but they must be tightly controlled, fully audited, and systematically reviewed to prevent governance erosion.

---

## Override Classification

```yaml
override_types:
  APPROVAL_OVERRIDE:
    description: Bypasses normal approval requirement; principal self-authorizes
    examples:
      - emergency access needed before approver available
      - time-critical action where normal SLA is impossible
    minimum_authority: Tier-4
    dual_approval: always required (two Tier-4+ principals)
    max_duration: PT4H (must complete the action within this window)
    constitutional_check: mandatory
  
  POLICY_OVERRIDE:
    description: Acts contrary to established policy with documented justification
    examples:
      - policy technically prohibits an action that business necessity requires
      - policy has not yet been updated to reflect new organizational reality
    minimum_authority: Tier-4
    dual_approval: required
    policy_owner_notification: mandatory
    review_trigger: 2+ overrides of same policy → policy review required
  
  CONFIDENCE_THRESHOLD_OVERRIDE:
    description: Allows an AI output to proceed despite being below confidence threshold
    examples:
      - time-critical situation; expert available to backstop
      - known limitation of AI model in this domain; human expert will verify
    minimum_authority: Tier-3
    dual_approval: not required if Tier-4+
    requires: expert review commitment (human commits to reviewing output)
    max_confidence_floor: 0.30 (cannot override if confidence < 0.30)
  
  SLA_OVERRIDE:
    description: Extends SLA for a specific item (gives more time without breach)
    examples:
      - complex case genuinely needs more time
      - key reviewer temporarily unavailable but critical to this decision
    minimum_authority: Tier-3
    max_extension: 2× original SLA
    cannot_prevent_escalation: SLA override pauses breach status but escalation can still be triggered
  
  CONSTITUTIONAL_CONDITIONAL_OVERRIDE:
    description: Proceeds with a CONDITIONAL constitutional verdict without fulfilling all conditions
    examples:
      - conditions cannot be met due to external constraint
      - condition is impractical but principle intent is honored
    minimum_authority: Tier-5 (executive)
    dual_approval: two Tier-5 required
    board_notification: required
    permanent_audit: yes (these are the highest-sensitivity overrides)
```

---

## Override Request Schema

```yaml
override_request:
  override_id: "OVR-uuid"
  override_type: [from classification]
  
  # What is being overridden
  target:
    item_type: APPROVAL | POLICY | CONFIDENCE_GATE | SLA | CONSTITUTIONAL
    item_id: string
    original_constraint: string       # what rule/gate is being overridden
    constraint_source: policy-id | threshold-name | etc.
  
  # Why
  justification:
    business_reason: string            # mandatory; > 50 characters
    time_pressure: string | null       # if time-critical: explain
    alternatives_exhausted: string     # what else was tried
    risk_acknowledgment: string        # submitter acknowledges risks
  
  # Scope (must be as narrow as possible)
  scope:
    entity_id: string                  # specific entity only
    action_type: string                # specific action only
    valid_for_ms: integer              # must expire; max per type
    conditions: [condition-string]     # conditions under which override applies
  
  # Authorization
  requested_by: agent-id
  requested_at: ISO-8601
  approvals_required: integer          # 1 or 2 based on type
  approvals_received:
    - approver_id: agent-id
      approved_at: ISO-8601
      tier: integer
      signature: Ed25519
  
  # State
  status: PENDING_APPROVAL | ACTIVE | EXPIRED | REVOKED | USED
  activated_at: ISO-8601 | null
  expires_at: ISO-8601                 # always set; overrides always expire
  
  # Audit
  constitutional_check_result: PASS | CONDITIONAL | FAIL | WAIVED_BY_TIER5
  audit_level: ENHANCED
  retention: permanent   # all overrides retained permanently
```

---

## Override Authorization Flow

```
Override Request Submitted
    ↓
[1. Pre-check]
    ├── Constitutional check (always)
    ├── Verify submitter tier >= minimum_authority
    └── Reject if override_type requires dual_approval AND submitter = would-be approver
    ↓
[2. Approval Collection]
    For dual-approval types:
      → Route to two independent Tier-4+ principals
      → Cannot include submitter
      → 30-minute SLA for emergency overrides
    For single-approval (Tier-4+ self-authorization):
      → Submitter signs their own override
      → Second Tier-4+ must acknowledge within 2 hours (not prior approval, but witness)
    ↓
[3. Activation]
    → Override status: ACTIVE
    → Expiry timer started
    → All relevant systems notified of active override
    → Audit: GOVERNANCE_OVERRIDE_APPLIED event
    ↓
[4. Execution Window]
    → Override visible in all relevant interfaces
    → Cannot be extended without new override request
    ↓
[5. Expiry]
    → Override status: EXPIRED
    → Normal controls re-enabled automatically
    → Usage report generated
```

---

## Override Registry

All active and historical overrides in a searchable registry:

```yaml
override_registry:
  active_overrides:
    - override_id: string
      type: string
      target_entity: string
      activated_by: agent-id
      expires_at: ISO-8601
      sla_remaining_pct: float
  
  views:
    by_principal: all overrides requested by or approving principal
    by_entity: all overrides affecting a specific entity
    by_type: all overrides of a specific type
    by_org: all overrides affecting a specific org
    active_only: currently active overrides
  
  accumulation_alerts:
    same_entity_overrides > 2 active simultaneously:
      action: alert governance-lead + flag for review
    same_principal > 3 overrides in 7 days:
      action: conduct-review for that principal
    same_policy overridden > 2 times in 30 days:
      action: mandatory policy review triggered
```

---

## Override Revocation

Active overrides can be revoked before expiry:

```yaml
revocation:
  can_revoke: any Tier-4+ principal
  cannot_revoke:
    - own override (submitter cannot revoke their own)
    - if override is currently being acted upon (action in flight)
  
  revocation_process:
    1: check if action already taken under override
    2: if yes and action reversible: offer rollback
    3: if yes and irreversible: document but proceed with revocation (prevents further use)
    4: update override status: REVOKED
    5: notify submitter + original approvers
    6: emit OVERRIDE_REVOKED audit event
  
  revocation_documentation:
    reason_required: true
    permanent_record: true
```

---

## Override Quality Review

Periodic governance review of all overrides:

```yaml
override_review:
  frequency: monthly
  reviewer: governance-lead + executive-sponsor
  
  analysis:
    volume_trend: are overrides increasing? decreasing?
    type_distribution: which types are most common?
    outcome_quality: did overrides result in good outcomes?
    repeat_patterns: same entity/principal/policy overridden repeatedly?
    constitutional_consistency: were constitutional checks applied correctly?
  
  actions_from_review:
    high_volume_override_type:
      interpretation: underlying policy may be too restrictive
      action: policy review
    
    repeated_policy_override:
      interpretation: specific policy doesn't fit organizational reality
      action: policy update required (with governance approval)
    
    poor_override_outcomes:
      interpretation: override authorization threshold may be too low
      action: raise authority requirements
    
    override_gaming:
      interpretation: pattern suggests principal deliberately circumventing controls
      action: conduct review + escalate to Tier-5
```

---

## Anti-Gaming Controls

```yaml
anti_gaming:
  velocity_limits:
    per_principal:
      APPROVAL_OVERRIDE: max 2 per 30 days
      POLICY_OVERRIDE: max 2 per 30 days
      any_type: max 5 per 30 days
      on_limit_reached: automatic Tier-4 review before any new override
  
  collusion_detection:
    same_pair_of_approvers: same two Tier-4 principals approving overrides for each other repeatedly
    detection_window: 30 days
    threshold: 3+ mutual approvals
    action: require third approver from different org for all future overrides
  
  scope_creep_prevention:
    scope_validator: scope must be narrowest possible
    AI_scope_checker: reviews scope against justification (flags over-broad scope)
    broad_scope_alert: if scope covers > 10 entities or > 72 hours
  
  emergency_abuse:
    emergency_flag_rate: if > 30% of overrides are "emergency" type
    investigation: audit flagging patterns; discuss with principal
```
