---
layer: graph-models
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
status: active
---

# Knowledge Graph Models

The organizational knowledge graph is the relational intelligence layer of the Enterprise AI OS. It encodes not just what the OS knows, but how all its knowledge is connected — which agents produce which artifacts, which decisions constrain which systems, which incidents affected which components.

The knowledge graph enables: impact analysis, dependency discovery, transitive relationship queries, and organizational intelligence that no individual artifact can provide alone.

---

## Current Implementation

**Status:** Markdown-based simulation (workaround for GAP-INT-001 — no Neo4j connector)

The graph is represented as structured markdown files: node files in `graph-models/nodes/` and an edge registry in `graph-models/edges/`. Graph traversal is performed by keyword search and manual reasoning. This provides approximately 60% of the utility of a true graph database for common queries.

**Target implementation:** Neo4j with Bolt protocol connector, once GAP-INT-001 is resolved. All node and edge schemas defined here are designed to translate directly to Neo4j property graph model.

---

## Directory Structure

```
graph-models/
├── README.md                              ← This file
├── schema-registry.md                     ← All node types and edge types
├── enterprise-cognition-graph.md          ← The primary OS intelligence graph
├── workflow-relationship-graph.md         ← Workflow interdependency model
├── dependency-graph.md                    ← Technical dependency model
├── runtime-dependency-graph.md            ← Runtime execution dependencies
├── organizational-intelligence-graph.md   ← Agent, team, and decision graph
│
├── nodes/                                 ← Individual node files
│   ├── agents/                            ← One file per agent
│   ├── workflows/                         ← One file per workflow
│   ├── artifacts/                         ← Key artifact type nodes
│   ├── decisions/                         ← Decision nodes (linked to ADRs)
│   ├── initiatives/                       ← Initiative nodes
│   ├── integrations/                      ← Integration system nodes
│   └── metrics/                           ← Metric definition nodes
│
└── edges/                                 ← Edge registry files
    ├── produces-edges.md                  ← Agent PRODUCES artifact
    ├── gates-edges.md                     ← Gate GATES workflow step
    ├── triggers-edges.md                  ← Event TRIGGERS workflow
    ├── depends-on-edges.md                ← Artifact DEPENDS_ON artifact
    ├── implements-edges.md                ← Code IMPLEMENTS decision
    └── supersedes-edges.md                ← Decision SUPERSEDES decision
```

---

## Core Querying Capabilities

Even in the markdown simulation, the graph enables:

| Query Type | How to Execute | Example |
|---|---|---|
| Direct neighbors | Read node file → list all edges | "What does agent X produce?" |
| Shortest path | BFS through edge registry files | "How is ADR-003 connected to the security incident?" |
| Transitive dependency | Recursive edge traversal | "What breaks if integration Y fails?" |
| Authority chain | Follow GOVERNED_BY edges | "Who has final authority over decision D-007?" |
| Impact analysis | Reverse-follow DEPENDS_ON edges | "What artifacts are affected by changing the data schema?" |
| Knowledge cluster | Follow RELATES_TO edges | "What else is relevant when working on feature X?" |

---

## Graph Maintenance Protocol

The knowledge graph is maintained by `knowledge-systems-engineer-agent`:

- **Node creation:** When a new agent, workflow, artifact type, or initiative is registered
- **Edge creation:** When a new relationship is established (agent produces artifact, decision supersedes decision, etc.)
- **Edge deletion:** Logical only — edges are marked INACTIVE, not deleted, to preserve history
- **Consistency check:** Weekly reconciliation of graph edges against actual file state

Every graph update emits a `knowledge.graph.edge.created` or `knowledge.graph.node.created` event.

---

## Transition to Neo4j

When GAP-INT-001 is resolved, the migration path is:

1. Export all node files → Neo4j `CREATE` statements (one per node file)
2. Export all edge files → Neo4j `CREATE` relationship statements
3. Validate: node count, edge count, connectivity metrics
4. Enable `knowledge-systems-agent` to use the Bolt connector for traversal queries
5. Retire markdown simulation files (move to `graph-models/archive/`)
6. All new nodes and edges written via Neo4j API

The markdown schema defined here is designed for direct translation. Every `node-type` and `edge-type` defined in `schema-registry.md` maps directly to a Neo4j label.
