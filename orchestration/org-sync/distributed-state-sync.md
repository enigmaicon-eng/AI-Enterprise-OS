# Distributed State Sync

**Component:** organizational-synchronization/distributed-state-sync  
**Role:** CRDT-based shared state convergence across concurrent organizational operations  
**Source Primitives:** ruflo (full CRDT suite: G-Counter, OR-Set, LWW-Register, RGA, DeltaStateCRDT, CausalTracker, CRDTComposer)

---

## Overview

When multiple organizations operate concurrently on the same workflow, they update shared state independently. Without conflict-free synchronization, concurrent updates corrupt shared state — one org's gate-pass overwrites another's, risk register entries are lost, artifact references disappear.

Distributed State Sync uses Conflict-Free Replicated Data Types (CRDTs) adapted from ruflo's production CRDT synchronizer to ensure all shared state converges correctly regardless of operation order.

---

## CRDT Type Assignments

Each shared state category uses the appropriate CRDT type:

| Shared State | CRDT Type | Reason |
|-------------|-----------|--------|
| Gates passed set | OR-Set | Monotonically growing; agents only add, never remove |
| Turn count in debates | G-Counter | Increments only; each org has its own counter |
| Active decisions | LWW-Register | Last decision wins with timestamp+agent_id tiebreak |
| Artifact references list | RGA | Ordered list; insertions at arbitrary positions |
| Risk register entries | OR-Set | Entries only added, tombstoned when resolved |
| Agent chain (who touched state) | OR-Set | Monotonically growing record |
| Current workflow status | LWW-Register | Status is last-write-wins |
| Compliance flags | OR-Set | Once raised, flags persist until explicitly cleared |

---

## G-Counter: Debate Turn Counting

```python
class GCounter:
    """
    Monotonically increasing counter — increment only, never decrement.
    From ruflo G-Counter: merge=max per node.
    Use for: debate round count, task completion count, gate evaluation count.
    """
    
    def __init__(self, node_id: str):
        self.counts = {node_id: 0}
        self.node_id = node_id
    
    def increment(self, by: int = 1):
        self.counts[self.node_id] = self.counts.get(self.node_id, 0) + by
    
    def value(self) -> int:
        return sum(self.counts.values())
    
    def merge(self, remote: "GCounter") -> "GCounter":
        """Merge: take max of each node's count."""
        result = GCounter(self.node_id)
        all_nodes = set(self.counts) | set(remote.counts)
        result.counts = {
            n: max(self.counts.get(n, 0), remote.counts.get(n, 0))
            for n in all_nodes
        }
        return result
    
    def to_dict(self) -> dict:
        return {"type": "g_counter", "counts": dict(self.counts)}
    
    @classmethod
    def from_dict(cls, data: dict, node_id: str) -> "GCounter":
        g = cls(node_id)
        g.counts = data["counts"]
        return g
```

---

## OR-Set: Gate Tracking

```python
class ORSet:
    """
    Observed-Remove Set: add is permanent, remove uses tombstones.
    From ruflo OR-Set: unique tag per add, tombstone for remove.
    Use for: gates_passed, artifacts, risk_flags, agent_chain.
    """
    
    def __init__(self):
        self.elements: dict[str, set[str]] = {}   # element → {unique_tags}
        self.tombstones: dict[str, set[str]] = {}
    
    def add(self, element: str) -> str:
        """Add element with a unique tag to prevent remove/add race."""
        tag = str(uuid4())
        if element not in self.elements:
            self.elements[element] = set()
        self.elements[element].add(tag)
        return tag
    
    def remove(self, element: str):
        """Remove by tombstoning all current tags for this element."""
        if element in self.elements:
            if element not in self.tombstones:
                self.tombstones[element] = set()
            self.tombstones[element].update(self.elements[element])
    
    def contains(self, element: str) -> bool:
        tags   = self.elements.get(element, set())
        stones = self.tombstones.get(element, set())
        return bool(tags - stones)   # element present if any non-tombstoned tag
    
    def elements_list(self) -> list[str]:
        return [e for e in self.elements if self.contains(e)]
    
    def merge(self, remote: "ORSet") -> "ORSet":
        """Merge: union of elements and tombstones."""
        result = ORSet()
        all_elements = set(self.elements) | set(remote.elements)
        for e in all_elements:
            result.elements[e] = self.elements.get(e, set()) | remote.elements.get(e, set())
        all_tombstones = set(self.tombstones) | set(remote.tombstones)
        for e in all_tombstones:
            result.tombstones[e] = self.tombstones.get(e, set()) | remote.tombstones.get(e, set())
        return result
```

---

## LWW-Register: Active Decisions and Status

```python
class LWWRegister:
    """
    Last-Write-Wins Register: most recent write wins.
    From ruflo LWW-Register: timestamp + nodeId tiebreak.
    Use for: judge_decision, current_response, workflow_status.
    """
    
    def __init__(self):
        self.value    = None
        self.timestamp = 0.0
        self.node_id  = ""
    
    def write(self, value: any, timestamp: float | None = None, node_id: str = ""):
        ts = timestamp or time.time()
        # Tiebreak: higher timestamp wins; same timestamp uses lexicographic node_id
        if (ts, node_id) > (self.timestamp, self.node_id):
            self.value     = value
            self.timestamp = ts
            self.node_id   = node_id
    
    def read(self) -> any:
        return self.value
    
    def merge(self, remote: "LWWRegister") -> "LWWRegister":
        result = LWWRegister()
        if (remote.timestamp, remote.node_id) >= (self.timestamp, self.node_id):
            result.value, result.timestamp, result.node_id = remote.value, remote.timestamp, remote.node_id
        else:
            result.value, result.timestamp, result.node_id = self.value, self.timestamp, self.node_id
        return result
```

---

## RGA: Ordered Artifact Lists

```python
class RGA:
    """
    Replicated Growable Array: ordered list with concurrent insertions.
    From ruflo RGA: causal ordering, unique identifiers per element.
    Use for: artifact_chain, decision_history, message_sequence.
    """
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.sequence_number = 0
        # Internal representation: list of (unique_id, value, tombstoned)
        self.elements: list[tuple[str, any, bool]] = []
    
    def insert(self, value: any, after: str | None = None) -> str:
        """Insert value after element with given unique_id (None = insert at start)."""
        self.sequence_number += 1
        uid = f"{self.node_id}-{self.sequence_number}"
        
        if after is None:
            self.elements.insert(0, (uid, value, False))
        else:
            idx = next((i for i, (id_, _, _) in enumerate(self.elements) if id_ == after), -1)
            self.elements.insert(idx + 1, (uid, value, False))
        
        return uid
    
    def append(self, value: any) -> str:
        """Append to end."""
        last_uid = self.elements[-1][0] if self.elements else None
        return self.insert(value, after=last_uid)
    
    def delete(self, uid: str):
        """Tombstone element (logical deletion)."""
        for i, (id_, val, _) in enumerate(self.elements):
            if id_ == uid:
                self.elements[i] = (id_, val, True)
                break
    
    def value(self) -> list[any]:
        """Return visible (non-tombstoned) elements in order."""
        return [val for _, val, tombstoned in self.elements if not tombstoned]
    
    def merge(self, remote: "RGA") -> "RGA":
        """
        Merge by causal ordering: elements ordered by their unique IDs.
        Adapted from ruflo RGA causal ordering.
        """
        result = RGA(self.node_id)
        # Merge all elements by unique ID, preserving causal order
        all_elements = {uid: (val, tomb) for uid, val, tomb in self.elements}
        for uid, val, tomb in remote.elements:
            if uid not in all_elements:
                all_elements[uid] = (val, tomb)
            elif tomb:
                all_elements[uid] = (val, True)   # tombstone wins
        
        # Re-sort by causal order (node-sequence pairs)
        sorted_uids = sorted(all_elements.keys(), 
                           key=lambda uid: (uid.split("-")[0], int(uid.split("-")[1])))
        result.elements = [(uid, *all_elements[uid]) for uid in sorted_uids]
        return result
```

---

## DeltaStateCRDT: Efficient Incremental Sync

```python
class DeltaStateCRDT:
    """
    Delta-state CRDT: only transmit deltas, not full state.
    From ruflo DeltaStateCRDT: buffer with causal sort, 24h GC.
    Use for: efficient sync of large shared states across orgs.
    """
    
    GC_INTERVAL_HOURS = 24
    
    def __init__(self, node_id: str, state: dict):
        self.node_id = node_id
        self.state = state
        self.deltas: list[tuple[float, dict]] = []   # (timestamp, delta)
        self.vector_clock: dict[str, int] = {node_id: 0}
    
    def mutate(self, update: dict) -> dict:
        """Apply local mutation, capture as delta."""
        self.state.update(update)
        self.vector_clock[self.node_id] = self.vector_clock.get(self.node_id, 0) + 1
        delta = {"update": update, "clock": dict(self.vector_clock)}
        self.deltas.append((time.time(), delta))
        return delta
    
    def delta_since(self, remote_clock: dict) -> list[dict]:
        """Return deltas that remote hasn't seen yet."""
        return [
            delta for _, delta in self.deltas
            if self._remote_needs(remote_clock, delta["clock"])
        ]
    
    def apply_delta(self, delta: dict):
        """Apply incoming delta from another org."""
        remote_clock = delta["clock"]
        # Only apply if causally ordered
        if self._is_causally_ready(remote_clock):
            self.state.update(delta["update"])
            self._merge_clocks(remote_clock)
        else:
            # Buffer out-of-order delta for later
            self.deltas.append((time.time(), delta))
    
    def garbage_collect(self):
        """Remove deltas older than GC_INTERVAL_HOURS."""
        cutoff = time.time() - (self.GC_INTERVAL_HOURS * 3600)
        self.deltas = [(ts, d) for ts, d in self.deltas if ts > cutoff]
    
    def _is_causally_ready(self, remote_clock: dict) -> bool:
        """All causal predecessors have been applied."""
        for node, count in remote_clock.items():
            if count > self.vector_clock.get(node, 0) + 1:
                return False   # missing intermediate updates
        return True
    
    def _merge_clocks(self, remote_clock: dict):
        for node, count in remote_clock.items():
            self.vector_clock[node] = max(self.vector_clock.get(node, 0), count)
    
    def _remote_needs(self, remote_clock: dict, delta_clock: dict) -> bool:
        """True if remote hasn't seen this delta's update."""
        for node, count in delta_clock.items():
            if count > remote_clock.get(node, 0):
                return True
        return False
```

---

## CRDT Composer: Composite Shared State

```python
class CRDTComposer:
    """
    Compose multiple CRDTs into a unified shared state schema.
    From ruflo CRDTComposer: schema-based composite.
    """
    
    # Schema for cross-org workflow shared state
    CROSS_ORG_STATE_SCHEMA = {
        "gates_passed":    "or_set",
        "gates_failed":    "or_set",
        "agent_chain":     "or_set",
        "artifact_refs":   "rga",
        "risk_flags":      "or_set",
        "debate_count":    "g_counter",
        "risk_count":      "g_counter",
        "judge_decision":  "lww_register",
        "workflow_status": "lww_register",
        "active_decisions": "lww_register",
    }
    
    def create_state(self, node_id: str) -> dict:
        state = {}
        for field, crdt_type in self.CROSS_ORG_STATE_SCHEMA.items():
            if crdt_type == "or_set":     state[field] = ORSet()
            elif crdt_type == "rga":      state[field] = RGA(node_id)
            elif crdt_type == "g_counter": state[field] = GCounter(node_id)
            elif crdt_type == "lww_register": state[field] = LWWRegister()
        return state
    
    def merge(self, local: dict, remote: dict) -> dict:
        result = {}
        for field in self.CROSS_ORG_STATE_SCHEMA:
            local_crdt  = local.get(field)
            remote_crdt = remote.get(field)
            if local_crdt and remote_crdt:
                result[field] = local_crdt.merge(remote_crdt)
            else:
                result[field] = local_crdt or remote_crdt
        return result
```
