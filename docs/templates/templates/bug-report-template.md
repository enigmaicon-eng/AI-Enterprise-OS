---
type: bug-report
bug-id: BUG-<NNN>
feature: <feature or component>
severity: critical | high | medium | low
status: open | in_progress | fixed | verified | closed | deferred
created: <YYYY-MM-DD>
author: qa-agent
assigned-to: engineer-agent
sprint: <sprint-id or backlog>
---

# BUG-<NNN>: <Short Title>

**Severity:** `critical | high | medium | low`
**Status:** `open`
**Found in:** `<environment: staging | production | feature-branch>`
**AC Violated:** `<AC-NNN from PRD, or "regression" if pre-existing feature>`

---

## Summary

One sentence: what breaks, under what condition.

---

## Steps to Reproduce

Exact steps — must be reproducible by any engineer without clarification.

1. Navigate to `<URL or screen>`
2. `<exact action>`
3. `<exact action>`
4. `<expected vs. actual>`

**Expected behavior:** `<what should happen>`
**Actual behavior:** `<what actually happens>`

---

## Evidence

| Type | Link / Description |
|------|-------------------|
| Screenshot | `<attached or n/a>` |
| Console errors | `<paste relevant errors>` |
| Network request | `<endpoint + status + response>` |
| Log output | `<relevant log lines>` |

---

## Environment

| Field | Value |
|-------|-------|
| Environment | staging / production / feature-branch |
| Branch / Version | `<commit hash or version>` |
| Browser | `<browser + version>` |
| OS | `<if relevant>` |
| User type / role | `<account type>` |
| Test data | `<any specific data state required>` |

---

## Severity Justification

**Why this severity?**
- `Critical` — data loss, security issue, complete feature failure
- `High` — core acceptance criterion not met, no workaround
- `Medium` — non-core issue, workaround exists: `<describe workaround>`
- `Low` — cosmetic or edge case, no user impact

---

## Fix Notes

_(Filled by engineer-agent after investigation)_

Root cause: `<what caused this>`
Fix approach: `<brief description>`
Fix risk: `<any concern about the fix>`

---

## Verification

_(Filled by qa-agent after fix deployed)_

Verification date: `<date>`
Verified by: qa-agent
Verification steps: same as reproduction steps above
Outcome: `fixed | not_fixed | regression_introduced`
