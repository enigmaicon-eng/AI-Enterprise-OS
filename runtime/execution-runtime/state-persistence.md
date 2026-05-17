# State Persistence

**System ID:** `state-persistence`
**Role:** Provides durable, consistent state storage for all execution runtime components — implements write-ahead logging, atomic state transitions, read-your-writes consistency, and crash recovery for all mutable runtime state
**Storage:** `memory/execution-runtime/wal.jsonl` + `memory/execution-runtime/state-store/[entity-type]/[entity-id].yaml`

---

## Purpose

Distributed execution produces state that must survive crashes, network failures, and process restarts. The state persistence layer provides a single, consistent interface for reading and writing runtime state — hiding the complexity of write-ahead logging, fsync ordering, and atomic updates behind a clean transactional model.

**Guarantee:** A write that returns SUCCESS has been durably committed. A read always reflects the last successful write (no stale reads within the same process).

---

## Write-Ahead Log (WAL)

All state mutations are written to the WAL before the in-memory state is updated:

```
WAL Entry format:
{
  wal_seq: integer,              # Monotonically increasing sequence number
  timestamp: datetime,
  operation: "UPSERT | DELETE | TRANSITION",
  entity_type: string,           # "execution_instance | dag_node | task | timer | ..."
  entity_id: string,
  old_value: any | null,         # Previous state (for rollback)
  new_value: any | null,         # New state
  checksum: string               # sha256(wal_seq + entity_id + new_value)
}

WAL WRITE PROTOCOL:
  1. Serialize new state
  2. Compute checksum
  3. Append WAL entry (fsync to disk)
  4. Update in-memory state
  5. Update on-disk state file (async, best-effort)
  
  IF process crashes between steps 3 and 5:
    On restart: WAL is replayed → on-disk state brought to consistency
```

---

## State Transition Protocol

State transitions are the most critical writes — they must be atomic:

```
transition(entity_id, entity_type, from_state, to_state, metadata):
  
  # Optimistic concurrency control
  current = load(entity_id)
  
  IF current.state != from_state:
    RAISE StateTransitionConflict(
      expected=from_state,
      actual=current.state,
      entity_id=entity_id
    )
    # Caller must reload and retry if appropriate
  
  # Build new state
  updated = current.copy()
  updated.state = to_state
  updated.state_entered_at = now()
  updated.update(**metadata)
  updated.version = current.version + 1  # Optimistic version counter
  
  # Write WAL (durable first)
  wal_entry = write_wal(
    operation = "TRANSITION",
    entity_id = entity_id,
    old_value = current,
    new_value = updated
  )
  
  # Update state store
  write_state(entity_id, updated)
  
  RETURN updated
```

---

## State Store Layout

```
memory/execution-runtime/state-store/
├── execution-instances/
│   └── [run-id].yaml              ← One file per execution instance
├── dag-nodes/
│   └── [run-id]/
│       └── [node-id].yaml         ← One file per DAG node per run
├── tasks/
│   └── [task-id].yaml             ← Task dispatch and result state
├── timers/
│   └── [timer-id].yaml            ← Durable timer registrations
├── signals/
│   └── [run-id]-[signal-name].yaml ← Pending signals awaiting delivery
└── affinity-groups/
    └── [group-id].yaml            ← Worker affinity group state
```

---

## Consistency Model

```
WITHIN A SINGLE PROCESS:
  Read-your-writes: A write to entity X is immediately visible to reads of X
  Monotonic reads: Once a state version N is read, version < N is never returned

ACROSS PROCESSES (distributed):
  Eventual consistency: Writes propagate to other processes via WAL replay
  Read-after-write: Not guaranteed across processes unless using distributed lock
  
  FOR CRITICAL CROSS-PROCESS READS (e.g., leader election, task claim):
    Use distributed-coordinator.md for linearizable reads
```

---

## Crash Recovery Protocol

```
ON PROCESS RESTART:

  PHASE 01: WAL Analysis
    last_committed_wal_seq = MAX(wal_entry.wal_seq WHERE wal_entry.fsync_confirmed)
    
    in_progress_entries = [e for e in WAL WHERE e.wal_seq > last_committed_wal_seq]
    
    FOR each in_progress_entry:
      IF entry has matching COMMITTED record:
        Apply entry (it was committed but state file not updated)
      ELSE:
        Discard entry (it was not fully committed — write never succeeded)
  
  PHASE 02: State File Reconciliation
    FOR each entity in state-store/:
      wal_version = latest WAL entry for entity_id
      file_version = version in .yaml file
      
      IF wal_version.version > file_version.version:
        Overwrite file with WAL version (WAL is authoritative)
  
  PHASE 03: In-Progress Run Assessment
    FOR each execution-instance WHERE state in [RUNNING, DISPATCHED, RESUMING]:
      Mark as INTERRUPTED
      Route to runtime-recovery/recovery-orchestrator.md for triage
  
  PHASE 04: Resume
    Resume normal operation; WAL log rotated (old entries archived)
```

---

## Compaction and Archival

```
WAL COMPACTION (runs daily):
  
  # All entries older than compaction_window AND whose entity has a
  # confirmed stable state (COMPLETED, FAILED, CANCELLED) can be removed
  
  FOR each wal_entry WHERE entry.timestamp < (now() - compaction_window_days):
    entity = load(wal_entry.entity_id)
    IF entity.state in TERMINAL_STATES:
      archive_wal_entries(wal_entry)  # Move to cold storage
      # State file is the authoritative record after archival

STATE FILE ARCHIVAL:
  COMPLETED/FAILED runs → move to memory/execution-runtime/archive/ after 30 days
  Archived state files: immutable, checksummed, available for audit
```

---

## Integration

**Called by:**
- `execution-runtime/runtime-engine.md` — all instance state transitions
- `execution-runtime/durable-execution.md` — journal and snapshot writes
- `workflow-engine/dag-engine.md` — node state transitions
- `distributed-execution/task-queue.md` — task state persistence

**Reads from:** `memory/execution-runtime/wal.jsonl` (for recovery)

**Writes to:**
- `memory/execution-runtime/wal.jsonl` — write-ahead log
- `memory/execution-runtime/state-store/[entity-type]/[entity-id].yaml` — entity state files
