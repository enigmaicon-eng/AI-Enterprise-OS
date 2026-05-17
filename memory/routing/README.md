---
layer: memory-routing
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
status: active
---

# Memory Routing

The context-routing engine and all supporting systems that determine: which memory, which knowledge, which context elements are loaded into each agent dispatch.

Memory routing is the intelligence layer between the memory store and the agents that use it. Its job is to deliver the right information to the right agent at the right time — no more, no less.

---

## Why Memory Routing Exists

Without memory routing:
- Every agent receives the same generic context (degrades quality for specialized tasks)
- Context windows are polluted with irrelevant information (the "lost in the middle" effect)
- Important domain-specific knowledge is missed (incomplete agent reasoning)
- Context budgets are violated (expensive, slow, and produces lower-quality output)

Memory routing solves all of these by making context assembly intelligent, domain-aware, and budget-constrained.

---

## Directory Structure

```
memory-routing/
├── README.md                            ← This file
├── context-routing-engine.md            ← The routing engine specification
├── context-prioritization.md            ← Priority rules for context elements
├── active-context-routing.md            ← Real-time routing during workflow execution
├── organizational-context-federation.md ← Cross-domain context sharing protocol
└── runtime-context-synchronization.md  ← Context sync across parallel agents
```

---

## Routing Architecture Overview

```
AGENT DISPATCH REQUEST
  intent: "{routing-key}"
  agent: "{agent-id}"
  task: "{task-description}"
  workflow-instance: "{instance-id}"
          │
          ▼
CONTEXT-ROUTING-ENGINE
  1. Load mandatory layer (always included)
  2. Apply domain filter (routing-key → domain namespace)
  3. Apply task relevance scoring (task description → relevance scores)
  4. Check permission model (agent clearance vs. entry permission tier)
  5. Apply graph recommendations (cognition graph → related entries)
  6. Estimate token count
  7. Apply compression if needed
  8. Build context package
          │
          ▼
CONTEXT PACKAGE
  { mandatory_layer, domain_entries[], task_artifacts[], 
    workflow_state, consistency_anchor }
          │
          ▼
AGENT DISPATCH
  Agent receives context package and executes task
```

---

## Memory Routing Principles

1. **Domain-first selection:** Domain entries for the agent's primary domain are always prioritized over general entries
2. **Task-specific supplementation:** Task artifacts supplement domain entries — they don't replace them
3. **Budget enforcement is mandatory:** No dispatch may exceed its tier's context budget
4. **Permission gates are pre-dispatch:** Access control is checked before context assembly, not after
5. **Compression is always lossless for critical facts:** Binding constraints, human gates, and named entities are never compressed away
6. **Routing is deterministic:** The same request always produces the same context package (given the same memory state)

---

## Routing Health Metrics

| Metric | Target | Alert |
|---|---|---|
| Context assembly time | <500ms | >2s |
| Context package size compliance | 100% within budget | Any budget violation |
| Permission denial rate | <5% of requests | >15% |
| Compression trigger rate | <15% of dispatches | >25% |
| Cache hit rate (repeated patterns) | ≥60% | <40% |
| Relevance score accuracy (proxy: agent task success rate) | ≥85% | <75% |
