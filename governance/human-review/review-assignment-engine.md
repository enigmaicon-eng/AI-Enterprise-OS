# Review Assignment Engine

## Purpose
Determines which human reviewer receives each approval, escalation, and exception item. Assignment is not random — it optimizes for expertise match, workload balance, conflict-of-interest avoidance, SLA feasibility, and continuity for multi-step reviews. This engine runs for every new item entering any review queue.

---

## Assignment Algorithm

```
assign_reviewer(item):
  # Step 1: Build eligible reviewer pool
  pool = get_reviewers(tier >= item.routing.tier_required)
  pool = filter_conflicts(pool, item)         # remove conflict-of-interest
  pool = filter_suspended(pool)               # remove suspended reviewers
  pool = filter_unavailable(pool, item.sla)   # remove those who can't meet SLA
  
  if pool.empty():
    return handle_no_eligible_reviewers(item)
  
  # Step 2: Apply policy to select reviewer
  policy = get_assignment_policy(item)
  
  match policy:
    case EXPERTISE_MATCH:    return expertise_match(pool, item)
    case LEAST_LOADED:       return least_loaded(pool)
    case STICKY:             return sticky_assignment(pool, item)
    case PRIORITY_WEIGHTED:  return priority_weighted(pool, item)
    case ROUND_ROBIN:        return round_robin(pool)
  
  # Step 3: Log assignment
  record_assignment(item, selected_reviewer)
  notify(selected_reviewer, item)
  start_sla_timer(item)
  
  return selected_reviewer
```

---

## Reviewer Pool Model

```yaml
reviewer_profile:
  reviewer_id: agent-id
  name: string
  tier: 1–5
  org: string
  roles: [role-string]
  
  capabilities:
    domain_expertise: [domain-string]    # e.g., ["architecture", "security", "finance"]
    subject_types: [subject-type-string] # types of requests they can handle
    languages: [language-code]
  
  availability:
    status: AVAILABLE | BUSY | OUT_OF_OFFICE | SUSPENDED
    current_load: integer               # active assigned items
    max_concurrent: integer             # their capacity limit
    next_available_at: ISO-8601 | null  # for OUT_OF_OFFICE
    working_hours: "HH:MM–HH:MM TZ"
  
  performance:
    avg_decision_time_ms: integer       # historical average
    sla_compliance_rate: float          # % decisions made within SLA
    decision_quality_score: float       # based on outcome tracking
    rejection_reversal_rate: float      # % rejections later overturned
  
  recusals:
    domains: [domain-string]            # domains they've recused from
    specific_orgs: [org-name]
    active_until: ISO-8601 | null
  
  conflicts:
    financial_interests: [entity-id]    # self-declared
    management_chain: [agent-id]        # from org chart
```

---

## Expertise Match Algorithm

```
expertise_match(pool, item):
  scores = {}
  
  for reviewer in pool:
    score = 0.0
    
    # Domain expertise match
    item_domains = extract_domains(item.subject, item.context_package.relevant_policies)
    domain_overlap = len(reviewer.capabilities.domain_expertise ∩ item_domains)
    score += domain_overlap * 30
    
    # Subject type familiarity (historical decisions on same type)
    historical_count = count_past_decisions(reviewer, item.subject.type)
    score += min(historical_count * 5, 50)
    
    # Recent familiarity with related items (context continuity)
    if STICKY and reviewer handled related item:
      score += 100
    
    # SLA feasibility
    available_time_ms = reviewer.next_available_decision_slot()
    time_needed_ms = reviewer.avg_decision_time_ms * item.complexity_factor
    sla_buffer = item.sla_deadline - now() - time_needed_ms
    if sla_buffer > 0:
      score += min(sla_buffer / 3600000, 30)  # up to +30 for generous SLA buffer
    else:
      score -= 100  # cannot meet SLA — deprioritize
    
    # Quality bonus
    score += reviewer.performance.sla_compliance_rate * 20
    
    scores[reviewer] = score
  
  return scores.argmax()
```

---

## Load Balancing

Prevents any reviewer from being overwhelmed:

```yaml
load_limits:
  per_reviewer:
    max_concurrent_standard: 10    # normal items
    max_concurrent_critical: 3     # CRITICAL items (high cognitive load)
    max_concurrent_constitutional: 1  # only one constitutional review at a time
    daily_decision_target: 20      # soft limit; warnings above this
  
  load_factor_computation:
    load_factor = (active_items / max_concurrent) 
                  + (critical_items * 2 / max_concurrent_critical)
    
    thresholds:
      < 0.50: AVAILABLE for new assignments
      0.50–0.80: BUSY — only accept if no other eligible reviewer available
      > 0.80: OVERLOADED — do not assign; notify reviewer manager
  
  rebalancing:
    trigger: reviewer load_factor > 0.90
    action: reassign some pending items (not in-progress) to less-loaded reviewers
    requires_notification: true   # notify original reviewer of reassignment
```

---

## Continuity Management

For multi-step reviews and long-running cases, maintaining reviewer continuity improves quality:

```yaml
continuity_rules:
  same_reviewer_preferred:
    - Needs-Info response → original reviewer gets priority
    - Conditional approval follow-up → original reviewer gets priority
    - Re-submitted after rejection → different reviewer required
    - Escalated item → new reviewer at new tier required
  
  knowledge_transfer_on_reassignment:
    trigger: continuity cannot be maintained (reviewer unavailable, conflict, overloaded)
    action:
      - generate handoff briefing from prior decision history
      - new reviewer shown full thread with prior reviewer's analysis
      - prior reviewer notified of reassignment (for transparency)
```

---

## No Eligible Reviewer Handling

```
handle_no_eligible_reviewers(item):
  # Step 1: Expand tier range
  if item.routing.tier_required < 5:
    expanded_pool = get_reviewers(tier == item.routing.tier_required + 1)
    if expanded_pool:
      log_tier_expansion(item)
      return assign_from(expanded_pool, item)
  
  # Step 2: Out-of-hours escalation
  if outside_business_hours():
    on_call = get_on_call_reviewer(tier >= item.routing.tier_required)
    if on_call:
      return assign_on_call(on_call, item, urgency_boost=true)
  
  # Step 3: Resource contention escalation
  create_escalation_case(
    type: RESOURCE_CONTENTION,
    subject: item,
    reason: "No eligible reviewer available for tier {item.routing.tier_required}"
  )
  
  # Step 4: Notify governance
  notify_governance_lead(
    message: f"Approval queue blocked: no eligible Tier-{item.routing.tier_required} reviewer",
    item: item
  )
  
  return ASSIGNMENT_BLOCKED
```

---

## Assignment Analytics

Published to `operational-review/` for bottleneck analysis:

```yaml
assignment_metrics:
  assignment_latency_ms:        # time from submission to assignment
    p50, p95, p99 by tier
  
  assignment_success_rate:      # % items assigned within 15 minutes
    by tier, by domain
  
  reviewer_utilization:         # per reviewer: load_factor trend
    high_utilization_alerts: load_factor > 0.80 for > 1 hour
  
  expertise_match_score:        # avg expertise match score at time of assignment
    trend: improving expertise routing over time
  
  reassignment_rate:            # % items reassigned after initial assignment
    by reason: [CONFLICT, OVERLOAD, UNAVAILABLE, EXPERTISE_MISMATCH]
  
  no_reviewer_events:           # count of ASSIGNMENT_BLOCKED events
    by tier, by hour of day (reveals coverage gaps)
```

---

## Reviewer Self-Management

Reviewers can manage their own availability:

```yaml
self_management:
  set_unavailable:
    duration: HOURS | DAYS | UNTIL_DATE
    reason: MEETING | OUT_OF_OFFICE | PERSONAL | OTHER
    handoff: optional designation of coverage reviewer
    auto_reassign_pending: true/false
  
  set_recusal:
    domain: domain-string
    org: org-name
    duration: PERMANENT | UNTIL_DATE
    reason: string (required)
    approved_by: manager-role (required)
  
  capacity_adjustment:
    request_reduced_load: submit to manager-role for approval
    temporary_max_concurrent: can reduce own max by up to 50%
```
