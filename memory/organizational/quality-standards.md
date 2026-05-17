---
entry-id: ORG-QUAL-001
created: 2026-05-10
created-by: knowledge-systems-engineer-agent
domain: cross
importance: HIGH
permission-tier: OPEN
state: ACTIVE
tags: [quality, gates, standards, governance, testing, artifacts]
last-validated-at: 2026-05-10
---

# Quality Standards

Organizational quality standards for all artifacts produced by the Enterprise AI OS. These standards apply to all agents unless overridden by a domain-specific ADR.

**Authority:** `docs/governance/quality-gate-policy.md`, `docs/governance/principles.md`

---

## Artifact Quality Standards

### Tier 1: Critical Artifacts (PRDs, ADRs, Architecture Decisions)
| Standard | Requirement |
|---|---|
| Schema conformance | Must match template exactly |
| Completeness | All required sections present and non-empty |
| Internal consistency | No self-contradictions |
| Cross-reference validity | All referenced files exist |
| Authority sign-off | Requires T3+ agent review |
| Human gate | Requires human approval before binding |

### Tier 2: High Artifacts (Memory Entries, Wiki Pages, Workflow Definitions)
| Standard | Requirement |
|---|---|
| Schema conformance | Must match template or have frontmatter |
| Completeness | Core sections present (applicability, constraints) |
| Consistency check | Post-output check must pass (0 contradictions) |
| Authority sign-off | Owner review + 1 peer |
| Human gate | Not required (agent-produced) |

### Tier 3: Normal Artifacts (Sprint Capsules, Analysis Documents)
| Standard | Requirement |
|---|---|
| Schema conformance | Recommended, not required |
| Completeness | Purpose-appropriate |
| Consistency check | Spot-check on claims |
| Authority sign-off | Owner review only |
| Human gate | Not required |

---

## Quality Gate Policy

Per `docs/governance/principles.md` (Principle 3):

**Gate G1 — Artifact Schema Gate:**
Every artifact must conform to its declared schema before being passed to the next workflow step. Schema violations block the workflow and trigger a retry.

**Gate G2 — Consistency Gate:**
Every critical artifact is checked against the consistency anchor and master-cognition-index after production. If the post-output check returns 3+ contradictions → artifact is FAILED.

**Gate G3 — Authority Gate:**
Critical artifacts require a T3+ agent sign-off. High artifacts require T2+ sign-off. Gate passage is recorded in the artifact metadata.

**Gate G4 — Human Approval Gate:**
Certain artifacts require human approval before taking effect:
- New ADRs with binding constraints
- Governance principle changes
- Constitution amendments
- Significant scope or budget changes
- Security policy changes

The full list is in `constitution/human-approval-constitution.md`.

---

## Testing Standards

### Unit-Level (Agent Output Validation)
- Schema validation passes
- All required fields populated
- No placeholder text remaining
- Cross-references resolve

### Integration-Level (Workflow Artifact Chain)
- Output of step N is a valid input for step N+1
- No orphaned artifacts (every artifact is either consumed or archived)
- Gate records exist for all gate-requiring steps

### End-to-End (Workflow Completion)
- Workflow reaches COMPLETED state (not FAILED)
- All required deliverables present in output directory
- Session checkpoint written
- Wiki updated with new knowledge

---

## Quality Metrics

| Metric | Target | Owner |
|---|---|---|
| Schema validation pass rate | ≥98% | qa-lead-agent |
| Post-output consistency pass rate | ≥95% | knowledge-systems-architect-agent |
| Human gate rejection rate | <20% | delivery-lead-agent |
| Artifact completeness rate | ≥95% | qa-lead-agent |
| P0 element preservation through compression | 100% | context-routing-engine-agent |

---

## Applicability

These standards apply to:
- All workflow artifacts
- All memory entries (warm and hot tier)
- All wiki pages
- All ADRs and decision records

These standards do NOT apply to:
- Agent scratchpad content (ephemeral, not institutionalized)
- Session context cache (runtime, not persisted artifacts)
- External source material in `external-research/` (third-party, not produced by OS)