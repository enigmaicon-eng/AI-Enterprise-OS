---
type: routing-table
version: 1.0.0
created: 2026-05-09
authority: executive-orchestrator-agent
supplement: orchestrator/routing-rules.md
---

# Enterprise AI OS — Complete Routing Table

> This table is the authoritative mapping from routing keys to agent IDs. The executive-orchestrator-agent reads this on every session start. Routing keys are lowercase-hyphenated. Multiple keys can route to the same agent.

---

## Routing Table

| Routing Key | Primary Agent | Fallback Agent | Authority Tier |
|-------------|--------------|----------------|---------------|
| `constitutional-decision` | `executive-governance-council` | Human operator | T5 |
| `ai-safety-review` | `caio-agent` | `ai-safety-governance-agent` | T5 |
| `ai-safety-*` | `caio-agent` | `ai-safety-governance-agent` | T5 |
| `security-critical` | `security-architect-agent` + `caio-agent` | `cto-agent` | T5 |
| `product-escalation` | `cpo-agent` | `vp-product-agent` | T5 |
| `architecture-escalation` | `cto-agent` | `enterprise-architecture-council` | T5 |
| `strategic-direction` | `organizational-strategy-council` | `cpo-agent` + `cto-agent` | T5 |
| `portfolio-governance` | `portfolio-governance-pm-agent` | `vp-product-agent` | T4 |
| `org-improvement` | `organization-evolution-agent` | `executive-governance-council` | T4 |
| `governance-improvement` | `governance-evolution-agent` | `executive-governance-council` | T4 |
| `workflow-improvement` | `workflow-evolution-agent` | `workflow-optimization-agent` | T4 |
| `gap-analysis` | `capability-gap-detection-agent` | `organization-evolution-agent` | T4 |
| `system-improvement` | `systems-optimization-agent` | `organization-evolution-agent` | T4 |
| `simulation` | `organizational-simulation-agent` | `systems-optimization-agent` | T4 |
| `principal-architecture` | `principal-architect-agent` | `enterprise-architect-agent` | T3 |
| `enterprise-architecture` | `enterprise-architect-agent` | `principal-architect-agent` | T3 |
| `api-design` | `api-architect-agent` | `principal-architect-agent` | T3 |
| `runtime-architecture` | `runtime-architect-agent` | `principal-architect-agent` | T3 |
| `ai-architecture` | `ai-systems-architect-agent` | `principal-architect-agent` | T3 |
| `security-design` | `security-architect-agent` | `principal-architect-agent` | T3 |
| `reliability-design` | `reliability-architect-agent` | `principal-architect-agent` | T3 |
| `data-architecture` | `data-architect-agent` | `enterprise-architect-agent` | T3 |
| `knowledge-architecture` | `knowledge-systems-architect-agent` | `data-architect-agent` | T3 |
| `event-architecture` | `event-systems-architect-agent` | `runtime-architect-agent` | T3 |
| `quality-verification` | `qa-agent` | `vp-engineering-agent` | T3 |
| `security-testing` | `security-qa-agent` | `qa-agent` | T3 |
| `performance-testing` | `performance-qa-agent` | `qa-agent` | T3 |
| `ai-quality-testing` | `ai-evaluation-qa-agent` | `qa-agent` | T3 |
| `workflow-testing` | `workflow-qa-agent` | `qa-agent` | T3 |
| `runtime-testing` | `runtime-qa-agent` | `qa-agent` | T3 |
| `governance-testing` | `governance-qa-agent` | `compliance-governance-agent` | T3 |
| `release-approval` | `release-governance-agent` | `vp-delivery-agent` | T3 |
| `rollout-coordination` | `rollout-governance-agent` | `release-governance-agent` | T3 |
| `risk-assessment` | `risk-management-agent` | `compliance-governance-agent` | T3 |
| `compliance-review` | `compliance-governance-agent` | `risk-management-agent` | T3 |
| `audit-preparation` | `audit-readiness-agent` | `compliance-governance-agent` | T3 |
| `ai-safety-review` | `ai-safety-governance-agent` | `caio-agent` | T3 |
| `approval-coordination` | `human-approval-governance-agent` | Human operator | T3 |
| `data-policy` | `data-governance-agent` | `compliance-governance-agent` | T3 |
| `controls-assessment` | `enterprise-controls-agent` | `audit-readiness-agent` | T3 |
| `feature-requirements` | `senior-pm-agent` | `vp-product-agent` | T2 |
| `cross-feature-alignment` | `group-pm-agent` | `vp-product-agent` | T2 |
| `platform-requirements` | `platform-pm-agent` | `vp-product-agent` | T2 |
| `technical-product` | `technical-pm-agent` | `senior-pm-agent` | T2 |
| `ai-feature-requirements` | `ai-product-manager-agent` | `senior-pm-agent` | T2 |
| `pricing-monetization` | `monetization-pm-agent` | `vp-product-agent` | T2 |
| `growth-experiments` | `growth-pm-agent` | `senior-pm-agent` | T2 |
| `marketplace-features` | `marketplace-pm-agent` | `senior-pm-agent` | T2 |
| `enterprise-requirements` | `enterprise-platform-pm-agent` | `senior-pm-agent` | T2 |
| `infra-product` | `infrastructure-pm-agent` | `platform-pm-agent` | T2 |
| `compliance-requirements` | `compliance-pm-agent` | `vp-product-agent` | T2 |
| `financial-product` | `fintech-pm-agent` | `compliance-pm-agent` | T2 |
| `mortgage-product` | `mortgage-pm-agent` | `fintech-pm-agent` | T2 |
| `process-optimization` | `product-operations-agent` | `vp-product-agent` | T2 |
| `stakeholder-coordination` | `stakeholder-alignment-agent` | `vp-product-agent` | T2 |
| `exec-communication` | `executive-communications-agent` | `vp-product-agent` | T2 |
| `incident-product` | `incident-coordination-agent` | `senior-pm-agent` | T2 |
| `release-product` | `release-readiness-agent` | `vp-product-agent` | T2 |
| `ai-governance-product` | `ai-governance-pm-agent` | `compliance-pm-agent` | T2 |
| `org-effectiveness` | `organizational-effectiveness-pm-agent` | `vp-product-agent` | T2 |
| `business-analysis` | `business-analyst-agent` | `senior-business-analyst-agent` | T2 |
| `complex-analysis` | `senior-business-analyst-agent` | `business-analyst-agent` | T2 |
| `process-improvement` | `process-optimization-agent` | `business-analyst-agent` | T2 |
| `workflow-review` | `workflow-analysis-agent` | `process-optimization-agent` | T2 |
| `enterprise-ops` | `enterprise-operations-agent` | `vp-delivery-agent` | T2 |
| `rules-governance` | `business-rules-governance-agent` | `compliance-governance-agent` | T2 |
| `sop-creation` | `sop-management-agent` | `business-analyst-agent` | T2 |
| `ops-readiness` | `operational-readiness-agent` | `delivery-manager-agent` | T2 |
| `strategy-direction` | `corporate-strategy-agent` | `organizational-strategy-council` | T2 |
| `portfolio-planning` | `portfolio-management-agent` | `corporate-strategy-agent` | T2 |
| `competitive-analysis` | `competitive-intelligence-agent` | `corporate-strategy-agent` | T2 |
| `financial-analysis` | `financial-modeling-agent` | `corporate-strategy-agent` | T2 |
| `investment-decision` | `investment-prioritization-agent` | `cpo-agent` | T2 |
| `roi-analysis` | `roi-governance-agent` | `financial-modeling-agent` | T2 |
| `strategic-decision` | `strategic-bets-agent` | `corporate-strategy-agent` | T2 |
| `ecosystem-analysis` | `ecosystem-mapping-agent` | `corporate-strategy-agent` | T2 |
| `technical-leadership` | `distinguished-engineer-agent` | `vp-engineering-agent` | T2 |
| `frontend-implementation` | `frontend-engineer-agent` | `vp-engineering-agent` | T1 |
| `backend-implementation` | `backend-engineer-agent` | `vp-engineering-agent` | T1 |
| `ai-implementation` | `ai-engineer-agent` | `distinguished-engineer-agent` | T1 |
| `ml-implementation` | `ml-systems-engineer-agent` | `ai-engineer-agent` | T1 |
| `runtime-implementation` | `runtime-engineer-agent` | `distinguished-engineer-agent` | T1 |
| `platform-implementation` | `platform-engineer-agent` | `backend-engineer-agent` | T1 |
| `devops-implementation` | `devops-engineer-agent` | `platform-engineer-agent` | T1 |
| `security-implementation` | `security-engineer-agent` | `backend-engineer-agent` | T1 |
| `workflow-implementation` | `workflow-systems-engineer-agent` | `runtime-engineer-agent` | T1 |
| `knowledge-implementation` | `knowledge-systems-engineer-agent` | `backend-engineer-agent` | T1 |
| `ux-strategy` | `ux-strategy-agent` | `vp-product-agent` | T2 |
| `user-research` | `ux-research-agent` | `ux-strategy-agent` | T2 |
| `design-system` | `design-systems-agent` | `ux-strategy-agent` | T2 |
| `conversation-design` | `conversational-ux-agent` | `ux-strategy-agent` | T2 |
| `ai-ux` | `ai-experience-design-agent` | `ux-strategy-agent` | T2 |
| `accessibility` | `accessibility-design-agent` | `ux-strategy-agent` | T2 |
| `delivery-coordination` | `delivery-manager-agent` | `vp-delivery-agent` | T2 |
| `program-coordination` | `program-manager-agent` | `vp-delivery-agent` | T2 |
| `dependency-management` | `dependency-coordination-agent` | `program-manager-agent` | T2 |
| `incident-response` | `incident-manager-agent` | `vp-engineering-agent` | T2 |
| `product-metrics` | `product-analytics-agent` | `vp-product-agent` | T2 |
| `metrics-standards` | `metrics-governance-agent` | `product-analytics-agent` | T2 |
| `ab-testing` | `experimentation-agent` | `product-analytics-agent` | T2 |
| `org-health` | `organizational-health-analytics-agent` | `enterprise-operations-agent` | T2 |
| `prediction-modeling` | `forecasting-agent` | `product-analytics-agent` | T2 |
| `ops-metrics` | `operational-analytics-agent` | `product-analytics-agent` | T2 |
| `customer-outcomes` | `customer-success-agent` | `vp-product-agent` | T2 |
| `support-coordination` | `support-operations-agent` | `customer-success-agent` | T2 |
| `customer-escalation` | `escalation-response-agent` | `cpo-agent` | T2 |
| `customer-insights` | `customer-intelligence-agent` | `customer-success-agent` | T2 |
| `workflow-execution` | `workflow-runtime-agent` | `runtime-coordination-agent` | T2 |
| `state-management` | `state-machine-systems-agent` | `workflow-runtime-agent` | T2 |
| `event-management` | `event-bus-systems-agent` | `runtime-coordination-agent` | T2 |
| `runtime-monitoring` | `runtime-observability-agent` | `runtime-coordination-agent` | T2 |
| `distributed-execution` | `distributed-coordination-agent` | `runtime-coordination-agent` | T2 |
| `agent-scheduling` | `agent-scheduling-agent` | `runtime-coordination-agent` | T2 |
| `graph-execution` | `execution-graph-systems-agent` | `agent-coordination-agent` | T2 |
| `workflow-selection` | `workflow-routing-agent` | `executive-orchestrator-agent` | T3 |
| `multi-agent-tasks` | `agent-coordination-agent` | `executive-orchestrator-agent` | T3 |
| `prompt-review` | `prompt-governance-agent` | `caio-agent` | T3 |
| `knowledge-management` | `knowledge-systems-agent` | `organizational-learning-agent` | T3 |
| `output-verification` | `hallucination-detection-agent` | `caio-agent` | T3 |
| `agent-quality` | `agent-evaluation-agent` | `caio-agent` | T3 |
| `runtime-management` | `runtime-coordination-agent` | `vp-engineering-agent` | T3 |
| `session-continuity` | `cross-agent-continuity-agent` | `executive-orchestrator-agent` | T3 |
| `learning-capture` | `organizational-learning-agent` | `knowledge-systems-agent` | T3 |

---

## Wildcard Routing Rules

| Pattern | Route To | Notes |
|---------|----------|-------|
| `*-escalation` | Respective org VP → executive | Escalation cascade up |
| `incident-*` | `incident-manager-agent` | All incident variants |
| `ai-safety-*` | `caio-agent` + `ai-safety-governance-agent` | Dual routing |
| `security-*` | `security-architect-agent` | Security-prefixed keys |
| `compliance-*` | `compliance-governance-agent` | Compliance-prefixed keys |

---

## Unresolvable Intent Protocol

When executive-orchestrator-agent cannot match an intent to a routing key:

1. Keyword classification against organization domains
2. Best-fit agent from domain + routing key similarity
3. If confidence < 70% → surface intent + candidate agents to human operator
4. Human operator selects agent or provides new routing key
5. New routing key added to this table if recurring

---

## Routing Priority Override

The following routing keys **always** preempt any queued routing:

1. `constitutional-decision` — immediate, all queues paused
2. `incident-response` (P0/P1) — immediate
3. `ai-safety-*` — immediate
4. `security-critical` — immediate
5. `approval-coordination` (pending H-NNN) — blocks dependent workflow

---
