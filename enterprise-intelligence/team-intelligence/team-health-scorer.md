# Team Health Scorer

## Role
Computes and tracks holistic team health beyond delivery metrics — capturing sustainability, morale signals, psychological safety indicators, and operational wellbeing. Provides early warning of team health degradation before it manifests as attrition or delivery failure.

## Team Health Dimensions

```
DIMENSION              WEIGHT    SIGNAL SOURCE                          POLARITY
────────────────────────────────────────────────────────────────────────────────────
SUSTAINABILITY         0.25      Utilization rate, overtime indicators   High = good
PREDICTABILITY         0.20      Carry-over rate, commit accuracy        High = good
PROCESS_CLARITY        0.15      Escalation rate, rework rate            Low = good
COLLABORATION_HEALTH   0.15      Handoff success, cross-team sentiment   High = good
LEARNING_INVESTMENT    0.10      Training hours, wiki contributions      High = good
INTERRUPTION_LOAD      0.10      Unplanned work rate, interrupt patterns Low = good
GOVERNANCE_BURDEN      0.05      Governance overhead hours / net capacity Low = good

team_health_score = Σ(dimension_health × weight)
```

## Health Tier Definitions

```
TIER          SCORE     LABEL          INDICATORS
────────────────────────────────────────────────────────────────────────────
THRIVING      >= 0.82   Healthy        Sustainable pace; learning; low interrupts
STABLE        0.65–0.81 OK             Normal ops; minor friction; manageable load
STRAINED      0.50–0.64 Watch          Overutilization OR high interrupts OR low learning
DISTRESSED    0.35–0.49 Intervene      Multiple dimensions degraded; T3 coaching recommended
CRITICAL      < 0.35    Escalate       Systemic dysfunction; T4 review required
```

## Sustainability Scoring

```
SUSTAINABILITY:
  utilization_score:     1.0 if 0.70-0.85; decreases outside this band
    UNDER (< 0.60):      utilization_score = utilization_rate / 0.60
    OPTIMAL (0.60–0.90): utilization_score = 1.0 (slight reduction above 0.85)
    OVER (> 0.90):       utilization_score = max(0.30, 1.0 - (utilization - 0.90) × 5)
  
  sprint_overtime_proxy: avg cycle time extending into weekends (if detectable from run timestamps)
  
  sustainability_score = utilization_score × 0.70 + (1 - sprint_overtime_proxy) × 0.30
```

## Early Warning System

```
HEALTH SIGNALS MONITORED (continuous):
  
  OVERLOAD PATTERN:
    utilization > 0.90 for 2 consecutive sprints
    → WARNING: "Team operating above sustainable pace"
    → Recommendation: reduce sprint commitment; review interrupt load
  
  LEARNING ATROPHY:
    training_hours = 0 AND wiki_contributions < 2 for 3 consecutive sprints
    → WARNING: "No evidence of learning investment"
    → Recommendation: schedule learning time; set wiki contribution goal
  
  REWORK SPIRAL:
    rework_rate > 0.25 AND gate_pass_rate < 0.70 for 2 consecutive sprints
    → WARNING: "Quality degradation + rework spiral detected"
    → Recommendation: root cause analysis; reduce WIP; add review checkpoints
  
  INTERRUPT FLOOD:
    interrupt_rate > 0.35 for 3 consecutive sprints
    → WARNING: "Interrupt load preventing planned work"
    → Recommendation: interrupt triage process; escalation channel review
  
  COLLABORATION BREAKDOWN:
    handoff_success_rate < 0.75 for 2 consecutive sprints
    → WARNING: "Cross-team collaboration degrading"
    → Recommendation: handoff protocol review; dependency planning session
  
  DISTRESSED TIER:
    team_health_score < 0.50 AND at least 2 dimensions RED
    → ESCALATE to T3; coaching session scheduled automatically
```

## Team Health Report

```
GENERATED: per sprint end; quarterly deep-dive
AUDIENCE: team lead + T3 manager (DISTRESSED/CRITICAL: T4)
SECTIONS:
  1. Health score this sprint vs. last sprint vs. 4-sprint trend
  2. Dimension heatmap (GREEN/YELLOW/RED per dimension)
  3. Active early warnings (with recommended actions)
  4. Top strength this quarter (for recognition)
  5. Focus area for next sprint (1 specific, actionable item)
  
PRIVACY:
  Report goes to team lead; NOT shared across teams
  Aggregate org-level metrics only in org-intelligence (no team-identifiable health data)
  DISTRESSED/CRITICAL: T3 sees team name; T4 sees team only if escalation authorized
```

## Persistence
`memory/team-intelligence/team-health-scores.yaml`
`memory/team-intelligence/health-history.jsonl`
`memory/team-intelligence/early-warnings.yaml`
