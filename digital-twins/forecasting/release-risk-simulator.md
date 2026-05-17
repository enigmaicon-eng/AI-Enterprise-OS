# Release Risk Simulator

**System ID:** `release-risk-simulator`
**Role:** Scores and simulates risk for planned releases — evaluating quality gate status, dependency readiness, team capacity, and go/no-go criteria to produce a probability-weighted release risk assessment
**Output:** Release risk score (0-100), go/no-go recommendation, top risks with mitigations

---

## Purpose

A release decision is one of the highest-stakes decisions in the delivery cycle. Ship too early and you release defects. Ship too late and you miss market windows. The release risk simulator quantifies the risks across all dimensions — quality, delivery, dependencies, capacity — and synthesizes them into an actionable risk score and recommendation.

---

## Release Risk Dimensions

Risk is assessed across five dimensions:

| Dimension | Weight | Measures |
|-----------|--------|---------|
| Scope completeness | 30% | Are all core items complete? |
| Quality gate status | 30% | Have all required quality gates passed? |
| Dependency readiness | 20% | Are all external dependencies resolved? |
| Capacity adequacy | 10% | Is the team ready and available? |
| Technical stability | 10% | Are there unresolved rollback risks or failures? |

---

## Risk Scoring Model

### Dimension 01: Scope Completeness Risk

```
# Core items (must-have): blocking if incomplete
core_completion_rate = core_items_complete / total_core_items

# Nice-to-have: non-blocking, but affects scope confidence
nth_completion_rate = nth_items_complete / total_nth_items

scope_completeness_score = (
  core_completion_rate × 0.80 +
  nth_completion_rate × 0.20
) × 100

# Risk: any core item incomplete
IF core_completion_rate < 1.0:
  scope_risk = (1 - core_completion_rate) × 100
  scope_risk_severity = "CRITICAL" if core_completion_rate < 0.80 else "HIGH"
```

### Dimension 02: Quality Gate Risk

```
# Gate status across all workflow phases for release items
gate_scores:
  discovery_gate_passed: boolean
  architecture_gate_passed: boolean
  engineering_gate_passed: boolean
  qa_gate_passed: boolean
  release_gate_passed: boolean

# Weighted by gate criticality
gate_weights:
  qa_gate: 0.35              # Highest weight — most direct quality signal
  engineering_gate: 0.30
  architecture_gate: 0.20
  release_gate: 0.10
  discovery_gate: 0.05

gate_quality_score = SUM(gate_weights[g] × 100 if gate_passed else 0 FOR g in gates)

# Recent gate fail pattern
IF any gate failed in last 48 hours on a core item:
  gate_quality_score *= 0.85  # Penalty: recent failures indicate instability

# Gate retry rate (high retries = unstable quality)
high_retry_rate = avg_gate_cycles_for_release_items > 2.0
IF high_retry_rate:
  gate_quality_score *= 0.90
```

### Dimension 03: Dependency Readiness Risk

```
# From dependency-simulator output
dependency_risk_assessment = dependency_simulator.analyze(release_items)

unresolved_deps = dependency_risk_assessment.at_risk_dependencies
critical_path_deps_at_risk = [d for d in unresolved_deps if d.on_critical_path]

dependency_readiness_score = (1 - min(1, len(unresolved_deps) × 0.15)) × 100

# Critical path dependency multiplier
IF len(critical_path_deps_at_risk) > 0:
  dependency_readiness_score *= 0.80  # Significant penalty for critical path risk
```

### Dimension 04: Capacity Adequacy Risk

```
# Is the team available and at healthy utilization for release activities?
team_utilization = org_twin.units[release_owner_team].utilization_pct

IF team_utilization > 0.90:
  capacity_score = 30    # Overloaded — release activities may be skipped/rushed
ELIF team_utilization > 0.80:
  capacity_score = 70    # High but manageable
ELIF team_utilization > 0.60:
  capacity_score = 100   # Healthy
ELSE:
  capacity_score = 85    # Underloaded — may indicate team is behind on expectations

# Planned absence during release window
IF key_personnel_absent_during_release_week:
  capacity_score *= 0.80
```

### Dimension 05: Technical Stability Risk

```
# From execution history
rollback_count_last_30_days = execution_ledger.count_rollbacks(last_30_days, release_items)
recovery_events_last_7_days = execution_ledger.count_recoveries(last_7_days, release_items)
failure_cluster_detected = workflow_twin.recent_gate_fail_cluster

technical_stability_score = 100
technical_stability_score -= rollback_count_last_30_days × 15   # -15 per rollback
technical_stability_score -= recovery_events_last_7_days × 5    # -5 per recent recovery
technical_stability_score -= 20 if failure_cluster_detected else 0
technical_stability_score = MAX(0, technical_stability_score)
```

### Composite Risk Score

```
release_risk_score = (
  scope_completeness_score × 0.30 +
  gate_quality_score × 0.30 +
  dependency_readiness_score × 0.20 +
  capacity_score × 0.10 +
  technical_stability_score × 0.10
)

# Readiness score (0-100, higher = more ready)
# Risk level = inverse: (100 - readiness_score) = risk percentage
release_readiness_score = release_risk_score
release_risk_level = 100 - release_risk_score
```

---

## Go/No-Go Decision Framework

```
go_no_go_determination:
  
  # Hard blockers (any one = NO_GO regardless of score)
  hard_blockers:
    - critical_core_item_incomplete: any core item with completion < 1.0 and no approved exception
    - required_gate_failed: qa_gate or engineering_gate failed with no resolution plan
    - critical_dependency_unresolved: critical path dependency blocked with no resolution ETA
    - active_rollback_in_progress: any release item currently in rollback state
  
  IF any hard_blocker:
    return "NO_GO", reason: [hard blocker descriptions]
  
  # Score-based determination
  IF readiness_score >= 90: return "GO"
  IF readiness_score >= 80: return "CONDITIONAL_GO", conditions: [what must resolve before release]
  IF readiness_score >= 65: return "NO_GO", recommendation: "Recommend 1-week delay to resolve [top risks]"
  IF readiness_score < 65:  return "NO_GO", recommendation: "Significant issues — do not release until [issues] resolved"
```

---

## Monte Carlo Release Risk Simulation

Simulates possible release outcomes given current uncertainty:

```
FOR iteration in 1..1000:
  
  # Sample outcome for each uncertain dimension
  scope_complete_at_release = simulate_scope_completion(current_progress, velocity_distribution)
  
  gate_fail_in_window = P(any critical gate fails in next [days_until_release])
  
  dep_delay = simulate_dependency_delays(dependency_risk_map)
  
  # Compute outcome
  release_successful = (
    scope_complete_at_release AND
    NOT gate_fail_in_window AND
    dep_delay <= total_float_in_release_scope
  )
  
  simulated_outcomes[iter] = {
    on_time: release_successful AND effective_date <= target_date,
    complete_scope: scope_complete_at_release,
    quality_cleared: NOT gate_fail_in_window,
    deps_resolved: dep_delay <= float
  }

# Results
on_time_probability = fraction(on_time == True)
full_scope_probability = fraction(complete_scope == True)
conditional_probability = fraction(on_time == True AND complete_scope == True AND quality_cleared == True)
```

---

## Release Risk Output

```yaml
ReleaseRiskAssessment:
  assessment_id: string
  release_id: string
  assessed_at: datetime
  days_until_release: integer
  
  # Risk scores
  readiness_score: integer           # 0-100 (higher = more ready)
  risk_score: integer                # 0-100 (higher = more risky)
  
  # Dimension scores
  dimension_scores:
    scope_completeness: integer
    gate_quality: integer
    dependency_readiness: integer
    capacity_adequacy: integer
    technical_stability: integer
  
  # Probabilities
  on_time_probability: float
  full_scope_probability: float
  
  # Decision
  go_no_go: "GO | CONDITIONAL_GO | NO_GO | INSUFFICIENT_DATA"
  go_no_go_rationale: string
  
  # Hard blockers (if any)
  hard_blockers: [string]            # Empty if GO
  
  # Conditional GO conditions (if CONDITIONAL_GO)
  conditions:
    - condition: string
      deadline: datetime
      owner: string
      current_status: string
  
  # Top risks
  top_risks:
    - risk_name: string
      risk_type: "SCOPE | QUALITY | DEPENDENCY | CAPACITY | TECHNICAL"
      probability: float
      impact: string
      mitigation: string
      mitigation_owner: string
      mitigation_deadline: datetime
  
  # Recommendations
  primary_recommendation: string    # One sentence
  supporting_actions: [string]      # 3-5 specific actions
```

---

## Integration

**Called by:** `digital-twins/twin-engine.md`, `predictive-intelligence/prediction-engine.md`
**Reads from:**
- `digital-twins/delivery-twin.md` (release pipeline state)
- `digital-twins/workflow-twin.md` (gate status, failure patterns)
- `digital-twins/org-twin.md` (team capacity)
- `forecasting/dependency-simulator.md` (dependency risk)
- `forecasting/roadmap-forecaster.md` (scope completion probabilities)

**Writes to:**
- `memory/digital-twins/forecasts/release-risk-[id].yaml`

**Output consumed by:**
- `predictive-intelligence/governance-risk-predictor.md`
- Orchestrator for go/no-go decisions
