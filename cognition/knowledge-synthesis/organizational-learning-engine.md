# Organizational Learning Engine

## Purpose
Closes the loop between organizational experience and institutional capability. While other knowledge systems capture and retrieve individual knowledge units, the organizational learning engine tracks whether the organization is actually learning — becoming smarter, making fewer repeated mistakes, making better decisions over time, and accumulating compounding knowledge advantage. It turns the knowledge base from a static library into a living intelligence system.

---

## Learning Engine Architecture

```
Experience Streams
├── workflow outcomes (success rates, SLA, quality)
├── decision outcomes (positive/negative, reversals)
├── incident histories (recurrence rates, time-to-resolution)
├── knowledge usage (retrieval, application, usefulness)
└── agent performance trends (calibration, accuracy)
        ↓
[1. Learning Signal Extraction]   → what happened that should change knowledge
[2. Knowledge Gap Detection]      → where is knowledge missing or stale?
[3. Learning Velocity Tracking]   → is the org getting smarter, faster?
[4. Regression Detection]         → is previously-learned behavior degrading?
[5. Learning Initiative Dispatch] → trigger targeted knowledge-building activities
[6. Learning Health Reporting]    → measure and report organizational intelligence growth
```

---

## Organizational Learning Model

```yaml
learning_model:
  learning_dimensions:
    DECLARATIVE_LEARNING:
      description: Accumulating factual knowledge (what is true)
      measured_by: knowledge_base growth; quality; coverage; citation density
      target: growing corpus of HIGH+ quality KUs across all domains
    
    PROCEDURAL_LEARNING:
      description: Getting better at performing processes (how to do things)
      measured_by: workflow success rates; SLA compliance; cycle time reduction over time
      target: measurable process performance improvement quarter over quarter
    
    ADAPTIVE_LEARNING:
      description: Responding more effectively to novel situations
      measured_by: novel situation resolution time; first-attempt resolution rate
      target: novel situations resolved faster; fewer escalations to Tier-4+
    
    PREVENTIVE_LEARNING:
      description: Avoiding recurrence of known failures
      measured_by: incident recurrence rate; repeated failure mode rate
      target: zero repeat P1 incidents; < 10% repeat P2/P3 within 180 days
    
    GOVERNANCE_LEARNING:
      description: Improving decision quality and speed over time
      measured_by: decision reversal rate; governance throughput; SLA compliance trend
      target: declining reversal rate; stable or improving throughput
```

---

## Learning Signal Extraction

```yaml
learning_signals:
  positive_signals:
    knowledge_applied_positive_outcome:
      description: A KU was applied and the outcome was positive
      update: increase KU confidence + evidence_strength
      org_signal: DECLARATIVE_LEARNING metric improves
    
    incident_prevention_confirmed:
      description: A prevention measure from lessons-learned was implemented and incident did not recur
      update: upgrade INCIDENT_KNOWLEDGE evidence_strength from OBSERVED to VALIDATED
      org_signal: PREVENTIVE_LEARNING metric improves
    
    novel_situation_resolved_first_attempt:
      description: Agent handled a situation without prior precedent, successfully
      update: capture as CONTEXT_KNOWLEDGE or DECISION_KNOWLEDGE (new precedent)
      org_signal: ADAPTIVE_LEARNING metric improves
    
    decision_pattern_validated:
      description: A decision pattern KU predicted a positive outcome correctly
      update: increase pattern KU confidence; extend evidence chain
      org_signal: GOVERNANCE_LEARNING metric improves
  
  negative_signals:
    repeat_incident_same_root_cause:
      description: Same failure mode recurs after lessons were supposedly learned
      severity: HIGH
      update: downgrade prevention measure KU confidence; trigger re-elicitation
      org_signal: PREVENTIVE_LEARNING metric degrades; regression alert
    
    knowledge_applied_negative_outcome:
      description: A KU was applied and the outcome was negative
      update: decrease KU usefulness_score; flag for accuracy review
      org_signal: potential DECLARATIVE_LEARNING quality issue
    
    decision_reversal:
      description: A significant decision was reversed within 30 days
      update: flag the decision pattern KU (if one was applied) for review
      org_signal: GOVERNANCE_LEARNING quality issue
    
    zero_result_query_in_critical_domain:
      description: Agent searched for critical knowledge and found nothing
      severity: HIGH
      update: create knowledge gap entry; trigger elicitation
      org_signal: DECLARATIVE_LEARNING gap
    
    expert_departure_knowledge_unrecorded:
      description: Agent or domain expert offboarded without knowledge elicitation
      severity: MEDIUM
      update: create knowledge gap entries for departing expert's known domains
      org_signal: declarative knowledge loss event
```

---

## Knowledge Gap Detection

```yaml
knowledge_gap_detection:
  automated_detection:
    METHOD_1_zero_result_queries:
      source: search API query logs
      detection: query with zero results AND similar query repeated >= 3 times
      output: gap_record with example queries
    
    METHOD_2_domain_coverage_analysis:
      source: knowledge taxonomy + KU counts
      detection: subdomain with < 3 ACTIVE KUs OR avg quality < 0.60
      output: thin_coverage_gap record
    
    METHOD_3_knowledge_freshness_audit:
      source: KU lifecycle data
      detection: > 20% of ACTIVE KUs in a domain are overdue_for_review
      output: staleness_gap record
    
    METHOD_4_incident_pattern_without_KU:
      source: pattern-recognition-engine candidates
      detection: pattern_candidate exists with confidence >= 0.70 AND no matching KU
      output: capture_gap record
    
    METHOD_5_decision_pattern_reuse_deficit:
      source: decision_capture records
      detection: same decision made >= 5 times without citing any KU
      output: undocumented_criterion gap (suggests implicit criterion not yet captured)
  
  gap_record_schema:
    gap_id: "GAP-uuid"
    gap_type: ZERO_RESULT | THIN_COVERAGE | STALENESS | CAPTURE_DEFICIT | UNDOCUMENTED_CRITERION
    domain: string
    subdomain: string | null
    description: string
    evidence: [{source, observation}]
    priority: HIGH | MEDIUM | LOW
    recommended_action: ELICITATION | SYNTHESIS | REVIEW | EXTRACTION
    status: OPEN | IN_PROGRESS | CLOSED
    assigned_to: agent-id | null
    created_at: ISO-8601
    closed_at: ISO-8601 | null
```

---

## Learning Velocity Tracking

```yaml
learning_velocity:
  knowledge_acquisition_rate:
    metric: new ACTIVE KUs per week (net; subtracting deprecations)
    target: > 0 (growing corpus)
    alert: acquisition_rate < 0 for 4+ consecutive weeks (knowledge base shrinking)
  
  quality_improvement_rate:
    metric: Δ avg_overall_quality over 90 days
    target: stable or improving
    alert: quality declining > 0.05 over 90 days
  
  application_rate:
    metric: application_count / retrieval_count (fraction of retrieved KUs that are applied)
    target: >= 0.30 (at least 30% of retrieved knowledge gets applied)
    alert: application_rate < 0.15 (knowledge retrieved but not used → possible quality or relevance issue)
  
  prevention_effectiveness:
    metric: repeat_incident_rate = repeat_incidents / total_incidents (rolling 180 days)
    target: < 0.10
    alert: repeat_incident_rate > 0.20 for any domain
  
  coverage_growth:
    metric: fraction of taxonomy subdomains with >= 5 HIGH+ quality KUs
    target: 80% coverage within 12 months of system deployment
    current: tracked per domain
```

---

## Learning Initiatives

Triggered automatically or by Tier-3+:

```yaml
learning_initiatives:
  RAPID_CAPTURE_SPRINT:
    trigger: gap_count_HIGH > 10 in a domain
    action: schedule 5 expert elicitation sessions in the domain within 14 days
    output: expected 10–20 new KU drafts
  
  QUALITY_IMPROVEMENT_CAMPAIGN:
    trigger: domain avg_quality < 0.60
    action: assign domain steward to review and improve all POOR and MARGINAL KUs
    duration: 30 days
    success_metric: avg_quality >= 0.70 at campaign end
  
  LESSONS_LEARNED_ACCELERATION:
    trigger: repeat_incident_rate > 0.20 for a domain
    action: emergency postmortem review of all recent incidents in domain; action tracking
    output: all prevention actions must have verifiable completion tracking
  
  KNOWLEDGE_TRANSFER_OPERATION:
    trigger: expert_departure_risk_flagged (succession planning signal)
    action: schedule comprehensive knowledge_audit for departing expert
    timeline: must complete before agent offboards
  
  CROSS_DOMAIN_INSIGHT_EXPEDITION:
    trigger: quarterly; or when cross-domain pattern candidate confidence >= 0.75
    action: schedule cross-domain synthesis session with relevant domain stewards
    output: 1–3 RELATIONSHIP_KNOWLEDGE units per session
```

---

## Organizational Learning Dashboard

```yaml
learning_dashboard:
  panels:
    LEARNING_HEALTH_SCORE:
      formula: |
        weighted_average(
          declarative_learning_score   × 0.25,
          procedural_learning_score    × 0.25,
          adaptive_learning_score      × 0.20,
          preventive_learning_score    × 0.20,
          governance_learning_score    × 0.10
        )
      display: 0.0–1.0 with trend (↑↓→)
      target: >= 0.75
    
    KNOWLEDGE_CORPUS_HEALTH:
      metrics: [total_active, high_quality_pct, coverage_score, avg_quality, acquisition_rate]
    
    GAP_REGISTRY:
      display: open gaps by priority and domain; assigned/unassigned
    
    LEARNING_VELOCITY:
      display: 90-day trend charts for all velocity metrics
    
    ACTIVE_INITIATIVES:
      display: initiative_type, domain, progress, completion_date
    
    REGRESSION_ALERTS:
      display: dimensions where metrics are declining with time-to-SLA
  
  reporting_cadence:
    weekly: learning velocity update to knowledge-governance-lead
    monthly: full learning health report to Tier-3+
    quarterly: board-level organizational intelligence summary
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-capture/incident-lessons-learned.md` | Preventive learning signals |
| `knowledge-capture/pattern-recognition-engine.md` | Pattern gap signals |
| `knowledge-capture/expert-knowledge-elicitation.md` | Gap closure via elicitation |
| `knowledge-synthesis/knowledge-synthesis-engine.md` | Synthesis as learning activity |
| `knowledge-governance/knowledge-operations-dashboard.md` | Learning metrics display |
| `approval-operations/approval-analytics.md` | Governance learning signals |
| `operational-review/governance-throughput-metrics.md` | Procedural learning signals |
