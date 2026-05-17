---
layer: wiki
section: knowledge
type: reference
version: 1.0.0
created: 2026-05-10
owner: organizational-learning-agent
authority: knowledge-systems-architect-agent
last-reviewed: 2026-05-10
status: active
---

# Knowledge Synthesis Workflow

How the Enterprise AI OS transforms raw experience, research, and agent output into reusable organizational intelligence.

**Adapted from:** ruflo's ReasoningBank pipeline (RETRIEVE → JUDGE → DISTILL → CONSOLIDATE).

---

## When Synthesis Happens

| Trigger | Type | Initiating Agent |
|---|---|---|
| Sprint/initiative completes | Sprint Learning Capsule | organizational-learning-agent |
| New external research ingested | Extraction synthesis | knowledge-systems-architect-agent |
| 3+ similar memory entries exist | Consolidation synthesis | organizational-learning-agent |
| Contradiction resolved | Reconciliation synthesis | knowledge-systems-architect-agent |
| Architecture decision made | Architecture State Summary | chief-architect-agent |
| Incident post-mortem complete | Incident learning | delivery-lead-agent |

---

## The Four-Stage Pipeline

### Stage 1: RETRIEVE
**Goal:** Gather all relevant source material

```
Sources:
  - Workflow artifacts from completed steps
  - Memory entries in the relevant domain
  - Wiki pages in the relevant section
  - External research notes (wiki/research/)
  - Agent scratchpad notes from the completed workflow
  
Selection criteria:
  - Temporal relevance: prefer last 90 days
  - Domain relevance: match domain of synthesis task
  - Importance: prioritize CRITICAL and HIGH entries
  
Output: Candidate set of source documents
```

### Stage 2: JUDGE
**Goal:** Evaluate which sources contain synthesis-worthy knowledge

For each source document in the candidate set:

```
Judgment criteria:
  1. Is this knowledge reusable beyond this specific instance?
  2. Is this knowledge not already captured in an ACTIVE entry?
  3. Is this knowledge accurate and verifiable?
  4. Would knowing this improve future decisions in this domain?
  
Score: INCLUDE | EXCLUDE | ALREADY_CAPTURED | VERIFY_FIRST

Threshold: INCLUDE if ≥3 of 4 criteria are YES
```

### Stage 3: DISTILL
**Goal:** Extract the essential, reusable kernel from each included source

Distillation extracts:
- **Binding constraints** — rules that constrain future decisions
- **Named decisions** — what was decided and why
- **Quantitative facts** — numbers, metrics, targets
- **Pattern names** — reusable patterns with names
- **Anti-patterns** — what to avoid and why
- **Causal relationships** — X causes Y under condition Z

For each included source, produce a distilled excerpt (50-150 tokens) containing only the above.

Do NOT include:
- Task-specific context that won't transfer
- Intermediate reasoning steps
- Repeated statements of the same fact
- Procedural detail that belongs in a workflow template

### Stage 4: CONSOLIDATE
**Goal:** Merge distilled excerpts into a coherent, structured knowledge artifact

Consolidation rules:
1. **Group by theme:** Related distillations are consolidated into one entry
2. **Deduplicate:** Identical facts stated in multiple sources appear once
3. **Resolve micro-conflicts:** If two sources disagree on a detail, apply contradiction-resolution-system.md before consolidating
4. **Add applicability:** Every consolidated entry specifies when it applies
5. **Set importance tier:** CRITICAL (binding constraint), HIGH (significant pattern), NORMAL (useful reference)

---

## Synthesis Output Formats

### Sprint Learning Capsule
```yaml
# memory/sprint-capsules/sprint-{YYYY-MM-DD}-{initiative}.md
---
type: sprint-learning-capsule
sprint: "{initiative name}"
period: "{start} to {end}"
synthesized-by: organizational-learning-agent
synthesized-at: "{ISO-8601}"
synthesis-ids: [SYN-NNN]
---

## Key Learnings
{3-7 bullet points: most important reusable knowledge from this sprint}

## Binding Constraints Added
{Any new constraints discovered this sprint that affect future work}

## Patterns That Worked
{What approaches proved effective}

## Anti-Patterns Discovered
{What approaches failed and why}

## Decisions Made
{Summary of key decisions with rationale}

## Open Questions Closed
{Which open questions (Q-NNN) were resolved}

## New Open Questions
{New questions this sprint raised that remain unanswered}
```

### Extraction Synthesis Record
Logged to `cognition-indexes/knowledge-synthesis-index.md` (SYN-NNN records).

### Reconciliation Record
Logged to `knowledge-governance/contradiction-resolution-system.md` (CONT-NNN records).

---

## Synthesis Quality Gates

Before a synthesis artifact is marked ACTIVE:

| Check | Requirement |
|---|---|
| EWC check | All unique knowledge from source entries preserved in synthesis |
| Consistency check | No contradiction with existing ACTIVE entries |
| Authority review | CRITICAL entries require T2+ review |
| Index update | master-cognition-index updated with new terms |
| Source lineage | SYN-NNN record written in knowledge-synthesis-index.md |

---

## Recursive Synthesis

When multiple Sprint Learning Capsules exist from the same initiative domain, they can be recursively synthesized into an Architecture State Summary:

1. RETRIEVE: all capsules from the domain over the past 6 months
2. JUDGE: identify the non-obvious patterns that emerge across multiple sprints
3. DISTILL: extract cross-sprint learnings (things that were true across multiple cycles)
4. CONSOLIDATE: produce Architecture State Summary in `memory/architecture-summaries/`

This is the "recursive" layer — see `wiki/knowledge/recursive-synthesis.md` for the full protocol.

---

## Related Pages

- `wiki/knowledge/institutional-memory-system.md` — How institutional memory is structured
- `wiki/knowledge/contradiction-detection.md` — Contradiction detection protocol
- `wiki/knowledge/recursive-synthesis.md` — Recursive synthesis for deep accumulation
- `knowledge-governance/organizational-truth-reconciliation.md` — Reconciliation protocol
- `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history log