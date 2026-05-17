# Knowledge Model

## Purpose
Defines the canonical data model for all enterprise knowledge. Every piece of knowledge — a decision rationale, a workflow pattern, an incident lesson, an expert insight, a policy interpretation — is represented as a structured Knowledge Unit. This model is the foundation that all capture, storage, retrieval, synthesis, and governance systems build on.

---

## Knowledge Unit Schema

```yaml
knowledge_unit:
  # Identity
  unit_id: "KU-uuid"
  title: string                    # concise, searchable title
  slug: "kebab-case-unique-slug"   # human-friendly permanent identifier
  
  # Classification
  knowledge_type: [see Knowledge Type Catalog below]
  domain: [domain-string]          # enterprise domains from taxonomy
  subdomain: [subdomain-string]
  tags: [tag-string]               # free-form + controlled vocabulary
  
  # Content
  content:
    summary: string                # 2–5 sentence executive summary
    body: string                   # full content in structured markdown
    structured_data: {}            # machine-readable version of key facts
    examples: [{title, description, artifact_ref}]
    counter_examples: [{title, description}]   # when NOT to apply
    related_concepts: [unit_id]
    supersedes: [unit_id]          # this unit replaces these older units
    superseded_by: unit_id | null  # if this unit is outdated
  
  # Evidence and provenance
  provenance:
    origin_type: WORKFLOW_EXTRACTION | DECISION_CAPTURE | INCIDENT_LESSON
               | EXPERT_ELICITATION | PATTERN_RECOGNITION | SYNTHESIS | MANUAL
    origin_refs: [ref-id]          # original sources (workflow instances, decisions, etc.)
    captured_by: agent-id
    captured_at: ISO-8601
    contributing_agents: [agent-id]
    confidence: 0.0–1.0            # how confident we are this knowledge is correct
    evidence_strength: ANECDOTAL | OBSERVED | VALIDATED | PROVEN
  
  # Quality
  quality:
    completeness_score: 0.0–1.0    # how complete the knowledge unit is
    accuracy_score: 0.0–1.0        # validated accuracy
    clarity_score: 0.0–1.0         # readability and unambiguity
    applicability_score: 0.0–1.0   # how broadly applicable
    overall_quality: computed weighted average
    last_quality_review: ISO-8601
    quality_reviewer: agent-id | null
  
  # Usage and impact
  usage:
    retrieval_count: integer        # times retrieved
    application_count: integer      # times an agent confirmed they applied it
    positive_outcomes: integer      # applications that had good outcome
    negative_outcomes: integer      # applications that had bad outcome
    citations: [unit_id]            # other knowledge units that reference this
    usefulness_score: 0.0–1.0      # derived from outcomes
  
  # Lifecycle
  lifecycle:
    status: DRAFT | REVIEW | ACTIVE | DEPRECATED | ARCHIVED | CONTESTED
    created_at: ISO-8601
    published_at: ISO-8601 | null
    last_updated: ISO-8601
    review_schedule: MONTHLY | QUARTERLY | ANNUALLY | ON_CHANGE
    next_review: ISO-8601
    expires_at: ISO-8601 | null    # some knowledge has defined expiry (regulatory, time-sensitive)
  
  # Governance
  governance:
    owner: agent-id                # accountable for accuracy
    steward: agent-id | null       # day-to-day maintenance
    org: string                    # owning organizational unit
    access_level: PUBLIC | ORG | RESTRICTED | CONFIDENTIAL
    change_log: [{version, changed_at, changed_by, summary}]
```

---

## Knowledge Type Catalog

```yaml
knowledge_types:
  PROCESS_KNOWLEDGE:
    description: How to perform a workflow, process, or task
    examples: [workflow patterns, operating procedures, decision playbooks]
    structured_data_fields: [steps, preconditions, postconditions, common_errors]
    typical_origin: WORKFLOW_EXTRACTION | EXPERT_ELICITATION
  
  DECISION_KNOWLEDGE:
    description: How and why specific decisions are made; decision rationale and patterns
    examples: [approval criteria, policy interpretations, routing logic]
    structured_data_fields: [decision_criteria, decision_weights, applicable_contexts, known_exceptions]
    typical_origin: DECISION_CAPTURE | PATTERN_RECOGNITION
  
  INCIDENT_KNOWLEDGE:
    description: What went wrong, why, and how to prevent or respond
    examples: [incident postmortems, failure modes, recovery procedures]
    structured_data_fields: [root_cause, contributing_factors, detection_signals, remediation_steps]
    typical_origin: INCIDENT_LESSONS_LEARNED
  
  DOMAIN_KNOWLEDGE:
    description: Substantive facts, concepts, and relationships in a specific domain
    examples: [technical concepts, organizational context, market knowledge]
    structured_data_fields: [facts, relationships, constraints, current_state]
    typical_origin: EXPERT_ELICITATION | SYNTHESIS
  
  PATTERN_KNOWLEDGE:
    description: Reusable patterns observed across multiple situations
    examples: [design patterns, anti-patterns, workflow patterns]
    structured_data_fields: [pattern_structure, applicability_conditions, variations, trade_offs]
    typical_origin: PATTERN_RECOGNITION | SYNTHESIS
  
  POLICY_KNOWLEDGE:
    description: Interpretations of policies, rules, and governance guidance
    examples: [policy interpretations, exception precedents, governance rulings]
    structured_data_fields: [policy_id, interpretation, applicable_contexts, authority, valid_until]
    typical_origin: DECISION_CAPTURE | MANUAL
  
  RELATIONSHIP_KNOWLEDGE:
    description: How entities, systems, and concepts relate to each other
    examples: [system dependencies, organizational relationships, concept hierarchies]
    structured_data_fields: [entity_a, entity_b, relationship_type, strength, direction]
    typical_origin: PATTERN_RECOGNITION | SYNTHESIS
  
  CONTEXT_KNOWLEDGE:
    description: Background context needed to understand or operate in a domain
    examples: [organizational history, strategic context, stakeholder maps]
    structured_data_fields: [context_type, relevant_period, key_facts, dependencies]
    typical_origin: EXPERT_ELICITATION | MANUAL
```

---

## Knowledge Relationship Types

```yaml
relationship_types:
  SUPERSEDES:           # this unit replaces an older unit
  EXTENDS:              # this unit adds to another unit
  CONTRADICTS:          # this unit conflicts with another (both marked CONTESTED)
  SUPPORTS:             # this unit provides evidence for another
  APPLIES_TO:           # this unit is applicable in the context of another
  DERIVED_FROM:         # this unit was synthesized from others
  SPECIALIZES:          # this unit is a specific case of a more general unit
  GENERALIZES:          # this unit is a generalization of more specific units
  CITES:                # this unit references another as evidence
  INVALIDATES:          # this unit demonstrates another is no longer correct
```

---

## Knowledge Unit States

```yaml
lifecycle_states:
  DRAFT:
    description: Being authored; not yet searchable or retrievable
    editable: true
    retrievable: false
  
  REVIEW:
    description: Under peer review for quality and accuracy
    editable: true (by reviewers)
    retrievable: false (except by reviewers)
  
  ACTIVE:
    description: Published; searchable and retrievable
    editable: changes create new version; old version preserved
    retrievable: true
  
  DEPRECATED:
    description: Superseded by newer knowledge; still retrievable but flagged
    retrievable: true (with DEPRECATED label)
    system_behavior: retrieval results show newer unit first; deprecated shown as alternative
  
  ARCHIVED:
    description: No longer relevant; retained for audit/historical purposes only
    retrievable: false from standard search (direct ID lookup only)
  
  CONTESTED:
    description: Accuracy or applicability disputed; under active investigation
    retrievable: true (with CONTESTED warning label)
    system_behavior: retrieval shows both the unit and any contradicting units
```

---

## Knowledge Unit Versioning

```yaml
versioning:
  strategy: major.minor.patch
  
  triggers:
    MAJOR: content meaning fundamentally changes; supersedes are different
    MINOR: significant addition or clarification
    PATCH: typo, formatting, minor wording improvement
  
  immutability:
    published_versions: immutable; changes create new version
    draft_versions: mutable
  
  version_record:
    version_id: string
    version_number: string
    created_at: ISO-8601
    created_by: agent-id
    changes_summary: string
    diff_from_prior: structured diff
    approval:
      required_for: MAJOR version bump
      approved_by: knowledge-owner | steward
```

---

## Integration Points

| System | Role |
|---|---|
| `knowledge-base/knowledge-taxonomy.md` | Domain, subdomain, and tag vocabulary |
| `knowledge-base/knowledge-repository.md` | Storage and indexing |
| `knowledge-capture/` | Creates KUs from organizational experience |
| `knowledge-retrieval/semantic-search-engine.md` | Makes KUs findable |
| `knowledge-governance/knowledge-ownership-system.md` | Owner/steward assignment |
| `process-governance/execution-lineage-tracker.md` | Origin refs for WORKFLOW_EXTRACTION |
| `decision-models/decision-audit-trail.md` | Origin refs for DECISION_CAPTURE |
