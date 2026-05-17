# Policy Registry

## Purpose
The authoritative store for all enterprise policies — the single source of truth for what policies exist, what versions are active, who owns them, and what they govern. The policy registry provides version-controlled policy storage, discovery APIs for the policy engine, activation management, and the governance record for every policy change. Like all authoritative stores in this OS, the registry is append-only for audit records and uses cryptographic integrity to prevent tampering.

---

## Registry Architecture

```
Policy Lifecycle
        ↓
[Authoring]          → policy written in PDL (policy-language.md); stored as DRAFT
        ↓
[Review]             → reviewers check logic, traceability, test coverage
        ↓
[Approval]           → governance approval per policy category
        ↓
[Staging]            → new policy version deployed in AUDIT_ONLY mode (comparison period)
        ↓
[Activation]         → policy moves to ACTIVE status; prior version deprecated
        ↓
[Monitoring]         → usage metrics, decision divergence, anomaly detection
        ↓
[Review Cycle]       → triggered at review_date or by regulatory change
        ↓
[Deprecation]        → policy superseded or no longer needed; ARCHIVED after retention period

Policy Registry Storage
├── [Policy Documents]     → versioned PDL files (current + all historical versions)
├── [Policy Index]         → fast lookup by policy_id, domain, category, status, tag
├── [Activation Log]       → append-only log of all activation/deactivation events
├── [Governance Records]   → approval records for each version (cryptographically signed)
└── [Metrics Store]        → decision counts, evaluation performance, divergence alerts
```

---

## Policy Record (Registry Entry)

```yaml
policy_registry_entry:
  policy_id: "POL-{domain}-{seq}"
  
  versions:
    current_active_version: semver | null
    all_versions:
      - version: semver
        status: DRAFT | ACTIVE | STAGED | DEPRECATED | ARCHIVED
        policy_document: PDL document (full policy-language.md format)
        policy_hash: SHA-256
        prior_version_hash: SHA-256         # hash chain for version integrity
        
        governance_record:
          authored_by: agent_id | human_id
          authored_at: ISO-8601
          review_records: [{reviewer, reviewed_at, decision: APPROVED|REJECTED|REVISION_REQUESTED, notes}]
          approval_record:
            approved_by: agent_id | human_id
            approved_at: ISO-8601
            approval_signature: Ed25519
            approval_tier: int              # tier of approving authority
          
          staging_record:
            staged_at: ISO-8601
            staged_by: agent_id | human_id
            staging_duration: duration
            divergence_count: int           # decisions where new version differed from old during staging
            divergence_review: string | null
          
          activation_record:
            activated_at: ISO-8601 | null
            activated_by: agent_id | human_id | null
            prior_version_deprecated_at: ISO-8601 | null
          
          deprecation_record:
            deprecated_at: ISO-8601 | null
            deprecated_by: agent_id | human_id | null
            deprecated_reason: string | null
            superseded_by_version: semver | null
  
  index_metadata:
    domain: string
    category: string
    tags: [string]
    obligation_ids: [obligation_id]           # for fast lookup by obligation
    control_ids: [control_id]                 # for fast lookup by control
    regulation_ids: [regulation_id]
    review_date: ISO-8601                     # next required review
    is_constitutional: boolean
  
  usage_metrics:
    total_evaluations: int
    evaluations_last_30d: int
    decisions: {ALLOW: int, DENY: int, REQUIRE_APPROVAL: int, ALLOW_WITH_CONDITIONS: int}
    last_evaluated_at: ISO-8601
    most_triggered_rule: rule_id
  
  retained_until: ISO-8601                    # 10 years for constitutional; 7 years for others
```

---

## Policy Discovery API

```yaml
discovery_api:
  GET_applicable_policies:
    purpose: find all policies applicable to a given evaluation request
    inputs:
      subject_type: string
      action_category: string
      resource_type: string
      domain: string
      environment: string
    algorithm:
      1. filter by scope.applies_to_subjects (subject_type match)
      2. filter by scope.applies_to_actions (action_category match)
      3. filter by scope.applies_to_resources (resource_type match)
      4. filter by scope.applies_to_environments
      5. filter by status = ACTIVE
      6. order by classification.priority ASC (lowest = highest priority = evaluated first)
    performance: p99 < 5ms (index-based; no full scan)
    caching: policy list for identical {subject_type, action_category, resource_type} cached 60s
  
  GET_policy_by_id:
    inputs: policy_id, version (optional; default = current_active_version)
    returns: full policy document + governance_record
    performance: p99 < 2ms (direct key lookup)
  
  GET_policies_by_obligation:
    inputs: obligation_id
    returns: [policy_id, policy_name, version, status]
    use_when: determining which policies enforce a given regulatory obligation
    performance: p99 < 10ms (obligation index)
  
  GET_policy_coverage_report:
    inputs: [obligation_id] or [regulation_id]
    returns: for each obligation — list of covering policies + coverage gaps
    use_when: compliance reporting; obligation gap analysis
  
  GET_policy_history:
    inputs: policy_id
    returns: all versions with governance records + activation timeline
    use_when: audit; policy lineage tracing
```

---

## Policy Activation Governance

```yaml
activation_governance:
  approval_matrix:
    DEFAULT_policies (category: DEFAULT):
      approvers: domain compliance lead
      minimum_reviewers: 1
      review_period: 5 business days
      staging_period: 24 hours
    
    OPERATIONAL_policies:
      approvers: compliance governance lead + policy owner
      minimum_reviewers: 2
      review_period: 5 business days
      staging_period: 48 hours
    
    SECURITY_policies:
      approvers: compliance governance lead + security lead
      minimum_reviewers: 2
      review_period: 7 business days
      staging_period: 72 hours
    
    AI_GOVERNANCE_policies:
      approvers: compliance governance lead + AI governance lead + Tier-3+
      minimum_reviewers: 3
      review_period: 10 business days
      staging_period: 7 days
    
    REGULATORY_COMPLIANCE_policies:
      approvers: compliance governance lead + legal counsel + Tier-3+
      minimum_reviewers: 3
      review_period: 10 business days
      staging_period: 7 days
      legal_counsel_review: mandatory
    
    CONSTITUTIONAL_policies:
      approvers: Tier-4+ + legal counsel + board notification
      minimum_reviewers: Tier-4+ quorum
      review_period: 30 days minimum
      staging_period: 30 days
      board_notification: mandatory
  
  emergency_policy_activation:
    definition: critical security or compliance threat requires immediate policy change
    authority: Tier-4+ authorization (cannot be delegated)
    staging_period: WAIVED (direct activation)
    review_period: WAIVED (post-activation review within 48 hours)
    duration_limit: 7 days maximum; must be converted to standard policy within 7 days
    logging: emergency activation always logged with reason and authorizer
    post_activation_review: mandatory within 48 hours; full approval process completed or policy reverted
  
  policy_conflict_review:
    trigger: staging divergence rate > 5% of decisions
    action: pause activation; send for conflict review (see policy-impact-analyzer.md)
    resolution: modify new policy OR update old policies OR accept divergence with documented rationale
```

---

## Review Cycle Management

```yaml
review_cycle:
  triggers:
    SCHEDULED: policy.review_date reached
    REGULATORY_CHANGE: regulation affecting policy_id changed (from regulatory-change-management.md)
    CONTROL_CHANGE: covered control implementation changed
    ACTIVATION_ANOMALY: unexpected pattern in policy decisions
    ANNUAL_SWEEP: all policies reviewed annually regardless of other triggers
  
  review_criteria:
    is_policy_still_accurate: does the rule logic correctly reflect current requirements?
    is_obligation_still_current: are the linked obligations still active?
    is_policy_effective: is it achieving its intended compliance outcome?
    is_policy_proportionate: is the enforcement level appropriate to the risk?
    are_exceptions_still_valid: if exceptions reference this policy, are they still needed?
  
  review_outcomes:
    CONFIRMED: policy is correct as-is; review_date extended by standard interval
    UPDATED: minor changes; follows MINOR or PATCH change protocol
    MAJOR_REVISION: significant logic change; follows MAJOR change protocol
    DEPRECATED: policy no longer needed; archived after retention period
  
  overdue_reviews:
    30_days_overdue: alert to policy owner
    60_days_overdue: alert to compliance governance lead; policy tagged REVIEW_OVERDUE
    90_days_overdue: policy automatically staged for review; compliance governance lead initiates review
    180_days_overdue: policy moved to STAGED (AUDIT_ONLY) pending review completion; operations team notified
```

---

## Registry Integrity

```yaml
registry_integrity:
  policy_document_integrity:
    hash: SHA-256 of the full policy PDL document (all fields)
    stored_in: policy_registry_entry.versions[].policy_hash
    verified_on: every read from registry; hash mismatch → reject + alert
  
  version_chain_integrity:
    hash_chain: each version's prior_version_hash = SHA-256 of the prior version's full document
    genesis_version: prior_version_hash = SHA-256("GENESIS-{policy_id}")
    chain_verification: daily full chain walk; any break = CRITICAL alert + registry lock until resolved
  
  governance_record_integrity:
    approval_signature: Ed25519 signature over policy_hash by approving authority
    signature_verification: verified on every policy load; invalid signature = policy cannot be activated
  
  activation_log:
    format: append-only JSONL with hash chain
    content: every status transition (DRAFT→STAGED→ACTIVE→DEPRECATED→ARCHIVED)
    tamper_detection: same hash chain verification as audit-trail-governance.md
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Loads active policies from registry for evaluation |
| `policy-as-code/policy-compiler.md` | Compiles policies from registry; cache invalidated on update |
| `policy-as-code/policy-testing-framework.md` | Tests stored in registry alongside policy documents |
| `governance-policies/policy-lineage-tracker.md` | Full version history sourced from registry |
| `governance-policies/policy-impact-analyzer.md` | Registry data feeds impact analysis |
| `governance-policies/policy-replay-engine.md` | Historical policy versions retrieved for replay |
| `compliance-framework/regulatory-registry.md` | Regulatory changes trigger review cycles here |
| `audit-and-evidence/audit-trail-governance.md` | All registry mutations logged as audit events |
