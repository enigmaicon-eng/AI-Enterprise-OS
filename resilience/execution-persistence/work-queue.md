# Work Queue

**System ID:** `work-queue`
**Role:** Persistent, priority-ordered queue of all pending and in-progress work items across all workflows — ensures no work is lost when sessions end, agents are interrupted, or context resets
**Storage:** `memory/work-queue.yaml` (primary) + `memory/execution-store/work-queue-log.jsonl` (audit trail)

---

## Purpose

The work queue is the system's global to-do list. When the orchestrator or an agent produces work that cannot be immediately executed — because no agent is available, because a dependency has not resolved, or because the session ended — that work is enqueued here. On session start, the orchestrator reads the queue and resumes exactly where it left off.

The queue solves a specific problem: **without a persistent queue, work that was "about to happen" when a session ended is silently lost.** The orchestrator resumes, sees no in-flight work, and waits for a new request — not knowing that it already had work queued.

---

## Queue Item Schema

```yaml
queue_items:
  - item_id: "qi-[uuid]"
    workflow_id: "[workflow-id]"
    step_id: "[step-id]"
    
    # What needs to happen
    task_type: "execute_step | re_execute_step | gate_check | escalation | delegation | coordination"
    task_description: "[one sentence — what this item asks the system to do]"
    
    # Priority and ordering
    priority: "CRITICAL | HIGH | MEDIUM | LOW"
    priority_score: 0    # 0-100, higher = sooner
    enqueued_at: "[ISO-8601]"
    deadline: "[ISO-8601 or null]"
    
    # State
    status: "PENDING | IN_PROGRESS | BLOCKED | COMPLETE | CANCELLED | FAILED"
    assigned_to: "[agent-id or null]"
    started_at: "[ISO-8601 or null]"
    completed_at: "[ISO-8601 or null]"
    retry_count: 0
    max_retries: 3
    
    # Dependencies (this item cannot start until these resolve)
    depends_on:
      items: ["[qi-uuid]"]          # other queue items
      artifacts: ["[art-uuid]"]     # artifacts that must exist and be GATE_PASSED
      human_responses: ["[esc-id]"] # escalations awaiting human input
    
    # Inputs this item needs
    input:
      artifact_paths: ["[path]"]
      context_refs: ["[checkpoint-id or session-bridge-id]"]
      parameters: {}
    
    # Expected output
    expected_output:
      artifact_name: "[name]"
      artifact_path: "[path]"
      
    # Routing
    agent_hint: "[agent-id that should handle this — null = orchestrator decides]"
    requires_human: false
    
    # History
    attempts: []     # list of attempt records
    notes: "[optional context for the agent who picks this up]"
```

---

## Task Types

| Task Type | Description | Who executes |
|-----------|-------------|--------------|
| `execute_step` | Run a step for the first time | Assigned agent |
| `re_execute_step` | Re-run a step after gate failure or rollback | Assigned agent |
| `gate_check` | Submit artifact to gate for review | Gate system / reviewer |
| `escalation` | Item requiring human or supervisor decision | Supervisor / human |
| `delegation` | Delegate a task to a specialist agent | Orchestrator → specialist |
| `coordination` | Multi-workflow coordination trigger | Orchestrator |

---

## Priority Scoring

Priority score (0-100) determines dequeue order within the same priority class.

| Factor | Score Contribution |
|--------|--------------------|
| Priority class: CRITICAL | +80 |
| Priority class: HIGH | +60 |
| Priority class: MEDIUM | +40 |
| Priority class: LOW | +20 |
| Deadline within 1 hour | +15 |
| Deadline within 4 hours | +10 |
| Deadline within 24 hours | +5 |
| Blocking other items | +10 per blocked item |
| Retry count > 0 | -5 per retry |
| Estimated duration < 5 min | +3 (quick win bonus) |

Dequeue order: sort by `priority_score DESC`, then `enqueued_at ASC` (FIFO within same score).

---

## Queue Operations

### Enqueue Item

```
INPUT: workflow_id, step_id, task_type, task_description, priority, inputs, dependencies

WRITE:
  1. Generate item_id
  2. Compute priority_score
  3. Append to memory/work-queue.yaml (under queue_items)
  4. Append log record to work-queue-log.jsonl
  5. Log to execution-ledger.jsonl (event: work_item_enqueued)

RETURN: item_id
```

### Dequeue Next Item

Called by orchestrator at session start and after completing each item:

```
READ: memory/work-queue.yaml

FILTER:
  1. status == "PENDING"
  2. All depends_on.items have status == "COMPLETE"
  3. All depends_on.artifacts exist with status == "GATE_PASSED"
  4. All depends_on.human_responses have been resolved

SORT: priority_score DESC, enqueued_at ASC

RETURN: top item, or null if queue is empty or all items are blocked
```

### Mark In Progress

Called when an agent begins working on a queue item:

```
INPUT: item_id, agent_id

WRITE:
  1. Update status = "IN_PROGRESS"
  2. Set assigned_to, started_at
  3. Append attempt record: {attempt_number, started_at, agent_id}
  4. Update work-queue-log.jsonl
```

### Mark Complete

```
INPUT: item_id, output_artifact_id

WRITE:
  1. Update status = "COMPLETE"
  2. Set completed_at
  3. Close attempt record
  4. Resolve dependencies: find all items with depends_on.items containing this item_id
     → Re-evaluate their blocked status
  5. Update work-queue-log.jsonl
  6. Log to execution-ledger.jsonl
```

### Mark Failed

```
INPUT: item_id, failure_reason

WRITE:
  1. Increment retry_count
  2. IF retry_count < max_retries:
     → Reset status = "PENDING"
     → Re-score priority (apply retry penalty)
  3. IF retry_count >= max_retries:
     → Set status = "FAILED"
     → Trigger escalation: open escalation item for this failure
  4. Log failure to attempt record
  5. Update work-queue-log.jsonl
```

### Cancel Item

```
INPUT: item_id, reason

WRITE:
  1. Update status = "CANCELLED"
  2. Set notes += "[CANCELLED: reason]"
  3. Find all items that depend_on this item → mark them as BLOCKED
  4. Log to work-queue-log.jsonl
```

### Check Blocked Items

Run periodically to re-evaluate blocked items:

```
FOR EACH item WHERE status == "BLOCKED":
  Check all depends_on:
    IF all dependencies now resolved:
      → Set status = "PENDING"
      → Re-compute priority_score
```

---

## Queue State File Format

`memory/work-queue.yaml`:

```yaml
queue_state:
  generated_at: "[ISO-8601]"
  total_items: 0
  pending_count: 0
  in_progress_count: 0
  blocked_count: 0
  complete_count: 0
  failed_count: 0
  cancelled_count: 0
  
  next_item_id: "[qi-uuid — precomputed for next enqueue]"
  
  summary:
    critical_pending: 0
    high_pending: 0
    human_required: 0
    estimated_total_duration: "[estimate]"

queue_items:
  - [item records as above]
```

---

## Session Start Protocol

At every session start, the orchestrator reads the queue:

```
STEP 1: Load memory/work-queue.yaml
STEP 2: Run Check Blocked Items (re-evaluate all BLOCKED items)
STEP 3: Identify IN_PROGRESS items from prior session:
  → Any item with status == "IN_PROGRESS" but session has ended
  → Reset these to "PENDING" (agent was interrupted — re-queue)
  → Log: "Recovered [N] interrupted items from prior session"
STEP 4: Run Dequeue Next Item
STEP 5: Present orchestrator with:
  - Items to execute (PENDING, dependency-free)
  - Items blocked on human input (requires_human == true)
  - Items blocked on artifact dependencies
  - Failed items needing attention
```

### Session Start Queue Report

```
WORK QUEUE STATUS
═════════════════
READY TO EXECUTE (N items):
  1. [task_description] — [workflow]:[step] — priority: [P]
  2. [task_description] — [workflow]:[step] — priority: [P]

BLOCKED ON HUMAN INPUT (N items):
  1. [task_description] — waiting for: [esc-id]

BLOCKED ON DEPENDENCIES (N items):
  1. [task_description] — waiting for: [artifact/item]

FAILED (needs investigation) (N items):
  1. [task_description] — failed [retry_count] times — reason: [last failure]
```

---

## Work Queue Log Format

`memory/execution-store/work-queue-log.jsonl`:

```json
{
  "event_type": "item_enqueued | item_started | item_completed | item_failed | item_cancelled | item_unblocked",
  "item_id": "qi-[uuid]",
  "workflow_id": "[id]",
  "step_id": "[step-id]",
  "timestamp": "[ISO-8601]",
  "session_id": "[session]",
  "details": {}
}
```

---

## Queue Integrity

**No silent drops:** Every item enqueued must reach a terminal state (COMPLETE, FAILED, CANCELLED). Orphan PENDING items (no matching workflow in registry) are flagged on startup.

**No double-execution:** Before executing any `execute_step` item, check the artifact registry. If the artifact already exists and is `GATE_PASSED`, mark the queue item COMPLETE without re-executing.

**Idempotent enqueue:** Before adding an item, check if an equivalent item (same workflow_id + step_id + task_type + status PENDING) already exists. If so, return existing item_id without creating duplicate.

---

## Integration

**Written to by:**
- `continuation-systems/deterministic-executor.md` → enqueues next steps
- `orchestrator/master-orchestrator.md` → enqueues new workflow steps
- `recovery-systems/*.md` → enqueues recovery tasks
- `continuation-systems/workflow-continuator.md` → enqueues resumed steps

**Read by:**
- `orchestrator/master-orchestrator.md` → dequeues and dispatches work
- `runtime-recovery/recovery-orchestrator.md` → scans for interrupted work
- `continuation-systems/session-bridger.md` → includes queue state in bridge package
- `recovery-systems/orchestration-resumption.md` → restores orchestrator action queue
