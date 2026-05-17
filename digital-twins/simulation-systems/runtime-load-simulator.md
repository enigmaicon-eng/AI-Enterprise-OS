# Runtime Load Simulator

**System ID:** `runtime-load-simulator`
**Role:** Simulates AI runtime behavior under varying loads — context saturation, tool call pressure, session concurrency, and recovery overhead — identifying capacity limits and degradation thresholds
**Handles:** Scenarios with class: "runtime_load | capacity_saturation | context_pressure"

---

## Purpose

The AI runtime has fundamentally different saturation dynamics than human organizations. Context windows fill up, not just calendars. Tool budgets exhaust, not just work hours. Recovery events compound in ways that linearly scaled capacity planning misses. The runtime load simulator models these AI-native constraints accurately.

---

## Runtime Capacity Model

The runtime has four independent constraints, each with its own saturation point:

### Constraint 01: Context Window Capacity

```
Context is measured in tokens. Each session consumes tokens at a rate that depends on:
  - Input context (twin state, history, artifacts)
  - Working context (agent's reasoning, partial artifacts)
  - Output generation (artifacts, decisions)

context_consumption_rate_tokens_per_minute = f(workflow_complexity, step_type, artifact_size)

session_duration_minutes = context_budget / context_consumption_rate

# Sessions approaching context limit trigger compaction or session end
compaction_threshold = 0.70    # Micro-compaction at 70%
limit_threshold = 1.00         # Session must end at 100%

# As load increases:
# IF sessions hit limit more frequently:
#   → More session bridge writes
#   → More cold-start or warm-resume events
#   → Recovery overhead increases
#   → Effective throughput decreases
```

### Constraint 02: Tool Budget

```
Each step has a tool budget (max tool calls). Running out = F2 (stall) or incomplete artifact.

tool_budget_exhaustion_rate = steps_where_budget_depleted / total_steps

# Budget pressure increases with:
# - Workflow complexity (more research → more web fetches)
# - Step retries (each retry consumes budget)
# - Evidence gathering depth
# - Parallel tool call failures requiring retry

# Cascading effect:
# High budget pressure → more F2 (stall) failures
# F2 failures → recovery overhead
# Recovery overhead → less capacity for productive work
```

### Constraint 03: Session Concurrency

```
# Maximum simultaneous agent sessions the system can maintain
# Determined by: compute resources, rate limits, memory
max_concurrent_sessions: integer

active_sessions = concurrent_active_workflows × sessions_per_workflow
session_utilization = active_sessions / max_concurrent_sessions

# At high utilization:
# IF session_utilization > 0.90:
#   New workflow starts experience queuing delay
#   avg_start_delay = queuing_model(session_utilization, session_duration)
```

### Constraint 04: Recovery Overhead

```
# Recovery events (warm-resume, cold-start, rollback) consume runtime without producing output
recovery_overhead_fraction = recovery_time / total_runtime

# Compounding effect:
# More failures → more recovery → less capacity → more overload → more failures
# This is a positive feedback loop that can destabilize the system

# Critical threshold: if recovery_overhead_fraction > 0.30:
#   Effective productive capacity < 70% → throughput collapses rapidly
```

---

## Simulation Scenarios

### Scenario 01: Concurrent Workflow Scale-Up

What happens when we run 2× more concurrent workflows?

```
INPUT:
  workflow_count_multiplier: float

COMPUTE:
  new_session_count = baseline_sessions × multiplier
  new_session_utilization = new_session_count / max_concurrent_sessions
  
  # Session queuing (if utilization > 0.85):
  session_start_delay = queuing_wait(new_session_utilization, avg_session_duration)
  
  # Context pressure (more sessions = more tokens consumed per unit time):
  context_consumption_rate = new_session_count × tokens_per_session_per_hour
  context_pressure_index = MIN(1.0, context_consumption_rate / context_system_capacity)
  
  # Compaction events:
  compaction_events_per_hour = new_sessions_hitting_threshold × compaction_rate
  compaction_overhead_hours = compaction_events_per_hour × avg_compaction_duration_minutes / 60
  
  # Effective throughput:
  effective_capacity = max_concurrent_sessions - compaction_overhead
  new_throughput = baseline_throughput × (effective_capacity / baseline_sessions)
```

### Scenario 02: Context Complexity Increase

What if workflows require more context (larger artifacts, more history, richer background)?

```
INPUT:
  token_usage_factor: float         # 1.5 = 50% more tokens per session

COMPUTE:
  new_tokens_per_session = baseline_tokens × factor
  
  # Session duration decreases (hits limit sooner):
  new_session_duration = context_budget / new_tokens_per_minute
  
  # More session boundaries = more continuity overhead:
  session_boundaries_per_workflow = workflow_duration / new_session_duration
  continuity_overhead_per_boundary = session_bridge_write_time + context_restore_time
  total_continuity_overhead = session_boundaries_per_workflow × continuity_overhead_per_boundary
  
  # Gate review quality may degrade (compressed context = less full context):
  context_compression_quality_penalty = (factor - 1.0) × 0.03  # 3% quality drop per 100% factor increase
  new_gate_pass_rate = baseline_gate_pass_rate × (1 - context_compression_quality_penalty)
```

### Scenario 03: Tool Call Latency Increase

What if certain tools (web fetch, file operations) slow down significantly?

```
INPUT:
  tool_category: string
  latency_factor: float             # 3.0 = 3× slower
  failure_rate_injection: float     # 0.05 = 5% tool calls fail

COMPUTE:
  # Tool latency directly impacts step duration for tool-heavy steps
  tool_heavy_steps_fraction = fraction_of_steps_using_tool(tool_category)
  tool_call_fraction_of_step_time = avg_tool_calls_of_type × avg_tool_duration / step_duration
  
  additional_step_time = tool_call_fraction_of_step_time × (latency_factor - 1) × baseline_step_duration
  new_step_duration = baseline_step_duration + additional_step_time × tool_heavy_steps_fraction
  
  # Failed tool calls consume budget without producing results:
  wasted_budget_per_step = failed_tool_calls_per_step × avg_budget_per_tool_call
  effective_budget_per_step = budget - wasted_budget_per_step
  
  # Budget exhaustion increases:
  new_exhaustion_rate = baseline_exhaustion_rate + failure_rate × tool_heavy_steps_fraction
  
  # Throughput impact:
  new_throughput = baseline_throughput × (baseline_step_duration / new_step_duration)
```

### Scenario 04: Recovery Feedback Loop

What if initial failures trigger a cascade of recoveries that compounds?

```
INPUT:
  initial_failure_rate_increase: float  # Initial spike in F-class failures
  cascade_factor: float                  # How much each recovery reduces capacity for others

MODEL (iterative):
  failure_rate[0] = baseline_failure_rate + initial_failure_rate_increase
  
  FOR t in [1, T]:
    recovery_overhead[t] = failure_rate[t-1] × avg_recovery_duration_hours / hours_per_day
    effective_capacity[t] = baseline_capacity × (1 - recovery_overhead[t])
    
    # Overloaded system generates more failures:
    capacity_utilization[t] = active_workflows / effective_capacity[t]
    
    IF capacity_utilization[t] > 0.90:
      stress_failure_rate_increase = (capacity_utilization[t] - 0.90) × 0.50  # 50% more failures per 1% over 90%
    ELSE:
      stress_failure_rate_increase = 0
    
    failure_rate[t] = baseline_failure_rate + stress_failure_rate_increase
    
    # Check for stable or unstable equilibrium:
    IF failure_rate converges: stabilize
    IF failure_rate diverges: CRITICAL — cascade failure in progress
```

---

## Runtime Saturation Thresholds

| Metric | Warning | Critical | Collapse |
|--------|---------|---------|---------|
| Session utilization | 0.80 | 0.90 | 0.95+ |
| Context pressure index | 0.60 | 0.80 | 0.95+ |
| Budget exhaustion rate | 0.10 | 0.20 | 0.35+ |
| Recovery overhead fraction | 0.15 | 0.25 | 0.35+ |
| Composite saturation | 0.65 | 0.80 | 0.90+ |

---

## Runtime Load Simulation Output

```yaml
RuntimeLoadSimulationResult:
  # Session and concurrency
  session_dynamics:
    baseline_utilization: float
    new_utilization_p50: float
    saturation_probability: float
    saturation_onset_days: integer | null
    avg_start_delay_hours_p50: float
  
  # Context pressure
  context_pressure:
    baseline_pressure_index: float
    new_pressure_index_p50: float
    compaction_events_per_hour_p50: float
    context_limit_hits_per_hour_p50: float
    quality_impact_from_compression: float  # Gate pass rate change
  
  # Tool budget
  budget_dynamics:
    baseline_exhaustion_rate: float
    new_exhaustion_rate_p50: float
    wasted_tool_calls_per_hour: float
    throughput_impact_from_budget: float
  
  # Recovery overhead
  recovery_dynamics:
    baseline_recovery_overhead_pct: float
    new_recovery_overhead_pct_p50: float
    cascade_risk: boolean
    cascade_probability: float
    feedback_loop_onset_days: integer | null
  
  # Effective throughput
  throughput_impact:
    baseline_throughput_per_hour: float
    new_throughput_p50: float
    throughput_change_pct: float
    time_to_throughput_collapse_days: integer | null  # null if no collapse expected
  
  # Composite saturation
  saturation_analysis:
    composite_saturation_p50: float
    limiting_constraint: string    # Which constraint hits saturation first
    headroom_pct: float            # How far from collapse
  
  runtime_health: "HEALTHY | STRESSED | AT_RISK | SATURATED | CASCADING"
  recommendation: string
```

---

## Integration

**Called by:** `simulation-systems/simulation-engine.md`
**Reads from:**
- `digital-twins/runtime-twin.md` (snapshot)
- `enterprise-modeling/workflow-model.md` (throughput models)

**Returns:** `RuntimeLoadSimulationResult`
