---
type: rollout-plan
version: "1.0"
id: ROLLOUT-<YYYY-MM-DD>-<slug>
status: draft | approved | executing | complete | rolled-back
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: delivery-agent
feature: <feature name>
prd-ref: prds/<slug>.md
qa-verdict-ref: qa/<date>-<slug>-qa-report.md
release-version: <semver>
target-date: <YYYY-MM-DD>
---

# Rollout Plan: <Feature Name> v<semver>

> **Status:** `DRAFT`
> **Target release:** `<YYYY-MM-DD>`
> **Release type:** `feature | hotfix | patch | major`
> **Rollout strategy:** `feature-flag canary | blue-green | direct | dark-launch`

---

## ① Summary

| Field | Value |
|-------|-------|
| **Feature** | `<feature name>` |
| **Release version** | `<semver>` |
| **QA Verdict** | PASS / CONDITIONAL PASS |
| **Security review** | Approved / Not required |
| **Rollout method** | `<feature-flag / canary / blue-green / direct>` |
| **Expected duration** | `<N days from start to 100%>` |
| **Rollback window** | `<N hours after each phase>` |
| **Go/No-go owner** | `<delivery-agent / eng-lead / name>` |

---

## ② Pre-Release Checklist

All items must be checked before any deployment begins.

### 2.1 Engineering

- [ ] All tests passing: unit, integration, E2E
- [ ] Code reviewed and approved (≥ 2 reviewers for L-tier)
- [ ] Security review approved: `<ADR or approval ref>`
- [ ] Database migrations tested on staging with production data volume
- [ ] No critical or high CVEs in dependency scan
- [ ] Feature flag configured and tested (default: off for new features)
- [ ] API documentation updated
- [ ] Runbook written: `wiki/runbooks/<slug>.md`

### 2.2 QA

- [ ] QA verdict: PASS / CONDITIONAL PASS on record
- [ ] All P0 acceptance criteria verified
- [ ] No open critical or high bugs
- [ ] Regression suite passed
- [ ] Performance criteria met (if required)
- [ ] Accessibility scan passed (if UI feature)

### 2.3 Operations

- [ ] Monitoring dashboards updated
- [ ] New alerts configured and tested
- [ ] On-call runbook updated
- [ ] On-call engineer notified of deployment window
- [ ] Rollback plan confirmed executable (§⑥)
- [ ] Database backup verified recent (within 24h)

### 2.4 Stakeholders

- [ ] Product sign-off received
- [ ] Customer-facing documentation updated (if needed)
- [ ] Support team briefed on new behavior
- [ ] Marketing / comms informed (if customer-visible)

---

## ③ Rollout Phases

### Phase 0 — Internal (Dark Launch)

```
Target:          Internal employees / test accounts only
Traffic:         0% of production users
Feature flag:    <flag-name> = true for <group-ids>
Duration:        <X days>
Start:           <YYYY-MM-DD>
Monitoring:      <what to watch>
```

**Go/No-go criteria for Phase 1:**
- [ ] Error rate < `<X%>` over `<N hours>`
- [ ] No P1/P2 bugs filed
- [ ] Core functionality confirmed by `<N>` internal testers

---

### Phase 1 — Canary (1–5%)

```
Target:          <N%> of production traffic
Feature flag:    <flag-name> rolled to <N%>
Duration:        <N days>
Start:           <YYYY-MM-DD>
Monitoring:      <metrics dashboard URL or description>
```

**Go/No-go criteria for Phase 2:**
- [ ] Error rate ≤ baseline + `<0.5%>` over `<N hours>`
- [ ] Latency P99 ≤ `<Xms>` (no regression)
- [ ] No critical bugs filed
- [ ] Quality metric ≥ `<target>` (if AI feature: quality sampling rate ≥ `<X%>`)

---

### Phase 2 — Staged (25%)

```
Target:          25% of production traffic
Feature flag:    <flag-name> rolled to 25%
Duration:        <N days>
Start:           <YYYY-MM-DD>
Monitoring:      <metrics dashboard>
```

**Go/No-go criteria for Phase 3:**
- [ ] All Phase 1 criteria still met at higher traffic volume
- [ ] No new bug pattern detected
- [ ] Guardrail metrics ≥ floor: `<metric: floor>`

---

### Phase 3 — Full Rollout (100%)

```
Target:          100% of production traffic
Feature flag:    <flag-name> = true globally
Start:           <YYYY-MM-DD>
Post-rollout monitoring window: 48 hours
```

**Go/No-go criteria for completion:**
- [ ] All phase criteria met
- [ ] 48-hour monitoring window clean
- [ ] Support ticket volume within expected range

---

### Phase 4 — Flag Cleanup

```
Action:          Remove feature flag from code
Sprint:          <sprint-id following rollout>
Owner:           engineer-agent
```

---

## ④ Deployment Steps

Exact steps in execution order. Each step is atomic and reversible.

```
Step 1: Deploy migration (if any)
  Command: <migration command>
  Verify:  <check command or query>
  Rollback: <undo command>

Step 2: Deploy application code (flag default: off)
  Method: <CI/CD pipeline name and step>
  Verify:  Health check: GET /health → 200
  Rollback: <previous version tag>

Step 3: Enable flag for Phase 0 (internal)
  Command: <flag service command or UI action>
  Verify:  <test account sees feature>

Step 4: Enable flag for Phase 1 (N%)
  Command: <flag rollout command>
  Verify:  Check <metric> on dashboard

(Continue per rollout phases above)
```

---

## ⑤ Monitoring Plan

### 5.1 Key Metrics to Watch

| Metric | Tool | Normal Range | Alert Threshold | Action |
|--------|------|-------------|----------------|--------|
| Error rate | `<tool>` | < `<X%>` | > `<Y%>` | Rollback |
| P99 latency | `<tool>` | < `<Xms>` | > `<Yms>` | Investigate |
| `<feature metric>` | | | | |
| Guardrail: `<metric>` | | ≥ `<floor>` | < `<floor>` | Rollback |

### 5.2 Monitoring Schedule

| Phase | Monitoring Frequency | Who |
|-------|---------------------|-----|
| Phase 0 | On-deploy + 4h check | delivery-agent |
| Phase 1 | Every 2h first day, then daily | delivery-agent |
| Phase 2 | Daily | delivery-agent |
| Phase 3 (first 48h) | Every 4h | delivery-agent |
| Phase 3 (after 48h) | Normal operational cadence | on-call |

### 5.3 Dashboard

Primary dashboard: `<link or description>`

Panels to monitor:
- `<panel name>`: `<what normal looks like>`
- `<panel name>`: `<what normal looks like>`

---

## ⑥ Rollback Plan

### 6.1 Rollback Triggers

Automatically roll back Phase N if ANY of these are true:

| Trigger | Threshold | Measured Over |
|---------|-----------|--------------|
| Error rate spike | > `<X%>` above baseline | `<N-minute>` window |
| Latency regression | P99 > `<Xms>` | `<N-minute>` window |
| Critical bug filed | Any | Immediate |
| Guardrail metric breached | Below floor | `<N-minute>` window |
| Security event detected | Any | Immediate |

### 6.2 Rollback Steps

```
Decision: <who can authorize rollback>
Timeline: Rollback must begin within <N minutes> of trigger

1. Disable feature flag: <command>
   Verify: Feature no longer visible to users

2. If migration is not backward-compatible:
   a. <specific DB recovery step>
   b. Validate data: <query or check>

3. If code rollback required (code change without flag):
   Redeploy: <previous version tag>
   Verify:   Health check passes

4. Notify stakeholders: delivery-agent → eng-lead → pm-agent
5. Declare incident if P1/P2 user impact: !incident
6. Document rollback: update this file, status = "rolled-back"
```

### 6.3 Rollback Time Target

**Estimated rollback time:** `<N minutes>`

**Data that cannot be rolled back:** `<none | describe irreversible changes>`

---

## ⑦ Communication Plan

### 7.1 Internal Communications

| Event | Channel | Audience | Message |
|-------|---------|---------|---------|
| Deployment starts | `<slack-channel>` | Engineering | "Deploying `<feature>` v`<N>` — tracking `<dashboard>`" |
| Phase 1 enabled | | Engineering + PM | "Phase 1 live (N%). Monitoring." |
| Full rollout | | Engineering + PM + Stakeholders | "Feature fully rolled out." |
| Rollback | `<incident channel>` | All engineers | "Rolling back `<feature>`. See `<link>`." |

### 7.2 Customer Communications

| Condition | Channel | Template |
|-----------|---------|---------|
| Feature is customer-visible | `<in-app / email / blog>` | `<link to copy>` |
| Rollback with user impact | Status page + email | Incident communication template |
| No customer impact | None | — |

---

## ⑧ Post-Rollout Review

Scheduled: `<T+3 days after Phase 3 complete>`

**Review checklist:**
- [ ] Key metrics trending toward targets (§3 of PRD)
- [ ] No outstanding high/critical bugs
- [ ] Feature flag removal scheduled
- [ ] Runbook still accurate post-rollout
- [ ] Team retrospective notes captured: `wiki/learnings/<date>-<slug>.md`
- [ ] Delivery metrics recorded: DORA dashboard updated

**North star metric at T+3:** `<value>` (target: `<target>`)
