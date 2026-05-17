# Knowledge Ownership System

## Purpose
Assigns clear accountability for every knowledge unit and ensures that ownership is maintained as the organization evolves. Without ownership, knowledge becomes orphaned, stale, and unreliable. This system establishes who is responsible for each piece of organizational knowledge, what that responsibility entails, and how ownership transfers when personnel changes occur.

---

## Ownership Model

```yaml
ownership_model:
  roles:
    OWNER:
      description: Accountable for the accuracy, currency, and lifecycle of a knowledge unit
      responsibilities:
        - review and approve all MAJOR version updates
        - respond to review schedule prompts within SLA
        - respond to accuracy disputes within SLA
        - initiate deprecation or archival when knowledge is outdated
        - ensure steward is assigned if owner cannot fulfill duties
      authority:
        - can publish, deprecate, archive their units (within tier constraints)
        - can approve MINOR and PATCH updates without review
        - can assign/change steward
      constraints:
        - max_owned_units: 50 (beyond this, quality degrades)
        - cannot be both owner AND sole approver of contested disputes
    
    STEWARD:
      description: Day-to-day maintenance agent; acts on behalf of owner
      responsibilities:
        - monitor review schedule; execute scheduled reviews
        - apply PATCH updates without owner approval
        - triage disputes; escalate to owner for MAJOR issues
        - tag units correctly; update taxonomy as taxonomy evolves
      authority:
        - can apply PATCH updates
        - can flag units for owner review
        - can update tags, metadata, examples (PATCH level)
      constraints:
        - cannot deprecate without owner approval
        - cannot change core content without owner approval
    
    DOMAIN_STEWARD:
      description: Org-level steward responsible for all knowledge in a domain
      responsibilities:
        - audit domain knowledge portfolio monthly
        - identify and close knowledge gaps in the domain
        - ensure all units in domain have assigned owners
        - adjudicate disputes between unit owners in same domain
        - maintain domain taxonomy alignment
      authority:
        - can assign units to owners in the domain
        - can flag units for urgent review
        - can escalate to knowledge-governance-lead
      coverage: one domain steward per enterprise domain (10 total)
    
    KNOWLEDGE_GOVERNANCE_LEAD:
      description: System-wide knowledge governance authority
      responsibilities:
        - final arbiter of unresolvable disputes
        - taxonomy governance (new domains, subdomains)
        - ownership transfer approvals
        - knowledge quality standards enforcement
        - organizational learning oversight
      authority: Tier-3+ required; single role per enterprise
```

---

## Owner Assignment

```yaml
owner_assignment:
  at_creation:
    rule_1_captured_from_workflow: owner = process owner of the generating workflow
    rule_2_decision_capture: owner = deciding authority (agent who made the decision)
    rule_3_expert_elicitation: owner = the domain expert interviewed
    rule_4_synthesis: owner = knowledge steward of primary domain
    rule_5_manual_creation: owner = creator
    rule_6_no_owner_available: domain_steward takes ownership (transitional)
  
  on_owner_unavailable:
    trigger: owner agent marked inactive or offboarded
    process:
      step_1: auto-notify domain_steward
      step_2: domain_steward reviews unit; either takes ownership or re-assigns
      step_3: if not resolved in 7 days: knowledge-governance-lead assigns owner
      step_4: if no appropriate owner identified: unit enters REVIEW with note
    
    orphaned_units_policy:
      definition: ACTIVE units with no owner for > 14 days
      target: 0 orphaned units at all times
      enforcement: daily orphan scan; alert to knowledge-governance-lead
  
  ownership_transfer:
    trigger: owner requests transfer; offboarding; restructuring
    requires: receiving_owner + knowledge-governance-lead acknowledgment
    process:
      step_1: transfer request logged
      step_2: new owner reviews all units to be transferred (can reject specific units)
      step_3: rejected units: escalate to domain_steward
      step_4: approved transfer: update owner field; notify all
    
    bulk_transfer:
      trigger: org restructuring affecting > 10 units
      process: domain_steward coordinates; knowledge-governance-lead approves
      timeline: complete within 30 days of restructuring announcement
```

---

## Owner Accountability

```yaml
owner_accountability:
  review_sla:
    scheduled_review_prompt: owner has 7 business days to respond
    dispute_triage: owner must triage within 3 business days
    major_update_approval: owner must review within 5 business days
    
    on_sla_breach:
      first_breach: notify steward to cover
      second_consecutive_breach: notify domain_steward
      third_consecutive_breach: escalate to knowledge-governance-lead; possible ownership transfer
  
  owner_performance_metrics:
    tracked_per_owner:
      review_compliance_rate: reviews completed on time / scheduled reviews
      dispute_response_rate: disputes triaged within SLA / total disputes
      owned_units_quality_avg: avg overall_quality of owned units
      orphaned_unit_rate: units without steward / total owned units
    
    performance_thresholds:
      review_compliance_rate < 0.70: coaching required
      owned_units_quality_avg < 0.60: remediation plan required
  
  owner_capacity_management:
    current_unit_count: tracked per owner
    at_40_units: alert owner and domain_steward (approaching capacity)
    at_50_units: block new automatic assignments; review capacity
    
    capacity_alert_response:
      option_1: assign steward to handle day-to-day (extends effective capacity)
      option_2: deprecate or transfer units to reduce portfolio
      option_3: formal capacity exception (Tier-3+ approval; max 75 units with dedicated steward)
```

---

## Steward Registry

```yaml
steward_registry:
  steward_profile:
    steward_id: agent-id
    domains: [string]                    # domains this steward covers
    unit_count_covered: int
    review_completion_rate: float        # steward reviews completed on time
    patch_update_count: int              # patches applied this quarter
    active: boolean
  
  steward_assignment:
    auto_assignment: domain_steward assigns to domain stewards
    manual: unit owner can designate a steward
    constraint: one unit can have at most one steward
  
  steward_capacity:
    max_units_per_steward: 100 (as primary steward)
    at_80_units: alert domain_steward
```

---

## Ownership Reporting

```yaml
ownership_reporting:
  reports:
    orphan_report:
      frequency: daily
      content: all ACTIVE units with no owner; days since last owner active
      recipient: knowledge-governance-lead + domain_stewards
    
    capacity_report:
      frequency: weekly
      content: owners at > 80% capacity; projected capacity issues
      recipient: domain_stewards
    
    performance_report:
      frequency: monthly
      content: owner performance metrics; steward performance metrics; SLA compliance
      recipient: knowledge-governance-lead
    
    portfolio_report:
      frequency: quarterly
      content: ownership distribution; quality by owner; knowledge transfer needs
      recipient: Tier-3+ leadership
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-model.md` | governance.owner + governance.steward fields |
| `knowledge-base/knowledge-lifecycle.md` | Owner notifications on lifecycle events |
| `knowledge-base/knowledge-quality-system.md` | Quality accountability by owner |
| `knowledge-capture/expert-knowledge-elicitation.md` | Expert registry for owner matching |
| `knowledge-governance/knowledge-operations-dashboard.md` | Ownership health metrics |
| `human-review/review-assignment-engine.md` | Reviewer assignment for KU disputes |
