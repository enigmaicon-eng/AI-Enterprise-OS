# Cross-Org Coordinator

**Component:** organizational-synchronization/cross-org-coordinator  
**Role:** Collaboration contract enforcement, org boundary crossing protocols, shared authority resolution  
**Source Primitives:** ruflo (hierarchical swarm, queen-led coordination, fan-out/fan-in), agents/COLLABORATION-CONTRACTS.md

---

## Overview

The Cross-Org Coordinator is the diplomatic layer of the coordination runtime. It enforces collaboration contracts between organizations, mediates cross-org handoffs, and resolves authority conflicts at org boundaries. Without it, cross-org workflows devolve into informal coordination or silent scope violations.

---

## Collaboration Contract Enforcement

```python
class CollaborationContractEnforcer:
    """
    Validate and enforce cross-org collaboration contracts.
    Contracts define: trigger, handoff artifact, gate, SLA, shared context, boundary rules.
    """
    
    def validate_handoff(self, handoff: HandoffEnvelope) -> ContractValidationResult:
        """Validate a cross-org handoff against the applicable contract."""
        
        contract = self._find_contract(handoff.from_org, handoff.to_org, handoff.trigger)
        if not contract:
            return ContractValidationResult(
                valid=False,
                reason=f"No collaboration contract found for {handoff.from_org} → {handoff.to_org}"
            )
        
        violations = []
        
        # Check: required handoff artifact present
        if contract.required_artifact not in handoff.artifacts:
            violations.append(f"Required artifact '{contract.required_artifact}' missing from handoff")
        
        # Check: triggering gate was passed
        if contract.trigger_gate and contract.trigger_gate not in handoff.gates_passed:
            violations.append(f"Trigger gate {contract.trigger_gate} not yet passed")
        
        # Check: all required context keys present
        for key in contract.shared_context_keys:
            if key not in handoff.context:
                violations.append(f"Required context key '{key}' missing")
        
        # Check: boundary rules not violated
        for rule in contract.boundary_rules:
            violation = self._check_boundary_rule(rule, handoff)
            if violation:
                violations.append(violation)
        
        return ContractValidationResult(
            valid=len(violations) == 0,
            violations=violations,
            contract_id=contract.id,
            sla_hours=contract.sla_hours,
        )
    
    def _check_boundary_rule(self, rule: str, handoff: HandoffEnvelope) -> str | None:
        """Check for boundary rule violations (simplified pattern matching)."""
        # Example: "PM does not make implementation decisions"
        if "does not make implementation decisions" in rule:
            if any(d.type == "implementation_decision" for d in handoff.decisions):
                return f"Boundary violation: {rule}"
        return None
```

---

## Org Boundary Crossing Protocol

All cross-org interactions follow a structured boundary crossing protocol:

```python
class OrgBoundaryCrossing:
    """
    Protocol for crossing organization boundaries safely.
    Adapted from ruflo pipeline pattern with governance gate checks.
    """
    
    ORG_BOUNDARIES = {
        # From → To: gate required before crossing
        ("product", "architecture"):   "G2",   # PRD approved before arch starts
        ("architecture", "engineering"): "G4",  # arch review before implementation
        ("engineering", "qa"):         "G5",   # implementation complete before QA
        ("qa", "delivery"):            "G6",   # QA cleared before release process
        ("delivery", "production"):    "G7",   # delivery manager sign-off before prod
    }
    
    def cross(self, from_org: str, to_org: str, 
              payload: HandoffEnvelope) -> CrossingResult:
        """Attempt to cross an org boundary."""
        
        # 1. Check if gate is required for this boundary
        boundary_key = (from_org, to_org)
        required_gate = self.ORG_BOUNDARIES.get(boundary_key)
        
        if required_gate and required_gate not in payload.gates_passed:
            return CrossingResult(
                allowed=False,
                reason=f"Gate {required_gate} required before {from_org} → {to_org} crossing",
                gate_required=required_gate,
            )
        
        # 2. Validate collaboration contract
        contract_result = self.contract_enforcer.validate_handoff(payload)
        if not contract_result.valid:
            return CrossingResult(
                allowed=False,
                reason=f"Contract violations: {contract_result.violations}",
            )
        
        # 3. Apply context trimming (minimum viable context for receiving org)
        trimmed_payload = self._trim_to_receiving_org_budget(payload, to_org)
        
        # 4. Record crossing in audit trail
        self.audit.record_crossing(from_org, to_org, payload.correlation_id)
        
        # 5. Emit handoff event
        self.event_bus.publish("agent.handoff", HandoffEvent(
            from_agent=payload.from_agent,
            to_agent=payload.to_agent,
            artifact_ref=payload.primary_artifact,
            handoff_type="cross_org",
        ))
        
        return CrossingResult(allowed=True, payload=trimmed_payload)
    
    def _trim_to_receiving_org_budget(self, payload: HandoffEnvelope, 
                                       to_org: str) -> HandoffEnvelope:
        """Apply minimum viable context principle at org boundaries."""
        ORG_CONTEXT_BUDGETS = {
            "product": 8_000, "architecture": 10_000, "engineering": 10_000,
            "qa": 6_000, "delivery": 4_000, "governance": 6_000, "analytics": 6_000,
        }
        budget = ORG_CONTEXT_BUDGETS.get(to_org, 6_000)
        return payload.trim_to_tokens(budget)
```

---

## Cross-Org Fan-Out

For decisions requiring simultaneous input from multiple organizations:

```python
class CrossOrgFanOut:
    """
    Simultaneously invoke agents from multiple orgs, then synthesize.
    From ruflo fan-out/fan-in pattern applied to org boundaries.
    """
    
    def invoke_parallel_orgs(self, intent: str, participating_orgs: list[str],
                              shared_context: dict) -> FanOutResult:
        """Invoke one specialist from each org simultaneously."""
        
        assignments = {}
        for org in participating_orgs:
            specialist = self.expertise_orchestrator.assign_expert(
                task=Task(intent=intent, context=shared_context),
                candidates=self.registry.agents_in_org(org)
            )
            assignments[org] = specialist
        
        # All orgs work in parallel
        org_outputs = {}
        for org, agent_id in assignments.items():
            output = self.coordination_engine.invoke(
                agent_id=agent_id,
                state=create_initial_coordination_state(
                    intent=intent,
                    entity=shared_context.get("entity"),
                    context=shared_context,
                )
            )
            org_outputs[org] = output
        
        return FanOutResult(
            org_outputs=org_outputs,
            participating_agents=assignments,
        )
    
    def synthesize(self, fan_out_result: FanOutResult, 
                   synthesizer_agent: str) -> SynthesisResult:
        """Fan-in: synthesize all org outputs into unified decision."""
        synthesis_context = {
            "org_perspectives": fan_out_result.org_outputs,
            "task": "Synthesize multi-org perspectives into unified recommendation",
        }
        
        verdict = self.coordination_engine.invoke(
            agent_id=synthesizer_agent,
            state=create_initial_coordination_state(
                intent="synthesis",
                entity="multi_org_decision",
                context=synthesis_context,
            )
        )
        return SynthesisResult(synthesis=verdict, sources=fan_out_result)
```

---

## Authority Conflict Resolution at Org Boundaries

When two organizations claim authority over the same decision:

```python
class OrgAuthorityResolver:
    """Resolve cross-org authority conflicts using COLLABORATION-CONTRACTS."""
    
    # Who owns what at org boundaries (from COLLABORATION-CONTRACTS.md)
    BOUNDARY_AUTHORITIES = {
        "product_requirements":     "product",       # PM owns requirements
        "technical_feasibility":    "architecture",  # Arch owns tech decisions
        "implementation_quality":   "qa",            # QA owns quality bar
        "release_timing":           "delivery",      # Delivery owns release decisions
        "compliance_requirements":  "governance",    # Governance owns compliance
        "user_experience":          "ux",            # UX owns user-facing decisions
    }
    
    SHARED_DECISIONS = [
        # These require explicit cross-org consensus (not one-org ownership)
        "api_contract_design",       # product + architecture + engineering
        "performance_sla_targets",   # product + architecture + qa
        "release_criteria",          # qa + delivery + governance
    ]
    
    def resolve(self, decision_domain: str, conflicting_orgs: list[str]) -> str:
        """Return the authoritative org for this decision domain."""
        
        if decision_domain in self.SHARED_DECISIONS:
            # Shared decisions need explicit consensus
            return "consensus_required"
        
        owner_org = self.BOUNDARY_AUTHORITIES.get(decision_domain)
        if owner_org and owner_org in conflicting_orgs:
            return owner_org
        
        # No clear owner — escalate to executive layer
        return "executive_escalation"
```
