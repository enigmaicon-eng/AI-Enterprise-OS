# Role Management
**ID:** IAM-RMG-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Defines, maintains, and governs the enterprise role catalog — the structured set of permission bundles that translate job functions into access entitlements. Role management enforces least privilege through role design, prevents privilege creep through regular certification, and detects unauthorized entitlement accumulation through role mining and SoD analysis. Roles are the primary mechanism through which access is granted; direct permission assignments are the exception, not the rule.

---

## Role Hierarchy

```yaml
role_hierarchy:

  TIER_0_CONSTITUTIONAL:
    description: roles for agents that operate the constitutional safety layer
    examples: [constitutional-governor-role, quorum-validator-role]
    privilege_level: PRIVILEGED
    assigned_by: T5 + constitutional board
    characteristics:
      - cannot be combined with any operational execution role
      - cannot be delegated
      - annual re-authorization required
      
  TIER_1_SUPER_PRIVILEGED:
    description: roles for T4 executives and board-level oversight
    examples: [ciso-role, cto-role, board-security-committee-role]
    privilege_level: SUPER_PRIVILEGED
    assigned_by: T4 + T5 approval
    characteristics:
      - full read access across all non-CN jurisdictions
      - can approve T3-level role assignments
      - cannot hold operational execution roles simultaneously (SoD)
      
  TIER_2_PRIVILEGED:
    description: roles for T3 security, compliance, and architecture leadership
    examples: [soc-lead-role, detection-engineer-role, ir-lead-role, compliance-architect-role]
    privilege_level: PRIVILEGED
    assigned_by: T3 + T4 approval
    characteristics:
      - elevated access within defined domain
      - can approve STANDARD and ELEVATED role assignments in their domain
      
  TIER_3_ELEVATED:
    description: roles for T2 analysts, engineers, and specialists with domain-specific access
    examples: [soc-analyst-role, compliance-analyst-role, pm-agent-role, architect-agent-role]
    privilege_level: ELEVATED
    assigned_by: T2 + T3 review
    
  TIER_4_STANDARD:
    description: roles for operational agents with bounded, function-specific access
    examples: [data-reader-role, report-generator-role, notification-sender-role]
    privilege_level: STANDARD
    assigned_by: T2 approval
    
  TIER_5_READ_ONLY:
    description: roles for monitoring, observability, and low-risk operational functions
    examples: [dashboard-viewer-role, metrics-reader-role, wiki-reader-role]
    privilege_level: STANDARD (restricted)
    assigned_by: T1 with T2 review
```

---

## Role Record Schema

```yaml
role_record:
  role_id: ROLE-{NNN}
  name: string                           # canonical role name (unique)
  display_name: string
  
  tier: 0 | 1 | 2 | 3 | 4 | 5
  privilege_level: SUPER_PRIVILEGED | PRIVILEGED | ELEVATED | STANDARD
  
  scope:
    applicable_identity_types: [AGENT_IDENTITY | SERVICE_ACCOUNT | HUMAN_OPERATOR]
    applicable_jurisdictions: [JUR-{XX}] | ALL
    domain: string                        # functional domain (SECURITY | COMPLIANCE | PM | ENGINEERING | etc.)
    
  permissions:
    included_permissions: [PERM-{NNN}]   # permissions granted by this role
    excluded_permissions: [PERM-{NNN}]   # explicit exclusions (even if included in another role)
    
  sod_constraints:
    incompatible_roles: [ROLE-{NNN}]     # roles that cannot be held simultaneously
    incompatible_domains: [string]        # entire domains that conflict with this role
    
  lifecycle:
    status: ACTIVE | DEPRECATED | DRAFT
    created_at: ISO8601
    created_by: IDN-{NNN}
    approved_by: IDN-{NNN}
    last_reviewed_at: ISO8601
    next_review_due: ISO8601             # annual for TIER_0/TIER_1; annual for all
    
  certification:
    certification_cadence: 90 | 180 | 365  # days; TIER_0/1: 90d; TIER_2: 180d; TIER_3+: 365d
    last_certified_at: ISO8601 | null
    certifier_role: ROLE-{NNN}           # which role certifies assignment of this role
    
  integrity:
    role_hash: sha256(role_definition)   # detect tampering
    signed_by: IDN-{NNN}                # T3+ signing authority
```

---

## Role Assignment Workflow

```
assign_role(identity_id, role_id, justification, requested_by):

  identity = identity_registry.get(identity_id)
  role = role_catalog.get(role_id)
  
  # Step 1: Eligibility check
  if identity.identity_type not in role.applicable_identity_types:
    Return ASSIGNMENT_DENIED (reason=IDENTITY_TYPE_INELIGIBLE)
    
  if identity.jurisdiction not in role.applicable_jurisdictions:
    Return ASSIGNMENT_DENIED (reason=JURISDICTION_MISMATCH)
    
  # Step 2: SoD validation
  current_roles = get_current_roles(identity_id)
  sod_conflict = check_sod_conflicts(role_id, current_roles)
  if sod_conflict:
    Return ASSIGNMENT_DENIED (reason=SOD_CONFLICT, conflicting_role=sod_conflict.role_id)
    
  # Step 3: Privilege accumulation check
  new_effective_permissions = compute_effective_permissions(current_roles + [role_id])
  privilege_level = assess_privilege_level(new_effective_permissions)
  if privilege_level > role.privilege_level:
    alert_security_ops(PRIVILEGE_ACCUMULATION_DETECTED, identity_id)
    require_additional_justification()
    
  # Step 4: Authorization check for assigner
  require_assigner_authority(requested_by, role.tier)
  # TIER_0: T5; TIER_1: T4+T5; TIER_2: T3+T4; TIER_3: T2+T3; TIER_4/5: T2
  
  # Step 5: Approval workflow
  approval = run_approval_workflow(role.tier, identity_id, role_id, justification)
  if not approval.granted:
    Return ASSIGNMENT_DENIED (reason=APPROVAL_NOT_GRANTED)
    
  # Step 6: Record assignment
  assignment = RoleAssignment {
    assignment_id: RAS-{NNN},
    identity_id, role_id,
    assigned_at: now(),
    assigned_by: requested_by,
    approved_by: approval.approver_id,
    justification, justification,
    valid_until: compute_assignment_expiry(role),   # max 1yr; renewable
    certification_due: now() + role.certification_cadence
  }
  
  store_assignment(assignment)
  update_identity_registry(identity_id, role_id)
  invalidate_permission_cache(identity_id)
  log_role_assignment(assignment)
  Return: ASSIGNMENT_GRANTED (assignment_id=assignment.assignment_id)
```

---

## Role Mining and Optimization

```yaml
role_mining:
  purpose: discover over-privileged identities; identify role rationalization opportunities
  
  cadence: monthly automated analysis; quarterly T3 review
  
  analyses:
    UNUSED_PERMISSIONS:
      method: compare granted permissions vs. permissions used in last 90 days
      threshold: permission unused > 90 days → flag for review
      action: T3 review; potential permission removal from role definition
      
    PRIVILEGE_CREEP:
      method: compare current role set vs. roles at time of last certification
      anomaly: net increase in high-privilege roles without corresponding justification
      action: immediate T3 alert; emergency certification if PRIVILEGED+
      
    ROLE_REDUNDANCY:
      method: identify identities holding multiple roles where one is a superset of another
      action: T3 recommendation to simplify; certifier must approve or justify retention
      
    SoD_VIOLATIONS:
      method: scan all role assignments against SoD constraint catalog
      cadence: weekly scan; any violation triggers immediate T3 alert
      action: violations must be resolved (role removal or SoD exception) within 7 days
      
    PEER_GROUP_OUTLIER:
      method: compare identity role set against peer group (same org + same function)
      anomaly: identity has > 2× median number of roles compared to peers
      action: certification requested; over-permission suspected
      
  role_rationalization_recommendation:
    format: role_mining_report (monthly)
    audience: T3 IAM lead + T4 CISO
    contents: [unused_permissions, privilege_creep_instances, redundant_roles, sod_violations, peer_outliers]
```

---

## Role Catalog Health Metrics

```yaml
role_catalog_metrics:
  total_roles: count
  active_roles_by_tier: {tier_0: n, tier_1: n, ..., tier_5: n}
  average_permissions_per_role: float    # target: < 25 per role (lean roles)
  roles_with_sod_conflicts: count        # should be 0
  roles_overdue_for_review: count        # target 0
  identities_with_role_count_above_5: count  # too many roles = risk signal
  assignments_expiring_in_30_days: count # certification planning
  
  review_cadence: monthly report to T3 IAM lead; quarterly to T4 CISO
```

---

## Integration

```
Feeds into:
  authorization-engine.md — role-permission matrix fed into RBAC evaluation
  access-governance.md — role assignments drive certification campaigns
  identity-analytics.md — role distribution analytics
  permission-catalog.md — roles composed of permissions defined here

Receives from:
  identity-lifecycle-manager.md — provisioning triggers initial role assignment
  access-certification-engine.md — certification outcomes drive role revocation
  identity-registry.md — role assignment changes update identity entitlement summary
```

---

## Governance

**Roles are the primary access mechanism:** Direct permission assignments require T3 justification; all routine access granted through roles only  
**Role definitions are version-controlled:** Every change to a role definition (adding/removing permissions, modifying SoD constraints) creates a new version; previous versions retained  
**SoD violations have zero tolerance:** Any detected SoD violation must be remediated within 7 days; no business justification extends this deadline without T4 approval  
**Role tampering detection:** role_hash is verified at every role load; tampered role definition triggers immediate T4 alert and role suspension  
**Audit:** All role assignments, modifications, and revocations to `memory/identity-management/role-audit.jsonl`; 7-year retention
