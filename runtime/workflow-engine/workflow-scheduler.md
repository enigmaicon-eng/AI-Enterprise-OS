# Workflow Scheduler

**System ID:** `workflow-scheduler`
**Role:** Schedules workflow execution — handles time-based triggers (cron, delay, deadline), event-triggered activation, priority scheduling across concurrent workflows, and admission control to prevent runtime saturation
**Storage:** `memory/workflow-engine/schedule-registry.yaml` + `memory/workflow-engine/scheduler-events.jsonl`

---

## Purpose

The scheduler is the entry point for workflow activation. It decides *when* a workflow starts, *at what priority* it joins the execution queue, and *whether* the system has capacity to accept it. Without admission control, an unbounded stream of workflow starts would saturate the worker pool and collapse throughput for in-flight work.

---

## Trigger Model

### Trigger Types

```yaml
ScheduleTrigger:
  trigger_id: string
  workflow_definition_id: string
  trigger_type: "cron | delay | event | manual | dependency | deadline"
  
  # Cron triggers
  cron_expression: string | null       # "0 */4 * * *" — every 4 hours
  timezone: string                     # "UTC" | "America/New_York"
  cron_overlap_policy: "SKIP | QUEUE | ALLOW"
  
  # Delay / one-shot triggers
  fire_at: datetime | null             # Absolute timestamp
  delay_seconds: integer | null        # Relative from now
  
  # Event triggers
  event_topic: string | null           # event-bus topic to subscribe
  event_filter: map[string, any]       # Must match for trigger to fire
  
  # Dependency triggers (fire when upstream workflow completes)
  depends_on_workflow: string | null   # workflow_id whose completion fires this
  
  priority: "CRITICAL | HIGH | NORMAL | LOW | BACKGROUND"
  max_concurrent_runs: integer         # 0 = unlimited
  input_template: map[string, any]     # Input to pass to workflow on activation
```

### Cron Scheduling

```
CRON TICK LOOP (every minute):

  FOR each active cron trigger:
    next_fire = cron_expression.next_fire(last_fire_at, timezone)
    
    IF now() >= next_fire:
      
      # Check overlap policy
      running_count = count_running(trigger.workflow_definition_id)
      
      IF running_count > 0:
        IF trigger.cron_overlap_policy == "SKIP":
          log_skipped(trigger_id, reason="overlapping run in progress")
          CONTINUE
        ELIF trigger.cron_overlap_policy == "QUEUE":
          enqueue_pending(trigger)       # Will start when current run ends
          CONTINUE
        # ALLOW: fall through and start another instance
      
      activate_workflow(trigger)
      trigger.last_fire_at = now()
```

---

## Priority Scheduling

Workflows compete for worker capacity according to a priority queue. The scheduler enforces fairness within priority bands to prevent starvation of NORMAL/LOW workflows when CRITICAL workflows are backlogged.

```
PRIORITY QUEUE STRUCTURE:
  Band CRITICAL   — preemptive; always dispatched first
  Band HIGH       — dispatched before NORMAL if system utilization < 0.80
  Band NORMAL     — default; fair round-robin within band
  Band LOW        — dispatched only when NORMAL queue depth < threshold
  Band BACKGROUND — dispatched only when system utilization < 0.40

STARVATION PREVENTION:
  IF any NORMAL workflow has been waiting > 5 minutes:
    Temporarily promote to HIGH for next dispatch cycle
  IF any LOW workflow has been waiting > 30 minutes:
    Temporarily promote to NORMAL

PRIORITY SCORE (for tie-breaking within band):
  score = base_priority_score[band]
        + (waiting_seconds / 60) × age_bonus           # Older = higher score
        + deadline_urgency_bonus(workflow.deadline)     # Approaching deadline
        - (active_siblings × 0.10)                     # Penalize workflow families hogging capacity
```

---

## Admission Control

Before activating any workflow, the scheduler checks system capacity:

```
ADMISSION GATE:

  # Load from runtime-twin
  runtime_saturation = runtime_twin.saturation_composite.composite
  worker_utilization = distributed_execution.worker_pool.utilization
  queue_depth = task_queue.total_pending
  
  # Decision matrix
  IF runtime_saturation >= 0.95:
    → REJECT (system at critical saturation)
    → Notify requester; workflow enters ADMISSION_REJECTED state
  
  IF runtime_saturation >= 0.85:
    IF workflow.priority == CRITICAL:
      → ADMIT (CRITICAL always admitted regardless)
    ELSE:
      → QUEUE (backpressure: hold until saturation < 0.80)
  
  IF queue_depth > max_queue_depth_by_priority[workflow.priority]:
    → QUEUE (back-pressure signal)
  
  ELSE:
    → ADMIT

# Backpressure queue drains as workers free up
DRAIN LOOP (every 30 seconds):
  IF runtime_saturation < 0.80:
    admit_next_from_backpressure_queue()
```

---

## Workflow Lifecycle State Machine

```
PENDING_TRIGGER  ─── trigger fires ──────────► ADMISSION_CHECK
ADMISSION_CHECK  ─── admitted ───────────────► INITIALIZING
ADMISSION_CHECK  ─── backpressure ───────────► QUEUED
ADMISSION_CHECK  ─── rejected ───────────────► ADMISSION_REJECTED
QUEUED           ─── capacity available ─────► INITIALIZING
INITIALIZING     ─── DAG compiled + ready ──► RUNNING
RUNNING          ─── all nodes complete ─────► COMPLETED
RUNNING          ─── node failure ──────────► FAILING
FAILING          ─── compensation done ──────► COMPENSATED
FAILING          ─── fail-fast ───────────────► FAILED
RUNNING          ─── cancel signal ──────────► CANCELLING
CANCELLING       ─── nodes drained ───────────► CANCELLED
```

---

## Deadline Scheduling

Workflows with hard deadlines use Earliest Deadline First (EDF) scheduling within their priority band:

```
FOR each workflow in priority_band WHERE workflow.deadline IS NOT NULL:
  
  time_remaining = workflow.deadline - now()
  estimated_completion = estimate_completion_time(workflow)  # From DAG critical path
  
  IF estimated_completion > time_remaining:
    → DEADLINE_AT_RISK alert → prediction-engine
    IF workflow.deadline_policy == "ESCALATE":
      promote_to_band(CRITICAL)
    ELIF workflow.deadline_policy == "NOTIFY":
      emit_warning_event(workflow_id, "DEADLINE_AT_RISK")
```

---

## Schedule Registry Schema

```yaml
ScheduleRegistry:
  version: integer
  last_updated: datetime
  
  triggers:
    - trigger_id: string
      workflow_definition_id: string
      trigger_type: string
      status: "ACTIVE | PAUSED | DELETED"
      last_fire_at: datetime | null
      next_fire_at: datetime | null      # Precomputed for cron
      run_count: integer
      last_run_workflow_id: string | null
  
  active_workflows:
    - workflow_id: string
      definition_id: string
      trigger_id: string | null
      priority: string
      state: string
      admitted_at: datetime
      deadline: datetime | null
      
  backpressure_queue:
    - workflow_id: string
      queued_at: datetime
      priority: string
      wait_seconds: integer
```

---

## Integration

**Called by:**
- `runtime-clusters/event-triggers.md` — fires event-based triggers
- `runtime-clusters/reactive-orchestration.md` — fires reactive triggers on event conditions
- Human / orchestrator — fires manual triggers

**Calls:**
- `workflow-engine/dag-engine.md` — activates DAG execution on admission
- `orchestration-dags/dag-compiler.md` — compiles workflow definition to DAG on initialization
- `distributed-execution/task-queue.md` — applies back-pressure signals

**Reads from:**
- `workflow-engine/workflow-registry.md` — workflow definitions and priority config
- `memory/digital-twins/twin-state/runtime-twin-state.yaml` — current saturation for admission control

**Writes to:**
- `memory/workflow-engine/schedule-registry.yaml` — trigger and workflow state
- `memory/workflow-engine/scheduler-events.jsonl` — all scheduling decisions
- `memory/execution-ledger.jsonl` — workflow activation events
