---
type: collaboration-contracts
version: 1.0.0
created: 2026-05-09
authority: executive-orchestrator-agent
---

# Cross-Organization Collaboration Contracts

> This document defines the binding collaboration agreements between organizations. Individual agent-level contracts live in each org's agent definition file. This document covers the **inter-organizational** contracts — the agreements between org-level authorities that govern how organizations work together.

---

## Tier 1: Product ↔ Architecture

**Nature:** Product defines what; Architecture defines how. Architecture cannot start without an approved PRD. Product cannot proceed past DESIGN without Architecture sign-off.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| G1 → G2 handoff | vp-product-agent | PRD approved at G1 | 48h | Approved PRD + handoff package |
| G2 approval | principal-architect-agent | Architecture review complete | 1 week | Architecture sign-off |
| Feasibility check | senior-pm-agent + principal-architect-agent | PRD DESIGN phase start | 48h | Feasibility assessment |
| Architecture constraints → PRD update | architecture org → PM org | ADR changes affect feature | 48h | Updated PRD |

**Conflict resolution:** vp-product-agent + cto-agent joint decision. cpo-agent if unresolved.

---

## Tier 2: Architecture ↔ Engineering

**Nature:** Architecture decides; Engineering implements. Engineering cannot deviate from ADRs without architecture org waiver.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| ADR → implementation handoff | enterprise-architecture-council | ADR ratified | 48h | Implementation spec |
| Engineering RFC → architecture review | distinguished-engineer-agent | L-tier technical issue | 48h | RFC review |
| Architecture waiver | principal-architect-agent | Engineering needs deviation | 24h | Waiver document + ADR amendment |
| Implementation concern feedback | vp-engineering-agent → architecture org | Unfeasible requirement | 24h | Feasibility report |

**Conflict resolution:** cto-agent final authority.

---

## Tier 3: Engineering ↔ QA

**Nature:** Engineering builds; QA verifies. No feature proceeds to RELEASE without QA sign-off.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| Build handoff to QA | vp-engineering-agent | BUILD complete | 24h | Build + test documentation |
| G4 gate | qa-agent | QA complete | 3 days | QA sign-off report |
| Defect return | qa-agent | P0/P1 defect found | 4h | Defect report with severity |
| Test requirements provision | qa-agent → engineering | Sprint start | Sprint start | Test plan |

**Conflict resolution:** vp-engineering-agent + qa-agent joint. vp-delivery-agent if timeline conflict.

---

## Tier 4: QA ↔ Delivery

**Nature:** QA gates; Delivery coordinates timing and release. Delivery cannot schedule release without QA clearance.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| G4 sign-off → G7 pipeline | qa-agent → release-governance-agent | G4 approved | Immediate | G4 approval record |
| Release schedule alignment | delivery-manager-agent ↔ qa-agent | Sprint planning | Sprint start | Sprint plan with QA windows |
| Emergency release protocol | release-governance-agent + qa-agent | P0 incident hotfix | 4h expedited | Expedited G4 sign-off |

**Conflict resolution:** vp-delivery-agent.

---

## Tier 5: Product ↔ UX

**Nature:** Product defines requirements; UX defines the user experience. Neither can ship without the other's sign-off for consumer-facing features.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| PRD → UX brief | senior-pm-agent → ux-strategy-agent | G1 approved | 48h | UX brief |
| UX design → Product review | ux-strategy-agent → senior-pm-agent | Design complete | 24h | Design review |
| UX sign-off (G4 UX) | ux-strategy-agent | UX validation complete | 3 days | UX sign-off |
| Feature scope → UX impact | senior-pm-agent → ux-strategy-agent | Scope change | 24h | UX impact assessment |

**Conflict resolution:** vp-product-agent + ux-strategy-agent joint.

---

## Tier 6: Product ↔ Analytics

**Nature:** Product defines success criteria; Analytics measures them. No feature ships without defined metrics.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| Metrics definition | senior-pm-agent + product-analytics-agent | DESIGN phase | 48h | Metrics spec |
| Dashboard setup | product-analytics-agent | Pre-RELEASE | Before G7 | Dashboard ready |
| Feature performance report | product-analytics-agent → senior-pm-agent | GROWTH phase | Monthly | Analytics report |
| Pivot recommendation | product-analytics-agent → senior-pm-agent | Metric below threshold | 48h | Analytical brief |

---

## Tier 7: Engineering ↔ Security

**Nature:** Security is not optional. Security review is a mandatory gate (G3) for all security-sensitive features.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| G3 gate | security-architect-agent | Security design review | 1 week | Threat model + G3 sign-off |
| Security controls review | security-engineer-agent → engineering | Implementation security review | 24h | Security review comments |
| Vulnerability report | security-qa-agent → security-engineer-agent | Security test finds vuln | 4h (critical) | Vuln report |
| Security waiver | security-architect-agent | Known risk accepted | H-011 required | Waiver + human approval |

**Hard rule:** No feature with unmitigated Critical/High vulnerabilities ships. Period.

---

## Tier 8: Governance ↔ All Organizations

**Nature:** Governance is supreme. No organization can override a governance requirement without the formal exception process.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| Risk assessment | risk-management-agent | New initiative > risk threshold | 1 week | Risk report |
| Compliance review | compliance-governance-agent | Regulated domain feature | 1 week | Compliance review |
| Human approval | human-approval-governance-agent | H-NNN rule triggered | Per H-NNN SLA | Approval request + decision |
| Governance audit | governance-qa-agent | Monthly | Monthly | Governance audit report |

**Exception process:** Governance can only be overridden with human operator approval (H-019). No executive agent can bypass governance unilaterally.

---

## Tier 9: AI-Native ↔ All Organizations

**Nature:** AI-Native coordinates; all orgs route through it. No agent activates without going through executive-orchestrator-agent.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| All intent routing | executive-orchestrator-agent | Any user intent | < 2s | Routing decision |
| Knowledge capture | knowledge-systems-agent ← all agents | New knowledge generated | 24h | Wiki/memory update |
| Session continuity | cross-agent-continuity-agent | Session boundaries | Session boundary | Handoff package |
| Hallucination review | hallucination-detection-agent | Any AI output | Continuous | Verification report |

---

## Tier 10: Meta-Org ↔ All Organizations

**Nature:** Meta-org improves the OS. All orgs contribute signals; meta-org proposes improvements; executive ratifies.

| Contract | Owner | Trigger | SLA | Artifact |
|----------|-------|---------|-----|---------|
| Gap signals | All orgs → capability-gap-detection-agent | Capability limitation discovered | Weekly | Gap report |
| Evolution proposal | organization-evolution-agent → exec-governance-council | Gap analysis complete | 1 week | Evolution proposal |
| Simulation | organizational-simulation-agent ← evolution proposals | Pre-implementation | 48h | Simulation report |
| Phase transition | organization-evolution-agent | Roadmap milestone | Per roadmap | Phase transition report |

---

## Contract Violation Protocol

When a collaboration contract is violated:

1. **Detect:** The receiving agent identifies the breach (late delivery, wrong format, missing artifact)
2. **Notify:** Notify the contract owner agent within 4h of detection
3. **Escalate:** If breach not resolved within the contract SLA + 50%, escalate to org VP
4. **Record:** Log the breach to `memory/known-risks.md` with root cause
5. **Prevent:** Route to organizational-learning-agent for pattern analysis

**Repeated violations (3+ in a quarter):** escalate to executive-governance-council as governance concern.

---
