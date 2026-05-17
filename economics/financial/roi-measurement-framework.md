# ROI Measurement Framework
**ID:** FI-ROI-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Defines the standardized methodology for measuring return on investment across all Enterprise AI OS initiatives, features, and agent capabilities. Without standardized ROI methodology, different teams calculate ROI differently — making comparisons impossible and budget decisions subjective. This framework creates a single, auditable calculation method.

---

## Standard ROI Formula

```
ROI = (Total Attributed Value - Total Cost of Ownership) / Total Cost of Ownership

Where:
  Total Attributed Value = Σ(value_dimensions) from business-value-attribution.md
  Total Cost of Ownership = Σ(cost_categories) from tco-model.md
  
Measurement periods:
  - 30-day ROI (early signal, high uncertainty)
  - 90-day ROI (primary measurement point)
  - 12-month ROI (strategic assessment)
  - Lifetime ROI (for permanent capabilities)
```

---

## ROI Tiers and Actions

| ROI | Interpretation | Action |
|-----|---------------|--------|
| > 5× | Exceptional | Scale investment; prioritize roadmap |
| 2–5× | Strong | Maintain investment; continue |
| 1–2× | Adequate | Monitor; look for efficiency improvements |
| 0.5–1× | Marginal | Review; set improvement target with 90-day deadline |
| < 0.5× | Poor | Escalate to PM portfolio review; suspend if no improvement path |
| Negative | Destroying value | Halt investment; root cause analysis required |

---

## Confidence Levels

ROI estimates carry explicit confidence levels:

```yaml
roi_estimate:
  subject_id: string
  measurement_period: string
  
  roi_point_estimate: number
  
  confidence_level: LOW | MEDIUM | HIGH
  confidence_basis:
    LOW: attribution is indirect or correlational; sample size < 30
    MEDIUM: attribution is reasonably direct; sample size 30–100; control group imperfect
    HIGH: attribution is direct with clean control; sample size > 100; minimal confounders
    
  confidence_interval:
    p10: number                          # pessimistic ROI
    p50: number                          # point estimate
    p90: number                          # optimistic ROI
    
  assumptions: [string]                  # explicit list of what we assumed
  risks: [string]                        # what would make this estimate wrong
```

All ROI decisions should be made on p10 estimates (pessimistic), not point estimates.

---

## Initiative ROI Tracking

```yaml
initiative_roi_record:
  initiative_id: string
  initiative_name: string
  
  investment:
    build_cost_usd: number              # one-time development cost
    operate_cost_monthly_usd: number    # ongoing operational cost
    total_invested_to_date_usd: number
    
  value_delivered:
    by_dimension: {string: number}      # usd per value dimension
    total_attributed_value_usd: number
    measurement_period_days: number
    
  roi_snapshots:
    - at_30d: {roi, confidence}
    - at_90d: {roi, confidence}
    - at_12m: {roi, confidence}
    
  payback_period_months: number        # months until cumulative value > investment
  
  status: TRACKING | UNDER_REVIEW | SCALED | SUSPENDED | RETIRED
```

---

## Comparison and Prioritization

The ROI framework enables objective initiative comparison:

```
Priority score for roadmap allocation:
  priority = roi_p10 × confidence_weight × strategic_alignment_score

Where:
  confidence_weight: LOW=0.5, MEDIUM=0.8, HIGH=1.0
  strategic_alignment_score: 0–1.0 (from portfolio-strategy-alignment.md)

Monthly: rank all active initiatives by priority score
  → Bottom 10% by priority: PM review trigger
  → Top 10% by priority: scaling opportunity assessment
```

---

## AI-Specific ROI Considerations

AI OS investments have characteristics that require special handling:

```
Token cost volatility:
  - AI model pricing can change; ROI must be recalculated when pricing changes
  - Always test sensitivity to ±50% token cost change in ROI model

Attribution causality:
  - AI assistance is often one of many factors in an outcome
  - Use causal attribution methods; avoid overclaiming AI contribution
  - Default discount: apply 0.7× multiplier to mediated attribution claims

Capability vs. feature ROI:
  - Reusable capabilities (e.g., constitutional governor) have ROI that compounds
  - Amortize build cost across all downstream uses
  - Optionality value is real but must be scored conservatively (real options model)

Constitutional and compliance value:
  - Constitutional violation prevention: value = estimated_incident_cost × prevention_rate
  - Do not undercount compliance value — regulatory fines are large
  - Document assumptions clearly; compliance value estimates are inherently uncertain
```

---

## Governance

**ROI methodology:** This document is authoritative; deviations require T3 Analytics approval + documentation
**ROI reports:** Monthly to PM Org + T3; quarterly board summary
**Methodology audit:** Annual external review of ROI attribution methodology
**Records:** `memory/financial-intelligence/roi-records.jsonl` (append-only, all ROI snapshots)
**Disputes:** PM can challenge attribution; Analytics Org arbitrates with documented methodology
