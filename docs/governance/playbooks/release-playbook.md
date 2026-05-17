---
type: playbook
id: PLAY-RELEASE
version: "1.0"
cadence: per-release
created: 2026-05-08
updated: 2026-05-08
owner: delivery-agent
participants: [delivery-agent, engineer-agent, qa-agent, security-agent, pm-agent, on-call]
estimated-duration: 2–5 days (pre-release) + release day + 48h hypercare
---

# Release Playbook

The end-to-end process from QA PASS to production fully rolled out. Every phase has a go/no-go decision. No phase is skipped — not under deadline pressure, not for hotfixes.

**Entry condition:** QA verdict is PASS or CONDITIONAL PASS.
**Exit condition:** Feature fully rolled out (100%), 48-hour hypercare window clean, flag cleanup scheduled.

---

## Release Types & Paths

| Type | Definition | Path |
|------|-----------|------|
| **Feature** | New capability for users | Full path: §①–⑨ |
| **Patch** | Bug fix, no schema change | Abbreviated: §①(security only) → §③ → §⑤ → §⑦ |
| **Hotfix** | P1/P2 incident fix | Emergency path: §⑩ |
| **Major** | Breaking change, new API version | Full path + extended canary + customer communication |

---

## ① Pre-Release Gate (T−2 days)

Delivery-agent runs this gate. All items must pass before any deployment begins.

### 1.1 Engineering Readiness

- [ ] All sprint items marked Done have merged PRs
- [ ] CI pipeline passing on release branch: all tests green
- [ ] Code review completed (≥ 2 approvals for L-tier)
- [ ] No critical or high CVEs in dependency scan
- [ ] Database migration script: reviewed, tested on staging with production-representative data volume
- [ ] Migration is backward-compatible OR rollback plan documented for non-compatible migration
- [ ] Feature flag configured and verified: default = off for new features

### 1.2 QA Readiness

- [ ] QA verdict on file: PASS / CONDITIONAL PASS
- [ ] Artifact: `qa/<date>-<slug>-qa-report.md`
- [ ] All P0 acceptance criteria verified
- [ ] No open Critical or High bugs
- [ ] If CONDITIONAL PASS: all conditions documented and delivery-agent + pm-agent have accepted conditions in writing

### 1.3 Security Readiness

- [ ] Security review status for this feature: Approved / Not Required
- [ ] If new data fields handling PII: security-agent sign-off on record
- [ ] No new attack surface introduced without threat model
- [ ] Secrets scan: no credentials or keys in code, artifacts, or config

### 1.4 Operational Readiness

- [ ] Monitoring dashboards updated with new panels for this feature
- [ ] New alerts configured and tested (fire a synthetic alert to confirm routing)
- [ ] Runbook written or updated: `wiki/runbooks/<slug>.md`
- [ ] On-call engineer briefed: feature behavior, expected metrics, rollback trigger

### 1.5 Stakeholder Readiness

- [ ] PM sign-off on release scope
- [ ] Customer-facing documentation updated (if feature is user-visible)
- [ ] Support team briefed on new behavior and edge cases
- [ ] Marketing / comms informed if launch announcement planned

**Gate decision:** All checked → proceed to §②. Any unchecked → do not proceed; address gaps and re-run gate.

---

## ② Staging Verification (T−1 day — 2 hours)

Deploy to staging with feature flag enabled (100% of staging traffic). This is the final integration check before production.

### 2.1 Deployment to Staging

```
1. Merge release branch to staging
2. Run migration: <migration command>
3. Verify migration: <check query or script>
4. Enable feature flag on staging: <flag-name> = true
5. Health check: GET /health → 200 on all services
```

### 2.2 Smoke Test (30 min — qa-agent)

Not a full regression — smoke test of the critical path:
- [ ] Happy path: core feature works end-to-end
- [ ] Auth gates: unauthenticated requests rejected
- [ ] Error state: known error condition produces correct error response
- [ ] Rollback test: feature flag can be disabled and feature disappears cleanly

### 2.3 Performance Spot-Check

- [ ] Response time under light load: within P99 target
- [ ] No memory leak visible in a 30-min run
- [ ] Database query count per request: reasonable (no N+1 regressions)

**If smoke test fails:** Do not proceed to production. Raise bug, fix, re-deploy to staging, re-run smoke test.

---

## ③ Go/No-Go Decision (T−0, release morning — 30 min)

**Owner:** delivery-agent calls the meeting
**Required:** pm-agent + engineer-agent + qa-agent; security-agent if security changes

### Go/No-Go Checklist

Read each aloud and get explicit confirmation:

| Item | Status | Decision |
|------|--------|---------|
| Pre-release gate: all items checked | — | Go / No-Go |
| Staging smoke test: passed | — | Go / No-Go |
| QA verdict on file | — | Go / No-Go |
| Security review on file | — | Go / No-Go |
| On-call engineer briefed | — | Go / No-Go |
| Rollback plan confirmed executable | — | Go / No-Go |
| PM confirms scope is correct | — | Go / No-Go |

**Decision rule:**
- ALL Go → proceed to deployment
- ANY No-Go → stop; address the gap; reschedule Go/No-Go

**Go/No-Go outcome is logged in `sprints/<sprint-id>/sprint-review.md` or the release artifact.**

---

## ④ Production Deployment (Release Day)

### 4.1 Deployment Window

Prefer: Tuesday–Thursday, 10am–2pm (mid-week, mid-day).

Avoid:
- Monday (sprint start, high cognitive load)
- Friday (reduced response window if issues arise)
- Before a holiday
- During any major customer event or peak traffic window

### 4.2 Deployment Sequence

```
Step 1: Database migration (if any)
  → Run: <migration command>
  → Verify: <check query — confirm new schema, no data loss>
  → Estimated time: <X min>
  → If fails: stop here; do NOT deploy application code

Step 2: Deploy application code (flag: off)
  → Method: <CI/CD pipeline step>
  → Verify: Health check passes on all instances
  → Old code and new code must be simultaneously compatible (dual-read period if schema changed)

Step 3: Enable flag for Phase 0 (internal/test accounts)
  → Command: <flag command>
  → Verify: Test account sees feature; external users do not
  → Watch for: <X min> — any error rate spike?

Step 4: Enable flag for Phase 1 (N% canary)
  → See §⑤ for phase progression
```

### 4.3 Communication During Deployment

Post to engineering channel at each step:
```
[RELEASE] <feature> — Step N starting: <description>
[RELEASE] <feature> — Step N complete: <status / metrics>
```

---

## ⑤ Phased Rollout

Follow `templates/rollout-plan-template.md` §③ for full phase definitions. Summary:

### Phase 0 — Internal (Day 1 of release)

```
Target:     Internal accounts / test users only
Duration:   2–24 hours depending on feature risk
Watch for:  Error rate, latency, unexpected behavior
```

**Go/No-go for Phase 1:**
- Error rate ≤ baseline + 0.5% over the phase window
- No critical bugs filed
- Core functionality confirmed by internal users

### Phase 1 — Canary 1–5% (Days 1–3)

```
Target:     1–5% of production traffic
Duration:   2–5 days
Watch for:  Error rate, latency, quality metrics (if AI feature)
```

**Go/No-go for Phase 2:**
- All Phase 0 criteria still met at higher traffic
- P99 latency: no regression
- No new bug pattern

### Phase 2 — Staged 25% (Days 3–7)

```
Target:     25% of production traffic
Duration:   3–7 days
Watch for:  Guardrail metrics, support ticket volume
```

**Go/No-go for Phase 3:**
- All prior criteria met at 25× canary traffic
- Guardrail metrics ≥ floor
- Support volume within expected range

### Phase 3 — Full Rollout 100%

```
Target:     100%
Action:     Enable flag globally
Watch for:  48-hour hypercare window
```

---

## ⑥ Monitoring During Rollout

### Critical Metrics to Watch

| Metric | Tool | Normal | Rollback Trigger |
|--------|------|--------|-----------------|
| Error rate | monitoring | < `<X%>` | > `<Y%>` sustained `<N min>` |
| P99 latency | monitoring | < `<Xms>` | > `<Yms>` sustained `<N min>` |
| `<feature metric>` | analytics | `<baseline>` | `<threshold>` |
| Guardrail: `<metric>` | analytics | ≥ `<floor>` | < `<floor>` |

### Monitoring Cadence During Rollout

| Phase | Check Frequency | Owner |
|-------|---------------|-------|
| Phase 0 | On-deploy + every 30 min | delivery-agent |
| Phase 1 | Every 2 hours | delivery-agent |
| Phase 2 | 2× daily | delivery-agent |
| Phase 3 (hypercare) | Every 4 hours for 48h | delivery-agent / on-call |

---

## ⑦ Rollback Procedure

### Rollback Triggers (Auto-Rollback Any Phase)

- Error rate spikes > threshold and does not recover within 5 minutes
- Critical bug filed with confirmed production impact
- Latency regression sustained > 10 minutes
- Any security event
- Safety violation rate > 0.01% in 1-hour window (AI features only)

### Rollback Decision Owner

Phase 0–1: delivery-agent or on-call engineer can trigger
Phase 2–3: delivery-agent calls it; pm-agent informed within 15 minutes

### Rollback Steps

```
1. Disable feature flag immediately
   → Command: <flag disable command>
   → Verify: Feature no longer visible in production

2. Confirm error rate recovers (< 5 min)
   → If not: investigate whether there is a separate issue

3. If database migration is NOT backward-compatible:
   → Run migration rollback script: <command>
   → Validate: <check query>
   → Note: data written after migration may be at risk — assess scope

4. Post to engineering channel:
   "[ROLLBACK] <feature> rolled back at <time>. Reason: <1 sentence>. Investigating."

5. Assess: P1 or P2 user impact?
   → Yes: declare incident immediately → !incident
   → No: open bug, schedule fix, document in rollback-log.md

6. Write rollback summary in release artifact
```

---

## ⑧ 48-Hour Hypercare Window

The first 48 hours after full rollout (Phase 3) require elevated monitoring.

### Hypercare Responsibilities

| Hour | Check | Owner |
|------|-------|-------|
| T+2 | Error rate, latency, feature metric baseline | delivery-agent |
| T+6 | First cohort of users through full feature flow | qa-agent |
| T+12 | Support ticket volume vs. forecast | delivery-agent |
| T+24 | 24h metric snapshot; stakeholder update | pm-agent + delivery-agent |
| T+48 | Hypercare close; metrics within target range? | delivery-agent |

### Hypercare Exit Criteria

- [ ] Error rate: stable at baseline ± 0.5% for 48h
- [ ] No critical or high bugs filed in the last 24h
- [ ] Latency: no regression
- [ ] Support ticket volume: within expected range
- [ ] Feature metric: showing expected signal (not necessarily target yet)

---

## ⑨ Post-Release Close

### 9.1 Flag Cleanup (Next Sprint)

Feature flag code must be removed in the sprint following full rollout:
- [ ] Flag removed from application code
- [ ] Flag removed from flag service configuration
- [ ] Tests that test "flag off" behavior removed
- [ ] PR raised and merged within the next sprint

### 9.2 Release Documentation

- [ ] Release notes posted (if customer-facing): `wiki/releases/<version>.md`
- [ ] Deployment date and version recorded in project history
- [ ] DORA metrics updated: deployment frequency, lead time to production
- [ ] Runbook verified accurate post-release (operational surprises → update immediately)

### 9.3 Learnings

- [ ] Any operational surprise during rollout → `wiki/learnings/<date>-<slug>.md`
- [ ] Any reusable pattern → `memory/patterns/`
- [ ] Post-release metrics reviewed at T+7 days: `analytics/<slug>-metrics.md`

---

## ⑩ Hotfix Emergency Path

For P1/P2 incidents requiring an emergency fix. This path bypasses normal sprint sequencing — it does not bypass safety.

### Hotfix Gate (15 min — compressed version of §①)

- [ ] Root cause confirmed — fix addresses the root cause, not just the symptom
- [ ] Fix reviewed by ≥ 1 engineer (not the author)
- [ ] Abbreviated QA: 3 checks — core functionality works, root cause scenario fixed, no obvious regression
- [ ] Security-agent notified if fix touches auth, data, or permissions
- [ ] Rollback plan: how to undo the hotfix if it makes things worse

### Hotfix Deployment

```
1. Deploy to staging → abbreviated smoke test (15 min)
2. Deploy to production — direct to 100% (no canary for P1 hotfixes)
   Note: For P2 hotfixes, run a 5% canary for 30 minutes first
3. Verify: root cause scenario no longer occurs
4. Monitor: 1 hour continuous monitoring post-hotfix
5. Incident: update INC report with fix details
```

### Post-Hotfix

- [ ] Incident post-mortem scheduled (required within 5 business days)
- [ ] Fix ported back to main branch and included in next regular release
- [ ] Test coverage added: write the test that would have caught this
