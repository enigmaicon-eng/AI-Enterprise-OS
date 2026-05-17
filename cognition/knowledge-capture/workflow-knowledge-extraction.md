# Workflow Knowledge Extraction

## Purpose
Automatically extracts reusable knowledge from completed workflow executions. As workflows run, they produce execution traces, decision outcomes, timing data, and artifacts — all of which contain organizational intelligence. This system mines that intelligence and converts it into structured Knowledge Units without requiring human authorship.

---

## Extraction Architecture

```
Workflow Execution Complete
        ↓
[1. Eligibility Filter]        → is this execution worth extracting from?
[2. Signal Extraction]         → pull patterns, decisions, timing, errors from lineage
[3. Pattern Matching]          → match against known knowledge templates
[4. KU Drafting]               → draft Knowledge Units from matched signals
[5. Duplicate Screening]       → check against existing repository
[6. Confidence Assessment]     → score reliability of extracted knowledge
[7. Auto-Publish or Queue]     → publish if high-confidence; queue for review if uncertain
```

---

## Eligibility Filters

```yaml
eligibility_filters:
  must_pass_all:
    - status: COMPLETED or FAILED (not IN_PROGRESS or CANCELLED)
    - lineage_available: execution-lineage-tracker data exists for instance
    - duration: >= 2 minutes (trivial executions rarely yield knowledge)
    - node_count: >= 3 nodes executed (simple single-step outputs excluded)
  
  enhanced_eligibility_bonus:
    - has_human_review_decision: +1 priority signal (human judgment captured)
    - has_exception_or_error: +2 priority signal (failures are high-value)
    - execution_time_deviation: > 2σ from mean → +1 priority signal (anomaly)
    - novel_path: path_taken not seen in prior 50 executions → +2 priority signal
  
  extraction_frequency_control:
    identical_path_executions: extract every 10th (avoid redundancy)
    novel_path_executions: extract every time
    failed_executions: extract every time
```

---

## Signal Extraction

```yaml
signal_extraction:
  timing_signals:
    bottleneck_detection:
      method: identify nodes where elapsed_time > 2× median for that node type
      captures: PROCESS_KNOWLEDGE about slow steps
    
    path_duration_profile:
      method: compare actual vs. expected durations for all paths taken
      captures: DOMAIN_KNOWLEDGE about realistic process timing
  
  decision_signals:
    at_every_governance_gate:
      captures: {decision, rationale, approver_tier, context, outcome}
      maps_to: DECISION_KNOWLEDGE unit
    
    at_every_routing_branch:
      captures: {branch_taken, branch_criteria, context_at_branch}
      maps_to: DECISION_KNOWLEDGE or PROCESS_KNOWLEDGE unit
  
  error_signals:
    at_every_exception:
      captures: {error_type, node, context, resolution, outcome}
      maps_to: INCIDENT_KNOWLEDGE or PROCESS_KNOWLEDGE unit
    
    retry_pattern:
      captures: {retry_count, retry_trigger, eventual_outcome}
      maps_to: PATTERN_KNOWLEDGE (retry behavior)
  
  collaboration_signals:
    human_ai_handoffs:
      captures: {trigger, context, AI_recommendation, human_decision, divergence}
      maps_to: DECISION_KNOWLEDGE or PATTERN_KNOWLEDGE
    
    reviewer_annotations:
      captures: {reviewer, annotation_text, decision}
      maps_to: DOMAIN_KNOWLEDGE or CONTEXT_KNOWLEDGE
  
  artifact_signals:
    artifact_quality_outcomes:
      captures: {artifact_type, producer, quality_score, downstream_acceptance}
      maps_to: PROCESS_KNOWLEDGE about artifact production quality
```

---

## Knowledge Templates

Templates map signal patterns to Knowledge Unit structure:

```yaml
knowledge_templates:
  TEMPLATE-WE-001:
    name: Workflow Step Bottleneck
    trigger: timing_signal.bottleneck_detected
    maps_to_type: PROCESS_KNOWLEDGE
    fields:
      title: "Bottleneck Pattern: {workflow_id} at {node_id}"
      body_template: |
        ## Observation
        Node `{node_id}` in workflow `{workflow_id}` consistently takes
        {actual_duration} vs. expected {expected_duration} (p50: {p50}).
        
        ## Contributing Factors
        {extracted_factors}
        
        ## Recommended Action
        {mitigation_suggestion}
      structured_data:
        node_id: "{node_id}"
        workflow_id: "{workflow_id}"
        observed_duration_p50: "{p50}"
        observed_duration_p95: "{p95}"
        expected_duration: "{expected_duration}"
        deviation_factor: "{actual/expected}"
  
  TEMPLATE-WE-002:
    name: Decision Pattern Capture
    trigger: decision_signal.governance_gate
    maps_to_type: DECISION_KNOWLEDGE
    fields:
      title: "Decision Pattern: {decision_type} in {workflow_id}"
      body_template: |
        ## Decision Context
        {context_summary}
        
        ## Decision Made
        {decision} (by {approver_tier})
        
        ## Rationale
        {rationale}
        
        ## Outcome
        {outcome_summary}
      structured_data:
        decision_type: "{decision_type}"
        approver_tier: "{tier}"
        approval_rate_historical: "{rate}"
        common_conditions: []
  
  TEMPLATE-WE-003:
    name: Error Recovery Pattern
    trigger: error_signal.exception + resolution_exists
    maps_to_type: INCIDENT_KNOWLEDGE
    fields:
      title: "Error Pattern: {error_type} in {workflow_id}"
      body_template: |
        ## Failure Description
        {error_description}
        
        ## Context at Failure
        {context_at_error}
        
        ## Resolution Applied
        {resolution_steps}
        
        ## Outcome
        {outcome}
      structured_data:
        error_type: "{error_type}"
        detection_signals: []
        remediation_steps: []
        recurrence_rate: null
  
  TEMPLATE-WE-004:
    name: Novel Workflow Path
    trigger: eligibility.novel_path = true
    maps_to_type: PROCESS_KNOWLEDGE
    fields:
      title: "Novel Path: {workflow_id} via {path_signature}"
      body_template: |
        ## Path Description
        A previously-unseen execution path through `{workflow_id}` was observed.
        
        ## Path Taken
        {node_sequence}
        
        ## Triggering Conditions
        {entry_conditions}
        
        ## Outcome
        {path_outcome}
```

---

## Confidence Assessment

```yaml
confidence_assessment:
  base_confidence: 0.60 (default for single-observation extraction)
  
  upward_modifiers:
    pattern_observed_in_N_prior_executions:
      N >= 3:  +0.10
      N >= 10: +0.15
      N >= 25: +0.20
    human_reviewer_confirmed: +0.20
    outcome_was_positive: +0.10
    decision_rationale_present: +0.05
  
  downward_modifiers:
    single_observation_only: -0.10
    error_recovery_uncertain_cause: -0.15
    extraction_from_failed_execution: -0.05
    novel_path_no_prior_context: -0.10
  
  evidence_strength_mapping:
    final_confidence >= 0.90: VALIDATED
    final_confidence >= 0.75: OBSERVED
    final_confidence >= 0.60: ANECDOTAL
    final_confidence < 0.60:  ANECDOTAL (route to REVIEW; do not auto-publish)
  
  auto_publish_threshold: confidence >= 0.80 AND no_duplicate_detected
  review_required_threshold: confidence < 0.80 OR potential_duplicate_found
```

---

## Extraction Pipeline Controls

```yaml
pipeline_controls:
  rate_limiting:
    max_extractions_per_workflow_per_day: 5
    max_draft_ku_queue_depth: 200
    backpressure: if queue_depth > 150, reduce extraction rate by 50%
  
  deduplication_before_draft:
    check_against: all ACTIVE + REVIEW units in same domain
    method: semantic similarity (embedding cosine > 0.88)
    on_near_duplicate: merge signals into existing unit's update queue (not new draft)
  
  extraction_audit:
    every_extraction_logged:
      workflow_instance_id: string
      template_used: string
      ku_draft_id: string | null
      outcome: DRAFTED | DUPLICATE_MERGED | BELOW_THRESHOLD | RATE_LIMITED
    retention: 1 year
  
  feedback_loop:
    if_extracted_ku_is_rejected_at_review:
      record: {workflow_id, template, rejection_reason}
      use: improve template calibration
    if_extracted_ku_accumulates_negative_outcomes:
      record: {ku_id, outcome_data}
      use: lower confidence multipliers for that template
```

---

## Integration Points

| System | Role |
|---|---|
| `process-governance/execution-lineage-tracker.md` | Source of execution traces |
| `knowledge-base/knowledge-model.md` | Target KU schema |
| `knowledge-base/knowledge-repository.md` | Draft KU storage |
| `knowledge-base/knowledge-quality-system.md` | Initial quality scoring |
| `knowledge-base/knowledge-lifecycle.md` | Draft → Review transition |
| `enterprise-telemetry/enterprise-event-bus.md` | Workflow completion event trigger |
