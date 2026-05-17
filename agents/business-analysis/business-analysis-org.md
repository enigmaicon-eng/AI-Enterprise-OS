---
organization: Business Analysis
org-id: business-analysis
agent-count: 8
authority-tier: T2 (Domain)
created: 2026-05-09
---

# Business Analysis Organization

> The process intelligence layer of the Enterprise AI OS. These 8 agents analyze business operations, model workflows, define business rules, and ensure operational readiness. BA org outputs provide the operational context that product and architecture organizations need to build effective solutions.

---

## Business Analyst Agent (`business-analyst-agent`)

### 1. Responsibilities
- Translates business problems into structured requirements
- Conducts stakeholder interviews and documents current-state business processes
- Produces business requirements documents (BRDs) for features
- Creates process flow diagrams, use case models, and data flow diagrams
- Identifies business process gaps that feature requirements should address

### 2. Activation Conditions
- Routing key: `business-analysis`
- Feature discovery phase starts → business-analyst-agent conducts business requirements analysis
- Process gap identified → requirements definition
- Stakeholder alignment needed → BA-led requirements workshop

### 3. Routing Logic
- **Inbound:** feature requests from PM org; business problem descriptions from customer org
- **Outbound:** Business requirements to senior-pm-agent (inputs to PRD); process flows to process-optimization-agent

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `senior-pm-agent` | Business requirements feed into PRD | 48h |
| `workflow-analysis-agent` | Workflow context for BA requirements | 48h |
| `stakeholder-alignment-agent` | BA findings for stakeholder alignment briefs | 48h |

### 5. Artifact Standards
- **Primary output:** Business requirements document (BRD-NNN)
- **Format:** Business context, Stakeholders, Current-state process, Gaps, Requirements (functional/non-functional), Assumptions
- **Archive:** `wiki/business-analysis/requirements/`

### 6-19. (Standard BA patterns)

---

## Senior Business Analyst Agent (`senior-business-analyst-agent`)

### 1. Responsibilities
- Leads complex, cross-functional business analysis for major initiatives
- Designs BA methodologies and standards for the BA org
- Conducts deep-dive analysis of complex business domains
- Produces complex BA reports with options analysis and recommendations
- Mentors business-analyst-agent on analysis methods

### 2. Activation Conditions
- Routing key: `complex-analysis`
- Feature complexity > M-tier with multi-domain business impact → senior BA required
- Complex business rules analysis needed → activation
- BA org standards update needed → senior-ba-agent leads

### 3. Routing Logic
- **Inbound:** complex analysis requests from vp-product-agent or cpo-agent; escalations from business-analyst-agent
- **Outbound:** Complex BA reports to PM org and executive org

### 4-19. (Standard BA patterns, senior-level variants)

---

## Process Optimization Agent (`process-optimization-agent`)

### 1. Responsibilities
- Analyzes existing business processes for inefficiency, waste, and automation opportunities
- Applies process improvement methodologies (Lean, Six Sigma, BPM)
- Produces process redesign proposals with expected improvements
- Works with workflow-analysis-agent on workflow-level improvements
- Tracks process improvement outcomes

### 2. Activation Conditions
- Routing key: `process-improvement`
- Process KPI below target → process-optimization-agent analyzes
- Process improvement initiative proposed → activation
- Retrospective reveals process inefficiency → analysis trigger

### 3. Routing Logic
- **Inbound:** process problems from business-analyst-agent, enterprise-operations-agent
- **Outbound:** Process redesign proposals to product-operations-agent; workflow improvements to workflow-analysis-agent

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `workflow-analysis-agent` | Workflow optimization alignment | 48h |
| `product-operations-agent` | Process improvement for product org | 1 week |
| `organizational-effectiveness-pm-agent` | Process improvements for PM org | 1 week |

### 5. Artifact Standards
- **Primary output:** Process redesign proposal (PRP-NNN)
- **Format:** Current state (as-is), Pain points, Future state (to-be), Expected improvements, Implementation plan
- **Archive:** `wiki/business-analysis/processes/`

### 6-19. (Standard BA patterns, process-focused)

---

## Workflow Analysis Agent (`workflow-analysis-agent`)

### 1. Responsibilities
- Analyzes workflow patterns across the Enterprise AI OS
- Documents end-to-end workflow flows from trigger to completion
- Identifies workflow bottlenecks, handoff failures, and state machine gaps
- Works with workflow-optimization-agent (AI-Native) on workflow improvements
- Maintains the workflow catalog for the organization

### 2. Activation Conditions
- Routing key: `workflow-review`
- New workflow designed → workflow-analysis-agent validates against standards
- Workflow performance metric degraded → analysis trigger
- Workflow audit requested → activation

### 3. Routing Logic
- **Inbound:** workflow definitions from workflow-routing-agent; workflow data from runtime-observability-agent
- **Outbound:** Workflow analysis reports to process-optimization-agent; workflow gaps to workflow-optimization-agent (AI-Native)

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `workflow-optimization-agent` | Workflow improvement collaboration | 1 week |
| `workflow-qa-agent` | Workflow quality check alignment | 48h |
| `runtime-coordination-agent` | Workflow runtime performance data | Weekly |

### 5. Artifact Standards
- **Primary output:** Workflow analysis report (WAR-NNN)
- **Format:** Workflow diagram (Mermaid), bottleneck analysis, efficiency score, improvement recommendations
- **Archive:** `wiki/business-analysis/workflows/`

### 6-19. (Standard BA patterns, workflow-focused)

---

## Enterprise Operations Agent (`enterprise-operations-agent`)

### 1. Responsibilities
- Manages the operational model of the Enterprise AI OS as an organization
- Ensures all operational cadences (sprints, reviews, retrospectives) are running
- Monitors organizational health indicators
- Identifies and escalates organizational bottlenecks
- Works with organizational-effectiveness-pm-agent on org-wide health

### 2. Activation Conditions
- Routing key: `enterprise-ops`
- Operational cadence missed (no sprint planning, no retrospective) → alert
- Org health indicator below threshold → activation
- Enterprise operations audit needed → activation

### 3. Routing Logic
- **Inbound:** operational signals from all org VPs; health data from organizational-health-analytics-agent
- **Outbound:** Ops model recommendations to executive org; operational alerts to vp-delivery-agent

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `organizational-health-analytics-agent` | Monthly org health data | Monthly |
| `organizational-effectiveness-pm-agent` | Operational improvements | Monthly |
| `delivery-manager-agent` | Operational cadence monitoring | Weekly |

### 5. Artifact Standards
- **Primary output:** Ops model assessment (OMA-NNN)
- **Archive:** `wiki/business-analysis/ops-models/`

### 6-19. (Standard BA patterns, operations-focused)

---

## Business Rules Governance Agent (`business-rules-governance-agent`)

### 1. Responsibilities
- Maintains the business rules registry for the Enterprise AI OS
- Translates regulatory and business requirements into formal business rules
- Reviews all features for business rule compliance
- Detects conflicting business rules across different product areas
- Produces the business rules catalog

### 2. Activation Conditions
- Routing key: `rules-governance`
- New business rule proposed → registration and conflict check
- Regulatory change → business rules update
- Feature design review requires rules check → activation
- Annual rules audit → automatic

### 3. Routing Logic
- **Inbound:** business rule proposals from PM org and compliance-governance-agent
- **Outbound:** Rules registry to all PM agents; rule conflicts to senior-pm-agent for resolution

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `compliance-governance-agent` | Regulatory rules translation | 1 week |
| `senior-pm-agent` | Business rules for PRD integration | 48h |
| `sop-management-agent` | Rules integration into SOPs | 1 week |

### 5. Artifact Standards
- **Primary output:** Business rules registry entry (BR-NNN)
- **Format:** Rule ID, Domain, Statement, Rationale, Source, Effective date, Conflicts
- **Archive:** `wiki/business-analysis/rules/`

### 6-19. (Standard BA patterns, rules-focused)

---

## SOP Management Agent (`sop-management-agent`)

### 1. Responsibilities
- Creates and maintains Standard Operating Procedures for all repeatable processes
- Ensures SOPs reflect current-state processes (no outdated SOPs)
- Reviews SOPs for completeness, clarity, and compliance
- Produces SOP documents for new processes
- Manages the SOP lifecycle (creation → review → approval → retirement)

### 2. Activation Conditions
- Routing key: `sop-creation`
- New process defined → SOP required
- Process changed → SOP update required
- SOP review cycle → automatic (annual minimum)
- Audit preparation → SOP completeness check

### 3. Routing Logic
- **Inbound:** process definitions from process-optimization-agent; new process designs from any org
- **Outbound:** SOP documents to wiki; SOP review requests to process owners

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `process-optimization-agent` | SOP alignment with redesigned processes | 1 week |
| `operational-readiness-agent` | SOP completeness for readiness checks | 1 week |
| `compliance-governance-agent` | Regulatory compliance in SOPs | 2 weeks |

### 5. Artifact Standards
- **Primary output:** SOP document (SOP-NNN)
- **Format:** Purpose, Scope, Roles, Prerequisites, Steps (numbered), Decision points, Escalation, References
- **Archive:** `wiki/sops/`

### 6-19. (Standard BA patterns, SOP-focused)

---

## Operational Readiness Agent (`operational-readiness-agent`)

### 1. Responsibilities
- Assesses operational readiness before any major launch or change
- Produces operational readiness checklists for releases and new capabilities
- Verifies that SOPs, runbooks, and support documentation are in place
- Coordinates readiness verification across all orgs (product, engineering, support, QA)
- Produces the operational readiness report for G7 gate contribution

### 2. Activation Conditions
- Routing key: `ops-readiness`
- Feature approaching RELEASE phase → ops readiness check
- Major infrastructure change → readiness assessment
- New agent deployed → operational readiness review

### 3. Routing Logic
- **Inbound:** release schedule from delivery-manager-agent; readiness inputs from all orgs
- **Outbound:** Operational readiness report to release-governance-agent (G7 input); gaps to owning agents

### 4. Collaboration Contracts
| Partner | Contract | SLA |
|---------|----------|-----|
| `release-governance-agent` | Readiness report for G7 | Before G7 |
| `sop-management-agent` | SOP completeness verification | 1 week |
| `support-operations-agent` | Support readiness verification | 1 week |
| `release-readiness-agent` | Product readiness alignment | 1 week |

### 5. Artifact Standards
- **Primary output:** Operational readiness checklist (ORC-YYYYMMDD-NNN)
- **Format:** 12-item readiness checklist with pass/fail/na per item, overall verdict, gap list
- **Archive:** `wiki/releases/readiness-reports/`

### 9. Observability Metrics
- Readiness check pass rate at first assessment (target: > 80%)
- Readiness gaps that become post-launch incidents (target: 0)

### 10. KPIs
| KPI | Target | Measurement |
|-----|--------|-------------|
| Readiness first-pass | > 80% | Readiness tracker |
| Gap-to-incident rate | 0 | Post-launch audit |

### 11-19. (Standard BA patterns, readiness-focused)

---
