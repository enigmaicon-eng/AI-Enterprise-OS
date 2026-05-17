# Disagreement Resolution

**Component:** consensus-frameworks/disagreement-resolution  
**Role:** Conflict taxonomy, resolution strategies, escalation paths  
**Source Primitives:** ruflo (hierarchical consensus, view change, escalation protocols), TradingAgents (debate judge pattern)

---

## Overview

Not all disagreements are created equal. This component defines a taxonomy of agent disagreements in the Enterprise AI OS and maps each type to a resolution strategy — from simple tie-breaking to full BFT consensus to human escalation.

---

## Disagreement Taxonomy

```
DISAGREEMENT TYPES
────────────────────────────────────────────────────────────
Type 1: FACTUAL CONFLICT
  What: Two agents report different facts about the same entity
  Example: PM says user research shows X; Analytics says metrics show Y
  Resolution: Evidence arbitration + judge synthesis

Type 2: INTERPRETATION CONFLICT  
  What: Same facts, different conclusions
  Example: Both see latency numbers; PM says "acceptable", Arch says "blocking"
  Resolution: Multi-perspective debate (2-way or 3-way)

Type 3: AUTHORITY CONFLICT
  What: Two agents both claim authority to make a decision
  Example: PM and Architect both want to own the API design decision
  Resolution: Authority cascade (MASTER-REGISTRY determines ownership)

Type 4: VALUE CONFLICT
  What: Agents weight competing values differently
  Example: Speed vs quality vs cost tradeoff
  Resolution: 3-perspective risk analysis + executive judgment

Type 5: INFORMATION ASYMMETRY
  What: Agents operating on different context / incomplete information
  Example: Engineer doesn't know compliance constraints; makes incompatible choice
  Resolution: Context synchronization before re-evaluation

Type 6: GATE CONFLICT
  What: Agent passes gate it should have failed; or fails gate it should have passed
  Example: QA passes G5 but Governance blocks at G7
  Resolution: Gate adjudication by Supervisor agent

Type 7: CONSTITUTIONAL CONFLICT
  What: An agent's output or proposed action violates the Enterprise Constitution
  Example: Agent proposes to bypass audit log requirement
  Resolution: Immediate halt + constitutional review (always requires human)
```

---

## Resolution Strategies

### Strategy 1: Evidence Arbitration (for Type 1: Factual Conflict)

```python
class EvidenceArbitrator:
    """Resolve factual conflicts by evaluating evidence quality."""
    
    EVIDENCE_QUALITY_SCORES = {
        "production_metrics":   1.0,    # highest confidence
        "user_research":        0.9,
        "analytics_report":     0.85,
        "expert_assessment":    0.75,
        "architectural_review": 0.70,
        "historical_pattern":   0.65,
        "opinion":              0.30,   # lowest confidence
    }
    
    def arbitrate(self, claim_a: Claim, claim_b: Claim) -> ArbitrationResult:
        score_a = self.EVIDENCE_QUALITY_SCORES.get(claim_a.evidence_type, 0.5)
        score_b = self.EVIDENCE_QUALITY_SCORES.get(claim_b.evidence_type, 0.5)
        
        if abs(score_a - score_b) > 0.2:
            # Clear winner by evidence quality
            winner = claim_a if score_a > score_b else claim_b
            return ArbitrationResult(
                winner=winner, confidence=abs(score_a - score_b),
                resolution_type="evidence_dominance"
            )
        
        # Similar evidence quality — escalate to debate
        return ArbitrationResult(
            winner=None, confidence=0.0,
            resolution_type="escalate_to_debate",
            note="Evidence quality too similar for arbitration — debate required"
        )
```

### Strategy 2: Authority Cascade (for Type 3: Authority Conflict)

```python
class AuthorityCascadeResolver:
    """Resolve authority conflicts using MASTER-REGISTRY hierarchy."""
    
    # From MASTER-REGISTRY routing authority cascade
    DOMAIN_OWNERS = {
        "product_direction":    "exec-cpo",
        "architecture_design":  "arch-principal",
        "api_contract":         "arch-api",
        "security_policy":      "arch-security",
        "test_strategy":        "qa-general",
        "release_decision":     "delivery-release",
        "governance_policy":    "gov-risk",
        "sprint_planning":      "delivery-manager",
    }
    
    def resolve(self, agents_in_conflict: list[str], decision_domain: str) -> str:
        """Return the authoritative agent for this domain."""
        authoritative = self.DOMAIN_OWNERS.get(decision_domain)
        if authoritative and authoritative in agents_in_conflict:
            return authoritative
        
        # Fall back to highest tier agent in conflict
        return max(agents_in_conflict, 
                   key=lambda a: self.registry.tier(a))
```

### Strategy 3: Context Synchronization (for Type 5: Information Asymmetry)

```python
class ContextSynchronizer:
    """Resolve information asymmetry before re-running agent."""
    
    def synchronize(self, agent_id: str, missing_context_keys: list[str]) -> bool:
        """
        Inject missing context from memory and re-invoke agent.
        Returns True if synchronization resolved the disagreement.
        """
        supplemental = {}
        for key in missing_context_keys:
            value = self.memory.read(key)
            if value:
                supplemental[key] = value
        
        if not supplemental:
            return False    # missing context not in memory — escalate
        
        # Re-invoke agent with supplemental context
        enriched_state = {**self.current_state, **supplemental}
        new_output = self.engine.invoke(agent_id, enriched_state)
        
        # Check if disagreement resolved
        return not self.conflict_detector.has_conflict(new_output)
```

### Strategy 4: Gate Adjudication (for Type 6: Gate Conflict)

```python
class GateAdjudicator:
    """Resolve gate evaluation conflicts using Supervisor agent."""
    
    GATE_OWNERS = {
        "G1": "pm-lead",
        "G2": "pm-lead",
        "G3": "arch-principal",
        "G4": "arch-principal",
        "G5": "qa-general",
        "G6": "qa-security",
        "G7": "delivery-release",
        "G8": "supervisor",
    }
    
    def adjudicate(self, gate_id: str, 
                   conflicting_evaluations: list[GateEvaluation]) -> GateVerdict:
        gate_owner = self.GATE_OWNERS[gate_id]
        
        # Supervisor always adjudicates G1/G2/G4/G5/G8
        if gate_id in ["G1", "G2", "G4", "G5", "G8"]:
            return self._invoke_supervisor(gate_id, conflicting_evaluations)
        
        # Otherwise domain owner adjudicates
        return self._invoke_gate_owner(gate_owner, gate_id, conflicting_evaluations)
    
    def _invoke_supervisor(self, gate_id: str, 
                           evaluations: list[GateEvaluation]) -> GateVerdict:
        conflicting_views = "\n\n".join(
            f"Agent {e.evaluator}: {'PASS' if e.passed else 'FAIL'} — {e.rationale}"
            for e in evaluations
        )
        
        verdict = self.engine.invoke("supervisor", {
            "gate_id": gate_id,
            "conflicting_evaluations": conflicting_views,
            "task": f"Adjudicate conflicting {gate_id} evaluations and produce definitive verdict"
        })
        return GateVerdict(gate_id=gate_id, verdict=verdict)
```

---

## Escalation Paths

```
RESOLUTION ESCALATION LADDER
──────────────────────────────────────────────────────────
Level 1: Automatic resolution
  → Evidence arbitration, authority cascade, context sync
  → No human involvement, <5 minutes

Level 2: Debate resolution
  → 2-way or 3-way debate + judge synthesis
  → Domain experts, no executive involvement, <30 minutes

Level 3: Executive escalation
  → CPO or CTO judgment call
  → Cross-domain conflict, significant impact, <2 hours

Level 4: Human approval required
  → Matches H-NNN rules from human-approval-constitution.md
  → Constitutional conflicts, irreversible decisions
  → Blocking until human responds

Level 5: Constitutional review
  → §6.3 / §7.1 violation suspected
  → Immediate halt, governance review
  → All work paused until resolved
```

```python
def determine_escalation_level(conflict: Conflict) -> int:
    if conflict.type == ConflictType.CONSTITUTIONAL:
        return 5
    if conflict.requires_human_approval:
        return 4
    if conflict.crosses_executive_threshold:
        return 3
    if conflict.requires_debate:
        return 2
    return 1   # automatic resolution
```

---

## Deadlock Detection

When two agents are blocked waiting on each other's output:

```python
class DeadlockDetector:
    """Detect and break circular dependency deadlocks."""
    
    def detect(self, wait_graph: dict[str, list[str]]) -> list[list[str]]:
        """Find cycles in agent wait graph (agent → [agents it's waiting on])."""
        visited = set()
        rec_stack = set()
        cycles = []
        
        def dfs(node, path):
            visited.add(node)
            rec_stack.add(node)
            for neighbor in wait_graph.get(node, []):
                if neighbor not in visited:
                    dfs(neighbor, path + [neighbor])
                elif neighbor in rec_stack:
                    cycle_start = path.index(neighbor)
                    cycles.append(path[cycle_start:])
            rec_stack.discard(node)
        
        for node in wait_graph:
            if node not in visited:
                dfs(node, [node])
        return cycles
    
    def break_deadlock(self, cycle: list[str]) -> str:
        """Break cycle by preempting the lowest-priority agent in the cycle."""
        return min(cycle, key=lambda a: self.registry.tier(a))
```
