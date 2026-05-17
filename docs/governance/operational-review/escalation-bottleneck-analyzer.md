# Escalation Bottleneck Analyzer

## Purpose
Identifies systemic bottlenecks in escalation flows — situations where the escalation process itself becomes a source of delay, confusion, or organizational friction. Unlike individual SLA monitoring, this system looks for patterns that indicate structural problems needing architectural solutions.

---

## Bottleneck Detection Model

A bottleneck exists when:
1. Items accumulate at a specific point faster than they are resolved
2. Resolution time at a point consistently exceeds targets
3. Items that should resolve at level N consistently escalate to level N+1
4. The same items circulate (escalate, partially resolve, re-escalate)

---

## Bottleneck Pattern Catalog

### BP-001 — Tier Saturation
```yaml
pattern: BP-001
name: Tier Saturation
description: A specific tier queue is chronically overloaded; items cannot be processed at the rate they arrive
detection:
  signals:
    - tier_N_queue_depth_growth: queue depth growing > 10% per day for 3+ days
    - tier_N_avg_wait > 2× target for > 24 hours
    - tier_N_assignment_failure_rate > 20% (no eligible reviewer)
  
  confirmation: all 3 signals present simultaneously
  severity: determined by tier (Tier-3 saturation = HIGH, Tier-4 = CRITICAL)

root_causes:
  - insufficient reviewer count at that tier
  - reviewers at that tier occupied by other commitments
  - routing error: items arriving at wrong tier
  - complexity inflation: items require more review time than expected

resolution_options:
  immediate:
    - temporarily allow Tier+(N+1) to process Tier-N items
    - redistribute between available Tier-N reviewers across orgs
    - identify and fast-track easy items (low review time) to clear queue
  structural:
    - increase Tier-N reviewer pool
    - adjust routing thresholds (some Tier-3 work to Tier-2)
    - improve context packages to reduce decision time
```

### BP-002 — Escalation Cascade
```yaml
pattern: BP-002
name: Escalation Cascade
description: Items escalate through multiple tiers without resolution; indicating the decision authority or information needed is not being reached
detection:
  signals:
    - items_escalated_3plus_times_in_7d: count > 5
    - avg_escalation_chain_length > 2.5 in rolling 7d
    - same_items_re-escalating: item appears in escalation queue > 1x
  
  severity: HIGH to CRITICAL (depending on item types)

root_causes:
  - unclear authority boundary: no tier definitively owns the decision
  - missing information: decision cannot be made without information nobody has provided
  - constitutional gray area: no precedent; decision keeps getting bounced
  - stakeholder conflict: parties cannot agree and each escalation doesn't resolve conflict

resolution_options:
  immediate:
    - convene structured decision session with all relevant tiers present
    - explicitly assign decision authority to specific agent (no more escalation)
    - time-box: decision must be made at current tier by specific deadline
  structural:
    - create missing policy/precedent to prevent recurrence
    - clarify authority boundaries in governance documentation
    - add constitutional review early in process (before escalation starts)
```

### BP-003 — Reviewer Concentration
```yaml
pattern: BP-003
name: Reviewer Concentration
description: A small number of reviewers handle disproportionate volume, creating single points of failure
detection:
  signals:
    - top_3_reviewers_pct > 60% of tier decisions (Lorenz concentration measure)
    - single_reviewer_dependency: 1 reviewer handles > 40% of specific domain
    - review_queue_stalls_when: specific reviewer is absent
  
  severity: MEDIUM (risk) to HIGH (if creating SLA failures)

root_causes:
  - expertise concentration: only a few people know the domain
  - culture: certain senior reviewers attract all the important decisions
  - assignment_engine_bias: algorithm consistently routes to same reviewers
  - reviewer unwillingness: most reviewers avoid certain item types

resolution_options:
  immediate:
    - redistribute current load from overloaded to underloaded reviewers
    - adjust assignment policy to enforce more even distribution
  structural:
    - cross-train additional reviewers for concentrated domains
    - create expertise development program
    - document domain knowledge to reduce individual dependency
```

### BP-004 — Needs-Info Loop
```yaml
pattern: BP-004
name: Needs-Info Loop
description: Items cycle repeatedly between UNDER_REVIEW and NEEDS_INFO without progressing to a decision
detection:
  signals:
    - items_with_3plus_needs_info_rounds > 10% of active items
    - avg_needs_info_rounds > 1.5 in rolling 7d
    - same_submitter_needs_info_repeatedly: submitter-specific pattern
  
  severity: MEDIUM

root_causes:
  - incomplete context packages: submitters don't know what information is needed
  - reviewer unclear expectations: reviewers not specifying what they need precisely
  - information unavailability: information exists but nobody knows where it is
  - cognitive avoidance: reviewers using NEEDS_INFO to defer difficult decisions

resolution_options:
  immediate:
    - mandate: NEEDS_INFO requests must specify exactly what is needed
    - set max 2 rounds before escalation
    - track NEEDS_INFO rate per reviewer (high rate = avoidance signal)
  structural:
    - improve review interface with guided information request templates
    - add pre-flight check for common information requirements
    - create information repository for frequently-requested context
```

### BP-005 — Governance Latency Spike
```yaml
pattern: BP-005
name: Governance Latency Spike
description: Sudden increase in overall review latency not explained by volume increase
detection:
  signals:
    - total_lifecycle_latency_p95 increases > 30% vs prior 7d average
    - volume_normalized_latency increasing (latency / item_count)
    - no corresponding queue depth increase
  
  severity: HIGH

root_causes:
  - reviewer cognitive load increase (decision complexity change)
  - new policy uncertainty: policy change causing reviewers to be more careful
  - system slowdown: interface or tooling performance degradation
  - external event: news/incident causing heightened scrutiny
  - new reviewer onboarding: less experienced reviewers in pool

resolution_options:
  immediate:
    - identify specific items causing latency spike (outliers)
    - check interface/tooling performance metrics
    - survey reviewers on perceived difficulty change
  structural:
    - if caused by policy uncertainty: issue policy clarification
    - if caused by tool performance: performance optimization sprint
    - if caused by new reviewers: accelerated onboarding + mentorship pairing
```

---

## Bottleneck Severity Matrix

```yaml
severity_assessment:
  inputs:
    - pattern_type: [BP-001 through BP-005]
    - affected_tier: 1–5
    - sla_impact: % of items breaching SLA due to bottleneck
    - org_impact: number of orgs affected
    - duration: how long pattern has been active
  
  severity_computation:
    base_by_sla_impact:
      < 5%: LOW
      5–15%: MEDIUM
      15–30%: HIGH
      > 30%: CRITICAL
    
    multipliers:
      affected_tier >= 4: ×1.5
      duration > 7 days: ×1.3
      multiple_orgs_affected: ×1.2
    
    final_severity: max(base, computed)
```

---

## Bottleneck Report Schema

```yaml
bottleneck_report:
  report_id: "BNECK-uuid"
  detected_at: ISO-8601
  pattern: BP-NNN
  severity: LOW | MEDIUM | HIGH | CRITICAL
  
  evidence:
    signals_triggered: [{signal, value, threshold, period}]
    affected_items: [item_id]
    affected_reviewers: [reviewer_id]
    sla_breach_count_attributable: integer
  
  root_cause_hypothesis:
    primary: string
    secondary: [string]
    confidence: float
  
  recommended_actions:
    immediate: [{action, expected_impact, effort}]
    structural: [{action, expected_impact, effort}]
  
  assigned_to: delivery-lead | governance-lead
  status: OPEN | IN_REMEDIATION | RESOLVED | MONITORING
  resolution:
    actions_taken: [action]
    resolved_at: ISO-8601 | null
    recurrence_prevention: string
```

---

## Continuous Monitoring Schedule

```yaml
monitoring_schedule:
  real_time: queue depth monitoring, sudden spike detection
  hourly: tier saturation check, needs_info loop count
  daily: reviewer concentration analysis, escalation cascade pattern scan
  weekly: full bottleneck report generation, trend analysis, structural recommendations
  monthly: effectiveness review (did prior recommendations improve metrics?)
```
