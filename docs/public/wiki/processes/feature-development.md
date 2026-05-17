---
type: wiki
status: current
created: 2026-05-08
---

# How We Develop Features

A human-readable summary of our feature development process. For the machine-executable version, see `workflows/feature-development.md`.

---

## The Journey of a Feature

A feature starts as a problem and ends as a deployed, monitored capability. Here's the path:

### 1. Problem → PRD (PM Org)
A feature begins with a clearly articulated **problem**, not a solution. The PM:
- Gathers evidence (user research, data, support tickets)
- Writes a PRD with SMART success metrics
- Identifies acceptance criteria as testable user stories
- Gets PRD approved (supervisor gate)

**No engineering work starts before PRD approval.**

### 2. Design (Architecture + UX — parallel)
These happen simultaneously after PRD approval:

**Architecture** designs the technical system:
- System design document
- ADRs for significant technical decisions
- API contracts
- Security review

**UX** designs the user interface:
- User flow map
- UI specifications for all states
- Accessibility annotations
- Design system references

### 3. Build (Engineering)
Engineering implements against the approved:
- Technical spec (from architecture)
- Design spec (from UX)
- Acceptance criteria (from PRD)

Tests are written alongside code. No implementation is "done" without tests.

### 4. Quality Gate (QA)
QA verifies that what was built matches what was specified:
- Every acceptance criterion is tested
- Performance is benchmarked
- Regression suite passes
- Accessibility is checked

**If QA fails → back to engineering. Deadline pressure does not override QA.**

### 5. Security Review
Security verifies the release is safe to ship:
- OWASP Top 10 checked
- Dependency vulnerabilities scanned
- Authentication/authorization verified

### 6. Release
Delivery coordinates the actual deployment:
- Pre-release checklist verified
- Deployment executed in the correct window
- Post-deploy monitoring confirmed

### 7. Post-Release Review
48-72 hours after deployment:
- Success metrics reviewed
- User feedback synthesized
- Learnings documented in wiki

---

## Feature Sizing

Features are sized before sprint commitment:

| Size | Typical Scope | Sprint Slots |
|------|-------------|-------------|
| XS | Single UI change, config, copy | 0.5 days |
| S | Small feature, single component | 1-2 days |
| M | Feature with backend + frontend | 3-5 days |
| L | Feature spanning multiple systems | 1-2 weeks |
| XL | Major capability (multiple L features) | Multi-sprint |

XL features require their own discovery before entering the feature development workflow.

---

## Definition of Done

A feature is **done** when:
- [ ] All acceptance criteria from the PRD verified
- [ ] QA gate passed
- [ ] Security gate passed
- [ ] Feature deployed to production
- [ ] Analytics events firing
- [ ] Documentation updated
- [ ] Post-release monitoring active
- [ ] Wiki updated with any decisions or learnings

---

## Common Failure Modes

| Failure | Signal | Prevention |
|---------|--------|-----------|
| Scope creep | Implementation does more than spec | Engineer reads spec before coding; scope changes require PM approval |
| Design-dev mismatch | Implemented UI doesn't match spec | UX reviews implementation before QA |
| Missing edge cases | Bugs in error/empty states | QA tests all states; UX specifies all states |
| Missing tests | Bug regresses in next sprint | Tests written alongside code, not after |
| Late security review | Security issues delay release | Security reviews architecture, not just final code |
