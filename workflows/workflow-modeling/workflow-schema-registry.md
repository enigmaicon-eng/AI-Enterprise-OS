# Workflow Schema Registry

## Purpose
Centralized registry of all workflow input/output schemas, versioned independently of workflow definitions. Schemas are reusable across workflows and enable type-safe composition. Schema changes go through their own governance process.

---

## Schema Model

```yaml
schema:
  schema_id: "SCHEMA-DOMAIN-NNN"
  name: "Schema Name"
  version: "MAJOR.MINOR.PATCH"
  description: "what this schema represents"
  owner: "org-name"
  status: DRAFT | ACTIVE | DEPRECATED
  definition:
    type: object
    required: [field-names]
    properties:
      field_name:
        type: string | integer | number | boolean | object | array | "null"
        description: "field purpose"
        format: "date-time | uri | uuid | email | ..."
        enum: [values]       # optional
        minimum: N           # for numeric
        maximum: N
        minLength: N         # for string
        maxLength: N
        pattern: "regex"
        items:               # for array
          $ref: "SCHEMA-XXX"
        $ref: "SCHEMA-XXX"   # reference another schema
  examples:
    - name: "example name"
      value: {}
```

---

## Core Schema Catalog

### SCHEMA-COMMON-001 — Agent Identity
```yaml
schema_id: SCHEMA-COMMON-001
name: Agent Identity
version: 1.2.0
status: ACTIVE
definition:
  type: object
  required: [agent_id, org, trust_tier]
  properties:
    agent_id:
      type: string
      format: uuid
    name:
      type: string
    org:
      type: string
      description: Owning organizational unit
    trust_tier:
      type: integer
      minimum: 0
      maximum: 5
    capabilities:
      type: array
      items:
        type: string
    public_key:
      type: string
      description: Ed25519 public key for signature verification
```

---

### SCHEMA-COMMON-002 — Execution Context
```yaml
schema_id: SCHEMA-COMMON-002
name: Execution Context
version: 2.0.0
status: ACTIVE
definition:
  type: object
  required: [instance_id, dag_id, initiated_by, started_at]
  properties:
    instance_id:
      type: string
      format: uuid
    dag_id:
      type: string
    initiated_by:
      $ref: SCHEMA-COMMON-001
    started_at:
      type: string
      format: date-time
    correlation_id:
      type: string
      format: uuid
    parent_instance_id:
      type: string
      format: uuid
    governance:
      type: object
      properties:
        tier_required:
          type: integer
          minimum: 0
          maximum: 5
        constitutional_verdict:
          type: string
          enum: [PASS, CONDITIONAL, FAIL, PENDING]
        approvals:
          type: array
          items:
            $ref: SCHEMA-GOV-001
```

---

### SCHEMA-GOV-001 — Governance Approval
```yaml
schema_id: SCHEMA-GOV-001
name: Governance Approval Record
version: 1.1.0
status: ACTIVE
definition:
  type: object
  required: [approval_id, approver, decision, decided_at, artifact_id]
  properties:
    approval_id:
      type: string
      format: uuid
    approver:
      $ref: SCHEMA-COMMON-001
    decision:
      type: string
      enum: [APPROVED, REJECTED, NEEDS_INFO, ESCALATED, EXPIRED]
    decided_at:
      type: string
      format: date-time
    artifact_id:
      type: string
    rationale:
      type: string
      minLength: 10
      description: Required for REJECTED decisions
    tier:
      type: integer
      minimum: 1
      maximum: 5
    signature:
      type: string
      description: Ed25519 signature over (approval_id + artifact_id + decision + decided_at)
```

---

### SCHEMA-GOV-002 — Constitutional Evaluation Result
```yaml
schema_id: SCHEMA-GOV-002
name: Constitutional Evaluation Result
version: 1.0.0
status: ACTIVE
definition:
  type: object
  required: [evaluation_id, verdict, evaluated_at, evaluator_id]
  properties:
    evaluation_id:
      type: string
      format: uuid
    verdict:
      type: string
      enum: [PASS, CONDITIONAL, FAIL]
    evaluated_at:
      type: string
      format: date-time
    evaluator_id:
      type: string
      description: Agent ID that performed evaluation
    violations:
      type: array
      items:
        type: object
        required: [principle_id, description, severity]
        properties:
          principle_id:
            type: string
          description:
            type: string
          severity:
            type: string
            enum: [ABSOLUTE, MANDATORY, RECOMMENDED]
    conditions:
      type: array
      items:
        type: string
        description: Conditions that must be met for CONDITIONAL verdict
    confidence:
      type: number
      minimum: 0.0
      maximum: 1.0
```

---

### SCHEMA-CASE-001 — Case Definition
```yaml
schema_id: SCHEMA-CASE-001
name: Case Definition
version: 1.0.0
status: ACTIVE
definition:
  type: object
  required: [case_id, case_type, title, created_by, created_at, priority]
  properties:
    case_id:
      type: string
      format: uuid
    case_type:
      type: string
      enum: [ADAPTIVE, LONG_RUNNING, ESCALATION, INCIDENT, COLLABORATIVE]
    title:
      type: string
      maxLength: 200
    description:
      type: string
    priority:
      type: string
      enum: [CRITICAL, HIGH, NORMAL, LOW]
    created_by:
      $ref: SCHEMA-COMMON-001
    created_at:
      type: string
      format: date-time
    sla_deadline:
      type: string
      format: date-time
    status:
      type: string
      enum: [OPEN, IN_PROGRESS, WAITING, ESCALATED, RESOLVED, CLOSED]
    participants:
      type: array
      items:
        $ref: SCHEMA-COMMON-001
    artifacts:
      type: array
      items:
        type: string
        description: Artifact IDs associated with this case
    tags:
      type: array
      items:
        type: string
```

---

### SCHEMA-WF-001 — Workflow Completion Result
```yaml
schema_id: SCHEMA-WF-001
name: Workflow Completion Result
version: 1.0.0
status: ACTIVE
definition:
  type: object
  required: [instance_id, process_id, status, completed_at]
  properties:
    instance_id:
      type: string
      format: uuid
    process_id:
      type: string
    process_version:
      type: string
    status:
      type: string
      enum: [COMPLETED, FAILED, COMPENSATED, TERMINATED]
    completed_at:
      type: string
      format: date-time
    duration_ms:
      type: integer
    outputs:
      type: object
    error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        node_id:
          type: string
    sla_met:
      type: boolean
    governance_summary:
      type: object
      properties:
        approvals_count:
          type: integer
        constitutional_checks_passed:
          type: integer
        violations_count:
          type: integer
```

---

## Schema Governance

### Versioning Rules
```yaml
breaking_changes:      # require MAJOR version bump
  - removing required field
  - changing field type
  - removing enum value
  - narrowing validation (shorter maxLength, smaller maximum)

non_breaking_changes:  # allow MINOR version bump
  - adding optional field
  - adding enum value
  - widening validation
  - adding examples

patch_changes:         # PATCH version
  - description text updates
  - example updates only
```

### Schema Approval Requirements
```yaml
approval_matrix:
  COMMON schemas: governance-lead + architecture-lead
  GOV schemas: governance-lead + executive-sponsor
  CASE schemas: delivery-lead + governance-lead
  WF schemas: process-owner + architecture-lead
  new schema (any domain): 2 approvals + architecture review
```

---

## Schema Resolution at Runtime

```
resolve_schema(ref):
  if ref starts with "SCHEMA-":
    lookup in this registry by schema_id + latest ACTIVE version
  if ref is full_schema_id with version (e.g., "SCHEMA-GOV-001@1.0.0"):
    return exact version (for pinned dependencies)
  if ref not found:
    raise SchemaNotFound → ERR_SCHEMA_RESOLUTION_FAILED
```

Workflows SHOULD reference schemas without version pins (get latest ACTIVE). Workflows MAY pin to a specific version when strict input/output compatibility is required.
