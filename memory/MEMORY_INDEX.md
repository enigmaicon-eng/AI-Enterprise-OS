# Memory Index

Index of all active memory entries. The orchestrator reads this to determine which memory files to include in context packages.

**Format:** `| File | Domain | Type | Summary | Importance |`

---

## Organizational Memory

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `organizational/system-context.md` | cross | context | Enterprise AI OS purpose and installed systems | high |
| `organizational/governance-constraints.md` | cross | constraint | Non-negotiable governance rules all agents must follow | critical |
| `organizational/quality-standards.md` | cross | constraint | Quality gate policy and standards | high |

## Architecture Patterns

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `patterns/artifact-driven-communication.md` | architecture | pattern | Handoff envelopes replace free-form agent comms | critical |
| `patterns/minimum-viable-context.md` | architecture | pattern | Context budget rules for each agent type | high |

## Engineering Patterns

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `patterns/dev-tier-classification.md` | engineering | pattern | XS/M/L tier classification for all engineering work | high |

## Decision Logs

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `decisions.md` | cross | decision | Master index of all settled decisions across all domains | high |
| `architecture-decisions.md` | architecture | decision | Architecture decisions with binding constraints; links to ADRs | high |
| `product-decisions.md` | PM | decision | Product and prioritization decisions with evidence basis | high |

## Active Trackers

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `open-questions.md` | cross | tracker | Unresolved questions that agents must not silently assume | high |
| `known-risks.md` | cross | tracker | Organizational risk registry with mitigations and owners | high |

## Session Handoffs

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `../handoffs/session-2026-05-09/session-handoff.md` | cross | handoff | Complete session handoff — 2026-05-08/09 OS build sessions | critical |

## Failure Modes

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `failures/README.md` | cross | failure | Index of documented failure modes | normal |

---

## Strategic Architecture Layer (2026-05-09) — NORTH STAR

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `../architecture/strategic-gap-analysis.md` | cross | analysis | 47 gaps (9 critical): runtime absence, governance-without-enforcement, org simulation | critical |
| `../architecture/future-state-enterprise-architecture.md` | architecture | vision | 7-layer target architecture; component specs; technology decision matrix | high |
| `../architecture/enterprise-maturity-model.md` | cross | framework | 12 dimensions × 5 levels; current 2.1/5; 6/12/24-month targets | high |
| `../architecture/organizational-evolution-roadmap.md` | cross | roadmap | 4 phases (0 complete); Phase 1: constitution ratification + first feature | critical |
| `../architecture/runtime-evolution-roadmap.md` | architecture | roadmap | RT-0→RT-4; MCP-connected → event-driven → autonomous → self-optimizing | high |

## Constitution Layer (2026-05-09) — SUPREME AUTHORITY

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `../constitution/enterprise-constitution.md` | cross | constraint | Supreme governing document — all agents must operate within its bounds | critical |
| `../constitution/human-approval-constitution.md` | cross | constraint | Definitive list of every decision requiring human operator authorization | critical |
| `../constitution/governance-boundary-model.md` | cross | reference | Authority, domain, and security boundary definitions and crossing rules | high |

## New Layers (2026-05-09)

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `../observability/metrics.md` | cross | reference | DORA, quality, AI, governance metric definitions | high |
| `../observability/alerts.md` | cross | reference | Alert conditions and escalation paths | high |
| `../ontology/core-concepts.md` | cross | reference | Authoritative term definitions for all OS vocabulary | high |
| `../ontology/artifact-taxonomy.md` | cross | reference | All artifact types, canonical paths, and owners | high |
| `../ontology/agent-vocabulary.md` | cross | reference | Agent roles, trust hierarchy, capability boundaries | high |
| `../evaluations/criteria.md` | AI | reference | Universal AI eval dimensions and release thresholds | high |
| `../evaluations/golden-tests.md` | AI | reference | Golden test set format and management protocol | high |
| `../state-models/workflow-states.md` | cross | reference | Workflow state machine and recovery protocol | high |
| `../state-models/artifact-states.md` | cross | reference | Artifact lifecycle states and invariants | high |
| `../lifecycle-models/feature-lifecycle.md` | PM | reference | Feature journey from idea to sunset with phase gates | high |
| `../architecture/decisions/ADR-001-enterprise-ai-os-architecture.md` | architecture | decision | Foundational OS architectural decisions (5 decisions) | critical |

## Enterprise Agent Organization Layer (2026-05-09) — EXECUTION AUTHORITY

| File | Domain | Type | Summary | Importance |
|------|--------|------|---------|-----------|
| `../agents/MASTER-REGISTRY.md` | cross | reference | Catalog of all 144 agents, 17 orgs, routing keys, authority tiers | critical |
| `../agents/COLLABORATION-CONTRACTS.md` | cross | reference | 10-tier cross-org collaboration contracts with SLAs | critical |
| `../agents/ROUTING-TABLE.md` | cross | reference | 100+ routing key → agent mappings for executive-orchestrator | critical |
| `../agents/executive/executive-org.md` | executive | agent-def | 10 executive agents (CPO, CTO, CAIO, VPs, Councils) with 19 dimensions | high |
| `../agents/ai-native/ai-native-org.md` | ai-native | agent-def | 11 OS backbone agents (orchestrator, routing, continuity, evaluation) | critical |
| `../agents/product/product-org.md` | product | agent-def | 21 PM agents with full responsibilities, gates, KPIs | high |
| `../agents/architecture/architecture-org.md` | architecture | agent-def | 10 architecture agents (principal, EA, API, runtime, AI, security, etc.) | high |
| `../agents/engineering/engineering-org.md` | engineering | agent-def | 11 engineering agents (distinguished, frontend, backend, AI, devops, etc.) | high |
| `../agents/governance/governance-org.md` | governance | agent-def | 7 governance agents (risk, compliance, audit, AI safety, approvals) | high |
| `../agents/qa/qa-org.md` | qa | agent-def | 7 QA agents (general, security, performance, AI eval, workflow, runtime, governance) | high |
| `../agents/delivery/delivery-org.md` | delivery | agent-def | 6 delivery agents (delivery manager, program, release, dependency, incident, rollout) | high |
| `../agents/strategy/strategy-org.md` | strategy | agent-def | 8 strategy agents (corporate, portfolio, CI, financial, investment, ROI, bets, ecosystem) | high |
| `../agents/ux/ux-org.md` | ux | agent-def | 6 UX agents (strategy, research, design systems, conversational, AI UX, accessibility) | high |
| `../agents/analytics/analytics-org.md` | analytics | agent-def | 6 analytics agents (product, metrics governance, experimentation, org health, forecasting, ops) | high |
| `../agents/customer/customer-org.md` | customer | agent-def | 4 customer agents (success, support ops, escalation, intelligence) | high |
| `../agents/business-analysis/business-analysis-org.md` | ba | agent-def | 8 BA agents (analyst, senior BA, process, workflow, enterprise ops, rules, SOPs, readiness) | high |
| `../agents/runtime/runtime-org.md` | runtime | agent-def | 7 runtime agents (workflow runtime, state machine, event bus, observability, dist coord, scheduling, graphs) | high |
| `../agents/meta-org/meta-org.md` | meta | agent-def | 6 meta-org agents (org evolution, workflow evolution, governance evolution, gap detection, optimization, simulation) | high |

---

## Adding Memory

When adding a new memory entry:
1. Create the file in the appropriate subdirectory
2. Add a row to this index
3. Include domain, type, one-line summary, and importance level
4. Keep the summary short enough to fit in one table cell

**Importance levels:**
- `critical`: Always loaded; agents must not proceed without this
- `high`: Loaded for relevant domain work
- `normal`: Loaded when context budget allows
