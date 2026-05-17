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

# Recursive Synthesis Protocol

How the Enterprise AI OS applies multi-level synthesis to distill deep organizational intelligence from accumulated experience over time.

**Core idea:** Each synthesis pass generates a distilled artifact. A second synthesis pass over multiple distilled artifacts generates even higher-level insights. This recursive application mirrors how humans build expertise — individual experiences → patterns → principles → mental models.

---

## Levels of Synthesis

```
LEVEL 0: RAW EXPERIENCE
  Workflow artifacts, agent scratchpads, incident reports
  (not institutional knowledge — ephemeral)

LEVEL 1: OPERATIONAL MEMORY (First Synthesis)
  Sprint Learning Capsules, Domain Memory Entries
  "We learned X in sprint Y"
  Produced by: organizational-learning-agent (after each sprint)

LEVEL 2: ARCHITECTURAL INTELLIGENCE (Second Synthesis)
  Architecture State Summaries, Cross-Sprint Pattern Reports
  "We consistently see X across sprints in domain Y"
  Produced by: chief-architect-agent + organizational-learning-agent (quarterly)

LEVEL 3: ORGANIZATIONAL PRINCIPLES (Third Synthesis)
  Governance principles updates, Constitutional learning
  "After 12 months we know that X is always true for us"
  Produced by: knowledge-systems-architect-agent (annually or major milestone)
```

---

## Level 1 → Level 2: Quarterly Synthesis

**Trigger:** 3+ Sprint Learning Capsules exist in the same domain from the past quarter.

**Protocol:**

### Step 1: RETRIEVE (Level 1 sources)
```
Load from memory/sprint-capsules/:
  - All capsules in the target domain from the past quarter
  - Related Architecture State Summaries from memory/architecture-summaries/
  - CRITICAL and HIGH memory entries in the domain
```

### Step 2: JUDGE (Cross-Sprint Patterns)
For each learning across all capsules, ask:
- Does this learning appear in multiple capsules? (recurring = more significant)
- Is this learning domain-wide or sprint-specific?
- Does this learning update or extend an existing ACTIVE principle?

Judgments:
- RECURRING (appears 2+ sprints) → Include in Level 2 synthesis
- DOMAIN_PATTERN (affects how the domain operates) → Include
- SPRINT_SPECIFIC → Leave in capsule, don't elevate
- ALREADY_CAPTURED (exists in ACTIVE entry) → Skip

### Step 3: DISTILL (Extract Cross-Sprint Insights)
From each RECURRING or DOMAIN_PATTERN learning:
- Extract the structural insight (not the sprint-specific example)
- Formulate as a principle or constraint
- Include the evidence base (which sprints confirmed this)

### Step 4: CONSOLIDATE → Architecture State Summary
```yaml
# memory/architecture-summaries/{domain}-{YYYY-Q{N}}.md
---
type: architecture-state-summary
domain: "{domain}"
period: "{quarter}"
synthesized-by: chief-architect-agent + organizational-learning-agent
synthesized-at: "{ISO-8601}"
source-capsules: ["{capsule-1}", "{capsule-2}", ...]
synthesis-ids: [SYN-NNN]
---

## Cross-Sprint Patterns
{3-7 patterns that appeared across multiple sprints}

## Domain Constraints (Updated)
{Constraints that have been validated/strengthened this quarter}

## Deprecated Assumptions
{Things we believed that multiple sprints proved wrong}

## Recommended Memory Entry Updates
{Specific ACTIVE entries that should be updated based on this synthesis}
```

---

## Level 2 → Level 3: Annual/Milestone Synthesis

**Trigger:** 4+ Architecture State Summaries exist, or a major organizational milestone (major release, new BU, strategic pivot).

**Protocol:**

### Synthesis Focus
At Level 3, synthesis is not about accumulating more facts — it is about extracting **organizational principles**: structural truths about how this specific organization works.

Level 3 synthesis questions:
1. What architectural decisions have we made consistently, suggesting they're right for us?
2. What decisions were reversed repeatedly, suggesting a deeper constraint we haven't named?
3. What capabilities have become organizational strengths (validated by repeated successful use)?
4. What capability gaps have blocked us most (requiring a long-term solution)?

### Level 3 Output: Principle Candidates
Level 3 synthesis produces **principle candidates** — proposed updates to `docs/governance/principles.md` or the Enterprise Constitution.

These are the only artifacts that require T5 (constitutional) review.

```yaml
principle-candidate:
  id: PC-NNN
  proposed-principle: "{principle statement}"
  evidence-base: ["{architecture-summary-paths}"]
  contradicts-existing: "{existing principle if any}"
  synthesis-ids: [SYN-NNN]
  proposed-by: knowledge-systems-architect-agent
  requires-review: enterprise-constitution-guardian-agent
```

---

## Recursion Depth Limit

To prevent infinite synthesis cycles:
- Maximum synthesis depth: 3 levels
- A Level 3 output (principle candidate) is reviewed by humans, not further synthesized by agents
- Level 3 outputs that are approved become constitutional — they are the terminal state of organizational learning

---

## Synthesis Lineage Tracking

Every synthesis is recorded in `cognition-indexes/knowledge-synthesis-index.md`. The lineage field enables tracing any principle back to its original operational experience:

```
Principle (Level 3)
  └── Architecture State Summary (Level 2) [SYN-NNN]
        └── Sprint Learning Capsule Q1 (Level 1) [SYN-NNN]
        └── Sprint Learning Capsule Q2 (Level 1) [SYN-NNN]
              └── Workflow artifact: incident-2026-03-01
              └── Workflow artifact: prd-feature-X-v2
```

This traceability is the organizational memory equivalent of academic citations — every belief is traceable to evidence.

---

## Anti-Pattern: Premature Elevation

Do NOT elevate a learning from Level 1 to Level 2 after a single sprint. Single-sprint learnings may be:
- Noise (not a real pattern)
- Context-specific (valid only in that sprint's conditions)
- Premature (needs validation across multiple instances)

The rule: Level 2 synthesis requires ≥3 Level 1 instances. Level 3 synthesis requires ≥4 Level 2 instances. Patience in synthesis produces more durable principles.

---

## Related Pages

- `wiki/knowledge/synthesis-workflow.md` — Base synthesis workflow (Level 1)
- `wiki/knowledge/institutional-memory-system.md` — How memory layers support recursive synthesis
- `cognition-indexes/knowledge-synthesis-index.md` — Synthesis history and lineage
- `memory-governance/long-context-preservation.md` — How capsules and summaries are preserved
