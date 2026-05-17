# Pattern Recognition Engine

## Purpose
Automatically identifies recurring patterns across the knowledge base, workflow executions, decisions, and incidents. Where other capture systems extract knowledge from individual events, the pattern recognition engine works across many events to surface reusable patterns — the organizational intelligence that emerges only when looking at many data points together.

---

## Engine Architecture

```
Data Streams (continuous)
├── knowledge-base (all ACTIVE KUs)
├── workflow-execution traces
├── decision capture records
├── incident records
└── usage + feedback signals
        ↓
[1. Signal Aggregation]     → normalize signals across data streams
[2. Clustering Engine]      → group similar signals
[3. Pattern Candidate Gen]  → generate pattern hypotheses from clusters
[4. Confidence Scoring]     → score reliability of each candidate
[5. Novelty Check]          → compare to existing PATTERN_KNOWLEDGE units
[6. Draft Generation]       → create KU draft for validated new patterns
[7. Refinement Loop]        → incorporate feedback from published patterns
```

---

## Pattern Types

```yaml
pattern_types:
  WORKFLOW_PATTERN:
    description: A recurring sequence of steps or decisions across workflow executions
    examples:
      - "Governance approvals always take 3× longer than technical reviews in Q4"
      - "Deployments following rushed approvals have 4× higher rollback rate"
    signals: execution_traces, timing data, outcome data
    output_ku_type: PROCESS_KNOWLEDGE or PATTERN_KNOWLEDGE
  
  DECISION_PATTERN:
    description: A recurring decision criterion, bias, or outcome pattern
    examples:
      - "T3 reviewers consistently approve architectural decisions from ARCH org without requesting changes"
      - "Exception requests citing 'business urgency' are granted at 90% rate with no conditions"
    signals: decision_capture_records, approval analytics
    output_ku_type: DECISION_KNOWLEDGE or PATTERN_KNOWLEDGE
  
  FAILURE_PATTERN:
    description: A recurring failure mode across incidents or workflow errors
    examples:
      - "Capacity exhaustion precedes 80% of P1 incidents in the ETL pipeline"
      - "Config drift after manual hotfixes causes incident recurrence within 30 days"
    signals: incident_records, error_logs, postmortem data
    output_ku_type: PATTERN_KNOWLEDGE (anti-pattern) or INCIDENT_KNOWLEDGE
  
  KNOWLEDGE_USAGE_PATTERN:
    description: Recurring patterns in how knowledge units are retrieved and applied
    examples:
      - "Incident responders consistently look for the same 3 KUs within first 10 minutes"
      - "POLICY_KNOWLEDGE units in GOVERNANCE domain are retrieved but rarely applied"
    signals: retrieval_logs, application_feedback
    output_ku_type: CONTEXT_KNOWLEDGE (knowledge about knowledge usage)
  
  AGENT_BEHAVIOR_PATTERN:
    description: Recurring behaviors, tendencies, or biases in specific agent types or orgs
    examples:
      - "QA org agents consistently underestimate test cycle time by 40%"
      - "Architecture org agents rarely flag security concerns proactively"
    signals: workflow_traces, decision_records, outcome_data
    output_ku_type: ORGANIZATIONAL_KNOWLEDGE or PATTERN_KNOWLEDGE
  
  CROSS_DOMAIN_PATTERN:
    description: A pattern that manifests across multiple domains
    examples:
      - "Governance bottlenecks correlate with increased incident severity the following week"
      - "High-confidence AI outputs are overridden more often when reviewer is Tier-4+"
    signals: multiple data streams; requires correlation analysis
    output_ku_type: RELATIONSHIP_KNOWLEDGE or PATTERN_KNOWLEDGE
```

---

## Clustering Engine

```yaml
clustering_engine:
  algorithms:
    semantic_clustering:
      method: embed signals → k-means or DBSCAN on embedding vectors
      use_for: WORKFLOW_PATTERN, KNOWLEDGE_USAGE_PATTERN
      min_cluster_size: 5 (fewer = noise, not pattern)
    
    temporal_clustering:
      method: time-series analysis; find recurring patterns in time-series data
      use_for: FAILURE_PATTERN, WORKFLOW_PATTERN
      min_recurrence: 3 occurrences in 90-day window
    
    structural_clustering:
      method: graph analysis on knowledge relationships and workflow DAGs
      use_for: CROSS_DOMAIN_PATTERN, AGENT_BEHAVIOR_PATTERN
      method_detail: frequent subgraph mining (gSpan algorithm)
    
    statistical_clustering:
      method: chi-squared test, correlation analysis, regression
      use_for: DECISION_PATTERN, AGENT_BEHAVIOR_PATTERN
      significance_threshold: p < 0.05
  
  cluster_schema:
    cluster_id: "CLU-uuid"
    pattern_type: [see pattern_types]
    member_signals: [signal_id]
    signal_count: int
    first_observed: ISO-8601
    last_observed: ISO-8601
    frequency: signals_per_30_days
    cluster_centroid: {}             # representative signal or embedding center
    confidence_score: 0.0–1.0
    candidate_pattern: string        # natural language description of the pattern
```

---

## Pattern Candidate Generation

```yaml
pattern_candidate_generation:
  eligibility:
    minimum_signal_count: 5
    minimum_time_span: 14 days      # pattern must have been observable for at least 14 days
    minimum_confidence: 0.60
  
  candidate_schema:
    candidate_id: "PC-uuid"
    cluster_id: string
    pattern_type: string
    
    pattern_description:
      title: string                  # concise name for the pattern
      summary: string                # 2–4 sentence description
      evidence_signals: [signal_id]  # supporting instances
      counter_signals: [signal_id]   # instances where pattern did NOT hold
      applicability_conditions: string # when does this pattern apply?
      exceptions_known: [string]     # known exceptions to the pattern
    
    statistical_profile:
      occurrence_count: int
      occurrence_rate: float         # per 30 days
      confidence_interval: {lower, upper}
      p_value: float | null
    
    novelty_score: 0.0–1.0          # how different from existing PATTERN_KNOWLEDGE units
    action_recommendation: PUBLISH | REVIEW | EXTEND_EXISTING | MONITOR
```

---

## Confidence Scoring

```yaml
confidence_scoring:
  signals_contributing_to_confidence:
    signal_volume:
      5–10 signals:  base 0.55
      11–25 signals: base 0.70
      26–50 signals: base 0.80
      51+ signals:   base 0.90
    
    signal_diversity:
      signals from single workflow/incident type: × 0.80
      signals from 2–3 distinct sources: × 1.00
      signals from 4+ distinct sources: × 1.10 (capped at 0.95)
    
    temporal_consistency:
      pattern stable over 30+ days: × 1.05
      pattern degrading (fewer recent instances): × 0.85
      pattern strengthening (more recent instances): × 1.05
    
    outcome_correlation:
      pattern correlated with measurable outcome: + 0.05 to + 0.15
      no measurable outcome data: neutral
    
    peer_validation:
      domain_expert_confirms: + 0.10
      expert_contest: - 0.20
  
  auto_publish_threshold: confidence >= 0.85 AND novelty_score >= 0.40
  human_review_threshold: confidence >= 0.60 AND confidence < 0.85
  discard_threshold: confidence < 0.60 OR signal_count < 5
```

---

## Existing Pattern Refinement

```yaml
pattern_refinement:
  trigger: new cluster with similarity > 0.85 to existing PATTERN_KNOWLEDGE unit
  
  refinement_types:
    EXTEND:
      when: new signals add statistical weight but don't change the pattern
      action: update usage count; increase confidence in existing KU
    
    SPECIALIZE:
      when: new signals show pattern applies more narrowly than stated
      action: create child KU with SPECIALIZES relationship; narrow applicability in parent
    
    GENERALIZE:
      when: new signals show pattern applies more broadly than stated
      action: update existing KU to broaden applicability
    
    CONTRADICT:
      when: new signals show pattern does NOT hold in specific context
      action: add counter_example to existing KU; or add CONTRADICTS relationship
    
    SUPERSEDE:
      when: new signals show a meaningfully updated version of the pattern
      action: create new KU with SUPERSEDES relationship; deprecate old
  
  feedback_integration:
    applied_positively: confidence boost to associated cluster
    applied_negatively: investigate — add to counter_signals; may trigger CONTRADICT
    retrieved_not_applied: mild negative signal on applicability dimension
```

---

## Engine Configuration

```yaml
engine_configuration:
  run_schedule:
    incremental: every 6 hours (process new signals since last run)
    full_scan: weekly (re-evaluate all clusters from full history)
  
  data_lookback:
    default: 90 days
    failure_patterns: 180 days (failures are rarer; need longer window)
    cross_domain_patterns: 365 days (slow-moving signals)
  
  output_rate_controls:
    max_new_pattern_drafts_per_day: 20
    max_pattern_updates_per_day: 50
    backpressure: if knowledge_base ingestion queue > 100, pause new drafts
  
  performance_targets:
    incremental_run: < 5 minutes
    full_scan: < 2 hours
    candidate_generation: < 30s per cluster
```

---

## Integration Points

| System | Role |
|---|---|
| `process-governance/execution-lineage-tracker.md` | Workflow execution signals |
| `knowledge-capture/decision-knowledge-capture.md` | Decision signals |
| `knowledge-capture/incident-lessons-learned.md` | Incident signals |
| `knowledge-base/knowledge-repository.md` | Existing KU corpus for novelty check |
| `knowledge-base/knowledge-model.md` | PATTERN_KNOWLEDGE type schema |
| `knowledge-synthesis/organizational-learning-engine.md` | Feeds patterns into org learning |
| `approval-operations/approval-analytics.md` | Decision pattern signals |
