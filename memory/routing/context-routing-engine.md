---
layer: memory-routing
type: context-routing-engine
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Context Routing Engine

The specification for the context-routing-engine — the component that assembles the optimal context package for each agent dispatch. Every agent dispatch is mediated by this engine.

---

## Engine Responsibilities

1. **Context assembly:** Build the context package from memory, wiki, and task artifacts
2. **Budget enforcement:** Ensure total tokens ≤ tier budget
3. **Permission enforcement:** Enforce memory namespace access control
4. **Relevance scoring:** Rank and filter entries by task relevance
5. **Compression trigger:** Apply compression when budget exceeded
6. **Cache management:** Reuse recently-assembled context packages for identical requests
7. **Consistency injection:** Include consistency-anchor in every package

---

## Engine Inputs

```yaml
dispatch-request:
  agent-id: "{agent-id}"
  routing-key: "{key}"              # determines domain
  task-description: "{text}"        # used for relevance scoring
  workflow-instance-id: "{id}"      # loads run-context
  step-number: N                    # loads step-specific artifacts
  security-clearance: "OPEN|RESTRICTED|CONFIDENTIAL|CLASSIFIED"
  override-budget: null             # set by orchestrator for special dispatches
```

---

## Engine Processing Sequence

### Phase 1: Mandatory Layer Assembly
Load items that go into EVERY context package regardless of task:

```
1. Consistency anchor (current organizational facts)
   Source: session-start consistency anchor (always fresh)
   Size: ~500 tokens

2. Governance core (minimum required governance context)
   Source: docs/governance/principles.md (summary section only)
   Source: constitution summary (Article I-III headers + key rules)
   Size: ~800 tokens

3. Active run-context (if workflow instance active)
   Source: memory/workflow-state/{instance-id}.run-context.md
   Size: ~400 tokens

4. Relevant ontology vocabulary
   Source: ontology/{vocabulary-file}.md for task domain
   Size: ~600 tokens

Total mandatory layer target: ≤2,000 tokens
```

### Phase 2: Domain Layer Assembly
Load domain-specific memory entries for the agent's primary domain:

```
1. Determine domain from routing-key
   Source: orchestrator/routing-rules.md (routing-key → domain)

2. Load MEMORY_INDEX.md entries for this domain
   Filter by: domain = {domain}, importance = [critical, high]
   Source: memory/MEMORY_INDEX.md

3. Load domain namespace entries
   Source: memory/domains/{domain}/ (if exists)
   Filter by: permission-tier ≤ agent security-clearance

4. Load relevant wiki sections
   Source: wiki/{domain-section}/ (first 500 tokens of most-relevant pages)
   Selection: based on routing-key → wiki-section mapping

Total domain layer target: varies by tier (see context budget table)
```

### Phase 3: Task Layer Assembly
Load artifacts specifically required by this workflow step:

```
1. Load step specification
   Source: workflow file, step N specification
   Extract: required-inputs list

2. Load each required input artifact
   Source: paths from step spec required-inputs
   Priority: most recent version of each artifact type

3. Load step output schema
   Source: templates/{artifact-type}-template.md (relevant sections)
   Purpose: agent knows exactly what to produce

4. Load any step-specific memory
   Source: memory entries tagged with step-specific routing keys

Total task layer target: remaining budget after mandatory + domain layers
```

### Phase 4: Graph Recommendations (Optional Enhancement)
When time allows and budget permits, add graph-recommended entries:

```
1. Query cognition graph: find RELATES_TO neighbors of primary step artifacts
2. Filter: relevance score ≥ 60
3. Add top-3 recommended entries if budget allows
4. Mark as SUPPLEMENTAL in context package (agent knows these are optional)

Skip this phase if: budget is already at 80%+ after Phase 3
```

### Phase 5: Token Budget Check and Compression
```
1. Estimate total token count for assembled package
2. Compare to tier budget × 0.90
3. If within budget: proceed to Phase 6
4. If over budget: apply context-compression-protocol.md (Stages 1-4 in order)
5. If still over after compression: apply Stage 5 (hard truncation with log)
```

### Phase 6: Package Assembly and Delivery
```
1. Assemble final context package with sections in this order:
   [1] Consistency anchor
   [2] Governance core
   [3] Relevant ontology
   [4] Domain memory
   [5] Task artifacts
   [6] Step schema
   [7] Graph recommendations (if included)
   [8] Active run-context
   [9] Any compression notes (if compression was applied)

2. Add package metadata:
   assembled-by: context-routing-engine
   assembled-at: {timestamp}
   total-tokens: N
   budget-tier: {tier}
   compression-applied: true|false
   entries-included: N
   entries-excluded: N

3. Write to session-scope cache:
   cache-key: hash(agent-id + routing-key + workflow-instance-id + step-number)
   cache-ttl: 30 minutes (within session)

4. Return to dispatch layer
```

---

## Routing Key → Domain Mapping

| Routing Key Pattern | Domain | Memory Namespace |
|---|---|---|
| feature-requirements | product | memory/domains/product/ |
| technical-product | product + engineering | memory/domains/product/ + memory/domains/engineering/ |
| principal-architecture | architecture | memory/domains/engineering/ |
| security-design | security | memory/domains/security/ (RESTRICTED) |
| financial-product | finance | memory/domains/finance/ (CONFIDENTIAL) |
| quality-verification | qa | memory/domains/engineering/ |
| delivery-coordination | delivery | memory/organizational/ |
| knowledge-management | meta | memory/ (all domains) |
| all-intents (orchestrator) | meta | memory/organizational/ + MEMORY_INDEX.md |
| ai-feature-requirements | product + ai | memory/domains/product/ |
| compliance-review | governance | memory/domains/legal/ (CLASSIFIED) |

---

## Context Package Cache

Identical dispatch requests within a session receive cached context packages:

```yaml
cache-entry:
  key: "{hash}"
  package: "{context-package-content}"
  created-at: "{timestamp}"
  hit-count: N
  expires-at: "{timestamp + 30min}"
```

Cache invalidation: if any memory entry used in the package is updated during the session, the cache entry is invalidated immediately.

Cache hit rate target: ≥60% (many dispatches in a workflow share similar context).

---

## 3-Tier Dispatch Tier Selection

Before context assembly, the engine selects the dispatch tier based on task complexity:

```
TASK COMPLEXITY SCORE:
  + 5 points per required input artifact (max: 30)
  + 25 if reasoning-depth = HIGH (architecture, security, strategic decisions)
  + 25 if cross-domain coordination required
  + 25 if security-sensitive (any RESTRICTED+ namespace involved)
  
TIER SELECTION:
  Score 0: T0 (template/booster — skip LLM entirely if pattern exists)
  Score 1-30: T1 (Haiku — fast, low-cost)
  Score 31-75: T2 Sonnet (complex reasoning)
  Score 76-100: T2 Opus (highest reasoning quality)
```

Adapted from ruflo's 3-tier model routing (WASM→Haiku→Sonnet/Opus).

---

## Anti-Drift Context Controls

Adapted from ruflo's anti-drift swarm coordination:

1. **Raft leader context injection:** For each active knowledge domain, inject the domain Raft leader's identifier into the context package. The dispatched agent knows who holds authoritative state.

2. **Specialized role enforcement:** Context packages are tailored to the agent's defined role. An engineering agent does not receive product PM context by default. Role specialization is preserved.

3. **Hierarchical authority injection:** Every context package includes the authority chain from the dispatched agent up to the constitutional level. The agent always knows who it escalates to.

4. **Binding constraint injection:** Any binding constraints from active ADRs that apply to the agent's routing key are always included — never compressed away.
