# Queue Priority Engine

## Purpose
Computes and maintains priority scores across all review queues — approval, escalation, exception, and operational. Priority determines ordering within tier queues and influences assignment urgency. The engine runs continuously, re-scoring items as their context changes (SLA elapsed, downstream impact grows, etc.).

---

## Priority Score Architecture

```
Priority Score (0–1000) = Base Score + Context Modifiers + Dynamic Modifiers

Base Score: determined by item type and inherent risk
Context Modifiers: fixed at submission time based on item characteristics  
Dynamic Modifiers: recalculated continuously as time passes and context changes
```

---

## Base Score Table

```yaml
base_scores:
  by_risk_level:
    CRITICAL: 700
    HIGH:     500
    MEDIUM:   300
    LOW:      100
  
  by_item_type:
    CONSTITUTIONAL_FLAG:         +200 (applied on top of risk score)
    REGULATORY_HOLD:             +150
    POLICY_OVERRIDE:             +100
    INCIDENT_P1:                 +200
    INCIDENT_P2:                 +100
    INCIDENT_P3:                 +50
    GOVERNANCE_TRIGGERED_REVIEW: +75
    CONFIDENCE_THRESHOLD_BREACH: +50
    STANDARD_APPROVAL:           +0
    QUALITY_FLAG:                -50
```

---

## Context Modifiers (Set at Submission)

```yaml
context_modifiers:
  downstream_blocking:
    description: Workflows blocked pending this decision
    scoring:
      blocked_workflows_count = 0:    +0
      blocked_workflows_count = 1–2:  +50
      blocked_workflows_count = 3–5:  +100
      blocked_workflows_count = 6–10: +150
      blocked_workflows_count > 10:   +200
  
  reversibility:
    reversible: +0
    not_reversible: +75
  
  stakeholder_tier:
    max_stakeholder_tier = 1–2: +0
    max_stakeholder_tier = 3:   +50
    max_stakeholder_tier = 4:   +100
    max_stakeholder_tier = 5:   +150
  
  org_health_context:
    affected_org_stress_level:
      NORMAL:   +0
      ELEVATED: +25
      HIGH:     +50
      CRITICAL: +100
  
  constitutional_dimension:
    constitutional_check == PASS:        +0
    constitutional_check == CONDITIONAL: +100
    constitutional_check == FAIL:        +300 (+ force-escalate)
    constitutional_check == PENDING:     +50 (uncertainty premium)
  
  escalation_history:
    first_time_in_queue: +0
    escalated_once:      +75
    escalated_twice:     +150
    escalated_three_plus: +200
```

---

## Dynamic Modifiers (Recalculated Every 5 Minutes)

```yaml
dynamic_modifiers:
  sla_age_pressure:
    description: Score increases as SLA deadline approaches
    formula: |
      sla_consumed_pct = (now - submitted_at) / (deadline - submitted_at)
      
      sla_consumed_pct < 0.50: modifier = sla_consumed_pct * 50
      sla_consumed_pct < 0.75: modifier = 25 + (sla_consumed_pct - 0.50) * 200
      sla_consumed_pct < 0.90: modifier = 75 + (sla_consumed_pct - 0.75) * 500
      sla_consumed_pct >= 0.90: modifier = 150 + (sla_consumed_pct - 0.90) * 1000
      
      # Score can temporarily exceed 1000 during SLA crisis — signals emergency
  
  downstream_growth:
    description: As blocked workflows increase, priority increases
    recalculation: every 5 minutes via orchestration-dag-system.md query
    delta_modifier: +10 per newly blocked workflow since last check
  
  concurrent_related_items:
    description: If multiple related items are pending, priority compound
    detection: items with same correlation_id or same affected workflow
    modifier_per_related: +25 (max +100)
  
  reviewer_scarcity:
    description: If eligible reviewers are scarce, priority increases to trigger escalation
    calculation: (1 - available_eligible_reviewers / total_eligible_reviewers) * 100
    purpose: triggers tier expansion earlier when reviewers are scarce
```

---

## Priority Recomputation Triggers

```yaml
recomputation_triggers:
  scheduled: every 5 minutes for all active items
  
  event_driven:
    - new workflow blocked by this item → recompute immediately
    - eligible reviewer becomes available → recompute priority order
    - constitutional check result received → recompute (may change dramatically)
    - sla_at_80_percent → recompute + trigger governance-triggered-reviews.md GOV-01
    - escalation event → recompute for all items in same escalation chain
    - org health status change → recompute all items affecting that org
```

---

## Cross-Queue Priority Comparison

Items compete not just within their queue but across queues for reviewer attention:

```yaml
cross_queue_priority:
  enabled: true
  
  queue_weights:
    escalation_queue: 1.20   # escalation items get 20% priority boost vs approval
    exception_queue: 1.10    # exceptions get 10% boost
    approval_queue: 1.00     # baseline
    operational_review: 0.80 # operational reviews lower urgency
  
  effective_priority = item.priority_score * queue_weight
  
  reviewer_view:
    shows: unified priority-sorted list across all queues the reviewer is eligible for
    filter_options: by queue type, by tier, by domain, by org
    default_view: cross-queue sorted by effective_priority
```

---

## Emergency Priority Protocol

When any item's priority score exceeds 950:

```yaml
emergency_protocol:
  trigger: priority_score > 950
  
  immediate_actions:
    1: promote to top of all eligible reviewer queues
    2: push notification to all eligible reviewers (not just assigned)
    3: notify reviewer manager and governance-lead
    4: if no reviewer responds within 10 minutes: wake on-call reviewer
    5: if no reviewer responds within 20 minutes: Tier+1 emergency escalation
  
  tracking:
    emergency_count_per_day: tracked
    high_emergency_rate: > 5/day → governance review of threshold configuration
```

---

## Priority Fairness Controls

Prevent starvation of lower-priority items:

```yaml
fairness_controls:
  aging_floor:
    description: Every item gains minimum 5 priority points per hour
    purpose: prevents low-priority items from never being reviewed
    cap: aging can bring LOW risk items to max MEDIUM range only (max +200 from aging)
  
  queue_depth_pressure:
    description: Items in queues with high depth get priority bonus
    formula: min(queue_depth / 50, 1.0) * 50
    purpose: encourages reviewers to process backlogged queues
  
  max_wait_guarantee:
    LOW items: guaranteed review within 7 days (auto-escalate if needed)
    MEDIUM items: guaranteed within 3 days
    HIGH items: guaranteed within 24 hours
    CRITICAL items: guaranteed within 4 hours
```

---

## Priority Analytics

```yaml
metrics:
  avg_priority_at_resolution:    # did high-priority items get resolved faster?
  priority_score_accuracy:       # correlation between priority score and actual urgency
  sla_breach_rate_by_priority:   # should be near zero for CRITICAL
  starvation_events:             # items reaching aging_floor guarantee
  emergency_protocol_activations: per day/week
  priority_distribution:         histogram of priority scores in queue at any time
```
