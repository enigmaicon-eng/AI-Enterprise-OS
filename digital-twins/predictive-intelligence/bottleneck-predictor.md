# Bottleneck Predictor

**System ID:** `bottleneck-predictor`
**Role:** Predicts where the enterprise will get stuck before it happens — detecting bottleneck onset signals across org, workflow, delivery, and runtime dimensions; quantifying onset probability and time-to-impact
**Output:** Bottleneck onset predictions with probability, estimated time-to-impact, location, and recommended preemptive actions

---

## Purpose

Bottlenecks are always visible in hindsight. The bottleneck predictor makes them visible in advance. It monitors leading indicators across all four twins and identifies when a resource, process, or system is approaching saturation — days or weeks before throughput collapses. A bottleneck identified at 70% saturation is actionable; one identified at 100% is a crisis.

**Core principle:** Every bottleneck has precursors. Find the precursors.

---

## Bottleneck Classes

| Class | Location | Leading Indicators | Lead Time |
|-------|----------|-------------------|-----------|
| Capacity bottleneck | Org unit | utilization > 0.80 + trend | 7-21 days |
| Gate bottleneck | Workflow phase | gate_cycle_time increasing, retry_rate rising | 3-10 days |
| Escalation bottleneck | Escalation system | arrival_rate / resolver_capacity trending to ρ > 0.85 | 3-14 days |
| Dependency bottleneck | Delivery pipeline | critical path float shrinking, at-risk dependencies growing | 7-21 days |
| Context bottleneck | Runtime | context_pressure_index > 0.60 + trend | 1-3 days |
| Tool budget bottleneck | Runtime | tool_budget_exhaustion_rate > 0.15 + trend | 1-2 days |
| Orchestration bottleneck | Orchestration layer | routing_latency increasing, delegation chain depth > 3 | 1-5 days |
| WIP/Queue bottleneck | Workflow pipeline | arrival_rate > throughput_rate sustained | 3-14 days |

---

## Bottleneck Detection Protocol

### PHASE 01: Collect Leading Indicators

```
FOR each bottleneck class:
  
  LOAD twin state relevant to this class
  EXTRACT current values for all leading indicators in this class
  COMPUTE 7-day trend for each indicator
  CHECK against warning thresholds
```

### PHASE 02: Saturation Model per Class

For each class, model the trajectory toward saturation:

```
saturation_model(class):
  
  # Extract current saturation level (0.0 = empty, 1.0 = fully saturated)
  current_saturation = class.compute_saturation_level()
  
  # Extract saturation trend (change per day)
  saturation_trend = class.compute_saturation_trend()
  
  # Time to saturation threshold (0.85 = warning, 1.0 = critical)
  IF saturation_trend > 0:
    days_to_warning  = (0.85 - current_saturation) / saturation_trend
    days_to_critical = (1.00 - current_saturation) / saturation_trend
  ELSE:
    days_to_warning  = NULL  # Not trending toward saturation
    days_to_critical = NULL
  
  # Onset probability: probability of reaching critical within horizon
  # Accounts for uncertainty in trend (trend may not hold perfectly)
  trend_volatility = STDEV(daily_saturation_changes in history)
  
  FOR horizon in [7, 14, 30]:
    projected_saturation = current_saturation + saturation_trend × horizon
    uncertainty = trend_volatility × SQRT(horizon)
    z = (1.0 - projected_saturation) / uncertainty
    onset_probability[horizon] = 1 - CDF_NORMAL(z)  # P(reaches critical within horizon)
```

### PHASE 03: Cross-Twin Amplification Detection

Some bottlenecks amplify each other — a compound bottleneck is worse than the sum of its parts:

```
AMPLIFICATION PATTERNS:

Pattern A: Capacity → Gate → Escalation cascade
  IF capacity_saturation > 0.80 AND gate_retry_rate > 1.5:
    → Overloaded team rushes work → more gate failures → more escalations → more load
    amplification_factor = 1.0 + (capacity_saturation - 0.80) × 3.0
    compound_risk = "HIGH"

Pattern B: WIP → Lead time → Delivery miss cascade
  IF wip_growth_rate > 0 AND flow_efficiency < 0.60:
    → Growing queue + slow flow → lead time explodes → delivery dates slip → more pressure
    amplification_factor = 1.0 / (1 - wip_utilization)  # Little's Law amplifier
    compound_risk = "HIGH"

Pattern C: Context → Tool budget → Recovery cascade
  IF context_pressure > 0.70 AND tool_budget_exhaustion_rate > 0.10:
    → Sessions approaching context limit → more compactions → tool budget used on recovery
    → Less budget for productive work → more failures → more recovery → feedback loop
    amplification_factor = 1.0 + recovery_overhead_fraction × 2.0
    compound_risk = "CRITICAL"

Pattern D: Dependency → Critical path → Release delay cascade
  IF at_risk_dependencies > 2 AND critical_path_float < 3:
    → Multiple at-risk items on or near critical path → any one slip delays release
    amplification_factor = critical_path_sensitivity × at_risk_count
    compound_risk = "HIGH"

FOR each detected amplification pattern:
  compound_bottleneck_risk = MAX(constituent_risks) × amplification_factor
```

### PHASE 04: Onset Probability Scoring

```
FOR each detected bottleneck:
  
  # Base onset probability from saturation model
  base_probability = onset_probability[14]  # 14-day horizon as standard
  
  # Amplification adjustment
  IF bottleneck in compound_pattern:
    adjusted_probability = MIN(1.0, base_probability × amplification_factor)
  ELSE:
    adjusted_probability = base_probability
  
  # Confidence in prediction
  data_quality = twin.data_quality_for_class(bottleneck.class)
  trend_consistency = trend_r_squared  # From linear regression
  
  IF data_quality > 0.90 AND trend_consistency > 0.80:
    confidence = "HIGH"
  ELIF data_quality > 0.70 AND trend_consistency > 0.60:
    confidence = "MEDIUM"
  ELSE:
    confidence = "LOW"
  
  # Urgency classification
  IF adjusted_probability > 0.80 AND days_to_critical < 48:   urgency = "IMMEDIATE"
  IF adjusted_probability > 0.60 AND days_to_critical < 7:    urgency = "HIGH"
  IF adjusted_probability > 0.40 AND days_to_critical < 30:   urgency = "MEDIUM"
  ELSE:                                                          urgency = "MONITOR"
```

---

## Per-Class Detection Models

### Capacity Bottleneck

```
INPUTS from org-twin:
  utilization_by_unit = [unit.utilization_pct for unit in org_twin.organizational_units]
  utilization_trend_by_unit = [unit.utilization_trend for unit in org_twin.organizational_units]
  capacity_theoretical = org_twin.org_health.org_capacity_theoretical

FOR each unit:
  saturation_level = unit.utilization_pct
  saturation_trend = unit.utilization_trend
  
  # Warning: utilization > 0.80 with positive trend
  IF saturation_level > 0.80 AND saturation_trend > 0.005/day:
    → CAPACITY BOTTLENECK SIGNAL
    days_to_saturation = (0.95 - saturation_level) / saturation_trend
    
  # Constraint: units near capacity block escalations routing to them
  IF unit.utilization_pct > 0.90:
    → ROUTING CONSTRAINT: escalations routed here will face delay
    routing_constraint_flag = True
```

### Gate Bottleneck

```
INPUTS from workflow-twin:
  gate_cycle_time_history = workflow_twin.gate_performance.avg_cycle_time_history
  gate_retry_rate_history = workflow_twin.gate_performance.retry_rate_history
  gate_fail_rate = workflow_twin.gate_performance.fail_rate_by_type

# Saturation: gate cycle time trending up = slower throughput
gate_cycle_time_trend = slope(gate_cycle_time_history.last(14))
gate_retry_rate_trend = slope(gate_retry_rate_history.last(14))

# Normalized saturation (current cycle time / max acceptable cycle time)
max_acceptable_cycle_time = gate_sla_target × 2.0
gate_saturation = current_avg_cycle_time / max_acceptable_cycle_time

# Compound signal: rising retries + rising cycle time = gate is the bottleneck
IF gate_retry_rate_trend > 0 AND gate_cycle_time_trend > 0:
  → GATE BOTTLENECK SIGNAL
  
  # Identify which gate type is the constraint
  bottleneck_gate_type = MAX(gate_fail_rate, key=lambda g: g.retry_rate × g.avg_cycle_time)
```

### Escalation Bottleneck

```
INPUTS from org-twin:
  lambda_trend = org_twin.escalation_state.arrival_rate_trend
  mu = org_twin.escalation_state.resolution_rate
  c = org_twin.escalation_state.active_resolvers
  current_rho = lambda / (c × mu)
  queue_depth_trend = org_twin.escalation_state.queue_depth_trend

# Saturation: rho approaching 1.0 (queuing theory: wait time → ∞ as rho → 1)
# Normalize: rho is already a saturation measure (0.0-1.0, critical at 0.90+)
escalation_saturation = current_rho

IF current_rho > 0.70 AND lambda_trend > 0:
  → ESCALATION BOTTLENECK SIGNAL
  
  # Projected rho at 7 days
  days_until_rho_09 = (0.90 - current_rho) / (lambda_trend / (c × mu))
```

### Dependency Bottleneck

```
INPUTS from delivery-twin:
  critical_path_float = delivery_twin.dependency_graph.critical_path_float_days
  at_risk_count = delivery_twin.dependency_graph.at_risk_dependencies
  at_risk_trend = delivery_twin.dependency_graph.at_risk_trend_7d
  critical_path_items = delivery_twin.dependency_graph.critical_path_items

# Saturation: critical path float approaching 0, at-risk count growing
dependency_saturation = 1 - (critical_path_float / release_total_duration)
at_risk_growth_rate = at_risk_trend  # Dependencies becoming at-risk per day

IF critical_path_float < 5 AND at_risk_count > 0:
  → DEPENDENCY BOTTLENECK SIGNAL
  
  # Risk concentration: many dependents behind a few at-risk items
  from dependency-simulator:
    bottleneck_nodes_top3 = dependency_analysis.bottleneck_nodes[:3]
    combined_bottleneck_score = SUM(b.bottleneck_score for b in bottleneck_nodes_top3)
```

### Context Bottleneck

```
INPUTS from runtime-twin:
  context_pressure_index = runtime_twin.context_consumption.context_pressure_index
  pressure_trend = runtime_twin.context_consumption.pressure_trend_24h
  compaction_events_24h = runtime_twin.context_consumption.compaction_events_24h
  sessions_hitting_limit_pct = runtime_twin.context_consumption.sessions_hitting_limit_pct

# Saturation: context pressure > 0.80 = near limit
context_saturation = context_pressure_index

IF context_pressure_index > 0.60 AND pressure_trend > 0.02/day:
  → CONTEXT BOTTLENECK SIGNAL
  
  # Compound: more sessions hitting limit → more compaction → quality degradation
  quality_impact = sessions_hitting_limit_pct × 0.20  # 20% quality penalty per 100% sessions at limit
  recovery_overhead_impact = compaction_events_24h × 0.05  # Each compaction uses budget
```

### Tool Budget Bottleneck

```
INPUTS from runtime-twin:
  exhaustion_rate = runtime_twin.tool_budget.budget_exhaustion_rate
  exhaustion_trend = runtime_twin.tool_budget.exhaustion_rate_trend_7d
  failed_calls_pct = runtime_twin.tool_budget.failed_calls_pct

# Saturation: exhaustion_rate approaching max sustainable
tool_budget_saturation = exhaustion_rate / 0.20  # 20% exhaustion rate = critical

IF exhaustion_rate > 0.10 AND exhaustion_trend > 0:
  → TOOL BUDGET BOTTLENECK SIGNAL
  
  # Failed calls compound: they consume budget without producing output
  effective_budget_waste = failed_calls_pct × exhaustion_rate
  days_to_budget_crisis = (0.20 - exhaustion_rate) / exhaustion_trend
```

### Orchestration Bottleneck

```
INPUTS from runtime-twin:
  routing_latency_trend = runtime_twin.orchestration_load.routing_latency_trend
  delegation_chain_depth_avg = runtime_twin.orchestration_load.avg_delegation_chain_depth
  supervisor_load = runtime_twin.orchestration_load.supervisor_load_pct

# Saturation: delegation chains getting deep + supervisor overloaded
orchestration_saturation = MAX(
  supervisor_load,
  delegation_chain_depth_avg / 4.0,  # Normalize: 4+ hops = saturated
  routing_latency_trend > 0.10 per hour → 0.80
)

IF delegation_chain_depth_avg > 2.5 OR supervisor_load > 0.80:
  → ORCHESTRATION BOTTLENECK SIGNAL
  
  # Each hop in delegation adds overhead (from coordination-simulator)
  # 1-hop: 5%, 2-hop: 10%, 3-hop: 14%, 4+hop: 19%+
  delegation_overhead_pct = delegation_overhead_table[CEIL(delegation_chain_depth_avg)]
```

### WIP/Queue Bottleneck

```
INPUTS from workflow-twin + operational-forecaster:
  arrival_rate = workflow_twin.portfolio.new_items_per_day_30d_avg
  throughput_rate = workflow_twin.portfolio.completed_per_day_30d_avg
  current_wip = workflow_twin.portfolio.in_progress_count

utilization = arrival_rate / throughput_rate  # ρ
wip_growth_rate = arrival_rate - throughput_rate  # Items accumulating per day

IF utilization > 0.80 AND wip_growth_rate > 0:
  → WIP/QUEUE BOTTLENECK SIGNAL
  
  # Little's Law: lead time = WIP / throughput
  current_lead_time = current_wip / throughput_rate
  projected_lead_time_7d = (current_wip + wip_growth_rate × 7) / throughput_rate
  lead_time_growth_factor = projected_lead_time_7d / current_lead_time
```

---

## Bottleneck Prediction Output

```yaml
BottleneckPrediction:
  prediction_id: string
  predicted_at: datetime
  prediction_horizon_days: 14       # Standard horizon for this predictor
  
  # Detected bottlenecks (sorted by urgency)
  detected_bottlenecks:
    - bottleneck_id: string
      bottleneck_class: "CAPACITY | GATE | ESCALATION | DEPENDENCY | CONTEXT | TOOL_BUDGET | ORCHESTRATION | WIP_QUEUE"
      location: string              # Which unit/system/phase
      
      # Current state
      current_saturation: float     # 0.0-1.0
      saturation_trend_per_day: float
      
      # Onset forecast
      onset_probability_7d: float
      onset_probability_14d: float
      onset_probability_30d: float
      days_to_warning_threshold: integer | null
      days_to_critical_threshold: integer | null
      
      # Urgency
      urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR"
      confidence: "HIGH | MEDIUM | LOW"
      
      # Impact if bottleneck occurs
      estimated_throughput_impact_pct: float   # % throughput reduction
      estimated_lead_time_impact_pct: float    # % lead time increase
      downstream_systems_affected: [string]
      
      # Recommended preemptive action
      recommended_action: string
      action_owner: string
      action_deadline: datetime
      action_lead_time_days: integer            # How many days to implement action
      expected_action_impact: string
  
  # Compound patterns
  compound_patterns:
    - pattern_name: string
      constituent_bottlenecks: [string]
      amplification_factor: float
      compound_risk: "LOW | MEDIUM | HIGH | CRITICAL"
      compound_description: string
  
  # System health summary
  system_bottleneck_health:
    active_bottlenecks_count: integer
    highest_urgency: "IMMEDIATE | HIGH | MEDIUM | MONITOR | NONE"
    compound_patterns_detected: integer
    overall_bottleneck_risk: "CLEAR | MANAGEABLE | CONCERNING | CRITICAL"
  
  # Comparison to prior prediction
  prediction_delta:
    new_bottlenecks: [string]       # Not in prior prediction
    resolved_bottlenecks: [string]  # Were in prior, no longer detected
    worsened_bottlenecks: [string]  # Urgency increased
    improved_bottlenecks: [string]  # Urgency decreased
```

---

## Integration

**Called by:** `predictive-intelligence/prediction-engine.md` (continuous — every 4 hours + on anomaly)
**Reads from:**
- `digital-twins/org-twin.md` (capacity, escalation state)
- `digital-twins/workflow-twin.md` (gate performance, flow efficiency, WIP)
- `digital-twins/delivery-twin.md` (dependency graph, critical path)
- `digital-twins/runtime-twin.md` (context pressure, tool budget, orchestration load)
- `predictive-intelligence/operational-forecaster.md` (WIP and flow signals)
- `forecasting/dependency-simulator.md` (bottleneck nodes, cascade risk)
- `simulation-systems/escalation-simulator.md` (escalation queue trajectory)

**Writes to:**
- `memory/digital-twins/predictions/bottleneck-prediction-[id].yaml`

**Output consumed by:**
- `predictive-intelligence/prediction-engine.md` → IMMEDIATE and HIGH bottlenecks surface to report
- Orchestrator → rerouting decisions when capacity/orchestration bottlenecks imminent
- `predictive-intelligence/governance-risk-predictor.md` → gate bottlenecks inform governance risk
