# Workload Distributor

**Component:** delegation-systems/workload-distributor  
**Role:** Load balancing, utilization-aware task assignment, capacity management  
**Source Primitives:** ruflo (QuorumManager node scoring, WorkloadAnalyzer, PredictiveLoadManager)

---

## Overview

The Workload Distributor prevents hot-spots in the agent topology by distributing tasks based on measured utilization, predicted future load, and task priority. It operates between the specialist router (which selects capability-matching agents) and the adaptive delegator (which selects the best historical performer) — distributing tasks only among agents that pass both filters.

---

## Utilization Model

```python
class AgentUtilizationModel:
    """
    Tracks active task count and estimated load per agent.
    Adapted from ruflo QuorumManager node scoring (connectivity, reliability, geo diversity).
    """
    
    def __init__(self):
        self.active_tasks: dict[str, list[str]] = {}   # agent → [task_ids]
        self.task_weights: dict[str, float] = {}        # task_id → complexity weight
        self.max_concurrent: dict[str, int] = {
            # Derived from agent tier and context budget
            "exec-*":        2,    # executive agents: low concurrency, high complexity
            "arch-*":        3,
            "pm-*":          4,
            "eng-*":         5,
            "qa-*":          4,
            "delivery-*":    6,
            "analytics-*":   5,
            "governance-*":  3,
        }
    
    def utilization(self, agent_id: str) -> float:
        """0.0–1.0 utilization score."""
        active = len(self.active_tasks.get(agent_id, []))
        max_cap = self._max_concurrent(agent_id)
        weight  = sum(self.task_weights.get(t, 1.0) 
                     for t in self.active_tasks.get(agent_id, []))
        return min(weight / max(max_cap, 1), 1.0)
    
    def is_available(self, agent_id: str, task_weight: float = 1.0) -> bool:
        return self.utilization(agent_id) + (task_weight / self._max_concurrent(agent_id)) <= 1.0
    
    def on_task_start(self, agent_id: str, task_id: str, weight: float = 1.0):
        self.active_tasks.setdefault(agent_id, []).append(task_id)
        self.task_weights[task_id] = weight
    
    def on_task_complete(self, agent_id: str, task_id: str):
        if agent_id in self.active_tasks:
            self.active_tasks[agent_id] = [
                t for t in self.active_tasks[agent_id] if t != task_id
            ]
        self.task_weights.pop(task_id, None)
    
    def _max_concurrent(self, agent_id: str) -> int:
        prefix = agent_id.split("-")[0] + "-*"
        return self.max_concurrent.get(prefix, self.max_concurrent.get(agent_id, 3))
```

---

## Node Scoring (from ruflo QuorumManager)

When distributing across multiple capable agents, score each node across four dimensions:

```python
class NodeScorer:
    """
    Adapted from ruflo QuorumManager NetworkBasedStrategy node scoring.
    Original: 30% connectivity, 25% centrality, 25% reliability, 20% geo diversity.
    Enterprise adaptation: replaces geo with governance-tier.
    """
    
    WEIGHTS = {
        "availability":     0.30,   # inverse of current utilization
        "reliability":      0.25,   # historical success rate (last 20 tasks)
        "response_time":    0.25,   # inverse of average latency (normalized)
        "governance_tier":  0.20,   # higher tier = more authoritative (for tie-breaking)
    }
    
    def score(self, agent_id: str, task: Task) -> float:
        availability_score = 1.0 - self.utilization_model.utilization(agent_id)
        reliability_score  = self.tracker.success_rate(agent_id, task.task_type)
        latency_score      = self._normalize_latency(
            self.tracker.avg_latency(agent_id, task.task_type)
        )
        tier_score = self.registry.tier(agent_id) / 5.0   # normalize to 0-1
        
        return (
            self.WEIGHTS["availability"]     * availability_score +
            self.WEIGHTS["reliability"]      * reliability_score +
            self.WEIGHTS["response_time"]    * latency_score +
            self.WEIGHTS["governance_tier"]  * tier_score
        )
    
    def _normalize_latency(self, avg_seconds: float) -> float:
        """Higher score = lower latency. Cap reference at 600s."""
        return max(0, 1.0 - (avg_seconds / 600.0))
    
    def select_top_n(self, agents: list[str], task: Task, n: int = 1) -> list[str]:
        scored = [(a, self.score(a, task)) for a in agents]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [a for a, _ in scored[:n]]
```

---

## Workload Analyzer

Recommends the appropriate coordination pattern based on task properties:

```python
class WorkloadAnalyzer:
    """
    Adapted from ruflo WorkloadAnalyzer.
    Recommends topology/pattern based on task complexity, parallelizability, interdependencies.
    """
    
    def analyze(self, task: Task, available_agents: list[str]) -> WorkloadRecommendation:
        complexity         = self.complexity_scorer.score(task)
        parallelizable     = self._is_parallelizable(task)
        interdependencies  = self._count_interdependencies(task)
        agent_count        = len(available_agents)
        
        # High complexity + parallelizable → fan-out with specialist synthesis
        if complexity > 0.7 and parallelizable:
            return WorkloadRecommendation(
                pattern="fan_out",
                specialist_count=min(agent_count, 4),
                rationale="High complexity, parallelizable — multi-specialist analysis"
            )
        
        # High complexity + sequential dependencies → pipeline
        if complexity > 0.5 and interdependencies > 2:
            return WorkloadRecommendation(
                pattern="pipeline",
                specialist_count=interdependencies,
                rationale="Sequential dependencies — ordered pipeline"
            )
        
        # Moderate complexity + disagreement risk → debate
        if complexity > 0.4 and task.has_contested_assumptions:
            return WorkloadRecommendation(
                pattern="debate",
                specialist_count=2,    # 2 perspectives + judge
                rationale="Contested assumptions — multi-perspective debate"
            )
        
        # Low complexity → single specialist
        return WorkloadRecommendation(
            pattern="single",
            specialist_count=1,
            rationale="Low complexity — single specialist sufficient"
        )
    
    def _is_parallelizable(self, task: Task) -> bool:
        """Can subtasks run independently?"""
        return task.subtask_dependencies == 0 or task.decomposable
    
    def _count_interdependencies(self, task: Task) -> int:
        return len(task.upstream_dependencies) + len(task.downstream_consumers)
```

---

## Distribution Policies

```python
class DistributionPolicy:
    """Configurable load distribution policies."""
    
    POLICIES = {
        "round_robin": lambda agents, task, scorer: agents[hash(task.id) % len(agents)],
        
        "least_loaded": lambda agents, task, scorer: min(
            agents, key=lambda a: scorer.utilization_model.utilization(a)
        ),
        
        "best_fit": lambda agents, task, scorer: scorer.select_top_n(agents, task, 1)[0],
        
        "random_with_cap": lambda agents, task, scorer: random.choice([
            a for a in agents if scorer.utilization_model.is_available(a)
        ] or agents),
    }
    
    DEFAULT_POLICY = "best_fit"
    
    def select(self, policy: str, agents: list[str], task: Task, scorer: NodeScorer) -> str:
        fn = self.POLICIES.get(policy, self.POLICIES[self.DEFAULT_POLICY])
        return fn(agents, task, scorer)
```

---

## Task Queue Management

For when all agents in a capability pool are at capacity:

```python
class TaskQueue:
    """Priority queue for tasks awaiting available agent capacity."""
    
    PRIORITY_LEVELS = {
        "critical": 0,       # immediate — blocks other work
        "high":     1,       # next available slot
        "normal":   2,       # FIFO within level
        "low":      3,       # background
    }
    
    def __init__(self):
        self.queue: list[tuple[int, float, Task]] = []  # (priority, timestamp, task)
    
    def enqueue(self, task: Task, priority: str = "normal"):
        level = self.PRIORITY_LEVELS.get(priority, 2)
        heapq.heappush(self.queue, (level, time.time(), task))
    
    def dequeue_for(self, agent_id: str) -> Task | None:
        """Pop highest-priority task that this agent can handle."""
        for i, (priority, ts, task) in enumerate(self.queue):
            if self.distributor.can_assign(agent_id, task):
                self.queue.pop(i)
                heapq.heapify(self.queue)
                return task
        return None
    
    def size(self) -> int:
        return len(self.queue)
    
    def drain_timed_out(self, timeout_seconds: int = 1800) -> list[Task]:
        """Remove tasks that have been queued too long — return for escalation."""
        cutoff = time.time() - timeout_seconds
        timed_out = [t for _, ts, t in self.queue if ts < cutoff]
        self.queue = [(p, ts, t) for p, ts, t in self.queue if ts >= cutoff]
        heapq.heapify(self.queue)
        return timed_out
```
