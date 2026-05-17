# Approval Constraint Engine

## Purpose
Manages the complete lifecycle of approval-gated actions in the orchestration system — from the moment a policy engine decision requires approval through to the execution or expiry of the approved action. The engine tracks approval state, enforces quorum and independence requirements, prevents unauthorized execution of pending actions, manages approval timeouts, and provides the audit trail for every approval decision. Approval constraints are the bridge between policy authorization and actual execution — they ensure that "approval required" decisions are genuinely resolved by the right people before actions proceed.

---

## Approval Engine Architecture

```
REQUIRE_APPROVAL Decision (from policy-engine.md)
        ↓
[1. Approval Request Creation]    → create approval_request record; validate approver spec
        ↓
[2. Independence Validation]      → verify required approvers are independent of requester
        ↓
[3. Approver Notification]        → TASK_ASSIGNMENT message to all required approvers
        ↓
[4. Approval Collection]          → collect approvals; validate each; check quorum
        ↓
[5. Quorum Check]                 → has minimum quorum been reached? is quorum still valid?
        ↓
[6. Timeout Management]           → is request still within approval window?
        ↓
[7. Execution Gate]               → verify approval is still valid before allowing execution
        ↓
[8. Audit Trail]                  → log all approval events immutably
```

---

## Approval Request Schema

```yaml
approval_request:
  approval_id: "APR-{policy_decision_id}-{seq}"
  
  source:
    policy_decision_id: string          # POLDEC-* that triggered REQUIRE_APPROVAL
    policy_id: string                   # which policy required approval
    rule_id: string                     # which specific rule
    workflow_id: string | null
    task_id: string | null
  
  requested_action:
    actor_id: agent_id | human_id       # who wants to do the thing
    action_type: string
    action_description: string          # human-readable description of what will happen
    resource_id: string
    reversibility: REVERSIBLE | PARTIALLY_REVERSIBLE | IRREVERSIBLE
    blast_radius: LOW | MEDIUM | HIGH | CRITICAL
    estimated_impact: string            # plain-language description of consequences
  
  approval_requirements:
    required_approvers: [approver_spec]
    approver_spec:
      tier_minimum: int | null
      role: string | null               # specific role required
      agent_id: string | null           # specific agent required (e.g., DPO for privacy decisions)
      domain: string | null             # approver must have authority in this domain
    quorum: int                         # minimum number of approvals required
    unanimous_required: boolean         # if true, ALL required approvers must approve (not just quorum)
    bypass_allowed: boolean             # can emergency authority bypass this approval?
    timeout: duration                   # after this, request expires
  
  independence_requirements:
    requester_id: string                # actor_id above
    approver_must_not_be: [string]      # specific actor IDs excluded (usually includes requester)
    approver_must_not_have_dependency_on: [string]   # e.g., cannot approve their own team's work
    conflict_of_interest_check_required: boolean
  
  timeline:
    created_at: ISO-8601
    deadline: ISO-8601                  # created_at + timeout
    reminder_at: ISO-8601               # 50% of timeout elapsed
    escalation_at: ISO-8601             # 80% of timeout elapsed
  
  approvals_received: [approval_record]
  
  status: PENDING | APPROVED | REJECTED | EXPIRED | CANCELLED | BYPASSED
  
  execution_token:
    token_id: string | null             # issued when APPROVED; must be presented at execution
    token_valid_until: ISO-8601 | null  # approval window; execution must happen before this
    token_consumed: boolean             # true = token used; cannot be reused
```

---

## Approval Record

```yaml
approval_record:
  approval_record_id: "APREC-{approval_id}-{seq}"
  approval_id: string
  
  approver:
    approver_id: agent_id | human_id
    approver_tier: int
    approver_domain: string
    independence_verified: boolean
    conflict_of_interest_cleared: boolean
  
  decision:
    decision: APPROVED | REJECTED | ABSTAINED
    rationale: string                   # required for REJECTED; recommended for APPROVED
    conditions: [string]                # conditions attached to this approval (may further restrict execution)
    decided_at: ISO-8601
  
  integrity:
    decision_hash: SHA-256
    approver_signature: Ed25519         # approver's cryptographic signature over decision
```

---

## Quorum Evaluation

```yaml
quorum_evaluation:
  standard_quorum:
    rule: count(APPROVED decisions from valid approvers) >= approval_requirements.quorum
    valid_approver: approver meets tier_minimum, role, domain requirements AND passes independence check
  
  quorum_edge_cases:
    insufficient_approvers_available:
      definition: fewer eligible approvers exist than required quorum
      detection: at request creation time; re-checked if approver pool shrinks
      action: notify requester + Tier-3+; extend deadline by 24h; if still insufficient → escalate to human authority
    
    approver_conflict_of_interest_detected:
      timing: detected at approval submission
      action: invalidate that approver's vote; notify; recalculate quorum
    
    approver_tier_change_during_window:
      detection: approver tier drops below minimum before quorum reached
      action: invalidate prior approval from that approver; recalculate quorum
    
    conditional_approvals:
      rule: conditional approvals count toward quorum ONLY if all conditions are compatible
      incompatible_conditions: if two approvers attach contradictory conditions → REJECTED (cannot reconcile)
  
  quorum_invalidation:
    if_approver_later_found_to_have_conflict: re-evaluate quorum; if now insufficient → REVOKE approval
    if_action_scope_changed_after_approval: approval is invalid for the changed action; new approval required
    validity_period: approved action must execute within token_valid_until; if expired → new approval cycle
```

---

## Approval Priority and SLAs

```yaml
approval_slas:
  CRITICAL_blast_radius:
    notification: immediate (within 5 minutes of request creation)
    expected_response: within 1 hour
    escalation: if no response within 30 minutes → escalate to Tier-4+
    follow_up: every 15 minutes until resolved
  
  HIGH_blast_radius:
    notification: within 15 minutes
    expected_response: within 4 hours
    escalation: if no response within 2 hours → escalate to Tier-3+
    follow_up: every 30 minutes until resolved
  
  MEDIUM_blast_radius:
    notification: within 1 hour
    expected_response: within 24 hours
    escalation: if no response within 12 hours → reminder; 24 hours → escalate to compliance lead
  
  LOW_blast_radius:
    notification: within 4 hours (included in batch digest acceptable)
    expected_response: within 3 business days
    escalation: if overdue → weekly escalation report
  
  timeout_on_expiry:
    action: status → EXPIRED; requesting actor notified; action cannot proceed
    log: expiry logged as APPROVAL_REQUEST_EXPIRED audit event
    consequence: expired approvals generate MEDIUM finding if they represented a required compliance gate
```

---

## Approval Bypass Protocol

```yaml
emergency_bypass:
  eligibility:
    bypass_allowed: must be true in approval_requirements
    authority: Tier-4+ minimum (cannot be delegated)
    circumstances: [security_incident_in_progress, system_failure_requiring_immediate_action, regulatory_deadline_imminent]
    prohibited: constitutional requirements, prohibited AI practices, EU AI Act conformity requirements
  
  bypass_protocol:
    step_1: Tier-4+ invokes emergency bypass with documented justification
    step_2: bypass logged as EMERGENCY_APPROVAL_BYPASS with Tier-4+ signature
    step_3: Ed25519-signed bypass token issued with 30-minute validity
    step_4: post_bypass_review scheduled within 24 hours
    step_5: finding created (LOW finding for legitimate bypass; HIGH if justification found insufficient in review)
  
  bypass_audit:
    all_bypasses: logged immutably in approval audit trail with full context
    quarterly_bypass_review: all bypasses reviewed; pattern detection; escalation if > 3 per domain per quarter
    bypass_abuse_detection: bypass without genuine emergency → CRITICAL governance finding; disciplinary action
```

---

## Approval Interface

```yaml
approval_interface:
  approver_notification:
    channel: inter-agent-messaging.md TASK_ASSIGNMENT message with approval_request details
    urgency: aligned to blast_radius SLA above
    content:
      - clear description of what is being approved
      - estimated impact and reversibility
      - explicit options: APPROVE | REJECT | ABSTAIN | REQUEST_MORE_INFORMATION
      - deadline for response
      - consequence of inaction (expiry)
  
  approval_submission:
    method: TASK_COMPLETION message with approval_record payload
    validation:
      - approver is on required_approvers list
      - approver passes independence check
      - decision is one of APPROVED | REJECTED | ABSTAINED
      - rationale field is populated (mandatory for REJECTED)
      - Ed25519 signature over approval_record is valid
  
  requester_status_updates:
    on_approval_received: notification with count and remaining needed
    on_quorum_reached: notification with execution token
    on_rejection_received: immediate notification with rejection rationale
    on_approaching_deadline: notification at 50% and 80% of timeout elapsed
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Generates REQUIRE_APPROVAL decisions routed here |
| `orchestration-constraints/constraint-solver.md` | Approval status checked in DEPENDENCY_MODULE |
| `coordination-operations/inter-agent-messaging.md` | TASK_ASSIGNMENT for notifications; TASK_COMPLETION for submissions |
| `governance-policies/immutable-policy-audit.md` | All approval events logged immutably |
| `governance-policies/governance-traceability.md` | Approval chains traced in governance lineage |
| `audit-and-evidence/audit-trail-governance.md` | Approval events as HUMAN_APPROVED / HUMAN_REJECTED audit events |
| `governance-attestation/cryptographic-approval-engine.md` | Ed25519 signing for approval records |
