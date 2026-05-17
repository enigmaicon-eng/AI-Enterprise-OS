---
type: incident-report
version: "2.0"
incident-id: INC-<YYYY-MM-DD>-<slug>
severity: P1 | P2 | P3 | P4
status: active | mitigated | resolved | post-mortem-scheduled | post-mortem-complete
declared: <ISO timestamp>
mitigated: <ISO timestamp>
resolved: <ISO timestamp>
duration: <N hours N minutes>
commander: <name or agent>
scribe: <name or agent>
affected-services: []
---

# Incident Report: INC-<YYYY-MM-DD>-<slug>

> **Severity:** `P<N>` — `<one-line description of impact>`
> **Status:** `ACTIVE | MITIGATED | RESOLVED`
> **Commander:** `<name>`

---

## ① Executive Summary

_Written after resolution. One paragraph: what happened, who was affected, how long, root cause, and the remediation taken._

`<Fill after resolution>`

---

## ② Impact

| Dimension | Detail |
|-----------|--------|
| **Users affected** | `<N users or % of user base>` |
| **Services affected** | `<list of systems and components>` |
| **Duration** | `<start ISO timestamp>` → `<end ISO timestamp>` (`<N minutes>`) |
| **Data affected** | none / `<type, scope, record count>` |
| **Data integrity** | verified intact / `<describe corruption or loss>` |
| **Revenue impact** | none / `<estimated $amount>` |
| **SLA breach** | No / Yes — `<which SLA, by how much>` |
| **Customer notifications sent** | No / Yes — `<channel and time>` |

---

## ③ Timeline

All times in UTC. Record every meaningful event — detection to all-clear.

| Time (UTC) | Event | Who |
|-----------|-------|-----|
| `<ISO>` | Anomaly detected: `<what was observed>` | `<monitoring / user / engineer>` |
| `<ISO>` | Incident declared P`<N>` | `<commander>` |
| `<ISO>` | On-call engineer paged | automated |
| `<ISO>` | War room opened | `<commander>` |
| `<ISO>` | Initial hypothesis: `<what was suspected>` | `<engineer>` |
| `<ISO>` | Hypothesis confirmed / rejected: `<finding>` | |
| `<ISO>` | Mitigation applied: `<action taken>` | |
| `<ISO>` | Incident mitigated (degraded service ends) | |
| `<ISO>` | Root cause confirmed | |
| `<ISO>` | Fix deployed: `<description>` | |
| `<ISO>` | All systems confirmed healthy | |
| `<ISO>` | All-clear declared | `<commander>` |
| `<ISO>` | Customer communication sent | |

---

## ④ Detection

**How detected:** monitoring alert / user report / engineer observation / automated test

**Detection tool/source:** `<alert name, monitoring tool, or reporter>`

**Detection latency:** `<time from first anomaly to alert firing>`

**Detection gap:** `<why it took this long — what would have caught it sooner>`

---

## ⑤ Root Cause Analysis

> Root cause must be specific and actionable. "Human error" is **never** the root cause — human error has a systemic root cause. Apply 5-Whys.

### 5.1 Five-Whys Chain

```
Problem:  <symptom observed by users>

Why (1):  <immediate technical cause>
Why (2):  <cause of that cause>
Why (3):  <cause of that cause>
Why (4):  <cause of that cause>
Why (5):  <systemic / process root cause>

Root cause:  <statement derived from Why 5>
```

### 5.2 Root Cause Category

| Category | Selected |
|---------|---------|
| Code bug | ☐ |
| Configuration error | ☐ |
| Infrastructure failure | ☐ |
| External dependency | ☐ |
| Data quality / corruption | ☐ |
| Capacity / scaling | ☐ |
| Security incident | ☐ |
| Process / human factors | ☐ |

### 5.3 Root Cause Statement

`<One precise sentence: what was the root cause and why the system allowed it>`

---

## ⑥ Contributing Factors

Factors that amplified impact, slowed detection, or slowed resolution:

| Factor | Category | How It Contributed |
|--------|----------|-------------------|
| `<factor>` | detection / impact / resolution | `<description>` |

---

## ⑦ What Went Well

Document actions that worked — these should be reinforced, not forgotten.

- `<detection mechanism that fired correctly>`
- `<escalation that happened appropriately>`
- `<decision that was correct under pressure>`
- `<communication that was clear and timely>`

---

## ⑧ What Went Wrong

Document failures in detection, response, communication, or process — without blame.

- `<gap in monitoring that delayed detection>`
- `<process that slowed resolution>`
- `<communication breakdown>`
- `<assumption that was wrong>`

---

## ⑨ Action Items

Every action item must be: specific, owned, time-bound, and linked to a ticket.

| ID | Action | Type | Owner | Due | Ticket | Status |
|----|--------|------|-------|-----|--------|--------|
| AI-01 | `<specific action>` | prevention / detection / response / process | `<name>` | `<YYYY-MM-DD>` | `<ticket-id>` | Open |
| AI-02 | | | | | | |

**Accountability:** Action item owner is responsible for delivery by due date. Delivery manager tracks weekly. Overdue items escalate to engineering lead.

---

## ⑩ Mitigation & Fix

### 10.1 Immediate Mitigation (During Incident)

`<What was done to stop user impact — rollback, config change, traffic redirect, etc.>`

### 10.2 Root Cause Fix

`<What permanent fix was deployed and when>`

**Fix verification:** `<how we confirmed the fix resolved the root cause>`

**Abbreviated QA performed:**
- [ ] Core functionality verified in staging
- [ ] Root cause scenario tested and passes
- [ ] No regression in adjacent functionality

### 10.3 Monitoring Changes

`<New alerts or dashboards added as a result of this incident>`

---

## ⑪ Stakeholder Communications

| Time | Channel | Audience | Message Summary | Sent By |
|------|---------|---------|----------------|---------|
| `<ISO>` | `<email/slack/status page>` | `<all-users / enterprise / internal>` | `<summary>` | |

**Status page updated:** Yes / No

**Customer success notified:** Yes / No / N/A

---

## ⑫ Runbook & Process Updates

- [ ] Runbook created/updated: `wiki/runbooks/<slug>.md`
- [ ] Monitoring/alerting gap addressed: `<describe change>`
- [ ] Test coverage gap addressed: `<describe new test>`
- [ ] On-call documentation updated
- [ ] Architecture decision recorded (if systemic): `ADR-NNN`
- [ ] Post-mortem shared with engineering org

---

## ⑬ Post-Mortem Review

**Scheduled date:** `<YYYY-MM-DD>`

**Attendees:** `<list>`

**Facilitator:** `<name>`

**Review outcome:**
- [ ] All action items reviewed and owners confirmed
- [ ] Root cause accepted by engineering lead
- [ ] "Human error" NOT listed as a final root cause
- [ ] Learnings documented in `wiki/learnings/<date>-<slug>.md`

**Post-mortem status:** not scheduled / scheduled / complete
