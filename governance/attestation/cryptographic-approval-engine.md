# Cryptographic Approval Engine

**System ID:** `cryptographic-approval-engine`
**Role:** Issues and verifies cryptographic approval proofs for governance decisions — generates signed attestations for human approvals, gate verdicts, policy decisions, and multi-party authorizations; produces approval records that are verifiable without trusting the approving party's memory or word
**Storage:** `memory/governance-attestation/approval-records.jsonl`

---

## Purpose

"The CISO approved this" is not evidence. A signed, timestamped approval record that can be independently verified — that is evidence. The cryptographic approval engine transforms approval events from ephemeral social facts (someone said yes) into durable cryptographic artifacts (a signed proof that cannot be forged, backdated, or denied). Every approval-requiring action in the zero-trust cognition architecture must carry a valid approval proof. Any action claiming approval that cannot produce the proof is treated as unapproved.

---

## Approval Record Schema

```yaml
ApprovalRecord:
  approval_id: string                  # uuid; stable reference
  approval_type: "HUMAN_APPROVAL | PEER_REVIEW | GATE_VERDICT | POLICY_DECISION | MULTI_PARTY | CONSTITUTIONAL_OVERRIDE"
  
  # What is being approved
  subject:
    subject_type: "WORKFLOW | NODE | ACTION | POLICY_CHANGE | BOUNDARY_CROSSING | CONSTITUTIONAL_OVERRIDE"
    subject_id: string
    run_id: string | null
    description: string                # Human-readable description of what's approved
  
  # The approval decision
  decision: "APPROVED | DENIED | CONDITIONAL_APPROVAL"
  conditions: [string] | null          # For CONDITIONAL_APPROVAL
  
  # Who approved
  approver:
    approver_type: "HUMAN | SYSTEM_GATE | PEER_AGENT"
    approver_id: string
    approver_name: string              # Display name
    approver_authority_level: integer  # 1-5; what they're authorized to approve
  
  # What evidence was reviewed
  evidence_reviewed:
    evidence_hashes: [string]          # SHA-256 of evidence artifacts reviewed
    evidence_summary: string
  
  # Approval context
  approval_context:
    requested_at: datetime
    decided_at: datetime
    time_to_decide_seconds: float
    requested_by: string               # Who/what requested approval
  
  # Validity bounds
  valid_from: datetime                 # When approval takes effect
  valid_until: datetime               # Approval expiry (approvals are time-bounded)
  
  # Cryptographic integrity
  approval_hash: string               # SHA-256 of all fields above
  signature: string                   # Ed25519 signed by governance-signing-key
  signing_key_id: string
  
  # Chain linkage (for multi-party approvals)
  parent_approval_ids: [string]       # For approvals that build on prior approvals
```

---

## Approval Request Protocol

```
request_approval(approval_request) → ApprovalRequest:
  
  # Validate that this action type requires approval
  required_approver = get_required_approver(approval_request.action_type, approval_request.risk_level)
  
  # Check for constitutional approval requirements
  constitutional_verdict = constitutional_ai_governor.evaluate_constitutional_compliance(
    approval_request.subject_content,
    {agent_id: approval_request.requesting_agent_id}
  )
  
  IF constitutional_verdict.verdict == "UNCONSTITUTIONAL_ABSOLUTE":
    RETURN ApprovalRequest(
      status = "REJECTED_UNCONSTITUTIONAL",
      reason = "Subject contains absolute constitutional violations — cannot be approved"
    )
  
  # Build approval request
  request = ApprovalRequest(
    request_id = generate_uuid(),
    approval_type = approval_request.approval_type,
    subject = approval_request.subject,
    required_approver = required_approver,
    evidence_hashes = [sha256(canonical_serialize(e)) for e in approval_request.evidence],
    evidence_summary = approval_request.evidence_summary,
    requested_by = approval_request.requesting_agent_id,
    requested_at = now(),
    expires_at = now() + timedelta(seconds=approval_request.timeout_seconds)
  )
  
  persist_approval_request(request)
  
  # Notify required approver
  notify_approver(required_approver, request)
  
  RETURN request

issue_approval(request_id, approver_decision) → ApprovalRecord:
  
  request = load_approval_request(request_id)
  
  IF request.expires_at < now():
    RAISE ApprovalRequestExpired(request_id)
  
  # Verify approver has authority for this approval type
  approver_manifest = capability_scope_controller.load_manifest(approver_decision.approver_id)
  required_authority = get_required_authority_level(request.approval_type, request.subject.subject_type)
  
  IF approver_manifest.governance.authority_level < required_authority:
    RAISE InsufficientApprovalAuthority(
      f"Approver authority level {approver_manifest.governance.authority_level} insufficient for approval requiring level {required_authority}"
    )
  
  # Constitutional check on approval itself
  IF approver_decision.approver_type == "HUMAN" AND request.approval_type == "CONSTITUTIONAL_OVERRIDE":
    # Constitutional overrides require documentation
    IF NOT approver_decision.override_justification:
      RAISE MissingOverrideJustification("Constitutional overrides require documented justification")
  
  # Build the approval record
  approval_fields = {
    approval_id: generate_uuid(),
    approval_type: request.approval_type,
    subject: request.subject,
    decision: approver_decision.decision,
    conditions: approver_decision.conditions,
    approver: {
      approver_type: approver_decision.approver_type,
      approver_id: approver_decision.approver_id,
      approver_name: approver_decision.approver_name,
      approver_authority_level: approver_manifest.governance.authority_level
    },
    evidence_reviewed: {
      evidence_hashes: request.evidence_hashes,
      evidence_summary: request.evidence_summary
    },
    approval_context: {
      requested_at: request.requested_at,
      decided_at: now(),
      time_to_decide_seconds: (now() - request.requested_at).total_seconds(),
      requested_by: request.requested_by
    },
    valid_from: now(),
    valid_until: now() + timedelta(seconds=APPROVAL_VALIDITY_SECONDS)
  }
  
  approval_hash = sha256(canonical_serialize(approval_fields))
  approval_fields["approval_hash"] = approval_hash
  
  # Sign with governance key
  signature_envelope = execution_signing.sign_artifact(
    approval_fields,
    signing_context = {artifact_type: "APPROVAL_RECORD"}
  )
  
  record = ApprovalRecord(
    **approval_fields,
    signature = signature_envelope.signature,
    signing_key_id = "governance-signing-key-v1"
  )
  
  persist_approval_record(record)
  immutable_audit_log.record(ApprovalAuditEvent(record))
  
  RETURN record
```

---

## Approval Verification

```
verify_approval(approval_id, verification_context) → ApprovalVerificationResult:
  
  record = load_approval_record(approval_id)
  
  IF record is null:
    RETURN ApprovalVerificationResult(valid=False, reason="Approval record not found")
  
  # Check decision
  IF record.decision == "DENIED":
    RETURN ApprovalVerificationResult(
      valid = False,
      reason = f"Approval record exists but decision was DENIED: {record.decision}"
    )
  
  # Check temporal validity
  IF now() > record.valid_until:
    RETURN ApprovalVerificationResult(valid=False, reason=f"Approval expired at {record.valid_until.isoformat()}")
  IF now() < record.valid_from:
    RETURN ApprovalVerificationResult(valid=False, reason="Approval not yet valid")
  
  # Verify cryptographic signature
  sig_valid = execution_signing.verify_artifact(record)
  IF NOT sig_valid.valid:
    RETURN ApprovalVerificationResult(valid=False, reason=f"Approval signature invalid: {sig_valid.reason}")
  
  # Verify approval hash
  approval_fields_without_sig = {k: v for k, v in record.items() if k not in ["signature", "signing_key_id"]}
  expected_hash = sha256(canonical_serialize(approval_fields_without_sig))
  IF expected_hash != record.approval_hash:
    RETURN ApprovalVerificationResult(valid=False, reason="Approval record content tampered")
  
  # Verify subject matches the action being approved
  IF verification_context.expected_subject_id:
    IF record.subject.subject_id != verification_context.expected_subject_id:
      RETURN ApprovalVerificationResult(
        valid = False,
        reason = f"Approval subject mismatch: approval is for '{record.subject.subject_id}', action is for '{verification_context.expected_subject_id}'"
      )
  
  # Check for conditions (CONDITIONAL_APPROVAL)
  IF record.decision == "CONDITIONAL_APPROVAL" AND record.conditions:
    unmet_conditions = check_conditions(record.conditions, verification_context)
    IF unmet_conditions:
      RETURN ApprovalVerificationResult(
        valid = False,
        reason = f"Conditional approval has unmet conditions: {unmet_conditions}"
      )
  
  RETURN ApprovalVerificationResult(
    valid = True,
    approval_id = approval_id,
    decided_at = record.approval_context.decided_at,
    approver_id = record.approver.approver_id,
    valid_until = record.valid_until
  )
```

---

## Multi-Party Approval

```
# Some decisions require multiple approvers (e.g., irreversible CRITICAL actions)

initiate_multi_party_approval(subject, required_approvers) → MultiPartyApprovalSession:
  
  session = MultiPartyApprovalSession(
    session_id = generate_uuid(),
    subject = subject,
    required_approver_ids = [a.approver_id for a in required_approvers],
    required_count = len(required_approvers),  # ALL must approve
    collected_approvals = [],
    status = "PENDING"
  )
  
  FOR approver in required_approvers:
    request_approval(ApprovalRequest(
      approval_type = "MULTI_PARTY",
      subject = subject,
      required_approver = approver,
      session_id = session.session_id
    ))
  
  RETURN session

collect_multi_party_approval(session_id, approval_record) → MultiPartyApprovalStatus:
  
  session = load_session(session_id)
  
  # Verify this approver was required
  IF approval_record.approver.approver_id NOT IN session.required_approver_ids:
    RAISE UnexpectedApprover(approval_record.approver.approver_id)
  
  # Check for duplicate approval from same approver
  IF any(a.approver.approver_id == approval_record.approver.approver_id for a in session.collected_approvals):
    RAISE DuplicateApproval(approval_record.approver.approver_id)
  
  session.collected_approvals.append(approval_record)
  
  IF len(session.collected_approvals) == session.required_count:
    # All approvals collected — finalize
    session.status = "COMPLETE"
    composite_approval = create_composite_approval(session)
    RETURN MultiPartyApprovalStatus(complete=True, composite_approval_id=composite_approval.approval_id)
  
  RETURN MultiPartyApprovalStatus(complete=False, collected=len(session.collected_approvals), required=session.required_count)
```

---

## Approval Authority Matrix

```yaml
ApprovalAuthorityMatrix:
  # Which authority level can approve which action types
  
  actions:
    STANDARD_GATE_CHECK:       required_authority: 1    # Any agent
    HIGH_RISK_GATE:            required_authority: 3    # T3+ agent or human
    IRREVERSIBLE_ACTION:       required_authority: 4    # T4+ human required
    POLICY_CHANGE:             required_authority: 4    # Governance agent or human
    CONSTITUTIONAL_OVERRIDE:   required_authority: 5    # Executive human only
    MCP_HIGH_RISK_TOOL:        required_authority: 3    # Orchestrator-level
    CROSS_BOUNDARY_SECRET:     required_authority: 4    # Governance-level
    MULTI_PARTY_CRITICAL:      required_authority: 5    # Multiple T5 humans
```

---

## Integration

**Called by:**
- `semantic-gateway/mcp-governance-gateway.md` — verifies approval for HIGH/CRITICAL tools
- `trust-boundaries/trust-boundary-registry.md` — checks approval for boundary crossings requiring it
- `trust-boundaries/constitutional-ai-governor.md` — issues approval records for constitutional overrides
- `workflow-engine/dag-engine.md` — verifies approval on human-approval node completion

**Calls:**
- `execution-security/execution-signing.md` — signs all approval records
- `trust-boundaries/constitutional-ai-governor.md` — constitutional check before issuing approval
- `audit-replay/immutable-audit-log.md` — records all approval events

**Reads from:** `memory/governance-attestation/approval-records.jsonl`
**Writes to:** `memory/governance-attestation/approval-records.jsonl`
