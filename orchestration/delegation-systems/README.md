# Delegation Systems

**Layer:** Specialist Routing and Adaptive Delegation  
**Version:** 1.0.0  
**Depends on:** coordination-runtime/, agents/MASTER-REGISTRY.md, agents/ROUTING-TABLE.md

---

## Purpose

Delegation Systems route work to the right specialist agents, distribute load intelligently across the 144-agent topology, and adapt routing decisions based on performance history. They operationalize the MASTER-REGISTRY and ROUTING-TABLE into a live dispatch system.

---

## Components

| File | Responsibility |
|------|----------------|
| `specialist-router.md` | Capability-based routing from ROUTING-TABLE; 100+ routing keys |
| `adaptive-delegation.md` | Dynamic delegation adjusting based on success rates and load |
| `workload-distributor.md` | Load balancing; utilization-aware task assignment |
| `expertise-orchestrator.md` | Expertise scoring, task-capability matching, escalation protocol |

---

## Delegation Hierarchy

```
INTENT
  ↓
SPECIALIST ROUTER        ← Routing key lookup → agent(s)
  ↓
EXPERTISE ORCHESTRATOR   ← Score candidates, select best-fit
  ↓
WORKLOAD DISTRIBUTOR     ← Check utilization, balance load
  ↓
ADAPTIVE DELEGATION      ← Adjust routing based on outcomes
  ↓
ASSIGNED AGENT
```

---

## Routing Authority Cascade

From the MASTER-REGISTRY routing authority specification:

```
1. Constitutional decisions     → Constitution Guardian / Human
2. Security-critical actions    → Security QA + Governance
3. Cross-org workflows          → Master Orchestrator
4. Product gate decisions       → PM Lead + CPO
5. Architecture decisions       → Architecture Principal
6. Domain execution             → Domain specialist (from ROUTING-TABLE)
7. Execution tasks              → Engineering / QA / Delivery agents
8. Autonomous operations        → AI-Native agents (T3)
```

---

## Agent Capability Index

Delegation decisions reference this simplified capability profile per agent tier:

| Org | Key Capabilities | Routing Keys (sample) |
|-----|-----------------|----------------------|
| Executive | Strategic direction, constitutional decisions | `cpo`, `cto`, `caio`, `strategy_approval` |
| Product | PRD, discovery, prioritization, metrics | `prd`, `discovery`, `sprint_planning`, `user_story` |
| Architecture | ADR, RFC, system design, API contracts | `adr`, `rfc`, `system_design`, `api_design` |
| Engineering | Implementation, DevOps, AI development | `implement`, `backend`, `frontend`, `ai_dev`, `cicd` |
| QA | Testing, security audit, performance | `test_plan`, `security_review`, `perf_test` |
| Governance | Risk, compliance, audit, approvals | `risk_assessment`, `compliance`, `approval_required` |
| Delivery | Sprint execution, release, incident | `release`, `incident`, `dependency_mgmt` |
| Analytics | Metrics, experiments, forecasting | `metric_definition`, `experiment_design` |
| AI-Native | Orchestration, evaluation, continuity | `orchestrate`, `evaluate`, `continue_session` |

---

## Key Invariants

1. **Routing table is authoritative** — routing decisions follow ROUTING-TABLE.md, not improvisation
2. **Capability before availability** — match on capability first, then consider load
3. **Never route below authority tier** — a T5 decision cannot be delegated to T1
4. **Constitutional pre-check** — delegation engine checks §6.3 before any assignment
5. **Escalation path always defined** — every delegation has a clear escalation target
