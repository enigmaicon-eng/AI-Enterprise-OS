# Governance Simulator

**System ID:** `governance-simulator`
**Role:** Simulates the impact of governance policy changes on decision velocity, quality, compliance, and workflow throughput — quantifying the quality/speed trade-off for any gate or policy change
**Handles:** Scenarios with perturbation types: governance_change, gate_strictness_increase/decrease

---

## Purpose

Governance decisions — changing gate criteria, adding approval steps, relaxing review requirements — have system-wide effects that are hard to reason about intuitively. Making gates stricter improves quality but slows delivery. Relaxing gates speeds delivery but risks compounding errors. The governance simulator makes these trade-offs quantitative.

It models: **"If we change policy X, how does cycle time, quality, and compliance change over 90 days?"**

---

## Governance Dimensions Simulated

| Dimension | What Changes | Key Metric Affected |
|-----------|-------------|---------------------|
| Gate strictness | Pass criteria become harder/easier | Gate pass rate, cycle time |
| Gate type change | Add/remove/swap gate type | Review overhead, human wait time |
| Approval threshold | Decision authority level changes | Decision latency, escalation rate |
| Policy addition | New constraint added | Compliance overhead, step duration |
| Policy removal | Constraint removed | Risk exposure, velocity improvement |
| Reviewer assignment | Human vs. agent review changes | Wait time, review quality |

---

## Governance Simulation Model

### Gate Strictness Change

```
INPUT:
  gate_type: "checklist | schema | agent_review | human_review | all"
  pass_rate_delta: float             # -0.15 = 15% fewer pass on first try
  quality_improvement_per_cycle: float  # 0.05 = each retry improves artifact quality ~5%

COMPUTE (per iteration):
  new_pass_rate = baseline_pass_rate + pass_rate_delta
  new_avg_cycles = 1 / new_pass_rate                    # Expected gate cycles
  
  # Cycle time impact
  time_per_retry = baseline_retry_duration_hours
  additional_cycle_time = (new_avg_cycles - baseline_avg_cycles) × time_per_retry
  
  # Quality improvement (artifacts that get more review are better)
  quality_improvement = (new_avg_cycles - baseline_avg_cycles) × quality_improvement_per_cycle
  new_quality_score = baseline_quality_score + quality_improvement
  
  # Downstream cascade: better quality → fewer downstream failures
  downstream_failure_reduction = quality_improvement × downstream_coupling_factor
  
  # Throughput impact
  new_throughput = baseline_throughput / (1 + additional_cycle_time / baseline_cycle_time)
```

### Gate Type Change

```
INPUT:
  old_gate_type: string
  new_gate_type: string
  step_id: string | "all"

# Duration by gate type (baseline estimates, adjusted by historical data)
gate_type_duration_hours:
  checklist:    0.5   # Automated — fast
  schema:       0.3   # Automated — fastest
  agent_review: 2.0   # Agent reviews artifact
  human_review: 8.0   # Human wait time (SLA-based)

gate_type_pass_rate:
  checklist:    0.82  # Criteria are clear — most artifacts pass
  schema:       0.88  # Schema validation is precise
  agent_review: 0.78  # Agent may catch issues checklist misses
  human_review: 0.85  # Humans approve most things after review

COMPUTE:
  old_overhead_per_step = old_type.duration × (1/old_type.pass_rate)  # Includes retries
  new_overhead_per_step = new_type.duration × (1/new_type.pass_rate)
  
  duration_delta = new_overhead_per_step - old_overhead_per_step
  quality_delta = new_type.pass_rate - old_type.pass_rate  # Proxy for quality
```

### Approval Threshold Change

```
INPUT:
  decision_type: "FINAL | SOFT | escalation_required"
  authority_change: "centralize | decentralize"
  # centralize: decisions require higher-tier approval → slower but more consistent
  # decentralize: decisions can be made at lower tier → faster but more variance

centralize_impact:
  avg_decision_time_hours *= 2.5   # Decisions take longer (need senior review)
  decision_consistency_pct += 0.15  # Decisions are more consistent
  escalation_rate_delta -= 0.05    # Fewer "I don't know" escalations (experts decide)

decentralize_impact:
  avg_decision_time_hours *= 0.4   # Decisions made much faster
  decision_consistency_pct -= 0.10  # More variation in how decisions are made
  escalation_rate_delta += 0.08    # More "need approval from above" escalations initially
```

### Policy Addition

```
INPUT:
  policy_type: "MUST | MUST_NOT | SHOULD | SHOULD_NOT"
  applies_to: "all | [workflow_types] | [step_ids]"
  compliance_overhead_minutes: float  # Time to verify compliance per step

COMPUTE:
  affected_steps_per_workflow = count(steps matching applies_to)
  overhead_per_workflow = affected_steps_per_workflow × compliance_overhead_minutes / 60
  
  # New compliance failures (some workflows won't meet the new policy)
  initial_compliance_rate = 1 - max_violation_rate
  compliance_ramp_weeks = 4  # Organizations take ~4 weeks to fully comply
  
  FOR t in [0, T]:
    compliance_rate[t] = MIN(initial_compliance_rate + (t / (compliance_ramp_weeks × 7)) × max_violation_rate, 1.0)
    gate_fail_rate[t] = 1 - compliance_rate[t]
    additional_cycle_time[t] = gate_fail_rate[t] × retry_duration + overhead_per_workflow
```

---

## Governance Quality Model

The key tension: governance slows things down but improves quality. This model quantifies both:

```
governance_quality_index = weighted_average(
  policy_adherence_rate × 0.30 +
  gate_consistency_score × 0.25 +
  decision_audit_trail_completeness × 0.25 +
  escalation_resolution_timeliness × 0.20
)

governance_velocity_index = weighted_average(
  1 - gate_overhead_fraction × 0.40 +
  1 - avg_decision_time_hours / max_acceptable_hours × 0.35 +
  1 - escalation_blocking_time_fraction × 0.25
)

# The trade-off curve:
# governance_quality ≈ 0.70 + 0.30 × gate_strictness_factor
# governance_velocity ≈ 1.0 - 0.60 × gate_strictness_factor
# Pareto front: maximize quality × velocity
```

---

## Governance Simulation Output

```yaml
GovernanceSimulationResult:
  # Quality-speed trade-off
  quality_speed_tradeoff:
    baseline_quality_index: float
    baseline_velocity_index: float
    new_quality_index_p50: float
    new_velocity_index_p50: float
    
    quality_change_direction: "IMPROVEMENT | NEUTRAL | DEGRADATION"
    velocity_change_direction: "IMPROVEMENT | NEUTRAL | DEGRADATION"
    tradeoff_summary: string          # "Quality up 12%, velocity down 8%" etc.
  
  # Gate performance forecast
  gate_forecast:
    new_gate_pass_rate: float
    new_avg_gate_cycles: float
    new_avg_cycle_time_hours: float
    gate_overhead_change_hours: float  # per workflow
    throughput_change_pct: float
  
  # Decision velocity forecast
  decision_velocity_forecast:
    new_avg_decision_time_hours: float
    decision_time_change_pct: float
    escalation_rate_change: float
    blocking_time_change_hours: float  # average time workflows spend waiting for decisions
  
  # Compliance trajectory
  compliance_trajectory:
    initial_compliance_rate: float
    day_30_compliance_rate_p50: float
    day_90_compliance_rate_p50: float
    compliance_ramp_weeks: float
    violations_during_ramp: integer
  
  # Net assessment
  net_governance_impact: "IMPROVED | NEUTRAL | DEGRADED | MIXED"
  governance_risk_change: "REDUCED | NEUTRAL | INCREASED"
  recommendation: string
  confidence: "HIGH | MEDIUM | LOW"
```

---

## Governance Sensitivity Analysis

Critical thresholds automatically identified:

```
IDENTIFY:
  pass_rate_minimum_for_positive_roi:
    The minimum gate pass rate where quality improvement offsets velocity cost
    Computed: where quality_gain × value_of_quality = velocity_loss × value_of_velocity
  
  maximum_review_overhead_before_throughput_collapse:
    The review overhead (hours) where throughput drops below acceptable threshold
  
  optimal_strictness_level:
    The gate strictness that maximizes quality × velocity product
```

---

## Integration

**Called by:** `simulation-systems/org-simulator.md`
**Reads from:**
- `digital-twins/org-twin.md` (governance state snapshot)
- `digital-twins/workflow-twin.md` (gate performance snapshot)
- `enterprise-modeling/org-model.md` (governance health model)

**Returns:** `GovernanceSimulationResult` to org-simulator
