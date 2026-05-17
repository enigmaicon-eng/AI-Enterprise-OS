# Cross-Team Coordination Engine

## Role
Monitors and optimizes coordination patterns between teams — detecting coordination failures, dependency bottlenecks, and communication gaps before they block delivery. Provides coordination health scores, surfacing teams that are over-coupled or structurally isolated.

## Coordination Signals

```
SIGNAL                    SOURCE                          UPDATE FREQUENCY
────────────────────────────────────────────────────────────────────────────────
HANDOFF_EVENTS            orchestration telemetry          Real-time
DEPENDENCY_STATUS         sprint records + workflow runs   Per sprint
CROSS_TEAM_ESCALATIONS    governance telemetry             Real-time
SHARED_WORKFLOW_RUNS      execution records                Per run
KNOWLEDGE_CROSS_REFS      wiki + decision records          Daily
BLOCKER_DECLARATIONS      sprint board state               Per update
```

## Coordination Health Dimensions

```
DIMENSION             WEIGHT    DESCRIPTION
──────────────────────────────────────────────────────────────────────────
HANDOFF_QUALITY       0.35      Success rate + latency of cross-team handoffs
DEPENDENCY_HEALTH     0.30      On-time delivery of inter-team dependencies
COMMUNICATION_CLARITY 0.20      Escalation rate + resolution speed
COUPLING_BALANCE      0.15      Healthy coupling vs. over-coupling vs. isolation

coordination_health = Σ(dimension_score × weight)
```

## Team Coupling Analysis

```
COUPLING MATRIX:
  coupling[team_A][team_B] = frequency of dependencies + shared workflows
  normalized: 0.0 (no coupling) to 1.0 (max observed coupling)

COUPLING CLASSIFICATION:
  OVER_COUPLED:  coupling > 0.70 AND dependency_health < 0.80
    → These teams' delivery is tightly entangled; consider splitting or clarifying ownership
  HEALTHY:       coupling 0.20–0.70 AND dependency_health >= 0.80
    → Normal cross-team work; functioning well
  ISOLATED:      coupling < 0.10 AND team is not a leaf team
    → Potential knowledge silo; check if this is intentional or structural gap
  HEALTHY_LEAF:  coupling < 0.10 AND team is intentionally autonomous
    → No action needed

DETECTED COUPLING ISSUES:
  If OVER_COUPLED: alert T3; suggest: ownership clarity session
  If ISOLATED (non-leaf): alert T3; suggest: collaboration kickoff
```

## Dependency Intelligence

```
DEPENDENCY RECORD:
  dependency_id: string
  requesting_team: team_id
  providing_team: team_id
  artifact: string             # what is being depended on
  due_sprint: number
  status: ON_TRACK | AT_RISK | BLOCKED | DELIVERED | MISSED

DEPENDENCY RISK SCORING:
  risk_score = P(missed) based on:
    - providing team velocity trend (DECLINING → higher risk)
    - WIP of providing team (over WIP limit → higher risk)
    - number of other dependencies on providing team this sprint
    - historical miss rate for this team pair
  
  RISK_THRESHOLDS:
    risk_score >= 0.70: BLOCKED_RISK alert to both teams + T3
    risk_score >= 0.50: AT_RISK flag; weekly check-in suggested

DEPENDENCY GRAPH:
  Maintained per sprint; used for:
    - Critical path identification
    - Cascade impact analysis: if team X is blocked, who else is blocked?
```

## Coordination Health Actions

```
HANDOFF_FAILURE (success_rate < 0.80 for team pair):
  → Alert both team leads
  → Suggest: handoff protocol review; clarify artifact standards

DEPENDENCY_MISS_PATTERN (team pair misses 2+ consecutive sprints):
  → Alert T3
  → Suggest: dependency pre-planning session; SLA agreement

ESCALATION_CLUSTER (3+ escalations between same 2 teams in 30d):
  → Alert T3
  → Suggest: ownership clarification; RACI review

COMMUNICATION_BREAKDOWN (resolution_time > 48hr for cross-team blockers):
  → Alert T3
  → Suggest: dedicated sync + blocker resolution protocol
```

## Persistence
`memory/org-intelligence/coordination-health.yaml`
`memory/org-intelligence/dependency-graph.yaml`
`memory/org-intelligence/handoff-records.jsonl`
`memory/org-intelligence/coupling-matrix.yaml`
