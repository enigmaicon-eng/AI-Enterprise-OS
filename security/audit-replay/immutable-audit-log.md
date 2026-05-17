# Immutable Audit Log

**System ID:** `immutable-audit-log`
**Role:** Provides the enterprise-wide, cryptographically chained, append-only audit log — records every security decision, governance action, constitutional verdict, permission grant, trust boundary crossing, and execution event in a tamper-evident chain; serves as the ground truth for compliance, forensics, and governance replay
**Storage:** `memory/audit-replay/audit-chain.jsonl` + `memory/audit-replay/audit-index.yaml`

---

## Purpose

An audit log that can be modified after the fact provides no assurance. An audit log without cryptographic chaining cannot prove that records haven't been deleted or reordered. The immutable audit log solves both problems: every record is signed, every record includes the hash of the previous record, and the chain can be independently verified from any point. Deleting or modifying a record breaks the chain — and the break is detectable. No agent can write to the audit log except through this system, and no agent can delete from it at all.

---

## Audit Record Schema

```yaml
AuditRecord:
  record_id: string                    # uuid; globally unique
  sequence_number: integer             # Monotonically increasing; no gaps allowed
  
  # Chain linkage
  previous_record_hash: string         # SHA-256 of the previous record (genesis = "0"×64)
  
  # Event information
  event_type: string                   # See taxonomy below
  event_category: "SECURITY | GOVERNANCE | EXECUTION | CONSTITUTIONAL | TRUST | ATTESTATION"
  severity: "DEBUG | INFO | WARNING | HIGH | CRITICAL"
  
  # Who/what generated this event
  actor:
    actor_type: "SYSTEM | AGENT | HUMAN"
    actor_id: string
    actor_trust_tier: string | null
  
  # What happened
  subject:
    subject_type: string               # "WORKFLOW | NODE | AGENT | PERMISSION | BOUNDARY | ..."
    subject_id: string
    run_id: string | null
    node_id: string | null
  
  # Decision/outcome
  outcome: "ALLOWED | DENIED | BLOCKED | SANITIZED | FLAGGED | QUARANTINED | ESCALATED"
  outcome_reason: string | null
  
  # Evidence
  evidence_hash: string | null         # SHA-256 of the payload that triggered this record
  evidence_summary: string             # Human-readable summary (NOT the payload itself)
  
  # Timestamp and chain
  recorded_at: datetime
  record_hash: string                  # SHA-256 of all above fields + previous_record_hash
  
  # Cryptographic signature
  signature: string                    # Ed25519 signature from audit-signing-key
  signing_key_id: string
```

---

## Event Taxonomy

```yaml
AuditEventType:
  
  # Security events
  FIREWALL_DECISION:             # semantic-firewall decision
  INJECTION_DETECTED:            # prompt injection found
  INJECTION_BLOCKED:             # injection blocked before execution
  SCOPE_VIOLATION:               # capability scope exceeded
  TOOL_INTENT_VIOLATION:         # tool intent check failed
  MCP_CALL_BLOCKED:              # MCP governance gateway blocked
  MCP_CALL_ALLOWED:              # MCP call permitted (HIGH/CRITICAL risk tools)
  CREDENTIAL_LEAK_PREVENTED:     # Credential stripped from output
  
  # Permission events
  PERMISSION_GRANT_ISSUED:       # Least privilege grant created
  PERMISSION_GRANT_REVOKED:      # Grant revoked
  EPHEMERAL_TOKEN_ISSUED:        # Token issued
  EPHEMERAL_TOKEN_REVOKED:       # Token revoked
  EPHEMERAL_TOKEN_REJECTED:      # Token verification failed
  PERMISSION_CHECK_DENIED:       # Specific permission check denied
  
  # Trust boundary events
  BOUNDARY_CROSSING_ALLOWED:     # Cross-zone communication permitted
  BOUNDARY_CROSSING_DENIED:      # Cross-zone communication blocked
  CONFIDENCE_BELOW_THRESHOLD:    # Confidence score below boundary minimum
  ZONE_VIOLATION:                # Agent operating outside its zone
  
  # Constitutional events
  CONSTITUTIONAL_CLEAR:          # Constitutional evaluation passed
  CONSTITUTIONAL_ADVISORY:       # Advisory violation flagged
  CONSTITUTIONAL_MANDATORY_VIOLATION:   # Mandatory violation blocked
  CONSTITUTIONAL_ABSOLUTE_VIOLATION:    # Absolute violation blocked
  CONSTITUTIONAL_OVERRIDE:       # Human override of mandatory violation (highest severity)
  
  # Governance events
  GATE_VERDICT_ISSUED:           # Quality gate verdict
  GATE_PASSED:                   # Gate check passed
  GATE_FAILED:                   # Gate check failed
  APPROVAL_REQUESTED:            # Human approval requested
  APPROVAL_GRANTED:              # Human approval granted
  APPROVAL_DENIED:               # Human approval denied
  APPROVAL_ATTESTATION_CREATED:  # Cryptographic approval attestation issued
  
  # Hallucination events
  HALLUCINATION_DETECTED:        # Hallucination found in output
  HALLUCINATION_CONTAINED:       # Output quarantined/blocked due to hallucination
  OUTPUT_ANNOTATED_FOR_UNCERTAINTY:  # Output annotated but not blocked
  
  # Execution events
  WORKFLOW_STARTED:              # Workflow run initiated
  WORKFLOW_COMPLETED:            # Workflow completed successfully
  WORKFLOW_FAILED:               # Workflow failed
  WORKFLOW_CANCELLED:            # Workflow cancelled
  NODE_SUCCEEDED:                # Node completed successfully
  NODE_FAILED:                   # Node failed
  SANDBOX_EXECUTION:             # Sandbox used for isolation
  SANDBOX_VIOLATION:             # Violation detected within sandbox
```

---

## Append Protocol

```
record(event, urgency="NORMAL") → record_id:
  
  # Step 1: Get next sequence number (atomic)
  seq = atomic_increment(audit_chain_sequence_counter)
  
  # Step 2: Get previous record hash (for chain linkage)
  prev_hash = get_last_record_hash()
  
  # Step 3: Build record
  record = AuditRecord(
    record_id = generate_uuid(),
    sequence_number = seq,
    previous_record_hash = prev_hash,
    
    event_type = event.event_type,
    event_category = event.event_category,
    severity = event.severity,
    
    actor = event.actor,
    subject = event.subject,
    outcome = event.outcome,
    outcome_reason = event.outcome_reason,
    
    evidence_hash = sha256(canonical_serialize(event.evidence)) if event.evidence else null,
    evidence_summary = event.evidence_summary,
    
    recorded_at = now()
  )
  
  # Step 4: Compute record hash (commits all fields into chain)
  record_content = canonical_serialize({
    record_id: record.record_id,
    sequence_number: record.sequence_number,
    previous_record_hash: record.previous_record_hash,
    event_type: record.event_type,
    actor: record.actor,
    subject: record.subject,
    outcome: record.outcome,
    recorded_at: record.recorded_at.isoformat()
  })
  record.record_hash = sha256(record_content)
  
  # Step 5: Sign the record
  record.signature = execution_signing.sign_artifact(
    record,
    signing_context = {artifact_type: "AUDIT_LOG_ENTRY"}
  ).signature
  record.signing_key_id = AUDIT_SIGNING_KEY_ID
  
  # Step 6: Write-ahead append (fsync before returning)
  append_to_chain(record)
  update_chain_head(record.record_hash)
  update_audit_index(record)
  
  RETURN record.record_id

# CRITICAL: append_to_chain never overwrites; never deletes
# Any attempt to modify an existing record is a critical security event
```

---

## Chain Verification

```
verify_chain(start_sequence=0, end_sequence=null) → ChainVerificationResult:
  
  records = load_records_in_range(start_sequence, end_sequence)
  
  issues = []
  prev_hash = "0" × 64  # Genesis hash
  
  FOR record in records:
    
    # Check sequence continuity (no gaps)
    IF record.sequence_number != expected_sequence:
      issues.append(ChainIssue(
        type = "SEQUENCE_GAP",
        at_sequence = expected_sequence,
        found_sequence = record.sequence_number,
        severity = "CRITICAL"
      ))
    
    # Check chain linkage
    IF record.previous_record_hash != prev_hash:
      issues.append(ChainIssue(
        type = "CHAIN_BREAK",
        at_sequence = record.sequence_number,
        expected_prev_hash = prev_hash[:16] + "...",
        found_prev_hash = record.previous_record_hash[:16] + "...",
        severity = "CRITICAL"
      ))
    
    # Verify record hash
    recomputed_content = canonical_serialize({...same fields as append...})
    recomputed_hash = sha256(recomputed_content)
    IF recomputed_hash != record.record_hash:
      issues.append(ChainIssue(
        type = "RECORD_TAMPERED",
        at_sequence = record.sequence_number,
        severity = "CRITICAL"
      ))
    
    # Verify signature
    sig_valid = execution_signing.verify_artifact(record)
    IF NOT sig_valid.valid:
      issues.append(ChainIssue(
        type = "SIGNATURE_INVALID",
        at_sequence = record.sequence_number,
        severity = "CRITICAL"
      ))
    
    prev_hash = record.record_hash
    expected_sequence = record.sequence_number + 1
  
  RETURN ChainVerificationResult(
    verified = (len(issues) == 0),
    records_verified = len(records),
    issues = issues,
    chain_head_hash = prev_hash
  )
```

---

## Query API

```
query_audit_log(filters) → [AuditRecord]:
  # Filters: event_type, event_category, actor_id, run_id, outcome, start_time, end_time, severity
  RETURN query_audit_index(filters)

get_security_timeline(run_id) → [AuditRecord]:
  # All security events for a specific workflow run
  RETURN query_audit_log({run_id: run_id, event_category: ["SECURITY", "CONSTITUTIONAL", "TRUST"]})

get_agent_audit_trail(agent_id, window_hours=24) → [AuditRecord]:
  # Full audit trail for an agent
  RETURN query_audit_log({actor_id: agent_id, start_time: now() - window_hours × 3600})

get_constitutional_record(run_id) → [AuditRecord]:
  RETURN query_audit_log({run_id: run_id, event_category: "CONSTITUTIONAL"})
```

---

## Anti-Tamper Protections

```yaml
AntiTamperMechanisms:
  
  write_ahead_log:
    description: "fsync before returning — no record is considered written until durable"
    enforcement: "OS-level durability guarantee"
  
  append_only:
    description: "No UPDATE or DELETE operations on audit records"
    enforcement: "File permissions + application-level enforcement"
    violation_action: "CRITICAL audit event recorded + immediate alert"
  
  cryptographic_chain:
    description: "Breaking or deleting any record breaks the chain — detectable"
    verification: "Chain verified on every audit query"
  
  signature_verification:
    description: "Every record signed with audit-signing-key — tampering detectable"
    key_rotation: "Annual; old signatures remain verifiable during grace period"
  
  deletion_prohibition:
    constitutional_basis: "C-011 prohibits any agent from deleting audit records"
    technical_enforcement: "Filesystem ACL + application gate"
```

---

## Integration

**Called by:** Every security system in the OS — mandatory; no security decision is complete without an audit record

**Calls:** `execution-security/execution-signing.md` — signs every audit record

**Must NOT be called by:** Any agent attempting to modify or delete records (blocked by C-011)

**Reads from:** `memory/audit-replay/audit-chain.jsonl`
**Writes to:** `memory/audit-replay/audit-chain.jsonl` (append-only)
