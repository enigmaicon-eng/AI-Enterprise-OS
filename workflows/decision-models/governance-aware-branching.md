# Governance-Aware Branching

## Purpose
Extends standard workflow branching with governance intelligence. When a workflow reaches a decision point that involves authority, compliance, constitutional considerations, or organizational policy, this system determines the correct branch based on real-time governance state — not just static conditions.

---

## Why Governance-Aware Branching Exists

Standard XOR gateways evaluate static CEL conditions. Governance-aware branches evaluate:
- **Authority state** — does the current principal have sufficient tier for this branch?
- **Constitutional state** — would proceeding down this branch violate any principle?
- **Policy state** — is this branch currently permitted under active policies?
- **Capacity state** — are the governance resources (approvers, reviewers) available to execute this branch?
- **Temporal state** — is this branch valid at the current time (business hours, freeze periods, etc.)?

---

## Branch Types

### Type 1 — Authority Gate
```yaml
branch_type: AUTHORITY_GATE
config:
  required_tier: 3
  evaluation:
    - check: current_principal.tier >= required_tier
      pass: proceed_branch
      fail: delegate_branch
    
    - check: no active suspension on current_principal
      pass: proceed_branch
      fail: blocked_branch
    
    - check: constitutional_check if tier >= 3
      pass: proceed_branch
      fail: constitutional_review_branch

branches:
  proceed:        # principal has authority → proceed directly
  delegate:       # route to higher-tier principal
  blocked:        # principal suspended → escalation case
  constitutional_review:   # constitutional check needed first
```

### Type 2 — Constitutional Checkpoint
```yaml
branch_type: CONSTITUTIONAL_CHECKPOINT
config:
  trigger: always   # or: "CEL expression"
  evaluator: PROC-GOV-005
  cache_ttl_ms: 0   # no caching for constitutional checks

branches:
  PASS:             # proceed
  CONDITIONAL:      # proceed after conditions acknowledged
  FAIL:             # halt + emit CONSTITUTIONAL_VIOLATION_DETECTED

on_FAIL:
  actions:
    - suspend_workflow_instance
    - preserve_audit_snapshot
    - notify_governance_lead
    - create_incident(type: CONSTITUTIONAL, severity: P1)
```

### Type 3 — Policy Gate
```yaml
branch_type: POLICY_GATE
config:
  policy_ids: [POLICY-GOV-001, POLICY-ORG-001]
  evaluation_mode: ALL_MUST_PASS | ANY_MUST_PASS

branches:
  all_pass:    # all specified policies evaluate to allow
  partial:     # some policies allow, some don't
  blocked:     # no policy allows this action

on_partial:
  resolution: most_restrictive   # take most restrictive allowed action
```

### Type 4 — Capacity Check
```yaml
branch_type: CAPACITY_CHECK
config:
  required_resources:
    - type: APPROVER_TIER
      tier: 3
      count: 2
    - type: AGENT_CAPABILITY
      capability: constitutional_review
      count: 1

branches:
  available:      # all required resources available → proceed
  partial:        # some resources available → degrade gracefully or queue
  unavailable:    # no resources → queue with notification
  critical_path:  # resource unavailable + time-critical → emergency escalation
```

### Type 5 — Temporal Gate
```yaml
branch_type: TEMPORAL_GATE
config:
  windows:
    - name: business_hours
      condition: "time.hour >= 9 AND time.hour < 17 AND time.weekday <= 5"
    - name: freeze_period
      source: "governance/freeze-periods"   # external policy source
    - name: maintenance_window
      source: "ops/maintenance-schedule"

branches:
  business_hours_available:     # in business hours, not frozen
  outside_hours:                # outside business hours → queue until hours
  freeze_period:                # in freeze → block + notify
  maintenance:                  # in maintenance → queue with ETA
```

---

## Composite Branching

Combine multiple governance checks in sequence:

```yaml
composite_branch:
  id: "COMP-RFC-APPROVAL"
  description: Full governance gauntlet for RFC approval path
  
  sequence:
    - step: AUTHORITY_GATE
      required_tier: 3
      on_fail: delegate to tier-3 principal
    
    - step: CONSTITUTIONAL_CHECKPOINT
      on_FAIL: abort with incident
    
    - step: POLICY_GATE
      policy_ids: [POLICY-GOV-001]
      on_blocked: reject with policy reference
    
    - step: CAPACITY_CHECK
      required_resources:
        - type: APPROVER_TIER
          tier: 3
          count: 1
      on_unavailable: queue and notify
  
  # All steps must pass to proceed to APPROVED branch
  all_pass_branch: APPROVED
  first_fail_branch: per_step_fail_branches_above
```

---

## Governance State Oracle

The governance-aware branching system queries real-time governance state:

```
query_governance_state(context):
  return {
    current_principal: {
      id: context.actor_id,
      tier: trust-boundaries/resolve_tier(context.actor_id),
      suspended: trust-boundaries/is_suspended(context.actor_id),
      capabilities: trust-boundaries/get_capabilities(context.actor_id)
    },
    
    constitutional_status: {
      recent_violations: audit-log.violations_last_30d(context.actor_id),
      pending_reviews: governance-queue.pending_for(context.actor_id)
    },
    
    active_policies: {
      applicable: policy-routing-engine.get_applicable(context),
      freeze_periods: temporal-policy.active_freezes(),
      override_active: governance.active_overrides()
    },
    
    capacity: {
      tier_3_approvers_available: approval-queue.available_count(tier=3),
      tier_4_approvers_available: approval-queue.available_count(tier=4),
      constitutional_reviewers_available: agent-pool.available_count(capability='constitutional_review')
    },
    
    temporal: {
      in_business_hours: temporal.is_business_hours(),
      in_freeze_period: temporal.is_freeze_period(),
      maintenance_eta: temporal.next_maintenance_end()
    }
  }
```

---

## Branching Audit

Every governance-aware branch decision is logged:

```yaml
branching_decision:
  decision_id: "uuid"
  branch_type: string
  workflow_instance_id: string
  node_id: string
  decided_at: ISO-8601
  
  governance_state_snapshot:
    principal_tier: integer
    constitutional_check_result: PASS | CONDITIONAL | FAIL | SKIPPED
    policies_applied: [policy_id]
    capacity_status: {available: bool, details: {}}
    temporal_status: {in_business_hours: bool, in_freeze: bool}
  
  branch_taken: string
  branch_rationale: string
  
  overrides_applied: [{override_id, applied_by, rationale}]
```

---

## Override System

Authorized principals (Tier 4+) may override a governance branch:

```yaml
governance_override:
  override_id: "uuid"
  override_type: AUTHORITY | POLICY | TEMPORAL | CAPACITY
  
  requested_by: agent-id   # must be Tier 4+
  approved_by: [agent-id]  # requires 2 Tier-4+ approvals
  
  scope:
    workflow_instance_id: string   # specific instance only
    branch_node_id: string         # specific node only
    valid_for_ms: 3600000          # max 1 hour
  
  rationale: string   # mandatory
  constitutional_acknowledgment: true   # required checkbox
  audit_note: string   # will appear in permanent audit trail
  
  # Overrides are logged, immutable, and cannot be deleted
```
