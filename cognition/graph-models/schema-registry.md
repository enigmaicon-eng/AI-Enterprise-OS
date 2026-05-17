---
layer: graph-models
type: schema-registry
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Graph Schema Registry

The authoritative definition of all node types and edge types in the Enterprise AI OS knowledge graph. This schema governs what can be represented in the graph and how relationships are expressed.

---

## Node Types

### AGENT
Represents an AI agent definition in the OS.

```
Properties:
  id: "{agent-id}"  (unique, matches agents/MASTER-REGISTRY.md)
  name: "{display name}"
  org: "{organization slug}"
  tier: {1-5}
  primary-routing-key: "{key}"
  status: "ACTIVE|DEPRECATED|PLANNED"
  agent-file: "{path to agent definition}"
  
Neo4j label: :Agent
```

### WORKFLOW
Represents a workflow definition.

```
Properties:
  id: "{workflow-id}"
  name: "{display name}"
  trigger: "{trigger condition}"
  step-count: N
  gate-count: N
  status: "PRODUCTION|LEGACY|PLANNED"
  workflow-file: "{path}"
  
Neo4j label: :Workflow
```

### WORKFLOW_INSTANCE
Represents a specific execution of a workflow.

```
Properties:
  id: "{instance-id}"
  workflow-id: "{workflow-id}"
  initiative-id: "{initiative-id}"
  status: "RUNNING|PAUSED|COMPLETED|FAILED"
  started-at: "{timestamp}"
  current-step: N
  
Neo4j label: :WorkflowInstance
```

### ARTIFACT_TYPE
Represents a class of artifacts (PRD, ADR, Runbook, etc.).

```
Properties:
  id: "{type-slug}"
  name: "{display name}"
  path-pattern: "{glob pattern}"
  schema-file: "{template path}"
  authority-agent: "{agent-id}"
  tier: {1-6}  (source-of-truth tier)
  
Neo4j label: :ArtifactType
```

### ARTIFACT
Represents a specific artifact instance.

```
Properties:
  id: "{UUID or path-based ID}"
  type: "{artifact-type-id}"
  path: "{canonical file path}"
  state: "DRAFT|ACTIVE|STALE|SUPERSEDED|ARCHIVED"
  produced-by: "{agent-id}"
  produced-at: "{timestamp}"
  version-hash: "{hash}"
  initiative-id: "{initiative-id}"
  
Neo4j label: :Artifact
```

### DECISION
Represents a recorded organizational decision.

```
Properties:
  id: "D-NNN or ADR-NNN"
  type: "ARCHITECTURAL|PRODUCT|PROCESS|GOVERNANCE"
  summary: "{one line}"
  status: "ACTIVE|SUPERSEDED|DEFERRED"
  decided-at: "{timestamp}"
  artifact-path: "{path to full decision record}"
  binding: true|false
  
Neo4j label: :Decision
```

### INITIATIVE
Represents a bounded unit of product or engineering work.

```
Properties:
  id: "{initiative-slug}"
  name: "{display name}"
  type: "FEATURE|MIGRATION|PLATFORM|RESEARCH|INCIDENT"
  status: "DISCOVERY|DEVELOPMENT|QA|RELEASED|SUNSET"
  tier: "XS|M|L"
  started-at: "{date}"
  target-completion: "{date}"
  prd-path: "{path}"
  
Neo4j label: :Initiative
```

### INTEGRATION
Represents an external system integration.

```
Properties:
  id: "{system-slug}"
  name: "{display name}"
  category: "{category}"
  status: "ACTIVE|PLANNED|DEGRADED|INACTIVE"
  mcp-available: true|false
  connector-file: "{path}"
  gap-ids: ["{gap-id}", ...]
  
Neo4j label: :Integration
```

### QUALITY_GATE
Represents a governance gate in a workflow.

```
Properties:
  id: "G{N}"
  name: "{display name}"
  type: "CHECKLIST|SCHEMA|AGENT_REVIEW|HUMAN|SECURITY"
  authority: "{agent-id}"
  overridable: true|false
  workflow-ids: ["{workflow-id}", ...]
  
Neo4j label: :QualityGate
```

### METRIC
Represents a tracked organizational metric.

```
Properties:
  id: "{metric-slug}"
  name: "{display name}"
  category: "DORA|QUALITY|AI|GOVERNANCE"
  formula: "{calculation}"
  target: "{value or range}"
  owner: "{agent-id}"
  measurement-path: "{where to find current value}"
  
Neo4j label: :Metric
```

### CAPABILITY_GAP
Represents a documented missing capability.

```
Properties:
  id: "GAP-INT-NNN"
  severity: "CRITICAL|HIGH|MEDIUM|LOW"
  status: "OPEN|IN_PROGRESS|RESOLVED"
  blocked-agents: ["{agent-id}", ...]
  owner: "{agent-id}"
  target-date: "{date}"
  
Neo4j label: :CapabilityGap
```

### INCIDENT
Represents a production incident.

```
Properties:
  id: "INC-{date}-{N}"
  severity: "P1|P2|P3|P4"
  status: "ACTIVE|MITIGATED|RESOLVED"
  triggered-at: "{timestamp}"
  resolved-at: "{timestamp}"
  mttr-minutes: N
  post-mortem-path: "{path}"
  
Neo4j label: :Incident
```

### RISK
Represents a tracked organizational risk.

```
Properties:
  id: "RISK-NNN"
  probability: "H|M|L"
  impact: "H|M|L"
  level: "CRITICAL|HIGH|MEDIUM|LOW"
  status: "ACTIVE|MITIGATED|CLOSED"
  owner: "{agent-id}"
  
Neo4j label: :Risk
```

---

## Edge Types

### PRODUCES
Direction: Agent → Artifact
Meaning: This agent is the authority producer of this artifact type.

```
Properties:
  workflow-id: "{in which workflow}"
  step-number: N
  Neo4j: (Agent)-[:PRODUCES]->(ArtifactType)
```

### CONSUMES
Direction: Agent → ArtifactType
Meaning: This agent requires this artifact type as input.

```
Properties:
  required: true|false  (is it blocking if missing?)
  Neo4j: (Agent)-[:CONSUMES]->(ArtifactType)
```

### GATES
Direction: QualityGate → WorkflowStep
Meaning: This gate must pass before this step can proceed.

```
Properties:
  blocking: true|false
  override-allowed: true|false
  Neo4j: (QualityGate)-[:GATES]->(Workflow)
```

### TRIGGERS
Direction: {Event or Artifact} → Workflow
Meaning: This event or artifact state triggers this workflow.

```
Properties:
  condition: "{trigger condition}"
  Neo4j: (Artifact|Event)-[:TRIGGERS]->(Workflow)
```

### DEPENDS_ON
Direction: Artifact → Artifact
Meaning: This artifact's correctness depends on this other artifact being current.

```
Properties:
  dependency-type: "HARD|SOFT"  (HARD = must be current; SOFT = should be current)
  Neo4j: (Artifact)-[:DEPENDS_ON]->(Artifact)
```

### SUPERSEDES
Direction: Decision → Decision
Meaning: This decision replaces the prior decision.

```
Properties:
  superseded-at: "{timestamp}"
  Neo4j: (Decision)-[:SUPERSEDES]->(Decision)
```

### IMPLEMENTS
Direction: Artifact → Decision
Meaning: This artifact is the implementation of this decision.

```
Neo4j: (Artifact)-[:IMPLEMENTS]->(Decision)
```

### GOVERNED_BY
Direction: {any entity} → {Decision or QualityGate}
Meaning: This entity's behavior is constrained by this decision or gate.

```
Neo4j: (Workflow|Agent|Integration)-[:GOVERNED_BY]->(Decision|QualityGate)
```

### RISKS
Direction: Initiative → Risk
Meaning: This initiative is subject to this risk.

```
Neo4j: (Initiative)-[:RISKS]->(Risk)
```

### BLOCKED_BY
Direction: Agent → CapabilityGap
Meaning: This agent's primary function is blocked by this gap.

```
Neo4j: (Agent)-[:BLOCKED_BY]->(CapabilityGap)
```

### AFFECTS
Direction: Incident → {Agent|Integration|Workflow}
Meaning: This incident affected this entity.

```
Neo4j: (Incident)-[:AFFECTS]->(Agent|Integration|Workflow)
```

### RELATES_TO
Direction: {any} → {any}
Meaning: General knowledge graph relationship for semantic proximity.

```
Properties:
  relationship-type: "{description}"
  strength: "STRONG|MODERATE|WEAK"
  Neo4j: (any)-[:RELATES_TO]->(any)
```

### COORDINATES_WITH
Direction: Agent → Agent
Meaning: This agent coordinates with this other agent in defined workflows.

```
Properties:
  workflows: ["{workflow-id}", ...]
  coordination-type: "SEQUENTIAL|PARALLEL|GATE"
  Neo4j: (Agent)-[:COORDINATES_WITH]->(Agent)
```
