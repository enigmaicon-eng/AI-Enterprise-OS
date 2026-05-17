---
layer: wiki
section: research
type: synthesis
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
synthesis-id: SYN-002
source: external-research/TradingAgents/
---

# TradingAgents Patterns — Enterprise AI OS Adaptations

Patterns extracted from TradingAgents (v0.2.4) and adapted for the Enterprise AI OS.

---

## Pattern TA-001: Step-Level Checkpoint/Resume

**Origin:** TradingAgents' LangGraph state management with checkpoint/resume

**Enterprise AI OS Adaptation:**
Every workflow step writes a checkpoint after completion. This enables exact resume after session boundary:

```yaml
# Written to: memory/workflow-state/{instance-id}/checkpoints/step-{N}.md
checkpoint:
  step-number: N
  completed-at: "{ISO-8601}"
  workflow-instance-id: "{id}"
  step-id: "{step-name}"
  artifacts-produced: ["{paths}"]
  agent-id: "{agent-id}"
  next-step: "{step-name}"
  consistency-hash: "{hash}"
```

**Key insight from TradingAgents:** A checkpoint written after step N means step N is complete and does not need to be re-executed if the session ends. The resume point is step N+1, not step N.

**Where implemented:** `memory-governance/continuity-checkpoint-system.md`, `knowledge-governance/runtime-state-synchronization.md`

**When to use:** Every workflow step completion (mandatory).

---

## Pattern TA-002: Structured Output Enforcement

**Origin:** TradingAgents' structured output agents (schema-enforced outputs)

**Enterprise AI OS Adaptation:**
All artifacts produced by agents must conform to a declared schema before being accepted as valid. Schema validation occurs at the gate passage point:

1. Agent produces artifact to scratchpad
2. Artifact is validated against output schema (from template)
3. If schema validation fails → artifact rejected, agent retries
4. If schema validation passes → artifact accepted, step checkpoint written

This prevents "garbage in, garbage out" propagation across workflow steps.

**Where implemented:** `knowledge-governance/artifact-authority-system.md` (ATR YAML spec), templates/

**When to use:** All artifact-producing workflow steps.

---

## Pattern TA-003: Multi-Agent Debate for Contested Decisions

**Origin:** TradingAgents' multi-agent debate (bull/bear analyst debate framework)

**Enterprise AI OS Adaptation:**
For contested decisions (where reasonable agents could disagree), the Enterprise AI OS uses a structured debate protocol:

1. **Position agents:** Two agents (or one agent with two perspectives) produce position arguments for each side of the decision
2. **Arbiter agent:** A higher-tier agent reviews the positions and makes the decision
3. **Record:** Decision record captures both positions and the arbiter's reasoning

This is appropriate for:
- Architecture decisions where multiple valid approaches exist
- Product tradeoff decisions (speed vs. quality, scope vs. timeline)
- Risk prioritization (which risks to address first)

**Not appropriate for:**
- Decisions already covered by a binding ADR (no debate needed)
- P0 constraint violations (the constraint always wins)
- Operational decisions with a clear authority (the authority decides)

**Where implemented:** `knowledge-governance/artifact-authority-system.md` (multi-agent parallel+arbiter pattern), `knowledge-governance/contradiction-resolution-system.md` (Case B: same-tier contradiction)

**When to use:** Complex architectural and strategic decisions.

---

## Pattern TA-004: Confidence Threshold Gates

**Origin:** TradingAgents' confidence threshold for decision acceptance

**Enterprise AI OS Adaptation:**
Before a high-stakes artifact is accepted, the producing agent must assess its own confidence:

```yaml
confidence-assessment:
  artifact: "{path}"
  confidence-score: 0-100
  factors:
    - completeness: {score}    # all required sections present
    - consistency: {score}     # no internal contradictions
    - evidence-base: {score}   # claims are supported by sources
    - scope-clarity: {score}   # scope is clearly defined
  threshold: 75               # minimum acceptable confidence
  action-if-below: ESCALATE  # escalate to higher authority if below threshold
```

If confidence is below threshold:
- NORMAL tier artifacts: WARN, proceed with confidence note
- HIGH tier artifacts: Request peer review before acceptance
- CRITICAL tier artifacts: ESCALATE to T3+ authority

**Where implemented:** `state-models/agent-execution-states.md` (WAITING_GATE state), `knowledge-governance/artifact-authority-system.md`

**When to use:** PRD approval, ADR finalization, architecture decisions, security review.

---

## Pattern TA-005: Temporal State Isolation

**Origin:** TradingAgents' time-indexed data management (market data doesn't bleed across time periods)

**Enterprise AI OS Adaptation:**
Workflow artifacts from different sessions/sprints must be explicitly linked, not assumed to be current. The run-context carries temporal markers:

```yaml
run-context:
  workflow-instance-id: "{id}"
  session-created: "{date}"
  artifacts-produced:
    - path: "{artifact}"
      produced-at: "{ISO-8601}"    # explicit timestamp
      session-id: "{session-id}"   # which session produced this
```

When loading prior artifacts in a new session, the routing engine checks `produced-at` vs. current date. If the artifact is older than its type's freshness TTL, the agent is warned that the artifact may be stale.

**Where implemented:** `knowledge-governance/runtime-state-synchronization.md`, `memory-routing/context-routing-engine.md`

**When to use:** Resuming long-running workflows across session boundaries.

---

## Patterns Considered But Not Adapted

| TradingAgents Pattern | Reason Not Adapted |
|---|---|
| Real-time market data feeds | Domain-specific (financial trading); no equivalent in product OS |
| Backtesting framework | Domain-specific |
| LangGraph server runtime | Requires live execution infrastructure (GAP: CRITICAL-001) |
| Portfolio risk management | Domain-specific |