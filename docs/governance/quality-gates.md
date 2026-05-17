# Quality Gates Reference

All quality gates in the Enterprise AI OS, their owners, criteria, and enforcement points.

---

## Gate Hierarchy

```
LEVEL 1: Self-check (agent validates own output)
LEVEL 2: Supervisor review (supervisor-agent validates)
LEVEL 3: Peer review (another agent validates)
LEVEL 4: Human review (human confirms)
```

Higher levels are reserved for higher-risk transitions.

---

## Gate Definitions

### G1: PRD Approval Gate
**Level:** 2 (Supervisor)
**Trigger:** pm-agent completes PRD
**Owner:** supervisor-agent
**Blocks:** Architecture start, UX start

**Criteria:**
- [ ] Problem statement is evidence-backed
- [ ] Success metrics are SMART
- [ ] All acceptance criteria are testable user stories
- [ ] Out-of-scope section exists and is specific
- [ ] Dependencies identified
- [ ] Open questions listed
- [ ] No placeholder text

---

### G2: Architecture Gate
**Level:** 2 (Supervisor)
**Trigger:** architect-agent completes system design
**Owner:** supervisor-agent
**Blocks:** Engineering start

**Criteria:**
- [ ] ADRs written for all significant decisions
- [ ] All acceptance criteria from PRD have a technical approach
- [ ] Security review complete or explicitly deferred with justification
- [ ] Operational concerns (monitoring, alerting, deployment) specified
- [ ] API contracts fully specified (no TBDs)

---

### G3: Security Gate (Design Stage)
**Level:** 3 (security-agent peer review)
**Trigger:** Architecture design submitted to security-agent
**Owner:** security-agent
**Blocks:** Architecture gate (G2)

**Criteria:**
- [ ] STRIDE threat model complete
- [ ] No critical security architecture flaws
- [ ] Required security controls identified and accepted by architect-agent

---

### G4: UX Design Gate
**Level:** 2 (Supervisor)
**Trigger:** ux-agent completes design spec
**Owner:** supervisor-agent
**Blocks:** Engineering start (for UI work)

**Criteria:**
- [ ] All user flow steps covered
- [ ] All UI states specified (default, loading, error, empty, success)
- [ ] Accessibility annotations present
- [ ] Design system tokens referenced
- [ ] Mobile + desktop viewpoints (if web)
- [ ] Content in design (not lorem ipsum)

---

### G5: QA Gate
**Level:** 2 (Supervisor, for PASS/FAIL) + 4 (Human, for CONDITIONAL)
**Trigger:** qa-agent completes testing
**Owner:** qa-agent (initial), supervisor-agent (review)
**Blocks:** Security gate (G6), Release

**Criteria for PASS:**
- [ ] All acceptance criteria tested and passing
- [ ] No critical or high bugs open
- [ ] Regression suite passing
- [ ] Performance within spec
- [ ] Accessibility WCAG 2.1 AA passing

**Criteria for CONDITIONAL_PASS (with PM approval):**
- All critical flows working
- Only medium/low bugs open with tracked tickets
- PM explicitly signed off on each deferred issue

---

### G6: Security Gate (Release Stage)
**Level:** 3 (security-agent)
**Trigger:** QA gate passed; pre-release security review
**Owner:** security-agent
**Blocks:** Release

**Criteria:**
- [ ] No critical or high security findings
- [ ] Dependency scan: no critical CVEs
- [ ] Authentication/authorization verified in implementation
- [ ] No credentials/secrets in code or artifacts
- [ ] Compliance requirements met (GDPR, SOC2 as applicable)

---

### G7: Pre-Release Checklist Gate
**Level:** 4 (Human)
**Trigger:** All prior gates passed
**Owner:** delivery-agent (compiles) + human (confirms)
**Blocks:** Production deployment

**Criteria:** See `workflows/release-workflow.md` pre-release checklist

---

### G8: Post-Incident Review Gate
**Level:** 2 (Supervisor)
**Trigger:** Incident resolved; post-mortem written
**Owner:** supervisor-agent
**Blocks:** Incident closure

**Criteria:**
- [ ] Root cause identified (not "unknown" or "human error")
- [ ] All action items have owners and due dates
- [ ] Runbooks updated
- [ ] Monitoring gaps addressed
- [ ] Post-mortem written to template

---

## Gate Exception Policy

Any gate may be bypassed in a documented exception, except:
- **G6 (Security - Release)** for Critical findings: no exceptions
- **G3 (Security - Design)** when system handles PII: no exceptions

Exception documentation required at: `wiki/decisions/gate-exceptions.md`

---

## Gate Performance Metrics

Track these to improve the process:

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| G1 (PRD) first-pass approval rate | > 80% | < 60% |
| G5 (QA) first-pass approval rate | > 75% | < 50% |
| Average cycles per gate | < 1.5 | > 2.5 |
| Time from QA pass to Release | < 3 days | > 7 days |
