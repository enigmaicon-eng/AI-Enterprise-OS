# Value-Weighted Cost Optimizer
**ID:** FI-VCO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Analytics Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Continuously identifies and prioritizes cost reduction opportunities that preserve or improve value delivery. Traditional cost-cutting ignores value — it cuts equally across high-ROI and low-ROI activities. This optimizer uses the ROI framework and TCO model to identify precisely where cost reduction has the highest net benefit.

---

## Optimization Opportunity Taxonomy

```yaml
opportunity_classes:
  MODEL_DOWNGRADE:
    description: Route lower-complexity tasks to a cheaper model tier
    value_risk: LOW (if task complexity correctly classified)
    cost_saving_potential: 60–80% per affected invocation
    
  PROMPT_COMPRESSION:
    description: Reduce input token count via better context management
    value_risk: VERY_LOW (CWP protocol already mandates this)
    cost_saving_potential: 20–40% per invocation
    
  CACHING:
    description: Cache frequent knowledge retrievals or agent outputs
    value_risk: LOW (with proper TTL)
    cost_saving_potential: 30–60% for cacheable patterns
    
  BATCH_PROCESSING:
    description: Batch sequential independent agent calls
    value_risk: LOW (latency tradeoff, not quality)
    cost_saving_potential: 15–30% via throughput efficiency
    
  WORKFLOW_ELIMINATION:
    description: Remove low-ROI workflow steps or entire workflows
    value_risk: MEDIUM (requires ROI validation)
    cost_saving_potential: 100% of eliminated step cost
    
  AGENT_CONSOLIDATION:
    description: Merge two low-utilization agents into one
    value_risk: MEDIUM (capability regression risk)
    cost_saving_potential: 40–60% of one agent's operating cost
    
  CONNECTOR_CONSOLIDATION:
    description: Replace multiple similar connectors with one
    value_risk: LOW (if coverage equivalent)
    cost_saving_potential: licensing cost of eliminated connectors
    
  COLD_STORAGE_MIGRATION:
    description: Move archived data to cheaper cold storage tier
    value_risk: VERY_LOW (slower retrieval, but infrequently needed)
    cost_saving_potential: 70–90% of storage cost for migrated data
```

---

## Opportunity Identification Process

```
Weekly sweep (Thursday 05:00 UTC):

1. MODEL_DOWNGRADE scan:
   - Identify agent invocations where task_complexity_score < 0.40
   - task_complexity_score = f(reasoning_depth, domain_expertise_required, output_precision_required)
   - If > 30% of agent's invocations are low_complexity: flag for model downgrade review
   
2. PROMPT_COMPRESSION scan:
   - Identify agents with avg_input_tokens > 20,000
   - Compare vs. CWP budget utilization (context-window-protocol.md)
   - If utilization < 0.50 but token count high: compression opportunity
   
3. CACHING scan:
   - Identify top 20 most-frequent knowledge queries (same KU-* retrieved repeatedly)
   - Identify agent outputs that are identical for same inputs (pure function pattern)
   - Estimate cache_hit_rate_potential × cost_per_cache_hit_saved
   
4. WORKFLOW_ELIMINATION scan:
   - Identify workflow steps with ROI < 0.5× (from roi-records.jsonl)
   - Identify workflows with execution rate < 1/week (high fixed cost, low volume)
   
5. AGENT_CONSOLIDATION scan:
   - Identify agents with < 10 invocations/week AND capability overlap > 70%
   - Rank consolidation candidates by cost_savings / capability_risk
```

---

## Opportunity Evaluation

Each identified opportunity is scored before recommendation:

```yaml
optimization_opportunity:
  opportunity_id: OPT-COST-{NNN}
  opportunity_class: string
  
  target:
    agent_ids: [string]
    workflow_ids: [string]
    cost_center: string
    
  financial_case:
    current_monthly_cost_usd: number
    projected_monthly_cost_usd: number
    monthly_savings_usd: number
    implementation_cost_usd: number
    payback_period_days: number
    
  value_risk_assessment:
    risk_level: VERY_LOW | LOW | MEDIUM | HIGH
    risk_basis: string
    mitigations: [string]
    
  net_value_change_usd: number         # savings - value_risk_cost
  recommendation: IMPLEMENT | PILOT | INVESTIGATE | DECLINE
  recommended_by: agent_id
  approved_by: string | null
```

---

## Implementation Governance

| Savings | Value Risk | Approval Required |
|---------|-----------|-------------------|
| Any | VERY_LOW / LOW | T2 automated (no human approval needed) |
| < $1,000/month | MEDIUM | T3 owner approval |
| $1,000–$10,000/month | MEDIUM | T3 Architecture + Analytics approval |
| > $10,000/month | Any | T4 approval |
| Any | HIGH | T4 approval + pilot required |

All optimizations require:
1. 2-week monitoring period post-implementation
2. Rollback plan defined before implementation
3. Quality metrics confirmed stable post-optimization

---

## Realized Savings Tracking

```yaml
realized_savings:
  opportunity_id: string
  implementation_date: ISO8601
  
  pre_implementation_baseline:
    monthly_cost_usd: number
    quality_metrics: {string: number}
    
  post_implementation_30d:
    monthly_cost_usd: number
    quality_metrics: {string: number}
    savings_realized_usd: number
    quality_delta_pct: number           # target: within ±5% of baseline
    
  status: SUCCESSFUL | PARTIAL | ROLLED_BACK
  notes: string
```

---

## Governance

**Opportunity registry:** `memory/financial-intelligence/cost-optimization-registry.jsonl`
**Implemented savings report:** Monthly to T3 + T4
**Annual cost reduction target:** 10% year-over-year (holding value constant)
**Quality floor:** No optimization approved if quality metrics decline > 5%
**Rollback authority:** T2 can rollback any automated optimization; T3 for human-approved ones
