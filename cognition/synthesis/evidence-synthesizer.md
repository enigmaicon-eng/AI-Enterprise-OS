# Evidence Synthesizer

**System ID:** `evidence-synthesizer`
**Role:** Primary synthesis engine — transforms raw evidence corpora into structured, actionable intelligence
**Trigger:** Called after evidence gathering phase completes OR when evidence corpus exceeds context threshold

---

## Purpose

The Evidence Synthesizer is the core synthesis pipeline. It receives raw evidence from the gathering phase and produces:
1. A unified evidence base (deduplicated, cross-referenced)
2. Per-claim confidence scores
3. Key findings ranked by evidence strength
4. Contradiction map
5. Synthesis summary suitable for compaction

This is the Dexter `compact.ts` analog — LLM-powered summarization of tool results into structured summaries — expressed as a document-driven synthesis pipeline.

---

## Input

```
evidence-corpus-[id].jsonl     ← raw evidence from evidence-gatherer
source-registry-[id].json      ← validated sources with credibility scores
confidence-scores-[id].json    ← per-source confidence from confidence-scorer
```

---

## Synthesis Stages

### Stage 01: Deduplication

Remove near-duplicate evidence items:
- Same claim from multiple sources → merge into single item with multi-source citation
- Paraphrased versions of same fact → keep most specific, note paraphrasing
- Outdated versions of same fact → keep most recent, archive prior

Output: `deduplicated-corpus-[id].jsonl`

**Deduplication threshold:** Items with >85% semantic overlap on the claim field are candidates for merging.

### Stage 02: Claim Extraction

For each evidence item, extract the core claim in structured form:

```json
{
  "claim_id": "cl-[uuid]",
  "claim": "[the specific factual assertion]",
  "claim_type": "[fact | trend | estimate | opinion | inference]",
  "sub_question": "[which research sub-question this addresses]",
  "evidence_items": ["ev-[id1]", "ev-[id2]"],
  "source_count": 3,
  "source_types": ["web", "document", "memory"],
  "strongest_source": "ev-[id]",
  "confidence": 0.82,
  "contradicted_by": ["cl-[id]"],
  "corroborated_by": ["cl-[id]"]
}
```

### Stage 03: Cross-Reference Pass

For each claim:
1. Check if any other claim directly contradicts it
2. Check if any other claim corroborates or strengthens it
3. Build the contradiction map and corroboration graph

**Contradiction criteria:**
- Two claims make incompatible assertions about the same fact
- Timestamp difference may explain apparent contradiction → note as [TEMPORAL CONFLICT]
- Source credibility difference may explain → flag lower-credibility source

### Stage 04: Sub-Question Synthesis

Group claims by sub-question and synthesize each group:

```
Sub-question: [Q]
Evidence strength: [H/M/L] (based on source count + confidence)
Key claims: [ranked by confidence]
  1. [Claim] — Confidence: 0.91 — Sources: 4
  2. [Claim] — Confidence: 0.73 — Sources: 2
  3. [Claim] — Confidence: 0.55 — Sources: 1 [THIN EVIDENCE]
Contradictions within this sub-question: [list]
Answer quality: [Fully answered | Partially answered | Unanswered]
```

### Stage 05: Cross-Domain Synthesis

After per-sub-question synthesis, identify:
- **Convergent signals:** Evidence from multiple domains pointing to same conclusion
- **Divergent signals:** Evidence from different domains pointing in different directions
- **Emergent patterns:** Patterns not visible in any single sub-question's evidence
- **Amplifiers:** Claims in one domain that strengthen claims in another

### Stage 06: Synthesis Summary Generation

Produce the compaction summary — the primary output of this stage:

```
SYNTHESIS SUMMARY — [investigation-id] — [timestamp]
══════════════════════════════════════════════════════

QUERY: [The original research mandate]

EVIDENCE PROCESSED:
  Total items: [N]
  Unique claims: [N]
  Sources: [N] across [types]
  Contradictions found: [N]

PER-QUESTION ANSWERS:
  Q1: [Sub-question] → [Answer] [Confidence: H/M/L]
  Q2: [Sub-question] → [Answer] [Confidence: H/M/L]
  ...

KEY FINDINGS (ranked by evidence strength):
  1. [Finding] — Evidence: [N claims, M sources] — Confidence: [0.0–1.0]
  2. [Finding] — Evidence: [N claims, M sources] — Confidence: [0.0–1.0]
  3. [Finding] — Evidence: [N claims, M sources] — Confidence: [0.0–1.0]

CONTRADICTIONS:
  - [Claim A] conflicts with [Claim B]
    Resolution: [UNRESOLVED | TEMPORAL | CREDIBILITY]

CONVERGENT SIGNALS:
  [Patterns appearing across multiple domains or sub-questions]

EVIDENCE GAPS:
  - Q[N]: [Sub-question] → [Evidence insufficient / conflicting / absent]

SYNTHESIS CONFIDENCE: [0.0–1.0]
NEXT STEP: [Deliver | Contradiction-reconciler | Gap investigation]
```

---

## Synthesis Quality Criteria

A synthesis passes quality gate when:

- [ ] All sub-questions have at least one claim mapped to them
- [ ] Every claim has at least one evidence source cited
- [ ] All contradictions are identified (not suppressed)
- [ ] No fabricated claims (synthesis cannot invent evidence)
- [ ] Evidence gaps are explicitly documented
- [ ] Confidence scores are justified by source count and quality

A synthesis FAILS quality gate when:
- Any claim lacks a source (hallucination risk)
- Contradictions are resolved without documentation
- Confidence scores are assigned without evidence basis
- Sub-questions with zero evidence are marked as "answered"

---

## Context Compaction Integration

When synthesizing for context compaction (token budget management):

1. Produce synthesis summary (as above)
2. Store full evidence corpus to `wiki/intelligence/corpus/[id].jsonl`
3. Inject synthesis summary into active context in place of raw evidence
4. Token savings: typically 60-80% reduction from raw to synthesized
5. Preserve: most recent 5 raw evidence items (recency signal) + all synthesis summaries

---

## Failure Protocol

If synthesis fails or produces low-quality output:

1. **First failure:** Retry with re-organized evidence (group by sub-question first)
2. **Second failure:** Reduce scope — synthesize one sub-question at a time
3. **Third failure:** Flag as [SYNTHESIS FAILURE], deliver raw evidence with manual synthesis needed note

Track consecutive failures — after 3, flag to orchestrator for human review.

---

## Output

```
synthesis-summary-[id].md          ← primary synthesis output
claim-registry-[id].json           ← structured claims with confidence
contradiction-map-[id].json        ← contradictions by claim
compaction-summary-[id].md         ← context-optimized summary for injection
```

These feed into:
- `synthesis-systems/contradiction-reconciler.md` → resolve flagged contradictions
- `synthesis-systems/insight-extractor.md` → extract key insights from synthesis
- `intelligence-pipelines/reporting-pipeline.md` → final report generation
