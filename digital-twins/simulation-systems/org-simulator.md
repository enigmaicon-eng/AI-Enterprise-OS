# Organizational Simulator

**System ID:** `org-simulator`
**Role:** Coordinates and executes all organizational simulations — staffing, governance, escalation, and restructuring — producing probability-weighted assessments of org health under different conditions
**Handles:** Scenarios with class: "staffing | governance | org_restructure"

---

## Purpose

The org-simulator is the coordination layer for all organizational-domain simulations. It takes org-related scenarios, routes sub-computations to specialized simulators (staffing-simulator, governance-simulator, escalation-simulator), synthesizes results, and produces a unified org simulation outcome.

It is the system that answers: "What does our organization look like in 90 days if we take action X?"

---

## Simulation Mandate Types

| Mandate | Key Question | Primary Sub-Simulators |
|---------|-------------|------------------------|
| Staffing impact | How does headcount change affect capacity and delivery? | staffing-simulator |
| Org restructure | How does a reorg affect throughput and quality? | staffing-simulator, workflow-simulator |
| Governance change | How does policy change affect velocity and compliance? | governance-simulator |
| Escalation surge | What happens if escalation rate doubles? | escalation-simulator |
| Capacity stress test | At what volume does the org break? | staffing-simulator, runtime-load-simulator |
| Coverage gap analysis | What single points of failure exist? | org-model.md coverage gap model |

---

## Org Simulation Protocol

### STEP 01: Load Org Twin Snapshot

```
READ: org-twin snapshot (frozen by simulation-engine)
VERIFY: snapshot contains all required fields for this simulation class
EXTRACT: baseline metrics for comparison
```

### STEP 02: Parse Org Perturbations

```
FROM scenario.perturbations WHERE target_twin == "org-twin":
  CLASSIFY:
    - staffing_perturbations → route to staffing-simulator.md
    - governance_perturbations → route to governance-simulator.md
    - escalation_perturbations → route to escalation-simulator.md
    - structural_perturbations → handle here (team merges, splits)
```

### STEP 03: Run Sub-Simulations in Sequence

Sub-simulations run in dependency order (staffing affects governance affects escalation):

```
1. Run staffing-simulator → produces: capacity_trajectory, coverage_map
2. Apply capacity_trajectory to perturbed org-twin state
3. Run governance-simulator → produces: decision_velocity, policy_adherence_trajectory
4. Apply governance outputs to org state
5. Run escalation-simulator → produces: escalation_rate_trajectory, cascade_risk
6. Apply escalation outputs to org state

At each step, the org state accumulates all perturbation effects.
```

### STEP 04: Compute Org Health Trajectory

Using the accumulated perturbed state, compute health score over time:

```
FOR EACH time_step t in [0, T]:
  org_health[t] = compute_org_health_score(
    perturbed_state.capacity_utilization[t],
    perturbed_state.gate_pass_rate[t],
    perturbed_state.velocity[t],
    perturbed_state.governance_score[t]
  )

# Health score formula from enterprise-modeling/org-model.md
```

### STEP 05: Identify Inflection Points

Detect when health crosses important thresholds:

```
FOR EACH threshold in [80, 70, 60, 50]:
  IF org_health crosses below threshold at time T:
    RECORD: inflection_point(threshold, T, cause)
    
  IF org_health recovers above threshold at time T:
    RECORD: recovery_point(threshold, T)
```

### STEP 06: Generate Org Simulation Result

```yaml
OrgSimulationResult:
  # Health trajectory
  health_trajectory:
    t_0_score: float              # Baseline health score
    t_30d_score_p50: float        # 30-day forecast (median)
    t_60d_score_p50: float
    t_90d_score_p50: float
    
    min_health_p50: float         # Worst point in 90 days
    min_health_onset_days: integer # When worst point occurs
    
    health_recovers_by_day: integer | null  # Days until health recovers to baseline
  
  # Capacity assessment
  capacity_assessment:
    current_utilization_pct: float
    peak_utilization_p50: float   # Worst expected utilization
    peak_utilization_onset_days: integer
    overload_probability: float   # P(utilization > 0.90)
    unit_specific_risks:
      - unit_id: string
        risk: string
        probability: float
  
  # Coverage assessment
  coverage_assessment:
    new_coverage_gaps: [string]       # Workflow types losing coverage
    existing_coverage_risks: [string] # Existing thin coverage made worse
    coverage_gap_severity: "NONE | LOW | MEDIUM | HIGH | CRITICAL"
  
  # Escalation forecast
  escalation_forecast:
    escalation_rate_p50: float       # Expected escalation rate
    escalation_surge_probability: float
    cascade_risk: boolean
  
  # Summary
  net_org_impact: "POSITIVE | NEUTRAL | NEGATIVE | MIXED"
  confidence: "HIGH | MEDIUM | LOW"
  key_risks: [string]
  key_opportunities: [string]
```

---

## Org-Specific Dynamics

The org-simulator implements org-level dynamics not covered by the generic simulation engine:

### Reorg Transition Overhead

When a restructuring perturbation is applied:

```
# Reorgs cause temporary productivity dip
reorg_overhead(t, reorg_start_day, reorg_duration_weeks):
  days_into_reorg = t - reorg_start_day
  
  IF days_into_reorg < 0: return 1.0  # Before reorg: no impact
  
  IF days_into_reorg < reorg_duration_weeks × 7:
    # Ramp-down phase: productivity drops linearly
    productivity_factor = 1.0 - (days_into_reorg / (reorg_duration_weeks × 7)) × 0.3
    return productivity_factor
  
  ELSE:
    # Recovery phase: productivity returns over equal time
    recovery_progress = (days_into_reorg - reorg_duration_weeks × 7) / (reorg_duration_weeks × 7)
    productivity_factor = 0.70 + recovery_progress × 0.30
    return MIN(1.0, productivity_factor)
```

### Coverage Gap Propagation

When agents are removed and coverage gaps open:

```
FOR EACH workflow_type losing coverage:
  affected_workflows = active_workflows of that type
  
  FOR EACH affected_workflow:
    IF no remaining agent has coverage:
      workflow.status = "BLOCKED"
      workflow.blocked_days += 1
    ELSE:
      # Reassign to next-best-fit agent
      delay = reassignment_overhead_days  # 0.5 to 3 days depending on complexity
      workflow.delay_days += delay
```

### New Agent Ramp-Up

When new agents are added:

```
ramp_capacity(agent, t, ramp_up_weeks):
  IF t < hire_start_day: return 0
  
  days_since_hire = t - hire_start_day
  ramp_weeks = days_since_hire / 7
  
  IF ramp_weeks < ramp_up_weeks:
    # S-curve ramp: slow at first, faster in middle, slowing at end
    progress = ramp_weeks / ramp_up_weeks
    capacity_fraction = 3 × progress² - 2 × progress³  # S-curve formula
    return agent.concurrent_workflow_limit × capacity_fraction
  
  ELSE:
    return agent.concurrent_workflow_limit  # Fully ramped
```

---

## Integration

**Called by:** `simulation-systems/simulation-engine.md`
**Calls:**
- `simulation-systems/staffing-simulator.md`
- `simulation-systems/governance-simulator.md`
- `simulation-systems/escalation-simulator.md`

**Reads from:**
- `digital-twins/org-twin.md` (snapshot)
- `enterprise-modeling/org-model.md` (formulas)

**Returns to:** `simulation-engine.md` → OrgSimulationResult
