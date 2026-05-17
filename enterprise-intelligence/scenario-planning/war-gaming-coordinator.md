# War Gaming Coordinator
**ID:** SI-SCEN-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Orchestrates structured adversarial war gaming sessions that simulate competitor responses to our strategic moves and test the robustness of our strategy under competitive attack. War games produce stress-tested strategic options and reveal hidden vulnerabilities before commitment.

---

## War Game Types

| Type | Purpose | Participants | Duration |
|------|---------|-------------|---------|
| PRODUCT_LAUNCH | Test competitor response to new product/feature | PM, Strategy, Competitive Intel | 4 hours |
| PRICING_CHANGE | Model market dynamics after pricing move | PM, Finance, Strategy | 3 hours |
| MARKET_ENTRY | Test strategy for entering new segment | Strategy, Product, Sales | 6 hours |
| DEFEND_SEGMENT | Simulate being attacked in core market | All T3 stakeholders | 6 hours |
| M&A_RESPONSE | Model response to competitor acquisition | Executive team | 4 hours |
| REGULATORY_ARBITRAGE | Model regulatory scenarios before they occur | Legal, Compliance, Strategy | 4 hours |

---

## War Game Session Schema

```yaml
war_game:
  game_id: WG-{YYYY}-{seq}
  type: [see types above]
  scenario_ref: SCP-* | null
  title: string
  
  # Setup
  trigger: RAD-* | UIU-* | strategic-planning-cycle | manual
  
  # Teams
  blue_team:
    role: "Our organization"
    agents: [agent_ids]
    strategy_brief: string           # our declared strategy going in
    resources: {budget: n, headcount: n, time_horizon: months}
    
  red_team:
    role: "Primary competitor or adversarial market force"
    agents: [agent_ids]
    competitor_profile: COMP-*       # from competitive-intelligence-hub.md
    objectives: [string]             # what the red team is trying to achieve
    
  neutral_team:
    role: "Market, customers, regulators"
    agents: [agent_ids]
    market_model_ref: string         # from market-signal-processor.md
    
  # Rounds
  rounds:
    - round: 1
      phase: INITIAL_MOVE
      blue_move: string
      red_response: string
      market_reaction: string
      outcome_delta: {market_share: n, revenue_impact: string, brand_impact: string}
      
    - round: 2
      phase: COUNTER_MOVE
      # ... continues
  
  # Results
  final_board_state:
    blue_position: STRONGER | MAINTAINED | WEAKENED | CRITICAL
    vulnerabilities_exposed: [string]
    unexpected_outcomes: [string]
    
  # Synthesis
  strategic_learnings: [string]     # top 5 insights
  recommended_adjustments: [string] # modifications to original strategy
  pre_emptive_moves: [string]       # actions to take before the scenario materializes
  indicators_to_monitor: [string]   # early warning signals to track
  
  # Governance
  status: SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED
  created_at: ISO8601
  completed_at: ISO8601 | null
  authorization_tier: T3
```

---

## Execution Protocol (Standard 4-hour format)

```
00:00–00:30  BRIEFING
  - Facilitator (war-gaming-coordinator agent) presents scenario context
  - Teams receive initial strategy briefs
  - Rules of engagement established (what is in/out of scope)

00:30–01:30  ROUND 1: Initial Positions
  - Blue team declares opening strategic move
  - Red team formulates response (independent of blue team, 30 min)
  - Neutral team applies market/customer/regulatory reactions
  - Facilitator synthesizes round 1 outcome

01:30–02:30  ROUND 2: Counter-Moves
  - Blue team responds to red + market reactions
  - Red team escalates or pivots
  - Neutral team applies second-order market effects
  - Facilitator synthesizes round 2 outcome

02:30–03:30  ROUND 3: Endgame Scenarios
  - Both teams play out 3 distinct endgame paths
  - Facilitator maps probability to each path
  - Critical decision points identified

03:30–04:00  SYNTHESIS
  - Cross-team debrief
  - Facilitator generates strategic learnings
  - Recommended adjustments to original strategy
  - Pre-emptive moves prioritized
```

---

## Red Team Intelligence

The red team plays competitors using the competitive intelligence hub profiles. Playing principles:
1. **Best rational response** — play the competitor as they would rationally act, not as we wish they would act
2. **Resource-constrained** — red team operates within estimated competitor resource bounds
3. **Information asymmetry** — red team does not know our full internal strategy; only what is public
4. **Surprise is expected** — at least one red team move per round should be unexpected from blue team's perspective

---

## War Game Calibration

After each war game:
- Compare predicted competitor moves to actual moves (30-day window for PRODUCT_LAUNCH, 90-day for MARKET_ENTRY)
- Update competitor profile confidence scores in competitive-intelligence-hub.md
- Archive red team move playbook to `memory/strategic-intelligence/war-game-library.yaml`

**Calibration target:** Red team move accuracy > 0.60 (meaning our models predict competitor behavior correctly > 60% of the time over a 90-day window).
