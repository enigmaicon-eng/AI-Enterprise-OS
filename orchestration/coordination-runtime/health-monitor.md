# Health Monitor

**Component:** coordination-runtime/health-monitor  
**Role:** Topology health tracking, circuit breakers, rollback triggers  
**Source Primitives:** ruflo (adaptive topology, rollback triggers, topology snapshot), RT-3 circuit breakers

---

## Overview

The Health Monitor continuously evaluates the health of the coordination topology and triggers corrective actions — from soft alerts to hard topology rollbacks — based on measured performance degradation, error rate spikes, and agent failure rates.

---

## Health Metrics

```typescript
interface TopologyHealthMetrics {
  // Throughput
  tasks_completed_per_hour: number;
  tasks_failed_per_hour: number;
  average_task_duration_seconds: number;
  
  // Error rates
  agent_error_rate: number;           // 0.0–1.0
  gate_failure_rate: number;          // 0.0–1.0
  escalation_rate: number;            // 0.0–1.0
  
  // Agent health
  active_agents: number;
  suspected_failed_agents: string[];
  confirmed_failed_agents: string[];
  agent_utilization: Record<string, number>;  // 0.0–1.0 per agent
  
  // Latency
  p50_response_seconds: number;
  p95_response_seconds: number;
  p99_response_seconds: number;
  
  // Baselines (rolling 10-period)
  baseline_throughput: number;
  baseline_error_rate: number;
  baseline_failure_rate: number;
}
```

---

## Circuit Breakers

Five circuit breaker types adapted from RT-3 specification, protecting the coordination mesh from cascading failures:

### 1. Agent Circuit Breaker

Protects against calling a consistently failing agent:

```python
class AgentCircuitBreaker:
    """Opens when agent error rate exceeds threshold."""
    
    FAILURE_THRESHOLD = 0.5      # 50% failure rate triggers OPEN
    SUCCESS_THRESHOLD = 0.8      # 80% success rate closes HALF-OPEN
    OPEN_TIMEOUT_S = 60          # wait before trying HALF-OPEN
    
    STATES = ["CLOSED", "OPEN", "HALF_OPEN"]
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.state = "CLOSED"
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = 0
        self.window = deque(maxlen=20)   # rolling 20 calls
    
    def call_permitted(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.OPEN_TIMEOUT_S:
                self.state = "HALF_OPEN"
                return True
            return False
        return True   # HALF_OPEN: permit one probe call
    
    def record_success(self):
        self.window.append(True)
        if self.state == "HALF_OPEN":
            success_rate = sum(self.window) / len(self.window)
            if success_rate >= self.SUCCESS_THRESHOLD:
                self.state = "CLOSED"
    
    def record_failure(self):
        self.window.append(False)
        self.last_failure_time = time.time()
        failure_rate = 1 - (sum(self.window) / len(self.window))
        if failure_rate >= self.FAILURE_THRESHOLD:
            self.state = "OPEN"
            self._publish_alert(severity="high")
```

### 2. Gate Circuit Breaker

Halts workflow pipeline when gate failure rate is unsustainable:

```python
class GateCircuitBreaker:
    """Opens when a specific gate is failing repeatedly."""
    
    GATE_FAILURE_THRESHOLD = 0.6   # 60% failure → circuit open
    
    def __init__(self, gate_id: str):
        self.gate_id = gate_id
        self.state = "CLOSED"
        self.window = deque(maxlen=10)
    
    def evaluate(self, result: bool) -> bool:
        """Record gate result. Returns False if circuit now open."""
        self.window.append(result)
        failure_rate = 1 - (sum(self.window) / len(self.window))
        if failure_rate >= self.GATE_FAILURE_THRESHOLD:
            self.state = "OPEN"
            return False
        return True
```

### 3. Escalation Circuit Breaker

Prevents escalation storms — when too many items are escalating to the same authority:

```python
class EscalationCircuitBreaker:
    """Opens when escalation rate to a specific tier exceeds capacity."""
    
    MAX_CONCURRENT_ESCALATIONS = 3   # per authority tier
    ESCALATION_RATE_THRESHOLD = 0.3  # 30% of tasks escalating → circuit open
    
    def __init__(self, tier: str):
        self.tier = tier
        self.active_escalations = 0
        self.escalation_window = deque(maxlen=20)
    
    def can_escalate(self) -> bool:
        if self.active_escalations >= self.MAX_CONCURRENT_ESCALATIONS:
            return False
        rate = sum(self.escalation_window) / max(len(self.escalation_window), 1)
        return rate < self.ESCALATION_RATE_THRESHOLD
```

### 4. Debate Circuit Breaker

Prevents infinite debate loops when rounds consistently fail to produce convergence:

```python
class DebateCircuitBreaker:
    """Opens when debate rounds consistently hit max without resolution."""
    
    MAX_INCONCLUSIVE_DEBATES = 3   # consecutive → circuit open
    
    def __init__(self):
        self.inconclusive_count = 0
    
    def on_debate_result(self, conclusive: bool):
        if conclusive:
            self.inconclusive_count = 0
        else:
            self.inconclusive_count += 1
            if self.inconclusive_count >= self.MAX_INCONCLUSIVE_DEBATES:
                self._force_arbitrary_resolution()
```

### 5. Memory Circuit Breaker

Prevents coordination state from being written when memory is degraded:

```python
class MemoryCircuitBreaker:
    """Falls back to in-memory state when persistence layer is unavailable."""
    
    def write(self, key: str, value: any) -> bool:
        try:
            return self.memory_backend.write(key, value)
        except Exception:
            self.state = "OPEN"
            self.in_memory_fallback[key] = value
            self._schedule_retry()
            return False
```

---

## Topology Rollback

### Snapshot Protocol

Before any topology change, the system takes a snapshot:

```python
class TopologySnapshot:
    """Point-in-time snapshot of coordination topology."""
    
    def capture(self, topology: dict) -> str:
        snapshot = {
            "timestamp": time.time(),
            "topology_type": topology["type"],       # hierarchical / mesh / ring / hybrid
            "agent_assignments": dict(topology["assignments"]),
            "routing_table": dict(topology["routing"]),
            "health_metrics": self.health_monitor.current_metrics(),
            "active_workflows": list(topology["active_workflows"]),
        }
        snapshot_id = f"snapshot-{snapshot['timestamp']:.0f}"
        self.snapshots[snapshot_id] = snapshot
        return snapshot_id
    
    def restore(self, snapshot_id: str) -> dict:
        return self.snapshots[snapshot_id]
```

### Rollback Triggers (from ruflo adaptive-coordinator)

Three conditions automatically trigger topology rollback:

```python
class RollbackController:
    """Monitors for rollback trigger conditions."""
    
    THROUGHPUT_DEGRADATION_THRESHOLD = 0.25  # 25% drop from baseline
    ERROR_RATE_INCREASE_THRESHOLD    = 0.15  # 15% increase in error rate
    AGENT_FAILURE_RATE_THRESHOLD     = 0.30  # 30% agents failed/suspected
    
    def evaluate_rollback(self, metrics: TopologyHealthMetrics) -> RollbackDecision:
        baseline = self.baseline_metrics
        
        # Trigger 1: Throughput degradation
        throughput_delta = (baseline.tasks_completed_per_hour - 
                           metrics.tasks_completed_per_hour) / baseline.tasks_completed_per_hour
        
        # Trigger 2: Error rate increase
        error_delta = metrics.agent_error_rate - baseline.agent_error_rate
        
        # Trigger 3: Agent failure rate
        total_agents = metrics.active_agents + len(metrics.confirmed_failed_agents)
        failure_rate = len(metrics.confirmed_failed_agents) / max(total_agents, 1)
        
        triggered = []
        if throughput_delta > self.THROUGHPUT_DEGRADATION_THRESHOLD:
            triggered.append(f"throughput_degradation:{throughput_delta:.1%}")
        if error_delta > self.ERROR_RATE_INCREASE_THRESHOLD:
            triggered.append(f"error_rate_increase:{error_delta:.1%}")
        if failure_rate > self.AGENT_FAILURE_RATE_THRESHOLD:
            triggered.append(f"agent_failure_rate:{failure_rate:.1%}")
        
        if triggered:
            return RollbackDecision(should_rollback=True, triggers=triggered)
        return RollbackDecision(should_rollback=False)
    
    def execute_rollback(self, snapshot_id: str):
        snapshot = self.snapshots.restore(snapshot_id)
        self.topology_manager.apply(snapshot["routing_table"])
        self.topology_manager.reassign_agents(snapshot["agent_assignments"])
        self.publish("health.alert", HealthEvent(
            severity="warning",
            message=f"Topology rolled back to snapshot {snapshot_id}"
        ))
```

---

## Health Check Schedule

```
HEALTH MONITORING SCHEDULE
──────────────────────────
Every 30s:  Agent heartbeat collection
Every 60s:  Circuit breaker state evaluation
Every 5min: Topology health metrics aggregation
Every 5min: Rollback trigger evaluation (from RT-3 governance monitor)
Every 1hr:  Baseline metrics recalculation (rolling 10-period)
On event:   Circuit breaker open/close transitions → publish health.alert
On event:   Agent failure confirmed → trigger fan-out reassignment
On event:   Rollback triggered → snapshot restore + health.alert published
```

---

## Alert Severity Levels

| Severity | Condition | Action |
|----------|-----------|--------|
| `info` | Normal variation, no action | Log only |
| `warning` | Degradation detected, monitoring | Notify Delivery Manager |
| `high` | Circuit breaker opened | Notify Orchestrator + Governance |
| `critical` | Rollback triggered | Notify all active agents + Human escalation |
| `constitutional` | §6.3 or §7.1 violation detected | Immediate halt + Human notification (H-007) |
