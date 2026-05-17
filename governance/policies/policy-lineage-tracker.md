# Policy Lineage Tracker

## Purpose
Maintains the complete provenance chain for every enterprise policy — who authored it, what obligations or principles motivated it, what policies it derives from, how it has evolved across versions, and what decisions it has driven. Policy lineage answers the critical governance question: "Where did this policy come from, and can we trace its logic to a regulatory or constitutional source?" Without lineage, policies are unconnected to the obligations they enforce, making compliance audits difficult and regulatory tracing impossible.

---

## Lineage Model

```
Regulatory Obligation / Constitutional Principle
        ↓ (obligation extraction)
Policy Authorship
        ├── Author: who wrote it
        ├── Approved: who approved it
        ├── Motivation: which obligation/principle drives it
        └── Version history: how it has changed
        ↓ (policy activation)
Policy Decisions
        ├── Decision-1: which rule fired, why, what outcome
        ├── Decision-2: ...
        └── Decision-N: ...
        ↓ (decision effects)
Orchestration Actions
        └── Traceable: action → decision → rule → policy → obligation → regulation
```

---

## Policy Lineage Record

```yaml
policy_lineage_record:
  lineage_id: "LIN-{policy_id}"
  
  policy_identity:
    policy_id: string
    policy_name: string
    domain: string
    category: string
  
  obligation_provenance:
    # The complete set of obligations, principles, and control requirements this policy enforces
    primary_obligations: [{obligation_id, obligation_name, regulation_id, regulation_name}]
    secondary_obligations: [{obligation_id, relevance: string}]   # indirectly addressed obligations
    constitutional_principles: [string]                            # constitutional principles enforced
    control_implementations: [{control_id, control_name, how_this_policy_implements_it}]
    
    obligation_coverage_type:
      DIRECT: policy directly implements the obligation's requirement
      DERIVED: policy derives from another policy that directly implements the obligation
      PARTIAL: policy partially implements the obligation; other policies cover remaining scope
      COMPENSATING: policy provides alternative coverage when primary policy cannot apply
  
  authorship_chain:
    original_creation:
      authored_by: agent_id | human_id
      authored_at: ISO-8601
      motivation: string                   # why was this policy created? (plain language)
      triggering_event: string | null      # e.g., "EU AI Act enforcement date 2026-08-02" or "GDPR audit finding FND-CTL-012"
    
    version_history: [version_lineage_entry]
  
  derivation_chain:
    parent_policies: [{policy_id, policy_name, relationship: SPECIALIZES | EXTENDS | REPLACES | COMPENSATES_FOR}]
    child_policies: [{policy_id, policy_name, relationship}]     # policies derived from this one
    superseded_policies: [{policy_id, deprecated_at, supersession_reason}]
  
  decision_statistics:
    total_decisions_driven: int
    decisions_last_30d: int
    decisions_by_type: {ALLOW: int, DENY: int, REQUIRE_APPROVAL: int, ALLOW_WITH_CONDITIONS: int}
    most_triggered_rule: rule_id
    last_decision_at: ISO-8601
  
  governance_chain:
    approval_history: [{version, approved_by, approved_at, approval_tier, approval_signature}]
    review_history: [{version, reviewed_by, reviewed_at, outcome, notes}]
    exception_history: [{exception_id, granted_at, reason, still_active}]
    # exceptions that carve out specific cases from this policy's scope
  
  cross_references:
    referenced_by_audit_reports: [audit_id]           # audit reports that reference this policy
    referenced_by_findings: [finding_id]              # compliance findings related to this policy
    referenced_by_incidents: [incident_id]            # incidents where this policy was relevant
  
  metadata:
    lineage_created_at: ISO-8601
    lineage_last_updated: ISO-8601
    completeness_score: float (0.0-1.0)               # how complete is the lineage? (obligation links, authorship, etc.)
```

---

## Version Lineage Entry

```yaml
version_lineage_entry:
  version: semver
  status_at_time: DRAFT | STAGED | ACTIVE | DEPRECATED | ARCHIVED
  version_type: MAJOR | MINOR | PATCH
  
  changes:
    change_summary: string
    rules_added: [rule_id]
    rules_modified: [rule_id]
    rules_removed: [rule_id]
    scope_changes: string | null
    effect_changes: string | null
  
  change_motivation:
    triggered_by: REGULATORY_CHANGE | AUDIT_FINDING | INCIDENT | POLICY_REVIEW | OPTIMIZATION | SECURITY_INCIDENT
    triggering_event_id: string | null    # regulation_change_id, finding_id, incident_id, etc.
    change_rationale: string              # why was this change made?
  
  governance:
    changed_by: agent_id | human_id
    approved_by: agent_id | human_id
    approved_at: ISO-8601
    review_period: duration
    staging_divergence_count: int         # how many decisions differed between old and new during staging
  
  backward_compatibility:
    breaking_change: boolean
    affected_workflows: [workflow_id] | null
    migration_required: boolean
    migration_notes: string | null
```

---

## Lineage Query API

```yaml
lineage_api:
  GET_policy_lineage:
    input: policy_id
    returns: complete policy_lineage_record
    use_when: auditor needs full provenance for a specific policy
    performance: p99 < 50ms
  
  TRACE_decision_to_regulation:
    input: policy_decision_id (POLDEC-*)
    returns: {decision → rule → policy_version → obligation → regulation}
    use_when: auditor needs to show a specific enforcement action is backed by regulation
    performance: p99 < 200ms (joins across multiple indices)
  
  GET_policies_for_obligation:
    input: obligation_id
    returns: [policy_id, policy_name, coverage_type, is_active]
    use_when: compliance reporting; obligation coverage analysis
  
  GET_obligation_coverage_gaps:
    input: [obligation_id] or [regulation_id]
    returns: obligations with no active policy coverage
    use_when: compliance audit preparation; regulatory examination readiness
  
  GET_policy_decision_history:
    input: policy_id, {from: ISO-8601, to: ISO-8601}
    returns: all decisions driven by this policy in the period with outcomes
    use_when: policy effectiveness assessment; regulatory examination
  
  GET_derivation_tree:
    input: policy_id
    returns: full parent/child derivation tree (all ancestors and descendants)
    use_when: understanding policy ecosystem; impact analysis for policy changes
  
  GET_cross_policy_coverage:
    input: obligation_id
    returns: all policies providing coverage; coverage overlap map; any gaps
    use_when: ensuring obligation is fully covered; identifying redundancy
```

---

## Lineage Completeness Requirements

```yaml
completeness_requirements:
  MANDATORY_for_all_active_policies:
    - at least one obligation_id or constitutional_principle
    - authorship chain with original_creation record
    - all approvals in approval_history
    - change_motivation for each version
  
  MANDATORY_for_CONSTITUTIONAL_and_REGULATORY_policies:
    - ALL obligations explicitly linked (no partial obligation linkage)
    - derivation_chain complete (all parent policies identified)
    - all exceptions historically documented
    - full decision_statistics (not estimated)
  
  completeness_scoring:
    1.0: all fields populated; all cross-references verified
    0.8–0.99: minor gaps in secondary fields
    0.6–0.79: obligation linkage partial; escalate to policy owner for completion
    < 0.60: INADEQUATE; policy owner must complete within 30 days; block new version approvals until complete
  
  automated_completeness_checks:
    frequency: nightly
    action: report to policy owner and compliance governance lead any policy with completeness < 0.80
    escalation: 30 days with completeness < 0.70 → compliance governance lead mandatory review
```

---

## Lineage for Regulatory Examination

```yaml
regulatory_examination_support:
  pre_examination_preparation:
    trigger: pre-examination preparation protocol activated (audit-management-system.md)
    action: generate complete lineage report for all policies in examination scope
    format: examiner-ready narrative tracing each control to its policies, obligations, and regulations
    verification: all lineage records verified for completeness; gaps remediated before examination
  
  examiner_lineage_queries:
    supported_queries:
      - "Show me which policies enforce GDPR Article X"
      - "What regulation requires this control?"
      - "Who approved this policy and when?"
      - "How has this policy changed since last examination?"
      - "Were any exceptions granted to this policy?"
    response_format: structured lineage report + supporting evidence references
    legal_review: all lineage materials reviewed by legal counsel before delivery to examiner
  
  obligation_traceability_report:
    purpose: demonstrate to examiner that every obligation has policy coverage
    format:
      per_obligation:
        obligation_id: string
        regulation_name: string
        covering_policies: [policy summary]
        control_implementations: [control summary]
        evidence_available: [evidence summary]
        gaps: [gap description] | none
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-registry.md` | Policy versions and governance records sourced here |
| `policy-as-code/policy-engine.md` | Decision records link back to policy versions for lineage |
| `compliance-framework/regulatory-registry.md` | Obligation and regulation metadata |
| `compliance-framework/control-catalog.md` | Control-to-policy mappings |
| `governance-policies/governance-traceability.md` | Policy lineage is the policy layer of the full governance trace |
| `audit-and-evidence/audit-management-system.md` | Lineage reports used in audit fieldwork |
| `governance-policies/policy-replay-engine.md` | Historical lineage versions needed for accurate replay |
