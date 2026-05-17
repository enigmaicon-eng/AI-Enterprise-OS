# Org Performance Model

## Role
Aggregates team-level performance and health signals into organization-level intelligence. Tracks org-wide delivery capacity, quality posture, governance health, and strategic execution progress. Provides the executive view without exposing individual team-level details beyond authorized roles.

## Org Performance Dimensions

```
DIMENSION               WEIGHT    AGGREGATION METHOD         DATA SOURCE
──────────────────────────────────────────────────────────────────────────────────
DELIVERY_HEALTH         0.25      Weighted avg by team size  team-performance-model
QUALITY_POSTURE         0.20      Weighted avg by output vol evaluation records
GOVERNANCE_COMPLIANCE   0.20      Pct compliant / total      governance telemetry
STRATEGIC_VELOCITY      0.15      OKR progress rate          sprint + roadmap data
TEAM_HEALTH_AGG         0.10      % of teams STABLE+         team-health-scorer
KNOWLEDGE_GROWTH        0.05      Wiki + decision capture    knowledge management
AGENT_ADOPTION          0.05      % work AI-assisted         execution records

org_performance_score = Σ(dimension_score × weight)
```

## Org Health Tiers

```
TIER        SCORE     EXECUTIVE LABEL       BOARD-LEVEL INTERPRETATION
─────────────────────────────────────────────────────────────────────────────
EXCELLENT   >= 0.85   Operating at Scale    Execution machine; competitive advantage
HEALTHY     0.70–0.84 On Track              Reliable execution; sustainable growth
DEVELOPING  0.55–0.69 Improving             Friction present; investment paying off
AT_RISK     0.40–0.54 Needs Attention       Systemic issues; executive action required
CRITICAL    < 0.40    Crisis                Intervention required; board notification
```

## Org Performance Record

```yaml
org_performance_record:
  record_id: string
  period: {from: ISO8601, to: ISO8601}
  period_type: SPRINT | MONTH | QUARTER | YEAR
  
  scores:
    delivery_health: number
    quality_posture: number
    governance_compliance: number
    strategic_velocity: number
    team_health_agg: number
    knowledge_growth: number
    agent_adoption: number
    composite: number
  
  tier: ORG_TIER
  tier_change: IMPROVED | STABLE | DEGRADED | null
  
  team_distribution:
    exemplary_count: number
    high_count: number
    standard_count: number
    developing_count: number
    at_risk_count: number
  
  dora_metrics:
    deployment_frequency: number       # deploys per week
    lead_time_for_changes_hours: number
    change_failure_rate: number
    mttr_hours: number
  
  highlights: [string]                 # 2–3 top achievements
  risks: [string]                      # 2–3 top risks
  
  generated_at: ISO8601
```

## DORA Metrics Computation

```
DEPLOYMENT_FREQUENCY:
  count of production deployments / reporting_period_days × 7
  ELITE: > 1/day; HIGH: 1/week; MEDIUM: 1/month; LOW: < 1/month

LEAD_TIME_FOR_CHANGES:
  median(workflow_approved_for_deploy - workflow_created) in hours
  ELITE: < 1hr; HIGH: < 1day; MEDIUM: < 1week; LOW: > 1week

CHANGE_FAILURE_RATE:
  deployments_triggering_incident / total_deployments
  ELITE: < 5%; HIGH: < 10%; MEDIUM: < 15%; LOW: >= 15%

MTTR (MEAN TIME TO RESTORE):
  avg(incident_resolved_at - incident_declared_at) in hours
  ELITE: < 1hr; HIGH: < 1day; MEDIUM: < 1week; LOW: > 1week

DORA_BAND: all 4 in ELITE = ELITE; any LOW = LOW; else interpolate
```

## Org Performance Reporting

```
MONTHLY ORG REPORT:
  Audience: T4+ leadership
  Sections: overall score + tier, DORA metrics, team distribution,
            strategic velocity vs. OKRs, governance posture, top risks

QUARTERLY DEEP DIVE:
  Audience: T4+ + board summary
  Sections: all monthly content + YoY trends, DORA benchmark vs. industry,
            team health trends, strategic initiative progress,
            hiring/capacity recommendations

EXECUTIVE DASHBOARD:
  Real-time: org_performance_score, tier, DORA band
  Updated: hourly (score) + per sprint (narrative)
```

## Persistence
`memory/org-intelligence/org-performance-records.yaml`
`memory/org-intelligence/dora-metrics.yaml`
`memory/org-intelligence/org-performance-history.jsonl`
