---
layer: knowledge-governance
type: knowledge-lifecycle-system
version: 1.0.0
created: 2026-05-10
owner: organizational-learning-agent
authority: knowledge-systems-architect-agent
---

# Knowledge Lifecycle System

The complete lifecycle of organizational knowledge in the Enterprise AI OS — from initial creation through active use, validation, evolution, and eventual archival.

---

## Knowledge States

```
CREATED ──validate──► ACTIVE ──invalidate──► STALE ──revalidate──► ACTIVE
   │                    │                      │
   │                  evolve                 archive
   │                    │                      │
   └──reject────► REJECTED                ARCHIVED
                                              │
                                       superseded_by
                                              │
                                          SUPERSEDED
```

| State | Description | Mutable? | Loadable? |
|---|---|---|---|
| CREATED | Just written, not yet validated | Yes | No (not yet indexed) |
| ACTIVE | Validated, indexed, in regular use | Yes (minor updates) | Yes |
| STALE | Exceeded validation interval | No (frozen until revalidated) | Yes (with STALE flag) |
| REJECTED | Created but found to contain errors | No | No |
| ARCHIVED | No longer relevant; historical record | No | No (cold tier) |
| SUPERSEDED | Replaced by a newer artifact | No | No (link to successor only) |

---

## State Transition Rules

### CREATED → ACTIVE
Triggered by: producing agent completes validation self-check + knowledge-systems-agent indexes the entry
Requirements:
- Artifact conforms to its schema
- No direct contradiction with T3+ sources
- Producing agent is authorized to create this artifact type
- Cross-link analysis complete

### ACTIVE → STALE
Triggered by: staleness cron (weekly check) detecting validation interval exceeded
Validation intervals:
- CRITICAL memory entries: 45 days
- HIGH memory entries: 90 days
- NORMAL memory entries: 180 days
- Wiki pages: 90 days for processes, 180 days for reference, 365 days for historical

### STALE → ACTIVE
Triggered by: domain custodian performs validation review and confirms accuracy
Validation process:
1. Read the entry
2. Cross-reference against current T3+ sources
3. If still accurate: update `last-validated` timestamp, state → ACTIVE
4. If inaccurate: update entry, note what changed, state → ACTIVE with updated content
5. If no longer relevant: initiate deprecation → ARCHIVED

### ACTIVE → ARCHIVED
Triggered by: organizational-learning-agent proposes archival, knowledge-systems-architect-agent approves
Archival requirements:
1. EWC Check: all unique knowledge in the artifact is captured elsewhere
2. Cross-link update: all incoming links updated to point to successor or note archival
3. Index update: MEMORY_INDEX.md removes active entry, adds archive reference

### ACTIVE → SUPERSEDED
Triggered by: a new artifact explicitly supersedes this one
Requirements:
1. Superseding artifact is in ACTIVE state
2. Superseded artifact has a `superseded-by` frontmatter field pointing to successor
3. Both artifacts cross-link each other
4. All downstream references to the superseded artifact are updated

---

## Knowledge Creation Protocol

When a new knowledge artifact is created:

```
STEP 1: DRAFT
  - Agent writes artifact in draft state
  - Stored at canonical path with -draft suffix or in drafts/ subdirectory
  - Not indexed, not cross-linked

STEP 2: SELF-VALIDATE
  - Producing agent verifies:
    - Schema conformance
    - No claims contradicting T3+ sources
    - Authority to create this artifact type
    - All required frontmatter present

STEP 3: CROSS-REFERENCE CHECK
  - knowledge-systems-agent scans MEMORY_INDEX.md and wiki/index.md
  - Identifies: related existing artifacts, potential duplicates, missing cross-links
  - If duplicate detected: producing agent decides merge vs. separate artifact

STEP 4: ACTIVATE
  - Remove -draft suffix
  - Add to MEMORY_INDEX.md (warm tier) or wiki/index.md (hot tier)
  - Create cross-links to related artifacts
  - State: ACTIVE
  - Emit: memory.entry.created event

STEP 5: INDEX UPDATE
  - cognition-indexes/master-cognition-index.md updated with new terms
  - Semantic cluster assignment determined
  - Graph node created if artifact is a graph-indexed entity
```

---

## Knowledge Evolution Protocol

When an existing knowledge artifact needs significant updates:

```
CASE A: Minor updates (typo, clarification, non-semantic change)
  → Direct edit allowed by authority agent
  → No state change required
  → Update `last-modified` timestamp

CASE B: Content update (fact changes, new information, decision updates)
  → Authority agent edits artifact
  → Triggers: cross-reference check (do related artifacts need updating?)
  → Triggers: contradiction check (does this create any new contradictions?)
  → Triggers: index update (do cognition indexes need updating?)
  → Update `last-modified` and `version` in frontmatter

CASE C: Structural change (new sections, reorganization, scope change)
  → Requires: knowledge-systems-architect-agent review
  → Produces: updated artifact + change summary in artifact frontmatter
  → Triggers: full cross-link audit

CASE D: Semantic redefinition (term or concept fundamentally changes)
  → Requires: ADR if the definition is in the ontology
  → Produces: updated ontology entry + update-sweep across all affected artifacts
  → Triggers: knowledge-systems-engineer-agent executes the update sweep
```

---

## Knowledge Archival Protocol

```
TRIGGER: organizational-learning-agent identifies artifact for archival

STEP 1: EWC CHECK (Irreversibility Check)
  - Extract all unique knowledge claims from the artifact
  - For each claim: verify it appears in at least one other ACTIVE artifact
  - If any unique claim not found elsewhere: BLOCK archival
  - Transfer unique knowledge to the designated successor artifact
  
STEP 2: CROSS-LINK AUDIT
  - Find all artifacts linking to this artifact
  - Update each incoming link to point to successor or mark as historical reference
  - Record: {artifact-path, incoming-link-count, updated-links}

STEP 3: INDEX REMOVAL
  - Remove from MEMORY_INDEX.md active section
  - Add to MEMORY_INDEX.md archive section
  - Remove from cognition indexes (active entries)
  - Retain in cold-tier catalog

STEP 4: STATE TRANSITION
  - Update frontmatter: state → ARCHIVED
  - Add: `archived-at`, `archived-by`, `archival-reason`
  - Add: `unique-knowledge-transferred-to` list
  - Do not delete the file

STEP 5: EMIT EVENT
  - Emit: memory.entry.archived event
```

---

## Knowledge Failure Modes

Documented failure modes from `memory/failures/` that affect knowledge:

| Failure Mode | Description | Prevention |
|---|---|---|
| Silent staleness | Stale knowledge loaded into agent context without staleness flag | All context packages check entry state before inclusion |
| Orphan knowledge | Archived artifact still referenced by active artifacts | EWC check + cross-link audit before archival |
| Authority vacuum | Domain custodian changes without knowledge handoff | Ownership transfer recorded in MEMORY_INDEX.md |
| Synthesis loss | Synthesis process loses unique knowledge from source documents | EWC check after every CONSOLIDATE step |
| Index drift | Cognition index not updated when artifact changes | Index update is mandatory step in all knowledge mutation protocols |
| Contradiction accumulation | Contradictions accumulate faster than they are resolved | Weekly reconciliation cron maintains zero-backlog target |
