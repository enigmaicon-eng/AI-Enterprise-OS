# Privileged Session Monitor
**ID:** IAM-PSM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Records, monitors, and analyzes all privileged and super-privileged sessions in real time — capturing every action taken, detecting anomalous behavior within sessions, and generating a complete, tamper-evident audit trail for every privileged operation. The Privileged Session Monitor closes the gap between "access was granted" and "access was used appropriately": it ensures that privileged access is exercised within approved scope, at appropriate scale, and without signs of abuse or compromise.

---

## Session Recording Tiers

```yaml
session_recording_tiers:

  ELEVATED_sessions:
    recording: METADATA_ONLY
    captured: [action_type, resource_id, timestamp, decision, session_id, identity_id]
    not_captured: action parameters, data accessed
    storage_TTL: 7 years
    
  PRIVILEGED_sessions:
    recording: FULL_ACTION_LOG
    captured: [metadata + action_parameters + resource_content_hashes + decision_rationale]
    not_captured: raw secret values; personal data content (hashed reference only)
    storage_TTL: 7 years
    post_session_review: T3 within 24 hours
    
  SUPER_PRIVILEGED_sessions:
    recording: FULL_ACTION_LOG + REAL_TIME_OBSERVER
    captured: [full action log + input parameters + output summaries + timestamps]
    real_time_observer: T3 SOC analyst observes session as it happens
    post_session_review: T3 + T4 within 4 hours; mandatory sign-off required
    storage_TTL: permanent
```

---

## Real-Time Session Analysis

```
monitor_privileged_session(session_id, jit_token):

  session_state = {
    session_id, identity_id, privilege_tier,
    approved_scope: jit_token.scope,
    approved_action_types: jit_token.allowed_action_types,
    action_count: 0,
    action_velocity: [],        # actions per minute; sliding window
    scope_violations: [],
    anomaly_score: 0.0
  }
  
  while session_active(session_id):
    event = await_session_event(session_id)
    
    # Step 1: Scope compliance check
    if event.resource_id not in session_state.approved_scope:
      session_state.scope_violations.append(event)
      alert_T3(SCOPE_VIOLATION, session_id, event)
      # For SUPER_PRIVILEGED: immediate session termination on scope violation
      if jit_token.privilege_tier == SUPER_PRIVILEGED:
        terminate_session(session_id, reason=SCOPE_VIOLATION)
        Return
        
    # Step 2: Action type check
    if event.action_type not in session_state.approved_action_types:
      session_state.scope_violations.append(event)
      alert_T3(UNAUTHORIZED_ACTION_TYPE, session_id, event)
      
    # Step 3: Action velocity monitoring
    session_state.action_velocity = compute_rolling_velocity(session_state.action_count, window=60s)
    if session_state.action_velocity > velocity_threshold(jit_token.privilege_tier):
      alert_T3(UNUSUAL_ACTION_VELOCITY, session_id, session_state.action_velocity)
      
    # Step 4: Sensitive action detection
    if is_sensitive_action(event):
      log_sensitive_action(event, session_id, jit_token)
      notify_observer_if_present(session_state.observer_id, event)
      
    # Step 5: Anomaly score update
    session_state.anomaly_score = update_anomaly_score(session_state, event)
    if session_state.anomaly_score > 0.80:
      alert_T3(ANOMALOUS_PRIVILEGED_SESSION, session_id, session_state.anomaly_score)
      if session_state.anomaly_score > 0.95:
        terminate_session(session_id, reason=ANOMALY_THRESHOLD_EXCEEDED)
        Return
        
    session_state.action_count += 1
    log_session_event(event, session_state)
```

---

## Anomaly Detection for Privileged Sessions

```yaml
privileged_session_anomalies:

  SCOPE_CREEP:
    definition: session accessing resources outside the approved scope in JIT token
    detection: every resource access checked against JIT token scope list
    severity: HIGH (ELEVATED/PRIVILEGED); CRITICAL (SUPER_PRIVILEGED)
    
  UNUSUAL_ACTION_VELOCITY:
    definition: action rate significantly above expected for this session type
    threshold: > 30 actions/minute for PRIVILEGED; > 10 actions/minute for SUPER_PRIVILEGED
    severity: HIGH; CRITICAL if sustained > 2 minutes
    
  MASS_READ_PATTERN:
    definition: systematic enumeration of resources suggesting data staging
    detection: > 100 distinct resource reads within 5 minutes
    severity: CRITICAL
    
  DESTRUCTIVE_ACTION_SEQUENCE:
    definition: DELETE/PURGE actions following read actions on same resource set
    detection: READ(resource_set) WITHIN 10min FOLLOWED_BY DELETE(resource_set)
    severity: CRITICAL; auto-terminate + T4 alert
    
  OFF_SCOPE_PRIVILEGE_ATTEMPT:
    definition: attempt to use privileged session for actions outside the stated emergency or JIT justification
    detection: action_purpose mismatch with session_justification (semantic check)
    severity: HIGH; flagged for post-session review
    
  CREDENTIAL_EXFILTRATION_ATTEMPT:
    definition: attempts to read, copy, or export credential material from credential vault
    detection: any SECRET.READ.ANY action during privileged session not pre-authorized
    severity: CRITICAL; immediate session termination; T4 alert
    
  SESSION_HANDOFF_ATTEMPT:
    definition: privileged session credentials being shared with or delegated to another identity
    detection: session token used from different IP/device than session was established on
    severity: CRITICAL; immediate termination; security incident
```

---

## Session Recording Schema

```yaml
privileged_session_record:
  session_id: string
  jit_token_id: JIT-{NNN}
  emergency_id: EMG-{NNN} | null
  
  identity_id: IDN-{NNN}
  privilege_tier: ELEVATED | PRIVILEGED | SUPER_PRIVILEGED
  
  session_timeline:
    started_at: ISO8601
    ended_at: ISO8601 | null
    termination_reason: string | null
    
  approved_context:
    scope: [string]
    approved_action_types: [string]
    duration_approved_seconds: integer
    
  actions: [PrivilegedAction]
    # PrivilegedAction schema:
    #   action_id: string
    #   timestamp: ISO8601
    #   action_type: string
    #   resource_id: string
    #   parameters_hash: sha256      # hash of parameters; not raw values for sensitive operations
    #   outcome: SUCCESS | FAILURE | BLOCKED
    #   scope_compliant: boolean
    
  anomalies_detected: [string]
  scope_violations: integer
  
  review:
    post_session_review_due: ISO8601
    reviewed_by: [IDN-{NNN}]
    review_outcome: CLEAN | ANOMALIES_FOUND | INCIDENT_DECLARED | null
    reviewed_at: ISO8601 | null
    
  integrity:
    session_log_root_hash: sha256      # merkle root of all action hashes
    signed_by: IAM-PSM-001
```

---

## Integration

```
Feeds into:
  security-alert-manager.md — privileged session anomalies generate HIGH/CRITICAL alerts
  forensic-evidence-collector.md — session recordings are evidence for incident investigations
  privileged-access-manager.md — session termination feeds back to PAM lifecycle
  identity-analytics.md — privileged session patterns feed identity risk scoring

Receives from:
  privileged-access-manager.md — all new privileged sessions registered here
  emergency-access-system.md — emergency sessions always monitored at highest fidelity
  behavioral-anomaly-detector.md — behavioral context enriches session anomaly scoring
```

---

## Governance

**All PRIVILEGED sessions are reviewed:** T3 reviews every PRIVILEGED session recording within 24 hours; missed reviews generate T3 compliance alert  
**All SUPER_PRIVILEGED sessions have real-time observers:** No SUPER_PRIVILEGED session proceeds without a designated T3 observer; observer cannot be the approver  
**Scope violations terminate SUPER_PRIVILEGED sessions:** Any scope violation in a SUPER_PRIVILEGED session causes immediate termination with no human judgment required  
**Session recordings are tamper-evident:** Merkle root hash chain on all action logs; any tampering detected on integrity verification → T4 immediate alert + security incident  
**Audit:** All session events and recordings to `memory/privileged-access/session-monitor-audit.jsonl`; SUPER_PRIVILEGED session records retained permanently
