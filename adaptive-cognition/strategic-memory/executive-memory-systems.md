# Executive Memory Systems
**ID:** AC-SM-001 | **Tier:** T4 | **Class:** ELEVATED
**Owner:** Executive Org + Strategy Org | **Updated:** 2026-05-17

---

## Purpose

Defines the architecture of executive-grade strategic memory — the highest-fidelity, highest-confidence memory layer of the Adaptive Cognition system. Executive memory serves as the persistent strategic intelligence layer available to executive decision-making processes.

---

## Executive Memory Architecture

```
EXECUTIVE MEMORY LAYERS:

  LAYER 1: STRATEGIC DECISION ARCHIVE
    All T4 decisions with full rationale (→ AC-RH-003)
    Query interface: "What have we decided about X?"
    Retention: permanent

  LAYER 2: PORTFOLIO PERFORMANCE MEMORY
    Cross-project performance patterns, outcomes, and lessons
    Query interface: "What has worked (or not worked) at scale?"
    Retention: permanent; annual relevance review

  LAYER 3: ORGANIZATIONAL CAPABILITY MEMORY
    What capabilities the organization has demonstrated over time
    Validated by actual delivery (not claimed)
    Query interface: "What has this organization proven it can do?"
    Retention: permanent; updated on major capability demonstrations

  LAYER 4: STRATEGIC CONTEXT TIMELINE
    External environment changes and how the organization responded
    Links environment shifts to strategic responses (did we adapt correctly?)
    Query interface: "What were we facing when we made this decision?"
    Retention: permanent

  LAYER 5: EXECUTIVE BRIEFING MEMORY
    Accumulated context from executive briefings and strategy sessions
    Synthesized key insights, questions, and commitments
    Retention: 24 months rolling (then archived, not deleted)
```

---

## Executive Memory Entry Schema

```yaml
executive_memory_entry:
  entry_id: EME-{YYYY}-{seq4}    # e.g. EME-2026-0001
  layer: 1 | 2 | 3 | 4 | 5
  title: string
  summary: string                  # ≤ 200 words
  full_record: string | ref        # full content or pointer to external record
  confidence: float [0.70, 1.00]   # executive memory requires ≥ 0.70 to enter
  evidence_base:
    - record_type: string
      record_ids: [string, ...]
  applicability:
    contexts: [string, ...]        # when is this memory relevant to surface?
    anti_contexts: [string, ...]   # when should this NOT be surfaced?
  created: ISO8601
  created_by: T4-authorized agent or human executive
  last_reviewed: ISO8601
  review_schedule: quarterly | annual
  status: ACTIVE | UNDER_REVIEW | ARCHIVED
  superseded_by: EME-* | null
```

---

## Executive Memory Retrieval

```
RETRIEVAL PROTOCOL:

  QUERY TYPES:
    STRATEGIC_CONTEXT:  "What is the history of our position on X?"
    PRECEDENT_LOOKUP:   "Have we faced a situation like this before?"
    CAPABILITY_CHECK:   "Has the organization demonstrated Y capability?"
    COMMITMENT_TRACE:   "What commitments has the organization made regarding Z?"

  RETRIEVAL PIPELINE:
    1. Query classified by type
    2. Semantic match against entry titles, summaries, and applicability contexts
    3. Layer-priority ordering (Layer 1 decisions surface first for strategic queries)
    4. Confidence-weighted ranking (higher confidence entries ranked first)
    5. Anti-context filtering (entries with matching anti_contexts suppressed)
    6. Top N entries (N ≤ 5) returned with confidence scores and evidence pointers

  RETRIEVAL LOGGING:
    Every executive memory retrieval is logged
    Unused retrievals (queries that return 0 applicable results) are logged separately
    → Signal for executive memory gaps requiring new entries
```

---

## Executive Memory Formation Gates

```
REQUIRED BEFORE AN ENTRY IS CREATED:

  EVIDENCE THRESHOLD:
    Layer 1: T4 approval record (strategy decision) already exists
    Layer 2: ≥ 3 projects contributing evidence; portfolio-level scope confirmed
    Layer 3: ≥ 2 major delivery milestones demonstrating capability
    Layer 4: verifiable external context record + organization response documented
    Layer 5: executive session record archived; synthesis approved by T4

  QUALITY REVIEW:
    All new entries reviewed by Executive Org and Strategy Org (T4)
    Entry must pass: accuracy, completeness, applicability clarity, no duplication
    Time from candidate to ACTIVE: typically 5–10 business days

  REJECTION CRITERIA:
    Entry rejected if: duplicates existing entry, confidence < 0.70,
    insufficient evidence base, applicability conditions too vague, or Layer
    assignment is incorrect
```

---

## Executive Memory Health

```
HEALTH METRICS:
  Total ACTIVE entries by layer:   track quarterly
  Avg confidence score:            target > 0.82
  Retrieval utilization rate:      pct of entries queried in 90d; target > 60%
  Stale entries (not reviewed >1y): target < 5% of total
  Unmet query rate:                pct of queries returning 0 results; target < 20%
  Entry rejection rate:            track; high rejection signals quality of inputs
```

---

## Governance

- All executive memory entries are T4-class; require T4 approval
- Entries are permanent; archival with successor pointer only (no deletion)
- Layer 5 (briefing memory) is reviewed annually; entries > 24 months moved to archive
- Quarterly executive memory health review required by Executive Org
