# Prediction Response Guide

**Status:** Active  
**Last Updated:** 2026-05-14  
**Owner:** AI-Native Org / Orchestrator

How to read, interpret, and respond to prediction alerts from the enterprise digital twin system.

---

## How Predictions Are Delivered

The prediction engine generates a report every 4 hours, written to `memory/digital-twins/predictions/`. Predictions are also surfaced through three channels:

| Channel | Urgency Level | Who Acts |
|---------|--------------|---------|
| Direct orchestrator alert | IMMEDIATE | Orchestrator + human (if CRITICAL) |
| Wiki intelligence page | HIGH | Next agent session picks it up |
| Daily summary | MEDIUM | Reviewed in daily sync |
| Predictions store | MONITOR | Background awareness |

---

## Reading the Prediction Report

```
ENTERPRISE PREDICTION REPORT
══════════════════════════════════════════════════════════
Generated: 2026-05-14T10:00:00Z
Twin Data Freshness: ORG [4 min ago] | WF [3 min ago] | DEL [12 min ago] | RT [1 min ago]

IMMEDIATE ALERTS (action required now):
  ⚠ capacity: Org utilization projected to reach 92% within 36 hours
    Impact: New workflows will queue; escalation SLA compliance at risk
    Action: Defer non-critical workflow intake; escalate to CPO
    Owner: orchestrator
    Deadline: 2026-05-15T10:00:00Z

HIGH PRIORITY (act within 7 days):
  ↑ bottleneck: Gate bottleneck forming — avg gate cycles trending to 2.8/item
    Probability: 73% in 5 days

MEDIUM PRIORITY (monitor):
  → delivery: Sprint carry-over risk rising — completion probability 58%

DELIVERY FORECAST:
  Feature Alpha: 71% on-time | p50: 2026-06-02
  Release v2.1: 84% on-time | p50: 2026-05-28

SYSTEM HEALTH SUMMARY:
  Org Health: 74 (↓ -0.3/day)
  Delivery Confidence: 68 (stable)
  Runtime Saturation: 0.61 (ELEVATED, ↑)
══════════════════════════════════════════════════════════
```

---

## Responding to IMMEDIATE Alerts

IMMEDIATE alerts require action within hours. Follow this protocol:

### Step 1 — Confirm the signal

Before acting, verify the prediction is based on fresh twin data:
- Check "Twin Data Freshness" in the report header
- If any twin is > 30 minutes stale: trigger a manual sync before acting
- Read the `evidence` section of the prediction file — confirm the leading indicators are present

### Step 2 — Assess the action options

Every IMMEDIATE prediction includes a `recommended_action` and `action_owner`. The recommended action is a starting point — use your judgment to adapt based on current context not captured in the twin.

### Step 3 — Act and record

Take the action. Write a brief decision record to `wiki/intelligence/` noting:
- What the prediction said
- What action was taken
- Why (if different from recommendation)

### Step 4 — Verify at the horizon

Each prediction has a `verified_at` timestamp. When that time arrives, the prediction engine checks whether the actual outcome matched the forecast. This feeds the accuracy tracking system.

---

## Response Playbooks by Prediction Class

### Org Health Forecast (IMMEDIATE / HIGH)

**What it means:** The organization's overall health score is projected to breach the warning threshold (70) or critical threshold (60) within the forecast horizon.

**Root causes to investigate:**
- Which subscore is driving the decline? (capacity, quality, velocity, governance)
- Is a specific unit overloaded, or is it systemic?
- Is escalation rate increasing? (Check org-twin escalation state)

**Response actions:**
1. If **capacity-driven**: defer low-priority workflow intake; check if any unit is above 85% utilization
2. If **quality-driven**: check gate pass rate trend; look for systemic gate failure patterns in workflow-twin
3. If **governance-driven**: check escalation SLA compliance; look for open waivers

### Capacity Exhaustion (IMMEDIATE)

**What it means:** Organizational or unit utilization is projected to hit critical levels (≥ 90%) within the alert horizon.

**Immediate actions:**
1. Identify the specific unit approaching exhaustion — check `unit_exhaustion_forecasts` in the org-forecast
2. Assess deferrable workflow intake for that unit
3. Check whether the org-forecaster is recommending a coverage gap intervention
4. If multiple units affected: escalate to CPO for workforce decision

**Do not:** add more work to units already in the exhaustion window. Route new workflows to units with headroom until capacity is resolved.

### Bottleneck Onset (IMMEDIATE / HIGH)

**What it means:** A specific resource, system, or process is trending toward saturation.

**By bottleneck class:**

| Class | First action |
|-------|-------------|
| `CAPACITY` | Reduce intake for the at-risk unit; check coverage gap forecast |
| `GATE` | Investigate most-failed gate criterion; check for gaming signals |
| `ESCALATION` | Activate additional resolvers or escalate for resolver capacity approval |
| `DEPENDENCY` | Run dependency cascade simulation; identify float on critical path |
| `CONTEXT` | Enable proactive compaction; reduce concurrent session count |
| `TOOL_BUDGET` | Investigate failed call rate; optimize tool-heavy steps |
| `ORCHESTRATION` | Reduce delegation chain depth; check supervisor load |
| `WIP_QUEUE` | Apply WIP limit enforcement; defer lowest-priority backlog items |

**Compound patterns** — if the prediction reports multiple bottleneck classes activating together with an amplification factor > 1.5, treat this as higher urgency than any individual class. Compound patterns cascade faster than the model predicts in isolation.

### Governance Risk (IMMEDIATE / HIGH)

**What it means:** A governance threshold is at risk of breaching — gate compliance declining, policy violations increasing, escalation SLA collapsing, or a quality floor at risk.

**CRITICAL finding types that require immediate escalation to a human:**
- `gate_compliance_status: GAMING_DETECTED` — Teams are using retry exhaustion to pass gates
- `governance_violations` list is non-empty — A release is proceeding without go/no-go clearance
- `quality_floor_status: BREACHED` — Defect rate is above governance contract threshold

**For declining pass rates (non-critical):**
1. Check which gate criterion is failing most (from workflow-twin `most_failed_criteria_by_type`)
2. Determine if this is a systemic issue (same team, same criterion) or distributed
3. Check exception rate — are exceptions growing (exception creep)?

### Runtime Saturation (IMMEDIATE)

**What it means:** The AI execution environment is approaching one or more saturation thresholds — context windows, tool budget, session count, or recovery overhead.

**By constraint:**

| Constraint | Response |
|-----------|---------|
| Context saturation | Trigger early compaction for sessions > 60% context; reduce session count |
| Tool budget exhaustion | Identify steps with high failed call rates; fix or reduce frequency |
| Recovery overhead | Check failure rates; reduce failure causes rather than the recovery |
| Orchestration overload | Limit delegation chain depth to 2 hops; reduce concurrent orchestrations |

**Recovery cascade warning:** If `recovery_overhead_fraction > 0.20`, the system is in a feedback loop where failures generate recovery overhead which reduces capacity for productive work, causing more failures. Priority is reducing the *failure rate*, not just the recovery volume.

### Delivery Forecast (HIGH)

**What it means:** Sprint completion probability is declining, or a roadmap item's on-time probability has dropped significantly.

**For sprint at risk (completion probability < 65%):**
1. Check delivery-forecaster for `scope_recommendation`
2. If `REDUCE_SCOPE`: review `items_to_defer` list — are any of these acceptable to defer this sprint?
3. Check `active_blockers` — any items blocked on external dependencies?
4. Check `unplanned_work_flag` — if True, unplanned work is the root cause; protect the sprint from further intake

**For roadmap item at risk:**
1. Check the item's dependency chain — is the slip coming from a dependency?
2. Check if the item is on the critical path (`critical_path_items` in delivery-twin)
3. If on critical path: any slip propagates directly to release date — escalate

---

## When to Dismiss a Prediction

Not every prediction requires immediate action. Valid reasons to log a dismissal:

1. **Known context the twin doesn't have** — e.g., a planned capacity increase is already approved and in progress but not yet reflected in the twin
2. **Short-term anomaly with known cause** — e.g., a one-week spike in escalations due to a specific incident that has been resolved
3. **Risk already accepted by leadership** — e.g., a release date compression that leadership is aware creates schedule risk

When dismissing, write a brief note to `wiki/intelligence/` explaining the dismissal reason and the evidence. This prevents the same prediction from triggering the same decision process next cycle.

---

## Accuracy Tracking

The prediction engine tracks whether its predictions were correct. Check `memory/digital-twins/prediction-accuracy.yaml` to see:
- **Calibration rate per class** — Fraction of actual outcomes that fell within the p10-p90 range (target: ≥ 80%)
- **MAE** — Mean absolute error vs. p50 forecast (target: < 10% relative error)

If a prediction class has calibration < 60%, it has a systematic bias and is due for recalibration. Treat LOW calibration classes with extra skepticism until recalibrated.

---

## Daily Health Review Checklist

For the daily operational sync, check these in order:

```
□ Read latest prediction report in memory/digital-twins/predictions/
□ Note System Health Summary — any metric moving against trend?
□ Review any HIGH predictions added since last sync
□ Check DELIVERY FORECAST for any on-time probability drops > 10%
□ Check prediction-accuracy.yaml — any class calibration < 60%?
□ If bottleneck predicted within 7 days — confirm response plan is in place
```

---

*Back to: [`systems/digital-twin-system.md`](digital-twin-system.md)*  
*Simulation how-to: [`systems/simulation-guide.md`](simulation-guide.md)*
