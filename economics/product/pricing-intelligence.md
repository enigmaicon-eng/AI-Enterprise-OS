# Pricing Intelligence System
**ID:** PI-PRICE-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** PM Org + Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Provides data-driven pricing intelligence: value metric identification, willingness-to-pay modeling, competitive pricing benchmarking, and price change impact simulation. Prevents pricing decisions made on gut feel that leave revenue on the table or create churn.

---

## Value Metric Framework

The foundation of good pricing is identifying the right value metric — what customers pay for should scale with the value they receive:

```yaml
value_metric_candidates:
  current:
    metric: string                       # e.g., "agent_invocations_per_month"
    correlation_with_value: number       # Pearson r with business value received (target: > 0.70)
    predictability: number               # customer ability to predict cost (1 = fully predictable)
    
  alternatives_evaluated:
    - metric: string
      correlation_with_value: number
      predictability: number
      implementation_complexity: LOW | MEDIUM | HIGH
      customer_reception: POSITIVE | NEUTRAL | NEGATIVE
      recommendation: string
      
  recommendation:
    optimal_metric: string
    rationale: string
    migration_complexity: string
```

---

## Willingness-to-Pay Model

```
Data sources:
  1. Van Westendorp price sensitivity survey (quarterly, N ≥ 50 responses per segment)
  2. Conjoint analysis (annually, detailed feature/price tradeoffs)
  3. Win/loss data (CRM: price mentioned as factor in N% of losses)
  4. Expansion patterns (did customers expand when given the option?)
  5. Competitor pricing (from competitive intelligence hub)

Per-segment WTP model:
  - Price Sensitivity Meter: 4 price points (too cheap, cheap, expensive, too expensive)
  - Acceptable price range: [cheap, expensive] — optimal price within this range
  - Maximum acceptable price: point where > 20% would not buy
  - Optimal price point: intersection of "not cheap enough" and "not expensive enough"

Output:
  segment_wtp:
    segment_id: string
    optimal_price_per_unit: number
    acceptable_range: {min: number, max: number}
    price_elasticity: number             # % demand change per 1% price increase
    confidence: LOW | MEDIUM | HIGH
    last_updated: ISO8601
```

---

## Competitive Pricing Benchmarking

```yaml
competitor_pricing_record:
  competitor_id: string
  pricing_model: PER_SEAT | USAGE_BASED | FLAT | HYBRID
  
  tiers:
    - tier_name: string
      price_per_unit: number
      unit: string
      included_features: [string]
      
  value_metric: string
  
  relative_position:
    vs_us_price_delta_pct: number       # positive = they're more expensive
    vs_us_value_delta: string           # LESS_VALUE | COMPARABLE | MORE_VALUE
    
  intelligence_source: string
  confidence: LOW | MEDIUM | HIGH
  captured_at: ISO8601
  next_refresh: ISO8601
```

---

## Price Change Impact Simulation

Before any pricing change, simulation is required:

```
simulate_price_change(new_price, segment_ids) → impact_report:

  For each affected segment:
    1. Apply price_elasticity model: demand_change = elasticity × price_change_pct
    2. Compute churn_uplift: price_sensitive_customers × price_change_pct × sensitivity_factor
    3. Compute expansion_impact: customers below new price floor who will churn
    4. Compute revenue_delta: (new_price × retained_customers) - (old_price × old_customers)
    
  Output:
    - revenue_delta_annual_usd: point estimate
    - confidence_interval: {p10, p50, p90}
    - churn_risk_customers: count + ARR at risk
    - net_new_revenue: revenue_delta - churn_revenue_loss
    - recommendation: PROCEED | PILOT | DO_NOT_PROCEED
    - suggested_mitigation: grandfathering, transition period, etc.
```

---

## Pricing Decisions

All pricing changes require:

1. WTP model showing new price within acceptable range for target segments
2. Competitive benchmark showing positioning is defensible
3. Impact simulation with p10 scenario still positive
4. T4 approval (pricing changes are irreversible in customer perception)
5. Communication plan: customer notice ≥ 30 days before change
6. Grandfathering policy: existing customers protected for ≥ 90 days

---

## Governance

**WTP surveys:** UX Org conducts; Analytics Org analyzes; PM Org uses
**Pricing decisions:** T4 approval required for any price change
**Competitive pricing:** Updated monthly via competitive intelligence hub
**Records:** `memory/product-intelligence/pricing-models.yaml`
**Simulation outputs:** `memory/product-intelligence/pricing-simulations.jsonl`
