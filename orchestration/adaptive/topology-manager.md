# Topology Manager

**Component:** adaptive-orchestration/topology-manager  
**Role:** Adaptive topology switching, snapshot/rollback, performance-driven reconfiguration  
**Source Primitives:** ruflo (agent-adaptive-coordinator: TopologyOptimizer, TopologyRollback, WorkloadAnalyzer, AdaptiveAgentAllocator)

---

## Overview

The Topology Manager continuously monitors coordination performance and reconfigures the agent topology when the current arrangement is underperforming. It switches between hierarchical, mesh, ring, and hybrid topologies based on measured throughput, error rates, and agent utilization — always maintaining constitutional safety and rollback capability.

---

## Topology Definitions

```python
@dataclass
class TopologyConfig:
    """Configuration for a specific topology arrangement."""
    
    topology_type: str   # hierarchical / mesh / ring / hybrid / adaptive
    
    # Hierarchical: clear leader/follower structure
    # coordinator → [worker_pool] → [specialist_pool]
    hierarchical: dict = field(default_factory=lambda: {
        "coordinator": "master-orchestrator",
        "max_workers": 8,
        "strategy": "specialized",    # specialized / balanced / load-aware
        "consensus": "raft",          # raft / bft / gossip
    })
    
    # Mesh: fully connected, peer validation
    # All agents can communicate directly
    mesh: dict = field(default_factory=lambda: {
        "peer_validation": True,
        "consensus": "bft",
        "fanout": 3,                  # gossip fanout
    })
    
    # Ring: ordered processing pipeline
    # agent[0] → agent[1] → ... → agent[n] → output
    ring: dict = field(default_factory=lambda: {
        "sequence": [],               # ordered agent list
        "backpressure": True,         # slow node slows entire ring
    })
    
    # Hybrid: governance in hierarchy, analysis in mesh
    hybrid: dict = field(default_factory=lambda: {
        "governance_topology": "hierarchical",
        "analysis_topology": "mesh",
        "execution_topology": "hierarchical",
    })
```

---

## Topology Optimizer (from ruflo)

Determines when a topology change improves performance by at least 20%:

```python
class TopologyOptimizer:
    """
    From ruflo TopologyOptimizer: 20% improvement threshold, 10-period rolling history.
    """
    
    IMPROVEMENT_THRESHOLD = 0.20   # 20% improvement justifies switching
    EVALUATION_PERIODS    = 10     # rolling window for comparison
    
    def __init__(self):
        self.performance_history: dict[str, deque] = {}   # topology → [scores]
        self.current_topology = "hierarchical"
    
    def record_performance(self, topology: str, score: float):
        if topology not in self.performance_history:
            self.performance_history[topology] = deque(maxlen=self.EVALUATION_PERIODS)
        self.performance_history[topology].append(score)
    
    def evaluate_topology_change(self) -> TopologyDecision:
        current_avg = self._avg_performance(self.current_topology)
        
        best_alternative = None
        best_improvement = 0.0
        
        for topology, history in self.performance_history.items():
            if topology == self.current_topology:
                continue
            if len(history) < 3:
                continue   # insufficient data to evaluate
            
            alt_avg     = self._avg_performance(topology)
            improvement = (alt_avg - current_avg) / max(current_avg, 0.001)
            
            if improvement > best_improvement:
                best_improvement  = improvement
                best_alternative  = topology
        
        if best_improvement >= self.IMPROVEMENT_THRESHOLD and best_alternative:
            return TopologyDecision(
                switch=True,
                from_topology=self.current_topology,
                to_topology=best_alternative,
                improvement=best_improvement,
                reason=f"{best_improvement:.0%} improvement over {self.EVALUATION_PERIODS}-period average"
            )
        
        return TopologyDecision(switch=False, improvement=best_improvement)
    
    def _avg_performance(self, topology: str) -> float:
        history = self.performance_history.get(topology, [])
        if not history:
            return 0.5
        window = list(history)[-self.EVALUATION_PERIODS:]
        return sum(window) / len(window)
```

---

## Topology Rollback (from ruflo)

Three trigger conditions automatically roll back a topology change:

```python
class TopologyRollbackController:
    """
    From ruflo agent-adaptive-coordinator TopologyRollback.
    Trigger conditions: 25% degradation, 15% error rate increase, 30% failure rate.
    """
    
    THROUGHPUT_DEGRADATION_THRESHOLD = 0.25   # 25% throughput drop
    ERROR_RATE_INCREASE_THRESHOLD    = 0.15   # 15% error rate increase
    FAILURE_RATE_THRESHOLD           = 0.30   # 30% agents failed/suspected
    
    def __init__(self):
        self.snapshots: dict[str, TopologySnapshot] = {}
        self.current_snapshot_id: str | None = None
    
    def take_snapshot(self, topology: TopologyConfig, metrics: dict) -> str:
        """Capture topology state before any change."""
        snapshot_id = f"snap-{time.time():.0f}"
        self.snapshots[snapshot_id] = TopologySnapshot(
            id=snapshot_id,
            topology=topology,
            metrics_at_capture=dict(metrics),
            taken_at=time.time(),
        )
        self.current_snapshot_id = snapshot_id
        return snapshot_id
    
    def evaluate_rollback(self, pre_change_metrics: dict, 
                          current_metrics: dict) -> RollbackDecision:
        """Check if current performance warrants rolling back to snapshot."""
        
        # Trigger 1: Throughput degradation > 25%
        tp_baseline = pre_change_metrics.get("tasks_per_hour", 1)
        tp_current  = current_metrics.get("tasks_per_hour", 1)
        tp_delta    = (tp_baseline - tp_current) / max(tp_baseline, 1)
        
        # Trigger 2: Error rate increase > 15%
        err_baseline = pre_change_metrics.get("error_rate", 0)
        err_current  = current_metrics.get("error_rate", 0)
        err_delta    = err_current - err_baseline
        
        # Trigger 3: Agent failure rate > 30%
        total_agents    = current_metrics.get("total_agents", 1)
        failed_agents   = len(current_metrics.get("confirmed_failed_agents", []))
        failure_rate    = failed_agents / max(total_agents, 1)
        
        triggers = []
        if tp_delta    > self.THROUGHPUT_DEGRADATION_THRESHOLD:
            triggers.append(f"throughput_degradation:{tp_delta:.0%}")
        if err_delta   > self.ERROR_RATE_INCREASE_THRESHOLD:
            triggers.append(f"error_rate_increase:{err_delta:.0%}")
        if failure_rate > self.FAILURE_RATE_THRESHOLD:
            triggers.append(f"agent_failure_rate:{failure_rate:.0%}")
        
        if triggers:
            return RollbackDecision(
                should_rollback=True, triggers=triggers,
                restore_to=self.current_snapshot_id,
            )
        return RollbackDecision(should_rollback=False)
    
    def execute_rollback(self, snapshot_id: str) -> bool:
        """Restore topology from snapshot."""
        snapshot = self.snapshots.get(snapshot_id)
        if not snapshot:
            return False
        
        self.topology_applier.apply(snapshot.topology)
        self.event_bus.publish("health.alert", HealthEvent(
            severity="warning",
            message=f"Topology rolled back to snapshot {snapshot_id} due to performance degradation"
        ))
        return True
```

---

## Workload-Based Topology Recommendation

```python
class WorkloadTopologyAdvisor:
    """
    Recommend topology based on current workload characteristics.
    From ruflo WorkloadAnalyzer: complexity, parallelizability, interdependencies.
    """
    
    def recommend(self, workload: WorkloadProfile) -> str:
        complexity        = workload.avg_task_complexity
        parallelizable_pct = workload.parallelizable_task_pct
        interdependencies = workload.avg_interdependencies
        
        # High complexity, low parallelizability → hierarchical (clear authority)
        if complexity > 0.7 and parallelizable_pct < 0.4:
            return "hierarchical"
        
        # High parallelizability, many peer interactions → mesh
        if parallelizable_pct > 0.7 and interdependencies < 2:
            return "mesh"
        
        # Clear sequential dependencies → ring
        if interdependencies > 3 and parallelizable_pct < 0.3:
            return "ring"
        
        # Mixed workload → hybrid
        return "hybrid"
```

---

## Topology Switch Protocol

```
TOPOLOGY SWITCH PROTOCOL
──────────────────────────────────────────────────────────
1. EVALUATE    ← TopologyOptimizer: 20% improvement threshold met?
      ↓ yes
2. SNAPSHOT    ← Capture current topology state
      ↓
3. DRAIN       ← Wait for in-flight tasks to complete (or timeout 60s)
      ↓
4. SWITCH      ← Apply new topology configuration
      ↓
5. MONITOR     ← Track performance for 10 periods
      ↓
   ┌──────────────────────────────────────┐
   │ Performance triggers:                │
   │ • 25% throughput drop → rollback     │
   │ • 15% error rate increase → rollback │
   │ • 30% agent failure → rollback       │
   └──────────────────────────────────────┘
      ↓ (none triggered)
6. COMMIT      ← New topology becomes current baseline
```
