# PB-005: Quarterly Planning

**Version:** 1.0.0 | **Owner:** PM Org | **Cadence:** Quarterly (weeks 11–14 of prior quarter) | **Tier:** T3 | **Class:** ELEVATED

## Purpose
Transform annual OKRs, capacity constraints, and strategic priorities into a committed, dependency-resolved, risk-assessed quarterly plan — producing a sprint sequence, resource allocation, and team-level OKR alignment that can be executed without mid-quarter re-planning.

## Planning Timeline

```
WEEK     ACTIVITY                                        OWNER
──────────────────────────────────────────────────────────────────────────────────────────
Q-4      Annual OKR cascade received (from WF-002)       VP Product
Q-3      Engineering capacity baseline confirmed         VP Eng + Team Leads
Q-3      Discovery pipeline review: validated bets       PM Org
Q-3      Dependency pre-scan: known cross-team deps      Delivery Org + WF-016
Q-2      Team OKR drafts submitted                       All T3 PM + Eng Leads
Q-2      Architecture council: tech debt allocation      Architecture Org
Q-2      Portfolio prioritization: trade-off discussions CPO + PMs
Q-1      Quarterly planning sessions (per squad/tribe)   All squads
Q-1      Cross-team dependency alignment                 WF-016 + WF-015
Q-1      Exec review + approval                          T4/T5 via WF-003
Q-1      Sprint sequence finalized                       Delivery Org
Q Start  Plan communicated to org                        VP Product
```

---

## Capacity Baseline (T-3 weeks before quarter)

**Produced by:** Team Leads + analytics-agent
**Format:** `memory/team-intelligence/capacity-records.yaml`

```
PER TEAM:
  Total headcount: N
  Leaves + holidays: -N
  Interview/hiring load: -N (typically 5–10% of eng capacity)
  On-call rotation: -N (typically 10–15% per on-call engineer)
  Tech debt allocation: -20% (non-negotiable floor)
  Net delivery capacity: N story points / sprint

RAMP ADJUSTMENTS:
  New hire (week 1–4):    20% capacity
  New hire (week 5–8):    50% capacity
  New hire (week 9–17):   75% capacity
  Fully ramped (week 18+): 100% capacity
```

---

## Team OKR Drafting (T-2 weeks)

**Each team submits:**
```
TEAM OKR FORMAT:
  Objective: [qualitative; aligned to company OKR]
  Key Results:
    KR-1: [measurable; baseline + target + unit]
    KR-2: [measurable; baseline + target + unit]
    KR-3: [measurable; baseline + target + unit; optional]
  Initiatives: [features, projects, or experiments that drive KRs]
  Confidence: 60-70% (stretch) | 70-80% (committed) | 80%+ (too safe)

VALIDATION CHECKS (PM-agent):
  □ Each KR is measurable and has a baseline
  □ At least 1 KR is customer-facing
  □ OKRs traceable to company-level OKRs (no orphaned team goals)
  □ Initiatives are sized (T-shirt: S/M/L/XL)
  □ Tech debt allocation visible (>= 20% of capacity)
```

---

## Portfolio Prioritization Session (T-2 weeks, 3 hours)

**Participants:** CPO, VP Engineering, all T3 PMs, VP CS
**Chair:** CPO

### Prioritization Framework
```
DIMENSION                   WEIGHT    SCORING
─────────────────────────────────────────────────────────────────────────────────────────
Strategic alignment         30%       1 (weak) – 5 (core bet)
Customer value / ARR impact 25%       1 (minimal) – 5 (direct ARR driver)
Risk if not done            20%       1 (low risk) – 5 (existential risk)
Delivery confidence         15%       1 (high uncertainty) – 5 (high confidence)
Technical feasibility       10%       1 (high debt) – 5 (clean execution)

WEIGHTED SCORE = sum(dimension × weight)
PRIORITY TIER:
  4.0–5.0: P1 (must ship this quarter)
  3.0–3.9: P2 (high priority; ship if capacity allows)
  2.0–2.9: P3 (important; considered for next quarter)
  < 2.0:   P4 (deprioritize; do not plan)
```

### Trade-Off Decisions
```
WHEN CAPACITY < DEMAND:
  Option A: Reduce scope (cut P3 items first, then P2 scope reduction)
  Option B: Reduce quality (NOT an option; quality floor is non-negotiable)
  Option C: Request headcount (CFO + VP Eng decision; ≥ 6-week lead time)
  Option D: Extend timeline (only for internal initiatives; external commitments must be honored)

TRADE-OFF RECORD:
  Every scope reduction → documented in WF-004 (roadmap governance)
  Customer commitment de-scoped → CS Lead notified; WF-015 stakeholder alignment
```

---

## Quarterly Planning Sessions (T-1 week, per squad)

**Format:** 3–4 hours per squad
**Facilitator:** Senior PM + Engineering Lead
**Output:** Committed sprint plan for quarter

### Session Agenda
```
TIME    TOPIC                                        OUTPUT
────────────────────────────────────────────────────────────────────────────────────────────
0:00    Quarter goals review: OKRs confirmed        Team aligned on goals
0:15    Capacity review: net available confirmed    Capacity number locked
0:30    Initiative sizing: T-shirt → story points   Each initiative estimated
1:00    Sprint sequence draft: which work in which sprint Story→sprint mapping
1:45    Dependency mapping: flag all cross-team deps → WF-016 for each
2:00    Risk assessment: top 3 sprint risks          Risk log updated
2:15    Stretch goals: if capacity frees up, what's next?  Stretch backlog identified
2:30    Commitment: team commits to sprint sequence  Verbal commitment
2:45    Sprint plan recorded                        wiki/planning/{team}/{quarter}.md
```

### Sprint Sequencing Rules
```
RULE 1: Critical path first — items with external dependencies go in earlier sprints
RULE 2: Foundation before features — platform work before product work
RULE 3: Risk front-loading — highest-uncertainty work in sprint 1–2 (fail fast)
RULE 4: Buffer in final sprint — sprint 6 (if 6-sprint quarter) = 70% capacity max
RULE 5: Experiments isolated — A/B tests get dedicated sprint slots; no feature + experiment sharing
RULE 6: No sprint > 85% loaded — leave slack for interruptions (bugs, on-call escalations)
```

---

## Cross-Team Dependency Alignment (T-1 week)

**Facilitated by:** Delivery Org
**Tool:** WF-016 (Dependency Coordination) for each identified dependency

```
DEPENDENCY REVIEW SESSION (90 min, all team leads):

FORMAT:
  1. Each team presents their dependency asks (what they need from others)
  2. Providing team commits or negotiates (date, scope, alternative)
  3. Unresolvable conflicts → WF-015 (stakeholder alignment)
  4. All commitments recorded → WF-016 entries

CPM ANALYSIS (analytics-agent):
  After all dependencies registered: critical path computed
  Flag: any critical path at risk with current commitments
  Output: critical path dashboard in wiki/planning/critical-path.md
```

---

## Executive Review + Approval (T-1 week)

**Participants:** CPO, CTO, VP Engineering, VP Product
**Duration:** 90 min
**Format:** Plan presentation + Q&A + approval

```
REVIEW CRITERIA:
  □ Company OKRs addressed proportionally
  □ No team > 90% capacity loaded
  □ Critical customer commitments addressed
  □ Tech debt allocation >= 20%
  □ Dependency critical path has no unresolved gaps
  □ Compliance and regulatory items included (DPO notified)
  □ AI governance items included (if AI systems in scope)

APPROVAL OUTCOMES:
  APPROVED:          Plan proceeds; all sprints confirmed
  APPROVED_WITH:     Specific items modified; changes documented
  NEEDS_REVISION:    Fundamental misalignment; replanning required (rare)

→ WF-003 (Quarterly Planning) S-015: T4 approval gate
```

---

## Plan Communication

**Timing:** Day 1 of new quarter
**Channels:** Slack #all-hands; email; Jira quarterly labels applied

```
COMMUNICATION PACKAGE:
  1. Company OKR → team OKR mapping diagram
  2. Per-team: goals + top 3 initiatives for the quarter
  3. Key cross-team dependencies (simplified view)
  4. Blackout periods and delivery calendar
  5. Where to track progress: Jira boards + wiki/planning/{quarter}.md

TRANSPARENCY RULES:
  All OKRs visible to all T2+ (not just leadership)
  Dependencies visible to all team leads
  Portfolio priorities shared at team level (P1/P2; not P3/P4 backlog details)
```

---

## Mid-Quarter Plan Review (Week 6 of 12)

**Participants:** All team leads + CPO + VP Eng
**Duration:** 60 min
**Purpose:** Assess plan health; adjust before too late to course-correct

```
REVIEW TOPICS:
  1. OKR progress: on-track / at-risk / off-track per KR
  2. Sprint carry-over analysis: trend (improving or worsening?)
  3. Dependency status: any slipping that impact others?
  4. Scope changes needed: new information that changes priorities?

DECISION AUTHORITY:
  On-track: no action
  At-risk: T3 PM + Eng Lead correction plan within 48hr
  Off-track: CPO + VP Eng decision; may trigger WF-004 (roadmap governance)
  Plan invalidated (major strategic shift): executive decision → re-plan (rare)
```

---

## Governance Checkpoints

```
C-001: Planning decisions made by human leads; AI provides capacity/dependency analysis
C-004: Quarterly plan and all trade-off decisions permanently recorded in wiki
OKR_QUALITY: Every KR must have a measurable baseline before quarter starts
CAPACITY_FLOOR: No team may be loaded > 90%; tech debt floor >= 20%; enforced
DEPENDENCY_REGISTER: All cross-team dependencies registered in WF-016 before Q start
COMMITMENT_RECORD: Verbal commitments insufficient; all commitments written in Jira
REGULATORY: Compliance and AI governance items must be in plan if in-flight
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
Planning completion (D1 of quarter)     = 100% (all sprints planned)
OKR baseline established (D1)           = 100%
Dependency registration (D1)            >= 0.95 (5% tolerance for late discovery)
Quarter OKR achievement rate            >= 0.75 (70% = healthy; 100% = too safe)
Mid-quarter at-risk OKRs                target < 0.20
Cross-team dependency on-time           >= 0.85
Sprint 1 carry-over rate                < 0.10 (high = poor planning)
```

## Workflow Integrations

```
WF-002  Annual Planning    → annual OKRs cascade into quarterly planning
WF-003  Quarterly Planning → this playbook operationalizes WF-003
WF-004  Roadmap Governance → scope changes during quarter use WF-004
WF-015  Stakeholder Align  → unresolvable trade-offs escalate to WF-015
WF-016  Dependency Coord   → all dependencies registered in WF-016
WF-006  AI Feature Deliv   → AI-related quarterly items route through WF-006
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Planning done in week 1 of new quarter     Sprint 1 unplanned; teams idle or ad-hoc
OKRs set without baselines                  Progress unmeasurable; gaming possible
Tech debt allocation skipped               Debt compounds; SEV incidents increase
Dependencies identified but not registered  Silent blockers; missed commitments
100% capacity loading                       No slack for incidents; burnout; slips
Plan changes mid-quarter without WF-004     Stakeholders surprised; trust erodes
OKRs too safe (all green every quarter)     No stretch; no learning; org stagnates
```
