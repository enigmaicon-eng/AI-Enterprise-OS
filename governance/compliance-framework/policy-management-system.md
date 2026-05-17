# Policy Management System

## Purpose
Manages the full lifecycle of enterprise policies — from creation through approval, publication, maintenance, and retirement. Policies translate regulatory obligations and governance principles into actionable requirements for agents, humans, and systems. The policy management system ensures every policy is traceable to its obligation source, owned by an accountable party, reviewed on schedule, and actively enforced rather than merely documented.

---

## Policy Hierarchy

```
TIER 1: ENTERPRISE CONSTITUTION
  └── Supreme governing document; immutable except by board action
      (see constitution/enterprise-constitution.md)

TIER 2: GOVERNANCE PRINCIPLES
  └── Five immutable principles; framework for all policy decisions
      (see docs/governance/principles.md)

TIER 3: ENTERPRISE POLICIES
  └── High-level mandatory statements; approved by Tier-4+
      ├── Data Governance Policy
      ├── Information Security Policy
      ├── AI Governance Policy
      ├── Privacy Policy
      ├── Compliance Policy
      └── [other enterprise-wide policies]

TIER 4: DOMAIN POLICIES
  └── Domain-specific mandatory requirements; approved by Tier-3+
      ├── Data Classification Policy
      ├── Access Control Policy
      ├── Incident Response Policy
      ├── Vendor Risk Policy
      └── [other domain policies]

TIER 5: PROCEDURES AND STANDARDS
  └── How-to instructions implementing policies; approved by Tier-2+
      ├── Encryption Standard
      ├── Password Standard
      ├── AI Model Deployment Procedure
      └── [other procedures]
```

---

## Policy Record Schema

```yaml
policy_record:
  policy_id: "POL-{domain}-{seq}"
  
  identity:
    title: string
    tier: 3 | 4 | 5
    domain: string (from compliance-taxonomy.md)
    version: semantic_version
    status: DRAFT | IN_REVIEW | APPROVED | ACTIVE | UNDER_REVISION | DEPRECATED | RETIRED
  
  content:
    purpose: string                   # why this policy exists (one paragraph)
    scope: string                     # who and what this policy applies to
    policy_statements: [              # the actual policy requirements
      {
        statement_id: "POL-{id}-S{seq}"
        text: string
        mandatory: boolean
        obligation_refs: [obligation_id]   # what regulation requires this?
        control_refs: [control_id]         # what controls implement this?
      }
    ]
    definitions: [{term, definition}]
    exceptions_process: string | null   # how to request exceptions to this policy
  
  traceability:
    obligation_coverage: [obligation_id]  # all obligations this policy addresses
    parent_policy: policy_id | null       # if Tier 4/5, which Tier 3 policy does this implement?
    child_policies: [policy_id]           # Tier 4/5 policies that implement this one
    implementing_controls: [control_id]
    related_policies: [policy_id]
  
  lifecycle:
    created_at: ISO-8601
    created_by: agent_id | human_id
    approved_at: ISO-8601 | null
    approved_by: agent_id | human_id | null
    effective_date: ISO-8601 | null
    last_reviewed: ISO-8601
    next_review: ISO-8601
    review_frequency: ANNUAL | BIANNUAL | TRIGGERED_BY_CHANGE
    review_trigger: string | null        # what triggers out-of-cycle review?
    sunset_date: ISO-8601 | null         # if this policy has a planned end date
  
  governance:
    owner: agent_id | human_id           # accountable for this policy's accuracy
    approver_required: Tier-3 | Tier-4 | Tier-5  # based on policy tier
    stakeholders: [agent_id | human_id] # who must be consulted on changes
    exceptions_granted: [exception_id]
    open_violations: [violation_id]
    compliance_rate: float               # what fraction of entities comply?
  
  communication:
    distribution_list: [string]          # who must receive this policy
    acknowledgment_required: boolean     # must recipients formally acknowledge?
    training_required: boolean
    training_module_ref: string | null
```

---

## Policy Lifecycle

```yaml
policy_lifecycle:
  DRAFT:
    who_creates: policy owner (Tier-2+ for T5; Tier-3+ for T4; Tier-4+ for T3)
    action: author policy using TEMPLATE-POL-001
    must_include: purpose, scope, policy_statements, obligation_refs
    exits_to: IN_REVIEW (when owner submits for review)
  
  IN_REVIEW:
    who_reviews:
      Tier-5 policy: Tier-4+ reviewers + legal counsel + compliance governance lead
      Tier-4 policy: Tier-3 reviewers + compliance governance lead
      Tier-3 policy: domain stakeholders + compliance governance lead
    review_SLA: 10 business days (Tier-3); 7 business days (Tier-4/5)
    review_types:
      CONTENT_REVIEW: are the policy statements accurate and complete?
      LEGAL_REVIEW: does this policy satisfy the cited obligations? (required for Tier-3/4)
      STAKEHOLDER_REVIEW: does this policy work for its intended audience?
      CONFLICT_CHECK: does this policy conflict with any existing policies?
    exits_to:
      APPROVED (if all reviews pass)
      DRAFT (if material changes required)
  
  APPROVED:
    who_approves:
      Tier-5 policy: Tier-4+ single approver
      Tier-4 policy: Tier-3+ single approver
      Tier-3 policy: Tier-4+ sign-off
    approval_record: digital signature + timestamp
    exits_to: ACTIVE (immediately on approval; or on future effective_date)
  
  ACTIVE:
    state: policy is live; compliance is measured
    automated_monitoring: compliance rate tracked continuously
    violation_detection: monitored by control-effectiveness-monitor.md
    exits_to:
      UNDER_REVISION (when update needed)
      DEPRECATED (when regulation changes remove the need)
      RETIRED (when explicitly sunset)
  
  UNDER_REVISION:
    trigger: regulatory change, audit finding, stakeholder request
    action: create new version (DRAFT status); ACTIVE version remains in force during revision
    exits_to: IN_REVIEW (new version submitted)
    note: the new version goes through IN_REVIEW → APPROVED; old version retires on new version effective date
  
  DEPRECATED:
    trigger: underlying obligation no longer applies (regulation repealed, scope changed)
    action: policy marked DEPRECATED; removed from active compliance monitoring
    retention: deprecated policy record retained for 7 years
  
  RETIRED:
    trigger: planned sunset_date reached; OR superseded by a new Tier-3 policy
    action: policy marked RETIRED; no longer enforced
    retention: 7 years
```

---

## Policy Authoring Standards

```yaml
policy_authoring_standards:
  PRINCIPLE_1_ONE_REQUIREMENT_PER_STATEMENT:
    rule: each policy statement contains exactly one mandatory requirement
    bad_example: "Agents must encrypt data and log access and notify within 24 hours."
    good_example: Three separate statements — encryption, logging, notification
  
  PRINCIPLE_2_TESTABLE_REQUIREMENTS:
    rule: every policy statement must have a testable condition (can a control test prove compliance?)
    bad_example: "Agents must handle data responsibly."
    good_example: "Agents must apply AES-256 encryption to all data classified CONFIDENTIAL or above at rest."
  
  PRINCIPLE_3_EXPLICIT_SCOPE:
    rule: scope must explicitly state inclusions AND exclusions
    required: who, what systems, what data types, what geographies, what exceptions
  
  PRINCIPLE_4_OBLIGATION_TRACEABILITY:
    rule: every mandatory statement must cite at least one obligation_id or governance principle
    no_orphan_statements: policy statements without traceability → rejected in review
  
  PRINCIPLE_5_ACTIVE_VOICE:
    rule: policy statements use active voice and specify the actor
    bad: "Data shall be encrypted."
    good: "Agents must encrypt all CONFIDENTIAL data using approved encryption standards."
  
  POLICY_TEMPLATE_REQUIRED_SECTIONS:
    1. Purpose (why this policy exists)
    2. Scope (applicability, inclusions, exclusions)
    3. Policy Statements (numbered, one requirement each)
    4. Definitions (terms used in this policy)
    5. Enforcement (consequences of non-compliance)
    6. Exception Process (how to request exceptions)
    7. Review Schedule
    8. Obligation Traceability Table (statement → obligation_id mapping)
```

---

## Policy Conflict Detection

```yaml
policy_conflict_detection:
  automated_check:
    trigger: every new policy entering IN_REVIEW
    method: semantic comparison against all ACTIVE policies
    conflict_types:
      DIRECT_CONTRADICTION: policy A requires X; policy B prohibits X
      OVERLAPPING_SCOPE: both policies make requirements on same entity/situation
      PRECEDENCE_AMBIGUITY: two policies at same tier make conflicting claims
    
    resolution:
      DIRECT_CONTRADICTION: block policy progression; require resolution before APPROVED
      OVERLAPPING_SCOPE: flag for stakeholder review; one policy may supersede the other
      PRECEDENCE_AMBIGUITY: escalate to compliance governance lead for ruling
  
  hierarchy_precedence:
    Tier-3 overrides Tier-4 which overrides Tier-5
    same-tier conflicts: resolved by compliance governance lead + Tier-3+ sign-off
    constitution: always prevails over any policy
```

---

## Policy Violation Management

```yaml
policy_violation:
  violation_id: "VIO-{policy_id}-{seq}"
  detection_source: AUTOMATED_MONITORING | AUDIT | SELF_REPORTED | THIRD_PARTY
  
  classification:
    severity: CRITICAL | HIGH | MEDIUM | LOW
    intentional: boolean | null
    recurrence: boolean
    affected_policy_statements: [statement_id]
  
  response:
    notification: owner + compliance governance lead (within 1 hour for CRITICAL; 24h for HIGH)
    remediation_required: boolean
    remediation_deadline: ISO-8601 (CRITICAL: 24h; HIGH: 7d; MEDIUM: 30d; LOW: 90d)
    disciplinary_action_considered: boolean
  
  pattern_detection:
    recurring_violation_threshold: 3 violations of same statement in 30 days → policy review triggered
    systemic_violation_threshold: > 10% of entities violating → control or policy adequacy review
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/compliance-model.md` | Policy_record schema extends compliance model |
| `compliance-framework/regulatory-registry.md` | Obligations cited in policy statements |
| `compliance-framework/control-catalog.md` | Controls that implement policy statements |
| `risk-and-controls/control-effectiveness-monitor.md` | Monitors policy compliance rates |
| `audit-and-evidence/finding-management.md` | Policy violations generate findings |
| `governance-operations/compliance-operations-dashboard.md` | Policy health metrics displayed |
