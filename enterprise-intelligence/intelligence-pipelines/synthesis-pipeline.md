# Synthesis Pipeline

**System ID:** `synthesis-pipeline`
**Role:** Orchestrates the full synthesis chain from processed evidence corpus to strategic brief
**Position:** After evidence pipeline, before reporting pipeline

---

## Purpose

The Synthesis Pipeline is the intelligence transformation layer. It takes processed, validated, scored evidence and runs it through the full synthesis chain — producing the key findings, insights, and strategic implications that constitute actionable intelligence.

This pipeline orchestrates synthesis-systems in the correct sequence with appropriate gating between stages.

---

## Pipeline Architecture

```
PROCESSED EVIDENCE CORPUS
         │
         ▼
STAGE 01: Evidence Synthesis
  evidence-synthesizer.md
  → synthesis summary, claim registry, contradiction map
         │
         ▼
STAGE 02: Contradiction Resolution
  contradiction-reconciler.md
  → reconciled claims registry, resolution log
         │
         ▼
STAGE 03: Confidence Validation
  confidence-scorer.md (aggregate pass)
  → final confidence scores per claim and sub-question
         │
         ▼
STAGE 04: Insight Extraction
  insight-extractor.md
  → ranked insight set
         │
         ▼
STAGE 05: Strategic Synthesis [CONDITIONAL]
  strategic-synthesis.md (if mandate requires recommendations)
  → strategic brief with options, recommendation, risk register
         │
         ▼
SYNTHESIS OUTPUTS (ready for reporting pipeline)
```

---

## Stage Definitions

### STAGE 01: Evidence Synthesis

**System:** `synthesis-systems/evidence-synthesizer.md`
**Input:** `wiki/intelligence/corpus/[id]-processed.jsonl`
**Output:**
- `synthesis-summary-[id].md`
- `claim-registry-[id].json`
- `contradiction-map-[id].json`

**Gate criteria:**
- [ ] All evidence items processed (none skipped)
- [ ] All sub-questions have synthesis section (even if empty with explanation)
- [ ] Contradiction map populated (even if zero contradictions)
- [ ] Synthesis summary format correct (all sections present)
- [ ] No fabricated claims (synthesis only uses evidence that exists in corpus)

**On failure:**
1. First failure: retry with evidence organized by sub-question
2. Second failure: run per-sub-question synthesis (smaller batches)
3. Third failure: flag as [SYNTHESIS FAILURE], escalate to orchestrator

**Token budget:** Synthesis stage typically consumes 20-30% of context budget. If context is tight, trigger micro-compaction before synthesizing.

---

### STAGE 02: Contradiction Resolution

**System:** `synthesis-systems/contradiction-reconciler.md`
**Input:**
- `contradiction-map-[id].json`
- `claim-registry-[id].json`
- `intelligence-memory/source-quality.jsonl`

**Output:**
- `reconciled-claims-[id].json`
- `contradiction-resolution-log-[id].md`

**Gate criteria:**
- [ ] All contradictions classified (Type A–F)
- [ ] Resolution documented for each contradiction
- [ ] Unresolved contradictions flagged with decision implications
- [ ] Minority views preserved (not discarded)
- [ ] Confidence adjustments applied

**Escalation:** If > 30% of PRIMARY claims have unresolved contradictions → escalate to orchestrator with recommendation to gather more evidence.

---

### STAGE 03: Confidence Validation

**System:** `evidence-systems/confidence-scorer.md` (aggregate pass)
**Input:**
- `reconciled-claims-[id].json`
- `intelligence-memory/source-quality.jsonl`

**Output:**
- Updated confidence scores on all claims
- Per-sub-question confidence scores
- Investigation-level confidence score

**Gate criteria:**
- [ ] All claims scored
- [ ] Investigation confidence calculated
- [ ] Low-confidence sub-questions flagged
- [ ] Escalation decision made

**Escalation decision:**
```
FOR EACH sub-question Q:
  IF Q.is_primary AND Q.confidence < 0.60:
    IF escalation_cycles < 2:
      ESCALATE → request additional evidence gathering for Q
    ELSE:
      ACCEPT with [LOW CONFIDENCE] flag, document gap
```

---

### STAGE 04: Insight Extraction

**System:** `synthesis-systems/insight-extractor.md`
**Input:**
- `reconciled-claims-[id].json` (with confidence scores)
- `synthesis-summary-[id].md`

**Output:**
- `insight-set-[id].json`
- `insight-set-[id].md` (human-readable)

**Gate criteria:**
- [ ] Minimum 3 validated insights (confidence ≥ 0.60)
- [ ] Each insight traces to ≥ 2 evidence claims
- [ ] Each insight has stated implication and falsification
- [ ] Insights ranked by composite score
- [ ] Surprise test applied
- [ ] Insights clearly separated from observations

**If < 3 insights produced:**
1. Check if evidence corpus is thin (< 20 items) → escalate for more gathering
2. Check if all findings are observations not insights → manual insight extraction required
3. Accept with note: [INSIGHT COUNT BELOW MINIMUM — evidence may be insufficient]

---

### STAGE 05: Strategic Synthesis [CONDITIONAL]

**System:** `synthesis-systems/strategic-synthesis.md`
**Condition:** Include if mandate requires strategic recommendations

**Include when:**
- PM decision: what feature to build or prioritize
- Market entry: whether and how to enter a market
- Competitive response: how to respond to a competitive threat
- Architecture decision: which technology or pattern to adopt
- Strategic planning: horizon scanning with options

**Skip when:**
- Factual question: what is true, not what to do
- Data gathering: collecting evidence for a human decision-maker
- Technical research: technical facts, not strategic choice
- Background context: establishing domain context only

**Input:**
- `insight-set-[id].json`
- Context of the original mandate (decision type, stakeholders, constraints)

**Output:**
- `strategic-brief-[id].md`
  - Situation assessment
  - Force field analysis
  - Strategic options (3-5)
  - Evaluation matrix
  - Primary recommendation
  - Risk register
  - Next steps

**Gate criteria:**
- [ ] Recommendations trace to insights (no ungrounded recommendations)
- [ ] 3-5 genuinely distinct options
- [ ] "Do nothing" considered
- [ ] Assumptions explicit
- [ ] Risk register complete
- [ ] Next steps actionable

---

## Synthesis Pipeline State Management

The pipeline maintains state between stages:

```json
{
  "pipeline_id": "sp-[investigation-id]",
  "status": "in_progress | complete | failed",
  "current_stage": 3,
  "stages_complete": ["evidence_synthesis", "contradiction_resolution"],
  "stage_outputs": {
    "synthesis_summary": "[path]",
    "claim_registry": "[path]",
    "contradiction_map": "[path]",
    "reconciled_claims": "[path]",
    "resolution_log": "[path]"
  },
  "escalations": [
    {
      "stage": 3,
      "reason": "Q3 confidence below threshold",
      "action": "additional_gathering",
      "resolved": false
    }
  ],
  "gate_failures": [],
  "investigation_confidence": 0.76
}
```

---

## Context Compaction Integration

If context fills during synthesis:

1. Identify which synthesis stage is in progress
2. Store the current stage's completed output to disk
3. Compact: replace raw evidence with synthesis summary, preserve last 5 items
4. Continue synthesis from current stage with compacted context
5. Log compaction in pipeline state

Compaction never occurs *between* stages — only *within* a stage (while processing large corpora).

---

## Output Files

```
synthesis-summary-[id].md              ← evidence synthesis output
claim-registry-[id].json               ← claim confidence registry
contradiction-map-[id].json            ← contradiction structure
reconciled-claims-[id].json            ← post-reconciliation claims
contradiction-resolution-log-[id].md   ← resolution decisions
insight-set-[id].json                  ← structured insights
insight-set-[id].md                    ← human-readable insights
strategic-brief-[id].md               ← strategic synthesis (if included)
synthesis-pipeline-state.json          ← pipeline execution state
```

---

## Integration

**Called by:** `research-intelligence/orchestrator.md` (Phases 03-04)
**Reads from:** Evidence pipeline outputs
**Feeds:** `intelligence-pipelines/reporting-pipeline.md`
**Escalates to:** Orchestrator (evidence gap escalation, synthesis failure)
