---
layer: graph-models
type: organizational-intelligence-graph
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
status: active
---

# Organizational Intelligence Graph

The agent-and-decision-centric view of the Enterprise AI OS. This graph answers: "Who knows what? Who works with whom? Which agents are downstream of a given decision? Which decisions constrain which agents?"

---

## Agent Coordination Topology

The inter-agent coordination map, organized by how agents interact:

```
TIER 5 — CONSTITUTIONAL (human-equivalent authority)
  executive-governance-council
  organizational-strategy-council
  caio-agent
  cpo-agent ─────────────────────────────────────────────────────────┐
  cto-agent ─────────────────────────────────────────────────────────┤
                                                                      │
TIER 4 — STRATEGIC (domain authority)                                 │
  vp-product-agent ────────────────────────────────────────────┐      │
  vp-engineering-agent ────────────────────────────────────────┤      │
  vp-delivery-agent                                            │      │
  enterprise-architecture-council ─────────────────────────────┤      │
  vp-platform-agent                                            │      │
                                                               │      │
TIER 3 — ORCHESTRATION (OS backbone)                           │      │
  executive-orchestrator-agent ◄────────────────────────────────┘ ◄───┘
    │ routes to
    ├── workflow-routing-agent
    ├── knowledge-systems-architect-agent ◄─── knowledge authority
    ├── cross-agent-continuity-agent ◄───────── session continuity
    ├── hallucination-detection-agent ◄────────── consistency check
    └── runtime-coordination-agent
    
TIER 2 — DOMAIN (execution authority)
  ┌─ product: [senior-pm, group-pm, platform-pm, technical-pm, ai-pm ...]
  ├─ architecture: [principal-architect, enterprise-architect, api-architect ...]
  ├─ engineering: [distinguished-engineer, frontend, backend, ai-engineer ...]
  ├─ qa: [qa-agent, security-qa, performance-qa, ai-evaluation-qa ...]
  ├─ delivery: [delivery-manager, program-manager, release-governance ...]
  ├─ governance: [risk-management, compliance, audit, ai-safety ...]
  └─ [+ 11 other domain organizations]
  
TIER 1 — AUTONOMOUS (execution without approval)
  frontend-engineer-agent
  backend-engineer-agent
  (when assigned XS/M-tier tasks with accepted ADR)
```

---

## Knowledge Domain Ownership Matrix

Which agents own which knowledge domains:

| Knowledge Domain | Primary Owner | Secondary Owner | Cross-Links To |
|---|---|---|---|
| Agent definitions & routing | executive-orchestrator-agent | workflow-routing-agent | all agents |
| Integration state | enterprise-systems-agent | connector-architecture-agent | all connectors |
| Product decisions | senior-pm-agent | vp-product-agent | architecture, engineering |
| Architecture decisions | principal-architect-agent | enterprise-architect-agent | engineering, QA, delivery |
| Security posture | security-architect-agent | security-engineer-agent | governance, QA, architecture |
| Quality standards | qa-agent | governance-qa-agent | delivery, engineering |
| Organizational knowledge | knowledge-systems-architect-agent | organizational-learning-agent | all agents |
| Workflow definitions | workflow-optimization-agent | workflow-evolution-agent | all workflows |
| AI strategy | caio-agent | ai-systems-architect-agent | product, engineering |
| Risk registry | risk-management-agent | enterprise-controls-agent | governance, delivery |
| Ontology | knowledge-systems-architect-agent | principal-architect-agent | all agents |

---

## Decision-Agent Constraint Graph

How key decisions constrain specific agents:

| Decision | Constrains Agents | Constraint |
|---|---|---|
| D-001 (File-based memory) | knowledge-systems-agent, architect-agent | No DB without RFC |
| D-002 (Cursor pagination) | api-architect-agent, backend-engineer-agent | No offset pagination |
| D-003 (URI versioning) | api-architect-agent | No header/query versioning |
| D-006 (Feature flags for L-tier) | engineering agents, delivery-manager-agent | L-tier must use feature flag |
| D-007 (Artifact-first comms) | ALL agents | No free-form inter-agent messages |
| D-009 (Eval before AI code) | ai-engineer-agent, ai-systems-architect-agent | Eval framework before Step 5 |
| D-010 (Gates non-negotiable) | ALL agents, supervisor-agent | No bypass without human auth |
| D-011 (Security gate no exceptions) | security-architect-agent, pm agents | PII/attack-surface = absolute gate |

---

## Agent Collaboration Contracts Summary

From `agents/COLLABORATION-CONTRACTS.md`, the highest-traffic inter-agent collaborations:

| From Agent | To Agent | Type | Frequency | Artifact Exchanged |
|---|---|---|---|---|
| senior-pm-agent | principal-architect-agent | Sequential | Per feature | PRD → Architecture review request |
| principal-architect-agent | qa-agent | Sequential | Per ADR | Architecture spec → QA test plan |
| engineering-agent | qa-agent | Sequential | Per PR | Implementation → QA verdict |
| qa-agent | delivery-manager-agent | Sequential | Per release | QA verdict → Release approval |
| executive-orchestrator-agent | workflow-routing-agent | Fan-out | Per intent | Intent → Routing assignment |
| knowledge-systems-agent | ALL agents | Broadcast | Per session | Context packages |
| hallucination-detection-agent | knowledge-systems-agent | Feedback | Per artifact | Inconsistency reports |
| cross-agent-continuity-agent | ALL agents | Session-boundary | Per session | Run-context + checkpoints |

---

## Intelligence Flow Patterns

The three primary patterns by which intelligence flows through the organization:

### Pattern A: Hierarchical Synthesis (Bottom-Up)
Domain agents produce domain-specific artifacts. Orchestrator-level agents synthesize across domains.

```
[frontend-engineer-agent] → [implementation PR]
[backend-engineer-agent] → [implementation PR]
[qa-agent] → [test results]
         ↓ synthesized by
[delivery-manager-agent] → [sprint completion report]
         ↓ synthesized by
[vp-delivery-agent] → [executive status update]
```

### Pattern B: Authority Cascade (Top-Down)
Constitutional and strategic decisions cascade down to constrain all execution.

```
[enterprise-constitution] → [governance principles] → [quality gates]
         ↓ constrains
[all workflows] → [agent dispatches] → [all artifacts]
```

### Pattern C: Knowledge Accumulation (Lateral)
Agents produce knowledge that peers use, creating organizational intelligence that grows over time.

```
[Sprint N: incident post-mortem] → [failure mode added to memory/failures/]
         ↓ consumed by
[Sprint N+1: architecture review] → "avoids pattern that caused incident"
         ↓ distilled by
[organizational-learning-agent] → [learning capsule for Sprint N]
         ↓ consumed by
[all future sprints]
```

---

## Graph-Indexed Decision Record

The complete decision graph as of 2026-05-10:

| Node | Type | Edges Out | Edges In |
|---|---|---|---|
| D-001 | Decision | GOVERNS→knowledge-systems-agent, GOVERNS→memory-system | — |
| D-002 | Decision | GOVERNS→api-architect-agent, GOVERNS→all-API-artifacts | — |
| D-003 | Decision | GOVERNS→api-architect-agent | — |
| D-004 | Decision | GOVERNS→all-API-artifacts | — |
| D-005 | Decision | GOVERNS→all-ADRs | — |
| D-006 | Decision | GOVERNS→engineering-workflow(L-tier) | — |
| D-007 | Decision | GOVERNS→all-agent-handoffs | — |
| D-008 | Decision | GOVERNS→incident-workflow(post-mortem) | — |
| D-009 | Decision | GOVERNS→ai-feature-workflow | — |
| D-010 | Decision | GOVERNS→supervisor-agent, GOVERNS→all-gates | — |
| D-011 | Decision | GOVERNS→security-gate-G6 | — |
| D-012 | Decision | GOVERNS→ai-feature-workflow(eval) | — |
| D-013 | Decision | GOVERNS→all-agents, GOVERNS→all-workflows | — |
| D-014 | Decision | GOVERNS→memory-system, GOVERNS→context-manager | — |
