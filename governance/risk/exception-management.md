# Exception Management

## Purpose
Defines the governed process for handling situations where a control cannot be implemented as required, or where a policy requirement cannot be met, without creating unmanageable operational impact. Exception management is not a mechanism to avoid compliance — it is a rigorous process that ensures every exception is authorized, time-bounded, compensated, and monitored. An unmanaged exception is a compliance gap; a managed exception is a documented, approved risk acceptance.

---

## Exception Types

```yaml
exception_types:
  CONTROL_EXCEPTION:
    definition: A required control cannot be fully implemented for a specific system, process, or entity
    example: "Legacy system X cannot support AES-256 encryption due to hardware limitations"
    duration_limit: maximum 12 months (must be remediated or renewed)
    requires_compensating_control: YES (always)
  
  POLICY_EXCEPTION:
    definition: A policy requirement cannot be met in a specific context
    example: "Offshore vendor cannot comply with data localization requirement due to service architecture"
    duration_limit: maximum 6 months (shorter than control exceptions because policy exceptions are typically more manageable)
    requires_compensating_control: depends on risk level
  
  REGULATORY_EXEMPTION:
    definition: The enterprise is not subject to a specific regulatory requirement due to documented grounds
    example: "HIPAA does not apply to this business unit as it handles no PHI"
    duration_limit: no expiry (but must be reviewed annually)
    requires_compensating_control: NO (but exemption basis must be reconfirmed annually)
    note: distinct from an exception — an exemption means the obligation doesn't apply, not that it applies but can't be met
  
  TEMPORARY_DEVIATION:
    definition: A one-time or short-term situation requiring deviation from a control or policy
    example: "Emergency change deployed outside normal change management process due to critical incident"
    duration_limit: maximum 30 days (must be regularized or retired)
    requires_compensating_control: depends on risk
    requires_post_deviation_review: always (within 7 days of deviation)
```

---

## Exception Record Schema

```yaml
exception_record:
  exception_id: "EXC-{control_or_policy_id}-{seq}"
  exception_type: CONTROL_EXCEPTION | POLICY_EXCEPTION | REGULATORY_EXEMPTION | TEMPORARY_DEVIATION
  
  subject:
    control_id: string | null
    policy_id: string | null
    policy_statement_ids: [string] | null
    obligation_ids: [obligation_id]   # what obligations are at risk?
    affected_entities: [string]        # systems, processes, org units affected by this exception
  
  justification:
    business_reason: string            # why is the control/policy requirement not achievable?
    technical_reason: string | null    # if technical limitation, describe specifically
    alternatives_considered: [
      {alternative, reason_rejected}
    ]
    remediation_path: string | null    # how will the exception be resolved? (not required for REGULATORY_EXEMPTION)
    remediation_target_date: ISO-8601 | null
  
  risk_assessment:
    residual_risk_without_control: risk_level  # how much risk does this exception expose?
    compensating_control_ids: [control_id]     # what reduces that risk in lieu of the primary control?
    compensating_control_effectiveness: FULLY_COMPENSATING | PARTIALLY_COMPENSATING | NONE
    net_risk_with_exception: risk_level        # after compensating controls
    risk_acceptance_rationale: string
  
  approval:
    required_approver: agent_id | human_id  # determined by net_risk_with_exception (see authorization matrix)
    approved_by: agent_id | human_id | null
    approved_at: ISO-8601 | null
    approval_conditions: [string]           # conditions the exception is contingent on
    rejected_by: agent_id | human_id | null
    rejection_reason: string | null
  
  temporal:
    effective_from: ISO-8601
    expires_at: ISO-8601                    # ALL exceptions must have an expiry
    review_frequency: MONTHLY | QUARTERLY  # how often is this exception reviewed while active?
    last_reviewed: ISO-8601 | null
    renewal_count: int                      # how many times has this exception been renewed?
    max_renewals: int                       # after this many renewals, must be escalated to next tier
  
  monitoring:
    monitoring_plan: string               # how is the exception and its compensating controls monitored?
    monitoring_owner: agent_id | human_id
    kri_added: [kri_id]                   # KRIs added to risk register to track this exception's risk
    violation_history: [violation_event]  # any times the exception conditions were violated
  
  status: PENDING_APPROVAL | ACTIVE | EXPIRED | RENEWED | REVOKED | REMEDIATED
  
  governance:
    created_at: ISO-8601
    created_by: agent_id | human_id
    audit_trail: [event]
    retained_until: ISO-8601              # 7 years after exception closes
```

---

## Exception Authorization Matrix

```yaml
authorization_matrix:
  by_net_risk_level:
    LOW_net_risk: domain compliance lead approval
    MEDIUM_net_risk: compliance governance lead approval
    HIGH_net_risk: Tier-3+ approval; board notification if exception > 6 months
    CRITICAL_net_risk: Tier-4+ approval; board notification always; maximum 90-day duration
  
  by_exception_type:
    CONTROL_EXCEPTION (LOW): domain compliance lead
    CONTROL_EXCEPTION (HIGH+): compliance governance lead + Tier-3+
    POLICY_EXCEPTION: compliance governance lead + policy owner
    REGULATORY_EXEMPTION: legal counsel confirmation required always; Tier-4+ sign-off
    TEMPORARY_DEVIATION: emergency authority (see authority-transfer-protocol.md EMERGENCY type)
  
  blanket_exceptions:
    definition: exceptions applying to an entire domain or system class rather than specific instance
    require: Tier-4+ approval; board notification; maximum 6 months; enhanced monitoring
    blanket_exception_cap: maximum 3 blanket exceptions active at any time enterprise-wide
  
  non_approvable_exceptions:
    constitutional_requirements: cannot be excepted (see constitution/enterprise-constitution.md)
    prohibited_AI_practices: EU AI Act prohibited practices cannot be excepted for any reason
    critical_human_oversight: human oversight of high-risk AI cannot be removed via exception
```

---

## Compensating Control Requirements

```yaml
compensating_controls:
  definition: |
    A compensating control is an alternative control that provides reasonable assurance
    that the objective of the primary (missing) control is met, even though by different means.
  
  requirements:
    LEGITIMACY: compensating control must actually address the same obligation as the primary control
    EFFECTIVENESS: compensating control must be EFFECTIVE (tested and verified)
    PROPORTIONALITY: compensating control effectiveness must be FULLY_COMPENSATING for CRITICAL/HIGH risks; PARTIALLY_COMPENSATING minimum for MEDIUM
    INDEPENDENCE: compensating control cannot depend on the same system that caused the primary control failure
  
  examples:
    PRIMARY_CONTROL: AES-256 encryption at rest (CTL-SEC-002)
    EXCEPTION_REASON: Legacy system cannot support AES-256
    COMPENSATING_CONTROL:
      - enhanced network segmentation (isolates the legacy system)
      - additional access logging and review (detective control)
      - shortened data retention (reduces volume of unencrypted data)
      - accelerated migration timeline (remediation commitment)
    
    PRIMARY_CONTROL: automated vulnerability scanning (CTL-SEC-004)
    EXCEPTION_REASON: Scanning agent incompatible with specific system
    COMPENSATING_CONTROL:
      - weekly manual review of vendor security advisories for that system
      - enhanced network monitoring for exploitation attempts
      - quarterly manual vulnerability assessment of that system
  
  compensating_control_testing:
    frequency: same as or more frequent than the primary control it replaces
    evidence: same standards as primary control evidence
    degradation: if compensating control degrades while exception is active → exception is immediately at risk; escalate
```

---

## Exception Lifecycle Management

```yaml
exception_lifecycle:
  REQUEST:
    who_submits: control owner or affected entity
    required_content: full exception_record schema with justification and compensating controls
    SLA: initial review within 5 business days
  
  REVIEW:
    reviewers: required approver per authorization matrix
    review_criteria:
      - Is the justification genuine and documented?
      - Have real alternatives been considered?
      - Is the compensating control genuinely compensating?
      - Is the net risk acceptable?
      - Is the remediation path realistic?
    outcome: APPROVED (with conditions) | REJECTED | ESCALATED (to higher tier)
  
  ACTIVE_MONITORING:
    owner responsibilities:
      - monitor compensating controls; confirm EFFECTIVE at each review
      - work remediation path toward closing the exception
      - notify compliance governance lead immediately if exception conditions change
    compliance_governance_lead responsibilities:
      - review all active exceptions quarterly
      - flag exceptions approaching max renewals
      - escalate exceptions where remediation path stalls
  
  EXPIRY:
    30_days_before_expiry: automated reminder to exception owner
    7_days_before_expiry: if no renewal request, compliance governance lead alerted
    on_expiry: exception status → EXPIRED; control enters FAILED state (no exception coverage)
    on_expiry_without_renewal: HIGH finding generated; immediate remediation required
  
  RENEWAL:
    requires: fresh risk assessment + evidence compensating controls are still EFFECTIVE
    approval: same authorization level as original (or higher if risk has changed)
    max_renewals_before_escalation:
      LOW/MEDIUM exceptions: 3 renewals maximum before Tier-3+ review
      HIGH exceptions: 2 renewals maximum before Tier-4+ review
      CRITICAL exceptions: 1 renewal maximum; second renewal requires board notification
  
  CLOSURE:
    REMEDIATED: primary control is now implemented; exception no longer needed
    REVOKED: exception withdrawn by approver (e.g., risk profile changed)
    EXPIRED: exception expired without renewal (triggers finding)
    on_closure: record retained 7 years; compensating controls may be retired
```

---

## Exception Analytics

```yaml
exception_analytics:
  portfolio_view:
    total_active_exceptions: count
    by_type: count per exception_type
    by_risk_level: count per net_risk_level (CRITICAL/HIGH/MEDIUM/LOW)
    by_domain: count per compliance domain
    expiring_in_30_days: count (pre-expiry management)
    average_duration: mean active duration per exception type
  
  health_indicators:
    exception_aging: average age of exceptions (trend toward longer = normalization risk)
    renewal_rate: what fraction of exceptions are being renewed vs. remediated?
    compensating_control_health: what % of compensating controls are EFFECTIVE?
    high_risk_exception_concentration: CRITICAL + HIGH exceptions as % of total (alert > 20%)
  
  alerts:
    CRITICAL_exception_active_>90d: escalate to Tier-4+ immediately
    compensating_control_FAILED_while_exception_active: CRITICAL alert + emergency review
    exception_approaching_max_renewals: notify compliance governance lead 30 days before limit
    blanket_exception_concentration: alert if blanket exceptions cover > 15% of obligation set
```

---

## Integration Points

| System | Role |
|---|---|
| `compliance-framework/control-catalog.md` | Exceptions reference specific controls |
| `compliance-framework/policy-management-system.md` | Policy exceptions reference specific policy statements |
| `risk-and-controls/enterprise-risk-register.md` | Active exceptions update risk register risk ratings |
| `risk-and-controls/control-effectiveness-monitor.md` | Compensating controls monitored for effectiveness |
| `audit-and-evidence/finding-management.md` | Expired or violated exceptions generate findings |
| `delegation-and-trust/authority-transfer-protocol.md` | Emergency authority for TEMPORARY_DEVIATION |
| `governance-operations/compliance-operations-dashboard.md` | Exception portfolio displayed on dashboard |
