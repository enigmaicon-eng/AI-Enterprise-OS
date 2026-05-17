# Identity Registry
**ID:** IAM-IRG-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Serves as the authoritative source of truth for every identity in the enterprise — agents, service accounts, human operators, external connectors, and federation partners. The Identity Registry is the master directory from which all authentication, authorization, and access governance decisions are derived. No entity may act within the enterprise without a registered identity; no identity exists that is not recorded here.

---

## Identity Types

```yaml
identity_types:

  AGENT_IDENTITY:
    description: AI agent with a defined role, capability scope, and behavioral contract
    examples: pm-agent, architect-agent, soc-analyst-agent, constitutional-governor
    lifecycle: PROVISIONED → ACTIVE → SUSPENDED → DECOMMISSIONED
    authentication: behavioral contract + cryptographic credential (Ed25519 keypair)
    
  SERVICE_ACCOUNT:
    description: non-interactive identity for automated pipelines, connectors, and system processes
    examples: cicd-pipeline-sa, feed-aggregator-sa, compliance-engine-sa
    lifecycle: PROVISIONED → ACTIVE → SUSPENDED → DECOMMISSIONED
    authentication: API key (90-day TTL) + certificate (1-year TTL)
    characteristics: no interactive sessions; all actions must be logged; no ad-hoc permission grants
    
  HUMAN_OPERATOR:
    description: human administrator or analyst with direct system access
    examples: T3 SOC analyst, T4 CISO, system administrator
    lifecycle: PROVISIONED → ACTIVE → LEAVE_OF_ABSENCE → SUSPENDED → DECOMMISSIONED
    authentication: hardware MFA token + password; biometric optional
    
  EXTERNAL_CONNECTOR:
    description: third-party system or API integration with enterprise systems
    examples: Salesforce connector, Jira integration, threat intel feed endpoint
    lifecycle: REGISTERED → ACTIVE → SUSPENDED → RETIRED
    authentication: OAuth 2.0 client credentials + TLS certificate pinning
    
  FEDERATION_PARTNER:
    description: identity from peer entity in enterprise federation
    examples: entity-B agent acting within entity-A jurisdiction with permit
    lifecycle: FEDERATED → ACTIVE → SUSPENDED → TERMINATED
    authentication: cross-entity trust token + federation certificate
    trust_scope: limited to explicit federation agreement terms
```

---

## Identity Record Schema

```yaml
identity_record:
  identity_id: IDN-{NNN}
  display_name: string
  identity_type: AGENT | SERVICE_ACCOUNT | HUMAN_OPERATOR | EXTERNAL_CONNECTOR | FEDERATION_PARTNER
  
  status: PROVISIONED | ACTIVE | SUSPENDED | DECOMMISSIONED | LEAVE_OF_ABSENCE
  
  core_attributes:
    owner_org: string                        # owning organization
    responsible_team: string                 # team accountable for this identity
    created_at: ISO8601
    created_by: IDN-{NNN}                   # identity that provisioned this one
    last_modified_at: ISO8601
    
  security_attributes:
    risk_tier: CRITICAL | HIGH | STANDARD | LOW
    # CRITICAL: constitutional governor, T4 executive agents, identity authority agents
    # HIGH: T3 SOC agents, compliance engine agents, privileged service accounts
    # STANDARD: most operational agents
    # LOW: read-only, internal analytics, low-privilege connectors
    
    jurisdiction: JUR-{XX}                   # primary operational jurisdiction
    additional_jurisdictions: [JUR-{XX}]
    
    behavioral_contract_id: string | null    # links to behavioral-contract-system.md
    autonomy_level: 0 | 1 | 2 | 3 | 4 | 5  # from autonomy-level-framework.md
    
  credential_refs:
    primary_credential_id: CRD-{NNN}        # links to credential-vault.md
    secondary_credential_ids: [CRD-{NNN}]
    last_credential_rotation: ISO8601
    
  entitlement_summary:
    role_ids: [ROLE-{NNN}]                  # assigned roles from role-management.md
    direct_permission_ids: [PERM-{NNN}]     # directly assigned permissions (exceptions only)
    privilege_level: STANDARD | ELEVATED | PRIVILEGED | SUPER_PRIVILEGED
    
  lifecycle:
    provisioning_approval: IDN-{NNN}        # who approved provisioning
    last_certification_at: ISO8601 | null   # last access review
    next_certification_due: ISO8601 | null
    suspension_reason: string | null
    decommission_reason: string | null
    decommissioned_at: ISO8601 | null
    
  federation:
    home_entity: string | null              # for FEDERATION_PARTNER identities
    federation_agreement_id: string | null
    cross_jurisdiction_trust: float | null  # 0.0–1.0; from cross-agent-trust-accumulation
    
  integrity:
    record_hash: sha256
    signed_by: IDN-{NNN}                   # T3+ identity authority
```

---

## Identity Lookup and Resolution

```
resolve_identity(identifier):
  # identifier may be: identity_id, display_name, credential_fingerprint, or behavioral_contract_id
  
  # Step 1: Check primary index (identity_id)
  if is_valid_identity_id(identifier):
    return registry_store.get(identifier)
    
  # Step 2: Check name index
  if result := name_index.get(identifier):
    return registry_store.get(result.identity_id)
    
  # Step 3: Check credential fingerprint index
  if result := credential_index.get(identifier):
    return registry_store.get(result.identity_id)
    
  # Step 4: Check behavioral contract index
  if result := contract_index.get(identifier):
    return registry_store.get(result.identity_id)
    
  Return: None  # unknown identity; must be rejected by all gatekeepers

validate_identity(identity_id):
  identity = resolve_identity(identity_id)
  if identity is None: return UNKNOWN
  if identity.status != ACTIVE: return INACTIVE (status=identity.status)
  if behavioral_contract_expired(identity): return CONTRACT_EXPIRED
  if credential_expired(identity): return CREDENTIAL_EXPIRED
  Return: VALID
```

---

## Identity Uniqueness Constraints

```yaml
uniqueness_constraints:
  identity_id: globally unique; monotonically assigned; never reused after decommission
  display_name: unique within identity_type; human-readable canonical form
  behavioral_contract_id: 1:1 with AGENT_IDENTITY; no two agents share a contract
  primary_credential: 1:1 with identity; credential not reused across identities
  
  orphan_prevention:
    every_identity: must have owner_org and responsible_team at all times
    on_org_restructure: identity ownership must be transferred before org dissolution
    quarterly_orphan_scan: automated scan; identities without active owner → T3 alert
```

---

## Directory Indexes

```yaml
registry_indexes:
  primary:
    key: identity_id
    structure: B-tree; O(log n) lookup
    
  secondary:
    name_index: display_name → identity_id
    credential_index: credential_fingerprint → identity_id
    contract_index: behavioral_contract_id → identity_id
    role_index: role_id → [identity_ids]      # reverse lookup: who has this role?
    org_index: owner_org → [identity_ids]
    jurisdiction_index: jurisdiction → [identity_ids]
    status_index: status → [identity_ids]     # fast enumeration of ACTIVE/SUSPENDED
    
  performance_targets:
    identity_lookup: < 5ms p99
    role_membership_lookup: < 10ms p99
    full_directory_scan: < 30 seconds (144+ agents)
```

---

## Integration

```
Feeds into:
  authentication-engine.md — identity record drives authentication policy
  authorization-engine.md — roles and risk tier drive authorization decisions
  identity-lifecycle-manager.md — lifecycle state transitions recorded here
  access-certification-engine.md — identity records drive review campaigns
  identity-governance-dashboard.md — registry metrics surfaced here

Receives from:
  identity-lifecycle-manager.md — provisioning and decommission events
  behavioral-contract-system.md — contract IDs linked to agent identities
  credential-vault.md — credential refs updated on rotation
  role-management.md — role assignment events update entitlement_summary
```

---

## Governance

**Identity Registry is the single source of truth:** No system may maintain its own identity store; all identity assertions must be validated against this registry  
**Decommissioned IDs are never reused:** Identity ID namespace is monotonically increasing; historical records are preserved permanently  
**No anonymous identities:** Every action in the enterprise must be attributable to a registered, active identity; unattributed actions trigger automatic security alert  
**Risk tier assignment:** CRITICAL and SUPER_PRIVILEGED risk tier assignments require T4 approval; all others T3  
**Audit:** All identity record creates, updates, and lookups to `memory/identity-management/registry-audit.jsonl`; 7-year retention
