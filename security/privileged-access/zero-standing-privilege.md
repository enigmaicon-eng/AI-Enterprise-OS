# Zero Standing Privilege
**ID:** IAM-ZSP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Enforces the enterprise-wide policy that no identity holds permanent, persistent privileged access — ensuring that PRIVILEGED and SUPER_PRIVILEGED entitlements are always time-bounded, task-scoped, and explicitly approved rather than inherited indefinitely. Zero Standing Privilege (ZSP) is the architectural principle that eliminates the most common attack surface in enterprise environments: dormant privileged credentials that, once compromised, give an attacker unlimited time to operate.

---

## ZSP Policy

```yaml
zsp_policy:
  
  CORE_PRINCIPLE:
    statement: "No identity holds persistent, indefinite PRIVILEGED or SUPER_PRIVILEGED access."
    scope: all 144 agents + all service accounts + all human operators
    exceptions: see ZSP_EXCEPTIONS section
    enforcement: automated; PDP enforces; PAM enforces; weekly automated scan
    
  STANDING_PRIVILEGE_DEFINITION:
    definition: any role assignment or direct permission grant at PRIVILEGED+ level with:
      - no expiry date, OR
      - expiry > 8 hours from grant time, OR
      - no associated task justification
    test: "If the identity walked away from this task, would the access still be valid tomorrow?" 
          → If YES, it is standing privilege.
          
  PRIVILEGE_TIERS_COVERED:
    ELEVATED: permitted as standing access up to 8 hours with certification; rolling certification
    PRIVILEGED: NO standing access; all access via JIT (privileged-access-manager.md)
    SUPER_PRIVILEGED: NO standing access; all access via JIT with dual authorization
    
  PERMANENTLY_EXCLUDED_FROM_ZSP:
    # Certain read-only observation permissions are not "privilege" in the ZSP sense
    excluded: [AUDIT.READ.*, SECURITY.ALERT.READ, COMPLIANCE.DECISION.READ, ROLE.READ, PERMISSION.READ]
    rationale: read-only observability permissions do not enable harmful actions; treating them as privilege creates operational friction without security benefit
```

---

## ZSP Enforcement Mechanisms

```yaml
enforcement_mechanisms:

  PDP_ENFORCEMENT:
    mechanism: authorization-engine checks role assignment expiry on every authorization decision
    expired_role: treated as if role does not exist; authorization denied
    expired_session_token: rejected at authentication layer before PDP evaluation
    
  PAM_ENFORCEMENT:
    mechanism: all PRIVILEGED+ role assignments issued via JIT with max_duration ceiling
    standing_grant_prevention: role-management.md rejects permanent PRIVILEGED+ role assignments
    TTL_injection: every PRIVILEGED+ grant has automatic expiry injected at time of assignment
    
  WEEKLY_ZSP_SCAN:
    trigger: every Sunday 03:00 UTC
    scope: all role assignments marked PRIVILEGED or SUPER_PRIVILEGED
    checks:
      - role_assignment.valid_until is not null
      - role_assignment.valid_until < now() + 8 hours from time of grant (not from now)
      - role_assignment has associated justification_id
      - justification_id resolves to an active JIT approval record
    violations:
      STALE_PRIVILEGED_GRANT: role_assignment.valid_until is null or expired → immediate revocation + T3 alert
      LONG_DURATION_GRANT: valid_until > max_duration(privilege_tier) → T3 review required
      UNJUSTIFIED_GRANT: no valid JIT approval linked → immediate revocation + T3 alert + security incident
      
  CERTIFICATION_INTEGRATION:
    quarterly_privileged_review: access-governance.md runs certification of all PRIVILEGED+ identities
    zsp_compliance_check: certification includes ZSP compliance check as standard gate
    failure_to_certify: PRIVILEGED+ entitlements not certified in 14 days → auto-revoked
```

---

## Permitted Exceptions

```yaml
zsp_exceptions:

  OPERATIONAL_CONTINUITY_EXCEPTION:
    description: critical systems that require always-available privileged responders
    examples: [SOC on-call T3 analyst, constitutional governor monitoring agent, compliance engine core]
    permitted_access: PRIVILEGED (not SUPER_PRIVILEGED) READ access to monitoring and alerting systems only
    approval: T4 + annual review
    duration: maximum 8-hour shifts; rolling re-authorization per shift change
    exception_record: ZSP-EXC-{NNN}; T4 signed; quarterly review mandatory
    
  BREAK_GLASS_PRE_AUTHORIZATION:
    description: break-glass credentials pre-staged for emergency access (emergency-access-system.md)
    status: PRE_STAGED (not active; requires emergency declaration to activate)
    permitted: Yes (pre-staged but inactive credentials are not "standing access")
    review: quarterly validation that pre-staged credentials are not inadvertently active
    
  AUTOMATED_SYSTEM_ACCOUNTS:
    description: service accounts that drive automated, continuous compliance enforcement
    examples: [compliance-engine-sa, constitutional-governor-quorum-sa, identity-registry-sa]
    permitted_access: limited to specific, defined automated operations only; no interactive access
    approval: T4 + architectural review + annual certification
    characteristic: these accounts CANNOT initiate ad-hoc privileged operations; they have programmatic access to specific APIs only
    exception_record: ZSP-EXC-{NNN}; quarterly review
    
  no_exceptions_for:
    SUPER_PRIVILEGED: absolutely no standing SUPER_PRIVILEGED access; no exceptions
    CONSTITUTIONAL_SYSTEMS_WRITE: no standing write access to constitutional governance systems
    IDENTITY_MANAGEMENT_WRITE: no standing write access to identity provisioning or decommissioning
    CROSS_JURISDICTION_DATA_WRITE: no standing cross-border data transfer authority
```

---

## ZSP Violation Response

```yaml
violation_response:

  STALE_PRIVILEGED_GRANT (discovered in weekly scan):
    immediate_actions:
      - revoke role assignment
      - notify identity and responsible_team lead
      - create T3 alert
    investigation: how did this become stale? (process failure; deliberate bypass?)
    remediation: process improvement + re-grant via JIT if still needed
    
  LONG_DURATION_GRANT (> max_duration for tier):
    immediate_actions:
      - cap duration to max_duration; set expiry
      - T3 alert
    review: T3 reviews whether duration was intentionally excessive
    
  UNJUSTIFIED_GRANT (no linked JIT approval):
    immediate_actions:
      - revoke immediately
      - T3 alert + security incident declaration
      - T4 notification
    investigation: security incident; determine if access was exploited
    forensic_review: review all actions taken under the unjustified grant
    
  REPEATED_ZSP_VIOLATIONS (same identity; > 1 in 90 days):
    action: T4 mandatory review; identity flagged for enhanced monitoring
    consideration: is this pattern indicative of insider threat or process bypass?
```

---

## ZSP Metrics and Reporting

```yaml
zsp_metrics:

  current_privileged_grant_count: integer              # should match count of active JIT sessions
  stale_grants_detected_this_week: integer             # target: 0
  unjustified_grants_detected_this_week: integer       # target: 0
  avg_privileged_session_duration: minutes             # should be well below max_duration
  jit_request_to_grant_SLA_compliance: float           # % within SLA
  emergency_access_frequency: count/month              # high frequency = ZSP maturity issue
  
  zsp_maturity_score:
    # 0.0–1.0; measures enterprise progress toward full ZSP
    components:
      no_stale_grants: 0.30
      jit_coverage: 0.30             # % of PRIVILEGED+ operations going through JIT
      exception_count_low: 0.20     # fewer exceptions = better ZSP maturity
      short_session_durations: 0.20 # shorter sessions = less exposure
      
  reporting:
    weekly: ZSP scan results to T3 IAM lead
    monthly: ZSP maturity score + trend to T4 CISO
    quarterly: ZSP compliance status to board security committee (in access governance report)
```

---

## Integration

```
Feeds into:
  privileged-access-manager.md — ZSP policy enforced by PAM JIT workflow
  access-governance.md — ZSP violations trigger access review campaigns
  identity-governance-dashboard.md — ZSP compliance metrics surfaced here
  security-metrics-dashboard.md — ZSP maturity score feeds security posture score

Receives from:
  role-management.md — role assignment TTL enforcement
  authorization-engine.md — expired role assignments result in authorization denials
  identity-lifecycle-manager.md — identity lifecycle events may create ZSP violations (mover without access revocation)
```

---

## Governance

**SUPER_PRIVILEGED has absolute ZSP enforcement:** No exception, no business case, no emergency overrides the ZSP requirement for SUPER_PRIVILEGED access; all such access must go through dual-authorized JIT  
**Exception records are T4-signed and quarterly-reviewed:** Every ZSP exception is documented, approved by T4, and reviewed quarterly; exceptions that are not re-confirmed are automatically revoked  
**ZSP scan results are reported to board:** ZSP compliance is a board-level security metric; any week with > 0 unjustified grants is reported to the board security committee  
**ZSP violations are security incidents:** Unjustified privileged grants trigger security incident declarations, not just administrative alerts  
**Audit:** All ZSP scan results, violations, and exception records to `memory/privileged-access/zsp-audit.jsonl`; 7-year retention; violation records 10 years
