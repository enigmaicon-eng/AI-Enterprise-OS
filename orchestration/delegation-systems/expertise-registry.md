---
layer: delegation-systems
type: expertise-registry
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Expertise Registry

The authoritative registry of agent expertise domains, capability profiles, and performance metrics used by the specialist-router to make delegation decisions.

**Update trigger:** New agent registered, agent performance metrics updated (weekly), agent role changed.

---

## Registry Format

Each agent entry:
```yaml
agent-id: "{agent-id}"
display-name: "{name}"
org: "{organization}"
tier: T{N}
routing-keys:
  primary: ["{key}"]
  secondary: ["{key}"]  # can handle but not primary
expertise-domains:
  primary: ["{domain}"]
  secondary: ["{domain}"]
expertise-tags:
  - "{specific-capability}"   # fine-grained capability descriptors
capability-profile:
  depth: EXPERT|PROFICIENT|CAPABLE  # within primary domains
  breadth: SPECIALIST|GENERALIST
  reasoning-intensity: HIGH|MEDIUM|LOW
  artifact-types-produced: ["{type}"]
performance-metrics:
  task-success-rate: {N}%      # rolling 30-day
  escalation-rate: {N}%        # how often escalates to higher tier
  peer-review-pass-rate: {N}%  # how often artifacts pass peer review
  avg-confidence-score: {N}    # average self-reported confidence
  last-updated: "{date}"
availability:
  current-load: LOW|MEDIUM|HIGH|OVERLOADED
  active-steps: {N}
  queue-depth: {N}
```

---

## Registered Agents (Representative Entries)

### knowledge-systems-architect-agent
```yaml
agent-id: knowledge-systems-architect-agent
org: Knowledge-Systems
tier: T3
routing-keys:
  primary: [knowledge-management]
  secondary: [meta, principal-architecture]
expertise-domains:
  primary: [knowledge-governance, memory-systems, context-engineering, ontology]
  secondary: [architecture, ai-native]
expertise-tags:
  - knowledge-lifecycle-governance
  - memory-federation-design
  - contradiction-resolution
  - synthesis-protocol-design
  - context-routing-architecture
  - ontology-maintenance
capability-profile:
  depth: EXPERT
  breadth: SPECIALIST
  reasoning-intensity: HIGH
  artifact-types-produced: [governance-protocol, knowledge-entry, wiki-page, ADR]
performance-metrics:
  task-success-rate: 95%
  escalation-rate: 5%
  peer-review-pass-rate: 98%
  avg-confidence-score: 88
  last-updated: "2026-05-10"
availability:
  current-load: MEDIUM
  active-steps: 1
  queue-depth: 0
```

### principal-architect-agent
```yaml
agent-id: principal-architect-agent
org: Architecture
tier: T2
routing-keys:
  primary: [principal-architecture]
  secondary: [technical-product, security-design]
expertise-domains:
  primary: [system-architecture, technical-design, ADR, dependency-analysis]
  secondary: [security-architecture, engineering]
expertise-tags:
  - system-topology-design
  - ADR-authoring
  - dependency-graph-analysis
  - architectural-risk-assessment
  - API-design
  - scalability-analysis
  - integration-architecture
capability-profile:
  depth: EXPERT
  breadth: SPECIALIST
  reasoning-intensity: HIGH
  artifact-types-produced: [ADR, RFC, architecture-doc, technical-spec]
performance-metrics:
  task-success-rate: 92%
  escalation-rate: 8%
  peer-review-pass-rate: 95%
  avg-confidence-score: 85
  last-updated: "2026-05-10"
availability:
  current-load: LOW
  active-steps: 0
  queue-depth: 0
```

### senior-pm-agent
```yaml
agent-id: senior-pm-agent
org: Product-Management
tier: T2
routing-keys:
  primary: [feature-requirements]
  secondary: [technical-product, strategic-product]
expertise-domains:
  primary: [product-requirements, user-stories, PRD, product-strategy]
  secondary: [product-analytics, go-to-market]
expertise-tags:
  - PRD-authoring
  - user-story-decomposition
  - acceptance-criteria-definition
  - product-prioritization
  - stakeholder-alignment
  - product-metrics-definition
capability-profile:
  depth: EXPERT
  breadth: SPECIALIST
  reasoning-intensity: MEDIUM
  artifact-types-produced: [PRD, user-story, initiative-brief, roadmap-update]
performance-metrics:
  task-success-rate: 90%
  escalation-rate: 15%
  peer-review-pass-rate: 88%
  avg-confidence-score: 80
  last-updated: "2026-05-10"
availability:
  current-load: LOW
  active-steps: 0
  queue-depth: 0
```

### security-architect-agent
```yaml
agent-id: security-architect-agent
org: Security
tier: T2
routing-keys:
  primary: [security-design]
  secondary: [compliance-review, feature-development]
expertise-domains:
  primary: [security-architecture, threat-modeling, OWASP, auth-design]
  secondary: [compliance, audit, penetration-concepts]
expertise-tags:
  - threat-model-authoring
  - OWASP-compliance-review
  - auth-flow-design
  - security-risk-assessment
  - vulnerability-analysis
  - security-gate-enforcement
  - data-privacy-design
capability-profile:
  depth: EXPERT
  breadth: SPECIALIST
  reasoning-intensity: HIGH
  artifact-types-produced: [threat-model, security-review, security-ADR, compliance-report]
performance-metrics:
  task-success-rate: 94%
  escalation-rate: 12%
  peer-review-pass-rate: 97%
  avg-confidence-score: 87
  last-updated: "2026-05-10"
availability:
  current-load: LOW
  active-steps: 0
  queue-depth: 0
```

### qa-lead-agent
```yaml
agent-id: qa-lead-agent
org: QA
tier: T2
routing-keys:
  primary: [quality-verification]
  secondary: [feature-development]
expertise-domains:
  primary: [test-strategy, quality-gates, acceptance-testing, test-planning]
  secondary: [performance-testing, security-testing]
expertise-tags:
  - test-plan-authoring
  - acceptance-criteria-validation
  - quality-gate-enforcement
  - defect-classification
  - regression-strategy
  - test-coverage-analysis
capability-profile:
  depth: EXPERT
  breadth: SPECIALIST
  reasoning-intensity: MEDIUM
  artifact-types-produced: [test-plan, quality-report, gate-decision, defect-report]
performance-metrics:
  task-success-rate: 93%
  escalation-rate: 7%
  peer-review-pass-rate: 96%
  avg-confidence-score: 86
  last-updated: "2026-05-10"
availability:
  current-load: LOW
  active-steps: 0
  queue-depth: 0
```

### master-orchestrator-agent
```yaml
agent-id: master-orchestrator-agent
org: Orchestration
tier: T3
routing-keys:
  primary: [all-intents]
  secondary: [delivery-coordination]
expertise-domains:
  primary: [orchestration, workflow-management, agent-coordination, task-decomposition]
  secondary: [meta, knowledge-management]
expertise-tags:
  - multi-agent-coordination
  - workflow-decomposition
  - routing-key-assignment
  - coordination-plan-building
  - escalation-management
  - cross-domain-orchestration
capability-profile:
  depth: EXPERT
  breadth: GENERALIST
  reasoning-intensity: HIGH
  artifact-types-produced: [coordination-plan, workflow-status, escalation-record]
performance-metrics:
  task-success-rate: 96%
  escalation-rate: 4%
  peer-review-pass-rate: 99%
  avg-confidence-score: 90
  last-updated: "2026-05-10"
availability:
  current-load: MEDIUM
  active-steps: 1
  queue-depth: 0
```

---

## Expertise Tag Taxonomy

Expertise tags are fine-grained capability descriptors for precise specialist matching. Standard tag categories:

### Artifact Production Tags
`{artifact-type}-authoring` — Agent can produce this artifact type as primary output
Examples: `PRD-authoring`, `ADR-authoring`, `threat-model-authoring`, `test-plan-authoring`

### Analysis Tags
`{domain}-analysis` — Agent can analyze problems in this domain
Examples: `architectural-risk-assessment`, `security-risk-assessment`, `dependency-graph-analysis`

### Process Tags
`{process}-enforcement` — Agent can enforce this process or gate
Examples: `quality-gate-enforcement`, `security-gate-enforcement`, `approval-gate-enforcement`

### Domain-Specific Tags
Free-form domain capability descriptors
Examples: `OWASP-compliance-review`, `CRDT-conflict-resolution`, `LLM-prompt-optimization`

---

## Registry Maintenance

### Weekly Update Triggers
- Performance metrics refreshed from workflow execution logs
- Availability recalculated from active dispatch counts
- New agents added after MASTER-REGISTRY.md registration

### Invalidation Events
- Agent tier changes → re-evaluate all performance metrics and routing keys
- Agent retirement → mark as RETIRED, remove from active routing
- Major performance drop (>20% task success decline) → flag for review

### Registry Integrity Check
Weekly cron verifies:
- All agents in MASTER-REGISTRY.md appear in this registry
- All routing keys in expertise-registry appear in routing-rules.md
- No agent has OVERLOADED availability for >72 hours (operational concern)