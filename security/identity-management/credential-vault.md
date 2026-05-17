# Credential Vault
**ID:** IAM-CVT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides secure, centralized storage, lifecycle management, and controlled delivery of all enterprise credentials — cryptographic keypairs, API keys, TLS certificates, service account secrets, and database credentials — with automatic rotation, access control, and tamper detection. The Credential Vault is the cryptographic foundation of the IAM stack: every credential used anywhere in the enterprise originates here, and no credential persists in plaintext in any other system.

---

## Credential Types

```yaml
credential_types:

  ED25519_KEYPAIR:
    use: agent identity authentication; Ed25519 signing for audit records and approvals
    storage: private_key: AES-256-GCM encrypted (HSM-derived key); public_key: plaintext (safe to expose)
    TTL: 1 year; rotation mandatory before expiry
    rotation: new keypair generated; public key updated in identity-registry; old private key destroyed after 24hr overlap
    
  RSA_KEYPAIR:
    use: legacy connector TLS (where Ed25519 not supported)
    key_size: 4096 bits minimum
    TTL: 2 years; rotation at 18 months
    storage: HSM-protected private key
    
  API_KEY:
    use: service account authentication to internal and external APIs
    format: {32-char-prefix}-{256-bit-secret} (base64url encoded)
    TTL: 90 days (enforced by credential-lifecycle-manager.md)
    storage: HMAC-SHA256 hash stored (not plaintext); secret delivered once at issuance
    rotation: automated 7 days before expiry; consuming system notified via webhook
    
  TLS_CERTIFICATE:
    use: mTLS for connectors; service-to-service TLS; external connector authentication
    CA: enterprise internal CA (intermediate CA signed by offline root)
    TTL: 1 year; automated renewal at 30 days remaining
    storage: private key in HSM; certificate in vault; public certificate distributed freely
    
  DATABASE_CREDENTIAL:
    use: agent-to-database authentication
    type: username+password (for legacy DBs); IAM role credential (for cloud DBs)
    TTL: 24 hours (dynamic secrets; issued on-demand; auto-expired)
    storage: never stored at rest; generated at request; rotated each issuance
    
  OAUTH_CLIENT_SECRET:
    use: external connector OAuth 2.0 client authentication
    TTL: 180 days
    storage: AES-256-GCM encrypted; delivered to connector at registration
    rotation: 30-day advance notification; consuming connector must update before expiry
    
  SIGNING_KEY:
    use: policy signing; audit record signing; compliance decision signing
    algorithm: Ed25519 (T3 authority); Ed25519 (T4 authority — separate key)
    TTL: 1 year for T3; 2 years for T4
    storage: HSM-protected; never extractable
    rotation: dual-control (requires two T3+ to initiate)
    
  ENCRYPTION_KEY:
    use: data-at-rest encryption (per-jurisdiction per-data-class keys)
    algorithm: AES-256-GCM (data encryption); RSA-4096 (key wrapping)
    storage: HSM-only; never leaves HSM; used via HSM API
    rotation: annual; old key retained for decrypt-only for 7 years
    jurisdiction_isolation: CN encryption keys stored in CN HSM only; EU in EU HSM only
```

---

## Credential Storage Architecture

```yaml
vault_architecture:
  
  tiers:
    HOT_STORAGE:
      description: active credentials for currently-authenticated identities
      technology: in-memory encrypted cache (AES-256-GCM; HSM-derived key)
      TTL: matches credential TTL; evicted on expiry or revocation
      access_latency: < 5ms
      
    WARM_STORAGE:
      description: all active credentials for registered identities
      technology: encrypted RDBMS (AES-256-GCM; column-level encryption)
      access_latency: < 20ms
      replication: 3 replicas (jurisdiction-compliant); sync replication
      
    COLD_STORAGE:
      description: rotated credentials (historical; for forensic use during retention period)
      technology: encrypted object storage (AES-256-GCM)
      access_latency: minutes (requires T3 authorization to access)
      retention: follows credential type retention policy
      
  HSM_INTEGRATION:
    provider: enterprise HSM cluster (FIPS 140-2 Level 3)
    operations_in_HSM: [key_generation, key_wrapping, signing, decryption]
    operations_outside_HSM: [storage of wrapped keys, public key distribution]
    CN_HSM: separate CN-jurisdiction HSM cluster; CN keys never leave CN HSM
    EU_HSM: separate EU-jurisdiction HSM cluster for GDPR-sensitive keys
    quorum_operations: T3 signing keys require 2-of-3 quorum in HSM operations
```

---

## Credential Lifecycle

```
issue_credential(identity_id, credential_type, options):

  # Authorization check
  require_authorization(min_tier=T2)
  
  # Generate credential material (in HSM)
  raw_credential = hsm.generate(credential_type, options)
  
  # Create credential record
  credential = CredentialRecord {
    credential_id: CRD-{NNN},
    identity_id: identity_id,
    credential_type: credential_type,
    issued_at: now(),
    expires_at: now() + get_ttl(credential_type),
    status: ACTIVE,
    fingerprint: compute_fingerprint(raw_credential.public_component),
    storage_ref: store_encrypted(raw_credential.private_component),
    rotation_due_at: expires_at - get_rotation_advance(credential_type)
  }
  
  # Register in identity registry
  identity_registry.update_credential_ref(identity_id, credential.credential_id)
  
  # Schedule rotation
  schedule_rotation(credential.credential_id, credential.rotation_due_at)
  
  # Deliver (method depends on credential_type)
  delivery = deliver_credential(identity_id, raw_credential, credential_type)
  
  # Destroy raw credential from memory (vault retains encrypted copy only)
  secure_zero_memory(raw_credential.private_component)
  
  log_issuance(credential, delivery.method)
  Return: credential.credential_id (caller uses this to retrieve when needed)


rotate_credential(credential_id, trigger):
  # trigger: SCHEDULED | EMERGENCY | SECURITY_EVENT | MANUAL
  
  old_credential = vault.get(credential_id)
  
  # Generate new credential
  new_raw = hsm.generate(old_credential.credential_type, old_credential.options)
  new_credential = CredentialRecord {
    credential_id: CRD-{NNN},    # new ID
    supersedes: credential_id,
    ...
  }
  
  # Overlap window: both old and new valid briefly
  overlap_window = get_overlap_window(trigger)  # EMERGENCY: 0s; SCHEDULED: 24hr
  
  # Activate new; mark old as ROTATING (still valid until overlap ends)
  new_credential.status = ACTIVE
  old_credential.status = ROTATING
  old_credential.rotation_ends_at = now() + overlap_window
  
  # Notify consuming systems
  notify_credential_consumers(credential_id, new_credential.credential_id)
  
  # After overlap window: revoke old
  schedule_revocation(credential_id, trigger_at=old_credential.rotation_ends_at)
  
  log_rotation(old_credential, new_credential, trigger)
  Return: new_credential.credential_id
```

---

## Access Control for Vault Operations

```yaml
vault_access_control:

  READ_CREDENTIAL_METADATA:
    (view credential type, TTL, status — not the secret itself)
    authorized: T2+ (own-identity credentials); T3 (any credential for security review)
    
  RETRIEVE_CREDENTIAL_SECRET:
    (retrieve the actual secret/private key for use in authentication)
    authorized: identity_registry.get(credential.identity_id) ONLY (the owning identity)
    plus: T3 for emergency forensic access (with audit log + T4 notification)
    audit: every secret retrieval logged with reason
    
  ISSUE_CREDENTIAL:
    authorized: T2 (STANDARD identities); T3 (ELEVATED/PRIVILEGED); T4 (SUPER_PRIVILEGED)
    
  REVOKE_CREDENTIAL:
    authorized: T2 (emergency revocation for owned identity); T3 (any identity); automated (on identity decommission)
    
  ROTATE_CREDENTIAL:
    automated: scheduled rotations require no manual authorization
    emergency_rotation: T2 (own identity); T3 (any identity)
    
  ACCESS_COLD_STORAGE:
    (retrieve historical/rotated credentials)
    authorized: T3 (with stated forensic justification); T4 (oversight)
    
  HSM_OPERATIONS:
    authorized: T3 IAM administrator (dual-control for signing key operations)
    quorum: 2-of-3 T3 for T4 signing key generation or rotation
```

---

## Credential Record Schema

```yaml
credential_record:
  credential_id: CRD-{NNN}
  identity_id: IDN-{NNN}
  
  credential_type: string
  status: ACTIVE | ROTATING | REVOKED | EXPIRED | COMPROMISED
  
  issued_at: ISO8601
  issued_by: IDN-{NNN}
  expires_at: ISO8601
  rotation_due_at: ISO8601
  rotation_ends_at: ISO8601 | null     # when ROTATING status expires (old invalidated)
  revoked_at: ISO8601 | null
  revocation_reason: string | null
  
  supersedes: CRD-{NNN} | null         # previous credential this replaces
  superseded_by: CRD-{NNN} | null      # new credential that replaced this one
  
  storage:
    fingerprint: string                 # public fingerprint (safe to log)
    storage_tier: HOT | WARM | COLD
    storage_ref: string                 # internal ref to encrypted storage location
    hsm_key_handle: string | null       # for HSM-protected keys
    jurisdiction: JUR-{XX}             # jurisdiction of storage (matches identity jurisdiction)
    
  access_log: [CRD-ACC-{NNN}]          # pointers to credential access events
  
  integrity:
    record_hash: sha256
```

---

## Integration

```
Feeds into:
  authentication-engine.md — credentials fetched for verification
  identity-registry.md — credential refs maintained in identity records
  identity-lifecycle-manager.md — credential issuance/revocation on lifecycle events
  supply-chain-threat-monitor.md — signing key integrity monitored here

Receives from:
  identity-lifecycle-manager.md — provisioning triggers credential issuance; decommission triggers revocation
  security/credential-lifecycle-manager.md — TTL policy enforcement and rotation scheduling
  incident-response/containment-engine.md — CON-003 (credential revocation) calls here
```

---

## Governance

**No plaintext credentials outside HSM:** Private keys and secrets never exist in plaintext outside the HSM; vault stores encrypted blobs only  
**Emergency revocation is instant:** Any T2+ can revoke any credential immediately in a security incident; no workflow gate delays emergency revocation  
**CN jurisdiction key isolation:** Encryption and signing keys for CN-jurisdiction operations are generated in and never leave the CN HSM cluster; this is a hardware-enforced control  
**Credential access audit:** Every secret retrieval (not just issuance) is logged with identity, timestamp, and stated reason; T4 reviews audit weekly  
**Audit:** All credential lifecycle events to `memory/identity-management/credential-audit.jsonl`; 10-year retention (credential records implicated in incidents: permanent)
