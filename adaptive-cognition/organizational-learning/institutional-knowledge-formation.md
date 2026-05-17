# Institutional Knowledge Formation
**ID:** AC-OL-005 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** Knowledge Management + AI-Native Org | **Updated:** 2026-05-17

---

## Purpose

Defines the process by which raw organizational experience (reflection events, learning records, strategic lessons) crystallizes into permanent institutional knowledge — the durable, retrievable organizational intelligence encoded in the knowledge base as Knowledge Unit (KU) entries.

Institutional knowledge is the highest-quality output of the Adaptive Cognition Layer. It is slow to form (high evidence bar), slow to change (conservative archival), and highly valuable (informs all future work).

---

## Formation Pathway

```
INSTITUTIONAL KNOWLEDGE FORMATION PIPELINE

  RAW EXPERIENCE
  (reflection events, execution outcomes)
          │
          ▼ [pattern detection threshold met]
  LEARNING RECORD (PROPOSED)
  (pattern documented; not yet validated)
          │
          ▼ [T3 review + validation]
  LEARNING RECORD (ACTIVE)
  (applied to heuristics + surfaced in retrieval)
          │
          ▼ [90-day effectiveness demonstration]
  KNOWLEDGE UNIT CANDIDATE
  (nominated for permanent knowledge base entry)
          │
          ▼ [T3 Knowledge Management full review]
  KNOWLEDGE UNIT (KU-*)
  (permanent institutional knowledge entry)
          │
          ▼ [annual review]
  KNOWLEDGE UNIT MAINTAINED OR ARCHIVED
```

---

## Knowledge Unit Qualification

A learning record can be nominated for KU status when:

```yaml
ku_qualification_criteria:
  evidence_age: learning_record has been ACTIVE for ≥ 90 days
  effectiveness: heuristic/workflow changes based on this learning have shown improvement
  confidence: current confidence ≥ 0.80 (not 0.65 as for initial learning records)
  scope: PORTFOLIO or ENTERPRISE (not PROJECT-specific)
  stability: learning record has not been flagged or contradicted in the active period
  generalizability: applies across ≥ 3 distinct contexts (not one workflow or project type)
  actionability: can be expressed as a clear principle or guideline
```

---

## Institutional Knowledge Structure

```yaml
knowledge_unit:
  ku_id: KU-ACOG-NNNN  # (ACOG prefix for adaptive cognition-derived KUs)
  domain: string
  title: concise principle title
  principle: one-sentence statement of the institutional knowledge
  elaboration: 2-4 paragraphs of context and application guidance
  evidence_base:
    - learning_record_ids: [LR-*, LR-*]
    - source_reflection_events: [RE-*, ...]
    - projects_contributing: count and anonymized references
    - effectiveness_evidence: what improved after this principle was applied
  confidence: float [0.80, 1.00] (KUs only qualify at ≥ 0.80)
  applicability_conditions: when does this principle apply?
  counter_indicators: when does this principle NOT apply?
  related_ku_ids: [KU-*, ...]
  review_schedule: annual
  created: ISO8601
  last_reviewed: ISO8601
  status: ACTIVE | UNDER_REVIEW | ARCHIVED
```

---

## Example Institutional Knowledge Entries

```markdown
### KU-ACOG-0001: Pre-Gate Architecture Documentation
**Principle:** Security gate pass rates are reliably higher when architecture decisions
affecting security surfaces are documented in ADRs before implementation begins.

**Elaboration:** Analysis of 47 feature development workflows across 12 projects shows
that projects where security-relevant ADRs precede implementation achieve 94% first-pass
security gate success vs. 61% where ADRs are produced concurrently or post-implementation.
The effect is strongest for auth, data handling, and API surface decisions. The mechanism:
pre-implementation ADRs allow the architecture agent to surface security implications
before code is written, when the cost of change is lowest.

**Applicability:** All feature development workflows with security surface implications.
**Counter-indicators:** Trivial changes with no security surface (internal refactoring).
**Related:** KU-ACOG-0007 (ADR timing and quality gates), KU-SEC-0012 (security gate design)
```

---

## Institutional Knowledge Governance

```
CREATION:
  Requires T3 Knowledge Management approval
  Requires Architecture Org review for technical KUs
  Requires Governance Org review for governance-related KUs

MODIFICATION:
  KUs can be updated (not silently; version incremented, change documented)
  Substantive changes require same approval as creation
  Minor clarifications: T3 Knowledge Management can approve unilaterally

ARCHIVAL:
  KU no longer applies (conditions changed): archive, do not delete
  Archived KU preserved with reason for archival
  Archival requires T3 approval
  Archived KUs are NOT surfaced in retrieval but are preserved in history

CONFLICT RESOLUTION:
  If two KUs appear to contradict each other: CONFLICT flag raised
  Both KUs suspended from active retrieval until resolved
  Resolution requires T3 Knowledge Management + domain owner
  Resolution output: one KU updated/archived + conflict resolution note
```

---

## Institutional Knowledge Health

```
KU quality metrics:
  Total active KUs in adaptive cognition domain:  0 (new system; grows over time)
  KU retrieval rate (% of KUs accessed in 30d):   — (track after 90 days)
  KU staleness rate (not reviewed in > 12m):       — (target: < 10%)
  KU conflict rate (active conflicts):             — (target: 0)
  Avg KU confidence score:                         — (target: > 0.85)
```
