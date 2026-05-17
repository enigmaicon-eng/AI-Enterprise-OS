# Distributed Coordinator

**System ID:** `distributed-coordinator`
**Role:** Provides distributed coordination primitives — leader election, distributed locks, consensus decisions, and fencing tokens — ensuring only one worker executes a critical section at a time across the distributed worker pool
**Storage:** `memory/distributed-execution/coordinator-state.yaml` + `memory/distributed-execution/lock-log.jsonl`

---

## Purpose

Distributed systems fail in subtle ways when multiple workers assume they are the leader simultaneously (split-brain), or when a lock holder crashes and the lock is never released. The distributed coordinator provides the primitives that prevent these failure modes: fenced locks that self-expire, leader election with epoch numbers, and consensus decisions that only proceed when a quorum agrees.

---

## Distributed Lock

```
FENCED LOCK PROTOCOL:

acquire_lock(lock_name, holder_id, ttl_seconds) → LockToken | null:
  
  # Atomic compare-and-swap on coordinator state
  existing = coordinator_state.get_lock(lock_name)
  
  IF existing IS NOT NULL:
    IF existing.holder_id == holder_id:
      # Re-entrant: same holder extends TTL
      existing.expires_at = now() + ttl_seconds
      existing.fence_token += 1   # Increment on each renewal
      coordinator_state.update_lock(existing)
      RETURN existing.to_token()
    
    IF now() < existing.expires_at:
      RETURN null  # Lock held by another; acquisition fails
    
    # Lock expired — treat as released, proceed
  
  lock = Lock(
    lock_name = lock_name,
    holder_id = holder_id,
    acquired_at = now(),
    expires_at = now() + ttl_seconds,
    fence_token = generate_monotonic_token()  # Strictly increasing across all lock grants
  )
  coordinator_state.set_lock(lock)
  append_log("LOCK_ACQUIRED", lock_name, holder_id, fence_token)
  
  RETURN LockToken(lock_name, holder_id, fence_token, expires_at)

release_lock(lock_name, holder_id, fence_token):
  lock = coordinator_state.get_lock(lock_name)
  
  IF lock IS NULL OR lock.fence_token != fence_token:
    # Lock was already released and re-acquired by someone else
    # This release is stale — ignore it
    RETURN {status: "STALE_RELEASE"}
  
  coordinator_state.delete_lock(lock_name)
  append_log("LOCK_RELEASED", lock_name, holder_id)
  RETURN {status: "RELEASED"}
```

### Fencing Tokens

```
FENCING TOKEN USAGE:

External systems reject writes with a lower fence token than they've seen:

  storage_write(key, value, fence_token):
    IF fence_token <= storage.last_seen_fence_token[key]:
      REJECT  # Stale writer — a newer lock holder has already written
    storage.write(key, value)
    storage.last_seen_fence_token[key] = fence_token

PREVENTS SPLIT-BRAIN:
  Worker A holds lock, fence_token=42
  Worker A pauses (GC, slow network)
  Lock expires; Worker B acquires lock, fence_token=43
  Worker A resumes, tries to write with fence_token=42
  → Storage rejects (42 < 43) — A's write is blocked
  → Worker B's writes proceed safely
```

---

## Leader Election

```
LEADER ELECTION PROTOCOL:

Candidates:
  Each eligible worker attempts to acquire a well-known lock:
    lock_name = "leader:[role-name]"
    ttl_seconds = election_lease_seconds  # e.g., 30 seconds

  First candidate to acquire lock becomes leader.
  Leader renews lock every (ttl/2) seconds.

Leader failure detection:
  IF lock expires (leader stopped renewing):
    All candidates immediately attempt acquire_lock
    New leader = first to succeed (no coordination needed)

Leader responsibilities:
  Only leader executes singleton operations:
  - Scheduling tick (workflow-scheduler.md cron loop)
  - Scaling evaluation (execution-scaling.md reactive loop)
  - Failure detector main loop

EPOCH NUMBER:
  fence_token serves as epoch number
  Higher epoch = more recent leadership term
  Any message tagged with a lower epoch is from a previous leader → ignore

LEADER STATE:
  coordinator_state.leaders:
    [role-name]:
      leader_id: string
      fence_token: integer
      elected_at: datetime
      lease_expires_at: datetime
```

---

## Consensus Protocol (Lightweight)

For decisions requiring agreement across multiple workers (not just a single leader):

```
CONSENSUS USE CASES:
  - Deciding which worker handles a re-dispatched orphaned task
  - Coordinating a global pause (e.g., for emergency scale-down)
  - Agreeing on a snapshot boundary in distributed durable execution

SIMPLE MAJORITY PROTOCOL:

propose_consensus(topic, value, proposer_id, quorum_size):
  
  # Phase 1: Prepare
  proposal = {
    proposal_id: generate_uuid(),
    topic: topic,
    value: value,
    proposer: proposer_id,
    created_at: now(),
    responses: {}
  }
  coordinator_state.add_proposal(proposal)
  
  # Broadcast to all workers (or relevant subset)
  broadcast("CONSENSUS_PREPARE", proposal.proposal_id, value)
  
  # Collect promises (workers reply with PROMISE or REJECT)
  await_responses(proposal.proposal_id, timeout=5, quorum=quorum_size)
  
  # Phase 2: Commit if quorum reached
  promises = [r for r in proposal.responses WHERE r.type == "PROMISE"]
  
  IF len(promises) >= quorum_size:
    broadcast("CONSENSUS_COMMIT", proposal.proposal_id)
    coordinator_state.record_decision(topic, value, proposal.proposal_id)
    RETURN {decided: True, value: value}
  ELSE:
    RETURN {decided: False, reason: "NO_QUORUM"}
```

---

## Lock TTL Management

```
LOCK TTL WATCHDOG (runs every 5 seconds):
  
  FOR each lock in coordinator_state.locks WHERE lock.expires_at <= now():
    append_log("LOCK_EXPIRED", lock.lock_name, lock.holder_id)
    coordinator_state.delete_lock(lock.lock_name)
    
    # Notify waiting acquirers
    lock_signal.notify(lock.lock_name)

LOCK RENEWAL (by lock holder, every ttl/2 seconds):
  renew_lock(lock_name, holder_id, fence_token, new_ttl_seconds):
    lock = coordinator_state.get_lock(lock_name)
    IF lock.holder_id == holder_id AND lock.fence_token == fence_token:
      lock.expires_at = now() + new_ttl_seconds
      coordinator_state.update_lock(lock)
      RETURN {renewed: True}
    ELSE:
      RETURN {renewed: False, reason: "LOCK_LOST"}  # Lock expired and re-acquired
```

---

## Coordinator State Schema

```yaml
CoordinatorState:
  last_updated: datetime
  
  locks:
    [lock_name]:
      lock_name: string
      holder_id: string
      acquired_at: datetime
      expires_at: datetime
      fence_token: integer
      renewal_count: integer
  
  leaders:
    [role_name]:
      leader_id: string
      fence_token: integer
      elected_at: datetime
      lease_expires_at: datetime
  
  consensus_log:
    - proposal_id: string
      topic: string
      value: any
      decided: boolean
      decided_at: datetime | null
      quorum_reached: boolean
```

---

## Integration

**Called by:**
- `distributed-execution/worker-orchestration.md` — leader election for singleton roles
- `execution-runtime/durable-execution.md` — distributed locks for exactly-once guarantees
- `execution-runtime/execution-scaling.md` — leader election for scaling coordinator role
- `distributed-execution/work-stealing.md` — coordination when multiple workers race on same deque

**Reads from / Writes to:**
- `memory/distributed-execution/coordinator-state.yaml` — lock and leader state
- `memory/distributed-execution/lock-log.jsonl` — audit trail for all lock operations
