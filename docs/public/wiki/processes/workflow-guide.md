---
type: wiki
status: current
created: 2026-05-08
updated: 2026-05-08
---

# Workflow Guide

Human-readable guide to all enterprise workflows. For machine-executable specs, see `workflows/`.

---

## When to Use Each Workflow

### You have an idea but aren't sure it's worth building
→ **Product Discovery** (`workflows/product-discovery.md`)

The discovery workflow de-risks bets before engineering investment. It answers one question: is this problem real, does it matter enough, and can we plausibly win? Produces a GO/NO-GO decision with evidence. Takes 5–10 days.

**Don't skip this.** Jumping to building without discovery is the leading cause of features that ship to no users.

---

### You need to design the technical system
→ **Architecture Workflow** (`workflows/architecture-workflow.md`)

Takes an approved PRD and produces architecture decisions (ADRs), system design documents, API specs, and data models. Involves mandatory security review. Takes 2–5 days.

**ADRs are the output of this workflow.** No Tier-L engineering work begins without one.

---

### You're building it
→ **Engineering Workflow** (`workflows/engineering-workflow.md`)

Tier-based (XS/M/L) development process from work item to PR-ready code. Enforces test-driven development, security review for sensitive code, and code review gates. Timeline: XS (hours), M (2–5 days), L (5–15 days).

**Classify your tier first.** Tier determines the required process. Mismatch = risk.

---

### You're verifying it works
→ **QA Workflow** (`workflows/qa-workflow.md`)

Test plan creation through quality gate verdict. Tests every acceptance criterion, edge case, performance requirement, regression, and accessibility requirement. Takes 1–5 days.

**QA verdict drives the release decision.** Deadline pressure does not override a FAIL verdict.

---

### Something's broken in production
→ **Incident Workflow** (`workflows/incident-workflow.md`)

Prefix any message with `!incident` to trigger immediately. Covers detection, severity classification, investigation, fix/rollback, resolution, and post-mortem. P1 target: resolved in < 1 hour.

**Blameless post-mortems are required.** "Human error" is never a root cause.

---

### You're building a feature powered by AI/LLM
→ **AI Feature Workflow** (`workflows/ai-feature-workflow.md`)

Specialized workflow for AI-powered features. Adds: model selection, prompt architecture, AI threat modeling, evaluation framework design, iteration loops, human evaluation, staged rollout with quality gates. Takes 2–6 weeks.

**Evaluation framework must be designed before the first line of model code.** No exceptions.

---

## Workflow Interaction

These workflows are designed to chain together:

```
Idea
 ↓
Product Discovery → GO decision
 ↓
Feature Development workflow
 ├─ Architecture Workflow (embedded)
 ├─ Engineering Workflow (embedded)
 └─ QA Workflow (embedded)
     ↓
   PASS → Release Workflow → Production
     ↓ (if something breaks)
   Incident Workflow → Post-mortem → Action Items
     ↓ (systemic fixes)
   Architecture or Engineering Workflow
```

---

## Shared Workflow Rules (Apply to All)

1. **Every step produces an artifact** — no step is complete without a named file
2. **Gates block progression** — a step cannot proceed until its gate is passed
3. **Handoffs use the template** — `templates/handoff-template.md` for all inter-agent transitions
4. **Wiki is updated at workflow close** — decisions, learnings, and patterns are preserved
5. **Security issues escalate immediately** — regardless of which workflow is active
6. **Supervisor validates cross-org outputs** — supervisor-agent is the quality backstop

---

## Common Mistakes

| Mistake | Consequence | Prevention |
|---------|------------|-----------|
| Skipping discovery | Building something nobody wants | Require GO decision before PRD |
| Starting engineering without an ADR (Tier L) | Architecture drift, future rework | engineering-workflow blocks without ADR |
| Skipping QA under deadline | Bugs in production = incidents | QA gate is non-negotiable |
| Not doing staged rollout for AI features | Safety violations or quality failures in prod | ai-feature-workflow requires Phase 0 |
| Not writing a post-mortem | Repeat incidents | supervisor gate blocks incident closure |
| Writing "human error" as root cause | No systemic improvement | supervisor rejects this |
