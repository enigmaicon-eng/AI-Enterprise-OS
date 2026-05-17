# Permission Catalog
**ID:** IAM-PCG-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Defines every discrete permission that can be granted within the enterprise — the atomic units of access that roles are composed from — with canonical naming, scope definitions, sensitivity classification, and regulatory basis. The Permission Catalog is the vocabulary of authorization: it gives roles, policies, and audit records a precise, unambiguous language for expressing what an identity can do, preventing the drift and ambiguity that make access governance fail.

---

## Permission Schema

```yaml
permission_record:
  permission_id: PERM-{NNN}
  name: string                           # canonical name: RESOURCE.ACTION[.SCOPE]
  # Example: DATA.READ.PERSONAL, AGENT.INVOKE, POLICY.WRITE, CREDENTIAL.ROTATE.OWN
  
  description: string
  
  classification:
    sensitivity: LOW | MEDIUM | HIGH | CRITICAL
    # LOW: read-only non-sensitive; MEDIUM: read-write operational; HIGH: security/compliance actions; CRITICAL: constitutional/privileged/identity management
    data_classes_affected: [string]      # which data classes this permission touches
    
  scope:
    resource_type: string                # what kind of resource this acts on
    action_type: READ | WRITE | DELETE | INVOKE | APPROVE | ADMIN | DELEGATE
    scope_qualifier: string | null       # OWN | DOMAIN | CROSS_DOMAIN | ENTERPRISE | SUPER
    # OWN: only on resources owned by or assigned to the identity
    # DOMAIN: within identity's functional domain
    # CROSS_DOMAIN: across functional domains (requires special justification)
    # ENTERPRISE: across entire enterprise (PRIVILEGED+)
    # SUPER: unrestricted (SUPER_PRIVILEGED only)
    
  constraints:
    requires_mfa: boolean
    requires_step_up: boolean
    jurisdiction_restricted: [JUR-{XX}] | null   # null = all jurisdictions
    time_restricted: string | null                # cron expression or time window
    
  regulatory:
    regulatory_basis: [string]           # regulations governing this permission type
    audit_required: boolean              # true for all HIGH/CRITICAL permissions
    
  lifecycle:
    status: ACTIVE | DEPRECATED | DRAFT
    created_at: ISO8601
    approved_by: IDN-{NNN}              # T3 for HIGH; T4 for CRITICAL
    last_reviewed_at: ISO8601
    
  integrity:
    permission_hash: sha256(permission_definition)
```

---

## Permission Catalog (Selected Core Permissions)

```yaml
# FORMAT: permission_id | name | sensitivity | description

# IDENTITY MANAGEMENT
PERM-001 | IDENTITY.READ.OWN         | LOW      | Read own identity record
PERM-002 | IDENTITY.READ.DOMAIN      | MEDIUM   | Read identity records in own domain
PERM-003 | IDENTITY.READ.ENTERPRISE  | HIGH     | Read all identity records across enterprise
PERM-004 | IDENTITY.WRITE.PROVISION  | HIGH     | Create new identity records
PERM-005 | IDENTITY.WRITE.MODIFY     | HIGH     | Modify existing identity records
PERM-006 | IDENTITY.WRITE.SUSPEND    | HIGH     | Suspend an identity
PERM-007 | IDENTITY.WRITE.DECOMMISSION| CRITICAL | Decommission an identity (irreversible)

# CREDENTIAL MANAGEMENT
PERM-010 | CREDENTIAL.READ.OWN       | MEDIUM   | Read own credential metadata
PERM-011 | CREDENTIAL.READ.DOMAIN    | HIGH     | Read credential metadata in domain
PERM-012 | CREDENTIAL.ROTATE.OWN     | MEDIUM   | Rotate own credentials
PERM-013 | CREDENTIAL.ROTATE.ANY     | HIGH     | Rotate any identity's credentials
PERM-014 | CREDENTIAL.REVOKE.EMERGENCY| HIGH    | Emergency revocation of credentials
PERM-015 | CREDENTIAL.ISSUE          | CRITICAL | Issue new credentials

# ROLE AND PERMISSION MANAGEMENT
PERM-020 | ROLE.READ                 | LOW      | View role definitions
PERM-021 | ROLE.ASSIGN.STANDARD      | MEDIUM   | Assign STANDARD-tier roles
PERM-022 | ROLE.ASSIGN.ELEVATED      | HIGH     | Assign ELEVATED-tier roles
PERM-023 | ROLE.ASSIGN.PRIVILEGED    | CRITICAL | Assign PRIVILEGED-tier roles
PERM-024 | ROLE.DEFINE               | CRITICAL | Create or modify role definitions
PERM-025 | PERMISSION.READ           | LOW      | View permission definitions
PERM-026 | PERMISSION.DEFINE         | CRITICAL | Create or modify permission definitions

# DATA ACCESS
PERM-030 | DATA.READ.OPERATIONAL     | LOW      | Read operational data (non-sensitive)
PERM-031 | DATA.READ.PERSONAL        | MEDIUM   | Read personal data (GDPR-sensitive)
PERM-032 | DATA.READ.FINANCIAL       | HIGH     | Read financial data (SOX/PCI-sensitive)
PERM-033 | DATA.READ.CLASSIFIED      | CRITICAL | Read classified/restricted data
PERM-034 | DATA.WRITE.OPERATIONAL    | MEDIUM   | Write operational data
PERM-035 | DATA.WRITE.PERSONAL       | HIGH     | Write personal data
PERM-036 | DATA.DELETE.ANY           | CRITICAL | Delete data records (highly sensitive; audit required)
PERM-037 | DATA.CROSS_BORDER.TRANSFER| HIGH     | Initiate cross-jurisdiction data transfers

# AGENT OPERATIONS
PERM-040 | AGENT.INVOKE              | LOW      | Invoke an agent action
PERM-041 | AGENT.DELEGATE            | MEDIUM   | Delegate tasks to another agent
PERM-042 | AGENT.SUSPEND             | HIGH     | Suspend an agent (operational impact)
PERM-043 | AGENT.QUARANTINE          | HIGH     | Quarantine an agent (security action)
PERM-044 | AGENT.BEHAVIORAL_CONTRACT.READ| LOW  | Read behavioral contract
PERM-045 | AGENT.BEHAVIORAL_CONTRACT.SIGN| CRITICAL | Sign or renew behavioral contracts

# SECURITY OPERATIONS
PERM-050 | SECURITY.ALERT.READ       | MEDIUM   | Read security alerts
PERM-051 | SECURITY.ALERT.ACKNOWLEDGE| MEDIUM   | Acknowledge and update security alerts
PERM-052 | SECURITY.ALERT.CLOSE      | HIGH     | Close security alerts
PERM-053 | SECURITY.PLAYBOOK.EXECUTE | HIGH     | Initiate SOC playbook execution
PERM-054 | SECURITY.DETECTION_RULE.READ| LOW    | Read detection rule definitions
PERM-055 | SECURITY.DETECTION_RULE.WRITE| HIGH  | Create or modify detection rules
PERM-056 | SECURITY.INCIDENT.DECLARE | HIGH     | Declare a security incident
PERM-057 | SECURITY.INCIDENT.MANAGE  | HIGH     | Manage and close security incidents
PERM-058 | SECURITY.IOC.WRITE        | HIGH     | Add IOCs to threat intelligence

# COMPLIANCE OPERATIONS
PERM-060 | COMPLIANCE.DECISION.READ  | LOW      | Read compliance decisions
PERM-061 | COMPLIANCE.POLICY.READ    | LOW      | Read compliance policies
PERM-062 | COMPLIANCE.POLICY.WRITE   | CRITICAL | Create or modify compliance policies
PERM-063 | COMPLIANCE.VIOLATION.ACKNOWLEDGE| MEDIUM | Acknowledge compliance violations
PERM-064 | COMPLIANCE.EXCEPTION.REQUEST| MEDIUM | Request a compliance exception
PERM-065 | COMPLIANCE.EXCEPTION.APPROVE| HIGH   | Approve compliance exceptions

# CONSTITUTIONAL OPERATIONS
PERM-070 | CONSTITUTIONAL.PROXIMITY.READ| LOW   | Read constitutional proximity scores
PERM-071 | CONSTITUTIONAL.BLOCK.REVIEW | CRITICAL| Review constitutional block events
PERM-072 | CONSTITUTIONAL.QUORUM.VOTE | CRITICAL| Participate in constitutional quorum vote
PERM-073 | CONSTITUTIONAL.RULE.READ  | LOW      | Read constitutional rules
PERM-074 | CONSTITUTIONAL.RULE.MODIFY| CRITICAL | Modify constitutional rules (T5+board only)

# PRIVILEGED ACCESS
PERM-080 | PRIVILEGED.SESSION.INITIATE| HIGH    | Start a privileged access session
PERM-081 | PRIVILEGED.SESSION.APPROVE | HIGH    | Approve a JIT privileged access request
PERM-082 | EMERGENCY.ACCESS.INITIATE | CRITICAL | Initiate emergency (break-glass) access
PERM-083 | SECRET.READ.OWN           | MEDIUM   | Read own secrets from secret manager
PERM-084 | SECRET.READ.ANY           | CRITICAL | Read any secret (SOC forensic use only)

# EXECUTIVE AND GOVERNANCE
PERM-090 | GOVERNANCE.APPROVAL.T3    | HIGH     | T3-level governance approval authority
PERM-091 | GOVERNANCE.APPROVAL.T4    | CRITICAL | T4-level governance approval authority
PERM-092 | AUDIT.READ.DOMAIN         | MEDIUM   | Read audit logs within own domain
PERM-093 | AUDIT.READ.ENTERPRISE     | HIGH     | Read all enterprise audit logs
PERM-094 | AUDIT.EXPORT              | CRITICAL | Export audit records to external party
```

---

## Permission Inheritance and Composition

```yaml
permission_composition:

  role_permission_union:
    rule: effective permissions = union of all permissions from all assigned roles
    exception: explicit DENY on any role overrides PERMIT from any other role
    
  permission_scope_ceiling:
    rule: session token constrains effective permission scope even if broader permission exists
    example: identity has DATA.READ.ENTERPRISE but session was issued with jurisdiction=JUR-EU only → effective permission is DATA.READ.ENTERPRISE restricted to JUR-EU
    
  temporal_constraints:
    rule: time-restricted permissions are evaluated against current time in identity's jurisdiction timezone
    
  inheritance_prohibited:
    rule: permissions are NOT hierarchical by default; PERM-031 (DATA.READ.PERSONAL) does NOT imply PERM-030 (DATA.READ.OPERATIONAL)
    rationale: explicit composition prevents hidden privilege accumulation
    
  permission_negation:
    syntax: DENY:PERM-{NNN} in role definition
    precedence: DENY in any role beats PERMIT from any other role (classic deny-overrides)
    use_case: role exclusion without removing base role (e.g., operations agent with all operational permissions EXCEPT data deletion)
```

---

## Permission Lifecycle Governance

```yaml
permission_lifecycle:
  
  creation:
    draft: any T2 can propose a new permission definition
    review: T3 IAM lead reviews for scope correctness and sensitivity classification
    approval: T3 for LOW/MEDIUM; T3+T4 for HIGH; T4+constitutional review for CRITICAL
    
  modification:
    principle: modifying a permission definition modifies all roles containing it
    impact_assessment: automated impact report (which roles, which identities) required before approval
    approval: same as creation
    
  deprecation:
    process: mark DEPRECATED; remove from all roles during next certification cycle; archive after all roles updated
    forced_removal: permissions with 0 active role assignments auto-deprecated after 180 days
    
  review_cadence:
    LOW/MEDIUM: annual
    HIGH: semi-annual
    CRITICAL: quarterly
    overdue_review: T3 alert; permission usage suspended until reviewed
    
  tamper_detection:
    permission_hash: verified at every load; mismatch → T4 alert + permission suspension
```

---

## Integration

```
Feeds into:
  authorization-engine.md — permission definitions consumed in RBAC evaluation
  role-management.md — permissions are the building blocks of roles
  policy-decision-point.md — permission metadata used in ABAC policy conditions

Receives from:
  role-management.md — role changes reference permissions defined here
  access-governance.md — certification reviews use permission catalog for context
```

---

## Governance

**Permission catalog is the authoritative vocabulary:** No system may define or evaluate permissions not registered in this catalog; ad-hoc permission strings are rejected  
**CRITICAL permissions require T4 approval:** Any role containing a CRITICAL-sensitivity permission requires T4 approval in the role assignment workflow  
**Constitutional permissions are board-governed:** PERM-072 through PERM-074 require T5 + constitutional board for any modification  
**All HIGH/CRITICAL actions are audited:** Permissions with audit_required=true generate immutable audit records on every use, regardless of decision cache  
**Audit:** All permission definition changes to `memory/identity-management/permission-catalog-audit.jsonl`; 7-year retention
