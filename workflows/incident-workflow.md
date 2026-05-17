# Incident Workflow

```
workflow_id:    incident-workflow
version:        1.0.0
trigger:        "!incident", "production down", "outage", "data loss", "users can't", "P1", "P2", monitoring alert
intent_class:   DELIVERY (escalates to ENG, ARCH, SECURITY as needed)
total_steps:    12
typical_duration: P1: hours, P2: hours–1 day, P3: 1 day, P4: 1–3 days
state_file:     memory/workflow-state/incident-{slug}.yaml
priority:       CRITICAL — overrides all other active workflows
```

---

## Purpose

Minimize time to resolution for production incidents. Coordinate investigation, communication, and remediation across all orgs. Ensure every incident produces a documented post-mortem with specific, owned action items that prevent recurrence.

**Rules:**
- `!incident` prefix bypasses ALL workflow queues and routing
- Incident Commander (IC) role is assigned in Step 02 — ONE person, not a committee
- All communications during an incident use the incident channel only
- The post-mortem is blameless — focus on systems and processes, not individuals
- Action items from post-mortems are tracked until completion

---

## Severity Matrix

| Severity | Impact | Response Time | IC | Stakeholders |
|----------|--------|--------------|-----|-------------|
| **P1** | Total outage, data loss, security breach, > 20% users affected | Immediate | Senior Engineer + Delivery | Exec + all users (if data) |
| **P2** | Major feature broken, > 10% users affected, no workaround | 15 minutes | Engineer + Delivery | Engineering leads + PM |
| **P3** | Partial degradation, < 10% users affected, workaround exists | 30 minutes | Engineer | Engineering team |
| **P4** | Minor issue, no user impact, cosmetic | 1 business hour | Engineer (async) | Ticket only |

---

## Agent Sequence

```
STEP 01  ANY_AGENT / delivery-agent   Detection & Declaration
STEP 02  delivery-agent               Incident Commander Assignment & Severity
STEP 03  delivery-agent               Stakeholder Notification
STEP 04  engineer-agent               Active Investigation
STEP 05  engineer-agent + architect   Diagnosis & Root Cause Hypothesis
STEP 05S security-agent               Security Assessment (if breach indicators)
STEP 06  engineer-agent               Fix Development OR Rollback Decision
STEP 07  qa-agent (abbreviated)       Fix Validation
STEP 08  delivery-agent + engineer    Resolution Deployment
STEP 09  delivery-agent               All-Clear & Post-Resolution Monitoring
STEP 10  ALL involved agents          Post-Incident Review (blameless)
STEP 11  delivery-agent + pm-agent    Action Item Tracking
STEP 12  delivery-agent               Incident Closure & Wiki Update
```

---

## Step Specifications

---

### STEP 01 — Detection & Declaration

**Agent:** `ANY` (whoever detects first) → `delivery-agent`
**Time budget:** 0–5 minutes

**Detection sources:**
- Monitoring alert (automated)
- User report (support ticket, social media)
- Internal report (team member notices)
- Analytics anomaly (`analytics-agent` flags)
- Security alert (`security-agent` flags)

**Declaration format:**
```
!incident
Severity: P[N] (estimated)
Summary: [one sentence describing what's broken]
Detected: [timestamp]
Source: monitoring | user_report | internal | security_alert
Affected: [system or feature]
Evidence: [link to alert/ticket/log]
```

**Immediate actions (delivery-agent):**
1. Create incident record: `wiki/incidents/{date}-{slug}.md` using `templates/incident-template.md`
2. Open incident channel (Slack: #incident-{date}-{slug})
3. Set incident status: `ACTIVE`
4. Trigger Step 02

**Artifact:**
```
path:   wiki/incidents/{date}-{slug}.md
initial_fields:
  incident_id: {date}-{slug}
  declared: ISO_timestamp
  severity: P1 | P2 | P3 | P4
  status: ACTIVE
  summary: string
  detection_source: string
  affected_system: string
```

---

### STEP 02 — Incident Commander Assignment & Severity

**Agent:** `delivery-agent`
**Time budget:** 2–5 minutes

**Instructions:**
1. Assign Incident Commander (IC) — exactly ONE person:
   - P1: Most senior available engineer + delivery-agent
   - P2: On-call engineer + delivery-agent
   - P3/P4: On-call engineer (delivery-agent optional)
2. Confirm or revise severity based on available information:
   - Apply severity matrix above
   - When in doubt: declare HIGHER severity, downgrade later
3. Brief the IC: share the incident record, set expectations
4. IC owns: investigation direction, communication cadence, resolution decision

**Severity revision rule:** Severity can be downgraded only after the incident is RESOLVED. During an incident, always err toward higher severity.

**Escalation triggers for P1 specifically:**
- Exec notification within 5 minutes of P1 declaration
- Customer success / support notification immediately
- Regulatory notification assessment if data is involved

---

### STEP 03 — Stakeholder Notification

**Agent:** `delivery-agent`
**Time budget:** 0–5 minutes (P1/P2), ≤ 30 minutes (P3/P4)
**Template:** Use exactly this format for all external communications.

**Status update template:**
```
INCIDENT STATUS UPDATE
━━━━━━━━━━━━━━━━━━━━━━
Incident: {slug}
Severity: P{N}
Status: INVESTIGATING | IDENTIFIED | FIXING | MONITORING | RESOLVED
Time: {ISO timestamp}

IMPACT
What's affected: {brief description}
Who's affected: {user scope}

WHAT WE'RE DOING
{Current action being taken}

NEXT UPDATE: {timestamp}
```

**Notification matrix:**

| Severity | Notify | Channel | Timing |
|----------|--------|---------|--------|
| P1 | Exec, all-hands, affected users | Email + Slack + Status page | Immediately |
| P2 | Engineering leads, PM | Slack + Status page | Within 15 min |
| P3 | Engineering team | Slack | Within 30 min |
| P4 | Ticket assignee | Ticket comment | Within 1 hour |

**Update cadence:**
- P1: Every 30 minutes until resolved
- P2: Every 60 minutes until resolved
- P3: Every 2 hours
- P4: On resolution

---

### STEP 04 — Active Investigation

**Agent:** `engineer-agent` (on-call IC)
**Time budget:** 0–30 minutes initial hypothesis

**Investigation checklist (execute in order):**

```
□ STEP 4.1: Recent deployments
  Check: What was deployed in the last 24 hours?
  Command: git log --since="24 hours ago" --oneline
  Check: Was anything deployed in the last 2 hours?
  If YES: likely culprit; prepare rollback

□ STEP 4.2: Monitoring dashboards
  Check: Error rate — when did it spike?
  Check: Latency — when did it increase?
  Check: Request volume — is this a traffic spike or a code issue?
  Check: Infrastructure metrics — CPU, memory, disk, network

□ STEP 4.3: Log analysis
  Check: What errors are appearing? Since when?
  Check: Which specific endpoints or operations are failing?
  Check: Are errors clustered to specific users, regions, or request types?

□ STEP 4.4: Dependency check
  Check: Are upstream services healthy? (Check their status pages)
  Check: Are downstream services receiving traffic?
  Check: Is the database responding normally?
  Check: Are third-party APIs responding?

□ STEP 4.5: Data integrity check (P1 only)
  Check: Is any data being lost or corrupted?
  Check: Are write operations succeeding?
  Check: Are read operations returning correct data?
```

**Investigation report (post in incident channel at T+15):**
```
INVESTIGATION REPORT [T+{N}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hypothesis: {what we think is wrong}
Evidence:   {specific logs, metrics, timestamps}
Affected:   {exactly which systems/users/data}
Likely cause: {code bug | infra | external dependency | data issue | config change}
Next steps: {what we're doing in the next 15 minutes}
Fix ETA: {estimate or "unknown"}
```

---

### STEP 05 — Diagnosis & Root Cause Hypothesis

**Agent:** `engineer-agent` + `architect-agent` (P1/P2)
**Time budget:** 15–45 minutes

**Instructions:**
`engineer-agent` leads the technical investigation; `architect-agent` is pulled in for P1/P2 or when the root cause is systemic.

1. Narrow down from hypothesis to confirmed root cause:
   - Can this be reproduced?
   - What is the exact trigger condition?
   - What system component is failing, and why?
2. Categorize the root cause:

| Category | Examples | Fix Approach |
|---------|---------|-------------|
| **Code bug** | Logic error, null reference, edge case | Fix and deploy |
| **Configuration error** | Wrong env var, misconfigured service | Config change |
| **Infra failure** | Database down, disk full, OOM | Infrastructure action |
| **External dependency** | Third-party API down, CDN issue | Workaround or wait |
| **Data issue** | Corrupted data, migration failure | Data repair + fix |
| **Capacity** | Traffic spike, resource exhaustion | Scale or throttle |
| **Security incident** | Breach, injection, credential theft | Step 05S mandatory |

3. Produce: **Remediation decision** — Fix OR Rollback?

**Fix criteria:** Choose Fix when:
- Root cause is clear
- Fix is < 30 minutes to develop and test
- Fix can be deployed safely
- Rollback would cause its own problems (e.g., irreversible migration)

**Rollback criteria:** Choose Rollback when:
- Root cause is unclear
- Fix would take > 30 minutes (P1) or > 2 hours (P2)
- Rollback is clean and reversible
- Recent deployment is the likely cause

---

### STEP 05S — Security Assessment

**Agent:** `security-agent`
**Time budget:** Immediate (parallel with Step 05)
**Trigger (ANY of the following):**
- Unauthorized access detected in logs
- User data access anomaly
- Credential or key exposure suspected
- Unusual admin action recorded
- Error messages suggesting injection attacks
- External breach notification

**Instructions:**
1. DO NOT wait for Step 05 to complete — run in parallel
2. Assess immediately:
   - Is user data exposed?
   - Are credentials or keys compromised?
   - Is an attack actively ongoing?
3. If active attack → CONTAIN FIRST, investigate later:
   - Revoke compromised credentials immediately
   - Block attacker IPs/requests if identifiable
   - Isolate affected systems if needed
4. Preserve evidence BEFORE remediation (logs, forensic state)
5. Assess regulatory notification requirements:
   - GDPR: 72-hour notification to supervisory authority if personal data breached
   - Other applicable regulations per jurisdiction
6. Issue security status in incident channel within 10 minutes of Step 05S trigger

**Security status format:**
```
SECURITY ASSESSMENT [T+{N}]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Data exposure: YES | NO | UNKNOWN
Credentials compromised: YES | NO | UNKNOWN
Attack ongoing: YES | NO | UNKNOWN
Evidence preserved: YES | NO (required before any remediation)
Regulatory notification required: YES (by {deadline}) | NO | ASSESSING
Containment actions taken: {list or "none yet"}
```

**Escalation from Step 05S:**
- Any YES on data exposure or credentials → escalate to CEO/CPO + legal immediately
- Regulatory notification confirmed → draft notification, send within required deadline

---

### STEP 06 — Fix Development OR Rollback Decision

**Agent:** `engineer-agent`
**Time budget:** 15–60 minutes (fix) or 5–15 minutes (rollback)

**ROLLBACK PATH:**
1. Confirm rollback plan from release notes: `release/releases/{version}.md`
2. Execute rollback to last known good version
3. Verify recovery: run smoke test
4. Update incident status: `MONITORING`
5. Proceed to Step 09 (monitor recovery)

**FIX PATH:**
1. Write the minimal fix — no refactoring, no improvements, no scope creep
2. Apply ONLY changes required to resolve the incident
3. Review fix with second engineer (pair or quick async review)
4. Write targeted test to verify the fix
5. Do NOT wait for full test suite on P1/P2 (abbreviated QA in Step 07)

**Fix review checklist:**
```
□ Fix is minimal (touches only what's broken)
□ No unintended side effects identified
□ Second engineer reviewed
□ Targeted test written
□ Rollback path for the fix itself confirmed
```

---

### STEP 07 — Fix Validation (Abbreviated QA)

**Agent:** `qa-agent`
**Time budget:** 15–30 minutes (P1/P2), 30–60 minutes (P3)

**P1/P2 Abbreviated QA:**
This is NOT the full QA workflow. For incidents, run:
1. Can the original failure scenario be reproduced? → Should be NO after fix
2. Does the primary user flow work end-to-end?
3. Are error rates returning to baseline in staging?

**Full regression:** NOT required for incident fix. Full regression runs AFTER resolution as a follow-up action item.

**Gate (abbreviated):**
- [ ] Original failure scenario: CANNOT be reproduced
- [ ] Primary user flow: passes
- [ ] No new critical errors introduced by the fix
- [ ] Performance metrics returning toward baseline

---

### STEP 08 — Resolution Deployment

**Agent:** `delivery-agent` + `engineer-agent`
**Time budget:** 10–30 minutes

**Deployment checklist:**
```
□ Fix validated in staging (Step 07)
□ On-call engineer confirmed available for post-deploy monitoring
□ Rollback plan for the fix confirmed
□ Monitoring thresholds set / alerts active
□ Incident channel briefed: "Deploying fix at {timestamp}"
```

**Deployment approach for incident fixes:**
- P1: Direct deploy (no canary — speed > caution; rollback is the safety net)
- P2/P3: Blue-green if available; direct deploy if not
- P4: Normal deployment process

**Post-deploy verification:**
```
T+5 min:  Error rate check — trending down?
T+15 min: Original failure scenario tested — resolved?
T+30 min: Error rate at baseline — PASS
T+30 min: Latency at baseline — PASS
→ Declare RESOLVED if all checks pass
```

---

### STEP 09 — All-Clear & Post-Resolution Monitoring

**Agent:** `delivery-agent`
**Time budget:** 30 minutes active + 24-hour watch

**All-clear declaration:**
When ALL of the following are true:
- Error rate at or below pre-incident baseline
- Latency at or below pre-incident baseline
- Original failure scenario: cannot be reproduced
- No new errors introduced by the fix
- Affected users can complete their workflows

**All-clear notification:**
```
INCIDENT RESOLVED
━━━━━━━━━━━━━━━━━
Incident: {slug}
Resolved at: {ISO timestamp}
Duration: {H:MM}

Resolution: {brief description of fix or rollback}
Root cause: {brief description — full analysis in post-mortem}

Next steps:
- Post-incident review: {date/time}
- Monitoring period: 24 hours

Thank you for your patience.
```

**Monitoring watch (24 hours post-resolution):**
- Check every 2 hours for P1, every 4 hours for P2/P3
- If metrics degrade → re-open the incident
- Document monitoring findings in the incident record

---

### STEP 10 — Post-Incident Review (Blameless)

**Agent:** All agents involved + `pm-agent`
**Time budget:** 2–4 hours
**Deadline:** Within 48 hours of resolution (P1/P2), within 1 week (P3/P4)

**Blameless principles:**
- Humans make mistakes; systems should prevent human mistakes from becoming incidents
- "Why did the engineer do X?" is never the root cause question
- "Why was it possible for X to cause this incident?" IS the root cause question
- No names in the public post-mortem (use roles)

**Post-mortem structure (using `templates/incident-template.md`):**

```
1. TIMELINE — exact sequence of events
   - When was the incident started? (not when declared)
   - When was each key action taken?
   - When was it resolved?

2. ROOT CAUSE — what actually broke and why
   Rules:
   - Must be specific ("null pointer at checkout.js:142 when cart is empty" not "bug")
   - Must explain WHY it existed (not just what broke)
   - Use 5-Whys if needed to reach the systemic cause

3. CONTRIBUTING FACTORS — what made this worse or harder to detect
   - Was there a missing monitor?
   - Was there a missing test?
   - Was there a missing runbook step?
   - Was there incomplete error handling?
   - Was there deployment timing (deploy + bad data = incident)?

4. IMPACT — actual user and business impact
   - Users affected (number or %)
   - Duration
   - Data affected (if any)
   - Revenue impact (if calculable)
   - SLA breach (yes/no)

5. WHAT WENT WELL
   - Detection was fast because X
   - Rollback worked because Y
   - Communications were clear because Z

6. WHAT WENT WRONG
   - Monitoring didn't catch X because Y
   - Runbook was missing step X
   - No test covered this case

7. ACTION ITEMS — specific, owned, time-bound
   Format: [action] — Owner: [name/agent] — Due: [date] — Tracking: [ticket]
```

**Post-mortem gate (supervisor-agent reviews):**
- [ ] Root cause identified (not "unknown" or "human error")
- [ ] All contributing factors documented
- [ ] Every "what went wrong" has a corresponding action item
- [ ] All action items have owners AND due dates AND tracking tickets
- [ ] Runbooks updated or action item created to update them

**Artifact:**
```
path:   wiki/incidents/{date}-{slug}-postmortem.md
template: templates/incident-template.md
status: draft → reviewed → published
```

---

### STEP 11 — Action Item Tracking

**Agent:** `delivery-agent` + `pm-agent`
**Time budget:** 30 minutes to assign; ongoing tracking

**Instructions:**
1. Create tracking tickets for every action item from the post-mortem
2. Prioritize action items:
   - Prevention (stops recurrence): P1 action items → next sprint
   - Detection (catches it faster next time): sprint within 4 weeks
   - Response (resolves it faster): sprint within 8 weeks
3. Add prevention action items to current sprint if capacity allows
4. Report at each sprint review: "open action items from incident {slug}"
5. Close action items only when work is done AND verified (not just merged)

**Artifact:**
```
path:   wiki/incidents/{date}-{slug}-action-items.md
schema:
  action_items:
    - id: AI-001
      description: string
      category: prevention | detection | response
      owner: string
      due_date: date
      ticket_id: string
      status: open | in_progress | completed | deferred
      completion_evidence: string | null
```

---

### STEP 12 — Incident Closure & Wiki Update

**Agent:** `delivery-agent`
**Time budget:** 30 minutes
**Trigger:** All action items either completed or scheduled with firm due dates

**Instructions:**
1. Update incident record status to `CLOSED`
2. Update `wiki/incidents/index.md` with the incident summary
3. Check: do any patterns from this incident suggest a new memory entry?
   - Repeat failure mode → `memory/failures/{category}-{slug}.md`
   - New runbook needed → create stub at `wiki/runbooks/{slug}.md`
   - Process gap → update `wiki/processes/` or workflow file
4. Link incident to any ADRs created as a result
5. Update `wiki/index.md` "Recently Updated"

**Wiki updates required:**
```
wiki/incidents/{date}-{slug}-postmortem.md          ← Publish final
wiki/incidents/{date}-{slug}-action-items.md        ← Create
wiki/incidents/index.md                              ← Add entry
wiki/index.md                                        ← Update recently updated
memory/failures/{slug}.md                            ← If recurring pattern
wiki/runbooks/{slug}.md                              ← If runbook gap found
```

---

## Escalation Rules

| Condition | Escalation Target | Action |
|-----------|------------------|--------|
| P1 declared | Exec + Legal (if data) | Immediate notification |
| Security breach indicators | `security-agent` | Run Step 05S immediately |
| Fix taking > 30 min on P1 | Roll back immediately | Don't debug under fire |
| Post-mortem has "human error" as root cause | `supervisor-agent` | Reject; force 5-Whys |
| Action items from prior incident repeat | `architect-agent` | Systemic design review |
| Post-mortem supervisor rejected twice | Human review | Manual post-mortem |
| 3 incidents with same root cause pattern | `architect-agent` + `pm-agent` | Architecture/process review |

---

## MTTR Targets

| Severity | MTTR Target | Escalation if Exceeded |
|----------|------------|----------------------|
| P1 | ≤ 1 hour | Exec escalation at T+60 |
| P2 | ≤ 4 hours | Engineering lead escalation at T+4h |
| P3 | ≤ 24 hours | Team lead awareness at T+24h |
| P4 | ≤ 3 business days | Normal sprint process |

---

## Wiki Updates Per Step

| Step | Wiki Page | Update Type |
|------|-----------|------------|
| 01 | `wiki/incidents/{date}-{slug}.md` | Create (stub) |
| 09 | `wiki/incidents/{date}-{slug}.md` | Update status to RESOLVED |
| 10 | `wiki/incidents/{date}-{slug}-postmortem.md` | Create post-mortem |
| 11 | `wiki/incidents/{date}-{slug}-action-items.md` | Create action items |
| 12 | `wiki/incidents/index.md` | Add entry |
| 12 | `memory/failures/` | Add if recurring pattern |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| MTTR P1 | ≤ 1 hour |
| MTTR P2 | ≤ 4 hours |
| Post-mortem completion rate | 100% (P1/P2), > 90% (P3) |
| Action items completed on schedule | > 80% |
| Repeat incidents (same root cause) | 0 in 90-day window |
| Post-mortems with "human error" as root cause | 0 |
| Change failure rate | < 5% |
