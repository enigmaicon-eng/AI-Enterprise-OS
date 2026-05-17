# Predictive Work Planner

## Role
Provides AI-assisted work planning intelligence for sprint and quarterly planning. Combines velocity forecasts, capacity models, dependency risk, bottleneck predictions, and historical patterns to produce risk-weighted sprint plans and flag over-commitment before it becomes a delivery miss.

## Planning Intelligence Layers

```
LAYER             SOURCE                              CONTRIBUTION
─────────────────────────────────────────────────────────────────────────────
VELOCITY          velocity-intelligence-engine        Throughput estimate ± CI
CAPACITY          capacity-intelligence-engine        Available hours / points
DEPENDENCY RISK   dependency-intelligence-engine      Risk-weighted delivery dates
BOTTLENECK RISK   bottleneck-intelligence-engine      Predicted constraints
FLOW DEBT         flow-efficiency-engine              In-flight items reducing capacity
PATTERN RISK      work-pattern-miner                 Historical failure patterns in plan
HISTORICAL FIT    work-analytics-engine               How similar sprints performed
```

## Sprint Plan Assessment

```
PLAN ASSESSMENT PROTOCOL:
  INPUT: proposed sprint backlog (work items, sizes, owners)
  
  STEP 1: CAPACITY CHECK
    net_available_points = sustainable_velocity × capacity_adjustment_factor
    over_committed = committed_points > net_available_points × 1.15
    
  STEP 2: DEPENDENCY RISK SCAN
    For each item with external dependency:
      fetch dependency.risk_score
      IF risk_score >= 0.65: flag as HIGH RISK
      IF critical_path_slack <= 3d: flag CRITICAL
    
  STEP 3: FLOW DEBT CARRYOVER
    aging_items + blocked_items from current sprint
    estimated_carryover_points = flow_debt_items × avg_points_per_item
    adjusted_available = net_available_points - estimated_carryover_points
    
  STEP 4: PATTERN RISK SCAN
    Check committed items against known FAILURE_PRECURSOR patterns
    If match: flag "This work sequence has {N}% failure rate based on {N} historical instances"
    
  STEP 5: RISK SCORE COMPUTATION
    sprint_risk_score = P(sprint completes committed work)
    Factors: over_commitment, dependency_risk, flow_debt, pattern_risk
    
  STEP 6: PLAN RECOMMENDATION
    CONFIDENCE >= 0.85: PROCEED — plan looks achievable
    0.70–0.84:           CAUTION — address flagged risks before committing
    < 0.70:              RISKY — recommend scope reduction; surface to T2
```

## Sprint Risk Report

```yaml
sprint_risk_report:
  sprint_id: string
  team_id: string
  generated_at: ISO8601
  
  capacity:
    gross_capacity_points: number
    net_available_points: number
    committed_points: number
    over_commitment_pct: number
  
  dependency_risks:
    high_risk_count: number
    items: [{item_id, dependency_id, risk_score, recommended_buffer_days}]
  
  flow_debt_carryover:
    estimated_carryover_points: number
    blocking_items: number
  
  pattern_risks:
    patterns_matched: number
    items: [{item_id, pattern_id, failure_rate, recommended_action}]
  
  sprint_confidence: number       # 0.0–1.0
  risk_level: LOW | MEDIUM | HIGH | CRITICAL
  
  recommendations: [{priority, action, expected_impact}]
```

## Quarterly Planning Intelligence

```
QUARTER PLAN ASSESSMENT:
  Initiative feasibility: can we complete initiative X given velocity + capacity?
  Critical path: what is the longest sequence of dependencies in this quarter?
  Hiring impact: if we hire N people in month 2, when does capacity improve?
  Risk scenarios: best/base/worst case velocity → initiative completion dates

QUARTER INTELLIGENCE REPORT:
  Audience: T3+ for planning; T4 for resource decisions
  Includes:
    - Initiative delivery confidence per initiative
    - Hiring recommendations (when to hire for which team)
    - Dependency critical path visualization
    - Top 3 risks to quarterly goals
    - Capacity utilization forecast (over/under by team)
```

## Persistence
`memory/work-cognition/sprint-risk-assessments.yaml`
`memory/work-cognition/quarterly-plans.yaml`
`memory/work-cognition/planning-accuracy-history.jsonl`
