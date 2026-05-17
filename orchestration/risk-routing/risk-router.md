# Risk Router

**Component:** risk-aware-routing/risk-router  
**Role:** Risk scoring, risk-based agent selection, governance gate injection  
**Source Primitives:** ruflo (FaultToleranceStrategy, adaptive scoring), constitution/enterprise-constitution.md §6.3, §7.1

---

## Risk Score Model

Every task is scored on five risk dimensions before routing:

```python
class RiskScorer:
    """
    Score task risk across 5 dimensions.
    Produces composite risk level: negligible / low / medium / high / critical / constitutional.
    """
    
    DIMENSION_WEIGHTS = {
        "decision_risk":     0.25,
        "governance_risk":   0.25,
        "execution_risk":    0.20,
        "security_risk":     0.20,
        "coordination_risk": 0.10,
    }
    
    def score(self, task: Task, context: RoutingContext) -> RiskAssessment:
        dimensions = {
            "decision_risk":     self._score_decision_risk(task),
            "governance_risk":   self._score_governance_risk(task),
            "execution_risk":    self._score_execution_risk(task, context),
            "security_risk":     self._score_security_risk(task),
            "coordination_risk": self._score_coordination_risk(task, context),
        }
        
        composite = sum(
            score * self.DIMENSION_WEIGHTS[dim]
            for dim, score in dimensions.items()
        )
        
        # Constitutional check is binary — overrides composite if triggered
        if self._is_constitutional_violation(task):
            return RiskAssessment(
                composite=1.0,
                level="constitutional",
                dimensions=dimensions,
                constitutional_violation=True,
                article="§6.3"
            )
        
        level = self._level_from_score(composite)
        return RiskAssessment(composite=composite, level=level, dimensions=dimensions)
    
    def _score_decision_risk(self, task: Task) -> float:
        reversibility_scores = {"reversible": 0.1, "partially_reversible": 0.5, "irreversible": 1.0}
        blast_radius_scores  = {"self_only": 0.1, "team": 0.3, "org": 0.6, "enterprise": 0.9, "external": 1.0}
        financial_score      = min(task.financial_impact_usd / 100_000, 1.0) if task.financial_impact_usd else 0.0
        
        return (
            reversibility_scores.get(task.reversibility, 0.5) * 0.4 +
            blast_radius_scores.get(task.blast_radius, 0.5)   * 0.4 +
            financial_score                                    * 0.2
        )
    
    def _score_governance_risk(self, task: Task) -> float:
        h_rule_score     = 1.0 if task.requires_human_approval else 0.0
        constitution_prox = 0.9 if task.touches_constitution else 0.0
        gate_count_score  = min(len(task.gates_required) / 8.0, 1.0)
        compliance_score  = 0.8 if task.compliance_framework else 0.0
        
        return max(h_rule_score, constitution_prox, compliance_score, gate_count_score)
    
    def _score_execution_risk(self, task: Task, context: RoutingContext) -> float:
        complexity          = self.complexity_scorer.score(task)
        agent_failure_rate  = context.primary_agent_failure_rate if context.primary_agent else 0.0
        deadline_pressure   = 1.0 if context.hours_until_deadline < 4 else 0.2
        
        return complexity * 0.4 + agent_failure_rate * 0.4 + deadline_pressure * 0.2
    
    def _score_security_risk(self, task: Task) -> float:
        pii_access       = 1.0 if task.accesses_pii else 0.0
        credential_access = 0.9 if task.accesses_credentials else 0.0
        audit_relevance  = 0.7 if task.audit_logged else 0.0
        external_comms   = 0.8 if task.sends_external_communication else 0.0
        
        return max(pii_access, credential_access, audit_relevance, external_comms)
    
    def _score_coordination_risk(self, task: Task, context: RoutingContext) -> float:
        cross_org = 0.7 if task.crosses_org_boundary else 0.1
        blocking  = 0.8 if task.blocks_downstream_agents else 0.2
        return max(cross_org, blocking)
    
    def _level_from_score(self, score: float) -> str:
        if score < 0.15: return "negligible"
        if score < 0.35: return "low"
        if score < 0.55: return "medium"
        if score < 0.75: return "high"
        return "critical"
    
    def _is_constitutional_violation(self, task: Task) -> bool:
        PROHIBITED_ACTIONS = {
            "delete_production_data", "modify_audit_logs", "bypass_human_approval_gates",
            "deploy_without_gate_G7_clearance", "modify_enterprise_constitution",
            "grant_authority_tier_escalation", "disable_governance_monitor",
            "expose_credentials_in_artifacts", "remove_circuit_breakers",
            "execute_financial_transaction_above_threshold",
            "send_external_communication_without_approval",
            "access_PII_without_data_governance_clearance",
            "create_agent_with_tier_above_T3_autonomously",
        }
        return task.action_type in PROHIBITED_ACTIONS
```

---

## Risk-Based Routing Rules

```python
class RiskBasedRouter:
    """Route tasks to appropriate agents based on risk level."""
    
    RISK_ROUTING_RULES = {
        "negligible": {
            "action": "route_normally",
            "additional_gates": [],
            "require_consensus": False,
            "human_approval": False,
        },
        "low": {
            "action": "route_normally",
            "additional_gates": [],
            "require_consensus": False,
            "human_approval": False,
            "log_to_risk_register": True,
        },
        "medium": {
            "action": "route_to_risk_aware_agent",
            "additional_gates": ["gov-risk review"],
            "require_consensus": False,
            "human_approval": False,
            "upgrade_agent_tier": True,   # use T3 model minimum
        },
        "high": {
            "action": "require_consensus",
            "additional_gates": ["G6", "gov-risk review"],
            "require_consensus": True,
            "consensus_protocol": "multi_perspective_debate",
            "min_perspectives": 2,
            "human_approval": False,
            "upgrade_agent_tier": True,
        },
        "critical": {
            "action": "block_for_human_approval",
            "additional_gates": ["G6", "G7", "gov-risk review"],
            "require_consensus": True,
            "consensus_protocol": "bft",
            "min_confidence": 0.85,
            "human_approval": True,
        },
        "constitutional": {
            "action": "immediate_halt",
            "additional_gates": [],
            "require_consensus": False,
            "human_approval": True,
            "notify": ["governance-all", "HUMAN"],
            "audit_trail_required": True,
        },
    }
    
    def route(self, task: Task, risk: RiskAssessment) -> RoutingDecision:
        rules = self.RISK_ROUTING_RULES[risk.level]
        
        if rules["action"] == "immediate_halt":
            return RoutingDecision(
                action="halt",
                reason=f"Constitutional violation detected: {risk.constitutional_violation}",
                require_human=True,
            )
        
        # Inject additional governance gates
        task.gates_required = list(set(task.gates_required + rules["additional_gates"]))
        
        # Select agent with appropriate risk-awareness
        if rules.get("upgrade_agent_tier"):
            agent = self.select_risk_aware_agent(task, minimum_tier=3)
        else:
            agent = self.specialist_router.route(task.intent, RoutingContext())
        
        return RoutingDecision(
            action=rules["action"],
            agent=agent,
            gates=task.gates_required,
            require_consensus=rules["require_consensus"],
            require_human=rules["human_approval"],
            min_confidence=rules.get("min_confidence", 0.0),
        )
    
    def select_risk_aware_agent(self, task: Task, minimum_tier: int) -> str:
        """Select agent capable of risk-sensitive execution."""
        candidates = self.specialist_router.route(task.intent, RoutingContext()).agents
        risk_aware = [a for a in candidates if self.registry.tier(a) >= minimum_tier]
        return risk_aware[0] if risk_aware else candidates[0]
```

---

## Gate Injection

Risk router injects additional governance gates into task execution flow:

```python
class GateInjector:
    """Add governance gates to task flow based on risk level."""
    
    RISK_GATE_MAP = {
        "medium":       ["gov-risk-review"],
        "high":         ["gov-risk-review", "G6"],
        "critical":     ["gov-risk-review", "G6", "G7"],
        "constitutional": [],   # halt first — no gates to inject
    }
    
    GATE_SEQUENCE = ["G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8"]
    
    def inject(self, task: Task, risk_level: str) -> Task:
        additional_gates = self.RISK_GATE_MAP.get(risk_level, [])
        for gate in additional_gates:
            if gate not in task.gates_required:
                task.gates_required = self._insert_in_sequence(
                    task.gates_required, gate
                )
        return task
    
    def _insert_in_sequence(self, current_gates: list[str], new_gate: str) -> list[str]:
        """Insert gate maintaining G1-G8 sequence order."""
        if new_gate in self.GATE_SEQUENCE:
            all_gates = sorted(
                current_gates + [new_gate],
                key=lambda g: self.GATE_SEQUENCE.index(g) if g in self.GATE_SEQUENCE else 99
            )
        else:
            all_gates = current_gates + [new_gate]   # non-standard gates go last
        return all_gates
```
