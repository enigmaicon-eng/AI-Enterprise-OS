# Governance Traceability

## Purpose
Provides end-to-end traceability from every enterprise action back through the governance chain to the regulatory obligation, constitutional principle, or business decision that authorized it. Governance traceability is the answer to the auditor's fundamental question: "For every consequential action this AI system took, can you show us the authority chain?" It stitches together the audit trail, policy decisions, constraint evaluations, approval records, delegation chains, and regulatory obligations into a single navigable lineage — making the enterprise's governance architecture legible to regulators, auditors, and boards.

---

## Traceability Chain

```
Enterprise Action (audit event)
        │
        ├─ Executed by: Actor (agent/human)
        │   └─ Operating under: Delegation (if applicable)
        │       └─ Granted by: Authority chain
        │           └─ Traceable to: Human principal
        │
        ├─ Authorized by: Execution Token
        │   └─ Issued by: Policy Feasibility Checker
        │       ├─ Policy Decision: ALLOW / ALLOW_WITH_CONDITIONS
        │       │   └─ Determined by: Policy Rule
        │       │       └─ In: Policy Version
        │       │           └─ Enforces: Obligation / Principle
        │       │               └─ Sourced from: Regulation / Constitution
        │       │
        │       ├─ Constraint Verdict: FEASIBLE
        │       │   └─ Against: Active Constraint Set
        │       │       └─ Derived from: Policy / Obligation / Risk
        │       │
        │       └─ Approval (if REQUIRE_APPROVAL):
        │           └─ Approved by: Authorized approver(s)
        │               └─ With independence verified
        │
        └─ Logged in: Audit Trail (hash-chained, Ed25519 signed)
            └─ Retained for: Regulatory retention period
```

---

## Traceability Record Schema

```yaml
traceability_record:
  trace_id: "TRACE-{audit_event_id}"
  
  action:
    audit_event_id: string             # from audit-trail-governance.md
    action_type: string
    actor_id: string
    actor_tier: int
    executed_at: ISO-8601
    outcome: SUCCESS | FAILURE | BLOCKED
  
  authority_chain:
    direct_actor: {agent_id | human_id, tier, trust_score_at_time}
    delegation_chain: [{delegator_id, delegatee_id, delegation_id, delegated_at, scope}]
    originating_human_authority: {human_id, tier, role}
    chain_depth: int
    chain_integrity_verified: boolean   # delegation chain hash-verified
  
  policy_authorization:
    feasibility_verdict_id: string
    policy_decision_id: string         # POLDEC-*
    policy_id: string
    policy_version: semver
    rule_id: string
    rule_name: string
    decision: ALLOW | ALLOW_WITH_CONDITIONS | REQUIRE_APPROVAL
    conditions_applied: [condition] | null
    approval_id: string | null         # if REQUIRE_APPROVAL was resolved
    policy_hash_at_time: SHA-256       # which exact policy version was evaluated
  
  obligation_linkage:
    primary_obligation_ids: [obligation_id]    # obligations the policy enforces
    regulation_ids: [regulation_id]            # regulations that obligation derives from
    constitutional_principles_applied: [string]
    control_ids: [control_id]                  # controls the policy operationalizes
  
  constraint_evaluation:
    constraint_verdict_id: string              # from constraint-solver
    constraints_evaluated: [{constraint_id, result: SATISFIED | VIOLATED | WARNING}]
    hard_constraints_verified: boolean
    soft_constraint_warnings: [string]
  
  evidence_linkage:
    related_evidence_ids: [evidence_id]        # evidence collected for or by this action
    evidence_collection_triggered: boolean     # did this action trigger evidence collection?
  
  integrity:
    trace_hash: SHA-256                        # hash of all fields above
    prior_trace_hash: SHA-256                  # hash chain with prior trace
    system_signature: Ed25519                  # signed by traceability system
  
  metadata:
    trace_generated_at: ISO-8601
    regulatory_frameworks_applicable: [string]  # which frameworks this action is relevant to
    retained_until: ISO-8601
    classification: CONFIDENTIAL
```

---

## Traceability Index

```yaml
traceability_index:
  by_actor_id: all traces for a specific actor
  by_audit_event_id: trace for a specific audit event (1:1 mapping)
  by_policy_id: all traces where a specific policy drove the decision
  by_obligation_id: all traces where a specific obligation was enforced
  by_regulation_id: all traces relevant to a specific regulation
  by_workflow_id: all traces within a specific workflow
  by_time_range: all traces within a time window
  by_action_type: all traces for a specific action type
  
  performance:
    all_indexes: inverted index; lookups p99 < 10ms
    full_trace_retrieval: p99 < 50ms (by audit_event_id; direct lookup)
    obligation_coverage_query: p99 < 200ms (fan-out across obligation → policy → decision)
```

---

## Traceability Coverage Analysis

```yaml
coverage_analysis:
  purpose: |
    Continuously verify that all consequential actions are traceable —
    that no action occurs without a corresponding governance trace.
  
  coverage_check:
    frequency: daily
    method:
      1. pull all audit events from audit-trail-governance.md for the period
      2. for each audit event with action_category in [WRITE, EXECUTE, DELEGATE, APPROVE, CONFIGURE, DECOMMISSION]:
         verify a corresponding traceability_record exists
      3. report events with no trace as coverage_gaps
    
    coverage_rate_target: 100% for WRITE/EXECUTE/DELEGATE/APPROVE/CONFIGURE/DECOMMISSION
    coverage_rate_for_READ: 90% minimum (READ events may be sampled for high-volume systems)
  
  coverage_gap_classification:
    MISSING_TRACE:
      definition: action occurred; no traceability record exists
      severity: HIGH (implies action executed outside governance framework)
      action: generate finding; investigate whether policy engine was bypassed
    
    INCOMPLETE_TRACE:
      definition: trace exists but obligation linkage or delegation chain is missing
      severity: MEDIUM (traceability partial; may be insufficient for regulatory examination)
      action: flag for completion; notify compliance governance lead
    
    ORPHANED_TRACE:
      definition: trace exists but referenced audit_event_id does not exist in audit trail
      severity: CRITICAL (audit trail tampering possible; or traceability system error)
      action: CRITICAL alert; investigation; audit trail integrity check
```

---

## Regulatory Traceability Reports

```yaml
regulatory_traceability_reports:
  GDPR_Article_30_Records_of_Processing:
    scope: all data processing actions in time period
    trace_content: actor, legal_basis, categories_processed, purposes, retention_period, recipients
    obligation_linkage: OBL-GDPR-030 and all GDPR data processing obligations
    format: per-processing-activity record with full authorization chain
  
  EU_AI_Act_Article_12_Logging:
    scope: all high-risk AI system operations
    trace_content: ai_system_id, decision_type, human_review_status, conformity_assessment_reference
    obligation_linkage: OBL-EUAIACT-012 and human oversight obligations
    format: per-decision log with human oversight chain
  
  SOC2_CC7_Activity_Monitoring:
    scope: all system activity relevant to SOC2 common criteria CC7
    trace_content: activity_type, actor, authorization, outcome, anomalies
    format: activity monitoring report with governance attestation
  
  ISO27001_Annex_A_Access_Control:
    scope: all access control decisions (GRANTED, DENIED, ELEVATED)
    trace_content: requestor, resource, access_level, policy_basis, outcome
    format: access control log with policy linkage
```

---

## Automated Traceability Generation

```yaml
automated_generation:
  trigger: every audit event with action_category in covered_categories
  latency: traceability record generated within 5 seconds of audit event
  process:
    1. receive audit_event (via enterprise event bus subscription)
    2. lookup associated policy_decision_id from session context
    3. lookup delegation_chain from inter-agent-messaging session context
    4. lookup constraint_verdict_id from constraint-solver session cache
    5. resolve obligation linkage from policy lineage tracker
    6. assemble traceability_record; compute hashes; sign
    7. write to traceability index and hash chain
  
  failure_handling:
    if_policy_decision_missing: flag as MISSING_AUTHORIZATION; generate finding; do not suppress
    if_delegation_chain_missing: flag as MISSING_AUTHORITY_CHAIN; generate finding
    if_obligation_linkage_missing: flag as INCOMPLETE_TRACE; queue for async completion
    never_create_empty_trace: partial traces are better than none; always include what is known
  
  async_enrichment:
    purpose: some linkages (evidence, regulatory framework) resolved asynchronously
    mechanism: background enrichment job runs within 30 minutes of trace creation
    completeness_update: completeness_score updated after enrichment
```

---

## Integration Points

| System | Role |
|---|---|
| `audit-and-evidence/audit-trail-governance.md` | Audit events trigger trace generation; trace links back to events |
| `policy-as-code/policy-engine.md` | Policy decisions (POLDEC-*) linked into trace |
| `orchestration-constraints/policy-feasibility-checker.md` | Feasibility verdicts linked into trace |
| `orchestration-constraints/approval-constraint-engine.md` | Approval records linked into trace |
| `delegation-and-trust/delegation-model.md` | Delegation chains resolved for authority chain |
| `governance-policies/policy-lineage-tracker.md` | Obligation linkage resolved from policy lineage |
| `compliance-framework/regulatory-registry.md` | Regulation metadata for regulatory framework tagging |
| `governance-policies/immutable-policy-audit.md` | Traceability records written to immutable audit storage |
