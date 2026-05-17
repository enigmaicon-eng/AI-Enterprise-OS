# Organizational Continuity System

**System ID:** `organizational-continuity`
**Role:** Maintains continuity of the organization's operating state across sessions, agent rotations, and extended time gaps — not just workflow state, but organizational memory, active commitments, and decision rationale
**Scope:** Cross-workflow, cross-session, cross-agent

---

## Purpose

Workflow-level continuation handles individual workflows. Organizational Continuity handles the broader organizational state — the active commitments, pending decisions, delegated work, escalation queues, and accumulated organizational intelligence that must survive across sessions regardless of which specific workflows are in flight.

This is the difference between "where was this workflow?" (handled by continuation-engine) and "what was the organization doing and thinking?" (handled here).

---

## Organizational State Dimensions

### Dimension 01: Active Work Inventory
*What is in-flight across the entire organization?*

```yaml
active_work_inventory:
  active_workflows:
    - workflow_id: [id]
      type: [workflow-type]
      step_current: [step]
      owner_agent: [agent]
      priority: [critical | high | normal | low]
      due: [date]
      status: [RUNNING | SUSPENDED | BLOCKED | ESCALATED]
  
  delegated_tasks:
    - task_id: [id]
      delegated_to: [agent]
      delegated_by: [agent]
      task: [description]
      expected_by: [date]
      status: [pending | in_progress | returned | complete]
  
  human_decisions_pending:
    - decision_id: [id]
      question: [description]
      context_path: [path to decision context]
      urgency: [immediate | this_sprint | this_quarter]
      blocking: [what waits on this decision]
```

### Dimension 02: Organizational Decision Log
*What has the organization decided and why?*

The decision log goes beyond individual ADRs — it captures the organizational reasoning pattern across all decisions.

```yaml
organizational_decision_log:
  - decision_id: [id]
    date: [date]
    domain: [PM | arch | eng | QA | UX | strategy]
    decision: [what was decided]
    rationale: [why — key factors]
    decided_by: [agents involved]
    alternatives_rejected: [list]
    reversibility: [FINAL | REVISABLE | TIME-BOUNDED]
    expires: [date or null]
    related_workflows: [list]
    wiki_reference: [path if documented]
```

### Dimension 03: Active Commitments
*What has the organization committed to that future agents must honor?*

```yaml
active_commitments:
  - commitment_id: [id]
    commitment: [what was committed]
    committed_to: [stakeholder or dependency]
    committed_by: [agent or workflow]
    date: [when committed]
    due: [when it must be fulfilled]
    status: [active | at_risk | fulfilled | broken]
    related_workflow: [workflow-id]
    fulfillment_artifact: [path when fulfilled]
```

### Dimension 04: Organizational Intelligence State
*What does the organization know and what is it trying to learn?*

```yaml
intelligence_state:
  active_investigations:
    - id: [investigation-id]  # from research-intelligence/
      topic: [topic]
      status: [ACTIVE | PAUSED | COMPLETE]
  
  validated_knowledge:
    last_updated: [timestamp]
    domains_researched: [list]
    key_facts_count: [N]
    stale_areas: [list needing refresh]
  
  open_questions:
    - question: [text]
      domain: [domain]
      blocking: [decision or workflow]
      priority: [H/M/L]
```

### Dimension 05: Escalation and Approval Queue
*What is waiting for human input?*

```yaml
escalation_queue:
  - escalation_id: [id]
    type: [human_approval | expert_review | conflict_resolution | budget_decision]
    summary: [one-sentence description]
    context_path: [path to full context]
    urgency: [immediate | this_sprint | this_quarter]
    blocking_workflow: [workflow-id]
    blocking_step: [step-id]
    raised_by: [agent]
    raised_at: [timestamp]
    resolved: false
    resolution: null
```

---

## Organizational State Snapshot

Written to `memory/organizational-continuity.yaml` at every session boundary:

```yaml
organizational_continuity:
  snapshot_id: "snap-[YYYY-MM-DD]-[N]"
  timestamp: "[ISO-8601]"
  session_ending: "[session-number]"
  
  summary: |
    [2-3 sentence plain-English summary of where the organization is
    and what it was doing — readable by a new session cold]
  
  active_work: [see Dimension 01]
  decision_log: [see Dimension 02]
  commitments: [see Dimension 03]
  intelligence_state: [see Dimension 04]
  escalations: [see Dimension 05]
  
  recommended_next_actions:
    - priority: 1
      action: "[what to do first in next session]"
      reason: "[why this is first]"
      workflow: "[workflow-id if applicable]"
    - priority: 2
      action: "[second priority]"
```

---

## Session Start Protocol

At the beginning of every new session, the master orchestrator reads this file and injects the organizational continuity summary:

```
ORGANIZATIONAL STATE RESTORATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last session: [timestamp]
[Summary paragraph]

Active workflows: [N] — [brief list]
Pending human decisions: [N] — [brief list or "none"]
Active commitments at risk: [N]
High-priority next action: [action]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This ensures the new session immediately understands organizational context without reading every workflow state file.

---

## Session End Protocol

At the end of every session, before context window closes:

1. **Flush in-progress work** → write all draft artifacts with `[DRAFT-IN-PROGRESS]` header
2. **Update workflow states** → mark in-flight steps as SUSPENDED with sub-task note
3. **Checkpoint active workflows** → trigger `workflow-checkpoints/checkpoint-engine.md`
4. **Write organizational snapshot** → update `memory/organizational-continuity.yaml`
5. **Queue escalations** → any unresolved decisions go to escalation queue
6. **Write session summary** → append to `memory/session-log.md`

**Session summary format:**
```yaml
session:
  id: "[session-number]"
  date: "[date]"
  duration: "[approximate]"
  
  completed:
    - "[what was finished]"
  
  in_progress:
    - workflow: "[id]"
      step_stopped_at: "[step-id]"
      sub_task_stopped_at: "[description]"
      next_action: "[specific next action for next session]"
  
  decisions_made:
    - "[decision]"
  
  commitments_made:
    - "[commitment]"
  
  blockers_encountered:
    - "[blocker and owner]"
  
  handoff_note: |
    [Plain English note to next session: what to do, in what order, and why]
```

---

## Long-Gap Continuity (Multi-Day Sessions)

When a session gap exceeds 24 hours:

**Intelligence decay management:**
- Competitive signals older than 30 days: flag as [STALE — VERIFY]
- Market data older than 180 days: flag as [NEEDS REFRESH]
- Technical decisions older than 90 days: flag as [REVISIT — ecosystem may have changed]

**Commitment currency check:**
- Review all active commitments — are due dates still in the future?
- Flag any commitments past due as [OVERDUE — requires immediate attention]

**Decision validity check:**
- Review FINAL decisions made > 90 days ago
- Technology decisions may need revisiting as ecosystems evolve
- Market positioning decisions may need revisiting as competitive landscape shifts

---

## Organizational Memory Persistence

| Memory Type | File | TTL | Managed By |
|------------|------|-----|-----------|
| Active work inventory | `memory/organizational-continuity.yaml` | Current | This system |
| Decision log | `memory/organizational-memory.md` | Indefinite | This system |
| Session log | `memory/session-log.md` | 90 days rolling | This system |
| Workflow states | `memory/workflow-state/*.yaml` | Until complete | `execution-engine.md` |
| Validated facts | `intelligence-memory/validated-facts.jsonl` | Per TTL | Research system |

---

## Integration

**Written to at session end by:**
- `orchestrator/master-orchestrator.md`
- `continuation-systems/continuation-engine.md`

**Read at session start by:**
- `orchestrator/master-orchestrator.md`
- `continuation-systems/continuation-engine.md`
- `runtime-recovery/cold-start-recovery.md`

**Also integrates with:**
- `research-intelligence/orchestrator.md` → intelligence state sync
- `execution-persistence/execution-registry.md` → active work inventory sync
