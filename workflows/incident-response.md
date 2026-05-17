# Incident Response Workflow

**Workflow ID:** `incident-response`
**Trigger:** Production issue declared, or `!incident` prefix in any message
**Priority:** CRITICAL — overrides all other workflows
**Orgs:** DELIVERY → ENG → ARCH → SECURITY (if breach) → PM

---

## Severity Classification

| Severity | Criteria | Response Time | Stakeholder Comms |
|----------|---------|---------------|------------------|
| **P1** | Total outage, data loss, security breach, revenue impact > $X/hr | Immediate | Exec + all users |
| **P2** | Major feature broken, >20% of users affected | 15 minutes | Engineering + PM |
| **P3** | Partial degradation, workaround exists | 30 minutes | Engineering team |
| **P4** | Minor issue, no user impact, cosmetic | Next business hour | Ticket only |

---

## Response Timeline

```
T+0min:   INCIDENT DECLARED
           │
           ▼ delivery-agent
           Acknowledge, set severity, open incident record
           Page on-call engineer
           
T+5min:   INITIAL COMMS
           │
           ▼ delivery-agent
           Notify stakeholders per severity level
           Open incident war room (Slack/Teams channel)
           
T+15min:  INVESTIGATION
           │
           ▼ engineer-agent (on-call)
           Identify affected systems and scope
           Check monitoring/alerts for clues
           Report initial hypothesis to incident channel
           
T+30min:  STATUS UPDATE
           │
           ▼ delivery-agent
           Update stakeholders with: what's known, what's being done, ETA
           
T+60min:  RESOLUTION ATTEMPT
           │
           ▼ engineer-agent
           Deploy fix OR initiate rollback
           Verify resolution
           
T+90min:  ALL-CLEAR or ESCALATION
           │
           ├─ RESOLVED: all-clear comms, monitoring watch
           └─ NOT RESOLVED: escalate to architect-agent + senior eng
           
T+24-48h: POST-INCIDENT REVIEW
           │
           ▼ All involved agents
           Blameless post-mortem
           Write incident report
           Identify systemic fixes
```

---

## Step Definitions

### STEP 01: Acknowledge & Classify
**Agent:** `delivery-agent`
**Actions:**
- Create incident record: `wiki/incidents/<date>-<slug>.md`
- Set severity based on criteria above
- Page on-call engineer
- Open incident channel

**Output:** Incident record stub

---

### STEP 02: Stakeholder Comms (P1/P2)
**Agent:** `delivery-agent`
**Comms Template:**
```
STATUS UPDATE [<timestamp>]
━━━━━━━━━━━━━━━━━━━━━━━━━
Incident: <slug>
Severity: P<N>
Status: Investigating | Identified | Fixing | Resolved

What we know: <brief description of impact>
What we're doing: <current action>
ETA: <estimate or "unknown">
Next update: <timestamp>
```

Send to: appropriate Slack channel / stakeholder group per severity

---

### STEP 03: Investigation
**Agent:** `engineer-agent`
**Checklist:**
- [ ] Check recent deployments (last 24h): did anything change?
- [ ] Check monitoring dashboards: what metrics spiked?
- [ ] Check error logs: what errors are appearing?
- [ ] Check dependent services: is an upstream/downstream service degraded?
- [ ] Identify: is this a code bug, infra issue, data issue, or external dependency?

**Report format:**
```
INVESTIGATION REPORT [T+15]
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hypothesis: <what we think is wrong>
Evidence: <what supports this>
Affected: <systems / users / data>
Fix approach: <proposed fix>
Risk of fix: <any concerns about applying the fix>
Rollback plan: <how to undo if fix makes it worse>
```

---

### STEP 04: Security Escalation (if breach)
**Agent:** `security-agent`
**Trigger:** Any evidence of unauthorized access, data exfiltration, or credential compromise
**Actions:**
- Preserve evidence before remediation
- Assess blast radius
- Initiate credential rotation if needed
- Assess regulatory notification requirements (GDPR 72h, etc.)
- Write security incident report

---

### STEP 05: Post-Incident Review (Blameless)
**Agent:** All involved agents + `pm-agent`
**Timing:** Within 48 hours of resolution
**Format:** `templates/incident-template.md`

Sections:
1. **Timeline**: minute-by-minute account
2. **Root cause**: technical root cause (not "human error" — human error has a root cause)
3. **Contributing factors**: what made this possible?
4. **Impact**: users affected, duration, data affected
5. **What went well**: detection, response, comms
6. **What went wrong**: gaps in detection, response, or prevention
7. **Action items**: specific, owned, time-bound fixes

**Output:** `wiki/incidents/<date>-<slug>-post-mortem.md`

**Gate:**
- [ ] Root cause identified (not "unknown" or "human error")
- [ ] All action items have owners and due dates
- [ ] Runbooks updated if they were missing or incorrect
- [ ] Monitoring gaps addressed

---

## Incident Metrics to Track

- Time to detect (TTD)
- Time to acknowledge (TTA)
- Time to resolve (TTR)
- Recurrence: was this a repeat of a prior incident?

All incidents → `analytics/incidents/` for trending

---

## Rollback Decision Criteria

Roll back immediately if:
- Fix is taking > 30 minutes and P1/P2 is ongoing
- Fix attempt made things worse
- No clear fix identified within first hour

Rollback to last known good deployment.
