# Coordination State Machine

**Component:** coordination-runtime/state-machine  
**Role:** Coordination state lifecycle, debate state typing, causal ordering  
**Source Primitives:** TradingAgents (state types), ruflo (vector clocks, CRDT)

---

## State Type System

All coordination workflows carry typed state. Types enforce the contract between agents and prevent state corruption across handoffs.

### Base Coordination State

```typescript
interface CoordinationState extends MessagesState {
  // Identity
  entity_of_interest: string;
  coordination_date: string;
  workflow_intent: string;
  
  // Continuity
  past_context: string;          // injected from memory on repeat invocations
  correlation_id: string;
  
  // Agent tracking
  sender: string;
  current_agent: string;
  agent_chain: string[];         // ordered list of agents that have touched this state
  
  // Sub-states
  debate_state: DebateState;
  risk_state: RiskAnalysisState;
  
  // Outputs (accumulated through pipeline)
  analysis_report: string;
  architecture_report: string;
  risk_report: string;
  governance_report: string;
  final_decision: string;
  
  // Causal ordering
  vector_clock: Record<string, number>;
  
  // Gate tracking
  gates_passed: string[];
  gates_failed: string[];
}
```

### Debate State (from TradingAgents InvestDebateState)

Adapted for enterprise multi-perspective analysis across any opposing viewpoints:

```typescript
interface DebateState {
  perspective_a_history: string;   // cumulative argument from side A
  perspective_b_history: string;   // cumulative argument from side B
  history: string;                 // interleaved full debate transcript
  current_response: string;        // last response content
  current_response_from: string;   // which perspective just spoke
  judge_decision: string;          // synthesized verdict (empty until finalized)
  count: number;                   // total turns taken
}
```

**Instantiation:**
```python
DebateState({
  "perspective_a_history": "",
  "perspective_b_history": "",
  "history": "",
  "current_response": "",
  "current_response_from": "",
  "judge_decision": "",
  "count": 0,
})
```

### Risk Analysis State (from TradingAgents RiskDebateState)

Three-perspective risk assessment for high-stakes decisions:

```typescript
interface RiskAnalysisState {
  aggressive_history: string;            // risk-accepting position history
  conservative_history: string;          // risk-averse position history
  neutral_history: string;               // balanced position history
  history: string;                       // full interleaved transcript
  latest_speaker: string;                // tracks round-robin position
  current_aggressive_response: string;
  current_conservative_response: string;
  current_neutral_response: string;
  judge_decision: string;                // final risk verdict
  count: number;
}
```

---

## State Lifecycle

```
COORDINATION STATE LIFECYCLE
──────────────────────────────────────────────────────────
INITIAL         ← create_initial_coordination_state()
    │
    ↓
ROUTING         ← pattern selected, first agent assigned
    │
    ↓
EXECUTING       ← agents actively processing
    │
    ├──[gate_fail]──→ GATE_BLOCKED ──[remediation]──→ EXECUTING
    │
    ├──[debate]──→ DEBATING ──[count>=threshold]──→ JUDGING ──→ EXECUTING
    │
    ├──[risk_review]──→ RISK_ANALYSIS ──[count>=threshold]──→ RISK_JUDGING ──→ EXECUTING
    │
    ├──[escalation]──→ ESCALATED ──[resolved]──→ EXECUTING
    │
    ├──[recursion_limit]──→ PARTIAL_COMPLETE
    │
    └──[all_gates_passed]──→ COMPLETE
```

### State Transitions

| From | Event | To | Action |
|------|-------|----|--------|
| `INITIAL` | engine_start | `ROUTING` | Load past_context, select pattern |
| `ROUTING` | first_agent_assigned | `EXECUTING` | Send initial message |
| `EXECUTING` | gate_failure | `GATE_BLOCKED` | Log failure, notify last-passing agent |
| `GATE_BLOCKED` | remediation_provided | `EXECUTING` | Resume from checkpoint |
| `EXECUTING` | debate_triggered | `DEBATING` | Initialize DebateState |
| `DEBATING` | count >= 2×max_rounds | `JUDGING` | Route to judge agent |
| `JUDGING` | judge_decision_produced | `EXECUTING` | Inject decision into state |
| `EXECUTING` | risk_review_triggered | `RISK_ANALYSIS` | Initialize RiskAnalysisState |
| `RISK_ANALYSIS` | count >= 3×max_rounds | `RISK_JUDGING` | Route to risk judge |
| `RISK_JUDGING` | verdict_produced | `EXECUTING` | Inject verdict, resume |
| `EXECUTING` | escalation_required | `ESCALATED` | Route to authority tier above |
| `ESCALATED` | resolved | `EXECUTING` | Resume with escalation outcome |
| `EXECUTING` | recursion_limit_hit | `PARTIAL_COMPLETE` | Log partial, emit metrics |
| `EXECUTING` | all_required_gates_passed | `COMPLETE` | Persist artifacts, emit success |

---

## Vector Clock Ordering

Every state update carries a vector clock to enforce causal ordering across concurrent agents.

```python
class VectorClock:
    """Causal ordering for inter-agent state."""
    
    def __init__(self, agents: list[str]):
        self.clock = {agent: 0 for agent in agents}
    
    def tick(self, agent_id: str) -> dict:
        """Increment this agent's clock before sending."""
        self.clock[agent_id] += 1
        return dict(self.clock)
    
    def merge(self, remote_clock: dict) -> dict:
        """Merge on receive: take max of each component."""
        for agent, ts in remote_clock.items():
            self.clock[agent] = max(self.clock.get(agent, 0), ts)
        return dict(self.clock)
    
    def is_concurrent(self, clock_a: dict, clock_b: dict) -> bool:
        """True if neither clock causally precedes the other."""
        a_leq_b = all(clock_a.get(k, 0) <= clock_b.get(k, 0) for k in clock_a)
        b_leq_a = all(clock_b.get(k, 0) <= clock_a.get(k, 0) for k in clock_b)
        return not (a_leq_b or b_leq_a)
    
    def happened_before(self, clock_a: dict, clock_b: dict) -> bool:
        """True if clock_a strictly precedes clock_b."""
        leq = all(clock_a.get(k, 0) <= clock_b.get(k, 0) for k in clock_a)
        lt  = any(clock_a.get(k, 0) <  clock_b.get(k, 0) for k in clock_a)
        return leq and lt
```

**Rules:**
- Agent increments own clock before sending any message
- Agent merges received clock on receipt (takes max)
- State updates are applied in causal order (never apply a message whose clock has undelivered predecessors)
- Concurrent updates use LWW-Register resolution (timestamp + agent_id tiebreak)

---

## CRDT State Synchronization

For state that multiple agents update concurrently (e.g., shared risk registers, capability assessments), CRDT types provide conflict-free merging without coordination overhead.

### G-Counter (increment-only metrics)

```python
class GCounter:
    """Monotonically increasing counter — use for turns_taken, gates_passed counts."""
    def __init__(self, agent_id: str):
        self.counts = {agent_id: 0}
        self.agent_id = agent_id
    
    def increment(self):
        self.counts[self.agent_id] += 1
    
    def value(self) -> int:
        return sum(self.counts.values())
    
    def merge(self, remote: "GCounter") -> "GCounter":
        result = GCounter(self.agent_id)
        all_agents = set(self.counts) | set(remote.counts)
        result.counts = {a: max(self.counts.get(a, 0), remote.counts.get(a, 0)) for a in all_agents}
        return result
```

### LWW-Register (last-write-wins for judge decisions)

```python
class LWWRegister:
    """Last-write-wins — use for judge_decision, current_response fields."""
    def __init__(self):
        self.value = None
        self.timestamp = 0
        self.agent_id = ""
    
    def write(self, value, timestamp: float, agent_id: str):
        if (timestamp, agent_id) > (self.timestamp, self.agent_id):
            self.value = value
            self.timestamp = timestamp
            self.agent_id = agent_id
    
    def merge(self, remote: "LWWRegister") -> "LWWRegister":
        result = LWWRegister()
        if (remote.timestamp, remote.agent_id) > (self.timestamp, self.agent_id):
            result.value, result.timestamp, result.agent_id = remote.value, remote.timestamp, remote.agent_id
        else:
            result.value, result.timestamp, result.agent_id = self.value, self.timestamp, self.agent_id
        return result
```

### OR-Set (accumulated perspectives, no removal)

```python
class ORSet:
    """Observed-Remove Set — use for agent_chain, gates_passed, perspectives_heard."""
    def __init__(self):
        self.elements: dict[str, set[str]] = {}   # element → {unique_tags}
        self.tombstones: dict[str, set[str]] = {}
    
    def add(self, element: str, unique_tag: str):
        if element not in self.elements:
            self.elements[element] = set()
        self.elements[element].add(unique_tag)
    
    def remove(self, element: str):
        if element in self.elements:
            if element not in self.tombstones:
                self.tombstones[element] = set()
            self.tombstones[element].update(self.elements[element])
    
    def contains(self, element: str) -> bool:
        tags = self.elements.get(element, set())
        stones = self.tombstones.get(element, set())
        return bool(tags - stones)
    
    def merge(self, remote: "ORSet") -> "ORSet":
        result = ORSet()
        all_elements = set(self.elements) | set(remote.elements)
        for e in all_elements:
            result.elements[e] = self.elements.get(e, set()) | remote.elements.get(e, set())
        all_stones = set(self.tombstones) | set(remote.tombstones)
        for e in all_stones:
            result.tombstones[e] = self.tombstones.get(e, set()) | remote.tombstones.get(e, set())
        return result
```

---

## State Persistence

Coordination state is persisted using the memory key schema `swarm$role$status` in the coordination namespace:

```
coordination namespace keys:
  swarm$pm-lead$active               ← PM agent currently executing
  swarm$arch-principal$waiting       ← Architect awaiting handoff
  swarm$workflow$state               ← Full serialized CoordinationState
  swarm$workflow$vector_clock        ← Current vector clock snapshot
  swarm$debate$current               ← Active DebateState (if in DEBATING)
  swarm$risk$current                 ← Active RiskAnalysisState (if in RISK_ANALYSIS)
  swarm$gates$passed                 ← OR-Set of passed gates
```

State snapshots are taken at every `EXECUTING → *` transition to enable rollback.
