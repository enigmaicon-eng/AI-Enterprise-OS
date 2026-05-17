# Coordination Simulator

**System ID:** `coordination-simulator`
**Role:** Simulates cross-team and cross-agent coordination — handoff quality, dependency resolution timing, communication overhead, and coordination failure cascades
**Handles:** Scenarios involving multi-org workflows, cross-team dependencies, parallel track coordination

---

## Purpose

Enterprise work is never done by a single agent. Feature development touches PM, Architecture, Engineering, and QA. Each handoff is a coordination point that can succeed cleanly or fail with delay. The coordination simulator models the aggregate effect of coordination quality on enterprise delivery.

It answers: "How much of our lead time is coordination overhead, and what would happen to delivery speed if we improved (or degraded) cross-team handoff quality by X%?"

---

## Coordination Model

### Types of Coordination

| Type | Example | Overhead Source |
|------|---------|----------------|
| Sequential handoff | PM → Architect → Engineer | Handoff package quality, context loss |
| Parallel convergence | Eng track + QA track → merge | Synchronization wait, merge conflicts |
| Cross-dependency | Feature A needs B's API | Dependency blocking, signaling delay |
| Review coordination | Agent → Supervisor → Agent | Review queue wait, clarification rounds |
| Escalation routing | Agent → Escalation → Human → Agent | Human availability, context-setting overhead |

### Handoff Quality Model

```
handoff_quality: 0.0 to 1.0

# A perfect handoff (1.0):
#   - Complete artifact with all required sections
#   - Clear instructions for next agent
#   - All dependencies verified
#   - Context summary included
#   → Receiving agent can start immediately with full context

# A poor handoff (0.3):
#   - Incomplete artifact
#   - Vague instructions
#   - Unverified dependencies
#   → Receiving agent spends time seeking clarification before starting

clarification_rounds = MAX(0, (1 - handoff_quality) × max_clarification_rounds)
clarification_delay_hours = clarification_rounds × avg_clarification_round_hours

# Clarification rounds have geometric decay:
# If quality = 0.70: ~1 clarification round
# If quality = 0.50: ~2 rounds
# If quality = 0.30: ~3-4 rounds
```

### Parallel Track Synchronization

When two parallel tracks must converge (join step):

```
# Both tracks must complete before join can start
join_delay = MAX(0, slower_track_completion_time - faster_track_completion_time)

# If tracks have different expected durations:
track_A_completion_p50: float
track_B_completion_p50: float

expected_join_delay = E[MAX(track_A, track_B)] - MIN(E[track_A], E[track_B])

# With uncertainty (Monte Carlo):
FOR each iteration:
  track_A_actual = sample(track_A_distribution)
  track_B_actual = sample(track_B_distribution)
  join_time = MAX(track_A_actual, track_B_actual)
  merge_overhead = merge_complexity_factor × merge_baseline_hours
  
# Key insight: If tracks have high variance, the expected wait for the slower one
# can be much larger than the median difference between them
```

### Cross-Team Dependency Resolution

When team A depends on team B's output:

```
dependency_delay_distribution:
  # Modeled as log-normal (most resolve quickly, some take very long)
  median_days: float                # Based on historical dependency resolution data
  std_dev_days: float               # High variance typical
  
  # Factors that increase delay:
  - B's team utilization (high util → slower response to dep requests)
  - Priority of dep relative to B's other work
  - Clarity of the dependency request
  - Organizational distance between teams (same team < same org < different org)

  # Organizational distance multiplier:
  same_team: 1.0
  same_org: 1.5
  different_org: 2.5
  external: 5.0
```

---

## Coordination Simulation Scenarios

### Scenario 01: Handoff Quality Degradation

What if cross-team handoffs get worse (e.g., less thorough context packages)?

```
INPUT:
  handoff_quality_delta: float      # -0.15 = quality drops from 0.80 to 0.65
  scope: "all | [specific agent pairs]"
  
COMPUTE:
  new_handoff_quality = baseline_quality + handoff_quality_delta
  
  new_clarification_rounds = (1 - new_handoff_quality) × 3  # max 3 rounds
  new_clarification_delay = new_clarification_rounds × 2    # 2 hours per round
  
  affected_handoffs_per_workflow = avg_cross_team_handoffs_per_workflow
  additional_delay_per_workflow = (new_clarification_delay - baseline_delay) × affected_handoffs
  
  total_lead_time_increase_pct = additional_delay_per_workflow / baseline_lead_time
```

### Scenario 02: Cross-Team Dependency Delay

Key dependency team is overwhelmed; dependencies take longer to resolve:

```
INPUT:
  dependency_team: string           # The team that is the dependency provider
  resolution_time_multiplier: float # 2.0 = takes twice as long

COMPUTE:
  new_resolution_days = baseline_resolution_days × multiplier
  
  # Workflows depending on this team
  affected_workflows = workflows_with_dependency_on(dependency_team)
  
  FOR EACH affected_workflow:
    IF workflow.dependency_status == "WAITING":
      additional_delay = (new_resolution_days - baseline_resolution_days)
      workflow.expected_completion += additional_delay
      workflow.at_risk = True
  
  cascade_to_release: check if any at_risk workflows are on critical path
```

### Scenario 03: Parallel Track Imbalance

What if one track in a parallel workflow consistently runs longer than expected?

```
INPUT:
  track_id: string                  # The slow track
  duration_multiplier: float        # 1.5 = track takes 50% longer

COMPUTE:
  new_track_A_duration = baseline_A × multiplier
  baseline_B_duration: float        # B unchanged
  
  # Parallel: join waits for the slower track
  baseline_join_wait = E[MAX(A, B)] - E[MIN(A, B)]  # Expected wait for slower track
  new_join_wait = E[MAX(new_A, B)] - E[MIN(new_A, B)]
  
  join_delay_increase = new_join_wait - baseline_join_wait
  
  # High variance amplifies the delay effect non-linearly
  # If both tracks have high std_dev, the delay increase is larger than the median suggests
```

### Scenario 04: Communication Overhead Increase

What if coordination requires more communication rounds (e.g., org complexity increases)?

```
INPUT:
  communication_overhead_factor: float  # 1.3 = 30% more back-and-forth

COMPUTE:
  # Every handoff, review, and clarification takes longer
  new_coordination_overhead = baseline_coordination_overhead × factor
  
  # Fraction of total cycle time that is coordination
  coordination_fraction = coordination_time / total_cycle_time
  
  new_cycle_time = total_cycle_time × (1 + (factor - 1) × coordination_fraction)
  
  # Non-workflow time (meetings, status updates, planning) also increases
  non_workflow_overhead_increase = factor × baseline_non_workflow_overhead
  agent_effective_capacity -= non_workflow_overhead_increase
```

---

## Coordination Overhead Analysis

Baseline coordination overhead breakdown (from workflow-twin):

```yaml
coordination_overhead_analysis:
  total_lead_time_hours: float
  
  # Breakdown of where time goes
  active_execution_hours: float          # Time actually executing steps
  handoff_overhead_hours: float          # Time setting up and executing handoffs
  clarification_rounds_hours: float      # Time spent seeking clarification
  dependency_wait_hours: float           # Time waiting for dependencies
  review_wait_hours: float               # Time waiting for reviews/approvals
  synchronization_wait_hours: float      # Parallel track synchronization delays
  
  # Fractions
  coordination_fraction: float           # (total - active) / total
  
  # Improvement potential
  max_improvement_if_perfect_coordination: float  # How much time could be saved
  realistic_improvement_target: float             # With achievable improvements
```

---

## Coordination Simulation Output

```yaml
CoordinationSimulationResult:
  # Handoff quality impact
  handoff_impact:
    baseline_clarification_rounds: float
    new_clarification_rounds_p50: float
    additional_delay_per_workflow_hours: float
    lead_time_change_pct: float
  
  # Dependency chain impact
  dependency_impact:
    workflows_affected: integer
    avg_additional_delay_days: float
    critical_path_affected: boolean
    release_at_risk: boolean
  
  # Parallel track impact
  parallel_track_impact:
    baseline_synchronization_delay_hours: float
    new_synchronization_delay_hours_p50: float
    join_delay_increase_hours: float
    variance_amplification_factor: float    # How much uncertainty increased join delay
  
  # Overall coordination efficiency
  coordination_efficiency:
    baseline_coordination_fraction: float
    new_coordination_fraction_p50: float
    coordination_overhead_change_pct: float
    flow_efficiency_change: float
  
  # Net impact
  total_lead_time_change_days_p50: float
  total_throughput_change_pct: float
  coordination_health: "EFFICIENT | ADEQUATE | OVERHEAD | DEGRADED"
  recommendation: string
```

---

## Integration

**Called by:** `simulation-systems/simulation-engine.md`
**Reads from:**
- `digital-twins/org-twin.md` (team structures, escalation patterns)
- `digital-twins/workflow-twin.md` (handoff patterns, parallel track data)

**Returns:** `CoordinationSimulationResult`
