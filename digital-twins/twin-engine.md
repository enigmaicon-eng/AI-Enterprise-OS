# Twin Engine

**System ID:** `twin-engine`
**Role:** Master orchestrator for the enterprise digital twin system — creates, synchronizes, and coordinates all twins, triggers simulations, and routes prediction requests
**Storage:** `memory/digital-twins/twin-state/` (per-twin state files) + `memory/digital-twins/twin-registry.yaml` (global index)

---

## Purpose

A digital twin is a continuously updated computational model of a real system. The Enterprise Digital Twin system maintains live mirrors of the organizational structure, workflow execution, delivery pipeline, and runtime behavior — then uses these mirrors to run simulations and make predictions about future states before they happen.

The twin engine answers: **"If we do X, what happens to Y?"** before X is actually done.

---

## Twin Inventory

The system maintains four primary twins:

| Twin ID | System Mirrored | Sync Frequency | Primary Source |
|---------|----------------|----------------|----------------|
| `org-twin` | Organizational structure + capacity | 15 min | agents/, memory/execution-registry.yaml |
| `workflow-twin` | Workflow execution state + performance | 5 min | memory/execution-ledger.jsonl |
| `delivery-twin` | Roadmap + sprint + dependency state | 30 min | sprints/, workflows/, work-queue.yaml |
| `runtime-twin` | Agent runtime + tool usage + load | 5 min | memory/execution-store/agent-invocations.jsonl |

---

## Twin Lifecycle

```
INITIALIZE → SYNC → STABLE → SIMULATE → PREDICT → REPORT
                ↑___________|
                (continuous loop)
```

### Phase 01: Initialize

On first boot or full resync:

```
FOR EACH twin in [org-twin, workflow-twin, delivery-twin, runtime-twin]:
  1. Read all source-of-truth files for this twin
  2. Build complete initial state snapshot
  3. Compute baseline metrics (see enterprise-modeling/[type]-model.md for schemas)
  4. Write to memory/digital-twins/twin-state/[twin-id].yaml
  5. Register in twin-registry with status: "INITIALIZING" → "STABLE"
  6. Log: twin_initialized event
```

### Phase 02: Sync (Continuous)

Twin state is updated on two triggers:

**Event-driven sync:** When a source file changes:
```
TRIGGER: New record appended to execution-ledger.jsonl
→ Identify which twin(s) this event affects
→ Apply delta update to affected twin(s)
→ Update twin last_synced timestamp
→ Flag affected metrics as "stale" if delta is significant
```

**Scheduled batch sync:** Every [sync_frequency] regardless of events:
```
TRIGGER: Timer fires for twin [id]
→ Read full source-of-truth for this twin
→ Compute diff vs. current twin state
→ Apply diff
→ Recompute all derived metrics
→ Detect any state drift (expected vs. actual)
```

### Phase 03: Stable

A twin is STABLE when:
- Last sync < staleness_threshold ago
- All source files are readable
- Metrics are within expected ranges (no anomalous values)
- No active sync in progress

A STABLE twin is ready for simulation and prediction requests.

### Phase 04: Simulate

When a simulation request arrives:

```
INPUT: simulation_request {
  scenario: [scenario definition from enterprise-modeling/scenario-model.md]
  twins_required: [org-twin, workflow-twin, ...]
  simulation_type: "monte_carlo | scenario_analysis | stress_test | what_if"
}

PROTOCOL:
  1. Verify all required twins are STABLE (or sync them)
  2. Create simulation snapshot: freeze twin state for this run
  3. Route to simulation-systems/simulation-engine.md
  4. Collect results
  5. Write to memory/digital-twins/simulation-results/[result-id].yaml
  6. Trigger prediction update if results contain significant findings
```

### Phase 05: Predict

Triggered by:
- Simulation completion
- Scheduled prediction refresh (every 4 hours)
- Explicit prediction request

```
ROUTE to predictive-intelligence/prediction-engine.md:
  Input: current twin state + most recent simulation results
  Output: prediction package (see predictive-intelligence/prediction-engine.md)
```

### Phase 06: Report

Predictions and simulation results are surfaced:
- To orchestrator/master-orchestrator.md for operational decisions
- To wiki/intelligence/ as intelligence packages
- To memory/digital-twins/reports/ as timestamped reports

---

## Twin Engine State File

`memory/digital-twins/engine-state.yaml`:

```yaml
engine_state:
  last_updated: "[ISO-8601]"
  engine_status: "RUNNING | PAUSED | SYNCING | ERROR"
  
  twins:
    org-twin:
      status: "STABLE | SYNCING | STALE | ERROR"
      last_synced: "[ISO-8601]"
      staleness_threshold_minutes: 20
      metrics_current: true
    workflow-twin:
      status: "STABLE"
      last_synced: "[ISO-8601]"
      staleness_threshold_minutes: 10
      metrics_current: true
    delivery-twin:
      status: "STABLE"
      last_synced: "[ISO-8601]"
      staleness_threshold_minutes: 45
      metrics_current: true
    runtime-twin:
      status: "STABLE"
      last_synced: "[ISO-8601]"
      staleness_threshold_minutes: 10
      metrics_current: true
  
  simulation_queue:
    pending: 0
    in_progress: 0
    completed_today: 0
  
  prediction_cache:
    last_generated: "[ISO-8601]"
    predictions_valid_until: "[ISO-8601]"
    confidence_level: "HIGH | MEDIUM | LOW"
  
  health:
    all_twins_stable: true
    data_freshness: "CURRENT | STALE | DEGRADED"
    last_full_resync: "[ISO-8601]"
```

---

## Simulation Request Format

```yaml
simulation_request:
  request_id: "sim-[uuid]"
  requested_by: "[agent-id or human]"
  requested_at: "[ISO-8601]"
  priority: "CRITICAL | HIGH | MEDIUM | LOW"
  
  scenario:
    scenario_id: "scen-[uuid]"
    scenario_type: "staffing_change | release_risk | governance_impact | load_forecast | what_if"
    description: "[one-sentence scenario description]"
    parameters: {}  # scenario-specific (see enterprise-modeling/scenario-model.md)
  
  simulation_config:
    type: "monte_carlo | scenario_analysis | stress_test | sensitivity_analysis"
    iterations: 1000   # for Monte Carlo
    time_horizon_days: 90
    confidence_levels: [0.10, 0.50, 0.90]  # p10, p50, p90
  
  twins_required: ["org-twin", "workflow-twin"]
  output_format: "full | summary | executive"
```

---

## Simulation Output Format

```yaml
simulation_result:
  result_id: "simr-[uuid]"
  request_id: "sim-[uuid]"
  scenario_id: "scen-[uuid]"
  completed_at: "[ISO-8601]"
  
  iterations_run: 1000
  convergence_reached: true
  
  outcomes:
    p10: {}   # pessimistic case (10th percentile)
    p50: {}   # expected case (50th percentile)
    p90: {}   # optimistic case (90th percentile)
  
  key_findings:
    - finding: "[what the simulation revealed]"
      confidence: "HIGH | MEDIUM | LOW"
      time_to_impact_days: 30
  
  bottlenecks_identified:
    - resource: "[bottleneck location]"
      severity: "CRITICAL | HIGH | MEDIUM"
      onset_probability: 0.75
      onset_window: "[time range]"
  
  recommendations:
    - action: "[recommended action]"
      expected_impact: "[what changes]"
      confidence: "HIGH | MEDIUM | LOW"
      urgency: "IMMEDIATE | 30_DAYS | 90_DAYS"
  
  warnings:
    - "[assumption that significantly affects results]"
```

---

## Event Log Format

`memory/digital-twins/twin-events.jsonl`:

```json
{
  "event_type": "twin_synced | twin_stale | simulation_started | simulation_completed | prediction_generated | twin_anomaly",
  "twin_id": "[twin-id or null]",
  "timestamp": "[ISO-8601]",
  "details": {}
}
```

---

## Twin Anomaly Detection

During each sync, the engine checks for anomalies:

| Anomaly | Condition | Response |
|---------|-----------|---------|
| Capacity spike | Org capacity utilization > 95% | Immediate alert + bottleneck prediction |
| Throughput collapse | Workflow completion rate drops > 30% in 1 hour | Trigger workflow simulation |
| Escalation surge | Escalation rate 3× baseline | Governance risk prediction |
| Gate fail cluster | 3+ consecutive gate fails on different workflows | Quality signal — trigger analysis |
| Queue saturation | Work queue depth > 50 items | Runtime load simulation |
| Decision conflict spike | 2+ decision conflicts in 24 hours | Rollback risk alert |

---

## Integration

**Reads from:**
- `digital-twins/org-twin.md` → for sync protocol
- `digital-twins/workflow-twin.md` → for sync protocol
- `digital-twins/delivery-twin.md` → for sync protocol
- `digital-twins/runtime-twin.md` → for sync protocol
- All source-of-truth files (execution-ledger, agent-invocations, work-queue, etc.)

**Writes to:**
- `memory/digital-twins/twin-state/` → per-twin state files
- `memory/digital-twins/simulation-results/` → simulation outputs
- `memory/digital-twins/reports/` → prediction reports
- `memory/digital-twins/twin-events.jsonl` → event log

**Calls:**
- `simulation-systems/simulation-engine.md` → run simulations
- `predictive-intelligence/prediction-engine.md` → generate predictions

**Called by:**
- `orchestrator/master-orchestrator.md` → "What happens if we do X?"
- Any agent requesting forecast or impact analysis
