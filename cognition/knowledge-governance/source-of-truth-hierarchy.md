---
layer: knowledge-governance
type: source-of-truth-hierarchy
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Source-of-Truth Hierarchy

The definitive ranking of knowledge authority in the Enterprise AI OS. When two sources make conflicting claims, the source at the higher tier is authoritative. The lower-tier source must be updated to align with the higher-tier source.

---

## The Seven-Tier Hierarchy

```
TIER 1: SUPREME — Enterprise Constitution
│   Path: constitution/enterprise-constitution.md
│   Authority: executive-governance-council (T5)
│   Override: None. No other document may contradict the constitution.
│   Change mechanism: Constitutional amendment (§14 procedure)
│   Scope: All organizational behavior, all agents, all workflows
│
TIER 2: BINDING — Architecture Decision Records (ADRs)
│   Path: architecture/decisions/ADR-NNN-*.md
│   Authority: enterprise-architecture-council (T4)
│   Override: Constitution only
│   Change mechanism: New ADR supersedes old ADR via RFC process
│   Scope: All technical implementation decisions
│
TIER 3: GOVERNING — Master Registries
│   Paths: agents/MASTER-REGISTRY.md, integrations/MASTER-INTEGRATION-REGISTRY.md
│   Authority: executive-orchestrator-agent (T3)
│   Override: ADRs and Constitution
│   Change mechanism: Explicit registry update by authority agent
│   Scope: Agent catalog, integration catalog, routing tables
│
TIER 4: AUTHORITATIVE — Organizational Wiki (Hot Tier)
│   Path: wiki/**/*.md
│   Authority: domain-owning agent (per wiki section)
│   Override: ADRs, Registries, Constitution
│   Change mechanism: Wiki maintenance workflow
│   Scope: Processes, runbooks, team knowledge, organizational learning
│
TIER 5: OPERATIONAL — Memory Entries (Warm Tier)
│   Path: memory/**/*.md
│   Authority: assigned memory entry owner (per MEMORY_INDEX.md)
│   Override: All tiers above
│   Change mechanism: Direct update by domain agent
│   Scope: Agent-accessible context, non-obvious constraints, patterns
│
TIER 6: CONTEXTUAL — Workflow Artifacts (Cold Tier)
│   Path: prds/, architecture/*, sprints/, incidents/, etc.
│   Authority: producing workflow's assigned agent
│   Override: All tiers above
│   Change mechanism: New version supersedes old (never delete)
│   Scope: Initiative-specific, time-bounded organizational output
│
TIER 7: EPHEMERAL — Session State
    Path: memory/workflow-state/*.checkpoint.md (in-session only)
    Authority: active workflow instance
    Override: All tiers above
    Change mechanism: Step completion (auto)
    Scope: In-flight execution state only; not authoritative for facts
```

---

## Conflict Resolution Rules

### Rule 1: Higher Tier Wins
When Tier A and Tier B conflict and A < B (A is higher), Tier A is authoritative. Tier B must be updated.

### Rule 2: Same Tier — Authority Agent Arbitrates
When two Tier 4 wiki pages conflict, the domain custodian for the disputed claim arbitrates. If the claim spans multiple domains, `knowledge-systems-architect-agent` arbitrates.

### Rule 3: Same Agent, Different Dates — Newer Wins
When the same agent produced two conflicting claims at different times, the more recent claim is authoritative, unless the older claim is protected by an ADR.

### Rule 4: Explicit Supersedes Implicit
An explicit, documented decision (ADR, wiki decision record) supersedes an implicit assumption in any artifact.

### Rule 5: Evidence Beats Opinion
A claim supported by data, metrics, or verified external sources supersedes a claim that is unsupported. When both are unsupported, escalate to domain custodian.

---

## Source-of-Truth by Data Domain

| Data Domain | Source of Truth | Tier | Owner Agent |
|---|---|---|---|
| Agent capability definitions | `agents/MASTER-REGISTRY.md` | T3 | executive-orchestrator-agent |
| Integration connectors | `integrations/MASTER-INTEGRATION-REGISTRY.md` | T3 | enterprise-systems-agent |
| Quality gates | `docs/governance/quality-gates.md` | T2 (governed by constitution) | enterprise-architecture-council |
| Governance principles | `docs/governance/principles.md` | T2 | executive-governance-council |
| Routing rules | `orchestrator/routing-rules.md` | T3 | executive-orchestrator-agent |
| Technical decisions | `architecture/decisions/ADR-NNN.md` | T2 | enterprise-architecture-council |
| Product decisions | `prds/` | T6 | senior-pm-agent |
| Sprint state | `sprints/` | T6 | delivery-manager-agent |
| Known risks | `memory/known-risks.md` | T5 | risk-management-agent |
| Open questions | `memory/open-questions.md` | T5 | orchestrator |
| Capability gaps | `integrations/CAPABILITY-GAP-TRACKER.md` | T5 | enterprise-systems-agent |
| Ontology | `ontology/` | T3 | knowledge-systems-architect-agent |
| Incident record | `incidents/` | T6 | incident-manager-agent |
| Knowledge graph | `graph-models/` | T4 | knowledge-systems-architect-agent |

---

## When a Lower Tier Contradicts a Higher Tier

This is the most common knowledge governance event. Protocol:

1. **Detection:** `hallucination-detection-agent` or any agent reading the contradiction
2. **Logging:** Create entry in `knowledge-governance/contradiction-log.md` (if not exists, create it)
3. **Notification:** `knowledge-systems-agent` notified
4. **Analysis:** Is the higher-tier source itself correct? Or is it the source that needs update?
   - If higher-tier is wrong → open RFC to update higher-tier source
   - If lower-tier is wrong → update lower-tier source immediately
5. **Resolution:** Update lower-tier to reference and align with higher-tier
6. **Verification:** `knowledge-systems-agent` confirms resolution

Turnaround SLA: 48 hours for detected contradictions.

---

## External Source Integration

When external sources (external-research repos, vendor documentation, academic papers) are used:

- External sources have no tier — they are **inputs**, not **authorities**
- Claims derived from external sources must be validated before entering Tier 4 or above
- External source citations are tracked in `wiki/research/external-research-index.md`
- External sources that contradict internal authoritative documents are flagged for review — the internal document is presumed correct unless evidence strongly suggests otherwise

---

## Raft Leader Assignment per Domain

At session start, the executive-orchestrator-agent assigns a Raft-style domain leader for each active knowledge domain. The domain leader holds authoritative state for that domain during the session and resolves intra-session conflicts.

| Domain | Default Raft Leader |
|---|---|
| Product decisions | senior-pm-agent |
| Architecture decisions | principal-architect-agent |
| Engineering implementation | distinguished-engineer-agent |
| Quality standards | qa-agent |
| Security posture | security-architect-agent |
| Organizational knowledge | knowledge-systems-architect-agent |
| Governance & compliance | compliance-governance-agent |
| Integration state | enterprise-systems-agent |
