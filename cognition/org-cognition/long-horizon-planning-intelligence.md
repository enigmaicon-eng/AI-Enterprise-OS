# Long-Horizon Planning Intelligence
**ID:** ORG-COG-003 | **Tier:** T4 | **Class:** CRITICAL
**Owner:** Executive Org + Strategic Intelligence | **Updated:** 2026-05-16

---

## Purpose

Provides structured intelligence for planning horizons beyond 12 months — the range where quarterly OKRs and annual budgets provide insufficient guidance. Long-horizon planning requires integrating technological trajectories, regulatory evolution, competitive dynamics, organizational capability growth, and market secular trends over 2–10 year timeframes. This system makes long-horizon reasoning rigorous rather than speculative.

---

## Planning Horizon Model

```yaml
planning_horizons:
  TACTICAL (0–12 months):
    owner: OKR intelligence engine (SI-ALIGN-001)
    update_frequency: quarterly
    primary_uncertainty: execution risk
    tools: OKR tracking, sprint planning, workflow management
    
  STRATEGIC (1–3 years):
    owner: Long-horizon planning intelligence (this system)
    update_frequency: annually (quarterly refresh)
    primary_uncertainty: competitive + regulatory dynamics
    tools: scenario planning, compound intelligence, market twin
    
  VISIONARY (3–7 years):
    owner: Long-horizon planning intelligence
    update_frequency: annually
    primary_uncertainty: technological discontinuities + market evolution
    tools: technology trajectory models, analogical reasoning, war gaming
    
  DIRECTIONAL (7–10 years):
    owner: Executive Org + Board
    update_frequency: annually (board-level)
    primary_uncertainty: societal, technological, regulatory paradigm shifts
    tools: next-decade-roadmap.md, bounded superintelligence architecture
```

---

## Long-Horizon Analysis Components

### Technology Trajectory Mapping

```yaml
technology_trajectory:
  technology_id: TECH-{NNN}
  name: string
  current_maturity: RESEARCH | EMERGING | GROWING | MAINSTREAM | DECLINING
  
  trajectory_forecast:
    year_to_mainstream: number | null    # when does this become table stakes?
    year_of_peak_impact: number | null
    disruption_probability: 0.00–1.00   # probability of disrupting current paradigm
    
  our_position:
    current_adoption: NONE | EARLY | GROWING | MATURE
    strategic_importance: LOW | MEDIUM | HIGH | CRITICAL
    capability_gap: string | null        # what we lack if critical and not adopted
    
  scenarios:
    if_adopted_early: string             # competitive advantage
    if_adopted_late: string              # competitive disadvantage
    if_not_adopted: string               # risk of irrelevance
    
  evidence_base: [string]               # research, patents, vendor announcements
  confidence: LOW | MEDIUM | HIGH
```

### Organizational Capability Projection

```yaml
capability_projection:
  # Where will our organizational capabilities be in N years if current trajectory holds?
  horizon_years: number
  
  capability_dimensions:
    ai_system_sophistication:
      current_level: 3                   # autonomy level framework
      projected_level: number
      trajectory: LINEAR | ACCELERATING | DECELERATING
      
    knowledge_density:                   # KUs per domain; coverage breadth
      current: number
      projected_growth_rate: number
      
    agent_count:
      current: 144
      projected: number
      
    governance_maturity:
      current_score: 0.00–1.00
      projected: number
      
    trust_score_avg:
      current: 0.00–1.00
      projected: number
      
  gap_analysis:
    capabilities_needed_by_horizon: [string]
    current_trajectory_provides: [string]
    gaps: [string]
    gap_closure_investments_needed: [string]
```

### Regulatory Horizon Scanning

```yaml
regulatory_trajectory:
  jurisdiction: string
  current_regime: string
  
  horizon_forecast:
    - years_out: number
      expected_regulatory_state: string
      probability: 0.00–1.00
      key_uncertainty: string
      
  impact_on_us:
    operations_impact: LOW | MEDIUM | HIGH
    compliance_investment_required_usd: number | null
    capability_changes_required: [string]
    strategic_opportunity_from_compliance: string | null
    
  monitoring_signals: [string]          # what to watch that predicts regulatory trajectory
```

---

## Long-Horizon Planning Cycle

```
Annual planning cycle (Q4):

Month 1 (October): Signal Collection
  - Update all technology trajectory models
  - Update regulatory horizon scans for all major jurisdictions
  - Update competitive long-horizon analysis (from war-gaming-coordinator.md)
  - Update organizational capability projections
  - Pull compound intelligence synthesis for strategic horizon signals
  
Month 2 (November): Scenario Development
  - Generate 3–5 strategic scenarios spanning 3-year horizon
  - Run compound perturbation engine for each scenario
  - Identify which scenarios represent greatest opportunity vs. risk
  - Develop preliminary strategic options for each scenario
  
Month 3 (December): Planning Synthesis
  - Cross-scenario analysis: which investments pay off across all scenarios?
  - Identify "no regret" moves (good under any scenario)
  - Identify "bet" moves (good under some scenarios; bad under others)
  - Produce: 3-year strategic plan + annual milestone targets
  - Route to board intelligence system for annual board package
  
Quarterly refresh (January, April, July):
  - Update key assumptions; flag if trajectory has deviated from plan
  - Assess: are we on track for milestone targets?
  - Update compound intelligence with new trajectory data
```

---

## Assumption Registry

Long-horizon plans depend on explicit assumptions. This engine maintains them:

```yaml
strategic_assumption:
  assumption_id: ASMP-{NNN}
  assumption: string
  domain: string
  
  supporting_evidence: [string]
  contradicting_evidence: [string]
  
  confidence: LOW | MEDIUM | HIGH
  invalidation_signal: string           # what observation would invalidate this assumption
  
  monitoring_owner: string
  review_frequency: MONTHLY | QUARTERLY | ANNUALLY
  last_reviewed: ISO8601
  
  status: ACTIVE | UNDER_REVIEW | INVALIDATED | CONFIRMED
```

**Assumption invalidation** is a key trigger: when a monitored signal indicates an assumption is wrong, the plan must be re-evaluated immediately.

---

## Governance

**Annual plan:** T5 approval required; board notification
**Quarterly refresh:** T4 approval
**Technology trajectory models:** Updated by Strategic Intelligence Org; T3 approval for new entries
**Assumption invalidation response:** T4 alert; T3 re-evaluation within 14 days
**Planning output:** `memory/org-cognition/long-horizon-plans/` (versioned; permanent retention)
**Constitutional constraint:** Long-horizon planning cannot propose reducing human authority or constitutional constraints over time — these are permanent regardless of capability level
