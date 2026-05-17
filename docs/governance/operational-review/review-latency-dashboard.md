# Review Latency Dashboard

## Purpose
Provides end-to-end latency visibility across all human review operations. Latency is tracked at every stage of the review lifecycle — from trigger to queue to assignment to decision — enabling identification of bottlenecks, reviewer performance patterns, and systemic delays.

---

## Latency Measurement Points

```
Item Lifecycle with Latency Measurement Points

T0: Trigger event (governance rule fires, confidence threshold, manual flag)
    ↓ [Trigger-to-Queue Latency: T0→T1]
T1: Item enters review queue
    ↓ [Queue Wait Latency: T1→T2]
T2: Item assigned to reviewer
    ↓ [Assignment-to-Open Latency: T2→T3]
T3: Reviewer opens the review interface
    ↓ [Review Active Time: T3→T4]
T4: Reviewer submits decision
    ↓ [Decision-to-Execution Latency: T4→T5]
T5: Workflow resumes or action taken

Total Lifecycle Latency: T0→T5
Human Decision Latency: T1→T4
Governance Overhead: T0→T5 minus intrinsic workflow duration
```

---

## Dashboard Layout

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  REVIEW LATENCY DASHBOARD                     Last 7 days | Updated: 60s   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  LIFECYCLE LATENCY (p50 / p95 / p99)                                        ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Stage               p50        p95        p99       Target (p95)           ║
║  Trigger-to-Queue    0.3s       1.2s       3.1s      < 2s       ✓          ║
║  Queue Wait          1.2h       6.4h       18.2h     < 8h       ✓          ║
║  Assign-to-Open      0.4h       2.8h       6.1h      < 4h       ✓          ║
║  Review Active Time  12m        48m        2.1h      < 60m      ⚠          ║
║  Decision-to-Resume  0.8s       4.2s       12s       < 10s      ⚠          ║
║  Total Lifecycle     2.8h       11.4h      28.6h     < 12h      ✓          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  LATENCY BY TIER                                                             ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Tier 1: p50 1.4h  ████████░░░░░░░░  p95 4.2h                              ║
║  Tier 2: p50 3.2h  ████████████░░░░  p95 9.8h                              ║
║  Tier 3: p50 6.1h  ████████████████  p95 16.4h  ⚠ High                    ║
║  Tier 4: p50 24h   ████████░░░░░░░░  p95 52h                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  LATENCY TREND (7 days)                                                      ║
║                                                                              ║
║  Total p95 (hours)                                                           ║
║  20 ┤                                                                        ║
║  15 ┤     ╭──╮                                                               ║
║  12 ┤─────╯  ╰────────────────────────╮───────────  target                  ║
║  10 ┤                                 ╰─────────                             ║
║   5 ┤                                                                        ║
║     └────────────────────────────────────────────                           ║
║      7d ago                                    today                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  HOTSPOT ANALYSIS                                                            ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Slowest stage this week: Review Active Time (p95: 48m vs 60m target)       ║
║  Worst-performing tier:   Tier 3 (p95 queue wait 16.4h vs 8h target)        ║
║  Bottleneck signal:       3 Tier-3 reviewers account for 78% of decisions   ║
║  Recommendation:          Expand Tier-3 reviewer pool or redistribute load  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Latency Metric Definitions

### Trigger-to-Queue Latency
```yaml
trigger_to_queue:
  measurement: T1 - T0
  target_p95: PT2S   # 2 seconds — this is pure system processing
  anomaly_threshold: > PT30S   # flag if system processing takes this long
  components:
    - governance rule evaluation
    - confidence score routing
    - routing payload assembly
    - queue submission
  alert_on: > PT10S (system is under stress)
```

### Queue Wait Latency
```yaml
queue_wait:
  measurement: T2 - T1   # time sitting in queue before assignment
  interpretation: |
    High queue wait = insufficient reviewers OR misrouted to wrong tier
    Low queue wait = healthy reviewer capacity
  targets:
    tier_1: p95 < PT4H
    tier_2: p95 < PT8H
    tier_3: p95 < PT16H
    tier_4: p95 < PT48H
  
  breakdown_dimensions:
    by_time_of_day: identifies after-hours coverage gaps
    by_day_of_week: identifies day-specific capacity issues
    by_domain: identifies domain-specific reviewer shortages
```

### Review Active Time
```yaml
review_active_time:
  measurement: T4 - T3   # time reviewer spent actively in review
  note: |
    Too LOW may indicate insufficient review depth (rubber-stamping)
    Too HIGH may indicate unclear context, insufficient AI assistance, or decision difficulty
  targets:
    tier_1_standard: p50 < PT10M, p95 < PT30M
    tier_2_standard: p50 < PT15M, p95 < PT45M
    tier_3_complex: p50 < PT30M, p95 < PT90M
    tier_4_executive: p50 < PT20M, p95 < PT60M
  
  anomaly_detection:
    extremely_short: < PT2M for CRITICAL risk → flag for quality audit
    extremely_long: > p99 * 2 → flag as potential decision difficulty
```

---

## Latency Anomaly Detection

```yaml
anomaly_detection:
  sudden_spike:
    trigger: stage latency jumps > 50% above rolling 24h average
    detection_window: 30 minutes
    action: alert to governance-operations + escalation-bottleneck-analyzer.md
  
  sustained_degradation:
    trigger: stage latency > target for > 4 hours
    action: create OPERATIONAL_REVIEW governance-triggered review
  
  tier_specific_spike:
    trigger: specific tier queue wait exceeds 2× target p95
    action: review-assignment-engine.md notified + governance-lead alerted
  
  after_hours_latency:
    trigger: items submitted after-hours showing queue wait > 8h on average
    analysis: identify on-call coverage gaps
    action: report to delivery-lead monthly
```

---

## Latency Drill-Down Tools

For each latency stage, operators can drill into:

```yaml
drill_down_tools:
  queue_wait_analysis:
    - show items currently in queue sorted by wait time
    - reviewer availability heatmap during wait period
    - assignment attempt history for each item
  
  reviewer_latency_profile:
    - per reviewer: avg T2→T4 latency by item type
    - time-of-day patterns
    - quality correlation (fast reviews vs quality outcomes)
  
  domain_latency_breakdown:
    - latency by subject.type
    - latency by org
    - latency by risk level within type
  
  cohort_analysis:
    - items submitted on same day: how did they perform?
    - items by same submitter: patterns?
    - items reviewed by same reviewer: reviewer-specific effects?
```

---

## SLA-Latency Correlation

```yaml
correlation_analysis:
  sla_consumed_at_decision:
    description: What % of SLA was consumed when decision was made?
    healthy: p50 < 60%, p95 < 80% (leaves safety margin)
    concerning: p50 > 70%, p95 > 90% (consistently tight)
    critical: regular breaches in specific tier/domain
  
  latency_to_outcome_quality:
    hypothesis: extremely fast reviews have lower quality
    tracking: review_active_time vs outcome quality score
    report: monthly correlation report
  
  queue_depth_to_latency:
    expected: queue depth correlates with wait latency
    anomaly_if: high queue depth but low wait latency (may indicate skipped reviews)
    anomaly_if: low queue depth but high wait latency (reviewer engagement issue)
```

---

## Performance Targets Summary

```yaml
performance_targets:
  trigger_to_queue_p95: PT2S
  queue_wait_p95_tier1: PT4H
  queue_wait_p95_tier2: PT8H
  queue_wait_p95_tier3: PT16H
  queue_wait_p95_tier4: PT48H
  assign_to_open_p95: PT4H
  review_active_time_p95_standard: PT45M
  review_active_time_p95_complex: PT90M
  decision_to_resume_p95: PT10S
  total_lifecycle_p95: PT12H   # full end-to-end

  performance_review_frequency: weekly
  target_update_governance: Tier-3 approval required to change targets
```
