---
layer: state-models
version: 1.0.0
created: 2026-05-09
status: active
owner: architect-agent
---

# State Models

State models define the valid states of key system entities — workflows, artifacts, and features — and the allowed transitions between them. This prevents agents from operating on artifacts in inconsistent states and makes workflow recovery deterministic.

---

## Why State Models Matter

Without formal state models:
- An agent might act on a DRAFT artifact as though it is APPROVED
- A workflow might proceed past a blocked gate without recovery instructions
- A feature might be considered "shipped" when the rollout is still partial
- Session handoffs lose track of where work was interrupted

State models make the OS's state machine explicit. When a session resumes, agents read the state model to know exactly where each piece of work stands.

---

## Directory Structure

```
state-models/
├── README.md              ← This file
├── workflow-states.md     ← State machine for workflow execution
└── artifact-states.md     ← State machine for artifact lifecycle
```

---

## State Persistence

State is persisted in two locations:

1. **Workflow state:** `memory/workflow-state/<workflow-instance-id>.md`
   - Written after each completed step
   - Read at session start to resume interrupted workflows
   - Format defined in `state-models/workflow-states.md`

2. **Artifact state:** Encoded in the artifact's frontmatter
   - `status: draft | review | approved | active | rejected | superseded | archived`
   - Updated by the agent that changes the artifact's state

---

## State Recovery Protocol

When a session begins:
1. Read `memory/workflow-state/` for any active workflow instances
2. For each active instance, check the `current_step` and `step_status`
3. If a step is `IN_PROGRESS` with no artifact: re-execute from step start
4. If a step is `IN_PROGRESS` with a DRAFT artifact: resume from review
5. If a step is `BLOCKED`: resolve blocker or escalate before proceeding
6. Never skip a step to "catch up" — re-execute from last confirmed COMPLETE step
