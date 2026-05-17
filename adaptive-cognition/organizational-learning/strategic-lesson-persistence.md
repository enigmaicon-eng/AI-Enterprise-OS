# Strategic Lesson Persistence
**ID:** AC-OL-004 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Executive Org + Strategy Org | **Updated:** 2026-05-17

---

## Purpose

Captures, formats, and preserves strategic lessons — the high-value organizational learnings that come from major decisions, pivots, failures, and market-facing outcomes. Strategic lessons are qualitatively different from execution patterns: they operate at the level of organizational direction, not task execution.

---

## What Constitutes a Strategic Lesson

```
STRATEGIC LESSONS (this system):
  - Major product or architecture decision outcomes at T+90/180/365
  - Pivots: why we changed direction and what we learned
  - Competitive responses and their outcomes
  - Enterprise-wide failures with broad operational impact
  - Market-facing decisions and their traction/non-traction signals
  - Governance design decisions and their operational effectiveness
  - Significant cross-organizational coordination successes or failures

NOT STRATEGIC LESSONS (handled by execution pattern memory / failure detection):
  - Workflow execution improvements
  - Agent routing optimizations
  - Handoff quality improvements
  - Feature-level delivery learnings
```

---

## Lesson Capture Protocol

```
TRIGGER EVENTS for strategic lesson capture:
  1. Strategic decision T+90 review (all T4/T5 decisions reviewed at 90 days)
  2. Strategic decision T+180 review (updated with additional evidence)
  3. Project retrospective (project_close event; strategic context only)
  4. Strategy retrospective (quarterly; systematic capture)
  5. Executive-triggered capture (on-demand by T4+)
  6. Major failure post-mortem (any incident with enterprise-wide impact)

LESSON CAPTURE PROTOCOL:
  For each trigger event:
    1. Identify: what decision or event generated the lesson?
    2. Capture: what was the outcome? (not just what we planned)
    3. Identify: what was the lesson? (what did we learn that we didn't know before?)
    4. Assess: how actionable is the lesson? (does it change how we approach future decisions?)
    5. Validate: is the lesson correctly attributed? (not confounded by other factors?)
    6. Format: strategic_lesson_entry (structured document)
    7. Approve: T4 review required before activation
    8. Persist: write to adaptive-cognition/store/strategic-memory.jsonl
               + promote to strategic-memory/executive-memory-systems.md if applicable
```

---

## Strategic Lesson Schema

```yaml
strategic_lesson:
  lesson_id: SL-YYYYMMDD-NNN
  timestamp: ISO8601
  trigger_event_type: T90_REVIEW | T180_REVIEW | PROJECT_RETRO | STRATEGY_RETRO | ON_DEMAND | POST_MORTEM
  decision_or_event_id: reference to source decision record
  lesson_summary: one-sentence statement of the lesson (precise, not vague)
  lesson_narrative: 2-4 paragraphs with full context
  lesson_type:
    DECISION_QUALITY: we now know how to make this type of decision better
    MARKET_INSIGHT: we learned something about our market/customers/competition
    OPERATIONAL: we learned how to operate more effectively at scale
    GOVERNANCE: we learned something about governance design effectiveness
    CAPABILITY: we learned something about our organizational capabilities
  applicability: NARROW (specific context) | BROAD (many contexts) | UNIVERSAL
  actionable: bool
  action_implications: list of concrete changes this lesson should drive
  confidence: float [0.0, 1.0]
  approved_by: T4 approver
  review_schedule: [T+90, T+180, T+365, annual thereafter]
  status: ACTIVE | SUPERSEDED | ARCHIVED
  hash: Ed25519
```

---

## Strategic Lesson Library

```
Strategic lessons accumulate into an organizational lesson library.
The library is organized by:
  - lesson_type
  - applicability
  - business domain
  - time period

Library navigation principles:
  - Most recent lessons for active decisions
  - Historical lessons for architectural decisions (long-horizon perspective)
  - Cross-reference with knowledge base KUs where overlap exists

Library is available to:
  - Executive Org: at all times (complete access)
  - Strategy Org: filtered by relevance to current strategy work
  - Architecture Org: lessons relevant to architectural decisions
  - All other orgs: summary access (not full narrative detail without T3 approval)
```

---

## Lesson Quality Standards

```
A strategic lesson must be:
  PRECISE: "Decision X produced outcome Y, which showed us Z" — not vague generalities
  EVIDENCED: supported by measurable outcomes, not impressions
  ACTIONABLE: implies a concrete change in how we approach similar future situations
  HONEST: includes failures and uncomfortable truths, not only successes
  BOUNDED: clear scope of applicability; not over-generalized

Common lesson quality failures (rejected at T4 review):
  - "We should communicate better" (vague, not actionable)
  - "The market was difficult" (not a lesson; not actionable)
  - "Things worked out in the end" (no lesson captured)
  - "We should have moved faster" (without specific evidence of what slowed us)
```

---

## Governance

- Strategic lessons require T4 approval before activation
- Lessons cannot be deleted; only ARCHIVED with reason documented
- Lessons affecting constitutional or governance design are shared with Constitutional Review team
- Strategic lesson library subject to quarterly T4 review
