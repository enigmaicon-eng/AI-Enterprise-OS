# Strategic Options Generator
**ID:** SI-SCEN-003 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Generates structured strategic options from scenario analysis, competitive intelligence, and market signals. Transforms intelligence into concrete choices the executive team can evaluate and decide upon. Each option is accompanied by full investment case, risk profile, and execution requirements.

---

## Strategic Option Schema

```yaml
strategic_option:
  option_id: OPT-{YYYY}-{seq}
  title: string                              # 80-char max
  option_class: INVEST | DEFEND | EXPAND | ACQUIRE | PARTNER | DIVEST | ACCELERATE | PAUSE | EXIT
  
  # Sources
  triggered_by: SCP-* | RAD-* | UIU-* | planning-cycle | manual
  supporting_scenarios: [SCP-*]
  
  # Investment Case
  hypothesis: string                         # "We believe [X] because [Y], resulting in [Z]"
  target_outcome: string                     # what success looks like in 12/24/36 months
  
  financial_model:
    investment_required: {min: n, max: n, unit: USD_K}
    time_to_first_value: weeks
    time_to_break_even: months | never
    expected_revenue_impact: {year_1: n, year_2: n, year_3: n, unit: USD_K}
    confidence: 0.00–1.00                    # financial model confidence
    
  # Risk Profile
  risk_dimensions:
    execution_risk: LOW | MEDIUM | HIGH | VERY_HIGH
    market_risk: LOW | MEDIUM | HIGH | VERY_HIGH
    technology_risk: LOW | MEDIUM | HIGH | VERY_HIGH
    competitive_risk: LOW | MEDIUM | HIGH | VERY_HIGH
    regulatory_risk: LOW | MEDIUM | HIGH | VERY_HIGH
    
  overall_risk: LOW | MEDIUM | HIGH | VERY_HIGH
  key_risks: [string]                        # top 3 risk factors with mitigation
  
  # Strategic Fit
  okr_alignment: [OKR-*]                     # OKRs this option advances
  strategic_priority_score: 0.00–1.00        # composite fit vs. company strategy
  
  # Execution Requirements
  required_capabilities: [string]
  capability_gaps: [string]                  # gaps from agent-capabilities/
  required_headcount: number
  required_integrations: [string]
  estimated_timeline_months: number
  
  # Decision
  recommendation: PURSUE | PURSUE_CONDITIONAL | DEFER | REJECT
  recommendation_rationale: string
  conditions: [string]                       # conditions for PURSUE_CONDITIONAL
  decision_deadline: ISO8601 | null          # when window closes
  
  # Status
  status: DRAFT | UNDER_REVIEW | APPROVED | REJECTED | DEFERRED | EXECUTING | CLOSED
  authorization_tier: T3 | T4 | T5
  created_at: ISO8601
  decided_at: ISO8601 | null
  decided_by: agent_id | null
```

---

## Option Generation Protocol

### Trigger Conditions
Options are generated automatically when:
- P0/P1 radar item exists without an active option or scenario
- Scenario analysis completes with recommendation ≠ MAINTAIN_STATUS_QUO
- War game reveals pre-emptive move opportunity
- Planning cycle activates (quarterly)
- Executive explicitly requests options for a domain

### Generation Process

```
Step 1: Context Loading
  - Load current OKR set from strategic-alignment/okr-intelligence-engine.md
  - Load active radar items (P0–P2) from opportunity-threat-radar.md
  - Load capability map from agent-capabilities/agent-capability-model.md
  - Load financial constraints from data-intelligence/predictive-analytics-engine.md

Step 2: Option Space Exploration
  Apply option_class to each domain combination:
  - For each P0/P1 opportunity: generate INVEST, EXPAND, PARTNER options
  - For each P0/P1 threat: generate DEFEND, ACCELERATE, DIVEST options
  - Cross-options: where single move addresses multiple radar items

Step 3: Option Feasibility Pre-Screen
  Filter options where:
  - required_capabilities gap is unbridgeable in time_horizon
  - regulatory_risk = VERY_HIGH with no identified mitigation
  - financial_model confidence < 0.30

Step 4: Option Scoring
  priority_score = (strategic_fit × 0.30) + (financial_return × 0.25) + 
                   (urgency × 0.25) + (feasibility × 0.20)

Step 5: Option Set Curation
  Surface top 5 options per planning cycle (ranked by priority_score)
  Ensure option set includes at least:
  - 1 DEFENSIVE option
  - 1 INVEST or EXPAND option  
  - 1 PARTNER or ACQUIRE option
  - 1 low-risk / high-confidence option (hedge)
```

---

## Real Options Framework

Long-horizon decisions are modeled as real options (not just NPV):

| Option Right | Value Driver | When to Exercise |
|-------------|-------------|-----------------|
| Call Option | Right to invest if market proves out | Leading indicators turn positive |
| Put Option | Right to exit/divest if market deteriorates | Trailing indicators breach threshold |
| Switching Option | Flexibility to pivot between approaches | Environment changes |
| Growth Option | Platform investment that enables future bets | Capability building |

Expensive now but preserves future flexibility options are flagged as OPTION_CREATING_INVESTMENT in the schema.

---

## Cross-Option Dependencies

When multiple options are under consideration:
1. Check for resource conflicts (headcount, budget, platform capacity)
2. Check for strategic conflicts (contradictory positioning)
3. Check for synergies (options that compound when executed together)
4. Generate portfolio view for executive-decision-engine.md

---

## Governance

**Authorization:**
- Option generation: T3 (auto)
- Option recommendation PURSUE: T3 review
- Option approval: T4 for investments > $500K; T5 for > $5M
- Option rejection (irrevocable): T4 required
**Audit:** `memory/strategic-intelligence/options-log.jsonl` (append-only)
