---
layer: cognition-indexes
type: agent-index
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
authority: knowledge-systems-architect-agent
last-rebuilt: 2026-05-10
agent-count: 144
---

# Agent Cognition Index

Maps agent IDs → recommended memory entries for that agent's primary tasks.

**Usage:** Agent dispatch → look up agent-id here → load listed memory entries as domain context.

**Update trigger:** New agent added, agent role changes, new domain memory entry created.

---

## Index Format

Each entry:
```
### {agent-id}
routing-key: {key}
org: {organization}
tier: T{N}
domain-memory:
  - `{path}` — {why this agent needs this} [{importance: CRITICAL|HIGH|NORMAL}]
cross-domain-reads:
  - domain: {domain}, tier: {permission-tier}, files: [{path}]
```

---

## T5 — Constitutional Tier

### enterprise-constitution-guardian-agent
routing-key: constitutional-review
org: Governance-Council
tier: T5
domain-memory:
  - `constitution/enterprise-constitution.md` — Primary authority document [CRITICAL]
  - `docs/governance/principles.md` — Five immutable principles [CRITICAL]
  - `knowledge-governance/source-of-truth-hierarchy.md` — Authority hierarchy it governs [CRITICAL]
  - `knowledge-governance/contradiction-resolution-system.md` — Constitutional conflicts [HIGH]
  - `memory/known-risks.md` — Governance risks [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN — Constitutional review requires full visibility

### vp-engineering-agent
routing-key: principal-architecture
org: Enterprise-Leadership
tier: T4
domain-memory:
  - `architecture/strategic-gap-analysis.md` — 47 gaps requiring leadership decisions [CRITICAL]
  - `architecture/enterprise-maturity-model.md` — Current 2.3/5 maturity [CRITICAL]
  - `architecture/organizational-evolution-roadmap.md` — 4-phase roadmap [CRITICAL]
  - `integrations/CAPABILITY-GAP-TRACKER.md` — 7 gaps including 2 CRITICAL [HIGH]
  - `memory/known-risks.md` — RISK-001 through RISK-016 [HIGH]
  - `handoffs/session-2026-05-09/important-decisions.md` — D-001 through D-014 [HIGH]
cross-domain-reads:
  - domain: engineering, tier: RESTRICTED
  - domain: security, tier: RESTRICTED

---

## T4 — Strategic Tier

### vp-product-agent
routing-key: strategic-product
org: Product-Leadership
tier: T4
domain-memory:
  - `memory/open-questions.md` — Q-001 through Q-005 blocking product work [CRITICAL]
  - `architecture/organizational-evolution-roadmap.md` — Product roadmap alignment [CRITICAL]
  - `wiki/product/` — Product domain wiki [HIGH]
  - `docs/governance/principles.md` — Governance principles for product decisions [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN
  - domain: finance, tier: CONFIDENTIAL

### chief-architect-agent
routing-key: principal-architecture
org: Architecture-Council
tier: T4
domain-memory:
  - `architecture/strategic-gap-analysis.md` — Full gap analysis [CRITICAL]
  - `architecture/enterprise-maturity-model.md` — Maturity dimensions [CRITICAL]
  - `graph-models/enterprise-cognition-graph.md` — System topology [CRITICAL]
  - `graph-models/dependency-graph.md` — Critical path and dependencies [HIGH]
  - `graph-models/schema-registry.md` — All node/edge types [HIGH]
  - `knowledge-governance/source-of-truth-hierarchy.md` — Authority chain [HIGH]
  - `handoffs/session-2026-05-09/important-decisions.md` — All binding decisions [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN

---

## T3 — Orchestration Tier

### master-orchestrator-agent
routing-key: all-intents
org: Orchestration
tier: T3
domain-memory:
  - `orchestrator/master-orchestrator.md` — Orchestration logic [CRITICAL]
  - `orchestrator/routing-rules.md` — All routing rules [CRITICAL]
  - `agents/MASTER-REGISTRY.md` — All 144 agents [CRITICAL]
  - `knowledge-governance/runtime-state-synchronization.md` — Session sync protocol [CRITICAL]
  - `memory-governance/continuity-checkpoint-system.md` — Checkpoint management [HIGH]
  - `knowledge-governance/cross-agent-consistency-protocol.md` — Anti-drift controls [HIGH]
  - `memory/open-questions.md` — Q-001 through Q-008 [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN (meta domain)

### knowledge-systems-architect-agent
routing-key: knowledge-management
org: Knowledge-Systems
tier: T3
domain-memory:
  - `knowledge-governance/README.md` — Knowledge governance overview [CRITICAL]
  - `knowledge-governance/source-of-truth-hierarchy.md` — 7-tier hierarchy [CRITICAL]
  - `knowledge-governance/contradiction-resolution-system.md` — Contradiction protocol [CRITICAL]
  - `knowledge-governance/artifact-authority-system.md` — Artifact authority registry [CRITICAL]
  - `memory-governance/README.md` — Memory governance [CRITICAL]
  - `memory-routing/README.md` — Routing system [CRITICAL]
  - `ontology/README.md` — Ontology overview [CRITICAL]
  - `cognition-indexes/README.md` — Index architecture [HIGH]
  - `graph-models/README.md` — Graph system [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN

### organizational-learning-agent
routing-key: knowledge-management
org: Knowledge-Systems
tier: T3
domain-memory:
  - `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history [CRITICAL]
  - `knowledge-governance/organizational-truth-reconciliation.md` — Reconciliation protocol [CRITICAL]
  - `knowledge-governance/knowledge-lifecycle-system.md` — Knowledge states [CRITICAL]
  - `memory-governance/long-context-preservation.md` — Preservation algorithm [HIGH]
  - `memory-governance/continuity-checkpoint-system.md` — Sprint learning capsule [HIGH]
  - `wiki/` — All wiki pages for synthesis [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN (learning agent needs all knowledge)

### agent-coordination-agent
routing-key: delivery-coordination
org: Orchestration
tier: T3
domain-memory:
  - `agents/MASTER-REGISTRY.md` — All agent capabilities [CRITICAL]
  - `memory-routing/organizational-context-federation.md` — Federation for multi-agent tasks [CRITICAL]
  - `knowledge-governance/runtime-state-synchronization.md` — Parallel sync protocol [HIGH]
  - `memory-routing/context-routing-engine.md` — Dispatch engine [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN

---

## T2 — Domain Tier

### senior-pm-agent
routing-key: feature-requirements
org: Product-Management
tier: T2
domain-memory:
  - `memory/open-questions.md` — Q-001 through Q-005 (blocking product work) [CRITICAL]
  - `memory/domains/product/` — Product domain memory [CRITICAL]
  - `wiki/product/` — Product wiki [HIGH]
  - `docs/governance/principles.md` — Governance constraints on PRDs [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN, files: [ADR binding constraints, technical risks]

### technical-pm-agent
routing-key: technical-product
org: Product-Management
tier: T2
domain-memory:
  - `memory/open-questions.md` — Q-001 through Q-005 [CRITICAL]
  - `memory/domains/product/` — Product memory [CRITICAL]
  - `integrations/MASTER-INTEGRATION-REGISTRY.md` — Integration capabilities for technical PRDs [HIGH]
  - `integrations/CAPABILITY-GAP-TRACKER.md` — Gap limitations [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN
  - domain: security, tier: RESTRICTED (for security-sensitive features)

### principal-architect-agent
routing-key: principal-architecture
org: Architecture
tier: T2
domain-memory:
  - `architecture/strategic-gap-analysis.md` — Gaps and risks [CRITICAL]
  - `graph-models/enterprise-cognition-graph.md` — System graph [CRITICAL]
  - `graph-models/dependency-graph.md` — Dependencies [CRITICAL]
  - `graph-models/schema-registry.md` — Schema definitions [HIGH]
  - `handoffs/session-2026-05-09/important-decisions.md` — Architectural decisions [HIGH]
  - `knowledge-governance/source-of-truth-hierarchy.md` — Authority hierarchy [HIGH]
cross-domain-reads:
  - domain: security, tier: RESTRICTED
  - domain: engineering, tier: OPEN

### backend-engineer-agent
routing-key: feature-development
org: Engineering
tier: T2
domain-memory:
  - `memory/domains/engineering/` — Engineering memory [CRITICAL]
  - `integrations/MASTER-INTEGRATION-REGISTRY.md` — Available integrations [HIGH]
  - `integrations/CAPABILITY-GAP-TRACKER.md` — Gap workarounds [HIGH]
  - `docs/governance/principles.md` — Engineering governance [HIGH]
cross-domain-reads:
  - domain: security, tier: RESTRICTED, files: [OWASP constraints, security decisions]
  - domain: product, tier: OPEN, files: [relevant PRD sections]

### frontend-engineer-agent
routing-key: feature-development
org: Engineering
tier: T2
domain-memory:
  - `memory/domains/engineering/` — Engineering memory [CRITICAL]
  - `docs/governance/principles.md` — Governance [HIGH]
cross-domain-reads:
  - domain: product, tier: OPEN, files: [UX specs, product requirements]

### security-architect-agent
routing-key: security-design
org: Security
tier: T2
domain-memory:
  - `memory/domains/security/` — Security domain memory (RESTRICTED) [CRITICAL]
  - `docs/governance/principles.md` — Security policy [CRITICAL]
  - `integrations/MASTER-INTEGRATION-REGISTRY.md` — Auth patterns for integrations [HIGH]
  - `architecture/strategic-gap-analysis.md` — Security-related gaps [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN
  - domain: legal, tier: CONFIDENTIAL (for compliance-relevant security decisions)

### qa-lead-agent
routing-key: quality-verification
org: QA
tier: T2
domain-memory:
  - `memory/domains/engineering/` — Engineering memory [HIGH]
  - `docs/governance/principles.md` — Quality gate policy [CRITICAL]
  - `memory/organizational/quality-standards.md` — Quality standards [CRITICAL]
  - `observability/metrics.md` — Quality metrics [HIGH]
cross-domain-reads:
  - domain: product, tier: OPEN, files: [acceptance criteria in PRDs]

### knowledge-systems-engineer-agent
routing-key: knowledge-management
org: Knowledge-Systems
tier: T2
domain-memory:
  - `cognition-indexes/README.md` — Index architecture [CRITICAL]
  - `cognition-indexes/master-cognition-index.md` — Primary index [CRITICAL]
  - `cognition-indexes/agent-cognition-index.md` — This file [CRITICAL]
  - `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history [CRITICAL]
  - `memory-governance/README.md` — Memory governance [HIGH]
  - `memory/MEMORY_INDEX.md` — Memory entry index [HIGH]
  - `knowledge-governance/knowledge-lifecycle-system.md` — Lifecycle rules [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN (index covers all domains)

### compliance-governance-agent
routing-key: compliance-review
org: Governance-Council
tier: T2
domain-memory:
  - `constitution/enterprise-constitution.md` — Constitutional requirements [CRITICAL]
  - `docs/governance/principles.md` — Five principles [CRITICAL]
  - `memory/domains/legal/` — Legal and compliance memory (CLASSIFIED) [CRITICAL]
  - `memory-routing/organizational-context-federation.md` — Federation audit log [HIGH]
cross-domain-reads:
  - domain: ALL, tier: CONFIDENTIAL (compliance review needs broad access)

### delivery-lead-agent
routing-key: delivery-coordination
org: Delivery
tier: T2
domain-memory:
  - `memory/organizational/` — Organizational state memory [CRITICAL]
  - `handoffs/session-2026-05-09/workflow-status.md` — Workflow states [HIGH]
  - `agents/MASTER-REGISTRY.md` — Agent availability [HIGH]
  - `graph-models/dependency-graph.md` — Critical path [HIGH]
cross-domain-reads:
  - domain: product, tier: OPEN
  - domain: engineering, tier: OPEN

### data-engineer-agent
routing-key: data-pipeline
org: Analytics
tier: T2
domain-memory:
  - `integrations/MASTER-INTEGRATION-REGISTRY.md` — Data integrations [CRITICAL]
  - `integrations/CAPABILITY-GAP-TRACKER.md` — GAP-INT-004 (Looker write) [HIGH]
  - `memory/domains/analytics/` — Analytics memory [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN

### fintech-pm-agent
routing-key: financial-product
org: Product-Management
tier: T2
domain-memory:
  - `memory/domains/finance/` — Finance memory (CONFIDENTIAL) [CRITICAL]
  - `memory/open-questions.md` — Q-001 through Q-005 [HIGH]
  - `memory/domains/product/` — Product memory [HIGH]
cross-domain-reads:
  - domain: legal, tier: CONFIDENTIAL, files: [regulatory requirements, compliance constraints]

---

## T1 — Execution Tier

### junior-engineer-agent
routing-key: feature-development
org: Engineering
tier: T1
domain-memory:
  - `memory/domains/engineering/` — Engineering memory [HIGH]
  - `docs/governance/principles.md` — Development governance [NORMAL]
cross-domain-reads:
  - domain: product, tier: OPEN, files: [task specifications]

### documentation-agent
routing-key: documentation
org: Engineering
tier: T1
domain-memory:
  - `wiki/` — All wiki pages (read/write access) [CRITICAL]
  - `memory/domains/engineering/` — Source of truth for docs [HIGH]
cross-domain-reads:
  - domain: product, tier: OPEN
  - domain: architecture, tier: OPEN

### test-engineer-agent
routing-key: quality-verification
org: QA
tier: T1
domain-memory:
  - `memory/organizational/quality-standards.md` — Quality standards [CRITICAL]
  - `docs/governance/principles.md` — Quality gate policy [HIGH]
cross-domain-reads:
  - domain: engineering, tier: OPEN, files: [test specifications]

---

## Special Purpose Agents

### context-routing-engine-agent
routing-key: system-meta
org: Knowledge-Systems
tier: T3
domain-memory:
  - `memory-routing/context-routing-engine.md` — Engine spec [CRITICAL]
  - `memory-routing/context-prioritization.md` — Priority rules [CRITICAL]
  - `memory-routing/organizational-context-federation.md` — Federation protocol [CRITICAL]
  - `memory-routing/active-context-routing.md` — Real-time routing [CRITICAL]
  - `memory-routing/runtime-context-synchronization.md` — Parallel sync [CRITICAL]
  - `cognition-indexes/master-cognition-index.md` — Keyword index [HIGH]
  - `cognition-indexes/agent-cognition-index.md` — Agent index (this file) [HIGH]
  - `cognition-indexes/semantic-clusters/` — All cluster files [HIGH]
cross-domain-reads:
  - domain: ALL, tier: OPEN (routing engine serves all domains)

---

## Index Metadata

```yaml
index-stats:
  agents-indexed: 20  # representative subset; full 144-agent index in agents/MASTER-REGISTRY.md
  total-agents: 144
  indexing-approach: priority-agents-first
  last-rebuilt: 2026-05-10
  next-scheduled-rebuild: 2026-05-17 (weekly)
  
indexing-notes:
  - "All 144 agents inherit routing-key → domain mapping from context-routing-engine.md"
  - "Agents not explicitly listed here use default domain memory for their routing key"
  - "The agents/MASTER-REGISTRY.md is the source of truth for agent existence and routing keys"
  - "This index captures the most important memory entries per agent; it is not exhaustive"
  
update-protocol:
  trigger: "New agent added OR new domain memory entry created"
  owner: knowledge-systems-engineer-agent
  method: "Add agent entry with domain-memory list derived from routing key"
```