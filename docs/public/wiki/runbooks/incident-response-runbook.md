---
type: runbook
status: active
version: 1.0.0
created: 2026-05-09
owner: delivery-agent
updated: 2026-05-09
---

# Incident Response Runbook

**Purpose:** Step-by-step instructions for responding to production incidents.
**Trigger:** `!incident <description>` or any CRITICAL/HIGH alert that affects production.
**Reference workflow:** `workflows/incident-response.md`

---

## Incident Severity Classification

| Severity | Definition | Response Time | Examples |
|---------|-----------|--------------|---------|
| P0 — Critical | Complete service outage; data loss; security breach | < 15 minutes | System down, credentials exposed, data corruption |
| P1 — Major | Core feature unavailable; significant degradation | < 1 hour | Auth broken, major feature errors > 10% users |
| P2 — Minor | Non-core feature degraded; workaround available | < 4 hours | Slow performance, minor feature broken |
| P3 — Low | Cosmetic issues; no user impact | Next sprint | UI glitches, non-critical warnings in logs |

---

## Incident Roles

| Role | Assigned To | Responsibility |
|------|-----------|---------------|
| Incident Commander | delivery-agent | Coordinates response; owns communication |
| Technical Lead | engineer-agent | Root cause investigation; fix |
| Security Lead | security-agent | Security assessment if breach suspected |
| Communications | pm-agent | User communication if needed |
| Quality Lead | qa-agent | Verification before incident closure |

---

## Response Procedure

### Phase 1: TRIAGE (target: < 15 minutes from detection)

- [ ] **Classify severity** (P0–P3) based on table above
- [ ] **Open incident record:** Create `incidents/INC-NNN-<slug>.md` using `templates/incident-template.md`
  - Assign incident ID (next sequential number)
  - Record detection timestamp
  - Record initial classification
- [ ] **Notify:** Notify human operator immediately for P0/P1
- [ ] **Assign Incident Commander** (delivery-agent)
- [ ] **If P0 and deployment < 4h ago:** Initiate rollback consideration (see `wiki/runbooks/rollback-runbook.md`)

---

### Phase 2: CONTAIN (target: < 30 minutes for P0)

- [ ] **Stop the bleeding:** Disable feature flags, rollback if needed, rate-limit affected endpoints
- [ ] **Preserve evidence:** Take snapshots of logs, error traces, and state before any system changes
- [ ] **Assess blast radius:** How many users affected? What data? What functionality?
- [ ] **Security check:** Is this a security incident? If yes → security-agent leads from here

**Security incident sub-procedure:**
- Immediately rotate any potentially compromised credentials
- security-agent assesses scope and data exposure
- Do NOT discuss specifics in unencrypted channels
- Follow `docs/governance/security-policy.md §incident`

---

### Phase 3: DIAGNOSE (P0: < 1h; P1: < 4h)

- [ ] **Identify root cause:** engineer-agent leads diagnosis
  - Check recent deployments (last 24h)
  - Check dependency changes
  - Check for anomalous traffic or load
  - Review error traces and logs
- [ ] **Form hypothesis:** State the root cause hypothesis in the incident record
- [ ] **Verify hypothesis:** Confirm root cause before attempting fix

---

### Phase 4: FIX

- [ ] **Develop fix:** engineer-agent develops targeted fix
- [ ] **Minimal scope:** Fix only addresses the immediate issue; no refactoring in incident response
- [ ] **QA verification:** qa-agent verifies fix resolves the issue in a safe environment
- [ ] **Security check:** If security-related, security-agent must review fix before deployment
- [ ] **Deploy fix:** Use deployment runbook; skip staged rollout only if P0 and explicitly authorized by human operator
- [ ] **Verify resolution:** Monitor for 30 minutes post-fix

---

### Phase 5: CLOSE

**Criteria to close an incident:**
- [ ] Root cause identified and documented
- [ ] Fix deployed and verified
- [ ] No recurrence in 1h monitoring window
- [ ] Incident record complete with all fields filled

**On closure:**
- Update incident status to CLOSED in `incidents/INC-NNN-<slug>.md`
- Notify all affected stakeholders
- Schedule post-incident review (G8) within 5 business days for P0/P1

---

### Phase 6: POST-INCIDENT REVIEW (G8)

**Mandatory for P0 and P1. Recommended for P2.**

**Review artifacts:**
- Complete incident timeline
- Root cause analysis (5 Whys or equivalent)
- What went well / what went wrong
- Action items with owners and due dates
- Metrics: time to detect, time to contain, time to resolve

**Gate G8:** supervisor-agent reviews post-incident analysis for completeness. Key check: are the action items specific enough to prevent recurrence?

**Wiki update:** Post-incident learnings go to `wiki/learnings/incidents/` (create if absent).

---

## Communication Templates

### Initial notification (P0/P1)
```
INCIDENT DECLARED: [P0/P1]
Time: [timestamp]
What: [1 sentence description]
Impact: [users/features affected]
Status: Investigating
Incident ID: INC-NNN
```

### Update cadence
- P0: Every 30 minutes until resolved
- P1: Every 1 hour until resolved
- P2/P3: At resolution

### Resolution notification
```
INCIDENT RESOLVED: INC-NNN
Time resolved: [timestamp]
Duration: [total duration]
Root cause: [1 sentence]
Fix applied: [1 sentence]
Post-incident review: scheduled for [date]
```

---

## Incident ID Allocation

Incident IDs are sequential: INC-001, INC-002, etc.
The master incident log is maintained at `wiki/operations/incident-log.md`.
