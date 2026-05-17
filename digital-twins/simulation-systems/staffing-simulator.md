# Staffing Simulator

**System ID:** `staffing-simulator`
**Role:** Simulates the capacity, coverage, and throughput impacts of staffing changes — hiring, attrition, reorgs, hiring freezes — over a defined time horizon
**Handles:** Scenarios with perturbation types: staffing_add_agents, staffing_reduce_capacity, org_restructure

---

## Purpose

Staffing decisions are the highest-leverage org decisions — and the hardest to reverse. The staffing simulator models the full lifecycle impact of headcount changes: the ramp-up delay of new hires, the productivity dip of reorgs, the cascading coverage gaps from attrition. It produces quantified capacity trajectories so decision-makers can evaluate trade-offs before committing.

---

## Staffing Scenarios

### Scenario 01: Net New Hire

A team adds N agents of a specified role.

**Model inputs:**
```yaml
inputs:
  unit_id: string
  agent_role: string
  count: integer
  hire_start_day: integer           # Days from simulation start
  ramp_up_weeks: integer            # 0 → full productivity
  concurrent_workflow_limit: integer  # Per new agent
```

**Capacity impact curve:**

```
Day 0 to hire_start_day: capacity unchanged

During ramp_up (hire_start_day to hire_start_day + ramp_up_weeks × 7):
  additional_capacity[t] = count × max_capacity × s_curve(t, ramp_start, ramp_duration)
  
  WHERE s_curve(t, start, duration):
    x = (t - start) / duration    # 0 to 1
    return 3x² - 2x³               # S-curve: slow start, faster middle, plateau

After ramp_up:
  additional_capacity = count × max_capacity  # Full productivity
```

**Downstream effects:**
- `utilization_pct` decreases as capacity increases
- If utilization was above warning threshold → pressure relief projected
- `coverage_map` updated: new agent covers their specialization domain
- `gate_pass_rate` may improve slightly as overloaded agents have more time per workflow

### Scenario 02: Attrition / Departure

One or more agents leave. May be planned (resignation) or unplanned (sudden).

**Model inputs:**
```yaml
inputs:
  agent_ids: [string]              # Agents departing
  departure_day: integer
  notice_period_days: integer      # Agent's effectiveness during notice period
  knowledge_transfer_pct: float    # How much knowledge is transferred before leaving
```

**Capacity impact:**
```
From departure_day:
  unit.capacity -= sum(departing_agents.concurrent_workflow_limit)
  
  # If utilization was near limit before:
  new_utilization = unit.active_workflows / new_capacity
  
  IF new_utilization > 1.0:
    overflow = unit.active_workflows - new_capacity
    workflows_to_block_or_reassign = overflow
```

**Coverage impact:**
```
FOR EACH departing_agent:
  FOR EACH workflow_type in agent.coverage_domains:
    remaining_coverage = [agents still covering this type]
    
    IF len(remaining_coverage) == 0:
      → CRITICAL COVERAGE GAP: [workflow_type] uncovered
    IF len(remaining_coverage) == 1:
      → COVERAGE RISK: Single point of failure for [workflow_type]
```

**Knowledge transfer effect:**
```
# Partial knowledge transfer reduces productivity loss
transferred_capability = departing_agent.performance × knowledge_transfer_pct
added_to_remaining_agents = distribute(transferred_capability, remaining_coverage)
```

### Scenario 03: Hiring Freeze

No new agents can be hired for a specified period. Existing agents handle growing workload.

**Model inputs:**
```yaml
inputs:
  freeze_start_day: integer
  freeze_end_day: integer
  pre_freeze_hiring_pipeline: [{ role: string, planned_hire_day: integer, count: integer }]
```

**Impact:**
```
# Cancel all planned hires that fall within freeze window
for each planned_hire in pre_freeze_hiring_pipeline:
  IF planned_hire_day in [freeze_start, freeze_end]:
    capacity_lost += planned_hire.count × avg_capacity_per_agent
    
# If workflow volume grows during freeze:
FOR t in freeze_window:
  utilization[t] = active_workflows[t] / frozen_capacity
  
  IF utilization[t] > 0.85:
    lead_time_multiplier[t] = queuing_delay_factor(utilization[t])
    throughput[t] = baseline_throughput × (1 - congestion_factor(utilization[t]))
```

### Scenario 04: Reorg

Agents move between units. Includes a productivity dip during transition.

**Model inputs:**
```yaml
inputs:
  reorg_type: "team_split | team_merge | agent_transfer | reporting_change"
  moves: [{ agent_id: string, from_unit: string, to_unit: string }]
  reorg_start_day: integer
  transition_duration_weeks: integer  # How long the chaos lasts
  cultural_fit_factor: float         # 0.5-1.0 — higher = smoother transition
```

**Reorg productivity curve:**
```
productivity_during_reorg(t):
  phase = (t - reorg_start) / (transition_duration_weeks × 7)
  
  IF phase < 0: return 1.0                      # Pre-reorg: normal
  IF phase < 0.5: return 1.0 - phase × 0.4 × (1/cultural_fit_factor)
    # First half: productivity drops — up to 40% depending on cultural fit
  IF phase < 1.0: return 0.80 + (phase - 0.5) × 0.4 × cultural_fit_factor
    # Second half: productivity recovers
  ELSE: return MIN(1.0, 0.90 + (phase - 1.0) × 0.1)
    # Post-reorg: gradual return to baseline (may exceed if reorg was improvement)
```

---

## Capacity Projection Output

```yaml
StaffingSimulationResult:
  # Per-unit capacity trajectories
  unit_trajectories:
    "[unit_id]":
      # Snapshot at key intervals (days 0, 30, 60, 90)
      capacity_at_day_0: float
      capacity_at_day_30_p50: float
      capacity_at_day_60_p50: float
      capacity_at_day_90_p50: float
      
      utilization_at_day_0: float
      utilization_at_day_30_p50: float
      utilization_at_day_60_p50: float
      utilization_at_day_90_p50: float
      
      peak_utilization: float
      peak_utilization_day: integer
      
      overload_probability: float      # P(utilization > 0.90) at any point
  
  # Coverage assessment
  coverage_changes:
    new_gaps: [{ workflow_type: string, onset_day: integer, severity: string }]
    gap_resolutions: [{ workflow_type: string, resolution_day: integer }]
    persistent_risks: [{ workflow_type: string, remaining_coverage_count: integer }]
  
  # Throughput impact
  throughput_impact:
    baseline_steps_per_day: float
    min_steps_per_day_p50: float
    min_steps_per_day_day: integer
    recovery_to_baseline_day: integer | null  # null if capacity never recovers
    total_workflow_delay_days: float          # Cumulative delay across all workflows
  
  # Summary
  capacity_adequacy: "COMFORTABLE | ADEQUATE | TIGHT | INSUFFICIENT | CRITICAL"
  recommendation: string
```

---

## Staffing Sensitivity Analysis

Run automatically as part of staffing simulations to identify critical thresholds:

```
SWEEP:
  vary: ramp_up_weeks from 2 to 12 (for hiring scenarios)
  vary: knowledge_transfer_pct from 0.0 to 1.0 (for departure scenarios)
  vary: transition_duration_weeks from 2 to 12 (for reorg scenarios)

FOR EACH value:
  Run simulation
  Record: peak_utilization, coverage_gap_count, throughput_min

IDENTIFY:
  critical_ramp_threshold: ramp_up_weeks where utilization exceeds 0.90
  knowledge_transfer_minimum: minimum pct to avoid coverage gaps
  max_safe_reorg_size: number of agents that can move without critical coverage loss
```

---

## Integration

**Called by:** `simulation-systems/org-simulator.md`
**Reads from:**
- `digital-twins/org-twin.md` (frozen snapshot)
- `enterprise-modeling/org-model.md` (capacity formulas, coverage model)

**Returns:** `StaffingSimulationResult` to org-simulator
