# Release Workflow

**Workflow ID:** `release-workflow`
**Trigger:** QA gate PASS + engineering declares release-ready
**Orgs:** QA → SECURITY → DELIVERY → PM (post)
**Output:** Deployed release + release summary

---

## Release Types

| Type | Scope | Approval Required | Deploy Window |
|------|-------|------------------|---------------|
| **Hotfix** | Single critical bug fix | Engineering lead + QA | Any time |
| **Minor** | Small features or fixes | PM + QA + Security | Tue-Thu 10am-3pm |
| **Major** | Significant new capability | PM + Architecture + QA + Security + exec brief | Planned window |
| **Emergency** | P1/P2 incident response | On-call lead | Any time |

---

## Pre-Release Checklist

Every release requires ALL checked before deployment:

**Quality**
- [ ] QA gate verdict: PASS or CONDITIONAL_PASS at `qa/gates/<date>-<slug>.md`
- [ ] All critical and high bugs closed or explicitly deferred with PM sign-off
- [ ] Regression suite passing on staging

**Security**
- [ ] Security gate verdict at `qa/security/<date>-<slug>-security-review.md`
- [ ] No critical or high security findings open
- [ ] Secrets/credentials rotated if any were exposed

**Operations**
- [ ] Runbook updated at `wiki/runbooks/<slug>.md`
- [ ] Monitoring and alerts verified for new code paths
- [ ] Feature flags configured (if applicable)
- [ ] Rollback plan written and tested

**Comms**
- [ ] Internal release notes written
- [ ] User-facing comms prepared (if applicable)
- [ ] On-call engineer briefed and confirmed available

**Data**
- [ ] Database migrations tested on staging
- [ ] Data migration rollback verified
- [ ] Analytics events verified (fire in staging)

---

## Deployment Steps

### STEP 01: Pre-Deploy Verification
**Agent:** `delivery-agent`
- Run through pre-release checklist
- Confirm all gates passed
- Identify go/no-go

**Gate (human-review):** "All gates passed. Proceed with deployment?"

---

### STEP 02: Deploy to Staging (Final Verification)
**Agent:** `delivery-agent` + `engineer-agent`
- Deploy to staging environment
- Run smoke test suite
- Verify analytics events fire
- Check error rates and latency

**Gate:**
- [ ] No critical errors in staging logs
- [ ] Smoke tests pass
- [ ] Performance within spec

---

### STEP 03: Production Deployment
**Agent:** `delivery-agent` + `engineer-agent`

Deployment strategies by release type:
- **Hotfix**: Direct deploy
- **Minor**: Blue/green swap (instant rollback capability)
- **Major**: Canary (10% → 25% → 50% → 100% over 4 hours)

Monitor during rollout:
- Error rate (alert if > 2× baseline)
- P99 latency (alert if > 2× baseline)
- Key business metrics (alert on unexpected drop)

---

### STEP 04: Post-Deploy Monitoring (24h)
**Agent:** `delivery-agent` + `analytics-agent`
- Monitor DORA metrics
- Watch error rates and latency
- Watch business KPIs defined in the PRD
- Ready rollback if metrics degrade

---

### STEP 05: Release Summary
**Agent:** `delivery-agent`
Using `templates/release-template.md`:

```markdown
# Release: <name> <version>
**Date:** <ISO date>
**Type:** minor | major | hotfix

## What Shipped
- <feature/fix 1>
- <feature/fix 2>

## Quality Gates
- QA: PASS — [report link]
- Security: APPROVED — [report link]

## Performance Baseline
- P50: <ms>, P99: <ms>
- Error rate: <%>

## Monitoring
- Dashboard: <link>
- Alert thresholds: <defined>

## Rollback Plan
- Method: <blue/green swap | revert commit>
- Estimated rollback time: <N minutes>
```

**Output:** `release/releases/<date>-<slug>.md`

---

### STEP 06: Post-Release PM Handoff
**Agent:** `delivery-agent` → `pm-agent`
- Pass release summary
- Pass analytics dashboard link
- Note any carry-over items
- Schedule post-release review (48-72h post-deploy)
