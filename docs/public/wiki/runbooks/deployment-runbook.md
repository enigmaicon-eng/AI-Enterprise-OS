---
type: runbook
status: active
version: 1.0.0
created: 2026-05-09
owner: delivery-agent
updated: 2026-05-09
---

# Deployment Runbook

**Purpose:** Step-by-step instructions for deploying a new release to production.
**When to use:** Before every production deployment.
**Precondition:** Release plan approved; G5 (QA) + G6 (Security) + G7 (Pre-release checklist) all PASS.

> **Note:** Tech stack and deployment target are not yet defined (see Q-001, Q-003). This runbook uses placeholder steps. Update when Q-001 and Q-003 are resolved and actual deployment infrastructure is established.

---

## Pre-Deployment Checklist

Before beginning deployment, verify all of the following:

- [ ] Release plan exists at `releases/<date>-<version>-release-plan.md` with status APPROVED
- [ ] G5 QA gate: PASS (link to QA report)
- [ ] G6 Security gate: PASS (link to security review)
- [ ] G7 Pre-release checklist: PASS (delivery-agent sign-off)
- [ ] Rollout plan exists with rollout stages defined
- [ ] Rollback plan is documented (see `wiki/runbooks/rollback-runbook.md`)
- [ ] Monitoring alerts are configured for this feature
- [ ] On-call engineer is available for the deployment window
- [ ] Human operator has given go-ahead for production deployment

**If any item above is unchecked:** Do NOT proceed. Escalate to delivery-agent and human operator.

---

## Deployment Stages (L-tier features)

L-tier features use staged rollout. Each stage requires observation before proceeding.

### Stage 0: Internal / Dark Launch (0%)
**Goal:** Verify deployment mechanics without user impact.
- [ ] Deploy release artifact to production environment
- [ ] Verify service starts without errors
- [ ] Verify health check endpoint returns OK
- [ ] Verify no log errors at startup
- [ ] Verify feature flag is OFF (no user traffic)

**Observation window:** 15 minutes
**Pass criteria:** No errors, health check green

---

### Stage 1: 1% Rollout
**Goal:** Real user signal at minimal blast radius.
- [ ] Enable feature flag for 1% of users
- [ ] Verify feature traffic is appearing in logs/monitoring
- [ ] Monitor error rate for 30 minutes

**Pass criteria (all required):**
- Error rate < baseline + 0.1%
- P99 latency < baseline × 1.2
- No CRITICAL or HIGH alerts triggered
- No user-facing errors reported

**If criteria not met:** Proceed to rollback immediately (do not wait). See `wiki/runbooks/rollback-runbook.md`.

---

### Stage 2: 25% Rollout
**Goal:** Broader signal; validate performance at scale.
- [ ] Increase feature flag to 25%
- [ ] Monitor for 2 hours

**Pass criteria (same as Stage 1)**

---

### Stage 3: 100% Rollout
**Goal:** Full production deployment.
- [ ] Increase feature flag to 100%
- [ ] Monitor for 4 hours
- [ ] Confirm feature is behaving as expected for all user segments

**Pass criteria:**
- All Stage 1/2 criteria maintained
- No new incident triggers
- Human operator confirms go-ahead

---

## Post-Deployment Actions

After successful 100% rollout:
- [ ] Update release artifact status to ACTIVE
- [ ] Record deployment timestamp in delivery metrics
- [ ] Update wiki/releases/ with release summary
- [ ] Notify PM-agent: feature live; metrics collection begins
- [ ] Start GROWTH phase monitoring (per `lifecycle-models/feature-lifecycle.md`)

---

## Deployment Decision Authority

| Decision | Authority |
|---------|---------|
| Proceed to Stage 1 | delivery-agent |
| Proceed Stage 1 → 2 | delivery-agent |
| Proceed Stage 2 → 3 | delivery-agent + human operator |
| Emergency stop at any stage | Any agent or human |
| Rollback decision | delivery-agent; immediate on P0/P1 incident |

---

## Escalation Contacts

| Situation | Escalate To |
|---------|-----------|
| Deployment fails to start | engineer-agent |
| Security alert triggered | security-agent |
| AI quality alert during rollout | analytics-agent |
| Any CRITICAL alert | Human operator immediately |
