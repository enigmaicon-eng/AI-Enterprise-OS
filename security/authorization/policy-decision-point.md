# Policy Decision Point
**ID:** IAM-PDP-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Serves as the single, centralized enforcement point for all authorization policy evaluations — receiving access requests from Policy Enforcement Points (PEPs) distributed across the enterprise, evaluating them against the full policy set, and returning binding authorization decisions. The Policy Decision Point (PDP) is the architectural separation between policy logic and enforcement; PEPs throughout the system enforce decisions but never compute them, ensuring consistent, tamper-resistant, auditable authorization across all 144 agents and connectors.

---

## PDP Architecture

```yaml
pdp_architecture:
  
  deployment:
    mode: centralized-with-replica
    primary: 1 primary PDP instance (authoritative for policy updates)
    replicas: 3 read replicas (serve authorization decisions; sync from primary)
    replication_lag_max: 5 seconds (policy changes propagate within 5s)
    failover: replicas serve decisions if primary unavailable; no policy updates during failover
    
  performance_targets:
    simple_decision: < 5ms p95 (cached identity + policy; simple RBAC)
    complex_decision: < 25ms p95 (full ABAC evaluation; no cache)
    constitutional_check: < 10ms p95 (pre-computed constitutional constraint index)
    throughput: > 50,000 decisions/second (aggregate across replicas)
    availability: 99.99% (authorization service is critical path for all enterprise operations)
    
  isolation:
    PDP_privilege_level: SUPER_PRIVILEGED (PDP itself must be authorized to evaluate any policy)
    PDP_identity: IDN-PDP-PRIMARY, IDN-PDP-REPLICA-{N}
    PDP_network: isolated network segment; reachable only from PEP registry endpoints
    PDP_modification: policy updates require T3 IAM + cryptographic policy signature
```

---

## Policy Enforcement Point (PEP) Registry

```yaml
pep_registry:
  # All PEPs that can submit authorization requests to the PDP
  
  PEP-001:
    name: "Agent Action Gateway"
    scope: all agent action invocations
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS (blocks action until decision received)
    
  PEP-002:
    name: "API Gateway"
    scope: all inbound API requests from external connectors
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS
    
  PEP-003:
    name: "Data Access Proxy"
    scope: all agent-to-storage queries and writes
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS
    
  PEP-004:
    name: "Cross-Border Transfer Gateway"
    scope: all cross-jurisdiction data movements
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS (hard requirement; no transfers without explicit PERMIT)
    
  PEP-005:
    name: "Playbook Execution Gate"
    scope: all SOC playbook automated steps and human gate actions
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS
    
  PEP-006:
    name: "Privileged Session Manager"
    scope: all privileged and SUPER_PRIVILEGED operations
    integration_method: gRPC (mTLS)
    decision_mode: SYNCHRONOUS + STEP_UP enforcement
    
  PEP-007:
    name: "Compliance Decision Enforcer"
    scope: compliance engine permit/block decisions
    integration_method: event-driven (compliance engine calls PDP before PERMIT)
    decision_mode: SYNCHRONOUS
    
  registration:
    new_pep: requires T3 IAM approval + mTLS certificate from enterprise CA
    pep_authentication: mTLS mutual authentication at every PDP connection
    unauthorized_pep: PDP rejects requests from unregistered PEPs with T3 alert
```

---

## Authorization Request Schema

```yaml
authorization_request:
  request_id: PDR-{NNN}
  submitted_at: ISO8601
  pep_id: string                         # must be in PEP registry
  
  subject:
    session_token: string                # validated session token from authentication-engine
    identity_id: IDN-{NNN}             # extracted from session token; PDP re-validates
    
  resource:
    resource_id: string
    resource_type: string
    resource_jurisdiction: JUR-{XX}
    resource_sensitivity: LOW | MEDIUM | HIGH | CRITICAL
    resource_owner_id: IDN-{NNN} | null
    
  action:
    action_type: string                  # maps to permission catalog action types
    action_scope: string
    reversible: boolean
    estimated_blast_radius: float | null
    
  environment:
    requesting_timestamp: ISO8601
    requesting_ip: string | null
    requesting_jurisdiction: JUR-{XX}
    active_security_posture_score: float
    existing_session_age_seconds: integer
    step_up_completed: boolean
    step_up_method: string | null
```

---

## Authorization Response Schema

```yaml
authorization_response:
  request_id: PDR-{NNN}               # mirrors request ID
  decided_at: ISO8601
  decision_latency_ms: integer
  
  decision: PERMIT | DENY | STEP_UP | CONSTITUTIONAL_BLOCK
  
  permit_details:                      # populated if decision == PERMIT
    effective_permissions: [PERM-{NNN}]
    applied_policies: [ABP-{NNN}]
    constraints:                       # conditions that accompany the permit
      time_limit_seconds: integer | null
      jurisdiction_scope: [JUR-{XX}]
      max_data_volume_bytes: integer | null
      step_up_required_at: string | null
      
  deny_details:                        # populated if decision == DENY
    reason: string                     # machine-readable reason code
    human_reason: string               # analyst-readable explanation
    applicable_policy: ABP-{NNN} | null
    remediation_path: string | null    # how identity could gain access legitimately
    
  step_up_details:                     # populated if decision == STEP_UP
    required_method: string
    reason: string
    step_up_endpoint: string           # where to complete step-up
    valid_for_seconds: 300             # step-up link expires in 5 minutes
    
  constitutional_block_details:        # populated if CONSTITUTIONAL_BLOCK
    proximity_score: float
    violated_constraint: string
    quorum_notified: boolean
    
  integrity:
    response_hash: sha256(decision + decided_at + request_id)
    signed_by: IAM-PDP-001
```

---

## Policy Repository

```yaml
policy_repository:
  
  storage:
    format: signed policy bundles (policies + Ed25519 T3 signature)
    location: PDP-internal encrypted store; version-controlled
    active_policy_set: single authoritative set; versioned with semver
    
  policy_load:
    at_startup: load latest signed policy bundle; verify signature
    on_policy_update: verify new bundle signature; hot-reload without restart
    on_signature_failure: reject update; alert T4; continue on prior valid bundle
    
  policy_types_loaded:
    RBAC_matrix: role → permissions mapping (from role-management.md)
    ABAC_policies: [ABP-{NNN}] attribute-based conditions (from authorization-engine.md)
    SoD_constraints: role incompatibility rules (from role-management.md)
    constitutional_constraints: pre-computed constraint index (from constitutional-governor-quorum.md)
    permission_definitions: full catalog (from permission-catalog.md)
    
  policy_update_authorization:
    rbac_matrix: T3 IAM + T3 SOC co-sign
    abac_policies: T3 IAM + T4 approval for HIGH-impact policies
    constitutional_constraints: T4 + constitutional quorum (cannot be modified at PDP level alone)
    
  policy_version_history:
    retention: all policy versions retained permanently (governance and forensic requirement)
    rollback: T3 can roll back to previous policy version in < 60 seconds
    audit: all policy changes to `memory/identity-management/policy-audit.jsonl`
```

---

## Decision Audit and Observability

```yaml
decision_audit:
  
  what_is_logged:
    all_decisions: PERMIT, DENY, STEP_UP, CONSTITUTIONAL_BLOCK
    decision_metadata: request_id, subject, resource, action, decision, latency, applied_policies
    
  what_is_NOT_logged:
    raw_session_tokens (only identity_id and session_id)
    sensitive_resource_content (only resource_id and type)
    
  sampling_for_performance:
    PERMIT_decisions: 10% sampled for detailed logging (all logged at minimum; detail sampled)
    DENY_decisions: 100% logged with full detail
    CONSTITUTIONAL_BLOCK: 100% logged permanently
    STEP_UP: 100% logged
    
  real_time_metrics:
    decision_rate: decisions/second (by PEP, by decision type)
    latency_percentiles: p50/p95/p99 (by PEP)
    deny_rate_spike: alert if deny rate increases > 3× in any 5-minute window
    constitutional_block_trend: weekly report to constitutional quorum
    
  PDP_health:
    replica_lag_monitoring: alert if any replica > 5s behind primary
    policy_staleness: alert if active policy bundle > 24hr old without refresh attempt
    throughput_headroom: alert if throughput > 70% of capacity for > 5 minutes
```

---

## Integration

```
Feeds into:
  authorization-engine.md — PDP calls authorization engine as its evaluation backend
  security-event-correlator.md — authorization denials and constitutional blocks feed IDENTITY_EVENTS
  identity-analytics.md — PDP decision data feeds risk analytics
  security-metrics-dashboard.md — PDP health metrics surfaced in SOC dashboard

Receives from:
  all PEPs in PEP registry — authorization requests
  role-management.md — RBAC matrix updates trigger policy bundle refresh
  permission-catalog.md — permission changes trigger policy bundle refresh
  constitutional-governor-quorum.md — constitutional constraint updates (highest priority policy refresh)
  authentication-engine.md — session tokens validated here for every request
```

---

## Governance

**PDP decisions are binding:** All enterprise systems must accept PDP decisions; no PEP may override a DENY or CONSTITUTIONAL_BLOCK regardless of local logic  
**PDP is not modifiable by operational agents:** Only T3 IAM administrators can update policy bundles; operational agents (including T4 executives) cannot directly modify PDP policy  
**Constitutional constraint updates go to PDP first:** Any change to constitutional constraints at the quorum level propagates to PDP within 5 seconds; constitutional blocks cannot be loosened without quorum approval  
**Replica drift is a security event:** If any PDP replica is > 5 seconds behind primary for > 30 seconds, the replica is taken offline and T3 is alerted  
**Audit:** All PDP decision events to `memory/identity-management/pdp-audit.jsonl`; DENY and CONSTITUTIONAL_BLOCK events retained 10 years; PERMIT sampled events 7 years
