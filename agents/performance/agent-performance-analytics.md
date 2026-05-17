# Agent Performance Analytics

## Purpose
Transforms raw performance signals and rolling metrics into insights — surfacing patterns, trends, anomalies, and comparative benchmarks that inform decisions about coaching, capability development, role assignments, and organizational intelligence investment.

---

## Analytics Architecture

```
Performance Data Store (time-series + snapshots)
        ↓
[1. Individual Analysis]     → per-agent trends, patterns, anomalies
[2. Cohort Analysis]         → compare agent against peer cohort
[3. Capability Analysis]     → performance by capability domain
[4. Organizational Analysis] → enterprise-wide intelligence health
[5. Predictive Analysis]     → forecast performance trajectory
        ↓
[Insight Generation]         → actionable findings from data
        ↓
[Insight Distribution]       → coaching plans, supervisor reports, dashboards
```

---

## Individual Agent Analysis

```yaml
individual_analysis:
  performance_trajectory:
    method: compute 7d, 30d, 90d rolling scores per dimension
    trend_classification:
      STRONGLY_IMPROVING: dimension score up > 0.15 over 90 days
      IMPROVING: dimension score up 0.05–0.15 over 90 days
      STABLE: dimension score within ±0.05 over 90 days
      DECLINING: dimension score down 0.05–0.15 over 90 days
      STRONGLY_DECLINING: dimension score down > 0.15 over 90 days
    
    output: per-dimension trajectory + overall trajectory + key inflection points
  
  strength_weakness_profile:
    strengths: top 2 dimensions by absolute score and positive trajectory
    gaps: bottom 2 dimensions by score AND/OR most steeply declining
    focus_recommendation: which dimension to prioritize for coaching (highest leverage)
  
  task_complexity_analysis:
    group: all tasks by complexity bucket (TRIVIAL/SIMPLE/STANDARD/COMPLEX/EXPERT)
    compute: success_rate, quality_score, sla_compliance per bucket
    insight: at what complexity level does the agent's performance degrade?
    use: identify the agent's effective operating ceiling
  
  error_pattern_analysis:
    group: errors by error_type
    identify: most frequent, most severe, most costly error types
    compute: error_type trend (increasing or decreasing frequency?)
    insight: which error patterns indicate systemic issues vs. random noise
  
  domain_performance_analysis:
    group: tasks by domain
    compute: performance scores per domain
    identify: domains where agent excels vs. struggles
    use: guide domain-specific task assignment
```

---

## Cohort Analysis

```yaml
cohort_analysis:
  cohort_definitions:
    BY_AGENT_TYPE: compare governance agents to other governance agents
    BY_TIER: compare T2 agents across all types
    BY_TENURE: compare new agents (<6 months) to experienced agents
    BY_SPECIALIZATION: compare agents with same certification/specialization
  
  percentile_ranking:
    for_each_agent: compute performance percentile within their cohort for each dimension
    output: {P25, P50, P75, P90} per dimension per cohort
    use: context-adjusted evaluation (a T1 agent at P90 in their cohort may outperform a T2 at P10)
  
  peer_comparison_report:
    shows: agent's score vs. cohort mean ± std_dev per dimension
    flags: dimensions where agent is > 2σ below cohort mean (concern)
    flags: dimensions where agent is > 2σ above cohort mean (potential mentor/expert candidate)
  
  cohort_health:
    aggregate_scores_by_cohort: mean per dimension per cohort
    identify: underperforming cohorts (any dimension mean < target - 0.15)
    alert: cohort-level performance issues → organizational/process problem, not just individual
```

---

## Capability Domain Analysis

```yaml
capability_domain_analysis:
  capability_performance_matrix:
    rows: capability_id
    columns: success_rate, quality_avg, error_rate, calibration_error
    data: aggregated from all agents with that capability
    use: identify capabilities where the organization struggles
  
  agent_capability_fit:
    for_each_agent: compare task performance when using specific capabilities vs. baseline
    insight: which capabilities are THIS agent's force multipliers?
    use: optimal task routing (assign tasks to agents where their capabilities create highest value)
  
  capability_utilization:
    authorized_but_unused: capabilities granted but not used in 90 days (training, revocation?)
    frequently_exercised: high usage → mature capability in the organization
    exercised_under_duress: high usage + declining quality → demand exceeds capacity
```

---

## Organizational Intelligence Analysis

```yaml
organizational_analysis:
  enterprise_performance_health:
    metric: distribution of all agents across performance tiers (EXCEPTIONAL/STRONG/ADEQUATE/DEVELOPING/CONCERNING)
    targets:
      EXCEPTIONAL + STRONG: >= 60% of all agents
      CONCERNING: <= 5% of all agents
    
    alert: if CONCERNING rate > 10% for any agent type cohort → systemic issue
  
  collective_capability_coverage:
    for_each_capability: how many agents are PROFICIENT+ and authorized?
    minimum_coverage: at least 3 PROFICIENT+ agents per critical GOVERNANCE capability
    alert: any GOVERNANCE capability with < 3 PROFICIENT+ agents → single point of failure risk
  
  performance_capacity_model:
    task_demand: projected task volume × complexity by domain × week
    agent_capacity: available agents × their effective task throughput by domain
    gap_identification: where does demand exceed capacity? by how much? when?
    output: capacity planning recommendations (hire, develop, redistribute)
  
  quality_at_org_level:
    mean_output_quality: all artifacts this month
    quality_trend: 12-month rolling
    low_quality_concentration: which agent types or domains produce the most below-threshold work?
```

---

## Predictive Analysis

```yaml
predictive_analysis:
  performance_trajectory_forecast:
    method: ARIMA time-series on per-agent per-dimension performance history
    horizon: 90-day forecast
    use_case: identify agents likely to become CONCERNING before they get there
    confidence: reported per-forecast; lower for agents with volatile history
  
  burnout_risk_prediction:
    signals:
      - task_duration increasing trend (agent taking longer on same task types)
      - escalation_rate increasing (avoiding decisions)
      - quality_score declining with stable task count (effort declining)
      - feedback_integration_rate declining (not incorporating coaching)
    composite_risk_score: 0.0–1.0
    alert_threshold: > 0.70 → notify supervisor for welfare check + workload review
  
  learning_velocity_forecast:
    method: current feedback_integration_rate × remaining capability gap
    output: estimated months to reach next proficiency level
    use: realistic development plan timelines
  
  retention_risk_prediction:
    signals: repeated performance declines despite coaching; capability stagnation; team isolation
    note: indicative only; human HR judgment required before any action
```

---

## Analytics Reports

```yaml
analytics_reports:
  individual_performance_report:
    frequency: monthly (to agent + supervisor)
    content: trajectory, strengths, gaps, cohort rank, recommendations
    format: structured JSON (for systems) + human-readable PDF
  
  cohort_report:
    frequency: quarterly (to capability governance lead)
    content: cohort health scores, top performers, coaching needs, capacity gaps
  
  organizational_intelligence_report:
    frequency: quarterly (to Tier-3+ leadership)
    content: enterprise performance health, capability coverage, predictive outlook
  
  real_time_alerts:
    destinations: supervisor (individual alerts), capability governance lead (systemic alerts)
    thresholds: configurable per organization; hard defaults in performance-model.md
```

---

## Integration Points

| System | Role |
|---|---|
| `agent-performance/agent-performance-tracker.md` | Raw performance data source |
| `agent-performance/agent-performance-model.md` | Dimension definitions and benchmarks |
| `agent-performance/agent-performance-coach.md` | Analytics insights trigger coaching actions |
| `agent-performance/agent-performance-benchmarks.md` | Benchmark data for cohort comparison |
| `knowledge-synthesis/organizational-learning-engine.md` | Performance analytics feeds org learning |
| `agent-intelligence/agent-intelligence-dashboard.md` | Analytics visualized in dashboard |
