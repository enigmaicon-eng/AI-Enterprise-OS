# Access Certification Engine
**ID:** IAM-ACE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Automates the operational execution of access certification campaigns — generating certifier packages, tracking decision progress, enforcing deadlines, detecting rubber-stamping, and executing revocations — while providing human certifiers with the intelligence they need to make informed decisions rather than reflexive approvals. The Access Certification Engine is the operational system that makes the access governance policy real: it transforms the requirement to review access into a structured, measurable, and auditable process.

---

## Campaign Orchestration

```
launch_certification_campaign(campaign_type, scope_filter):

  campaign = CertificationCampaign {
    campaign_id: CERT-{NNN},
    campaign_type: campaign_type,
    launched_at: now(),
    deadline: compute_deadline(campaign_type),
    status: LAUNCHED
  }
  
  # Step 1: Enumerate in-scope identities
  in_scope = enumerate_scope(campaign_type, scope_filter):
    identities = identity_registry.query(status=ACTIVE, filter=scope_filter)
    for identity in identities:
      entitlements = get_all_entitlements(identity.identity_id)
      risk_package = identity_analytics.get_risk_package(identity.identity_id)
      yield {identity, entitlements, risk_package}
      
  # Step 2: Assign certifiers
  certifier_assignments = {}
  for item in in_scope:
    certifier = assign_certifier(item.identity, campaign_type)
    certifier_assignments[item.identity.identity_id] = certifier
    
  # Step 3: Create certifier packages
  for item in in_scope:
    certifier_id = certifier_assignments[item.identity.identity_id]
    package = build_certifier_package(item, campaign)
    store_certifier_package(certifier_id, package)
    notify_certifier(certifier_id, package.summary)
    
  # Step 4: Monitor progress
  start_progress_monitoring(campaign)
  
  campaign.status = IN_PROGRESS
  Return: campaign


build_certifier_package(identity_item, campaign):
  # The intelligence package given to each certifier for each identity they review
  
  return CertifierPackage {
    package_id: CPKG-{NNN},
    campaign_id: campaign.campaign_id,
    subject_identity: identity_item.identity.identity_id,
    certifier_id: (assigned_certifier),
    
    identity_summary: {
      display_name, identity_type, org_unit,
      status, autonomy_level, risk_tier
    },
    
    entitlements: [
      for each entitlement in identity_item.entitlements:
        {
          entitlement_id: string,
          entitlement_type: ROLE | DIRECT_PERMISSION,
          privilege_level: string,
          granted_at: ISO8601,
          granted_by: IDN-{NNN},
          original_justification: string,
          
          # Intelligence signals (from identity-analytics.md)
          last_used_at: ISO8601 | null,
          days_since_last_use: integer | null,
          usage_rate_90d: float,               # 0 = never used; 1 = used every day
          peer_comparison: ABOVE_MEDIAN | AT_MEDIAN | BELOW_MEDIAN,
          peer_median_count: integer,          # peer group median entitlement count
          
          # Risk flags
          dormant_flag: boolean,               # not used in > 90 days
          peer_outlier_flag: boolean,          # above 2σ of peer group
          sod_conflict_flag: boolean,          # conflicts with another entitlement
          
          # Recommended decision (not binding; certifier decides)
          analytics_recommendation: CERTIFY | REVIEW | REVOKE,
          recommendation_rationale: string
        }
    ],
    
    identity_risk_context: {
      risk_score: float,
      risk_tier: LOW | MEDIUM | HIGH | CRITICAL,
      top_risk_factors: [string],
      recent_security_events: [string]
    }
  }
```

---

## Rubber-Stamp Detection

```yaml
rubber_stamp_detection:
  
  definition: certifier making decisions without substantive review of the provided intelligence
  
  detection_signals:
    TIME_SIGNAL:
      method: measure time spent per entitlement decision
      threshold: < 10 seconds per entitlement for ELEVATED+; < 5 seconds for STANDARD
      flag: certifier completing > 10 entitlements/minute → rubber_stamp_suspected
      
    UNIFORMITY_SIGNAL:
      method: check if all decisions in a batch are identical (all CERTIFY or all REVOKE)
      threshold: > 95% same decision across > 10 entitlements → flag for review
      exception: certifiers with legitimate uniform decisions (e.g., new team member review)
      
    ANALYTICS_OVERRIDE_SIGNAL:
      method: check if certifier systematically overrides analytics_recommendation=REVOKE with CERTIFY
      threshold: > 80% override rate for REVOKE recommendations → rubber_stamp_suspected
      
    SCOPE_BLINDNESS_SIGNAL:
      method: certifier certifies entitlements for resource classes outside their domain knowledge
      flag: certifier approving entitlements for 3+ different domains in single session
      
  rubber_stamp_response:
    SUSPECTED:
      action: flag package for T3 review; add to certifier performance record
      certifier_notification: "Your review has been flagged for quality review"
      
    CONFIRMED (repeated pattern > 2 campaigns):
      action: T3 manual review of all rubber-stamped decisions; certifier reassignment
      escalation: T4 notification; compliance finding created
      remediation: re-certification by replacement certifier for flagged identities
```

---

## Deadline Enforcement and Escalation

```yaml
deadline_enforcement:

  escalation_ladder:
    deadline_minus_10_days:
      trigger: certifier has > 50% of assigned identities uncompleted
      action: reminder notification to certifier + certifier's manager
      
    deadline_minus_5_days:
      trigger: certifier has > 30% of assigned identities uncompleted
      action: urgent reminder + T3 IAM notification; optional certifier reassignment offer
      
    deadline_minus_2_days:
      trigger: any uncompleted certifications
      action: daily reminder; T3 tracks as at-risk
      
    at_deadline:
      action_PRIVILEGED_plus: automatic REVOKE for all uncertified PRIVILEGED+ entitlements
      action_ELEVATED: automatic REVOKE if certifier has been notified > 3 times with no response
      action_STANDARD: automatic ESCALATE to T3 for decision
      T4_notification: any PRIVILEGED+ auto-revocation → T4 notification within 1 hour
      
    deadline_plus_1_day:
      action: campaign closed; compliance report generated; T3 sign-off required
      
  no_extension_policy:
    default: no campaign extensions without T4 approval
    emergency_extension_criteria: genuine system outage preventing certifier access; not workload reasons
    max_extension: 7 days; one extension per campaign maximum
```

---

## Certification Decision Execution

```yaml
decision_execution:

  CERTIFY_decision:
    action: record certification; update last_certification_at; set next_certification_due
    no_access_change: CERTIFY confirms access is appropriate; no entitlement changes
    
  REVOKE_decision:
    action: immediate role removal or permission revocation via role-management.md / identity-lifecycle-manager.md
    timing: executed within 4 hours of decision; PRIVILEGED+ within 1 hour
    notification: identity notified of revocation; responsible_team lead notified
    
  MODIFY_decision:
    action: creates modification request in identity-lifecycle-manager.md (mover workflow)
    timing: modification request must complete within 7 days; else entitlement auto-revoked
    
  ESCALATE_decision:
    action: package forwarded to T3 for decision
    T3_SLA: 48 hours from escalation
    fallback: T3 cannot decide within SLA → T4 decision required
    
  bulk_decision_prevention:
    prohibition: certifiers cannot bulk-CERTIFY across an entire identity's entitlements in one click
    enforcement: each entitlement requires an individual decision signal (checkbox, click, or explicit action)
    rationale: bulk decisions eliminate meaningful review; defeats certification purpose
```

---

## Certification Metrics

```yaml
certification_metrics:
  campaign_completion_rate: % of certifications completed by deadline (target > 98%)
  on_time_completion_rate: % completed before deadline_minus_2_days (target > 80%)
  revocation_rate: % of entitlements revoked (healthy: 5-15%; >25% = over-provisioning problem)
  rubber_stamp_rate: % of certifiers flagged (target: < 2%)
  auto_revocation_rate: % of revocations triggered by deadline enforcement (target < 5%)
  certifier_decision_time_avg: seconds per entitlement (target > 15s; < 5s = rubber stamp concern)
  
  reporting: campaign report published within 48hr of campaign close; T3 IAM lead + T4 CISO
```

---

## Integration

```
Feeds into:
  access-governance.md — campaign outcomes recorded; policy framework
  role-management.md — REVOKE decisions trigger role un-assignment
  identity-lifecycle-manager.md — certification failures trigger lifecycle events
  identity-governance-dashboard.md — campaign status and metrics displayed here

Receives from:
  access-governance.md — campaign schedules and certifier assignment rules
  identity-analytics.md — risk packages and intelligence signals for certifier packages
  identity-registry.md — identity and entitlement data for scope enumeration
```

---

## Governance

**No self-certification:** The identity being reviewed cannot be assigned as their own certifier; the certification engine enforces this automatically  
**All revocations are logged and justified:** Every certification-driven revocation records the certifier's decision, the intelligence package they received, and the time spent on the decision  
**Rubber-stamping is a compliance finding:** Confirmed rubber-stamping is reported in compliance audit findings; repeated rubber-stamping by the same certifier triggers a full re-certification by a replacement  
**Automatic revocation is non-negotiable:** PRIVILEGED+ entitlements not certified by deadline are auto-revoked without business exception; reinstatement requires re-provisioning via JIT  
**Audit:** All campaign events, certifier decisions, and auto-revocations to `memory/identity-management/certification-audit.jsonl`; 7-year retention
