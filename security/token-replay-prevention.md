# Token Replay Prevention
**ID:** SEC-TRP-001 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Prevents replay attacks against the OS authentication and authorization systems. An attacker who intercepts a valid HMAC-SHA256 ephemeral permission token, approval signature, or agent invocation credential could replay it to authorize actions the original holder never intended. This system enforces single-use semantics, short TTLs, and cryptographic nonces across all token types.

---

## Token Taxonomy

| Token Type | Format | TTL | Replay Risk |
|-----------|--------|-----|-------------|
| Ephemeral permission token | HMAC-SHA256(scope+nonce+timestamp) | 15 min | HIGH |
| Approval signature | Ed25519(decision_id+outcome+timestamp) | 1 use only | CRITICAL |
| Agent invocation credential | JWT-like + nonce | 5 min | HIGH |
| Connector auth token | OAuth2 bearer | per provider | MEDIUM |
| Webhook signature | HMAC-SHA256(body+timestamp) | 5 min window | HIGH |
| Cross-agent delegation token | Ed25519(delegator+scope+nonce) | 10 min | HIGH |

---

## Nonce Architecture

Every token includes a cryptographically random nonce:

```yaml
token_envelope:
  token_id: string                        # globally unique, UUID v4
  token_type: string
  issued_at: ISO8601
  expires_at: ISO8601
  
  nonce: string                           # 256-bit random, base64url-encoded
  subject: string                         # who this token was issued to
  scope: [string]                         # exactly what this token authorizes
  
  signature: string                       # Ed25519 or HMAC-SHA256 of above fields
  signature_algorithm: string
```

**Nonce generation:** `crypto.getRandomValues()` or `/dev/urandom` — never Math.random() or predictable sequences.

---

## Nonce Registry (Replay Detection Store)

```
Used nonces are stored in a time-bounded registry:

  nonce_registry[nonce] = {
    token_id: string,
    token_type: string,
    used_at: ISO8601,
    used_by: agent_id,
    action_authorized: string
  }

Retention: max(token TTL × 2, 30 minutes)
  - Nonces are retained well past token expiry to catch late replays
  - Registry is memory-resident for speed; checkpointed to disk every 60 seconds
  - On OS restart: reload from checkpoint; reject all tokens issued before checkpoint

Registry implementation:
  - Hash map keyed by nonce (O(1) lookup)
  - Expiry sweep every 60 seconds
  - Max size: 1,000,000 entries (auto-compaction when exceeded)
```

---

## Token Validation Protocol

Every token consumption follows this exact sequence:

```
Step 1: Structural Validation
  - Verify token_id is present and UUID v4 format
  - Verify issued_at and expires_at are present and parseable
  - Verify nonce is present and 256-bit length
  - If any field missing: REJECT with TOKEN_MALFORMED

Step 2: Temporal Validation  
  - Verify current_time ≤ expires_at (clock skew tolerance: ±30 seconds)
  - Verify current_time ≥ issued_at (reject pre-dated tokens)
  - If expired: REJECT with TOKEN_EXPIRED; log for anomaly detection

Step 3: Signature Verification
  - Recompute expected signature over canonical field ordering
  - Verify signature matches using appropriate algorithm
  - If mismatch: REJECT with TOKEN_INVALID_SIGNATURE; T3 security alert

Step 4: Nonce Check (replay prevention)
  - Look up nonce in nonce_registry
  - If FOUND: REJECT with TOKEN_REPLAYED; T3 SECURITY ALERT (potential attack)
  - If NOT FOUND: proceed

Step 5: Scope Check
  - Verify requested action is within token.scope
  - If out of scope: REJECT with TOKEN_SCOPE_EXCEEDED; T3 alert

Step 6: Consume
  - Write nonce to nonce_registry with current timestamp
  - Write token consumption to memory/security/token-audit-log.jsonl
  - Authorize requested action
```

All 6 steps must pass. There are no bypass paths.

---

## Clock Synchronization Requirement

Replay windows depend on synchronized clocks:

- All OS agents must use NTP-synchronized time (tolerance ±5 seconds)
- Token validation uses 30-second clock skew tolerance (not a security window — a reliability window)
- If an agent's clock drifts > 30 seconds: the agent's tokens are rejected; T3 alert
- Clock drift monitoring: each agent reports current time in every heartbeat; orchestrator flags deviations

---

## Approval Signature Special Handling

Approval signatures (Ed25519 over governance decisions) are one-time use:

```
Approval signature = Ed25519_sign(
  decision_id + "|" + outcome + "|" + approver_id + "|" + timestamp + "|" + nonce
)

Consumption rules:
  - A given decision_id can be approved exactly once
  - Nonce is checked against nonce_registry (standard flow)
  - Additionally: decision_id is checked against approval_consumption_registry
  - If decision_id already consumed: REJECT with APPROVAL_ALREADY_CONSUMED
    → This is a CRITICAL security event: T4 immediate, full audit of decision trail
  - Approval consumption is append-only in approval-records.jsonl hash chain
```

---

## Anomaly Detection

The token audit log feeds anomaly detection:

```
Signals monitored:
  - TOKEN_REPLAYED events: any single instance → T3 alert
  - Nonce collisions (should be astronomically rare): → T4 emergency (RNG compromise suspected)
  - High token expiry rate from specific agent: possible clock drift or attack
  - Rapid token consumption bursts (>100/min from single source): rate limiting + T3 alert
  - Tokens issued but never consumed within TTL: normal for cancellations; flag >20% rate
```

---

## Webhook Signature Validation

Inbound webhooks from the 33 connectors use HMAC-SHA256 with timestamp:

```
Validation:
  1. Extract X-Timestamp header (Unix epoch)
  2. Verify abs(current_time - X-Timestamp) ≤ 300 seconds (5-minute window)
  3. Compute HMAC-SHA256(webhook_secret, timestamp + "." + body)
  4. Compare with X-Signature header (constant-time comparison)
  5. Check timestamp against recent_webhook_timestamps bloom filter (replay within window)
  6. If all pass: accept; record timestamp in bloom filter (TTL: 10 minutes)
```

---

## Governance

**Nonce registry:** In-memory with 60s checkpoint to `memory/security/nonce-checkpoint.bin`
**Token audit:** `memory/security/token-audit-log.jsonl` (append-only, 90-day retention)
**Replay incidents:** `memory/security/security-incidents.jsonl`
**On TOKEN_REPLAYED:** Automatic T3 alert + human review within 1 hour
**On APPROVAL_ALREADY_CONSUMED:** Automatic T4 alert + investigation opened immediately
