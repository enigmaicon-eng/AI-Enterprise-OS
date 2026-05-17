# Coordination Hierarchy

**Component:** adaptive-orchestration/coordination-hierarchy  
**Role:** Queen-led hierarchy structure, authority delegation, coordination mesh configuration  
**Source Primitives:** ruflo (queen-led hive-mind, hierarchical swarm maxAgents=8, specialized strategy, Raft consensus)

---

## Overview

The Coordination Hierarchy defines how authority flows through the 144-agent topology during autonomous coordination. It establishes which agents coordinate which others, how authority is delegated to sub-coordinators, and how the mesh reorganizes when hierarchy nodes fail.

---

## Queen-Led Hierarchy (from ruflo hive-mind)

```
COORDINATION HIERARCHY STRUCTURE
──────────────────────────────────────────────────────────
TIER 5: QUEEN (Master Orchestrator)
  └── Governs overall coordination strategy
  └── Authority: constitutional + cross-org + routing

TIER 4: DOMAIN QUEENS (Org Leads)
  ├── pm-lead          → Product Org (21 agents)
  ├── arch-principal   → Architecture Org (10 agents)
  ├── eng-distinguished → Engineering Org (11 agents)
  ├── qa-general       → QA Org (7 agents)
  ├── delivery-manager → Delivery Org (6 agents)
  ├── gov-risk         → Governance Org (7 agents)
  └── [10 more org leads]

TIER 3: SUB-COORDINATORS (Domain Specialists)
  └── Each org lead delegates to specialists within org

TIER 2: WORKER AGENTS (Execution)
  └── Execute delegated tasks, report to sub-coordinator

TIER 1: AUTONOMOUS AGENTS (Independent)
  └── Background workers, health monitors, schedulers
```

---

## Hierarchy Configuration (from ruflo)

```python
HIVE_MIND_CONFIG = {
    "topology": "hierarchical",
    "max_agents": 8,              # max concurrent agents in any sub-hierarchy
    "strategy": "specialized",    # specialized / balanced / load-aware
    "consensus": "raft",          # raft for leader-based authoritative state
    "memory_namespace": "coordination",
    "anti_drift": True,           # hierarchical prevents coordination drift
}

class CoordinationHierarchy:
    """
    Queen-led hierarchical coordination.
    From ruflo: hierarchical topology with maxAgents=8, specialized strategy, Raft consensus.
    """
    
    def __init__(self):
        self.queen = "master-orchestrator"
        self.domain_queens: dict[str, str] = {
            "product":       "pm-lead",
            "architecture":  "arch-principal",
            "engineering":   "eng-distinguished",
            "qa":            "qa-general",
            "delivery":      "delivery-manager",
            "governance":    "gov-risk",
            "strategy":      "strategy-corporate",
            "ux":            "ux-strategy",
            "analytics":     "analytics-product",
            "ai_native":     "ai-orchestrator",
            "runtime":       "workflow-runtime",
            "meta":          "org-evolution",
        }
        self.raft = WorkflowRaft("master-orchestrator", list(self.domain_queens.values()))
    
    def delegate(self, task: Task) -> DelegationResult:
        """Delegate task down the hierarchy."""
        
        # Queen decides which domain
        domain = self._classify_domain(task)
        domain_queen = self.domain_queens.get(domain)
        
        if not domain_queen:
            return DelegationResult(
                target="master-orchestrator",
                reason="Unknown domain — queen handles directly"
            )
        
        # Domain queen delegates to appropriate specialist
        specialist = self.expertise_orchestrator.assign_expert(
            task=task,
            candidates=self.registry.agents_in_org(domain),
        )
        
        # Raft log: record delegation decision
        self.raft.append_entry(LogEntry(
            command="delegate",
            domain=domain,
            domain_queen=domain_queen,
            specialist=specialist,
            task_id=task.id,
        ))
        
        return DelegationResult(
            domain=domain,
            domain_queen=domain_queen,
            specialist=specialist,
        )
    
    def _classify_domain(self, task: Task) -> str:
        """Classify task to a coordination domain."""
        routing_key = self.specialist_router.classify(task.intent)
        return self.routing_key_to_domain.get(routing_key, "product")
```

---

## Authority Delegation Protocol

```python
class AuthorityDelegation:
    """
    Protocol for safely delegating authority down the hierarchy.
    Authority can be delegated but not amplified.
    """
    
    def delegate_authority(self, delegator: str, delegatee: str, 
                          scope: AuthorityScope) -> DelegationToken:
        """
        Issue a time-limited authority delegation token.
        Delegatee cannot grant more authority than delegator has.
        """
        delegator_tier = self.registry.tier(delegator)
        delegatee_tier = self.registry.tier(delegatee)
        
        # Authority cannot be amplified (delegatee cannot exceed delegator)
        if delegatee_tier > delegator_tier:
            raise AuthorityError(
                f"Cannot delegate up: {delegator} (T{delegator_tier}) → {delegatee} (T{delegatee_tier})"
            )
        
        # Scope cannot exceed delegator's authority
        validated_scope = self._intersect_scope(
            scope, self.authority_store.scope(delegator)
        )
        
        token = DelegationToken(
            delegator=delegator,
            delegatee=delegatee,
            scope=validated_scope,
            issued_at=time.time(),
            expires_at=time.time() + scope.duration_seconds,
            token_id=str(uuid4()),
        )
        
        self.token_store.save(token)
        self.audit.record_delegation(token)
        return token
    
    def verify_authority(self, agent_id: str, action: str, token: DelegationToken | None) -> bool:
        """Check if agent has authority for this action (native or delegated)."""
        
        # Native authority
        if action in self.authority_store.native_actions(agent_id):
            return True
        
        # Delegated authority via token
        if token and token.delegatee == agent_id and not self._is_expired(token):
            return action in token.scope.allowed_actions
        
        return False
```

---

## Sub-Hierarchy Management

Each domain queen manages a sub-hierarchy of up to 8 agents:

```python
class SubHierarchyManager:
    """
    Manage a domain's sub-hierarchy of specialists.
    From ruflo: maxAgents=8 prevents coordination overhead from exceeding returns.
    """
    
    MAX_AGENTS = 8
    
    def __init__(self, domain_queen: str, domain: str):
        self.domain_queen = domain_queen
        self.domain = domain
        self.active_agents: list[str] = []
        self.raft = WorkflowRaft(domain_queen, [])   # starts empty
    
    def activate_agent(self, agent_id: str):
        """Add agent to active sub-hierarchy."""
        if len(self.active_agents) >= self.MAX_AGENTS:
            # At capacity — queue or escalate
            self._queue_or_escalate(agent_id)
            return
        
        self.active_agents.append(agent_id)
        self.raft.peers.append(agent_id)
        self.memory.write(f"swarm${agent_id}$active", True)
    
    def deactivate_agent(self, agent_id: str):
        """Remove agent from active sub-hierarchy."""
        if agent_id in self.active_agents:
            self.active_agents.remove(agent_id)
            self.raft.peers.remove(agent_id)
            self.memory.write(f"swarm${agent_id}$idle", True)
    
    def rebalance(self):
        """Rebalance load across active sub-hierarchy agents."""
        if not self.active_agents:
            return
        
        # Find most and least loaded agents
        loads = {a: self.workload_monitor.utilization(a) for a in self.active_agents}
        most_loaded   = max(loads, key=loads.get)
        least_loaded  = min(loads, key=loads.get)
        
        if loads[most_loaded] - loads[least_loaded] > 0.3:
            # 30% utilization gap — redistribute tasks
            tasks_to_move = self.task_queue.get_pending_for(most_loaded)[:2]
            for task in tasks_to_move:
                self.workload_distributor.reassign(task, least_loaded)
```

---

## Mesh Configuration

For analysis tasks requiring peer validation, configure mesh topology:

```python
class MeshCoordinationConfig:
    """
    Configure mesh coordination for peer-validation workloads.
    From ruflo: mesh topology with BFT consensus and gossip fanout=3.
    """
    
    def configure_analysis_mesh(self, participating_agents: list[str]) -> MeshConfig:
        return MeshConfig(
            agents=participating_agents,
            consensus="bft",
            gossip_fanout=3,
            peer_validation=True,
            quorum_strategy="hybrid",     # from consensus-frameworks/quorum-manager.md
            max_concurrent_rounds=4,       # prevent infinite peer debates
        )
    
    def activate(self, mesh_config: MeshConfig):
        """Activate mesh for this coordination context."""
        for agent_id in mesh_config.agents:
            # Each agent gets peer list (excluding self)
            peers = [a for a in mesh_config.agents if a != agent_id]
            self.gossip_protocol.configure(agent_id, peers, mode="push_pull")
            self.bft_consensus.register(agent_id, peers)
```
