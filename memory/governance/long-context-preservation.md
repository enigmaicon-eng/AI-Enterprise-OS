---
layer: memory-governance
type: long-context-preservation
version: 1.0.0
created: 2026-05-10
owner: organizational-learning-agent
authority: knowledge-systems-architect-agent
---

# Long-Context Preservation

The strategy and protocols for preserving organizational intelligence that is too large for any single context window but must remain accessible and usable across the lifetime of the OS.

---

## The Long-Context Problem

The OS accumulates knowledge over time: hundreds of ADRs, thousands of wiki entries, complete sprint histories, the full organizational decision trail. No single context window can hold all of this. Yet agents need access to relevant parts of this accumulated intelligence in every session.

Long-context preservation answers: how does the OS remain intelligent over time as knowledge accumulates, without loading all of it into every context?

---

## The Three-Tier Access Model

Not all knowledge needs equal access frequency. The three-tier model matches storage format to access need:

```
HOT TIER (always accessible, session-loaded)
  What: mandatory governance, consistency anchor, active workflow states
  Size limit: fits in Tier-3 orchestrator context budget (~80K tokens)
  Format: concise, structured markdown
  Access: automatically loaded at session start

WARM TIER (selectively loaded, on-demand per dispatch)
  What: domain memory, validated patterns, active decisions, known risks
  Size limit: any individual entry ≤ 2,000 tokens; total index ≤ 5,000 tokens
  Format: concise, indexed markdown
  Access: loaded by context-routing-engine based on domain and task

COLD TIER (archived, retrievable on explicit request)
  What: all workflow artifacts, historical ADRs, closed incidents, archived memory
  Size limit: unlimited
  Format: any (markdown preferred, other formats acceptable)
  Access: explicitly requested by agent or human; never auto-loaded
```

---

## Knowledge Distillation for Long-Term Preservation

As knowledge accumulates, raw artifacts grow too large for the warm tier. Distillation extracts the durable, reusable core from large artifacts:

### Sprint Distillation
At sprint close, the `organizational-learning-agent` distills the sprint's knowledge into a Sprint Learning Capsule:

```yaml
# sprints/{sprint-id}/learning-capsule.md
learning-capsule:
  sprint-id: "{sprint-id}"
  created-at: "{date}"
  
  validated-patterns:
    # Patterns that worked and should be reused
    - pattern: "{description}"
      evidence: "{what happened that validated this}"
      reusable-in: ["{routing-key}", ...]
      
  failure-modes-discovered:
    # What broke and how to avoid it
    - failure: "{description}"
      root-cause: "{systemic cause}"
      prevention: "{what to do differently}"
      
  decisions-that-held:
    # ADRs/decisions from prior sprints that proved correct
    - decision-id: "D-NNN"
      validation: "{how it was confirmed}"
      
  decisions-that-need-revisiting:
    # Decisions that should be reviewed
    - decision-id: "D-NNN"
      reason: "{why revisit}"
      trigger-condition: "{when to revisit}"
      
  performance-data:
    velocity: N
    gate-first-pass-rate: "X%"
    wiki-pages-updated: N
    memory-entries-created: N
```

Learning capsules are warm-tier entries (≤2,000 tokens each). The full sprint artifact (sprints/{sprint-id}/) moves to cold tier.

### Architectural Evolution Distillation
Every 6 months, `principal-architect-agent` distills the ADR history into an Architecture State Summary:

```markdown
# Architecture State Summary — {date}

## Settled Decisions (not up for debate)
- Auth: JWT with RS256 (ADR-003)
- Database: PostgreSQL + pgvector (ADR-007)
- API versioning: URI path /v{N}/ (ADR-001 D-003)

## Active Constraints (bound future decisions)
- No synchronous cross-service calls in the critical path
- All L-tier features behind feature flags
- Zero credentials in any artifact or config file

## Superseded Decisions (historical record only)
- ADR-002 (Redis sessions) → superseded by ADR-009 (JWT stateless)

## Open Architectural Questions
- [links to relevant open questions from memory/open-questions.md]
```

This 1-2 page summary replaces loading 30+ ADRs into context. The ADRs remain in cold tier for specific reference.

---

## The RETRIEVE Protocol for Long-Context Knowledge

When an agent needs access to cold-tier knowledge:

```
STEP 1: INTENT SPECIFICATION
  Agent declares: "I need information about {topic} for {purpose}"
  
STEP 2: INDEX SEARCH
  knowledge-systems-engineer-agent searches:
  - cognition-indexes/master-cognition-index.md (keyword lookup)
  - graph-models/enterprise-cognition-graph.md (relationship traversal)
  - wiki/index.md (wiki search)
  - memory/MEMORY_INDEX.md (warm-tier search)
  Returns: ranked list of {file-path, relevance-score, entry-summary}
  
STEP 3: SELECTIVE RETRIEVAL
  Agent requests specific files by path (not "everything about X")
  Maximum cold-tier entries per dispatch: 3 (to prevent context overflow)
  
STEP 4: EXTRACTION
  knowledge-systems-engineer-agent extracts relevant sections from cold-tier files
  (not the full file — only the sections matching the stated information need)
  Extracted sections added to agent's context package
  
STEP 5: CITATION
  Agent cites retrieved cold-tier content in its output artifact
  Citation format: [source: {file-path}, retrieved: {date}]
```

---

## EWC-Guided Preservation (Irreversibility Check)

Before any knowledge is moved from warm to cold tier (less accessible):

```
EWC CHECK:
  1. Extract all unique claims from the warm-tier entry
  2. For each unique claim: search warm-tier and wiki for the same claim
  3. If claim is NOT present in warm-tier or wiki:
     → BLOCK cold-tier migration
     → Either: transfer claim to the successor warm-tier entry
     → Or: create a brief warm-tier entry capturing just the unique claims
  4. If all claims are covered elsewhere:
     → PERMIT cold-tier migration
     → Update MEMORY_INDEX.md: move entry to archive section
```

This is the organizational equivalent of ruflo's EWC++ (Elastic Weight Consolidation) — preventing the OS from "forgetting" knowledge that's being compressed away.

---

## Temporal Knowledge Management

Some knowledge has a defined validity window:

| Knowledge Type | Validity Window | After Window |
|---|---|---|
| Sprint state | Current sprint | Distill to capsule; archive sprint artifacts |
| Open incident | Until resolved | Archive after 30 days post-resolution |
| Active workflow instance | Until complete | Archive run-context 30 days after completion |
| Open question | Until resolved | Archive with answer after resolution |
| Active risk | Until closed | Archive with outcome after closure |
| Operational metric | 90 days rolling | Archive to cold; distill to trend summaries |
| Architecture decision | Until superseded | Remain in warm tier until explicitly superseded |
| Governance principles | Constitutional | Never archive; always warm tier |

---

## Organizational Learning Accumulation

Over time, the OS builds an accumulation of distilled organizational intelligence:

```
Year 1: patterns/, failures/, learning-capsules/
Year 2: + architecture-evolution-summaries, + incident-pattern-library
Year 3: + organizational-capability-history, + decision-effectiveness-records

This accumulation becomes the OS's long-term organizational memory —
the institutional wisdom that informs decisions years later.
```

The accumulation is itself indexed in `cognition-indexes/knowledge-synthesis-index.md` and refreshed quarterly by the `organizational-learning-agent` synthesis cron workflow.
