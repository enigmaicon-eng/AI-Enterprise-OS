# Orchestration Strategy Engine

## Purpose
Determines the optimal orchestration strategy for any given task — selecting the right pattern, assembling the right team composition, setting governance parameters, and producing a ready-to-execute orchestration plan. The strategy engine is the intelligence layer that converts task requirements into actionable orchestration decisions, drawing from the pattern catalog, agent registry, and governance rules.

---

## Strategy Engine Architecture

```
Task Brief
        ↓
[1. Task Classification]         → categorize task on multiple dimensions
[2. Governance Level Assessment] → determine required governance controls
[3. Pattern Selection]           → choose from orchestration-pattern-catalog.md
[4. Agent Profile Requirements]  → specify who is needed for each pattern role
[5. Feasibility Check]           → validate agents are available for the plan
[6. Strategy Plan Construction]  → build the complete orchestration plan
[7. Plan Approval (if required)] → governance gate before execution
[8. Execution Handoff]           → pass plan to work-distribution-engine.md
```

---

## Task Classification

```yaml
task_classification:
  dimensions:
    complexity:
      BASIC: single-domain, well-defined, low risk, reversible
      STANDARD: 1-3 domains, moderate definition, medium risk
      COMPLEX: multi-domain, partially defined, high risk, significant impact
      EXPERT: cross-enterprise, novel, high-stakes, governance-critical
      
      signals:
        domain_count: how many distinct enterprise domains does this span?
        definition_completeness: is the expected output clearly specified?
        reversibility: can the output be easily corrected if wrong?
        blast_radius: how many agents/humans/systems does this affect?
    
    time_sensitivity:
      ROUTINE: no deadline pressure; optimize for quality
      TIME_SENSITIVE: deadline within 24 hours; optimize for speed + quality
      URGENT: deadline within 2 hours; optimize for speed
      EMERGENCY: deadline within 30 minutes; minimum viable quality gate only
    
    governance_level:
      STANDARD: routine tasks with low risk
      ENHANCED: governance decisions, policy changes, compliance-relevant
      CRITICAL: constitutional evaluation, override decisions, Tier-4+ sign-off required
    
    novelty:
      ESTABLISHED: well-traveled workflow; known agent types; established pattern
      ADAPTED: familiar pattern with modifications
      NOVEL: new task type with no clear precedent; dynamic team formation likely
    
    knowledge_intensity:
      LOW: task execution requires minimal knowledge retrieval
      MEDIUM: requires knowledge retrieval but agents likely have it
      HIGH: requires extensive knowledge synthesis from multiple domains
  
  classification_output:
    complexity: BASIC | STANDARD | COMPLEX | EXPERT
    time_sensitivity: ROUTINE | TIME_SENSITIVE | URGENT | EMERGENCY
    governance_level: STANDARD | ENHANCED | CRITICAL
    novelty: ESTABLISHED | ADAPTED | NOVEL
    knowledge_intensity: LOW | MEDIUM | HIGH
```

---

## Pattern Selection Logic

```yaml
pattern_selection_logic:
  rule_set:
    # Highest governance always wins
    if governance_level == CRITICAL:
      must_include: human review gate
      preferred_pattern: COMMAND_AND_CONTROL (PAT-ORCH-001) or CONSENSUS_DELIBERATION (PEER-001)
      if complex OR multi-domain: FEDERATED_HIERARCHY (PAT-ORCH-003) with human at apex
    
    # Emergency overrides quality optimization
    if time_sensitivity == EMERGENCY:
      pattern: SUPERVISED_EXECUTION (PAT-ORCH-002) or single_agent
      skip: consensus protocols (too slow), adversarial_review (too slow)
      activate: EMERGENCY discovery mode
    
    # Novel tasks need dynamic teams
    if novelty == NOVEL AND complexity IN [COMPLEX, EXPERT]:
      pattern: DYNAMIC_TEAM_FORMATION (PAT-ORCH-008)
    
    # High-stakes evaluation benefits from ensemble
    if (governance_level == ENHANCED OR CRITICAL) AND task_type == EVALUATION:
      pattern: ADVERSARIAL_REVIEW (PAT-ORCH-007) or PARALLEL_EVALUATION (PAT-ORCH-006)
    
    # Multi-domain established workflows → hierarchy
    if domain_count >= 3 AND novelty IN [ESTABLISHED, ADAPTED]:
      pattern: FEDERATED_HIERARCHY (PAT-ORCH-003)
    
    # Sequential transformation tasks → pipeline
    if task_has_clear_sequential_stages AND stage_dependencies_strict:
      pattern: LINEAR_PIPELINE (PAT-ORCH-005)
    
    # Standard decomposable tasks
    if complexity IN [STANDARD, COMPLEX] AND NOT novel:
      pattern: SUPERVISED_EXECUTION (PAT-ORCH-002)
    
    # Simple, low-governance, high-volume
    if complexity == BASIC AND governance_level == STANDARD AND volume > 10:
      pattern: STIGMERGIC_COORDINATION (PEER-004)
    
    # Default for unclear cases
    default: SUPERVISED_EXECUTION (PAT-ORCH-002) with enhanced monitoring
  
  pattern_combinations:
    patterns can be nested:
    example: FEDERATED_HIERARCHY with ADVERSARIAL_REVIEW at the apex layer
    example: DYNAMIC_TEAM_FORMATION using LINEAR_PIPELINE internally
    constraint: nesting depth <= 3 levels (beyond this → decompose into separate tasks)
```

---

## Agent Profile Requirements

```yaml
agent_profile_requirements:
  per_pattern_role_requirements:
    COMMAND_AND_CONTROL:
      coordinator: {capabilities: [multi_agent_orchestration, constitutional_evaluation], tier: >=3}
      workers: {capabilities: [task-specific], tier: >=1}
    
    SUPERVISED_EXECUTION:
      supervisor: {capabilities: [multi_agent_orchestration, task_decomposition], tier: >=2}
      workers: {capabilities: [task-specific], tier: >=1}
    
    FEDERATED_HIERARCHY:
      apex_coordinator: {capabilities: [multi_agent_orchestration, synthesis_and_integration], tier: >=3}
      domain_coordinators: {capabilities: [domain-specific + multi_agent_orchestration], tier: >=2}
      workers: {capabilities: [task-specific], tier: >=1}
    
    CONSENSUS_DELIBERATION:
      all_participants: {capabilities: [task-specific], tier: >=2, count: 3-9}
    
    ADVERSARIAL_REVIEW:
      producer: {capabilities: [task-specific]}
      challenger: {capabilities: [critical_analysis, risk_assessment], tier: >= producer.tier}
      arbiter: {capabilities: [task-specific + critical_analysis], tier: >= max(producer, challenger)}
    
    DYNAMIC_TEAM_FORMATION:
      team_lead: {capabilities: [multi_agent_orchestration], tier: >=2}
      specialists: {capabilities: [per role_definition]}
  
  discovery_queries:
    action: translate role requirements into agent-discovery-engine queries
    mode: per time_sensitivity (ROUTINE → PRECISE; URGENT → EMERGENCY)
    fallback: if primary discovery returns no candidates → relax tier by 1 → retry → escalate
```

---

## Feasibility Check

```yaml
feasibility_check:
  checks:
    AGENT_AVAILABILITY: all required roles have at least 1 qualified, available agent?
    CAPACITY: required agents can absorb load within time budget?
    CAPABILITY_COVERAGE: all task capabilities covered by selected pattern + agents?
    GOVERNANCE_COMPLIANCE: selected pattern meets governance requirements for this task?
    TIME_FEASIBILITY: can selected pattern complete within time_sensitivity deadline?
  
  outcomes:
    ALL_PASS: proceed to strategy plan construction
    AVAILABILITY_FAIL: try alternative pattern requiring fewer specialized agents
    CAPABILITY_GAP (critical): escalate to human; cannot proceed
    CAPABILITY_GAP (non-critical): proceed with documented risk
    TIME_INFEASIBLE: recommend time_budget extension OR propose reduced scope
    GOVERNANCE_FAIL: escalate to appropriate governance authority before proceeding
  
  feasibility_record:
    all checks and outcomes logged
    retained: with the orchestration plan (3-year retention for ENHANCED/CRITICAL)
```

---

## Orchestration Plan Schema

```yaml
orchestration_plan:
  plan_id: string
  task_id: string
  created_at: ISO-8601
  created_by: agent_id | human_id
  
  task_classification:
    complexity: string
    time_sensitivity: string
    governance_level: string
    novelty: string
  
  selected_pattern:
    pattern_id: string
    pattern_name: string
    selection_rationale: string
  
  agent_assignments:
    roles: [
      {
        role_name: string
        assigned_agent_id: string
        backup_agent_id: string | null
        deliverable_schema: string (schema reference)
        time_budget: duration
        authority_level: string
      }
    ]
  
  execution_structure:
    dependencies: [{from_role, to_role, dependency_type}]
    critical_path: [role_name] (ordered)
    parallel_groups: [[role_name]] (roles that can run simultaneously)
    estimated_total_duration: duration
    deadline: ISO-8601
  
  governance_parameters:
    approval_required_before_execution: boolean
    required_approver: agent_id | human_id | null
    review_gates: [{after_stage, reviewer_id}]
    audit_level: STANDARD | ENHANCED
    human_escalation_path: [agent_id | human_id]
  
  plan_status: DRAFT | APPROVED | EXECUTING | COMPLETED | FAILED | CANCELLED
```

---

## Plan Approval Gate

```yaml
plan_approval_gate:
  required_for:
    governance_level == ENHANCED: Tier-3+ human review
    governance_level == CRITICAL: Tier-4+ human review + co-sign
    estimated_duration > 4 hours: Tier-3 acknowledgment
    agent_count > 10: Tier-3 acknowledgment
    blast_radius > 50 agents or humans: Tier-4 review
  
  not_required_for:
    governance_level == STANDARD AND complexity IN [BASIC, STANDARD]: auto-approved
    time_sensitivity == EMERGENCY: bypass approval (auto-approved with immediate notification)
  
  approval_SLA:
    ENHANCED: 30 minutes
    CRITICAL: 1 hour
    if SLA exceeded: auto-escalate to next tier; alert capability governance lead
```

---

## Strategy Engine Analytics

```yaml
strategy_analytics:
  per_task_tracking:
    - pattern selected, rationale
    - feasibility check outcomes
    - actual vs. estimated duration
    - pattern_performance: did selected pattern deliver quality outcome?
  
  pattern_effectiveness:
    computed: per pattern, rolling 90 days
    metrics: completion_rate, quality_score_avg, time_budget_adherence, escalation_rate
    use: feed back into pattern selection rule weights
  
  discovery_failure_rate:
    metric: fraction of feasibility checks failing AGENT_AVAILABILITY
    alert: if > 10% → enterprise capacity gap signal
  
  reports:
    weekly: pattern usage distribution, feasibility failure causes, emergency task rate
    monthly: pattern effectiveness rankings, strategy quality review
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-patterns/orchestration-pattern-catalog.md` | Pattern library this engine selects from |
| `orchestration-patterns/hierarchical-orchestration.md` | Hierarchical pattern execution details |
| `orchestration-patterns/peer-coordination-protocols.md` | Peer protocol execution details |
| `orchestration-patterns/dynamic-team-formation.md` | DYNAMIC pattern execution details |
| `agent-registry/agent-discovery-engine.md` | Agent discovery for role assignments |
| `delegation-and-trust/delegation-model.md` | Authority parameters per pattern role |
| `coordination-operations/work-distribution-engine.md` | Receives approved orchestration plans for execution |
| `agent-capabilities/agent-capability-model.md` | Capability taxonomy used in role requirements |
