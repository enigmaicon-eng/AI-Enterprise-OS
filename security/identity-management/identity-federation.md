# Identity Federation
**ID:** IAM-FED-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Enables agents and service accounts from one sovereign entity to act within another entity's jurisdiction under controlled, auditable, and revocable trust relationships — without granting full identity in the target entity and without creating permanent cross-entity entitlements. The Identity Federation system is the controlled bridge between entity IAM domains: it enforces that cross-entity identity assertions are scoped, time-bounded, jurisdiction-compliant, and always traceable back to the issuing entity.

---

## Federation Model

```yaml
federation_model:
  
  architecture: FEDERATED_IDENTITY (not centralized identity)
  # Each entity maintains its own identity registry; federation enables controlled cross-entity assertions
  # No entity is authoritative for another entity's identities
  
  trust_hierarchy:
    HOME_ENTITY: entity where identity is natively registered; issues federation tokens
    RELYING_ENTITY: entity receiving the federated identity assertion; grants scoped access
    FEDERATION_BROKER: optional intermediary for multi-hop federation (max 1 hop allowed)
    
  federation_types:
    BILATERAL: direct trust agreement between two specific entities
    MULTILATERAL: federation hub with signed agreements among all hub members
    TRANSITIVE: entity A trusts B which trusts C → A can assert identity to C (requires explicit agreement)
    # Transitive federation requires T4 approval in both A and C; max 1-hop transitivity
```

---

## Federation Agreement Schema

```yaml
federation_agreement:
  agreement_id: FED-AGR-{NNN}
  
  parties:
    issuing_entity: string
    relying_entity: string
    
  validity:
    effective_from: ISO8601
    effective_until: ISO8601
    auto_renewal: boolean
    renewal_notice_days: 30             # notification sent 30 days before expiry
    
  scope:
    permitted_identity_types: [AGENT_IDENTITY | SERVICE_ACCOUNT]
    permitted_roles: [ROLE-{NNN}]       # which roles can be asserted cross-entity
    excluded_roles: [ROLE-{NNN}]        # explicitly excluded even if generally permitted
    max_privilege_level: STANDARD | ELEVATED | PRIVILEGED
    # SUPER_PRIVILEGED is NEVER available via federation; always requires local identity
    
  jurisdiction_constraints:
    permitted_jurisdictions: [JUR-{XX}]  # target entity jurisdictions where federated identity may act
    data_class_restrictions: [string]    # data classes federated identity may NOT access
    cn_restriction: HARD_EXCLUDED        # CN identities never federate out; non-CN cannot federate into CN
    
  token_parameters:
    max_token_TTL: 3600                  # seconds; default 1 hour; cannot exceed
    allowed_scopes: [string]
    require_step_up_for: [string]        # resource classes requiring step-up in relying entity
    
  technical:
    issuer_public_key_id: string         # public key used to verify issuing entity tokens
    token_format: JWT (RFC 7519)
    signing_algorithm: ES256
    
  governance:
    approved_by: IDN-{NNN}              # T4 approval in both entities required
    review_cadence: annual
    last_reviewed_at: ISO8601
    
  status: ACTIVE | SUSPENDED | EXPIRED | TERMINATED
```

---

## Federation Token Issuance and Validation

```
issue_federation_token(identity_id, target_entity_id, requested_scopes, context):

  # Step 1: Verify home entity identity is ACTIVE
  identity = identity_registry.resolve(identity_id)
  validate_identity_active(identity)
  
  # Step 2: Load and validate federation agreement
  agreement = load_federation_agreement(home_entity=current_entity, relying_entity=target_entity_id)
  if agreement is None or agreement.status != ACTIVE:
    Return FEDERATION_DENIED (reason=NO_ACTIVE_AGREEMENT)
    
  # Step 3: Scope validation
  if not all(scope in agreement.allowed_scopes for scope in requested_scopes):
    Return FEDERATION_DENIED (reason=SCOPE_NOT_PERMITTED)
    
  # Step 4: Privilege level check
  identity_max_privilege = get_max_privilege(identity)
  if identity_max_privilege > agreement.max_privilege_level:
    effective_privilege = agreement.max_privilege_level   # cap at agreement level
    
  # Step 5: Jurisdiction compliance check
  if context.target_jurisdiction not in agreement.permitted_jurisdictions:
    Return FEDERATION_DENIED (reason=JURISDICTION_NOT_PERMITTED)
  if context.target_jurisdiction == JUR-CN:
    Return FEDERATION_DENIED (reason=CN_HARD_EXCLUDED)
    
  # Step 6: Issue JWT
  token = JWT {
    iss: current_entity_id,
    sub: identity_id,
    aud: target_entity_id,
    iat: now(),
    exp: now() + min(requested_ttl, agreement.max_token_TTL),
    jti: generate_unique_id(),          # single-use token ID
    scope: requested_scopes,
    jurisdiction_scope: [context.target_jurisdiction],
    privilege_ceiling: effective_privilege,
    federation_agreement_id: agreement.agreement_id,
    home_entity_risk_tier: identity.risk_tier
  }
  
  signed_token = hsm.sign(token, issuing_federation_key)
  log_token_issuance(identity_id, target_entity_id, agreement.agreement_id, token.jti)
  Return: signed_token


validate_federation_token(signed_token, target_context):

  # Step 1: Decode and verify signature
  token = decode_jwt(signed_token)
  agreement = load_federation_agreement(issuing_entity=token.iss, relying_entity=current_entity_id)
  verify_signature(signed_token, agreement.issuer_public_key_id)
  
  # Step 2: Standard JWT validation
  validate_not_expired(token)
  validate_audience(token, current_entity_id)
  
  # Step 3: Token replay check (jti must be unique)
  if token_already_used(token.jti):
    alert_security_ops(FEDERATION_TOKEN_REPLAY, token)
    Return VALIDATION_FAILED (reason=REPLAY)
    
  # Step 4: Agreement still active
  if agreement.status != ACTIVE:
    Return VALIDATION_FAILED (reason=AGREEMENT_INACTIVE)
    
  # Step 5: Jurisdiction compliance in relying entity
  if target_context.jurisdiction not in token.jurisdiction_scope:
    Return VALIDATION_FAILED (reason=JURISDICTION_MISMATCH)
    
  # Step 6: Mark jti as used; create local session
  mark_token_used(token.jti)
  local_session = create_federated_session(token, target_context)
  
  Return: VALIDATION_SUCCESS (session=local_session)
```

---

## Cross-Jurisdiction Federation Rules

```yaml
cross_jurisdiction_federation_rules:

  CN_RULES:
    outbound: CN identities CANNOT federate to any other entity (hard prohibition)
    inbound: no external identity can federate INTO CN jurisdiction (hard prohibition)
    rationale: CN sovereignty and data residency requirements make federation incompatible
    override: NONE — no T4/T5/board can override CN federation prohibition
    
  EU_RULES:
    outbound: EU identities may federate to adequate jurisdictions only (US, UK, SG, IN with SCC)
    inbound: external identities may act in EU jurisdiction only with active adequacy/SCC
    data_class_restriction: federated identities cannot access PERSONAL_DATA without explicit DPA agreement
    
  US_RULES:
    outbound: US identities may federate to entities with US-equivalent security posture
    inbound: no special restrictions beyond standard federation agreement
    financial_data: federated identities cannot access financial data without explicit agreement
    
  GENERAL:
    max_privilege_ceiling: PRIVILEGED (SUPER_PRIVILEGED never via federation)
    max_token_TTL: 3600 seconds (1 hour)
    max_chain: 1 hop (A→B→C requires A→C direct agreement; no implicit transitivity)
    active_agreement_required: no federation without a current, T4-approved, signed agreement
```

---

## Federation Audit and Revocation

```yaml
federation_monitoring:
  
  continuous_monitoring:
    token_usage_tracking: every federated token use logged with action context
    cross_entity_action_audit: all actions taken under federated identity logged in BOTH entities
    volume_monitoring: alert if federated identity action volume > 2× baseline
    scope_drift_detection: alert if federated identity accesses resources outside stated scope
    
  agreement_review:
    cadence: annual (or on material change in either entity's security posture)
    trigger_events:
      - security incident in either entity → immediate agreement review
      - jurisdiction law change affecting permitted scopes → Legal Org review + potential suspension
      - entity sovereignty change → T4 review of all agreements with affected entity
      
  emergency_revocation:
    suspend_agreement: T3 either entity (immediate; all in-flight tokens invalidated)
    terminate_agreement: T4 both entities (requires bilateral decision; or T4 one entity in emergency)
    federated_token_revocation: broadcast token jti to relying entity's revocation list; tokens invalid immediately
    
  revocation_propagation:
    mechanism: real-time revocation list pushed to all relying entities via federation channel
    propagation_SLA: < 60 seconds for agreement suspension; < 30 seconds for individual token revocation
    fallback: relying entity re-validates all federated tokens on each use if revocation channel unavailable
```

---

## Integration

```
Feeds into:
  authentication-engine.md — federation token validation integrated into authentication pipeline
  authorization-engine.md — federated session context passed to authorization decisions
  identity-registry.md — FEDERATION_PARTNER identity type registered here

Receives from:
  identity-lifecycle-manager.md — identity decommission triggers federation token revocation
  sovereignty-controls/enterprise-federation.md — federation agreement terms enforced here
  adaptive-compliance/compliance-engine.md — jurisdiction permit validation for federated operations
  network-threat-monitor.md — cross-entity traffic validates against active federation agreements
```

---

## Governance

**CN federation is absolutely prohibited:** No technical mechanism, business justification, or authority level can enable CN federation; this is a hard-coded prohibition in the federation engine  
**Both entities must approve:** Every federation agreement requires T4 approval from both the issuing and relying entity; one-sided federation is not possible  
**Federated identities are always second-class:** Federated identities cannot hold SUPER_PRIVILEGED access, cannot approve high-consequence actions, cannot modify federation agreements, and cannot self-escalate within the relying entity  
**Annual mandatory review:** Federation agreements without annual review are auto-suspended; review cannot be waived  
**Audit:** All federation token issuance, validation, and revocation events to `memory/identity-management/federation-audit.jsonl`; 7-year retention; both entities' audit stores receive the event
