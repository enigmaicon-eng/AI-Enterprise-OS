# Agent Capability Development

## Purpose
Defines how agents grow their capabilities over time — from NOVICE to EXPERT, through structured learning paths, targeted practice, mentorship, and feedback integration. Development is not passive; it requires deliberate investment in specific capability gaps. This system makes capability development systematic, measurable, and governed.

---

## Development Model

```yaml
development_model:
  principles:
    deliberate_practice: improvement comes from targeted practice with feedback, not just experience
    progressive_complexity: advance from basic to advanced challenges as proficiency grows
    spaced_repetition: revisit capabilities periodically to prevent decay
    social_learning: learn from peers and mentors, not just task execution
    metacognitive_awareness: agents must know what they don't know
  
  development_types:
    SKILL_ACQUISITION:     learning a net-new skill not in current profile
    PROFICIENCY_UPGRADE:   improving a known skill from NOVICE→CAPABLE or CAPABLE→PROFICIENT
    MASTERY_DEVELOPMENT:   advancing to EXPERT through deep practice and peer teaching
    REMEDIATION:           recovering a declining or degraded capability
    CERTIFICATION_PREP:    structured preparation for a formal capability certification
```

---

## Development Plan Schema

```yaml
development_plan:
  plan_id: "DP-uuid"
  agent_id: string
  created_at: ISO-8601
  created_by: agent-id | human-id   # can be self-initiated or supervisor-assigned
  plan_type: [see development_types]
  
  target_capability: capability_id
  current_level: NONE | NOVICE | CAPABLE | PROFICIENT | EXPERT
  target_level: NOVICE | CAPABLE | PROFICIENT | EXPERT
  target_date: ISO-8601
  
  development_activities: [
    {
      activity_id: string
      activity_type: BENCHMARK_PRACTICE | TASK_ASSIGNMENT | MENTORSHIP | STUDY | PEER_TEACHING | SIMULATION
      description: string
      estimated_effort_hours: float
      due_by: ISO-8601
      prerequisite_activities: [activity_id]
      
      completion_criteria:
        quantitative: string        # e.g., "benchmark score >= 0.80"
        qualitative: string         # e.g., "mentor confirms independent operation"
      
      status: NOT_STARTED | IN_PROGRESS | COMPLETE | SKIPPED
      completed_at: ISO-8601 | null
      completion_evidence: ref | null
    }
  ]
  
  checkpoints: [
    {
      checkpoint_id: string
      at_date: ISO-8601
      expected_level: string
      assessment_method: string
      actual_level: string | null
      status: PENDING | PASSED | FAILED | DEFERRED
    }
  ]
  
  mentor_assigned: agent-id | null    # PROFICIENT+ agent assigned to support
  status: ACTIVE | PAUSED | COMPLETE | ABANDONED
  completion_assessment: string | null
```

---

## Development Activity Types

```yaml
activity_types:
  BENCHMARK_PRACTICE:
    description: Repeated benchmark attempts with feedback between attempts
    frequency: weekly (not daily — spaced repetition)
    feedback_provided: per-attempt diagnostic on which sub-skills need improvement
    escalation: if no improvement after 3 attempts → escalate to MENTORSHIP
  
  TASK_ASSIGNMENT:
    description: Real or simulated task designed to exercise the target capability
    design_principles:
      - start at current_level difficulty
      - progressively increase to target_level difficulty
      - include feedback loop (reviewer scores the task)
    task_tagging: tasks must be tagged with target capability for tracking
  
  MENTORSHIP:
    description: Paired development with a PROFICIENT+ mentor
    mentor_responsibilities:
      - review mentee's task outputs weekly
      - provide specific, actionable feedback
      - demonstrate capability in live session (monthly)
      - escalate if mentee is not progressing
    mentee_responsibilities:
      - complete assigned tasks before each review session
      - maintain a learning journal (what I learned, what I tried)
      - apply feedback in subsequent work
    session_frequency: 2× per month for active development; 1× per month for maintenance
  
  STUDY:
    description: Consumption of knowledge units relevant to the capability
    process:
      1. recommendation-engine surfaces KUs for the target capability
      2. agent reviews EXEMPLARY and HIGH quality KUs in the domain
      3. agent completes reflection exercise (structured questions about KU content)
    study_load: max 3 hours/week of structured study (beyond this, returns diminish)
  
  PEER_TEACHING:
    description: Agent explains a concept to a lower-proficiency peer
    rationale: explaining forces synthesis and reveals gaps
    requirement: only assigned once agent reaches CAPABLE level in the target capability
    benefit: accelerates progress from CAPABLE to PROFICIENT
  
  SIMULATION:
    description: High-fidelity simulated scenario for GOVERNANCE and CRITICAL capabilities
    use_for: constitutional_evaluation, override_assessment, incident_response
    frequency: quarterly for agents with these capabilities
    scenario_types: [novel situation, edge case, adversarial input, cascade failure]
```

---

## Learning Path Catalog

```yaml
learning_path_catalog:
  GOVERNANCE_SPECIALIST_PATH:
    description: Development path for agents seeking GOVERNANCE specialization
    target_capabilities:
      - constitutional_evaluation → PROFICIENT
      - policy_interpretation → PROFICIENT
      - risk_assessment → EXPERT
      - escalation_judgment → PROFICIENT
      - override_assessment → CAPABLE
    estimated_duration: 6 months
    gate_assessments:
      - at_3_months: all targets at CAPABLE minimum
      - at_6_months: all targets at PROFICIENT minimum
    certification: GOVERNANCE_SPECIALIST (formal)
  
  ORCHESTRATION_MASTER_PATH:
    description: Development path for senior orchestration agents
    target_capabilities:
      - multi_agent_orchestration → EXPERT
      - strategic_planning → PROFICIENT
      - workflow_execution → EXPERT
      - conflict_resolution → PROFICIENT
    estimated_duration: 9 months
    prerequisite: CAPABLE in all targets before starting
  
  RESEARCH_AUTHORITY_PATH:
    description: Path to research AUTHORITY designation
    target_capabilities:
      - research_expertise → EXPERT
      - synthesis_and_integration → EXPERT
      - critical_analysis → PROFICIENT
      - causal_reasoning → PROFICIENT
    estimated_duration: 12 months
    certification: RESEARCH_AUTHORITY (formal; reviewed by knowledge-governance-lead)
```

---

## Development Governance

```yaml
development_governance:
  plan_authorization:
    self_initiated: allowed; agent creates plan for NOVICE→CAPABLE development
    supervisor_assigned: supervisor can assign remediation or upgrade plans
    requires_approval: plans targeting EXPERT level require Tier-3+ approval
    certification_prep: must be approved by capability governance lead
  
  mentor_qualification:
    to_be_mentor: must be PROFICIENT+ in the mentored capability
    to_mentor_for_EXPERT: must be EXPERT + human-evaluated
    mentorship_load: max 3 concurrent mentees per mentor
    compensation: mentorship counts toward mentor's INTERPERSONAL capabilities (peer_teaching)
  
  development_progress_governance:
    stalled_plan: no activity progress for 30 days → notify supervisor
    at_risk_plan: two consecutive missed checkpoints → escalate to capability governance lead
    abandoned_plan: agent explicitly abandons → record reason; supervisor review required
  
  performance_guarantee:
    if_remediation_plan_fails:
      first_failure: extend plan 60 days with intensified mentorship
      second_failure: capability governance lead reviews; possible role change or restrictions
```

---

## Development Analytics

```yaml
development_analytics:
  plan_completion_rate: completed / started plans (target: >= 0.75)
  avg_time_to_proficiency: by capability; compared to estimated_duration
  mentor_effectiveness: mentees' improvement rate by mentor
  benchmark_progression: improvement rate per benchmark attempt
  learning_path_completion: agents who complete full paths vs. stall midway
  
  insights_generated:
    - Which capabilities are hardest to develop? (low completion + high stall)
    - Which mentors are most effective? (mentees improve fastest)
    - Which activity types predict success? (correlation with proficiency gain)
    - Are development timelines realistic? (actual vs. estimated duration)
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-capabilities/agent-capability-assessment.md` | Assessment gates in development plans |
| `agent-capabilities/agent-capability-model.md` | Capability taxonomy and proficiency levels |
| `agent-learning/agent-skill-acquisition.md` | Learning mechanics for skill building |
| `knowledge-retrieval/knowledge-recommendation-engine.md` | Knowledge study recommendations |
| `agent-performance/agent-performance-coach.md` | Identifies development needs from performance |
| `knowledge-governance/knowledge-ownership-system.md` | Expert agents as mentors |
