# Scenario Library
**ID:** SI-SCEN-005 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Strategy Org | **Updated:** 2026-05-16

---

## Purpose

Persistent library of curated strategic scenarios. Stores completed and archived scenarios for reuse, pattern learning, and calibration. Provides pre-built scenario templates for common strategic situations. Enables rapid scenario instantiation rather than starting from scratch each time.

---

## Library Contents

### Pre-Built Scenario Templates

Twelve canonical scenario templates covering the most common strategic situations an enterprise faces. Templates are instantiated with current data rather than run as-is:

| Template ID | Scenario | Applicable When |
|-------------|---------|----------------|
| TPL-001 | Market entry: new geographic expansion | Geographic growth opportunity detected |
| TPL-002 | Competitive response: head-on attack in core market | DIRECT competitor P0 threat |
| TPL-003 | Platform bet: rebuilding on new technology paradigm | Technology shift signal HIGH magnitude |
| TPL-004 | Build vs. buy: capability acquisition decision | Capability gap REGULATORY or STRATEGIC |
| TPL-005 | Regulatory inflection: compliance as competitive moat | Regulatory change FAVORABLE |
| TPL-006 | Pricing strategy: premium vs. volume trade-off | Pricing signal or competitive pressure |
| TPL-007 | M&A defense: hostile or opportunistic acquisition | POTENTIAL_ENTRANT threat signal |
| TPL-008 | Segment exit: disciplined retreat from declining market | Market maturity = DECLINING |
| TPL-009 | Partnership leverage: ecosystem amplification | PARTNER_ECOSYSTEM signal |
| TPL-010 | Talent emergency: critical capability loss risk | people-intelligence concentration risk |
| TPL-011 | Economic headwind: operating under resource constraint | MACRO_ECONOMIC negative signal |
| TPL-012 | AI regulatory reckoning: EU AI Act HIGH_RISK compliance | WF-006 trigger or AI governance signal |

### Template Schema

```yaml
scenario_template:
  template_id: TPL-{seq}
  title: string
  applicable_when: string            # condition description
  
  # Pre-structured axes
  default_uncertainty_axes:
    - axis_id: AX-1
      description: string
      typical_poles: [pessimistic_label, optimistic_label]
      
  # Pre-structured worlds
  default_worlds:
    - world_name: string
      description: string
      axis_assignments: {AX-1: 0.0–1.0}
      typical_probability: 0.00–1.00   # historical base rate
      
  # Standard playbook
  standard_hedges: [string]          # actions that work across all worlds
  standard_options: [string]         # actions to unlock if optimistic world materializes
  standard_defensive_moves: [string] # actions if pessimistic world materializes
  
  # Leading indicators to monitor
  standard_leading_indicators: [string]
  
  # Historical instances
  historical_instances: [SCP-*]      # past runs of this template
  calibration_accuracy: 0.00–1.00    # how well world probabilities were calibrated historically
```

---

## Archived Scenario Index

All completed scenarios are archived with full outcome records. Indexed by:
- Domain (MARKET, COMPETITIVE, TECHNOLOGY, etc.)
- Outcome classification (CAPITALIZED, MITIGATED, MISSED, etc.)
- Time horizon
- Accuracy (predicted vs. actual probability)

**Learning extraction:** Monthly, the scenario library runs pattern extraction across all archived scenarios:
- Which uncertainty axes mattered most (predictive power)
- Which hedging actions were most universally valuable
- Which world structures best predicted actual outcomes
- Where systematic biases exist (over-optimistic vs. over-pessimistic by domain)

Learnings written to `memory/strategic-intelligence/scenario-learning.yaml` and fed back into template calibration.

---

## Quick-Access Scenario Repository

Active scenario index maintained in `memory/strategic-intelligence/active-scenarios.yaml`:
```yaml
# Fast lookup — full content in scenario-planning-engine.md records
active_scenarios:
  - scenario_id: SCP-2026-001
    title: string
    type: string
    status: ACTIVE
    priority: P0 | P1 | P2
    decision_by: ISO8601 | null
    current_leading_world: WLD-A | WLD-B | ...
    
recently_closed:  # last 10
  - scenario_id: SCP-2026-xxx
    outcome: CAPITALIZED | MITIGATED | MISSED
    accuracy: 0.00–1.00
```

---

## Governance

**Scenario retirement:** Scenarios are archived (not deleted) 6 months after closing. Permanent retention for TRANSFORMATIVE outcomes.
**Template updates:** Templates updated quarterly based on learning extraction. Changes require T3 review.
**Access control:** Active scenario content is CONFIDENTIAL; historical outcomes are accessible to T2+ for learning purposes.
