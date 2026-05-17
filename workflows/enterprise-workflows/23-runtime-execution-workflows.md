# WF-023: Runtime Execution Workflow Engine

**Version:** 1.0.0 | **Owner:** Engineering Org | **Tier:** T2 | **Class:** CRITICAL | **SLA:** Real-time

## Purpose
Define the runtime execution contract for all workflows in the Enterprise AI OS — governing how DAGs are evaluated, how steps are scheduled and executed, how state is durably persisted, how failures are handled deterministically, and how the execution engine interacts with agents, humans, integrations, and gates. This is the execution substrate that all other workflows run on.

## Inputs

```
REQUIRED:
  workflow_definition_id:  string — WF-NNN workflow to execute
  workflow_version:        semver — exact version of workflow definition
  initiator_id:            string — who or what initiated execution
  input_payload:           object — REQUIRED inputs per workflow definition

OPTIONAL:
  execution_priority:      CRITICAL | HIGH | NORMAL | LOW (default: NORMAL)
  parent_execution_id:     string — if spawned by another workflow
  idempotency_key:         string — for at-least-once safety
  timeout_override_s:      number — per-execution timeout (must be <= workflow max)
```

## Outputs / Artifacts

```
PRIMARY:
  EXECUTION_RECORD:    immutable execution log with all step outcomes
  STEP_AUDIT_TRAIL:    each step: initiated_at, completed_at, output_hash, executor
  FINAL_STATE:         terminal state + reason + all output artifacts

SECONDARY:
  PERFORMANCE_METRICS: step dwell times, wait times, total cycle time
  FAILURE_RECORD:      if failed — last checkpoint, failure reason, recovery path taken
```

## Lifecycle States

```
QUEUED → VALIDATING → EXECUTING
  → [per step] STEP_PENDING → STEP_RUNNING → STEP_COMPLETE
  → [human step] STEP_AWAITING_HUMAN → [response] STEP_RUNNING
  → [gate step] GATE_EVALUATING → [pass] NEXT_STEP | [fail] WORKFLOW_BLOCKED
  → [integration step] INTEGRATION_CALLING → [response] STEP_COMPLETE
  → [all steps done] COMPLETING → COMPLETED
  → [step failure] STEP_FAILED → RETRY | CHECKPOINT_RESTORE | WORKFLOW_FAILED
  → [timeout] TIMED_OUT → CHECKPOINT_SNAPSHOT → FAILED
  → [suspended] SUSPENDED → [resume] EXECUTING
```

## Execution Engine Architecture

```
CORE COMPONENTS:
  DAG_EVALUATOR:       resolves step execution order from depends_on graph
  STEP_SCHEDULER:      assigns ready steps to execution slots
  STATE_MANAGER:       durable state persistence; checkpoint every step boundary
  FAILURE_HANDLER:     classifies failures; selects recovery strategy
  HUMAN_TASK_MANAGER:  routes human-required steps to task queues; SLA tracks
  GATE_EVALUATOR:      evaluates gate conditions; blocks or passes execution
  INTEGRATION_PROXY:   standardized integration calling with retry + timeout
  AUDIT_LOGGER:        append-only execution audit; SHA-256 hash-chained
```

## Execution Graph

```
S-001  EXECUTION_INIT          [SYSTEM]                        Root
         Assign: execution_id (UUID); execution_started_at timestamp
         Check: idempotency_key (if provided) — already running? return existing
         Validate: workflow_definition_id exists; version active
         Validate: input_payload against workflow REQUIRED schema
         Queue: execution with priority
S-002  AUTHORIZATION_CHECK     [SYSTEM]                        depends_on: S-001
         Verify: initiator_id has required tier for workflow class
         Verify: workflow not locked (maintenance window or suspended)
         Verify: no execution quota exceeded
S-003  DAG_COMPILATION         [SYSTEM]                        depends_on: S-002
         Parse: all steps from workflow definition
         Build: execution DAG (directed acyclic graph from depends_on)
         Identify: root steps (no depends_on); terminal steps (no dependents)
         Identify: parallel branches (steps with same parent)
         Topological sort: validate no cycles
S-004  CHECKPOINT_INIT         [SYSTEM]                        depends_on: S-003
         Create: execution checkpoint at step 0
         Persist: workflow inputs + DAG snapshot to durable store
         Guarantee: execution recoverable from this checkpoint if process dies
S-005  STEP_EXECUTION_LOOP     [SYSTEM]                        depends_on: S-004
         READY_QUEUE: steps whose depends_on are all COMPLETE
         Per step:
           AGENT step    → dispatch to agent; async callback on completion
           HUMAN step    → create task in human task queue; SLA timer starts
           GATE step     → evaluate gate condition; PASS or FAIL
           SYSTEM step   → execute inline; synchronous
           INTEGRATION   → call via integration proxy; timeout + retry
           CONDITIONAL   → evaluate condition; branch to appropriate sub-path
         PARALLEL: all ready steps dispatched concurrently
         CHECKPOINT: after each step completion; persist step output
S-006  AGENT_STEP_EXECUTION    [SUB-PROCESS]                   depends_on: S-005
         Select: agent type from step definition
         Build: agent context = {workflow_context, step_inputs, relevant_memory}
         Dispatch: to agent runtime
         Timeout: per step SLA (fail if exceeded)
         Output: structured output validated against step output schema
         Retry: up to 2 times on transient failure; log each attempt
S-007  HUMAN_STEP_EXECUTION    [SUB-PROCESS]                   depends_on: S-005
         Create: task in human task queue with full context
         Notify: assigned human via Slack + email
         SLA_TIMER: start countdown per step SLA definition
         On SLA_BREACH: escalate per workflow escalation logic
         On RESPONSE: validate response; mark step complete or request clarification
         TIMEOUT: if no response after 2× SLA → escalation; workflow suspended
S-008  GATE_EVALUATION         [SUB-PROCESS]                   depends_on: S-005
         Evaluate: gate criteria against current execution context
         PASS: continue to dependent steps
         FAIL: mark workflow BLOCKED; notify owner; stop execution
         CONDITIONAL: some gates have fallback paths on failure (documented in workflow)
S-009  INTEGRATION_EXECUTION   [SUB-PROCESS]                   depends_on: S-005
         Authenticate: per integration credential store
         Call: integration endpoint with timeout
         RETRY: exponential backoff; max 3 retries for transient errors
         CIRCUIT_BREAKER: if integration fails > 5× in 60s → open circuit; alert
         Idempotency: all integration calls include execution_id for deduplication
S-010  FAILURE_CLASSIFICATION  [SYSTEM]                        depends_on: S-005–S-009 FAIL
         Classify failure:
           TRANSIENT: network timeout, agent overload → RETRY
           STEP_ERROR: step logic failed → check retry policy; possibly FAILED
           GATE_BLOCK: gate evaluation failed → BLOCKED (needs human intervention)
           TIMEOUT: step exceeded SLA → TIMED_OUT; checkpoint; alert
           INFRASTRUCTURE: execution engine error → CHECKPOINT_RESTORE
S-011  RECOVERY_STRATEGY       [SYSTEM]                        depends_on: S-010
         RETRY: re-execute failed step (up to step retry_limit)
         CHECKPOINT_RESTORE: restore from last good checkpoint; replay from there
         HUMAN_INTERVENTION: create intervention task; suspend execution
         ABANDON: if retry_limit exceeded and no recovery path → FAILED state
S-012  COMPLETION_FINALIZATION [SYSTEM]                        depends_on: S-005 ALL_TERMINAL
         All terminal steps complete: workflow is COMPLETED
         Calculate: total cycle time; step dwell times; wait time breakdown
         Emit: completion event with final state + metrics
         Persist: final execution record (immutable)
S-013  ARTIFACT_PERSIST        [INTEGRATION]                   depends_on: S-012
         Write: execution record to persistent audit store
         Index: outputs for downstream workflows and memory updates
S-014  COMPLETION_EVENT        [SYSTEM]                        depends_on: S-013
         Emit: workflow completion event to enterprise event bus
         Trigger: any WF-022 event-driven downstream workflows
```

## Step Type Reference

```
[AGENT: {agent-name}]      Dispatched to named agent; async execution
[HUMAN: {role} T{n}+]      Human task; routed to task queue by tier
[GATE: G-{name} T{n}+]     Gate evaluation; PASS or BLOCK
[SYSTEM]                   Inline execution; synchronous
[INTEGRATION]              External system call via integration proxy
[CONDITIONAL]              Branch evaluation; routes to sub-path
[WORKFLOW: WF-NNN]         Spawns child workflow; waits for completion
```

## Approval Gates

```
G-AUTH:    initiator tier >= workflow minimum tier; input payload valid
```

## Execution SLA Matrix

```
STEP TYPE          TARGET LATENCY     TIMEOUT
───────────────────────────────────────────────────────
SYSTEM             < 100ms            5s
GATE               < 500ms            10s
AGENT (simple)     < 30s              120s
AGENT (complex)    < 120s             600s
INTEGRATION        < 2s               30s
HUMAN              per workflow SLA   per workflow × 2
WORKFLOW (child)   per child SLA      per child SLA × 1.5
```

## Escalation Logic

```
TRIGGER                                  ACTION                      SLA
─────────────────────────────────────────────────────────────────────────────
CRITICAL workflow stuck > 30min          T3 page + auto-checkpoint    Immediate
Human step SLA breach                    Escalate per workflow logic  Per workflow
Integration circuit breaker open         T3 eng alert; assess health  5min
Execution engine error (infra)           T4 + auto-restore checkpoint Immediate
Checkpoint persistence failure           CRITICAL alert; stop new executions 1min
Agent retry limit exceeded (3×)          Fail step; escalate to T3   Immediate
Parallel execution fan-out > 50 steps   T3 review; rate limit        15min
```

## Governance Checkpoints

```
C-001: human steps in workflows are never auto-completed; only human response resolves
C-004: every execution permanently recorded; append-only; no deletion
IDEMPOTENCY: execution engine guarantees at-most-once completion per idempotency_key
CHECKPOINT: execution state persisted after every step; recovery always possible
AUDIT_CHAIN: execution audit is SHA-256 hash-chained; tamper detection on read
STEP_TIMEOUT: no step runs indefinitely; every step has a timeout
VERSION_LOCK: workflow version locked at execution start; never changes mid-execution
```

## Observability

```
REAL-TIME EXECUTION METRICS:
  active_executions_count:       by workflow_id and priority
  step_queue_depth:              pending steps waiting for execution
  agent_dispatch_latency_ms:     target < 1000ms
  human_task_queue_depth:        tasks awaiting human response
  integration_error_rate:        per integration endpoint

EXECUTION HEALTH:
  execution_success_rate:        target >= 0.95
  p99_cycle_time_pct_of_sla:     target < 0.90 (not at SLA limit)
  checkpoint_write_latency_ms:   target < 100ms
  stuck_execution_count:         target = 0 (any stuck > 2× SLA)
  dead_letter_execution_count:   target = 0

INFRASTRUCTURE:
  execution_engine_cpu_pct:      target < 0.70
  checkpoint_store_latency_ms:   target < 50ms
  event_bus_publish_latency_ms:  target < 100ms
```

## Telemetry Events

```
enterprise.runtime.execution.started      {workflow_id, version, priority, initiator}
enterprise.runtime.execution.step_started {execution_id, step_id, step_type}
enterprise.runtime.execution.step_done    {execution_id, step_id, duration_ms, outcome}
enterprise.runtime.execution.gate_result  {execution_id, gate_id, result, reason}
enterprise.runtime.execution.human_task   {execution_id, step_id, assignee, sla_hr}
enterprise.runtime.execution.failed       {execution_id, step_id, failure_class, retry_count}
enterprise.runtime.execution.completed    {execution_id, cycle_time_ms, step_count}
enterprise.runtime.engine.circuit_open    {integration_id, failure_count}
enterprise.runtime.engine.checkpoint      {execution_id, checkpoint_id, step_reached}
```

## Rollback System

```
EXECUTION_ROLLBACK: not applicable — executions are forward-only; failures go to recovery
WORKFLOW_ARTIFACT_ROLLBACK: per-workflow rollback defined in each workflow's rollback section
CHECKPOINT_RESTORE: on infra failure → restore from last checkpoint; re-execute from there
SUSPENDED_RESUME: suspended executions can be resumed from last checkpoint up to 30 days
ABANDONED: executions abandoned after 30-day suspension expiry; final state recorded
```

## Enterprise System Integrations

```
AGENT_RUNTIME:   S-006 → dispatch agent tasks; receive completions
HUMAN_TASK_SYS:  S-007 → create/close human tasks
SLACK:           S-007 → notify humans of task assignments; S-014 → completion summary
PAGERDUTY:       S-010 → alert on critical failures; circuit breaker opens
MONITORING:      S-012 → emit execution metrics; S-005 → real-time step tracking
AUDIT_STORE:     S-013 → persist immutable execution record
EVENT_BUS:       S-014 → publish completion events; WF-022 consumes
```

## Wiki Updates

```
wiki/runtime/execution-patterns.md       ← update with new patterns observed
wiki/runbooks/execution-engine.md        ← update with operational learnings
```

## Memory Updates

```
memory/deployment-intelligence/deployment-history.jsonl ← execution lineage
memory/work-cognition/flow-metrics-current.yaml         ← update flow metrics
memory/work-cognition/active-bottlenecks.yaml           ← flag execution bottlenecks
```
