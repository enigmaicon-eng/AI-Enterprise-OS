# Quorum Manager

**Component:** consensus-frameworks/quorum-manager  
**Role:** Quorum strategies — Network / Performance / Fault-Tolerance / Hybrid  
**Source Primitives:** ruflo (agent-quorum-manager: 4 strategies, node scoring, fault scenario analysis)

---

## Overview

The Quorum Manager determines how many agents must agree before a decision is considered valid. It implements four strategies from ruflo's production quorum manager, adapted for the Enterprise AI OS's agent topology. Strategy selection depends on the decision's risk profile, performance requirements, and fault tolerance needs.

---

## Strategy 1: Network-Based (Default for Cross-Org Decisions)

Selects quorum members based on connectivity and reliability — ensures representative coverage across the agent topology:

```python
class NetworkBasedQuorumStrategy:
    """
    From ruflo QuorumManager NetworkBasedStrategy.
    Ensures quorum has Byzantine safety margin (>2/3 nodes).
    Node scoring: 30% connectivity, 25% centrality, 25% reliability, 20% geo diversity.
    Enterprise adaptation: replaces geo with org diversity.
    """
    
    WEIGHTS = {
        "connectivity":   0.30,   # how many agents this agent regularly coordinates with
        "centrality":     0.25,   # position in the coordination graph
        "reliability":    0.25,   # historical availability and success rate
        "org_diversity":  0.20,   # penalize same-org concentration
    }
    
    def select_quorum(self, candidates: list[str], decision: Decision) -> list[str]:
        n = len(candidates)
        min_quorum = max(
            (2 * n) // 3 + 1,          # Byzantine minimum (>2/3)
            self._partition_minimum(n)  # tolerate network partition
        )
        
        scored = self._score_nodes(candidates, decision)
        return [a for a, _ in scored[:min_quorum]]
    
    def _score_nodes(self, agents: list[str], decision: Decision) -> list[tuple[str, float]]:
        scores = []
        orgs_in_quorum = set()
        
        for agent_id in agents:
            connectivity = self._compute_connectivity(agent_id)
            centrality   = self._compute_centrality(agent_id)
            reliability  = self.tracker.success_rate(agent_id, decision.domain)
            
            # Org diversity: penalize if too many agents from same org
            agent_org   = self.registry.org(agent_id)
            org_penalty = 0.3 if agent_org in orgs_in_quorum else 0.0
            org_diversity = 1.0 - org_penalty
            
            score = (
                self.WEIGHTS["connectivity"]  * connectivity +
                self.WEIGHTS["centrality"]    * centrality +
                self.WEIGHTS["reliability"]   * reliability +
                self.WEIGHTS["org_diversity"] * org_diversity
            )
            scores.append((agent_id, score))
        
        return sorted(scores, key=lambda x: x[1], reverse=True)
    
    def _partition_minimum(self, n: int) -> int:
        """Minimum quorum that survives a network partition of up to n//3 nodes."""
        return n // 2 + 1
    
    def _compute_connectivity(self, agent_id: str) -> float:
        """Fraction of active coordination channels this agent participates in."""
        peer_count = len(self.coordination_graph.neighbors(agent_id))
        max_peers  = len(self.coordination_graph.nodes()) - 1
        return peer_count / max(max_peers, 1)
    
    def _compute_centrality(self, agent_id: str) -> float:
        """Betweenness centrality normalized to [0, 1]."""
        return self.centrality_cache.get(agent_id, 0.5)
```

---

## Strategy 2: Performance-Based (For Latency-Sensitive Decisions)

Selects agents that minimize decision latency while maintaining accuracy:

```python
class PerformanceBasedQuorumStrategy:
    """
    From ruflo PerformanceBasedStrategy.
    Optimizes for throughput (throughput-optimal) or latency (latency-optimal).
    """
    
    def select_quorum(self, candidates: list[str], decision: Decision, 
                      optimize_for: str = "latency") -> list[str]:
        
        if optimize_for == "throughput":
            return self._throughput_optimal_quorum(candidates, decision)
        return self._latency_optimal_quorum(candidates, decision)
    
    def _latency_optimal_quorum(self, candidates: list[str], decision: Decision) -> list[str]:
        """Select smallest valid quorum with lowest expected latency."""
        min_size = self._minimum_quorum_size(len(candidates))
        
        scored = []
        for agent_id in candidates:
            latency_score   = 1.0 / max(self.tracker.avg_latency(agent_id, decision.domain), 0.1)
            bandwidth_score = self._normalize_bandwidth(agent_id)
            memory_score    = 1.0 - self.load_monitor.utilization(agent_id)
            historical      = self.tracker.success_rate(agent_id, decision.domain)
            
            score = (latency_score * 0.35 + bandwidth_score * 0.20 + 
                     memory_score * 0.25 + historical * 0.20)
            scored.append((agent_id, score))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return [a for a, _ in scored[:min_size]]
    
    def _throughput_optimal_quorum(self, candidates: list[str], decision: Decision) -> list[str]:
        """Select quorum that maximizes parallel decision throughput."""
        min_size = self._minimum_quorum_size(len(candidates))
        
        scored = []
        for agent_id in candidates:
            throughput = self._compute_throughput(agent_id)
            availability = 1.0 - self.load_monitor.utilization(agent_id)
            reliability  = self.tracker.success_rate(agent_id, decision.domain)
            score = throughput * 0.5 + availability * 0.3 + reliability * 0.2
            scored.append((agent_id, score))
        
        scored.sort(key=lambda x: x[1], reverse=True)
        return [a for a, _ in scored[:min_size]]
    
    def _minimum_quorum_size(self, n: int) -> int:
        return n // 2 + 1
```

---

## Strategy 3: Fault-Tolerance-Based (For Critical Decisions)

Selects quorum to maximize coverage of anticipated fault scenarios:

```python
class FaultToleranceQuorumStrategy:
    """
    From ruflo FaultToleranceStrategy.
    Analyzes fault scenarios and greedily selects agents that maximize coverage.
    """
    
    FAULT_SCENARIOS = [
        "single_agent_failure",
        "multiple_agent_failure",
        "network_partition",
        "correlated_failure",      # agents from same org failing together
    ]
    
    def select_quorum(self, candidates: list[str], decision: Decision) -> list[str]:
        fault_scenarios = self._analyze_fault_scenarios(candidates)
        return self._greedy_fault_coverage(candidates, fault_scenarios)
    
    def _analyze_fault_scenarios(self, agents: list[str]) -> list[FaultScenario]:
        scenarios = []
        
        # Single failure scenarios
        for agent_id in agents:
            scenarios.append(FaultScenario(
                type="single_agent_failure",
                failed_agents=[agent_id],
                probability=self._failure_probability(agent_id),
            ))
        
        # Correlated failure: same org
        orgs = self._group_by_org(agents)
        for org, org_agents in orgs.items():
            if len(org_agents) > 1:
                scenarios.append(FaultScenario(
                    type="correlated_failure",
                    failed_agents=org_agents,
                    probability=0.1 * len(org_agents),   # rough estimate
                ))
        
        # Network partition: org boundary
        scenarios.append(FaultScenario(
            type="network_partition",
            failed_agents=agents[:len(agents)//3],
            probability=0.05,
        ))
        
        return scenarios
    
    def _greedy_fault_coverage(self, agents: list[str], 
                                scenarios: list[FaultScenario]) -> list[str]:
        """
        Greedy set cover: add agent that covers the most uncovered scenarios.
        From ruflo: greedy selection for fault coverage.
        """
        selected   = []
        covered    = set()
        remaining  = list(agents)
        
        while remaining and len(covered) < len(scenarios):
            best_agent = None
            best_cover = 0
            
            for agent_id in remaining:
                newly_covered = sum(
                    1 for i, s in enumerate(scenarios)
                    if i not in covered and agent_id not in s.failed_agents
                )
                if newly_covered > best_cover:
                    best_cover = newly_covered
                    best_agent = agent_id
            
            if best_agent:
                selected.append(best_agent)
                remaining.remove(best_agent)
                covered.update(
                    i for i, s in enumerate(scenarios)
                    if best_agent not in s.failed_agents
                )
        
        # Ensure Byzantine minimum
        min_quorum = (2 * len(agents)) // 3 + 1
        if len(selected) < min_quorum:
            for a in remaining:
                if len(selected) >= min_quorum:
                    break
                if a not in selected:
                    selected.append(a)
        
        return selected
```

---

## Strategy 4: Hybrid (Recommended Default)

Combines all three strategies with weighted scoring:

```python
class HybridQuorumStrategy:
    """
    Combines network, performance, and fault-tolerance signals.
    Recommended for most enterprise consensus decisions.
    """
    
    STRATEGY_WEIGHTS = {
        "network":        0.35,
        "performance":    0.30,
        "fault_tolerance": 0.35,
    }
    
    def select_quorum(self, candidates: list[str], decision: Decision) -> list[str]:
        network_scores    = dict(self.network_strategy._score_nodes(candidates, decision))
        performance_scores = self._performance_scores(candidates, decision)
        ft_scores         = self._fault_coverage_scores(candidates, decision)
        
        combined = {}
        for agent_id in candidates:
            combined[agent_id] = (
                self.STRATEGY_WEIGHTS["network"]         * network_scores.get(agent_id, 0) +
                self.STRATEGY_WEIGHTS["performance"]     * performance_scores.get(agent_id, 0) +
                self.STRATEGY_WEIGHTS["fault_tolerance"] * ft_scores.get(agent_id, 0)
            )
        
        min_quorum = (2 * len(candidates)) // 3 + 1
        sorted_agents = sorted(combined, key=combined.get, reverse=True)
        return sorted_agents[:min_quorum]
```

---

## Strategy Selection Guide

```python
def select_quorum_strategy(decision: Decision) -> str:
    if decision.reversibility == "irreversible":
        return "fault_tolerance"   # maximize safety for irreversible decisions
    if decision.latency_budget_seconds < 60:
        return "performance"       # latency-sensitive
    if decision.crosses_org_boundary:
        return "network"           # ensure cross-org representation
    return "hybrid"                # default
```
