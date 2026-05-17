# Feature Development Workflow

**Workflow ID:** `feature-development`
**Org Sequence:** PM → ARCH → UX → ENG → QA → SECURITY → DELIVERY
**Typical Duration:** 1-4 sprints depending on complexity
**Trigger:** Approved feature request or roadmap item

---

## Overview

This is the primary workflow for shipping new product features. It enforces artifact-driven handoffs between every organization, ensuring each org receives exactly what it needs and produces exactly what the next org requires.

```
[Trigger]
    │
    ▼
STEP 01: Discovery & PRD (PM)
    │  Gate: PRD approved
    ▼
STEP 02a: Architecture Design (ARCH) ──┐
STEP 02b: UX Design (UX)              │ Parallel
    │  Gate: Both approved             │
    └──────────────────────────────────┘
    ▼
STEP 03: Implementation (ENG)
    │  Gate: Code complete, tests passing
    ▼
STEP 04: QA Testing (QA)
    │  Gate: QA verdict PASS or CONDITIONAL_PASS
    ▼
STEP 05: Security Review (SECURITY)
    │  Gate: Security verdict approved
    ▼
STEP 06: Release (DELIVERY)
    │  Gate: Pre-release checklist complete
    ▼
STEP 07: Post-Release Review (PM + ANALYTICS)
    │
    ▼
[Close: Wiki + Memory updated]
```

---

## Step Definitions

### STEP 01: Discovery & PRD
**Agent:** `pm-agent`
**Inputs:** Feature request, business context, user research
**Instructions:**
- Interview stakeholders to understand the problem
- Research competitive landscape if needed
- Apply RICE/ICE scoring to confirm prioritization
- Write PRD using `templates/prd-template.md`
- Define success metrics (coordinate with analytics-agent if needed)
- Get stakeholder review

**Output:** `prds/<date>-<slug>.md`

**Gate (checklist):**
- [ ] Problem statement is evidence-backed
- [ ] Success metrics are SMART
- [ ] Acceptance criteria are written as testable user stories
- [ ] Out-of-scope section exists
- [ ] Dependencies identified
- [ ] No placeholders remaining

---

### STEP 02a: Architecture Design
**Agent:** `architect-agent`
**Inputs:** Approved PRD, existing architecture context
**Instructions:**
- Review PRD and identify technical implications
- Design system components needed
- Write ADR for any significant technical decisions
- Define API contracts if applicable
- Review with security-agent for threat considerations

**Output:** `architecture/<slug>.md` + `architecture/decisions/ADR-<NNN>.md` (if decisions needed)

**Gate (agent-review):**
- Reviewer: `supervisor-agent`
- [ ] All acceptance criteria have a technical approach
- [ ] ADRs written for significant decisions
- [ ] Security considerations addressed
- [ ] Operational concerns (monitoring, alerting) specified

---

### STEP 02b: UX Design
**Agent:** `ux-agent`
**Inputs:** Approved PRD, design system context, brand guidelines
**Instructions:**
- Map user flow for the feature
- Design all UI states (default, loading, error, empty, success)
- Apply design system tokens
- Verify accessibility compliance
- Write design spec for engineering

**Output:** `implementation/design-specs/<slug>.md` + `implementation/user-flows/<slug>.md`

**Gate (checklist):**
- [ ] All user flow steps designed
- [ ] All UI states specified
- [ ] Accessibility annotations present
- [ ] Design system tokens referenced
- [ ] Mobile and desktop covered (if web)

---

### STEP 03: Implementation
**Agent:** `engineer-agent`
**Inputs:** Architecture docs, design specs, approved PRD
**Tier:** M (standard feature) or L (architectural change)
**Instructions:**
- Follow `claude-dev-workflow` tier protocol
- Implement per architecture spec
- Match design spec exactly
- Write unit + integration tests
- Write PR description

**Output:** Code (PR) + `implementation/<slug>-notes.md`

**Gate (checklist):**
- [ ] All acceptance criteria from PRD implemented
- [ ] Test coverage ≥ 80% on new code
- [ ] Design spec implemented accurately
- [ ] No placeholders or TODOs in production code
- [ ] PR description complete

---

### STEP 04: QA Testing
**Agent:** `qa-agent`
**Inputs:** Implementation, PRD acceptance criteria, design spec
**Instructions:**
- Write test plan covering all acceptance criteria
- Run functional tests
- Run regression suite
- Run performance benchmarks
- Run accessibility tests
- Issue verdict

**Output:** `qa/<date>-<slug>-qa-report.md` + `qa/gates/<date>-<slug>.md`

**Gate (agent-review):**
- Reviewer: `supervisor-agent`
- [ ] All acceptance criteria tested
- [ ] No critical or high bugs open
- [ ] Regression suite passing
- [ ] Performance within spec

---

### STEP 05: Security Review
**Agent:** `security-agent`
**Inputs:** Architecture docs, implementation, QA report
**Instructions:**
- Run STRIDE threat model on new components
- Review implementation for OWASP Top 10
- Check dependency vulnerabilities
- Issue security gate verdict

**Output:** `qa/security/<date>-<slug>-security-review.md`

**Gate (agent-review):**
- Reviewer: `supervisor-agent`
- [ ] No critical or high security findings open
- [ ] STRIDE threat model complete
- [ ] Authentication/authorization verified

---

### STEP 06: Release
**Agent:** `delivery-agent`
**Inputs:** QA gate, security gate, feature artifacts
**Instructions:**
- Verify all gates passed
- Complete pre-release checklist
- Coordinate deployment
- Write release notes
- Monitor post-deploy

**Output:** `release/releases/<date>-<slug>.md`

**Gate (human-review):**
- Prompt: "Pre-release checklist complete. Confirm to proceed with deployment."

---

### STEP 07: Post-Release Review
**Agent:** `pm-agent` + `analytics-agent`
**Inputs:** Release summary, analytics data (48h post-deploy)
**Instructions:**
- Review success metrics vs. targets
- Synthesize user feedback if any
- Identify follow-up actions
- Update roadmap
- Write wiki entry with learnings

**Output:** `wiki/features/<slug>-review.md`

**Gate (checklist):**
- [ ] Success metrics reviewed
- [ ] Learnings documented
- [ ] Follow-up items in backlog

---

## Workflow Artifacts Map

```
prds/<date>-<slug>.md                          ← Step 01
architecture/<slug>.md                          ← Step 02a
architecture/decisions/ADR-NNN.md              ← Step 02a (if needed)
implementation/design-specs/<slug>.md          ← Step 02b
implementation/user-flows/<slug>.md            ← Step 02b
implementation/<slug>-notes.md                 ← Step 03
qa/<date>-<slug>-qa-report.md                  ← Step 04
qa/gates/<date>-<slug>.md                      ← Step 04
qa/security/<date>-<slug>-security-review.md   ← Step 05
release/releases/<date>-<slug>.md              ← Step 06
wiki/features/<slug>-review.md                 ← Step 07
```

---

## Workflow State

Written to: `memory/workflow-state/feature-dev-<slug>.yaml`
