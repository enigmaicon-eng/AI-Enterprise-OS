# Autonomous Coordinator

**Component:** adaptive-orchestration/autonomous-coordinator  
**Role:** Autonomous decision loops, RT-3 governance monitor, constitution-aware reasoning  
**Source Primitives:** ruflo (SONA self-optimization, governance monitor, 12 background workers), architecture/runtime-evolution-roadmap.md RT-3

---

## Overview

The Autonomous Coordinator is the operational brain of the adaptive orchestration layer. It runs continuous decision loops — scheduling work, monitoring health, enforcing governance, and optimizing coordination — without requiring human orchestration for every step. It is constitutionally bounded: 13 prohibited actions are enforced at entry, and all autonomous decisions are logged to an immutable audit trail.

---

## Autonomous Operation Loops

### Loop 1: Workflow Scheduler (Cron-based, from RT-3)

```python
class WorkflowScheduler:
    """
    From RT-3 specification: autonomous scheduler with cron-based triggers.
    Schedules and prioritizes workflows based on priority, deadline, dependencies.
    """
    
    SCHEDULING_INTERVAL_S = 60   # evaluate queue every minute
    
    def schedule_cycle(self):
        """Main scheduling loop — runs every 60 seconds."""
        
        # 1. Collect pending workflows
        pending = self.workflow_queue.get_pending()
        
        # 2. Sort by priority (critical → high → normal → low)
        sorted_workflows = sorted(pending, key=self._priority_score, reverse=True)
        
        # 3. Check dependencies for each
        ready = [w for w in sorted_workflows if self._dependencies_met(w)]
        
        # 4. Check agent capacity
        for workflow in ready:
            agents_needed = self.delegation_system.estimate_agents_needed(workflow)
            if self.workload_distributor.has_capacity(agents_needed):
                self._dispatch(workflow)
    
    def _priority_score(self, workflow: Workflow) -> float:
        priority_map = {"critical": 4, "high": 3, "normal": 2, "low": 1}
        base   = priority_map.get(workflow.priority, 2)
        urgency = max(0, 1 - (workflow.deadline_hours / 168))  # normalize to 1-week horizon
        return base + urgency
    
    def _dependencies_met(self, workflow: Workflow) -> bool:
        return all(
            self.workflow_state.is_complete(dep_id)
            for dep_id in workflow.upstream_dependencies
        )
    
    def _dispatch(self, workflow: Workflow):
        self.coordination_engine.start(
            intent=workflow.intent,
            entity=workflow.entity,
            context=workflow.context,
        )
```

### Loop 2: Governance Monitor (5-minute cycle, from RT-3)

```python
class GovernanceMonitor:
    """
    From RT-3 specification: governance monitor with 5-minute evaluation cycle.
    Continuously checks all active workflows for governance compliance.
    """
    
    MONITOR_INTERVAL_S = 300   # every 5 minutes
    
    def monitor_cycle(self):
        """Governance compliance check across all active workflows."""
        
        active_workflows = self.workflow_state.get_active()
        
        for workflow_id in active_workflows:
            state = self.memory.load(f"swarm${workflow_id}$state")
            if not state:
                continue
            
            violations = self._check_compliance(workflow_id, state)
            
            for violation in violations:
                if violation.severity == "constitutional":
                    # Immediate halt — no delay
                    self._halt_workflow(workflow_id, violation)
                    self.audit.record_constitutional_violation(workflow_id, violation)
                elif violation.severity == "critical":
                    # Block and escalate
                    self.approval_coordinator.request_approval(workflow_id, violation)
                elif violation.severity == "high":
                    # Alert governance agent
                    self.event_bus.publish("risk.flagged", RiskEvent(
                        workflow_id=workflow_id,
                        violation=violation,
                        severity="high",
                    ))
    
    def _check_compliance(self, workflow_id: str, state: dict) -> list[Violation]:
        violations = []
        
        # Constitutional hard limits
        for action in state.get("pending_actions", []):
            result = self.constitutional_guard.check(action)
            if result.blocked:
                violations.append(Violation(
                    type="constitutional", article=result.article,
                    severity="constitutional", action=action,
                ))
        
        # Quality gate staleness (gate open > 48h without evaluation)
        for gate in state.get("gates_required", []):
            if gate not in state.get("gates_passed", []) and gate not in state.get("gates_failed", []):
                gate_age_hours = self._gate_age_hours(workflow_id, gate)
                if gate_age_hours > 48:
                    violations.append(Violation(
                        type="stale_gate", gate=gate, severity="high",
                        age_hours=gate_age_hours,
                    ))
        
        # Human approval overdue
        pending_approvals = self.approval_coordinator.get_pending(workflow_id)
        for approval in pending_approvals:
            if approval.age_hours > approval.sla_hours:
                violations.append(Violation(
                    type="approval_overdue", approval_id=approval.id, severity="high",
                ))
        
        return violations
```

### Loop 3: Health Monitor (30-second cycle)

```python
class AutonomousHealthMonitor:
    """Continuous health monitoring — triggers circuit breakers and rollbacks."""
    
    HEALTH_INTERVAL_S = 30
    
    def health_cycle(self):
        metrics = self.metrics_collector.collect()
        
        # Circuit breaker evaluation
        for agent_id in metrics.get("agents", {}):
            breaker = self.circuit_breakers[agent_id]
            if metrics["agents"][agent_id]["error_rate"] > 0.5:
                breaker.open()
                self.delegation_system.redistribute_tasks(agent_id)
        
        # Rollback evaluation
        if self.topology_manager.rollback_controller.evaluate_rollback(
            pre_change_metrics=self.topology_manager.pre_change_metrics,
            current_metrics=metrics,
        ).should_rollback:
            self.topology_manager.execute_rollback(
                self.topology_manager.rollback_controller.current_snapshot_id
            )
        
        # Topology optimization evaluation (less frequent — every 10 cycles)
        self.health_cycle_count = getattr(self, "health_cycle_count", 0) + 1
        if self.health_cycle_count % 10 == 0:
            self._evaluate_topology_optimization(metrics)
```

---

## Constitution-Aware Reasoner (RT-3)

Every autonomous decision is validated against the Enterprise Constitution before execution:

```python
class ConstitutionAwareReasoner:
    """
    From RT-3 specification: constitution-aware reasoner.
    Validates all autonomous decisions against constitutional constraints before execution.
    """
    
    def validate_autonomous_decision(self, decision: AutonomousDecision) -> ValidationResult:
        """
        Gate: any autonomous action must pass constitutional review before execution.
        No exceptions — this is enforced before the action reaches any agent.
        """
        
        # Hard limit: constitutionally prohibited actions
        if decision.action_type in CONSTITUTIONAL_PROHIBITIONS:
            return ValidationResult(
                approved=False,
                reason="Constitutional prohibition",
                article=CONSTITUTIONAL_PROHIBITIONS[decision.action_type]["article"],
                remedy=CONSTITUTIONAL_PROHIBITIONS[decision.action_type]["remedy"],
            )
        
        # Hard limit: requires human approval
        h_rules = self.h_rule_matcher.match_from_action(decision)
        if h_rules:
            return ValidationResult(
                approved=False,
                reason=f"Human approval required: {h_rules}",
                action="route_to_approval_coordinator",
            )
        
        # Governance check: is this within autonomous operation boundaries?
        if decision.action_type == "topology_switch":
            # Topology switches are autonomous
            return ValidationResult(approved=True)
        
        if decision.action_type == "agent_reassignment":
            # Reassignments within same authority tier: autonomous
            if not decision.crosses_authority_tier:
                return ValidationResult(approved=True)
            # Cross-tier reassignments: need governance review
            return ValidationResult(
                approved=False,
                reason="Cross-tier agent reassignment requires governance review",
                action="route_to_governance",
            )
        
        # Default: approve with audit log
        return ValidationResult(approved=True, requires_audit_log=True)
```

---

## Background Workers (from ruflo)

Twelve autonomous background workers run continuously, adapted for Enterprise AI OS:

```python
BACKGROUND_WORKERS = {
    "governance_monitor": {
        "interval_s": 300,
        "priority": "critical",
        "description": "Governance compliance monitoring across all active workflows"
    },
    "health_monitor": {
        "interval_s": 30,
        "priority": "high",
        "description": "Agent health, circuit breakers, rollback evaluation"
    },
    "scheduler": {
        "interval_s": 60,
        "priority": "high",
        "description": "Workflow queue prioritization and dispatch"
    },
    "state_consolidator": {
        "interval_s": 600,
        "priority": "normal",
        "description": "Consolidate coordination state, compact Raft logs"
    },
    "memory_consolidator": {
        "interval_s": 3600,
        "priority": "low",
        "description": "Compress warm memory, promote to cold, GC CRDT tombstones"
    },
    "pattern_learner": {
        "interval_s": 7200,
        "priority": "normal",
        "description": "Extract validated coordination patterns from completed workflows"
    },
    "performance_optimizer": {
        "interval_s": 1800,
        "priority": "normal",
        "description": "Analyze performance data, update topology recommendations"
    },
    "past_context_updater": {
        "interval_s": 900,
        "priority": "normal",
        "description": "Update past_context for active entities from recent decisions"
    },
    "handoff_checker": {
        "interval_s": 300,
        "priority": "high",
        "description": "Detect and retry lost cross-org handoffs"
    },
    "approval_reminder": {
        "interval_s": 3600,
        "priority": "high",
        "description": "Re-notify approvers with pending approval requests at SLA intervals"
    },
    "wiki_maintenance": {
        "interval_s": 86400,
        "priority": "low",
        "description": "Check wiki freshness, flag stale pages for update"
    },
    "capability_gap_detector": {
        "interval_s": 86400,
        "priority": "low",
        "description": "Run ExpertiseCoverageMonitor to detect routing key coverage gaps"
    },
}
```

---

## SONA Self-Optimization (from ruflo RuVector)

The Autonomous Coordinator incorporates self-optimization patterns from ruflo's SONA (Self-Optimizing Neural Architecture):

```python
class CoordinationPatternLearner:
    """
    Adapted from ruflo SONA: learn which coordination patterns produce best outcomes.
    4-step pipeline: RETRIEVE → JUDGE → DISTILL → CONSOLIDATE.
    """
    
    def learn_from_completed_workflow(self, workflow_id: str):
        outcome = self.workflow_state.get_outcome(workflow_id)
        
        # RETRIEVE: find similar past workflows
        similar = self.memory_search.search_similar_decisions(
            query=outcome.workflow_summary, top_k=5
        )
        
        # JUDGE: compare this outcome to similar past outcomes
        verdict = self._judge_outcome(outcome, similar)
        
        # DISTILL: extract reusable pattern from successful workflows
        if verdict.success_score > 0.75:
            pattern = self._distill_pattern(outcome)
            self.memory.save_pattern(pattern)
        
        # CONSOLIDATE: update coordination success metrics
        self.performance_tracker.record(
            workflow_id=workflow_id,
            pattern_used=outcome.coordination_pattern,
            success=verdict.success_score,
        )
    
    def _distill_pattern(self, outcome: WorkflowOutcome) -> CoordinationPattern:
        return CoordinationPattern(
            intent=outcome.workflow_intent,
            pattern=outcome.coordination_pattern_used,
            topology=outcome.topology_used,
            agents_sequence=outcome.agent_chain,
            gates_used=outcome.gates_passed,
            success_score=outcome.quality_score,
            conditions=outcome.context_summary,
            discovered_at=now_iso(),
        )
```
