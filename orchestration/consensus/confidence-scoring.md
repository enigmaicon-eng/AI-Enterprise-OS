# Confidence Scoring

**Component:** consensus-frameworks/confidence-scoring  
**Role:** 5-tier signal normalization, agreement quantification, confidence thresholds  
**Source Primitives:** TradingAgents (SignalProcessor 5-tier rating), ruflo (performance scoring, PageRank weighting)

---

## Overview

Every consensus decision carries a confidence score. This component standardizes how confidence is computed, normalized, and used to gate decision execution. It adapts TradingAgents' 5-tier signal normalization for enterprise decision signals and adds agreement quantification for multi-agent scenarios.

---

## 5-Tier Decision Signal (from TradingAgents)

Adapted from TradingAgents SignalProcessor — normalized from any raw rating to a 5-tier scale:

```python
class DecisionSignalProcessor:
    """
    Adapted from TradingAgents SignalProcessor.process_signal().
    Normalizes any agent decision into a standard 5-tier signal.
    """
    
    SIGNAL_TIERS = {
        "strong_build": 5,    # Equivalent to TradingAgents "Strong Buy"
        "build":        4,    # Equivalent to "Buy" / "Overweight"
        "defer":        3,    # Equivalent to "Hold"
        "reject":       2,    # Equivalent to "Underweight" / "Sell"
        "escalate":     1,    # No equivalent — requires human judgment
    }
    
    # Aliases that various agents may produce
    SIGNAL_ALIASES = {
        # Strong Build
        "approve", "accept", "greenlight", "ship", "go", "approved", "build_now": "strong_build",
        # Build
        "build", "proceed", "continue", "do_it", "yes": "build",
        # Defer
        "defer", "hold", "wait", "more_info", "not_now", "revisit": "defer",
        # Reject
        "reject", "no", "block", "decline", "stop", "cancel": "reject",
        # Escalate
        "escalate", "human_required", "unclear", "constitutional_review": "escalate",
    }
    
    def normalize(self, raw_signal: str) -> str:
        """Normalize any agent output string to a standard 5-tier signal."""
        normalized = raw_signal.lower().strip().replace(" ", "_").replace("-", "_")
        
        # Direct match
        if normalized in self.SIGNAL_TIERS:
            return normalized
        
        # Alias match
        for aliases, canonical in [
            (["approve", "accept", "greenlight", "ship", "go", "approved"], "strong_build"),
            (["build", "proceed", "continue", "do_it"], "build"),
            (["defer", "hold", "wait", "more_info", "not_now", "revisit"], "defer"),
            (["reject", "no", "block", "decline", "stop", "cancel"], "reject"),
            (["escalate", "human_required", "unclear"], "escalate"),
        ]:
            if normalized in aliases:
                return canonical
        
        # Unknown signal — treat as escalate (safe default)
        return "escalate"
    
    def signal_score(self, signal: str) -> int:
        """Integer score for comparison and aggregation."""
        return self.SIGNAL_TIERS.get(self.normalize(signal), 1)
    
    def aggregate(self, signals: list[str], weights: dict[str, float] | None = None) -> str:
        """Weighted aggregate of multiple agent signals."""
        if not signals:
            return "escalate"
        
        if weights is None:
            weights = {str(i): 1.0 for i in range(len(signals))}
        
        total_weight = sum(weights.values())
        weighted_score = sum(
            self.signal_score(signal) * weights.get(str(i), 1.0)
            for i, signal in enumerate(signals)
        ) / max(total_weight, 1)
        
        # Map back to tier
        tiers_by_score = sorted(self.SIGNAL_TIERS.items(), key=lambda x: x[1])
        for tier_name, tier_score in tiers_by_score:
            if weighted_score <= tier_score + 0.5:
                return tier_name
        return "strong_build"
```

---

## Confidence Score Computation

```python
class ConfidenceScorer:
    """
    Compute confidence score for a consensus decision.
    Combines agreement rate, evidence quality, agent authority, and debate depth.
    """
    
    def compute(self, consensus_result: ConsensusResult) -> float:
        """Returns confidence score: 0.0 (no confidence) to 1.0 (maximum confidence)."""
        
        components = {
            "agreement_rate":  self._agreement_rate(consensus_result),
            "evidence_quality": self._evidence_quality(consensus_result),
            "authority_weight": self._authority_weight(consensus_result),
            "debate_depth":     self._debate_depth(consensus_result),
        }
        
        weights = {
            "agreement_rate":  0.40,
            "evidence_quality": 0.25,
            "authority_weight": 0.20,
            "debate_depth":     0.15,
        }
        
        return sum(components[k] * weights[k] for k in components)
    
    def _agreement_rate(self, result: ConsensusResult) -> float:
        """What fraction of participating agents agree with the final decision?"""
        if not result.participating_agents:
            return 0.5
        agreeing = sum(1 for a in result.participating_agents
                      if result.agent_signals.get(a) == result.final_signal)
        return agreeing / len(result.participating_agents)
    
    def _evidence_quality(self, result: ConsensusResult) -> float:
        """Average evidence quality score across supporting arguments."""
        evidence_scores = {
            "production_metrics":   1.0,
            "user_research":        0.9,
            "analytics_report":     0.85,
            "expert_assessment":    0.75,
            "historical_pattern":   0.65,
            "architectural_review": 0.70,
            "opinion":              0.30,
        }
        if not result.evidence_types:
            return 0.5
        return sum(evidence_scores.get(e, 0.5) for e in result.evidence_types) / len(result.evidence_types)
    
    def _authority_weight(self, result: ConsensusResult) -> float:
        """Weighted by authority tier of agreeing agents."""
        if not result.participating_agents:
            return 0.5
        total_weight = 0.0
        agreeing_weight = 0.0
        for agent_id in result.participating_agents:
            tier = self.registry.tier(agent_id)
            weight = tier / 5.0
            total_weight += weight
            if result.agent_signals.get(agent_id) == result.final_signal:
                agreeing_weight += weight
        return agreeing_weight / max(total_weight, 0.001)
    
    def _debate_depth(self, result: ConsensusResult) -> float:
        """More rounds of structured debate = higher confidence in outcome."""
        rounds = result.debate_rounds or 0
        return min(rounds / 4.0, 1.0)   # full confidence at 4+ rounds
```

---

## Confidence Thresholds

Execution gates require minimum confidence before proceeding:

```python
CONFIDENCE_THRESHOLDS = {
    # By decision reversibility
    "reversible":            0.50,   # majority agreement sufficient
    "partially_reversible":  0.70,   # strong majority required
    "irreversible":          0.85,   # near-unanimous required
    
    # By authority tier required
    "tier_1":  0.50,
    "tier_2":  0.60,
    "tier_3":  0.70,
    "tier_4":  0.80,
    "tier_5":  0.90,
    
    # By gate
    "G1": 0.50,    # Intent classification
    "G2": 0.60,    # PRD readiness
    "G3": 0.70,    # Architecture review
    "G4": 0.65,    # Implementation readiness
    "G5": 0.75,    # QA acceptance
    "G6": 0.80,    # Security clearance
    "G7": 0.90,    # Release authorization
    "G8": 0.70,    # Post-release validation
}

def confidence_gate(decision: ConsensusDecision, gate_id: str) -> GateResult:
    """Gate check: is this decision's confidence sufficient to proceed?"""
    threshold = CONFIDENCE_THRESHOLDS.get(gate_id, 0.70)
    
    # Take strictest threshold (reversibility or gate, whichever is higher)
    reversibility_threshold = CONFIDENCE_THRESHOLDS.get(decision.reversibility, 0.70)
    effective_threshold = max(threshold, reversibility_threshold)
    
    if decision.confidence >= effective_threshold:
        return GateResult(passed=True, confidence=decision.confidence)
    
    return GateResult(
        passed=False,
        confidence=decision.confidence,
        gap=effective_threshold - decision.confidence,
        remediation=f"Need {effective_threshold:.0%} confidence; have {decision.confidence:.0%}. "
                   f"Consider additional expert perspectives or escalating debate."
    )
```

---

## Agreement Quantification

How to measure agent agreement across a debate or vote:

```python
class AgreementQuantifier:
    
    def quantify(self, agent_signals: dict[str, str]) -> AgreementMetrics:
        signals = list(agent_signals.values())
        if not signals:
            return AgreementMetrics(rate=0.0, dominant_signal="unknown", plurality=0.0)
        
        # Count signal frequencies
        from collections import Counter
        counts = Counter(signals)
        dominant_signal, dominant_count = counts.most_common(1)[0]
        
        # Agreement rate: fraction sharing the dominant signal
        agreement_rate = dominant_count / len(signals)
        
        # Plurality: margin over second-most-common
        if len(counts) > 1:
            second_count = counts.most_common(2)[1][1]
            plurality = (dominant_count - second_count) / len(signals)
        else:
            plurality = 1.0  # unanimous
        
        # Entropy: higher entropy = less consensus
        from math import log2
        entropy = -sum((c / len(signals)) * log2(c / len(signals)) 
                      for c in counts.values() if c > 0)
        max_entropy = log2(len(counts)) if len(counts) > 1 else 1
        normalized_entropy = entropy / max(max_entropy, 1)
        
        return AgreementMetrics(
            rate=agreement_rate,
            dominant_signal=dominant_signal,
            plurality=plurality,
            entropy=normalized_entropy,
            is_unanimous=agreement_rate == 1.0,
            is_majority=agreement_rate > 0.5,
            has_supermajority=agreement_rate >= 0.667,
        )
```

---

## Confidence Decay

Confidence scores decay over time for time-sensitive decisions:

```python
class ConfidenceDecay:
    """
    Reduce confidence as decisions age — stale consensus should be re-evaluated.
    """
    
    HALF_LIFE_HOURS = {
        "product_direction":    48,    # 2 days before re-evaluation recommended
        "architecture_decision": 720,  # 30 days (ADR lifespan)
        "sprint_commitment":    168,   # 1 week (sprint duration)
        "risk_assessment":      24,    # 1 day (fast-moving risk)
        "release_approval":     4,     # 4 hours (time-sensitive)
    }
    
    def current_confidence(self, original_confidence: float, 
                          decision_type: str, 
                          hours_elapsed: float) -> float:
        half_life = self.HALF_LIFE_HOURS.get(decision_type, 168)
        decay_factor = 0.5 ** (hours_elapsed / half_life)
        return original_confidence * decay_factor
```
