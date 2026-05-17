# Event Bus

**Component:** coordination-runtime/event-bus  
**Role:** Topic-based event routing, gossip propagation, anti-entropy  
**Source Primitives:** ruflo (gossip protocol, push/pull/hybrid, Merkle anti-entropy, vector clocks)  
**Runtime Phase:** RT-2 target (event-driven); RT-1 approximation via polling/explicit publish

---

## Overview

The Event Bus is the coordination runtime's nervous system. Agents publish events to named topics; subscribers receive them asynchronously. At RT-1, this is approximated by explicit publish calls in handoff envelopes. At RT-2, it becomes a true event-driven bus with persistent topic queues.

---

## Topics

Nine standard topics cover all coordination event types:

| Topic | Producers | Consumers | Schema |
|-------|-----------|-----------|--------|
| `workflow.started` | Orchestrator | All agents, Observability | WorkflowEvent |
| `workflow.completed` | Orchestrator | Delivery, Analytics, Governance | WorkflowEvent |
| `gate.evaluated` | Supervisor, Gates | Governance, PM, Delivery | GateEvent |
| `agent.handoff` | Any agent | Next agent in chain | HandoffEvent |
| `agent.escalation` | Any agent | Authority-tier agent, Governance | EscalationEvent |
| `decision.reached` | Judge agents | Memory, Wiki, Governance | DecisionEvent |
| `risk.flagged` | Risk agents, Governance | Delivery, PM, Constitution-guardian | RiskEvent |
| `state.updated` | Coordination engine | All subscribers to entity | StateEvent |
| `health.alert` | Health monitor | Orchestrator, On-call | HealthEvent |

---

## Event Schemas

### Base Event

```typescript
interface BaseEvent {
  event_id: string;           // UUID
  topic: string;
  timestamp_utc: string;      // ISO 8601
  producer: string;           // agent name
  correlation_id: string;     // ties events to a workflow
  vector_clock: Record<string, number>;
  schema_version: "1.0";
}
```

### WorkflowEvent

```typescript
interface WorkflowEvent extends BaseEvent {
  workflow_id: string;
  intent: string;
  entity: string;
  status: "started" | "completed" | "partial_complete" | "failed";
  agents_involved: string[];
  gates_passed: string[];
  gates_failed: string[];
  duration_seconds?: number;
}
```

### GateEvent

```typescript
interface GateEvent extends BaseEvent {
  gate_id: "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8";
  evaluator_agent: string;
  result: "passed" | "failed" | "bypassed";
  artifact_ref?: string;
  failure_reason?: string;
}
```

### HandoffEvent

```typescript
interface HandoffEvent extends BaseEvent {
  from_agent: string;
  to_agent: string;
  artifact_ref: string;
  context_budget_transferred: number;   // tokens
  handoff_type: "pipeline" | "escalation" | "fan_in";
}
```

### DecisionEvent

```typescript
interface DecisionEvent extends BaseEvent {
  decision_type: "architecture" | "product" | "risk" | "governance" | "operational";
  decision_summary: string;
  confidence_score: number;        // 0.0–1.0
  signal: "strong_build" | "build" | "defer" | "reject" | "escalate";
  perspectives_heard: string[];    // agents that contributed
  judge_agent: string;
  artifact_ref: string;            // points to ADR, decision log entry, etc.
  reversibility: "reversible" | "partially_reversible" | "irreversible";
  requires_human_approval: boolean;
}
```

---

## Gossip Protocol

For eventual consistency of coordination metadata across all agents, the event bus uses gossip propagation. Adapted from ruflo's gossip-coordinator.

### Push / Pull / Push-Pull Modes

```python
class GossipProtocol:
    """Epidemic state dissemination — no central coordinator."""
    
    def __init__(self, agent_id: str, peers: list[str], mode: str = "push_pull"):
        self.agent_id = agent_id
        self.peers = peers
        self.mode = mode              # "push" | "pull" | "push_pull"
        self.state: dict = {}
        self.vector_clock: dict = {}
        self.fanout = 3               # propagate to 3 random peers per round
    
    def push(self, target_peer: str) -> dict:
        """Send our state digest to a peer."""
        return {
            "from": self.agent_id,
            "digest": self._compute_digest(),
            "vector_clock": dict(self.vector_clock),
            "delta": self._compute_delta(target_peer),
        }
    
    def pull(self, source_peer: str) -> dict:
        """Request state from a peer."""
        return {
            "from": self.agent_id,
            "request_since": self.vector_clock.get(source_peer, 0),
        }
    
    def on_receive(self, message: dict):
        """Merge incoming state using vector clock ordering."""
        remote_clock = message.get("vector_clock", {})
        self.vector_clock = self._merge_clocks(self.vector_clock, remote_clock)
        if "delta" in message:
            self._apply_delta(message["delta"])
    
    def select_peers(self) -> list[str]:
        """Random peer selection for this gossip round."""
        import random
        return random.sample(self.peers, min(self.fanout, len(self.peers)))
    
    def _merge_clocks(self, local: dict, remote: dict) -> dict:
        all_agents = set(local) | set(remote)
        return {a: max(local.get(a, 0), remote.get(a, 0)) for a in all_agents}
    
    def _compute_digest(self) -> dict:
        """Compact fingerprint of current state for anti-entropy."""
        return {k: hash(str(v)) for k, v in self.state.items()}
    
    def _compute_delta(self, peer: str) -> dict:
        """Only send entries the peer is missing."""
        peer_ts = self.vector_clock.get(peer, 0)
        return {k: v for k, v in self.state.items() 
                if self._entry_timestamp(k) > peer_ts}
```

### Anti-Entropy with Merkle Trees

For detecting and repairing divergence between agents' coordination state:

```python
class MerkleAntiEntropy:
    """Efficient state reconciliation using Merkle tree comparison."""
    
    def build_tree(self, state: dict) -> MerkleNode:
        """Build Merkle tree from state dict."""
        leaves = [MerkleNode(k, hash_entry(k, v)) for k, v in sorted(state.items())]
        return self._build_from_leaves(leaves)
    
    def find_divergent_keys(self, local_tree: MerkleNode, remote_tree: MerkleNode) -> list[str]:
        """Traverse trees to find which subtrees differ — O(log n) instead of O(n)."""
        if local_tree.hash == remote_tree.hash:
            return []    # subtree matches, skip
        if local_tree.is_leaf:
            return [local_tree.key]
        left_diff  = self.find_divergent_keys(local_tree.left, remote_tree.left)
        right_diff = self.find_divergent_keys(local_tree.right, remote_tree.right)
        return left_diff + right_diff
    
    def sync_state(self, local: dict, remote_digest: MerkleNode) -> dict:
        """Return only the keys that need to be sent to repair remote state."""
        local_tree = self.build_tree(local)
        divergent = self.find_divergent_keys(local_tree, remote_digest)
        return {k: local[k] for k in divergent if k in local}
```

### Join / Leave / Failure Detection

```python
class MembershipProtocol:
    """Agent join/leave/failure detection via gossip heartbeats."""
    
    HEARTBEAT_INTERVAL_S = 30
    FAILURE_THRESHOLD_S  = 90    # 3 missed heartbeats → suspected failure
    REMOVAL_THRESHOLD_S  = 300   # 10 missed heartbeats → confirmed failure
    
    def on_join(self, agent_id: str):
        self.members[agent_id] = {
            "status": "active",
            "last_heartbeat": time.time(),
            "join_time": time.time(),
        }
        self.gossip_to_peers({"type": "join", "agent": agent_id})
    
    def on_heartbeat(self, agent_id: str, timestamp: float):
        if agent_id in self.members:
            self.members[agent_id]["last_heartbeat"] = timestamp
            self.members[agent_id]["status"] = "active"
    
    def detect_failures(self):
        now = time.time()
        for agent_id, info in self.members.items():
            elapsed = now - info["last_heartbeat"]
            if elapsed > self.REMOVAL_THRESHOLD_S:
                self._mark_failed(agent_id)
            elif elapsed > self.FAILURE_THRESHOLD_S:
                self._mark_suspected(agent_id)
    
    def _mark_failed(self, agent_id: str):
        self.members[agent_id]["status"] = "failed"
        self.publish("health.alert", HealthEvent(
            agent=agent_id, severity="critical",
            message=f"Agent {agent_id} confirmed failed after {self.REMOVAL_THRESHOLD_S}s"
        ))
```

---

## Subscription Management

```python
class EventBus:
    
    def subscribe(self, topic: str, agent_id: str, handler: callable):
        """Register agent as subscriber to a topic."""
        self.subscriptions[topic].add(agent_id)
        self.handlers[(topic, agent_id)] = handler
    
    def publish(self, topic: str, event: BaseEvent):
        """Publish event to all subscribers, with gossip propagation."""
        event.vector_clock = self.vector_clock.tick(self.agent_id)
        subscribers = self.subscriptions.get(topic, set())
        for sub in subscribers:
            self.handlers[(topic, sub)](event)
        # Gossip to non-subscriber peers for eventual propagation
        self.gossip.push_to_random_peers(event, exclude=subscribers)
    
    def replay_from(self, topic: str, since_vector_clock: dict) -> list[BaseEvent]:
        """Replay missed events for an agent rejoining after gap."""
        return [e for e in self.topic_log[topic]
                if self.vector_clock.happened_before(since_vector_clock, e.vector_clock)]
```

---

## RT-1 Approximation (Current)

Until RT-2 is implemented, the event bus is approximated by:

1. **Explicit publish calls** embedded in handoff envelopes
2. **State file writes** to `memory/workflow-state/` acting as a durable event log
3. **Manual subscription** — agents declare interest in specific workflow correlation IDs
4. **No gossip** — all events are point-to-point via the coordination engine

Upgrade path to RT-2: replace explicit calls with a persistent queue broker, retain all schemas.
