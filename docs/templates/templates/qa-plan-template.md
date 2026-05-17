---
type: qa-plan
version: "2.0"
id: QA-<YYYY-MM-DD>-<slug>
status: draft | in-review | approved | executing | complete
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
author: qa-agent
prd-ref: prds/<slug>.md
impl-ref: implementation/<slug>.md
feature-branch: <branch-name>
test-environment: staging | qa | production
sprint: <sprint-id>
---

# QA Plan: <Feature Name>

> **Status:** `DRAFT`
> **Test environment:** `<staging | qa>`
> **Planned execution start:** `<YYYY-MM-DD>`
> **Planned verdict date:** `<YYYY-MM-DD>`

---

## ① Summary

| Field | Value |
|-------|-------|
| **Feature** | `<feature name>` |
| **PRD** | `prds/<slug>.md` |
| **Acceptance criteria count** | `<N ACs from PRD>` |
| **Estimated test effort** | `<T-shirt size / days>` |
| **Risk classification** | High / Medium / Low |
| **Security testing required** | Yes / No |
| **Accessibility testing required** | Yes / No |
| **Performance testing required** | Yes / No |

---

## ② Scope

### 2.1 In Scope

- All acceptance criteria from `prds/<slug>.md` §⑤
- All edge cases from `prds/<slug>.md` §⑥
- Regression for affected components: `<list components>`
- `<any additional areas to test>`

### 2.2 Out of Scope

| Item | Reason | Covered By |
|------|--------|-----------|
| `<component not being tested>` | `<why excluded>` | `<other plan or N/A>` |

### 2.3 Test Environment Requirements

```
Environment:    staging
Branch:         <feature-branch>
Build:          <build-id or "latest staging deploy">
Test data:      <seed script or fixture description>
External deps:  <mocked / real / describe>
Feature flags:  <flag-name: enabled / disabled>
```

---

## ③ Test Strategy

### 3.1 Testing Pyramid

| Level | Coverage Target | Tool | Owner |
|-------|---------------|------|-------|
| Unit | ≥ 80% new code | `<jest / pytest / vitest>` | engineer-agent |
| Integration | All API endpoints | `<supertest / pytest>` | engineer-agent |
| E2E | All P0 user stories | `<playwright / cypress>` | qa-agent |
| Load | `<concurrent users target>` | `<k6 / locust>` | qa-agent |
| Security | OWASP Top 10 for feature | `<SAST / manual>` | security-agent |
| Accessibility | WCAG 2.1 AA | `<axe / manual>` | qa-agent |

### 3.2 Risk-Based Prioritization

| Area | Risk Level | Testing Depth | Rationale |
|------|-----------|--------------|-----------|
| `<area>` | H/M/L | Deep / Standard / Smoke | `<why>` |

---

## ④ Test Cases

### 4.1 Acceptance Criteria Tests

_Every acceptance criterion from the PRD must map to at least one test case._

| TC-ID | AC Ref | Test Title | Precondition | Steps | Expected Result | Priority |
|-------|--------|-----------|-------------|-------|----------------|---------|
| TC-01 | AC-01 | `<test title>` | `<state>` | `<numbered steps>` | `<observable outcome>` | P0 |
| TC-02 | AC-02 | | | | | P0 |
| TC-03 | AC-03 | | | | | P0 |

### 4.2 Edge Case Tests

_All edge cases from PRD §⑥ plus discovered cases._

| TC-ID | Edge Case | Trigger | Expected Behavior | AC Ref |
|-------|-----------|---------|-------------------|--------|
| EC-01 | Empty state | User has no records | Empty state UI shown with CTA | — |
| EC-02 | Concurrent edit | Two sessions modify same record | Conflict handled per spec | — |
| EC-03 | Session expiry | Token expires mid-flow | Progress saved; re-auth prompt | — |
| EC-04 | Network timeout | Request takes > 30s | Error message + retry option | — |
| EC-05 | Max input | User submits max-length field | Accepted and processed | — |
| EC-06 | Min input | User submits empty required field | Inline validation error | — |
| EC-07 | Permission boundary | User tries forbidden action | 403 + explanation message | — |
| EC-08 | Duplicate submission | User submits form twice | Second request idempotent or rejected | — |
| EC-09 | `<feature-specific>` | `<trigger>` | `<expected>` | — |

### 4.3 Regression Tests

Existing functionality that must not degrade:

| TC-ID | Component | Test | Baseline |
|-------|-----------|------|---------|
| RG-01 | `<component>` | `<what to verify>` | `<previous behavior>` |

---

## ⑤ Performance Tests

_Required for L-tier features or features under high load._

### 5.1 Load Test Parameters

```
Target users (concurrent):  <N>
Ramp-up period:             <X seconds>
Steady state duration:      <X minutes>
Target RPS:                 <N requests/second>
Data volume:                <Xk records in DB>
```

### 5.2 Performance Acceptance Criteria

| Metric | P50 Target | P99 Target | Max Acceptable | Current Baseline |
|--------|-----------|-----------|---------------|-----------------|
| Response time (GET) | `<Xms>` | `<Xms>` | `<Xms>` | `<Xms or N/A>` |
| Response time (POST) | | | | |
| Error rate (under load) | — | — | < 0.1% | |
| CPU utilization | — | — | < 70% | |
| Memory utilization | — | — | < 80% | |

### 5.3 Stress Test

```
Goal:      Find breaking point
Method:    Increase load until error rate > 5%
Record:    Breaking point RPS and error type
Pass if:   Breaking point > <N × steady-state target>
```

---

## ⑥ Security Tests

### 6.1 OWASP Checklist (Feature-Relevant)

| # | Check | Method | Result |
|---|-------|--------|--------|
| 1 | Injection (SQL / command / LDAP) | Automated scan + manual | — |
| 2 | Authentication bypass | Manual test cases | — |
| 3 | Broken access control | Role-based test matrix | — |
| 4 | Sensitive data in logs or responses | Log review + API audit | — |
| 5 | Mass assignment / over-posting | API field audit | — |
| 6 | IDOR (Insecure Direct Object Reference) | Cross-user resource access | — |
| 7 | XSS (if UI feature) | Automated + manual input tests | — |
| 8 | CSRF (if state-changing forms) | Token validation check | — |
| 9 | `<feature-specific security concern>` | | — |

### 6.2 Security Test Cases

| TC-ID | Attack Vector | Test | Expected Result |
|-------|-------------|------|----------------|
| SEC-01 | SQL injection via `<field>` | Submit `'; DROP TABLE users; --` | Input rejected; 400 returned |
| SEC-02 | Access another user's resource | Request with another user's ID | 403 Forbidden |
| SEC-03 | `<other>` | `<input>` | `<safe behavior>` |

---

## ⑦ Accessibility Tests

_WCAG 2.1 AA minimum. Required for all UI-facing features._

| Check | Tool | Pass Criteria | Result |
|-------|------|--------------|--------|
| Automated scan | axe / Lighthouse | 0 critical violations | — |
| Keyboard navigation | Manual | All actions reachable by keyboard alone | — |
| Screen reader | NVDA / VoiceOver | All interactive elements announced correctly | — |
| Color contrast | Automated + visual | ≥ 4.5:1 for normal text, ≥ 3:1 for large text | — |
| Focus indicators | Visual inspection | Focus visible on all interactive elements | — |
| Form labels | Automated | All inputs have programmatic labels | — |
| Error announcements | Screen reader | Errors announced to AT without page refresh | — |

---

## ⑧ Bug Triage Process

### 8.1 Severity Decision Tree

```
Does it cause data loss or a security vulnerability?
  YES → Critical

Does it block a P0 acceptance criterion with no workaround?
  YES → High

Does it block a P1/P2 acceptance criterion OR have a workaround?
  YES → Medium

Otherwise:
  → Low
```

### 8.2 Bug Handling by Severity

| Severity | Action | Timeline | Release Impact |
|----------|--------|---------|---------------|
| Critical | Block release; engineer-agent fix immediately | Same day | Cannot ship |
| High | Block release; fix this sprint | < 3 days | Cannot ship with open High |
| Medium | Fix this sprint or defer with PM approval | This sprint | Can ship with PM sign-off |
| Low | Log in backlog | Next sprint | No impact |

### 8.3 Bug Report Location

All bugs filed at: `bugs/BUG-<NNN>-<slug>.md` using `templates/bug-report-template.md`

---

## ⑨ Verdict Framework

### 9.1 Verdict Decision

```
FAIL (unconditional):
  - ANY critical bug open
  - ANY P0 acceptance criterion failing
  - Security review blocked
  - Performance criteria not met (if performance testing required)

CONDITIONAL PASS:
  - High bugs open WITH documented mitigation plan
  - Non-blocking open questions with time-boxed resolution
  - Accessibility issues with remediation plan in < 1 sprint

PASS:
  - All P0 ACs verified
  - No critical or high bugs open
  - Performance criteria met
  - Security review approved
  - Accessibility scan passing
```

### 9.2 Verdict Record

**Final verdict:** `PASS | CONDITIONAL PASS | FAIL`

**Verdict date:** `<YYYY-MM-DD>`

**Issued by:** qa-agent

**Conditions (if CONDITIONAL):**
- `<condition that must be met before release>`

**Open bugs at verdict time:**

| Bug ID | Severity | Status | Release Blocking? |
|--------|----------|--------|-----------------|
| | | | |

---

## ⑩ Test Execution Log

| TC-ID | Date | Tester | Build | Result | Bug Filed |
|-------|------|--------|-------|--------|-----------|
| TC-01 | | qa-agent | | PASS / FAIL / BLOCKED | — |

---

## ⑪ Handoff

### On PASS: Handoff to Delivery

```yaml
handoff:
  from: qa-agent
  to: delivery-agent
  verdict: PASS
  feature: <feature-name>
  build: <build-id>
  test-report: qa/<date>-<slug>-qa-report.md
  open-bugs: []
  conditions: []
  ready-for-release: true
```

### On FAIL: Handoff to Engineering

```yaml
handoff:
  from: qa-agent
  to: engineer-agent
  verdict: FAIL
  feature: <feature-name>
  blocking-bugs:
    - id: BUG-NNN
      severity: critical | high
      description: <one-line>
      ac-violated: AC-NN
  retest-required: true
  retest-scope: <full | targeted>
```
