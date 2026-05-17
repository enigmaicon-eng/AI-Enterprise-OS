---
type: playbook
id: PLAY-PM-REVIEW
version: "1.0"
cadence: weekly + sprint-end
created: 2026-05-08
updated: 2026-05-08
owner: pm-agent
participants: [pm-agent, delivery-agent, analytics-agent, engineer-agent, strategist-agent]
estimated-duration: Weekly: 90 min | Sprint-end: 3 hours
---

# PM Review Playbook

The structured cadence for product health reviews. Every review answers the same three questions: Are we building the right things? Are we building them correctly? Are the things we shipped working?

**Entry condition:** Access to current metrics, sprint board state, and roadmap.
**Exit condition:** Decisions logged, backlog updated, next priorities confirmed.

---

## Review Types

| Review | Cadence | Duration | Focus |
|--------|---------|---------|-------|
| Weekly Metrics Review | Every Monday | 45 min | Shipped feature performance vs. targets |
| Weekly Roadmap Health | Every Wednesday | 30 min | Roadmap confidence and risk |
| Sprint-End Product Review | End of each sprint | 90 min | Full retrospective view: metrics + roadmap + discovery |
| Discovery Pipeline Review | Bi-weekly | 30 min | Opportunity funnel health |

Run each review in sequence — skip none. The sprint-end review replaces (not adds to) the Wednesday roadmap health of that week.

---

## ① Weekly Metrics Review (Monday — 45 min)

**Owner:** pm-agent + analytics-agent
**Purpose:** Are the features we shipped working? Are we moving our metrics?

### 1.1 Metrics Pull (15 min — analytics-agent)

Before the review, analytics-agent prepares a metrics snapshot for every feature shipped in the past 4 sprints:

```
For each active feature:
  North star metric:    <current value> vs. <target> — <% gap>
  Week-over-week:       <+/- X% from last week>
  Driver metrics:       <table: metric / current / target / gap>
  Guardrail metrics:    <all green / any breaches?>
  Anomalies:            <anything surprising in the data>
```

File saved to: `analytics/<date>-weekly-metrics-snapshot.md`

### 1.2 Review Agenda

```
00:00 – 00:05  Wins: any metric that moved toward target this week
00:05 – 00:30  Feature health review: one feature per 5-min slot
               For each: is it working, at risk, or failing?
00:30 – 00:40  Anomaly investigation: anything that moved unexpectedly
00:40 – 00:45  Actions: what changes in response to this week's data?
```

### 1.3 Feature Health Classification

Each shipped feature is classified every week:

| Classification | Criteria | Action |
|---------------|---------|--------|
| **On Track** | North star ≥ 70% of target trajectory | No action needed |
| **At Risk** | North star 50–69% of target trajectory | Investigate this sprint; identify 1 hypothesis to test |
| **Off Track** | North star < 50% of target trajectory | Escalate: pm-agent + strategist-agent → is this a product issue or an adoption issue? |
| **Failing** | North star < 25% or declining 2+ weeks | Post-mortem: what did we get wrong? Should we iterate, pivot, or kill? |
| **Too Early** | < 2 weeks since launch | Record baseline; don't draw conclusions |

### 1.4 Metric Response Protocol

```
Metric is On Track:
  → Continue monitoring; no change required

Metric is At Risk:
  → Form 1 hypothesis for why it's at risk
  → Identify 1 test or change to run this sprint
  → Set a re-evaluation date (max 2 sprints)

Metric is Off Track:
  → pm-agent + engineer-agent + analytics-agent: 1-hour investigation session
  → Is the problem: (a) the feature, (b) the funnel before it, (c) the metric definition, (d) the market assumption?
  → Output: specific action item with owner and sprint

Metric is Failing:
  → Escalate to strategist-agent
  → Run the "iterate vs. kill" framework (§1.5)
  → Do not continue investing in this feature without a clear hypothesis and a time-boxed test
```

### 1.5 Iterate vs. Kill Framework

For any feature classified as Failing:

```
Question 1: Do we have evidence the problem is real and valuable to solve?
  → No: consider killing. The problem may not be worth solving.
  → Yes: continue to Q2.

Question 2: Is our solution the wrong approach, or is the problem harder than we thought?
  → Wrong approach: iterate with a materially different design (not a tweak)
  → Problem harder: re-scope or adjust timeline/investment

Question 3: Have we given it enough time and traffic to generate signal?
  → No: set a minimum evaluation window (typically 4 weeks post-rollout)
  → Yes: make a kill or pivot decision

Decision rule: If a feature has been live for 6+ weeks and north star is still < 25% of target with no improving trend, the default is kill unless there is strong qualitative evidence the problem is being solved differently.
```

---

## ② Weekly Roadmap Health (Wednesday — 30 min)

**Owner:** pm-agent
**Purpose:** Is our roadmap still the right roadmap?

### 2.1 Roadmap Confidence Check

For each item in the next 2 sprints, answer:

```
Item: <feature name>
PRD status: approved / draft / needs revision
ADR status (L-tier): accepted / in-progress / not started
Engineering confidence: high (< 20% uncertainty) / medium / low
Dependencies: all confirmed / some unconfirmed / blocked
Risk: <top risk and its mitigation>
```

### 2.2 Confidence Thresholds

| Confidence | Next Sprint Items | 2+ Sprint Items |
|-----------|-----------------|----------------|
| All high | No changes needed | — |
| Any medium in next sprint | Re-examine scope; is the item fully defined? | Flag for next sprint planning |
| Any low in next sprint | Spike required this sprint to de-risk; do not commit | Do not roadmap until de-risked |
| Dependency unconfirmed | Confirm within 2 days or remove from roadmap | Flag dependency owner |

### 2.3 Roadmap Integrity Rules

- **No "someday" items in the next 4 sprints** — if it's not fully defined, it belongs in the discovery backlog
- **No more than 30% of a sprint from new intake** — protect velocity for committed roadmap items
- **Every item in the next 2 sprints has an owner** — unowned items drift
- **Descoping must be explicit** — items removed from the roadmap are logged in `memory/product-decisions.md` with reasons

### 2.4 Intake Queue Review

New requests since last Wednesday:
- [ ] Review all new inbound: stakeholder requests, support escalations, user feedback, data signals
- [ ] Apply first-pass triage: Does this warrant a discovery spike? Or straight to backlog?
- [ ] RICE-score any item competing for the next 2 sprints: (Reach × Impact × Confidence) / Effort
- [ ] Document any item that was declined with the reason — this is institutional memory

---

## ③ Sprint-End Product Review (Sprint-End — 90 min)

Runs on the last day of each sprint, after the sprint review meeting. This is the PM's own review — deeper than the delivery standup, focused on product learning.

### Agenda

```
00:00 – 00:20  Sprint outcomes vs. commitments
00:20 – 00:40  Metrics: did shipped work move the needle?
00:40 – 00:60  Roadmap: what changed this sprint that affects next quarter?
01:00 – 01:15  Discovery: what's in the pipeline? What's next?
01:15 – 01:30  Decisions log: what product decisions were made this sprint?
```

### 3.1 Sprint Outcomes

```
Committed items: <N>
Shipped items:   <N>
Slipped items:   <N> — list with reason for each slip

Sprint goal: Achieved / Partially achieved / Missed
  → If missed: what was the gap? Product issue or engineering issue?

Scope changes: <list any items added or removed mid-sprint with reason>
```

### 3.2 Sprint Metrics Snapshot

For every feature that shipped this sprint:
- [ ] Metrics instrumentation confirmed live in production
- [ ] Baseline recorded (T+0 values) — critical for measuring impact
- [ ] North star target restated: what result do we expect in 4 weeks?
- [ ] First metric review date set (T+7 days)

### 3.3 Roadmap Quarterly Health

Once per sprint, assess the full quarterly roadmap:

```
Initiatives in flight: <N>
Initiatives at risk:   <N> — list
Initiatives blocked:   <N> — list with blocker
Estimated sprint-to-completion for each:  <table>

Quarterly goal:    <stated goal>
Current forecast:  On track / At risk / Off track
Gap:               <if at risk or off track — what specifically is behind>
```

### 3.4 Product Decisions Log

Every product decision made this sprint is documented:
- [ ] Each decision logged in `memory/product-decisions.md`
- [ ] Each decision includes: what was decided, evidence basis, rejected alternatives
- [ ] Any decision that reversed a previous decision explicitly noted as a reversal with reason

---

## ④ Discovery Pipeline Review (Bi-weekly — 30 min)

**Owner:** pm-agent + strategist-agent
**Purpose:** Is the discovery pipeline healthy? Do we have enough validated opportunities for the next quarter?

### 4.1 Pipeline Health

The discovery pipeline should always contain:
- **2–4 opportunities in active discovery** (validation in progress)
- **4–6 opportunities in the backlog** (not yet started)
- **0 opportunities blocking the roadmap** (if the roadmap is empty, discovery is behind)

### 4.2 Opportunity Assessment

For each opportunity in active discovery:

```
Opportunity: <name>
Stage: problem-definition / evidence-gathering / validation / go/no-go
Key assumption: <the one thing that must be true for this to be worth building>
Assumption status: validated / unvalidated / falsified
Evidence quality: strong / moderate / weak / none
Next action: <what happens this week>
Go/No-Go date: <when will we make the call>
```

### 4.3 Discovery Health Rules

| Signal | Status | Action |
|--------|--------|--------|
| All assumptions validated with strong evidence | Healthy | Move to PRD |
| Key assumption unvalidated after 4 weeks | At risk | Time-box 1 more week; then kill or accept risk |
| Key assumption falsified | Learning | Document the learning; kill the opportunity |
| No opportunities in active discovery | Critical | PM is working the roadmap, not building the future |
| Roadmap is empty beyond 1 sprint | Critical | Discovery pipeline is behind by 1–2 sprints |

### 4.4 Opportunity Scoring (RICE)

| Field | Definition |
|-------|-----------|
| **Reach** | How many users affected in the next quarter? (estimate) |
| **Impact** | How much will it improve the north star? (1=minimal, 2=low, 4=medium, 8=high, 10=massive) |
| **Confidence** | How certain are we? (100%=high, 80%=medium, 50%=low) |
| **Effort** | Person-weeks for the team |
| **Score** | (Reach × Impact × Confidence%) / Effort |

Rank all backlog opportunities by RICE score. The top 2–3 by score should be the next to enter active discovery.

---

## ⑤ PM Review Artifact Checklist

After each review cycle, these artifacts must be saved:

| Review | Artifact | Path |
|--------|----------|------|
| Weekly Metrics | Metrics snapshot | `analytics/<date>-weekly-metrics-snapshot.md` |
| Weekly Roadmap | Roadmap health note (if changes made) | Update `prds/` + `memory/product-decisions.md` |
| Sprint-End | Sprint product review | `sprints/<sprint-id>/sprint-product-review.md` |
| Discovery | Pipeline status update | `wiki/processes/discovery-pipeline-status.md` |

**Nothing is decided verbally.** Every product call that affects the roadmap or an in-flight feature is written down before the review session ends.

---

## ⑥ PM Review Escalation

| Situation | Action | Owner |
|-----------|--------|-------|
| Feature classified Failing 2+ weeks in a row | Escalate to strategist-agent: iterate vs. kill decision | pm-agent |
| Roadmap empty beyond 1 sprint | Emergency discovery sprint: identify + score 5 opportunities this week | pm-agent + strategist-agent |
| Metric moves significantly in unexpected direction | Root cause session within 48h | pm-agent + analytics-agent |
| Sprint goal missed 2 sprints in a row | Process review: is the team under-capacity, or is work mis-estimated? | pm-agent + delivery-agent |
| Conflicting stakeholder priorities threatening roadmap integrity | Facilitate prioritization session with human operator | pm-agent |

---

## ⑦ PM Review Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|------------|
| Reviewing metrics without acting on them | Metrics reviews that produce no actions are theater |
| Updating the roadmap in Slack threads | Roadmap changes must be in the canonical artifact; threads are invisible to future agents |
| Attributing metric movements to features without evidence | Correlation is not causation; always ask "what else changed?" |
| Keeping a failing feature on life support to avoid hard conversations | Sunk cost. Kill criteria exist to protect future investment, not punish past work |
| Skipping discovery because the roadmap is "full" | A full roadmap with no future pipeline is 1 sprint away from a planning crisis |
| Accepting "users will love it" as evidence | Evidence must be cited: user research, data, support tickets — not intuition |
