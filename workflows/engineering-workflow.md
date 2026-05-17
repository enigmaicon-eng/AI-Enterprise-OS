# Engineering Workflow

```
workflow_id:    engineering-workflow
version:        1.0.0
trigger:        "implement", "build this", "code this", "fix bug", "refactor", "code review", work item assigned to engineering
intent_class:   ENG
total_steps:    varies by tier (XS: 5, M: 9, L: 12)
typical_duration: XS: hours, M: 2–5 days, L: 5–15 days
state_file:     memory/workflow-state/eng-{slug}.yaml
```

---

## Purpose

Translate technical specifications into production-quality, tested, documented code. Enforce tier-based process discipline to match rigor to risk. Ensure no production code ships without quality gates.

**Rules:**
- Every work item is classified into a tier before any code is written
- Tier L work requires an accepted ADR before coding begins
- No PR merges without test coverage ≥ 80% on new code
- Security-sensitive code requires `security-agent` review regardless of tier

---

## Routing Entry Points

```
IF work_item.tier == XS
  THEN → XS Path (Steps 01, 02, 03, 07, 09)

IF work_item.tier == M
  THEN → M Path (Steps 01–09)

IF work_item.tier == L
  THEN → L Path (all Steps 01–12)

IF work_item.type == bug AND severity == P1 or P2
  THEN → incident-response workflow (bypasses this workflow)

IF work_item has no tier classification
  THEN → Step 01 (classification required before any other step)

IF incoming from architecture-workflow
  THEN → Start at Step 02 (intake done; ADR exists)
```

**Tier classification rules (from `claude-dev-workflow`):**

| Characteristic | XS | M | L |
|---------------|-----|---|---|
| Scope | Single file, config, copy | Single service/component | Multi-service, schema, auth |
| ADR required | No | No | Yes |
| Security review required | No | Maybe | Yes |
| Staged rollout required | No | No | Yes |
| Test requirement | Existing tests pass | 80% coverage on new code | 80% + integration tests |
| Estimated effort | < 4 hours | 1–5 days | 5+ days |

---

## XS Path (Bug Fixes, Config, Copy Changes)

```
STEP 01  engineer-agent   Classify & Validate XS
STEP 02  engineer-agent   Implement Fix
STEP 03  engineer-agent   Self-Review & Test Verification
STEP 07  engineer-agent   PR Preparation
STEP 09  qa-agent         Smoke Test (abbreviated)
                          → PASS: merge
                          → FAIL: back to Step 02
```

**XS gate (all must pass before PR):**
- [ ] Fix is demonstrably XS scope (< 4 hours, single file/config)
- [ ] Existing tests still pass
- [ ] No new behavior added (pure fix)
- [ ] PR description explains what changed and why

---

## M Path (Standard Features & Refactors)

```
STEP 01  engineer-agent               Intake & Tier Classification
STEP 02  engineer-agent               Technical Brief & Planning
STEP 03  engineer-agent               Test Design (TDD)
STEP 04  engineer-agent               Implementation
STEP 05  engineer-agent               Self-Review
STEP 06  engineer-agent / architect   Code Review
STEP 07  engineer-agent               PR Preparation
STEP 08  docs-agent                   Documentation Update
STEP 09  qa-agent                     QA Handoff
```

---

## L Path (Architecture Changes, Security, Migrations)

```
STEP 01   engineer-agent               Intake & Tier Classification
STEP 01L  architect-agent              ADR Confirmation (must exist)
STEP 02   engineer-agent               Technical Brief & Planning
STEP 02L  engineer-agent               Implementation Plan (detailed steps)
STEP 03   engineer-agent               Test Design (comprehensive)
STEP 04   engineer-agent               Implementation
STEP 05   engineer-agent               Self-Review
STEP 05L  security-agent               Security Code Review
STEP 06   architect-agent              Architecture Review of Implementation
STEP 07   engineer-agent               PR Preparation
STEP 08   docs-agent                   Documentation Update
STEP 09   qa-agent                     QA Handoff (full test plan)
STEP 10   delivery-agent               Staged Rollout Planning
```

---

## Step Specifications (M + L unless noted)

---

### STEP 01 — Intake & Tier Classification

**Agent:** `engineer-agent`
**Time budget:** 30 minutes

**Instructions:**
1. Read the work item (ticket, handoff envelope, or direct request)
2. Load relevant artifacts:
   - PRD acceptance criteria (if from feature-development workflow)
   - ADR (if from architecture-workflow)
   - Bug report with reproduction steps (if bug fix)
3. Classify the tier using the table above
4. If classification is ambiguous: default to the HIGHER tier
5. If Tier L: verify ADR exists and is `accepted` status before proceeding
6. Identify: which existing systems/services does this touch?
7. Identify security sensitivity:
   - `HIGH` — touches auth, payments, PII, secrets management
   - `MEDIUM` — new external-facing API, data model change
   - `LOW` — internal-only, no sensitive data

**Artifact:**
```
path:   implementation/{date}-{slug}-intake.md
schema:
  work_item_id: string
  work_item_type: feature | bug | refactor | tech_debt | migration
  tier: XS | M | L
  tier_rationale: string
  security_sensitivity: HIGH | MEDIUM | LOW
  input_artifacts:
    prd: path | null
    adr: path | null
    bug_report: path | null
    design_spec: path | null
  systems_touched: [string]
  adr_confirmed: true | false | null  # null for non-L
  estimated_effort_hours: integer
```

**Gate (self-check):**
- [ ] Tier classified with explicit rationale
- [ ] If Tier L: ADR confirmed accepted before proceeding
- [ ] Input artifacts loaded and readable
- [ ] Security sensitivity assessed

**Escalation:**
- If Tier L but no ADR exists → block; escalate to `architect-agent` (architecture-workflow)
- If security_sensitivity HIGH and not already flagged → notify `security-agent` now

---

### STEP 01L — ADR Confirmation (L Path only)

**Agent:** `architect-agent`
**Time budget:** 30 minutes

**Instructions:**
1. Confirm the ADR referenced in the intake is:
   - Status: `accepted` (not `proposed` or `draft`)
   - Complete enough for engineering to implement from
   - Does not conflict with other accepted ADRs
2. If ADR is incomplete, return to architecture-workflow before allowing engineering to start
3. Issue explicit "architecture-approved-to-implement" signal

**Gate:**
- [ ] ADR status is `accepted`
- [ ] ADR content sufficient for implementation (no TBDs in critical sections)
- [ ] No conflicts with other accepted ADRs

**Escalation:**
- If ADR has TBDs → send back to `architect-agent`; engineering waits

---

### STEP 02 — Technical Brief & Planning

**Agent:** `engineer-agent`
**Time budget:** 2–4 hours (M), 4–8 hours (L)

**Instructions (using `superpowers` brainstorm-design-plan methodology):**

**Brainstorm phase:**
1. List all implementation approaches (even if quickly discarded)
2. Identify potential complications or unknowns
3. Consider: what could go wrong in production?

**Design phase:**
1. Select implementation approach aligned with ADR/spec
2. Map the code changes:
   - Which files will be created?
   - Which files will be modified?
   - What new dependencies (if any)?
3. Define the data structures/interfaces needed
4. Design error handling strategy:
   - What can fail?
   - What should happen in each failure case?
   - What should be logged?

**Plan phase:**
1. Break implementation into discrete, testable units of work
2. Sequence: unit 1 → unit 2 → ... (each independently testable)
3. Estimate: hours per unit

**Artifact:**
```
path:   implementation/{date}-{slug}-tech-brief.md
schema:
  approach_selected: string
  rationale: string
  code_changes:
    files_created: [string]
    files_modified: [string]
    dependencies_added: [string]
  data_structures: [string]
  error_handling_strategy: string
  implementation_plan:
    - unit: string
      description: string
      estimated_hours: integer
      test_approach: string
  risks: [string]
  questions_for_architect: [string]
```

**Gate (checklist):**
- [ ] Implementation aligns with ADR/spec (not a creative reinterpretation)
- [ ] Error handling designed (not an afterthought)
- [ ] Implementation broken into testable units
- [ ] New dependencies reviewed (not blindly added)

---

### STEP 02L — Implementation Plan (L Path only)

**Agent:** `engineer-agent`
**Time budget:** 4–8 hours additional

**For Tier L, the implementation plan must include:**
1. Database migration steps (if applicable):
   - Migration file naming and sequencing
   - Rollback procedure
   - Production data impact assessment
2. Deployment steps:
   - Which environments in which order
   - Feature flag configuration (if applicable)
   - Dependencies that must deploy first
3. Staged rollout plan:
   - Phase 1 (internal/canary): what % of traffic, for how long
   - Phase 2 (expanded): criteria for advancing
   - Phase 3 (full rollout): criteria for full deployment
4. Rollback plan:
   - Trigger conditions
   - Rollback steps
   - Data integrity preservation

**Artifact:**
```
path:   implementation/{date}-{slug}-deployment-plan.md
schema:
  migration_plan: null | {steps, rollback_steps, data_impact}
  deployment_sequence: [string]
  staged_rollout:
    phase_1: {scope, duration, success_criteria}
    phase_2: {scope, duration, success_criteria}
    phase_3: {scope}
  rollback_plan:
    triggers: [string]
    steps: [string]
    data_rollback: string | "not_applicable"
  feature_flags: [{flag_name, default, enable_condition}] | []
```

---

### STEP 03 — Test Design (TDD)

**Agent:** `engineer-agent`
**Time budget:** 1–2 hours (M), 2–4 hours (L)
**Rule:** Tests are designed BEFORE implementation. Not after.

**Instructions:**
1. For every acceptance criterion in the PRD → write at least one test case
2. For every function/method to be implemented:
   - Happy path test
   - At least 2 edge cases
   - At least 1 error/failure case
3. Define the test structure:
   - Unit tests: what units, what mocking strategy
   - Integration tests: what system boundaries are crossed?
   - E2E tests: what user journeys need coverage? (Keep minimal)
4. Write test skeletons (failing tests that define the contract)

**Test coverage targets:**
- New code: ≥ 80% line coverage
- New business logic: ≥ 95% branch coverage
- All acceptance criteria: 100% test coverage

**Artifact:**
```
path:   implementation/{date}-{slug}-test-design.md
schema:
  unit_tests:
    - function: string
      cases: [{description, inputs, expected_output, type: happy|edge|error}]
  integration_tests:
    - boundary: string
      test_cases: [string]
  e2e_tests:
    - journey: string
      steps: [string]
  coverage_targets:
    line: ">= 80%"
    branch_business_logic: ">= 95%"
    acceptance_criteria: "100%"
  mocking_strategy: string
```

---

### STEP 04 — Implementation

**Agent:** `engineer-agent`
**Time budget:** Variable (per Step 02 plan)

**Instructions:**
1. Follow the implementation plan from Step 02 unit by unit
2. Write each unit → run its tests → all green before next unit
3. Code quality non-negotiables:
   - No hardcoded secrets or credentials
   - No `any` types (TypeScript) / untyped parameters
   - No silent exception swallowing (catch → log → rethrow or handle)
   - No `console.log` / `print` debug statements left in
   - No commented-out code
   - Structured logging with correlation IDs
4. Security checks during implementation:
   - All user inputs validated at entry points
   - Parameterized queries (no string concatenation with SQL)
   - Output encoding appropriate for context
5. After each unit: run full test suite (not just new tests)

**Code review pre-checklist (self-applied before Step 05):**
- [ ] All acceptance criteria implemented
- [ ] All tests passing (unit + integration)
- [ ] Coverage target met
- [ ] No debug code / hardcoded values
- [ ] Error paths handled and logged
- [ ] No new linter errors introduced

---

### STEP 05 — Self-Review

**Agent:** `engineer-agent`
**Time budget:** 1–2 hours

**Instructions:**
Read your own code as if you are the reviewer. Apply the following:

1. **Correctness:** Does this actually do what the spec says?
2. **Completeness:** Every acceptance criterion addressed?
3. **Security:** Run through OWASP Top 10 mentally for your changes
4. **Tests:** Would these tests actually catch a regression?
5. **Performance:** Are there N+1 queries, unnecessary loops, blocking operations?
6. **Operability:** Is there enough logging to debug an issue in production at 3am?
7. **Reversibility (L only):** Can this be safely rolled back?

**Document findings:** List everything you found and fixed in the PR description.

---

### STEP 05L — Security Code Review (L Path + HIGH sensitivity)

**Agent:** `security-agent`
**Time budget:** 4–8 hours
**Trigger:** Tier L OR security_sensitivity == HIGH (from Step 01)

**Instructions:**
1. Review implementation against the security controls specified in the ADR / architecture threat model
2. Run through OWASP Top 10 for the language/framework in use:
   - Injection (SQL, command, LDAP, XML)
   - Broken authentication
   - Sensitive data exposure
   - XML external entities
   - Broken access control
   - Security misconfiguration
   - XSS
   - Insecure deserialization
   - Known vulnerable components
   - Insufficient logging and monitoring
3. Check: are all required security controls from the ADR actually implemented?
4. Check: are there any new attack vectors introduced?

**Artifact:**
```
path:   qa/security/{date}-{slug}-code-security.md
schema:
  scope: [files_reviewed]
  owasp_check:
    - category: string
      status: pass | fail | not_applicable
      findings: [string]
  adr_security_controls_implemented: [{control, implemented: true|false}]
  new_attack_vectors: [string]
  verdict: approved | conditional | blocked
  required_fixes: [string]  # If conditional or blocked
```

**Gate:**
- [ ] All OWASP categories reviewed
- [ ] All ADR security controls verified as implemented
- [ ] Verdict issued with no ambiguity

**Escalation:**
- Any `blocked` verdict → engineering halts, fixes required, re-review
- Critical security finding → escalate immediately to human review

---

### STEP 06 — Code Review

**Agent:** `engineer-agent` (peer) OR `architect-agent` (for Tier L / architectural changes)
**Time budget:** 1–4 hours

**Reviewer assignment:**
- XS/M: Peer engineer reviews
- L or cross-service: `architect-agent` reviews architecture compliance
- HIGH security sensitivity: `security-agent` co-reviews (already done in Step 05L)

**Code review criteria:**

```
CORRECTNESS
  □ Implementation matches spec/ADR
  □ Business logic is correct
  □ Edge cases handled

QUALITY
  □ Code is readable (would I understand this in 6 months?)
  □ Naming is descriptive
  □ No unnecessary complexity
  □ No speculative generality (only what spec requires)

TESTS
  □ Tests actually test behavior (not just calling functions)
  □ Test names describe the scenario
  □ No test implementation details leaking into tests

SECURITY (reviewer judgment)
  □ No obvious security gaps (deep review done in Step 05L)

OPERATIONS
  □ Sufficient logging for production debugging
  □ Performance acceptable (no N+1, no blocking operations)
```

**Artifact:**
```
path:   implementation/{date}-{slug}-code-review.md
schema:
  reviewer: string
  review_date: date
  findings:
    - type: blocking | non_blocking | suggestion
      location: "file:line"
      finding: string
      required_action: string
  verdict: approved | changes_requested
```

**Gate:**
- [ ] No blocking findings remain
- [ ] Reviewer verdict: `approved`
- [ ] Architect sign-off (L path only)

---

### STEP 07 — PR Preparation

**Agent:** `engineer-agent`
**Time budget:** 30 minutes

**PR description must contain:**

```markdown
## What Changed
[Concise description of the implementation]

## Why
[Reference to PRD / ADR / bug report]

## Acceptance Criteria
- [x] AC-01: [criterion] — [verified by: test name]
- [x] AC-02: [criterion] — [verified by: test name]

## Test Coverage
- Unit: X%
- Integration: covered / not applicable
- E2E: covered (critical paths) / not applicable

## Deployment Notes (L Path)
[Any migration steps, feature flags, staged rollout]

## Security
- Security review: [approved by security-agent / not required]
- Security sensitivity: HIGH / MEDIUM / LOW

## Rollback Plan (L Path)
[How to roll this back]
```

**Gate (checklist):**
- [ ] PR description complete
- [ ] All acceptance criteria checked off
- [ ] Coverage percentage reported
- [ ] Linked to work item / PRD / ADR
- [ ] No conflict markers in code
- [ ] Branch is up to date with main/trunk

---

### STEP 08 — Documentation Update

**Agent:** `docs-agent`
**Time budget:** 1–4 hours
**Trigger:** Always for new public APIs or new features; conditional for refactors

**Instructions from `engineer-agent` handoff:**
1. Update README if setup steps changed
2. Update API docs (OpenAPI spec) if API changed
3. Create/update runbook in `wiki/runbooks/` if new operational concern introduced
4. Update CHANGELOG.md following Keep-a-Changelog format
5. Update architecture docs if component topology changed

**Gate (checklist):**
- [ ] README reflects current state
- [ ] API docs match implementation
- [ ] CHANGELOG entry created
- [ ] Runbook created/updated if operational change

---

### STEP 09 — QA Handoff

**Agent:** `engineer-agent` → `qa-agent`
**Time budget:** 30 minutes to hand off; QA execution time separate (qa-workflow)

**Handoff envelope:**
```yaml
handoff:
  from: engineering-workflow
  to: qa-workflow
  step: STEP-09

  implementation_summary: string
  acceptance_criteria:
    - id: AC-01
      description: string
      implemented: true | false
      test_coverage: "test-name"
  
  test_coverage:
    unit: "X%"
    integration: "covered | partial | not_applicable"
  
  known_limitations: [string]    # Things not done in this PR
  
  setup_instructions: string     # How to run locally for QA
  
  environment: staging | feature_branch
  branch: string
  
  security_review_status: "approved by security-agent" | "not_required"
  
  explicitly_excluded:
    - "Performance testing (separate ticket)"
    - "Accessibility (not applicable for this backend change)"
```

---

### STEP 10 — Staged Rollout Planning (L Path only)

**Agent:** `delivery-agent`
**Time budget:** 2 hours
**Inputs:** Deployment plan from Step 02L, PR approved from Step 07

**Instructions:**
1. Confirm all gates passed: QA, security, architecture
2. Set feature flag configuration for staged rollout
3. Define monitoring thresholds for each rollout phase:
   - P99 latency increase > X% → halt and investigate
   - Error rate > Y% → immediate rollback trigger
4. Schedule each rollout phase with monitoring windows
5. Identify on-call engineer for each phase

**Gate:**
- [ ] All required gates passed before rollout begins
- [ ] Monitoring thresholds defined
- [ ] Rollback triggers defined
- [ ] On-call engineer confirmed

---

## Escalation Rules

| Condition | Escalation Target | Action |
|-----------|------------------|--------|
| Tier L work attempted without accepted ADR | `architect-agent` | Block; run architecture-workflow |
| Security code review blocked | Human review | Engineering halts until resolved |
| Test coverage < 80% on new code | `engineer-agent` | Cannot merge; fix tests |
| Code review has blocking findings | `engineer-agent` | Fix findings; re-review |
| L Path deployment triggers rollback condition | `delivery-agent` + on-call | Execute rollback plan |
| Engineer stuck > 24h on an item | `delivery-agent` | Blocker flagged in daily standup |
| Security sensitivity HIGH but no security review done | `security-agent` | Block merge; require review |

---

## Handoff Protocols Summary

```
engineering-workflow → qa-workflow
  Trigger: Step 09
  Artifact: implementation/{date}-{slug}-intake.md + PR

engineering-workflow → docs-agent (Step 08)
  Trigger: New public API or feature complete

engineering-workflow → delivery-agent (L Path, Step 10)
  Trigger: All gates passed, ready for staged rollout

engineering-workflow ← architecture-workflow
  Trigger: ADR accepted; Step 02 of engineering starts
```

---

## Wiki Updates Per Step

| Step | Wiki Page | Update |
|------|-----------|--------|
| 01L | `architecture/decisions/ADR-NNN.md` | Confirm status `accepted` |
| 07 | `implementation/{slug}-notes.md` | Create implementation notes |
| 08 | `wiki/runbooks/{slug}.md` | Create/update runbook |
| 08 | `docs/api/{slug}.md` | Update API docs |
| Post-merge | `wiki/features/{slug}.md` | Create feature wiki entry |

---

## Quality Metrics

| Metric | Target |
|--------|--------|
| Tier L work started without ADR | 0 |
| PR first-pass code review approval | > 70% |
| Test coverage < 80% on merge | 0 |
| Security findings in post-release review | 0 critical/high |
| Cycle time: ticket assigned → PR merged | XS < 1d, M < 3d, L < 10d |
