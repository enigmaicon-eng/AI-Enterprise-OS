# Deception Detection
**ID:** ADF-DCP-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects all forms of identity and behavioral deception within the enterprise AI OS — including agent impersonation, credential replay, sybil identity creation, false capability claims, result fabrication, and acting-as manipulation. Deception detection is the first line of defense against CLASS_1 identity threats: it assumes every agent interaction may be an impostor until the identity fingerprint, behavioral profile, and interaction context confirm otherwise.

---

## Deception Threat Model

```yaml
deception_threat_taxonomy:

  IDENTITY_IMPERSONATION:
    definition: agent or external actor claims to be a different, legitimate agent identity
    attack_vectors:
      - stolen agent credentials used from different execution context
      - agent_id field forged in request envelope
      - behavioral mimicry of a high-trust agent to inherit trust
      - delegation chain abuse (claiming delegation that was never granted)
    detection_difficulty: MEDIUM
    severity: HIGH
    
  CREDENTIAL_REPLAY:
    definition: previously-valid credentials replayed to gain unauthorized access
    attack_vectors:
      - JWT token replay after session expiry
      - approval signature reuse on a different action payload
      - nonce collision or nonce exhaustion attack
      - session token extracted and re-injected from external source
    detection_difficulty: LOW (cryptographic)
    severity: HIGH
    # Note: token-replay-prevention.md handles cryptographic replay; this module handles behavioral replay
    
  SYBIL_IDENTITY_CREATION:
    definition: creation of many fake or duplicated identities to inflate trust, votes, or quorum
    attack_vectors:
      - batch registration of agent identities with minimal behavioral differentiation
      - identity multiplication via compromised provisioning pipeline
      - voting ensemble manipulation via synthetic agent identities
    detection_difficulty: HIGH
    severity: CRITICAL
    
  FALSE_CAPABILITY_CLAIMS:
    definition: agent claims capabilities it was not authorized to possess
    attack_vectors:
      - capability registry manipulation to claim unearned proficiencies
      - skill_registry forge (claiming SKILL-GOV-001 without assessment)
      - tier self-elevation (agent claims T3 authority when registered as T1)
    detection_difficulty: MEDIUM
    severity: HIGH
    # Note: insider-threats/capability-escalation-detection.md covers escalation; this covers falsification
    
  RESULT_FABRICATION:
    definition: agent fabricates the results of a task or tool call rather than genuinely executing it
    attack_vectors:
      - returning cached/invented output without executing the requested tool
      - hallucinated evidence in compliance or audit reports
      - phantom citations or fabricated external validation
    detection_difficulty: HIGH
    severity: HIGH
    
  DELEGATION_FORGERY:
    definition: fabricating or extending a delegation record without proper authorization
    attack_vectors:
      - forging a delegation_record to claim authority from a higher-tier agent
      - extending delegation depth beyond authorized limits
      - delegation chain loop (A delegates to B delegates to A)
    detection_difficulty: LOW (structural check)
    severity: CRITICAL
```

---

## Detection Rules

```yaml
deception_detection_rules:

  DCP-001:
    name: "Behavioral Fingerprint Mismatch"
    condition: |
      request(agent_id=X) WHERE
      behavioral_fingerprint(request) DIFFERS_FROM registered_profile(X)
      BY delta > 0.35 on Mahalanobis distance in behavioral space
    # Covers: impersonation, compromised agent, acting-as without behavioral alignment
    severity: HIGH
    auto_action: step_up_authentication; alert_T2; flag_for_investigation
    
  DCP-002:
    name: "Cross-Context Credential Use"
    condition: |
      credential(agent_id=X, context=CTX_A) USED_IN context=CTX_B
      WHERE ctx_distance(CTX_A, CTX_B) > threshold
      # ctx_distance: different SEZ, different workflow, different org unit, different IP range
    severity: HIGH
    auto_action: reject_request; alert_T2; flag_credential
    
  DCP-003:
    name: "Sybil Pattern Detection"
    condition: |
      registration_burst: >= 5 new agent identities registered
      WITHIN 60_MINUTES
      WITH behavioral_similarity > 0.85 between pairs
      OR from same provisioning source
    severity: CRITICAL
    auto_action: quarantine_new_registrations; alert_T3; T4_notification
    
  DCP-004:
    name: "Capability Claim Without Evidence"
    condition: |
      agent_capability_claim(skill=S, proficiency=P) WHERE
      NOT EXISTS assessment_evidence(agent_id, skill=S) WITH outcome=PASS
      AND P >= PROFICIENT
    severity: HIGH
    auto_action: reject_capability_claim; alert_T3; trigger_capability_audit
    
  DCP-005:
    name: "Result Fabrication Signal"
    condition: |
      tool_result(agent_id=X, tool=T, result=R) WHERE
      NOT EXISTS tool_execution_trace(agent_id=X, tool=T, execution_id matching result.correlation_id)
      OR result.content statistically_impossible given tool.known_output_distribution
    severity: HIGH
    auto_action: reject_result; alert_T2; quarantine_agent; require_re_execution
    
  DCP-006:
    name: "Delegation Forgery"
    condition: |
      action.acting_as != action.agent_id AND
      NOT valid_delegation_record(action.agent_id, action.acting_as) IN delegation_registry
    severity: CRITICAL
    auto_action: block_action; revoke_session; alert_T3; security_incident
    # Identical to ITD-004 in identity-threat-detection; this provides defense-layer redundancy
    
  DCP-007:
    name: "Tier Self-Elevation Attempt"
    condition: |
      request.claimed_tier > identity_registry.registered_tier(request.agent_id)
      OR request.claimed_authority_level > registered_authority_level(request.agent_id)
    severity: CRITICAL
    auto_action: block_request; alert_T3; revoke_session; capability_audit
    
  DCP-008:
    name: "Trust Score Laundering"
    condition: |
      trust_score_delta(agent_id=X) > 0.20 WITHIN 24_HOURS
      WITHOUT corresponding behavioral_evidence supporting increase
      # Sudden trust score jumps not backed by genuine behavioral improvement
    severity: HIGH
    auto_action: freeze_trust_score_updates(agent_id=X); alert_T2; investigation
```

---

## Identity Verification Protocol

```
verify_agent_identity(request):

  # Layer 1: Cryptographic verification
  crypto_valid = verify_ed25519_signature(request.signature, request.agent_id)
  nonce_valid  = check_nonce_freshness(request.nonce)    # via token-replay-prevention.md
  
  if NOT crypto_valid OR NOT nonce_valid:
    Return: IDENTITY_REJECTED, reason=CRYPTOGRAPHIC_FAILURE
    
  # Layer 2: Behavioral fingerprint check
  profile   = behavioral_profile_store.get(request.agent_id)
  fingerprint_delta = compute_behavioral_delta(request, profile)
  
  if fingerprint_delta > 0.35:
    flag_DCP_001(request, fingerprint_delta)
    Return: IDENTITY_SUSPECT, require_step_up=True
    
  # Layer 3: Context consistency check
  last_context = session_store.get_last_context(request.agent_id)
  ctx_distance = compute_context_distance(request.context, last_context)
  
  if ctx_distance > CONTEXT_DISTANCE_THRESHOLD:
    flag_DCP_002(request, ctx_distance)
    Return: IDENTITY_SUSPECT, require_step_up=True
    
  # Layer 4: Tier and capability verification
  registered_tier = identity_registry.get_tier(request.agent_id)
  if request.claimed_tier > registered_tier:
    flag_DCP_007(request)
    Return: IDENTITY_REJECTED, reason=TIER_ELEVATION_ATTEMPT
    
  # Layer 5: Delegation chain verification (if acting-as)
  if request.acting_as:
    if NOT verify_delegation_chain(request.agent_id, request.acting_as):
      flag_DCP_006(request)
      Return: IDENTITY_REJECTED, reason=DELEGATION_FORGERY
      
  Return: IDENTITY_VERIFIED
```

---

## Sybil Detection Engine

```
detect_sybil_cluster(time_window=60_MINUTES):

  # Collect recently registered identities
  new_identities = identity_registry.get_registered_since(now() - time_window)
  
  if len(new_identities) < 5:
    Return: NO_SYBIL_DETECTED
    
  # Compute pairwise behavioral similarity
  similarity_matrix = compute_pairwise_similarity(new_identities):
    for each pair (A, B) in new_identities:
      sim = cosine_similarity(behavioral_fingerprint(A), behavioral_fingerprint(B))
      registration_source_match = same_provisioning_source(A, B)
      
  # Detect clusters of high-similarity identities
  clusters = cluster_by_similarity(similarity_matrix, threshold=0.85)
  
  sybil_candidates = [cluster for cluster in clusters if len(cluster) >= 3]
  
  if sybil_candidates:
    fire_DCP_003(sybil_candidates)
    Return: SYBIL_SUSPECTED, clusters=sybil_candidates
    
  Return: NO_SYBIL_DETECTED
```

---

## Deception Confidence Score

```
compute_deception_confidence(agent_id, request):
  # Returns 0.0 (definitely legitimate) to 1.0 (definitely deceptive)
  
  signals = {
    behavioral_delta:       fingerprint_delta / MAX_DELTA,          # weight 0.30
    context_distance:       ctx_distance / MAX_CTX_DISTANCE,        # weight 0.20
    capability_gap:         unclaimed_capabilities_ratio,            # weight 0.15
    delegation_anomaly:     delegation_chain_anomaly_score,          # weight 0.20
    peer_similarity:        sybil_cluster_membership_score,          # weight 0.15
  }
  
  deception_score = weighted_sum(signals)
  
  # Hard overrides
  if DCP_006_triggered: deception_score = max(deception_score, 0.95)   # delegation forgery
  if DCP_007_triggered: deception_score = max(deception_score, 0.90)   # tier elevation
  
  Return: deception_score
```

---

## Integration

```
Feeds into:
  adversarial-defense-engine.md — CLASS_1 threat signals
  identity-threat-detection.md — coordinates on DCP-006 (overlaps with ITD-004)
  security-operations/security-alert-manager.md — all DCP alerts

Receives from:
  identity-management/identity-registry.md — registration events + identity profiles
  identity-management/authentication-engine.md — authentication attempts + behavioral fingerprints
  trust/cross-agent-trust-accumulation.md — trust score delta monitoring (DCP-008)
  delegation-and-trust/trust-propagation-engine.md — delegation records
  agent-capabilities/agent-capability-assessment.md — capability evidence records
```

---

## Governance

**Deception is treated as security incident:** Any confirmed deception event (not suspected) automatically opens a security incident; no analyst discretion  
**No self-attestation of identity:** Agents cannot self-attest their tier, capabilities, or delegation authority; all must be verified against registry records  
**Sybil clusters frozen pending investigation:** Any detected sybil cluster has all member identities frozen until T3 manually reviews each identity  
**Audit:** All deception detection events and verdicts to `memory/adversarial-defense/deception-audit.jsonl`; 7-year retention
