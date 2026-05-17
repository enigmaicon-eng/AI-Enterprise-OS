# Workflow Synchronizer

**Component:** organizational-synchronization/workflow-synchronizer  
**Role:** Workflow state sync across org boundaries, in-flight handoff management  
**Source Primitives:** ruflo (Raft leader election, log replication), state-models/workflow-states.md

---

## Overview

The Workflow Synchronizer ensures that when a workflow crosses from one organization to the next, the full workflow state — decisions made, gates passed, artifacts created, context accumulated — transfers completely without loss. It also handles the case where a workflow is mid-flight when a context reset occurs, enabling recovery to the last consistent checkpoint.

---

## Workflow State Replication (Raft)

For workflows involving multiple concurrent organizations, Raft consensus maintains an authoritative log of workflow state that all orgs can trust:

```python
class WorkflowRaft:
    """
    Raft-based workflow state replication.
    From ruflo agent-raft-manager: leader election, log replication, heartbeats.
    """
    
    HEARTBEAT_INTERVAL_S = 5
    ELECTION_TIMEOUT_S   = (10, 20)   # randomized range
    
    def __init__(self, node_id: str, peers: list[str]):
        self.node_id = node_id
        self.peers   = peers
        self.state   = "follower"   # follower / candidate / leader
        self.current_term   = 0
        self.voted_for      = None
        self.log: list[LogEntry] = []
        self.commit_index   = 0
        self.last_applied   = 0
        self.votes_received = set()
        self.next_index: dict[str, int] = {}    # leader: next log index to send per peer
        self.match_index: dict[str, int] = {}   # leader: highest replicated index per peer
    
    def start_election(self):
        """Initiate leader election (randomized timeout expired)."""
        self.state = "candidate"
        self.current_term += 1
        self.voted_for = self.node_id
        self.votes_received = {self.node_id}
        
        vote_request = RequestVote(
            term=self.current_term,
            candidate_id=self.node_id,
            last_log_index=len(self.log) - 1,
            last_log_term=self.log[-1].term if self.log else 0,
        )
        self._broadcast(vote_request)
    
    def on_vote_response(self, peer_id: str, granted: bool):
        if granted and self.state == "candidate":
            self.votes_received.add(peer_id)
            quorum = len(self.peers) // 2 + 1
            if len(self.votes_received) >= quorum:
                self._become_leader()
    
    def _become_leader(self):
        self.state = "leader"
        for peer in self.peers:
            self.next_index[peer]  = len(self.log)
            self.match_index[peer] = -1
        self._send_heartbeats()
    
    def append_entry(self, entry: LogEntry) -> bool:
        """Leader: append new workflow state entry to log."""
        if self.state != "leader":
            return False
        entry.term = self.current_term
        entry.index = len(self.log)
        self.log.append(entry)
        self._replicate_to_peers()
        return True
    
    def _replicate_to_peers(self):
        for peer in self.peers:
            append_req = AppendEntries(
                term=self.current_term,
                leader_id=self.node_id,
                prev_log_index=self.next_index[peer] - 1,
                prev_log_term=self.log[self.next_index[peer] - 1].term if self.next_index[peer] > 0 else 0,
                entries=self.log[self.next_index[peer]:],
                leader_commit=self.commit_index,
            )
            self._send(peer, append_req)
    
    def on_append_entries_response(self, peer_id: str, success: bool, match_index: int):
        if success:
            self.match_index[peer_id] = match_index
            self.next_index[peer_id]  = match_index + 1
            self._advance_commit_index()
        else:
            self.next_index[peer_id] = max(0, self.next_index[peer_id] - 1)
            self._replicate_to_peers()
    
    def _advance_commit_index(self):
        """Commit entries replicated to majority of peers."""
        for n in range(len(self.log) - 1, self.commit_index, -1):
            replicated_count = sum(1 for p in self.peers if self.match_index.get(p, -1) >= n)
            if replicated_count >= len(self.peers) // 2 and self.log[n].term == self.current_term:
                self.commit_index = n
                self._apply_committed_entries()
                break
    
    def _apply_committed_entries(self):
        while self.last_applied < self.commit_index:
            self.last_applied += 1
            entry = self.log[self.last_applied]
            self.state_machine.apply(entry)
```

---

## In-Flight Handoff Management

Tracks handoffs that are in-transit between organizations:

```python
class InFlightHandoffManager:
    """Track handoffs crossing org boundaries — ensure no state is lost."""
    
    def __init__(self):
        self.in_flight: dict[str, HandoffRecord] = {}
        self.delivered: set[str] = set()
    
    def register(self, handoff: HandoffEnvelope) -> str:
        """Register a handoff before it leaves the source org."""
        handoff_id = f"HO-{handoff.correlation_id}-{now_ms()}"
        self.in_flight[handoff_id] = HandoffRecord(
            id=handoff_id,
            from_org=handoff.from_org,
            to_org=handoff.to_org,
            payload=handoff,
            registered_at=time.time(),
            status="in_transit",
        )
        return handoff_id
    
    def confirm_receipt(self, handoff_id: str, receiving_agent: str):
        """Mark handoff as delivered once receiving org confirms."""
        if handoff_id in self.in_flight:
            record = self.in_flight[handoff_id]
            record.status = "delivered"
            record.delivered_at = time.time()
            record.receiving_agent = receiving_agent
            self.delivered.add(handoff_id)
    
    def detect_lost_handoffs(self, timeout_seconds: int = 300) -> list[HandoffRecord]:
        """Find handoffs that haven't been confirmed within timeout."""
        now = time.time()
        return [
            record for record in self.in_flight.values()
            if record.status == "in_transit" and (now - record.registered_at) > timeout_seconds
        ]
    
    def retry_lost(self, record: HandoffRecord):
        """Re-send a lost handoff to the destination org."""
        self.event_bus.publish("agent.handoff", HandoffEvent(
            from_agent=record.payload.from_agent,
            to_agent=record.payload.to_agent,
            artifact_ref=record.payload.primary_artifact,
            handoff_type="retry",
            correlation_id=record.payload.correlation_id,
        ))
```

---

## Log Compaction

For long-running workflows, compact the Raft log to prevent unbounded growth:

```python
class WorkflowLogCompactor:
    """
    Snapshot-based log compaction.
    From ruflo Raft: log compaction via snapshotting.
    """
    
    COMPACTION_THRESHOLD = 100   # compact after 100 log entries
    
    def should_compact(self, log: list[LogEntry]) -> bool:
        return len(log) > self.COMPACTION_THRESHOLD
    
    def take_snapshot(self, state_machine: dict, last_applied: int, 
                      last_term: int) -> Snapshot:
        return Snapshot(
            state=dict(state_machine),
            last_included_index=last_applied,
            last_included_term=last_term,
            taken_at=time.time(),
        )
    
    def compact(self, log: list[LogEntry], snapshot: Snapshot) -> list[LogEntry]:
        """Remove log entries covered by snapshot."""
        return [e for e in log if e.index > snapshot.last_included_index]
```

---

## Workflow Sync Health

```python
class WorkflowSyncHealthMonitor:
    """Monitor health of cross-org workflow synchronization."""
    
    def health_check(self) -> WorkflowSyncHealth:
        return WorkflowSyncHealth(
            raft_leader=self.raft.state == "leader",
            replication_lag_ms=self._compute_replication_lag(),
            in_flight_handoffs=len(self.handoff_manager.in_flight),
            lost_handoffs=len(self.handoff_manager.detect_lost_handoffs()),
            log_length=len(self.raft.log),
            needs_compaction=self.compactor.should_compact(self.raft.log),
        )
    
    def _compute_replication_lag(self) -> float:
        """Average milliseconds behind leader across all followers."""
        if self.raft.state != "leader":
            return 0
        lags = [
            len(self.raft.log) - self.raft.match_index.get(p, 0)
            for p in self.raft.peers
        ]
        return sum(lags) / max(len(lags), 1) * 100   # rough ms estimate
```
