# Execution Journal
**ID:** REV-EXJ-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Engineering Org | **Updated:** 2026-05-16

---

## Purpose

Append-only, event-sourced log of every operation executed by agents within the Enterprise AI OS. The execution journal is the system of record for what happened, when, by whom, and with what outcome. It enables deterministic replay, root-cause investigation, compensation chain reconstruction, and regulatory audit. Every forward action, compensation, rollback, and sandbox lifecycle event is recorded here before the operation is considered complete.

**Core guarantee:** An operation that is not in the execution journal did not happen from the perspective of the OS governance layer.

---

## Journal Entry Schema

```yaml
journal_entry:
  # Identity
  entry_id: JRN-{NNN}                      # globally unique, monotonically increasing, no gaps
  prev_entry_hash: sha256                  # hash of previous entry (hash chain integrity)
  entry_hash: sha256                       # sha256(prev_entry_hash + entry content)
  
  # Context
  sandbox_id: SBOX-{NNN} | null
  saga_id: SAGA-{NNN} | null
  workflow_id: string | null
  agent_id: string
  session_id: string
  
  # Operation
  entry_type: FORWARD_ACTION | COMPENSATION | ROLLBACK | SANDBOX_EVENT | GOVERNANCE_EVENT | SYSTEM_EVENT
  operation_type: string                   # specific operation (DB_WRITE, API_CALL, etc.)
  operation_descriptor: string            # human-readable description
  
  # Target
  target_resource: string
  target_system: string
  
  # Payload reference (not raw payload — reference to encrypted store)
  payload_hash: sha256
  payload_store_ref: string               # path in encrypted payload store
  
  # Outcome
  status: STARTED | COMPLETED | FAILED | COMPENSATED | ROLLED_BACK
  error_code: string | null
  error_message: string | null
  
  # Timing
  recorded_at: ISO8601
  operation_started_at: ISO8601
  operation_completed_at: ISO8601 | null
  duration_ms: number | null
  
  # Linkage
  effect_ids: [string]                    # linked side-effect records
  snapshot_id: string | null              # pre-action snapshot reference
  compensation_id: string | null          # compensation registered for this action
  rollback_of: string | null              # entry_id this entry compensates (for COMPENSATION entries)
  
  # Governance
  authorization_basis: PRE_AUTHORIZED | CONTRACT_SCOPE | ESCALATED | T3_OVERRIDE | T4_OVERRIDE
  authorized_by: string                   # agent_id or human_id
  constitutional_check: PASSED | NOT_REQUIRED
  explanation_id: string | null           # link to explanation-first record
```

---

## Hash Chain Integrity

The journal uses a Ed25519-signed hash chain — every entry commits to all prior entries:

```
entry_hash = sha256(
  prev_entry_hash +
  entry_id +
  entry_type +
  operation_type +
  target_resource +
  payload_hash +
  status +
  recorded_at +
  agent_id
)

entry_signature = Ed25519.sign(entry_hash, journal_signing_key)
```

Chain validation:
```
validate_chain(from_entry_id, to_entry_id):
  for each entry in range:
    assert entry.entry_hash == sha256(prev_entry_hash + entry_fields)
    assert Ed25519.verify(entry.entry_signature, entry.entry_hash, public_key)
    if any assertion fails:
      CHAIN_INTEGRITY_VIOLATION → T4 immediate; read-only mode; audit investigation
```

---

## Journal Write Protocol

```
append_journal_entry(entry_data) → entry_id:
  1. Assign next JRN-{NNN} (atomic increment, no gaps)
  2. Compute entry_hash from prev_entry_hash + content
  3. Sign with journal signing key (Ed25519)
  4. Append to JSONL journal file (atomic append — O_APPEND flag)
  5. Update in-memory index (entry_id → file offset)
  6. Return entry_id
  
  Write must complete before the operation is acknowledged to the caller.
  If write fails: operation is treated as NOT EXECUTED; agent receives error.
  Never acknowledge an operation before the journal entry is written.
```

---

## Journal File Management

```yaml
journal_file_management:
  file_path: memory/execution-journal/journal-{YYYY-MM-DD}.jsonl
  rotation: daily at 00:00 UTC
  
  segments:
    hot: current day (memory/execution-journal/journal-{today}.jsonl)
    warm: last 30 days (memory/execution-journal/journal-{date}.jsonl)
    cold: 31+ days (memory/execution-journal/archive/{YYYY-MM}/)
    
  compression: gzip on rotation to cold
  encryption: AES-256 for cold archive
  hash_chain: preserved across segment boundaries
    → last entry hash of segment N = prev_entry_hash of first entry in segment N+1
    
  retention:
    hot + warm: 30 days plain JSONL
    cold: 7 years compressed + encrypted
    constitutional incidents: permanent (never deleted)
    
  integrity_check: daily sweep of prior day segment; full chain validation
```

---

## Replay Engine

```
replay_journal(from_entry_id, to_entry_id, replay_mode):

  modes:
    AUDIT: read-only traversal; produces operation timeline report
    SIMULATE: re-execute all operations in DRY_RUN sandbox; compare outcomes
    RECONSTRUCT: rebuild system state at a given point in time from journal
    
  replay_execution(from, to, SIMULATE):
    1. Validate hash chain integrity (from → to)
    2. Provision DRY_RUN sandbox for replay
    3. For each FORWARD_ACTION entry in range:
       re-execute operation in sandbox
       compare captured side effects with journal record
       flag any divergence: REPLAY_DIVERGENCE → investigation required
    4. Report: CONSISTENT | DIVERGENT | PARTIAL_DIVERGENCE
    
  replay_use_cases:
    - Root-cause analysis of failed saga
    - Validate compensation completeness post-rollback
    - Regulatory audit of specific workflow execution
    - Incident reconstruction after security event
```

---

## Query Interface

```
query_journal(filters) → [journal_entry]:
  filters:
    agent_id: string
    workflow_id: string
    sandbox_id: string
    saga_id: string
    entry_type: string
    date_range: {from: ISO8601, to: ISO8601}
    status: string
    constitutional_check: PASSED | NOT_REQUIRED
    
  performance:
    hot segment: < 50ms (in-memory index)
    warm segment: < 500ms (file scan with offset index)
    cold segment: < 5s (decompress then scan)
    
  authorization:
    T1: own agent's entries only
    T2: org-level entries
    T3: all entries
    T4: all entries + hash chain validation
```

---

## Key Journal Events

```yaml
mandatory_journal_events:
  - FORWARD_ACTION (any sandboxed operation)
  - COMPENSATION_REGISTERED (before forward action)
  - COMPENSATION_EXECUTED (when undo runs)
  - ROLLBACK_INITIATED
  - ROLLBACK_COMPLETED | ROLLBACK_PARTIAL | ROLLBACK_FAILED
  - SANDBOX_COMMITTED
  - SANDBOX_DISCARDED
  - SANDBOX_EXPIRED
  - CONSTITUTIONAL_CHECK_PASSED
  - CONSTITUTIONAL_VIOLATION_DETECTED → permanent retention
  - GOVERNANCE_ESCALATION
  - HUMAN_OVERRIDE_APPLIED
  - SAGA_COMPLETED
  - SAGA_COMPENSATED
  - SAGA_FAILED
```

---

## Integration

```
Feeds into:
  rollback-audit-trail.md — rollback events cross-referenced here
  blast-radius-analyzer.md — journal provides the authoritative operation history
  governance dashboards — execution timeline and compliance reporting

Receives from:
  compensating-transaction-engine.md — all saga steps logged here
  side-effect-tracker.md — side-effect IDs cross-referenced
  sandbox-engine.md — sandbox lifecycle events logged here
  rollback-coordinator.md — rollback events logged here
  reversible-execution-system.md — all reversible operations logged here
```

---

## Governance

**Append-only:** No entry is ever modified or deleted (except by court order with T5 + external audit); tampering = CRITICAL security event  
**Hash chain:** Continuous integrity; daily validation; any break triggers read-only mode + T4 immediate  
**Journal write priority:** Writes to journal take priority over operation acknowledgment; never acknowledge before write completes  
**Audit:** The journal IS the audit system; all other audit trails link back to JRN-{NNN} entries
