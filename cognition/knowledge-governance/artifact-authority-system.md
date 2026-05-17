---
layer: knowledge-governance
type: artifact-authority-system
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: enterprise-architecture-council
---

# Artifact Authority System

Every artifact in the Enterprise AI OS has exactly one authoritative owner. This file defines ownership, delegation rules, authority transfer protocols, and multi-agent artifact governance.

---

## Ownership Principles

### 1. One Owner Per Artifact Class
Each artifact class (PRD, ADR, Runbook, etc.) has one designated producing agent that holds authority over that artifact's content. Authority is not shared — it is held by one agent at a time.

### 2. Authority Is Explicit, Not Assumed
An agent does not gain authority over an artifact by modifying it. Authority transfers require an explicit Authority Transfer Record.

### 3. Reviewing ≠ Owning
An agent that reviews, gates, or approves an artifact does not become its owner. The producing agent retains ownership; the reviewing agent produces a review artifact of its own.

### 4. The Producing Workflow Assigns Authority
The workflow step that creates an artifact assigns the producing agent as its authority. If the workflow changes the owner (e.g., a PM hands off to an architect), the handoff artifact records the transfer.

---

## Artifact Authority Registry

| Artifact Class | Path Pattern | Authority Agent | Reviewer | Approver |
|---|---|---|---|---|
| Product Requirements Document | `prds/{date}-{slug}.md` | senior-pm-agent | group-pm-agent | vp-product-agent |
| Architecture Decision Record | `architecture/decisions/ADR-NNN-*.md` | principal-architect-agent | enterprise-architect-agent | enterprise-architecture-council |
| Request for Comments | `rfcs/{date}-{slug}.md` | initiating-agent | all-tagged-agents | enterprise-architecture-council |
| Threat Model | `security/{date}-{slug}-threat-model.md` | security-architect-agent | security-engineer-agent | vp-engineering-agent |
| Sprint Plan | `sprints/{sprint-id}/sprint-plan.md` | delivery-manager-agent | senior-pm-agent | vp-delivery-agent |
| Incident Report | `incidents/{date}-{slug}.md` | incident-manager-agent | delivery-manager-agent | vp-delivery-agent |
| Post-Mortem | `incidents/{date}-{slug}-postmortem.md` | incident-manager-agent | all-affected-agents | vp-engineering-agent |
| QA Test Plan | `qa/{date}-{slug}-testplan.md` | qa-agent | — | — |
| QA Verdict | `qa/{date}-{slug}-verdict.md` | qa-agent | supervisor-agent | — |
| Runbook | `wiki/runbooks/{slug}-runbook.md` | knowledge-systems-engineer-agent | relevant-ops-agent | — |
| Wiki Page | `wiki/{section}/{slug}.md` | domain-custodian | — | — |
| Memory Entry | `memory/{subdir}/{slug}.md` | MEMORY_INDEX.md-assigned owner | — | — |
| Handoff Envelope | `handoffs/{date}/*.md` | producing agent | — | — |
| Release Plan | `releases/{date}-{slug}.md` | release-governance-agent | delivery-manager-agent | vp-delivery-agent |
| Capability Gap | `integrations/CAPABILITY-GAP-TRACKER.md` | tool-gap-detection-agent | enterprise-systems-agent | — |
| Connector Spec | `integrations/{category}/{system}.md` | connector-builder-agent | connector-architecture-agent | enterprise-systems-agent |
| Knowledge Graph Node | `graph-models/nodes/{type}/{id}.md` | knowledge-systems-engineer-agent | — | — |
| Ontology Entry | `ontology/*.md` | knowledge-systems-architect-agent | principal-architect-agent | enterprise-architecture-council |

---

## Multi-Agent Artifacts

Some artifacts require contribution from multiple agents. These use the **Authority Arbiter** pattern:

### Pattern: Parallel Contribution + Arbiter Merge
1. Multiple agents produce sub-artifacts (each owns their section)
2. A designated arbiter agent synthesizes into the final artifact
3. The arbiter becomes the authority for the merged artifact
4. Source sub-artifacts are archived, not deleted

**Example:** Strategic gap analysis — architecture-agent analyzes technical gaps, product-agent analyzes PM gaps, strategy-agent analyzes strategic gaps, principal-architect-agent synthesizes into the master gap analysis document.

### Pattern: Sequential Authority Transfer
1. Agent A produces draft → holds authority
2. Agent A generates Authority Transfer Record, designates Agent B
3. Agent B reviews and approves → authority transfers to Agent B
4. Agent B becomes the authoritative owner; Agent A's role ends

---

## Authority Transfer Protocol

When ownership of an artifact must change:

```yaml
authority-transfer-record:
  transfer-id: "ATR-{UUID}"
  artifact-path: "{canonical-path}"
  artifact-version: "{version-hash}"
  transferring-from: "{agent-id}"
  transferring-to: "{agent-id}"
  transfer-reason: "{reason}"
  transfer-timestamp: "{ISO-8601}"
  conditions: "{any conditions on the transfer}"
  approved-by: "{human or T4+ agent if cross-org transfer}"
```

Authority Transfer Records are stored in `handoffs/authority-transfers/ATR-{date}-{UUID}.md`.

---

## Conflict of Authority

When two agents claim authority over the same artifact:

1. Check the producing workflow — which agent does it assign?
2. Check the Artifact Authority Registry — registry assignment wins over informal claims
3. If registry is silent, the agent that produced the FIRST version holds authority until explicit transfer
4. If genuinely ambiguous, `knowledge-systems-architect-agent` arbitrates

---

## Artifact Immutability Rules

| Artifact State | Mutability |
|---|---|
| DRAFT | Fully mutable by authority agent |
| REVIEW | Mutable by authority agent; reviewer annotations are separate |
| APPROVED | Immutable. New version required for changes. |
| SUPERSEDED | Immutable. Supersession record added only. |
| ARCHIVED | Immutable. No changes permitted. |

Approved artifacts may not be directly edited. A new version must be created, which goes through the approval process from the beginning. This preserves the decision audit trail.

---

## Artifact Lineage Tracking

Every artifact records its lineage:

```yaml
lineage:
  produced-by: "{agent-id}"
  produced-in: "{workflow-instance-id}"
  produced-at: "{timestamp}"
  inputs: ["{input-artifact-path}", ...]
  supersedes: "{prior-artifact-path}"  # null if first version
  superseded-by: null  # filled when this artifact is superseded
  authority-transfers: ["{ATR-id}", ...]
```

Lineage enables impact analysis: "If I change artifact X, what downstream artifacts are affected?"

---

## Structured Output Enforcement

All workflow-produced artifacts must conform to their artifact schema. Schemas are defined in `templates/{type}-template.md`. Agents may not produce free-form artifacts for schema-governed types. Adapted from TradingAgents' structured output discipline.

Validation occurs at:
1. Artifact creation: producing agent self-validates against schema
2. Gate passage: supervisor-agent validates schema conformance
3. Index update: knowledge-systems-agent validates before adding to cognition index
