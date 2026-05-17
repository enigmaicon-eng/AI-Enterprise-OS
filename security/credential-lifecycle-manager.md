# Credential Lifecycle Manager
**ID:** SEC-CRED-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Security Org (via Governance Org) | **Updated:** 2026-05-16

---

## Purpose

Manages the complete lifecycle of all credentials used by the Enterprise AI OS: creation, validation, rotation, emergency revocation, and audit. Eliminates long-lived credentials as a security risk. Covers all 33 connector API keys, service account credentials, signing keys, and internal secrets.

---

## Credential Registry

All credentials are registered in `memory/security/credential-registry.yaml`:

```yaml
credential_record:
  credential_id: CRED-{connector_slug}-{type}-{seq}
  connector_ref: CONN-*                    # from connector-permission-registry.md
  credential_type: API_KEY | OAUTH_TOKEN | SERVICE_ACCOUNT | WEBHOOK_SECRET | SIGNING_KEY
  
  lifecycle:
    created_at: ISO8601
    last_rotated_at: ISO8601
    expires_at: ISO8601
    ttl_days: number                       # 90 for API keys, 180 for service accounts
    rotation_scheduled_at: ISO8601         # 14 days before expiry
    
  status: ACTIVE | ROTATION_PENDING | ROTATING | REVOKED | EXPIRED
  
  security:
    storage: HSM | VAULT | ENCRYPTED_ENV   # never plaintext
    hash: string                           # SHA-256 of credential value (for audit, not reversal)
    
  audit:
    last_used_at: ISO8601
    usage_count_7d: number
    rotation_count: number
```

---

## TTL Policy by Credential Type

| Type | Max TTL | Alert at | Emergency Rotation SLA |
|------|---------|---------|------------------------|
| API_KEY | 90 days | 14 days before expiry | 15 minutes |
| OAUTH_TOKEN | Per provider (typically 1 hr refresh) | Auto-refresh | 5 minutes |
| SERVICE_ACCOUNT | 180 days | 30 days before expiry | 30 minutes |
| WEBHOOK_SECRET | 365 days | 60 days before expiry | 15 minutes |
| SIGNING_KEY | 365 days | 90 days before expiry | 60 minutes (two-person) |

---

## Rotation Protocol (Standard)

```
Day T-14 before expiry:
  1. ROTATION_PENDING status set
  2. T3 alert: rotation scheduled in 14 days
  3. New credential generated in vault (not yet active)
  4. New credential validated against connector: health_check(new_credential)

Day T-7:
  1. T3 reminder alert
  2. Validate new credential health check still passing

Day T-1:
  1. Final validation
  2. Rotation window scheduled for T-0 02:00 UTC (low-traffic window)

Day T-0 (rotation execution, < 5 minutes):
  1. STATUS → ROTATING
  2. Overlap window start: NEW credential goes active (both valid)
  3. In-flight requests using OLD credential: 24-hour grace period
  4. New credential replaces old in all connector configurations
  5. 24-hour overlap window: both credentials valid
  6. STATUS → ACTIVE (new); OLD → REVOKED after grace period
  7. Audit log entry with rotation record
```

---

## Emergency Rotation Protocol (< 15 minutes)

Triggered by: suspected credential compromise, connector security incident, T3+ manual trigger.

```
Immediate actions (0–5 min):
  1. T3 triggers emergency rotation
  2. OLD credential immediately set to REVOKED in registry
  3. All connector requests using old credential rejected immediately
  4. Affected workflows paused (not failed — paused for resume)

Replacement (5–10 min):
  1. New credential generated from vault
  2. Emergency validation (abbreviated — 30-second health check)
  3. New credential deployed to all connector configurations
  4. Paused workflows resume

Confirmation (10–15 min):
  1. Health check passes on new credential
  2. All paused workflows resumed
  3. Audit event: SEC-EMERGENCY-ROTATION logged
  4. T4 notification: rotation complete

Post-emergency (within 24 hours):
  1. Root cause analysis: how was credential potentially compromised?
  2. Security incident created if compromise confirmed
  3. Additional monitoring on affected connector for 30 days
```

---

## Credential Vault Integration

The credential lifecycle manager interfaces with an HSM/vault (not part of the OS — external dependency):

```
vault_interface:
  generate_credential(type, connector, ttl) → credential_id
  retrieve_credential(credential_id) → {value: encrypted}
  revoke_credential(credential_id) → confirmed
  validate_credential(credential_id) → {valid: bool, expiry: ISO8601}
```

If vault is unavailable: T4 alert; use last-known-good credentials; schedule emergency maintenance window. Vault availability is a hard dependency for rotation but not for normal operations.

---

## Reporting

Weekly credential health report to T3+:
- Total credentials tracked
- Credentials expiring in 14/7/1 days
- Credentials past rotation schedule (if any) — T4 escalation
- Emergency rotations in past 30 days
- Credential usage anomalies (sudden usage spike = suspicious)

---

## Governance

**Rotation authorization:** Automated for standard rotation; T3 confirmation for emergency
**Two-person integrity:** Required for SIGNING_KEY rotation and vault master key access
**Audit:** All credential lifecycle events to `memory/security/credential-audit.jsonl` (append-only, Ed25519 signed)
**Constitutional binding:** C-006 (security by design) — no plaintext credentials anywhere in OS
