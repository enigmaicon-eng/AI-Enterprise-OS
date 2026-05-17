# Workflow Index

All enterprise workflows for the AI Operating System. Each workflow is fully deterministic — it specifies agents, routing, artifact creation, validation gates, escalation rules, handoff protocols, and wiki updates.

---

## Workflow Catalog

| Workflow | ID | Trigger | Orgs | Typical Duration |
|---------|----|---------|------|-----------------|
| [Product Discovery](product-discovery.md) | `product-discovery` | "should we build", "validate", "discovery" | PM + ANALYTICS + STRATEGIST | 5–10 days |
| [Architecture](architecture-workflow.md) | `architecture-workflow` | "ADR", "architecture for", "design the system" | ARCH + SECURITY + ENG | 2–5 days |
| [Engineering](engineering-workflow.md) | `engineering-workflow` | "implement", "fix bug", "code this" | ENG + QA + DOCS | XS: hours, M: 2–5d, L: 5–15d |
| [QA](qa-workflow.md) | `qa-workflow` | handoff from ENG, "test this", "QA this" | QA + UX + PM | 1–5 days |
| [Incident Response](incident-workflow.md) | `incident-workflow` | `!incident`, "production down", monitoring alert | DELIVERY + ENG + ARCH + SECURITY | P1: hours, P2: hours–1d |
| [AI Feature](ai-feature-workflow.md) | `ai-feature-workflow` | "AI feature", "LLM", "use Claude", "generate with AI" | PM + ARCH + ENG + QA + SECURITY | 2–6 weeks |
| [Feature Development](feature-development.md) | `feature-development` | "build a feature", "add X to product" | PM + ARCH + UX + ENG + QA + SECURITY + DELIVERY | 1–4 sprints |
| [Sprint Planning](sprint-planning.md) | `sprint-planning` | "plan sprint", "next sprint", sprint start | PM + DELIVERY + ENG + QA | Half-day |
| [Release](release-workflow.md) | `release-workflow` | "release", "deploy to production", QA PASS received | QA + SECURITY + DELIVERY | 1–3 days |
| [Wiki Maintenance](wiki-maintenance.md) | `wiki-maintenance` | End of session, "update wiki", weekly | All | 1–2 hours |

---

## Workflow Selection Guide

### "We have a new idea" → `product-discovery`
**Use when:** Uncertain about whether to build, need to validate demand, new problem space.
**Output:** GO/NO-GO decision with evidence.

### "We know what to build, need to design it" → `architecture-workflow`
**Use when:** PRD approved; need to make technical decisions; ADR/RFC needed.
**Output:** Accepted ADR + system design doc.

### "We're building it" → `engineering-workflow`
**Use when:** Spec exists; ready to code.
**Output:** Implemented, tested, documented code ready for QA.

### "Testing phase" → `qa-workflow`
**Use when:** Engineering handoff received; need to verify against acceptance criteria.
**Output:** Quality gate verdict (PASS/CONDITIONAL_PASS/FAIL).

### "Something's broken in production" → `incident-workflow`
**Use when:** ANY production issue. Prefix message with `!incident`.
**Output:** Resolved incident + post-mortem with action items.

### "Building an AI/LLM feature" → `ai-feature-workflow`
**Use when:** Feature involves AI inference as a core component.
**Output:** Deployed AI feature with eval baselines, safety review, staged rollout.

### "Full feature end-to-end" → `feature-development`
**Use when:** Starting a complete feature lifecycle from approved PRD.
**Output:** All artifacts from design through deployment.

---

## Workflow Chaining

Some workflows are designed to chain into each other:

```
product-discovery  ──GO──→  feature-development
                                OR ai-feature-workflow

feature-development ──→  architecture-workflow (Step 02a)
                     ──→  qa-workflow (Step 04)
                     ──→  release-workflow (Step 06)

engineering-workflow  ──→  qa-workflow (Step 09)
                      ──→  release-workflow (on PASS)

qa-workflow  ──PASS──→  release-workflow
             ──FAIL──→  engineering-workflow

release-workflow  ──incident──→  incident-workflow (if P1/P2 post-deploy)

incident-workflow  ──action items──→  engineering-workflow (for preventive fixes)
                                   →  architecture-workflow (for systemic fixes)
```

---

## Gate Summary

| Gate | Owner | Blocks |
|------|-------|--------|
| PRD Approval Gate (G1) | supervisor-agent | Architecture + UX start |
| Architecture Gate (G2) | supervisor-agent | Engineering start |
| Security Gate - Design (G3) | security-agent | Architecture Gate |
| UX Gate (G4) | supervisor-agent | Engineering start (UI) |
| QA Gate (G5) | qa-agent + supervisor | Release |
| Security Gate - Release (G6) | security-agent | Production deployment |
| AI Eval Gate | qa-agent + analytics-agent | AI feature ship |
| AI Safety Gate | security-agent | AI feature ship |
| Post-Mortem Gate | supervisor-agent | Incident closure |

---

## Escalation Quick Reference

| Trigger | Escalate To | Escalation Path |
|---------|-----------|----------------|
| Any security issue | `security-agent` | Immediate; no queue |
| Production P1/P2 | `delivery-agent` | `!incident` prefix |
| ADR needed for Tier L | `architect-agent` | `architecture-workflow` |
| QA FAIL twice | `supervisor-agent` | Manual review |
| AI safety violation | `security-agent` + `delivery-agent` | Immediate halt |
| PM/Arch disagree on decision | Human review | Explicit stakeholder alignment |

---

## Adding a New Workflow

1. Create `workflows/{workflow-id}.md` with full spec
2. Add entry to this INDEX.md
3. Add routing triggers to `orchestrator/routing-rules.md`
4. Document chaining relationships above
5. Add to `wiki/processes/` (human-readable summary)
6. Update `SYSTEM.md` workflow count
