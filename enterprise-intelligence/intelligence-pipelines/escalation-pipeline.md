# Escalation Pipeline

**System ID:** `escalation-pipeline`
**Role:** Detects insufficient evidence, low confidence, and unresolved contradictions — triggers targeted re-investigation or delivery with explicit gaps
**Position:** Gates between evidence gathering and synthesis (can trigger re-investigation loops)

---

## Purpose

The Escalation Pipeline is the quality control gate of the research intelligence system. It decides: **"Do we have enough to deliver, or must we gather more?"**

Without escalation control, the system would either: (a) deliver false confidence built on thin evidence, or (b) never stop gathering (chasing perfect certainty). The escalation pipeline balances evidence sufficiency against the cost of continued investigation.

---

## Escalation Decision Framework

### Escalation Level 01: Sub-Question Coverage Gap

**Trigger:** Any PRIMARY sub-question has zero evidence items.

**Response:**
1. DO NOT proceed to synthesis
2. Generate targeted query set for missing sub-question
3. Resume evidence gathering (Track D: targeted gap fill)
4. Budget: 15 additional tool calls
5. If still zero after targeted gather → mark as [UNANSWERABLE] and proceed

**Example:**
```
Q3: "What is the pricing model for Competitor X's enterprise tier?"
Evidence items: 0

Escalation L1 → Generate queries:
  - "[Competitor X] enterprise pricing"
  - "[Competitor X] pricing plans"
  - site:[competitor.com] pricing
Budget: 10 calls for Q3 specifically
```

---

### Escalation Level 02: Low Confidence on Critical Question

**Trigger:** PRIMARY sub-question confidence < 0.60 after evidence pipeline.

**Response:**
1. Generate 5 additional targeted queries for that sub-question
2. Prioritize: primary sources, practitioner evidence, official documentation
3. Run adversarial queries to understand why confidence is low (conflicting signals?)
4. Maximum 2 escalation cycles on same sub-question
5. After 2 cycles: accept with [LOW CONFIDENCE] flag + explanation

**Confidence escalation tracker:**
```json
{
  "sub_question": "Q2",
  "initial_confidence": 0.48,
  "escalation_1": {
    "queries_added": 5,
    "items_added": 8,
    "confidence_after": 0.62,
    "escalation_warranted": false
  }
}
```

---

### Escalation Level 03: Contradiction Overload

**Trigger:** > 30% of PRIMARY claims have unresolved factual contradictions (Type E).

**Response:**
1. Focus next investigation iteration on tiebreaker evidence only
2. Queries designed specifically to resolve the contradictions (not general gathering)
3. Budget: 20 calls per unresolved contradiction (max 3 contradictions = 60 calls)
4. After 1 escalation cycle: if still unresolved, accept as [CONTESTED CLAIM]

**Tiebreaker query generation:**
```
For contradiction: "Claim A" vs. "Claim B"
  Tiebreaker queries:
    1. Primary source for Claim A (fetch the original)
    2. Primary source for Claim B (fetch the original)
    3. Third independent source on same specific fact
    4. Expert opinion on why sources might disagree
```

---

### Escalation Level 04: Overall Confidence Too Low

**Trigger:** Investigation confidence < 0.55 after full synthesis pass.

**Response:**
1. Audit evidence distribution: which sub-questions are thin?
2. Audit source types: is all evidence from one source type?
3. Audit query quality: were adversarial queries run?
4. Generate evidence quality improvement plan

**Evidence quality improvement plan:**
```
Issue: Confidence 0.49 — below threshold

Analysis:
  Q1: 0.82 — sufficient
  Q2: 0.71 — sufficient
  Q3: 0.31 — critical gap ← root cause

Q3 evidence audit:
  Items: 3
  Source types: 1 (web search only)
  Primary sources: 0
  Adversarial queries: 0 ← missing

Improvement plan:
  Action 1: Fetch primary source directly (not via search)
  Action 2: Run 3 adversarial queries for Q3
  Action 3: Search for practitioner evidence on Q3
  Budget: 15 additional calls
  Expected confidence gain: +0.20 to +0.35
```

---

### Escalation Level 05: Strategic Synthesis Unsupported

**Trigger:** Strategic synthesis cannot produce a recommendation because key facts are unknown.

**Response:**
1. Identify the specific unknowns blocking recommendation
2. Assess: are these unknowns resolvable with more research, or are they fundamentally unknowable from public sources?
3. If resolvable: escalate for targeted evidence gathering
4. If not resolvable: deliver with explicit "DECISION REQUIRES" section listing what must be resolved before deciding

**Delivery with explicit gaps format:**
```markdown
## Recommendation Blockers

This investigation cannot produce a confident recommendation because the following critical questions remain unanswered:

**BLOCKER 01: [Description]**
- Why it blocks: [explanation]
- How to resolve: [specific research action or human investigation]
- What can be decided without resolving it: [what remains actionable]

**BLOCKER 02: [Description]**
- ...

**Partial recommendation (conditional):**
Given what we know, IF [assumption A] is true, THEN [recommendation]. This should be verified before committing.
```

---

## Escalation Cycle Limits

To prevent infinite loops:

| Escalation Type | Max Cycles | After Max |
|-----------------|-----------|-----------|
| L01: Missing coverage | 1 | Mark [UNANSWERABLE] |
| L02: Low confidence | 2 | Accept with [LOW CONFIDENCE] |
| L03: Contradictions | 1 per contradiction | Mark [CONTESTED] |
| L04: Overall too low | 1 | Deliver with gaps explicit |
| L05: Strategy blocked | 1 | Deliver with blockers |

Each cycle uses additional tool budget. After max cycles: always deliver (don't halt).

---

## Escalation Log

Every escalation decision is logged:

```json
{
  "escalation_id": "esc-[uuid]",
  "investigation_id": "[id]",
  "timestamp": "[ISO-8601]",
  "level": 2,
  "trigger": "Q3 confidence 0.48 < threshold 0.60",
  "cycle": 1,
  "action": "targeted_evidence_gathering",
  "queries_generated": 5,
  "tool_budget_used": 15,
  "result": {
    "confidence_before": 0.48,
    "confidence_after": 0.67,
    "items_added": 9,
    "resolved": true
  }
}
```

---

## Non-Escalation Decisions

Not everything warrants escalation:

**Do NOT escalate for:**
- SECONDARY sub-questions with low confidence (flag but proceed)
- Minority views or fringe claims
- Historical facts where recency doesn't matter
- Context claims (not primary evidence)
- Low-stakes sub-questions in a shallow investigation

**Accept and flag instead:**
```
[LOW CONFIDENCE: Q3] — Evidence is thin (3 items, 1 source type). Use with caution.
[SINGLE SOURCE: Q5] — This claim rests on one source. Corroboration recommended.
[CONTESTED: Q4] — Sources disagree on this claim. Decision-maker should investigate further.
[UNANSWERABLE] — No evidence found after targeted gathering. This question could not be answered from public sources.
```

---

## Integration

**Called by:**
- `intelligence-pipelines/evidence-pipeline.md` → after processing (coverage gap check)
- `intelligence-pipelines/synthesis-pipeline.md` → after confidence scoring (confidence check)
- `research-intelligence/orchestrator.md` → orchestrator decision gate

**Can trigger:**
- Return to `evidence-systems/evidence-gatherer.md` (targeted additional gathering)
- Proceed to `intelligence-pipelines/synthesis-pipeline.md` (sufficient evidence)
- Proceed to `intelligence-pipelines/reporting-pipeline.md` (deliver with gaps)
