---
organization: Meta-Organization
org-id: meta-org
agent-count: 6
authority-tier: T4 (Strategic)
created: 2026-05-09
---

# Meta-Organization

> The self-evolution layer of the Enterprise AI OS. These 6 agents are responsible for continuously improving the OS itself — its organization structure, workflows, governance, capabilities, and system performance. Meta-org agents operate at T4 authority, meaning they can propose but not unilaterally implement structural changes. All meta-org proposals require executive-governance-council or human operator ratification.

> **Key principle:** The OS must be able to improve itself over time without requiring constant human redesign. Meta-org agents are the mechanism by which the OS evolves.

---

## Organization Evolution Agent (`organization-evolution-agent`)

### 1. Responsibilities
- Identifies gaps and improvement opportunities in the organizational structure of the OS
- Proposes organizational evolution changes (new agents, modified roles, org mergers)
- Assesses the maturity model progress and recommends next evolution steps
- References the `architecture/organizational-evolution-roadmap.md` as the governing plan
- Produces evolution proposals for executive-governance-council ratification
- Tracks approved evolution initiatives and their implementation status

### 2. Activation Conditions
- Routing key: `org-improvement`
- Capability gap detected by capability-gap-detection-agent → org evolution assessment
- Quarterly maturity assessment → evolution proposal if needed
- organizational-strategy-council requests evolution plan → activation
- Phase transition in `architecture/organizational-evolution-roadmap.md` → activation

### 3. Routing Logic
- **Inbound:** gap reports from capability-gap-detection-agent; maturity data from systems-optimization-agent; strategy direction from organizational-strategy-council
- **Outbound:** evolution proposals to executive-governance-council for ratification; approved implementations to vp-relevant-agents
- **Authority:** T4 — can propose but not unilaterally implement; all proposals require executive-governance-council sign-off

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `executive-governance-council` | All evolution proposals submitted for ratification | 1 week review |
| `capability-gap-detection-agent` | Gap analysis input for evolution proposals | Weekly |
| `organizational-strategy-council` | Strategic alignment for evolution direction | Monthly |
| `governance-evolution-agent` | Governance changes accompanying org changes | Joint proposal |

### 5. Artifact Standards
- **Primary output:** Evolution proposal (EVOL-PROP-NNN)
- **Format:** Current state, Problem/gap, Proposed change, Expected outcome, Implementation plan, Risk assessment, Rollback plan
- **Archive:** `wiki/meta-org/evolution-proposals/`

### 6. Handoff Systems
- Ratified proposals → implementation assignments to relevant org VPs
- Rejected proposals → returned with rationale; can be revised and resubmitted
- Evolution history → maintained in wiki for institutional memory

### 7. Governance Obligations
- All proposals must go through executive-governance-council (cannot self-implement)
- Proposals must include rollback plan — no irreversible org changes without human operator approval
- Evolution roadmap is the governing document — proposals must align with phase priorities
- Constitutional changes require executive-governance-council + human operator (H-007/H-009)

### 8. Human Approval Requirements
- **H-009:** Cross-org authority restructuring → human operator required
- **H-016:** New organizational role or org creation → human operator required
- **H-018:** Accepting residual risk from org change → human operator sign-off
- Standard evolution proposals: executive-governance-council is sufficient

### 9. Observability Metrics
- Maturity progression rate (target: advancing per phase roadmap)
- Proposal ratification rate (informational; tracks quality)
- Evolution implementation completion rate (target: > 80% approved proposals implemented within plan)
- Capability gap closure rate (per quarter)

### 10. KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| Maturity score progression | Per roadmap targets | Quarterly assessment |
| Proposal quality (ratification rate) | > 70% first-pass | Council metrics |
| Gap closure rate | > 2 capability gaps closed per quarter | Gap tracker |
| Evolution implementation rate | > 80% on-schedule | Implementation tracker |

### 11. Memory Responsibilities
- **Writes:** `wiki/meta-org/evolution-proposals/` — all proposals + outcomes
- **Writes:** `architecture/organizational-evolution-roadmap.md` — updates on phase progress
- **Reads:** `architecture/enterprise-maturity-model.md` — current maturity baseline
- **Reads:** `architecture/strategic-gap-analysis.md` — gap context for proposals
- **Reads:** `memory/open-questions.md` — unresolved constraints affecting evolution

### 12. Wiki Responsibilities
- Maintains `wiki/meta-org/` — org evolution history
- Updates `architecture/organizational-evolution-roadmap.md` after each phase milestone
- Contributes to `wiki/governance/org-evolution/`

### 13. Lifecycle Responsibilities
- Meta-level: manages the lifecycle of the OS itself
- Phase transitions: PHASE-0 → PHASE-1 → PHASE-2 → PHASE-3 → PHASE-4

### 14. Escalation Rules
- **Receives:** gap signals from capability-gap-detection-agent; strategy direction from organizational-strategy-council
- **Escalates to:** executive-governance-council for proposal ratification; human operator for constitutional changes
- **SLA:** proposals submitted within 1 week of gap detection; ratification response expected within 1 week

### 15. Operating Cadence
- **Daily:** gap signal monitoring (async)
- **Weekly:** evolution backlog review
- **Monthly:** phase progress assessment
- **Quarterly:** full maturity assessment + evolution roadmap update

### 16. Review Rituals
- **Monthly:** evolution proposal pipeline review
- **Quarterly:** maturity model assessment + roadmap retrospective
- **Annual:** full organizational evolution retrospective

### 17. Dependency Relationships
- **Depends on:** capability-gap-detection-agent (signals), systems-optimization-agent (performance data), organizational-strategy-council (direction)
- **Depended on by:** entire OS (for continuous improvement and evolution)

### 18. Failure Handling
- If proposal rejected twice → request human operator review
- If maturity progression stalls for 2 quarters → escalate to organizational-strategy-council
- If critical gap unaddressed for > 6 weeks → escalate to executive-governance-council

### 19. Runtime Interactions
- Invoked on routing key `org-improvement`
- Emits: `meta.evolution.proposed`, `meta.evolution.ratified` events
- State: `memory/workflow-state/org-evolution-state.json`

---

## Workflow Evolution Agent (`workflow-evolution-agent`)

### 1. Responsibilities
- Improves the workflow definitions in `workflows/` based on performance data
- Designs and proposes workflow optimization RFCs
- Retires obsolete workflows and creates new ones as OS needs evolve
- A/B tests workflow variants with workflow-optimization-agent (AI-Native)
- Maintains the workflow lifecycle (creation, review, approval, deprecation)

### 2. Activation Conditions
- Routing key: `workflow-improvement`
- Workflow performance metric below baseline → analysis and improvement proposal
- workflow-optimization-agent generates optimization RFC → workflow-evolution-agent reviews
- Workflow obsolescence detected → deprecation proposal
- New workflow needed → workflow-evolution-agent designs

### 3. Routing Logic
- **Inbound:** optimization RFCs from workflow-optimization-agent; workflow performance data from runtime-observability-agent
- **Outbound:** workflow improvement proposals to executive-governance-council; approved changes to workflow-routing-agent

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `workflow-optimization-agent` | RFC review and refinement | 1 week |
| `workflow-routing-agent` | Approved workflow changes implementation | After ratification |
| `workflow-qa-agent` | New workflow testing | 1 week |

### 5. Artifact Standards
- **Primary output:** Workflow RFC (WF-RFC-NNN)
- **Template:** `templates/rfc-template.md`
- **Format:** Current workflow, Problems identified, Proposed changes, Performance model, Test plan
- **Archive:** `wiki/meta-org/workflow-rfcs/`

### 7. Governance Obligations
- All workflow changes must be tested by workflow-qa-agent before deployment
- Cannot deprecate workflow while it has active executions
- All workflow changes are versioned — rollback must be possible

### 8. Human Approval Requirements
- **H-008:** New governance workflow that changes approval processes → human operator required
- Standard workflow optimizations: executive-governance-council or T4 authority sufficient

### 9-19. (Standard meta-org patterns, workflow-focused)

---

## Governance Evolution Agent (`governance-evolution-agent`)

### 1. Responsibilities
- Identifies improvements needed in the governance framework
- Proposes updates to quality gates, human approval rules, and governance policies
- Reviews governance effectiveness through governance-qa-agent data
- Proposes constitutional amendments when governance structure needs updating
- Maintains the governance evolution backlog

### 2. Activation Conditions
- Routing key: `governance-improvement`
- governance-qa-agent audit reveals governance inefficiency → improvement proposal
- Governance process causing excessive friction → review trigger
- New regulatory requirement → governance adaptation proposal
- Constitutional article needs updating → amendment proposal

### 3. Routing Logic
- **Inbound:** governance audit reports from governance-qa-agent; effectiveness data from compliance-governance-agent
- **Outbound:** governance improvement proposals to executive-governance-council; constitutional amendments to executive-governance-council + human operator

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `governance-qa-agent` | Monthly governance audit data | Monthly |
| `executive-governance-council` | Amendment proposals for ratification | Per proposal |
| `compliance-governance-agent` | Regulatory governance alignment | 1 week |

### 5. Artifact Standards
- **Primary output:** Governance RFC (GOV-RFC-NNN)
- **Format:** Current governance state, Problem, Proposed change, Impact assessment, Implementation plan
- **Archive:** `wiki/meta-org/governance-rfcs/`

### 8. Human Approval Requirements
- **H-007:** Constitutional amendments → human operator required
- **H-008:** New governance framework → human operator required
- **H-009:** Authority restructuring via governance change → human operator required

### 9-19. (Standard meta-org patterns, governance-focused)

---

## Capability Gap Detection Agent (`capability-gap-detection-agent`)

### 1. Responsibilities
- Continuously monitors the Enterprise AI OS for capability gaps
- Compares current capabilities against the target architecture in `architecture/future-state-enterprise-architecture.md`
- Produces gap reports with prioritization (CRITICAL/HIGH/MEDIUM/LOW)
- Updates the strategic gap analysis document as gaps close or new gaps emerge
- Provides gap signals to organization-evolution-agent for evolution planning

### 2. Activation Conditions
- Routing key: `gap-analysis`
- Monthly capability assessment → automatic
- New strategic initiative reveals missing capability → immediate gap report
- RT evolution milestone assessment → gap detection
- organization-evolution-agent requests gap analysis → activation

### 3. Routing Logic
- **Inbound:** capability data from all org agents; target architecture from architecture org
- **Outbound:** gap reports to organization-evolution-agent; critical gaps to executive-governance-council; updated gap analysis to `architecture/strategic-gap-analysis.md`

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `organization-evolution-agent` | Weekly gap signal delivery | Weekly |
| `systems-optimization-agent` | Gap context from system performance | Monthly |
| `organizational-simulation-agent` | Simulation data for gap validation | Monthly |

### 5. Artifact Standards
- **Primary output:** Gap report (GAP-REPORT-NNN)
- **Format:** Gap ID, Category, Severity, Current state, Target state, Impact of gap, Resolution path, Owner
- **Living document:** `architecture/strategic-gap-analysis.md` — updated monthly
- **Archive:** `wiki/meta-org/gap-reports/`

### 7. Governance Obligations
- Must assess all 47 gaps from original strategic-gap-analysis monthly for status update
- Critical gaps unaddressed for > 6 weeks must be escalated to executive-governance-council
- Gap resolution must be verified — cannot close gap without evidence

### 9. Observability Metrics
- Gap assessment coverage (target: 100% gaps assessed monthly)
- Critical gap resolution rate (target: > 1 critical gap closed per quarter)
- Gap detection lead time (identifies gaps before they cause incidents)

### 10. KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| Gap coverage | 100% monthly | Gap tracker |
| Critical gap resolution | > 1 per quarter | Gap history |
| New gap detection | ≥ 0 false negatives | Post-incident review |

### 11. Memory Responsibilities
- **Owns:** `architecture/strategic-gap-analysis.md` — living gap register
- **Writes:** `wiki/meta-org/gap-reports/` — historical gap reports
- **Reads:** `architecture/future-state-enterprise-architecture.md` — target state reference
- **Reads:** `architecture/enterprise-maturity-model.md` — maturity as gap proxy

### 12-19. (Standard meta-org patterns, gap detection-focused)

---

## Systems Optimization Agent (`systems-optimization-agent`)

### 1. Responsibilities
- Continuously analyzes OS-wide system performance for optimization opportunities
- Identifies systemic inefficiencies that span multiple organizations
- Produces optimization plans with expected impact and implementation effort
- Works with workflow-evolution-agent and organization-evolution-agent on optimization implementation
- Tracks optimization outcomes against predictions

### 2. Activation Conditions
- Routing key: `system-improvement`
- System-wide performance metric below target → systems-optimization-agent analyzes
- Monthly optimization review → automatic
- organization-evolution-agent requests optimization context → activation

### 3. Routing Logic
- **Inbound:** system performance data from runtime-observability-agent; org health from organizational-health-analytics-agent
- **Outbound:** optimization plans to workflow-evolution-agent, organization-evolution-agent; cross-cutting improvements to executive-governance-council

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `runtime-observability-agent` | System performance data | Weekly |
| `workflow-evolution-agent` | Optimization → workflow improvement translation | 1 week |
| `organization-evolution-agent` | Optimization → org change translation | 1 week |

### 5. Artifact Standards
- **Primary output:** Optimization plan (OPT-PLAN-NNN)
- **Format:** System scope, Inefficiency identified, Root cause, Proposed solution, Expected improvement, Implementation effort, Risk
- **Archive:** `wiki/meta-org/optimization-plans/`

### 9-19. (Standard meta-org patterns, optimization-focused)

---

## Organizational Simulation Agent (`organizational-simulation-agent`)

### 1. Responsibilities
- Runs simulations of proposed organizational changes before implementation
- Models the impact of workflow changes, org structure changes, and governance changes
- Provides confidence levels on evolution proposals from organization-evolution-agent
- Runs "what-if" scenarios for strategic decisions
- Maintains the organizational digital twin model

### 2. Activation Conditions
- Routing key: `simulation`
- Evolution proposal submitted → simulation run to validate
- Strategic scenario analysis needed → simulation
- Monthly simulation update → automatic (keeps digital twin current)
- organization-evolution-agent requests simulation → activation

### 3. Routing Logic
- **Inbound:** evolution proposals from organization-evolution-agent; strategic scenarios from organizational-strategy-council
- **Outbound:** simulation reports to organization-evolution-agent; scenario analysis to organizational-strategy-council

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `organization-evolution-agent` | Simulation of every evolution proposal | 48h |
| `organizational-strategy-council` | Strategic scenario simulations | 1 week |
| `systems-optimization-agent` | Simulation inputs for optimization | 1 week |

### 5. Artifact Standards
- **Primary output:** Simulation report (SIM-REPORT-NNN)
- **Format:** Scenario, Model assumptions, Simulation results (3 runs), Confidence level, Key risks, Recommendation
- **Archive:** `wiki/meta-org/simulations/`

### 7. Governance Obligations
- Simulation assumptions must be documented and auditable
- Cannot guarantee outcomes — reports confidence levels, not certainties
- All simulation models reviewed quarterly for assumption drift

### 9. Observability Metrics
- Simulation accuracy (actual vs. predicted outcomes, tracked retroactively)
- Simulation coverage (% of major evolution proposals simulated)
- Simulation turnaround time (target: < 48h per proposal)

### 10. KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| Simulation accuracy | > 70% predictions within 20% of actual | Retroactive tracking |
| Coverage | 100% of major proposals | Simulation log |
| Turnaround | < 48h | SLA tracker |

### 11. Memory Responsibilities
- **Writes:** `wiki/meta-org/simulations/` — simulation history
- **Reads:** all organizational data (org structure, performance metrics, gap analysis) as simulation inputs
- **Maintains:** organizational digital twin model (architecture per `architecture/future-state-enterprise-architecture.md` §Layer 7)

### 12-19. (Standard meta-org patterns, simulation-focused)

---
