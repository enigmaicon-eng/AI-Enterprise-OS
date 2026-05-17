---
type: prd
version: "2.0"
id: PRD-<YYYY-MM-DD>-<slug>
status: draft | in-review | approved | implementing | shipped | archived
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: <name or pm-agent>
pm-owner: <name>
eng-lead: <name>
design-lead: <name>
reviewers: []
approvers: []
target-release: <YYYY-MM-DD or sprint-id>
discovery-ref: wiki/decisions/<date>-<slug>-discovery-decision.md
---

# PRD: <Feature Name>

> **Status:** `DRAFT` — not approved for engineering
> **One-liner:** `<The feature, for whom, and why it matters now — 1 sentence>`

---

## ① Executive Summary

| Field | Value |
|-------|-------|
| **Problem** | `<user problem in one clause>` |
| **Solution** | `<what we're building in one clause>` |
| **Primary user** | `<specific segment>` |
| **North star metric** | `<metric>` → `<target>` by `<date>` |
| **Investment estimate** | `<T-shirt size>` engineering · `<T-shirt size>` design |
| **Confidence** | high / medium / low — `<reason>` |
| **Dependencies** | `<critical blockers or "none">` |
| **Approved by** | _pending_ |

---

## ② Problem Statement

### 2.1 Who Is Affected

**Primary segment:** `<specific user type — e.g., "B2B admin users managing > 50 seats">`
**Secondary segment:** `<if applicable>`
**Not addressed:** `<segments explicitly excluded>`

### 2.2 The Problem

> When `<user type>` tries to `<goal>`, they encounter `<obstacle>`, which causes `<measurable impact>`, because `<root cause>`.

**Frequency:** `<how often this problem occurs per user>`
**Severity:** `<what the worst-case impact is>`

### 2.3 Evidence

Evidence must be cited with source, date, and sample size.

| # | Type | Finding | Source | Date | n |
|---|------|---------|--------|------|---|
| E1 | Quantitative | `<stat: X% of users do Y>` | `<source>` | `<date>` | `<n>` |
| E2 | Qualitative | `"<verbatim user quote>"` | `<channel>` | `<date>` | — |
| E3 | Support data | `<# tickets / type>` | `<helpdesk tool>` | `<date range>` | `<n>` |
| E4 | Behavioral | `<funnel drop-off or usage pattern>` | `<analytics>` | `<date>` | `<n>` |

**Evidence quality rating:** Strong / Moderate / Weak — `<brief rationale>`

### 2.4 Hypothesis

> We believe `<solution type>` will `<measurable outcome>` for `<user segment>` because `<evidence reference>`.
> We will know this is true when `<observable signal>`.

### 2.5 Job to Be Done

> When `<situation>`, I want to `<motivation / goal>`, so I can `<desired outcome>`.

---

## ③ Goals & Success Metrics

### 3.1 Primary Metric (North Star)

**Metric:** `<exact name and definition>`
**How measured:** `<data source, query, or event name>`
**Baseline:** `<current value as of date>`
**Target:** `<target value>`
**By:** `<date>`
**Confidence:** `<low / medium / high and why>`

### 3.2 Secondary Metrics (Drivers)

| Metric | Definition | Baseline | Target | By | Source | Cadence |
|--------|-----------|---------|--------|-----|--------|---------|
| | | | | | | daily/weekly |

### 3.3 Guardrail Metrics (Must Not Degrade)

| Metric | Current | Floor | Why It's Protected |
|--------|---------|-------|-------------------|
| | | | |

### 3.4 Counter-Metrics (Watch for Unintended Effects)

| Risk Metric | Why We Watch It | Alert Threshold |
|------------|----------------|----------------|
| | | |

### 3.5 Measurement Plan

**Analytics events required:** `analytics/<slug>-event-taxonomy.md`
**Dashboard:** `<link when built>`
**First review date:** `<48–72h post-launch>`

---

## ④ Non-Goals (Out of Scope)

The following are **explicitly excluded** from this PRD and must not be built as part of this effort:

| Out-of-Scope Item | Reason Excluded | Where It Belongs |
|------------------|----------------|-----------------|
| `<item>` | `<why>` | `<future PRD name / backlog>` |

> **Rule:** Any scope creep during implementation requires PM approval and a PRD amendment. Not a Slack message.

---

## ⑤ User Stories & Acceptance Criteria

### Format
- **Story:** As a `<role>`, I want `<capability>`, so that `<benefit>`.
- **AC:** Given `<precondition>`, when `<trigger>`, then `<observable result>`.
- **Priority:** P0 (must-have for launch) / P1 (should-have) / P2 (nice-to-have)

---

### Story 1 · `<Title>` · Priority: P0

**As a** `<role>`, **I want to** `<capability>`, **so that** `<benefit>`.

| ID | Given | When | Then | Priority |
|----|-------|------|------|---------|
| AC-01 | `<precondition>` | `<user action>` | `<expected system response>` | P0 |
| AC-02 | `<edge case precondition>` | `<user action>` | `<expected behavior>` | P0 |
| AC-03 | `<error condition>` | `<user action>` | `<error handling>` | P0 |

---

### Story 2 · `<Title>` · Priority: P0

**As a** `<role>`, **I want to** `<capability>`, **so that** `<benefit>`.

| ID | Given | When | Then | Priority |
|----|-------|------|------|---------|
| AC-04 | | | | |

---

### Story N · `<Title>` · Priority: P1 / P2

_(repeat format)_

---

## ⑥ Edge Cases & Error States

Every feature has a complete set of non-happy-path behaviors. These are requirements, not afterthoughts.

| # | Scenario | Trigger | Expected Behavior | AC Ref |
|---|----------|---------|-------------------|--------|
| EC-01 | Empty state | User has no data yet | Show empty state UI with CTA: `"<copy>"` | — |
| EC-02 | Loading state | Async operation in progress | Skeleton / spinner per design spec | — |
| EC-03 | Network error | Request fails or times out | Toast: `"<error copy>"` + Retry button | — |
| EC-04 | Partial failure | Some items succeed, some fail | List successes; list failures with reason | — |
| EC-05 | Permissions | User lacks required permission | Explain what's needed; do not 404 | — |
| EC-06 | Invalid input | User enters out-of-range data | Inline validation; do not submit | — |
| EC-07 | Concurrency | Two users edit same record simultaneously | `<last-write-wins / conflict UI / lock>` | — |
| EC-08 | Session expiry | Session times out mid-flow | Save progress; prompt re-auth | — |
| EC-09 | `<feature-specific>` | `<trigger>` | `<behavior>` | — |

---

## ⑦ Design & Technical Considerations

### 7.1 UX
- Design brief: `implementation/design-briefs/<slug>.md`
- Key UX requirements: `<1–3 constraints from user research>`
- Accessibility: WCAG 2.1 AA minimum

### 7.2 Architecture
- Relevant ADRs: `<ADR-NNN or "none yet — pending architecture review">`
- Known technical constraints: `<latency, data model, existing system>`
- Security classification of data handled: public / internal / confidential / restricted
- Estimated scale: `<requests/day, users/day>`

### 7.3 Analytics Instrumentation
- Events required: see `analytics/<slug>-event-taxonomy.md`
- Events must be implemented before launch (no analytics debt)
- PII handling: `<what user data is in events, how it's protected>`

### 7.4 Security & Compliance
- Data touched: `<list PII or sensitive fields>`
- Auth requirements: `<who can access this feature>`
- Compliance flags: GDPR / SOC2 / PCI / HIPAA / `<none>`

---

## ⑧ Dependencies & RACI

### 8.1 Dependencies

| Dependency | Type | Owner | Confirmed? | Risk | Mitigation |
|-----------|------|-------|-----------|------|-----------|
| `<name>` | Internal / External | `<team>` | Yes / No | H/M/L | `<fallback>` |

### 8.2 RACI Matrix

| Activity | PM | Eng | Design | QA | Analytics | Security | Delivery |
|---------|----|----|--------|-----|-----------|---------|---------|
| PRD approval | A | C | C | — | C | C | — |
| Architecture design | C | R | — | — | — | C | — |
| UX design | C | — | R | — | — | — | — |
| Implementation | I | R | — | — | — | — | — |
| QA | I | C | — | R | — | — | — |
| Security review | I | C | — | — | — | R | — |
| Launch | A | C | C | C | C | C | R |
| Post-launch review | R | C | — | — | C | — | — |

_R = Responsible · A = Accountable · C = Consulted · I = Informed_

---

## ⑨ Open Questions

Track all unresolved questions. PRD cannot be approved with P0 questions open.

| ID | Question | Priority | Owner | Due | Status | Resolution |
|----|---------|---------|-------|-----|--------|-----------|
| Q-01 | `<question>` | P0 / P1 / P2 | `<name>` | `<date>` | Open | — |

---

## ⑩ Timeline & Milestones

| Milestone | Owner | Target Date | Status | Notes |
|-----------|-------|------------|--------|-------|
| Discovery complete | PM | | ✅ / 🔄 / — | |
| PRD approved | PM + approvers | | | |
| Architecture complete | Eng Lead | | | |
| Design complete | Design Lead | | | |
| Engineering complete | Eng Lead | | | |
| QA complete | QA | | | |
| Security review | Security | | | |
| Release | Delivery | | | |
| Post-launch review | PM | T+3 days | | |

**Critical path:** `<which milestone blocks all others>`

---

## ⑪ Risks

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|------------|--------|-----------|-------|
| R-01 | `<risk>` | H/M/L | H/M/L | `<mitigation>` | `<owner>` |

---

## ⑫ Appendix

### Research & Evidence References
- `wiki/research/<date>-<slug>-user-research.md`
- `<external report or citation>`

### Related PRDs & Decisions
- `prds/<related>.md` — `<relationship>`
- `wiki/decisions/<date>-<slug>.md` — `<relationship>`

### Glossary
| Term | Definition |
|------|-----------|
| | |

### Revision History
| Version | Date | Author | Change |
|---------|------|--------|--------|
| 0.1 | | | Initial draft |
| 0.2 | | | After stakeholder review |
| 1.0 | | | Approved |

---

## Approval Sign-Off

| Role | Name | Decision | Date | Notes |
|------|------|---------|------|-------|
| PM Owner | | Approved / Changes Needed | | |
| Eng Lead | | Approved / Changes Needed | | |
| Design Lead | | Approved / Changes Needed | | |
| Security | | Approved / Changes Needed | | |
| Analytics | | Approved / Changes Needed | | |

> **PRD is approved when ALL approvers have signed off with "Approved". Any "Changes Needed" blocks approval.**
