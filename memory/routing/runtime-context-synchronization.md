---
layer: memory-routing
type: runtime-context-synchronization
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Runtime Context Synchronization

How context is synchronized across parallel agent execution — preventing context divergence when multiple agents work simultaneously in the same session.

**Problem:** When agents A and B are dispatched in parallel, they receive separate context packages assembled at dispatch time. If A's execution produces new knowledge that B needs, B won't have it unless synchronization is applied.

---

## Synchronization Problem Classes

### Class 1: Parallel Domain Reads (No Problem)
Multiple agents reading the same domain memory simultaneously:
- No synchronization needed
- Each gets their own copy of the same ACTIVE entries
- No divergence possible (read-only)

### Class 2: Parallel Domain Writes (CRDT Merge Required)
Multiple agents producing new memory entries in the same domain simultaneously:
- Writers must use CRDT merge rules when writing
- Final state = set union of all produced entries
- Conflicts resolved per contradiction-resolution-system.md

### Class 3: Artifact Dependency (Sequential Required)
Agent B needs Agent A's artifact as input:
- B cannot be dispatched until A's artifact is available
- This is a DEPENDS_ON edge in the dependency graph
- Orchestrator enforces sequencing

### Class 4: Shared State Update (Lock Required)
Multiple agents attempting to update the same shared state (run-context, consistency anchor):
- Write-ahead lock applied per domain
- First writer acquires lock, others queue
- Lock released after write + cache invalidation
- Lock timeout: 30 seconds (then escalate to orchestrator)

---

## Parallel Agent Execution Protocol

When the orchestrator fans out to N parallel agents:

### Pre-Dispatch (Orchestrator)
```
1. Identify all domain writes the parallel agents will perform
2. Check for Class 3 (dependency) or Class 4 (shared state) conflicts
3. If conflicts: convert to sequential dispatch
4. If no conflicts: proceed with parallel dispatch
5. Assign each agent a domain write-lock grant (if they will write)
6. Assemble context package per agent (separate packages, same base layer)
7. Dispatch all N agents simultaneously
```

### During Execution (Agents)
```
Each agent executes independently:
- Reads from their context package (no cross-agent reads)
- Writes to their own artifact path
- Does NOT read other agents' in-progress artifacts
- Does NOT modify shared run-context during execution
```

### Post-Execution (Orchestrator Fan-In)
```
After all N agents complete:
1. Collect all produced artifacts
2. Apply CRDT merge for any domain writes:
   - Lists: union
   - Counters: max
   - Scalars: most-recent timestamp wins
3. Run contradiction scan on the merged output
4. If contradiction: apply contradiction-resolution-system.md
5. Update run-context with all completed parallel steps
6. Write step checkpoint for the parallel band
7. Release all domain write-locks
8. Proceed to next sequential step
```

---

## Synchronization for Shared Knowledge Discovery

When parallel agents independently discover contradictory facts:

```
Agent A (product domain): "The target customer is SMB"
Agent B (market research): "The target customer is Enterprise"
```

Both emit `knowledge.contradiction.detected` events. The fan-in step detects both events and applies the contradiction resolution protocol before proceeding. Neither agent's conclusion is accepted without resolution.

---

## Write-Ahead Log (WAL)

All domain writes during parallel execution are logged to a write-ahead log:

```yaml
# memory/workflow-state/{instance-id}/wal.md
wal-entry:
  timestamp: "{ISO-8601}"
  writer-agent: "{agent-id}"
  domain: "{domain}"
  operation: CREATE|UPDATE|SUPERSEDE
  entry-path: "{path}"
  write-lock-id: "{lock-id}"
  status: PENDING|COMMITTED|ROLLED_BACK
```

The WAL ensures that if a parallel execution fails mid-way, uncommitted writes can be rolled back without corrupting the domain memory.

**WAL commit:** Occurs after fan-in CRDT merge completes without contradiction.
**WAL rollback:** Occurs if the agent that produced the write fails (FAILED state) before fan-in.

---

## Context Freshness During Long Parallel Execution

If parallel agents run for an extended period (>30 minutes), their context packages may become stale (new memory may have been written by other agents in other workflows):

**Freshness check at fan-in:**
1. For each parallel agent's produced artifact, compare against current memory state
2. If any P0 element in the agent's context package has been updated since dispatch → flag for re-verification
3. P0 updates during parallel execution are rare and are treated as high-priority events requiring orchestrator attention

**Mitigation:** Keep parallel execution bands short (each parallel band ≤30 minutes). If a band requires longer, break it into two sequential bands with a synchronization point between.

---

## Cross-Workflow Context Isolation

Workflows running in parallel (not the same fan-out) must NOT share context:

```
Workflow Instance A (feature-X PRD)
  Cache partition: instance-A
  Domain writes: memory/domains/product/feature-X.md
  
Workflow Instance B (feature-Y PRD, concurrent)
  Cache partition: instance-B
  Domain writes: memory/domains/product/feature-Y.md
```

Even though both touch the product domain, they write to different paths. Their context packages are assembled independently. The consistency anchor ensures they both see the same organizational state, but their task-specific contexts remain isolated.

**Cross-workflow interference detection:** If workflow A reads memory/domains/product/ and workflow B writes to memory/domains/product/ in the same session, workflow A's cache entry for that namespace is invalidated and rebuilt on next access.

---

## Synchronization Failure Handling

| Failure | Detection | Response |
|---|---|---|
| Lock timeout (>30s) | Lock manager | Escalate to orchestrator, check for deadlock |
| CRDT merge conflict | Fan-in contradiction scan | Apply contradiction resolution, delay next step |
| WAL commit failure | WAL monitor | Roll back all pending WAL entries, re-dispatch failed agents |
| Context package stale at fan-in | Freshness check | Flag P0 violations for orchestrator review |
| Deadlock (A waits for B, B waits for A) | Lock manager circular dependency check | Abort both, re-plan as sequential |
