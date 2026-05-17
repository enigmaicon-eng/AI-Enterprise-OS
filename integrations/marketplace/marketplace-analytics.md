# Marketplace Analytics

## Role
Tracks usage, quality outcomes, adoption trends, and developer engagement across the OS marketplace. Surfaces insights for item authors, marketplace governance, and the OS recommendation engine.

## Usage Tracking

### Per-Item Metrics
```yaml
item_usage_metrics:
  item_id: string
  
  adoption:
    total_installs: number
    active_installations: number    # currently installed
    unique_teams_using: number
    first_used: ISO8601
    last_used: ISO8601
  
  quality_outcomes:
    total_invocations: number
    quality_gate_pass_rate: number
    avg_output_quality_score: number
    error_rate: number
    avg_execution_time_ms: number
  
  user_signals:
    rating_avg: number
    rating_count: number
    positive_reviews_count: number
    negative_reviews_count: number
    reported_issues_open: number
  
  trend_30d:
    installs_delta: number
    invocations_delta: number
    quality_delta: number
```

### Platform Metrics
```yaml
platform_metrics:
  total_marketplace_invocations_30d: number
  marketplace_quality_gate_pass_rate: number    # vs. non-marketplace items
  avg_time_to_first_invocation_min: number      # install → first use
  reuse_rate: number    # workflows using marketplace items vs. custom
  top_10_items_by_usage: [item_id]
  fastest_growing_items: [item_id]
  declining_items: [item_id]    # usage dropping > 30% month-over-month
```

## Recommendation Engine

### Recommendation Signals
```
COLLABORATIVE:  teams similar to yours also use {item_id}
CONTEXTUAL:     you're running workflow type X; teams who do X also use Y
GAP_FILLING:    you have a recurring task type with no marketplace item → suggest custom or request
QUALITY_BASED:  OFFICIAL items outperforming custom implementations in quality
```

### Recommendation Delivery
```
WORKFLOW_SUGGESTIONS: when a new workflow is submitted, suggest relevant marketplace items
SPRINT_SUGGESTIONS:   at sprint planning, suggest items relevant to sprint goals
ONBOARDING:           new team onboarding → recommended starter marketplace items
SEARCH_RESULTS:       marketplace search → ranked by relevance + quality + usage
```

## Author Analytics

Authors of VERIFIED/OFFICIAL items receive:
```
WEEKLY DIGEST:
  - installation count this week
  - quality gate pass rate this week
  - new ratings and reviews
  - any reported issues

MONTHLY REPORT:
  - adoption trend (MoM growth)
  - quality score trend
  - top use cases reported by users
  - feature requests from users
  - comparison to similar items (anonymized)
```

## Marketplace Health Dashboard
```
╔═══════════════════════════════════════════════════════╗
║  MARKETPLACE ANALYTICS DASHBOARD                       ║
║  Updated: {timestamp}                                   ║
╠═══════════════════════════════════════════════════════╣
║  CATALOG      ADOPTION          QUALITY                 ║
║  Total: {N}   Installs/wk: {N}  Gate Pass: {N}%        ║
║  Official: {N} Active teams: {N} Avg Score: {N}        ║
║  Verified: {N} Reuse rate: {N}% Avg Rating: {N}        ║
╠═══════════════════════════════════════════════════════╣
║  TOP ITEMS (30d)                                        ║
║  1. {item_id}: {N} invocations | {rating} ★             ║
║  2. {item_id}: {N} invocations | {rating} ★             ║
╚═══════════════════════════════════════════════════════╝
```

## Persistence
`memory/workflow-marketplace/usage-metrics.yaml`
`memory/workflow-marketplace/recommendation-state.yaml`
`memory/workflow-marketplace/analytics-history.jsonl`
