# Escalation Thresholds

**Component:** risk-aware-routing/escalation-thresholds  
**Role:** Threshold definitions, escalation triggers, auto-escalation logic  
**Source Primitives:** ruflo (hierarchical-coordinator escalation: <70% success, >90% utilization, gate failures), TradingAgents (debate termination: count >= N × max_rounds)

---

## Overview

Escalation thresholds define the precise conditions under which work is automatically elevated to a higher authority — from individual agent to domain lead, from domain lead to executive, from executive to human. This prevents both under-escalation (silently making consequential decisions) and over-escalation (flooding executives with trivial items).

---

## Threshold Categories

### 1. Performance Escalation Thresholds (from ruflo hierarchical-coordinator)

```python
PERFORMANCE_ESCALATION_THRESHOLDS = {
    # Agent success rate: <70% over last 20 tasks → reassign or escalate
    "agent_success_rate": {
        "threshold": 0.70,
        "direction": "below",
        "window": 20,
        "action": "reassign_to_alternative_agent",
        "escalate_if_no_alternative": True,
    },
    
    # Agent utilization: >90% → spawn additional capacity or escalate queue
    "agent_utilization": {
        "threshold": 0.90,
        "direction": "above",
        "action": "spawn_additional_or_queue",
        "sla_hours_before_escalation": 2,
    },
    
    # Gate failure rate: >60% over last 10 gate evaluations → circuit break
    "gate_failure_rate": {
        "threshold": 0.60,
        "direction": "above",
        "window": 10,
        "action": "circuit_break_and_escalate",
    },
    
    # Model tier downgrade: T2 substituted for T3 > 3 times → quality risk
    "tier_downgrades": {
        "threshold": 3,
        "direction": "above",
        "window": "session",
        "action": "alert_cost_guard_and_notify",
    },
}
```

### 2. Debate Termination Thresholds (from TradingAgents ConditionalLogic)

```python
DEBATE_TERMINATION_THRESHOLDS = {
    # Two-perspective debate: terminate at 2 × max_rounds
    "two_way_debate": {
        "formula": "count >= 2 * max_debate_rounds",
        "default_max": 2,   # 4 total turns before judge
        "action": "advance_to_judge",
        "judge_selection": "highest_tier_agent_in_context",
    },
    
    # Three-perspective risk analysis: terminate at 3 × max_rounds
    "three_way_risk": {
        "formula": "count >= 3 * max_risk_discuss_rounds",
        "default_max": 1,   # 3 total turns (one per perspective) before judge
        "action": "advance_to_risk_judge",
        "judge_selection": "risk_designated_judge",
    },
    
    # Inconclusive debates: 3 consecutive inconclusive → circuit break
    "inconclusive_debate_streak": {
        "threshold": 3,
        "action": "force_arbitrary_resolution_by_senior_judge",
    },
}

def should_terminate_debate(state: dict, config: dict, debate_type: str) -> bool:
    """Determine if debate has reached its termination threshold."""
    if debate_type == "two_way":
        return state["debate_state"]["count"] >= 2 * config.get("max_debate_rounds", 2)
    if debate_type == "three_way":
        return state["risk_state"]["count"] >= 3 * config.get("max_risk_rounds", 1)
    return False
```

### 3. Time-Based Escalation Thresholds

```python
TIME_ESCALATION_THRESHOLDS = {
    # Task blocked waiting for agent > SLA → escalate
    "task_waiting_sla": {
        "by_risk_level": {
            "critical":    {"hours": 1,  "escalate_to": "exec-cto"},
            "high":        {"hours": 4,  "escalate_to": "domain_lead"},
            "medium":      {"hours": 8,  "escalate_to": "pm-lead"},
            "low":         {"hours": 24, "escalate_to": "delivery-manager"},
            "negligible":  {"hours": 48, "escalate_to": None},  # queue only
        }
    },
    
    # Human approval pending > SLA → notify again
    "human_approval_pending": {
        "remind_at_hours":  [1, 4, 8],
        "auto_block_at":    24,    # block dependent work after 24h no response
        "escalate_chain":   ["primary_approver", "backup_approver", "exec"],
    },
    
    # Workflow stalled (no agent activity) → health alert
    "workflow_stall": {
        "threshold_seconds": 300,     # 5 minutes no progress
        "action": "health_alert",
        "then": "check_circuit_breakers",
    },
}
```

### 4. Quality Escalation Thresholds

```python
QUALITY_ESCALATION_THRESHOLDS = {
    # Artifact quality below minimum → rework cycle
    "artifact_quality": {
        "minimum_score": 0.70,   # 70% quality threshold
        "direction": "below",
        "max_rework_cycles": 3,
        "action": "return_to_agent_with_feedback",
        "escalate_after_max_rework": "senior_agent",
    },
    
    # Confidence below gate threshold → require additional perspectives
    "consensus_confidence": {
        "by_gate": {
            "G7": 0.90,    # release gate needs 90% confidence
            "G6": 0.80,    # security gate needs 80%
            "G5": 0.75,    # QA gate needs 75%
        },
        "action": "require_additional_perspectives",
        "max_perspective_additions": 2,
        "escalate_after_max": "executive_judgment",
    },
}
```

---

## Auto-Escalation Logic

```python
class AutoEscalator:
    """Continuously monitors thresholds and triggers escalation automatically."""
    
    def evaluate(self, workflow_state: dict, metrics: dict) -> list[EscalationAction]:
        actions = []
        
        # Performance checks
        for agent_id, agent_metrics in metrics.get("agents", {}).items():
            if agent_metrics.get("success_rate", 1.0) < PERFORMANCE_ESCALATION_THRESHOLDS["agent_success_rate"]["threshold"]:
                actions.append(EscalationAction(
                    type="performance",
                    target_agent=agent_id,
                    reason=f"Success rate {agent_metrics['success_rate']:.0%} below 70% threshold",
                    action="reassign",
                ))
        
        # Debate termination checks
        debate_state = workflow_state.get("debate_state", {})
        if debate_state.get("count", 0) >= 2 * workflow_state.get("config", {}).get("max_debate_rounds", 2):
            actions.append(EscalationAction(
                type="debate_termination",
                reason=f"Debate reached {debate_state['count']} rounds — advancing to judge",
                action="advance_to_judge",
            ))
        
        # Time-based checks
        task_age_hours = (time.time() - workflow_state.get("start_time", time.time())) / 3600
        risk_level = workflow_state.get("risk_level", "low")
        sla = TIME_ESCALATION_THRESHOLDS["task_waiting_sla"]["by_risk_level"].get(risk_level, {})
        if sla and task_age_hours > sla.get("hours", float("inf")):
            actions.append(EscalationAction(
                type="sla_breach",
                target_agent=sla.get("escalate_to"),
                reason=f"Task exceeded {sla['hours']}h SLA for {risk_level} risk level",
                action="escalate_to_authority",
            ))
        
        return actions
```

---

## Escalation Chain Definitions

```python
ESCALATION_CHAINS = {
    "product":       ["pm-feature", "pm-lead", "exec-cpo", "HUMAN"],
    "architecture":  ["arch-api", "arch-principal", "exec-cto", "HUMAN"],
    "engineering":   ["eng-backend", "eng-distinguished", "arch-principal", "exec-cto", "HUMAN"],
    "governance":    ["gov-risk", "gov-compliance", "exec-cto", "HUMAN"],
    "security":      ["qa-security", "arch-security", "exec-cto", "HUMAN"],
    "delivery":      ["delivery-manager", "delivery-program", "exec-cto", "HUMAN"],
    "constitutional": ["constitution-guardian", "HUMAN"],
}

def next_in_escalation_chain(current_agent: str, domain: str) -> str | None:
    chain = ESCALATION_CHAINS.get(domain, ["master-orchestrator", "HUMAN"])
    if current_agent in chain:
        idx = chain.index(current_agent)
        return chain[idx + 1] if idx + 1 < len(chain) else None
    return chain[0]   # start of chain if current not in it
```
