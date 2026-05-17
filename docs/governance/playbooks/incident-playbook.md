---
type: playbook
id: PLAY-INCIDENT
version: "1.0"
cadence: on-demand (triggered by !incident)
created: 2026-05-08
updated: 2026-05-08
owner: incident-commander
participants: [on-call-engineer, incident-commander, delivery-agent, security-agent (if relevant), pm-agent]
estimated-duration: P1 ≤ 1h | P2 ≤ 4h | P3 ≤ 24h | P4 ≤ 72h
---

# Incident Playbook

Trigger this playbook with `!incident`. From that moment, follow this playbook strictly — do not improvise the process.

**Blameless principle:** We blame systems, not people. "Human error" is never the root cause — it is a symptom with a systemic cause. Any post-mortem that names a person as the root cause is rejected.

---

## Severity Classification (Do This First)

Classify immediately — severity drives urgency, staffing, and communication SLAs.

| Severity | Definition | MTTR Target | Communication SLA |
|----------|-----------|------------|-----------------|
| **P1 — Critical** | Complete outage or data loss affecting all users | ≤ 1 hour | Internal: 15 min; Customer: 30 min |
| **P2 — High** | Major feature broken, significant user impact, no workaround | ≤ 4 hours | Internal: 30 min; Customer: 1 hour |
| **P3 — Moderate** | Feature degraded, workaround exists, limited user impact | ≤ 24 hours | Internal: 2 hours; Customer: same-day (if visible) |
| **P4 — Low** | Minor issue, no user impact or cosmetic only | ≤ 72 hours | Internal only; no customer communication required |

**When unsure:** Classify higher. Downgrade if evidence confirms lower severity. Never start at low and hope it's not worse.

---

## Incident Phases

```
DETECT → DECLARE → RESPOND → DIAGNOSE → MITIGATE → RESOLVE → POST-MORTEM
```

---

## Phase 1 — Detect & Declare (T+0 to T+5 min)

The clock starts the moment an anomaly is detected — not when it's confirmed.

### 1.1 Detection Sources

- Monitoring alert fires (preferred — automated detection)
- User or customer report (detection gap — investigate why monitoring didn't catch it)
- Engineer observes anomaly during work
- On-call engineer proactive check

### 1.2 Immediate Classification

Before doing anything else, answer two questions:

```
Q1: Are users experiencing degraded service RIGHT NOW?
  → Yes: declare an incident (see 1.3)
  → No, but something looks wrong: monitor for 5 min; if it doesn't resolve, declare

Q2: Is there any risk of data loss, data corruption, or security breach?
  → Yes: declare P1 immediately regardless of user impact
  → No: classify by user impact
```

### 1.3 Declare the Incident

```
Post to incident channel (#incidents or equivalent):

"!incident
Declared at: <time UTC>
Severity: P<N>
Summary: <one sentence — what is broken, who is affected>
Commander: <name>
War room: <link or location>"
```

- [ ] Incident ID assigned: `INC-<YYYY-MM-DD>-<slug>`
- [ ] Incident report created from template: `templates/incident-template.md`
- [ ] Report file saved: `incidents/INC-<YYYY-MM-DD>-<slug>.md`

---

## Phase 2 — Respond (T+0 to T+15 min)

### 2.1 Staffing

| Role | Responsibility | Who |
|------|---------------|-----|
| **Incident Commander** | Owns the process; makes decisions; drives to resolution | on-call lead / delivery-agent |
| **Technical Lead** | Investigates and fixes | on-call engineer / engineer-agent |
| **Comms Lead** | Writes stakeholder updates | pm-agent or delivery-agent |
| **Scribe** | Documents timeline and findings in real time | designated — not the commander or tech lead |

**Commander rule:** Commander does NOT debug. Commander orchestrates, decides, and communicates. If commander is also debugging, get more people.

### 2.2 War Room Open

- [ ] Synchronous channel or call opened (P1/P2 only — P3/P4 async is acceptable)
- [ ] All responders have access to incident report doc
- [ ] Scribe starts the timeline log in the incident report
- [ ] No spectators in the war room — everyone present has a role

### 2.3 Initial Stakeholder Notification

**P1:** Send within 15 minutes of declaration.
**P2:** Send within 30 minutes of declaration.

```
Template:

SUBJECT: [<SEVERITY>] <One-line description> — Under Investigation

We are currently investigating an issue affecting <what>.
Detected at: <time>
Impact: <who and what>
Status: Investigating
Next update: <time (30–60 min from now)>
```

Send to: engineering leadership, PM, customer success (P1/P2). Do not speculate on cause.

---

## Phase 3 — Diagnose (T+5 to T+<MTTR>)

### 3.1 Investigation Framework

Work through this checklist in order. Stop at the first positive finding.

```
① What changed recently?
   → Deployments in last 24 hours: <check deploy log>
   → Config changes: <check config history>
   → Feature flag changes: <check flag service>
   → External dependency changes: <check vendor status pages>

② What do the metrics show?
   → Error rate: when did it start? Which endpoints?
   → Latency: correlated with error spike?
   → Resource utilization: CPU, memory, disk, connections
   → Queue depth: backing up?

③ What do the logs show?
   → Error logs at the time of onset
   → Any new error types that didn't exist before onset?
   → Correlation between specific users / accounts and errors?

④ Is it isolated or systemic?
   → Affects all users or a subset?
   → Affects all regions or specific geography?
   → Affects all features or a specific component?

⑤ Is data integrity at risk?
   → Any writes failing? Any writes succeeding when they shouldn't?
   → Database constraints: any violations?
   → Queue: any messages lost or duplicated?
```

### 3.2 Hypothesis Formation

After initial investigation, form a hypothesis:

```
Hypothesis: "<Specific technical cause — precise enough that it's falsifiable>"
Evidence for: "<What you saw that supports this>"
Evidence against: "<What doesn't fit>"
Test: "<How you will confirm or refute this in < 10 minutes>"
```

Record hypothesis in the incident report. Do not act on an unconfirmed hypothesis for destructive actions (like data rollback).

### 3.3 Communication Cadence

**P1:** Update stakeholders every 30 minutes, even if there is no new finding.
**P2:** Update every 60 minutes.

```
Update format:
  Status: [Investigating | Root cause identified | Mitigation in progress | Mitigated]
  Finding: <What we know now>
  Next action: <What we're doing>
  ETA: <Best estimate — or "unknown — will update in N min">
```

---

## Phase 4 — Mitigate (T+varies)

Mitigation = stopping user impact. This is different from the permanent fix.

### 4.1 Mitigation vs. Fix

| Mitigation | When to Use |
|-----------|------------|
| Roll back the deployment | Recent deploy is the likely cause |
| Disable the feature flag | Feature is the blast radius |
| Restart a service | Memory leak, stuck process, corrupted state |
| Redirect traffic | One region or instance is faulty |
| Rate limit or throttle | Downstream overwhelm |
| Take subsystem offline | Better degraded than cascading failure |

**Rule:** Take the fastest mitigation that stops user impact, even if it's not elegant. You can fix the underlying cause after users are unaffected.

### 4.2 Rollback Decision

Roll back if:
- Cause is a recent deployment AND rollback is < mitigation time
- Cause is unclear AND a deployment happened in the last 24 hours
- P1 and you've been investigating for > 15 minutes without a clear fix

Do NOT roll back if:
- The deployment includes a non-reversible database migration (assess data risk first)
- Rollback is known to cause a different issue

### 4.3 Mitigation Confirmation

Once mitigation is applied:
- [ ] Error rate: returning to baseline
- [ ] User-reported behavior: resolved
- [ ] Monitoring: no new anomalies

**Declare "Mitigated"** as soon as user impact has ended — even if root cause investigation continues.

```
Post: "Mitigated at <time>. Impact ended. Root cause investigation continues."
```

---

## Phase 5 — Resolve (T+mitigation to T+resolution)

Resolution = root cause confirmed AND permanent fix deployed.

### 5.1 Root Cause Confirmation

Before declaring resolved, answer:
- [ ] Root cause is stated precisely and specifically — not "a bug" or "human error"
- [ ] Root cause explains 100% of the observed symptoms
- [ ] The fix directly addresses the root cause (not just a symptom)

### 5.2 Fix & Abbreviated QA

Abbreviated QA for incident fixes (3 checks only — not full QA cycle):
- [ ] Root cause scenario: does the fix prevent the issue from recurring?
- [ ] Core functionality: does the feature still work end-to-end?
- [ ] Adjacent functionality: does nothing adjacent regress obviously?

### 5.3 Resolution Communication

```
RESOLVED — <Incident ID>

Resolved at: <time UTC>
Duration: <total duration from detection to resolution>
Root cause: <one precise sentence>
Fix: <what was deployed>
Users affected: <N or %>
Data impact: none / <describe>
```

Send to all stakeholders who received the initial notification.

- [ ] Status page updated to resolved
- [ ] Incident report status updated to `resolved`
- [ ] Timeline completed in incident report

---

## Phase 6 — Post-Mortem

**Required for all P1 and P2 incidents.** Optional but recommended for P3 with systemic root cause.

### 6.1 Scheduling

- P1: Post-mortem within 2 business days
- P2: Post-mortem within 5 business days
- Attendees: incident commander, technical lead, scribe, + anyone who should learn from this

### 6.2 Post-Mortem Format (60 min)

```
00:00 – 00:05  Ground rules: blameless, focus on systems
00:05 – 00:20  Timeline walkthrough (scribe presents — not commander)
00:20 – 00:35  Five-Whys root cause analysis (group exercise)
00:35 – 00:50  What went well / what went wrong
00:50 – 01:00  Action items: specific, owned, time-bound
```

### 6.3 Five-Whys Rules

- Start with the user-visible symptom, not the technical finding
- Each "why" must be a systems finding — not a person
- Stop when you reach something the organization can actually change (process, tooling, architecture, monitoring)
- Valid root causes: missing test coverage, alert gap, unclear runbook, architectural fragility, config error, dependency design
- Invalid root causes: "engineer forgot to check X", "developer made a mistake"

### 6.4 Action Items Standard

Each action item must be:
- **Specific**: "Add alert for error rate spike on /checkout endpoint" — not "improve monitoring"
- **Owned**: One named person or agent
- **Time-bound**: Due date within 4 weeks
- **Tracked**: Linked to a ticket on the sprint board

### 6.5 Post-Mortem Artifact

File: `incidents/INC-<YYYY-MM-DD>-<slug>.md` (complete §⑤ through §⑬ of incident template)

- [ ] Approved by incident commander
- [ ] "Human error" does NOT appear as a root cause
- [ ] Action items entered on sprint board
- [ ] Shared with engineering org (post-mortem culture, not blame culture)
- [ ] Non-obvious learnings saved to `wiki/learnings/<date>-<slug>.md`

---

## Commander Checklist (Quick Reference)

Print or paste this at the top of every incident war room:

```
FIRST 5 MIN:
  □ Classify severity
  □ Name a commander and scribe (not the same person)
  □ Open war room
  □ Post declaration in incident channel
  □ Create incident report file

FIRST 15 MIN:
  □ Staff the response correctly
  □ Send initial stakeholder notification (P1/P2)
  □ Start investigation framework (§3.1)

ONGOING:
  □ Drive to a hypothesis — don't just log symptoms
  □ Update stakeholders on cadence (P1: 30 min, P2: 60 min)
  □ Mitigate as soon as the fastest path is clear
  □ Separate mitigation from root cause fix

AFTER MITIGATION:
  □ Declare "Mitigated" publicly
  □ Continue to root cause
  □ Send resolution communication when RCA confirmed and fix deployed
  □ Schedule post-mortem

NEVER:
  □ Speculate publicly about cause before confirmation
  □ Accept "human error" as a root cause
  □ Skip the post-mortem for P1/P2
  □ Assign blame in the post-mortem
```

---

## Severity Downgrade / Upgrade Rules

**Upgrade** (escalate severity) if at any point:
- User impact is larger than initially assessed
- Data integrity is at risk
- Security breach is suspected
- Mitigation is not working and MTTR target will be missed

**Downgrade** if:
- Impact is confirmed smaller than initial assessment
- Mitigation has been applied and users are unaffected
- Investigation reveals the issue does not affect production

Log any severity change in the incident timeline with a reason.
