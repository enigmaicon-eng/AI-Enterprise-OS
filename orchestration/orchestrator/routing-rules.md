# Routing Rules

Deterministic rules for the Master Orchestrator to route intents to agents and workflows.

## Rule Format

```
TRIGGER PATTERN → AGENT/WORKFLOW [PRECONDITION] [POSTCONDITION]
```

---

## PM Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "build a feature", "add X to product" | `pm-agent` → full-feature-workflow | none | PRD |
| "prioritize", "should we build X or Y" | `pm-agent` | none | Prioritization matrix |
| "roadmap", "what's next" | `pm-agent` | Current backlog context | Roadmap update |
| "user research", "what do users want" | `pm-agent` + `market-analyst-agent` | none | Research synthesis |
| "competitive analysis", "how do we compare" | `market-analyst-agent` | none | Competitive report |
| "product strategy", "positioning" | `strategist-agent` | Business objectives exist | Strategy doc |
| "go-to-market", "launch plan" | `strategist-agent` + `delivery-agent` | PRD approved | GTM plan |
| "product-market fit", "PMF" | `strategist-agent` | none | PMF assessment |

---

## Architecture Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "design the system", "architecture for" | `architect-agent` | PRD or brief exists | System design doc |
| "ADR", "architecture decision" | `architect-agent` | Decision context | ADR in `architecture/decisions/` |
| "RFC", "proposal for" | `architect-agent` | Problem statement | RFC in `rfc/` |
| "scale this", "performance architecture" | `architect-agent` | Current system context | Scaling proposal |
| "threat model", "security design" | `security-agent` | System design exists | Threat model |
| "security review" | `security-agent` | Artifact to review | Security report |
| "data model", "database design" | `architect-agent` | Requirements | Data model doc |
| "API design", "contract" | `architect-agent` | Requirements | API spec |

---

## Engineering Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "implement", "code this", "build this" | `engineer-agent` | Tech spec or ADR exists | Code + PR description |
| "fix this bug", "debug" | `engineer-agent` | Bug report exists | Fix + root cause analysis |
| "refactor", "clean up code" | `engineer-agent` | Code context | Refactored code |
| "code review" | `engineer-agent` | PR or code exists | Review comments |
| "write tests", "add test coverage" | `engineer-agent` + `qa-agent` | Implementation exists | Test suite |
| "documentation", "README" | `docs-agent` | Code or feature exists | Docs artifact |
| "API docs" | `docs-agent` | API implementation | OpenAPI spec |
| "runbook", "operational guide" | `docs-agent` | System/feature context | Runbook |

---

## QA Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "test plan", "testing strategy" | `qa-agent` | PRD + implementation | Test plan |
| "QA this", "verify this works" | `qa-agent` | Implementation + acceptance criteria | QA report |
| "regression test" | `qa-agent` | Test suite exists | Regression results |
| "performance test", "load test" | `qa-agent` | Running implementation | Performance report |
| "acceptance criteria", "definition of done" | `qa-agent` + `pm-agent` | PRD exists | DoD checklist |

---

## UX Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "design this UI", "create wireframe" | `ux-agent` | PRD or brief | Design spec |
| "user flow", "journey map" | `ux-agent` | User research or PRD | Flow diagram |
| "design system", "component library" | `ux-agent` | Brand guidelines | Design system doc |
| "accessibility review", "a11y" | `ux-agent` | UI implementation | Accessibility report |
| "prototype" | `ux-agent` | Requirements | Prototype spec |

---

## Analytics Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "metrics", "KPIs", "success metrics" | `analytics-agent` | Business objectives | Metrics framework |
| "dashboard", "tracking" | `analytics-agent` | Metrics framework | Dashboard spec |
| "analyze data", "insights from" | `analytics-agent` | Data source | Analysis report |
| "A/B test", "experiment" | `analytics-agent` + `pm-agent` | Hypothesis | Experiment design |

---

## Delivery Organization Routing

| Trigger Keywords | Route To | Preconditions | Artifacts Produced |
|-----------------|----------|---------------|-------------------|
| "release plan", "ship this" | `delivery-agent` | All org artifacts approved | Release plan |
| "sprint planning", "next sprint" | `delivery-agent` + `pm-agent` | Prioritized backlog | Sprint plan |
| "deploy", "deployment checklist" | `delivery-agent` | QA approved | Deploy checklist |
| "incident", "outage", "production issue" | `delivery-agent` → incident-response-workflow | none | Incident report |
| "retrospective", "retro" | `delivery-agent` + `pm-agent` | Sprint completed | Retro doc |

---

## Cross-Org Workflow Routing

These patterns span multiple orgs and should invoke the corresponding workflow file:

| Pattern | Workflow File | Org Sequence | Duration |
|---------|--------------|-------------|---------|
| "should we build", "validate idea", "discovery" | `workflows/product-discovery.md` | PM + ANALYTICS + STRATEGIST | 5–10 days |
| "architecture for", "ADR", "design the system" | `workflows/architecture-workflow.md` | ARCH + SECURITY + ENG | 2–5 days |
| "implement", "build this", "fix bug" | `workflows/engineering-workflow.md` | ENG + QA + DOCS | XS–L tiered |
| "test this", "QA this", "verify" | `workflows/qa-workflow.md` | QA + UX + PM | 1–5 days |
| `!incident`, "production down", "outage" | `workflows/incident-workflow.md` | DELIVERY → ENG → ARCH → SECURITY | P1: hours |
| "AI feature", "use Claude", "LLM", "generate with AI" | `workflows/ai-feature-workflow.md` | PM + ARCH + ENG + QA + SECURITY | 2–6 weeks |
| "new feature end-to-end" | `workflows/feature-development.md` | PM → ARCH → UX → ENG → QA → DELIVERY | 1–4 sprints |
| "sprint planning", "next sprint" | `workflows/sprint-planning.md` | PM → DELIVERY → ENG + QA | Half-day |
| "release", "deploy to production" | `workflows/release-workflow.md` | QA → SECURITY → DELIVERY | 1–3 days |
| "update wiki", "knowledge update" | `workflows/wiki-maintenance.md` | All agents | 1–2 hours |

**Full workflow index:** `workflows/INDEX.md`

---

## Workflow Chaining Rules

When a workflow produces a GO or PASS signal, these transitions are automatic:

```
product-discovery  ──GO──────→  feature-development OR ai-feature-workflow
feature-development ──────────→  architecture-workflow (embedded Step 02a)
feature-development ──────────→  qa-workflow (embedded Step 04)
feature-development ──────────→  release-workflow (Step 06)
engineering-workflow ──────────→  qa-workflow (Step 09 handoff)
qa-workflow ──PASS───────────→  release-workflow
qa-workflow ──FAIL───────────→  engineering-workflow (with bug reports)
release-workflow ──post-deploy→  incident-workflow (if P1/P2 detected)
incident-workflow ──action────→  engineering-workflow (preventive fixes)
incident-workflow ──systemic──→  architecture-workflow (design fixes)
```

---

## Priority Overrides

Certain conditions override ALL normal routing, regardless of current workflow state:

1. **`!incident` prefix** → immediately invoke `incident-workflow`; all other workflows paused
2. **Security vulnerability** → immediately route to `security-agent`; block current workflow
3. **Data exposure detected** → `security-agent` + human escalation; incident-workflow opens
4. **Tier L without ADR** → block `engineering-workflow`; escalate to `architecture-workflow`
5. **Quality gate fail** → route back to `engineer-agent`; never forward to delivery
6. **Regulatory/compliance** → `security-agent` must co-review before any release gate
7. **AI safety violation** → immediately halt `ai-feature-workflow`; escalate to human

---

## Routing Disambiguation

When a request could match multiple workflows, use this priority order:

1. `!incident` → always `incident-workflow` first
2. Explicit workflow invocation by name → honor it
3. CROSS-org pattern → use chaining table above
4. Single-org pattern → route to org's primary agent
5. Ambiguous → ask ONE clarifying question before routing
