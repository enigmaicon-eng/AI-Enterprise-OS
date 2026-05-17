# Work Distribution Engine

## Purpose
Manages the runtime assignment and tracking of work units across agents. Where the orchestration strategy engine decides *how* to structure a task, and discovery finds *who* can do it, the work distribution engine executes the actual assignment — dispatching tasks, tracking in-flight work, managing queues, handling load balancing, and ensuring no work is lost between orchestration steps.

---

## Distribution Architecture

```
Approved Orchestration Plan
        ↓
[1. Work Unit Decomposition]   → break plan into atomic work units
[2. Assignment Queue]          → ordered queue of work units pending assignment
[3. Agent Assignment]          → dispatch each work unit to its assigned agent
[4. Acceptance Confirmation]   → agent acknowledges receipt and commitment
[5. In-Flight Tracking]        → monitor all active work units in real time
[6. Completion Handling]       → receive output; validate; route to next stage
[7. Failure Handling]          → detect and respond to failed or stalled assignments
        ↓
[Assignment Ledger]            → durable record of all assignments and outcomes
```

---

## Work Unit Schema

```yaml
work_unit:
  unit_id: "WU-{task_id}-{seq}"
  task_id: string
  orchestration_plan_id: string
  
  assignment:
    assigned_to: agent_id
    backup_agent_id: agent_id | null
    assigned_by: agent_id                    # the orchestrator/coordinator making the assignment
    assigned_at: ISO-8601
    contract_id: string | null               # reference to inter-agent contract
  
  specification:
    description: string
    input: {source: PRIOR_WU | DIRECT | REGISTRY | KNOWLEDGE_BASE, reference: string}
    deliverable_schema: string               # output must conform to this schema
    required_capabilities: [capability_id]
    required_skills: [skill_id]
    complexity: BASIC | STANDARD | COMPLEX | EXPERT
  
  timeline:
    expected_start: ISO-8601
    deadline: ISO-8601
    duration_estimate: duration              # how long this should take
    time_budget_consumed: duration | null    # filled in on completion
  
  priority:
    level: CRITICAL | HIGH | NORMAL | LOW
    critical_path: boolean                   # is this on the critical path?
    dependencies: [unit_id]                  # units that must complete before this one starts
    depended_on_by: [unit_id]               # units waiting for this unit's output
  
  status:
    current: QUEUED | DISPATCHED | ACKNOWLEDGED | IN_PROGRESS | COMPLETED | FAILED | REASSIGNED | CANCELLED
    updated_at: ISO-8601
    failure_count: int
    last_update_from_agent: ISO-8601 | null
  
  output:
    artifact_id: string | null               # filled on completion
    quality_score: float | null
    confidence_score: float | null
    accepted: boolean | null                 # did consuming stage accept?
    rejection_reason: string | null
```

---

## Assignment Protocol

```yaml
assignment_protocol:
  pre_assignment_checks:
    - agent status is AVAILABLE or BUSY (load_factor < 0.80)
    - agent has required capabilities (authorized)
    - agent trust score >= task minimum (see trust-propagation-engine.md)
    - no active governance restrictions on required capabilities
    - work unit dependencies are completed (if any)
  
  dispatch:
    mechanism: POST to agent endpoint with work_unit payload
    includes: [unit_id, specification, timeline, deliverable_schema, escalation_path, contract_id]
    timeout: 30 seconds for acknowledgment response
  
  acknowledgment:
    agent responds within 30s with:
      status: ACKNOWLEDGED | REJECTED
      rejection_reason: string | null
      estimated_completion: ISO-8601 | null
    on_ACKNOWLEDGED: work_unit.status → ACKNOWLEDGED; agent capacity decremented
    on_REJECTED:
      reason: CAPACITY | CONFLICT_OF_INTEREST | CAPABILITY_MISMATCH | OTHER
      action: reassign to backup_agent or re-query discovery
      max_rejection_cycles: 3 before escalation to orchestrator
  
  assignment_atomicity:
    each work_unit assigned to exactly one agent at a time
    no double-assignment: locking via assignment ledger (optimistic lock)
    re-assignment: old assignment explicitly closed before new one opens
```

---

## Priority Queue Management

```yaml
priority_queue:
  queue_levels:
    CRITICAL: processed immediately; bypass normal queue
    HIGH: processed next after CRITICAL
    NORMAL: FIFO within level
    LOW: processed when capacity available
  
  within_priority_ordering:
    primary_sort: priority level (CRITICAL first)
    secondary_sort: critical_path (critical_path=true first)
    tertiary_sort: earliest_deadline_first (deadline soonest first)
    quaternary_sort: enqueue_time (FIFO for equal priority)
  
  starvation_prevention:
    LOW priority: if waiting > 2 hours in queue, elevate to NORMAL
    NORMAL priority: if waiting > 30 minutes and blocked by capacity, trigger capacity alert
  
  dynamic_reprioritization:
    trigger: critical path analysis update (if a NORMAL task becomes blocking)
    action: reprioritize to HIGH; notify assigned agent that their dependency is elevated
    trigger: deadline breached or at risk
    action: elevate to CRITICAL; alert orchestrator
```

---

## In-Flight Tracking

```yaml
in_flight_tracking:
  heartbeat_from_agents:
    frequency: every 60 seconds per active work unit
    payload: {unit_id, status: IN_PROGRESS | BLOCKED, progress_estimate: 0–100, eta_update: ISO-8601 | null}
    missing_heartbeat:
      after_1_missed (60s): mark as HEARTBEAT_DELAYED; no action
      after_2_missed (120s): attempt direct status probe
      after_3_missed (180s): declare STALLED; activate stall recovery
  
  progress_tracking:
    per_unit: progress_estimate, last_heartbeat, status
    per_task: aggregate completion % (weighted by unit complexity)
    critical_path_monitor:
      real-time ETA computation for all critical path units
      if any critical path unit ETA exceeds task deadline: CRITICAL alert to orchestrator
  
  dependency_graph_management:
    when unit completes: automatically unlock dependent units (status QUEUED → ready for dispatch)
    when unit fails: propagate impact up dependency graph; flag dependent units as AT_RISK
    dependency_cycle_detection: validated at plan creation; re-validated at runtime if plan amended
  
  stall_recovery:
    STALLED definition: no heartbeat for 3 cycles; status not COMPLETED or FAILED
    step_1: send direct probe to agent (liveness check via health monitor)
    step_2_agent_alive_and_working: resume normal tracking; log stall event
    step_2_agent_alive_but_not_working: query reason; escalate to orchestrator
    step_2_agent_offline: declare unit FAILED; activate failure handling protocol
    stall_sla: resolution within 10 minutes of STALLED declaration
```

---

## Load Balancing

```yaml
load_balancing:
  real_time_load_view:
    source: agent-registry/availability_index (< 5s latency)
    computed: per_agent load_factor, per_domain capacity_utilization
  
  assignment_load_balancing:
    strategy: prefer agents with lowest load_factor among equally-qualified candidates
    anti_affinity: avoid assigning all CRITICAL tasks to same agent (single point of failure)
    domain_spread: when possible, spread tasks across multiple agents in same domain
  
  dynamic_rebalancing_triggers:
    AGENT_OVERLOADED: load_factor > 0.90 → pause new assignments to this agent; redistribute queue
    DOMAIN_SATURATED: > 80% of domain agents at BUSY/OVERLOADED → alert; throttle intake
    CAPACITY_SURPLUS: average domain load_factor < 0.30 for > 30 minutes → signal orchestrator (underutilization)
  
  rebalancing_protocol:
    not_yet_started_units: can be reassigned freely (change assignment, no agent action needed)
    in_progress_units: cannot be moved without agent consent; can only be reassigned on failure
    priority: rebalance low-priority first; preserve high-priority assignments
```

---

## Completion Handling

```yaml
completion_handling:
  agent_signals_completion:
    payload: {unit_id, artifact_id, quality_score, confidence_score, notes}
    validations:
      schema_validation: artifact conforms to deliverable_schema?
      quality_floor: quality_score >= specification.minimum_quality (if set)?
      confidence_floor: confidence_score >= specification.confidence_floor (if set)?
    
    on_validation_pass:
      unit.status → COMPLETED
      artifact routed to consuming stage or returned to orchestrator
      agent capacity decremented
      dependent units unlocked in dependency graph
      performance signal emitted to agent-performance-tracker.md
    
    on_validation_fail:
      if_quality_below_floor:
        unit.status → NEEDS_REVISION
        agent notified: specific quality criteria not met
        revision_budget: 20% of original unit time budget
        after_revision: re-validate; if still failing → FAILED; escalate
      if_schema_mismatch:
        return to agent with schema error details (1 correction attempt before FAILED)
  
  output_routing:
    artifact → consuming work unit (as input to next stage)
    artifact → orchestrator for integration (if final stage)
    artifact → human reviewer (if review gate in orchestration plan)
    routing_record: logged in assignment ledger for provenance tracking
```

---

## Assignment Ledger

```yaml
assignment_ledger:
  purpose: durable, append-only record of all work assignments and outcomes
  
  per_entry:
    unit_id, task_id, agent_id, assigned_at
    status_history: [timestamp, status] (full state machine trace)
    heartbeat_log: all heartbeats received
    output_record: artifact_id, quality_score, accepted
    any_reassignments: [{reason, from_agent, to_agent, at}]
  
  retention: 3 years (standard tasks); 7 years (governance-related tasks)
  
  analytics_derived:
    - per-agent assignment_acceptance_rate, completion_rate, quality_score_avg
    - per-task critical_path_adherence (did critical path tasks complete on time?)
    - queue_wait_time_p50/p95 by priority level
    - reassignment_rate (target < 0.08)
    - stall_rate per agent per domain
```

---

## Integration Points

| System | Role |
|---|---|
| `orchestration-patterns/orchestration-strategy-engine.md` | Provides approved orchestration plans |
| `agent-registry/agent-discovery-engine.md` | Re-queried when reassignment needed |
| `agent-registry/agent-health-monitor.md` | Health state determines assignment eligibility |
| `delegation-and-trust/inter-agent-contracts.md` | Contract created per assignment where required |
| `delegation-and-trust/trust-propagation-engine.md` | Trust score informs assignment priority |
| `agent-performance/agent-performance-tracker.md` | Completion signals feed performance tracking |
| `coordination-operations/orchestration-failure-recovery.md` | Failure detected here → recovery triggered there |
