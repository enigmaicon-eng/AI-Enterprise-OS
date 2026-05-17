---
type: playbook
id: PLAY-SPRINT
version: "1.0"
cadence: every-2-weeks
created: 2026-05-08
updated: 2026-05-08
owner: delivery-agent
participants: [delivery-agent, pm-agent, engineer-agent, qa-agent, architect-agent]
estimated-duration: 2 weeks
---

# Sprint Playbook

The complete operational rhythm for a 2-week sprint — from planning through retrospective. Every meeting has a time box. Every meeting produces a named artifact. Skipping any step shifts risk to the next sprint.

**Sprint length:** 2 weeks (10 working days)
**Entry condition:** Previous sprint retro complete; backlog groomed and prioritized.
**Exit condition:** Sprint review complete; retro action items documented; next sprint backlog ready.

---

## Sprint Calendar

| Day | Event | Duration | Owner | Artifact |
|-----|-------|---------|-------|---------|
| Day 1 (Mon) | Sprint Planning | 2 hours | delivery-agent | sprint-plan.md |
| Day 1–10 | Daily Standup (async) | 10 min/day | all agents | daily-standup-log |
| Day 1–10 | Development execution | ongoing | engineer-agent | PRs, artifacts |
| Day 3 (Wed) | Mid-sprint health check | 30 min | delivery-agent | status-note |
| Day 5 (Fri) | Week 1 close check | 15 min | delivery-agent | status-note |
| Day 8 (Wed) | Sprint forecast review | 30 min | delivery-agent + pm-agent | forecast-update |
| Day 9 (Thu) | QA final window | all day | qa-agent | qa-report |
| Day 10 (Fri) | Sprint Review | 1 hour | delivery-agent + pm-agent | sprint-review.md |
| Day 10 (Fri) | Sprint Retrospective | 45 min | delivery-agent | retro.md |
| Day 10 (Fri) | Next Sprint Backlog Ready | by EOD | pm-agent | backlog snapshot |

---

## ① Pre-Sprint: Backlog Readiness (Day −2 to Day 0)

Before planning can run, these must be true. Delivery-agent verifies.

### Backlog Health Gate

- [ ] All sprint candidates have an estimated tier (XS / M / L)
- [ ] All L-tier items have an accepted ADR or "ADR required" explicitly noted
- [ ] All items have acceptance criteria from a PRD or equivalent brief
- [ ] Dependencies between items are mapped — no surprise blockers mid-sprint
- [ ] Security-sensitive items flagged and security-agent availability confirmed
- [ ] Total estimated capacity does not exceed team velocity × 0.8 (leave 20% buffer)

**If gate fails:** Push planning by 1 day to fix. Do not plan against an ungroomed backlog.

---

## ② Sprint Planning (Day 1 — 2 hours)

**Owner:** delivery-agent (facilitates)
**Required attendees:** pm-agent, engineer-agent, architect-agent (for L-tier items)

### 2.1 Agenda

```
00:00 – 00:15  Sprint goal statement (pm-agent)
00:15 – 01:00  Item-by-item commitment (engineer-agent estimates + risks)
01:00 – 01:30  Dependency mapping and sequencing
01:30 – 01:45  Capacity check: committed points vs. available capacity
01:45 – 02:00  Risk identification and mitigation plan
```

### 2.2 Sprint Goal

A single sentence — the "why" of this sprint. If you can't state it in one sentence, the sprint is unfocused.

> "By end of sprint, [user type] can [do something], which moves [metric] toward [target]."

**Written to:** `sprints/<sprint-id>/sprint-plan.md` (§1 of sprint template)

### 2.3 Commitment Rules

| Rule | Rationale |
|------|-----------|
| Only commit to items that are fully defined (AC exists) | Ill-defined items always expand mid-sprint |
| L-tier items need > 3 days of sprint remaining at start | L-tier with < 3 days remaining will not complete |
| No item enters sprint without a tier classification | Unclassified = unestimated = risk |
| Spike items are time-boxed: max 2 days each | Spikes without a box never close |
| Security items are non-negotiable scope — never traded off | Security debt from sprint-to-sprint compounds |

### 2.4 Capacity Calculation

```
Available capacity = (team size × sprint days) − planned absences − ceremonies − 20% buffer

Example:
  2 engineers × 10 days = 20 eng-days
  − 2 days ceremonies/overhead
  − 20% buffer (3.6 days)
  = 14.4 eng-days available to commit
```

### 2.5 Output

File: `sprints/<sprint-id>/sprint-plan.md` using `templates/sprint-template.md`

Required sections:
- [ ] Sprint goal (one sentence)
- [ ] Committed items with tier, owner, and AC reference
- [ ] Dependency map (which items block which)
- [ ] Risk log for this sprint
- [ ] Definition of Done stated explicitly

---

## ③ Daily Execution Rhythm (Days 1–10)

Follow `playbooks/daily-operating-playbook.md` every day.

**Sprint-specific additions to daily cadence:**

### Sprint Health Indicators (Check Daily)

| Indicator | Healthy | Warning | Action |
|-----------|---------|---------|--------|
| Completed story points vs. burn-down | On track ± 10% | > 15% behind | Re-plan or descope |
| Blocked items | 0 | 1–2 | Unblock same day |
| PR age | < 24h open | > 48h open | Escalate to delivery-agent |
| Failing tests in CI | 0 | Any | Fix before new work |
| In-scope creep | 0 new items | 1 minor addition | PM approval required |

### Scope Change Protocol

If a new item is requested mid-sprint:
1. pm-agent assesses: is this P0 (must be in this sprint) or can it wait?
2. If P0: remove an equivalent-sized item from sprint to maintain capacity
3. If not P0: add to backlog for next sprint; do not squeeze in
4. Any scope change requires pm-agent sign-off and a note in `sprint-plan.md`

---

## ④ Mid-Sprint Health Check (Day 3 — 30 min)

**Owner:** delivery-agent
**Purpose:** Catch drift early when there's still time to recover.

### Questions to Answer

```
1. Are we on track against the burn-down? (Y/N)
   → If N: which items are behind? Why? Can we recover?

2. Are there any new blockers not visible in standup?
   → If Y: what is the unblock path and timeline?

3. Is the sprint goal still achievable?
   → If N: what do we descope to protect the goal?

4. Has any item grown in scope since planning?
   → If Y: re-estimate, adjust commitment, notify pm-agent

5. Is QA aware of what will be ready for testing and when?
   → If N: coordination needed today, not on Day 9
```

**Output:** One-paragraph status note posted to team channel. Update `sprint-plan.md` §risks if anything changes.

---

## ⑤ Sprint Forecast Review (Day 8 — 30 min)

**Owner:** delivery-agent + pm-agent
**Purpose:** Final adjustment before the sprint ends. No surprises on Day 10.

### Forecast Checklist

- [ ] List every committed item: will it complete by EOD Day 9?
- [ ] For each item at risk: what is the minimum shippable version?
- [ ] Are QA test cases written for all items entering QA?
- [ ] Is the QA window (Day 9) realistically sufficient?
- [ ] Are there any release dependencies (external systems, shared infra) that need coordination?

### Descope Decision

If an item cannot complete this sprint:
```
Options (in order of preference):
  A. Time-box: deliver the minimum shippable version this sprint
  B. Slip to next sprint: move the full item, communicate to stakeholders
  C. Split: ship part now, part next sprint (only if each part is independently valuable)

Never: Ship incomplete work silently or mark an item Done without meeting AC.
```

---

## ⑥ QA Window (Day 9)

**Owner:** qa-agent
**Input:** All committed items deployed to staging by EOD Day 8

### QA Day Rules

- [ ] QA test plan must exist before Day 9 — qa-agent cannot write and execute the same day
- [ ] All P0 ACs tested against `templates/qa-plan-template.md`
- [ ] Bug severity triage: Critical and High bugs block release
- [ ] QA verdict issued by EOD Day 9 so review can proceed on Day 10

**If QA verdict is FAIL:** Delivery-agent and pm-agent decide same day:
- Fix the blocking bug today (if < 4h effort)
- Slip the item to next sprint
- Ship a scoped version that passes QA

No item ships with an open High or Critical bug.

---

## ⑦ Sprint Review (Day 10 — 1 hour)

**Owner:** pm-agent (presents) + delivery-agent (facilitates)
**Audience:** Stakeholders, all agents, human operators

### Agenda

```
00:00 – 00:10  Sprint goal recap: did we achieve it? (Y/N/Partial — no spin)
00:10 – 00:40  Demo: completed items only — no demos of work-in-progress
00:40 – 00:50  Metrics: north star and driver metrics for shipped features
00:50 – 01:00  Next sprint preview: top candidates for stakeholder input
```

### Review Rules

- Only shipped, QA-verified items are demoed — incomplete work is invisible
- Metrics are presented as facts, not narratives ("this number went up because of us")
- "Almost done" is not done — do not include in completed count
- Stakeholder feedback logged as backlog items — not committed mid-review

**Output:** `sprints/<sprint-id>/sprint-review.md`
- What shipped and what didn't
- Sprint goal: achieved / partial / missed
- Metrics snapshot
- Stakeholder feedback captured

---

## ⑧ Sprint Retrospective (Day 10 — 45 min)

**Owner:** delivery-agent (facilitates)
**Participants:** All agents + human team members

### Format: Start / Stop / Continue

```
10 min: Individual reflection (each person notes 1–2 items per category)
15 min: Group share — surface patterns, not just individual experiences
15 min: Select 2–3 action items with owners and due dates
 5 min: Close — confirm action items are specific and owned
```

### Retro Rules

- Action items must be specific: "Improve communication" is not an action item
- Every action item has one named owner and a due date within the next sprint
- No more than 3 action items — focus over exhaustion
- Action items from last retro are reviewed first — did we close them?

**Output:** `sprints/<sprint-id>/retro.md` using `templates/retro-template.md`

Action items logged in: `sprints/<sprint-id>/retro.md` AND tracked on sprint board

### After Retro

- [ ] Delivery-agent posts retro summary to team channel
- [ ] Non-obvious learnings saved to `wiki/learnings/<date>-<slug>.md`
- [ ] Any reusable pattern extracted to `memory/patterns/`
- [ ] Governance violations (if any) logged with root cause — not blamed

---

## ⑨ Sprint Close Checklist (EOD Day 10)

Every item must be verified before the sprint is marked closed.

### Engineering

- [ ] All committed items: status is Done or explicitly slipped with a reason
- [ ] All PRs merged; no open PRs against sprint items
- [ ] All merged code deployed to staging (production for shipped items)
- [ ] No critical or high bugs open against shipped items
- [ ] Test coverage maintained ≥ 80%

### Documentation

- [ ] All new APIs documented in `implementation/api-specs/`
- [ ] All new architecture decisions recorded in ADR
- [ ] Runbooks updated for any operational changes
- [ ] Wiki updated for any process changes: `wiki/`

### Memory & Knowledge

- [ ] Sprint review artifact saved: `sprints/<sprint-id>/sprint-review.md`
- [ ] Retro artifact saved: `sprints/<sprint-id>/retro.md`
- [ ] Reusable learnings extracted: `wiki/learnings/` and/or `memory/patterns/`
- [ ] Next sprint backlog confirmed groomed and ready for planning

### Metrics

- [ ] DORA metrics updated: deployment frequency, lead time
- [ ] North star and driver metrics recorded for shipped features
- [ ] Velocity recorded: planned points vs. completed points

---

## ⑩ Sprint Metrics Baseline

Track these each sprint to see trends over time.

| Metric | Definition | Target | How Tracked |
|--------|-----------|--------|------------|
| Velocity | Story points completed / planned | ≥ 80% of commitment | Sprint review doc |
| Scope creep rate | Items added mid-sprint / total committed | < 10% | Sprint plan vs. actuals |
| Bug escape rate | Bugs found in prod / total bugs | < 20% | Bug tracker |
| PR cycle time | PR open → merged | < 24h median | Git metrics |
| QA pass rate | Items passing QA first time | > 80% | QA reports |
| Retro action completion | Actions closed by next retro | > 75% | Retro docs |
