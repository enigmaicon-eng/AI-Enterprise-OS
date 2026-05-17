---
layer: state-models
type: artifact-state-machine
version: 1.0.0
created: 2026-05-09
owner: architect-agent
---

# Artifact State Machine

The canonical state machine for artifact lifecycle. All artifacts managed by the Enterprise AI OS follow these states.

---

## Artifact States

```
DRAFT
  │
  ↓ (submitted for review)
REVIEW
  │
  ├──→ APPROVED ──→ ACTIVE
  │                   │
  │                   ├──→ SUPERSEDED ──→ ARCHIVED
  │                   │
  │                   └──→ ARCHIVED (end of life)
  │
  └──→ REJECTED ──→ DRAFT (revision required)
```

---

## State Definitions

### DRAFT
The artifact is in progress. It exists at its canonical path but has not been submitted for gate review.
- **Who can read:** Creating agent; assigned reviewers
- **Who can write:** Creating agent only
- **Handoff use:** NOT permitted — drafts must not be referenced as inputs in handoffs as though approved
- **Frontmatter:** `status: draft`

### REVIEW
The artifact has been submitted to a quality gate. It is frozen while under review.
- **Who can read:** All agents
- **Who can write:** Nobody (frozen for review)
- **Handoff use:** Can be referenced as "pending approval" but downstream work should not begin
- **Frontmatter:** `status: review`

### APPROVED
The artifact has passed its quality gate. It is the authoritative version.
- **Who can read:** All agents
- **Who can write:** Nobody — modifications require creating a new DRAFT
- **Handoff use:** Fully permitted; this is the standard handoff state
- **Frontmatter:** `status: approved`

### ACTIVE
An APPROVED artifact that is currently in operational use. Identical to APPROVED for most purposes; used for artifacts that have ongoing operational effect (runbooks, ADRs, security policies).
- **Frontmatter:** `status: active`

### REJECTED
The artifact failed its quality gate. It must be revised and re-submitted.
- **Who can write:** Creating agent (for revision)
- **Required action:** Gate failure notes must be attached; agent must address all failure reasons before re-submitting
- **Frontmatter:** `status: rejected`

### SUPERSEDED
The artifact has been replaced by a newer version. The new version must link to it; it must link to the new version.
- **Still readable:** Yes — superseded artifacts are organizational history
- **Who can write:** Nobody (immutable)
- **Frontmatter:** `status: superseded`, `superseded-by: <path-to-new-artifact>`

### ARCHIVED
The artifact is no longer active and is kept for historical reference only.
- **Still readable:** Yes
- **Who can write:** Nobody
- **Frontmatter:** `status: archived`, `archived-date: YYYY-MM-DD`, `archived-reason: <reason>`

---

## State in Artifact Frontmatter

Every artifact managed by the OS must include these frontmatter fields:

```yaml
---
type: <artifact-type-code from ontology/artifact-taxonomy.md>
status: draft | review | approved | active | rejected | superseded | archived
version: 1.0.0
created: YYYY-MM-DD
owner: <agent-id>
gate: <gate-id if applicable>
canonical-path: <full relative path>
---
```

For superseded artifacts, add:
```yaml
superseded-by: architecture/decisions/ADR-002-auth-v2.md
superseded-date: YYYY-MM-DD
```

---

## Version Numbering

Artifacts use semantic versioning (MAJOR.MINOR.PATCH):
- **PATCH (1.0.0 → 1.0.1):** Typos, formatting, clarifications that don't change meaning
- **MINOR (1.0.0 → 1.1.0):** Additions or non-breaking changes
- **MAJOR (1.0.0 → 2.0.0):** Breaking changes, scope redefinitions, significant revisions after gate failure

Creating a new MAJOR version of an ADR or PRD effectively creates a new artifact. The old version transitions to SUPERSEDED.

---

## Artifact State Invariants

These rules must never be violated:

1. A DRAFT artifact must not be used as the sole basis for a gate PASS decision.
2. An APPROVED artifact must not be modified — create a new DRAFT version.
3. A SUPERSEDED artifact must always link to its replacement.
4. An ARCHIVED artifact must never be made ACTIVE again — create a new artifact.
5. A REJECTED artifact must not be referenced in any handoff until it is re-submitted and APPROVED.
6. No artifact in REVIEW may be written to — it is frozen until the gate resolves.

---

## Practical Example: PRD Lifecycle

```
1. pm-agent creates prds/2026-05-09-user-auth-redesign.md
   → status: draft

2. pm-agent completes draft, submits to G1 gate
   → status: review

3. supervisor-agent reviews
   → Option A: PASS → status: approved
   → Option B: FAIL → status: rejected (with comments)

4a. (approved) PRD becomes input to architecture workflow
    → status: active

4b. (rejected) pm-agent revises, resubmits
    → status: draft → review → approved

5. Scope changes mid-sprint → new PRD version required
   → Create prds/2026-05-09-user-auth-redesign-v2.md (draft)
   → On approval: original → status: superseded (links to v2)
   →              v2 → status: active
```
