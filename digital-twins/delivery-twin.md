# Delivery Twin

**System ID:** `delivery-twin`
**Role:** Live mirror of the enterprise's delivery pipeline — roadmap items, sprint execution, dependency chains, and release readiness — enabling accurate delivery forecasting and risk detection
**Storage:** `memory/digital-twins/twin-state/delivery-twin.yaml`

---

## Purpose

The delivery-twin models where delivery actually is, not where the plan says it should be. It continuously reconciles planned delivery against actual execution velocity and identifies deviations before they become misses. It answers:

- "Which roadmap items are at risk of slipping?"
- "What is the dependency-adjusted probability of shipping Feature X by date Y?"
- "Which release is carrying the most unresolved technical debt?"
- "How does adding 2 weeks of scope to Sprint N affect the next 3 sprints?"

---

## Data Sources

| Data Domain | Source | Sync Frequency |
|-------------|--------|----------------|
| Sprint records | `sprints/` directory | 30 min |
| Workflow completions | `memory/execution-registry.yaml` | 30 min |
| Work queue | `memory/work-queue.yaml` | 30 min |
| Gate verdicts | `memory/execution-store/gate-verdicts.jsonl` | 30 min |
| Architecture decisions | `architecture/decisions/` | On change |
| Release workflows | `memory/execution-ledger.jsonl` (release events) | 30 min |

---

## Delivery Twin State Schema

`memory/digital-twins/twin-state/delivery-twin.yaml`:

### Roadmap State

```yaml
delivery_twin:
  snapshot_id: "del-[YYYY-MM-DD-HHMMSS]"
  synced_at: "[ISO-8601]"
  planning_horizon_days: 180
  
  roadmap:
    items:
      - item_id: "[roadmap-item-id]"
        title: "[feature/initiative title]"
        owner_team: "[org-id]"
        
        # Planning data
        planned_start: "[ISO-8601]"
        planned_completion: "[ISO-8601]"
        estimated_effort_points: 0
        
        # Actual progress
        actual_start: "[ISO-8601 or null]"
        percent_complete: 0.0
        steps_total: 0
        steps_complete: 0
        
        # Adjusted forecast
        forecast_completion_p50: "[ISO-8601]"
        forecast_completion_p10: "[ISO-8601]"   # pessimistic
        forecast_completion_p90: "[ISO-8601]"   # optimistic
        forecast_confidence: "HIGH | MEDIUM | LOW"
        
        # Risk
        at_risk: false
        slip_probability: 0.0        # probability of missing planned_completion
        slip_days_expected: 0        # expected slip in days (0 if not at risk)
        risk_factors: []             # list of risk factor labels
        
        # Dependencies
        depends_on: ["[item-id]"]
        blocks: ["[item-id]"]
        dependency_risk: "CLEAR | AT_RISK | BLOCKED"
        
        # Release assignment
        target_release: "[release-id or null]"
        release_readiness: "READY | AT_RISK | NOT_READY | UNASSESSED"
```

### Sprint State

```yaml
  sprint_state:
    current_sprint:
      sprint_id: "[id]"
      sprint_number: 0
      start_date: "[ISO-8601]"
      end_date: "[ISO-8601]"
      
      # Planned
      planned_points: 0
      planned_items: 0
      
      # Actual
      completed_points: 0
      completed_items: 0
      in_progress_points: 0
      
      # Live burndown
      points_remaining: 0
      days_remaining: 0
      required_velocity: 0.0  # points/day needed to finish on time
      current_velocity: 0.0   # actual points/day this sprint
      
      # Forecast
      on_track: true
      forecast_completion_pct: 0.0  # % of planned work expected to complete
      carry_over_risk: "LOW | MEDIUM | HIGH | CRITICAL"
      
      # Unplanned work
      unplanned_items_added: 0
      unplanned_points_added: 0
      unplanned_pct: 0.0  # unplanned as fraction of planned
    
    # Historical velocity (used for forecasting)
    velocity_history:
      - sprint_id: "[id]"
        velocity: 0.0
        planned_points: 0
        completed_points: 0
        carry_over_pct: 0.0
    
    # Velocity statistics
    velocity_stats:
      avg_velocity_3_sprints: 0.0
      avg_velocity_6_sprints: 0.0
      velocity_std_dev: 0.0
      carry_over_rate_avg: 0.0
      velocity_trend: "IMPROVING | STABLE | DECLINING"
```

### Dependency Graph

```yaml
  dependency_graph:
    total_dependencies: 0
    resolved_dependencies: 0
    blocked_dependencies: 0
    circular_dependencies: 0   # should be 0 — any is a problem
    
    # Critical path
    critical_path:
      items: ["[item-ids in critical path order]"]
      total_duration_days: 0
      critical_path_risk: "LOW | MEDIUM | HIGH | CRITICAL"
      bottleneck_item: "[item-id with most dependents blocking on it]"
    
    # At-risk dependencies
    at_risk_dependencies:
      - dependency:
          from_item: "[item-id]"
          to_item: "[item-id]"
          risk: "blocker is behind schedule"
          delay_probability: 0.0
          expected_delay_days: 0
    
    # Dependency clusters (groups of tightly coupled items)
    clusters:
      - cluster_id: "[id]"
        items: ["[item-ids]"]
        coupling_strength: "TIGHT | MODERATE | LOOSE"
        cluster_risk: "LOW | MEDIUM | HIGH"
```

### Release Pipeline

```yaml
  release_pipeline:
    releases:
      - release_id: "[id]"
        release_name: "[name]"
        target_date: "[ISO-8601]"
        
        # Scope
        items_in_release: ["[item-ids]"]
        items_complete: 0
        items_in_progress: 0
        items_not_started: 0
        items_at_risk: 0
        
        # Quality gates
        gate_results:
          discovery_gate: "PASSED | PENDING | FAILED | NOT_REACHED"
          architecture_gate: "PASSED | PENDING | FAILED | NOT_REACHED"
          engineering_gate: "PASSED | PENDING | FAILED | NOT_REACHED"
          qa_gate: "PASSED | PENDING | FAILED | NOT_REACHED"
          release_gate: "PASSED | PENDING | FAILED | NOT_REACHED"
        
        # Release health
        readiness_score: 0          # 0-100
        release_risk: "LOW | MEDIUM | HIGH | CRITICAL"
        go_no_go_recommendation: "GO | CONDITIONAL_GO | NO_GO | INSUFFICIENT_DATA"
        
        # Confidence
        on_time_probability: 0.0
        scope_completeness_probability: 0.0   # probability of shipping full scope
```

---

## Delivery Health Metrics

```yaml
  delivery_health:
    # Overall delivery confidence
    delivery_confidence_score: 0    # 0-100
    
    # DORA-adjacent metrics (derived from workflow execution)
    delivery_frequency:
      releases_last_30_days: 0
      avg_release_cycle_days: 0.0
      release_frequency_trend: "INCREASING | STABLE | DECREASING"
    
    lead_time_for_changes:
      avg_days_idea_to_production: 0.0
      p50_days: 0.0
      p90_days: 0.0
    
    change_failure_rate:
      rollbacks_last_30_days: 0
      gate_fail_rate: 0.0
      post_release_issues: 0
    
    # Predictability
    forecast_accuracy:
      on_time_delivery_rate: 0.0    # % of items delivered by planned date
      avg_slip_days_when_missed: 0.0
      forecast_accuracy_score: 0.0  # how accurate were our prior p50 forecasts?
```

---

## Simulation Interface

Perturbations for delivery simulation:

```
PERTURBATION TYPES:
  - { type: "add_scope_to_sprint", sprint_id: "[id]", points: 10 }
    → Increase planned_points
    → Reforecast completion_pct and carry_over_risk
  
  - { type: "velocity_change", factor: 0.8 }
    → Reduce historical velocity by factor
    → Reforecast all roadmap items
  
  - { type: "dependency_delay", item_id: "[id]", delay_days: 14 }
    → Apply delay to item
    → Cascade through dependency graph
    → Identify all downstream items affected
  
  - { type: "resource_constraint", team: "[org-id]", capacity_reduction: 0.3 }
    → Reduce effective capacity of team
    → Reforecast all items owned by that team
  
  - { type: "scope_cut", item_ids: ["[id]"] }
    → Remove items from release scope
    → Recompute release readiness and on-time probability
```

---

## Integration

**Data sources:**
- `sprints/` directory
- `memory/execution-registry.yaml`
- `memory/work-queue.yaml`
- `memory/execution-store/gate-verdicts.jsonl`
- `architecture/decisions/`

**Read by:**
- `forecasting/roadmap-forecaster.md`
- `forecasting/dependency-simulator.md`
- `forecasting/release-risk-simulator.md`
- `forecasting/rollout-forecaster.md`
- `forecasting/delivery-forecaster.md`
- `predictive-intelligence/operational-forecaster.md`

**Written by:**
- `digital-twins/twin-engine.md`
- `digital-twins/twin-sync.md`
