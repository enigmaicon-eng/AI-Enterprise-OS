# Agent Skill Registry

## Purpose
The authoritative catalog of all skills available in the enterprise agent ecosystem. Skills are concrete, executable behaviors that implement capabilities — the implementation layer beneath the capability model. The registry enables agents to discover available skills, operators to audit what the enterprise can do, and governance to control which skills are active.

---

## Skills vs. Capabilities

```yaml
distinction:
  capability: "What an agent can do" — an abstract ability or proficiency
  skill: "How an agent does it" — a concrete, executable behavior with defined inputs/outputs
  
  relationship:
    capability → implemented_by → one or more skills
    skill → demonstrates → one or more capabilities
  
  example:
    capability: policy_interpretation (COGNITIVE.governance_expertise)
    implementing_skills:
      - SKILL-GOV-001: policy_lookup_and_cite
      - SKILL-GOV-002: exception_precedent_search
      - SKILL-GOV-003: constitutional_pre_check
      - SKILL-GOV-004: policy_conflict_detection
```

---

## Skill Schema

```yaml
skill:
  # Identity
  skill_id: "SKILL-{domain}-{seq}"     # e.g., SKILL-GOV-001
  name: string                          # concise action name
  slug: "verb-noun-skill"
  version: semantic_version
  
  # Classification
  category: skill_category              # see skill categories below
  domain: [enterprise_domain]           # relevant knowledge domains
  implements_capabilities: [CAP-id]    # which capabilities this skill contributes to
  
  # Specification
  inputs:
    required: [{name, type, description, validation}]
    optional: [{name, type, description, default}]
  
  outputs:
    primary: {name, type, description}
    secondary: [{name, type, description}]
    error_outputs: [{code, description, recovery_guidance}]
  
  # Behavior
  behavior_spec:
    description: string                 # what the skill does step by step
    decision_points: [string]           # key branching decisions within the skill
    side_effects: [string]              # what the skill changes in the environment
    idempotent: boolean                 # safe to retry?
    reversible: boolean                 # can effects be undone?
    max_duration: duration              # hard timeout
  
  # Quality
  quality_indicators:
    success_criteria: [string]          # what counts as successful skill execution
    failure_modes: [{mode, description, detection}]
    quality_signals: [string]           # observable signals of good execution
  
  # Governance
  governance:
    tier_required: int                  # minimum tier to execute this skill autonomously
    requires_authorization: boolean     # must be explicitly granted per agent
    audit_level: STANDARD | ENHANCED    # ENHANCED for high-impact skills
    rate_limit: {per_hour: int, per_day: int} | null
    prohibited_contexts: [string]       # contexts where this skill must not be used
  
  # Lifecycle
  lifecycle:
    status: DRAFT | ACTIVE | DEPRECATED | EXPERIMENTAL
    introduced_version: string          # OS version when added
    deprecation_plan: string | null
    successor_skill: skill_id | null
    
  # Metrics
  metrics:
    execution_count: int
    success_rate: float
    avg_duration_ms: int
    error_rate_by_mode: {[mode]: float}
```

---

## Skill Categories

```yaml
skill_categories:
  RETRIEVAL:
    description: Finding and fetching information
    examples: [search_knowledge_base, retrieve_workflow_history, lookup_policy, get_agent_profile]
    typical_governance: tier_required = 1 (low; reading is generally safe)
  
  ANALYSIS:
    description: Processing and interpreting information
    examples: [analyze_workflow_trace, evaluate_decision_quality, assess_risk, detect_anomaly]
    typical_governance: tier_required = 1–2
  
  GENERATION:
    description: Creating artifacts, documents, or structured outputs
    examples: [draft_knowledge_unit, generate_report, create_workflow_spec, write_postmortem]
    typical_governance: tier_required = 1–2; audit level varies
  
  EVALUATION:
    description: Assessing quality, correctness, or compliance
    examples: [evaluate_constitutional_compliance, assess_quality_score, validate_artifact, score_rationale]
    typical_governance: tier_required = 2–3 (evaluation has governance implications)
  
  ORCHESTRATION:
    description: Directing other agents or workflows
    examples: [delegate_task, spawn_sub_workflow, route_to_agent, coordinate_parallel_agents]
    typical_governance: tier_required = 2–3; delegation_depth tracked
  
  MODIFICATION:
    description: Changing state in enterprise systems
    examples: [update_knowledge_unit, deprecate_artifact, change_workflow_status, escalate_item]
    typical_governance: tier_required = 2–4; always audited
  
  GOVERNANCE:
    description: Making or recommending governance decisions
    examples: [recommend_approval, evaluate_exception, assess_override, constitutional_check]
    typical_governance: tier_required = 3–5; ENHANCED audit; AI-only recommendations
  
  COMMUNICATION:
    description: Sending signals, notifications, reports to humans or systems
    examples: [notify_owner, send_alert, publish_briefing, emit_telemetry_event]
    typical_governance: tier_required = 1–3; rate-limited
```

---

## Skill Catalog (Core Skills)

```yaml
core_skill_catalog:
  # RETRIEVAL SKILLS
  SKILL-RET-001:
    name: search_knowledge_base
    inputs: [query_text, domain_filter, quality_floor]
    outputs: [ranked_ku_list]
    implements_capabilities: [CAP-domain-knowledge, CAP-research-expertise]
    tier_required: 1
    status: ACTIVE
  
  SKILL-RET-002:
    name: retrieve_precedents
    inputs: [decision_context, domain, top_k]
    outputs: [precedent_list with similarity scores]
    implements_capabilities: [CAP-policy-interpretation, CAP-governance-expertise]
    tier_required: 1
    status: ACTIVE
  
  SKILL-RET-003:
    name: get_execution_lineage
    inputs: [workflow_instance_id, depth]
    outputs: [lineage_graph]
    implements_capabilities: [CAP-workflow-execution, CAP-causal-reasoning]
    tier_required: 2
    status: ACTIVE
  
  # ANALYSIS SKILLS
  SKILL-ANL-001:
    name: constitutional_pre_check
    inputs: [action_description, context]
    outputs: [constitutional_evaluation: PASS | CONDITIONAL | FAIL, reasoning, confidence]
    implements_capabilities: [CAP-constitutional-evaluation, CAP-ethical-reasoning]
    tier_required: 2
    audit_level: ENHANCED
    status: ACTIVE
  
  SKILL-ANL-002:
    name: risk_assessment
    inputs: [action, context, affected_systems, reversibility]
    outputs: [risk_level, blast_radius, risk_factors, mitigation_options]
    implements_capabilities: [CAP-risk-assessment, CAP-probabilistic-reasoning]
    tier_required: 2
    status: ACTIVE
  
  SKILL-ANL-003:
    name: confidence_calibration_check
    inputs: [claimed_confidence, evidence, domain]
    outputs: [calibration_assessment, calibrated_confidence, calibration_gap]
    implements_capabilities: [CAP-probabilistic-reasoning, CAP-critical-analysis]
    tier_required: 2
    status: ACTIVE
  
  # EVALUATION SKILLS
  SKILL-EVL-001:
    name: evaluate_artifact_quality
    inputs: [artifact, quality_rubric, domain]
    outputs: [quality_scores, quality_tier, specific_improvements]
    implements_capabilities: [CAP-quality-assurance, CAP-critical-analysis]
    tier_required: 2
    status: ACTIVE
  
  SKILL-EVL-002:
    name: assess_decision_rationale
    inputs: [decision, rationale, context, alternatives_considered]
    outputs: [rationale_quality_score, gaps, improvement_suggestions]
    implements_capabilities: [CAP-governance-expertise, CAP-critical-analysis]
    tier_required: 3
    audit_level: ENHANCED
    status: ACTIVE
  
  # GOVERNANCE SKILLS
  SKILL-GOV-001:
    name: evaluate_override_request
    inputs: [override_type, justification, requesting_tier, context]
    outputs: [recommendation: APPROVE | DENY | ESCALATE, reasoning, conditions]
    implements_capabilities: [CAP-override-assessment, CAP-policy-interpretation]
    tier_required: 3
    audit_level: ENHANCED
    requires_authorization: true
    status: ACTIVE
  
  SKILL-GOV-002:
    name: policy_conflict_detection
    inputs: [proposed_action, active_policies, context]
    outputs: [conflicts: [{policy_id, conflict_type, severity}], resolution_options]
    implements_capabilities: [CAP-policy-interpretation, CAP-audit-and-compliance]
    tier_required: 2
    status: ACTIVE
```

---

## Skill Registry Operations

```yaml
registry_operations:
  register_skill:
    endpoint: skill-registry.register(skill: SkillSpec) → skill_id
    validation: schema validation + governance review for tier_required >= 3
    review_required: new GOVERNANCE category skills require Tier-4+ approval
  
  deprecate_skill:
    endpoint: skill-registry.deprecate(skill_id, reason, successor_skill_id) → void
    requires: Tier-3+
    migration_window: 90 days (agents using deprecated skill notified)
  
  get_agent_skills:
    endpoint: skill-registry.get_agent_skills(agent_id) → [skill_id]
    returns: all skills the agent is authorized to use
  
  grant_skill:
    endpoint: skill-registry.grant(agent_id, skill_id, granted_by) → void
    requires: granting agent must have tier >= skill.tier_required
  
  revoke_skill:
    endpoint: skill-registry.revoke(agent_id, skill_id, reason) → void
    requires: Tier-3+ or skill granting agent
```

---

## Skill Usage Analytics

```yaml
skill_analytics:
  tracked_per_skill:
    execution_count: cumulative
    success_rate: rolling 30-day
    avg_duration: rolling 30-day
    agent_distribution: which agents use this skill most
    error_rate_by_agent: surface agents with above-average error rates
  
  tracked_per_agent:
    skill_usage_frequency: {skill_id: count} this month
    skill_success_rate_by_skill: individual performance per skill
    underused_skills: skills granted but never used in 60 days (potential training need)
    skill_gaps: tasks failed due to missing skill (recommendation for skill development)
  
  reporting:
    weekly_usage_digest: to capability development team
    skill_performance_alerts: if any skill success_rate < 0.70 for 7 days → alert to skill owner
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-capabilities/agent-capability-model.md` | Skills implement capabilities |
| `agent-capabilities/agent-capability-assessment.md` | Skill execution → assessment evidence |
| `agent-capabilities/agent-capability-governance.md` | Skill grant/revoke authorization |
| `agent-learning/agent-skill-acquisition.md` | New skills acquired through learning |
| `agent-performance/agent-performance-tracker.md` | Skill execution tracking |
| `human-review/review-assignment-engine.md` | Skill matching for reviewer assignment |
