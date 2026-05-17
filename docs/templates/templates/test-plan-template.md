---
type: test-plan
feature: <feature name>
created: <YYYY-MM-DD>
author: qa-agent
prd-ref: <prds/<slug>.md>
status: draft | approved | executing | complete
---

# Test Plan: <Feature Name>

---

## Scope

**In scope:** `<what is being tested>`
**Out of scope:** `<what is explicitly not tested here>`
**Test environment:** `<staging | feature branch | local>`

---

## Acceptance Criteria Coverage

Every acceptance criterion from the PRD must map to one or more test cases:

| AC ID | Acceptance Criterion | Test Case ID(s) | Status |
|-------|---------------------|----------------|--------|
| AC-01 | | TC-001 | pending |

---

## Test Cases

### Functional Tests

#### TC-001: <Happy Path>
- **Preconditions:** `<what must be true before running this test>`
- **Steps:**
  1. `<step>`
  2. `<step>`
- **Expected result:** `<what should happen>`
- **Actual result:** _pending_
- **Status:** pending | pass | fail

#### TC-002: <Edge Case>
...

---

### Edge Cases & Error States

| Scenario | Expected Behavior | Test Case |
|----------|-----------------|-----------|
| Empty state (no data) | Shows empty state UI with CTA | TC-0XX |
| Network error | Shows error message with retry | TC-0XX |
| Invalid input | Inline validation error | TC-0XX |
| Permissions insufficient | Explains what's needed | TC-0XX |

---

### Performance Tests

| Test | Tool | Success Criteria | Baseline |
|------|------|-----------------|---------|
| Load test (N concurrent users) | | P99 < Xms | |
| API response time | | P50 < Xms | |

---

### Security Tests

| Test | Tool | Pass Criteria |
|------|------|--------------|
| OWASP Top 10 check | | No high/critical findings |
| Input validation | | No injection possible |
| Auth bypass attempt | | All attempts blocked |

---

### Accessibility Tests

| Check | Tool | Standard |
|-------|------|---------|
| Color contrast | | WCAG 2.1 AA (4.5:1) |
| Keyboard navigation | Manual | All interactions reachable |
| Screen reader | Manual | All content announced correctly |

---

### Regression Tests

Existing test suites that must pass:
- [ ] `<existing test suite name>` — last passed: `<date>`
- [ ] `<existing test suite name>`

---

## Bug Report Summary

| Bug ID | Summary | Severity | Status |
|--------|---------|---------|--------|
| | | | |

---

## Quality Gate Verdict

**Verdict:** PASS | CONDITIONAL_PASS | FAIL

**Conditions (if conditional):**
- `<specific condition PM must sign off on>`

**Blocking issues (if fail):**
- `<specific issue that must be resolved>`
