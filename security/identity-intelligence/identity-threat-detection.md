# Identity Threat Detection
**ID:** IAM-ITD-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Detects identity-based threats — account takeover, credential stuffing, impossible travel, privilege abuse, credential sharing, and identity spoofing — by continuously analyzing authentication events, authorization decisions, and behavioral patterns across the enterprise identity fabric. The Identity Threat Detection system is the security intelligence layer of IAM: it catches threats that succeed in authenticating (and thus bypass the authentication engine) by detecting suspicious patterns in how authenticated identities behave.

---

## Identity Threat Taxonomy

```yaml
identity_threat_taxonomy:

  ACCOUNT_TAKEOVER:
    definition: legitimate identity's credentials used by an unauthorized party
    indicators:
      - authentication from impossible geography (impossible_travel)
      - authentication method change (agent suddenly using new credential)
      - behavioral fingerprint mismatch post-authentication
      - actions inconsistent with identity's historical patterns
      - privilege escalation attempts shortly after authentication
    severity: CRITICAL
    
  CREDENTIAL_STUFFING:
    definition: bulk automated authentication attempts using stolen credential lists
    indicators:
      - high volume of failed authentications from same source in short window
      - sequential identity enumeration (trying IDN-001, IDN-002, IDN-003...)
      - failed authentications spread across many identities from one source
      - success rate < 1% across large authentication volume
    severity: HIGH
    
  CREDENTIAL_SHARING:
    definition: two or more parties using the same identity credentials simultaneously
    indicators:
      - concurrent sessions from different IP/network locations under same identity
      - session token used from different device fingerprint than original session
      - simultaneous actions in different jurisdictions faster than travel allows
    severity: HIGH
    
  PRIVILEGE_ABUSE:
    definition: authenticated identity using legitimate access for unauthorized purposes
    indicators:
      - accessing resources outside established behavioral baseline
      - privilege escalation pattern (step-by-step gaining higher access)
      - data staging behavior (bulk read before transfer)
      - accessing peer identities' data or resources
    severity: HIGH (complements insider-threat-detector.md)
    
  IDENTITY_SPOOFING:
    definition: identity falsely claiming to be another identity in agent communications
    indicators:
      - action.acting_as_agent_id != action.agent_id without delegation record
      - delegation chain exceeds authorized depth
      - behavioral contract scope mismatch for claimed identity
    severity: CRITICAL
    
  SESSION_HIJACKING:
    definition: active session token used by unauthorized party after legitimate authentication
    indicators:
      - session token used from new IP without re-authentication
      - session behavioral pattern shifts mid-session
      - session used beyond authenticated identity's active hours
    severity: CRITICAL
```

---

## Detection Rules

```yaml
identity_threat_rules:

  ITD-001:
    name: "Impossible Travel Detection"
    condition: |
      successful_authentication(identity_id, location=L1) FOLLOWED_BY
      successful_authentication(identity_id, location=L2)
      WHERE geo_distance(L1, L2) > travel_speed_possible(time_delta(auth1, auth2))
    # travel_speed: max 900 km/hr (commercial air); < 30 min gap = same location required
    severity: CRITICAL
    auto_action: terminate_newer_session; alert_T2; require_step_up_for_older_session
    
  ITD-002:
    name: "Concurrent Session Anomaly"
    condition: |
      session_active(identity_id, session_1) AND
      new_authentication(identity_id, session_2) FROM different_device_fingerprint
      WHERE time_delta(session_1.start, session_2.start) < 60_MINUTES
    severity: HIGH
    auto_action: alert_T2; require_step_up_both_sessions
    
  ITD-003:
    name: "Credential Stuffing Pattern"
    condition: |
      failed_authentication_count >= 100 WITHIN 10_MINUTES
      ACROSS >= 20 distinct identity_ids
      FROM same_source_ip OR same_source_subnet
    severity: HIGH
    auto_action: block_source_ip(30 minutes); alert_T2
    
  ITD-004:
    name: "Identity Spoofing via Acting-As"
    condition: |
      action.acting_as != action.actor AND
      NOT valid_delegation_record(action.actor, action.acting_as)
    severity: CRITICAL
    auto_action: block_action; revoke_session(action.actor); alert_T3
    
  ITD-005:
    name: "Rapid Privilege Escalation Ladder"
    condition: |
      SEQUENCE within 30_MINUTES, SAME identity_id:
        jit_request(privilege_tier=A) APPROVED
        jit_request(privilege_tier=B where B > A) APPROVED
        jit_request(privilege_tier=C where C > B)
    severity: HIGH
    auto_action: flag_for_T3_review; require_T4_approval_for_third_escalation
    
  ITD-006:
    name: "Session Token Replay"
    condition: |
      session_token.jti already_in_used_token_store
    severity: CRITICAL
    auto_action: reject_request; terminate_associated_session; alert_T3
    
  ITD-007:
    name: "Off-Hours Privileged Authentication"
    condition: |
      authentication(identity_id, method=PRIVILEGED)
      WHERE current_time NOT IN identity_baseline.active_hours
      AND identity.privilege_level >= PRIVILEGED
    severity: HIGH
    auto_action: require_step_up_mfa; alert_T2; notify_responsible_team
    
  ITD-008:
    name: "Mass Authorization Denial Spike"
    condition: |
      authorization_denial_count > 50 WITHIN 5_MINUTES
      SAME identity_id
    severity: HIGH
    # High denial rate = probing behavior or compromised account with wrong credentials
    auto_action: alert_T2; soft_lockout(15 minutes); T3_review_required
    
  ITD-009:
    name: "Behavioral Post-Authentication Anomaly"
    condition: |
      post-authentication behavioral_fingerprint_delta > 0.30
      COMPARED_TO identity_baseline
    severity: HIGH
    auto_action: require_step_up_authentication; alert_T2
    # A large post-auth behavioral shift suggests the authenticated entity is not the registered identity
    
  ITD-010:
    name: "Simultaneous Cross-Jurisdiction Identity Activity"
    condition: |
      action(identity_id, jurisdiction=JUR-A) AND
      action(identity_id, jurisdiction=JUR-B)
      WHERE time_delta < 120_SECONDS AND JUR-A != JUR-B
      AND geo_distance(JUR-A, JUR-B) > 1000km
    severity: HIGH
    auto_action: alert_T2; flag_for_review
```

---

## Threat Detection Pipeline

```
process_identity_event(event):

  # Step 1: Enrich event with identity context
  identity = identity_registry.get(event.identity_id)
  session = session_store.get(event.session_id)
  baseline = behavioral_profile_store.get(event.identity_id)
  
  # Step 2: Evaluate all applicable rules (parallel)
  rule_hits = evaluate_rules_parallel(event, identity, session, baseline, IDENTITY_THREAT_RULES)
  
  # Step 3: Update behavioral post-auth profile
  update_post_auth_profile(identity.identity_id, event)
  
  # Step 4: Cross-event correlation (time-window patterns)
  correlation_signals = correlate_with_recent_events(event, window=30_MINUTES)
  
  # Step 5: Composite threat score
  threat_score = compute_composite_threat_score(rule_hits, correlation_signals, identity.risk_score)
  
  # Step 6: Alert and action
  if threat_score > 0.80:
    create_alert(severity=CRITICAL, alert_type=IDENTITY_THREAT, threat_score, rule_hits)
    execute_auto_actions(rule_hits)
  elif threat_score > 0.60:
    create_alert(severity=HIGH, alert_type=IDENTITY_THREAT, threat_score, rule_hits)
    
  # Step 7: Audit
  log_event_analysis(event, rule_hits, threat_score)
```

---

## Identity Threat Alert Schema

```yaml
identity_threat_alert:
  alert_id: ALT-ITD-{NNN}
  created_at: ISO8601
  
  threat_type: string                  # from identity_threat_taxonomy
  severity: CRITICAL | HIGH | MEDIUM
  
  subject_identity_id: IDN-{NNN}
  session_id: string | null
  
  evidence:
    triggering_rule: string            # ITD-{NNN}
    rule_evidence: {key: value}        # specific values that triggered the rule
    threat_score: float
    
  auto_actions_taken: [string]
  
  routing:
    minimum_tier: T2
    playbook: PB-SOC-003 | null        # credential compromise playbook
    
  integrity:
    entry_hash: sha256
```

---

## Integration

```
Feeds into:
  security-alert-manager.md — identity threat alerts enter alert queue (T2 minimum)
  security-event-correlator.md — identity threat events feed IDENTITY_EVENTS source
  insider-threat-detector.md — privilege abuse patterns complement insider threat scoring
  authentication-engine.md — detected anomalies trigger step-up authentication requirements

Receives from:
  authentication-engine.md — all authentication events (success + failure)
  authorization-engine.md — all authorization decisions (especially DENY)
  privileged-session-monitor.md — privileged session events
  identity-analytics.md — identity risk scores and behavioral baselines
  security/token-replay-prevention.md — replay detection feeds ITD-006
```

---

## Governance

**Identity spoofing is always CRITICAL:** Any confirmed identity spoofing event declares a security incident automatically; no analyst discretion needed  
**Impossible travel is non-negotiable:** Once impossible travel is detected, the newer session is terminated immediately; no business justification prevents session termination  
**Credential stuffing blocks are automatic:** Source blocks for credential stuffing are applied immediately without human approval; T2 may unblock if confirmed false positive  
**Behavioral post-auth checks are continuous:** Authentication is not a one-time gate; the authentication-engine's behavioral consistency check runs on initial auth, and identity-threat-detection monitors for post-auth behavioral shifts throughout the session  
**Audit:** All identity threat detections and auto-actions to `memory/identity-management/identity-threat-audit.jsonl`; 7-year retention
