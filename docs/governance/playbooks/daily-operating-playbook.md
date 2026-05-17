---
type: playbook
id: PLAY-DAILY
version: "1.0"
cadence: daily
created: 2026-05-08
updated: 2026-05-08
owner: delivery-agent
participants: [delivery-agent, engineer-agent, pm-agent, on-call]
estimated-duration: 60–90 minutes (distributed across the day)
---

# Daily Operating Playbook

The daily operational rhythm for the Enterprise AI OS. Run this every working day. Every section has a time box — if it runs over, something is wrong.

**Entry condition:** Start of working day.
**Exit condition:** All sections complete; blockers escalated; status posted.

---

## Overview: Daily Time Budget

| Window | Section | Owner | Time Box |
|--------|---------|-------|---------|
| Day start | Morning health check | delivery-agent | 15 min |
| Day start | Async standup | all agents | 10 min |
| Mid-morning | Triage & unblock | delivery-agent | 20 min |
| Ongoing | Execution | engineer-agent / active agents | all day |
| Midday | Midday pulse | delivery-agent | 10 min |
| End of day | EOD sync & handoff prep | delivery-agent | 15 min |

---

## ① Morning Health Check (15 min — delivery-agent)

Run immediately at day start, before any task work begins.

### 1.1 System Status

- [ ] Check monitoring dashboards: all services green
- [ ] Check error rate: within normal range (baseline ± 0.5%)
- [ ] Check latency P99: within SLA
- [ ] Check queue depth: no backlog spike
- [ ] Check deployment pipeline: no failed builds from overnight
- [ ] Check on-call log: any incidents overnight? If yes → read INC report, note action items

**If any check fails:** Open an incident before proceeding. `!incident` → `workflows/incident-workflow.md`.

### 1.2 Active Workflow Status

- [ ] Open `memory/workflow-state/` — identify all in-flight workflows
- [ ] For each active workflow: what step is it on? Is it blocked?
- [ ] Flag any workflow that has been on the same step > 24 hours without progress

### 1.3 Upcoming Deadlines (Next 48 Hours)

- [ ] Review sprint board: any items due today or tomorrow?
- [ ] Review `memory/open-questions.md`: any questions due today?
- [ ] Review `memory/known-risks.md`: any risks with review dates today?
- [ ] Flag time-sensitive items for morning triage

**Output:** Mental model of the day's state. Post a one-paragraph status note to the team channel if any anomaly found.

---

## ② Async Standup (10 min — all agents)

Each active agent answers three questions in the team channel or standup doc. Synchronous meeting is optional — async is the default.

**Format (per agent):**
```
Yesterday: <what was completed — link to artifacts>
Today:     <what will be worked on — specific, not vague>
Blockers:  <what is preventing progress, or "none">
```

**Rules:**
- "Yesterday" must reference a named artifact or decision, not just activity
- "Today" must be a specific task, not a domain ("working on engineering" is not acceptable)
- Blockers must be escalated to delivery-agent the same day — not held for tomorrow

**Delivery-agent reads all standups and:**
- [ ] Identifies any two agents with conflicting work that needs coordination
- [ ] Flags any blocker that requires a new decision or escalation
- [ ] Posts a combined summary if stakeholders need awareness

---

## ③ Triage & Unblock (20 min — delivery-agent)

### 3.1 New Inbound

Review any new requests, artifacts, or messages that arrived since EOD yesterday:

- [ ] New bug reports → triage severity, assign to sprint or backlog
- [ ] New handoffs in `handoffs/` → verify completeness, route to receiving agent
- [ ] New PRD or RFC drafts → assign reviewer, set review deadline
- [ ] New questions in `memory/open-questions.md` → assign owner

### 3.2 Unblock Active Work

For each blocker raised in standup:

```
Is the blocker a missing decision?
  → Route to decision owner; set a 24h SLA
  → If decision will take > 24h: find parallel work for blocked agent

Is the blocker a dependency on another agent?
  → Check if the dependency is genuinely blocking or just expected next
  → Sequence the work; update task status

Is the blocker an external dependency (outside the OS)?
  → Escalate to human operator or named stakeholder
  → Record in memory/open-questions.md if unresolved

Is the blocker a technical unknown?
  → Time-box a spike: max 4h to resolve the unknown; then decide or escalate
```

### 3.3 Priority Conflicts

If two items are competing for the same agent's time:

1. Check `memory/decisions.md` — is there an existing priority rule?
2. Apply: Security > Incident > P0 commitment > roadmap work > technical debt
3. If still unclear: escalate to pm-agent for priority call within 2 hours

---

## ④ Execution (All Day — Active Agents)

### 4.1 Work Standards (Always Active)

- Every work session produces a named artifact — no invisible work
- Agent picks up the highest-priority unblocked task at the start of each session
- If a task takes more than 2× its estimate, raise a flag — don't silently continue
- If a new decision is needed mid-task, raise it immediately — don't assume

### 4.2 Continuous Checks (Engineering Day)

| Trigger | Action | Owner |
|---------|--------|-------|
| CI build fails | Stop and fix before new work | engineer-agent |
| Test coverage drops below 80% | Fix before merge | engineer-agent |
| New CVE in dependency | Assess severity; patch if HIGH/CRITICAL today | security-agent |
| PR open > 24h without review | Ping reviewer; escalate if > 48h | delivery-agent |
| Staging anomaly | Investigate before next deploy | engineer-agent |

### 4.3 Decision Log

Any decision made during execution that affects another agent or future work:
- Log immediately in the relevant artifact or handoff
- If cross-domain: add to `memory/decisions.md`
- Do not hold decisions until EOD sync

---

## ⑤ Midday Pulse (10 min — delivery-agent)

A lightweight checkpoint to catch drift before EOD.

- [ ] Is each agent making progress on their stated "Today" item?
- [ ] Has any new blocker emerged that wasn't in standup?
- [ ] Is the error rate still within normal range? (Quick dashboard glance)
- [ ] Are any release or milestone deadlines now at risk?

**If anything is off-track:** Adjust assignments now — not at EOD.

---

## ⑥ EOD Sync & Handoff Prep (15 min — delivery-agent)

### 6.1 Work Closure

Each active agent before stopping:
- [ ] All in-progress artifacts saved to canonical path
- [ ] Workflow state updated in `memory/workflow-state/<workflow-id>.md`
- [ ] If handing off to another agent: handoff envelope written using `templates/handoff-template.md`
- [ ] PR opened or draft saved for any code work — no uncommitted work left locally

### 6.2 Status Post

Delivery-agent posts a one-paragraph EOD status to the team channel:

```
EOD — <date>

Completed today: <list of artifacts or decisions closed>
In progress:     <what carries over — specific, linked>
Blockers open:   <any unresolved blockers — owner and deadline>
Tomorrow:        <top 3 priorities>
Alerts:          <any anomaly worth noting overnight>
```

### 6.3 On-Call Handoff

If the day involves a production system:
- [ ] Review monitoring alerts: anything expected to fire overnight?
- [ ] On-call engineer briefed on any in-flight deploys or known fragile states
- [ ] Runbook for any elevated risk scenario confirmed accessible: `wiki/runbooks/`

---

## ⑦ Daily Governance Checks

These run every day without exception. Not optional under deadline pressure.

| Check | Owner | Consequence if Skipped |
|-------|-------|----------------------|
| Morning health check before task work | delivery-agent | May start work in a degraded system state |
| All standups submitted before triage | all agents | Triage is incomplete without full picture |
| Blockers raised same day they occur | active agents | 24h delay compounds into sprint risk |
| EOD state saved to canonical paths | active agents | Next session starts without context |
| Anomalous metrics investigated before dismissing | delivery-agent | Silent degradations become incidents |

---

## ⑧ Daily Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|------------|
| "I'll document it tomorrow" | Tomorrow has its own work; documentation debt compounds |
| Standup item: "working on X" with no artifact link | Invisible work cannot be reviewed, unblocked, or handed off |
| Dismissing a monitoring anomaly as "probably nothing" | Incidents that go undetected for hours cost hours to resolve |
| Holding a blocker until the next scheduled meeting | 8 hours of blocked work is one day of sprint velocity gone |
| Context-switching without closing the previous task state | Produces incomplete artifacts and confused handoffs |

---

## ⑨ Escalation Paths

| Situation | Escalate To | SLA |
|-----------|------------|-----|
| Production anomaly | on-call engineer → `!incident` | Immediate |
| Blocker requiring a product decision | pm-agent | 2 hours |
| Blocker requiring an architecture decision | architect-agent | 4 hours |
| Security concern | security-agent | Immediate |
| Sprint at risk (> 20% of items slipping) | delivery-agent → pm-agent | Same day |
| Governance question | supervisor-agent | Same day |
