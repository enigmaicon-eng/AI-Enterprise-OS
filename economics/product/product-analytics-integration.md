# Product Analytics Integration
**ID:** PI-PAI-001 | **Tier:** T2 | **Class:** STANDARD
**Owner:** Analytics Org | **Updated:** 2026-05-16

---

## Purpose

Synthesizes all product intelligence sources — telemetry, customer feedback, research, feature flags, and attribution — into actionable product analytics for PM Org decision-making. The integration layer ensures that each source's signals are combined coherently rather than presented as disconnected dashboards.

---

## Analytics Architecture

```
Signal Sources → Integration Layer → Decision Outputs

Product Telemetry (CI-TEL-001)    ┐
Customer Feedback (CI-FBK-001)    ├→ Analytics    → Feature Scorecard
Churn Predictions (CI-CHRN-001)   │   Integration → Segment Health Report
User Research (CI-URX-001)        │   Engine      → Priority Recommendations
Feature Flags (PI-FFS-001)        │               → PM Weekly Digest
Value Attribution (FI-BVA-001)    ┘               → Board-Level Metrics
```

---

## Feature Scorecard

The primary output: a unified score for every shipped feature.

```yaml
feature_scorecard:
  feature_id: string
  feature_name: string
  
  adoption:
    adoption_rate_overall: 0.00–1.00    # % of eligible users who used it
    adoption_by_segment: {segment_id: rate}
    retention_rate_30d: 0.00–1.00       # used it again after first use
    trend: GROWING | STABLE | DECLINING
    
  quality:
    error_rate: 0.00–1.00
    completion_rate: 0.00–1.00
    avg_time_to_complete_minutes: number
    support_tickets_30d: number
    
  satisfaction:
    nps_correlation: number             # correlation between feature use and NPS
    feedback_sentiment_avg: -1.00–1.00
    qualitative_themes: [string]        # top themes from feedback pipeline
    
  value:
    attributed_value_monthly_usd: number
    roi: number
    payback_achieved: boolean
    
  jtbd_coverage:
    jtbd_ids_served: [string]
    jobs_satisfaction_avg: 0.00–1.00
    
  composite_score: 0.00–1.00
  health_band: THRIVING | HEALTHY | DEGRADED | IMPAIRED | CRITICAL
  
  recommended_action: SCALE | MAINTAIN | IMPROVE | INVESTIGATE | SUNSET
  action_rationale: string
```

---

## PM Weekly Digest

Auto-generated every Monday 09:00:

```
PRODUCT ANALYTICS DIGEST — Week of {date}

SEGMENT HEALTH SUMMARY
  Enterprise: HEALTHY (↑ from WATCH last week)
  Mid-Market: WATCH (churn probability trending up — 3 accounts AT_RISK)
  SMB: HEALTHY (stable)
  Trial: WATCH (conversion rate -8% WoW)

FEATURE PERFORMANCE
  New features launched this sprint: [feature_list]
  Top performing (by adoption): feature_X (62% adoption, 0.3% error rate)
  Needs attention: feature_Y (12% adoption despite 30 days live — investigate)
  
PRODUCT SIGNALS
  Top pain points (by frequency):
    1. "Export is too slow" — 47 mentions this week (↑ from 31 last week)
    2. "Can't find X in navigation" — 23 mentions
    3. [...]
  
  Emerging needs (new in last 2 weeks):
    - "Integration with Notion" — 8 mentions, 3 ENTERPRISE customers
    
CHURN WATCH
  Accounts moved to AT_RISK this week: 3 (combined ARR: $420K)
  Accounts moved to CRITICAL: 1 ($185K ARR) — CS alerted
  Interventions in progress: 7 accounts

RECOMMENDATIONS
  1. Prioritize feature_Y investigation — low adoption after 30 days is unusual
  2. Export performance fix: customer volume + segment priority = P1 candidate
  3. Notion integration: evaluate as Q3 opportunity (ENTERPRISE segment signal)
```

---

## North Star Metric

The OS maintains a single North Star Metric that all product analytics roll up to:

```yaml
north_star_metric:
  metric_name: "Weekly Active Workflows per Customer"
  
  rationale: |
    Measures whether customers are getting continuous value from the OS.
    A customer using AI workflows regularly is building dependency and value —
    a customer who churned from workflows will churn from the product.
    
  current_value: number
  target_value: number
  trend_30d: IMPROVING | STABLE | DECLINING
  
  leading_indicators: [string]         # metrics that predict NSM movement
  lagging_indicators: [string]         # metrics NSM predicts
```

---

## Governance

**Scorecard generation:** Automated weekly; PM Org can trigger on-demand
**North Star changes:** T4 approval required (changing what the org optimizes for is a major decision)
**Analytics access:** PM Org (read all), UX Org (read UX-relevant), CS Org (read own segments)
**Data freshness:** Behavioral data: daily; satisfaction data: monthly; research: as conducted
**Reports:** `memory/product-intelligence/analytics-reports/` (weekly archives)
