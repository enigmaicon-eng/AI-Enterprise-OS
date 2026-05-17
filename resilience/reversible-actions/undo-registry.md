# Undo Registry
**ID:** REV-UNR-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Central registry for all pre-registered compensation operations across the Enterprise AI OS. The undo registry is the authoritative catalog of what can be undone, who authorized it, and within what time window the undo remains valid. Every REVERSIBLE sandbox and every SCOPED execution with compensation produces an entry here before a single forward action executes. The registry enforces the pre-registration invariant: undo must be possible before the forward operation is permitted to proceed.

---

## Registry Entry Schema

```yaml
compensation_registry_entry:
  # Identity
  compensation_id: COMP-{NNN}             # globally unique, monotonically increasing
  saga_id: SAGA-{NNN} | null
  sandbox_id: SBOX-{NNN}
  step_id: STEP-{N}                       # saga step this compensation belongs to
  
  # Forward action linkage
  forward_action_id: ACT-{NNN} | null    # set when forward action executes
  forward_operation_type: string
  forward_operation_descriptor: string    # human-readable
  target_resource: string
  
  # Compensation operation
  compensation_operation:
    type: string                          # primitive inverse type
    target: string
    execution_payload: {}                 # computed from pre-action snapshot; encrypted at rest
    execution_payload_hash: sha256        # for integrity verification
    idempotency_key: string              # {compensation_id}-{attempt}
    
  # State snapshot
  snapshot_id: SNAP-{NNN}
  snapshot_integrity_hash: sha256         # must match snapshot at undo time
  
  # Validity
  registered_at: ISO8601
  valid_until: ISO8601                    # compensation TTL; cannot be undone after this
  compensation_ttl_seconds: number
  
  # Reversibility metadata
  reversibility_class: FULLY_REVERSIBLE | PARTIALLY_REVERSIBLE | CONTEXTUALLY_REVERSIBLE
  residual_effects: [string]
  preconditions: [string]                 # checked at undo time
  
  # Authorization
  undo_authority: T2 | T3 | T4
  registered_by: string                   # agent_id
  
  # Status
  status: REGISTERED | ACTIVE | USED | EXPIRED | FAILED | CORRUPTED
  execution_attempts: number
  last_attempt_at: ISO8601 | null
  used_at: ISO8601 | null
  expired_at: ISO8601 | null
  
  # Outcome (if executed)
  undo_result: SUCCESS | PARTIAL | FAILED | null
  undo_authorized_by: string | null
  post_undo_verification: MATCH | MISMATCH | SKIPPED | null
```

---

## Registry Operations

```
register_compensation(compensation_config) → compensation_id:
  1. Assign next COMP-{NNN}
  2. Validate compensation_config:
     - operation_type in compensation-library.md: YES → continue; NO → REJECT
     - pre-action snapshot captured: YES → continue; NO → REJECT
     - forward_operation in reversibility-framework: class not IRREVERSIBLE → continue; NO → REJECT
  3. Encrypt execution_payload (AES-256)
  4. Compute execution_payload_hash
  5. Set status = REGISTERED
  6. Write to registry
  7. Log COMPENSATION_REGISTERED to execution-journal
  8. Return compensation_id

activate_compensation(compensation_id, forward_action_id):
  mark status = ACTIVE
  set forward_action_id (now that forward action has executed)
  log COMPENSATION_ACTIVATED to execution-journal

execute_compensation(compensation_id, authorized_by) → undo_result:
  1. Load registry entry
  2. Validate status == ACTIVE: else REJECT (USED, EXPIRED, etc.)
  3. Validate now() < valid_until: else mark EXPIRED; REJECT
  4. Validate authority: authorized_by meets undo_authority level
  5. Validate preconditions (via reversibility-framework)
  6. Decrypt execution_payload; verify execution_payload_hash
  7. Execute compensation operation
  8. Verify post-undo state matches snapshot
  9. Mark status = USED; set used_at; record undo_result
  10. Log COMPENSATION_EXECUTED to execution-journal
  11. Return undo_result

expire_stale_compensations():
  Runs every 60 seconds:
  for each entry where status == ACTIVE and now() >= valid_until:
    mark status = EXPIRED
    set expired_at = now()
    log COMPENSATION_EXPIRED to execution-journal
    if reversibility_class != FULLY_REVERSIBLE:
      notify: undo_authority level (informational — window closed)
```

---

## Registry Queries

```
get_compensation(compensation_id) → compensation_registry_entry
list_active_compensations(agent_id) → [compensation_registry_entry]
list_compensations_for_saga(saga_id) → [compensation_registry_entry]
get_undo_window_status(compensation_id) → {valid_until, remaining_seconds, status}
list_expiring_soon(within_seconds=300) → [compensation_registry_entry]
  (used to alert operators when important undo windows are closing)
```

---

## Undo Window Dashboard

```
UNDO REGISTRY STATUS
──────────────────────────────────────────────────────────────────
Active Compensations:   {count}
  Expiring in < 5min:   {count}  ← ALERT if > 0 for HIGH/CRITICAL actions
  Expiring in < 1hr:    {count}
  
By Reversibility Class:
  FULLY_REVERSIBLE:         {count}
  PARTIALLY_REVERSIBLE:     {count}
  CONTEXTUALLY_REVERSIBLE:  {count}
  
Recent Activity (last 24h):
  Registered:    {count}
  Activated:     {count}
  Used (undone): {count}
  Expired:       {count}
  Failed:        {count}  ← investigate if > 0

Longest Active Window:  {compensation_id} — {remaining_time} remaining
──────────────────────────────────────────────────────────────────
```

---

## Expiry Alerting

```yaml
expiry_alerts:
  thresholds:
    - within: 300s (5 minutes)
      if: reversibility_class in [PARTIALLY_REVERSIBLE, CONTEXTUALLY_REVERSIBLE]
      action: alert T3 — "Undo window closing soon for {forward_operation_descriptor}"
      
    - within: 3600s (1 hour)
      if: undo_authority == T4
      action: alert T4 — "High-authority compensation expiring in 1 hour"
      
    - on_expiry:
      if: reversibility_class == CONTEXTUALLY_REVERSIBLE and undo_result == null
      action: log CONTEXT_REVERSIBLE_EXPIRED_UNUSED — report for governance review
```

---

## Security

```yaml
security:
  payload_encryption: AES-256 at rest (execution_payload)
  integrity_verification: sha256 hash checked at every read
  
  access_control:
    read_compensation: T2 (own org), T3 (all)
    execute_compensation: undo_authority level per entry (T2 / T3 / T4)
    delete_compensation: NEVER (registry is append-only; status changes only)
    
  audit_log: every operation on every compensation entry logged to:
    memory/reversible-actions/undo-registry-audit.jsonl
    
  tampering_detection:
    payload_hash_mismatch: CRITICAL → T4 immediate; block undo execution
    entry_modification_detected: CRITICAL → chain integrity violation
```

---

## Integration

```
Feeds into:
  compensating-transaction-engine.md — all saga compensations registered here
  rollback-dag-engine.md — queries active compensations to build rollback DAGs
  rollback-coordinator.md — retrieves compensation chain for rollback execution
  reversible-execution-system.md — pre-registration gate checked here

Receives from:
  reversibility-framework.md — classification metadata per compensation
  state-snapshot-manager.md — snapshot_id for each pre-action capture
  sandbox-engine.md — sandbox lifecycle triggers activation and expiry
  compensation-library.md — inverse operation types validated against library
```

---

## Governance

**Pre-registration invariant:** Forward action MUST NOT execute if compensation registration fails; no exceptions  
**Immutability:** Entries are never deleted or modified; only status fields advance; old entries permanently retained  
**Payload security:** Encrypted at rest; hash verified before every execution; mismatch = BLOCK + T4 immediate  
**Retention:** COMP records retained 3 years; FAILED and CORRUPTED entries retained permanently  
**Audit:** `memory/reversible-actions/undo-registry-audit.jsonl` — permanent, append-only
