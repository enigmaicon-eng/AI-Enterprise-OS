# PB-002: PM Operating Cadence

**Version:** 1.0.0 | **Owner:** PM Org | **Cadence:** Daily / Weekly / Per-Sprint | **Tier:** T3 | **Class:** ELEVATED

## Purpose
Define the complete operating rhythm for the PM organization — establishing deterministic cadences for discovery, sprint execution, roadmap health, cross-team coordination, and stakeholder communication. Prevents PMs from operating reactively by embedding proactive review and alignment into the daily and weekly rhythm.

## Participants

```
ROLE                      TIER  DAILY  WEEKLY  SPRINT  MONTHLY
──────────────────────────────────────────────────────────────────────────
Senior PM (squad lead)    T3    Core   Core    Core    Core
PM (feature)              T2    Core   Core    Core    Core
Engineering Lead          T2    Opt    Core    Core    Opt
Design Lead               T2    Opt    Core    Core    Opt
Analytics Lead            T2    -      Opt     Core    Opt
VP Product                T4    Read   Core    Opt     Core
PM-agent (AI assist)      -     Auto   Auto    Auto    Auto
```

---

## Daily PM Standup

**Cadence:** Every workday, 15 minutes (synchronous or async)
**Format:** Async-first (Slack thread #pm-standup); sync if > 2 blockers open
**Time:** 09:30 local

### Each PM Posts
```
YESTERDAY: [what shipped or decision made]
TODAY:     [what I'm driving to completion]
BLOCKED:   [blocker + owner + SLA] or "none"
ESCALATE:  [anything needing T3+ attention today]
```

### Standup Review (PM Lead)
```
Review at 10:00:
  - Any blocker unresolved from previous day → WF-015 (stakeholder alignment)
  - Any customer-impacting work blocked → escalate to VP Product
  - Sprint burn rate check: on track / at risk / stalled
```

---

## Weekly PM Sync

**Cadence:** Every Tuesday, 60 minutes
**Chair:** Senior PM or VP Product
**Participants:** All PMs, Engineering Lead, Design Lead
**Prep:** PM-agent generates weekly work health summary by Monday 17:00

### Agenda
```
TIME    TOPIC                                           OWNER          OUTPUT
────────────────────────────────────────────────────────────────────────────────────────────
0:00    Sprint health: burn rate, carry-over risk       Each PM        At-risk flag or clear
0:15    Roadmap health: on-track / at-risk items        Senior PM      Roadmap status update
0:25    Dependency review: cross-team blockers          All PMs        → WF-016 if new dep
0:35    Decisions pending alignment                     All PMs        → WF-015 if needed
0:45    Discovery: active opportunities                 PM lead        Prioritization input
0:55    Actions + escalations                           Senior PM      Action list
```

### Weekly Escalation Protocol
```
TRIGGER                                       ACTION
──────────────────────────────────────────────────────────────────────────────────────────
Sprint carry-over > 20% of capacity           PM Lead → Engineering Lead → capacity review
Customer feature request SLA breach           PM → VP Product → WF-017 if ESC risk
Roadmap item at risk (> 1 sprint delay)      PM → WF-004 (roadmap governance)
Cross-team dependency unresolved > 48hr      PM → WF-016 (dependency coordination)
Stakeholder objection to roadmap item        PM → WF-015 (stakeholder alignment)
Discovery finding changes quarterly priority  PM → Senior PM → WF-004
```

---

## Sprint Lifecycle

### Sprint Planning (Day 1 of sprint, 3–4 hours)

**Pre-Planning Checklist (T-2 days)**
```
□ Backlog groomed: top 2-sprint backlog refined and estimated
□ Capacity confirmed: team capacity entered (leaves, interviews, on-call)
□ Dependencies checked: no unresolved blockers from WF-016
□ Goals drafted: 1–3 sprint goals aligned to quarterly OKRs
□ Tech debt ratio: >= 20% capacity reserved for tech debt
□ Analytics baseline: key metrics for sprint goals confirmed
□ WF-003 alignment: sprint scope consistent with quarterly plan
```

**Sprint Planning Agenda**
```
TIME    TOPIC                                           OUTPUT
────────────────────────────────────────────────────────────────────────────────────────────
0:00    Sprint goal statement: 1–3 goals              Agreed sprint goals
0:20    Capacity review: net available hours/points   Capacity number confirmed
0:30    Story selection: pull from refined backlog    Sprint backlog (stories + points)
1:30    Task breakdown: key stories decomposed        First 3 days planned in detail
2:00    Dependency identification: new cross-team deps → WF-016 filed
2:15    Risk review: what could derail this sprint    Risks logged
2:30    Commitment: team verbally commits to goals    Sprint committed
2:40    Sprint planning record saved                  wiki/sprints/{sprint_id}.md
```

### Daily Standup (Workdays, 15 min)
```
FORMAT: Yesterday / Today / Blocked
RULE:   No problem-solving in standup; problems go to breakout
BOARD:  Update Jira before standup (not during)
OUTPUT: Any new blockers → PM action same day
```

### Sprint Mid-Point Check (Day 5 of 10-day sprint, 30 min)
```
AGENDA:
  1. Burn rate vs. plan (should be at 40–50% complete)
  2. At-risk stories: de-scope or add capacity?
  3. New blockers added mid-sprint
  4. Goal viability: still achievable?

IF GOAL AT RISK:
  PM + Engineering Lead decision: de-scope story (not goal) or flag to VP Product
  Document decision; do not silently slip goals
```

### Sprint Review (Day 9–10, 60 min)

**Participants:** Full squad + stakeholders + VP Product (invited)

```
AGENDA:
  0:00  Demo: each story demoed against acceptance criteria (not slides — live product)
  0:35  Metrics: did we move the metric we targeted?
  0:45  Goal assessment: hit / partial / miss (with reason)
  0:50  Feedback: stakeholder reactions captured
  0:55  Close: sprint outcome recorded
```

**Sprint Review Output**
```
wiki/sprints/{sprint_id}.md updated with:
  - Stories completed / carried over
  - Goals: HIT / PARTIAL / MISS
  - Metrics moved
  - Stakeholder feedback
  - Carry-over reasons (if any)
```

### Sprint Retrospective (Day 10, 45 min)

**Format:** Blameless; facilitator rotates each sprint
**Method:** Start / Stop / Continue OR 4Ls (Liked, Learned, Lacked, Longed for)

```
AGENDA:
  0:00  Data review: velocity, carry-over, interruptions, blocked time
  0:10  Retro format: each person submits cards async before meeting
  0:20  Cluster: facilitator groups themes (≤5 clusters)
  0:30  Root cause: 1 deep dive on top pain point (5 Whys)
  0:40  Actions: 1–2 concrete changes for next sprint (owner + done-by)
  0:45  Close

RULE:  Each retro produces 1–2 actions maximum. More = none get done.
RULE:  Actions not completed by next retro → escalate reason; not silently dropped.
```

---

## Discovery Cadence

### Weekly Discovery Triage (30 min, Thursdays)

```
PM Lead reviews all active discovery items:
  - New customer insights from CS → prioritization consideration
  - Experiment results → next hypothesis
  - Analytics anomalies → investigation or dismiss
  - Market signals → feed into WF-002 pipeline

Output: discovery backlog prioritized; items > 4 weeks old → close or escalate
```

### Monthly Discovery Review (60 min, first Thursday of month)

```
AGENDA:
  0:00  Active opportunities: status + confidence
  0:20  Evidence quality: any opportunities resting on weak evidence?
  0:30  Sunset stale opportunities (> 3 months with no evidence update)
  0:40  Pipeline health: enough validated bets to fill next 2 quarters?
  0:50  Next bets: what to run discovery on this month?

→ Feeds into WF-003 (quarterly planning) and WF-001 (product discovery)
```

---

## Roadmap Health Checks

### Weekly (5 min, automated)
```
PM-agent generates:
  - Items on-track / at-risk / stalled
  - Dependencies critical path status
  - Carries from last sprint impacting commitments
  - Alert: any committed item at > 2-week slip risk
```

### Monthly Roadmap Sync (30 min, with VP Product)
```
  - Committed vs. aspirational item review
  - Customer commitment check: anything promised to accounts at risk?
  - Stakeholder conflicts: any roadmap items with pending objections?
  - Next quarter roadmap draft status

→ WF-004 (roadmap governance) triggered if any item requires formal change
```

---

## PM—Engineering Coordination

### Story Handoff Protocol
```
BEFORE SPRINT PLANNING:
  □ Acceptance criteria written (testable, not vague)
  □ Designs attached or design tickets linked
  □ Analytics instrumentation specified
  □ Feature flag scope defined (if applicable)
  □ Rollback plan identified

DURING SPRINT:
  PM reviews in-progress stories ≥ once mid-sprint
  PM available for clarification within 2hr response SLA

BEFORE STORY CLOSE:
  PM verifies acceptance criteria met (not engineering self-sign-off)
  Metrics spike visible (if measurable in sprint)
```

---

## Governance Checkpoints

```
C-001: Sprint goals and roadmap decisions are human PM decisions; AI provides data, not verdicts
C-004: Sprint plans, reviews, retro actions permanently recorded in wiki
SPRINT_COMMITMENT: Sprint goals committed by team; PM cannot unilaterally change mid-sprint scope
CARRY_OVER: > 20% carry-over two sprints in a row → mandatory capacity review
DISCOVERY_EVIDENCE: No feature enters sprint without validated problem statement
ROADMAP_CHANGE: Any committed roadmap change requires WF-004; no silent scope changes
```

## Health Metrics

```
METRIC                                  TARGET
──────────────────────────────────────────────────────────────────────────────
Sprint goal hit rate                    >= 0.80
Carry-over rate                         < 0.10 per sprint
Planned vs. unplanned work ratio        >= 0.70 planned
Dependency resolution time              <= 5 days (WF-016 SLA)
Discovery pipeline freshness            >= 3 validated bets in backlog at all times
Roadmap accuracy at quarter end         >= 0.75 committed items delivered
Retro action completion rate            >= 0.80 by next retro
Standup blocker resolution time         <= 24hr for P1 blockers
```

## Workflow Integrations

```
WF-001  Product Discovery      → discovery triage + monthly review feeds WF-001
WF-003  Quarterly Planning     → sprint planning aligns to quarterly OKRs from WF-003
WF-004  Roadmap Governance     → monthly roadmap sync triggers WF-004 for formal changes
WF-015  Stakeholder Alignment  → weekly sync escalation path for pending decisions
WF-016  Dependency Coord       → sprint planning + weekly sync surfaces WF-016 items
WF-009  Experimentation        → discovery outcomes feed into WF-009 experiment design
```

## Anti-Patterns

```
ANTI-PATTERN                                CONSEQUENCE
─────────────────────────────────────────────────────────────────────────────────────────
Standup becomes problem-solving session     15min → 60min; engineers resentful
Sprint planning without groomed backlog     Mid-sprint scope changes; missed goals
PM changes scope mid-sprint without trace   Engineering trust erodes; velocity drops
Retro with no actions                       Nothing improves; team fatigue increases
Discovery skipped; building on assumption   Feature built for wrong problem; waste
Roadmap updated in deck but not in Jira     Single source of truth broken; confusion
Carry-over never root-caused               Chronic underdelivery normalized
```
