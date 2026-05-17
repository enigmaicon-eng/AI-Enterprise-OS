# Model Tier Router

**Component:** coordination-runtime/model-tier-router  
**Role:** 3-tier model selection per task complexity and agent profile  
**Source Primitives:** ruflo ADR-026 (3-tier routing), ruflo agent-adaptive-coordinator (performance scoring)

---

## Overview

Every agent invocation in the coordination runtime routes to one of three model tiers based on task complexity, agent capability profile, and time-sensitivity. This prevents over-spending on Sonnet/Opus for trivial tasks and under-spending Haiku on high-stakes decisions.

---

## Tier Definitions

| Tier | Handler | Latency | Cost per Call | Decision Threshold |
|------|---------|---------|---------------|-------------------|
| **T1 — Transform** | WASM / Agent Booster | <1ms | $0 | Complexity < 10% |
| **T2 — Simple** | Haiku (claude-haiku-4-5) | ~500ms | $0.0002 | Complexity 10-30% |
| **T3 — Complex** | Sonnet/Opus (claude-sonnet-4-6 / claude-opus-4-7) | 2-5s | $0.003-0.015 | Complexity > 30% |

---

## Complexity Scoring

Task complexity is scored 0–100 before routing:

```python
class ComplexityScorer:
    """Score task complexity to determine model tier."""
    
    WEIGHTS = {
        "reasoning_depth":      0.30,   # multi-step inference required
        "context_dependency":   0.20,   # requires cross-agent context
        "decision_reversibility": 0.20, # irreversible decisions score higher
        "stakeholder_count":    0.15,   # more stakeholders = more complex
        "governance_sensitivity": 0.15, # constitutional / security implications
    }
    
    def score(self, task: Task) -> float:
        """Returns 0.0–1.0 complexity score."""
        scores = {
            "reasoning_depth":       self._score_reasoning(task),
            "context_dependency":    self._score_context(task),
            "decision_reversibility": self._score_reversibility(task),
            "stakeholder_count":     self._score_stakeholders(task),
            "governance_sensitivity": self._score_governance(task),
        }
        return sum(score * self.WEIGHTS[dim] for dim, score in scores.items())
    
    def _score_reasoning(self, task: Task) -> float:
        # Multi-hop inference, debate synthesis, architecture decisions → high
        complex_intents = {"architecture_decision", "risk_synthesis", "debate_judgment",
                          "security_review", "constitutional_check", "strategic_analysis"}
        return 1.0 if task.intent in complex_intents else 0.3
    
    def _score_reversibility(self, task: Task) -> float:
        if task.reversibility == "irreversible":    return 1.0
        if task.reversibility == "partially":       return 0.6
        return 0.1  # reversible
    
    def _score_governance(self, task: Task) -> float:
        # Any H-NNN rule involvement → high governance sensitivity
        if task.requires_human_approval:             return 1.0
        if task.touches_constitution:                return 0.9
        if task.security_classification == "critical": return 0.8
        return 0.1
```

---

## Routing Decision

```python
class ModelTierRouter:
    
    TIER_1_THRESHOLD = 0.10
    TIER_2_THRESHOLD = 0.30
    
    # Per-agent tier overrides (some agents always need Sonnet/Opus)
    AGENT_TIER_OVERRIDES = {
        "arch-principal":    "T3",   # architectural decisions always complex
        "gov-risk":          "T3",   # governance always needs full reasoning
        "constitution-guardian": "T3",
        "exec-cpo":          "T3",
        "exec-cto":          "T3",
        "qa-security":       "T3",
        "pm-lead":           "T2",   # PM work is moderate complexity
        "analytics-product": "T2",
        "delivery-manager":  "T2",
        "eng-distinguished": "T3",   # senior engineering decisions complex
    }
    
    BOOSTER_INTENTS = {
        "var_to_const", "add_types", "add_error_handling",
        "async_await_conversion", "format_artifact", "template_fill",
    }
    
    def route(self, agent_id: str, task: Task) -> ModelTier:
        # 1. Check for WASM-eligible intents first
        if task.intent in self.BOOSTER_INTENTS:
            return ModelTier.T1_WASM
        
        # 2. Check agent overrides
        if agent_id in self.AGENT_TIER_OVERRIDES:
            return ModelTier[self.AGENT_TIER_OVERRIDES[agent_id]]
        
        # 3. Score complexity
        complexity = self.scorer.score(task)
        
        if complexity < self.TIER_1_THRESHOLD:
            return ModelTier.T1_WASM
        if complexity < self.TIER_2_THRESHOLD:
            return ModelTier.T2_HAIKU
        return ModelTier.T3_SONNET
    
    def select_model(self, tier: ModelTier) -> str:
        models = {
            ModelTier.T1_WASM:    "agent-booster-wasm",
            ModelTier.T2_HAIKU:   "claude-haiku-4-5-20251001",
            ModelTier.T3_SONNET:  "claude-sonnet-4-6",
        }
        return models[tier]
    
    def should_upgrade_to_opus(self, task: Task) -> bool:
        """Upgrade from Sonnet to Opus for highest-stakes irreversible decisions."""
        return (
            task.reversibility == "irreversible" and
            task.requires_human_approval and
            task.governance_sensitivity >= 0.9
        )
```

---

## Agent Tier Profiles

Every agent has a default tier profile derived from its authority tier in the MASTER-REGISTRY:

```
Authority Tier → Default Model Tier
─────────────────────────────────────
T5 (Executive/Constitutional) → T3 Sonnet (Opus for irreversible)
T4 (Strategic/Governance)     → T3 Sonnet
T3 (AI-Native/Architecture)   → T3 Sonnet
T2 (Product/Engineering/QA)   → T2 Haiku (T3 for complex subtasks)
T1 (Execution/Operational)    → T1 WASM (T2 for reasoning tasks)
```

---

## Performance Scoring for Tier Selection

Adaptive tier selection tracks historical performance per agent per task type:

```python
class AdaptiveTierSelector:
    """Adjust tier selection based on historical success rates."""
    
    def __init__(self):
        self.performance_history: dict[tuple[str, str], list[bool]] = {}  # (agent, tier) → results
    
    def record_outcome(self, agent_id: str, tier: str, success: bool, quality_score: float):
        key = (agent_id, tier)
        if key not in self.performance_history:
            self.performance_history[key] = []
        self.performance_history[key].append(success and quality_score >= 0.7)
    
    def recommend_tier(self, agent_id: str, base_tier: str) -> str:
        """Upgrade tier if base tier has <70% success rate for this agent."""
        key = (agent_id, base_tier)
        history = self.performance_history.get(key, [])
        if len(history) >= 5:
            success_rate = sum(history[-10:]) / len(history[-10:])
            if success_rate < 0.70:
                return self._upgrade_tier(base_tier)
        return base_tier
    
    def _upgrade_tier(self, tier: str) -> str:
        upgrades = {"T1_WASM": "T2_HAIKU", "T2_HAIKU": "T3_SONNET", "T3_SONNET": "T3_SONNET"}
        return upgrades.get(tier, tier)
```

---

## Cost Guard

Prevents budget overruns on T3 invocations:

```python
class CostGuard:
    """Budget enforcement for model tier routing."""
    
    DAILY_BUDGET_USD = 10.0          # configurable per deployment
    T3_SONNET_COST_PER_CALL = 0.003
    T2_HAIKU_COST_PER_CALL  = 0.0002
    
    def __init__(self):
        self.daily_spend = 0.0
        self.t3_calls_today = 0
    
    def approve_tier(self, requested_tier: ModelTier) -> ModelTier:
        """Downgrade tier if budget is exhausted."""
        projected = self.daily_spend + self._cost(requested_tier)
        if projected > self.DAILY_BUDGET_USD:
            if requested_tier == ModelTier.T3_SONNET:
                return ModelTier.T2_HAIKU   # downgrade, not block
        return requested_tier
    
    def _cost(self, tier: ModelTier) -> float:
        return {
            ModelTier.T3_SONNET: self.T3_SONNET_COST_PER_CALL,
            ModelTier.T2_HAIKU:  self.T2_HAIKU_COST_PER_CALL,
            ModelTier.T1_WASM:   0.0,
        }.get(tier, 0.0)
```
