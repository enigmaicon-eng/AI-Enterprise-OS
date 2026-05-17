---
layer: lifecycle-models
type: knowledge-lifecycle
version: 1.0.0
created: 2026-05-10
owner: knowledge-systems-architect-agent
authority: knowledge-systems-architect-agent
---

# Knowledge Lifecycle

The complete lifecycle of knowledge in the Enterprise AI OS — from discovery through institutionalization, to eventual archival or supersession.

This is the operational narrative layer above the knowledge state machine (`state-models/knowledge-states.md`). The state machine defines states and transitions; this document defines the full lifecycle flow, maintenance protocols, and governance checkpoints.

---

## Lifecycle Phases

```
PHASE 1: DISCOVERY
  Raw experience, observation, or external research → recognized as organizational knowledge
  
PHASE 2: CAPTURE
  Captured in a structured format with metadata, owner, and importance tier
  
PHASE 3: VALIDATION
  Reviewed against consistency anchor, contradiction-checked, authority-approved
  
PHASE 4: ACTIVATION
  Entered into memory index, assigned domain namespace, loaded in context packages
  
PHASE 5: MAINTENANCE
  Periodic staleness checks, revalidation, conflict resolution, relevance rescoring
  
PHASE 6: EVOLUTION
  Updated, patched, or superseded as organizational understanding grows
  
PHASE 7: PRESERVATION
  High-value knowledge compressed into Sprint Learning Capsules or Architecture State Summaries
  
PHASE 8: RETIREMENT
  Archived or deleted once no longer relevant or unique
```

---

## Phase 1: Discovery

Knowledge sources:
| Source | Discovery Method | Owner |
|---|---|---|
| Agent task completion | Artifact review extracts learnings | Executing agent |
| External research | Explicit extraction and adaptation | knowledge-systems-architect-agent |
| Contradiction resolution | Resolution yields new understanding | organizational-learning-agent |
| Sprint retrospective | Team patterns identified | delivery-lead-agent |
| Integration failure | Incident post-mortem | delivery-lead-agent |
| Architecture review | Gap analysis yields new constraints | chief-architect-agent |

**Discovery trigger:** An agent recognizes a reusable, non-obvious pattern or constraint that would improve future decisions if remembered.

**Discovery gate:** Is this knowledge reusable across more than one future task? If yes → CAPTURE. If no → leave in scratchpad, don't persist.

---

## Phase 2: Capture

Capture produces a structured memory entry:

```yaml
# Template: memory entry
---
entry-id: "{UUID}"
created: "{ISO-8601}"
created-by: "{agent-id}"
domain: "{domain}"
importance: CRITICAL|HIGH|NORMAL
permission-tier: OPEN|RESTRICTED|CONFIDENTIAL|CLASSIFIED
state: PROPOSED
tags: ["{concept-tags}"]
---

# {Entry Title}

{Content — follows knowledge vocabulary definitions in ontology/knowledge-vocabulary.md}

## Source
{What experience or observation generated this knowledge}

## Applicability
{When this knowledge should be used / which agents and tasks it applies to}

## Constraints
{Any limitations on this knowledge: time-bounded, domain-specific, assumption-dependent}
```

**Capture location:**
- PROPOSED entries go to `memory/drafts/{domain}/` until approved
- Approved ACTIVE entries move to `memory/domains/{domain}/`

---

## Phase 3: Validation

Validation checks performed before PROPOSED → ACTIVE:

1. **Consistency check:** Does this contradict the consistency anchor or existing ACTIVE entries?
2. **Duplicate check:** Is this already captured elsewhere? (check master-cognition-index.md)
3. **Authority check:** Does the creating agent have domain authority to create this entry?
4. **Format check:** Does the entry follow the capture template format?
5. **Tag check:** Are tags present and correctly mapped to ontology terms?

**Validation authority:**
- NORMAL entries: Owner agent self-validates
- HIGH entries: Owner + T2 peer review
- CRITICAL entries: Owner + T3+ authority review
- RESTRICTED/CONFIDENTIAL entries: Owner + security clearance review

---

## Phase 4: Activation

On PROPOSED → ACTIVE:

1. Move from `memory/drafts/` to `memory/domains/{domain}/`
2. Add entry to `memory/MEMORY_INDEX.md`
3. Add entry terms to `cognition-indexes/master-cognition-index.md`
4. Add entry to relevant semantic clusters in `cognition-indexes/semantic-clusters/`
5. Update `cognition-indexes/agent-cognition-index.md` if this entry affects a specific agent's domain
6. Emit `knowledge.entry.activated` event

---

## Phase 5: Maintenance

### Staleness Monitoring (Weekly Cron)
`knowledge-systems-engineer-agent` runs staleness check against all ACTIVE entries:
- CRITICAL entries: flag if not validated in 90 days
- HIGH entries: flag if not validated in 180 days
- NORMAL entries: flag if not validated in 365 days

### Revalidation Protocol
When flagged as STALE:
1. Owner receives notification
2. Owner reviews entry against current organizational state
3. If still accurate → update `last-validated-at`, return to ACTIVE
4. If partially outdated → edit entry, update, return to ACTIVE
5. If fully outdated → ARCHIVE (with EWC check) or SUPERSEDE

### Conflict Resolution
When a new entry contradicts an ACTIVE entry:
- Apply `knowledge-governance/contradiction-resolution-system.md`
- One of: (a) new entry rejected, (b) old entry superseded, (c) both entries scoped/qualified to coexist

---

## Phase 6: Evolution

### Patch (Minor Update)
- Owner edits content in place
- No state transition required
- Update `last-modified-at`, log change reason
- Re-run consistency check

### Supersession (Major Update / New Version)
- New entry created (PROPOSED → ACTIVE)
- Old entry transitions to SUPERSEDED
- `superseded-by` pointer added to old entry
- `supersedes` pointer added to new entry
- Old entry stored in `memory/archive/` for 365 days (730 days for ADRs)

### Synthesis (Multiple Entries → One)
- When multiple NORMAL entries can be consolidated into one HIGH entry
- Apply ReasoningBank protocol: RETRIEVE → JUDGE → DISTILL → CONSOLIDATE
- EWC check: verify all unique knowledge from component entries is in new consolidated entry
- Component entries move to SUPERSEDED
- New consolidated entry activated

---

## Phase 7: Preservation

High-value knowledge that spans multiple initiatives is preserved before it can decay:

### Sprint Learning Capsule
At end of each sprint/initiative:
1. `organizational-learning-agent` reviews all knowledge created during the sprint
2. Distills into a Sprint Learning Capsule: `memory/sprint-capsules/sprint-{date}-{initiative}.md`
3. Capsule uses the format from `memory-governance/long-context-preservation.md`
4. Capsule is ACTIVE indefinitely (365-day staleness TTL)

### Architecture State Summary
After major architecture decisions:
1. `chief-architect-agent` produces Architecture State Summary
2. Captures: current system topology, active constraints, decision rationale
3. Stored in `memory/architecture-summaries/`
4. Referenced by cognition-indexes for future architecture tasks

---

## Phase 8: Retirement

### Archive Protocol
1. Owner or authority agent triggers archival
2. EWC check: all unique knowledge must be present in another ACTIVE entry
3. If EWC passes: entry moves to ARCHIVED, stored in `memory/archive/{domain}/{year}/`
4. If EWC fails: identify where unique knowledge is lost, capture it first, then archive
5. Remove entry from MEMORY_INDEX.md and master-cognition-index.md
6. Emit `knowledge.entry.archived` event

### Deletion
- ARCHIVED entries are permanently deleted after retention period (365 days)
- REJECTED entries deleted after 30 days (audit record)
- No EWC check required for deletion (EWC was done at archival)

---

## Lifecycle Metrics

| Metric | Target | Alert |
|---|---|---|
| PROPOSED → ACTIVE conversion rate | ≥90% | <80% |
| Time in PROPOSED state | <7 days | >14 days |
| STALE entries as % of ACTIVE | <10% | >20% |
| EWC pre-archival pass rate | 100% | Any failure |
| Knowledge synthesis completion rate | 100% of sprints | Any skipped sprint |
| Index update lag after activation | <24 hours | >72 hours |
