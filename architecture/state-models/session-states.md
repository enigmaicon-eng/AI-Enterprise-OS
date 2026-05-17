---
layer: state-models
type: session-states
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
---

# Session Lifecycle State Machine

Defines all states a Claude session can be in, valid transitions, and what must happen at each state boundary.

**Context:** Claude sessions have no native persistence. This state machine governs the explicit persistence protocol that makes Enterprise AI OS continuity possible.

---

## State Diagram

```
                    ┌──────────────────────────────────────┐
                    │         SESSION_STARTING             │
                    │ (context window open, loading state) │
                    └──────────────────┬───────────────────┘
                                       │ STATE_LOADED
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         SESSION_ACTIVE               │◄──┐
                    │ (task execution, agent dispatches)   │   │
                    └───┬──────────────┬───────────────────┘   │
                        │              │                        │
             CONTEXT_   │   MILESTONE  │               CHECKPOINT
             PRESSURE   │   REACHED    │               WRITTEN
                        ▼              ▼                        │
           ┌────────────────┐  ┌─────────────────┐             │
           │ COMPRESSING    │  │ CHECKPOINTING   │─────────────►┘
           │ (compression   │  │ (writing step   │
           │  triggered)    │  │  or session cp) │
           └──────┬─────────┘  └─────────────────┘
                  │ COMPRESSED
                  │
                  ▼
                  └─────────────────────────────┐
                                                ▼
                    ┌──────────────────────────────────────┐
                    │         SESSION_CLOSING              │
                    │ (generating handoff, final writes)  │
                    └──────────────────┬───────────────────┘
                                       │ HANDOFF_COMPLETE
                                       ▼
                    ┌──────────────────────────────────────┐
                    │         SESSION_CLOSED               │
                    │ (context window ended)               │
                    └──────────────────────────────────────┘
                                       
                    (Next session starts from SESSION_STARTING)
                    (State is reconstructed from disk artifacts)
```

---

## State Definitions

### SESSION_STARTING
- **Description:** A new Claude context window has opened. State is being loaded from disk.
- **Required actions (6-step sync protocol from `knowledge-governance/runtime-state-synchronization.md`):**
  1. Load session checkpoint from `handoffs/session-{date}/`
  2. Read consistency anchor (verify organizational facts)
  3. Detect any state changes since last session (new files, git commits)
  4. Reconstruct all active workflow run-contexts
  5. Check for blocking conditions (open questions, capability gaps)
  6. Surface critical context: open Q-001 through Q-008, capability gaps, CRITICAL risks
- **Completion:** State confirmed → SESSION_ACTIVE
- **Failure:** Inconsistent state detected → flag for reconciliation, proceed with known state

### SESSION_ACTIVE
- **Description:** Normal operating state. Orchestrator dispatches agents, workflows execute, artifacts are produced.
- **Allowed operations:** All normal agent operations
- **Monitoring:**
  - Context usage: track tokens consumed
  - Loop detection: flag if same pattern repeats
  - Consistency: post-output check after each major artifact
- **Triggers for transition:**
  - Context window at ~60% → consider COMPRESSING
  - Context window at ~80% → COMPRESSING required
  - Milestone reached (step completed) → CHECKPOINTING
  - Session voluntarily ended → SESSION_CLOSING

### COMPRESSING
- **Description:** Context compression being applied to recover context window space.
- **Compression trigger:** Token budget at 90% of session limit
- **Algorithm:** Apply context-compression-protocol.md (Stages 1-5 in order)
- **Constraint:** Binding constraints (P0) must survive all compression stages
- **Post-compression:** Resume SESSION_ACTIVE with recovered budget

### CHECKPOINTING
- **Description:** Writing a checkpoint to disk (step-level or session-level).
- **Triggers:**
  - Every completed workflow step → step checkpoint
  - Every 30 minutes of active session → session checkpoint
  - User-requested → session checkpoint
  - Approaching context limit → session checkpoint
- **Required writes:**
  - Step checkpoint: `memory/workflow-state/{instance-id}/checkpoints/step-{N}.md`
  - Session checkpoint: `handoffs/session-{date}/session-checkpoint.md`
- **Post-checkpoint:** Resume SESSION_ACTIVE

### SESSION_CLOSING
- **Description:** Session is ending (context window closing or user ending session). Final persistence operations.
- **Required actions (6-step session-end sequence from `knowledge-governance/runtime-state-synchronization.md`):**
  1. Write final session checkpoint (all active workflow instances)
  2. Generate handoff package: `handoffs/session-{date}/`
     - `session-handoff.md` — what was accomplished
     - `next-steps.md` — what to do next
     - `important-decisions.md` — decisions made this session
     - `workflow-status.md` — all workflow instance statuses
     - `known-risks.md` — any new risks identified
  3. Update run-context for all active workflow instances
  4. Update wiki with new knowledge synthesized this session
  5. Update cognition indexes if new files were created
  6. Write cross-session consistency handoff YAML
- **Completion:** HANDOFF_COMPLETE → SESSION_CLOSED

### SESSION_CLOSED
- **Description:** Terminal state. Context window has ended. Artifacts persisted on disk.
- **Recovery:** Next session reads from `handoffs/session-{date}/` to reconstruct state

---

## Abnormal Session Termination

If a session ends without completing SESSION_CLOSING (crash, timeout, context overflow):

**Recovery protocol (from `memory-governance/continuity-checkpoint-system.md`):**
1. Load most recent step checkpoint
2. Load most recent session checkpoint (if older than step checkpoint, note the gap)
3. Reconstruct run-context from checkpoint data
4. Mark steps completed after last checkpoint as UNKNOWN (must re-verify or re-execute)
5. Emit `system.session.ended` event with `termination: ABNORMAL`
6. Flag to orchestrator for human review if UNKNOWN steps affect critical artifacts

---

## Autonomous Continuation (Session-to-Session)

For workflows that span multiple sessions, autonomous continuation is permitted when all conditions pass (from `memory-governance/continuity-checkpoint-system.md`):

1. Session checkpoint exists and passes integrity check
2. All P0 binding constraints are present in checkpoint
3. No open human gate markers
4. No contradictions detected
5. No step-limit violations pending
6. Next step is clearly defined in run-context

When autonomous continuation is authorized:
- New session loads from checkpoint
- Reconstructs run-context
- Resumes at the next pending step
- Does NOT require re-approval of already-approved artifacts

---

## Session State Observability

| Transition | Event Type |
|---|---|
| → SESSION_ACTIVE | `system.session.started` |
| → CHECKPOINTING (step) | `system.context.checkpoint.written` |
| → COMPRESSING | `system.context.compressed` |
| → SESSION_CLOSED (normal) | `system.session.ended` (termination: NORMAL) |
| → SESSION_CLOSED (abnormal) | `system.session.ended` (termination: ABNORMAL) |

---

## Session State Metadata

Each session checkpoint records:

```yaml
session-metadata:
  session-id: "{UUID}"
  session-date: "{ISO-8601}"
  session-start: "{ISO-8601}"
  session-end: "{ISO-8601}"
  termination-type: "NORMAL|ABNORMAL"
  active-workflow-instances: N
  steps-completed-this-session: N
  artifacts-produced-this-session: N
  context-compressions-applied: N
  peak-context-usage-pct: N
  open-workflow-instances: ["{instance-ids}"]
  next-session-priority: "{what to do first in next session}"
```