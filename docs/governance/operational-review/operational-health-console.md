# Operational Health Console

## Purpose
Unified operational view of all human governance operations. Combines SLA monitoring, latency data, throughput metrics, escalation bottlenecks, and reviewer health into a single situational awareness interface for governance leads and delivery managers.

---

## Console Layout

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  GOVERNANCE OPERATIONS HEALTH CONSOLE               2026-05-15 14:32 UTC        ║
║  Status: ⚠ ATTENTION  |  Refresh: 30s  |  Operator: governance-lead            ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  OVERALL HEALTH SCORE:  0.81 / 1.00  ⚠ ATTENTION                               ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  SLA Compliance:    0.93  ✓     Throughput:      1.02  ✓                        ║
║  Queue Health:      0.75  ⚠     Reviewer Load:   0.79  ⚠                       ║
║  Bottleneck Score:  0.88  ✓     Const. Clearance: 0.97  ✓                      ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  LIVE QUEUE STATUS                                                               ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  Queue              Pending  Assigned  SLA Risk  Oldest Item    Throughput      ║
║  Approval (T1)         18       12        2        1.2h          ✓ 1.08x        ║
║  Approval (T2)         24       18        3        3.4h          ✓ 1.02x        ║
║  Approval (T3)         11        7        4       11.2h          ⚠ 0.79x        ║
║  Approval (T4)          3        3        1       28.6h          ✓ 1.00x        ║
║  Escalation            8        6        2        4.1h           ✓              ║
║  Exception            14       10        1        2.8h           ✓              ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  ACTIVE ALERTS                                              Priority            ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  ⚠ [HIGH]  T3 queue throughput below 0.85x threshold for 2.4h               1  ║
║  ⚠ [HIGH]  Reviewer ARCH-004 at 87% load — approaching limit                2  ║
║  ⚠ [WARN]  4 items at SLA risk (>80%) in Approval queue                     3  ║
║  ℹ [INFO]  Bottleneck BP-003 (Reviewer Concentration) detected in T3         4  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  REVIEWER AVAILABILITY                                                           ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  Tier 1: 8 active / 12 registered  (67%)   Load avg: 0.62  ✓                  ║
║  Tier 2: 6 active / 9 registered   (67%)   Load avg: 0.71  ✓                  ║
║  Tier 3: 3 active / 5 registered   (60%)   Load avg: 0.84  ⚠                  ║
║  Tier 4: 4 active / 4 registered   (100%)  Load avg: 0.55  ✓                  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  GOVERNANCE EFFICIENCY (24h)                                                     ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  Items Processed:    62  |  Avg Decision Time: 3.8h  |  First-Pass Rate: 81%   ║
║  Escalation Rate:   6%   |  SLA Breaches:        2   |  Const. Reviews:    8   ║
║                                                                                  ║
║  Decision Quality Indicators:                                                    ║
║  Reversal Rate (7d): 2.1%  ✓   |  Override Rate (7d): 1.8%  ✓                 ║
║  Needs-Info Avg Rounds: 1.2  ✓  |  Avg Rationale Quality: 0.78  ✓             ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║  QUICK ACTIONS                                                                   ║
║  ─────────────────────────────────────────────────────────────────────────────  ║
║  [Expand T3 Pool]  [Redistribute Load]  [Emergency Capacity]  [View Bottleneck] ║
║  [Pause Low-Priority Queue]  [Export Report]  [Alert Configuration]             ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Overall Health Score

```yaml
health_score:
  dimensions:
    sla_compliance:
      weight: 0.25
      source: review-sla-monitor.md aggregate SLA compliance rate
      score: (items_in_sla / total_items) capped at 1.0
    
    throughput_ratio:
      weight: 0.20
      source: governance-throughput-metrics.md throughput_ratio
      score: min(throughput_ratio, 1.0)
    
    queue_health:
      weight: 0.20
      source: queue depth growth rate + sla_risk count
      score: 1.0 - (weighted_queue_depth_growth + sla_risk_fraction)
    
    reviewer_load:
      weight: 0.15
      source: avg load factor across all active reviewers
      score: 1.0 - max(0, avg_load_factor - 0.70) * 3.33
    
    bottleneck_score:
      weight: 0.10
      source: escalation-bottleneck-analyzer.md active bottlenecks
      score: 1.0 - (active_bottleneck_severity_sum / max_severity)
    
    constitutional_clearance:
      weight: 0.10
      source: constitutional reviews pending > 4h count
      score: 1.0 - min(overdue_constitutional / 5, 1.0)
  
  hard_penalties:
    sla_breach_count > 5 in 24h: -0.15
    tier_3_or_4_reviewer_count == 0: -0.30  # nobody can make high-tier decisions
    active_constitutional_violation: -0.25
    throughput_ratio < 0.70 for > 2h: -0.20
  
  status_bands:
    >= 0.90: HEALTHY (green)
    >= 0.75: ATTENTION (yellow) ⚠
    >= 0.60: DEGRADED (orange)
    < 0.60: CRITICAL (red)
```

---

## Operational Playbooks

Operators can invoke playbooks directly from the console:

### Playbook: T3 Queue Overload
```yaml
trigger: T3 throughput_ratio < 0.85 for > 2 hours
steps:
  1. Identify items that can be safely processed by T4 principals
  2. Move those items to T4 queue (inform T4 reviewers)
  3. Check if any T3 items are misrouted (should be T2) — reroute if so
  4. Identify T3 reviewers who are OUT_OF_OFFICE → set estimated return
  5. If shortage structural: request T3 capacity increase from delivery-lead
  6. Monitor: throughput should recover within 2 hours
```

### Playbook: Reviewer Capacity Emergency
```yaml
trigger: active reviewers at any tier == 0 AND pending > 3
steps:
  1. Activate on-call reviewer for that tier (page if after-hours)
  2. Notify all registered reviewers for that tier
  3. If Tier-1 or Tier-2 emergency: any Tier-3+ can cover
  4. If Tier-3 emergency: any Tier-4 can cover + governance-lead notified
  5. If Tier-4 emergency: executive sponsor notified directly
  6. All emergency assignments logged as CAPACITY_EMERGENCY
```

### Playbook: SLA Breach Cluster
```yaml
trigger: 3+ SLA breaches within 30 minutes
steps:
  1. Pause low-priority queue items (prevent new assignments for 30 min)
  2. Identify root cause: queue depth? reviewer capacity? specific item types?
  3. Expedite currently assigned CRITICAL and HIGH items
  4. Notify governance-lead with breach summary
  5. If pattern repeats within 24h: trigger structural review
```

---

## Alert Configuration

Operators can customize alert thresholds:

```yaml
configurable_alerts:
  queue_sla_risk_count:
    default_threshold: 5
    alert_channel: in_app
    modifiable_by: tier_2+
  
  reviewer_load_warning:
    default_threshold: 0.80
    alert_channel: in_app + email
    modifiable_by: delivery_lead
  
  throughput_ratio_warning:
    default_threshold: 0.85
    alert_channel: in_app + email
    modifiable_by: governance_lead
  
  health_score_warning:
    default_threshold: 0.75
    alert_channel: all_channels
    modifiable_by: governance_lead + Tier_4

change_governance:
  threshold_changes: logged + notify affected team
  alert_suppressions: max 4 hours (emergency only)
  suppression_authorization: Tier-3
```

---

## Integration Points

| System | Data Source |
|---|---|
| `review-sla-monitor.md` | SLA compliance + breach data |
| `review-latency-dashboard.md` | Latency by stage |
| `escalation-bottleneck-analyzer.md` | Active bottleneck reports |
| `governance-throughput-metrics.md` | Throughput + capacity data |
| `human-review/review-assignment-engine.md` | Reviewer availability + load |
| `enterprise-telemetry/governance-telemetry.md` | Underlying event stream |
| `process-governance/process-governance-dashboard.md` | Compliance dimension |
