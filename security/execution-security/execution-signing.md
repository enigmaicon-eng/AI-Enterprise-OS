# Execution Signing

**System ID:** `execution-signing`
**Role:** Cryptographically signs all significant execution artifacts — workflow outputs, governance decisions, agent-produced artifacts, approval records — creating a verifiable chain of provenance that proves what was produced, by whom, when, and under what execution context; enables tamper detection and non-repudiation across the entire execution history
**Storage:** `memory/execution-security/signing-registry.yaml`

---

## Purpose

An audit log that can be silently modified is worthless. A governance decision that can be backdated cannot be trusted. An agent output that carries no proof of provenance cannot be reliably attributed to its source. Execution signing wraps every significant artifact with a cryptographic seal: the artifact's content, the signing agent's identity, the workflow context, and the timestamp are combined into a signature that cannot be forged without the private key and cannot be altered without breaking the signature. Any downstream consumer can verify the seal without trusting the intermediary that delivered the artifact.

---

## Signing Key Architecture

```yaml
KeyArchitecture:
  
  root_key:
    key_id: "root-signing-key-v1"
    purpose: "Signs all system-level artifacts and sub-system key certificates"
    key_type: "Ed25519"
    rotation_policy: "ANNUAL"
    storage: "HSM (Hardware Security Module)"  # Never in software
    access: "Only execution-signing system"
  
  sub_system_keys:
    # Each major subsystem gets its own key, signed by root
    - key_id: "workflow-engine-signing-key-v1"
      signs_for: ["workflow outputs", "node results", "compiled DAGs"]
      parent_key: "root-signing-key-v1"
    
    - key_id: "governance-signing-key-v1"
      signs_for: ["gate verdicts", "approvals", "policy decisions"]
      parent_key: "root-signing-key-v1"
    
    - key_id: "agent-signing-key-v1"
      signs_for: ["agent-produced artifacts", "analysis outputs"]
      parent_key: "root-signing-key-v1"
    
    - key_id: "audit-signing-key-v1"
      signs_for: ["audit log entries", "compliance reports"]
      parent_key: "root-signing-key-v1"
  
  agent_ephemeral_keys:
    # Short-lived keys issued per agent per run — signed by agent-signing-key
    lifetime: "duration of single workflow run"
    storage: "memory only — never persisted"
    purpose: "Individual agent output signing for provenance"

SigningCertificate:
  key_id: string
  public_key: string                   # Base64-encoded public key
  algorithm: string                    # "Ed25519"
  issued_at: datetime
  expires_at: datetime
  issuer_key_id: string                # Which parent key signed this certificate
  issuer_signature: string             # Parent key signature over (key_id + public_key + issued_at + expires_at)
  purpose: string
  scope: [string]                      # What this key is authorized to sign
```

---

## Signing Protocol

```
sign_artifact(artifact, signing_context) → SignedArtifact:
  
  artifact_type = signing_context.artifact_type
  signer_key = select_signing_key(artifact_type)
  
  # Step 1: Compute canonical form of artifact
  canonical_artifact = canonicalize(artifact)
  artifact_hash = sha256(canonical_artifact)
  
  # Step 2: Construct signing payload
  signing_payload = SigningPayload(
    artifact_hash = artifact_hash,
    artifact_type = artifact_type,
    
    # Context binding — signature is invalid if context changes
    signer_identity = signing_context.agent_id,
    run_id = signing_context.run_id,
    node_id = signing_context.node_id,
    workflow_definition_id = signing_context.definition_id,
    
    signed_at = now(),
    signing_key_id = signer_key.key_id
  )
  
  payload_bytes = canonical_serialize(signing_payload)
  
  # Step 3: Sign with selected key (Ed25519)
  signature = ed25519_sign(signer_key.private_key, payload_bytes)
  
  # Step 4: Build signed artifact
  signed = SignedArtifact(
    artifact_id = generate_uuid(),
    artifact_type = artifact_type,
    artifact_hash = artifact_hash,
    
    payload = artifact,               # The original artifact content
    
    signature = SignatureEnvelope(
      signing_payload = signing_payload,
      signature = base64_encode(signature),
      algorithm = "Ed25519",
      key_id = signer_key.key_id,
      key_certificate = get_certificate(signer_key.key_id)
    )
  )
  
  # Step 5: Register in signing registry
  register_signed_artifact(signed)
  
  RETURN signed

verify_artifact(signed_artifact) → VerificationResult:
  
  envelope = signed_artifact.signature
  
  # Step 1: Certificate chain verification
  cert = envelope.key_certificate
  cert_valid = verify_certificate_chain(cert)
  IF NOT cert_valid.valid:
    RETURN VerificationResult(valid=False, reason=f"Certificate chain invalid: {cert_valid.reason}")
  
  IF cert.expires_at < now():
    RETURN VerificationResult(valid=False, reason="Signing key certificate expired")
  
  # Step 2: Payload reconstruction and signature verification
  payload_bytes = canonical_serialize(envelope.signing_payload)
  public_key = load_public_key(cert.public_key, algorithm=envelope.algorithm)
  
  sig_valid = ed25519_verify(public_key, payload_bytes, base64_decode(envelope.signature))
  IF NOT sig_valid:
    RETURN VerificationResult(valid=False, reason="Signature verification failed — artifact tampered or key mismatch")
  
  # Step 3: Artifact content integrity
  recomputed_hash = sha256(canonicalize(signed_artifact.payload))
  IF recomputed_hash != envelope.signing_payload.artifact_hash:
    RETURN VerificationResult(valid=False, reason="Artifact hash mismatch — content modified after signing")
  
  # Step 4: Context verification (optional but important)
  IF signing_context_provided:
    IF envelope.signing_payload.run_id != expected_run_id:
      RETURN VerificationResult(valid=False, reason="Artifact run_id does not match expected context")
  
  RETURN VerificationResult(
    valid = True,
    signed_at = envelope.signing_payload.signed_at,
    signer_identity = envelope.signing_payload.signer_identity,
    key_id = envelope.key_id
  )
```

---

## Artifact Type → Key Mapping

```
select_signing_key(artifact_type) → SigningKey:
  
  KEY_MAP = {
    "WORKFLOW_OUTPUT":         "workflow-engine-signing-key-v1",
    "NODE_RESULT":             "workflow-engine-signing-key-v1",
    "COMPILED_DAG":            "workflow-engine-signing-key-v1",
    "GATE_VERDICT":            "governance-signing-key-v1",
    "APPROVAL_RECORD":         "governance-signing-key-v1",
    "POLICY_DECISION":         "governance-signing-key-v1",
    "AGENT_ARTIFACT":          "agent-signing-key-v1",
    "ANALYSIS_OUTPUT":         "agent-signing-key-v1",
    "AUDIT_LOG_ENTRY":         "audit-signing-key-v1",
    "COMPLIANCE_REPORT":       "audit-signing-key-v1"
  }
  
  key_id = KEY_MAP.get(artifact_type)
  IF NOT key_id:
    RAISE UnknownArtifactType(artifact_type)
  
  key = signing_key_store.get(key_id)
  IF key.expires_at < now():
    RAISE SigningKeyExpired(key_id)
  
  RETURN key
```

---

## Signed Artifact Schema

```yaml
SignedArtifact:
  artifact_id: string
  artifact_type: string
  artifact_hash: string                # SHA-256 of canonical artifact content
  
  payload: any                         # The signed content
  
  signature:
    signing_payload:
      artifact_hash: string
      artifact_type: string
      signer_identity: string          # agent_id or system_id
      run_id: string | null
      node_id: string | null
      workflow_definition_id: string | null
      signed_at: datetime
      signing_key_id: string
    
    signature: string                  # Base64-encoded Ed25519 signature
    algorithm: "Ed25519"
    key_id: string
    key_certificate: SigningCertificate
  
  # Lineage (for chained artifacts)
  parent_artifact_ids: [string]        # What inputs led to this artifact
```

---

## Key Rotation Protocol

```
rotate_key(key_id) → NewKeyId:
  
  # Generate new key pair
  new_key_pair = ed25519_generate_key_pair()
  new_key_id = f"{key_id}-v{next_version(key_id)}"
  
  # Issue certificate signed by parent
  old_cert = get_certificate(key_id)
  parent_key = signing_key_store.get(old_cert.issuer_key_id)
  
  new_cert = SigningCertificate(
    key_id = new_key_id,
    public_key = base64_encode(new_key_pair.public_key),
    algorithm = "Ed25519",
    issued_at = now(),
    expires_at = now() + KEY_VALIDITY_PERIOD,
    issuer_key_id = old_cert.issuer_key_id,
    issuer_signature = ed25519_sign(parent_key.private_key, canonical_serialize(new_key_id + new_key_pair.public_key + now().isoformat()))
  )
  
  # Register new key; old key enters grace period (still valid for verification, not for signing)
  register_key(new_key_id, new_key_pair, new_cert)
  retire_key(key_id, grace_period_days=90)  # Old artifacts remain verifiable for 90 days
  
  RETURN new_key_id
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — signs node results before committing to result store
- `governance-attestation/cryptographic-approval-engine.md` — signs approval records
- `audit-replay/immutable-audit-log.md` — signs audit log entries
- `execution-security/capability-scope-controller.md` — signs capability scope grants

**Calls:** Nothing directly (signing is stateless)

**Reads from:** `memory/execution-security/signing-registry.yaml` — key registry and certificate store
**Writes to:** `memory/execution-security/signing-registry.yaml`
