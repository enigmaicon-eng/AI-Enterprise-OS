# Agent Performance Coach

## Purpose
Provides targeted, actionable improvement guidance to underperforming or stagnating agents. The coach translates performance analytics into concrete development plans, delivers feedback in actionable form, tracks whether the agent incorporates coaching, and escalates when coaching alone is insufficient to achieve the needed improvement.

---

## Coaching Architecture

```
Performance Analytics Signal
    ↓
[1. Coaching Need Detection]   → is this agent a coaching candidate?
[2. Root Cause Diagnosis]      → what is driving the underperformance?
[3. Coaching Plan Generation]  → design targeted intervention
[4. Coaching Delivery]         → deliver feedback in usable form
[5. Integration Tracking]      → did the agent act on the coaching?
[6. Escalation Decision]       → is coaching sufficient, or is more needed?
```

---

## Coaching Triggers

```yaml
coaching_triggers:
  automatic:
    PERFORMANCE_SCORE_BELOW_THRESHOLD:
      condition: overall_performance_score_30d < 0.60 (DEVELOPING tier)
      priority: MEDIUM
      delay: trigger after 2 consecutive weekly scores below threshold
    
    DIMENSION_SPECIFIC_DECLINE:
      condition: any single dimension score_30d < 0.50 (while overall may be OK)
      priority: MEDIUM (targeted coaching; dimension-specific)
    
    CALIBRATION_BREACH:
      condition: calibration_error_30d > 0.20
      priority: HIGH (miscalibration is safety-relevant)
      delay: no delay; immediate coaching initiation
    
    FEEDBACK_NON_INTEGRATION:
      condition: feedback_integration_rate_30d < 0.30 (coaching not being used)
      priority: HIGH (coaching ineffectiveness; may indicate deeper issue)
    
    PEER_BENCHMARK_OUTLIER:
      condition: agent is at P10 or below in cohort for any dimension for 30+ days
      priority: MEDIUM
    
    ZERO_LEARNING:
      condition: no skill_growth in 90 days + no active development plan
      priority: LOW (stagnation alert; not urgent)
  
  human_initiated:
    supervisor_referral: supervisor manually flags agent for coaching
    agent_self_referral: agent requests coaching (supported and encouraged)
    post_incident_referral: incident investigation identifies coaching need
```

---

## Root Cause Diagnosis

```yaml
root_cause_diagnosis:
  diagnosis_framework:
    step_1_symptom_mapping:
      map underperformance_dimension to potential_root_causes:
        QUALITY_DECLINE:
          - capability_regression (recent benchmark shows lower proficiency)
          - domain_mismatch (agent assigned outside their domain expertise)
          - knowledge_gap (relevant KUs not being retrieved or applied)
          - feedback_loop_broken (quality signals not reaching agent)
        
        RELIABILITY_DECLINE:
          - workload_overload (task count > capacity)
          - dependency_failures (external systems causing failures)
          - skill_degradation (capability regression in operational skills)
          - sla_miscalibration (SLAs set too aggressively for task complexity)
        
        CALIBRATION_DETERIORATION:
          - domain_expansion (agent working in unfamiliar domains → overconfident)
          - feedback_starvation (insufficient outcome feedback to calibrate against)
          - systemic_overconfidence (agent type characteristic; needs structural fix)
        
        EFFICIENCY_DECLINE:
          - increasing_task_complexity (agent's workload getting harder)
          - decision_avoidance (excessive escalation)
          - knowledge_search_overhead (agent spending too long searching)
    
    step_2_evidence_collection:
      - task_complexity_distribution: is complexity increasing?
      - domain_distribution: is agent working outside their domains?
      - knowledge_retrieval_patterns: are they finding relevant knowledge?
      - dependency_failure_log: external causes?
    
    step_3_hypothesis_ranking:
      rank by: evidence strength × frequency × impact
      output: primary hypothesis + alternatives + confidence_per_hypothesis
```

---

## Coaching Plan Schema

```yaml
coaching_plan:
  plan_id: "CP-uuid"
  agent_id: string
  created_at: ISO-8601
  created_by: automated | supervisor | agent_self
  
  trigger: string                      # what triggered this coaching plan
  root_cause_hypothesis: string
  evidence_basis: [signal_ids]
  
  target_dimensions: [dimension]       # which performance dimensions to improve
  current_scores: {[dimension]: float}
  target_scores: {[dimension]: float}  # specific targets; not just "improve"
  target_date: ISO-8601
  
  coaching_interventions: [
    {
      intervention_id: string
      type: FEEDBACK_SESSION | SKILL_PRACTICE | KNOWLEDGE_STUDY | MENTORSHIP | WORKLOAD_ADJUSTMENT | BENCHMARK_PRACTICE
      description: string
      specific_focus: string           # what exactly to work on
      expected_impact: string          # mechanism by which this helps
      due_by: ISO-8601
      status: PENDING | ACTIVE | COMPLETE | SKIPPED
    }
  ]
  
  checkpoints: [
    {at_date: ISO-8601, expected_score: {[dimension]: float}, actual_score: {} | null}
  ]
  
  status: ACTIVE | PAUSED | RESOLVED | ESCALATED | ABANDONED
  resolution_date: ISO-8601 | null
  resolution_notes: string | null
```

---

## Feedback Delivery Standards

```yaml
feedback_delivery:
  feedback_principles:
    SPECIFIC: "Your constitutional evaluations in novel domains show calibration_error of 0.23"
              (not: "your calibration is bad")
    BEHAVIORAL: focus on what the agent does, not what they are
    ACTIONABLE: every feedback item paired with a concrete improvement action
    TIMELY: feedback delivered within 48 hours of the triggering event
    BALANCED: lead with strengths before addressing gaps
  
  feedback_item_schema:
    observation: string               # what was observed (data-backed)
    impact: string                    # why it matters for the agent's role
    specific_improvement: string      # exact behavior to change
    resource: [ku_id | skill_id | benchmark_id]  # what to study/practice
    example: string | null            # concrete example of the desired behavior
  
  delivery_formats:
    COACHING_SESSION:
      format: structured dialogue between coach (human or AI) and agent
      duration: 30–60 minutes
      outcome: signed coaching plan with agent's commitment
      frequency: 2× per month for DEVELOPING agents; monthly for ADEQUATE
    
    ASYNCHRONOUS_FEEDBACK:
      format: written feedback package delivered to agent's inbox
      content: observation + impact + improvement + resources + next check-in date
      use_when: coaching session not immediately needed; supplementing ongoing sessions
    
    MICRO_FEEDBACK:
      format: brief (< 5 sentence) inline feedback on specific task output
      delivered: immediately after task completion (within 2 hours)
      use_when: targeted feedback on a single behavior in a specific task
```

---

## Integration Tracking

```yaml
integration_tracking:
  tracks: did the agent change behavior after receiving coaching feedback?
  
  methods:
    BEHAVIORAL_MARKER_MONITORING:
      definition: monitor specific behaviors the coaching targeted
      example: "if coaching was about over-escalation, track escalation_rate for next 30 tasks"
      signal: FEEDBACK_APPLIED event from behavioral-adaptation.md
    
    BEFORE_AFTER_COMPARISON:
      definition: compare key metrics in 30-day window before vs. after coaching
      computation: automatic (performance tracker has historical data)
    
    BENCHMARK_DELTA:
      definition: run same benchmark before and after coaching; compare scores
      use_when: capability-specific coaching
  
  integration_outcomes:
    SUCCESSFULLY_INTEGRATED:
      signal: target behavior improved >= 50% of coaching expectation
      action: note in coaching plan; plan may close or transition to maintenance
    
    PARTIALLY_INTEGRATED:
      signal: improvement 20–50% of expectation
      action: continue plan with adjusted approach; check for obstacles
    
    NOT_INTEGRATED:
      signal: improvement < 20% of expectation after 30 days
      action: escalation review (is the coaching approach wrong? is there a deeper issue?)
```

---

## Escalation Decision Framework

```yaml
escalation_framework:
  escalation_triggers:
    COACHING_INEFFECTIVE:
      condition: two consecutive coaching plans closed as NOT_INTEGRATED
      action: human supervisor review + expanded intervention
    
    CRITICAL_DIMENSION_FAILURE:
      condition: CALIBRATION dimension < 0.30 sustained for 60 days
      action: temporary capability restriction + mandatory human coaching
    
    PERFORMANCE_WORSENING_UNDER_COACHING:
      condition: performance_score declining even with active coaching plan
      action: capability governance lead review; possible role re-evaluation
    
    SAFETY_RELEVANT_COACHING:
      condition: coaching triggered by safety_related_failure
      action: human Tier-4+ involvement required; AI coach cannot be sole intervention
  
  escalation_path:
    LEVEL_1: automated AI coach with supervisor notification
    LEVEL_2: human supervisor active involvement + coaching plan review
    LEVEL_3: capability governance lead engagement; formal performance plan
    LEVEL_4: role re-evaluation; capability restriction; possible agent decommission
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-performance/agent-performance-analytics.md` | Triggers and evidence for coaching plans |
| `agent-performance/agent-performance-tracker.md` | Real-time performance signals |
| `agent-capabilities/agent-capability-development.md` | Coaching may initiate development plan |
| `agent-learning/agent-feedback-integration.md` | Coaching delivers feedback to learning system |
| `agent-learning/agent-behavioral-adaptation.md` | Tracks behavior change post-coaching |
| `human-review/review-interface-standards.md` | Coaching session interface |
