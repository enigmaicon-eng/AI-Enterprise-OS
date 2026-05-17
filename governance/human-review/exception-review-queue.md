# Exception Review Queue

## Purpose
Manages review of items that fall outside normal automated processing — policy exceptions, anomalous AI outputs, flagged edge cases, regulatory holds, and items explicitly marked for human verification. The exception queue is the safety valve for the enterprise: anything the automated system cannot confidently handle routes here.

---

## Exception Categories

```yaml
exception_categories:
  POLICY_EXCEPTION:
    description: Request falls outside current policy boundaries; action would require policy override
    examples:
      - artifact created by agent outside its authorized scope
      - workflow invoked a capability not in its approved capability set
      - cross-org data access without explicit authorization
    default_priority: HIGH
    required_tier: 3
  
  CONFIDENCE_THRESHOLD_BREACH:
    description: AI agent output confidence below acceptable threshold for autonomous action
    examples:
      - decision model returned confidence < 0.60
      - AI recommendation has high uncertainty across options
      - conflicting signals prevent confident routing
    default_priority: MEDIUM
    required_tier: 2
  
  ANOMALY_DETECTED:
    description: Statistical or behavioral anomaly flagged by monitoring systems
    examples:
      - unusual data access pattern
      - agent behavior outside baseline
      - unexpected resource consumption spike
    default_priority: HIGH
    required_tier: 3
  
  REGULATORY_HOLD:
    description: Item flagged for compliance, legal, or regulatory review
    examples:
      - cross-border data transfer requiring legal review
      - output touching PII without explicit consent record
      - action in a regulated domain without compliance clearance
    default_priority: CRITICAL
    required_tier: 4
  
  CONSTITUTIONAL_FLAG:
    description: Potential constitutional principle tension requiring human judgment
    examples:
      - action in gray area not definitively resolved by constitution/
      - competing principles with unclear precedence
      - novel situation not covered by existing constitutional guidance
    default_priority: CRITICAL
    required_tier: 4
  
  QUALITY_FLAG:
    description: Output quality fell below minimum standard
    examples:
      - artifact completeness score < threshold
      - AI output scored low on factual verification
      - document failed automated quality checks
    default_priority: LOW
    required_tier: 1
  
  MANUAL_FLAG:
    description: Manually flagged by any principal for human review
    examples:
      - any agent or human can flag any item
      - "something looks wrong" catches
    default_priority: determined_at_flag_time
    required_tier: determined_by_flagging_principal_tier
  
  DUPLICATE_DETECTION:
    description: Item appears to be duplicate or conflicting with existing item
    examples:
      - RFC substantially similar to existing approved RFC
      - artifact conflicts with existing authoritative artifact
    default_priority: MEDIUM
    required_tier: 2
```

---

## Exception Item Schema

```yaml
exception_item:
  exception_id: "EXQ-uuid"
  category: [from exception_categories]
  subcategory: string
  
  # What triggered the exception
  trigger:
    source_system: string
    trigger_event_id: string
    trigger_reason: string       # machine-generated explanation
    trigger_evidence: {}         # data that caused the flag
    confidence_score: float | null
    threshold_violated: float | null
  
  # The item being reviewed
  subject:
    type: string
    id: string
    title: string
    content_preview: string      # first N characters for quick scan
    artifact_refs: [artifact-id]
    created_by: agent-id
    created_at: ISO-8601
  
  # Review routing
  routing:
    tier_required: 1–5
    domain_expertise_required: string | null
    assigned_to: agent-id | null
    assigned_at: ISO-8601 | null
  
  # Priority
  priority_score: 0–1000
  urgency: CRITICAL | HIGH | MEDIUM | LOW
  submitted_at: ISO-8601
  sla_deadline: ISO-8601
  
  # Holds (blocks downstream processing until resolved)
  holds_applied:
    - hold_id: string
      hold_type: WORKFLOW_PAUSE | ARTIFACT_QUARANTINE | AGENT_SUSPENSION
      held_entity_id: string
      applied_at: ISO-8601
  
  # AI pre-analysis
  ai_analysis:
    summary: string
    likely_cause: string
    recommended_action: string
    confidence: float
    similar_exceptions: [{exception_id, resolution, outcome}]
  
  # Resolution
  status: PENDING | ASSIGNED | UNDER_REVIEW | RESOLVED | DISMISSED | ESCALATED
  resolution:
    reviewer_id: agent-id | null
    reviewed_at: ISO-8601 | null
    outcome: APPROVED_WITH_EXCEPTION | REJECTED | POLICY_UPDATED | ESCALATED | DISMISSED_FALSE_POSITIVE
    rationale: string
    conditions: [string]
    holds_lifted: [hold_id]
    holds_maintained: [hold_id]
    follow_up_required: true/false
```

---

## Hold Management

When an exception is flagged, the system may apply holds to prevent downstream harm:

```yaml
hold_types:
  WORKFLOW_PAUSE:
    description: Pause workflow instance pending exception resolution
    apply_when: exception.category in [CONSTITUTIONAL_FLAG, REGULATORY_HOLD, POLICY_EXCEPTION]
    release_condition: exception resolved with APPROVED or POLICY_UPDATED
    override_authority: Tier-4 with rationale
  
  ARTIFACT_QUARANTINE:
    description: Quarantine artifact — prevent read/use by other systems
    apply_when: exception.category in [QUALITY_FLAG, DUPLICATE_DETECTION, ANOMALY_DETECTED]
    release_condition: exception resolved with APPROVED or DISMISSED
    quarantine_storage: isolated namespace, no API access
  
  AGENT_SUSPENSION:
    description: Suspend agent from accepting new tasks
    apply_when: exception involves agent producing repeated low-quality or anomalous outputs
    threshold: 3 QUALITY_FLAG or 2 ANOMALY_DETECTED within 24h for same agent
    release_condition: governance review + Tier-3 clearance
    duration_max: 72h (then automatic governance review)
```

---

## False Positive Management

Track and reduce false positives to avoid alert fatigue:

```yaml
false_positive_system:
  tracking:
    on_DISMISSED_FALSE_POSITIVE:
      record: {category, subcategory, trigger_pattern, dismissed_by, dismissed_at}
      update: false_positive_rate for this trigger pattern
  
  suppression:
    condition: false_positive_rate for pattern > 0.70 in last 30 days
    action: suppress future triggers matching this pattern
    requires_approval: Tier-3
    suppression_duration: 30 days, then re-evaluate
  
  pattern_feedback:
    # Feed false positive data back to trigger systems for threshold tuning
    recipients:
      - governance-queues/confidence-threshold-system.md
      - governance-queues/governance-triggered-reviews.md
    feedback_format: {pattern, fp_rate, suggested_threshold_adjustment}
```

---

## Exception Metrics

Published to operational-review:

```yaml
metrics:
  volume_by_category:     # count per category per day/week/month
  false_positive_rate:    # per category
  avg_resolution_time:    # per category per tier
  hold_duration:          # avg time items held per hold type
  recurrence_rate:        # % exceptions with same root cause as prior exception
  resolution_distribution:  # breakdown: APPROVED / REJECTED / POLICY_UPDATED / ESCALATED / FP
```
