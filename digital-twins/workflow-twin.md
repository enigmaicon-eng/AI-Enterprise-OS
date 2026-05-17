# Workflow Twin

**System ID:** `workflow-twin`
**Role:** Live computational mirror of all workflow execution across the enterprise — tracks throughput, quality, velocity, and failure patterns in real time
**Storage:** `memory/digital-twins/twin-state/workflow-twin.yaml`

---

## Purpose

The workflow-twin reflects the actual execution health of the enterprise's process layer. Every workflow running through the OS is tracked: its progress, quality metrics, gate performance, retry patterns, and failure signals. The twin answers:

- "What is the current end-to-end throughput of the feature development workflow?"
- "Which step type has the highest retry rate right now?"
- "If gate criteria become 20% stricter, how does cycle time change?"
- "Where are workflows stalling today?"

---

## Data Sources

| Data Domain | Source | Sync Frequency |
|-------------|--------|----------------|
| Active workflows | `memory/execution-registry.yaml` | 5 min |
| Step events | `memory/execution-ledger.jsonl` | 5 min |
| Step state transitions | `memory/execution-store/step-states.jsonl` | 5 min |
| Gate verdicts | `memory/execution-store/gate-verdicts.jsonl` | 5 min |
| Artifact production | `memory/execution-store/artifact-registry.jsonl` | 10 min |
| Decision velocity | `memory/execution-store/decision-log.jsonl` | 15 min |
| Work queue depth | `memory/work-queue.yaml` | 5 min |
| Checkpoint health | `memory/execution-store/checkpoint-index.jsonl` | 30 min |

---

## Workflow Twin State Schema

`memory/digital-twins/twin-state/workflow-twin.yaml`:

### Portfolio View

```yaml
workflow_twin:
  snapshot_id: "wf-[YYYY-MM-DD-HHMMSS]"
  synced_at: "[ISO-8601]"
  metrics_window_days: 30
  
  portfolio:
    # Current inventory
    total_active: 0
    total_suspended: 0
    total_blocked: 0
    total_escalated: 0
    total_completed_last_7_days: 0
    total_failed_last_30_days: 0
    
    # By workflow type
    by_type:
      feature_development:
        active: 0
        avg_duration_days: 0.0
        completion_rate: 0.0
        success_rate: 0.0
      discovery:
        active: 0
        avg_duration_days: 0.0
        completion_rate: 0.0
        success_rate: 0.0
      architecture_review:
        active: 0
        avg_duration_days: 0.0
        completion_rate: 0.0
        success_rate: 0.0
      sprint_planning:
        active: 0
        avg_duration_days: 0.0
        completion_rate: 0.0
        success_rate: 0.0
      # ... other types
    
    # WIP (Work in Progress) health
    wip_health:
      wip_count: 0
      wip_limit_recommended: 0    # based on capacity analysis
      wip_over_limit: false
      avg_wip_age_days: 0.0
      oldest_active_workflow_days: 0
```

### Step Performance Metrics

```yaml
  step_performance:
    # Aggregate across all workflow types, last 30 days
    total_steps_completed: 0
    total_steps_in_progress: 0
    total_steps_failed: 0
    
    avg_step_duration_minutes: 0.0
    p50_step_duration_minutes: 0.0
    p90_step_duration_minutes: 0.0   # 90th percentile — identifies outliers
    
    steps_per_hour: 0.0
    throughput_trend: "IMPROVING | STABLE | DECLINING"
    
    # By step type
    by_step_type:
      "[step-type]":
        avg_duration_minutes: 0.0
        gate_pass_rate: 0.0
        first_pass_rate: 0.0
        avg_retries: 0.0
        failure_rate: 0.0
```

### Gate Performance

```yaml
  gate_performance:
    # Overall gate health
    overall_pass_rate: 0.0       # fraction of gate checks that pass
    first_pass_rate: 0.0         # fraction that pass on first attempt
    avg_cycles_per_gate: 0.0
    
    # By gate type
    by_gate_type:
      checklist:
        pass_rate: 0.0
        avg_cycles: 0.0
        most_failed_criterion: "[criterion text]"
      schema:
        pass_rate: 0.0
        avg_cycles: 0.0
      agent_review:
        pass_rate: 0.0
        avg_cycles: 0.0
      human_review:
        pass_rate: 0.0
        avg_cycles: 0.0
        avg_wait_hours: 0.0      # time waiting for human reviewer
    
    # Failure pattern analysis
    top_failure_criteria:
      - criterion: "[most frequently failed criterion]"
        failure_count: 0
        failure_rate: 0.0
        affecting_workflows: 0
    
    # Gate anomalies
    recent_gate_fail_cluster: false  # 3+ fails in same hour across diff workflows
    gate_fail_trend: "IMPROVING | STABLE | WORSENING"
```

### Flow Efficiency

```yaml
  flow_efficiency:
    # Lead time (from workflow start to completion)
    avg_lead_time_days: 0.0
    p50_lead_time_days: 0.0
    p90_lead_time_days: 0.0
    
    # Cycle time (active execution time, excluding wait)
    avg_cycle_time_hours: 0.0
    avg_wait_time_hours: 0.0   # time spent waiting (blocked, escalated, queued)
    
    # Flow efficiency ratio
    flow_efficiency_ratio: 0.0  # cycle_time / lead_time — higher is better
    
    # Batch sizes (how many steps run in parallel)
    avg_parallel_steps: 0.0
    max_parallel_steps_observed: 0
    
    # Queue metrics
    work_queue:
      total_pending: 0
      blocked_pending: 0     # pending but blocked on dependencies
      ready_pending: 0       # pending and ready to execute
      avg_queue_age_minutes: 0
      oldest_item_hours: 0
```

### Failure Analysis

```yaml
  failure_analysis:
    # By failure class (F1-F9 from failure-detector.md)
    failure_class_distribution:
      F1_missing_artifact: 0
      F2_stalled: 0
      F3_gate_fail_unrecovered: 0
      F4_partial_parallel: 0
      F5_checkpoint_corrupt: 0
      F6_decision_conflict: 0
      F7_runaway: 0
      F8_state_corrupt: 0
      F9_orphan_artifact: 0
    
    # Recovery success rates
    recovery_success_rate: 0.0
    avg_recovery_time_minutes: 0.0
    rollback_frequency: 0.0  # rollbacks per 100 workflows
    
    # Failure concentration
    failure_hotspots:
      - workflow_type: "[type]"
        step_id: "[step]"
        failure_rate: 0.0
        dominant_failure_class: "F[N]"
```

---

## Execution Velocity Signals

Leading indicators tracked for early warning:

```yaml
  velocity_signals:
    # Current velocity vs. 30-day baseline
    step_completion_rate_vs_baseline: 0.0  # 1.0 = on baseline
    gate_pass_rate_vs_baseline: 0.0
    lead_time_vs_baseline: 0.0
    
    # Trend signals (last 7 days)
    velocity_trend: "ACCELERATING | STABLE | DECELERATING | CRITICAL"
    velocity_change_pct_7d: 0.0
    
    # Warning signals
    active_warning_flags:
      - flag: "THROUGHPUT_DECLINING"
        severity: "HIGH"
        signal: "Steps/hour down 25% vs. 7-day avg"
        onset_hours_ago: 4
```

---

## Simulation Interface

When workflow-simulator.md requests a simulation:

```
PERTURBATION TYPES:
  - { type: "volume_increase", factor: 1.5 }
    → Scale active_workflows by factor
    → Recompute capacity utilization under load
  
  - { type: "gate_strictness_increase", gate_type: "agent_review", delta: -0.10 }
    → Reduce pass_rate for specified gate type by delta
    → Project impact on cycle time and flow efficiency
  
  - { type: "step_failure_injection", step_type: "[type]", failure_rate: 0.20 }
    → Inject synthetic failures in specified step type
    → Model recovery overhead impact
  
  - { type: "parallel_cap", max_parallel: 3 }
    → Limit parallel step execution
    → Project throughput impact

RETURN: perturbed workflow-twin state for simulation to run N iterations against
```

---

## Critical Workflow Tracking

For workflows flagged as CRITICAL priority:

```yaml
  critical_workflows:
    - workflow_id: "[id]"
      type: "[type]"
      priority: "CRITICAL"
      started_at: "[ISO-8601]"
      current_step: "[step-id]"
      elapsed_days: 0
      projected_completion: "[ISO-8601]"
      at_risk: false
      risk_reason: null
```

---

## Integration

**Data sources:**
- `memory/execution-ledger.jsonl`
- `memory/execution-store/step-states.jsonl`
- `memory/execution-store/gate-verdicts.jsonl`
- `memory/execution-registry.yaml`
- `memory/work-queue.yaml`

**Read by:**
- `simulation-systems/workflow-simulator.md`
- `simulation-systems/orchestration-simulator.md`
- `predictive-intelligence/operational-forecaster.md`
- `predictive-intelligence/bottleneck-predictor.md`
- `forecasting/delivery-forecaster.md`

**Written by:**
- `digital-twins/twin-engine.md` (sync cycles)
- `digital-twins/twin-sync.md`
