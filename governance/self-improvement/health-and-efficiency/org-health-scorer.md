# Organizational Health Scorer

**Component:** RSI-HE-001 | **Owner:** Meta-Org | **Tier:** T3 | **Class:** ELEVATED

## Role
Computes a composite, multi-dimensional organizational health score for every team, org unit, and the enterprise as a whole. Produces the primary health signal consumed by the self-improvement engine, escalation systems, and executive dashboard. Health score degrades are the most common triggers for improvement proposals.

---

## Health Score Model

```
COMPOSITE HEALTH SCORE = Σ(dimension × weight) − penalties

DIMENSIONS:
  delivery_health          0.25  Are teams delivering on commitments?
  quality_health           0.20  Is the work meeting quality standards?
  operational_health       0.20  Are production systems healthy?
  governance_health        0.15  Is the governance layer functioning?
  people_health            0.10  Are teams engaged and stable?
  learning_health          0.10  Is the org getting better over time?

HARD-CAP PENALTIES (reduce score regardless of other dimensions):
  -0.30 if any bus_factor = 1 (critical knowledge concentration)
  -0.25 if any SEV1 incident in last 7 days
  -0.20 if any constitutional violation in last 30 days
  -0.15 if any regulatory deadline missed in last 90 days
  -0.10 if adaptation fatigue signals >= 3 (MODERATE fatigue)

SCORE RANGE: 0.0–1.0
FLOOR: 0.20 (even with multiple penalties; signals investigation, not shutdown)
```

---

## Dimension Definitions

### Delivery Health (0.25)
```
INPUTS:
  sprint_completion_rate: % of sprint commitment completed (target >= 0.85)
  carryover_rate: % of work carried to next sprint (target < 0.15)
  milestone_on_time_rate: % of milestones hit within ±1 sprint (target >= 0.80)
  dependency_fulfillment_rate: % of commitments to other teams met (target >= 0.90)
  initiative_completion_rate: % of quarterly initiatives completed (target >= 0.70)

SCORING:
  All at target: 1.0
  Each metric 10% below target: -0.08
  Any metric below 0.50: delivery_health capped at 0.50
```

### Quality Health (0.20)
```
INPUTS:
  evaluation_score_avg: avg output quality across all workflow steps (target >= 0.80)
  gate_first_pass_rate: % of gate submissions passing first attempt (target >= 0.75)
  production_incident_rate: incidents attributable to this team's code (target < 0.05/sprint)
  post_release_bug_rate: P1/P2 bugs found post-release (target < 2/sprint)
  technical_debt_ratio: % of capacity spent on tech debt vs. planned (target <= 0.20)

SCORING:
  evaluation_score strongest predictor: weight 0.40 within quality dimension
  incident_rate most penalized: rate > 0.10/sprint → quality_health capped at 0.60
```

### Operational Health (0.20)
```
INPUTS:
  slo_compliance_rate: % of owned services meeting SLO (target >= 0.95)
  error_budget_status: GREEN/YELLOW/ORANGE/RED (from PB-019)
  mttr_avg: mean time to recovery for team's incidents (target < 30min)
  on_call_load: off-hours pages per week (target <= 3)
  deployment_success_rate: % of deployments not requiring rollback (target >= 0.95)

SCORING:
  SLO compliance and error budget: 0.50 within operational dimension
  MTTR > 60min: operational_health capped at 0.70
```

### Governance Health (0.15)
```
INPUTS:
  constitutional_clearance_rate: % of outputs constitutional check passes (target >= 0.99)
  gate_compliance_rate: % of required gates being used (target = 1.00)
  approval_sla_compliance: % of approvals completed within SLA (target >= 0.95)
  audit_trail_coverage: % of actions with complete audit trail (target >= 0.99)
  policy_adherence_rate: % of actions adhering to active policies (target >= 0.99)

SCORING:
  constitutional_clearance below 0.99: governance_health capped at 0.70
  gate_compliance below 1.00: governance_health capped at 0.75
```

### People Health (0.10)
```
INPUTS:
  engagement_score: quarterly survey-based engagement (target >= 7.0/10)
  attrition_rate: voluntary attrition annualized (target < 0.12)
  adaptation_capacity: from org-adaptation-engine.md (target >= 0.70)
  velocity_stability: velocity std_dev / velocity_mean (target < 0.20; low variance = stable)
  1on1_completion_rate: % of scheduled 1:1s completed (target >= 0.85)

SCORING:
  Engagement below 5.0: people_health capped at 0.50
  Attrition > 0.30 in quarter: -0.30 penalty
```

### Learning Health (0.10)
```
INPUTS:
  improvement_adoption_rate: % of improvement proposals adopted (target >= 0.70)
  forecast_accuracy_trend: is forecasting getting better over time? (target: improving)
  capability_development_rate: new capabilities added per quarter (target >= 2)
  postmortem_action_closure: % of postmortem actions completed within SLA (target >= 0.90)
  knowledge_freshness_score: age of wiki pages in use (target: < 30% stale)

SCORING:
  postmortem_action_closure below 0.50: learning_health capped at 0.60
  No improvement proposals adopted in quarter: learning_health capped at 0.60
```

---

## Health Tiers

```
SCORE       TIER          INTERPRETATION                  AUTO-ACTION
──────────────────────────────────────────────────────────────────────────────────────────────
0.85–1.00   THRIVING      Exemplary performance           Continue; share learnings
0.70–0.84   HEALTHY       On-track; minor optimizations   Monitor; standard improvement cycle
0.55–0.69   WATCH         Below target; intervention needed  Improvement proposal generated
0.40–0.54   DISTRESSED    Multiple dimensions failing     T3 escalation; coaching plan
0.20–0.39   CRITICAL      Severe multi-dimensional issues  T4 emergency; executive attention
< 0.20      CRISIS        Comprehensive failure           CEO notification; emergency plan
```

---

## Reporting

```
TEAM SCORECARD: Generated weekly; visible to team lead + manager + T3+
  Format: dimension scores + overall + trend (last 4 weeks) + top 3 improvement areas

ORG SCORECARD: Generated monthly; visible to T4+
  Format: team distribution (histogram) + org avg + worst/best teams + trend

EXECUTIVE HEALTH BRIEF: Generated weekly for T4+; daily for T5 if any team CRITICAL
  Format: top-line score + critical alerts + improvement activity summary

PRIVACY RULES (people-intelligence-governance.md):
  Individual dimension scores not shared across teams without consent
  T1/T2 agents see only own-team aggregate score
  T3 sees own-org scores; T4 sees all
```

---

## Health Metrics (of the scorer itself)

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Score freshness (all teams)             < 24hr old
Score coverage (teams with scores)      = 100%
Prediction accuracy (DISTRESSED/CRITICAL predicts incident) >= 0.70
False alarm rate (CRITICAL with no incident) < 0.15
Score computation time                  < 5 minutes for full org
```
