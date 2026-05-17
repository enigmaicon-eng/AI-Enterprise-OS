---
type: maturity-model
classification: strategic
authority: architect-agent
version: 1.0.0
created: 2026-05-09
review-cadence: semi-annual
assessment-owner: supervisor-agent + human-operator
---

# Enterprise AI OS Maturity Model

> A formal maturity model for AI-native operating systems. Defines 5 levels across 12 dimensions. Provides the current state assessment of this OS and the advancement criteria for each level.

---

## Model Overview

**Purpose:** Make organizational maturity visible, measurable, and improvable. Not a report card — a navigation instrument.

**5 Maturity Levels:**

| Level | Name | Core Characteristic |
|-------|------|---------------------|
| 1 | Ad Hoc | Improvised; no repeatable process |
| 2 | Defined | Processes documented; not consistently followed |
| 3 | Managed | Processes followed; outcomes measured |
| 4 | Optimizing | Outcomes drive process improvement; feedback loops active |
| 5 | Adaptive | System learns and evolves; self-optimizing within governance |

**Current overall assessment: Level 2.3 (Defined, approaching Managed)**

The OS has exceptional Level 2 coverage (comprehensive documentation) but has not crossed into Level 3 (consistent execution + measurement) in most dimensions because it lacks runtime infrastructure and empirical data.

---

## Dimension 1: Governance + Compliance

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No governance documentation; decisions made ad hoc |
| 2 | Governance principles documented; quality gates defined; policies written |
| 3 | Gates consistently applied; exceptions logged; compliance measured |
| 4 | Gate first-pass rates tracked; governance improvements data-driven; exceptions trend downward |
| 5 | Self-healing governance; violations auto-detected; governance learns from patterns |

**Current assessment: Level 2.5**

**Strengths:** 8 quality gates defined; 5 immutable principles; enterprise constitution; human approval catalog (26 rules); governance boundary model.

**Gap to Level 3:** Gates not consistently applied (no runtime enforcement); compliance rate unmeasured; exceptions not systematically logged.

**Advancement criteria to Level 3:**
- Pre-step gate checklist operationalized in all workflows
- Gate compliance rate measured for 1 full sprint (target: establish baseline)
- `wiki/decisions/gate-exceptions.md` contains actual entries (not just template)
- Approval request protocol in active use

---

## Dimension 2: Execution + Runtime

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No execution infrastructure; everything manual |
| 2 | Execution model documented; state models defined; execution patterns specified |
| 3 | MCP-assisted execution; basic state persistence; workflow engine operational |
| 4 | Event-driven orchestration; autonomous step execution; saga pattern implemented |
| 5 | Fully autonomous execution within governance bounds; circuit breakers; self-healing |

**Current assessment: Level 1.5**

The execution model is completely documented (Level 2 documentation) but nothing executes (Level 1 reality). Averaged at 1.5.

**Gap to Level 3:** Requires implementing Phase 1 of the runtime evolution roadmap — MCP-connected execution with session-bound state persistence.

**Advancement criteria to Level 3:**
- Workflow engine can advance a workflow step without human prompting each step
- State is written to `memory/workflow-state/` automatically after each step
- Session resumption recovers workflow position without human description of prior state
- At least 1 complete feature delivered through the workflow engine (not manually)

---

## Dimension 3: Knowledge + Memory

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | Knowledge in individual human heads; no shared documentation |
| 2 | Wiki and memory documented; 3-tier architecture defined; MEMORY_INDEX operational |
| 3 | Knowledge actively maintained; freshness measured; cross-references tracked |
| 4 | Knowledge graph operational; semantic search; automatic reference validation |
| 5 | Self-updating knowledge graph; automatic pattern synthesis; federated cross-project memory |

**Current assessment: Level 2.5**

Strong documentation and 3-tier architecture. Indexed memory with 25+ entries. **Weaknesses:** No freshness monitoring in practice; cross-references are text-only with no validation; knowledge graph is aspirational.

**Advancement criteria to Level 3:**
- Memory freshness score (M2) measured and above 90%
- Wiki coverage (M3) at 100%
- Reference registry operational: every cross-document reference indexed
- Quarterly memory review executed (produces `memory-review.md`)

---

## Dimension 4: Agent Intelligence + Quality

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No agent definitions; improvised prompting |
| 2 | 11 agents defined; context budgets specified; capability areas documented |
| 3 | Agents measured; golden tests exist; supervisor calibrated against human judgment |
| 4 | Multi-model routing; agent A/B testing; quality regression detection |
| 5 | Agents self-improve based on feedback; capability marketplace; emergent specialization |

**Current assessment: Level 2**

Complete agent definitions, capability scope, and context budgets. **Gap:** No golden tests, no empirical quality measurement, supervisor quality unvalidated, no model versioning.

**Advancement criteria to Level 3:**
- Golden test set created for supervisor-agent (30+ examples)
- LLM-as-judge agreement rate (A2) measured at ≥ 80%
- Capability manifest YAML created for all 11 agents
- First A/B test completed between two versions of one agent definition

---

## Dimension 5: Observability + Telemetry

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No metrics; no visibility |
| 2 | DORA targets defined; metrics framework documented; dashboards specified |
| 3 | DORA metrics actually measured for 3+ sprints; baseline established; alerts firing |
| 4 | Trend analysis active; anomaly detection; predictive quality alerts |
| 5 | Self-adjusting monitoring; ML-based quality prediction; organizational health forecasting |

**Current assessment: Level 1.5**

Metrics system thoroughly designed. No actual measurement happening. Dashboards don't exist as data, only as specs.

**Advancement criteria to Level 3:**
- DORA metrics collected for 3 consecutive sprints
- At least 3 alert conditions configured and tested
- Quality gate dashboard has real data (not "— Baseline period")
- Memory health dashboard has real freshness scores

---

## Dimension 6: Security + Compliance

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No security policy; security as afterthought |
| 2 | Security policy documented; threat model template exists; security gates defined (G3/G6) |
| 3 | Threat models written for all features; security gate consistently applied; compliance scope defined |
| 4 | Automated vulnerability scanning; secrets detection automated; compliance evidence generated |
| 5 | Continuous threat model update; AI-driven vulnerability detection; regulatory reporting automated |

**Current assessment: Level 2.5**

Comprehensive security policy, 2 security gates, threat model template, data classification. **Gap:** Q-004 (compliance scope) unanswered; zero actual threat models written; no automated enforcement.

**Advancement criteria to Level 3:**
- Q-004 answered and compliance framework documented
- Threat model written for the first feature before it ships
- Secrets detection check in place before any commit
- Security gate applied to at least 1 real feature with documented outcome

---

## Dimension 7: Organizational Coordination

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No coordination model; everyone improvises |
| 2 | Agent org chart defined; routing rules documented; handoff protocol specified |
| 3 | Handoffs consistently used; conflicts resolved by documented escalation; sprint cadence followed |
| 4 | Political alignment model; stakeholder map active; resource model operational |
| 5 | Self-organizing teams; coalition detection; dynamic resource allocation |

**Current assessment: Level 2**

Excellent org topology design. **Gap:** No actual coordination has occurred (no features delivered). No stakeholder model. No resource model.

**Advancement criteria to Level 3:**
- First feature delivered using the defined handoff protocol (all handoff artifacts exist)
- Sprint 001 completed with all ceremonies documented
- At least 1 conflict escalation path exercised and documented
- Stakeholder map created for the first initiative

---

## Dimension 8: Integration + Interoperability

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No external integrations |
| 2 | Integration architecture designed; MCP tools available; integration registry defined |
| 3 | IDE integration active; GitHub integration active; at least 1 external tool connected |
| 4 | CI/CD integrated; Slack/Teams for human approvals; Figma for UX; full development pipeline |
| 5 | Enterprise data warehouse integration; bi-directional sync; event mesh with external systems |

**Current assessment: Level 1.5**

MCP tools available but unintegrated. 12 plugins installed as files with no live connections. Integration architecture partially designed.

**Advancement criteria to Level 3:**
- `mcp__ide__getDiagnostics` connected to engineering workflow (QA step)
- GitHub connector: PR creation automated from implementation plan
- At least 1 real feature deployed through an actual CI/CD pipeline

---

## Dimension 9: Organizational Learning

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No learning; history repeats |
| 2 | Failure mode documentation designed; retrospective template exists; wiki maintenance defined |
| 3 | Retrospectives run consistently; failures documented; action items tracked to completion |
| 4 | Pattern mining from failures; workflow improvements from retros; A/B governance experiments |
| 5 | Autonomous pattern synthesis; self-updating governance; organizational memory compounds over time |

**Current assessment: Level 1.5**

Learning framework designed. `memory/failures/` is empty. No retrospectives run. No failures documented (no features delivered).

**Advancement criteria to Level 3:**
- Sprint 001 retrospective completed; learnings in `wiki/learnings/`
- `memory/failures/` has at least 2 documented failure modes
- Retrospective action items tracked to completion in Sprint 002
- At least 1 workflow improvement made as result of documented learning

---

## Dimension 10: AI Safety + Alignment

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No alignment consideration |
| 2 | Autonomy boundaries documented; hard limits specified in constitution; escalation defined |
| 3 | Alignment tested empirically; adversarial inputs tested; hard limits verified to hold |
| 4 | Continuous alignment monitoring; regression detection; alignment benchmark suite |
| 5 | Constitutional AI principles embedded in agent training; alignment self-verifying |

**Current assessment: Level 2.5**

Excellent alignment framework: 26 AI hard limits, autonomy boundaries, escalation chains. Constitution is the alignment document. **Gap:** No empirical testing of whether hard limits actually hold; no adversarial evaluation.

**Advancement criteria to Level 3:**
- 10 adversarial prompts tested against constitution hard limits; all blocked
- Agent override attempts (asking an agent to approve its own artifact) tested; all correctly escalated
- Monthly alignment spot-check defined and executed

---

## Dimension 11: Economic + Resource Awareness

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | No cost model; blind resource consumption |
| 2 | Context budgets defined; cost implications noted in constitution |
| 3 | API cost per workflow estimated; cost tracked per sprint; cost-per-feature visible |
| 4 | Cost optimization active; model selection driven by cost/quality tradeoff; resource forecasting |
| 5 | Autonomous cost optimization; ROI model per feature; economic digital twin |

**Current assessment: Level 1.5**

Context budgets defined. No actual cost tracking. No API cost model. Zero visibility into OS operating cost.

**Advancement criteria to Level 3:**
- API cost estimated per workflow type (using context budget × token cost)
- Cost tracked for first 3 sprints
- Cost-per-feature metric defined and measurable

---

## Dimension 12: Platform Extensibility

### Level Descriptors

| Level | Indicators |
|-------|-----------|
| 1 | Monolithic; no extension points |
| 2 | Plugin architecture described; extension procedures documented; capability areas defined |
| 3 | New agent successfully added; new workflow successfully added; plugin compatibility tested |
| 4 | Capability marketplace; self-service agent creation; versioned capability catalog |
| 5 | AI-assisted capability generation; dynamic agent composition; emergent specializations |

**Current assessment: Level 2**

SYSTEM.md documents how to add agents and workflows. 12 plugins installed. No actual extensions tested.

**Advancement criteria to Level 3:**
- One new agent successfully added following the extension procedure
- One new workflow added and routed correctly
- Plugin compatibility matrix documented for the 12 installed plugins

---

## Current State Summary

| Dimension | Current Level | Target (6mo) | Target (12mo) | Target (24mo) |
|-----------|--------------|-------------|--------------|--------------|
| Governance + Compliance | 2.5 | 3 | 3.5 | 4 |
| Execution + Runtime | 1.5 | 2.5 | 3.5 | 4.5 |
| Knowledge + Memory | 2.5 | 3 | 3.5 | 4 |
| Agent Intelligence + Quality | 2.0 | 3 | 3.5 | 4 |
| Observability + Telemetry | 1.5 | 2.5 | 3.5 | 4 |
| Security + Compliance | 2.5 | 3 | 3.5 | 4 |
| Organizational Coordination | 2.0 | 3 | 3.5 | 4 |
| Integration + Interoperability | 1.5 | 2.5 | 3 | 4 |
| Organizational Learning | 1.5 | 2.5 | 3.5 | 4 |
| AI Safety + Alignment | 2.5 | 3 | 3.5 | 4 |
| Economic + Resource Awareness | 1.5 | 2.5 | 3 | 3.5 |
| Platform Extensibility | 2.0 | 2.5 | 3 | 4 |
| **Overall Average** | **2.1** | **2.9** | **3.4** | **4.0** |

---

## Assessment Protocol

**How to run a maturity assessment:**

1. **Quarterly trigger:** Scheduled at each quarter-start by delivery-agent
2. **Evidence collection:** For each dimension, collect evidence from:
   - Artifacts produced in last quarter
   - Metrics from observability layer
   - Gate compliance data
   - Human operator self-assessment
3. **Level scoring:** For each dimension, identify the highest level where ALL indicators are met (not highest level partially met)
4. **Report:** Generate `architecture/maturity-assessments/YYYY-QN-maturity-assessment.md`
5. **Action items:** For each dimension below target, identify the specific advancement criteria to achieve next level
6. **Review:** supervisor-agent reviews assessment; human operator approves

**Assessment artifact location:** `architecture/maturity-assessments/`

---

## Level Advancement Gates

Advancement from Level N to Level N+1 in any dimension requires:
1. All Level N indicators demonstrated with evidence
2. All Level N+1 advancement criteria met (as defined per dimension above)
3. Assessment reviewed by supervisor-agent
4. Advancement recorded in assessment artifact
5. Memory entry updated to reflect new level

**One-level-per-quarter rule:** It is unrealistic to advance more than one maturity level per quarter in most dimensions. Plans that target two-level jumps in one quarter should be treated with skepticism and reviewed by architect-agent.
