# Graph Schema

## Purpose
Defines the complete type system for the enterprise knowledge graph — all node types, edge types, property schemas, and relationship semantics. The schema is the contract between all graph subsystems: ingest pipelines, storage, query engines, reasoning systems, and observability. Schema changes follow a migration governance process; new node and edge types can be added without breaking existing queries; existing types are never removed (deprecated instead).

---

## Node Type Registry

```yaml
node_types:
  ENTITY:
    description: Generic named real-world entity (person, organization, concept, place, artifact)
    required_properties: [name, entity_subtype]
    optional_properties: [description, aliases, external_ids, classification_tier]
    embedding_fields: [name, description, aliases]
    subtypes: [PERSON, ORGANIZATION, CONCEPT, ARTIFACT, LOCATION, REGULATION, STANDARD]

  AGENT:
    description: AI agent in the enterprise OS with defined capabilities and tier
    required_properties: [agent_id, tier, status, capability_ids, trust_score]
    optional_properties: [model_id, organization_id, specializations]
    embedding_fields: [agent_id, specializations]
    subtypes: [ORCHESTRATOR, SPECIALIST, WORKER, GOVERNANCE_AGENT, HUMAN_PROXY]

  TASK:
    description: Unit of work with defined inputs, outputs, and lifecycle state
    required_properties: [task_id, task_type, status, blast_radius, priority]
    optional_properties: [assigned_agent_id, workflow_id, parent_task_id, sla]
    embedding_fields: [task_type, description, objective]

  WORKFLOW:
    description: Orchestrated sequence of tasks with dependency relationships
    required_properties: [workflow_id, workflow_type, status, dag_id]
    optional_properties: [owner_agent_id, trigger_event, completion_criteria]
    embedding_fields: [workflow_type, description, objective]

  RESOURCE:
    description: System resource that can be allocated, consumed, or reserved
    required_properties: [resource_id, resource_type, capacity, current_allocation]
    optional_properties: [owner_id, pool_id, constraints]
    subtypes: [COMPUTE, CONTEXT_BUDGET, TOOL_QUOTA, STORAGE, APPROVAL_SLOT, API_QUOTA]

  KNOWLEDGE:
    description: Captured knowledge artifact: decision, insight, pattern, or learned fact
    required_properties: [knowledge_id, knowledge_type, content, source_episode_id]
    optional_properties: [domain, confidence, expiry, references]
    embedding_fields: [content, domain, knowledge_type]
    subtypes: [DECISION, INSIGHT, PATTERN, FACT, RULE, OBSERVATION, HYPOTHESIS]

  EVENT:
    description: Temporal occurrence that has happened or is scheduled to happen
    required_properties: [event_id, event_type, occurred_at, severity]
    optional_properties: [workflow_id, agent_id, resolution, impact]
    subtypes: [INCIDENT, COMPLIANCE_EVENT, GOVERNANCE_EVENT, SYSTEM_EVENT, BUSINESS_EVENT]

  POLICY:
    description: Node representation of a policy document (cross-references policy-registry)
    required_properties: [policy_id, policy_version, classification, status]
    optional_properties: [obligation_ids, regulation_ids, activation_date]
    embedding_fields: [policy_id, scope_description, rule_summaries]

  CONSTRAINT:
    description: Operational constraint governing agent or workflow behavior
    required_properties: [constraint_id, constraint_type, scope, enforcement]
    optional_properties: [valid_until, override_authority, exception_history]

  COMMUNITY:
    description: Emergent cluster of semantically or structurally related nodes
    required_properties: [community_id, center_node_id, community_type, cohesion_score]
    optional_properties: [summary, domain, stability_score]

  METRIC:
    description: Measurable KPI, KRI, or operational metric with time-series values
    required_properties: [metric_id, metric_name, metric_type, current_value, unit]
    optional_properties: [threshold_warn, threshold_critical, owner_id, trend]
    subtypes: [KPI, KRI, COMPLIANCE_SCORE, AGENT_PERFORMANCE, SYSTEM_HEALTH]

  OBLIGATION:
    description: Regulatory or governance obligation that must be satisfied
    required_properties: [obligation_id, source_regulation, obligation_text, status]
    optional_properties: [control_ids, policy_ids, coverage_rate, deadline]
```

---

## Edge Type Registry

```yaml
edge_types:
  # Authority and Delegation
  DELEGATES_TO:
    description: Agent A has delegated a scope of authority to agent B
    source_type: AGENT
    target_type: AGENT
    required_properties: [delegation_id, scope, valid_from, valid_until]
    temporal: true
    weight_semantics: delegation strength (1.0 = full scope)

  REPORTS_TO:
    description: Hierarchical authority relationship (human or agent)
    source_type: AGENT | ENTITY
    target_type: AGENT | ENTITY
    required_properties: [relationship_type]
    temporal: true

  GOVERNS:
    description: Policy or constraint applies to an agent, workflow, or resource
    source_type: POLICY | CONSTRAINT
    target_type: AGENT | TASK | WORKFLOW | RESOURCE
    required_properties: [scope, enforcement_mode]
    temporal: true

  APPROVES:
    description: Agent approved a task, policy, or decision
    source_type: AGENT | ENTITY
    target_type: TASK | POLICY | KNOWLEDGE | EVENT
    required_properties: [approval_id, approval_type, decided_at]
    temporal: false

  # Task and Workflow Relationships
  DEPENDS_ON:
    description: Task or workflow cannot start until its dependency is satisfied
    source_type: TASK | WORKFLOW
    target_type: TASK | WORKFLOW | RESOURCE | CONSTRAINT
    required_properties: [dependency_type, criticality]
    weight_semantics: dependency strength (1.0 = hard dependency)

  PRECEDES:
    description: Strict ordering constraint (A must complete before B starts)
    source_type: TASK | EVENT
    target_type: TASK | EVENT
    required_properties: [ordering_type]
    temporal: false

  PRODUCES:
    description: Task or agent produces an artifact or knowledge node
    source_type: TASK | AGENT | WORKFLOW
    target_type: KNOWLEDGE | RESOURCE | EVENT
    required_properties: [artifact_type]

  CONSUMES:
    description: Task or agent consumes a resource or knowledge artifact
    source_type: TASK | AGENT | WORKFLOW
    target_type: RESOURCE | KNOWLEDGE
    required_properties: [consumption_type, amount | null]

  ASSIGNED_TO:
    description: Task has been assigned to a specific agent
    source_type: TASK
    target_type: AGENT
    required_properties: [assigned_at, assignment_confidence]
    temporal: true

  CHILD_OF:
    description: Sub-task or sub-workflow relationship
    source_type: TASK | WORKFLOW
    target_type: TASK | WORKFLOW
    required_properties: [relationship_type]

  # Knowledge and Causality
  CAUSED_BY:
    description: Causal relationship (event B was caused by event/action A)
    source_type: EVENT | KNOWLEDGE
    target_type: EVENT | TASK | AGENT | KNOWLEDGE
    required_properties: [causality_type, confidence]
    weight_semantics: causal strength (1.0 = direct cause)

  SUPPORTS:
    description: Knowledge node A provides evidence for or supports node B
    source_type: KNOWLEDGE | EVENT
    target_type: KNOWLEDGE | POLICY | DECISION
    required_properties: [support_type, confidence]
    weight_semantics: support strength

  CONTRADICTS:
    description: Knowledge node A contradicts or conflicts with node B
    source_type: KNOWLEDGE | EVENT | POLICY
    target_type: KNOWLEDGE | POLICY
    required_properties: [contradiction_type, detected_at]
    weight_semantics: contradiction severity

  DERIVED_FROM:
    description: A knowledge node was derived from or inferred from another
    source_type: KNOWLEDGE | POLICY
    target_type: KNOWLEDGE | POLICY | EVENT
    required_properties: [derivation_method, derivation_confidence]

  ENFORCES:
    description: Policy enforces a regulatory obligation
    source_type: POLICY
    target_type: OBLIGATION
    required_properties: [coverage_type, coverage_rate]

  # Organizational and Membership
  MEMBER_OF:
    description: Agent or entity belongs to a group, community, or organization
    source_type: AGENT | ENTITY
    target_type: COMMUNITY | ENTITY
    required_properties: [membership_type]
    temporal: true

  COLLABORATES_WITH:
    description: Two agents have an active collaborative relationship
    source_type: AGENT
    target_type: AGENT
    required_properties: [collaboration_type, collaboration_history_count]
    temporal: true

  OWNS:
    description: Agent or entity has ownership or stewardship of a resource or artifact
    source_type: AGENT | ENTITY
    target_type: RESOURCE | KNOWLEDGE | WORKFLOW | POLICY
    required_properties: [ownership_type]
    temporal: true

  # Impact and Risk
  IMPACTS:
    description: Change to A propagates impact to B
    source_type: TASK | EVENT | POLICY | AGENT
    target_type: AGENT | RESOURCE | WORKFLOW | METRIC
    required_properties: [impact_type, impact_severity, propagation_lag_estimate]
    weight_semantics: impact magnitude (1.0 = direct full impact)

  AT_RISK_FROM:
    description: A is exposed to risk originating from B
    source_type: AGENT | WORKFLOW | RESOURCE
    target_type: EVENT | CONSTRAINT | POLICY | METRIC
    required_properties: [risk_type, risk_level, last_assessed]

  INTEGRATES_WITH:
    description: Two systems or agents have an integration point
    source_type: AGENT | RESOURCE | WORKFLOW
    target_type: AGENT | RESOURCE | WORKFLOW
    required_properties: [integration_type, protocol, reliability_score]
    temporal: true

  REFERENCES:
    description: Loose reference relationship (A cites or references B)
    source_type: KNOWLEDGE | POLICY | EVENT
    target_type: any node_type
    required_properties: [reference_type]
```

---

## Property Type Definitions

```yaml
property_types:
  temporal:
    valid_from: ISO-8601 (millisecond precision)
    valid_until: ISO-8601 | null
    transaction_from: ISO-8601
    transaction_until: ISO-8601 | null
  
  scoring:
    confidence: float [0.0, 1.0]
    weight: float [0.0, 1.0]
    trust_score: float [0.0, 1.0]
    risk_score: float [0.0, 1.0]
  
  classification:
    data_classification: PUBLIC | INTERNAL | CONFIDENTIAL | RESTRICTED | TOP_SECRET
    minimum_tier_to_access: int [1, 5]
  
  provenance:
    source_episode_id: episode_id
    extraction_method: EXPLICIT | INFERRED | DERIVED | SYSTEM_COMPUTED
    created_by: agent_id | system_id
    last_modified_by: agent_id | system_id
```

---

## Schema Evolution Rules

```yaml
schema_governance:
  add_node_type:
    authority: compliance_governance_lead + architecture_lead
    process: submit schema_change_proposal; 5-day review; no breaking changes permitted
    backward_compatibility: existing queries unaffected; new type is additive

  add_edge_type:
    authority: architecture_lead
    process: 3-day review; required_properties must be minimal (avoid mandatory fields on existing relationships)

  deprecate_node_type:
    authority: board
    process: 30-day deprecation notice; migration plan required; never hard-delete

  add_required_property:
    PROHIBITED: existing required_properties cannot be added to existing types
    reason: breaks all existing nodes of that type that lack the property
    alternative: add as optional; migrate async; promote to required after full migration

  change_edge_directionality:
    PROHIBITED on active edge_types
    reason: would invalidate all existing traversal queries relying on direction
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Schema used for all node/edge creation |
| `graph-cognition/graph-storage-model.md` | Schema enforced at storage layer |
| `graph-cognition/graph-index-manager.md` | Index strategies derived from schema |
| `graph-memory/entity-relationship-system.md` | Entity extraction maps to schema types |
| `enterprise-topology/org-relationship-graph.md` | Uses AGENT, MEMBER_OF, DELEGATES_TO, REPORTS_TO |
| `enterprise-topology/dependency-graph.md` | Uses DEPENDS_ON, PRECEDES, IMPACTS |
| `orchestration-dags/dag-execution-engine.md` | Uses TASK, WORKFLOW, DEPENDS_ON, PRECEDES |
| `graph-reasoning/causal-reasoning-engine.md` | Uses CAUSED_BY, IMPACTS, SUPPORTS |
