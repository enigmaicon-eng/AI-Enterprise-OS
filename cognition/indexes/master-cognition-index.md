---
layer: cognition-indexes
type: inverted-index
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
authority: knowledge-systems-architect-agent
last-rebuilt: 2026-05-10
entry-count: 0
---

# Master Cognition Index

Primary inverted index: keyword/concept → files where that concept is authoritative or significantly referenced.

**Usage:** keyword lookup → file paths → targeted reads. Never scan all files — look up here first.

**Update trigger:** Any file added or significantly updated in warm or hot memory tier.

---

## Index Format

Each entry:
```
### {concept}
- `{file-path}` — {what this file says about the concept} [{priority: P0|P1|P2}]
```

Priority indicates how authoritative this file is for this concept.

---

## A

### ADR (Architecture Decision Record)
- `docs/governance/principles.md` — ADR policy, when ADRs are required, binding constraints rule [P0]
- `knowledge-governance/source-of-truth-hierarchy.md` — ADRs as T2 authority tier [P1]
- `knowledge-governance/artifact-authority-system.md` — ADR ownership, who can author and approve [P1]
- `graph-models/schema-registry.md` — DECISION node type, ADR schema [P2]
- `graph-models/organizational-intelligence-graph.md` — Decision-agent constraint graph [P2]

### Agent (AI Agent definition)
- `agents/MASTER-REGISTRY.md` — All 144 agents, routing keys, tiers, org assignments [P0]
- `orchestrator/master-orchestrator.md` — How agents are dispatched [P1]
- `knowledge-governance/artifact-authority-system.md` — Agent ownership of artifact types [P1]
- `graph-models/schema-registry.md` — AGENT node type, all properties [P1]
- `cognition-indexes/agent-cognition-index.md` — Agent-to-memory entry mapping [P2]

### Agent Dispatch
- `memory-routing/context-routing-engine.md` — Full dispatch pipeline, 6 phases [P0]
- `memory-routing/context-prioritization.md` — What context elements are included [P1]
- `memory-governance/context-compression-protocol.md` — Token budget enforcement [P1]
- `orchestrator/routing-rules.md` — Routing key to agent mapping [P1]

### Agent Lifecycle
- `lifecycle-models/agent-lifecycle.md` — Agent from definition to deprecation [P0]
- `agents/MASTER-REGISTRY.md` — Current agent states [P1]

### Agent Organization
- `agents/MASTER-REGISTRY.md` — 17 organizations, membership [P0]
- `SYSTEM.md` — Organization overview [P1]

### Artifact Authority
- `knowledge-governance/artifact-authority-system.md` — Full artifact authority registry [P0]
- `docs/governance/principles.md` — Artifact ownership principle [P1]
- `knowledge-governance/source-of-truth-hierarchy.md` — T6 workflow artifacts [P2]

### Artifact Schema
- `knowledge-governance/artifact-authority-system.md` — ATR YAML spec, immutability rules [P0]
- `templates/` — All artifact templates [P1]

### Anti-Drift (Knowledge Anti-Drift)
- `knowledge-governance/cross-agent-consistency-protocol.md` — Anti-drift protocol, 4 controls [P0]
- `memory-routing/context-routing-engine.md` — Anti-drift context controls [P1]
- `knowledge-governance/runtime-state-synchronization.md` — Drift detection during parallel execution [P2]

### Autonomous Continuation
- `memory-governance/continuity-checkpoint-system.md` — Criteria and sequence for autonomous continuation [P0]
- `knowledge-governance/runtime-state-synchronization.md` — Session-end sequence, autonomous handoff [P1]

---

## B

### Binding Constraint
- `docs/governance/principles.md` — Five immutable governance principles [P0]
- `knowledge-governance/source-of-truth-hierarchy.md` — T1-T2 binding constraints [P0]
- `memory-routing/context-prioritization.md` — Binding constraints = P0 context (never dropped) [P0]
- `knowledge-governance/cross-agent-consistency-protocol.md` — Constraint injection in every package [P1]

### Budget (Context Budget / Token Budget)
- `memory-governance/context-compression-protocol.md` — Budget table, enforcement rules [P0]
- `memory-routing/context-routing-engine.md` — Phase 5 budget check [P1]
- `memory-routing/context-prioritization.md` — Priority tiers and drop rules [P1]
- `ontology/runtime-vocabulary.md` — Token Budget definition [P2]

---

## C

### Capability Gap
- `integrations/CAPABILITY-GAP-TRACKER.md` — All 7 gaps, statuses, workarounds [P0]
- `architecture/strategic-gap-analysis.md` — 47 gaps, 9 CRITICAL [P0]
- `graph-models/schema-registry.md` — CAPABILITY_GAP node type [P1]
- `graph-models/dependency-graph.md` — Gap-blocked dependencies [P1]

### Checkpoint (Step/Session/Sprint)
- `memory-governance/continuity-checkpoint-system.md` — 3-level checkpoint hierarchy, full YAML specs [P0]
- `knowledge-governance/runtime-state-synchronization.md` — Step-level checkpoint sequence [P1]
- `ontology/runtime-vocabulary.md` — Checkpoint definition [P2]

### Circuit Breaker
- `ontology/runtime-vocabulary.md` — Circuit breaker definition [P1]
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — Integration circuit breaker patterns [P2]

### Cognition Graph
- `graph-models/enterprise-cognition-graph.md` — Full graph, node/edge inventory [P0]
- `graph-models/schema-registry.md` — Node/edge type definitions [P0]
- `graph-models/README.md` — Current status (markdown simulation), Neo4j migration plan [P1]

### Compression (Context Compression)
- `memory-governance/context-compression-protocol.md` — 5-stage compression algorithm [P0]
- `memory-routing/context-routing-engine.md` — Phase 5 compression trigger [P1]
- `memory-routing/context-prioritization.md` — What gets compressed vs. dropped [P1]
- `ontology/runtime-vocabulary.md` — Microcompact definition [P2]

### Consistency Anchor
- `knowledge-governance/cross-agent-consistency-protocol.md` — Consistency anchor YAML spec [P0]
- `memory-routing/context-routing-engine.md` — Phase 1 mandatory layer [P1]
- `memory-routing/context-prioritization.md` — Consistency anchor = P1 [P1]

### Constitution
- `constitution/enterprise-constitution.md` — Full constitution (DRAFT, not ratified) [P0]
- `knowledge-governance/source-of-truth-hierarchy.md` — T1 authority [P0]
- `docs/governance/principles.md` — Governance principles [P1]

### Contradiction Detection
- `knowledge-governance/contradiction-resolution-system.md` — 6 types, detection methods, resolution protocol [P0]
- `knowledge-governance/organizational-truth-reconciliation.md` — Reconciliation triggers and protocol [P1]
- `knowledge-governance/cross-agent-consistency-protocol.md` — Post-output contradiction check [P1]

### Context Package
- `memory-routing/context-routing-engine.md` — Package assembly, cache spec [P0]
- `memory-routing/organizational-context-federation.md` — Cross-domain context package YAML [P1]
- `ontology/knowledge-vocabulary.md` — Context Package definition [P2]

### CRDT (Conflict-Free Replicated Data Type)
- `knowledge-governance/contradiction-resolution-system.md` — CRDT merge rules for concurrent updates [P0]
- `knowledge-governance/runtime-state-synchronization.md` — Parallel execution concurrency rules [P1]
- `ontology/runtime-vocabulary.md` — CRDT definition [P2]

### Cron (Scheduled Workflows)
- `orchestrator/master-orchestrator.md` — Scheduled maintenance crons [P1]
- `ontology/workflow-vocabulary.md` — Cron Workflow definition [P2]

---

## D

### Decision Record
- `knowledge-governance/artifact-authority-system.md` — Decision record ownership and process [P0]
- `graph-models/organizational-intelligence-graph.md` — Decision-agent constraint graph [P1]
- `graph-models/schema-registry.md` — DECISION node type [P1]
- `handoffs/session-2026-05-09/important-decisions.md` — D-001 through D-014 [P2]

### Dependency Graph
- `graph-models/dependency-graph.md` — Full dependency registry [P0]
- `graph-models/schema-registry.md` — DEPENDS_ON, BLOCKED_BY edge types [P1]

### Dispatch Tier (T0/T1/T2)
- `memory-routing/context-routing-engine.md` — Tier selection, task complexity score formula [P0]
- `memory-governance/context-compression-protocol.md` — Budget by tier [P1]
- `ontology/workflow-vocabulary.md` — Dispatch Tier definitions [P2]

### Domain (Knowledge Domain)
- `memory-routing/context-routing-engine.md` — Routing key → domain mapping table [P0]
- `memory-routing/organizational-context-federation.md` — Domain namespace federation [P1]
- `memory-governance/federated-memory-architecture.md` — Domain namespace definitions [P1]
- `knowledge-governance/cross-agent-consistency-protocol.md` — Raft leader per domain table [P2]

---

## E

### Event (System Events)
- `ontology/event-vocabulary.md` — Complete event namespace taxonomy, all event types [P0]
- `knowledge-governance/runtime-state-synchronization.md` — Event emission at step completion [P1]
- `integrations/CAPABILITY-GAP-TRACKER.md` — GAP-INT-005 event bus gap [P1]

### EWC Check (Elastic Weight Consolidation)
- `knowledge-governance/knowledge-lifecycle-system.md` — EWC check before archival [P0]
- `memory-governance/long-context-preservation.md` — EWC-guided preservation algorithm [P1]
- `ontology/knowledge-vocabulary.md` — EWC Check definition [P2]

---

## F

### Federated Memory
- `memory-governance/federated-memory-architecture.md` — Federation topology, protocol [P0]
- `memory-routing/organizational-context-federation.md` — Cross-domain context federation [P0]
- `ontology/knowledge-vocabulary.md` — Memory Federation definition [P2]

---

## G

### Governance
- `docs/governance/principles.md` — Five immutable principles [P0]
- `constitution/enterprise-constitution.md` — Constitutional authority [P0]
- `knowledge-governance/README.md` — Knowledge governance system overview [P1]
- `knowledge-governance/source-of-truth-hierarchy.md` — Governance authority hierarchy [P1]

### Graph (Knowledge Graph)
- `graph-models/README.md` — Graph system overview [P0]
- `graph-models/schema-registry.md` — All node/edge types [P0]
- `graph-models/enterprise-cognition-graph.md` — Current graph state [P1]
- `memory-routing/context-routing-engine.md` — Phase 4 graph recommendations [P2]

---

## H

### Handoff (Session Handoff)
- `handoffs/session-2026-05-09/` — Session handoff package [P0]
- `memory-governance/continuity-checkpoint-system.md` — Handoff generation protocol [P1]
- `knowledge-governance/cross-agent-consistency-protocol.md` — Cross-session consistency handoff YAML [P1]

### Human Gate
- `docs/governance/principles.md` — Human-required gates policy [P0]
- `memory-routing/context-prioritization.md` — Human gate marker = P0 (never dropped) [P0]
- `workflows/` — Gate markers in workflow definitions [P1]

---

## I

### Initiative
- `graph-models/schema-registry.md` — INITIATIVE node type [P1]
- `graph-models/enterprise-cognition-graph.md` — Initiative nodes in cognition graph [P1]

### Integration
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — All 33 integrations [P0]
- `integrations/CAPABILITY-GAP-TRACKER.md` — 7 gaps [P0]
- `graph-models/schema-registry.md` — INTEGRATION node type [P1]
- `graph-models/dependency-graph.md` — Integration dependency matrix [P1]

### Incident
- `graph-models/schema-registry.md` — INCIDENT node type [P1]
- `ontology/event-vocabulary.md` — incident.triggered/resolved events [P1]
- `memory-routing/context-prioritization.md` — Incident response routing key override [P2]

---

## K

### Knowledge Governance
- `knowledge-governance/README.md` — Full system overview [P0]
- `knowledge-governance/source-of-truth-hierarchy.md` — 7-tier hierarchy [P0]
- `knowledge-governance/knowledge-lifecycle-system.md` — Lifecycle states and transitions [P0]

### Knowledge Graph
- `graph-models/` — Full graph system [P0]

### Knowledge Lifecycle
- `knowledge-governance/knowledge-lifecycle-system.md` — State machine, all transitions [P0]
- `memory-governance/long-context-preservation.md` — 3-tier access model and lifecycle [P1]
- `ontology/knowledge-vocabulary.md` — Knowledge lifecycle states [P2]

### Knowledge Synthesis
- `ontology/knowledge-vocabulary.md` — Synthesis pipeline (RETRIEVE/JUDGE/DISTILL/CONSOLIDATE) [P0]
- `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history and lineage [P0]
- `knowledge-governance/organizational-truth-reconciliation.md` — Reconciliation as synthesis [P1]

---

## L

### Lifecycle (Knowledge/Agent/Workflow)
- `lifecycle-models/knowledge-lifecycle.md` — Knowledge lifecycle model [P0]
- `lifecycle-models/agent-lifecycle.md` — Agent lifecycle model [P0]
- `knowledge-governance/knowledge-lifecycle-system.md` — Knowledge state machine [P1]

### Loop Detection
- `ontology/workflow-vocabulary.md` — Loop Detection definition (>3 visits = loop) [P0]
- `memory-governance/continuity-checkpoint-system.md` — Step-level loop detection [P1]

---

## M

### Master Registry
- `agents/MASTER-REGISTRY.md` — 144 agents, v3.0.0 [P0]
- `integrations/MASTER-INTEGRATION-REGISTRY.md` — 33 integrations [P0]
- `knowledge-governance/source-of-truth-hierarchy.md` — T3 master registries [P1]

### Maturity Model
- `architecture/enterprise-maturity-model.md` — 12 dimensions, current 2.3/5 [P0]
- `architecture/organizational-evolution-roadmap.md` — 4-phase roadmap [P1]

### Memory
- `memory/MEMORY_INDEX.md` — Memory entry index [P0]
- `memory-governance/README.md` — Memory governance overview [P0]
- `memory-governance/federated-memory-architecture.md` — Memory architecture [P0]

### Memory Namespace
- `memory-governance/federated-memory-architecture.md` — Namespace definitions [P0]
- `memory-routing/organizational-context-federation.md` — Namespace access control [P0]
- `ontology/knowledge-vocabulary.md` — Memory Namespace definition [P2]

### Memory Routing
- `memory-routing/README.md` — Routing system overview [P0]
- `memory-routing/context-routing-engine.md` — Full engine spec [P0]

### Memory Tier (Hot/Warm/Cold)
- `memory-governance/long-context-preservation.md` — 3-tier model, size limits [P0]
- `ontology/knowledge-vocabulary.md` — Hot/Warm/Cold tier definitions [P1]

---

## O

### Ontology
- `ontology/README.md` — Ontology system overview [P0]
- `ontology/core-concepts.md` — Core concept definitions [P0]
- `ontology/workflow-vocabulary.md` — Workflow terms [P1]
- `ontology/knowledge-vocabulary.md` — Knowledge terms [P1]
- `ontology/runtime-vocabulary.md` — Runtime terms [P1]
- `ontology/event-vocabulary.md` — Event terms [P1]

### Open Questions
- `memory/open-questions.md` — Q-001 through Q-008 [P0]

### Orchestrator
- `orchestrator/master-orchestrator.md` — Master orchestrator spec [P0]
- `orchestrator/routing-rules.md` — Routing key → agent mapping [P0]

### Organizational Context Federation
- `memory-routing/organizational-context-federation.md` — Federation protocol [P0]
- `memory-governance/federated-memory-architecture.md` — Federation architecture [P1]

---

## P

### Permission (Memory Permission Tiers)
- `memory-governance/federated-memory-architecture.md` — OPEN/RESTRICTED/CONFIDENTIAL/CLASSIFIED [P0]
- `memory-routing/organizational-context-federation.md` — Permission gate table [P0]
- `docs/governance/principles.md` — Security access control policy [P1]

### Priority (Context Priority)
- `memory-routing/context-prioritization.md` — P0-P4 priority tiers [P0]
- `memory-routing/context-routing-engine.md` — Priority enforcement in assembly [P1]

---

## Q

### Quality Gate
- `docs/governance/principles.md` — Quality gate policy [P0]
- `graph-models/schema-registry.md` — QUALITY_GATE node type [P1]
- `workflows/` — Gate definitions in workflow files [P1]

---

## R

### Raft Leader (Domain Truth Arbitration)
- `knowledge-governance/cross-agent-consistency-protocol.md` — Raft leader table by domain [P0]
- `memory-routing/context-routing-engine.md` — Raft leader context injection [P1]
- `ontology/runtime-vocabulary.md` — Raft Leader definition [P2]

### Relevance Score
- `memory-routing/context-routing-engine.md` — Phase 2 relevance scoring [P0]
- `memory-routing/context-prioritization.md` — Relevance adjustment formulas [P1]
- `memory-governance/context-compression-protocol.md` — Relevance factor in compression [P1]

### Risk Registry
- `memory/known-risks.md` — RISK-001 through RISK-016 [P0]
- `architecture/strategic-gap-analysis.md` — 47 gaps, 9 CRITICAL [P0]
- `graph-models/schema-registry.md` — RISK node type [P1]

### Routing Key
- `orchestrator/routing-rules.md` — All routing keys and mappings [P0]
- `memory-routing/context-routing-engine.md` — Routing key → domain mapping table [P0]
- `agents/MASTER-REGISTRY.md` — Routing key per agent [P1]

### Run-Context
- `knowledge-governance/runtime-state-synchronization.md` — Run-context YAML spec [P0]
- `memory-governance/continuity-checkpoint-system.md` — Run-context in session checkpoint [P0]
- `ontology/runtime-vocabulary.md` — Run-Context definition [P1]

---

## S

### Security
- `docs/governance/principles.md` — Security policy [P0]
- `memory-routing/context-prioritization.md` — Security constraints = P0 [P0]
- `memory-routing/organizational-context-federation.md` — RESTRICTED namespace for security [P1]

### Semantic Cluster
- `cognition-indexes/semantic-clusters/` — All 6 cluster files [P0]
- `cognition-indexes/README.md` — Cluster architecture [P1]
- `ontology/knowledge-vocabulary.md` — Semantic Cluster definition [P2]

### Session Boundary
- `knowledge-governance/runtime-state-synchronization.md` — Session-start and session-end sync [P0]
- `memory-governance/continuity-checkpoint-system.md` — Session checkpoint [P0]
- `ontology/runtime-vocabulary.md` — Session Boundary definition [P1]

### Source of Truth
- `knowledge-governance/source-of-truth-hierarchy.md` — Full 7-tier hierarchy [P0]
- `knowledge-governance/organizational-truth-reconciliation.md` — Reconciliation protocol [P1]

### Sprint Learning Capsule
- `memory-governance/long-context-preservation.md` — Capsule YAML spec [P0]
- `memory-routing/context-prioritization.md` — Sprint capsule priority P4 (P3 if initiative-specific) [P2]

### State Machine
- `state-models/agent-execution-states.md` — Agent state machine [P0]
- `state-models/knowledge-states.md` — Knowledge state machine [P0]
- `state-models/session-states.md` — Session state machine [P0]
- `knowledge-governance/knowledge-lifecycle-system.md` — Knowledge state transitions [P1]

### Synthesis Index
- `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history and lineage [P0]

---

## T

### Token Budget
- `memory-governance/context-compression-protocol.md` — T0-T3 budget table [P0]
- `memory-routing/context-routing-engine.md` — Budget enforcement [P1]
- `ontology/runtime-vocabulary.md` — Token Budget definition [P1]

### Truth Reconciliation
- `knowledge-governance/organizational-truth-reconciliation.md` — Full protocol [P0]
- `knowledge-governance/contradiction-resolution-system.md` — Contradiction types and resolution [P1]

---

## V

### Vocabulary (Ontology Terms)
- `ontology/workflow-vocabulary.md` — Workflow terms [P0]
- `ontology/knowledge-vocabulary.md` — Knowledge terms [P0]
- `ontology/runtime-vocabulary.md` — Runtime terms [P0]
- `ontology/event-vocabulary.md` — Event terms [P0]
- `ontology/core-concepts.md` — Core concepts [P0]

---

## W

### Wiki
- `wiki/` — Full organizational wiki [P0]
- `wiki/knowledge/README.md` — Knowledge wiki governance [P1]

### Workflow
- `workflows/` — All 7 production workflows [P0]
- `orchestrator/master-orchestrator.md` — Workflow dispatch [P0]
- `ontology/workflow-vocabulary.md` — Workflow vocabulary [P1]
- `graph-models/schema-registry.md` — WORKFLOW and WORKFLOW_INSTANCE node types [P1]

### Workflow State
- `state-models/session-states.md` — Session state machine [P0]
- `knowledge-governance/runtime-state-synchronization.md` — Workflow state sync protocol [P0]
- `memory-governance/continuity-checkpoint-system.md` — Step and session checkpoints [P0]

---

## Index Metadata

```yaml
index-stats:
  total-concepts: 52
  total-file-references: ~210
  coverage: warm-tier and hot-tier files
  last-rebuilt: 2026-05-10
  next-scheduled-rebuild: 2026-05-17 (weekly)
  rebuild-owner: knowledge-systems-engineer-agent
  
coverage-gaps:
  - wiki/ pages (not yet fully indexed — wiki system under construction)
  - state-models/ (files pending creation)
  - lifecycle-models/ (files pending creation)
  - templates/ (individual templates not indexed)
```