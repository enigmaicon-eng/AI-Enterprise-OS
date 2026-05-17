# Emergency Access System
**ID:** IAM-EAS-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Provides controlled, auditable, and time-bounded "break-glass" access for critical situations where normal JIT approval workflows cannot be completed in time — including active security incidents, system failures, and critical operational emergencies — while ensuring that emergency access is never misused, always reviewed post-hoc, and leaves a complete audit trail. The Emergency Access System is a last resort, not a convenience shortcut.

---

## Emergency Access Classification

```yaml
emergency_classifications:

  OPERATIONAL_EMERGENCY:
    definition: critical enterprise function failing; normal access workflows unavailable; immediate access required
    examples: [SOC primary analyst unavailable during CRITICAL incident, compliance engine failure during regulatory deadline, model integrity violation requiring immediate investigation]
    approval: T3 on-call (self-approval for own domain; T4 for cross-domain)
    max_duration: 4 hours
    scope: minimum required to address the emergency
    
  SECURITY_INCIDENT_EMERGENCY:
    definition: active security incident requiring immediate privileged access to contain or investigate
    examples: [ransomware active spread, insider threat evidence preservation, supply chain compromise containment]
    approval: T3 incident commander (self-declared with immediate T4 notification)
    max_duration: 8 hours (incident duration; reviewed and re-authorized each 4 hours)
    scope: incident-scoped only; no access outside incident perimeter
    
  SYSTEM_FAILURE_EMERGENCY:
    definition: critical system failure where recovery requires privileged access not available to on-call responder
    examples: [PDP failure requiring policy manual override, constitutional governor failure, credential vault unavailability]
    approval: T4 (always; no T3 self-authorization for system-level emergencies)
    max_duration: 2 hours (recovery window)
    scope: strictly the failing system and its immediate dependencies
    
  CONSTITUTIONAL_EMERGENCY:
    definition: immediate threat to constitutional governance systems requiring emergency access
    examples: [constitutional quorum failure, constitutional governor compromise suspected]
    approval: T4 + constitutional quorum (minimum 2 quorum members; non-bypassable)
    max_duration: 1 hour
    scope: constitutional systems only; no scope creep permitted
    post_use: mandatory T5 + full quorum review before any action taken under emergency access becomes permanent
```

---

## Emergency Access Workflow

```
initiate_emergency_access(requestor_id, emergency_type, scope, justification):

  # Step 1: Emergency declaration
  emergency = EmergencyRecord {
    emergency_id: EMG-{NNN},
    declared_at: now(),
    declared_by: requestor_id,
    emergency_type: emergency_type,
    requested_scope: scope,
    justification: justification,
    status: DECLARED
  }
  
  # Step 2: Immediate notifications (before access is granted)
  notify_T4_immediately(emergency)
  notify_T3_on_call(emergency)
  alert_SOC(emergency)    # SOC is always aware of active emergency access
  
  # Step 3: Approval (type-dependent; see classification above)
  approval = route_emergency_approval(emergency)
  
  if emergency_type == CONSTITUTIONAL_EMERGENCY:
    require_quorum_approval(emergency, min_quorum=2)
    
  if not approval.granted:
    emergency.status = DENIED
    log_emergency_denied(emergency, approval)
    Return EMERGENCY_ACCESS_DENIED
    
  # Step 4: Issue emergency credential (minimal scope; time-bounded)
  emergency_cred = issue_emergency_credential(
    identity_id = requestor_id,
    scope = minimize_scope(approval.approved_scope),   # approve minimum of requested vs. needed
    duration = min(approval.approved_duration, max_duration(emergency_type)),
    emergency_id = emergency.emergency_id
  )
  
  # Step 5: Activate full monitoring (immediately; not after session starts)
  activate_emergency_monitoring(requestor_id, emergency.emergency_id)
  
  emergency.status = ACTIVE
  emergency.credential_id = emergency_cred.credential_id
  log_emergency_granted(emergency, approval, emergency_cred)
  
  Return: emergency_cred


revoke_emergency_access(emergency_id, reason):
  # Can be called by: requestor (clean exit), T3+, T4 (forced), or automatic (TTL expiry)
  emergency = load_emergency(emergency_id)
  
  revoke_credential(emergency.credential_id)
  terminate_all_sessions_under_emergency(emergency_id)
  emergency.status = REVOKED
  emergency.revoked_at = now()
  emergency.revocation_reason = reason
  
  notify_T4(emergency_revoked)
  schedule_post_emergency_review(emergency_id, due_in=24hr)
  log_emergency_revocation(emergency)
```

---

## Emergency Credential Schema

```yaml
emergency_credential:
  credential_id: CRD-EMG-{NNN}
  emergency_id: EMG-{NNN}
  
  identity_id: IDN-{NNN}
  
  access:
    scope: [string]                    # explicit list; no wildcards for CONSTITUTIONAL_EMERGENCY
    privilege_tier: PRIVILEGED | SUPER_PRIVILEGED
    
  validity:
    issued_at: ISO8601
    expires_at: ISO8601                # hard expiry; no extension
    max_extension: 0                   # emergency credentials cannot be extended
    
  approval:
    approved_by: IDN-{NNN}
    second_approver_id: IDN-{NNN} | null  # required for CONSTITUTIONAL_EMERGENCY
    approval_timestamp: ISO8601
    approved_scope: [string]
    
  constraints:
    actions_allowed: [string]          # explicit whitelist for CONSTITUTIONAL_EMERGENCY
    actions_prohibited: [string]       # explicit blacklist to prevent scope creep
    scope_check_enforcement: STRICT    # every action checked against approved scope
    
  monitoring:
    real_time_monitor: true            # always enabled for emergency credentials
    T3_observer_required: boolean      # true for CONSTITUTIONAL_EMERGENCY
    action_log_granularity: FULL       # every action, every parameter logged
    
  integrity:
    credential_hash: sha256
    signed_by: [approver_ids]          # multi-signed for CONSTITUTIONAL_EMERGENCY
```

---

## Post-Emergency Review

```yaml
post_emergency_review:

  mandatory_for: all emergency access events (no exceptions)
  
  review_SLA:
    OPERATIONAL_EMERGENCY: T3 review within 48 hours
    SECURITY_INCIDENT_EMERGENCY: T3 + T4 review within 24 hours
    SYSTEM_FAILURE_EMERGENCY: T3 + T4 review within 24 hours
    CONSTITUTIONAL_EMERGENCY: T4 + full constitutional quorum review within 4 hours
    
  review_contents:
    - was the emergency declaration justified? (legitimate emergency or convenience misuse?)
    - was the scope of access truly minimal? (scope creep check)
    - what actions were taken under emergency access? (action log review)
    - were any actions taken outside approved scope? (if yes: immediate incident declaration)
    - what prevented normal JIT approval from being used? (process improvement finding)
    - should any permanent access changes result from this emergency? (via normal workflow; not via emergency)
    
  outcomes:
    JUSTIFIED_NO_SCOPE_CREEP: record closed; process improvement recommendations filed
    JUSTIFIED_WITH_SCOPE_CREEP: record closed; T3 formal warning to requestor; access audit for scope-crept resources
    UNJUSTIFIED: emergency misuse incident declared; T4 notification; identity flagged for enhanced monitoring
    
  permanent_access_from_emergency:
    prohibited: emergency access cannot be converted to permanent standing access
    required: if permanent access is needed, must go through normal JIT provisioning workflow
    
  emergency_misuse_definition:
    declaring_emergency_for_convenience: using emergency access when normal JIT could have been used within SLA
    scope_creep: accessing resources outside approved emergency scope
    post_emergency_use: any attempt to use emergency credentials after emergency is closed
```

---

## Emergency Access Metrics

```yaml
emergency_metrics:
  emergency_access_frequency: count per month by type
  average_emergency_duration: minutes per emergency type
  scope_creep_rate: % of emergencies with scope violations (target: 0%)
  post_review_completion_rate: % completed within SLA (target: 100%)
  unjustified_emergency_rate: % of emergencies found unjustified (target: 0%)
  
  alert_thresholds:
    frequency_spike: > 3 emergencies in 24 hours by same identity → T3 alert (misuse suspected)
    constitutional_emergency_any_use: every constitutional emergency → T4 immediate notification
    
  review_cadence: monthly emergency access usage report to T4 CISO
```

---

## Integration

```
Feeds into:
  privileged-access-manager.md — emergency access overrides normal JIT when required
  forensic-evidence-collector.md — all emergency sessions have mandatory evidence preservation
  security-alert-manager.md — all emergency access events create security alerts
  post-incident-analysis.md — emergency access review feeds PIR when associated with incidents

Receives from:
  incident-response-orchestrator.md — CRITICAL incidents may trigger emergency access need
  security-event-correlator.md — critical correlation events may require emergency access for response
  identity-lifecycle-manager.md — identity suspensions may trigger emergency access by backup identity
```

---

## Governance

**Emergency access is last resort:** The Emergency Access System is not a convenience mechanism; its use for situations where normal JIT was merely inconvenient is grounds for a compliance finding  
**Constitutional emergencies always require quorum:** No single identity, including T5, can authorize constitutional emergency access alone; quorum is non-negotiable  
**Post-review is mandatory and non-deferrable:** Post-emergency review SLAs cannot be extended; missed reviews are automatically escalated to T4 and recorded as compliance findings  
**Permanent access prohibition:** No emergency access scenario creates permanent standing access; all permanent access changes must go through the standard IAM provisioning workflow  
**Audit:** All emergency access events, approvals, actions, and reviews to `memory/privileged-access/emergency-access-audit.jsonl`; permanent retention for CONSTITUTIONAL_EMERGENCY; 10-year for others
