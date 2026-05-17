# Business Value Attribution System
**ID:** FI-BVA-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Analytics Org + PM Org | **Updated:** 2026-05-16

---

## Purpose

Attributes measurable business value to specific product features, workflows, agent capabilities, and engineering investments. Without attribution, resource allocation is based on intuition rather than evidence. This system closes the loop between investment decisions and business outcomes — enabling data-driven portfolio strategy and demonstrating ROI on AI OS investments.

---

## Value Taxonomy

Business value is categorized across five dimensions:

```yaml
value_dimensions:
  revenue_impact:
    - ARR_expansion: upsells, cross-sells attributable to feature/workflow
    - ARR_retention: churn prevented (attributable to specific intervention)
    - ARR_conversion: trial-to-paid attributed to product capability
    - pricing_premium: price increase enabled by differentiated capability
    
  cost_reduction:
    - labor_hours_saved: human hours eliminated by automation (× hourly rate)
    - support_deflection: support tickets deflected × avg_ticket_cost
    - error_reduction: errors prevented × avg_error_remediation_cost
    - infrastructure_efficiency: compute/API cost reduction
    
  speed_value:
    - time_to_market: weeks accelerated × revenue_per_week_of_delay
    - decision_latency_reduction: faster decisions → faster execution
    - cycle_time_reduction: workflow duration improvements
    
  risk_reduction:
    - compliance_violations_prevented: × avg_penalty_cost
    - security_incidents_prevented: × avg_incident_cost
    - constitutional_violations_blocked: × estimated_reputational_cost
    
  strategic_value:
    - market_differentiation: qualitative; scored 0–10 by PM + exec
    - capability_building: reusable capability value (amortized)
    - optionality: creates future strategic options (real options value)
```

---

## Attribution Model

### Feature-Level Attribution

```
For each product feature:
  1. Define success metric(s) at launch (required for attribution)
  2. Identify control group (users not exposed to feature, or pre-launch cohort)
  3. Measure metric delta between treatment and control over 90 days
  4. Apply attribution discount for confounding factors (regression adjustment)
  5. Express as attributed_value_usd = delta × customer_value_per_unit

Attribution methods by feature type:
  DIRECT: Feature directly produces measurable output (e.g., support deflection)
    → Use direct measurement: tickets_deflected × ticket_cost
    
  MEDIATED: Feature improves a leading indicator that drives business outcome
    → Use regression: feature_adoption → NPS → ARR_expansion
    
  PORTFOLIO: Feature contributes to a capability bundle
    → Shapley value attribution across bundle members
    
  STRATEGIC: Feature primarily creates optionality or differentiation
    → Qualitative scoring + real options model
```

### Workflow-Level Attribution

```
For each AI OS workflow (WF-001 through WF-023):
  Monthly:
    1. Count workflow executions
    2. For each execution type, apply unit value:
       WF-001 (product spec): estimated time saved × PM hourly rate
       WF-005 (release): cycle time reduction value
       WF-010 (governance): compliance risk reduction value
       ... (all 23 workflows valued)
    3. Sum: total_workflow_value_usd per month
    4. Compare vs. infrastructure cost: ROI calculation
```

---

## Attribution Registry

```yaml
attribution_record:
  attribution_id: ATTR-{NNN}
  subject_type: FEATURE | WORKFLOW | AGENT | INITIATIVE
  subject_id: string
  
  measurement_period:
    start: ISO8601
    end: ISO8601
    
  method: DIRECT | MEDIATED | PORTFOLIO | STRATEGIC
  
  value_breakdown:
    revenue_impact_usd: number
    cost_reduction_usd: number
    speed_value_usd: number
    risk_reduction_usd: number
    strategic_value_score: 0–10
    
  total_attributed_value_usd: number
  confidence: LOW | MEDIUM | HIGH
  confidence_rationale: string
  
  investment_cost_usd: number           # cost to build/operate
  roi: number                           # (value - cost) / cost
  payback_period_months: number
  
  methodology_notes: string
  reviewed_by: string                   # Analytics Org lead
  approved_by: string                   # PM Org lead
```

---

## Value Dashboard

```
╔══════════════════════════════════════════════════════════════╗
║            BUSINESS VALUE ATTRIBUTION — MONTHLY              ║
╠══════════════════════════════════════════════════════════════╣
║ TOTAL ATTRIBUTED VALUE (MTD):         $2,340,000             ║
║   Revenue Impact:                     $1,100,000  (47%)      ║
║   Cost Reduction:                       $820,000  (35%)      ║
║   Speed Value:                          $280,000  (12%)      ║
║   Risk Reduction:                       $140,000   (6%)      ║
╠══════════════════════════════════════════════════════════════╣
║ TOP VALUE DRIVERS                                            ║
║  #1 WF-010 Governance (compliance)     $430K/mo  ROI: 8.2×  ║
║  #2 Churn Intervention System          $380K/mo  ROI: 6.1×  ║
║  #3 WF-005 Release Automation          $290K/mo  ROI: 4.8×  ║
║  #4 Support Deflection (AI)            $210K/mo  ROI: 3.9×  ║
╠══════════════════════════════════════════════════════════════╣
║ ZOMBIE INITIATIVES (ROI < 0.5×)                              ║
║  Feature X: $12K value / $48K cost    ROI: 0.25×  → Review  ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Governance

**Attribution records:** `memory/financial-intelligence/attribution-registry.jsonl`
**Methodology changes:** T3 Analytics + PM approval
**ROI reporting:** Monthly to T4; quarterly to board package
**Zombie escalation:** Any initiative with ROI < 0.5× for 2 consecutive months → PM portfolio review
**Attribution disputes:** PM Org can challenge; Analytics Org arbitrates with methodology documentation
