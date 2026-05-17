# Approval Chain Verifier

**System ID:** `approval-chain-verifier`
**Role:** Verifies complete approval chains for multi-step governance decisions — reconstructs the full approval sequence for an action, validates each link in the chain, detects gaps or forgeries, verifies authority delegation is valid at each step, and certifies that the complete chain satisfies the required governance policy
**Storage:** `memory/governance-attestation/chain-verifications.jsonl`

---

## Purpose

Complex governance decisions don't happen in a single approval. A critical workflow execution may require: a quality gate to pass, a peer review to approve, a T4 governance agent to sign off, and a T5 executive to authorize. Each approval builds on the previous. If any link in the chain is invalid — if the quality gate verdict was fabricated, if the peer reviewer lacked authority, if the executive approval used a tampered record — the entire chain is invalid. The approval chain verifier reconstructs and validates the complete chain before treating the final approval as legitimate.

---

## Approval Chain Model

```yaml
ApprovalChain:
  chain_id: string
  subject_id: string                   # What this chain approves
  subject_type: string
  
  required_chain: [ChainRequirement]   # What the policy says must be in the chain
  
  collected_links: [ChainLink]         # Approval records collected so far
  
  status: "INCOMPLETE | COMPLETE | VERIFIED | INVALID"
  
  verified_at: datetime | null
  verification_result: ChainVerificationResult | null

ChainRequirement:
  step: integer                        # Ordered step (1 = first)
  requirement_type: "GATE_VERDICT | HUMAN_APPROVAL | PEER_REVIEW | POLICY_DECISION | CONSTITUTIONAL_CLEARANCE"
  required_approver_type: string | null
  required_authority_level: integer
  prerequisite_steps: [integer]        # Prior steps that must be VERIFIED first
  description: string

ChainLink:
  step: integer
  requirement_type: string
  attestation_id: string              # Links to attestation-registry
  approval_record_id: string          # Links to approval record
  link_hash: string                   # Integrity link: SHA-256(approval_record_id + attestation_id + step)
  collected_at: datetime
```

---

## Chain Definition Policies

```yaml
# What approval chains are required for various action types

ApprovalChainPolicies:
  
  IRREVERSIBLE_CRITICAL_ACTION:
    description: "Actions that cannot be undone and affect critical systems"
    required_chain:
      - step: 1
        requirement_type: CONSTITUTIONAL_CLEARANCE
        required_authority_level: 1     # Any system can issue this
        description: "Constitutional evaluation must pass"
      
      - step: 2
        requirement_type: GATE_VERDICT
        required_authority_level: 1
        prerequisite_steps: [1]
        description: "Quality gate must pass"
      
      - step: 3
        requirement_type: PEER_REVIEW
        required_authority_level: 3
        prerequisite_steps: [1, 2]
        description: "T3+ peer review approval"
      
      - step: 4
        requirement_type: HUMAN_APPROVAL
        required_authority_level: 4
        prerequisite_steps: [1, 2, 3]
        description: "T4+ governance human approval"
  
  POLICY_CHANGE:
    required_chain:
      - step: 1
        requirement_type: CONSTITUTIONAL_CLEARANCE
        required_authority_level: 1
      - step: 2
        requirement_type: POLICY_DECISION
        required_authority_level: 4
        prerequisite_steps: [1]
      - step: 3
        requirement_type: HUMAN_APPROVAL
        required_authority_level: 5
        prerequisite_steps: [1, 2]
  
  CONSTITUTIONAL_OVERRIDE:
    required_chain:
      - step: 1
        requirement_type: HUMAN_APPROVAL
        required_authority_level: 5
        description: "Primary T5 human approval with justification"
      - step: 2
        requirement_type: HUMAN_APPROVAL
        required_authority_level: 5
        prerequisite_steps: [1]
        description: "Second independent T5 human approval (two-person rule)"
  
  STANDARD_WORKFLOW:
    required_chain:
      - step: 1
        requirement_type: CONSTITUTIONAL_CLEARANCE
        required_authority_level: 1
      - step: 2
        requirement_type: GATE_VERDICT
        required_authority_level: 1
        prerequisite_steps: [1]
```

---

## Chain Verification Protocol

```
verify_approval_chain(subject_id, action_type, collected_approval_ids) → ChainVerificationResult:
  
  # Load required chain policy
  policy = load_chain_policy(action_type)
  IF policy is null:
    RETURN ChainVerificationResult(
      verified = False,
      reason = f"No chain policy found for action type '{action_type}'"
    )
  
  # Map collected approvals to chain steps
  collected_by_type = {}
  FOR approval_id in collected_approval_ids:
    attestation = attestation_registry.find_attestation(subject_id=subject_id)
    IF attestation:
      collected_by_type[attestation.attestation_type] = attestation
  
  # Verify each required step in order
  step_results = {}
  
  FOR requirement in sorted(policy.required_chain, key=lambda r: r.step):
    
    # Check prerequisites first
    FOR prereq_step in requirement.prerequisite_steps:
      IF step_results.get(prereq_step, {}).get("verified") != True:
        step_results[requirement.step] = {
          verified = False,
          reason = f"Prerequisite step {prereq_step} not verified"
        }
        CONTINUE
    
    # Find matching attestation for this step
    matching_attestation = collected_by_type.get(requirement.requirement_type)
    
    IF not matching_attestation:
      step_results[requirement.step] = {
        verified = False,
        reason = f"No attestation found for required step {requirement.step} ({requirement.requirement_type})"
      }
      CONTINUE
    
    # Verify the attestation
    attest_valid = attestation_registry.verify_attestation(matching_attestation.attestation_id)
    IF NOT attest_valid.valid:
      step_results[requirement.step] = {
        verified = False,
        reason = f"Step {requirement.step} attestation invalid: {attest_valid.reason}"
      }
      CONTINUE
    
    # Verify authority level
    IF attest_valid.attested_by:
      approver_manifest = capability_scope_controller.load_manifest(attest_valid.attested_by)
      IF approver_manifest and approver_manifest.governance.authority_level < requirement.required_authority_level:
        step_results[requirement.step] = {
          verified = False,
          reason = f"Step {requirement.step}: approver authority level {approver_manifest.governance.authority_level} < required {requirement.required_authority_level}"
        }
        CONTINUE
    
    # Step verified
    step_results[requirement.step] = {
      verified = True,
      attestation_id = matching_attestation.attestation_id
    }
  
  # All steps must be verified
  all_verified = all(r.get("verified") for r in step_results.values())
  failed_steps = [step for step, r in step_results.items() if not r.get("verified")]
  
  result = ChainVerificationResult(
    verified = all_verified,
    subject_id = subject_id,
    action_type = action_type,
    step_results = step_results,
    failed_steps = failed_steps,
    failure_reasons = [step_results[s]["reason"] for s in failed_steps],
    verified_at = now() if all_verified else null
  )
  
  persist_verification(result)
  immutable_audit_log.record(ChainVerificationAuditEvent(result))
  
  RETURN result
```

---

## Authority Delegation Verification

```
verify_authority_delegation(delegating_agent_id, receiving_agent_id, action_type) → DelegationVerificationResult:
  
  # Verify that authority was legitimately delegated
  # (e.g., T5 executive delegating T4 approval authority for a specific scope)
  
  delegator_manifest = capability_scope_controller.load_manifest(delegating_agent_id)
  receiver_manifest = capability_scope_controller.load_manifest(receiving_agent_id)
  
  # Delegator must have higher authority than what they're delegating
  required_authority = get_required_authority_level(action_type)
  
  IF delegator_manifest.governance.authority_level < required_authority:
    RETURN DelegationVerificationResult(
      valid = False,
      reason = f"Delegator '{delegating_agent_id}' (level {delegator_manifest.governance.authority_level}) lacks authority to delegate level {required_authority}"
    )
  
  # Check for explicit delegation record
  delegation = find_delegation_record(delegating_agent_id, receiving_agent_id, action_type)
  
  IF NOT delegation:
    RETURN DelegationVerificationResult(
      valid = False,
      reason = f"No delegation record found from '{delegating_agent_id}' to '{receiving_agent_id}' for '{action_type}'"
    )
  
  # Verify delegation is current
  IF delegation.expires_at < now():
    RETURN DelegationVerificationResult(
      valid = False,
      reason = f"Delegation expired at {delegation.expires_at.isoformat()}"
    )
  
  # Verify delegation attestation
  delegation_attest = attestation_registry.verify_attestation(delegation.attestation_id)
  IF NOT delegation_attest.valid:
    RETURN DelegationVerificationResult(
      valid = False,
      reason = f"Delegation attestation invalid: {delegation_attest.reason}"
    )
  
  RETURN DelegationVerificationResult(valid=True, delegation_id=delegation.delegation_id)
```

---

## Chain Verification Result Schema

```yaml
ChainVerificationResult:
  verification_id: string
  verified: boolean
  
  subject_id: string
  action_type: string
  
  step_results:
    [step_number]:
      verified: boolean
      attestation_id: string | null
      reason: string | null
  
  failed_steps: [integer]
  failure_reasons: [string]
  
  verified_at: datetime | null
  
  verification_hash: string            # SHA-256 of result for audit integrity
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — verifies approval chain before executing HIGH_RISK or CRITICAL nodes
- `governance-attestation/cryptographic-approval-engine.md` — validates chain completeness before issuing final approval
- `trust-boundaries/trust-boundary-registry.md` — for boundary crossings requiring multi-step approval chain

**Calls:**
- `governance-attestation/attestation-registry.md` — queries and verifies attestations
- `execution-security/capability-scope-controller.md` — loads manifests for authority verification
- `audit-replay/immutable-audit-log.md` — records all chain verifications

**Writes to:** `memory/governance-attestation/chain-verifications.jsonl`
