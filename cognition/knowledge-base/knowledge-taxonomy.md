# Knowledge Taxonomy

## Purpose
Defines the controlled vocabulary, domain hierarchy, and classification scheme for all enterprise knowledge. Consistent classification enables reliable retrieval, prevents knowledge fragmentation across incompatible terminologies, and allows cross-domain synthesis. All knowledge units MUST use this taxonomy.

---

## Domain Hierarchy

```yaml
enterprise_domains:
  GOVERNANCE:
    description: Rules, policies, authority, oversight
    subdomains:
      - constitutional_principles
      - policy_framework
      - approval_governance
      - compliance_management
      - override_governance
      - audit_governance
    key_entity_types: [policy, principle, precedent, ruling, waiver]
  
  ORCHESTRATION:
    description: Multi-agent coordination, workflow routing, delegation
    subdomains:
      - agent_coordination
      - workflow_routing
      - delegation_patterns
      - trust_management
      - orchestration_patterns
    key_entity_types: [pattern, configuration, routing_rule, trust_boundary]
  
  PROCESS:
    description: Workflow design, execution, and optimization
    subdomains:
      - workflow_design
      - process_execution
      - state_management
      - case_management
      - process_optimization
    key_entity_types: [workflow, procedure, pattern, playbook, anti_pattern]
  
  DECISION:
    description: Decision-making frameworks, criteria, and outcomes
    subdomains:
      - decision_frameworks
      - approval_criteria
      - routing_logic
      - risk_assessment
      - decision_quality
    key_entity_types: [decision_model, criterion, threshold, rationale, precedent]
  
  TECHNICAL:
    description: Systems, architecture, integrations, tooling
    subdomains:
      - system_architecture
      - integration_patterns
      - performance_engineering
      - reliability_engineering
      - security_engineering
    key_entity_types: [architecture_decision, pattern, constraint, specification]
  
  ORGANIZATIONAL:
    description: Team structures, roles, responsibilities, culture
    subdomains:
      - org_structure
      - role_definitions
      - responsibility_mapping
      - culture_patterns
      - change_management
    key_entity_types: [role, responsibility, org_pattern, change_record]
  
  INCIDENT:
    description: Failures, responses, recoveries, and lessons learned
    subdomains:
      - incident_patterns
      - failure_modes
      - response_playbooks
      - root_cause_patterns
      - prevention_strategies
    key_entity_types: [incident_record, failure_mode, playbook, lesson, preventive_measure]
  
  INTELLIGENCE:
    description: Research, analysis, forecasting, and external insights
    subdomains:
      - research_findings
      - market_intelligence
      - technology_trends
      - risk_intelligence
      - competitive_intelligence
    key_entity_types: [finding, analysis, forecast, trend, signal]
  
  PRODUCT:
    description: Product decisions, requirements, design, and outcomes
    subdomains:
      - product_strategy
      - requirements
      - design_decisions
      - feature_knowledge
      - user_insights
    key_entity_types: [decision, requirement, design_rationale, user_insight]
  
  OPERATIONAL:
    description: Day-to-day operations, runbooks, and operational patterns
    subdomains:
      - runbook_knowledge
      - operational_patterns
      - capacity_management
      - monitoring_patterns
      - on_call_procedures
    key_entity_types: [runbook, pattern, threshold, procedure, escalation_path]
```

---

## Cross-Cutting Tags

Tags augment domain classification with orthogonal attributes:

```yaml
tag_vocabulary:
  # Audience
  audience:
    - agent-facing          # relevant to AI agents
    - human-facing          # relevant to human reviewers/operators
    - leadership-facing     # relevant to governance leads / executives
    - cross-org             # relevant across multiple orgs
  
  # Temporal
  temporal:
    - time-sensitive         # loses relevance quickly (hours/days)
    - evergreen              # stable for years
    - seasonal               # relevant at specific times (releases, quarters)
    - historical             # useful mainly for historical reference
  
  # Applicability
  applicability:
    - general               # applies broadly
    - specific-to: [org, process, agent-type]
    - emerging              # applies to new/evolving situations
    - edge-case             # applies only in unusual situations
  
  # Knowledge quality
  quality:
    - well-validated        # high evidence strength
    - provisional           # pending validation
    - contested             # under active dispute
    - foundational          # prerequisite for other knowledge
  
  # Action orientation
  action:
    - prescriptive          # tells you what to do
    - descriptive           # explains how things work
    - diagnostic            # helps identify problems
    - predictive            # enables forecasting
  
  # Tier relevance
  governance_tier:
    - tier-1-relevant
    - tier-2-relevant
    - tier-3-relevant
    - tier-4-relevant
    - tier-5-relevant
```

---

## Taxonomy Governance

```yaml
taxonomy_governance:
  adding_new_domain:
    requires: Tier-3 approval + knowledge-governance-lead
    process: RFC with rationale + 5+ existing units that would benefit
    review_period: 30 days
  
  adding_new_subdomain:
    requires: domain-owner + knowledge-steward
    process: proposal with 3+ example units
    review_period: 14 days
  
  adding_new_tag:
    requires: knowledge-steward sign-off
    process: simple proposal with examples
    review_period: 7 days
  
  deprecating_taxonomy_element:
    requires: Tier-3 + migration plan for all units using element
    migration_window: 90 days
  
  versioning:
    taxonomy_version: semantic version
    breaking_change: renaming or removing element
    non_breaking: adding element
    migration_tools: bulk re-tag + rename for breaking changes
```

---

## Classification Rules

```yaml
classification_rules:
  domain_assignment:
    primary_domain: required, exactly 1
    secondary_domains: optional, max 3
    
    ambiguity_resolution:
      "If knowledge spans multiple domains equally, prefer the domain of the ACTOR (who uses it), not the domain of the SUBJECT (what it's about)"
      "INCIDENT knowledge that teaches a PROCESS lesson → INCIDENT primary, PROCESS secondary"
  
  subdomain_assignment:
    required: true
    max_per_domain: 1 per primary domain, 1 per secondary domain
  
  tag_assignment:
    audience: required (at least one)
    temporal: required (at least one)
    applicability: at least one
    others: recommended
    max_tags_total: 15
  
  reclassification:
    trigger: unit retrieved with wrong domain by users > 30% of the time
    process: knowledge-steward review + update taxonomy or reclassify
    audit: reclassification logged
```

---

## Taxonomy-Driven Retrieval

The taxonomy enables structured queries:

```yaml
taxonomy_queries:
  domain_query:
    example: "All INCIDENT knowledge in the GOVERNANCE subdomain"
    returns: units where primary_domain == INCIDENT AND governance in subdomains
  
  cross_domain_query:
    example: "PROCESS knowledge that also applies to GOVERNANCE"
    returns: units where PROCESS in domains AND GOVERNANCE in secondary_domains
  
  audience_filter:
    example: "Knowledge relevant to Tier-3 principals"
    returns: units where "tier-3-relevant" in tags
  
  freshness_filter:
    example: "Evergreen TECHNICAL knowledge published in last 6 months"
    returns: units where "evergreen" in tags AND domain == TECHNICAL AND published_at > 6_months_ago
  
  applicability_filter:
    example: "Edge-case knowledge for the QA org"
    returns: units where "edge-case" in tags AND org in [QA, cross-org]
```

---

## Ontology Integration

The taxonomy connects to the enterprise ontology:

```yaml
ontology_alignment:
  taxonomy_to_ontology:
    domain → OntologyClass
    subdomain → OntologySubclass
    entity_type → OntologyIndividual
    tags → OntologyProperty
  
  integration_path:
    knowledge_unit → classified by taxonomy → mapped to ontology/
    ontology queries can traverse knowledge relationships
    reasoner can infer knowledge applicability from ontological relationships
    
  example:
    "Knowledge units applicable to the entity agent-type:governance-reviewer can be inferred from the ontology by traversing is-a relationships"
```
