---
layer: organizational-synchronization
type: synchronization-protocol
version: 1.0.0
created: 2026-05-10
owner: master-orchestrator-agent
authority: enterprise-architecture-council
---

# Organizational Synchronization Protocol

The complete protocol for synchronizing organizational state across agents, sessions, and parallel execution contexts.

**Adapted from:** ruflo's CRDT-based distributed state management and anti-drift swarm coordination. TradingAgents' temporal state isolation (each agent's context is temporally anchored to avoid using stale data).

---

## Synchronization Invariants

These invariants must always hold. Any violation is a system failure event:

1. **Single truth per fact:** At any point in time, there is exactly one authoritative value for any organizational fact (agent count, integration count, version, open questions list)
2. **Authority-ordered resolution:** When two values conflict, the higher-authority source (per 7-tier hierarchy) wins — always
3. **No silent divergence:** Any detected divergence between agent views must be resolved within the same session it is detected
4. **Checkpoint-guaranteed continuity:** The state at session N+1 start is always recoverable from session N's checkpoint

---

## Synchronization Layer Protocols

### Layer 1: Constitutional Sync (Permanent)
```
FREQUENCY: At OS installation and on constitutional amendment only
SCOPE: constitution/, docs/governance/principles.md
MECHANISM: Read-only distribution — no agent writes to Layer 1 except enterprise-constitution-guardian-agent

On session start:
  1. Load Layer 1 (constitution + principles) — these are stable, no sync needed
  2. Verify hash against prior session hash (detect tampering)
  3. If hash changed: ALERT — constitutional change must have T5 authorization
```

### Layer 2: Organizational Sync (Session-Start + Session-End)
```
FREQUENCY: Once per session, both at start and end
SCOPE: consistency-anchor facts (agent count, integration count, version, open questions, gaps)
SOURCE: agents/MASTER-REGISTRY.md, integrations/MASTER-INTEGRATION-REGISTRY.md, memory/open-questions.md

Session-start sync sequence (6 steps):
  1. Read MASTER-REGISTRY.md → extract: total-agents, total-orgs
  2. Read MASTER-INTEGRATION-REGISTRY.md → extract: total-integrations, gap-count, critical-gap-count
  3. Read memory/open-questions.md → extract: open-q-count, blocking-q-count
  4. Read handoffs/session-{last-date}/session-checkpoint.md → load prior session state
  5. Build consistency anchor:
     consistency-anchor:
       as-of: "{today}"
       total-agents: {N}
       total-organizations: {N}
       total-integrations: {N}
       capability-gaps: {N}
       critical-gaps: {N}
       open-questions: {N}
       product-blocking-questions: {N}
       system-version: "{version}"
  6. Distribute anchor to all dispatched agents (included in every context package)

Session-end sync sequence (3 steps):
  1. Update consistency anchor with any changes made this session
  2. Write final session checkpoint with updated anchor
  3. Emit system.session.ended event with anchor hash
```

### Layer 3: Domain Sync (Per-Workflow, Per-Step)
```
FREQUENCY: After each completed workflow step
SCOPE: memory/domains/{domain}/, run-context, MEMORY_INDEX.md
MECHANISM: Write-ahead log (WAL) + Raft leader arbitration

Per-step sync sequence:
  1. Agent completes step → writes artifact to declared output path
  2. If artifact updates domain memory:
     a. Acquire domain write-lock (timeout: 30s)
     b. Write entry to domain namespace
     c. Write WAL entry (PENDING)
     d. Update MEMORY_INDEX.md
     e. Emit knowledge.entry.created event
     f. Release write-lock
     g. WAL entry committed
  3. Update run-context:
     a. Move step-id from in-progress to completed-steps
     b. Set next in-progress-step
     c. Write step checkpoint
  4. Cache invalidation: any cached context packages containing the updated domain are invalidated
```

### Layer 4: Operational Sync (Real-Time, Within Session)
```
FREQUENCY: Continuous (event-driven where possible; polling fallback)
SCOPE: Agent dispatch status, workload distribution, consensus state, active escalations
MECHANISM: Event emission → coordination-state.md updates

Events that trigger Layer 4 sync:
  - agent.dispatch.activated → update coordination-state: step RUNNING
  - agent.dispatch.completed → update coordination-state: step COMPLETED
  - workflow.gate.reached → update coordination-state: approval PENDING
  - coordination.consensus.completed → update coordination-state: consensus RESOLVED
  - risk.escalation.triggered → update risk assessment, re-route pending steps

Polling fallback (when event bus unavailable — GAP-INT-005):
  - Coordination engine checks coordination-state.md every 5 minutes
  - Detects stalled steps (no update in >30 minutes)
  - Triggers stall recovery protocol
```

---

## Conflict Resolution Hierarchy

When two agents hold different values for the same organizational fact:

```
Step 1: Identify which source each agent read from
Step 2: Apply 7-tier source-of-truth hierarchy:
  T1 Constitution > T2 ADR > T3 Master Registry > T4 Wiki > T5 Memory > T6 Artifact > T7 Ephemeral
Step 3: Higher-tier source wins
Step 4: Agent with lower-tier source updates to match higher-tier source
Step 5: Log contradiction (CONT-NNN)

Tie resolution (same tier, different values):
  Use timestamp: most recently written value wins
  Exception: CRITICAL memory entries always require manual (T3+) resolution

Special case: two agents both read T3 (MASTER-REGISTRY.md) and disagree:
  → They read different versions (one is stale)
  → Re-read MASTER-REGISTRY.md and use current value
  → Stale reader had a cache invalidation failure → log as system issue
```

---

## State Hash Verification

At session start and at each Layer 2 sync, the organizational state is hashed for integrity:

```python
def compute_state_hash(anchor):
    canonical = f"{anchor.total_agents}|{anchor.total_orgs}|{anchor.version}|{anchor.open_questions}"
    return sha256(canonical).hexdigest()[:16]
```

If the hash at session start doesn't match the hash from the prior session checkpoint AND no changes were made between sessions → **integrity violation detected** → alert master-orchestrator-agent.

---

## Synchronization Under Adverse Conditions

### Partial Session Failure (Some agents completed, some did not)
1. Load last step checkpoint for each workflow instance
2. Identify which steps have checkpoints (COMPLETED) vs. which don't (UNKNOWN)
3. UNKNOWN steps are reset to PENDING
4. Re-dispatch PENDING steps with fresh context packages
5. WAL: roll back any uncommitted writes from UNKNOWN steps

### Long-Absent Session (>7 days between sessions)
1. Full Layer 2 re-sync (don't trust cached anchor)
2. Staleness scan on all warm-tier memory entries
3. Flag all memory entries created >7 days ago without revalidation
4. Present high-level organizational state summary to human operator before proceeding

### Concurrent Sessions (Multiple humans working simultaneously)
The system is designed for single-tenant use (one session at a time). If concurrent sessions occur:
1. Each session has its own session-id
2. Write-locks prevent simultaneous writes to the same domain
3. Session that cannot acquire lock must wait or abort
4. Human operators must coordinate to avoid concurrent session collisions
5. This is tracked as a known limitation pending event bus resolution (GAP-INT-005)