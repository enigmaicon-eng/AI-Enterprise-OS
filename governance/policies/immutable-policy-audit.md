# Immutable Policy Audit

## Purpose
Maintains the cryptographically immutable, append-only audit record of every policy decision, feasibility verdict, approval, and constraint evaluation made by the policy-as-code system. The immutable policy audit is distinct from the general enterprise audit trail (audit-trail-governance.md) in that it is specifically optimized for policy replay, regulatory examination, and compliance verification — preserving not just what happened but exactly which policy versions drove each decision, with cryptographic proof that neither the decisions nor the policies have been altered.

---

## Immutable Audit Architecture

```
Policy Events (decisions, verdicts, approvals)
        ↓
[Event Collection]          → normalized event from policy-engine, feasibility-checker, approval-engine
        ↓
[Integrity Computation]     → SHA-256 hash of event content; Ed25519 signature by issuing system
        ↓
[Hash Chain Linking]        → prior_event_hash field links to immediately prior audit record
        ↓
[Append-Only Write]         → written to immutable storage; no modification or deletion
        ↓
[Dual-Copy Anchoring]       → event hash published to external anchor (timestamp authority)
        ↓
[Index Update]              → inverted indexes updated for fast query access
        ↓
[Integrity Verification]    → hash chain verified after every write batch

Storage:
├── policy-audit-chain.jsonl        ← primary append-only chain
├── policy-audit-index.yaml         ← fast-lookup inverted indexes (rebuildable from chain)
├── policy-audit-anchors.jsonl      ← external anchor publication records
└── policy-audit-segments/          ← daily segment files with segment_root_hash
```

---

## Policy Audit Record Schema

```yaml
policy_audit_record:
  record_id: "PAUDIT-{timestamp_ms}-{random_6char}"
  
  event_type: POLICY_DECISION | FEASIBILITY_VERDICT | APPROVAL_GRANTED | APPROVAL_REJECTED | APPROVAL_EXPIRED | CONSTRAINT_VIOLATION | POLICY_ACTIVATED | POLICY_DEPRECATED | POLICY_TEST_FAILED | EMERGENCY_BYPASS
  
  source_reference:
    policy_decision_id: string | null       # POLDEC-* if event_type = POLICY_DECISION
    feasibility_verdict_id: string | null   # FCHK-* if event_type = FEASIBILITY_VERDICT
    approval_id: string | null              # APR-* if approval event
    constraint_id: string | null            # for CONSTRAINT_VIOLATION events
    policy_id: string | null                # for POLICY_ACTIVATED / DEPRECATED / TEST_FAILED
  
  decision_snapshot:
    # For POLICY_DECISION events — complete snapshot of the decision
    actor_id: string
    action_type: string
    resource_id: string
    verdict: ALLOW | DENY | REQUIRE_APPROVAL | ALLOW_WITH_CONDITIONS
    is_hard_deny: boolean | null
    determining_policy_id: string | null
    determining_rule_id: string | null
    determining_policy_version: semver | null
    determining_policy_hash: SHA-256 | null   # hash of the policy version that drove the decision
    evaluation_context_hash: SHA-256 | null   # hash of the evaluation context (for replay)
    conditions_applied: [condition] | null
  
  policy_state_snapshot:
    # For POLICY_DECISION events — reference to the policy set active at decision time
    active_policy_set_hash: SHA-256           # hash of the set of {policy_id:version} pairs
    policy_set_snapshot_ref: string           # reference to reconstructable policy state snapshot
  
  approval_snapshot:
    # For approval events — complete approval record
    approver_id: string | null
    approval_decision: APPROVED | REJECTED | ABSTAINED | null
    approval_rationale: string | null
    approver_signature: Ed25519 | null
    quorum_status: {required: int, received: int, approved: int} | null
  
  timestamp: ISO-8601 (millisecond precision, UTC)
  environment: PRODUCTION | STAGING | DEVELOPMENT | TEST
  
  integrity:
    record_hash: SHA-256                      # hash of all fields above (excluding integrity block)
    prior_record_hash: SHA-256                # hash of immediately prior record (hash chain)
    chain_sequence: int                       # monotonically increasing; globally unique
    issuer_id: string                         # system that issued this record (policy-engine, feasibility-checker, etc.)
    issuer_signature: Ed25519                 # signed by issuing system's private key
    ingestion_countersignature: Ed25519       # countersigned by audit ingestion system
    external_anchor_ref: string | null        # timestamp authority anchor reference (set after anchoring)
```

---

## Hash Chain Protocol

```yaml
hash_chain:
  chain_id: "POLICYCHAIN-PROD"              # separate chain per environment
  
  chain_construction:
    record_hash = SHA-256(
      record_id +
      event_type +
      source_reference (serialized) +
      decision_snapshot (serialized) +
      timestamp +
      issuer_id +
      prior_record_hash
    )
    # Note: integrity block itself is not included in the hash (to avoid circular dependency)
    # The integrity block is appended after hash computation
  
  genesis_record:
    chain_sequence: 0
    prior_record_hash: SHA-256("GENESIS-POLICYCHAIN-PROD-{initialization_timestamp}")
    initialized_at: ISO-8601
    initialization_witness: Tier-4+ signature confirming chain initialization
  
  chain_verification:
    CONTINUOUS: verify each new record's prior_record_hash before writing
    DAILY: full chain walk from genesis to tip; verify every link
    ON_DEMAND: triggered by auditor request or integrity alert
    BEFORE_EXAMINATION: full chain walk before any regulatory examination
  
  segment_anchoring:
    frequency: daily (midnight UTC boundary)
    segment_root_hash: hash of all records in the day's segment, Merkle-tree style
    external_anchor: segment_root_hash published to timestamp authority (RFC 3161 timestamp)
    anchor_record: stored in policy-audit-anchors.jsonl
    purpose: external anchor allows independent verification without trusting enterprise systems
  
  chain_breach_response:
    detection: hash mismatch at any link during verification
    severity: CRITICAL — chain breach may indicate tampering with policy audit
    immediate_actions:
      - halt new record writes
      - preserve current chain state (forensic snapshot)
      - notify Tier-4+ and security team
      - notify compliance governance lead
      - initiate forensic investigation
      - assess whether breach affects regulatory filings (may require regulatory notification)
    note: chain breach must be investigated before any compliance assertion relying on affected records
```

---

## Audit Query Interface

```yaml
audit_query:
  supported_queries:
    GET_decision_record:
      input: policy_decision_id
      returns: full policy_audit_record with integrity fields
      use_when: verifying a specific decision; replay preparation
      performance: p99 < 5ms (direct index lookup)
    
    GET_decisions_for_actor:
      input: actor_id, {from: ISO-8601, to: ISO-8601}
      returns: [policy_audit_record] ordered chronologically
      use_when: actor behavior analysis; compliance investigation
    
    GET_decisions_by_policy:
      input: policy_id, {from: ISO-8601, to: ISO-8601}
      returns: [policy_audit_record] for decisions driven by this policy
    
    GET_decisions_by_obligation:
      input: obligation_id, {from: ISO-8601, to: ISO-8601}
      returns: [policy_audit_record] where policy enforces this obligation
    
    GET_hard_denies:
      input: {from: ISO-8601, to: ISO-8601}, filter_actor: string | null
      returns: all records where is_hard_deny = true
      use_when: verifying constitutional protections were enforced
    
    GET_approval_history:
      input: actor_id | workflow_id, {from: ISO-8601, to: ISO-8601}
      returns: all approval events related to actor/workflow
    
    VERIFY_chain_segment:
      input: {from: ISO-8601, to: ISO-8601}
      returns: chain_integrity_status, any_breaks, break_details
      use_when: pre-examination integrity check; incident investigation
    
    GET_policy_state_at_time:
      input: timestamp
      returns: all policies active at that timestamp with versions
      use_when: replay preparation; historical compliance verification
  
  access_control:
    COMPLIANCE_GOVERNANCE_LEAD: all queries
    AUDITORS: all queries within audit scope
    REGULATORY_EXAMINER: all queries; access managed via pre-examination protocol
    COMPLIANCE_LEADS: queries within their domain only
    GENERAL: no access (policy audit is RESTRICTED)
    all_queries_logged: every query logged as AUDIT_LOG_ACCESSED event in audit-trail-governance.md
```

---

## Retention and Legal Hold

```yaml
retention:
  standard_retention:
    CONSTITUTIONAL_and_REGULATORY_decisions: 10 years
    SECURITY_decisions: 7 years
    AI_GOVERNANCE_decisions: 10 years from AI system decommission (EU AI Act requirement)
    OPERATIONAL_decisions: 5 years
    APPROVAL_records: same as underlying decision category
    EMERGENCY_BYPASS_records: 7 years minimum; extended if any related litigation
  
  legal_hold:
    trigger: litigation hold; regulatory investigation; regulatory examination
    effect: all records matching hold criteria — retention extended; no disposal permitted
    scope: defined by hold notice; may be actor-specific, policy-specific, or time-range-specific
    release: requires same authority as imposition + legal confirmation
  
  disposal:
    eligibility: record older than retention period AND not under legal hold AND not subject to active regulatory matter
    authority: Tier-4+ authorization required
    process: disposal logged in the chain itself as AUDIT_RECORD_DISPOSED event before removal
    prohibition: chain records with active external anchors may not be disposed before anchor expiry
    bulk_disposal: prohibited; must be record-class by record-class with separate authorization
```

---

## Regulatory Filing Verification

```yaml
regulatory_filing_verification:
  purpose: |
    Before submitting any compliance assertion to a regulatory authority, verify
    that the underlying policy audit supports the assertion — that the claimed
    decisions were actually made, under the claimed policies, and the audit chain is intact.
  
  pre_filing_checklist:
    1. identify all decisions referenced in the compliance assertion
    2. retrieve each decision's audit record (GET_decision_record)
    3. verify each record's integrity (hash and signature)
    4. verify the policy version referenced was actually active at decision time (GET_policy_state_at_time)
    5. verify the chain is intact for the period covered (VERIFY_chain_segment)
    6. confirm external anchors exist for all daily segments in the period
    7. confirm no ORIGINAL_NOT_AUDITED gaps for action types in scope
    verification_status: ALL_VERIFIED | PARTIALLY_VERIFIED | VERIFICATION_FAILED
  
  if_VERIFICATION_FAILED:
    action: do not submit; investigate failure; notify legal counsel
    regulatory_impact: submission of unverifiable compliance assertions = regulatory risk
    finding_generated: HIGH finding; investigation required before resubmission
```

---

## Integration Points

| System | Role |
|---|---|
| `policy-as-code/policy-engine.md` | Policy decisions written here as primary source |
| `orchestration-constraints/policy-feasibility-checker.md` | Feasibility verdicts written here |
| `orchestration-constraints/approval-constraint-engine.md` | Approval events written here |
| `governance-policies/policy-replay-engine.md` | Historical audit records retrieved for replay |
| `governance-policies/governance-traceability.md` | Traceability records cross-reference audit records |
| `audit-and-evidence/audit-trail-governance.md` | Policy audit queries themselves logged here |
| `governance-attestation/cryptographic-approval-engine.md` | Ed25519 keys and signing infrastructure |
