# Scenario Planning Engine
**ID:** SI-SCEN-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Master coordinator for enterprise scenario planning. Creates, runs, tracks, and synthesizes strategic scenarios that model alternative futures the enterprise must prepare for. Scenario outputs inform executive decisions, resource allocation, risk mitigation, and strategic option development.

---

## Scenario Types

| Type | Description | Typical Trigger | Timeline |
|------|-------------|----------------|---------|
| STRATEGIC_OPTION | Models a specific strategic bet (build/buy/partner) | Product discovery, M&A signal | 2–5 years |
| THREAT_RESPONSE | Models how to respond to a specific threat | P0/P1 threat from radar | 6–18 months |
| MARKET_SHIFT | Models business implications of a market change | Market signal, analyst report | 1–3 years |
| REGULATORY_IMPACT | Models compliance cost/opportunity from regulatory change | Regulatory signal | 3–18 months |
| COMPETITIVE_WAR | Models moves in a competitive battle for a segment | Competitive signal P0/P1 | 3–12 months |
| TECHNOLOGY_SHIFT | Models implications of tech platform change | Technology signal | 6–24 months |
| ORG_CHANGE | Models org restructuring impact | Org evolution trigger | 3–12 months |
| RESOURCE_CONSTRAINT | Models operating under budget/headcount constraints | Financial signal | 1–4 quarters |

---

## Scenario Schema

```yaml
scenario:
  scenario_id: SCP-{YYYY}-{seq}
  type: [see types above]
  title: string                            # 80-char max
  triggering_signal: RAD-* | UIU-* | manual
  
  # Hypothesis
  central_question: string                 # "What happens if [X]?"
  time_horizon: ISO8601_range
  
  # Structural axes (2–4 key uncertainties)
  uncertainty_axes:
    - axis_id: AX-1
      description: string
      poles: [PESSIMISTIC_VALUE, OPTIMISTIC_VALUE]
      current_estimate: number             # 0.0 = pessimistic, 1.0 = optimistic
      confidence: 0.00–1.00
  
  # Worlds (combinations of axis values)
  worlds:
    - world_id: WLD-A
      name: string                         # e.g., "Best Case"
      axis_assignments: {AX-1: 0.85, AX-2: 0.70}
      probability: 0.00–1.00
      outcomes:
        business_impact: TRANSFORMATIVE_UPSIDE | HIGH_UPSIDE | NEUTRAL | HIGH_DOWNSIDE | CRITICAL_DOWNSIDE
        financial_impact: string           # quantified estimate range
        operational_impact: string
        strategic_impact: string
      required_actions: [string]           # what we must do to reach / handle this world
      leading_indicators: [string]         # signals that this world is materializing
  
  # Recommendations
  recommended_posture: string              # given current probability distribution
  hedging_actions: [string]               # actions that protect across all worlds
  option_creating_actions: [string]       # actions that open future options regardless
  
  # Status
  status: DRAFT | ACTIVE | DECISION_PENDING | CLOSED | ARCHIVED
  created_at: ISO8601
  updated_at: ISO8601
  decision_by: ISO8601 | null
  outcome_tracking_starts: ISO8601 | null
  
  # Governance
  owner: agent_id
  approver: agent_id                       # T3 minimum
  authorization_tier: T3 | T4 | T5
```

---

## Scenario Execution Protocol

### Phase 1: Frame (hours 0–4)
1. Parse triggering signal or radar item
2. Identify 2–4 key uncertainty axes (the variables that most determine outcomes)
3. Define 2–4 worlds (combinations of axis extremes)
4. Assign initial probability to each world

### Phase 2: Model (hours 4–24)
1. For each world, enumerate probable outcomes across: financial, operational, competitive, org
2. Use digital-twins/ simulation systems for quantitative impact modeling
3. Invoke `simulation-systems/scenario-model.md` for perturbation analysis
4. Cross-reference with historical data from `memory/strategic-intelligence/scenario-outcomes.yaml`

### Phase 3: Validate (hours 24–48)
1. Identify leading indicators for each world (observable signals that confirm/deny)
2. Check for internal consistency across worlds
3. Run adversarial review: assign `recursive-self-improvement/governance/improvement-safety-controller.md` to challenge assumptions
4. Quality gate: T3 review required before elevation to ACTIVE

### Phase 4: Recommend (hours 48–72)
1. Synthesize cross-world recommendations (what to do regardless of which world materializes)
2. Identify option-creating investments (keeps doors open)
3. Identify hedging actions (reduces downside in worst worlds)
4. Submit to `executive-intelligence/executive-decision-engine.md` for packaging

### Phase 5: Track (ongoing)
1. Monitor leading indicators weekly (via `strategic-drift-detector.md`)
2. Update world probabilities when new signals arrive
3. Trigger re-analysis if probability distribution shifts > 0.20 in any world

---

## Activation Modes

| Mode | Trigger | Timeline | Parallelism |
|------|---------|---------|------------|
| EXPEDITED | P0 radar item | 48 hours | Full parallel (all phases overlap) |
| STANDARD | P1/P2 radar item | 72 hours | Sequential with overlap |
| DEEP | Strategic planning cycle | 2 weeks | Full deliberation |
| CONTINUOUS | Background monitoring | Ongoing | Low-priority async |

---

## Governance

**Authorization:**
- Scenario creation: T3
- World probability assignment > 0.80 for any CRITICAL_DOWNSIDE world: T4 review
- Board scenario submission: T5
**Audit:** `memory/strategic-intelligence/scenario-log.jsonl` (append-only)
**Constitutional bindings:** C-001 (all scenario-driven decisions are human decisions), C-003 (explainability of world models)
