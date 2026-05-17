---
type: rfc
version: "2.0"
id: RFC-<NNN>
status: draft | open-for-comment | accepted | rejected | withdrawn | superseded
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: <name or agent>
co-authors: []
reviewers: []
comment-deadline: <YYYY-MM-DD>
target-adrs: []
estimated-effort: XS | S | M | L | XL
affects-teams: []
supersedes: <RFC-NNN or null>
---

# RFC-<NNN>: <Proposal Title>

> **Status:** `DRAFT` | `OPEN FOR COMMENT (deadline: <date>)` | `ACCEPTED` | `REJECTED`
> **TL;DR:** `<One sentence: what change is proposed and why it matters>`

---

## ① Summary

**What:** `<What change is being proposed, in 2–3 sentences>`

**Why now:** `<What makes this urgent or timely>`

**Impact:** `<Who is affected and how significantly>`

**Decision needed by:** `<Date — if time-sensitive>`

---

## ② Motivation & Problem

### 2.1 Current State

Describe the current system/process/behavior as it is today. Include:
- What exists and how it works
- Quantified pain: how often the problem occurs and at what cost

```
Current behavior: <describe>
Frequency of pain: <N times per week/month>
Cost of status quo: <time/money/risk>
```

### 2.2 Problem Statement

> `<Precise problem statement — specific, measurable, not solution-shaped>`

### 2.3 Evidence of the Problem

| Evidence | Type | Source | Date | Weight |
|---------|------|--------|------|--------|
| `<finding>` | metric / interview / incident / support | `<source>` | `<date>` | strong / moderate / weak |

### 2.4 Why Not Now Is Not Acceptable

`<What gets worse if we don't solve this? Quantify where possible.>`

---

## ③ Proposal

### 3.1 Proposed Change (Summary)

`<3–5 sentences describing the proposal at a level any engineer could understand>`

### 3.2 Detailed Design

Provide enough detail that a principal engineer could evaluate this. Include all of:

#### 3.2.1 Core Design

`<Technical design narrative>`

#### 3.2.2 Interface Changes

```
# New / changed API surfaces, configuration, or data contracts
# Be explicit — vague design = vague review feedback

Before:
  <existing interface>

After:
  <proposed interface>

Backward compatible: YES / NO
Breaking change: YES / NO — migration strategy below
```

#### 3.2.3 Data Model Changes

```
# Schema additions, modifications, or removals
# Include migration impact (rows affected, downtime, risk)

Table: <name>
  + field_name  type  description  nullable
  ~ changed_field  old_type → new_type  reason
  - removed_field  reason for removal

Migration: <additive / requires backfill / breaking>
Data at risk: <estimated rows / GB>
```

#### 3.2.4 System Interaction Changes

```
# How systems interact before and after
# Use ASCII diagram if helpful

Before:
  A → B → C

After:
  A → B → D → C
         ↕
         E (new)
```

#### 3.2.5 Configuration / Deployment Changes

```
# Environment variables, feature flags, infrastructure
New:     FEATURE_X_ENABLED=true
Changed: MAX_CONNECTIONS: 100 → 500
Removed: LEGACY_AUTH_URL
```

### 3.3 Security Considerations

- **Authentication/authorization impact:** `<none | describe change>`
- **Data exposure risk:** `<none | describe>`
- **New attack surface:** `<none | describe>`
- **Security review required:** YES / NO — reason: `<rationale>`

### 3.4 Performance Considerations

- **Latency impact:** `<none / +Xms P99 / analysis pending>`
- **Throughput impact:** `<none / increase / decrease>`
- **Resource impact:** `<CPU / memory / storage change>`
- **Load test required:** YES / NO

### 3.5 Operational Considerations

- **Observability:** `<new metrics, logs, or traces required>`
- **Alerting:** `<new alert thresholds>`
- **Runbook changes:** `<none / path to runbook update>`
- **On-call impact:** `<increased / unchanged / decreased complexity>`

---

## ④ Drawbacks & Risks

Be honest. Proposals with no drawbacks are not credible.

| Drawback | Severity | Mitigation |
|---------|---------|-----------|
| `<drawback>` | H/M/L | `<how we address or accept this>` |

**Risks if this is implemented incorrectly:**
- `<risk>`

**Risks if this is NOT implemented:**
- `<risk>`

---

## ⑤ Alternatives Considered

Minimum 2 alternatives must be evaluated. "Do nothing" is always an alternative.

### Alternative A: `<Name>` — `<one-line description>`

`<How it works>`

**Why rejected:**
- `<specific reason>`
- `<specific reason>`

---

### Alternative B: `<Name>` — `<one-line description>`

`<How it works>`

**Why rejected:**
- `<specific reason>`

---

### Alternative C: Do Nothing / Status Quo

**Why rejected:**
- `<quantified cost of inaction>`

---

## ⑥ Migration Plan

_Required if this proposal changes an existing interface, contract, or data structure._

### 6.1 Migration Strategy

```
Phase 1 — Backward-compatible change deployed  (date: <YYYY-MM-DD>)
Phase 2 — Consumers migrated to new interface  (date: <YYYY-MM-DD>)
Phase 3 — Old interface deprecated             (date: <YYYY-MM-DD>)
Phase 4 — Old interface removed                (date: <YYYY-MM-DD>)
```

### 6.2 Consumer Impact

| Consumer | Breaking? | Migration Steps | Owner | Timeline |
|---------|---------|----------------|-------|---------|
| `<team/service>` | YES / NO | `<steps>` | `<name>` | `<date>` |

### 6.3 Rollback Plan

`<How to undo this change if it causes problems after deployment>`

---

## ⑦ Implementation Plan

### 7.1 Work Breakdown

| Phase | Work | Tier | Owner | Estimate | Dependencies |
|-------|------|------|-------|---------|-------------|
| 1 | `<task>` | L/M/XS | `<agent/team>` | `<days>` | none |
| 2 | `<task>` | M | | | Phase 1 |

### 7.2 Rollout Strategy

```
Target: <environment / % of traffic>
Rollout method: feature flag / canary / blue-green / direct
Rollout schedule:
  - Internal testing:  <date> (engineers only)
  - Canary (1–5%):     <date>
  - Staged (25–50%):   <date>
  - Full rollout:      <date>
```

### 7.3 Success Criteria

How will we know this RFC was successfully implemented?

| Metric | Before | After Target | Measurement |
|--------|--------|-------------|------------|
| `<metric>` | `<value>` | `<target>` | `<method>` |

---

## ⑧ Unresolved Questions

These must be resolved before the RFC can be accepted.

| ID | Question | Priority | Owner | Due | Status |
|----|---------|---------|-------|-----|--------|
| Q-01 | `<question>` | blocking / non-blocking | `<name>` | `<date>` | Open |

---

## ⑨ Review

### Review Process

1. RFC posted to `rfc/` with status `open-for-comment`
2. Comment deadline set to 5 business days (P2/P3) or 2 business days (P1 urgency)
3. All affected teams must either comment or explicitly approve
4. Author addresses all blocking comments before acceptance
5. Architect-agent issues acceptance or rejection with documented rationale

### Review Log

| Reviewer | Role | Date | Verdict | Key Comments |
|---------|------|------|---------|-------------|
| | | | approve / request-changes / abstain | |

### Blocking Comments

_Unresolved blocking comments prevent acceptance._

| # | Commenter | Comment | Status | Resolution |
|---|---------|---------|--------|-----------|
| | | | Open / Resolved | |

---

## ⑩ Decision

**Status:** `accepted | rejected | withdrawn`

**Decision date:** `<YYYY-MM-DD>`

**Decision maker:** `<architect-agent or named approver>`

**Rationale:**
`<Why this RFC was accepted or rejected — reference specific review findings>`

**Conditions (if conditional acceptance):**
- `<condition that must be met>`

**Resulting ADR:** `architecture/decisions/ADR-NNN-<slug>.md` _(if accepted)_

**Superseded by:** `<RFC-NNN>` _(if withdrawn/superseded)_
