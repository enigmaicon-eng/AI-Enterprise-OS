# Agent Capability Assessment

## Purpose
Defines the system for evaluating agent capabilities — how proficiency levels are measured, how assessments are triggered, and how results feed into capability profiles. Accurate capability assessment is the foundation of trust: it determines which agents can be given which tasks, and at what level of autonomy.

---

## Assessment Architecture

```
Assessment Trigger
    ↓
[1. Assessment Scoping]     → which capabilities to assess?
[2. Evidence Collection]    → gather performance signals and benchmark results
[3. Proficiency Scoring]    → assign proficiency level based on evidence
[4. Confidence Estimation]  → how confident are we in this assessment?
[5. Profile Update]         → update agent_capability_profile
[6. Consequence Dispatch]   → trigger tier changes, development plans, alerts
```

---

## Assessment Triggers

```yaml
assessment_triggers:
  SCHEDULED:
    frequency_by_proficiency:
      NOVICE:     monthly (developing rapidly; need frequent assessment)
      CAPABLE:    quarterly
      PROFICIENT: semi-annually
      EXPERT:     annually
    scope: all capabilities with status != NONE
  
  TASK_COMPLETION:
    trigger: any task completion with quality_score or outcome_assessment available
    scope: capabilities exercised during the task
    method: TASK_OUTCOME assessment (lightweight; no separate assessment session)
    latency: processed within 5 minutes of task completion signal
  
  PERFORMANCE_ANOMALY:
    trigger: agent's skill success_rate drops > 20% below their 90-day average
    scope: capabilities related to the degraded skills
    priority: HIGH (potential capability regression)
  
  TIER_PROMOTION_REQUEST:
    trigger: agent requests or is nominated for tier promotion
    scope: all capabilities required for the target tier
    method: COMPREHENSIVE (uses all assessment methods)
    required_outcome: all tier-required capabilities at minimum proficiency
  
  POST_INCIDENT:
    trigger: agent implicated in incident (as responder or as cause)
    scope: capabilities relevant to the incident domain
    method: HUMAN_EVALUATION + TASK_OUTCOME review
  
  NEW_SKILL_GRANT:
    trigger: agent granted a new skill requiring capability demonstration
    scope: the capability the skill implements
    timeline: assess within 30 days of grant
  
  CAPABILITY_VERSION_CHANGE:
    trigger: a capability definition is updated (new version)
    scope: all agents with this capability in their profile
    scope_reduction: agents with EXPERT level may have expedited re-assessment
```

---

## Assessment Methods

```yaml
assessment_methods:
  BENCHMARK:
    description: Standardized test tasks with known correct outputs
    format: structured task set (10–30 tasks per capability)
    scoring:
      pass_rate: tasks completed correctly / total tasks
      proficiency_mapping:
        >= 0.90: EXPERT
        >= 0.75: PROFICIENT
        >= 0.55: CAPABLE
        >= 0.30: NOVICE
        < 0.30:  NONE
    validity: benchmark must be reviewed and updated annually
    
    benchmark_task_schema:
      task_id: string
      capability_id: string
      difficulty: BASIC | INTERMEDIATE | ADVANCED | EXPERT
      input: {}
      expected_output: {}
      acceptable_variance: {}   # how much deviation is still considered correct
      scoring_rubric: string
  
  TASK_OUTCOME_ANALYSIS:
    description: Infer proficiency from real task performance history
    method:
      1. filter tasks where target capability was exercised (via task capability tags)
      2. compute success_rate, quality_score_avg, complexity_distribution
      3. map to proficiency level using proficiency inference table
    
    proficiency_inference_table:
      {success_rate: >= 0.90, complexity: ADVANCED}:   EXPERT
      {success_rate: >= 0.80, complexity: INTERMEDIATE}: PROFICIENT
      {success_rate: >= 0.65, complexity: STANDARD}:   CAPABLE
      {success_rate: >= 0.40}:                         NOVICE
    
    minimum_task_count: 10 (insufficient data below this; confidence is low)
  
  HUMAN_EVALUATION:
    description: Expert human directly evaluates the agent's capability
    process:
      1. evaluator assigned (human with EXPERT-equivalent in the capability)
      2. agent performs 2–3 live tasks in evaluator's presence
      3. evaluator scores using structured rubric
      4. assessment written up and signed
    weight: VERY_HIGH (human evaluations have authority over algorithmic assessments)
    require_for: all EXPERT level certifications; all GOVERNANCE capability assessments
  
  PEER_REVIEW:
    description: Peer agent with higher proficiency evaluates the agent's work
    process:
      1. select peer agent with >= PROFICIENT in capability (and higher tier if needed)
      2. peer reviews recent artifacts and task outputs tagged to the capability
      3. peer submits structured rating
    weight: MEDIUM
    conflict: if peer_review and task_outcome_analysis disagree by > 1 level → escalate to HUMAN_EVALUATION
```

---

## Proficiency Scoring Algorithm

```yaml
proficiency_scoring:
  input: [evidence_items with type, result, weight, age_days]
  
  evidence_weighting:
    HUMAN_EVALUATION:     weight 5.0; decay half-life = 365 days
    BENCHMARK:            weight 3.0; decay half-life = 180 days
    PEER_REVIEW:          weight 2.5; decay half-life = 180 days
    TASK_OUTCOME:         weight 1.0 per task; decay half-life = 90 days
  
  time_decay:
    weight_effective = weight × exp(-0.693 × age_days / half_life)
    rationale: recent evidence is more predictive than old evidence
  
  weighted_score:
    compute: Σ(evidence_effective_weight × evidence_score) / Σ(evidence_effective_weight)
    evidence_score: normalized proficiency_level to 0.0–1.0
      NONE: 0.0, NOVICE: 0.25, CAPABLE: 0.50, PROFICIENT: 0.75, EXPERT: 1.0
  
  level_assignment:
    >= 0.88: EXPERT
    >= 0.63: PROFICIENT
    >= 0.38: CAPABLE
    >= 0.13: NOVICE
    < 0.13:  NONE
  
  confidence_scoring:
    base: total effective weight as proxy for evidence quantity
    low_confidence: < 3.0 total effective weight → flag as PROVISIONAL
    high_confidence: >= 10.0 total effective weight
    
    also_penalize:
      high_variance_across_evidence: if std_dev of evidence scores > 0.30 → reduce confidence
```

---

## Assessment Governance

```yaml
assessment_governance:
  who_can_assess:
    TASK_OUTCOME: automated (no human required)
    BENCHMARK: automated + automated quality check
    PEER_REVIEW: peer agent with capability_level >= target_level + 1
    HUMAN_EVALUATION: qualified human with Tier-3+ or domain expert status
  
  assessment_challenges:
    who_can_challenge: assessed agent or their tier supervisor
    process:
      1. challenge filed within 14 days of assessment
      2. independent assessor assigned (not involved in original assessment)
      3. re-assessment using BENCHMARK + HUMAN_EVALUATION methods
      4. challenge resolution binding (final)
    outcome: higher of original or re-assessment result is used
  
  downgrade_governance:
    proficiency_downgrade: can occur if performance evidence shows sustained decline
    notification: agent and their supervisor notified 7 days before downgrade effective
    appeal: agent may request bridge period (max 30 days) with development plan to avoid downgrade
  
  assessment_tampering_detection:
    audit_trail: all assessments hash-chained
    anomaly_alerts: if assessment result deviates > 2 levels from prior in one cycle → flag for review
    peer_collusion: if same peer reviewer gives EXPERT ratings to > 80% of agents reviewed → investigate
```

---

## Assessment Reporting

```yaml
assessment_reporting:
  per_agent_report:
    frequency: at each assessment cycle completion
    content: full capability profile with trends; assessment history; development recommendations
    recipient: agent + tier supervisor
  
  portfolio_assessment_report:
    frequency: quarterly
    content: capability distribution across all agents; gaps by domain; assessment health
    recipient: capability governance lead
  
  alerts:
    PROFICIENCY_REGRESSION: any PROFICIENT or EXPERT level drops → immediate alert to supervisor
    ASSESSMENT_OVERDUE: agent not assessed within 2× scheduled frequency → alert
    HIGH_VARIANCE_ASSESSMENT: contradiction between assessment methods → flag for human review
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-capabilities/agent-capability-model.md` | Capability schema; proficiency levels |
| `agent-capabilities/agent-skill-registry.md` | Skill execution feeds assessment evidence |
| `agent-capabilities/agent-capability-development.md` | Assessment results drive development plans |
| `agent-performance/agent-performance-tracker.md` | Task outcome evidence source |
| `agent-learning/agent-skill-acquisition.md` | Learning outcomes trigger re-assessment |
| `human-review/review-assignment-engine.md` | Assessment levels constrain assignment |
