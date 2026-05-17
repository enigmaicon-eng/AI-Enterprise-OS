---
layer: state-models
type: workflow-state-machine
version: 1.0.0
created: 2026-05-09
owner: architect-agent
---

# Workflow State Machine

The canonical state machine for workflow execution. All workflow instances must follow these states and transitions.

---

## Workflow Instance States

```
NOT_STARTED
    │
    ↓ (trigger received, preconditions met)
RUNNING
    │
    ├──→ BLOCKED (precondition missing or gate failed)
    │        │
    │        ↓ (blocker resolved)
    │    RUNNING
    │
    ├──→ SUSPENDED (operator paused, session ended)
    │        │
    │        ↓ (session resumed, recovery complete)
    │    RUNNING
    │
    ├──→ ESCALATED (requires human decision)
    │        │
    │        ↓ (human responds)
    │    RUNNING or CANCELLED
    │
    └──→ COMPLETE
         or
    └──→ CANCELLED (explicitly terminated)
         or
    └──→ FAILED (unrecoverable error)
```

---

## Step States (within a RUNNING workflow)

```
NOT_STARTED → IN_PROGRESS → COMPLETE
                   │
                   ├──→ BLOCKED (input missing)
                   │        │
                   │        ↓ (input provided)
                   │    IN_PROGRESS
                   │
                   ├──→ GATE_REVIEW (submitted to gate)
                   │        │
                   │        ├──→ GATE_PASS → COMPLETE
                   │        │
                   │        └──→ GATE_FAIL → IN_PROGRESS (revision required)
                   │
                   └──→ FAILED (unrecoverable)
```

---

## Workflow State Persistence Format

Each active workflow instance writes its state to `memory/workflow-state/<instance-id>.md`:

```yaml
---
workflow: feature-development
instance-id: FD-2026-05-09-001
initiated: 2026-05-09T10:00:00Z
status: RUNNING
current-step: 3
---

# Workflow State: Feature Development — User Auth Redesign

## Context
- Feature: User authentication redesign
- Tier: L
- PRD: prds/2026-05-09-user-auth-redesign.md
- ADR: architecture/decisions/ADR-001-auth-architecture.md (pending)

## Step Status

| Step | Agent | Status | Artifact | Notes |
|------|-------|--------|---------|-------|
| 1. Discovery | pm-agent | COMPLETE | prds/2026-05-09-user-auth-redesign.md | G1 PASS 2026-05-09 |
| 2. Architecture | architect-agent | IN_PROGRESS | — | ADR in draft |
| 3. Security Review | security-agent | NOT_STARTED | — | Awaiting ADR |
| 4. UX Design | ux-agent | NOT_STARTED | — | — |
| 5. Engineering | engineer-agent | NOT_STARTED | — | — |
| 6. QA | qa-agent | NOT_STARTED | — | — |
| 7. Release | delivery-agent | NOT_STARTED | — | — |

## Open Blockers

- Blocker: ADR-001 not yet approved (architect-agent owns)
- Impact: Steps 3–7 cannot begin

## Last Updated
2026-05-09T14:30:00Z by architect-agent
```

---

## State Transition Rules

### Transition: NOT_STARTED → RUNNING
**Preconditions:**
- All required input artifacts exist at canonical paths
- No blocking open questions in scope
- No CRITICAL risks unmitigated in scope

**On transition:** Write initial state file to `memory/workflow-state/`

---

### Transition: RUNNING → BLOCKED
**Trigger:** Agent cannot proceed because a required input is missing or a gate fails
**Required action:** Write block notice to state file specifying:
- What is missing
- Who owns the missing item
- What the agent will do when unblocked

**Prohibited:** Proceeding past a block silently

---

### Transition: BLOCKED → RUNNING
**Trigger:** Blocker is resolved (input provided, gate re-evaluated)
**Required action:** Update state file with resolution note

---

### Transition: RUNNING → SUSPENDED
**Trigger:** Operating session ends while workflow is in progress
**Required action:** Write current state snapshot to `memory/workflow-state/`; the session handoff must reference all suspended workflows

---

### Transition: SUSPENDED → RUNNING
**Trigger:** New session starts and operator resumes workflow
**Required action:** Read state file; verify current-step artifact exists; re-read context package for the resuming step

---

### Transition: step → GATE_FAIL
**Required action:**
- Write gate failure note to state file
- Assign revision back to the creating agent
- Do NOT increment step counter — step must be re-executed
- If second consecutive fail: escalate to supervisor-agent

---

### Transition: RUNNING → COMPLETE
**Required action:**
- All steps must be in COMPLETE state
- Write completion record to state file
- Trigger wiki-maintenance workflow (one step: log learnings)
- Archive state file with completion date

---

## Recovery Decision Tree

On session start, for each active workflow instance:

```
Read state file
    │
    ├── status = RUNNING
    │       └── current-step IN_PROGRESS with no artifact?
    │               YES → re-execute step from start
    │               NO  → resume from in-progress state
    │
    ├── status = BLOCKED
    │       └── Is blocker resolved?
    │               YES → transition BLOCKED → RUNNING, proceed
    │               NO  → notify operator; do not proceed
    │
    ├── status = SUSPENDED
    │       └── Load context package for current step, resume
    │
    └── status = ESCALATED
            └── Human has responded?
                    YES → record response, continue
                    NO  → notify operator; do not proceed
```
