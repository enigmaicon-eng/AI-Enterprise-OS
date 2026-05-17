# Adaptive Delegation

**Component:** delegation-systems/adaptive-delegation  
**Role:** Dynamic delegation adjusting based on performance history, outcomes, and load  
**Source Primitives:** ruflo (adaptive-coordinator: TopologyOptimizer, AdaptiveAgentAllocator, PredictiveLoadManager)

---

## Overview

Adaptive Delegation goes beyond static routing table lookups. It observes delegation outcomes over time and adjusts routing decisions to maximize success rate, minimize latency, and stay within governance constraints. The system learns which agents perform best on which task types and gradually shifts load toward high-performers.

---

## Performance Tracking

```python
class DelegationPerformanceTracker:
    """
    Rolling performance history per (agent, task_type) pair.
    Adapted from ruflo AdaptiveAgentAllocator performance scoring.
    """
    
    WINDOW_SIZE = 20   # last 20 delegations per pair
    
    def __init__(self):
        self.history: dict[tuple[str, str], deque] = {}
        self.latency_history: dict[tuple[str, str], deque] = {}
    
    def record(self, agent_id: str, task_type: str, 
               success: bool, quality_score: float, duration_seconds: float):
        key = (agent_id, task_type)
        
        if key not in self.history:
            self.history[key] = deque(maxlen=self.WINDOW_SIZE)
            self.latency_history[key] = deque(maxlen=self.WINDOW_SIZE)
        
        # Composite score: success (60%) + quality (40%)
        composite = (0.6 * float(success)) + (0.4 * quality_score)
        self.history[key].append(composite)
        self.latency_history[key].append(duration_seconds)
    
    def success_rate(self, agent_id: str, task_type: str) -> float:
        key = (agent_id, task_type)
        hist = self.history.get(key, [])
        return sum(hist) / len(hist) if hist else 0.5   # default: neutral
    
    def avg_latency(self, agent_id: str, task_type: str) -> float:
        key = (agent_id, task_type)
        hist = self.latency_history.get(key, [])
        return sum(hist) / len(hist) if hist else 300.0  # default: 5 min
    
    def is_degraded(self, agent_id: str, task_type: str) -> bool:
        return self.success_rate(agent_id, task_type) < 0.70
```

---

## Adaptive Agent Allocator

Selects the best-fit agent from a candidate pool based on capability match, performance history, and workload balance:

```python
class AdaptiveAgentAllocator:
    """
    Task assignment algorithm from ruflo hierarchical-coordinator.
    Scores candidates on compatibility + performance prediction.
    """
    
    COMPATIBILITY_WEIGHT = 0.60    # capability match weight
    PERFORMANCE_WEIGHT   = 0.40    # historical performance weight
    
    def assign(self, task: Task, candidate_agents: list[str]) -> str:
        """Select best agent from candidates for this task."""
        
        # 1. Filter to capability-capable agents
        capable = self._filter_by_capabilities(candidate_agents, task.required_capabilities)
        if not capable:
            raise NoCandidateError(f"No capable agent for {task.required_capabilities}")
        
        # 2. Score each candidate
        scores = {}
        for agent_id in capable:
            compatibility_score = self._score_compatibility(agent_id, task)
            performance_score   = self._score_performance(agent_id, task.task_type)
            workload_penalty    = self._workload_penalty(agent_id)
            
            scores[agent_id] = (
                self.COMPATIBILITY_WEIGHT * compatibility_score +
                self.PERFORMANCE_WEIGHT   * performance_score -
                workload_penalty
            )
        
        # 3. Select highest scorer
        best = max(scores, key=scores.get)
        return best
    
    def _filter_by_capabilities(self, agents: list[str], required: list[str]) -> list[str]:
        """Keep only agents that have all required capabilities."""
        result = []
        for agent_id in agents:
            agent_caps = self.registry.capabilities(agent_id)
            if all(cap in agent_caps for cap in required):
                result.append(agent_id)
        return result
    
    def _score_compatibility(self, agent_id: str, task: Task) -> float:
        """
        How well does this agent's profile match the task?
        Based on: required_capabilities overlap, authority tier adequacy, org alignment.
        """
        agent_caps = set(self.registry.capabilities(agent_id))
        task_caps  = set(task.required_capabilities)
        overlap    = len(agent_caps & task_caps) / max(len(task_caps), 1)
        tier_ok    = self.registry.tier(agent_id) >= task.minimum_tier
        return overlap * (1.0 if tier_ok else 0.0)
    
    def _score_performance(self, agent_id: str, task_type: str) -> float:
        return self.tracker.success_rate(agent_id, task_type)
    
    def _workload_penalty(self, agent_id: str) -> float:
        """Penalize over-utilized agents."""
        utilization = self.load_monitor.utilization(agent_id)
        if utilization > 0.90:   return 0.5    # heavy penalty
        if utilization > 0.70:   return 0.2    # moderate penalty
        return 0.0
```

---

## Escalation Protocol (from ruflo hierarchical-coordinator)

Three conditions trigger automatic escalation from the adaptive delegator:

```python
class EscalationProtocol:
    """
    From ruflo hierarchical-coordinator escalation rules:
    - <70% success rate → reassign to different agent
    - >90% utilization → spawn additional workers
    - Quality gates failed → rework with senior agent
    """
    
    SUCCESS_RATE_REASSIGN_THRESHOLD  = 0.70
    UTILIZATION_SPAWN_THRESHOLD      = 0.90
    
    def evaluate(self, agent_id: str, task: Task, outcome: DelegationOutcome) -> EscalationAction:
        
        # Condition 1: Success rate too low → reassign
        success_rate = self.tracker.success_rate(agent_id, task.task_type)
        if success_rate < self.SUCCESS_RATE_REASSIGN_THRESHOLD:
            alternative = self.find_alternative_agent(task, exclude=[agent_id])
            return EscalationAction(
                type="reassign",
                target_agent=alternative,
                reason=f"{agent_id} success rate {success_rate:.0%} below 70% threshold"
            )
        
        # Condition 2: Utilization too high → spawn additional capacity
        if self.load_monitor.utilization(agent_id) > self.UTILIZATION_SPAWN_THRESHOLD:
            return EscalationAction(
                type="spawn_additional",
                target_agent=agent_id,
                reason=f"{agent_id} utilization {self.load_monitor.utilization(agent_id):.0%} above 90%"
            )
        
        # Condition 3: Gate failure → escalate to senior agent
        if outcome.gate_failures:
            senior = self.find_senior_agent(task, current=agent_id)
            return EscalationAction(
                type="escalate_to_senior",
                target_agent=senior,
                reason=f"Gate failures {outcome.gate_failures} — escalating to senior agent",
                carry_context=True   # include failure context in new delegation
            )
        
        return EscalationAction(type="none")
    
    def find_senior_agent(self, task: Task, current: str) -> str:
        """Find a higher-tier agent in the same domain."""
        current_tier = self.registry.tier(current)
        domain       = self.registry.domain(current)
        
        seniors = [
            a for a in self.registry.agents_in_domain(domain)
            if self.registry.tier(a) > current_tier
        ]
        if seniors:
            return self.allocator.assign(task, seniors)
        return "master-orchestrator"   # final escalation target
```

---

## Predictive Load Management

Based on ruflo's PredictiveLoadManager — maintains a capacity buffer to handle load spikes:

```python
class PredictiveLoadManager:
    """
    Maintains 20% capacity buffer by predicting load before it arrives.
    From ruflo agent-adaptive-coordinator.
    """
    
    CAPACITY_BUFFER_PCT = 0.20   # reserve 20% capacity
    PREDICTION_WINDOW_PERIODS = 5  # predict from last 5 periods
    
    def __init__(self):
        self.load_history: dict[str, deque] = {}  # agent → recent load values
        self.predictions: dict[str, float] = {}
    
    def record_load(self, agent_id: str, load: float):
        if agent_id not in self.load_history:
            self.load_history[agent_id] = deque(maxlen=20)
        self.load_history[agent_id].append(load)
    
    def predict_load(self, agent_id: str) -> float:
        """Exponentially weighted moving average prediction."""
        hist = list(self.load_history.get(agent_id, [0.5]))
        if not hist:
            return 0.5
        alpha = 0.3   # smoothing factor
        ewma  = hist[0]
        for obs in hist[1:]:
            ewma = alpha * obs + (1 - alpha) * ewma
        return ewma
    
    def effective_capacity(self, agent_id: str) -> float:
        """Available capacity after buffer reserve."""
        predicted = self.predict_load(agent_id)
        return max(0, (1 - predicted) - self.CAPACITY_BUFFER_PCT)
    
    def should_pre_spawn(self, agent_id: str, task_type: str) -> bool:
        """Recommend spawning capacity before load arrives."""
        predicted_load = self.predict_load(agent_id)
        return predicted_load > (1 - self.CAPACITY_BUFFER_PCT)
```

---

## Topology Optimization Threshold

Adaptive delegation triggers topology reconfiguration when persistent underperformance is detected across agents of the same type:

```python
class TopologyOptimizer:
    """
    From ruflo TopologyOptimizer: 20% improvement threshold triggers switch.
    Rolling 10-period history.
    """
    
    IMPROVEMENT_THRESHOLD = 0.20   # 20% improvement must justify topology change
    EVALUATION_PERIODS    = 10     # rolling window
    
    def evaluate_topology_change(self, current: str, proposed: str) -> TopologyDecision:
        current_perf  = self.topology_performance[current][-self.EVALUATION_PERIODS:]
        proposed_perf = self.topology_performance.get(proposed, [current_perf[-1]])
        
        avg_current  = sum(current_perf)  / len(current_perf)
        avg_proposed = sum(proposed_perf) / len(proposed_perf)
        
        improvement = (avg_proposed - avg_current) / max(avg_current, 0.001)
        
        if improvement >= self.IMPROVEMENT_THRESHOLD:
            return TopologyDecision(switch=True, improvement=improvement, new_topology=proposed)
        return TopologyDecision(switch=False, improvement=improvement)
```
