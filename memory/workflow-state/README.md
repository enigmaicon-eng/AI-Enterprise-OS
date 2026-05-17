# Workflow State

Active and recent workflow state files. These allow workflow recovery after context resets.

## File Naming

`<YYYY-MM-DD>-<workflow-name>-<slug>.yaml`

Example: `2026-05-08-feature-development-checkout-redesign.yaml`

## State File Format

```yaml
workflow:
  id: "2026-05-08-feature-development-checkout-redesign"
  name: "feature-development"
  slug: "checkout-redesign"
  status: "in_progress"  # pending | in_progress | blocked | completed | failed
  started: "2026-05-08T14:00:00Z"
  completed: null

  steps:
    - step_id: "01-prd"
      name: "Discovery & PRD"
      agent: "pm-agent"
      status: "completed"  # pending | in_progress | gate_check | passed | failed
      artifact: "prds/2026-05-08-checkout-redesign.md"
      completed: "2026-05-08T14:32:00Z"

    - step_id: "02a-architecture"
      name: "Architecture Design"
      agent: "architect-agent"
      status: "in_progress"
      artifact: null
      started: "2026-05-08T14:35:00Z"

    - step_id: "02b-ux"
      name: "UX Design"
      agent: "ux-agent"
      status: "pending"
      artifact: null

  blocked_on: null
  failure_reason: null
  notes: []
```

## Recovery Protocol

If a workflow is interrupted:
1. Read the state file for the workflow
2. Identify the last completed step and its artifact
3. Resume from the next step with the artifact as input
4. Do not re-execute completed steps

## Cleanup

State files for completed workflows are archived after 30 days. Failed workflow states are kept indefinitely for analysis.
