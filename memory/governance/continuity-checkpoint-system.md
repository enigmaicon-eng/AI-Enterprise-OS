---
layer: memory-governance
type: continuity-checkpoint-system
version: 1.0.0
created: 2026-05-10
owner: cross-agent-continuity-agent
authority: knowledge-systems-architect-agent
---

# Continuity Checkpoint System

The protocol that guarantees organizational continuity across session boundaries. A checkpoint is a deterministic, self-consistent snapshot that allows any agent to reconstruct the complete organizational state as it was at a specific moment.

The checkpoint system is the primary defense against CRITICAL-003 (state persistence absence) and session-boundary continuity risk.

---

## Checkpoint Hierarchy

Three levels of checkpoints, each serving a different continuity purpose:

```
LEVEL 1: STEP CHECKPOINTS (finest granularity)
  Written: after every workflow step completes
  Path: memory/workflow-state/{instance-id}-step-{N}.checkpoint.md
  Contains: step output, quality score, next-step preconditions
  Purpose: enable exact workflow resume from any step
  Retention: until workflow instance completes (then archived)

LEVEL 2: SESSION CHECKPOINTS (session granularity)
  Written: at every session end
  Path: handoffs/{session-date}/session-checkpoint.md
  Contains: all active run-contexts, consistency anchor, knowledge updates, open items
  Purpose: enable next session to reconstruct full organizational state
  Retention: 90 days (then archived)

LEVEL 3: SPRINT CHECKPOINTS (sprint granularity)
  Written: at sprint close
  Path: sprints/{sprint-id}/sprint-checkpoint.md
  Contains: sprint outcome, velocity data, carried items, knowledge learned, risks updated
  Purpose: enable cross-sprint organizational learning and continuity
  Retention: permanent (organizational memory asset)
```

---

## Step Checkpoint Specification

```yaml
# memory/workflow-state/{instance-id}-step-{N}.checkpoint.md
checkpoint:
  type: step
  instance-id: "{workflow-instance-id}"
  step-number: N
  workflow-id: "{workflow-id}"
  written-at: "{ISO-8601}"
  written-by: "{agent-id}"
  session-id: "{session-id}"
  
  step-output:
    artifact-path: "{canonical path of produced artifact}"
    artifact-type: "{type}"
    artifact-version-hash: "{hash}"
    quality-score: {0-100}
    quality-verdict: "PASS|CONDITIONAL|FAIL"
    self-validation-iterations: N  # how many times the agent retried before passing
    
  next-step-context:
    step-number: N+1
    assigned-agent: "{agent-id}"
    required-inputs: ["{artifact-path}", ...]
    blocking-conditions: []  # must be empty to auto-start next step
    human-required: true|false
    
  knowledge-produced:
    # any memory entries created during this step
    - path: "{memory-entry-path}"
      type: "{type}"
      importance: "{critical|high|normal}"
      
  state-after-step:
    # snapshot of all relevant state AFTER this step completed
    completed-steps: [1, 2, ..., N]
    artifacts-produced: ["{path}", ...]
    open-questions-in-workflow: N
```

Adapted from TradingAgents' LangGraph checkpoint/resume — checkpoint after every step, not only at milestones.

---

## Session Checkpoint Specification

```yaml
# handoffs/{session-date}/session-checkpoint.md
checkpoint:
  type: session
  session-id: "{session-id}"
  written-at: "{ISO-8601}"
  written-by: cross-agent-continuity-agent
  operator-id: "{operator-id}"
  
  # All active workflow instances and their current state
  active-workflow-instances:
    - instance-id: "{UUID}"
      workflow-id: "{workflow-id}"
      current-step: N
      status: "RUNNING|PAUSED|BLOCKED"
      last-checkpoint: "memory/workflow-state/{instance-id}-step-{N}.checkpoint.md"
      blocking-reason: null  # or description
      next-action: "{what must happen for this to continue}"
      
  # Current organizational facts (consistency anchor)
  consistency-anchor:
    agent-count: 144
    org-count: 17
    integration-count: 33
    open-questions: [Q-001, Q-002, Q-003, Q-004, Q-005]
    active-gaps: [GAP-INT-001, GAP-INT-002, GAP-INT-003, GAP-INT-004, GAP-INT-005, GAP-INT-006, GAP-INT-007]
    system-version: "3.0.0"
    constitution-status: "DRAFT"
    maturity-score: "2.3/5"
    
  # Knowledge written this session
  knowledge-created:
    - path: "{path}"
      type: "{type}"
      domain: "{domain}"
      importance: "{importance}"
      
  # Decisions made this session
  decisions-made:
    - decision-id: "D-NNN"
      summary: "{one line}"
      artifact: "{path}"
      
  # Open items requiring next-session action
  open-items:
    - id: "{id}"
      type: "question|blocker|contradiction|risk"
      description: "{text}"
      urgency: "HIGH|MEDIUM|LOW"
      assigned-to: "{agent-id or human}"
      
  # Contradictions state
  contradictions:
    resolved-this-session: N
    still-open: [{id: "CONT-NNN", ...}]
    
  # Next-session initialization instructions
  next-session:
    first-action: "{what the next session should do first}"
    workflow-to-resume: "{instance-id}"  # null if none
    human-decisions-needed: [{decision-id, context}]
```

---

## Autonomous Continuation Protocol

When a workflow instance can continue autonomously across a session boundary (no human gates pending, no blocking conditions):

```
AUTONOMOUS CONTINUATION CRITERIA:
  ✓ Valid step checkpoint exists for last-completed step
  ✓ Next step has no human-required gate
  ✓ No blocking conditions in the run-context
  ✓ All required input artifacts for next step are ACTIVE (not STALE/ARCHIVED)
  ✓ Agent assigned to next step is available (registered in MASTER-REGISTRY)
  ✓ Loop detection has not fired for next step

CONTINUATION SEQUENCE:
  1. Session starts → consistency anchor loaded
  2. Run-context loaded from memory/workflow-state/{instance-id}.run-context.md
  3. Step checkpoint loaded for last completed step
  4. Verify: all next-step preconditions met
  5. Dispatch next-step agent with context package assembled from checkpoint
  6. Agent executes step → writes step checkpoint → updates run-context
  7. Continue until: human gate reached, blocking condition, or completion
```

Adapted from dexter's autonomous continuation + loop detection pattern.

---

## Checkpoint Integrity Verification

Before loading any checkpoint, verify its integrity:

```
INTEGRITY CHECKS:
  1. Version hash match: artifact-path file still has the same hash as recorded
     → If mismatch: artifact was modified after checkpoint was written
     → Resolution: re-execute the step (artifact may have changed for valid reasons)
     
  2. Dependency satisfaction: all required inputs for next step still ACTIVE
     → If any dependency STALE: revalidate dependency first
     → If any dependency ARCHIVED: escalate (major state change since checkpoint)
     
  3. Agent availability: assigned-agent still registered in MASTER-REGISTRY
     → If agent removed: reassign to equivalent agent in same domain
     
  4. Contradiction-free context: no open contradictions affecting this workflow's domain
     → If contradictions open: load contradiction context into step context package
```

---

## Checkpoint Retention and Archival

| Checkpoint Type | Retention | Archive Location |
|---|---|---|
| Step checkpoints (active workflow) | Until instance completes | `memory/workflow-state/` |
| Step checkpoints (completed workflow) | 30 days | `memory/archive/workflow-state/` |
| Session checkpoints | 90 days (active), then archive | `handoffs/archive/{year}/` |
| Sprint checkpoints | Permanent | `sprints/{sprint-id}/` |
| Emergency checkpoints (on failure) | 180 days | `memory/archive/emergency/` |

---

## Emergency Checkpoint

If a session is interrupted before the normal session-end sequence, an emergency checkpoint captures whatever state was last known:

```
Emergency checkpoint trigger: abnormal session termination detected at next session start
Detection: run-context shows status=RUNNING, last-session ≠ current-session, 
           no session-checkpoint from last-session in handoffs/

Recovery:
  1. Find last-written step checkpoint for the instance
  2. Load that checkpoint as the emergency recovery point
  3. Quarantine: any artifacts written AFTER the last checkpoint (unsure if committed cleanly)
  4. Re-execute from the last checkpoint step
  5. Write emergency checkpoint record to handoffs/{date}/emergency-recovery.md
```
