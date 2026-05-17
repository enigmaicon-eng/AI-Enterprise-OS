# Secrets Manager
**ID:** IAM-SCR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides centralized, secure, lifecycle-managed storage and controlled delivery of enterprise secrets — database passwords, API keys, encryption keys, service account credentials, and third-party service tokens — with dynamic secret generation, automatic rotation, and fine-grained access control. The Secrets Manager eliminates static secrets embedded in agent configurations, environment variables, and source code; every secret is dynamic, short-lived, and accessed only through authorized, audited API calls.

---

## Secret Types and Policies

```yaml
secret_types:

  DATABASE_CREDENTIAL:
    subtype: USERNAME_PASSWORD | IAM_ROLE | CONNECTION_STRING
    generation: dynamic (generated on request; unique per session)
    TTL: 1 hour (standard); 24 hours (batch processing agents)
    rotation: on TTL expiry; no manual rotation required (dynamic generation)
    delivery: injected into agent environment at session start; cleared on session end
    
  API_KEY_EXTERNAL:
    subtype: BEARER_TOKEN | HMAC_KEY | OAUTH_TOKEN
    generation: static-with-rotation (vendor-issued; stored in vault; rotated on schedule)
    TTL: per vendor policy; default 90 days
    rotation: automated 14 days before expiry; consuming agent notified via webhook
    delivery: fetched via secrets-manager API at use time; never stored in agent config
    
  ENCRYPTION_KEY_REFERENCE:
    subtype: DATA_ENCRYPTION_KEY | KEY_ENCRYPTION_KEY | SIGNING_KEY
    generation: in HSM (never leaves HSM)
    TTL: 1 year (DEK); 2 years (KEK); annual (signing)
    delivery: key operations performed IN HSM via API; key material never delivered
    
  SERVICE_ACCOUNT_PASSWORD:
    generation: random (256-bit entropy); auto-rotated
    TTL: 90 days (from credential-lifecycle-manager.md)
    rotation: automated; new password pushed to consuming systems before old expires
    delivery: fetched via secrets-manager API; never in environment variables
    
  TLS_PRIVATE_KEY:
    generation: in HSM
    TTL: 1 year
    delivery: HSM-based signing/decryption operations only; key never extracted
    
  WEBHOOK_SECRET:
    generation: random (256-bit entropy)
    TTL: 180 days; rotated on any webhook configuration change
    delivery: configured in enterprise webhook management system; not per-request
    
  THIRD_PARTY_OAUTH_TOKEN:
    generation: OAuth flow; stored post-authorization
    TTL: per provider; typically 1 hour (access_token); 30-90 days (refresh_token)
    rotation: automatic refresh 5 minutes before expiry; re-authorization if refresh fails
    delivery: fetched on each use; never cached in agent memory beyond immediate use
```

---

## Dynamic Secret Generation

```yaml
dynamic_secret_generation:
  
  purpose: eliminate long-lived static secrets; every secret is generated fresh per use
  
  database_dynamic_secrets:
    method: |
      1. agent requests database access → secrets-manager creates temporary DB user
      2. temporary user has only required permissions (least privilege)
      3. secret (connection credentials) issued with TTL
      4. on TTL expiry: temporary DB user revoked; connection invalidated
      5. agent must request new secret for next session
    supported_backends: [PostgreSQL, MySQL, MSSQL, MongoDB, Elasticsearch]
    
  api_key_rotation:
    trigger: TTL - 14 days OR explicit rotation request
    process: |
      1. generate new API key (vendor-dependent: OAuth re-flow or API rotation call)
      2. store new key in vault
      3. notify consuming agents of new key ID (not the key itself)
      4. agents fetch new key via secrets-manager API
      5. old key deprecated after overlap window (24 hours)
      6. old key deleted after overlap
      
  cloud_credential_generation:
    method: IAM role assumption (AWS STS / GCP Workload Identity / Azure Managed Identity)
    TTL: maximum 1 hour; non-renewable (re-assume required)
    no_long_term_keys: cloud provider long-term access keys prohibited in enterprise
```

---

## Secret Access Control

```yaml
secret_access_control:
  
  secret_policy:
    # Every secret has an access policy defining which identities can fetch it
    policy_schema:
      secret_id: SCR-{NNN}
      allowed_identities: [IDN-{NNN}]        # explicit allowlist
      allowed_roles: [ROLE-{NNN}]            # role-based allowlist
      denied_identities: [IDN-{NNN}]         # explicit denylist (overrides role allowlist)
      allowed_contexts:
        jurisdictions: [JUR-{XX}]
        ip_ranges: [string]                  # for service account access
        time_windows: string | null          # cron expression for time-bounded secrets
      require_mfa: boolean
      require_jit_approval: boolean          # for highly sensitive secrets (SUPER_PRIVILEGED scope)
      
  access_enforcement:
    every_secret_fetch: authenticated (session token); authorized (policy check via PDP); audited
    no_bulk_fetch: agents can fetch only secrets they're explicitly authorized for; bulk enumerate prohibited
    scope_binding: secret fetched for a specific purpose cannot be used in a different context (scope token)
    
  break_glass_access:
    who: T3 IAM on-call + T4 co-authorization
    what: any secret with forensic justification
    audit: every break-glass access logged to separate restricted audit trail; T4 notification immediate
    restriction: break-glass cannot be used to access constitutional or jurisdiction-isolated keys
```

---

## Secret Rotation Engine

```yaml
rotation_engine:
  
  scheduled_rotation:
    cadence: per secret_type TTL policy
    process:
      1. detect rotation_due (TTL - advance_notice days)
      2. generate new secret version
      3. store as NEW_VERSION alongside CURRENT_VERSION (both active during overlap)
      4. notify consuming identities of pending rotation via webhook
      5. overlap_window expires → CURRENT_VERSION → OLD_VERSION (still valid briefly)
      6. OLD_VERSION TTL expires → revoke and delete; NEW_VERSION becomes CURRENT_VERSION
    overlap_windows:
      DATABASE_CREDENTIAL: 0s (dynamic; no overlap needed)
      API_KEY_EXTERNAL: 24 hours
      SERVICE_ACCOUNT_PASSWORD: 24 hours
      TLS_PRIVATE_KEY: 7 days
      
  emergency_rotation:
    triggers:
      - secret suspected or confirmed compromised
      - consuming identity decommissioned
      - security incident involving consuming agent
      - SOC playbook PB-SOC-003 (credential compromise response)
    process: immediate new secret generation; overlap_window = 0; old secret revoked immediately
    notification: all consuming identities notified in real-time
    SLA: < 5 minutes from trigger to new secret available; < 15 minutes from trigger to old secret revoked
    
  rotation_failure_handling:
    if_vendor_api_unavailable: alert T3; retry every 5 minutes; escalate to T4 at 1 hour
    if_rotation_fails_before_expiry: keep current secret active; T3 incident; do not revoke until backup plan
    if_consuming_system_fails_to_adopt: old secret kept valid 24hr grace; T3 investigation
```

---

## Secret Record Schema

```yaml
secret_record:
  secret_id: SCR-{NNN}
  name: string                         # human-readable; never contains the secret value
  secret_type: string
  
  versions:
    current: SCR-VER-{NNN}
    previous: [SCR-VER-{NNN}]          # previous versions in overlap or grace period
    
  version_schema:
    version_id: SCR-VER-{NNN}
    secret_id: SCR-{NNN}
    created_at: ISO8601
    expires_at: ISO8601
    status: ACTIVE | ROTATING | DEPRECATED | REVOKED
    storage_ref: string                # encrypted storage location; never in record
    content_hash: sha256               # hash of secret value (for integrity check; not the value)
    
  policy:
    allowed_identities: [IDN-{NNN}]
    allowed_roles: [ROLE-{NNN}]
    require_mfa: boolean
    require_jit_approval: boolean
    
  lifecycle:
    created_at: ISO8601
    last_rotated_at: ISO8601
    next_rotation_at: ISO8601
    rotation_count: integer
    
  consuming_systems: [string]          # systems/agents that have fetched this secret (pointers; not secrets)
  
  integrity:
    record_hash: sha256
```

---

## Integration

```
Feeds into:
  credential-vault.md — secrets manager stores credentials issued by vault; vault issues the raw material
  identity-lifecycle-manager.md — decommission triggers emergency rotation of all associated secrets
  supply-chain-threat-monitor.md — connector secrets monitored for unauthorized use

Receives from:
  privileged-access-manager.md — JIT sessions trigger temporary secret issuance
  incident-response/containment-engine.md — CON-003 triggers emergency secret rotation
  security/credential-lifecycle-manager.md — TTL enforcement feeds rotation scheduling
  identity-federation.md — cross-entity secrets are jurisdiction-isolated
```

---

## Governance

**No static secrets in agent configs:** Automated scanning (weekly) identifies any static secret embedded in agent configuration, source code, or environment variables; any finding is a P1 security event  
**Secret material never in audit logs:** Audit logs record secret_id, version_id, and accessing identity — never the secret value itself  
**Emergency rotation cannot be delayed:** Emergency rotation (triggered by compromise or incident) cannot be deferred by operational concerns; all consuming systems must adopt the new secret within 15 minutes  
**Jurisdiction-isolated secrets:** Encryption keys for jurisdiction-specific operations are stored in jurisdiction-specific vault partitions; CN keys accessible only within CN SEZ  
**Audit:** All secret fetches, rotations, and policy changes to `memory/privileged-access/secrets-audit.jsonl`; 7-year retention; break-glass access retained 10 years
