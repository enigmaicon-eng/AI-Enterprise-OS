# Organizational State Model

**System ID:** `org-model`
**Role:** Canonical schema definitions for all organizational state data used across the digital twin and simulation systems — the shared vocabulary for org-level computations
**Used by:** `digital-twins/org-twin.md`, `simulation-systems/org-simulator.md`, all org-touching simulations

---

## Purpose

The org-model defines the data types, constraints, and derived formulas that all organizational calculations must use. It prevents each simulation from inventing its own capacity formula or health score, ensuring results from different systems are comparable.

---

## Core Entity Schemas

### OrgUnit

The fundamental organizational building block:

```yaml
OrgUnit:
  unit_id: string                    # "[org-name]-org"
  display_name: string               # Human-readable label
  parent_unit_id: string | null      # For hierarchy modeling
  unit_type: "functional | cross_functional | executive | specialist"
  trust_tier_range: [1, 5]           # Min-max tier for agents in this unit
  
  # Agent composition
  agent_count: integer               # Total agents in unit
  active_agent_count: integer        # Agents with assigned workflows
  
  # Capacity model
  capacity:
    max_concurrent_workflows: integer   # Theoretical max (sum across agents)
    max_concurrent_steps: integer       # Theoretical max steps simultaneously
    effective_capacity_factor: float    # 0.7-0.9 — practical fraction of theoretical
    # Effective capacity = max_concurrent_workflows × effective_capacity_factor
  
  # Health bounds (unit-type specific thresholds)
  health_thresholds:
    utilization_warning: 0.80          # Flag if above this
    utilization_critical: 0.90         # Alert if above this
    gate_pass_rate_minimum: 0.80       # Flag if below this
    escalation_rate_maximum: 0.10      # Flag if above this (escalations per workflow)
```

### AgentState

State of an individual agent:

```yaml
AgentState:
  agent_id: string
  agent_role: string                  # From agent definition YAML frontmatter
  unit_id: string
  trust_tier: integer                 # 1-5
  
  # Load state
  concurrent_workflow_limit: integer  # Max workflows this agent handles simultaneously
  active_workflow_count: integer      # Currently assigned
  active_step_count: integer          # Steps currently executing
  
  # Derived utilization
  utilization_pct: float              # active_workflow_count / concurrent_workflow_limit
  load_state: "IDLE | NORMAL | LOADED | OVERLOADED"
  # IDLE: utilization < 0.10
  # NORMAL: 0.10 ≤ utilization < 0.80
  # LOADED: 0.80 ≤ utilization < 1.00
  # OVERLOADED: utilization ≥ 1.00
  
  # Specialization
  primary_workflow_types: [string]    # Workflow types this agent most frequently handles
  coverage_domains: [string]          # What this agent covers (for coverage gap analysis)
  
  # Performance profile
  performance_profile:
    avg_gate_pass_rate: float         # Historical gate pass rate
    avg_step_duration_minutes: float  # Historical avg step duration
    escalation_rate: float            # Escalations per workflow
    delegation_success_rate: float    # Fraction of delegations that succeed
```

### WorkloadUnit

Quantified work item in the org context:

```yaml
WorkloadUnit:
  workflow_id: string
  workflow_type: string
  assigned_to_unit: string
  assigned_to_agent: string | null
  
  effort_estimate_points: integer     # Story-point equivalent
  status: "QUEUED | IN_PROGRESS | BLOCKED | COMPLETE"
  priority: "CRITICAL | HIGH | MEDIUM | LOW"
  
  # Time tracking
  queued_at: datetime
  started_at: datetime | null
  completed_at: datetime | null
  blocked_since: datetime | null
  
  # Load contribution
  load_contribution: float            # Fraction of agent's capacity this consumes
```

---

## Capacity Model

### Theoretical Capacity

```
unit_theoretical_capacity = SUM(agent.concurrent_workflow_limit for agent in unit.agents)
```

### Effective Capacity

```
unit_effective_capacity = unit_theoretical_capacity × unit.effective_capacity_factor

# effective_capacity_factor accounts for:
#   - Context switching overhead between workflows
#   - Administrative and coordination overhead
#   - Buffer for urgent/unplanned work
#
# Recommended values by unit type:
#   functional: 0.80
#   cross_functional: 0.75  (higher coordination overhead)
#   executive: 0.70         (higher interrupt rate)
#   specialist: 0.85        (more focused, less interruption)
```

### Utilization

```
unit_utilization_pct = unit.active_workflow_count / unit_effective_capacity

# Thresholds:
#   < 0.40: UNDERLOADED — capacity is not being used
#   0.40 - 0.79: NORMAL — healthy utilization range
#   0.80 - 0.89: WARNING — approaching capacity
#   0.90 - 1.00: CRITICAL — at or near capacity
#   > 1.00: OVERLOADED — beyond capacity
```

### Available Capacity

```
available_capacity = unit_effective_capacity - unit.active_workflow_count
available_for_new_work = MAX(0, available_capacity - unit.queued_workflow_count)
```

---

## Health Score Model

### Unit Health Score (0-100)

```
unit_health_score = (
  capacity_health_score  × 0.30 +
  quality_health_score   × 0.30 +
  velocity_health_score  × 0.20 +
  governance_health_score × 0.20
)
```

#### Capacity Health Score (0-100)

```
IF utilization_pct ≤ 0.40:
  capacity_health_score = 60   # Underloaded — not ideal but not unhealthy
ELSE IF 0.40 < utilization_pct ≤ 0.80:
  capacity_health_score = 100  # Ideal range
ELSE IF 0.80 < utilization_pct ≤ 0.90:
  capacity_health_score = 100 - ((utilization_pct - 0.80) / 0.10) × 50  # 100 → 50
ELSE IF 0.90 < utilization_pct ≤ 1.00:
  capacity_health_score = 50 - ((utilization_pct - 0.90) / 0.10) × 50   # 50 → 0
ELSE:  # > 1.00 (overloaded)
  capacity_health_score = 0
```

#### Quality Health Score (0-100)

```
quality_health_score = gate_pass_rate × 100

# Note: gate_pass_rate is the fraction of gate checks passing on first attempt
# (not the fraction eventually passing after retries)
```

#### Velocity Health Score (0-100)

```
velocity_ratio = steps_per_hour_actual / steps_per_hour_baseline

IF velocity_ratio ≥ 1.00: velocity_health_score = 100
IF velocity_ratio ≥ 0.80: velocity_health_score = 100 × velocity_ratio
IF velocity_ratio < 0.80:  velocity_health_score = MAX(0, velocity_ratio × 100 - 20)
```

#### Governance Health Score (0-100)

```
governance_health_score = (
  (1 - gate_bypass_rate) × 100 × 0.40 +
  (1 - MIN(1, escalation_rate × 2)) × 100 × 0.30 +
  decision_velocity_score × 0.30
)

WHERE:
  decision_velocity_score = MAX(0, 100 - (avg_decision_time_hours - 2) × 5)
  # Full score if decisions take ≤ 2 hours; -5 points per additional hour
```

---

## Coverage Gap Model

Identifies single points of failure in agent coverage:

```
FOR EACH workflow_type in [all workflow types]:
  agents_covering = [agents who have handled this workflow_type in last 30 days]
  
  IF len(agents_covering) == 0:
    → COVERAGE GAP: No agent has handled [workflow_type] recently
    → severity: CRITICAL
  
  IF len(agents_covering) == 1:
    → COVERAGE RISK: Only [agent_id] covers [workflow_type]
    → severity: HIGH
    → risk: "If [agent_id] is unavailable, [workflow_type] cannot be executed"
  
  IF len(agents_covering) == 2:
    → COVERAGE THIN: Only 2 agents cover [workflow_type]
    → severity: MEDIUM
```

---

## Staffing Change Impact Model

Used by staffing-simulator.md to evaluate scenario perturbations:

### Add Agent

```
INPUT: unit_id, agent_role, start_date, ramp_up_weeks

IMPACT on unit:
  theoretical_capacity += agent.concurrent_workflow_limit
  effective_capacity += agent.concurrent_workflow_limit × effective_capacity_factor
  
  # Ramp-up effect: new agent at partial capacity for ramp_up_weeks
  ramp_multiplier(week) = MIN(1.0, week / ramp_up_weeks)
  effective_capacity_during_ramp = agent.concurrent_workflow_limit × ramp_multiplier(week)
```

### Remove Agent

```
INPUT: agent_id

IMPACT on unit:
  theoretical_capacity -= agent.concurrent_workflow_limit
  effective_capacity -= agent.concurrent_workflow_limit × effective_capacity_factor
  
  # Redistribution: active workflows must go somewhere
  workflows_to_redistribute = agent.active_workflow_count
  available_capacity_in_unit = unit.effective_capacity - unit.active_workflow_count
  
  IF workflows_to_redistribute > available_capacity_in_unit:
    → overflow = workflows_to_redistribute - available_capacity_in_unit
    → These workflows must either wait (queue) or go to other units
```

### Reorg

```
INPUT: move_agents[{agent_id, from_unit, to_unit}]

IMPACT:
  FOR EACH move:
    from_unit.capacity -= agent.concurrent_workflow_limit × effective_capacity_factor
    to_unit.capacity   += agent.concurrent_workflow_limit × effective_capacity_factor
    
    # Coverage impact
    Update coverage map: agent's workflow_types now covered in to_unit, not from_unit
```

---

## Escalation Model

```yaml
EscalationRecord:
  escalation_id: string
  workflow_id: string
  blocking_unit: string              # Which unit's decision is needed
  escalated_to: string              # agent-id or "HUMAN"
  escalation_type: "gate_fail | human_decision | conflict | resource"
  severity: "CRITICAL | HIGH | MEDIUM | LOW"
  
  opened_at: datetime
  target_resolution_hours: integer   # SLA by severity
  actual_resolution_hours: float | null
  
  # Impact modeling
  workflows_blocked: integer        # Count of workflows waiting on this
  estimated_delay_hours: float      # If unresolved, expected delay per blocked workflow
  cascade_risk: boolean             # Can this escalation cause others?
```

### Escalation Resolution SLAs

| Severity | Target Resolution | Escalation Path |
|----------|------------------|-----------------|
| CRITICAL | 2 hours | Immediate human notification |
| HIGH | 8 hours | Supervisor agent, then human |
| MEDIUM | 24 hours | Supervisor agent |
| LOW | 72 hours | Queue for next review |

---

## Integration

**Used by:**
- `digital-twins/org-twin.md` → state storage and health computation
- `simulation-systems/org-simulator.md` → simulation model
- `simulation-systems/staffing-simulator.md` → capacity impact calculations
- `simulation-systems/governance-simulator.md` → governance health model
- `simulation-systems/escalation-simulator.md` → escalation model
- `predictive-intelligence/org-forecaster.md` → health forecasting formulas
