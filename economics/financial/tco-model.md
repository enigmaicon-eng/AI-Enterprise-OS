# Total Cost of Ownership Model
**ID:** FI-TCO-001 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Analytics Org + Architecture Org | **Updated:** 2026-05-16

---

## Purpose

Provides complete, accurate, and continuously updated TCO accounting for the Enterprise AI OS. AI systems have non-obvious cost structures: API token costs scale with usage in ways that surprise stakeholders, and agent proliferation can multiply costs faster than value. This model makes all OS costs visible, attributable, and optimizable.

---

## Cost Categories

```yaml
cost_categories:
  ai_inference:
    - anthropic_api_tokens: input_tokens × $0.003/1K + output_tokens × $0.015/1K
    - embedding_tokens: for knowledge retrieval (separate rate)
    
  infrastructure:
    - compute: event bus, orchestrator, replicas, digital twins
    - storage: JSONL segments, archives, cold storage
    - network: connector API calls, webhook ingress
    
  integration:
    - connector_licensing: per-connector SaaS costs (Jira, Salesforce, etc.)
    - api_rate_costs: pay-per-call APIs
    
  human_operations:
    - governance_review_hours: T3/T4 human time × hourly rate
    - approval_queue_hours: escalation handling time
    - security_review_hours: PT, chaos engineering, compliance
    
  software:
    - tooling_licenses: dev tools, monitoring, security scanning
    - external_research: market data feeds, competitor intelligence subscriptions
```

---

## Cost Attribution Model

Every cost is attributed to a consuming subsystem:

```yaml
cost_record:
  cost_id: string
  period: YYYY-MM-DD                     # daily granularity
  
  cost_category: string
  cost_driver: string                    # e.g., agent_id, workflow_id, feature_id
  
  attributed_to:
    workflow_id: string | null
    agent_id: string | null
    org_id: string | null
    initiative_id: string | null
    
  quantity: number
  unit: string                           # e.g., "1K_tokens", "GB_stored", "hours"
  unit_cost_usd: number
  total_cost_usd: number
```

---

## Token Cost Tracking (Primary AI Cost Driver)

```
Per agent invocation, track:
  - input_tokens_used: system prompt + context + user input
  - output_tokens_used: model response
  - cost_usd = (input_tokens × $0.003/1K) + (output_tokens × $0.015/1K)
  - attribute to: workflow_id + agent_id + step_id

Daily aggregation:
  - Cost per agent (top consumers)
  - Cost per workflow (total cost per workflow type)
  - Cost per org (total AI cost per organizational unit)
  - Cost efficiency: value_attributed_usd / ai_cost_usd (target: > 10×)

Alert thresholds:
  - Any agent consuming > 2× its 30-day average cost in a day → T3 alert
  - Monthly AI inference cost exceeds budget by > 10% → T3 alert
  - Cost efficiency < 5× → PM + Analytics review
```

---

## TCO Dashboard

```yaml
tco_summary:
  period: YYYY-MM
  
  total_cost_usd: number
  
  by_category:
    ai_inference_usd: number
    infrastructure_usd: number
    integration_usd: number
    human_operations_usd: number
    software_usd: number
    
  by_workflow:
    - workflow_id: string
      cost_usd: number
      executions: number
      cost_per_execution: number
      attributed_value_usd: number
      roi: number
      
  by_agent:
    - agent_id: string
      cost_usd: number
      invocations: number
      cost_per_invocation: number
      
  efficiency_metrics:
    cost_per_dollar_value: number        # target: < $0.10 per $1 of value
    ai_cost_as_pct_revenue: number       # target: < 5%
    human_ops_leverage: number           # value / human_hours (target: > $500/hr)
```

---

## Cost Optimization Triggers

| Condition | Action |
|-----------|--------|
| Agent cost efficiency < 5× | Analytics reviews agent token usage; compression opportunities |
| Workflow cost per execution > $50 | Architecture review for model downgrade or step elimination |
| Governance review hours > 40/week | Pre-authorization pool review (expand scope) |
| Connector cost > $500/month | Evaluate usage vs. value; consider consolidation |
| Storage growth > 20% month-over-month | Segment manager review; cold storage migration |
| Human ops > 30% of total cost | Automation opportunity assessment |

---

## Budget Management

```yaml
budget_record:
  period: YYYY-MM
  
  approved_budget_usd: number
  current_spend_usd: number
  forecast_end_of_month_usd: number
  budget_utilization: 0.00–1.00
  
  by_category:
    ai_inference_budget: number
    ai_inference_actual: number
    # ... etc.
    
  variance_alerts:
    - category: string
      budget: number
      forecast: number
      variance_pct: number
      status: ON_TRACK | WATCH | OVER_BUDGET
```

Budget approved annually; T3 can approve in-period adjustments up to ±15%; T4 for larger changes.

---

## Governance

**Cost attribution:** Automated (from execution-ledger.jsonl token tracking)
**TCO report:** Monthly to T3; quarterly to T4 + board package
**Budget authority:** Annual budget → T4; in-period adjustments → T3 (±15%)
**Cost records:** `memory/financial-intelligence/cost-records.jsonl` (append-only)
**Optimization authority:** T3 can implement any optimization with neutral or positive value impact
