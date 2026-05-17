# Agent Capability Model

## Purpose
Defines the canonical data model for agent capabilities — what an agent can do, how well they can do it, under what conditions, and with what authority. Capabilities are the fundamental unit of agent intelligence: they determine which tasks an agent can be assigned, what trust can be extended, and how agent performance is measured.

---

## Capability Taxonomy

```yaml
capability_taxonomy:
  COGNITIVE:
    description: Reasoning, analysis, synthesis, judgment
    subcategories:
      - logical_reasoning          # deductive and inductive inference
      - causal_reasoning           # cause-effect modeling
      - analogical_reasoning       # pattern transfer across domains
      - probabilistic_reasoning    # uncertainty and probability assessment
      - ethical_reasoning          # values alignment and tradeoff evaluation
      - strategic_planning         # multi-step planning under uncertainty
      - critical_analysis          # evidence evaluation; assumption identification
      - synthesis_and_integration  # combining information across sources
  
  DOMAIN:
    description: Substantive expertise in enterprise knowledge domains
    subcategories:
      - governance_expertise
      - technical_expertise
      - process_expertise
      - financial_expertise
      - legal_and_compliance_expertise
      - organizational_expertise
      - product_expertise
      - security_expertise
      - data_and_analytics_expertise
      - research_expertise
  
  OPERATIONAL:
    description: Task execution, workflow orchestration, tool use
    subcategories:
      - workflow_execution
      - multi_agent_orchestration
      - tool_use_and_integration
      - artifact_production
      - quality_assurance
      - monitoring_and_observation
      - incident_response
      - resource_optimization
  
  INTERPERSONAL:
    description: Communication, collaboration, human interface
    subcategories:
      - human_communication
      - stakeholder_management
      - conflict_resolution
      - knowledge_elicitation
      - instruction_following
      - feedback_integration
      - explanation_and_justification
  
  GOVERNANCE:
    description: Policy compliance, ethical judgment, authority management
    subcategories:
      - constitutional_evaluation
      - policy_interpretation
      - risk_assessment
      - authority_management
      - audit_and_compliance
      - escalation_judgment
      - override_assessment
```

---

## Capability Unit Schema

```yaml
capability_unit:
  # Identity
  capability_id: "CAP-uuid"
  name: string                         # short, actionable name
  slug: "kebab-case-slug"
  category: [see capability_taxonomy]
  subcategory: string
  version: semantic_version            # capabilities evolve; versioning tracks changes
  
  # Description
  description: string                  # what this capability enables an agent to do
  observable_behaviors: [string]       # concrete, observable manifestations of this capability
  prerequisite_capabilities: [CAP-id] # capabilities required before this one can be developed
  
  # Proficiency Levels
  proficiency_levels:
    NONE:     description: "No evidence of this capability"
    NOVICE:   description: "Can perform with significant guidance and checking"
    CAPABLE:  description: "Can perform reliably in standard cases; needs help in edge cases"
    PROFICIENT: description: "Handles standard and most edge cases independently"
    EXPERT:   description: "Handles all cases; can guide others; recognized authority"
  
  # Assessment
  assessment:
    method: TASK_PERFORMANCE | BENCHMARK | HUMAN_EVALUATION | PEER_REVIEW | SELF_ASSESSED
    observable_indicators: [{level, indicators: [string]}]
    assessment_frequency: MONTHLY | QUARTERLY | ON_TASK | CONTINUOUS
  
  # Governance
  governance:
    tier_required_for_independent_use: int (1–5)
    domains_applicable: [string]        # which enterprise domains this applies to
    certification_required: boolean     # some capabilities need formal certification
    access_controlled: boolean          # some capabilities are granted, not developed
```

---

## Agent Capability Profile

Every agent has a capability profile:

```yaml
agent_capability_profile:
  agent_id: string
  profile_version: string
  last_assessed: ISO-8601
  
  capabilities: [
    {
      capability_id: string
      proficiency_level: NONE | NOVICE | CAPABLE | PROFICIENT | EXPERT
      evidence_count: int              # number of assessments supporting this level
      confidence: 0.0–1.0             # confidence in the proficiency assessment
      last_demonstrated: ISO-8601     # last time this capability was observed in use
      trend: IMPROVING | STABLE | DECLINING
      development_focus: boolean       # currently being actively developed?
      
      assessments: [
        {
          assessed_at: ISO-8601
          assessed_by: agent-id | human-id | system
          method: string
          level_assigned: string
          evidence_refs: [task_id | incident_id | benchmark_id]
          notes: string
        }
      ]
    }
  ]
  
  overall_profile:
    primary_strengths: [capability_id]       # top 5 capabilities by proficiency
    development_areas: [capability_id]       # capabilities targeted for improvement
    certification_status: {[capability_id]: CERTIFIED | PENDING | EXPIRED | NOT_APPLICABLE}
    tier_authorization: int                  # current authorized tier (based on capability profile)
    specializations: [string]               # formal specializations earned
```

---

## Proficiency Evidence Framework

```yaml
proficiency_evidence:
  DIRECT_OBSERVATION:
    description: Capability observed during live task execution
    weight: HIGH
    source: performance-tracker → capability assessor
    requirements: observer must have PROFICIENT+ in the capability being assessed
  
  TASK_OUTCOME:
    description: Capability inferred from task success/failure rates
    weight: MEDIUM
    source: automated performance metrics
    requirements: >= 10 tasks for statistically significant inference
  
  BENCHMARK_RESULT:
    description: Standardized benchmark for the capability
    weight: HIGH (if benchmark is well-validated)
    source: benchmark-runner (see agent-capability-assessment.md)
    requirements: benchmark must be version-matched to capability version
  
  PEER_ASSESSMENT:
    description: Capability assessed by peer agent with higher proficiency
    weight: MEDIUM
    source: peer assessment request
    requirements: assessing agent must be EXPERT; cannot self-assess
  
  KNOWLEDGE_DEMONSTRATION:
    description: Agent produces artifact demonstrating capability
    weight: MEDIUM
    source: artifact quality review
    requirements: quality reviewer must be PROFICIENT+
  
  HUMAN_EVALUATION:
    description: Human expert evaluates agent capability directly
    weight: VERY_HIGH
    source: human evaluation session (see expert-knowledge-elicitation.md)
    requirements: evaluating human must be domain expert
```

---

## Capability Inheritance

```yaml
capability_inheritance:
  agent_types:
    GOVERNANCE_AGENT:
      inherits: [constitutional_evaluation, policy_interpretation, risk_assessment, escalation_judgment]
      minimum_proficiency: CAPABLE for all inherited capabilities
    
    ORCHESTRATION_AGENT:
      inherits: [multi_agent_orchestration, workflow_execution, strategic_planning]
      minimum_proficiency: CAPABLE
    
    ENGINEERING_AGENT:
      inherits: [technical_expertise, workflow_execution, artifact_production, quality_assurance]
      minimum_proficiency: CAPABLE
    
    RESEARCH_AGENT:
      inherits: [research_expertise, synthesis_and_integration, critical_analysis, causal_reasoning]
      minimum_proficiency: PROFICIENT
    
    QA_AGENT:
      inherits: [quality_assurance, critical_analysis, audit_and_compliance]
      minimum_proficiency: CAPABLE
    
    ANALYTICS_AGENT:
      inherits: [data_and_analytics_expertise, probabilistic_reasoning, causal_reasoning]
      minimum_proficiency: CAPABLE
  
  inheritance_model:
    at_creation: agent_type sets initial capability profile at NOVICE level for inherited capabilities
    graduation: NOVICE → CAPABLE requires evidence (minimum 5 successful task completions)
    specialization: CAPABLE → PROFICIENT → EXPERT through demonstrated performance
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-capabilities/agent-skill-registry.md` | Registry of all capability definitions |
| `agent-capabilities/agent-capability-assessment.md` | Assessment execution |
| `agent-capabilities/agent-capability-governance.md` | Authorization per capability |
| `agent-performance/agent-performance-model.md` | Performance signals feed capability updates |
| `agent-learning/agent-skill-acquisition.md` | How capabilities are developed |
| `human-review/review-assignment-engine.md` | Capability matching for assignment |
