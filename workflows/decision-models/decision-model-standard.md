# Decision Model Standard

## Purpose
Defines the enterprise standard for machine-readable decision models. Decision models encapsulate business rules, policy logic, and routing conditions in a structured, testable, auditable format. All Business Rule Tasks in BPMN invoke decision models defined here.

---

## Decision Model Types

| Type | Best For | Complexity |
|---|---|---|
| Decision Table | Rule-based with discrete inputs | Low–Medium |
| Decision Tree | Hierarchical branching logic | Medium |
| Scoring Model | Weighted criteria → numeric score | Medium |
| Expression Rule | Single CEL expression | Low |
| Ensemble | Multiple models combined | High |

---

## Decision Model Schema

```yaml
decision_model:
  model_id: "DM-DOMAIN-NNN"
  name: "Model Name"
  version: "MAJOR.MINOR.PATCH"
  description: "what decision this model makes and why"
  owner: "org-name"
  type: TABLE | TREE | SCORING | EXPRESSION | ENSEMBLE
  status: DRAFT | ACTIVE | DEPRECATED
  
  governance:
    tier_required: 0–5
    constitutional_check: true/false
    audit_level: NONE | STANDARD | ENHANCED
  
  inputs:
    input_name:
      type: string | integer | number | boolean | object
      description: "field description"
      required: true/false
      validation: "CEL expression"
  
  outputs:
    output_name:
      type: string | integer | number | boolean | object
      description: "what this output represents"
      possible_values: [values]   # for enumerated outputs
  
  hit_policy: UNIQUE | FIRST | RULE_ORDER | ANY | COLLECT | SUM | MIN | MAX   # for TABLE type
  
  definition: {}   # type-specific definition (see below)
  
  test_cases:
    - name: "test case name"
      inputs: {}
      expected_outputs: {}
      tags: [string]
  
  metadata:
    created_at: ISO-8601
    last_updated: ISO-8601
    change_log: [{version, changed_at, changed_by, description}]
```

---

## Decision Table Definition

```yaml
# DM-GOV-001: Approval Tier Determination
model_id: DM-GOV-001
name: Approval Tier Determination
version: 1.3.0
type: TABLE
hit_policy: FIRST   # first matching rule wins

inputs:
  artifact_type:
    type: string
    required: true
  estimated_impact:
    type: string
    possible_values: [ORGANIZATIONAL, DEPARTMENTAL, TEAM, INDIVIDUAL]
  constitutional_risk:
    type: boolean
    required: true
  reversible:
    type: boolean
    required: true

outputs:
  required_tier:
    type: integer
    possible_values: [1, 2, 3, 4, 5]
  approver_count:
    type: integer
  sla_hours:
    type: integer
  require_constitutional_review:
    type: boolean

definition:
  type: table
  rules:
    # Constitutional risk always escalates to high tier
    - id: R001
      conditions:
        constitutional_risk: true
      outputs:
        required_tier: 4
        approver_count: 3
        sla_hours: 72
        require_constitutional_review: true
    
    # Organizational impact, non-reversible
    - id: R002
      conditions:
        estimated_impact: ORGANIZATIONAL
        reversible: false
      outputs:
        required_tier: 3
        approver_count: 2
        sla_hours: 48
        require_constitutional_review: false
    
    # Organizational impact, reversible
    - id: R003
      conditions:
        estimated_impact: ORGANIZATIONAL
        reversible: true
      outputs:
        required_tier: 2
        approver_count: 2
        sla_hours: 24
        require_constitutional_review: false
    
    # Departmental impact
    - id: R004
      conditions:
        estimated_impact: DEPARTMENTAL
      outputs:
        required_tier: 2
        approver_count: 1
        sla_hours: 24
        require_constitutional_review: false
    
    # Team or individual impact (default)
    - id: R005
      conditions: {}   # catch-all
      outputs:
        required_tier: 1
        approver_count: 1
        sla_hours: 8
        require_constitutional_review: false

test_cases:
  - name: Constitutional risk always tier 4
    inputs: {artifact_type: RFC, estimated_impact: TEAM, constitutional_risk: true, reversible: true}
    expected_outputs: {required_tier: 4, approver_count: 3}
  - name: Org impact non-reversible
    inputs: {artifact_type: POLICY, estimated_impact: ORGANIZATIONAL, constitutional_risk: false, reversible: false}
    expected_outputs: {required_tier: 3, approver_count: 2}
```

---

## Decision Tree Definition

```yaml
# DM-ROUTE-001: Workflow Routing Decision
model_id: DM-ROUTE-001
name: Workflow Agent Routing
version: 1.0.0
type: TREE

inputs:
  task_type: {type: string, required: true}
  required_capability: {type: string, required: true}
  tier_required: {type: integer, required: true}
  priority: {type: string, required: true}

outputs:
  agent_pool: {type: string}
  routing_strategy: {type: string, possible_values: [ROUND_ROBIN, LEAST_LOADED, CAPABILITY_BEST_MATCH, TIER_PRIORITY]}
  fallback_pool: {type: string}

definition:
  type: tree
  root:
    condition: "task_type == 'GOVERNANCE'"
    true_branch:
      condition: "tier_required >= 4"
      true_branch:
        return: {agent_pool: governance-senior-agents, routing_strategy: TIER_PRIORITY, fallback_pool: human-governance}
      false_branch:
        return: {agent_pool: governance-agents, routing_strategy: CAPABILITY_BEST_MATCH, fallback_pool: governance-senior-agents}
    false_branch:
      condition: "priority == 'CRITICAL'"
      true_branch:
        return: {agent_pool: priority-agents, routing_strategy: LEAST_LOADED, fallback_pool: any-capable-agent}
      false_branch:
        condition: "required_capability != null"
        true_branch:
          return: {agent_pool: capability-matched-pool, routing_strategy: CAPABILITY_BEST_MATCH, fallback_pool: general-agents}
        false_branch:
          return: {agent_pool: general-agents, routing_strategy: ROUND_ROBIN, fallback_pool: null}
```

---

## Scoring Model Definition

```yaml
# DM-HEALTH-001: Agent Trust Score
model_id: DM-HEALTH-001
name: Agent Trust Score Computation
version: 2.0.0
type: SCORING

inputs:
  task_success_rate: {type: number, minimum: 0.0, maximum: 1.0}
  governance_compliance_rate: {type: number, minimum: 0.0, maximum: 1.0}
  override_rate: {type: number, minimum: 0.0, maximum: 1.0}   # rate of human overrides
  constitutional_violations: {type: integer, minimum: 0}
  days_active: {type: integer, minimum: 0}

outputs:
  trust_score: {type: number, minimum: 0.0, maximum: 1.0}
  trust_tier: {type: integer, possible_values: [1, 2, 3, 4, 5]}
  flags: {type: array}

definition:
  type: scoring
  base_score: 0.50
  criteria:
    - name: task_success
      weight: 0.30
      formula: "task_success_rate"
    - name: governance_compliance
      weight: 0.30
      formula: "governance_compliance_rate"
    - name: override_penalty
      weight: -0.20
      formula: "override_rate"
    - name: experience_bonus
      weight: 0.10
      formula: "min(days_active / 90.0, 1.0)"
    - name: constitutional_penalty
      weight: -0.10
      formula: "min(constitutional_violations * 0.20, 1.0)"
  
  hard_rules:
    - condition: "constitutional_violations >= 3"
      action: cap_score_at(0.30)
      flag: HIGH_CONSTITUTIONAL_RISK
    - condition: "override_rate > 0.40"
      action: cap_score_at(0.50)
      flag: HIGH_OVERRIDE_RATE
  
  score_to_tier:
    ">= 0.90": 5
    ">= 0.75": 4
    ">= 0.60": 3
    ">= 0.45": 2
    default: 1
```

---

## Model Catalog Index

| Model ID | Name | Type | Owner | Status |
|---|---|---|---|---|
| DM-GOV-001 | Approval Tier Determination | TABLE | governance | ACTIVE |
| DM-GOV-002 | Constitutional Violation Severity | TABLE | governance | ACTIVE |
| DM-ROUTE-001 | Workflow Agent Routing | TREE | orchestrator | ACTIVE |
| DM-ROUTE-002 | Escalation Tier Routing | TABLE | delivery | ACTIVE |
| DM-HEALTH-001 | Agent Trust Score | SCORING | orchestrator | ACTIVE |
| DM-HEALTH-002 | Org Stress Classification | SCORING | analytics | ACTIVE |
| DM-CASE-001 | Case Priority Classification | TABLE | delivery | ACTIVE |
| DM-CASE-002 | Incident Severity Classification | TABLE | delivery | ACTIVE |

---

## Model Governance

```yaml
approval_requirements:
  new_model: architecture-lead + domain-lead
  MAJOR version bump: same as new_model + governance-lead
  MINOR version: domain-lead only
  
testing_requirements:
  minimum_test_cases: 10
  coverage:
    TABLE: all rules must have at least 1 passing test
    TREE: all leaf nodes must have at least 1 path test
    SCORING: boundary tests for each hard rule + normal range tests
  
  test_execution: automated in CI pipeline
  regression_test: all prior passing tests must still pass on new version
```
