# Byzantine Consensus

**Component:** consensus-frameworks/byzantine-consensus  
**Role:** pBFT three-phase protocol for fault-tolerant multi-agent agreement  
**Source Primitives:** ruflo (agent-byzantine-coordinator: pBFT, threshold signatures, ZK proofs, replay prevention)

---

## Overview

Byzantine Fault Tolerant (BFT) consensus provides the strongest agreement guarantee in the consensus framework. It tolerates up to f < n/3 faulty or malicious agents while still reaching agreement. Used for irreversible, high-stakes decisions where agent output integrity cannot be assumed.

In the Enterprise AI OS, BFT consensus is applied when:
- A decision cannot be reversed after execution (e.g., production deployment, constitutional change)
- Multiple independent agents must agree before action proceeds
- The stakes require tolerance for agent drift or hallucination

---

## pBFT Three-Phase Protocol

Adapted from ruflo agent-byzantine-coordinator. The three-phase protocol ensures all non-faulty nodes agree even when up to f nodes behave arbitrarily.

```
PBFT PROTOCOL: n agents, f < n/3 tolerated faulty
───────────────────────────────────────────────────

Phase 1: PRE-PREPARE (Leader → All)
  Leader broadcasts proposed decision with:
    - sequence_number
    - view_number  
    - decision_payload (serialized)
    - leader_signature

Phase 2: PREPARE (All → All)
  Each agent that accepts PRE-PREPARE broadcasts PREPARE:
    - sequence_number
    - view_number
    - decision_digest (hash of payload)
    - agent_signature
  
  PREPARE is considered complete when:
    2f + 1 PREPARE messages received from distinct agents

Phase 3: COMMIT (All → All)
  Agents that completed PREPARE broadcast COMMIT:
    - sequence_number
    - view_number
    - agent_signature
  
  Decision is COMMITTED when:
    2f + 1 COMMIT messages received from distinct agents
```

### Implementation

```python
class PBFTConsensus:
    """
    Practical Byzantine Fault Tolerance for enterprise agent coordination.
    Adapted from ruflo agent-byzantine-coordinator.
    """
    
    def __init__(self, agent_id: str, peers: list[str]):
        self.agent_id   = agent_id
        self.peers      = peers
        self.n          = len(peers) + 1    # total nodes including self
        self.f          = (self.n - 1) // 3  # max tolerated faulty: f < n/3
        self.quorum     = 2 * self.f + 1    # required for progress
        
        self.view_number     = 0
        self.sequence_number = 0
        self.prepared        = {}   # (seq, view) → set of agent votes
        self.committed       = {}
    
    def propose(self, decision: Decision) -> ProposalId:
        """Leader initiates consensus (Phase 1: PRE-PREPARE)."""
        self.sequence_number += 1
        proposal = PrePrepare(
            leader=self.agent_id,
            sequence_number=self.sequence_number,
            view_number=self.view_number,
            decision=decision,
            digest=hash_decision(decision),
            signature=self._sign(decision),
        )
        self._broadcast(proposal)
        return proposal.id
    
    def on_pre_prepare(self, msg: PrePrepare) -> bool:
        """Accept pre-prepare if valid, then broadcast PREPARE (Phase 2)."""
        if not self._verify_leader(msg.leader, msg.view_number):
            return False
        if not self._verify_signature(msg.signature, msg.leader):
            return False
        if not self._verify_digest(msg.decision, msg.digest):
            return False
        
        prepare = Prepare(
            agent_id=self.agent_id,
            sequence_number=msg.sequence_number,
            view_number=msg.view_number,
            digest=msg.digest,
            signature=self._sign(msg.digest),
        )
        self._broadcast(prepare)
        return True
    
    def on_prepare(self, msg: Prepare) -> bool:
        """Collect PREPARE votes. At quorum, broadcast COMMIT (Phase 3)."""
        key = (msg.sequence_number, msg.view_number)
        if key not in self.prepared:
            self.prepared[key] = set()
        self.prepared[key].add(msg.agent_id)
        
        if len(self.prepared[key]) >= self.quorum:
            commit = Commit(
                agent_id=self.agent_id,
                sequence_number=msg.sequence_number,
                view_number=msg.view_number,
                digest=msg.digest,
                signature=self._sign(msg.digest),
            )
            self._broadcast(commit)
            return True
        return False
    
    def on_commit(self, msg: Commit) -> CommitResult:
        """Collect COMMIT votes. At quorum, decision is committed."""
        key = (msg.sequence_number, msg.view_number)
        if key not in self.committed:
            self.committed[key] = set()
        self.committed[key].add(msg.agent_id)
        
        if len(self.committed[key]) >= self.quorum:
            return CommitResult(committed=True, decision_id=msg.sequence_number)
        return CommitResult(committed=False)
```

---

## Security Measures

From ruflo agent-byzantine-coordinator security layer:

### Threshold Signatures

No single agent can forge a quorum decision. Requires k-of-n signature shares:

```python
class ThresholdSignature:
    """k-of-n threshold signature — prevents single-agent forgery."""
    
    def __init__(self, k: int, n: int):
        self.k = k   # minimum shares required (e.g., 2f+1)
        self.n = n   # total agents
    
    def generate_share(self, agent_id: str, message: bytes) -> SignatureShare:
        return self._compute_share(agent_id, message)
    
    def combine(self, shares: list[SignatureShare]) -> bytes | None:
        if len(shares) < self.k:
            return None   # insufficient shares — cannot produce valid signature
        return self._combine_shares(shares[:self.k])
    
    def verify(self, message: bytes, combined_sig: bytes) -> bool:
        return self._verify_threshold_sig(message, combined_sig)
```

### Replay Attack Prevention

Each message carries a nonce to prevent replay of old consensus rounds:

```python
class ReplayPrevention:
    WINDOW_SIZE = 1000   # track last 1000 message nonces
    
    def __init__(self):
        self.seen_nonces: deque = deque(maxlen=self.WINDOW_SIZE)
    
    def is_replay(self, msg: PBFTMessage) -> bool:
        nonce = (msg.agent_id, msg.sequence_number, msg.view_number)
        if nonce in self.seen_nonces:
            return True
        self.seen_nonces.append(nonce)
        return False
```

### Rate Limiting

Prevents message flooding from faulty agents:

```python
class ConsensuRateLimiter:
    MAX_MESSAGES_PER_ROUND = 100   # per agent per consensus round
    
    def check(self, agent_id: str, message_type: str) -> bool:
        key = f"{agent_id}:{message_type}"
        self.counts[key] = self.counts.get(key, 0) + 1
        return self.counts[key] <= self.MAX_MESSAGES_PER_ROUND
```

---

## View Change (Leader Failure Recovery)

When the current leader fails, BFT initiates a view change:

```python
class ViewChangeProtocol:
    """Recover from leader failure by electing new leader for next view."""
    
    VIEW_CHANGE_TIMEOUT_S = 30   # timeout before initiating view change
    
    def initiate_view_change(self, new_view: int):
        msg = ViewChange(
            new_view=new_view,
            last_prepared_sequence=self.last_prepared,
            agent_id=self.agent_id,
        )
        self._broadcast(msg)
    
    def on_view_change(self, msg: ViewChange):
        self.view_change_votes[msg.new_view].add(msg.agent_id)
        
        if len(self.view_change_votes[msg.new_view]) >= self.quorum:
            # Elect new leader for this view (deterministic: view % n)
            new_leader = self.peers[msg.new_view % len(self.peers)]
            if new_leader == self.agent_id:
                self._become_leader(msg.new_view)
```

---

## Enterprise Activation Criteria

BFT consensus is activated for decisions matching these criteria:

```python
BFT_REQUIRED_CONDITIONS = [
    lambda d: d.reversibility == "irreversible",
    lambda d: d.requires_human_approval == False and d.financial_impact > 10_000,
    lambda d: d.touches_production_infrastructure,
    lambda d: d.modifies_governance_rules,
    lambda d: d.authority_tier >= 4,   # T4/T5 decisions
]

def requires_bft(decision: Decision) -> bool:
    return any(cond(decision) for cond in BFT_REQUIRED_CONDITIONS)
```

---

## Distributed Voting with Influence Weighting

For decisions where not all agents have equal authority (adapted from ruflo ByzantineConsensus):

```python
class WeightedDistributedVoting:
    """
    Votes are weighted by agent's authority tier and domain relevance.
    Adapted from ruflo SwarmCoordinator.distributedVoting with PageRank weighting.
    """
    
    def compute_weights(self, agents: list[str], decision_domain: str) -> dict[str, float]:
        weights = {}
        for agent_id in agents:
            tier_weight   = self.registry.tier(agent_id) / 5.0
            domain_weight = 1.0 if self.registry.domain(agent_id) == decision_domain else 0.5
            performance   = self.tracker.success_rate(agent_id, decision_domain)
            weights[agent_id] = (tier_weight * 0.4 + domain_weight * 0.3 + performance * 0.3)
        return weights
    
    def weighted_vote(self, votes: dict[str, str], weights: dict[str, float]) -> str:
        """Weighted majority vote — returns winning decision."""
        tallies: dict[str, float] = {}
        for agent_id, vote in votes.items():
            tallies[vote] = tallies.get(vote, 0) + weights.get(agent_id, 1.0)
        return max(tallies, key=tallies.get)
```
