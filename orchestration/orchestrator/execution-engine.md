# Execution Engine

Protocol for running multi-step, multi-agent workflows deterministically.

## Execution Model

```
Workflow = ordered list of Steps
Step = {agent, inputs, outputs, gate}
Gate = validation condition that must pass before next step
```

The engine never skips a gate. If a gate fails, the workflow halts and routes back to the responsible agent.

---

## Step Schema

```yaml
step:
  id: "<step-number>-<slug>"
  name: "<human readable name>"
  agent: "<agent-id from agent-registry.md>"
  
  inputs:
    required:
      - artifact: "<name>"
        path: "<expected file path>"
        schema: "<template name>"
    optional:
      - context: "<wiki page or memory ref>"
  
  instructions: |
    <What this agent must do in this step>
  
  outputs:
    artifact: "<name>"
    path: "<where to write the output>"
    schema: "<template to follow>"
  
  gate:
    type: "checklist | schema | agent-review | human-review"
    criteria:
      - "<condition 1>"
      - "<condition 2>"
    failure_action: "retry | escalate | halt"
  
  handoff:
    to: "<next step id>"
    envelope: "<handoff template path>"
```

---

## Execution States

```
PENDING → IN_PROGRESS → GATE_CHECK → PASSED | FAILED
                                          │         │
                                       NEXT STEP  RETRY/HALT
```

All workflows write their state to `memory/workflow-state/` so they survive context resets.

---

## Gate Types

### `checklist`
Simple boolean checks against the output artifact:
```yaml
gate:
  type: checklist
  criteria:
    - "artifact exists at specified path"
    - "all required sections present"
    - "no placeholder text remaining"
    - "acceptance criteria addressed"
```

### `schema`
Validate artifact against a template structure:
```yaml
gate:
  type: schema
  criteria:
    - "follows template in templates/<name>"
    - "all required fields populated"
    - "metadata header complete"
```

### `agent-review`
Route to supervisor-agent for quality assessment:
```yaml
gate:
  type: agent-review
  reviewer: "supervisor-agent"
  criteria:
    - "quality meets FAANG PM standard"
    - "no contradictions with existing architecture"
    - "security implications considered"
```

### `human-review`
Pause and request human confirmation:
```yaml
gate:
  type: human-review
  prompt: "Please review [artifact] and confirm to proceed"
  criteria:
    - "human approved"
```

---

## Retry Policy

```yaml
retry_policy:
  max_retries: 2
  on_first_fail: "surface specific failure reasons to responsible agent"
  on_second_fail: "escalate to supervisor-agent"
  on_third_fail: "halt workflow, write failure report to memory/failures/"
```

---

## Workflow State File

Each running workflow writes to `memory/workflow-state/<workflow-id>.yaml`:

```yaml
workflow:
  id: "<YYYY-MM-DD>-<workflow-name>-<slug>"
  status: "pending | in_progress | blocked | completed | failed"
  started: "<ISO timestamp>"
  completed: "<ISO timestamp or null>"
  
  steps:
    - step_id: "01-discovery"
      status: "completed"
      artifact: "prds/2026-05-08-checkout-redesign.md"
      completed: "2026-05-08T14:32:00Z"
    
    - step_id: "02-architecture"
      status: "in_progress"
      artifact: null
      started: "2026-05-08T14:35:00Z"
    
    - step_id: "03-implementation"
      status: "pending"
  
  blocked_on: null
  failure_reason: null
```

---

## Parallel Execution

Some workflow steps can run in parallel when they have no dependency:

```yaml
# Example: UX and Architecture can happen simultaneously after PRD
parallel_group:
  - step: "02a-architecture"
    agent: "architect-agent"
  - step: "02b-ux-design"
    agent: "ux-agent"
join_at: "03-implementation"  # both must complete before this step
```

---

## Context Budget Management

Per the context engineering principles from `Agent-Skills-for-Context-Engineering`:

- Each step receives **only** the context it needs (minimum viable context)
- Wiki references are summarized before passing, not passed in full
- Large artifacts are chunked: summary → detail → appendix layers
- Memory is consulted at step start; not included in full
- Handoff envelope is the **only** communication channel between steps

---

## Execution Log

Each step appends to `memory/execution-log.md`:

```
[2026-05-08T14:32:00Z] WORKFLOW:feature-dev-checkout | STEP:01-pm | STATUS:completed | ARTIFACT:prds/checkout.md | GATE:passed
[2026-05-08T14:35:00Z] WORKFLOW:feature-dev-checkout | STEP:02-arch | STATUS:in_progress | AGENT:architect-agent
```
