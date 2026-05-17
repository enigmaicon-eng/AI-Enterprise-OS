# Dependency Simulator

**System ID:** `dependency-simulator`
**Role:** Analyzes and simulates dependency chains — computing critical paths, identifying at-risk dependencies, modeling cascade delay effects, and detecting dependency cycles
**Output:** Critical path analysis, dependency risk map, cascade delay distributions

---

## Purpose

Dependencies are the primary cause of delivery surprises. A single item slipping on the critical path delays everything that depends on it. The dependency simulator makes these chains explicit, quantifies the risk at each node, and shows how delays propagate through the graph before they happen.

---

## Dependency Graph Analysis

### Critical Path Computation

```
CRITICAL PATH ALGORITHM (CPM — Critical Path Method):

BUILD: Directed Acyclic Graph (DAG) from all dependency edges

# Forward pass: earliest possible completion for each item
FOR each item in topological order:
  item.earliest_start = MAX(dep.earliest_finish FOR dep in item.depends_on, OR 0)
  item.earliest_finish = item.earliest_start + item.effort_days_p50

# Backward pass: latest allowable completion (based on release target)
release_deadline = target_release.target_date

FOR each item in reverse topological order:
  item.latest_finish = MIN(
    dep.latest_start FOR dep in item.enables,   # Must complete before any dependent starts
    OR release_deadline                           # Or the release deadline
  )
  item.latest_start = item.latest_finish - item.effort_days_p50

# Total float (slack)
FOR each item:
  item.total_float = item.latest_finish - item.earliest_finish
  item.on_critical_path = (item.total_float == 0)

CRITICAL PATH: sequence of items where total_float == 0
CRITICAL PATH DURATION: SUM(effort_days for items on critical path)
```

### Near-Critical Path

Items with small float are nearly as risky as critical path items:

```
FOR each item NOT on critical path:
  IF item.total_float <= 0.15 × critical_path_duration:
    → "Near-critical path" — treat as high risk
  IF item.total_float <= 0.30 × critical_path_duration:
    → "Secondary critical path" — monitor closely
```

---

## Dependency Risk Scoring

```
FOR each dependency_edge (A → B: "A must complete before B can start"):
  
  # Risk 01: Probability A slips
  slip_probability_A = 1 - A.on_time_probability  # From roadmap-forecaster
  
  # Risk 02: If A slips, how much does B slip?
  IF A is on critical path AND B is on critical path:
    delay_multiplier = 1.0     # Delay propagates 1:1
  ELSE IF A is on critical path AND B is not:
    delay_multiplier = 0.5     # B absorbs some of the delay via float
  ELSE:
    delay_multiplier = A.total_float / B.total_float * 0.3  # Partially absorbed
  
  expected_delay_to_B = slip_probability_A × A.expected_slip_days × delay_multiplier
  
  # Dependency risk score
  dependency_risk_score = slip_probability_A × expected_delay_to_B × is_critical_multiplier
  WHERE:
    is_critical_multiplier = 3.0 if B on critical path else 1.0
```

---

## Cascade Delay Simulation

When one item slips, all items that depend on it (directly or transitively) may be delayed. Monte Carlo simulation captures the cascade:

```
FOR each iteration:
  
  # Assign completion time to each item by sampling from its distribution
  FOR each item:
    sampled_duration = sample(LogNormal(item.p50_days, item.sigma_days))
    
    # Check if dependencies are met
    actual_start = MAX(dep.actual_completion FOR dep in item.depends_on, OR planned_start)
    item.actual_completion = actual_start + sampled_duration
  
  # Measure cascade: how many items were affected when critical item slips?
  IF critical_item.actual_completion > critical_item.planned_completion:
    cascade_delay = critical_item.actual_completion - critical_item.planned_completion
    
    FOR each item that transitively depends on critical_item:
      absorbed_by_float = MIN(cascade_delay, item.total_float)
      delay_passed_to_dependents = MAX(0, cascade_delay - absorbed_by_float)
      item.actual_completion += delay_passed_to_dependents
  
  # Final: release completion = MAX(core_items.actual_completion)
  release_completion[iter] = MAX(core_items.actual_completion)
```

---

## Dependency Cycle Detection

Circular dependencies are fatal — A depends on B depends on A:

```
ALGORITHM: Depth-First Search (DFS) with cycle detection

FOR each item as starting node:
  DFS(item, visited=[], in_stack=[])
    IF item in in_stack:
      → CYCLE DETECTED: [path from item back to item]
      → This is a blocking error: workflow cannot execute
    IF item not in visited:
      visited.add(item)
      in_stack.add(item)
      FOR each dep in item.depends_on:
        DFS(dep, visited, in_stack)
      in_stack.remove(item)

IF any cycle detected:
  → CRITICAL ALERT: "Circular dependency detected: [A → B → C → A]"
  → Resolution required before forecasting proceeds
```

---

## Bottleneck Node Analysis

Some items are bottlenecks — many other items depend on them:

```
FOR each item:
  item.in_degree = count(items that directly depend on this item)
  item.transitive_dependent_count = count(items that transitively depend on this item)
  item.bottleneck_score = item.transitive_dependent_count × item.slip_probability
  
BOTTLENECK RANKING:
  Sort by bottleneck_score DESC
  Top 3 are high-priority monitoring items
```

---

## Dependency Simulation Output

```yaml
DependencySimulationResult:
  analysis_id: string
  analyzed_at: datetime
  
  # Critical path
  critical_path:
    items: [string]                  # item_ids in order
    total_duration_days: float
    critical_path_risk: "LOW | MEDIUM | HIGH | CRITICAL"
    
    # Sensitivity: if any critical path item slips by 1 day, total slips by 1 day
    
  # Near-critical paths
  near_critical_paths:
    - items: [string]
      float_days: float              # How much slack this path has
      risk_level: "LOW | MEDIUM | HIGH"
  
  # Per-dependency risk map
  dependency_risks:
    - from_item: string
      to_item: string
      risk_score: float
      delay_probability: float
      expected_delay_days: float
      cascade_depth: integer         # How many items downstream can be affected
  
  # Bottleneck nodes
  bottleneck_nodes:
    - item_id: string
      item_title: string
      transitive_dependents: integer
      slip_probability: float
      bottleneck_score: float
      priority_for_risk_mitigation: integer  # 1 = most critical to watch
  
  # Cascade scenarios
  cascade_scenarios:
    - trigger_item: string
      trigger_slip_days: integer     # Scenario: this item slips by N days
      cascade_affected_items: [string]
      release_impact_days_p50: float
      release_at_risk: boolean
  
  # Dependency health
  dependency_cycles: integer         # Should be 0 — any is critical
  total_dependencies: integer
  at_risk_dependencies: integer
  dependency_health: "CLEAR | MANAGEABLE | AT_RISK | BLOCKED"
  
  # Release impact
  release_on_time_probability: float  # Given current dependency state
  primary_risk_to_release: string     # The single biggest dependency risk
  
  recommendations:
    - action: string
      target: string                 # Which item/dependency to address
      expected_impact: string
      urgency: string
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`, `predictive-intelligence/prediction-engine.md`
**Reads from:**
- `digital-twins/delivery-twin.md` (dependency graph, item states)
- `forecasting/roadmap-forecaster.md` (slip probabilities per item)
- `enterprise-modeling/delivery-model.md` (dependency model formulas)

**Writes to:**
- `memory/digital-twins/forecasts/dependency-analysis-[id].yaml`

**Output consumed by:**
- `forecasting/release-risk-simulator.md` → dependency risk as input to release risk
- `predictive-intelligence/operational-forecaster.md` → delivery risk trend
