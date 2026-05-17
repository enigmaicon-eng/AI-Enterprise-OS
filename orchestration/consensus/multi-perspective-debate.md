# Multi-Perspective Debate

**Component:** consensus-frameworks/multi-perspective-debate  
**Role:** Structured debate between opposing viewpoints, count-based termination, judge synthesis  
**Source Primitives:** TradingAgents (InvestDebateState, RiskDebateState, ConditionalLogic, Research Manager, Portfolio Manager)

---

## Overview

Multi-perspective debate is the primary consensus mechanism for contested enterprise decisions. It pits two or more agents representing distinct viewpoints against each other in structured rounds, then routes to a judge who synthesizes the debate history into an authoritative decision.

This pattern is extracted directly from TradingAgents' multi-agent financial research system and adapted for enterprise product, architecture, and risk decisions.

---

## Pattern 1: Two-Perspective Debate (Build vs Defer)

Adapted from TradingAgents InvestDebateState + Bull/Bear pattern.

### State

```typescript
interface TwoWayDebateState {
  advocate_a_history: string;       // e.g., "build" position cumulative history
  advocate_b_history: string;       // e.g., "defer" position cumulative history
  history: string;                  // interleaved full debate transcript
  current_response: string;         // most recent argument
  current_response_from: string;    // which advocate just spoke
  judge_decision: string;           // empty until finalized
  count: number;                    // total rounds taken
}
```

### Termination Logic (from TradingAgents ConditionalLogic)

```python
def should_continue_debate(state: CoordinationState, config: DebateConfig) -> str:
    """
    Exact adaptation of TradingAgents ConditionalLogic.should_continue_debate.
    Terminates at 2x max_debate_rounds, round-robins until then.
    """
    debate = state["debate_state"]
    
    # Termination: count has reached 2 × max_rounds
    if debate["count"] >= 2 * config.max_debate_rounds:
        return config.judge_agent    # advance to synthesis
    
    # Round-robin: if A just spoke, B speaks next (and vice versa)
    if debate["current_response_from"] == config.advocate_a_agent:
        return config.advocate_b_agent
    
    return config.advocate_a_agent   # default: A goes first
```

### Judge Synthesis (from TradingAgents Research Manager)

```python
def judge_synthesis(state: CoordinationState, config: DebateConfig) -> str:
    """
    Adapted from TradingAgents research_manager node.
    Judge reads full debate history and produces structured verdict.
    """
    debate = state["debate_state"]
    
    judge_prompt = f"""
You are the {config.judge_role} for this decision debate.

## Advocate A ({config.advocate_a_label}) History:
{debate['advocate_a_history']}

## Advocate B ({config.advocate_b_label}) History:
{debate['advocate_b_history']}

## Full Debate Transcript:
{debate['history']}

## Past Context (prior decisions for this entity):
{state['past_context']}

Based on this debate, produce a structured decision with:
1. Signal: one of [strong_build, build, defer, reject, escalate]
2. Confidence: 0.0–1.0
3. Key factors that drove the decision
4. Dissenting considerations that must be monitored
5. Conditions that would change this decision
"""
    
    response = invoke_with_fallback(judge_prompt, config.judge_agent)
    state["debate_state"]["judge_decision"] = response
    state["debate_state"]["latest_speaker"] = "Judge"
    return response
```

### Enterprise Applications

| Decision Type | Advocate A | Advocate B | Judge |
|--------------|------------|------------|-------|
| Build vs Defer | PM (advocate build) | Architect (technical risk) | CPO |
| Greenfield vs Extension | Architect (greenfield) | Engineering (extend) | CTO |
| Fast vs Safe | Delivery (velocity) | Governance (risk) | PM Lead |
| Buy vs Build | Strategy (buy) | Engineering (build) | CPO + CTO |

---

## Pattern 2: Three-Perspective Risk Analysis (Aggressive / Conservative / Neutral)

Adapted from TradingAgents RiskDebateState + Portfolio Manager pattern.

### State

```typescript
interface ThreeWayRiskState {
  aggressive_history: string;             // risk-accepting position
  conservative_history: string;           // risk-averse position
  neutral_history: string;                // balanced position
  history: string;                        // full interleaved transcript
  latest_speaker: string;                 // tracks round-robin
  current_aggressive_response: string;
  current_conservative_response: string;
  current_neutral_response: string;
  judge_decision: string;
  count: number;
}
```

### Round-Robin Rotation (from TradingAgents ConditionalLogic)

```python
def should_continue_risk_analysis(state: CoordinationState, config: RiskDebateConfig) -> str:
    """
    Exact adaptation of TradingAgents ConditionalLogic.should_continue_risk_analysis.
    Terminates at 3x max_risk_rounds (one round = all three perspectives speaking).
    """
    risk = state["risk_state"]
    
    # Termination: each perspective has spoken max_risk_rounds times
    if risk["count"] >= 3 * config.max_risk_discuss_rounds:
        return config.risk_judge_agent
    
    # Round-robin: Aggressive → Conservative → Neutral → Aggressive → ...
    latest = risk["latest_speaker"]
    if latest.startswith("aggressive"):   return config.conservative_agent
    if latest.startswith("conservative"): return config.neutral_agent
    return config.aggressive_agent       # default or after neutral
```

### Risk Judge Synthesis (from TradingAgents Portfolio Manager)

```python
def risk_judge_synthesis(state: CoordinationState, config: RiskDebateConfig) -> str:
    """
    Adapted from TradingAgents portfolio_manager node.
    Synthesizes three-analyst risk debate with past_context for cross-session continuity.
    """
    risk = state["risk_state"]
    
    judge_prompt = f"""
You are the {config.risk_judge_role} synthesizing a three-perspective risk analysis.

## Research Plan (from prior analysis):
{state.get('analysis_report', 'Not yet available')}

## Aggressive Risk Position History:
{risk['aggressive_history']}

## Conservative Risk Position History:
{risk['conservative_history']}

## Neutral Risk Position History:
{risk['neutral_history']}

## Past Context (prior risk decisions for this entity):
{state['past_context']}

Produce a risk verdict with:
1. Risk level: [critical, high, medium, low, negligible]
2. Primary risk factors (top 3)
3. Recommended mitigations
4. Conditions requiring escalation to human
5. Monitoring triggers
"""
    
    response = invoke_with_fallback(judge_prompt, config.risk_judge_agent)
    state["risk_state"]["judge_decision"]  = response
    state["risk_state"]["latest_speaker"]  = "Judge"
    return response
```

### Enterprise Applications

| Decision Context | Aggressive | Conservative | Neutral | Judge |
|-----------------|------------|--------------|---------|-------|
| Timeline risk | Delivery (compress) | QA (slow down) | PM (baseline) | PM Lead |
| Technical risk | Engineering (ship fast) | Architecture (design first) | QA (test first) | CTO |
| Compliance risk | Product (ship now) | Governance (wait) | Legal review | CPO |
| Budget risk | Finance (invest) | Strategy (conserve) | Analytics (model) | CPO |

---

## Debate Configuration

```python
@dataclass
class DebateConfig:
    max_debate_rounds: int = 2           # 2-perspective: terminates at count >= 4
    max_risk_rounds: int = 1             # 3-perspective: terminates at count >= 3
    advocate_a_agent: str = "pm-lead"
    advocate_b_agent: str = "arch-principal"
    judge_agent: str = "exec-cpo"
    advocate_a_label: str = "Build"
    advocate_b_label: str = "Defer"
    judge_role: str = "Chief Product Officer"

@dataclass
class RiskDebateConfig:
    max_risk_discuss_rounds: int = 1
    aggressive_agent: str = "delivery-manager"
    conservative_agent: str = "gov-risk"
    neutral_agent: str = "pm-lead"
    risk_judge_agent: str = "exec-cpo"
    risk_judge_role: str = "Chief Product Officer"
```

---

## Structured Output Fallback

From TradingAgents `bind_structured + invoke_structured_or_freetext` pattern:

```python
def invoke_with_fallback(prompt: str, agent_id: str) -> str:
    """
    Attempt structured output first; fall back to freetext parsing if schema validation fails.
    From TradingAgents bind_structured pattern.
    """
    try:
        structured_response = invoke_structured(prompt, agent_id, schema=DecisionSchema)
        return structured_response
    except StructuredOutputError:
        # Graceful degradation: parse freetext for key fields
        freetext = invoke_freetext(prompt, agent_id)
        return parse_decision_from_freetext(freetext)
```

---

## Debate State Initialization

```python
def init_debate_state() -> TwoWayDebateState:
    return {
        "advocate_a_history": "",
        "advocate_b_history": "",
        "history": "",
        "current_response": "",
        "current_response_from": "",
        "judge_decision": "",
        "count": 0,
    }

def init_risk_state() -> ThreeWayRiskState:
    return {
        "aggressive_history": "",
        "conservative_history": "",
        "neutral_history": "",
        "history": "",
        "latest_speaker": "",
        "current_aggressive_response": "",
        "current_conservative_response": "",
        "current_neutral_response": "",
        "judge_decision": "",
        "count": 0,
    }
```
