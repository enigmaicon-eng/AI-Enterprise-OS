# Memory Corruption Detection
**ID:** MIG-MCD-001 | **Tier:** T3 | **Class:** CRITICAL
**Owner:** Security Org | **Updated:** 2026-05-16

---

## Purpose

Actively detects unauthorized modifications, deletions, insertions, and structural corruption across all enterprise memory stores — from audit trail JSONL files to operational state YAMLs, behavioral baselines, and execution ledgers. Memory corruption detection operates continuously, not reactively: every write is validated before acceptance, every store is verified on schedule, and any anomaly triggers immediate response regardless of apparent business justification.

---

## Corruption Detection Methods

```yaml
detection_methods:

  HASH_CHAIN_VERIFICATION:
    applies_to: all *.jsonl stores with hash-chain structure
    method: |
      For each record r[n]:
        computed_hash = sha256(r[n].content_fields)
        if r[n].entry_hash != computed_hash: BREAK_DETECTED (record modified)
        if r[n].prev_hash != r[n-1].entry_hash: CHAIN_BREAK (chain tampered)
        if r[n-1] is missing: GAP_DETECTED (record deleted)
    frequency: continuous on write; hourly scan of all chains
    
  CONTENT_ADDRESS_VERIFICATION:
    applies_to: knowledge base, governance artifacts, constitution files
    method: |
      content_hash = sha256(file_content)
      compare against content_hash_registry[file_path]
      if mismatch: content has been modified since last authorized update
    frequency: on every read; daily full scan
    
  SCHEMA_INTEGRITY_CHECK:
    applies_to: all YAML state files with defined schemas
    method: |
      validate_schema(current_content, registered_schema)
      check_required_fields_present()
      check_field_types_and_ranges()
      detect_unexpected_fields (possible injection)
    frequency: on every read; weekly full scan
    
  STATISTICAL_BASELINE_CONSISTENCY:
    applies_to: behavioral profile stores, performance baselines, anomaly detection models
    method: |
      For each baseline store:
        compute statistical_fingerprint (mean, std, distribution shape)
        compare against historical_fingerprint (7-day rolling)
        if fingerprint_delta > 2σ without corresponding operational change: ANOMALY
    frequency: daily
    
  SEQUENCE_GAP_DETECTION:
    applies_to: all sequentially-numbered record stores (execution ledger, audit logs)
    method: |
      verify sequence_number continuity (no gaps)
      verify timestamp monotonicity (no time reversals)
      verify record count consistency (count matches expected from write events)
    frequency: hourly
    
  SIGNATURE_VERIFICATION:
    applies_to: T3+ decision records, approval records, constitutional decisions
    method: |
      verify Ed25519 signature on all high-tier records
      check signing key is from authorized key hierarchy (not revoked)
      verify signing timestamp is within valid key epoch
    frequency: on every read + daily batch scan
```

---

## Detection Rules

```yaml
corruption_detection_rules:

  MCD-001:
    name: "JSONL Record Hash Violation"
    condition: |
      record[n].entry_hash != sha256(record[n].content_fields)
    severity: CRITICAL
    auto_action: freeze_store; alert_T3; forensic_snapshot; security_incident
    
  MCD-002:
    name: "Hash Chain Continuity Break"
    condition: |
      record[n].prev_hash != record[n-1].entry_hash
      OR record[n-1] is missing (sequence gap)
    severity: CRITICAL
    auto_action: freeze_store; alert_T3; T4_notification; security_incident
    
  MCD-003:
    name: "Governance Artifact Content Modification"
    condition: |
      sha256(file_content) != content_hash_registry[file_path]
      for any governance artifact file
    severity: CRITICAL
    auto_action: revert_to_registered_hash_content; alert_T3; T4_notification
    
  MCD-004:
    name: "Operational State Schema Violation"
    condition: |
      YAML file FAILS schema_validation
      AND violation_type = UNEXPECTED_FIELD or INVALID_VALUE (not just missing optional field)
    severity: HIGH
    auto_action: quarantine_state_file; revert_to_last_valid_checkpoint; alert_T2
    
  MCD-005:
    name: "Behavioral Baseline Statistical Anomaly"
    condition: |
      baseline_fingerprint_delta > 2σ from rolling_7_day_fingerprint
      WITHOUT corresponding legitimate_source_change_event
    severity: HIGH
    auto_action: freeze_baseline_updates; alert_T3; audit_recent_baseline_contributors
    
  MCD-006:
    name: "Execution Ledger Sequence Gap"
    condition: |
      sequence_gap detected in execution-ledger.jsonl
      OR timestamp reversal detected (record[n].timestamp < record[n-1].timestamp)
    severity: CRITICAL
    auto_action: alert_T3; forensic_analysis; do_NOT_write_new_records_until_gap_explained
    
  MCD-007:
    name: "Signature Verification Failure"
    condition: |
      Ed25519_signature on high-tier record FAILS verification
      OR signing key is REVOKED or EXPIRED at signing_timestamp
    severity: CRITICAL
    auto_action: invalidate_record; alert_T3; T4_notification; investigate_key_compromise
    
  MCD-008:
    name: "Memory Store Unauthorized Access"
    condition: |
      write_event to protected memory store FROM agent_tier < required_tier
      (see memory-integrity-engine.md write_authorization_matrix)
    severity: HIGH (CRITICAL for constitution/ and audit logs)
    auto_action: reject_write; alert_T3; revoke_agent_memory_write_permissions
    
  MCD-009:
    name: "Bulk Record Deletion"
    condition: |
      record_count(store) DECREASES BY > 1 outside of authorized_archival_event
      # Legitimate deletions: archival processes, retention enforcement
      # Illegitimate: someone deleted audit records
    severity: CRITICAL
    auto_action: halt_all_operations_on_store; alert_T3; T4_immediate; forensic_investigation
```

---

## Continuous Write Validation

```
validate_write(write_request):
  # Injected into every memory write operation in the OS

  # Step 1: Authorization check
  if NOT is_authorized_writer(write_request.agent_id, write_request.target_store):
    trigger_MCD_008(write_request)
    Return: REJECTED
    
  # Step 2: Injection scan
  injection_result = prompt_injection_defense.scan(write_request.content)
  if injection_result.status == BLOCKED:
    Return: REJECTED, reason=INJECTION_DETECTED
    
  # Step 3: Schema validation (for YAML stores)
  if write_request.target_store.has_schema:
    if NOT validate_schema(write_request.content, write_request.target_store.schema):
      trigger_MCD_004(write_request)
      Return: REJECTED, reason=SCHEMA_VIOLATION
      
  # Step 4: Hash chain maintenance (for JSONL stores)
  if write_request.target_store.is_hash_chained:
    prev_record = get_last_record(write_request.target_store)
    write_request.content.prev_hash  = prev_record.entry_hash
    write_request.content.entry_hash = sha256(write_request.content.content_fields)
    
  # Step 5: Signature injection (for T3+ records)
  if requires_signature(write_request):
    write_request.content.signature = sign_ed25519(write_request.content, agent_key)
    
  # Step 6: Content hash registration (for governance artifacts)
  if write_request.target_store.is_governance_artifact:
    new_hash = sha256(write_request.content)
    content_hash_registry.update(write_request.target_path, new_hash)
    
  Return: APPROVED, processed_content=write_request.content
```

---

## Integrity Restoration

```
restore_from_corruption(store, corruption_finding):

  # Step 1: Determine restoration strategy
  match corruption_finding.type:
    HASH_CHAIN_BREAK → restore_strategy = REPLAY_FROM_WRITE_AHEAD_LOG
    CONTENT_MODIFIED  → restore_strategy = REVERT_TO_CONTENT_HASH
    RECORD_DELETED    → restore_strategy = RESTORE_FROM_BACKUP
    BASELINE_POISONED → restore_strategy = RESET_TO_STATISTICAL_BASELINE
    
  # Step 2: Freeze store
  freeze_store(store, reason=CORRUPTION_RESTORATION)
  
  # Step 3: Execute restoration
  match restore_strategy:
    REPLAY_FROM_WRITE_AHEAD_LOG:
      wal_records = get_wal_records(store, since=find_last_clean_record(store))
      replay_verified_records(store, wal_records)
      
    REVERT_TO_CONTENT_HASH:
      clean_content = content_addressed_store.get(store.expected_hash)
      write_verified_content(store, clean_content)
      
    RESTORE_FROM_BACKUP:
      snapshot = find_last_verified_snapshot(store)
      restore_snapshot(store, snapshot)
      replay_wal_since(store, snapshot.timestamp)
      
    RESET_TO_STATISTICAL_BASELINE:
      baseline = load_historical_baseline(store, date=find_last_uncontaminated_baseline(store))
      restore_baseline(store, baseline)
      
  # Step 4: Verify restoration
  post_restore_check = verify_store_integrity(store)
  if NOT post_restore_check.passed:
    alert_T4("Restoration failed — manual intervention required")
    Return: RESTORATION_FAILED
    
  # Step 5: Unfreeze and resume
  unfreeze_store(store)
  log_restoration(store, corruption_finding, restore_strategy)
  Return: RESTORATION_COMPLETE
```

---

## Integration

```
Feeds into:
  memory-integrity-engine.md — primary detection results
  adversarial-defense-engine.md — CLASS_3 memory corruption
  cognition-security/memory-poisoning-defense.md — specific poisoning analysis
  security-operations/security-alert-manager.md — corruption alerts

Receives from:
  All memory store write events (via write validation hook)
  memory-integrity-engine.md — scheduled scan triggers
  backup-protocol.md — backup availability for restoration
```

---

## Governance

**Write validation is non-bypassable:** The write validation hook runs at the storage layer, not the application layer; no agent can write to protected stores without passing validation  
**Corrupted stores are never written to:** Once a store is frozen due to corruption, zero new writes are accepted until restoration is complete and verified; no "best effort" continuation  
**MCD-009 (bulk deletion) is always T4:** Any detection of record deletion from audit logs escalates to T4 within 5 minutes; there is no lower-tier handling path  
**Audit:** All corruption detection events to `memory/memory-integrity/corruption-audit.jsonl`; permanent retention
