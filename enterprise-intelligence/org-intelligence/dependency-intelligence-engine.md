# Dependency Intelligence Engine

## Role
Provides deep visibility into the full dependency graph across teams, sprints, and strategic initiatives. Detects critical path bottlenecks, cascade risks, circular dependencies, and chronically unreliable dependency pairs. Feeds sprint planning with risk-weighted dependency assessments.

## Dependency Graph Model

```yaml
dependency:
  dependency_id: string          # UUID
  type: TEAM_TO_TEAM | WORKFLOW_TO_WORKFLOW | FEATURE_TO_FEATURE | INITIATIVE_TO_INITIATIVE
  
  requester:
    team_id: string
    sprint_id: string
    artifact_description: string
    
  provider:
    team_id: string
    sprint_id: string
    committed: boolean
    commitment_date: ISO8601
  
  due_date: ISO8601
  priority: P1 | P2 | P3
  
  status:
    current: ON_TRACK | AT_RISK | BLOCKED | DELAYED | DELIVERED | CANCELLED
    risk_score: number           # 0.0–1.0
    blocker_reason: string       # if BLOCKED
    days_delayed: number         # if DELAYED
  
  history:
    created_at: ISO8601
    last_updated: ISO8601
    status_changes: [{timestamp, from, to, reason}]
```

## Critical Path Analysis

```
CRITICAL PATH ALGORITHM:
  Input: dependency graph for current sprint + initiative
  Method: Longest path in DAG (CPM — Critical Path Method)
  Output: ordered list of dependencies on critical path

CRITICAL PATH METRICS:
  critical_path_length_days:   sum of durations on critical path
  critical_path_slack_days:    days until deadline - critical_path_length
  critical_path_risk:          max risk_score on critical path
  
CRITICAL PATH ALERTS:
  slack <= 3 days: HIGH alert to all teams on critical path + T3
  slack <= 0 days: CRITICAL alert; T4 escalation; delivery at risk
  risk_score on critical path >= 0.65: AT_RISK alert
```

## Dependency Reliability Scoring

```
PER TEAM PAIR:
  historical_miss_rate:    missed_dependencies / total_dependencies (last 6 months)
  avg_delay_days:          avg days late when missed
  reliability_score:       1.0 - (historical_miss_rate × delay_weight)
  
RELIABILITY TIERS:
  RELIABLE:    reliability_score >= 0.85 (miss rate < 15%)
  VARIABLE:    reliability_score 0.65–0.84 (miss rate 15–35%)
  UNRELIABLE:  reliability_score < 0.65 (miss rate > 35%)

UNRELIABLE PAIR PROTOCOL:
  IF team pair classified UNRELIABLE:
    → Alert T3 for both teams
    → Add 20% buffer to estimated delivery dates for this pair
    → Suggest: dedicated dependency sync; SLA negotiation
    → Escalate after 3 consecutive missed dependencies to T4
```

## Cascade Impact Analysis

```
IMPACT ANALYSIS(blocked_dependency_id):
  1. Find all dependencies that depend on this delivery
  2. Recursive: find all transitive dependents
  3. For each:
     - identify team + sprint + artifact at risk
     - compute delay propagation: each hop adds avg_handoff_latency
  4. Output: cascade_impact_set with estimated delay per team

CASCADE ALERT THRESHOLDS:
  cascade_depth >= 3 hops:      HIGH alert
  teams_impacted >= 4:          CRITICAL alert → T4
  initiative_milestone_at_risk: CRITICAL alert → T4 immediately

EXAMPLE OUTPUT:
  BLOCKED: Team A → Team B (widget library, Sprint 12)
  CASCADE:
    Team C depends on Team B (3 features) → 5-day estimated delay
    Team D depends on Team C (release) → 8-day estimated delay
    RELEASE MILESTONE at risk: Q3 GA
  RECOMMENDED ACTION: T4 escalation; parallel path investigation
```

## Sprint Planning Dependency Assessment

```
PRE-SPRINT ASSESSMENT:
  For each dependency planned for sprint N:
    - Compute risk_score
    - Check provider team capacity (capacity-intelligence-engine)
    - Check provider team WIP load
    - Check provider team velocity trend
  
  OUTPUT per dependency:
    risk_level: LOW | MEDIUM | HIGH | CRITICAL
    recommendation: PROCEED | ADD_BUFFER | ESCALATE_BEFORE_COMMIT | DEFER

SPRINT DEPENDENCY REPORT:
  dependencies_this_sprint: N
  high_risk_dependencies: N (list with risk_scores)
  critical_path_identified: yes/no
  critical_path_slack: N days
  recommendations: [{dependency_id, recommendation, rationale}]
```

## Persistence
`memory/org-intelligence/dependency-registry.yaml`
`memory/org-intelligence/dependency-history.jsonl`
`memory/org-intelligence/reliability-scores.yaml`
`memory/org-intelligence/cascade-impact-log.jsonl`
