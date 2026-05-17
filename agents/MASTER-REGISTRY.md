---
type: master-registry
version: 3.0.0
created: 2026-05-09
last-updated: 2026-05-10
agent-count: 144
org-count: 17
authority: executive-orchestrator-agent
review-cadence: monthly
status: complete
org-files: all 17 org definition files generated
supplementary: COLLABORATION-CONTRACTS.md, ROUTING-TABLE.md
change-log: v3.0.0 — added Connector + MCP Org (7 agents) and Artifact Execution Org (9 agents)
---

# Enterprise AI OS — Master Agent Registry

> **The authoritative catalog of all agents in the Enterprise AI OS.** Every agent, every organization, every routing key. The executive-orchestrator-agent reads this on every session start.

---

## Registry Summary

| Organization | Agent Count | Primary Domain | Authority Tier |
|-------------|-------------|---------------|---------------|
| Executive | 10 | Strategy + Governance | T5 (Constitutional) |
| Product | 21 | Product definition | T2 (Domain) |
| Business Analysis | 8 | Process + operations | T2 (Domain) |
| Strategy | 8 | Portfolio + direction | T2 (Domain) |
| Architecture | 10 | Technical design | T2-T3 (Domain + Gate) |
| Engineering | 11 | Implementation | T1-T2 (Autonomous + Domain) |
| QA | 7 | Quality verification | T2-T3 (Domain + Gate) |
| UX | 6 | Experience design | T2 (Domain) |
| Delivery | 6 | Execution + release | T2-T3 (Domain + Gate) |
| Analytics | 6 | Measurement | T2 (Domain) |
| Customer | 4 | Customer outcomes | T2 (Domain) |
| Governance | 7 | Risk + compliance | T3-T4 (Gate + Strategic) |
| AI-Native | 11 | OS coordination | T3 (Orchestration) |
| Runtime | 7 | Execution infrastructure | T2 (Domain) |
| Meta-Organization | 6 | System evolution | T4 (Strategic) |
| **Connector + MCP** | **7** | Integration infrastructure | T2-T3 (Domain + Gate) |
| **Artifact Execution** | **9** | Publishing + communication | T2 (Domain) |
| **TOTAL** | **144** | | |

---

## Executive Organization

| Agent ID | Role | Authority | Primary Gate |
|---------|------|-----------|-------------|
| `cpo-agent` | Chief Product Officer | T5 | PRD final escalation |
| `cto-agent` | Chief Technology Officer | T5 | Architecture final escalation |
| `caio-agent` | Chief AI Officer | T5 | AI strategy + safety |
| `vp-product-agent` | VP Product | T4 | G1 escalation |
| `vp-engineering-agent` | VP Engineering | T4 | G2/G6 escalation |
| `vp-platform-agent` | VP Platform | T4 | Platform architecture |
| `vp-delivery-agent` | VP Delivery | T4 | G7 escalation |
| `executive-governance-council` | ExGov Council | T5 | Constitutional decisions |
| `enterprise-architecture-council` | EA Council | T4 | ADR ratification |
| `organizational-strategy-council` | OrgStrat Council | T5 | Strategic direction |

---

## Product Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `senior-pm-agent` | Senior PM | feature-requirements | PRD |
| `group-pm-agent` | Group PM | cross-feature-alignment | Group roadmap |
| `platform-pm-agent` | Platform PM | platform-requirements | Platform PRD |
| `technical-pm-agent` | Technical PM | technical-product | Technical PRD |
| `ai-product-manager-agent` | AI PM | ai-feature-requirements | AI Feature PRD |
| `monetization-pm-agent` | Monetization PM | pricing-monetization | Monetization brief |
| `growth-pm-agent` | Growth PM | growth-experiments | Growth experiment plan |
| `marketplace-pm-agent` | Marketplace PM | marketplace-features | Marketplace PRD |
| `enterprise-platform-pm-agent` | Enterprise Platform PM | enterprise-requirements | Enterprise PRD |
| `infrastructure-pm-agent` | Infrastructure PM | infra-product | Infra requirements |
| `compliance-pm-agent` | Compliance PM | compliance-requirements | Compliance PRD |
| `fintech-pm-agent` | Fintech PM | financial-product | Fintech PRD |
| `mortgage-pm-agent` | Mortgage PM | mortgage-product | Mortgage PRD |
| `product-operations-agent` | Product Operations | process-optimization | Process docs |
| `stakeholder-alignment-agent` | Stakeholder Alignment | stakeholder-coordination | Alignment brief |
| `executive-communications-agent` | Executive Comms | exec-communication | Exec brief |
| `incident-coordination-agent` | Incident Coordination | incident-product | Incident brief |
| `release-readiness-agent` | Release Readiness | release-product | Readiness report |
| `ai-governance-pm-agent` | AI Governance PM | ai-governance-product | AI governance PRD |
| `portfolio-governance-pm-agent` | Portfolio Governance PM | portfolio-governance | Portfolio brief |
| `organizational-effectiveness-pm-agent` | Org Effectiveness PM | org-effectiveness | Effectiveness report |

---

## Business Analysis Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `business-analyst-agent` | Business Analyst | business-analysis | Business requirements |
| `senior-business-analyst-agent` | Senior BA | complex-analysis | Complex BA report |
| `process-optimization-agent` | Process Optimization | process-improvement | Process redesign |
| `workflow-analysis-agent` | Workflow Analysis | workflow-review | Workflow analysis |
| `enterprise-operations-agent` | Enterprise Operations | enterprise-ops | Ops model |
| `business-rules-governance-agent` | Business Rules | rules-governance | Rules registry |
| `sop-management-agent` | SOP Management | sop-creation | SOP documents |
| `operational-readiness-agent` | Operational Readiness | ops-readiness | Readiness checklist |

---

## Strategy Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `corporate-strategy-agent` | Corporate Strategy | strategy-direction | Strategy brief |
| `portfolio-management-agent` | Portfolio Management | portfolio-planning | Portfolio plan |
| `competitive-intelligence-agent` | Competitive Intelligence | competitive-analysis | CI report |
| `financial-modeling-agent` | Financial Modeling | financial-analysis | Financial model |
| `investment-prioritization-agent` | Investment Prioritization | investment-decision | Investment brief |
| `roi-governance-agent` | ROI Governance | roi-analysis | ROI report |
| `strategic-bets-agent` | Strategic Bets | strategic-decision | Strategic bet brief |
| `ecosystem-mapping-agent` | Ecosystem Mapping | ecosystem-analysis | Ecosystem map |

---

## Architecture Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `principal-architect-agent` | Principal Architect | principal-architecture | Architecture vision |
| `enterprise-architect-agent` | Enterprise Architect | enterprise-architecture | EA diagram |
| `api-architect-agent` | API Architect | api-design | API specification |
| `runtime-architect-agent` | Runtime Architect | runtime-architecture | Runtime ADR |
| `ai-systems-architect-agent` | AI Systems Architect | ai-architecture | AI system design |
| `security-architect-agent` | Security Architect | security-design | Threat model |
| `reliability-architect-agent` | Reliability Architect | reliability-design | SLO definition |
| `data-architect-agent` | Data Architect | data-architecture | Data model |
| `knowledge-systems-architect-agent` | Knowledge Systems Architect | knowledge-architecture | Knowledge system design |
| `event-systems-architect-agent` | Event Systems Architect | event-architecture | Event schema |

---

## Engineering Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `distinguished-engineer-agent` | Distinguished Engineer | technical-leadership | Technical RFC |
| `frontend-engineer-agent` | Frontend Engineer | frontend-implementation | Frontend PR |
| `backend-engineer-agent` | Backend Engineer | backend-implementation | Backend PR |
| `ai-engineer-agent` | AI Engineer | ai-implementation | AI feature PR |
| `ml-systems-engineer-agent` | ML Systems Engineer | ml-implementation | ML pipeline |
| `runtime-engineer-agent` | Runtime Engineer | runtime-implementation | Runtime code |
| `platform-engineer-agent` | Platform Engineer | platform-implementation | Platform service |
| `devops-engineer-agent` | DevOps Engineer | devops-implementation | CI/CD pipeline |
| `security-engineer-agent` | Security Engineer | security-implementation | Security controls |
| `workflow-systems-engineer-agent` | Workflow Systems Engineer | workflow-implementation | Workflow code |
| `knowledge-systems-engineer-agent` | Knowledge Systems Engineer | knowledge-implementation | Knowledge service |

---

## QA Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `qa-agent` | QA Engineer | quality-verification | QA plan |
| `security-qa-agent` | Security QA | security-testing | Security test report |
| `performance-qa-agent` | Performance QA | performance-testing | Performance report |
| `ai-evaluation-qa-agent` | AI Evaluation QA | ai-quality-testing | Eval report |
| `workflow-qa-agent` | Workflow QA | workflow-testing | Workflow test report |
| `runtime-qa-agent` | Runtime QA | runtime-testing | Runtime test report |
| `governance-qa-agent` | Governance QA | governance-testing | Governance audit |

---

## UX Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `ux-strategy-agent` | UX Strategy | ux-strategy | UX strategy doc |
| `ux-research-agent` | UX Research | user-research | Research synthesis |
| `design-systems-agent` | Design Systems | design-system | Component library |
| `conversational-ux-agent` | Conversational UX | conversation-design | Conversation flow |
| `ai-experience-design-agent` | AI Experience Design | ai-ux | AI UX spec |
| `accessibility-design-agent` | Accessibility Design | accessibility | Accessibility audit |

---

## Delivery Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `delivery-manager-agent` | Delivery Manager | delivery-coordination | Sprint plan |
| `program-manager-agent` | Program Manager | program-coordination | Program plan |
| `release-governance-agent` | Release Governance | release-approval | Release report |
| `dependency-coordination-agent` | Dependency Coordination | dependency-management | Dependency map |
| `incident-manager-agent` | Incident Manager | incident-response | Incident report |
| `rollout-governance-agent` | Rollout Governance | rollout-coordination | Rollout plan |

---

## Analytics Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `product-analytics-agent` | Product Analytics | product-metrics | Analytics report |
| `metrics-governance-agent` | Metrics Governance | metrics-standards | Metrics spec |
| `experimentation-agent` | Experimentation | ab-testing | Experiment report |
| `organizational-health-analytics-agent` | Org Health Analytics | org-health | Health dashboard |
| `forecasting-agent` | Forecasting | prediction-modeling | Forecast report |
| `operational-analytics-agent` | Operational Analytics | ops-metrics | Ops metrics report |

---

## Customer Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `customer-success-agent` | Customer Success | customer-outcomes | Success brief |
| `support-operations-agent` | Support Operations | support-coordination | Support report |
| `escalation-response-agent` | Escalation Response | customer-escalation | Escalation response |
| `customer-intelligence-agent` | Customer Intelligence | customer-insights | Intelligence report |

---

## Governance Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `risk-management-agent` | Risk Management | risk-assessment | Risk report |
| `compliance-governance-agent` | Compliance Governance | compliance-review | Compliance report |
| `audit-readiness-agent` | Audit Readiness | audit-preparation | Audit package |
| `ai-safety-governance-agent` | AI Safety Governance | ai-safety-review | Safety report |
| `human-approval-governance-agent` | Human Approval Governance | approval-coordination | Approval log |
| `data-governance-agent` | Data Governance | data-policy | Data policy |
| `enterprise-controls-agent` | Enterprise Controls | controls-assessment | Controls report |

---

## AI-Native Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `executive-orchestrator-agent` | Executive Orchestrator | all-intents | Routing decision |
| `workflow-routing-agent` | Workflow Routing | workflow-selection | Routing assignment |
| `agent-coordination-agent` | Agent Coordination | multi-agent-tasks | Coordination plan |
| `prompt-governance-agent` | Prompt Governance | prompt-review | Prompt audit |
| `knowledge-systems-agent` | Knowledge Systems | knowledge-management | Knowledge update |
| `workflow-optimization-agent` | Workflow Optimization | workflow-improvement | Optimization RFC |
| `organizational-learning-agent` | Organizational Learning | learning-capture | Learning brief |
| `hallucination-detection-agent` | Hallucination Detection | output-verification | Verification report |
| `agent-evaluation-agent` | Agent Evaluation | agent-quality | Evaluation report |
| `runtime-coordination-agent` | Runtime Coordination | runtime-management | Runtime report |
| `cross-agent-continuity-agent` | Cross-Agent Continuity | session-continuity | Handoff package |

---

## Runtime Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `workflow-runtime-agent` | Workflow Runtime | workflow-execution | Execution log |
| `state-machine-systems-agent` | State Machine Systems | state-management | State report |
| `event-bus-systems-agent` | Event Bus Systems | event-management | Event log |
| `runtime-observability-agent` | Runtime Observability | runtime-monitoring | Observability report |
| `distributed-coordination-agent` | Distributed Coordination | distributed-execution | Coordination log |
| `agent-scheduling-agent` | Agent Scheduling | agent-scheduling | Schedule report |
| `execution-graph-systems-agent` | Execution Graph Systems | graph-execution | Graph report |

---

## Meta-Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `organization-evolution-agent` | Organization Evolution | org-improvement | Evolution proposal |
| `workflow-evolution-agent` | Workflow Evolution | workflow-improvement | Workflow RFC |
| `governance-evolution-agent` | Governance Evolution | governance-improvement | Governance RFC |
| `capability-gap-detection-agent` | Capability Gap Detection | gap-analysis | Gap report |
| `systems-optimization-agent` | Systems Optimization | system-improvement | Optimization plan |
| `organizational-simulation-agent` | Organizational Simulation | simulation | Simulation report |

---

## Connector + MCP Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `connector-architecture-agent` | Connector Architecture | integration-design | Integration ADR |
| `mcp-integration-agent` | MCP Integration | mcp-management | MCP catalog update |
| `enterprise-systems-agent` | Enterprise Systems | integration-health | Health report |
| `connector-builder-agent` | Connector Builder | connector-build | Connector spec file |
| `tool-capability-agent` | Tool Capability | tool-catalog | Tool catalog entry |
| `tool-gap-detection-agent` | Tool Gap Detection | gap-detection | Gap registration |
| `capability-expansion-agent` | Capability Expansion | gap-resolution | Resolution plan |

Full spec: `agents/connectors/connector-mcp-org.md`

---

## Artifact Execution Organization

| Agent ID | Role | Routing Key | Primary Output |
|---------|------|------------|---------------|
| `artifact-publishing-agent` | Artifact Publishing | artifact-publish | Published artifact |
| `audience-transformation-agent` | Audience Transformation | audience-review | Transformed content |
| `executive-communications-agent` | Executive Communications | executive-comms | Executive email |
| `technical-documentation-agent` | Technical Documentation | technical-docs | ADR / runbook / spec |
| `compliance-documentation-agent` | Compliance Documentation | compliance-evidence | Evidence package |
| `presentation-generation-agent` | Presentation Generation | presentation-create | PPTX / Gamma deck |
| `spreadsheet-generation-agent` | Spreadsheet Generation | spreadsheet-create | XLSX / CSV report |
| `diagram-generation-agent` | Diagram Generation | diagram-create | Figma / Mermaid diagram |
| `dashboard-generation-agent` | Dashboard Generation | dashboard-create | Tableau / PowerBI dashboard |

Full spec: `agents/artifacts/artifact-execution-org.md`

---

## Routing Authority Matrix

All routing decisions cascade through this priority order:

```
1. Constitutional decisions → executive-governance-council
2. Security-critical decisions → caio-agent + security-architect-agent
3. Cross-org strategic decisions → cpo-agent / cto-agent
4. Product gate decisions → supervisor-agent (via AI-native org)
5. Architecture decisions → enterprise-architecture-council
6. Domain-specific decisions → respective domain agent
7. Execution decisions → workflow-routing-agent
8. Autonomous execution → workflow-runtime-agent
```

---

## Agent Naming Convention

All agent IDs follow: `<role-slug>-agent` or `<council-name>` for councils.
All are loadable from `agents/<org>/` directory.
Routing keys are used in `orchestrator/routing-rules.md`.
