# Operational Continuity

**Component:** adaptive-orchestration/operational-continuity  
**Role:** Self-healing, circuit breaker integration, autonomous recovery protocols  
**Source Primitives:** ruflo (circuit breakers, health monitor, topology rollback), TradingAgents (Propagator recovery), RT-2 Saga Coordinator

---

## Overview

Operational Continuity ensures the coordination runtime remains available and correct even under agent failures, topology degradation, context resets, and cascading circuit breaker opens. It integrates all the recovery mechanisms from the coordination stack into a unified self-healing loop.

---

## Self-Healing Architecture

```
SELF-HEALING LAYERS
──────────────────────────────────────────────────────────
Layer 1: Circuit Breakers (coordination-runtime/health-monitor.md)
  → Opens when agent failure rate > threshold
  → Prevents cascading failure by stopping calls to failed agents
  → Half-opens after timeout to test recovery

Layer 2: Topology Rollback (adaptive-orchestration/topology-manager.md)
  → Rolls back topology when performance degrades
  → Restores from snapshot if 3 trigger conditions fire

Layer 3: Task Redistribution
  → Redistributes tasks from failed agents to healthy alternatives
  → Maintains task queue continuity

Layer 4: Workflow Recovery (organizational-synchronization/execution-continuity.md)
  → Recovers interrupted workflows from persisted state
  → Injects past_context to resume with full decision context

Layer 5: Saga Compensation (RT-2 Saga Coordinator)
  → Compensates for partial failures in multi-step workflows
  → Rolls back completed steps when a downstream step fails irreversibly
```

---

## Saga Coordinator (from RT-2)

For multi-step workflows where partial completion requires compensation:

```python
class SagaCoordinator:
    """
    From RT-2 specification: Saga Coordinator with compensation steps.
    Handles partial failures in multi-agent workflows.
    """
    
    def __init__(self):
        self.active_sagas: dict[str, SagaState] = {}
    
    def begin_saga(self, workflow_id: str, steps: list[SagaStep]) -> str:
        """Start a saga — a sequence of steps with compensation actions."""
        saga = SagaState(
            saga_id=workflow_id,
            steps=steps,
            completed_steps=[],
            status="running",
            started_at=time.time(),
        )
        self.active_sagas[workflow_id] = saga
        return workflow_id
    
    def record_step_completion(self, saga_id: str, step_id: str, result: any):
        """Record successful step — enables compensation if later steps fail."""
        saga = self.active_sagas[saga_id]
        saga.completed_steps.append(CompletedStep(
            step_id=step_id,
            result=result,
            completed_at=time.time(),
        ))
    
    def handle_step_failure(self, saga_id: str, failed_step_id: str, 
                            error: Exception) -> RecoveryAction:
        """
        On step failure: decide whether to retry, skip, or compensate.
        """
        saga = self.active_sagas[saga_id]
        failed_step = next(s for s in saga.steps if s.id == failed_step_id)
        
        # Retry: step is idempotent and failure is transient
        if failed_step.retry_count < failed_step.max_retries and self._is_transient(error):
            failed_step.retry_count += 1
            return RecoveryAction(type="retry", step_id=failed_step_id)
        
        # Skip: step is optional
        if failed_step.optional:
            saga.skipped_steps.append(failed_step_id)
            return RecoveryAction(type="skip", step_id=failed_step_id)
        
        # Compensate: required step failed → roll back completed steps
        if failed_step.compensation_required:
            return self._compensate(saga)
        
        # Fail saga: no compensation possible
        saga.status = "failed"
        return RecoveryAction(type="fail_saga", saga_id=saga_id, error=str(error))
    
    def _compensate(self, saga: SagaState) -> RecoveryAction:
        """Execute compensation actions in reverse order."""
        saga.status = "compensating"
        compensation_actions = []
        
        for completed_step in reversed(saga.completed_steps):
            step = next(s for s in saga.steps if s.id == completed_step.step_id)
            if step.compensation_action:
                compensation_actions.append(CompensationAction(
                    step_id=completed_step.step_id,
                    action=step.compensation_action,
                    data=completed_step.result,   # use original result for reversal
                ))
        
        return RecoveryAction(
            type="compensate",
            compensation_actions=compensation_actions,
        )
```

---

## Task Redistribution on Agent Failure

```python
class FailureRedistributor:
    """
    When an agent fails (circuit breaker opens), redistribute its in-flight tasks.
    """
    
    def redistribute(self, failed_agent: str) -> RedistributionResult:
        """
        Find all tasks assigned to failed agent and reassign to healthy alternatives.
        """
        in_flight = self.workload_monitor.get_active_tasks(failed_agent)
        reassignments = []
        failed = []
        
        for task in in_flight:
            # Find alternative capable agent
            candidates = self.specialist_router.route(task.intent, RoutingContext()).agents
            healthy_candidates = [
                a for a in candidates 
                if a != failed_agent and not self.circuit_breakers[a].state == "OPEN"
            ]
            
            if healthy_candidates:
                best = self.workload_distributor.node_scorer.select_top_n(
                    healthy_candidates, task, n=1
                )[0]
                self.task_reassigner.reassign(task, from_agent=failed_agent, to_agent=best)
                reassignments.append((task.id, best))
            else:
                # No healthy alternative — queue for when agent recovers
                self.task_queue.enqueue(task, priority="high")
                failed.append(task.id)
        
        return RedistributionResult(
            redistributed=reassignments,
            queued=failed,
            failed_agent=failed_agent,
        )
```

---

## Cascading Failure Prevention

```python
class CascadingFailureGuard:
    """
    Prevent a single agent failure from cascading through the topology.
    Integrates circuit breakers, redistribution, and topology rollback.
    """
    
    def on_agent_failure(self, failed_agent: str):
        """Coordinated response to agent failure."""
        
        # Step 1: Open circuit breaker immediately
        self.circuit_breakers[failed_agent].state = "OPEN"
        
        # Step 2: Redistribute in-flight tasks
        redistribution = self.redistributor.redistribute(failed_agent)
        
        # Step 3: Remove from gossip membership
        self.gossip_protocol.on_failure(failed_agent)
        
        # Step 4: Update Raft membership (if leader)
        if self.raft.state == "leader":
            self.raft.remove_member(failed_agent)
        
        # Step 5: Check if topology health is below threshold
        metrics = self.metrics_collector.collect()
        if self.rollback_controller.evaluate_rollback(
            self.baseline_metrics, metrics
        ).should_rollback:
            self.topology_manager.execute_rollback(
                self.rollback_controller.current_snapshot_id
            )
        
        # Step 6: Publish health alert
        self.event_bus.publish("health.alert", HealthEvent(
            agent=failed_agent,
            severity="high" if redistribution.redistributed else "critical",
            message=f"Agent {failed_agent} failed. "
                   f"Redistributed {len(redistribution.redistributed)} tasks, "
                   f"queued {len(redistribution.queued)} tasks."
        ))
```

---

## Recovery Verification

After any recovery action, verify the system is in a consistent state:

```python
class RecoveryVerifier:
    """Verify coordination state is consistent after recovery."""
    
    def verify(self, workflow_id: str) -> VerificationResult:
        state = self.memory.load(f"swarm${workflow_id}$state")
        if not state:
            return VerificationResult(consistent=False, reason="No state found")
        
        issues = []
        
        # Check: vector clock is non-decreasing
        clock = state.get("vector_clock", {})
        if any(v < 0 for v in clock.values()):
            issues.append("Negative vector clock component")
        
        # Check: gates_passed is a subset of gates_required
        required = set(state.get("gates_required", []))
        passed   = set(state.get("gates_passed", []))
        if not passed.issubset(required):
            issues.append(f"Gates passed not subset of required: {passed - required}")
        
        # Check: debate count is non-negative
        debate_count = state.get("debate_state", {}).get("count", 0)
        if debate_count < 0:
            issues.append("Negative debate count")
        
        # Check: no constitutional violations in pending actions
        for action in state.get("pending_actions", []):
            result = self.constitutional_guard.check(action)
            if result.blocked:
                issues.append(f"Constitutional violation in pending action: {action}")
        
        return VerificationResult(
            consistent=len(issues) == 0,
            issues=issues,
            workflow_id=workflow_id,
        )
```

---

## Operational Status Dashboard

```python
@dataclass
class OperationalStatus:
    """Real-time operational status of the coordination runtime."""
    
    # Circuit breakers
    open_circuit_breakers: list[str]   # agents with open circuit breakers
    half_open_probes: list[str]        # agents in half-open state
    
    # Topology
    current_topology: str
    topology_healthy: bool
    last_topology_change: str
    rollback_available: bool
    
    # Workflows
    active_workflows: int
    pending_approvals: int
    stalled_workflows: int
    
    # Agents
    healthy_agents: int
    degraded_agents: int
    failed_agents: list[str]
    
    # Sagas
    active_sagas: int
    compensating_sagas: int
    
    # Overall
    overall_health: str   # healthy / degraded / critical / down

def get_operational_status() -> OperationalStatus:
    """Collect real-time operational status."""
    breakers = {a: cb for a, cb in circuit_breakers.items()}
    return OperationalStatus(
        open_circuit_breakers=[a for a, cb in breakers.items() if cb.state == "OPEN"],
        half_open_probes=[a for a, cb in breakers.items() if cb.state == "HALF_OPEN"],
        current_topology=topology_manager.current_topology,
        topology_healthy=not topology_manager.rollback_controller.evaluate_rollback(
            topology_manager.baseline_metrics, metrics_collector.collect()
        ).should_rollback,
        # ... rest of fields
        overall_health=_compute_overall_health(),
    )
```
