# Agent Registry

All agents available in the Enterprise AI OS. Updated whenever a new agent is created.

---

## PM Organization

### `pm-agent` — Product Manager
- **File:** `agents/pm-agent.md`
- **Triggers:** feature requests, roadmap questions, prioritization, user research, market analysis
- **Inputs:** user feedback, business objectives, market data, competitive intel
- **Outputs:** PRDs, roadmap items, user stories, prioritization matrices
- **Plugins:** `agents/plugins/ai-pm-copilot/`
- **Handoffs to:** `architect-agent`, `ux-agent`, `delivery-agent`

### `strategist-agent` — Product Strategist
- **File:** `agents/strategist-agent.md`
- **Triggers:** strategy questions, positioning, GTM, product-market fit
- **Inputs:** market research, competitive landscape, business goals
- **Outputs:** strategy docs, positioning frameworks, GTM plans
- **Handoffs to:** `pm-agent`, `analytics-agent`

### `market-analyst-agent` — Market Analyst
- **File:** `agents/market-analyst-agent.md`
- **Triggers:** competitive analysis, market sizing, trend research
- **Inputs:** company context, target market, competitors list
- **Outputs:** competitive analysis docs, market sizing, trend reports
- **Handoffs to:** `strategist-agent`, `pm-agent`

---

## Architecture Organization

### `architect-agent` — Solution Architect
- **File:** `agents/architect-agent.md`
- **Triggers:** system design requests, tech decisions, ADRs, scalability questions
- **Inputs:** PRDs, technical constraints, existing system context
- **Outputs:** ADRs, system diagrams, technical specs, RFCs
- **Handoffs to:** `engineer-agent`, `security-agent`

### `security-agent` — Security Architect
- **File:** `agents/security-agent.md`
- **Triggers:** security reviews, threat modeling, compliance questions, vulnerability reports
- **Inputs:** system designs, code changes, compliance requirements
- **Outputs:** security review reports, threat models, remediation plans
- **Handoffs to:** `engineer-agent`, `qa-agent`
- **Gate:** Must approve all ARCH and ENG outputs before production handoff

---

## Engineering Organization

### `engineer-agent` — Senior Engineer
- **File:** `agents/engineer-agent.md`
- **Triggers:** implementation tasks, code review, debugging, refactoring
- **Inputs:** technical specs, ADRs, PRDs, bug reports
- **Outputs:** code, PRs, implementation docs, test suites
- **Plugins:** `claude-dev-workflow`, `superpowers`
- **Handoffs to:** `qa-agent`, `docs-agent`

### `docs-agent` — Documentation Engineer
- **File:** `agents/docs-agent.md`
- **Triggers:** documentation requests, README updates, API docs, runbooks
- **Inputs:** code, specs, implementation artifacts
- **Outputs:** README files, API docs, runbooks, changelogs
- **Handoffs to:** `delivery-agent`

---

## QA Organization

### `qa-agent` — QA Engineer
- **File:** `agents/qa-agent.md`
- **Triggers:** testing requests, quality gates, regression checks, test planning
- **Inputs:** implementation artifacts, acceptance criteria, PRDs
- **Outputs:** test plans, test results, bug reports, quality gate verdicts
- **Handoffs to:** `delivery-agent` (pass), `engineer-agent` (fail)

---

## UX Organization

### `ux-agent` — UX Designer
- **File:** `agents/ux-agent.md`
- **Triggers:** design requests, user flows, prototypes, accessibility reviews
- **Inputs:** PRDs, user research, design system refs
- **Outputs:** wireframes, design specs, user flow docs, accessibility reports
- **Plugins:** `ui-ux-pro-max-skill`
- **Handoffs to:** `engineer-agent`, `qa-agent`

---

## Analytics Organization

### `analytics-agent` — Data Analyst
- **File:** `agents/analytics-agent.md`
- **Triggers:** metrics questions, dashboard requests, data analysis, KPI definition
- **Inputs:** business objectives, data sources, existing metrics
- **Outputs:** metric frameworks, dashboard specs, analysis reports
- **Handoffs to:** `engineer-agent` (for implementation), `pm-agent` (for insights)

---

## Delivery Organization

### `delivery-agent` — Delivery Manager
- **File:** `agents/delivery-agent.md`
- **Triggers:** release planning, sprint management, deployment coordination
- **Inputs:** completed artifacts from all orgs, release criteria
- **Outputs:** release plans, sprint summaries, deployment checklists
- **Handoffs to:** `pm-agent` (post-release retro)

---

## Supervisor

### `supervisor-agent` — Quality Supervisor
- **File:** `orchestrator/supervisor.md`
- **Role:** Validates all cross-org outputs before handoff
- **Always invoked for:** CROSS-class workflows, production releases, security-sensitive changes
- **Outputs:** approval/rejection verdicts with specific feedback

---

## Plugin-Backed Capabilities

| Capability | Plugin | Agents That Use It |
|-----------|--------|-------------------|
| PM frameworks (RICE, JTBD, PMF) | `agents/plugins/ai-pm-copilot` | pm-agent, strategist-agent |
| Multi-agent validation | `agents/plugins/agent-teams` | supervisor-agent |
| Context engineering | `Agent-Skills-for-Context-Engineering` | all agents |
| Design intelligence | `ui-ux-pro-max-skill` | ux-agent |
| Dev workflow tiers | `claude-dev-workflow` | engineer-agent |
| Memory compression | `claude-mem` | all agents |
| SDLC orchestration | `BMAD-METHOD` | master-orchestrator |
