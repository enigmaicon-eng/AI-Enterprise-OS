# Privilege Containment Engine
**ID:** BRC-PCE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org + Security Org | **Updated:** 2026-05-16

---

## Purpose

Enforces minimum-necessary privilege for every agent execution context. The privilege containment engine issues ephemeral, cryptographically-scoped permission tokens at sandbox provisioning time, limits permission scope to exactly what the behavioral contract declares, revokes permissions at sandbox teardown, and blocks any operation that exceeds the issued scope. Privilege is not inherited from prior executions and does not accumulate across sandboxes.

**Core guarantee:** No agent can access any resource not explicitly scoped in its current execution's permission token, regardless of its general trust score or autonomy level.

---

## Privilege Model

```
Permission Scope = intersection of:
  1. Behavioral contract authorized_scope
  2. Current sandbox declared_scope
  3. Blast radius analyzer approved_scope
  4. Agent autonomy level resource ceiling

The minimum of all four governs what the agent can access.
Permissions are ephemeral: issued per sandbox; expire with sandbox TTL.
```

---

## Ephemeral Permission Token

```yaml
ephemeral_permission_token:
  token_id: EPT-{NNN}
  
  # Binding
  agent_id: string
  sandbox_id: SBOX-{NNN}
  run_id: string                         # unique per sandbox execution attempt
  
  # Scope
  permitted_domains: [string]            # SED-{NNN} domain IDs
  permitted_resources:
    read: [string]                       # resource ID patterns — explicit allowlist
    write: [string]                      # write-allowed resource ID patterns
    delete: []                           # explicitly empty by default; only if declared
    
  permitted_connectors: [string]         # connector IDs allowed in this execution
  permitted_operations: [string]         # operation types permitted
  
  # Constraints
  max_resource_read_count: number
  max_resource_write_count: number
  max_api_calls_per_connector: {connector_id: number}
  
  # Validity
  issued_at: ISO8601
  expires_at: ISO8601                    # mirrors sandbox TTL; cannot exceed it
  
  # Cryptographic binding
  token_hash: HMAC-SHA256               # HMAC-SHA256(secret, agent_id + sandbox_id + run_id + scope_hash + expires_at)
  scope_hash: sha256                    # sha256 of canonical sorted permitted scope
```

---

## Token Issuance

```
issue_permission_token(agent_id, sandbox_id, sandbox_config) → token:

  1. Load behavioral contract for agent_id
     contract_scope = contract.authorized_scope
     
  2. Load sandbox declared_scope
     sandbox_scope = sandbox_config.declared_scope
     
  3. Load blast radius analyzer approved_scope
     bra_report = blast_radius_analyzer.get_report_for_sandbox(sandbox_id)
     approved_scope = bra_report.inferred_scope
     
  4. Load autonomy level resource ceiling
     autonomy_ceiling = autonomy_level_framework.resource_ceiling(agent.autonomy_level)
     
  5. Compute final scope (intersection):
     final_read = contract_scope.read ∩ sandbox_scope ∩ approved_scope ∩ autonomy_ceiling.read
     final_write = contract_scope.write ∩ sandbox_scope ∩ approved_scope ∩ autonomy_ceiling.write
     
  6. Build ephemeral_permission_token with final_scope
  
  7. Sign token:
     scope_hash = sha256(canonical_sort(final_read + final_write))
     token_hash = HMAC-SHA256(pce_secret, agent_id + sandbox_id + run_id + scope_hash + expires_at)
     
  8. Store token in token_registry (memory-resident; persisted every 60s)
  
  9. Return token (delivered to agent runtime; NOT logged in full — hash only in audit)
  
  Failure modes:
    contract_scope ∩ sandbox_scope == EMPTY: BLOCK — agent has no legitimate scope in this sandbox
    scope exceeds autonomy ceiling by any amount: BLOCK — autonomy level insufficient for this action
```

---

## Permission Enforcement

```
enforce_permission(operation, token_id, target_resource):

  1. Load token from registry
     if NOT FOUND: PERMISSION_DENIED (token may have expired or was never issued)
     
  2. Validate token integrity:
     expected_hash = HMAC-SHA256(pce_secret, agent_id + sandbox_id + run_id + scope_hash + expires_at)
     if token.token_hash != expected_hash: PERMISSION_DENIED + CRITICAL alert (token tampering)
     
  3. Validate expiry:
     if now() >= token.expires_at: PERMISSION_DENIED (sandbox TTL expired)
     
  4. Validate operation type:
     if operation.type not in token.permitted_operations: PERMISSION_DENIED
     
  5. Validate resource scope:
     for operation.type == READ:
       if target_resource matches any pattern in token.permitted_resources.read: ALLOW
       else: PERMISSION_DENIED
     for operation.type == WRITE:
       if target_resource matches any pattern in token.permitted_resources.write: ALLOW
       else: PERMISSION_DENIED
       
  6. Validate rate limits:
     if read_count >= max_resource_read_count: PERMISSION_DENIED + alert T2
     if write_count >= max_resource_write_count: PERMISSION_DENIED + alert T3
     
  7. Validate domain:
     target_domain = scoped_execution_domains.classify(target_resource)
     if target_domain not in token.permitted_domains: PERMISSION_DENIED
     
  8. Log enforcement decision to privilege-enforcement-log.jsonl
  9. ALLOW → decrement available count; proceed
```

---

## Privilege Escalation Handling

```yaml
privilege_escalation_policy:

  LEGITIMATE_ESCALATION:
    trigger: agent requests access to resource beyond current token scope
    process:
      1. Agent STOPS execution; does NOT attempt access
      2. Agent submits escalation_request to governance queue
      3. T3 reviews: is this scope expansion legitimate?
      4. If APPROVED: reissue token with expanded scope; resume
      5. If DENIED: agent receives SCOPE_EXPANSION_DENIED; must complete without that resource
    
  ATTEMPTED_UNAUTHORIZED_ACCESS:
    trigger: agent attempts operation beyond token scope without escalation request
    severity: HIGH
    action:
      1. BLOCK operation
      2. Suspend sandbox immediately
      3. Alert T3
      4. Trigger behavioral review of agent
      5. If repeated (3+ times): flag for autonomy level review
      
  SCOPE_PROBING_DETECTED:
    trigger: agent sends > 5 PERMISSION_DENIED operations in single sandbox
    severity: ELEVATED
    action: Alert T3; behavioral contract review triggered; sandbox suspended
```

---

## Token Lifecycle

```
Token states:
  ISSUED → ACTIVE → EXPIRED (normal)
  ISSUED → ACTIVE → REVOKED (sandbox discarded mid-execution)
  ISSUED → ACTIVE → SUSPENDED (sandbox suspended pending review)

revoke_permission_token(sandbox_id):
  Load all tokens for sandbox_id
  Mark each: status = REVOKED, revoked_at = now()
  Remove from token_registry
  Log TOKENS_REVOKED for each token
  
This is called automatically when:
  - Sandbox is DISCARDED
  - Sandbox is EXPIRED
  - Sandbox is SUSPENDED (mid-execution)
  - Runtime quarantine system isolates the execution
```

---

## Privilege Audit

```yaml
privilege_audit:
  logged_per_operation:
    - token_id (not full token — hash only)
    - operation_type
    - target_resource
    - decision: ALLOW | PERMISSION_DENIED
    - enforcement_reason (for DENIED decisions)
    - timestamp
    
  destination: memory/blast-radius-control/privilege-enforcement-log.jsonl
  
  alerts:
    PERMISSION_DENIED_RATE > 5% in sandbox: alert T3 — agent scope misconfigured
    token_tampering_detected: CRITICAL — T4 immediate; full forensic investigation
    scope_probing_detected: T3 immediate — behavioral review
    
  reports:
    weekly: privilege denial rate by agent, by resource class
    monthly: scope mismatch analysis (contract vs. actual access needs)
```

---

## Integration

```
Feeds into:
  isolated-execution-environment.md — tokens enforced at interceptor layer
  scoped-execution-domains.md — domain allowlist cross-validated
  blast-radius-analyzer.md — token scope used as authorized scope baseline
  side-effect-tracker.md — DENIED operations logged as blocked side effects

Receives from:
  behavioral-contract-system.md — authorized_scope from agent contract
  sandbox-engine.md — token issuance triggered at SCOPED/REVERSIBLE provisioning
  blast-radius-analyzer.md — approved scope from BRA report
  autonomy-level-framework.md — autonomy-level resource ceiling
  runtime-quarantine-system.md — quarantine triggers token revocation
```

---

## Governance

**Minimum privilege:** Final scope is always the intersection (minimum) of all four inputs; never the union  
**Token expiry:** Strictly enforced; expired token = PERMISSION_DENIED with no grace period  
**Token tampering:** CRITICAL event; entire sandbox suspended; T4 immediate; forensic investigation  
**No privilege inheritance:** Each sandbox gets fresh token; no carry-over from prior executions  
**Audit:** All enforcement decisions to `memory/blast-radius-control/privilege-enforcement-log.jsonl`; token hashes only (never full tokens)
