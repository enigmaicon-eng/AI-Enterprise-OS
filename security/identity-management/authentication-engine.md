# Authentication Engine
**ID:** IAM-AUT-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Verifies the identity of every agent, service account, human operator, and federation partner attempting to act within the enterprise — through cryptographic credential validation, behavioral consistency checks, and multi-factor challenges — and issues session tokens that carry the verified identity context into authorization decisions. The Authentication Engine is the gatekeeper: nothing enters the enterprise execution environment without passing through it, and every authentication outcome is logged for forensic and compliance use.

---

## Authentication Methods

```yaml
authentication_methods:

  CRYPTOGRAPHIC_KEYPAIR:
    applicable_to: [AGENT_IDENTITY, SERVICE_ACCOUNT, FEDERATION_PARTNER]
    algorithm: Ed25519 (primary); RSA-4096 (legacy connectors only)
    challenge_response:
      1. engine issues nonce (256-bit; single-use; 60s TTL)
      2. identity signs nonce with private key
      3. engine verifies signature against registered public key (from credential-vault)
      4. engine checks nonce not previously used (replay prevention via token-replay-prevention.md)
    strength: HIGH
    phishing_resistant: true
    
  BEHAVIORAL_CONSISTENCY_CHECK:
    applicable_to: [AGENT_IDENTITY]
    method: compare authentication-context behavioral fingerprint against registered baseline
    dimensions:
      - action_request_pattern matches known agent behavior
      - request_origin_jurisdiction consistent with agent's registered jurisdictions
      - request_timing consistent with agent's operational hours
    output: behavioral_confidence_score [0.0–1.0]
    standalone_use: NO — always combined with CRYPTOGRAPHIC_KEYPAIR
    step_up_trigger: behavioral_confidence_score < 0.70 → require additional challenge
    
  API_KEY:
    applicable_to: [SERVICE_ACCOUNT]
    format: base64(sha256(secret)) prefix 32-char identifier
    TTL: 90 days (from credential-lifecycle-manager.md)
    transmission: Authorization: Bearer header only; never in URL or body
    rate_limiting: per-key rate limit enforced at authentication layer
    
  MUTUAL_TLS:
    applicable_to: [EXTERNAL_CONNECTOR, SERVICE_ACCOUNT, FEDERATION_PARTNER]
    certificate_authority: enterprise CA (internal) or partner CA (federation)
    validation: certificate chain + certificate pinning + revocation (OCSP stapling)
    certificate_TTL: 1 year; rotation 30 days before expiry
    
  HARDWARE_MFA:
    applicable_to: [HUMAN_OPERATOR]
    factors:
      something_you_know: passphrase (bcrypt; cost factor 14)
      something_you_have: TOTP (RFC 6238; 30s window; HMAC-SHA1)
      something_you_are: biometric (optional; stored locally on device; not transmitted)
    step_up_conditions:
      - accessing PRIVILEGED resources
      - accessing from new device or location
      - accessing during off-hours
      - accessing constitutional-adjacent systems
      
  CROSS_ENTITY_FEDERATION_TOKEN:
    applicable_to: [FEDERATION_PARTNER]
    protocol: OAuth 2.0 JWT Bearer Token (RFC 7523)
    token_structure:
      header: {alg: ES256, kid: federation_key_id}
      claims:
        iss: home_entity_id
        sub: IDN-{NNN} (home entity identity)
        aud: target_entity_id
        exp: max 1hr
        scope: [permitted_scopes]
        jurisdiction_scope: [JUR-{XX}]
        federation_agreement_id: string
    validation:
      - signature verified against partner's registered federation public key
      - federation_agreement_id active and not expired
      - requested scopes within federation agreement terms
      - jurisdiction_scope consistent with target entity's sovereignty rules
```

---

## Authentication Pipeline

```
authenticate(identity_id, method, credentials, context):

  # Step 1: Identity lookup and status check
  identity = identity_registry.resolve_identity(identity_id)
  if identity is None: Return AUTHENTICATION_FAILED (reason=UNKNOWN_IDENTITY)
  if identity.status != ACTIVE: Return AUTHENTICATION_FAILED (reason=identity.status)
  
  # Step 2: Method validation
  if method not in allowed_methods(identity.identity_type):
    Return AUTHENTICATION_FAILED (reason=INVALID_METHOD)
    
  # Step 3: Replay attack prevention
  if nonce_already_used(credentials.nonce):
    alert_security_ops(REPLAY_ATTACK_SUSPECTED, identity_id)
    Return AUTHENTICATION_FAILED (reason=REPLAY_DETECTED)
    
  # Step 4: Primary credential verification
  credential = credential_vault.get_active_credential(identity.primary_credential_id)
  primary_valid = verify_credential(method, credential, credentials)
  
  if not primary_valid:
    record_failed_attempt(identity_id, context)
    check_brute_force_threshold(identity_id)   # triggers lockout if exceeded
    Return AUTHENTICATION_FAILED (reason=INVALID_CREDENTIAL)
    
  # Step 5: Behavioral consistency check (AGENT_IDENTITY only)
  if identity.identity_type == AGENT_IDENTITY:
    behavioral_score = behavioral_consistency_check(identity_id, context)
    if behavioral_score < 0.50:
      alert_security_ops(ANOMALOUS_AUTHENTICATION, identity_id, behavioral_score)
      Return AUTHENTICATION_FAILED (reason=BEHAVIORAL_ANOMALY)
    if behavioral_score < 0.70:
      require_step_up_challenge(identity_id)
      
  # Step 6: MFA check (HUMAN_OPERATOR; privileged contexts)
  if requires_mfa(identity, context):
    mfa_valid = verify_mfa(identity_id, credentials.mfa_token)
    if not mfa_valid: Return AUTHENTICATION_FAILED (reason=MFA_FAILED)
    
  # Step 7: Issue session token
  session = issue_session_token(identity, context, behavioral_score)
  
  log_successful_authentication(identity_id, method, context, session.session_id)
  Return AUTHENTICATION_SUCCESS (session=session)
```

---

## Session Token Schema

```yaml
session_token:
  token_id: STK-{NNN}
  issued_at: ISO8601
  expires_at: ISO8601                    # default TTLs below
  
  identity:
    identity_id: IDN-{NNN}
    identity_type: string
    display_name: string
    risk_tier: string
    
  authorization_context:
    roles: [ROLE-{NNN}]                  # snapshot of roles at authentication time
    jurisdiction: JUR-{XX}
    autonomy_level: integer
    
  session:
    session_id: string                   # unique per session; not reusable
    source_ip: string | null
    source_agent_id: string | null
    authentication_method: string
    behavioral_confidence: float | null
    mfa_verified: boolean
    
  constraints:
    max_privilege_level: string          # ceiling for this session (cannot exceed)
    allowed_jurisdictions: [JUR-{XX}]
    step_up_required_for: [string]       # resource classes requiring step-up in this session
    
  integrity:
    token_hash: sha256
    signed_by: IAM-AUT-001              # signed by authentication engine
    
  session_ttl_defaults:
    AGENT_IDENTITY: 8 hours (renewable with fresh behavioral check)
    SERVICE_ACCOUNT: 24 hours (non-renewable; re-authenticate for new session)
    HUMAN_OPERATOR: 4 hours (renewable with MFA re-challenge)
    EXTERNAL_CONNECTOR: 1 hour (renewable with mTLS)
    FEDERATION_PARTNER: 1 hour (non-renewable; must re-federate)
```

---

## Brute Force and Lockout Policy

```yaml
lockout_policy:
  failed_attempt_window: 300 seconds (5 minutes)
  
  thresholds:
    AGENT_IDENTITY:
      soft_lockout: 5 failures → 30-minute lockout + T1 alert
      hard_lockout: 10 failures → T2 investigation + T3 review required to unlock
      
    HUMAN_OPERATOR:
      soft_lockout: 5 failures → 15-minute lockout + notification to operator
      hard_lockout: 10 failures → account locked; T3 manual unlock required
      
    SERVICE_ACCOUNT:
      alert_threshold: 3 failures → T2 immediate alert (service accounts should not fail)
      lockout: 5 failures → credential revoked; T3 re-issue required
      
    FEDERATION_PARTNER:
      alert_threshold: 3 failures → T3 alert + partner federation team notified
      lockout: 5 failures → federation token revoked; re-federation required
      
  constitutional_identity_threshold:
    description: constitutional governor and T4+ identities
    any_failure: immediate T3 alert; 3 failures → T4 immediate escalation
    no_automated_lockout: manual intervention required to avoid accidental lockout of safety systems
```

---

## Step-Up Authentication

```yaml
step_up_authentication:
  
  triggers:
    resource_sensitivity:
      - accessing SUPER_PRIVILEGED resources
      - accessing constitutional-adjacent systems (proximity > 0.50 context)
      - accessing personal data of > 1,000 data subjects
      - cross-jurisdiction operations without established session context
      
    behavioral_signals:
      - behavioral_confidence_score < 0.70 in current session
      - accessing resource class not typical for this identity
      - unusual temporal pattern (off-hours for this identity)
      
    security_posture:
      - active security incident affecting this identity's org
      - identity recently added to enhanced monitoring
      
  step_up_methods:
    AGENT_IDENTITY: fresh Ed25519 challenge + behavioral re-assessment
    HUMAN_OPERATOR: TOTP re-challenge (always); biometric if registered
    SERVICE_ACCOUNT: not applicable (service accounts don't perform step-up; access denied if insufficient)
    
  step_up_TTL: step-up authentication valid for 30 minutes; then re-challenge required
  step_up_scope: step-up grants access to specific resource class only; not session-wide elevation
```

---

## Integration

```
Feeds into:
  authorization-engine.md — validated session token passed for authorization decisions
  policy-decision-point.md — session context included in policy evaluation
  identity-threat-detection.md — failed authentications and behavioral anomalies
  security-event-correlator.md — authentication events feed IDENTITY_EVENTS source

Receives from:
  identity-registry.md — identity resolution and status validation
  credential-vault.md — active credentials fetched for verification
  behavioral-anomaly-detector.md — behavioral consistency scores
  security/token-replay-prevention.md — nonce validation and replay detection
```

---

## Governance

**No anonymous authentication:** Every successful authentication must produce a session token linked to a registered identity; anonymous sessions are prohibited  
**Behavioral check is mandatory for agents:** AGENT_IDENTITY authentication without behavioral consistency check is rejected regardless of valid credentials  
**Constitutional identity lockout:** Automated lockout is disabled for constitutional governor and T4+ identities; security alerts fire instead to prevent operational disruption  
**Session token integrity:** Session tokens are signed; any token with invalid signature is rejected and triggers a security alert  
**Authentication audit:** All authentication attempts (success and failure) to `memory/identity-management/authentication-audit.jsonl`; 7-year retention
