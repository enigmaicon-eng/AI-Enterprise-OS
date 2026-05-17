# Coordination Engine

**Component:** coordination-runtime/coordination-engine  
**Role:** Core agent-to-agent communication and pattern execution  
**Runtime Phase:** RT-1 compatible, RT-2 event-driven upgrade path

---

## Overview

The Coordination Engine handles all inter-agent communication within the Enterprise AI OS. It implements the named-agent SendMessage protocol from ruflo's production coordination system, adapted for the OS's 144-agent topology and constitutional governance constraints.

---

## Communication Protocol

### Named-Agent Addressing

Every agent in the coordination mesh has a stable name derived from its registry ID. Names are used as routing addresses — not UUIDs or dynamic handles.

```
Naming convention: <org-prefix>-<role>
Examples:
  pm-lead          ← Product Org lead PM
  arch-principal   ← Architecture Principal
  eng-distinguished ← Distinguished Engineer
  qa-security      ← Security QA
  gov-risk         ← Governance Risk Officer
```

### SendMessage Envelope

All inter-agent messages use the standard coordination envelope:

```yaml
coordination_message:
  from: "pm-lead"
  to: "arch-principal"
  summary: "Feature gate G2 passed — handoff to architecture"
  timestamp_utc: "2026-05-11T12:00:00Z"
  vector_clock:
    pm-lead: 3
    arch-principal: 0
  payload:
    type: "handoff"
    artifact_ref: "artifacts/prd-user-auth-v1.md"
    gate_status: {G1: passed, G2: passed}
    context_budget_remaining: 6400   # tokens
  correlation_id: "wf-2026-0511-001"
  requires_ack: true
```

### Message Types

| Type | Usage | Ack Required |
|------|-------|--------------|
| `handoff` | Transfer primary ownership of a work item | Yes |
| `request` | Ask another agent for output | Yes |
| `response` | Answer a prior request | No |
| `broadcast` | Inform all agents in a scope | No |
| `escalation` | Route to higher authority | Yes |
| `shutdown_request` | Gracefully terminate an agent | No |
| `status_update` | Progress report, no action needed | No |

---

## Coordination Patterns

### Pattern 1: Pipeline (A → B → C)

Sequential handoff chain. Each agent completes its work, then messages the next.

```
Intent Classification
       ↓
  [PM Agent]  →SendMessage→  [Architect]  →SendMessage→  [Engineer]
  PRD output                 ADR output                  Code output
       ↓                          ↓                          ↓
   Gate G1,G2               Gate G3,G4                  Gate G5,G6
```

**Termination:** final agent in chain sends to Supervisor for gate G8.

**Error handling:** any gate failure sends `escalation` back to the agent that last passed successfully. Recursion limit prevents infinite retry: `max_recur_limit = 100`.

### Pattern 2: Fan-Out / Fan-In

Parallel specialist invocation. Lead decomposes task, all specialists run concurrently, lead synthesizes.

```
                    ┌→ [Market Analyst]   ─→┐
                    ├→ [Risk Analyst]     ─→┤
[Orchestrator] ──→  ├→ [Technical Analyst]─→├──→ [Synthesizer] → output
                    ├→ [Legal Analyst]    ─→┤
                    └→ [Financial Analyst]─→┘
```

**Spawn protocol:**
```yaml
fan_out:
  coordinator: "orchestrator"
  workers:
    - {agent: "analytics-product", context_keys: [market_data, user_metrics]}
    - {agent: "gov-risk", context_keys: [risk_register, compliance_reqs]}
    - {agent: "arch-principal", context_keys: [system_context, constraints]}
  collect_at: "pm-lead"
  timeout_seconds: 300
  min_responses_required: 2      # proceed with partial results if timeout
```

**Fan-in synthesis:** collect all worker outputs into `synthesis_inputs[]`, pass to judge agent with full history.

### Pattern 3: Supervisor / Worker

Lead maintains authority throughout. Workers report back on each step.

```
[Delivery Manager] ←──→ [Sprint 1 Engineer]
        ↑                       ↓
        └──────────────── progress update
```

**Use when:** quality gate enforcement needed at every step, not just at handoff boundaries.

### Pattern 4: Multi-Perspective Debate (from TradingAgents)

N agents argue opposing positions, judge synthesizes. Terminates when round count reaches threshold.

```python
# Adapted from TradingAgents ConditionalLogic
def should_continue_debate(state: CoordinationState) -> str:
    if state["debate_state"]["count"] >= 2 * state["config"]["max_debate_rounds"]:
        return state["config"]["judge_agent"]   # advance to synthesizer
    if state["debate_state"]["current_response_from"] == "perspective_a":
        return "perspective_b_agent"
    return "perspective_a_agent"

def should_continue_risk_review(state: CoordinationState) -> str:
    if state["risk_state"]["count"] >= 3 * state["config"]["max_risk_rounds"]:
        return state["config"]["risk_judge_agent"]
    latest = state["risk_state"]["latest_speaker"]
    if latest.startswith("aggressive"):   return "conservative_analyst"
    if latest.startswith("conservative"): return "neutral_analyst"
    return "aggressive_analyst"
```

---

## Initial State Construction

Every coordination workflow starts with `create_initial_coordination_state`. Adapted from TradingAgents Propagator:

```python
def create_initial_coordination_state(
    intent: str,
    entity: str,
    context: str,
    past_context: str = ""     # injected from memory on repeat runs
) -> CoordinationState:
    return {
        "messages": [("human", entity)],
        "entity_of_interest": entity,
        "coordination_date": str(today()),
        "past_context": past_context,
        "workflow_intent": intent,
        "debate_state": DebateState({
            "perspective_a_history": "",
            "perspective_b_history": "",
            "history": "",
            "current_response": "",
            "current_response_from": "",
            "judge_decision": "",
            "count": 0,
        }),
        "risk_state": RiskAnalysisState({
            "aggressive_history": "",
            "conservative_history": "",
            "neutral_history": "",
            "history": "",
            "latest_speaker": "",
            "judge_decision": "",
            "count": 0,
        }),
        "analysis_report": "",
        "architecture_report": "",
        "risk_report": "",
        "governance_report": "",
    }

def get_engine_config(callbacks=None) -> dict:
    config = {"recursion_limit": 100}
    if callbacks:
        config["callbacks"] = callbacks
    return {
        "stream_mode": "values",
        "config": config,
    }
```

---

## Constitutional Gate Checks

Before any routing decision, the engine enforces constitutional prohibitions (§6.3). These are hard-blocked — no `!override` bypasses them at the engine level.

```python
CONSTITUTIONALLY_PROHIBITED = [
    "delete_production_data",
    "modify_audit_logs",
    "bypass_human_approval_gates",
    "deploy_without_gate_G7_clearance",
    "modify_enterprise_constitution",
    "grant_authority_tier_escalation",
    "disable_governance_monitor",
    "expose_credentials_in_artifacts",
    "remove_circuit_breakers",
    "execute_financial_transaction_above_threshold",
    "send_external_communication_without_approval",
    "access_PII_without_data_governance_clearance",
    "create_agent_with_tier_above_T3_autonomously",
]

def check_constitutional_gate(action: str, payload: dict) -> GateResult:
    if action in CONSTITUTIONALLY_PROHIBITED:
        return GateResult(blocked=True, reason="constitutional_prohibition", article="§6.3")
    if requires_human_approval(action):
        return GateResult(blocked=True, reason="human_approval_required", h_rule=lookup_h_rule(action))
    return GateResult(blocked=False)
```

---

## Engine Lifecycle

```
COORDINATION ENGINE LIFECYCLE
─────────────────────────────
1. RECEIVE intent from master-orchestrator
2. CHECK constitutional gate (§6.3, §7.1)
3. SELECT coordination pattern (pipeline / fan-out / debate / supervisor)
4. CONSTRUCT initial coordination state
5. INJECT past_context from memory namespace
6. ROUTE to first agent via SendMessage
7. EXECUTE pattern (bounded by recursion_limit)
8. COLLECT outputs
9. VALIDATE gates (G1-G8 as applicable)
10. PERSIST state to coordination namespace
11. EMIT metrics to observability layer
12. RETURN artifact envelope to orchestrator
```

---

## Error Recovery

| Error Condition | Recovery Action |
|----------------|-----------------|
| Agent non-responsive (>300s) | Retry once, then escalate to supervisor |
| Gate failure | Return to last passing agent with failure context |
| Recursion limit hit | Terminate with PARTIAL_COMPLETE status, log to failures/ |
| Constitutional block | Immediate halt, log to audit trail, notify governance agent |
| Fan-out timeout | Proceed with `min_responses_required` if threshold met |
| Debate deadlock (tie) | Judge breaks tie with confidence-weighted synthesis |
