---
layer: cognition-indexes
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-engineer-agent
authority: knowledge-systems-architect-agent
status: active
---

# Cognition Indexes

The cognition indexes are the retrieval intelligence layer of the Enterprise AI OS. They enable the context-routing-engine to find relevant knowledge quickly without scanning all artifacts.

Without indexes, knowledge retrieval degrades to O(n) text scans across hundreds of files — slow, noisy, and error-prone. With indexes, retrieval is O(log n) cluster lookup followed by targeted file reads.

---

## Index Architecture

```
cognition-indexes/
├── README.md                       ← This file
├── master-cognition-index.md       ← Primary keyword → file inverted index
├── agent-cognition-index.md        ← Agent ID → relevant memory entries
├── knowledge-synthesis-index.md    ← Synthesis history and knowledge lineage
└── semantic-clusters/              ← Conceptual groupings of related entries
    ├── governance-cluster.md
    ├── engineering-cluster.md
    ├── product-cluster.md
    ├── security-cluster.md
    ├── integration-cluster.md
    └── ai-native-cluster.md
```

---

## Index Types

### Inverted Index (master-cognition-index.md)
Maps terms/concepts → list of files where that concept is relevant.
Used by: context-routing-engine keyword search.
Update trigger: any new file added to hot or warm tier.

### Agent Index (agent-cognition-index.md)
Maps agent ID → recommended memory entries for that agent's tasks.
Used by: context-routing-engine domain layer assembly.
Update trigger: new agent added, agent role changes, new domain memory entry created.

### Synthesis Index (knowledge-synthesis-index.md)
Tracks what has been synthesized, when, from what sources, into what output.
Used by: organizational-learning-agent for avoiding redundant synthesis, tracking knowledge lineage.
Update trigger: any synthesis workflow completes.

### Semantic Clusters (semantic-clusters/)
Groups of related entries that should be retrieved together when any one is retrieved.
Used by: context-routing-engine graph recommendations phase.
Update trigger: weekly cluster maintenance by knowledge-systems-engineer-agent.

---

## Index Maintenance Protocol

| Index | Update Trigger | Update Method | Owner |
|---|---|---|---|
| master-cognition-index | New file created or updated | knowledge-systems-engineer-agent extracts new terms | knowledge-systems-engineer-agent |
| agent-cognition-index | New agent added, new memory entry | Route key → domain → agent mapping | knowledge-systems-engineer-agent |
| knowledge-synthesis-index | Synthesis workflow completes | Append synthesis record | organizational-learning-agent |
| semantic-clusters | Weekly cron | Full cluster re-analysis | knowledge-systems-engineer-agent |

---

## Index Integrity Rules

1. Every warm-tier memory entry must have at least one term in master-cognition-index
2. Every agent in MASTER-REGISTRY.md must have an entry in agent-cognition-index
3. Synthesis index must not have gaps — every synthesis workflow completes a record
4. Semantic clusters must be reviewed for staleness quarterly

Integrity violations are detected by the weekly memory consolidation cron and flagged to the knowledge-systems-engineer-agent.

---

## Index Performance Targets (Markdown Mode)

| Operation | Target | Measurement |
|---|---|---|
| Keyword lookup | <100ms | Single scan of master-cognition-index.md |
| Agent context assembly | <500ms | Agent-cognition-index.md + targeted file reads |
| Cluster retrieval | <200ms | Semantic cluster file read + listed file reads |
| Full index update | <5 minutes | After new file creation |
| Full index rebuild | <30 minutes | Weekly maintenance |

**Note:** These targets assume the markdown index files are under 50KB total. If indexes exceed 50KB, migration to a lightweight database (SQLite via sql.js, as in ruflo's AgentDB) is triggered. See Q-006 in open-questions.md.