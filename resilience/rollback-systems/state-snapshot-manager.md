# State Snapshot Manager
**ID:** RBK-SSM-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Captures, stores, validates, and retrieves point-in-time state snapshots for all resources involved in REVERSIBLE and SCOPED sandbox executions. Every compensation operation depends on a valid pre-action snapshot to reconstruct the previous state. The state snapshot manager ensures snapshots are taken at the correct moment (before any forward action), stored with cryptographic integrity, and remain accessible within their TTL window for undo operations.

---

## Snapshot Schema

```yaml
state_snapshot:
  snapshot_id: SNAP-{NNN}
  
  # Target
  target_resource:
    resource_type: DATABASE_ROW | DATABASE_TABLE_RANGE | FILE | CONFIG_KEY | AGENT_STATE | WORKFLOW_STATE | TRUST_SCORE | OKR_STATE
    resource_id: string                  # fully qualified resource identifier
    scope: {}                            # type-specific scope (table+row_id, file path, etc.)
    
  # Content
  snapshot_content:
    serialization: json_canonical        # canonical JSON for deterministic hash
    content_hash: sha256                 # sha256(canonical_json(content))
    content_encrypted: AES-256           # encrypted at rest; key: snapshot_master_key
    content_size_bytes: number
    
  # Capture context
  captured_at: ISO8601
  captured_by: string                    # agent_id or system
  capture_reason: PRE_ACTION | PERIODIC | MANUAL | INCIDENT_PRESERVATION
  saga_id: SAGA-{NNN} | null
  compensation_id: COMP-{NNN} | null    # which compensation this snapshot serves
  
  # Validity
  expires_at: ISO8601
  ttl_seconds: number
  
  # Integrity chain
  prev_snapshot_id: SNAP-{NNN} | null   # previous snapshot of same resource (for lineage)
  
  # Status
  status: VALID | USED | EXPIRED | CORRUPTED
  last_verified_at: ISO8601
  verification_count: number
```

---

## Capture Protocol

```
capture_snapshot(target_resource, saga_id, compensation_id) → snapshot_id:

  1. Acquire SHARED read lock on target_resource (blocks concurrent writes during capture)
  
  2. Read current state:
     content = read_current_state(target_resource)
     
  3. Serialize to canonical form:
     canonical = json_canonical_serialize(content)  # sorted keys, normalized whitespace
     
  4. Compute content hash:
     content_hash = sha256(canonical)
     
  5. Encrypt content:
     encrypted_content = AES_256_encrypt(canonical, snapshot_master_key)
     
  6. Release read lock
  
  7. Set TTL:
     expires_at = now() + compensation_ttl_for_action_class(saga_id, compensation_id)
     
  8. Write snapshot to storage:
     path = memory/rollback-systems/snapshots/{snapshot_id}.enc
     
  9. Register in snapshot index
  
  10. Return snapshot_id, content_hash

  Capture must complete BEFORE forward action begins.
  If capture fails: BLOCK forward action; log SNAPSHOT_CAPTURE_FAILED; escalate T3.
```

---

## Snapshot Types and Capture Strategies

```yaml
snapshot_capture_strategies:

  DATABASE_ROW:
    strategy: SELECT + serialize to JSON canonical
    scope: {table, primary_key}
    lock: row-level read lock during capture
    content: all column values
    
  DATABASE_TABLE_RANGE:
    strategy: SELECT with WHERE clause + serialize
    scope: {table, filter_predicate}
    lock: range read lock during capture
    content: all matching rows
    max_rows: 10000 (larger ranges require T3 approval)
    
  FILE:
    strategy: read file bytes + sha256 + store
    scope: {absolute_path}
    lock: OS read lock during capture
    content: file bytes (compressed if > 1MB)
    
  CONFIG_KEY:
    strategy: read config value + serialize
    scope: {config_path, key}
    lock: none (config system handles MVCC)
    content: key, value, version
    
  AGENT_STATE:
    strategy: serialize agent state object
    scope: {agent_id, state_type}
    lock: agent state lock
    content: trust_score, behavioral_history_hash, contract_version, autonomy_level
    
  WORKFLOW_STATE:
    strategy: serialize workflow checkpoint
    scope: {workflow_id, checkpoint_id}
    lock: none (checkpoint is immutable once written)
    content: step_statuses, context_hash, assigned_agents
    
  TRUST_SCORE:
    strategy: read directional trust matrix entry
    scope: {from_agent_id, to_agent_id, domain}
    lock: none (MVCC)
    content: score, confidence, history_digest
    
  OKR_STATE:
    strategy: read OKR record at current version
    scope: {okr_id, period}
    lock: none (MVCC)
    content: all KR scores, confidence, owner
```

---

## Snapshot Retrieval and Verification

```
retrieve_snapshot(snapshot_id) → (content, verified):

  1. Load snapshot record from index
  
  2. Check status:
     EXPIRED → return EXPIRED error; undo no longer possible
     CORRUPTED → return CORRUPTED error; escalate T4
     VALID | USED → continue
     
  3. Read encrypted content from storage:
     path = memory/rollback-systems/snapshots/{snapshot_id}.enc
     
  4. Decrypt:
     content = AES_256_decrypt(encrypted_content, snapshot_master_key)
     
  5. Verify integrity:
     computed_hash = sha256(json_canonical_serialize(content))
     if computed_hash != snapshot.content_hash:
       mark snapshot status = CORRUPTED
       log SNAPSHOT_INTEGRITY_FAILURE → T4 immediate
       return CORRUPTED error
       
  6. Update last_verified_at, verification_count
  
  7. Return content (deserialized), verified=true
```

---

## Snapshot Storage Management

```yaml
storage_management:
  location: memory/rollback-systems/snapshots/
  
  hot_storage:
    location: memory/rollback-systems/snapshots/hot/
    contents: all VALID snapshots within TTL
    access_time: < 10ms
    
  expired_archive:
    location: memory/rollback-systems/snapshots/expired/
    contents: USED and EXPIRED snapshots within retention period
    retention: 30 days (for rollback audit and replay)
    compression: gzip
    
  purge_policy:
    VALID snapshots: never purged until TTL expires
    USED snapshots: purge after 30 days
    EXPIRED snapshots: purge after 30 days
    CORRUPTED snapshots: never purged; flagged for investigation
    
  capacity_management:
    alert_at: 80% storage utilization
    action_at: 95% → block new snapshots; alert T4
    
  encryption_key_rotation:
    frequency: quarterly
    rotation: WRAP_AND_REENCRYPT all VALID snapshots with new key
    old_key_retained: 90 days for USED/EXPIRED snapshot decryption
```

---

## Periodic Integrity Sweep

```
daily_integrity_sweep():
  for each VALID snapshot in hot_storage:
    verify: sha256(decrypt(content)) == snapshot.content_hash
    verify: now() < expires_at
    if hash_mismatch: mark CORRUPTED; log; escalate T4
    if expired: mark EXPIRED; move to archive
    
  generate: daily integrity report
  report_to: T3 governance digest
```

---

## Snapshot Dependency Map

The manager tracks which compensation operations depend on which snapshots:

```
get_snapshot_dependencies(compensation_id) → snapshot_dependency_map:
  Returns: {
    snapshot_ids: [SNAP-{NNN}],
    total_size_bytes: number,
    earliest_expiry: ISO8601,
    all_valid: boolean,
    corrupted: [SNAP-{NNN}]
  }
  
Used by rollback-coordinator to: 
  check if rollback is still possible before committing to rollback attempt
```

---

## Integration

```
Feeds into:
  undo-registry.md — snapshot_id stored with each compensation registration
  rollback-dag-engine.md — snapshots loaded during completeness validation
  reversible-execution-system.md — snapshot_id returned at pre-registration time
  compensating-transaction-engine.md — snapshot captured before each saga step

Receives from:
  reversibility-framework.md — determines what state to capture per action type
  sandbox-engine.md — triggered at REVERSIBLE sandbox provisioning
  rollback-coordinator.md — queried for snapshot validity before rollback begins
```

---

## Governance

**Capture timing:** Snapshot MUST be captured and written before any forward action; verified by execution-journal ordering  
**Corruption handling:** Any corrupted snapshot = T4 immediate; block dependent compensation; do not attempt compensation without valid snapshot  
**Encryption:** All snapshots AES-256 encrypted at rest; plaintext never written to disk  
**Audit:** All snapshot lifecycle events (capture, retrieve, verify, expire, corrupt) to `memory/rollback-systems/snapshot-audit.jsonl`
