# Side-Effect Tracker
**ID:** REV-SET-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Real-time capture and cataloging of all external operations produced by agent execution within a sandbox boundary. The side-effect tracker intercepts every write, API call, event publication, and external communication before it reaches live systems, records it with full payload detail, and makes it available for pre-commit review, dry-run preview, and rollback dependency analysis. Every sandboxed execution produces a side-effect ledger; no external change may be committed without passing through this system.

---

## Tracked Operation Types

```yaml
tracked_operations:

  FILE_WRITE:
    captured: path, operation_type (CREATE/UPDATE/DELETE), content_hash, size_bytes
    payload_capture: content_hash only (not raw content — may be large)
    
  DATABASE_WRITE:
    captured: connection_id, table, operation (INSERT/UPDATE/DELETE), row_id, fields_modified, row_count
    payload_capture: diff (before_hash → after_hash, field names only; not raw values if RESTRICTED)
    
  API_CALL:
    captured: connector_id, endpoint, method, request_hash, response_code, response_hash
    payload_capture: request_hash (not raw body for security)
    sensitive_redaction: Authorization headers, credentials, PII fields masked
    
  EVENT_PUBLISH:
    captured: topic, event_type, event_id, payload_hash, target_subscribers_estimated
    payload_capture: payload_hash; full payload stored in encrypted side-effect store
    
  EXTERNAL_COMMUNICATION:
    captured: channel (email/slack/webhook), recipient_count, content_hash, delivery_method
    payload_capture: content_hash; raw content in encrypted store
    sensitivity: ALWAYS HIGH (external comms are irreversible; flag immediately)
    
  CONFIG_MUTATION:
    captured: config_path, key, previous_value_hash, new_value_hash
    payload_capture: both hashes; raw values stored if not RESTRICTED
    
  STATE_MUTATION:
    captured: state_type, resource_id, previous_hash, new_hash, mutated_fields
    payload_capture: field names; values if not RESTRICTED
    
  AGENT_INVOCATION:
    captured: target_agent_id, invocation_type (DELEGATE/ORCHESTRATE/NOTIFY), payload_hash
    
  TRUST_ADJUSTMENT:
    captured: subject_agent_id, delta, new_score, reason_code
```

---

## Side-Effect Record Schema

```yaml
side_effect_record:
  effect_id: SE-{NNN}                      # monotonically increasing per sandbox
  sandbox_id: SBOX-{NNN}
  iee_id: IEE-{NNN}
  saga_id: SAGA-{NNN} | null
  
  # Classification
  operation_type: string                   # from tracked_operations above
  reversibility: FULLY_REVERSIBLE | PARTIALLY_REVERSIBLE | CONTEXTUALLY_REVERSIBLE | IRREVERSIBLE
  sensitivity: STANDARD | ELEVATED | RESTRICTED | TOP_SECRET
  
  # Operation detail
  target_resource: string                  # what was modified
  operation_detail: {}                     # type-specific captured fields (see above)
  captured_at: ISO8601
  execution_order: number                  # sequence within sandbox execution
  
  # State linkage
  snapshot_id: SNAP-{NNN} | null          # pre-action snapshot if REVERSIBLE
  compensation_id: COMP-{NNN} | null      # linked compensation if REVERSIBLE
  
  # Disposition
  status: CAPTURED | COMMITTED | DISCARDED | ROLLED_BACK
  committed_at: ISO8601 | null
  discarded_at: ISO8601 | null
```

---

## Capture Engine

```
capture_side_effect(operation_type, raw_operation, sandbox_id):

  1. Classify operation:
     determine reversibility (via reversibility-framework)
     determine sensitivity (via data classification metadata)
     
  2. Redact sensitive fields:
     mask: Authorization headers, credentials, PII fields tagged RESTRICTED+
     replace with: {REDACTED:sha256_of_original}
     
  3. Build side_effect_record
  
  4. Append to sandbox side-effect buffer (in-memory, fast write)
  
  5. If operation_type == EXTERNAL_COMMUNICATION:
     flag: IRREVERSIBLE_OPERATION_CAPTURED
     immediately alert: sandbox-engine (do not wait for validation phase)
     
  6. If buffer size > 80% of limit:
     alert: sandbox-engine (BUFFER_NEAR_CAPACITY)
     
  7. Return: effect_id, operation_result (SYNTHETIC_OK for captured ops)
```

---

## Side-Effect Ledger

All captured side effects for a sandbox are organized into the side-effect ledger:

```yaml
side_effect_ledger:
  ledger_id: SEL-{NNN}
  sandbox_id: SBOX-{NNN}
  
  summary:
    total_effects: number
    by_type:
      FILE_WRITE: number
      DATABASE_WRITE: number
      API_CALL: number
      EVENT_PUBLISH: number
      EXTERNAL_COMMUNICATION: number
      CONFIG_MUTATION: number
      STATE_MUTATION: number
    irreversible_count: number            # requires special attention at review
    restricted_sensitivity_count: number
    
  effects: [side_effect_record]           # ordered by execution_order
  
  blast_radius_estimate:
    affected_resources: [string]
    affected_systems: [string]
    affected_agents: [string]
    estimated_blast_radius_score: 0.00–1.00
    
  generated_at: ISO8601
  status: PENDING_REVIEW | APPROVED | REJECTED | COMMITTED | DISCARDED
```

---

## Pre-Commit Review Interface

Before any captured side effects are committed to live systems, the ledger is presented for review:

```
SIDE-EFFECT REVIEW: sandbox={SBOX-NNN}
──────────────────────────────────────────────────────────────────────
Total Operations:        {total_effects}
  Reversible:            {reversible_count}
  Partially Reversible:  {partial_count}
  IRREVERSIBLE:          {irreversible_count}  ← requires explicit approval

By System Affected:
  Database (tables):     {tables_list}          ({db_write_count} writes)
  APIs (connectors):     {connectors_list}       ({api_call_count} calls)
  Events (topics):       {topics_list}           ({event_count} publishes)
  Files:                 {files_list}            ({file_count} writes)
  External comms:        {comm_count}            ← IRREVERSIBLE — approve explicitly

Blast Radius Score:      {score}  [{LOW|MEDIUM|HIGH|CRITICAL}]

IRREVERSIBLE OPERATIONS REQUIRING EXPLICIT APPROVAL:
{for each irreversible effect: type, target, description, why_irreversible}

Recommended Action:  {COMMIT | REVIEW_FURTHER | DISCARD}
──────────────────────────────────────────────────────────────────────
[APPROVE ALL] [APPROVE REVERSIBLE ONLY] [DISCARD ALL] [REQUEST CHANGES]
```

---

## Commit and Discard

```
commit_side_effects(sandbox_id, approved_effect_ids):
  for each effect_id in approved_effect_ids:
    load side_effect_record
    route to live system via rollback-coordinator
    mark status = COMMITTED
  
  for each effect_id NOT in approved_effect_ids:
    mark status = DISCARDED
    
  flush side-effect buffer
  write final ledger to `memory/execution-sandbox/side-effect-ledger/{sandbox_id}.json`
  
discard_all_side_effects(sandbox_id):
  mark all effects status = DISCARDED
  wipe buffer securely
  log EFFECTS_DISCARDED to sandbox-log.jsonl
```

---

## Real-Time Anomaly Detection

```yaml
anomaly_detection:
  rules:
    - name: unexpected_external_comm
      trigger: EXTERNAL_COMMUNICATION captured in DRY_RUN or SYNTHETIC sandbox
      action: BLOCK immediately; alert T3; log ANOMALY_EXTERNAL_COMM_IN_SAFE_SANDBOX
      
    - name: scope_expansion
      trigger: operation target not in sandbox.declared_scope
      action: flag for human review; alert T2
      
    - name: high_volume_writes
      trigger: DATABASE_WRITE count > 1000 in single sandbox
      action: alert T3; require explicit review before commit
      
    - name: restricted_data_write
      trigger: DB_WRITE to RESTRICTED table not in declared scope
      action: BLOCK immediately; alert T4
      
    - name: cross_org_write_attempt
      trigger: write target in org_id not in agent's authorized orgs
      action: BLOCK; alert T3; log CROSS_ORG_WRITE_BLOCKED
```

---

## Integration

```
Feeds into:
  sandbox-engine.md — validation phase receives full side-effect ledger
  blast-radius-analyzer.md — uses affected_resources list for blast radius scoring
  rollback-coordinator.md — receives committed effect list for compensation linkage
  execution-journal.md — side effects cross-referenced in journal entries
  dry-run-system.md — side-effect preview in dry-run results

Receives from:
  isolated-execution-environment.md — all intercepted operations routed here
  reversibility-framework.md — reversibility classification per operation
  privilege-containment-engine.md — scope validation for each captured write
```

---

## Governance

**Buffer overflow:** SUSPEND execution before overflow; alert T3; never drop records silently  
**Irreversible effect disclosure:** Always surfaced explicitly before commit; cannot be hidden in approval flow  
**Sensitive field redaction:** Mandatory; plain-text credentials in side-effect log = CRITICAL security event  
**Audit:** All side-effect ledgers retained at `memory/execution-sandbox/side-effect-ledger/` permanently
