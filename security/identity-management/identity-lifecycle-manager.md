# Identity Lifecycle Manager
**ID:** IAM-ILM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Orchestrates the full lifecycle of every enterprise identity — from provisioning request through activation, modification, suspension, and decommissioning — enforcing separation of duties, least-privilege provisioning, and complete audit trails at every transition. The Identity Lifecycle Manager is the process layer of IAM: it ensures that identities exist only as long as needed, with only the access required, and that every state transition is authorized, logged, and reversible where appropriate.

---

## Lifecycle State Machine

```
REQUESTED → APPROVED → PROVISIONED → ACTIVE → [SUSPENDED] → DECOMMISSIONED
                                         ↓
                                   LEAVE_OF_ABSENCE (HUMAN_OPERATOR only)
                                         ↓
                                       ACTIVE (on return)

Transitions:
  REQUESTED → APPROVED:         provisioning_approver authorizes (T2 min; T3 for ELEVATED+)
  REQUESTED → REJECTED:         request denied; record retained; requester notified
  APPROVED → PROVISIONED:       identity_registry creates record; credentials issued; no access yet
  PROVISIONED → ACTIVE:         initial role assignment complete; behavioral contract signed (agents)
  ACTIVE → SUSPENDED:           auto (security event) or manual (T2+) suspension
  ACTIVE → LEAVE_OF_ABSENCE:    HR-initiated for HUMAN_OPERATOR; all access suspended
  SUSPENDED → ACTIVE:           reinstatement after investigation cleared (T3+ approval)
  SUSPENDED → DECOMMISSIONED:   investigation confirmed compromise or role ended
  ACTIVE → DECOMMISSIONED:      planned offboarding (role ended; project complete)
  LEAVE_OF_ABSENCE → ACTIVE:    HR confirms return; access restored to pre-LOA state
  LEAVE_OF_ABSENCE → DECOMMISSIONED: HR confirms departure
  
  Decommissioned → *:           TERMINAL; no transitions out of DECOMMISSIONED
```

---

## Joiner Workflow (New Identity Provisioning)

```yaml
joiner_workflow:
  workflow_id: ILM-JOIN-{NNN}

  step_1_REQUEST:
    actor: requesting_team_lead or automated_system (new agent deployment)
    inputs:
      - identity_type
      - proposed_display_name
      - owner_org
      - requested_roles: [ROLE-{NNN}]
      - business_justification: string
      - jurisdiction: JUR-{XX}
      - autonomy_level: integer
    validation:
      - proposed_name uniqueness check
      - requested_roles exist and are appropriate for identity_type
      - business_justification non-empty and coherent
      
  step_2_APPROVAL:
    approvers:
      STANDARD identities: T2 team lead + T3 SOC (security review)
      ELEVATED identities: T3 + T4 CISO
      PRIVILEGED identities: T4 + Legal Org (for agents with data access)
      SUPER_PRIVILEGED identities: T4 + T5 board representative
    SLA: T2 approval within 4hr; T3 within 24hr; T4 within 48hr
    
  step_3_PROVISIONING:
    automated_steps:
      1. create_identity_record(IDN-{NNN}) in identity-registry
      2. generate_credentials(identity_id) → credential-vault.md
      3. create_behavioral_contract(identity_id) if AGENT_IDENTITY
      4. assign_initial_roles(identity_id, approved_roles) via role-management
      5. configure_mfa(identity_id) if HUMAN_OPERATOR
      6. notify_requester(identity_id, credentials_delivery_method)
    human_gate:
      - behavioral_contract reviewed and signed by agent (AGENT_IDENTITY)
      - initial access test completed by new identity (HUMAN_OPERATOR)
      
  step_4_ACTIVATION:
    trigger: identity confirms readiness; provisioner approves activation
    actions:
      - set status = ACTIVE
      - start certification_clock (next_certification_due = now + certification_cadence)
      - register for enhanced monitoring (first 30 days)
      - log activation event
```

---

## Mover Workflow (Role and Access Modification)

```yaml
mover_workflow:
  workflow_id: ILM-MOVE-{NNN}
  trigger: role change; org transfer; jurisdiction change; capability scope update
  
  step_1_CHANGE_REQUEST:
    required_fields:
      - identity_id
      - change_type: ROLE_CHANGE | ORG_TRANSFER | JURISDICTION_CHANGE | SCOPE_UPDATE
      - changes: {from: ..., to: ...}
      - effective_date: ISO8601
      - business_justification: string
      
  step_2_IMPACT_ANALYSIS:
    automated:
      - identify roles being removed (access to revoke)
      - identify roles being added (access to grant; requires approval)
      - check SoD violations in new role set
      - check jurisdiction compliance for new access scope
    output: impact_report (what access changes; any violations detected)
    
  step_3_APPROVAL:
    rule: changes granting access require same approval level as initial provisioning
    rule: changes revoking-only access can be applied by T2 without additional approval
    rule: SoD violation detected → cannot proceed without T4 + SoD exception
    
  step_4_EXECUTION:
    access_revocation: immediate (before granting new access)
    access_grant: after revocation complete
    behavioral_contract_update: if scope changes require contract amendment
    notification: identity notified of access changes
    
  transition_period:
    overlap_window: 0 (no overlap; old access removed before new granted)
    exception: T4 may approve 24hr overlap for critical operational continuity
```

---

## Leaver Workflow (Decommissioning)

```yaml
leaver_workflow:
  workflow_id: ILM-LEAVE-{NNN}
  trigger: planned departure | project end | security incident | role elimination
  
  STANDARD_LEAVER (planned):
    timeline: initiated 5 business days before effective date
    steps:
      D-5: initiate_leaver_workflow; notify responsible_team
      D-2: begin_knowledge_transfer_window; read-only access where applicable
      D-0: revoke_all_active_tokens(); revoke_all_sessions(); suspend_credentials()
      D-0: archive_identity_artifacts() (behavioral contract, action history, outputs)
      D-0: transfer_ownership(agent_outputs, successor_agent_id)
      D+1: verify_no_residual_access (automated scan)
      D+30: decommission_identity_record (status=DECOMMISSIONED; record preserved)
      
  EMERGENCY_LEAVER (security incident / immediate termination):
    timeline: immediate
    steps:
      T+0: revoke_all_active_tokens() — IMMEDIATE; no delay
      T+0: terminate_all_active_sessions() — IMMEDIATE
      T+0: suspend_credentials() — IMMEDIATE
      T+0: quarantine_agent_if_AI_identity()
      T+0: notify_SOC(identity_id, reason)
      T+1hr: forensic_evidence_collection(identity_id)
      T+24hr: full_access_audit(identity_id, window=90_days)
      T+72hr: decommission_identity_record
      
  post_decommission:
    record_retention: permanent (identity record retained; status=DECOMMISSIONED)
    credential_destruction: all credentials cryptographically destroyed at D+30 (standard) or T+72hr (emergency)
    access_log_retention: 7 years
```

---

## Orphan Identity Detection

```yaml
orphan_detection:
  definition: identity where owner_org is dissolved, responsible_team no longer exists, or last_certification > 180 days ago
  
  automated_detection:
    cadence: weekly scan (Sundays 02:00 UTC)
    checks:
      - owner_org exists in org registry
      - responsible_team has at least one active member
      - last_certification within certification_cadence × 1.5
      - identity has had at least one action in past 90 days (for AGENT identities)
      
  orphan_response:
    SOFT_ORPHAN (owner exists; uncertified; inactive):
      action: alert responsible_team + T3; 30-day remediation window
      if_no_response: auto-suspend after 30 days; T3 decommission review
      
    HARD_ORPHAN (owner org dissolved; owner identity decommissioned):
      action: auto-suspend immediately; T3 alert; 14-day decommission unless claimed
      claim_process: new owner team lead + T3 approval required to claim
      
  stale_identity:
    definition: ACTIVE identity with no actions in > 90 days
    action: T3 alert; certification request sent; if no response in 30 days → suspend
```

---

## Lifecycle Event Schema

```yaml
lifecycle_event:
  event_id: ILM-EVT-{NNN}
  identity_id: IDN-{NNN}
  timestamp: ISO8601
  
  transition:
    from_state: string
    to_state: string
    trigger: PLANNED | SECURITY_INCIDENT | CERTIFICATION_FAILURE | ORPHAN_DETECTION | MANUAL
    
  authorization:
    authorized_by: IDN-{NNN}
    authorization_tier: T1 | T2 | T3 | T4
    approval_record_id: string | null
    
  changes:
    roles_added: [ROLE-{NNN}]
    roles_removed: [ROLE-{NNN}]
    permissions_added: [PERM-{NNN}]
    permissions_removed: [PERM-{NNN}]
    credential_rotated: boolean
    
  integrity:
    event_hash: sha256
    previous_event_hash: sha256    # hash-chain linking all lifecycle events for this identity
```

---

## Integration

```
Feeds into:
  identity-registry.md — all lifecycle transitions update identity record status
  credential-vault.md — provisioning and decommission trigger credential operations
  role-management.md — mover workflow drives role assignment changes
  access-governance.md — lifecycle events trigger certification schedule updates
  behavioral-anomaly-detector.md — new identities registered for behavioral profiling

Receives from:
  access-governance.md — certification failures trigger suspension
  insider-threat-detector.md — confirmed insider threats trigger emergency leaver
  security-operations/soc-playbook-engine.md — PB-SOC-003/008 call revocation steps here
  adaptive-compliance/compliance-engine.md — compliance violations may trigger suspension
```

---

## Governance

**Separation of duties for provisioning:** The identity requesting provisioning cannot be the approving authority; requester and approver must be different identities  
**Emergency leaver is unconditional:** Token revocation and session termination in EMERGENCY_LEAVER cannot be delayed by any operational concern; access cessation comes before business continuity  
**Decommissioned records are immutable:** Once an identity is DECOMMISSIONED, the record cannot be modified; only a new identity can be provisioned (with a new IDN-{NNN})  
**Orphan identities cannot remain ACTIVE:** Any identity flagged as orphan is auto-suspended within 30 days regardless of activity; the enterprise has no unclaimed active identities  
**Audit:** All lifecycle events to `memory/identity-management/lifecycle-audit.jsonl`; 7-year retention; decommission events retained permanently
