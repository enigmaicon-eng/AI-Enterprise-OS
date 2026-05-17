# Retry Engine

**System ID:** `retry-engine`
**Role:** Computes retry schedules for failed nodes and tasks — implements exponential backoff with jitter, policy-based maximum attempts, per-error-class retry eligibility, and dead-letter routing for exhausted tasks
**Storage:** `memory/workflow-engine/retry-state.yaml` + `memory/workflow-engine/dead-letter-queue.jsonl`

---

## Purpose

Failures are normal in distributed systems. The retry engine makes failure handling deterministic: every failure class has a defined retry policy, every retry has a computed schedule, and every exhausted task has a defined escalation path. The alternative — ad-hoc retry logic scattered across workers — produces inconsistent behavior and makes failure patterns invisible.

---

## Retry Policy Model

```yaml
RetryPolicy:
  policy_id: string
  max_attempts: integer              # Total attempts including first (1 = no retry)
  
  # Backoff strategy
  backoff_strategy: "FIXED | LINEAR | EXPONENTIAL | EXPONENTIAL_JITTER | FIBONACCI"
  base_delay_seconds: float          # Starting delay
  max_delay_seconds: float           # Cap on delay regardless of formula
  multiplier: float                  # For LINEAR/EXPONENTIAL: factor per attempt
  jitter_fraction: float             # 0.0–1.0; adds random ±jitter to prevent thundering herd
  
  # Error-class eligibility
  retry_on: [string]                 # Error codes/classes that are retryable
  no_retry_on: [string]             # Error codes that bypass retry and go straight to DLQ
  
  # Timeout
  attempt_timeout_seconds: integer   # Per-attempt timeout (not cumulative)
  total_timeout_seconds: integer     # Total time budget across all attempts
  
  # Fallback
  on_exhaustion: "FAIL | DEAD_LETTER | COMPENSATE | ESCALATE"
```

### System Default Policies

```yaml
policies:
  
  transient_fault:          # Network blips, temporary unavailability
    max_attempts: 5
    backoff_strategy: EXPONENTIAL_JITTER
    base_delay_seconds: 2
    max_delay_seconds: 60
    multiplier: 2.0
    jitter_fraction: 0.25
    retry_on: [TIMEOUT, CONNECTION_ERROR, RATE_LIMITED, SERVICE_UNAVAILABLE]
    no_retry_on: [AUTH_FAILURE, INVALID_INPUT, SCHEMA_VIOLATION]
    on_exhaustion: DEAD_LETTER
  
  gate_check_failure:       # Quality gate failed — team must fix before retry
    max_attempts: 3
    backoff_strategy: FIXED
    base_delay_seconds: 0   # No automatic delay; human action required
    retry_on: [GATE_FAIL]
    on_exhaustion: ESCALATE
  
  external_dependency:      # Waiting for external system to be ready
    max_attempts: 10
    backoff_strategy: EXPONENTIAL_JITTER
    base_delay_seconds: 30
    max_delay_seconds: 1800  # 30 minutes max between retries
    multiplier: 1.5
    jitter_fraction: 0.30
    on_exhaustion: ESCALATE
  
  critical_step:            # High-stakes steps; prefer escalation over silent failure
    max_attempts: 2
    backoff_strategy: FIXED
    base_delay_seconds: 10
    on_exhaustion: ESCALATE
  
  background_task:          # Low-priority; retry aggressively, discard if still failing
    max_attempts: 8
    backoff_strategy: EXPONENTIAL_JITTER
    base_delay_seconds: 5
    max_delay_seconds: 3600
    multiplier: 2.0
    jitter_fraction: 0.50
    on_exhaustion: DEAD_LETTER
```

---

## Delay Computation

```
compute_delay(attempt_number, policy):
  # attempt_number is 1-indexed: first retry = attempt 2
  
  IF policy.backoff_strategy == FIXED:
    base = policy.base_delay_seconds
  
  ELIF policy.backoff_strategy == LINEAR:
    base = policy.base_delay_seconds × attempt_number
  
  ELIF policy.backoff_strategy == EXPONENTIAL:
    base = policy.base_delay_seconds × (policy.multiplier ^ (attempt_number - 1))
  
  ELIF policy.backoff_strategy == EXPONENTIAL_JITTER:
    # Full jitter: uniform between 0 and the exponential cap
    # Prevents thundering herd on mass simultaneous failures
    cap = policy.base_delay_seconds × (policy.multiplier ^ (attempt_number - 1))
    base = RANDOM_UNIFORM(0, cap)
  
  ELIF policy.backoff_strategy == FIBONACCI:
    # Fibonacci sequence as delay multiplier
    fib = fibonacci(attempt_number)  # 1,1,2,3,5,8,13,...
    base = policy.base_delay_seconds × fib
  
  # Apply global cap
  delay = MIN(base, policy.max_delay_seconds)
  
  # Add decorrelated jitter if jitter_fraction > 0 and strategy is not EXPONENTIAL_JITTER
  IF policy.jitter_fraction > 0 AND policy.backoff_strategy != EXPONENTIAL_JITTER:
    jitter = RANDOM_UNIFORM(-delay × policy.jitter_fraction,
                             delay × policy.jitter_fraction)
    delay = MAX(0, delay + jitter)
  
  RETURN delay
```

---

## Retry Eligibility Check

```
is_retryable(error, policy):
  
  # Hard no-retry overrides everything
  IF error.code in policy.no_retry_on:
    RETURN False
  
  # Explicit allow-list
  IF policy.retry_on is not empty:
    RETURN error.code in policy.retry_on OR error.class in policy.retry_on
  
  # Default: retry all non-fatal errors
  RETURN error.is_transient

is_within_total_timeout(task, policy):
  time_elapsed = now() - task.first_attempt_at
  RETURN time_elapsed < policy.total_timeout_seconds
```

---

## Retry State Tracking

```yaml
RetryState:
  task_id: string
  node_id: string
  workflow_id: string
  policy_id: string
  
  attempts:
    - attempt_number: integer
      started_at: datetime
      completed_at: datetime | null
      outcome: "SUCCESS | FAILURE | TIMEOUT"
      error_code: string | null
      delay_before_next_seconds: float | null
  
  current_attempt: integer
  next_retry_at: datetime | null
  exhausted: boolean
  exhaustion_reason: string | null    # "MAX_ATTEMPTS | TOTAL_TIMEOUT | NON_RETRYABLE"
```

---

## Dead Letter Queue

Tasks that exhaust their retry budget route to the DLQ for human review or alternate processing:

```yaml
DeadLetterEntry:
  dlq_id: string
  task_id: string
  node_id: string
  workflow_id: string
  enqueued_at: datetime
  
  exhaustion_reason: string
  final_error: string
  total_attempts: integer
  total_elapsed_seconds: float
  
  resolution: "PENDING | RESUBMITTED | DISCARDED | ESCALATED"
  resolved_at: datetime | null
  resolved_by: string | null

DLQ PROCESSING:
  IMMEDIATE alert if: workflow.priority == CRITICAL
  HIGH alert if: node is on critical path AND workflow.deadline approaching
  MEDIUM alert: all other DLQ entries
  
  Auto-resubmit: IF dlq_entry.error_code == RATE_LIMITED AND retry_after header present:
    resubmit at retry_after timestamp (honor rate limit signals)
```

---

## Integration

**Called by:**
- `workflow-engine/dag-engine.md` — on node failure to compute retry delay and eligibility
- `distributed-execution/worker-orchestration.md` — on task timeout
- `execution-runtime/durable-execution.md` — on step replay failure

**Calls:**
- `distributed-execution/task-queue.md` — enqueues delayed retry tasks
- `runtime-clusters/event-bus.md` — emits TASK_EXHAUSTED events for DLQ entries

**Reads from:**
- `workflow-engine/workflow-registry.md` — retry policy per workflow and node type

**Writes to:**
- `memory/workflow-engine/retry-state.yaml` — per-task retry tracking
- `memory/workflow-engine/dead-letter-queue.jsonl` — DLQ entries
- `memory/execution-ledger.jsonl` — retry and DLQ events
