# Review SLA Monitor

## Purpose
Tracks SLA compliance for every item in every review queue in real time. Detects breaches before they happen, fires alerts at configurable thresholds, and triggers automatic escalation when SLAs are not met. This system is the primary accountability mechanism for governance responsiveness.

---

## SLA Configuration by Item Type

```yaml
sla_matrix:
  # Approval Queue SLAs
  approval_queue:
    CRITICAL_risk:
      tier_1: PT4H
      tier_2: PT8H
      tier_3: PT24H
      tier_4: PT72H
    HIGH_risk:
      tier_1: PT8H
      tier_2: PT24H
      tier_3: PT48H
      tier_4: PT72H
    MEDIUM_risk:
      tier_1: PT24H
      tier_2: PT48H
      tier_3: PT72H
      tier_4: PT120H   # 5 days
    LOW_risk:
      tier_1: PT48H
      tier_2: PT72H
      tier_3: PT120H
      tier_4: PT168H   # 7 days
  
  # Escalation Queue SLAs (tighter — already waited once)
  escalation_queue:
    CRITICAL: PT4H
    HIGH: PT24H
    MEDIUM: PT72H
    LOW: PT168H
  
  # Exception Queue SLAs
  exception_queue:
    CONSTITUTIONAL_FLAG: PT4H
    REGULATORY_HOLD: PT24H
    POLICY_EXCEPTION: PT48H
    CONFIDENCE_THRESHOLD_BREACH: PT8H
    ANOMALY_DETECTED: PT8H
    QUALITY_FLAG: PT72H
    MANUAL_FLAG: PT48H
  
  # Operational Review SLAs
  operational_review:
    CRITICAL: PT2H
    HIGH: PT8H
    MEDIUM: PT24H
    LOW: PT72H
```

---

## SLA State Machine

```yaml
sla_states:
  ON_TRACK:
    range: 0–60% consumed
    color: green
    action: none
  
  AT_RISK:
    range: 60–80% consumed
    color: yellow
    action: visibility_increase (show in dashboard yellow section)
  
  WARNING:
    range: 80–95% consumed
    color: orange
    action: |
      - immediate notification to assigned reviewer
      - cc reviewer's manager
      - priority score boost +200
      - governance-triggered-reviews.md GOV-01 fires
  
  CRITICAL:
    range: 95–100% consumed
    color: red
    action: |
      - all-channel notification (in-app + email + pagerduty)
      - priority score boost +400
      - pre-stage escalation (identify next-tier reviewer)
  
  BREACHED:
    range: > 100% consumed
    color: dark_red + flashing
    action: |
      - auto-escalate to next tier immediately
      - create compliance finding COMP-SLA-002
      - notify governance-lead
      - record SLA breach in audit trail
      - compute breach magnitude (% over SLA)
```

---

## SLA Tracking Per Item

```yaml
sla_tracking_record:
  item_id: string
  queue_type: APPROVAL | ESCALATION | EXCEPTION | OPERATIONAL
  
  sla_config:
    target_ms: integer        # from sla_matrix above
    submitted_at: ISO-8601
    deadline: ISO-8601        # submitted_at + target_ms
  
  sla_clock:
    running: true/false       # false when paused (e.g., during NEEDS_INFO)
    elapsed_ms: integer       # time spent with clock running
    paused_ms: integer        # time spent paused (doesn't count toward SLA)
    effective_elapsed_ms: integer  # elapsed_ms - paused_ms
    consumed_pct: float       # effective_elapsed_ms / target_ms
  
  clock_pauses:
    - paused_at: ISO-8601
      resumed_at: ISO-8601 | null
      reason: NEEDS_INFO | DEPENDENCY_WAIT | REVIEWER_RECUSAL | HOLD
  
  state: ON_TRACK | AT_RISK | WARNING | CRITICAL | BREACHED
  state_changed_at: ISO-8601
  
  alerts_fired:
    - at_pct: float
      fired_at: ISO-8601
      alert_type: AT_RISK | WARNING | CRITICAL | BREACH
      notified: [agent-id]
      acknowledged_by: agent-id | null
      acknowledged_at: ISO-8601 | null
  
  breach_record:
    breached: true/false
    breach_at: ISO-8601 | null
    breach_magnitude_pct: float | null   # how far over SLA
    breach_cause_analysis: string | null
    escalation_created: true/false
    compliance_finding_id: string | null
```

---

## Alert Dispatch Rules

```yaml
alert_dispatch:
  AT_RISK (60% consumed):
    targets: [assigned_reviewer]
    channels: [in_app]
    message: "SLA at {pct}% — review due by {deadline}"
    repeat: once only
  
  WARNING (80% consumed):
    targets: [assigned_reviewer, reviewer_manager]
    channels: [in_app, email]
    message: "URGENT: Review SLA at {pct}% — {time_remaining} remaining"
    auto_action: priority_boost(+200)
    repeat: every 30 minutes if unacknowledged
  
  CRITICAL (95% consumed):
    targets: [assigned_reviewer, reviewer_manager, org_lead]
    channels: [in_app, email, pagerduty]
    message: "CRITICAL: Review SLA at {pct}% — breach imminent"
    auto_action: pre_stage_escalation + priority_boost(+400)
    repeat: every 10 minutes if unacknowledged
  
  BREACH (> 100% consumed):
    targets: [assigned_reviewer, reviewer_manager, org_lead, governance_lead]
    channels: [all_channels]
    message: "SLA BREACHED by {breach_magnitude_ms}ms — escalating automatically"
    auto_action: immediate_escalation + compliance_finding + governance_notification
    repeat: every 5 minutes until escalated reviewer acknowledges
```

---

## Clock Pause Management

SLA clocks can be legitimately paused:

```yaml
clock_pause_rules:
  NEEDS_INFO:
    paused_when: review status changes to NEEDS_INFO
    resumed_when: submitter provides additional information
    max_pause_duration: PT72H   # if no response in 72h, re-start clock as if info was received
    max_pause_count: 3          # after 3 pauses, escalate (reviewer may be avoiding decision)
  
  DEPENDENCY_WAIT:
    paused_when: review waiting on external dependency (e.g., constitutional check)
    resumed_when: dependency resolved
    auto_resume_timeout: PT4H   # if dependency doesn't resolve, resume anyway with note
  
  REVIEWER_RECUSAL:
    paused_when: assigned reviewer files recusal
    resumed_when: new reviewer assigned
    max_unassigned_duration: PT2H for CRITICAL, PT8H for HIGH, PT24H for MEDIUM/LOW
  
  pause_audit:
    all pauses logged with reason
    excessive_pausing: > 3 pauses on same item → flag for governance review
```

---

## SLA Health Dashboard Data

Published every 5 minutes to `operational-review/review-latency-dashboard.md`:

```yaml
sla_health_snapshot:
  timestamp: ISO-8601
  
  by_queue:
    approval:
      total_active: integer
      on_track: integer
      at_risk: integer
      warning: integer
      critical: integer
      breached_active: integer
      
    escalation:
      [same structure]
    
    exception:
      [same structure]
  
  breach_rate_24h: float    # % items breached in last 24h
  breach_rate_7d: float
  avg_breach_magnitude_ms: integer   # avg severity of breaches
  
  worst_items:
    - item_id: string
      queue: string
      consumed_pct: float
      time_remaining_ms: integer
      assigned_to: agent-id | null
```

---

## Aggregate SLA Compliance Metrics

```yaml
aggregate_metrics:
  sla_compliance_rate:
    computation: (items_resolved_within_sla / total_resolved_items) * 100
    by: [queue_type, tier, risk_level, org, week/month]
    target: >= 95%
  
  avg_resolution_time:
    by: [queue_type, tier, risk_level]
    vs_sla_target: ratio
  
  breach_distribution:
    by_magnitude: [< 10%, 10–25%, 25–50%, > 50% over SLA]
    by_cause: [no_reviewer, reviewer_non_responsive, needs_info_loop, escalation_delay]
  
  sla_trend:
    rolling_30d: compliance rate per day
    week_over_week: improving | stable | degrading
```
