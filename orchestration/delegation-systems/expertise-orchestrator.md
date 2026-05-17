# Expertise Orchestrator

**Component:** delegation-systems/expertise-orchestrator  
**Role:** Expertise scoring, task-capability matching, escalation governance  
**Source Primitives:** ruflo (hierarchical-coordinator task assignment algorithm, queen-led hierarchy)

---

## Overview

The Expertise Orchestrator sits above the Workload Distributor. Where the Distributor handles load balancing, the Expertise Orchestrator handles fit — ensuring the right expertise is applied to each task, orchestrating multi-expert synthesis for high-stakes decisions, and managing escalation governance when no available agent is sufficiently expert.

---

## Expertise Profiles

Every agent has an expertise profile derived from its MASTER-REGISTRY definition:

```python
@dataclass
class ExpertiseProfile:
    agent_id: str
    authority_tier: int               # 1-5 from MASTER-REGISTRY
    domain: str                       # product / architecture / engineering / qa / etc.
    specializations: list[str]        # specific sub-domain expertise
    gate_authority: list[str]         # which quality gates this agent can evaluate
    output_types: list[str]           # PRD / ADR / test-plan / etc.
    collaboration_roles: list[str]    # reviewer / judge / synthesizer / contributor

# Example profiles
PROFILES = {
    "arch-principal": ExpertiseProfile(
        agent_id="arch-principal",
        authority_tier=3,
        domain="architecture",
        specializations=["system_design", "adr", "rfc", "scalability", "distributed_systems"],
        gate_authority=["G3", "G4"],
        output_types=["ADR", "RFC", "architecture_diagram", "tech_review"],
        collaboration_roles=["judge", "reviewer", "synthesizer"],
    ),
    "pm-lead": ExpertiseProfile(
        agent_id="pm-lead",
        authority_tier=2,
        domain="product",
        specializations=["prd", "discovery", "prioritization", "stakeholder_mgmt"],
        gate_authority=["G1", "G2"],
        output_types=["PRD", "user_story", "sprint_plan"],
        collaboration_roles=["contributor", "reviewer"],
    ),
}
```

---

## Task-Capability Matching (from ruflo hierarchical-coordinator)

The core task assignment algorithm adapted from ruflo's hierarchical-coordinator:

```python
class ExpertiseOrchestrator:
    """
    Queen-led hierarchy: orchestrator assigns, experts execute.
    From ruflo: filter_by_capabilities → score_by_performance → consider_workload → select_best
    """
    
    def assign_expert(self, task: Task, available_agents: list[str]) -> str:
        # Step 1: Filter to capability-capable agents
        capable = self._filter_by_capabilities(available_agents, task.required_capabilities)
        if not capable:
            return self._escalate_no_expert(task)
        
        # Step 2: Score by expertise match
        expertise_scored = self._score_by_expertise(capable, task)
        
        # Step 3: Consider workload
        workload_balanced = self._apply_workload_balance(expertise_scored, task)
        
        # Step 4: Select best
        return self._select_best(workload_balanced)
    
    def _filter_by_capabilities(self, agents: list[str], required: list[str]) -> list[str]:
        return [
            a for a in agents
            if all(cap in self.profiles[a].specializations for cap in required)
        ]
    
    def _score_by_expertise(self, agents: list[str], task: Task) -> list[tuple[str, float]]:
        scores = []
        for agent_id in agents:
            profile = self.profiles[agent_id]
            
            # Specialization overlap (primary score)
            spec_overlap = len(set(profile.specializations) & set(task.required_capabilities))
            spec_score   = spec_overlap / max(len(task.required_capabilities), 1)
            
            # Authority tier bonus for high-stakes tasks
            tier_bonus = 0.1 * profile.authority_tier if task.minimum_tier >= 3 else 0
            
            # Gate authority match
            gate_match = any(g in profile.gate_authority for g in task.gates_required)
            gate_bonus = 0.15 if gate_match else 0
            
            # Output type match
            output_match = task.expected_output in profile.output_types
            output_bonus = 0.1 if output_match else 0
            
            total = spec_score + tier_bonus + gate_bonus + output_bonus
            scores.append((agent_id, total))
        
        return sorted(scores, key=lambda x: x[1], reverse=True)
    
    def _apply_workload_balance(self, scored: list[tuple[str, float]], task: Task) -> list[tuple[str, float]]:
        """Apply utilization penalty to avoid hot-spots."""
        rebalanced = []
        for agent_id, score in scored:
            utilization = self.load_monitor.utilization(agent_id)
            penalty = 0.3 * utilization   # up to 30% penalty at full utilization
            rebalanced.append((agent_id, score - penalty))
        return sorted(rebalanced, key=lambda x: x[1], reverse=True)
    
    def _select_best(self, scored: list[tuple[str, float]]) -> str:
        if not scored:
            return "master-orchestrator"
        best_agent, best_score = scored[0]
        if best_score < 0.3:
            # Low confidence — flag for escalation review
            self.flagged_assignments.append(best_agent)
        return best_agent
    
    def _escalate_no_expert(self, task: Task) -> str:
        """No capable agent found — escalate to orchestrator for decomposition."""
        self.event_bus.publish("agent.escalation", EscalationEvent(
            from_agent="expertise-orchestrator",
            to_agent="master-orchestrator",
            reason=f"No expert for capabilities: {task.required_capabilities}",
            task_id=task.id,
        ))
        return "master-orchestrator"
```

---

## Multi-Expert Synthesis

For high-stakes tasks requiring multiple expert perspectives:

```python
class MultiExpertSynthesizer:
    """
    Orchestrate multiple experts, then synthesize into unified output.
    Combines ruflo fan-out + TradingAgents judge pattern.
    """
    
    def orchestrate(self, task: Task, expert_pool: list[str]) -> SynthesisResult:
        # Phase 1: Assign subtasks to specialists
        assignments = {}
        subtasks = self._decompose(task)
        for subtask in subtasks:
            expert = self.expertise_orchestrator.assign_expert(subtask, expert_pool)
            assignments[subtask.id] = expert
        
        # Phase 2: Collect expert outputs (fan-out)
        expert_outputs = {}
        for subtask_id, expert_id in assignments.items():
            output = self._invoke_expert(expert_id, subtasks[subtask_id])
            expert_outputs[expert_id] = output
        
        # Phase 3: Judge synthesis (from TradingAgents research manager pattern)
        judge = self._select_judge(task, expert_pool)
        synthesis = self._invoke_judge(
            judge_agent=judge,
            expert_outputs=expert_outputs,
            task=task,
        )
        
        return SynthesisResult(
            judge_agent=judge,
            expert_contributions=expert_outputs,
            synthesis=synthesis,
            confidence=self._compute_confidence(expert_outputs),
        )
    
    def _select_judge(self, task: Task, expert_pool: list[str]) -> str:
        """Select judge with highest authority tier in the pool."""
        return max(expert_pool, key=lambda a: self.profiles[a].authority_tier)
    
    def _compute_confidence(self, outputs: dict[str, str]) -> float:
        """Confidence from expert agreement (higher agreement = higher confidence)."""
        if len(outputs) <= 1:
            return 0.7   # single expert: moderate confidence
        # Placeholder: in practice, embed and compute cosine similarity
        return 0.85      # multi-expert always >= single expert
```

---

## Escalation Governance

The Expertise Orchestrator enforces a structured escalation path for unresolvable assignments:

```python
ESCALATION_CHAIN = {
    # Domain → next authority tier
    "product":      ["pm-lead", "exec-cpo"],
    "architecture": ["arch-principal", "exec-cto"],
    "engineering":  ["eng-distinguished", "arch-principal", "exec-cto"],
    "governance":   ["gov-risk", "exec-cto"],
    "security":     ["qa-security", "arch-security", "exec-cto", "HUMAN"],
    "constitutional": ["constitution-guardian", "HUMAN"],
}

def resolve_escalation(domain: str, reason: str, task: Task) -> EscalationResult:
    chain = ESCALATION_CHAIN.get(domain, ["master-orchestrator"])
    
    for target in chain:
        if target == "HUMAN":
            return EscalationResult(
                target="HUMAN",
                h_rule=lookup_h_rule(task),
                message=f"Human approval required: {reason}"
            )
        if self.expertise_orchestrator.can_handle(target, task):
            return EscalationResult(target=target, reason=reason)
    
    return EscalationResult(
        target="master-orchestrator",
        reason="Escalation chain exhausted — orchestrator to decompose"
    )
```

---

## Expertise Coverage Monitoring

Tracks gaps in expertise coverage across the 17 organizations:

```python
class ExpertiseCoverageMonitor:
    """Detects capability gaps — routing keys with no capable agent."""
    
    def coverage_report(self) -> dict[str, list[str]]:
        """Returns routing keys → available expert agents."""
        report = {}
        for routing_key in self.routing_table.keys():
            required_caps = self.routing_table.required_capabilities(routing_key)
            experts = [
                a for a in self.registry.all_agents()
                if all(cap in self.profiles[a].specializations for cap in required_caps)
            ]
            report[routing_key] = experts
        return report
    
    def uncovered_keys(self) -> list[str]:
        """Routing keys with zero capable agents — these become capability gaps."""
        return [k for k, experts in self.coverage_report().items() if not experts]
```
