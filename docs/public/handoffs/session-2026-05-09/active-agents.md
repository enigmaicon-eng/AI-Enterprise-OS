---
type: agent-status
as-of: 2026-05-09
---

# Active Agents

Status of all 10 custom agent definitions. Each agent is defined as a markdown file in `agents/`. None have run a live task yet — all are in `ready` state.

---

## Agent Status Overview

| Agent | File | Status | First Real Task |
|-------|------|--------|----------------|
| pm-agent | `agents/pm-agent.md` | Ready | Product discovery on first initiative |
| architect-agent | `agents/architect-agent.md` | Ready | ADR-001 after Q-001 is answered |
| engineer-agent | `agents/engineer-agent.md` | Ready | First L-tier implementation |
| qa-agent | `agents/qa-agent.md` | Ready | QA plan for first feature |
| security-agent | `agents/security-agent.md` | Ready | Security review during architecture phase |
| analytics-agent | `agents/analytics-agent.md` | Ready | Metrics framework for first feature |
| delivery-agent | `agents/delivery-agent.md` | Ready | Sprint 001 planning |
| docs-agent | `agents/docs-agent.md` | Ready | Runbook creation before first release |
| strategist-agent | `agents/strategist-agent.md` | Ready | Positioning brief during discovery |
| ux-agent | `agents/ux-agent.md` | Ready | UX brief during architecture phase |

**Status definitions:**
- `ready` — definition exists; never run a real task
- `calibrating` — first task in progress; outputs being validated
- `active` — running a workflow step
- `blocked` — waiting on input or upstream dependency
- `idle` — no current task assigned

---

## Agent Definitions

### pm-agent

**File:** `agents/pm-agent.md`
**Identity:** FAANG-grade PM with operational authority over product direction
**Key frameworks:** RICE prioritization, JTBD, Lean Startup, Story Mapping, PMF (Sean Ellis 40% threshold), April Dunford positioning, OKR, Kano
**Handoff inputs from:** strategist-agent, analyst data, user research
**Handoff outputs to:** architect-agent (approved PRD), ux-agent (UX brief), analytics-agent (metrics framework)
**Known limitation:** Requires human product owner approval for PRD; cannot approve its own outputs

---

### architect-agent

**File:** `agents/architect-agent.md`
**Identity:** Principal architect with authority over system design
**Key capabilities:** ADR decision protocol, design principles (6, ordered by precedence), architecture review checklist (scalability/reliability/security/operability/cost)
**Handoff inputs from:** pm-agent (approved PRD), engineer-agent (feasibility concern)
**Handoff outputs to:** engineer-agent (accepted ADR), security-agent (design for threat model)
**Known limitation:** L-tier decisions require architectural review meeting before ADR is finalized; architect alone cannot rubber-stamp

---

### engineer-agent

**File:** `agents/engineer-agent.md`
**Identity:** Senior engineer with full-stack implementation authority
**Key capabilities:** XS/M/L tier classification, TDD-first development, superpowers subagent integration for M/L tasks, OWASP Top 10 per language
**Handoff inputs from:** architect-agent (ADR), qa-agent (bug reports), security-agent (vulnerability reports)
**Handoff outputs to:** qa-agent (PR-ready code), delivery-agent (merge confirmation)
**Known limitation:** L-tier work requires accepted ADR — will not proceed without it; superpowers integration untested

---

### qa-agent

**File:** `agents/qa-agent.md`
**Identity:** QA engineer with release gate authority
**Key capabilities:** Testing pyramid (unit 60–70% / integration 20–30% / E2E 5–10%), PASS/CONDITIONAL/FAIL verdict, bug severity triage (Critical/High/Medium/Low)
**Handoff inputs from:** engineer-agent (code + implementation plan)
**Handoff outputs to:** delivery-agent (PASS verdict), engineer-agent (FAIL verdict + bug list)
**Known limitation:** Cannot issue PASS verdict on a feature with open Critical or High bugs — period, no exceptions

---

### security-agent

**File:** `agents/security-agent.md`
**Identity:** Principal security engineer with veto authority on security issues
**Key capabilities:** STRIDE threat modeling, full security review checklist, CVSS vulnerability severity, non-negotiable blockers list
**Handoff inputs from:** architect-agent (design), engineer-agent (code for review)
**Handoff outputs to:** architect-agent (threat model), delivery-agent (security approval)
**Known limitation:** Any security issue classified as CRITICAL or HIGH is a hard block — security-agent cannot waive this; only human operator with documented risk acceptance can

---

### analytics-agent

**File:** `agents/analytics-agent.md`
**Identity:** Analytics engineer with metrics authority
**Key capabilities:** 3-layer metrics framework (north star/drivers/guardrails), event taxonomy schema, A/B experiment design, event naming convention (noun_verb), data quality standards
**Handoff inputs from:** pm-agent (PRD with metrics section), engineer-agent (event instrumentation spec)
**Handoff outputs to:** pm-agent (metrics framework), delivery-agent (dashboard readiness confirmation)
**Known limitation:** Metrics framework must be designed before launch — no analytics debt at shipment

---

### delivery-agent

**File:** `agents/delivery-agent.md`
**Identity:** TPM / Delivery manager with process authority
**Key capabilities:** DORA metrics tracking (Deployment Frequency, Lead Time, Change Failure Rate, MTTR), sprint cycle protocol, release protocol, incident response T+0 to T+120
**Handoff inputs from:** qa-agent (PASS verdict), all agents (status updates)
**Handoff outputs to:** all agents (sprint assignments, release schedule)
**Known limitation:** Does not make product or architecture decisions — delivery-agent escalates these; delivery-agent's authority is process, not content

---

### docs-agent

**File:** `agents/docs-agent.md`
**Identity:** Technical writer with documentation authority
**Key capabilities:** Documentation types by update trigger, 7-section runbook structure
**Handoff inputs from:** engineer-agent (API changes), architect-agent (ADR), delivery-agent (post-release confirmation)
**Handoff outputs to:** wiki/runbooks/, wiki/architecture/, implementation/api-specs/
**Known limitation:** Runbooks must exist before any release — docs-agent is a pre-release dependency; this step is commonly skipped under deadline pressure

---

### strategist-agent

**File:** `agents/strategist-agent.md`
**Identity:** Product strategist with market analysis authority
**Key capabilities:** April Dunford 5-step positioning framework, Sean Ellis PMF test (40% threshold), iterate-vs-kill framework
**Handoff inputs from:** pm-agent (discovery brief), analytics-agent (PMF data)
**Handoff outputs to:** pm-agent (strategic recommendation)
**Known limitation:** Strategist is advisory — pm-agent makes the final product call; strategist cannot override

---

### ux-agent

**File:** `agents/ux-agent.md`
**Identity:** UX designer
**Handoff inputs from:** pm-agent (PRD)
**Handoff outputs to:** engineer-agent (design spec)
**Known limitation:** Definition is less detailed than other agents — may need expansion when first UX work is assigned

---

## Agent Interaction Map

```
Human Operator
    ↓ (request)
master-orchestrator (routes)
    ↓
strategist-agent → pm-agent → [PRD approved] → architect-agent
                                                      ↓
                                              security-agent (parallel)
                                                      ↓
                                              engineer-agent ← ux-agent
                                                      ↓
                                              qa-agent
                                                      ↓
                                              delivery-agent → [shipped]
                                                      ↓
                                              analytics-agent (post-launch)

supervisor-agent ← (can review any agent output at any time)
docs-agent ← (triggered by engineer-agent or delivery-agent)
```

---

## Plugin Agents (Installed — Available But Not Custom-Defined)

These agents come from the `agents/plugins/` directory. They are available but not integrated into the custom orchestrator routing by default.

| Plugin | Agent Files | Capability |
|--------|------------|-----------|
| ai-pm-copilot | product-manager.md, feature-prioritizer.md, market-analyst.md, product-strategist.md, roadmap-builder.md, etc. | PM-specific workflows |
| agent-teams | idea-researcher.md, idea-skeptic.md, market-researcher.md, feasibility-reviewer.md, etc. | Multi-agent debate and validation |

**Integration path:** These can be invoked by `pm-agent` or `strategist-agent` as sub-agents via the superpowers/subagent pattern. They are not wired into the orchestrator routing tables yet.
