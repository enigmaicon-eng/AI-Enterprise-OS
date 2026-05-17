# Team Performance Model

## Role
Defines the canonical model for measuring, tracking, and comparing team performance across the OS. Establishes the dimensions, scoring formulas, tier thresholds, and data sources that all team intelligence systems use. Performance measurement is diagnostic, not punitive — the goal is surfacing improvement opportunities, not ranking teams for consequences.

## Team Performance Dimensions

```
DIMENSION           WEIGHT    DESCRIPTION                              DATA SOURCE
─────────────────────────────────────────────────────────────────────────────────────
DELIVERY            0.25      Throughput, cycle time, predictability   workflow-runs, sprints
QUALITY             0.20      Gate pass rates, defect rates, rework    evaluation records
GOVERNANCE          0.15      Approval compliance, policy adherence    governance telemetry
COLLABORATION       0.15      Cross-team handoffs, dependency health   orchestration telemetry
KNOWLEDGE           0.10      Wiki contributions, decision capture     knowledge management
VELOCITY_STABILITY  0.10      Sprint-to-sprint velocity variance       sprint records
AGENT_LEVERAGE      0.05      % of work routed through OS agents       execution records

team_performance_score = Σ(dimension_score × weight)
```

## Team Performance Tiers

```
TIER          SCORE RANGE    LABEL            CHARACTERISTICS
────────────────────────────────────────────────────────────────────────
EXEMPLARY     >= 0.88        Top Performer    Consistently above targets; strong cross-team
HIGH          0.75–0.87      Above Average    Reliable delivery; few governance issues
STANDARD      0.60–0.74      On Track         Meets targets; room for improvement
DEVELOPING    0.45–0.59      Needs Focus      Missing targets in 2+ dimensions
AT_RISK       < 0.45         Intervention     Systemic issues; T3 review triggered
```

## Dimension Measurement Definitions

```yaml
delivery_score:
  throughput:       completed_workflow_runs / capacity_hours (normalized to team size)
  cycle_time_p50:   median hours from workflow_started to workflow_completed
  cycle_time_p95:   95th percentile (reliability indicator)
  predictability:   committed_items_completed / committed_items_planned (sprint)
  composite:        throughput×0.35 + (1 - cycle_time_regression)×0.35 + predictability×0.30

quality_score:
  gate_pass_rate:   first_pass_gate_successes / total_gate_evaluations
  rework_rate:      workflows_requiring_correction / total_workflows
  defect_escape:    issues_found_post_delivery / total_deliveries
  composite:        gate_pass_rate×0.50 + (1 - rework_rate)×0.30 + (1 - defect_escape)×0.20

governance_score:
  approval_compliance:   required_approvals_obtained / total_requiring_approval
  policy_adherence:      checks_passed / total_policy_checks
  escalation_rate:       escalated_decisions / total_decisions (lower = better)
  composite:             approval_compliance×0.40 + policy_adherence×0.40 + (1 - escalation_rate)×0.20

collaboration_score:
  handoff_success_rate:  successful_cross_team_handoffs / total_handoffs
  dependency_health:     on_time_dependency_deliveries / total_dependencies
  knowledge_sharing:     wiki_contributions + decision_captures (normalized)
  composite:             handoff_success×0.40 + dependency_health×0.40 + knowledge_sharing×0.20
```

## Baseline and Benchmarking

```
BASELINE COMPUTATION:
  Per team: rolling 90-day average per dimension (min 3 sprints)
  Initial baseline: first 90 days = learning period (no tier assignment)
  Baseline update: recalculated weekly

BENCHMARKS:
  org_median:    median score across all teams in OS (50th percentile)
  org_p75:       75th percentile (stretch target)
  org_top:       90th percentile (exemplary benchmark)

PEER GROUPS:
  Teams clustered by: team_size, primary_workflow_type, tenure
  Benchmark within peer group prevents unfair comparison of new vs. tenured teams
```

## Performance Record Schema

```yaml
team_performance_record:
  record_id: string
  team_id: string
  period: {from: ISO8601, to: ISO8601}
  
  scores:
    delivery: number
    quality: number
    governance: number
    collaboration: number
    knowledge: number
    velocity_stability: number
    agent_leverage: number
    composite: number
  
  tier: EXEMPLARY | HIGH | STANDARD | DEVELOPING | AT_RISK
  tier_change: PROMOTED | STABLE | DEMOTED | null
  
  benchmarks:
    vs_org_median: number        # +/- delta
    vs_peer_group: number
    rank_in_org: number
  
  highlights: [string]           # top 2 strengths this period
  improvement_areas: [string]    # top 2 areas for improvement
  
  generated_at: ISO8601
  reviewed_by: string            # team lead or null (auto)
```

## Persistence
`memory/team-intelligence/team-performance-records.yaml`
`memory/team-intelligence/team-baselines.yaml`
`memory/team-intelligence/performance-history.jsonl`
