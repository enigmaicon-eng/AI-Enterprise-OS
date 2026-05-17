# Runtime State Graph

## Purpose
Maintains the live, continuously-updated subgraph representing the current operational state of the enterprise OS — which agents are active, what tasks are running, what workflows are in progress, what resources are allocated, and what constraints are currently binding. The runtime state graph is the high-velocity, low-latency layer of the enterprise knowledge graph: it changes in real time (seconds-to-milliseconds granularity), acts as the authoritative source for scheduling, routing, and feasibility checking, and feeds the observability layer for live monitoring. State changes are propagated as events so every dependent system sees the current picture without polling.

---

## Runtime State Architecture

```
State Change Sources:
  Agent lifecycle events    ─┐
  Task status transitions   ─┤
  Workflow state changes    ─┤→ [State Event Bus] → [Runtime State Processor] → [Runtime State Graph]
  Resource allocation       ─┤                              │
  Constraint evaluations    ─┤                    [State Snapshot Cache]
  Policy decisions          ─┘                              │
                                                   [State Query Interface]
                                                            │
                                           ┌────────────────┼────────────────┐
                                           ▼                ▼                ▼
                                   [Feasibility        [Routing         [Observability
                                    Checker]            System]          Dashboard]
```

---

## Runtime State Node Types

```yaml
runtime_state_nodes:
  AGENT_STATE:
    fields:
      agent_id: string
      tier: int
      status: ACTIVE | IDLE | OVERLOADED | DEGRADED | OFFLINE | SUSPENDED
      current_tasks: [task_id]
      load_factor: float (0.0–1.0)        # fraction of capacity utilized
      context_tokens_used: int
      context_tokens_available: int
      trust_score_current: float
      capabilities_active: [capability_id]
      capabilities_suspended: [capability_id]
      last_heartbeat: ISO-8601
      degraded_reason: string | null

  TASK_STATE:
    fields:
      task_id: string
      task_type: string
      status: QUEUED | ASSIGNED | EXECUTING | BLOCKED | AWAITING_APPROVAL | COMPLETED | FAILED | CANCELLED
      assigned_agent_id: agent_id | null
      workflow_id: workflow_id | null
      priority: CRITICAL | HIGH | MEDIUM | LOW
      blast_radius: CRITICAL | HIGH | MEDIUM | LOW
      started_at: ISO-8601 | null
      deadline: ISO-8601 | null
      sla_status: ON_TRACK | AT_RISK | BREACHED
      blocking_reason: string | null
      approval_request_id: string | null
      execution_token_id: string | null
      resource_reservations: [{resource_id, amount, reserved_until}]

  WORKFLOW_STATE:
    fields:
      workflow_id: string
      workflow_type: string
      status: INITIALIZING | RUNNING | PAUSED | AWAITING_APPROVAL | COMPLETED | FAILED | ROLLED_BACK
      active_tasks: [task_id]
      completed_tasks: [task_id]
      failed_tasks: [task_id]
      pending_tasks: [task_id]
      critical_path: [task_id]
      estimated_completion: ISO-8601 | null
      owner_agent_id: agent_id
      context_budget_used: int
      context_budget_total: int
      sla_deadline: ISO-8601 | null
      sla_status: ON_TRACK | AT_RISK | BREACHED

  RESOURCE_STATE:
    fields:
      resource_id: string
      resource_type: COMPUTE | CONTEXT_BUDGET | TOOL_QUOTA | API_QUOTA | APPROVAL_SLOT
      pool_id: string
      total_capacity: float
      allocated: float
      reserved: float
      available: float                 # total_capacity - allocated - reserved
      allocation_records: [{agent_id, task_id, amount, reserved_until}]
      utilization_rate: float          # allocated / total_capacity
      saturation_threshold: float (default 0.80)
      is_saturated: boolean

  CONSTRAINT_STATE:
    fields:
      constraint_id: string
      constraint_type: string
      status: ACTIVE | SUSPENDED | EXPIRED | VIOLATED
      violation_count: int
      last_violation_at: ISO-8601 | null
      suspension_until: ISO-8601 | null
      suspension_authority: agent_id | null

  APPROVAL_STATE:
    fields:
      approval_request_id: string
      task_id: string
      approval_type: string
      requested_at: ISO-8601
      deadline: ISO-8601
      status: PENDING | APPROVED | REJECTED | EXPIRED | ESCALATED
      required_quorum: int
      current_approvals: int
      current_rejections: int
      approver_ids: [agent_id | human_id]
      sla_status: ON_TRACK | AT_RISK | BREACHED
```

---

## Runtime State Edges

```yaml
runtime_state_edges:
  CURRENTLY_EXECUTING:
    source: AGENT_STATE
    target: TASK_STATE
    properties: [started_at, context_tokens_consumed]
    TTL: valid while task status = EXECUTING

  BLOCKED_BY:
    source: TASK_STATE
    target: TASK_STATE | RESOURCE_STATE | CONSTRAINT_STATE
    properties: [blocked_since, blocking_reason]
    TTL: valid while blocking condition persists

  ALLOCATED_TO:
    source: RESOURCE_STATE
    target: AGENT_STATE | TASK_STATE
    properties: [amount, reserved_until, reservation_id]
    TTL: reservation_until or task completion, whichever first

  DEPENDS_ON_RUNTIME:
    source: TASK_STATE
    target: TASK_STATE
    properties: [dependency_type, dependency_status: PENDING|SATISFIED|FAILED]
    TTL: valid while workflow is active

  WORKFLOW_CONTAINS:
    source: WORKFLOW_STATE
    target: TASK_STATE
    properties: [is_on_critical_path]
    TTL: valid while workflow is active

  PENDING_APPROVAL:
    source: TASK_STATE | WORKFLOW_STATE
    target: APPROVAL_STATE
    properties: [requested_at, deadline]
    TTL: valid while approval is pending

  CONSTRAINT_APPLIES:
    source: CONSTRAINT_STATE
    target: AGENT_STATE | WORKFLOW_STATE | TASK_STATE
    properties: [enforcement_mode, last_checked_at]
    TTL: valid while constraint is ACTIVE
```

---

## State Transition Protocol

```yaml
state_transitions:
  AGENT_STATUS_TRANSITIONS:
    IDLE → ACTIVE: agent receives task assignment
    ACTIVE → OVERLOADED: load_factor > 0.85
    OVERLOADED → ACTIVE: load_factor drops below 0.70
    ACTIVE → DEGRADED: capability failure or calibration error > 0.20
    DEGRADED → OFFLINE: heartbeat missed for > 60 seconds
    ACTIVE → SUSPENDED: policy enforcement (POL-AI-006, POL-SEC-002, etc.)
    SUSPENDED → ACTIVE: suspension lifted by authorized authority

  TASK_STATUS_TRANSITIONS:
    QUEUED → ASSIGNED: agent selected and confirmed
    ASSIGNED → EXECUTING: execution token issued and verified
    EXECUTING → BLOCKED: dependency unmet or resource unavailable
    BLOCKED → EXECUTING: blocking condition resolved
    EXECUTING → AWAITING_APPROVAL: REQUIRE_APPROVAL policy verdict received
    AWAITING_APPROVAL → EXECUTING: approval granted; execution token refreshed
    AWAITING_APPROVAL → FAILED: approval rejected or expired
    EXECUTING → COMPLETED: successful completion
    EXECUTING → FAILED: error or timeout
    any → CANCELLED: explicit cancellation by authorized authority

  WORKFLOW_STATUS_TRANSITIONS:
    INITIALIZING → RUNNING: all pre-checks pass; at least one task begins executing
    RUNNING → PAUSED: explicit pause by orchestrator
    RUNNING → AWAITING_APPROVAL: critical path task requires approval
    AWAITING_APPROVAL → RUNNING: approval received
    RUNNING → COMPLETED: all tasks completed
    RUNNING → FAILED: critical task failed; no recovery option
    FAILED → ROLLED_BACK: rollback initiated
```

---

## State Event Schema

```yaml
state_event:
  event_id: "SEVT-{timestamp_ms}-{random_6char}"
  event_type:
    AGENT: AGENT_ACTIVATED | AGENT_DEGRADED | AGENT_OVERLOADED | AGENT_SUSPENDED | AGENT_OFFLINE
    TASK: TASK_QUEUED | TASK_ASSIGNED | TASK_STARTED | TASK_BLOCKED | TASK_UNBLOCKED | TASK_AWAITING_APPROVAL | TASK_COMPLETED | TASK_FAILED
    WORKFLOW: WORKFLOW_STARTED | WORKFLOW_PAUSED | WORKFLOW_COMPLETED | WORKFLOW_FAILED | WORKFLOW_ROLLED_BACK
    RESOURCE: RESOURCE_ALLOCATED | RESOURCE_RELEASED | RESOURCE_SATURATED | RESOURCE_RESERVATION_EXPIRED
    CONSTRAINT: CONSTRAINT_ACTIVATED | CONSTRAINT_VIOLATED | CONSTRAINT_SUSPENDED | CONSTRAINT_EXPIRED
    APPROVAL: APPROVAL_REQUESTED | APPROVAL_GRANTED | APPROVAL_REJECTED | APPROVAL_EXPIRED | APPROVAL_ESCALATED
    SLA: SLA_AT_RISK | SLA_BREACHED

  affected_entity_ids: [string]
  previous_state: map<string, any>
  new_state: map<string, any>
  changed_fields: [string]
  triggered_by: agent_id | system_id | policy_id
  timestamp: ISO-8601 (millisecond precision)

  propagation:
    fan_out_to: [system_id]    # which systems subscribe to this event type
    priority: HIGH for CRITICAL/GOVERNANCE events; MEDIUM for operational
    delivery_guarantee: AT_LEAST_ONCE
```

---

## Runtime State Queries

```gql
# All currently overloaded agents
MATCH (a:AGENT_STATE {status: "OVERLOADED"})
RETURN a.agent_id, a.load_factor, a.current_tasks, a.tier
ORDER BY a.load_factor DESC

# Find the critical path of a running workflow
MATCH (w:WORKFLOW_STATE {workflow_id: "wf-099"})-[:WORKFLOW_CONTAINS]->(t:TASK_STATE {is_on_critical_path: true})
RETURN t ORDER BY t.deadline ASC

# All tasks blocked waiting for approvals that are at SLA risk
MATCH (t:TASK_STATE {status: "AWAITING_APPROVAL"})-[:PENDING_APPROVAL]->(a:APPROVAL_STATE)
WHERE a.sla_status IN ["AT_RISK", "BREACHED"]
RETURN t, a ORDER BY a.deadline ASC

# Resource saturation snapshot
MATCH (r:RESOURCE_STATE)
WHERE r.is_saturated = true
RETURN r.resource_id, r.resource_type, r.utilization_rate, r.allocated, r.total_capacity
ORDER BY r.utilization_rate DESC

# All workflows at SLA risk
MATCH (w:WORKFLOW_STATE {status: "RUNNING", sla_status: "AT_RISK"})
RETURN w.workflow_id, w.estimated_completion, w.sla_deadline
ORDER BY w.sla_deadline ASC
```

---

## State Snapshot and Recovery

```yaml
state_snapshot:
  purpose: enable recovery from partial failures without losing track of live state
  frequency: every 30 seconds (full runtime state snapshot)
  storage: hot cache (60s TTL) + warm store (24h retention)
  contents: all active AGENT_STATE, TASK_STATE, WORKFLOW_STATE, RESOURCE_STATE nodes + runtime edges
  
  recovery_protocol:
    on_restart: load most recent state snapshot; verify against heartbeat signals
    stale_detection: any agent with last_heartbeat > 60s ago = OFFLINE
    task_recovery:
      EXECUTING task without agent heartbeat: re-queue task; release resource reservations
      AWAITING_APPROVAL task: restore approval state from approval-constraint-engine
      BLOCKED task: re-evaluate blocking conditions; resume if resolved
    resource_recovery: release all reservations held by timed-out agents
```

---

## Integration Points

| System | Role |
|---|---|
| `graph-cognition/graph-cognition-engine.md` | Runtime state writes go through engine ingest |
| `orchestration-constraints/policy-feasibility-checker.md` | Reads AGENT_STATE, RESOURCE_STATE, CONSTRAINT_STATE |
| `graph-routing/graph-traversal-router.md` | Uses runtime state to select available agents |
| `orchestration-dags/dag-execution-engine.md` | DAG engine reads and writes TASK_STATE and WORKFLOW_STATE |
| `graph-observability/orchestration-graph-telemetry.md` | Subscribes to all state events for telemetry |
| `enterprise-topology/runtime-topology-tracker.md` | Runtime topology derived from runtime state graph |
| `agent-intelligence/agent-performance-tracker.md` | AGENT_STATE feeds performance tracking |
