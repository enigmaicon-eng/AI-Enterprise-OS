# Twin Registry

**System ID:** `twin-registry`
**Role:** Central index of all digital twins — metadata, health status, sync schedules, and simulation capabilities for each registered twin
**Storage:** `memory/digital-twins/twin-registry.yaml`

---

## Purpose

The twin registry is the discovery layer for the digital twin system. It answers: "What twins exist, what do they model, how fresh is their data, and what can I simulate against them?" Every simulation request starts with a registry lookup to select appropriate twins and verify their health.

---

## Registry Schema

`memory/digital-twins/twin-registry.yaml`:

```yaml
twin_registry:
  version: "1.0.0"
  last_updated: "[ISO-8601]"
  total_twins: 4
  
  twins:
    - twin_id: "org-twin"
      display_name: "Organizational Twin"
      description: "Live mirror of organizational structure, agent capacity, workload, governance health"
      state_file: "memory/digital-twins/twin-state/org-twin.yaml"
      definition_file: "digital-twins/org-twin.md"
      
      health:
        status: "STABLE | SYNCING | STALE | ERROR | INITIALIZING"
        last_synced: "[ISO-8601]"
        staleness_threshold_minutes: 20
        is_current: true
        confidence: "HIGH | MEDIUM | LOW | DEGRADED"
      
      sync_config:
        mode: "event_driven + scheduled"
        schedule_frequency_minutes: 15
        primary_trigger: "execution-ledger events"
        sources:
          - "agents/*-org.md"
          - "memory/execution-registry.yaml"
          - "memory/execution-store/step-states.jsonl"
          - "memory/execution-store/escalation-log.jsonl"
          - "memory/execution-store/gate-verdicts.jsonl"
      
      capabilities:
        simulations_supported:
          - "staffing_change"
          - "org_restructure"
          - "governance_impact"
          - "escalation_cascade"
          - "capacity_stress"
        predictions_supported:
          - "org_health_forecast"
          - "capacity_exhaustion"
          - "governance_risk"
          - "escalation_surge"
        
        simulation_snapshot_available: true   # can freeze state for simulation
        historical_snapshots_available: false # point-in-time replay not yet supported
      
      metrics_summary:
        key_metric_1: { name: "org_health_score", value: 0, unit: "0-100" }
        key_metric_2: { name: "capacity_utilization_pct", value: 0.0, unit: "fraction" }
        key_metric_3: { name: "gate_pass_rate", value: 0.0, unit: "fraction" }
        key_metric_4: { name: "open_escalations", value: 0, unit: "count" }
    
    - twin_id: "workflow-twin"
      display_name: "Workflow Execution Twin"
      description: "Live mirror of all workflow throughput, step performance, gate health, and flow efficiency"
      state_file: "memory/digital-twins/twin-state/workflow-twin.yaml"
      definition_file: "digital-twins/workflow-twin.md"
      
      health:
        status: "STABLE"
        last_synced: "[ISO-8601]"
        staleness_threshold_minutes: 10
        is_current: true
        confidence: "HIGH"
      
      sync_config:
        mode: "event_driven + scheduled"
        schedule_frequency_minutes: 5
        primary_trigger: "step_started/completed events"
        sources:
          - "memory/execution-ledger.jsonl"
          - "memory/execution-store/step-states.jsonl"
          - "memory/execution-store/gate-verdicts.jsonl"
          - "memory/work-queue.yaml"
      
      capabilities:
        simulations_supported:
          - "volume_increase"
          - "gate_strictness_change"
          - "step_failure_injection"
          - "parallel_execution_cap"
          - "workflow_mix_change"
        predictions_supported:
          - "throughput_forecast"
          - "gate_pass_rate_trend"
          - "flow_efficiency_projection"
          - "backlog_growth"
        
        simulation_snapshot_available: true
        historical_snapshots_available: false
      
      metrics_summary:
        key_metric_1: { name: "steps_per_hour", value: 0.0, unit: "steps/hour" }
        key_metric_2: { name: "gate_pass_rate", value: 0.0, unit: "fraction" }
        key_metric_3: { name: "avg_lead_time_days", value: 0.0, unit: "days" }
        key_metric_4: { name: "active_workflows", value: 0, unit: "count" }
    
    - twin_id: "delivery-twin"
      display_name: "Delivery Pipeline Twin"
      description: "Live mirror of roadmap items, sprint velocity, dependencies, and release readiness"
      state_file: "memory/digital-twins/twin-state/delivery-twin.yaml"
      definition_file: "digital-twins/delivery-twin.md"
      
      health:
        status: "STABLE"
        last_synced: "[ISO-8601]"
        staleness_threshold_minutes: 45
        is_current: true
        confidence: "HIGH"
      
      sync_config:
        mode: "scheduled"
        schedule_frequency_minutes: 30
        primary_trigger: "scheduled (lower frequency — delivery state changes slowly)"
        sources:
          - "sprints/"
          - "memory/execution-registry.yaml"
          - "memory/work-queue.yaml"
          - "memory/execution-store/gate-verdicts.jsonl"
      
      capabilities:
        simulations_supported:
          - "scope_addition"
          - "velocity_change"
          - "dependency_delay"
          - "resource_constraint"
          - "scope_cut"
          - "sprint_split"
        predictions_supported:
          - "delivery_date_forecast"
          - "release_readiness"
          - "dependency_risk"
          - "velocity_projection"
          - "carry_over_risk"
        
        simulation_snapshot_available: true
        historical_snapshots_available: false
      
      metrics_summary:
        key_metric_1: { name: "delivery_confidence_score", value: 0, unit: "0-100" }
        key_metric_2: { name: "items_at_risk", value: 0, unit: "count" }
        key_metric_3: { name: "critical_path_days", value: 0, unit: "days" }
        key_metric_4: { name: "current_sprint_on_track", value: true, unit: "bool" }
    
    - twin_id: "runtime-twin"
      display_name: "Runtime System Twin"
      description: "Live mirror of AI agent runtime — sessions, context consumption, tool usage, recovery overhead"
      state_file: "memory/digital-twins/twin-state/runtime-twin.yaml"
      definition_file: "digital-twins/runtime-twin.md"
      
      health:
        status: "STABLE"
        last_synced: "[ISO-8601]"
        staleness_threshold_minutes: 10
        is_current: true
        confidence: "HIGH"
      
      sync_config:
        mode: "event_driven + scheduled"
        schedule_frequency_minutes: 5
        primary_trigger: "agent invocation events"
        sources:
          - "memory/execution-store/agent-invocations.jsonl"
          - "memory/execution-store/session-manifest.jsonl"
          - "memory/execution-store/checkpoint-index.jsonl"
          - "memory/execution-ledger.jsonl"
      
      capabilities:
        simulations_supported:
          - "concurrent_workflow_increase"
          - "context_pressure_increase"
          - "tool_latency_degradation"
          - "recovery_rate_increase"
          - "orchestration_load_spike"
        predictions_supported:
          - "context_saturation_onset"
          - "orchestrator_saturation"
          - "tool_budget_exhaustion_rate"
          - "recovery_overhead_trend"
        
        simulation_snapshot_available: true
        historical_snapshots_available: false
      
      metrics_summary:
        key_metric_1: { name: "composite_saturation_pct", value: 0.0, unit: "fraction" }
        key_metric_2: { name: "active_sessions", value: 0, unit: "count" }
        key_metric_3: { name: "recovery_overhead_pct", value: 0.0, unit: "fraction" }
        key_metric_4: { name: "context_pressure_index", value: 0.0, unit: "0-1" }
```

---

## Registry Operations

### Lookup Twin

```
INPUT: twin_id
RETURN: Full twin registration record
  IF not found: error "Unknown twin [id]"
  IF twin.health.status == "STALE": warn + trigger sync
```

### Check Twin Health

Used before every simulation:

```
INPUT: [twin_id_1, twin_id_2, ...]

FOR EACH twin:
  1. Check health.status == "STABLE"
  2. Check last_synced < staleness_threshold
  3. Check is_current == true

IF any twin is STALE or SYNCING:
  → Wait for sync to complete (max 5 min)
  → If still not STABLE: return "Simulation unavailable — [twin-id] is [status]"

IF all twins STABLE:
  → Proceed with simulation
```

### Find Twins for Simulation Type

Given a simulation scenario, identify which twins are needed:

```
SCENARIO → REQUIRED TWINS mapping:
  "staffing_change"       → [org-twin]
  "org_restructure"       → [org-twin, workflow-twin]
  "gate_strictness"       → [workflow-twin, delivery-twin]
  "release_risk"          → [delivery-twin, workflow-twin]
  "runtime_load"          → [runtime-twin, workflow-twin]
  "roadmap_slip"          → [delivery-twin, org-twin]
  "governance_impact"     → [org-twin, workflow-twin]
  "dependency_cascade"    → [delivery-twin]
  "capacity_saturation"   → [org-twin, runtime-twin]
  "full_enterprise"       → [org-twin, workflow-twin, delivery-twin, runtime-twin]
```

### Update Twin Health

Called by twin-sync after each sync:

```
INPUT: twin_id, status, last_synced, confidence, metrics_summary

UPDATE: registry entry for twin_id
WRITE: twin-registry.yaml
LOG: registry_updated event
```

---

## Registry Health Dashboard

Synthesized view for quick health checks:

```yaml
registry_health:
  all_twins_stable: true
  twins_stale: []
  twins_in_error: []
  
  overall_confidence: "HIGH | MEDIUM | LOW | DEGRADED"
  oldest_sync: "[ISO-8601 — the least recently synced twin's last_synced]"
  
  simulation_readiness:
    org_simulations: "READY | UNAVAILABLE"
    workflow_simulations: "READY | UNAVAILABLE"
    delivery_simulations: "READY | UNAVAILABLE"
    runtime_simulations: "READY | UNAVAILABLE"
    full_enterprise_simulations: "READY | UNAVAILABLE"
```

---

## Integration

**Read by:**
- `digital-twins/twin-engine.md` → twin selection and health verification
- `simulation-systems/simulation-engine.md` → before every simulation run
- `predictive-intelligence/prediction-engine.md` → twin availability check
- Any agent requesting a "what-if" analysis

**Written by:**
- `digital-twins/twin-sync.md` → updates health on each sync
- `digital-twins/twin-engine.md` → initial registration
