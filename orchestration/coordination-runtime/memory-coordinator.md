# Memory Coordinator

**Component:** coordination-runtime/memory-coordinator  
**Role:** Coordination namespace state management, hot/warm/cold tier access, past-context injection  
**Source Primitives:** ruflo (memory key schema, hybrid backend), TradingAgents (past_context injection)

---

## Overview

The Memory Coordinator manages how coordination state persists across sessions and is injected into new invocations. It bridges the coordination runtime to the OS's 3-tier memory architecture (Hot/Warm/Cold) and implements the past-context injection pattern from TradingAgents that enables cross-session decision continuity.

---

## Memory Tier Architecture

```
COORDINATION MEMORY TIERS
──────────────────────────────────────────────────────────
HOT  (wiki/)           ← Organizational knowledge, always loaded
  ├── wiki/index.md
  ├── wiki/architecture/overview.md
  └── wiki/processes/   ← current sprint decisions
  
WARM (memory/)         ← Session state, decisions, active contexts
  ├── memory/organizational/   ← governance constraints, quality standards
  ├── memory/decisions.md      ← master decision index
  ├── memory/workflow-state/   ← active workflow coordination state
  └── memory/patterns/         ← validated coordination patterns
  
COLD (artifacts/)      ← Historical record, never modified after seal
  ├── artifacts/adrs/          ← Architecture Decision Records
  ├── artifacts/prds/          ← Product Requirements Documents
  └── artifacts/handoffs/      ← Completed session handoffs
```

---

## Coordination Namespace

All runtime coordination state lives under the `swarm$*` key schema in the warm memory tier.

### Key Schema

```
swarm$<agent_id>$<status>           ← per-agent status tracking
swarm$<workflow_id>$state           ← full serialized CoordinationState
swarm$<workflow_id>$vector_clock    ← current vector clock snapshot
swarm$<workflow_id>$debate          ← active DebateState (if DEBATING)
swarm$<workflow_id>$risk            ← active RiskAnalysisState (if RISK_ANALYSIS)
swarm$<workflow_id>$gates           ← OR-Set of passed/failed gates
swarm$<entity_id>$past_context      ← accumulated past context for repeat invocations
swarm$topology$current              ← active topology configuration
swarm$topology$snapshot-<ts>        ← point-in-time topology snapshots
swarm$circuit$<agent_id>            ← circuit breaker state per agent
```

### Examples

```
swarm$pm-lead$active
swarm$wf-2026-0511-001$state
swarm$user-auth-feature$past_context
swarm$topology$current
swarm$circuit$arch-principal
```

---

## Past-Context Injection (from TradingAgents)

TradingAgents injects `past_context` into every new invocation for the same entity, enabling the portfolio manager to incorporate prior decisions without re-running full analysis. The Enterprise AI OS applies this pattern at the coordination level.

### Past Context Structure

```python
class PastContextBuilder:
    """Build past_context string for coordination state injection."""
    
    def build(self, entity_id: str, workflow_intent: str) -> str:
        """
        Aggregate prior decisions for the same entity.
        Adapted from TradingAgents: same-ticker decisions + cross-ticker lessons.
        """
        same_entity_decisions = self.memory.query(
            f"swarm${entity_id}$past_context"
        )
        cross_entity_patterns = self.memory.query(
            f"patterns.coordination.{workflow_intent}"
        )
        governance_constraints = self.memory.read(
            "organizational/governance-constraints.md"
        )
        
        if not same_entity_decisions and not cross_entity_patterns:
            return ""
        
        context_parts = []
        
        if same_entity_decisions:
            context_parts.append(f"## Prior decisions for '{entity_id}':\n{same_entity_decisions}")
        
        if cross_entity_patterns:
            context_parts.append(f"## Coordination patterns from similar work:\n{cross_entity_patterns}")
        
        context_parts.append(f"## Active constraints:\n{governance_constraints}")
        
        return "\n\n".join(context_parts)
    
    def update(self, entity_id: str, new_decision: str, outcome: str):
        """Append new decision to entity's past context after workflow completes."""
        existing = self.memory.query(f"swarm${entity_id}$past_context") or ""
        entry = f"\n---\n{today()} | {outcome} | {new_decision}"
        self.memory.write(f"swarm${entity_id}$past_context", existing + entry)
```

### Injection at Workflow Start

```python
def create_initial_coordination_state(
    intent: str,
    entity: str,
    context: str,
    memory_coordinator: "MemoryCoordinator"
) -> CoordinationState:
    
    past_context = memory_coordinator.past_context_builder.build(
        entity_id=entity,
        workflow_intent=intent
    )
    
    return {
        "entity_of_interest": entity,
        "coordination_date": str(today()),
        "workflow_intent": intent,
        "past_context": past_context,    # injected — not empty on repeat runs
        # ... rest of state initialization
    }
```

---

## State Persistence Operations

```python
class MemoryCoordinator:
    
    def save_workflow_state(self, workflow_id: str, state: CoordinationState):
        """Checkpoint current coordination state for recovery."""
        self.warm_memory.write(f"swarm${workflow_id}$state", serialize(state))
        self.warm_memory.write(f"swarm${workflow_id}$vector_clock", state["vector_clock"])
    
    def load_workflow_state(self, workflow_id: str) -> CoordinationState | None:
        """Restore coordination state after interruption."""
        raw = self.warm_memory.read(f"swarm${workflow_id}$state")
        return deserialize(raw) if raw else None
    
    def save_debate_state(self, workflow_id: str, debate: DebateState):
        self.warm_memory.write(f"swarm${workflow_id}$debate", serialize(debate))
    
    def save_risk_state(self, workflow_id: str, risk: RiskAnalysisState):
        self.warm_memory.write(f"swarm${workflow_id}$risk", serialize(risk))
    
    def record_gate_result(self, workflow_id: str, gate_id: str, passed: bool):
        """Update OR-Set of gate results."""
        gates = self.load_gates(workflow_id)
        tag = f"{gate_id}-{uuid4()}"
        gates.add(f"{gate_id}:{'passed' if passed else 'failed'}", tag)
        self.warm_memory.write(f"swarm${workflow_id}$gates", serialize(gates))
    
    def save_agent_status(self, agent_id: str, status: str):
        """Track per-agent coordination status."""
        self.warm_memory.write(f"swarm${agent_id}${status}", {
            "status": status,
            "timestamp": time.time(),
        })
    
    def get_topology_snapshot(self, snapshot_id: str) -> dict:
        return self.warm_memory.read(f"swarm$topology$snapshot-{snapshot_id}")
    
    def save_topology_snapshot(self, snapshot: dict) -> str:
        snapshot_id = f"{time.time():.0f}"
        self.warm_memory.write(f"swarm$topology$snapshot-{snapshot_id}", snapshot)
        return snapshot_id
```

---

## Context Budget Management

Each agent in the coordination runtime has a defined context budget (from ADR-001):

```python
AGENT_CONTEXT_BUDGETS = {
    "orchestrator":   2_000,   # tokens
    "pm-*":           8_000,
    "arch-*":        10_000,
    "eng-*":         10_000,
    "qa-*":           6_000,
    "ux-*":           6_000,
    "analytics-*":    6_000,
    "delivery-*":     4_000,
    "governance-*":   6_000,
    "exec-*":         4_000,
}

class ContextBudgetEnforcer:
    """Trim context packages to stay within agent budget."""
    
    def prepare_context_package(self, agent_id: str, full_state: CoordinationState) -> dict:
        budget = self._budget_for(agent_id)
        
        # Always include: entity, intent, date, relevant past_context, gate status
        essential = {
            "entity_of_interest": full_state["entity_of_interest"],
            "coordination_date":  full_state["coordination_date"],
            "workflow_intent":    full_state["workflow_intent"],
            "gates_passed":       full_state["gates_passed"],
        }
        essential_tokens = count_tokens(essential)
        
        # Fill remaining budget with past_context (most relevant first)
        remaining = budget - essential_tokens
        past_context = truncate_to_tokens(full_state["past_context"], remaining - 500)
        
        return {**essential, "past_context": past_context}
```

---

## Memory Search

For retrieving relevant past decisions and patterns:

```python
class CoordinationMemorySearch:
    """Semantic search over coordination namespace (HNSW-backed at RT-2+)."""
    
    def search_similar_decisions(self, query: str, top_k: int = 5) -> list[str]:
        """Find past decisions relevant to current coordination context."""
        return self.hnsw_index.search(query, top_k=top_k, namespace="decisions")
    
    def search_coordination_patterns(self, intent: str) -> list[str]:
        """Find validated coordination patterns for this workflow type."""
        return self.hnsw_index.search(intent, top_k=3, namespace="patterns")
    
    def search_failure_modes(self, context: str) -> list[str]:
        """Find documented failure modes relevant to current coordination."""
        return self.hnsw_index.search(context, top_k=3, namespace="failures")
```
