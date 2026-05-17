# Governance Throughput Metrics

## Purpose
Measures the operational throughput of the entire human governance system — how many reviews are processed, how efficiently, and whether governance capacity is keeping pace with organizational demand. Throughput metrics are the operational health signal for the governance function itself.

---

## Throughput Definitions

```yaml
throughput_definitions:
  items_processed:
    description: Number of review items that received a final decision (not escalated/stalled)
    unit: items per hour/day/week
    excludes: items still open, items escalated without resolution
  
  decisions_per_reviewer_day:
    description: Average decisions made per reviewer per working day
    unit: decisions / reviewer / day
    healthy_range: 5–15 (varies by complexity)
    concerning: > 20 (potential rubber-stamping) or < 3 (reviewer underutilized)
  
  first_pass_resolution_rate:
    description: % of items resolved at their initial tier without escalation
    unit: percentage
    target: >= 80%
    interpretation: low rate = routing mismatch or tier underpowered
  
  governance_debt:
    description: Accumulated backlog of unresolved items
    unit: count + estimated hours to clear at current throughput
    healthy: < 2 days to clear backlog
    concerning: > 5 days to clear
  
  review_throughput_ratio:
    description: Items processed vs items submitted in same period
    unit: ratio
    healthy: >= 1.0 (processing faster than or equal to arrival rate)
    critical: < 0.85 sustained for > 24h (backlog growing)
  
  constitutional_review_throughput:
    description: Constitutional evaluations completed per day
    separated from general throughput for visibility
```

---

## Throughput Dashboard

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  GOVERNANCE THROUGHPUT METRICS                         Period: Last 7 days  ║
╠═══════════════════════════╦══════════════════════════╦═══════════════════════╣
║  ITEMS PROCESSED          ║  DECISIONS/REVIEWER/DAY  ║  THROUGHPUT RATIO     ║
║  ────────────────────     ║  ──────────────────────  ║  ────────────────────  ║
║  Today:         47        ║  Tier 1:   12.3    ✓     ║  Today:     1.08  ✓   ║
║  This Week:    287        ║  Tier 2:   8.7     ✓     ║  7d avg:    1.02  ✓   ║
║  7d avg/day:  41.0        ║  Tier 3:   4.1     ✓     ║  30d avg:   0.97  ⚠   ║
║  vs last week:  +8%  ✓    ║  Tier 4:   2.2     ✓     ║  Trend:  improving    ║
╠═══════════════════════════╩══════════════════════════╩═══════════════════════╣
║  FIRST PASS RESOLUTION RATE              ║  GOVERNANCE DEBT                  ║
║  ────────────────────────────────────    ║  ─────────────────────────────    ║
║  Overall:         83%  ✓                 ║  Total Open Items:    104         ║
║  By Tier:                                ║  Backlog Clear Time:  2.5d  ⚠    ║
║    Tier 1:        91%  ✓                 ║  Critical Backlog:      4         ║
║    Tier 2:        85%  ✓                 ║  High Backlog:         18         ║
║    Tier 3:        76%  ⚠                 ║  Medium Backlog:       52         ║
║    Tier 4:        70%  ⚠                 ║  Low Backlog:          30         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  THROUGHPUT BY CATEGORY (this week)                                          ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Approval Queue:          198 processed  |  avg 6.2h to decision             ║
║  Escalation Queue:         34 processed  |  avg 18.4h to decision            ║
║  Exception Queue:          41 processed  |  avg 9.1h to decision             ║
║  Operational Review:       14 processed  |  avg 4.8h to decision             ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  DECISION DISTRIBUTION (this week)                                           ║
║  APPROVED 61%  ████████████████████                                          ║
║  REJECTED  14%  █████                                                         ║
║  COND.     18%  ██████                                                        ║
║  ESCALATED  5%  ██                                                            ║
║  EXPIRED    2%  █                                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Throughput Metrics Schema

```yaml
throughput_snapshot:
  timestamp: ISO-8601
  period: DAY | WEEK | MONTH
  
  volume:
    submitted: integer
    processed: integer
    throughput_ratio: float
    net_backlog_change: integer   # positive = growing, negative = shrinking
  
  by_queue:
    approval:
      submitted: integer
      processed: integer
      avg_time_to_decision_ms: integer
    escalation: [same]
    exception: [same]
    operational: [same]
  
  by_tier:
    tier_1:
      reviewer_count: integer
      decisions_made: integer
      decisions_per_reviewer_day: float
      first_pass_resolution_rate: float
    [tier_2 through tier_4: same]
  
  decision_distribution:
    APPROVED: integer
    REJECTED: integer
    APPROVED_WITH_CONDITIONS: integer
    ESCALATED: integer
    EXPIRED: integer
    DISMISSED: integer
  
  governance_debt:
    total_open: integer
    critical: integer
    high: integer
    medium: integer
    low: integer
    estimated_clear_days: float
  
  constitutional_throughput:
    evaluations_completed: integer
    PASS: integer
    CONDITIONAL: integer
    FAIL: integer
    avg_evaluation_time_ms: integer
```

---

## Capacity Planning

Throughput metrics feed capacity planning:

```yaml
capacity_planning:
  arrival_rate_forecast:
    model: exponential_smoothing with trend
    horizon: 30 days
    inputs: [daily_submission_volume_90d, org_growth_rate, new_workflow_deployments]
  
  capacity_requirements:
    formula: |
      required_capacity = forecasted_arrival_rate / target_throughput_ratio
      current_capacity = active_reviewers × avg_decisions_per_reviewer_day
      capacity_gap = required_capacity - current_capacity
  
  warning_thresholds:
    capacity_gap > 10%: alert delivery-lead
    capacity_gap > 25%: create governance capacity review
    capacity_gap > 40%: CRITICAL — governance system at risk
  
  capacity_recommendations:
    short_term: [overtime, contractor reviewers, cross-tier delegation]
    medium_term: [hire additional reviewers, automation of low-complexity items]
    long_term: [reduce governance overhead through policy clarification, better tooling]
```

---

## Throughput by Confidence Zone

Tracks how much throughput is consumed by AI confidence routing:

```yaml
confidence_zone_throughput:
  SOFT_REVIEW:
    items: integer
    pct_of_total: float
    avg_review_time_ms: integer
    approval_rate: float   # most should be approved (AI was probably right)
  
  REQUIRED_REVIEW:
    items: integer
    pct_of_total: float
    avg_review_time_ms: integer
    approval_rate: float
  
  EXPERT_REVIEW:
    items: integer
    pct_of_total: float
    avg_review_time_ms: integer
    approval_rate: float   # lower expected here
  
  REJECT_AND_FLAG:
    items: integer
    pct_of_total: float
    resolution_distribution: {ACCEPTED_BY_EXPERT, DISCARDED, RETRY_APPROVED}
  
  insights:
    high_REQUIRED_REVIEW_rate: AI confidence thresholds may be too strict
    high_approval_in_EXPERT_REVIEW: AI was too cautious; thresholds could relax
    growing_SOFT_REVIEW_approvals: AI accuracy improving; consider threshold relaxation
```

---

## Throughput Trend Analysis

```yaml
trend_analysis:
  weekly_throughput_trend:
    metric: items_processed / week
    alert_on: > 20% decrease week-over-week
    
  quality_trend:
    metric: outcome_reversal_rate (decisions later overturned)
    alert_on: > 5% reversal rate increasing
    
  efficiency_trend:
    metric: avg_review_time per item
    positive: decreasing (reviewers getting faster)
    negative: increasing > 10% (possible quality degradation or increasing complexity)
    
  ai_assistance_effectiveness:
    metric: review_time for items with AI analysis vs without
    expected: items with AI analysis reviewed 20–30% faster
    alert_on: no significant difference (AI assistance not helping)
```
