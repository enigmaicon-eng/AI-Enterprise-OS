# Runtime Topology Tracker

## Purpose
Maintains a continuously-updated, real-time view of the enterprise OS's live topology — the current configuration of agents, workflows, tasks, resources, integrations, and their relationships as they exist right now. The runtime topology tracker is the bridge between the static knowledge graph (which captures organizational truth) and the dynamic execution reality (which changes in seconds). It ingests state events from the enterprise event bus, applies them to the live topology, computes derived topology properties (centrality, bottlenecks, health), and emits topology change events for all downstream consumers including routing, scheduling, observability, and reasoning systems.

---

## Tracker Architecture

```
Enterprise Event Bus
  │
  ├── AGENT_STATE_CHANGED
  ├── TASK_STATE_CHANGED
  ├── WORKFLOW_STATE_CHANGED
  ├── RESOURCE_ALLOCATED
  ├── RESOURCE_RELEASED
  ├── INTEGRATION_HEALTH_CHANGED
  ├── DEPENDENCY_RESOLVED
  ├── DEPENDENCY_BLOCKED
  └── TOPOLOGY_CHANGE
          │
          ▼
[Event Consumer]          → validate; deduplicate; normalize
          │
          ▼
[Topology Mutation Engine] → apply state changes to runtime topology graph
          │
          ▼
[Derived Property Recompute]
  ├── Centrality update (affected nodes)
  ├── Bottleneck detection
  ├── Critical path update (affected workflows)
  ├── Health score recompute (affected nodes)
  └── Community assignment check
          │
          ▼
[Topology Event Emitter]  → emit TOPOLOGY_UPDATED events to subscribers
          │
          ▼
[Topology Snapshot Cache] → maintain in-memory topology snapshot for low-latency reads
```

---

## Topology State Schema

```yaml
topology_state:
  snapshot_id: "TOPO-SNAP-{timestamp_ms}"
  captured_at: ISO-8601
  environment: PRODUCTION | STAGING

  agent_topology:
    total_agents: int
    active_agents: int
    degraded_agents: int
    offline_agents: int
    overloaded_agents: int
    suspended_agents: int
    agents_by_tier: {1: int, 2: int, 3: int, 4: int, 5: int}
    agents_by_status: map<status, int>
    aggregate_load: float              # mean load_factor across active agents
    governance_agents_available: int   # Tier-3+ agents available for governance tasks

  workflow_topology:
    total_active_workflows: int
    running: int
    paused: int
    awaiting_approval: int
    workflows_at_sla_risk: int
    workflows_sla_breached: int
    total_active_tasks: int
    tasks_blocked: int
    tasks_awaiting_approval: int
    critical_path_tasks_blocked: int

  resource_topology:
    resources_saturated: int
    resources_at_threshold: int        # > 80% utilization
    total_pending_reservations: int
    context_budget_utilization: float  # across all active workflows

  integration_topology:
    total_integrations: int
    integrations_degraded: int
    circuit_breakers_open: int
    cross_border_flows_active: int
    cross_border_flows_at_risk: int

  topology_health_scores:
    overall_health: float (0.0–1.0)
    agent_health: float
    workflow_health: float
    resource_health: float
    integration_health: float
    formula: weighted_mean([agent_health, workflow_health, resource_health, integration_health], weights=[0.35, 0.30, 0.20, 0.15])
```

---

## Topology Change Events

```yaml
topology_events:
  AGENT_TOPOLOGY_CHANGED:
    triggers: [AGENT_STATE_CHANGED, NEW_AGENT_REGISTERED, AGENT_DECOMMISSIONED]
    payload: {affected_agent_id, old_status, new_status, affected_workflows, load_rebalance_needed}
    processing: update agent node; recompute affected delegation chains; check routing availability

  WORKFLOW_TOPOLOGY_CHANGED:
    triggers: [TASK_COMPLETED, TASK_FAILED, TASK_BLOCKED, WORKFLOW_REPLANNED]
    payload: {workflow_id, affected_task_ids, critical_path_changed, sla_impact}
    processing: update workflow state; recompute critical path; check SLA status

  RESOURCE_TOPOLOGY_CHANGED:
    triggers: [RESOURCE_ALLOCATED, RESOURCE_RELEASED, RESOURCE_SATURATED, RESERVATION_EXPIRED]
    payload: {resource_id, old_utilization, new_utilization, affected_task_ids}
    processing: update resource node; check saturation; release waiting tasks if capacity freed

  INTEGRATION_TOPOLOGY_CHANGED:
    triggers: [INTEGRATION_HEALTH_CHANGED, CIRCUIT_BREAKER_TRIPPED, SERVICE_RECOVERED]
    payload: {integration_id, old_health, new_health, circuit_breaker_state}
    processing: update integration node; compute blast radius if health degraded; alert dependent workflows

  DEPENDENCY_TOPOLOGY_CHANGED:
    triggers: [DEPENDENCY_RESOLVED, NEW_DEPENDENCY_ADDED, DEPENDENCY_VIOLATED]
    payload: {source_id, target_id, dependency_type, resolution_status}
    processing: update dependency edges; recompute blocked task counts; trigger unblocking if resolved

  TOPOLOGY_HEALTH_CHANGED:
    triggers: computed when any component health score changes by > 0.05
    payload: {old_overall_health, new_overall_health, driving_component, driving_change}
    processing: emit to observability dashboard; check if alert threshold crossed
```

---

## Topology Mutation Operations

```yaml
topology_mutations:
  UPSERT_AGENT:
    trigger: agent heartbeat or state change event
    operation: update AGENT_STATE node properties (status, load_factor, trust_score, etc.)
    side_effects: [update_adjacency_index, recompute_centrality_for_affected_nodes, check_routing_tables]

  UPDATE_TASK_STATE:
    trigger: task lifecycle event
    operation: update TASK_STATE node; update WORKFLOW_CONTAINS edge properties; update critical path
    side_effects: [check_blocked_successors, recompute_workflow_completion_pct, check_sla]

  ALLOCATE_RESOURCE:
    trigger: resource allocation event
    operation: append ALLOCATED_TO edge; update RESOURCE_STATE utilization
    side_effects: [check_saturation, release_waiting_tasks_if_capacity_freed]

  RELEASE_RESOURCE:
    trigger: task completion or reservation expiry
    operation: invalidate ALLOCATED_TO edge; update RESOURCE_STATE utilization
    side_effects: [check_waiting_tasks, recompute_resource_health]

  REGISTER_DEPENDENCY:
    trigger: new dependency declared (e.g., task assigned to workflow)
    operation: append DEPENDS_ON_RUNTIME edge
    side_effects: [cycle_detection, update_critical_path, update_blast_radius_index]

  RESOLVE_DEPENDENCY:
    trigger: dependency satisfied (predecessor completed)
    operation: update DEPENDS_ON_RUNTIME edge status = SATISFIED; unblock successors
    side_effects: [identify_newly_ready_tasks, emit_TASK_READY events]

  UPDATE_INTEGRATION_HEALTH:
    trigger: health probe result or circuit breaker state change
    operation: update ENTERPRISE_SYSTEM / EXTERNAL_SERVICE node health fields
    side_effects: [compute_blast_radius_if_degraded, alert_dependent_workflows]
```

---

## Topology Health Computation

```yaml
health_computation:
  agent_health:
    formula: |
      1.0
      - 0.30 × (degraded_agents / total_agents)
      - 0.25 × (offline_agents / total_agents)
      - 0.20 × (overloaded_agents / total_agents)
      - 0.15 × max(0, aggregate_load - 0.70) / 0.30
      - 0.10 × (0 if governance_agents_available >= 2 else 0.50)

  workflow_health:
    formula: |
      1.0
      - 0.35 × (critical_path_tasks_blocked / max(1, total_active_tasks))
      - 0.30 × (workflows_sla_breached / max(1, total_active_workflows))
      - 0.20 × (workflows_at_sla_risk / max(1, total_active_workflows))
      - 0.15 × (tasks_awaiting_approval / max(1, total_active_tasks))

  resource_health:
    formula: |
      1.0
      - 0.50 × (resources_saturated / total_resources)
      - 0.30 × (resources_at_threshold / total_resources)
      - 0.20 × max(0, context_budget_utilization - 0.80) / 0.20

  integration_health:
    formula: |
      1.0
      - 0.40 × (circuit_breakers_open / total_integrations)
      - 0.35 × (integrations_degraded / total_integrations)
      - 0.15 × (cross_border_flows_at_risk / max(1, cross_border_flows_active))
      - 0.10 × (0 if error_rate_aggregate < 0.05 else 0.50)

  recompute_frequency: every 30 seconds or on any topology event
```

---

## Bottleneck Detection

```yaml
bottleneck_detection:
  purpose: identify nodes that are constraining the system — where demand exceeds capacity or throughput
  
  bottleneck_types:
    AGENT_BOTTLENECK:
      condition: >= 3 QUEUED tasks require a capability that only 1–2 active agents have
      signal: capability_demand > 2 × capability_supply
      action: alert; recommend agent spawning or task redistribution

    RESOURCE_BOTTLENECK:
      condition: resource utilization > 80% with >= 3 pending reservations
      action: alert; trigger resource pool expansion if available; notify orchestrator

    APPROVAL_BOTTLENECK:
      condition: >= 5 AWAITING_APPROVAL tasks targeting same approver tier
      action: alert governance dashboard; recommend approver pool expansion

    INTEGRATION_BOTTLENECK:
      condition: throughput of CALLS or SENDS_DATA_TO edge > 80% of rate_limit
      action: alert; trigger rate limiting on upstream callers; recommend quota increase

    CRITICAL_PATH_BOTTLENECK:
      condition: same task appears on critical path of >= 3 simultaneous workflows
      action: prioritize that task; alert orchestrator; may need resource preemption

  bottleneck_report:
    frequency: every 5 minutes
    format: [{bottleneck_type, node_id, severity, affected_workflows, recommended_action}]
    consumers: [orchestration-dashboard, graph-observability, governance-dashboard]
```

---

## Integration Points

| System | Role |
|---|---|
| `temporal-knowledge-graphs/runtime-state-graph.md` | Runtime state graph provides the data model |
| `graph-cognition/graph-cognition-engine.md` | Topology mutations written as graph episodes |
| `enterprise-topology/org-relationship-graph.md` | Agent topology derived from org relationship graph |
| `enterprise-topology/dependency-graph.md` | Dependency resolution/violation events processed here |
| `enterprise-topology/workflow-topology-graph.md` | Workflow topology state maintained here |
| `enterprise-topology/integration-graph.md` | Integration health events processed here |
| `graph-observability/topology-visualization.md` | Topology state consumed by visualization |
| `graph-routing/graph-traversal-router.md` | Router reads topology for real-time routing decisions |
