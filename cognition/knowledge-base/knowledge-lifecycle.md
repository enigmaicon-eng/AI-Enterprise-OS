# Knowledge Lifecycle

## Purpose
Governs how knowledge units move through their lifecycle — from creation through active use, maintenance, deprecation, and archival. Ensures that organizational knowledge remains accurate, current, and trustworthy, and that outdated knowledge is retired before it causes harm.

---

## Lifecycle State Machine

```
[DRAFT] ──────────────────────────────────────────────► [REVIEW]
   │                                                        │
   │                              ┌─────── request changes ─┘
   │                              ▼
   │                           [DRAFT] (re-enters)
   │                              │
   │                              └─────── approved ──────────► [ACTIVE]
   │                                                               │
   │                                                    ┌──────────┼─────────────┐
   │                                                    ▼          │             ▼
   │                                               [CONTESTED]     │        [DEPRECATED]
   │                                                    │          │             │
   │                                           resolved │          │             │ superseded
   │                                                    └──────────► [ACTIVE]   │  
   │                                                               │        replaced
   │                                                               ▼             ▼
   └──────────────────────────────────────────────────────► [ARCHIVED]  ◄───────┘
```

---

## Lifecycle Stages

### DRAFT

```yaml
draft_stage:
  entry_conditions:
    - knowledge unit submitted by any authorized agent
    - initial schema validation passed
  
  characteristics:
    visible_to: [author, steward, Tier-3+]
    searchable: false
    retrievable: false
    editable: true (no versioning; draft is mutable)
  
  required_fields_before_review:
    - title: non-empty
    - summary: >= 2 sentences
    - body: >= 100 words
    - domain: valid taxonomy domain
    - subdomain: valid for domain
    - knowledge_type: valid type
    - tags: at least audience + temporal tag
    - provenance.origin_type: set
    - provenance.confidence: >= 0.50 to enter REVIEW
    - governance.owner: assigned
  
  auto_expiry:
    draft_without_activity_days: 30
    action: notify_owner
    draft_without_activity_days_hard: 60
    hard_action: auto_archive_with_notification
```

### REVIEW

```yaml
review_stage:
  entry_conditions:
    - all DRAFT required fields present
    - submitted for review by owner or steward
  
  characteristics:
    visible_to: [author, steward, assigned_reviewers, Tier-3+]
    searchable: false
    retrievable: false (only by reviewers)
    editable: true (by reviewers only)
  
  review_assignment:
    default_reviewer: domain steward
    escalation: knowledge-governance-lead if no steward assigned
    sla:
      PROCESS_KNOWLEDGE: 5 business days
      POLICY_KNOWLEDGE: 3 business days
      INCIDENT_KNOWLEDGE: 2 business days (urgency)
      default: 5 business days
  
  review_criteria:
    accuracy: is the content factually correct?
    completeness: are key fields populated with sufficient detail?
    clarity: is the content unambiguous and well-structured?
    taxonomy: is domain/subdomain/knowledge_type assignment correct?
    uniqueness: is this a duplicate or near-duplicate?
    provenance: is origin adequately documented?
  
  outcomes:
    APPROVED: unit advances to ACTIVE
    REQUEST_CHANGES: unit returns to DRAFT with review notes
    REJECT: unit moves to ARCHIVED with rejection reason
    ESCALATE: send to knowledge-governance-lead for decision
  
  quality_baseline:
    runs_at: review completion
    sets: quality.completeness_score, quality.clarity_score (initial estimates)
    blocks_approval_if: any score < 0.40
```

### ACTIVE

```yaml
active_stage:
  entry_conditions:
    - passed REVIEW with APPROVED outcome
    - sets lifecycle.published_at = now
    - sets lifecycle.next_review based on review_schedule
  
  characteristics:
    visible_to: based on governance.access_level
    searchable: true (included in all appropriate indexes)
    retrievable: true
    editable: changes create new version; prior version archived in version store
  
  review_schedules:
    MONTHLY:
      applies_to: [POLICY_KNOWLEDGE, time-sensitive tagged units]
      trigger: calendar + event-based (if governing policy changes)
    QUARTERLY:
      applies_to: [DECISION_KNOWLEDGE, INCIDENT_KNOWLEDGE]
      trigger: calendar + post-incident
    ANNUALLY:
      applies_to: [DOMAIN_KNOWLEDGE, CONTEXT_KNOWLEDGE, PATTERN_KNOWLEDGE]
      trigger: calendar
    ON_CHANGE:
      applies_to: [PROCESS_KNOWLEDGE linked to active workflows]
      trigger: workflow schema change event
  
  update_governance:
    PATCH: owner or steward; no review required
    MINOR: owner or steward; async review notification to domain steward
    MAJOR: requires REVIEW stage re-entry; old version archived
  
  staleness_detection:
    overdue_for_review: next_review < today
    action_at_7d_overdue: notify owner
    action_at_30d_overdue: notify owner + steward + add STALE flag (searchable warning)
    action_at_90d_overdue: escalate to knowledge-governance-lead
```

### DEPRECATED

```yaml
deprecated_stage:
  entry_conditions:
    - owner, steward, or Tier-3+ calls repository.deprecate()
    - superseded_by unit_id must be provided (unless deprecated without replacement)
    - deprecation reason must be stated
  
  characteristics:
    searchable: true (with DEPRECATED label; newer unit shown first)
    retrievable: true (with DEPRECATED warning banner)
    editable: false (no further updates; it's deprecated)
  
  deprecation_record:
    deprecated_at: ISO-8601
    deprecated_by: agent-id
    reason: string
    superseded_by: unit_id | null
    deprecation_note: string (displayed to users who retrieve this unit)
  
  transition_to_archived:
    trigger: deprecated_for_days >= 365
    OR trigger: manual archival by Tier-3+
    OR trigger: usage drops to 0 for 90 consecutive days post-deprecation
```

### ARCHIVED

```yaml
archived_stage:
  entry_conditions:
    - manual: Tier-4+ calls repository.archive()
    - automatic: DRAFT auto-expiry, DEPRECATED auto-archival
  
  characteristics:
    searchable: false (removed from all standard indexes)
    retrievable: direct ID lookup only (for audit/compliance)
    editable: false
  
  retention: permanent (knowledge units never physically deleted)
  archive_record:
    archived_at: ISO-8601
    archived_by: agent-id
    reason: DRAFT_EXPIRY | SUPERSEDED | COMPLIANCE | MANUAL | AUTO
    restore_requires: Tier-3+ with justification
```

### CONTESTED

```yaml
contested_stage:
  entry_conditions:
    - any agent submits a formal dispute with evidence
    - OR automated CONTRADICTS relationship detected during ingest
  
  characteristics:
    searchable: true (with CONTESTED warning label)
    retrievable: true
    editable: by assigned dispute investigator only
  
  dispute_record:
    raised_by: agent-id
    raised_at: ISO-8601
    dispute_type: FACTUAL_ERROR | OUTDATED | SCOPE_DISAGREEMENT | POLICY_CONFLICT | METHODOLOGY
    evidence: [{ref, description, confidence}]
    assigned_investigator: agent-id
    investigation_deadline: ISO-8601 (max 30 days from dispute filing)
  
  resolution_outcomes:
    SUSTAINED: disputing unit is correct; original updated or deprecated
    REJECTED: original unit is correct; CONTESTED cleared
    PARTIAL: both partially correct; both updated; relationship updated
    SPLIT: creates two separate units for distinct interpretations
  
  sla:
    simple_dispute: 14 days
    complex_dispute: 30 days
    unresolved_at_deadline: escalate to knowledge-governance-lead
```

---

## Lifecycle Event Bus

All state transitions emit events to the enterprise event bus:

```yaml
lifecycle_events:
  ku.draft.created:
    payload: {unit_id, title, domain, owner, created_at}
    subscribers: [knowledge-steward, domain-owner, duplicate-detector]
  
  ku.review.submitted:
    payload: {unit_id, title, domain, review_type, submitter}
    subscribers: [review-assignment-engine, domain-steward]
  
  ku.active.published:
    payload: {unit_id, title, domain, knowledge_type, tags}
    subscribers: [search-indexer, embedding-indexer, recommendation-engine, domain-subscribers]
  
  ku.deprecated:
    payload: {unit_id, deprecated_by, superseded_by, reason}
    subscribers: [search-indexer, citation-tracker, owner-of-citing-units]
  
  ku.contested:
    payload: {unit_id, dispute_type, raised_by}
    subscribers: [domain-steward, knowledge-governance-lead, search-indexer]
  
  ku.archived:
    payload: {unit_id, reason, archived_by}
    subscribers: [search-indexer, audit-logger]
  
  ku.stale.detected:
    payload: {unit_id, days_overdue, owner}
    subscribers: [owner-notifier, knowledge-governance-dashboard]
```

---

## Review Scheduling Engine

```yaml
review_scheduler:
  run_frequency: daily at 06:00 UTC
  
  algorithm:
    1. query all ACTIVE units where next_review <= today + 7d
    2. for each unit:
       a. compute priority (overdue × risk × usage_score)
       b. create review task and assign to steward or owner
       c. set review_in_progress flag
    3. for units where next_review < today - 30d:
       a. escalate: assign to knowledge-governance-lead
       b. add STALE metadata flag
  
  review_task_schema:
    task_id: string
    unit_id: string
    review_type: SCHEDULED | TRIGGERED | DISPUTE
    assigned_to: agent-id
    due_by: ISO-8601
    review_checklist:
      - [ ] Content still accurate?
      - [ ] Domain/taxonomy still correct?
      - [ ] Examples still valid?
      - [ ] Related units still linked correctly?
      - [ ] Quality scores still representative?
      - [ ] Review schedule appropriate?
  
  bulk_review_triggers:
    regulatory_change: re-review all POLICY_KNOWLEDGE units in affected domain
    major_incident: re-review all INCIDENT_KNOWLEDGE in related domain
    architecture_change: re-review all TECHNICAL + PROCESS_KNOWLEDGE citing changed system
```

---

## Expiry Management

```yaml
expiry_management:
  explicit_expiry:
    condition: lifecycle.expires_at is set
    pre_expiry_warning: 30 days, 7 days, 1 day before
    at_expiry:
      auto_status: DEPRECATED (if superseded_by known) or CONTESTED (if no replacement)
      alert_to: owner + domain-steward
  
  time_sensitive_knowledge:
    tag: time-sensitive
    policy: mandatory expires_at required at publish time
    max_valid_duration: 30 days (renewable with owner review)
  
  regulatory_expiry:
    policy_knowledge_with_valid_until: auto-deprecate when valid_until passes
    action: deprecate + alert compliance team
  
  soft_expiry_signals:
    retrieval_rate_drop: usage.retrieval_count trending -50% over 90 days → flag for review
    citation_loss: all citing units deprecated → flag for review
    contradicted: CONTRADICTS relationship added → enter CONTESTED
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-model.md` | Lifecycle field definitions |
| `knowledge-base/knowledge-repository.md` | State transition persistence + API |
| `knowledge-governance/knowledge-ownership-system.md` | Owner/steward notification on lifecycle events |
| `knowledge-governance/knowledge-operations-dashboard.md` | Lifecycle health metrics |
| `enterprise-telemetry/enterprise-event-bus.md` | Lifecycle event emission |
| `human-review/approval-queue-system.md` | MAJOR version updates enter review queue |
