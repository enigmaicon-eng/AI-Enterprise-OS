# Organizational Twin

**System ID:** `org-twin`
**Role:** Live computational mirror of the enterprise's organizational structure, capacity, workload distribution, and health — updated continuously from live OS state
**Storage:** `memory/digital-twins/twin-state/org-twin.yaml`

---

## Purpose

The org-twin is a real-time model of the human and agent organization. It answers questions like:
- "Which teams are overloaded right now?"
- "If we remove agent X, which workflows lose coverage?"
- "How does capacity change if we add a PM org specialist?"
- "What is the current governance health score?"

It mirrors the actual organizational state — not the ideal/designed state — so simulations run against reality, not planning documents.

---

## Data Sources

| Data Domain | Source File | Sync Frequency |
|-------------|------------|----------------|
| Agent definitions | `agents/*-org.md` | On change |
| Active workflow assignments | `memory/execution-registry.yaml` | 5 min |
| Workload (in-progress steps) | `memory/execution-store/step-states.jsonl` | 5 min |
| Escalation queue | `memory/execution-store/escalation-log.jsonl` | 5 min |
| Decision velocity | `memory/execution-store/decision-log.jsonl` | 15 min |
| Gate pass rates | `memory/execution-store/gate-verdicts.jsonl` | 15 min |
| Delegation patterns | `memory/execution-store/delegation-log.jsonl` | 15 min |

---

## Org Twin State Schema

`memory/digital-twins/twin-state/org-twin.yaml`:

### Organizational Units

```yaml
org_twin:
  snapshot_id: "org-[YYYY-MM-DD-HHMMSS]"
  synced_at: "[ISO-8601]"
  data_horizon: "last_30_days"  # metrics computed over this window
  
  organizational_units:
    - unit_id: "[org-id]"
      unit_name: "[org name — e.g., product-org]"
      parent_unit: "[parent-id or null — for enterprise hierarchy]"
      
      # Agent roster
      agents:
        total_agents: 0
        active_agents: 0      # agents with at least 1 active workflow assignment
        idle_agents: 0        # agents with no active assignments
        overloaded_agents: 0  # agents with > max_concurrent_workflows
      
      # Workload
      workload:
        active_workflows: 0
        active_steps: 0
        queued_steps: 0       # steps waiting in work queue for this org's agents
        avg_step_duration_minutes: 0
        steps_completed_last_7_days: 0
      
      # Capacity
      capacity:
        theoretical_capacity: 0  # max workflows if all agents at 100%
        actual_utilization_pct: 0.0  # 0.0 to 1.0
        available_capacity: 0   # theoretical - active
        capacity_trend: "GROWING | STABLE | SHRINKING"  # 7-day trend
      
      # Quality
      quality:
        gate_pass_rate: 0.0     # 0.0 to 1.0, last 30 days
        first_pass_rate: 0.0   # gates passed on first attempt
        avg_gate_cycles: 0.0    # average retry count per gate
        escalation_rate: 0.0   # escalations per workflow
      
      # Health score (0-100, composite)
      health_score: 0
      health_factors:
        capacity_health: 0      # 30% weight — utilization within acceptable range
        quality_health: 0       # 30% weight — gate pass rates
        velocity_health: 0      # 20% weight — completion rate trend
        governance_health: 0    # 20% weight — decision velocity, policy adherence
```

### Agent-Level State

```yaml
  agents:
    - agent_id: "[agent-id]"
      unit_id: "[org-id]"
      agent_role: "[role from agent definition]"
      trust_tier: "T1 | T2 | T3 | T4 | T5"
      
      # Current load
      active_workflows: 0
      active_steps: 0
      queued_items_for_agent: 0
      
      # Performance (last 30 days)
      performance:
        workflows_completed: 0
        avg_step_duration_minutes: 0
        gate_pass_rate: 0.0
        escalation_rate: 0.0
        delegation_success_rate: 0.0
      
      # Capacity signals
      utilization_pct: 0.0
      overload_flag: false        # true if active > capacity threshold
      idle_flag: false            # true if no active work for > 2 hours
      
      # Specialization
      workflow_types_handled: []  # list of workflow types this agent executed
      most_common_workflow: "[type]"
```

### Escalation State

```yaml
  escalation_state:
    total_open_escalations: 0
    critical_escalations: 0
    blocked_workflows: 0
    avg_escalation_age_hours: 0
    oldest_escalation_hours: 0
    
    by_type:
      gate_fail: 0
      human_decision: 0
      conflict: 0
      resource: 0
    
    by_blocking_org: {}  # which org's decisions are blocking others
```

### Governance State

```yaml
  governance_state:
    # Decision velocity
    avg_decision_time_hours: 0    # time from decision needed to decision made
    decisions_made_last_7_days: 0
    final_decisions_pct: 0.0      # fraction that are FINAL (vs SOFT)
    
    # Policy adherence
    gate_bypass_rate: 0.0         # should be 0.0 — any bypass is a violation
    constraint_violations: 0      # MUST constraints violated
    rollback_count_30_days: 0
    
    # Governance health score
    governance_score: 0           # 0-100
```

---

## Derived Metrics

Computed from raw state, updated each sync:

```yaml
  derived_metrics:
    # Org-wide capacity
    total_capacity_utilization: 0.0
    overloaded_units: []          # units with utilization > 0.90
    underloaded_units: []         # units with utilization < 0.20
    
    # Concentration risk
    single_agent_coverage: []     # workflow types covered by only 1 agent
    coverage_gap_risk: "HIGH | MEDIUM | LOW"
    
    # Throughput
    org_throughput:
      workflows_completed_last_7_days: 0
      steps_per_hour: 0.0
      throughput_trend: "IMPROVING | STABLE | DECLINING"
    
    # Bottleneck map
    current_bottlenecks:
      - location: "[agent-id or org-id]"
        type: "CAPACITY | QUALITY | GOVERNANCE | ESCALATION"
        severity: "CRITICAL | HIGH | MEDIUM"
        evidence: "[metric that triggered this]"
    
    # Organization health composite
    org_health_score: 0           # 0-100 composite across all units
    health_trend: "IMPROVING | STABLE | DECLINING"
    health_risk_flag: false
```

---

## Sync Protocol

### Event-Driven Sync (Priority)

Triggered when any relevant file changes:

```
TRIGGER: New entry in execution-registry.yaml (workflow started/completed)
→ Update affected agent's active_workflows count
→ Recompute unit workload
→ Recompute unit utilization_pct
→ Check for overload flag
→ Update derived_metrics.current_bottlenecks
```

### Batch Sync (Every 15 Minutes)

Full metric recomputation:

```
FOR EACH organizational unit:
  1. Count active agents from execution-registry
  2. Count active steps from step-states.jsonl (last 15 min)
  3. Compute gate_pass_rate from gate-verdicts.jsonl (last 30 days)
  4. Compute escalation_rate from escalation-log.jsonl (last 30 days)
  5. Compute avg_step_duration from step-states.jsonl (last 30 days)
  6. Recompute health_score
  7. Update derived_metrics

Recompute org-wide:
  8. total_capacity_utilization
  9. bottleneck map
  10. org_health_score
```

---

## Health Score Formula

```
unit_health_score = (
  capacity_health × 0.30 +
  quality_health  × 0.30 +
  velocity_health × 0.20 +
  governance_health × 0.20
)

WHERE:
  capacity_health  = 100 × (1 - MAX(0, utilization_pct - 0.80) / 0.20)
    # Full score at ≤ 80% utilization; zero at 100%
  
  quality_health   = 100 × gate_pass_rate
  
  velocity_health  = 100 × MIN(1, steps_per_hour / baseline_steps_per_hour)
  
  governance_health = 100 × (1 - gate_bypass_rate) × (1 - MIN(1, escalation_rate × 2))
```

---

## Simulation Interface

When org-simulator.md requests a simulation snapshot:

```
INPUT: { snapshot_type: "frozen | live", as_of_timestamp: "[ISO-8601 or null]" }

RETURN: Complete org-twin state at requested timestamp
  - If "frozen": use cached state from requested time (from snapshot history)
  - If "live": use current state

PERTURBATION PROTOCOL (for what-if scenarios):
  Caller provides perturbations:
  - { type: "add_agent", unit_id: "[id]", agent_role: "[role]" }
  - { type: "remove_agent", agent_id: "[id]" }
  - { type: "increase_workflow_volume", factor: 1.5 }
  - { type: "change_gate_pass_rate", unit_id: "[id]", delta: -0.10 }

Apply perturbations to a COPY of the state — never to the live twin.
Return perturbed state for simulation to run against.
```

---

## Integration

**Data sources:**
- `agents/*-org.md` → agent definitions (structure)
- `memory/execution-registry.yaml` → active workflow assignments
- `memory/execution-store/` (all JSONL files) → performance metrics
- `memory/work-queue.yaml` → queued work

**Read by:**
- `simulation-systems/org-simulator.md` → org simulation scenarios
- `simulation-systems/staffing-simulator.md` → capacity analysis
- `simulation-systems/governance-simulator.md` → governance state
- `simulation-systems/escalation-simulator.md` → escalation state
- `predictive-intelligence/org-forecaster.md` → health forecasting
- `predictive-intelligence/bottleneck-predictor.md` → bottleneck detection

**Written by:**
- `digital-twins/twin-engine.md` → sync cycles
- `digital-twins/twin-sync.md` → sync protocol execution
