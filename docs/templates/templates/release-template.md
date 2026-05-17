---
type: release
release-id: <version>
date: <YYYY-MM-DD>
type: major | minor | patch | hotfix
status: planned | deployed | rolled-back
---

# Release: <version> — <release name>

**Date:** `<YYYY-MM-DD>`
**Type:** `major | minor | patch | hotfix`
**Deploy method:** `blue-green | canary | direct`

---

## What Shipped

### Features
- `<feature 1>` — PRD: `<link>`
- `<feature 2>` — PRD: `<link>`

### Bug Fixes
- `<fix 1>` — Bug: `<ID>`

### Technical Changes
- `<tech change>` — ADR: `<link>`

---

## Gates Passed

| Gate | Verdict | Artifact |
|------|---------|---------|
| QA | PASS | `qa/gates/<slug>.md` |
| Security | APPROVED | `qa/security/<slug>.md` |
| Pre-release checklist | COMPLETE | see below |

---

## Pre-Release Checklist

- [x] QA gate: PASS
- [x] Security gate: APPROVED
- [x] Regression suite: passing
- [x] Staging smoke test: passing
- [x] Rollback plan: documented
- [x] Monitoring verified
- [x] Runbooks updated
- [x] On-call briefed
- [x] Comms sent

---

## Performance Baseline

| Metric | Pre-Release | Post-Release | Delta |
|--------|------------|-------------|-------|
| P50 latency | | | |
| P99 latency | | | |
| Error rate | | | |
| Throughput (req/s) | | | |

---

## Rollback Plan

**Method:** `<blue-green swap | git revert + redeploy>`
**Estimated time:** `<N minutes>`
**Trigger condition:** `<what would cause us to rollback>`
**Owner:** `<on-call engineer>`

---

## Monitoring

**Dashboard:** `<link>`
**Alert thresholds:**
- Error rate > `<%>` for `<N>` minutes → page on-call
- P99 > `<ms>` for `<N>` minutes → page on-call

**Watch period:** 24 hours post-deploy

---

## Known Issues

| Issue | Severity | Workaround | Planned Fix |
|-------|---------|-----------|------------|
| | | | sprint-NN |

---

## Post-Release Actions

- [ ] Monitor metrics for 24h
- [ ] User feedback review (48h)
- [ ] PM post-release review scheduled: `<date>`
- [ ] Analytics data review: `<date>`
