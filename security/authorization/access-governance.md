# Access Governance
**ID:** IAM-AGV-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Ensures that access entitlements across the enterprise remain appropriate, minimal, and compliant over time — through structured access certification campaigns, entitlement analytics, orphan entitlement detection, and continuous access risk monitoring. Access Governance is the oversight layer that prevents the accumulation of unneeded access rights ("privilege creep") that makes enterprises vulnerable to insider threats and compliance violations. Without access governance, even well-designed IAM systems degrade over time.

---

## Access Certification Framework

```yaml
access_certification:
  
  campaign_types:
  
    ANNUAL_ENTERPRISE_REVIEW:
      scope: all active identities; all role assignments
      cadence: annually (Q1); triggered January 15
      certifier_assignment:
        STANDARD identities: responsible_team lead
        ELEVATED identities: T3 domain lead
        PRIVILEGED identities: T3 IAM + T4 CISO
        SUPER_PRIVILEGED identities: T4 + T5
      duration: 30 days to complete; no extensions without T4 approval
      
    QUARTERLY_PRIVILEGED_REVIEW:
      scope: all PRIVILEGED and SUPER_PRIVILEGED identities and roles
      cadence: quarterly (Q1/Q2/Q3/Q4); triggered on first Monday of quarter
      certifier: T4 CISO + T3 IAM lead
      duration: 14 days
      
    CONTINUOUS_HIGH_RISK_MONITORING:
      scope: identities with risk_tier == CRITICAL or HIGH; identities on enhanced monitoring list
      cadence: rolling 90-day certification cycle per identity (not batch)
      certifier: T3 SOC lead
      
    EVENT_DRIVEN_REVIEW:
      triggers:
        - identity moves to new org unit or jurisdiction
        - role mining identifies privilege creep or SoD violation
        - security incident involving identity
        - identity flagged by insider threat detector (ELEVATED+)
        - identity has not authenticated in > 60 days
      duration: must complete within 14 days of trigger
      
    ROLE_DEFINITION_REVIEW:
      scope: triggered when a role definition changes (permissions added/removed)
      certifier: T3 IAM + T4 for PRIVILEGED roles
      action: re-certify all identities holding the changed role
```

---

## Certification Campaign Workflow

```yaml
certification_campaign:
  campaign_id: CERT-{NNN}
  campaign_type: string
  launched_at: ISO8601
  deadline: ISO8601
  
  campaign_lifecycle:
    LAUNCHED:
      actions:
        - enumerate all in-scope identities and entitlements
        - assign certifiers to each identity
        - send certification requests with context packages
        - set up progress dashboard
        
    IN_PROGRESS:
      certifier_interface:
        per_identity_package:
          - identity record summary
          - all current roles and direct permissions
          - last-used date per role/permission (from authorization decision log)
          - unused entitlements flagged (not used in > 90 days)
          - peer group comparison (does this identity have more access than peers?)
          - risk signals (recent anomalies, behavioral drift, violations)
        decision_options_per_entitlement:
          CERTIFY: access is appropriate; retain
          REVOKE: access is not needed; remove immediately
          MODIFY: access should be reduced (opens modification request)
          ESCALATE: certifier cannot decide; escalate to T3/T4
          
    RUBBER_STAMP_DETECTION:
      definition: certifier certifies all entitlements in < 2 minutes without reviewing context
      detection: certifier who certifies > 10 entitlements/minute is flagged as rubber-stamping
      action: escalate flagged entitlements to T3; certifier notified; compliance record created
      
    OVERDUE:
      at_deadline_minus_5_days: reminder to certifier + manager
      at_deadline: uncertified entitlements auto-revoked (PRIVILEGED+) or auto-escalated to T3 (STANDARD)
      at_deadline_plus_1: T4 notification for any PRIVILEGED entitlement not certified
      
    CLOSED:
      actions:
        - compile revocation list; execute all revocations
        - record campaign outcome in certification store
        - update identity records (last_certification_at)
        - generate campaign report for T3 + T4
```

---

## Entitlement Analytics

```yaml
entitlement_analytics:

  OVER_PROVISIONING_DETECTION:
    method: compare granted permissions vs. permissions actually used in last 90 days
    metric: utilization_rate = used_permissions / granted_permissions
    threshold: utilization_rate < 0.50 for 90 days → flag for recertification
    action: include in next certification campaign; highlight to certifier
    
  PRIVILEGE_CREEP_MONITORING:
    method: track permission count and privilege level over time per identity
    anomaly: net increase in ELEVATED+ permissions without corresponding role change
    alert: T3 alert if PRIVILEGED+ permissions increased without documented justification
    
  ENTITLEMENT_OUTLIER_DETECTION:
    method: compare each identity's entitlements to peer group median and distribution
    peer_group: same org unit + same function + same jurisdiction
    outlier_threshold: entitlement count > mean + 2σ of peer group
    action: included in event-driven review; certifier receives peer comparison in package
    
  DORMANT_ENTITLEMENT_DETECTION:
    method: identify roles and permissions not exercised in > 90 days
    action: flag in certification campaign; auto-revoke after 180 days if not re-certified
    exception: time-restricted permissions (e.g., emergency access) are not flagged as dormant
    
  SOD_CONTINUOUS_MONITORING:
    method: weekly scan of all role assignments against SoD constraint catalog
    alert: any SoD violation → T3 immediate + mandatory remediation within 7 days
    
  ACCESS_VELOCITY_MONITORING:
    method: track rate of new entitlement grants per identity per time period
    anomaly: > 3 new ELEVATED+ permissions in 30 days without role change
    action: T3 alert; hold new grants pending review
```

---

## Access Review Record Schema

```yaml
access_review_record:
  review_id: ACR-{NNN}
  campaign_id: CERT-{NNN}
  identity_id: IDN-{NNN}
  
  reviewed_at: ISO8601
  reviewed_by: IDN-{NNN}             # certifier
  
  entitlements_reviewed:
    - entitlement_type: ROLE | DIRECT_PERMISSION
      entitlement_id: ROLE-{NNN} | PERM-{NNN}
      decision: CERTIFY | REVOKE | MODIFY | ESCALATE
      decision_rationale: string | null
      last_used_at: ISO8601 | null
      days_since_last_use: integer | null
      peer_comparison: ABOVE_PEER_MEDIAN | AT_PEER_MEDIAN | BELOW_PEER_MEDIAN
      
  revocations_executed: [string]     # entitlements actually removed this review
  modifications_requested: [string]
  escalations: [string]
  
  rubber_stamp_flag: boolean
  review_duration_seconds: integer   # time certifier spent in review interface
  
  integrity:
    review_hash: sha256
```

---

## Governance Reporting

```yaml
governance_reports:

  MONTHLY_ACCESS_RISK_REPORT:
    audience: T3 IAM lead + T3 SOC lead
    contents:
      - identities with entitlement utilization < 50%
      - identities with privilege creep indicators
      - SoD violations detected and remediation status
      - orphan entitlements detected
      - upcoming certification campaign status
      - over-provisioned identities by domain
      
  QUARTERLY_CERTIFICATION_SUMMARY:
    audience: T4 CISO
    contents:
      - certification campaign completion rate (target > 98%)
      - entitlements revoked this quarter
      - rubber-stamp incidents and remediation
      - privilege trend (is the enterprise getting more or less privileged over time?)
      - compliance posture (GDPR Art.25 data minimization; HIPAA minimum necessary)
      
  ANNUAL_ACCESS_GOVERNANCE_REVIEW:
    audience: T4 + board security committee
    contents:
      - year-over-year entitlement volume trend
      - critical and privileged identity count trend
      - access-related incidents and root causes
      - certification program effectiveness metrics
      - regulatory compliance attestation (ISO 27001 A.9; SOX ITGC; HIPAA Security Rule)
      
  regulatory_basis:
    ISO_27001_A9: access control; user access management; access rights review
    SOX_ITGC: user access provisioning and deprovisioning; access recertification
    GDPR_Art25: data minimization (access limited to what is necessary for purpose)
    HIPAA_Minimum_Necessary: workforce access limited to minimum necessary PHI
    NIST_800_53_AC: account management; separation of duties; least privilege
```

---

## Integration

```
Feeds into:
  identity-lifecycle-manager.md — certification failures trigger suspension or revocation
  role-management.md — revocation decisions feed role un-assignment
  authorization-engine.md — certification-driven permission changes invalidate cache
  identity-governance-dashboard.md — certification status and entitlement metrics surfaced here

Receives from:
  identity-registry.md — identity and entitlement records consumed for certification
  role-management.md — role mining anomalies trigger event-driven reviews
  identity-analytics.md — risk signals and entitlement analytics feed certifier packages
  insider-threat-detector.md — insider threat flags trigger event-driven certification
  adaptive-compliance/compliance-engine.md — compliance violations trigger access review
```

---

## Governance

**Certification is mandatory and time-bound:** No identity remains certified indefinitely; PRIVILEGED+ identities certified quarterly; all others annually  
**Rubber-stamping is a governance violation:** Detected rubber-stamping is logged as a compliance finding; repeated rubber-stamping triggers certifier replacement and review of all their certifications  
**Automatic revocation on non-certification:** PRIVILEGED+ entitlements not certified by deadline are automatically revoked with no grace period; STANDARD entitlements escalated to T3  
**Recertification after incidents:** Any identity involved in a security incident is immediately placed in event-driven review; certification cannot wait for next scheduled campaign  
**Audit:** All certification campaigns, decisions, and revocations to `memory/identity-management/access-governance-audit.jsonl`; 7-year retention
