# QA Workflow

```
workflow_id:    qa-workflow
version:        1.0.0
trigger:        handoff from engineering-workflow Step 09, "QA this", "test this", "verify this works", "test plan for"
intent_class:   QA
total_steps:    10
typical_duration: 1–5 business days
state_file:     memory/workflow-state/qa-{slug}.yaml
```

---

## Purpose

Verify that what was built matches what was specified. Produce an evidence-based quality gate verdict that either releases work to production or routes it back to engineering with specific, reproducible findings.

**Rules:**
- QA tests against acceptance criteria, not against the implementation
- Every bug is documented before routing back to engineering (no verbal-only bugs)
- Quality gate verdicts are evidence-based — not pressure-based
- Deadline pressure never changes a FAIL verdict to PASS (only PM can accept known defects with explicit documentation)

---

## Routing Entry Points

```
IF handoff from engineering-workflow.STEP-09
  THEN → qa-workflow (full path)

IF request is "write a test plan"
  THEN → Step 01 only (planning artifact, no execution)

IF request is "regression test"
  THEN → Step 06 only (regression execution)

IF request is "performance test"
  THEN → Step 05 only (performance path)

IF request is "security test"
  THEN → route to security-agent (not this workflow)
```

---

## Agent Sequence

```
STEP 01  qa-agent                Test Plan Authoring
STEP 02  qa-agent                Environment Verification
STEP 03  qa-agent                Functional Testing (happy paths)
STEP 04  qa-agent                Edge Case & Negative Testing
STEP 05  qa-agent                Performance Testing
STEP 06  qa-agent                Regression Testing
STEP 07  qa-agent + ux-agent     Accessibility & Design Fidelity
STEP 08  qa-agent + pm-agent     Bug Triage & Severity Classification
STEP 09  qa-agent                Quality Gate Verdict
STEP 10  supervisor-agent        Gate Review
         ↓ PASS                  ↓ FAIL
   delivery-agent            engineer-agent (with bug reports)
```

---

## Step Specifications

---

### STEP 01 — Test Plan Authoring

**Agent:** `qa-agent`
**Time budget:** 2–4 hours
**Inputs:** PRD acceptance criteria, design spec, engineering handoff envelope

**Instructions:**
1. Read all acceptance criteria from the PRD — these are the test scope
2. Read the design spec — UI tests must match the spec exactly
3. Map each acceptance criterion to ≥ 1 test case ID
4. Define additional edge cases beyond the PRD (things that commonly break)
5. Determine test types needed:

| Test Type | Required? | Tool |
|-----------|---------|------|
| Functional (happy path) | Always | Manual or automated |
| Edge cases | Always | Manual or automated |
| Negative/error paths | Always | Manual or automated |
| Performance | If API or data-heavy feature | k6, artillery, or equivalent |
| Regression | Always | Existing test suite |
| Accessibility | If UI changes | axe, manual keyboard/screen reader |
| Security | If auth, data, or API changes | Route to security-agent |
| Cross-browser | If web UI changes | Manual or BrowserStack |
| Mobile responsiveness | If responsive design changes | Manual or device farm |

**Artifact:**
```
path:   qa/{date}-{slug}-test-plan.md
template: templates/test-plan-template.md
schema:
  scope: string
  out_of_scope: string
  acceptance_criteria_map:
    - ac_id: string
      ac_description: string
      test_case_ids: [TC-NNN]
  test_cases:
    - id: TC-001
      type: functional | edge | negative | performance | regression | accessibility
      title: string
      preconditions: string
      steps: [string]
      expected_result: string
      priority: P1_must_pass | P2_should_pass | P3_nice_to_have
  total_test_cases: integer
  p1_tests: integer  # All must pass for PASS verdict
  estimated_execution_time: string
```

**Gate (checklist):**
- [ ] Every acceptance criterion maps to ≥ 1 test case
- [ ] Error states, empty states, and loading states have test cases
- [ ] P1 vs P2 vs P3 priority assigned to every test case
- [ ] Test environment requirements specified
- [ ] No acceptance criterion is untested

---

### STEP 02 — Environment Verification

**Agent:** `qa-agent`
**Time budget:** 30 minutes

**Instructions:**
1. Verify test environment is up and accessible
2. Verify correct branch/version is deployed to test environment
3. Verify test data is in expected initial state
4. Verify any mocked external services are correctly configured
5. Verify analytics events fire (check network tab or log output)
6. Run smoke test: can the happy path be reached at all?

**Pre-test checklist:**
```
□ Test environment URL accessible
□ Correct version deployed (confirm commit hash matches PR)
□ Test user accounts created and accessible
□ External service mocks configured
□ Database seeded with required test data
□ Analytics instrumentation verified (events fire in dev tools)
□ Smoke test passed: can reach the feature being tested
```

**Escalation:**
- If environment not ready after 2 hours → escalate to `engineer-agent` (setup issue)
- If wrong version deployed → block until correct version deployed
- If smoke test fails → skip Steps 03–08; report environment issue; escalate to engineering

---

### STEP 03 — Functional Testing (Happy Paths)

**Agent:** `qa-agent`
**Time budget:** 2–4 hours (varies by feature size)

**Instructions:**
1. Execute all P1 test cases marked as `functional` type
2. For each test case:
   - Execute steps exactly as written
   - Compare actual result to expected result
   - Record: PASS / FAIL / BLOCKED (blocked = can't execute due to unrelated issue)
3. If a test case fails, immediately:
   - Capture: screenshot + console logs + network requests
   - Note: exact steps to reproduce, actual vs. expected behavior
   - Assign preliminary severity
   - Continue testing other cases (do NOT stop the run on first failure)
4. Document all findings — even minor observations

**Result tracking format:**
```
TC-001: PASS
TC-002: FAIL — [brief description] — see BUG-001
TC-003: PASS
TC-004: BLOCKED — environment issue with X
```

**Escalation:**
- If > 30% of P1 test cases fail in first hour → stop run; escalate to engineering; do not waste time testing a broken build
- If all critical acceptance criteria fail → this is a build quality issue, not a QA issue; return to engineering immediately

---

### STEP 04 — Edge Case & Negative Testing

**Agent:** `qa-agent`
**Time budget:** 2–4 hours

**Instructions:**
1. Execute all edge case and negative test cases
2. Mandatory edge cases for EVERY feature (not in the test plan by default — apply always):

| Scenario | What to Test |
|----------|-------------|
| **Empty state** | Feature when user has no data |
| **Maximum data** | Feature with maximum realistic data volume |
| **Boundary values** | Min/max input values, character limits |
| **Network degradation** | Slow network, timeout behavior |
| **Concurrent operations** | Two requests at once (race conditions) |
| **Session expiry** | What happens mid-flow if session expires |
| **Permission levels** | Feature with different user permission tiers |
| **Rapid repeat actions** | Double-clicking submit, rapid navigation |
| **Invalid inputs** | Invalid emails, SQL injection strings, XSS strings, very long inputs |
| **Interrupted flows** | Navigating away mid-flow, then returning |

3. For UI changes specifically:
   - Test at 375px (mobile), 768px (tablet), 1440px (desktop)
   - Test in light mode and dark mode (if applicable)
   - Test with browser zoom at 150% and 200%

**Findings:** Document all failures as bug reports (Step 08 for triage).

---

### STEP 05 — Performance Testing

**Agent:** `qa-agent`
**Time budget:** 2–4 hours
**Trigger:** Required for all API changes, data-heavy features, or features with explicit performance requirements in PRD. Conditional for pure UI changes.

**Performance test types:**

**Response time test (always):**
- Tool: k6, artillery, or curl timing
- Baseline from PRD or prior release (if no baseline exists, establish one)
- Pass criteria:
  - P50 ≤ specified target (or 200ms default for API)
  - P99 ≤ specified target (or 1000ms default for API)
  - Error rate ≤ 0.1% at baseline load

**Load test (for high-traffic paths):**
- Simulate expected peak load × 1.5
- Pass criteria: all response time targets met under load
- Monitor: CPU, memory, database connections

**Stress test (for critical paths, Tier L):**
- Find the breaking point
- Confirm: failure mode is graceful (not catastrophic)
- Pass criteria: system degrades gracefully, no data loss

**Artifact:**
```
path:   qa/{date}-{slug}-performance-report.md
schema:
  tool: string
  scenarios: [{name, concurrent_users, duration}]
  results:
    - scenario: string
      p50: float ms
      p95: float ms
      p99: float ms
      error_rate: float %
      throughput: float req/s
  baseline_comparison: string
  verdict: pass | fail | conditional
  notes: string
```

**Gate:**
- [ ] All specified performance targets met
- [ ] Error rate ≤ 0.1% at baseline load
- [ ] No resource exhaustion (memory leak, connection pool exhaustion) observed

---

### STEP 06 — Regression Testing

**Agent:** `qa-agent`
**Time budget:** 1–2 hours (automated), 2–4 hours (manual regression)

**Instructions:**
1. Run the full automated test suite:
   - Unit tests (should already be green from engineering)
   - Integration tests
   - E2E tests (critical paths)
2. Identify the regression impact scope from the engineering handoff:
   - Which existing features were touched?
   - Which downstream systems are affected?
3. Run targeted manual regression for high-risk areas:
   - Previously reported bugs in the same area
   - Features that share code with the new change
4. Record: what tests were run, what passed, what failed

**Regression scope matrix:**

| Change Type | Regression Scope |
|------------|-----------------|
| Backend-only API change | API contract tests + integrating frontend features |
| Database migration | All features that read/write affected tables |
| Auth change | All authenticated features |
| Shared component change | All features using that component |
| New feature (additive) | Minimal — smoke test adjacent features |

**Gate:**
- [ ] Full automated test suite: all passing
- [ ] Targeted manual regression: no regressions found
- [ ] Regressions found: documented as blocking bugs

---

### STEP 07 — Accessibility & Design Fidelity

**Agent:** `qa-agent` + `ux-agent`
**Time budget:** 2–4 hours
**Trigger:** Required for all UI changes. Skip for backend-only changes.

**Accessibility checks (`qa-agent`):**
1. Run automated accessibility scanner (axe DevTools, Lighthouse)
2. Keyboard navigation test:
   - Tab through all interactive elements
   - Every interactive element reachable
   - Focus indicator visible at every step
   - No keyboard traps
3. Screen reader test (VoiceOver/NVDA spot check):
   - All images have meaningful alt text
   - All form fields have associated labels
   - Error messages are announced
4. Color contrast check:
   - All text: ≥ 4.5:1 ratio (normal text), ≥ 3:1 (large text)
   - Interactive elements: ≥ 3:1
5. Motion and animation:
   - `prefers-reduced-motion` respected (if animations exist)

**Design fidelity check (`ux-agent`):**
1. Compare implementation to design spec pixel-by-pixel on:
   - Mobile (375px)
   - Desktop (1440px)
2. Check all specified states: default, hover, focus, active, disabled, loading, error, empty
3. Check typography: font size, weight, line height per spec
4. Check spacing: padding, margins per design tokens
5. Check color: all colors match design tokens (not hardcoded hex)

**Artifact:**
```
path:   qa/accessibility/{date}-{slug}-a11y-report.md
schema:
  automated_scan:
    tool: string
    violations: [{rule, severity, element, fix}]
    warnings: [{rule, element}]
  keyboard_navigation: pass | fail | partial
  keyboard_findings: [string]
  screen_reader: pass | fail | partial | not_tested
  color_contrast: pass | fail
  contrast_failures: [{element, ratio, required}]
  design_fidelity:
    reviewer: ux-agent
    verdict: pass | conditional | fail
    deviations: [{element, spec_value, actual_value, severity}]
```

**Gate (accessibility minimum — WCAG 2.1 AA):**
- [ ] No automated accessibility violations at `critical` or `serious` severity
- [ ] Keyboard navigation: all interactive elements reachable and operable
- [ ] Color contrast: all elements pass 4.5:1 (normal) / 3:1 (large text)
- [ ] Design fidelity: no major deviations from spec

**Escalation:**
- Critical accessibility failures → `ux-agent` + `engineer-agent`; block release
- Major design fidelity deviations → `ux-agent` reviews; may be blocking or non-blocking

---

### STEP 08 — Bug Triage & Severity Classification

**Agent:** `qa-agent` + `pm-agent`
**Time budget:** 1–2 hours
**Trigger:** After Steps 03–07, if any failures were found

**Instructions:**
`qa-agent` classifies; `pm-agent` reviews severity on borderline cases.

**Bug report creation (for every failure):**
```
path:   qa/bugs/BUG-{NNN}-{slug}.md
template: templates/bug-report-template.md
required_fields:
  - title: string
  - severity: critical | high | medium | low
  - steps_to_reproduce: [numbered steps]
  - expected_behavior: string
  - actual_behavior: string
  - environment: string
  - evidence: [screenshots, logs, network captures]
  - acceptance_criteria_violated: AC-NNN | null
```

**Severity classification:**

| Severity | Criteria | Release Impact |
|----------|---------|---------------|
| **Critical** | Data loss, security vulnerability, complete feature failure, system crash | Blocks release unconditionally |
| **High** | Core acceptance criterion not met, major UX failure, no workaround | Blocks release |
| **Medium** | Non-core functionality broken, workaround exists | PM must explicitly accept; tracked ticket required |
| **Low** | Minor UX issue, cosmetic, edge case with no user impact | Tracked in backlog; does not block |
| **Informational** | Observation or enhancement opportunity | Logged, does not block |

**Bug triage gate:**
- `pm-agent` must explicitly accept all Medium bugs that are being deferred
- No verbal acceptances — all deferrals documented in bug report

---

### STEP 09 — Quality Gate Verdict

**Agent:** `qa-agent`
**Time budget:** 1 hour

**Verdict decision tree:**

```
ANY critical bug open?
  YES → FAIL (unconditional)
  NO  ↓

ANY high bug open?
  YES → FAIL (unless PM formally accepts with documented rationale)
  NO  ↓

ALL P1 test cases passed?
  NO  → FAIL
  YES ↓

Regression suite passing?
  NO  → FAIL
  YES ↓

Performance within spec?
  NO  → FAIL (unless performance requirement was explicitly waived in PRD)
  YES ↓

Accessibility WCAG 2.1 AA met?
  NO  → FAIL (unless PM + ux-agent formally accept specific exceptions)
  YES ↓

PASS or CONDITIONAL_PASS
  Open medium bugs + PM acceptance → CONDITIONAL_PASS
  No open bugs beyond accepted deferrals → PASS
```

**Artifact:**
```
path:   qa/gates/{date}-{slug}-quality-gate.md
schema:
  verdict: PASS | CONDITIONAL_PASS | FAIL
  verdict_date: date
  
  test_execution_summary:
    total_cases: integer
    passed: integer
    failed: integer
    blocked: integer
  
  open_bugs:
    critical: integer
    high: integer
    medium: integer
    low: integer
  
  gates_checked:
    p1_tests_pass: true | false
    regression_clean: true | false
    performance_within_spec: true | false
    accessibility_wcag_aa: true | false
    security_reviewed: true | false
  
  # If CONDITIONAL_PASS:
  accepted_deferrals:
    - bug_id: BUG-NNN
      pm_acceptance: string   # PM rationale
      resolution_sprint: string
  
  # If FAIL:
  blocking_issues:
    - bug_id: BUG-NNN
      severity: string
      ac_violated: string
  
  performance_baseline:
    p50: float ms
    p99: float ms
    error_rate: float %
```

---

### STEP 10 — Gate Review

**Agent:** `supervisor-agent`
**Inputs:** Quality gate verdict (Step 09) + all QA artifacts

**Supervisor criteria:**

```
VERDICT INTEGRITY
  ✓ Verdict follows decision tree (not overridden by pressure)
  ✓ All critical/high bugs are either fixed or have blocking justification
  ✓ P1 test cases all accounted for (pass/fail/blocked)
  ✓ No acceptance criterion left untested

DOCUMENTATION QUALITY
  ✓ All failed test cases have bug reports
  ✓ Bug reports have reproduction steps (not just descriptions)
  ✓ Conditional deferrals have PM sign-off documented

PROCESS COMPLETENESS
  ✓ Regression testing executed
  ✓ Performance testing executed (or waiver documented)
  ✓ Accessibility tested (or waiver documented for non-UI changes)
```

**Verdict → Action:**
- `APPROVED (PASS)` → handoff to delivery-agent; release-workflow
- `APPROVED (CONDITIONAL_PASS)` → handoff to delivery-agent with open items tracked
- `APPROVED (FAIL)` → handoff to engineer-agent with bug reports
- `REJECTED` → qa-agent fixes specific issues with gate documentation

---

## Handoff Protocols

### QA → Delivery (PASS / CONDITIONAL_PASS)

```yaml
handoff:
  from: qa-workflow
  to: release-workflow

  verdict: PASS | CONDITIONAL_PASS
  gate_artifact: "qa/gates/{date}-{slug}-quality-gate.md"
  test_report: "qa/{date}-{slug}-test-plan.md"

  performance_baseline:
    p50: Xms
    p99: Xms
    error_rate: X%

  open_items:  # For CONDITIONAL_PASS only
    - bug_id: BUG-NNN
      severity: medium | low
      pm_accepted: true
      resolution_sprint: sprint-NN

  security_gate_status: "reviewed by security-agent | not_required"

  monitoring_recommendations:
    - "Watch {metric} closely post-deploy — edge case in {scenario}"
```

### QA → Engineering (FAIL)

```yaml
handoff:
  from: qa-workflow
  to: engineering-workflow

  verdict: FAIL
  gate_artifact: "qa/gates/{date}-{slug}-quality-gate.md"

  blocking_bugs:
    - bug_id: BUG-NNN
      severity: critical | high
      report: "qa/bugs/BUG-NNN-{slug}.md"
      ac_violated: AC-NNN
      reproduction: "qa/bugs/BUG-NNN-{slug}.md#steps"

  retest_scope:
    full_regression: true | false
    targeted: [TC-NNN]   # Only if full regression not needed

  explicitly_excluded:
    - "Re-testing features already marked PASS — unless fix touches shared code"
```

---

## Escalation Rules

| Condition | Escalation Target | Action |
|-----------|------------------|--------|
| > 30% P1 test cases fail in Step 03 | `engineer-agent` + `delivery-agent` | Stop test run; return build |
| Environment not ready after 2 hours | `engineer-agent` | Environment setup issue |
| Critical security bug found | `security-agent` | Immediate escalation; block release |
| PM refuses to formally accept FAIL bugs | `delivery-agent` + human | Manual review required |
| Supervisor rejects gate documentation | `qa-agent` | Fix documentation; re-submit |
| Performance regression > 50% | `engineer-agent` + `architect-agent` | Investigation before release |
| Regression introduces new failures | `engineer-agent` | Specific regression analysis |

---

## Wiki Updates Per Step

| Step | Wiki Page | Update Type |
|------|-----------|------------|
| 01 | (none — internal artifact) | |
| 09 | `qa/gates/{date}-{slug}-quality-gate.md` | Create gate verdict |
| 09 | `wiki/index.md` | Update Recently Updated |
| Post-PASS | `wiki/features/{slug}.md` | Add QA baseline to feature page |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| QA first-pass approval rate | > 70% (below = engineering quality issue) |
| Test coverage of acceptance criteria | 100% |
| Bugs found post-release per sprint | ≤ 1 medium, 0 critical/high |
| Regression suite pass rate | > 99% |
| Accessibility violations shipped to production | 0 critical/serious |
| QA cycle time (handoff to verdict) | ≤ 3 business days |
| Bug report completeness (has repro steps) | 100% |
