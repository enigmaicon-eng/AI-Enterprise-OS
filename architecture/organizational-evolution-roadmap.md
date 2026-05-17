---
type: evolution-roadmap
classification: strategic
authority: delivery-agent + architect-agent + human-operator
version: 1.0.0
created: 2026-05-09
horizon: 18 months
review-cadence: quarterly
---

# Organizational Evolution Roadmap

> Defines the path from the current Documentation OS to a fully operational, self-governing Enterprise AI OS. Four phases, each with concrete deliverables, resources, success metrics, and risk mitigations.

---

## Roadmap Philosophy

**The central tension:** The OS is ready to govern work it cannot yet execute. Every governance mechanism, every quality gate, every escalation chain was designed for a runtime that doesn't exist. The evolution roadmap solves this by building the execution capability phase by phase, while keeping the governance layer ahead of the execution layer — not the other way around.

**The compounding principle:** Each phase builds on the prior. Phase 1 produces the first real organizational intelligence. Phase 2 uses that intelligence to execute. Phase 3 uses execution data to optimize. Phase 4 uses optimization history to self-evolve. Do not skip phases.

**The governance invariant:** At every phase, governance capability must meet or exceed execution capability. An OS that can execute faster than it can govern is more dangerous than one that can't execute at all.

---

## Phase 0: Foundation Complete (Current State)

**Status:** COMPLETE
**Duration:** 2026-05-08 to 2026-05-09
**Description:** Infrastructure scaffolding, governance design, agent definitions, workflow specifications, templates, memory system, constitution.

**What exists:**
- 11 agents defined
- 14 workflows specified (7 production-grade, 7 legacy stubs)
- 18+ templates
- Enterprise constitution (DRAFT)
- 5 governance principles + 8 quality gates
- Memory system (25+ entries)
- Observability framework (designed, not instrumented)
- Ontology (core concepts, artifact taxonomy, agent vocabulary)
- State models (workflow + artifact state machines)
- Lifecycle models (feature lifecycle)
- Constitution (human approval catalog, governance boundary model)

**What's missing:** Everything in execution, integration, and runtime.

---

## Phase 1: First Initiative + Governance Activation

**Duration:** 4–6 weeks from constitution ratification
**Theme:** Get the OS running on a real problem. Test everything. Find the gaps in real use.
**Maturity target:** 2.9/5 overall (from 2.1)

### Phase 1 Objectives

1. **Ratify the constitution** — Complete `constitution/enterprise-questionnaire.md`. Resolve Q-001 through Q-005. No product work starts until this is done.

2. **Activate governance** — Turn governance from aspirational to operational: pre-step checklists, state persistence protocol, gate exception logging, human approval tracking.

3. **Execute first feature** — Run one complete feature through the OS (PM → Architecture → Engineering → QA → Release) with every artifact in the right place and every gate documented.

4. **Measure everything that matters** — Establish DORA baseline, gate first-pass rates, context utilization. Data-free optimization is guesswork.

### Phase 1 Deliverables

| # | Deliverable | Owner | Week |
|---|------------|-------|------|
| 1.1 | Constitutional questionnaire completed | Human Operator | W1 |
| 1.2 | Constitution ratified (DRAFT → ACTIVE) | Human Operator | W1 |
| 1.3 | Open questions Q-001 to Q-005 resolved | Human Operator | W1 |
| 1.4 | ADR-002: Technology stack decisions | architect-agent | W2 |
| 1.5 | Session initialization protocol documented | orchestrator | W1 |
| 1.6 | Pre-step gate checklist operationalized | supervisor-agent | W2 |
| 1.7 | Sprint 001 initialized | delivery-agent | W2 |
| 1.8 | First PRD written and G1 passed | pm-agent | W2-3 |
| 1.9 | First ADR written (architectural decisions for first feature) | architect-agent | W3 |
| 1.10 | First threat model written | security-agent | W3 |
| 1.11 | First QA plan + G5 gate | qa-agent | W4-5 |
| 1.12 | First release (even if internal/0% rollout) | delivery-agent | W5-6 |
| 1.13 | Operational runbooks verified against actual stack | delivery-agent | W5 |
| 1.14 | DORA baseline established (Sprint 001 data) | analytics-agent | W6 |
| 1.15 | Sprint 001 retrospective + learnings | delivery-agent | W6 |
| 1.16 | First failure mode documented | any agent | As it occurs |
| 1.17 | Supervisor golden tests (30 examples) | analytics-agent | W4 |
| 1.18 | `wiki/decisions/gate-exceptions.md` in active use | supervisor-agent | As needed |

### Phase 1 Resource Requirements

| Resource | Requirement | Notes |
|---------|-------------|-------|
| Human operator time | 2-4 hours/week | Approvals, ratification, G7 gate, Q&A |
| Claude sessions | 3-5 sessions/week | One per major workflow step |
| Constitutional questionnaire completion | One-time, 1-2 hours | Blocks everything |
| First feature scope | XS or M-tier | Do not start with L-tier; calibrate the OS first |

### Phase 1 Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| Constitution ratification | Complete by Week 1 | Binary |
| First feature delivered | Complete by Week 6 | Binary |
| All 8 quality gates exercised | At least once each | Gate log |
| DORA baseline established | Sprint 001 data exists | Binary |
| Gate first-pass rate | Any value (baseline) | Gate log |
| Open questions resolved | Q-001 to Q-005 | `open-questions.md` |
| Human approval requests | ≥3 properly documented | `human-approvals.md` |

### Phase 1 Risks

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Constitutional questionnaire remains unanswered | HIGH | Set hard deadline: no Phase 1 work starts without ratification |
| First feature too ambitious (L-tier scope) | MEDIUM | Constrain to XS or M-tier; scope creep is governance debt |
| Gate compliance incomplete (skipped gates) | HIGH | Pre-step checklist; supervisor blocks advancement |
| Session state lost between steps | HIGH | Session initialization protocol; state written after each step |
| Context budget exceeded | MEDIUM | Monitor context use; split sessions at natural boundaries |

---

## Phase 2: Automation + Integration

**Duration:** 6–8 weeks after Phase 1 complete
**Theme:** Replace human-as-orchestrator with MCP-assisted automation. Connect to real tools.
**Maturity target:** 3.4/5 overall

**Prerequisite:** Phase 1 complete; at least 1 feature delivered; DORA baseline established.

### Phase 2 Objectives

1. **Reduce human orchestration overhead** — The human operator should not need to manually prompt each workflow step. MCP tools automate step execution.

2. **Connect to real development tools** — The OS coordinates real code repositories, real CI pipelines, real test runners.

3. **Activate observability** — Metrics move from defined to measured. Dashboards show real data.

4. **Build the knowledge graph** — Move from flat-file references to a queryable reference registry.

### Phase 2 Deliverables

| # | Deliverable | Owner | Week |
|---|------------|-------|------|
| 2.1 | `mcp__ide__getDiagnostics` integrated into QA workflow step | engineer-agent | W1-2 |
| 2.2 | GitHub connector: PR creation from implementation plan | engineer-agent | W2-3 |
| 2.3 | CI/CD pipeline connected: build + test results feed QA gate | qa-agent | W3-4 |
| 2.4 | Reference registry: cross-document references indexed | architect-agent | W2 |
| 2.5 | Artifact integrity checks: checksum + canonical path validation | architect-agent | W2-3 |
| 2.6 | Observability telemetry: events emitted for all major actions | analytics-agent | W3-4 |
| 2.7 | DORA dashboard: real data from 3 sprints | analytics-agent | W4-5 |
| 2.8 | Quality gate dashboard: real gate first-pass rates | supervisor-agent | W4-5 |
| 2.9 | Google Calendar connector: human approval scheduling | delivery-agent | W3 |
| 2.10 | Approval SLA monitoring: breach detection + escalation | delivery-agent | W3-4 |
| 2.11 | Agent capability manifests (YAML) for all 11 agents | architect-agent | W1-2 |
| 2.12 | Model strategy documented (multi-model routing) | architect-agent | W2 |
| 2.13 | Evaluation golden tests: supervisor-agent (30 examples) | analytics-agent | W2-3 |
| 2.14 | Sprint 002 + 003 completed with metrics data | delivery-agent | W4-8 |
| 2.15 | First quarterly maturity assessment | supervisor-agent | W8 |
| 2.16 | Wiki coverage at 100% | docs-agent | W2-3 |
| 2.17 | Memory freshness score measured and above 90% | docs-agent | W4 |

### Phase 2 Resource Requirements

| Resource | Requirement | Notes |
|---------|-------------|-------|
| Human operator time | 1-2 hours/week | MCP tools reduce orchestration overhead |
| Engineering time | Required | Someone must implement MCP connectors and CI integration |
| Tech stack decision | Required (ADR-002) | Can't build CI connector without knowing the stack |
| GitHub account + repo | Required | Integration target |

### Phase 2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| Workflow steps requiring manual prompting | < 30% (down from ~100%) | Observation |
| DORA: deployment frequency | ≥ 2/sprint | Release log |
| DORA: change failure rate | < 30% (early baseline) | Incident vs. release ratio |
| Gate first-pass rate | Baseline established (any value) | Gate log |
| Reference registry active | ≥50 cross-references indexed | Registry count |
| CI integration active | Pass/fail from CI in QA gate | QA artifacts |
| Context budget compliance | < 5% sessions over budget | Telemetry |

### Phase 2 Risks

| Risk | Probability | Mitigation |
|------|------------|-----------|
| Tech stack not decided before integration | HIGH | ADR-002 must precede Phase 2 integration work |
| MCP integration complexity underestimated | MEDIUM | Scope to 3 integrations maximum in Phase 2 |
| Quality regression from automation | MEDIUM | Golden tests catch regression; supervisor monitors |
| Reference registry creates performance bottleneck | LOW | Index asynchronously; not on critical path |

---

## Phase 3: Autonomy + Intelligence

**Duration:** 8–12 weeks after Phase 2 complete
**Theme:** The OS operates autonomously within constitution bounds. Learns from experience.
**Maturity target:** 3.8/5 overall

**Prerequisite:** Phase 2 complete; 3+ sprints of data; DORA trends established.

### Phase 3 Objectives

1. **Autonomous workflow execution** — The OS can complete a full feature workflow with human involvement only at gates that require it (G7 pre-release, constitutional decisions).

2. **Activate learning loop** — Failures generate workflow improvements. Retrospective learnings update agent instructions. The OS gets measurably better each sprint.

3. **Event-driven orchestration** — A PRD approval event automatically triggers architecture workflow. A QA pass event automatically triggers release workflow. Humans aren't the event bus.

4. **Organizational memory compounds** — The knowledge graph is queryable. Agents can find related decisions, similar past features, and relevant risk patterns without human guidance.

### Phase 3 Deliverables

| # | Deliverable | Owner | Week |
|---|------------|-------|------|
| 3.1 | Workflow engine: event-triggered step execution | architect-agent | W1-3 |
| 3.2 | Event bus: gate events trigger downstream workflows | architect-agent | W2-4 |
| 3.3 | YAML knowledge graph: entities, relationships, decisions | architect-agent | W2-4 |
| 3.4 | Organizational learning: pattern miner from incidents | analytics-agent | W4-6 |
| 3.5 | Workflow amendments from retrospective patterns (first) | supervisor-agent | W6-8 |
| 3.6 | Saga coordinator: compensation steps for failed workflows | architect-agent | W4-6 |
| 3.7 | Immutable audit log: hash-chained event store | security-agent | W3-5 |
| 3.8 | Trust enforcement: permission model in code | architect-agent | W3-5 |
| 3.9 | AI quality monitoring: production sampling live | analytics-agent | W4-6 |
| 3.10 | Multi-model routing: Haiku for routing, Opus for architecture | architect-agent | W2-3 |
| 3.11 | Stakeholder model: map for first product | pm-agent | W1-2 |
| 3.12 | Resource model: capacity tracking per sprint | delivery-agent | W1-2 |
| 3.13 | Slack connector: human approval notifications | delivery-agent | W3-4 |
| 3.14 | Second quarterly maturity assessment | supervisor-agent | W12 |

### Phase 3 Success Metrics

| Metric | Target | Measurement |
|--------|--------|------------|
| Human interventions per workflow | < 3 (down from ~20+) | Telemetry |
| DORA: deployment frequency | Weekly | Release log |
| DORA: lead time | < 1 week | Artifact timestamps |
| Gate first-pass rate | > 70% | Gate log |
| Workflow amendments from learnings | ≥ 2 | Amendment log |
| Audit log entries | All governance events covered | Log completeness check |
| Knowledge graph entities | ≥ 50 | Graph count |

---

## Phase 4: Self-Evolution + Enterprise Scale

**Duration:** 12+ weeks after Phase 3 complete
**Theme:** The OS optimizes its own governance. Scales to multiple teams and products.
**Maturity target:** 4.0/5 overall

### Phase 4 Objectives

1. **Self-optimizing governance** — Quality gate criteria evolve based on empirical data. Workflows that consistently bottleneck are simplified or parallelized.

2. **Multi-project federation** — Multiple products or teams operate on the same OS with isolated namespaces and shared organizational intelligence.

3. **Digital twin** — Predict organizational health. Simulate the impact of governance changes before implementing them.

4. **Capability marketplace** — New agent capabilities can be discovered, composed, and deployed through a governed marketplace.

### Phase 4 Deliverables

| # | Deliverable | Owner | Week |
|---|------------|-------|------|
| 4.1 | Governance optimizer: bottleneck detection + improvement proposals | analytics-agent | W1-4 |
| 4.2 | Agent calibrator: automated instruction improvement proposals | supervisor-agent | W2-5 |
| 4.3 | Multi-project namespace model | architect-agent | W1-3 |
| 4.4 | Federated memory: cross-project knowledge sharing | architect-agent | W3-6 |
| 4.5 | Organizational digital twin v1 | analytics-agent | W4-8 |
| 4.6 | Capability marketplace: versioned capability catalog | architect-agent | W3-6 |
| 4.7 | Vector store migration (if MEMORY_INDEX > 50 entries) | architect-agent | As triggered |
| 4.8 | Executive governance layer: steering committee model | pm-agent | W2-3 |
| 4.9 | Annual constitutional review | human-operator | W12+ |
| 4.10 | Third quarterly maturity assessment (target 4.0) | supervisor-agent | W12 |

---

## Cross-Phase Governance Constraints

**These governance rules apply at every phase, without exception:**

1. **Governance ahead of execution** — Every new execution capability must have a corresponding governance mechanism before it is activated.
2. **Evidence before advancement** — Phase advancement requires documented evidence of phase completion, not just completion belief.
3. **Constitution first** — No Phase 1 work starts before constitution ratification.
4. **Human authority preserved** — Increasing automation never removes human authority over constitutional decisions, production releases, or security critical findings.
5. **Rollback capability maintained** — Every phase must be reversible. If Phase 2 automation creates more problems than it solves, Phase 1 operation must be resumable.

---

## Evolution Milestones Summary

```
Week 0: Constitution ratified + Q-001 to Q-005 resolved
    │
Week 2: First PRD + G1 passed; Sprint 001 launched
    │
Week 6: First feature delivered; DORA baseline
    │     (Phase 1 complete)
    │
Week 10: MCP integrations; CI connected; Observability active
    │
Week 14: DORA trends; Knowledge graph; Gate metrics active
    │      (Phase 2 complete)
    │
Week 20: Event-driven execution; Autonomous workflows
    │
Week 26: Learning loop; Knowledge graph queryable
    │      (Phase 3 complete)
    │
Month 9-18: Self-optimization; Multi-project; Digital twin
             (Phase 4 complete)
```

---

## The FAANG Calibration Test

At the end of Phase 3, the OS should pass the following test that any elite FAANG platform team would recognize:

**"If the founding engineer of this OS were hit by a bus tomorrow, could the organization continue operating at full quality within 48 hours?"**

Pass criteria:
- [ ] New session starts; agent reads workflow state and continues from correct position
- [ ] A gate is skipped; the system detects it and blocks advancement
- [ ] A security finding is discovered; it blocks release without human intervention
- [ ] A new feature request arrives; it is routed to the correct workflow without human specification
- [ ] A production incident occurs; incident workflow triggers; team is notified within 15 minutes
- [ ] Sprint ends; retrospective happens; learnings are captured and fed back into the system

If all 6 pass: the OS is operating at FAANG platform maturity.
