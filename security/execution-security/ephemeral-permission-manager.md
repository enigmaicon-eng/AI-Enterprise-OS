# Ephemeral Permission Manager

**System ID:** `ephemeral-permission-manager`
**Role:** Issues, tracks, and revokes time-bounded cryptographic permission tokens for agent execution — tokens are single-use or fixed-count, carry embedded constraints, expire automatically on node completion or timeout, and are cryptographically verifiable without a database lookup
**Storage:** `memory/execution-security/ephemeral-tokens.jsonl`

---

## Purpose

Persistent permissions are a standing attack surface. Every second a permission exists beyond its operational need is a second it can be exploited. The ephemeral permission manager treats all permissions as perishable: they are issued as signed tokens tied to a specific task, expire on the shorter of task completion or a hard time ceiling, and cannot be extended without re-derivation. A worker holding an expired token is rejected even if it was legitimately issued — because the task it was issued for is no longer active.

---

## Ephemeral Token Model

```yaml
EphemeralToken:
  token_id: string                     # uuid; globally unique
  token_version: integer               # Monotonically increasing; revocation uses version fence
  
  # Identity binding
  agent_id: string
  worker_id: string                    # Specific worker instance; not transferable
  run_id: string
  node_id: string
  
  # Embedded permissions (from least-privilege-engine)
  permission_grant_id: string
  permissions: [EmbeddedPermission]    # Compact subset for inline verification
  
  # Time bounds
  issued_at: datetime
  not_before: datetime                 # Activation time (usually = issued_at)
  expires_at: datetime                 # Hard expiry — no extension without re-issue
  
  # Usage constraints
  max_uses: integer | null             # Null = unlimited within time bounds (rare)
  current_uses: integer                # Incremented on each valid use
  
  # Cryptographic integrity
  issuer: string                       # "ephemeral-permission-manager"
  signature: string                    # HMAC-SHA256 of (token_id + agent_id + worker_id + run_id + node_id + expires_at + permissions_hash)
  permissions_hash: string             # SHA-256 of embedded permissions
  
  # Revocation
  revoked: boolean
  revocation_token_version: integer | null  # Version threshold for fencing

EmbeddedPermission:
  permission_type: string
  resource_id: string
  constraints_hash: string             # SHA-256 of constraints (verified inline)
  max_invocations: integer | null
```

---

## Token Issuance Protocol

```
issue_token(agent_id, worker_id, node_execution_context) → EphemeralToken:
  
  run_id = node_execution_context.run_id
  node_id = node_execution_context.node_id
  
  # Step 1: Get permission grant from least-privilege-engine
  grant = least_privilege_engine.compute_minimum_permissions(
    agent_id = agent_id,
    node_decl = node_execution_context.node_decl,
    execution_context = node_execution_context
  )
  
  # Step 2: Check no active token already exists for this worker/node
  # (prevents double-issuance if dispatcher retries)
  existing = find_active_token(worker_id, run_id, node_id)
  IF existing AND NOT existing.revoked AND existing.expires_at > now():
    RETURN existing  # Idempotent re-issue
  
  # Step 3: Compute tight expiry
  node_timeout = node_execution_context.timeout_seconds
  max_lifetime = MAX_TOKEN_LIFETIME_SECONDS  # Hard cap: 3600s
  expires_at = now() + timedelta(seconds=MIN(node_timeout, max_lifetime))
  
  # Step 4: Embed permissions compactly
  embedded = [
    EmbeddedPermission(
      permission_type = p.permission_type,
      resource_id = p.resource.resource_id,
      constraints_hash = sha256(serialize(p.constraints)),
      max_invocations = p.constraints.max_invocations
    )
    for p in grant.permissions
  ]
  
  permissions_hash = sha256(serialize(embedded))
  
  # Step 5: Build and sign token
  token = EphemeralToken(
    token_id = generate_uuid(),
    token_version = get_next_token_version(agent_id, run_id, node_id),
    agent_id = agent_id,
    worker_id = worker_id,
    run_id = run_id,
    node_id = node_id,
    permission_grant_id = grant.grant_id,
    permissions = embedded,
    issued_at = now(),
    not_before = now(),
    expires_at = expires_at,
    max_uses = null,
    current_uses = 0,
    issuer = "ephemeral-permission-manager",
    permissions_hash = permissions_hash
  )
  
  # HMAC signature
  signing_input = "|".join([
    token.token_id, token.agent_id, token.worker_id,
    token.run_id, token.node_id,
    token.expires_at.isoformat(),
    token.permissions_hash
  ])
  token.signature = hmac_sha256(SIGNING_KEY, signing_input)
  
  persist_token(token)
  RETURN token
```

---

## Token Verification (Stateless)

```
verify_token(token, action, resource) → TokenVerificationResult:
  
  # Step 1: Signature verification (no DB required)
  expected_signing_input = "|".join([
    token.token_id, token.agent_id, token.worker_id,
    token.run_id, token.node_id,
    token.expires_at.isoformat(),
    token.permissions_hash
  ])
  expected_sig = hmac_sha256(SIGNING_KEY, expected_signing_input)
  
  IF NOT constant_time_compare(token.signature, expected_sig):
    RETURN TokenVerificationResult(
      valid = False, reason = "Signature verification failed — token tampered or invalid"
    )
  
  # Step 2: Temporal validity
  current_time = now()
  IF current_time < token.not_before:
    RETURN TokenVerificationResult(valid=False, reason="Token not yet active")
  IF current_time > token.expires_at:
    RETURN TokenVerificationResult(valid=False, reason=f"Token expired at {token.expires_at.isoformat()}")
  
  # Step 3: Revocation check (requires DB — fast key lookup)
  revocation_version = get_revocation_version(token.agent_id, token.run_id, token.node_id)
  IF token.token_version < revocation_version:
    RETURN TokenVerificationResult(valid=False, reason="Token superseded by revocation fence")
  
  # Step 4: Permission check against embedded permissions
  matching_permission = find_matching_permission(token.permissions, action, resource)
  IF NOT matching_permission:
    RETURN TokenVerificationResult(
      valid = False,
      reason = f"Token does not include permission for action '{action}' on '{resource}'"
    )
  
  # Step 5: Invocation count check
  IF matching_permission.max_invocations:
    current_count = get_permission_invocation_count(token.token_id, matching_permission.resource_id)
    IF current_count >= matching_permission.max_invocations:
      RETURN TokenVerificationResult(
        valid = False,
        reason = f"Permission invocation limit reached ({matching_permission.max_invocations})"
      )
    increment_invocation_count(token.token_id, matching_permission.resource_id)
  
  RETURN TokenVerificationResult(valid=True, permission=matching_permission)
```

---

## Revocation

```
revoke_token(agent_id, run_id, node_id, reason) → void:
  
  # Increment revocation version fence — all tokens with lower version are now invalid
  new_version = increment_revocation_version(agent_id, run_id, node_id)
  
  # Persist revocation record
  revocation_record = {
    revoked_at: now(),
    agent_id: agent_id,
    run_id: run_id,
    node_id: node_id,
    new_fence_version: new_version,
    reason: reason
  }
  append_revocation_log(revocation_record)
  
  log(f"Token revoked: agent={agent_id} run={run_id} node={node_id} fence_version={new_version} reason={reason}")

# Auto-revocation triggers:
auto_revoke_on_node_completion(run_id, node_id):
  active_agents = get_agents_executing_node(run_id, node_id)
  FOR agent_id in active_agents:
    revoke_token(agent_id, run_id, node_id, reason="NODE_COMPLETED")

auto_revoke_on_run_cancel(run_id):
  active_nodes = get_active_nodes_in_run(run_id)
  FOR node_id in active_nodes:
    active_agents = get_agents_executing_node(run_id, node_id)
    FOR agent_id in active_agents:
      revoke_token(agent_id, run_id, node_id, reason="RUN_CANCELLED")

auto_revoke_on_timeout(run_id, node_id):
  active_agents = get_agents_executing_node(run_id, node_id)
  FOR agent_id in active_agents:
    revoke_token(agent_id, run_id, node_id, reason="NODE_TIMEOUT")
```

---

## Token Lifecycle

```
TOKEN LIFECYCLE:

issue_token()          # Node ready → dispatched
    ↓
[Agent executes]        # Token verified on each permission check
    ↓
[Node completes]
    → auto_revoke_on_node_completion()
    ↓
[Token invalidated]     # All future uses rejected
    ↓
[Archived]              # Token record retained for audit
```

---

## Integration

**Called by:**
- `workflow-engine/worker-dispatcher.md` — issues token when dispatching node to worker
- `execution-security/capability-scope-controller.md` — verifies token before enforcing scope

**Calls:**
- `execution-security/least-privilege-engine.md` — derives permissions for embedding
- `audit-replay/immutable-audit-log.md` — records all issuance and revocation events

**Writes to:** `memory/execution-security/ephemeral-tokens.jsonl`
