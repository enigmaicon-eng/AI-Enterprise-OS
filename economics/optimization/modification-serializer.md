# Modification Serializer
**ID:** OPT-SER-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Serializes concurrent modification requests to shared state files, preventing race conditions, lost updates, and data corruption that arise when multiple agents write to the same knowledge base entries, YAML state files, or configuration documents simultaneously. At 144-agent scale, concurrent write conflicts are a real risk without explicit serialization.

---

## Problem Statement

Without serialization, concurrent modifications cause:

```
Agent A reads okr-state.yaml at T=0: OKR-001 status = ON_TRACK
Agent B reads okr-state.yaml at T=0: OKR-001 status = ON_TRACK
Agent A writes: OKR-001 status = AT_RISK at T=1
Agent B writes: OKR-001 status = ON_TRACK at T=2 (overwrites A's update — lost)

Final state: ON_TRACK (incorrect — Agent A's update lost)
```

This is a last-write-wins corruption. The serializer prevents this.

---

## Lock Architecture

```yaml
lock_record:
  lock_id: LOCK-{NNN}
  resource_id: string                    # file path or resource identifier
  resource_type: YAML_STATE | JSONL_SEGMENT | KNOWLEDGE_UNIT | AGENT_DEFINITION
  
  held_by: agent_id
  acquired_at: ISO8601
  expires_at: ISO8601                    # auto-expire prevents deadlock
  
  lock_type: EXCLUSIVE | SHARED
  # EXCLUSIVE: one writer; blocks all readers and writers
  # SHARED: multiple readers; blocks writers
  
  operation_context: string             # why this lock was acquired
  
  status: HELD | RELEASED | EXPIRED | FORCE_RELEASED
```

---

## Lock Policies by Resource Type

| Resource Type | Lock Type | Max TTL | Queue Behavior |
|--------------|-----------|---------|---------------|
| YAML_STATE (active) | EXCLUSIVE | 30 seconds | Queue up to 10 waiters |
| YAML_STATE (archived) | SHARED for reads | 60 seconds | No queue needed |
| KNOWLEDGE_UNIT | EXCLUSIVE | 15 seconds | Queue up to 5 waiters |
| AGENT_DEFINITION | EXCLUSIVE | 60 seconds | Queue up to 3 waiters |
| CONSTITUTIONAL_DOC | EXCLUSIVE | 120 seconds | No queue — T4 authorization required |
| JSONL_SEGMENT (active) | APPEND_ONLY | No lock needed | Append is atomic |
| JSONL_SEGMENT (archived) | Read-only | No lock needed | Reads don't conflict |

**Constitutional documents require explicit T4 authorization before lock is even issued.**

---

## Serialization Protocol

```
acquire_lock(resource_id, lock_type, operation_context):

  1. Check current lock status
     - If HELD by same agent and same lock_type: extend TTL (reentrancy)
     - If HELD by different agent:
       a. If EXCLUSIVE and requesting EXCLUSIVE: add to wait queue
       b. If EXCLUSIVE and requesting SHARED: add to wait queue
       c. If SHARED and requesting SHARED: grant immediately (read-read OK)
       d. If SHARED and requesting EXCLUSIVE: add to wait queue
     - If not held: grant immediately
     
  2. Queue management
     - FIFO ordering (fairness)
     - Max wait time: 10 seconds before LOCK_TIMEOUT error returned
     - LOCK_TIMEOUT: caller decides whether to retry or abort
     
  3. Grant lock
     - Record in lock_registry
     - Set expiry at acquired_at + max_ttl
     - Return lock_token (required for release)

release_lock(lock_token):
  1. Verify lock_token matches held lock
  2. Release lock
  3. Notify next waiter in queue (if any)
  4. Log release event

auto_expire():
  Every 5 seconds: scan lock_registry for expired locks
  If expired:
    - Release lock (record as EXPIRED)
    - T3 alert if EXCLUSIVE lock expired (may indicate agent failure during write)
    - Notify queue
    - If write was in progress: mark resource as POTENTIALLY_DIRTY for integrity check
```

---

## Write-Read Consistency

For critical state files, enforce read-your-own-writes consistency:

```
Consistency levels available:
  EVENTUAL: read may not reflect very recent writes (< 5s lag) — default for reporting
  MONOTONIC: each read reflects at least as recent state as last read — for sequential workflows
  STRONG: read reflects all committed writes — required for constitutional decisions
  
Strong consistency implementation:
  - Before read: acquire SHARED lock
  - Verify no pending EXCLUSIVE lock exists
  - Read; release lock
  - This ensures reader sees the most recent committed state
```

---

## Deadlock Prevention

The serializer uses timeout-based deadlock prevention (not deadlock detection):

```
Rules to prevent deadlock:
  1. Maximum TTL on all locks (expiry prevents infinite hold)
  2. Lock acquisition order: always acquire locks in resource_id alphabetical order
     when multiple locks needed (prevents circular dependency)
  3. Never hold Lock A while waiting for Lock B for more than 5 seconds
     → Release Lock A; retry both from scratch
  4. Lock queue: max 10 waiters (beyond this: return LOCK_QUEUE_FULL)
```

---

## Monitoring

```yaml
serializer_health:
  active_locks: number                   # should be low relative to agent count
  queue_depth_max: number                # target: < 5
  timeout_rate_1h: number                # target: < 0.01 (1% of attempts)
  expired_locks_24h: number              # target: 0 (any expiry = investigate)
  force_released_locks_24h: number       # target: 0
  
  hottest_resources:                     # resources with most contention
    - resource_id: string
      lock_requests_per_hour: number
      avg_wait_ms: number
```

Alert if: timeout_rate > 0.05, expired_locks > 0, any CONSTITUTIONAL_DOC lock expires.

---

## Governance

**Lock registry:** In-memory with 30s checkpoint to `memory/runtime/lock-registry-checkpoint.bin`
**Audit:** All EXCLUSIVE lock events on CONSTITUTIONAL_DOC and AGENT_DEFINITION logged to `memory/runtime/lock-audit.jsonl`
**Force release authority:** T3 for standard resources; T4 for constitutional documents
**Deadlock incidents:** Any deadlock (timeout cascade) requires Architecture Org post-mortem
