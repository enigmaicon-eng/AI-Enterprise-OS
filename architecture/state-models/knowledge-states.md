---
layer: state-models
type: knowledge-states
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
---

# Knowledge Artifact State Machine

Defines all states a knowledge artifact (memory entry, wiki page, ADR, decision record) can be in, valid transitions, and governance rules at each state.

---

## State Diagram

```
                ┌───────────────────────────────────┐
                │            PROPOSED               │
                │ (draft, not yet active)            │
                └───────────────┬───────────────────┘
                                │ APPROVE
                                │ (owner + authority validate)
                                ▼
                ┌───────────────────────────────────┐         ┌───────────────┐
                │             ACTIVE                │────────►│   STALE       │
                │ (current, loaded in context)      │ AGE     │ (past TTL,    │
                └───┬───────┬──────────┬────────────┘ TRIGGER │  verify req'd)│
                    │       │          │                        └──────┬────────┘
           SUPERSEDE│  REJECT│  ARCHIVE │                             │
                    │       │          │                         REACTIVATE or
                    ▼       ▼          ▼                         ARCHIVE
           ┌──────────────┐ ┌──────────────┐
           │  SUPERSEDED  │ │   ARCHIVED   │◄──────────────────────────┘
           └──────────────┘ │              │
                            │              │
                            └──────────────┘
                                           ▲
                                     ARCHIVE│
                                           │
                            ┌──────────────┐
                            │   REJECTED   │
                            └──────────────┘
```

---

## State Definitions

### PROPOSED
- **Description:** Knowledge artifact has been drafted but not yet validated as authoritative.
- **Mutability:** Freely editable by owning agent
- **Loadability:** NOT loaded in context packages (not yet authoritative)
- **Storage:** `memory/drafts/` or inline in workflow scratchpad
- **TTL:** 7 days; expires to REJECTED if not approved
- **Required for approval:** Owner review + at least one authority-tier agent review

### ACTIVE
- **Description:** Artifact is authoritative, current, and loaded in context packages.
- **Mutability:** Editable only via formal evolution protocol (patch or supersede)
- **Loadability:** Loaded based on domain, priority tier, and relevance score
- **Staleness trigger:** Varies by importance tier:
  - CRITICAL entries: 90 days since last validation
  - HIGH entries: 180 days since last validation
  - NORMAL entries: 365 days since last validation
- **Context priority:** P2 (domain CRITICAL/HIGH) or P4 (NORMAL), per context-prioritization.md

### STALE
- **Description:** Artifact has exceeded its validation TTL and requires review before continued use.
- **Mutability:** Owner can update to return to ACTIVE
- **Loadability:** Still loaded but marked as STALE in context package header; agent is warned
- **Required action:** Owner agent must review within 14 days or artifact is archived
- **Context priority:** Drops one tier (P2→P3, P4→drop) when STALE marker is present

### SUPERSEDED
- **Description:** Artifact has been replaced by a newer version. The new version is ACTIVE.
- **Mutability:** Immutable (locked for historical record)
- **Loadability:** NOT loaded in normal context. Loaded only when explicitly queried for lineage.
- **Retention:** 365 days (T2+ ADRs: 730 days), then deleted
- **Pointer:** `superseded-by: {new-artifact-path}` stored in artifact metadata

### ARCHIVED
- **Description:** Artifact is no longer relevant. Preserved for historical record only.
- **Mutability:** Immutable
- **Loadability:** NOT loaded except for explicit historical queries
- **EWC pre-condition:** Before archiving, EWC check must confirm all unique knowledge is captured elsewhere
- **Retention:** 365 days, then deleted
- **Storage:** `memory/archive/{domain}/{year}/`

### REJECTED
- **Description:** Proposed artifact was rejected, or PROPOSED TTL expired.
- **Mutability:** Immutable
- **Loadability:** Never loaded
- **Retention:** 30 days (audit record), then deleted

---

## Transition Rules

| From | To | Event | Required Authority | Pre-condition |
|---|---|---|---|---|
| PROPOSED | ACTIVE | APPROVE | Owner + T2+ authority agent | Passes consistency check |
| PROPOSED | REJECTED | REJECT | Owner or T2+ agent | Reason documented |
| PROPOSED | REJECTED | TTL_EXPIRED | Automatic | 7 days elapsed |
| ACTIVE | STALE | STALENESS_TRIGGER | Automatic | Past validation TTL |
| ACTIVE | SUPERSEDED | SUPERSEDE | Owner + T2+ authority | New version exists |
| ACTIVE | ARCHIVED | ARCHIVE | Owner + T2+ authority | EWC check passed |
| ACTIVE | REJECTED | REJECT | T3+ authority | Fundamental error found |
| STALE | ACTIVE | REACTIVATE | Owner validates | Artifact still accurate |
| STALE | ARCHIVED | ARCHIVE | Owner + T2+ authority | EWC check passed |
| SUPERSEDED | ARCHIVED | RETENTION_TTL | Automatic | Retention period elapsed |
| ARCHIVED | (none) | | | Archived is terminal |
| REJECTED | (none) | | | Rejected is terminal |

---

## Knowledge State by Artifact Type

| Artifact Type | Typical Lifecycle | Authority for ACTIVE | Notes |
|---|---|---|---|
| Memory entry (CRITICAL) | PROPOSED → ACTIVE → (never STALE) | Knowledge-systems-architect | CRITICAL entries are manually reviewed, no auto-stale |
| Memory entry (HIGH) | PROPOSED → ACTIVE → STALE → ARCHIVED | Domain owner agent | 180-day staleness TTL |
| Memory entry (NORMAL) | PROPOSED → ACTIVE → STALE → ARCHIVED | Domain agent | 365-day staleness TTL |
| ADR | PROPOSED → ACTIVE → SUPERSEDED | chief-architect-agent | ADRs supersede, rarely archive |
| Wiki page | PROPOSED → ACTIVE → STALE → ACTIVE | Domain wiki owner | Wiki pages are refreshed, not archived |
| Decision record | PROPOSED → ACTIVE | knowledge-systems-architect | D-001 through D-014: binding constraints |
| Workflow artifact | Created at step, ACTIVE during workflow, ARCHIVED after | Workflow instance | Artifacts live for workflow duration |
| Sprint Learning Capsule | PROPOSED → ACTIVE | organizational-learning-agent | Capsules rarely go STALE |

---

## State Observability

| Transition | Event Type |
|---|---|
| → ACTIVE | `knowledge.entry.activated` |
| → STALE | `memory.staleness.detected` |
| → ARCHIVED | `knowledge.entry.archived` |
| → SUPERSEDED | `knowledge.entry.superseded` |
| EWC check passed | `knowledge.ewc.passed` |
| EWC check failed | `knowledge.ewc.failed` (blocks archival) |

---

## Staleness Detection (Automated)

Run by `knowledge-systems-engineer-agent` on weekly cron:

```python
for entry in all_active_entries:
    days_since_validation = today - entry.last_validated_at
    ttl = staleness_ttl[entry.importance]
    
    if days_since_validation > ttl:
        mark_stale(entry)
        notify(entry.owner, "Entry requires revalidation")
        emit("memory.staleness.detected", {entry: entry.path})
```