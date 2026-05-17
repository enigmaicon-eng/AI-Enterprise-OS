# Attestation Registry

**System ID:** `attestation-registry`
**Role:** Maintains the authoritative registry of all governance attestations issued by the enterprise AI OS — indexes approval records, policy bindings, execution certifications, and compliance attestations; provides fast lookup for attestation verification and serves as the single source of truth for "has this action been properly attested?"
**Storage:** `memory/governance-attestation/attestation-registry.yaml`

---

## Purpose

An approval record is only valuable if it can be quickly retrieved and verified at the point of decision. The attestation registry is the lookup layer: given an action, can we immediately answer "does a valid attestation exist for this?" without scanning every approval record. It also provides the registry of attestation types — defining what must be attested, by whom, and at what frequency — and tracks attestation coverage gaps (actions that required attestation but have none).

---

## Attestation Types

```yaml
AttestationType:
  
  EXECUTION_APPROVAL:
    description: "Approval for a specific workflow execution action"
    issued_by: ["HUMAN", "SYSTEM_GATE", "PEER_AGENT"]
    validity_duration_seconds: 3600
    required_for: ["IRREVERSIBLE_ACTIONS", "HIGH_RISK_NODES", "CROSS_BOUNDARY_ACTIONS"]
  
  GATE_CERTIFICATION:
    description: "Certification that output has passed a specific quality gate"
    issued_by: ["SYSTEM_GATE"]
    validity_duration_seconds: 86400    # 24h — gate results valid for a day
    required_for: ["WORKFLOW_COMPLETION", "ARTIFACT_PUBLISHING"]
  
  POLICY_COMPLIANCE:
    description: "Certification that an action complies with a specific policy"
    issued_by: ["GOVERNANCE_AGENT", "HUMAN"]
    validity_duration_seconds: 604800   # 7 days
    required_for: ["POLICY_CHANGE_DEPLOYMENT", "SECURITY_EXCEPTION"]
  
  CAPABILITY_GRANT:
    description: "Attestation that an agent has been granted specific capabilities"
    issued_by: ["GOVERNANCE_AGENT"]
    validity_duration_seconds: 2592000  # 30 days
    required_for: ["ELEVATED_TOOL_ACCESS", "MCP_SERVER_REGISTRATION"]
  
  CONSTITUTIONAL_CLEARANCE:
    description: "Certification that an action/output passed constitutional evaluation"
    issued_by: ["CONSTITUTIONAL_AI_GOVERNOR"]
    validity_duration_seconds: 3600
    required_for: ["ALL_SIGNIFICANT_ACTIONS"]
  
  MULTI_PARTY_AUTHORIZATION:
    description: "Composite attestation from multiple required approvers"
    issued_by: ["CRYPTOGRAPHIC_APPROVAL_ENGINE"]
    validity_duration_seconds: 7200
    required_for: ["CRITICAL_RISK_ACTIONS", "CONSTITUTIONAL_OVERRIDES"]
  
  AUDIT_CERTIFICATION:
    description: "Certification that audit chain is intact and unmodified"
    issued_by: ["IMMUTABLE_AUDIT_LOG"]
    validity_duration_seconds: 43200    # 12h
    required_for: ["COMPLIANCE_REPORTS", "FORENSIC_EXPORTS"]

Attestation:
  attestation_id: string
  attestation_type: string
  
  # What is attested
  subject:
    subject_type: string
    subject_id: string
    subject_hash: string               # SHA-256 of the attested subject content
  
  # The backing record
  backing_record:
    record_type: "APPROVAL_RECORD | GATE_VERDICT | POLICY_DECISION | CONSTITUTIONAL_VERDICT"
    record_id: string
    record_hash: string                # Integrity link to the backing record
  
  # Attestation metadata
  attested_by: string
  attested_at: datetime
  valid_until: datetime
  
  # Cryptographic integrity
  attestation_hash: string             # SHA-256 of all fields
  signature: string                    # Ed25519 signature
```

---

## Registry Operations

```
register_attestation(backing_record, attestation_type) → Attestation:
  
  # Verify backing record is valid
  IF attestation_type == "EXECUTION_APPROVAL":
    backing_valid = cryptographic_approval_engine.verify_approval(backing_record.record_id, {})
    IF NOT backing_valid.valid:
      RAISE InvalidBackingRecord(backing_record.record_id, backing_valid.reason)
  
  ELIF attestation_type == "CONSTITUTIONAL_CLEARANCE":
    IF backing_record.verdict not in ["CONSTITUTIONAL", "CONSTITUTIONAL_WITH_ADVISORIES"]:
      RAISE CannotAttestUnconstitutionalAction(backing_record.verdict)
  
  # Build attestation
  attestation = Attestation(
    attestation_id = generate_uuid(),
    attestation_type = attestation_type,
    subject = {
      subject_type = backing_record.subject_type,
      subject_id = backing_record.subject_id,
      subject_hash = backing_record.evidence_hash or sha256(backing_record.subject_id)
    },
    backing_record = {
      record_type = classify_record_type(backing_record),
      record_id = backing_record.record_id or backing_record.verdict_id,
      record_hash = sha256(canonical_serialize(backing_record))
    },
    attested_by = backing_record.attested_by or backing_record.actor.actor_id,
    attested_at = now(),
    valid_until = now() + timedelta(seconds=ATTESTATION_TYPES[attestation_type].validity_duration_seconds)
  )
  
  attestation.attestation_hash = sha256(canonical_serialize(attestation))
  attestation.signature = execution_signing.sign_artifact(
    attestation,
    signing_context = {artifact_type: "ATTESTATION"}
  ).signature
  
  persist_attestation(attestation)
  update_index(attestation)
  
  RETURN attestation

find_attestation(subject_id, attestation_type, check_validity=True) → Attestation | null:
  
  # Fast index lookup
  candidates = attestation_index.get(subject_id, attestation_type)
  
  FOR candidate_id in candidates:
    attestation = load_attestation(candidate_id)
    
    IF check_validity AND attestation.valid_until < now():
      CONTINUE  # Expired
    
    # Verify cryptographic integrity
    sig_valid = verify_attestation_signature(attestation)
    IF NOT sig_valid:
      log_security_event("ATTESTATION_SIGNATURE_INVALID", attestation.attestation_id)
      CONTINUE
    
    RETURN attestation  # Return first valid
  
  RETURN null

verify_attestation(attestation_id) → AttestationVerificationResult:
  
  attestation = load_attestation(attestation_id)
  
  IF attestation is null:
    RETURN AttestationVerificationResult(valid=False, reason="Attestation not found")
  
  # Temporal check
  IF attestation.valid_until < now():
    RETURN AttestationVerificationResult(valid=False, reason=f"Attestation expired at {attestation.valid_until.isoformat()}")
  
  # Signature verification
  sig_valid = execution_signing.verify_artifact(attestation)
  IF NOT sig_valid.valid:
    RETURN AttestationVerificationResult(valid=False, reason="Signature invalid")
  
  # Hash integrity
  recomputed_hash = sha256(canonical_serialize({
    attestation_id: attestation.attestation_id,
    attestation_type: attestation.attestation_type,
    subject: attestation.subject,
    backing_record: attestation.backing_record,
    attested_by: attestation.attested_by,
    attested_at: attestation.attested_at.isoformat(),
    valid_until: attestation.valid_until.isoformat()
  }))
  IF recomputed_hash != attestation.attestation_hash:
    RETURN AttestationVerificationResult(valid=False, reason="Attestation content tampered")
  
  # Verify backing record still valid
  IF attestation.attestation_type == "EXECUTION_APPROVAL":
    backing_valid = cryptographic_approval_engine.verify_approval(attestation.backing_record.record_id, {})
    IF NOT backing_valid.valid:
      RETURN AttestationVerificationResult(valid=False, reason=f"Backing approval no longer valid: {backing_valid.reason}")
  
  RETURN AttestationVerificationResult(
    valid = True,
    attestation_type = attestation.attestation_type,
    attested_by = attestation.attested_by,
    valid_until = attestation.valid_until
  )
```

---

## Attestation Coverage Tracking

```
check_attestation_coverage(run_id) → AttestationCoverageReport:
  
  # Load all actions taken in this run that required attestation
  graph = dag_runtime.get_execution_status(run_id)
  required_attestations = []
  
  FOR each node in graph.nodes.values() WHERE node.state == "SUCCEEDED":
    node_decl = workflow_registry.get_node_declaration(run_id, node.node_id)
    
    IF node_decl.requires_approval:
      required_attestations.append({
        node_id: node.node_id,
        attestation_type: "EXECUTION_APPROVAL"
      })
    
    IF node_decl.requires_constitutional_clearance:
      required_attestations.append({
        node_id: node.node_id,
        attestation_type: "CONSTITUTIONAL_CLEARANCE"
      })
    
    # Gate-passing nodes require gate certification
    IF node_decl.node_type == "gate":
      required_attestations.append({
        node_id: node.node_id,
        attestation_type: "GATE_CERTIFICATION"
      })
  
  # Check each required attestation
  coverage = []
  gaps = []
  
  FOR req in required_attestations:
    attestation = find_attestation(
      subject_id = f"{run_id}/{req.node_id}",
      attestation_type = req.attestation_type
    )
    
    IF attestation:
      coverage.append({required: req, attestation_id: attestation.attestation_id, covered: True})
    ELSE:
      gaps.append({required: req, covered: False})
  
  coverage_rate = len(coverage) / max(len(required_attestations), 1)
  
  RETURN AttestationCoverageReport(
    run_id = run_id,
    required_count = len(required_attestations),
    covered_count = len(coverage),
    coverage_rate = coverage_rate,
    gaps = gaps,
    fully_attested = (len(gaps) == 0)
  )
```

---

## Attestation Registry Schema

```yaml
AttestationRegistryState:
  last_updated: datetime
  
  total_attestations: integer
  active_attestations: integer
  expired_attestations: integer
  
  # Fast lookup indexes
  by_subject_id: {subject_id: [attestation_id]}
  by_attestation_type: {type: [attestation_id]}
  by_attested_by: {attester: [attestation_id]}
  by_run_id: {run_id: [attestation_id]}
  
  # Statistics
  coverage_by_type: {attestation_type: {total: integer, active: integer}}
```

---

## Integration

**Called by:**
- `trust-boundaries/trust-boundary-registry.md` — checks for required attestations before boundary crossings
- `workflow-engine/workflow-registry.md` — verifies attestations at workflow completion
- `governance-attestation/approval-chain-verifier.md` — queries registry during chain verification
- `audit-replay/audit-query-engine.md` — reports on attestation coverage

**Calls:**
- `governance-attestation/cryptographic-approval-engine.md` — verifies backing approval records
- `execution-security/execution-signing.md` — signs attestations
- `audit-replay/immutable-audit-log.md` — records all attestation events

**Reads from:** `memory/governance-attestation/attestation-registry.yaml`
**Writes to:** `memory/governance-attestation/attestation-registry.yaml`
