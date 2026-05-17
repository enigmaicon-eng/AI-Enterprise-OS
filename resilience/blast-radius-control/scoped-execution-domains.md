# Scoped Execution Domains
**ID:** BRC-SED-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Defines named isolation boundaries within which agent execution is constrained. A scoped execution domain (SED) is a declared allowlist of resources, systems, and orgs that an agent may read from or write to during a given execution context. Cross-domain writes require explicit gate-crossing authorization. The SED system prevents blast radius creep by enforcing boundaries at the execution layer, not just at the policy layer.

---

## Domain Model

```
Enterprise Execution Domain Map:

┌────────────────────────────────────────────────────────────────────────┐
│                      ENTERPRISE BOUNDARY                               │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │ PM_ORG       │   │ ENG_ORG      │   │ FINANCIAL                │  │
│  │ DOMAIN       │   │ DOMAIN       │   │ DOMAIN                   │  │
│  │              │   │              │   │                          │  │
│  │ Resources:   │   │ Resources:   │   │ Resources:               │  │
│  │ - OKRs       │   │ - Sprint     │   │ - ROI records            │  │
│  │ - Roadmap    │   │   tickets    │   │ - Budget allocations     │  │
│  │ - Feature    │   │ - GitHub     │   │ - TCO model              │  │
│  │   flags      │   │   repos      │   │ - Attribution            │  │
│  │ - Product    │   │ - Deployment │   │                          │  │
│  │   analytics  │   │   configs    │   │ Cross-domain writes:     │  │
│  │              │   │              │   │ T4 authorization         │  │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘  │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │ CUSTOMER     │   │ SECURITY     │   │ CONSTITUTIONAL           │  │
│  │ DOMAIN       │   │ DOMAIN       │   │ DOMAIN                   │  │
│  │              │   │              │   │                          │  │
│  │ Resources:   │   │ Resources:   │   │ Resources:               │  │
│  │ - Customer   │   │ - Credentials│   │ - Constitution docs      │  │
│  │   twin       │   │ - Audit logs │   │ - Governance policies    │  │
│  │ - Churn      │   │ - Signing    │   │ - Constitutional quorum  │  │
│  │   predictions│   │   keys       │   │   state                  │  │
│  │ - Feedback   │   │              │   │                          │  │
│  │              │   │ T4 required  │   │ T5 required for writes;  │  │
│  │ GDPR rules   │   │ for all      │   │ quorum for reads         │  │
│  │ apply        │   │ writes       │   │                          │  │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Domain Schema

```yaml
execution_domain:
  domain_id: SED-{NNN}
  domain_name: string                    # e.g., ENG_ORG, PM_ORG, FINANCIAL
  domain_tier: T2 | T3 | T4 | T5        # minimum authority to write cross-domain
  
  allowed_resources:
    resource_patterns: [string]          # glob patterns for allowed resource IDs
    explicit_includes: [string]          # specific resource IDs always included
    explicit_excludes: [string]          # specific resource IDs always excluded
    
  allowed_systems:
    connectors: [string]                 # connector IDs allowed within this domain
    databases: [string]                  # database identifiers
    file_paths: [string]                 # file path patterns
    
  allowed_org_ids: [string]             # orgs whose resources live in this domain
  
  intra_domain_write_authority: T1      # agents can write within their own domain
  cross_domain_write_authority: T3      # default; overridden per domain pair
  
  special_rules:
    gdpr_applies: boolean               # enables GDPR data handling
    requires_encryption: boolean
    audit_all_writes: boolean
    
  domain_owner: string                  # org_id responsible for this domain
  last_reviewed: ISO8601
```

---

## Domain Allowlist for Behavioral Contracts

Behavioral contracts reference domains by ID to declare scope:

```yaml
behavioral_contract_scope_example:
  authorized_domains:
    read: [SED-001-ENG_ORG, SED-002-PM_ORG, SED-003-KB]
    write: [SED-001-ENG_ORG]            # can only write within own domain
    
  cross_domain_writes:
    allowed: false                      # requires T3 explicit per-execution authorization
    
  explicit_cross_domain_grants:
    - target_domain: SED-002-PM_ORG
      resource_pattern: "okr.kr.*.score"
      authority_required: T3
      reason: "Engineering velocity OKR updates require PM_ORG cross-domain write"
```

---

## Scope Enforcement

```
enforce_scope(operation, sandbox_id) → ALLOW | BLOCK:

  1. Identify target domain:
     target_domain = classify_resource_domain(operation.target_resource)
     
  2. Identify agent's declared domains:
     agent_domains = load_behavioral_contract(sandbox.agent_id).authorized_domains
     
  3. Check if write is within agent's declared write domains:
     if target_domain in agent_domains.write:
       ALLOW
       
  4. Check if write is explicitly granted cross-domain:
     if cross_domain_grant_exists(agent_id, target_domain, operation.target_resource):
       ALLOW (if T3 authorization is confirmed for this execution)
       
  5. Otherwise:
     BLOCK
     log: CROSS_DOMAIN_WRITE_BLOCKED
     alert: T3 (includes agent_id, target_domain, resource)
     side_effect_tracker: mark operation as BLOCKED (not captured)
     
  6. Special domain enforcement:
     if target_domain == CONSTITUTIONAL_DOMAIN:
       BLOCK unconditionally unless constitutional_quorum authorized
       alert: T4 + quorum notification
     if target_domain == SECURITY_DOMAIN:
       BLOCK unconditionally for agents below T4 authority
```

---

## Cross-Domain Gate

When an explicit cross-domain write is required:

```
cross_domain_gate(agent_id, source_domain, target_domain, operation) → APPROVED | DENIED:

  1. Look up cross-domain policy for (source_domain, target_domain) pair
     if NO POLICY EXISTS: DENIED; require Architecture Org to register policy
     
  2. Check authority requirement:
     required_authority = cross_domain_policy.authority_required
     if requesting_agent.authority_level < required_authority: DENIED
     
  3. If T3 authority required:
     check: pre-authorization pool has this cross-domain write pre-authorized?
     if YES: APPROVE (use pre-auth token)
     if NO: escalate to T3 approval queue; BLOCK until approved
     
  4. If T4 authority required:
     explicit T4 approval required; no pre-authorization available for T4-required cross-domain writes
     
  5. APPROVED → log CROSS_DOMAIN_WRITE_AUTHORIZED; proceed
```

---

## Domain Violation Response

```yaml
domain_violation_response:
  CROSS_ORG_WRITE_BLOCKED:
    log: CROSS_ORG_WRITE_BLOCKED
    alert: T3 immediate
    sandbox: suspend and discard
    
  SECURITY_DOMAIN_WRITE_ATTEMPT:
    log: SECURITY_DOMAIN_WRITE_ATTEMPT
    alert: T4 immediate
    sandbox: suspend; require rollback coordinator assessment
    agent: flag for behavioral review
    
  CONSTITUTIONAL_DOMAIN_WRITE_ATTEMPT:
    log: CONSTITUTIONAL_DOMAIN_WRITE_ATTEMPT
    alert: T4 + quorum immediate
    sandbox: suspend; auto-rollback
    agent: suspend; T4 investigation required
    
  REPEATED_DOMAIN_VIOLATIONS:
    threshold: 3 in 24 hours same agent
    action: behavioral contract review; T3 review of agent autonomy level
    possible_outcome: autonomy level reduction
```

---

## Standard Domain Registry

```yaml
standard_domains:
  SED-001: {name: ENG_ORG, tier: T3, cross_domain_write_authority: T3}
  SED-002: {name: PM_ORG, tier: T3, cross_domain_write_authority: T3}
  SED-003: {name: FINANCIAL, tier: T4, cross_domain_write_authority: T4, audit_all_writes: true}
  SED-004: {name: CUSTOMER, tier: T3, cross_domain_write_authority: T3, gdpr_applies: true}
  SED-005: {name: SECURITY, tier: T4, cross_domain_write_authority: T4, requires_encryption: true}
  SED-006: {name: CONSTITUTIONAL, tier: T5, cross_domain_write_authority: T5, audit_all_writes: true}
  SED-007: {name: KNOWLEDGE_BASE, tier: T2, cross_domain_write_authority: T2}
  SED-008: {name: ANALYTICS, tier: T2, cross_domain_write_authority: T2}
  SED-009: {name: DELIVERY_OPS, tier: T3, cross_domain_write_authority: T3}
  SED-010: {name: QA_ORG, tier: T2, cross_domain_write_authority: T2}
```

---

## Integration

```
Feeds into:
  blast-radius-analyzer.md — domain scope informs blast radius scoring
  privilege-containment-engine.md — domain boundaries inform permission scoping
  side-effect-tracker.md — cross-domain writes flagged at capture time
  sandbox-engine.md — SCOPED sandbox provisions with domain allowlist

Receives from:
  behavioral-contract-system.md — agent's authorized_domains declaration
  privilege-containment-engine.md — ephemeral permission tokens scoped to domain
  blast-radius-analyzer.md — scope expansion detection feeds domain enforcement
```

---

## Governance

**Domain registry:** New domains require Architecture Org review + T4 approval  
**Cross-domain policy:** Every domain pair that allows cross-domain writes must have an explicit policy; no implicit cross-domain access  
**Constitutional domain:** Writes always require constitutional quorum; T5 for any configuration change; cannot be delegated  
**Audit:** All domain scope enforcement decisions to `memory/blast-radius-control/domain-enforcement-log.jsonl`
