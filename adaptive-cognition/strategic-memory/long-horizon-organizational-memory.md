# Long-Horizon Organizational Memory
**ID:** AC-SM-004 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Executive Org | **Updated:** 2026-05-17

---

## Purpose

Preserves organizational intelligence across multi-year time horizons — far beyond the planning cycle or the operational memory of any individual agent or human team member. Long-horizon organizational memory ensures that the OS retains organizational wisdom across major transitions: leadership changes, platform migrations, strategic pivots, and generational change in the AI model stack.

---

## The Long-Horizon Memory Problem

```
WITHOUT LONG-HORIZON MEMORY:
  - Hard-won organizational knowledge evaporates when key people or agents cycle out
  - The organization repeats costly experiments that prior cycles already ran
  - Strategic decisions are made without awareness of analogous prior situations
  - Institutional knowledge exists only in specific agents or humans; not in the OS itself
  - Context collapse: new team members and agents have no way to understand
    the reasoning arc that led to current architectural and strategic choices

WITH LONG-HORIZON MEMORY:
  - Organizational intelligence is a system property, not a person/agent property
  - Prior strategic experiments are traceable: "we tried this in 2023 — here's what happened"
  - Reasoning arcs are preserved: "here's how we arrived at this architectural decision"
  - Cross-generational learning: later OS versions benefit from earlier OS learning
  - Leadership continuity: new executives can orient to organizational history quickly
```

---

## Long-Horizon Memory Stores

```
STORE 1: STRATEGIC DECISION ARCHIVE (permanent)
  All T4 strategic decisions with full rationale
  Linked to: AC-RH-003 (strategic rationale memory)
  Query: "What have we decided at the T4 level about topic X?"

STORE 2: PLATFORM EVOLUTION RECORD (permanent)
  History of major architectural choices and platform changes
  Includes: what was replaced, why, what the outcome was
  Linked to: AC-RH-004 (architecture decision continuity)
  Query: "How has our architecture evolved? Why did we make these shifts?"

STORE 3: STRATEGIC EXPERIMENT LOG (permanent)
  Record of major strategic experiments: what was tried, what was learned
  Includes failed experiments (critical: prevents re-running failed experiments)
  Query: "Have we tried approach X before? What was the result?"

STORE 4: ORGANIZATIONAL CAPABILITY EVOLUTION (permanent)
  How the organization's demonstrated capabilities have changed over time
  Validated by delivery evidence, not claims
  Query: "What can we do now that we couldn't do before? What did we lose?"

STORE 5: EXTERNAL ENVIRONMENT MEMORY (rolling 36 months + archive)
  Major external signals and how the organization responded
  Regulatory changes, market shifts, technology platform changes
  Query: "What external pressures shaped our decisions in period X?"

STORE 6: GOVERNANCE EVOLUTION ARCHIVE (permanent)
  How governance structures, invariants, and principles have evolved
  Linked to: AC-CL-002 (governance evolution lineage)
  Query: "Why do we have rule X? What was the reasoning?"
```

---

## Memory Continuity Across Transitions

```
ORGANIZATIONAL TRANSITION TYPES:

  AI MODEL STACK TRANSITION:
    When the underlying AI models are updated or replaced:
      → Long-horizon memory is model-agnostic (stored in organizational layer)
      → New model generation receives full memory context on initialization
      → No organizational knowledge loss in model transitions

  LEADERSHIP TRANSITION:
    When executive humans change:
      → Strategic context briefing package compiled from long-horizon memory
      → New leaders oriented to: past decisions, reasoning arcs, current strategic direction
      → Briefing package reviewed by outgoing executive before transition

  MAJOR STRATEGIC PIVOT:
    When the organization changes direction significantly:
      → Prior strategic direction archived (not erased) with full rationale
      → Successor strategic direction linked with explicit lineage_parent pointer
      → Reasoning for pivot documented at T4 level
      → Future queries can trace: "what led to this pivot?"

  PLATFORM MIGRATION:
    When major infrastructure or workflow systems are replaced:
      → Platform evolution record updated with: what was replaced, why, lessons
      → Institutional knowledge about the prior system preserved for 36 months
        (operating teams may still need it for troubleshooting or compliance)
```

---

## Long-Horizon Memory Entry Lifecycle

```
ENTRY CREATION:
  Trigger: significant organizational event (strategic decision, platform change,
           major experiment completion, leadership transition)
  Required: T4 approval
  Required: evidence base documented
  Required: reasoning documented (not just outcomes)

ANNUAL MEMORY REVIEW:
  All ACTIVE entries reviewed for:
    Continued relevance
    Accuracy (has subsequent evidence contradicted this entry?)
    Completeness (is there context that should be added?)
  Entries updated in-place with version increment; prior version preserved
  Entries no longer relevant → ARCHIVED (not deleted); reason documented

SUCCESSION:
  When a new entry supersedes a prior one (same topic, evolved understanding):
    New entry references prior entry via lineage_parent
    Prior entry archived with: superseded_by, reason, ISO8601 timestamp
    Full succession chain always traversable
```

---

## Organizational Memory Health Score

```
HEALTH DIMENSIONS:
  COVERAGE:    Are all major organizational transitions and decisions memorialized?
               Score: (memorialized events) / (total major events)
               Target: > 90%

  FRESHNESS:   Are entries reviewed on schedule?
               Score: (entries reviewed in last 12m) / (total ACTIVE entries)
               Target: > 90%

  ACCESSIBILITY: Can authorized agents retrieve relevant entries in < 3 queries?
               Measured by retrieval success rate in exec sessions
               Target: > 80%

  ACCURACY:    Have any active entries been contradicted by subsequent evidence?
               Score: (uncontradicted entries) / (total ACTIVE entries)
               Target: > 95%

COMBINED HEALTH SCORE: weighted average of four dimensions
  Target: > 85/100 (annually reviewed by Executive Org)
```

---

## Governance

- All long-horizon memory entries are T4-class; require Executive Org approval
- Entries are permanent; archival with succession chain only (no deletion ever)
- Annual memory health review required by Executive Org
- Long-horizon memory is included in AI governance charter as a foundational system
- Access: T4 full access; T3 access to summary and applicability fields; T1/T2 no direct access
