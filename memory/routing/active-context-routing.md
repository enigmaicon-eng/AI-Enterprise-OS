---
layer: memory-routing
type: active-context-routing
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Active Context Routing

Real-time context routing behavior during workflow execution — how the context-routing-engine adapts the context package as a workflow progresses through steps.

**Distinction from static routing:** The context-routing-engine spec covers assembly of a single context package. Active context routing covers the dynamics of context management across multiple steps within a running workflow.

---

## The Routing State Machine (Within a Session)

As a workflow progresses, the context routing maintains state:

```
WORKFLOW START
    │
    ▼
INITIAL_ROUTING
  - Assemble full context package for first step
  - Establish session-scope cache
  - Load run-context (if resuming)
    │
    ▼
STEP_ROUTING (repeats per step)
  - Retrieve step-specific artifacts
  - Check cache: is context package reusable?
  - If yes: serve from cache
  - If no: delta-update (add step artifacts, remove previous step artifacts)
    │
    ▼
INTER_STEP_EVALUATION (after each step)
  - Check context budget consumption
  - Check for context drift (new knowledge invalidating cached entries)
  - Apply delta if budget ok
  - Trigger compression if budget exceeded
    │
    ▼
WORKFLOW_COMPLETE
  - Clear session-scope cache
  - Write final routing metrics
```

---

## Delta Routing (Step-to-Step Efficiency)

Rather than reassembling the full context package for each step, delta routing maintains a base package and applies step-specific deltas:

**Base package (stable across steps):**
- Mandatory layer (consistency anchor, governance core, ontology)
- Domain layer for this workflow's primary domain
- Active run-context

**Step delta (applied fresh for each step):**
- Step specification (what this step must produce)
- Step required input artifacts (varies per step)
- Step output schema
- Any step-specific memory entries

**Delta routing rules:**
1. If step routing key matches previous step: reuse base, only replace step delta
2. If routing key changes (cross-domain step): rebuild domain layer, replace step delta
3. If base package entries are invalidated (memory updated mid-session): rebuild affected layers

**Cache key for delta routing:**
`hash(workflow-instance-id + domain + step-number)`

---

## Routing Key Transitions Mid-Workflow

Some workflows include steps that cross domain boundaries (e.g., a product workflow that includes a security review step):

```
Step 1: feature-requirements (product domain)
Step 2: technical-product (product + engineering domain)
Step 3: security-design (security domain — RESTRICTED)
Step 4: quality-verification (engineering domain)
```

At each routing key transition:
1. Previous domain layer is cached (may be reused on return)
2. New domain layer assembled per new routing key
3. Permission check re-run for new domain
4. Anti-drift controls re-injected for new domain

**Permission escalation at domain transition:**
If step N requires a higher permission tier than step N-1, the routing engine checks the agent's clearance before assembling the higher-tier context. If clearance is insufficient, the step is re-routed to an agent with sufficient clearance.

---

## Real-Time Budget Monitoring

During active routing, the engine continuously monitors context budget consumption:

```
After each step delta assembly:
  current_usage = estimate_tokens(current_package)
  budget_remaining = tier_budget - current_usage
  usage_pct = current_usage / tier_budget
  
  if usage_pct > 0.90:
    trigger_compression()
  elif usage_pct > 0.80:
    log_warning("Context budget at 80%")
    drop_P4_elements()
  elif usage_pct > 0.60:
    log_info("Context budget at 60% — consider checkpoint before continuing")
```

**Budget recovery strategy:**
1. Drop P4 elements (low priority, drop first)
2. Apply Stage 1 compression (deduplication) to base package
3. Apply Stage 2 compression (relevance filtering)
4. If still over budget: trigger full compression protocol
5. If compression fails to recover: write emergency checkpoint, notify orchestrator

---

## Context Drift Detection

Context drift occurs when memory is updated during a session in ways that invalidate cached context packages:

**Drift signals:**
- An ACTIVE memory entry in a cached package transitions to STALE
- A contradiction is detected that affects an entry in the cached package
- An ADR binding constraint is updated that appears in the cached package
- The consistency anchor facts change (e.g., new agent registered mid-session)

**Drift response:**
1. Identify all cached packages containing the changed entry
2. Invalidate those cache entries
3. Rebuild affected context packages on next access
4. Log the drift event for audit

**Drift immunity:** P0 elements (binding constraints, human gates) are never cached independently — they are re-read from source at every dispatch. This ensures P0 elements can never become stale in the cache.

---

## Active Routing Metrics

| Metric | Target | Action if Exceeded |
|---|---|---|
| Cache hit rate | ≥60% | Review routing key diversity |
| Delta assembly time | <100ms | Check for large domain namespaces |
| Context drift events per session | <5 | Investigate why memory is changing mid-session |
| Budget pressure events (>80%) | <15% of steps | Review domain namespace size |
| Compression triggers | <10% of steps | Consider tier upgrade for this workflow |

---

## Multi-Workflow Active Routing

When multiple workflows are active in the same session (parallel or interleaved):

1. Each workflow instance has its own session-scope cache partition
2. Cache keys are scoped to `workflow-instance-id` (no cross-workflow cache sharing)
3. Budget is NOT shared — each workflow dispatch uses the tier budget for that dispatch independently
4. If two workflows both need RESTRICTED domain access simultaneously, both receive separate federated packages with independent federation audit log entries

---

## Emergency Context Reset

If context routing enters an inconsistent state (detected by contradiction in package metadata):

1. Clear all session-scope cache entries
2. Re-read consistency anchor from disk
3. Rebuild all context packages from scratch for active dispatches
4. Emit `system.context.emergency-reset` event
5. Log to priority-audit-log.md (context reset is an operational event)

This is a rare recovery operation. In normal operation, the session-scope cache is always consistent because invalidation is applied immediately on memory updates.
