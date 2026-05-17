# Escalation Simulator

**System ID:** `escalation-simulator`
**Role:** Simulates escalation patterns — how escalation rate changes cascade through the org, how long escalations block workflows, and when escalation queues saturate under increased load
**Handles:** Scenarios with escalation-related perturbations, F3 (Gate Fail Unrecovered) risk analysis

---

## Purpose

Escalations are the system's safety valve — but they are also its Achilles heel. When an agent cannot resolve something autonomously, it escalates to a supervisor or human. A modest escalation rate (5-10%) is healthy. A high escalation rate (> 20%) indicates systemic problems — poor agent calibration, overly strict gates, unclear decision authority, or insufficient capacity.

The escalation simulator models escalation as a queuing system and shows how rate changes, queue saturation, and cascade effects interact.

---

## Escalation System Model

Escalations are modeled as a queuing system: M/G/c queue (Poisson arrivals, general service time, c servers):

```
Queue parameters:
  λ (arrival rate) = escalation_rate × workflow_throughput (escalations per hour)
  μ (service rate) = 1 / avg_resolution_time_hours (resolutions per hour)
  c (servers) = number of capable resolvers (supervisors + humans available)
  ρ (utilization) = λ / (c × μ)
  
Queue stability condition: ρ < 1 (if ρ ≥ 1, queue grows without bound)
```

### Queue Dynamics

```
# At utilization ρ, the expected queue length is:
L = ρ / (1 - ρ)    # Simplified M/M/1 model

# Expected wait time (time from escalation open to resolution begins):
W = L / λ = 1 / (μ - λ)    # Diverges as ρ → 1

# This is the "queue explosion" effect:
# At ρ = 0.50: wait = baseline
# At ρ = 0.80: wait = 2.5× baseline
# At ρ = 0.90: wait = 4.5× baseline
# At ρ = 0.95: wait = 9.5× baseline
# At ρ = 0.99: wait = 50× baseline
```

---

## Escalation Scenarios

### Scenario 01: Escalation Rate Increase

What happens if more workflows require escalation?

```
INPUT:
  rate_multiplier: float            # 2.0 = twice as many escalations
  cause: "gate_stricter | volume_increase | capacity_reduction | quality_degradation"
  
COMPUTE:
  new_lambda = baseline_lambda × rate_multiplier
  new_rho = new_lambda / (c × mu)
  
  IF new_rho >= 1.0:
    → QUEUE SATURATION: escalations accumulate faster than resolved
    → Identify: saturation onset time (when backlog starts growing unbounded)
    → Workflows blocked for this escalation type accumulate
  
  new_wait_time = 1 / (mu - new_lambda) if new_rho < 1 else UNBOUNDED
  new_blocking_hours_per_workflow = new_wait_time × escalation_blocking_factor
  
  lead_time_impact = escalation_rate × new_blocking_hours_per_workflow
```

### Scenario 02: Resolver Capacity Reduction

What if fewer supervisors or humans are available to resolve escalations?

```
INPUT:
  c_reduction: integer              # How many resolvers are lost
  resolver_type: "supervisor | human | both"
  
COMPUTE:
  new_c = c - c_reduction
  new_rho = lambda / (new_c × mu)
  
  # Even if λ stays constant, losing resolvers → higher utilization
  IF new_rho > 0.85:
    → WARNING: Escalation resolver near capacity
  IF new_rho >= 1.0:
    → CRITICAL: Queue will grow unbounded — action required
```

### Scenario 03: Resolution Time Increase

What if escalations take longer to resolve (e.g., key decision-makers are less available)?

```
INPUT:
  resolution_time_factor: float    # 2.0 = takes twice as long to resolve
  
COMPUTE:
  new_mu = baseline_mu / resolution_time_factor    # Slower service rate
  new_rho = lambda / (c × new_mu)
  
  # Same effect as reducing resolvers
  new_wait_time = recompute_queue_wait(lambda, new_mu, c)
```

### Scenario 04: Cascade Escalation

High-severity escalations that trigger secondary escalations (e.g., unresolved gate fail → scope change → governance escalation):

```
INPUT:
  cascade_probability: float        # P(one escalation triggers another)
  cascade_type_mix: map             # Types of secondary escalations
  
COMPUTE:
  # Effective arrival rate increases with cascade
  effective_lambda = baseline_lambda × (1 / (1 - cascade_probability))
  # This converges IF cascade_probability < 1 — diverges otherwise
  
  IF cascade_probability >= 0.5:
    → HIGH RISK: Cascade chains can become very long
    → Model as branching process: E[cascade_size] = 1 / (1 - cascade_probability)
```

---

## Escalation Resolution SLA Model

Escalations have resolution time targets (from org-model.md). The simulator tracks SLA compliance:

```
FOR EACH escalation type in simulation:
  SLA_target_hours:
    CRITICAL: 2
    HIGH:     8
    MEDIUM:   24
    LOW:      72
  
  resolution_time_distribution:
    # Modeled as log-normal (most resolve quickly, rare ones take very long)
    median_hours = SLA_target_hours × 0.6  # Healthy org: resolves in 60% of SLA
    std_dev = median_hours × 0.8           # High variance
  
  p(SLA_breach) = P(resolution_time > SLA_target)
  
  SLA_breach_rate_by_severity:
    CRITICAL: p(resolution > 2h)
    HIGH:     p(resolution > 8h)
    MEDIUM:   p(resolution > 24h)
    LOW:      p(resolution > 72h)
```

---

## Saturation Point Analysis

The most critical output: when does the escalation system saturate?

```
SATURATION ANALYSIS:
  # Find the escalation rate at which queue becomes unstable
  saturation_lambda = c × mu  # Queue becomes unstable above this arrival rate
  current_headroom_pct = (saturation_lambda - current_lambda) / saturation_lambda
  
  # Current headroom: how far from saturation
  IF current_headroom_pct > 0.40: → "COMFORTABLE — significant headroom"
  IF current_headroom_pct > 0.20: → "ADEQUATE — some headroom"
  IF current_headroom_pct > 0.10: → "WARNING — approaching saturation"
  IF current_headroom_pct ≤ 0.10: → "CRITICAL — near saturation"
  
  # Volume increase to saturation
  workflows_to_saturation = (saturation_lambda - current_lambda) / escalation_rate_per_workflow
```

---

## Escalation Simulation Output

```yaml
EscalationSimulationResult:
  # Queue state trajectory
  queue_trajectory:
    day_0_queue_depth: integer
    day_30_queue_depth_p50: integer
    day_60_queue_depth_p50: integer
    day_90_queue_depth_p50: integer
    max_queue_depth_p50: integer
    queue_saturation_probability: float     # P(queue grows without bound)
    saturation_onset_day_p50: integer | null  # null if saturation not likely
  
  # Wait time trajectory
  wait_time_forecast:
    baseline_wait_hours: float
    day_30_wait_hours_p50: float
    day_90_wait_hours_p50: float
    max_wait_hours_p90: float               # Worst case wait time
  
  # SLA compliance
  sla_compliance:
    critical_sla_breach_rate: float
    high_sla_breach_rate: float
    overall_sla_compliance: float
    sla_trend: "IMPROVING | STABLE | DECLINING"
  
  # Workflow blocking impact
  workflow_impact:
    workflows_blocked_per_day_p50: float
    avg_blocking_hours_per_workflow: float
    lead_time_increase_hours_p50: float     # Average lead time increase due to escalation
    throughput_reduction_pct: float         # % reduction in workflow throughput
  
  # Cascade risk
  cascade_assessment:
    cascade_probability: float
    avg_cascade_length: float               # Expected escalations per root escalation
    cascade_risk: "LOW | MEDIUM | HIGH | CRITICAL"
  
  # Saturation analysis
  saturation_headroom_pct: float
  volume_increase_to_saturation: float      # Additional workflows that push to saturation
  resolver_reduction_to_saturation: integer # Agent reductions that push to saturation
  
  # Net impact
  escalation_health: "HEALTHY | STRESSED | AT_RISK | SATURATED"
  recommendation: string
```

---

## Integration

**Called by:** `simulation-systems/org-simulator.md`
**Reads from:**
- `digital-twins/org-twin.md` (escalation state snapshot)
- `enterprise-modeling/org-model.md` (SLA targets, escalation model)

**Returns:** `EscalationSimulationResult` to org-simulator
