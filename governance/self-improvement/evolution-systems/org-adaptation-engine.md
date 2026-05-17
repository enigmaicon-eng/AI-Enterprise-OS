# Org Adaptation Engine

**Component:** RSI-EVO-003 | **Owner:** Meta-Org | **Tier:** T4 | **Class:** SENSITIVE

## Role
Manages the long-cycle organizational adaptation loop — tracking the organization's capacity to absorb change, monitoring adaptation fatigue, enforcing change velocity limits, and sequencing improvement proposals to maximize organizational receptivity and minimize disruption. Prevents improvement overload by governing the rate and type of changes imposed on the organization.

---

## The Adaptation Problem

```
RISK: If too many improvements are applied simultaneously, the organization cannot absorb them.
  - Teams in constant state of change → learning overhead exceeds productivity gain
  - Change fatigue → proposal rejection rate increases; quality of adoption decreases
  - Compounding uncertainty → teams unable to establish stable working patterns
  - Trust erosion → "the OS is always changing things"

SOLUTION: This engine governs WHEN and HOW MANY improvements are applied, not just WHAT.
  All proposals approved by authorization enter an adaptation queue here.
  This engine sequences them to maximize absorption while maintaining momentum.
```

---

## Adaptation Capacity Model

```
ORGANIZATIONAL ADAPTATION CAPACITY (per team, per sprint):
  Base_capacity = 1.0 (full capacity when no changes in progress)

  REDUCTION FACTORS:
    - Active structural change (team split/merge): -0.40 for 8 weeks
    - New member ramping (first 8 weeks): -0.15 per new member, max -0.30
    - Major workflow change in progress: -0.20 for 4 weeks
    - Recent high-complexity release: -0.15 for 2 weeks post-release
    - Active performance management situation: -0.25 for duration
    - On-call incident in last week: -0.10 for 1 week

  MINIMUM CAPACITY BEFORE NEW IMPROVEMENT APPLIED: 0.60
  (Below 0.60: defer improvement; add to backlog for next cycle)

  ORG-LEVEL CAPACITY: weighted average of all team capacities
  ORG MINIMUM: 0.65 before cross-team changes applied
```

---

## Adaptation Queue Management

```
QUEUE STRUCTURE:
  URGENT:    Safety/compliance/emergency improvements (bypass capacity check)
  STRUCTURAL: Team, OKR, ownership changes (highest adaptation cost; apply sparingly)
  WORKFLOW:  Workflow, orchestration, runtime changes (medium adaptation cost)
  TUNING:    Configuration, threshold, parameter changes (low adaptation cost)

SEQUENCING RULES:
  1. At most 1 STRUCTURAL change per team per 8-week window
  2. At most 3 WORKFLOW changes per team per sprint
  3. TUNING changes: unlimited if capacity > 0.80
  4. No 2 STRUCTURAL changes across the org in the same 2-week window (except URGENT)
  5. WORKFLOW changes to same subsystem: minimum 7 days between applications

SPRINT BUDGET FOR IMPROVEMENTS (per team):
  Remaining adaptation capacity × 0.20 = maximum improvement absorption
  (Teams contribute 80% to sprint work; 20% available for OS-driven changes)
```

---

## Change Velocity Control

```
CHANGE VELOCITY = total_changes_applied / team / quarter

THRESHOLDS:
  GREEN (optimal):  1–3 structural + 3–6 workflow + unlimited tuning
  YELLOW (watch):   4 structural OR 7–10 workflow per team per quarter
  RED (overloaded): >= 5 structural OR >= 11 workflow per team per quarter

RED ZONE RESPONSE:
  Halt: no new workflow or structural improvements for 2 sprints
  Assess: is current improvement cohort landing? (measure: adoption quality)
  Allow: URGENT safety changes only
  Resume: only after capacity returns to >= 0.70

ADOPTION QUALITY METRIC:
  % of applied improvements showing expected metric improvement (vs. regression)
  Target: >= 0.75 (75% of applied changes achieve their improvement target)
  If < 0.60: change velocity is too high; reduce regardless of tier
```

---

## Adaptation Fatigue Detection

```
FATIGUE SIGNALS:
  proposal_rejection_increase: team or individual rejecting improvement proposals at higher rate
  retroactive_rollback_request: requesting rollback of improvements that already stabilized
  meeting_attendance_drop: governance/review meeting attendance declining (disengagement)
  feedback_sentiment: negative sentiment in retrospectives about "too many changes"
  velocity_plateau: velocity not recovering after expected window (4–8 weeks)

FATIGUE RESPONSE:
  MILD fatigue (1–2 signals):
    - Reduce change velocity to GREEN zone
    - Schedule "stability sprint" (no new improvements)
    - Run: why-did-this-change retrospective for recent improvements

  MODERATE fatigue (3–4 signals):
    - Pause ALL non-URGENT improvements for one full sprint
    - Conduct: change impact assessment with team lead
    - Review: which recent changes landed well vs. poorly?

  SEVERE fatigue (5+ signals OR explicit team feedback):
    - Full improvement moratorium: 4 weeks
    - T4 review: is improvement pace sustainable?
    - Retrospective: what did we learn about this org's adaptation capacity?
    - Recalibrate: lower Base_capacity for this team going forward
```

---

## Long-Cycle Adaptation Tracking

```
ADAPTATION MATURITY MODEL (per team):
  LEVEL 1 (REACTIVE): Team adapts to changes reluctantly; high fatigue signals
  LEVEL 2 (ACCEPTING): Team tolerates changes; follows guidance but does not contribute
  LEVEL 3 (COLLABORATIVE): Team participates in improvement identification; some proactive
  LEVEL 4 (SELF-IMPROVING): Team generates its own improvement proposals; culture of improvement
  LEVEL 5 (AMPLIFYING): Team acts as improvement multiplier; exports learnings to other teams

PROGRESSION TRACKING:
  Measured: quarterly, via engagement score + proposal generation rate + adoption quality
  Target: all teams at LEVEL 3+ within 4 quarters of OS v26 deployment
  Reward: LEVEL 4/5 teams get increased autonomy (AUTO authorization for their own proposals)
```

---

## Health Metrics

```
METRIC                                   TARGET
──────────────────────────────────────────────────────────────────────────────────────────────
Adaptation capacity (org avg)           >= 0.70
Change velocity: teams in GREEN zone    >= 0.85
Adoption quality                        >= 0.75
Adaptation fatigue signals detected      < 2 per team per quarter
Teams at adaptation maturity LEVEL 3+  >= 0.70 within 4 quarters
Improvement moratoriums per year        < 2 (indicates healthy pace)
```
