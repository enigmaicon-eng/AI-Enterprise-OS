---
layer: knowledge-governance
type: runtime-state-synchronization
version: 1.0.0
created: 2026-05-10
owner: runtime-coordination-agent
authority: knowledge-systems-architect-agent
---

# Runtime State Synchronization

The protocol for keeping workflow state, agent state, and knowledge state consistent across session boundaries, parallel agent executions, and integration events.

---

## The Synchronization Problem

The OS operates in sessions. Each session ends and all in-memory state is lost unless explicitly persisted. When a new session begins, the OS must reconstruct its operational state from persisted artifacts.

Without synchronization:
- A workflow paused at step 7 is restarted from step 1 (duplicate work, potential duplicate artifacts)
- An agent believes Q-001 is Open when it was resolved in the previous session
- Two agents independently update the same artifact in the same session, producing a conflict
- An external integration event fires between sessions and is never processed

---

## The Run-Context Object

Every active workflow instance has a persistent Run-Context, adapted from dexter's run-context pattern. The run-context is the single source of truth for workflow execution state.

```yaml
# Path: memory/workflow-state/{instance-id}.run-context.md
run-context:
  instance-id: "{UUID}"
  workflow-id: "{workflow-id}"
  initiative-id: "{initiative-id}"
  created-at: "{timestamp}"
  last-updated: "{timestamp}"
  last-session: "{session-id}"
  
  execution-state:
    current-step: 7
    total-steps: 12
    status: "RUNNING|PAUSED|BLOCKED|COMPLETED|FAILED"
    pause-reason: null  # populated when PAUSED or BLOCKED
    
  completed-steps:
    - step: 1
      completed-at: "{timestamp}"
      output-artifact: "prds/2026-05-10-feature-x.md"
      quality-score: 92
      checkpoint-path: "memory/workflow-state/{instance-id}-step-1.checkpoint.md"
    - step: 2
      completed-at: "{timestamp}"
      output-artifact: "architecture/decisions/ADR-003-feature-x.md"
      quality-score: 88
      checkpoint-path: "memory/workflow-state/{instance-id}-step-2.checkpoint.md"
    # ... steps 3-6 ...
    
  in-progress-step:
    step: 7
    assigned-agent: "qa-agent"
    started-at: "{timestamp}"
    partial-output: null  # path if agent wrote a partial artifact before session end
    
  pending-steps: [8, 9, 10, 11, 12]
  
  blocking-conditions: []  # list of unresolved blockers
  
  open-questions:
    - question-id: "Q-WF-{UUID}"
      question: "{text}"
      blocking-step: 8
      assigned-to: "human-operator"
      
  artifacts-produced:
    - path: "prds/2026-05-10-feature-x.md"
      type: "PRD"
      status: "APPROVED"
    - path: "architecture/decisions/ADR-003-feature-x.md"
      type: "ADR"
      status: "ACCEPTED"
      
  loop-detection:
    step-visit-counts:
      "7": 1  # if this hits 3, loop detection fires
    last-loop-check: "{timestamp}"
```

---

## Session-Start Synchronization Sequence

Every session must execute this sequence before any workflow step proceeds:

```
1. LOAD CONSISTENCY ANCHOR
   Read: memory/MEMORY_INDEX.md → identify critical memory entries
   Read: agents/MASTER-REGISTRY.md → get authoritative agent count/catalog
   Read: integrations/MASTER-INTEGRATION-REGISTRY.md → get integration state
   Read: memory/open-questions.md → get current open questions

2. DISCOVER ACTIVE WORKFLOW INSTANCES
   Scan: memory/workflow-state/*.run-context.md
   For each run-context with status: RUNNING or PAUSED:
     - Load the run-context
     - Identify the resume point (current-step)
     - Check if blocking conditions have been resolved
     - Load the checkpoint for the current step

3. RESUME OR PAUSE DECISION
   For each active run-context:
     If blocking conditions resolved AND no human-required gates pending:
       → Mark for autonomous continuation
     If blocking conditions remain OR human gate pending:
       → Mark as PAUSED, surface blocker to operator

4. LOAD CONSISTENCY HANDOFF (from previous session)
   Read: handoffs/{last-session-date}/consistency-handoff.md
   Apply: any open contradictions → load into active resolution queue
   Update: consistency anchor with any facts updated in prior session

5. VERIFY KNOWLEDGE STATE
   Cross-check consistency anchor against memory entries
   Flag any staleness (entries >90 days without validation)
   Trigger: wiki-maintenance-workflow for any flagged entries

6. INITIALIZE ACTIVE CONTEXT
   Set: session-id, operator-id
   Load: mandatory governance context (constitution, principles, ontology)
   Ready: dispatch queue for resumed workflow instances
```

---

## Step-Level Synchronization

After EVERY workflow step completes:

```
1. WRITE CHECKPOINT
   path: memory/workflow-state/{instance-id}-step-{N}.checkpoint.md
   content: complete step output, quality score, timestamp, next step preconditions
   
2. UPDATE RUN-CONTEXT
   update: current-step → N+1
   update: completed-steps → add step N record
   update: artifacts-produced → add new artifact
   write: memory/workflow-state/{instance-id}.run-context.md
   
3. EMIT EVENTS
   publish: workflow.step.completed event
   publish: artifact.{type}.created event (for each artifact produced)
   
4. LOOP DETECTION CHECK
   increment: step-visit-counts[current-step]
   if count > 3: emit system.loop.detected event, pause workflow
   
5. CONSISTENCY CHECK
   validate: new artifact against consistency anchor
   if contradiction: log, resolve if possible, flag if not
```

Checkpointing adapted from TradingAgents' LangGraph checkpoint/resume — every step is checkpointed, enabling exact resume after any interruption.

---

## Parallel Execution Synchronization

When multiple workflow instances run simultaneously (fan-out), synchronization prevents conflicts:

### Optimistic Concurrency Control
Each artifact carries a version hash. Before writing, an agent reads the current version hash. If the hash has changed since read, the write is rejected and the agent re-reads before retrying.

### Write-Ahead Log
Before any agent writes to a shared resource (MEMORY_INDEX, MASTER-REGISTRY, etc.), it appends an intent record to the write-ahead log at `memory/wal.md`. If two agents attempt the same write, the second is rejected with a "concurrent modification" signal.

### Domain Locking
An agent claims a domain lock before updating a domain-specific registry. Lock claim: write `memory/locks/{domain}.lock.md` with agent ID and timestamp. On session end, all locks are released.

---

## Integration State Synchronization

For external integrations, state synchronization is currently limited (GAP-INT-005, GAP-INT-006):

**Current mode (pull-only):** Integration state is synchronized by polling at session start. Agents read current state from external systems at the beginning of each session.

**Target mode (event-driven):** When GAP-INT-005 and GAP-INT-006 are resolved, integration events will be queued in the event bus during session gaps and replayed at session start.

**Current workaround:** At session start, explicitly poll critical integrations to update their state:
- Jira: open sprints, recently created/updated issues
- GitHub: merged PRs, open review requests
- PagerDuty: active incidents
- Datadog: active alert conditions

---

## Session-End Synchronization Sequence

At session end, before the session closes:

```
1. WRITE ALL ACTIVE RUN-CONTEXTS
   For each active workflow instance: update run-context to current state
   
2. WRITE CONSISTENCY HANDOFF
   Capture: consistency-anchor with any facts updated this session
   Capture: open contradictions
   Capture: knowledge added this session
   Write: handoffs/{session-date}/consistency-handoff.md
   
3. RELEASE ALL DOMAIN LOCKS
   Delete: memory/locks/*.lock.md
   
4. FLUSH WRITE-AHEAD LOG
   Verify: all WAL entries have corresponding completed writes
   Clear: memory/wal.md
   
5. UPDATE MEMORY INDEX
   If new memory entries created this session: update MEMORY_INDEX.md
   
6. EMIT SESSION-END EVENT
   publish: system.session.ended event with summary
```

---

## State Recovery

If a session ends abnormally (crash, timeout) without completing the session-end sequence:

1. At next session start, detect: run-contexts with status=RUNNING and last-session ≠ current-session
2. Find the last written checkpoint for that instance
3. Resume from the checkpoint step (not the current-step in the run-context, which may be ahead of the last checkpoint)
4. Re-execute the step from checkpoint, ignoring any partial work from the interrupted session
5. Any artifacts written after the last checkpoint are quarantined until the step re-executes successfully
